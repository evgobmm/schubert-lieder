# минимальная длительность слова 0.12 с за счёт длинного соседа; обновление файла сайта; очередь прослушивания
import json, sys
ROOT='/workspaces/schubert-lieder'; MIN=0.12
li=json.load(open('lineidx.json'))
for v in sys.argv[1:]:
    t=json.load(open(f'ts_{v}.json')); N=len(t); fixed=[]
    for k in range(N):
        d=t[k]['end']-t[k]['start']
        if d>=MIN: continue
        prv=t[k-1] if k else None; nxt=t[k+1] if k+1<N else None
        ns=t[k]['end']-MIN
        if prv and ns>=prv['start']+0.3:                       # забрать у длинного предыдущего
            prv['end']=min(prv['end'],round(ns,2)); t[k]['start']=round(ns,2); fixed.append((k,'←'))
        elif nxt and nxt['end']-(t[k]['start']+MIN)>=0.3:      # или отодвинуть следующее
            nxt['start']=round(t[k]['start']+MIN,2); t[k]['end']=nxt['start']; fixed.append((k,'→'))
    path=f'{ROOT}/app/src/data/timings/d118-{v}.json'; P=json.load(open(path)); k=0
    for p in P['route']:
        for q in range(len(p['w'])): p['w'][q]=[t[k]['start'],t[k]['end']]; k+=1
    assert k==N
    flat=[[r['start'],r['end']] for r in t]
    assert not any(b<a for a,b in flat) and not any(flat[i][0]<flat[i-1][0] for i in range(1,N)) and not any(flat[i][0]<flat[i-1][1]-1e-9 for i in range(1,N))
    queue=[k for k in range(N) if abs(t[k]['start']-t[k]['tmpl'])>0.3 or t[k]['end']-t[k]['start']<0.15]
    P['note']=(f"Маршрут ссылается на опубликованный текст (повторы Шуберта в строфах 10–11). Разметка получена конвейером с шаблоном Сэмпсон; "
               f"на слух не проверена; очередь прослушивания — {len(queue)} слов (planning/audio/README.md).")
    json.dump(P,open(path,'w'),ensure_ascii=False,indent=1); json.dump(t,open(f'ts_{v}.json','w'),ensure_ascii=False,indent=0)
    print(f"[{v}] мин. длительность применена к {len(fixed)} словам: "+", ".join(f"{li[k]}·{t[k]['w']}{a}" for k,a in fixed)+f" | очередь {len(queue)}: "+", ".join(f"{li[k]}·{t[k]['w']}@{t[k]['start']}" for k in queue))
