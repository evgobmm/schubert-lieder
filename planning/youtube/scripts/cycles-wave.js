// Цикльная волна: Die schöne Müllerin (D 795, 20 песен) и Schwanengesang (D 957 + 965A, 14).
// Метод по правилам («Масштабирование», п. 2): исследуются ПОЛНЫЕ записи цикла
// (одно исследование на цикл, глубина famous); топ-5 каждой песни составляется из
// выбранных полных записей (per-song videoId с Topic-каналов); песни с самостоятельной
// концертной жизнью получают обычное пер-песенное досье и могут отклоняться от
// цикльного списка. Ориентир структуры данных — Winterreise (единые 5 исполнителей).

export const meta = {
  name: 'yt-cycles',
  description: 'Циклы Müllerin и Schwanengesang: топ-5 полных записей → per-song видео',
  phases: [
    { title: 'Циклы', detail: 'исследование полных записей, 2 агента' },
    { title: 'Ранжирование', detail: 'топ-5 записей цикла (сильная модель)' },
    { title: 'Видео', detail: 'per-song videoId для каждой выбранной записи' },
    { title: 'Соло-песни', detail: 'самостоятельные хиты циклов — пер-песенная проверка' },
  ],
}

const ROOT = '/workspaces/schubert-lieder'
const RULES = `${ROOT}/docs/rules/youtube-performances.md`
const DIGEST = `${ROOT}/planning/research/singers-digest.md`
const REG = `${ROOT}/planning/youtube/albums.md + ${ROOT}/planning/youtube/albums/*.md`
const CHECK = `${ROOT}/planning/youtube/scripts/yt-check.js`

const COMMON = `Общие требования: временные файлы — только в scratchpad; субагентов не спавнить; факты только с источниками; метаданные YouTube — не источник дат. Источники: реестр альбомов, Discogs API (api.discogs.com, curl), MusicBrainz API, база Грея classical-discography.org, WebSearch/WebFetch пока доступны; yt-dlp "ytsearch12:<запрос>" --flat-playlist --print "%(id)s\\t%(title)s\\t%(channel)s\\t%(duration)s"; живость: node ${CHECK} <ids>.`

const CYCLES = [
  {
    key: 'muellerin', d: 'D 795', title: 'Die schöne Müllerin', n: 20,
    section: 'muellerin',
    solo: [
      { d: '795/1', title: 'Das Wandern' }, { d: '795/2', title: 'Wohin?' },
      { d: '795/7', title: 'Ungeduld' },
    ],
    hints: 'Ключевые полные записи по дайджесту/реестру: Wunderlich/Giesen DG 1966; Fischer-Dieskau (EMI 1961 Moore, DG 1971 Moore); Schiøtz/Moore 1945; Hüsch/Müller 1935; Prey; Schreier/Schiff; Bostridge (Johnson Hyperion т.25 / Uchida); Goerne; Güra/Berner; Quasthoff/Zeyen DG 2005 — ПРИОРИТЕТ №1 правил; Hasselhorn/Bushakevitz 2023 (Diapason d\\'or).',
  },
  {
    key: 'schwanengesang', d: 'D 957 + D 965A', title: 'Schwanengesang', n: 14,
    section: 'schwanengesang',
    solo: [
      { d: '957/4', title: 'Ständchen («Leise flehen meine Lieder»)' },
      { d: '957/13', title: 'Der Doppelgänger' }, { d: '957/12', title: 'Am Meer' },
      { d: '957/14', title: 'Die Taubenpost (D 965A)' },
    ],
    hints: 'Ключевые полные записи: Hotter (1954 EMI Moore); Fischer-Dieskau (EMI 1951? Moore, DG 1972 Moore); Quasthoff/Zeyen DG 2001 — ПРИОРИТЕТ №1; Schlusnus (частично); Anders; Schreier; Goerne/Brendel или Schneider; Prégardien; Gerhaher/Huber; Hasselhorn? Учти: цикл посмертный, порядок номеров стандартный (Rellstab 1-7, Heine 8-13, Taubenpost 14).',
  },
]

