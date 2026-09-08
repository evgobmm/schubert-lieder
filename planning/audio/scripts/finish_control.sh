#!/bin/bash
# Сборка одной песни, когда тяжёлые стадии готовы (стемы в $SP/audio, эмиссии и Whisper в $SP/align):
# свои маршруты каждой записи -> консенсус по строфам -> решение по записи (свой / починка по консенсусу / запасной путь) ->
# файлы сайта -> ворота голосовых дыр (запись с дырами уходит на запасной путь).
# finish_control.sh [каталог песни со spec.json и vids.txt] (по умолчанию — текущий)
set -e; SCRIPTS=$(dirname "$(realpath "$0")"); SP=$(cd "$SCRIPTS/.."; pwd); PY=$SP/align/.venv/bin/python; APP=/workspaces/schubert-lieder/app/src/data/timings
RUNDIR=$(realpath "${1:-.}"); cd "$RUNDIR"
PREFIX=$(python3 -c "import json;print(json.load(open('spec.json'))['prefix'])"); SONG=$(python3 -c "import json;print(json.load(open('spec.json'))['song'])"); VIDS=$(cat vids.txt)
echo "=== 1. свои маршруты (Whisper каждой записи) ==="; $SCRIPTS/test_run.sh spec.json own $VIDS 2>&1 | grep -a -v "^  проход" | grep -a -v "сдвигом\|варианты те же\|ВАРИАНТЫ\|ИЗМЕНИЛСЯ"
echo "=== 2. консенсус по строфам и решения ==="; $PY $SCRIPTS/consensus.py "$SONG" own "$PREFIX" $VIDS
echo "=== 3. файлы сайта ==="; FB=""
while read v d; do
  case "$d" in
    свой) cp "own/$PREFIX-$v.json" "$APP/"; echo "$v: свой маршрут -> сайт";;
    починка) echo "$v: починка по консенсусу"; (cd "own/wh_$v" && CONSENSUS=$RUNDIR/route_consensus.json nice -n 15 $PY $SCRIPTS/wh_pipeline.py $RUNDIR/spec.json $v $SP/align/wh_$v.json $SP/audio/${v}_voc.wav $SP/align/em_mms_$v.pt $SP/align/em_de_$v.pt 2>&1 | grep -a -v Warn | grep -a -E "дополнен|консенсус предлагает|вне консенсуса|спето|Traceback|Error|File " | cut -c1-220);;
    запасной) FB="$FB $v";;
  esac
done < decisions.txt
if [ -n "$FB" ]; then echo "запасной путь:$FB"; $SCRIPTS/fallback.sh "$RUNDIR" --route route_consensus.json $FB 2>&1 | grep -a -E "маршрут из файла|привязка|целостность|Traceback" | cut -c1-120; fi
gate() { nice -n 15 $PY $SCRIPTS/holes.py "$APP/$PREFIX-$1.json" $SP/audio/${1}_voc.wav $SP/align/em_mms_$1.pt $SP/align/em_de_$1.pt "$SONG" 2>&1 | grep -a -c "^дыра" || true; }
echo "=== 4. голосовые дыры (ворота); запись с дырами уходит на запасной путь ==="; FB2=""
for v in $VIDS; do n=$(gate $v); echo "$v: дыр $n"; if [ "$n" != "0" ] && ! grep -q "^$v запасной" decisions.txt; then FB2="$FB2 $v"; fi; done
if [ -n "$FB2" ]; then echo "дыры после своего маршрута/починки -> запасной путь:$FB2"; $SCRIPTS/fallback.sh "$RUNDIR" --route route_consensus.json $FB2 2>&1 | grep -a -E "привязка|целостность|Traceback" | cut -c1-120; for v in $FB2; do echo "$v: дыр после запасного пути $(gate $v)"; sed -i "s/^$v .*/$v запасной (дыры)/" decisions.txt; done; fi
echo "ГОТОВО $PREFIX $(date +%T)"
