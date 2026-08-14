# Architecture research: static Schubert-lieder site (~600 songs) on GitHub Pages

Reference site check: `https://evgobmm.github.io/Winterreise/` is **not** per-page static HTML — it is a Vite-built SPA (`<div id="app">` + hashed `assets/index-*.js` bundle, Google Fonts and GoatCounter from external hosts). For 600 songs an SPA is the wrong shape (SEO, deep links, memory); the plan below deliberately diverges: **pre-rendered static page per song, generated from per-song JSON by a small build script**. This matches the site's visual style without inheriting its architecture.

---

## 1. Client-side search — recommendation: **MiniSearch (vendored), lazy-built in the browser from a plain JSON records file**

Comparison against the actual constraints (600 records, mixed Cyrillic/Latin queries, no CDN, minimal build):

| Option | Size (gzip) | Fit |
|---|---|---|
| **MiniSearch** | ~6 KB, single UMD/ESM file, zero deps, MIT | **Winner.** Inverted index, prefix + fuzzy search, per-field boosting, custom `processTerm` (needed for umlaut folding), indexes 600 short docs in <50 ms in-browser, actively maintained (v7.x) |
| Fuse.js | ~9.5 KB | Bitap fuzzy scan, no real tokenized index; multi-field ranking is mushy; fine for title-only search but weaker for "poet + first line + D number" queries |
| Lunr.js | ~8.8 KB | Effectively unmaintained for years; immutable index; language support (German/Russian) needs the clunky lunr-languages plugins; no reason to pick it in 2026 |
| Pagefind | ~30 KB initial (JS+WASM) + lazy index chunks | Excellent and fully self-hostable (no CDN), scales to 10k pages under 300 KB total transfer — but it adds a separate CLI/binary build step over rendered HTML, and its sweet spot is full-text over big sites. Overkill for 600 songs; keep as the fallback if full-text search over complete poems ever feels heavy |
| Hand-rolled JSON + matcher | ~0 | Viable, but you end up reimplementing diacritic folding, tokenization, ranking and typo tolerance for a saving of 6 KB. Not worth it |

**Concrete design:**
- Build script emits `assets/search-index.json`: an array of 600 records `{id, d, title_de, title_ru, poet_de, poet_ru, cycle, firstline_de, firstline_ru, year}` — roughly 150–250 KB raw, ~50 KB gzipped over Pages' compression.
- Do **not** ship a serialized MiniSearch index; fetch the JSON and build the index client-side on first focus of the search box (lazy). Avoids coupling to MiniSearch's serialization format and keeps the artifact human-readable.
- `processTerm`: `NFD` normalize → strip combining marks → lowercase → `ß→ss`, so `muller` matches `Müller` and `standchen` matches `Ständchen`. Cyrillic queries hit the `*_ru` fields natively. Boost: `d` and `title_*` high, `firstline_*` medium, poet low. Enable `prefix: true`, `fuzzy: 0.2`.
- **Full text of poems**: keep out of the main index. Add an opt-in "search in texts" mode that fetches a second file `assets/fulltext.json` (~600 poems ≈ 600 KB raw / ~200 KB gzipped) and indexes it on demand (~100–200 ms). If that ever outgrows comfort, that specific feature is the one to migrate to Pagefind — nothing else changes.
- Vendor `minisearch.min.js` into the repo (`assets/vendor/`). No CDN anywhere — also drop the reference site's Google Fonts habit; self-host WOFF2 or use system stacks.

## 2. Data model and toolchain

**One JSON file per song** in `data/songs/<slug>.json` (source of truth, hand-editable, clean git diffs). Recommended schema:

