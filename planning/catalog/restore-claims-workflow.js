export const meta = {
  name: 'restore-claims',
  description: 'Кампания возврата снятого: триаж и проверка источниками (sonnet) → возврат формулировок на страницу (opus) → мини-вычитка (Fable)',
  phases: [{ title: 'Триаж и проверка' }, { title: 'Возврат' }, { title: 'Вычитка' }],
}
// args = {workDir, songs:[{d, slug}], parallel}
const REPO = '/workspaces/schubert-lieder'
const perSong = async (s) => {
  const Q = `${args.workDir}/restore/${s.slug}.json`
  const CLAIMS = `${args.workDir}/restore/${s.slug}.claims.json`
  const CAND = `${args.workDir}/work/candidate-${s.slug}.json`

  // s.skipCheck: триаж по этой песне уже выполнен раньше (claims-файл на месте) — начинаем с возврата
  const check = s.skipCheck ? { d: s.d, n_restore: 1, skipped_check: true } : await agent(`Ты — исследователь-фактограф проекта «все песни Шуберта с пословным русским переводом». Финальный редактор когда-то снял со страницы D ${s.d} несколько утверждений с пометкой «нет опоры». Часть из них была верной, просто опору тогда не нашли. Твоя задача — разобрать этот список и вернуть в оборот то, что подтверждается источниками.

ЧТО ПРОЧИТАТЬ
1. Очередь снятого: Read ${Q} — поле auto (пункты, где опора уже нашлась в полной словарной карточке — их проверять не надо, они идут в возврат как есть) и поле triage (пункты на разбор).
2. Файл фактов песни: ${REPO}/planning/research/${s.slug}-facts.md — что уже подтверждено.
3. Страница: ${CAND} — что сейчас написано (чтобы не возвращать уже сказанное другими словами).
4. Предзагруженные источники песни: каталоги /home/vscode/schubert-waves/*/prefetch/${s.slug}/ — schubertsong.uk.txt, schubertlied.de.txt, буклеты Hyperion, словарные выписки.

КАК РАЗБИРАТЬ КАЖДЫЙ ПУНКТ triage
— **ошибка**: снято правильно (противоречие фактам, арифметика, дубль, кухня сбора источников, оценка от себя). Возвращать нечего.
— **опора уже есть**: утверждение подтверждается полным файлом фактов, досье поэта (${REPO}/planning/research/poets/) или полной словарной карточкой (${REPO}/planning/dictionary/entries/<лемма>.json) — тогда достаточно вернуть формулировку, новый факт не нужен (укажи номер Ф или лемму карточки).
— **нашлась опора**: проверь по источникам (бюджет — до 3 обращений к сети на пункт: Deutsches Textarchiv, Wikisource, LiederNet, IMSLP, буклеты, научные статьи; сначала смотри предзагруженное). Подтвердилось — впиши НОВЫЙ факт в файл фактов песни следующим свободным номером в формате файла («**Ф№.** утверждение — источник — «дословная цитата ≤120 знаков» — **verified|secondary**»), URL нового источника добавь в шапку «Источники».
— **не подтвердилось**: допиши строку в раздел «Не подтвердилось / не найдено» файла фактов и оставь пункт снятым.

РЕЗУЛЬТАТ — ОДИН вызов Write: ${CLAIMS} вида
{"d":"${s.d}","restore":[{"what":"<что вернуть, дословно как формулировать>","support":"<Ф12 | карточка lemma | досье Ф7>","where":"<куда: адрес строки «3.1» или раздел «Музыка»>"}],"rejected":[{"what":"…","why":"…"}],"facts_added":<число>}
Если возвращать нечего — пустой массив restore.
ЗАПРЕТЫ: страницу песни (${CAND}) не менять — ты только собираешь claims; чужие песни не трогать; субагентов не спавнить.
Верни по схеме: d="${s.d}", n_restore, n_rejected, facts_added, tool_calls.`, {
    label: `проверка D ${s.d}`, phase: 'Триаж и проверка', model: 'sonnet', effort: 'high',
    schema: { type: 'object', properties: { d: { type: 'string' }, n_restore: { type: 'number' }, n_rejected: { type: 'number' }, facts_added: { type: 'number' }, tool_calls: { type: 'number' } }, required: ['d', 'n_restore', 'tool_calls'] },
  })

  if (!check || !check.n_restore) return { d: s.d, check, skipped: true }

  const put = await agent(`Ты — автор страниц проекта «все песни Шуберта с пословным русским переводом». По песне D ${s.d} проверка подтвердила несколько утверждений, снятых когда-то со страницы как неопёртые. Верни их на место.

ЧТО ПРОЧИТАТЬ: Read ${CLAIMS} (что вернуть, чем опёрто, куда), затем ${CAND} (нынешняя страница). При необходимости — ${REPO}/planning/research/${s.slug}-facts.md. Закон стиля: ${REPO}/planning/catalog/one-shot-brief.md (без ИИ-артефактов, без кухни сбора источников, secondary — с атрибуцией, «ё» везде).

ЧТО СДЕЛАТЬ: вернуть каждое подтверждённое утверждение в то место, где оно уместно, — в сноску к своей строке или в раздел «О песне». Не дублируй то, что уже сказано на странице другими словами: если мысль уже есть, пункт пропусти. Формулируй заново и по-русски, а не вставляй старую фразу механически. Немецкий текст, сегменты и набор немецких слов НЕ менять.

КАК СОХРАНИТЬ: ОДИН вызов Write — ${args.workDir}/work/edits-${s.slug}.json вида {"d":"${s.d}","edits":[{"type":"ann","line":"3.1","index":0,"text":"…"},{"type":"ann_add","line":"2.3","ann":{"type":"meaning","segment_range":[0,2],"text":"…"}},{"type":"section","index":4,"title":"Музыка","text":"…"}],"removed":[],"flags":[]}. Затем ОДИН Bash: node ${REPO}/planning/scripts/apply-edits.js ${s.d} ${args.workDir} — при ОТКЛОНЕНО или ERROR поправь файл правок и повтори один раз.
Верни по схеме: d="${s.d}", ok, n_applied, skipped (сколько пунктов пропущено как уже сказанные), tool_calls.`, {
    label: `возврат D ${s.d}`, phase: 'Возврат', model: 'opus', effort: 'high',
    schema: { type: 'object', properties: { d: { type: 'string' }, ok: { type: 'boolean' }, n_applied: { type: 'number' }, skipped: { type: 'number' }, tool_calls: { type: 'number' } }, required: ['d', 'ok', 'n_applied', 'tool_calls'] },
  })

  const vet = await agent(`Ты — финальный редактор проекта «все песни Шуберта с пословным русским переводом». На страницу D ${s.d} только что вернули утверждения, снятые прежней редактурой и теперь подтверждённые источниками. Вычитай ТОЛЬКО возвращённое — остальная страница вычитана раньше.

Read ${CLAIMS} (что возвращали и чем опёрто) и ${CAND} (страница). Проверь: (1) каждое возвращённое утверждение действительно опёрто указанным фактом или карточкой, secondary — с атрибуцией; (2) оно не дублирует соседнюю сноску или раздел; (3) язык по закону проекта — без «не X, а Y» как украшения, без канцелярита, без кухни сбора источников, «ё» везде; (4) сноска стоит на своём диапазоне.
ОДИН вызов Write: ${args.workDir}/work/edits-${s.slug}.json (формат правок тот же), затем ОДИН Bash: node ${REPO}/planning/scripts/apply-edits.js ${s.d} ${args.workDir}. Если править нечего — пустой массив edits, но команду всё равно выполни.
Верни по схеме: d="${s.d}", ok, n_changes, removed, flags, tool_calls.`, {
    label: `вычитка D ${s.d}`, phase: 'Вычитка', model: 'fable', effort: 'medium',
    schema: { type: 'object', properties: { d: { type: 'string' }, ok: { type: 'boolean' }, n_changes: { type: 'number' }, removed: { type: 'array', maxItems: 6, items: { type: 'object', properties: { what: { type: 'string', maxLength: 160 }, why: { type: 'string', maxLength: 160 } }, required: ['what', 'why'] } }, flags: { type: 'array', maxItems: 4, items: { type: 'string', maxLength: 160 } }, tool_calls: { type: 'number' } }, required: ['d', 'ok', 'n_changes', 'tool_calls'] },
  })
  return { d: s.d, check, put, vet }
}
const PAR = args.parallel || 6
const results = []
for (let i = 0; i < args.songs.length; i += PAR) {
  const batch = await parallel(args.songs.slice(i, i + PAR).map((s) => () => perSong(s)))
  results.push(...batch); log(`готово ${Math.min(i + PAR, args.songs.length)}/${args.songs.length}`)
}
return { results: results.filter(Boolean) }
