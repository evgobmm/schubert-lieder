# Morgengruß (D 795/8, из цикла «Die schöne Müllerin») — проверка топ-5 исполнений

Дата: 2026-09-06. Правила: `docs/rules/youtube-performances.md` (цикльный метод, §«Масштабирование», п. 2). Статус до этого файла: пятёрка для «795/8» уже стояла в `app/src/data/performances.json` — унаследована от `planning/research/cycle-muellerin-top5.md` (базовая цикльная пятёрка Квасхоф → Фишер-Дискау → Хюш → Вундерлих → Хассельхорн), но отдельного пер-песенного файла по «Morgengruß» не было. Эта запись — целевая проверка уже стоящей пятёрки по протоколу: кто поёт, год, издание, источник с цитатой; отдельно — просмотр расширенного пула кандидатов трека (скриптовая сборка `planning/youtube/data/d795-8-morgengruss.candidates.json`).

**Итог проверки: пятёрка подтверждена без изменений.** Все пять фактов (певец/пианист, сессия, издание) нашли независимое документальное подтверждение; все пять videoId живы, встраиваемы и совпадают по каналу и содержанию с заявленным исполнителем (oEmbed, 2026-09-06). Замен не требуется.

## Итоговый топ-5 (проверено)

1. **Thomas Quasthoff / Justus Zeyen** — DG 474 218-2 (00289 474 2182), «Die Schöne Müllerin». Сессия — Discogs, карточка релиза 4640997: «Recording: Berlin, Teldex Studio, 7/2005» (https://api.discogs.com/releases/4640997). Ему 46 — внутри пика (~1993–2007), последний из шести шубертовских альбомов. Приоритет №1 правил → всегда первая позиция при достойной записи. Видео: `ZwrOgfWdC60` (Thomas Quasthoff - Topic; oEmbed: «Schubert: Die schöne Müllerin, D. 795: No. 8, Morgengruß»).
2. **Dietrich Fischer-Dieskau / Gerald Moore** — Electrola (позже Warner), «Die schöne Müllerin. Ein Zyklus von Liedern mit Prolog und Epilog» (катал. STE/SME 91 187/88 S, изд. 1962; Discogs master 626124). Сессия — Discogs, карточка релиза 5154563: «Recorded Dec 1961 in Berlin» (https://api.discogs.com/releases/5154563). Ему 36 — середина пика (1951–1972), стерео. Приоритет №2 правил. Видео: `rsmqsxr2D_Q` (Dietrich Fischer-Dieskau - Topic; oEmbed-заголовок «Op. 25, D. 795: No. 8, Morgengruss» — формат титула Warner-переиздания, отличает эту дорожку от параллельного DG-комплекта 1972 г. на том же канале).
3. **Gerhard Hüsch / Hanns Udo Müller** — HMV DB 2431 (сторона из комплекта DB 2429–2436), Лондон. Дата и матрица — метаданные CHARM на архивной копии стороны: `dateRecording: "1935-01-31"`, `catNumber: "2431"`, `audioFName: "DB_2431_2EA_1229-2"` (https://archive.org/metadata/78_morgengrss-die-schne-mllerin_hsch-gerhard-mller-hanns-udo). Таким образом дорожка «Morgengruß» — из первой (31.01.1935) сессии трёхдневного цикла записи, а не из более поздних (02.02 и 22.03.1935), как в общей карточке комплекта. Ему 34 — пик; тот же дуэт, что дал эталонную Winterreise-1933. Историческая опора группы «звёзды прошлого». Видео: `cOJF8GBk1JU` (Gerhard Hüsch - Topic; oEmbed: «Die schöne Müllerin, Op. 25, D. 795: Morgengruss»).
4. **Fritz Wunderlich / Hubert Giesen** — DG 139 219/220, «Die Schöne Müllerin». Сессия — Discogs, карточка релиза 6628286: «Recordings: Munich, Residenz, Plenarsaal der Akadamie der Wissenschaften, 7/1966» (https://api.discogs.com/releases/6628286; дубль подтверждён и в релизе 12940642 тем же текстом). Ему 36 — последние студийные сессии перед гибелью 17.09.1966. Видео: `NBVtnj2dkzw` (Fritz Wunderlich - Topic; oEmbed: «Schubert: Die schöne Müllerin, D. 795: No. 8, Morgengruss»).
5. **Samuel Hasselhorn / Ammiel Bushakevitz** — harmonia mundi HMM 902720, т. 1 проекта «Schubert 200». Трек и хронометраж — сырой текст страницы лейбла: «8. Morgengruß (4'15)» (https://www.harmoniamundi.com/en/albums/schubert-die-schone-mullerin-samuel-hasselhorn/); проект и участники — JSON-LD той же страницы: «Samuel Hasselhorn and Ammiel Bushakevitz will be offering us every year at 200-year intervals». Год записи/релиза 2023 — унаследован из цикльного файла (Discogs 36696394; изд. 22.09.2023). Ему ~33 — ранний пик; Diapason d'or октября 2023 (факт цикльного файла, не переверялся заново в этой сессии). Видео: `g_devDxT2mQ` (Samuel Hasselhorn - Topic; oEmbed: «Die schöne Müllerin, D. 795: No. 8, Morgengruß»).

## Проверка живости и канала (oEmbed, 2026-09-06)

| № | videoId | Канал (oEmbed) | Заголовок (oEmbed) |
|---|---|---|---|
| 1 | ZwrOgfWdC60 | Thomas Quasthoff - Topic | Schubert: Die schöne Müllerin, D. 795: No. 8, Morgengruß |
| 2 | rsmqsxr2D_Q | Dietrich Fischer-Dieskau - Topic | Die schöne Müllerin, Op. 25, D. 795: No. 8, Morgengruss |
| 3 | cOJF8GBk1JU | Gerhard Hüsch - Topic | Die schöne Müllerin, Op. 25, D. 795: Morgengruss |
| 4 | NBVtnj2dkzw | Fritz Wunderlich - Topic | Schubert: Die schöne Müllerin, D. 795: No. 8, Morgengruss |
| 5 | g_devDxT2mQ | Samuel Hasselhorn - Topic | Die schöne Müllerin, D. 795: No. 8, Morgengruß |

Все пять — оEmbed 200, канал соответствует заявленному исполнителю, ролик не помечен «(Live)». Расхождение в написании «Morgengruß/Morgengruss» и наличии «No. 8» — особенность титулов разных изданий (см. п. 2, 3 выше), не ошибка выбора ролика.

## Расширенный пул кандидатов трека (просмотрен, замен не дал)

Скрипт `match-candidates.js` собрал по треку 24 кандидата (`planning/youtube/data/d795-8-morgengruss.candidates.json`), включая параллельные аплоады уже выбранных пяти записей на других официальных каналах-переизданиях (для Фишер-Дискау — `9X7A1YqBSXE`, `DnErzPKt9nU`, `UEXbJHz1bTk`, `GB4ODPEd1Gw`, часть из них — DG-1972 или ремастеры, не сама выбранная запись 1961 г.; для Вундерлиха — `_YEpJDhSNkY`, помеченный «2025 Remastered, München 1965» — тот же альбом, другая дата в описании ремастер-релиза, расхождение не разбиралось отдельно, т.к. запись не входит в пятёрку взамен NBVtnj2dkzw). Кандидаты вне уже выбранной пятёрки:

- **Olaf Bär / (Topic)**, **Jochen Kowalski / (Topic)**, **Francisco Araiza / (Topic)**, **Andrè Schuen / (Topic)**, **Christian Gerhaher / (Topic)** — современные исполнители второго ряда (не именной приоритет); каждый уже разбирался на уровне цикла (см. `cycle-muellerin-top5.md`: Гергахер, Шуэн — резервы слота «≥2015», уступают Хассельхорну по объективной премии Diapason d'or de l'année).
- **Hermann Prey / (Topic)** — «второй ряд старой группы» по цикльному отбору; три места старой группы (Ф.-Д., Хюш, Вундерлих) уже заняты более сильными по консенсусной репутации записями.
- **Gérard Souzay / (Topic)** — та же группа, тот же вывод цикльного отбора.
- **Graham Johnson / (Topic)** — сопровождает Иана Бострижда (Hyperion, 1995); резерв современного слота на уровне цикла, слот здесь занят Хассельхорном (объективная премия).
- **Ian Bostridge**, **Jonas Kaufmann** — по правилу скепсиса к пиару и/или состоянию голоса не проходят внутрь пятёрки (Кауфманн — см. отклонение на уровне цикла).
- **Brigitte Fassbaender / (Topic)** — единственный найденный женский голос на треке; именной приоритет (Шварцкопф, Э. Шуман, Людвиг, Попп, Хоттер) этот номер не записывал ни в цикле, ни отдельно (по цикльному дайджесту); Фассбендер вне списка приоритетов и не даёт основания вытеснять три места старой группы.
- Любительские/неофициальные каналы (2SubsMusic, NoeckesHarfenschall, Raul Neuman, TeresaGrob1, Hannes Wader Official) — исключены по гигиене ссылок (не Topic/лейбл).

**Ограничение проверки**: полноценное пер-песенное досье уровня «Ungeduld» / «Das Wandern» / «Wohin?» (дискография Майкла Грея по всем историческим одиночным записям именно «Morgengruß», сверка каждого приоритетного имени) для этой песни не строилось — сетевой бюджет сессии (≤12 обращений) был исчерпан на подтверждение уже стоящей пятёрки. Судя по составу расширенного YouTube-пула (см. выше) серьёзных кандидатов, которые превосходили бы стоящую пятёрку или меняли бы место в иерархии приоритетов, не обнаружено; при появлении времени на полноценный пер-песенный конвейер — следующий шаг такой же, как для «Ungeduld».

## Соответствие правилам состава

3 записи ранее 1990 (1935, 1961, 1966) ✓; 2 записи 1990+ (2005, 2023) ✓; из них 1 запись 2015+ (2023) ✓. Порядок — строгая иерархия: Квасхоф (№1) → Фишер-Дискау (№2) → звёзды прошлого по качеству (Хюш → Вундерлих, унаследовано от цикльного ранжирования) → современный (Хассельхорн).

## Источники (дословные цитаты)

- Discogs, релиз 4640997 (Quasthoff/Zeyen, DG 474 218-2): «Recording: Berlin, Teldex Studio, 7/2005» — https://api.discogs.com/releases/4640997
- Discogs, релиз 5154563 (Fischer-Dieskau/Moore, Electrola STE 91 187/88 S): «Recorded Dec 1961 in Berlin» — https://api.discogs.com/releases/5154563
- Archive.org / CHARM-метаданные стороны HMV DB 2431 (Hüsch/H. U. Müller): `"dateRecording": "1935-01-31"`, `"catNumber": ["2431"]`, `"audioFName": ["DB_2431_2EA_1229-2"]` — https://archive.org/metadata/78_morgengrss-die-schne-mllerin_hsch-gerhard-mller-hanns-udo
- Discogs, релиз 6628286 (Wunderlich/Giesen, DG 139 219/220): «Recordings: Munich, Residenz, Plenarsaal der Akadamie der Wissenschaften, 7/1966» — https://api.discogs.com/releases/6628286 (тот же текст — релиз 12940642)
- harmonia mundi, страница альбома Hasselhorn/Bushakevitz (HMM 902720): «8. Morgengruß (4'15)» (трек-лист); JSON-LD: «Samuel Hasselhorn and Ammiel Bushakevitz will be offering us every year at 200-year intervals» — https://www.harmoniamundi.com/en/albums/schubert-die-schone-mullerin-samuel-hasselhorn/
- YouTube oEmbed для всех пяти videoId — проверено 2026-09-06 (таблица выше).
- Базовые факты цикла (сессии, каталожные номера комплектов, отклонённые кандидаты уровня всего цикла) — унаследованы из `planning/research/cycle-muellerin-top5.md` (2026-08-17), не переверялись заново в этой сессии, кроме перечисленного выше.
