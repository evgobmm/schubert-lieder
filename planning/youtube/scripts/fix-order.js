// Пересмотр ПОРЯДКА уже опубликованных топ-5: строго по качеству (лучшая — первая),
// хронология на позицию не влияет. Состав пятёрки не меняется — только порядок.
// args = { songs: [{ d, slug, title }] }

export const meta = {
  name: 'fix-rank-order',
  description: 'Пересмотр порядка опубликованных топ-5: строго по качеству, не по хронологии',
  phases: [{ title: 'Переранжирование', detail: 'по одному сильному агенту на песню' }],
}

const ROOT = '/workspaces/schubert-lieder'
const RULES = `${ROOT}/docs/rules/youtube-performances.md`
const DATA = `${ROOT}/planning/youtube/data`

const SCHEMA = {
  type: 'object',
  properties: {
    d: { type: 'string' },
    changed: { type: 'boolean' },
    entries: {
      type: 'array', maxItems: 5,
      items: {
        type: 'object',
        properties: { videoId: { type: 'string' }, name: { type: 'string' }, year: { type: 'number' } },
        required: ['videoId', 'name', 'year'],
      },
    },
    rationale: { type: 'string', description: 'Кратко: что переставлено и почему, либо почему порядок верен' },
  },
  required: ['d', 'changed', 'entries', 'rationale'],
}

function prompt(s) {
  return `Указание пользователя: порядок записей в топ-5 — СТРОГАЯ ИЕРАРХИЯ ПРИОРИТЕТОВ (первая — главная), не хронология и не голый рейтинг критики: (1) Квастхоф — всегда №1, если его достойная запись в пятёрке; (2) затем Фишер-Дискау; (3) затем Шварцкопф; (4) затем прочие звёзды прошлого (Хоттер, Андерс, Э. Шуман, Людвиг, Попп и другие старые мастера) — между собой по качеству; (5) затем современные — между собой по качеству. Проверь и исправь порядок опубликованного топ-5 песни «${s.title}» (D ${s.d}).

Прочитай: ${RULES} (правила целиком, особенно «Приоритетные исполнители»), ${DATA}/${s.slug}.dossier.json (досье кандидатов), ${ROOT}/planning/research/${s.slug}-top5.md (текущее обоснование), текущий порядок в ${ROOT}/app/src/data/performances.json (ключ "${s.d}").

Работа:
1. Перестрой порядок по строгой иерархии выше; внутри групп (звёзды прошлого; современные) — по качеству из досье (консенсус критики, состояние голоса).
2. СОСТАВ пятёрки НЕ меняй (те же 5 videoId); если по досье видишь серьёзную проблему самого состава — опиши её в rationale, но состав не трогай.
3. Если порядок изменился — приведи ${ROOT}/planning/research/${s.slug}-top5.md в соответствие (Edit: перенумеруй «Итоговый топ-5», поправь формулировки о главной записи; историю перестановки не описывай — файл содержит текущую редакцию).
4. Верни JSON: d, changed, entries (в НОВОМ порядке; name и year не менять), rationale.

Не выдумывай фактов: опирайся на досье и top5-файл; веб — только если в досье не хватает сравнения двух конкретных записей (подгрузи WebSearch/WebFetch через ToolSearch при необходимости). Временных файлов в репозиторий не писать; субагентов не спавнить.`
}

const results = await pipeline(
  args.songs,
  (s) => agent(prompt(s), { label: `порядок:D${s.d}`, phase: 'Переранжирование', effort: 'high', schema: SCHEMA })
)

return results.filter(Boolean)
