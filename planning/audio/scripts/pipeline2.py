# конвейер с шаблоном: две CTC-эмиссии + перенесённая принятая разметка -> ДП по трём кандидатам -> файл сайта
import json, sys, numpy as np, soundfile as sf, torch
from torchaudio.functional import forced_align, merge_tokens
from collections import Counter
SR=16000;HOP=160
VID,WAV,EM_A,EM_B,MAP=sys.argv[1:6]; NOSITE='--no-site' in sys.argv
ROOT='/workspaces/schubert-lieder'
words=json.load(open('words.json')); N=len(words)
acc=json.load(open(f'{ROOT}/app/src/data/timings/d118-1F4CHXbX8gc.json'))
accflat=[iv for p in acc['route'] for iv in p['w']]; assert len(accflat)==N
mp=json.load(open(MAP)); f=lambda t: float(np.interp(t,mp['tmpl_t'],mp['tgt_t']))
T_s=[f(a) for a,b in accflat]; T_e=[f(b) for a,b in accflat]
x,_=sf.read(WAV,dtype='float32'); n=len(x)//HOP
env=np.sqrt((x[:n*HOP].reshape(n,HOP)**2).mean(1))
ref=float(np.median([env[int(a*100):max(int(b*100),int(a*100)+1)].mean() for a,b in zip(T_s,T_e) if b-a>0.2]))
V=env/ref
def m(a,b):
    i,j=int(a*100),int(b*100); return float(V[max(i,0):max(j,i+1)].mean())
# атаки
W=15; ons=[]
for i in range(W,n-W):
    a=V[i-W:i].mean()+0.05; b=V[i:i+W].mean()+0.05; r=b/a
    if r>1.8 and V[i:i+W].mean()>0.35: ons.append((i/100,r))
ons=[o for k,o in enumerate(ons) if k==0 or o[0]-ons[k-1][0]>0.12 or o[1]>ons[k-1][1]]
ons=[o for k,o in enumerate(ons) if k==len(ons)-1 or ons[k+1][0]-o[0]>0.12 or o[1]>=ons[k+1][1]]
allon=[t for t,_ in ons]; strong=[t for t,r in ons if r>=2.5]
def near(t,lst,tol): return min((abs(t-o) for o in lst),default=9)<=tol
def nearest(t,lst,tol):
    c=[o for o in lst if abs(o-t)<=tol]; return min(c,key=lambda o:abs(o-t)) if c else None
# фразы
v=np.convolve((V>0.25).astype(float),np.ones(5)/5,'same')>0.4
ph=[];i=0
while i<n:
    if v[i]:
        j=i
        while j<n and (v[j] or v[j:j+35].any()): j+=1
        if (j-i)/100>=0.15: ph.append((i/100,j/100))
        i=j
    else: i+=1
def phrase_of(t):
    for k,(a,b) in enumerate(ph):
        if a-0.05<=t<b: return k
    nx=[k for k,(a,b) in enumerate(ph) if a>t]; return nx[0] if nx else len(ph)-1
assign=list(np.maximum.accumulate([phrase_of(t) for t in T_s])); cnt=Counter(assign)
# оконное выравнивание
FB={'ä':'a','ö':'o','ü':'u','ß':'ss','í':'i','ó':'o'}
def windowed(empt):
    d=torch.load(empt); em=d['emission']; labels=list(d['labels'])[:em.shape[1]]; blank=d.get('blank',0)
    dic={c:i for i,c in enumerate(labels)}
    def norm(w):
        w=w.lower().replace('’',"'"); o=''
        for c in w:
            if c in dic and c!='|': o+=c
            elif c in FB: o+=''.join(ch for ch in FB[c] if ch in dic)
        return ''.join(ch for ch in o if ch.isalpha() or ch=="'")
    res=[None]*N
    for k in sorted(cnt):
        idxs=[i for i,a in enumerate(assign) if a==k]
        t0=max(0.0,ph[k][0]-0.25); t1=min(n/100,ph[k][1]+0.25)
        prev=[ph[a][1] for a in cnt if a<k]; nx=[ph[a][0] for a in cnt if a>k]
        if prev: t0=max(t0,max(prev)-0.05)
        if nx: t1=min(t1,min(nx)+0.05)
        toks=[];lens=[]
        for i in idxs:
            t=[dic[c] for c in norm(words[i]) if c in dic]; toks+=t; lens.append((i,len(t)))
        f0=int(t0/0.02); f1=min(em.shape[0],max(int(t1/0.02),f0+len(toks)+2))
        lp=torch.log_softmax(em[f0:f1],-1).unsqueeze(0)
        al,sc=forced_align(lp,torch.tensor([toks],dtype=torch.int32),blank=blank)
        sp=merge_tokens(al[0],sc[0].exp()); p=0
        for i,L in lens:
            s=sp[p:p+L]; p+=L
            res[i]={"start":round(t0+s[0].start*0.02,2),"end":round(t0+s[-1].end*0.02,2)}
    return res
