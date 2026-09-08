#!/bin/bash
# Партия песен: batch_gpu.sh <D…>  (например 911/1 911/2 …). Для каждой песни — каталог $SP/songs/<prefix> (spec.json, vids.txt);
# звук скачивается ЛОКАЛЬНО (yt-dlp; с датацентровых IP YouTube не отдаёт), тяжёлые стадии — на GPU Modal (gpu_stage.py),
# затем finish_control.sh по каждой песне и сводка. Повторный запуск пропускает готовое.
set -e; SCRIPTS=$(dirname "$(realpath "$0")"); SP=$(cd "$SCRIPTS/.."; pwd); PY=$SP/align/.venv/bin/python; export PATH="$SP/bin:$PATH"
mkdir -p "$SP/songs" "$SP/full" "$SP/align" "$SP/audio"; cd "$SP"
: > "$SP/songs/batch.txt"
echo "=== 1. спецификации ==="
for D in "$@"; do line=$($PY $SCRIPTS/make_spec.py "$D" "$SP/songs"); echo "  $D -> $line"; echo "$line" >> "$SP/songs/batch.txt"; done
echo "=== 2. скачивание (локально) ==="
for v in $(cut -d' ' -f3- "$SP/songs/batch.txt" | tr ' ' '\n' | sort -u); do
  ls full/$v.* >/dev/null 2>&1 && continue
  yt-dlp -q --no-warnings -f bestaudio --sleep-interval 1 --retries 3 -o "full/$v.%(ext)s" -- "https://www.youtube.com/watch?v=$v" 2>&1 | grep -v "JavaScript runtime" | tail -1 || echo "  $v: НЕ СКАЧАНО"
done
echo "  скачано: $(ls full | wc -l) файлов"
echo "=== 3. GPU (Modal) по языкам ==="
for lang in $(cut -d' ' -f2 "$SP/songs/batch.txt" | sort -u); do
  awk -v L="$lang" '$2==L {for(i=3;i<=NF;i++) print $i}' "$SP/songs/batch.txt" | sort -u > "$SP/songs/vids_$lang.txt"
  CTC=$($PY -c "import json,glob;print([json.load(open(f))['ctc_model'] for f in glob.glob('$SP/songs/*/spec.json') if json.load(open(f))['lang']=='$lang'][0])")
  (cd "$SCRIPTS" && $SP/align/.venv/bin/modal run gpu_stage.py --list-file "$SP/songs/vids_$lang.txt" --lang "$lang" --ctc-model "$CTC" --indir "$SP/full" --outdir "$SP/align" --audiodir "$SP/audio")
done
echo "=== 4. сборка песен (CPU) ==="
while read prefix lang vids; do
  echo "--- $prefix ---"; $SCRIPTS/finish_control.sh "$SP/songs/$prefix" > "$SP/songs/$prefix/finish.log" 2>&1 || echo "  $prefix: ОШИБКА (см. finish.log)"
  grep -a -E "^  .*->|дыр|дополнен|купюра|ГОТОВО|Traceback" "$SP/songs/$prefix/finish.log" | cut -c1-160 | sed 's/^/  /'
done < "$SP/songs/batch.txt"
echo "=== 5. сводка ==="; $PY $SCRIPTS/batch_report.py "$SP/songs" $(cut -d' ' -f1 "$SP/songs/batch.txt")
