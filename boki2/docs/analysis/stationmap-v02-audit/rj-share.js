global.window=global;const path=require('path');const root='/home/user/progate_school/boki2';
const STORY=require(root+'/tools/ramen-files.js').story;
['js/core.js','js/data/accounts.js','js/data/kubun.js','js/sim/store.js',...STORY].forEach(f=>require(path.join(root,f)));
const SIM=window.SIMDATA;
for(const area of Object.keys(SIM.world.AREAS)){
 const W=SIM.world.create({seed:0,area});const a=W.town.areas[W.area];
 const ref={id:'ref',price:a.pRef,R:3,A:0,L:0,bowl:SIM.bowl.create(SIM.bowl.presets[0].spec),parts:1,family:0,ref:true};
 const rs=W.rivals.map(r=>({id:r.id,price:r.price,R:r.R,A:r.A,L:r.L,bowl:r.bowl,type:r.type,Q:r.Q,rival:true,open:true}));
 const out=[];for(let k=0;k<=4;k++){const list=[ref];for(let j=0;j<k;j++)list.push({...rs[j%rs.length],id:'x'+j});out.push(SIM.world.sharesFor(W,list,{neutralFit:true})[0].toFixed(3));}
 console.log(area,W.rivals.map(r=>r.type).join(','),'share with 0..4 rivals',out.join(' '));
}
