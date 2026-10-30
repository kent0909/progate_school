const load=f=>{delete globalThis.SIMDATA; require(f); return globalThis.SIMDATA.tokyo23};
const X0=load(process.argv[2]), M=load(process.argv[3]);
const st=X0.stations; const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)*1000;
// merged group of each name
const grp={}; M.stations.forEach(s=>{[s.name,...s.aliases].forEach(n=>grp[n]=s.name)});
console.log('== merged groups: member distance to hub (pre-merge pts), riders, lines');
M.stations.filter(s=>s.aliases.length).forEach(s=>{const h=st.find(x=>x.name===s.name); console.log(s.name,'pins',s.pins,'riders',s.riders, '|', s.aliases.map(a=>{const x=st.find(y=>y.name===a); return a+' '+Math.round(d(h,x))+'m r'+x.riders+' ['+x.lines.join(',')+']'}).join(' ; '), '| hub ['+h.lines.join(',')+'] r'+h.riders)});
console.log('== pre-merge pairs < 500m, not in same group');
const out=[];
for(let i=0;i<st.length;i++)for(let j=i+1;j<st.length;j++){const D=d(st[i],st[j]); if(D<500 && grp[st[i].name]!==grp[st[j].name]) out.push([Math.round(D),st[i].name,st[j].name,grp[st[i].name],grp[st[j].name],st[i].lines.join(','),st[j].lines.join(',')])}
out.sort((a,b)=>a[0]-b[0]).forEach(r=>console.log(r.join(' | ')));
console.log('== final stations pairs < 300m');
const F=M.stations; for(let i=0;i<F.length;i++)for(let j=i+1;j<F.length;j++){const D=d(F[i],F[j]); if(D<300) console.log(Math.round(D),F[i].name,F[j].name)}
