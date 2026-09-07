# словесные варианты: слово, где оба движка в его интервале слышат другое (нормированное расстояние > 0.5), помечается
import json, sys, torch
from rapidfuzz.distance import Levenshtein as Lev
TS,EM_DE,EM_MMS,OUT=sys.argv[1:5]
t=json.load(open(TS)); li=json.load(open('lineidx.json'))
FB={'ä':'a','ö':'o','ü':'u','ß':'ss'}
def load(p):
    d=torch.load(p); em=d['emission']; lab=list(d['labels'])[:em.shape[1]]; bl=d.get('blank',0); return em,lab,bl,{c:i for i,c in enumerate(lab)}
E=[load(EM_DE),load(EM_MMS)]
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
def wscore(k):
    r=t[k]; em,lab,bl,dic=E[0]; d=dec(em,lab,bl,r['start']-0.05,r['end']+0.05); wn=normw(r['w'],dic)
    return Lev.normalized_distance(d,wn) if d and wn else 1.0
import statistics
out=[]
for k,r in enumerate(t):
    w=r['w']; 
    if len(normw(w,E[0][3]))<4 or r['end']-r['start']<0.15: continue
    a=r['start']-0.05; b=r['end']+0.05; scores=[]; decs=[]
    for em,lab,bl,dic in E:
        d=dec(em,lab,bl,a,b); wn=normw(w,dic); decs.append(d)
        scores.append(Lev.normalized_distance(d,wn) if d else 1.0)
    agree=Lev.normalized_distance(decs[0],decs[1]) if all(decs) else 1.0
    if min(scores)>0.5 and all(len(d)>=4 for d in decs) and agree<=0.4 and r['end']-r['start']>=0.25:
        same=[q for q in range(len(t)) if li[q]==li[k] and q!=k and len(normw(t[q]['w'],E[0][3]))>=3]
        if same and statistics.median(wscore(q) for q in same)>0.45: continue   # вся строка декодируется плохо — это шум, не вариант
        s,l=li[k].split(':'); out.append({"s":int(s),"l":int(l),"k":k,"w":w,"heard_de":decs[0],"heard_mms":decs[1],"start":r['start']})
json.dump(out,open(OUT,'w'),ensure_ascii=False)
print(f"вариантов-кандидатов: {len(out)}"+("" if not out else " — "+"; ".join(f"{v['s']+1}.{v['l']+1} {v['w']}→«{v['heard_de']}»/«{v['heard_mms']}»@{v['start']:.1f}" for v in out)))