WA=windowed(EM_A); WB=windowed(EM_B)
WT=[]
for k in range(N):
    t=T_s[k]; o=nearest(t,allon,0.2); s=o if o is not None else t
    WT.append({"start":round(s,2),"end":round(max(T_e[k],s),2)})
C=[WA,WB,WT]; PRIOR=[0.5,0.0,-0.3]
def unary(k,c):
    t=C[c][k]['start']; sc=PRIOR[c]+2*near(t,strong,0.2)-4*max(0.0,abs(t-T_s[k])-0.15)
    if m(t,t+0.10)<0.3: sc-=1.0
    if k==0 or assign[k-1]!=assign[k]:
        lead=m(ph[assign[k]][0],t)*(t-ph[assign[k]][0]) if t>ph[assign[k]][0] else 0
        if lead>0.4: sc-=2.0
    return sc
NEG=-1e9; dp=[[NEG]*3 for _ in range(N)]; bp=[[None]*3 for _ in range(N)]
for c in range(3): dp[0][c]=unary(0,c)
for k in range(1,N):
    for c in range(3):
        t=C[c][k]['start']; u=unary(k,c)
        for pc in range(3):
            if dp[k-1][pc]>NEG and t>=C[pc][k-1]['start']+0.02 and dp[k-1][pc]+u>dp[k][c]:
                dp[k][c]=dp[k-1][pc]+u; bp[k][c]=pc
if max(dp[N-1])==NEG: raise SystemExit("ДП: нет допустимого пути")
c=int(np.argmax(dp[N-1])); choice=[0]*N
for k in range(N-1,-1,-1):
    choice[k]=c
    if k>0: c=bp[k][c]
ts=[dict(C[choice[k]][k]) for k in range(N)]; src=['MMS','DE','шаблон']
raw_end=[r['end'] for r in ts]
log=[]
def closer(s_new,s_old,k): return abs(s_new-T_s[k])<=max(0.25,abs(s_old-T_s[k]))   # правка не уводит от шаблона
for k,r in enumerate(ts):
    nxt=ts[k+1]['start'] if k+1<N else r['end']+0.5
    prv_end=raw_end[k-1] if k else 0.0
    s=r['start']
    if m(s,s+0.05)<0.25:
        j=int(s*100); lim=int((nxt-0.02)*100)
        while j<lim and V[j:j+3].max()<0.25: j+=1
        if j/100-s>0.08 and closer(j/100,s,k): log.append(('тишина→голос',k,s,j/100)); s=round(j/100,2)
    if m(s,s+0.10)<0.3 and not near(s,allon,0.08):
        cand=[t for t in allon if s+0.05<t<=min(s+0.6,nxt-0.05)]
        if cand:
            o=max(cand,key=lambda t:m(t,t+0.15)/(m(t-0.15,t)+0.05))
            if m(s,s+0.10)<0.5*m(o,o+0.15) and closer(o,s,k): log.append(('провал→атака',k,s,o)); s=o
    if m(s-0.3,s)>0.6 and m(s-0.3,s)>2*m(s,s+0.3):
        cand=[t for t in strong if prv_end-0.05<=t<s-0.15]
        if cand and closer(max(cand),s,k): o=max(cand); log.append(('спад→атака назад',k,s,o)); s=o
    r['start']=round(s,2); r['end']=max(r['end'],r['start'])
for k in range(1,N):
    if ts[k]['start']<ts[k-1]['start']+0.02: ts[k]['start']=round(ts[k-1]['start']+0.02,2)
    if ts[k]['end']<ts[k]['start']: ts[k]['end']=ts[k]['start']
