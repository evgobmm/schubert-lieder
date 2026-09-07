# Пословные тайминги под запись — конвейер

Правила и замеры: `docs/rules/audio-alignment.md`. Здесь — рабочие скрипты (перенесены из scratchpad 2026-09-07;
пути внутри относительные: запускать из рабочего каталога, где лежат `words.json`, `lineidx.json`,
эмиссии `em_*.pt`, карты `map_*.json`, а звук — в `../audio/`).

Окружение: Python 3.12 (`uv venv`), `torch torchaudio` (CPU или CUDA), `transformers demucs soundfile phonemizer`,
статический `ffmpeg`, свежий `yt-dlp`.

Порядок на одну запись `<videoId>` песни D 118:
1. `yt-dlp -f bestaudio -x --audio-format wav` → `full/<videoId>.wav`; микс для DTW: `ffmpeg -ar 16000 -ac 1` → `audio/<videoId>.wav`.
2. `python -m demucs --two-stems=vocals -n htdemucs -o sep -- full/<videoId>.wav`; стем → `ffmpeg -ar 16000 -ac 1` → `audio/<videoId>_voc.wav`
   (`emit_all.sh` ждёт стемы и считает эмиссии по две параллельно).
3. `emit.py <voc.wav> em_mms_<videoId>.pt` (MMS_FA) и `emit_hf.py jonatasgrosman/wav2vec2-large-xlsr-53-german <voc.wav> em_de_<videoId>.pt`.
4. `transfer.py audio/1F4CHXbX8gc.wav audio/<videoId>.wav map_<videoId>.json` — перенос принятой разметки Сэмпсон
   DTW по хроме микса (12 транспозиций, наклон 1:2…2:1).
5. `pipeline2.py <videoId> audio/<videoId>_voc.wav em_mms_<videoId>.pt em_de_<videoId>.pt map_<videoId>.json`
   → `ts_<videoId>.json` и `app/src/data/timings/d118-<videoId>.json`; печатает очередь прослушивания.
6. `finalize.py <videoId> …` — минимальная длительность слова 0.12 с, обновление файла сайта, очередь.

`words.json` / `lineidx.json` — плоский список слов маршрута и адреса `строфа:строка`, строятся из
`app/src/data/songs/d118-gretchen-am-spinnrade.json` в порядке опубликованного текста.
Регрессионный тест: `pipeline2.py 1F4CHXbX8gc … map_identity.json --no-site` должен воспроизвести принятую
разметку Сэмпсон (все начала в пределах 0.15 с).

Очереди прослушивания четырёх записей (2026-09-07, на слух не проверены): Бонни 4, Шварцкопф 13, Людвиг 9,
Шуман 16 слов — списки в описании коммита и в чате сессии «[аудио текст]».

## Вторая песня — Rückblick D 911/8 (2026-09-07)

Маршрут исполнения (повторы Шуберта) выведен из звука: `route-d911-8.json` (31 проход), доказательства —
`planning/research/d911-8-rueckblick-route.md`. Порядок: `make_words.js <song.json> route.json` → сырые
выравнивания `fa.py`/`fa2.py` → главная запись `pipeline.py` (без шаблона) → `finalize2.py` → `build_site2.py`
→ карты `transfer.py` (шаблон — главная запись; якоря на начало/конец пения) → `pipeline2.py … <template.json>`
→ `finalize2.py` → `build_site2.py`; всё вместе — `run_r8.sh`, только вторичные — `run_r8_others.sh`.
**Итог 2026-09-07 (вечер): все пять записей D 911/8 размечены без шаблона** — перенос по хроме на финальной строфе, спетой дважды на ту же музыку, сдвигал разметку на строку (см. правило). Определение маршрута: `tail_decode.py` (декод по фразам — что сработало), `route_from_audio.py` и
`route_hypotheses.py` (не сработали — см. справку). Очереди прослушивания: `queues-d911-8.md`.

## Третья песня — Erstarrung D 911/4 (2026-09-08): полностью автоматический маршрут

`run_song.sh <videoId…>` (в каталоге песни со `spec.json`): для каждой записи — `route_detect.py` (маршрут по декодам фраз,
повторы от начала строки, повтор внутри фразы) → `make_words.js` → `fa.py`/`fa2.py` → `pipeline.py` → `finalize2.py` →
`variants.py` → `build_site2.py` (поле `variants`). Консенсус маршрута между записями — `assign_cost.py` (стоимость
привязки кандидата на каждой записи); `ROUTE=<файл> run_song.sh …` задаёт общий маршрут. Маршрут D 911/4 —
`route-d911-4.json`, спецификация — `spec-d911-4.json`, очереди — `queues-d911-4.md`.
Регрессия детектора на Rückblick: 3 записи из 5 воспроизводят ручной маршрут полностью, 2 теряют последний тихий повтор.
