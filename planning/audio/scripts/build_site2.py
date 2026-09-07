# файл сайта из spec + route.json + плоских таймингов
import json, sys
spec=json.load(open(sys.argv[1])); route=json.load(open(sys.argv[2])); ts=json.load(open(sys.argv[3])); vid=sys.argv[4]; method=sys.argv[5]; note=sys.argv[6] if len(sys.argv)>6 else ""; VAR=sys.argv[7] if len(sys.argv)>7 else None
ROOT='/workspaces/schubert-lieder'; song=json.load(open(spec['song']))
perf=[p for p in json.load(open(f'{ROOT}/app/src/data/performances.json'))[spec['key']] if p['videoId']==vid][0]
out={"d":spec['d'],"videoId":vid,"performance":f"{perf['name']}, {perf['year']}","method":method,"verified_by_ear":False,"note":note,"extra_lines":[],"variants":(json.load(open(VAR)) if VAR else []),"route":[]}
# ТИРЕ и другие слова без букв: нулевой интервал в точке начала следующего слова — никогда не подсвечиваются
import re
for k,r in enumerate(ts):
    if not re.search(r'[A-Za-zÄÖÜäöüß]',r['w']):
        nx=ts[k+1]['start'] if k+1<len(ts) else r['end']; r['start']=r['end']=nx
        if k>0: ts[k-1]['end']=max(ts[k-1]['end'],r['end']) if ts[k-1]['end']<=nx else ts[k-1]['end']
k=0
for s,l in route:
    n=len(song['stanzas'][s]['lines_de'][l].split()); w=[[ts[k+i]['start'],ts[k+i]['end']] for i in range(n)]; k+=n
    out['route'].append({"s":s,"l":l,"w":w})
assert k==len(ts),(k,len(ts))
path=f"{ROOT}/app/src/data/timings/{spec['prefix']}-{vid}.json"; json.dump(out,open(path,'w'),ensure_ascii=False,indent=1); print("записан",path)
