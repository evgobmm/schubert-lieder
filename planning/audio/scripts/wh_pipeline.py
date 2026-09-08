# Распознаватель-первичен: Whisper-слова -> сопоставление со стихами (повторы, варианты) -> окна по таймкодам Whisper
# -> CTC-выравнивание двух движков буквами спетого -> ДП по слову -> атаки -> концы -> файл сайта (частичные проходы, variants)
import json, sys, re, os, numpy as np, soundfile as sf, torch
from torchaudio.functional import forced_align, merge_tokens
from rapidfuzz.distance import Levenshtein as Lev
SPEC,VID,WH,WAV,EM_A,EM_B=sys.argv[1:7]
ROOT='/workspaces/schubert-lieder'; spec=json.load(open(SPEC)); song=json.load(open(spec['song']))
lines=[(i,j,l) for i,st in enumerate(song['stanzas']) for j,l in enumerate(st['lines_de'])]
TW=[];TIDX=[]   # слова текста и их адреса (s,l,k)
for i,j,l in lines:
    for k,w in enumerate(l.split()): TW.append(w); TIDX.append((i,j,k))
N=len(TW)
import unicodedata
def _fold(w):   # диакритика -> базовая буква (à->a, é->e), ß -> ss; немецкие умляуты сохраняем (они есть в словаре DE-модели)
    out=''
    for ch in w.lower().replace('ß','ss'):
        if ch in 'äöü': out+=ch; continue
        d=unicodedata.normalize('NFD',ch); out+=''.join(c for c in d if not unicodedata.combining(c))
    return out
def letters(w): return re.sub(r"[^a-zäöü]","",_fold(w))
TL=[letters(w) for w in TW]
# --- Whisper
wh=json.load(open(WH)); W=[w for s in wh for w in s['words'] if letters(w['w'])]
# БУКВЕННАЯ МАССА CTC: сумма (1 - P(бланк)) по кадрам интервала ~ число букв, которые модель слышит там (фортепиано даёт бланки).
# Только языковой движок (wav2vec2-xlsr, EM_B): он пиковый и точный; у MMS_FA на фортепиано размытая небланковая масса
# (1.5–5 на полсекунды проигрыша без единой буквы в жадном декоде), которая раздувала бюджет в проигрышах
def _blankpost(empt):
    d=torch.load(empt); em=d['emission']; return torch.softmax(em,-1)[:,d.get('blank',0)].numpy()
_PB=[_blankpost(EM_B)]
def letter_mass(a,b):
    f0=max(0,int(a/0.02)); f1=int(b/0.02)
    return max(float((1-pb[f0:f1]).sum()) for pb in _PB) if f1>f0 else 0.0
MASS_MIN=0.4   # слова считаются спетыми в интервале, если буквенная масса >= 0.4 их букв
def voice_mean(a,b):
    i,j=max(0,int(a*100)),int(b*100); return float(_V[i:j].mean()) if j>i else 0.0
def sung_evidence(a,b,L,mass=None):
    """в интервале [a,b] поются L букв: масса языкового движка >= MASS_MIN·L, ИЛИ движок глух к тихому легато (Бартоли, Попп),
    но голос звучит (энергия стема >= 0.5 опорной в среднем) и времени хватает (>= 0.1 с на букву)"""
    if mass is None: mass=letter_mass(a,b)
    return mass>=MASS_MIN*L or (voice_mean(a,b)>=0.5 and (b-a)>=0.1*L)
# ГАЛЛЮЦИНАЦИИ Whisper (аплодисменты, «Grazie a tutti», титры) — по акустике: голосовые фразы по энергии стема;
# слово вне фраз и дальше 3 с от предыдущего принятого — отбрасывается; конец пения — конец последней фразы
_x,_=sf.read(WAV,dtype='float32'); _n=len(_x)//160; _env=np.sqrt((_x[:_n*160].reshape(_n,160)**2).mean(1))
_ref=float(np.percentile(_env[_env>np.percentile(_env,50)],50)); _V=_env/_ref
_v=np.convolve((_V>0.25).astype(float),np.ones(5)/5,'same')>0.4; _ph=[]; _i=0
while _i<_n:
    if _v[_i]:
        _j=_i
        while _j<_n and (_v[_j] or _v[_j:_j+35].any()): _j+=1
        if (_j-_i)/100>=0.4: _ph.append((_i/100,_j/100))
        _i=_j
    else: _i+=1
def _in_phrase(a,b): return any(pa-0.6<=a<=pb+0.6 or pa-0.6<=b<=pb+0.6 or (a<pa and b>pb) for pa,pb in _ph)   # допуск 0.6 с на границах фраз
kept=[]; dropped=[]
for w in W:
    far=(not kept) or (w['start']-kept[-1]['end']>3.0)
    if far and not _in_phrase(w['start'],w['end']) and letter_mass(w['start']-0.3,w['end']+0.3)<max(1.5,MASS_MIN*len(letters(w['w']))): dropped.append(w); continue   # вне фраз по энергии, но с буквами CTC под собой — голос, не галлюцинация (тихая атака в старой записи)
    kept.append(w)
