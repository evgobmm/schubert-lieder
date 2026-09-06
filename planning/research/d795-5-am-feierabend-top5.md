# D 795/5 «Am Feierabend» (Die schöne Müllerin) — топ-5

Песня входит в цикл «Die schöne Müllerin» (D 795) и не имеет задокументированной самостоятельной концертной/пластиночной жизни, сопоставимой с «Ungeduld» (D 795/7, отдельная пер-песенная проверка — см. `cycle-muellerin-top5.md`): в проектных материалах нет ни файла-фактов, ни override-исследования по этой песне отдельно от цикла. Поэтому здесь действует цикльный метод как есть (`docs/rules/youtube-performances.md`, «Масштабирование», п. 2): пятёрка наследуется из полного отбора записей цикла `planning/research/cycle-muellerin-top5.md` (обоснование альбомов, годов и приоритетов — там; здесь — только проверка применимости к конкретному треку).

Задача этого файла — построчная (per-song) проверка уже опубликованной в `app/src/data/performances.json` пятёрки для `"795/5"`: правильная ли это песня на каждом videoId, тот ли исполнитель/пианист, тот ли альбом/год.

## Проверка опубликованной пятёрки (oEmbed, 2026-09-06)

Все пять videoId из `performances.json` живые, встраиваемые, с верным названием песни («Am Feierabend» / трек №5) и каналом, соответствующим исполнителю:

| # | name | year | videoId | oEmbed: title / author_name |
|---|------|------|---------|------------------------------|
| 1 | Quasthoff — Zeyen | 2005 | `qAy0gqiXwGQ` | «Schubert: Die schöne Müllerin, D. 795: No. 5, Am Feierabend» / Thomas Quasthoff - Topic |
| 2 | Fischer-Dieskau — Moore | 1961 | `t-c5gSbAMNg` | «Die schöne Müllerin, Op. 25, D. 795: No. 5, Am Feierabend» / Dietrich Fischer-Dieskau - Topic |
| 3 | Hüsch — H. U. Müller | 1935 | `hTAiGfWwkeA` | «Die schöne Müllerin, Op. 25, D. 795: Am Feierabend» / Gerhard Hüsch - Topic |
| 4 | Wunderlich — Giesen | 1966 | `An5GVdum5rc` | «Schubert: Die schöne Müllerin, D. 795: No. 5, Am Feierabend» / Fritz Wunderlich - Topic |
| 5 | Hasselhorn — Bushakevitz | 2023 | `6f6yq0eDT2w` | «Die schöne Müllerin, D. 795: No. 5, Am Feierabend» / Samuel Hasselhorn - Topic |

Источник проверки: `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json`, обращения выполнены 2026-09-06. Все пять названий и каналов совпадают с ожидаемыми по цикльному отбору — замен не требуется.

## Обоснование каждой записи (годы, издания, источники)

1. **Thomas Quasthoff — Justus Zeyen, 2005.** Deutsche Grammophon 00289 474 2182. Discogs release 4640997, notes: «Recording: Berlin, Teldex Studio, 7/2005» (≤120 зн.). URL: `https://www.discogs.com/release/4640997-Schubert-Thomas-Quasthoff-Justus-Zeyen-Die-Schöne-Müllerin`. Приоритет №1 правил (Квастхоф) — не по обсуждению.

2. **Dietrich Fischer-Dieskau — Gerald Moore, 1961.** Electrola/EMI STE 91187/8, ныне Warner Classics. Точная дата сессии — реставрационное переиздание EMI «Great Recordings of the Century» (7243 5 66907 2 1), Discogs release 3325573, notes: «Recorded 2-4.XII.1961, Gemeindehaus, Berlin-Zehlendorf» (56 зн.). URL: `https://www.discogs.com/release/3325573-Schubert-Dietrich-Fischer-Dieskau-Gerald-Moore-Die-Schöne-Müllerin`. (Цикльное досье даёт близкую дату «2–3.12.1961» по реестру; расхождение на день — не критично, издание и певец идентифицированы однозначно.) Пик голоса (36 лет), самая тиражируемая EMI-версия цикла — №2 иерархии (Фишер-Дискау).

3. **Gerhard Hüsch — Hanns Udo Müller, 1935.** HMV DB 2429–2436. Дата конкретно для «Am Feierabend» — дискография Майкла Грея (classical-discography.org), запись id 56248 (сторона DB2430): «1935 January 31», London, EMI Studio No. 3, Abbey Road (факт из `planning/youtube/data/cycle-muellerin.dossier.json`, кандидат `huesch-mueller-1935`; сайт запросный, стабильного URL на отдельную запись нет — цитируется как в других top5-файлах проекта). Исторический эталон цикла, klassik-prisma 5 баллов — сильнейший кандидат группы «звёзды прошлого» после Ф.-Д.

