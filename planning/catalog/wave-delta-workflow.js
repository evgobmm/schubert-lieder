export const meta = {
  name: 'wave-delta',
  description: 'Догон волны: только сверка (+ремонт+сверка-2) по страницам, где Fable уже прошёл, а сверку убил лимит сессии',
  phases: [{ title: 'Сверка' }, { title: 'Ремонт' }],
}
// Запуск: Workflow({scriptPath: 'planning/catalog/wave-delta-workflow.js', args: {workDir, songs: [{d, slug, poet, removed}]}})
// removed — список снятого, заявленный Fable в убитом круге (берётся из журнала того runId скриптом delta-args.js).
// Промпты сверки и ремонта скопированы из wave-fable-workflow.js БЕЗ ИЗМЕНЕНИЙ; вырезан только этап Fable.
// Требует уже готовых <workDir>/work/candidate-<slug>.json и <workDir>/bundles/fable-<slug>.part1.md
// (этапы словарь/факты/страница пройдены раньше). Промпты — копия соответствующих этапов wave-v2-workflow.js.

const REPO = '/workspaces/schubert-lieder'
const W = args.workDir
const CONV = `КОНВЕНЦИЯ СЕГМЕНТОВ (закон проекта): сегменты подстрочника идут в РУССКОМ порядке, поле de каждого сегмента — то немецкое слово (слова), которое этот русский сегмент переводит; порядок de-сегментов МОЖЕТ отличаться от порядка слов в lines_de — это норма, а не дефект; совпадать обязано только множество немецких слов (валидатор это проверяет). Разорванная рамка пишется с многоточием («auf... thut sich») — норма. Артикль без русской пары сливается со следующим словом. Диапазоны сносок считаются по индексам ТЕКУЩЕЙ сегментации (после слияний индексы сдвигаются — это не «сужение диапазона»). Индексы сегментов в диапазонах аннотаций (segment_range) считаются С НУЛЯ и включают оба конца: [1,5] — это сегменты 1,2,3,4,5, где сегмент 0 — первое слово строки. Прежде чем писать, что аннотация объясняет слово вне своего диапазона, пересчитай индексы от нуля по ТЕКУЩЕЙ сегментации. Расхождения «порядок de-сегментов ≠ порядок строки» и знаки препинания проблемами НЕ считать. Сегмент с ПУСТЫМ de под русским служебным словом («не», «чтобы», «уходя») — НОРМА, а не дефект: так сделано и в эталонном референсе «Winterreise» (39 таких сегментов в 24 песнях цикла), рендер это учитывает. Пустых de не «чинить», о них не писать в проблемах; пустой RU при непустом de — вот это дефект (артикль сливается со следующим словом).`
const BUNDLE_NOTE = (stage, slug) => `Бандл: файл ${W}/bundles/${stage}-${slug}.part1.md — прочитай его Read-инструментом ЦЕЛИКОМ (без offset/limit); если файл кончается пометкой «ПРОДОЛЖЕНИЕ В ЧАСТИ 2», прочитай и part2 (и так далее до «КОНЕЦ БАНДЛА»). В бандле есть всё; других файлов не открывай, правил не ищи.`
const BANS = `Запреты: не спавнить субагентов; в репозиторий ${REPO} ничего не писать; писать только свои выходные файлы в ${W}; немецкий текст не менять ни в одном символе.`
const S_DICT = { type: 'object', properties: { d: { type: 'string' }, ok: { type: 'boolean' }, n_new: { type: 'number' }, n_mapped: { type: 'number' }, drafts: { type: 'array', maxItems: 12, items: { type: 'string', maxLength: 60 } }, tool_calls: { type: 'number' } }, required: ['d', 'ok', 'n_new', 'n_mapped', 'tool_calls'] }
const S_FACTS = { type: 'object', properties: { d: { type: 'string' }, ok: { type: 'boolean' }, n_facts: { type: 'number' }, network_calls: { type: 'number' }, gaps: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 160 } }, tool_calls: { type: 'number' } }, required: ['d', 'ok', 'n_facts', 'tool_calls'] }
const S_PAGE = { type: 'object', properties: { d: { type: 'string' }, ok: { type: 'boolean' }, n_annotations: { type: 'number' }, n_about: { type: 'number' }, rounds: { type: 'number' }, notes: { type: 'string', maxLength: 400 }, tool_calls: { type: 'number' } }, required: ['d', 'ok', 'n_annotations', 'n_about', 'tool_calls'] }
const S_FABLE = { type: 'object', properties: { d: { type: 'string' }, ok: { type: 'boolean' }, n_changes: { type: 'number' }, removed: { type: 'array', maxItems: 20, items: { type: 'object', properties: { what: { type: 'string', maxLength: 200 }, why: { type: 'string', maxLength: 200 } }, required: ['what', 'why'] } }, flags: { type: 'array', maxItems: 8, items: { type: 'string', maxLength: 200 } }, tool_calls: { type: 'number' } }, required: ['d', 'ok', 'n_changes', 'removed', 'tool_calls'] }
const S_DELTA = { type: 'object', properties: { d: { type: 'string' }, clean: { type: 'boolean' }, problems: { type: 'array', maxItems: 10, items: { type: 'string', maxLength: 240 } }, tool_calls: { type: 'number' } }, required: ['d', 'clean', 'tool_calls'] }
const S_FIX = { type: 'object', properties: { d: { type: 'string' }, ok: { type: 'boolean' }, applied: { type: 'number' }, rejected: { type: 'array', maxItems: 10, items: { type: 'string', maxLength: 200 } }, tool_calls: { type: 'number' } }, required: ['d', 'ok', 'applied', 'tool_calls'] }

