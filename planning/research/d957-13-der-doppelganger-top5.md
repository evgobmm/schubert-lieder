# Der Doppelgänger (D 957/13) — отбор топ-5 исполнений

Дата: 2026-09-07. Ярус: famous — часть цикла «Schwanengesang» (D 957), песня с самостоятельной концертной и граммофонной традицией (басовая декламация, отдельные стороны 78 об. с 1900-х). Правила: `docs/rules/youtube-performances.md`.

**Происхождение пятёрки.** Отбор уже был выполнен цикльным методом и задокументирован в `planning/research/cycle-schwanengesang-top5.md`, раздел «D 957/13 „Der Doppelgänger“ — пер-песенная проверка» (2026-08-17): база — дискография Майкла Грея (50 позиций по работе «Doppelg»), Discogs API, MusicBrainz, реестр альбомов проекта, `singers-digest.md`, потрековая проверка через yt-dlp и oEmbed. Итог того исследования — две замены против единой цикльной пятёрки (слоты № 2 и № 4) — совпадает с текущим содержимым `app/src/data/performances.json` ("957/13"). Настоящий файл — независимая переверификация каждой из пяти опубликованных записей по первичным источникам (Discogs, Hyperion, DAHR) с дословными цитатами и URL, плюс повторная проверка живости видео.

## Итоговый топ-5 (подтверждён, без изменений)

