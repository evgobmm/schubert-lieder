#!/usr/bin/env node
// Сборка кандидатов песни скриптом (0 токенов): YouTube-выдача (Topic-каналы) +
// MusicBrainz + реестр альбомов → data/<slug>.candidates.json.
// Использование: node match-candidates.js <slug> [slug...]  |  --all-todo
// Агенты потом только заполняют пробелы (кандидаты вне реестра).

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const DATA = path.resolve(__dirname, '../data');

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zа-я ]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Индекс реестра: строки-карточки и заголовки-певцы из albums.md + albums/*.md + дайджеста
function loadRegistry() {
  const files = [path.resolve(__dirname, '../albums.md')];
  const dir = path.resolve(__dirname, '../albums');
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) files.push(path.join(dir, f));
  files.push(path.join(ROOT, 'planning/research/singers-digest.md'));
  const cards = []; // {text, file, singers: normed tokens}
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const rel = path.relative(ROOT, f);
    let currentSinger = null;
    for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
      const h = line.match(/^###\s+(.+?)(\s*\(|$)/);
      if (h) { currentSinger = norm(h[1]); continue; }
      const c = line.match(/^-\s+\*\*(.+?)\*\*/);
      if (c) {
        const head = norm(c[1]);
        cards.push({ text: line.trim().slice(0, 400), file: rel, key: [currentSinger, head].filter(Boolean).join(' ') });
      }
    }
  }
  return cards;
}

function main() {
  const argv = process.argv.slice(2);
  let slugs = argv.filter((a) => !a.startsWith('--'));
  if (argv.includes('--all-todo')) {
    const done = new Set(Object.keys(require(path.join(ROOT, 'app/src/data/performances.json'))));
    const index = require(path.join(ROOT, 'app/src/data/index.json'));
    slugs = index.filter((s) => !done.has(s.d) && s.file && !['winterreise'].includes(s.section)).map((s) => s.file.replace(/\.json$/, ''));
  }
  const cards = loadRegistry();
  let doneN = 0, skipped = 0;
  for (const slug of slugs) {
    const ytF = path.join(DATA, `${slug}.yt.json`);
    if (!fs.existsSync(ytF)) { skipped++; continue; }
    const yt = JSON.parse(fs.readFileSync(ytF, 'utf8'));
    const mbF = path.join(DATA, `${slug}.mb.json`);
    const mb = fs.existsSync(mbF) ? JSON.parse(fs.readFileSync(mbF, 'utf8')) : { recordings: [] };
    const candidates = [];
    for (const v of yt.videos || []) {
      const ch = v.channel || '';
      const isTopic = / - Topic$/.test(ch);
      const singer = norm(ch.replace(/ - Topic$/, ''));
      const surname = singer.split(' ').pop();
      const hits = surname && surname.length > 3
        ? cards.filter((c) => c.key.includes(surname)).slice(0, 4)
        : [];
      candidates.push({
        videoId: v.id, title: v.title, channel: ch, official_topic: isTopic,
        duration_s: v.duration_s, views: v.views,
        singer_guess: isTopic ? ch.replace(/ - Topic$/, '') : null,
        registry_hits: hits.map((h) => ({ file: h.file, card: h.text })),
      });
    }
    const mbArtists = [...new Set((mb.recordings || []).map((r) => r.artists).filter(Boolean))];
    fs.writeFileSync(path.join(DATA, `${slug}.candidates.json`), JSON.stringify({
      slug, generated_from: ['yt.json', 'mb.json', 'реестр альбомов'],
      note: 'Скриптовая сборка: singer_guess по Topic-каналу; registry_hits — карточки реестра по фамилии; агент проверяет и дополняет только пробелы.',
      candidates, mb_artists: mbArtists,
    }, null, 1));
    doneN++;
  }
  console.error(`candidates: ${doneN} готово, ${skipped} пропущено (нет yt.json)`);
}

main();
