# Распознаватель-первичен: Whisper-слова -> сопоставление со стихами (повторы, варианты) -> окна по таймкодам Whisper
# -> CTC-выравнивание двух движков буквами спетого -> ДП по слову -> атаки -> концы -> файл сайта (частичные проходы, variants)
import json, sys, re, numpy as np, soundfile as sf, torch
from torchaudio.functional import forced_align, merge_tokens
from rapidfuzz.distance import Levenshtein as Lev
SPEC,VID,WH,WAV,EM_A,EM_B=sys.argv[1:7]
ROOT='/workspaces/schubert-lieder'; spec=json.load(open(SPEC)); song=json.load(open(spec['song']))
lines=[(i,j,l) for i,st in enumerate(song['stanzas']) for j,l in enumerate(st['lines_de'])]
TW=[];TIDX=[]   # слова текста и их адреса (s,l,k)
for i,j,l in lines:
    for k,w in enumerate(l.split()): TW.append(w); TIDX.append((i,j,k))
N=len(TW)
def letters(w): return re.sub(r"[^a-zäöüß]","",w.lower().replace('ß','ss'))
TL=[letters(w) for w in TW]
# --- Whisper
wh=json.load(open(WH)); W=[w for s in wh for w in s['words'] if letters(w['w'])]
M=len(W); WL=[letters(w['w']) for w in W]
# --- сопоставление: состояние = позиция в тексте j; переходы: продолжение (j+1), возврат/прыжок к любому j' (штраф по дальности в строках), вставка (слово Whisper вне текста)
INF=1e9
def ldist(a,b): return abs(TIDX[a][0]*10+TIDX[a][1]-(TIDX[b][0]*10+TIDX[b][1]))
cost=[[Lev.normalized_distance(WL[i],TL[j]) for j in range(N)] for i in range(M)]
best=[[INF]*N for _ in range(M)]; back=[[None]*N for _ in range(M)]
for j in range(N): best[0][j]=cost[0][j]+0.3*ldist(0,j)
INS=0.9   # слово Whisper без пары в тексте (галлюцинация/междометие) — «поглощается» текущей позицией
for i in range(1,M):
    for j in range(N):
        c=cost[i][j]; b=INF; bp=None
        if best[i-1][j-1 if j>0 else 0]<INF and j>0 and best[i-1][j-1]+c<b: b=best[i-1][j-1]+c; bp=(j-1,'c')            # продолжение
        if best[i-1][j]+INS+c*0<b and best[i-1][j]<INF: pass
        for jp in range(N):                                                                                             # прыжок (повтор назад / вперёд)
            if jp==j-1 or best[i-1][jp]>=INF: continue
            if j>jp:
                gap=j-jp-1                                                   # пропущено слов текста
                pen=0.8*gap if gap<=2 else 2.5+0.35*ldist(jp,j)              # 1–2 неуслышанных слова — дёшево; дальше — дорого
            else: pen=1.2+0.35*ldist(jp,j)                                   # возврат (повтор)
            if best[i-1][jp]+pen+c<b: b=best[i-1][jp]+pen+c; bp=(jp,'j')
        if best[i-1][j]<INF and best[i-1][j]+INS<b: b=best[i-1][j]+INS; bp=(j,'i')                                      # вставка: Whisper-слово лишнее
        best[i][j]=b; back[i][j]=bp
j=min(range(N),key=lambda x: best[M-1][x]); path=[]
for i in range(M-1,-1,-1):
    path.append((i,j,back[i][j][1] if back[i][j] else 'c')); 
    if back[i][j]: j=back[i][j][0]
path=path[::-1]
# спетая последовательность: каждое Whisper-слово (кроме вставок) -> слово текста; повторное посещение = повтор
sung=[]   # {t: индекс текста, wi: индекс Whisper-слова}
for i,j,kind in path:
    if kind=='i': continue
    sung.append({"t":j,"wi":i})
# ложные одиночные повторы: возврат ради одного слова, которое Whisper слышит плохо (d>0.2), — это вставка, не повтор
clean=[]
for idx,s_ in enumerate(sung):
    prv=sung[idx-1]['t'] if idx else -1; nxt=sung[idx+1]['t'] if idx+1<len(sung) else 10**9
    if s_['t']>prv+1 and s_['wi'] is not None and Lev.normalized_distance(WL[s_['wi']],TL[s_['t']])>0.2: continue   # прыжок вперёд ради плохо услышанного слова — вставка
    clean.append(s_)
sung=clean
# пропущенные слова текста между соседними посещениями (Whisper их не услышал) — вставляем без якоря
filled=[]
for a,b in zip(sung,sung[1:]+[None]):
    filled.append(a)
    if b and 1<b['t']-a['t']<=3:
        for t in range(a['t']+1,b['t']): filled.append({"t":t,"wi":None})
