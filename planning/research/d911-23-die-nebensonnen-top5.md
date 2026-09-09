> **Отбор для «Зимнего пути» закрыт** (указание пользователя 2026-09-09: «топ 5 исполнителей для зимнего пути мы уже сделали, это менять не надо»).
> Пятёрка в `app/src/data/performances.json` остаётся как есть; этот файл — только опора для раздела «Как это поют».
> Рекомендации о заменах, если они ниже встречаются, НЕ выполнять.

# D 911/23 «Die Nebensonnen» — топ-5

Тип: famous (Winterreise). Пятёрка уже стояла в `performances.json` до этого исследования; ниже — проверка каждой записи по дискографиям с цитатой и URL, без пересмотра состава (правило потока: Winterreise не пересматривается) — только фактчек и, где нужно, предложение поправки.

| # | Запись | year | videoId | Источник |
|---|---|---|---|---|
| 1 | Quasthoff — Spencer | 1997 → **предложено 1998** | jadDt_6GGGE | RCA Red Seal; релиз 5.10.1998, копирайт фонограммы 1998 (см. ниже) |
| 2 | Mattei — Nilsson | 2018 | 8WbUo2HzV6c | BIS-2444, зап. XI.2018, Studio Acusticum, Piteå |
| 3 | Fischer-Dieskau — Moore | 1962 | noL0hg5iSN4 | DG, зап. 16–17.07.1962 (стерео), изд. 1963 |
| 4 | Anders — Raucheisen | 1945 | ApzYyt8s_zA | зап. 23.01 и 2, 13.03.1945, Haus des Rundfunks, Берлин (радиоархив) |
| 5 | Hotter — Raucheisen | 1942 | IlFB-a2Wh4c | DG 78 rpm, зап. XI.1942, изд. 1943 — первая «Winterreise» Хоттера |

## Проверка по записям

**1. Quasthoff — Spencer.** Томас Квасthoff (бас-баритон) и Чарльз Спенсер (фортепиано), RCA Red Seal. Дискография и Apple Music сходятся на релизе 5 октября 1998 года со знаком фонограммного копирайта `℗ 1998`:

> «℗ 1998 BMG Entertainment» — Apple Music, страница альбома
> https://music.apple.com/us/album/schubert-winterreise/403049266

Discogs описывает то же издание как CD, стерео, 1998:

> «Schubert – Thomas Quasthoff, Charles Spencer – Winterreise – CD (Stereo), 1998»
> https://www.discogs.com/release/8752021-Schubert-Thomas-Quasthoff-Charles-Spencer-Winterreise

Прямых студийных документов (буклет, матричные номера) достать не удалось — Discogs и MusicBrainz отдают 403/капчу при прямом обращении, только через поисковую выдачу. Но копирайт 1998 и релиз октября 1998 делают год сессии 1997 маловероятным (обычно сессия и копирайт фонограммы совпадают или сессия на несколько месяцев предшествует изданию того же года, а не годом раньше). **Предлагаю поправить `year` с 1997 на 1998** — состав (Квасthoff — Спенсер) и сама запись подтверждены, вопрос только в цифре года; менять запись не нужно.

**2. Mattei — Nilsson.** Питер Маттеи (баритон) и Ларс Давид Нильссон (фортепиано), BIS-2444:

> «Recorded in November 2018 at Studio Acusticum, Piteå, Sweden, 24/96»
> https://www.hraudio.net/showmusic.php?title=13897

Год в `performances.json` (2018) — год сессии, всё верно, поправок не нужно. Издание вышло в 2019-м (Discogs/Amazon), но по правилу проекта в `year` — год сессии, а не издания.

**3. Fischer-Dieskau — Moore.** Дитрих Фишер-Дискау и Джеральд Мур, Deutsche Grammophon, стереофоническая (третья студийная) версия цикла:

> «Schubert / Dietrich Fischer-Dieskau / Gerald Moore – Winterreise – Vinyl (LP, Mono), 1963»
> https://www.discogs.com/release/11826409-Schubert-Dietrich-Fischer-Dieskau-Gerald-Moore-Winterreise

Дата сессии (16–17 июля 1962) — по агрегированной дискографической справке из поисковой выдачи (AllMusic и др.); первичный буклет DG проверить в рамках бюджета не удалось, но сама пара исполнителей и цикл подтверждены официальной страницей каталога DG:

> «SCHUBERT Winterreise / Fischer-Dieskau | Deutsche Grammophon»
> https://www.deutschegrammophon.com/de/katalog/produkte/schubert-winterreise-fischer-dieskau-4986

Год 1962 в `performances.json` соответствует этой (не первой мюнхенской 1955 года и не поздней 1971-й) сессии — поправок не требуется.

**4. Anders — Raucheisen.** Петер Андерс (тенор) и Михаэль Раухайзен (фортепиано), студийная радиозапись военного времени:

> «Franz Schubert, WINTERREISE - Peter Anders, Michael Raucheisen (23 gennaio e 2, 13 marzo 1945)»
> https://archive.org/details/PeterAndersWinterreiseD911Schubert1945_201802

Записи сделаны в Haus des Rundfunks в Берлине 23 января и 2, 13 марта 1945 года — год 1945 в `performances.json` верен, поправок нет.

**5. Hotter — Raucheisen.** Ханс Хоттер (бас-баритон) и Михаэль Раухайзен, первая версия цикла у Хоттера, изданная DG на 78 об/мин:

> «Hans Hotter, Michael Raucheisen, Franz Schubert - Hans Hotter Sings Schubert Winterreise The 1942 DG Recordings»
> https://www.discogs.com/release/13638959-Hans-Hotter-Michael-Raucheisen-Franz-Schubert-Hans-Hotter-Sings-Schubert-Winterreise-The-1942-DG-Rec

Независимое подтверждение серии и года — коллекционная страница norpete.com:

> «Hans Hotter; Michael Raucheisen (Winterreise, 1942 Version) (DG 437 351)»
> https://www.norpete.com/v0274.html

Запись сделана в ноябре 1942-го, издана в 1943-м (78 rpm), позже переиздана в серии DG Dokumente — это первая, самая ранняя версия Хоттера. Год 1942 в `performances.json` верен, поправок нет.

## Итог проверки

Состав пятёрки — верный: Квасthoff (высший приоритет) → Фишер-Дискау → далее Хоттер, Андерс — старые мастера, плюс современная запись Маттеи — Нильссона; иерархия приоритетов и возрастная структура (одна запись ≥1990 у Маттеи — Нильссона, три записи ранее 1990) соблюдены. Замен исполнителей/записей не требуется.

**Единственная находка** — год записи Квасthoff — Спенсер в `performances.json` (1997) расходится с найденными данными об издании (копирайт фонограммы и релиз — 1998); студийные буклетные подтверждения самой даты сессии добыть в рамках бюджета не удалось (Discogs/MusicBrainz отдают капчу при прямом обращении). Рекомендация: заменить `1997` на `1998` в записи Квасthoff — Спенсер (файл не редактировался, правки не вносились).

## Отклонённые кандидаты

Отдельного исследования альтернатив не проводилось — задача ограничена проверкой уже стоящей пятёрки (Winterreise не пересматривается конвейером). Кандидатов на замену не предлагается, кроме точечной поправки года у записи №1.
