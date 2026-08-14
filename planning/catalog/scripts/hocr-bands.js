// Восстановление строк подтекстовки из hOCR по координатам (bbox):
// слова группируются в горизонтальные полосы по y-центру, внутри полосы сортируются по x.
// Экспортирует pageBands(bsb, page) → массив строк-полос (уже без муз. мусора).
const fs = require('fs');
const { execSync } = require('child_process');
const CACHE = '/tmp/claude-1000/hocr';

const NOISE = /^(cresc|decresc|dim|pp|ppp|pf|ff|fff|fp|mf|sf|fz|sfz|sempre|staccato|ligato|legato|ritard|rit|accel|Ped|a|tempo|Serie|Pianoforte|Singstimme|Breitkopf|Härtel|Leipzig|Stich|Druck|Werke|Schubert|F|S|№|N0|No|Op|D|C|G|B|A|E|H|dolce|espressivo|espress|morendo|diminuendo|crescendo)$/i;

function pageWords(bsb, page) {
  fs.mkdirSync(CACHE, { recursive: true });
  const f = `${CACHE}/${bsb}_${page}.html`;
  if (!fs.existsSync(f) || !fs.statSync(f).size) {
    execSync(`curl -s "https://api.digitale-sammlungen.de/ocr/${bsb}/${page}" -H 'User-Agent: Mozilla/5.0 schubert-lieder-project' -o ${f}`);
  }
  const h = fs.readFileSync(f, 'utf8');
  const words = [];
  for (const m of h.matchAll(/<span class="ocrx_word"[^>]*title="bbox (\d+) (\d+) (\d+) (\d+)[^"]*"[^>]*>([^<]*)<\/span>/g)) {
    const t = m[5].trim();
    if (!t) continue;
    if (/^[\d.,;:!?()*&"'«»„“\-–—=|_^°]+$/.test(t)) continue;
    if (NOISE.test(t)) continue;
    words.push({ x0: +m[1], y0: +m[2], x1: +m[3], y1: +m[4], t });
  }
  return words;
}

// полосы: слова с пересечением по вертикали ≥50% высоты меньшего попадают в одну полосу
function bands(words) {
  const sorted = [...words].sort((a, b) => (a.y0 + a.y1) - (b.y0 + b.y1));
  const out = [];
  for (const w of sorted) {
    const yc = (w.y0 + w.y1) / 2;
    let band = out.find(b => yc >= b.y0 - 15 && yc <= b.y1 + 15 &&
      Math.min(w.y1, b.y1) - Math.max(w.y0, b.y0) > 0.4 * Math.min(w.y1 - w.y0, b.y1 - b.y0));
    if (!band) { band = { y0: w.y0, y1: w.y1, words: [] }; out.push(band); }
    band.y0 = Math.min(band.y0, w.y0); band.y1 = Math.max(band.y1, w.y1);
    band.words.push(w);
  }
  return out
    .sort((a, b) => a.y0 - b.y0)
    .map(b => b.words.sort((x, y) => x.x0 - y.x0).map(w => w.t).join(' '))
    .filter(s => s.trim().length > 1);
}

function pageBands(bsb, page) { return bands(pageWords(bsb, page)); }
module.exports = { pageBands };

if (require.main === module) {
  const [bsb, from, to] = process.argv.slice(2);
  for (let p = +from; p <= +(to || from); p++) {
    console.log(`--- стр. ${p}`);
    console.log(pageBands(bsb, p).join('\n'));
  }
}
