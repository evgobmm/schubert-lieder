# Бриф для новой сессии: v2-калибровка одноходового конвейера

Контекст: `planning/reports/translation-run-state.md` (последние записи), правила `docs/rules/*.md`, закон агентов `planning/catalog/one-shot-brief.md`.
Инструменты: `pilot-prep.js` (пакеты), `prefetch-sources.js` (источники), `build-bundle.js` (бандлы: dict | facts | page | fable | delta; крупные — частями), `assemble-song.js`, `check-song-file.js`, `lint-style.js`, `check-acknowledgements.js`, `merge-dict-batches.js`.
Задача: 3 песни Хёльти/Козегартена (не из уже переведённых), цепочка dict → facts → page (перевод+«О песне» одним агентом, ≤3 хода) → fable (≤3 хода, бандл ≤60 КБ, вернуть список снятого с обоснованием) → delta (один ход, без инструментов). Модели явно: sonnet / sonnet / opus / fable / opus. Публикация — только после чистой сверки; замер — дельта ccusage у пользователя (базис спросить до старта). Цель ≤ 2M биллинговых токенов на песню; при успехе — волна на 40–50 тем же конвейером.
Неприкосновенно: 24 песни Winterreise. Мониторов с событиями не ставить; главный цикл держать коротким.
