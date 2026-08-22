#!/usr/bin/env node
// Сборка и проверка страницы-кандидата одним вызовом (0 токенов):
//   node planning/scripts/finish-page.js <d> <workDir> <page.json> --v1      # этап page: page.json = {title_ru, poet_ru, title_annotations?, stanzas, about}
//   node planning/scripts/finish-page.js <d> <workDir> <candidate.json> --final   # этап fable: проверить готовый файл (немецкий текст, валидатор, линт)
// Пишет work/candidate-<slug>.json (и .v1.json при --v1), печатает компактный отчёт; код 1 при ERROR.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const [d, workDir, src, mode] = process.argv.slice(2);
if (!src) { console.error('usage: finish-page.js <d> <workDir> <json> --v1|--final'); process.exit(2); }
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/index.json'), 'utf8'));
const e = index.find((x) => String(x.d) === String(d)); const slug = e.file.replace('.json', '');
const wd = path.join(workDir, 'work'); fs.mkdirSync(wd, { recursive: true });
let page; try { page = JSON.parse(fs.readFileSync(src, 'utf8')); } catch (err) { console.log('[ERROR] JSON не читается: ' + err.message); process.exit(1); }
const meta = { title_ru: page.title_ru, poet_ru: page.poet_ru }; if (page.title_annotations) meta.title_annotations = page.title_annotations;
const tmp = (n, obj) => { const p = path.join(wd, `${n}-${slug}.json`); fs.writeFileSync(p, JSON.stringify(obj, null, 1)); return p; };
const stanzasF = tmp('stanzas', page.stanzas || []), aboutF = tmp('about', page.about || []), metaF = tmp('meta', meta);
const out = path.join(wd, `candidate-${slug}.json`);
const run = (args) => spawnSync('node', args, { encoding: 'utf8' });
const asm = run([path.join(ROOT, 'planning/scripts/assemble-song.js'), d, stanzasF, aboutF, metaF, out]);
process.stdout.write(asm.stdout + asm.stderr);
if (asm.status !== 0) process.exit(1);
const chk = run([path.join(ROOT, 'planning/scripts/check-song-file.js'), out]); process.stdout.write(chk.stdout);
const lint = run([path.join(ROOT, 'planning/scripts/lint-style.js'), out]); process.stdout.write(lint.stdout.split('\n').filter((l) => l.trim()).join('\n') + '\n');
if (mode === '--v1' && chk.status === 0) fs.copyFileSync(out, path.join(wd, `candidate-${slug}.v1.json`));
const nAnn = (page.stanzas || []).reduce((a, st) => a + (st.lines_ru || []).reduce((b, l) => b + (l.annotations || []).length, 0), 0);
console.log(`ИТОГ: ${chk.status === 0 ? 'валидатор чист' : 'ЕСТЬ ERROR — исправь и повтори'}; линт: ${lint.status === 0 ? 'чист' : 'есть срабатывания — исправь и повтори'}; аннотаций ${nAnn}, секций about ${(page.about || []).length}${mode === '--v1' ? '; v1 сохранён' : ''}`);
const okAll = chk.status === 0 && lint.status === 0;
if (okAll) { const next = mode === '--v1' ? 'fable' : (mode === '--final' ? 'delta' : null); if (next) { const bb = run([path.join(ROOT, 'planning/scripts/build-bundle.js'), next, d, workDir]); process.stdout.write('Следующий бандл собран: ' + bb.stdout); } }
process.exit(okAll ? 0 : 1);