1. **Thomas Quasthoff / Justus Zeyen** — зап. декабрь 2000, Bavaria Musikstudios, Мюнхен; DG 471 030-2 «Schubert: Schwanengesang / Brahms: Vier ernste Gesänge», изд. 2001. «Der Doppelgänger» — трек № 13, 3:50. Певцу 41 год — середина пика (~1993–2007). Приоритет № 1 правил (Квастхоф) — возглавляет пятёрку автоматически. Подтверждено дословно: *«Recorded December 2000 at Bavaria Musikstudios, München.»* — Discogs, релиз 1097040 (https://api.discogs.com/releases/1097040; продюсер Christopher Alder, инж. Oliver Rogalla). videoId `CPMyaPwjZws` («Thomas Quasthoff - Topic», UMG, ℗ 2001 DG) — oEmbed 200 (2026-09-07).

2. **Dietrich Fischer-Dieskau / Gerald Moore** — внецикльная сторона HMV DB21491, сессия **6 октября 1951**, Лондон, EMI Studio No. 3, Abbey Road (дискография Грея, id 57277 — единственная внецикловая сессия Фишера-Дискау на эту песню; факт установлен и задокументирован ранее в `cycle-schwanengesang-top5.md`). Издана на компиляции EMI Classics «Schwanengesang • 4 Lieder» (кат. 5 67558 2 / 7243 5 67558 2 6). Дословно по Discogs (релиз 8348067, https://api.discogs.com/releases/8348067): *«℗ 1951, 1952, 1955 & 1958 The copyright in these sound recordings is owned by EMI Records Ltd.»* — подтверждает происхождение компиляции из нескольких сессий 1951–1958 гг., что согласуется с датировкой трека 1951 годом по Грею. Певцу 26 лет — начало вокального пика (в отличие от цикльной альтернативы DG-1972, где ему 47 и тембр суше). videoId `RpnZkALdl1Q` («Dietrich Fischer-Dieskau - Topic», Warner Classics, ℗ 1958/2001 Parlophone) — oEmbed 200 (2026-09-07). *Замена против цикльной пятёрки* (там был DG-1972) — обоснование правилами «состояние голоса» и «при равенстве — более ранняя запись», см. цикльный файл, раздел «Обоснование двух замен».

3. **Hans Hotter / Gerald Moore** — зап. **28–30 мая 1954**, No. 3 Studio, Abbey Road, Лондон; Columbia (UK) 33CX1269 / Angel 35219, изд. 1955. Дословно по Discogs (релиз 25091812, https://api.discogs.com/releases/25091812, бокс EMI «The Great Bass-Baritone…», кат. 50999 2 64901 2 0): *«28–30.V.1954»* … *«No.3 Studio, Abbey Road, London»* (там же зафиксированы и другие сессии Хоттера — 1949, 1957 — 1954-я относится именно к Schwanengesang). Певцу 45 лет — сердцевина пика (~1942–1955). videoId `rgVFAwKJx3g` («Hans Hotter - Topic», Warner Classics, ℗ 1955/1994 Parlophone) — oEmbed 200 (2026-09-07). Позиция без изменений против цикльной пятёрки.

4. **Alexander Kipnis / Frank Bibb** — зап. **1 ноября 1927**, Нью-Йорк; Columbia 67434-D / 72057-D, британская сцепка L 2135 «Der Doppelgänger / Aufenthalt», изд. 1928 (дискография Грея, id 65261/65051, задокументировано в `cycle-schwanengesang-top5.md`). Независимое подтверждение сессии и матрицы — Discography of American Historical Recordings (DAHR), страница «Columbia matrix W98406. Der Doppelganger / Frank Bibb ; Alexander Kipnis» (https://adp.library.ucsb.edu/index.php/matrix/refer/2000144929) — заголовок страницы найден поиском; прямой fetch страницы вернул HTTP 403 (антибот-защита DAHR), поэтому текст карточки не процитирован дословно — используется только как подтверждающая ссылка на матричный номер. Дополнительно: трек на Spotify подписан *«Schwanengesang, D. 957: Der Doppelgänger (Recorded 1927)»* (https://open.spotify.com/track/5tbfMU6Qbua0YJQCwtWt09). Певцу 36 — начало пика; электрическая запись. videoId `zVScqbm6co4` («Alexander Kipnis - Topic», альбом «Alexander Kipnis Sings Lieder (1927-1936)», ℗ 2011 Music and Arts, дистрибуция NAXOS) — oEmbed 200 (2026-09-07). *Замена против цикльной пятёрки* (там был Prey/Klien 1963) — обоснование: песня как архетип басовой декламации, цикльный метод структурно исключает певцов без полного цикла, пер-песенная проверка это ограничение снимает; см. цикльный файл.

5. **Gerald Finley / Julius Drake** — зап. **октябрь 2018**, St Silas the Martyr, Kentish Town, Лондон; Hyperion CDA68288, изд. октябрь 2019. Дословно по странице альбома Hyperion (https://www.hyperion-records.co.uk/dc.asp?dc=D_CDA68288): *«October 2018 St Silas the Martyr, Kentish Town, London, United Kingdom»* (продюсер Mark Brown, инж. Ben Connellan). Певцу 58 — зрелый пик (~2005–2019); независимая критика (Gramophone, BBC/Hyperion, The Arts Fuse) относит запись к «пантеону» цикла. videoId `UOdSpreHwW4` («Gerald Finley - Topic», UMG, ℗ 2019 Hyperion) — oEmbed 200 (2026-09-07). Позиция без изменений против цикльной пятёрки (единственный слот 2015+).

## Проверка живости (oEmbed, 2026-09-07)

| № | Запись | videoId | Статус |
|---|---|---|---|
| 1 | Quasthoff — Zeyen 2000 | `CPMyaPwjZws` | 200 |
| 2 | Fischer-Dieskau — Moore 1951 | `RpnZkALdl1Q` | 200 |
| 3 | Hotter — Moore 1954 | `rgVFAwKJx3g` | 200 |
| 4 | Kipnis — Bibb 1927 | `zVScqbm6co4` | 200 |
| 5 | Finley — Drake 2018 | `UOdSpreHwW4` | 200 |

Все пять живы и встраиваемы; все — с официальных «— Topic»-каналов лейблов (DG/UMG, Warner Classics, Hyperion/UMG, Music and Arts/NAXOS).

## Отклонённые кандидаты (унаследовано из цикльного исследования, подтверждено)

- **Fischer-Dieskau / Moore, DG 1972** — цикльная альтернатива слоту № 2; отсеяна правилом «состояние голоса» (47 лет против 26 в 1951-м, тембр суше). Первый резерв слота, если ролик 1951 г. умрёт.
- **Fischer-Dieskau / Moore, Зальцбург 1956 (Orfeo, live)** — второй резерв слота № 2; концертная запись с аплодисментами (5:25 против 4:28 у студийной).
- **Fischer-Dieskau / Moore, EMI 1962** — художественно, возможно, сильнейшая версия певца (37 лет, вершина формы), но официальной потрековой загрузки Warner/EMI для этой сессии не найдено — только «серые» агрегаторы (Believe/Orchard); не публикуется по гигиене ссылок.
- **Hermann Prey / Walter Klien, Decca 1963** — цикльная позиция слота № 4; вытеснена Кипнисом: лирический баритон 34 лет уступает басовой традиции этой конкретной песни, и внутри группы «прочие звёзды прошлого» порядок решает качество применительно к песне, а не к циклу в целом. Первый резерв слота № 4.
- **Heinrich Schlusnus / Franz Rupp, Polydor 1928 (дата сессии не подтверждена)** — светлая, «поющая» манера ниже басовой традиции песни; год сессии документально не закрыт (Nimbus датирует переиздание, не сессию).
- **Hüsch / Moore 1937 и Hüsch / Müller 1939** — обе фонограммы без официальных потрековых загрузок на YouTube.
- **Herbert Janssen, HMV 1938** — только фанатские загрузки.
- **Marian Anderson / Rupp 1947 (студийная) и live 1964** — студийная имеет официальную загрузку (Nimbus), но проигрывает Кипнису как «архивный второй ряд»; живой концерт 1964 г. — певице 67 лет, голос за пиком.
- **Hans Hotter, прочие сессии** (Раухайзен — дата не проставлена; фон Нордберг 1946 — сольная сторона хорошей формы, но не эталонная; Parsons 1973 — поздний голос) — все проигрывают выбранной студийной 1954 г. с Муром.
- **Иноязычные версии** (Шаляпин — по-русски согласно EMI-антологии RLS 766, Рейзен — по-русски, Панзера/Морам — по-французски и др.) — вне отбора по правилам корпуса (перевод и подстрочник — только для немецкого оригинала).
- **Второй ряд без конкурентной силы**: Rehkemper, Gless/Urack, Moser, Tiemer, Steiner/Raucheisen, Duhan/Foll, Andrésen, Graveure, Lohmann/Raucheisen, Rothmüller/Gyr, Schöffler (обе версии), Rossi-Lemeni, Schmitt-Walter, Székely, Lehtinen, Schock, Novák — исторический интерес без оснований потеснить пятёрку.

## Соответствие правилам состава и иерархии

3 записи ранее 1990 г. (1927, 1951, 1954) ✓; 2 записи 1990+ (2000, 2018) ✓, из них 1 запись 2015+ (2018) ✓. Порядок — строгая иерархия правил: Квастхоф (№ 1) → Фишер-Дискау (№ 2) → звёзды прошлого по качеству применительно к песне (Хоттер — эталон-«пантеон» цикла; Кипнис — архетип басовой декламации этой конкретной песни) → современные (Финли, единственный слот 2015+).

## Вывод

Пятёрка в `app/src/data/performances.json` ("957/13") подтверждена независимой проверкой по первичным источникам (Discogs, Hyperion) и повторной проверкой живости видео. **Правка `performances.json` не требуется** — состав, порядок и все пять videoId остаются в силе.

## Источники (сетевые обращения, 2026-09-07)

- Discogs API, релиз 1097040 (Quasthoff/Zeyen, DG 471 030-2): https://api.discogs.com/releases/1097040
- Hyperion, страница альбома CDA68288 (Finley/Drake): https://www.hyperion-records.co.uk/dc.asp?dc=D_CDA68288
- Discogs API, релиз 25091812 (Hotter/Moore, EMI box): https://api.discogs.com/releases/25091812
- Discogs API, релиз 8348067 (Fischer-Dieskau/Moore, «Schwanengesang • 4 Lieder»): https://api.discogs.com/releases/8348067
- DAHR, матрица W98406 (Kipnis/Bibb): https://adp.library.ucsb.edu/index.php/matrix/refer/2000144929 (заголовок страницы — по данным поиска; прямой доступ вернул HTTP 403)
- Spotify, трек «Der Doppelgänger (Recorded 1927)»: https://open.spotify.com/track/5tbfMU6Qbua0YJQCwtWt09
- `planning/youtube/scripts` — oEmbed-проверка живости пяти videoId, 2026-09-07 (см. таблицу выше)
- Унаследованная база: `planning/research/cycle-schwanengesang-top5.md` (раздел D 957/13, 2026-08-17) — дискография Майкла Грея (classical-discography.org), MusicBrainz, реестр `planning/youtube/albums.md` / `albums/*.md`, `planning/research/singers-digest.md`