for k,r in enumerate(ts):
    nxt=ts[k+1]['start'] if k+1<N else r['end']+0.5
    pe=ph[assign[k]][1]+0.15
    b=r['end']; j=int(b*100); end=b; sil=0; limit=int(min(nxt,pe,b+8)*100)
    while j<min(limit,n):
        if V[j]<0.20:
            sil+=0.01
            if sil>=0.12: break
        else: sil=0; end=(j+1)/100
        j+=1
    r['end']=round(min(max(end,b),nxt),2)
for k in range(N-1):
    if ts[k]['end']>ts[k+1]['start']: ts[k]['end']=ts[k+1]['start']
# --- QA
li=json.load(open('lineidx.json'))
dev=[abs(ts[k]['start']-T_s[k]) for k in range(N)]
disAB=[abs(WA[k]['start']-WB[k]['start'])>0.3 for k in range(N)]
flat=[[r['start'],r['end']] for r in ts]
bad=sum(1 for a,b in flat if b<a); mono=sum(1 for k in range(1,N) if flat[k][0]<flat[k-1][0]); ovl=sum(1 for k in range(1,N) if flat[k][0]<flat[k-1][1]-1e-9)
lg=sum(1 for k in range(N-1) if flat[k+1][0]-flat[k][1]>0.35 and m(flat[k][1],flat[k+1][0])>0.45)
dur=[b-a for a,b in flat]
queue=[k for k in range(N) if dev[k]>0.3 or (disAB[k] and not near(ts[k]['start'],allon,0.15)) or dur[k]<0.08 or dur[k]>4.5]
print(f"[{VID}] фраз {len(ph)} | источники: {dict(Counter(src[c] for c in choice))} | правок начал {len(log)} | DTW shift {mp['shift']} cost {mp['cost']:.4f}")
print(f"   целостность: вывернутых {bad}, порядка {mono}, наложений {ovl}; пауз с голосом {lg}; длительность min {min(dur):.2f} медиана {sorted(dur)[N//2]:.2f} max {max(dur):.2f}")
print(f"   отклонение от шаблона: медиана {np.median(dev):.2f} с, >0.3 с у {sum(1 for d in dev if d>0.3)} слов; движки расходятся >0.3 с у {sum(disAB)} слов")
print(f"   ОЧЕРЕДЬ ПРОСЛУШИВАНИЯ: {len(queue)} слов")
for k in queue: print(f"      {li[k]:6s} {words[k]:12s} {ts[k]['start']:7.2f}  [{src[choice[k]]}]  шаблон {T_s[k]:7.2f}  Δ {ts[k]['start']-T_s[k]:+.2f}")
json.dump([{"i":k,"w":words[k],"start":ts[k]['start'],"end":ts[k]['end'],"src":src[choice[k]],"tmpl":round(T_s[k],2)} for k in range(N)],open(f'ts_{VID}.json','w'),ensure_ascii=False,indent=0)
# --- файл сайта
if NOSITE: raise SystemExit(0)
perf=[p for p in json.load(open(f'{ROOT}/app/src/data/performances.json'))['118'] if p['videoId']==VID][0]
out=json.loads(json.dumps(acc)); out['videoId']=VID; out['performance']=f"{perf['name']}, {perf['year']}"; out['verified_by_ear']=False
out['method']=("demucs htdemucs vocals -> MMS_FA + wav2vec2-xlsr-53-german в окнах вокальных фраз -> принятая разметка Сэмпсон перенесена DTW по хроме "
 f"(транспозиция {mp['shift']}, стоимость {mp['cost']:.4f}) как третий кандидат и якорь -> ДП по слову с жёстким порядком -> начала к атакам, концы до смолкания голоса")
out['note']=f"Маршрут ссылается на опубликованный текст (повторы Шуберта в строфах 10–11). Очередь прослушивания: {len(queue)} слов — см. planning/audio (пока в scratchpad)."
k=0
for p in out['route']:
    for q in range(len(p['w'])): p['w'][q]=flat[k]; k+=1
json.dump(out,open(f'{ROOT}/app/src/data/timings/d118-{VID}.json','w'),ensure_ascii=False,indent=1)
print(f"   записан app/src/data/timings/d118-{VID}.json")
