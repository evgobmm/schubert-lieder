> **Отбор для «Зимнего пути» закрыт** (указание пользователя 2026-09-09: «топ 5 исполнителей для зимнего пути мы уже сделали, это менять не надо»).
> Пятёрка в `app/src/data/performances.json` остаётся как есть; этот файл — только опора для раздела «Как это поют».
> Рекомендации о заменах, если они ниже встречаются, НЕ выполнять.

# Die Krähe (D 911/15, Winterreise №15) — проверка пятёрки исполнений

Дата: 2026-09-09. Задача: не первичный отбор (песня входит в Winterreise — состав, по правилу, переносится из референса скриптом,
не пересматривается заново), а **фактическая проверка** пяти уже опубликованных записей в `app/src/data/performances.json` (поле
`"911/15"`) по `docs/rules/youtube-performances.md`: исполнители, точный год, происхождение, соответствие видео песне. Отдельного
файла-исследования под этой пятёркой раньше не было — этот файл его создаёт задним числом.

Источники: Discogs API (api.discogs.com, без токена), MusicBrainz API, archive.org metadata API, musicandarts.com, hraudio.net;
живость и содержание видео — YouTube oEmbed (без API-ключа). Все пять videoId просмотрены через oEmbed 2026-09-09: живы,
официальные «— Topic»-каналы, название каждого ролика содержит «Die Krähe» / «Die Krahe» — подмены песни нет.

## Проверка по записям (как опубликовано, по порядку в performances.json)

