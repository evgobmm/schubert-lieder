#!/bin/bash
# Контрольная песня целиком: скачать -> Demucs -> эмиссии (MMS + CTC по языку) -> Whisper (язык) -> wh_pipeline -> автоматический запасной путь
set -e; cd "$(dirname "$0")"; SP=$(cd ..; pwd); export PATH="$SP/bin:$PATH"; PY=$SP/align/.venv/bin/python
LANG_=$(python3 -c "import json;print(json.load(open('spec.json'))['lang'])"); CTC=$(python3 -c "import json;print(json.load(open('spec.json'))['ctc_model'])"); PREFIX=$(python3 -c "import json;print(json.load(open('spec.json'))['prefix'])")
VIDS=$(cat vids.txt)
cd $SP; for v in $VIDS; do [ -s "full/$v.wav" ] || yt-dlp -q -f bestaudio -x --audio-format wav -o "full/$v.%(ext)s" -- "https://www.youtube.com/watch?v=$v" 2>&1 | grep -v "JavaScript runtime" | tail -1; printf "%s %s с\n" "$v" "$(./bin/ffprobe -v error -show_entries format=duration -of csv=p=0 "full/$v.wav" | cut -c1-5)"; done
cd $SP/align; set -- $VIDS; while [ $# -gt 0 ]; do a=$1; b=$2; OMP_NUM_THREADS=8 nice -n 15 $PY -m demucs --two-stems=vocals -n htdemucs -o sep -- "../full/$a.wav" > "sep_$a.log" 2>&1 & [ -n "$b" ] && OMP_NUM_THREADS=8 nice -n 15 $PY -m demucs --two-stems=vocals -n htdemucs -o sep -- "../full/$b.wav" > "sep_$b.log" 2>&1 & wait; shift; [ $# -gt 0 ] && shift; done
for v in $VIDS; do ffmpeg -v error -y -i "sep/htdemucs/$v/vocals.wav" -ar 16000 -ac 1 "../audio/${v}_voc.wav"; done; echo "СТЕМЫ $(date +%T)"
for v in $VIDS; do ( [ -s em_mms_$v.pt ] || OMP_NUM_THREADS=8 nice -n 15 $PY emit.py "../audio/${v}_voc.wav" "em_mms_${v}.pt" > "emit_mms_${v}.log" 2>&1 ) & ( [ -s em_de_$v.pt ] || OMP_NUM_THREADS=8 nice -n 15 $PY emit_hf.py "$CTC" "../audio/${v}_voc.wav" "em_de_${v}.pt" > "emit_de_${v}.log" 2>&1 ) & wait; echo "эмиссии $v $(date +%T)"; done
for v in $VIDS; do [ -s wh_$v.json ] || OMP_NUM_THREADS=8 nice -n 15 $PY whisper_tr.py "../audio/${v}_voc.wav" "wh_$v.json" large-v3 "$LANG_" 2>&1 | grep -v "Warn\|%|" | head -1; echo "whisper $v $(date +%T)"; done
cd $SP/r688; for v in $VIDS; do mkdir -p wh_$v; echo "=== $v ==="; (cd wh_$v && nice -n 15 $PY ../wh_pipeline.py ../spec.json $v $SP/align/wh_$v.json $SP/audio/${v}_voc.wav $SP/align/em_mms_$v.pt $SP/align/em_de_$v.pt 2>&1 | grep -v Warn | grep -E "спето|подтверждено|проходов|частичный|вариант " | cut -c1-200); done
# --- автоматический выбор запасного пути
$PY - "$PREFIX" $VIDS <<'PY'
import json,sys
prefix=sys.argv[1]; vids=sys.argv[2:]; R='/workspaces/schubert-lieder'
info={}
for v in vids:
    t=json.load(open(f'{R}/app/src/data/timings/{prefix}-{v}.json')); wh=json.load(open(f'/tmp/claude-1000/-workspaces-schubert-lieder/4cb739f4-aec0-42ed-ac5b-3c028e3ab39f/scratchpad/align/wh_{v}.json'))
    lines=set((p['s'],p['l']) for p in t['route']); words=sum(len(s['words']) for s in wh)
    info[v]={'lines':lines,'passes':len(t['route']),'words':words}
ref=max(vids,key=lambda v:(len(info[v]['lines']),info[v]['passes'],info[v]['words']))
fb=[v for v in vids if v!=ref and (not info[ref]['lines']<=info[v]['lines'] or info[v]['words']<0.9*info[ref]['words'])]
print('эталон:',ref,'| строк',len(info[ref]['lines']),'проходов',info[ref]['passes'],'Whisper-слов',info[ref]['words'])
for v in vids: print(f"  {v}: строк {len(info[v]['lines'])}, проходов {info[v]['passes']}, слов {info[v]['words']} -> {'ЗАПАСНОЙ ПУТЬ' if v in fb else 'Whisper'}")
open('fallback_list.txt','w').write(ref+' '+' '.join(fb))
PY
read REF FB < fallback_list.txt; if [ -n "$FB" ]; then ./fallback.sh $REF $FB; fi
echo "КОНТРОЛЬ ГОТОВ $(date +%T)"
