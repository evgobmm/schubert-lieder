# Тяжёлые стадии конвейера на арендованном GPU (Modal, https://modal.com): Demucs (вокал) -> стем 16 кГц моно ->
# эмиссии MMS_FA и wav2vec2-xlsr (язык песни) -> Whisper large-v3 (слова с таймкодами). Выход побайтно совпадает по формату
# с локальными emit.py / emit_hf.py / whisper_tr.py, так что дальше работает обычный finish_control.sh на CPU.
#
# Запуск из рабочего каталога (нужен токен Modal: `modal token new` или `modal token set --token-id … --token-secret …`):
#   modal run gpu_stage.py --list-file vids_de.txt --lang de --ctc-model jonatasgrosman/wav2vec2-large-xlsr-53-german \
#       --indir ../full --outdir ../align --audiodir ../audio
# Вход: ../full/<videoId>.<ext> — сжатый звук, скачанный ЛОКАЛЬНО (yt-dlp -f bestaudio; с датацентровых IP YouTube не отдаёт).
# Выход: align/wh_<videoId>.json, align/em_mms_<videoId>.pt, align/em_de_<videoId>.pt, audio/<videoId>_voc.wav.
# Веса моделей кэшируются в томе Modal `schubert-models`; GPU по умолчанию A10G (env GPU=L4|T4|A10G).
import io, json, os, pathlib, subprocess, sys, time
import modal

GPU = os.environ.get("GPU", "A10G")
app = modal.App("schubert-align")
image = (
    modal.Image.from_registry("nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04", add_python="3.12")
    .apt_install("ffmpeg")
    .pip_install("torch==2.14.*", "torchaudio==2.11.*", "transformers==5.16.1", "faster-whisper==1.2.1",
                 "demucs==4.1.0", "soundfile", "numpy")
    .env({"HF_HOME": "/models/hf", "TORCH_HOME": "/models/torch", "OMP_NUM_THREADS": "4"})
)
models = modal.Volume.from_name("schubert-models", create_if_missing=True)
SR = 16000


def _emissions_mms(voc_path):
    import torch, torchaudio, soundfile as sf
    b = torchaudio.pipelines.MMS_FA
    m = b.get_model(with_star=False).eval().cuda()
    x, sr = sf.read(voc_path, dtype="float32"); assert sr == SR and x.ndim == 1
    wav = torch.from_numpy(x); N = wav.shape[0]; cs = 20 * SR; ct = 2 * SR; out = []
    with torch.inference_mode():
        for st in range(0, N, cs):
            a = max(0, st - ct); bnd = min(N, st + cs + ct)
            e, _ = m(wav[a:bnd].unsqueeze(0).cuda()); e = e[0].cpu()
            f0 = (st - a) // 320; f1 = f0 + (min(st + cs, N) - st) // 320
            out.append(e[f0:min(f1, e.shape[0])])
    return {"emission": torch.cat(out, 0), "labels": b.get_labels()}


def _emissions_hf(voc_path, mid):
    import torch, soundfile as sf
    from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
    proc = Wav2Vec2Processor.from_pretrained(mid); model = Wav2Vec2ForCTC.from_pretrained(mid).eval().cuda()
    x, sr = sf.read(voc_path, dtype="float32"); assert sr == SR
    wav = torch.from_numpy(x); N = wav.shape[0]; cs = 20 * SR; ct = 2 * SR; out = []
    with torch.inference_mode():
        for st in range(0, N, cs):
            a = max(0, st - ct); bnd = min(N, st + cs + ct)
            iv = proc(wav[a:bnd].numpy(), sampling_rate=SR, return_tensors="pt").input_values.cuda()
            lg = model(iv).logits[0].cpu()
            f0 = (st - a) // 320; f1 = f0 + (min(st + cs, N) - st) // 320
            out.append(lg[f0:min(f1, lg.shape[0])])
    v = proc.tokenizer.get_vocab(); labels = [None] * len(v)
    for k, i in v.items(): labels[i] = k
    return {"emission": torch.cat(out, 0), "labels": labels, "blank": proc.tokenizer.pad_token_id, "word_delim": v.get("|")}