4. **Fritz Wunderlich — Hubert Giesen, 1966.** Deutsche Grammophon 139 219/220 («Die schöne Müllerin / 7 Lieder»), сессии 2–5 июля 1966, Akademie der Wissenschaften, Мюнхен (дискография Грея + реестр). Год и издание подтверждены Discogs release 6819963 (label «Deutsche Grammophon 139 219/220», year 1966). URL: `https://www.discogs.com/release/6819963-Franz-Schubert-Fritz-Wunderlich-Hubert-Giesen-Die-Schöne-Müllerin-7-Lieder`. Последние студийные сессии Вундерлиха (погиб 17.09.1966) — эталон тенорового цикла, второе место старой группы.

5. **Samuel Hasselhorn — Ammiel Bushakevitz, 2023.** harmonia mundi HMM 902720, т. 1 проекта «Schubert 200». Discogs release 36696394: label «Harmonia Mundi HMM 902720», year 2023. URL: `https://www.discogs.com/release/36696394-Franz-Schubert-Samuel-Hasselhorn-Ammiel-Bushakevitz-Die-Schöne-Müllerin`. Diapason d'or октября 2023 и Diapason d'or de l'année (объективные премии) — лучший кандидат слота «не ранее 2015».

## Соответствие правилам состава

3 записи ранее 1990 г. (1935, 1961, 1966) + 2 записи 1990+ (2005, 2023), из них одна 2015+ (2023) ✓. Порядок — строгая иерархия: Квастхоф → Фишер-Дискау → звёзды прошлого по качеству (Хюш → Вундерлих) → современная (Хассельхорн) ✓ — совпадает с итоговой пятёркой `cycle-muellerin-top5.md`.

## Отклонённые кандидаты (наследуются от цикльного отбора)

Полный перечень альтернатив и причин отказа — в разделах «Отклонённые кандидаты» и «Резервы» файла `planning/research/cycle-muellerin-top5.md`. Ключевые для этого слота:

- **Fischer-Dieskau / Moore, 1951** (HMV DB 21388 и др., зап. 3–5 + 7.10.1951, Abbey Road) — вокально самая свежая версия Ф.-Д. (26 лет), но официальной потрековой YouTube-загрузки нет (только «серые» агрегаторы Heritage/MVE/BNF, кредиты которых правилами запрещены как источник) — гейт не пройден, слот остаётся за 1961 г.
- **Fischer-Dieskau / Moore, DG изд. 1972** (Sämtliche Lieder, сессии 1966–72) — доступен официально (`Q9XxnkzYVw0` и т.п. в цикльном досье), но по правилу «при прочих равных — более ранняя» уступает версии 1961 г.
- **Aksel Schiøtz / Gerald Moore, 1945** (HMV DB 6252, зап. 1.11.1945) — сильный кандидат старой группы, но по консенсусной репутации уступает Хюшу (klassik-prisma, GRoC) и Вундерлиху; первый резерв старой группы.
- **Ian Bostridge / Graham Johnson, 1995** (Hyperion CDJ33025, Gramophone Award 1996) — лучший кандидат «свежего» 1990-х слота, но оба современных места в пятёрке заняты Квастхофом (приоритет №1) и Хассельхорном (слот ≥2015); первый резерв современного места.
- **Peter Anders** (циклы 1945/1948) — приоритетный по правилам певец, но полной потрековой доступности его циклов на YouTube не найдено (цикльное досье, кандидат `anders-1945-1948`) — непубликуем.
- Приоритетные женские голоса (Шварцкопф, Э. Шуман, Хоттер, Людвиг, Попп) — полного цикла «Die schöne Müllerin» ни у одной нет (мужской цикл); отрицательный результат зафиксирован в цикльном файле.

Замен в опубликованной пятёрке не требуется — все пять записей прошли проверку по правилу.

## Источники

- `docs/rules/youtube-performances.md` — правила отбора.
- `planning/research/cycle-muellerin-top5.md` — полное обоснование пятёрки цикла (годы, издания, отклонённые, резервы).
- `planning/youtube/data/cycle-muellerin.dossier.json` — досье кандидатов (Грей-дискография, состояние голоса, потрековая доступность).
- YouTube oEmbed (`https://www.youtube.com/oembed?...`), проверка 2026-09-06 — все 5 videoId для D 795/5.
- Discogs API (`api.discogs.com`, без токена): релизы 4640997, 3325573, 6819963, 36696394.
