> **Отбор для «Зимнего пути» закрыт** (указание пользователя 2026-09-09: «топ 5 исполнителей для зимнего пути мы уже сделали, это менять не надо»).
> Пятёрка в `app/src/data/performances.json` остаётся как есть; этот файл — только опора для раздела «Как это поют».
> Рекомендации о заменах, если они ниже встречаются, НЕ выполнять.

# Erstarrung (D 911/4, Winterreise) — проверка уже отобранных исполнений

Дата: 2026-09-09. Правила: `docs/rules/youtube-performances.md`. Пятёрка не отбиралась заново — она уже стояла в
`app/src/data/performances.json` (ключ `"911/4"`) и опирается на неё же весь пословный тайминг песни (`app/src/data/timings/d911-4-*.json`,
маршрут — `planning/research/d911-4-erstarrung-route.md`, построен по звуку именно этих пяти записей). Задача этого файла —
задокументировать происхождение пятёрки и сверить её с правилом отбора, а не пересмотреть состав: правило прямо выводит
Winterreise из-под ревизии потока («записи уже подобраны и утверждены; поток их не пересматривает»).

Метод источников — Discogs API (`api.discogs.com`, без токена; веб-интерфейс Discogs блокирует прямой заход) и прямой веб-поиск
по буклетам/каталогам изданий, как требует `docs/rules/youtube-performances.md` («Верификация данных о записях»). Все пять
videoId проверены живыми через oEmbed YouTube и совпадают по названию и каналу-исполнителю с «Erstarrung» из D 911 — подмены
песни или singера нет ни у одной записи.

## Итоговый топ-5 (публикация без изменений состава)

