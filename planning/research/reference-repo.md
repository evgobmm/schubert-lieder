# Research report: evgobmm/Winterreise (repo + GitHub Pages site)

All source files were downloaded from `raw.githubusercontent.com/evgobmm/Winterreise/main/...` into `/tmp/claude-1000/-workspaces-schubert-lieder/58994164-8f7b-444a-a0eb-ca1238b24ba6/scratchpad/win/` for inspection (App.vue, all 13 components, utils, styles, data JSONs, CLAUDE.md, README, workflow). Everything below is verified against actual source, the GitHub API, and the live site.

## (a) Repo structure and file naming

- Repo: https://github.com/evgobmm/Winterreise — default branch `main`, created 2026-03-07, last push 2026-07-14, primary language reported as "Python" (because of large `scripts/` and `research/` dirs), `has_pages: true`, homepage https://evgobmm.github.io/Winterreise/.
- Full tree (via `GET /repos/evgobmm/Winterreise/git/trees/main?recursive=1`):
  - `.github/workflows/deploy.yml` — GitHub Actions Pages deploy
  - `index.html` — Vite entry (SEO meta, JSON-LD, fonts, GoatCounter)
  - `package.json`, `package-lock.json`, `vite.config.js`
  - `public/favicon.svg`, `public/robots.txt`, `public/sitemap.xml`
  - `src/main.js`, `src/App.vue`
  - `src/components/` — `SongList.vue`, `SongView.vue` (755 lines, the core), `InterlinearLine.vue`, `AnnotationsPanel.vue`, `FootnoteMark.vue`, `PerformancePlayer.vue`, `ThemeToggle.vue`, `SnowToggle.vue`, `SnowOverlay.vue`, `PrintMenu.vue` (538 lines), `FeedbackMenu.vue`
  - `src/data/index.json` — song catalog; `src/data/performances.json` — YouTube IDs; `src/data/songs/NN-slug.json` — one JSON per song, named `01-gute-nacht.json` … `24-der-leiermann.json` (zero-padded number + kebab-case ASCII-transliterated German title: ü→ue, ä→ae, ö→oe, ß→ss)
  - `src/styles/main.css` (~700 lines incl. print + mobile), `src/styles/theme.css` (CSS custom-property themes)
  - `src/utils/ranges.js`, `renderText.js`, `snow.js`
  - `scripts/` — ~20 Python/JS verification scripts used during authoring (word-check, validate_all.py, dictionary cross-checking pipelines) — NOT part of the site
  - `research/` — large JSON audit artifacts of the translation process — NOT part of the site
  - `CLAUDE.md` (67 KB!) — the AI-assistant rulebook: data model, translation rules (63 numbered rules), annotation guidelines, source-authority hierarchy
  - `README.md`, `LICENSE` (CC0), `CITATION.cff`

## (b) Tech stack

- **Vue 3 (Composition API, `<script setup>`) + Vite 5**, plain CSS, plain JS. Only runtime dependency: `vue ^3.4.0`; dev deps: `vite ^5.0.0`, `@vitejs/plugin-vue ^5.0.0`. No router (song switching is a `?song=N` query param + `history.replaceState`), no state library, no TypeScript, no CSS framework.
- **Build step**: yes. `.github/workflows/deploy.yml` runs `npm ci && npm run build` (Node 20) on every push to main and deploys `dist/` via `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`. `vite.config.js` sets `base: '/Winterreise/'`. Notable comment in CLAUDE.md: keep `concurrency.cancel-in-progress: false` or Pages deployments jam.
- **External resources on the live page**: Google Fonts CDN (Inter, Source Serif 4, Bitter, Playfair Display), GoatCounter analytics (`gc.zgo.at/count.js`, cookie-less), and `youtube-nocookie.com` iframes. Nothing else.
- Live site serves a **3.4 KB SPA shell** for every URL (`?song=5` and `?song=24` return the identical shell); all content is client-rendered from JSON bundled into a single JS asset (`/Winterreise/assets/index-*.js` + one CSS file). Song JSONs are imported eagerly via `import.meta.glob('../data/songs/*.json', { eager: true })` in SongView.vue.
- SEO despite SPA: static `index.html` carries JSON-LD (`WebSite` + `MusicComposition`), and App.vue rewrites `<title>`, `<meta name=description>`, and `<link rel=canonical>` on each song switch; `public/sitemap.xml` lists all 24 `?song=N` URLs; a virtual pageview is sent to GoatCounter per switch.

## (c) Song page structure (the interlinear mechanism)

