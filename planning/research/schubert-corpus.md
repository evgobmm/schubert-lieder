# Schubert Lieder Corpus — Research Report

## 1. Scope and count

**Consensus figure: "over 600" solo Lieder for voice and piano.** Concrete anchor numbers from real editions:

- **603 songs** — the old Breitkopf & Härtel complete edition (*Franz Schubert's Werke*, Alte Gesamtausgabe/AGA), Serie XX "Lieder und Gesänge", 10 volumes, Leipzig 1894–95, numbers its solo songs 1–603. Scans are public domain on IMSLP: https://imslp.org/wiki/Franz_Schubert%27s_Werke_(Schubert,_Franz)
- **~630** is the figure most modern scholarship converges on once later-discovered songs and fragments are added (Grove/Britannica-level sources say "over 600"; exact totals vary by counting rules).
- **729 songs / "over 700 texts"** — the Hyperion *Schubert: The Complete Songs* (Graham Johnson, 40 CDs, recorded 1987–2005) counts ~729 items because it includes alternative versions and fragments: https://www.hyperion-records.co.uk/dc.asp?dc=D_CDS44201%2F40
- **~700 poems set** — Malcolm Wren's schubertsong.uk (based on Peter Rastl's critical text edition) covers "the full text of all of the German poems that Franz Schubert set" ≈ 700 poems: https://www.schubertsong.uk/about/
- Poets: Schubert set texts by **more than 150 poets** (Harvard Poetry / OpenLearn figures).

**Catalog frame:** Otto Erich Deutsch, *Schubert Thematic Catalogue* (1951, London; revised German edition 1978 as part of the Neue Schubert-Ausgabe). D numbers run to D 998 plus appendices (Anh. I doubtful/spurious, II arrangements, III copies); the 1978 revision renumbered some works (e.g. D 993 → D 2E). https://en.wikipedia.org/wiki/Schubert_Thematic_Catalogue

**Cycles (confirmed):** Die schöne Müllerin D 795 / Op. 25 = 20 songs; Winterreise D 911 / Op. 89 = 24 songs (2×12); Schwanengesang D 957 = 14 songs — a posthumous publisher's collection, not an authorial cycle (7 Rellstab + 6 Heine + "Die Taubenpost" D 965A on Seidl).

