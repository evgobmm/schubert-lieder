// Генератор воркфлоу перевода. Использование: node gen-translate.js <список-D-через-запятую> <out.js>
// Экономия: sonnet; перевод effort medium (продукт!), ревью low. Страж — скриптом в воркфлоу:
// склейка segments[].de должна точно (до пробелов) равняться строке lines_de — иначе retry/suspect.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const [dsArg, outFile] = process.argv.slice(2);
const ds = dsArg.split(',').map(s => s.trim());
const pub = require(path.join(ROOT, 'planning/catalog/sources/texts-published.json'));
const cat = require(path.join(ROOT, 'planning/catalog/catalog.json'));
const digest = fs.readFileSync(path.join(ROOT, 'planning/catalog/translation-digest.md'), 'utf8');
const byD = {}; cat.forEach(r => { byD[r.d] = r; });
const pubByD = {}; pub.forEach(p => { pubByD[p.d] = p; });

const items = ds.map(d => {
  const p = pubByD[d];
  if (!p) { console.error('нет текста:', d); process.exit(1); }
  return { d, title: byD[d].title, poet: byD[d].poet_full || '', stanzas: p.stanzas };
});

const script = `export const meta = {
  name: 'translate-songs',
  description: 'Word-by-word Russian translation per digest; mechanical de-tiling guard + review',
  phases: [{ title: 'Translate' }, { title: 'Review' }],
}
const OUT = { type:'object', required:['title_ru','stanzas'], properties:{
  title_ru:{type:'string'},
  poet_ru:{type:'string',description:'имя поэта по-русски'},
  stanzas:{type:'array',items:{type:'array',items:{type:'object',required:['segments'],properties:{
    segments:{type:'array',items:{type:'object',required:['ru','de'],properties:{
      ru:{type:'string'},de:{type:'string'},variant_ru:{type:'string'},variant_de:{type:'string'}}}},
    annotations:{type:'array',items:{type:'object',required:['type','segment_range','text'],properties:{
      type:{type:'string',enum:['lang','meaning']},
      segment_range:{type:'array',items:{type:'integer'}},
      line_span:{type:'integer'},
      text:{type:'string'}}}}}}}} } }
const REV = { type:'object', required:['verdict','issues'], properties:{
  verdict:{type:'string',enum:['ok','fix']}, issues:{type:'array',items:{type:'string'}} } }
const DIGEST = ${JSON.stringify(digest)}
const items = ${JSON.stringify(items)}

const norm = s => s.replace(/\\s+/g, ' ').trim()
const guard = (it, r) => {
  if (!r || !r.stanzas) return 'empty'
  if (r.stanzas.length !== it.stanzas.length) return 'строф ' + r.stanzas.length + ' вместо ' + it.stanzas.length
  for (let s = 0; s < it.stanzas.length; s++) {
    if (r.stanzas[s].length !== it.stanzas[s].length) return 'строфа ' + (s+1) + ': строк ' + r.stanzas[s].length + ' вместо ' + it.stanzas[s].length
    for (let l = 0; l < it.stanzas[s].length; l++) {
      const line = r.stanzas[s][l]
      if (!line.segments || !line.segments.length) return 'строфа ' + (s+1) + ' строка ' + (l+1) + ': нет сегментов'
      const tiled = norm(line.segments.map(x => x.de).join(' '))
      if (tiled !== norm(it.stanzas[s][l])) return 'строфа ' + (s+1) + ' строка ' + (l+1) + ': de-склейка «' + tiled.slice(0,60) + '» ≠ «' + norm(it.stanzas[s][l]).slice(0,60) + '»'
      if (line.segments.some(x => !x.ru || !x.ru.trim())) return 'строфа ' + (s+1) + ' строка ' + (l+1) + ': пустой ru'
    }
  }
  return null
}

const mkPrompt = it => \`Сделай пословный русский подстрочник песни Шуберта «\${it.title}» (D \${it.d})\${it.poet ? ', стихи: ' + it.poet : ''} по правилам ниже.

ПРАВИЛА:
\${DIGEST}

НЕМЕЦКИЙ ТЕКСТ (строфы из строк; сохрани структуру ТОЧНО — те же строфы, те же строки):
\${JSON.stringify(it.stanzas)}

ЖЁСТКО: для каждой строки массив segments, где склейка полей de через пробел ТОЧНО воспроизводит строку (все слова, тот же порядок, та же орфография и пунктуация). Аннотации — только там, где реально нужны читателю (обычно 0–3 на песню каждого типа). Также дай title_ru и poet_ru.\`

phase('Translate')
const results = await pipeline(
  items,
  it => agent(mkPrompt(it), { label:'tr:D'+it.d, phase:'Translate', schema: OUT, model:'sonnet', effort:'medium' }),
  async (res, it) => {
    let err = guard(it, res)
    if (err) {
      const res2 = await agent(mkPrompt(it) + '\\n\\nОШИБКА прошлой попытки: ' + err + '. Исправь структуру.',
        { label:'trR:D'+it.d, phase:'Translate', schema: OUT, model:'sonnet', effort:'medium' })
      err = guard(it, res2)
      if (err) return { d: it.d, error: err }
      res = res2
    }
    return { d: it.d, out: res }
  },
  async (r, it) => {
    if (!r || r.error) return r
    const v = await agent(\`Проверь пословный подстрочник по правилам. ПРАВИЛА:\\n\${DIGEST}\\n\\nПЕРЕВОД (JSON):\\n\${JSON.stringify(r.out.stanzas)}\\n\\nИщи только реальные нарушения: неверный смысл слова, нарушение порядка без причины, слипшиеся сегменты там, где можно пословно, кальки, пропущенные из перевода слова. verdict='fix' при нарушениях.\`,
      { label:'rev:D'+it.d, phase:'Review', schema: REV, model:'sonnet', effort:'low' })
    return { ...r, review: v || { verdict:'fix', issues:['review failed'] } }
  }
)
const out = results.filter(Boolean)
log('ok: '+out.filter(r=>r.review&&r.review.verdict==='ok').length+' | fix: '+out.filter(r=>r.review&&r.review.verdict==='fix').length+' | err: '+out.filter(r=>r.error).length)
return out
`;
fs.writeFileSync(outFile, script);
console.error('воркфлоу:', outFile, Math.round(script.length / 1024) + 'KB,', items.length, 'песен');
