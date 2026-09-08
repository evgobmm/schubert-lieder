# Сводка по партии: batch_report.py <каталог songs> <prefix…> — по каждой песне: решения по записям, дыры, варианты,
# купюры и вставки (признаки несовпадения текста с тем, что поют). Печатает таблицу и пишет songs/report.md
import json, re, sys, os
SONGS, prefixes = sys.argv[1], sys.argv[2:]; R = '/workspaces/schubert-lieder'
perf = json.load(open(f'{R}/app/src/data/performances.json'))
rows = ["| песня | записей | свой / починка / запасной | дыр | вариантов | купюр | вставок | внимание |", "|---|---|---|---|---|---|---|---|"]
for p in prefixes:
    d = json.load(open(f'{SONGS}/{p}/spec.json'))['key']; log = open(f'{SONGS}/{p}/finish.log', encoding='utf-8', errors='replace').read() if os.path.exists(f'{SONGS}/{p}/finish.log') else ''
    dec = dict(l.split(' ', 1) for l in open(f'{SONGS}/{p}/decisions.txt').read().strip().split('\n')) if os.path.exists(f'{SONGS}/{p}/decisions.txt') else {}
    c = {'свой': 0, 'починка': 0, 'запасной': 0}
    for v in dec.values(): c[v.split()[0]] += 1
    holes = sum(int(m) for m in re.findall(r'дыр(?: после запасного пути)? (\d+)', log)); holes_final = sum(int(m) for m in re.findall(r': дыр после запасного пути (\d+)', log)) or 0
    cuts = len(re.findall(r'купюра певца', log)); ins = sum(int(m) for m in re.findall(r'вставок (\d+)', log))
    variants = 0
    for v in dec:
        f = f'{R}/app/src/data/timings/{p}-{v}.json'
        if os.path.exists(f): variants += len(json.load(open(f)).get('variants', []))
    flags = []
    if c['запасной']: flags.append(f"запасной путь у {c['запасной']}")
    if cuts: flags.append(f"купюры ({cuts}) — певец пропускает или текст не тот")
    if ins > 3 * max(1, len(dec)): flags.append(f"много вставок ({ins}) — текст не совпадает с тем, что поют?")
    if 'Traceback' in log or 'ОШИБКА' in log: flags.append('ОШИБКА в логе')
    if 'НЕТ ФАЙЛА' in log: flags.append('нет файла у записи')
    held=len(re.findall(r'УДЕРЖАНО',log))
    if held: flags.append(f'удержано {held} (дыр > порога)')
    missing=[v for v in dec if not os.path.exists(f'{R}/app/src/data/timings/{p}-{v}.json')]
    if missing: flags.append(f'нет файлов: {len(missing)}')
    if not os.path.exists(f'{SONGS}/{p}/decisions.txt'): flags.append('не собрана')
    rows.append(f"| D {d} | {len(perf.get(d, []))} | {c['свой']} / {c['починка']} / {c['запасной']} | {holes_final if 'после запасного пути' in log else holes} | {variants} | {cuts} | {ins} | {'; '.join(flags) or '—'} |")
out = '\n'.join(rows); print(out); open(f'{SONGS}/report.md', 'w').write(f"# Сводка партии\n\n{out}\n")
