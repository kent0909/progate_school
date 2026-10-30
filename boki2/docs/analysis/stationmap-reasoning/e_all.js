// 全575候補地：P_site=P_cal(基準3軒)×siteMul、ライバルは駅の段の数で、型は rivals.create と同じ規則（同じ型2軒まで・老舗は繁華街/店とオフィス/オフィスに出ない）を seed で引く
global.window=global;const path=require('path');const root='/home/user/progate_school/boki2';
const STORY=require(root+'/tools/ramen-files.js').story;
['js/core.js','js/data/accounts.js','js/data/kubun.js','js/sim/store.js',...STORY].forEach(f=>require(path.join(root,f)));
const D=window.SIMDATA,Wd=D.world,RV=D.rivals,C=D.coef;D.y2.stream=null;
const {rows,med}=JSON.parse(require('fs').readFileSync('rows.json'));
const MIX={office:{office:.7,family:.1,student:.05,tourist:.15},shogyo:{office:.5,family:.25,student:.1,tourist:.15},hanka:{office:.35,family:.15,student:.2,tourist:.3},shoten:{office:.3,family:.55,student:.1,tourist:.05},jutaku:{office:.15,family:.75,student:.1,tourist:0},kojo:{office:.6,family:.3,student:.1,tourist:0}};
const noShinise=new Set(['hanka','shogyo','office']);
const idle=W=>{const p=Wd.policy0(W,null,{neutral:true});for(const k of Wd.TIME_KEYS)p[k]=false;return {...p,price:850,parts:1,family:0,map:true,line:false,prep:'mid',flyer:0,borrow:false};};
const rs=r=>({id:r.id,price:r.price,R:r.R,A:r.A,L:r.L,bowl:r.bowl,type:r.type,Q:r.Q,rival:true,open:true});
function pickTypes(seed,n,type){const rng=D.rng(seed*40503+11);const out=[];let g=200;while(out.length<n&&g--){const t=['cheap','kodawari','shinise'][Math.floor(rng()*3)];if(t==='shinise'&&noShinise.has(type))continue;if(out.filter(x=>x===t).length>=2)continue;out.push(t);}return out;}
function run(siteMul,types,mixKey){
  const W=Wd.create({seed:0,area:'shotengai'});const a=W.town.areas.shotengai;a.potentialMul=1;
  const ref={id:'ref',price:a.pRef,R:3,A:0,L:0,bowl:D.bowl.create(D.bowl.presets[0].spec),parts:1,family:0};
  if(mixKey)a.mix=MIX[mixKey];
  const sh=Wd.sharesFor(W,[ref,...W.rivals.map(rs)],{neutralFit:true})[0];
  a.P=C('median')*C('potentialScale')/sh*siteMul;W.rivals=types.map((t,k)=>RV.make(t,k));
  let x=W,N=0,dem=0;for(let k=0;k<36;k++){const r=Wd.month(x,idle(x),{noise:false,noCards:true,noFactors:true,rng:D.rng(90001+k)});if(k>=24){N+=r.res.N/12;dem+=r.res.demand/12;}x=r.W;}
  return {N,dem};
}
const base=run(1,['cheap','kodawari','shinise']);
console.log('基準（3軒・siteMul1・今の商店街の mix）3年目 売れた',base.N.toFixed(1),'需要',base.dem.toFixed(1));
const out=rows.map((r,i)=>{const types=pickTypes(1000+i,r.riv,r.type);const v=run(r.m/med,types,r.type);return {...r,types:types.join('+'),N:v.N,dem:v.dem,rel:v.dem/base.dem};});
const q=(a,p)=>a[Math.floor(p*(a.length-1))];
const rel=out.map(o=>o.rel).sort((a,b)=>a-b);
console.log('需要/基準 の分布：min',rel[0].toFixed(2),'p10',q(rel,.1).toFixed(2),'p25',q(rel,.25).toFixed(2),'中央',q(rel,.5).toFixed(2),'p75',q(rel,.75).toFixed(2),'p90',q(rel,.9).toFixed(2),'max',rel[rel.length-1].toFixed(2));
console.log('44人/日に直した中央値（需要×44/基準需要）',(q(rel,.5)*44).toFixed(1),' 上限70を越える需要（44換算で>70）の候補地',out.filter(o=>o.rel*44>70).length,'/575');
const capped=out.filter(o=>o.N>=69.9).length;console.log('この試算でパート1人の上限70に張りつく候補地',capped,'/575');
for(const n of [1,2,3,4]){const a=out.filter(o=>o.riv===n).map(o=>o.rel).sort((x,y)=>x-y);console.log('ライバル',n,'軒',a.length,'か所 需要/基準 中央',q(a,.5).toFixed(2));}
for(const p of [1,2,3,4,5,6,8]){const a=out.filter(o=>o.pins===p).map(o=>o.rel).sort((x,y)=>x-y);if(a.length)console.log('駅の段 ピン',p,a.length,'か所 需要/基準 中央',q(a,.5).toFixed(2));}
for(const t of Object.keys(MIX)){const a=out.filter(o=>o.type===t).map(o=>o.rel).sort((x,y)=>x-y);console.log(t,a.length,'需要/基準 中央',q(a,.5).toFixed(2));}
// siteMul とライバルの組、どちらが需要を説明するか（対数の分散）
const lv=a=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return a.reduce((s,v)=>s+(v-m)**2,0)/a.length;};
const lsm=out.map(o=>Math.log(o.m/med)),ld=out.map(o=>Math.log(o.rel)),lr=out.map((o,i)=>ld[i]-lsm[i]);
console.log('log 需要の分散',lv(ld).toFixed(3),' うち siteMul',lv(lsm).toFixed(3),' 残り（ライバルの組・常連）',lv(lr).toFixed(3));
// 上位の候補地（需要）
out.sort((a,b)=>b.dem-a.dem);console.log('需要の上位10：');out.slice(0,10).forEach(o=>console.log(' ',o.id,o.type,'ピン',o.pins,'walk',o.walk,'siteMul',(o.m/med).toFixed(2),o.types,'需要',o.dem.toFixed(0)));
require('fs').writeFileSync('all.json',JSON.stringify(out));