if dropped: print("отброшено галлюцинаций Whisper:",len(dropped),"—"," ".join(f"{w['w']}@{w['start']:.1f}" for w in dropped))
W=kept
END_SING=(_ph[-1][1] if _ph else _n/100)+0.5
M=len(W); WL=[letters(w['w']) for w in W]
# --- сопоставление: состояние = позиция в тексте j; переходы: продолжение (j+1), возврат/прыжок к любому j' (штраф по дальности в строках), вставка (слово Whisper вне текста)
INF=1e9
def ldist(a,b): return abs(TIDX[a][0]*10+TIDX[a][1]-(TIDX[b][0]*10+TIDX[b][1]))
# цена совпадения выпуклая: d + 1.5·d² — Whisper large-v3 редко ошибается в слове сильнее d≈0.5, и четыре плохих совпадения
# не должны быть дешевле одного прыжка (иначе рефрен «mein Herz, mein Herz» ложился на «einmal hinüber sehn»)
dist=[[Lev.normalized_distance(WL[i],TL[j]) for j in range(N)] for i in range(M)]
cost=[[min(d+d*d,1.6) for d in row] for row in dist]   # потолок 1.6: слово на своём месте между соседями дешевле вставки+пропуска (≥1.7) даже при d=1
best=[[INF]*N for _ in range(M)]; back=[[None]*N for _ in range(M)]
for j in range(N): best[0][j]=cost[0][j]+0.3*ldist(0,j)
# вставка (слово Whisper без пары в тексте): дёшево для мусора, дорого для слова, которое точно есть в тексте, —
# иначе ДП объявляло вставками настоящий рефрен («…für dich, mein Herz, mein Herz, was drängst…» — 4 точных слова дешевле, чем прыжок к строке и обратно)
INS=0.9
def insw(i,j):   # вставка слова i в позиции j: дорого, если такое слово есть в тексте рядом (±2 строки), дёшево для мусора
    lo_=TIDX[j][0]*10+TIDX[j][1]
    dloc=min((dist[i][t] for t in range(N) if abs(TIDX[t][0]*10+TIDX[t][1]-lo_)<=2),default=1.0)
    return INS+1.5*(1-dloc)
for i in range(1,M):
    for j in range(N):
        c=cost[i][j]; b=INF; bp=None
        if best[i-1][j-1 if j>0 else 0]<INF and j>0 and best[i-1][j-1]+c<b: b=best[i-1][j-1]+c; bp=(j-1,'c')            # продолжение
        for jp in range(N):                                                                                             # прыжок (повтор назад / вперёд)
            if jp==j-1 or best[i-1][jp]>=INF: continue
            if TIDX[j][2]==0: pen=1.2+0.35*ldist(jp,j)                       # к началу строки (повтор строки, рефрен, перестановка строк композитором) — вперёд или назад
            elif j>jp:
                gap=j-jp-1                                                   # внутрь строки вперёд: пропущено слов текста
                pen=0.8*gap if gap<=2 else 2.5+0.35*ldist(jp,j)              # 1–2 неуслышанных слова — дёшево; дальше — дорого
            else: pen=1.2+0.35*ldist(jp,j)                                   # возврат внутрь строки (частичный повтор: «…ihr Bild, ihr Bild dahin»)
            if best[i-1][jp]+pen+c<b: b=best[i-1][jp]+pen+c; bp=(jp,'j')
        if j>1 and best[i-1][j-2]<INF:                                                                                  # слияние: «Liebesliebchen» = liebes Liebchen
            cm=Lev.normalized_distance(WL[i],TL[j-1]+TL[j])
            if cm<=0.25 and best[i-1][j-2]+cm<b: b=best[i-1][j-2]+cm; bp=(j-2,'m')
        if i>1 and j>0 and best[i-2][j-1]<INF:                                                                          # разбиение: «auf springt» = aufspringt
            cs=Lev.normalized_distance(WL[i-1]+WL[i],TL[j])
            if cs<=0.25 and best[i-2][j-1]+cs<b: b=best[i-2][j-1]+cs; bp=(j-1,'s')
        if best[i-1][j]<INF and best[i-1][j]+insw(i,j)<b: b=best[i-1][j]+insw(i,j); bp=(j,'i')                          # вставка: Whisper-слово лишнее
        best[i][j]=b; back[i][j]=bp
j=min(range(N),key=lambda x: best[M-1][x]); path=[]; i=M-1
while i>=0:
    bpj,kind=back[i][j] if back[i][j] else (None,'c')
    path.append((i,j,kind)); i-=2 if kind=='s' else 1
    if bpj is not None: j=bpj
