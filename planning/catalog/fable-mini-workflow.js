export const meta = {
  name: 'fable-mini',
  description: 'Мини-проход Fable по изменённым местам страниц (правки аудита и оговорки): мини-бандл → список правок → apply-edits',
  phases: [{ title: 'Fable-мини' }],
}
// args = {workDir, songs:[{d, slug}], parallel}
const REPO = '/workspaces/schubert-lieder'
const one = (s) => agent(`Ты — финальный редактор проекта «все песни Шуберта с пословным русским переводом», рука эталонной «Гретхен за прялкой». Страница D ${s.d} уже опубликована и вычитана тобой раньше; после этого текстологический аудит исправил в ней немецкий текст (и, возможно, дописал оговорку о расхождении с поэтом). Твоя задача — вычитать ТОЛЬКО изменённые места.

Прочитай Read-инструментом мини-бандл: ${args.workDir}/mini/mini-${s.slug}.md — в нём изменённые строки (немецкая строка «было/стало», сегменты подстрочника, сноски), изменённые секции «О песне» и новые факты, которыми правка опёрта. Если для суждения не хватает контекста соседних строк, допускается ОДИН Read файла песни ${REPO}/app/src/data/songs/${s.slug}.json.

ЧТО ПРОВЕРИТЬ В КАЖДОМ ИЗМЕНЁННОМ МЕСТЕ
1. Русская строка после правки читается как русская фраза, а сегменты соответствуют новым немецким словам.
2. Сноска не объясняет исчезнувшее слово и не противоречит новому чтению; диапазон сноски покрывает то, о чём она говорит.
3. Проза («О песне») не спорит с исправленным текстом; оговорка о расхождении, если она есть, сказана по-русски и по фактам, без кухни сбора источников.
4. Язык — по закону проекта: без «не X, а Y» как украшения, без «не просто», без канцелярита, «ё» везде.
Ничего сверх изменённых мест не трогай: остальная страница вычитана раньше. Новых утверждений не вводи — только то, что дают факты в бандле. Немецкий текст и набор немецких слов в сегментах НЕ меняй.

КАК СОХРАНИТЬ
ОДИН вызов Write: ${args.workDir}/work/edits-${s.slug}.json —
{"d":"${s.d}","edits":[ ... ],"removed":[{"what":"...","why":"..."}],"flags":["..."]}
Типы правок: {"type":"segments","line":"3.1","segments":[{"de":"…","ru":"…"}]}, {"type":"ann","line":"3.1","index":0,"text":"…","segment_range":[0,4]}, {"type":"ann_delete","line":"1.2","index":1}, {"type":"ann_add","line":"2.3","ann":{"type":"lang","segment_range":[1,1],"text":"…"}}, {"type":"section","index":2,"title":"…","text":"…"}, {"type":"title_ann","index":0,"text":"…"}, {"type":"title_ru","text":"…"}. Индексы — как в бандле. Если править нечего, пришли пустой массив edits.
Затем ОДИН Bash: node ${REPO}/planning/scripts/apply-edits.js ${s.d} ${args.workDir} — он применит правки и прогонит валидатор с линтом. При «ОТКЛОНЕНО» или ERROR поправь edits-файл и повтори не больше одного раза.

Верни по схеме: d="${s.d}", ok, n_changes, removed, flags, tool_calls.`, {
  label: `Fable-мини D ${s.d}`, phase: 'Fable-мини', model: 'fable', effort: 'medium',
  schema: { type: 'object', properties: { d: { type: 'string' }, ok: { type: 'boolean' }, n_changes: { type: 'number' }, removed: { type: 'array', maxItems: 10, items: { type: 'object', properties: { what: { type: 'string', maxLength: 200 }, why: { type: 'string', maxLength: 200 } }, required: ['what', 'why'] } }, flags: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 200 } }, tool_calls: { type: 'number' } }, required: ['d', 'ok', 'n_changes', 'tool_calls'] },
})
const PAR = args.parallel || 6
const results = []
for (let i = 0; i < args.songs.length; i += PAR) {
  const batch = await parallel(args.songs.slice(i, i + PAR).map((s) => () => one(s)))
  results.push(...batch); log(`готово ${Math.min(i + PAR, args.songs.length)}/${args.songs.length}`)
}
return { results: results.filter(Boolean) }
