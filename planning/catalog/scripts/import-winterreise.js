// Перенос 24 переводов Winterreise из репозитория пользователя (CC0, его собственная работа).
// Скачивает song-JSONы, адаптирует к модели сайта (d, poet, year), пишет файлы песен
// и реестр переводов planning/catalog/translated.json (его читает build-app-data.js).
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const RAW = 'https://raw.githubusercontent.com/evgobmm/Winterreise/main/src/data/songs/';

(async () => {
  const list = JSON.parse(fs.readFileSync('/tmp/claude-1000/wr-files.json', 'utf8'));
  const registryFile = path.join(ROOT, 'planning/catalog/translated.json');
  const registry = fs.existsSync(registryFile) ? JSON.parse(fs.readFileSync(registryFile, 'utf8')) : {};
  for (const fn of list) {
    const n = parseInt(fn.slice(0, 2), 10);
    const r = await fetch(RAW + fn, { headers: { 'User-Agent': 'schubert-lieder-project' } });
    if (!r.ok) { console.error('FAIL', fn, r.status); process.exit(1); }
    const src = await r.json();
    const d = `911/${n}`;
    const slug = `d911-${n}-${fn.slice(3, -5)}`;
    const song = {
      d,
      title_de: src.title_de,
      title_ru: src.title_ru,
      poet_de: 'Wilhelm Müller',
      poet_ru: 'Вильгельм Мюллер',
      year: '1827',
      source: 'перевод: собственный сайт Winterreise автора проекта (CC0)',
      ...(src.title_annotations ? { title_annotations: src.title_annotations } : {}),
      stanzas: src.stanzas,
      ...(src.about ? { about: src.about } : {}),
    };
    fs.writeFileSync(path.join(ROOT, 'app/src/data/songs', slug + '.json'), JSON.stringify(song, null, 1));
    registry[d] = { file: slug + '.json', title_ru: src.title_ru, poet_ru: 'Вильгельм Мюллер' };
  }
  fs.writeFileSync(registryFile, JSON.stringify(registry, null, 1));
  console.log('imported:', list.length, '| registry size:', Object.keys(registry).length);
})();
