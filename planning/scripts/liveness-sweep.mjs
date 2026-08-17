// Проверка живости всех видео performances.json через oEmbed, 4 потока
import fs from 'fs';
const perf = JSON.parse(fs.readFileSync('/workspaces/schubert-lieder/app/src/data/performances.json', 'utf8'));
const items = [];
for (const [d, arr] of Object.entries(perf)) arr.forEach((v, i) => items.push({ d, i, id: v.videoId, name: v.name }));
console.error('всего видео: ' + items.length);
const out = [];
let done = 0;
async function worker() {
  while (items.length) {
    const it = items.shift();
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${it.id}&format=json`);
      out.push({ ...it, status: res.status });
    } catch (e) { out.push({ ...it, status: 0, err: e.message }); }
    done++;
    if (done % 200 === 0) console.error(done + ' проверено');
    await new Promise(r => setTimeout(r, 150));
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
const bad = out.filter(r => r.status !== 200);
console.error('ГОТОВО. Проблемных: ' + bad.length);
for (const b of bad) console.error(`${b.status} d${b.d}[${b.i}] ${b.id} ${b.name}`);
