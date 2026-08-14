// Merge schubert-digital dates + full poet names into catalog.json
const fs = require('fs');
const sd = require('./sd-works.json');
const catalog = require('/workspaces/schubert-lieder/planning/catalog/catalog.json');

// Build D -> record map from Werknummer(n)
// formats: "D 1,2 118, Opus 2" | "D 2 118,1/1" | "D 1 118" | "D 1,2 795, Opus 25" | members? check "D 1,2 795/1"?
const byD = {};
const unparsed = [];
for (const [id, rec] of Object.entries(sd)) {
  const w = rec.fields && rec.fields['Werknummer(n)'];
  if (!w) continue;
  // take the D2 (1978) number: patterns "D 1,2 <num>" or "D 2 <num>" or "D 1 <a>, D 2 <b>"
  let d2 = null;
  let m = w.match(/D\s*1,2\s*([0-9]+\s?[A-E]?(?:\/\d+)?)/);
  if (m) d2 = m[1];
  else if ((m = w.match(/D\s*2\s*([0-9]+\s?[A-E]?(?:\/\d+)?)(?![,\d\/])/))) d2 = m[1];
  else if ((m = w.match(/D\s*2\s*([0-9]+\s?[A-E]?(?:\/\d+)?)/))) d2 = m[1];
  else if ((m = w.match(/D\s*1\s*([0-9]+\s?[A-E]?(?:\/\d+)?)/))) d2 = m[1];
  if (!d2) { unparsed.push(w); continue; }
  // skip sub-version records like "118,1/1" (comma after number)
  if (new RegExp('D\\s*(?:1,2|2|1)\\s*' + d2.replace('/', '\\/') + '\\s*,\\s*\\d').test(w) && !/Opus/.test(w)) continue;
  const key = d2.replace(/\s+/g, '').toUpperCase();
  if (!byD[key]) byD[key] = { id, ...rec };
}

const norm = d => d.replace(/\s+/g, '').toUpperCase();
let matched = 0, withDate = 0;
const unmatched = [];
for (const c of catalog) {
  let rec = byD[norm(c.d)];
  if (!rec && c.d.includes('/')) rec = byD[norm(c.d.split('/')[0])];
  if (!rec) { unmatched.push(c.d); continue; }
  matched++;
  const f = rec.fields;
  c.sd_id = rec.id;
  if (f['Entstehungszeitraum']) { c.date_sd = f['Entstehungszeitraum']; withDate++; }
  if (f['Beteiligte Personen']) {
    const poets = [...f['Beteiligte Personen'].matchAll(/([^()]+?)\s*\((?:[^)]*(?:Autor|Verfasser|Übersetzer)[^)]*)\)/g)]
      .map(x => x[1].replace(/^[,;\s]+|[,;\s]+$/g, ''));
    if (poets.length) c.poet_full = poets.join(' / ');
  }
  if (f['Klassifikation']) c.sd_class = f['Klassifikation'];
}
fs.writeFileSync('/workspaces/schubert-lieder/planning/catalog/catalog.json', JSON.stringify(catalog, null, 1));
console.log('catalog:', catalog.length, 'matched sd:', matched, 'with date:', withDate);
console.log('unmatched D:', unmatched.length, unmatched.slice(0, 40).join(', '));
console.log('unparsed Werknummern:', unparsed.length, unparsed.slice(0, 10));
// date format survey
const forms = {};
for (const c of catalog) {
  if (!c.date_sd) continue;
  const f = c.date_sd
    .replace(/\d{1,2}\.\d{1,2}\.\d{4}/g, 'DD.MM.YYYY')
    .replace(/(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)/g, 'MONTH')
    .replace(/\d{4}/g, 'YYYY').replace(/\d{1,2}\./g, 'N.');
  forms[f] = (forms[f] || 0) + 1;
}
console.log('date patterns:', Object.entries(forms).sort((a, b) => b[1] - a[1]).slice(0, 25));
