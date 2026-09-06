# Mein! (D 795/11) — отбор топ-5 исполнений

Дата: 2026-09-06. Правила: `docs/rules/youtube-performances.md`. Песня — № 11 цикла «Die schöne Müllerin» (D 795), цикльный метод (раздел «Масштабирование», п. 2): базовая пятёрка наследуется из полного исследования цикла — `planning/research/cycle-muellerin-top5.md` (дата 2026-08-17; там же — досье по каждой из пяти записей: год по дискографии Майкла Грея/Discogs, состояние голоса, репутация, потрековая доступность на YouTube). Пятёрка в `performances.json` (поле `"795/11"`) совпадает с цикльной базой; задача этого файла — независимая проверка всех пяти записей именно для этой песни (правильность видео, происхождение конкретной загрузки, свежие цитаты-подтверждения) и проверка, не заслуживает ли «Mein!» отдельного пер-песенного пересмотра.

Источники, проверенные заново для этого файла: полные метаданные YouTube-видео (`yt-dlp -j`, поле `description` — auto-generated Topic-загрузки прямо называют поставщика-дистрибьютора, лейбл, альбом, дату «Released on»; надёжнее oEmbed, который отдаёт только название/канал) для всех пяти videoId из `performances.json`; oEmbed (`planning/youtube/scripts/yt-check.js`) — живость и канал; Discogs API (`api.discogs.com`, curl без токена) для сессионных дат по альбомам (те же релизы, что уже цитировались в `d795-6-der-neugierige-top5.md` и `d795-10-tranenregen-top5.md` — цитаты сверены заново, совпадают); дискография Майкла Грея (classical-discography.org, `search2.php`, composer=Schubert, work=«Mein») — на предмет самостоятельной сольной концертной жизни песни.

## Итоговый топ-5 (с учётом замены)

1. **Thomas Quasthoff / Justus Zeyen** — зап. 7/2005, Teldex Studio, Берлин; DG 00289 474 2182, Discogs release 4640997. Цитата (Discogs, notes): «Recording: Berlin, Teldex Studio, 7/2005» — https://api.discogs.com/releases/4640997. Приоритет №1 правил, запись достойная (полное обоснование — `cycle-muellerin-top5.md`, п. 1) → №1 и в этой песне. **Проверено:** видео `zKYcoO2mvWo` — «Provided to YouTube by Universal Music Group · Schubert: Die schöne Müllerin, D. 795: No. 11, Mein! · Thomas Quasthoff · Justus Zeyen · Schubert: Die schöne Müllerin · ℗ 2005 Deutsche Grammophon GmbH, Berlin» — https://www.youtube.com/watch?v=zKYcoO2mvWo ; канал «Thomas Quasthoff - Topic» (oEmbed 200); без пометки «(Live)» — не перепутана с лайвом Вербье-2023 (Emanuel Ax), лежащим на том же канале.
2. **Dietrich Fischer-Dieskau / Gerald Moore** — сессия 2–4.XII.1961, Gemeindehaus, Berlin-Zehlendorf; Electrola/EMI, ныне Warner Classics, Discogs release 3325573. Цитата (Discogs, notes): «Recorded 2-4.XII.1961, Gemeindehaus, Berlin-Zehlendorf» — https://api.discogs.com/releases/3325573. Обоснование выбора именно версии 1961 г. (пик голоса + официальная потрековая доступность; более ранняя версия 1951 г. официальной загрузки не имеет) — `cycle-muellerin-top5.md`, п. 2.
   **Замена видео нужна.** Текущий `gUmIqogRF8w` из `performances.json` при проверке метаданных (`yt-dlp -j`) оказался НЕ официальным изданием: «Provided to YouTube by Believe SAS · Schubert: La belle meunière (Stereo Version) · ℗ The Restoration Project · Released on: 1962-01-01» — https://www.youtube.com/watch?v=gUmIqogRF8w — тот же «серый» лейбл-агрегатор (Believe SAS / The Restoration Project), что уже отклонён правилами для этой же связки в D 795/6 и D 795/10. Сама запись определена верно (стерео-сессия 1961 г.), но канал распространения не тот. Найдена официальная альтернатива на том же Topic-канале: `1EHhQjtBFqM` — «Provided to YouTube by Warner Classics · Die schöne Müllerin, Op. 25, D. 795: No. 11, Mein! · Dietrich Fischer-Dieskau · Gerald Moore · Schubert: Die schöne Müllerin, D. 795 · ℗ A Warner Classics release, ℗ 1962, 1997 Parlophone Records Limited» — https://www.youtube.com/watch?v=1EHhQjtBFqM — тот же ℗-штамп «1962, 1997 Parlophone» и тот же формат титула «Op. 25, D. 795: No. …», что и у эталонных загрузок остальных песен цикла (напр. D 795/1 `AmKXOPiqjCU`, D 795/6 `5MyP7pPIbsM`, D 795/10 `aI6CoAgkJeQ`). oEmbed `1EHhQjtBFqM`: 200, канал Dietrich Fischer-Dieskau - Topic. **Рекомендация: заменить `gUmIqogRF8w` → `1EHhQjtBFqM`** — исполнитель, год и издание те же, происхождение официальное вместо агрегаторского.
