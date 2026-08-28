#!/usr/bin/env node
// Применение списка правок финального редактора к странице-кандидату (диета конвейера, 2026-08-28):
//   node planning/scripts/apply-edits.js <d> <workDir>
// Читает <workDir>/work/edits-<slug>.json, применяет правки к странице-кандидату и вызывает
//   finish-page.js <d> <workDir> <workDir>/work/candidate-<slug>.json --final
// (его stdout и код возврата прокидываются). Немецкий текст (lines_de) не меняется никогда;
// правка segments применяется, только если сохранено мультимножество немецких слов строки.
//
// БАЗА ПРИМЕНЕНИЯ — work/candidate-<slug>.pre-edits.json: копия кандидата ДО первых правок,
// то есть ровно та страница, рендер которой видел редактор. Первый запуск создаёт этот файл,
// повторный запуск применяет исправленный edits-файл заново от той же базы (индексы не «плывут»,
// повтор идемпотентен). Файл work/candidate-<slug>.v1.json не трогается.
//
// Формат <workDir>/work/edits-<slug>.json:
// {"d":"429","edits":[
//   {"type":"segments","line":"3.1","segments":[{"de":"Ohne","ru":"Без"},...]},
//   {"type":"ann","line":"3.1","index":0,"text":"...","segment_range":[0,4]},  // менять только присланные поля
//   {"type":"ann_delete","line":"1.2","index":1},
//   {"type":"ann_add","line":"2.3","ann":{"type":"lang","segment_range":[1,1],"text":"..."}},
//   {"type":"section","index":2,"title":"Музыка","text":"..."},
//   {"type":"section_delete","index":7},
//   {"type":"section_add","index":3,"title":"...","text":"..."},   // вставка перед index; без index — в конец
//   {"type":"title_ann","index":0,"text":"..."}, {"type":"title_ann_delete","index":0}, {"type":"title_ann_add","ann":{...}},
//   {"type":"title_ru","text":"..."}, {"type":"poet_ru","text":"..."}
// ],"removed":[{"what":"...","why":"..."}],"flags":["..."]}
// Поля "removed" и "flags" пишутся в work/removed-<slug>.json и work/flags-<slug>.json (их читает бандл delta).
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');

const [d, workDir] = process.argv.slice(2);
const die = (msg) => { console.log('[ОШИБКА] ' + msg); process.exit(1); };
if (!d || !workDir) { console.error('usage: apply-edits.js <d> <workDir>'); process.exit(2); }

const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/src/data/index.json'), 'utf8'));
const entry = index.find((x) => String(x.d) === String(d));
if (!entry || !entry.file) die('нет песни с D ' + d + ' в app/src/data/index.json');
const slug = entry.file.replace('.json', '');
const wd = path.join(workDir, 'work');
const candPath = path.join(wd, `candidate-${slug}.json`);
const prePath = path.join(wd, `candidate-${slug}.pre-edits.json`);
const editsPath = path.join(wd, `edits-${slug}.json`);

if (!fs.existsSync(editsPath)) die('нет файла правок ' + editsPath);
if (!fs.existsSync(candPath) && !fs.existsSync(prePath)) die('нет страницы-кандидата ' + candPath);
// база = копия кандидата ДО правок (создаётся при первом запуске)
const sha = (f) => { try { return require("crypto").createHash("sha1").update(fs.readFileSync(f)).digest("hex"); } catch { return null; } };
const stampPath = path.join(wd, `candidate-${slug}.pre-edits.stamp`);
// Снимок берётся заново, если кандидат менял кто-то, кроме apply-edits (этап ремонта, ручной догон,
// дописывание раздела): иначе повторный прогон откатил бы чужие правки. Метка — sha кандидата,
// записанного прошлым прогоном; совпала — идёт повтор того же круга, снимок годен.
const fresh = !fs.existsSync(prePath) || !fs.existsSync(stampPath) || fs.readFileSync(stampPath, "utf8").trim() !== sha(candPath);
if (fresh) fs.copyFileSync(candPath, prePath);
let page, edoc;
try { page = JSON.parse(fs.readFileSync(prePath, 'utf8')); } catch (err) { die('кандидат не читается как JSON: ' + err.message); }
try { edoc = JSON.parse(fs.readFileSync(editsPath, 'utf8')); } catch (err) { die('edits-файл не читается как JSON: ' + err.message + ' — почини ' + editsPath + ' и повтори'); }
if (Array.isArray(edoc)) edoc = { edits: edoc };
if (!edoc || typeof edoc !== 'object') die('edits-файл должен быть объектом {"d","edits","removed","flags"}');
const edits = edoc.edits || [];
if (!Array.isArray(edits)) die('поле "edits" должно быть массивом');

