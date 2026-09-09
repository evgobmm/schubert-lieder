#!/bin/bash
# Запасной путь: заданный маршрут (консенсус записей песни) + CTC-выравнивание без якорей Whisper с привязкой слов к фразам по декоду.
# fallback.sh <каталог песни> --route route.json vid…    |    fallback.sh <каталог песни> <эталонная запись> vid…  (маршрут из её файла сайта)
set -e; SCRIPTS=$(dirname "$(realpath "$0")"); SP=$(cd "$SCRIPTS/.."; pwd); PY=$SP/align/.venv/bin/python
RUNDIR=$(realpath "$1"); shift; cd "$RUNDIR"; SPEC=$RUNDIR/spec.json
SONG=$(python3 -c "import json;print(json.load(open('$SPEC'))['song'])"); PREFIX=$(python3 -c "import json;print(json.load(open('$SPEC'))['prefix'])")
if [ "$1" = "--route" ]; then ROUTE=$(realpath "$2"); shift 2; echo "маршрут из файла $(basename "$ROUTE"): $(python3 -c "import json;print(len(json.load(open('$ROUTE'))))") проходов"
else REF=$1; shift
python3 - "$REF" "$PREFIX" <<'PY'
import json,sys
t=json.load(open(f"/workspaces/schubert-lieder/app/src/data/timings/{sys.argv[2]}-{sys.argv[1]}.json"))
route=[{"s":p['s'],"l":p['l'],"k":[k for k,x in enumerate(p['w']) if x]} for p in t['route']]
json.dump(route,open('route_consensus.json','w')); print('консенсусный маршрут из',sys.argv[1],':',len(route),'проходов')
PY
fi
for v in "$@"; do
  mkdir -p fb_$v; cd fb_$v; cp "${ROUTE:-../route_consensus.json}" route.json
  node $SCRIPTS/make_words.js "$SONG" route.json
  $PY $SCRIPTS/fa.py  $SP/align/em_mms_$v.pt words.json raw_mms.json > /dev/null
  $PY $SCRIPTS/fa2.py $SP/align/em_de_$v.pt  words.json raw_de.json  > /dev/null
  $PY $SCRIPTS/pipeline.py $SP/audio/${v}_voc.wav $SP/align/em_mms_$v.pt $SP/align/em_de_$v.pt raw_mms.json raw_de.json words.json ts.raw.json 2>&1 | grep -E "привязка|целостность" | sed "s/^/$v: /"
  $PY $SCRIPTS/finalize2.py ts.raw.json ts.json | cut -c1-80
  $PY $SCRIPTS/build_site2.py "$SPEC" route.json ts.json "$v" "demucs -> MMS_FA + wav2vec2-xlsr-53 (язык песни); маршрут — консенсус записей песни по строфам (Whisper этой записи потерял или переврал проходы); привязка слов к фразам по декоду; ДП, атаки, концы" "Запасной путь: маршрут-консенсус, без Whisper-якорей; на слух не проверено."
  cd ..
done
