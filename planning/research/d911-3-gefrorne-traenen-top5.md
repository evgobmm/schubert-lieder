> **Отбор для «Зимнего пути» закрыт** (указание пользователя 2026-09-09: «топ 5 исполнителей для зимнего пути мы уже сделали, это менять не надо»).
> Пятёрка в `app/src/data/performances.json` остаётся как есть; этот файл — только опора для раздела «Как это поют».
> Рекомендации о заменах, если они ниже встречаются, НЕ выполнять.

# Gefrorne Tränen (D 911/3, Winterreise №3) — проверка топ-5 исполнений

Дата: 2026-09-09. Задача: не отбор с нуля, а **проверка** уже опубликованной в `app/src/data/performances.json` пятёрки (поле `"911/3"`) — она перенесена из `planning/winterreise-reference` вместе со всем циклом (правило `docs/rules/youtube-performances.md`, раздел «Масштабирование…», п. 1: «Winterreise — перенос готового отбора из референса скриптом (не пересмотр)»; раздел «Пилот потока»: «Не трогать: … Winterreise — записи уже подобраны и утверждены»). Одна и та же пятёрка исполнителей (Quasthoff–Spencer / Mattei–Nilsson / Fischer-Dieskau–Moore / Anders–Raucheisen / Hotter–Raucheisen) используется во всех проверенных песнях цикла (911/1, /2, /4, /5 — та же структура, другие videoId), т.е. это цикловой отбор, а не отбор под конкретную песню.

Источники: Discogs (API `api.discogs.com`, без токена), Apple Music, archive.org, Music & Arts (musicandarts.com), Limelight, Konserthuset Stockholm, YouTube oEmbed. Бюджет — 12 обращений к сети (использован полностью).

## Проверка каждой из пяти записей

### 1. Thomas Quasthoff — Charles Spencer

Видео `qT6dozgg6Qw` — oEmbed: **«Winterreise, D. 911: No. 3, Gefrorene Tränen»**, канал **Thomas Quasthoff — Topic** — https://www.youtube.com/watch?v=qT6dozgg6Qw (жив, встраиваемый; официальный Topic-канал певца). Песня и исполнитель подтверждены.

Год в `performances.json` — **1997**; проверка не подтвердила эту дату. Релиз (RCA Red Seal/BMG) вышел в 1998 году: Apple Music, дословно — «℗ 1998 BMG Entertainment», дата релиза «October 5, 1998» — https://music.apple.com/us/album/schubert-winterreise/403049266. По независимым описаниям выдачи поиска (eBay-листинг диска, MusicBrainz) сессия записи — февраль 1998, студия van Geest, Зандхаузен («Recorded February 18-22, 1998, at Studio van Geest, Sandhausen») — https://musicbrainz.org/release/f10034f7-5ebc-4122-a74d-35749ef90ca6 (страницу сам не открыл дословно — за Cloudflare-проверкой, цитата из выдачи поиска, не с сырого текста; статус **secondary**, не `verified`). Итог: **год в базе, скорее всего, должен быть 1998, не 1997** — расхождение в один год, не влияет на позицию Квасthoff в пятёрке (приоритет №1 безусловно), но стоит поправить по всему циклу (эффект не локален для этой песни).

### 2. Fritz Wunderlich — нет, по списку: Peter Mattei — Lars David Nilsson

Видео `ckPWZwN8NWU` — oEmbed: **«Winterreise, Op. 89, D. 911: No. 3, Gefror'ne Tränen»**, канал **Peter Mattei — Topic** — https://www.youtube.com/watch?v=ckPWZwN8NWU (жив, встраиваемый). Каталожный номер подтверждён напрямую: Limelight (просмотрено), карточка релиза — «BIS BIS2444», «Peter Mattei bar, Lars David Nilsson p» — https://limelight-arts.com.au/reviews/schubert-winterreise-peter-mattei-lars-david-nilsson/. Запись выросла из совместного скандинавского турне 2018 года и телефильма для шведского SVT — Konserthuset Stockholm, программа концерта 2018 года — https://www.konserthuset.se/en/programme/calendar/concert/2018/winterreise-with-peter-mattei/ (год 2018 подтверждён контекстом турне и концертной афишей; точная дата студийной сессии BIS не установлена дословной цитатой — **secondary** по году). Год в базе (2018) не противоречит найденному.

### 3. Dietrich Fischer-Dieskau — Gerald Moore

Видео `zzKPB71oo1s` — oEmbed: **«Winterreise Op. 89: Gefror'ne Tranen»**, канал **Gerald Moore — Topic** — https://www.youtube.com/watch?v=zzKPB71oo1s (жив, встраиваемый; официальный Topic-канал пианиста — распространённая практика для сессий, изданных под именем аккомпаниатора на сборниках). Год и происхождение подтверждены дословно: Discogs, мастер-релиз EMI/Electrola «Die Winterreise» — «Recorded July 16-17, 1962. EMI 1962 Stereo (℗ 1963) recording. This release groups the 2nd of three (1955, 1962, 1971) different recordings» — https://www.discogs.com/master/1304876-Franz-Schubert-Dietrich-Fischer-Dieskau-Gerald-Moore-Winterreise. Год 1962 (сессия) в базе — точен.

