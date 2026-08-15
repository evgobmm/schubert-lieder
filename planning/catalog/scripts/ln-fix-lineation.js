// Механическая починка разбивки строк/строф по эталону Растля для песен класса B
// (все строки эталона на месте, отличается только членение). Слова НЕ меняются:
// предохранитель — мультимножество токенов до и после идентично, иначе песня в пропуск.
// Запуск: node ln-fix-lineation.js <pagesDir> [--apply]
const fs = require('fs');
const path = require('path');
const { norm, extractPre, sim, align, eqTok } = require('./ln-lib');
const PAGES = process.argv[2];
const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force');
const TP = path.join(__dirname, '../sources/texts-published.json');
const tp = JSON.parse(fs.readFileSync(TP, 'utf8'));
const { map } = require('../sources/liedernet-map.json');
const report = require('../ln-structure-report.json');

const keyByD = {};
for (const k of Object.keys(tp)) keyByD[tp[k].d] = k;

// разбить токены нашей строки на k сегментов по границам LN-строк (LCS-присвоение токенов)
function splitTokens(ourTokens, lnLineNorms) {
  const flat = [];
  lnLineNorms.forEach((l, li) => l.split(' ').forEach(w => flat.push({ w, li })));
  const A = ourTokens.map(t => norm(t)).map(s => s || '·');
  const n = A.length, m = flat.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
    dp[i][j] = eqTok(A[i - 1], flat[j - 1].w) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const owner = new Array(n).fill(-1);
  let i = n, j = m;
  while (i > 0 && j > 0) {
    if (eqTok(A[i - 1], flat[j - 1].w) && dp[i][j] === dp[i - 1][j - 1] + 1) { owner[i - 1] = flat[j - 1].li; i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--;
  }
  // несопоставленные токены наследуют владельца соседа слева (или справа в начале)
  for (let t = 0; t < n; t++) if (owner[t] < 0) owner[t] = t > 0 ? owner[t - 1] : 0;
  for (let t = 0; t < n; t++) if (owner[t] < 0) owner[t] = 0;
  // монотонность
  for (let t = 1; t < n; t++) if (owner[t] < owner[t - 1]) owner[t] = owner[t - 1];
  const K = lnLineNorms.length;
  const segs = Array.from({ length: K }, () => []);
  ourTokens.forEach((tok, t) => segs[Math.min(owner[t], K - 1)].push(tok));
  if (segs.some(s => !s.length)) return null;
  return segs.map(s => s.join(' '));
}

const stats = { fixed: [], skipped: [], untouched: 0 };
for (const d of Object.keys(keyByD)) {
  const r = report[d];
  if (!r || r.status !== 'ok' || r.missing > 0) continue;
  if (r.shapeSame && r.merged === 0 && r.splitOur === 0) { stats.untouched++; continue; }
  const entry = tp[keyByD[d]];
  const html = fs.readFileSync(path.join(PAGES, d.replace('/', '-') + '.html'), 'utf8');
  const ln = extractPre(html);
  const lnLines = ln.flat();
  const lnStanzaOf = []; ln.forEach((st, si) => st.forEach(() => lnStanzaOf.push(si)));
  const ourLines = entry.stanzas.flat();
  const ourStanzaStart = []; // строка начинала строфу в нашей версии?
  entry.stanzas.forEach(st => st.forEach((_, t) => ourStanzaStart.push(t === 0)));
  const { ourState, ourToLn, splitGroup } = align(lnLines, ourLines);
  // построить новые строки с приписанной LN-строкой
  const out = []; // {text, lnIdx|null, origStart}
  let bad = null, forced = false;
  for (let j = 0; j < ourLines.length && !bad; j++) {
    const st = ourState[j];
    if (st === 'extra') { out.push({ text: ourLines[j], lnIdx: null, origStart: ourStanzaStart[j] }); continue; }
    if (st === 'partOfSplit') {
      const g = splitGroup[j];
      const grp = [ourLines[j]];
      while (j + 1 < ourLines.length && splitGroup[j + 1] === g) { j++; grp.push(ourLines[j]); }
      out.push({ text: grp.join(' '), lnIdx: ourToLn[j][0] });
      continue;
    }
    const [i0, i1] = ourToLn[j];
    if (i1 - i0 === 1) { out.push({ text: ourLines[j], lnIdx: i0 }); continue; }
    const lnNorms = lnLines.slice(i0, i1).map(norm);
    let segs = splitTokens(ourLines[j].split(/\s+/), lnNorms);
    let okSegs = !!segs;
    if (okSegs) for (let t = 0; t < segs.length; t++) if (sim(norm(segs[t]), lnNorms[t]) < 0.6) okSegs = false;
    if (!okSegs) {
      if (!FORCE) { bad = segs ? 'seg-sim@' + j : 'split-fail@' + j; break; }
      // аварийный разрез: пропорционально числу слов эталонных строк
      const toks = ourLines[j].split(/\s+/);
      const counts = lnNorms.map(l => l.split(' ').length);
      const total = counts.reduce((a, b) => a + b, 0);
      segs = []; let pos = 0;
      for (let t = 0; t < counts.length; t++) {
        const take = t === counts.length - 1 ? toks.length - pos : Math.max(1, Math.round(toks.length * counts[t] / total));
        segs.push(toks.slice(pos, Math.min(pos + take, toks.length)).join(' '));
        pos += take;
      }
      if (segs.some(s => !s)) { bad = 'force-fail@' + j; break; }
      forced = true;
    }
    for (let t = 0; t < segs.length; t++) out.push({ text: segs[t], lnIdx: i0 + t });
  }
  if (bad) { stats.skipped.push([d, bad]); continue; }
  // сгруппировать в строфы: сопоставленные строки — по границам эталона;
  // повторы (extra) сохраняют собственные строфные границы нашей версии
  const stanzas = [];
  let cur = [], curSt = -1;
  for (const o of out) {
    if (o.lnIdx === null) {
      if (o.origStart && cur.length) { stanzas.push(cur); cur = []; }
      cur.push(o.text);
      continue;
    }
    const si = lnStanzaOf[o.lnIdx];
    if (si !== curSt && cur.length) { stanzas.push(cur); cur = []; }
    curSt = si;
    cur.push(o.text);
  }
  if (cur.length) stanzas.push(cur);
  // предохранитель: мультимножество токенов неизменно
  const bag = ls => ls.join(' ').split(/\s+/).filter(Boolean).sort().join('|');
  if (bag(ourLines) !== bag(stanzas.flat())) { stats.skipped.push([d, 'token-guard']); continue; }
  const newShape = stanzas.map(s => s.length);
  stats.fixed.push([d, JSON.stringify(r.ourShape) + '→' + JSON.stringify(newShape) + (forced ? ' FORCED' : '')]);
  if (APPLY) {
    entry.stanzas = stanzas;
    entry.lineation = forced ? 'ln-reference-forced' : 'ln-reference';
  }
}
if (APPLY) fs.writeFileSync(TP, JSON.stringify(tp, null, 1));
console.log('нетронуто (уже чисто):', stats.untouched);
console.log('исправлено:', stats.fixed.length, APPLY ? '(записано)' : '(прогон без записи)');
console.log('пропущено (нужен ручной разбор):', stats.skipped.length, JSON.stringify(stats.skipped.slice(0, 25)));
