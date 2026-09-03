# Факты: «Wer sich der Einsamkeit ergibt» (Harfenspieler I, D 478/1)

Немецкий текст песни в проекте (три строфы: 4+4+8 строк, нерегулярная строфика — старик-Арфист поёт с нарастающим отчаянием): `app/src/data/songs/d478-1-wer-sich-der-einsamkeit-ergibt.json`. Поэт — Иоганн Вольфганг фон Гёте; в проектных метаданных бандла песня датирована 1816 годом (без цитаты первоисточника, см. «Не подтвердилось»). Досье поэта: `planning/research/poets/goethe.md` (факты оттуда переиспользуются со ссылкой «досье, Ф№»). История записей: топ-5 внутри этого же бандла (раздел «ТОП-5 ЗАПИСЕЙ»), исходный файл — `planning/youtube/data/d478-1-wer-sich-der-einsamkeit-ergibt.dossier.json`.

**Важная оговорка по составу бандла.** Манифест предзагрузки фиксирует, что ни один из профильных источников по самой песне не был успешно получен: `schubertlied.de` (страница песни) — `"ok": false`; `schubertsong.uk` (текст/комментарий Малколма Рена) — `"ok": false`; буклет Hyperion CDJ33023 — `"ok": false`, с пометкой «строка D478/1 в буклете не найдена»; LiederNet — `"ok": false`, `ddg_http: 0`. Собственная попытка добрать источники сетью (см. ниже, «Сетевые попытки») также не дала результата. Поэтому бандл фактически не содержит верифицируемых первичных данных о датировке, автографе, публикации, разночтениях с текстом Гёте и музыкальном разборе этой конкретной песни — только досье поэта (общего характера) и материалы топ-5 записей.

**Сетевые попытки (в пределах бюджета 2 обращений).** `curl` на `https://html.duckduckgo.com/html/?q=site%3Alieder.net+%22Wer+sich+der+Einsamkeit+ergibt%22` — пустой ответ (0 совпадений get_text.html). `curl` на `https://www.schubertsong.uk/text/wer-sich-der-einsamkeit-ergibt/` и на `https://www.schubertlied.de/die-lieder/wer-sich-der-einsamkeit-ergibt-d478` (варианты URL из манифеста) — оба вернули HTTP 404 (сеть отвечает: контрольный запрос к google.com дал 200, т.е. это не сбой сети, а неверный/нерабочий путь на самих ресурсах). Дальше сетевой бюджет не расходовался — работа велась по содержимому бандла.

**Доразведка раздела «Музыка» (отдельная задача).** Верный URL schubertlied.de для этой песни найден: `https://www.schubertlied.de/die-lieder/harfenspieler-wer-sich-der-einsamkeit-ergibt` (в манифесте был указан неверный слаг). Буклет Hyperion CDJ33023 при прямой загрузке PDF (`https://www.hyperion-records.co.uk/notes/33023-B.pdf`, а не `.../notes/CDJ33023-B.pdf`, как ошибочно пробовалось раньше) оказался доступен и содержит полное эссе Грэма Джонсона о D 478/1 — вывод манифеста «строка D478/1 в буклете не найдена» относился к неверно сформированному URL, а не к отсутствию текста. Источники: IMSLP — https://imslp.org/wiki/Harfenspieler,_D.478_(Schubert,_Franz); schubertlied.de — https://www.schubertlied.de/die-lieder/harfenspieler-wer-sich-der-einsamkeit-ergibt; Hyperion CDJ33023 (буклет, эссе Грэма Джонсона) — https://www.hyperion-records.co.uk/notes/33023-B.pdf

---

## 1. Датировка и возраст Шуберта

**Ф7.** Источники расходятся в дате сочинения первой версии D 478/1: schubertlied.de называет 13 ноября 1815 года (Шуберту было 18 лет), IMSLP — сентябрь 1816 года. — schubertlied.de — «Komponiert: 13. November 1815… Schubert war 18 Jahre alt, als er dieses Lied schrieb» / IMSLP — «Year/Date of Composition: 1816 September (1st version)» — uncertain (два источника дают разные годы; для страницы песни требуется дополнительная проверка, например по Neue Schubert-Ausgabe или Deutsch-Verzeichnis).

**Ф8.** D 478/1 — вторая по времени редакция (Vertonung) стихотворения Гёте «Wer sich der Einsamkeit ergibt»; первая редакция — D 325 (1815 год) — IMSLP — «D.478/1 is the 2nd setting of the text; D.325 is the 1st setting» — verified.

## 2. Публикация и автограф

