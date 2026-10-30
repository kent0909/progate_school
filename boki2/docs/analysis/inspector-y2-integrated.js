// 仕事4の追加検査。既存の独立検査の記帳手順を複製し、観測のみを追加。対象本体は変更しない。
// 公開版を順に進め、全書類と札の実際の現金を照合する検査専用。対象ファイルは書き換えない。
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(process.argv[2]);global.window=global;
const lateOnly=true;
for(const f of ['js/core.js','js/data/accounts.js','js/data/kubun.js','js/sim/store.js',...require(root+'/tools/ramen-files.js').story])require(path.join(root,f));
const D=SIMDATA,B=BOKI,originalMonth=D.world.month,originalResolve=D.decide.resolve;
require(path.join(root,'js/sim/lexicon.js'));
D.world.month=(w,p,o)=>originalMonth(w,p,{...o,noFactors:true});
const value=(v,s)=>typeof v==='function'?v(s):v;
const bridgePoints=[],couponPoints=[],negativeControls=[],bulkCases=[],inventoryCases=[];
let lastState;
function observe(S,t,phase){
 const q=D.rview.bridge(S,t,{},0);
 bridgePoints.push({seed:S.seed,t,phase,rest:q.rest,unknown:q.unknown.length,raw:q.world-q.book});
 assert.equal(q.rest,0,'年1の月報の未説明差');assert.equal(q.unknown.length,0,'年1の未知現金');
 if(S.seed===0&&t===5&&phase==='after'){
  const at=S.L.findIndex(a=>a.ev==='sale5');assert(at>=0);const old=S.L[at];
  S.L[at]={...old,dr:old.dr.map((x,i)=>i===0?[x[0],x[1]+1000]:x)};
  const error=D.rview.bridge(S,t,{},0);assert.equal(error.rest,-1000);S.L[at]=old;
  const a={id:'inspector-unknown',ev:'inspector-unknown',mi:S.mi,dr:[['普通預金',1000]],cr:[['資本金',1000]]};
  S.T.push(a);S.L.push(a);const unknown=D.rview.bridge(S,t,{},0);S.T.pop();S.L.pop();
  assert.equal(unknown.rest,-1000);assert.equal(unknown.unknown.length,1);
  negativeControls.push({errorRest:error.rest,unknownRest:unknown.rest,unknownCount:unknown.unknown.length});
 }
}
function inspectCoupons(S,seed){
 for(let t=0;t<39;t++){
  const r=S.res[t];for(const x of r.choices||[]){if(x.card!=='coupon_dual')continue;
   const expected=-Math.round((S.res[t-1]?.sales??700000)*0.03/1000)*1000;
   const docs=S.T.filter(a=>a.ev==='coupon_dual-doc0@'+t),cash=docs.reduce((n,a)=>n+bank(a),0);
   assert.equal(x.cash,expected,'前月売上から独立計算した値引き');assert.equal(cash,expected,'値引きの支払書類');assert.equal(docs.length,1);
   couponPoints.push({seed,t,option:x.option,outcome:x.outcome,expected,world:x.cash,book:cash,difference:cash-x.cash});
  }
 }
}
const sum=(a,k)=>a[k].reduce((n,x)=>n+x[1],0);
const bank=a=>a.dr.reduce((n,[k,v])=>n+(k==='普通預金'||k==='現金'?v:0),0)-a.cr.reduce((n,[k,v])=>n+(k==='普通預金'||k==='現金'?v:0),0);
const bal=(s,k)=>s.T.reduce((n,a)=>n+a.dr.reduce((z,[x,v])=>z+(x===k?v:0),0)-a.cr.reduce((z,[x,v])=>z+(x===k?v:0),0),0);
const routine=/^(sale|card|cardin|buy|pap|sal|util|rent|repay|flyer|flyerpay|coupon|other|borrowed|ads-other)\d+$/;
const seenDocs=new Map(),seenOutcomes=new Set(),failures=[],examples={},paths=[];
const languageWarnings=new Map(),missingNames=new Set();
let target=null;
D.decide.resolve=(c,o,w,r)=>{
 if(target&&target.forceMap&&target.forceMap[c.id]){const id=target.forceMap[c.id];const oc=c.options.find(x=>x.id===o).outcomes.find(x=>x.id===id);if(oc)return{id:oc.id,outcome:oc,weights:D.decide.weights(c,o,w)};}
 if(target&&c.id===target.card&&o===target.option){const oc=c.options.find(x=>x.id===o).outcomes.find(x=>x.id===target.outcome);return{id:oc.id,outcome:oc,weights:D.decide.weights(c,o,w)};}
 return originalResolve(c,o,w,r);
};
function run(seed,mode,forced,alternate=false){
 target=forced;const S={seed,mode,decisions:{},T:[],L:[],discDone:{},choices:[],cardOutcomes:[],profile:{},taught:[...(D.pro3?.words||[])]};
 const teach=xs=>{for(const x of xs||[])if(!S.taught.includes(x))S.taught.push(x);};
 const name=acc=>{if(S.taught.includes(acc))return;if(!D.namings[acc])missingNames.add(acc);teach(D.namings[acc]?.teaches||[acc]);};
 const checkWords=(e,m,text,doc=false)=>{if(lateOnly||(m.year||1)<2)return;const bad=B.lex.unknown(text,new Set([...S.taught,...(e.teaches||[])] )).filter(w=>!doc||!(w in B.lex.docWords));if(bad.length){const k=e.id+'/'+bad.join('/');languageWarnings.set(k,{id:e.id,words:bad,text:text.slice(0,160),seed,mode});}};
 const cashByT={},cardEntriesByT={},routineByT={},issues=[];let n=0;
 function record(a,id,m,mi,isCard){
  assert(a&&a.dr&&a.cr,id);assert.equal(sum(a,'dr'),sum(a,'cr'),id+' 貸借不一致');
  for(const[k,v]of [...a.dr,...a.cr])assert(Number.isFinite(v)&&v>=0,id+' 負数/非有限 '+k+' '+v);
  const t=m.ramenT??m.bookT;
  if(isCard&&t!=null)cashByT[t]=(cashByT[t]||0)+bank(a);
  if(isCard&&t!=null&&bank(a))(cardEntriesByT[t]||=[]).push({id,cash:bank(a)});
  if(routine.test(id)&&t!=null)routineByT[t]=(routineByT[t]||0)+bank(a);
  const row={...a,id:id+'@mi'+mi,ev:id,mi,y:m.year||1};S.T.push(row);S.L.push(JSON.parse(JSON.stringify(row)));
 }
 for(let mi=0;mi<D.months.length;mi++){
  const m=D.months[mi];S.mi=mi;
  for(const e of m.events){
   if(e.when&&!e.when(S))continue;
   for(const acc of e.names||[])name(acc);
   if(e.t==='talk')checkWords(e,m,value(e.lines,S).map(x=>x[1]).join(''));
   if(e.t==='calc')checkWords(e,m,[e.title,e.q,e.why,...(value(e.rows,S)||[]).flat().filter(x=>typeof x==='string')].join(' '));
   if(e.t==='board')for(const st of e.steps||[])teach(st.teaches);
   if(e.t==='decision'){
    const choices=(e.optionsFor?e.optionsFor(S):e.options).filter(o=>!o.disabled);
    checkWords(e,m,[e.q,...choices.flatMap(o=>[o.label,o.desc,o.result])].join(' '));
    let wanted=forced&&e.card===forced.card?forced.option:null;
    const defaults={site:'shotengai',form:'part1',supplier:'std',maintain:'repair',bonus:'standard',capital:'half'};
    wanted=wanted||(forced&&forced.decisions&&forced.decisions[e.card||e.id.split('@')[0]])||defaults[e.card||e.id.split('@')[0]];
    const selected=choices.find(o=>o.id===wanted)||(alternate?choices[choices.length-1]:choices[0]);
    assert(selected,e.id+' 選択不可');S.decisions[e.id]=selected.id;
   }else if(e.t==='plan'){
    let pol=D.ramen.policy(S,e.ramenT);
    if(forced&&forced.policy)pol=D.world.fitTime(S.W,{...pol,...forced.policy},D.rng(seed*7+e.ramenT));
    if(forced&&forced.lowCost)pol=D.world.fitTime(S.W,{...pol,price:850,flyer:0,coupon:false,borrow:false},D.rng(seed*7+e.ramenT));
    D.ramen.plan(S,e.ramenT,pol);
    for(const x of S.res[e.ramenT].choices||[])seenOutcomes.add([x.card,x.option,x.outcome].join('/'));
   }else if(e.t==='discover'){S.discDone[e.id]=mi;teach(e.b4?.teaches);}
   else if(e.t==='doc'){
    const a=value(e.ans,S);n++;
    for(const[acc]of [...a.dr,...a.cr])name(acc);
    checkWords(e,m,[e.doc.title,...value(e.doc.rows,S).flat().filter(x=>typeof x==='string')].join(' '),true);
    if(m.year>=2){
     seenDocs.set(e.id,(seenDocs.get(e.id)||0)+1);
     assert(a.dr.length&&a.cr.length,e.id+' 全0円');
     for(const[,v]of [...a.dr,...a.cr])assert(v>0,e.id+' 正解0円');
     const rows=value(e.doc.rows,S);assert(!rows.some(r=>r[2]==='amt'&&r[1]===0),e.id+' 表0円');
     if(!examples[e.id])examples[e.id]={doc:{title:e.doc.title,rows},answer:a,seed,mode};
    }
    const card=m.year>=2&&!routine.test(e.id)&&!/^tax-pay/.test(e.id);
    record(a,e.id,m,mi,card);
   }else if(e.t==='rreport'){
    if(e.ramenT<12)observe(S,e.ramenT,'before');
    for(const a of e.auto(S))record(a,a.id,m,mi,/^fx/.test(a.id));
    if(e.ramenT<12)observe(S,e.ramenT,'after');
   }else if(e.t==='closing'){
    teach(['損益','繰越利益剰余金','締め切り','当期純利益','決算振替']);
    const rev=[],cost=[];
    for(const[k,v]of Object.entries(B.accounts)){const x=bal(S,k);if(v.cat==='収益'&&x)rev.push([k,-x]);if(v.cat==='費用'&&x)cost.push([k,x]);}
    const net=rev.reduce((n,x)=>n+x[1],0)-cost.reduce((n,x)=>n+x[1],0);
    record({dr:[...rev,...(net<0?[['繰越利益剰余金',-net]]:[])],cr:[...cost,...(net>=0?[['繰越利益剰余金',net]]:[])]},e.id,m,mi,false);
   }
   if(e.t==='opening')teach(['前期繰越','開始記入']);
   teach(e.teaches);
  }
 }
 inspectCoupons(S,seed);
 for(let t=12;t<39;t++){
  const r=S.res[t],world=(r.choices||[]).reduce((n,x)=>n+x.cash,0),book=cashByT[t]||0;
  if(book!==world)issues.push({t,worldCardCash:world,bookCardCash:book,difference:book-world,choices:r.choices,entries:cardEntriesByT[t]||[]});
  // 対象の照合関数を使わず、通帳の決済条件から通常営業の現金を別計算する。
  const prev=S.res[t-1],cashSales=Math.round(r.sales*.7),takeout=Math.round(cashSales*.05),eat=cashSales-takeout;
  const prevCredit=prev.sales-Math.round(prev.sales*.7),creditGross=prevCredit+Math.floor(prevCredit*.1);
  const materials=Math.round(prev.cogs+prev.wasteCost),rent=Math.round(r.rent);
  const coupon=(S.pols[t].coupon?Math.round(cashSales/.95)-cashSales:0);
  const expected=cashSales+Math.floor(eat*.1)+Math.floor(takeout*.08)+creditGross-Math.round(creditGross*.0324)-materials-Math.floor(materials*.08)-Math.round(prev.labor+prev.famPay)-Math.round(prev.util)-rent-Math.floor(rent*.1)-Math.round(r.interest+r.repay)-((S.pols[t-1]||{}).flyer||0)-Math.round(r.other)+(r.borrowed||0)-Math.round(r.ads-((S.pols[t]||{}).flyer||0))-coupon;
  assert.equal(routineByT[t],expected,'通常営業の通帳を独立検算 t'+t);
 }
 const bonusExpense=S.T.filter(e=>/^bonus-doc[12]@/.test(e.ev)).reduce((n,a)=>n+a.dr.filter(([k])=>['賞与引当金繰入','賞与'].includes(k)).reduce((z,x)=>z+x[1],0),0);
 const bonusPaid=Object.values(S.res).flatMap(r=>r.choices||[]).filter(x=>x.card==='bonus_pay').reduce((n,x)=>n-x.cash,0);
 assert.equal(bonusExpense,bonusPaid,'賞与の引当と支払の費用二重計上');
 assert.equal(bal(S,'商品'),0,'販売期間終了後の物販在庫の消し忘れ');
 if(S.W.flags.y2RepairPaid){const repairExpense=S.T.filter(e=>/^maintain_y2-doc[01]@/.test(e.ev)).reduce((n,a)=>n+a.dr.filter(([k])=>['修繕引当金繰入','修繕費'].includes(k)).reduce((z,x)=>z+x[1],0),0);assert.equal(repairExpense,260000,'計画修理の引当と支払の費用二重計上');}
 const hit=!forced||Object.values(S.res).some(r=>(r.choices||[]).some(x=>[x.card,x.option,x.outcome].join('/')===[forced.card,forced.option,forced.outcome].join('/')));
 lastState=S;return{seed,mode,target:forced,alternate,documents:n,reached:hit,issues,finalBank:bal(S,'普通預金'),world:S.W.cash};
}
// 同じ公開台本・seed・先頭選択で、月報を確定する前と後を観測する。
const latePaths=[];
for(let seed=0;seed<300;seed++)latePaths.push(run(seed,'2026',null));
// t11で選んだ通常bulkの3結果。結果の網羅用に抽選だけを固定し、金額・世界・書類は本体を実行。
for(let seed=0;seed<20;seed++)for(const outcome of ['cheap','spoil','space']){
 target={card:'bulk',option:'bulk',outcome};const W=D.world.create({seed});W.t=12;W.y=2;W.m=4;
 const pol=D.world.policy0(W,null,{neutral:true});
 const got=originalMonth(W,pol,{carry:[{id:'bulk',option:'bulk',t:11}],noCards:true,noFactors:true});
 const control=originalMonth(W,pol,{carry:[],noCards:true,noFactors:true});
 const expected={cheap:15000,spoil:-20000,space:-8000}[outcome];
 const S={seed,W:got.W,res:{12:got.res},pols:{12:pol},T:[],L:[]};
 const found=D.months.flatMap((m,mi)=>m.events.filter(e=>e.card==='bulk'&&e.t==='doc'&&e.ramenT===12&&e.when(S)).map(e=>({m,mi,e})));
 assert.equal(found.length,1);let book=0;
 for(const {m,e} of found){assert.equal(m.year,2);assert.equal(e.doc.date,'4月末');book+=bank(value(e.ans,S));}
 const report=D.months.find(m=>m.ramenT===12).events.find(e=>e.t==='rreport');
 const auto=report.auto(S).filter(a=>/^fx/.test(a.id)).reduce((n,a)=>n+bank(a),0);
 assert.equal(auto,0);assert.equal(got.res.fx,expected);assert.equal(book,expected);assert.equal(got.W.cash-control.W.cash,expected);
 bulkCases.push({seed,outcome,decisionT:11,resultT:12,bookYear:found[0].m.year,date:found[0].e.doc.date,doc:found[0].e.id,world:got.W.cash-control.W.cash,book,auto,difference:book-expected});
}
target=null;
// costOmenの判断から支払・期末評価・翌期使用・廃棄メモまで、状態を捏造せずに通す。
for(let seed=0;seed<20;seed++){
 run(seed,'2026',{card:'costOmen',option:'bulk',outcome:'ok',decisions:{supplier:'high'}});
 const S=lastState,paid=S.res[9].bulkPaid||0;
 if(!paid)continue;
 const stock=S.T.find(a=>a.ev==='stock'),genmo=S.T.find(a=>a.ev==='genmo'),loss=S.T.find(a=>a.ev==='hyoka-bulk'),back=S.T.find(a=>a.ev==='stock-back');
 const total=a=>a?a.dr.reduce((n,x)=>n+x[1],0):0;
 assert(back);assert.equal(total(stock)-total(genmo)-total(loss),total(back));
 const q=D.y2.bulkUse(S),used=45000*6,carrying=paid-total(loss),discarded=carrying-used;
 assert.equal(q.purchased,paid);assert.equal(q.loss,total(loss));assert.equal(q.used,used);assert.equal(q.discarded,discarded);
 assert(discarded>=0);const m=D.months.find(m=>m.ramenT===17),memo=m.events.find(e=>e.id==='bulk-disposal-memo@17');
 assert(memo.when(S));assert(value(memo.lines,S).flat().join('').includes(discarded.toLocaleString('ja-JP')));
 assert.equal(D.y2books.monthOf(back),12);assert.equal(back.y,2);
 inventoryCases.push({seed,paid,loss:total(loss),carrying,used,discarded,back:total(back),bookT:D.y2books.monthOf(back),year:back.y,difference:q.carrying-carrying});
}
assert(inventoryCases.length>0);
const result={head:'8defe7edb35317cf9e4ed907e5538555ad4aec9f',legacy:{paths:latePaths.length,documents:latePaths.reduce((n,p)=>n+p.documents,0),cashDiscrepancyPaths:latePaths.filter(p=>p.issues.length).length},
 bridge:{points:bridgePoints.length,maxRest:Math.max(...bridgePoints.map(p=>Math.abs(p.rest))),unknown:bridgePoints.reduce((n,p)=>n+p.unknown,0)},
 coupon:{cases:couponPoints.length,maxDifference:Math.max(...couponPoints.map(p=>Math.abs(p.difference)))},
 bulk:{cases:bulkCases.length,maxDifference:Math.max(...bulkCases.map(p=>Math.abs(p.difference)))},inventory:{cases:inventoryCases.length,maxDifference:Math.max(...inventoryCases.map(p=>Math.abs(p.difference)))},
 bridgePoints,couponPoints,negativeControls,bulkCases,inventoryCases};
fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,bridgePoints:undefined,couponPoints:undefined,bulkCases:undefined,inventoryCases:undefined},null,2));
assert.equal(result.legacy.cashDiscrepancyPaths,0);
