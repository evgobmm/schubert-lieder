#!/usr/bin/env node
// Генератор состояния и волн для масштабирования на весь корпус.
// Использование:
//   node make-waves.js status                 — сводка по ярусам и прогрессу
//   node make-waves.js next famous <N>        — args для wave.js: следующие N famous-песен
//   node make-waves.js next batch <N> <SIZE>  — args для batch-wave.js: N песен medium/rare батчами по SIZE
// Источники: triage.json (ярусы), performances.json (сделанное), app index.
// Циклы muellerin/schwanengesang исключены (цикльный метод, отдельно).

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const index = require(path.join(ROOT, 'app/src/data/index.json'));
const triage = require(path.join(ROOT, 'planning/youtube/triage.json'));
const done = new Set(Object.keys(require(path.join(ROOT, 'app/src/data/performances.json'))));

const EXCLUDED = new Set(['winterreise', 'muellerin', 'schwanengesang']);
const songs = index
  .filter((s) => !done.has(s.d) && !EXCLUDED.has(s.section) && triage[s.d])
  .map((s) => ({
    d: s.d,
    slug: s.file.replace(/\.json$/, ''),
    title: s.title_de,
    tier: triage[s.d],
    section: s.section,
  }));

const [cmd, kind, nArg, sizeArg] = process.argv.slice(2);

if (cmd === 'status' || !cmd) {
  const byTier = { famous: 0, medium: 0, rare: 0 };
  songs.forEach((s) => byTier[s.tier]++);
  const doneCount = index.filter((s) => done.has(s.d)).length;
  console.log(`сделано: ${doneCount} из ${index.length}; осталось (без циклов): ${songs.length}`);
  console.log(`по ярусам: famous ${byTier.famous}, medium ${byTier.medium}, rare ${byTier.rare}`);
  const cycles = index.filter((s) => ['muellerin', 'schwanengesang'].includes(s.section) && !done.has(s.d)).length;
  console.log(`циклы (отдельный метод): ${cycles} песен`);
  process.exit(0);
}

if (cmd === 'next' && kind === 'famous') {
  const n = Number(nArg) || 10;
  const pick = songs.filter((s) => s.tier === 'famous').slice(0, n)
    .map(({ d, slug, title, tier }) => ({ d, slug, title, tier }));
  console.log(JSON.stringify({ songs: pick }));
  process.exit(0);
}

if (cmd === 'next' && kind === 'batch') {
  const n = Number(nArg) || 16;
  const size = Number(sizeArg) || 4;
  // medium раньше rare; внутри яруса — каталожный порядок; батчи однородные по ярусу
  const pool = [...songs.filter((s) => s.tier === 'medium'), ...songs.filter((s) => s.tier === 'rare')].slice(0, n);
  const batches = [];
  for (let i = 0; i < pool.length; i += size) {
    batches.push(pool.slice(i, i + size).map(({ d, slug, title, tier }) => ({ d, slug, title, tier })));
  }
  console.log(JSON.stringify({ batches }));
  process.exit(0);
}

console.error('usage: make-waves.js status | next famous <N> | next batch <N> <SIZE>');
process.exit(1);
