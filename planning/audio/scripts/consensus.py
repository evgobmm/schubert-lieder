# Консенсус маршрута по строфам среди записей песни и решение по каждой записи.
# consensus.py <song.json> <dir с <prefix>-<vid>.json> <prefix> vid... -> route_consensus.json, decisions.txt
# Голосуют записи, у которых в строфе есть её первая строка; большинство; при равенстве — запись с наибольшим числом якорей Whisper.
# Решение: own==консенсус -> «свой»; свой маршрут — подпоследовательность консенсуса (только недостающие проходы) -> «починка»;
# иначе (лишние/другие проходы, или Whisper-слов < 60 % консенсусных) -> «запасной».
import json, sys, os, difflib
from collections import Counter
SONG, DIR, PREFIX = sys.argv[1], sys.argv[2], sys.argv[3]; vids=sys.argv[4:]
song=json.load(open(SONG)); S=len(song['stanzas'])
import unicodedata
def _has_letters(w): return any(c.isalpha() for c in unicodedata.normalize('NFD',w))
def lettered(s,l): return [k for k,w in enumerate(song['stanzas'][s]['lines_de'][l].split()) if _has_letters(w)]   # индексы слов с буквами (тире — не слово)
def nwords(s,l): return len(lettered(s,l))
routes={}; anchors={}; ownw={}
for v in vids:
    t=json.load(open(f'{DIR}/{PREFIX}-{v}.json'))
    routes[v]=[(p['s'],p['l'],tuple(k for k,x in enumerate(p['w']) if x and k in lettered(p['s'],p['l']))) for p in t['route']]
    anchors[v]=t.get('anchored',0); ownw[v]=sum(1 for p in t['route'] for x in p['w'] if x)
cons=[]; report=[]
for st in range(S):
    seqs={v:tuple((l,k) for s_,l,k in r if s_==st) for v,r in routes.items()}
    voters={v:q for v,q in seqs.items() if q and q[0][0]==0}
    if not voters: voters={v:q for v,q in seqs.items() if q}
    if not voters: report.append(f"строфа {st+1}: ни одна запись не спела"); continue
    cnt=Counter(voters.values()); top=max(cnt.values()); cands=[q for q,c in cnt.items() if c==top]
    best=max(cands,key=lambda q: max(anchors[v] for v,qq in voters.items() if qq==q))
    for l,k in best: cons.append({"s":st,"l":l,"k":list(k)})
    fmt=lambda l,k: f"{st}:{l}"+('' if len(k)==nwords(st,l) else '['+','.join(map(str,k))+']')
    report.append(f"строфа {st+1}: {top}/{len(voters)} голосов за "+' '.join(fmt(l,k) for l,k in best)+("" if top>1 else "  (все разные — взята запись с наибольшим числом якорей)"))
json.dump(cons,open('route_consensus.json','w'))
print('\n'.join(report)); print('консенсус:',len(cons),'проходов')
cw=sum(len(p['k']) for p in cons); b=[f"{p['s']}:{p['l']}" for p in cons]; dec={}
for v,r in routes.items():
    a=[f"{s_}:{l}" for s_,l,k in r]; same=[(s_,l,list(k)) for s_,l,k in r]==[(p['s'],p['l'],p['k']) for p in cons]
    ops=[o for o in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes() if o[0]!='equal']
    subseq=all(o[0]=='insert' for o in ops); share=anchors[v]/cw if cw else 0
    # надёжность своего маршрута — по ЕГО словам (якорей ≥ 70 % спетых слов, ≥ 10 слов); надёжный, но короче консенсуса — фрагмент
    # (певец поёт меньше строф или запись обрезана): публикуется как свой. Раньше доля считалась от слов консенсуса, и фрагмент уходил
    # на запасной путь, растягивавший полный текст на короткую запись (D 399, Фишер-Дискау: 4 строфы на 90 с одной).
    rel=anchors[v]/ownw[v] if ownw.get(v) else 0
    if same: dec[v]='свой'
    elif rel>=0.7 and ownw[v]>=10 and ownw[v]<0.8*cw: dec[v]=f'свой фрагмент: спето {ownw[v]} из {cw} слов консенсуса'
    elif share>=0.6: dec[v]='починка'
    else: dec[v]='запасной'   # структура своя (певец повторяет иначе, чем большинство) — не повод навязывать консенсус: починка лишь добавляет недостающие проходы по звуку
    print(f"  {v}: {'совпадает с консенсусом' if same else ('не хватает проходов: '+' '.join(' '.join(b[o[3]:o[4]]) for o in ops) if subseq else 'иная структура: '+' '.join(f'{o[0]} {a[o[1]:o[2]]}->{b[o[3]:o[4]]}' for o in ops))}; якорей Whisper {anchors[v]} из {cw} слов ({share:.0%}) -> {dec[v].upper()}")
open('decisions.txt','w').write('\n'.join(f"{v} {d}" for v,d in dec.items())+'\n')
