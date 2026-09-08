# Тяжёлые стадии конвейера на арендованном GPU (Modal, https://modal.com): Demucs (вокал) -> стем 16 кГц моно ->
# эмиссии MMS_FA и wav2vec2-xlsr (язык песни) -> Whisper large-v3 (слова с таймкодами). Выход по формату совпадает
# с локальными emit.py / emit_hf.py / whisper_tr.py, так что дальше работает обычный finish_control.sh на CPU.
#
# Устройство (по документации Modal): класс с @modal.enter — все четыре модели загружаются ОДИН раз на контейнер и
# обслуживают много записей подряд (.starmap раздаёт записи по контейнерам; их не больше MAX_CONTAINERS, на бесплатном
# плане до 10 GPU одновременно). Веса — в томе `schubert-models` (первый запуск качает, дальше берёт из тома).
# Окно простоя контейнера scaledown_window минимальное — простой тарифицируется. Регион не задаётся.
#
# Запуск (нужен токен Modal: `modal token new`):
#   GPU=T4 modal run gpu_stage.py --list-file vids_de.txt --lang de --ctc-model jonatasgrosman/wav2vec2-large-xlsr-53-german \
#       --indir ../full --outdir ../align --audiodir ../audio
# Вход: <indir>/<videoId>.<ext> — сжатый звук, скачанный ЛОКАЛЬНО (yt-dlp -f bestaudio; с датацентровых IP YouTube не отдаёт).
# Выход: <outdir>/wh_<videoId>.json, em_mms_<videoId>.pt, em_de_<videoId>.pt; <audiodir>/<videoId>_voc.wav.
# Бенчмарк: MAX_CONTAINERS=1 — все записи последовательно в одном контейнере (первая — холодный вызов, дальше — тёплые);
# печатаются времена стадий, время загрузки моделей, id контейнера, размеры входа/выхода.
import io, json, os, pathlib, subprocess, sys, time
import modal

GPU = os.environ.get("GPU", "L4")
WH_TEMP0 = os.environ.get("WH_TEMP0", "0")
MAX_CONTAINERS = int(os.environ.get("MAX_CONTAINERS", "10"))
app = modal.App("schubert-align")
image = (
    modal.Image.from_registry("nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04", add_python="3.12")
    .apt_install("ffmpeg")
    .pip_install("torch==2.14.*", "torchaudio==2.11.*", "transformers==5.16.1", "faster-whisper==1.2.1",
                 "demucs==4.1.0", "soundfile", "numpy")
    .env({"HF_HOME": "/models/hf", "TORCH_HOME": "/models/torch", "OMP_NUM_THREADS": "4", "WH_TEMP0": WH_TEMP0})
)
models = modal.Volume.from_name("schubert-models", create_if_missing=True)
SR = 16000


def _sh(*cmd):
    subprocess.run(list(cmd), check=True, capture_output=True)


