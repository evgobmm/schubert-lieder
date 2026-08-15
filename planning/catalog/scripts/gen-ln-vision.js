// Генератор воркфлоу зрительной проверки/дополнения текстов по сканам AGA.
// Запуск: node gen-ln-vision.js <sliceFile> <outWorkflowFile> <batchName>
const fs = require('fs');
const [sliceFile, outFile, name] = process.argv.slice(2);
const items = JSON.parse(fs.readFileSync(sliceFile, 'utf8'));
const OUT = '/tmp/claude-1000/-workspaces-schubert-lieder/ce785a03-6f80-44d5-9069-10dc690add23/scratchpad/ln-vis';

function prompt(it) {
  const dkey = it.d.replace('/', '-');
  const urls = it.targetPages.map(tp => {
    const p5 = String(tp.p ?? tp.from).padStart(5, '0');
    return `https://api.digitale-sammlungen.de/iiif/image/v2/${tp.bsb}_${p5}/full/1400,/0/default.jpg`;
  });
  const dl = urls.map((u, i) => `curl -s "${u}" -o ${OUT}/img/${dkey}_${i}.jpg`).join(' && ');
  const disp = (it.disputes || []).filter(x => x.line).map((x, i) =>
    `${i + 1}) в строке «${x.line}»: напечатано «${x.ours}» или «${x.ln}» (или иначе — процитируй точно)?`).join('\n');
  return `Транскрипция из скана старого издания песен Шуберта (AGA, антиква, немецкий). Песня D ${it.d}.
Шаги:
1. Скачай страницы: mkdir -p ${OUT}/img && ${dl}
2. Прочитай каждую картинку инструментом Read и внимательно рассмотри.
3. ${it.mode === 'full'
    ? 'Перепиши ВЕСЬ текст песни как поётся: подтекстовку под нотами (с повторами) и, если есть, печатные куплеты после нот.'
    : 'Найди ПЕЧАТНЫЕ БЛОКИ СТРОФ (куплеты стихов после/под нотами, часто пронумерованы 2., 3., …; бывают в две колонки — читай колонки по отдельности, сверху вниз). Перепиши их ТОЧНО как напечатано: старая орфография (th, ey, Todt…), пунктуация, регистр, порядок строк; каждый куплет — отдельным списком строк. НЕ добавляй ничего от себя. Если блоков строф на страницах нет — verses: [].'}
${it.missing > 0 ? 'У песни, судя по каталогу, есть текст сверх первого куплета — ищи внимательно, включая низ последней страницы.' : ''}
${disp ? '4. Проверь спорные слова по печати:\n' + disp : ''}
5. Запиши результат в файл ${OUT}/${dkey}.json строго в формате:
{"d":"${it.d}","verses":[["строка куплета",...],...],"disputes":[{"ours":"<спорное слово из вопроса>","print":"<что напечатано>"}],"notes":"кратко"}
Правила: текст песни в ответ НЕ выводи — только в файл; субагентов не запускай; временные файлы — только в ${OUT}; если curl не скачал (файл <10КБ) — повтори один раз; если страницы нечитаемы — запиши файл с verses:[] и notes с причиной.
В ответ верни только краткий итог.`;
}

const lines = [];
lines.push(`export const meta = { name: '${name}', description: 'Зрение по AGA: куплеты и спорные слова (${items.length} песен)', phases: [{ title: 'Vision' }] }`);
lines.push(`const PROMPTS = ${JSON.stringify(items.map(it => ({ d: it.d, p: prompt(it) })))};`);
lines.push(`phase('Vision');`);
lines.push(`const SCHEMA = { type: 'object', properties: { d: { type: 'string' }, verses: { type: 'number' }, lines: { type: 'number' }, disputes: { type: 'number' }, ok: { type: 'boolean' } }, required: ['d', 'ok'] };`);
lines.push(`const res = await parallel(PROMPTS.map(x => () => agent(x.p, { label: 'D' + x.d, model: 'sonnet', effort: 'low', schema: SCHEMA })));`);
lines.push(`const good = res.filter(Boolean).filter(r => r.ok);`);
lines.push(`log('готово: ' + good.length + '/' + PROMPTS.length);`);
lines.push(`return { done: res.filter(Boolean).length, ok: good.length };`);
fs.writeFileSync(outFile, lines.join('\n'));
console.log('workflow written:', outFile, 'items:', items.length, 'bytes:', fs.statSync(outFile).size);
