# голосовые дыры между словами (>1 с, голос ≥45 % опорной): что там поётся — по оценке принудительного выравнивания кандидатов (строки, пары строк) двумя движками
import json, sys, numpy as np, soundfile as sf, torch, unicodedata
from torchaudio.functional import forced_align
SITE,WAV,EM_A,EM_B,SONG=sys.argv[1:6]
song=json.load(open(SONG)); lines=[(i,j,l) for i,st in enumerate(song['stanzas']) for j,l in enumerate(st['lines_de'])]
def fold(w):
    o=''
    for ch in w.lower().replace('ß','ss'):
        if ch in 'äöü': o+=ch; continue
        d=unicodedata.normalize('NFD',ch); o+=''.join(c for c in d if not unicodedata.combining(c))
    return o
def load(p):
    d=torch.load(p); em=d['emission']; lab=list(d['labels'])[:em.shape[1]]; bl=d.get('blank',0); dic={c:i for i,c in enumerate(lab)}
    lp=torch.log_softmax(em,-1)
    def toks(text): 
        FB={'ä':'a','ö':'o','ü':'u'}
        out=[]
        for w in text.split():
            for c in fold(w):
                if c in dic and c!='|': out.append(dic[c])
                elif c in FB and FB[c] in dic: out.append(dic[FB[c]])
        return out
    def score(text,a,b):
        t=toks(text); f0,f1=int(a/0.02),int(b/0.02)
        if not t or f1-f0<len(t)+2: return None
        try: al,sc=forced_align(lp[f0:f1].unsqueeze(0),torch.tensor([t],dtype=torch.int32),blank=bl)
        except Exception: return None
        return (float(sc[0].sum())-float(lp[f0:f1,bl].sum()))/(f1-f0)
    return score
SA,SB=load(EM_A),load(EM_B)
t=json.load(open(SITE)); flat=[];names=[]
def _letters(w): return [c for c in fold(w) if c.isalpha()]
for p in t['route']:
    lw=song['stanzas'][p['s']]['lines_de'][p['l']].split()
    for k,iv in enumerate(p['w']):
        if iv and _letters(lw[k]): flat.append(iv); names.append((p['s'],p['l'],lw[k]))   # слова без букв (тире) — нулевые интервалы, не слова
_ord=sorted(range(len(flat)),key=lambda i:flat[i][0]); flat=[flat[i] for i in _ord]; names=[names[i] for i in _ord]   # по времени звучания
x,_=sf.read(WAV,dtype='float32'); n=len(x)//160; env=np.sqrt((x[:n*160].reshape(n,160)**2).mean(1))
ref=np.median([env[int(a*100):max(int(b*100),int(a*100)+1)].mean() for a,b in flat if b-a>0.2]); V=env/ref
cands=[(f"{i}:{j}",l) for i,j,l in lines]+[(f"{lines[k][0]}:{lines[k][1]}+{lines[k+1][0]}:{lines[k+1][1]}",lines[k][2]+' '+lines[k+1][2]) for k in range(len(lines)-1)]
# буквенная масса CTC (сумма 1-P(бланк), максимум по движкам): растянутое слово — под ним поётся другой текст (продление конца
# слова на паузу закрывает такую дыру от проверки по голосу); голос до первого слова — начало без разметки
def _pb(p):
    d=torch.load(p); em=d['emission']; return torch.softmax(em,-1)[:,d.get('blank',0)].numpy()
_PB=[_pb(EM_B)]   # только языковой движок: у MMS_FA на фортепиано размытая небланковая масса без букв
def mass(a,b):
    f0,f1=max(0,int(a/0.02)),int(b/0.02); return max(float((1-pb[f0:f1]).sum()) for pb in _PB) if f1>f0 else 0.0
def letters(w): return len([c for c in fold(w) if c.isalpha()])
_dB=torch.load(EM_B); _emB=_dB['emission']; _labB=list(_dB['labels'])[:_emB.shape[1]]; _blB=_dB.get('blank',0); _idsB=_emB.argmax(-1).tolist()
def greedy_letters(a,b):
    """свёрнутые буквы жадного декода языкового движка в интервале — устойчиво к тянущимся гласным (масса на долгой ноте растёт, буквы — нет)"""
    prev=None; n=0
    for i in _idsB[max(0,int(a/0.02)):int(b/0.02)]:
        if i!=prev and i!=_blB and _labB[i] and len(_labB[i])==1 and _labB[i].isalpha(): n+=1
        prev=i
    return n
for i in range(len(flat)):
    a=flat[i][0]; b=flat[i+1][0] if i+1<len(flat) else flat[i][1]; L=letters(names[i][2]); g=greedy_letters(a,b)
    if b-a>1.0 and g>L+6: print(f"дыра (растянутое слово) {a:.1f}–{b:.1f} ({b-a:.1f} с) под {names[i][0]}:{names[i][1]}·{names[i][2]}: букв в слове {L}, букв декода под ним {g}")
_f=flat[0][0]
if _f>1.0 and mass(0.0,_f-0.2)>8: print(f"дыра (до первого слова) буквенная масса {mass(0.0,_f-0.2):.0f} до {_f:.1f} — пение до первого размеченного слова")
if _f>1.0:
    _v=V[:int(_f*100)]>0.45; run=0; best=0
    for x in _v:
        run=run+1 if x else 0; best=max(best,run)
    if best>=100: print(f"дыра (до первого слова) голос {best/100:.1f} с до {_f:.1f} — начало без разметки")
for i in range(len(flat)-1):
    a,b=flat[i][1],flat[i+1][0]
    if b-a>1.0 and V[int(a*100):int(b*100)].mean()>0.45:
        res=[]
        for name,text in cands:
            sa,sb=SA(text,a,b),SB(text,a,b)
            if sa is None or sb is None: continue
            res.append(((sa+sb)/2,sa,sb,name))
        res.sort(reverse=True)
        print(f"дыра {a:.1f}–{b:.1f} ({b-a:.1f} с) между {names[i][0]}:{names[i][1]}·{names[i][2]} и {names[i+1][0]}:{names[i+1][1]}·{names[i+1][2]}: "+"; ".join(f"{nm} {s:+.3f} (A {sa:+.3f}/B {sb:+.3f})" for s,sa,sb,nm in res[:4]))
# сжатие: весь текст втиснут в слишком короткий отрезок (запасной путь по консенсусу на записи-фрагменте) — такое пение невозможно
if len(flat)>=20:
    _span=flat[-1][1]-flat[0][0]; _dens=len(flat)/max(_span,1e-6)
    if _dens>4.0: print(f"дыра (сжатие текста) {flat[0][0]:.1f}–{flat[-1][1]:.1f} ({_span:.1f} с): {len(flat)} слов за {_span:.0f} с — {_dens:.1f} слов/с")
