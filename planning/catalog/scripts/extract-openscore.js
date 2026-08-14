// Extract OpenScore Schubert lyrics (lc*.txt) and map each song folder to a catalog D number.
const fs = require('fs');
const path = require('path');
const ROOT = __dirname + '/openscore/scores/Schubert,_Franz';
const catalog = require('/workspaces/schubert-lieder/planning/catalog/catalog.json');
const catDs = new Set(catalog.map(r => r.d.replace(/\s+/g, '').toUpperCase()));

// manual overrides: folder path (set/song) -> D
const OVERRIDES = {
  '4_Gesänge_aus_„Wilhelm_Meister“,_D.877/1_Mignon_und_der_Harfner': '877/1',
  '4_Gesänge_aus_„Wilhelm_Meister“,_D.877/2_Lied_der_Mignon_(Heiss_mich_nicht_reden)': '877/2',
  '4_Gesänge_aus_„Wilhelm_Meister“,_D.877/3_Lied_der_Mignon_(So_lasst_mich_scheinen)': '877/3',
  '4_Gesänge_aus_„Wilhelm_Meister“,_D.877/4_Lied_der_Mignon_(Nur_wer_die_Sehnsucht_kennt)': '877/4',
  'Op.59/1_Du_liebst_mich_nicht': '756',
  'Op.59/2_Dass_sie_hier_gewesen': '775',
  'Op.59/3_Du_bist_die_Ruh': '776',
  'Op.59/4_Lachen_und_Weinen': '777',
  'Op.3/2_Meeres_Stille,_D.215a': '216',
  '_/Die_Forelle,_Op.32,_D550d': '550',
  'Schwanengesang,_D.957/14_Die_Taubenpost': '965A',
};

const results = [];
const problems = [];
for (const setDir of fs.readdirSync(ROOT)) {
  const setPath = path.join(ROOT, setDir);
  if (!fs.statSync(setPath).isDirectory()) continue;
  for (const songDir of fs.readdirSync(setPath)) {
    const songPath = path.join(setPath, songDir);
    if (!fs.statSync(songPath).isDirectory()) continue;
    const rel = `${setDir}/${songDir}`;
    const lc = fs.readdirSync(songPath).find(f => /^lc.*\.txt$/.test(f));
    if (!lc) { problems.push({ rel, err: 'no lyric file' }); continue; }
    let d = OVERRIDES[rel];
    if (!d) {
      // cycle member: parent D from set dir + track number from song dir
      const setD = setDir.match(/D\.?(\d+[A-Za-z]?)/);
      const trackM = songDir.match(/^(\d+)_/);
      const songD = songDir.match(/D\.?\s?(\d+[A-Za-z]?)/);
      if (songD) d = songD[1].toUpperCase();
      else if (setD && trackM) d = `${setD[1]}/${+trackM[1]}`;
    }
    if (!d) { problems.push({ rel, err: 'no D mapping' }); continue; }
    const dNorm = d.replace(/\s+/g, '').toUpperCase();
    const inCatalog = catDs.has(dNorm);
    if (!inCatalog) problems.push({ rel, err: 'D not in catalog: ' + d });
    const lyrics = fs.readFileSync(path.join(songPath, lc), 'utf8').trim();
    results.push({ d, folder: rel, lyric_file: lc, in_catalog: inCatalog, lyrics });
  }
}
results.sort((a, b) => a.d.localeCompare(b.d, undefined, { numeric: true }));
fs.writeFileSync(__dirname + '/openscore-lyrics.json', JSON.stringify(results, null, 1));
console.log('songs extracted:', results.length);
console.log('problems:', JSON.stringify(problems, null, 1));
const dupes = results.map(r=>r.d).filter((d,i,a)=>a.indexOf(d)!==i);
console.log('duplicate D:', dupes);
console.log('sample D118 first 150 chars:', JSON.stringify(results.find(r=>r.d==='118').lyrics.slice(0,150)));
