// Parse IMSLP "List of works by Franz Schubert" wikitable → JSON
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/imslp-works.html', 'utf8');

const clean = s => s
  .replace(/<span style="display:none">[^<]*<\/span>/g, '')
  .replace(/<[^>]+>/g, '')
  .replace(/&#x266d;/g, '♭').replace(/&#x266f;/g, '♯')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
  .replace(/\s+/g, ' ').trim();

const rows = [];
const trRe = /<tr>([\s\S]*?)<\/tr>/g;
let m;
while ((m = trRe.exec(html))) {
  const cells = [...m[1].matchAll(/<td>([\s\S]*?)(?=<\/td>|<td>)/g)].map(c => c[1]);
  if (cells.length < 8) continue;
  const dRaw = clean(cells[0]);
  if (!/^D\./.test(dRaw)) continue;
  const titleCell = cells[2];
  const linkM = titleCell.match(/href="\/wiki\/([^"]+)"/);
  const titleM = clean(titleCell);
  // split title vs incipit: incipit is in (“...”) at end
  let title = titleM, incipit = '';
  const incM = titleM.match(/^(.*?)\s*[\(（][“"'](.+?)[”"'][\)）]\s*(.*)$/);
  if (incM) { title = (incM[1] + (incM[3] ? ' ' + incM[3] : '')).trim(); incipit = incM[2]; }
  rows.push({
    d: dRaw.replace(/^D\./, '').trim(),
    opus: clean(cells[1]).replace(/^–$/, ''),
    title, incipit,
    imslp: linkM ? linkM[1] : '',
    forces: clean(cells[3]),
    key: clean(cells[4]).replace(/^–$/, ''),
    date: clean(cells[5]).replace(/^–$/, ''),
    genre: clean(cells[6]),
    published: clean(cells[7]).replace(/^–$/, ''),
    notes: cells[8] !== undefined ? clean(cells[8]).replace(/^–$/, '') : '',
  });
}
fs.writeFileSync(__dirname + '/imslp-works.json', JSON.stringify(rows, null, 1));
console.log('total rows:', rows.length);
const vpf = rows.filter(r => r.forces === 'v pf');
console.log('forces "v pf":', vpf.length);
const forcesCounts = {};
rows.forEach(r => { if (/(^|\s)v(\s|$)|v\s?pf|S\spf|voice/i.test(r.forces)) forcesCounts[r.forces] = (forcesCounts[r.forces]||0)+1; });
const top = Object.entries(forcesCounts).sort((a,b)=>b[1]-a[1]).slice(0,25);
console.log('voice-ish forces variants:', top);
console.log('sample:', JSON.stringify(rows.find(r=>r.d==='118')));