```jsonc
{
  "id": "d118-gretchen-am-spinnrade",     // = slug = filename
  "d": "118",                              // string: Deutsch catalog allows "118", "877/4", "Anh. I,14"
  "sortD": 118.0,                          // numeric sort key (877/4 -> 877.04)
  "title_de": "Gretchen am Spinnrade",
  "title_ru": "Гретхен за прялкой",
  "poet": { "de": "Johann Wolfgang von Goethe", "ru": "Иоганн Вольфганг фон Гёте" },
  "cycle": null,                           // or { "de": "Winterreise", "ru": "Зимний путь", "no": 5 }
  "year": 1814, "key": "d-moll", "opus": "Op. 2",
  "notes_ru": "Общий комментарий (Markdown).",
  "lines": [                               // stanza breaks: empty lines array entry or "stanza" marker
    { "words": [
        { "w": "Meine",  "ru": "мой",     "note": "притяж. мест., f.", "t": [[12.34, 12.71]] },
        { "w": "Ruh'",   "ru": "покой",   "note": "усечённое Ruhe",    "t": [[12.71, 13.40]] },
        { "w": "ist",    "ru": "есть" },
        { "w": "hin,",   "ru": "утрачен", "note": "hin sein — разг. «пропасть»" }
    ]}
  ],
  "sync": { "videoId": "kJUuv6z9jn8", "offset": 0.0 },  // ONE reference recording; must appear in videos[]
  "videos": [
    { "videoId": "kJUuv6z9jn8", "singer": "Jessye Norman", "pianist": "…",
      "year": 1985, "voice": "soprano", "note_ru": "эталонная запись" }
  ]                                        // max 5, first = default embed
}
```

Design decisions that make **incremental enrichment** work:
- Every layer is optional-by-absence: stage 1 ships `w` only; stage 2 adds `ru`/`note`; stage 3 adds `videos`; stage 4 adds `sync` + per-word `t`. The build script renders whatever exists and derives a `status` object (`{text, gloss, videos, sync}`) for badges/filters on the index page — never hand-maintain status flags.
- Timing is **inline on the word** (`t`), not a parallel array: inserting or fixing a word can't silently shift 200 timestamps. `t` is a list of `[start, end]` spans (seconds, 2 decimals) because Schubert repeats lines — the same printed word may be sung several times and should highlight each time. Build script validates: spans monotonic per span-sequence, `sync.videoId ∈ videos[].videoId`, end > start.
- Word token `w` carries its punctuation (display form); the gloss is authored per token so no re-tokenization is ever needed.

**Toolchain — plain Node, zero runtime deps:** a single `build.js` (Node 20+, template literals for HTML; no Jekyll, no bundler — add `.nojekyll`). It reads `data/songs/*.json`, validates, and emits: one HTML page per song (German text as real crawlable markup, timings/videos embedded as a `<script type="application/json">` blob + `data-i` indices on word spans), the index/cycle/poet listing pages, `search-index.json`, `fulltext.json`, `sitemap.xml`, `robots.txt`. `npm run build` = `node build.js`. Optional single devDependency: `ajv` for schema validation (or hand-rolled asserts). Python would work equally; Node wins only because the site's client JS is already JS — one language, and templates can share small helper functions.

## 3. Word-level highlight sync with YouTube

**Mechanism (documented API):** load `https://www.youtube.com/iframe_api` (note: this one external script is unavoidable and allowed — it *is* the official player; everything else stays self-hosted). Create the player with `playerVars: { playsinline: 1, origin: location.origin, rel: 0 }` and `enablejsapi`. Poll `player.getCurrentTime()`.

