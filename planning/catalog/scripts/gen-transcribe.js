// Генератор воркфлоу транскрипции AGA-сканов.
// Использование: node gen-transcribe.js <batch.json> <out.js>
// batch.json: [{d,title,poet,bsb,from,to}] — from/to: канвасы MDZ.
const fs = require('fs');
const [batchFile, outFile] = process.argv.slice(2);
const batch = JSON.parse(fs.readFileSync(batchFile, 'utf8'));

const script = `export const meta = {
  name: 'aga-transcribe',
  description: 'Transcribe song texts from AGA/MDZ scans: two independent vision transcriptions + adjudication + coherence',
  phases: [{ title: 'Transcribe' }, { title: 'Adjudicate' }],
}
const OUT = { type:'object', required:['stanzas'], properties:{
  stanzas:{type:'array',items:{type:'array',items:{type:'string'}},description:'текст как поётся, строфы из строк'},
  extra_verses:{type:'string',description:'если под нотами/после нот напечатаны дополнительные куплеты строфической песни — их текст; иначе пусто'},
  notes:{type:'string'} } }
const FINAL = { type:'object', required:['stanzas','verdict','issues'], properties:{
  stanzas:{type:'array',items:{type:'array',items:{type:'string'}}},
  verdict:{type:'string',enum:['ok','suspect']},
  issues:{type:'array',items:{type:'string'}} } }
const items = ${JSON.stringify(batch)}

const mkT = (it, variant) => \`Ты транскрибируешь текст песни Шуберта «\${it.title}» (D \${it.d})\${it.poet ? ', стихи: ' + it.poet : ''} со сканов старого полного собрания (Breitkopf 1894–95).

СДЕЛАЙ САМ через Bash+Read:
1. Скачай страницы (канвасы \${it.from}–\${it.to}) в /tmp/claude-1000/aga-\${it.d.replace(/\\//g,'_')}-\${variant}/:
   for p in $(seq \${it.from} \${it.to}); do curl -s "https://api.digitale-sammlungen.de/iiif/image/v2/\${it.bsb}_$(printf %05d $p)/full/1800,/0/default.jpg" -o page_$p.jpg; done
2. Прочитай КАЖДУЮ страницу инструментом Read (это изображения) и выпиши подтекстовку вокальной строки слово за словом, страница за страницей. Слоги, разделённые дефисами под нотами, склеивай в слова. Повторы, выписанные в нотах, сохраняй — это текст «как поётся».
3. Если после/под нотами напечатаны дополнительные куплеты строфической песни (текстовым блоком, часто с номерами 2., 3., ...) — перепиши их тоже в extra_verses.
4. Собери результат: stanzas — строфы из стихотворных строк (повторные куплеты строфической песни включай в stanzas по порядку пения). Историческую орфографию (Thore, süssen, todt…) сохраняй точно как напечатано. Ничего не «исправляй» по памяти — только то, что видишь.
\${variant === 'b' ? 'Работай особенно внимательно на границах страниц и в местах мелких лиг.' : ''}\`

phase('Transcribe')
const results = await pipeline(
  items,
  it => parallel([
    () => agent(mkT(it, 'a'), { label: 'tA:D' + it.d, phase: 'Transcribe', schema: OUT }),
    () => agent(mkT(it, 'b'), { label: 'tB:D' + it.d, phase: 'Transcribe', schema: OUT }),
  ]),
  async (pair, it) => {
    const [a, b] = pair
    if (!a && !b) return { d: it.d, error: 'both transcribers failed' }
    const fin = await agent(\`Две независимые транскрипции текста песни Шуберта «\${it.title}» (D \${it.d})\${it.poet ? ', стихи: ' + it.poet : ''} со сканов AGA (канвасы \${it.from}–\${it.to} тома \${it.bsb}).

ВЕРСИЯ А: \${a ? JSON.stringify(a) : 'нет'}
ВЕРСИЯ Б: \${b ? JSON.stringify(b) : 'нет'}

ЗАДАЧА — арбитраж:
1. Сравни версии пословно. Где расходятся — скачай соответствующую страницу сам (curl "https://api.digitale-sammlungen.de/iiif/image/v2/\${it.bsb}_<номер 5 цифр>/full/1800,/0/default.jpg" в /tmp/claude-1000/) и прочти её Read'ом, чтобы решить по скану.
2. Собери финальный текст «как поётся»: строфы из строк; дополнительные печатные куплеты строфической песни — в порядке пения; историческая орфография как в скане.
3. verdict='ok' только если текст полный, связный и все расхождения разрешены по скану; иначе 'suspect' с перечнем проблем.\`,
      { label: 'adj:D' + it.d, phase: 'Adjudicate', schema: FINAL })
    return fin ? { d: it.d, ...fin } : { d: it.d, error: 'adjudicator failed' }
  }
)
const out = results.filter(Boolean)
log('ok: ' + out.filter(r => r.verdict === 'ok').length + ' | suspect: ' + out.filter(r => r.verdict === 'suspect').length + ' | failed: ' + out.filter(r => r.error).length)
return out
`;
fs.writeFileSync(outFile, script);
console.log('workflow written:', outFile, script.length, 'chars,', batch.length, 'songs');
