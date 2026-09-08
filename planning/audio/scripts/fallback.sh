#!/bin/bash
# Запасной путь для записи, где Whisper потерял строки: консенсусный маршрут (из эталонной записи) + CTC-выравнивание с привязкой по декоду
set -e; cd "$(dirname "$0")"; SP=$(cd ..; pwd); PY=$SP/align/.venv/bin/python; SPEC=$PWD/spec.json
SONG=$(python3 -c "import json;print(json.load(open('$SPEC'))['song'])"); REF=$1; shift
python3 - "$REF" <<'PY'
import json,sys
t=json.load(open(f"/workspaces/schubert-lieder/app/src/data/timings/d911-15-{sys.argv[1]}.json"))
route=[{"s":p['s'],"l":p['l'],"k":[k for k,x in enumerate(p['w']) if x]} for p in t['route']]
json.dump(route,open('route_consensus.json','w')); print('консенсусный маршрут из',sys.argv[1],':',len(route),'проходов')
PY
for v in "$@"; do
  mkdir -p fb_$v; cd fb_$v; cp ../route_consensus.json route.json
  node ../make_words.js "$SONG" route.json
  $PY $SP/align/fa.py  $SP/align/em_mms_$v.pt words.json raw_mms.json > /dev/null
  $PY $SP/align/fa2.py $SP/align/em_de_$v.pt  words.json raw_de.json  > /dev/null
  $PY ../pipeline.py $SP/audio/${v}_voc.wav $SP/align/em_mms_$v.pt $SP/align/em_de_$v.pt raw_mms.json raw_de.json words.json ts.raw.json 2>&1 | grep -E "привязка|целостность" | sed "s/^/$v: /"
  $PY ../finalize2.py ts.raw.json ts.json | cut -c1-80
  $PY ../build_site2.py "$SPEC" route.json ts.json "$v" "demucs -> MMS_FA + wav2vec2-xlsr-53-german; маршрут — консенсус записей песни (Whisper этой записи потерял строки); привязка слов к фразам по декоду; ДП, атаки, концы" "Запасной путь: маршрут-консенсус, без Whisper-якорей; на слух не проверено."
  cd ..
done
