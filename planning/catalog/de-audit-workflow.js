export const meta = {
  name: 'de-text-audit',
  description: 'Вердикты по расхождениям немецких текстов корпуса с источниками (sonnet, без Fable): артефакт / версия Шуберта / ошибка проекта',
  phases: [{ title: 'Вердикты' }],
}
// args = {out: <каталог для вердиктов>, groups: [{id, songs: ["862", ...]}]}
const REPO = '/workspaces/schubert-lieder'
const one = (g) => agent(`Ты — текстолог проекта «все песни Шуберта с пословным русским переводом». Задача: вынести вердикт по расхождениям немецкого текста проекта с источниками для песен: D ${g.songs.join(', D ')}.

ОТКУДА БРАТЬ РАСХОЖДЕНИЯ
Bash: node -e 'const fs=require("fs");const t=fs.readFileSync("${REPO}/planning/reports/de-text-audit.md","utf8");for(const d of ${JSON.stringify(g.songs)}){const re=new RegExp("### D "+d.replace("/","\\\\/")+" [\\\\s\\\\S]*?(?=\\\\n### |$)");const m=t.match(re);if(m)console.log(m[0]);}'
Это список строк вида «адрес | в проекте: слова | в источнике: слова». Адрес — «строфа.строка», обе с 1.

ЧТО ЧИТАТЬ ПО КАЖДОЙ ПЕСНЕ
1. Файл песни: ${REPO}/app/src/data/songs/<slug>.json — поле stanzas[].lines_de (slug ищи так: Bash: node -e 'const i=require("${REPO}/app/src/data/index.json");console.log(i.find(x=>String(x.d)==="<d>").file)').
2. Предзагруженные источники: ищи каталоги /home/vscode/schubert-waves/*/prefetch/<slug-без-.json>/ — файлы schubertsong.uk.txt (критический текст Петера Растля, обычно даёт и текст песни, и «Original Spelling», и оригинал поэта) и schubertlied.de.txt. Читай их Read-инструментом или через Bash (grep/sed с контекстом), целиком открывать не обязательно.
3. Файл фактов песни ${REPO}/planning/research/<slug>-facts.md — там часто уже разобрано, что Шуберт изменил против поэта.

ВЕРДИКТ ПО КАЖДОМУ ПУНКТУ — ровно одна из категорий:
— **artifact**: расхождение мнимое. Причины: вёрстка страницы-источника (заголовок, подпись, склейка строк), шубертовский повтор, орфография эпохи, разбивка композита, диакритика.
— **schubert**: текст проекта верен, он передаёт версию Шуберта, а источник цитирует стихотворение поэта (или наоборот — источник даёт вариант другой редакции). Проверь, оговорено ли это на странице: в файле фактов или в разделе «Стихотворение». Если НЕ оговорено — пометь need_note: true.
— **defect**: в тексте проекта вероятная ошибка (опечатка, чужое слово, пропуск). Указывай, какое чтение верно и какими ДВУМЯ источниками оно подтверждено (двух нет — вердикт uncertain, не defect).
— **uncertain**: источники расходятся между собой или доступен только один; поясни, чего не хватает.

ЗАПРЕТЫ: ничего не менять в ${REPO} — ни песен, ни фактов, ни досье; ты только выносишь вердикты. Немецкий текст не «исправлять» на месте. Сеть не нужна: работай по предзагруженным источникам; если источника нет — вердикт uncertain с пометкой «нет источника». Субагентов не спавнить.

РЕЗУЛЬТАТ — ОДИН вызов Write: файл ${'${'}args.out${'}'}/verdicts-${g.id}.json вида
{"group":"${g.id}","items":[{"d":"862","addr":"3.4","verdict":"artifact|schubert|defect|uncertain","project":"<слово(а) в проекте>","source":"<слово(а) в источнике>","why":"<коротко, с именем источника>","need_note":false,"fix":"<для defect: верное чтение>"}]}
Верни по схеме: group, n_items, n_defect, n_schubert, n_artifact, n_uncertain, tool_calls.`, {
  label: `аудит ${g.id}`, phase: 'Вердикты', model: 'sonnet', effort: 'medium',
  schema: { type: 'object', properties: { group: { type: 'string' }, n_items: { type: 'number' }, n_defect: { type: 'number' }, n_schubert: { type: 'number' }, n_artifact: { type: 'number' }, n_uncertain: { type: 'number' }, tool_calls: { type: 'number' } }, required: ['group', 'n_items', 'tool_calls'] },
})
const res = await parallel(args.groups.map((g) => () => one(g)))
return { res }
