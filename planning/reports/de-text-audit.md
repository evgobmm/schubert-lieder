# Аудит немецких текстов корпуса против предзагруженных источников

Сгенерирован скриптом `planning/scripts/check-de-texts.js` (0 токенов) 2026-08-31, обновлён после расширения на ранее непокрытые песни.

Что делает скрипт: для каждой переведённой песни ищет в кэшах волн предзагруженные страницы
`schubertsong.uk` (критический текст Петера Растля) и `schubertlied.de` и проверяет, встречается ли каждая
строка `lines_de` в тексте источника. Совпадением считается и точное вхождение, и вхождение после снятия
шубертовских повторов строки, и вхождение по «свободной» форме (орфография эпохи: Thal/Tal, seyn/sein,
удвоения, диакритика, композиты слитно/раздельно). Остаются только настоящие словесные расхождения:
печатается, какие слова стоят в проекте и какие — в источнике.

**Расхождение в этом списке — ещё не дефект.** Оно может означать: (а) Шуберт пел не то, что напечатано
у поэта (частый и законный случай — тогда правится не текст, а раздел «Стихотворение»); (б) источник даёт
другую редакцию; (в) артефакт вёрстки страницы-источника; (г) настоящую ошибку в тексте проекта.
Вердикт по каждому пункту выносится агентом по двум источникам; немецкий текст правится только по
протоколу проверки фактов, §1.



### D 6 «Des Mädchens Klage» — расхождений 6 (источники: schubertsong.uk)
  1.1  в проекте: brauset   |   в источнике (schubertsong.uk): braust
  1.7  в проекте: —   |   в источнике (schubertsong.uk): es / sich / die / welle
  1.9  в проекте: vom / vom / getrubt   |   в источнике (schubertsong.uk): von / getrubet
  2.7  в проекте: —   |   в источнике (schubertsong.uk): rufe
  4.3  в проекте: —   |   в источнике (schubertsong.uk): sie
  4.11  в проекте: —   |   в источнике (schubertsong.uk): sind / der / liebe

### D 15 «Der Geistertanz» — расхождений 5 (источники: schubertsong.uk)
  1.4  в проекте: die / luftigen / schweber   |   в источнике (schubertsong.uk): —
  2.1  в проекте: hinab / und / empor / hinab / und / empor   |   в источнике (schubertsong.uk): —
  3.1  в проекте: wir / luftigen / schweber   |   в источнике (schubertsong.uk): —
  3.3  в проекте: beim / schlafenden / herrn   |   в источнике (schubertsong.uk): —
  3.4  в проекте: der / geister / der / geister / von / fern   |   в источнике (schubertsong.uk): —

### D 30 «Der Jüngling am Bache» — расхождений 2 (источники: schubertsong.uk)
  2.1  в проекте: trauere   |   в источнике (schubertsong.uk): traure
  2.5  в проекте: der   |   в источнике (schubertsong.uk): diese

### D 100 «Geisternähe» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  3.3  в проекте: epheuranke   |   в источнике (schubertsong.uk): efeuranke

### D 95 «Adelaide» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  2.3  в проекте: strahlt   |   в источнике (schubertsong.uk): stralt

### D 114 «Romanze» — расхождений 2 (источники: schubertsong.uk)
  8.1  в проекте: klagt / einmuthig / alt / jung   |   в источнике (schubertsong.uk): flur / burg / leer
  10.1  в проекте: das / fraulein / horchte   |   в источнике (schubertsong.uk): ich / schleiche / herum

### D 116 «Der Geistertanz» — расхождений 1 (источники: schubertsong.uk)
  5.1  в проекте: und   |   в источнике (schubertsong.uk): —

### D 117 «Das Mädchen aus der Fremde» — расхождений 1 (источники: schubertsong.uk)
  6.3  в проекте: —   |   в источнике (schubertsong.uk): gaben

### D 119 «Nachtgesang» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  1.1  в проекте: gieb   |   в источнике (schubertlied.de): gib
  5.2  в проекте: giebst   |   в источнике (schubertlied.de): gibst

### D 123 «Sehnsucht» — расхождений 3 (источники: schubertsong.uk, schubertlied.de)
  1.6  в проекте: am   |   в источнике (schubertlied.de): um
  4.4  в проекте: geschehen   |   в источнике (schubertlied.de): geschehn
  5.9  в проекте: da / bin / da / bin / begluckt   |   в источнике (schubertlied.de): —

### D 126 «Szene aus "Faust"» — расхождений 3 (источники: schubertsong.uk)
  2.7  в проекте: ahnungsvoller   |   в источнике (schubertsong.uk): ahndungsvoller
  5.7  в проекте: aufgeschaffen   |   в источнике (schubertsong.uk): aufgeschreckt
  8.1  в проекте: eng   |   в источнике (schubertsong.uk): bang

### D 162 «Nähe des Geliebten» — расхождений 1 (источники: schubertsong.uk)
  4.3  в проекте: bald   |   в источнике (schubertsong.uk): —

### D 163 «Sängers Morgenlied» — расхождений 2 (источники: schubertsong.uk)
  1.3  в проекте: siegend   |   в источнике (schubertsong.uk): brichst / steigend
  2.4  в проекте: auf   |   в источнике (schubertsong.uk): in