path=path[::-1]
# спетая последовательность: каждое Whisper-слово (кроме вставок) -> слово текста; повторное посещение = повтор
sung=[]   # {t: индекс текста, wi: индекс Whisper-слова, anch: якорь (если не равен слову Whisper целиком)}
for i,j,kind in path:
    if kind=='i': continue
    if kind=='m':   # слитое слово Whisper: якорь делится между двумя словами текста пропорционально буквам
        L1,L2=len(TL[j-1]),len(TL[j]); a,b=W[i]['start'],W[i]['end']; mid=a+(b-a)*L1/max(1,L1+L2)
        sung.append({"t":j-1,"wi":i,"anch":(a,mid),"part":True}); sung.append({"t":j,"wi":i,"anch":(mid,b),"part":True})
    elif kind=='s': sung.append({"t":j,"wi":i,"anch":(W[i-1]['start'],W[i]['end']),"part":True})
    else: sung.append({"t":j,"wi":i})
# ФАНТОМНЫЕ ПОВТОРЫ Whisper: в проигрышах стем хранит эхо фортепиано, и Whisper дописывает «mein Herz, mein Herz» с
# слипшимися таймкодами. Проверка по звуку: окно прохода (от его первого якоря до первого якоря следующего прохода)
# должно содержать буквенную массу >= MASS_MIN его букв; иначе проход — фантом, его слова отбрасываются как вставки
def _passes(seq):
    ps=[]; prev=None
    for k,s_ in enumerate(seq):
        ln=TIDX[s_['t']][:2]
        if ps and ps[-1]['line']==ln and prev is not None and s_['t']>prev: ps[-1]['idx'].append(k)
        else: ps.append({"line":ln,"idx":[k]})
        prev=s_['t']
    return ps
_ps=_passes(sung); _drop=set(); _dbgp=os.environ.get('DEBUG_PASSES')
for q,p in enumerate(_ps):
    t0=min(W[sung[k]['wi']]['start'] for k in p['idx'])
    nxt=[min(W[sung[k]['wi']]['start'] for k in r['idx']) for r in _ps[q+1:]]
    t1=nxt[0] if nxt else END_SING
    L=sum(len(TL[sung[k]['t']]) for k in p['idx']); win=max(0.0,t1-t0)
    mass=letter_mass(t0,(t1-max(0.25,0.3*win)) if win>0.5 else t0+win/2)   # без хвоста окна: таймкоды Whisper у стыка с реальной фразой запаздывают на 0.3–0.7 с; слипшиеся таймкоды -> окно пустое -> фантом
    ws=[W[sung[k]['wi']] for k in p['idx']]
    weak=2*sum(1 for w in ws if w['p']<0.35 or w['end']-w['start']<0.05)>=len(ws)   # Whisper сам не верит (p<0.35) или таймкоды слиплись — нужна сильная акустика
    phantom=(mass<0.8*L) if weak else (not sung_evidence(t0,(t1-max(0.25,0.3*win)) if win>0.5 else t0+win/2,L,mass))   # слабый проход — только по массе
    if _dbgp: print(f"  проход {p['line'][0]}:{p['line'][1]} {' '.join(TW[sung[k]['t']] for k in p['idx'])!r:40s} окно {t0:6.1f}–{t1:6.1f} ({win:4.1f} с) букв {L:2d} масса {mass:5.1f}{' слабый' if weak else ''} {'ФАНТОМ' if phantom else ''}")
    if phantom: _drop|=set(p['idx'])
if _drop: print("отброшено фантомных повторов Whisper:",len([p for p in _ps if set(p['idx'])<=_drop]),"проходов —"," ".join(f"{TW[sung[k]['t']]}@{W[sung[k]['wi']]['start']:.1f}" for k in sorted(_drop)))
sung=[s_ for k,s_ in enumerate(sung) if k not in _drop]
# ложные одиночные повторы: возврат ради одного слова, которое Whisper слышит плохо (d>0.2), — это вставка, не повтор
clean=[]
for idx,s_ in enumerate(sung):
    prv=sung[idx-1]['t'] if idx else -1; nxt=sung[idx+1]['t'] if idx+1<len(sung) else 10**9
    if s_['t']>prv+1 and s_['wi'] is not None and not s_.get('part') and Lev.normalized_distance(WL[s_['wi']],TL[s_['t']])>0.2: continue   # прыжок вперёд ради плохо услышанного слова — вставка
    clean.append(s_)
sung=clean
# пропущенные слова текста между соседними посещениями: Whisper их не услышал (буквы в звуке есть — заполняем без якоря)
# или певец их не спел (купюра: букв в интервале нет — не заполняем). Мера — буквенная масса CTC между якорями
def _anch(s_): return s_.get('anch') or (W[s_['wi']]['start'],W[s_['wi']]['end'])
def _fits(gap,a,b):
    L=sum(len(TL[t]) for t in gap); mass=letter_mass(a-0.1,b+0.1); ok=sung_evidence(a-0.1,b+0.1,L,mass)
    if not ok: print(f"купюра певца (не заполняем): {' '.join(TW[t] for t in gap)!r} — букв {L}, буквенная масса {mass:.1f} в {a:.1f}–{b:.1f}")
    return ok
