#!/bin/bash
# Публикация партии после сборки: publish_batch.sh <имя партии> [файл партии]
# С файлом партии в коммит идут только тайминги её песен (чтобы не захватить незавершённую сборку другой партии) и planning/audio;
# без файла — все изменения в app/src/data/timings.
set -e; R=/workspaces/schubert-lieder; cd $R; T=app/src/data/timings
git add -A planning/audio
if [ -n "$2" ]; then
  # `|| true` обязателен: под set -e первая песня без файлов (все записи удержаны) обрывала цикл, и половина партии 3 осталась незакоммиченной
  for p in $(cut -d' ' -f1 "$2"); do ls $T/$p-*.json 2>/dev/null || true; git ls-files --deleted -- "$T/$p-*.json" || true; done | sort -u | xargs -r git add -A --
else git add -A $T; fi
N=$(git diff --cached --name-only -- $T | wc -l)
git commit -q -m "$1: выложены записи, прошедшие ворота (≤ 2 дыр, ни одной длиннее 8 с); сводка и очереди — planning/audio

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RbDTGphwEB9pErECNgQ5e3" && git push -q origin main && echo "опубликовано: изменённых файлов таймингов $N; всего на сайте $(ls $T/*.json | wc -l)" || echo "нечего публиковать"
