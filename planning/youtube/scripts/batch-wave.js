// Батч-волна medium/rare, схема «скрипт-сначала + пакетные вопросы сильной модели»:
//   Пробелы (sonnet, ~8 песен/агент: только кандидаты вне реестра)
//   → Ранжирование (opus, ПАКЕТ ~8 песен за один вызов)
//   → QA-ревизия всей волны (fable, один вызов: gate.js + таблицы решений)
//   → Глубокая верификация только отфлагованных (opus).
// args = { songs: [ {d, slug, title, tier}, ... ] } — до ~40 песен, ярусы medium/rare.
// Перед запуском волны в основной сессии выполняется match-candidates.js для слагов волны.

export const meta = {
  name: 'yt-batch-wave',
  description: 'Батч-волна топ-5 (medium/rare): пробелы → пакетное ранжирование → QA всей волны → флаги',
  phases: [
    { title: 'Пробелы', detail: 'дознание кандидатов вне реестра, ~8 песен/агент' },
    { title: 'Ранжирование', detail: 'сильная модель, пакет ~8 песен/вызов' },
    { title: 'QA', detail: 'gate.js + ревизия всей волны одним вызовом' },
    { title: 'Флаги', detail: 'глубокая верификация только отфлагованных' },
  ],
}

const ROOT = '/workspaces/schubert-lieder'
const RULES = `${ROOT}/docs/rules/youtube-performances.md`
const DIGEST = `${ROOT}/planning/research/singers-digest.md`
const REG = `${ROOT}/planning/youtube/albums.md + ${ROOT}/planning/youtube/albums/*.md`
const DATA = `${ROOT}/planning/youtube/data`
const CHECK = `${ROOT}/planning/youtube/scripts/yt-check.js`
const GATE = `${ROOT}/planning/youtube/scripts/gate.js`

const COMMON = `Общие требования: временные файлы — только в scratchpad; субагентов не спавнить; факты только с источниками; метаданные YouTube-загрузок — не источник дат. Источники: реестр альбомов проекта (главная опора — НЕ переисследуй то, что там есть), Discogs API (api.discogs.com, curl), MusicBrainz API, classical-discography.org (Грей), WebSearch/WebFetch пока доступны. yt-dlp "ytsearch10:<запрос>" --flat-playlist --print "%(id)s\\t%(title)s\\t%(channel)s\\t%(duration)s"; живость: node ${CHECK} <ids>.`

const BATCH_SCHEMA = {
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
                videoId: { type: 'string' }, name: { type: 'string' },
                year: { description: 'число, либо строка-диапазон с «?»' },
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

const QA_SCHEMA = {
  type: 'object',
  properties: {
    gate_summary: { type: 'string' },
    flags: {
      type: 'array',
      items: {
        type: 'object',
        properties: { d: { type: 'string' }, issues: { type: 'array', items: { type: 'string' } } },
        required: ['d', 'issues'],
      },
    },
    small_fixes: { type: 'array', items: { type: 'string' }, description: 'мелкие правки, внесённые самим QA (что и где)' },
    fixed_entries: {
      type: 'array', description: 'песни, где QA сам поправил entries (мелочь: год/написание/порядок)',
      items: {
        type: 'object',
        properties: { d: { type: 'string' }, entries: { type: 'array', items: { type: 'object' } } },
        required: ['d', 'entries'],
      },
    },
  },
  required: ['gate_summary', 'flags', 'small_fixes', 'fixed_entries'],
}

const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out }
const line = (s) => `«${s.title}» (D ${s.d}, slug ${s.slug}, ${s.tier})`

function gapsPrompt(b) {
  return `Дознание пробелов для ${b.length} песен Шуберта (кандидаты уже собраны скриптом):
${b.map((s, i) => `${i + 1}. ${line(s)}`).join('\n')}

Прочитай ОДИН раз: ${RULES}, ${DIGEST}, реестр (${REG}). Затем по КАЖДОЙ песне:
1. Открой ${DATA}/<slug>.candidates.json — там видео с Topic-каналов, догадки о певцах и совпадения с реестром (registry_hits) + список исполнителей из MusicBrainz.
2. Определи пул значительных кандидатов. Для кандидатов с registry_hits факты (год, пианист, лейбл, репутация) бери ИЗ РЕЕСТРА — не исследуй заново. Исследуй только: (а) значительных кандидатов без совпадения с реестром; (б) для medium-песен — трековую критику лидеров, если легко находится. Не хватает кандидатов в candidates.json — добери целевым yt-dlp по певцам из MusicBrainz/реестра.
3. Приоритетные певцы (Quasthoff, FiDi, Schwarzkopf, Hotter, Anders, E. Schumann, Ludwig, Popp): наличие записи — по реестру/дискографиям, с пометкой источника.
4. Запиши КОМПАКТНОЕ досье ${DATA}/<slug>.dossier.json: {"d","title","candidates":[{"singer","pianist","rec_year","year_source" (можно "реестр: <файл>"),"album","label","voice_note","reputation","videoId","channel","official":bool}],"priority_check":{...},"new_albums":[факты альбомов, которых не было в реестре]}.
Верни по 1-2 предложения на песню: пул и главные кандидаты.

${COMMON}`
}