def _fill_gap(gap,a,b):
    """какие слова пропуска заполнить: <3 слов — все; иначе по буквенному бюджету между якорями — сначала хвост строки a,
    потом голова строки b, потом целые строки между ними (купюра певца — это целые строки, а не слова)"""
    if len(gap)<3: return gap
    la=TIDX[gap[0]-1][:2]; lb=TIDX[gap[-1]+1][:2]
    tail=[t for t in gap if TIDX[t][:2]==la]; head=[t for t in gap if TIDX[t][:2]==lb and lb!=la]; mid=[t for t in gap if t not in tail and t not in head]
    budget=letter_mass(a-0.1,b+0.1); out=[]
    for seg in (tail,head,mid):
        if not seg: continue
        L=sum(len(TL[t]) for t in seg)
        if budget>=MASS_MIN*L or (voice_mean(a-0.1,b+0.1)>=0.5 and (b-a+0.2)>=0.1*(L+sum(len(TL[t]) for t in out))): out+=seg; budget-=L
        else: print(f"купюра певца (не заполняем): {' '.join(TW[t] for t in seg)!r} — букв {L}, остаток буквенной массы {budget:.1f} в {a:.1f}–{b:.1f}")
    return sorted(out)
filled=[]
for idx,(a,b) in enumerate(zip(sung,sung[1:]+[None])):
    filled.append(a)
    if b and b['t']>a['t']+1:
        for t in _fill_gap(list(range(a['t']+1,b['t'])),_anch(a)[1],_anch(b)[0]): filled.append({"t":t,"wi":None})
sung=filled
# голова текста до первого услышанного слова (Whisper часто теряет первую фразу после вступления) — по тому же бюджету
if sung and sung[0]['t']>0:
    head=list(range(0,sung[0]['t']))
    if _fits(head,0.0,_anch(sung[0])[0]):
        sung=[{"t":t,"wi":None} for t in head]+sung; print(f"голова текста без якорей дописана: {len(head)} слов")
# ПОЧИНКА ПО КОНСЕНСУСУ (env CONSENSUS=route.json, [{s,l,k}] — большинство записей песни по строфам): Whisper этой записи мог
# потерять целые проходы (повтор строки, вторую половину строфы). Недостающие проходы вставляются без якорей там, где они стоят
# в консенсусе, — но только если между соседними якорями есть буквенная масса под их буквы (певец мог и правда не спеть).
# Лишние проходы записи (нет в консенсусе) не трогаем — они прошли акустическую проверку; сообщаем.
CONS=os.environ.get('CONSENSUS'); added=[]
if CONS:
    cons=json.load(open(CONS)); T={x:t for t,x in enumerate(TIDX)}
    own=_passes(sung); a=[f"{p['line'][0]}:{p['line'][1]}" for p in own]; b=[f"{p['s']}:{p['l']}" for p in cons]
    # вложение своих проходов в консенсус — самое раннее (свой проход строки = её первое ещё не занятое вхождение);
    # недостающие проходы вставляются после своего предшественника, если между соседними якорями хватает буквенной массы
    emb=[]; jj=0; extra=[]
    for i_,x in enumerate(a):
        k_=next((q for q in range(jj,len(b)) if b[q]==x),None)
        if k_ is None: extra.append(x); emb.append(None); continue
        emb.append(k_); jj=k_+1
    added=[]; refused=[]; taken=set(e for e in emb if e is not None)
    blocks=[]; cur=None
    for q in range(len(b)):
        if q in taken: cur=None; continue
        if cur is None: cur=[q]; blocks.append(cur)
        else: cur.append(q)
    for blk in reversed(blocks):   # с конца — индексы sung не сдвигаются
        prev_own=[i_ for i_,e in enumerate(emb) if e is not None and e<blk[0]]
        pos=own[prev_own[-1]]['idx'][-1]+1 if prev_own else 0
        words_=[T[(cons[q]['s'],cons[q]['l'],k)] for q in blk for k in cons[q]['k'] if (cons[q]['s'],cons[q]['l'],k) in T]
        anch_before=[i_ for i_,x in enumerate(sung[:pos]) if x['wi'] is not None]
        lo=_anch(sung[anch_before[-1]])[1] if anch_before else 0.0
        hi=min([_anch(x)[0] for x in sung[pos:] if x['wi'] is not None],default=END_SING)
        used=sum(len(TL[x['t']]) for x in sung[(anch_before[-1]+1 if anch_before else 0):pos] if x['wi'] is None)   # буквы уже вставленных без якоря слов в этом же промежутке
        L=sum(len(TL[t]) for t in words_); budget=letter_mass(lo,hi)-used
        if words_ and (budget>=MASS_MIN*L or (voice_mean(lo,hi)>=0.5 and (hi-lo)>=0.1*(L+used))): sung[pos:pos]=[{"t":t,"wi":None} for t in words_]; added.append(' '.join(b[q] for q in blk))
        else: refused.append((' '.join(b[q] for q in blk),L,budget,lo,hi))
    if added: print("маршрут дополнен по консенсусу записей:",len(added),"блоков —"," | ".join(reversed(added)))
    for blk,L,bud,lo,hi in refused: print(f"консенсус предлагает {blk!r}, но буквенной массы нет ({bud:.1f} на {L} букв в {lo:.1f}–{hi:.1f}) — не вставляем")
    if extra: print("проходы записи вне консенсуса (оставлены):",' '.join(extra))
