'use strict';
// ARGCHECK-manager-2026-10-30 用。引数：codex/ramen-after-y2（63d071e）を取り出した boki2/ の絶対パス。
// 1店・段1・policy0 の方針に1つの手を足したときの月の営業利益の差（noCards）。社長の時間の手の金額の目安。
const path=require('path');global.window=global;
const root=process.argv[2];
for (const f of ['js/core.js','js/data/accounts.js','js/data/kubun.js',...require(path.join(root,'tools/ramen-files.js')).story]) require(path.join(root,f));
const wd=global.SIMDATA.world;
function run(area,form,tier,mod,months=24,noise=false){let W=wd.create({seed:7,area,form,tier});let prev=null,op=0,ops=[];for(let k=0;k<months;k++){const p=wd.policy0(W,prev);Object.assign(p,mod);const r=wd.month(W,p,{noise,noCards:true,noFactors:true});W=r.W;prev=p;ops.push(Math.round(r.res.op));}return ops;}
for (const area of ['shotengai','ekimae','jutaku']) for(const form of ['part1','part2']){
 const base=run(area,form,1,{}),sns=run(area,form,1,{sns:true}),insp=run(area,form,1,{inspect:true}),fc=run(area,form,1,{forecast:true}),nomap=run(area,form,1,{map:false});
 const avg=a=>Math.round(a.slice(6).reduce((s,x)=>s+x,0)/(a.length-6));
 console.log(area,form,'base op/月',avg(base),'SNS差',avg(sns)-avg(base),'検品差',avg(insp)-avg(base),'予報差',avg(fc)-avg(base),'地図なし差',avg(nomap)-avg(base));
}
console.log(Object.keys(wd.FORMS));
