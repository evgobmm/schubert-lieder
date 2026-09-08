# Каталог песни для конвейера: make_spec.py <D> <каталог songs> -> songs/<prefix>/{spec.json, vids.txt}; печатает "<prefix> <lang> <vid…>"
# Язык: поле "lang" в JSON песни, иначе planning/audio/lang-overrides.json ({"688/1": "it", …}), иначе de. CTC-модель — по языку.
import json, sys, os, re
D, SONGS_DIR = sys.argv[1], sys.argv[2]; R = '/workspaces/schubert-lieder'
idx = {e['d']: e for e in json.load(open(f'{R}/app/src/data/index.json'))}
perf = json.load(open(f'{R}/app/src/data/performances.json'))
e = idx[D]; assert e.get('file'), f'{D}: у песни нет страницы (file)'
song = json.load(open(f"{R}/app/src/data/songs/{e['file']}"))
ov_path = f'{R}/planning/audio/lang-overrides.json'; ov = json.load(open(ov_path)) if os.path.exists(ov_path) else {}
lang = song.get('lang') or ov.get(D) or 'de'
CTC = {'de': 'jonatasgrosman/wav2vec2-large-xlsr-53-german', 'it': 'jonatasgrosman/wav2vec2-large-xlsr-53-italian',
       'fr': 'jonatasgrosman/wav2vec2-large-xlsr-53-french', 'en': 'jonatasgrosman/wav2vec2-large-xlsr-53-english'}
prefix = 'd' + D.replace('/', '-')
os.makedirs(f'{SONGS_DIR}/{prefix}', exist_ok=True)
json.dump({"key": D, "prefix": prefix, "song": f"{R}/app/src/data/songs/{e['file']}", "d": D, "lang": lang, "ctc_model": CTC[lang]},
          open(f'{SONGS_DIR}/{prefix}/spec.json', 'w'), ensure_ascii=False)
vids = [p['videoId'] for p in perf.get(D, [])]
open(f'{SONGS_DIR}/{prefix}/vids.txt', 'w').write(' '.join(vids) + '\n')
print(prefix, lang, ' '.join(vids))
