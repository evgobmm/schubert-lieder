#!/bin/bash
# Пересобрать сводки и очереди всех партий по их существующим файлам planning/audio/report-<имя>.md (список песен берётся из строк «| D … |»).
# regen_reports.sh  — после выкладки удержанных, доработок и т.п.
SCRIPTS=$(dirname "$(realpath "$0")"); SP=$(cd "$SCRIPTS/.."; pwd); PY=$SP/align/.venv/bin/python; R=/workspaces/schubert-lieder
for rep in $R/planning/audio/report-*.md; do
  name=$(basename "$rep" .md); name=${name#report-}
  prefixes=$(grep -o "^| D [0-9A-Za-z/]*" "$rep" | sed 's#^| D ##; s#/#-#g; s#^#d#' | while read p; do [ -f "$SP/songs/$p/spec.json" ] && echo $p; done | tr '\n' ' ')
  [ -n "$prefixes" ] || { echo "$name: нет каталогов песен, пропуск"; continue; }
  $PY $SCRIPTS/batch_report.py "$SP/songs" $prefixes > /dev/null && cp "$SP/songs/report.md" "$rep"
  $PY $SCRIPTS/queues.py "$SP/songs" "$R/planning/audio/queues-$name.md" $prefixes > /dev/null && echo "$name: $(echo $prefixes | wc -w) песен — сводка и очереди обновлены"
done
