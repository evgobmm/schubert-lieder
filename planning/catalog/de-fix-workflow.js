export const meta = {
  name: 'de-text-fix',
  description: 'Правка немецких текстов корпуса по вердиктам defect: подтверждение двумя источниками → правка lines_de и сегмента → запись факта',
  phases: [{ title: 'Правка текстов' }],
}
// args = {groups: [{id, songs:["166", ...]}]}
const REPO = '/workspaces/schubert-lieder'
const one = (g) => agent(`Ты — текстолог-исполнитель проекта «все песни Шуберта с пословным русским переводом». Правишь немецкий текст корпуса по вердиктам аудита для песен: D ${g.songs.join(', D ')}. Работа идёт по протоколу ${REPO}/docs/rules/verification-protocol.md, §1 — прочитай его первым делом (Read).

ЧТО ПРАВИТЬ
Твои пункты — строки со статусом **defect** из ${REPO}/planning/reports/de-text-verdicts.md (раздел «Вероятные ошибки текста проекта»). Выбери из таблицы строки только своих песен: Bash: node -e 'const fs=require("fs");const t=fs.readFileSync("${REPO}/planning/reports/de-text-verdicts.md","utf8");for(const l of t.split("\\n"))for(const d of ${JSON.stringify(g.songs)})if(l.startsWith("| D "+d+" |"))console.log(l);'

ПОРЯДОК ПО КАЖДОМУ ПУНКТУ (иначе не правишь)
1. **Подтверждение двумя источниками.** Открой предзагруженные источники песни: каталоги /home/vscode/schubert-waves/*/prefetch/<slug>/ — schubertsong.uk.txt (критический текст Петера Растля: в нём обычно есть и текст песни, и «Original Spelling», и оригинал поэта) и schubertlied.de.txt. Нужны ДВА независимых чтения в пользу правки. Если второго источника в кэше нет, допускается до 3 обращений к сети (Bash curl, sed 's/<[^>]*>/ /g'): Deutsches Textarchiv (deutschestextarchiv.de), Wikisource (de.wikisource.org), LiederNet (lieder.net). Не подтверждено двумя — НЕ правишь, пункт идёт в отчёт как unresolved с причиной.
2. **Правка файла песни** ${REPO}/app/src/data/songs/<file>.json (file найдёшь: node -e 'const i=require("${REPO}/app/src/data/index.json");console.log(i.find(x=>String(x.d)==="<d>").file)'). Правится ОДНОВРЕМЕННО: строка в stanzas[].lines_de И поле de соответствующего сегмента в lines_ru[].segments (валидатор сверяет множество немецких слов строки — если поправить только lines_de, он упадёт). Если правка меняет смысл слова, поправь и русский сегмент, и аннотацию, которая цитирует старую форму. Ничего сверх пунктов вердикта не трогай: ни перевода, ни разделов «О песне».
3. **Запись факта.** В файл ${REPO}/planning/research/<slug>-facts.md добавь в раздел «3. Текст и источник» новый факт следующим свободным номером: «**Ф№.** <что исправлено: было → стало, адрес строки> — <короткое имя источника> — «<дословная цитата>»; <второй источник> — «<цитата>» — **verified**». Расхождение «Шуберт против поэта» фиксируется отдельно с обоими чтениями.
4. **Проверка.** Bash: node ${REPO}/planning/scripts/check-song-file.js ${REPO}/app/src/data/songs/<file>.json — должно быть ERROR 0; затем node ${REPO}/planning/scripts/lint-style.js ${REPO}/app/src/data/songs/<file>.json. При ERROR — чини и повторяй (не больше двух кругов на песню).

ЗАПРЕТЫ: не менять песни, которых нет в твоём списке; не трогать «Зимний путь» (D 911); не переписывать разделы «О песне» и подстрочник сверх затронутых слов; временные файлы — только в /tmp/claude-1000/-workspaces-schubert-lieder/6dd19060-2ba3-4979-b2ed-3349f9729473/scratchpad; субагентов не спавнить.

Верни по схеме: group="${g.id}", applied (сколько правок внесено), unresolved (сколько отклонено из-за нехватки источников), songs_touched, notes (до 400 знаков: что именно исправлено и что отклонено), tool_calls.`, {
  label: `правка ${g.id}`, phase: 'Правка текстов', model: 'opus', effort: 'high',
  schema: { type: 'object', properties: { group: { type: 'string' }, applied: { type: 'number' }, unresolved: { type: 'number' }, songs_touched: { type: 'number' }, notes: { type: 'string', maxLength: 400 }, tool_calls: { type: 'number' } }, required: ['group', 'applied', 'unresolved', 'tool_calls'] },
})
const res = await parallel(args.groups.map((g) => () => one(g)))
return { res }