1. **Thomas Quasthoff / Charles Spencer** — RCA Red Seal 09026 63147 2, студия ван Гест, Зандхаузен. Discogs: «Recorded February
   18-22, 1998, at Studio van Geest, Sandhausen» — сессия **1998 года**, не 1997, как стоит в `performances.json`
   ([discogs.com/release/8752021](https://www.discogs.com/release/8752021-Schubert-Thomas-Quasthoff-Charles-Spencer-Winterreise)).
   Высший приоритет по правилам (Квастхоф — п. 1 списка приоритетов), запись входит в его единственный студийный Winterreise.
   Видео `XPYoG4TWLY0` (Quasthoff Topic) — название и канал совпадают.
2. **Peter Mattei / Lars David Nilsson** — BIS-2444 (SACD), студия Studio Acusticum, Питео, Швеция, домашний город Маттеи.
   hraudio.net (буклет BIS): «Recorded in November 2018 at Studio Acusticum, Pitea, Sweden, 24/96» —
   [hraudio.net/showmusic.php?title=13897](https://www.hraudio.net/showmusic.php?title=13897); релиз подтверждён Discogs
   (release 20939530, BIS, 2019). Год **2018** в `performances.json` верен. Видео `yiAyDhUZsXY` (Mattei Topic).
3. **Dietrich Fischer-Dieskau / Gerald Moore** — EMI/HMV, студийная сессия. Discogs (мастер второй из трёх студийных
   Ф.-Д./Мура-циклов): «Recorded July 16-17, 1962. EMI 1962 Stereo (℗ 1963) recording. This release groups the 2nd of three
   (1955, 1962, 1971) different recordings» —
   [discogs.com/master/1304876](https://www.discogs.com/master/1304876-Schubert-Dietrich-Fischer-Dieskau-Gerald-Moore-Die-Winterreise).
   Год **1962** в `performances.json` верен; лейбл — EMI/HMV (ASDS 551), не DG, но поле year этого не фиксирует. Приоритет
   №2 по правилам. Видео `U5flDePTl6g` (подписан по пианисту — Gerald Moore Topic; певец и цикл в названии совпадают).
4. **Peter Anders / Michael Raucheisen** — радиозаписи Reichsrundfunk, Берлин, последние месяцы войны. Титул архивной копии
   на Internet Archive называет три даты сессий: «WINTERREISE — Peter Anders, Michael Raucheisen (23 gennaio e 2, 13 marzo 1945)» —
   [archive.org/details/PeterAndersWinterreiseD911Schubert1945_201802](https://archive.org/details/PeterAndersWinterreiseD911Schubert1945_201802);
   переиздания DG 459 009, Tahra, Myto, Eterna 8 20 193-194 (Discogs release 3489468, помета «Historische Aufnahme»,
   [discogs.com/release/3489468](https://www.discogs.com/release/3489468-Franz-Schubert-Peter-Anders-2-Michael-Raucheisen-Die-Winterreise)).
   Год **1945** в `performances.json` верен (23 января и 2/13 марта 1945 — все три сессии дают этот год). Певец погиб в
   автокатастрофе в сентябре 1954-го, спада голоса к этой записи не было. Видео `BNKGNcTxn20` (Anders Topic).
   Уже задокументировано в проекте: `planning/research/schubert-singers.md`, строка 41.
5. **Hans Hotter / Michael Raucheisen** — радиозаписи для DG, Берлин, ноябрь 1942; первое издание — 78-е пластинки 1943 года.
   Каталог переиздания Music & Arts CD-1061: «Hans Hotter, baritone, with Michael Raucheisen, piano; from DG 78s, recorded
   November 1942» —
   [musicandarts.com/product/hotter-sings-winterreise](https://musicandarts.com/product/hotter-sings-winterreise/); критик
   Джозеф Горовиц в *The New York Times* (12.12.1999) о записи: «The most powerful Winterreise I know». Год **1942** в
   `performances.json` верен и точнее общего диапазона «1942–45?», который проект использует для отдельных песен из более
   широкого раухайзеновского корпуса Хоттера (D 397, D 700, D 907, D 626): здесь есть отдельное издание, посвящённое именно
   полному циклу Winterreise, с точным месяцем сессии. Видео `u52pyHOBdQI` (Hotter Topic).

## Расхождения с правилом — не устранены, требуют решения пользователя

- **Год Квастхофа**: `performances.json` содержит 1997, дискографический источник (Discogs, буклет RCA) даёт **1998**
  (сессия 18–22 февраля 1998, релиз октябрь 1998). Дата 1997 не подтвердилась ни одним источником. Правка не внесена —
  запрет менять `performances.json` в этой задаче; рекомендация: исправить год на 1998.
- **Порядок пятёрки нарушает иерархию приоритетов** (`docs/rules/youtube-performances.md`, «Порядок записей в топ-5»):
  правило требует Квастхоф → Фишер-Дискау → Шварцкопф → прочие старые мастера → современные, порядок внутри групп — по
  качеству, а не хронология. Текущий порядок в файле — Квастхоф, Маттеи, Фишер-Дискау, Андерс, Хоттер — ставит современного
  Маттеи (позиция 2) перед Фишер-Дискау (приоритет №2 после Квастхофа) и перед старыми мастерами Андерсом и Хоттером.
  Корректный по правилу порядок: **Quasthoff → Fischer-Dieskau → Anders/Hotter (старые мастера, между собой — без
  оснований менять их взаимный порядок) → Mattei** (единственный современный, закрывает слот «после 2015»). Возрастная
  структура при этом сохраняется: 3 записи до 1990 (1962, 1945, 1942) и 2 записи 1990+ (1998, 2018), из них одна 2015+
  (2018) — оба требования правила выполняются независимо от того, в каком порядке расставлены сами пять записей.
  Замена состава не нужна — только перестановка позиций №2 и №3–5 плюс исправление года у Квастхофа.

## Итог по идентичности записей

Ни одна из пяти записей не подлежит замене: все пять — подлинные исполнения именно «Erstarrung» (D 911/4) названными
исполнителями, oEmbed подтверждает живые официальные Topic-загрузки с совпадающими названиями. `n_records = 5`,
`replaced = 0` — расхождения найдены только в годе и в порядке следования, не в составе.