sung=filled
# варианты: Whisper уверенно слышит другое слово
for s_ in sung:
    if s_['wi'] is None: s_['var']=None; continue
    w=W[s_['wi']]; d=Lev.normalized_distance(WL[s_['wi']],TL[s_['t']])
    # вариант — только целое слово: не склейка соседних слов текста и не обрывок (длины сопоставимы), уверенность Whisper ≥0.7
    nb=[TL[s_['t']]+TL[s_['t']+1] if s_['t']+1<N else '', TL[s_['t']-1]+TL[s_['t']] if s_['t']>0 else '']
    merged=any(x and Lev.normalized_distance(WL[s_['wi']],x)<0.35 for x in nb)
    s_['var']=W[s_['wi']]['w'] if (d>=0.25 and w['p']>=0.7 and len(WL[s_['wi']])>=4 and len(TL[s_['t']])>=4 and abs(len(WL[s_['wi']])-len(TL[s_['t']]))<=3 and not merged) else None
words=[TW[s_['t']] for s_ in sung]; li=[f"{TIDX[s_['t']][0]}:{TIDX[s_['t']][1]}" for s_ in sung]; slots=[TIDX[s_['t']][2] for s_ in sung]
json.dump(words,open('words.json','w'),ensure_ascii=False); json.dump(li,open('lineidx.json','w')); json.dump(slots,open('slots.json','w'))
print(f"Whisper-слов {M}, спето слов {len(sung)}, вставок {sum(1 for _,_,k in path if k=='i')}, без якоря {sum(1 for s_ in sung if s_['wi'] is None)}, вариантов {sum(1 for s_ in sung if s_['var'])}: "+", ".join(f"{TW[s_['t']]}→{s_['var']}" for s_ in sung if s_['var']))
# --- акустика
x,_=sf.read(WAV,dtype='float32'); n=len(x)//160; env=np.sqrt((x[:n*160].reshape(n,160)**2).mean(1))
anch=[(W[s_['wi']]['start'],W[s_['wi']]['end']) if s_['wi'] is not None else None for s_ in sung]
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
groups=[];cur=[]
for k,s_ in enumerate(sung):
    if cur and anch[k] and anch[cur[-1]] and anch[k][0]-anch[cur[-1]][1]>0.8: groups.append(cur); cur=[]
    cur.append(k)
if cur: groups.append(cur)
FB={'ä':'a','ö':'o','ü':'u','ß':'ss'}
def windowed(empt):
    d=torch.load(empt); em=d['emission']; labels=list(d['labels'])[:em.shape[1]]; blank=d.get('blank',0); dic={c:i for i,c in enumerate(labels)}
    def norm(w):
        o=''
        for c in w.lower():
            if c in dic and c!='|': o+=c
            elif c in FB: o+=''.join(ch for ch in FB[c] if ch in dic)
        return ''.join(ch for ch in o if ch.isalpha() or ch=="'")
    res=[None]*len(sung)
    for g in groups:
        an=[anch[k] for k in g if anch[k]]
        if not an: continue
        t0=max(0.0,min(a for a,b in an)-0.5); t1=min(n/100,max(b for a,b in an)+0.6)
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
    if anch[k]: sc-=2.0*max(0.0,abs(t-anch[k][0])-0.35)          # якорь Whisper — мягкий
    return sc
NEG=-1e9; dp=[[NEG,NEG] for _ in range(K)]; bp=[[None,None] for _ in range(K)]
for c in (0,1): dp[0][c]=unary(0,c)
for k in range(1,K):
    for c in (0,1):
        t=C[c][k]['start']; u=unary(k,c)
        for pc in (0,1):
            if dp[k-1][pc]>NEG and t>=C[pc][k-1]['start']+0.02 and dp[k-1][pc]+u>dp[k][c]: dp[k][c]=dp[k-1][pc]+u; bp[k][c]=pc
c=0 if dp[K-1][0]>=dp[K-1][1] else 1; choice=[0]*K
for k in range(K-1,-1,-1):
    choice[k]=c
    if k>0: c=bp[k][c]
ts=[dict(C[choice[k]][k]) for k in range(K)]
if max(dp[K-1])==NEG:  # порядок не сошёлся — берём основной движок и чиним порядок
    ts=[dict(WA[k]) for k in range(K)]
