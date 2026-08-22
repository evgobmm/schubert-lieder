#!/usr/bin/env node
// Предзагрузка источников для одноходовых агентов (0 токенов, только сеть):
//   node planning/scripts/prefetch-sources.js <outDir> <d> [<d> ...]     (outDir = <workDir>/prefetch; пакеты — <workDir>/songs)
// Для каждой песни кладёт в <outDir>/<slug>/:
//   schubertlied.de.txt, schubertsong.uk.txt        — страницы песни (HTML → грубый текст);
//   hyperion-booklet-CDJ#####.txt                   — окно буклета Hyperion (pdftotext) вокруг строки «D<d> …» (аннотация Грэма Джонсона);
//                                                     номера томов берутся из planning/research/<slug>-top5.md; PDF кэшируется в <outDir>/_hyperion/;
//   liedernet.txt                                   — страница LiederNet с текстом, найденная через DuckDuckGo (html-поиск) и проверенная по «D <d> (»;
//   dict-prefetch.json                              — для непокрытых форм пакета: лемма по редиректу DWDS, есть ли она в кэше, выписки DWDS и Grimm DWB;
//   manifest.json                                   — статусы. Выход — только в scratchpad.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice(7) : null; // dict | liedernet | web
const [outDir, ...ds] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!outDir || !ds.length) { console.error('usage: prefetch-sources.js <outDir> <d>...'); process.exit(1); }
const UA = 'Mozilla/5.0 (schubert-lieder research; contact: evgobmm@gmail.com)';
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/index.json'), 'utf8'));
const ENTRIES = path.join(ROOT, 'planning/dictionary/entries');
const sleep = (ms) => { try { execFileSync('sleep', [String(ms / 1000)]); } catch { } };
const kebab = (s) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[’'`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const kebabPlain = (s) => s.toLowerCase().replace(/[äöüß’'`]/g, (c) => ({ 'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss' }[c] || '')).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const strip = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|h\d|li|tr|dd|dt)>/gi, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&ensp;|&emsp;|&emsp13;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, '’').replace(/&ouml;/g, 'ö').replace(/&auml;/g, 'ä').replace(/&uuml;/g, 'ü').replace(/&szlig;/g, 'ß').replace(/&Ouml;/g, 'Ö').replace(/&Auml;/g, 'Ä').replace(/&Uuml;/g, 'Ü').replace(/&[a-z]+;/g, ' ')
  .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
const fetchRaw = (url, opts = {}) => {
  try {
    const raw = execFileSync('curl', ['-sL', '--max-time', String(opts.timeout || 40), '-A', UA, '-w', '\n__HTTP__%{http_code}__URL__%{url_effective}', url], { encoding: opts.binary ? 'buffer' : 'utf8', maxBuffer: 40 * 1024 * 1024 });
    const s = opts.binary ? raw.toString('latin1') : raw;
    const m = s.match(/\n__HTTP__(\d{3})__URL__(\S*)$/); const code = m ? Number(m[1]) : 0; const eff = m ? m[2] : url;
    const body = opts.binary ? raw.subarray(0, raw.length - (m ? m[0].length : 0)) : raw.replace(/\n__HTTP__\d{3}__URL__\S*$/, '');
    return { code, eff, body };
  } catch (e) { return { code: 0, eff: url, body: opts.binary ? Buffer.alloc(0) : '', error: String(e.message).slice(0, 120) }; }
};
const fetchText = (url) => { const r = fetchRaw(url); if (r.code !== 200) return { ok: false, chars: 0, text: '', error: 'HTTP ' + r.code }; const text = strip(r.body); return { ok: text.length > 500, chars: text.length, text, eff: r.eff }; };

// --- Hyperion: окно буклета вокруг D-строки ---
const hyperionWindow = (d, txt) => {
  const lines = txt.split('\n');
  const re = new RegExp('^D ?' + d + '(?![0-9])');
  const nextRe = /^D ?\d{1,4}[a-z]?\s+\S/;
  const i = lines.findIndex((l) => re.test(l.trim()));
  if (i < 0) return null;
  let j = i + 1;
  for (; j < lines.length; j++) { const t = lines[j].trim(); if (nextRe.test(t) && /\d{4}/.test(t) && !/\(also/.test(t)) break; }
  const start = Math.max(0, i - 3);
  let win = lines.slice(start, j).join('\n').replace(/\n{3,}/g, '\n\n');
  if (win.length > 16000) win = win.slice(0, 16000) + '\n…[обрезано]';
  return win;
};

// --- DWDS / DWB ---
const deUml = (x) => x.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');
const dwdsOnce = (q) => {
  const r = fetchRaw('https://www.dwds.de/wb/' + encodeURIComponent(q));
  if (r.code !== 200) return { ok: false, error: 'HTTP ' + r.code };
  let lemma = null; try { lemma = decodeURIComponent(new URL(r.eff).pathname.replace(/^\/wb\//, '')); } catch { }
  const text = strip(r.body);
  const notFound = /Leider konnten wir|kein Eintrag|nicht in unseren W/i.test(text.slice(0, 4000)) && !/Bedeutungsübersicht/.test(text);
  let head = ''; let k = text.indexOf('Bedeutungsübersicht'); if (k < 0) k = text.search(/\nBedeutungen?\n/);
  if (k >= 0) head = text.slice(k, k + 900).replace(/\s+/g, ' ');
  const ety = text.indexOf('Etymologie\n'); const etyTxt = ety >= 0 ? text.slice(ety, ety + 500).replace(/\s+/g, ' ') : '';
  return { ok: !notFound, url: r.eff, lemma, head, etymology: etyTxt, plausible: !!lemma && deUml(lemma).slice(0, 2) === deUml(q).slice(0, 2) && !!head };
};
const oldSpell = (f) => { const v = new Set(); const a = f.replace(/th/g, 't'); v.add(a); v.add(f.replace(/ß/g, 'ss')); v.add(a.replace(/ß/g, 'ss')); v.add(f.replace(/ey/g, 'ei')); v.add(a.replace(/ey/g, 'ei')); v.delete(f); return [...v]; };
const dwdsLemma = (form) => {
  const cap = form.charAt(0).toUpperCase() + form.slice(1);
  const tries = [form, cap, ...oldSpell(form), ...oldSpell(form).map((x) => x.charAt(0).toUpperCase() + x.slice(1))];
  let best = null;
  for (const q of tries) { const r = dwdsOnce(q); sleep(250); if (r.ok && r.plausible) return Object.assign(r, { query: q }); if (!best && r.ok) best = Object.assign(r, { query: q }); }
  return best || { ok: false, error: 'не найдено' };
};
const dwbEntry = (lemma) => {
  const l = lemma.toLowerCase();
  const r = fetchRaw('https://www.dwds.de/wb/dwb/' + encodeURIComponent(l));
  if (r.code !== 200) return { ok: false, error: 'HTTP ' + r.code };
  const text = strip(r.body);
  let k = text.indexOf(l + ', ', 300); if (k < 0) k = text.indexOf('\n' + l + '\n', 300); if (k < 0) k = text.indexOf(l + ',', 300);
  const head = k >= 0 ? text.slice(k, k + 1500).replace(/\s+/g, ' ') : '';
  return { ok: !!head, url: 'https://www.dwds.de/wb/dwb/' + encodeURIComponent(l), head };
};

for (const d of ds) {
  const e = index.find((x) => String(x.d) === String(d));
  if (!e) { console.error('нет в индексе:', d); continue; }
  const slug = e.file.replace('.json', '');
  const dir = path.join(outDir, slug); fs.mkdirSync(dir, { recursive: true });
  const title = e.title_de;
  const manifest = { d, slug, title, sources: {} };
  const prevM = fs.existsSync(path.join(dir, 'manifest.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')) : null;
  if (ONLY && prevM) Object.assign(manifest.sources, prevM.sources);
  // 1. сайты-справочники
  const candidates = {
    'schubertlied.de': [`https://www.schubertlied.de/die-lieder/${kebabPlain(title)}-d${d}`, `https://www.schubertlied.de/die-lieder/${kebab(title)}-d${d}`],
    'schubertsong.uk': [`https://www.schubertsong.uk/text/${kebabPlain(title)}/`, `https://www.schubertsong.uk/text/${kebab(title)}/`],
  };
  if (!ONLY || ONLY === 'web') for (const [name, urls] of Object.entries(candidates)) {
    let got = null;
    for (const url of urls) { const r = fetchText(url); if (r.ok) { got = { url, chars: r.chars }; fs.writeFileSync(path.join(dir, name + '.txt'), `SOURCE: ${url}\n\n` + r.text); break; } }
    manifest.sources[name] = got || { url: urls[0], ok: false };
  }
  // 2. Hyperion: буклеты томов из top5
  const top5Path = path.join(ROOT, 'planning/research', slug + '-top5.md');
  const top5 = fs.existsSync(top5Path) ? fs.readFileSync(top5Path, 'utf8') : '';
  const vols = [...new Set((top5.match(/CDJ(\d{5})/g) || []).map((x) => x.slice(3)))].slice(0, 3);
  if (!ONLY || ONLY === 'web') { manifest.sources.hyperion = [];
  const hdir = path.join(outDir, '_hyperion'); fs.mkdirSync(hdir, { recursive: true });
  for (const v of vols) {
    const pdf = path.join(hdir, v + '-B.pdf'), txt = path.join(hdir, v + '-B.txt');
    const url = `https://www.hyperion-records.co.uk/notes/${v}-B.pdf`;
    if (!fs.existsSync(txt)) {
      if (!fs.existsSync(pdf)) { const r = fetchRaw(url, { binary: true, timeout: 90 }); if (r.code === 200 && r.body.length > 10000) fs.writeFileSync(pdf, r.body); }
      if (fs.existsSync(pdf)) { try { execFileSync('pdftotext', [pdf, txt], { stdio: ['ignore', 'ignore', 'ignore'] }); } catch { } }
    }
    if (!fs.existsSync(txt)) { manifest.sources.hyperion.push({ vol: 'CDJ' + v, ok: false, url }); continue; }
    const win = hyperionWindow(d, fs.readFileSync(txt, 'utf8'));
    if (!win) { manifest.sources.hyperion.push({ vol: 'CDJ' + v, ok: false, url, note: 'строка D' + d + ' в буклете не найдена' }); continue; }
    fs.writeFileSync(path.join(dir, `hyperion-booklet-CDJ${v}.txt`), `SOURCE: ${url} (буклет Hyperion Schubert Edition, том CDJ${v}; текст — pdftotext, окно вокруг строки «D${d}»; аннотация Грэма Джонсона)\n\n` + win);
    manifest.sources.hyperion.push({ vol: 'CDJ' + v, ok: true, url, chars: win.length });
  } }
  // 3. LiederNet через DuckDuckGo
  if (!ONLY || ONLY === 'liedernet') {
    sleep(6000);
    const q = encodeURIComponent(`site:lieder.net "${title}" Schubert`);
    let r = fetchRaw('https://html.duckduckgo.com/html/?q=' + q); if (r.code !== 200) { sleep(20000); r = fetchRaw('https://html.duckduckgo.com/html/?q=' + q); }
    const ids = [...new Set((r.body.match(/lieder\.net\/lieder\/get_text\.html\?TextId=(\d+)/g) || []).map((x) => x.match(/\d+$/)[0]))].slice(0, 6);
    let found = null; const tried = [];
    const dRe = new RegExp('D ' + d + ' ?[(,]');
    const tryId = (id) => {
      if (tried.includes(id) || found) return; tried.push(id); sleep(800);
      const p = fetchRaw(`https://www.lieder.net/lieder/get_text.html?TextId=${id}`);
      if (p.code !== 200) return;
      const text = strip(p.body);
      if (dRe.test(text)) { found = { id, url: `https://www.lieder.net/lieder/get_text.html?TextId=${id}`, text }; return; }
      const go = p.body.match(/href="\/lieder\/get_text\.html\?TextId=(\d+)">Go to the text/);
      if (go) tryId(go[1]);
    };
    for (const id of ids) { tryId(id); if (found) break; }
    if (found) {
      let t = found.text; const a = t.indexOf('Search by Title or First Line'); if (a >= 0) t = t.slice(a + 30); const b = t.indexOf('Copyright ©'); if (b > 0) t = t.slice(0, b);
      t = t.replace(/\n\s*\n+/g, '\n').trim(); if (t.length > 14000) t = t.slice(0, 14000) + '\n…[обрезано]';
      fs.writeFileSync(path.join(dir, 'liedernet.txt'), `SOURCE: ${found.url} (LiederNet Archive; найдено поиском, проверено по «D ${d}» в списке положений на музыку)\n\n` + t);
      manifest.sources.liedernet = { ok: true, url: found.url, chars: t.length, tried };
    } else manifest.sources.liedernet = { ok: false, tried, ddg_http: r.code };
  }
  // 4. словарная предзагрузка для непокрытых форм
  if (!ONLY || ONLY === 'dict') {
    const pk = path.join(outDir, '..', 'songs', `d${String(d).replace('/', '-')}-packet.json`);
    if (fs.existsSync(pk)) {
      const packet = JSON.parse(fs.readFileSync(pk, 'utf8'));
      const out = [];
      for (const u of packet.uncovered || []) {
        const form = u.form;
        const rec = { form, count: u.count, sample: u.sample || '' };
        if (/['’]s$/.test(form) || /['’]$/.test(form)) { rec.note = 'клитика/элизия: -\'s = es; искать основу (durch, lachen, sehen…)'; }
        const base = form.replace(/['’]s$/, '').replace(/['’]$/, '');
        sleep(300);
        const dw = dwdsLemma(base);
        if (!dw.ok) { rec.dwds = { ok: false, error: dw.error }; out.push(rec); continue; }
        rec.dwds = { url: dw.url, lemma: dw.lemma, head: dw.head, etymology: dw.etymology };
        const lem = (dw.lemma || '').toLowerCase();
        rec.in_cache = !!lem && fs.existsSync(path.join(ENTRIES, lem + '.json'));
        if (!rec.in_cache && lem) { sleep(300); let g = dwbEntry(lem); if (!g.ok && lem !== base.toLowerCase()) { sleep(300); g = dwbEntry(base); } rec.dwb = g.ok ? { url: g.url, head: g.head } : { ok: false, error: g.error || 'не найдено' }; }
        out.push(rec);
      }
      fs.writeFileSync(path.join(dir, 'dict-prefetch.json'), JSON.stringify(out, null, 1));
      manifest.sources.dict_prefetch = { forms: out.length, in_cache: out.filter((x) => x.in_cache).length, dwb: out.filter((x) => x.dwb && x.dwb.head).length };
    }
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`D ${d} ${slug}: ` + Object.entries(manifest.sources).map(([k, v]) => `${k}=${Array.isArray(v) ? v.map((x) => x.vol + (x.ok ? '(' + x.chars + ')' : '(нет)')).join('+') : (v.chars ? v.chars + ' зн.' : (v.forms != null ? `${v.forms} форм, в кэше ${v.in_cache}, DWB ${v.dwb}` : 'НЕТ'))}`).join(', '));
}
