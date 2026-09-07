# стоимость привязки слов маршрута к фразам по декоду (на букву) — для сравнения маршрутов-кандидатов на одной записи
import json, sys, numpy as np, soundfile as sf, torch
from rapidfuzz.distance import Levenshtein as Lev
SONG,WAV,EM_DE,EM_MMS,ROUTE=sys.argv[1:6]
song=json.load(open(SONG)); route=json.load(open(ROUTE))
words=[w for s,l in route for w in song['stanzas'][s]['lines_de'][l].split()]
FB={'ä':'a','ö':'o','ü':'u','ß':'ss'}
def load(p):
    d=torch.load(p); em=d['emission']; lab=list(d['labels'])[:em.shape[1]]; bl=d.get('blank',0); return em,lab,bl,{c:i for i,c in enumerate(lab)}
emD,labD,blD,dicD=load(EM_DE); emM,labM,blM,dicM=load(EM_MMS)
def normw(w):
    o=''
    for c in w.lower():
        if c in dicD and c!='|': o+=c
        elif c in FB: o+=''.join(ch for ch in FB[c] if ch in dicD)
    return ''.join(ch for ch in o if ch.isalpha())
def dec(em,lab,bl,a,b):
    ids=em[int(a/0.02):int(b/0.02)].argmax(-1).tolist(); o='';prev=None
    for k in ids:
        if k!=prev and k!=bl and len(lab[k])==1 and lab[k].isalpha(): o+=lab[k]
        prev=k
    return o
x,_=sf.read(WAV,dtype='float32'); env=np.sqrt((x[:len(x)//160*160].reshape(-1,160)**2).mean(1)); n=len(env)
ref=np.percentile(env[env>np.percentile(env,50)],50); V=env/ref
v=np.convolve((V>0.25).astype(float),np.ones(5)/5,'same')>0.4; ph=[];i=0
while i<n:
    if v[i]:
        j=i
        while j<n and (v[j] or v[j:j+35].any()): j+=1
        if (j-i)/100>=0.15: ph.append((i/100,j/100))
        i=j
    else: i+=1
ph=[(a,b) for a,b in ph if len(dec(emD,labD,blD,a,b))>=3 or len(dec(emM,labM,blM,a,b))>=3]
D=[dec(emD,labD,blD,a,b) for a,b in ph]; WN=[normw(w) for w in words]; K=len(ph); N=len(words); WIN=40; INF=float('inf')
best=[[INF]*(N+1) for _ in range(K+1)]; best[0][0]=0.0
for k in range(1,K+1):
    dk=D[k-1]
    for j in range(N+1):
        for i in range(max(0,j-WIN),j+1):
            if best[k-1][i]==INF: continue
            c=best[k-1][i]+(Lev.distance(dk,''.join(WN[i:j])) if i<j else 2*len(dk)+3)
            if c<best[k][j]: best[k][j]=c
tot=best[K][N]; L=sum(len(d) for d in D)
print(f"{tot/L:.3f}" if tot<INF else "inf")