# варианты: Whisper уверенно слышит другое слово
for s_ in sung:
    if s_['wi'] is None or s_.get('part'): s_['var']=None; continue
    w=W[s_['wi']]; d=Lev.normalized_distance(WL[s_['wi']],TL[s_['t']])
    # вариант — только целое слово: не склейка соседних слов текста и не обрывок (длины сопоставимы), уверенность Whisper ≥0.7
    nb=[TL[s_['t']]+TL[s_['t']+1] if s_['t']+1<N else '', TL[s_['t']-1]+TL[s_['t']] if s_['t']>0 else '']
    merged=any(x and Lev.normalized_distance(WL[s_['wi']],x)<0.35 for x in nb)
    neigh=any(Lev.normalized_distance(WL[s_['wi']],TL[q])<0.2 for q in range(max(0,s_['t']-2),min(N,s_['t']+3)) if q!=s_['t'])   # слово-сосед: перестановка Whisper, не вариант
    merged=merged or neigh
    s_['var']=W[s_['wi']]['w'] if (d>=0.25 and w['p']>=0.7 and len(WL[s_['wi']])>=4 and len(TL[s_['t']])>=4 and abs(len(WL[s_['wi']])-len(TL[s_['t']]))<=3 and not merged) else None
last_t=max(s_['t'] for s_ in sung) if sung else -1
if 0<N-1-last_t and not any(s_['t']==N-1 for s_ in sung):
    tail=list(range(last_t+1,N)); last_anch=[_anch(s_) for s_ in sung if s_['wi'] is not None]
    if _fits(tail,last_anch[-1][1] if last_anch else 0.0,END_SING):
        for t in tail: sung.append({"t":t,"wi":None,"var":None})
        print(f"хвост текста без якорей дописан: {len(tail)} слов")
words=[TW[s_['t']] for s_ in sung]; li=[f"{TIDX[s_['t']][0]}:{TIDX[s_['t']][1]}" for s_ in sung]; slots=[TIDX[s_['t']][2] for s_ in sung]
json.dump(words,open('words.json','w'),ensure_ascii=False); json.dump(li,open('lineidx.json','w')); json.dump(slots,open('slots.json','w'))
print(f"Whisper-слов {M}, спето слов {len(sung)}, вставок {sum(1 for _,_,k in path if k=='i')}, без якоря {sum(1 for s_ in sung if s_['wi'] is None)}, вариантов {sum(1 for s_ in sung if s_['var'])}: "+", ".join(f"{TW[s_['t']]}→{s_['var']}" for s_ in sung if s_['var']))
# --- акустика
x,_=sf.read(WAV,dtype='float32'); n=len(x)//160; env=np.sqrt((x[:n*160].reshape(n,160)**2).mean(1))
anch=[_anch(s_) if s_['wi'] is not None else None for s_ in sung]
ref=float(np.median([env[int(a*100):max(int(b*100),int(a*100)+1)].mean() for a,b in [t for t in anch if t] if b-a>0.15])); V=env/ref
def m(a,b):
    i,j=int(a*100),int(b*100); return float(V[max(i,0):max(j,i+1)].mean())
Wn=15; ons=[]
for i in range(Wn,n-Wn):
    a=V[i-Wn:i].mean()+0.05; b=V[i:i+Wn].mean()+0.05; r=b/a
    if r>1.8 and V[i:i+Wn].mean()>0.35: ons.append((i/100,r))
ons=[o for k,o in enumerate(ons) if k==0 or o[0]-ons[k-1][0]>0.12 or o[1]>ons[k-1][1]]
allon=[t for t,_ in ons]; strong=[t for t,r in ons if r>=2.5]
def near(t,lst,tol): return min((abs(t-o) for o in lst),default=9)<=tol
# --- окна: группы подряд идущих слов; разрыв между якорями > 0.8 с — новое окно
groups=[]; cur=[]; last_end=None
for k in range(len(sung)):
    if anch[k] and last_end is not None and anch[k][0]-last_end>0.8: groups.append(cur); cur=[]   # разрыв между якорями > 0.8 с — новая группа; слова без якоря идут с текущей группой
    cur.append(k)
    if anch[k]: last_end=anch[k][1]
