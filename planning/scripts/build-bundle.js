#!/usr/bin/env node
// Сборка входного бандла для одноходового агента (0 токенов). v2 (2026-08-22):
//   node planning/scripts/build-bundle.js <stage> <d> <workDir>
// stage: dict | facts | page | fable | delta. Бандл всегда пишется в <workDir>/bundles/<stage>-<slug>.partN.md
// частями ≤42 000 знаков (≈60 КБ) (Read-инструмент отдаёт такой файл целиком); в stdout — список частей и размер.
// workDir: songs/d<d>-packet.json (pilot-prep), prefetch/<slug>/* (prefetch-sources), facts/<slug>-facts.md, work/*.json.
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
const rj = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const poetSlug = { 'Ludwig Christoph Heinrich Hölty': 'hoelty', 'Ludwig Gotthard Kosegarten': 'kosegarten', 'Johann Wolfgang von Goethe': 'goethe', 'Johann Mayrhofer': 'mayrhofer', 'Franz von Schober': 'schober', 'Matthias Claudius': 'claudius', 'Matthäus von Collin': 'collin', 'Pietro Metastasio': 'metastasio', 'Franz von Schlechta': 'schlechta', 'Friedrich de La Motte- Fouqué': 'fouque', 'James Macpherson, unbekannt': 'macpherson', 'Edmund von Harold, James Macpherson': 'macpherson', 'James Macpherson, Edmund von Harold': 'macpherson', 'August Wilhelm von Schlegel': 'schlegel-aw', 'Johann Georg Jacobi': 'jacobi', 'Heinrich Joseph von Collin, Pietro Metastasio': 'metastasio', 'Francesco Petrarca, August Wilhelm von Schlegel': 'schlegel-aw', 'Novalis': 'novalis', 'Pietro Metastasio, Jacopo Vittorelli': 'metastasio', 'Friedrich Rückert': 'rueckert', 'Ludwig Rellstab': 'rellstab', 'Friedrich Schiller': 'schiller', 'Friedrich von Matthisson': 'matthisson', 'Friedrich von Schlegel': 'schlegel-f', 'Ernestine von Krosigk, Friedrich von Schlegel': 'schlegel-f', 'Theodor Körner': 'koerner', 'Friedrich Gottlieb Klopstock': 'klopstock', 'Johann Gaudenz von Salis-Seewis': 'salis-seewis', 'Karl Gottfried von Leitner': 'leitner', 'Johann Gabriel Seidl': 'seidl', 'Ernst Schulze': 'schulze', 'Friedrich Leopold zu Stolberg-Stolberg': 'stolberg' }[song.poet_de] || null;
const sec = (title, body) => body ? `\n\n=== ${title} ===\n${body}` : '';
const brief = rd(path.join(ROOT, 'planning/catalog/one-shot-brief.md'));
const textBlock = song.stanzas.map((s, i) => `[строфа ${i + 1}]\n` + s.lines_de.join('\n')).join('\n\n');
const dossier = poetSlug ? (rd(path.join(ROOT, 'planning/research/poets', poetSlug + '.md')) || '') : '';
const kratko = (dossier.match(/## Кратко[\s\S]*?(?=\n## )/) || [dossier.slice(0, 2500)])[0];
const packetPath = path.join(workDir, 'songs', `d${String(d).replace('/', '-')}-packet.json`);
const factsPath = path.join(workDir, 'facts', slug + '-facts.md');
const cand = (suffix) => path.join(workDir, 'work', `candidate-${slug}${suffix}.json`);
// компактные факты: утверждение + источник + статус, без URL и цитат
const compactFacts = (t, lim = 700) => t ? t.split('\n').map((l) => {
  if (!/^\*\*Ф\d+\.\*\*/.test(l)) return /^#|^---/.test(l) ? l : null;
  let x = l.replace(/https?:\/\/\S+/g, '').replace(/«[^»]*»/g, '').replace(/\(\s*\)/g, '').replace(/\s+—\s+(?=—)/g, ' ').replace(/\s+—\s*$/g, '').replace(/[ \t]+/g, ' ').replace(/ ,/g, ',').replace(/—\s+—/g, '—');
  return x.length > lim ? x.slice(0, lim) + '…' : x;
}).filter(Boolean).join('\n') : null;
const fullCards = () => { const p = rj(packetPath); if (!p) return []; return p.cache.map((c) => rj(path.join(ROOT, 'planning/dictionary/entries', c.lemma + '.json')) || c); };
const cardsCompact = (max, ev = true) => JSON.stringify(fullCards().map((c) => ({ lemma: c.lemma, recommendation: c.recommendation, caveats: (c.caveats || '').slice(0, max), era: (c.era || '').slice(0, Math.min(max, 120)), ...(ev ? { evidence_first: ((c.evidence || '').split('\n').find((l) => l.trim()) || '').slice(0, max) } : {}) })), null, 1);
// ——— диета page: карточки пакета только с нужными полями (без evidence/ru_candidates) ———
const cut = (s, n) => { const t = String(s == null ? '' : s); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const slimPacket = () => {
  const p = rj(packetPath); if (!p) return rd(packetPath);
  const q = {};
  for (const k of Object.keys(p)) q[k] = k === 'cache' ? (p.cache || []).map((c) => {
    const o = {};
    if (c.lemma != null) o.lemma = c.lemma;
    if (c.header != null) o.header = c.header;
    if (c.recommendation != null) o.recommendation = c.recommendation;
    if (c.caveats != null) o.caveats = cut(c.caveats, 160);
    if (c.era != null) o.era = cut(c.era, 120);
    if (c.forms_covered != null) o.forms_covered = c.forms_covered;
    return o;
  }) : p[k];
  return JSON.stringify(q, null, 1);
};
// ——— диета fable: компактный текстовый рендер страницы-кандидата вместо JSON ———
const rangeS = (r) => { if (!r) return ''; const f = Array.isArray(r[0]) ? r : [r]; return f.map((x) => `${x[0]}-${x[1]}`).join(','); };
const annS2 = (addr, i, a) => {
  const box = [rangeS(a.segment_range)];
  if (a.line_span) box.push('span' + a.line_span);
  if (a.continuation_ranges) box.push('cont=' + JSON.stringify(a.continuation_ranges));
  return `${addr} #${i} ${a.type || 'meaning'} [${box.filter(Boolean).join(' ')}]: ${a.text}`;
};
const segS = (s) => {
  const ru = (s.ru == null ? '' : String(s.ru)).trim(), de = (s.de == null ? '' : String(s.de)).trim();
  const v = s.variant_de ? ` /вариант: ${s.variant_de}/` : '';
  return (ru ? ru + ' ' : '') + '[' + de + ']' + v;
};
const renderCandidate = (j) => {
  if (!j) return null;
  const L = [];
  L.push('ЛЕГЕНДА ФОРМАТА: «<строфа>.<строка>» — адрес строки (обе цифры считаются с 1); строка «RU:» — сегменты подстрочника «ru [de]», разделитель « | » (пустой de → «ru []», пустой ru → «[de]»).');
  L.push('Сноски строки: «<адрес> #<индекс аннотации с 0> <type> [<диапазон сегментов, индексы с 0>]: текст»; span2 — line_span, cont=… — continuation_ranges. [T] — титульная сноска, [S<индекс с 0>] — секция «О песне».');
  L.push('Правки адресуются ИМЕННО этими адресами и индексами (см. формат edits-файла в задании); немецкие строки DE не редактируются.');
  L.push('');
  L.push(`# «${j.title_de}» (D ${j.d}) — «${j.title_ru}», ${j.poet_ru}, ${j.year}`);
  (j.title_annotations || []).forEach((a, i) => L.push(`[T] титульная сноска #${i} ${a.type || 'meaning'}: ${a.text}`));
  (j.stanzas || []).forEach((st, si) => {
    L.push(`== Строфа ${si + 1}`);
    (st.lines_de || []).forEach((de, li) => {
      const addr = `${si + 1}.${li + 1}`;
      const lr = (st.lines_ru || [])[li] || {};
      L.push(`${addr} DE: ${de}`);
      L.push(`${addr} RU: ${(lr.segments || []).map(segS).join(' | ')}`);
      (lr.annotations || []).forEach((a, ai) => L.push(annS2(addr, ai, a)));
    });
  });
  L.push('== О песне');
  (j.about || []).forEach((s, i) => L.push(`[S${i}] «${s.title}»: ${s.text}`));
  return L.join('\n');
};
const newDictCompact = (max, ev = true) => { const a = rj(path.join(workDir, 'work', `dict-${slug}.json`)); if (!a) return null; return JSON.stringify(a.filter((x) => x && x.lemma).map((x) => ({ lemma: x.lemma, recommendation: x.recommendation, caveats: (x.caveats || '').slice(0, max), era: (x.era || '').slice(0, Math.min(max, 120)), ...(ev ? { evidence_first: ((x.evidence || '').split('\n').find((l) => l.trim()) || '').slice(0, max) } : {}), status: x.status })), null, 1); };

let out = `# БАНДЛ · этап ${stage} · «${song.title_de}» (D ${d}), поэт ${song.poet_de}, год ${song.year}\nslug: ${slug}\n`;
if (stage === 'dict') {
  const p = rj(packetPath);
  out += sec('НЕМЕЦКИЙ ТЕКСТ ПЕСНИ', textBlock);
  out += sec('НЕПОКРЫТЫЕ ФОРМЫ ПАКЕТА', JSON.stringify(p.uncovered, null, 1));
  const pre = rj(path.join(workDir, 'prefetch', slug, 'dict-prefetch.json'));
  if (pre) out += sec('ПРЕДЗАГРУЖЕННЫЕ ВЫПИСКИ (DWDS: лемма по редиректу и обзор значений; Grimm DWB: начало статьи; in_cache=true — лемма уже в кэше, новой записи не нужно, только map)', pre.map((r) => [`• ${r.form}${r.note ? ' — ' + r.note : ''}`, r.dwds && r.dwds.lemma ? `  DWDS: лемма «${r.dwds.lemma}» ${r.dwds.url}${r.in_cache ? ' — В КЭШЕ' : ''}` : '  DWDS: не найдено', r.dwds && r.dwds.head ? `  DWDS обзор: ${r.dwds.head.slice(0, 450)}` : '', r.dwds && r.dwds.etymology ? `  DWDS этимология: ${r.dwds.etymology.slice(0, 300)}` : '', r.dwb && r.dwb.head ? `  DWB (${r.dwb.url}): ${r.dwb.head.slice(0, 800)}` : '  DWB: нет статьи'].filter(Boolean).join('\n')).join('\n\n'));
  out += sec('ОБРАЗЕЦ ЗАПИСИ КЭША', rd(path.join(ROOT, 'planning/dictionary/entries/busen.json')));
  out += sec('СПИСОК ЛЕММ КЭША (для проверки покрытия)', fs.readdirSync(path.join(ROOT, 'planning/dictionary/entries')).map((x) => x.replace('.json', '')).join(' '));
} else if (stage === 'facts') {
  out += sec('НЕМЕЦКИЙ ТЕКСТ ПЕСНИ (как в проекте)', textBlock);
  out += sec('ДОСЬЕ ПОЭТА (verified-факты переиспользовать со ссылкой «досье, Ф№»)', dossier);
  const pre = path.join(workDir, 'prefetch', slug);
  if (fs.existsSync(pre)) for (const f of fs.readdirSync(pre).filter((x) => x.endsWith('.txt')).sort()) out += sec('ПРЕДЗАГРУЖЕННЫЙ ИСТОЧНИК: ' + f.replace('.txt', ''), rd(path.join(pre, f), 40000));
  const man = rj(path.join(pre, 'manifest.json'));
  if (man) out += sec('МАНИФЕСТ ПРЕДЗАГРУЗКИ (чего нет — того нет; сетевой бюджет тратить только на это)', JSON.stringify(man.sources, null, 1));
  out += sec('ТОП-5 ЗАПИСЕЙ (обоснование; факты о записях брать отсюда)', rd(path.join(ROOT, 'planning/research', slug + '-top5.md')));
  out += sec('ОБРАЗЕЦ ФОРМАТА ФАЙЛА ФАКТОВ (первые строки)', rd(path.join(ROOT, 'planning/research/d198-seufzer-facts.md'), 3500));
} else if (stage === 'page') {
  out += sec('БРИФ (закон конвейера)', brief);
  out += sec('ПАКЕТ ПЕСНИ: текст, словарные карточки (сокращённые: lemma, header, recommendation, caveats, era, forms_covered), непокрытые формы', slimPacket());
  out += sec('НОВЫЕ СЛОВАРНЫЕ ЗАПИСИ ЭТОЙ ПЕСНИ', rd(path.join(workDir, 'work', `dict-${slug}.json`)));
  out += sec('ФАЙЛ ФАКТОВ (единственный источник meaning-аннотаций и «О песне»)', rd(factsPath));
  out += sec('ДОСЬЕ ПОЭТА — выдержка «Кратко» (законная опора; полное досье planning/research/poets/' + poetSlug + '.md)', kratko);
  const ex = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/songs/d194-die-mainacht.json'), 'utf8'));
  out += sec('ОБРАЗЕЦ СТРУКТУРЫ (D 194: одна строфа + заголовки about)', JSON.stringify({ stanza_example: { lines_de: ex.stanzas[0].lines_de, lines_ru: ex.stanzas[0].lines_ru }, meta_example: { title_ru: ex.title_ru, poet_ru: ex.poet_ru, title_annotations: ex.title_annotations }, about_titles: ex.about.map((x) => x.title) }, null, 1));
} else if (stage === 'fable') {
  out += sec('БРИФ (закон конвейера)', brief);
  out += sec('СТРАНИЦА-КАНДИДАТ — КОМПАКТНЫЙ РЕНДЕР (правки адресуются по номерам строк и индексам ниже; файл целиком не переписывать)', renderCandidate(rj(cand(''))));
  const head = out;
  const factsRaw = rd(factsPath);
  let fitted = null;
  for (const lim of [700, 520, 400, 320, 260]) {
    let o = head + sec('ФАКТЫ — КОМПАКТНО (утверждение — источник — статус; усечено до ' + lim + ' зн.; ПЕРЕД ЛЮБЫМ СНЯТИЕМ читай полный файл: ' + factsPath + ')', compactFacts(factsRaw, lim));
    o += sec('ДОСЬЕ ПОЭТА — «Кратко» (законная опора; не снимать подтверждённое досье)', kratko);
    let max = 220;
    const tail = () => sec('СЛОВАРНЫЕ КАРТОЧКИ ПАКЕТА (законная опора lang-аннотаций, в т.ч. ссылки на Гримма/Аделунга из карточек)', cardsCompact(max, false)) + sec('НОВЫЕ СЛОВАРНЫЕ ЗАПИСИ ЭТОЙ ПЕСНИ', newDictCompact(max, false));
    let t = tail(); while (o.length + t.length > 47000 && max > 60) { max -= 40; t = tail(); }
    o += t;
    fitted = o; if (o.length <= 47000) break; // цель: одна часть (один Read у Fable); урок партии 2: две части = +0,1M Fable на песню
  }
  out = fitted;
} else if (stage === 'delta') {
  const A = rj(cand('.v1')), B = rj(cand(''));
  const L = [];
  const P = (s) => L.push(s);
  const renderLine = (x) => (x.segments || []).map((s) => s.ru).join(' ');
  const deLine = (x) => (x.segments || []).map((s) => s.de).join(' ');
  const annS = (a) => `${a.type}[${(a.segment_range || []).join('-')}${a.line_span ? ' span' + a.line_span : ''}] ${a.text}`;
  const flat = (j) => { const r = []; (j.stanzas || []).forEach((st, si) => (st.lines_de || []).forEach((de, li) => { const x = (st.lines_ru || [])[li]; r.push({ id: `${si + 1}.${li + 1}`, de, ru: x ? renderLine(x) : null, dej: x ? deLine(x) : null, ann: x ? (x.annotations || []) : [], segs: x ? x.segments : [] }); })); return r; };
  P('##### META'); for (const k of ['title_ru', 'poet_ru']) if (JSON.stringify(A[k]) !== JSON.stringify(B[k])) P(`META DIFF ${k}: v1=${JSON.stringify(A[k])} FIN=${JSON.stringify(B[k])}`);
  P('##### ТИТУЛЬНЫЕ АННОТАЦИИ'); const ta = (A.title_annotations || []).map(annS), tb = (B.title_annotations || []).map(annS);
  if (JSON.stringify(ta) === JSON.stringify(tb)) { tb.forEach((t) => P('ANN= ' + t)); } else { ta.forEach((t) => P('v1  ' + t)); tb.forEach((t) => P('FIN ' + t)); }
  const fa = flat(A), fb = flat(B); let changed = 0; const deDiff = [], cover = [], emptyRu = [];
  P(`##### СТРОКИ (v1 ${fa.length}, финал ${fb.length}); ANN= — аннотация не изменилась; v1ANN/FINANN — было/стало`);
  for (let i = 0; i < Math.max(fa.length, fb.length); i++) {
    const a = fa[i], b = fb[i]; if (!a || !b) { P(`ПРОПАЛА/ДОБАВЛЕНА СТРОКА idx ${i}: v1=${a && a.de} fin=${b && b.de}`); continue; }
    if (a.de !== b.de) deDiff.push(`${b.id}: v1«${a.de}» FIN«${b.de}»`);
    if (b.dej.replace(/\.\.\./g, ' ').replace(/\s+/g, ' ').trim() !== b.de.replace(/\s+/g, ' ').trim()) cover.push(`${b.id}: de-сегменты «${b.dej}» ≠ строка «${b.de}»`);
    (b.segs || []).forEach((sg, k) => { if (!sg.ru || !String(sg.ru).trim()) emptyRu.push(`${b.id}#${k} de=${sg.de}`); });
    const ch = a.ru !== b.ru, ach = JSON.stringify(a.ann) !== JSON.stringify(b.ann); if (ch) changed++;
    P(`${b.id} DE: ${b.de}`); P(`${b.id} RU: ${b.ru}${ch ? '   <<ИЗМЕНЕНО; v1: ' + a.ru : ''}`);
    if (ach) { a.ann.forEach((x) => P('   v1ANN  ' + annS(x))); b.ann.forEach((x) => P('   FINANN ' + annS(x))); } else b.ann.forEach((x) => P('   ANN= ' + annS(x)));
  }
  P('LINES_DE: ' + (deDiff.length ? 'РАСХОЖДЕНИЯ ' + deDiff.join(' ;; ') : 'идентичны')); P('DE-СЕГМЕНТЫ vs СТРОКА: ' + (cover.length ? cover.join(' ;; ') : 'совпадают')); P('ПУСТЫЕ RU-СЕГМЕНТЫ: ' + (emptyRu.length ? emptyRu.join(' ;; ') : 'нет')); P(`ИЗМЕНЁННЫХ RU-СТРОК: ${changed}/${fb.length}`);
  P('##### «О ПЕСНЕ»'); const aa = A.about || [], ab = B.about || []; P('v1: ' + aa.map((s) => s.title).join(' | ')); P('FIN: ' + ab.map((s) => s.title).join(' | '));
  for (let i = 0; i < Math.max(aa.length, ab.length); i++) { const x = aa[i], y = ab[i]; const same = x && y && x.title === y.title && x.text === y.text; P(`--- ABOUT[${i}] ${same ? 'ИДЕНТИЧНА' : 'ОТЛИЧАЕТСЯ'}`); if (same) P(`«${y.title}» :: ${y.text}`); else { if (x) P(`v1  «${x.title}» :: ${x.text}`); if (y) P(`FIN «${y.title}» :: ${y.text}`); } }
  out += sec('ОТЧЁТ СРАВНЕНИЯ v1 (до Fable) → ФИНАЛ (построен скриптом)', L.join('\n'));
  out += sec('СПИСОК СНЯТОГО, ЗАЯВЛЕННЫЙ Fable', rd(path.join(workDir, 'work', `removed-${slug}.json`)));
  out += sec('ФАКТЫ — КОМПАКТНО (утверждение — источник — статус)', compactFacts(rd(factsPath)));
  out += sec('ДОСЬЕ ПОЭТА — «Кратко» (законная опора)', kratko);
  out += sec('СЛОВАРНЫЕ КАРТОЧКИ И НОВЫЕ ЗАПИСИ (законная опора lang-аннотаций)', cardsCompact(160) + '\n' + (newDictCompact(160) || ''));
}
const MAX = 48000; // предел Read — 25 000 токенов за вызов (замер 29.08: 110 КБ файл усечён на 465 строках); 48k знаков кириллицы ≈ 20–23k токенов; при усечении агент дочитывает с offset
const bdir = path.join(workDir, 'bundles'); fs.mkdirSync(bdir, { recursive: true });
for (const f of fs.readdirSync(bdir)) if (f.startsWith(`${stage}-${slug}.part`)) fs.unlinkSync(path.join(bdir, f));
const parts = []; let i = 0;
while (i < out.length) { let end = Math.min(i + MAX, out.length); if (end < out.length) { const nl = out.lastIndexOf('\n', end); if (nl > i + MAX / 2) end = nl; } parts.push(out.slice(i, end)); i = end; }
const np = parts.filter((p) => p.trim().length).length;
const files = parts.filter((p) => p.trim().length).map((p, k) => { const fp = path.join(bdir, `${stage}-${slug}.part${k + 1}.md`); fs.writeFileSync(fp, (k ? `[ЧАСТЬ ${k + 1} ИЗ ${np}]\n` : '') + p + (k + 1 < np ? `\n\n[ПРОДОЛЖЕНИЕ В ЧАСТИ ${k + 2}: ${path.join(bdir, `${stage}-${slug}.part${k + 2}.md`)}]\n` : '\n\n[КОНЕЦ БАНДЛА]\n')); return fp; });
process.stdout.write(`БАНДЛ ${stage} D ${d}: ${out.length} знаков, частей ${files.length} — прочитай каждую часть Read-инструментом целиком, по порядку:\n` + files.join('\n') + '\n');
