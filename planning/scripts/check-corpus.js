#!/usr/bin/env node
// Механический валидатор корпуса (0 токенов): структура песенных JSON, типографика,
// покрытие подстрочника, performances.json. Запуск: node planning/scripts/check-corpus.js
// Выход: отчёт в stdout; код 1 при находках уровня ERROR.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SONGS = path.join(ROOT, 'app', 'src', 'data', 'songs');
const findings = []; // {level: ERROR|WARN, where, what}
const add = (level, where, what) => findings.push({ level, where, what });

const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/index.json'), 'utf8'));
const perf = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/performances.json'), 'utf8'));

// ---------- песенные файлы ----------
const tokenize = (s) => (s.match(/[A-Za-zÄÖÜäöüß']+/g) || []).map((w) => w.toLowerCase());
const YO_SUSPECTS = /(^|[^а-яё])(еще|идет|поет|зовет|найдет|весел|тяжел[^а-яё]|легок|словом словно)([^а-яё]|$)/;

for (const entry of index) {
  if (!entry.file) continue;
  const p = path.join(SONGS, entry.file);
  let song;
  try { song = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { add('ERROR', entry.file, 'JSON не читается: ' + e.message); continue; }
  const texts = []; // все прозаические тексты
  (song.title_annotations || []).forEach((a, i) => texts.push([`title_ann[${i}]`, a.text]));
  if (song.about) song.about.forEach((s, i) => { texts.push([`about[${i}] «${s.title}»`, s.text]); if (!s.title || !s.text) add('ERROR', `${entry.file} about[${i}]`, 'пустой title/text'); });

  (song.stanzas || []).forEach((st, si) => {
    const lde = st.lines_de || [];
    const lru = st.lines_ru || [];
    if (!song.text_only && lde.length !== lru.length) add('ERROR', `${entry.file} строфа ${si}`, `lines_de(${lde.length}) != lines_ru(${lru.length})`);
    lde.forEach((line, li) => {
      if (/\n/.test(line)) add('ERROR', `${entry.file} ${si}:${li}`, 'перенос строки внутри строки DE');
      if (/^\s|\s$/.test(line)) add('WARN', `${entry.file} ${si}:${li}`, 'пробел по краю строки DE');
      if (line && !/^\[/.test(line) && !/^[«"(„“‚»]*[A-ZÄÖÜ]/.test(line)) add('WARN', `${entry.file} ${si}:${li}`, 'строка DE не с заглавной: ' + line.slice(0, 30));
    });
    lru.forEach((lineRu, li) => {
      const segs = lineRu.segments || [];
      // покрытие: мультимножество слов строки DE ⊆ словам сегментов de (рамочные многоточия игнорируем)
      // покрытие проверяем на уровне строфы (рамки законно переносят слово в соседнюю строку)
      if (li === 0 && lde.length && lru.length && lru.some((r) => (r.segments || []).length)) {
        const stanzaWords = tokenize(lde.join(' '));
        const segAll = [];
        lru.forEach((r) => (r.segments || []).forEach((s) => { segAll.push((s.de || '').replace(/\.\.\./g, ' ')); if (s.variant_de) segAll.push(s.variant_de); }));
        const bag = new Map(); tokenize(segAll.join(' ')).forEach((w) => bag.set(w, (bag.get(w) || 0) + 1));
        const missing = [];
        for (const w of stanzaWords) { if (!bag.get(w)) missing.push(w); else bag.set(w, bag.get(w) - 1); }
        if (missing.length) {
          const isRef = /^d911-/.test(entry.file); // авторский импорт Winterreise — не наша зона
          add(isRef ? 'WARN' : 'ERROR', `${entry.file} строфа ${si}`, 'слова DE не покрыты сегментами: ' + missing.join(', '));
        }
      }
      // сегменты
      segs.forEach((s, k) => {
        if (s.ru === '' && s.de === '') add('ERROR', `${entry.file} ${si}:${li} seg${k}`, 'пустые ru и de');
        if (/[«»]/.test(s.de || '')) add('WARN', `${entry.file} ${si}:${li} seg${k}`, 'кавычки в de');
      });
      if (segs.length && segs[0].ru && !/^[А-ЯЁA-ZÄÖÜ«»„("—O0-9[]/.test(segs[0].ru)) add('WARN', `${entry.file} ${si}:${li}`, 'первый сегмент строки не с заглавной: ' + segs[0].ru);
      (lineRu.annotations || []).forEach((a, ai) => {
        texts.push([`${entry.file} ${si}:${li} ann${ai}`, a.text]);
        const flat = (r) => (Array.isArray(r[0]) ? r : [r]);
        if (a.segment_range) for (const [s1, e1] of flat(a.segment_range)) {
          if (s1 < 0 || e1 >= segs.length || s1 > e1) add('ERROR', `${entry.file} ${si}:${li} ann${ai}`, `segment_range [${s1},${e1}] вне сегментов (0..${segs.length - 1})`);
        }
        if (a.type && !['lang', 'meaning'].includes(a.type)) add('ERROR', `${entry.file} ${si}:${li} ann${ai}`, 'неизвестный type ' + a.type);
      });
    });
  });

  // прозаические тексты: типографика
  for (const [where, t] of texts) {
    if (t == null) { add('ERROR', where, 'null-текст'); continue; }
    if (/\n\n/.test(t)) add('ERROR', where, 'двойной \\n');
    if (/"[А-Яа-яЁё]/.test(t) || /[А-Яа-яЁё]"/.test(t)) add('ERROR', where, 'ASCII-кавычки при кириллице');
    if (/[а-яё] - [а-яё]/.test(t)) add('ERROR', where, 'короткий дефис вместо тире');
    if (YO_SUSPECTS.test(t)) add('WARN', where, 'возможное е вместо ё: ' + t.match(YO_SUSPECTS)[2]);
    // немецкий фрагмент без перевода рядом (грубая эвристика: латинское слово длиной >3, в тексте нет «(» на расстоянии 80 символов после него)
    const m = t.match(/[A-ZÄÖÜ][a-zäöüß]{3,}(?:[ '!,.]+[A-Za-zäöüß']+){0,8}/g);
    if (m) for (const frag of m) {
      const known = ['Wiener Zeitung', 'Der Sammler', 'Topic'];
      if (known.some((k) => frag.startsWith(k))) continue;
      const pos = t.indexOf(frag);
      const ctx = t.slice(Math.max(0, pos - 90), pos + frag.length + 90);
      if (!/[(«]/.test(ctx)) add('WARN', where, 'немецкое без перевода рядом? ' + frag.slice(0, 40));
    }
  }
}

// ---------- performances.json ----------
const indexByD = new Map(index.map((e) => [String(e.d), e]));
const seenGlobal = new Map();
for (const [d, arr] of Object.entries(perf)) {
  if (!indexByD.has(String(d))) add('ERROR', `performances[${d}]`, 'D-номера нет в index.json');
  if (!Array.isArray(arr) || arr.length === 0) { add('ERROR', `performances[${d}]`, 'пустой список'); continue; }
  if (arr.length > 5) add('ERROR', `performances[${d}]`, `записей ${arr.length} > 5`);
  const seen = new Set();
  arr.forEach((v, i) => {
    if (!v.videoId || !/^[A-Za-z0-9_-]{11}$/.test(v.videoId)) add('ERROR', `performances[${d}][${i}]`, 'кривой videoId: ' + v.videoId);
    if (!v.name) add('ERROR', `performances[${d}][${i}]`, 'нет name');
    if (!(typeof v.year === 'number' || /^\d{4}([–-]\d{2,4})?\??$/.test(String(v.year)))) add('ERROR', `performances[${d}][${i}]`, 'кривой year: ' + v.year);
    if (seen.has(v.videoId)) add('ERROR', `performances[${d}]`, 'дубль videoId внутри песни: ' + v.videoId);
    seen.add(v.videoId);
    const g = seenGlobal.get(v.videoId);
    if (g && g !== d) add('WARN', `performances[${d}][${i}]`, `videoId ${v.videoId} также у d${g} (полный альбом? проверить)`);
    seenGlobal.set(v.videoId, d);
  });
}
for (const e of index) {
  if (e.file || e.text) {
    if (!perf[String(e.d)]) add('WARN', `index d${e.d}`, 'песня опубликована, но записей нет');
  }
}

// приоритетная иерархия (Квастхоф №1, затем Фишер-Дискау), кроме утверждённого пользователем Winterreise
for (const [d, arr] of Object.entries(perf)) {
  if (/^911\//.test(d)) continue; // авторский порядок референса
  const qi = arr.findIndex((v) => /Quasthoff/i.test(v.name));
  const fi = arr.findIndex((v) => /Fischer-Dieskau/i.test(v.name));
  if (qi > 0) add('WARN', `performances[${d}]`, 'Quasthoff не на позиции 0: ' + qi);
  if (fi >= 0 && fi > (qi >= 0 ? 1 : 0)) add('WARN', `performances[${d}]`, 'Fischer-Dieskau ниже ожидаемой позиции: ' + fi);
}

// ---------- согласованность индекса, разделов и файлов песен (2026-09-10) ----------
const sections = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/sections.json'), 'utf8'));
const secById = new Map(sections.map((s) => [s.id, s]));
const secRange = (title) => { const m = String(title).match(/(1[78]\d\d)(?:[–-](1[78]\d\d|\d\d))?/); if (!m) return null; const a = +m[1]; const b = m[2] ? (m[2].length === 2 ? +(m[1].slice(0, 2) + m[2]) : +m[2]) : a; return [a, b]; };
const songByD = new Map();
const poetForms = new Map();
for (const e of index) {
  if (!e.file) continue;
  const song = JSON.parse(fs.readFileSync(path.join(SONGS, e.file), 'utf8'));
  songByD.set(String(e.d), song);
  for (const k of ['title_de', 'title_ru', 'poet_de', 'poet_ru', 'year']) {
    if (String(e[k] ?? '') !== String(song[k] ?? '')) add('ERROR', `index d${e.d}`, `${k} расходится с файлом песни: индекс «${e[k]}», файл «${song[k]}»`);
  }
  const r = secRange((secById.get(e.section) || {}).title);
  const y = String(e.year).match(/(1[78]\d\d)(?:–(\d\d|1[78]\d\d))?/);
  if (r && y) { const y1 = +y[1]; const y2 = y[2] ? (y[2].length === 2 ? +(y[1].slice(0, 2) + y[2]) : +y[2]) : y1; if (y2 < r[0] || y1 > r[1]) add('ERROR', `index d${e.d}`, `год «${e.year}» вне раздела «${secById.get(e.section).title}»`); }
  if (song.poet_de) { if (!poetForms.has(song.poet_de)) poetForms.set(song.poet_de, new Map()); const m = poetForms.get(song.poet_de); m.set(song.poet_ru || '', (m.get(song.poet_ru || '') || 0) + 1); }
}
for (const [de, forms] of poetForms) if (forms.size > 1) add('WARN', `poet «${de}»`, 'русское имя пишется по-разному: ' + [...forms.keys()].join(' | '));
if (sections.reduce((n, s) => n + s.count, 0) !== index.length) add('ERROR', 'sections.json', 'сумма count разделов не равна числу песен индекса');

// ---------- тайминги: ссылки маршрутов, число слов, варианты (2026-09-10) ----------
const TIMINGS = path.join(ROOT, 'app/src/data/timings');
const nTok = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
let timingFiles = 0;
for (const f of fs.readdirSync(TIMINGS)) {
  if (!f.endsWith('.json')) continue;
  timingFiles++;
  let t;
  try { t = JSON.parse(fs.readFileSync(path.join(TIMINGS, f), 'utf8')); } catch (e) { add('ERROR', `timings/${f}`, 'невалидный JSON'); continue; }
  const song = songByD.get(String(t.d));
  if (!song) { add('ERROR', `timings/${f}`, `нет песни d${t.d}`); continue; }
  const extra = new Set((t.extra_lines || []).map((x) => x.id));
  const perLine = new Map();
  t.route.forEach((r, i) => {
    if (r.x) { if (!extra.has(r.x)) add('ERROR', `timings/${f} #${i}`, `ссылка на несуществующую extra_line ${r.x}`); return; }
    const line = song.stanzas[r.s] && song.stanzas[r.s].lines_de[r.l];
    if (line === undefined) { add('ERROR', `timings/${f} #${i}`, `маршрут ссылается на строку ${r.s}:${r.l}, которой нет`); return; }
    if (r.w.length !== nTok(line)) add('ERROR', `timings/${f} #${i}`, `слов в строке ${r.s}:${r.l}: ${nTok(line)}, интервалов: ${r.w.length}`);
    for (const w of r.w) if (w !== null && (!Array.isArray(w) || w.length !== 2 || !(w[0] >= 0) || !(w[1] >= w[0]))) add('ERROR', `timings/${f} #${i}`, 'битый интервал ' + JSON.stringify(w));
  });
  for (const v of t.variants || []) {
    const line = song.stanzas[v.s] && song.stanzas[v.s].lines_de[v.l];
    const words = line ? line.split(/\s+/).filter(Boolean) : [];
    if (!words[v.k]) { add('ERROR', `timings/${f}`, `variant ${v.s}:${v.l}#${v.k} вне строки`); continue; }
    const key = `${v.s}:${v.l}`; perLine.set(key, (perLine.get(key) || 0) + 1);
    if (words[v.k].toLowerCase().replace(/[^a-zäöüß']/g, '') !== String(v.w).toLowerCase().replace(/[^a-zäöüß']/g, '')) add('WARN', `timings/${f}`, `variant ${key}#${v.k}: в тексте «${words[v.k]}», в записи варианта «${v.w}»`);
  }
  for (const [key, n] of perLine) if (n >= 2) add('WARN', `timings/${f}`, `в строке ${key} ${n} подмены — похоже на ошибку выравнивания, а не исполнение`);
}

// ---------- итог ----------
const errs = findings.filter((f) => f.level === 'ERROR');
const warns = findings.filter((f) => f.level === 'WARN');
console.log(`Проверено песен: ${index.filter((e) => e.file).length}; таймингов: ${timingFiles}; performances: ${Object.keys(perf).length} песен / ${Object.values(perf).reduce((a, b) => a + b.length, 0)} видео`);
console.log(`ERROR: ${errs.length}, WARN: ${warns.length}`);
for (const f of errs) console.log(`[ERROR] ${f.where}: ${f.what}`);
const byKind = {};
for (const f of warns) { const k = f.what.split(':')[0].slice(0, 45); byKind[k] = (byKind[k] || 0) + 1; }
console.log('WARN по типам:', JSON.stringify(byKind, null, 1));
if (process.argv.includes('--warns')) for (const f of warns) console.log(`[WARN] ${f.where}: ${f.what}`);
process.exit(errs.length ? 1 : 0);
