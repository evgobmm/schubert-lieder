import json, sys, numpy as np, soundfile as sf, torch
from torchaudio.functional import forced_align, merge_tokens
SONG,WAV,EM_DE,EM_MMS=sys.argv[1:5]
song=json.load(open(SONG)); lines={(i,j):l for i,st in enumerate(song['stanzas']) for j,l in enumerate(st['lines_de'])}
FB={'ä':'a','ö':'o','ü':'u','ß':'ss'}
def load(p):
    d=torch.load(p); em=d['emission']; labels=list(d['labels'])[:em.shape[1]]; blank=d.get('blank',0); dic={c:i for i,c in enumerate(labels)}
    return em,labels,blank,dic
def mk(dic):
    def norm(w):
        w=w.lower().replace('’',"'"); o=''
        for c in w:
            if c in dic and c!='|': o+=c
            elif c in FB: o+=''.join(ch for ch in FB[c] if ch in dic)
        return ''.join(ch for ch in o if ch.isalpha() or ch=="'")
    return norm
E={}
for name,p in (('DE',EM_DE),('MMS',EM_MMS)):
    em,labels,blank,dic=load(p); E[name]=(torch.log_softmax(em,-1),labels,blank,dic,mk(dic))
# полное выравнивание голого текста (DE) -> границы
lp,labels,blank,dic,norm=E['DE']
words=[(k,w) for k,l in lines.items() for w in l.split()]
T=[];L=[]
for k,w in words:
    t=[dic[c] for c in norm(w) if c in dic]; T+=t; L.append(len(t))
al,sc=forced_align(lp.unsqueeze(0),torch.tensor([T],dtype=torch.int32),blank=blank); sp=merge_tokens(al[0],sc[0].exp())
bounds={};p=0
for (k,w),n in zip(words,L):
    s,e=sp[p].start*0.02,sp[p+n-1].end*0.02; p+=n
    bounds.setdefault(k,[s,e]); bounds[k][1]=e
end33=bounds[(3,3)][1]; st40=bounds[(4,0)][0]; end43=bounds[(4,3)][1]; total=lp.shape[0]*0.02
x,_=sf.read(WAV,dtype='float32'); env=np.sqrt((x[:len(x)//160*160].reshape(-1,160)**2).mean(1))
ref=np.median([env[int(bounds[k][0]*100):int(bounds[k][1]*100)+1].mean() for k in bounds])
def energy(a,b): return env[int(a*100):int(b*100)].mean()/ref*100
def greedy(name,a,b):
    lp,labels,blank,dic,norm=E[name]; ids=lp[int(a/0.02):int(b/0.02)].argmax(-1).tolist(); s='';prev=None
    for i in ids:
        if i!=prev and i!=blank: s+=labels[i] if len(labels[i])==1 else ' '
        prev=i
    return s.replace('|',' ')
def score(name,text,a,b):
    lp,labels,blank,dic,norm=E[name]; t=[dic[c] for w in text.split() for c in norm(w) if c in dic]
    f0,f1=int(a/0.02),int(b/0.02)
    if f1-f0<len(t)+2: return float('nan')
    al,sc=forced_align(lp[f0:f1].unsqueeze(0),torch.tensor([t],dtype=torch.int32),blank=blank)
    return (float(sc[0].sum())-float(lp[f0:f1,blank].sum()))/(f1-f0)
print(f"конец 3:3 {end33:.1f} | начало 4:0 {st40:.1f} | конец 4:3 {end43:.1f} | длина записи {total:.1f}")
W1=(end33+0.1,st40-0.1); W2=(end43+0.1,min(end43+7.5,total))
print(f"между строфами 3 и 4 ({W1[0]:.1f}–{W1[1]:.1f}, {W1[1]-W1[0]:.1f} с): громкость вокала {energy(*W1):.0f}% | декод DE: «{greedy('DE',*W1)[:80]}»")
print(f"   оценка строк 3:2 / 3:3 (DE): {score('DE',lines[(3,2)],*W1):+.3f} / {score('DE',lines[(3,3)],*W1):+.3f}   (MMS): {score('MMS',lines[(3,2)],*W1):+.3f} / {score('MMS',lines[(3,3)],*W1):+.3f}")
print(f"после конца текста ({W2[0]:.1f}–{W2[1]:.1f}): громкость {energy(*W2):.0f}% | декод DE: «{greedy('DE',*W2)[:90]}» | декод MMS: «{greedy('MMS',*W2)[:90]}»")
for nm in ('DE','MMS'):
    print(f"   {nm}: оценка строки 4:0 {score(nm,lines[(4,0)],*W2):+.3f} | 4:2 {score(nm,lines[(4,2)],*W2):+.3f} | 4:3 {score(nm,lines[(4,3)],*W2):+.3f} | 4:0+4:1 {score(nm,lines[(4,0)]+' '+lines[(4,1)],*W2):+.3f} | 4:2+4:3 {score(nm,lines[(4,2)]+' '+lines[(4,3)],*W2):+.3f}")
