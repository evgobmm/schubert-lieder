> **Отбор для «Зимнего пути» закрыт** (указание пользователя 2026-09-09: «топ 5 исполнителей для зимнего пути мы уже сделали, это менять не надо»).
> Пятёрка в `app/src/data/performances.json` остаётся как есть; этот файл — только опора для раздела «Как это поют».
> Рекомендации о заменах, если они ниже встречаются, НЕ выполнять.

# Auf dem Flusse (D 911/7) — отбор топ-5 исполнений

Дата: 2026-09-09. Правила: `docs/rules/youtube-performances.md`. Песня входит в цикл «Winterreise» (D 911), который по правилам потока **не пересматривается** («Не трогать: … и Winterreise — записи уже подобраны и утверждены»): пятёрка перенесена скриптом из `planning/winterreise-reference/src/data/performances.json` (раздел «Масштабирование», п. 1а) — единая для всех 24 песен цикла тройка исполнитель/пианист, с per-song videoId. Сверка `videos["7"]` референса с полем `"911/7"` в `app/src/data/performances.json` — videoId совпадают буквально (все 5). Отдельного per-song top5-файла под этой записью не было — этот файл восполняет пробел: имена, годы и издания перепроверены по первичным источникам в сети, плюс живость видео — через `yt-check.js`.

**Итог проверки: состав пятёрки подтверждён. Найдена одна неточность в поле `year`** — у Квастхофа/Спенсера должен быть **1998**, а не 1997 (см. запись №1). Замены исполнителя не предлагается (`replaced: 0` по смыслу «другая запись» — это правка одного поля `year`, не подмена трека).

## Итоговый топ-5

1. **Thomas Quasthoff / Charles Spencer** — RCA Red Seal 09026 63147 2, «Winterreise» (полный цикл), издание 1998. Источник: jpc.de, карточка релиза — «Aufnahmejahr ca.: 1998» / «Label: RCA» — https://www.jpc.de/jpcng/classic/detail/-/art/Franz-Schubert-1797-1828-Winterreise-D-911/hnum/8690605; подтверждено заголовком релиза на Discogs — «Schubert – Thomas Quasthoff, Charles Spencer – Winterreise – CD (Stereo), 1998» — https://www.discogs.com/release/8752021-Schubert-Thomas-Quasthoff-Charles-Spencer-Winterreise. **В `performances.json` стоит `year: 1997` — это неточно, правильный год 1998** (запись, судя по нескольким источникам о буклете, сделана 18–22 февраля 1998 в Studio van Geest, Зандхаузен; эта деталь не подтверждена дословной цитатой с открытой страницы и приводится со сниженной уверенностью). Приоритет №1 по иерархии правил (Квастхоф). Видео `ZwE8lnuf9fc`: заголовок «Winterreise, D. 911: No. 7, Auf dem Flusse», канал «Thomas Quasthoff - Topic», oEmbed 200 (проверено 2026-09-09).

2. **Dietrich Fischer-Dieskau / Gerald Moore** — Deutsche Grammophon, «Die Winterreise», сессия и издание документированы под 1962 годом. Источник: заголовок карточки Discogs — «…Dietrich Fischer-Dieskau And Gerald Moore – "Die Winterreise", Op. 89 … 2 x Vinyl (LP, Compilation + 3 more), 1962» — https://www.discogs.com/release/12890437; согласуется с AllMusic — «Schubert: Die schöne Müllerin; Wintereise [1961/1962 Recordings]» — https://www.allmusic.com/album/schubert-die-sch%C3%B6ne-m%C3%BCllerin-wintereise-1961-1962-recordings--mw0004533251. Точный лейбл-каталог и точные даты сессии (страницы Discogs/AllMusic отдали 403 при прямом обращении) в этом заходе не перепроверены дословной цитатой — год 1962 подтверждён дважды независимо, дальнейшая точность (день записи, каталожный номер) требует отдельного захода. Приоритет №2 по иерархии. Видео `guAttqEpDsw`: «Winterreise Op. 89: Auf dem Flusse», канал «Gerald Moore - Topic» (не «Fischer-Dieskau - Topic» — тот же альбом каталогизирован YouTube под именем пианиста), oEmbed 200 (проверено 2026-09-09).

3. **Hans Hotter / Michael Raucheisen** — Deutsche Grammophon, запись ноябрь 1942, Берлин; первое издание — 78 об/мин, 1943. Источник: заголовок карточки Discogs — «Hans Hotter, Michael Raucheisen, Franz Schubert - Hans Hotter Sings Schubert Winterreise The 1942 DG Recordings» — https://www.discogs.com/release/13638959; независимо — «Hans Hotter; Michael Raucheisen (Winterreise, 1942 Version) (DG 437 351)» — https://www.norpete.com/v0274.html. Год в `performances.json` (1942) подтверждён. Видео `Z9dFl2NbCY0`: «Winterreise, Op. 89, D. 911: "Auf dem Flusse"», канал «Hans Hotter - Topic», oEmbed 200 (проверено 2026-09-09).

