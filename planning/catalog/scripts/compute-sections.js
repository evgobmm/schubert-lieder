// Assign every catalog song to a section per the approved grid (chronological, ~25-50 per section).
const fs = require('fs');
const CAT = '/workspaces/schubert-lieder/planning/catalog/catalog.json';
const catalog = require(CAT);

const MONTHS = { Januar: 1, Februar: 2, März: 3, April: 4, Mai: 5, Juni: 6, Juli: 7, August: 8, September: 9, Oktober: 10, November: 11, Dezember: 12 };
const PARENTS = new Set(['478', '688', '795', '857', '866', '877', '902', '911', '957']);
const CYCLES = { '795': 'muellerin', '911': 'winterreise', '957': 'schwanengesang' };

function parseDate(c) {
  const s = c.date_sd || '';
  // take the START of any range ("A bis B" -> A)
  const start = s.split(/\s+bis\s+/)[0];
  let m;
  if ((m = start.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/))) return { y: +m[3], mo: +m[2], d: +m[1], src: 'day' };
  if ((m = start.match(/(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})/))) return { y: +m[2], mo: MONTHS[m[1]], d: null, src: 'month' };
  if ((m = start.match(/Quartal\s+(\d),\s*(\d{4})/))) return { y: +m[2], mo: (+m[1] - 1) * 3 + 2, d: null, src: 'quarter' };
  if ((m = start.match(/(\d{4})/))) return { y: +m[1], mo: null, d: null, src: 'year' };
  // fallback to NSA year
  const yn = (c.year_nsa || '').match(/(\d{4})/);
  if (yn) return { y: +yn[1], mo: null, d: null, src: 'nsa-year' };
  return null;
}

const dnum = d => parseFloat(d.replace(/[^\d.]/g, '').replace('/', '.')) || 0;

// classify rows
const songs = [];
const excluded = [];
for (const c of catalog) {
  const dN = c.d.replace(/\s+/g, '');
  if (PARENTS.has(dN)) { c.role = 'group'; continue; }
  if (/deest/i.test(c.d)) { excluded.push({ d: c.d, title: c.title, why: 'D deest (утеряно/фрагмент/импровизация)' }); c.excluded = 'deest'; continue; }
  if (/Text nicht erhalten/i.test(c.comment || '')) { excluded.push({ d: c.d, title: c.title, why: 'текст не сохранился' }); c.excluded = 'no-text'; continue; }
  if (['204A','311','555','863','916A','990B','990D','177A','864'].includes(dN)) { excluded.push({ d: c.d, title: c.title, why: 'утрачена целиком (verschollen) либо эскиз без слов (ohne Text) — петь/записывать нечего' }); c.excluded = 'no-song'; continue; }
  const date = parseDate(c);
  if (!date) { excluded.push({ d: c.d, title: c.title, why: 'нет даты' }); c.excluded = 'no-date'; continue; }
  songs.push({ c, dN, date });
}

// sort chronologically: year, month (unknown -> 6.5 mid-year, keeps D-order plausible), day, D number
songs.sort((a, b) =>
  a.date.y - b.date.y ||
  ((a.date.mo ?? 6.5) - (b.date.mo ?? 6.5)) ||
  ((a.date.d ?? 15) - (b.date.d ?? 15)) ||
  dnum(a.dN) - dnum(b.dN));

// cycle members out of the chrono flow
const flow = [];
const cycleSongs = { muellerin: [], winterreise: [], schwanengesang: [] };
for (const s of songs) {
  const parent = s.dN.split('/')[0];
  if (CYCLES[parent] && s.dN.includes('/')) { cycleSongs[CYCLES[parent]].push(s); continue; }
  if (s.dN === '965A') { cycleSongs.schwanengesang.push(s); continue; } // Die Taubenpost -> Лебединая песня (традиция изданий; примечание на сайте)
  flow.push(s);
}

// helper: split a year's songs into K parts at month boundaries, parts as equal as possible
function splitYear(arr, K) {
  const n = arr.length, target = n / K;
  const parts = [];
  let start = 0;
  for (let k = 1; k < K; k++) {
    const ideal = Math.round(target * k);
    // find nearest index >= start+1 where month changes
    let best = ideal, bestDist = Infinity;
    for (let i = start + 1; i < n; i++) {
      const prev = arr[i - 1].date.mo ?? 13, cur = arr[i].date.mo ?? 13;
      if (cur !== prev) { const dist = Math.abs(i - ideal); if (dist < bestDist) { bestDist = dist; best = i; } }
    }
    parts.push(arr.slice(start, best)); start = best;
  }
  parts.push(arr.slice(start));
  return parts;
}

const RU_MON = ['', 'январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
function monRange(arr) {
  const mos = arr.map(s => s.date.mo).filter(Boolean);
  if (!mos.length) return '';
  const a = RU_MON[Math.min(...mos)], b = RU_MON[Math.max(...mos)]; return a === b ? a : a + '–' + b;
}

const byYear = {};
for (const s of flow) (byYear[s.date.y] = byYear[s.date.y] || []).push(s);
const Y = y => byYear[y] || [];

const sections = [];
function addSec(id, title, arr) { sections.push({ id, title, songs: arr.map(s => s.c.d), count: arr.length }); arr.forEach(s => s.c.section = id); }

addSec('1810-1814', '1810–1814', [1810, 1811, 1812, 1813, 1814].flatMap(Y));
const p1815 = splitYear(Y(1815), 4);
p1815.forEach((p, i) => addSec(`1815-${i + 1}`, `1815 · ${monRange(p)}`, p));
const p1816 = splitYear(Y(1816), 3);
p1816.forEach((p, i) => addSec(`1816-${i + 1}`, `1816 · ${monRange(p)}`, p));
const p1817 = splitYear(Y(1817), 2);
p1817.forEach((p, i) => addSec(`1817-${i + 1}`, `1817 · ${monRange(p)}`, p));
addSec('1818-1819', '1818–1819', [1818, 1819].flatMap(Y));
addSec('1820-1821', '1820–1821', [1820, 1821].flatMap(Y));
addSec('1822-1823', '1822–1823', [1822, 1823].flatMap(Y));
addSec('1824-1825', '1824–1825', [1824, 1825].flatMap(Y));
addSec('1826-1827', '1826–1827', [1826, 1827].flatMap(Y));
addSec('1828', '1828', Y(1828));
addSec('muellerin', 'Die schöne Müllerin (D 795, 1823)', cycleSongs.muellerin);
addSec('winterreise', 'Winterreise (D 911, 1827)', cycleSongs.winterreise);
addSec('schwanengesang', 'Schwanengesang (D 957 + D 965A, 1828)', cycleSongs.schwanengesang);

fs.writeFileSync('/workspaces/schubert-lieder/planning/catalog/sections.json', JSON.stringify({ generated: '2026-08-14', sections, excluded }, null, 1));
fs.writeFileSync(CAT, JSON.stringify(catalog, null, 1));

console.log('Разделы:');
for (const s of sections) console.log(`  ${s.id.padEnd(15)} ${String(s.count).padStart(3)}  ${s.title}`);
console.log('Всего в разделах:', sections.reduce((a, s) => a + s.count, 0));
console.log('Исключено:', excluded.length, JSON.stringify(excluded.map(e => e.d + ' ' + e.title + ' (' + e.why + ')')));
console.log('Группы-родители (не песни):', catalog.filter(c => c.role === 'group').length);