const CYCLE_TOP_SCHEMA = {
  type: 'object',
  properties: {
    cycle: { type: 'string' },
    performances: {
      type: 'array', maxItems: 5,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '«Фамилия — Фамилия пианиста»' },
          year: { description: 'число или строка-диапазон с «?»' },
          album: { type: 'string' },
          rationale: { type: 'string' },
        },
        required: ['name', 'year', 'album', 'rationale'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['cycle', 'performances', 'notes'],
}

const VIDEOS_SCHEMA = {
  type: 'object',
  properties: {
    songs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          d: { type: 'string' },
          entries: {
            type: 'array', maxItems: 5,
            items: {
              type: 'object',
              properties: { videoId: { type: 'string' }, name: { type: 'string' }, year: {} },
              required: ['videoId', 'name', 'year'],
            },
          },
        },
        required: ['d', 'entries'],
      },
    },
    missing: { type: 'array', items: { type: 'string' }, description: 'песня+исполнитель, для которых видео не нашлось' },
  },
  required: ['songs', 'missing'],
}

function researchPrompt(c) {
  return `Исследование ПОЛНЫХ записей цикла Шуберта «${c.title}» (${c.d}) для отбора топ-5 записей цикла (глубина famous).

Прочитай: ${RULES} (правила целиком: иерархия приоритетов, состав, год в плеере), ${DIGEST}, реестр (${REG}). Подсказки: ${c.hints}

Собери пул значительных ПОЛНЫХ записей цикла (15-25): по каждой — певец, пианист, год записи с источником, лейбл, состояние голоса, критическая репутация ЦИКЛА (сравнительные обзоры, klassik-prisma, Gramophone, антологии), YouTube-доступность per-song треков (Topic-каналы; проверь выборочно 2-3 песни цикла через yt-dlp — цикл должен быть доступен ПОТРЕКОВО, иначе непубликуем). Приоритетные певцы правил обязательно: Квастхоф (записал ли цикл — если да, его запись всегда №1 при достойном качестве), Фишер-Дискау (какая из его версий лучшая по правилам — состояние голоса, ранняя при прочих равных), Хоттер, Андерс, Шварцкопф/Э. Шуман/Людвиг/Попп (для мужских циклов — проверить и записать отрицательный результат).
Запиши досье в ${ROOT}/planning/youtube/data/cycle-${c.key}.dossier.json ({"cycle","candidates":[...],"priority_check":{...}}). Верни 3-4 предложения: главные кандидаты.

${COMMON}`
}

function rankPrompt(c) {
  return `Составь ТОП-5 полных записей цикла «${c.title}» (${c.d}) по строгой иерархии правил.

Прочитай: ${RULES}, ${ROOT}/planning/youtube/data/cycle-${c.key}.dossier.json, ${DIGEST}. Образец результата — Winterreise в ${ROOT}/app/src/data/performances.json (ключи 911/*): пять исполнителей, единые для всех песен цикла, первая — главная.

Порядок: строгая иерархия (Квастхоф №1, если его запись достойна → Фишер-Дискау → звёзды прошлого по качеству → современные по качеству); состав: желательно 3 записи до 1990 + 2 с 1990 (из них 1 с 2015) — только при наличии достойных; у певца с несколькими версиями цикла — состояние голоса, при прочих равных ранняя. Каждая выбранная запись обязана иметь потрековые официальные загрузки на YouTube (проверь по 1-2 песни через yt-dlp; запись без потрековой доступности замени следующей по рангу, отметив это).
Напиши обоснование ${ROOT}/planning/research/cycle-${c.key}-top5.md (полный формат famous: топ-5 с фактами, отклонённые, резервы). Верни JSON: cycle, performances (5, порядок = иерархия), notes.

${COMMON}`
}

