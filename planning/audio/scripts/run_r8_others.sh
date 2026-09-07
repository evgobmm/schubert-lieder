#!/bin/bash
set -e; cd "$(dirname "$0")"; PY=../align/.venv/bin/python; MAIN=06N7gOk05hA; OTHERS="eqsbD83uJUI 9Kp04PomXr8 6cLcxfPq_SE _-ho70GadRs"
TEMPLATE=/workspaces/schubert-lieder/app/src/data/timings/d911-8-$MAIN.json
for v in $OTHERS; do
  echo "=== $v (шаблон — $MAIN) ==="
  $PY pipeline2.py $v ../audio/${v}_voc.wav ../align/em_mms_$v.pt ../align/em_de_$v.pt map_$v.json $TEMPLATE | grep -v "^ *[0-9.]*%"
  $PY finalize2.py ts_$v.json ts_$v.fin.json
  $PY build_site2.py spec.json route.json ts_$v.fin.json $v \
     "demucs htdemucs vocals -> MMS_FA + wav2vec2-xlsr-53-german в окнах вокальных фраз -> разметка главной записи (Quasthoff) перенесена DTW по хроме как третий кандидат и якорь -> ДП по слову с жёстким порядком -> начала к атакам, концы до смолкания голоса; мин. длительность 0.12 с" \
     "Шаблон — главная запись (Quasthoff), сама ещё не принятая на слух; после её приёмки пересчитать."
done
