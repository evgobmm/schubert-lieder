import sys, json, torch, soundfile as sf, numpy as np, torchaudio

SR=16000
def load(p):
    x,sr=sf.read(p,dtype='float32')
    assert sr==SR and x.ndim==1, (sr,x.shape)
    return torch.from_numpy(x)

def emissions(model, wav, chunk_s=20, ctx_s=2):
    N=wav.shape[0]; cs=chunk_s*SR; ct=ctx_s*SR; out=[]
    with torch.inference_mode():
        for st in range(0,N,cs):
            a=max(0,st-ct); b=min(N,st+cs+ct)
            e,_=model(wav[a:b].unsqueeze(0))
            e=e[0]
            # frames covering [st, min(st+cs,N)) inside segment
            f0=(st-a)//320; f1=f0+(min(st+cs,N)-st)//320
            out.append(e[f0:min(f1,e.shape[0])])
    return torch.cat(out,0)

if __name__=="__main__":
    path=sys.argv[1]; outp=sys.argv[2]
    b=torchaudio.pipelines.MMS_FA
    m=b.get_model(with_star=False); m.eval()
    wav=load(path)
    print("dur %.1fs"%(wav.shape[0]/SR),flush=True)
    em=emissions(m,wav)
    print("emission",em.shape,flush=True)
    torch.save({"emission":em,"labels":b.get_labels()},outp)
    lab=b.get_labels()
    ids=em.argmax(-1).tolist()
    prev=None; s=""
    for i in ids:
        if i!=prev and i!=0: s+=lab[i]
        prev=i
    print("GREEDY:",s.replace("|"," "))
