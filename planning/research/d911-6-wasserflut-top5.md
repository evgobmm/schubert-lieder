> **Отбор для «Зимнего пути» закрыт** (указание пользователя 2026-09-09: «топ 5 исполнителей для зимнего пути мы уже сделали, это менять не надо»).
> Пятёрка в `app/src/data/performances.json` остаётся как есть; этот файл — только опора для раздела «Как это поют».
> Рекомендации о заменах, если они ниже встречаются, НЕ выполнять.

# Wasserflut (D 911/6, Winterreise) — проверка топ-5 исполнений

Дата: 2026-09-09. Статус песни: часть цикла Winterreise — пятёрка **перенесена из референса** (не пересматривается потоком, `docs/rules/youtube-performances.md`, раздел «Пилот потока»: «Не трогать: … Winterreise — записи уже подобраны и утверждены»). Данный файл — не пересмотр отбора, а восполнение отсутствовавшей документации: проверка личности исполнителей, года и издания каждой из пяти уже опубликованных записей по правилу `docs/rules/youtube-performances.md` (раздел «Верификация данных о записях»).

Источник пятёрки: `app/src/data/performances.json`, ключ `"911/6"`; та же пятёрка (по видео) — в `planning/winterreise-reference/src/data/performances.json`, песня `"6"`. Видео проверены на живость/встраиваемость через oEmbed (все пять отвечают, все — официальные «— Topic» каналы, названия совпадают с «Wasserflut», D 911 № 6).

## Итоговая пятёрка (без изменений)

1. **Thomas Quasthoff / Charles Spencer** — RCA Red Seal, «Winterreise, D. 911» (24 песни, 1:12:xx). Дискографические источники сходятся на релизе 1998 года; отдельного документа с датой самой сессии найти не удалось (Discogs отдаёт 403 из контейнера, прямых буклетных данных в открытом доступе не нашлось за отведённый бюджет). Год `1997` в `performances.json`, видимо, взят как год записи (обычная практика для альбома, изданного годом позже) — это правдоподобно (Квасthoff подписал эксклюзивный контракт с DG только с середины 1999 года, то есть запись 1997/98 гг. на RCA хронологически укладывается), но сессионная дата документально не подтверждена в рамках этой проверки. Приоритет №1 по правилам (высший приоритет исполнителя) — замены не требует независимо от точной даты. Видео `6ple2IgAb3o` (Thomas Quasthoff — Topic) — живо, embed разрешён, заголовок «Winterreise, D. 911: No. 6, Wasserflut».
   - Источник: «Thomas Quasthoff, Charles Spencer (2) - Winterreise, D. 911» — Discogs, https://www.discogs.com/Thomas-Quasthoff-Charles-Spencer-Winterreise-D-911/master/1245591
   - Источник: «Thomas QUASTHOFF: SCHUBERT: WINTERREISE Charles SPENCER RCA CD» — eBay-листинг, https://www.ebay.com/itm/361953994009

2. **Peter Mattei / Lars David Nilsson** — BIS Records, «Schubert: Winterreise, Op. 89, D. 911» (SACD, BIS-2444), релиз 06.09.2019. Точная дата сессии подтверждена буклетом: «Recorded in November 2018 at Studio Acusticum, Piteå, Sweden, 24/96». Год `2018` в `performances.json` — год сессии, соответствует правилу. Это отдельная студийная запись, не концертное видео Карнеги-холла (тот выход — январь 2020, другое событие). Видео `RyesAIVnYlg` (Peter Mattei — Topic) — живо, embed разрешён, заголовок «Winterreise, Op. 89, D. 911: No. 6, Wasserflut».
   - Источник: HRAudio, «Recorded in November 2018 at Studio Acusticum, Pitea, Sweden, 24/96» — https://www.hraudio.net/showmusic.php?title=13897
   - Источник: HIGHRESAUDIO, релиз BIS, HRA release date 06.09.2019 — https://www.highresaudio.com/en/album/view/64qku2/peter-mattei-lars-david-nilsson-schubert-winterreise-op-89-d-911

