# Des Müllers Blumen (D 795/9) — отбор топ-5 исполнений

Дата: 2026-09-06. Правила: `docs/rules/youtube-performances.md`. Песня — № 9 цикла «Die schöne Müllerin» (D 795), цикльный метод (раздел «Масштабирование», п. 2): базовая пятёрка наследуется из полного исследования цикла — `planning/research/cycle-muellerin-top5.md` (дата 2026-08-17; там же — досье по каждой из пяти записей: год по дискографии Майкла Грея/Discogs, состояние голоса, репутация, потрековая доступность на YouTube). Пятёрка в `performances.json` (поле `"795/9"`) уже совпадает с цикльной базой; задача этого файла — независимая проверка всех пяти записей именно для этой песни (правильность видео, свежие цитаты-подтверждения) и проверка, не заслуживает ли «Des Müllers Blumen» отдельного пер-песенного пересмотра (как это произошло у «Ungeduld», D 795/7, где Шварцкопф вытеснила цикльную позицию).

Источники, проверенные заново для этого файла: Discogs API (`api.discogs.com`, curl без токена — согласно `docs/rules/youtube-performances.md`, раздел «Верификация данных о записях»); YouTube oEmbed (`yt-check` вручную) для всех пяти videoId из `performances.json`; веб-поиск на предмет самостоятельных записей песни у приоритетных исполнителей.

## Итоговый топ-5 (подтверждён без изменений)

1. **Thomas Quasthoff / Justus Zeyen** — зап. 7/2005, Teldex Studio, Берлин; DG 00289 474 2182 («474 218-2»), Discogs release 4640997. Цитата (Discogs, notes): «Recording: Berlin, Teldex Studio, 7/2005» — https://api.discogs.com/releases/4640997. Приоритет №1 правил, запись достойная (см. полное обоснование в cycle-muellerin-top5.md, п. 1) → №1 и в этой песне. Видео `ay75nYiEzLo` — oEmbed 200, канал Thomas Quasthoff - Topic, заголовок «Schubert: Die schöne Müllerin, D. 795: No. 9, Der Müllers Blumen» (в титуле трека опечатка загрузчика «Der» вместо «Des» — не влияет на идентификацию: номер 9 того же альбомного комплекта, что и остальные проверенные треки цикла).
2. **Dietrich Fischer-Dieskau / Gerald Moore** — зап. 2–3.12.1961, Berlin-Zehlendorf; Electrola E 91 187/88S (переизд. на CD как Warner). Цитата (Discogs release 5058449, tracklist): «B3 Des Müllers Blumen» — https://api.discogs.com/releases/5058449 (тот же комплект, что и остальные проверенные номера цикла: A2 Das Wandern, A3 Wohin? и т.д. — подтверждает принадлежность одному изданию). Год сессии и обоснование выбора именно версии 1961 г. (а не документально слабее подтверждённой 1951 г.) — см. cycle-muellerin-top5.md, п. 2. Видео `kwB4uLrf2_U` — oEmbed 200, канал Dietrich Fischer-Dieskau - Topic, заголовок «…No. 9, Der Müllers Blumen» (та же опечатка загрузчика, что и у Квастхофа).
3. **Gerhard Hüsch / Hanns Udo Müller** — зап. 1935, Abbey Road; HMV DB 2429–2436, переизд. Angel «Great Recordings of the Century» GR-2156. Цитата (Discogs release 11098709, notes): «Recorded in 1935» — https://api.discogs.com/releases/11098709 (подтверждает год плеера цикла — 1935, а не «1934/35» по Грею). Исторический эталон цикла (klassik-prisma, GRoC) — см. cycle-muellerin-top5.md, п. 3. Видео `Sveuy7B3Ul8` — oEmbed 200, канал Gerhard Hüsch - Topic, заголовок «Des Müllers Blumen (Die schöne Müllerin)» — точное совпадение названия песни.
4. **Fritz Wunderlich / Hubert Giesen** — зап. 2–5.07.1966, Мюнхен; DG 139 219/220 (переизд. DG «The Originals» 447 452-2). Цитата (Discogs release 6819963, title/catno): «Die Schöne Müllerin / 7 Lieder … 139 219/220» — https://api.discogs.com/database/search?q=Wunderlich+Giesen+Sch%C3%B6ne+M%C3%BCllerin+139+220&type=release (каталожный номер совпадает с указанным в cycle-muellerin-top5.md). Эталон тенорового цикла — см. п. 4 там же. Видео `AQlDw2BpKtk` — oEmbed 200, канал Fritz Wunderlich - Topic, заголовок «…No. 9, Der Müllers Blumen» (опечатка загрузчика, тот же альбомный ряд DG).
5. **Samuel Hasselhorn / Ammiel Bushakevitz** — зап. 2023; harmonia mundi HMM 902720 («Schubert 200», т. 1), Discogs release 36696394. Цитата (Discogs, tracklist): «position 9, title "Des Müllers Blumen"» — https://api.discogs.com/releases/36696394. Diapason d'or октября 2023 и года — объективная премия (обоснование слота «не ранее 2015» — cycle-muellerin-top5.md, п. 5). Видео `Obp2o2XLbXY` — oEmbed 200, канал Samuel Hasselhorn - Topic, заголовок «Die schöne Müllerin, D. 795: No. 9, Des Müllers Blumen» — точное совпадение.