const deltaPrompt = (s, removed) => `Ты — контролёр сохранности и прослеживаемости перед публикацией. ${CONV} Инструменты — Read бандла (одна-две части) и, при сомнении в опоре, полного файла фактов и досье поэта (см. ниже); ни grep, ни скриптов.
ВАЖНО про «нет опоры»: компактные факты в бандле УСЕЧЕНЫ (длинные цитаты обрезаны, часть приходит с пустыми «»), поэтому отсутствие цитаты в бандле НЕ доказывает отсутствия опоры. Прежде чем объявить утверждение необеспеченным (особенно названия альбомов и томов серий, каталожные номера, даты жизни поэта), сделай ОДНО дополнительное чтение: Read файла ${W}/facts/${s.slug}-facts.md (полные факты) и, если речь о поэте, Read ${REPO}/planning/research/poets/${s.poet}.md. Нашёл опору — это не проблема, и писать о ней не нужно. Не нашёл — тогда проблема, и укажи, что проверял полный файл.
${BUNDLE_NOTE('delta', s.slug)}
В бандле: отчёт сравнения v1 (до Fable) → финал, построенный скриптом (строки с пометкой ИЗМЕНЕНО, аннотации «было/стало», секции «О песне» целиком), компактные факты, досье «Кратко», словарные карточки. Список снятого, заявленный Fable: ${JSON.stringify(removed || [])}.

ПРО «ПОЛНОЕ СОБРАНИЕ» (арбитраж, чтобы класс замечаний закрылся): формула «полное собрание песен Шуберта» допустима ТОЛЬКО там, где полный файл фактов даёт само название издания со словом Sämtliche/Complete — например, бокс Deutsche Grammophon «Sämtliche Lieder»: там она опёрта и снимать её нельзя. Для Hyperion в фактах стоит «Hyperion Schubert Edition» или буклет с каталожным номером — там пишем «антология Hyperion Schubert Edition» либо «шубертовская серия Hyperion», без слова «полное». Проверять по полному файлу фактов, а не по компактным.
Проверь: (1) всё содержание v1 либо сохранено по существу, либо снято осознанно — снятие правомерно ТОЛЬКО если опоры нет ни в фактах, ни в досье, ни в карточках; снятое без заявления в списке — проблема; (2) в финале нет утверждений вне баз опоры (новые даты, имена, цитаты, обобщения, сравнения); (3) LINES_DE идентичны, de-сегменты совпадают со строкой, пустых ru-сегментов нет (кроме артиклей, слитых с существительным, — их быть не должно); (4) изменённые RU-строки читаются как русские фразы, их аннотации согласованы с новым текстом; (5) язык финала без ИИ-артефактов («не X, а Y» как украшение, «не просто», «работает» о словах, канцелярит). Каждую проблему описывай конкретно (адрес строки/секции, что не так, как исправить). ГРАДАЦИЯ (обязательна): каждый пункт problems начинай с «БЛОКЕР: » или «ШЛИФОВКА: ». БЛОКЕР — то, с чем публиковать нельзя: утверждение без опоры (после проверки полного файла фактов и досье), потеря опёртого содержания, фактическое противоречие, нерусская или сломанная фраза, сноска, противоречащая своему тексту или диапазону, структурный дефект. ШЛИФОВКА — то, что можно улучшить потом: вкусовые формулировки, однокоренные повторы в соседних фразах, оттенки дублей «сноска/раздел», разбивка абзацев. clean = true, когда БЛОКЕРОВ нет — даже если шлифовка есть; шлифовку всё равно перечисли (она уйдёт в бэклог полировки, публикации не мешает). Верни по схеме: d="${s.d}", clean, problems, tool_calls.`

