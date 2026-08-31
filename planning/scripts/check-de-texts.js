#!/usr/bin/env node
// Аудит немецких текстов корпуса против предзагруженных источников (0 токенов).
//   node planning/scripts/check-de-texts.js [--d <номер>] [--full]
// Для каждой переведённой песни ищет в кэшах волн (/home/vscode/schubert-waves/*/prefetch/<slug>/)
// файлы schubertsong.uk.txt и schubertlied.de.txt и проверяет, встречается ли КАЖДАЯ строка lines_de
// в тексте источника (нормализация: регистр, пунктуация, апострофы, ß/ss, пробелы).
// Источники дают и современную, и старую орфографию, поэтому совпадение с любой из них считается нормой.
// Печатает только расхождения: строку проекта и ближайшую строку источника (по доле общих слов).
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const WAVES = '/home/vscode/schubert-waves';

const args = process.argv.slice(2);
const only = args.includes('--d') ? args[args.indexOf('--d') + 1] : null;
const full = args.includes('--full');

const entities = (s) => s.replace(/&#(\d+);/g, (_, c) => String.fromCharCode(+c)).replace(/&[a-z]+;/g, ' ');
const deaccent = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const norm = (s) => deaccent(entities(s)).toLowerCase()
  .replace(/[‘’ʼ'`]/g, '')
  .replace(/ß/g, 'ss')
  .replace(/[^a-zäöü\s]/g, ' ')
  .replace(/\s+/g, ' ').trim();
// «свободная» форма: снимает разницу орфографии эпохи (Thal/Tal, seyn/sein, Cocytus/Kozytus, удвоения)
const loose = (s) => norm(s)
  .replace(/th/g, 't').replace(/ey/g, 'ei').replace(/c/g, 'k').replace(/z/g, 's')
  .replace(/([a-zäöü])\1/g, '$1')
  .replace(/\s+/g, ' ').trim();
// строка песни часто повторяет фразу (шубертовские повторы), а в стихах она одна: сворачиваем повторы
const dedup = (n) => { const w = n.split(' '); for (let len = 1; len <= Math.floor(w.length / 2); len++) { const head = w.slice(0, len).join(' '); let i = len, ok = true; while (i < w.length) { if (w.slice(i, i + len).join(' ') !== head) { ok = false; break; } i += len; } if (ok && i === w.length) return head; } return n; };

const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/index.json'), 'utf8'));
const songs = index.filter((e) => e.ready && e.file && (!only || String(e.d) === String(only)));

const srcDirs = fs.existsSync(WAVES) ? fs.readdirSync(WAVES).map((w) => path.join(WAVES, w, 'prefetch')).filter((p) => fs.existsSync(p)) : [];
const findSources = (slug) => {
  const out = [];
  for (const dir of srcDirs) {
    const d = path.join(dir, slug);
    if (!fs.existsSync(d)) continue;
    for (const f of ['schubertsong.uk.txt', 'schubertlied.de.txt']) {
      const p = path.join(d, f);
      if (fs.existsSync(p)) out.push({ name: f.replace('.txt', ''), text: fs.readFileSync(p, 'utf8') });
    }
  }
  return out;
};

let checked = 0, noSource = [], songsWithDiff = 0, totalDiff = 0;
const report = [];
for (const e of songs) {
  const slug = e.file.replace('.json', '');
  const sources = findSources(slug);
  if (!sources.length) { noSource.push(e.d); continue; }
  const song = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/songs', e.file), 'utf8'));
  const haystacks = sources.map((s) => ({ name: s.name, norm: norm(s.text), loose: loose(s.text), lines: s.text.split('\n').map((l) => l.trim()).filter((l) => l.length > 6) }));
  const diffs = [];
  let li = 0;
  (song.stanzas || []).forEach((st, si) => (st.lines_de || []).forEach((line, k) => {
    li++;
    const n = norm(line);
    if (n.split(' ').length < 2) return; // однословные строки не проверяем: слишком много ложных совпадений
    if (haystacks.some((h) => h.norm.includes(n))) return;                       // совпало дословно
    const nd = dedup(n);
    if (haystacks.some((h) => h.norm.includes(nd))) return;                      // отличие только в шубертовских повторах
    const l = loose(line), ld = dedup(l);
    if (haystacks.some((h) => h.loose.includes(l) || h.loose.includes(ld))) return; // отличие только в орфографии эпохи
    // ближайшая строка источника по доле общих слов
    const words = new Set(n.split(' '));
    let best = null, bestScore = 0;
    for (const h of haystacks) for (const cand of h.lines) {
      const cn = norm(cand); if (!cn) continue;
      const cw = cn.split(' ');
      const common = cw.filter((w) => words.has(w)).length;
      const score = common / Math.max(words.size, cw.length);
      if (score > bestScore) { bestScore = score; best = { src: h.name, line: cand.trim() }; }
    }
    if (bestScore >= 0.5) {
      // словесная разница: что стоит в проекте против источника (по свободной форме, чтобы не ловить орфографию)
      const pw = norm(line).split(' '), sw = norm(best.line).split(' ');
      const lpJoin = loose(line).replace(/\s+/g, ''), lsJoin = loose(best.line).replace(/\s+/g, '');
      const inSource = (w) => { const lw = loose(w); return !lw || lsJoin.includes(lw); };
      const inProject = (w) => { const lw = loose(w); return !lw || lpJoin.includes(lw); };
      const onlyProject = pw.filter((w) => !inSource(w)), onlySource = sw.filter((w) => !inProject(w));
      if (!onlyProject.length && !onlySource.length) return;                     // разница только в порядке/повторах
      diffs.push({ addr: `${si + 1}.${k + 1}`, src: best.src, onlyProject, onlySource, score: bestScore });
    }
    else if (full) diffs.push({ addr: `${si + 1}.${k + 1}`, src: '—', onlyProject: ['(похожей строки в источнике не найдено)'], onlySource: [] });
  }));
  checked++;
  if (diffs.length) {
    songsWithDiff++; totalDiff += diffs.length;
    report.push(`\n### D ${e.d} «${e.title_de}» — расхождений ${diffs.length} (источники: ${sources.map((s) => s.name).join(', ')})`);
    for (const d of diffs) report.push(`  ${d.addr}  в проекте: ${d.onlyProject.join(' / ') || '—'}   |   в источнике (${d.src}): ${d.onlySource.join(' / ') || '—'}`);
  }
}
console.log(report.join('\n'));
console.log(`\nИТОГО: проверено песен ${checked}, с расхождениями ${songsWithDiff}, строк-расхождений ${totalDiff}; без предзагруженного источника ${noSource.length}${noSource.length ? ' (D ' + noSource.join(', ') + ')' : ''}`);
