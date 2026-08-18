#!/usr/bin/env bash
# Сторож памяти контейнера (правило: docs/rules/workflow.md, «Устойчивость к падению воркспейса»).
# Каждые 5 с: (1) убивает ugrep, раздувшийся до >4% RAM (~300 МБ на контейнере 7,6 ГБ);
# (2) при падении available ниже порога пишет тревогу и убивает самый жирный ugrep/node-поиск.
# Тихий режим: события — только в лог $LOG. Идемпотентен (lock-файл).
LOCK=/tmp/claude-1000/memory-guard.lock
LOG=/tmp/claude-1000/memory-guard.log
mkdir -p /tmp/claude-1000
if [ -f "$LOCK" ] && kill -0 "$(cat "$LOCK" 2>/dev/null)" 2>/dev/null; then
  exit 0 # уже работает
fi
echo $$ > "$LOCK"
echo "$(date '+%F %T') guard started (pid $$)" >> "$LOG"
while true; do
  # ugrep >4% RAM — убить сразу
  ps -eo pid,pmem,rss,comm --no-headers 2>/dev/null | awk '$4 ~ /ugrep/ && $2+0 > 4.0 {print $1, $3}' | while read -r pid rss; do
    kill -9 "$pid" 2>/dev/null && echo "$(date '+%F %T') KILL ugrep pid=$pid rss=${rss}KB" >> "$LOG"
  done
  avail=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)
  if [ "$avail" -lt 600 ]; then
    top_line=$(ps -eo pid,rss,comm --sort=-rss --no-headers | head -1)
    echo "$(date '+%F %T') LOWMEM available=${avail}MB top=[$top_line]" >> "$LOG"
    # добиваем только поисковые процессы, не трогаем vscode/claude/node-агентов
    ps -eo pid,rss,comm --no-headers | awk '$3 ~ /ugrep/ {print $1}' | while read -r pid; do
      kill -9 "$pid" 2>/dev/null && echo "$(date '+%F %T') KILL(lowmem) ugrep pid=$pid" >> "$LOG"
    done
  fi
  sleep 5
done
