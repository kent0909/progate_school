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
  let docs=0,calcs=0; const seen=new Set();
  const post=(a,e,m,mi)=>{finite(a,e.id);for(const side of ['dr','cr'])for(const [acc,v]of a[side])assert.ok(v>=0,`${e.id}: ${acc}が負数`);
    assert.equal(a.dr.reduce((n,x)=>n+x[1],0),a.cr.reduce((n,x)=>n+x[1],0),`${e.id}:貸借不一致`);
    const row={...a,id:`${e.id}@${mi}`,ev:e.id,mi,y:m.year||1};S.T.push(row);S.L.push(clone(row));};
  for(let mi=0;mi<D.months.length;mi++) {const m=D.months[mi];S.mi=mi;
    for(const e of m.events) {
      if(e.when&&!e.when(S))continue;
      if(e.t==='decision'){const opts=e.optionsFor?e.optionsFor(S):e.options,available=opts.filter(x=>!x.disabled),requested=choices[e.id]||choices[e.card];assert.ok(available.length,e.id+'に選べる手がない');S.decisions[e.id]=available.some(x=>x.id===requested)?requested:available[0].id;if(e.card)seen.add(e.card);}
      if(e.t==='plan'){D.ramen.plan(S,e.ramenT,D.ramen.policy(S,e.ramenT));finite(S.W,'世界');finite(S.res[e.ramenT],'月報');}
      if(e.t==='doc'){
        const a=typeof e.ans==='function'?e.ans(S):e.ans;
        if(m.year>=2){assert.ok(a.dr.length&&a.cr.length,e.id+':全額0円の書類');for(const [,v]of [...a.dr,...a.cr])assert.ok(v>0,`seed${seed} ${e.id}:正解に0円以下 ${v}`);
          const rows=typeof e.doc.rows==='function'?e.doc.rows(S):e.doc.rows;assert.ok(!rows.some(r=>r[2]==='amt'&&r[1]===0),e.id+':表に0円行');}
        post(a,e,m,mi);docs++;
      }
      if(e.t==='calc'){const a=typeof e.answer==='function'?e.answer(S):e.answer;assert.ok(Number.isFinite(a),e.id);calcs++;}
      if(e.t==='discover'){
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
if (!process.argv.includes('--world')) {
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
  console.log('OK：2年目以降の台本・全札全結果・口座照合・引当と支払の二重費用なし。損得の釣り合いは別途報告。');
}
