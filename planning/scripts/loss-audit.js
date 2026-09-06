#!/usr/bin/env node
// Аудит потерь на опубликованных страницах (0 токенов): какие предложения исчезли из страницы между её версией
// на момент <sinceISO> и HEAD. Выход — JSON для судьи (sonnet): по каждой песне список исчезнувших предложений
// из сносок и разделов «О песне». Причины могут быть законными (кухня, ошибки) — решает судья по репозиторным фактам.
//   node planning/scripts/loss-audit.js <sinceISO> <out.json>
const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..'); const [since, out] = process.argv.slice(2);
if (!since || !out) { console.error('usage: loss-audit.js <sinceISO> <out.json>'); process.exit(1); }
const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const base = git(['rev-list', '-1', '--before=' + since, 'HEAD']).trim();
const changed = git(['diff', '--name-only', base, 'HEAD', '--', 'app/src/data/songs']).split('\n').filter((f) => f.endsWith('.json'));
const sentences = (song) => { const t = []; (song.title_annotations || []).forEach((a) => t.push(a.text)); (song.about || []).forEach((s) => t.push(s.text)); (song.stanzas || []).forEach((st) => (st.lines_ru || []).forEach((l) => (l.annotations || []).forEach((a) => t.push(a.text)))); const set = new Set(); for (const x of t) for (const s of String(x || '').split(/(?<=[.!?…])\s+|\n/)) { const y = s.trim(); if (y.length > 25) set.add(y); } return set; };
const report = []; let songsChecked = 0, totalRemoved = 0;
for (const f of changed) {
  let oldRaw; try { oldRaw = git(['show', base + ':' + f]); } catch { continue; } // не существовала — новая песня, не аудит потерь
  let oldS, newS; try { oldS = JSON.parse(oldRaw); newS = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); } catch { continue; }
  if (oldS.text_only) continue; // раньше была только текстом — перевод новый
  songsChecked++;
  const a = sentences(oldS), b = sentences(newS); const removed = [...a].filter((s) => !b.has(s));
  if (removed.length) { totalRemoved += removed.length; report.push({ d: newS.d, file: f, n_old: a.size, n_new: b.size, removed }); }
}
fs.writeFileSync(out, JSON.stringify({ base, since, songsChecked, songsWithLoss: report.length, totalRemoved, songs: report }, null, 1));
console.log(`база ${base.slice(0, 7)} (${since}); проверено опубликованных ранее страниц: ${songsChecked}; с исчезнувшими предложениями: ${report.length}; предложений исчезло: ${totalRemoved} → ${out}`);
