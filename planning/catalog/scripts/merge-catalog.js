// Merge NSA Lied rows (authority for corpus + year/opus/NGA) with IMSLP rows (full incipits, keys, publication, versions)
const fs = require('fs');
const nsa = require('./nsa-lied.json');
const imslp = require('./imslp-works.json');

const normD = d => d.replace(/\s+/g, '').toUpperCase();

// group IMSLP rows by D
const byD = {};
for (const r of imslp) {
  const d = normD(r.d);
  (byD[d] = byD[d] || []).push(r);
}

const catalog = [];
const missingInImslp = [];
for (const n of nsa) {
  const d = normD(n.d);
  const irows = byD[d] || [];
  // prefer a "v pf"-ish row; else first
  const soloForces = ['v pf', 'bass pf', 'v cl pf', 'v hn/vc pf', 'v pf (?)', 'bass pf (?)', 'v gtr', 'v bc'];
  const main = irows.find(r => soloForces.includes(r.forces)) || irows[0];
  if (!main) missingInImslp.push({ d: n.d, title: n.title });
  catalog.push({
    d: n.d,
    title: n.title,
    year_nsa: n.chrono,
    opus: n.opus === '-' ? '' : n.opus,
    nga: n.nga,
    comment: n.comment,
    poet_short: n.poet === '–' ? '' : n.poet,
    nsa_detail_id: n.detailId,
    incipit: main ? main.incipit : (n.incipit === '–' ? '' : n.incipit),
    key: main ? main.key : '',
    year_imslp: main ? main.date : '',
    published: main ? main.published : '',
    forces: main ? main.forces : '',
    imslp: main ? main.imslp : '',
    imslp_versions: irows.length,
    notes_imslp: main ? main.notes : '',
  });
}

// NSA-side check: IMSLP solo D's not present in NSA Lied list
const nsaDs = new Set(nsa.map(r => normD(r.d)));
const soloForces = new Set(['v pf', 'bass pf', 'v cl pf', 'v hn/vc pf', 'v pf (?)', 'bass pf (?)', 'v gtr', 'v bc']);
const imslpSoloDs = [...new Set(imslp.filter(r => soloForces.has(r.forces)).map(r => normD(r.d)))];
const notInNsa = imslpSoloDs.filter(d => !nsaDs.has(d));

fs.writeFileSync(__dirname + '/catalog-draft.json', JSON.stringify(catalog, null, 1));
console.log('catalog entries:', catalog.length);
console.log('NSA entries missing in IMSLP:', missingInImslp.length, JSON.stringify(missingInImslp.slice(0, 20)));
console.log('IMSLP solo D not in NSA Lied:', notInNsa.length);
console.log(notInNsa.slice(0, 60).join(', '));
// year sanity: NSA vs IMSLP year mismatch
let mismatch = 0; const ex = [];
for (const c of catalog) {
  const yN = (c.year_nsa.match(/\d{4}/) || [])[0];
  const yI = (c.year_imslp.match(/\d{4}/) || [])[0];
  if (yN && yI && yN !== yI) { mismatch++; if (ex.length < 12) ex.push(`D${c.d}: NSA ${c.year_nsa} vs IMSLP ${c.year_imslp}`); }
}
console.log('year mismatches NSA vs IMSLP:', mismatch, ex);
// year histogram (NSA)
const hist = {};
for (const c of catalog) { const y = (c.year_nsa.match(/\d{4}/) || ['????'])[0]; hist[y] = (hist[y] || 0) + 1; }
console.log('year histogram:', Object.entries(hist).sort());
