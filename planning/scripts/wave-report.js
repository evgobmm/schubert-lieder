#!/usr/bin/env node
// Компактный отчёт по журналу воркфлоу волны (0 токенов) — вместо ручного разбора JSON в главном цикле:
//   node planning/scripts/wave-report.js <runId | путь к journal.jsonl> [<workDir>]
// Печатает по песне: пройденные этапы, вердикты сверок с проблемами, флаги Fable; внизу — список чистых и команду публикации.
const fs = require('fs'); const path = require('path'); const os = require('os');
const [arg, workDir] = process.argv.slice(2);
if (!arg) { console.error('usage: wave-report.js <runId|journal.jsonl> [workDir]'); process.exit(1); }
let jp = arg;
if (!fs.existsSync(jp)) {
  const projDir = path.join(os.homedir(), '.claude', 'projects', process.cwd().replace(/\//g, '-'));
  const found = []; const walk = (d, depth) => { if (depth > 4) return; for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) { if (f.name === arg) found.push(path.join(p, 'journal.jsonl')); else walk(p, depth + 1); } } };
  walk(projDir, 0); jp = found.find((p) => fs.existsSync(p));
  if (!jp) { console.error('журнал не найден для ' + arg); process.exit(1); }
}
const songs = {};
for (const line of fs.readFileSync(jp, 'utf8').split('\n').filter(Boolean)) {
  let x; try { x = JSON.parse(line); } catch { continue; }
  if (x.type !== 'result' || !x.result || typeof x.result !== 'object') continue;
  const r = x.result; const d = String(r.d || '?').match(/^\s*(\d+[A-Za-z]?(?:\/\d+)?)\s*$/); let key = d ? d[1] : '?';
  // агент мог вернуть в поле d прозу вместо номера — восстанавливаем D по слагу песни в его транскрипте.
  // Ловить только слаг вида d434-erntelied: прозаические «D 296» — это соседние песни, по ним атрибуция врёт.
  if (key === '?' && x.agentId) {
    try {
      const t = fs.readFileSync(path.join(path.dirname(jp), 'agent-' + x.agentId + '.jsonl'), 'utf8').slice(0, 20000);
      const hits = {}; for (const m of t.matchAll(/\bd(\d+[A-Za-z]?)-[a-z-]{3,}/g)) hits[m[1]] = (hits[m[1]] || 0) + 1;
      const best = Object.entries(hits).sort((a, b) => b[1] - a[1])[0];
      if (best) key = best[0];
    } catch { }
  }
  const s = songs[key] || (songs[key] = { stages: [], deltas: [], flags: [], removed: 0, calls: 0, at: {} });
  s.calls += r.tool_calls || 0; s.seq = (s.seq || 0) + 1;
  if ('n_new' in r) s.stages.push(`dict(+${r.n_new}${r.drafts && r.drafts.length ? ', draft ' + r.drafts.length : ''})`);
  else if ('n_facts' in r) s.stages.push(`facts(${r.n_facts}${r.gaps && r.gaps.length ? ', gaps ' + r.gaps.length : ''})`);
  else if ('n_annotations' in r) (s.at.page = s.seq), s.stages.push(`page(${r.n_annotations} сн., ${r.n_about} секц.${r.rounds > 1 ? ', ' + r.rounds + ' раунда' : ''})`);
  else if ('removed' in r) { s.at.fable = s.seq; s.stages.push(`fable(${r.n_changes} правок, снято ${r.removed.length})`); s.removed = r.removed.length; s.flags = r.flags || []; }
  else if ('applied' in r) s.stages.push(`ремонт(${r.applied}${r.rejected && r.rejected.length ? ', отклонено ' + r.rejected.length : ''})`);
  else if ('clean' in r) { s.stages.push(r.clean ? 'сверка: ЧИСТО' : 'сверка: НЕ чисто'); s.deltas.push(r); }
}
const clean = [], dirty = [], nofable = [];
for (const [d, s] of Object.entries(songs).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))) {
  const last = s.deltas[s.deltas.length - 1];
  // Fable-редактура обязательна для каждой песни (указание пользователя): без неё страница к публикации не годится,
  // даже если сверка чистая — иначе список публикации зовёт печатать неотредактированные страницы.
  // Журнал накапливается между прогонами (resume пишет в тот же runId): если страница пересобиралась ПОСЛЕ
  // последней Fable-редактуры, редактуры у нынешнего кандидата нет, сколько бы её ни было в прошлом прогоне.
  const hasFable = Boolean(s.at.fable && s.at.fable > (s.at.page || 0));
  const ok = Boolean(last && last.clean && hasFable);
  (ok ? clean : (hasFable ? dirty : nofable)).push(d);
  const status = ok ? 'ЧИСТО' : (!hasFable ? 'БЕЗ FABLE — не публиковать' : (last ? 'НЕ ЧИСТО' : 'сверки нет'));
  console.log(`\n### D ${d} — ${status} · вызовов инструментов ${s.calls}\n  этапы: ${s.stages.join(' → ')}`);
  if (last && !last.clean) (last.problems || []).forEach((p) => console.log('  ! ' + p));
  if (s.flags.length) s.flags.forEach((f) => console.log('  ⚑ ' + f));
}
console.log(`\nЧИСТЫЕ: ${clean.join(' ') || '—'}\nНЕ ЧИСТЫЕ: ${dirty.join(' ') || '—'}\nБЕЗ FABLE (доредактировать и сверить заново): ${nofable.join(' ') || '—'}`);
if (clean.length && workDir) console.log(`Публикация: node planning/scripts/publish-candidates.js ${workDir} ${clean.join(' ')}`);
