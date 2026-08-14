// Экономный генератор транскрипционного воркфлоу: OCR-слой MDZ вместо зрения.
// Использование: node gen-transcribe-ocr.js <batch.json> <out.js>
//  1) бесплатно скачивает hOCR всех страниц партии (curl, кэш в /tmp/claude-1000/hocr/),
//  2) генерирует воркфлоу: 1 агент/песня (model sonnet, effort low) собирает текст из OCR-потока,
//  3) в воркфлоу встроена механическая проверка: каждое слово результата должно
//     содержаться в склейке OCR-токенов (ловит галлюцинации); провал -> retry, затем suspect.
// Проверка связности — отдельным дешёвым проходом (haiku) внутри того же воркфлоу.
const fs = require('fs');
const { execSync } = require('child_process');
const [batchFile, outFile] = process.argv.slice(2);
const batch = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
const CACHE = '/tmp/claude-1000/hocr';
fs.mkdirSync(CACHE, { recursive: true });

const { pageBands } = require('./hocr-bands.js');

const items = [];
for (const b of batch) {
  const pages = [];
  for (let p = b.from; p <= b.to; p++) {
    try { pages.push({ p, words: pageBands(b.bsb, p).join(' | ') }); }
    catch (e) { pages.push({ p, words: '' }); }
  }
  items.push({ d: b.d, title: b.title, poet: b.poet, bsb: b.bsb, from: b.from, to: b.to, ocr: pages });
}
console.error('hOCR подготовлен:', items.length, 'песен');

const script = `export const meta = {
  name: 'aga-ocr-transcribe',
  description: 'Assemble song texts from MDZ hOCR word streams (1 cheap agent/song + mechanical guard + cheap coherence)',
  phases: [{ title: 'Assemble' }, { title: 'Check' }],
}
const OUT = { type:'object', required:['stanzas'], properties:{
  stanzas:{type:'array',items:{type:'array',items:{type:'string'}}},
  notes:{type:'string'} } }
const VERDICT = { type:'object', required:['verdict','issues'], properties:{
  verdict:{type:'string',enum:['ok','suspect']}, issues:{type:'array',items:{type:'string'}} } }
const items = ${JSON.stringify(items)}

const superstr = it => it.ocr.map(p=>p.words).join(' ').toLowerCase()
  .replace(/[^a-zäöüßa-я]/g, '')
const wordsOf = st => st.flat().join(' ').toLowerCase().split(/[^a-zäöüß]+/).filter(w=>w.length>1)
const guard = (it, r) => {
  if (!r || !r.stanzas || !r.stanzas.length) return 'empty'
  const sup = superstr(it)
  const ws = wordsOf(r.stanzas)
  if (!ws.length) return 'no words'
  const missing = ws.filter(w => !sup.includes(w))
  const rate = missing.length / ws.length
  if (rate > 0.02) return 'not in OCR (' + (rate*100).toFixed(1) + '%): ' + [...new Set(missing)].slice(0,8).join(', ')
  return null
}

const mkPrompt = it => \`Собери текст песни Шуберта «\${it.title}» (D \${it.d})\${it.poet?', стихи: '+it.poet:''} из OCR-потока страниц старого издания (Breitkopf 1894–95). OCR содержит: заголовки, технические пометки (Serie, Op., pp, cresc, номера досок F.S., колонтитулы) и ПОДТЕКСТОВКУ — слоги под нотами (разорваны: «fin de» = finde), иногда в конце — печатные дополнительные куплеты строфической песни.

OCR ПО СТРАНИЦАМ (строки-полосы подтекстовки в порядке чтения, разделены «|»; слоги разорваны: «fin de» = finde):
\${it.ocr.map(p=>'[стр.'+p.p+'] '+p.words).join('\\n')}

ЗАДАЧА: восстанови текст ПЕСНИ КАК ПОЁТСЯ: склей слоги в слова, отбрось всё техническое, сохрани повторы, выписанные в подтекстовке; печатные дополнительные куплеты включи в порядке пения (развернув повторы по образцу подтекстованного куплета). Историческую орфографию сохраняй как в OCR (Thore, süssen…; явные ошибки OCR-распознавания исправляй по смыслу стиха). Разбей на строфы из стихотворных строк.\`

phase('Assemble')
const results = await pipeline(
  items,
  it => agent(mkPrompt(it), { label:'asm:D'+it.d, phase:'Assemble', schema: OUT, model:'sonnet', effort:'low' }),
  async (res, it) => {
    let err = guard(it, res)
    if (!err) return { d: it.d, stanzas: res.stanzas }
    const res2 = await agent(mkPrompt(it) + '\\n\\nВНИМАНИЕ: прошлая попытка провалила проверку («' + err + '»). Используй ТОЛЬКО слова, которые реально можно собрать из OCR-потока.',
      { label:'retry:D'+it.d, phase:'Assemble', schema: OUT, model:'sonnet', effort:'low' })
    err = guard(it, res2)
    if (!err) return { d: it.d, stanzas: res2.stanzas }
    return { d: it.d, error: err, stanzas: (res2||res||{}).stanzas }
  },
  async (r, it) => {
    if (!r || r.error) return r
    const v = await agent(\`Текст песни Шуберта «\${it.title}» (D \${it.d})\${it.poet?', стихи: '+it.poet:''}, собранный из OCR печатных нот. Проверь СТРОГО: осмысленность строк, порядок строф, полнота (повторы Шуберта и историческая орфография — норма). verdict='suspect' при любом реальном дефекте.

ТЕКСТ:
\${r.stanzas.map(st=>st.join('\\n')).join('\\n\\n')}\`,
      { label:'chk:D'+it.d, phase:'Check', schema: VERDICT, model:'sonnet', effort:'low' })
    return { ...r, verdict: v ? v.verdict : 'suspect', issues: v ? v.issues : ['check failed'] }
  }
)
const out = results.filter(Boolean)
log('ok: '+out.filter(r=>r.verdict==='ok').length+' | suspect: '+out.filter(r=>r.verdict==='suspect').length+' | guard-fail: '+out.filter(r=>r.error).length)
return out
`;
fs.writeFileSync(outFile, script);
console.error('воркфлоу записан:', outFile, Math.round(script.length / 1024) + 'KB');
