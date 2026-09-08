#!/bin/bash
# Партия песен: batch_gpu.sh <D…>  (например 911/1 911/2 …). Для каждой песни — каталог $SP/songs/<prefix> (spec.json, vids.txt);
# звук скачивается ЛОКАЛЬНО (yt-dlp, DL_PAR потоков; с датацентровых IP YouTube не отдаёт), тяжёлые стадии — на GPU Modal
# (gpu_stage.py, до 10 контейнеров), затем finish_control.sh по каждой песне (FIN_PAR параллельно) и сводка.
# Все шаги идемпотентны: повторный запуск пропускает готовое. Ориентир: 100 записей за ~15 мин.
set -e; SCRIPTS=$(dirname "$(realpath "$0")"); SP=$(cd "$SCRIPTS/.."; pwd); PY=$SP/align/.venv/bin/python; export PATH="$SP/bin:$PATH"
export SCRIPTS SP; DL_PAR=${DL_PAR:-4}; FIN_PAR=${FIN_PAR:-3}
mkdir -p "$SP/songs" "$SP/full" "$SP/align" "$SP/audio"; cd "$SP"
: > "$SP/songs/batch.txt"
echo "=== 1. спецификации $(date +%T) ==="
for D in "$@"; do line=$($PY $SCRIPTS/make_spec.py "$D" "$SP/songs"); echo "  $D -> $line"; echo "$line" >> "$SP/songs/batch.txt"; done
echo "=== 2. скачивание (локально, $DL_PAR потоков) $(date +%T) ==="
cut -d' ' -f3- "$SP/songs/batch.txt" | tr ' ' '\n' | sort -u | xargs -P "$DL_PAR" -I{} sh -c 'ls "$SP"/full/{}.* >/dev/null 2>&1 || { yt-dlp -q --no-warnings -f bestaudio --retries 3 -o "$SP/full/{}.%(ext)s" -- "https://www.youtube.com/watch?v={}" 2>&1 | grep -v "JavaScript runtime" | tail -1; ls "$SP"/full/{}.* >/dev/null 2>&1 || echo "  {}: НЕ СКАЧАНО"; }'
echo "  скачано файлов: $(ls "$SP/full" | wc -l) $(date +%T)"
echo "=== 3. GPU (Modal) по языкам $(date +%T) ==="
for lang in $(cut -d' ' -f2 "$SP/songs/batch.txt" | sort -u); do
  awk -v L="$lang" '$2==L {for(i=3;i<=NF;i++) print $i}' "$SP/songs/batch.txt" | awk '!seen[$0]++' > "$SP/songs/vids_$lang.txt"   # в порядке песен (не по алфавиту): при обрыве готовы целые песни
  CTC=$($PY -c "import json,glob;print([json.load(open(f))['ctc_model'] for f in glob.glob('$SP/songs/*/spec.json') if json.load(open(f))['lang']=='$lang'][0])")
  (cd "$SCRIPTS" && $SP/align/.venv/bin/modal run gpu_stage.py::main --list-file "$SP/songs/vids_$lang.txt" --lang "$lang" --ctc-model "$CTC" --indir "$SP/full" --outdir "$SP/align" --audiodir "$SP/audio" 2>&1 | grep -v "aclose\|async_generator\|RuntimeError\|Traceback\|^$")
done
[ -n "$STOP_AFTER_GPU" ] && { echo "остановка после GPU-стадии (STOP_AFTER_GPU) $(date +%T)"; exit 0; }
if [ -n "$LOCAL_FINISH" ]; then
  echo "=== 4. сборка песен локально в два прохода (окна -> GPU -> сборка) $(date +%T) ==="; FIN_PAR=${FIN_PAR:-3} "$SCRIPTS"/batch_finish.sh $(cut -d' ' -f1 "$SP/songs/batch.txt")
else
  echo "=== 4. сборка песен в облаке (Modal CPU, cpu_stage.py; данные — из тома schubert-data) $(date +%T) ==="
  (cd "$SCRIPTS" && $SP/align/.venv/bin/modal run cpu_stage.py --batch "$SP/songs/batch.txt" --songs "$SP/songs" --app-dir /workspaces/schubert-lieder/app/src/data/timings 2>&1 | grep -a -E "^[a-z0-9-]+: |ОШИБКА|готово:|сборка в облаке" | cut -c1-160)
  for p in $(cut -d' ' -f1 "$SP/songs/batch.txt"); do mkdir -p "$SP/songs/$p/held"; for f in $(grep -a -o "^[A-Za-z0-9_-]\{11\}: УДЕРЖАНО" "$SP/songs/$p/finish.log" 2>/dev/null | cut -d: -f1); do mv -f "/workspaces/schubert-lieder/app/src/data/timings/$p-$f.json" "$SP/songs/$p/held/" 2>/dev/null; done; done
  echo "=== 5. сводка $(date +%T) ==="; $PY $SCRIPTS/batch_report.py "$SP/songs" $(cut -d' ' -f1 "$SP/songs/batch.txt")
fi
