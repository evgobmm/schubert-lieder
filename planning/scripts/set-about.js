#!/usr/bin/env node
// Вставка раздела «О песне» в готовую страницу без переписывания всего файла (0 токенов):
//   node planning/scripts/set-about.js <d> <workDir> <about.json>
// about.json — массив [{title, text}, ...]. Скрипт читает work/candidate-<slug>.json, заменяет ТОЛЬКО
// поле about и записывает файл обратно; строфы, подстрочник и пояснения не пересобираются и не проходят
// через руки агента — так разметка авторского референса («Зимний путь») остаётся байт в байт прежней.
// Затем прогоняет finish-page.js --final в режиме ABOUT_ONLY=1 (гейт считает только то, что внесли мы).
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const [d, workDir, aboutPath] = process.argv.slice(2);
if (!d || !workDir || !aboutPath) { console.error('usage: set-about.js <d> <workDir> <about.json>'); process.exit(2); }
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/index.json'), 'utf8'));
const e = index.find((x) => String(x.d) === String(d));
if (!e) { console.error('нет в индексе: ' + d); process.exit(2); }
const slug = e.file.replace('.json', '');
const candPath = path.join(workDir, 'work', `candidate-${slug}.json`);
if (!fs.existsSync(candPath)) { console.error('нет кандидата: ' + candPath + ' (сначала stage-published.js)'); process.exit(2); }

let about;
try { about = JSON.parse(fs.readFileSync(aboutPath, 'utf8')); } catch (err) { console.error('about.json не читается: ' + err.message); process.exit(1); }
if (!Array.isArray(about)) { console.error('about.json должен быть массивом [{title, text}, ...]'); process.exit(1); }
for (const [i, s] of about.entries()) {
  if (!s || typeof s.title !== 'string' || typeof s.text !== 'string') { console.error(`секция ${i}: нужны строки title и text`); process.exit(1); }
  if (!s.title.trim() || !s.text.trim()) { console.error(`секция ${i}: пустой заголовок или текст`); process.exit(1); }
}

const cand = JSON.parse(fs.readFileSync(candPath, 'utf8'));
const before = JSON.stringify(cand.stanzas);
cand.about = about;
if (JSON.stringify(cand.stanzas) !== before) { console.error('строфы изменились — этого быть не может'); process.exit(1); }
fs.writeFileSync(candPath, JSON.stringify(cand, null, 1) + '\n');
console.log(`about вписан: ${about.length} секций, ${about.reduce((a, s) => a + s.text.length, 0)} знаков → ${candPath}`);

const fp = spawnSync('node', [path.join(ROOT, 'planning/scripts/finish-page.js'), String(d), workDir, candPath, '--final'],
  { encoding: 'utf8', env: { ...process.env, ABOUT_ONLY: '1' } });
process.stdout.write(fp.stdout || ''); process.stderr.write(fp.stderr || '');
process.exit(fp.status === 0 ? 0 : 1);