4. **Peter Anders / Michael Raucheisen** — запись Берлин, Haus des Rundfunks, январь–март 1945; издавалась как DG «Centenary Collection». Источник: описание релиза на Internet Archive — «Berlin, Haus des Rundfunks», «23.I., 2. & 13.III.1945» — https://archive.org/details/PeterAndersWinterreiseD911Schubert1945_201802 (проверено прямым обращением к странице). Год в `performances.json` (1945) подтверждён точно. Видео `-L5rYP7vQzE`: «Winterreise, Op. 89, D.911.: No. 7, Auf dem Flusse», канал «Peter Anders - Topic», oEmbed 200 (проверено 2026-09-09).

5. **Peter Mattei / Lars David Nilsson** — BIS-2444, зап. ноябрь 2018, Studio Acusticum, Питео (Швеция). Источник: hraudio.net, карточка релиза — «Recorded in November 2018 at Studio Acusticum, Pitea, Sweden, 24/96» — https://www.hraudio.net/showmusic.php?title=13897 (проверено прямым обращением к странице). Год в `performances.json` (2018) подтверждён точно; пианист «Nilsson» — соответствует «Lars David Nilsson». Видео `OS216XVOCVU`: «Winterreise, Op. 89, D. 911: No. 7, Auf dem Flusse», канал «Peter Mattei - Topic», oEmbed 200 (проверено 2026-09-09).

## Отклонённые кандидаты

Специального нового поиска кандидатов не проводилось — пятёрка зафиксирована на уровне всего цикла и не пересматривается потоком (см. правило выше). В рамках этой проверки альтернативы не рассматривались; отвода ни одной из пяти записей по существу (не та песня / не тот исполнитель / явно хуже отклонённых) не найдено — все пять видео на «Topic»-каналах, названия совпадают с «Auf dem Flusse» (No. 7), исполнители подтверждены первичными источниками.

## Соответствие правилам состава

3 записи ранее 1990 г. (1942, 1945, 1962/63) ✓; 2 записи 1990+ (1998, 2018) ✓; из них ни одной 2015+ — требование «если есть достойная» необязательно и удовлетворяется по правилу «иначе — лучшие старые записи» (последний слот отдан фрагменту цикла, а не отдельному современному синглу; вопрос о слоте 2015+ для всего Winterreise решается на уровне цикла, не отдельной песни). Порядок — строгая иерархия: Квастхоф → Фишер-Дискау → звёзды прошлого по качеству (Хоттер → Андерс) → современный (Маттеи).

## Техническая проверка (oEmbed, `yt-check.js`, 2026-09-09)

| № | videoId | Канал | Заголовок | Статус |
|---|---|---|---|---|
| 1 | ZwE8lnuf9fc | Thomas Quasthoff - Topic | Winterreise, D. 911: No. 7, Auf dem Flusse | 200 |
| 2 | guAttqEpDsw | Gerald Moore - Topic | Winterreise Op. 89: Auf dem Flusse | 200 |
| 3 | Z9dFl2NbCY0 | Hans Hotter - Topic | Winterreise, Op. 89, D. 911: "Auf dem Flusse" | 200 |
| 4 | -L5rYP7vQzE | Peter Anders - Topic | Winterreise, Op. 89, D.911.: No. 7, Auf dem Flusse | 200 |
| 5 | OS216XVOCVU | Peter Mattei - Topic | Winterreise, Op. 89, D. 911: No. 7, Auf dem Flusse | 200 |

Все пять — живы, встраиваемы, заголовок подтверждает именно «Auf dem Flusse» (No. 7), не перепутано с другой песней цикла.

## Вывод и рекомендация

`app/src/data/performances.json` (поле `"911/7"`) по составу и videoId менять не требуется — все пять записей проверены по первичным источникам, четыре года подтверждены точно (1942, 1945, 1962, 2018). **Рекомендуется точечная правка одного поля**: `year` у записи Quasthoff — Spencer с `1997` на `1998` (документировано двумя независимыми источниками: jpc.de и заголовком релиза Discogs). Так как поле `"911/7"` идентично по значению году во всех 24 песнях цикла (единая тройка «исполнитель/пианист» на весь Winterreise), эта неточность, скорее всего, наследуется во всех 24 полях `"911/N"` — правку по правилам потока делает не это исследование (файл не редактировался, `app/src/data/performances.json` не тронут), а отдельное решение по циклу.
