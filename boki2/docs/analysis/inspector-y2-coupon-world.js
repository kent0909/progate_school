// coupon_dualの現金だけを独立に比較する検査。抽選結果を固定した反実仮想の資料であり、自然な発生率ではない。
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(process.argv[2]);global.window=global;
for(const f of ['js/core.js','js/data/accounts.js','js/data/kubun.js','js/sim/store.js',...require(root+'/tools/ramen-files.js').story])require(path.join(root,f));
const D=SIMDATA,resolve=D.decide.resolve;let selected;
D.decide.resolve=(card,option,W,rng)=>card.id==='coupon_dual'?{id:selected,outcome:card.options.find(o=>o.id===option).outcomes.find(x=>x.id===selected),weights:D.decide.weights(card,option,W)}:resolve(card,option,W,rng);
const fields=['cogs','wasteCost','labor','rent','util','other','ads','interest','repay'];
const cases=[];
for(let seed=0;seed<300;seed++){
 let W=D.world.create({seed});
 for(let t=0;t<12;t++)W=D.world.month(W,D.world.policy0(W),{noCards:true,noFactors:true}).W;
 for(const option of ['check','post'])for(const outcome of option==='check'?['ok','fine']:['ok','warn']){
  selected=outcome;const pol=D.world.policy0(W),expected=-Math.round(W.last.sales*0.03/1000)*1000;
  const a=D.world.month(W,pol,{noCards:true,noFactors:true,carry:[{id:'coupon_dual',option,t:11}]}),b=D.world.month(W,pol,{noCards:true,noFactors:true,carry:[]});
  const delta=a.W.cash-b.W.cash,operatingDelta=a.res.sales-b.res.sales-fields.reduce((n,k)=>n+(a.res[k]-b.res[k]),0);
  const isolated=delta-operatingDelta;
  assert.equal(a.res.choices.find(x=>x.card==='coupon_dual').cash,expected);
  assert.equal(isolated,expected,'営業の変化を除くと値引きの現金だけが減る');
  cases.push({seed,option,outcome,priorSales:W.last.sales,expected,worldDelta:delta,operatingDelta,isolated,difference:isolated-expected});
 }
}
const result={head:'8defe7edb35317cf9e4ed907e5538555ad4aec9f',cases:cases.length,maxDifference:Math.max(...cases.map(x=>Math.abs(x.difference))),minDiscount:Math.min(...cases.map(x=>-x.expected)),maxDiscount:Math.max(...cases.map(x=>-x.expected)),details:cases};
fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,details:undefined}));
