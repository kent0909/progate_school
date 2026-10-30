require(process.argv[2]); const T=globalThis.SIMDATA.tokyo23; const st=T.stations, si=T.sites;
for(const n of ['上野動物園東園','三ノ輪橋','東池袋','町屋','新大久保','京橋','新宿西口','新宿三丁目','西武新宿','西新宿','銀座','銀座一丁目','原宿','明治神宮前','御茶ノ水','新御茶ノ水','溜池山王','国会議事堂前','上野','京成上野','三越前','新日本橋','三ノ輪','秋葉原','岩本町','東京','二重橋前','虎ノ門','虎ノ門ヒルズ']){const s=st.find(x=>x.name===n); if(!s){console.log(n,'-');continue} const ss=si.filter(x=>x.st===s.id); console.log(n,'pins',s.pins,'riders',s.riders,'placed',ss.length,'aliases',s.aliases.join('/'),'lines',s.lines.join(','), ss.map(x=>x.town+':'+x.type).join(' '))}
// rent formula
const R=(p,R0)=>R0*Math.pow(p/1e7,0.25);
for(const p of [72e4,153e4,448e4,1560e4]) console.log('rent',p/1e4,'R0=28000',Math.round(R(p,28000)),'R0=28443',Math.round(R(p,28443)));
const floor=1e7*Math.pow(13000/28000,4); console.log('floor land price 万',floor/1e4,'sites under floor',si.filter(x=>x.price<floor).length);
const rents=si.map(x=>Math.max(13000,R(x.price,28000))).sort((a,b)=>a-b); console.log('rent min/med/max',Math.round(rents[0]),Math.round(rents[(rents.length/2)|0]),Math.round(rents.at(-1)));
const byT={}; si.forEach(x=>{(byT[x.type]=byT[x.type]||[]).push(Math.max(13000,R(x.price,28000)))}); for(const k in byT){const a=byT[k].sort((a,b)=>a-b); console.log(k,'rent med',Math.round(a[(a.length/2)|0]))}
// share of sites in tier3 (base); median tier of sites
const tierOf=Object.fromEntries(st.map(s=>[s.id,s.pins])); const tc={}; si.forEach(x=>tc[tierOf[x.st]]=(tc[tierOf[x.st]]||0)+1); console.log('sites by station tier',tc);
const sorted=si.map(x=>tierOf[x.st]).sort((a,b)=>a-b); console.log('median site tier',sorted[(sorted.length/2)|0]);
// walk dist distribution
const w=si.map(x=>x.walk); console.log('walk<=200',w.filter(v=>v<=200).length,'201-500',w.filter(v=>v>200&&v<=500).length,'>500',w.filter(v=>v>500).length);
// base site candidates: tier3, walk<=500 , shoten
console.log('base-like sites (tier3,201-500m,shoten)', si.filter(x=>tierOf[x.st]===3&&x.walk>200&&x.walk<=500&&x.type==='shoten').length, 'tier3 shoten any', si.filter(x=>tierOf[x.st]===3&&x.type==='shoten').length);
// zones in jutaku
const z={}; si.filter(x=>x.type==='jutaku').forEach(x=>z[x.zone]=(z[x.zone]||0)+1); console.log('jutaku zones',z);
const zk={}; si.filter(x=>x.type==='kojo').forEach(x=>zk[x.zone]=(zk[x.zone]||0)+1); console.log('kojo zones',zk);
// one-type stations
const types={}; si.forEach(x=>{(types[x.st]=types[x.st]||new Set()).add(x.type)}); console.log('stations with 1 type',Object.values(types).filter(s=>s.size===1).length,'of placed',Object.keys(types).length);
// setagaya stations pins
const set=st.filter(s=>s.ward==='世田谷区'); console.log('setagaya pins',set.reduce((a,s)=>a+s.pins,0), 'placed', si.filter(x=>set.some(s=>s.id===x.st)).length);
