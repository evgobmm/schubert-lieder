#!/usr/bin/env node
// Генерация app/public/sitemap.xml и robots.txt из index.json (запускать при изменении состава песен)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const BASE = 'https://evgobmm.github.io/schubert-lieder/';
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/index.json'), 'utf8'));
const urls = [BASE];
for (const e of index) {
  if (!e.file && !e.text) continue;
  urls.push(BASE + '?song=d' + String(e.d).replace('/', '.'));
}
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.map((u) => `  <url><loc>${u.replace(/&/g, '&amp;')}</loc></url>`).join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(ROOT, 'app/public/sitemap.xml'), xml);
fs.writeFileSync(path.join(ROOT, 'app/public/robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + BASE + 'sitemap.xml\n');
console.log('sitemap: ' + urls.length + ' URL');
