import sys, json, time
from faster_whisper import WhisperModel
wav, out, size = sys.argv[1], sys.argv[2], (sys.argv[3] if len(sys.argv)>3 else "large-v3")
t0=time.time(); model=WhisperModel(size, device="cpu", compute_type="int8", cpu_threads=8)
segs, info = model.transcribe(wav, language="de", word_timestamps=True, beam_size=5, vad_filter=False, condition_on_previous_text=False)
res=[]
for s in segs:
    res.append({"start":round(s.start,2),"end":round(s.end,2),"text":s.text.strip(),"words":[{"w":w.word.strip(),"start":round(w.start,2),"end":round(w.end,2),"p":round(w.probability,2)} for w in (s.words or [])]})
json.dump(res,open(out,'w'),ensure_ascii=False,indent=0)
print(f"модель {size}, {time.time()-t0:.0f} с; сегментов {len(res)}, слов {sum(len(r['words']) for r in res)}")
for r in res: print(f"  {r['start']:6.1f}–{r['end']:6.1f}  {r['text']}")
