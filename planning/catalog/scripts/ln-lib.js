// Общий код сверки с эталоном Растля: извлечение <pre>, нормализация, DP-выравнивание.
const norm = l => l.toLowerCase().replace(/['’]/g, '').replace(/ß/g, 'ss').replace(/[^a-zäöü ]+/g, ' ')
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
  .replace(/ey/g, 'ei').replace(/ay/g, 'ai').replace(/th/g, 't').replace(/dt/g, 't')
  .replace(/\s+/g, ' ').trim();

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

// токены равны: точно, либо редакционная вариация в 1 символ у слов от 4 букв (Spaden/Spaten, giebt/gibt)
function eqTok(a, b) {
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.min(la, lb) < 4 || Math.abs(la - lb) > 1) return false;
  if (la === lb) { let d = 0; for (let i = 0; i < la; i++) if (a[i] !== b[i] && ++d > 1) return false; return true; }
  const [s, l] = la < lb ? [a, b] : [b, a];
  let i = 0, j = 0, d = 0;
  while (i < s.length && j < l.length) { if (s[i] === l[j]) { i++; j++; } else { if (++d > 1) return false; j++; } }
  return true;
}

function sim(a, b) {
  if (a === b) return 1;
  const wa = a.split(' '), wb = b.split(' ');
  const dp = Array.from({ length: wa.length + 1 }, () => new Array(wb.length + 1).fill(0));
  for (let i = 1; i <= wa.length; i++) for (let j = 1; j <= wb.length; j++)
    dp[i][j] = eqTok(wa[i - 1], wb[j - 1]) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return 2 * dp[wa.length][wb.length] / (wa.length + wb.length);
}

const THR = 0.72;
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
    for (let k = 1; k <= 4 && i + k <= n && j < m; k++) {
      const cat = A.slice(i, i + k).join(' ');
      const s = sim(cat, B[j]);
      if (s >= (k === 1 ? 0.58 : THR)) {
        const val = cur + k * s - (k - 1) * 0.45 + 0.01; // штраф за жадное покрытие
        if (val > dp[i + k][j + 1]) { dp[i + k][j + 1] = val; bt[i + k][j + 1] = ['cover' + k, i, j]; }
      }
    }
    for (let k2 = 2; k2 <= 3 && j + k2 <= m && i < n; k2++) {
      const cat = B.slice(j, j + k2).join(' ');
      const s = sim(A[i], cat);
      if (s >= THR) {
        const val = cur + s - (k2 - 1) * 0.2 + 0.01;
        if (val > dp[i + 1][j + k2]) { dp[i + 1][j + k2] = val; bt[i + 1][j + k2] = ['split' + k2, i, j]; }
      }
    }
  }
  const lnState = new Array(n).fill('missing');
  const ourState = new Array(m).fill('extra');
  const ourToLn = new Array(m).fill(null);
  const splitGroup = new Array(m).fill(null); // id группы наших строк, вместе покрывающих одну LN-строку
  let i = n, j = m, sg = 0;
  while (i > 0 || j > 0) {
    const step = bt[i][j];
    if (!step) break;
    const [op, pi, pj] = step;
    if (op.startsWith('cover')) {
      const k = +op.slice(5);
      for (let t = pi; t < pi + k; t++) lnState[t] = k === 1 ? 'matched' : 'mergedInOur';
      ourState[pj] = k === 1 ? 'matched' : 'coversMany';
      ourToLn[pj] = [pi, pi + k];
    } else if (op.startsWith('split')) {
      const k2 = +op.slice(5);
      lnState[pi] = 'matched'; sg++;
      for (let t = pj; t < pj + k2; t++) { ourState[t] = 'partOfSplit'; ourToLn[t] = [pi, pi + 1]; splitGroup[t] = sg; }
    }
    i = pi; j = pj;
  }
  return { lnState, ourState, ourToLn, splitGroup };
}

module.exports = { norm, extractPre, sim, align, THR, eqTok };
