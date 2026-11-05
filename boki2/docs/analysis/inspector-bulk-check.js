const path=require('path'),assert=require('assert'),fs=require('fs'),vm=require('vm');
const root=path.resolve(process.argv[2]);global.window=global;
for(const f of ['js/core.js','js/data/accounts.js','js/data/kubun.js','js/sim/store.js',...require(path.join(root,'tools/ramen-files.js')).story])require(path.join(root,f));
const D=global.SIMDATA,V=(x,S)=>typeof x==='function'?x(S):x;
const flat=()=>D.months.flatMap((m,mi)=>m.events.map(e=>({e,mi,m})));
const S0=(seed=0)=>({seed,decisions:{},res:{},pols:{},dealt:{},cardOutcomes:[],choices:[],T:[],L:[],discDone:{},profile:{},mi:0});
const je=(e,S)=>V(e.ans,S),bank=a=>(a.dr||[]).filter(x=>x[0]==='普通預金').reduce((n,x)=>n+x[1],0)-(a.cr||[]).filter(x=>x[0]==='普通預金').reduce((n,x)=>n+x[1],0);
const rows=[];
for(const t of [5,11])for(const [out,u] of [['cheap',.1],['spoil',.6],['space',.9]]){
 const S=S0();let W=D.world.create({seed:0});W.t=t+1;W.m=(t+4)%12+1;
 const p=D.world.policy0(W,null,{neutral:true});const r=D.world.month(W,p,{carry:[{id:'bulk',option:'bulk',t}],rng:()=>u,noCards:true,noFactors:true});
 assert.equal(r.res.carried[0].outcome,out);S.W=r.W;S.res[t+1]=r.res;
 const events=flat().filter(x=>x.m.ramenT===t+1).map(x=>x.e);
 const docs=events.filter(e=>e.t==='doc'&&e.card==='bulk'&&(!e.when||e.when(S)));
 const auto=events.find(e=>e.t==='rreport');const fxauto=auto?auto.auto(S).filter(x=>x.id.startsWith('fx')).reduce((n,a)=>n+bank(a),0):0;
 const got=docs.reduce((n,e)=>n+bank(je(e,S)),0)+fxauto;
 if(t===5)assert.equal(got,r.res.fx,'t5 '+out+' 入出金の二重計上または欠落');
 rows.push({t,out,worldFx:r.res.fx,documents:docs.map(e=>e.id),bookFx:got,difference:got-r.res.fx,monthAvailable:events.length>0});
}
console.log(JSON.stringify(rows,null,2));
const cases=[];
for(let seed=0;seed<20;seed++)for(const paid of [0,300000]){
 const S=S0(seed);S.res[9]={bulkPaid:paid};S.res[11]={cogs:100000,wasteCost:0};
 const before=JSON.stringify(S),inv=D.y1.bulkInventory(S);assert.equal(JSON.stringify(S),before);
 const find=id=>flat().find(x=>x.e.id===id).e;
 const stock=je(find('stock'),S).dr.reduce((n,x)=>n+x[1],0);
 const genmo=je(find('genmo'),S).dr.reduce((n,x)=>n+x[1],0);
 const h=find('hyoka-bulk'),loss=h.when(S)?je(h,S).dr.reduce((n,x)=>n+x[1],0):0;
 const back=je(find('stock-back'),S).dr.reduce((n,x)=>n+x[1],0);
 assert.equal(stock-genmo-loss,back);assert.equal(inv.carrying,paid-loss);assert(back>=0);
 cases.push({seed,paid,stock,genmo,loss,back});
}
console.log('在庫40経路の恒等式・非負・S不変を検査');console.log(JSON.stringify(cases));

