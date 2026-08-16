// Воркфлоу одной волны подбора топ-5 исполнений (Workflow tool, scriptPath).
// args = { songs: [{ d, slug, title, tier }] }, tier: famous | medium | rare.
// Конвейер на песню: досье (дешёвый агент) → ранжирование (дорогая модель) →
// верификация (дешёвый агент, при проблемах — фикс-раунд); в конце — слияние
// фактов об альбомах в реестр. Публикацию в performances.json делает основная
// сессия скриптом publish.js по возвращённым данным.

export const meta = {
  name: 'yt-top5-wave',
  description: 'Волна подбора топ-5 исполнений: досье → ранжирование → верификация → реестр альбомов',
  phases: [
    { title: 'Досье', detail: 'исследование кандидатов каждой песни' },
    { title: 'Топ-5', detail: 'ранжирование и top5-файл' },
    { title: 'Верификация', detail: 'независимая проверка выбранных' },
    { title: 'Альбомы', detail: 'слияние фактов в реестр' },
  ],
}

const ROOT = '/workspaces/schubert-lieder'
const RULES = `${ROOT}/docs/rules/youtube-performances.md`
const DIGEST = `${ROOT}/planning/research/singers-digest.md`
const ALBUMS = `${ROOT}/planning/youtube/albums.md`
const DATA = `${ROOT}/planning/youtube/data`
const CHECK = `${ROOT}/planning/youtube/scripts/yt-check.js`

const COMMON = `Общие требования: не пиши временных файлов в репозиторий (только scratchpad); не спавнь субагентов — работай последовательно сам; НИКОГДА не выдумывай факты — у каждого факта источник; метаданные YouTube-загрузок и archive.org НЕ источник дат (регулярно врут) — даты только по дискографиям (буклеты, каталоги лейблов, CHARM для 78-х, Discogs с осторожностью). Инструменты: WebSearch и WebFetch подгрузи через ToolSearch("select:WebSearch,WebFetch"); поиск по YouTube — Bash: yt-dlp "ytsearch12:<запрос>" --flat-playlist --print "%(id)s\\t%(title)s\\t%(channel)s\\t%(duration)s\\t%(view_count)s"; проверка живости/встраиваемости — Bash: node ${CHECK} <id> [id...].`

const DOSSIER_SCHEMA = {
  type: 'object',
  properties: {
    d: { type: 'string' },
    candidates_count: { type: 'number' },
    dossier_path: { type: 'string' },
    summary: { type: 'string', description: '2-3 предложения: главные кандидаты и открытия' },
  },
  required: ['d', 'candidates_count', 'dossier_path', 'summary'],
}

const TOP5_SCHEMA = {
  type: 'object',
  properties: {
    d: { type: 'string' },
    entries: {
      type: 'array', maxItems: 5,
      items: {
        type: 'object',
        properties: {
          videoId: { type: 'string' },
          name: { type: 'string', description: 'Формат «Фамилия — Фамилия пианиста», латиницей, как в performances.json' },
          year: { type: 'number' },
        },
        required: ['videoId', 'name', 'year'],
      },
    },
    reserves: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          videoId: { type: 'string' }, name: { type: 'string' }, year: { type: 'number' },
          why: { type: 'string' },
        },
        required: ['name', 'year'],
      },
    },
    composition: {
      type: 'object',
      properties: { pre1990: { type: 'number' }, from1990: { type: 'number' }, from2015: { type: 'number' } },
      required: ['pre1990', 'from1990', 'from2015'],
    },
    notes: { type: 'string' },
  },
  required: ['d', 'entries', 'reserves', 'composition', 'notes'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    issues: { type: 'array', items: { type: 'string' } },
    corrections: { type: 'array', items: { type: 'string' }, description: 'Конкретные правки: что заменить и на что, с источником' },
  },
  required: ['ok', 'issues', 'corrections'],
}

