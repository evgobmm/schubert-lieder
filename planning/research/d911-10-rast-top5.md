> **Отбор для «Зимнего пути» закрыт** (указание пользователя 2026-09-09: «топ 5 исполнителей для зимнего пути мы уже сделали, это менять не надо»).
> Пятёрка в `app/src/data/performances.json` остаётся как есть; этот файл — только опора для раздела «Как это поют».
> Рекомендации о заменах, если они ниже встречаются, НЕ выполнять.

# Rast (D 911/10, Winterreise №10) — проверка топ-5 исполнений

Дата: 2026-09-09. Ярус: Winterreise — пятёрка не подбирается заново (правило `youtube-performances.md`: «Winterreise — записи уже подобраны и утверждены; поток их не пересматривает»; перенос из референса — скриптом, не пересмотр). Этот файл — **точечная проверка по фактам** уже опубликованной пятёрки (задание вне общего конвейера), а не новый отбор с нуля.

Источник пятёрки: `app/src/data/performances.json`, ключ `"911/10"` — перенесена из `planning/winterreise-reference/src/data/performances.json` (тот же фиксированный состав из 5 исполнителей на все 24 песни цикла: Quasthoff/Spencer, Mattei/Nilsson, Fischer-Dieskau/Moore, Anders/Raucheisen, Hotter/Raucheisen — «один альбом — один год во всех песнях»). Правило приоритетных исполнителей и порядка: `docs/rules/youtube-performances.md` («Приоритетные исполнители», «Порядок записей в топ-5»).

Проверено: Discogs API (`api.discogs.com`, без ключа), MusicBrainz API, archive.org, YouTube oEmbed (живость/встраиваемость всех 5 videoId + сверка названия трека). Сетевых обращений: 5 WebSearch + 4 WebFetch + серия curl-вызовов к Discogs/MusicBrainz/archive.org/oEmbed API (дешёвые, без токена — согласно разделу «Верификация данных о записях»).

## Проверка пятёрки (в текущем порядке `performances.json`)

1. **Quasthoff — Spencer** (videoId `dD_jPh2BLBc`). Thomas Quasthoff (бас-баритон), Charles Spencer (фортепиано). RCA Red Seal, катал. 09026 63147 2. Discogs (release 8752021): «Recorded February 18-22, 1998, at Studio van Geest, Sandhausen» — https://www.discogs.com/release/8752021-Schubert-Thomas-Quasthoff-Charles-Spencer-Winterreise . **Расхождение**: в `performances.json` год указан как `1997`, факт сессии — **1998**. Приоритетный исполнитель №1 по правилу — место №1 подтверждено. oEmbed: «Winterreise, D. 911: No. 10, Rast | Thomas Quasthoff - Topic» — жив, официальный Topic-канал.

2. **Mattei — Nilsson** (videoId `w8tnr-YFaAo`). Peter Mattei (баритон), Lars David Nilsson (фортепиано). BIS Records, катал. BIS-2444. hraudio.net: «Recorded in November 2018 at Studio Acusticum, Pitea, Sweden, 24/96» — https://www.hraudio.net/showmusic.php?title=13897 . Год подтверждён. oEmbed: «Winterreise, Op. 89, D. 911: No. 10, Rast | Peter Mattei - Topic» — жив. **Проблема — не факт, а место в списке**: Маттеи не входит ни в один приоритетный разряд правила (не Квасthoff/Ф.-Д./Шварцкопф/названные «звёзды прошлого») — единственный современный участник пятёрки. По правилу «Порядок записей — строгая иерархия приоритетов» (Квасthoff → Ф.-Д. → Шварцкопф → прочие звёзды прошлого → современные) он обязан стоять **последним**, а не вторым.

