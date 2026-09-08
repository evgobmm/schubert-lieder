#!/bin/bash
# Партия песен: batch_gpu.sh <D…>  (например 911/1 911/2 …). Для каждой песни — каталог $SP/songs/<prefix> (spec.json, vids.txt);
# звук скачивается ЛОКАЛЬНО (yt-dlp, DL_PAR потоков; с датацентровых IP YouTube не отдаёт), тяжёлые стадии — на GPU Modal
# (gpu_stage.py, до 10 контейнеров), затем finish_control.sh по каждой песне (FIN_PAR параллельно) и сводка.
# Все шаги идемпотентны: повторный запуск пропускает готовое. Ориентир: 100 записей за ~15 мин.
set -e; SCRIPTS=$(dirname "$(realpath "$0")"); SP=$(cd "$SCRIPTS/.."; pwd); PY=$SP/align/.venv/bin/python; export PATH="$SP/bin:$PATH"
export SCRIPTS SP; DL_PAR=${DL_PAR:-4}; FIN_PAR=${FIN_PAR:-6}
mkdir -p "$SP/songs" "$SP/full" "$SP/align" "$SP/audio"; cd "$SP"
: > "$SP/songs/batch.txt"
echo "=== 1. спецификации $(date +%T) ==="
for D in "$@"; do line=$($PY $SCRIPTS/make_spec.py "$D" "$SP/songs"); echo "  $D -> $line"; echo "$line" >> "$SP/songs/batch.txt"; done
echo "=== 2. скачивание (локально, $DL_PAR потоков) $(date +%T) ==="
cut -d' ' -f3- "$SP/songs/batch.txt" | tr ' ' '\n' | sort -u | xargs -P "$DL_PAR" -I{} sh -c 'ls "$SP"/full/{}.* >/dev/null 2>&1 || yt-dlp -q --no-warnings -f bestaudio --retries 3 -o "$SP/full/{}.%(ext)s" -- "https://www.youtube.com/watch?v={}" 2>&1 | grep -v "JavaScript runtime" | tail -1 || echo "  {}: НЕ СКАЧАНО"'
echo "  скачано файлов: $(ls "$SP/full" | wc -l) $(date +%T)"
echo "=== 3. GPU (Modal) по языкам $(date +%T) ==="
for lang in $(cut -d' ' -f2 "$SP/songs/batch.txt" | sort -u); do
  awk -v L="$lang" '$2==L {for(i=3;i<=NF;i++) print $i}' "$SP/songs/batch.txt" | sort -u > "$SP/songs/vids_$lang.txt"
  CTC=$($PY -c "import json,glob;print([json.load(open(f))['ctc_model'] for f in glob.glob('$SP/songs/*/spec.json') if json.load(open(f))['lang']=='$lang'][0])")
  (cd "$SCRIPTS" && $SP/align/.venv/bin/modal run gpu_stage.py --list-file "$SP/songs/vids_$lang.txt" --lang "$lang" --ctc-model "$CTC" --indir "$SP/full" --outdir "$SP/align" --audiodir "$SP/audio" 2>&1 | grep -v "aclose\|async_generator\|RuntimeError\|Traceback\|^$")
done
echo "=== 4. сборка песен (CPU, $FIN_PAR параллельно) $(date +%T) ==="
cut -d' ' -f1 "$SP/songs/batch.txt" | xargs -P "$FIN_PAR" -I{} sh -c 'OMP_NUM_THREADS=2 "$SCRIPTS"/finish_control.sh "$SP"/songs/{} > "$SP"/songs/{}/finish.log 2>&1 || echo "  {}: ОШИБКА (см. finish.log)"'
while read prefix lang vids; do
  echo "--- $prefix ---"; grep -a -E "^  .*->|дыр|дополнен|купюра|ГОТОВО|Traceback|ОШИБКА" "$SP/songs/$prefix/finish.log" | cut -c1-160 | sed 's/^/  /'
done < "$SP/songs/batch.txt"
echo "=== 5. сводка $(date +%T) ==="; $PY $SCRIPTS/batch_report.py "$SP/songs" $(cut -d' ' -f1 "$SP/songs/batch.txt")
