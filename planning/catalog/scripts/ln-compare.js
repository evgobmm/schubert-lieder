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

const { norm, extractPre, sim, align } = require('./ln-lib');

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
