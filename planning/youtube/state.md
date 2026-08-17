# Состояние конвейера YouTube-записей

Обновлять после каждой волны. По этому файлу новая сессия продолжает с места обрыва. **КОРПУС ЗАВЕРШЁН: 618/619 песен опубликовано (2433 записи), 2026-08-17. D 535 — записей не существует (no-recordings.json). Хвосты — followups.md.**
Правила: `docs/rules/youtube-performances.md`. Скрипты: `planning/youtube/scripts/`
(`prepass.js` — предзагрузка MB+YT; `mb-discography.js`; `yt-check.js` — oEmbed).
yt-dlp установлен standalone (см. `docs/rules/workflow.md` → «Окружение: инструменты»).

## Конвейер на песню

1. prepass (скрипт, 0 токенов) → `data/<slug>.mb.json`, `data/<slug>.yt.json`
2. Исследование-досье (дешёвый агент) → `data/<slug>.dossier.json`
3. Ранжирование топ-5 (основная модель) → `planning/research/<slug>-top5.md` + JSON
4. Верификация выбранных (дешёвый агент + yt-check) → правки при необходимости
5. Публикация: `app/src/data/performances.json`, коммит, push — поволново

## Статус песен

| D | Песня | Ярус | prepass | досье | топ-5 | вериф. | публ. |
|---|---|---|---|---|---|---|---|
| 768 | Wandrers Nachtlied II | famous | ✓ | ✓ | ✓ | ✓ | ✓ |
| 799 | Im Abendrot | famous | ✓ | ✓ | ✓ | ✓ | ✓ |
| 800 | Der Einsame | famous | ✓ | ✓ | ✓ | ✓ | ✓ |
| 828 | Die junge Nonne | famous | ✓ | ✓ | ✓ | ✓ | ✓ |
| 839 | Ellens Gesang III (Ave Maria) | famous | ✓ | ✓ | ✓ | ✓ | ✓ |
| 842 | Totengräbers Heimwehe | famous | ✓ | ✓ | ✓ | ✓ | ✓ |
| 852 | Die Allmacht | famous | ✓ | ✓ | ✓ | ✓ | ✓ |
| 853 | Auf der Bruck | famous | ✓ | ✓ | ✓ | ✓ | ✓ |
| 806 | Abendstern | medium | ✓ | ✓ | ✓ | ✓ | ✓ |
| 807 | Auflösung | medium | ✓ | ✓ | ✓ | ✓ | ✓ |
| 808 | Gondelfahrer | medium | ✓ | ✓ | ✓ | ✓ | ✓ |
| 833 | Der blinde Knabe | medium | ✓ | ✓ | ✓ | ✓ | ✓ |
| 834 | Im Walde | medium | ✓ | ✓ | ✓ | ✓ | ✓ |
| 837 | Ellens Gesang I | medium | ✓ | ✓ | ✓ | ✓ | ✓ |
| 838 | Ellens Gesang II | medium | ✓ | ✓ | ✓ | ✓ | ✓ |
| 851 | Das Heimweh | medium | ✓ | ✓ | ✓ | ✓ | ✓ |
| 862 | Um Mitternacht | medium | ✓ | ✓ | ✓ | ✓ | ✓ |
| 805 | Der Sieg | rare | ✓ | ✓ | ✓ | ✓ | ✓ |
| 830 | Lied der Anne Lyle | rare | ✓ | ✓ | ✓ | ✓ | ✓ |
| 831 | Gesang der Norna | rare | ✓ | ✓ | ✓ | ✓ | ✓ |
| 832 | Des Sängers Habe | rare | ✓ | ✓ | ✓ | ✓ | ✓ |
| 843 | Lied des gefangenen Jägers | rare | ✓ | ✓ | ✓ | ✓ | ✓ |
| 846 | Normans Gesang | rare | ✓ | ✓ | ✓ | ✓ | ✓ |
| 854 | Fülle der Liebe | rare | ✓ | ✓ | ✓ | ✓ | ✓ |
| 855 | Wiedersehn | rare | ✓ | ✓ | ✓ | ✓ | ✓ |
| 856 | Abendlied für die Entfernte | rare | ✓ | ✓ | ✓ | ✓ | ✓ |
| 857/1 | Lied der Delphine | rare | ✓ | ✓ | ✓ | ✓ | ✓ |
| 857/2 | Lied des Florio | rare | ✓ | ✓ | ✓ | ✓ | ✓ |
| 860 | An mein Herz | rare | ✓ | ✓ | ✓ | ✓ | ✓ |
| 861 | Der liebliche Stern | rare | ✓ | ✓ | ✓ | ✓ | ✓ |

Ярусы предварительные (моя оценка); уточняются по числу записей в MB после prepass.

## Волны (план)

- Волна 1 (famous): 828, 839, 799, 800, 768
- Волна 2 (famous+medium): 842, 852, 853, 807, 806
- Волна 3 (medium, 10 песен): 834, 837, 838, 851, 862, 808, 833, 832, 846, 856
- Волна 4 (rare, 10 песен): 805, 830, 831, 843, 854, 855, 857/1, 857/2, 860, 861
- Волны 3 и 4 — параллельно (2 воркфлоу, потолок 14 агентов каждый)

## Точка восстановления (обновлять при каждом запуске волн)

При обрыве сессии (лимиты, перезагрузка): состояние = app/src/data/performances.json (опубликовано) + triage.json + make-waves.js status. Новая сессия: (1) git pull; (2) node planning/youtube/scripts/make-waves.js status; (3) если по журналам в ~/.claude/projects/.../subagents/workflows/<runId>/ видны завершённые, но неопубликованные волны — извлечь результаты из journal.jsonl (строки type:result) и опубликовать publish.js; (4) иначе — сгенерировать следующую волну make-waves.js и запустить batch-wave.js/wave.js заново: готовые досье лежат в planning/youtube/data/*.dossier.json и переиспользуются, платный повтор минимален.

Активные на 2026-08-17 ~14:10 UTC: famous-4 добивка runId wf_175387a2-30b (D 777, 881, 939 из кэша); волна G runId wf_d105eb66-1d5 (40 rare, D 399…474).

## Общие ресурсы

- `planning/research/singers-digest.md` — дайджест фонда певцов (строится агентом)
- `planning/youtube/albums.md` — реестр сквозных альбомов/изданий (пополняется поволново)
