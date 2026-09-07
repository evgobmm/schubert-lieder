# Das Fischermädchen (D 957/10) — отбор топ-5 исполнений

Дата: 2026-09-07. Часть цикла Schwanengesang (Heine-блок, №№ 8–13). Правила: `docs/rules/youtube-performances.md`, цикльный метод («Масштабирование», п. 2). Опорный источник — `planning/research/cycle-schwanengesang-top5.md` (единое исследование полных записей цикла + пер-песенные проверки для Ständchen, Der Doppelgänger, Am Meer, Die Taubenpost); данные о сессиях там же продублированы дискографией Майкла Грея и Discogs. Задача этого файла — доисследовать и подтвердить именно пятёрку D 957/10, уже опубликованную в `performances.json`, отдельными источниками с цитатами, и проверить, не нужен ли этой песне (как Ständchen/Doppelgänger/Am Meer/Taubenpost) собственный пер-песенный пересмотр.

**Проверка на самостоятельную концертную жизнь**: MusicBrainz по работе «Schwanengesang, D. 957: X. Das Fischermädchen» — 65 записей (`planning/youtube/data/d957-10-das-fischermadchen.mb.json`); почти все — треки из цельных изданий цикла (Шуэн/Хайде, Тершель, Скохус, Прегарден/Штайер, Фишер-Дискау/Брендель и т. д.), в отличие от Der Doppelgänger или Am Meer здесь нет ветви самостоятельных сторон 78 об. у довоенных басов/баритонов (Kipnis, Schlusnus и т. п.) — песня не была «шлягером» вне цикла. Скрипт `match-candidates.js` (`planning/youtube/data/d957-10-das-fischermadchen.candidates.json`, 24 кандидата) также не нашёл внецикльных исторических сторон значимых исполнителей — только цельные циклы (включая уже отобранных Фишера-Дискау, Хоттера) и учебные/любительские загрузки. Вывод: **пер-песенный пересмотр не требуется**, действует цикловая пятёрка; задача файла — верификация, не переотбор.

## Итоговый топ-5 (без изменений к `performances.json`)