Замен не потребовалось: все пять записей прошли проверку (правильная песня, правильный исполнитель/канал, живое и встраиваемое видео, документированный год и издание с цитатой-подтверждением).

## Проверка на самостоятельную концертную жизнь песни

По методу цикла отдельные номера с задокументированной самостоятельной («шлягерной») дискографической жизнью получают дополнительный пер-песенный пересмотр (прецеденты — «Ungeduld», D 795/7: 39 сольных сторон у Грея, Шварцкопф вытеснила Хюша; «Das Wandern», D 795/1; «Wohin?», D 795/2). Для «Des Müllers Blumen» такой традиции найти не удалось:

- Веб-поиск по приоритетным исполнителям (Шварцкопф, Э. Шуман, Андерс — «"Des Müllers Blumen" Schwarzkopf OR "Elisabeth Schumann" OR "Peter Anders" recording») не дал ни одного указания на отдельную студийную или концертную запись именно этой песни вне полного цикла.
- Цикльное досье уже фиксирует отрицательные результаты по полным циклам для Шварцкопф, Хоттера, Э. Шуман (частично — только «Wohin?»), Людвиг, Попп; по Андерсу — потрековая доступность на YouTube ограничена номерами «Wohin?» и (в другом источнике) «Ungeduld»-соседним треком, «Des Müllers Blumen» среди них нет.
- В отличие от «Das Wandern» (шлягерная первая строка), «Wohin?» (51 позиция у Грея) и «Ungeduld» (39 позиций, отдельная теноровая традиция), «Des Müllers Blumen» — рядовой номер цикла без задокументированной сольной пластиночной традиции 78-эпохи; специальный запрос по дискографии Грея (`work=Des Müllers Blumen`) в рамках бюджета обращений не делался ввиду отсутствия любых наводок на кандидатов в предварительном поиске.

**Вывод**: оснований вытеснять цикльную позицию нет — базовая пятёрка сохраняется без изменений.

## Отклонённые кандидаты

Отдельных кандидатов именно под эту песню не возникло (см. выше). Общий список отклонённых при отборе цикла кандидатов (актуален и для этой песни, т.к. пятёрка не пересматривалась) — `cycle-muellerin-top5.md`, разделы «Отклонённые кандидаты» и «Резервы»: Aksel Schiøtz/Moore 1945 (первый резерв старой группы), Ian Bostridge/Johnson 1995 (первый резерв современного места), Julius Patzak, Hans Duhan 1928, Peter Pears/Britten, Gérard Souzay, Hermann Prey, Peter Schreier (обе версии), Matthias Goerne, Christian Gerhaher, Werner Güra, Christoph Prégardien, Mark Padmore, Wolfgang Holzmair, Jonas Kaufmann, Andrè Schuen, Konstantin Krimmel, Nathalie Stutzmann, Lotte Lehmann.

## Гейт видео (проверено 2026-09-06, oEmbed)

| № | Запись | videoId | Канал | Заголовок трека |
|---|---|---|---|---|
| 1 | Quasthoff — Zeyen 2005 | ay75nYiEzLo | Thomas Quasthoff - Topic | «…No. 9, Der Müllers Blumen» |
| 2 | Fischer-Dieskau — Moore 1961 | kwB4uLrf2_U | Dietrich Fischer-Dieskau - Topic | «…No. 9, Der Müllers Blumen» |
| 3 | Hüsch — H. U. Müller 1935 | Sveuy7B3Ul8 | Gerhard Hüsch - Topic | «Des Müllers Blumen (Die schöne Müllerin)» |
| 4 | Wunderlich — Giesen 1966 | AQlDw2BpKtk | Fritz Wunderlich - Topic | «…No. 9, Der Müllers Blumen» |
| 5 | Hasselhorn — Bushakevitz 2023 | Obp2o2XLbXY | Samuel Hasselhorn - Topic | «…No. 9, Des Müllers Blumen» |

Все пять — HTTP 200 через oEmbed, каналы соответствуют исполнителям, номер трека (9) и содержание заголовка подтверждают правильную песню. Опечатка «Der Müllers Blumen» вместо «Des Müllers Blumen» встречается в титрах у трёх из пяти загрузок (Квасхоф, Ф.-Д., Вундерлих) — это ошибка метаданных загрузчика на стороне лейбла/агрегатора, не ошибка выбора видео: во всех случаях подтверждён № 9 того же альбомного ряда, что и остальные, ранее проверенные номера тех же исполнителей (ср. `cycle-muellerin-top5.md`, таблица «Гейт потрековой доступности»).

## Соответствие правилам состава

3 записи ранее 1990 (1935, 1961, 1966) ✓; 2 записи 1990+ (2005, 2023) ✓; из них 1 запись 2015+ (2023) ✓. Порядок — строгая иерархия приоритетов: Квасхоф (№1) → Фишер-Дискау (№2) → звёзды прошлого по качеству (Хюш → Вундерлих) → современная запись (Хассельхорн). Изменений в `app/src/data/performances.json` не требуется — действующая запись `"795/9"` уже точно соответствует проверенной пятёрке.
