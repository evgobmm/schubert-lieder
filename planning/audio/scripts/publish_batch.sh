#!/bin/bash
# Публикация партии после сборки: коммит файлов сайта, сводки и очередей. publish_batch.sh <имя партии>
set -e; R=/workspaces/schubert-lieder; cd $R; N=$(git status --short app/src/data/timings | wc -l)
git add -A app/src/data/timings planning/audio && git commit -q -m "$1: выложены записи, прошедшие ворота (≤ 2 дыр, ни одной длиннее 8 с); сводка и очереди — planning/audio

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01RbDTGphwEB9pErECNgQ5e3" && git push -q origin main && echo "опубликовано: изменённых файлов таймингов $N; всего на сайте $(ls app/src/data/timings/*.json | wc -l)" || echo "нечего публиковать"
