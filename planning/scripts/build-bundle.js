#!/usr/bin/env node
// Сборка одного входного бандла для одноходового агента (0 токенов): печатает в stdout всё,
// что агенту нужно на данном этапе, чтобы он прочитал ОДИН раз и ответил ОДНИМ результатом.
//   node planning/scripts/build-bundle.js <stage> <d> <workDir>
// stage: facts | translate | about | fable | delta. workDir содержит: songs/d<d>-packet.json (pilot-prep),
// prefetch/<slug>/*.txt (prefetch-sources), facts/<slug>-facts.md, work/*.json (результаты этапов).
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const [stage, d, workDir] = process.argv.slice(2);
if (!stage || !d || !workDir) { console.error('usage: build-bundle.js <stage> <d> <workDir>'); process.exit(1); }
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/index.json'), 'utf8'));
const e = index.find((x) => String(x.d) === String(d));
const slug = e.file.replace('.json', '');
const song = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/songs', e.file), 'utf8'));
const rd = (p, max) => { try { const t = fs.readFileSync(p, 'utf8'); return max && t.length > max ? t.slice(0, max) + '\n…[обрезано]' : t; } catch { return null; } };
const poetSlug = { 'Ludwig Christoph Heinrich Hölty': 'hoelty', 'Ludwig Gotthard Kosegarten': 'kosegarten', 'Johann Wolfgang von Goethe': 'goethe', 'Johann Mayrhofer': 'mayrhofer', 'Franz von Schober': 'schober', 'Matthias Claudius': 'claudius', 'Matthäus von Collin': 'collin' }[song.poet_de] || null;
const sec = (title, body) => body ? `\n\n=== ${title} ===\n${body}` : '';
const brief = rd(path.join(ROOT, 'planning/catalog/one-shot-brief.md'));
const textBlock = song.stanzas.map((s, i) => `[строфа ${i + 1}]\n` + s.lines_de.join('\n')).join('\n\n');
let out = `# БАНДЛ · этап ${stage} · «${song.title_de}» (D ${d}), поэт ${song.poet_de}, год ${song.year}\nslug: ${slug}\n`;
if (stage === 'facts') {
  out += sec('НЕМЕЦКИЙ ТЕКСТ ПЕСНИ (как в проекте)', textBlock);
  out += sec('ДОСЬЕ ПОЭТА (verified-факты переиспользовать со ссылкой «досье, Ф№»)', rd(path.join(ROOT, 'planning/research/poets', poetSlug + '.md')));
  const pre = path.join(workDir, 'prefetch', slug);
  if (fs.existsSync(pre)) for (const f of fs.readdirSync(pre).filter((x) => x.endsWith('.txt'))) out += sec('ПРЕДЗАГРУЖЕННЫЙ ИСТОЧНИК: ' + f.replace('.txt', ''), rd(path.join(pre, f), 40000));
  out += sec('ТОП-5 ЗАПИСЕЙ (обоснование; факты о записях брать отсюда)', rd(path.join(ROOT, 'planning/research', slug + '-top5.md')));
  out += sec('ОБРАЗЕЦ ФОРМАТА ФАЙЛА ФАКТОВ (первые строки)', rd(path.join(ROOT, 'planning/research/d198-seufzer-facts.md'), 3500));
} else if (stage === 'dict') {
  const p = JSON.parse(fs.readFileSync(path.join(workDir, 'songs', `d${d}-packet.json`), 'utf8'));
  out += sec('НЕМЕЦКИЙ ТЕКСТ ПЕСНИ', textBlock);
  out += sec('НЕПОКРЫТЫЕ ФОРМЫ (проверь лемму в кэше planning/dictionary/entries/ — наивный лемматизатор промахивается; исследуй только реально отсутствующие)', JSON.stringify(p.uncovered, null, 1));
  out += sec('ОБРАЗЕЦ ЗАПИСИ КЭША', rd(path.join(ROOT, 'planning/dictionary/entries/busen.json')));
  out += sec('СПИСОК ЛЕММ КЭША (для проверки покрытия)', fs.readdirSync(path.join(ROOT, 'planning/dictionary/entries')).map((x) => x.replace('.json', '')).join(' '));
} else if (stage === 'translate') {
  out += sec('БРИФ (закон конвейера)', brief);
  out += sec('ПАКЕТ ПЕСНИ: текст, словарные карточки покрытых слов, непокрытые формы', rd(path.join(workDir, 'songs', `d${d}-packet.json`)));
  out += sec('НОВЫЕ СЛОВАРНЫЕ ЗАПИСИ ЭТОЙ ПЕСНИ (этап dict)', rd(path.join(workDir, 'work', `dict-${slug}.json`)));
  out += sec('ФАЙЛ ФАКТОВ (единственный источник meaning-аннотаций)', rd(path.join(workDir, 'facts', slug + '-facts.md')));
  const ex = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/songs/d118-gretchen-am-spinnrade.json'), 'utf8'));
  out += sec('ОБРАЗЕЦ СТРУКТУРЫ stanzas (эталон, одна строфа)', JSON.stringify([{ lines_de: ex.stanzas[1].lines_de, lines_ru: ex.stanzas[1].lines_ru }], null, 1));
  out += sec('ОБРАЗЕЦ meta', JSON.stringify({ title_ru: ex.title_ru, poet_ru: ex.poet_ru, title_annotations: ex.title_annotations }, null, 1));
} else if (stage === 'about') {
  out += sec('БРИФ (закон конвейера)', brief);
  out += sec('ФАЙЛ ФАКТОВ (единственный источник)', rd(path.join(workDir, 'facts', slug + '-facts.md')));
  out += sec('ДОСЬЕ ПОЭТА', rd(path.join(ROOT, 'planning/research/poets', poetSlug + '.md')));
  out += sec('ГОТОВЫЙ ПОДСТРОЧНИК С АННОТАЦИЯМИ (не дублировать целиком)', rd(path.join(workDir, 'work', `candidate-${slug}.json`)));
  const ex = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/songs/d194-die-mainacht.json'), 'utf8'));
  out += sec('ОБРАЗЕЦ about (каноническая структура, D 194)', JSON.stringify(ex.about.map((x) => ({ title: x.title, text: x.text.slice(0, 300) + (x.text.length > 300 ? '…' : '') })), null, 1));
} else if (stage === 'fable') {
  out += sec('БРИФ (закон конвейера)', brief);
  out += sec('СТРАНИЦА-КАНДИДАТ (править её целиком)', rd(path.join(workDir, 'work', `candidate-${slug}.json`)));
  out += sec('ФАЙЛ ФАКТОВ (опора; новых фактов не вносить)', rd(path.join(workDir, 'facts', slug + '-facts.md')));
  out += sec('ДОСЬЕ ПОЭТА (законная опора для биографии и контекста — не снимать то, что им подтверждено)', rd(path.join(ROOT, 'planning/research/poets', poetSlug + '.md')));
  out += sec('СЛОВАРНЫЕ КАРТОЧКИ ПАКЕТА С ЦИТАТАМИ (законная опора lang-аннотаций, в т.ч. ссылки на Гримма/Аделунга)', (() => { try { const p = JSON.parse(fs.readFileSync(path.join(workDir, 'songs', `d${d}-packet.json`), 'utf8')); const full = p.cache.map((c) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'planning/dictionary/entries', c.lemma + '.json'), 'utf8')); } catch { return c; } }); return JSON.stringify(full.map((c) => ({ lemma: c.lemma, recommendation: c.recommendation, era: c.era, caveats: c.caveats, evidence: c.evidence })), null, 1); } catch { return null; } })());
  out += sec('НОВЫЕ СЛОВАРНЫЕ ЗАПИСИ ЭТОЙ ПЕСНИ', rd(path.join(workDir, 'work', `dict-${slug}.json`)));
} else if (stage === 'delta') {
  out += sec('ВЕРСИЯ ДО Fable (v1)', rd(path.join(workDir, 'work', `candidate-${slug}.v1.json`)));
  out += sec('ФИНАЛ', rd(path.join(workDir, 'work', `candidate-${slug}.json`)));
  out += sec('ФАЙЛ ФАКТОВ', rd(path.join(workDir, 'facts', slug + '-facts.md')));
  out += sec('ДОСЬЕ ПОЭТА (законная опора)', rd(path.join(ROOT, 'planning/research/poets', poetSlug + '.md')));
  out += sec('СЛОВАРНЫЕ ЗАПИСИ ПЕСНИ (законная опора lang-аннотаций)', rd(path.join(workDir, 'work', `dict-${slug}.json`)));
}
const MAX = 45000;
const bdir = path.join(workDir, 'bundles'); fs.mkdirSync(bdir, { recursive: true });
if (out.length <= MAX) { process.stdout.write(out + '\n'); }
else {
  const parts = []; let i = 0;
  while (i < out.length) { let end = Math.min(i + MAX, out.length); const nl = out.lastIndexOf('\n', end); if (nl > i + MAX / 2) end = nl; parts.push(out.slice(i, end)); i = end; }
  const files = parts.map((p, k) => { const fp = path.join(bdir, `${stage}-${slug}.part${k + 1}.md`); fs.writeFileSync(fp, p); return fp; });
  process.stdout.write(`БАНДЛ ВЕЛИК (${out.length} знаков) — записан ${files.length} частями; прочитай их ВСЕ по порядку (cat каждой):\n` + files.join('\n') + '\n');
}
