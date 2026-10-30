'use strict';
// ARGCHECK 版2の再検査：3つの手の効きが足し算で近似できるかの抜き取り（measure.js と同じ取り方、policy0 と smart1）
const path=require('path');const root=path.resolve(process.argv[2]);global.window=global;
for(const f of ['js/core.js','js/data/accounts.js','js/data/kubun.js',...require(root+'/tools/ramen-files').story])require(root+'/'+f);
const D=global.SIMDATA,wd=D.world,C=D.coef,fs=require('fs'),raw=fs.readFileSync(root+'/tools/sim-ramen.js','utf8');
const a=raw.indexOf('function smartBase('),z=raw.indexOf('// 基礎の手だけの店',a);
const smart=new Function('Wd','BW','C','D',raw.slice(a,z)+';return smartX;')(wd,D.bowl,C,D);
const cp=x=>JSON.parse(JSON.stringify(x)),opts={noCards:true};
function value(W,seq,mod){let s=0;for(const pol of seq){const r=wd.month(W,{...pol,...mod},opts);s+=r.res.op;W=r.W;}return s/seq.length;}
const out=[];
for(const area of ['shotengai','ekimae','jutaku'])for(const form of ['part1','part2'])for(let seed=1;seed<=10;seed++)for(const [name,fn] of [['policy0',(W,p)=>wd.policy0(W,p)],['smart1',W=>smart(W,1)]]){
 let W=wd.create({seed,area,form,tier:0}),prev;
 for(let t=0;t<=18;t++){const p=fn(W,prev);if(t===18){const snap=cp(W),seq=[];let s=cp(W),pv=prev;for(let k=0;k<12;k++){const q=fn(s,pv);seq.push(q);s=wd.month(s,q,opts).W;pv=q;}
  const all={map:true,sns:true,forecast:true},none={map:false,sns:false,forecast:false};
  const vAll=value(snap,seq,all),vNone=value(snap,seq,none);
  const single=['map','sns','forecast'].reduce((s,k)=>s+value(snap,seq,{...none,[k]:true})-vNone,0);
  const drop=['map','sns','forecast'].reduce((s,k)=>s+vAll-value(snap,seq,{...all,[k]:false}),0);
  out.push({name,joint:vAll-vNone,sumOn:single,sumOff:drop});}
 const r=wd.month(W,p,opts);W=r.W;prev=p;}}
for(const n of ['policy0','smart1']){const xs=out.filter(x=>x.name===n);const ratio=k=>xs.map(x=>x[k]/x.joint).sort((a,b)=>a-b);const q=v=>[v[0],v[Math.floor(v.length/2)],v.at(-1)].map(x=>x.toFixed(3));
 console.log(n,'n',xs.length,'joint中央',Math.round(xs.map(x=>x.joint).sort((a,b)=>a-b)[30]),'単独onの和/同時 min/med/max',q(ratio('sumOn')).join('/'),'単独offの和/同時',q(ratio('sumOff')).join('/'));}