def _whisper(voc_path, lang):
    from faster_whisper import WhisperModel
    model = WhisperModel("large-v3", device="cuda", compute_type="float16", download_root="/models/whisper")
    segs, _ = model.transcribe(voc_path, language=lang, word_timestamps=True, beam_size=5, vad_filter=False,
                               condition_on_previous_text=False)
    res = []
    for s in segs:
        res.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
                    "words": [{"w": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2), "p": round(w.probability, 2)}
                              for w in (s.words or [])]})
    return res


@app.function(gpu=GPU, image=image, volumes={"/models": models}, timeout=1800, retries=1)
def process(audio: bytes, vid: str, ext: str, lang: str, ctc_model: str) -> dict:
    import torch
    t0 = time.time(); tmp = pathlib.Path("/tmp/work"); tmp.mkdir(exist_ok=True)
    src = tmp / f"{vid}.{ext}"; src.write_bytes(audio)
    wav = tmp / f"{vid}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-ar", "44100", "-ac", "2", str(wav)], check=True)
    # 1. Demucs — вокал
    subprocess.run([sys.executable, "-m", "demucs", "--two-stems=vocals", "-n", "htdemucs", "-d", "cuda", "-o", str(tmp / "sep"), str(wav)],
                   check=True, capture_output=True)
    voc = tmp / f"{vid}_voc.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp / "sep" / "htdemucs" / vid / "vocals.wav"), "-ar", str(SR), "-ac", "1", str(voc)], check=True)
    t1 = time.time()
    # 2. эмиссии двух движков
    b1 = io.BytesIO(); torch.save(_emissions_mms(str(voc)), b1)
    b2 = io.BytesIO(); torch.save(_emissions_hf(str(voc), ctc_model), b2)
    t2 = time.time()
    # 3. Whisper
    wh = _whisper(str(voc), lang)
    t3 = time.time()
    models.commit()   # кэш весов — в том, чтобы следующие контейнеры не качали снова
    return {"voc": voc.read_bytes(), "em_mms": b1.getvalue(), "em_de": b2.getvalue(), "wh": json.dumps(wh, ensure_ascii=False),
            "timing": {"demucs": round(t1 - t0, 1), "emissions": round(t2 - t1, 1), "whisper": round(t3 - t2, 1),
                       "words": sum(len(s["words"]) for s in wh)}}


@app.local_entrypoint()
def main(list_file: str, lang: str = "de", ctc_model: str = "jonatasgrosman/wav2vec2-large-xlsr-53-german",
         indir: str = "../full", outdir: str = "../align", audiodir: str = "../audio"):
    vids = [v for v in pathlib.Path(list_file).read_text().split() if v]
    outdir_p, audiodir_p, indir_p = pathlib.Path(outdir), pathlib.Path(audiodir), pathlib.Path(indir)
    todo = []
    for v in vids:
        if all((outdir_p / f"{n}_{v}.{e}").exists() for n, e in (("wh", "json"), ("em_mms", "pt"), ("em_de", "pt"))) and (audiodir_p / f"{v}_voc.wav").exists():
            continue
        src = sorted(p for p in indir_p.glob(f"{v}.*") if p.suffix != ".part")
        if not src: print(f"{v}: нет скачанного звука в {indir}", file=sys.stderr); continue
        todo.append((v, src[0]))
    print(f"на GPU: {len(todo)} записей из {len(vids)} (GPU {GPU}, язык {lang})", flush=True)
    args = [(p.read_bytes(), v, p.suffix.lstrip("."), lang, ctc_model) for v, p in todo]
    t0 = time.time()
    for (v, _), res in zip(todo, process.starmap(args, order_outputs=True, return_exceptions=True)):
        if isinstance(res, Exception): print(f"{v}: ОШИБКА {res!r}", flush=True); continue
        (audiodir_p / f"{v}_voc.wav").write_bytes(res["voc"])
        (outdir_p / f"em_mms_{v}.pt").write_bytes(res["em_mms"]); (outdir_p / f"em_de_{v}.pt").write_bytes(res["em_de"])
        (outdir_p / f"wh_{v}.json").write_text(res["wh"], encoding="utf-8")
        t = res["timing"]; print(f"{v}: demucs {t['demucs']} с, эмиссии {t['emissions']} с, whisper {t['whisper']} с ({t['words']} слов)", flush=True)
    print(f"готово за {time.time() - t0:.0f} с", flush=True)
