import json, sys, numpy as np, soundfile as sf, torch
from torchaudio.functional import forced_align, merge_tokens
from collections import Counter
SR=16000;HOP=160
WAV,EM_A,EM_B,RAW_A,RAW_B,WORDS,OUT=sys.argv[1:8]
x,_=sf.read(WAV,dtype='float32'); n=len(x)//HOP
env=np.sqrt((x[:n*HOP].reshape(n,HOP)**2).mean(1))
A=json.load(open(RAW_A)); B=json.load(open(RAW_B)); words=json.load(open(WORDS))
def _byidx(R):   # ВЫРОВНЯТЬ ДЛИНУ: по одной записи на слово; пропущенные (тире) — нулевой интервал у конца предыдущего
    m={r['i']:r for r in R}; out=[]
    for k in range(len(words)):
        if k in m: out.append(m[k])
        else:
            e=out[-1]['end'] if out else 0.0; out.append({"i":k,"w":words[k],"start":e,"end":e,"score":0.0})
    return out
A=_byidx(A); B=_byidx(B)
ref=float(np.median([env[int(r['start']*100):max(int(r['end']*100),int(r['start']*100)+1)].mean() for r in A if r['end']-r['start']>0.2]))
V=env/ref
def m(a,b):
    i,j=int(a*100),int(b*100); return float(V[max(i,0):max(j,i+1)].mean())
# --- атаки голоса
W=15; ons=[]
for i in range(W,n-W):
    a=V[i-W:i].mean()+0.05; b=V[i:i+W].mean()+0.05; r=b/a
    if r>1.8 and V[i:i+W].mean()>0.35:
        ons.append((i/100,r))
ons=[o for k,o in enumerate(ons) if k==0 or o[0]-ons[k-1][0]>0.12 or o[1]>ons[k-1][1]]
ons=[o for k,o in enumerate(ons) if k==len(ons)-1 or ons[k+1][0]-o[0]>0.12 or o[1]>=ons[k+1][1]]
allon=[t for t,_ in ons]; strong=[t for t,r in ons if r>=2.5]
def near(t,lst,tol): return min((abs(t-o) for o in lst),default=9)<=tol
# --- фразы
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
# --- оценка кандидата начала
def score(t): return 2*near(t,strong,0.2)+1*(m(t,t+0.15)>=0.5)
# --- грубая привязка к фразам: по арбитрованным позициям
coarse=[]
for a,b in zip(A,B):
    s=a['start']
    if abs(a['start']-b['start'])>0.3 and score(b['start'])>score(a['start'])+0.5: s=b['start']
    coarse.append(s)
assign=list(np.maximum.accumulate([phrase_of(t) for t in coarse])); cnt=Counter(assign)
# --- точное выравнивание в окнах фраз
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
    res=[None]*len(words)
    for k in sorted(cnt):
        idxs=[i for i,a in enumerate(assign) if a==k]
        t0=max(0.0,ph[k][0]-0.25); t1=min(n/100,ph[k][1]+0.25)
        prev=[ph[a][1] for a in cnt if a<k]; nx=[ph[a][0] for a in cnt if a>k]
        if prev: t0=max(t0,max(prev)-0.05)
        if nx: t1=min(t1,min(nx)+0.05)
        toks=[];lens=[]
        for i in idxs:
            t=[dic[c] for c in norm(words[i]) if c in dic]; toks+=t; lens.append((i,len(t)))
        if not toks:   # СТРАХОВКА: фраза без букв
            for i,L in lens: res[i]={"start":round(t0,2),"end":round(t0,2)}
            continue
        f0=int(t0/0.02); f1=max(int(t1/0.02),f0+len(toks)+2)
        lp=torch.log_softmax(em[f0:f1],-1).unsqueeze(0)
        al,sc=forced_align(lp,torch.tensor([toks],dtype=torch.int32),blank=blank)
        sp=merge_tokens(al[0],sc[0].exp()); p=0
        for i,L in lens:
            if L==0:   # ПУСТЫЕ слова (тире)
                e=res[i-1]['end'] if i>0 and res[i-1] else round(t0,2); res[i]={"start":e,"end":e}; continue
            s=sp[p:p+L]; p+=L
            res[i]={"start":round(t0+s[0].start*0.02,2),"end":round(t0+s[-1].end*0.02,2)}
    return res
WA=windowed(EM_A); WB=windowed(EM_B)
def _fill(W):
    for k in range(len(W)):
        if W[k] is None:
            e=W[k-1]['end'] if k>0 and W[k-1] else 0.0; W[k]={"start":e,"end":e}
    return W
WA=_fill(WA); WB=_fill(WB)
# --- арбитраж: ДП по словам, выбор движка A/B с жёстким порядком начал
N=len(words)
def unary(k,c):
    W=WA if c=='A' else WB; t=W[k]['start']; sc=score(t)+(0.5 if c=='A' else 0.0)
    if m(t,t+0.10)<0.3: sc-=1.0                                   # начало в провале
    if k==0 or assign[k-1]!=assign[k]:                             # первое слово фразы: «пустой» голос до него
        lead=m(ph[assign[k]][0],t)*(t-ph[assign[k]][0]) if t>ph[assign[k]][0] else 0
        if lead>0.4: sc-=2.0
    return sc
