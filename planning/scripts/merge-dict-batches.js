#!/usr/bin/env node
// Слияние батчей словарной волны (scratchpad) в planning/dictionary/entries/ (0 токенов).
// Запуск: node planning/scripts/merge-dict-batches.js <каталог-с-batch-*.json>
// Валидация полей, запрет перезаписи существующих записей (коллизии — в отчёт).
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const ENTRIES = path.join(ROOT, 'planning/dictionary/entries');

const dir = process.argv[2];
if (!dir) { console.error('usage: merge-dict-batches.js <dir>'); process.exit(1); }

const REQUIRED = ['lemma', 'era', 'register', 'ru_candidates', 'recommendation', 'evidence', 'status'];
const report = { written: 0, skippedExisting: [], invalid: [], drafts: [], files: 0 };

const batchFiles = fs.readdirSync(dir).filter((f) => /^batch-\d+\.json$/.test(f)).sort();
for (const bf of batchFiles) {
  let arr;
  try { arr = JSON.parse(fs.readFileSync(path.join(dir, bf), 'utf8')); }
  catch (e) { report.invalid.push(bf + ': не парсится: ' + e.message); continue; }
  if (!Array.isArray(arr)) { report.invalid.push(bf + ': не массив'); continue; }
  report.files++;
  for (const e of arr) {
    const missing = REQUIRED.filter((k) => typeof e[k] !== 'string' || (k !== 'caveats' && k !== 'era' && e[k] === ''));
    if (!e || typeof e.lemma !== 'string' || missing.length) {
      report.invalid.push(bf + ': ' + (e && e.lemma ? e.lemma : '<без леммы>') + ' — нет полей: ' + missing.join(','));
      continue;
    }
    if (!['verified', 'draft'].includes(e.status)) { report.invalid.push(bf + ': ' + e.lemma + ' — статус ' + e.status); continue; }
    const lemma = e.lemma.toLowerCase().trim();
    const target = path.join(ENTRIES, lemma + '.json');
    if (fs.existsSync(target)) { report.skippedExisting.push(lemma + ' (' + bf + ')'); continue; }
    const out = {
      lemma,
      header: e.header || lemma,
      era: e.era, register: e.register, ru_candidates: e.ru_candidates,
      recommendation: e.recommendation, caveats: e.caveats || '',
      evidence: e.evidence,
      forms_covered: Array.isArray(e.forms_covered) ? e.forms_covered : [lemma],
      source: e.source || 'top500-wave', song: e.song || null, status: e.status,
    };
    fs.writeFileSync(target, JSON.stringify(out, null, 1) + '\n');
    report.written++;
    if (e.status === 'draft') report.drafts.push(lemma);
  }
}
console.log(JSON.stringify(report, null, 1));
