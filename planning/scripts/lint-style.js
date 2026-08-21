#!/usr/bin/env node
// Механический линт ИИ-артефактов и запрещённых оборотов (style.md) по текстам страниц (0 токенов).
// Запуск: node planning/scripts/lint-style.js [файл.json ...]  (без аргументов — весь корпус кроме d911)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const PATTERNS = [
  ['не X, а Y', /(?:^|[^а-яё])не\s+(?!так[^а-яё]|то[^а-яё]|только|столько)[^.;:!?]{1,45}?,\s+а\s+(?!то[^а-яё]|также|значит)/i],
  ['«работает/работают» о словах', /(?:^|[^а-яё])работа(?:ет|ют)(?![а-яё])/i],
  ['не просто', /(?:^|[^а-яё])не просто(?![а-яё])/i],
  ['стоит отметить / важно понимать', /(?:стоит отметить|важно понимать|стоит заметить|нельзя не отметить)/i],
  ['связки-канцелярит', /(?:кроме того|более того|таким образом|в свою очередь|тем не менее)/i],
  ['канцелярит', /(?:^|[^а-яё])(?:является|являются|данн(?:ый|ая|ое|ые|ого|ой)(?![а-яё])|в рамках|осуществля)/i],
  ['раздувание', /(?:^|[^а-яё])(?:ключев|уникальн|поистине|подлинн(?:ый|ая|ое) шедевр)/i],
  ['штамп-метафора', /(?:^|[^а-яё])(?:палитр|мозаик|калейдоскоп|квинтэссенци)/i],
  ['жаргон/запрещённые слова', /(?:^|[^а-яё])(?:извод|сетев(?:ой|ом|ого|ая|ую|ые)|подвох|сеттинг|вертонизац)/i],
  ['Шуберт поёт', /Шуберт\s+поёт|поёт\s+(?:и\s+)?Шуберт/i],
  ['тире-каскад (3+ в фразе)', /[^.!?]*—[^.!?—]*—[^.!?—]*—/],
];
const files = process.argv.slice(2).length ? process.argv.slice(2)
  : fs.readdirSync(path.join(ROOT, 'app/src/data/songs')).filter((f) => !f.startsWith('d911-')).map((f) => path.join(ROOT, 'app/src/data/songs', f));
let total = 0;
for (const f of files) {
  const s = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (s.text_only) continue;
  const texts = [];
  (s.title_annotations || []).forEach((a, i) => texts.push([`title#${i}`, a.text]));
  (s.about || []).forEach((x, i) => texts.push([`about[${i}] ${x.title}`, x.text]));
  (s.stanzas || []).forEach((st, si) => (st.lines_ru || []).forEach((l, li) => (l.annotations || []).forEach((a, ai) => texts.push([`${si}:${li}#${ai}`, a.text]))));
  const hits = [];
  for (const [where, t] of texts) for (const [name, re] of PATTERNS) {
    const m = t.match(re);
    if (m) hits.push(`${name} @ ${where}: …${t.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).replace(/\n/g, ' ')}…`);
  }
  if (hits.length) { total += hits.length; console.log(`\n${path.basename(f)} — ${hits.length}:`); hits.forEach((h) => console.log('  ' + h)); }
}
console.log(`\nИТОГО срабатываний: ${total}`);
process.exit(total ? 1 : 0);
