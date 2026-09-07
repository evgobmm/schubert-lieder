#!/bin/bash
# ждёт вокальные стемы четырёх записей, затем считает эмиссии обоих движков (по две параллельно)
cd "$(dirname "$0")"
VIDS="6-RjxuXSuPw PCNGae1wYxU -IBB3bznOnQ P0sd9_mjtRU"
for v in $VIDS; do until [ -s "../audio/${v}_voc.wav" ]; do sleep 15; done; done
echo "стемы готовы: $(date +%T)"
for v in $VIDS; do
  OMP_NUM_THREADS=8 .venv/bin/python emit.py "../audio/${v}_voc.wav" "em_mms_${v}.pt" > "emit_mms_${v}.log" 2>&1 &
  OMP_NUM_THREADS=8 .venv/bin/python emit_hf.py jonatasgrosman/wav2vec2-large-xlsr-53-german "../audio/${v}_voc.wav" "em_de_${v}.pt" > "emit_de_${v}.log" 2>&1 &
  wait
  echo "$v: $(date +%T) mms=$(grep -ac emission emit_mms_${v}.log) de=$(grep -ac emission emit_de_${v}.log)"
done
echo "ЭМИССИИ ГОТОВЫ $(date +%T)"
