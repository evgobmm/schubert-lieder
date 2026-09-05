#!/usr/bin/env node
// Контроль реестра источников (0 токенов): домены, цитируемые в файлах фактов и досье,
// должны упоминаться в docs/rules/acknowledgements.md (сам домен или его запись).
// Запуск: node planning/scripts/check-acknowledgements.js ; код 1 — есть невнесённые домены.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

const ack = fs.readFileSync(path.join(ROOT, 'docs/rules/acknowledgements.md'), 'utf8').toLowerCase();

// домены, которые не считаем источниками (инфраструктура, агрегаторы ссылок)
const IGNORE = new Set(['github.com', 'github.io', 'google.com', 'youtube.com', 'youtu.be',
  // поисковики: через них ИЩУТ источник, сами источником не бывают (в файлах фактов они
  // появляются в примечаниях о безрезультатных сетевых попытках) — как и google.com выше
  'duckduckgo.com', 'html.duckduckgo.com', 'lite.duckduckgo.com', 'bing.com',
  'web.archive.org', 'doi.org', 'books.google.com', 'api.digitale-sammlungen.de']);
// алиасы: поддомен → запись в реестре
const ALIAS = {
  'de.wikipedia.org': 'wikipedia', 'en.wikipedia.org': 'wikipedia', 'ru.wikipedia.org': 'wikipedia', 'hu.wikipedia.org': 'wikipedia', 'fr.wikipedia.org': 'wikipedia', 'it.wikipedia.org': 'wikipedia',
  'books.google.at': 'books.google', 'books.google.de': 'books.google',
  'de.wikisource.org': 'wikisource', 'ru.wikisource.org': 'wikisource', 'en.wikisource.org': 'wikisource',
  'translate.academic.ru': 'academic.ru', 'dic.academic.ru': 'academic.ru',
  'www.dwds.de': 'dwds.de', 'open.edu': 'openlearn', 'onb.digital': 'onb',
  'geschichtewiki.wien.gv.at': 'geschichtewiki', 'michaelorenz.blogspot.com': 'michaelorenz',
};

const files = [];
const rdir = path.join(ROOT, 'planning/research');
for (const f of fs.readdirSync(rdir)) if (f.endsWith('-facts.md')) files.push(path.join(rdir, f));
const pdir = path.join(rdir, 'poets');
if (fs.existsSync(pdir)) for (const f of fs.readdirSync(pdir)) files.push(path.join(pdir, f));

const missing = new Map();
for (const file of files) {
  const t = fs.readFileSync(file, 'utf8');
  const domains = new Set((t.match(/https?:\/\/[a-zA-Z0-9.-]+/g) || [])
    .map((u) => u.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase()));
  for (const d of domains) {
    if (IGNORE.has(d)) continue;
    const key = ALIAS[d] || d;
    // домен внесён, если реестр содержит его сам, без www, или его алиас
    if (ack.includes(key) || ack.includes(d) || ack.includes(d.replace(/^[a-z0-9-]+\./, ''))) continue;
    if (!missing.has(d)) missing.set(d, []);
    missing.get(d).push(path.basename(file));
  }
}
if (missing.size) {
  console.log('НЕ ВНЕСЕНЫ в acknowledgements.md:');
  for (const [d, where] of missing) console.log(` - ${d} (${[...new Set(where)].slice(0, 4).join(', ')})`);
  process.exit(1);
}
console.log('Реестр источников полон: все домены файлов фактов и досье учтены (' + files.length + ' файлов).');
