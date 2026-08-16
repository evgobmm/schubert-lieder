#!/usr/bin/env node
// Каркас дискографии песни из MusicBrainz (0 токенов).
// Использование: node mb-discography.js "<title>" "<D-number>" [outfile]
// Пример: node mb-discography.js "Die junge Nonne" "828" out.json
// Находит work по названию (+ проверка D-номера в названии/алиасах), затем
// собирает все связанные recordings с исполнителями и самой ранней датой издания.
// Rate limit MusicBrainz: 1 запрос/сек — выдерживается.

const UA = 'schubert-lieder-research/1.0 (bram.khryu@gmail.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mb(path, tries = 4) {
  for (let i = 1; i <= tries; i++) {
    await sleep(1100 * i);
    const res = await fetch(`https://musicbrainz.org/ws/2/${path}`, {
      headers: { 'User-Agent': UA },
    });
    if (res.ok) return res.json();
    if (i === tries) throw new Error(`MB ${res.status} for ${path}`);
  }
}

async function main() {
  const [title, dnum, outfile] = process.argv.slice(2);
  if (!title) {
    console.error('usage: mb-discography.js "<title>" [D-number] [outfile]');
    process.exit(1);
  }
  const q = encodeURIComponent(`"${title}"`);
  const search = await mb(`work?query=${q}&fmt=json&limit=10`);
  const dRe = dnum ? new RegExp(`D\\.?\\s*${dnum.replace('/', '[-/]')}(?![0-9])`, 'i') : null;
  const works = (search.works || []).filter((w) => {
    if (!dRe) return true;
    const names = [w.title, ...(w.aliases || []).map((a) => a.name)];
    return names.some((n) => dRe.test(n || ''));
  });
  const work = works[0] || (search.works || [])[0];
  if (!work) {
    console.error(`No work found for "${title}"`);
    process.exit(2);
  }
  const recordings = [];
  let offset = 0;
  while (true) {
    const page = await mb(
      `recording?work=${work.id}&inc=artist-credits&fmt=json&limit=100&offset=${offset}`
    );
    for (const r of page.recordings || []) {
      const artists = (r['artist-credit'] || []).map((c) => c.name || c.artist?.name).join(', ');
      recordings.push({
        artists,
        title: r.title,
        length_s: r.length ? Math.round(r.length / 1000) : null,
        disambiguation: r.disambiguation || null,
      });
    }
    offset += 100;
    if (offset >= (page['recording-count'] || 0)) break;
  }
  recordings.sort((a, b) => (a.artists || '').localeCompare(b.artists || ''));
  const out = {
    query: { title, dnum: dnum || null },
    work: { id: work.id, title: work.title },
    recording_count: recordings.length,
    recordings,
  };
  const json = JSON.stringify(out, null, 1);
  if (outfile) require('fs').writeFileSync(outfile, json);
  else console.log(json);
  console.error(`OK: ${work.title} — ${recordings.length} recordings`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