3. **Fischer-Dieskau — Moore** (videoId `mLNqzgrpB0g`). Dietrich Fischer-Dieskau (баритон), Gerald Moore (фортепиано). Deutsche Grammophon, катал. 415 187-2 (CD-переиздание студийной сессии; Discogs master 256741 — labels: Deutsche Grammophon — https://www.discogs.com/master/256741-Dietrich-Fischer-Dieskau-Schubert-Gerald-Moore-Winterreise ). Год 1962 подтверждён независимо: тираж «The Record Society» (Австралия, лицензия) с пометкой `released: "1962-05-00"` (Discogs release 12890437) — то есть тираж уже вышел в мае 1962, значит сессия — не позже начала 1962; ряд источников относит её к этой же второй (стерео) записи Ф.-Д./Мура при жизни цикла. Точный день сессии в открытых источниках в рамках бюджета не подтверждён (веб-сводка называла «16–17 июля 1962», но это противоречит майскому релизу 1962 г. — отброшено как недостоверное). Год `1962` в `performances.json` — оставить. oEmbed: «Winterreise Op. 89: Rast | Gerald Moore - Topic» — жив (канал проиндексирован на Мура, не на Ф.-Д., но это тот же официальный DG-трек). **По иерархии приоритетов должен стоять на месте №2** (после Квасthoff, перед всеми «звёздами прошлого» и современными) — правило нарушено текущим порядком (стоит третьим).

4. **Anders — Raucheisen** (videoId `yKANP6iB1XU`). Peter Anders (тенор), Michael Raucheisen (фортепиано). Радиозапись RRG, Berlin, Haus des Rundfunks. archive.org (описание загрузки, воспроизводящее данные с пластинки/сессии): «Berlin, Haus des Rundfunks / 23.I., 2. & 13.III.1945»; трек «10. Rast 31:00» в том же списке — https://archive.org/details/PeterAndersWinterreiseD911Schubert1945_201802 . Год 1945 подтверждён, «Rast» присутствует. Хоттер и Андерс — оба в списке «прочих звёзд прошлого» правила; порядок между ними по качеству фактами этой проверки не пересматривается. oEmbed: «Winterreise, Op. 89, D.911.: No. 10, Rast | Peter Anders - Topic» — жив.

5. **Hotter — Raucheisen** (videoId `NRBktEedHms`). Hans Hotter (бас-баритон), Michael Raucheisen (фортепиано). Deutsche Grammophon (78 rpm), переиздание Music & Arts CD-1061. Discogs (release 13638959): «Recorded in November 1942 by DG and first issued in 1943 in 78 rpm set» — https://www.discogs.com/release/13638959-Hans-Hotter-Michael-Raucheisen-Franz-Schubert-Hans-Hotter-Sings-Schubert-Winterreise-The-1942-DG-Rec . Год 1942 подтверждён (сессия — ноябрь 1942, первое издание — 1943; год сессии в `performances.json` корректен). oEmbed: «Winterreise, Op. 89, D. 911: "Rast" | Hans Hotter - Topic» — жив.

## Итог проверки: факты в целом верны, порядок и один год — нет

Все пять videoId — те же «Rast», живые, официальные Topic-каналы. Личности исполнителей, пианисты и издания подтверждены источниками. **Замены исполнителя ни для одной из пяти позиций не предлагается** (`replaced = 0`) — состав пятёрки фактам не противоречит.

Найдены две несогласованности с правилами/фактами, которые стоит поправить в `performances.json` (файл не редактировался — только предлагается здесь):

1. **Год Quasthoff — Spencer: `1997` → `1998`** (сессия Studio van Geest, Sandhausen, 18–22.02.1998 — Discogs). Поскольку это единый альбом на всю Winterreise, поправка год-в-год затронет все 24 песни цикла с этим исполнителем, а не только «Rast» — вне полномочий этого файла (правило: «Один и тот же альбом получает один и тот же год во всех песнях»); нужен отдельный проход по всему циклу.
2. **Порядок**: правильная иерархия по правилу — **Quasthoff → Fischer-Dieskau → Anders → Hotter → Mattei** (сейчас Mattei стоит вторым, хотя он единственный современный участник и по правилу обязан быть последним). Это тоже сквозная для цикла настройка (тот же список пяти исполнителей у всех 24 песен) — менять только для «Rast» значило бы разойтись по порядку с остальными 23 песнями цикла; корректно поправить порядок один раз для всего цикла, не здесь.

## Отклонённые кандидаты

Кандидаты не пересматривались — задание не требовало нового отбора, только проверку уже утверждённой для всего цикла пятёрки. Иных кандидатов на «Rast» в рамках этой проверки не искали.
