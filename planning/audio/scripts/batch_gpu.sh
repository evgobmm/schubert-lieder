#!/bin/bash
# Партия песен: batch_gpu.sh <D…>  (например 911/1 911/2 …) — спецификации -> скачивание (ЛОКАЛЬНО, yt-dlp, DL_PAR потоков; с датацентровых
# IP YouTube не отдаёт) -> GPU Modal (gpu_stage.py, до 10 контейнеров) -> сборка в облаке + ворота + сводка + очереди (finish_cloud.sh).
# Без аргументов — продолжить по готовому файлу партии $BATCH (по умолчанию $SP/songs/batch.txt): шаги 2–4 по нему, готовое пропускается.
# Переменные: BATCH (файл партии: <prefix> <lang> <vid…>), BATCH_NAME (имя для report-/queues-<имя>.md), DL_PAR (потоков скачивания, 4),
# STOP_AFTER_DL=1 / STOP_AFTER_GPU=1 (остановиться после шага), LOCAL_FINISH=1 (сборка локально, batch_finish.sh).
# Все шаги идемпотентны. Ориентир: 100 записей за ~15 мин. Работающий скрипт НЕ править на месте (bash читает файл по ходу выполнения —
# партия 3 упала с синтаксической ошибкой после правки копии cp); копии в $SP/tools обновлять только sync_tools.sh (rsync -> rename).
set -e; SCRIPTS=$(dirname "$(realpath "$0")"); SP=$(cd "$SCRIPTS/.."; pwd); PY=$SP/align/.venv/bin/python; export PATH="$SP/bin:$PATH"
export SCRIPTS SP; DL_PAR=${DL_PAR:-4}; BATCH=${BATCH:-$SP/songs/batch.txt}; export BATCH_NAME=${BATCH_NAME:-batch}
mkdir -p "$SP/songs" "$SP/full" "$SP/align" "$SP/audio"; cd "$SP"
if [ $# -gt 0 ]; then
  : > "$BATCH"; echo "=== 1. спецификации ($BATCH) $(date +%T) ==="
  for D in "$@"; do line=$($PY $SCRIPTS/make_spec.py "$D" "$SP/songs"); echo "  $D -> $line"; echo "$line" >> "$BATCH"; done
else echo "=== 1. файл партии $BATCH: $(wc -l < "$BATCH") песен $(date +%T) ==="; fi
echo "=== 2. скачивание (локально, $DL_PAR потоков) $(date +%T) ==="
# готовым считается файл без суффикса .part (обрыв yt-dlp оставляет <vid>.webm.part — его удаляем и качаем заново)
cut -d' ' -f3- "$BATCH" | tr ' ' '\n' | sort -u | xargs -P "$DL_PAR" -I{} sh -c 'ls "$SP"/full/{}.* 2>/dev/null | grep -qv "part$" || { rm -f "$SP"/full/{}.*.part; yt-dlp -q --no-warnings -f bestaudio --js-runtimes node:/home/vscode/.local/bin/node --remote-components ejs:github --retries 3 -o "$SP/full/{}.%(ext)s" -- "https://www.youtube.com/watch?v={}" 2>&1 | grep -v "JavaScript runtime" | tail -1; ls "$SP"/full/{}.* 2>/dev/null | grep -qv "part$" || echo "  {}: НЕ СКАЧАНО"; }'
echo "  скачано файлов всего: $(ls "$SP/full" | grep -vc "part$"); не скачано в партии: $(for v in $(cut -d' ' -f3- "$BATCH" | tr ' ' '\n' | sort -u); do ls "$SP"/full/$v.* 2>/dev/null | grep -qv "part$" || echo x; done | wc -l) $(date +%T)"
[ -n "$STOP_AFTER_DL" ] && { echo "остановка после скачивания (STOP_AFTER_DL) $(date +%T)"; exit 0; }
echo "=== 3. GPU (Modal) по языкам $(date +%T) ==="
for lang in $(cut -d' ' -f2 "$BATCH" | sort -u); do
  VIDS=$SP/songs/vids_${BATCH_NAME}_$lang.txt
  awk -v L="$lang" '$2==L {for(i=3;i<=NF;i++) print $i}' "$BATCH" | awk '!seen[$0]++' > "$VIDS"   # в порядке песен (не по алфавиту): при обрыве готовы целые песни
  P1=$(awk -v L="$lang" '$2==L {print $1; exit}' "$BATCH"); CTC=$($PY -c "import json;print(json.load(open('$SP/songs/$P1/spec.json'))['ctc_model'])")
  for attempt in 1 2 3; do   # при обрыве соединения (DNS, сеть) — повтор: готовые записи пропускаются
    (cd "$SCRIPTS" && $SP/align/.venv/bin/modal run gpu_stage.py::main --list-file "$VIDS" --lang "$lang" --ctc-model "$CTC" --indir "$SP/full" --outdir "$SP/align" --audiodir "$SP/audio" 2>&1 | grep -a -E "на GPU|готово за|ОШИБКА|Error|disabled" | cut -c1-160)
    left=$(for v in $(cat "$VIDS"); do [ -s "$SP/align/wh_$v.json" ] || echo x; done | wc -l); echo "  осталось без выходов ($lang): $left $(date +%T)"; [ "$left" = "0" ] && break
  done
done
[ -n "$STOP_AFTER_GPU" ] && { echo "остановка после GPU-стадии (STOP_AFTER_GPU) $(date +%T)"; exit 0; }
if [ -n "$LOCAL_FINISH" ]; then
  echo "=== 4. сборка песен локально в два прохода (окна -> GPU -> сборка) $(date +%T) ==="; FIN_PAR=${FIN_PAR:-3} "$SCRIPTS"/batch_finish.sh $(cut -d' ' -f1 "$BATCH")
else
  echo "=== 4. сборка в облаке, ворота, сводка, очереди (finish_cloud.sh) $(date +%T) ==="; "$SCRIPTS"/finish_cloud.sh "$BATCH"
fi
echo "ПАРТИЯ $BATCH_NAME ГОТОВА $(date +%T)"
