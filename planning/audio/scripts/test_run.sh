#!/bin/bash
# Тестовый прогон wh_pipeline (без записи в app/): test_run.sh <spec.json> <outdir> <wh-json-dir-suffix> vid...
# печатает маршрут каждой записи и, если в app/ есть файл, — отличия маршрута и число слов со сдвигом начала > 0.3 с
set -e; cd "$(dirname "$0")"; SP=$(cd ..; pwd); PY=$SP/align/.venv/bin/python; SPEC=$(realpath "$1"); OUT=$(realpath -m "$2"); shift 2; mkdir -p "$OUT"
PREFIX=$(python3 -c "import json;print(json.load(open('$SPEC'))['prefix'])"); SONG=$(python3 -c "import json;print(json.load(open('$SPEC'))['song'])")
for v in "$@"; do
  mkdir -p "$OUT/wh_$v"; echo "=== $v ==="
  (cd "$OUT/wh_$v" && OUT_DIR=$OUT DEBUG_PASSES=${DEBUG_PASSES:-} nice -n 15 $PY $SP/r3/wh_pipeline.py "$SPEC" $v $SP/align/${WHVAR:-wh}_$v.json $SP/audio/${v}_voc.wav $SP/align/em_mms_$v.pt $SP/align/em_de_$v.pt 2>&1 | grep -v Warn | grep -E "спето|отброшено|хвост|голова|купюра|подтверждено|проход |Traceback|Error|File " | cut -c1-220)
  $PY - "$SONG" "$OUT/$PREFIX-$v.json" "/workspaces/schubert-lieder/app/src/data/timings/$PREFIX-$v.json" <<'PY'
import json,sys,os
song=json.load(open(sys.argv[1])); new=json.load(open(sys.argv[2]))
def skel(t):
    o=[]
    for p in t['route']:
        n=len(song['stanzas'][p['s']]['lines_de'][p['l']].split()); ks=[k for k,x in enumerate(p['w']) if x]
        o.append(f"{p['s']}:{p['l']}"+('' if ks==list(range(n)) else '['+','.join(map(str,ks))+']'))
    return o
print('маршрут:',len(new['route']),'проходов:',' '.join(skel(new)))
if os.path.exists(sys.argv[3]):
    old=json.load(open(sys.argv[3])); so,sn=skel(old),skel(new)
    if so!=sn: print('  МАРШРУТ ИЗМЕНИЛСЯ: было',' '.join(so))
    # сдвиги начал по общим проходам (сопоставление проходов по ключу строки, по порядку)
    import difflib
    ko=[f"{p['s']}:{p['l']}" for p in old['route']]; kn=[f"{p['s']}:{p['l']}" for p in new['route']]; moved=[]
    for tag,i1,i2,j1,j2 in difflib.SequenceMatcher(None,ko,kn,autojunk=False).get_opcodes():
        if tag!='equal': continue
        for p,q in zip(old['route'][i1:i2],new['route'][j1:j2]):
            moved+=[(p['s'],p['l'],k,a[0],b[0]) for k,(a,b) in enumerate(zip(p['w'],q['w'])) if a and b and abs(a[0]-b[0])>0.3]
    print(f"  слов со сдвигом начала >0.3 с (по общим проходам): {len(moved)}"+(' — '+' '.join(f"{s}:{l}/{k} {a:.2f}→{b:.2f}" for s,l,k,a,b in moved[:14]) if moved else ''))
    vo=sorted((v['s'],v['l'],v['k'],v['heard']) for v in old.get('variants',[])); vn=sorted((v['s'],v['l'],v['k'],v['heard']) for v in new.get('variants',[]))
    if vo!=vn: print('  ВАРИАНТЫ: было',vo,'стало',vn)
    else: print('  варианты те же:',len(vn))
PY
done
