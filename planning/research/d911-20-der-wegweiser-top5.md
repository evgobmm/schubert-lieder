> **Отбор для «Зимнего пути» закрыт** (указание пользователя 2026-09-09: «топ 5 исполнителей для зимнего пути мы уже сделали, это менять не надо»).
> Пятёрка в `app/src/data/performances.json` остаётся как есть; этот файл — только опора для раздела «Как это поют».
> Рекомендации о заменах, если они ниже встречаются, НЕ выполнять.

# D 911/20 «Der Wegweiser» — топ-5 (проверка уже опубликованной пятёрки)

Для этой песни (Winterreise, № 20) top5-файла раньше не было — пятёрка в `performances.json` взята из
цикльного отбора Winterreise (правило: «Winterreise — записи уже подобраны и утверждены; поток их не
пересматривает»). Ниже — точечная проверка всех пяти записей по правилу `docs/rules/youtube-performances.md`
(кто поёт/играет, год, издание, статус видео) с источниками; правки `performances.json` не вносились —
только рекомендации ниже. Бюджет: 13 обращений к сети (5 WebSearch + 8 WebFetch).

## Проверка записей (как сейчас в performances.json)

| № в файле | name | year | videoId | Проверка |
|---|------|------|---------|----------|
| 1 | Quasthoff — Spencer | 1997 | `9_LKY7K2o2Q` | RCA, «Schubert: Winterreise», пианист Charles Spencer. jpc.de даёт **«Aufnahmejahr ca.: 1998»** (не 1997); Discogs/eBay независимо называют сессию 18–22.02.1998, Studio van Geest, Sandhausen (по выдаче поиска, страница Discogs недоступна — 403). Издание 05.10.1998. Заголовок видео подтверждён: «Winterreise, D. 911: No. 20, Der Wegweiser». Высший приоритет по правилу — законно №1. **Год в файле нужно исправить на 1998.** |
| 2 | Mattei — Nilsson | 2018 | `louDDB1zeGE` | BIS-2444, пианист Lars David Nilsson. Naxos-каталог (BIS-2444) — релиз 09/2019; программа Konserthuset Stockholm датирует нордическое турне «Winterreise with Peter Mattei» 2018 годом — вероятный источник года сессии/тура в файле; точная дата студийной сессии не найдена (буклет не вскрыт). Заголовок видео подтверждён: «Winterreise, Op. 89, D. 911: No. 20, Der Wegweiser». Современная запись, по обзору Limelight Arts — «исполнитель значительного воображения и проницательности» (пересказ по выдаче поиска, не сверено дословно по странице). **Место в пятёрке — по составу — верно, но по иерархии приоритетов должна идти последней (см. ниже), не второй.** |
| 3 | Fischer-Dieskau — Moore | 1962 | `G6bUhKUxrE8` | HMV ASD 551/552, ремейк Winterreise, пианист Gerald Moore; в реестре альбомов проекта (`albums/complete-editions.md`) сессия датирована 16–17.11.1962 по дискографии Майкла Грея. HMV Japan: **«Winterreise : Dietrich Fischer-Dieskau(Br)Gerald Moore(P)(1962)(UHQCD)»**. Заголовок видео подтверждён: «Winterreise, Op. 89, D. 911: No. 20, Der Wegweiser». Второй по иерархии приоритет — **по правилу должен идти №2, а не №3.** |
| 4 | Anders — Raucheisen | 1945 | `D8JqwfVs0QQ` | Радиозаписи RRG Берлин, пианист Michael Raucheisen. Archive.org: **«Franz Schubert, WINTERREISE - Peter Anders, Michael Raucheisen (23 gennaio e 2, 13 marzo 1945)»** — сессии 23.01 + 2 и 13.03.1945. Заголовок видео подтверждён: «Winterreise Op. 89: Der Wegweiser». Старый мастер, певец на пике (погиб в 1954, спада голоса к 1945 не отмечено дайджестом). Позиция в группе «старые мастера» корректна. |
| 5 | Hotter — Raucheisen | 1942 | `MEiKrFsD1M8` | Реестр проекта (`male-recitalists.md`) относит к тому же корпусу радиозаписей RRG/Raucheisen 1942–45; независимо Discogs датирует именно этот цикл как **«Hans Hotter Sings Schubert Winterreise The 1942 DG Recordings»** (первая версия Winterreise Хоттера, изд. на 78 об/мин уже в 1943). Заголовок видео подтверждён: «Winterreise, Op. 89, D.911.: No. 20, Der Wegweiser». Певец на раннем пике (дайджест: пик ~1942–1955). Позиция в группе «старые мастера» корректна. |