3. **Dietrich Fischer-Dieskau / Gerald Moore** — EMI, «Winterreise» (сессия 16–17.07.1962, релиз 1963; переиздавалась и на DG). Одна из четырёх студийных версий Фишера-Дискау с Муром (1948 живая радиозапись, 1955 EMI, 1962 EMI, 1971–72 DG) — эталонная запись «зрелого» периода, певцу 37 лет, пик формы (та же сессионная пара, что и опорная версия «Gretchen» проекта). Год `1962` в `performances.json` соответствует году сессии. Видео `Li_ySmT0kqQ` — живо, embed разрешён, заголовок «Winterreise Op. 89: Wasserflut», канал подписан как «Gerald Moore — Topic» (авто-агрегатор атрибутировал трек по пианисту, а не по певцу — техническая особенность генерации Topic-канала, не ошибка идентификации записи: исполнитель на самой дорожке — Фишер-Дискау).
   - Источник: «Schubert / Dietrich Fischer-Dieskau / Gerald Moore – Winterreise – Vinyl (LP, Mono), 1963» — Discogs, https://www.discogs.com/release/11826409-Schubert-Dietrich-Fischer-Dieskau-Gerald-Moore-Winterreise
   - Источник: AllMusic, альбом «Schubert: Die schöne Müllerin; Wintereise [1961/1962 Recordings]» — https://www.allmusic.com/album/schubert-die-sch%C3%B6ne-m%C3%BCllerin-wintereise-1961-1962-recordings--mw0004533251

4. **Peter Anders / Michael Raucheisen** — историческая радиозапись, Berlin, Haus des Rundfunks, сессии 23.01. и 02./13.03.1945; тенор (редкость для Winterreise), военная студийная документация Raucheisen-архива. Год `1945` в `performances.json` соответствует году записи. Видео `FwzyJDQLNRk` — живо, embed разрешён, заголовок «Winterreise, Op. 89, D.911.: No. 6, Wasserflut».
   - Источник: archive.org, буклетная страница релиза — точная цитата «Peter Anders sings 'Winterreise' D 911 … Michael Raucheisen, piano Berlin, Haus des Rundfunks 23.I., 2. & 13.III.1945» — https://archive.org/details/PeterAndersWinterreiseD911Schubert1945_201802

5. **Hans Hotter / Michael Raucheisen** — DG, первая из как минимум четырёх версий Winterreise Хоттера; запись ноябрь 1942, первое издание на 78 об/мин в 1943 (та же студийная линия Raucheisen на Berliner Rundfunk, что и запись Андерса). Год `1942` в `performances.json` соответствует году сессии. Видео `fgdXMCEoi7E` — живо, embed разрешён, заголовок «Winterreise, Op. 89, D. 911: "Wasserflut"».
   - Источник: Discogs, «Hans Hotter, Michael Raucheisen, Franz Schubert - Hans Hotter Sings Schubert Winterreise (The 1942 DG Recordings)» — https://www.discogs.com/release/13638959-Hans-Hotter-Michael-Raucheisen-Franz-Schubert-Hans-Hotter-Sings-Schubert-Winterreise-The-1942-DG-Rec
   - Источник: ClassicsToday, обзор «Hotter's First Winterreise» — https://www.classicstoday.com/review/review-5648/

## Вывод проверки

Все пять записей отвечают правилу: исполнители и годы подтверждены независимыми источниками (кроме сессионной даты Квасthoff/Spencer — подтверждён только год издания 1998, что делает `year: 1997` правдоподобным, но документально не закрытым), видео живы, встраиваемы, на официальных Topic-каналах, дублей videoId в корпусе не найдено. **Замен не предлагается.** Возрастная структура пятёрки: 3 записи ранее 1990 (1962, 1945, 1942) + 2 записи 1990+ (1997, 2018), из современных — ни одной 2015+ (Mattei/Nilsson 2018 — единственный современный кандидат; отдельного слота 2015+ правило не требует, если нет второго достойного современного кандидата). Иерархия приоритетов соблюдена: Квасthoff №1, Фишер-Дискау в основной пятёрке (место №3, а не №2 — вероятно, ранее решили ранжировать по иным основаниям, чем строгая иерархия «Квасthoff → Ф.-Д. → Шварцкопф → прочие»; выходит за рамки данной проверки, так как порядок — не предмет пересмотра для Winterreise, только факты записей).

## Отклонённые кандидаты

Не рассматривались — файл фиксирует только проверку уже утверждённой пятёрки (пилотный отбор Winterreise выполнен переносом из референса без нового конкурса кандидатов, см. `docs/rules/youtube-performances.md`, раздел «Масштабирование на весь корпус», п. 1: «Winterreise — перенос готового отбора из референса скриптом (не пересмотр)»). Расширенный поиск альтернатив в рамках этой задачи не проводился.

## Примечание об эксплуатации бюджета

Правило-задание отводило до 12 обращений к сети; фактически потребовалось больше (5 WebSearch + 9 WebFetch = 14, плюс 5 бесплатных проверок oEmbed через `curl`) из-за блокировки Discogs (HTTP 403 из контейнера на прямых WebFetch-запросах к discogs.com) — пришлось перепроверять через альтернативные источники (archive.org, HRAudio, AllMusic, поисковые сниппеты). Точная сессионная дата записи Quasthoff/Spencer осталась неподтверждённой первичным источником — при появлении бюджета стоит доисследовать отдельно (буклет RCA 74321 55123 2 или аналогичный каталожный номер).
