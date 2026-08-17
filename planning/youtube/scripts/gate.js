#!/usr/bin/env node
// Скрипт-гейт верификации (0 токенов): машинные проверки волны перед QA-ревизией.
// Использование: node gate.js <results.json>   — [{d, entries:[{videoId,name,year}]}]
// Проверки: живость/встраиваемость (oEmbed), формат name, дубли videoId по корпусу,
// инвариант приоритетов (Quasthoff > Fischer-Dieskau > Schwarzkopf в топе),
// консистентность года у одинаковой пары «певец — пианист» по корпусу (warning).
// Выход: JSON {errors:[], warnings:[]}; exit 2 при errors.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../../..');

function main() {
  const results = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const perf = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/performances.json'), 'utf8'));
  const errors = [], warnings = [];

  // 1. Дубли videoId: внутри волны и против опубликованного
  const seen = {};
  for (const [d, list] of Object.entries(perf)) for (const e of list) seen[e.videoId] = `published:D${d}`;
  const waveDs = new Set(results.map((r) => String(r.d)));
  for (const r of results) for (const e of r.entries) {
    const prev = seen[e.videoId];
    if (prev && !(prev === `published:D${r.d}`)) errors.push(`D${r.d}: дубль videoId ${e.videoId} (${prev})`);
    else seen[e.videoId] = `wave:D${r.d}`;
  }

  // 2. Формат name + иерархия приоритетов
  const prio = ['Quasthoff', 'Fischer-Dieskau', 'Schwarzkopf'];
  for (const r of results) {
    const names = r.entries.map((e) => e.name);
    for (const e of r.entries) {
      if (!/^[\p{L}\p{M}.\-' ]+ — [\p{L}\p{M}.\-'/ ]+$/u.test(e.name)) errors.push(`D${r.d}: формат name «${e.name}»`);
      const y = e.year;
      if (typeof y === 'number' ? (y < 1900 || y > 2026) : !/^[0-9]{4}([–-][0-9]{2,4})?\?$/.test(String(y)))
        errors.push(`D${r.d}: подозрительный year «${y}» (${e.name})`);
    }
    let lastPrio = -1;
    for (let i = 0; i < names.length; i++) {
      const p = prio.findIndex((s) => names[i].startsWith(s));
      if (p !== -1) {
        for (let j = 0; j < i; j++) if (prio.findIndex((s) => names[j].startsWith(s)) === -1) errors.push(`D${r.d}: ${prio[p]} на позиции ${i + 1}, выше него неприоритетный «${names[j]}»`);
        if (p < lastPrio) errors.push(`D${r.d}: нарушен порядок приоритетных (${names.join(' | ')})`);
        lastPrio = Math.max(lastPrio, p);
      }
    }
  }

  // 3. Консистентность годов одинаковых пар по корпусу (warning — может быть другой альбом)
  const pairYears = {};
  const addPair = (name, year, src) => {
    (pairYears[name] = pairYears[name] || []).push({ year: String(year), src });
  };
  for (const [d, list] of Object.entries(perf)) if (!waveDs.has(d)) for (const e of list) addPair(e.name, e.year, `D${d}`);
  for (const r of results) for (const e of r.entries) addPair(e.name, e.year, `wave:D${r.d}`);
  for (const [name, ys] of Object.entries(pairYears)) {
    const uniq = [...new Set(ys.map((x) => x.year))];
    if (uniq.length > 1 && ys.some((x) => x.src.startsWith('wave')))
      warnings.push(`«${name}»: годы ${uniq.join(', ')} (${ys.map((x) => x.src + ':' + x.year).join('; ')}) — проверить, разные ли это альбомы`);
  }

  // 4. oEmbed живость
  const ids = results.flatMap((r) => r.entries.map((e) => e.videoId));
  let checks = [];
  try {
    checks = JSON.parse(execFileSync('node', [path.join(__dirname, 'yt-check.js'), ...ids], { encoding: 'utf8', timeout: 300000 }));
  } catch (e) { if (e.stdout) checks = JSON.parse(e.stdout); else errors.push('yt-check не отработал: ' + e.message.slice(0, 100)); }
  for (const c of checks) if (!c.ok) errors.push(`видео ${c.id} мертво/не встраивается (status ${c.status})`);
  const chanById = Object.fromEntries(checks.map((c) => [c.id, c.channel || '']));
  for (const r of results) for (const e of r.entries) {
    const ch = chanById[e.videoId]; if (!ch) continue;
    const surname = e.name.split(' — ')[0].replace(/^[A-ZА-Я]\.\s*/, '').split(' ').pop().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const chn = ch.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (/- topic$/i.test(ch) && surname.length > 3 && !chn.includes(surname))
      warnings.push(`D${r.d}: канал «${ch}» не содержит фамилию «${e.name}» — проверить соответствие видео записи`);
  }

  console.log(JSON.stringify({ errors, warnings, checked_videos: checks.length }, null, 1));
  if (errors.length) process.exit(2);
}

main();
