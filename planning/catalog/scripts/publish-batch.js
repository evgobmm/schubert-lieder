// Публикация результатов транскрипционной партии.
// Использование: node publish-batch.js <task-output-file>
const fs = require('fs');
const ROOT = '/workspaces/schubert-lieder';
const out = process.argv[2];
const raw = JSON.parse(fs.readFileSync(out, 'utf8'));
const res = raw.result || raw;

const PUB = ROOT + '/planning/catalog/sources/texts-published.json';
const SUS = ROOT + '/planning/catalog/sources/aga-suspects.json';
const pub = JSON.parse(fs.readFileSync(PUB, 'utf8'));
const sus = fs.existsSync(SUS) ? JSON.parse(fs.readFileSync(SUS, 'utf8')) : [];
const have = new Set(pub.map(p => p.d));

let ok = 0, suspect = 0, failed = 0;
for (const r of res) {
  if (r.error || !r.stanzas) { failed++; sus.push({ d: r.d, error: r.error || 'no stanzas' }); continue; }
  if (r.verdict !== 'ok') { suspect++; sus.push({ d: r.d, issues: r.issues, stanzas: r.stanzas }); continue; }
  if (have.has(r.d)) { console.log('уже опубликована?!', r.d); continue; }
  pub.push({ d: r.d, stanzas: r.stanzas, status: 'aga-transcribed', source_detail: 'AGA Serie XX (MDZ), двойная транскрипция + арбитраж' });
  have.add(r.d);
  ok++;
}
pub.sort((a, b) => a.d.localeCompare(b.d, undefined, { numeric: true }));
fs.writeFileSync(PUB, JSON.stringify(pub, null, 1));
fs.writeFileSync(SUS, JSON.stringify(sus, null, 1));
console.log('партия:', res.length, '| ok:', ok, '| suspect:', suspect, '| failed:', failed);
console.log('итого опубликовано:', pub.length, '| в suspects:', sus.length);
