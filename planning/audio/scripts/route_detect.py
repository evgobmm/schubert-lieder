# маршрут исполнения по декоду: ДП по вокальным фразам; каждая фраза получает непрерывный отрезок слов текста;
# следующий отрезок либо продолжает предыдущий, либо начинается с начала любой ранее спетой строки (повтор).
import json, sys, numpy as np, soundfile as sf, torch
from rapidfuzz.distance import Levenshtein as Lev
SONG,WAV,EM_DE,EM_MMS,OUT=sys.argv[1:6]
song=json.load(open(SONG)); lines=[(i,j,l) for i,st in enumerate(song['stanzas']) for j,l in enumerate(st['lines_de'])]
words=[];owner=[];linestart=[]
for idx,(i,j,l) in enumerate(lines):
    linestart.append(len(words))
    for w in l.split(): words.append(w); owner.append(idx)
N=len(words); FB={'ä':'a','ö':'o','ü':'u','ß':'ss'}
def load(p):
    d=torch.load(p); em=d['emission']; lab=list(d['labels'])[:em.shape[1]]; bl=d.get('blank',0); return em,lab,bl,{c:i for i,c in enumerate(lab)}
emD,labD,blD,dicD=load(EM_DE); emM,labM,blM,dicM=load(EM_MMS)
def normw(w,dic):
    o=''
    for c in w.lower():
        if c in dic and c!='|': o+=c
        elif c in FB: o+=''.join(ch for ch in FB[c] if ch in dic)
    return ''.join(ch for ch in o if ch.isalpha())
def dec(em,lab,bl,a,b):
    ids=em[int(a/0.02):int(b/0.02)].argmax(-1).tolist(); o='';prev=None
    for k in ids:
        if k!=prev and k!=bl and len(lab[k])==1 and lab[k].isalpha(): o+=lab[k]
        prev=k
    return o