@app.cls(gpu=GPU, image=image, volumes={"/models": models}, timeout=1800, scaledown_window=30, max_containers=MAX_CONTAINERS, retries=1)
class Stage:
    ctc_model: str = modal.parameter()

    @modal.enter()
    def load(self):
        import torch, torchaudio
        from demucs.pretrained import get_model
        from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
        from faster_whisper import WhisperModel
        t0 = time.time(); self.container = os.environ.get("MODAL_TASK_ID", "?"); self.started = t0
        self.demucs = get_model("htdemucs").cuda().eval()
        self.mms_bundle = torchaudio.pipelines.MMS_FA; self.mms = self.mms_bundle.get_model(with_star=False).eval().cuda()
        self.proc = Wav2Vec2Processor.from_pretrained(self.ctc_model); self.w2v = Wav2Vec2ForCTC.from_pretrained(self.ctc_model).eval().cuda()
        self.whisper = WhisperModel("large-v3", device="cuda", compute_type="float16", download_root="/models/whisper")
        models.commit()   # веса, скачанные при первом запуске, — в том
        self.enter_seconds = round(time.time() - t0, 1); self.calls = 0

    def _emissions_mms(self, wav):
        import torch
        N = wav.shape[0]; cs = 20 * SR; ct = 2 * SR; out = []
        with torch.inference_mode():
            for st in range(0, N, cs):
                a = max(0, st - ct); b = min(N, st + cs + ct)
                e, _ = self.mms(wav[a:b].unsqueeze(0).cuda()); e = e[0].cpu()
                f0 = (st - a) // 320; f1 = f0 + (min(st + cs, N) - st) // 320
                out.append(e[f0:min(f1, e.shape[0])])
        return {"emission": torch.cat(out, 0), "labels": self.mms_bundle.get_labels()}

    def _emissions_hf(self, wav):
        import torch
        N = wav.shape[0]; cs = 20 * SR; ct = 2 * SR; out = []
        with torch.inference_mode():
            for st in range(0, N, cs):
                a = max(0, st - ct); b = min(N, st + cs + ct)
                iv = self.proc(wav[a:b].numpy(), sampling_rate=SR, return_tensors="pt").input_values.cuda()
                lg = self.w2v(iv).logits[0].cpu()
                f0 = (st - a) // 320; f1 = f0 + (min(st + cs, N) - st) // 320
                out.append(lg[f0:min(f1, lg.shape[0])])
        v = self.proc.tokenizer.get_vocab(); labels = [None] * len(v)
        for k, i in v.items(): labels[i] = k
        return {"emission": torch.cat(out, 0), "labels": labels, "blank": self.proc.tokenizer.pad_token_id, "word_delim": v.get("|")}

    def _separate(self, wav_path, voc_path):
        """вокал как у CLI `demucs --two-stems=vocals -n htdemucs` (shifts=1, overlap=0.25, split): стерео 44.1 кГц -> 16 кГц моно через ffmpeg"""
        import torch, soundfile as sf
        from demucs.apply import apply_model
        x, sr = sf.read(wav_path, dtype="float32", always_2d=True); wav = torch.from_numpy(x.T)   # (2, T)
        ref = wav.mean(0); wav = (wav - ref.mean()) / (ref.std() + 1e-8)
        with torch.inference_mode():
            src = apply_model(self.demucs, wav[None].cuda(), shifts=1, split=True, overlap=0.25, progress=False)[0].cpu()
        voc = src[self.demucs.sources.index("vocals")] * (ref.std() + 1e-8) + ref.mean()
        tmp = str(voc_path) + ".44k.wav"; sf.write(tmp, voc.T.numpy(), sr)
        _sh("ffmpeg", "-v", "error", "-y", "-i", tmp, "-ar", str(SR), "-ac", "1", str(voc_path))

    @modal.method()
    def process(self, audio: bytes, vid: str, ext: str, lang: str) -> dict:
        import torch, soundfile as sf
        self.calls += 1; t0 = time.time(); tmp = pathlib.Path("/tmp/work"); tmp.mkdir(exist_ok=True)
        src = tmp / f"{vid}.{ext}"; src.write_bytes(audio); wav = tmp / f"{vid}.wav"; voc = tmp / f"{vid}_voc.wav"
        _sh("ffmpeg", "-v", "error", "-y", "-i", str(src), "-ar", "44100", "-ac", "2", str(wav))
        self._separate(wav, voc); t1 = time.time()
        x, sr = sf.read(str(voc), dtype="float32"); assert sr == SR and x.ndim == 1; w16 = torch.from_numpy(x)
        b1 = io.BytesIO(); torch.save(self._emissions_mms(w16), b1)
        b2 = io.BytesIO(); torch.save(self._emissions_hf(w16), b2); t2 = time.time()
        kw = {"temperature": 0.0} if os.environ.get("WH_TEMP0") == "1" else {}   # WH_TEMP0=1: без отката на сэмплирование — детерминированный лучевой поиск
        segs, _ = self.whisper.transcribe(str(voc), language=lang, word_timestamps=True, beam_size=5, vad_filter=False,
                                          condition_on_previous_text=False, **kw)
        wh = [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
               "words": [{"w": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2), "p": round(w.probability, 2)} for w in (s.words or [])]}
              for s in segs]
        t3 = time.time()
        return {"voc": voc.read_bytes(), "em_mms": b1.getvalue(), "em_de": b2.getvalue(), "wh": json.dumps(wh, ensure_ascii=False),
                "timing": {"demucs": round(t1 - t0, 1), "emissions": round(t2 - t1, 1), "whisper": round(t3 - t2, 1), "total": round(t3 - t0, 1),
                           "enter": self.enter_seconds, "container": self.container, "call": self.calls, "audio_s": round(len(x) / SR, 1),
                           "words": sum(len(s["words"]) for s in wh)}}


@app.local_entrypoint()
def main(list_file: str, lang: str = "de", ctc_model: str = "jonatasgrosman/wav2vec2-large-xlsr-53-german",
         indir: str = "../full", outdir: str = "../align", audiodir: str = "../audio"):
    vids = [v for v in pathlib.Path(list_file).read_text().split() if v]
    outdir_p, audiodir_p, indir_p = pathlib.Path(outdir), pathlib.Path(audiodir), pathlib.Path(indir)
    outdir_p.mkdir(parents=True, exist_ok=True); audiodir_p.mkdir(parents=True, exist_ok=True)
    todo = []
    for v in vids:
        if all((outdir_p / f"{n}_{v}.{e}").exists() for n, e in (("wh", "json"), ("em_mms", "pt"), ("em_de", "pt"))) and (audiodir_p / f"{v}_voc.wav").exists():
            continue
        src = sorted(p for p in indir_p.glob(f"{v}.*") if p.suffix not in (".part", ".wav"))
        if not src: print(f"{v}: нет скачанного сжатого звука в {indir}", file=sys.stderr); continue
        todo.append((v, src[0]))
    print(f"на GPU {GPU}: {len(todo)} записей из {len(vids)}, язык {lang}, контейнеров не больше {MAX_CONTAINERS}", flush=True)
    args = [(p.read_bytes(), v, p.suffix.lstrip("."), lang) for v, p in todo]
    up = sum(len(a[0]) for a in args); t0 = time.time(); stage = Stage(ctc_model=ctc_model); down = 0
    for (v, _), res in zip(todo, stage.process.starmap(args, order_outputs=True, return_exceptions=True)):
        if isinstance(res, Exception): print(f"{v}: ОШИБКА {res!r}", flush=True); continue
        (audiodir_p / f"{v}_voc.wav").write_bytes(res["voc"])
        (outdir_p / f"em_mms_{v}.pt").write_bytes(res["em_mms"]); (outdir_p / f"em_de_{v}.pt").write_bytes(res["em_de"])
        (outdir_p / f"wh_{v}.json").write_text(res["wh"], encoding="utf-8")
        down += len(res["voc"]) + len(res["em_mms"]) + len(res["em_de"]) + len(res["wh"]); t = res["timing"]
        print(f"{v}: {t['audio_s']} с звука | demucs {t['demucs']} с, эмиссии {t['emissions']} с, whisper {t['whisper']} с ({t['words']} слов) = {t['total']} с"
              f" | контейнер {t['container']} вызов №{t['call']}, загрузка моделей {t['enter']} с", flush=True)
    print(f"готово за {time.time() - t0:.0f} с (с очередью, загрузкой и передачей данных); вверх {up / 1e6:.1f} МБ, вниз {down / 1e6:.1f} МБ", flush=True)
