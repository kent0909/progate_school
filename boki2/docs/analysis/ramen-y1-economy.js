#!/usr/bin/env node
'use strict';
// 実装の公式検査から方針とplayをそのまま読み出す。旧impl-checkのsmartXとの差を持ち込まない。
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {root,D,C,Wd,apply,configs}=require('./ramen-y1-economy-load.js');
const src=fs.readFileSync(path.join(root,'tools/sim-ramen.js'),'utf8');
function between(a,b) { const i=src.indexOf(a),j=src.indexOf(b,i);if(i<0||j<0||src.indexOf(a,i+1)>=0)throw Error('検査の構造が変わった: '+a);return src.slice(i,j); }
const policies=new Function('D','Wd','BW','C',`const AREAS=['shotengai','ekimae','jutaku'];
${between('function play(seed, o = {}) {','// 1号店で実装済み')}
${between("const SMART = ['常連と地図'",'// 比較する店の口座')}
${between('function idlePolicy(W) {','function idleCounts()')}
return {play,smartX,idlePolicy,basicPolicy,SMART};`)(D,Wd,D.bowl,C);
const {play,smartX,idlePolicy,SMART}=policies;
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1];};
const runs=Number(arg('--runs',300)),selected=arg('--variants',Object.keys(configs).join(',')).split(',');
if(!Number.isInteger(runs)||runs<120)throw Error('120周以上が必要');
const median=a=>{a=a.slice().sort((a,b)=>a-b);return a.length?a[Math.floor(a.length/2)]:null;};
function proportion(k,n){if(!n)return {k,n,pct:null,lo:null,hi:null};const z=1.96,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z/d*Math.sqrt(p*(1-p)/n+z*z/(4*n*n));return {k,n,pct:100*p,lo:100*(c-h),hi:100*(c+h)};}
const rows=[],raw=[];
for(const name of selected){
  const config=apply(name);
  const kinds=[['idle',idlePolicy],['policy0',W=>Wd.policy0(W)],...SMART.map((label,st)=>['smart'+st,W=>smartX(W,st)])];
  for(const [kind,policy] of kinds){
    const sample=[];
    for(let seed=0;seed<runs;seed++){
      const r=play(seed,{months:36,policy});
      const h=r.hist.slice(0,12),first=h.findIndex(x=>x.res.op>0),cash=[C('ownCash')+C('loan')-C('fitout')-C('deposit')-C('equipOpen'),...h.map(x=>x.after.cash)];
      const months=h.map(x=>({t:x.k,N:x.res.N,op:x.res.op,cash:x.after.cash,netCash:Wd.netCash(x.after),R:x.res.R,L:x.res.L,repay:x.res.repay,rent:x.res.rent,other:x.res.other}));
      const record={variant:name,kind,seed,area:r.hist[0].W.area,first:first<0?null:first,minCash:Math.min(...cash),sumOp:h.reduce((s,x)=>s+x.res.op,0),completed:h.length===12,bankruptY1:r.W.bankrupt&&r.W.t<=12,year3N:r.hist.slice(24,36).reduce((s,x)=>s+x.res.N,0)/12,months};
      raw.push(record);sample.push(record);
    }
    const row={variant:name,label:config.label,kind,runs,coef:config.coef,rangeErrors:config.rangeErrors,
      any:proportion(sample.filter(r=>r.first!==null).length,runs),bySep:proportion(sample.filter(r=>r.first!==null&&r.first<=5).length,runs),byOct:proportion(sample.filter(r=>r.first!==null&&r.first<=6).length,runs),
      firstMedian:median(sample.map(r=>r.first===null?12:r.first)),firstConditionalMedian:median(sample.filter(r=>r.first!==null).map(r=>r.first)),
      firstDistribution:Array.from({length:13},(_,t)=>proportion(sample.filter(r=>(r.first===null?12:r.first)===t).length,runs)),
      medianAnnualOp:median(sample.map(r=>r.sumOp)),medianMonthlyOp:median(sample.flatMap(r=>r.months.map(m=>m.op))),
      minCash:{min:Math.min(...sample.map(r=>r.minCash)),p10:sample.map(r=>r.minCash).sort((a,b)=>a-b)[Math.floor(runs*.1)],median:median(sample.map(r=>r.minCash))},
      bankrupt:proportion(sample.filter(r=>r.bankruptY1).length,runs),year3N:median(sample.map(r=>r.year3N)),
      months:Array.from({length:12},(_,t)=>{const ms=sample.flatMap(r=>r.months[t]?[r.months[t]]:[]);return {t,observed:ms.length,N:median(ms.map(m=>m.N)),op:median(ms.map(m=>m.op)),cash:median(ms.map(m=>m.cash)),R:median(ms.map(m=>m.R)),L:median(ms.map(m=>m.L)),positive:proportion(ms.filter(m=>m.op>0).length,runs)};})};
    rows.push(row);console.error(name,kind,'完了');
  }
}
const result={baseCommit:'6ff66e66edf6ae375a0d72fbf4972f485eceb59a',simRamenSha256:crypto.createHash('sha256').update(src).digest('hex'),runs,rows};
const output=path.resolve(arg('--out',path.join(__dirname,'ramen-y1-economy-results')));fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(output,'runs.jsonl'),raw.map(r=>JSON.stringify(r)).join('\n')+'\n');
console.log(JSON.stringify({output,rows:rows.length,runs:raw.length}));
