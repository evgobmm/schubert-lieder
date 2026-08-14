# Schubert Lieder — все песни Шуберта с пословным русским переводом

**Статус: пилотная фаза.** Пилот — «Gretchen am Spinnrade» (D 118): подстрочник, пояснения, «О песне», топ-5 исполнений; без синхронизации слов с записью.

## ⚠️ Обязательный процесс

- **Каждое указание пользователя из чата немедленно фиксируется в `docs/rules/`** (реестр — `docs/rules/index.md`). Противоречие с записанным → переписать правило и **явно сообщить пользователю, что переписано** (было → стало); неясно — спросить. Подробности: `docs/rules/workflow.md`.
- Перевод — по правилам референса: `planning/winterreise-reference/CLAUDE.md` (действующий свод, пока не выделен собственный).
- Отбор исполнений: `docs/rules/youtube-performances.md`. Проверка фактов: `docs/rules/verification-protocol.md`.
- Агенты/скрипты не пишут временные файлы в репозиторий — только в scratchpad.

## Структура репозитория

- `docs/rules/` — правила (живые, источник истины по процессу и требованиям);
- `planning/` — исследования (`research/`) и копия референса (`winterreise-reference/`, CC0);
- `app/` — всё приложение (Vue 3 + Vite, адаптация референса без «снега»);
- корень — только CLAUDE.md, README.md и служебные каталоги.

## Приложение (`app/`)

Сборка: `cd app && npm run build`. Деплой: GitHub Actions → Pages (`.github/workflows/deploy.yml`), base `/schubert-lieder/`.

Модель данных песни (`app/src/data/songs/<slug>.json`) — как в референсе, плюс поля:
- `"d"` — номер по Дойчу (строка, канонический ID; slug файла `d118-gretchen-am-spinnrade.json`);
- `"poet_de"` / `"poet_ru"`, `"year"` — метаданные (строка под заголовком);
- `"about"` — массив секций `{title, text}` раздела «О песне» (текст: `*курсив*`, абзацы через `\n`).

`app/src/data/index.json`: `{number, d, title_de, title_ru, poet_ru, file, ready}` (number — порядковый номер в списке сайта).

`app/src/data/performances.json`: `{"<d>": [{videoId, name, year}, ...]}` — до 5 записей в порядке ранжирования, первая — главная.

## Окружение

Devcontainer без Node по умолчанию — Node 20 в `~/.local/node` (симлинки в `~/.local/bin`). GitHub: fine-grained token только на этот репозиторий (gh auth). Папка root-owned → git требует `safe.directory`. Параллельных агентов не ограничивать (качество важнее экономии); за нагрузкой контейнера периодически следить.
