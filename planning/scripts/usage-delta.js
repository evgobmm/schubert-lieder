#!/usr/bin/env node
// Замер биллинговых токенов по локальным транскриптам Claude Code (тот же источник, что у ccusage; 0 токенов):
//   node planning/scripts/usage-delta.js <sinceISO> [<untilISO>] [--by-session]
// Суммирует usage всех *.jsonl (главные сессии + subagents) в ~/.claude/projects/<этот-проект>/,
// дедуп по message.id+requestId (стриминговые повторы), группировка по модели.
const fs = require('fs');
const path = require('path');
const os = require('os');
const [since, untilArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const bySession = process.argv.includes('--by-session');
if (!since) { console.error('usage: usage-delta.js <sinceISO> [<untilISO>] [--by-session]'); process.exit(1); }
const t0 = Date.parse(since), t1 = untilArg ? Date.parse(untilArg) : Infinity;
const projDir = path.join(os.homedir(), '.claude', 'projects', process.cwd().replace(/\//g, '-'));
const files = [];
const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (f.name.endsWith('.jsonl') && fs.statSync(p).mtimeMs >= t0 - 3600e3) files.push(p); } };
walk(projDir);
const seen = new Set(); const agg = {}; const perSess = {};
const add = (key, u) => { const a = agg[key] || (agg[key] = { msgs: 0, input: 0, cache_create: 0, cache_read: 0, output: 0 }); a.msgs++; a.input += u.input_tokens || 0; a.cache_create += u.cache_creation_input_tokens || 0; a.cache_read += u.cache_read_input_tokens || 0; a.output += u.output_tokens || 0; };
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  for (const line of lines) {
    if (!line.includes('"usage"')) continue;
    let j; try { j = JSON.parse(line); } catch { continue; }
    const m = j.message; if (!m || !m.usage || j.type !== 'assistant') continue;
    const ts = Date.parse(j.timestamp); if (!(ts >= t0 && ts <= t1)) continue;
    const id = (m.id || '') + '|' + (j.requestId || ''); if (seen.has(id)) continue; seen.add(id);
    add(m.model || 'unknown', m.usage);
    if (bySession) { const s = path.relative(projDir, f).split('/')[0].replace('.jsonl', ''); add('session ' + s + ' · ' + (m.model || '?'), m.usage); }
  }
}
const fmt = (n) => (n / 1e6).toFixed(2) + 'M';
let tot = { input: 0, cache_create: 0, cache_read: 0, output: 0, msgs: 0 };
console.log(`Окно: ${since} → ${untilArg || 'сейчас'}; файлов просмотрено: ${files.length}`);
for (const [k, a] of Object.entries(agg).sort()) {
  if (!k.startsWith('session ')) for (const x of Object.keys(tot)) tot[x] += a[x];
  console.log(`${k.padEnd(48)} msgs ${String(a.msgs).padStart(5)} | in ${fmt(a.input)} | cache+ ${fmt(a.cache_create)} | cache-read ${fmt(a.cache_read)} | out ${fmt(a.output)} | всего ${fmt(a.input + a.cache_create + a.cache_read + a.output)}`);
}
console.log(`ИТОГО: msgs ${tot.msgs} | in ${fmt(tot.input)} | cache+ ${fmt(tot.cache_create)} | cache-read ${fmt(tot.cache_read)} | out ${fmt(tot.output)} | всего ${fmt(tot.input + tot.cache_create + tot.cache_read + tot.output)}`);
