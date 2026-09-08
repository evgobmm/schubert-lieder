# плоские тайминги: минимальная длительность слова 0.12 с за счёт длинного соседа; проверка; очередь прослушивания
import json, sys
MIN=0.12; inp,out=sys.argv[1:3]; li=json.load(open('lineidx.json'))
t=json.load(open(inp)); N=len(t); fixed=[]
for k in range(N):
    d=t[k]['end']-t[k]['start']
    if d>=MIN: continue
    prv=t[k-1] if k else None; nxt=t[k+1] if k+1<N else None; ns=t[k]['end']-MIN
    if prv and ns>=prv['start']+0.3: prv['end']=min(prv['end'],round(ns,2)); t[k]['start']=round(ns,2); fixed.append(k)
    elif nxt and nxt['end']-(t[k]['start']+MIN)>=0.3: nxt['start']=round(t[k]['start']+MIN,2); t[k]['end']=nxt['start']; fixed.append(k)
# целостность: вывернутое слово (end < start — грубая привязка запасного пути) и наложение на соседа не валят запись (раньше — assert,
# и файл не создавался: 20 песен партии 4), а чинятся: начало не раньше конца предыдущего, конец не раньше начала + 0.05 с
inv=ovl=0
for k in range(N):
    if k and t[k]['start']<t[k-1]['end']-1e-9: t[k]['start']=round(t[k-1]['end'],2); ovl+=1
    if t[k]['end']<t[k]['start']: t[k]['end']=round(t[k]['start']+0.05,2); inv+=1
flat=[[r['start'],r['end']] for r in t]
assert not any(b<a for a,b in flat) and not any(flat[i][0]<flat[i-1][1]-1e-9 for i in range(1,N)), "целостность"
if inv or ovl: print(f"целостность починена: вывернутых {inv}, наложений {ovl}")
q=[k for k in range(N) if t[k]['end']-t[k]['start']<0.15 or ('tmpl' in t[k] and abs(t[k]['start']-t[k]['tmpl'])>0.3)]
json.dump(t,open(out,'w'),ensure_ascii=False,indent=0)
print(f"мин. длительность: {len(fixed)} слов; очередь {len(q)}: "+", ".join(f"{li[k]}·{t[k]['w']}@{t[k]['start']}" for k in q))