Data model (per-song JSON):
```json
{ "number": 2, "title_de": "Die Wetterfahne", "title_ru": "Флюгер",
  "stanzas": [{
    "lines_de": ["Der Wind spielt mit der Wetterfahne"],
    "lines_ru": [{
      "segments": [
        {"ru":"Ветер","de":"Der Wind"}, {"ru":"играет","de":"spielt"},
        {"ru":"с","de":"mit"}, {"ru":"флюгером","de":"der Wetterfahne"}],
      "annotations": [{"type":"lang","segment_range":[3,3],"text":"..."}]
    }]
  }]
}
```
- Layout is **not "German column | translation column" in the classic sense**. Desktop is a 3-column CSS grid (`grid-template-columns: 260px 1fr 340px`): left sidebar = song list; center = the song; right = masthead/settings/player. Within the song, each line is a flex `line-pair`: `.col-de` (fixed `flex: 0 0 380px`, German line as plain italic text in the 'Bitter' serif) and `.col-ru` (flexible), rendered per line, so DE line N sits horizontally opposite its RU line N.
- The RU side is itself **interlinear**: `InterlinearLine.vue` renders each segment as `display:inline-flex; flex-direction:column` — Russian word on top (`.ru-word`, 1rem), and the corresponding German word(s) *below it* in small italic gray (`.de-gloss`, 0.75rem). Segments flow with `flex-wrap: wrap`. So the German appears twice: full line on the left, word-by-word glosses under the Russian words.
- **Word markup / hover explanations**: there are two annotation types, `lang` (blue) and `meaning` (brown), attached to segment ranges, not to individual words. `segment_range: [start,end]` (inclusive) or a list of pairs `[[s1,e1],[s2,e2]]` for discontinuous highlights; multi-line annotations use `line_span: N` + `continuation_ranges` (with `[-1,-1]` to skip a line). `src/utils/ranges.js` normalizes these (`inRanges`, `lastEnd`, `sliceRanges`).
- Rendering of an annotated segment: class `annotated` (pointer cursor), a numbered superscript `FootnoteMark` (`<sup>` with plain digits raised via `position:relative; top:-0.55em` — deliberate, because Unicode superscripts render inconsistently) placed on the **last** segment of the range. On `mouseenter` of a segment's `.ru-row`, the component emits `hoverAnn {key, y}`; SongView highlights all segments sharing that annotation key (background `var(--highlight-lang)`/`var(--highlight-meaning)`) and shows a **fixed-position tooltip** to the right of the text column: `getContentRight()` measures the widest `.col-ru .segment` via `getBoundingClientRect()`, tooltip is placed at that x + 8px, width clamped 200–280px, and if the text is too tall for the viewport it iteratively widens in 40px steps up to 720px (async `nextTick` measuring loop in `handleHover`). Tooltip text supports `*italics*` via `renderText.js` (HTML-escape then `*...*` → `<em>`).
- Below the song, two **footnote panels** (`AnnotationsPanel.vue`, "Смысл" and "Язык") list all annotations: number + quoted RU fragment (`sliceRanges` of the segments) + " || " + text. Clicking a number scrolls (`scrollIntoView smooth`) to the anchor `id="fn-<key>"` on the in-text footnote mark and flashes the highlight for 2 s.
- `variant_ru`/`variant_de` fields handle Schubert-vs-Müller sung-text divergences: variant word is absolutely positioned *above* the main RU word, and in the DE column the variant is stacked over the differing word (`getLineDeParts` in SongView).
- Checkboxes "Пояснения / Смысл / Язык" toggle annotation visibility globally; footnote numbering is computed reactively in `annNumberMap` (sorted by footnote position, independent numbering per type, optional continuous numbering for print).

## (d) Audio / recordings — IMPORTANT NEGATIVE FINDING

