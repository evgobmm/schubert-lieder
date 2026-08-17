#!/usr/bin/env node
// Сборка файла-кандидата песни из частей (0 токенов):
//   node planning/scripts/assemble-song.js <d> <stanzas.json> <about.json> <meta.json> <out.json>
// stanzas.json — [{lines_de:[...], lines_ru:[{segments,annotations?},...]}, ...]
// about.json   — [{title, text}, ...]  (может быть пустым массивом на промежуточном шаге)
// meta.json    — {title_ru, poet_ru, title_annotations?}
// Немецкий текст сверяется ПОСТРОЧНО с опубликованным файлом песни — любое расхождение = ошибка.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

const [d, stanzasF, aboutF, metaF, outF] = process.argv.slice(2);
if (!outF) { console.error('usage: assemble-song.js <d> <stanzas.json> <about.json> <meta.json> <out.json>'); process.exit(2); }

const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/index.json'), 'utf8'));
const entry = index.find((e) => String(e.d) === String(d));
if (!entry || !entry.file) { console.error('нет песни в index: ' + d); process.exit(1); }
const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/songs', entry.file), 'utf8'));
const stanzas = JSON.parse(fs.readFileSync(stanzasF, 'utf8'));
const about = JSON.parse(fs.readFileSync(aboutF, 'utf8'));
const meta = JSON.parse(fs.readFileSync(metaF, 'utf8'));

// сверка немецкого текста
const baseLines = (base.stanzas || []).map((s) => s.lines_de);
const newLines = stanzas.map((s) => s.lines_de);
if (JSON.stringify(baseLines) !== JSON.stringify(newLines)) {
  console.error('НЕМЕЦКИЙ ТЕКСТ ИЗМЕНЁН — сборка запрещена. Диф:');
  for (let i = 0; i < Math.max(baseLines.length, newLines.length); i++) {
    const a = JSON.stringify(baseLines[i] || null), b = JSON.stringify(newLines[i] || null);
    if (a !== b) console.error(` строфа ${i}:\n  БЫЛО ${a}\n  СТАЛО ${b}`);
  }
  process.exit(1);
}
if (!meta.title_ru || !meta.poet_ru) { console.error('meta: нужны title_ru и poet_ru'); process.exit(1); }

const out = {
  d: base.d || String(d),
  title_de: base.title_de || entry.title_de,
  title_ru: meta.title_ru,
  poet_de: base.poet_de,
  poet_ru: meta.poet_ru,
  year: base.year || entry.year,
};
if (meta.title_annotations) out.title_annotations = meta.title_annotations;
out.stanzas = stanzas;
out.about = about;
if (base.source) out.source = base.source;

fs.writeFileSync(outF, JSON.stringify(out, null, 1) + '\n');
console.log('OK: ' + outF + ' (строф ' + stanzas.length + ', about ' + about.length + ')');
