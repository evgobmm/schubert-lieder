# Выложить СВОЙ маршрут записи (own/<prefix>-<vid>.json) поверх текущего файла сайта: publish_own.py <каталог songs> <список "<prefix> <vid> [пометка]">
# Для записей-фрагментов (певец поёт меньше строф, чем консенсус песни): запасной путь по консенсусу растягивал полный текст на
# короткую запись (D 399, Фишер-Дискау: 4 строфы на 90 с одной). Дыры берутся из own/holes_pure_<vid>.txt (rescue_gate.sh --list),
# в decisions.txt строка записи заменяется на «свой фрагмент …», в finish.log — «ВЫЛОЖЕН СВОЙ МАРШРУТ».
import json, sys, os, re
SONGS, LIST = sys.argv[1], sys.argv[2]; R = '/workspaces/schubert-lieder'; APP = f'{R}/app/src/data/timings'
RX = re.compile(r'^дыра(?: \(([^)]*)\))? ([0-9.]+)–([0-9.]+) \(([0-9.]+) с\)(.*)$')
def holes(path):
    if not os.path.exists(path): return []
    out = []
    for l in open(path, encoding='utf-8'):
        m = RX.match(l.strip())
        if m: out.append({"a": float(m.group(2)), "b": float(m.group(3)), "sec": float(m.group(4)), "why": (m.group(1) or 'между словами') + m.group(5).split(':')[0]})
    return out
n = 0
for line in open(LIST):
    parts = line.split()
    if len(parts) < 2: continue
    p, v = parts[0], parts[1]; note = ' '.join(parts[2:]); sd = f'{SONGS}/{p}'; own = f'{sd}/own/{p}-{v}.json'
    if not os.path.exists(own): print(f'{p} {v}: нет своего маршрута'); continue
    t = json.load(open(own, encoding='utf-8')); hs = holes(f'{sd}/own/holes_pure_{v}.txt')
    if hs: t['holes'] = hs
    else: t.pop('holes', None)
    json.dump(t, open(f'{APP}/{p}-{v}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    dp = f'{sd}/decisions.txt'
    if os.path.exists(dp):
        ls = [l for l in open(dp, encoding='utf-8').read().split('\n') if l.strip() and not l.startswith(v + ' ')]
        ls.append(f'{v} свой {note}'.strip()); open(dp, 'w', encoding='utf-8').write('\n'.join(ls) + '\n')
    with open(f'{sd}/finish.log', 'a', encoding='utf-8') as f: f.write(f'{v}: ВЫЛОЖЕН СВОЙ МАРШРУТ ({note}), дыр {len(hs)}\n')
    n += 1
print(f'выложено своих маршрутов: {n}')