## Итог проверки

Все пять записей — подлинные, embeddable-заголовки подтверждают именно № 20 «Der Wegweiser», исполнители и
издания соответствуют документированным сессиям. Существенных проблем с личностью исполнителей/годом
(кроме года Квасхофа) не найдено. Но **порядок в файле нарушает иерархию приоритетов** правила
(«Квасхоф — всегда №1, затем Фишер-Дискау»): сейчас Маттеи (современный, не приоритетный певец) стоит
на месте №2, а Фишер-Дискау — на №3.

**Рекомендация (без внесения правки — файл `performances.json` не менялся):**

| № | name | year | videoId |
|---|------|------|---------|
| 1 | Quasthoff — Spencer | **1998** (было 1997) | `9_LKY7K2o2Q` |
| 2 | Fischer-Dieskau — Moore | 1962 | `G6bUhKUxrE8` |
| 3 | Anders — Raucheisen | 1945 | `D8JqwfVs0QQ` |
| 4 | Hotter — Raucheisen | 1942 | `MEiKrFsD1M8` |
| 5 | Mattei — Nilsson | 2018 | `louDDB1zeGE` |

Взаимный порядок Anders/Hotter (оба — «старые мастера», без явного сравнения качества между собой в рамках
этой проверки) оставлен как в исходном файле — менять его оснований не найдено. Возрастная структура
сохраняется: две записи ≥1990 (Quasthoff 1998, Mattei 2018), из них одна ≥2015 (Mattei); три записи
<1990 (1962, 1945, 1942).

Состав пятёрки (сами пять исполнителей/изданий) сомнений не вызывает — предложений по замене записей нет,
**replaced = 0**. Требуется только (а) правка year Квасхофа 1997→1998 и (б) перестановка на позиции №2/№3
(Фишер-Дискау выше Маттеи) — обе правки не внесены, так как редактирование `performances.json` запрещено
условиями задачи; выносится на утверждение пользователя.

## Отклонённые кандидаты

Отдельного нового дискографического поиска по песне не проводилось (Winterreise поток не пересматривает —
см. шапку); отклонённых кандидатов, не вошедших в пятёрку, в рамках этой проверки не выявлялось. Если
пользователь одобрит полный пересмотр, дальнейший поиск кандидатов должен идти по цикльному методу
(`docs/rules/youtube-performances.md`, п. «Масштабирование», §2) — из полных записей Winterreise, уже
внесённых в реестр альбомов проекта.

## Источники

- jpc.de, страница альбома Quasthoff/Spencer «Winterreise D. 911»: https://www.jpc.de/jpcng/classic/detail/-/art/Franz-Schubert-1797-1828-Winterreise-D-911/hnum/8690605
- HMV Japan, Fischer-Dieskau/Moore «Winterreise» (1962, UHQCD): https://www.hmv.co.jp/en/artist_Schubert-1797-1828_000000000034589/item_Winterreise-Dietrich-Fischer-Dieskau-Br-Gerald-Moore-P-1962-UHQCD_7872259
- Internet Archive, Peter Anders/Raucheisen Winterreise 1945: https://archive.org/details/PeterAndersWinterreiseD911Schubert1945_201802
- Discogs, «Hans Hotter Sings Schubert Winterreise (The 1942 DG Recordings)»: https://www.discogs.com/release/13638959-Hans-Hotter-Michael-Raucheisen-Franz-Schubert-Hans-Hotter-Sings-Schubert-Winterreise-The-1942-DG-Rec
- Naxos (BIS distribution), каталожная страница BIS-2444 (Mattei/Nilsson): https://www.naxos.com/CatalogueDetail/?id=BIS-2444
- Konserthuset Stockholm, программа «Winterreise with Peter Mattei» (2018): https://www.konserthuset.se/en/programme/calendar/concert/2018/winterreise-with-peter-mattei/
- YouTube, заголовки видео (проверка соответствия № 20): `9_LKY7K2o2Q`, `louDDB1zeGE`, `G6bUhKUxrE8`, `D8JqwfVs0QQ`, `MEiKrFsD1M8`
- Реестр альбомов проекта (уже верифицировано ранее): `planning/youtube/albums/complete-editions.md` (Fischer-Dieskau/Moore 1962), `planning/youtube/albums/male-recitalists.md` (Hotter, Anders)
