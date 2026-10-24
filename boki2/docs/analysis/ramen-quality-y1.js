#!/usr/bin/env node
'use strict';
// 追加依頼6386361976。係数単独感度と既存表示の観測。全て実装の月計算を使う。
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {root,D,C,Wd,apply}=require('./ramen-y1-economy-load.js');
const src=fs.readFileSync(path.join(root,'tools/sim-ramen.js'),'utf8');
const cut=(a,b)=>{const i=src.indexOf(a),j=src.indexOf(b,i);if(i<0||j<0)throw Error(a);return src.slice(i,j);};
const {play,smartX,idlePolicy}=new Function('D','Wd','BW','C',`const AREAS=['shotengai','ekimae','jutaku'];${cut('function play(seed, o = {}) {','// 1号店で実装済み')}${cut("const SMART = ['常連と地図'",'// 比較する店の口座')}${cut('function idlePolicy(W) {','function idleCounts()')}return {play,smartX,idlePolicy};`)(D,Wd,D.bowl,C);
const out=path.join(__dirname,'ramen-quality-y1-results');fs.mkdirSync(out,{recursive:true});
const med=a=>{a=a.slice().sort((x,y)=>x-y);return a.length?a[Math.floor(a.length/2)]:null;};
const wilson=(k,n)=>{const z=1.96,p=k/n,d=1+z*z/n,c=(p+z*z/2/n)/d,h=z/d*Math.sqrt(p*(1-p)/n+z*z/4/n/n);return {k,n,pct:p*100,lo:100*(c-h),hi:100*(c+h)};};
const paired=(a,b)=>{const rng=D.rng(991),xs=[];for(let k=0;k<2000;k++){let v=0;for(let i=0;i<a.length;i++){const ix=Math.floor(rng()*a.length);v+=Number(a[ix])-Number(b[ix]);}xs.push(v/a.length*100);}xs.sort((x,y)=>x-y);return {points:100*(a.filter(Boolean).length-b.filter(Boolean).length)/a.length,lo:xs[50],hi:xs[1950],method:'同一seed対のブートストラップ、2000回、rng991'};};
const cases=[['base',{},null],['no_tweak',{},'no_tweak'],['no_hygiene',{},'no_hygiene'],['supplier_std',{},'supplier_std'],['price750',{},'price750'],['supplier_fixed0',{supplierHighFixed:0},null],['supplier_premium0',{supplierHighMul:1},null],['rep_fast',{repAlpha:.35},null],['no_decay',{decay:0},null]];
const outputs=[];
for(const [name,coefs,policyCase]of cases){
 apply('base');for(const [k,v]of Object.entries(coefs))C.table[k].v=v;
 const rs=[];
 for(let seed=0;seed<300;seed++){
  const quality=W=>{const p=smartX(W,1);if(policyCase==='no_tweak')p.tweak=false;if(policyCase==='no_hygiene')p.haccp=false;if(policyCase==='supplier_std')p.supplier='std';if(policyCase==='price750')p.price=W.t<12?750:p.price;return p;};
  const q=play(seed,{months:60,policy:quality}),i=play(seed,{months:60,policy:idlePolicy});
  const pack=r=>({first:r.hist.slice(0,12).findIndex(h=>h.res.op>0),nc3:Wd.netCash((r.hist[35]||r.hist.at(-1)).after),nc5:Wd.netCash(r.W),hist:r.hist.map(h=>({t:h.k,op:h.res.op,R:h.res.R,L:h.res.L,F:h.res.F,N:h.res.N,other:h.res.other,cogs:h.res.cogs,ads:h.res.ads,lost:h.res.lost,sales:h.res.sales}))});
  rs.push({seed,q:pack(q),idle:pack(i)});
 }
 const early=x=>x.first>=0&&x.first<=6;
 const row={name,coefs,policyCase,rangeErrors:C.check(),quality: wilson(rs.filter(r=>early(r.q)).length,300),idle:wilson(rs.filter(r=>early(r.idle)).length,300),earlyDiff:paired(rs.map(r=>early(r.q)),rs.map(r=>early(r.idle))),win3:wilson(rs.filter(r=>r.q.nc3>r.idle.nc3).length,300),win5:wilson(rs.filter(r=>r.q.nc5>r.idle.nc5).length,300),nc3gap:med(rs.map(r=>r.q.nc3-r.idle.nc3)),nc5gap:med(rs.map(r=>r.q.nc5-r.idle.nc5)),months:Array.from({length:12},(_,t)=>{const pairedRows=rs.filter(r=>r.q.hist[t]&&r.idle.hist[t]);const x={t,observed:pairedRows.length};for(const k of ['op','R','L','F','N','other','cogs','ads','lost']){x[k]={q:med(pairedRows.map(r=>r.q.hist[t][k])),idle:med(pairedRows.map(r=>r.idle.hist[t][k])),pairedGap:med(pairedRows.map(r=>r.q.hist[t][k]-r.idle.hist[t][k]))};}for(const [k,dec]of [['R',2],['L',1],['F',0]]){const show=v=>Number((k==='F'?100*v:v).toFixed(dec));x[k].displayGap=med(pairedRows.map(r=>show(r.q.hist[t][k])-show(r.idle.hist[t][k])));x[k].displayBetter=wilson(pairedRows.filter(r=>show(r.q.hist[t][k])>show(r.idle.hist[t][k])).length,300);}return x;})};
 outputs.push(row);fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({runs:300,base:'6ff66e6',sourceSha256:crypto.createHash('sha256').update(src).digest('hex'),cases:outputs},null,2)+'\n');
 fs.writeFileSync(path.join(out,name+'-runs.jsonl'),rs.map(r=>JSON.stringify(r)).join('\n')+'\n');console.log(name+' '+JSON.stringify({quality:row.quality,earlyDiff:row.earlyDiff,win3:row.win3,win5:row.win5}));
}
apply('base');
