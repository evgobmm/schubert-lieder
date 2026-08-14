// Extract lyrics from .mxl (compressed MusicXML) for OpenScore folders lacking lc*.txt.
// Reads verse-numbered syllables with syllabic begin/middle/end joins, in note order of the vocal part (first part).
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = __dirname + '/openscore/scores/Schubert,_Franz';
const targets = [
  ['Op.3/2_Meeres_Stille,_D.215a', '216'],
  ['Op.3/3_Heidenröslein,_D.257', '257'],
  ['Op.92/1_Der_Musensohn,_D.764', '764'],
  ['_/Auf_dem_Wasser_zu_singen,_D.774', '774'],
  ['_/Auflösung,_D.807', '807'],
  ['_/Der_Erlkönig,_D.328', '328'],
  ['_/Im_Gegenwärtigen_Vergangenes,_D.710', '710'],
];
const out = [];
for (const [rel, d] of targets) {
  const dir = path.join(ROOT, rel);
  const mxl = fs.readdirSync(dir).find(f => f.endsWith('.mxl'));
  if (!mxl) { console.log('NO MXL:', rel); continue; }
  const tmp = '/tmp/claude-1000/mxl-' + d;
  execSync(`rm -rf ${tmp} && mkdir -p ${tmp} && cd ${tmp} && unzip -o -qq ${JSON.stringify(path.join(dir, mxl))}`);
  const xmlFile = fs.readdirSync(tmp).find(f => f.endsWith('.xml') && f !== 'container.xml') ||
    fs.readdirSync(tmp).find(f => f.endsWith('.musicxml'));
  const xml = fs.readFileSync(path.join(tmp, xmlFile), 'utf8');
  // first part only
  const partM = xml.match(/<part id="[^"]+">[\s\S]*?<\/part>/);
  const part = partM ? partM[0] : xml;
  // collect lyrics per verse number in order
  const verses = {};
  for (const noteM of part.matchAll(/<note[\s\S]*?<\/note>/g)) {
    const note = noteM[0];
    for (const lyr of note.matchAll(/<lyric[^>]*number="(\d+)"[^>]*>([\s\S]*?)<\/lyric>/g)) {
      const n = lyr[1];
      const syl = (lyr[2].match(/<syllabic>([^<]+)<\/syllabic>/) || [])[1] || 'single';
      const text = ((lyr[2].match(/<text[^>]*>([\s\S]*?)<\/text>/) || [])[1] || '')
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      if (!verses[n]) verses[n] = '';
      verses[n] += text;
      if (syl === 'single' || syl === 'end') verses[n] += ' ';
    }
  }
  const lyrics = Object.keys(verses).sort((a, b) => a - b).map(n => verses[n].replace(/\s+/g, ' ').trim()).join('\n\n');
  out.push({ d, folder: rel, source: 'mxl', lyrics });
  console.log(d, rel, '->', lyrics.length, 'chars |', lyrics.slice(0, 80));
}
fs.writeFileSync(__dirname + '/openscore-mxl-lyrics.json', JSON.stringify(out, null, 1));
