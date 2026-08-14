# Состояние конвейера транскрипции AGA (обновлять после каждой партии)

Обновлено: 2026-08-14 ~18:05 UTC.

## Что где

- Карта «песня → страницы MDZ»: `sources/aga-map-final.json` (655 записей).
- Партии: `batches/batch-01..13.json` (487 песен по 40). Сгенерированы `scripts/gen-batches.js` **после** публикации пилота — уже опубликованных песен не содержат.
- Генератор воркфлоу партии: `scripts/gen-transcribe.js` (`node gen-transcribe.js batch-NN.json out.js` → Workflow).
- Публикатор: `scripts/publish-batch.js <файл-результата>` → дописывает ok-тексты в `sources/texts-published.json`, спорные — в `sources/aga-suspects.json`.
- После публикации: `node planning/catalog/scripts/build-app-data.js` (из корня) → `cd app && npm run build` → commit+push (деплой автоматом).

## Прогресс

| Партия | Статус | Результат |
|---|---|---|
| пилот (16) | ✅ опубликован | 16/16 ok → `sources/aga-pilot-result.json`, коммит 9701aad |
| batch-01 | ⏳ запущена (run wf_30506f4a-434) | — |
| batch-02 | ⏳ запущена (run wf_6cdea636-bd7) | — |
| batch-03…13 | не запущены | — |

Опубликовано текстов всего: **102** (см. `sources/texts-published.json`).

## Правила процесса (докручено по указанию пользователя)

- Результат партии коммитится и пушится **сразу**; не более 1–2 воркфлоу одновременно.
- Обрыв воркфлоу → `Workflow({scriptPath, resumeFromRunId})` — журналы в `~/.claude/projects/.../workflows/`.
- Спорные (suspect) — вторая волна после всех партий.
- Хвост после партий: ~11 полных песен без AGA (первые издания), фрагменты — по политике «точечно позже» (`docs/rules/project.md`).
