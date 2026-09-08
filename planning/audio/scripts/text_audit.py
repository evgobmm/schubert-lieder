# Сверка «что поют ↔ что на сайте» по выходам конвейера: text_audit.py <каталог songs> <выход.md> [prefix…]
# (1) строки текста, которых нет в маршруте ни одной записи (никто не поёт — лишние строфы на сайте?);
# (2) цепочки слов Whisper без пары в тексте (вставки) длиной ≥ 4 слов — спетое, чего нет в тексте; цепочка весомее, если похожая есть
#     ещё в другой записи той же песни. Служебные галлюцинации Whisper (титры и т.п.) отбрасываются. Итог отсортирован по тяжести.
import json, sys, os, glob, re, unicodedata
from rapidfuzz import fuzz
SONGS, OUT, prefixes = sys.argv[1], sys.argv[2], sys.argv[3:]; SP = os.path.dirname(os.path.abspath(SONGS))
SERVICE = ('untertitel', 'amara', 'vielen dank', 'copyright', 'abonn', 'zdf', 'www.', 'http', 'transcri')
def fold(w):
    o = ''
    for ch in w.lower().replace('ß', 'ss'):
        o += ch if ch in 'äöü' else ''.join(c for c in unicodedata.normalize('NFD', ch) if not unicodedata.combining(c))
    return re.sub(r'[^a-zäöü ]', '', o)
rows = []
for d in sorted(glob.glob(f'{SONGS}/*/')):
    p = os.path.basename(d.rstrip('/'))
    if prefixes and p not in prefixes: continue
    if not os.path.exists(f'{d}/spec.json') or not os.path.exists(f'{d}/vids.txt'): continue
    spec = json.load(open(f'{d}/spec.json')); song = json.load(open(spec['song'])); vids = open(f'{d}/vids.txt').read().split()
    lines = {(i, j): l for i, st in enumerate(song['stanzas']) for j, l in enumerate(st['lines_de']) if any(c.isalpha() for c in l)}
    sung = set(); runs = []; nrec = 0
    for v in vids:
        ts_p = f'{d}/own/wh_{v}/ts_wh_{v}.json'; wh_p = f'{SP}/align/wh_{v}.json'
        if not (os.path.exists(ts_p) and os.path.exists(wh_p)): continue
        ts = json.load(open(ts_p)); nrec += 1
        for x in ts:
            if x.get('anchor'): sung.add(tuple(map(int, x['li'].split(':'))))
        anchors = sorted(tuple(x['anchor']) for x in ts if x.get('anchor'))
        words = [w for s in json.load(open(wh_p)) for w in s.get('words', [])]
        ins = []
        for w in words:
            if any(a - 0.06 <= w['start'] <= b + 0.06 or a - 0.06 <= w['end'] <= b + 0.06 for a, b in anchors): continue
            ins.append(w)
        cur = []
        for w in ins + [None]:
            if w is not None and (not cur or w['start'] - cur[-1]['end'] < 1.5): cur.append(w); continue
            if len(cur) >= 4:
                txt = ' '.join(x['w'] for x in cur)
                if not any(s in txt.lower() for s in SERVICE) and len(fold(txt).replace(' ', '')) >= 15: runs.append((v, round(cur[0]['start']), txt))
            cur = [w] if w is not None else []
    if os.path.exists(f'{d}/route_consensus.json'):
        for ps in json.load(open(f'{d}/route_consensus.json')): sung.add((ps['s'], ps['l']))
    if nrec == 0: continue
    unsung = [(k, lines[k]) for k in lines if k not in sung]
    # цепочки, похожие между записями
    scored = []
    for i, (v, t0, txt) in enumerate(runs):
        others = {v2 for j, (v2, _, txt2) in enumerate(runs) if v2 != v and fuzz.token_set_ratio(fold(txt), fold(txt2)) >= 60}
        scored.append((len(others), v, t0, txt))
    scored.sort(key=lambda x: (-x[0], x[2]))
    sev = 3 * sum(1 + o for o, *_ in scored) + (1 if unsung else 0)   # главное — спетое, чего нет в тексте; непропетые строфы — обычная практика (певец опускает строфы)
    if sev: rows.append((sev, p, spec['key'], song.get('title_de', p), nrec, len(vids), unsung, scored))
rows.sort(key=lambda r: -r[0])
out = ['# Сверка текста сайта с тем, что поют (по Whisper и маршрутам записей)', '',
       'Автоматическая оценка по выходам конвейера, на слух не проверено. «Никто не поёт» — строка отсутствует в маршрутах всех записей '
       '(лишняя строфа на сайте или все певцы её пропускают). «Поют, а в тексте нет» — цепочка слов Whisper (≥ 4) без пары в тексте; '
       '«ещё в N записях» — похожая цепочка есть у других записей той же песни. Отсортировано по тяжести.', '']
for sev, p, d, title, nrec, nv, unsung, scored in rows:
    out.append(f'## D {d} — {title} (тяжесть {sev}; записей с Whisper {nrec} из {nv})')
    if unsung: out.append(f'- никто не поёт ({len(unsung)} строк): ' + '; '.join(f'{s+1}.{l+1} «{txt}»' for (s, l), txt in unsung[:12]) + (' …' if len(unsung) > 12 else ''))
    for o, v, t0, txt in scored[:8]: out.append(f'- поют, а в тексте нет (`{v}` @{t0} с{", ещё в %d записях" % o if o else ""}): «{txt[:160]}»')
    out.append('')
open(OUT, 'w').write('\n'.join(out)); print(f'песен с расхождениями: {len(rows)} из проверенных; файл {OUT}')
