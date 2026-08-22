#!/usr/bin/env node
// Аргументы для ремонтного воркфлоу (0 токенов): берёт из журнала волны последний вердикт сверки
// по каждой указанной песне и собирает {workDir, songs:[{d, slug, poet, problems, removed}]}.
//   node planning/scripts/repair-args.js <runId|journal.jsonl> <workDir> <d> [<d> ...]
const fs = require('fs'); const path = require('path'); const os = require('os');
const [arg, workDir, ...ds] = process.argv.slice(2);
if (!arg || !workDir || !ds.length) { console.error('usage: repair-args.js <runId|journal.jsonl> <workDir> <d>...'); process.exit(1); }
let jp = arg;
if (!fs.existsSync(jp)) {
  const projDir = path.join(os.homedir(), '.claude', 'projects', process.cwd().replace(/\//g, '-'));
  const found = []; const walk = (d, depth) => { if (depth > 4) return; for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) { if (f.name === arg) found.push(path.join(p, 'journal.jsonl')); else walk(p, depth + 1); } } };
  walk(projDir, 0); jp = found.find((p) => fs.existsSync(p));
  if (!jp) { console.error('журнал не найден для ' + arg); process.exit(1); }
}
const key = (x) => {
  const m = String((x.result || {}).d || '').match(/^\s*(\d+[A-Za-z]?(?:\/\d+)?)\s*$/); if (m) return m[1];
  try { const t = fs.readFileSync(path.join(path.dirname(jp), 'agent-' + x.agentId + '.jsonl'), 'utf8').slice(0, 20000); const mm = t.match(/D\s?(\d+[A-Za-z]?)/) || t.match(/\bd(\d+[A-Za-z]?)-/); if (mm) return mm[1]; } catch { }
  return '?';
};
const last = {}, removed = {};
for (const line of fs.readFileSync(jp, 'utf8').split('\n').filter(Boolean)) {
  let x; try { x = JSON.parse(line); } catch { continue; }
  if (x.type !== 'result' || !x.result || typeof x.result !== 'object') continue;
  const k = key(x);
  if ('clean' in x.result) last[k] = x.result;
  if ('removed' in x.result) removed[k] = x.result.removed || [];
}
const idx = JSON.parse(fs.readFileSync(path.join(workDir, 'args.json'), 'utf8')).songs;
const songs = [];
for (const d of ds) {
  const s = idx.find((z) => z.d === d); const v = last[d];
  if (!s) { console.error('нет песни ' + d + ' в args.json'); process.exit(1); }
  if (!v || !v.problems || !v.problems.length) { console.error('нет проблем сверки для D ' + d); process.exit(1); }
  songs.push({ d, slug: s.slug, poet: s.poet, problems: v.problems, removed: removed[d] || [] });
}
console.log(JSON.stringify({ workDir, songs }));