**Ф9.** Вторая (окончательная) редакция D 478/1 впервые опубликована в 1822 году в Вене издательством Cappi & Diabelli (Cappi und Diabelli) как Op. 12 № 1, пластина 1161; первая редакция впервые опубликована лишь в 1895 году в Alte Gesamtausgabe — IMSLP + schubertlied.de — «First Publication: … 1822 – Vienna: Diabelli & Cappi, Plate 1161 (2nd version)» / «Die Veröffentlichung besorgte 1822 […] Verlagsnummer 1161» — verified (два источника подтверждают год, издателя и номер пластины).

**Ф10.** Указанная (объявленная) дата публикации по schubertlied.de — 13 декабря 1822 года — schubertlied.de — «Veröffentlichung (angezeigt): 13. Dezember 1822» — verified.

*Не найдено:* местонахождение автографа D 478/1.

## 3. Текст и источник

**Ф1.** Название и место песни в порядке проекта — «Wer sich der Einsamkeit ergibt (Harfenspieler I, D 478/1)»; в другом месте того же документа песня отнесена к «Gesänge des Harfners op. 12 № 1». — топ-5 записей (раздел этого бандла, файл-источник `planning/youtube/data/d478-1-wer-sich-der-einsamkeit-ergibt.dossier.json`) — «Wer sich der Einsamkeit ergibt (Harfenspieler I, D 478/1) — отбор топ-5 исполнений»; «Ярус — famous (Gesänge des Harfners op. 12 № 1)» — secondary (внутренний рабочий документ проекта, не первоисточник; отдельного подтверждения по schubertlied/schubertsong/IMSLP не удалось получить — см. «Не подтвердилось»).

Помимо этого — не подтвердилось. Первая публикация стихотворения Гёте, построчное сравнение с текстом Шуберта (по schubertsong.uk/LiederNet/буклету Джонсона), орфография эпохи — ничего из этого в бандле не зафиксировано цитатой. Известно, что стихотворение принадлежит роману Гёте «Wilhelm Meisters Lehrjahre» (песня Арфиста) — это общеизвестный факт о произведении Гёте, но в бандле нет источника с дословной цитатой, подтверждающей его специально для D 478/1, поэтому здесь не публикуется как проверенный факт.

## 4. Музыка

**Ф11.** Оригинальная тональность песни — ля минор (a-Moll / A minor) — schubertlied.de + IMSLP — «Originaltonart: a-Moll» / файл окончательной редакции подписан «(Original / High voice, A minor)» — verified (два независимых источника).

**Ф12.** Темповое указание разнится по редакциям: у первой версии (1816) — «Langsam», у второй, опубликованной как Op. 12 № 1 (1822), и у поздней редакции Neue Schubert-Ausgabe — «Sehr langsam» — IMSLP — «1st Version … Harfenspieler I (2nd setting – 1st version) (Langsam)» / «2nd Version … Harfenspieler I (2nd setting – 2nd version) (Sehr langsam)» — verified.

**Ф13.** Шуберт точно следует авторской ремарке Гёте перед стихотворением («Старик посмотрел на струны и, тихо проиграв вступление, настроил их и запел») — вступление звучит как импровизация, нерешительно, будто исполняется не молодым певцом, а стариком, отягощённым заботами; это простое четырёхтактовое вступление приводит к аккорду ля минор и при этом несёт в себе тяжкую скорбь — Hyperion CDJ33023, эссе Грэма Джонсона — «Schubert writes a prelude which fits this description like a glove. The introduction sounds improvised, tentative certainly, perhaps even a little absent-minded… this simple four-bar introduction which leads us to an A minor chord is somehow invested with towering grief» — verified.

**Ф14.** Начальные слова («Wer sich der Einsamkeit ergibt») восходят по арпеджио с крещендо, будто сдавленные долго сдерживаемым чувством, которое наконец прорывается в пении, — весь этот раздел звучит как импровизированный девиз, ещё не начавшаяся собственно песня об участи Арфиста — Hyperion CDJ33023, эссе Грэма Джонсона — «The opening words […] climb up an arpeggio with a crescendo; they seem tight with an emotion hitherto suppressed and which now breaks out in song» — verified.

**Ф15.** Орнаментика вокальной партии отсутствовала в рукописи 1816 года и была добавлена при подготовке издания 1822 года — по мнению Джонсона, здесь чувствуется рука певца Иоганна Михаэля Фогля — Hyperion CDJ33023, эссе Грэма Джонсона — «The ornamentation of the vocal line is not found in the 1816 copy and was added when the work was prepared for publication in 1822. We detect here the hand of the singer Johann Michael Vogl» — secondary (мнение/атрибуция автора эссе, не задокументированный факт).

