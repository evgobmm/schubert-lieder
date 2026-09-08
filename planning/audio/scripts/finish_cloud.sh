#!/bin/bash
# Сборка партии в облаке отдельно от скачивания/GPU (когда GPU-стадия уже прошла): finish_cloud.sh [batch.txt]
# -> cpu_stage.py по всем песням партии -> удержанные (> порога дыр) убираются из app/ в songs/<prefix>/held -> сводка -> очереди.
set -e; SCRIPTS=$(dirname "$(realpath "$0")"); SP=$(cd "$SCRIPTS/.."; pwd); PY=$SP/align/.venv/bin/python; APP=/workspaces/schubert-lieder/app/src/data/timings
BATCH=${1:-$SP/songs/batch.txt}; NAME=${BATCH_NAME:-batch}
echo "=== сборка в облаке: $(wc -l < "$BATCH") песен $(date +%T) ==="
(cd "$SCRIPTS" && $SP/align/.venv/bin/modal run cpu_stage.py --batch "$BATCH" --songs "$SP/songs" --app-dir "$APP" 2>&1 | grep -a -E "^[a-z0-9-]+: |ОШИБКА|готово:|сборка в облаке" | cut -c1-160)
for p in $(cut -d' ' -f1 "$BATCH"); do mkdir -p "$SP/songs/$p/held"; for f in $(grep -a -o "^[A-Za-z0-9_-]\{11\}: УДЕРЖАНО" "$SP/songs/$p/finish.log" 2>/dev/null | cut -d: -f1); do mv -f "$APP/$p-$f.json" "$SP/songs/$p/held/" 2>/dev/null || true; done; done
echo "=== сводка $(date +%T) ==="; $PY $SCRIPTS/batch_report.py "$SP/songs" $(cut -d' ' -f1 "$BATCH")
$PY $SCRIPTS/queues.py "$SP/songs" "/workspaces/schubert-lieder/planning/audio/queues-$NAME.md" $(cut -d' ' -f1 "$BATCH") && cp "$SP/songs/report.md" "/workspaces/schubert-lieder/planning/audio/report-$NAME.md"
echo "выложено файлов партии: $(for p in $(cut -d' ' -f1 "$BATCH"); do ls $APP/$p-*.json 2>/dev/null; done | wc -l); удержано: $(for p in $(cut -d' ' -f1 "$BATCH"); do ls $SP/songs/$p/held/*.json 2>/dev/null; done | wc -l)"
