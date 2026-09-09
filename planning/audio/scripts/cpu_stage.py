# Сборка песен в облаке (Modal, CPU-контейнеры, много песен параллельно). Тот же код, что и локально: в контейнер монтируются
# инструменты (planning/audio/scripts -> /root/sp/tools) и данные сайта (app/src/data), выходы GPU-стадии читаются из тома
# `schubert-data` (/data/align, /data/audio — их пишет gpu_stage.py). Два прохода как в batch_finish.sh: свои маршруты с сбором
# окон без распознанных слов -> дораспознавание окон развёрнутым GPU-классом Retr (modal deploy gpu_stage.py) -> finish_control.sh.
# Возвращает файлы сайта, лог, очереди — локально они раскладываются как после локальной сборки (songs/<prefix>/, app/…/timings/).
#
# Запуск: modal run cpu_stage.py --batch songs/batch.txt --songs songs   (строки batch.txt: <prefix> <lang> <vid…>; spec.json в songs/<prefix>/)
# Цена: ~60–90 ядро-секунд на запись при $0.047/ядро-час — партия из 20 песен ≈ $0.10–0.15.
import io, json, os, pathlib, subprocess, sys, time
import modal

R = "/workspaces/schubert-lieder"; SPC = "/root/sp"
app = modal.App("schubert-finish")
image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("nodejs", "ffmpeg")
    .pip_install("torch==2.14.*", "torchaudio==2.11.*", index_url="https://download.pytorch.org/whl/cpu")
    .pip_install("rapidfuzz", "soundfile", "numpy")
    .add_local_dir(f"{R}/app/src/data", remote_path=f"{R}/app/src/data", copy=True)          # тексты песен, исполнения (копия — каталог должен быть записываемым)
    .add_local_file(f"{R}/planning/audio/lang-overrides.json", remote_path=f"{R}/planning/audio/lang-overrides.json", copy=True)
    .add_local_file(f"{R}/planning/audio/variants-confirmed.json", remote_path=f"{R}/planning/audio/variants-confirmed.json", copy=True)
    .add_local_dir(f"{R}/planning/audio/scripts", remote_path=f"{SPC}/tools")                 # инструменты (монтируются при запуске — правки не требуют пересборки образа)
)
data = modal.Volume.from_name("schubert-data", create_if_missing=True)


def _link(dst, src):
    dst = pathlib.Path(dst)
    if not dst.exists() and not dst.is_symlink(): dst.symlink_to(src)