### D 165 «Sängers Morgenlied» — расхождений 3 (источники: schubertsong.uk)
  1.2  в проекте: siegend   |   в источнике (schubertsong.uk): steigend
  2.4  в проекте: auf   |   в источнике (schubertsong.uk): in
  4.5  в проекте: fluchtige   |   в источнике (schubertsong.uk): fluchtge

### D 166 «Amphiaraos» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  4.4  в проекте: periklymenos   |   в источнике (schubertsong.uk): periclimenos

### D 187 «Stimme der Liebe» — расхождений 1 (источники: schubertsong.uk)
  2.6  в проекте: —   |   в источнике (schubertsong.uk): die

### D 191 «Des Mädchens Klage» — расхождений 4 (источники: schubertsong.uk)
  1.7  в проекте: vom   |   в источнике (schubertsong.uk): von
  2.4  в проекте: —   |   в источнике (schubertsong.uk): wunsche
  3.6  в проекте: verschwundner   |   в источнике (schubertsong.uk): verschwundener
  4.6  в проекте: verschwundner   |   в источнике (schubertsong.uk): verschwundener

### D 192 «Der Jüngling am Bache» — расхождений 1 (источники: schubertsong.uk)
  3.8  в проекте: bleibt   |   в источнике (schubertsong.uk): ist

### D 193 «An den Mond» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  1.3  в проекте: phantasien   |   в источнике (schubertlied.de): fantaseyn

### D 194 «Die Mainacht» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  2.4  в проекте: giebt   |   в источнике (schubertsong.uk): gibt

### D 138 «Rastlose Liebe» — расхождений 1 (источники: schubertsong.uk)
  2.8  в проекте: es   |   в источнике (schubertsong.uk): das

### D 197 «An die Apfelbäume, wo ich Julien erblickte» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  3.1  в проекте: engelkuss   |   в источнике (schubertsong.uk): engelskuss

### D 206 «Liebeständelei» — расхождений 4 (источники: schubertsong.uk, schubertlied.de)
  4.6  в проекте: lassst   |   в источнике (schubertsong.uk): —
  4.7  в проекте: lassst   |   в источнике (schubertsong.uk): —
  4.8  в проекте: lassst   |   в источнике (schubertsong.uk): —
  5.1  в проекте: wonne   |   в источнике (schubertsong.uk): freuden

### D 207 «Der Liebende» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  1.4  в проекте: wenn   |   в источнике (schubertsong.uk): wem
  1.7  в проекте: begluckt   |   в источнике (schubertsong.uk): —

### D 208 «Die Nonne» — расхождений 2 (источники: schubertsong.uk)
  17.2  в проекте: die   |   в источнике (schubertsong.uk): ein
  17.5  в проекте: bleicher   |   в источнике (schubertsong.uk): dunkler

### D 214 «Die Laube» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  5.1  в проекте: entstromt   |   в источнике (schubertlied.de): als

### D 215A «Meeres Stille» — расхождений 1 (источники: schubertsong.uk)
  1.7  в проекте: ungeheuern   |   в источнике (schubertsong.uk): ungeheuren

### D 216 «Meeres Stille» — расхождений 1 (источники: schubertsong.uk)
  1.7  в проекте: ungeheuern   |   в источнике (schubertsong.uk): ungeheuren

### D 219 «Das Finden» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  1.2  в проекте: sanftmuthig   |   в источнике (schubertsong.uk): edel
  5.4  в проекте: edlen   |   в источнике (schubertsong.uk): edeln

### D 224 «Wandrers Nachtlied» — расхождений 1 (источники: schubertsong.uk)
  1.4  в проекте: fullst   |   в источнике (schubertsong.uk): fullest

### D 226 «Erster Verlust» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  3.2  в проекте: wer   |   в источнике (schubertsong.uk): —

### D 227 «Idens Nachtgesang» — расхождений 2 (источники: schubertsong.uk)
  2.1  в проекте: liebevollen   |   в источнике (schubertsong.uk): liebvollen
  6.4  в проекте: ewigen   |   в источнике (schubertsong.uk): ewgen

### D 228 «Von Ida» — расхождений 4 (источники: schubertsong.uk)
  2.1  в проекте: was / ahndest   |   в источнике (schubertsong.uk): —
  2.6  в проекте: ahndest   |   в источнике (schubertsong.uk): ahnest
  2.8  в проекте: ahndest   |   в источнике (schubertsong.uk): ahnest
  2.13  в проекте: ahndungschaurenden   |   в источнике (schubertsong.uk): einsamtraurenden

### D 229 «Die Erscheinung» — расхождений 6 (источники: schubertsong.uk)
  1.8  в проекте: giebt   |   в источнике (schubertsong.uk): gibt
  2.7  в проекте: nasste   |   в источнике (schubertsong.uk): fasste
  3.1  в проекте: trauernd   |   в источнике (schubertsong.uk): traurig
  3.6  в проекте: so   |   в источнике (schubertsong.uk): sie
  4.7  в проекте: erhaben   |   в источнике (schubertsong.uk): bedeutend
  5.6  в проекте: eint   |   в источнике (schubertsong.uk): knupft

### D 231 «Das Sehnen» — расхождений 5 (источники: schubertsong.uk)
  2.1  в проекте: die / ihr   |   в источнике (schubertsong.uk): —
  3.2  в проекте: liebeflehn   |   в источнике (schubertsong.uk): liebesflehn
  7.4  в проекте: ungetrostet   |   в источнике (schubertsong.uk): ungestrostet
  7.5  в проекте: nach / dem / holden   |   в источнике (schubertsong.uk): —
  7.6  в проекте: nach / dem / holden   |   в источнике (schubertsong.uk): —

