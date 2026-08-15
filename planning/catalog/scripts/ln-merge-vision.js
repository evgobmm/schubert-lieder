// Слияние результатов зрительной партии: спорные слова и восстановленные куплеты.
// Куплетные строки принимаются, только если совпадают с пропавшей строкой эталона
// (sim>=0.6) или подтверждаются hOCR-окном (sim>=0.55); дубликаты существующих строк
// отбрасываются. Полный режим (mode:full) заменяет текст целиком при покрытии >=0.8.
// Запуск: node ln-merge-vision.js <visDir> <pagesDir> [--apply]
const fs = require('fs');
const path = require('path');
const { norm, extractPre, sim, align } = require('./ln-lib');
const { pageBands } = require('./hocr-bands');
const VIS = process.argv[2], PAGES = process.argv[3];
const APPLY = process.argv.includes('--apply');
const TP = path.join(__dirname, '../sources/texts-published.json');
const tp = JSON.parse(fs.readFileSync(TP, 'utf8'));
const queue = require('../batches/ln-vision-queue.json');
const byD = {}; for (const it of queue) byD[it.d] = it;
const keyByD = {}; for (const k of Object.keys(tp)) keyByD[tp[k].d] = k;
const core = t => t.replace(/^[^A-Za-zÄÖÜäöüß]+|[^A-Za-zÄÖÜäöüß]+$/g, '');
const cap = l => { const m = l.match(/^([^a-zA-ZäöüßÄÖÜ]*)([a-zäöüß])(.*)$/s); return m ? m[1] + m[2].toUpperCase() + m[3] : l; };

