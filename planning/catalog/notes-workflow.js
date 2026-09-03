export const meta = {
  name: 'schubert-vs-poet-notes',
  description: 'Оговорки «Шуберт против поэта» в разделы «Стихотворение» по вердиктам аудита (opus; Fable-проход — отдельным пакетом)',
  phases: [{ title: 'Оговорки' }],
}
// args = {groups:[{id, songs:[...]}]}
const REPO = '/workspaces/schubert-lieder'
const one = (g) => agent(`Ты — автор страниц проекта «все песни Шуберта с пословным русским переводом». Задача узкая: дописать в разделы «Стихотворение» оговорки о расхождениях между тем, что поёт Шуберт, и тем, что напечатано у поэта. Песни: D ${g.songs.join(', D ')}.

ОТКУДА БЕРУТСЯ ПУНКТЫ
Аудит немецких текстов пометил эти места как «нужна оговорка»: текст проекта верен (он передаёт версию Шуберта), но читателю на странице нигде не объяснено, что у поэта стоит иначе. Свои строки возьми так:
Bash: node -e 'const fs=require("fs");const t=fs.readFileSync("${REPO}/planning/reports/de-text-verdicts.md","utf8");for(const l of t.split("\\n"))if(/нужна оговорка/.test(l))for(const d of ${JSON.stringify(g.songs)})if(l.startsWith("| D "+d+" |"))console.log(l);'
Колонки: песня, строка, что в проекте, что в источнике, верное чтение, обоснование.

ЧТО ЧИТАТЬ ПО КАЖДОЙ ПЕСНЕ
1. Файл песни ${REPO}/app/src/data/songs/<file>.json (file: node -e 'const i=require("${REPO}/app/src/data/index.json");console.log(i.find(x=>String(x.d)==="<d>").file)') — сам текст и нынешний раздел «Стихотворение».
2. Файл фактов ${REPO}/planning/research/<slug>-facts.md — там уже могут быть факты об этом расхождении (ищи по слову из строки). **Опора только на факты**: если расхождение не зафиксировано фактом, сначала внеси его туда новым номером со ссылкой на источник и цитатой из предзагруженной страницы (/home/vscode/schubert-waves/*/prefetch/<slug>/schubertsong.uk.txt и schubertlied.de.txt), и только потом пиши оговорку.
3. Закон стиля ${REPO}/planning/catalog/one-shot-brief.md — в частности: не пускать в текст кухню сбора источников; одно написание исторических заглавий; «ё» везде; без ИИ-артефактов.

КАК ПИСАТЬ ОГОВОРКУ
Одна-две фразы в разделе «Стихотворение» (если раздела нет — добавь его на канонное место): что стоит в песне, что у поэта, по какому источнику это известно. Без пересказа всей истории текста, без оценок. Если расхождений в песне несколько — свести в один абзац, а не плодить по фразе на каждое.

ЗАПРЕТЫ: немецкий текст, сегменты подстрочника и сноски НЕ трогать; другие разделы не переписывать; песни вне своего списка не открывать; субагентов не спавнить.
ПРОВЕРКА по каждой песне: node ${REPO}/planning/scripts/check-song-file.js ${REPO}/app/src/data/songs/<file> (ERROR 0) и node ${REPO}/planning/scripts/lint-style.js ${REPO}/app/src/data/songs/<file> (0 срабатываний). Чинить и повторять, не больше двух кругов.

Верни по схеме: group="${g.id}", songs_touched, notes_written, facts_added, skipped (сколько пунктов пропущено и почему), tool_calls.`, {
  label: `оговорки ${g.id}`, phase: 'Оговорки', model: 'opus', effort: 'high',
  schema: { type: 'object', properties: { group: { type: 'string' }, songs_touched: { type: 'number' }, notes_written: { type: 'number' }, facts_added: { type: 'number' }, skipped: { type: 'string', maxLength: 300 }, tool_calls: { type: 'number' } }, required: ['group', 'songs_touched', 'notes_written', 'tool_calls'] },
})
const res = await parallel(args.groups.map((g) => () => one(g)))
return { res }