function videosPrompt(c, top, chunk) {
  return `Сбор per-song videoId для цикла «${c.title}»: песни ${chunk.map((s) => 'D ' + s.d + ' («' + s.title_de + '»)').join(', ')}.

Выбранные записи цикла (порядок фиксирован, менять нельзя): ${JSON.stringify(top.performances.map((p) => ({ name: p.name, year: p.year, album: p.album })))}

Для КАЖДОЙ песни из списка найди videoId каждой из 5 записей: yt-dlp "ytsearch10:Schubert <название песни> <фамилия певца>" --flat-playlist (предпочитай Topic-каналы; сверяй длительность с типичной для песни; для одинаковых названий проверяй принадлежность альбому по yt-dlp метаданным трека). Все найденные ID проверь ОДНИМ вызовом node ${CHECK} <все ids>. Если у какой-то записи видео песни нет/мертво — пропусти её в этой песне (entries меньше 5) и занеси в missing.
Верни songs: [{d, entries: [{videoId, name, year}] в ЗАДАННОМ порядке записей}], missing.

${COMMON}`
}

function soloPrompt(c, top, s) {
  return `Пер-песенная проверка хита цикла: «${s.title}» (D ${s.d}) из «${c.title}» — песня с самостоятельной концертной жизнью, её топ-5 может отличаться от цикльного.

Цикльный выбор: ${JSON.stringify(top.performances.map((p) => p.name + ' ' + p.year))}

Прочитай ${RULES} и ${ROOT}/planning/youtube/data/cycle-${c.key}.dossier.json. Исследуй ВНЕцикльные значительные записи именно этой песни (рециталы, исторические одиночные записи — yt-dlp + реестр + веб; например, для Ständchen D 957/4 — исторические записи теноров, для Ungeduld — рецитальные версии). Если внецикльная запись по иерархии/качеству вытесняет цикльную позицию — замени (обоснуй); иначе оставь цикльный список. Все videoId — node ${CHECK}. Допиши раздел про эту песню в ${ROOT}/planning/research/cycle-${c.key}-top5.md (Edit). Верни JSON: {"songs":[{"d":"${s.d}","entries":[...]}],"missing":[]}.

${COMMON}`
}

const index = JSON.parse(await agent(
  `Прочитай файл ${ROOT}/app/src/data/index.json и верни СТРОГО JSON-массив песен секций muellerin и schwanengesang: [{"d","title_de","section"}] в порядке следования в файле. Больше ничего.`,
  { label: 'индекс циклов', phase: 'Циклы', model: 'haiku', effort: 'low' }
).then((r) => (typeof r === 'string' ? r.replace(/^[^\[]*/, '').replace(/[^\]]*$/, '') : JSON.stringify(r))))

const results = await pipeline(
  CYCLES,
  (c) => agent(researchPrompt(c), { label: `цикл:${c.key}`, phase: 'Циклы', model: 'opus', effort: 'high' }),
  async (research, c) => {
    if (!research) return null
    return agent(rankPrompt(c), { label: `топ-5:${c.key}`, phase: 'Ранжирование', effort: 'high', schema: CYCLE_TOP_SCHEMA })
  },
  async (top, c) => {
    if (!top) return null
    const cycleSongs = index.filter((s) => s.section === c.section)
    const soloDs = new Set(c.solo.map((s) => s.d))
    const regular = cycleSongs.filter((s) => !soloDs.has(s.d))
    const chunks = []
    for (let i = 0; i < regular.length; i += 6) chunks.push(regular.slice(i, i + 6))
    const vids = (await parallel(chunks.map((ch, i) => () =>
      agent(videosPrompt(c, top, ch), { label: `видео:${c.key}:${i + 1}`, phase: 'Видео', model: 'sonnet', effort: 'medium', schema: VIDEOS_SCHEMA })
    ))).filter(Boolean)
    const solos = (await parallel(c.solo.map((s) => () =>
      agent(soloPrompt(c, top, s), { label: `соло:D${s.d}`, phase: 'Соло-песни', model: 'opus', effort: 'high', schema: VIDEOS_SCHEMA })
    ))).filter(Boolean)
    return {
      cycle: c.key, top,
      songs: [...vids.flatMap((v) => v.songs), ...solos.flatMap((v) => v.songs)],
      missing: [...vids.flatMap((v) => v.missing), ...solos.flatMap((v) => v.missing)],
    }
  }
)

return results.filter(Boolean)
