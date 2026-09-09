# Выкладка удержанных записей лучшей из имеющихся версий (правило от 2026-09-08 23:05): publish_held.py <каталог songs> [prefix…]
# Кандидаты: удержанный файл (held/, дыры — holes_<vid>.txt), чистый свой маршрут (own/, holes_pure_<vid>.txt), спасение (rescue/, holes_<vid>.txt).
# Лучшая = меньше дыр, при равенстве — короче самая длинная дыра. В файл сайта добавляется поле "holes": [{"a","b","sec","why"}],
# в finish.log — строка «<vid>: ВЫЛОЖЕНО С ДЫРАМИ (n)» для сводки. Уже выложенные (файл в app/) не трогаются.
import json, sys, os, glob, re, shutil
SONGS = sys.argv[1]; prefixes = sys.argv[2:]; R = '/workspaces/schubert-lieder'; APP = f'{R}/app/src/data/timings'
RX = re.compile(r'^дыра(?: \(([^)]*)\))? ([0-9.]+)–([0-9.]+) \(([0-9.]+) с\)(.*)$')
def holes(path):
    if not os.path.exists(path): return None
    out = []
    for l in open(path, encoding='utf-8'):
        m = RX.match(l.strip())
        if m: out.append({"a": float(m.group(2)), "b": float(m.group(3)), "sec": float(m.group(4)), "why": (m.group(1) or 'между словами') + m.group(5).split(':')[0]})
    return out
tot = dict(pub=0, src={}, skipped=0)
# все записи песни без файла на сайте (не только удержанные: у части записей финальный файл не создался — «НЕТ ФАЙЛА» у ворот)
for sd in sorted(glob.glob(f'{SONGS}/*/')):
    sd = sd.rstrip('/'); p = os.path.basename(sd)
    if prefixes and p not in prefixes: continue
    if not os.path.exists(f'{sd}/vids.txt'): continue
    for v in open(f'{sd}/vids.txt').read().split():
        h = f'{sd}/held/{p}-{v}.json'
        if os.path.exists(f'{APP}/{p}-{v}.json'): tot['skipped'] += 1; continue
        cands = [('удержанная', h, holes(f'{sd}/holes_{v}.txt')), ('чистый свой', f'{sd}/own/{p}-{v}.json', holes(f'{sd}/own/holes_pure_{v}.txt')),
                 ('спасение по своему маршруту', f'{sd}/rescue/{p}-{v}.json', holes(f'{sd}/rescue/holes_{v}.txt'))]
        cands = [c for c in cands if c[2] is not None and os.path.exists(c[1])]
        if not cands: print(f'{p} {v}: нет кандидатов с воротами'); continue
        name, path, hs = min(cands, key=lambda c: (len(c[2]), max([x['sec'] for x in c[2]], default=0)))
        t = json.load(open(path, encoding='utf-8')); t['holes'] = hs
        json.dump(t, open(f'{APP}/{p}-{v}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        with open(f'{sd}/finish.log', 'a', encoding='utf-8') as f: f.write(f'{v}: ВЫЛОЖЕНО С ДЫРАМИ ({len(hs)}) — версия «{name}»\n')
        tot['pub'] += 1; tot['src'][name] = tot['src'].get(name, 0) + 1
        print(f'{p} {v}: выложена версия «{name}», дыр {len(hs)}' + (f', самая длинная {max(x["sec"] for x in hs):.1f} с' if hs else ''))
print(f"выложено удержанных: {tot['pub']} ({tot['src']}); уже были на сайте: {tot['skipped']}")
