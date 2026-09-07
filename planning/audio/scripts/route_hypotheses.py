# сравнение гипотез маршрута (повторов) по суммарному правдоподобию принудительного выравнивания всей записи
import json, sys, itertools, torch
from torchaudio.functional import forced_align
SONG=sys.argv[1]; EMS=sys.argv[2:]
song=json.load(open(SONG)); S=len(song['stanzas'])
FB={'ä':'a','ö':'o','ü':'u','ß':'ss','í':'i','ó':'o'}
base=[(i,j) for i in range(S) for j in range(len(song['stanzas'][i]['lines_de']))]
last=S-1; L=len(song['stanzas'][last]['lines_de'])
FINAL={'нет':[], 'посл.строка':[(last,L-1)], 'посл.2':[(last,L-2),(last,L-1)], 'посл.2+посл.':[(last,L-2),(last,L-1),(last,L-1)],
       'вся строфа':[(last,j) for j in range(L)], 'посл.2 ×2':[(last,L-2),(last,L-1)]*2, 'посл.строка ×2':[(last,L-1)]*2}
L3=len(song['stanzas'][3]['lines_de'])
STZ3={'—':[], '3:посл.':[(3,L3-1)], '3:посл.2':[(3,L3-2),(3,L3-1)]}
def route_for(f3,ff):
    r=[]
    for (i,j) in base:
        r.append((i,j))
        if (i,j)==(3,L3-1): r+=STZ3[f3]
    return r+FINAL[ff]
results={}
for em_path in EMS:
    d=torch.load(em_path); em=d['emission']; labels=list(d['labels'])[:em.shape[1]]; blank=d.get('blank',0); dic={c:i for i,c in enumerate(labels)}
    def norm(w):
        w=w.lower().replace('’',"'"); o=''
        for c in w:
            if c in dic and c!='|': o+=c
            elif c in FB: o+=''.join(ch for ch in FB[c] if ch in dic)
        return ''.join(ch for ch in o if ch.isalpha() or ch=="'")
    lp=torch.log_softmax(em,-1).unsqueeze(0)
    for f3,ff in itertools.product(STZ3,FINAL):
        toks=[dic[c] for (i,j) in route_for(f3,ff) for w in song['stanzas'][i]['lines_de'][j].split() for c in norm(w) if c in dic]
        al,sc=forced_align(lp,torch.tensor([toks],dtype=torch.int32),blank=blank)
        results.setdefault((f3,ff),[]).append(float(sc[0].sum()))
names=[p.split('/')[-1] for p in EMS]
base_ll={k:v for k,v in results.items() if k==('—','нет')}[('—','нет')]
print(f"{'строфа 3':10s} {'финал':16s} "+"  ".join(f"{n:>22s}" for n in names))
rows=sorted(results.items(), key=lambda kv: -sum(kv[1][m]-base_ll[m] for m in range(len(names))))
for (f3,ff),v in rows:
    print(f"{f3:10s} {ff:16s} "+"  ".join(f"{v[m]-base_ll[m]:+22.1f}" for m in range(len(names))))
print("(числа — прирост лог-правдоподобия пути относительно маршрута без повторов; больше — лучше)")
