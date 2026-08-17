#!/usr/bin/env node
// Рабочий пакет песни для конвейера перевода (0 токенов).
// Запуск: node planning/scripts/prepare-song.js <d-номер, напр. 547 или 795/1>
// Выводит JSON: метаданные, текст, покрытие словарным кэшем, непокрытые знаменательные слова.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

const dArg = process.argv[2];
if (!dArg) { console.error('usage: prepare-song.js <d>'); process.exit(1); }
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/index.json'), 'utf8'));
const entry = index.find((e) => String(e.d) === String(dArg));
if (!entry || !entry.file) { console.error('песня не найдена или без файла: ' + dArg); process.exit(1); }
const song = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/songs', entry.file), 'utf8'));

// словарный кэш
const entriesDir = path.join(ROOT, 'planning/dictionary/entries');
const cache = new Map();
for (const f of fs.readdirSync(entriesDir)) {
  const e = JSON.parse(fs.readFileSync(path.join(entriesDir, f), 'utf8'));
  cache.set(e.lemma, e);
}

// стоп-слова (служебные: ведёт свод правил, записи не нужны)
const STOP = new Set(('und der die das des dem den ein eine einer eines einem einen ich du er sie es wir ihr mich dich sich mir dir ihm ihn uns euch in an auf aus bei mit nach von vor zu zum zur über unter um durch für ohne gegen ist sind war waren bin bist seid hat hab habe hast haben hatte hatten wird werden ward wie so da dass daß wenn als auch nur noch schon doch denn nun wohl je nicht kein nie o ach ja nein mein dein sein ihr unser euer was wer wo wann warum hier dort dann und­').split(/\s+/));

const forms = new Map();
for (const st of song.stanzas || []) for (const line of st.lines_de || []) {
  if (/[а-яё\[]/i.test(line)) continue;
  for (let w of line.split(/[\s—–]+/)) {
    w = w.replace(/[.,!?;:()«»„“"…]+/g, '').replace(/^[\x27’]+|[\x27’]+$/g, '');
    if (!w || /^\d+$/.test(w)) continue;
    const k = w.toLowerCase();
    forms.set(k, (forms.get(k) || 0) + 1);
  }
}

// наивная приводка формы к лемме кэша: точное совпадение либо усечение типичных окончаний
const guessLemma = (form) => {
  if (cache.has(form)) return form;
  const tails = ['est', 'en', 'st', 'et', 'em', 'er', 'es', 'e', 'n', 't', 's'];
  for (const t of tails) {
    if (form.length - t.length >= 3 && form.endsWith(t)) {
      const base = form.slice(0, -t.length);
      for (const cand of [base, base + 'en', base + 'e', base + 'n']) if (cache.has(cand)) return cand;
    }
  }
  return null;
};

const covered = [], uncovered = [];
for (const [form, count] of [...forms.entries()].sort((a, b) => b[1] - a[1])) {
  if (STOP.has(form)) continue;
  const lemma = guessLemma(form);
  if (lemma) covered.push({ form, count, lemma });
  else uncovered.push({ form, count });
}

const out = {
  d: entry.d, file: entry.file, title_de: entry.title_de, section: entry.section,
  poet: song.poet_de || entry.poet_de || null, year: entry.year || song.year || null,
  stanzas: (song.stanzas || []).map((s) => s.lines_de),
  wordStats: { totalForms: forms.size, covered: covered.length, uncovered: uncovered.length },
  covered, uncovered,
  cacheEntriesForPrompt: covered.map((c) => cache.get(c.lemma)),
};
console.log(JSON.stringify(out, null, 1));
