#!/usr/bin/env node
// Автономный валидатор ОДНОГО файла-кандидата песни (до публикации в app/).
// Запуск: node planning/scripts/check-song-file.js <путь-к-json>
// Те же проверки, что в check-corpus.js для песенного файла: структура, покрытие
// подстрочника (уровень строфы), диапазоны аннотаций, типографика. Код 1 при ERROR.
const fs = require('fs');

const p = process.argv[2];
if (!p) { console.error('usage: check-song-file.js <file.json>'); process.exit(2); }
const findings = [];
const add = (level, where, what) => findings.push({ level, where, what });
let song;
try { song = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { console.log('[ERROR] JSON не читается: ' + e.message); process.exit(1); }

const tokenize = (s) => (s.match(/[A-Za-zÄÖÜäöüß']+/g) || []).map((w) => w.toLowerCase());
const YO_SUSPECTS = /(^|[^а-яё])(еще|идет|поет|зовет|найдет|весел|тяжел[^а-яё]|легок)([^а-яё]|$)/;

for (const k of ['d', 'title_de', 'title_ru', 'poet_de', 'poet_ru', 'year', 'stanzas', 'about']) {
  if (song[k] == null) add(k === 'about' || k === 'title_ru' ? 'WARN' : 'ERROR', 'top', 'нет поля ' + k);
}
const texts = [];
(song.title_annotations || []).forEach((a, i) => texts.push([`title_ann[${i}]`, a.text]));
(song.about || []).forEach((s, i) => { texts.push([`about[${i}] «${s.title}»`, s.text]); if (!s.title || !s.text) add('ERROR', `about[${i}]`, 'пустой title/text'); });

(song.stanzas || []).forEach((st, si) => {
  const lde = st.lines_de || [];
  const lru = st.lines_ru || [];
  if (lde.length !== lru.length) add('ERROR', `строфа ${si}`, `lines_de(${lde.length}) != lines_ru(${lru.length})`);
  lde.forEach((line, li) => {
    if (/\n/.test(line)) add('ERROR', `${si}:${li}`, 'перенос строки внутри строки DE');
    if (/^\s*\d+[.)]?\s*$/.test(line)) add('ERROR', `${si}:${li}`, 'строка DE состоит только из числа — артефакт импорта (нумерация строк источника)');
    if (line && !/^\[/.test(line) && !/^[«"(„“‚»]*[A-ZÄÖÜ]/.test(line)) add('WARN', `${si}:${li}`, 'строка DE не с заглавной: ' + line.slice(0, 30));
  });
  lru.forEach((lineRu, li) => {
    const segs = lineRu.segments || [];
    if (li === 0 && lde.length && lru.length && lru.some((r) => (r.segments || []).length)) {
      const stanzaWords = tokenize(lde.join(' '));
      const segAll = [];
      lru.forEach((r) => (r.segments || []).forEach((s) => { segAll.push((s.de || '').replace(/\.\.\./g, ' ')); if (s.variant_de) segAll.push(s.variant_de); }));
      const bag = new Map(); tokenize(segAll.join(' ')).forEach((w) => bag.set(w, (bag.get(w) || 0) + 1));
      const missing = [];
      for (const w of stanzaWords) { if (!bag.get(w)) missing.push(w); else bag.set(w, bag.get(w) - 1); }
      if (missing.length) add('ERROR', `строфа ${si}`, 'слова DE не покрыты сегментами: ' + missing.join(', '));
    }
    segs.forEach((s, k) => {
      if ((s.ru || '') === '' && (s.de || '') === '') add('ERROR', `${si}:${li} seg${k}`, 'пустые ru и de');
      if (/[«»]/.test(s.de || '')) add('WARN', `${si}:${li} seg${k}`, 'кавычки в de');
    });
    if (segs.length && segs[0].ru && !/^[А-ЯЁA-ZÄÖÜ«»("—O0-9]/.test(segs[0].ru)) add('WARN', `${si}:${li}`, 'первый сегмент строки не с заглавной: ' + segs[0].ru);
    (lineRu.annotations || []).forEach((a, ai) => {
      texts.push([`${si}:${li} ann${ai}`, a.text]);
      const flat = (r) => (Array.isArray(r[0]) ? r : [r]);
      if (a.segment_range) for (const [s1, e1] of flat(a.segment_range)) {
        if (s1 < 0 || e1 >= segs.length || s1 > e1) add('ERROR', `${si}:${li} ann${ai}`, `segment_range [${s1},${e1}] вне сегментов (0..${segs.length - 1})`);
      }
      if (a.line_span != null) {
        if (!(a.line_span >= 2) || li + a.line_span > lru.length) add('ERROR', `${si}:${li} ann${ai}`, `line_span ${a.line_span} выходит за строфу`);
        const cont = a.continuation_ranges || [];
        if (cont.length !== a.line_span - 1) add('ERROR', `${si}:${li} ann${ai}`, `continuation_ranges(${cont.length}) != line_span-1`);
        cont.forEach((r, ci) => {
          const target = lru[li + 1 + ci];
          if (!target) return;
          const n = (target.segments || []).length;
          if (!(r[0] === -1 && r[1] === -1) && (r[0] < 0 || r[1] >= n || r[0] > r[1])) add('ERROR', `${si}:${li} ann${ai}`, `continuation_ranges[${ci}] [${r}] вне сегментов строки ${li + 1 + ci} (0..${n - 1})`);
        });
      }
      if (a.type && !['lang', 'meaning'].includes(a.type)) add('ERROR', `${si}:${li} ann${ai}`, 'неизвестный type ' + a.type);
    });
    // одно слово — одна ВИДИМАЯ сноска: значок рисуется на последнем сегменте диапазона
    // (логика InterlinearLine.vue); совпадение позиций значков — ERROR, вложенные диапазоны законны
    {
      const flat = (r) => (Array.isArray(r[0]) ? r : [r]);
      const marks = {};
      (lineRu.annotations || []).forEach((a, ai) => {
        if (!a.segment_range || (a.line_span && a.line_span > 1)) return;
        const f = flat(a.segment_range);
        const e = f[f.length - 1][1];
        (marks[e] = marks[e] || []).push(ai);
      });
      for (const [e, list] of Object.entries(marks)) if (list.length > 1)
        add('ERROR', `${si}:${li}`, `две видимых сноски на сегменте ${e}: ann ${list.join(', ')}`);
    }
  });
});

// заголовок: максимум одна титульная аннотация (значок рисуется на каждую)
if ((song.title_annotations || []).length > 1) add('ERROR', 'title', 'титульных аннотаций ' + song.title_annotations.length + ' — на заголовке столько же значков (норма референса: максимум одна)');
// спан-аннотации: значок наследуется последней строкой охвата и затеняет значок её собственной аннотации
{
  const lastEndR = (r) => { const f = Array.isArray(r[0]) ? r : [r]; return f[f.length - 1][1]; };
  const stz = song.stanzas || [];
  stz.forEach((st, si) => (st.lines_ru || []).forEach((l, li) => (l.annotations || []).forEach((a, ai) => {
    if (!(a.line_span > 1)) return;
    let fs2 = si, fl = li + a.line_span - 1;
    while (fs2 < stz.length && fl >= (stz[fs2].lines_ru || []).length) { fl -= stz[fs2].lines_ru.length; fs2++; }
    const target = stz[fs2] && stz[fs2].lines_ru[fl];
    if (!target) return;
    const cont = (a.continuation_ranges || []).filter((x) => x !== null && x[0] !== -1);
    const seg = cont.length ? lastEndR(cont[cont.length - 1]) : ((target.segments || []).length - 1);
    (target.annotations || []).forEach((b, bi) => {
      if (!b.segment_range || (b.line_span && b.line_span > 1)) return;
      if (lastEndR(b.segment_range) === seg) add('ERROR', `${fs2}:${fl}`, `значок спан-аннотации ${si}:${li}#${ai} затеняет значок ann${bi} на сегменте ${seg}`);
    });
  })));
}

for (const [where, t] of texts) {
  if (t == null) { add('ERROR', where, 'null-текст'); continue; }
  if (/\n\n/.test(t)) add('ERROR', where, 'двойной \\n');
  if (/"[А-Яа-яЁё]/.test(t) || /[А-Яа-яЁё]"/.test(t)) add('ERROR', where, 'ASCII-кавычки при кириллице');
  if (/[а-яё] - [а-яё]/.test(t)) add('ERROR', where, 'короткий дефис вместо тире');
  if (YO_SUSPECTS.test(t)) add('WARN', where, 'возможное е вместо ё: ' + t.match(YO_SUSPECTS)[2]);
  const m = t.match(/[A-ZÄÖÜ][a-zäöüß]{3,}(?:[ '!,.]+[A-Za-zäöüß']+){0,8}/g);
  if (m) for (const frag of m) {
    const pos = t.indexOf(frag);
    const ctx = t.slice(Math.max(0, pos - 90), pos + frag.length + 90);
    if (!/[(«]/.test(ctx)) add('WARN', where, 'немецкое без перевода рядом? ' + frag.slice(0, 40));
  }
}

const errs = findings.filter((f) => f.level === 'ERROR');
const warns = findings.filter((f) => f.level === 'WARN');
console.log(`ERROR: ${errs.length}, WARN: ${warns.length}`);
for (const f of errs) console.log(`[ERROR] ${f.where}: ${f.what}`);
for (const f of warns) console.log(`[WARN] ${f.where}: ${f.what}`);
process.exit(errs.length ? 1 : 0);
