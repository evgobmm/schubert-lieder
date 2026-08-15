// Вежливый краулер страниц текстов LiederNet по карте liedernet-map.json.
// Сырьё кладёт в scratchpad (перекачиваемо), пропускает уже скачанное.
// Запуск: node ln-crawl.js <outDir>
const fs = require('fs');
const path = require('path');
const { map } = require('../sources/liedernet-map.json');
const OUT = process.argv[2];
if (!OUT) { console.error('usage: node ln-crawl.js <outDir>'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
const UA = 'schubert-lieder-project research crawler (contact: bram.khryu@gmail.com)';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const keys = Object.keys(map).filter(d => !d.startsWith('911/') && !map[d][0].special);
  let done = 0, fail = [];
  for (const d of keys) {
    const key = d.replace('/', '-');
    const file = path.join(OUT, key + '.html');
    if (fs.existsSync(file) && fs.statSync(file).size > 5000) { done++; continue; }
    const e = map[d][0];
    const url = 'https://www.lieder.net/lieder/get_text.html?TextId=' + e.textId + (e.settingId ? '&SettingId=' + e.settingId : '');
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      fs.writeFileSync(file, await r.text());
      done++;
    } catch (err) {
      fail.push(d + ':' + err.message);
    }
    if (done % 50 === 0) console.log(done + '/' + keys.length);
    await sleep(1200);
  }
  console.log('готово:', done, '/', keys.length, '| ошибки:', fail.length ? fail.join(' ') : 'нет');
})();
