// Батч-волна для medium/rare песен: досье-батч → ранжирование-батч → вериф-лайт.
// args = { batches: [ [ {d, slug, title, tier}, ... ], ... ] } — 3–4 песни в батче.
// Опора на реестр альбомов (albums.md + albums/*.md): новые альбомы исследуются
// один раз, известные — берутся из реестра. Famous-песни сюда не подавать —
// для них полный конвейер wave.js.

export const meta = {
  name: 'yt-batch-wave',
  description: 'Батч-волна топ-5 (medium/rare): досье-батч → ранжирование → вериф-лайт',
  phases: [
    { title: 'Досье', detail: 'один агент на батч из 3–4 песен' },
    { title: 'Топ-5', detail: 'ранжирование батча по строгой иерархии' },
    { title: 'Вериф-лайт', detail: 'IDs/длительности/годы новых альбомов/иерархия' },
  ],
}

const ROOT = '/workspaces/schubert-lieder'
const RULES = `${ROOT}/docs/rules/youtube-performances.md`
const DIGEST = `${ROOT}/planning/research/singers-digest.md`
const REG = `${ROOT}/planning/youtube/albums.md и все файлы ${ROOT}/planning/youtube/albums/*.md`
const DATA = `${ROOT}/planning/youtube/data`
const CHECK = `${ROOT}/planning/youtube/scripts/yt-check.js`

const COMMON = `Общие требования: не пиши временных файлов в репозиторий (только scratchpad); не спавнь субагентов; НИКОГДА не выдумывай факты — у каждого факта источник; метаданные YouTube-загрузок и архивов НЕ источник дат. Рабочие источники: реестр альбомов проекта (переиспользуй!), Discogs API (api.discogs.com, curl), MusicBrainz API, база Майкла Грея classical-discography.org, WebSearch/WebFetch пока доступны. Поиск YouTube — Bash: yt-dlp "ytsearch12:<запрос>" --flat-playlist --print "%(id)s\\t%(title)s\\t%(channel)s\\t%(duration)s\\t%(view_count)s"; живость — node ${CHECK} <ids>.`

const BATCH_RESULT_SCHEMA = {
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
              properties: {
                videoId: { type: 'string' },
                name: { type: 'string' },
                year: { description: 'число, либо строка-диапазон с «?» по правилу неустановленных дат' },
              },
              required: ['videoId', 'name', 'year'],
            },
          },
          reserves: { type: 'array', items: { type: 'object' } },
          notes: { type: 'string' },
        },
        required: ['d', 'entries', 'notes'],
      },
    },
  },
  required: ['songs'],
}

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    songs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          d: { type: 'string' },
          ok: { type: 'boolean' },
          issues: { type: 'array', items: { type: 'string' } },
          entries: { type: 'array', items: { type: 'object' }, description: 'исправленный список, только если правил' },
        },
        required: ['d', 'ok', 'issues'],
      },
    },
  },
  required: ['songs'],
}

function songLine(s) { return `«${s.title}» (D ${s.d}, slug ${s.slug}, ярус ${s.tier})` }

function dossierPrompt(batch) {
  return `Составь ДОСЬЕ кандидатов топ-5 YouTube-исполнений для ${batch.length} песен Шуберта (батч):
${batch.map((s, i) => `${i + 1}. ${songLine(s)}`).join('\n')}

Сначала прочитай ОДИН раз: ${RULES} (правила целиком), ${DIGEST}, реестр альбомов (${REG}). Затем по КАЖДОЙ песне:
1. Пул кандидатов: ${DATA}/<slug>.yt.json (поиск YouTube) + ${DATA}/<slug>.mb.json (MusicBrainz) + реестр (какие известные альбомы содержат песню). Дополни целевыми yt-dlp запросами по певцам из пула.
2. По каждому кандидату: певец, пианист, год записи с источником (если альбом в реестре — бери оттуда, не исследуй заново!), альбом/лейбл, состояние голоса (дайджест), репутация (для rare допустима репутация альбома вместо трековой критики), videoId (Topic/official предпочтительно) + oEmbed-живость. Специальный веб-поиск трековой критики — только если ярус medium или кандидатов больше 8.
3. Приоритетные певцы (Quasthoff, Fischer-Dieskau, Schwarzkopf, Hotter, Anders, E. Schumann, Ludwig, Popp): записал ли песню — с источником (для мужчин/женщин учитывай применимость по роли).
4. Новые альбомы, которых нет в реестре, исследуй один раз и включи факты в досье (поле albums_facts).
Запиши ${DATA}/<slug>.dossier.json на каждую песню (схема как у существующих досье). Верни 2-3 предложения на песню: главные кандидаты.

${COMMON}`
}

