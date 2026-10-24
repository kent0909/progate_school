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
// 台本を実際の順で進める。仕訳はすべて正答を記帳し、決算の締切も行う。
function story(seed, choices = {}) {
  const S={seed,decisions:{},T:[],L:[],discDone:{},cardOutcomes:[],choices:[]};
  let docs=0,calcs=0; const seen=new Set();
  const post=(a,e,m,mi)=>{finite(a,e.id);for(const side of ['dr','cr'])for(const [acc,v]of a[side])assert.ok(v>=0,`${e.id}: ${acc}が負数`);
    assert.equal(a.dr.reduce((n,x)=>n+x[1],0),a.cr.reduce((n,x)=>n+x[1],0),`${e.id}:貸借不一致`);
    const row={...a,id:`${e.id}@${mi}`,ev:e.id,mi,y:m.year||1};S.T.push(row);S.L.push(clone(row));};
  for(let mi=0;mi<D.months.length;mi++) {const m=D.months[mi];S.mi=mi;
    for(const e of m.events) {
      if(e.when&&!e.when(S))continue;
      if(e.t==='decision'){S.decisions[e.id]=choices[e.id]||choices[e.card]||e.options[0].id;if(e.card)seen.add(e.card);}
      if(e.t==='plan'){D.ramen.plan(S,e.ramenT,D.ramen.policy(S,e.ramenT));finite(S.W,'世界');finite(S.res[e.ramenT],'月報');}
      if(e.t==='doc'){post(typeof e.ans==='function'?e.ans(S):e.ans,e,m,mi);docs++;}
      if(e.t==='calc'){const a=typeof e.answer==='function'?e.answer(S):e.answer;assert.ok(Number.isFinite(a),e.id);calcs++;}
      if(e.t==='discover')S.discDone[e.id]=mi;
      if(e.t==='rreport'){for(const a of e.auto(S))post(a,a,m,mi);if(e.ramenT>=12){
        const t=e.ramenT,r=S.res[t],W=S.W;
        (S.shareLog ||= {})[t]={me:r.stores?r.stores[0].N:r.N,rivals:W.rivals.filter(x=>(x.area||W.area)===W.area).map(x=>({id:x.id,name:x.name,type:x.type,N:x.lastN||0,R:x.R,open:x.open!==false}))};
        for(const key of ['shares','position','debrief','forkTree'])finite(D.rview[key](S,t),`画面${key} t${t}`);
        const due=D.rview.dueList(S,t,D.y2books.cash(S.L));finite(due,'期日');if(t<38)assert.ok(due.items.length,'2年目以降の期日が空');
        const debrief=D.rview.debrief(S,t);if(debrief)assert.equal(debrief.quarter,[2,5,8,11].includes(t%12));
        const bridge=D.y2books.reconcile(S,e.ramenT);assert.equal(bridge.rest,0,`seed${seed} t${e.ramenT}:口座照合`);assert.deepEqual(bridge.unknown,[],`seed${seed}:未知の現金取引`);assert.equal(bridge.modelCash,S.res[e.ramenT].cash);}}
      if(e.t==='closing'){
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
  if(S.W.flags.staffBonus&&S.W.flags.staffBonus.kind==='promise')assert.equal(expenseFor(/^bonus-doc[12]@/),60000*(S.W.flags.bonusCount||0),'賞与の引当と支払で費用を二重計上');
  return {S,docs,calcs,seen};
}
function forcedStory(seed,choices,target,outcome){
  const original=D.decide.resolve;
  D.decide.resolve=(card,opt,W,rng)=>{
    if(card.id!==target)return original(card,opt,W,rng);
    const result=card.options.find(x=>x.id===opt).outcomes.find(x=>x.id===outcome);
    assert.ok(result,`強制分岐 ${target}/${opt}/${outcome}`);
    return {id:outcome,outcome:result,weights:D.decide.weights(card,opt,W)};
  };
  try{return story(seed,choices);}finally{D.decide.resolve=original;}
}
if (!process.argv.includes('--world')) {
  const seen=new Set();let docs=0,calcs=0;
  for(let seed=0;seed<12;seed++){
    const run=story(seed);docs+=run.docs;calcs+=run.calcs;for(const id of run.seen)seen.add(id);
  }
  console.log(`OK：39か月の台本12周・仕訳 ${docs}件・計算 ${calcs}件・有限数と貸借一致`);
  let branches=0;
  for(const card of D.y2.cards.cards.filter(c=>!c.automatic))for(const option of card.options){
    const result=story(3,{[card.id]:option.id});
    if(result.seen.has(card.id))branches++;
  }
  console.log(`OK：札の選択肢を指定した台本 ${branches}経路（出現条件を満たした経路）`);
  { // 既定の受け入れ検査でも全結果を通す
    const missing=[],covered=[];
    for(const card of D.y2.cards.cards)for(const option of card.options)for(const outcome of option.outcomes){
      let found=false;
      for(const seed of [3,0,7]){
        const prerequisites={finance_asset:'installment',maintain_y2:'break',maintain_replace:'keep',bonus:'promise',[card.id]:option.id};
        if(card.id==='equipment_purchase')prerequisites.finance_asset='loan';
        if(card.id==='repair_pay')prerequisites.maintain_y2='plan';
        if(card.id==='close_restore')prerequisites.close='close';
        const {S}=forcedStory(seed,prerequisites,card.id,outcome.id);
        if(S.cardOutcomes.some(x=>x.card===card.id&&x.option===option.id&&x.outcome===outcome.id)){found=true;break;}
      }
      (found?covered:missing).push(`${card.id}/${option.id}/${outcome.id}`);
    }
    console.log('全結果分岐：'+JSON.stringify({covered:covered.length,missing}));assert.deepEqual(missing,[],'未到達の札の結果');
  }
  // 制度の24か月比較は、本編での導入時期と分けた反実仮想。
  if(process.argv.includes('--bonus-model')){
    const rows=[];
    for(let seed=0;seed<24;seed++)for(const enabled of [false,true]){
      const S={seed,decisions:{},T:[],res:{},W:wd.create({seed}),cardOutcomes:[]};S.W.t=12;S.W.y=2;S.W.m=4;
      S.W.flags.staffBonus={kind:enabled?'promise':'none'};
      for(let t=12;t<36;t++){
        const pol=wd.policy0(S.W);D.y2.beforePlan(S,t,pol);
        const carry=(S.W.flags.y2Departures||[]).length?[{id:'staff_leave',option:'leave',t:t-1}]:[];
        if(enabled&&t%12===2){S.W.flags.bonusCount=S.W.stores.filter(x=>x.open!==false).reduce((n,x)=>n+x.parts,0);carry.push({id:'bonus_pay',option:'pay',t:t-1});}
        const r=wd.month(S.W,pol,{carry,noCards:true,noFactors:true});S.W=r.W;S.res[t]=r.res;finite(r,'賞与モデル');
      }
      rows.push({seed,enabled,y2:S.res[23].cash,y3:S.res[35].cash});
    }
    console.log('賞与制度・検査専用24か月：'+JSON.stringify(rows));
  }
  // 比較の条件を固定し、勝率を合格条件にしない。金額の釣り合いは報告対象。
  if(process.argv.includes('--bonus-story')){
    const rows=[];for(let seed=0;seed<24;seed++)for(const bonus of ['promise','none']){const {S}=story(seed,{bonus});rows.push({seed,bonus,y2:S.res[23].cash,y3:S.res[35].cash,y4June:S.res[38].cash});}
    console.log('賞与制度・本編の時期：'+JSON.stringify(rows));
  }
  if(process.argv.includes('--compare')){
    const wins={sell_plan:0,sell_break:0,keep_plan:0,keep_break:0}, ends={};let ties=0;
    for(let seed=0;seed<24;seed++){
      const rows=[];
      for(const sale of ['sell','keep'])for(const repair of ['plan','break']){
        const id=`${sale}_${repair}`,{S}=story(seed,{maintain_replace:sale,maintain_y2:repair});
        const row={seed,id,y3:S.res[35].cash,y4June:S.res[38].cash};rows.push(row);(ends[id] ||= []).push(row);
      }
      const best=Math.max(...rows.map(x=>x.y4June)), top=rows.filter(x=>x.y4June===best);if(top.length===1)wins[top[0].id]++;else ties++;
    }
    console.log('売却×修理・同じseed24組：'+JSON.stringify({wins,ties,ends}));
  }
  console.log('OK：2年目以降の台本・全札全結果・口座照合・引当と支払の二重費用なし。損得の釣り合いは別途報告。');
}