const applied = [];
const rejected = [];
const rej = (i, ed, why) => rejected.push(`#${i + 1} ${ed && ed.type ? ed.type : '?'}${ed && ed.line ? ' ' + ed.line : ed && ed.index != null ? ' [' + ed.index + ']' : ''}: ${why}`);
const ok = (i, ed, what) => applied.push(`#${i + 1} ${ed.type}${what ? ' ' + what : ''}`);

const stanzas = page.stanzas || [];
const lineAt = (addr) => {
  const m = /^\s*(\d+)\s*[.:]\s*(\d+)\s*$/.exec(String(addr == null ? '' : addr));
  if (!m) return { err: `адрес строки «${addr}» не в формате «строфа.строка» (обе цифры с 1)` };
  const si = +m[1] - 1, li = +m[2] - 1;
  const st = stanzas[si];
  if (!st) return { err: `нет строфы ${si + 1} (строф в песне ${stanzas.length})` };
  if (!st.lines_de || li < 0 || li >= st.lines_de.length) return { err: `нет строки ${li + 1} в строфе ${si + 1} (строк ${st.lines_de ? st.lines_de.length : 0})` };
  if (!st.lines_ru) st.lines_ru = [];
  if (!st.lines_ru[li]) st.lines_ru[li] = { segments: [] };
  return { st, si, li, lr: st.lines_ru[li] };
};
// мультимножество немецких слов строки: убираем многоточия, схлопываем пробелы, сравниваем с кратностью
const deWords = (segs) => (segs || []).map((s) => String((s && s.de) || '')).join(' ').replace(/\.\.\.|…/g, ' ').split(/\s+/).filter(Boolean);
const bagEq = (a, b) => a.length === b.length && a.slice().sort().join('') === b.slice().sort().join('');
const loose = (a) => a.map((w) => w.toLowerCase().replace(/[^a-zäöüßA-ZÄÖÜ']/g, '')).filter(Boolean);
const asRange = (r) => (Array.isArray(r) && r.length ? r : null);
const KNOWN = ['segments', 'ann', 'ann_delete', 'ann_add', 'section', 'section_delete', 'section_add', 'title_ann', 'title_ann_delete', 'title_ann_add', 'title_ru', 'poet_ru'];

// ——— фаза 0: разбор и проверка типов; индексы считаются по базе (её видел редактор) ———
const inPlace = [], adds = [], dels = [];
edits.forEach((ed, i) => {
  if (!ed || typeof ed !== 'object' || !ed.type) return rej(i, ed, 'нет поля type');
  if (!KNOWN.includes(ed.type)) return rej(i, ed, `неизвестный type «${ed.type}» (допустимо: ${KNOWN.join(', ')})`);
  if (/lines_de|line_de/.test(JSON.stringify(Object.keys(ed)))) return rej(i, ed, 'немецкий текст (lines_de) правкам не подлежит');
  if (ed.type.endsWith('_delete')) dels.push([i, ed]); else if (ed.type.endsWith('_add')) adds.push([i, ed]); else inPlace.push([i, ed]);
});

// ——— фаза 1: изменения на месте ———
for (const [i, ed] of inPlace) {
  if (ed.type === 'title_ru' || ed.type === 'poet_ru') {
    const t = ed.text != null ? ed.text : ed.value;
    if (typeof t !== 'string' || !t.trim()) { rej(i, ed, 'нужно непустое поле text'); continue; }
    page[ed.type] = t; ok(i, ed, '→ ' + t.slice(0, 40)); continue;
  }
  if (ed.type === 'segments') {
    const L = lineAt(ed.line); if (L.err) { rej(i, ed, L.err); continue; }
    if (!Array.isArray(ed.segments) || !ed.segments.length) { rej(i, ed, 'нужен непустой массив segments'); continue; }
    if (ed.segments.some((s) => !s || typeof s !== 'object' || (s.ru == null && s.de == null))) { rej(i, ed, 'каждый сегмент — объект {ru, de}'); continue; }
    const before = deWords(L.lr.segments), after = deWords(ed.segments);
    if (!bagEq(before, after)) {
      const why = bagEq(loose(before), loose(after))
        ? `изменились пунктуация/регистр немецких слов: было «${before.join(' ')}» стало «${after.join(' ')}»`
        : `нарушено множество немецких слов строки: было «${before.join(' ')}» стало «${after.join(' ')}»`;
      rej(i, ed, why); continue;
    }
    L.lr.segments = ed.segments.map((s) => { const o = { ru: s.ru == null ? '' : String(s.ru), de: s.de == null ? '' : String(s.de) }; if (s.variant_de) o.variant_de = s.variant_de; return o; });
    ok(i, ed, ed.line + ' (' + ed.segments.length + ' сегм.)'); continue;
  }
  if (ed.type === 'ann') {
    const L = lineAt(ed.line); if (L.err) { rej(i, ed, L.err); continue; }
    const arr = L.lr.annotations || [];
    if (!(ed.index >= 0) || ed.index >= arr.length) { rej(i, ed, `нет сноски #${ed.index} на строке ${ed.line} (их ${arr.length})`); continue; }
    const a = arr[ed.index];
    if (ed.text != null) a.text = String(ed.text);
    if (ed.segment_range != null) { const r = asRange(ed.segment_range); if (!r) { rej(i, ed, 'segment_range: нужен [начало,конец] или [[..],[..]]'); continue; } a.segment_range = r; }
    if (ed.type_ann != null || ed.ann_type != null) a.type = ed.type_ann || ed.ann_type;
    if (ed.line_span != null) a.line_span = ed.line_span;
    if (ed.continuation_ranges != null) a.continuation_ranges = ed.continuation_ranges;
    ok(i, ed, `${ed.line} #${ed.index}`); continue;
  }
  if (ed.type === 'section') {
    const arr = page.about || (page.about = []);
    if (!(ed.index >= 0) || ed.index >= arr.length) { rej(i, ed, `нет секции [${ed.index}] в «О песне» (их ${arr.length})`); continue; }
    if (ed.title == null && ed.text == null) { rej(i, ed, 'нужно title и/или text'); continue; }
    if (ed.title != null) arr[ed.index].title = String(ed.title);
    if (ed.text != null) arr[ed.index].text = String(ed.text);
    ok(i, ed, `[${ed.index}]`); continue;
  }
  if (ed.type === 'title_ann') {
    const arr = page.title_annotations || [];
    if (!(ed.index >= 0) || ed.index >= arr.length) { rej(i, ed, `нет титульной сноски #${ed.index} (их ${arr.length})`); continue; }
    if (ed.text != null) arr[ed.index].text = String(ed.text);
    if (ed.type_ann != null || ed.ann_type != null) arr[ed.index].type = ed.type_ann || ed.ann_type;
    ok(i, ed, `#${ed.index}`); continue;
  }
}

// ——— фаза 2: добавления (после всех изменений на месте, чтобы индексы не «плыли») ———
const sectionAdds = adds.filter(([, ed]) => ed.type === 'section_add');
const orderedAdds = adds.filter(([, ed]) => ed.type !== 'section_add')
  .concat(sectionAdds.filter(([, ed]) => !(ed.index >= 0)))
  .concat(sectionAdds.filter(([, ed]) => ed.index >= 0).sort((a, b) => b[1].index - a[1].index));
for (const [i, ed] of orderedAdds) {
  if (ed.type === 'ann_add') {
    const L = lineAt(ed.line); if (L.err) { rej(i, ed, L.err); continue; }
    const a = ed.ann || ed.annotation;
    if (!a || typeof a !== 'object' || !a.text) { rej(i, ed, 'нужен объект ann с непустым text'); continue; }
    (L.lr.annotations = L.lr.annotations || []).push(a);
    ok(i, ed, `${ed.line} (+1 сноска)`); continue;
  }
  if (ed.type === 'section_add') {
    const arr = page.about || (page.about = []);
    if (!ed.title || !ed.text) { rej(i, ed, 'нужны title и text'); continue; }
    const at = ed.index >= 0 ? Math.min(ed.index, arr.length) : arr.length;
    arr.splice(at, 0, { title: String(ed.title), text: String(ed.text) });
    ok(i, ed, `вставлена перед [${at}]`); continue;
  }
  if (ed.type === 'title_ann_add') {
    const a = ed.ann || ed.annotation;
    if (!a || typeof a !== 'object' || !a.text) { rej(i, ed, 'нужен объект ann с непустым text'); continue; }
    (page.title_annotations = page.title_annotations || []).push(a);
    ok(i, ed, '(+1 титульная сноска)'); continue;
  }
}

// ——— фаза 3: удаления, по УБЫВАНИЮ индекса внутри каждой строки/списка ———
const delKey = (ed) => ed.type === 'ann_delete' ? 'ann:' + ed.line : ed.type;
const groups = new Map();
for (const [i, ed] of dels) { const k = delKey(ed); if (!groups.has(k)) groups.set(k, []); groups.get(k).push([i, ed]); }
for (const list of groups.values()) {
  list.sort((a, b) => (b[1].index || 0) - (a[1].index || 0));
  for (const [i, ed] of list) {
    let arr = null, where = '';
    if (ed.type === 'ann_delete') { const L = lineAt(ed.line); if (L.err) { rej(i, ed, L.err); continue; } arr = L.lr.annotations || []; where = `${ed.line} #${ed.index}`; }
    else if (ed.type === 'section_delete') { arr = page.about || []; where = `[${ed.index}]`; }
    else if (ed.type === 'title_ann_delete') { arr = page.title_annotations || []; where = `#${ed.index}`; }
    if (!(ed.index >= 0) || ed.index >= arr.length) { rej(i, ed, `индекс ${ed.index} за пределами (элементов ${arr.length})`); continue; }
    arr.splice(ed.index, 1);
    ok(i, ed, where);
  }
}

// ——— страховка: немецкие строки не изменились ———
const base = JSON.parse(fs.readFileSync(prePath, 'utf8'));
const deOf = (j) => JSON.stringify((j.stanzas || []).map((s) => s.lines_de));
if (deOf(base) !== deOf(page)) die('внутренняя ошибка: изменились lines_de — правки не записаны');

fs.writeFileSync(candPath, JSON.stringify(page, null, 1) + '\n');
fs.writeFileSync(stampPath, sha(candPath) + '\n');
// removed / flags — их читает бандл этапа delta
const removed = Array.isArray(edoc.removed) ? edoc.removed : [];
const flags = Array.isArray(edoc.flags) ? edoc.flags : [];
fs.writeFileSync(path.join(wd, `removed-${slug}.json`), JSON.stringify(removed, null, 1) + '\n');
fs.writeFileSync(path.join(wd, `flags-${slug}.json`), JSON.stringify(flags, null, 1) + '\n');

const fp = spawnSync('node', [path.join(ROOT, 'planning/scripts/finish-page.js'), String(d), workDir, candPath, '--final'], { encoding: 'utf8' });
process.stdout.write(fp.stdout || '');
process.stderr.write(fp.stderr || '');

if (applied.length) console.log('ПРИМЕНЕНО: ' + applied.join('; '));
for (const r of rejected) console.log('ОТКЛОНЕНО ' + r);
console.log(`ПРИМЕНЕНО ${applied.length} правок, ОТКЛОНЕНО ${rejected.length}${rejected.length ? ' (' + rejected.join(' | ') + ')' : ''}, removed ${removed.length}, flags ${flags.length}`);
if (rejected.length) console.log('Отклонённые правки НЕ применены: почини их в ' + editsPath + ' (остальные правки в файле оставь — они применяются заново от исходной базы) и повтори команду.');
process.exit(rejected.length || fp.status !== 0 ? 1 : 0);
