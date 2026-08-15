// Сверка строфики наших текстов с эталоном Растля (LiederNet, страницы sung text).
// Выравнивание допускает: наша строка = 1..4 строки эталона подряд (слитая разбивка),
// 2..3 наши строки = 1 строка эталона (лишний разрыв), пропуски (наши повторы / дыры).
// Запуск: node ln-compare.js <pagesDir>
const fs = require('fs');
const path = require('path');
const PAGES = process.argv[2];
const tp = require('../sources/texts-published.json');
const { map } = require('../sources/liedernet-map.json');

const ours = {}; // d -> stanzas
for (const k of Object.keys(tp)) ours[tp[k].d] = tp[k].stanzas;

function extractPre(html) {
  const m = html.match(/<div id="the-tr"[^>]*><pre>([\s\S]*?)<\/pre>/);
  if (!m) return null;
  const t = m[1]
    .replace(/<sup[\s\S]*?<\/sup>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/\r/g, '');
  return t.split(/\n\s*\n+/).map(st => st.split('\n').map(l => l.trim()).filter(Boolean)).filter(st => st.length);
}

// свёртка старой орфографии (обе стороны одинаково): Sey→sei, May→mai, Blüthe→blüte, Todt→tot
const norm = l => l.toLowerCase().replace(/ß/g, 'ss').replace(/[^a-zäöü ]+/g, ' ')
  .replace(/ey/g, 'ei').replace(/ay/g, 'ai').replace(/th/g, 't').replace(/dt/g, 't')
  .replace(/\s+/g, ' ').trim();
function sim(a, b) {
  if (a === b) return 1;
  const wa = a.split(' '), wb = b.split(' ');
  const dp = Array.from({ length: wa.length + 1 }, () => new Array(wb.length + 1).fill(0));
  for (let i = 1; i <= wa.length; i++) for (let j = 1; j <= wb.length; j++)
    dp[i][j] = wa[i - 1] === wb[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return 2 * dp[wa.length][wb.length] / (wa.length + wb.length);
}

const THR = 0.72;
// DP: LN[0..i) vs our[0..j); наша строка может покрыть 1..4 строки LN, 2..3 наши — 1 строку LN
function align(lnLines, ourLines) {
  const A = lnLines.map(norm), B = ourLines.map(norm);
  const n = A.length, m = B.length;
  const NEG = -1e9;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(NEG));
  const bt = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(null));
  dp[0][0] = 0;
  for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) {
    const cur = dp[i][j];
    if (cur === NEG) continue;
    if (j < m && cur > dp[i][j + 1]) { dp[i][j + 1] = cur; bt[i][j + 1] = ['skipOur', i, j]; }
    if (i < n && cur > dp[i + 1][j]) { dp[i + 1][j] = cur; bt[i + 1][j] = ['skipLn', i, j]; }
    // наша j покрывает LN i..i+k-1
    for (let k = 1; k <= 4 && i + k <= n && j < m; k++) {
      const cat = A.slice(i, i + k).join(' ');
      const s = sim(cat, B[j]);
      if (s >= THR) {
        const val = cur + k * s + 0.01; // бонус за покрытие
        if (val > dp[i + k][j + 1]) { dp[i + k][j + 1] = val; bt[i + k][j + 1] = ['cover' + k, i, j]; }
      }
    }
    // наши j..j+k2-1 покрывают LN i (мы разбили строку эталона)
    for (let k2 = 2; k2 <= 3 && j + k2 <= m && i < n; k2++) {
      const cat = B.slice(j, j + k2).join(' ');
      const s = sim(A[i], cat);
      if (s >= THR) {
        const val = cur + s + 0.01;
        if (val > dp[i + 1][j + k2]) { dp[i + 1][j + k2] = val; bt[i + 1][j + k2] = ['split' + k2, i, j]; }
      }
    }
  }
  // восстановление: для каждой LN-строки — как покрыта; для каждой нашей — статус
  const lnState = new Array(n).fill('missing'); // matched | mergedInOur | missing
  const ourState = new Array(m).fill('extra');  // matched | coversMany | partOfSplit | extra
  const ourToLn = new Array(m).fill(null);      // j -> [iStart,iEnd)
  let i = n, j = m;
  while (i > 0 || j > 0) {
    const step = bt[i][j];
    if (!step) break;
    const [op, pi, pj] = step;
    if (op === 'skipOur') { /* extra */ }
    else if (op === 'skipLn') { /* missing */ }
    else if (op.startsWith('cover')) {
      const k = +op.slice(5);
      for (let t = pi; t < pi + k; t++) lnState[t] = k === 1 ? 'matched' : 'mergedInOur';
      ourState[pj] = k === 1 ? 'matched' : 'coversMany';
      ourToLn[pj] = [pi, pi + k];
    } else if (op.startsWith('split')) {
      const k2 = +op.slice(5);
      lnState[pi] = 'matched';
      for (let t = pj; t < pj + k2; t++) { ourState[t] = 'partOfSplit'; ourToLn[t] = [pi, pi + 1]; }
    }
    i = pi; j = pj;
  }
  return { lnState, ourState, ourToLn };
}

