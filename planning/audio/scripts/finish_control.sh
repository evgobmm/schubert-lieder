#!/bin/bash
# Сборка одной песни, когда тяжёлые стадии готовы (стемы в $SP/audio, эмиссии и Whisper в $SP/align):
# свои маршруты каждой записи -> консенсус по строфам -> решение по записи (свой / починка по консенсусу / запасной путь) ->
# файлы сайта -> ворота голосовых дыр (запись с дырами уходит на запасной путь).
# finish_control.sh [каталог песни со spec.json и vids.txt] (по умолчанию — текущий)
set -e; SCRIPTS=$(dirname "$(realpath "$0")"); SP=$(cd "$SCRIPTS/.."; pwd); PY=$SP/align/.venv/bin/python; APP=${APP:-/workspaces/schubert-lieder/app/src/data/timings}; export OUT_DIR=$APP   # куда писать файлы сайта (в облаке — каталог контейнера)
RUNDIR=$(realpath "${1:-.}"); cd "$RUNDIR"
PREFIX=$(python3 -c "import json;print(json.load(open('spec.json'))['prefix'])"); SONG=$(python3 -c "import json;print(json.load(open('spec.json'))['song'])"); VIDS=$(cat vids.txt)
echo "=== 1. свои маршруты (Whisper каждой записи) ==="; $SCRIPTS/test_run.sh spec.json own $VIDS 2>&1 | grep -a -v "^  проход" | grep -a -v "сдвигом\|варианты те же\|ВАРИАНТЫ\|ИЗМЕНИЛСЯ"
echo "=== 2. консенсус по строфам и решения ==="; $PY $SCRIPTS/consensus.py "$SONG" own "$PREFIX" $VIDS
echo "=== 3. файлы сайта ==="; FB=""
while read v d rest; do   # решение — второе поле; после него может идти пояснение («свой фрагмент: спето N из M слов»)
  case "$d" in
    свой) cp "own/$PREFIX-$v.json" "$APP/"; echo "$v: свой маршрут -> сайт";;
    починка) echo "$v: починка по консенсусу"; (cd "own/wh_$v" && CONSENSUS=$RUNDIR/route_consensus.json nice -n 15 $PY $SCRIPTS/wh_pipeline.py $RUNDIR/spec.json $v $SP/align/wh_$v.json $SP/audio/${v}_voc.wav $SP/align/em_mms_$v.pt $SP/align/em_de_$v.pt 2>&1 | grep -a -v Warn | grep -a -E "дополнен|консенсус предлагает|вне консенсуса|спето|Traceback|Error|File " | cut -c1-220);;
    запасной) FB="$FB $v";;
  esac
done < decisions.txt
if [ -n "$FB" ]; then echo "запасной путь:$FB"; $SCRIPTS/fallback.sh "$RUNDIR" --route route_consensus.json $FB 2>&1 | grep -a -E "маршрут из файла|привязка|целостность|Traceback" | cut -c1-120; fi
echo "=== 3а. фильтр вариантов (сильные / подтверждённые второй записью или пользователем — на сайт, остальные — в очередь) ==="; $PY $SCRIPTS/variants_filter.py "$RUNDIR" 2>&1 | grep -a -v Warn
MAX_HOLES=${MAX_HOLES:-2}   # запись выкладывается при <= MAX_HOLES дыр (сами дыры — в очередь прослушивания); больше — удерживается в held/
gate() { [ -f "$APP/$PREFIX-$1.json" ] || { echo "НЕТ ФАЙЛА"; return; }; nice -n 15 $PY $SCRIPTS/holes.py "$APP/$PREFIX-$1.json" $SP/audio/${1}_voc.wav $SP/align/em_mms_$1.pt $SP/align/em_de_$1.pt "$SONG" 2>&1 | grep -a "^дыра" > "holes_$1.txt" || true; wc -l < "holes_$1.txt"; }
echo "=== 4. голосовые дыры (ворота): свой маршрут с дырами -> пробуем запасной путь, берём лучший; > $MAX_HOLES дыр -> удержано ==="; mkdir -p held
for v in $VIDS; do
  n=$(gate $v); echo "$v: дыр $n"
  if [ "$n" != "0" ] && [ "$n" != "НЕТ ФАЙЛА" ] && ! grep -q "^$v запасной" decisions.txt; then
    cp "$APP/$PREFIX-$v.json" "own/keep_$v.json"; cp "holes_$v.txt" "own/keep_holes_$v.txt"
    # надёжный свой маршрут (якорей >= 70 % его слов) -> CTC-выравнивание по НЕМУ, а не по консенсусу: консенсус навязывает записи
    # чужую структуру (D 5, Мельцер: строки, которых певец не поёт, втиснуты в 3 с — «ужасно»); по консенсусу — только при слабом Whisper
    RT=route_consensus.json; $PY - "own/$PREFIX-$v.json" "own/route_own_$v.json" <<'PY' && RT="own/route_own_$v.json"
import json,sys; t=json.load(open(sys.argv[1])); w=[x for p in t['route'] for x in p['w'] if x]; a=t.get('anchored') or 0
r=[{"s":p['s'],"l":p['l'],"k":[k for k,x in enumerate(p['w']) if x]} for p in t['route']]; r=[p for p in r if p['k']]
ok=len(w)>=10 and a>=0.7*len(w) and r
if ok: json.dump(r,open(sys.argv[2],'w'))
sys.exit(0 if ok else 1)
PY
    echo "$v: запасной путь по $([ "$RT" = route_consensus.json ] && echo консенсусу || echo 'своему маршруту (Whisper надёжен)')"
    $SCRIPTS/fallback.sh "$RUNDIR" --route "$RT" $v 2>&1 | grep -a -E "Traceback" | cut -c1-120
    m=$(gate $v); echo "$v: дыр после запасного пути $m"
    if [ "$m" = "НЕТ ФАЙЛА" ] || [ "$m" -ge "$n" ]; then cp "own/keep_$v.json" "$APP/$PREFIX-$v.json"; cp "own/keep_holes_$v.txt" "holes_$v.txt"; echo "$v: оставлен свой маршрут ($n дыр)"; else sed -i "s/^$v .*/$v запасной (дыры: свой $n, запасной $m)/" decisions.txt; fi
  fi
  h=$(wc -l < "holes_$v.txt" 2>/dev/null || echo 0); long=$(grep -a -o "([0-9.]* с)" "holes_$v.txt" 2>/dev/null | tr -d '( с)' | awk -v M="${MAX_HOLE_SEC:-8}" '$1>M' | wc -l)
  if [ -f "$APP/$PREFIX-$v.json" ] && { [ "$h" -gt "$MAX_HOLES" ] || [ "$long" -gt 0 ]; }; then mv "$APP/$PREFIX-$v.json" "held/"; echo "$v: УДЕРЖАНО ($h дыр > $MAX_HOLES или дыра длиннее ${MAX_HOLE_SEC:-8} с: $long)"; fi
done
$PY $SCRIPTS/apply_manual.py "$PREFIX" 2>&1 | grep -a -v "^ручных правок наложено: 0" | cut -c1-120   # ручные правки по слуху пользователя (planning/audio/manual/)
echo "ГОТОВО $PREFIX $(date +%T)"
