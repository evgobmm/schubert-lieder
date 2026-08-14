// Parse NSA Schubert-Datenbank genre=Lied table → JSON
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/nsa-all.html', 'utf8');

const clean = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();

// isolate table body
const bodyStart = html.indexOf('<tbody');
const body = bodyStart > -1 ? html.slice(bodyStart) : html;
const rows = [];
const trRe = /<tr>([\s\S]*?)<\/tr>/g;
let m;
while ((m = trRe.exec(body))) {
  const cellRe = /<td([^>]*)>([\s\S]*?)<\/td>/g;
  const cells = [];
  let c;
  while ((c = cellRe.exec(m[1]))) cells.push({ attrs: c[1], raw: c[2], text: clean(c[2]) });
  if (!cells.length) continue;
  const rec = { d: null, title: '', chrono: '', opus: '', nga: '', comment: '', poet: '', incipit: '', detailId: null };
  let i = 0;
  if (/footable-first-column/.test(cells[0].attrs)) { rec.d = cells[0].text; i = 1; }
  // title cell = the one with FORM[detail] link
  if (i < cells.length && /FORM\[detail\]=(\d+)/.test(cells[i].raw)) {
    rec.detailId = +cells[i].raw.match(/FORM\[detail\]=(\d+)/)[1];
    rec.title = cells[i].text; i++;
  }
  if (i < cells.length) { rec.chrono = cells[i].text; i++; }
  if (i < cells.length && !/footable-last-column/.test(cells[i].attrs)) { rec.opus = cells[i].text; i++; }
  // middle cells until last column
  const mid = [];
  while (i < cells.length && !/footable-last-column/.test(cells[i].attrs)) { mid.push(cells[i].text); i++; }
  if (i < cells.length) rec.incipit = cells[i].text;
  // classify mid cells: NGA looks like "IV/1a" or "III/2"; poet like "Name, ..." typically with comma
  for (const t of mid) {
    if (!t) continue;
    if (/^[IVX]+[a-b]?\/\S+/.test(t) && !rec.nga) rec.nga = t;
    else if (/,/.test(t) && !rec.poet) rec.poet = t;
    else if (!rec.comment) rec.comment = t;
    else rec.poet = rec.poet || t;
  }
  rows.push(rec);
}
// carry down D for continuation rows (same D, multiple entries)
let lastD = null;
for (const r of rows) { if (r.d) lastD = r.d; else r.d = lastD ? lastD + '(cont)' : null; }
fs.writeFileSync(__dirname + '/nsa-lied.json', JSON.stringify(rows, null, 1));
console.log('rows:', rows.length);
console.log('with D:', rows.filter(r => r.d && !/cont/.test(r.d)).length, 'continuation rows:', rows.filter(r => /cont/.test(r.d)).length);
console.log('with chrono:', rows.filter(r => r.chrono).length, 'with poet:', rows.filter(r => r.poet).length, 'with nga:', rows.filter(r => r.nga).length);
console.log('sample 118:', JSON.stringify(rows.find(r => r.d === '118')));
console.log('sample 119:', JSON.stringify(rows.find(r => r.d === '119')));
console.log('first 3:', JSON.stringify(rows.slice(0, 3)));