const report = {};
const dList = Object.keys(ours).filter(d => !d.startsWith('911/') && d !== '118');
for (const d of dList) {
  const cand = map[d];
  if (!cand || cand[0].special) { report[d] = { status: 'no-reference' }; continue; }
  const file = path.join(PAGES, d.replace('/', '-') + '.html');
  if (!fs.existsSync(file)) { report[d] = { status: 'no-page' }; continue; }
  const html = fs.readFileSync(file, 'utf8');
  const ln = extractPre(html);
  if (!ln) { report[d] = { status: 'no-pre' }; continue; }
  const sungText = html.includes('(Sung text');
  const our = ours[d];
  const lnLines = ln.flat(), ourLines = our.flat();
  const { lnState, ourState, ourToLn } = align(lnLines, ourLines);
  const cnt = (arr, v) => arr.filter(x => x === v).length;
  const missingIdx = lnState.map((s, ix) => s === 'missing' ? ix : -1).filter(x => x >= 0);
  // строфные границы: LN-граница воспроизводится у нас?
  const lnShape = ln.map(s => s.length), ourShape = our.map(s => s.length);
  const ourBounds = new Set(); let acc = 0;
  for (const s of our) { acc += s.length; ourBounds.add(acc); }
  // позиция каждой LN-строки у нас: первая наша строка, покрывающая её
  const lnToOur = new Array(lnLines.length).fill(-1);
  ourToLn.forEach((rng, jj) => { if (rng) for (let t = rng[0]; t < rng[1]; t++) if (lnToOur[t] < 0) lnToOur[t] = jj; });
  let bAcc = 0; const boundMiss = [];
  for (let si = 0; si < ln.length - 1; si++) {
    bAcc += ln[si].length;
    const a = lnToOur[bAcc - 1], b = lnToOur[bAcc];
    if (a < 0 || b < 0) continue;
    if (a === b) { boundMiss.push(si + 1); continue; } // граница внутри нашей склеенной строки
    let ok = false;
    for (let p = a + 1; p <= b; p++) if (ourBounds.has(p)) { ok = true; break; }
    if (!ok) boundMiss.push(si + 1);
  }
  const shapeSame = JSON.stringify(lnShape) === JSON.stringify(ourShape);
  // пропуски = целые строфы эталона? (строфические куплеты, потерянные транскрипцией)
  const missSet = new Set(missingIdx);
  let stAcc = 0, wholeMissing = 0, partialMissing = 0;
  for (const st of ln) {
    const idxs = st.map((_, t) => stAcc + t); stAcc += st.length;
    const missN = idxs.filter(t => missSet.has(t)).length;
    if (missN === st.length) wholeMissing++;
    else if (missN > 0) partialMissing++;
  }
  report[d] = {
    status: 'ok', sungText, shapeSame, wholeMissing, partialMissing, lnShape, ourShape,
    lnLines: lnLines.length, ourLinesN: ourLines.length,
    merged: cnt(lnState, 'mergedInOur'),
    splitOur: cnt(ourState, 'partOfSplit'),
    missing: missingIdx.length, missingIdx: missingIdx.slice(0, 10),
    extraOur: cnt(ourState, 'extra'),
    boundMiss,
    coverage: +((lnLines.length - missingIdx.length) / lnLines.length).toFixed(3),
  };
}
fs.writeFileSync(path.join(__dirname, '../ln-structure-report.json'), JSON.stringify(report, null, 1));

const vals = Object.entries(report);
const byStatus = {};
for (const [, r] of vals) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
console.log('статусы:', JSON.stringify(byStatus));
const ok = vals.filter(([, r]) => r.status === 'ok');
const clean = ok.filter(([, r]) => r.shapeSame && r.missing === 0 && r.merged === 0 && r.splitOur === 0);
console.log('A) полностью чисто (форма и все строки):', clean.length, 'из', ok.length);
const lineation = ok.filter(([, r]) => r.missing === 0 && (r.merged > 0 || r.splitOur > 0 || (!r.shapeSame)));
console.log('B) только разбивка строк/строф (все строки на месте):', lineation.length);
const gaps = ok.filter(([, r]) => r.missing > 0 && r.coverage >= 0.5);
console.log('C) есть настоящие пропуски строк:', gaps.length);
const badcov = ok.filter(([, r]) => r.coverage < 0.5);
console.log('D) покрытие <50% (не тот текст / версия?):', badcov.length, badcov.map(([d, r]) => d + '(' + r.coverage + ')').slice(0, 40).join(' '));