### D 221 «Der Abend» — расхождений 3 (источники: schubertsong.uk, schubertlied.de)
  1.4  в проекте: und   |   в источнике (schubertlied.de): umschleyert
  2.5  в проекте: ahndungsreiches   |   в источнике (schubertlied.de): ahnungsreiches
  4.8  в проекте: huldigen   |   в источнике (schubertlied.de): huldgen

### D 233 «Geist der Liebe» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  2.5  в проекте: fordert   |   в источнике (schubertsong.uk): fodert

### D 237 «Abends unter der Linde» — расхождений 1 (источники: schubertsong.uk)
  2.4  в проекте: —   |   в источнике (schubertsong.uk): grauen

### D 238 «Die Mondnacht» — расхождений 4 (источники: schubertsong.uk, schubertlied.de)
  1.3  в проекте: glanzumrauschten   |   в источнике (schubertsong.uk): glanzberauschten
  3.3  в проекте: schwahnet   |   в источнике (schubertsong.uk): schwanet
  4.3  в проекте: sehnen   |   в источнике (schubertsong.uk): dehnen
  4.4  в проекте: —   |   в источнике (schubertsong.uk): loschet

### D 240 «Huldigung» — расхождений 6 (источники: schubertsong.uk, schubertlied.de)
  1.7  в проекте: ungeschminkte   |   в источнике (schubertsong.uk): zu / beginnen
  1.11  в проекте: nennen   |   в источнике (schubertsong.uk): denken
  1.12  в проекте: huldanemone   |   в источнике (schubertsong.uk): nichts / ist
  1.18  в проекте: wie / ganz   |   в источнике (schubertsong.uk): huldin
  4.8  в проекте: wie   |   в источнике (schubertsong.uk): als
  5.6  в проекте: wenn   |   в источнике (schubertsong.uk): wann

### D 241 «Alles um Liebe» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  3.1  в проекте: wornach   |   в источнике (schubertsong.uk): wonach
  6.2  в проекте: freudeloser   |   в источнике (schubertsong.uk): freundeloser

### D 250 «Das Geheimnis» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  4.1  в проекте: zehen   |   в источнике (schubertsong.uk): —

### D 255 «Der Rattenfänger» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  2.1  в проекте: gutgelaunte   |   в источнике (schubertsong.uk): vielgewandte

### D 256 «Der Schatzgräber» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  1.9  в проекте: eigenem   |   в источнике (schubertsong.uk): eignem
  5.9  в проекте: zum / schlusse   |   в источнике (schubertsong.uk): —

### D 257 «Heidenröslein» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  3.1  в проекте: brachs   |   в источнике (schubertsong.uk): —

### D 291 «Dem Unendlichen» — расхождений 2 (источники: schubertsong.uk)
  4.1  в проекте: —   |   в источнике (schubertsong.uk): der / posaunen / chor
  5.1  в проекте: —   |   в источнике (schubertsong.uk): feierlichem / gang

### D 298 «Liane» — расхождений 4 (источники: schubertsong.uk, schubertlied.de)
  1.3  в проекте: —   |   в источнике (schubertsong.uk): hecken
  2.2  в проекте: rosig   |   в источнике (schubertsong.uk): rosen
  4.2  в проекте: denkt   |   в источнике (schubertsong.uk): denket
  4.3  в проекте: an   |   в источнике (schubertsong.uk): nur

### D 309 «Das gestörte Glück» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  1.6  в проекте: wenns   |   в источнике (schubertsong.uk): obs
  5.5  в проекте: in   |   в источнике (schubertsong.uk): im

### D 328 «Erlkönig» — расхождений 1 (источники: schubertsong.uk)
  5.5  в проекте: sie   |   в источнике (schubertsong.uk): —

### D 310 «Sehnsucht» — расхождений 1 (источники: schubertsong.uk)
  2.5  в проекте: der / nur   |   в источнике (schubertsong.uk): —

### D 312 «Hektors Abschied» — расхождений 4 (источники: schubertsong.uk)
  2.4  в проекте: pergamus   |   в источнике (schubertsong.uk): pergamos
  3.4  в проекте: pergamus   |   в источнике (schubertsong.uk): pergamos
  6.1  в проекте: recit   |   в источнике (schubertsong.uk): —
  6.7  в проекте: —   |   в источнике (schubertsong.uk): hektors / liebe

### D 313 «Die Sterne» — расхождений 1 (источники: schubertsong.uk)
  1.3  в проекте: gottes / funkeln   |   в источнике (schubertsong.uk): poets / title

### D 316 «An Rosa II» — расхождений 5 (источники: schubertsong.uk)
  2.2  в проекте: reget / das / sauseln / des / windes   |   в источнике (schubertsong.uk): —
  4.1  в проекте: reget / windes   |   в источнике (schubertsong.uk): regt / ewigen
  5.2  в проекте: verschwiegne   |   в источнике (schubertsong.uk): verschiegne
  7.1  в проекте: schopfte / freieren / odem   |   в источнике (schubertsong.uk): —
  7.2  в проекте: klomm / heroischer / felsenan   |   в источнике (schubertsong.uk): —