1. **Thomas Quasthoff / Justus Zeyen** — DG, зап. декабрь 2000, Bavaria Musikstudios, Мюнхен (альбом «Schwanengesang / Vier Ernste Gesänge», DG 471 030-2). Певцу 41 год — середина пика (~1993–2007). Приоритет № 1 правил. Источник: Discogs release 1097040 — *«Recorded December 2000 at Bavaria Musikstudios, München»* (https://www.discogs.com/release/1097040). Видео: `9DwO7LWdhzE` — «Thomas Quasthoff - Topic», подтверждённое название *«Schubert: Schwanengesang, D. 957: X. Das Fischermädchen: Du schönes Fischermädchen»* (oEmbed 200, 2026-09-07).
2. **Dietrich Fischer-Dieskau / Gerald Moore** — DG, зап. 7+9 марта 1972, Berlin, UFA Studio (Грей id 8260/8263, по цикльному досье); каталог DG 2720 059 (переиздание — данный релиз). Певцу 47 — конец пика. Приоритет № 2 правил при отсутствии равноценной официальной загрузки более ранней сессии 1962 г. (обоснование см. в `cycle-schwanengesang-top5.md`, слот 2). Источник: Discogs release 10819077 — *«P - 1972 Polydor International GmbH, Hamburg / Previously released as 2720 059»* (https://www.discogs.com/release/10819077). Видео: `zQiYrzC1mhU` — «Dietrich Fischer-Dieskau - Topic», *«Schubert: Schwanengesang, D. 957: Das Fischermädchen»* (oEmbed 200).
3. **Hans Hotter / Gerald Moore** — Columbia, зап. 28–30 мая 1954, Abbey Road Studio No. 3, Лондон (Грей id 71724). Певцу 45 — сердцевина пика; «пантеонный» статус цикла (Arts Fuse, цит. в цикльном файле). Источник: Discogs release 25091812 (сборник EMI «The Great Bass-Baritone…») — примечание к сессиям диска 3 (треки 3-1…3-14, ровно 14 номеров = полный Schwanengesang): *«3-1 to 3-14 Rec.28–30.V.1954, No.3 Studio, Abbey Road, London»* (https://www.discogs.com/release/25091812); подтверждает дату сессии независимо от Грея и опровергает ошибочную дату «24–27, 29 мая» из карточки альбома по D 216 (это соседний блок — Winterreise, июль 1954). Видео: `f9NlJkJq13s` — «Hans Hotter - Topic», *«Schwanengesang, D. 957: No. 10, Das Fischermädchen»* (oEmbed 200).
4. **Hermann Prey / Walter Klien** — Decca, зап. 13–15+23 апреля 1963, Wien, Sofiensaal, прод. Erik Smith, инж. Gordon Parry; UK-издание SXL 6069. Певцу 34 — ранний пик, самая свежая из его четырёх студийных версий цикла. Источник: Discogs release 5163726 — *«RECORDING FIRST PUBLISHED 1963»*, кредиты «Erik Smith — Producer [Uncredited]», «Gordon Parry — Engineer [Uncredited]» (https://www.discogs.com/release/5163726). Видео: `0iZ-hIC6FUY` — «Hermann Prey - Topic», *«Schubert: Schwanengesang, D.957 (Cycle) : Das Fischermädchen»* (oEmbed 200).
5. **Gerald Finley / Julius Drake** — Hyperion CDA68288, зап. октябрь 2018, St Silas the Martyr, Kentish Town, Лондон, прод. Mark Brown, инж. Ben Connellan; изд. октябрь 2019. Певцу 58 — зрелый пик; сильнейший современный кандидат цикла по независимой критике (Gramophone, BBC, Arts Fuse — см. цикльный файл). Закрывает слот «не ранее 2015». Источник: страница Hyperion Records, релиз CDA68288 — recording date *«October 2018»*, venue *«St Silas the Martyr, Kentish Town, London, United Kingdom»*, release date *«October 2019»* (https://www.hyperion-records.co.uk/dc.asp?dc=D_CDA68288). Видео: `eSWsIksXNfE` — «Gerald Finley - Topic», *«Schubert: Schwanengesang, D. 957: Das Fischermädchen»* (oEmbed 200).

## Проверка живости и соответствия (oEmbed, yt-check.js, 2026-09-07)

| № | Запись | year | videoId | Канал (oEmbed) | Название (oEmbed) | Статус |
|---|---|---|---|---|---|---|
| 1 | Quasthoff — Zeyen | 2000 | `9DwO7LWdhzE` | Thomas Quasthoff - Topic | Schwanengesang, D. 957: X. Das Fischermädchen: Du schönes Fischermädchen | 200 |
| 2 | Fischer-Dieskau — Moore | 1972 | `zQiYrzC1mhU` | Dietrich Fischer-Dieskau - Topic | Schwanengesang, D. 957: Das Fischermädchen | 200 |
| 3 | Hotter — Moore | 1954 | `f9NlJkJq13s` | Hans Hotter - Topic | Schwanengesang, D. 957: No. 10, Das Fischermädchen | 200 |
| 4 | Prey — Klien | 1963 | `0iZ-hIC6FUY` | Hermann Prey - Topic | Schwanengesang, D.957 (Cycle) : Das Fischermädchen | 200 |
| 5 | Finley — Drake | 2018 | `eSWsIksXNfE` | Gerald Finley - Topic | Schwanengesang, D. 957: Das Fischermädchen | 200 |

Все пять — официальные «— Topic»-каналы соответствующих певцов, все встраиваемы и соответствуют именно этой песне (не соседним номерам цикла) и заявленным альбомам-источникам.

## Ключевые решения и отклонённые кандидаты

- **Приоритетная иерархия соблюдена без отклонений**: Квасthoff (№ 1) → Фишер-Дискау (№ 2) → Хоттер (лучший из «прочих звёзд прошлого» для этой песни: студийный эталон, лучший звук) → Прай (второй представитель группы «звёзды прошлого» — самая свежая из четырёх его версий цикла) → Финли (единственный современный слот, закрывает «не ранее 2015»). Порядок идентичен цикловой пятёрке `cycle-schwanengesang-top5.md`.
- **Внецикльных исторических кандидатов уровня Kipnis/Wunderlich/Anders для этой песни не найдено** — ни в дискографии Грея (карточки в `cycle-schwanengesang-top5.md` для Der Doppelgänger, Am Meer и Die Taubenpost перечисляют десятки внецикльных сторон именно ТЕХ песен; для Das Fischermädchen такого параллельного корпуса нет), ни в MusicBrainz (65 записей — почти все из цельных изданий), ни в выдаче `match-candidates.js` (24 видео, все — либо уже отобранные певцы, либо учебные/любительские ролики, либо второстепенные современные исполнители — Fassbaender, Bostridge, Prégardien, Skovhus, Terfel, Gerhaher — без документированного превосходства над выбранной пятёркой для этой конкретной песни).
- **Fischer-Dieskau, ранняя EMI-сессия (1951, Heine-блок)**: в пер-песенных разборах Der Doppelgänger и Am Meer та же сессия (6 октября 1951, Abbey Road Studio No. 3, HMV DB21491/DA2049) вытеснила DG-1972 по правилу «более ранняя запись при сходном уровне». Для Das Fischermädchen отдельная проверка того альбома (Discogs 8348067, «Schwanengesang, Nos. 8–13», Warner Classics) не выявила официальной потрековой загрузки именно этого номера с чистой атрибуцией к сессии 1951 г. (Grey не даёт для Das Fischermädchen отдельной id-карточки этой сессии, в отличие от Ihr Bild/Am Meer/Der Doppelgänger) — заменять DG-1972 не на что документированно лучшее; решение оставлено как в цикле. Кандидат на доисследование при появлении новых данных.
- **Замен не предлагается** — все пять записей проверены независимыми источниками (Discogs, Hyperion) и оригинальным исследованием цикла, videoId живы и соответствуют именно этой песне.

## Соответствие возрастной структуре

3 записи ранее 1990 (1954, 1963, 1972) ✓; 2 записи 1990+ (2000, 2018) ✓; из них 1 запись 2015+ (2018) ✓. Порядок — строгая иерархия приоритетов (не хронология).

## Источники

- `planning/research/cycle-schwanengesang-top5.md` — базовое исследование цикла (сессии, продюсеры, обоснование иерархии).
- Discogs API: release 1097040 (Quasthoff/Zeyen, DG 471 030-2), 10819077 (Fischer-Dieskau/Moore, DG 2720 059/переизд.), 25091812 (Hotter/Moore, EMI-сборник с примечаниями по сессиям 1954 г.), 5163726 (Prey/Klien, Decca SXL 6069).
- Hyperion Records, страница релиза CDA68288 (Finley/Drake) — https://www.hyperion-records.co.uk/dc.asp?dc=D_CDA68288
- `planning/youtube/data/d957-10-das-fischermadchen.mb.json` (MusicBrainz, 65 записей), `planning/youtube/data/d957-10-das-fischermadchen.candidates.json` (24 кандидата YouTube), `planning/youtube/data/d957-10-das-fischermadchen.yt.json`.
- `node planning/youtube/scripts/yt-check.js` — живость и метаданные всех пяти videoId, 2026-09-07.

## Итог

Пятёрка в `performances.json` (поле `"957/10"`) подтверждена без изменений. `replaced: 0`.