NEG=-1e9; dp=[[NEG,NEG] for _ in range(N)]; bp=[[None,None] for _ in range(N)]
for c in (0,1): dp[0][c]=unary(0,'AB'[c])
for k in range(1,N):
    for c in (0,1):
        t=(WA if c==0 else WB)[k]['start']
        for pc in (0,1):
            pt=(WA if pc==0 else WB)[k-1]['start']
            if dp[k-1][pc]>NEG and t>=pt+0.02 and dp[k-1][pc]+unary(k,'AB'[c])>dp[k][c]:
                dp[k][c]=dp[k-1][pc]+unary(k,'AB'[c]); bp[k][c]=pc
if max(dp[N-1])==NEG: raise SystemExit("ДП не нашло допустимого пути")
c=0 if dp[N-1][0]>=dp[N-1][1] else 1; choice=[0]*N
for k in range(N-1,-1,-1):
    choice[k]=c; c=bp[k][c] if k>0 else c
ts=[dict((WA if choice[k]==0 else WB)[k]) for k in range(N)]; src=['A' if choice[k]==0 else 'B' for k in range(N)]
blocks=sum(1 for k in range(N) if abs(WA[k]['start']-WB[k]['start'])>0.3); toB=sum(1 for k in range(N) if src[k]=='B')
raw_end=[r['end'] for r in ts]
# --- начала: тишина -> голос; провал -> атака впереди (охрана: не стоит ли уже на атаке); спад -> сильная атака позади
log=[]
for k,r in enumerate(ts):
    nxt=ts[k+1]['start'] if k+1<N else r['end']+0.5
    prv_end=raw_end[k-1] if k else 0.0
    s=r['start']
    if m(s,s+0.05)<0.25:
        j=int(s*100); lim=int((nxt-0.02)*100)
        while j<lim and V[j:j+3].max()<0.25: j+=1
        if j/100-s>0.08: log.append(('тишина→голос',words[k],s,j/100)); s=round(j/100,2)
    if m(s,s+0.10)<0.5 and not near(s,allon,0.08):
        cand=[t for t in allon if s+0.05<t<=min(s+0.6,nxt-0.05)]
        if cand:
            o=max(cand,key=lambda t:m(t,t+0.15)/(m(t-0.15,t)+0.05))
            if m(s,s+0.10)<0.5*m(o,o+0.15): log.append(('провал→атака',words[k],s,o)); s=o
    if m(s-0.3,s)>0.6 and m(s-0.3,s)>2*m(s,s+0.3):
        cand=[t for t in strong if prv_end-0.05<=t<s-0.15]
        if cand: o=max(cand); log.append(('спад→атака назад',words[k],s,o)); s=o
    r['start']=round(s,2); r['end']=max(r['end'],r['start'])
# --- жёсткий порядок
for k in range(1,N):
    if ts[k]['start']<ts[k-1]['start']+0.02: ts[k]['start']=round(ts[k-1]['start']+0.02,2)
    if ts[k]['end']<ts[k]['start']: ts[k]['end']=ts[k]['start']
# --- концы: до смолкания голоса, не дальше следующего слова и конца своей фразы
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
flat=[{"i":i,"w":words[i],"start":ts[i]['start'],"end":ts[i]['end'],"src":src[i],"phrase":int(assign[i])} for i in range(N)]
json.dump(flat,open(OUT,'w'),ensure_ascii=False,indent=0)
# --- диагностика
bad=sum(1 for r in flat if r['end']<r['start']); mono=sum(1 for k in range(1,N) if flat[k]['start']<flat[k-1]['start'])
ovl=sum(1 for k in range(1,N) if flat[k]['start']<flat[k-1]['end']-1e-9)
lg=[(flat[k]['end'],flat[k+1]['start']) for k in range(N-1) if flat[k+1]['start']-flat[k]['end']>0.35 and m(flat[k]['end'],flat[k+1]['start'])>0.45]
dur=sorted(r['end']-r['start'] for r in flat)
print(f"фраз {len(ph)}, слов с расхождением >0.3 с: {blocks}, взято у второго движка: {toB}; правок начал {len(log)}: {dict(Counter(l[0] for l in log))}")
print(f"целостность: вывернутых {bad}, нарушений порядка {mono}, наложений {ovl}; длительность min {dur[0]:.2f} медиана {dur[N//2]:.2f} max {dur[-1]:.2f}; пауз с голосом {len(lg)}")
for l in log:
    if abs(l[3]-l[2])>0.25: print(f"   {l[0]:16s} {l[1]:12s} {l[2]:7.2f} -> {l[3]:7.2f}  ({m(l[2],l[2]+0.15)*100:.0f}% / {m(l[3],l[3]+0.15)*100:.0f}%)")
