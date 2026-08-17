#!/usr/bin/env node
// Подготовка партии песен к переводу (0 токенов):
//  - пакет песни для писателя: текст + компактные словарные записи покрытых слов;
//  - объединённый список непокрытых форм партии → входные файлы мини-волны словаря.
// Запуск: node planning/scripts/pilot-prep.js <outDir> <d1> <d2> ...
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');

const [outDir, ...ds] = process.argv.slice(2);
if (!outDir || !ds.length) { console.error('usage: pilot-prep.js <outDir> <d>...'); process.exit(1); }
fs.mkdirSync(path.join(outDir, 'songs'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'dict-wave'), { recursive: true });

// формы, уже стоящие в очереди топ-500 (их исследует основная волна — не дублировать)
const queue = JSON.parse(fs.readFileSync(path.join(ROOT, 'planning/dictionary/top-500-queue.json'), 'utf8')).queue;
const inQueue = new Set(queue.map((q) => q.form));

const uncoveredUnion = new Map(); // form -> {count, songs:[d], sample}
for (const d of ds) {
  const out = execFileSync('node', [path.join(ROOT, 'planning/scripts/prepare-song.js'), d], { encoding: 'utf8' });
  const pkt = JSON.parse(out);
  const compact = {
    d: pkt.d, file: pkt.file, title_de: pkt.title_de, section: pkt.section,
    poet: pkt.poet, year: pkt.year, stanzas: pkt.stanzas,
    wordStats: pkt.wordStats,
    cache: (pkt.cacheEntriesForPrompt || []).map((e) => ({
      lemma: e.lemma, era: e.era, register: e.register,
      ru_candidates: e.ru_candidates, recommendation: e.recommendation,
      caveats: e.caveats, status: e.status,
    })),
    uncovered: pkt.uncovered,
  };
  fs.writeFileSync(path.join(outDir, 'songs', `d${String(d).replace('/', '-')}-packet.json`), JSON.stringify(compact, null, 1));
  for (const u of pkt.uncovered) {
    if (inQueue.has(u.form)) continue; // придёт из основной волны
    const cur = uncoveredUnion.get(u.form) || { form: u.form, count: 0, songs: [], sample: '' };
    cur.count += u.count; cur.songs.push('d' + d);
    uncoveredUnion.set(u.form, cur);
  }
}
// sample: первая строка с формой
for (const cur of uncoveredUnion.values()) {
  outer: for (const d of ds) {
    const pkt = JSON.parse(fs.readFileSync(path.join(outDir, 'songs', `d${String(d).replace('/', '-')}-packet.json`), 'utf8'));
    for (const st of pkt.stanzas) for (const line of st) {
      if (line.toLowerCase().includes(cur.form)) { cur.sample = line; break outer; }
    }
  }
}
const list = [...uncoveredUnion.values()].sort((a, b) => b.count - a.count)
  .map((c) => ({ form: c.form, count: c.count, songs: c.songs.length, sample: c.sample }));
// нарезка по 20 в файлы мини-волны начиная с номера 26
const startIdx = 25;
const ranges = [];
for (let i = 0; i < list.length; i += 20) {
  const b = list.slice(i, i + 20);
  const nn = String(startIdx + 1 + i / 20).padStart(2, '0');
  fs.writeFileSync(path.join(outDir, 'dict-wave', `input-${nn}.json`), JSON.stringify(b, null, 1));
  ranges.push({ idx: startIdx + i / 20, n: b.length, first: b[0].form, last: b[b.length - 1].form });
}
console.log(JSON.stringify({ songs: ds.length, uncoveredForms: list.length, miniWave: ranges }, null, 1));