if cur: groups.append(cur)
FB={'ä':'a','ö':'o','ü':'u','ß':'ss'}
def windowed(empt):
    d=torch.load(empt); em=d['emission']; labels=list(d['labels'])[:em.shape[1]]; blank=d.get('blank',0); dic={c:i for i,c in enumerate(labels)}
    def norm(w):
        o=''
        for c in _fold(w):
            if c in dic and c!='|': o+=c
            elif c in FB: o+=''.join(ch for ch in FB[c] if ch in dic)
        return ''.join(ch for ch in o if ch.isalpha() or ch=="'")
    res=[None]*len(sung)
    for g in groups:
        an=[anch[k] for k in g if anch[k]]
        prev=[anch[q] for q in range(g[0]) if anch[q]]; nxt_=[anch[q] for q in range(g[-1]+1,len(sung)) if anch[q]]
        lo=(prev[-1][1] if prev else 0.0); hi=(nxt_[0][0] if nxt_ else END_SING)      # границы — соседние якоря других групп
        if an:
            t0=max(0.0,lo-0.1,(min(a for a,b in an)-0.5) if anch[g[0]] else 0.0)   # группа начинается словами без якоря (голова, вставка по консенсусу) — окно от предыдущего якоря, не от первого своего
            t1=min(n/100,hi-0.05 if nxt_ else END_SING, max(b for a,b in an)+ (0.6 if all(anch[k] for k in g) else 30.0))
        else: t0=max(0.0,lo-0.2); t1=min(n/100,hi-0.05 if nxt_ else END_SING)
        if t1<=t0+0.3: t1=t0+0.3
        toks=[];lens=[]
        for k in g:
            sw=sung[k]['var'] or words[k]                      # буквами спетого слова
            t=[dic[c] for c in norm(sw) if c in dic]; toks+=t; lens.append((k,len(t)))
        if not toks: continue
        f0=int(t0/0.02); f1=min(em.shape[0],max(int(t1/0.02),f0+len(toks)+2))
        lp=torch.log_softmax(em[f0:f1],-1).unsqueeze(0)
        al,sc=forced_align(lp,torch.tensor([toks],dtype=torch.int32),blank=blank); sp=merge_tokens(al[0],sc[0].exp()); p=0
        for k,L in lens:
            if L==0: e=res[k-1]['end'] if k>0 and res[k-1] else t0; res[k]={"start":e,"end":e}; continue
            s=sp[p:p+L]; p+=L; res[k]={"start":round(t0+s[0].start*0.02,2),"end":round(t0+s[-1].end*0.02,2)}
    for k in range(len(res)):
        if res[k] is None: e=res[k-1]['end'] if k>0 and res[k-1] else 0.0; res[k]={"start":e,"end":e}
    return res
WA=windowed(EM_A); WB=windowed(EM_B); C=[WA,WB]; PRIOR=[0.5,0.0]; K=len(sung)
def unary(k,c):
    t=C[c][k]['start']; sc=PRIOR[c]+2*near(t,strong,0.2)
    if m(t,t+0.10)<0.3: sc-=1.0
    if anch[k]:
        pw=W[sung[k]['wi']]['p'] if sung[k]['wi'] is not None else 0.5
        sc-=2.0*pw*max(0.0,abs(t-anch[k][0])-0.35)          # якорь Whisper — мягкий, вес по его уверенности
    return sc
NEG=-1e9; dp=[[NEG,NEG] for _ in range(K)]; bp=[[None,None] for _ in range(K)]
for c in (0,1): dp[0][c]=unary(0,c)
for k in range(1,K):
    for c in (0,1):
        t=C[c][k]['start']; u=unary(k,c)
        for pc in (0,1):
            if dp[k-1][pc]>NEG and t>=C[pc][k-1]['start']+0.02 and dp[k-1][pc]+u>dp[k][c]: dp[k][c]=dp[k-1][pc]+u; bp[k][c]=pc
c=0 if dp[K-1][0]>=dp[K-1][1] else 1; choice=[0]*K
if max(dp[K-1])>NEG:   # путь найден — обратный ход; иначе (порядок не сошёлся) ниже берётся основной движок
    for k in range(K-1,-1,-1):
        choice[k]=c
        if k>0: c=bp[k][c]

import os
def _dbg(stage):
    w=os.environ.get('DEBUG_WIN')
    if not w: return
    lo,hi=map(float,w.split(','))
    print(f"[{stage}] "+' | '.join(f"{words[k]} {ts[k]['start']:.2f}–{ts[k]['end']:.2f}" for k in range(K) if lo<=ts[k]['start']<=hi or lo<=ts[k]['end']<=hi))
    if stage=='после ДП': print('   кандидаты: '+' | '.join(f"{words[k]} A={WA[k]['start']:.2f} B={WB[k]['start']:.2f} якорь={anch[k][0] if anch[k] else None} p={W[sung[k]['wi']]['p'] if sung[k]['wi'] is not None else None} выбран={'AB'[choice[k]]}" for k in range(K) if lo<=WA[k]['start']<=hi or lo<=WB[k]['start']<=hi))