### D 317 «Idens Schwanenlied» — расхождений 2 (источники: schubertsong.uk)
  1.4  в проекте: stehn / so / trostlos / so / schaurig   |   в источнике (schubertsong.uk): es / stehen
  3.2  в проекте: linden   |   в источнике (schubertsong.uk): —

### D 322 «Hermann und Thusnelda» — расхождений 1 (источники: schubertsong.uk)
  5.4  в проекте: erzahlts   |   в источнике (schubertsong.uk): nektar / trinket

### D 325 «Harfenspieler» — расхождений 3 (источники: schubertsong.uk)
  1.1  в проекте: ergiebt   |   в источнике (schubertsong.uk): ergibt
  3.7  в проекте: im   |   в источнике (schubertsong.uk): —
  3.9  в проекте: —   |   в источнике (schubertsong.uk): sie

### D 362 «Zufriedenheit» — расхождений 2 (источники: schubertsong.uk)
  2.2  в проекте: glucks   |   в источнике (schubertsong.uk): —
  2.5  в проекте: zu / lacheln / drob   |   в источнике (schubertsong.uk): —

### D 388 «Laura am Klavier» — расхождений 1 (источники: schubertsong.uk)
  4.1  в проекте: itzt   |   в источнике (schubertsong.uk): jetzt

### D 390 «Entzückung an Laura» — расхождений 2 (источники: schubertsong.uk)
  1.3  в проекте: —   |   в источнике (schubertsong.uk): meinem
  2.3  в проекте: trunknes   |   в источнике (schubertsong.uk): trunken

### D 392 «Pflügerlied» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  15.1  в проекте: trauret   |   в источнике (schubertsong.uk): trauert

### D 393 «Die Einsiedelei» — расхождений 6 (источники: schubertsong.uk)
  2.4  в проекте: dichtbeblumten / heidekraut   |   в источнике (schubertsong.uk): dichten
  3.4  в проекте: nahe   |   в источнике (schubertsong.uk): wahre
  3.6  в проекте: phantasei   |   в источнике (schubertsong.uk): fantasei
  3.9  в проекте: in   |   в источнике (schubertsong.uk): wehn
  4.3  в проекте: kieselsteg   |   в источнике (schubertsong.uk): kieselsteig
  4.4  в проекте: verworrne   |   в источнике (schubertsong.uk): verworrene

### D 396 «Gruppe aus dem Tartarus» — расхождений 2 (источники: schubertsong.uk)
  2.2  в проекте: —   |   в источнике (schubertsong.uk): sperret
  2.5  в проекте: cocytus   |   в источнике (schubertsong.uk): kozytus

### D 404 «Die Herbstnacht» — расхождений 5 (источники: schubertsong.uk)
  1.3  в проекте: dass / harm / lust / verschliesst   |   в источнике (schubertsong.uk): —
  2.7  в проекте: —   |   в источнике (schubertsong.uk): muden
  5.3  в проекте: sennenreigentonen   |   в источнике (schubertsong.uk): abendsonnenschein
  7.4  в проекте: trauermelodein   |   в источнике (schubertsong.uk): herbstnacht
  13.1  в проекте: gieb   |   в источнике (schubertsong.uk): gib

### D 402 «Der Flüchtling» — расхождений 4 (источники: schubertsong.uk)
  1.2  в проекте: dustrer / das / junge / licht   |   в источнике (schubertsong.uk): —
  2.2  в проекте: strahlengruss / erwarmend   |   в источнике (schubertsong.uk): strahlenguss
  6.2  в проекте: purpurnem   |   в источнике (schubertsong.uk): purpurnen / kussen
  6.4  в проекте: sanften   |   в источнике (schubertsong.uk): in

### D 403 «Lied (Ins stille Land)» — расхождений 2 (источники: schubertsong.uk)
  1.6  в проекте: dammervoller   |   в источнике (schubertsong.uk): trummervoller
  2.4  в проекте: kunftigen   |   в источнике (schubertsong.uk): kunftgen

### D 414 «Geist der Liebe» — расхождений 2 (источники: schubertsong.uk)
  3.1  в проекте: wirkt / und / strebt   |   в источнике (schubertsong.uk): —
  4.1  в проекте: o / fuhre   |   в источнике (schubertsong.uk): wer / bist

### D 436 «Klage» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  2.6  в проекте: —   |   в источнике (schubertsong.uk): tranennass

### D 398 «Frühlingslied» — расхождений 4 (источники: schubertsong.uk, schubertlied.de)
  1.2  в проекте: maienglocken   |   в источнике (schubertlied.de): mayenglocken
  1.6  в проекте: malt   |   в источнике (schubertlied.de): mahlt
  2.1  в проекте: mai   |   в источнике (schubertlied.de): may
  2.4  в проекте: solche   |   в источнике (schubertlied.de): diese

### D 399 «Auf den Tod einer Nachtigall» — расхождений 1 (источники: schubertsong.uk)
  2.7  в проекте: tanzten   |   в источнике (schubertsong.uk): tanzeten

### D 430 «Die frühe Liebe» — расхождений 1 (источники: schubertsong.uk)
  4.1  в проекте: blickte   |   в источнике (schubertsong.uk): —

### D 442 «Das große Halleluja» — расхождений 3 (источники: schubertsong.uk)
  2.1  в проекте: throne   |   в источнике (schubertsong.uk): —
  3.2  в проекте: letzten   |   в источнике (schubertsong.uk): lezten
  3.3  в проекте: niedergeworfne   |   в источнике (schubertsong.uk): niedergeworfene

