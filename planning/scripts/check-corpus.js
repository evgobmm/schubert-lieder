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
      if (segs.length && segs[0].ru && !/^[А-ЯЁA-ZÄÖÜ«»("—O0-9]/.test(segs[0].ru)) add('WARN', `${entry.file} ${si}:${li}`, 'первый сегмент строки не с заглавной: ' + segs[0].ru);
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

// ---------- итог ----------
const errs = findings.filter((f) => f.level === 'ERROR');
const warns = findings.filter((f) => f.level === 'WARN');
console.log(`Проверено песен: ${index.filter((e) => e.file).length}; performances: ${Object.keys(perf).length} песен / ${Object.values(perf).reduce((a, b) => a + b.length, 0)} видео`);
console.log(`ERROR: ${errs.length}, WARN: ${warns.length}`);
for (const f of errs) console.log(`[ERROR] ${f.where}: ${f.what}`);
const byKind = {};
for (const f of warns) { const k = f.what.split(':')[0].slice(0, 45); byKind[k] = (byKind[k] || 0) + 1; }
console.log('WARN по типам:', JSON.stringify(byKind, null, 1));
if (process.argv.includes('--warns')) for (const f of warns) console.log(`[WARN] ${f.where}: ${f.what}`);
process.exit(errs.length ? 1 : 0);
