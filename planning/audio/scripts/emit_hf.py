import sys, torch, soundfile as sf
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
SR=16000
mid=sys.argv[1]; path=sys.argv[2]; outp=sys.argv[3]
proc=Wav2Vec2Processor.from_pretrained(mid); model=Wav2Vec2ForCTC.from_pretrained(mid).eval()
x,sr=sf.read(path,dtype='float32'); assert sr==SR
wav=torch.from_numpy(x); N=wav.shape[0]; cs=20*SR; ct=2*SR; out=[]
with torch.inference_mode():
    for st in range(0,N,cs):
        a=max(0,st-ct); b=min(N,st+cs+ct)
        iv=proc(wav[a:b].numpy(),sampling_rate=SR,return_tensors="pt").input_values
        lg=model(iv).logits[0]
        f0=(st-a)//320; f1=f0+(min(st+cs,N)-st)//320
        out.append(lg[f0:min(f1,lg.shape[0])])
em=torch.cat(out,0)
v=proc.tokenizer.get_vocab(); labels=[None]*len(v)
for k,i in v.items(): labels[i]=k
print("emission",em.shape,"blank_id",proc.tokenizer.pad_token_id,"labels",labels[:8])
torch.save({"emission":em,"labels":labels,"blank":proc.tokenizer.pad_token_id,"word_delim":v.get('|')},outp)
ids=em.argmax(-1).tolist(); prev=None; s=""
for i in ids:
    if i!=prev and i!=proc.tokenizer.pad_token_id: s+=labels[i]
    prev=i
print("GREEDY:",s.replace("|"," ")[:600])