### D 444 «Die Gestirne» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  9.3  в проекте: gebogenen   |   в источнике (schubertsong.uk): gebognen

### D 350 «Der Entfernten» — расхождений 2 (источники: schubertsong.uk)
  3.3  в проекте: des   |   в источнике (schubertsong.uk): das
  6.4  в проекте: und   |   в источнике (schubertsong.uk): —

### D 360 «Lied eines Schiffers an die Dioskuren» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  3.3  в проекте: —   |   в источнике (schubertsong.uk): hange

### D 369 «An Schwager Kronos» — расхождений 3 (источники: schubertsong.uk, schubertlied.de)
  1.1  в проекте: spute   |   в источнике (schubertsong.uk): spude
  4.1  в проекте: rings   |   в источнике (schubertsong.uk): der / blick
  4.2  в проекте: den / blick   |   в источнике (schubertsong.uk): rasch

### D 516 «Sehnsucht» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  1.6  в проекте: nur / du   |   в источнике (schubertlied.de): —
  2.7  в проекте: sterbender   |   в источнике (schubertlied.de): strebender

### D 473 «Liedesend» — расхождений 1 (источники: schubertsong.uk)
  5.2  в проекте: seine   |   в источнике (schubertsong.uk): die

### D 475 «Abschied» — расхождений 3 (источники: schubertsong.uk, schubertlied.de)
  1.14  в проекте: ach   |   в источнике (schubertlied.de): o
  1.23  в проекте: lebt   |   в источнике (schubertlied.de): lebet
  1.25  в проекте: ach   |   в источнике (schubertlied.de): o

### D 476 «Rückweg» — расхождений 3 (источники: schubertsong.uk, schubertlied.de)
  1.3  в проекте: denn / mein   |   в источнике (schubertsong.uk): was / dein
  1.5  в проекте: ach   |   в источнике (schubertsong.uk): denn
  3.1  в проекте: —   |   в источнике (schubertsong.uk): treue

### D 484 «Gesang der Geister über den Wassern» — расхождений 8 (источники: schubertsong.uk)
  1.1  в проекте: dann   |   в источнике (schubertsong.uk): —
  1.2  в проекте: leis / rauschend / dann   |   в источнике (schubertsong.uk): —
  2.3  в проекте: zum / abgrund   |   в источнике (schubertsong.uk): —
  2.4  в проекте: zu / dem / abgrund   |   в источнике (schubertsong.uk): —
  2.5  в проекте: zu / dem / abgrund   |   в источнике (schubertsong.uk): —
  3.1  в проекте: schleichet / er   |   в источнике (schubertsong.uk): —
  3.2  в проекте: schleichet / er / das / wiesenthal / hin   |   в источнике (schubertsong.uk): —
  3.3  в проекте: alle / gestirne   |   в источнике (schubertsong.uk): —

### D 344 «Am ersten Maimorgen» — расхождений 1 (источники: schubertsong.uk)
  3.4  в проекте: meinem   |   в источнике (schubertsong.uk): meinen

### D 495 «Abendlied der Fürstin» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  1.3  в проекте: stille   |   в источнике (schubertsong.uk): —

### D 496 «Bei dem Grabe meines Vaters» — расхождений 4 (источники: schubertsong.uk, schubertlied.de)
  3.1  в проекте: wie / ein / stern / aus / bessern / welten   |   в источнике (schubertsong.uk): —
  3.6  в проекте: oben   |   в источнике (schubertsong.uk): segen / dieser / mann
  5.2  в проекте: —   |   в источнике (schubertsong.uk): milder
  8.2  в проекте: ach / sie / haben / ihn / begraben   |   в источнике (schubertsong.uk): —

### D 496A «Klage um Ali Bey» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  1.3  в проекте: abudahab   |   в источнике (schubertsong.uk): aboudahab

### D 497 «An die Nachtigall» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  1.4  в проекте: frohlich   |   в источнике (schubertsong.uk): frolich
  1.7  в проекте: schlafer   |   в источнике (schubertsong.uk): amor

### D 500 «Phidile» — расхождений 4 (источники: schubertsong.uk)
  1.2  в проекте: —   |   в источнике (schubertsong.uk): weiter
  1.3  в проекте: wusst / ich   |   в источнике (schubertsong.uk): —
  1.5  в проекте: noch   |   в источнике (schubertsong.uk): und / woher
  5.1  в проекте: wie   |   в источнике (schubertsong.uk): war

### D 502 «Herbstlied» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  3.5  в проекте: —   |   в источнике (schubertsong.uk): goldnen

### D 457 «An die untergehende Sonne» — расхождений 1 (источники: schubertsong.uk)
  4.8  в проекте: wonne   |   в источнике (schubertsong.uk): frieden

### D 524 «Der Alpenjäger» — расхождений 1 (источники: schubertsong.uk)
  1.1  в проекте: hohem   |   в источнике (schubertsong.uk): hohen

### D 526 «Fahrt zum Hades» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  1.4  в проекте: —   |   в источнике (schubertsong.uk): sein
  3.4  в проекте: —   |   в источнике (schubertsong.uk): o / ferne

### D 527 «Schlaflied» — расхождений 1 (источники: schubertsong.uk)
  2.1  в проекте: ihren   |   в источнике (schubertsong.uk): irren

