# Фрагменты (неполные записи) — после полных в performances.json + пометка на странице (правило youtube-performances.md, 2026-09-09):
# fragments_order.py <каталог songs> [--apply]   Источник признака: songs/<prefix>/decisions.txt («<vid> свой фрагмент: спето N из M слов …»).
# Для каждой песни: записи-фрагменты переставляются в конец списка (взаимный порядок сохраняется), в запись добавляется поле
# "fragment": {"sung": N, "text": M, "stanzas": "1 из 4"}; у полных записей поле снимается. В "Как это поют" песни (about) дописывается
# абзац «Запись … — фрагмент: спета … строфа из …» (если раздела нет — только поле). Без --apply — только отчёт.
import json, sys, os, glob, re
SONGS = sys.argv[1]; APPLY = '--apply' in sys.argv; R = '/workspaces/schubert-lieder'
perf = json.load(open(f'{R}/app/src/data/performances.json')); idx = {e['d']: e for e in json.load(open(f'{R}/app/src/data/index.json'))}
frag = {}   # vid -> (sung, text)
FROZEN = {'118', '688/1'} | {f'911/{i}' for i in range(1, 25)}   # замороженные песни: порядок и файлы не трогаем
for dp in glob.glob(f'{SONGS}/*/decisions.txt'):
    for l in open(dp, encoding='utf-8'):
        m = re.match(r'^(\S+) свой фрагмент: спето (\d+) из (\d+)', l.strip())
        if m: frag[m.group(1)] = (int(m.group(2)), int(m.group(3)))
def ru_stanzas(nums, total):
    nums = sorted(nums)
    if not nums: return None
    if len(nums) == 1: return f'строфа {nums[0]} из {total}' if total > 1 else None
    if nums == list(range(nums[0], nums[-1] + 1)): return f'строфы {nums[0]}–{nums[-1]} из {total}'
    return f'строфы {", ".join(map(str, nums))} из {total}'
changed_perf = 0; changed_about = 0; moved = 0
for d, lst in perf.items():
    p = 'd' + d.replace('/', '-')
    if d in FROZEN: continue
    song_file0 = idx.get(d, {}).get('file'); total0 = len(json.load(open(f'{R}/app/src/data/songs/{song_file0}', encoding='utf-8'))['stanzas']) if song_file0 else 0
    def is_frag(x):   # фрагмент — когда не хватает целых строф (меньше слов, чем у консенсуса, бывает и из-за повторов других певцов)
        if x['videoId'] not in frag: return False
        tf = f'{R}/app/src/data/timings/{p}-{x["videoId"]}.json'
        if not (os.path.exists(tf) and total0): return True
        return len({ps['s'] for ps in json.load(open(tf))['route']}) < total0
    full = [x for x in lst if not is_frag(x)]; part = [x for x in lst if is_frag(x)]
    for x in full:
        if 'fragment' in x: x.pop('fragment'); changed_perf += 1   # устаревшая пометка у записи, которая больше не фрагмент
    if not part:
        for x in lst:
            if 'fragment' in x: x.pop('fragment'); changed_perf += 1
        continue
    song_file = idx.get(d, {}).get('file'); song = json.load(open(f'{R}/app/src/data/songs/{song_file}', encoding='utf-8')) if song_file else None
    total = len(song['stanzas']) if song else 0
    for x in part:
        sung, text = frag[x['videoId']]; st = None
        tf = f'{R}/app/src/data/timings/{p}-{x["videoId"]}.json'
        if os.path.exists(tf) and total: st = ru_stanzas(sorted({ps['s'] + 1 for ps in json.load(open(tf))['route']}), total)
        x['fragment'] = {'sung': sung, 'text': text, **({'stanzas': st} if st else {})}
    new = full + part
    if [x['videoId'] for x in new] != [x['videoId'] for x in lst]: moved += 1
    perf[d] = new; changed_perf += 1
    if song and APPLY:
        sec = next((a for a in song.get('about', []) if a['title'].strip().lower() == 'как это поют'), None)
        if sec:
            lines = []
            for x in part:
                st = x['fragment'].get('stanzas'); who = f"{x['name']} ({x['year']})"
                what = ('спета ' + st) if st and st.startswith('строфа ') else (('спеты ' + st) if st else f"спето {x['fragment']['sung']} из {x['fragment']['text']} слов")
                lines.append(f"Запись {who} неполная: {what}.")
            para = ' '.join(lines)
            txt = re.sub(r'\n+Запись [^\n]*неполная:[^\n]*$', '', sec['text'].rstrip())   # прежняя автопометка — заменить
            if para not in txt: sec['text'] = txt + '\n' + para; json.dump(song, open(f'{R}/app/src/data/songs/{song_file}', 'w', encoding='utf-8'), ensure_ascii=False, indent=2); changed_about += 1
    print(f"D {d}: полных {len(full)}, фрагментов {len(part)} — " + '; '.join(f"{x['name']} {x['year']} ({x['fragment'].get('stanzas') or str(x['fragment']['sung']) + ' из ' + str(x['fragment']['text']) + ' слов'})" for x in part))
if APPLY: json.dump(perf, open(f'{R}/app/src/data/performances.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f"фрагментов {len(frag)}; песен с фрагментами {sum(1 for l in perf.values() if any('fragment' in x for x in l))}; переставлено списков {moved}; абзацев «Как это поют» {changed_about}; {'ПРИМЕНЕНО' if APPLY else 'проверка без записи'}")