1. **Thomas Quasthoff — Charles Spencer**, RCA Red Seal 09026 63147 2 (℗©1998, BMG). Discogs (release 8752021): «Recorded
   February 18-22, 1998, at Studio van Geest, Sandhausen» (https://api.discogs.com/releases/8752021). MusicBrainz (release
   f10034f7-…) подтверждает состав и первый релиз 1998-10-05 (https://musicbrainz.org/release/f10034f7-5ebc-4122-a74d-35749ef90ca6).
   oEmbed: «Winterreise, D. 911: No. 15, Die Krähe» / «Thomas Quasthoff - Topic» (videoId `xyzyet37wHw`) — жив, корректен.
   **Расхождение**: в performances.json указан год **1997**, дискографически сессия — **февраль 1998**. Год требует правки на 1998
   (сам файл я не редактирую по запрету задачи).
2. **Peter Mattei — Lars David Nilsson**, BIS-2444 SACD (BIS, релиз 09/2019). hraudio.net: «Recorded in November 2018 at Studio
   Acusticum, Pitea, Sweden, 24/96» (https://www.hraudio.net/showmusic.php?title=13897); Discogs release 20939530 подтверждает
   лейбл/каталог (https://api.discogs.com/releases/20939530). oEmbed: «Winterreise, Op. 89, D. 911: No. 15, Die Krähe» /
   «Peter Mattei - Topic» (videoId `OutyygpTo2A`) — жив, корректен. Год 2018 в performances.json подтверждён (год сессии, не релиза).
3. **Dietrich Fischer-Dieskau — Gerald Moore**, EMI/Electrola (℗1963). Discogs master 1304876: «Recorded July 16-17, 1962. EMI
   1962 Stereo (℗ 1963) recording. This release groups the 2nd of three (1955, 1962, 1971) different recordings»
   (https://api.discogs.com/masters/1304876). Год 1962 в performances.json подтверждён точно (дата сессии). oEmbed: «Winterreise
   Op. 89: Die Krahe» / «Gerald Moore - Topic» (videoId `LNVoMv7kkqI`) — жив, корректен (канал назван по пианисту, а не по
   Фишеру-Дискау — особенность метаданных загрузки, на содержание не влияет).
4. **Peter Anders — Michael Raucheisen**, радиосессии Haus des Rundfunks, Берлин. archive.org (metadata API,
   `PeterAndersWinterreiseD911Schubert1945_201802`): «Franz Schubert, WINTERREISE — Peter Anders, Michael Raucheisen (23 gennaio
   e 2, 13 marzo 1945)»; в описании — построфный тайм-код «15. Die Krähe 47:29», подтверждающий, что песня в записи есть
   (https://archive.org/details/PeterAndersWinterreiseD911Schubert1945_201802). Год 1945 в performances.json подтверждён. oEmbed:
   «Winterreise, Op. 89, D.911.: No. 15, Die Krähe» / «Peter Anders - Topic» (videoId `158up8KIblY`) — жив, корректен.
5. **Hans Hotter — Michael Raucheisen**, DG 78 об/мин (первый Winterreise Хоттера, до трёх поздних версий с Дж. Муром/Вербой/
   Дальбергом). musicandarts.com (продуктовая страница CD-1061, «HOTTER SINGS WINTERREISE»): «from DG 78s, recorded November
   1942. A coproduction with Deutsches Rundfunkarchiv (AAD) 75:50» (https://musicandarts.com/product/hotter-sings-winterreise/).
   Discogs (master 1493258, амер. переиздание на Decca) подтверждает состав и первоисточник DG 78s
   (https://api.discogs.com/masters/1493258). Год 1942 в performances.json подтверждён. oEmbed: «Winterreise, Op. 89, D. 911:
   "Die Krahe"» / «Hans Hotter - Topic» (videoId `YaE9jtCnz7k`) — жив, корректен. Обзор classicstoday.com озаглавлен «Hotter's
   First Winterreise» (заголовок виден в выдаче поиска; сама страница за анти-бот-защитой, содержание не прочитано напрямую —
   не использую как источник цитаты).

## Найденное нарушение правила: порядок пятёрки

Правило «строгая иерархия приоритетов» требует порядок: **Квасthoff (1) → Фишер-Дискау (2) → Шварцкопф (3, нет кандидата) →
прочие звёзды прошлого (4) → современные (5)**. Опубликованный порядок —
Квасthoff → **Маттеи** → Фишер-Дискау → Андерс → Хоттер — ставит современного исполнителя (Маттеи, приоритетом не назван)
**выше** Фишера-Дискау (приоритет №2) и звёзд прошлого. Это расхождение с правилом, а не вопрос качества записей — все пять
сами по себе достойны пятёрки.

**Предлагаемый порядок** (тот же состав, без замен):
1. Quasthoff — Spencer (1998)
2. Fischer-Dieskau — Moore (1962)
3. Anders — Raucheisen (1945)
4. Hotter — Raucheisen (1942)
5. Mattei — Nilsson (2018)

Порядок Андерс/Хоттер между собой (тир «звёзды прошлого») оставлен как в текущем файле — прямого сравнительного источника по
качеству именно этих двух записей друг против друга не нашлось; менять на основании догадки не стал.

Возрастная структура не страдает от перестановки: 2 записи 1990+ (1998 Квасthoff, 2018 Маттеи), из них 1 запись 2015+ (2018) —
условие выполнено; 3 записи до 1990 (1962, 1945, 1942) — условие выполнено, по составу.

## Оценка кандидатов на замену

Ни одна из пяти записей не отклонена — по фактам все подтверждены (правильная песня, правильные исполнители, дискографически
точный год, издания прослеживаемы). Единственное найденное по пути соображение: у Квасthoff'а есть более поздняя, часто более
высоко ставимая полная запись Winterreise с Юстусом Цайеном (DG, 2005, «Quasthoff — Zeyen») — сравнение двух его записей друг
с другом не входило в объём этой проверки (это уже вопрос пересмотра выбора, а не проверки факта) и требует отдельного
прослушивания/сравнения критики; оставляю как возможный предмет будущего полного пересмотра, не меняю по факту без такого
сравнения.

## Что требует правки в performances.json (не тронуто по запрету задачи)

1. Год записи Квасthoff — Spencer: **1997 → 1998** (сессия задокументирована как 18–22 февраля 1998).
2. Порядок пятёрки: Фишер-Дискау должен стоять на месте №2 (сразу после Квасthoff), Маттеи — на месте №5 (см. выше).
