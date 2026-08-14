# Schubert Lieder — все песни Шуберта с пословным русским переводом

Референс проекта: https://github.com/evgobmm/Winterreise (CC0). Копия исходников и свода правил перевода — в `planning/winterreise-reference/` (его CLAUDE.md — действующий свод правил перевода и для этого проекта, пока не выделен собственный).

**Статус: пилотная фаза.** Пилотная песня — **«Gretchen am Spinnrade» (D 118)**. Синхронизацию слов с записью пока не делаем; на пилоте — подстрочник, пояснения, раздел «О песне», топ-5 исполнений.

## Обязательные правила

- Перевод — по правилам референса (`planning/winterreise-reference/CLAUDE.md`): пословная сегментация, аннотации `lang`/`meaning`, словари эпохи, ё, «ёлочки», типографика.
- Отбор исполнений: `docs/rules/youtube-performances.md`.
- Проверка фактов: `docs/rules/verification-protocol.md` — каждое утверждение с источником и цитатой; файлы фактов в `planning/research/<песня>-facts.md`.

## Приложение

Vue 3 + Vite (адаптация референса, без «снега»): `src/`. Сборка `npm run build`, деплой — GitHub Actions → Pages (`.github/workflows/deploy.yml`), base `/schubert-lieder/`.

Модель данных песни (`src/data/songs/<slug>.json`) — как в референсе, плюс поля:
- `"d"` — номер по Дойчу (строка, канонический ID; slug файла `d118-gretchen-am-spinnrade.json`);
- `"poet_de"` / `"poet_ru"`, `"year"` — метаданные (строка под заголовком);
- `"about"` — массив секций `{title, text}` раздела «О песне» (текст: `*курсив*`, абзацы через `\n`).

`src/data/index.json`: `{number, d, title_de, title_ru, poet_ru, file, ready}` (number — порядковый номер в списке сайта).

`src/data/performances.json`: `{"<d>": [{videoId, name, year}, ...]}` — до 5 записей в порядке ранжирования, первая — главная.

## Окружение

Devcontainer без Node по умолчанию — Node 20 ставится бинарником в `~/.local/node` (симлинки в `~/.local/bin`). GitHub: fine-grained token только на этот репозиторий (gh auth). Папка root-owned → git требует `safe.directory`.
