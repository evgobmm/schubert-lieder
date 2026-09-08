# жадный CTC-декод с разбиением слов также по паузам бланков >=0.4 с; печать интервала
import torch,sys
d=torch.load(sys.argv[1]); em=d['emission']; labels=d.get('labels'); blank=d.get('blank',0)
if em.dim()==3: em=em[0]
if labels is None:   # MMS_FA: словарь torchaudio
    import torchaudio; labels=list(torchaudio.pipelines.MMS_FA.get_labels(star=None)); blank=0
ids=em.argmax(-1).tolist(); prev=None; words=[]; cur=''; t0=None; lastletter=None
for f,i in enumerate(ids):
    if i!=blank and i!=prev:
        ch=labels[i] or ''
        if ch in ('|',' ','-'):
            if cur: words.append((t0,cur)); cur=''
        else:
            if cur and lastletter is not None and f-lastletter>=20: words.append((t0,cur)); cur=''
            if not cur: t0=f*0.02
            cur+=ch; lastletter=f
    prev=i
if cur: words.append((t0,cur))
lo=float(sys.argv[2]) if len(sys.argv)>2 else 0; hi=float(sys.argv[3]) if len(sys.argv)>3 else 1e9
print(' '.join(f"{w}@{t:.1f}" for t,w in words if lo<=t<=hi))
