import json, sys, numpy as np, soundfile as sf, torch
WAV,EM_DE,EM_MMS,T0=sys.argv[1],sys.argv[2],sys.argv[3],float(sys.argv[4])
x,_=sf.read(WAV,dtype='float32'); env=np.sqrt((x[:len(x)//160*160].reshape(-1,160)**2).mean(1)); n=len(env)
ref=np.percentile(env[env>np.percentile(env,50)],50); V=env/ref
v=np.convolve((V>0.25).astype(float),np.ones(5)/5,'same')>0.4
ph=[];i=int(T0*100)
while i<n:
    if v[i]:
        j=i
        while j<n and (v[j] or v[j:j+30].any()): j+=1
        if (j-i)/100>=0.5: ph.append((i/100,j/100))
        i=j
    else: i+=1
def dec(p,a,b):
    d=torch.load(p); em=d['emission']; labels=list(d['labels'])[:em.shape[1]]; blank=d.get('blank',0)
    ids=em[int(a/0.02):int(b/0.02)].argmax(-1).tolist(); s='';prev=None
    for k in ids:
        if k!=prev and k!=blank: s+=(labels[k] if len(labels[k])==1 else ' ')
        prev=k
    return s.replace('|',' ').strip()
DE=torch.load(EM_DE); MM=torch.load(EM_MMS)
for a,b in ph:
    print(f"  {a:6.1f}–{b:6.1f} ({b-a:4.1f}с, {V[int(a*100):int(b*100)].mean()*100:3.0f}%)  DE: «{dec(EM_DE,a,b)[:70]}»   MMS: «{dec(EM_MMS,a,b)[:50]}»")
