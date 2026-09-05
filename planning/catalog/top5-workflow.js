export const meta = {
  name: 'top5-research',
  description: 'Отбор топ-5 исполнений для песни: проверка записей по правилу youtube-performances.md → файл-исследование planning/research/<slug>-top5.md',
  phases: [{ title: 'Отбор записей' }],
}
// args = {songs: [{d, slug, title}]}
const REPO = '/workspaces/schubert-lieder'
const one = (s) => agent(`Ты — исследователь проекта «все песни Шуберта с пословным русским переводом». Задача — файл отбора топ-5 исполнений песни D ${s.d} «${s.title}» (${REPO}/planning/research/${s.slug}-top5.md).

ЧТО ПРОЧИТАТЬ СНАЧАЛА
1. Правило отбора: ${REPO}/docs/rules/youtube-performances.md — читай целиком, оно определяет и критерии, и формат.
2. Образец готового файла: любой ${REPO}/planning/research/d*-top5.md (возьми, например, d891-an-silvia-top5.md, если он есть, иначе любой) — форма, а не содержание.
3. Уже отобранные записи этой песни: поле "${s.d}" в ${REPO}/app/src/data/performances.json — пять videoId с именами и годами. Они отобраны раньше, но файла-исследования под ними нет.

ЧТО СДЕЛАТЬ
— Проверь каждую из этих пяти записей по правилу: кто поёт и играет, год записи, что это за издание. Ищи подтверждения в сети (буклеты Hyperion, Discogs, страницы лейблов, schubertlied.de, schubertsong.uk). Бюджет — до 12 обращений к сети на всю песню.
— Каждое утверждение о записи должно опираться на источник с дословной цитатой (≤120 знаков) и URL, как в файлах фактов проекта.
— Если запись правилу не отвечает (например, это не та песня, не тот исполнитель, или запись явно хуже отклонённых) — так и напиши, предложи замену с обоснованием.
— Ранжируй пятёрку: первая запись — главная.
— Результат — ОДИН вызов Write: ${REPO}/planning/research/${s.slug}-top5.md по форме образца: шапка с источниками, пронумерованные записи с исполнителями, годом, изданием, цитатой и URL, отдельным разделом — отклонённые кандидаты и причина.

ЗАПРЕТЫ: ${REPO}/app/src/data/performances.json не менять (если пятёрку нужно править — напиши это в файле и в ответе); чужие песни не трогать; временные файлы в репозиторий не писать; субагентов не спавнить.
Верни по схеме: d="${s.d}", ok, n_records, replaced (сколько записей предложено заменить), tool_calls.`, {
  label: `топ-5 D ${s.d}`, phase: 'Отбор записей', model: 'sonnet', effort: 'high',
  schema: { type: 'object', properties: { d: { type: 'string' }, ok: { type: 'boolean' }, n_records: { type: 'number' }, replaced: { type: 'number' }, tool_calls: { type: 'number' } }, required: ['d', 'ok', 'tool_calls'] },
})
const res = await parallel(args.songs.map((s) => () => one(s)))
return { res }
