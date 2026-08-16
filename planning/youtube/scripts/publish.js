#!/usr/bin/env node
// Публикация результатов волны в app/src/data/performances.json.
// Использование: node publish.js <wave-results.json>
// wave-results.json — массив [{d, entries: [{videoId, name, year}], ...}] (возврат wave.js).
// Перед записью прогоняет oEmbed-проверку всех videoId; при мёртвом видео — отказ.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../../..');
const PERF = path.join(ROOT, 'app/src/data/performances.json');

async function main() {
  const results = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const perf = JSON.parse(fs.readFileSync(PERF, 'utf8'));
  const allIds = results.flatMap((r) => r.entries.map((e) => e.videoId));
  let checks = [];
  if (!allIds.length) { console.error('Пустой список результатов — нечего публиковать'); return; }
  try {
    checks = JSON.parse(execFileSync('node', [path.join(__dirname, 'yt-check.js'), ...allIds], { encoding: 'utf8', timeout: 120000 }));
  } catch (e) {
    if (!e.stdout) throw e;
    checks = JSON.parse(e.stdout); // exit code 2 = есть мёртвые, JSON всё равно в stdout
  }
  const dead = checks.filter((c) => !c.ok);
  if (dead.length) {
    console.error('МЁРТВЫЕ ВИДЕО, публикация прервана:', JSON.stringify(dead));
    process.exit(2);
  }
  for (const r of results) {
    const entries = r.entries.map((e) => ({ videoId: e.videoId, name: e.name, year: e.year }));
    if (!entries.length) { console.error(`D ${r.d}: пустой список — пропуск`); continue; }
    perf[r.d] = entries;
    console.error(`D ${r.d}: ${entries.length} записей (${entries.map((e) => e.name.split(' — ')[0]).join(', ')})`);
  }
  const sorted = {};
  for (const k of Object.keys(perf).sort((a, b) => parseFloat(a.replace('/', '.')) - parseFloat(b.replace('/', '.')))) sorted[k] = perf[k];
  fs.writeFileSync(PERF, JSON.stringify(sorted, null, 2).replace(/\{\n\s+"videoId"/g, '{ "videoId"').replace(/,\n\s+"name"/g, ', "name"').replace(/,\n\s+"year"/g, ', "year"').replace(/\n\s+\}/g, ' }') + '\n');
  execFileSync('node', ['-e', `JSON.parse(require('fs').readFileSync('${PERF}','utf8')); console.error('JSON валиден')`], { stdio: 'inherit' });
}

main().catch((e) => { console.error(e.message); process.exit(1); });
