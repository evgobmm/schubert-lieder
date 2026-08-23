#!/usr/bin/env node
// Статус волны по файлам на диске (0 токенов) — вместо ручных списков догона (урок волны №3: ручной список чуть не переделал опубликованное):
//   node planning/scripts/wave-remaining.js <workDir>
// Печатает по каждой песне каталога, что готово (dict/facts/страница/fable/публикация), и готовые args для догонов.
const fs = require('fs'); const path = require('path'); const ROOT = path.join(__dirname, '..', '..');
const W = process.argv[2]; if (!W) { console.error('usage: wave-remaining.js <workDir>'); process.exit(1); }
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/index.json'), 'utf8'));
const translated = JSON.parse(fs.readFileSync(path.join(ROOT, 'planning/catalog/translated.json'), 'utf8'));
const poetSlug = { 'Ludwig Christoph Heinrich Hölty': 'hoelty', 'Ludwig Gotthard Kosegarten': 'kosegarten', 'Johann Wolfgang von Goethe': 'goethe', 'Johann Mayrhofer': 'mayrhofer', 'Franz von Schober': 'schober', 'Matthias Claudius': 'claudius', 'Matthäus von Collin': 'collin' };
const ex = (p) => fs.existsSync(p); const mt = (p) => ex(p) ? fs.statSync(p).mtimeMs : 0;
const full = [], fable = [], repair = [], done = [];
for (const f of fs.readdirSync(path.join(W, 'songs')).filter((x) => /^d.+-packet\.json$/.test(x)).sort()) {
  const d = f.replace(/^d/, '').replace(/-packet\.json$/, '').replace('-', '/');
  const e = index.find((x) => String(x.d) === d); if (!e) { console.log(f + ': нет в индексе'); continue; }
  const slug = e.file.replace('.json', '');
  const song = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/songs', e.file), 'utf8'));
  const rec = { d, slug, poet: poetSlug[song.poet_de] || null, first: song.stanzas[0].lines_de[0].replace(/[,.;!?]+$/, '') };
  const st = {
    dict: ex(path.join(W, 'work', `dict-${slug}.json`)), facts: ex(path.join(W, 'facts', `${slug}-facts.md`)),
    v1: ex(path.join(W, 'work', `candidate-${slug}.v1.json`)),
    fable: mt(path.join(W, 'bundles', `delta-${slug}.part1.md`)) > mt(path.join(W, 'work', `candidate-${slug}.v1.json`)) && ex(path.join(W, 'work', `candidate-${slug}.v1.json`)),
    published: !!translated[d],
  };
  const stage = st.published ? 'ОПУБЛИКОВАНА' : !(st.dict && st.facts && st.v1) ? 'полная цепочка' : !st.fable ? 'только fable→сверка' : 'ремонт/публикация (вердикт — в журнале воркфлоу)';
  console.log(`D ${d} ${slug}: dict=${+st.dict} facts=${+st.facts} страница=${+st.v1} fable=${+st.fable} опубл=${+st.published} → ${stage}`);
  (st.published ? done : !(st.dict && st.facts && st.v1) ? full : !st.fable ? fable : repair).push(rec);
}
console.log(`\nИтого: опубликовано ${done.length}, полная цепочка ${full.length}, только fable ${fable.length}, ремонт/публикация ${repair.length}`);
if (full.length) console.log('\nargs (wave-v2-workflow):\n' + JSON.stringify({ workDir: W, songs: full }));
if (fable.length) console.log('\nargs (wave-fable-workflow):\n' + JSON.stringify({ workDir: W, songs: fable.map(({ d, slug, poet }) => ({ d, slug, poet })) }));
if (repair.length) console.log('\nремонт (repair-args.js по журналу сверки):\n' + repair.map((r) => r.d).join(' '));