function dossierPrompt(s) {
  return `Песня Шуберта: «${s.title}» (D ${s.d}, slug ${s.slug}). Составь ДОСЬЕ кандидатов для отбора топ-5 YouTube-исполнений.

Сначала прочитай: ${RULES} (правила целиком), ${DIGEST} (дайджест певцов), ${ALBUMS} (реестр альбомов, если существует), ${DATA}/${s.slug}.mb.json (каркас дискографии MusicBrainz), ${DATA}/${s.slug}.yt.json (generic-поиск YouTube).

Работа:
1. Собери пул ЗНАЧИТЕЛЬНЫХ записей песни: исполнители из MB + веб-исследование (сравнительные обзоры: klassik-prisma.de (Vergleich), Gramophone, MusicWeb, BBC Music Magazine; слепые тесты; страница песни на hyperion-records.co.uk — там же список записей Hyperion и заметки Грэма Джонсона; полные издания DG Fischer-Dieskau, Hyperion, Naxos DSLE). Для песни яруса «${s.tier}» ориентир пула: famous — 10–15, medium — 6–10, rare — все существующие значительные (может быть 2–5).
2. ОБЯЗАТЕЛЬНО по каждому приоритетному певцу из правил (Quasthoff, Fischer-Dieskau, Schwarzkopf, Hotter, Anders, E. Schumann, Ludwig, Popp): записал ли он/она эту песню? Ответ с источником; отрицательные результаты тоже фиксируй.
3. По КАЖДОМУ кандидату собери: певец; пианист; точный ГОД ЗАПИСИ с дискографическим источником; альбом/лейбл; возраст и состояние голоса певца в тот год (сверься с дайджестом); критическая репутация (конкретные оценки/цитаты с источниками, скепсис к пиару современных); YouTube-доступность: найди videoId через yt-dlp (предпочтение Topic/официальным каналам), проверь живость node-скриптом yt-check.
4. Запиши досье в ${DATA}/${s.slug}.dossier.json (это результат исследования, писать в репозиторий МОЖНО и НУЖНО) в формате: {"d","title","candidates":[{"singer","pianist","rec_year","year_source","album","label","age_voice","reputation","sources":[],"youtube":[{"videoId","channel","official":bool,"oembed_ok":bool}],"note"}],"priority_singers_checked":{<певец>:<вердикт с источником>},"albums_facts":[{"album","singer","year","label","facts","covers_more_pilot_songs":bool}],"surveys":[<найденные сравнительные обзоры с URL>],"negatives":[<важные отрицательные результаты>]}.

${COMMON}`
}

function rankPrompt(s) {
  return `Песня Шуберта: «${s.title}» (D ${s.d}). Составь итоговый ТОП-5 (или меньше, если достойных меньше) YouTube-исполнений по досье.

Сначала прочитай ЦЕЛИКОМ: ${RULES} (правила отбора — приоритетные певцы, возрастная структура, общие принципы), ${DATA}/${s.slug}.dossier.json (досье кандидатов), ${DIGEST}; образец обоснования: ${ROOT}/planning/research/gretchen-top5.md.

Работа:
1. Ранжируй по правилам: приоритетные певцы; приоритет старых мастеров; возрастная структура (3 записи до 1990 + 2 с 1990, из них 1 с 2015 — только при наличии ДОСТОЙНЫХ, никогда в ущерб качеству); у певца с несколькими версиями — учитывай состояние голоса, при прочих равных более раннюю; сходные по уровню — более ранняя.
2. Каждый выбранный videoId проверь: Bash: node ${CHECK} <ids> — все должны быть ok:true; предпочитай Topic/официальные каналы. Если видео кандидата мертво/нет — бери резерв и отрази это.
3. Напиши обоснование в ${ROOT}/planning/research/${s.slug}-top5.md по образцу gretchen-top5.md, но пропорционально фонду песни (ярус «${s.tier}»: famous — полное, medium — среднее, rare — краткое): итоговый список с фактами и почему именно эти; ключевые отклонённые кандидаты с причинами; соответствие возрастной структуре; резервы.
4. Верни JSON: d; entries (порядок = ранжирование, первая — главная; name «Фамилия — Фамилия пианиста» латиницей, у певцов-однофамильцев инициал); reserves (2-3 с videoId если есть); composition; notes (1-3 предложения о ключевых решениях).

${COMMON}`
}

function verifyPrompt(s, top5) {
  return `Независимая ВЕРИФИКАЦИЯ выбранного топа исполнений песни «${s.title}» (D ${s.d}).

Выбрано: ${JSON.stringify(top5.entries)}

Прочитай: ${RULES}, ${DATA}/${s.slug}.dossier.json, ${ROOT}/planning/research/${s.slug}-top5.md.

Проверь ЖЁСТКО, как оппонент:
1. Год каждой выбранной записи — независимым веб-поиском по дискографическим источникам (не повторяй источники досье, ищи вторые источники; для 78-х — CHARM).
2. Соответствие videoId заявленной записи: oEmbed-название/канал (Bash: node ${CHECK} <ids>) + при сомнении открой страницу видео WebFetch. Певец и пианист в названии/канале должны соответствовать; длительность сопоставь с досье.
3. Правила состава: возрастная структура, приоритеты, «при прочих равных — более ранняя». Нарушение без явного обоснования в top5-файле — issue.
4. Написание фамилий в name, формат «Фамилия — Фамилия пианиста».
5. Файл ${ROOT}/planning/research/${s.slug}-top5.md существует и не противоречит выбору.

Верни: ok=true только если ВСЁ сходится; иначе ok=false + issues + конкретные corrections с источниками. Мелкие поправимые вещи (опечатка фамилии, неверный год при верной записи) — тоже в corrections.

${COMMON}`
}

