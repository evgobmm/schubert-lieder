// words.json / lineidx.json / layout.json из файла песни и маршрута (route.json = [[s,l],...]; без него — все строки по порядку)
const fs=require('fs'); const [song,routeFile]=process.argv.slice(2);
const s=JSON.parse(fs.readFileSync(song,'utf8'));
let route=routeFile&&fs.existsSync(routeFile)?JSON.parse(fs.readFileSync(routeFile,'utf8')):null;
if(!route){route=[];s.stanzas.forEach((st,i)=>st.lines_de.forEach((_,j)=>route.push([i,j])));}
const words=[],li=[];
route.forEach(([i,j])=>s.stanzas[i].lines_de[j].split(/\s+/).filter(Boolean).forEach(w=>{words.push(w);li.push(i+':'+j);}));
fs.writeFileSync('words.json',JSON.stringify(words));fs.writeFileSync('lineidx.json',JSON.stringify(li));fs.writeFileSync('route.json',JSON.stringify(route));
console.log('проходов',route.length,'слов',words.length);