raw_end=[r['end'] for r in ts]
for k,r in enumerate(ts):
    nxt=ts[k+1]['start'] if k+1<K else r['end']+0.5; prv_end=raw_end[k-1] if k else 0.0; s=r['start']
    if m(s,s+0.05)<0.25:
        j=int(s*100); lim=int((nxt-0.02)*100)
        while j<lim and V[j:j+3].max()<0.25: j+=1
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
for k in range(1,K):
    if ts[k]['start']<ts[k-1]['start']+0.02: ts[k]['start']=round(ts[k-1]['start']+0.02,2)
    if ts[k]['end']<ts[k]['start']: ts[k]['end']=ts[k]['start']
for k,r in enumerate(ts):
    nxt=ts[k+1]['start'] if k+1<K else r['end']+0.5; b=r['end']; j=int(b*100); end=b; sil=0; limit=int(min(nxt,b+8)*100)
    while j<min(limit,n):
        if V[j]<0.20:
            sil+=0.01
            if sil>=0.12: break
        else: sil=0; end=(j+1)/100
        j+=1
    r['end']=round(min(max(end,b),nxt),2)
for k in range(K-1):
    if ts[k]['end']>ts[k+1]['start']: ts[k]['end']=ts[k+1]['start']
MIN=0.12
for k in range(K):
    if ts[k]['end']-ts[k]['start']<MIN:
        prv=ts[k-1] if k else None; ns=ts[k]['end']-MIN
        if prv and ns>=prv['start']+0.3: prv['end']=min(prv['end'],round(ns,2)); ts[k]['start']=round(ns,2)
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
    a,b=ts[k]['start']-0.05,ts[k]['end']+0.05; tw=fold(TW[s_['t']]); vw=fold(s_['var']); ok=True
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
    if not p['repeat']:                                  # первое произнесение — полное: неуслышанные слова получают нулевой интервал у соседа
        for kk in range(n_words):
            if w[kk] is None:
                prev=[w[q] for q in range(kk) if w[q]]; nxt=[w[q] for q in range(kk+1,n_words) if w[q]]
                e=prev[-1][1] if prev else (nxt[0][0] if nxt else 0.0); w[kk]=[e,e]
    if not re.search(r'[A-Za-zÄÖÜäöüß]', song['stanzas'][p['s']]['lines_de'][p['l']].split()[p['k'][0]]) and False: pass
    # слова без букв (тире) — нулевой интервал у начала следующего слова
    lw=song['stanzas'][p['s']]['lines_de'][p['l']].split()
    for kk in range(n_words):
        if not re.search(r'[A-Za-zÄÖÜäöüß]',lw[kk]) and w[kk] is not None:
            nx=[w[q][0] for q in range(kk+1,n_words) if w[q]]; t_=nx[0] if nx else w[kk][1]; w[kk]=[t_,t_]
    out_route.append({"s":p['s'],"l":p['l'],"w":w})
perf=[p for p in json.load(open(f'{ROOT}/app/src/data/performances.json'))[spec['key']] if p['videoId']==VID][0]
out={"d":spec['d'],"videoId":VID,"performance":f"{perf['name']}, {perf['year']}",
 "method":"demucs htdemucs vocals -> Whisper large-v3 (слова с таймкодами) -> сопоставление со стихами ДП с повторами и подстановками -> окна по Whisper -> CTC (MMS_FA + wav2vec2-xlsr-53-german) буквами спетого слова -> ДП по слову -> атаки, концы, мин. длительность; частичные проходы для повторов слов",
 "verified_by_ear":False,"note":"Маршрут и варианты — по распознаванию Whisper; на слух не проверено.","extra_lines":[],"variants":variants,"route":out_route}
path=f"{ROOT}/app/src/data/timings/{spec['prefix']}-{VID}.json"; json.dump(out,open(path,'w'),ensure_ascii=False,indent=1)
flat=[iv for p in out_route for iv in p['w'] if iv]
bad=sum(1 for a,b in flat if b<a); ovl=sum(1 for i in range(1,len(flat)) if flat[i][0]<flat[i-1][1]-1e-9)
partial=sum(1 for p in passes if p['repeat'])
print(f"проходов {len(out_route)} (частичных {partial}); целостность: вывернутых {bad}, наложений {ovl}; записан {path}")
for p in passes:
    if p['repeat'] and len(p['k'])<len(song['stanzas'][p['s']]['lines_de'][p['l']].split()): print(f"   частичный повтор {p['s']}:{p['l']}[{','.join(map(str,p['k']))}] @{ts[p['idx'][0]]['start']:.1f}")
for v in variants: print(f"   вариант {v['s']+1}.{v['l']+1} {v['w']} → «{v['heard']}» @{v['start']:.1f}")
json.dump([{"w":words[k],"li":li[k],"start":ts[k]['start'],"end":ts[k]['end'],"src":"AB"[choice[k]],"anchor":anch[k],"var":sung[k]['var']} for k in range(K)],open(f'ts_wh_{VID}.json','w'),ensure_ascii=False,indent=0)