function fixPrompt(s, top5, verdict) {
  return `Правка топа исполнений песни «${s.title}» (D ${s.d}) по замечаниям верификатора.

Текущий выбор: ${JSON.stringify(top5.entries)}
Замечания: ${JSON.stringify(verdict.issues)}
Правки: ${JSON.stringify(verdict.corrections)}

Прочитай ${RULES}, ${DATA}/${s.slug}.dossier.json и ${ROOT}/planning/research/${s.slug}-top5.md. Внеси правки: обнови ${ROOT}/planning/research/${s.slug}-top5.md (Edit) и верни исправленный JSON той же схемы, что у ранжирования. Замены видео проверяй node ${CHECK}. Если замечание считаешь неверным — обоснуй в notes и не правь. ${COMMON}`
}

const tierModels = {
  famous: { research: 'opus', rank: undefined, verify: 'sonnet' }, // rank: undefined → основная модель сессии
  medium: { research: 'sonnet', rank: 'opus', verify: 'sonnet' },
  rare: { research: 'sonnet', rank: 'opus', verify: 'sonnet' },
}

const results = await pipeline(
  args.songs,
  (s) => agent(dossierPrompt(s), {
    label: `досье:D${s.d}`, phase: 'Досье',
    model: tierModels[s.tier].research, effort: 'medium', schema: DOSSIER_SCHEMA,
  }),
  async (dossier, s) => {
    if (!dossier) { log(`D ${s.d}: досье не получено — пропуск`); return null }
    log(`D ${s.d}: досье готово (${dossier.candidates_count} кандидатов)`)
    return agent(rankPrompt(s), {
      label: `топ-5:D${s.d}`, phase: 'Топ-5',
      model: tierModels[s.tier].rank, effort: 'high', schema: TOP5_SCHEMA,
    })
  },
  async (top5, s) => {
    if (!top5) return null
    const verdict = await agent(verifyPrompt(s, top5), {
      label: `вериф:D${s.d}`, phase: 'Верификация',
      model: tierModels[s.tier].verify, effort: 'medium', schema: VERDICT_SCHEMA,
    })
    if (!verdict) return { song: s, top5, verified: false, issues: ['верификатор не ответил'] }
    if (verdict.ok) return { song: s, top5, verified: true, issues: [] }
    log(`D ${s.d}: верификация нашла проблемы (${verdict.issues.length}) — фикс-раунд`)
    const fixed = await agent(fixPrompt(s, top5, verdict), {
      label: `фикс:D${s.d}`, phase: 'Верификация',
      model: tierModels[s.tier].rank, effort: 'high', schema: TOP5_SCHEMA,
    })
    return { song: s, top5: fixed || top5, verified: !!fixed, issues: verdict.issues }
  }
)

phase('Альбомы')
const good = results.filter(Boolean)
await agent(
  `Слей факты об альбомах из свежих досье в реестр ${ALBUMS} (создай файл, если его нет, с заголовком «# Реестр сквозных альбомов и изданий (пилот 1824–1825)» и пояснением, что альбом исследуется один раз и факты переиспользуются всеми песнями). Досье: ${good.map((r) => `${DATA}/${r.song.slug}.dossier.json`).join(', ')} — из каждого возьми albums_facts. Формат записи: «- **Певец — Альбом (лейбл, год)** — факты; песни пилота: D...». Дубликаты не плоди: если альбом уже в реестре — при необходимости дополни его строку. Больше ничего не меняй, временных файлов не создавай, субагентов не спавнь.`,
  { label: 'реестр альбомов', phase: 'Альбомы', model: 'haiku', effort: 'low' }
)

return good.map((r) => ({
  d: r.song.d, slug: r.song.slug, verified: r.verified, issues: r.issues,
  entries: r.top5.entries, reserves: r.top5.reserves, composition: r.top5.composition, notes: r.top5.notes,
}))
