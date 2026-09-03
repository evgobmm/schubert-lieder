#!/usr/bin/env node
// Публикация чистых кандидатов (0 токенов):
//   node planning/scripts/publish-candidates.js <workDir> <d> [<d> ...]
// Для каждой песни: копирует work/candidate-<slug>.json → app/src/data/songs/<file>, facts/<slug>-facts.md → planning/research/,
// добавляет запись в planning/catalog/translated.json; затем build-app-data, check-corpus, lint-style, check-acknowledgements.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const [workDir, ...ds] = process.argv.slice(2);
if (!workDir || !ds.length) { console.error('usage: publish-candidates.js <workDir> <d>...'); process.exit(2); }
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/index.json'), 'utf8'));
const trPath = path.join(ROOT, 'planning/catalog/translated.json');
const translated = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const run = (cmd, args, cwd) => { const r = spawnSync(cmd, args, { encoding: 'utf8', cwd: cwd || ROOT }); return { code: r.status, out: (r.stdout || '') + (r.stderr || '') }; };
for (const d of ds) {
  const e = index.find((x) => String(x.d) === String(d)); const slug = e.file.replace('.json', '');
  const cand = path.join(workDir, 'work', `candidate-${slug}.json`);
  // ГЕЙТ ПОЛНОТЫ (урок партии 4: «чисто» у сверки не значит «полно» — страница без файла фактов вышла с одним разделом)
  const factsF = path.join(workDir, 'facts', slug + '-facts.md');
  const candJ = JSON.parse(fs.readFileSync(cand, 'utf8'));
  const perfAll = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/performances.json'), 'utf8'));
  const nAbout = (candJ.about || []).length;
  const nAnn = (candJ.stanzas || []).reduce((a, st) => a + (st.lines_ru || []).reduce((b, l) => b + (l.annotations || []).length, 0), 0);
  const gate = [];
  if (!fs.existsSync(factsF) && !fs.existsSync(path.join(ROOT, 'planning/research', slug + '-facts.md'))) gate.push('нет файла фактов');
  if (nAbout < 4) gate.push('секций «О песне» ' + nAbout + ' (< 4)');
  if ((perfAll[String(d)] || []).length && !(candJ.about || []).some((x) => /как это поют/i.test(x.title))) gate.push('нет раздела «Как это поют» при имеющихся записях');
  // ГЕЙТ FABLE (урок 06.09: терцет Метастазио ушёл на сайт без редактуры — список публикации набирали по памяти): след Fable-этапа обязателен
  const v1F = path.join(workDir, 'work', `candidate-${slug}.v1.json`), editsF = path.join(workDir, 'work', `edits-${slug}.json`), deltaB = path.join(workDir, 'bundles', `delta-${slug}.part1.md`);
  const fableTrace = fs.existsSync(editsF) || (fs.existsSync(deltaB) && fs.existsSync(v1F) && fs.statSync(deltaB).mtimeMs > fs.statSync(v1F).mtimeMs);
  if (!fableTrace && !process.argv.includes('--allow-no-fable')) gate.push('нет следа Fable-этапа (edits-файл или delta-бандл новее v1)');
  if (gate.length) { console.log(`D ${d}: ГЕЙТ НЕ ПРОЙДЕН — не публикую: ` + gate.join('; ')); continue; }
  if (nAbout < 6 || nAnn < 6) console.log(`D ${d}: WARN полноты — секций ${nAbout}, сносок ${nAnn} (проверь бедность источников)`);
  const chk = run('node', [path.join(ROOT, 'planning/scripts/check-song-file.js'), cand]);
  if (chk.code !== 0) { console.log(`D ${d}: валидатор НЕ чист — не публикую\n` + chk.out); continue; }
  const song = JSON.parse(fs.readFileSync(cand, 'utf8'));
  fs.writeFileSync(path.join(ROOT, 'app/src/data/songs', e.file), JSON.stringify(song, null, 1) + '\n');
  // Файл фактов копируется, только если он НЕ БЕДНЕЕ уже лежащего в репозитории.
  // Урок 03.09: догон по опубликованным песням взял старые копии из каталога волны
  // и откатил факты, добранные позже (49 файлов) — репозиторий здесь источник истины.
  const f = path.join(workDir, 'facts', slug + '-facts.md');
  const dst = path.join(ROOT, 'planning/research', slug + '-facts.md');
  if (fs.existsSync(f)) {
    const nF = (x) => (x.match(/^\*\*Ф\d+\./gm) || []).length;
    const src = fs.readFileSync(f, 'utf8');
    const cur = fs.existsSync(dst) ? fs.readFileSync(dst, 'utf8') : '';
    if (!cur || nF(src) >= nF(cur)) fs.copyFileSync(f, dst);
    else console.log(`D ${d}: файл фактов волны беднее репозиторного (${nF(src)} против ${nF(cur)} фактов) — НЕ копирую`);
  }
  translated[String(d)] = { file: e.file, title_ru: song.title_ru, poet_ru: song.poet_ru };
  console.log(`D ${d} «${song.title_ru}» → ${e.file} (+ файл фактов, translated.json)`);
}
fs.writeFileSync(trPath, JSON.stringify(translated, null, 1) + '\n');
const b = run('node', [path.join(ROOT, 'planning/catalog/scripts/build-app-data.js')]); console.log('build-app-data: ' + b.out.trim().split('\n').slice(-2).join(' | '));
const c = run('node', [path.join(ROOT, 'planning/scripts/check-corpus.js')]); console.log('check-corpus: ' + (c.out.match(/ERROR: \d+, WARN: \d+/) || [c.out.slice(-200)])[0] + (c.code ? '\n' + c.out.split('\n').filter((l) => l.includes('[ERROR]')).join('\n') : ''));
const l = run('node', [path.join(ROOT, 'planning/scripts/lint-style.js'), ...ds.map((d) => path.join(ROOT, 'app/src/data/songs', index.find((x) => String(x.d) === String(d)).file))]); console.log('lint-style: ' + l.out.trim().split('\n').slice(-1)[0]);
const a = run('node', [path.join(ROOT, 'planning/scripts/check-acknowledgements.js')]); console.log('acknowledgements: ' + a.out.trim());
process.exit(c.code || l.code || a.code ? 1 : 0);
