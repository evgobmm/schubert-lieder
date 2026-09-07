# Die Stadt (D 957/11) — отбор топ-5 исполнений

Дата: 2026-09-07. Ярус: famous — песня № 11 сборника «Schwanengesang» D 957, гейневский блок (Rellstab/Heine). Правила: `docs/rules/youtube-performances.md`, цикльный метод («Масштабирование», п. 2).

**Статус пятёрки.** Все пять записей унаследованы от единого цикльного отбора `planning/research/cycle-schwanengesang-top5.md` (2026-08-17) — той же пятёрки, что стоит сейчас в `app/src/data/performances.json` под ключом «957/11». В этом мастер-файле отдельную пер-песенную проверку (со сверкой внецикльного фонда записей) прошли только четыре номера с самостоятельной концертной жизнью — Ständchen (№4), Am Meer (№12), Der Doppelgänger (№13) и Die Taubenpost (D965A); «Die Stadt» такой проверки не получила. Задача настоящего файла — не повторный поиск кандидатов, а верификация фактов о пяти уже стоящих записях применительно именно к этой песне: реально ли она есть в указанном издании, под тем ли именем/годом, по независимым источникам с дословной цитатой.

**Источники.** Discogs API (api.discogs.com, curl без токена) — потрековая сверка и издательские заметки пяти релизов; дискография Майкла Грея (classical-discography.org, modalcontent.php) — прямая переверка трёх сессий (id 71724 Хоттер, id 8260 Фишер-Дискау, id 8256 Прай); буклет Hyperion (hyperion-records.co.uk, CDA68288) — дата и место записи Финли/Дрейка. Итого 12 обращений к сети (10 к Discogs/Grey, 1 к Hyperion, 1 резерв не понадобился). Видео (videoId) не менялись и повторно не проверялись — они прошли oEmbed-проверку на этапе цикльного отбора 2026-08-17.

## Итоговый топ-5 (без изменений против performances.json)