function rankPrompt(batch) {
  return `Составь итоговые топ-5 (или меньше — если достойных меньше, это нормально для rare) для ${batch.length} песен Шуберта:
${batch.map((s, i) => `${i + 1}. ${songLine(s)}`).join('\n')}

Прочитай ОДИН раз ${RULES} (особенно «Приоритетные исполнители» → строгая иерархия порядка, «Состав топ-5», «Год в плеере») и ${DIGEST}; затем по каждой песне — её ${DATA}/<slug>.dossier.json.

По КАЖДОЙ песне:
1. Отбор: качество — фильтр включения; возрастная структура (3 до 1990 + 2 с 1990, из них 1 с 2015) — только при наличии достойных, влияет на состав, не на порядок.
2. Порядок — строгая иерархия: Квастхоф №1 (если есть) → Фишер-Дискау → Шварцкопф → прочие звёзды прошлого по качеству → современные по качеству. Несколько версий одного певца: состояние голоса, при прочих равных ранняя; сходные внутри группы — ранняя.
3. Все выбранные videoId проверь: node ${CHECK} <ids> (ok:true обязательно).
4. Напиши КОМПАКТНОЕ обоснование ${ROOT}/planning/research/<slug>-top5.md (для rare: итоговый список с фактами и источниками, 1-2 отклонённых, резервы; без длинных эссе). Год: правило «Год в плеере» (сессия > издание; неустановленный год приоритетного — диапазон с «?»; один альбом = один год во всех песнях — сверься с реестром и уже опубликованными).
name: «Фамилия — Фамилия пианиста», однофамильцы с инициалом, диакритика обязательна.

Верни songs: по каждой песне d, entries (порядок = иерархия), reserves (1-3), notes (1-2 предложения).

${COMMON}`
}

function verifyPrompt(batch, ranked) {
  return `ВЕРИФ-ЛАЙТ батча из ${batch.length} песен (ярусы medium/rare; полная адверсариальная проверка не требуется — проверь ключевое).

Выбрано:
${ranked.songs.map((r) => `D ${r.d}: ${JSON.stringify(r.entries)}`).join('\n')}

Прочитай ${RULES}; по каждой песне — ${DATA}/<slug>.dossier.json и ${ROOT}/planning/research/<slug>-top5.md (slugs: ${batch.map((s) => s.slug).join(', ')}).

Проверь по КАЖДОЙ песне:
1. Все videoId живы и встраиваемы (node ${CHECK} — прогони все ID батча одним вызовом) и канал/длительность соответствуют заявленной записи (сравни с досье).
2. Годы записей, впервые появившихся в этом батче альбомов (которых нет в реестре/уже опубликованных песнях), — быстрый независимый чек по Discogs API/MusicBrainz/Грею; годы известных альбомов сверь с реестром (один альбом = один год).
3. Строгая иерархия порядка и формат name (инициалы однофамильцев, диакритика).
4. Соответствие top5-файла списку.
Мелкие правки (год, написание, порядок) внеси сам: обнови top5-файл (Edit) и верни исправленный entries; при серьёзной проблеме (сомнителен сам состав) — ok:false с issues, состав не меняй.

${COMMON}`
}

const results = await pipeline(
  args.batches,
  (b, _, i) => agent(dossierPrompt(b), {
    label: `досье:батч${i + 1}(${b.map((s) => 'D' + s.d).join(',')})`,
    phase: 'Досье', model: 'sonnet', effort: 'medium',
  }),
  async (dossierSummary, b, i) => {
    if (!dossierSummary) { log(`батч ${i + 1}: досье не получено — пропуск`); return null }
    return agent(rankPrompt(b), {
      label: `топ-5:батч${i + 1}`, phase: 'Топ-5',
      model: 'opus', effort: 'high', schema: BATCH_RESULT_SCHEMA,
    })
  },
  async (ranked, b, i) => {
    if (!ranked) return null
    const v = await agent(verifyPrompt(b, ranked), {
      label: `вериф:батч${i + 1}`, phase: 'Вериф-лайт',
      model: 'sonnet', effort: 'medium', schema: VERIFY_SCHEMA,
    })
    if (!v) return { batch: b, songs: ranked.songs, verified: false }
    const bySong = Object.fromEntries(v.songs.map((s) => [s.d, s]))
    const merged = ranked.songs.map((r) => {
      const vr = bySong[r.d]
      if (!vr) return { ...r, ok: false, issues: ['не проверена'] }
      return { ...r, entries: (vr.entries && vr.entries.length) ? vr.entries : r.entries, ok: vr.ok, issues: vr.issues }
    })
    return { batch: b, songs: merged, verified: true }
  }
)

return results.filter(Boolean).flatMap((r) => r.songs.map((s) => ({
  d: s.d, entries: s.entries, ok: s.ok !== false, issues: s.issues || [], notes: s.notes,
})))