### D 530 «An eine Quelle» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  1.6  в проекте: —   |   в источнике (schubertsong.uk): darin
  1.7  в проекте: nochmal   |   в источнике (schubertsong.uk): mahl

### D 531 «Der Tod und das Mädchen» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  2.2  в проекте: gieb   |   в источнике (schubertsong.uk): gib

### D 532 «Das Lied vom Reifen» — расхождений 1 (источники: schubertsong.uk)
  1.5  в проекте: mit / reifelein   |   в источнике (schubertsong.uk): —

### D 297 «Augenlied» — расхождений 5 (источники: schubertsong.uk)
  1.3  в проекте: gewonnen   |   в источнике (schubertsong.uk): geronnen
  2.2  в проекте: wie   |   в источнике (schubertsong.uk): wo
  3.5  в проекте: —   |   в источнике (schubertsong.uk): treue
  3.6  в проекте: —   |   в источнике (schubertsong.uk): treue
  3.7  в проекте: charon   |   в источнике (schubertsong.uk): acheron

### D 539 «Am Strome» — расхождений 4 (источники: schubertsong.uk, schubertlied.de)
  2.2  в проекте: manchmal   |   в источнике (schubertsong.uk): manchmahl
  2.3  в проекте: andern   |   в источнике (schubertsong.uk): sturme
  3.4  в проекте: —   |   в источнике (schubertsong.uk): finde
  3.5  в проекте: —   |   в источнике (schubertsong.uk): finde

### D 541 «Memnon» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  1.3  в проекте: geborenen   |   в источнике (schubertsong.uk): nachtgebornen
  2.1  в проекте: und / gotterohren   |   в источнике (schubertsong.uk): menschenohren

### D 542 «Antigone und Oedip» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  2.6  в проекте: vernichte   |   в источнике (schubertsong.uk): —

### D 549 «Mahomets Gesang» — расхождений 1 (источники: schubertsong.uk)
  2.2  в проекте: nieder   |   в источнике (schubertsong.uk): —

### D 551 «Pax vobiscum» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  3.3  в проекте: ersehnten   |   в источнике (schubertsong.uk): erwunschten

### D 559 «Schweizerlied» — расхождений 3 (источники: schubertsong.uk)
  3.1  в проекте: —   |   в источнике (schubertsong.uk): d
  3.3  в проекте: summer   |   в источнике (schubertsong.uk): vogle
  3.7  в проекте: —   |   в источнике (schubertsong.uk): zue

### D 561 «Nach einem Gewitter» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  1.3  в проекте: kehret / holde / rothe / wieder   |   в источнике (schubertsong.uk): so
  2.3  в проекте: in / bluthen / wohlgeruche   |   в источнике (schubertsong.uk): —

### D 536 «Der Schiffer» — расхождений 1 (источники: schubertsong.uk)
  4.3  в проекте: himmlische   |   в источнике (schubertsong.uk): himmliche

### D 583 «Gruppe aus dem Tartarus» — расхождений 2 (источники: schubertsong.uk)
  2.2  в проекте: —   |   в источнике (schubertsong.uk): sperret
  2.5  в проекте: cocytus   |   в источнике (schubertsong.uk): kozytus

### D 585 «Atys» — расхождений 3 (источники: schubertsong.uk)
  1.5  в проекте: —   |   в источнике (schubertsong.uk): woran
  3.4  в проекте: flehn   |   в источнике (schubertsong.uk): flehen
  5.1  в проекте: —   |   в источнике (schubertsong.uk): im / scheidenden / strahl

### D 587 «An den Frühling» — расхождений 1 (источники: schubertsong.uk)
  2.1  в проекте: da   |   в источнике (schubertsong.uk): du

### D 611 «Auf der Riesenkoppe» — расхождений 1 (источники: schubertsong.uk)
  4.2  в проекте: grenze   |   в источнике (schubertsong.uk): granze

### D 649 «Der Wanderer» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  2.3  в проекте: dunkeln   |   в источнике (schubertlied.de): —
  2.7  в проекте: widerscheine   |   в источнике (schubertlied.de): wiederscheine

### D 654 «An die Freunde» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  3.1  в проекте: —   |   в источнике (schubertsong.uk): spannt
  3.5  в проекте: —   |   в источнике (schubertsong.uk): doch / nein / spannt

### D 638 «Der Jüngling am Bache» — расхождений 2 (источники: schubertsong.uk)
  2.1  в проекте: trauere   |   в источнике (schubertsong.uk): traure
  3.8  в проекте: bleibt   |   в источнике (schubertsong.uk): ist

### D 637 «Hoffnung» — расхождений 1 (источники: schubertsong.uk)
  3.4  в проекте: bessern   |   в источнике (schubertsong.uk): besserm

### D 669 «Beim Winde» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  2.6  в проекте: zur / ruhigen / statte   |   в источнике (schubertsong.uk): —
  2.19  в проекте: stohnen   |   в источнике (schubertsong.uk): storen

### D 670 «Die Sternennächte» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  2.1  в проекте: reichbesternt   |   в источнике (schubertsong.uk): gestirnt

### D 672 «Nachtstück» — расхождений 2 (источники: schubertsong.uk)
  1.24  в проекте: —   |   в источнике (schubertsong.uk): o / lasst
  1.25  в проекте: —   |   в источнике (schubertsong.uk): o / lasst

