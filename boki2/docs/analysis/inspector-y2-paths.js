// 公開版を順に進め、全書類と札の実際の現金を照合する検査専用。対象ファイルは書き換えない。
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(process.argv[2]);global.window=global;
for(const f of ['js/core.js','js/data/accounts.js','js/data/kubun.js','js/sim/store.js',...require(root+'/tools/ramen-files.js').story])require(path.join(root,f));
const D=SIMDATA,B=BOKI,originalMonth=D.world.month,originalResolve=D.decide.resolve;
require(path.join(root,'js/sim/lexicon.js'));
D.world.month=(w,p,o)=>originalMonth(w,p,{...o,noFactors:true});
const value=(v,s)=>typeof v==='function'?v(s):v;
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
 const checkWords=(e,m,text,doc=false)=>{if((m.year||1)<2)return;const bad=B.lex.unknown(text,new Set([...S.taught,...(e.teaches||[])] )).filter(w=>!doc||!(w in B.lex.docWords));if(bad.length){const k=e.id+'/'+bad.join('/');languageWarnings.set(k,{id:e.id,words:bad,text:text.slice(0,160),seed,mode});}};
 const cashByT={},routineByT={},issues=[];let n=0;
 function record(a,id,m,mi,isCard){
  assert(a&&a.dr&&a.cr,id);assert.equal(sum(a,'dr'),sum(a,'cr'),id+' 貸借不一致');
  for(const[k,v]of [...a.dr,...a.cr])assert(Number.isFinite(v)&&v>=0,id+' 負数/非有限 '+k+' '+v);
  const t=m.ramenT??m.bookT;
  if(isCard&&t!=null)cashByT[t]=(cashByT[t]||0)+bank(a);
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
    for(const a of e.auto(S))record(a,a.id,m,mi,/^fx/.test(a.id));
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
 for(let t=12;t<39;t++){
  const r=S.res[t],world=(r.choices||[]).reduce((n,x)=>n+x.cash,0),book=cashByT[t]||0;
  if(book!==world)issues.push({t,worldCardCash:world,bookCardCash:book,difference:book-world,choices:r.choices});
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
 return{seed,mode,target:forced,alternate,documents:n,reached:hit,issues,finalBank:bal(S,'普通預金'),world:S.W.cash};
}
const targets=D.y2.cards.cards.flatMap(c=>c.automatic?[]:c.options.flatMap(o=>o.outcomes.map(x=>({card:c.id,option:o.id,outcome:x.id}))));
for(const mode of ['2026','2027'])for(const seed of [0,14])for(const alt of [false,true]){
 try{paths.push(run(seed,mode,null,alt));}catch(e){failures.push({seed,mode,alt,error:e.stack});}
}
for(const x of targets){try{paths.push(run(14,'2026',x));}catch(e){failures.push({target:x,error:e.stack});}}
// 自動札にも、実際の前提となる判断から到達する。残高や資格の条件は偽造しない。
const automatic=D.y2.cards.cards.filter(c=>c.automatic).flatMap(c=>c.options.flatMap(o=>o.outcomes.map(x=>({card:c.id,option:o.id,outcome:x.id}))));
for(const x of automatic){
 const extra={decisions:{ticket_items:'n20',maintain_y2:'break',finance_asset:'installment',maintain_replace:'keep',close:'format'},forceMap:{ticket_items:'d6'}};
 if(x.card==='repair_pay')extra.decisions.maintain_y2='plan';
 if(['equipment_purchase','equipment_principal'].includes(x.card)){extra.decisions.finance_asset='loan';extra.decisions.site2='wait';extra.lowCost=true;}
 if(x.card==='close_restore')extra.decisions.close='close';
 if(x.card==='close_equipment')extra.decisions.maintain_replace='sell';
 try{paths.push(run(0,'2027',{...x,...extra}));}catch(e){failures.push({target:x,error:e.stack});}
}
for(let seed=0;seed<12;seed++){
 const x={card:'finance_asset',option:'loan',outcome:'borrowed',decisions:{site2:'wait'},lowCost:true};
 try{const r=run(seed,'2026',x);paths.push(r);if(r.reached)break;}catch(e){failures.push({target:x,seed,error:e.stack});}
}
for(const[option,outcome]of [['repair','again'],['new','late'],['wait','stop']]){
 const x={card:'maintain',option,outcome};try{paths.push(run(14,'2026',x));}catch(e){failures.push({target:x,error:e.stack});}
}
// 黒字経路だけに依存しない、独立した配当の正額・準備金上限の資料。
const dividendFixtures=[];
const allDocs=D.months.flatMap(m=>m.events);
for(const retained of [0,1,10,1000,1000000])for(const reserve of [0,749999,750000]){
 const capital=3000000,shares=300,T=[{dr:[['普通預金',capital+reserve+retained]],cr:[['資本金',capital],['資本準備金',reserve],['繰越利益剰余金',retained]]}];
 const q=D.y2.cards.dividendQuote({T,W:{flags:{y2Shares:shares}}}),need=Math.max(0,capital/4-reserve);
 let per=0;for(let amount=shares;amount<=retained;amount+=shares)if(amount+Math.min(Math.floor(amount/10),need)<=retained)per=amount/shares;
 assert.equal(q.per,per,'配当可能な1株当たり額');
 for(const amount of [0,1,300000]){
  const S={T,decisions:{'dividend@13':'half'},W:{flags:{y2Dividend:{need}}},res:{14:{choices:[{card:'dividend',option:'half',outcome:'paid',cash:-amount}],carried:[{card:'dividend',option:'half',outcome:'paid',cash:-amount}]}}};
  const doc0=allDocs.find(e=>e.id==='dividend-doc0@14'),doc1=allDocs.find(e=>e.id==='dividend-doc1@14'),a=value(doc0.ans,S),b=value(doc1.ans,S),r=Math.min(Math.floor(amount/10),need);
  assert.equal(sum(a,'dr'),amount+r);assert.equal(sum(a,'cr'),amount+r);assert.equal(bank(b),-amount);assert.equal(Boolean(doc0.when(S)),amount>0);assert.equal(Boolean(doc1.when(S)),amount>0);
  dividendFixtures.push({retained,reserve,per,amount,reserveAdded:r});
 }
}
const legacyCards=D.cards.deck.filter(c=>!c.y2).map(c=>({id:c.id,hasDocs:!!c.docs,options:c.options.map(o=>({id:o.id,outcomes:o.outcomes.map(x=>({id:x.id,cash:typeof x.cash==='function'?'function':(x.cash||0)+(o.cash||0)}))}))}));
const result={paths:paths.length,targets:targets.length+automatic.length,documents:paths.reduce((n,p)=>n+p.documents,0),coveredYear2DocIds:seenDocs.size,reachedTargets:paths.filter(p=>p.target&&p.reached).length,missingTargets:paths.filter(p=>p.target&&!p.reached).map(p=>p.target),cashDiscrepancyPaths:paths.filter(p=>p.issues.length).length,failures,details:paths,seenOutcomes:[...seenOutcomes].sort(),docCoverage:Object.fromEntries(seenDocs),docExamples:examples,languageWarnings:[...languageWarnings.values()],missingNames:[...missingNames],dividendFixtures,legacyCards};
fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,details:undefined,docExamples:undefined,seenOutcomes:undefined},null,2));
if(failures.length)process.exitCode=1;
