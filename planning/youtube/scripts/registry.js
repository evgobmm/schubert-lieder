// Мега-реестр альбомов: одноразовое критичное исследование (сильная модель, по правилу
// workflow.md «Экономия лимитов» п.1). 4 группы → planning/youtube/albums/<group>.md.
// Факты альбома исследуются один раз и наследуются всеми песнями корпуса.

export const meta = {
  name: 'albums-registry',
  description: 'Мега-реестр шубертовских альбомов: полные издания, мужчины, женщины, современные серии',
  phases: [{ title: 'Реестр', detail: '4 группы параллельно, сильная модель' }],
}

const ROOT = '/workspaces/schubert-lieder'
const DIR = `${ROOT}/planning/youtube/albums`

const COMMON = `Ты составляешь опорный реестр для конвейера отбора YouTube-исполнений всех ~600 песен Шуберта. Прочитай сначала: ${ROOT}/docs/rules/youtube-performances.md (правила, особенно «Верификация данных» и «Масштабирование»), ${ROOT}/planning/research/singers-digest.md (фонд певцов), ${ROOT}/planning/youtube/albums.md (пилотный реестр — НЕ дублируй его позиции, но можешь уточнять).

Формат карточки альбома (одна строка): "- **Певец — Название альбома (лейбл кат.номер, зап. <год/диапазон>)** — пианист; происхождение/сессии с источником; критическая репутация (премии, оценки — с источником); YouTube: Topic/official/нет. Хвосты помечай «?»."
Группируй по певцам (### Фамилия Имя (голос, годы)). Данные — только с источниками: дискографии, Discogs API (api.discogs.com через curl — работает без токена; веб-интерфейс блокируется), MusicBrainz API, база Майкла Грея classical-discography.org (сессии/матрицы HMV и др.), WebSearch/WebFetch пока доступны; метаданные YouTube-загрузок — не источник дат. НЕ выдумывай: нет источника — ставь «?». Временных файлов в репозиторий не писать; субагентов не спавнить; работать последовательно. В финальном ответе — только счётчики (певцов, альбомов) и 3 самых ценных находки.`

const groups = [
  {
    file: 'complete-editions.md',
    title: 'Полные издания и большие серии',
    body: `Задача: реестр ПОЛНЫХ изданий песен Шуберта в файл ${DIR}/complete-editions.md. Обязательно: (1) Hyperion Schubert Edition (Graham Johnson, 1987–2000) — ВСЕ 37 томов: певец/певцы тома, год записи, каталожный номер; (2) Naxos Deutsche Schubert-Lied-Edition (Eisenlohr) — все тома: певец, год, номер; (3) Fischer-Dieskau/Moore DG «Sämtliche Lieder» (1966–72) — структура томов, конвенция года в проекте (1969); его же ранние EMI-циклы 1950-х; (4) Goerne Schubert Edition (harmonia mundi, 12 томов) — пианисты и годы каждого тома; (5) антология EMI «Schubert Lieder on Record»; (6) прочие большие своды (Prey, Ameling Philips, Souzay Philips/DG, Fischer-Dieskau прочие). Это самый переиспользуемый файл реестра — точность важнее охвата.`,
  },
  {
    file: 'male-recitalists.md',
    title: 'Мужчины: старая школа и послевоенные',
    body: `Задача: реестр шубертовских альбомов/сессий певцов-мужчин старой школы и послевоенных в файл ${DIR}/male-recitalists.md. Охвати как минимум: Schlusnus, Hüsch, Erb, Kipnis, Janssen, Tauber, Duhan, Hotter (все шубертовские программы вне Winterreise), Anders, Patzak, Schiøtz, Dermota, Wunderlich (все источники Шуберта), Prey (все эпохи: EMI 1960-х, Philips 1970-х, Denon/Capriccio 1980-х), Souzay, Schreier (с Рихтером, Шифом и др.), Haefliger, Berry, Krause, Adam, Moll, Lorenz, Leib, Protschka, Blochwitz. По каждому: альбомы с годами записи, пианистами, лейблами, репутацией; пик/спад формы, если дайджест не покрывает.`,
  },
  {
    file: 'female-recitalists.md',
    title: 'Женщины: старая школа и послевоенные',
    body: `Задача: реестр шубертовских альбомов/сессий певиц в файл ${DIR}/female-recitalists.md. Охвати как минимум: Elisabeth Schumann (HMV-сессии по годам — база Грея очень полезна), Lehmann, Flagstad, Ferrier, Seefried, Della Casa, Güden, Schwarzkopf (сверься с пилотным реестром, дополни лишь новое), Ludwig (EMI/DG программы), Baker (EMI с Муром, Hyperion, BBC), Ameling (Philips свод, ранние EMI), Janowitz (DG 1977-78 4LP), Mathis, Popp (EMI 1983 и пр.), Norman, Fassbaender, Auger, M. Price, Lott, Bonney, Hendricks, McLaughlin, Ziesak. По каждой: альбомы, годы записи, пианисты, лейблы, репутация.`,
  },
  {
    file: 'modern-series.md',
    title: 'Современные серии и альбомы (1990+)',
    body: `Задача: реестр современных шубертовских альбомов в файл ${DIR}/modern-series.md. Обязательно: Hasselhorn «Schubert 200» (harmonia mundi, с Bushakevitz — ВСЕ вышедшие выпуски с датами записи/издания и премиями; также его диск с Middleton 2021); Bostridge (EMI/Warner альбомы, Wigmore); Gerhaher/Huber (все шубертовские RCA/Sony: Abendbilder 2005, Nachtviolen, Ferne Geliebte и пр., премии); Prégardien (Challenge/Teldec: Poetisches Tagebuch 2015 и др.); Güra/Berner (harmonia mundi тематические); Trekel, Holzmair (Philips), Keenlyside, Maltman, Appl, Boesch/Martineau, Padmore, Finley; женщины: Sampson/Middleton (BIS), Konradi, Tilling, Karg, Damrau, Fink/Huber, Kleiter. По каждому: годы записи, пианист, лейбл, критическая репутация (премии с источником), YouTube-присутствие.`,
  },
]

phase('Реестр')
const results = await parallel(groups.map((g) => () =>
  agent(`${g.body}\n\n${COMMON}`, { label: g.file, phase: 'Реестр', model: 'fable', effort: 'high' })
))

return results.map((r, i) => ({ group: groups[i].file, summary: r ? String(r).slice(0, 600) : null }))
