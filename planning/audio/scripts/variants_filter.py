# Фильтр вариантов текста для файлов сайта одной песни: variants_filter.py <каталог песни> [файл сайта…]
# Вариант (певец поёт не то слово, что в тексте) остаётся в `variants` (сайт показывает спетое слово), если он
#   (a) сильный: слово лексически далеко от текста (d ≥ 0.6) и декод языкового CTC-движка точно за него (запас ≥ 0.3), ИЛИ
#   (b) то же слово услышано ещё хотя бы в одной записи этой песни, ИЛИ
#   (c) подтверждён пользователем на слух — planning/audio/variants-confirmed.json {"<d>": [{"s","l","k","heard"}]}.
# Остальные (ослышки Whisper: «Dach → Bach», «dringt → trinkt», «Schnee → Schnitzer» — один согласный или бессмыслица,
# другие записи слышат слово текста) переносятся в служебное поле `variant_candidates` — в очередь на прослушивание, не на сайт.
import json, sys, os, re, glob, unicodedata, torch
from rapidfuzz.distance import Levenshtein as Lev
R = '/workspaces/schubert-lieder'
SONGDIR = os.path.abspath(sys.argv[1]); SP = os.path.dirname(os.path.dirname(SONGDIR))
spec = json.load(open(f'{SONGDIR}/spec.json')); prefix, d_key = spec['prefix'], spec['key']
files = sys.argv[2:] or sorted(glob.glob(f'{R}/app/src/data/timings/{prefix}-*.json'))
wl_path = f'{R}/planning/audio/variants-confirmed.json'; WL = json.load(open(wl_path)).get(d_key, []) if os.path.exists(wl_path) else []

def fold(w):
    o = ''
    for ch in w.lower().replace('ß', 'ss'):
        if ch in 'äöü': o += ch; continue
        o += ''.join(c for c in unicodedata.normalize('NFD', ch) if not unicodedata.combining(c))
    return re.sub(r'[^a-zäöü]', '', o).replace('ä', 'a').replace('ö', 'o').replace('ü', 'u')

_dec = {}
def decode(vid, a, b):
    if vid not in _dec:
        d = torch.load(f'{SP}/align/em_de_{vid}.pt'); em = d['emission']; lab = list(d['labels'])[:em.shape[1]]; bl = d.get('blank', 0)
        _dec[vid] = (em.argmax(-1).tolist(), lab, bl)
    ids, lab, bl = _dec[vid]; o = ''; prev = None
    for k in ids[max(0, int(a / 0.02)):int(b / 0.02)]:
        if k != prev and k != bl and len(lab[k]) == 1 and lab[k].isalpha(): o += lab[k].lower()
        prev = k
    return o.replace('ä', 'a').replace('ö', 'o').replace('ü', 'u')

# что слышали другие записи на том же слове (по своим маршрутам own/)
heard = {}   # (s,l,k) -> {vid: folded heard variant or None}
for f in glob.glob(f'{SONGDIR}/own/{prefix}-*.json'):
    t = json.load(open(f)); vid = t['videoId']
    for v in t.get('variants', []) + t.get('variant_candidates', []): heard.setdefault((v['s'], v['l'], v['k']), {})[vid] = fold(v['heard'])

kept_total = demoted_total = 0
for f in files:
    t = json.load(open(f)); vid = t['videoId']; keep = []; cand = list(t.get('variant_candidates', []))
    for v in t.get('variants', []):
        tw, vw = fold(v['w']), fold(v['heard']); dlex = Lev.normalized_distance(tw, vw)
        iv = next((x['w'][v['k']] for x in t['route'] if x['s'] == v['s'] and x['l'] == v['l'] and x['w'][v['k']] and abs(x['w'][v['k']][0] - v['start']) < 0.05), None)
        margin = 0.0
        if iv:
            dcd = decode(vid, iv[0] - 0.05, iv[1] + 0.05)
            if dcd: margin = Lev.normalized_distance(dcd, tw) - Lev.normalized_distance(dcd, vw)
        strong = dlex >= 0.6 and margin >= 0.3
        others = sum(1 for ov, h in heard.get((v['s'], v['l'], v['k']), {}).items() if ov != vid and h == vw)
        confirmed = any(w['s'] == v['s'] and w['l'] == v['l'] and w['k'] == v['k'] and fold(w['heard']) == vw for w in WL)
        why = 'сильный' if strong else ('ещё в %d записях' % others if others else ('подтверждён пользователем' if confirmed else ''))
        if strong or others or confirmed: keep.append(v); kept_total += 1; print(f"  {vid} {v['s']+1}.{v['l']+1} «{v['w']}» → «{v['heard']}»: оставлен ({why}; d={dlex:.2f}, запас декода {margin:+.2f})")
        else:
            if not any(c['s'] == v['s'] and c['l'] == v['l'] and c['k'] == v['k'] for c in cand): cand.append(v)
            demoted_total += 1; print(f"  {vid} {v['s']+1}.{v['l']+1} «{v['w']}» → «{v['heard']}»: в очередь (d={dlex:.2f}, запас {margin:+.2f}, у других записей: {others})")
    t['variants'] = keep; t['variant_candidates'] = cand
    json.dump(t, open(f, 'w'), ensure_ascii=False, indent=1)
print(f"вариантов на сайт: {kept_total}, в очередь на прослушивание: {demoted_total}")
