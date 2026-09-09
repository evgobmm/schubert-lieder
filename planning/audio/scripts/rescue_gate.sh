#!/bin/bash
# Спасение удержанных, шаг 1 (без счёта): прогнать ворота по ЧИСТОМУ своему маршруту (own/<prefix>-<vid>.json — до починки консенсусом
# и до выбора запасного пути) и сравнить с удержанной версией. rescue_gate.sh [prefix…]  (по умолчанию — все песни с held/)
# Пишет own/holes_pure_<vid>.txt и строку сводки: <prefix> <vid> held=<дыр> pure=<дыр> maxpure=<самая длинная дыра, с>
SCRIPTS=$(dirname "$(realpath "$0")"); SP=$(cd "$SCRIPTS/.."; pwd); PY=$SP/align/.venv/bin/python
# rescue_gate.sh --list <файл "<prefix> <vid> …"> — ворота по чистому своему для перечисленных записей (не обязательно удержанных)
gate_one() { d=$1; p=$2; v=$3; SONG=$(python3 -c "import json;print(json.load(open('$d/spec.json'))['song'])"); pure="$d/own/$p-$v.json"
    held=$(grep -c "^дыра" "$d/holes_$v.txt" 2>/dev/null || echo "?")
    if [ -f "$pure" ]; then
      nice -n 15 $PY $SCRIPTS/holes.py "$pure" $SP/audio/${v}_voc.wav $SP/align/em_mms_$v.pt $SP/align/em_de_$v.pt "$SONG" 2>/dev/null | grep -a "^дыра" > "$d/own/holes_pure_$v.txt"
      n=$(grep -c . "$d/own/holes_pure_$v.txt"); mx=$(grep -o "([0-9.]* с)" "$d/own/holes_pure_$v.txt" | tr -d '( с)' | sort -rn | head -1)
      echo "$p $v held=$held pure=$n maxpure=${mx:-0}"
    else echo "$p $v held=$held pure=нет"; fi; }
if [ "$1" = "--list" ]; then while read p v rest; do [ -n "$p" ] && gate_one "$SP/songs/$p" "$p" "$v"; done < "$2"; exit 0; fi
if [ $# -gt 0 ]; then dirs=$(for p in "$@"; do echo "$SP/songs/$p"; done); else dirs=$(ls -d $SP/songs/*/held 2>/dev/null | xargs -n1 dirname); fi
for d in $dirs; do
  p=$(basename "$d"); SONG=$(python3 -c "import json;print(json.load(open('$d/spec.json'))['song'])")
  for h in "$d"/held/*.json; do
    [ -f "$h" ] || continue; v=$(basename "$h" .json); v=${v#"$p-"}; pure="$d/own/$p-$v.json"
    held=$(grep -c "^дыра" "$d/holes_$v.txt" 2>/dev/null || echo "?")
    if [ -f "$pure" ]; then
      nice -n 15 $PY $SCRIPTS/holes.py "$pure" $SP/audio/${v}_voc.wav $SP/align/em_mms_$v.pt $SP/align/em_de_$v.pt "$SONG" 2>/dev/null | grep -a "^дыра" > "$d/own/holes_pure_$v.txt"
      n=$(grep -c . "$d/own/holes_pure_$v.txt"); mx=$(grep -o "([0-9.]* с)" "$d/own/holes_pure_$v.txt" | tr -d '( с)' | sort -rn | head -1)
      echo "$p $v held=$held pure=$n maxpure=${mx:-0}"
    else echo "$p $v held=$held pure=нет"; fi
  done
done
