// Генерация данных приложения из каталога:
//   app/src/data/sections.json  — разделы по порядку
//   app/src/data/index.json     — все песни с привязкой к разделам
//   app/src/data/songs/*.json   — файлы «только текст» для песен с текстом OpenScore
// Запуск: node planning/catalog/scripts/build-app-data.js (из корня репозитория)
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const catalog = require(path.join(ROOT, 'planning/catalog/catalog.json'));
const { sections } = require(path.join(ROOT, 'planning/catalog/sections.json'));
const formatted = require(path.join(ROOT, 'planning/catalog/sources/openscore-lyrics-formatted.json'));

const byD = {};
catalog.forEach(r => { byD[r.d] = r; });
const fmtByD = {};
formatted.forEach(r => { fmtByD[r.d] = r.stanzas; });

const slugify = t => t.toLowerCase()
  .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
  .replace(/[’'"„“«»‚‘.,:;!?()\[\]]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const displayPoet = p => {
  if (!p || /\.\.\.$/.test(p)) return '';
  return p.split(' / ').map(name => {
    const parts = name.split(',').map(s => s.trim());
    return parts.length === 2 ? `${parts[1]} ${parts[0]}` : name;
  }).join(', ');
};

const displayYear = c => {
  const m = (c.date_sd || '').match(/(\d{4})/) || (c.year_nsa || '').match(/(\d{4})/);
  return m ? m[1] : '';
};

// Существующие записи (пилот) сохраняют свои файлы/переводы
const existingIndex = require(path.join(ROOT, 'app/src/data/index.json'));
const existingByD = {};
existingIndex.forEach(e => { existingByD[e.d] = e; });

const outIndex = [];
const outSections = [];
let number = 0;
const songsDir = path.join(ROOT, 'app/src/data/songs');

for (const sec of sections) {
  outSections.push({ id: sec.id, title: sec.title, count: sec.count });
  for (const d of sec.songs) {
    const c = byD[d];
    number++;
    const prev = existingByD[d];
    const entry = {
      number,
      d,
      title_de: c.title,
      year: displayYear(c),
      section: sec.id,
    };
    const poetDe = displayPoet(c.poet_full || '');
    if (poetDe) entry.poet_de = poetDe;
    if (prev && prev.ready) {
      // полноценная переведённая песня (пилот)
      entry.title_ru = prev.title_ru;
      entry.poet_ru = prev.poet_ru;
      entry.file = prev.file;
      entry.ready = true;
      entry.text = true;
    } else if (fmtByD[d]) {
      const slug = `d${d.replace(/\//g, '-').toLowerCase()}-${slugify(c.title)}`;
      const file = `${slug}.json`;
      const songJson = {
        d,
        title_de: c.title,
        year: displayYear(c),
        text_only: true,
        source: 'OpenScore Lieder Corpus (CC0)',
        stanzas: fmtByD[d].map(lines => ({ lines_de: lines })),
      };
      if (poetDe) songJson.poet_de = poetDe;
      fs.writeFileSync(path.join(songsDir, file), JSON.stringify(songJson, null, 1));
      entry.file = file;
      entry.ready = false;
      entry.text = true;
    } else {
      entry.ready = false;
      entry.text = false;
    }
    outIndex.push(entry);
  }
}

fs.writeFileSync(path.join(ROOT, 'app/src/data/sections.json'), JSON.stringify(outSections, null, 1));
fs.writeFileSync(path.join(ROOT, 'app/src/data/index.json'), JSON.stringify(outIndex, null, 1));
console.log('sections:', outSections.length, '| songs:', outIndex.length,
  '| with text:', outIndex.filter(e => e.text).length,
  '| translated:', outIndex.filter(e => e.ready).length);
console.log('Gretchen number:', outIndex.find(e => e.d === '118').number);