// 旧版の非ゼロ書類を、同じ状態で公開新版と比較する。
const before=JSON.parse(fs.readFileSync(process.argv[3],'utf8')).content;
const oldContext={console};oldContext.global=oldContext;oldContext.window=oldContext;vm.createContext(oldContext);
for(const f of ['js/core.js','js/data/accounts.js','js/data/kubun.js','js/sim/store.js',...require(path.join(root,'tools/ramen-files.js')).story]){
 const code=f==='js/sim/ramen-y1.js'?before:fs.readFileSync(path.join(root,f),'utf8');vm.runInContext(code,oldContext,{filename:f});
}
const collect=y=>[...y.pre.flatMap(m=>m.events),...Object.values(y.months).flat(),...y.kessan.flatMap(m=>m.events)].filter(e=>e.t==='doc');
const oldDocs=collect(oldContext.SIMDATA.y1),newDocs=collect(D.y1),newMap=new Map(newDocs.map(e=>[e.id,e]));
const normalized=a=>JSON.stringify({dr:a.dr.filter(x=>x[1]!==0),cr:a.cr.filter(x=>x[1]!==0)});
let checks=0,visible=0;const covered=new Set(),differences=[];
for(let seed=0;seed<20;seed++)for(const parts of [0,1,3])for(const paid of [0,300000])for(const flyer of [0,30000]){
 const S=S0(seed);let W=D.world.create({seed});
 for(let t=0;t<12;t++){const pol={...D.world.policy0(W),parts,family:0,flyer,borrow:false};const r=D.world.month(W,pol,{rng:D.rng(seed*103+t),carry:[],noCards:true,noFactors:true});S.res[t]=r.res;S.pols[t]=pol;W=r.W;}
 S.W=W;S.res[9].bulkPaid=paid;
 for(const e of oldDocs){const n=newMap.get(e.id);assert(n,'missing doc '+e.id);covered.add(e.id);checks++;
  const a=je(e,S),b=je(n,S);const sum=x=>x.reduce((n,p)=>n+p[1],0);assert.equal(sum(b.dr),sum(b.cr),e.id);
  if(e.id==='hyoka-bulk')continue; // 発生条件の修正は0円除外と別に上の在庫経路で検査。
  if(e.id==='stock-back'){
    assert.equal(a.dr[0]?.[1]||0,(b.dr[0]?.[1]||0)+D.y1.bulkInventory(S).loss,'承認された湿気評価損だけを翌期残高から引く');
  }else assert.equal(normalized(a),normalized(b),e.id);
  const oldOn=!e.when||e.when(S),newOn=!n.when||n.when(S);
  if(oldOn&&[...a.dr,...a.cr].some(x=>x[1]!==0)){visible++;if(!newOn)differences.push(e.id);}
 }
}
assert.deepEqual(differences,[]);console.log(JSON.stringify({zeroDoc:{oldDocs:oldDocs.length,newDocs:newDocs.length,covered:covered.size,checks,positiveVisible:visible,lost:0}}));
// 他札の正負のcashが同居しても、月報から除くのはbulk分だけ。
let mixed=0;
for(const [out,u] of [['cheap',.1],['spoil',.6],['space',.9]])for(const card of D.cards.deck.filter(c=>c.id!=='bulk'&&c.options.some(o=>o.outcomes.some(x=>x.cash))))for(const opt of card.options){
 const S=S0(),W=D.world.create({seed:0});W.t=6;W.m=10;
 const r=D.world.month(W,D.world.policy0(W),{carry:[{id:'bulk',option:'bulk',t:5},{id:card.id,option:opt.id,t:5}],rng:()=>u,noCards:true,noFactors:true});S.W=r.W;S.res[6]=r.res;
 const ev=flat().filter(x=>x.m.ramenT===6).map(x=>x.e),d=ev.filter(e=>e.t==='doc'&&e.card==='bulk'&&e.when(S));
 const a=ev.find(e=>e.t==='rreport').auto(S).filter(e=>e.id.startsWith('fx'));
 assert.equal(d.reduce((n,e)=>n+bank(je(e,S)),0)+a.reduce((n,e)=>n+bank(e),0),r.res.fx,card.id+'/'+opt.id);mixed++;
}
console.log('bulkと他札の混在:'+mixed+'経路、入出金差0円');

const ledgerResults=[];
for(const mode of ['none','cheap','spoil','space','omen'])for(const seed of [0,14]){
 const S=S0(seed);let W=D.world.create({seed}),balances={'普通預金':W.cash};
 const post=a=>{assert.equal(a.dr.reduce((n,x)=>n+x[1],0),a.cr.reduce((n,x)=>n+x[1],0));for(const [acc,v]of a.dr)balances[acc]=(balances[acc]||0)+v;for(const [acc,v]of a.cr)balances[acc]=(balances[acc]||0)-v;S.T.push(a);S.L.push(a);};
 const differences=[];
 for(let t=0;t<12;t++){
  const carry=[];if(t===6&&['cheap','spoil','space'].includes(mode))carry.push({id:'bulk',option:'bulk',t:5});if(t===9&&mode==='omen')carry.push({id:'costOmen',option:'bulk',t:8});
  const u={cheap:.1,spoil:.6,space:.9}[mode];
  const pol={...D.world.policy0(W),parts:1,family:0,flyer:0,line:false,coupon:false,limited:false,borrow:false};
  const r=D.world.month(W,pol,{rng:t===6&&u!=null?()=>u:D.rng(seed*321+t),carry,noCards:true,noFactors:true});S.W=r.W;S.res[t]=r.res;S.pols[t]=pol;S.cardOutcomes.push(...(r.res.carried||[]));
  const events=flat().filter(x=>x.m.ramenT===t).map(x=>x.e);
  for(const e of events)if(e.t==='doc'&&(!e.when||e.when(S)))post(je(e,S));
  const report=events.find(e=>e.t==='rreport');for(const a of report.auto(S))post(a);
  const b=D.rview.bridge(S,t,balances,0);assert.equal(b.rest,0,mode+'/'+seed+'/'+t);differences.push({t,rawDifference:b.world-b.book,unexplained:b.rest});W=r.W;
 }
 ledgerResults.push({mode,seed,differences});
}
console.log('全月書類の正解と自動仕訳から作った帳簿とworldの橋：'+JSON.stringify(ledgerResults));
