#!/usr/bin/env node
// 年2以降の検査。基準23d31d7の1年目の世界全文をハッシュで固定する。
// --world は世界の境界だけ。台本の受け入れ合格とは区別する。
'use strict';
const assert = require('assert/strict');
const crypto = require('crypto');
const path = require('path');
global.window = global;
const root = path.join(__dirname, '..');
for (const f of ['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', ...require('./ramen-files.js').story]) require(path.join(root, f));
const D = global.SIMDATA, wd = D.world;
const namingAudit={missing:new Map(),maxNewAccounts:0,checked:0};
const clone = x => JSON.parse(JSON.stringify(x));
const BASELINE = /* 基準の実測。検査対象から作り直さない */ {
  "0:shotengai": "22519878fb2c72ebaec22b204019ccf24dd021619a01aa3a16220251637821ea",
  "0:ekimae": "52e033c02a49d37a14e821e6bdbbbf5555b82e61b1c7798bd2d5aca1f8172146",
  "0:jutaku": "9bd5abff1568dd6bc2f25e661f580f2a74ffffb42e002533c6cafe7414ef0694",
  "1:shotengai": "a0e4cc55cae92a81288335b59cc69c8cb2627a0758cc8a9878c3cd5a07bc2ebb",
  "1:ekimae": "8be8c01ce35dabb2544416d2c06af65eee51bf2bb091cfe0baff32401da490ba",
  "1:jutaku": "70a1ea4da377f3cb52634ec49a5b5190c8fecbb929030c291c779878137f1305",
  "2:shotengai": "6effcf437ae21a3978dfa60c16d0aa56dbb24cf07d85e773906f2164b27f3536",
  "2:ekimae": "a82384652d8e54b95fbd00202b572b5fea7e25b916ed11a466078e235bed1cfc",
  "2:jutaku": "30f70c857add2e37041a9dc6d918c770592ae88caaec58a2b94c0973090f6081"
};
// 承認6385820182の新品コンロ支払だけは旧版との差分として別検査する。
// 古い世界全文の検査中だけ、この既知の支払漏れを旧版へ戻す。
const newStoveOutcomes=D.cards.byId.maintain.options.find(o=>o.id==='new').outcomes;
const newStoveCash=newStoveOutcomes.map(o=>o.cash);
newStoveOutcomes.forEach(o=>{delete o.cash;});
let baselineMonths = 0;
for (const [key, want] of Object.entries(BASELINE)) {
  const [seed0, area] = key.split(':'), seed = +seed0;
  let W = wd.create({ seed, area });
  const h = crypto.createHash('sha256');
  for (let t = 0; t < 12; t++) {
    const r = wd.month(W, wd.policy0(W), { rng: D.rng(seed * 100 + t) });
    h.update(JSON.stringify(r)); W = r.W; baselineMonths++;
  }
  assert.equal(h.digest('hex'), want, `1年目の基準と不一致：${key}`);
}
newStoveOutcomes.forEach((o,i)=>{o.cash=newStoveCash[i];assert.equal(o.cash,-300000,'承認したコンロ代の支払がない');});
const finite = (x, at) => {
  if (typeof x === 'number') assert.ok(Number.isFinite(x), `${at}が有限でない`);
  else if (x && typeof x === 'object') for (const [k,v] of Object.entries(x)) finite(v, `${at}.${k}`);
};
// 会社の借入を複製せず、同じ町の2店は需要の分母を共有する。
function twoStores(seed, area) {
  const W = wd.create({ seed }); W.t = 12; W.y = 2;
  const branch = wd.create({ seed, area });
  const st = branch.stores[0]; st.id = 'branch'; W.stores.push(st);
  if (area !== W.area) {
    W.town.areas[area] = branch.town.areas[area];
    W.rivals.push(...branch.rivals.map(r => ({ ...r, id: `branch:${r.id}`, area })));
  }
  return W;
}
const SUM = ['N', 'Nd', 'demand', 'X', 'waste', 'lost', 'sales', 'cogs', 'wasteCost', 'labor', 'rent', 'util', 'other', 'dep', 'ads', 'op', 'interest', 'ord', 'repay', 'fx'];
let multiMonths = 0;
for (let seed = 0; seed < 8; seed++) for (const area of ['shotengai', 'ekimae', 'jutaku']) {
  let W = twoStores(seed, area);
  for (let t = 12; t < 36; t++) {
    const before = JSON.stringify(W);
    const { W: next, res } = wd.month(W, wd.policy0(W), { noCards: true, rng: D.rng(seed * 97 + t) });
    assert.equal(JSON.stringify(W), before, '入力の世界を書き換えた');
    finite(next, '世界'); finite(res, '月報');
    for (const k of SUM) assert.equal(res[k], res.stores.reduce((a,r) => a + (r[k] || 0), 0), `店別の合計：${k}`);
    assert.equal(next.cash, W.cash + res.ord + res.dep - res.repay);
    assert.equal(res.interest, res.stores[0].interest, '利息を2店分にした');
    assert.equal(res.repay, res.stores[0].repay, '返済を2店分にした');
    W = next; multiMonths++;
  }
}
{
  const W = wd.create({ seed: 1 }); W.t = 12; W.y = 2;
  const alone = wd.month(W, wd.policy0(W), { noise: false, noCards: true }).res;
  const same = twoStores(1, 'shotengai');
  const near = wd.month(same, wd.policy0(same), { noise: false, noCards: true }).res;
  assert.ok(near.stores[0].demand < alone.demand, '同じ町で客を取り合わない');
  const farW = twoStores(1, 'ekimae');
  const far = wd.month(farW, wd.policy0(farW), { noise: false, noCards: true }).res;
  assert.equal(far.stores[0].demand, alone.demand, '別の町の支店が本店の需要を削った');
  same.stores[1].open = false;
  const closed = wd.month(same, wd.policy0(same), { noise: false, noCards: true }).res;
  assert.equal(closed.sales, alone.sales, '閉店した支店の売上が残る');
}
// 通常・carryともapplyを通る。capital/investは売上や費用を動かさない。
let flowCases = 0;
for (const flow of ['op', 'capital', 'invest']) for (const cash of [-50000, 300000]) {
  const id = `check-${flow}-${cash}`;
  const card = { id, when: () => false, options: [{ id: 'go', cash: 1000, outcomes: [{ id: 'ok', w: 100, cash, flow }] }] };
  D.cards.register([card]);
  const W = wd.create({ seed: 1 }), p = wd.policy0(W);
  const base = wd.month(W, p, { noise: false, carry: [] });
  const got = wd.month(W, p, { noise: false, carry: [{ id, option: 'go', t: -1 }] });
  assert.equal(got.W.cash - base.W.cash, cash + 1000);
  assert.equal(got.res.op - base.res.op, flow === 'op' ? cash + 1000 : 0);
  assert.equal(got.res.ord - base.res.ord, flow === 'op' ? cash + 1000 : 0);
  if (flow !== 'op') assert.equal(got.res[flow], cash + 1000);
  flowCases++;
}
console.log(`OK：世界の境界（1年目の基準全文 ${baselineMonths}か月・2店 ${multiMonths}か月・資金区分 ${flowCases}枝・同じ町/別の町/閉店）`);
// 配当の正の額も検査する。赤字の既定プレイだけでは0円の枝に偏るため、独立した帳簿資料で上限を確認。
for(const retained of [0,10,20,100,10000,10000000])for(const reserve of [0,749999,750000]){
  const T=[{dr:[['普通預金',3000000+reserve+retained]],cr:[['資本金',3000000],['資本準備金',reserve],['繰越利益剰余金',retained]]}];
  const q=D.y2.cards.dividendQuote({T,W:{flags:{y2Shares:1}}}),d=q.per,required=Math.min(Math.floor(d/10),Math.max(0,750000-reserve));
  assert.ok(d+required<=retained);assert.ok(d<=q.equity-3000000);
  if(d<q.equity-3000000)assert.ok(d+1+Math.min(Math.floor((d+1)/10),Math.max(0,750000-reserve))>retained,'配当上限が過少');
}
console.log('OK：配当の正額・準備金上限到達前後18資料');
// 台本を実際の順で進める。仕訳はすべて正答を記帳し、決算の締切も行う。
function story(seed, choices = {}) {
  const S={seed,mode:choices.__mode||'2026',decisions:{},T:[],L:[],discDone:{},cardOutcomes:[],choices:[]};
  let docs=0,calcs=0; const seen=new Set(),taught=new Set();
  const teach=list=>{const fresh=[...new Set(list||[])].filter(a=>!taught.has(a)&&BOKI.accounts[a]);namingAudit.maxNewAccounts=Math.max(namingAudit.maxNewAccounts,fresh.length);assert.ok(fresh.length<=2,`seed${seed}:1画面の新しい科目が3つ以上 ${fresh}`);for(const a of list||[])taught.add(a);};
  const name=(acc,e)=>{if(taught.has(acc))return;const n=D.namings[acc];namingAudit.checked++;
    if(!n){if(!namingAudit.missing.has(acc))namingAudit.missing.set(acc,{seed,mode:S.mode,event:e.id,month:(D.months[S.mi]||{}).label});taught.add(acc);return;}
    assert.ok(n.q&&n.line&&n.opts.some(o=>o.ok)&&n.teaches.includes(acc),e.id+':名前の段の定義が不完全 '+acc);teach(n.teaches);
  };
  const post=(a,e,m,mi)=>{finite(a,e.id);for(const side of ['dr','cr'])for(const [acc,v]of a[side])assert.ok(v>=0,`${e.id}: ${acc}が負数`);
    assert.equal(a.dr.reduce((n,x)=>n+x[1],0),a.cr.reduce((n,x)=>n+x[1],0),`${e.id}:貸借不一致`);
    const row={...a,id:`${e.id}@${mi}`,ev:e.id,mi,y:m.year||1};S.T.push(row);S.L.push(clone(row));};
  for(let mi=0;mi<D.months.length;mi++) {const m=D.months[mi];S.mi=mi;
    for(const e of m.events) {
      if(e.when&&!e.when(S))continue;
      if(choices.__onEvent)choices.__onEvent(S,e,m);
      if(e.t==='board'){teach(e.teaches);for(const step of e.steps||[])if(step.k==='card')teach(step.teaches);}
      for(const a of e.names||[])name(a,e);
      if(e.t==='decision'){const opts=e.optionsFor?e.optionsFor(S):e.options,available=opts.filter(x=>!x.disabled),requested=choices[e.id]||choices[e.card];assert.ok(available.length,e.id+'に選べる手がない');S.decisions[e.id]=available.some(x=>x.id===requested)?requested:available[0].id;if(e.card)seen.add(e.card);}
      if(e.t==='plan'){D.ramen.plan(S,e.ramenT,D.ramen.policy(S,e.ramenT));finite(S.W,'世界');finite(S.res[e.ramenT],'月報');}
      if(e.t==='doc'){
        const a=typeof e.ans==='function'?e.ans(S):e.ans;
        if(m.year>=2){assert.ok(a.dr.length&&a.cr.length,e.id+':全額0円の書類');for(const [,v]of [...a.dr,...a.cr])assert.ok(v>0,`seed${seed} ${e.id}:正解に0円以下 ${v}`);
          const rows=typeof e.doc.rows==='function'?e.doc.rows(S):e.doc.rows;assert.ok(!rows.some(r=>r[2]==='amt'&&r[1]===0),e.id+':表に0円行');}
        for(const [acc]of [...a.dr,...a.cr])name(acc,e);
        post(a,e,m,mi);docs++;
      }
      if(e.t==='calc'){const a=typeof e.answer==='function'?e.answer(S):e.answer;assert.ok(Number.isFinite(a),e.id);calcs++;}
      if(e.t==='discover'){
        teach(e.b4?.teaches);
        const before=m.events.filter(x=>!x.when||x.when(S)),index=before.indexOf(e);S.discDone[e.id]=mi;
        const after=m.events.filter(x=>!x.when||x.when(S));assert.equal(after[index],e,`説明後に一覧が詰まって次を飛ばす：${e.id}`); // 承認6385266883：1年目も対象。
      }
      if(e.t==='rreport'){for(const a of e.auto(S))post(a,a,m,mi);if(e.ramenT>=12){
        const t=e.ramenT,r=S.res[t],W=S.W;
        (S.shareLog ||= {})[t]={me:r.stores?r.stores[0].N:r.N,rivals:W.rivals.filter(x=>(x.area||W.area)===W.area).map(x=>({id:x.id,name:x.name,type:x.type,N:x.lastN||0,R:x.R,open:x.open!==false}))};
        for(const key of ['shares','position','debrief','forkTree'])finite(D.rview[key](S,t),`画面${key} t${t}`);
        const due=D.rview.dueList(S,t,D.y2books.cash(S.L));finite(due,'期日');if(t<38)assert.ok(due.items.length,'2年目以降の期日が空');
        const debrief=D.rview.debrief(S,t);if(debrief)assert.equal(debrief.quarter,[2,5,8,11].includes(t%12));
        const bridge=D.y2books.reconcile(S,e.ramenT);assert.equal(bridge.rest,0,`seed${seed} t${e.ramenT}:口座照合`);assert.deepEqual(bridge.unknown,[],`seed${seed}:未知の現金取引`);assert.equal(bridge.modelCash,S.res[e.ramenT].cash);}}
      if(['talk','decision','calc','report'].includes(e.t))teach(e.teaches);
      if(e.t==='opening')teach(['前期繰越','開始記入']);
      if(e.t==='closing'){
        teach(['損益','繰越利益剰余金','締め切り','当期純利益','決算振替']);
        const rev=[],exp=[];for(const [a,meta]of Object.entries(BOKI.accounts)){
          const v=D.y2books.balance(S.T,a);if(meta.cat==='収益'&&v)rev.push([a,-v]);if(meta.cat==='費用'&&v)exp.push([a,v]);}
        const net=rev.reduce((n,x)=>n+x[1],0)-exp.reduce((n,x)=>n+x[1],0);
        post({dr:rev.concat(net<0?[['繰越利益剰余金',-net]]:[]),cr:exp.concat(net>=0?[['繰越利益剰余金',net]]:[]),closing:true},e,m,mi);
      }
    }
  }
  assert.equal(S.W.t,39);
  const book=D.y2books,entries=S.T.filter(e=>!e.closing);
  const expenseFor=re=>entries.filter(e=>re.test(e.ev||'')).reduce((n,e)=>n+book.income([e]).expense,0);
  if(S.W.flags.y2RepairPaid)assert.equal(expenseFor(/^(maintain_y2-doc0@35|maintain_y2-doc1@36)$/),260000,'修理の見積りと支払で費用を二重計上');
  if(S.W.flags.staffBonus&&S.W.flags.staffBonus.kind==='promise')assert.equal(expenseFor(/^bonus-doc[12]@/),D.y2.assets.unitBonus(S)*(S.W.flags.bonusCount||0),'賞与の引当と支払で費用を二重計上');
  return {S,docs,calcs,seen};
}
function economicStory(seed,choices={}){
  // 比較表だけは表示用の要因分解を省く。既定の全結果検査は省かない。
  const month=wd.month;wd.month=(W,p,opts={})=>month(W,p,{...opts,noFactors:true});
  try{return story(seed,choices);}finally{wd.month=month;}
}
function extendWorld(S,endT=44){
  for(let t=S.W.t;t<=endT;t++){
    const pol=D.ramen.policy(S,t);S.W.flags.y2CurrentDealt=[];D.y2.beforePlan(S,t,pol);
    const r=wd.month(S.W,pol,{carry:D.y2.carry(S,t),noCards:true,noFactors:true,rng:D.rng((S.seed+1)*7919+t*104729)});
    S.W=r.W;S.res[t]=r.res;S.pols[t]={...pol,parts:r.W.stores[0].parts,family:r.W.stores[0].family};D.y2.afterPlan(S,t,r);finite(r,'本編後の世界だけの延長');
  }
  return S;
}
function forcedStory(seed,choices,target,outcome){
  const original=D.decide.resolve;
  D.decide.resolve=(card,opt,W,rng)=>{
    const selected=(choices.__outcomes||{})[card.id]||(card.id===target?outcome:null);
    if(!selected)return original(card,opt,W,rng);
    const result=card.options.find(x=>x.id===opt).outcomes.find(x=>x.id===selected);
    if(!result)return original(card,opt,W,rng); // 審査で対象の選択肢が選べなかったケースは、到達の集計で失敗として扱う。
    return {id:selected,outcome:result,weights:D.decide.weights(card,opt,W)};
  };
  try{return story(seed,choices);}finally{D.decide.resolve=original;}
}
function verifySave(){
  const oldStorage=global.localStorage,oldDocument=global.document,values=new Map(),elements=new Map();let fail=false;
  global.localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>{if(fail)throw new Error('QuotaExceededError');values.set(k,v);}};
  global.document={body:{prepend:el=>elements.set(el.id,el)},getElementById:id=>elements.get(id),createElement:()=>({style:{},setAttribute(){}})};
  require('../js/sim/store.js');const ST=BOKI.store,V=ST.v4;let doc=V.empty();const sizes=[];
  const record=(S,label)=>{doc=V.split(doc,S,label);S.bm=doc.slots.find(x=>x.id===doc.cur).run.bm;sizes.push({label,bytes:V.encodedBytes(doc),bookmarks:Object.keys(S.bm).length});assert.ok(V.encodedBytes(doc)<=V.SAVE_BUDGET,label+':保存が2MiBを超える');};
  try{
    const {S}=economicStory(0,{__onEvent:(S,e,m)=>{
      if(e.t==='decision'){
        const keep=new Set(['bm',...V.META]);const snapshot={};for(const [k,v]of Object.entries(S))if(!keep.has(k)&&k!=='drafts')snapshot[k]=v;
        (S.bm ||= {})[e.id]=clone(snapshot);S.bm=V.pruneBookmarks(S.bm);doc=V.split(doc,S);S.bm=doc.slots.find(x=>x.id===doc.cur).run.bm;
      }
      if(e.t==='plan'&&[0,12,24].includes(m.ramenT))record(S,{0:'1年目の始め',12:'1年目の終わり',24:'2年目の終わり'}[m.ramenT]);
    }});record(S,'4年目6月');
    assert.ok(S.bm.form,'必須の戻り先formが消えた');assert.ok(Object.keys(S.bm).length<=4);
    const three=V.empty();for(const sl of three.slots)sl.run=clone(S);V.compactDoc(three);assert.ok(V.encodedBytes(three)<5*1024*1024,'3スロットの保存が5MiBを超える');assert.ok(three.slots.every(sl=>sl.run.mi===S.mi&&sl.run.W.cash===S.W.cash&&sl.run.bm.form),'複数スロットの進行や必須栞を失った');
    const legacy=V.empty();legacy.slots[0].run={...clone(S),bm:{form:clone(S.bm.form)}};
    for(let i=0;i<60;i++)legacy.slots[0].run.bm['old'+i]={...clone(S),bm:undefined,mi:i,drafts:{old:'途中の画面'}};
    values.set('legacy.v4',JSON.stringify(legacy));const loaded=V.load('legacy.v4'),run=V.compose(loaded);
    assert.equal(run.mi,S.mi);assert.equal(run.W.cash,S.W.cash);assert.deepEqual(run.T,S.T);assert.deepEqual(run.L,S.L);assert.deepEqual(run.decisions,S.decisions);assert.ok(run.bm.form);assert.ok(Object.keys(run.bm).length<=4);
    assert.ok(Object.values(run.bm).every(x=>x.drafts===undefined),'栞に途中の画面を残した');
    const large=V.empty();large.slots[0].run={mi:57,bm:{form:{mi:3},a:{mi:10,payload:'x'.repeat(600000)},b:{mi:20,payload:'y'.repeat(600000)},c:{mi:30,payload:'z'.repeat(600000)}}};
    V.compactDoc(large);assert.ok(V.encodedBytes(large)<=V.SAVE_BUDGET);assert.ok(large.slots[0].run.bm.form);assert.ok(elements.get('boki-bookmark-note').textContent.includes('古い栞'));
    const v3={v:3,mi:7,L:[{dr:[['普通預金',123]],cr:[['借入金',123]]}],bm:{old:{mi:1}}};ST.save('legacy.v3',clone(v3));const reread=ST.loadLocal('legacy.v3');delete reread.savedAt;assert.deepEqual(reread,v3,'v3の形を変更した');
    const migrated=V.fromV3({...v3,examLog:[{key:'kept'}]});assert.equal(migrated.meta.examLog[0].key,'kept');assert.ok(migrated.slots.every(x=>x.run===null));
    fail=true;assert.equal(ST.save('failed',{}),false);assert.ok(ST.status().localError);assert.equal(elements.get('boki-save-error').textContent,'保存できませんでした（容量がいっぱいです）');
    fail=false;assert.equal(ST.save('failed',{}),true);assert.equal(ST.status().localError,'');assert.equal(elements.get('boki-save-error').hidden,true);
    console.log('保存容量（UTF-16換算・通し台本）:'+JSON.stringify(sizes));
    console.log('OK：古いv4の60栞を移行・進行と帳簿を保持・v3互換・保存失敗表示と回復・容量削減の通知');
  }finally{if(oldStorage===undefined)delete global.localStorage;else global.localStorage=oldStorage;if(oldDocument===undefined)delete global.document;else global.document=oldDocument;}
}
function verifyMaturity(){
  for(const [seed,finance_asset,currentLoan,longLoan]of [[0,'installment',999996,3250015],[7,'loan',1599996,3400015]]){
    let sample;economicStory(seed,{finance_asset,__onEvent:(S,e)=>{if(e.id==='report3')sample=clone(S);}});
    assert.equal(sample.W.flags.y2Equipment.method,finance_asset,'実際に選んだ購入方法が違う');
    const b=Object.fromEntries(Object.keys(BOKI.accounts).map(a=>[a,D.y2books.balance(sample.T,a)])),before=JSON.stringify(sample),source=JSON.stringify(b);
    const q=D.y2.maturity.quote(sample,b,35),shown=D.y2.maturity.display(sample,b,35);
    assert.equal(q.currentLoan,currentLoan);assert.equal(q.longLoan,longLoan);
    assert.equal(shown['短期借入金'],-currentLoan);assert.equal(shown['長期借入金'],-longLoan);
    for(const cat of ['資産','負債']){const total=x=>Object.entries(x).filter(([a])=>BOKI.accounts[a]?.cat===cat).reduce((n,[,v])=>n+v,0);assert.equal(total(shown),total(b),'表示で'+cat+'合計が変わった');}
    for(const e of D.y2.maturityCalcs(3).filter(e=>!e.when||e.when(sample))){const answer=e.answer(sample),expected=e.id.startsWith('loan-')?q.currentLoan:e.id.startsWith('kappu-current')?q.currentUnpaid:q.currentInterest;assert.equal(answer,expected,e.id+'が表示と違う');}
    if(finance_asset==='installment'){
      assert.deepEqual([q.unpaid,q.currentUnpaid,q.longUnpaid,q.interest,q.currentInterest,q.longInterest],[825000,660000,165000,75000,60000,15000]);
      assert.equal(shown['未払金']-b['未払金'],-660000);assert.equal(shown['長期未払金'],-165000);assert.equal(shown['前払費用'],60000);assert.equal(shown['長期前払費用'],15000);assert.equal(shown['前払利息'],0);
    }
    assert.equal(JSON.stringify(sample),before,'表示で世界・仕訳を書き換えた');assert.equal(JSON.stringify(b),source,'表示で元の残高を書き換えた');
    console.log('1年基準の実測:'+JSON.stringify({seed,finance_asset,...q}));
  }
  const card=D.cards.byId.coupon_dual;
  for(const option of card.options)for(const outcome of option.outcomes){
    const W=wd.create({seed:4});W.t=23;W.y=2;W.m=3;W.last={sales:1266666};
    const fx={cash:0,demandMul:1,Rd:0},res={};D.cards.apply(W,card,option.id,outcome.id,fx,res,D.rng(4));
    assert.equal(fx.cash,-38000);const sample={res:{23:{choices:res.choices}}};
    const ev=D.months.flatMap(m=>m.events).find(e=>e.id==='coupon_dual-doc0@23');assert.ok(ev.when(sample));const a=ev.ans(sample);assert.deepEqual(a,{dr:[['売上',38000]],cr:[['普通預金',38000]]});assert.equal(D.ramen.fxBookers.coupon_dual(sample,23,res.choices[0]).cash,-38000);
  }
  console.log('OK：1年基準の実残高・共通式・資産/負債合計不変・表示で仕訳なし・値引き2択4結果の支払と記帳が一致');
}
if (!process.argv.includes('--world')) {
  if(!process.argv.includes('--save-only')){
  for(const seed of [0,7]){
    const full=story(seed).S,fast=economicStory(seed).S;
    const plain=x=>JSON.stringify(x,(k,v)=>k==='factors'?undefined:v);
    assert.equal(plain(full),plain(fast),'表示の要因分解を省いて経営・帳簿の結果が変わった');
  }
  console.log('OK：比較表の高速経路と通常経路で世界・帳簿・判断が一致（要因分解の表示値だけ除外）');
  const seen=new Set();let docs=0,calcs=0;const metrics=[];
  for(let seed=0;seed<12;seed++){
    const run=story(seed);metrics.push({seed,y2Cash:run.S.res[23].cash,y3Cash:run.S.res[35].cash,y4JuneCash:run.S.res[38].cash,bankrupt:!!run.S.W.bankrupt});docs+=run.docs;calcs+=run.calcs;for(const id of run.seen)seen.add(id);
  }
  console.log(`OK：39か月の台本12周・仕訳 ${docs}件・計算 ${calcs}件・有限数と貸借一致`);
  for(const mode of ['2026','2027']){
    const {S}=story(7,{__mode:mode,finance_asset:'loan'});assert.equal(S.decisions['finance_asset@25'],'loan','審査を通った借入購入を検査していない');
    assert.ok(S.T.some(e=>(e.y||1)>=2&&e.dr.some(([a])=>a===BOKI.kubun.yearly[mode].rent)));
    for(const e of S.T)for(const side of ['dr','cr'])for(const[a]of e[side])assert.ok(!BOKI.kubun.yearly[mode].forbid.test(a),`年度外の科目 ${mode}/${a}`);
  }
  console.log('OK：2026・2027年度の科目と借入購入の経路');
  if(process.argv.includes('--metrics'))console.log('新台本・既定選択12seedの指標：'+JSON.stringify(metrics));
  for(const costOmen of ['switch','keep','bulk'])story(0,{supplier:'high',costOmen});
  {
    const {S}=story(0);const wrong=clone(S);const entry=wrong.L.find(e=>e.ev==='found');entry.dr[0][1]+=1000;entry.cr[0][1]+=1000;
    assert.equal(D.y2books.reconcile(wrong,38,'L').rest,-1000,'記帳の間違いを説明行に吸収した');
    console.log('OK：高い仕入先の3枝・まとめ買いの支払・誤記1000円を未説明差として検出');
  }
  let branches=0;
  for(const card of D.y2.cards.cards.filter(c=>!c.automatic))for(const option of card.options){
    const result=story(3,{[card.id]:option.id});
    if(result.seen.has(card.id))branches++;
  }
  console.log(`OK：札の選択肢を指定した台本 ${branches}経路（出現条件を満たした経路）`);
  let firstYearNamed=0;
  for(const card of D.cards.deck.filter(c=>!c.y2&&c.docs))for(const option of card.options){
    let reached=false;
    for(const seed of [0,3,7,1,2,4,5,6,8,9,10,11]){
      const {S}=economicStory(seed,{[card.id]:option.id});
      if(Object.entries(S.decisions).some(([key,value])=>key.startsWith(card.id+'@')&&+key.slice(card.id.length+1)<12&&value===option.id)){reached=true;break;}
    }
    assert.ok(reached,'1年目の書類の選択肢へ未到達 '+card.id+'/'+option.id);firstYearNamed++;
  }
  console.log(`OK：1年目の書類つき旧札 ${firstYearNamed}選択肢の動的な名前の検査`);
  { // 既定の受け入れ検査でも全結果を通す
    const missing=[],covered=[];
    for(const card of D.y2.cards.cards)for(const option of card.options)for(const outcome of option.outcomes){
      let found=false;
      for(const seed of [3,0,7]){
        const prerequisites={finance_asset:'installment',maintain_y2:'break',maintain_replace:'keep',bonus:'standard',[card.id]:option.id};
        if(card.id==='items_stock_sale')prerequisites.ticket_items='n20';
        if(card.id==='equipment_purchase')prerequisites.finance_asset='loan';
        if(card.id==='repair_pay')prerequisites.maintain_y2='plan';
        if(card.id==='close_restore')prerequisites.close='close';
        if(card.id==='close_equipment')prerequisites.close='format';
        const {S}=forcedStory(seed,prerequisites,card.id,outcome.id);
        if(S.cardOutcomes.some(x=>x.card===card.id&&x.option===option.id&&x.outcome===outcome.id)){found=true;break;}
      }
      (found?covered:missing).push(`${card.id}/${option.id}/${outcome.id}`);
    }
    console.log('全結果分岐：'+JSON.stringify({covered:covered.length,missing}));assert.deepEqual(missing,[],'未到達の札の結果');
  }
  if(process.argv.includes('--choices')){
    const summary=[];
    for(const card of D.y2.cards.cards.filter(c=>!c.automatic)){
      const results=[],wins=Object.fromEntries(card.options.map(o=>[o.id,0]));let ties=0;
      for(let seed=0;seed<24;seed++){
        const rows=[];
        for(const option of card.options){
          const {S}=economicStory(seed,{[card.id]:option.id});
          const chosen=Object.entries(S.decisions).some(([id,value])=>id.startsWith(card.id+'@')&&value===option.id);
          if(!chosen)continue;
          const equity=Object.entries(BOKI.accounts).filter(([,a])=>a.cat==='純資産').reduce((n,[a])=>n-D.y2books.balance(S.T,a),0)+D.y2books.income(S.T.filter(e=>e.y===4&&!e.closing)).net;
          const row={seed,option:option.id,y3:S.res[35].cash,y4June:S.res[38].cash,founderEquity:equity*300/(S.W.flags.y2Shares||300)};
          rows.push(row);results.push(row);
        }
        if(!rows.length)continue;const best=Math.max(...rows.map(r=>r.y4June)),top=rows.filter(r=>r.y4June===best);if(top.length===1)wins[top[0].option]++;else ties++;
      }
      summary.push({card:card.id,wins,ties,available:Object.fromEntries(card.options.map(o=>[o.id,results.filter(r=>r.option===o.id).length])),results});
      console.log('札の24seed比較：'+JSON.stringify({card:card.id,wins,ties,available:summary[summary.length-1].available}));
    }
    require('fs').writeFileSync(process.env.Y2_COMPARE_OUT||require('path').join(require('os').tmpdir(),'ramen-y2-choices.json'),JSON.stringify(summary,null,2));
  }
  {
    const {S}=forcedStory(0,{ticket_items:'n20',__outcomes:{ticket_items:'d6',items_stock_sale:'d6'}},'ticket_items','d6');
    for(const y of [2,3]){const entry=S.T.find(e=>e.ev===`items-stock-value${y}`);assert.ok(entry,'売れ残り評価の経路がない');assert.equal(D.y2books.balance([entry],'商品評価損'),1200);}
    assert.equal(D.y2books.balance(S.T,'商品'),0,'3か月の販売と評価後に商品の残高が残る');
    const itemEntries=S.T.filter(e=>/^(ticket_items-doc|items-stock-sale@|items-stock-value)/.test(e.ev||''));assert.equal(D.y2books.income(itemEntries).net,12000);
    console.log('OK：物販は先月の残りから販売・3月末の売れ残り評価・費用の二重計上なし');
  }
  for(const [option,outcome,cost]of [['repair','ok',120000],['repair','again',120000],['new','ok',300000],['new','late',300000],['wait','ok',0],['wait','stop',150000]]){
    const {S}=forcedStory(0,{maintain:option},'maintain',outcome);
    const invoice=S.T.filter(e=>e.ev===`maintain-doc${option==='new'?1:0}@8`),payment=S.T.filter(e=>e.ev==='fx-book-maintain@9');
    if(option!=='wait')assert.equal(D.y2books.balance(invoice.concat(payment),'未払金'),0,'12月の修理の未払金が翌月に残る');
    assert.equal(D.y2books.income(invoice.concat(payment)).expense,option==='new'?0:cost,'修理の費用を2回計上した');
    assert.equal(D.y2books.cash(payment),cost?-cost:0,'修理の支払額が世界と違う');
    assert.equal((S.res[9].choices.find(x=>x.card==='maintain')||{cash:0}).cash,cost?-cost:0);
  }
  console.log('OK：1年目の修理・買替・故障の6結果・修理の未払金取崩・費用1回・支払一致');
  for(const action of ['renovate','format'])for(const sale of ['sell','keep']){
    const {S}=story(0,{maintain_replace:sale,close:'stick','close@30':action});
    assert.equal(S.decisions['close@30'],action,'予備を使う10月の判断へ未到達');
    const used=sale==='keep',result=S.W.flags.y2CloseResult;
    assert.equal(result.usedSpare,used);assert.equal(!!S.W.flags.y2Spare,false);
    const equipment=S.T.filter(e=>e.ev===(action==='renovate'?'close-doc3@31':'close-doc5@31'));
    assert.equal(D.y2books.balance(equipment,'備品'),used?0:300000,'予備の使用で新しい備品を二重取得');
    if(action==='renovate')assert.equal(D.y2books.balance(equipment,'建物'),450000);
    assert.equal(D.y2books.cash(equipment),action==='renovate'?(used?-450000:-750000):(used?0:-300000));
    const acquisitions=S.W.flags.y2BranchEquipment||[];assert.equal(acquisitions.filter(a=>a.at===31).length,used?0:1);
    assert.equal(D.y2.close.equipmentDep(S,3),used?0:25000,'新器材の5年定額・11月から5か月');
    for(let t=31;t<=38;t++)assert.ok(!(S.res[t].choices||[]).some(x=>x.card==='spare_storage'),'使用後に保管費が残る');
    assert.equal(S.W.flags.y2SpareUsedAt,used?31:undefined);
  }
  console.log('OK：改装・業態変更×予備ありなし4経路・一度だけ使用・保管費終了・備品取得と5年定額');
  // 制度の24か月比較は、本編での導入時期と分けた反実仮想。
  if(process.argv.includes('--bonus-model')){
    const rows=[];
    for(let seed=0;seed<24;seed++)for(const tier of ['token','standard','generous']){
      const S={seed,decisions:{},T:[],res:{},W:wd.create({seed}),cardOutcomes:[]};S.W.t=12;S.W.y=2;S.W.m=4;
      S.W.flags.staffBonus={kind:'promise',tier,amount:D.y2.cards.coef[{token:'bonusToken',standard:'bonusStandard',generous:'bonusGenerous'}[tier]].v};
      for(let t=12;t<36;t++){
        S.W.flags.y2CurrentDealt=t===18?['minwage_y2']:t===30?['minwage_y3']:[];const pol=wd.policy0(S.W);pol.parts+=(S.W.flags.y2PendingHires || []).filter(x=>x.store===0).length;D.y2.beforePlan(S,t,pol);
        const carry=[...((S.W.flags.y2Recruiting||[]).length?[{id:'staff_hire',option:'hire',t:t-1}]:[]),...((S.W.flags.y2Departures||[]).length?[{id:'staff_leave',option:'leave',t:t-1}]:[])];
        if(t%12===2){S.W.flags.bonusCount=S.W.stores.filter(x=>x.open!==false).reduce((n,x)=>n+x.parts,0);carry.push({id:'bonus_pay',option:'pay',t:t-1});}
        const r=wd.month(S.W,pol,{carry,noCards:true,noFactors:true});S.W=r.W;S.res[t]=r.res;D.y2.afterPlan(S,t,r);finite(r,'賞与モデル');
      }
      rows.push({seed,tier,y2:S.res[23].cash,y3:S.res[35].cash,busy:Object.values(S.res).filter(r=>r.fullDays>0).length/24});
    }
    console.log('賞与制度・検査専用24か月：'+JSON.stringify(rows));
  }
  // 比較の条件を固定し、勝率を合格条件にしない。金額の釣り合いは報告対象。
  if(process.argv.includes('--bonus-story')){
    const rows=[];for(let seed=0;seed<24;seed++)for(const bonus of ['token','standard','generous']){const {S}=economicStory(seed,{bonus});extendWorld(S);rows.push({seed,bonus,y2:S.res[23].cash,y3:S.res[35].cash,y4June:S.res[38].cash,y4Nov:S.res[44].cash,chainHiring:!!S.W.flags.y2ChainHiring,busy:Object.values(S.res).filter(r=>r.t>=32&&r.fullDays>0).length/13});}
    console.log('賞与制度・本編の時期：'+JSON.stringify(rows));
  }
  if(process.argv.includes('--compare')){
    if(process.argv.includes('--resale-low')){D.y2.sale.coef.resale.v=80000;D.cards.byId.maintain_replace.options.find(o=>o.id==='sell').outcomes[0].cash=80000;}
    const wins={sell_plan:0,sell_break:0,keep_plan:0,keep_break:0}, ends={};let ties=0;
    for(let seed=0;seed<24;seed++){
      const rows=[];
      for(const sale of ['sell','keep'])for(const repair of ['plan','break']){
        const id=`${sale}_${repair}`,{S}=economicStory(seed,{maintain_replace:sale,maintain_y2:repair});
        const row={seed,id,y3:S.res[35].cash,y4June:S.res[38].cash};rows.push(row);(ends[id] ||= []).push(row);
      }
      const best=Math.max(...rows.map(x=>x.y4June)), top=rows.filter(x=>x.y4June===best);if(top.length===1)wins[top[0].id]++;else ties++;
    }
    console.log('売却×修理・同じseed24組：'+JSON.stringify({wins,ties,ends}));
  }
  }
  if(!process.argv.includes('--save-only'))verifyMaturity();
  verifySave();
  if(!process.argv.includes('--save-only')){
    const definition=D.namings.貸倒引当金戻入,previous=namingAudit.missing,count=namingAudit.checked;
    try{namingAudit.missing=new Map();delete D.namings.貸倒引当金戻入;economicStory(0);assert.ok(namingAudit.missing.has('貸倒引当金戻入'),'名前の定義を外した対照検査が欠落を検出しない');assert.throws(()=>assert.equal(namingAudit.missing.size,0));}
    finally{D.namings.貸倒引当金戻入=definition;namingAudit.missing=previous;namingAudit.checked=count;}
    console.log('OK：名前の定義を外すと動的な検査が失敗する');
  }
  console.log('動的な名前の検査:'+JSON.stringify({checked:namingAudit.checked,maxNewAccountsPerScreen:namingAudit.maxNewAccounts,missing:[...namingAudit.missing.entries()]}));
  assert.equal(namingAudit.missing.size,0,'定義なしで教えた科目がある');
  console.log(process.argv.includes('--save-only')?'OK：保存の検査のみ（台本の全結果検査とは別）':'OK：2年目以降の台本・全札全結果・口座照合・引当と支払の二重費用なし。損得の釣り合いは別途報告。');
}
