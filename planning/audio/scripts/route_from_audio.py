# маршрут исполнения из звука: выравниваем голый текст, ищем фразы с голосом без слов, подбираем к ним строки по оценке выравнивания
import json, sys, numpy as np, soundfile as sf, torch
from torchaudio.functional import forced_align, merge_tokens
SR=16000;HOP=160
WAV,EM,SONG=sys.argv[1:4]
song=json.load(open(SONG)); lines=[(i,j,l) for i,st in enumerate(song['stanzas']) for j,l in enumerate(st['lines_de'])]
d=torch.load(EM); em=d['emission']; labels=list(d['labels'])[:em.shape[1]]; blank=d.get('blank',0); dic={c:i for i,c in enumerate(labels)}
FB={'ä':'a','ö':'o','ü':'u','ß':'ss'}
def norm(w):
    w=w.lower().replace('’',"'"); o=''
    for c in w:
        if c in dic and c!='|': o+=c
        elif c in FB: o+=''.join(ch for ch in FB[c] if ch in dic)
    return ''.join(ch for ch in o if ch.isalpha() or ch=="'")
def toks(text): return [dic[c] for w in text.split() for c in norm(w) if c in dic]
lp_all=torch.log_softmax(em,-1)
def align_score(text,f0,f1):
    """средний лог-постериор пути на кадр, минус путь из одних пропусков (насколько текст объясняет окно)"""
    t=toks(text)
    if f1-f0<len(t)+2 or not t: return -9
    lp=lp_all[f0:f1].unsqueeze(0)
    try: al,sc=forced_align(lp,torch.tensor([t],dtype=torch.int32),blank=blank)
    except Exception: return -9
    path=float(sc[0].sum()); base=float(lp[0,:,blank].sum())
    return (path-base)/(f1-f0)
# 1) огибающая и фразы вокала
x,_=sf.read(WAV,dtype='float32'); n=len(x)//HOP; env=np.sqrt((x[:n*HOP].reshape(n,HOP)**2).mean(1))
# 2) полное выравнивание голого текста
words=[w for _,_,l in lines for w in l.split()]; owner=[(i,j) for i,j,l in lines for _ in l.split()]
T=[]; L=[]
for w in words:
    t=[dic[c] for c in norm(w) if c in dic]; T+=t; L.append(len(t))
al,sc=forced_align(lp_all.unsqueeze(0),torch.tensor([T],dtype=torch.int32),blank=blank); sp=merge_tokens(al[0],sc[0].exp())
starts=[];p=0
for k in L: starts.append(sp[p].start*0.02); p+=k
ref=np.median([env[int(s*100):int(s*100)+30].mean() for s in starts]); V=env/ref
v=np.convolve((V>0.25).astype(float),np.ones(5)/5,'same')>0.4
ph=[];i=0
while i<n:
    if v[i]:
        j=i
        while j<n and (v[j] or v[j:j+35].any()): j+=1
        if (j-i)/100>=0.6: ph.append((i/100,j/100))
        i=j
    else: i+=1
print(f"фраз (≥0.6 с): {len(ph)}; слов {len(words)}; строк {len(lines)}")
# 3) фразы без начал слов, но с голосом
cands=[]
for a,b in ph:
    inside=[k for k,s in enumerate(starts) if a-0.1<=s<b]
    if not inside and b-a>=0.8:
        prev=[k for k,s in enumerate(starts) if s<a]; nxt=[k for k,s in enumerate(starts) if s>=b]
        cands.append((a,b,owner[prev[-1]] if prev else None,owner[nxt[0]] if nxt else None))
print(f"фраз с голосом без слов: {len(cands)}")
# 4) для каждой — лучшая строка / пара строк / хвост строки
def variants():
    for idx,(i,j,l) in enumerate(lines):
        yield (f"{i}:{j}",l)
        if idx+1<len(lines) and lines[idx+1][0]==i: yield (f"{i}:{j}+{i}:{lines[idx+1][1]}", l+' '+lines[idx+1][2])
        ws=l.split()
        for k in (2,3):
            if len(ws)>k: yield (f"{i}:{j}[-{k}]",' '.join(ws[-k:]))
for a,b,prev,nxt in cands:
    f0,f1=int(a/0.02),int(b/0.02)
    scored=sorted(((align_score(t,f0,f1),name) for name,t in variants()),reverse=True)[:4]
    print(f"  {a:6.1f}–{b:6.1f} ({b-a:.1f} с)  после {prev}  перед {nxt}  кандидаты: "+"; ".join(f"{nm} {sc:+.3f}" for sc,nm in scored))