const log = {};
let wordFixes = 0, linesAdded = 0, fullReplaced = 0, skippedFiles = [];
for (const f of fs.readdirSync(VIS).filter(x => x.endsWith('.json'))) {
  let res;
  try { res = JSON.parse(fs.readFileSync(path.join(VIS, f), 'utf8')); } catch (e) { skippedFiles.push(f + ':parse'); continue; }
  const d = res.d;
  const item = byD[d];
  if (!item) { skippedFiles.push(f + ':no-queue'); continue; }
  const entry = tp[keyByD[d]];
  const L = { words: [], added: 0, note: res.notes || '' };
  // --- спорные слова
  for (const disp of res.disputes || []) {
    if (!disp || !disp.print) continue;
    const qd = (item.disputes || []).find(x => norm(x.ours) === norm(disp.ours || ''));
    if (!qd || !qd.line) continue;
    const printClean = String(disp.print).replace(/([A-Za-zÄÖÜäöüß])-([A-Za-zÄÖÜäöüß])/g, '$1$2').trim(); // слоговые дефисы
    if (/\s/.test(printClean)) { (log[d] = log[d] || { words: [], added: 0, note: '' }).note += ' | многословный print: ' + qd.ours + '→' + printClean; continue; }
    const printN = norm(core(printClean));
    if (!printN || printN === norm(qd.ours)) continue; // печать за нас — менять нечего
    // найти строку и заменить ядро токена
    let fl = -1, done = false;
    for (const st of entry.stanzas) for (let li = 0; li < st.length && !done; li++) {
      fl++;
      if (norm(st[li]) !== norm(qd.line)) continue;
      const toks = st[li].split(/\s+/);
      for (let q = 0; q < toks.length; q++) {
        if (norm(core(toks[q])) === norm(qd.ours)) {
          const old = toks[q], c = core(old);
          let repl = core(printClean);
          if (/^[A-ZÄÖÜ]/.test(c)) repl = repl[0].toUpperCase() + repl.slice(1); else repl = repl[0].toLowerCase() + repl.slice(1);
          toks[q] = old.replace(c, repl);
          if (APPLY) st[li] = toks.join(' ');
          L.words.push(old + '→' + toks[q]); wordFixes++; done = true;
          break;
        }
      }
    }
  }
  // --- куплеты
  const verses = (res.verses || []).filter(v => Array.isArray(v) && v.length);
  if (verses.length && item.mode !== 'full') {
    const html = fs.readFileSync(path.join(PAGES, d.replace('/', '-') + '.html'), 'utf8');
    const ln = extractPre(html);
    const lnLines = ln.flat();
    const lnStanzaOf = []; ln.forEach((st, si) => st.forEach(() => lnStanzaOf.push(si)));
    const ourLines = entry.stanzas.flat();
    const { lnState, ourToLn } = align(lnLines, ourLines);
    const ourN = ourLines.map(norm);
    // hOCR-полосы для подтверждения строк, которых нет в эталоне
    let bands = [];
    try {
      for (const pg of item.pages) for (let p = pg.from; p <= pg.to + 1; p++)
        for (const b of pageBands(pg.bsb, p)) { const o = b.split(/\s+/).filter(Boolean); bands.push(o.map(t => norm(t) || '·')); }
    } catch (e) { /* без hOCR — только через эталон */ }
    const hocrOk = (lineN) => {
      const tg = lineN.split(' ').filter(Boolean);
      for (const b of bands) for (const w of [tg.length - 1, tg.length, tg.length + 1]) {
        if (w < 1 || w > b.length) continue;
        for (let s = 0; s + w <= b.length; s++) if (sim(b.slice(s, s + w).join(' '), tg.join(' ')) >= 0.55) return true;
      }
      return false;
    };
    const rec = {}; // lnIdx -> text
    const extraTail = [];
    for (const v of verses) for (const line of v) {
      const lineN = norm(line);
      if (!lineN) continue;
      if (ourN.some(o => sim(o, lineN) >= 0.85)) continue; // уже есть (первый куплет)
      let bestI = -1, bestS = 0;
      lnLines.forEach((l, i) => { if (lnState[i] !== 'missing' || rec[i]) return; const s = sim(norm(l), lineN); if (s > bestS) { bestS = s; bestI = i; } });
      if (bestI >= 0 && bestS >= 0.6) rec[bestI] = line;
      else if (hocrOk(lineN)) extraTail.push(line); // напечатано в AGA, но в эталоне нет (доп. куплет?)
    }
    const got = Object.keys(rec).length;
    if (got || extraTail.length) {
      const pending = Object.keys(rec).map(Number).sort((a, b) => a - b);
      const newStanzas = [];
      let pi = 0, flatIdx = 0;
      for (const st of entry.stanzas) {
        const curLines = [];
        for (const line of st) {
          const rng = ourToLn[flatIdx];
          if (rng) while (pi < pending.length && pending[pi] < rng[0]) { curLines.push(cap(rec[pending[pi]])); pi++; }
          curLines.push(line);
          flatIdx++;
        }
        if (curLines.length) newStanzas.push(curLines);
      }
      let tail = [], tailSt = -1;
      while (pi < pending.length) {
        const i = pending[pi], si = lnStanzaOf[i];
        if (si !== tailSt && tail.length) { newStanzas.push(tail); tail = []; }
        tailSt = si; tail.push(cap(rec[i])); pi++;
      }
      if (tail.length) newStanzas.push(tail);
      // строки, подтверждённые только hOCR, группируем строфами по куплетам источника
      for (const v of verses) {
        const lines = v.filter(l => extraTail.includes(l)).map(cap);
        if (lines.length >= 2) newStanzas.push(lines);
      }
      if (APPLY) {
        entry.stanzas = newStanzas;
        entry.source_detail = ((entry.source_detail || '') + '; куплеты дочитаны зрением по AGA (MDZ), сверены с эталоном Растля').trim();
      }
      L.added = got + extraTail.length; linesAdded += L.added;
    }
  }
  if (item.mode === 'full' && verses.length) {
    const html = fs.readFileSync(path.join(PAGES, d.replace('/', '-') + '.html'), 'utf8');
    const lnLines = extractPre(html).flat();
    const flat = verses.flat();
    const cov = lnLines.filter(l => flat.some(x => sim(norm(l), norm(x)) >= 0.6)).length / lnLines.length;
    if (cov >= 0.8) {
      if (APPLY) {
        entry.stanzas = verses.map(v => v.map(cap));
        entry.source_detail = ((entry.source_detail || '') + '; перечитано зрением по AGA (MDZ), сверено с эталоном').trim();
      }
      fullReplaced++; L.added = 'FULL(cov=' + cov.toFixed(2) + ')';
    } else L.note += ' | full отклонён: cov=' + cov.toFixed(2);
  }
  if (L.words.length || L.added) log[d] = L;
}
if (APPLY) {
  fs.writeFileSync(TP, JSON.stringify(tp, null, 1));
  fs.writeFileSync(path.join(__dirname, '../ln-vision-merged.json'), JSON.stringify(log, null, 1));
}
console.log('файлов-результатов:', fs.readdirSync(VIS).filter(x => x.endsWith('.json')).length, '| слов исправлено:', wordFixes, '| строк добавлено:', linesAdded, '| полных замен:', fullReplaced, APPLY ? '(записано)' : '(без записи)');
console.log('пропущено файлов:', skippedFiles.length, skippedFiles.slice(0, 8).join(' '));
