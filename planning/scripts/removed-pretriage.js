#!/usr/bin/env node
// Скриптовый пред-триаж очереди «снятого» (0 токенов):
//   node planning/scripts/removed-pretriage.js <queue.json> <out.json>
// Пункты, снятые со ссылкой на словарь (Гримм/DWB/DWDS/Аделунг/«карточка»), проверяются по ПОЛНОЙ карточке кэша:
// если карточка есть и в ней стоит цитата названного словаря — снятие вызвано усечением карточки в бандле,
// такой пункт идёт в список «вернуть» без участия агентов. Остальное — в список на триаж sonnet.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const [qf, out] = process.argv.slice(2);
if (!qf || !out) { console.error('usage: removed-pretriage.js <queue.json> <out.json>'); process.exit(2); }
const q = JSON.parse(fs.readFileSync(qf, 'utf8'));
const bySong = q.by_song || q;
const entriesDir = path.join(ROOT, 'planning/dictionary/entries');
const cards = new Map();
for (const f of fs.readdirSync(entriesDir)) {
  try { const c = JSON.parse(fs.readFileSync(path.join(entriesDir, f), 'utf8')); cards.set(c.lemma.toLowerCase(), c); } catch { }
}
const DICT_RE = /гримм|grimm|dwb|dwds|аделунг|adelung|карточк|словар/i;
const cardText = (c) => [c.era, c.evidence, c.caveats, c.register, c.recommendation].filter(Boolean).join(' ').toLowerCase();
const restore = [], triage = [];
let checked = 0;
for (const [d, items] of Object.entries(bySong)) {
  for (const it of (Array.isArray(items) ? items : [])) {
    const text = `${it.what || ''} ${it.why || ''}`;
    if (!DICT_RE.test(text)) { triage.push({ d, ...it }); continue; }
    checked++;
    // немецкие слова-кандидаты: латиница длиной ≥3, из «what»
    const words = (String(it.what || '').match(/[A-Za-zÄÖÜäöüß][A-Za-zäöüß-]{2,}/g) || []).map((w) => w.toLowerCase());
    let hit = null;
    for (const w of words) {
      const c = cards.get(w) || cards.get(w.replace(/(en|em|er|es|e|n|s)$/, ''));
      if (!c) continue;
      const t = cardText(c);
      const named = /гримм|grimm|dwb/i.test(text) ? /dwb|grimm|гримм/.test(t)
        : /dwds/i.test(text) ? /dwds/.test(t)
          : /аделунг|adelung/i.test(text) ? /adelung|аделунг/.test(t) : t.length > 0;
      if (named) { hit = { lemma: c.lemma, why_card: (c.evidence || c.era || '').slice(0, 200) }; break; }
    }
    if (hit) restore.push({ d, ...it, card: hit.lemma, card_evidence: hit.why_card });
    else triage.push({ d, ...it });
  }
}
fs.writeFileSync(out, JSON.stringify({ restore, triage }, null, 1));
const songs = (a) => new Set(a.map((x) => x.d)).size;
console.log(`пунктов со ссылкой на словарь: ${checked}`);
console.log(`«вернуть» без агентов: ${restore.length} в ${songs(restore)} песнях`);
console.log(`на триаж sonnet: ${triage.length} в ${songs(triage)} песнях`);
console.log(`→ ${out}`);