3. **Gerhard Hüsch / Hanns Udo Müller** — зап. 1935, Abbey Road (Грей: id 74340 — 31.01.1935, id 56255 — 02.02.1935, id 53828 — 22.03.1935; через `cycle-muellerin-top5.md`, п. 3); HMV DB 2429–2436, каталожный номер именно «Mein!» — DB2433 (Грей id 56257, дискография песни — см. ниже). Переиздание Preiser Records. **Проверено:** видео `Uo9SOoq3kEM` — «Provided to YouTube by NAXOS of America · Die schöne Müllerin, Op. 25, D. 795: Mein! · Gerhard Husch · Hanns Udo Muller · Schubert, F.: Schone Mullerin (Die) / Beethoven, L. Van: An Die Ferne Geliebte · ℗ 2000 haenssler CLASSIC» — https://www.youtube.com/watch?v=Uo9SOoq3kEM ; канал «Gerhard Hüsch - Topic» (oEmbed 200) — тот же альбомный ряд hänssler/Naxos, что уже используется для D 795/2 и D 795/6.
4. **Fritz Wunderlich / Hubert Giesen** — сессии 2–5.07.1966, Мюнхен; DG 139 220, Discogs release 6628286. Цитата (Discogs, notes): «Recordings: Munich, Residenz, Plenarsaal der Akadamie der Wissenschaften, 7/1966» — https://api.discogs.com/releases/6628286. Эталон тенорового цикла — `cycle-muellerin-top5.md`, п. 4. **Проверено:** видео `mf8cz6MjgDE` — «Provided to YouTube by Universal Music Group · Schubert: Die schöne Müllerin, D. 795: No. 11, Mein! · Fritz Wunderlich · Hubert Giesen · Fritz Wunderlich sings · ℗ 1966 Deutsche Grammophon GmbH, Berlin» — https://www.youtube.com/watch?v=mf8cz6MjgDE ; канал «Fritz Wunderlich - Topic» (oEmbed 200) — та же исходная запись ℗1966 DG (антологийный альбом-сборник «Fritz Wunderlich sings», изд. 1991), что уже используется для D 795/10.
5. **Samuel Hasselhorn / Ammiel Bushakevitz** — изд. 22.09.2023; harmonia mundi HMM 902720, «Schubert 200» т. 1, Discogs release 36696394 (title «Die Schöne Müllerin», label «Harmonia Mundi HMM 902720», год 2023 — https://api.discogs.com/releases/36696394). Diapason d'or октября 2023 и года — обоснование слота «не ранее 2015» (`cycle-muellerin-top5.md`, п. 5). **Проверено:** видео `NRvENk343sE` — «Provided to YouTube by PIAS · Die schöne Müllerin, D. 795: No. 11, Mein! · Samuel Hasselhorn · Ammiel Bushakevitz · Schubert: Die schöne Müllerin · ℗ harmonia mundi · Released on: 2023-09-22» — https://www.youtube.com/watch?v=NRvENk343sE ; канал «Samuel Hasselhorn - Topic» (oEmbed 200).

**Итог по видео**: 4 из 5 videoId подтверждены без изменений; для позиции №2 (Фишер-Дискау) рекомендована замена `gUmIqogRF8w` → `1EHhQjtBFqM` — исполнитель, год и издание те же, но текущая ссылка идёт через запрещённый правилами «серый» источник (Believe SAS «Restoration Project»), а официальная Warner Classics-загрузка того же трека уже существует на том же Topic-канале. Певец, пианист, год и состав пятёрки замене не подлежат.

## Проверка на самостоятельную концертную жизнь песни

По методу цикла отдельные номера с задокументированной самостоятельной («шлягерной») дискографической жизнью получают дополнительный пер-песенный пересмотр (прецеденты — «Ungeduld» 39 сторон/Шварцкопф вытеснила Хюша, «Das Wandern» 25, «Wohin?» 51). Для «Mein!» такая жизнь есть, но заметно скромнее.

Дискография Грея (composer=Schubert, work=«Mein») даёт **14 позиций** для «Mein!, D795, no. 11» (12 немецкоязычных + 2 франкоязычные, вне рассмотрения по правилам корпуса — https://www.classical-discography.org/search.php ). Из немецкоязычных:

- **DB2433** — Gerhard Hüsch/Hanns Udo Müller, 1935 (уже в пятёрке, №3).
- **DB21392** — Dietrich Fischer-Dieskau (сессия 1951 г., та же, что уже разобрана в `cycle-muellerin-top5.md`: официальной потрековой загрузки нет, слот №2 остаётся за 1961 г.).
- **DB6256** — Aksel Schiøtz, тенор; Gerald Moore, фортепиано — 5 ноября 1945, London, EMI Studio No. 3, Abbey Road (Грей id 57409) — сторона из его же полного цикла 1945 г., первый резерв «старой группы» на уровне всего цикла (не новая внецикльная запись).
- **UNISSUED** — Ernst Wolff, баритон и рояль (сам себе аккомпанирует) — 16 марта 1937, Columbia (Грей id 31244): фонограмма НЕ издана — публиковать нечего.
- **71784-D в сете M-615** — Lotte Lehmann, сопрано; Paul Ulanowsky, рояль — 22 июня 1942, Columbia (Грей id 76568) — номер из её сокращённой женской версии цикла; как и в цикльном отборе, вне пула (сокращённая запись).
- **4198-M в M-317** — Ernst Wolff, баритон и рояль — 6 января 1938, Columbia (Грей id 31286) — второй дубль того же артиста.
- **O-5121** — Franz Naval, тенор; August Pilz, рояль — октябрь 1909, Odéon (Грей id 46413) — акустическая архаика, вне уровня отбора.
- **90020** — Heinrich Rehkemper, баритон — Polydor, дата не установлена (Грей id 74068) — второй ряд эпохи 78 об/мин.
- **520488** — Günther Leib, баритон; Dieter Zechlin, рояль — январь 1963, Eterna (Грей id 270951) — тот же артист/лейбл, что уже фигурирует резервом по «Das Wandern» в `cycle-muellerin-top5.md»; уровня отбора не достигает.
- **HM 17 050** — Elly Ameling, сопрано; Jörg Demus, фортепиано (историческое) — сентябрь 1964, Вена, Palais Schönburg, Harmonia Mundi (Грей id 217468) — интересная концептуальная запись (женский голос + фортепиано эпохи), но вне приоритетного списка правил и без документированной репутации, перебивающей действующую пятёрку.
- **ES381** — Hans Duhan, баритон; Ferdinand Foll, рояль — 26 апреля 1928, HMV (Грей id 82652) — сторона из его же первой полной записи цикла 1928 г.; как и в цикльном отборе, историческая, не художественная ценность.

**Приоритетные певцы — отрицательный результат для этой песни.** Среди 12 немецкоязычных позиций нет ни Квастхофа (кроме цикла), ни Шварцкопф, ни Хоттера, ни Э. Шуман, ни Кристы Людвиг, ни Лючии Попп, ни Петера Андерса — как и на уровне всего цикла (`cycle-muellerin.dossier.json` → `priority_check`).

**Вывод**: 14 позиций — заметно меньше, чем у «шлягерных» номеров цикла (Wohin 51, Ungeduld 39, Das Wandern 25), и ни один найденный кандидат не превосходит текущую пятёрку по иерархии приоритетов или консенсусной репутации: два номера уже входят в пятёрку (Хюш, сессия Ф.-Д. 1951 разобрана и отклонена ранее), один неизданный, три — второй ряд эпохи 78 об./мин без приоритетного статуса, один — сокращённая запись Лемáн, один — историческая (Duhan), один — концептуальный, но некассовый (Амелинг/Демус на фортепиано). Оснований вытеснять цикльную позицию нет; состав пятёрки (певцы/год/издание) сохраняется без изменений — меняется только videoId у позиции №2 (см. выше).

## Отклонённые кандидаты

Специфичных для «Mein!» отклонённых кандидатов, помимо перечисленных выше (Wolff ×2, Lehmann, Naval, Rehkemper, Leib/Zechlin, Ameling/Demus, Duhan — все вне уровня отбора или вне приоритетного списка правил), не возникло. Общий список отклонённых при отборе цикла кандидатов (актуален и для этой песни) — `cycle-muellerin-top5.md`, разделы «Отклонённые кандидаты» и «Резервы»: Aksel Schiøtz/Moore 1945 (первый резерв старой группы), Ian Bostridge/Johnson 1995 (первый резерв современного места), Julius Patzak, Peter Pears/Britten, Gérard Souzay, Peter Schreier (обе версии), Matthias Goerne, Werner Güra, Christoph Prégardien, Mark Padmore, Wolfgang Holzmair, Jonas Kaufmann, Konstantin Krimmel, Nathalie Stutzmann.

## Гейт видео (проверено 2026-09-06, oEmbed + yt-dlp)

| № | Запись | videoId (в performances.json) | Канал | Поставщик / альбом (из description) | Статус |
|---|---|---|---|---|---|
| 1 | Quasthoff — Zeyen 2005 | zKYcoO2mvWo | Thomas Quasthoff - Topic | UMG, «Schubert: Die schöne Müllerin», ℗ 2005 DG | ОК |
| 2 | Fischer-Dieskau — Moore 1961 | ~~gUmIqogRF8w~~ → **1EHhQjtBFqM** (рекомендовано) | Dietrich Fischer-Dieskau - Topic | было: Believe SAS, «La belle meunière (Stereo Version)»; станет: Warner Classics, «Schubert: Die schöne Müllerin, D. 795», ℗ 1962/1997 Parlophone | ЗАМЕНА |
| 3 | Hüsch — H. U. Müller 1935 | Uo9SOoq3kEM | Gerhard Hüsch - Topic | NAXOS of America, «Schone Mullerin (Die) / An Die Ferne Geliebte», ℗ 2000 hänssler | ОК |
| 4 | Wunderlich — Giesen 1966 | mf8cz6MjgDE | Fritz Wunderlich - Topic | UMG, «Fritz Wunderlich sings», ℗ 1966 DG | ОК |
| 5 | Hasselhorn — Bushakevitz 2023 | NRvENk343sE | Samuel Hasselhorn - Topic | PIAS/harmonia mundi, «Schubert: Die schöne Müllerin», Released 2023-09-22 | ОК |

Все пять текущих videoId — HTTP 200 через oEmbed, каналы соответствуют исполнителям, заголовки и `description` подтверждают правильную песню (везде явно «Mein!», No. 11). Единственное расхождение с гигиеной ссылок — происхождение видео №2 через агрегатор Believe SAS вместо официального лейбла; исправление найдено на том же канале.

## Соответствие правилам состава

3 записи ранее 1990 (1935, 1961, 1966) ✓; 2 записи 1990+ (2005, 2023) ✓; из них 1 запись 2015+ (2023) ✓. Порядок — строгая иерархия приоритетов: Квастхоф (№1) → Фишер-Дискау (№2) → звёзды прошлого по качеству (Хюш → Вундерлих) → современная запись (Хассельхорн). Полностью совпадает с итоговой пятёркой цикла.

## Резервы (при выпадении видео)

1. Слот Ф.-Д.: DG-версия изд. 1972 — если выпадет Warner-ряд 1961 г. (см. `cycle-muellerin-top5.md`, «Резервы», п. 4).
2. Старая группа: Aksel Schiøtz — Gerald Moore, 1945 (HMV DB6256, Грей id 57409; из полного цикла, канал «Aksel Schiøtz - Topic» — videoId не проверен в этой сессии).
3. Слот Квастхофа/Хассельхорна — без изменений относительно цикльного отбора (см. `cycle-muellerin-top5.md`, «Резервы»).

## Требуемое изменение в `app/src/data/performances.json`

Поле `"795/11"`, запись №2: videoId `gUmIqogRF8w` → `1EHhQjtBFqM` (певец, пианист, год, name — без изменений: «Fischer-Dieskau — Moore», 1961). Правка не внесена этим файлом-исследованием по запрету потока — вносить отдельным мелким коммитом по обычному конвейеру публикации.

## Источники

- `docs/rules/youtube-performances.md` — правила отбора и требование не использовать «серые» Topic-агрегаторы как источник кредитов.
- `planning/research/cycle-muellerin-top5.md` и `planning/youtube/data/cycle-muellerin.dossier.json` — исходный цикльный отбор (2026-08-17): даты сессий, Discogs-релизы, приоритетная проверка.
- `planning/research/d795-6-der-neugierige-top5.md`, `planning/research/d795-10-tranenregen-top5.md` — прецеденты того же паттерна замены (Believe SAS/The Restoration Project → официальная загрузка Warner Classics на том же Topic-канале) и формат пер-песенной проверки.
- classical-discography.org (Майкл Грей), поиск composer=Schubert, work=«Mein» (14 позиций для «Mein!, D795, no. 11») — https://www.classical-discography.org/search.php ; отдельные карточки: id 56257 (Hüsch DB2433), id 57290 (Fischer-Dieskau DB21392, сессия 1951), id 57409 (Schiøtz DB6256), id 31244 и 31286 (Wolff, unissued/1938), id 76568 (Lehmann), id 46413 (Naval), id 74068 (Rehkemper), id 270951 (Leib/Zechlin), id 217468 (Ameling/Demus), id 82652 (Duhan).
- Discogs API (`api.discogs.com/releases/…`, без токена): 4640997 (Quasthoff, «Recording: Berlin, Teldex Studio, 7/2005»), 3325573 (Fischer-Dieskau, «Recorded 2-4.XII.1961, Gemeindehaus, Berlin-Zehlendorf»), 6628286 (Wunderlich, «Recordings: Munich, Residenz, Plenarsaal der Akadamie der Wissenschaften, 7/1966»), 36696394 (Hasselhorn, «Die Schöne Müllerin», Harmonia Mundi HMM 902720, 2023).
- Метаданные YouTube (`yt-dlp -j`, поле description — «Provided to YouTube by …», ℗-строка правообладателя) для всех пяти итоговых видео и рекомендованной замены Фишера-Дискау.
- YouTube oEmbed (`https://www.youtube.com/oembed?url=...&format=json`, `planning/youtube/scripts/yt-check.js`) — живость и канал всех шести проверенных видео (пять текущих + одна замена), проверено 2026-09-06.
