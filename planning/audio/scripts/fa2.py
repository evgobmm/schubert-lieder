import sys, json, re, torch
from torchaudio.functional import forced_align, merge_tokens
FALLBACK={'ä':'a','ö':'o','ü':'u','ß':'ss','é':'e','è':'e'}
def main(empt, words_json, out_json):
    d=torch.load(empt); em=d["emission"]; labels=d["labels"]; blank=d.get("blank",0)
    dic={c:i for i,c in enumerate(labels)}
    print("vocab:", ''.join(c for c in labels if c and len(c)==1))
    def norm(w):
        w=w.lower().replace('’',"'")
        out=[]
        for c in w:
            if c in dic and c not in ('|',): out.append(c)
            elif c in FALLBACK: out+= [x for x in FALLBACK[c] if x in dic]
        return ''.join(x for x in out if x.isalpha() or x=="'")
    words=json.load(open(words_json)); toks=[]; lens=[]
    for i,w in enumerate(words):
        n=norm(w)
        t=[dic[c] for c in n if c in dic]
        if not t: lens.append((i,0)); continue   # ПУСТЫЕ слова (тире) — нулевой интервал
        toks+=t; lens.append((i,len(t)))
    lp=torch.log_softmax(em,dim=-1).unsqueeze(0)
    al,sc=forced_align(lp,torch.tensor([toks],dtype=torch.int32),blank=blank)
    spans=merge_tokens(al[0],sc[0].exp())
    res=[];p=0
    for i,L in lens:
        if L==0:
            e=res[-1]['end'] if res else 0.0
            res.append({"i":i,"w":words[i],"start":e,"end":e,"score":0.0}); continue
        s=spans[p:p+L]; p+=L
        dur=sum(x.end-x.start for x in s) or 1
        res.append({"i":i,"w":words[i],"start":round(s[0].start*0.02,3),"end":round(s[-1].end*0.02,3),
                    "score":round(sum(x.score*(x.end-x.start) for x in s)/dur,3)})
    json.dump(res,open(out_json,'w'),ensure_ascii=False,indent=0)
    import statistics; print("median score",statistics.median(x['score'] for x in res),"n",len(res))
main(*sys.argv[1:])
