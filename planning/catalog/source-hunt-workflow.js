export const meta = {
  name: 'source-hunt',
  description: 'Добор источников: поиск страниц песен на schubertsong.uk/schubertlied.de/LiederNet/DTA/Wikisource и второй источник по пунктам uncertain',
  phases: [{ title: 'Поиск источников' }, { title: 'Вердикты uncertain' }],
}
// args = {hunt: [{d, slug, title}], verdict: [{id, songs:[...]}], out: <каталог вердиктов>}
const REPO = '/workspaces/schubert-lieder'
const PRE = '/home/vscode/schubert-waves/wave5/prefetch'
const SCRATCH = '/tmp/claude-1000/-workspaces-schubert-lieder/6dd19060-2ba3-4979-b2ed-3349f9729473/scratchpad'

const hunt = (s) => agent(`Ты — сборщик источников проекта «все песни Шуберта с пословным русским переводом». Автоматическая предзагрузка не нашла страниц для песни **D ${s.d} «${s.title}»** (slug ${s.slug}): угаданные адреса на schubertsong.uk и schubertlied.de вернули 404. Найди их вручную и сохрани текст.

ЧТО ИСКАТЬ (в порядке ценности)
1. **schubertsong.uk** — критический текст Петера Растля. Адрес строится как https://www.schubertsong.uk/text/<slug-заголовка>/ , но slug может отличаться от нашего: у песен на один и тот же текст он часто по первой строке. Ищи так: curl -sL 'https://www.schubertsong.uk/?s=<слова+заголовка>' | grep -o 'schubertsong.uk/text/[a-z0-9-]*' | sort -u | head; либо через поисковик: curl -sL 'https://html.duckduckgo.com/html/?q=site%3Aschubertsong.uk+<слова>' | grep -o 'schubertsong\\.uk/text/[a-z0-9-]*' | head. Проверь, что найденная страница — про D ${s.d} (на ней стоит номер Дойча).
2. **schubertlied.de** — https://www.schubertlied.de/die-lieder/<заголовок-через-дефис>-d${String(s.d).replace('/', '-')} ; попробуй варианты транслитерации умляутов (ö→oe и o), с апострофами и без.
3. **LiederNet** — https://www.lieder.net/lieder/get_text.html?TextId=<id>; id ищется через поисковик по первой строке.
4. **Deutsches Textarchiv** (deutschestextarchiv.de) и **de.wikisource.org** — печатные издания стихотворения эпохи; годятся как второй источник.

КАК СОХРАНИТЬ
Каждую найденную страницу: curl -sL '<url>' | sed 's/<[^>]*>/ /g' | tr -s ' \\n' > ${PRE}/${s.slug}/<имя>.txt , где имя — schubertsong.uk, schubertlied.de, liedernet, dta, wikisource (расширение .txt). ПЕРВОЙ строкой файла впиши «SOURCE: <url>» (echo, затем >>). Каталог ${PRE}/${s.slug}/ уже существует.
Бюджет сети — до 20 обращений. Ничего в ${REPO} не пиши. Субагентов не спавнить.

Верни по схеме: d="${s.d}", found (сколько страниц сохранено), sources (список имён), note (до 200 знаков: что не нашлось и почему), tool_calls.`, {
  label: `источники D ${s.d}`, phase: 'Поиск источников', model: 'sonnet', effort: 'medium',
  schema: { type: 'object', properties: { d: { type: 'string' }, found: { type: 'number' }, sources: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 40 } }, note: { type: 'string', maxLength: 200 }, tool_calls: { type: 'number' } }, required: ['d', 'found', 'tool_calls'] },
})

const verdict = (g) => agent(`Ты — текстолог проекта «все песни Шуберта с пословным русским переводом». Твоя задача — закрыть пункты со статусом **uncertain** из аудита немецких текстов по песням: D ${g.songs.join(', D ')}. Uncertain значит: в момент первой сверки был доступен только один источник или источники спорили между собой. Нужен второй независимый источник и окончательный вердикт.

СВОИ ПУНКТЫ ВОЗЬМИ ТАК
Bash: node -e 'const fs=require("fs");const t=fs.readFileSync("${REPO}/planning/reports/de-text-verdicts.md","utf8");const inU=[];let sec="";for(const l of t.split("\\n")){if(l.startsWith("### ")||l.startsWith("## "))sec=l;if(!/uncertain/i.test(sec))continue;for(const d of ${JSON.stringify(g.songs)})if(l.startsWith("| D "+d+" |"))console.log(l);}'

ГДЕ ИСКАТЬ ВТОРОЙ ИСТОЧНИК (иерархия протокола §1)
1. Предзагруженные страницы песни: /home/vscode/schubert-waves/*/prefetch/<slug>/ — schubertsong.uk.txt (критический текст Растля; там же часто «Original Spelling» и текст поэта), schubertlied.de.txt, иногда liedernet/dta/wikisource.
2. Сеть (до 12 обращений): **Deutsches Textarchiv** (curl -sL 'https://www.deutschestextarchiv.de/search?q=<фраза>'), **de.wikisource.org** (печатные издания стихов), **lieder.net**, факсимиле первых изданий на **IMSLP**. Снимай текст так: curl -sL '<url>' | sed 's/<[^>]*>/ /g' | tr -s ' \\n'.
3. Файл фактов песни ${REPO}/planning/research/<slug>-facts.md — там уже могут быть цитаты.

ВЕРДИКТ ПО КАЖДОМУ ПУНКТУ — как в аудите: **artifact** (расхождение мнимое), **schubert** (текст проекта верен, у поэта иначе; need_note=true, если на странице это не оговорено), **defect** (ошибка проекта; указывай верное чтение и ДВА источника), **uncertain** (второго источника так и нет — тогда напиши, что именно искал).
Ничего в ${REPO} не менять: ты только выносишь вердикты.

РЕЗУЛЬТАТ — ОДИН вызов Write: ${SCRATCH}/verdicts3/verdicts-${g.id}.json вида {"group":"${g.id}","items":[{"d":"...","addr":"3.4","verdict":"...","project":"...","source":"...","why":"<с именами источников>","need_note":false,"fix":"..."}]}
Верни по схеме: group="${g.id}", n_items, n_defect, n_schubert, n_artifact, n_uncertain, tool_calls.`, {
  label: `uncertain ${g.id}`, phase: 'Вердикты uncertain', model: 'sonnet', effort: 'high',
  schema: { type: 'object', properties: { group: { type: 'string' }, n_items: { type: 'number' }, n_defect: { type: 'number' }, n_schubert: { type: 'number' }, n_artifact: { type: 'number' }, n_uncertain: { type: 'number' }, tool_calls: { type: 'number' } }, required: ['group', 'n_items', 'tool_calls'] },
})

const [hunted, verdicts] = await Promise.all([
  parallel((args.hunt || []).map((s) => () => hunt(s))),
  parallel((args.verdict || []).map((g) => () => verdict(g))),
])
return { hunted, verdicts }
