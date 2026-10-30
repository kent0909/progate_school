'use strict';
// ARGCHECK 版2の再検査：同じ町に自店が2つあるとき、1号店の手（地図・SNS）の会社全体の効きが1店のときと比べてどう変わるか
const path=require('path');const root=path.resolve(process.argv[2]);global.window=global;
for(const f of ['js/core.js','js/data/accounts.js','js/data/kubun.js',...require(root+'/tools/ramen-files').story])require(root+'/'+f);
const wd=global.SIMDATA.world,cp=x=>JSON.parse(JSON.stringify(x)),opts={noCards:true};
function value(W,seq,mod){let s=0;for(const pol of seq){const r=wd.month(W,{...pol,...mod},opts);s+=r.res.op;W=r.W;}return s/seq.length;}
const res={one:{map:[],sns:[]},sameArea:{map:[],sns:[]},otherArea:{map:[],sns:[]}};
for(const area of ['shotengai','ekimae','jutaku'])for(const form of ['part1','part2'])for(let seed=1;seed<=10;seed++){
 let W=wd.create({seed,area,form,tier:0}),prev;
 for(let t=0;t<18;t++){const p=wd.policy0(W,prev);W=wd.month(W,p,opts).W;prev=p;}
 const mk=(ar)=>{const X=cp(W);const b=wd.create({seed,area:ar,form,tier:0});const st=b.stores[0];st.id='branch';st.openedAt=X.t;X.stores.push(st);if(!X.town.areas[ar]){X.town.areas[ar]=b.town.areas[ar];X.rivals.push(...b.rivals.map(r=>({...r,id:'branch:'+r.id,area:ar})));}return X;};
 const other=['shotengai','ekimae','jutaku'].find(x=>x!==area);
 for(const [k,X] of [['one',cp(W)],['sameArea',mk(area)],['otherArea',mk(other)]]){
  const seq=[];let s=cp(X),pv=prev;for(let i=0;i<12;i++){const q=wd.policy0(s,pv);seq.push(q);s=wd.month(s,q,opts).W;pv=q;}
  const base=value(cp(X),seq,{});res[k].map.push(base-value(cp(X),seq,{map:false}));res[k].sns.push(value(cp(X),seq,{sns:true})-base);}
}
const med=v=>Math.round(v.sort((a,b)=>a-b)[Math.floor(v.length/2)]);
for(const k of Object.keys(res))console.log(k,'1号店の地図の会社全体の効き 中央',med(res[k].map),'SNS',med(res[k].sns));
