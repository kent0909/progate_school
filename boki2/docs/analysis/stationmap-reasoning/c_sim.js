// 36か月の放置の店（地図のみ・850円・パート1人）を、P_cal を基準3軒で固定し、ライバルの組と siteMul を変えて回す。札なし・週の揺れなし（期待値）
global.window=global;const path=require('path');const root='/home/user/progate_school/boki2';
const STORY=require(root+'/tools/ramen-files.js').story;
['js/core.js','js/data/accounts.js','js/data/kubun.js','js/sim/store.js',...STORY].forEach(f=>require(path.join(root,f)));
const D=window.SIMDATA,Wd=D.world,RV=D.rivals,C=D.coef;D.y2.stream=null;
const idle=W=>{const p=Wd.policy0(W,null,{neutral:true});for(const k of Wd.TIME_KEYS)p[k]=false;return {...p,price:850,parts:1,family:0,map:true,line:false,prep:'mid',flyer:0,borrow:false};};
function run(types,siteMul,o={}){
  const W=Wd.create({seed:0,area:'shotengai'});const a=W.town.areas.shotengai;
  a.potentialMul=1; // 町の幅を外す
  // 基準3軒で P_cal（create の calibrate をそのまま使い、potentialMul=1 で再計算）
  const ref={id:'ref',price:a.pRef,R:3,A:0,L:0,bowl:D.bowl.create(D.bowl.presets[0].spec),parts:1,family:0};
  const rs=r=>({id:r.id,price:r.price,R:r.R,A:r.A,L:r.L,bowl:r.bowl,type:r.type,Q:r.Q,rival:true,open:true});
  const sh=Wd.sharesFor(W,[ref,...W.rivals.map(rs)],{neutralFit:true})[0];
  const Pcal=C('median')*C('potentialScale')/sh;
  let Pnow=Pcal;
  if(o.perSite){ // 比べる案：候補地ごとに逆算
    const riv=types.map((t,k)=>RV.make(t,k));const sh2=Wd.sharesFor(W,[ref,...riv.map(rs)],{neutralFit:true})[0];Pnow=C('median')*C('potentialScale')/sh2;}
  a.P=Pnow*siteMul; W.rivals=types.map((t,k)=>RV.make(t,k));
  let x=W,ns=[],nd=[],op=[],rivOpen=[];
  for(let k=0;k<36;k++){const r=Wd.month(x,idle(x),{noise:false,noCards:true,noFactors:true,rng:D.rng(90001+k)});ns.push(r.res.N);nd.push(r.res.demand);op.push(r.res.op);x=r.W;}
  const y3=a=>a.slice(24).reduce((s,v)=>s+v,0)/12;
  return {N:y3(ns),demand:y3(nd),op3:op.slice(24).reduce((s,v)=>s+v,0),open:x.rivals.filter(r=>r.open!==false).length+'/'+x.rivals.length};
}
const sets={'3軒 基準':['cheap','kodawari','shinise'],'0軒':[],'1軒 安売り':['cheap'],'1軒 こだわり':['kodawari'],'2軒 安売り+こだわり':['cheap','kodawari'],'2軒 安売り+老舗':['cheap','shinise'],'4軒 基準+安売り':['cheap','kodawari','shinise','cheap']};
console.log('組 | siteMul | 3年目 売れた客/日 | 3年目 需要/日 | 3年目の営業利益(円,家賃は今の商店街12万) | 開いているライバル');
for(const [k,t] of Object.entries(sets))for(const m of [0.75,1,1.4]){const r=run(t,m);console.log(k,m,r.N.toFixed(1),r.demand.toFixed(1),Math.round(r.op3),r.open);}
console.log('\n段の組み合わせの代表（駅の段→ライバル数の置き値どおり）：');
// 段1駅・住宅地・〜500m：0.75*1*0.8/0.9775、ライバル1軒
const med=0.9775;
const cases=[['段1・住宅地・〜500m・1軒(安売り)',0.75*1*0.8/med,['cheap']],['段1・商店街・〜200m・1軒(こだわり)',0.75*1.15*1/med,['kodawari']],['段3・商店街・〜500m・2軒',0.95/med,['cheap','kodawari']],['段8・繁華街・〜200m・4軒(老舗なしの属性→安売り×2+こだわり×2)',1.4*1.15*1.15/med,['cheap','cheap','kodawari','kodawari']],['段8・店とオフィス・〜200m・4軒(安売り×2+こだわり×2)',1.4*1.15*1.1/med,['cheap','cheap','kodawari','kodawari']],['段6・オフィス・〜500m・3軒(安売り×2+こだわり、老舗は出ない)',1.25/med,['cheap','cheap','kodawari']]];
for(const [n,m,t] of cases){const r=run(t,m);console.log(n,'siteMul',m.toFixed(3),'N',r.N.toFixed(1),'需要',r.demand.toFixed(1),'営業利益3年目',Math.round(r.op3));}
console.log('\n比べる案（候補地ごとに逆算、siteMul=1）：');
for(const [k,t] of Object.entries(sets)){const r=run(t,1,{perSite:true});console.log(k,r.N.toFixed(1));}