**Ф16.** Аккомпанемент во второй части песни (на словах «Es schleicht ein Liebender…») переходит в почти безликое сопровождение триолями; Джонсон связывает характер вокальной партии здесь с итальянской кантиленой, поскольку Арфист — итальянец (как и Миньон, он «из страны, где цветут лимоны») — Hyperion CDJ33023, эссе Грэма Джонсона — «The floridity of the vocal writing is supported by an almost anonymous accompaniment in triplets. It seems obvious that Schubert gave this music the character of an Italian cantilena precisely because the harper is an Italian» — secondary (интерпретационное суждение).

**Ф17.** Шуберт повторяет последние четыре строки стихотворения, превращая песню в четырёхстрофную вместо трёхстрофной по тексту; тесситура на словах «im Grabe sein» уходит на самое дно теноровой партии, а первое «da lässt sie mich allein», внезапно взятое высоко, отмечено фортиссимо пугающей силы — Hyperion CDJ33023, эссе Грэма Джонсона — «Schubert repeats the last four lines of the poem to make a song of four rather than three strophes… The tessitura of 'im Grabe sein' burrows right down to the bottom of the tenor's range… the first 'da lässt sie mich allein', suddenly high in contrast, is marked with a fortissimo of frightening vehemence» — verified.

**Ф18.** Этот финальный пассаж и постлюдия дополнительно усилены нисходящими октавами в партии левой руки — в духе баса-остинато арии Дидоны Пёрселла «When I am laid in earth»; Джонсон предполагает, что именно учитель Шуберта Сальери мог познакомить ученика с традицией итальянского lamento с басом, нисходящим по тетрахорду — Hyperion CDJ33023, эссе Грэма Джонсона — «This passage, as well as the postlude, is rendered even more eloquent by sinking octaves in the left-hand accompaniment in the manner of Purcell's great aria for Dido 'When I am laid in earth'» — secondary (интерпретационная параллель автора эссе).

*Не найдено:* точное число тактов; редакция Neue Schubert-Ausgabe (Serie IV, Bd. 1b, издание Walther Dürr, Bärenreiter, пластина BA 5506, 1970) упомянута на IMSLP только библиографически — её собственный текст (предисловие) не открывался.

## 5. Смыслы и интерпретации

Не подтвердилось напрямую по этой песне. Общий контекст — из досье поэта: любимый песенный поэт Шуберта, автор слов более чем к 70 песням композитора (досье, Ф10) — но интерпретационных суждений именно о «Wer sich der Einsamkeit ergibt» в бандле нет.

## 6. Рецепция и документы эпохи

Не подтвердилось для этой песни отдельно. Общий фон переписки Шуберт–Гёте (тетрадь 1816 года, посвящение опуса 19, дневник Гёте, поздний отзыв об «Erlkönig») задокументирован в досье поэта (досье, Ф12–Ф21), но ни один из этих документов в бандле не связан цитатой именно с D 478/1 — включать их в текст песни как относящиеся к ней было бы натяжкой.

## 7. Судьба и наследие

Не подтвердилось. Данных о позднейшей истории (переиздания, включение в собрания, влияние) для этой конкретной песни в бандле нет.

## 8. Записи

Данные — из раздела «ТОП-5 ЗАПИСЕЙ» этого бандла (файл-источник: досье `planning/youtube/data/d478-1-wer-sich-der-einsamkeit-ergibt.dossier.json`, дата отбора 2026-08-17, все видео проверены через oEmbed 2026-08-17).

**Ф2.** №1 — Thomas Quasthoff (баритон) / Charles Spencer (фортепиано); сессии 25–26 и 28–29 мая 1993, Historischer Reitstadel, Ноймаркт; альбом RCA Victor Red Seal 09026 618642 «Goethe-Lieder» (изд. 1995), даты сессий — по буклету в Discogs (id 8778752). Видео: nGm3fGXztSA (Thomas Quasthoff - Topic). — топ-5 записей (этот бандл) — «сессии 25–26 и 28–29 мая 1993, Historischer Reitstadel, Ноймаркт; RCA Victor Red Seal 09026 618642 «Goethe-Lieder» (изд. 1995; буклет в Discogs 8778752 даёт точные даты сессий)» — secondary (первично не перепроверялось, источник — рабочий свод проекта).

**Ф3.** №2 — Dietrich Fischer-Dieskau (баритон) / Jörg Demus (фортепиано); сессии 13–14 сентября 1959, Studio Lankwitz, Берлин; DG SLPM 138 117 «Ein Schubert-Goethe-Liederabend» (изд. 1960). Видео: IkK2ne6J7Ro (Fischer-Dieskau - Topic). — топ-5 записей (этот бандл) — «сессии 13–14 сентября 1959, Studio Lankwitz, Берлин; DG SLPM 138 117 «Ein Schubert-Goethe-Liederabend» (изд. 1960; реестр альбомов проекта признаёт сессию «записанной на вокальном пике певца»)» — secondary.

