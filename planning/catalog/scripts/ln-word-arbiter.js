// Словесный арбитр (контекстный): для пары «наш токен ≠ токен эталона» строим две
// гипотезы строки (с нашим словом / со словом эталона) и спрашиваем hOCR тех же
// страниц AGA: какая гипотеза ближе к напечатанному (скользящие окна по полосам).
// Выигрывает эталон с отрывом → чиним (ядро слова, пунктуация и регистр наши).
// Запуск: node ln-word-arbiter.js <pagesDir> [--apply]
const fs = require('fs');
const path = require('path');
const { norm, extractPre, align, eqTok, sim } = require('./ln-lib');
const { pageBands } = require('./hocr-bands');
const PAGES = process.argv[2];
const APPLY = process.argv.includes('--apply');
const TP = path.join(__dirname, '../sources/texts-published.json');
const tp = JSON.parse(fs.readFileSync(TP, 'utf8'));
const report = require('../ln-structure-report.json');
const agaRaw = require('../sources/aga-map-final.json');
const agaByD = {};
for (const v of Object.values(agaRaw)) if (v.d) (agaByD[v.d] = agaByD[v.d] || []).push(v);
const keyByD = {};
for (const k of Object.keys(tp)) keyByD[tp[k].d] = k;

const core = t => t.replace(/^[^A-Za-zÄÖÜäöüß]+|[^A-Za-zÄÖÜäöüß]+$/g, '');

function bestSim(hypToks, bands) {
  const target = hypToks.join(' ');
  let best = 0;
  for (const b of bands) {
    for (const w of [hypToks.length - 1, hypToks.length, hypToks.length + 1]) {
      if (w < 1 || w > b.length) continue;
      for (let s = 0; s + w <= b.length; s++) {
        const sc = sim(b.slice(s, s + w).join(' '), target);
        if (sc > best) best = sc;
      }
    }
  }
  return best;
}

const stats = { fixed: [], kept: 0, unclear: [] };
const fixesBySong = {}, keptBySong = {};
for (const [d, r] of Object.entries(report)) {
  if (r.status !== 'ok') continue;
  const entry = tp[keyByD[d]];
  const html = fs.readFileSync(path.join(PAGES, d.replace('/', '-') + '.html'), 'utf8');
  const lnLines = extractPre(html).flat();
  const ourLines = entry.stanzas.flat();
  const { ourState, ourToLn } = align(lnLines, ourLines);
  const jobs = [];
  for (let j = 0; j < ourLines.length; j++) {
    if (ourState[j] !== 'matched') continue;
    const i = ourToLn[j][0];
    const a = norm(ourLines[j]), b = norm(lnLines[i]);
    if (a === b) continue;
    const wa = a.split(' '), wb = b.split(' ');
    if (wa.length !== wb.length) continue;
    for (let t = 0; t < wa.length; t++)
      if (!eqTok(wa[t], wb[t])) jobs.push({ j, t, wa, wb });
  }
  if (!jobs.length) continue;
  const pagesInfo = agaByD[d];
  if (!pagesInfo) { jobs.forEach(x => stats.unclear.push([d, x.wa[x.t], x.wb[x.t], 'no-aga'])); continue; }
  let bands = [];
  try {
    for (const info of pagesInfo) {
      const from = Math.min(info.from, info.to), to = Math.max(info.from, info.to);
      for (let p = from; p <= to + 1; p++)
        for (const b of pageBands(info.bsb, p)) {
          const toks = b.split(/\s+/).map(w => norm(core(w)) || '·');
          if (toks.length) bands.push(toks);
        }
    }
  } catch (e) { jobs.forEach(x => stats.unclear.push([d, x.wa[x.t], x.wb[x.t], 'ocr-fail'])); continue; }
  for (const job of jobs) {
    const hypA = [...job.wa];
    const hypB = [...job.wa]; hypB[job.t] = job.wb[job.t];
    const sA = bestSim(hypA, bands), sB = bestSim(hypB, bands);
    if (sB >= 0.7 && sB - sA >= 0.05) {
      const flat = entry.stanzas.flat();
      const line = flat[job.j];
      const toks = line.split(/\s+/);
      let idx = -1;
      for (let q = 0; q < toks.length; q++) if (norm(core(toks[q])) === job.wa[job.t]) { idx = q; break; }
      if (idx < 0) { stats.unclear.push([d, job.wa[job.t], job.wb[job.t], 'tok-not-found']); continue; }
      const old = toks[idx];
      const c = core(old);
      // поверхность берём из лучшего окна hOCR? ядро может быть повреждено — берём из окна
      // гипотезы B только сам спорный токен, иначе — нормализованный токен эталона
      let repl = job.wb[job.t];
      // восстановить умлауты из нормальной формы (ae→ä и т.п.) невозможно однозначно —
      // ищем оригинал в hOCR: токен, чей norm(core) == wb[t]
      outer: for (const info of pagesInfo) {
        const from = Math.min(info.from, info.to), to = Math.max(info.from, info.to);
        for (let p = from; p <= to + 1; p++)
          for (const b of pageBands(info.bsb, p))
            for (const w of b.split(/\s+/)) { const cc = core(w); if (cc && (norm(cc) === job.wb[job.t])) { repl = cc; break outer; } }
      }
      if (/^[A-ZÄÖÜ]/.test(c)) repl = repl[0].toUpperCase() + repl.slice(1);
      else if (repl[0]) repl = repl[0].toLowerCase() + repl.slice(1);
      toks[idx] = old.replace(c, repl);
      const newLine = toks.join(' ');
      stats.fixed.push([d, old, '→', toks[idx], 'sim', sA.toFixed(2) + '→' + sB.toFixed(2)]);
      (fixesBySong[d] = fixesBySong[d] || []).push(old + '→' + toks[idx]);
      if (APPLY) {
        let fl = 0;
        for (const st of entry.stanzas) for (let li = 0; li < st.length; li++, fl++) if (fl === job.j) st[li] = newLine;
      }
    } else if (sA >= 0.7 && sA - sB >= 0.05) {
      stats.kept++;
      (keptBySong[d] = keptBySong[d] || []).push(job.wa[job.t] + '≠' + job.wb[job.t]);
    } else stats.unclear.push([d, job.wa[job.t], job.wb[job.t], sA.toFixed(2) + '/' + sB.toFixed(2)]);
  }
}
if (APPLY) {
  fs.writeFileSync(TP, JSON.stringify(tp, null, 1));
  fs.writeFileSync(path.join(__dirname, '../ln-word-fixes.json'), JSON.stringify(fixesBySong, null, 1));
  fs.writeFileSync(path.join(__dirname, '../ln-word-kept.json'), JSON.stringify(keptBySong, null, 1));
}
fs.writeFileSync(path.join(__dirname, '../ln-word-unclear.json'), JSON.stringify(stats.unclear, null, 1));
console.log('исправлено (hOCR за эталон, контекстно):', stats.fixed.length, APPLY ? '(записано)' : '(без записи)');
console.log('оставлено (hOCR за нас):', stats.kept);
console.log('неясно (очередь зрения):', stats.unclear.length);
console.log('примеры:', JSON.stringify(stats.fixed.slice(0, 15)));
