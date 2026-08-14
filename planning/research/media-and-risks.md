# Research & Risk Analysis: 600-Song Schubert Lieder Site with Embedded YouTube Performances and Word-Level Sync

## 1. Curating "significant" performances

### 1.1 The canon to draw from (generations x voice types)

- **Historic (pre-1960, mostly PD recordings now):** Elisabeth Schumann, Lotte Lehmann, Karl Erb, Gerhard Hüsch, **Hans Hotter** (Winterreise with Gerald Moore, EMI 1954), early Elisabeth Schwarzkopf, Irmgard Seefried.
- **Post-war golden age:** **Dietrich Fischer-Dieskau** (the reference: complete male-voice Lieder with Gerald Moore on DG, 21 CDs, plus earlier EMI cycles), Hermann Prey, **Peter Schreier** (with Richter, Schiff), **Janet Baker**, **Elly Ameling**, Gundula Janowitz, Christa Ludwig, **Brigitte Fassbaender** (a landmark female Winterreise), Margaret Price, Lucia Popp, Arleen Augér.
- **Current generations:** **Matthias Goerne** (Harmonia Mundi Schubert edition, 12 volumes), **Ian Bostridge** (Warner/EMI + Hyperion), **Christoph Prégardien** (with Staier/Gees), Christian Gerhaher (Sony), Mark Padmore/Paul Lewis, Florian Boesch, **Diana Damrau**, Carolyn Sampson (BIS), Benjamin Appl, Julian Prégardien, Konstantin Krimmel.
- **Complete editions — critical for the ~450 rare songs:** the **Hyperion Schubert Edition** (Graham Johnson; 40 CDs of which 37 are Schubert's songs, 60+ singers incl. Baker, Fassbaender, Bostridge, Popp, Hampson) and the **Naxos Deutsche Schubert-Lied-Edition** (Ulrich Eisenlohr, ~38 discs). For many obscure Lieder these editions (plus Fischer-Dieskau/Moore for male-voice songs) will be the *only* YouTube sources. Hyperion's catalog is now on streaming/YouTube since Universal acquired the label. Sources: [Presto — Hyperion Schubert Edition Vol. 37](https://www.prestomusic.com/classical/products/7926368--the-hyperion-schubert-edition-complete-songs-volume-37), [Kirkville on complete Schubert sets](https://kirkville.com/why-are-there-so-few-complete-sets-of-schuberts-lieder/).

**Practical curation rule per song:** aim for diversity across the 5 slots — one historic voice, one Fischer-Dieskau-generation reference, one modern male, one female voice, one "interesting" reading (fortepiano/HIP, e.g. Staier or a tenor/soprano transposition). For rare songs accept 1–3 videos (Hyperion/Naxos/DG topic uploads).

### 1.2 Official vs fan uploads, and link rot

- **Official** = named label channels (Deutsche Grammophon, Warner Classics, harmonia mundi, Naxos, Alpha, BIS) **plus YouTube auto-generated "Topic" channels** ("Provided to YouTube by…"). Topic channels cover nearly the entire catalog of the labels above and are the best-coverage official source. Risks even for official uploads: **region blocking** (per-territory licensing), **embedding disabled** on some videos, and **re-delivery churn** — when a label re-delivers an album, the video ID can change, which kills both the embed and any sync data keyed to it.
- **Fan uploads** are often the only source for historic recordings (Hotter 1954, Lehmann, Schumann). Takedown risk is real but shrinking for the oldest material: EU neighboring rights on recordings expire 70 years after publication (pre-~1955 recordings now PD in the EU), and the US Music Modernization Act put pre-1923 recordings in the PD in 2022 with 1923–1946 recordings following on a 100-year clock. Modern-catalog rips (e.g., a fan upload of a 2019 Goerne album) are the highest-takedown-risk category — avoid them entirely; the same recording almost always exists on a Topic channel.
- **Rule:** the **one sync-target video per song must be an official/Topic upload, embeddable, and not region-restricted** in your main audience territories. Fan uploads are acceptable only in the four alternate slots, preferably for pre-1955 historic recordings.

### 1.3 Metadata storage and dead-link detection

Store per video in repo JSON: `videoId`, `title`, `channelId`, `channelTitle`, `durationISO8601`, `singer`, `pianist`, `recordingYear`, `label`, `embeddable`, `regionRestriction`, `role` (`sync-target` | `alternate`), `dateAdded`, `lastChecked`, `status`.

**YouTube Data API v3 vs oEmbed:**

| | Data API v3 | oEmbed |
|---|---|---|
| Auth | Free API key (Google Cloud project) | None |
| Quota | **10,000 units/day free**; `videos.list` = **1 unit** and batches **up to 50 IDs per call** → all 3,000 videos verifiable in ~60 units (<1% of daily quota) | No published quota; 1 request per video |
| Data | Duration, `status.embeddable`, `privacyStatus`, `contentDetails.regionRestriction`, channel — everything you need | Title, author, thumbnail only; **no duration, no region/embeddable info** |
| Dead-link signal | Video absent from response | **404** = deleted/invalid ID; **401/403** = embedding disabled/restricted (use GET, not HEAD, and the `www.` host) |

**Recommendation:** ingest and weekly-verify with the Data API via a GitHub Actions cron job that diffs status and auto-opens an issue when a `sync-target` dies; keep an oEmbed fallback checker for keyless local use. Sources: [YouTube API quota guide](https://www.getphyllo.com/post/youtube-api-limits-how-to-calculate-api-usage-cost-and-fix-exceeded-api-quota), [quota-tracking write-up](https://dev.to/siyabuilt/youtubes-api-quota-is-10000-unitsday-heres-how-i-track-100k-videos-without-hitting-it-5d8h), [oEmbed overview](https://queen.raae.codes/2022-01-21-yt-oembed/), [oEmbed status-code behavior](https://www.drupal.org/project/media_youtube/issues/1783322), [oEmbed field reference](https://www.oembedproviders.com/oembed-providers/youtube/).

## 2. Feasibility math (~600–630 solo Lieder in the Deutsch catalog)

Typical Lied text: 60–150 words, 1.5–5 min audio (outliers: Erlkönig ~225 words; ballads like Der Taucher run 15–25 min and >1,000 words — treat ballads as special cases).

| Task | Per-song estimate | 600-song total |
|---|---|---|
| (a) Literal word-by-word translation + per-word glosses | 1–3 h with LLM-drafted first pass + human verification; 3–6 h fully manual | **1,000–1,800 h** (dominant cost) |
| (b) Curating 5 videos | ~20–40 min famous songs (abundance), ~30–60 min rare songs (scarcity; often <5 exist) | **~300 h** |
| (c) Word-level timing + verification | With a purpose-built tap-to-align web tool: first pass 2–4x realtime + verify pass ≈ 15–30 min; fully manual placement 1–2 h | **200–400 h** |

Auto-alignment reality check: forced alignment on **sung** German with piano accompaniment is much weaker than on speech (melisma, extreme vowel lengthening, repeats). Best current pipeline: vocal separation (Demucs) → MFA or WhisperX as a draft → human correction; MFA's boundaries are notably more accurate than WhisperX's word timestamps ([WhisperX issue #1247](https://github.com/m-bain/whisperX/issues/1247), [MFA state-of-alignment survey](https://arxiv.org/pdf/2606.18466)). Correcting a draft is usually faster than tapping from scratch, but budget human verification for *every* song — this is the step users will judge you on.

**Total: roughly 1,500–2,500 person-hours ≈ 1–1.5 FTE-years; at a 10 h/week hobby pace, 3–5 years for full coverage.** Tiering is therefore mandatory, and estimates must be re-based after a pilot (see phasing).

### Tiers
- **Tier 1 (58 songs):** Die schöne Müllerin (20) + Winterreise (24) + Schwanengesang (14). Full treatment: 5 curated videos, word-by-word translation, verified sync.
- **Tier 2 (~100 songs):** the famous standalones — Erlkönig, Gretchen am Spinnrade, Ellens Gesang III (Ave Maria), Der Tod und das Mädchen, An die Musik, Die Forelle, Heidenröslein, Du bist die Ruh, Nacht und Träume, Der Musensohn, Ständchen D.889, An Silvia, Auf dem Wasser zu singen, Litanei, Der Wanderer, Ganymed, Rastlose Liebe, Der Hirt auf dem Felsen, Wanderers Nachtlied I/II, Die junge Nonne, Im Frühling, Frühlingsglaube, Seligkeit, Lachen und Weinen, Der Zwerg, Abendstern, Fischerweise, Im Abendrot, Nachtviolen… Full treatment.
- **Tier 3 (~450 songs):** page with German text + **line-level** translation, 1–3 videos (mostly Hyperion/Naxos/DG Topic uploads); word-level gloss and sync deferred.

**Which enrichments can lag:** ship pages progressively — (1) text + line translation first, (2) one video, (3) full 5-video curation, (4) per-word glosses, (5) sync. Mark completeness per song in front-matter (`draft/reviewed/final` per facet) and render honest "in progress" badges. Sync should always lag translation; never block publishing a page on sync.

## 3. Legal

- **Embedding:** using YouTube's official IFrame embed of videos whose uploaders enabled embedding is squarely within YouTube's ToS and standard practice; you host no audio. EU case law (BestWater/GS Media line) treats embedding lawfully-available content as non-infringing, while embedding *known-infringing* uploads is grayer — one more reason the default should be official/Topic uploads.
- **German texts — public domain, with minor edge cases.** Schubert died in 1828 and every poet he set died in the 19th century; the last survivors (Bauernfeld and Leitner, d. 1890) fell out of even life+70 protection by 1961. This includes the German *translations* Schubert set (Storck's Scott, Schlegel's/Bauernfeld's Shakespeare, Harold's Ossian) — all their translators are long dead. Real edge cases are **editions, not texts**: German law gives 25-year protection to scholarly editions (§70 UrhG) and first publications of previously unpublished works (§71) — so take texts from old editions or plain-text sources rather than reproducing editorial apparatus/normalizations from the ongoing Neue Schubert-Ausgabe (Bärenreiter). Also: texts *on* LiederNet/IMSLP are PD, but those sites' translations and notes are copyrighted — never copy their Russian/English translations. Schubert's word changes vs. the poet's original are an editorial documentation task, not a legal one.
- **Your Russian translations** are original works (derivatives of PD texts), fully owned by the project. **Recommended licensing split, stated in README/LICENSE:** code — MIT; German poem texts — public domain (no license claim); **translations, commentary, and timing data — CC BY-SA 4.0**. BY-SA fits a public GitHub repo: it invites contribution and reuse while requiring attribution and share-alike (blocking closed republication of your hardest-won asset). Choose CC BY 4.0 instead only if maximum uptake matters more than share-back.
- Don't host audio excerpts, and if you add scores, use PD scans (old Peters/Breitkopf via IMSLP), not modern engraved editions.

## 4. Other risks

- **Translation QC at scale:** the risk is inconsistency and unreviewed-LLM errors, not any single mistake. Mitigate with a project glossary for recurring Romantic vocabulary (Bächlein, Wehmut, hold, Au…), a style guide for the word-by-word gloss format, per-song review status tracked in front-matter, a second-reader pass for Tiers 1–2, and random sampling audits of Tier 3.
- **Sync data invalidation:** key every timing file to a specific `videoId` **and store the video's duration as a checksum**; a "same" recording re-uploaded from a different master won't align. Add a single global `offsetMs` field per timing file so a re-upload of the identical master can be re-linked by measuring one anchor point instead of redoing the song. The weekly checker must treat a dead `sync-target` as a P1 issue. Prefer sync targets from long-stable official uploads of catalog recordings.
- **IFrame API on mobile:** autoplay with sound is blocked without a user gesture on iOS/Android — design the player to start on tap, never on load; set `playsinline: 1` or iOS forces fullscreen and hides your synced text; there is no `timeupdate` event, so poll `getCurrentTime()` on `requestAnimationFrame` while playing (accuracy is adequate — tens of ms — but expect throttling in background tabs). Load **one** real iframe per page (the sync target) and render the 4 alternates as thumbnail façades that instantiate a player on click — each live YouTube iframe costs ~1 MB+ of JS and 5 upfront embeds would wreck mobile load times. Consider the `youtube-nocookie.com` embed domain. Sources: [IFrame API reference](https://developers.google.com/youtube/iframe_api_reference), [player parameters](https://developers.google.com/youtube/player_parameters).
- **GitHub Pages limits — not a concern.** Limits are: published site ≤ 1 GB, soft 100 GB/month bandwidth, soft 10 builds/hour (waived when deploying via a custom GitHub Actions workflow). 600 text-heavy pages + JSON timing files ≈ 30–60 MB total; all video bytes come from YouTube's CDN, not Pages; 100 GB/month supports on the order of a million page views. Use an Actions-based deploy to escape the build cap. Sources: [GitHub Pages limits (official docs)](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [community discussion](https://github.com/orgs/community/discussions/28089).

## 5. Suggested phasing

- **Phase 0 — infrastructure (2–4 weeks):** data schema (one YAML/JSON per song: D-number, poet, text, translation blocks, `videos[]`, `sync{videoId, durationChecksum, offsetMs, words[]}`); static site generator + Actions deploy; sync-player component (tap-to-start, `playsinline`, rAF polling, façade embeds); internal tap-to-align tool with MFA/WhisperX draft import; Data-API link-checker cron.
- **Phase 1 — pilot (2–3 months): Winterreise (24 songs) end-to-end.** This calibrates all three per-song estimates against reality before you commit to the plan; revise the totals in §2 from measured numbers.
- **Phase 2 (6–12 months):** remaining cycles (Müllerin + Schwanengesang, 34 songs), then Tier 2 (~100 famous songs), translation-first pipeline with video curation and sync lagging one sprint behind.
- **Phase 3 (ongoing, years):** Tier 3 long tail — batch-generate draft pages (text + LLM-draft line translation clearly badged "unreviewed"), 1–3 videos each from the complete editions; promote songs to full treatment on demand or by request. 
- **Continuous:** weekly link-check CI with auto-issues, quarterly curation review, community PRs (clean under CC BY-SA), and a public roadmap page showing per-song completeness so partial coverage reads as a feature, not neglect.

## KEY FACTS
- YouTube Data API v3 is free with a 10,000-unit/day default quota; videos.list costs 1 unit and batches up to 50 video IDs per call, so all ~3,000 project videos can be verified daily for ~60 units (<1% of quota)
- YouTube oEmbed (https://www.youtube.com/oembed?url=...&format=json) needs no API key and returns title/author/thumbnail; 404 means deleted/invalid video, 401/403 means embedding disabled or restricted — but it provides no duration, region-restriction, or embeddable flag, and no batching
- GitHub Pages limits (1 GB published site, soft 100 GB/month bandwidth, soft 10 builds/hour — waived with a custom Actions workflow) are irrelevant for ~30–60 MB of static pages; video bandwidth is carried by YouTube, not Pages
- All texts Schubert set (including German translations of Scott, Shakespeare, Ossian) are public domain worldwide — every author/translator died by 1890, so life+70 expired by 1961; the only copyright edge cases are modern scholarly editions (25-year German §70/§71 UrhG protection) and translations/notes on sites like LiederNet, which must not be copied
- Two complete recorded editions exist and are essential for the ~450 rare songs: Hyperion Schubert Edition (Graham Johnson, 37 Schubert discs, 60+ singers) and Naxos Deutsche Schubert-Lied-Edition (~38 discs, Ulrich Eisenlohr), plus Fischer-Dieskau/Moore on DG for male-voice songs; most are available via official label/Topic YouTube channels
- Forced alignment of sung classical German is unreliable out of the box; MFA gives notably better word boundaries than WhisperX, and the practical pipeline is vocal separation (Demucs) + aligner draft + mandatory human correction
- Total effort estimate for full 600-song treatment is roughly 1,500–2,500 person-hours (translation with per-word glosses is the dominant cost at 1,000–1,800 h), i.e. 3–5 years at 10 h/week — tiering is mandatory
- YouTube IFrame API on mobile: sound autoplay is blocked without a user gesture, playsinline:1 is required to prevent iOS fullscreen takeover, and there is no timeupdate event — current time must be polled (rAF) during playback

## RECOMMENDATIONS
- Make the one sync-target video per song an official label or auto-generated Topic upload that is embeddable and not region-blocked in your main audience territories; allow fan uploads only as alternates, preferably for pre-1955 historic recordings that are PD in the EU
- Store rich per-video metadata in repo JSON (videoId, channel, duration, performers, label, year, embeddable, regionRestriction, role, lastChecked, status) and run a weekly GitHub Actions cron using YouTube Data API videos.list (50 IDs/call) that auto-opens an issue when any sync-target video dies; keep oEmbed as a keyless fallback checker
- Key every timing file to a specific videoId plus the video's duration as a checksum, and include a global offsetMs field so a re-uploaded identical master can be re-linked from one anchor point instead of re-timing the song
- Tier the corpus: Tier 1 = the three cycles (58 songs, full treatment), Tier 2 = ~100 most famous standalones (full treatment), Tier 3 = ~450 rest (text + line-level translation + 1–3 videos, sync deferred); let enrichments lag in order text → line translation → first video → 5 videos → per-word gloss → sync, with per-facet status badges
- Pilot Winterreise (24 songs) end-to-end first to calibrate real per-song effort before committing to the full plan
- Build an internal tap-to-align web tool and seed it with Demucs + MFA/WhisperX drafts; budget human verification (~15–30 min/song with tooling) for every synced song
- License split: code MIT; German poem texts explicitly marked public domain; original Russian translations, commentary, and timing data under CC BY-SA 4.0, stated clearly in README/LICENSE
- Take German texts from old PD editions or plain-text sources, never reproducing editorial matter from the modern Neue Schubert-Ausgabe, and never copy translations from LiederNet or similar sites
- In the player, load only the sync-target as a live iframe (thumbnail facades for the 4 alternates, instantiated on click), start playback only on user tap, set playsinline:1, and poll getCurrentTime() via requestAnimationFrame for word highlighting
- Deploy GitHub Pages via a custom Actions workflow (escapes the 10-builds/hour soft cap) and keep audio/waveform binaries out of the repo
- Translation QC: maintain a glossary of recurring Romantic vocabulary and a gloss-format style guide, track draft/reviewed/final status per song, require a second-reader pass for Tiers 1–2, and sample-audit Tier 3 LLM-assisted drafts

## OPEN QUESTIONS
- Which recording per song becomes the sync target when the best interpretation exists only as a fan upload (e.g., Hotter's 1954 Winterreise) — accept higher link-rot risk or sync against a less iconic official upload?
- Exact scope of 'all Lieder': solo songs only (~630 D-numbers) or also part-songs, fragments, and multiple settings of the same poem (e.g., four versions of some texts) — this changes the denominator and the page-per-song data model
- Word-level gloss format for Russian readers: interlinear per-word table vs hover tooltips vs parallel columns — affects both per-song effort and the data schema, and should be decided during the Winterreise pilot
- Whether region-blocking of official uploads matters for the actual audience geography (notably availability of DG/Warner Topic uploads in Russia and CIS countries) — needs empirical checking from target regions before locking sync targets
- Whether to accept community-contributed timings/translations via PRs from day one (needs contribution guidelines and review capacity) or keep the corpus single-author until Tier 1–2 are done
- Choice between CC BY-SA 4.0 (share-alike protection) and CC BY 4.0 (maximum reuse) for the translations — depends on how much the author cares about downstream closed republication