### D 673 «Die Liebende schreibt» — расхождений 3 (источники: schubertsong.uk)
  4.4  в проекте: mein / einzig / gluck   |   в источнике (schubertsong.uk): gib / zeichen
  4.5  в проекте: zu / mir   |   в источнике (schubertsong.uk): auf / erden / ist
  4.6  в проекте: gieb   |   в источнике (schubertsong.uk): dein / freundlicher / zu / gib

### D 677 «Strophe aus "Die Götter Griechenlands"» — расхождений 1 (источники: schubertsong.uk)
  3.4  в проекте: —   |   в источнике (schubertsong.uk): kehre / wieder

### D 699 «Der entsühnte Orest» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  3.4  в проекте: leichter   |   в источнике (schubertsong.uk): —
  3.6  в проекте: leichter   |   в источнике (schubertsong.uk): —

### D 707 «Der zürnenden Diana» — расхождений 8 (источники: schubertsong.uk)
  2.3  в проекте: noch / reizender / noch / reizender   |   в источнике (schubertsong.uk): du / himmlisch / weib
  2.7  в проекте: streun   |   в источнике (schubertsong.uk): streuen
  2.8  в проекте: streun   |   в источнике (schubertsong.uk): streuen
  2.9  в проекте: —   |   в источнике (schubertsong.uk): noch / reizender
  3.3  в проекте: streun   |   в источнике (schubertsong.uk): streuen
  3.4  в проекте: streun   |   в источнике (schubertsong.uk): streuen
  4.1  в проекте: erfreun   |   в источнике (schubertsong.uk): erfreuen
  5.1  в проекте: erfreun   |   в источнике (schubertsong.uk): erfreuen

### D 716 «Grenzen der Menschheit» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  5.2  в проекте: begrenzt   |   в источнике (schubertsong.uk): begranzt

### D 728 «Johanna Sebus» — расхождений 2 (источники: schubertsong.uk)
  2.2  в проекте: reicht   |   в источнике (schubertsong.uk): ist
  6.1  в проекте: sicheres   |   в источнике (schubertsong.uk): sichres

### D 749 «Herrn Josef Spaun, Assessor in Linz» — расхождений 2 (источники: schubertsong.uk)
  3.18  в проекте: ja   |   в источнике (schubertsong.uk): —
  3.19  в проекте: der   |   в источнике (schubertsong.uk): —

### D 767 «Willkommen und Abschied» — расхождений 4 (источники: schubertsong.uk)
  3.1  в проекте: sah   |   в источнике (schubertsong.uk): seh
  3.3  в проекте: —   |   в источнике (schubertsong.uk): auf
  4.9  в проекте: —   |   в источнике (schubertsong.uk): geliebt / zu / werden
  4.12  в проекте: —   |   в источнике (schubertsong.uk): gotter

### D 770 «Drang in die Ferne» — расхождений 3 (источники: schubertsong.uk, schubertlied.de)
  7.5  в проекте: sichs   |   в источнике (schubertsong.uk): —
  8.6  в проекте: er / fand   |   в источнике (schubertsong.uk): glucklich
  8.7  в проекте: er / fand   |   в источнике (schubertsong.uk): glucklich

### D 793 «Das Geheimnis» — расхождений 3 (источники: schubertsong.uk)
  1.9  в проекте: verbirg   |   в источнике (schubertsong.uk): —
  3.2  в проекте: liebe   |   в источнике (schubertsong.uk): uns
  4.1  в проекте: zehen   |   в источнике (schubertsong.uk): —

### D 794 «Der Pilgrim» — расхождений 1 (источники: schubertsong.uk)
  4.4  в проекте: himmlisch   |   в источнике (schubertsong.uk): ewig

### D 827 «Nacht und Träume» — расхождений 1 (источники: schubertsong.uk)
  1.7  в проекте: holde   |   в источнике (schubertsong.uk): heilge

### D 807 «Auflösung» — расхождений 6 (источники: schubertsong.uk, schubertlied.de)
  3.1  в проекте: —   |   в источнике (schubertsong.uk): und / store
  3.2  в проекте: —   |   в источнике (schubertsong.uk): und / store
  3.4  в проекте: —   |   в источнике (schubertsong.uk): nimmer
  4.1  в проекте: —   |   в источнике (schubertsong.uk): und / store
  4.2  в проекте: —   |   в источнике (schubertsong.uk): und / store
  4.4  в проекте: —   |   в источнике (schubertsong.uk): nimmer

### D 808 «Gondelfahrer» — расхождений 1 (источники: schubertsong.uk)
  1.2  в проекте: —   |   в источнике (schubertsong.uk): geisterreihn

### D 853 «Auf der Bruck» — расхождений 1 (источники: schubertsong.uk)
  3.1  в проекте: feld   |   в источнике (schubertsong.uk): tal

