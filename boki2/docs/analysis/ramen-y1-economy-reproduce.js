#!/usr/bin/env node
'use strict';
// 依頼書の「再現」の条件を300周に増やして測る。40周は過去の記録の照合専用。
const {D,Wd,apply}=require('./ramen-y1-economy-load.js');
apply('base');
const median=a=>a.slice().sort((a,b)=>a-b)[Math.floor(a.length/2)];
const ci=(k,n)=>{const z=1.96,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z/d*Math.sqrt(p*(1-p)/n+z*z/(4*n*n));return `${k}/${n} = ${(100*p).toFixed(1)}% [${(100*(c-h)).toFixed(1)}, ${(100*(c+h)).toFixed(1)}]`;};
const mon=['4月','5月','6月','7月','8月','9月','10月','11月','12月','1月','2月','3月'];
console.log('# 依頼書の再現\n\nworld.create({seed})（商店街・中華そば）、月のrng=seed*1000+t+1。t>=3は1年目7月（依頼書の「3月」と文言は異なる）。40周は既存事実の照合だけで、推論には300周を使う。割合の[]はWilson95%。\n');
console.log('|周数|方針|4月/9月/3月の営業利益中央値（万円）|年度内黒字|初黒字中央値（全周／年度内到達周のみ）|4月/3月/3年末の客数中央値|\n|---|---|---|---|---|---|');
for(const n of [40,300])for(const kind of ['policy0','coord']){
 const rs=[];
 for(let seed=0;seed<n;seed++){
  let W=Wd.create({seed});const hist=[];
  for(let t=0;t<36;t++){
   let p=Wd.policy0(W);
   if(kind==='coord')p=Wd.fitTime(W,{...p,price:t<12?800:900,map:true,line:t>=3,sns:t>=3,sign:'small',signAt:3,flyer:t<6?30000:0},D.rng(seed*37+t));
   const r=Wd.month(W,p,{rng:D.rng(seed*1000+t+1),noFactors:true});hist.push(r.res);W=r.W;if(W.bankrupt)break;
  }
  rs.push(hist);
 }
 const first=rs.map(h=>h.slice(0,12).findIndex(r=>r.op>0));
 const m=(t,k)=>median(rs.filter(h=>h[t]).map(h=>h[t][k]));
 const med=median(first.map(t=>t<0?12:t)), conditional=median(first.filter(t=>t>=0));
 console.log(`|${n}|${kind}|${[0,5,11].map(t=>(m(t,'op')/10000).toFixed(1)).join(' / ')}|${ci(first.filter(t=>t>=0).length,n)}|${med===12?'年度内なし':mon[med]}／${conditional==null?'—':mon[conditional]}|${[0,11,35].map(t=>m(t,'N').toFixed(1)).join(' / ')}|`);
}