const perSong = async (s) => {
  const fable = { ok: true, removed: s.removed || [], n_changes: 0, skipped: true } // этап Fable пройден в убитом круге — заново не платим
  let delta = await agent(deltaPrompt(s, fable && fable.removed), { label: `сверка D ${s.d}`, phase: 'Сверка', schema: S_DELTA, model: 'opus', effort: 'high' })
  let fix = null, delta2 = null
  if (delta && !delta.clean && delta.problems && delta.problems.length) {
    fix = await agent(`Ты — редактор-исполнитель точечных правок перед публикацией. ${CONV} Де-сегменты в немецкий порядок НЕ переставлять; русские строки не ухудшать ради порядка. Файл: ${W}/work/candidate-${s.slug}.json (правь его Edit-ом или node-скриптом через JSON.parse/JSON.stringify(…, null, 1); немецкий текст и набор немецких слов в сегментах не менять). Опоры только на чтение: ${W}/facts/${s.slug}-facts.md, ${W}/work/candidate-${s.slug}.v1.json (версия до Fable — для возврата формулировок), ${W}/work/dict-${s.slug}.json, ${REPO}/planning/research/poets/${s.poet}.md, карточки ${REPO}/planning/dictionary/entries/‹лемма›.json. ${BANS} Бюджет — 7 вызовов инструментов.
ПРОБЛЕМЫ СВЕРКИ (каждую выполни или отклони с причиной):
${delta.problems.map((x, i) => `${i + 1}. ${x}`).join('\n')}
В конце Bash: node ${REPO}/planning/scripts/finish-page.js ${s.d} ${W} ${W}/work/candidate-${s.slug}.json --final — до 0 ERROR и чистого линта. Верни по схеме (d="${s.d}").`, { label: `ремонт D ${s.d}`, phase: 'Ремонт', schema: S_FIX, model: 'opus', effort: 'high' })
    delta2 = await agent(deltaPrompt(s, (fable && fable.removed) || []), { label: `сверка-2 D ${s.d}`, phase: 'Ремонт', schema: S_DELTA, model: 'opus', effort: 'high' })
  }
  return { d: s.d, fable, delta, fix, delta2 }
}

const PAR = (args.parallel || 6)
const results = []
for (let i = 0; i < args.songs.length; i += PAR) { const batch = await parallel(args.songs.slice(i, i + PAR).map((s) => () => perSong(s))); results.push(...batch); log(`готово ${Math.min(i + PAR, args.songs.length)}/${args.songs.length}`) }
const done = results.filter(Boolean)
const isClean = (r) => Boolean(r.fable && r.fable.ok && ((r.delta2 || r.delta) || {}).clean)
return { results: done, clean: done.filter(isClean).map((r) => r.d), dirty: done.filter((r) => !isClean(r)).map((r) => r.d) }