# фразы по вокалу
x,_=sf.read(WAV,dtype='float32'); env=np.sqrt((x[:len(x)//160*160].reshape(-1,160)**2).mean(1)); n=len(env)
ref=np.percentile(env[env>np.percentile(env,50)],50); V=env/ref
v=np.convolve((V>0.25).astype(float),np.ones(5)/5,'same')>0.4; ph=[];i=0
while i<n:
    if v[i]:
        j=i
        while j<n and (v[j] or v[j:j+35].any()): j+=1
        if (j-i)/100>=0.4: ph.append((i/100,j/100))
        i=j
    else: i+=1
ph=[(a,b) for a,b in ph if len(dec(emD,labD,blD,a,b))>=3 or len(dec(emM,labM,blM,a,b))>=3]
D=[dec(emD,labD,blD,a,b) for a,b in ph]; WN=[normw(w,dicD) for w in words]; K=len(ph)
LS=set(linestart); WIN=45; INF=float('inf')
# состояние: конец отрезка e (слов спето до e в текущем «проходе» по тексту); начало следующего отрезка: e (продолжение) или начало строки <= e (повтор)
best=[[INF]*(N+1) for _ in range(K+1)]; back=[[None]*(N+1) for _ in range(K+1)]; best[0][0]=0.0
REP=2.5   # база штрафа за возврат (повтор)
SKIP=2.0  # база штрафа за прыжок вперёд
WREP=1.5  # база штрафа за короткий повтор слов
lineend={}
for idx in range(len(lines)):
    e=linestart[idx+1] if idx+1<len(lines) else N
    for w in range(linestart[idx],e): lineend[w]=e
LE=sorted(set(lineend.values()))
for k in range(1,K+1):
    dk=D[k-1]
    # g[i] = лучший предшественник для старта i
    g=[INF]*(N+1); ga=[None]*(N+1)
    for e in range(N+1):
        if best[k-1][e]==INF: continue
        if best[k-1][e]<g[e]: g[e]=best[k-1][e]; ga[e]=e                       # продолжение
        for s in linestart:
            dist=abs(owner[min(s,N-1)]-owner[max(min(e,N-1),0)])        # дальность прыжка в строках
            pen=(REP if s<=e else SKIP)+0.6*dist
            if s!=e and best[k-1][e]+pen<g[s]: g[s]=best[k-1][e]+pen; ga[s]=e   # повтор (назад) или прыжок вперёд к началу строки; дальний — дороже
        for s in range(max(0,e-6),e):                                    # короткий возврат на 1–6 слов: композиторский повтор нескольких слов
            if s in LS: continue
            pen=WREP+0.3*(e-s)
            if best[k-1][e]+pen<g[s]: g[s]=best[k-1][e]+pen; ga[s]=e
    for j in range(N+1):
        for i in range(max(0,j-WIN),j+1):
            if g[i]==INF: continue
            c=g[i]+(Lev.distance(dk,''.join(WN[i:j])) if i<j else 2*len(dk)+3)   # «пустая» фраза с буквами — дорого
            if c<best[k][j]: best[k][j]=c; back[k][j]=(i,ga[i],None,None)
        # повтор внутри фразы: первый отрезок до конца строки e1, затем с начала той же или предыдущей строки до j
        for e1 in range(max(1,j-WIN),j+1):
            ln=owner[e1-1]
            for s0 in sorted(set([linestart[ln]]+([linestart[ln-1]] if ln>0 else [])+list(range(max(0,e1-6),e1)))):
                if s0>=e1 or j<=s0 or j-s0>WIN: continue
                pen=REP if s0 in LS else WREP+0.3*(e1-s0)
                for i in range(max(0,e1-WIN),e1):
                    if g[i]==INF: continue
                    c=g[i]+pen+Lev.distance(dk,''.join(WN[i:e1]+WN[s0:j]))
                    if c<best[k][j]: best[k][j]=c; back[k][j]=(i,ga[i],e1,s0)
# конец: любой j, но недопетые слова текста штрафуем (пропуск строк)
end=min(range(N+1),key=lambda j: best[K][j]+ 4*((lineend.get(j,N) if j<N else N)-j))   # штраф — только за недопетый остаток строки
segs=[]; j=end
for k in range(K,0,-1):
    i,e,e1,s0=back[k][j]
    if e1 is None: segs.append((i,j))
    else: segs.append((s0,j)); segs.append((i,e1))
    j=e
segs=segs[::-1]
seq=[w for i,j in segs for w in range(i,j)]
# маршрут: проходы = непрерывные отрезки посещённых слов внутри одной строки; k — индексы слов в строке
passes=[]; cur=None
for w in seq:
    ln=owner[w]; kk=w-linestart[ln]
    if cur and cur['ln']==ln and cur['k'][-1]==kk-1: cur['k'].append(kk)
    else:
        cur={'ln':ln,'k':[kk]}; passes.append(cur)
# первое произнесение строки — всегда полное (частичным бывает только повтор, начинающийся не с первого слова)
for p in passes:
    if p['k'][0]==0: p['k']=list(range(len(lines[p['ln']][2].split())))
# два соседних прохода одной строки, где второй — продолжение первого (стык слов), сливаем
merged=[]
for p in passes:
    if merged and merged[-1]['ln']==p['ln'] and p['k'][0]==merged[-1]['k'][-1]+1: merged[-1]['k']+=p['k']
    else: merged.append(p)
passes=merged
route=[{"s":lines[p['ln']][0],"l":lines[p['ln']][1],"k":p['k']} for p in passes]
partial=sum(1 for p,r in zip(passes,route) if len(r['k'])<len(lines[p['ln']][2].split()))
cost=(best[K][end])/max(1,sum(len(d) for d in D))
json.dump({"route":route,"cost_per_letter":round(cost,3),"phrases":len(ph)},open(OUT,'w'),ensure_ascii=False)
print(f"фраз {K}, стоимость {cost:.2f}/букву, проходов {len(route)} (частичных {partial}): "+" ".join(f"{r['s']}:{r['l']}"+("" if len(r['k'])==len(lines[[ (i,j) for i,j,_ in lines].index((r['s'],r['l']))][2].split()) else "["+",".join(map(str,r['k']))+"]") for r in route))