function rankPrompt(b) {
  return `ПАКЕТНОЕ ранжирование: составь итоговые топ-5 (меньше — нормально для rare) для ${b.length} песен за этот один вызов:
${b.map((s, i) => `${i + 1}. ${line(s)}`).join('\n')}

Прочитай ОДИН раз ${RULES} (строгая иерархия порядка; состав; «Год в плеере») и ${DIGEST}; затем ${DATA}/<slug>.dossier.json каждой песни.

По КАЖДОЙ песне: отбор по качеству и возрастной структуре (влияет на состав, не порядок); порядок — строгая иерархия (Квастхоф №1 → ФиДи → Шварцкопф → звёзды прошлого по качеству → современные по качеству; несколько версий певца — состояние голоса/ранняя; сходные в группе — ранняя); videoId проверь одним вызовом node ${CHECK} на все ID пакета; год — по правилу (сессия > издание; неустановленный у приоритетного — диапазон с «?»; один альбом = один год, сверься с реестром); name «Фамилия — Фамилия пианиста», однофамильцы с инициалом, диакритика.
Напиши КОМПАКТНЫЙ ${ROOT}/planning/research/<slug>-top5.md по каждой (итог с фактами и источниками, отклонённые в одну строку, резервы; без эссе).
Верни songs: d, entries, reserves (1-3), notes (1-2 предложения).

${COMMON}`
}

function qaPrompt(all) {
  return `QA-РЕВИЗИЯ ВСЕЙ ВОЛНЫ (${all.length} песен) одним проходом. Ты — последний контролёр перед публикацией.

Решения волны (JSON): ${JSON.stringify(all.map((r) => ({ d: r.d, entries: r.entries, notes: r.notes })))}

Шаги:
1. Сохрани этот JSON в файл в своём scratchpad и прогони машинный гейт: node ${GATE} <файл>. Разбери errors (обязательны к устранению) и warnings.
2. Прочитай ${RULES}. Пробеги таблицу решений глазами эксперта: подозрительные ранжирования (звезда прошлого ниже современного, пропущенный очевидный именной приоритет, странный год, «не тот» исполнитель для песни), сверь спорные места с ${DATA}/<slug>.dossier.json (точечно, не всё подряд).
3. МЕЛКОЕ чини сам: год/написание/порядок — поправь top5-файл (Edit) и включи песню в fixed_entries с исправленным списком. СЕРЬЁЗНОЕ (сомнителен состав, кандидат без источников, ошибка иерархии из-за неверной классификации певца) — в flags с конкретными issues.
4. Верни: gate_summary (1-2 предложения об итогах гейта), flags, small_fixes, fixed_entries.

${COMMON}`
}

function deepPrompt(flagged) {
  return `Глубокая верификация и правка ${flagged.length} отфлагованных песен волны:
${flagged.map((f) => `D ${f.d} (slug ${f.slug}): ${f.issues.join('; ')}`).join('\n')}

Прочитай ${RULES}; по каждой песне — её ${DATA}/<slug>.dossier.json и ${ROOT}/planning/research/<slug>-top5.md. Разберись в каждом issue по существу (независимые источники: Discogs API, MusicBrainz, Грей; видео — node ${CHECK}), внеси правки в top5-файл и досье, верни songs: d, entries (финальный список), notes (что изменено/почему замечание отклонено).

${COMMON}`
}

// Пробелы → Ранжирование по чанкам (пайплайн, без барьера между чанками)
const CH = 8
const ranked = await pipeline(
  chunk(args.songs, CH),
  (b, _, i) => agent(gapsPrompt(b), { label: `пробелы:${i + 1}(${b.length})`, phase: 'Пробелы', model: 'sonnet', effort: 'medium' }),
  async (gaps, b, i) => {
    if (!gaps) { log(`чанк ${i + 1}: дознание не вернулось — пропуск`); return null }
    return agent(rankPrompt(b), { label: `ранж:${i + 1}(${b.length})`, phase: 'Ранжирование', model: 'opus', effort: 'high', schema: BATCH_SCHEMA })
  }
)

// Барьер оправдан: QA смотрит ВСЮ волну сразу (пакетный вопрос сильной модели)
const all = ranked.filter(Boolean).flatMap((r) => r.songs)
phase('QA')
const qa = await agent(qaPrompt(all), { label: `QA волны (${all.length})`, phase: 'QA', model: 'fable', effort: 'high', schema: QA_SCHEMA })

const slugByD = Object.fromEntries(args.songs.map((s) => [String(s.d), s.slug]))
let final = all.map((r) => {
  const fx = qa && qa.fixed_entries.find((f) => String(f.d) === String(r.d))
  return { ...r, entries: fx ? fx.entries : r.entries }
})

if (qa && qa.flags.length) {
  phase('Флаги')
  log(`отфлаговано: ${qa.flags.map((f) => 'D' + f.d).join(', ')}`)
  const flagged = qa.flags.map((f) => ({ ...f, slug: slugByD[String(f.d)] }))
  const fixes = (await parallel(chunk(flagged, 3).map((grp) => () =>
    agent(deepPrompt(grp), { label: `флаги:${grp.map((g) => 'D' + g.d).join(',')}`, phase: 'Флаги', model: 'opus', effort: 'high', schema: BATCH_SCHEMA })
  ))).filter(Boolean).flatMap((r) => r.songs)
  const byD = Object.fromEntries(fixes.map((f) => [String(f.d), f]))
  final = final.map((r) => byD[String(r.d)] ? { ...r, entries: byD[String(r.d)].entries, notes: byD[String(r.d)].notes, deep_verified: true } : r)
}

return { qa_summary: qa ? qa.gate_summary : 'QA не отработал', small_fixes: qa ? qa.small_fixes : [], flags: qa ? qa.flags : [], songs: final }