- **Granularity/latency:** `getCurrentTime()` is a synchronous read of a value the iframe pushes to the parent via `postMessage` (`infoDelivery` events) roughly every **~250 ms** while playing. So polling faster than ~4 Hz does not get you fresher data — it gets you the same cached value. Practical recipe for smooth highlighting: `setInterval` at **100 ms** storing `(sample, performance.now())`, then a `requestAnimationFrame` loop that extrapolates `t = sample + (now − sampleTime) × playbackRate` while state is `PLAYING`, and binary-searches the flattened `[start,end]` span list. Net absolute accuracy ≈ ±100–250 ms — invisible at lied tempo where sung words last 300 ms–2 s. Add a per-song `sync.offset` calibration field, and snap-resync on every `onStateChange`/seek. (There is an undocumented trick of listening to the `infoDelivery` `message` events directly to avoid polling — it works but can break without notice; use documented polling.)
- **iOS Safari:** unmuted autoplay is impossible; **never call `playVideo()` before a user gesture** — design the page so the user taps the embed's own play button (a gesture inside the iframe counts), then start the poll loop on `onStateChange → PLAYING`. `playsinline: 1` is mandatory — without it iPhone hijacks playback into the fullscreen native player and your highlighted text is invisible. Once playing inline, `getCurrentTime()` behaves the same as desktop. Background tabs clamp `setInterval` to ≥1 s and pause rAF — harmless, since the page isn't visible.
- **Android Chrome:** same autoplay policy family (muted autoplay allowed, unmuted needs a gesture); inline playback is the default; no extra work beyond the iOS-safe design.
- Click/tap a word → `player.seekTo(span.start, true)` — cheap, delightful, and doubles as your timing-QA tool.
- **Self-hosted audio:** technically nicer (`<audio>` `timeupdate` + rAF gives ~4–66 Hz and offline support) but hosting ripped commercial recordings is a copyright violation and GitHub will DMCA the repo; embedding via the official YouTube player is the sanctioned route (and uploader-disabled embedding is why you store up to 5 alternate videos — the client should detect embed failure, e.g. `onError` 101/150, and offer the next video; only the `sync.videoId` recording gets highlighting).

## 4. Mobile layout for the two-column gloss

**Primary pattern — interlinear word pairs, which never needs to "collapse":** each word is one flex column, words flow inline within a poem line:

```html
<span class="word" data-i="17"><span class="de">Meine</span><span class="ru">мой</span></span>
```
```css
.word { display: inline-flex; flex-direction: column; align-items: center; margin: 0 .35em .5em 0; }
.word .ru { font-size: .72em; color: var(--muted); }
.line { display: block; } /* wraps naturally at any width */
```
This is the canonical word-by-word gloss layout (same idea as `<ruby>`, but flex gives full styling control); it is intrinsically responsive — narrow screens just wrap more.

**Optional desktop "columns" view** (full German stanza left, full Russian translation right) as a toggle: same data, second rendering, CSS grid `grid-template-columns: minmax(0,1fr) minmax(0,1fr)`, collapsed to stacked below `48rem` via media query. Build script emits both renderings; toggle just swaps `hidden`.

