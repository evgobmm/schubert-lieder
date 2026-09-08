// words.json / lineidx.json / slots.json из файла песни и маршрута (route.json: [[s,l],...] или [{s,l,k:[...]},...])
const fs=require('fs'); const [song,routeFile]=process.argv.slice(2);
const s=JSON.parse(fs.readFileSync(song,'utf8'));
let route=routeFile&&fs.existsSync(routeFile)?JSON.parse(fs.readFileSync(routeFile,'utf8')):null;
if(!route){route=[];s.stanzas.forEach((st,i)=>st.lines_de.forEach((_,j)=>route.push([i,j])));}
const words=[],li=[],slots=[],norm=[];
route.forEach(r=>{const [i,j]=Array.isArray(r)?r:[r.s,r.l]; const lw=s.stanzas[i].lines_de[j].split(/\s+/).filter(Boolean);
  const ks=Array.isArray(r)||!r.k?lw.map((_,k)=>k):r.k; ks.forEach(k=>{words.push(lw[k]);li.push(i+':'+j);slots.push(k);}); norm.push({s:i,l:j,k:ks});});
fs.writeFileSync('words.json',JSON.stringify(words));fs.writeFileSync('lineidx.json',JSON.stringify(li));fs.writeFileSync('slots.json',JSON.stringify(slots));fs.writeFileSync('route.json',JSON.stringify(norm));
console.log('проходов',norm.length,'слов',words.length,'частичных',norm.filter(r=>r.k.length<s.stanzas[r.s].lines_de[r.l].split(/\s+/).filter(Boolean).length).length);
