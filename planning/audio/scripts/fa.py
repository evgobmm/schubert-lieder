import sys, json, re, torch, torchaudio
from torchaudio.functional import forced_align, merge_tokens

MAP={'ä':'a','ö':'o','ü':'u','ß':'ss','Ä':'a','Ö':'o','Ü':'u','é':'e','è':'e','ê':'e','ô':'o','â':'a','î':'i','ç':'c'}
def rom(w):
    w=''.join(MAP.get(c,c) for c in w).lower()
    w=re.sub(r"[^a-z']",'',w)
    return w

def main(empt, words_json, out_json):
    d=torch.load(empt); em=d["emission"]; labels=d["labels"]
    dic={c:i for i,c in enumerate(labels)}
    words=json.load(open(words_json))          # list of original words in sung order
    norm=[rom(w) for w in words]
    keep=[i for i,n in enumerate(norm) if n]
    toks=[]; lens=[]
    for i in keep:
        t=[dic[c] for c in norm[i] if c in dic]
        if not t: lens.append((i,0)); continue   # ПУСТЫЕ слова (тире) — нулевой интервал
        toks+=t; lens.append((i,len(t)))
    lp=torch.log_softmax(em,dim=-1).unsqueeze(0)
    tgt=torch.tensor([toks],dtype=torch.int32)
    al,sc=forced_align(lp,tgt,blank=0)
    spans=merge_tokens(al[0],sc[0].exp())
    assert len(spans)==len(toks),(len(spans),len(toks))
    res=[];p=0
    for i,L in lens:
        if L==0:
            e=res[-1]['end'] if res else 0.0
            res.append({"i":i,"w":words[i],"start":e,"end":e,"score":0.0}); continue
        s=spans[p:p+L]; p+=L
        res.append({"i":i,"w":words[i],"start":round(s[0].start*0.02,3),
                    "end":round(s[-1].end*0.02,3),
                    "score":round(sum(x.score*(x.end-x.start) for x in s)/max(1,sum(x.end-x.start for x in s)),3)})
    json.dump(res,open(out_json,'w'),ensure_ascii=False,indent=0)
    for r in res: print(f"{r['start']:7.2f} {r['end']:7.2f} {r['score']:.2f}  {r['w']}")
main(*sys.argv[1:])
