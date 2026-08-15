// Слияние исследовательских результатов (PD-издания) для песен вне AGA.
// «Не тот текст» → полная замена (принимается при покрытии эталона >=0.8);
// пропуски → вставка строк, совпадающих с пропавшими строками эталона (sim>=0.6).
// Запуск: node ln-merge-research.js <researchDir> <pagesDir> [--apply]
const fs = require('fs');
const path = require('path');
const { norm, extractPre, sim, align } = require('./ln-lib');
const DIR = process.argv[2], PAGES = process.argv[3];
const APPLY = process.argv.includes('--apply');
const TP = path.join(__dirname, '../sources/texts-published.json');
const tp = JSON.parse(fs.readFileSync(TP, 'utf8'));
const keyByD = {}; for (const k of Object.keys(tp)) keyByD[tp[k].d] = k;
const WRONG = new Set(['363', '469', '503', '919']);
const cap = l => { const m = l.match(/^([^a-zA-ZäöüßÄÖÜ]*)([a-zäöüß])(.*)$/s); return m ? m[1] + m[2].toUpperCase() + m[3] : l; };

for (const f of fs.readdirSync(DIR).filter(x => /^[0-9]+[A-E]?\.json$/.test(x))) {
  let res;
  try { res = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { console.log(f, 'parse-fail'); continue; }
  const d = res.d;
  if (!d || !keyByD[d]) { console.log(f, 'no-key'); continue; }
  const stanzas = (res.stanzas || []).filter(s => Array.isArray(s) && s.length);
  if (!stanzas.length) { console.log(d, 'пустой результат:', String(res.notes || '').slice(0, 80)); continue; }
  const entry = tp[keyByD[d]];
  const pageFile = path.join(PAGES, d.replace('/', '-') + '.html');
  if (!fs.existsSync(pageFile)) { console.log(d, 'нет страницы эталона — пропуск'); continue; }
  const ln = extractPre(fs.readFileSync(pageFile, 'utf8'));
  const lnLines = ln.flat();
  const resLines = stanzas.flat();
  if (WRONG.has(d)) {
    // структура по эталону: берём из результата строки, покрывающие эталон
    const { lnState, ourToLn } = align(lnLines, resLines);
    const covered = lnState.filter(s => s !== 'missing').length / lnLines.length;
    if (covered < 0.8) { console.log(d, 'ЗАМЕНА ОТКЛОНЕНА: покрытие', covered.toFixed(2)); continue; }
    // собираем в строфы эталона: для каждой LN-строки — строка результата
    const lnToRes = new Array(lnLines.length).fill(null);
    ourToLn.forEach((rng, j) => { if (rng) for (let t = rng[0]; t < rng[1]; t++) if (!lnToRes[t]) lnToRes[t] = resLines[j]; });
    const newStanzas = [];
    let idx = 0;
    for (const st of ln) {
      const cur = [];
      for (let t = 0; t < st.length; t++, idx++) if (lnToRes[idx]) cur.push(cap(lnToRes[idx]));
      if (cur.length) newStanzas.push(cur);
    }
    console.log(d, 'ЗАМЕНА: покрытие', covered.toFixed(2), '| строф:', newStanzas.length, '| строк:', newStanzas.flat().length);
    if (APPLY) {
      entry.stanzas = newStanzas;
      entry.status = 'pd-edition-verified';
      entry.source_detail = String(res.source || '').slice(0, 300) + '; структура и охват — по эталону Растля';
    }
  } else {
    const ourLines = entry.stanzas.flat();
    const { lnState, ourToLn } = align(lnLines, ourLines);
    const lnStanzaOf = []; ln.forEach((st, si) => st.forEach(() => lnStanzaOf.push(si)));
    const rec = {};
    for (const line of resLines) {
      const lineN = norm(line);
      if (!lineN) continue;
      let bestI = -1, bestS = 0;
      lnLines.forEach((l, i) => { if (lnState[i] !== 'missing' || rec[i]) return; const s = sim(norm(l), lineN); if (s > bestS) { bestS = s; bestI = i; } });
      if (bestI >= 0 && bestS >= 0.6) rec[bestI] = line;
    }
    const got = Object.keys(rec).length;
    const missTotal = lnState.filter(s => s === 'missing').length;
    console.log(d, 'вставка:', got, 'из', missTotal, 'пропавших');
    if (!got || !APPLY) continue;
    const pending = Object.keys(rec).map(Number).sort((a, b) => a - b);
    const newStanzas = [];
    let pi = 0, flatIdx = 0;
    for (const st of entry.stanzas) {
      const cur = [];
      for (const line of st) {
        const rng = ourToLn[flatIdx];
        if (rng) while (pi < pending.length && pending[pi] < rng[0]) { cur.push(cap(rec[pending[pi]])); pi++; }
        cur.push(line);
        flatIdx++;
      }
      if (cur.length) newStanzas.push(cur);
    }
    let tail = [], tailSt = -1;
    while (pi < pending.length) {
      const i = pending[pi], si = lnStanzaOf[i];
      if (si !== tailSt && tail.length) { newStanzas.push(tail); tail = []; }
      tailSt = si; tail.push(cap(rec[i])); pi++;
    }
    if (tail.length) newStanzas.push(tail);
    entry.stanzas = newStanzas;
    entry.source_detail = ((entry.source_detail || '') + '; строфы дополнены по PD-изданию: ' + String(res.source || '').slice(0, 200)).trim();
  }
}
if (APPLY) fs.writeFileSync(TP, JSON.stringify(tp, null, 1));
console.log(APPLY ? '(записано)' : '(без записи)');