ts=[dict(C[choice[k]][k]) for k in range(K)]
_dbg('после ДП')
print('ДП: путь', 'НЕ НАЙДЕН — взят основной движок' if max(dp[K-1])==NEG else 'найден', '| выбор для слов 33–40 с:', ' '.join(f"{words[k]}={'AB'[choice[k]]}" for k in range(K) if 33<=min(WA[k]['start'],WB[k]['start'])<=40))
if max(dp[K-1])==NEG:  # порядок не сошёлся — берём основной движок и чиним порядок
    ts=[dict(WA[k]) for k in range(K)]
raw_end=[r['end'] for r in ts]
for k,r in enumerate(ts):
    nxt=ts[k+1]['start'] if k+1<K else r['end']+0.5; prv_end=raw_end[k-1] if k else 0.0; s=r['start']
    if m(s,s+0.05)<0.25:
        j=int(s*100); lim=int((nxt-0.02)*100)
        while j<lim and j+3<=n and V[j:j+3].max()<0.25: j+=1
        if j/100-s>0.08: s=round(j/100,2)
    if m(s,s+0.10)<0.3 and not near(s,allon,0.08):
        cand=[t for t in allon if s+0.05<t<=min(s+0.6,nxt-0.05)]
        if cand:
            o=max(cand,key=lambda t:m(t,t+0.15)/(m(t-0.15,t)+0.05))
            if m(s,s+0.10)<0.5*m(o,o+0.15): s=o
    if m(s-0.3,s)>0.6 and m(s-0.3,s)>2*m(s,s+0.3):
        cand=[t for t in strong if prv_end-0.05<=t<s-0.15]
        if cand: s=max(cand)
    r['start']=round(s,2); r['end']=max(r['end'],r['start'])
for k in range(K):
    if ts[k]['start']>END_SING: ts[k]['start']=round(END_SING,2)
    if ts[k]['end']>END_SING+0.5: ts[k]['end']=round(END_SING+0.5,2)
for k in range(1,K):
    if ts[k]['start']<ts[k-1]['start']+0.02: ts[k]['start']=round(ts[k-1]['start']+0.02,2)
    if ts[k]['end']<ts[k]['start']: ts[k]['end']=ts[k]['start']
_dbg('после привязок начал')
def _chain_end(t,phr):
    """конец цепочки фраз, содержащей момент t (или начинающейся не позже чем через 1 с после него); фразы, разделённые < 1 с, — одна цепочка"""
    idx=None
    for i,(a,b) in enumerate(phr):
        if a-1.0<=t<=b+0.5: idx=i; break
    if idx is None: return None
    while idx+1<len(phr) and phr[idx+1][0]-phr[idx][1]<1.0: idx+=1
    return phr[idx][1]
for k,r in enumerate(ts):
    nxt=ts[k+1]['start'] if k+1<K else END_SING; b=r['end']
    ce=_chain_end(b,_ph)
    end=b if ce is None else max(b,min(ce+0.1,b+12.0))
    r['end']=round(min(max(end,b),nxt),2)
for k in range(K-1):
    if ts[k]['end']>ts[k+1]['start']: ts[k]['end']=ts[k+1]['start']
_dbg('после продления концов')
MIN=0.12
for k in range(K):
    if ts[k]['end']-ts[k]['start']<MIN:
        prv=ts[k-1] if k else None; ns=ts[k]['end']-MIN
        if prv and ns>=prv['start']+0.3: prv['end']=min(prv['end'],round(ns,2)); ts[k]['start']=round(ns,2)
_dbg('после мин. длительности')
# --- проверка вариантов двумя движками: вариант остаётся, если оба CTC-декода интервала ближе к слову Whisper, чем к тексту
def _dec(empt):
    d=torch.load(empt); em=d['emission']; lab=list(d['labels'])[:em.shape[1]]; bl=d.get('blank',0)
    def f(a,b):
        ids=em[int(a/0.02):int(b/0.02)].argmax(-1).tolist(); o='';prev=None
        for k_ in ids:
            if k_!=prev and k_!=bl and len(lab[k_])==1 and lab[k_].isalpha(): o+=lab[k_].lower()
            prev=k_
        return o.replace('ä','a').replace('ö','o').replace('ü','u')
    return f
DA,DB=_dec(EM_A),_dec(EM_B)
def fold(w): return letters(w).replace('ä','a').replace('ö','o').replace('ü','u')
kept=0
for k,s_ in enumerate(sung):
    if not s_['var']: continue
    a,b=ts[k]['start']-0.05,min(ts[k]['end'],raw_end[k])+0.05; tw=fold(TW[s_['t']]); vw=fold(s_['var']); ok=True   # декод по собственному спетому отрезку слова (до продления конца на паузу/следующее слово)
    for f in (DA,DB):
        dcd=f(a,b)
        if not dcd or Lev.normalized_distance(dcd,vw)>=Lev.normalized_distance(dcd,tw)-0.15 or Lev.normalized_distance(dcd,vw)>0.35: ok=False   # движки должны реально слышать слово Whisper
    if not ok: s_['var']=None
    else: kept+=1
