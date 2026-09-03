#!/usr/bin/env node
// Постановка опубликованной песни в рабочий каталог для догона (0 токенов):
//   node planning/scripts/stage-published.js <workDir> <d> [<d> ...]
// Копирует app/src/data/songs/<file> → <workDir>/work/candidate-<slug>.json и снимает следы прошлых
// прогонов (pre-edits, stamp, edits), чтобы apply-edits.js взял свежий снимок именно этой версии.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const [workDir, ...ds] = process.argv.slice(2);
if (!workDir || !ds.length) { console.error('usage: stage-published.js <workDir> <d>...'); process.exit(2); }
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/index.json'), 'utf8'));
const wd = path.join(workDir, 'work'); fs.mkdirSync(wd, { recursive: true });
let n = 0;
for (const d of ds) {
  const e = index.find((x) => String(x.d) === String(d));
  if (!e || !e.file) { console.log(`D ${d}: нет в индексе`); continue; }
  const slug = e.file.replace('.json', '');
  fs.copyFileSync(path.join(ROOT, 'app/src/data/songs', e.file), path.join(wd, `candidate-${slug}.json`));
  for (const f of [`candidate-${slug}.pre-edits.json`, `candidate-${slug}.pre-edits.stamp`, `edits-${slug}.json`, `removed-${slug}.json`, `flags-${slug}.json`]) {
    const p = path.join(wd, f); if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  n++;
}
console.log(`поставлено песен: ${n} → ${wd}`);
