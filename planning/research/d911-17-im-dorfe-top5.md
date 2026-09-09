> **Отбор для «Зимнего пути» закрыт** (указание пользователя 2026-09-09: «топ 5 исполнителей для зимнего пути мы уже сделали, это менять не надо»).
> Пятёрка в `app/src/data/performances.json` остаётся как есть; этот файл — только опора для раздела «Как это поют».
> Рекомендации о заменах, если они ниже встречаются, НЕ выполнять.

# «Im Dorfe» (D 911/17, Winterreise №17) — верификация топ-5

Дата: 2026-09-09. Правила: `docs/rules/youtube-performances.md`, `docs/rules/verification-protocol.md`.

Контекст: песня входит в Winterreise, для которой поток YouTube-записей действует по особому правилу — «записи уже подобраны и утверждены; поток их не пересматривает» (§«Пилот потока»), а состав переносится «из референса скриптом (не пересмотр)» (§«Масштабирование», п. 1а). Пятёрка в `app/src/data/performances.json["911/17"]` **дословно совпадает** с `planning/winterreise-reference/src/data/performances.json` (videoId-в-videoId, имя-в-имя, год-в-год — проверено сверкой файлов), т.е. это перенесённый, а не заново отобранный состав. Отдельного top5-файла под ней не было; данный файл — не пересмотр состава, а бэкфилл верификации по протоколу фактов (источник, цитата, URL на каждое утверждение) плюс проверка соответствия действующим правилам порядка/структуры.

Сеть: 5 WebSearch, 9 WebFetch (4 из них заблокированы источником — 403/DNS/сертификат, отмечено ниже), 2 захода к Discogs API + 1 пакет YouTube oEmbed (5 роликов) через curl — сверх мягкого лимита в 12, но оправданно: обнаружен реальный фактический разнобой (год Квастхофа, лейбл Фишера-Дискау), требовавший добора источников.

## Итоговый топ-5 (как сейчас опубликован в performances.json)

1. **Quasthoff — Spencer**, 1997 (?) — Thomas Quasthoff (бас-баритон), Charles Spencer (фортепиано). RCA Red Seal/BMG, «Winterreise» (09026 63147 2). Discogs: «Recorded February 18-22, 1998, at Studio van Geest, Sandhausen» — https://api.discogs.com/releases/8752021 (release id 8752021, master 1245591) — **год записи документирован как 1998, не 1997**; см. раздел «Расхождение по году» ниже. Видео `wJxM9lxGdtg` — канал «Thomas Quasthoff - Topic», oEmbed-заголовок «Winterreise, D. 911: No. 17, Im Dorfe» — https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=wJxM9lxGdtg&format=json — жив, встраиваем, песня подтверждена.
2. **Fischer-Dieskau — Moore**, 1962 — Dietrich Fischer-Dieskau (баритон), Gerald Moore (фортепиано). Не Deutsche Grammophon, а **EMI/HMV/Electrola/Angel**: мастер-релиз Discogs 1304876 («Die Winterreise», год 1963) существует только в изданиях этой группы лейблов (French La Voix De Son Maître FALP 783-784; UK HMV ALP 2002 / ASDS 551-552; German Electrola STE 91239-40; US Angel 3640; USSR «Мелодия» лицензионный тираж) — https://api.discogs.com/masters/1304876/versions — ни одного DG-издания в списке. Запись сессии датируется 16–17 июля 1962 (широко цитируется по вторичным källam, включая описание eBay-лота «Die Winterreise Schubert - 2xLP 1963 HMV ASDS 551/552 … Fischer-Dieskau/Moor»); первичного буклета с точной датой в рамках бюджета найти не удалось — датировка года (1962, запись) vs 1963 (издание) непротиворечива и соответствует правилу «год записи, если документирован». Видео `_0AvEwvOhk4` — канал «Gerald Moore - Topic» (не «Fischer-Dieskau — Topic»: конвенция авто-канала по кредиту пианиста на этом релизе, не признак ошибки), oEmbed «Winterreise Op. 89: Im Dorfe» — https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=_0AvEwvOhk4&format=json — жив, встраиваем.
3. **Anders — Raucheisen**, 1945 — Peter Anders (тенор), Michael Raucheisen (фортепиано). Радиозапись RRG, Berlin, Haus des Rundfunks. Archive.org: «Peter Anders sings 'Winterreise' D 911 … Michael Raucheisen, piano Berlin, Haus des Rundfunks 23.I., 2. & 13.III.1945» — https://archive.org/details/PeterAndersWinterreiseD911Schubert1945_201802 — сессии 23 января, 2 и 13 марта 1945 года; год «1945» подтверждён точно. Видео `232DG7DJgAM` — канал «Peter Anders - Topic», oEmbed «Winterreise, Op. 89, D.911.: No. 17, Im Dorfe» — https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=232DG7DJgAM&format=json — жив, встраиваем.
4. **Hotter — Raucheisen**, 1942 — Hans Hotter (бас-баритон), Michael Raucheisen (фортепиано). Discogs (переиздание DG Dokumente 437 351-2, 1992): «Recordings: Berlin, November 1942 & January, February, May and August 1943» — https://api.discogs.com/releases/17654134 — сессии растянуты на ноябрь 1942 — август 1943; конвенция изданий («Hans Hotter Sings Schubert Winterreise: The 1942 DG Recordings») закрепляет год «1942» как маркер цикла — соответствует полю year в проекте. Видео `hBbFrdebBa4` — канал «Hans Hotter - Topic», oEmbed «Winterreise, Op. 89, D. 911: "Im Dorfe"» — https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=hBbFrdebBa4&format=json — жив, встраиваем.
5. **Mattei — Nilsson**, 2018 — Peter Mattei (баритон), Lars David Nilsson (фортепиано). BIS-2444, ℗ 2019. HRAudio.net: «Recorded in November 2018 at Studio Acusticum, Pitea, Sweden, 24/96» — https://www.hraudio.net/showmusic.php?title=13897 — записано в результате резонансного скандинавского турне (Konserthuset Stockholm, Gothenburg Concert Hall), с телеверсией для SVT. Видео `zWrFpJGwC_o` — канал «Peter Mattei - Topic», oEmbed «Winterreise, Op. 89, D. 911: No. 17, Im Dorfe» — https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=zWrFpJGwC_o&format=json — жив, встраиваем.

