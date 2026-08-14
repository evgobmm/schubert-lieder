// Scrape schubert-digital.at work pages: dates, persons, classification.
// Resumable: skips ids already in sd-works.json. Polite: concurrency 3, 200ms gap.
const fs = require('fs');
const OUT = __dirname + '/sd-works.json';
const clean = s => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();

async function get(url) {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 schubert-lieder-project (bram.khryu@gmail.com)' } });
      if (r.ok) return await r.text();
      if (r.status === 404) return null;
    } catch (e) { /* retry */ }
    await new Promise(res => setTimeout(res, 1500 * (a + 1)));
  }
  return undefined; // persistent failure
}

(async () => {
  const reg = await get('https://schubert-digital.at/werke.html');
  if (!reg) { console.error('register fetch failed'); process.exit(1); }
  const ids = [...new Set([...reg.matchAll(/W-(\d{5})\.html/g)].map(m => m[1]))];
  console.log('register works:', ids.length);
  const done = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  const todo = ids.filter(id => !done[id]);
  console.log('todo:', todo.length);
  let processed = 0, failed = 0;
  const worker = async (queue) => {
    while (queue.length) {
      const id = queue.shift();
      const html = await get(`https://schubert-digital.at/W-${id}.html`);
      if (html === undefined) { failed++; continue; }
      if (html === null) { done[id] = { missing: true }; continue; }
      const rec = { title: '', fields: {} };
      const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
      if (h1) rec.title = clean(h1[1]);
      // first Werkdaten block only (before Werkteile tab repeats th/td)
      const pairs = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/g)];
      for (const p of pairs) {
        const k = clean(p[1]);
        if (rec.fields[k] === undefined) rec.fields[k] = clean(p[2]);
      }
      done[id] = rec;
      processed++;
      if (processed % 50 === 0) {
        fs.writeFileSync(OUT, JSON.stringify(done));
        console.log('progress:', processed, '/', todo.length, 'failed:', failed);
      }
      await new Promise(res => setTimeout(res, 200));
    }
  };
  const queue = [...todo];
  await Promise.all([worker(queue), worker(queue), worker(queue)]);
  fs.writeFileSync(OUT, JSON.stringify(done));
  console.log('DONE. total stored:', Object.keys(done).length, 'failed this run:', failed);
})();