### D 862 «Um Mitternacht» — расхождений 10 (источники: schubertsong.uk)
  2.3  в проекте: lieblich   |   в источнике (schubertsong.uk): oder
  3.3  в проекте: wollt / ich   |   в источнике (schubertsong.uk): —
  3.5  в проекте: tausend   |   в источнике (schubertsong.uk): wollt / ich
  4.4  в проекте: seh / ich / glanzen / dunkeln   |   в источнике (schubertsong.uk): dunklen
  4.5  в проекте: hats / zu / flustern   |   в источнике (schubertsong.uk): droben
  4.8  в проекте: droben / hat   |   в источнике (schubertsong.uk): —
  4.11  в проекте: dunkeln   |   в источнике (schubertsong.uk): dunklen
  4.13  в проекте: hat   |   в источнике (schubertsong.uk): —
  5.1  в проекте: wiegt / so   |   в источнике (schubertsong.uk): wiege
  5.5  в проекте: lispelt / oft   |   в источнике (schubertsong.uk): geliebtes

### D 874 «O Quell, was strömst du rasch und wild» — расхождений 1 (источники: schubertsong.uk)
  1.8  в проекте: von   |   в источнике (schubertsong.uk): im

### D 878 «Am Fenster» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  3.5  в проекте: wahnt   |   в источнике (schubertsong.uk): —

### D 881 «Fischerweise» — расхождений 2 (источники: schubertsong.uk)
  4.1  в проекте: —   |   в источнике (schubertsong.uk): und
  4.3  в проекте: giebt   |   в источнике (schubertsong.uk): gibt

### D 884 «Über Wildemann» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  1.6  в проекте: wohl / manche / meile   |   в источнике (schubertsong.uk): —

### D 801 «Dithyrambe» — расхождений 3 (источники: schubertsong.uk)
  2.9  в проекте: reicht / mir / die / schale   |   в источнике (schubertsong.uk): —
  2.12  в проекте: reicht / mir / die / schale   |   в источнике (schubertsong.uk): —
  2.14  в проекте: reicht   |   в источнике (schubertsong.uk): —

### D 869 «Totengräber-Weise» — расхождений 1 (источники: schubertsong.uk)
  3.7  в проекте: schimmert   |   в источнике (schubertsong.uk): brennet

### D 931 «Der Wallensteiner Lanzknecht beim Trunk» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  5.5  в проекте: mein   |   в источнике (schubertsong.uk): nu / trost / ihn / gott

### D 932 «Der Kreuzzug» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  5.3  в проекте: kreuzeszug   |   в источнике (schubertsong.uk): —

### D 933 «Des Fischers Liebesglück» — расхождений 1 (источники: schubertsong.uk, schubertlied.de)
  1.2  в проекте: blass / strahlig / vom / zimmer   |   в источнике (schubertsong.uk): —

### D 896A «Sie in jedem Liede» — расхождений 1 (источники: schubertsong.uk)
  2.5  в проекте: barette   |   в источнике (schubertsong.uk): —

### D 927 «Vor meiner Wiege» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  1.3  в проекте: hilflos   |   в источнике (schubertsong.uk): hulflos
  4.3  в проекте: ein / kuhliges / zelt   |   в источнике (schubertsong.uk): gar / dammerig / grun

### D 938 «Der Winterabend» — расхождений 4 (источники: schubertsong.uk, schubertlied.de)
  2.4  в проекте: nur / der / mondenschein   |   в источнике (schubertsong.uk): herein
  2.9  в проекте: —   |   в источнике (schubertsong.uk): aus
  3.2  в проекте: —   |   в источнике (schubertsong.uk): schaue
  4.1  в проекте: seufze / still / und / sinne   |   в источнике (schubertsong.uk): —

### D 939 «Die Sterne» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  3.4  в проекте: leuchten   |   в источнике (schubertlied.de): uben
  6.1  в проекте: weisen   |   в источнике (schubertlied.de): leuchten

### D 943 «Auf dem Strom» — расхождений 3 (источники: schubertsong.uk, schubertlied.de)
  2.5  в проекте: ach   |   в источнике (schubertsong.uk): —
  3.8  в проекте: eilen   |   в источнике (schubertsong.uk): weiter
  4.6  в проекте: graun   |   в источнике (schubertsong.uk): o / grauen

### D 926 «Das Weinen» — расхождений 2 (источники: schubertsong.uk, schubertlied.de)
  1.3  в проекте: recht / wie / ein / heilungsbronnen   |   в источнике (schubertsong.uk): —
  2.1  в проекте: und / fasset / weh / und / pein   |   в источнике (schubertsong.uk): —

### D 866/3 «Die Männer sind mechant!» — расхождений 3 (источники: schubertsong.uk)
  1.1  в проекте: —   |   в источнике (schubertsong.uk): o
  1.9  в проекте: —   |   в источнике (schubertsong.uk): o
  2.10  в проекте: wars   |   в источнике (schubertsong.uk): —

### D 866/4 «Irdisches Glück» — расхождений 3 (источники: schubertsong.uk)
  3.2  в проекте: ehrenkranz   |   в источнике (schubertsong.uk): ehrenglanz
  4.10  в проекте: bruder   |   в источнике (schubertsong.uk): denn / gewiss
  4.11  в проекте: bruder   |   в источнике (schubertsong.uk): denn / gewiss

ИТОГО: проверено песен 285, с расхождениями 147, строк-расхождений 328; без предзагруженного источника 35 (D 142, 478/1, 478/2, 693, 726, 727, 788, 877/2, 877/3, 883, 877/4, 911/1, 911/2, 911/3, 911/4, 911/5, 911/6, 911/7, 911/8, 911/9, 911/10, 911/11, 911/12, 911/13, 911/14, 911/15, 911/16, 911/17, 911/18, 911/19, 911/20, 911/21, 911/22, 911/23, 911/24)