1. **Thomas Quasthoff / Justus Zeyen** — зап. декабрь 2000, Bavaria Musikstudios, Мюнхен; DG 471 030-2, изд. 2001 (со «Vier ernste Gesänge» Брамса). Приоритет №1 правил — единственный Schwanengesang Квастхофа. Трек 11 «Die Stadt» (в буклете опечатка «Dei Stadt»), 2:41, подтверждён потрёково. Источник: Discogs release 1097040 — «Recorded December 2000 at Bavaria Musikstudios, München.» (https://api.discogs.com/releases/1097040).
2. **Dietrich Fischer-Dieskau / Gerald Moore** — зап. 7 и 9 марта 1972, Berlin, UFA Studio; DG 2720 059 / переизд. 463 503-2 «Fischer-Dieskau Edition», 2000. Приоритет №2. Трек 11 «Die Stadt», 2:54. Источник 1 (Discogs release 10604562, буклет-заметка): «Tracks 1 to 14: 1972-03-07 & 1972-03-09 • Berlin, Ufa-Ton-Studio» (https://api.discogs.com/releases/10604562). Источник 2 (Грей, id 8260): «Date 1972 March 7 + 9 Place Berlin, UFA Studio... Dietrich Fischer-Dieskau, baritone; Gerald Moore, piano» (http://www.classical-discography.org/modalcontent.php?id=8260).
3. **Hans Hotter / Gerald Moore** — зап. 28–30 мая 1954, Abbey Road; Columbia (UK) 33CX 1269, изд. 1955. Группа «звёзды прошлого», внутри группы — выше Прая (эталонный статус цикла). Трек B4 «Die Stadt», 2:54. Источник 1 (Discogs release 14198980, оригинальный релиз 1955 г.): трек-лист «B4 Die Stadt 2:54» (https://api.discogs.com/releases/14198980). Источник 2 (Грей, id 71724): «Number 33CX1269. Angel 35219... Date 1954 May 28 - 30... Hans Hotter, bass-baritone; Gerald Moore, piano» (http://www.classical-discography.org/modalcontent.php?id=71724).
4. **Hermann Prey / Walter Klien** — зап. 13–15 и 23 апреля 1963, Wien, Sofiensaal; Decca SXL 6069, «RECORDING FIRST PUBLISHED 1963», прод. Erik Smith, инж. Gordon Parry. Трек B4 «Die Stadt» подтверждён потрёково. Источник 1 (Discogs release 5163726): трек-лист «B4 Die Stadt» + «RECORDING FIRST PUBLISHED 1963» + кредиты «Erik Smith Producer», «Gordon Parry Engineer» (https://api.discogs.com/releases/5163726). Источник 2 (Грей, id 8256): «Date 1963 April 13-15+23 Place Wien, Sofiensaal Label Decca... Hermann Prey, baritone; Walter Klien, piano Producer/Engineer Smith/Parry» (http://www.classical-discography.org/modalcontent.php?id=8256).
5. **Gerald Finley / Julius Drake** — зап. октябрь 2018, St Silas the Martyr, Kentish Town, Лондон; Hyperion CDA68288, изд. 2019. Единственный слот «не ранее 2015». Источник (буклет Hyperion): «Recording details: October 2018» / «St Silas the Martyr, Kentish Town, London, United Kingdom»; про саму песню — «'Die Stadt' (the town in question is Hamburg, where Heine had been rejected by his cousin Amalie)» (https://www.hyperion-records.co.uk/dc.asp?dc=D_CDA68288).

## Проверка присутствия трека и издания

| № | Запись | Год | Издание | Каталог | Позиция трека «Die Stadt» | Проверено |
|---|---|---|---|---|---|---|
| 1 | Quasthoff — Zeyen | 2000 | DG, ℗2001 | 471 030-2 | 11 (2:41) | Discogs 1097040 |
| 2 | Fischer-Dieskau — Moore | 1972 | DG, изд. 2000 | 463 503-2 | 11 (2:54) | Discogs 10604562 + Грей id 8260 |
| 3 | Hotter — Moore | 1954 | Columbia, изд. 1955 | 33CX 1269 | B4 (2:54) | Discogs 14198980 + Грей id 71724 |
| 4 | Prey — Klien | 1963 | Decca, изд. 1963 | SXL 6069 | B4 | Discogs 5163726 + Грей id 8256 |
| 5 | Finley — Drake | 2018 | Hyperion, изд. 2019 | CDA68288 | 11 | Буклет Hyperion |

Все пять записей подтверждены как содержащие именно эту песню, под заявленными исполнителями и в датированных сессиях, которые совпадают с фактами, уже зафиксированными в цикльном файле. Расхождений, ошибок атрибуции или проблем с изданием не обнаружено — замена пятёрки не требуется.

## Отклонённые кандидаты и нерешённый вопрос (для будущей углублённой пер-песенной проверки)

Полноценного внецикльного поиска кандидатов (по образцу Ständchen/Am Meer/Der Doppelgänger/Die Taubenpost в цикльном файле) в рамках этой задачи не проводилось — бюджет в 12 обращений отведён на верификацию уже стоящей пятёрки, а не на новый поиск. Один зацепившийся при проверке факт стоит отметить для будущей волны:

- **Fischer-Dieskau / Moore, EMI-компиляция «℗ 1951, 1952, 1955 & 1958»** (Discogs release 8348067, «Schwanengesang • 4 Lieder», EMI 5 67558 2) содержит трек 11 «Die Stadt» в общем блоке 1–14 без потрековой даты сессии. Именно из этой компиляции в цикльном файле для Der Doppelgänger и Am Meer была официально подтверждена ранняя сессия 6 октября 1951 г. (Грей id 57277/57278) и сделана замена цикльной DG-1972 записи на неё (певцу 26 лет против 47 в 1972-м). У Грея по прямому запросу composer=Schubert, work=«Die Stadt», artist=Fischer-Dieskau конкретная запись для проверки этой гипотезы не поднималась в рамках данной задачи — это открытый вопрос для отдельной пер-песенной проверки «Die Stadt», а не установленный факт; здесь не заявляется и не рекомендуется замена, только фиксируется зацепка.
- Прочие кандидаты (Kipnis, Schlusnus, Anders, Wunderlich, Hüsch и т. д., разобранные в цикльном файле применительно к другим номерам гейневского блока) для «Die Stadt» отдельно не проверялись — вне бюджета задачи.

## Соответствие правилам состава

3 записи ранее 1990 (1954, 1963, 1972) ✓; 2 записи 1990+ (2000, 2018) ✓; из них 1 запись 2015+ (2018) ✓. Порядок — строгая иерархия приоритетов: Квастхоф (№1 правил) → Фишер-Дискау (№2) → звёзды прошлого по качеству (Хоттер > Прай — цикльное обоснование) → современный (Финли, единственный слот 2015+). Изменений в `app/src/data/performances.json` не требуется.
