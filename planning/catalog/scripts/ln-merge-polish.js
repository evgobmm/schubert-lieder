// Приёмка полировки членения: принимаем новое членение, только если мультимножество
// слов (без регистра первой буквы строк) не изменилось ни на один токен.
// Запуск: node ln-merge-polish.js <polishDir> [--apply]
const fs = require('fs');
const path = require('path');
const DIR = process.argv[2];
const APPLY = process.argv.includes('--apply');
const TP = path.join(__dirname, '../sources/texts-published.json');
const tp = JSON.parse(fs.readFileSync(TP, 'utf8'));
const keyByD = {}; for (const k of Object.keys(tp)) keyByD[tp[k].d] = k;

// охранитель: последовательность БУКВ неизменна (регистр и пунктуация — презентация;
// дефисные разрывы «zuge- schaut» можно сращивать)
const bag = st => st.flat().join(' ').toLowerCase().replace(/-\s+/g, '').replace(/[^a-zäöüß]+/g, '');

let okN = 0, rej = [];
for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.json'))) {
  let res;
  try { res = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { rej.push([f, 'parse']); continue; }
  const d = res.d;
  const entry = tp[keyByD[d]];
  if (!entry) { rej.push([f, 'no-key']); continue; }
  const st = (res.stanzas || []).filter(s => Array.isArray(s) && s.length);
  if (!st.length) { rej.push([d, 'empty']); continue; }
  if (bag(st) !== bag(entry.stanzas)) { rej.push([d, 'token-guard']); continue; }
  if (APPLY) {
    entry.stanzas = st.map(s => s.map(l => { const m = l.match(/^([^a-zA-ZäöüßÄÖÜ]*)([a-zäöüß])(.*)$/s); return m ? m[1] + m[2].toUpperCase() + m[3] : l; }));
    entry.lineation = 'ln-reference-polished';
  }
  okN++;
}
if (APPLY) fs.writeFileSync(TP, JSON.stringify(tp, null, 1));
console.log('принято:', okN, APPLY ? '(записано)' : '(без записи)', '| отклонено:', rej.length, JSON.stringify(rej.slice(0, 15)));
