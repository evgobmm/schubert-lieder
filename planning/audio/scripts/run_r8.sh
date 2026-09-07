#!/bin/bash
# D 911/8: главная запись без шаблона, остальные — с главной как шаблоном. Требует route.json (маршрут исполнения).
set -e; cd "$(dirname "$0")"; PY=../align/.venv/bin/python; SONG=/workspaces/schubert-lieder/app/src/data/songs/d911-8-rueckblick.json
MAIN=06N7gOk05hA; OTHERS="eqsbD83uJUI 9Kp04PomXr8 6cLcxfPq_SE _-ho70GadRs"
node make_words.js $SONG route.json
echo "=== главная: $MAIN (без шаблона) ==="
$PY ../align/fa.py  ../align/em_mms_$MAIN.pt words.json ../align/ts_raw_mms_$MAIN.json > /dev/null
$PY ../align/fa2.py ../align/em_de_$MAIN.pt  words.json ../align/ts_raw_de_$MAIN.json  > /dev/null
$PY pipeline.py ../audio/${MAIN}_voc.wav ../align/em_mms_$MAIN.pt ../align/em_de_$MAIN.pt \
   ../align/ts_raw_mms_$MAIN.json ../align/ts_raw_de_$MAIN.json words.json ts_$MAIN.raw.json
$PY finalize2.py ts_$MAIN.raw.json ts_$MAIN.json
$PY build_site2.py spec.json route.json ts_$MAIN.json $MAIN \
   "demucs htdemucs vocals -> MMS_FA + wav2vec2-xlsr-53-german в окнах вокальных фраз -> ДП по слову с жёстким порядком -> начала к атакам, концы до смолкания голоса; маршрут исполнения (повторы Шуберта) выведен из звука; мин. длительность слова 0.12 с" \
   "Главная запись песни, без шаблона; на слух не проверена."
TEMPLATE=/workspaces/schubert-lieder/app/src/data/timings/d911-8-$MAIN.json
for v in $OTHERS; do
  echo "=== $v (шаблон — $MAIN) ==="
  $PY pipeline2.py $v ../audio/${v}_voc.wav ../align/em_mms_$v.pt ../align/em_de_$v.pt map_$v.json $TEMPLATE | grep -v "^ *[0-9.]*%"
  $PY finalize2.py ts_$v.json ts_$v.fin.json
  $PY build_site2.py spec.json route.json ts_$v.fin.json $v \
     "demucs htdemucs vocals -> MMS_FA + wav2vec2-xlsr-53-german в окнах вокальных фраз -> разметка главной записи (Quasthoff) перенесена DTW по хроме как третий кандидат и якорь -> ДП по слову с жёстким порядком -> начала к атакам, концы до смолкания голоса; мин. длительность 0.12 с" \
     "Шаблон — главная запись (Quasthoff), сама ещё не принятая на слух; после её приёмки пересчитать."
done
echo "ГОТОВО $(date +%T)"
