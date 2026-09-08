#!/bin/bash
# Сборка партии в два прохода (CPU-лёгкая, память контейнера 7,8 ГБ — FIN_PAR ≤ 3):
#   1) свои маршруты каждой записи с СБОРОМ окон, где поют, а Whisper слов не дал (RETRANSCRIBE=collect);
#   2) дораспознавание всех окон партии одним вызовом на GPU (Modal, gpu_stage.py::retr) — новые слова в wh_<vid>.json;
#   3) обычная сборка песен (finish_control.sh, RETRANSCRIBE=0) и сводка.
# batch_finish.sh <prefix…>
set -e; SCRIPTS=$(dirname "$(realpath "$0")"); SP=$(cd "$SCRIPTS/.."; pwd); PY=$SP/align/.venv/bin/python; export SCRIPTS SP; FIN_PAR=${FIN_PAR:-3}
echo "=== 1. свои маршруты + окна ($FIN_PAR параллельно) $(date +%T) ==="
printf '%s\n' "$@" | xargs -P "$FIN_PAR" -I{} sh -c 'cd "$SP"/songs/{} && RETRANSCRIBE=collect OMP_NUM_THREADS=2 "$SCRIPTS"/test_run.sh spec.json own $(cat vids.txt) > pass1.log 2>&1 || echo "  {}: ОШИБКА в проходе 1"'
$PY - "$SP" "$@" <<'PY'
import json,sys,glob,os
SP=sys.argv[1]; by={}
for p in sys.argv[2:]:
    lang=json.load(open(f'{SP}/songs/{p}/spec.json'))['lang']
    for f in glob.glob(f'{SP}/songs/{p}/own/wh_*/retr_windows.json'):
        vid=os.path.basename(os.path.dirname(f))[3:]
        for lo,hi in json.load(open(f)): by.setdefault(lang,[]).append({"vid":vid,"lo":lo,"hi":hi})
for lang,w in by.items(): json.dump(w,open(f'{SP}/songs/retr_windows_{lang}.json','w')); print(f"  окон ({lang}): {len(w)} у {len(set(x['vid'] for x in w))} записей")
open(f'{SP}/songs/retr_langs.txt','w').write(' '.join(by))
PY
echo "=== 2. дораспознавание окон на GPU $(date +%T) ==="
for lang in $(cat "$SP/songs/retr_langs.txt"); do (cd "$SCRIPTS" && $SP/align/.venv/bin/modal run gpu_stage.py::retr --windows "$SP/songs/retr_windows_$lang.json" --lang "$lang" --audiodir "$SP/audio" --outdir "$SP/align" 2>&1 | grep -a -v "aclose\|async_generator\|RuntimeError\|Traceback\|^$"); done
echo "=== 3. сборка песен ($FIN_PAR параллельно) $(date +%T) ==="
printf '%s\n' "$@" | xargs -P "$FIN_PAR" -I{} sh -c 'RETRANSCRIBE=0 OMP_NUM_THREADS=2 "$SCRIPTS"/finish_control.sh "$SP"/songs/{} > "$SP"/songs/{}/finish.log 2>&1 || echo "  {}: ОШИБКА (см. finish.log)"'
for p in "$@"; do echo "--- $p ---"; grep -a -E "^  .*->|дыр|дополнен|вариант .*→|ГОТОВО|Traceback|ОШИБКА" "$SP/songs/$p/finish.log" | cut -c1-160 | sed 's/^/  /'; done
echo "=== 4. сводка $(date +%T) ==="; $PY $SCRIPTS/batch_report.py "$SP/songs" "$@"
