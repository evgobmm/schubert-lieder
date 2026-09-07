# Ihr Bild (D 957/9) — отбор топ-5 исполнений

Дата: 2026-09-07. Ярус: famous, номер цикла Schwanengesang с самостоятельной концертной жизнью — по правилу «Масштабирование», п. 2 (`docs/rules/youtube-performances.md`) прошёл отдельное пер-песенное исследование сверх цикльного отбора. База: `planning/youtube/data/d957-9-ihr-bild.{candidates,mb,yt}.json` (скриптовая сборка кандидатов); `planning/research/cycle-schwanengesang-top5.md` (цикльный отбор пятёрки исполнителей и разбор той же EMI-сессии 1951 г. для «Der Doppelgänger» и «Am Meer», Грей id 62890/HMV DA2049 для «Ihr Bild» в той же сессии); проверка альбомной принадлежности каждого кандидата — `yt-dlp` (℗-строка, название альбома, канал); живость — oEmbed (все ID ниже — 200, 2026-09-07).

Задача — проверить пять записей, уже стоящих в `app/src/data/performances.json` под ключом `957/9` (Quasthoff/Zeyen, Fischer-Dieskau/Moore 1972, Hotter/Moore 1954, Prey/Klien 1963, Finley/Drake 2018), без файла-обоснования. Проверка `yt-dlp`-метаданных нашла **два дефекта**, требующих правки поля.

## Итоговый топ-5

1. **Thomas Quasthoff / Justus Zeyen** — зап. декабрь 2000, Bavaria Musikstudios, Мюнхен; DG, изд. 2001 (в связке с «Vier ernste Gesänge» Брамса). Приоритет № 1 правил, единственный Schwanengesang Квасхофа. Видео `VWLCItiaqDU` — «Thomas Quasthoff - Topic», альбом подтверждён `yt-dlp`: *«Schubert: Schwanengesang D. 957 / Brahms: Vier ernste Gesänge, Op. 121»*, «Provided to YouTube by Universal Music Group» — студийный DG-альбом, не дубль «It's Me…» и не живой Verbier. Без изменений против действующей записи в `performances.json`. Год в плеере: 2000.