print(f"вариантов подтверждено движками: {kept}")
# --- маршрут: проходы = непрерывные отрезки одной строки; первое произнесение строки — полное (недостающие слова — нулевой интервал у соседа)
passes=[]; prev_t=-1
for k,s_ in enumerate(sung):
    i,j,kk=TIDX[s_['t']]
    if passes and passes[-1]['s']==i and passes[-1]['l']==j and kk>passes[-1]['k'][-1]: passes[-1]['k'].append(kk); passes[-1]['idx'].append(k)
    else: passes.append({"s":i,"l":j,"k":[kk],"idx":[k],"repeat":s_['t']<=prev_t})   # возврат назад = повтор; иначе первое произнесение
    prev_t=s_['t']
out_route=[]; variants=[]
for p in passes:
    n_words=len(song['stanzas'][p['s']]['lines_de'][p['l']].split()); w=[None]*n_words
    for kk,k in zip(p['k'],p['idx']):
        w[kk]=[ts[k]['start'],ts[k]['end']]
        if sung[k]['var']: variants.append({"s":p['s'],"l":p['l'],"k":kk,"w":TW[sung[k]['t']],"heard":sung[k]['var'],"start":ts[k]['start']})
    # неспетые в этом проходе слова остаются null (певец может разорвать строку: «…ihr Bild,» — «ihr Bild dahin»); нулевые интервалы запрещены — плеер склейкой пауз растягивал бы их в ложную подсветку
    if not re.search(r'[A-Za-zÄÖÜäöüß]', song['stanzas'][p['s']]['lines_de'][p['l']].split()[p['k'][0]]) and False: pass
    # слова без букв (тире) — нулевой интервал у начала следующего слова
    lw=song['stanzas'][p['s']]['lines_de'][p['l']].split()
    for kk in range(n_words):
        if not letters(lw[kk]) and w[kk] is not None:   # «без букв» — по сложенным буквам (è, à — слова!)
            nx=[w[q][0] for q in range(kk+1,n_words) if w[q]]; t_=nx[0] if nx else w[kk][1]; w[kk]=[t_,t_]
    out_route.append({"s":p['s'],"l":p['l'],"w":w})
perf=[p for p in json.load(open(f'{ROOT}/app/src/data/performances.json'))[spec['key']] if p['videoId']==VID][0]
out={"d":spec['d'],"videoId":VID,"performance":f"{perf['name']}, {perf['year']}",
 "method":"demucs htdemucs vocals -> Whisper large-v3 (слова с таймкодами) -> сопоставление со стихами ДП с повторами и подстановками -> окна по Whisper -> CTC (MMS_FA + wav2vec2-xlsr-53-german) буквами спетого слова -> ДП по слову -> атаки, концы, мин. длительность; частичные проходы для повторов слов",
 "verified_by_ear":False,"note":"Маршрут и варианты — по распознаванию Whisper; на слух не проверено."+(" Недостающие проходы вставлены по консенсусу записей песни (без якорей Whisper)." if CONS and added else ""),"extra_lines":[],"variants":variants,"route":out_route,
 "anchored":sum(1 for s_ in sung if s_['wi'] is not None)}   # число слов с якорем Whisper — для консенсуса записей (consensus.py)
path=f"{os.environ.get('OUT_DIR') or ROOT+'/app/src/data/timings'}/{spec['prefix']}-{VID}.json"; json.dump(out,open(path,'w'),ensure_ascii=False,indent=1)   # OUT_DIR — тестовый прогон без записи в app/
flat=[iv for p in out_route for iv in p['w'] if iv]
bad=sum(1 for a,b in flat if b<a); ovl=sum(1 for i in range(1,len(flat)) if flat[i][0]<flat[i-1][1]-1e-9)
partial=sum(1 for p in passes if p['repeat'])
print(f"проходов {len(out_route)} (частичных {partial}); целостность: вывернутых {bad}, наложений {ovl}; записан {path}")
for p in passes:
    if p['repeat'] and len(p['k'])<len(song['stanzas'][p['s']]['lines_de'][p['l']].split()): print(f"   частичный повтор {p['s']}:{p['l']}[{','.join(map(str,p['k']))}] @{ts[p['idx'][0]]['start']:.1f}")
for v in variants: print(f"   вариант {v['s']+1}.{v['l']+1} {v['w']} → «{v['heard']}» @{v['start']:.1f}")
json.dump([{"w":words[k],"li":li[k],"start":ts[k]['start'],"end":ts[k]['end'],"src":"AB"[choice[k]],"anchor":anch[k],"var":sung[k]['var']} for k in range(K)],open(f'ts_wh_{VID}.json','w'),ensure_ascii=False,indent=0)
