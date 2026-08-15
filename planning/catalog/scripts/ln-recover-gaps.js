// Восстановление пропущенных строк (куплеты строфических песен и т.п.) из hOCR AGA.
// Текст берётся ТОЛЬКО из AGA (hOCR); эталон Растля служит проверкой (sim ≥ 0.72) и
// указателем позиции вставки. Лог восстановления — ln-recovered.json (прослеживаемость).
// Запуск: node ln-recover-gaps.js <pagesDir> [--apply]
const fs = require('fs');
const path = require('path');
const { norm, extractPre, sim, align } = require('./ln-lib');
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

// лучшие кандидаты для LN-строки среди полос: скользящее окно по токенам полосы
function bestWindow(lnLine, bandsTok) {
  const target = norm(lnLine).split(' ').filter(Boolean);
  if (!target.length) return null;
  let best = null;
  for (const b of bandsTok) {
    const toks = b.toksN, orig = b.toksO;
    for (const w of [target.length - 1, target.length, target.length + 1]) {
      if (w < 1 || w > toks.length) continue;
      for (let s = 0; s + w <= toks.length; s++) {
        const cand = toks.slice(s, s + w).join(' ');
        const sc = sim(cand, target.join(' '));
        if (!best || sc > best.sc) best = { sc, text: orig.slice(s, s + w).join(' ') };
      }
    }
  }
  return best;
}

const log = {};
let songsFixed = 0, linesAdded = 0, songsNoAga = [], songsPartial = [];
for (const [d, r] of Object.entries(report)) {
  if (r.status !== 'ok' || r.missing === 0) continue;
  const pagesInfo = agaByD[d];
  if (!pagesInfo) { songsNoAga.push(d); continue; }
  const entry = tp[keyByD[d]];
  const html = fs.readFileSync(path.join(PAGES, d.replace('/', '-') + '.html'), 'utf8');
  const ln = extractPre(html);
  const lnLines = ln.flat();
  const lnStanzaOf = []; ln.forEach((st, si) => st.forEach(() => lnStanzaOf.push(si)));
  const ourLines = entry.stanzas.flat();
  const { lnState, ourToLn } = align(lnLines, ourLines);
  // hOCR-полосы всех страниц песни
  let bandsTok = [];
  try {
    for (const info of pagesInfo) {
      const from = Math.min(info.from, info.to), to = Math.max(info.from, info.to);
      for (let p = from; p <= to + 1; p++) {
        for (const b of pageBands(info.bsb, p)) {
          const toksO = b.split(/\s+/).filter(Boolean);
          bandsTok.push({ toksO, toksN: toksO.map(t => norm(t) || '·') });
        }
      }
    }
  } catch (e) { songsNoAga.push(d + ':ocr-fail'); continue; }
  // восстановить каждую пропущенную LN-строку
  const rec = {}; // lnIdx -> text
  const weak = [];
  lnLines.forEach((l, i) => {
    if (lnState[i] !== 'missing') return;
    const best = bestWindow(l, bandsTok);
    if (best && best.sc >= 0.72) { rec[i] = best.text; if (best.sc < 0.9) weak.push(i); }
  });
  const got = Object.keys(rec).length;
  if (!got) { songsPartial.push([d, '0/' + r.missing]); continue; }
  // вставка: идём по нашим строкам; перед строкой с LN-диапазоном [a,b) вставляем
  // восстановленные с индексом < a, ещё не вставленные; хвост — новыми строфами по LN
  const pending = Object.keys(rec).map(Number).sort((x, y) => x - y);
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
  // хвост: группировать по строфам эталона
  let tail = [], tailSt = -1;
  while (pi < pending.length) {
    const i = pending[pi];
    const si = lnStanzaOf[i];
    if (si !== tailSt && tail.length) { newStanzas.push(tail); tail = []; }
    tailSt = si;
    tail.push(cap(rec[i]));
    pi++;
  }
  if (tail.length) newStanzas.push(tail);
  log[d] = { added: got, of: r.missing, weak, pages: pagesInfo.map(x => x.bsb + ':' + x.from + '-' + x.to) };
  songsFixed++; linesAdded += got;
  if (got < r.missing) songsPartial.push([d, got + '/' + r.missing]);
  if (APPLY) {
    entry.stanzas = newStanzas;
    entry.recovered = (entry.recovered || 0) + got;
    entry.source_detail = ((entry.source_detail || '') + '; куплеты восстановлены по AGA hOCR, сверены с эталоном Растля').trim();
  }
}
function cap(l) { const m = l.match(/^([^a-zA-ZäöüßÄÖÜ]*)([a-zäöüß])(.*)$/s); return m ? m[1] + m[2].toUpperCase() + m[3] : l; }
if (APPLY) {
  fs.writeFileSync(TP, JSON.stringify(tp, null, 1));
  fs.writeFileSync(path.join(__dirname, '../ln-recovered.json'), JSON.stringify(log, null, 1));
}
console.log('песен пополнено:', songsFixed, '| строк добавлено:', linesAdded, APPLY ? '(записано)' : '(без записи)');
console.log('без AGA-карты/OCR:', songsNoAga.length, songsNoAga.slice(0, 15).join(' '));
console.log('восстановлено не всё:', songsPartial.length, JSON.stringify(songsPartial.slice(0, 20)));