- Audio is provided **exclusively as YouTube embeds**. `PerformancePlayer.vue` (sidebar, collapsible "Исполнения") offers 5 performers (Quasthoff 1997, Mattei 2018, Fischer-Dieskau 1962, Anders 1945, Hotter 1942); choice persisted in `localStorage('performer')`. `src/data/performances.json` maps `videos[songNumber][performerId] -> YouTube video ID` (one video per song per performer, 24×5 IDs). Embed code:
```js
const embedSrc = computed(() =>
  videoId.value
    ? `https://www.youtube-nocookie.com/embed/${videoId.value}?rel=0&modestbranding=1&autoplay=1`
    : ''
)
```
rendered as a plain `<iframe>` with `aspect-ratio: 16/9`, `loading="lazy"`.
- **There is NO word-level (or line-level) audio-text synchronization anywhere in this project.** `grep -rn "currentTime|timeupdate|postMessage|YT\.|seekTo|audio" src/` returns nothing; no timing arrays exist in any JSON (song JSONs contain only `ru`/`de`/annotations; performances.json contains only video IDs). No mp3s in the repo, no YouTube IFrame API, no polling. The premise that this site has word-sync timing is false — if the new project wants karaoke-style sync, that mechanism must be designed from scratch (e.g., per-segment `[start,end]` seconds + `timeupdate` on an `<audio>` element, or YT IFrame API polling), it cannot be copied from here.

## (e) Index / navigation / search

- `src/data/index.json`: array of `{number, title_de, title_ru, file, ready}`; `ready:false` renders a disabled entry. Desktop: fixed sidebar `SongList` with `<a href="?song=N">` links whose default is prevented in favor of in-app switching (`@click.exact.prevent`), so middle-click/new-tab still works and each song has a crawlable URL. Deep links: `?song=N` read at startup; `history.replaceState` on switch. **No search feature exists** (CLAUDE.md's overview mentions "поиск" aspirationally, but nothing is implemented).
- Extra chrome: theme toggle (light/dark via `data-theme` attr + localStorage), "Winter" mode (`data-season="winter"` cold palette + animated snow overlay), a print/PDF menu (desktop only — renders selected songs to a hidden print sheet with A4 pagination math, `body.printing-songs` + `@media print`), and a feedback modal that composes a `mailto:` (site collects nothing).

## (f) Mobile / responsive

Single breakpoint `@media (max-width: 900px)` throughout: grid becomes block; sidebar hidden, replaced by a mobile header with prev/next arrow buttons + a `<select>` of all songs + compact checkboxes; `line-pair` stacks vertically (DE line above its RU interlinear line); annotation panels stack; hover tooltip is `display:none` — instead **tapping a footnote number opens a bottom-sheet modal** (`tap-popup`, max-height 65vh) — tap targets are enlarged with invisible `::after { inset: -10px -9px }` overlays; floating quick-nav buttons (scroll-to-top / to player / feedback) fade in for 3 s after any `touchstart`. `matchMedia('(max-width: 900px)')` gates JS behaviors (tap vs hover).

## (g) License and attribution

- **CC0 1.0 Universal** (public domain dedication) for the whole repo; README explicitly allows any use, commercial included, attribution optional but appreciated ("Евгений Обухов / Evgeny Obukhov"). `CITATION.cff` provides an optional citation entry (type: dataset). README candidly documents AI co-authorship (Claude Code) with an extensive anti-hallucination verification process (era dictionaries Adelung 1811/Campe/Grimm + DWDS/Duden, adversarial re-checking, integrity audit) and a hallucination caveat. German text follows Schubert's redaction with a documented source hierarchy (autograph 1827 → Bärenreiter NSA → Rastl → Müller WH1824).

## Other repos by evgobmm / Stenhammar 'Ithaca'

`GET /users/evgobmm/repos` lists 6 repos: `Winterreise`, `evgobmm.github.io` (just a redirect page to Winterreise), `budapest-link` (single 284-byte redirect index.html), `TMCD`, `Interdisciplinary_Project_2025_intertextual_connections`, `ver`. **No Stenhammar/Ithaca repo exists under this user**, and web searches ("evgobmm Stenhammar Ithaka interlinear github", Russian-language variants) found nothing. If such a page exists it is not public under this account.

Sources: [github.com/evgobmm/Winterreise](https://github.com/evgobmm/Winterreise), [evgobmm.github.io/Winterreise](https://evgobmm.github.io/Winterreise/), GitHub REST API (repo, trees, users/evgobmm/repos), raw.githubusercontent.com file fetches, [Wilhelm Stenhammar — Wikipedia](https://en.wikipedia.org/wiki/Wilhelm_Stenhammar) (search result confirming no related project).

## KEY FACTS
- Winterreise is a Vue 3 (Composition API) + Vite 5 SPA with a GitHub Actions build step deploying dist/ to GitHub Pages; only dependency is vue ^3.4.0 — no router, no framework beyond Vue, no TypeScript.
- All content lives in per-song JSON files src/data/songs/NN-kebab-slug.json (01-gute-nacht.json ... 24-der-leiermann.json): stanzas -> lines_de (plain strings) + lines_ru (segments of {ru, de} pairs + annotations).
- Interlinear layout: desktop shows German line left (fixed 380px flex column) and Russian right; each RU segment is an inline-flex column with the Russian word on top and its German gloss in small italic gray underneath; segments wrap with flex-wrap.
- Hover explanations are annotation-driven, not per-word: annotations of type 'lang' (blue) or 'meaning' (brown) reference segment_range [start,end] (or lists of pairs, plus line_span/continuation_ranges for multi-line); hover highlights the range and shows a fixed-position tooltip beside the text; numbered footnote panels below mirror all annotations with click-to-scroll.
- Audio is ONLY youtube-nocookie.com iframe embeds — performances.json maps song number x performer id -> YouTube video ID (5 complete recordings x 24 songs). There is NO word-level sync, no timing data of any kind, no mp3s, no timeupdate/polling code anywhere in the repo.
- Navigation: src/data/index.json catalog + sidebar list; song switching via ?song=N query param with history.replaceState, dynamic title/canonical/description rewriting, sitemap.xml of all 24 ?song URLs; there is no search feature.
- Responsive: single 900px breakpoint; mobile hides sidebar (header with prev/next + select), stacks DE above RU per line, replaces hover tooltips with tap-triggered bottom-sheet modals, enlarged invisible tap targets, touch-activated floating quick-nav buttons.
- License is CC0 1.0 (public domain); README documents Claude Code as de-facto co-author with an elaborate dictionary-based anti-hallucination pipeline; CLAUDE.md (67KB) is a full authoring rulebook including the data model and 63 translation rules.
- No Stenhammar 'Ithaca' project exists under evgobmm — the user's other Pages repos are just redirects (evgobmm.github.io redirects to Winterreise).
- Theming: CSS custom properties on :root with [data-theme=dark] and [data-season=winter] overrides, persisted in localStorage; fonts from Google Fonts CDN; analytics via cookie-less GoatCounter; extras include a print-to-PDF menu with A4 pagination and a mailto feedback modal.

## RECOMMENDATIONS
- Copy the data model wholesale — it is the proven core: per-song JSON with stanzas/lines_de/lines_ru/segments {ru, de}/annotations {type, segment_range, text}, plus index.json catalog; the README states the JSON data is 'the main value of the repository, the app is just a way to display it'.
- Reuse the segment-range annotation mechanism (ranges.js: normRanges/inRanges/lastEnd/sliceRanges, [start,end] inclusive, list-of-pairs for discontinuous, line_span + continuation_ranges with [-1,-1] skips) rather than inventing per-word tooltip markup.
- Do NOT plan on copying word-level audio sync from this project — it does not exist there. If the new project needs sync, design it fresh (e.g., add per-segment or per-line [start,end] seconds to the song JSON and drive highlighting from an <audio> timeupdate handler or the YouTube IFrame API's getCurrentTime polling).
- Keep the deployment shape: Vite with base '/<RepoName>/', GitHub Actions workflow identical to deploy.yml (Node 20, npm ci, build, upload-pages-artifact, deploy-pages, cancel-in-progress: false).
- Adopt the SPA-SEO tricks if using query-param navigation: static index.html with JSON-LD, per-song dynamic title/canonical/meta-description rewriting, sitemap.xml listing ?song=N URLs, crawlable <a href='?song=N'> links with click.prevent.
- Adopt the mobile pattern proven here: one 900px breakpoint, hover tooltips replaced by tap-opened bottom sheets, enlarged invisible tap targets via ::after inset, select-based song navigation.
- Consider CC0 + CITATION.cff + a candid AI-co-authorship note in README, mirroring the model project's licensing/attribution approach.
- Mine CLAUDE.md of the model repo (67KB rulebook) for the new project's own CLAUDE.md: data-validation scripts (scripts/validate_all.py pattern), annotation style rules, and the approval workflow (propose -> ok -> write -> show -> push) transfer directly.

## OPEN QUESTIONS
- Does the new project require word- or line-level audio synchronization? The model site has none, so this would be net-new design work (timing data format, capture workflow, player integration) — a decision is needed on whether to embed YouTube (no reliable word sync without IFrame API polling) or self-host audio (clean timeupdate sync, but licensing of recordings becomes an issue).
- Which recordings can legally be used for the new project — public-domain-era recordings (like the 1942/1945 ones used via YouTube here) vs. modern ones only as embeds?
- Should the new project keep the query-param SPA navigation (?song=N) or use real per-song routes/prerendered pages for better SEO — the model's approach works but relies on client-side meta rewriting?
- Target languages for the new interlinear (the model is DE->RU with a Russian-only UI) — UI language and gloss direction need deciding before copying components, since text like 'Пояснения/Смысл/Язык' is hardcoded in templates.
- Is the 'Ithaca' (Stenhammar) reference from the task perhaps a private or planned project? Nothing public exists under evgobmm — worth asking the user where they saw it.
