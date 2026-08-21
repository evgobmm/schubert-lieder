#!/usr/bin/env node
// Предзагрузка источников для одноходового факт-агента (0 токенов):
//   node planning/scripts/prefetch-sources.js <outDir> <d> [<d> ...]
// Для каждой песни по выводимым URL-шаблонам скачивает и кладёт в <outDir>/<slug>/ текст страниц
// (HTML → грубый текст) + manifest.json со статусами. Источники v1: schubertlied.de, schubertsong.uk.
// Буклеты Hyperion и LiederNet требуют идентификаторов (W####, TextId) — их агент ищет сам одним ходом,
// либо они добавляются в manifest вручную/из прежних файлов фактов. Выход — только в scratchpad.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const [outDir, ...ds] = process.argv.slice(2);
if (!outDir || !ds.length) { console.error('usage: prefetch-sources.js <outDir> <d>...'); process.exit(1); }
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/index.json'), 'utf8'));
const kebab = (s) => s.toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[’'`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const kebabPlain = (s) => s.toLowerCase().replace(/[äöüß’'`]/g, (c) => ({ 'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss' }[c] || '')).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fetchText = (url) => {
  try {
    const html = execFileSync('curl', ['-sL', '--max-time', '40', '-A', 'Mozilla/5.0 (schubert-lieder research; contact: evgobmm@gmail.com)', url], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|h\d|li|tr)>/gi, '\n').replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&ouml;/g, 'ö').replace(/&auml;/g, 'ä').replace(/&uuml;/g, 'ü').replace(/&szlig;/g, 'ß')
      .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
    return { ok: text.length > 500, chars: text.length, text };
  } catch (e) { return { ok: false, chars: 0, text: '', error: String(e.message).slice(0, 120) }; }
};
for (const d of ds) {
  const e = index.find((x) => String(x.d) === String(d));
  if (!e) { console.error('нет в индексе:', d); continue; }
  const slug = e.file.replace('.json', '');
  const dir = path.join(outDir, slug); fs.mkdirSync(dir, { recursive: true });
  const title = e.title_de;
  const candidates = {
    'schubertlied.de': [`https://www.schubertlied.de/die-lieder/${kebabPlain(title)}-d${d}`, `https://www.schubertlied.de/die-lieder/${kebab(title)}-d${d}`],
    'schubertsong.uk': [`https://www.schubertsong.uk/text/${kebabPlain(title)}/`, `https://www.schubertsong.uk/text/${kebab(title)}/`],
  };
  const manifest = { d, slug, title, sources: {} };
  for (const [name, urls] of Object.entries(candidates)) {
    let got = null;
    for (const url of urls) { const r = fetchText(url); if (r.ok) { got = { url, chars: r.chars }; fs.writeFileSync(path.join(dir, name + '.txt'), `SOURCE: ${url}\n\n` + r.text); break; } }
    manifest.sources[name] = got || { url: urls[0], ok: false };
  }
  manifest.todo = ['Hyperion: страница записи (tw.asp?w=W####) и буклет PDF (notes/<CDJ>-B.pdf → pdftotext) — найти одним поиском', 'LiederNet: get_text.html?TextId=… — одним поиском'];
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`D ${d} ${slug}: ` + Object.entries(manifest.sources).map(([k, v]) => `${k}=${v.chars ? v.chars + ' зн.' : 'НЕТ'}`).join(', '));
}
