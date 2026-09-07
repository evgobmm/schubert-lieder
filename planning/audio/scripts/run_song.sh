#!/bin/bash
# одна песня, все записи: маршрут по декоду для каждой записи -> выравнивание без шаблона -> варианты -> файл сайта
set -e; cd "$(dirname "$0")"; PY=$(cd ..; pwd)/align/.venv/bin/python; SPEC=$PWD/spec.json
SONG=$(python3 -c "import json;print(json.load(open('$SPEC'))['song'])"); shift 0
for v in "$@"; do
  mkdir -p "$v"; cd "$v"
  echo "=== $v ==="
  if [ -n "$ROUTE" ]; then cp "$ROUTE" route.json; echo "маршрут задан: $ROUTE"; else
  nice -n 15 $PY ../route_detect.py "$SONG" ../../audio/${v}_voc.wav ../../align/em_de_$v.pt ../../align/em_mms_$v.pt route_detect.json 2>&1 | grep -v Warn
  python3 -c "import json;json.dump(json.load(open('route_detect.json'))['route'],open('route.json','w'))"; fi
  node ../make_words.js "$SONG" route.json
  nice -n 15 $PY ../../align/fa.py  ../../align/em_mms_$v.pt words.json raw_mms.json > /dev/null
  nice -n 15 $PY ../../align/fa2.py ../../align/em_de_$v.pt  words.json raw_de.json  > /dev/null
  nice -n 15 $PY ../pipeline.py ../../audio/${v}_voc.wav ../../align/em_mms_$v.pt ../../align/em_de_$v.pt raw_mms.json raw_de.json words.json ts.raw.json 2>&1 | grep -E "привязка|целостность"
  $PY ../finalize2.py ts.raw.json ts.json | cut -c1-100
  $PY ../variants.py ts.json ../../align/em_de_$v.pt ../../align/em_mms_$v.pt variants.json
  $PY ../build_site2.py "$SPEC" route.json ts.json "$v" \
    "demucs htdemucs vocals -> MMS_FA + wav2vec2-xlsr-53-german; маршрут исполнения этой записи выведен из звука (ДП по декодам фраз с повторами); слова привязаны к фразам по декоду; оконное выравнивание -> ДП по слову с жёстким порядком -> начала к атакам, концы до смолкания голоса; без шаблона; мин. длительность 0.12 с" \
    "Маршрут и словесные варианты определены по звуку этой записи; на слух не проверено." variants.json
  cd ..
done
echo "ГОТОВО $(date +%T)"
