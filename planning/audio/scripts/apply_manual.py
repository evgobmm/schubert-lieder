# Ручные правки таймингов по слуху пользователя: apply_manual.py <prefix> [файл сайта…]
# planning/audio/manual/<prefix>-<vid>.json = {"note": "...", "passes": [{"s","l","n": порядковый номер прохода этой строки (0 — первый),
#   "w": [[start,end],…] по словам строки (null — без времени), "variants": [{"k","heard"}] — спетые слова на позициях (порядок певца)}]}
# Правка накладывается поверх файла сайта после любой пересборки (finish_control.sh, точечные сборки), чтобы её не затирало.
import json, sys, os, glob
R = '/workspaces/schubert-lieder'; prefix = sys.argv[1]; files = sys.argv[2:] or sorted(glob.glob(f'{R}/app/src/data/timings/{prefix}-*.json'))
n = 0
for f in files:
    vid = os.path.basename(f)[len(prefix) + 1:-5]; mp = f'{R}/planning/audio/manual/{prefix}-{vid}.json'
    if not os.path.exists(mp): continue
    m = json.load(open(mp, encoding='utf-8')); t = json.load(open(f, encoding='utf-8'))
    for pt in m.get('passes', []):
        same = [ps for ps in t['route'] if ps['s'] == pt['s'] and ps['l'] == pt['l']]
        if pt.get('n', 0) >= len(same): print(f'{vid}: прохода {pt["s"]}:{pt["l"]} №{pt.get("n",0)} нет'); continue
        ps = same[pt.get('n', 0)]
        if 'w' in pt: ps['w'] = pt['w']
        for vv in pt.get('variants', []):
            t.setdefault('variants', [])
            t['variants'] = [x for x in t['variants'] if not (x['s'] == pt['s'] and x['l'] == pt['l'] and x['k'] == vv['k'] and abs(x.get('start', -1) - (ps['w'][vv['k']][0] if ps['w'][vv['k']] else -2)) < 0.05)]
            lw = None
            t['variants'].append({"s": pt['s'], "l": pt['l'], "k": vv['k'], "w": vv.get('w', ''), "heard": vv['heard'], "start": ps['w'][vv['k']][0] if ps['w'][vv['k']] else 0, "manual": True})
    t['manual'] = m.get('note', 'ручная правка по слуху')
    json.dump(t, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); n += 1; print(f'{vid}: ручная правка наложена ({m.get("note","")[:60]})')
print(f'ручных правок наложено: {n}')
