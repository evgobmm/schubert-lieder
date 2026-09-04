#!/usr/bin/env node
// Очередь «снятого без опоры» из журнала воркфлоу (0 токенов) — для восстановительной дорожки:
//   node planning/scripts/removed-queue.js <runId|journal.jsonl|all> <outFile.json>   (all — по всем журналам проекта, сгруппировано по песне)
// Берёт из результатов Fable-этапа поля removed[{what,why}], делит на два класса: «ошибка» (противоречие фактам, дубль,
// арифметика, кухня — восстанавливать нечего) и «без опоры» (утверждение правдоподобно, но не подтверждено — на проверку источниками).
const fs = require('fs'); const path = require('path'); const os = require('os');
const [arg, out] = process.argv.slice(2);
if (!arg || !out) { console.error('usage: removed-queue.js <runId|journal.jsonl> <out.json>'); process.exit(1); }
const projDirAll = path.join(os.homedir(), '.claude', 'projects', process.cwd().replace(/\//g, '-'));
let journals = [];
if (arg === 'all') { const walk = (d, depth) => { if (depth > 4) return; for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p, depth + 1); else if (f.name === 'journal.jsonl') journals.push(p); } }; walk(projDirAll, 0); }
let jp = arg;
if (arg !== 'all' && !fs.existsSync(jp)) { const projDir = path.join(os.homedir(), '.claude', 'projects', process.cwd().replace(/\//g, '-')); const found = []; const walk = (d, depth) => { if (depth > 4) return; for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) { if (f.name === arg) found.push(path.join(p, 'journal.jsonl')); else walk(p, depth + 1); } } }; walk(projDir, 0); jp = found.find((p) => fs.existsSync(p)); if (!jp) { console.error('журнал не найден: ' + arg); process.exit(1); } }
const ERR = /ошиб|противореч|дубл|повтор|арифмет|кухн|не совпада|неверн|устарел|нет в тексте|в тексте стоит|тавтолог|двусмысл/i;
const queue = [];
if (arg !== 'all') journals = [jp];
for (const j of journals) for (const line of fs.readFileSync(j, 'utf8').split('\n').filter(Boolean)) {
  let x; try { x = JSON.parse(line); } catch { continue; }
  const r = x.result; if (!r || typeof r !== 'object' || !Array.isArray(r.removed)) continue;
  const d = String(r.d || '').match(/\d+[A-Za-z]?(?:\/\d+)?/); if (!d) continue;
  for (const it of r.removed) { const why = (it && it.why) || ''; const cls = ERR.test(why) ? 'ошибка' : 'без опоры'; queue.push({ d: d[0], what: it.what, why, cls }); }
}
const noSupport = queue.filter((q) => q.cls === 'без опоры');
const bySong = {}; for (const q of noSupport) (bySong[q.d] = bySong[q.d] || []).push({ what: q.what, why: q.why });
fs.writeFileSync(out, JSON.stringify({ all: queue.length, to_verify: noSupport.length, songs: Object.keys(bySong).length, by_song: bySong }, null, 1));
console.log(`снято всего ${queue.length}; на проверку источниками («без опоры»): ${noSupport.length}; → ${out}`);