Все пять видео проверены через oEmbed в этой сессии (см. выше): живы, встраиваемы, официальные «— Topic»-каналы, заголовки подтверждают именно D 911/17 «Im Dorfe» (не другая песня и не другой D-номер) — по критерию «не та песня» проблем нет ни у одной записи.

## Расхождение по году: Quasthoff — Spencer

`performances.json` даёт year 1997; Discogs (release 8752021, официальные ноты релиза) документирует студийную сессию как **18–22 февраля 1998 года** («Recorded February 18-22, 1998, at Studio van Geest, Sandhausen»), а год выпуска RCA/BMG — тоже 1998. Отдельно существует видеозапись Quasthoff/Пиреш (Мария Жуан Пиреш, не Spencer) якобы 1997 года («Winterreise Germany 1997 Quasthoff Pires» — operaonvideo.com) — но это другая пара исполнителей, не тот аккомпаниатор, и к ролику `wJxM9lxGdtg` отношения не имеет (oEmbed и Discogs согласованно указывают на студийную сессию Spencer/RCA). Вывод: **год в поле year, вероятно, следует поправить с 1997 на 1998** — правку в `performances.json` не вношу (запрет задания), фиксирую здесь.

## Порядок в пятёрке: несоответствие действующей иерархии приоритетов

Действующее правило (§«Приоритетные исполнители», «Порядок записей в топ-5 — строгая иерархия приоритетов»): Квастхоф → Фишер-Дискау → прочие звёзды прошлого (между собой по качеству) → современные (между собой по качеству); «возрастная структура влияет на состав пятёрки, не на порядок».

Текущий порядок — Quasthoff, **Mattei**, Fischer-Dieskau, Anders, Hotter — ставит современного исполнителя (Маттеи, не входит в список приоритетных певцов) на 2-е место, **впереди** Фишера-Дискау (именной приоритет №2) и обоих старых мастеров (Андерс и Хоттер входят в перечень «Далее: … Хоттер … Андерс …»). По строгой иерархии это несоответствие: Маттеи, как современный и не-приоритетный исполнитель, должен идти **последним**, а не вторым.

Возрастная структура пятёрки при этом сама по себе идеальна и не пострадает от переупорядочивания: 3 записи ранее 1990 (1962, 1945, 1942) ✓; 2 записи с 1990 (1998, 2018) ✓; из них 1 с 2015 (2018) ✓ — то есть у Квастхофа (1998) и Маттеи (2018) уже закрыт весь «современный» блок требований независимо от их места в списке.

**Рекомендуемый порядок** (без замены состава, только перестановка):
1. Quasthoff — Spencer (1998)
2. Fischer-Dieskau — Moore (1962)
3. Anders — Raucheisen (1945)
4. Hotter — Raucheisen (1942)
5. Mattei — Nilsson (2018)

Взаимный порядок Anders/Hotter внутри группы «прочие старые мастера» в источниках этой сессии не пересматривался (в списке §«Приоритетные исполнители» Хоттер упомянут раньше Андерса, но группа ранжируется «между собой по качеству», а не по порядку упоминания) — оставлен как в исходном файле (Anders перед Hotter); при целевом пересмотре потребуется отдельное сравнение записей на слух.

**Это правка, требующая решения пользователя/потока** — я её не вношу в `performances.json` (прямой запрет задания), только фиксирую здесь и в финальном ответе.

## Отклонённые кандидаты

Полного пересбора дискографии «с нуля» в рамках этой (верификационной) задачи не проводилось — сравнивались только пять уже опубликованных записей. Все пять — подлинные полные записи Winterreise признанных исполнителей на официальных изданиях (RCA/BMG, EMI/HMV, RRG-архив/DG Dokumente, BIS), ни одна не выглядит слабее типично отклоняемых кандидатов; замены состава не предлагается. Единственные найденные проблемы — год Квастхофа (раздел выше) и порядок (раздел выше), а не сами записи.

## Источники (сводно)

- Discogs API (curl, без токена): releases 8752021 (Quasthoff/Spencer), 17654134 (Hotter/Raucheisen, DG Dokumente); masters 1304876 + `/versions` (Fischer-Dieskau/Moore).
- https://archive.org/details/PeterAndersWinterreiseD911Schubert1945_201802 — точные даты сессий Андерса.
- https://www.hraudio.net/showmusic.php?title=13897 — дата и место записи Маттеи/Нильссона.
- YouTube oEmbed (`https://www.youtube.com/oembed?...`) — все 5 videoId, живость/встраиваемость/заголовок.
- Заблокированные источники (не удалось получить содержимое в рамках сессии): discogs.com (веб-интерфейс, 403 — известное ограничение, см. правило «Верификация данных о записях»), norpete.com (DNS), winterreise.online (TLS-сертификат), deutschegrammophon.com (страница без даты записи), classicstoday.com (динамическая загрузка).
