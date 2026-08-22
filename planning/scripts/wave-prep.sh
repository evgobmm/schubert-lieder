#!/usr/bin/env bash
# Подготовка партии волны ОДНОЙ командой (0 токенов): пакеты → предзагрузка источников → бандлы dict/facts → args для wave-v2-workflow.js
#   bash planning/scripts/wave-prep.sh <workDir> <d> [<d> ...]
set -euo pipefail
W="$1"; shift
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
mkdir -p "$W"
node "$REPO/planning/scripts/pilot-prep.js" "$W" "$@" > "$W/prep.log"
node "$REPO/planning/scripts/prefetch-sources.js" "$W/prefetch" "$@" | tee -a "$W/prep.log"
for d in "$@"; do
  node "$REPO/planning/scripts/build-bundle.js" dict "$d" "$W" | head -1
  node "$REPO/planning/scripts/build-bundle.js" facts "$d" "$W" | head -1
done
node "$REPO/planning/scripts/wave-args.js" "$W" "$@" > "$W/args.json"
echo "ГОТОВО. args для Workflow({scriptPath: 'planning/catalog/wave-v2-workflow.js', args}): $W/args.json"
cat "$W/args.json"
