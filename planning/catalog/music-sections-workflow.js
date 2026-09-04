export const meta = {
  name: 'music-sections',
  description: 'Разделы «Музыка» по добранным фактам: opus пишет секцию в кандидата, Fable вычитывает и правит через apply-edits',
  phases: [{ title: 'Раздел «Музыка»' }, { title: 'Вычитка Fable' }],
}
// args = {workDir, songs:[{d, slug}], parallel}
const REPO = '/workspaces/schubert-lieder'
const perSong = async (s) => {
  const write = await agent(`Ты — автор страниц проекта «все песни Шуберта с пословным русским переводом». У песни D ${s.d} на странице нет раздела «Музыка»: при первом сборе музыкальных сведений не нашлось. Теперь факты добраны — напиши раздел.

ЧТО ПРОЧИТАТЬ
1. ${REPO}/planning/research/${s.slug}-facts.md — раздел «4. Музыка» и всё, что добавлено последними номерами (тональность, темп, форма, опус, издание, посвящение). **Это единственная законная опора.** Статусы: verified — пишем как факт; secondary — с атрибуцией источнику; uncertain и «Не подтвердилось» — не пишем вовсе.
2. ${args.workDir}/work/candidate-${s.slug}.json — страница (её и правим).
3. ${REPO}/planning/catalog/one-shot-brief.md — закон стиля: каноническое место раздела, запрет ИИ-артефактов, правило именования изданий, запрет на кухню сбора источников в тексте («сведений найти не удалось» — можно, «страница недоступна» — нельзя), «ё» везде.

ЧТО СДЕЛАТЬ
Добавь в массив about раздел «Музыка» на каноническом месте (после «Стихотворения», до разделов о смысле и записях). Пиши ровно то, что дают факты: тональность и её смены, размер, темповое обозначение, форма, фигура аккомпанемента, число тактов, опус и первое издание, посвящение. Чего в фактах нет — не выдумывай; если сведений мало, пусть раздел будет коротким и честным. Ничего другого на странице не трогай: ни немецкий текст, ни подстрочник, ни сноски, ни другие разделы.
Запиши изменённую страницу ОДНИМ вызовом Write поверх ${args.workDir}/work/candidate-${s.slug}.json (полный JSON), затем ОДИН Bash: node ${REPO}/planning/scripts/finish-page.js ${s.d} ${args.workDir} ${args.workDir}/work/candidate-${s.slug}.json --final — при ERROR или срабатывании линта исправь и повтори (не больше двух раз).
Верни по схеме: d="${s.d}", ok, chars (длина написанного раздела), used (сколько фактов использовано), gaps (до 200 знаков: чего не хватило), tool_calls.`, {
    label: `«Музыка» D ${s.d}`, phase: 'Раздел «Музыка»', model: 'opus', effort: 'high',
    schema: { type: 'object', properties: { d: { type: 'string' }, ok: { type: 'boolean' }, chars: { type: 'number' }, used: { type: 'number' }, gaps: { type: 'string', maxLength: 200 }, tool_calls: { type: 'number' } }, required: ['d', 'ok', 'chars', 'tool_calls'] },
  })

  const vet = await agent(`Ты — финальный редактор проекта «все песни Шуберта с пословным русским переводом», рука эталонной «Гретхен за прялкой». К странице D ${s.d} только что дописан НОВЫЙ раздел «Музыка» — вычитай его, остальную страницу не трогай (она вычитана раньше).

Прочитай Read: ${args.workDir}/work/candidate-${s.slug}.json — тебе нужен раздел «Музыка» в массиве about (запомни его индекс) и соседние разделы, чтобы не было дублей. Опора: ${REPO}/planning/research/${s.slug}-facts.md.
Проверь: (1) каждое утверждение раздела опёрто фактом, secondary — с атрибуцией, uncertain не просочилось; (2) нет дубля с соседними разделами и со сносками; (3) язык по закону проекта — без «не X, а Y» как украшения, без «не просто», без канцелярита, без кухни сбора источников, «ё» везде; (4) названия изданий по правилу (Hyperion — антология/серия, «полное собрание» только при Sämtliche/Complete).

ОДИН вызов Write: ${args.workDir}/work/edits-${s.slug}.json — {"d":"${s.d}","edits":[{"type":"section","index":<индекс раздела «Музыка»>,"title":"Музыка","text":"<исправленный текст>"}],"removed":[{"what":"…","why":"…"}],"flags":["…"]}. Если править нечего — пустой массив edits.
Затем ОДИН Bash: node ${REPO}/planning/scripts/apply-edits.js ${s.d} ${args.workDir} — применит правку и прогонит валидатор с линтом; при ошибке поправь файл правок и повтори один раз.
Верни по схеме: d="${s.d}", ok, n_changes, removed, flags, tool_calls.`, {
    label: `вычитка «Музыки» D ${s.d}`, phase: 'Вычитка Fable', model: 'fable', effort: 'medium',
    schema: { type: 'object', properties: { d: { type: 'string' }, ok: { type: 'boolean' }, n_changes: { type: 'number' }, removed: { type: 'array', maxItems: 8, items: { type: 'object', properties: { what: { type: 'string', maxLength: 200 }, why: { type: 'string', maxLength: 200 } }, required: ['what', 'why'] } }, flags: { type: 'array', maxItems: 5, items: { type: 'string', maxLength: 200 } }, tool_calls: { type: 'number' } }, required: ['d', 'ok', 'n_changes', 'tool_calls'] },
  })
  return { d: s.d, write, vet }
}
const PAR = args.parallel || 5
const results = []
for (let i = 0; i < args.songs.length; i += PAR) {
  const batch = await parallel(args.songs.slice(i, i + PAR).map((s) => () => perSong(s)))
  results.push(...batch); log(`готово ${Math.min(i + PAR, args.songs.length)}/${args.songs.length}`)
}
return { results: results.filter(Boolean) }
