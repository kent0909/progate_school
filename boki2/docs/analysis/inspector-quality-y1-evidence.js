'use strict';
// 公開済みの再実行JSONLを独立集計。表示の丸め、方針の解禁、月報と店の時点も区別する。
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(process.argv[2]),dir=path.join(root,'docs/analysis/ramen-quality-y1-results');
const {D,C,Wd,apply}=require(path.join(root,'docs/analysis/ramen-y1-economy-load.js'));apply('base');
const published=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
const med=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];
const show=(k,v)=>Number((k==='F'?100*v:v).toFixed(k==='R'?2:k==='L'?1:0));
const cases=[];
for(const row of published.cases){
 const rs=fs.readFileSync(path.join(dir,row.name+'-runs.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 assert.equal(rs.length,300);assert.deepEqual(rs.map(x=>x.seed),Array.from({length:300},(_,i)=>i));
 const good=r=>r.first>=0&&r.first<=6;
 const q=rs.filter(r=>good(r.q)).length,idle=rs.filter(r=>good(r.idle)).length;
 assert.equal(q,row.quality.k);assert.equal(idle,row.idle.k);
 const rng=D.rng(991),sample=[];
 for(let k=0;k<2000;k++){let n=0;for(let j=0;j<300;j++){const r=rs[Math.floor(rng()*300)];n+=Number(good(r.q))-Number(good(r.idle));}sample.push(n/3);}
 sample.sort((a,b)=>a-b);assert(Math.abs(sample[50]-row.earlyDiff.lo)<1e-12);assert(Math.abs(sample[1950]-row.earlyDiff.hi)<1e-12);
 const wins3=rs.filter(r=>r.q.nc3>r.idle.nc3).length,wins5=rs.filter(r=>r.q.nc5>r.idle.nc5).length;assert.equal(wins3,row.win3.k);assert.equal(wins5,row.win5.k);
 const months=[];for(let t=0;t<12;t++){
  const pairs=rs.filter(r=>r.q.hist[t]&&r.idle.hist[t]);const m={t,observed:pairs.length};
  for(const key of ['R','L','F']){
   const differences=pairs.map(r=>show(key,r.q.hist[t][key])-show(key,r.idle.hist[t][key]));
   const gap=med(differences.slice()),better=differences.filter(x=>x>0).length;
   assert(Math.abs(gap-row.months[t][key].displayGap)<1e-10);assert.equal(better,row.months[t][key].displayBetter.k);
   m[key]={displayGap:gap,better,denominator:300};
  }months.push(m);
 }
 cases.push({name:row.name,quality:q,idle,diff:(q-idle)/3,bootstrap:[sample[50],sample[1950]],wins3,wins5,months});
}
const src=fs.readFileSync(path.join(root,'tools/sim-ramen.js'),'utf8');
const cut=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b,src.indexOf(a)));
const {play,smartX,idlePolicy}=new Function('D','Wd','BW','C',`const AREAS=['shotengai','ekimae','jutaku'];${cut('function play(seed, o = {}) {','// 1号店で実装済み')}${cut("const SMART = ['常連と地図'",'// 比較する店の口座')}${cut('function idlePolicy(W) {','function idleCounts()')}return {play,smartX,idlePolicy};`)(D,Wd,D.bowl,C);
const pairs=[],illegal={},unit={days:C('days'),monthlyVisits:C('regularVisits'),oneDailyUnitToPeople:C('days')/C('regularVisits')};
for(let seed=0;seed<300;seed++){
 const q=play(seed,{months:12,policy:W=>smartX(W,1)}),idle=play(seed,{months:12,policy:idlePolicy});
 for(const k of ['tweak','haccp','map','line'])if(q.hist[0].pol[k]&&!D.ramen.opens(0).includes(k))illegal[k]=(illegal[k]||0)+1;
 pairs.push({seed,months:q.hist.map((h,t)=>({t,reportF:show('F',h.res.F),storeF:show('F',D.bowl.F(h.after.stores[0].bowl)),idleStoreF:show('F',D.bowl.F(idle.hist[t].after.stores[0].bowl))}))});
}
const storeMonths=Array.from({length:12},(_,t)=>({t,storeGap:med(pairs.map(r=>r.months[t].storeF-r.months[t].idleStoreF)),reportStoreMismatch:pairs.filter(r=>r.months[t].reportF!==r.months[t].storeF).length}));
const result={cases,firstMonthPolicyOutsideOpens:illegal,opensAt0:D.ramen.opens(0),opensAt4:D.ramen.opens(4),storeMonths,unit};
fs.writeFileSync(process.argv[4],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,cases:cases.map(c=>({...c,months:undefined}))},null,2));
