# файл сайта из spec + route.json + плоских таймингов
import json, sys
spec=json.load(open(sys.argv[1])); route=json.load(open(sys.argv[2])); ts=json.load(open(sys.argv[3])); vid=sys.argv[4]; method=sys.argv[5]; note=sys.argv[6] if len(sys.argv)>6 else ""; VAR=sys.argv[7] if len(sys.argv)>7 else None
ROOT='/workspaces/schubert-lieder'; song=json.load(open(spec['song']))
perf=[p for p in json.load(open(f'{ROOT}/app/src/data/performances.json'))[spec['key']] if p['videoId']==vid][0]
out={"d":spec['d'],"videoId":vid,"performance":f"{perf['name']}, {perf['year']}","method":method,"verified_by_ear":False,"note":note,"extra_lines":[],"variants":(json.load(open(VAR)) if VAR else []),"route":[]}
# ТИРЕ и другие слова без букв: нулевой интервал в точке начала следующего слова — никогда не подсвечиваются
import re, unicodedata
def _has_letters(w): return any(unicodedata.category(c).startswith('L') for c in w)
for k,r in enumerate(ts):
    if not _has_letters(r['w']):   # «без букв» — по Unicode-категории (è, à — слова!)
        nx=ts[k+1]['start'] if k+1<len(ts) else r['end']; r['start']=r['end']=nx
        if k>0: ts[k-1]['end']=max(ts[k-1]['end'],r['end']) if ts[k-1]['end']<=nx else ts[k-1]['end']
k=0
for r in route:
    s,l=(r if isinstance(r,list) else (r['s'],r['l'])); n=len(song['stanzas'][s]['lines_de'][l].split())
    ks=list(range(n)) if isinstance(r,list) or not r.get('k') else r['k']
    w=[None]*n
    for kk in ks: w[kk]=[ts[k]['start'],ts[k]['end']]; k+=1
    out['route'].append({"s":s,"l":l,"w":w})
assert k==len(ts),(k,len(ts))
path=f"{ROOT}/app/src/data/timings/{spec['prefix']}-{vid}.json"; json.dump(out,open(path,'w'),ensure_ascii=False,indent=1); print("записан",path)
