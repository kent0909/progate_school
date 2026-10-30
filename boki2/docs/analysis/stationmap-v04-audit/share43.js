const path=require('path'); const root='/home/user/progate_school/boki2';
const STORY=require(root+'/tools/ramen-files.js').story;
['js/core.js','js/data/accounts.js','js/data/kubun.js','js/sim/store.js',...STORY].forEach(f=>require(path.join(root,f)));
const SIM=globalThis.SIMDATA; const Wd=SIM.world;
const W=Wd.create({seed:0,area:'shotengai'});
const ref={id:'me',price:850,R:3,A:0,L:0,bowl:SIM.bowl.create(SIM.bowl.presets[0].spec),parts:1,family:0};
const rs=t=>{const r=SIM.rivals.make(t,Math.random()*1e6|0);return {id:r.id,price:r.price,R:r.R,A:r.A,L:r.L,bowl:r.bowl,type:r.type,Q:r.Q,rival:true,open:true}};
const sh=(types,neutral=true)=>Wd.sharesFor(W,[ref,...types.map(rs)],{neutralFit:neutral})[0];
const combos=[[],['cheap'],['kodawari'],['shinise'],['cheap','shinise'],['shinise','shinise'],['cheap','cheap'],['kodawari','kodawari'],['cheap','kodawari'],['cheap','kodawari','shinise'],['cheap','shinise','shinise']];
const base=sh(['cheap','shinise']);
console.log('epsScale(seed0 3-rival calib)',W.town.areas.shotengai.epsScale.toFixed(3),'V0',W.town.areas.shotengai.V0);
for(const c of combos) console.log((c.join('+')||'0軒').padEnd(28), 's=',sh(c).toFixed(3),'ratio to 安売り+老舗',(sh(c)/base).toFixed(2));
// marginal effect of adding one rival to base combo
const add=(c,t)=>((sh([...c,t])/sh(c)-1)*100).toFixed(0)+'%';
for(const c of [[],['cheap'],['shinise'],['cheap','shinise']]) console.log('from',c.join('+')||'0軒','add cheap',add(c,'cheap'),'add kodawari',add(c,'kodawari'),'add shinise(same nest)',add(c,'shinise'));
// typeOf of own store
console.log('own typeOf',Wd.typeOf(ref));
