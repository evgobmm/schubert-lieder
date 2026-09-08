# Очереди прослушивания для партии: queues.py <каталог songs> <выходной .md> <prefix…>
# По каждой записи: способ (свой / починка / запасной), число проходов, слова без якоря Whisper, короче 0.12 с или взятые у второго движка.
# Для записей запасного пути (без Whisper) очередь — все слова короче 0.12 с (остальные критерии неприменимы).
import json, sys, os
SONGS, OUT, prefixes = sys.argv[1], sys.argv[2], sys.argv[3:]; R = '/workspaces/schubert-lieder'
perf = json.load(open(f'{R}/app/src/data/performances.json'))
out = [f"# Очереди прослушивания — партия {os.path.basename(OUT).replace('queues-', '').replace('.md', '')}", "",
       "Критерий очереди: слово без якоря Whisper, короче 0,12 с или взятое у второго движка; у записей запасного пути — слова короче 0,12 с. На слух не проверено.", ""]
for p in prefixes:
    spec = json.load(open(f'{SONGS}/{p}/spec.json')); d = spec['key']; song = json.load(open(spec['song']))
    dec = dict(l.split(' ', 1) for l in open(f'{SONGS}/{p}/decisions.txt').read().strip().split('\n')) if os.path.exists(f'{SONGS}/{p}/decisions.txt') else {}
    out.append(f"## D {d} — {song.get('title_de', p)}"); out.append("")
    for pf in perf.get(d, []):
        v = pf['videoId']; f = f'{R}/app/src/data/timings/{p}-{v}.json'
        if not os.path.exists(f): out.append(f"- {pf['name']} {pf['year']} (`{v}`) — не выложено"); continue
        t = json.load(open(f)); how = dec.get(v, '?').split()[0]
        q = []
        ts_path = f'{SONGS}/{p}/own/wh_{v}/ts_wh_{v}.json'
        if how in ('свой', 'починка') and os.path.exists(ts_path):
            for x in json.load(open(ts_path)):
                if x.get('anchor') is None or x['src'] == 'B' or x['end'] - x['start'] < 0.12:
                    s_, l_ = map(int, x['li'].split(':')); q.append(f"{s_ + 1}.{l_ + 1} {x['w']} @{x['start']:.1f}")
        else:
            for ps in t['route']:
                lw = song['stanzas'][ps['s']]['lines_de'][ps['l']].split()
                for k, iv in enumerate(ps['w']):
                    if iv and iv[1] - iv[0] < 0.12 and any(c.isalpha() for c in lw[k]): q.append(f"{ps['s'] + 1}.{ps['l'] + 1} {lw[k]} @{iv[0]:.1f}")
        cands=[f"{c['s']+1}.{c['l']+1} «{c['w']}» → «{c['heard']}» @{c['start']:.0f}с" for c in t.get('variant_candidates',[])]
        if cands: q=['ВАРИАНТЫ НА ПРОВЕРКУ: '+'; '.join(cands)]+q
        out.append(f"### {pf['name']} {pf['year']} (`{v}`) — {how}; проходов {len(t['route'])}; в очереди {len(q)} слов")
        out.append(', '.join(q) if q else '—'); out.append("")
open(OUT, 'w').write('\n'.join(out)); print(f"очереди: {OUT}")