2. **Dietrich Fischer-Dieskau / Gerald Moore** — зап. **6 октября 1951**, Лондон, EMI Studio No. 3, Abbey Road (Грей id 62890, сторона HMV DA2049 — та же сессия, что дала «Der Doppelgänger» id 57277/57278 и «Am Meer», разобранные в `cycle-schwanengesang-top5.md`: «гейневский блок EMI пелся отдельными сторонами, а не как цикл»). Певцу **26 лет** — начало вокального пика (~1951–1972), голос свежий; альбом-компиляция подтверждён Discogs API (release 8348067, «Schwanengesang • 4 Lieder», https://api.discogs.com/releases/8348067): цитата — *«℗ 1951, 1952, 1955 & 1958 The copyright in these sound recordings is owned by EMI Records Ltd.»* — то есть цикловый блок EMI действительно смонтирован из нескольких отдельных сессий разных лет, ранняя 1951-го входит в их число. **ЗАМЕНА против действующей записи `NntCzNEBXuI`** (DG 1972, певцу там 47 — цикльная карточка сама отмечает «тембр суше, чем в 1962»): по прямой аналогии с уже утверждёнными пер-песенными разборами «Der Doppelgänger» (слот № 2: EMI-1951 вместо DG-1972) и «Am Meer» (та же замена, тот же принцип — «сходные по уровню записи — берём более раннюю» + состояние голоса), для «Ihr Bild» действует тот же вывод и та же исходная сессия. Видео `W2G5q26sfjI` — «Dietrich Fischer-Dieskau - Topic»; `yt-dlp`: *«Schwanengesang, D. 957: No. 9, Ihr Bild · Dietrich Fischer-Dieskau · Gerald Moore»*, альбом «Schubert: Schwanengesang etc», «Provided to YouTube by Warner Classics, ℗ A Warner Classics release, ℗ 1958, 2001 Parlophone Records Limited» — официальная Warner-раскладка той же EMI-компиляции, что уже опознана и проверена для соседних номеров цикла. Год в плеере: **1951** (замена с 1972).

3. **Hans Hotter / Gerald Moore** — зап. 28–30 мая 1954, Abbey Road Studio No. 3 (Грей id 71724); Columbia (UK) 33CX1269, изд. 1955; переизд. EMI References/Warner. Певцу 45 — сердцевина пика; запись входит в «пантеон» цикла по внешней критике (см. цикльный файл). **ЗАМЕНА videoId против действующей записи `3d-5koRTwJ8`** — та оказалась «серым» переизданием: `yt-dlp` на неё даёт *«Provided to YouTube by Ginkgo Classical … ℗ Salt & Pepper … Released on: 2014-01-01»* — это ровно та категория дублей («MVE, Salt & Pepper и т. п.»), которую `cycle-schwanengesang-top5.md` прямо предписывает не брать («на канале много "серых" дублей… брать только Warner-загрузку»). Правильный официальный ролик — `KRrM4YlDqlQ`, тот же канал «Hans Hotter - Topic»: `yt-dlp` — *«Schwanengesang, D. 957: No. 9, Ihr Bild»*, альбом «Schubert: Lieder», *«Provided to YouTube by Warner Classics, ℗ A Warner Classics release, ℗ 1955, 1994 Parlophone Records Limited»* — совпадает по ℗-строке с уже верифицированным цикльным треком того же альбома (`rgVFAwKJx3g`, «Der Doppelgänger»). Год в плеере: 1954 (без изменений).

4. **Hermann Prey / Walter Klien** — зап. 13–15+23 апреля 1963, Wien, Sofiensaal, прод. Erik Smith (Грей id 8256); Decca OS25797. Певцу 34 — ранний пик, самый свежий из его четырёх студийных циклов. Видео `Iwmd5yUwtg4` — «Hermann Prey - Topic»; `yt-dlp` подтверждает точную привязку к циклу: *«Schubert: Schwanengesang, D.957 (Cycle) : Ihr Bild»*, «Provided to YouTube by Universal Music Group, ℗ 1963 Decca Music Group Limited» — маркировка «(Cycle)» и год ℗ совпадают с требованием цикльного файла («брать только треки с пометкой "(Cycle)" и ℗ 1963 Decca»). Без изменений. Год в плеере: 1963.

5. **Gerald Finley / Julius Drake** — зап. октябрь 2018, St Silas the Martyr, Kentish Town, Лондон (Hyperion CDA68288); изд. 2019. Певцу 58 — зрелый пик; сильнейший современный кандидат цикла по независимой критике (Gramophone, BBC, The Arts Fuse — см. цикльный файл), закрывает слот «не ранее 2015». Видео `iZPCBdzl8FI` — «Gerald Finley - Topic»; `yt-dlp`: *«Schubert: Schwanengesang, D. 957: Ihr Bild»*, альбом «Schubert: Schwanengesang, D. 957 – Brahms: 4 Serious Songs, Op. 121», «Provided to YouTube by Universal Music Group, ℗ 2019 Hyperion Records Limited». Без изменений. Год в плеере: 2018.

## Ключевые решения и отклонённые кандидаты

- **Действующая запись № 2 (`NntCzNEBXuI`, DG 1972)** — не бракованная (это подлинный официальный DG-трек циклового свода, `yt-dlp` подтверждает «Schubert: Lieder (Vol. 3)», ℗ 1972 DG), но по пер-песенному правилу состояния голоса уступает EMI-1951 той же схемой, что уже утверждена для «Der Doppelgänger» и «Am Meer» — заменена. **Первый резерв слота № 2**, если официальная загрузка 1951 г. когда-нибудь пропадёт.
- **Действующая запись № 3 (`3d-5koRTwJ8`)** — это не альтернативная фонограмма Хоттера, а низкокачественный «серый» реюпload («Ginkgo Classical», лейбл-плейсхолдер «Salt & Pepper», дата загрузки 2014 без документированной сессии) той же студийной записи 1954 г., которую правило прямо запрещает использовать. Замена на официальный Warner-трек того же альбома технически безрисковая: певец, пианист, сессия и год не меняются — меняется только источник видео.
- **Fischer-Dieskau, прочие версии песни** (проверены по `d957-9-ihr-bild.yt.json`): `Mrrk2-Kzyhw` — DG 1983 с Альфредом Брендлем (`yt-dlp`: ℗ 1983 Universal, певцу 58 — поздний голос, отклонено правилом «состояние голоса»); `6XZBLsRMcSc` — компиляция Regis Records 2011 (не оригинальная сессия, вторичный лейбл); `f4003JRKkkA` — DG-сборник «Discoveries», ℗ 2022 (архивная подборка, происхождение конкретной фонограммы не установлено); `0kVbpbnc63E` — живой Зальцбургский концерт, Orfeo, изд. 2019, «(Live)» — в связке со Шпором Шумана; резерв, не студия. Ни один не превосходит выбранную EMI-1951.
- **Andrè Schuen / Heide (DG, 2015+)** — `1mOhpxDerVQ`, официальный современный кандидат, но по правилам состава на слот «2015+» в цикле уже стоит Финли (сильнее по совокупной критике — обоснование в `cycle-schwanengesang-top5.md`); при одном слоте современности Шуэн остаётся резервом.
- **Christian Gerhaher / Gerold Huber (Arte Nova, 1999)** — `HWzBta9bDTM`, ранний цикл артенова-периода; не конкурирует с публикуемой пятёркой ни по эпохе, ни по критическому весу (второй ряд современных, обоснование — цикльный файл).
- **Markus Schäfer, Brigitte Fassbaender, Ian Bostridge, Hans Duhan-типа фан-каналы (William Hite, incontrario motu, 2SubsMusic, Sadanori Kobinata)** — либо не входят в приоритетную иерархию исполнителей и уступают уже стоящим в пятёрке по значительности (Шефер, Фассбендер), либо не официальные Topic-загрузки (`Kly0DAcPde0`, `vrJExVPTxs4`, `IIH_I1PKSw4`, `3GA25bZgSNI`, `pO50s92MBHc`) — вне отбора по гигиене ссылок.

## Проверка videoId (yt-dlp + oEmbed, 2026-09-07)

| № | Запись | Год | videoId | Канал / альбом | oEmbed |
|---|---|---|---|---|---|
| 1 | Quasthoff — Zeyen | 2000 | `VWLCItiaqDU` | Thomas Quasthoff - Topic, DG 2001 | 200 |
| 2 | Fischer-Dieskau — Moore | **1951** (было 1972) | **`W2G5q26sfjI`** (было `NntCzNEBXuI`) | Dietrich Fischer-Dieskau - Topic, Warner Classics ℗1958/2001 Parlophone | 200 |
| 3 | Hotter — Moore | 1954 | **`KRrM4YlDqlQ`** (было `3d-5koRTwJ8`) | Hans Hotter - Topic, Warner Classics ℗1955/1994 Parlophone | 200 |
| 4 | Prey — Klien | 1963 | `Iwmd5yUwtg4` | Hermann Prey - Topic, UMG ℗1963 Decca (Cycle) | 200 |
| 5 | Finley — Drake | 2018 | `iZPCBdzl8FI` | Gerald Finley - Topic, UMG ℗2019 Hyperion | 200 |

## Соответствие возрастной структуре

3 записи ранее 1990 (1951, 1954, 1963) ✓; 2 записи 1990+ (2000, 2018) ✓; из них 1 запись 2015+ (2018) ✓. Порядок — строгая иерархия правил: Квасхоф (№ 1) → Фишер-Дискау (№ 2) → звёзды прошлого по качеству (Хоттер — «пантеонный» статус) → современные (Финли, сильнейший по независимой критике).

## Требуемая правка `performances.json`

Файл менять не стал (запрет задания). Для ключа `"957/9"` требуются две правки строк:
- запись № 2: `{"videoId": "NntCzNEBXuI", "name": "Fischer-Dieskau — Moore", "year": 1972}` → `{"videoId": "W2G5q26sfjI", "name": "Fischer-Dieskau — Moore", "year": 1951}`;
- запись № 3: `{"videoId": "3d-5koRTwJ8", "name": "Hotter — Moore", "year": 1954}` → `{"videoId": "KRrM4YlDqlQ", "name": "Hotter — Moore", "year": 1954}` (год не меняется, только videoId — устранение «серой» загрузки).

## Резервы

1. Fischer-Dieskau — Moore, DG 1972 (`NntCzNEBXuI`) — резерв слота № 2 при исчезновении официальной Warner-загрузки 1951 г.
2. Schuen — Heide, DG 2022 (`1mOhpxDerVQ`) — резерв слота 2015+ при проблемах с записью Финли.
3. Gerhaher — Huber, Arte Nova 1999 (`HWzBta9bDTM`) — резерв современного слота второго ряда.
