'use strict';
// ARGCHECK-manager-2026-10-30 用。引数：codex/ramen-after-y2（63d071e）を取り出した boki2/ の絶対パス。
// 1店・段1・policy0 の方針に1つの手を足したときの月の営業利益の差（noCards）。社長の時間の手の金額の目安。
const path=require('path');global.window=global;
const root=process.argv[2];
for (const f of ['js/core.js','js/data/accounts.js','js/data/kubun.js',...require(path.join(root,'tools/ramen-files.js')).story]) require(path.join(root,f));
const wd=global.SIMDATA.world;
function run(seed,area,form,mod){let W=wd.create({seed,area,form,tier:1});let prev=null,ops=[];for(let k=0;k<24;k++){const p=wd.policy0(W,prev);Object.assign(p,mod);const r=wd.month(W,p,{noCards:true});W=r.W;prev=p;ops.push(r.res.op);}return ops.slice(12).reduce((s,x)=>s+x,0)/12;}
for (const area of ['shotengai','ekimae','jutaku']) for(const form of ['part1','part2']){
 let b=0,s=0,f=0,n=40;for(let seed=1;seed<=n;seed++){b+=run(seed,area,form,{});s+=run(seed,area,form,{sns:true});f+=run(seed,area,form,{forecast:true});}
 console.log(area,form,'2年目 平均op/月',Math.round(b/n),'SNS差',Math.round((s-b)/n),'予報差',Math.round((f-b)/n));
}