Важное уточнение: у Фишера-Дискау с Муром есть **три разных студийных Winterreise** (1955, 1962, 1971) — при обращении к этой записи в будущем (аннотации «О песне» и т.п.) нельзя путать её с версией 1971 года (тоже DG/EMI, тот же дуэт), это подтверждённый отдельный мастер-релиз (id 256741, «Recorded: August 1971, Berlin, UFA-Tonstudio»).

### 4. Peter Anders — Michael Raucheisen

Видео `T617fVb-AFI` — oEmbed: **«Winterreise, Op. 89, D.911.: No. 3, Gefrorne Tränen»**, канал **Peter Anders — Topic** — https://www.youtube.com/watch?v=T617fVb-AFI (жив, встраиваемый). Происхождение подтверждено дословно с archive.org (сам открыл страницу): «Peter Anders sings 'Winterreise' D 911 … Michael Raucheisen, piano Berlin, Haus des Rundfunks 23.I., 2. & 13.III.1945» — https://archive.org/details/PeterAndersWinterreiseD911Schubert1945_201802. Это студийная радиозапись Haus des Rundfunks (Berlin) на исходе войны — редкий документ архива Раухайзена. Год в базе (1945) — точен; более точная датировка — три сессии (23 января, 2 и 13 марта 1945), песня №3 могла быть записана в любую из них — по трек-листу не разбито, оставляю как факт «1945» без уточнения дня.

### 5. Hans Hotter — Michael Raucheisen

Видео `aRYRFFBA_0E` — oEmbed: **«Winterreise, Op. 89, D. 911: "Gefror'ne Tranen"»**, канал **Hans Hotter — Topic** — https://www.youtube.com/watch?v=aRYRFFBA_0E (жив, встраиваемый). Происхождение подтверждено дословно: Music & Arts (сам открыл страницу карточки товара), «Hans Hotter, baritone, with Michael Raucheisen, piano; from DG 78s, recorded November 1942.» — https://musicandarts.com/product/hotter-sings-winterreise/. Это первая из (как минимум) четырёх студийных Winterreise Хоттера — самая ранняя и, по репутации, одна из сильнейших (по данным поисковой выдачи со ссылкой на обзор classicstoday.com критик Джозеф Горовиц называет её «сильнейшей Winterreise, какую я знаю» — цитату сам не смотрел дословно на сыром тексте, статус **secondary**, не включаю в число проверенных фактов). Год в базе (1942) — точен, ноябрь 1942, издана на 78-об/мин в 1943 году.

## Итог проверки

Все пять записей подлинные, это действительно D 911/3 «Gefrorne Tränen» в исполнении заявленных музыкантов, все пять роликов живы и встраиваемы (oEmbed), каналы — официальные Topic-каналы исполнителя/пианиста. **Замены не требуются** — ни одна запись правилу не противоречит, слабой среди пяти нет.

Найдено два расхождения — оба **сквозные по всему циклу Winterreise** (проверено по 911/1, /2, /4, /5 — та же пятёрка с теми же годами), а не специфичные для этой песни, поэтому предлагаю их пользователю на уровне цикла, а не правлю точечно (правило прямо запрещает потоку пересматривать Winterreise и запрещает мне редактировать `performances.json`):

1. **Год Quasthoff — Spencer, вероятно, 1998, а не 1997** (см. §1) — стоит перепроверить и поправить по всем 24 песням цикла разом, если подтвердится независимо.
2. **Порядок пятёрки не соответствует букве правила «строгая иерархия приоритетов»** этого проекта (`docs/rules/youtube-performances.md`): Квасthoff — верно на 1-м месте, но дальше должно идти Фишер-Дискау (приоритет №2), затем старые мастера (Хоттер и Андерс — оба в списке приоритетных, между собой по качеству/дате), и только в конце — современная запись (Маттеи). Сейчас порядок: Квасthoff, **Маттеи**, Фишер-Дискау, Андерс, Хоттер — современная запись стоит на 2-м месте, старые мастера — в конце. Это, по-видимому, унаследованный от референса порядок (там своя логика ранжирования, не «иерархия приоритетов» этого проекта). Возможная целевая последовательность: Quasthoff → Fischer-Dieskau → Hotter → Anders → Mattei. Это тоже вопрос цикла целиком, не одной песни — публиковать точечно для 911/3 значило бы разойтись с остальными 23 песнями цикла.

Обе находки — не «запись не годится», а вопрос метаданных/порядка на уровне всего цикла; **записей на замену не предлагаю**.