@app.function(image=image, volumes={"/data": data}, cpu=2.0, memory=4096, timeout=3600, max_containers=40, retries=1)
def finish_song(spec: dict, vids: list, lang: str) -> dict:
    try: data.reload()                                                                          # том мог быть «занят» открытым файлом предыдущего вызова в этом контейнере
    except Exception as e: print(f"volume reload: {e!r}", file=sys.stderr)                     # (RuntimeError: there are open files…) — данные уже смонтированы, идём дальше
    t0 = time.time()
    prefix = spec["prefix"]; sp = pathlib.Path(SPC); songdir = sp / "songs" / prefix; songdir.mkdir(parents=True, exist_ok=True)
    (sp / "align" / ".venv" / "bin").mkdir(parents=True, exist_ok=True); (sp / "audio").mkdir(exist_ok=True)
    _link(sp / "align" / ".venv" / "bin" / "python", sys.executable)                          # скрипты зовут $SP/align/.venv/bin/python
    missing = []; have = []
    for v in vids:                                                                                 # записи без выходов GPU-стадии (не скачалась, обрыв) — пропускаются, песня собирается по остальным
        need = [f"/data/align/wh_{v}.json", f"/data/align/em_mms_{v}.pt", f"/data/align/em_de_{v}.pt", f"/data/audio/{v}_voc.wav"]
        if not all(pathlib.Path(f).exists() for f in need): missing.append(v); continue
        for f in need[:3]: _link(sp / "align" / pathlib.Path(f).name, f)
        _link(sp / "audio" / f"{v}_voc.wav", need[3]); have.append(v)
    if not have: return {"prefix": prefix, "error": f"нет данных GPU-стадии в томе ни для одной записи: {missing}"}
    vids = have
    json.dump(spec, open(songdir / "spec.json", "w"), ensure_ascii=False); (songdir / "vids.txt").write_text(" ".join(vids) + "\n")
    out_app = pathlib.Path(f"{R}/app/src/data/timings"); out_app.mkdir(parents=True, exist_ok=True)
    for f in out_app.glob(f"{prefix}-*.json"): f.unlink()                                       # чистый старт: без прежних файлов этой песни в образе
    env = {**os.environ, "OMP_NUM_THREADS": "2", "APP": str(out_app), "LANG": "C.UTF-8", "LC_ALL": "C.UTF-8", "PYTHONIOENCODING": "utf-8"}   # скрипты печатают по-русски
    if spec.get("debug"): env["DEBUG_PASSES"] = "1"; env["DEBUG_RETR"] = "1"                   # разбор одной песни: диагностика проходов и окон в finish.log
    # проход 1: свои маршруты + окна без распознанных слов
    r1 = subprocess.run(["bash", f"{SPC}/tools/test_run.sh", str(songdir / "spec.json"), str(songdir / "own"), *vids],
                        cwd=songdir, env={**env, "RETRANSCRIBE": "collect"}, capture_output=True, text=True, encoding="utf-8", errors="replace")
    wins = []
    for v in vids:
        wf = songdir / "own" / f"wh_{v}" / "retr_windows.json"
        if wf.exists(): wins += [(v, lo, hi) for lo, hi in json.load(open(wf))]
    retr_words = 0
    if wins:
        import soundfile as sf
        Retr = modal.Cls.from_name("schubert-align", "Retr"); args = []
        for v, lo, hi in wins:
            x, sr = sf.read(f"/data/audio/{v}_voc.wav", dtype="float32"); b = io.BytesIO(); sf.write(b, x[int(lo * sr):int(hi * sr)], sr, format="WAV"); args.append((b.getvalue(), lang))
        merged = {}
        for (v, lo, hi), ws in zip(wins, Retr().words.starmap(args, order_outputs=True, return_exceptions=True)):
            if isinstance(ws, Exception) or not ws: continue
            ws = [{**w, "start": round(lo + w["start"], 2), "end": round(lo + w["end"], 2), "retr": True} for w in ws]; retr_words += len(ws)
            merged.setdefault(v, []).append({"start": ws[0]["start"], "end": ws[-1]["end"], "text": " ".join(w["w"] for w in ws), "words": ws, "retr": True})
        for v, segs in merged.items():
            p = sp / "align" / f"wh_{v}.json"; wh = [s for s in json.load(open(p)) if not s.get("retr")] + segs; wh.sort(key=lambda s: s["start"])
            if p.is_symlink(): p.unlink()
            json.dump(wh, open(p, "w"), ensure_ascii=False)                                     # локальная копия транскрипта с дораспознанными словами
            (songdir / "own" / f"wh_{v}").mkdir(parents=True, exist_ok=True); json.dump(wh, open(songdir / "own" / f"wh_{v}" / "wh_merged.json", "w"), ensure_ascii=False)   # для разбора
    # проход 2: сборка (консенсус, починка/запасной, фильтр вариантов, ворота)
    r2 = subprocess.run(["bash", f"{SPC}/tools/finish_control.sh", str(songdir)], cwd=songdir, env={**env, "RETRANSCRIBE": "0"}, capture_output=True, text=True, encoding="utf-8", errors="replace")
    out = {"prefix": prefix, "seconds": round(time.time() - t0), "windows": len(wins), "retr_words": retr_words, "missing": missing,
           "log": ("".join(f"{v}: НЕТ ДАННЫХ GPU-стадии (не скачано или обрыв) — запись пропущена\n" for v in missing)) + r2.stdout + ("\n" + r2.stderr if r2.returncode else ""),
           "pass1": r1.stdout[-3000:], "site": {}, "song": {}}
    for f in out_app.glob(f"{prefix}-*.json"): out["site"][f.name] = f.read_text(encoding="utf-8")
    for pat in ("holes_*.txt", "decisions.txt", "route_consensus.json", "own/wh_*/ts_wh_*.json", "own/wh_*/retr_windows.json", "own/wh_*/wh_merged.json", "own/*.json", "held/*.json", "fb_*/ts.json"):
        for f in songdir.glob(pat): out["song"][str(f.relative_to(songdir))] = f.read_text(encoding="utf-8", errors="replace")
    return out


@app.local_entrypoint()
def main(batch: str, songs: str = "songs", app_dir: str = f"{R}/app/src/data/timings"):
    rows = [l.split() for l in pathlib.Path(batch).read_text().split("\n") if l.strip()]
    args = []
    for prefix, lang, *vids in rows:
        spec = json.load(open(f"{songs}/{prefix}/spec.json")); args.append((spec, vids, lang))
    print(f"сборка в облаке: {len(args)} песен", flush=True); t0 = time.time(); ok = 0
    for res in finish_song.starmap(args, order_outputs=False, return_exceptions=True):
        if isinstance(res, Exception): print(f"ОШИБКА: {res!r}", flush=True); continue
        p = res["prefix"]; d = pathlib.Path(songs) / p
        if res.get("error"): print(f"{p}: {res['error']}", flush=True); (d / "finish.log").write_text(res["error"]); continue
        for name, txt in res["song"].items(): f = d / name; f.parent.mkdir(parents=True, exist_ok=True); f.write_text(txt, encoding="utf-8")
        for name, txt in res["site"].items(): pathlib.Path(app_dir, name).write_text(txt, encoding="utf-8")
        (d / "finish.log").write_text(res["log"], encoding="utf-8"); (d / "pass1.log").write_text(res["pass1"], encoding="utf-8"); ok += 1
        print(f"{p}: {res['seconds']} с, окон {res['windows']}, дораспознано слов {res['retr_words']}, файлов на сайт {len(res['site'])}" + (f", без данных GPU: {' '.join(res['missing'])}" if res.get('missing') else ""), flush=True)
    print(f"готово: {ok} из {len(args)} песен за {time.time() - t0:.0f} с", flush=True)
