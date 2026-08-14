// Полномасштабные партии транскрипции: все песни без текста, сматченные в карте AGA.
// Использование: node gen-batches.js  → пишет batch-NN.json (по BATCH_SIZE песен) и печатает сводку.
const fs = require('fs');
const S = __dirname;
const BATCH_SIZE = 40;
const map = require('/workspaces/schubert-lieder/planning/catalog/sources/aga-map-final.json');
const cat = require('/workspaces/schubert-lieder/planning/catalog/catalog.json');
const pub = require('/workspaces/schubert-lieder/planning/catalog/sources/texts-published.json');
const have = new Set(pub.map(p => p.d));
const byD = {}; cat.forEach(r => { byD[r.d] = r; });

// однозначные записи; для D с несколькими печатями (Fassungen) берём ПОСЛЕДНЮЮ в томе
// (обычно опусная/окончательная редакция) и помечаем note
const byDMap = {};
for (const m of map) {
  if (!m.d) continue;
  byDMap[m.d] = byDMap[m.d] ? { ...m, multi: true } : m;
}

const todo = [];
for (const [d, m] of Object.entries(byDMap)) {
  const c = byD[d];
  if (!c || c.excluded || have.has(d)) continue;
  todo.push({
    d, title: c.title, poet: c.poet_full || '',
    bsb: m.bsb, from: m.from, to: Math.max(m.to, m.from),
    multi: !!m.multi,
  });
}
todo.sort((a, b) => a.d.localeCompare(b.d, undefined, { numeric: true }));
const pages = todo.reduce((s, t) => s + (t.to - t.from + 1), 0);
console.log('песен к транскрипции:', todo.length, '| страниц сканов:', pages, '| с неск. редакциями:', todo.filter(t => t.multi).length);

let n = 0;
for (let i = 0; i < todo.length; i += BATCH_SIZE) {
  n++;
  fs.writeFileSync(S + `/batch-${String(n).padStart(2, '0')}.json`, JSON.stringify(todo.slice(i, i + BATCH_SIZE), null, 1));
}
console.log('партий записано:', n, '(по', BATCH_SIZE, 'песен)');