**Hover → tap for `note` explanations:** never rely on `:hover` for content. One shared tooltip element per page; `click`/`pointerup` on `.word` toggles it (JS-positioned near the word, closes on outside tap/Escape/scroll). Add hover-open *only* under `@media (hover: hover) and (pointer: fine)` as an enhancement, so touch devices (where `:hover` is sticky/fake) get pure tap-to-show. Words with a note get a visual affordance (dotted underline). The modern `popover` attribute + `showPopover()` is baseline and works; JS positioning is still needed (CSS anchor positioning isn't universal yet), so a plain absolutely-positioned div is equally fine.

## 5. Repo & hosting layout

- **Publishing:** use the **GitHub Actions Pages workflow** (`actions/upload-pages-artifact` + `actions/deploy-pages`) running `node build.js` on push to `main` — the GitHub-recommended path when you have a build step; the repo stays source-only (no 600 generated files in diffs). Fallback if you want zero CI: commit the build output to `/docs` on `main` and set Pages source to `main:/docs` — dead simple and previewable, at the cost of noisy diffs. Do **not** use a `gh-pages` branch — that's the legacy pattern the other two replaced. Either way add `.nojekyll`.
- **Base path:** as a project site the base is `/<repo>/` (the reference site hardcodes `/Winterreise/` everywhere). Use root-relative links via a single `BASE` constant in `build.js`, or buy a custom domain later and set `BASE=/`.
- **URL scheme:** `/songs/d118-gretchen-am-spinnrade/` (folder + `index.html` → clean extensionless URLs, which GitHub Pages serves natively). Slug rules: lowercase, ASCII-transliterated German title, D number zero-padded to 3 digits (Deutsch catalog tops out at 998) — `d118`, not `d0118`; cycle members use the sub-number: `/songs/d795-01-das-wandern/`, `/songs/d911-05-der-lindenbaum/`. The slug is the JSON `id` and the filename — one identifier everywhere, never renamed after publication.
- **Repo tree:**
  ```
  data/songs/*.json      data/cycles.json  data/poets.json
  src/build.js  src/templates/  src/assets/ (css, app.js, vendor/minisearch.min.js, fonts)
  .github/workflows/pages.yml
  dist/                  # build output, gitignored (or docs/ committed, if no CI)
  ```
- **Sitemap:** 600 URLs is trivial — one `sitemap.xml` (limit is 50,000 URLs/50 MB), generated by `build.js` with `<lastmod>` from each JSON file's git/mtime; reference it from `robots.txt`; submit to Google Search Console **and Yandex Webmaster** (Russian-speaking audience — the reference site verifies with both). Also emit per-song `<title>`, `meta description`, `og:*`, and JSON-LD `MusicComposition` (composer Schubert, lyricist = poet) like the reference site does — that structured data is a large part of why it gets indexed well.

Sources: [Pagefind docs](https://pagefind.app/docs/), [Static-Site Search With Pagefind](https://staticsignal.io/posts/static-site-search-with-pagefind/), [Pagefind over Algolia and Lunr](https://dev.to/morinaga/static-site-search-for-astro-in-2026-why-i-picked-pagefind-over-algolia-and-lunr-pg1), [npm-compare client-side search](https://npm-compare.com/elasticlunr,flexsearch,fuse.js,minisearch), [fuse.js vs minisearch](https://devpick.co/fuse.js-vs-minisearch), [Top 6 JS search libraries](https://byby.dev/js-search-libraries), [YouTube IFrame Player API reference](https://developers.google.com/youtube/iframe_api_reference), [infoDelivery postMessage gist](https://gist.github.com/zavan/75ed641de5afb1296dbc02185ebf1ea0), [YouTube iframe iOS autoplay fix](https://www.technetexperts.com/youtube-iframe-ios-autoplay-fix/), [GitHub Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [actions/deploy-pages](https://github.com/actions/deploy-pages)

## KEY FACTS
- The reference site evgobmm.github.io/Winterreise is a Vite SPA (single JS bundle, div#app), not per-page static HTML, and it uses external hosts (Google Fonts, GoatCounter) — its architecture should not be copied for 600 pages
- MiniSearch is ~6 KB gzipped, a single vendorable file with zero dependencies, supports prefix/fuzzy search, field boosting and custom term processing (umlaut folding), and indexes 600 short records in under 50 ms in the browser
- Pagefind is fully self-hostable (JS+WASM+chunked index, ~30 KB initial, <300 KB total even for 10k pages) but requires a separate CLI build step over rendered HTML — overkill at 600 songs, the right fallback only for heavy full-text search
- YouTube iframe pushes currentTime to the parent via postMessage 'infoDelivery' roughly every 250 ms; player.getCurrentTime() is a synchronous read of that cached value, so polling faster than ~4 Hz yields no fresher data — smooth highlighting requires extrapolation between samples using performance.now()
- On iOS Safari, playsinline:1 is mandatory (otherwise fullscreen native player hides the page) and unmuted programmatic playback before a user gesture is blocked; a tap on the embed's own play button counts as the gesture
- Hosting ripped commercial recordings on GitHub Pages is copyright infringement subject to DMCA takedown; embedding via the official YouTube iframe player is the sanctioned alternative (with onError 101/150 fallback to alternate videos)
- GitHub Pages branch publishing supports only root or /docs on any branch; GitHub's recommended path for sites with a build step is the Actions workflow (actions/upload-pages-artifact + actions/deploy-pages); gh-pages branch is the legacy pattern
- A single sitemap.xml holds up to 50,000 URLs / 50 MB, so 600 song pages need exactly one generated file
- Deutsch catalog numbers reach 998 with sub-numbers (e.g. D 795/1–20, D 911/1–24), so slugs need 3-digit padding plus a cycle sub-number: d795-01-das-wandern
- All Schubert song texts predate 1828, so the German poems are public domain everywhere; the Russian glosses are the author's own work

## RECOMMENDATIONS
- Search: vendor MiniSearch (no CDN), ship a plain ~200 KB search-index.json of 600 metadata records built by the build script, and construct the index lazily in the browser on first search-box focus; normalize terms (NFD strip diacritics, ß→ss) so ASCII queries match umlauts; keep full poem text in a second on-demand fulltext.json
- Data model: one hand-editable JSON per song in data/songs/<slug>.json; words as objects {w, ru?, note?, t?} inside lines, so text→gloss→videos→timing can be added incrementally with clean git diffs; timing inline per word as a list of [start,end] spans (handles Schubert's sung repetitions), tied to one sync.videoId that must be present in videos[] (max 5); build script derives status flags, never hand-maintain them
- Toolchain: single build.js on Node 20+, zero runtime dependencies (template literals for HTML, optional ajv as sole devDependency for validation); it emits song pages with crawlable German text plus embedded JSON timing blob, listing pages, search indexes, sitemap.xml, robots.txt, .nojekyll
- Word sync: official YouTube IFrame API with playerVars {playsinline:1, origin}; poll getCurrentTime() every 100 ms and extrapolate in a requestAnimationFrame loop (value itself updates ~every 250 ms); never autoplay — start the loop on onStateChange PLAYING after the user taps play; per-song sync.offset for calibration; tap-a-word seekTo as both feature and timing-QA tool; do not self-host ripped recordings
- Mobile: interlinear layout — each word an inline-flex column (German above, smaller Russian below) that wraps naturally at any width, with an optional desktop-only side-by-side stanza view; note explanations open on tap everywhere via one shared JS-positioned tooltip, with hover added only under @media (hover:hover) and (pointer:fine)
- Hosting: deploy via the official GitHub Actions Pages workflow building from main (source-only repo); fallback to committed /docs on main if zero CI is preferred; avoid gh-pages branch; clean URLs as /songs/d118-gretchen-am-spinnrade/ (folder + index.html), 3-digit D padding, cycle songs as d911-05-...; one generated sitemap.xml referenced from robots.txt and submitted to both Google Search Console and Yandex Webmaster; per-song JSON-LD MusicComposition metadata like the reference site

## OPEN QUESTIONS
- Should the sung text (with Schubert's line repetitions) be stored explicitly when it diverges from the printed poem, or is multi-span per-word timing (t: [[s1,e1],[s2,e2]]) sufficient for all 600 songs? Multi-strophe settings where the same words repeat with different music may strain the simple model
- Slug precedent: the task example used d0118 (4-digit padding) but 3 digits suffice for the Deutsch catalog — confirm the preferred padding before publishing any URLs, since slugs must never change
- Winner-take-all vs hybrid search: is full-text search over complete German poems a launch requirement (affects whether the fulltext.json second index is built now or later, and whether Pagefind ever enters the picture)
- Custom domain plans: staying on username.github.io/<repo>/ requires the BASE path constant everywhere; deciding on a custom domain early avoids a later URL migration and Search Console/Yandex re-verification
- YouTube video persistence: what fallback UX is wanted when the sync reference recording is taken down (timing data becomes orphaned) — re-time against a new recording, or display untimed with a notice
- Are there plans for user-visible progress/status badges (text-only vs glossed vs synced) on the index page, which would make the derived status object part of the public UI and the search filters
