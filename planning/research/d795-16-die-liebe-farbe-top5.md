# Die liebe Farbe (D 795/16) — отбор топ-5 исполнений

Дата: 2026-09-06. Ярус: часть цикла «Die schöne Müllerin» (цикльный метод, `docs/rules/youtube-performances.md`, §«Масштабирование», п. 2) — базовая пятёрка наследуется из `planning/research/cycle-muellerin-top5.md` (исследование цикла: `planning/youtube/data/cycle-muellerin.dossier.json`, глубина famous). Задача этого файла — обязательная **пер-песенная проверка** этой конкретной песни (по образцу проверок «Das Wandern», «Wohin?», «Ungeduld» в цикльном файле): подтвердить состав, год и издание каждой из пяти уже опубликованных в `performances.json` записей и проверить, не вытесняет ли самостоятельная концертная жизнь песни цикльную позицию (как это произошло со Шварцкопф в «Ungeduld»).

Источники этого прохода: Discogs API (`api.discogs.com`, curl без токена), YouTube oEmbed (`node`-эквивалент `yt-check.js`), MusicBrainz-выгрузка `planning/youtube/data/d795-16-die-liebe-farbe.mb.json` (68 записей work'а), реестр альбомов и досье цикла (даты сессий по дискографии Майкла Грея, classical-discography.org — прямые постоянные URL по отдельным сторонам сайт не выдаёт, поисковая форма только по каталожным запросам; цитируется как в цикльном файле — по id записи).

## Итог проверки: пятёрка `performances.json` подтверждена без изменений

Все пять видео живы и встраиваемы (oEmbed 200, проверено 2026-09-06), канал соответствует певцу, название содержит «Die liebe Farbe» / «D. 795: No. 16, Die liebe Farbe»:

| № | Запись | videoId | oEmbed title / channel |
|---|---|---|---|
| 1 | Quasthoff — Zeyen | `en-uXZfJ7mY` | «Schubert: Die schöne Müllerin, D. 795: No. 16, Die liebe Farbe» — Thomas Quasthoff - Topic |
| 2 | Fischer-Dieskau — Moore | `PDCwmHbFE7E` | «Die schöne Müllerin, Op. 25, D. 795: No. 16, Die liebe Farbe» — Dietrich Fischer-Dieskau - Topic |
| 3 | Hüsch — H. U. Müller | `SQ9WK9wsWmk` | «Die schöne Müllerin, Op. 25, D. 795: Die liebe Farbe» — Gerhard Hüsch - Topic |
| 4 | Wunderlich — Giesen | `R2uRj1pnEqo` | «Schubert: Die schöne Müllerin, D. 795: No. 16, Die liebe Farbe» — Fritz Wunderlich - Topic |
| 5 | Hasselhorn — Bushakevitz | `qz0sDNfMftM` | «Schubert: Die schöne Müllerin, D. 795: No. 16, Die liebe Farbe» — Samuel Hasselhorn - Topic |

## Проверка по записям (кто поёт/играет, год, издание — с источником и цитатой)

1. **Thomas Quasthoff (бас-баритон) / Justus Zeyen** — DG 00289 474 2182, «Die Schöne Müllerin». Год — сессия, не издание: Discogs release 4640997, поле notes — «Recording: Berlin, Teldex Studio, 7/2005» (https://www.discogs.com/release/4640997). Приоритет №1 правил (высший в иерархии) — при достойном качестве записи (студийный флагман DG в его вокальном пике, ~1993–2007) занимает №1 в любой песне цикла, эта позиция уже была подтверждена в `cycle-muellerin-top5.md`.
2. **Dietrich Fischer-Dieskau (баритон) / Gerald Moore** — Electrola/EMI STE 91 187/88 S, ныне Warner. Discogs release 5154563, поле notes — «Recorded Dec 1961 in Berlin» (https://www.discogs.com/release/5154563); трек «Die Liebe Farbe» в трек-листе под номером C3. Сходится с реестром проекта (сессии 2–3.12.1961, Berlin-Zehlendorf). Ему 36 — середина документированного пика (~1951–1972), стерео; самая тиражируемая EMI-версия цикла. Приоритет №2 правил.
3. **Gerhard Hüsch (баритон) / Hanns Udo Müller** — HMV DB 2429–2436 (1935), переизд. Angel «Great Recordings of the Century», Pristine PACO007. Год по дискографии Майкла Грея (classical-discography.org), выборочные матричные даты того же цикла: id 74340 «1935 January 31» (Das Wandern, DB2429), id 56255 «1935 February 2» (Trockne Blumen, DB2435), id 53828 «1935 March 22» (Der Müller und der Bach, DB2436) — сессии всего цикла укладываются в январь–март 1935; отдельная матрица именно для «Die liebe Farbe» (внутренний трек одного из тех же дисков DB242 9–2436) при повторном поиске на сайте не извлечена (сайт не даёт постоянных URL на отдельные позиции, только форму запроса), поэтому год принят по документированным сессиям того же комплекта — 1935, как и в цикльном файле. Ему 34 — пик, тот же дуэт, что записал эталонную Winterreise 1933; klassik-prisma — 5 баллов, первая строка мужской таблицы (реестр проекта). Сильнейшая запись группы «звёзды прошлого» для этого цикла.
4. **Fritz Wunderlich (тенор) / Hubert Giesen** — DG 139 219/220, «Die Schöne Müllerin / 7 Lieder». Discogs release 6819963 (release year 1966) подтверждает трек-лист: «Die Liebe Farbe» — позиция C2, 3:51 (https://www.discogs.com/release/6819963). Дата сессии — по реестру проекта и дискографии Грея: 2–5 июля 1966, Akademie der Wissenschaften, Мюнхен; последние студийные сессии певца перед гибелью 17.09.1966. Эталон тенорового цикла.
5. **Samuel Hasselhorn (баритон) / Ammiel Bushakevitz** — harmonia mundi HMM 902720, «Die Schöne Müllerin» (т. 1 проекта «Schubert 200»). Discogs release 36696394: трек-лист содержит позицию 16 «Die Liebe Farbe» (https://www.discogs.com/release/36696394); release year 2023, изд. 22.09.2023. Точная дата сессии не задокументирована (реестр: «зап. 2023?»). Ему 33 — ранний пик; Diapason d'or октября 2023 и Diapason d'or de l'année — объективные премии.

## Самостоятельная концертная жизнь песни — проверена, вытеснения не выявлено

В отличие от «Ungeduld» (D 795/7), где отдельная пластиночная традиция песни вытеснила цикльную позицию (Шварцкопф — Мур 1954), для «Die liebe Farbe» такого основания нет:

- MusicBrainz work «Die schöne Müllerin, D. 795: Nr. 16. Die liebe Farbe» даёт 68 записей (`planning/youtube/data/d795-16-die-liebe-farbe.mb.json`) — подавляющее большинство это полные циклы (Bostridge, Goerne, Prégardien, Schreier, Padmore, Güra, Holzmair, Krimmel, Schuen и т.д.), а не одиночные внецикльные стороны.
- Среди этих 68 исполнителей **нет ни одного** из именного списка приоритетов правил помимо уже представленных Квастхофа и Фишера-Дискау: Шварцкопф, Хоттер, Андерс, Э. Шуман, Криста Людвиг, Лючия Попп в списке отсутствуют. Это совпадает с отрицательными результатами по этим же именам, уже задокументированными для большинства номеров цикла в `cycle-muellerin-top5.md` (например, для «Wohin?» и общего свода по циклу).
- Единственные исторические внецикльные варианты старой гвардии в списке — Aksel Schiøtz/Moore (1945, часть его полного цикла, уже зафиксирован в цикльном файле как первый резерв группы «звёзды прошлого») и Petre Munteanu/Holetschek, Julius Patzak/Raucheisen, Lotte Lehmann/Ulanowsky (сокращённая женская версия) — все они уже рассмотрены и отклонены на уровне цикла по тем же причинам (ниже Хюша/Вундерлиха по консенсусной репутации либо не издавались потреково).
- Richard Crooks/La Forge — англоязычная версия («The Miller's Flowers» / английский текст), по правилу проекта иноязычные версии не рассматриваются.

Вывод: у «Die liebe Farbe» нет отдельной пластиночной «шлягерной» жизни уровня «Ungeduld», «Das Wandern» или «Wohin?» — это медленный, интроспективный номер, который певцы записывали почти исключительно в составе полного цикла. Основания для пер-песенного вытеснения цикльной пятёрки нет.

## Отклонённые кандидаты (резервы, не вытесняющие пятёрку)

- **Aksel Schiøtz / Gerald Moore (1945)** — первый резерв группы «звёзды прошлого» (как и на уровне всего цикла); уступает Хюшу и Вундерлиху по консенсусной репутации.
- **Ian Bostridge / Graham Johnson (1995, Hyperion)** — первый резерв современного слота (как на уровне цикла); слоты «≥1990» и «≥2015» в этой пятёрке уже заняты Квастхофом (приоритет №1) и Хассельхорном.
- **Andrè Schuen / Daniel Heide (2020)**, **Konstantin Krimmel / Daniel Heide (2023)** — резервы слота «≥2015»; у Хассельхорна объективная премия выше (Diapason d'or de l'année за весь цикл).
- **Christian Gerhaher / Gerold Huber (2003, 2016)**, **Matthias Goerne / Eschenbach (2008)**, **Werner Güra / Schultsz (2000)**, **Christoph Prégardien / Gees (2008)**, **Mark Padmore / Lewis (2010)**, **Wolfgang Holzmair** — достойный современный второй ряд, уже отклонённый на уровне цикла в пользу Бостриджа-резерва и Хассельхорна.
- **Jonas Kaufmann / Deutsch (2009)** — правило скепсиса к пиару; вне пятёрки на уровне всего цикла.
- **Peter Schreier (Olbertz 1972 / Schiff 1989)**, **Gérard Souzay / Baldwin (1964)**, **Hermann Prey (Hokanson 1973 / Bianconi)**, **Peter Pears / Britten (1960)** — второй ряд старой группы, ниже Хюша и Вундерлиха.
- **Richard Crooks / Frank La Forge** — англоязычная версия, вне рассмотрения по правилам корпуса (только немецкоязычные записи).

## Соответствие правилам состава

3 записи ранее 1990 (1935, 1961, 1966) ✓; 2 записи 1990+ (2005, 2023) ✓, из них 1 запись 2015+ (2023) ✓. Порядок — строгая иерархия приоритетов: Квастхоф (№1) → Фишер-Дискау (№2) → звёзды прошлого по качеству (Хюш → Вундерлих) → современная (Хассельхорн). Публикация в `performances.json` изменений не требует.