**Ф4.** №3 — Hermann Prey (баритон) / Gerald Moore (фортепиано); альбом Columbia C 80 584 / 33 WSX 560 «Lieder von Franz Schubert nach Gedichten von Schiller und Goethe»; год сессии — 1960 (по QA-ревизии волны «1819–1821»: сессия документирована Греем, classical-discography.org, id 173654, «16–18 января 1960, Berlin-Zehlendorf»; трек-лист подтверждён Discogs 6820641). Видео: 2x7wZI6U_uc (Hermann Prey - Topic). — топ-5 записей (этот бандл) — «сессия Columbia C 80 584 / STC 80584 теперь документирована — Грей (classical-discography.org, id 173654): 16–18 января 1960, Berlin-Zehlendorf; трек-лист подтверждён Discogs 6820641» — secondary.

**Ф5.** №4 — Peter Pears (тенор) / Benjamin Britten (фортепиано); Decca-рецитал, ныне в боксе «Britten — The Performer: Complete Decca Recordings» (Decca 478 5672, 2013; Discogs 11416609 подтверждает состав, но не датирует сессию), публикуется как «1960?» (дата не подтверждена дискографически). Видео: o9yy38z1zWY (Peter Pears - Topic). — топ-5 записей (этот бандл) — «Decca-рецитал, ныне в боксе «Britten — The Performer: Complete Decca Recordings» (Decca 478 5672, 2013; Discogs 11416609 подтверждает состав, но датирует сессии только CD1–CD2); год не подтверждён дискографически — публикуется как «1960?»» — uncertain (дата не установлена по правилам проекта).

**Ф6.** №5 — Christoph Prégardien (тенор) / Graham Johnson (фортепиано); запись сентябрь 1994, изд. май 1995; The Hyperion Schubert Edition, Vol. 23 «Songs of 1816» (CDJ33023); критическая цитата — Gramophone Critics' Choice: «this wondrous offering will rank among its most precious jewels … Prégardien is a prince among tenors». Видео: 4LgduHvS4Bo (Graham Johnson - Topic). — топ-5 записей (этот бандл) — «запись сентябрь 1994, изд. май 1995; The Hyperion Schubert Edition, Vol. 23 «Songs of 1816» (CDJ33023). … GRAMOPHONE CRITICS' CHOICE, «…this wondrous offering will rank among its most precious jewels … Prégardien is a prince among tenors» (Gramophone, со страницы Hyperion)» — secondary.

*Примечание к разделу 8:* том Hyperion, к которому отнесена запись Прегардьена, назван «Songs of 1816» — это косвенно согласуется с датировкой «1816» из заголовка бандла (см. раздел 1), но и это — данные о томе антологии, а не прямая цитата о дате сочинения D 478/1; как самостоятельный факт датировки не публикуется.

---

## Не подтвердилось / не найдено

- Точная дата сочинения D 478/1 — источники расходятся (schubertlied.de: 13.11.1815; IMSLP: сентябрь 1816) — см. Ф7; согласовать по дальнейшей проверке (Neue Schubert-Ausgabe/Deutsch-Verzeichnis).
- Автограф — местонахождение рукописи не найдено ни в одном из проверенных источников (IMSLP, schubertlied.de, буклет Hyperion).
- Первая публикация стихотворения Гёте и построчное сравнение текста Шуберта с оригиналом поэта (в т.ч. орфография эпохи) — schubertsong.uk и LiederNet так и не открылись при доразведке (правильный URL schubertsong.uk для этой песни не установлен; страница по прежнему URL из манифеста отдаёт 404).
- Число тактов, полный текст предисловия Neue Schubert-Ausgabe (издание Walther Dürr, 1970) — на IMSLP есть только библиографическая карточка.
- Рецепция современников и документы эпохи, относящиеся именно к этой песне (не к общему корпусу песен Шуберта на слова Гёте).
- Дальнейшая судьба и наследие произведения помимо истории редакций (см. Ф7–Ф10).
- Собственная попытка добрать LiederNet через DuckDuckGo не вернула ни одной ссылки на `get_text.html`; прямые попытки открыть указанные в манифесте URL schubertsong.uk и schubertlied.de дали HTTP 404 — вероятно, пути в манифесте не соответствуют текущей структуре этих сайтов; повторная проверка правильных адресов вручную не проводилась (вне сетевого бюджета этого бандла).
