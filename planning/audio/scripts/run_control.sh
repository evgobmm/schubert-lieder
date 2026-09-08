#!/bin/bash
# Контрольная песня целиком: скачать -> Demucs -> эмиссии (MMS + CTC по языку) -> Whisper (язык) -> finish_control.sh (маршруты, консенсус, починка/запасной путь, ворота)
set -e; cd "$(dirname "$0")"; RUNDIR=$PWD; SP=$(cd ..; pwd); export PATH="$SP/bin:$PATH"; PY=$SP/align/.venv/bin/python
LANG_=$(python3 -c "import json;print(json.load(open('spec.json'))['lang'])"); CTC=$(python3 -c "import json;print(json.load(open('spec.json'))['ctc_model'])"); PREFIX=$(python3 -c "import json;print(json.load(open('spec.json'))['prefix'])")
VIDS=$(cat vids.txt)
cd $SP; for v in $VIDS; do [ -s "full/$v.wav" ] || yt-dlp -q -f bestaudio -x --audio-format wav -o "full/$v.%(ext)s" -- "https://www.youtube.com/watch?v=$v" 2>&1 | grep -v "JavaScript runtime" | tail -1; printf "%s %s с\n" "$v" "$(./bin/ffprobe -v error -show_entries format=duration -of csv=p=0 "full/$v.wav" | cut -c1-5)"; done
cd $SP/align; set -- $VIDS; while [ $# -gt 0 ]; do a=$1; b=$2; OMP_NUM_THREADS=8 nice -n 15 $PY -m demucs --two-stems=vocals -n htdemucs -o sep -- "../full/$a.wav" > "sep_$a.log" 2>&1 & [ -n "$b" ] && OMP_NUM_THREADS=8 nice -n 15 $PY -m demucs --two-stems=vocals -n htdemucs -o sep -- "../full/$b.wav" > "sep_$b.log" 2>&1 & wait; shift; [ $# -gt 0 ] && shift; done
for v in $VIDS; do ffmpeg -v error -y -i "sep/htdemucs/$v/vocals.wav" -ar 16000 -ac 1 "../audio/${v}_voc.wav"; done; echo "СТЕМЫ $(date +%T)"
for v in $VIDS; do ( [ -s em_mms_$v.pt ] || OMP_NUM_THREADS=8 nice -n 15 $PY emit.py "../audio/${v}_voc.wav" "em_mms_${v}.pt" > "emit_mms_${v}.log" 2>&1 ) & ( [ -s em_de_$v.pt ] || OMP_NUM_THREADS=8 nice -n 15 $PY emit_hf.py "$CTC" "../audio/${v}_voc.wav" "em_de_${v}.pt" > "emit_de_${v}.log" 2>&1 ) & wait; echo "эмиссии $v $(date +%T)"; done
for v in $VIDS; do [ -s wh_$v.json ] || OMP_NUM_THREADS=8 nice -n 15 $PY whisper_tr.py "../audio/${v}_voc.wav" "wh_$v.json" large-v3 "$LANG_" 2>&1 | grep -v "Warn\|%|" | head -1; echo "whisper $v $(date +%T)"; done
# --- хвост: свои маршруты -> консенсус по строфам -> решение (свой / починка / запасной) -> файлы сайта -> ворота дыр (с откатом на запасной путь)
cd "$RUNDIR"; ./finish_control.sh
echo "КОНТРОЛЬ ГОТОВ $(date +%T)"
