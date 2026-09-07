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
REP=4.0   # штраф за возврат (повтор)
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
            if s<=e and best[k-1][e]+REP<g[s]: g[s]=best[k-1][e]+REP; ga[s]=e   # повтор с начала строки
    for j in range(N+1):
        for i in range(max(0,j-WIN),j+1):
            if g[i]==INF: continue
            c=g[i]+(Lev.distance(dk,''.join(WN[i:j])) if i<j else 2*len(dk)+3)   # «пустая» фраза с буквами — дорого
            if c<best[k][j]: best[k][j]=c; back[k][j]=(i,ga[i],None,None)
        # повтор внутри фразы: первый отрезок до конца строки e1, затем с начала той же или предыдущей строки до j
        for e1 in LE:
            if e1>j or e1<max(0,j-WIN): continue
            ln=owner[e1-1]
            for s0 in ([linestart[ln]]+([linestart[ln-1]] if ln>0 else [])):
                if s0>e1 or j<=s0 or j-s0>WIN: continue
                for i in range(max(0,e1-WIN),e1):
                    if g[i]==INF: continue
                    c=g[i]+REP+Lev.distance(dk,''.join(WN[i:e1]+WN[s0:j]))
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
# маршрут: последовательность строк по посещённым словам
route=[];cur=None
for w in seq:
    ln=owner[w]
    if ln!=cur or w==linestart[ln]: route.append(lines[ln][:2]); cur=ln
route=[list(r) for r in route]   # подряд идущие одинаковые строки — настоящие повторы, не склеивать
cost=(best[K][end])/max(1,sum(len(d) for d in D))
json.dump({"route":route,"cost_per_letter":round(cost,3),"phrases":len(ph),"segments":[[i,j] for i,j in segs]},open(OUT,'w'),ensure_ascii=False)
print(f"фраз {K}, стоимость {cost:.2f}/букву, проходов {len(route)}: "+" ".join(f"{s}:{l}" for s,l in route))
