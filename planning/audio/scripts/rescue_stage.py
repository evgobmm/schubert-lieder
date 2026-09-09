# Спасение удержанных записей в облаке: запасной путь (CTC-выравнивание) по СОБСТВЕННОМУ маршруту записи (из её своей сборки own/),
# а не по консенсусу песни, + ворота. Отдельное приложение Modal, чтобы не трогать cpu_stage.py (у него один local_entrypoint,
# finish_cloud.sh зовёт `modal run cpu_stage.py` без ::main).
# Запуск: modal run rescue_stage.py --list-file rescue.txt --songs songs   (строки: <prefix> <vid> <lang>); выход — songs/<prefix>/rescue/
import json, os, pathlib, subprocess, sys, time
import modal

R = "/workspaces/schubert-lieder"; SPC = "/root/sp"
app = modal.App("schubert-rescue")
image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("nodejs", "ffmpeg")
    .pip_install("torch==2.14.*", "torchaudio==2.11.*", index_url="https://download.pytorch.org/whl/cpu")
    .pip_install("rapidfuzz", "soundfile", "numpy")
    .add_local_dir(f"{R}/app/src/data", remote_path=f"{R}/app/src/data", copy=True)
    .add_local_file(f"{R}/planning/audio/lang-overrides.json", remote_path=f"{R}/planning/audio/lang-overrides.json", copy=True)
    .add_local_file(f"{R}/planning/audio/variants-confirmed.json", remote_path=f"{R}/planning/audio/variants-confirmed.json", copy=True)
    .add_local_dir(f"{R}/planning/audio/scripts", remote_path=f"{SPC}/tools")
)
data = modal.Volume.from_name("schubert-data", create_if_missing=True)


def _link(dst, src):
    dst = pathlib.Path(dst)
    if not dst.exists() and not dst.is_symlink(): dst.symlink_to(src)


@app.function(image=image, volumes={"/data": data}, cpu=2.0, memory=4096, timeout=1800, max_containers=40, retries=1)
def rescue_rec(spec: dict, vid: str, route: list) -> dict:
    try: data.reload()                                                                          # том мог быть «занят» открытым файлом предыдущего вызова в этом контейнере
    except Exception as e: print(f"volume reload: {e!r}", file=sys.stderr)                     # (RuntimeError: there are open files…) — данные уже смонтированы, идём дальше
    t0 = time.time(); prefix = spec["prefix"]
    sp = pathlib.Path(SPC); run = sp / "songs" / f"{prefix}_rescue_{vid}"; run.mkdir(parents=True, exist_ok=True)
    (sp / "align" / ".venv" / "bin").mkdir(parents=True, exist_ok=True); (sp / "audio").mkdir(exist_ok=True)
    _link(sp / "align" / ".venv" / "bin" / "python", sys.executable)
    need = [f"/data/align/wh_{vid}.json", f"/data/align/em_mms_{vid}.pt", f"/data/align/em_de_{vid}.pt", f"/data/audio/{vid}_voc.wav"]
    if not all(pathlib.Path(f).exists() for f in need): return {"prefix": prefix, "vid": vid, "error": "нет данных GPU-стадии"}
    for f in need[:3]: _link(sp / "align" / pathlib.Path(f).name, f)
    _link(sp / "audio" / f"{vid}_voc.wav", need[3])
    json.dump(spec, open(run / "spec.json", "w"), ensure_ascii=False); json.dump(route, open(run / "route_own.json", "w"))
    out = pathlib.Path(SPC) / "out_rescue"; out.mkdir(exist_ok=True)
    env = {**os.environ, "OMP_NUM_THREADS": "2", "OUT_DIR": str(out), "APP": str(out), "LANG": "C.UTF-8", "LC_ALL": "C.UTF-8", "PYTHONIOENCODING": "utf-8"}
    r = subprocess.run(["bash", f"{SPC}/tools/fallback.sh", str(run), "--route", str(run / "route_own.json"), vid], cwd=run, env=env,
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    site = out / f"{prefix}-{vid}.json"; res = {"prefix": prefix, "vid": vid, "seconds": round(time.time() - t0), "log": r.stdout[-2000:] + ("\n" + r.stderr[-1500:] if r.returncode else "")}
    if not site.exists(): res["error"] = "запасной путь не дал файла"; return res
    h = subprocess.run([sys.executable, f"{SPC}/tools/holes.py", str(site), f"/data/audio/{vid}_voc.wav", f"/data/align/em_mms_{vid}.pt", f"/data/align/em_de_{vid}.pt", spec["song"]],
                       capture_output=True, text=True, encoding="utf-8", errors="replace", env=env)
    res["holes"] = "\n".join(l for l in h.stdout.split("\n") if l.startswith("дыра")); res["site"] = site.read_text(encoding="utf-8")
    return res


@app.local_entrypoint()
def main(list_file: str, songs: str = "songs"):
    rows = [l.split() for l in pathlib.Path(list_file).read_text().split("\n") if l.strip()]; args = []
    for prefix, vid, *_ in rows:
        spec = json.load(open(f"{songs}/{prefix}/spec.json")); own = pathlib.Path(songs) / prefix / "own" / f"{prefix}-{vid}.json"
        if not own.exists(): print(f"{prefix} {vid}: нет своего маршрута", flush=True); continue
        t = json.load(open(own)); route = [{"s": p["s"], "l": p["l"], "k": [k for k, x in enumerate(p["w"]) if x]} for p in t["route"]]
        route = [p for p in route if p["k"]]
        if not route: print(f"{prefix} {vid}: пустой свой маршрут", flush=True); continue
        args.append((spec, vid, route))
    print(f"спасение в облаке: {len(args)} записей", flush=True); t0 = time.time(); ok = 0
    for res in rescue_rec.starmap(args, order_outputs=False, return_exceptions=True):
        if isinstance(res, Exception): print(f"ОШИБКА: {res!r}", flush=True); continue
        d = pathlib.Path(songs) / res["prefix"] / "rescue"; d.mkdir(parents=True, exist_ok=True); v = res["vid"]
        (d / f"log_{v}.txt").write_text(res["log"], encoding="utf-8")
        if res.get("error"): print(f"{res['prefix']} {v}: {res['error']}", flush=True); continue
        (d / f"{res['prefix']}-{v}.json").write_text(res["site"], encoding="utf-8"); (d / f"holes_{v}.txt").write_text(res["holes"] + ("\n" if res["holes"] else ""), encoding="utf-8")
        n = len([l for l in res["holes"].split("\n") if l.strip()]); ok += 1
        print(f"{res['prefix']} {v}: дыр {n}, {res['seconds']} с", flush=True)
    print(f"готово: {ok} из {len(args)} за {time.time() - t0:.0f} с", flush=True)
