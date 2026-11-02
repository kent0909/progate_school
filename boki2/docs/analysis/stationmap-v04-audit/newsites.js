const load=f=>{delete globalThis.SIMDATA; require(f); return globalThis.SIMDATA.tokyo23};
const A=load(process.argv[2]), J=load(process.argv[3]);
const old=new Set(J.sites.map(s=>s.l01)); const nw=A.sites.filter(s=>!old.has(s.l01));
console.log('jm sites',J.sites.length,'all sites',A.sites.length,'new-only',nw.length);
let r=20261030; const rnd=()=>{r=(r*1103515245+12345)%2147483648; return r/2147483648};
const pick=[]; const pool=[...nw]; for(let k=0;k<25;k++){pick.push(pool.splice(Math.floor(rnd()*pool.length),1)[0])}
const st=Object.fromEntries(A.stations.map(s=>[s.id,s.name]));
pick.forEach((s,i)=>console.log(i+1,s.id,st[s.st],s.town,s.type,s.zone,'|',s.desc));
