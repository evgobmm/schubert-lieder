#!/usr/bin/env node
// Предзагрузка данных по песням пилота (0 токенов): MusicBrainz-дискография +
// generic-поиск YouTube (yt-dlp). Результаты — в planning/youtube/data/<slug>.{mb,yt}.json.
// Использование: node prepass.js [d ...]  (без аргументов — все песни раздела 1824-1825)
// Уже существующие файлы пропускаются (перезапуск безопасен).

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../../..');
const DATA = path.resolve(__dirname, '../data');
const index = require(path.join(ROOT, 'app/src/data/index.json'));

function slugOf(song) { return song.file.replace(/\.json$/, ''); }

function ytSearch(query, n) {
  try {
    const out = execFileSync('yt-dlp', [
      `ytsearch${n}:${query}`, '--flat-playlist',
      '--print', '%(id)s\t%(title)s\t%(channel)s\t%(duration)s\t%(view_count)s',
    ], { encoding: 'utf8', timeout: 60000 });
    return out.trim().split('\n').filter(Boolean).map((line) => {
      const [id, title, channel, duration, views] = line.split('\t');
      return { id, title, channel, duration_s: Number(duration) || null, views: Number(views) || null };
    });
  } catch (e) {
    console.error(`  yt-dlp failed for "${query}": ${e.message.slice(0, 120)}`);
    return [];
  }
}

async function main() {
  const wanted = process.argv.slice(2);
  let songs;
  if (wanted[0] === '--rest') {
    const done = new Set(Object.keys(require(path.join(ROOT, 'app/src/data/performances.json'))));
    songs = index.filter((s) => !done.has(s.d) && s.section !== 'winterreise');
  } else {
    songs = index.filter((s) => s.section === '1824-1825');
    if (wanted.length) songs = songs.filter((s) => wanted.includes(s.d));
  }
  for (const song of songs) {
    const slug = slugOf(song);
    const mbFile = path.join(DATA, `${slug}.mb.json`);
    const ytFile = path.join(DATA, `${slug}.yt.json`);
    const title = song.title_de.replace(/^.*?: /, ''); // "Ellens Gesang III: Hymne..." -> без подзаголовка не режем название work
    console.error(`== D ${song.d} ${song.title_de}`);
    if (!fs.existsSync(mbFile)) {
      try {
        execFileSync('node', [path.join(__dirname, 'mb-discography.js'), song.title_de.split(':')[0].trim(), song.d, mbFile], { stdio: ['ignore', 'inherit', 'inherit'], timeout: 300000 });
      } catch (e) { console.error(`  MB failed: ${e.message.slice(0, 120)}`); }
    }
    if (!fs.existsSync(ytFile)) {
      const q1 = ytSearch(`Schubert ${song.title_de.split(':')[0].trim()} D ${song.d.replace('/', ' ')}`, 15);
      const q2 = ytSearch(`Schubert ${song.title_de.split(':')[0].trim()} Lied`, 15);
      const seen = new Set();
      const merged = [...q1, ...q2].filter((v) => v.id && !seen.has(v.id) && seen.add(v.id));
      fs.writeFileSync(ytFile, JSON.stringify({ d: song.d, queries: 2, videos: merged }, null, 1));
      console.error(`  yt: ${merged.length} unique videos`);
    }
  }
  console.error('PREPASS DONE');
}

main();
