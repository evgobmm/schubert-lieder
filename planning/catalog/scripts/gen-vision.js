// Зрительный fallback для упрямых песен: 1 агент/песня читает страницы-изображения MDZ.
// Использование: node gen-vision.js <batch.json> <out.js>
const fs = require('fs');
const [batchFile, outFile] = process.argv.slice(2);
const batch = JSON.parse(fs.readFileSync(batchFile, 'utf8'));

const script = `export const meta = {
  name: 'aga-vision-fallback',
  description: 'Vision transcription for stubborn songs (1 agent/song, sonnet medium) + cheap check',
  phases: [{ title: 'Read' }, { title: 'Check' }],
}
const OUT = { type:'object', required:['stanzas'], properties:{
  stanzas:{type:'array',items:{type:'array',items:{type:'string'}}}, notes:{type:'string'} } }
const VERDICT = { type:'object', required:['verdict','issues'], properties:{
  verdict:{type:'string',enum:['ok','suspect']}, issues:{type:'array',items:{type:'string'}} } }
const items = ${JSON.stringify(batch)}

phase('Read')
const results = await pipeline(
  items,
  it => agent(\`Транскрибируй текст песни Шуберта «\${it.title}» (D \${it.d})\${it.poet ? ', стихи: ' + it.poet : ''} со сканов старого издания (Breitkopf 1894–95).

Через Bash скачай страницы и прочитай каждую инструментом Read:
mkdir -p /tmp/claude-1000/vis-\${it.d.replace(/\\//g,'_')} && cd /tmp/claude-1000/vis-\${it.d.replace(/\\//g,'_')} && for p in $(seq \${it.from} \${it.to}); do curl -s "https://api.digitale-sammlungen.de/iiif/image/v2/\${it.bsb}_$(printf %05d $p)/full/1400,/0/default.jpg" -o p$p.jpg; done

Выпиши подтекстовку вокальной строки слово за словом (слоги с дефисами склеивай), включая повторы; печатные дополнительные куплеты (текстовый блок после нот) включи в порядке пения. Историческую орфографию сохраняй точно. Верни stanzas — строфы из стихотворных строк.\`,
    { label:'vis:D'+it.d, phase:'Read', schema: OUT, model:'sonnet', effort:'medium' }),
  async (r, it) => {
    if (!r || !r.stanzas || !r.stanzas.length) return { d: it.d, error: 'no result' }
    const v = await agent(\`Проверь текст песни Шуберта «\${it.title}» (D \${it.d}): осмысленность строк, порядок строф, полнота (повторы Шуберта и историческая орфография — норма). verdict='suspect' при реальном дефекте.

ТЕКСТ:
\${r.stanzas.map(st=>st.join('\\n')).join('\\n\\n')}\`,
      { label:'chk:D'+it.d, phase:'Check', schema: VERDICT, model:'sonnet', effort:'low' })
    return { d: it.d, stanzas: r.stanzas, verdict: v ? v.verdict : 'suspect', issues: v ? v.issues : ['check failed'] }
  }
)
const out = results.filter(Boolean)
log('ok: ' + out.filter(r => r.verdict === 'ok').length + ' / ' + out.length)
return out
`;
fs.writeFileSync(outFile, script);
console.error('воркфлоу:', outFile, Math.round(script.length / 1024) + 'KB,', batch.length, 'песен');