**How scholars delimit "all Schubert songs" — the complications:**
- **Multiple settings of one poem** count as separate songs (each has its own D number): e.g. Goethe's "Nur wer die Sehnsucht kennt" was set 6 times, "Der Jüngling am Bache" 3 times. The Wikipedia list marks these "1st setting / 2nd setting".
- **Multiple versions of one setting** (Schubert's own revisions) share a D number and are counted as one song with versions (e.g. Erlkönig D 328 exists in 4 versions). Hyperion's 729 counts many of these separately — the main reason totals diverge.
- **Fragments and sketches** — dozens of incomplete songs; some performable/completed by others (Reinhard van Hoorickx made many completions). Included or excluded depending on the edition.
- **Part-songs vs solo Lieder** — the standard scholarly boundary is the Neue Schubert-Ausgabe (Bärenreiter, 1956–2027): **Serie IV = Lieder (solo voice + piano, 15 volumes in 21 part-volumes)** vs Serie III = part-songs (vocal ensembles). Solo songs with obbligato instrument ("Der Hirt auf dem Felsen" D 965 with clarinet, "Auf dem Strom" D 943 with horn) are conventionally kept inside "the songs".
- **Spurious works** ("Adieu", actually by A. H. von Weyrauch) are catalogued separately (D Anh.).

Practical recommendation baked into the numbers: the project's target corpus is realistically **~600–630 canonical songs (~700 poem-texts if versions/fragments are included)**.

## 2. Machine-readable complete lists

| Source | Coverage | Full German texts? | License / scraping |
|---|---|---|---|
| **Wikipedia "List of songs by Franz Schubert"** https://en.wikipedia.org/wiki/List_of_songs_by_Franz_Schubert | Complete secular vocal output; sections: Part songs / Lieder / exercises / fragments / spurious; Lieder tables carry D number, genre, title, **incipit**, scoring, date, opus, setting/version notes, NSE references; solo-Lieder-with-piano section is chunked by D ranges D 1–998 + appendix | No — incipits only | **CC BY-SA 4.0**; fully machine-readable via MediaWiki API (`action=parse`). **Best available skeleton for the site's catalog data.** |
| **Wikidata** https://query.wikidata.org | Weak: my SPARQL count (Aug 2026) found only **344 items with P86 (composer) = Q7312 Schubert**, of which ~234 are typed as musical works — most individual Lieder have no item | No | CC0, ideal license, but **coverage far too sparse to serve as the song list**; could be a target for later data donation |
| **IMSLP** https://imslp.org | Near-complete as **PD scores**: AGA Serie XX = 603 songs; also Peters/Friedländer edition; individual work pages per D number | Texts only as underlaid words in scanned scores | Scans tagged Public Domain per file; wiki text CC BY-SA; no API, but predictable URLs; scraping tolerated in moderation |
| **schubert-online.at** https://schubert-online.at/activpage/index.php?lang=E | World's largest digital Schubert collection: **500+ autograph manuscripts, 600+ first/early editions** + letters; run by the Austrian Academy of Sciences (ACDH-CH) with Vienna City Library, ÖNB, Berlin StaBi, NL Norway | **Images only, no transcribed texts** | Free access; image reuse governed by the owning libraries; use as authority/provenance links, not as data source |
| **LiederNet Archive** https://www.lieder.net/lieder/get_settings.html?ComposerId=2520 | Effectively complete for Schubert's songs; organized by cycle/collection + alphabetical settings list; texts edited by **Peter Rastl** (guest editor) to Schubert's as-set wording; translations in 20+ languages incl. some Russian | **Yes — the best open-web source of texts as sung** | No formal open license. The German texts themselves are PD, but "the database and the collection of HTML pages … are copyright" (http://www.lieder.net/lieder/copyright.html); translations individually copyrighted. **For bulk reuse, contact Emily Ezust; or transcribe texts independently from PD scores** |
| Bonus: **schubertlied.de** (Peter Schöne) https://www.schubertlied.de/en | **501 songs online so far** (target: complete by 2028, Schubert's 200th death anniversary); texts as sung + free recordings; DE/EN/FR | Yes | Volunteer project, © site; good cross-check, not a data source |
| Bonus: **schubertsong.uk** (Malcolm Wren) https://www.schubertsong.uk/about/ | **All ~700 poems** Schubert set; text in both modern and **original spelling as Schubert knew it**; line-by-line English prose translations; based on Rastl's critical edition | Yes | "Copyright © Schubert Song Texts", no open license; author invites contact (malcolmwren55@gmail.com) — worth asking for cooperation |

## 3. Authoritative sources for the German texts AS SUNG

The scholarly chain of authority:
1. **Maximilian & Lilly Schochow, *Franz Schubert. Die Texte seiner einstimmig komponierten Lieder und ihre Dichter***, 2 vols (1974; 2nd ed. Olms 1997, 744 pp.) — the classic critical collection of the texts exactly as Schubert set them, organized by poet. On archive.org (controlled lending): https://archive.org/details/franzschubertdie0000schu
2. **Peter Rastl's updated edition** (*Die Texte seiner Lieder und Gesänge und ihre Dichter*) — the current state of the art; Rastl contributed this text corpus to LiederNet (he is credited as Guest Editor across Schubert entries) and it underlies schubertsong.uk. LiederNet entries annotate exactly where Schubert's sung text departs from the poet's original.
3. **Neue Schubert-Ausgabe, Serie IV: Lieder** (Bärenreiter, 15 vols) — the critical musical edition; texts as underlaid.
4. **Public-domain provenance route:** AGA Serie XX (1894–95) and the Peters/Friedländer edition on IMSLP — transcribing the underlaid text from these PD scans gives the project a legally unencumbered "as sung" text (with the caveat that these 19th-century editions occasionally normalize; cross-check against LiederNet/Rastl).
5. English-language reference: Richard Wigmore, *Schubert: The Complete Song Texts* (Schirmer 1988; also the Hyperion BKS44201/40 companion) — texts as set, copyrighted translations.

**Public-domain status: fully clear.** Schubert died 1828. The last-surviving poets he set are Eduard von Bauernfeld (1802–1890) and Karl Gottfried von Leitner (1800–1890, confirmed: https://en.wikipedia.org/wiki/Karl_Gottfried_von_Leitner); Franz von Schober died 1882, J. G. Seidl 1875, Rückert 1866, Heine 1856. German translators Schubert used (Adam Storck for Scott's *Lady of the Lake* d. 1822; Edmund von Harold for Ossian d. 1808) are equally long dead. **Every original German text is public domain worldwide** (all life+70 terms lapsed by 1961). Copyright can subsist only in modern editorial apparatus/commentary, not in the raw texts — so independent transcription is safe.

## 4. Grouping schemes in real references

- **Wikipedia list:** genre → publication status (lifetime opus / posthumous opus / unpublished) → D-number ranges. Scholarly, but poor for browsing.
- **LiederNet:** cycles/collections first, then one huge alphabetical settings list.
- **Hyperion complete edition (final box):** strictly **chronological by composition date**.
- **Naxos Deutsche Schubert-Lied-Edition:** **by poet** (Goethe vols., Schiller, Mayrhofer, "Poets of Sensibility"…) — proven to work well for Schubert.
- **schubertlied.de / Oxford Song (oxfordsong.org):** alphabetical title index + poet index + cycle pages.

**Recommended combination for a ~600-song browsing/search site:** use the **D number as the canonical ID and URL key** (unique, universal, ≈chronological), then offer four entry points: (a) **cycles/collections** as curated front-door lists (Müllerin 20, Winterreise 24, Schwanengesang 14, plus Op.-groupings); (b) **poet index** (150+ poets; Goethe ~70+ settings, Schiller ~40, Mayrhofer ~47, Müller 44); (c) **alphabetical title + first-line (incipit) index** — essential because titles repeat ("Ständchen", "An den Mond" ×2, "Nur wer die Sehnsucht kennt" ×6); (d) full-text search. Opus numbers and year should be displayed metadata/filters, not primary navigation (many songs have no opus). Model multiple settings of one poem as siblings of a single poem page — one word-by-word translation can then serve several settings, with per-setting deviation notes.

## 5. Russian translations (context)

The Russian tradition is **equirhythmic/singing translation**, not literal:
- **Viktor Kolomiytsev**, *Тексты песен Шуберта. 100 стихотворений* (Leningrad, 1933) — 100 texts, equirhythmic (translator d. 1936 → now PD in Russia).
- **Sergey Zayaitsky** — Russian singing text of *Winterreise* (d. 1930 → PD); see https://voplit.ru/article/zimnij-put-myullera-shuberta-v-lichnom-dele-sergeya-zayaitskogo/
- ***Die schöne Müllerin*** known in Russian in versions by **Ilya Tyumenev** (d. 1927, PD) and **Alexey Mashistov** (d. 1977 — **still under copyright** in RF until 2048); Soviet Muzgiz/«Музыка» vocal scores carry these texts.
- Classic poetic translations of the underlying poems (Zhukovsky's «Лесной царь» for Erlkönig etc.) are PD but translate the poem, not Schubert's sung variant.
- Online: lyricstranslate.com has scattered amateur Russian translations (https://lyricstranslate.com/en/franz-schubert-lyrics.html, user-generated, unclear rights); LiederNet shows RUS tags on some songs (e.g. Schwanengesang numbers). **No complete literal word-by-word Russian corpus exists — the project fills a genuine gap** and avoids the copyright problems of Soviet singing translations.

## Licensing bottom line
- German texts: **PD worldwide** — free to publish.
- Catalog metadata: build from **Wikipedia list (CC BY-SA 4.0, attribute + share-alike the derived list)**, verify against Deutsch numbers.
- Texts: transcribe from **PD scores (IMSLP)** or negotiate with LiederNet (Rastl corpus) / schubertsong.uk rather than scraping — their compilations claim copyright even though the texts are PD.
- The project's own Russian literal translations: fully yours to license.

## KEY FACTS
- Scholarly consensus: Schubert wrote over 600 solo Lieder for voice and piano; the 1894-95 Breitkopf complete edition (AGA Serie XX, on IMSLP, public domain) contains exactly 603 songs; Hyperion's complete recording (40 CDs, Graham Johnson, 1987-2005) counts ~729 including versions/fragments; Rastl/Wren count ~700 poems set.
- Deutsch catalogue (1951, rev. 1978) numbers run to D 998 plus appendices; multiple settings of one poem get separate D numbers (e.g. 'Nur wer die Sehnsucht kennt' set 6 times), Schubert's own revisions are 'versions' under one D number (Erlkönig D 328 has 4) — the main reason counts diverge.
- Standard scholarly delimitation: Neue Schubert-Ausgabe Serie IV = solo Lieder (15 vols in 21 part-volumes) vs Serie III = part-songs; solo songs with obbligato instrument (D 943, D 965) stay in the Lieder corpus.
- Cycles confirmed: Die schöne Müllerin D 795 = 20 songs, Winterreise D 911 = 24, Schwanengesang D 957 = 14 (posthumous collection: 7 Rellstab + 6 Heine + 1 Seidl).
- Wikipedia 'List of songs by Franz Schubert' is the best machine-readable skeleton (sortable tables: D number, title, incipit, scoring, date, opus, setting/version; CC BY-SA 4.0; MediaWiki API) but has incipits only, no full texts.
- Wikidata coverage is too sparse to use: SPARQL count (Aug 2026) shows only 344 items with composer=Schubert (Q7312), ~234 typed musical works — most individual Lieder have no item.
- LiederNet (lieder.net) hosts effectively complete Schubert texts AS SUNG, edited by Peter Rastl (successor to Schochow's 2-vol critical text edition), with deviation notes vs the original poems — but the site claims compilation copyright and has no open license; bulk reuse needs permission from Emily Ezust.
- schubertsong.uk (Malcolm Wren) has all ~700 poems in both modern and original spelling with line-by-line English prose translations, based on Rastl's edition; schubertlied.de (Peter Schöne) has 501 songs online with texts and free recordings, targeting completeness by 2028.
- All German texts are public domain worldwide: Schubert d. 1828; the last-surviving poets he set, Bauernfeld and Leitner, both died 1890; translators Schubert used (Storck d. 1822, Harold d. 1808) also long PD.
- Russian tradition is equirhythmic singing translation, not literal: Kolomiytsev 1933 (100 texts, PD), Zayaitsky's Winterreise (PD), Tyumenev (PD) and Mashistov (d. 1977, copyrighted in RF until 2048) for Die schöne Müllerin; no complete literal word-by-word Russian corpus exists.
- schubert-online.at (Austrian Academy of Sciences) offers 500+ autograph manuscripts and 600+ first/early editions as free scans — provenance/authority resource only, no transcribed texts.

## RECOMMENDATIONS
- Target corpus: ~600-630 canonical songs (one entry per D number), with versions and substantial fragments as sub-entries; advertise the corpus as 'all Schubert Lieder per Neue Schubert-Ausgabe Serie IV'.
- Build the catalog database from the Wikipedia 'List of songs by Franz Schubert' tables via the MediaWiki API (CC BY-SA 4.0 — attribute and share the derived list alike), keyed by D number.
- Source German texts by transcribing from public-domain scores (AGA Serie XX / Peters edition on IMSLP) for clean legal provenance, cross-checking wording against LiederNet's Rastl-edited texts; alternatively approach Emily Ezust (LiederNet) and Malcolm Wren (schubertsong.uk, malcolmwren55@gmail.com) about reusing the Rastl corpus — do not silently scrape either site.
- Site structure: D number as canonical ID/URL; primary browse = D-number (chronological) order; facets/indexes for poet (150+ poets), cycle/collection, opus, year; alphabetical title + first-line (incipit) index because titles repeat; model multiple settings of one poem as siblings of a single poem page so one word-by-word translation serves several settings.
- Record per song: text as sung vs poet's original (deviations matter for a literal translation project); show Schubert's alterations explicitly — this is a differentiator no Russian resource offers.
- Do not reuse Soviet singing translations as base text: Mashistov's (d. 1977) and other mid-20th-century translations are still copyrighted in Russia; PD ones (Kolomiytsev, Zayaitsky, Tyumenev) can be quoted as context/comparison only.
- Link each song to schubert-online.at manuscript/first-edition scans and to IMSLP score pages for scholarly credibility at zero licensing cost.

## OPEN QUESTIONS
- Exact inclusion policy: include fragments/sketches and songs with orchestral or chamber accompaniment, or restrict to voice+piano? (Determines whether the count is ~600 or ~700.)
- How to present Schubert's own multiple versions of one song in a word-by-word format — one translation with variant notes, or separate pages per version?
- Whether LiederNet/Rastl and/or Malcolm Wren will grant reuse of their critical text corpus, which would save hundreds of hours of transcription — requires outreach.
- Which text orthography to publish: original early-19th-century spelling (as in Schubert's sources) or modernized German — schubertsong.uk offers both; a literal-translation site may want modernized main text with original spelling toggle.
- Is the Wikipedia list's versioning (NSE-based) fully aligned with the 1978 Deutsch numbers the project will use as IDs — spot-check renumbered items like D 993 → D 2E before freezing URLs.
