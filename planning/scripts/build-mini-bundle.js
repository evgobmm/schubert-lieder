#!/usr/bin/env node
// Мини-бандл изменённых мест песни для Fable-догона (0 токенов).
//   node planning/scripts/build-mini-bundle.js <baseRef> <outDir> <d> [<d> ...]
// Сравнивает файл песни в baseRef и в рабочем дереве, выбирает ТОЛЬКО изменённые места
// (строки подстрочника с их сноскам, секции «О песне», титульные сноски) и добавляет факты,
// появившиеся в файле фактов за тот же промежуток. Пишет <outDir>/mini-<slug>.md.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const [baseRef, outDir, ...ds] = process.argv.slice(2);
if (!baseRef || !outDir || !ds.length) { console.error('usage: build-mini-bundle.js <baseRef> <outDir> <d>...'); process.exit(2); }
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/index.json'), 'utf8'));
const show = (ref, rel) => { try { return execFileSync('git', ['show', `${ref}:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); } catch { return null; } };
const segS = (l) => (l && l.segments || []).map((s) => `${s.ru || ''} [${s.de || ''}]`).join(' | ');
const annS = (a) => `${a.type}[${(a.segment_range || []).join('-')}] ${a.text}`;
fs.mkdirSync(outDir, { recursive: true });
const built = [];
for (const d of ds) {
  const e = index.find((x) => String(x.d) === String(d));
  if (!e || !e.file) { console.log(`D ${d}: нет в индексе`); continue; }
  const slug = e.file.replace('.json', '');
  const rel = 'app/src/data/songs/' + e.file;
  const oldRaw = show(baseRef, rel);
  if (!oldRaw) { console.log(`D ${d}: нет версии в ${baseRef}`); continue; }
  const A = JSON.parse(oldRaw), B = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  const L = [];
  const P = (s) => L.push(s);
  P(`# МИНИ-БАНДЛ ПРАВОК · «${B.title_de}» (D ${d}) — «${B.title_ru}», ${B.poet_ru}, ${B.year}`);
  P(`Ниже — ТОЛЬКО те места, где после текстологического аудита изменился немецкий текст, подстрочник, сноски или проза. Остальная страница не менялась и в этот проход не входит.`);
  // строки
  const flat = (j) => { const r = []; (j.stanzas || []).forEach((st, si) => (st.lines_de || []).forEach((de, li) => r.push({ id: `${si + 1}.${li + 1}`, de, ru: (st.lines_ru || [])[li] }))); return r; };
  const fa = flat(A), fb = flat(B);
  const changedLines = [];
  const n = Math.max(fa.length, fb.length);
  for (let i = 0; i < n; i++) {
    const a = fa[i], b = fb[i];
    if (!a || !b) { changedLines.push({ id: (b || a).id, note: !a ? 'СТРОКА ДОБАВЛЕНА' : 'СТРОКА УДАЛЕНА', a, b }); continue; }
    const deCh = a.de !== b.de;
    const ruCh = segS(a.ru) !== segS(b.ru);
    const annCh = JSON.stringify((a.ru && a.ru.annotations) || []) !== JSON.stringify((b.ru && b.ru.annotations) || []);
    if (deCh || ruCh || annCh) changedLines.push({ id: b.id, a, b, deCh, ruCh, annCh });
  }
  if (changedLines.length) {
    P(`\n== ИЗМЕНЁННЫЕ СТРОКИ (${changedLines.length})`);
    for (const c of changedLines) {
      if (c.note) { P(`${c.id} ${c.note}`); if (c.b) { P(`  DE: ${c.b.de}`); P(`  RU: ${segS(c.b.ru)}`); } continue; }
      P(`${c.id} DE ${c.deCh ? 'было: ' + c.a.de + '\n' + c.id + ' DE стало: ' + c.b.de : '(не менялся): ' + c.b.de}`);
      if (c.ruCh) { P(`${c.id} RU было:  ${segS(c.a.ru)}`); P(`${c.id} RU стало: ${segS(c.b.ru)}`); } else P(`${c.id} RU: ${segS(c.b.ru)}`);
      const aa = (c.a.ru && c.a.ru.annotations) || [], bb = (c.b.ru && c.b.ru.annotations) || [];
      if (c.annCh) { aa.forEach((x, k) => P(`  сноска #${k} было:  ${annS(x)}`)); bb.forEach((x, k) => P(`  сноска #${k} стало: ${annS(x)}`)); }
      else bb.forEach((x, k) => P(`  сноска #${k}: ${annS(x)}`));
    }
  }
  // титульные сноски
  if (JSON.stringify(A.title_annotations || []) !== JSON.stringify(B.title_annotations || [])) {
    P('\n== ТИТУЛЬНЫЕ СНОСКИ');
    (A.title_annotations || []).forEach((x, k) => P(`[T] #${k} было:  ${annS(x)}`));
    (B.title_annotations || []).forEach((x, k) => P(`[T] #${k} стало: ${annS(x)}`));
  }
  // секции «О песне»
  const aboutCh = [];
  const maxA = Math.max((A.about || []).length, (B.about || []).length);
  for (let i = 0; i < maxA; i++) {
    const x = (A.about || [])[i], y = (B.about || [])[i];
    if (JSON.stringify(x) !== JSON.stringify(y)) aboutCh.push({ i, x, y });
  }
  if (aboutCh.length) {
    P(`\n== ИЗМЕНЁННЫЕ СЕКЦИИ «О ПЕСНЕ» (${aboutCh.length})`);
    for (const c of aboutCh) {
      if (c.x) P(`[S${c.i}] было  «${c.x.title}»: ${c.x.text}`);
      if (c.y) P(`[S${c.i}] стало «${c.y.title}»: ${c.y.text}`);
      if (!c.y) P(`[S${c.i}] СЕКЦИЯ УДАЛЕНА`);
    }
  }
  // новые факты
  const factsRel = 'planning/research/' + slug + '-facts.md';
  const oldF = show(baseRef, factsRel) || '';
  const newF = (() => { try { return fs.readFileSync(path.join(ROOT, factsRel), 'utf8'); } catch { return ''; } })();
  const oldSet = new Set(oldF.split('\n').filter((l) => /^\*\*Ф\d+\.\*\*/.test(l)));
  const added = newF.split('\n').filter((l) => /^\*\*Ф\d+\.\*\*/.test(l) && !oldSet.has(l));
  if (added.length) { P(`\n== НОВЫЕ ФАКТЫ ПРАВКИ (опора; полный файл: ${factsRel})`); added.forEach((l) => P(l.length > 700 ? l.slice(0, 700) + '…' : l)); }
  const out = L.join('\n') + '\n';
  if (!changedLines.length && !aboutCh.length) { console.log(`D ${d}: изменений в песне нет — мини-бандл не нужен`); continue; }
  const fp = path.join(outDir, `mini-${slug}.md`);
  fs.writeFileSync(fp, out);
  built.push({ d, slug, size: out.length, lines: changedLines.length, about: aboutCh.length, facts: added.length });
}
for (const b of built) console.log(`D ${b.d}: ${b.size} знаков — строк ${b.lines}, секций ${b.about}, фактов ${b.facts} → mini-${b.slug}.md`);
console.log(`ИТОГО мини-бандлов: ${built.length}, средний размер ${built.length ? Math.round(built.reduce((a, b) => a + b.size, 0) / built.length) : 0} знаков`);
