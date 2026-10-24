#!/usr/bin/env node
// ラーメン版の無作為の通し試験（1・3・5年版）。DESIGN-RAMEN 版1.2.1 (s.3) の受け入れ検査。
// 使い方：node boki2/tools/sim-check.js --ramen [--runs 300] [--seed0 0]（このファイルを直接 node で動かしてもよい）
// 世界・需要・一杯・ライバル・札は純粋関数（DOM なし）。検査はそれを数百〜数千周まわして、
//  ①式の端（値段で客が単調に減る・係数の範囲・平均の店の客数）
//  ②支配的な手がないか（値段：値下げ・据え置き・値上げのどれも最適 <70%、上限まで下げる <40%、1年目と3年目で最適が入れ替わる周 >50%。時間の予算：全部やる <70%。店の形：放置どうしの家族3年末60〜80%・上手どうし≤40%）
//  ③雇いすぎで倒産しうる・詰み <1%・出ない札 0・札の重みの合計＝100・一杯の魅力の減衰・再現・保存 v4
// を確かめる。数字の基準は設計書のもの（変えるなら理由を報告に書く）。
global.window = global;
const path = require('path');
const root = path.join(__dirname, '..');
const STORY = require('./ramen-files.js').story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY].forEach((f) => require(path.join(root, f)));
const B = window.BOKI, D = window.SIMDATA, Wd = D.world, BW = D.bowl, RV = D.rivals, DC = D.decide, CD = D.cards, C = D.coef;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? Number(process.argv[i + 1]) : d; };
const RUNS = arg('--runs', 300), SEED0 = arg('--seed0', 0);
const errors = [], info = [];
const err = (m) => errors.push(m);
const pct = (a, n) => (n ? Math.round((1000 * a) / n) / 10 : 0);
const t0 = Date.now();
const wilson=(k,n)=>{const z=1.96,p=k/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z/d*Math.sqrt(p*(1-p)/n+z*z/(4*n*n));return `${(100*(c-h)).toFixed(1)}〜${(100*(c+h)).toFixed(1)}%`;};


// ---------- 0. 係数の範囲と出どころ ----------
for (const m of C.check()) err(`係数：${m}`);

// 給料の損益・口座・教材のつながりと、持ち越す常連の回帰検査。
{
  for (const family of [0, 1, 2]) {
    for (const price of [700, 1000]) {
      const W = Wd.create({ seed: 0, form: 'family', family });
      W.stores[0].wageUp = 1.05; // パートの改定で家族の固定月給を増やさない
      const before = JSON.stringify(W), p = { ...Wd.policy0(W), price };
      const r = Wd.month(W, p, { noise: false, noCards: true });
      const want = [0, 120000, 270000][family];
      if (r.res.labor !== want || r.res.famPay !== 0) err(`給料：家族${family}人で${r.res.labor}+${r.res.famPay}円（${want}円）`);
      const op = r.res.sales-r.res.cogs-r.res.wasteCost-r.res.labor-r.res.rent-r.res.util-r.res.other-r.res.dep-r.res.ads+r.res.fx;
      if (r.res.op !== op || r.W.cash !== W.cash+r.res.ord+r.res.dep-r.res.repay) err('給料：損益または口座に二重計上');
      if (JSON.stringify(W) !== before) err('月の計算が入力の世界を書き換えた');
    }
  }
  const young = Wd.create({ seed: 2 });
  const grown = JSON.parse(JSON.stringify(young)); grown.stores[0].L = 10;
  const gain = Wd.expectN(grown,850)-Wd.expectN(young,850);
  if (Math.abs(gain-10)>1e-9) err('常連：新規の流れを相殺せず10杯の常連を加算する');
  const W = Wd.create({ seed: 2 }); W.stores[0].L = 10;
  const pol = { ...Wd.policy0(W), price: 800 };
  const cut = Wd.month(W, pol, { noise: false, noCards: true }).W;
  const saved = JSON.parse(JSON.stringify(cut));
  const up = Wd.month(saved, { ...pol, price: 850 }, { noise: false, noCards: true }).res;
  const control = JSON.parse(JSON.stringify(cut)); control.stores[0].discounted = false;
  const plain = Wd.month(control, { ...pol, price: 850 }, { noise: false, noCards: true }).res;
  if (!up.discountRebound || Math.abs(up.regularLost - C('discountChurn')*plain.regularLost) > 1e-9) err('常連：値下げの持ち越し後の値上げで離れが指定倍率でない');
  const tr = Wd.trial(cut, pol);
  if (Math.abs(tr.res.L-cut.stores[0].L-tr.res.regularDelta)>1e-9 || !Number.isFinite(tr.regularPeople) || ![0,6,20,26].includes(tr.res.fullDays)) err('試算：常連増減または満席日数の単位が不正');
  info.push('回帰：家族0/1/2人の固定月給・損益と口座・入力不変・保存後の値上げの離れ×1・常連と満席の試算を検査');
}

// ---------- 無作為の手（いつでも手：値段・仕込み・集客・人・一杯） ----------
const AREAS = ['shotengai', 'ekimae', 'jutaku'];
function widePolicy(W, rng, prev, fit = true, hold = 8) {
  const p = Wd.policy0(W, prev);
  if (W.t % 12 === 0) p.price = 700 + 50 * Math.floor(rng() * 7);
  p.prep = ['low', 'mid', 'high'][Math.floor(rng() * 3)];
  p.flyer = 10000 * Math.floor(rng() * 11);
  p.coupon = rng() < 0.1;
  p.line = rng() < 0.4;
  for (const k of ['forecast', 'map', 'sns', 'haccp', 'inspect']) p[k] = rng() < 0.6;
  p.tweak = rng() < 0.15;
  // 人数は8か月ごとに0〜4人を一様に引き直す（毎月雇い直す分布と区別）。
  if (W.t % hold === 0) p.parts = Math.floor(rng() * 5);
  p.borrow = rng() < 0.5 && W.cash < 300000; // 口座が薄い月は半々で短期借入（c.4 の手①）
  return fit ? Wd.fitTime(W, p, rng) : p;
}
// 段0〜4との比較用の手。拡張したF7の母集団とは混ぜず、既存の価格・時間・店の形の検査に残す。
function randPolicy(W, rng, prev, fit = true) {
  const p = Wd.policy0(W, prev), steps = [-100, -50, 0, 50, 100];
  const cur = prev ? prev.price : W.stores[0].price;
  p.price = Math.max(Wd.PRICE_MIN, Math.min(Wd.PRICE_MAX, cur + steps[Math.floor(rng()*steps.length)]));
  p.prep = ['low', 'mid', 'high'][Math.floor(rng()*3)];
  p.flyer = [0, 0, 30000, 100000][Math.floor(rng()*4)];
  p.coupon = rng() < 0.1; p.line = rng() < 0.4;
  for (const k of ['forecast', 'map', 'sns', 'haccp', 'inspect']) p[k] = rng() < 0.6;
  p.tweak = rng() < 0.15;
  if (rng() < 0.08) p.parts = Math.max(0, Math.min(3, p.parts + (rng() < 0.5 ? -1 : 1)));
  p.borrow = rng() < 0.5 && W.cash < 300000;
  return fit ? Wd.fitTime(W, p, rng) : p;
}
function play(seed, o = {}) {
  const rng = D.rng(seed * 7919 + 13);
  // 一杯は社長の案3つのどれか（X28：1周目は社長の案から）。seed で選ぶ
  let W = Wd.create({ seed, area: o.area || AREAS[seed % 3], form: o.form || 'part1', parts: o.parts, family: o.family, tier: 0, bowl: o.bowl || BW.presets[seed % 3].spec });
  const hist = [];
  let pol = null;
  const months = o.months || 13;
  for (let k = 0; k < months; k++) {
    pol = o.policy ? o.policy(W, k, pol, rng) : randPolicy(W, rng, pol);
    const before = W;
    const r = Wd.month(W, pol, { rng: D.rng(seed * 104729 + k), noFactors: !o.factors });
    W = r.W;
    hist.push({ k, W: before, after: W, pol, res: r.res });
    if (o.onMonth) o.onMonth(before, pol, r, k);
    if (W.bankrupt) break;
  }
  return { W, hist };
}

// 1号店で実装済みの手だけを使う3方針。多店舗・工場＋卸・FC＋通販は未実装で別の検査が必要。
const SMART = ['常連と地図', '一杯と衛生', '集客と席'];
const median = (xs) => { const a = xs.slice().sort((a,b)=>a-b); return a.length ? a[Math.floor(a.length/2)] : NaN; };
function smartBase(W, strategy, price, o = {}) {
  const p = Wd.policy0(W, null, { neutral: true });
  p.price = price != null ? price : W.t < 12 ? 800 : W.t < 24 ? 850 : 900;
  const nd = Wd.expectN(W, p.price), mix = W.town.areas[W.area].mix.family;
  const weekend = mix * C('weekendFamily') + (1 - mix) * C('weekendSingle');
  const weekday = nd * C('days') / (20 + 6 * weekend);
  const sold = (cap) => 20 * Math.min(weekday, cap) + 6 * Math.min(weekday * weekend, cap);
  const cost = BW.cost(W.stores[0].bowl) * (W.stores[0].supMul || 1) + (C('items') - 1) * C('price0') * C('cogs');
  const margin = p.price * C('items') * (1 - C('utilVar')) - cost;
  const maxParts = o.maxParts || 2;
  let parts = 1;
  for (let n = 2; n <= maxParts; n++) { if ((sold(C('capBy')[n]) - sold(C('capBy')[n - 1])) * margin > C('wagePart')) parts = n; else break; }
  p.parts = parts;
  p.family = 0; p.line = true; p.prep = 'mid';
  p.flyer = [30000, 0, 100000][strategy];
  const order = strategy === 0 ? ['map', 'haccp', 'forecast', 'tweak', 'sns'] : strategy === 1 ? ['haccp', 'tweak', 'map', 'forecast', 'inspect'] : ['map', 'sns', 'haccp', 'forecast', 'tweak'];
  for (const k of Wd.TIME_KEYS) p[k] = false;
  for (const k of order) { p[k] = k !== 'tweak' || Wd.canTweak(W); if (Wd.timeUsed(W, p) > Wd.timeBudget(W, p)) p[k] = false; }
  p.borrow = W.cash < 300000;
  if (o.sign) { p.sign = o.sign === 'cash' ? (W.flags.signPick || (C('ownCash') + C('loan') - C('fitout') - C('deposit') - C('equipOpen') > 2000000 ? 'large' : C('ownCash') + C('loan') - C('fitout') - C('deposit') - C('equipOpen') > 1000000 ? 'small' : 'none')) : o.sign; p.signAt = o.signAt != null ? o.signAt : 3; }
  if (o.supplier) p.supplier = typeof o.supplier === 'function' ? o.supplier(W) : o.supplier;
  if (o.limited && W.m === 8) p.limited = true;
  return p;
}
// 版0.8 d.9.3 の上手（状況に応じる）：値段は年で、雇うのは客数が上限の9割を越え口座が150万以上のとき、看板は口座で、仕入先は方針で
const PRICES = [[800, 850, 950, 1000, 1000], [850, 900, 1000, 1000, 1050], [750, 800, 900, 950, 950]];
function smartX(W, strategy, o = {}) {
  const y = Math.min(4, Math.floor(W.t / 12));
  const price = o.prices ? o.prices[Math.min(o.prices.length - 1, y)] : PRICES[strategy][y];
  const p = smartBase(W, strategy, price, { maxParts: 1, sign: o.sign || 'cash', signAt: o.signAt, supplier: o.supplier || (strategy === 1 ? 'high' : strategy === 0 ? (W.t >= 12 ? 'high' : 'std') : 'std'), limited: true });
  const me = W.stores[0];
  let parts = o.parts != null ? o.parts : me.parts;
  if (o.parts == null && W.t >= 12 && me.Nlast > 0.9 * Wd.capOf(me) && W.cash > 1500000 && parts < (o.maxParts || 3)) parts += 1;
  p.parts = parts;
  if (o.flyer != null) p.flyer = o.flyer;
  return Wd.fitTime(W, p, D.rng(W.seed * 37 + W.t));
}
// 基礎の手だけの店：放置に 小の看板・LINE・高い仕入先（d.9.3）
function basicPolicy(W) { return { ...idlePolicy(W), line: true, sign: 'small', signAt: 3, supplier: 'high' }; }
function smartPolicy(W, strategy, price) { return smartX(W,strategy,price == null ? {} : {prices:[price,price,price,price,price]}); }
// 比較する店の口座・人員が違っても、翌月の抽選位置は同じに保つ。
{
  for (const policy of [randPolicy, widePolicy]) {
    const left = Wd.create({ seed: 7, form: 'family' });
    const right = Wd.create({ seed: 7, form: 'part1' });
    left.cash = 0; right.cash = 7000000;
    const a = D.rng(71), b = D.rng(71);
    const pa = policy(left, a, null, false), pb = policy(right, b, null, false);
    for (const k of ['price','prep','flyer','coupon','line',...Wd.TIME_KEYS]) {
      if (pa[k] !== pb[k]) err(`無作為の比較：口座・形で${k}の抽選が変わる`);
    }
    if (a() !== b()) err('無作為の比較：口座・形で翌月の乱数位置がずれる');
  }
  const W = Wd.create({ seed: 3 });
  for (const price of [700,1000]) {
    const p = smartPolicy(W,0,price);
    if (p.price !== price || Wd.timeUsed(W,p)>Wd.timeBudget(W,p)) err('上手な手：候補価格または時間の予算が不正');
  }
  info.push(`町seed：潜在客±${100*C('townPotentialSpread')}%・家賃±${100*C('townRentSpread')}%・その他固定費15/20万。F7の人数は8か月・価格は12か月保持、借入は薄い月に半々、枠200万1回`);
  info.push('比較の回帰：口座・店の形で抽選位置を変えない／価格候補を上手な手に渡す／時間の予算内');
}
// d.9.1/5の境界と保存の回帰。診断用の他店価格固定が需要計算前に効くことも確かめる。
{
  for(const R of [3,4]) for(const line of [false,true]) {
    const W=Wd.create({seed:4,R0:R}); W.stores[0].L=10;
    const r=Wd.month(W,{...Wd.policy0(W),line},{noise:false,noCards:true});
    const expected=Math.max(0.01,0.03-(line?0.009:0)-0.005*Math.max(0,r.res.R-3));
    if(Math.abs(r.res.regularLost/10-expected)>1e-9)err('d.9：常連の離れの式が違う');
  }
  for(const price of [850,950]) for(const F of [1,0.8]) {
    const W=Wd.create({seed:4});W.stores[0].L=10;W.stores[0].bowl.Fbase=F;
    const r=Wd.month(W,{...Wd.policy0(W),price},{noise:false,noCards:true});
    const expected=Math.max(0.01,0.03-0.005*Math.max(0,r.res.R-3)+0.04*Math.max(0,(price-850)/850)*10+(F<0.9?0.01:0));
    if(Math.abs(r.res.regularLost/10-expected)>1e-9)err('常連：値上げまたは一杯の古びによる離れが抜けた');
  }
  const alone=Wd.create({seed:5});alone.rivals=[];alone.town.areas[alone.area].pRef=1000;
  const noRivals=Wd.month(alone,{...Wd.policy0(alone),price:1200},{noCards:true,noise:false});
  if(noRivals.res.pRef!==850)err('d.9：他店0軒の相場が850円でない');
  let W=Wd.create({seed:3});const fixed=Object.fromEntries(W.rivals.map(r=>[r.id,r.price]));
  for(let t=0;t<6;t++) {
    W=Wd.month(W,{...Wd.policy0(W),price:700},{noCards:true,noise:false,fixedRivalPrices:fixed}).W;
    if(W.rivals.some(r=>r.price!==fixed[r.id]))err('診断：他店の固定価格が動く');
  }
  const copy=JSON.parse(JSON.stringify(W));
  if(copy.rentMul!==W.rentMul || copy.town.areas[W.area].potentialMul!==W.town.areas[W.area].potentialMul)err('町seedが保存で変わる');
  let prev=null; const rng=D.rng(23);const base=Wd.create({seed:2});
  for(let t=0;t<12;t++){
    const p=widePolicy({...base,t},rng,prev,false);
    if(prev&&(p.price!==prev.price||(t%8!==0&&p.parts!==prev.parts)))err('F7：指定期間内に価格または人数を再抽選');
    prev=p;
  }
  info.push('d.9回帰：LINE/評判の離れ・他店0軒の850円・他店価格固定・町seedの保存・F7の価格12か月・人数8か月保持');
}
// 版1.2.1：札の2つの経路で、切替/支払いがともにt=9から始まり、保存後も二重計上しない。
{
  const omen=CD.byId.costOmen;
  if(!omen.fixed||omen.options.length!==3)err('予兆：必ず配る3択でない');
  for(const seed of [0,1,3])for(const choice of ['switch','keep','bulk']){
    let W=Wd.create({seed});W.t=8;W.m=12;W.cash=5000000;
    if(W.flags.costOmen&&!CD.deal(W,D.rng(4)).includes('costOmen'))err('予兆：対象の町に札が配られない');
    const applyAt=(x)=>{const res={},fx={cash:0,Rd:0,demandMul:1};CD.apply(x,omen,choice,'ok',fx,res,D.rng(1));};
    // simはt=8にflagsを置き、engineはt=9のcarryで同じflagsを置く。
    const sim=JSON.parse(JSON.stringify(W));applyAt(sim);
    const p={...Wd.policy0(W),supplier:'high'};
    const a8=Wd.month(sim,p,{noise:false,noCards:true}),b8=Wd.month(W,p,{noise:false,noCards:true});
    if(a8.res.bulkPaid||a8.W.stores[0].supplier!=='high'||a8.W.cash!==b8.W.cash)err('予兆：t=8で翌月の効果が発生');
    const a=Wd.month(JSON.parse(JSON.stringify(a8.W)),Wd.policy0(a8.W,p),{noise:false,noCards:true});
    const b=Wd.month(b8.W,p,{noise:false,noCards:true,carry:[{id:'costOmen',option:choice,t:8}]});
    if(a.res.bulkPaid!==b.res.bulkPaid||a.W.stores[0].supplier!==b.W.stores[0].supplier||a.res.cogs!==b.res.cogs)err('予兆：sim/engineでt=9の効果が違う');
    if(choice==='bulk'){
      if(a.res.bulkPaid!==300000||a.W.flags.bulkPay)err('予兆：まとめ買いが1回30万円にならない');
      const x=Wd.month(a.W,Wd.policy0(a.W,p),{noise:false,noCards:true});if(x.res.bulkPaid)err('予兆：翌々月に二重払い');
      for(const t of [11,12,17,18]){const base=JSON.parse(JSON.stringify(a.W));base.t=t;const r=Wd.month(base,{...p,supplier:'high'},{noise:false,noCards:true});if(r.W.stores[0].bulkBack!==(t>=12&&t<18?45000:0))err('予兆：在庫を戻す月が違う');}
    }
    if(choice==='switch'&&a.W.stores[0].supplier!=='std')err('予兆：t=9から標準にならない');
  }
  for(const sign of ['none','small','large','later'])for(const supplier of ['cheap','std','high']){
    const S={seed:4,decisions:{sign,supplier},profile:{}};
    const p0=D.ramen.policy(S,0);
    if(p0.sign!==(sign==='later'?'large':sign)||p0.signAt!==(sign==='later'?15:3)||p0.supplier!==supplier)err('開店：看板/仕入先の選択が方針に届かない');
    D.ramen.plan(S,0,p0);
    const saved=JSON.parse(JSON.stringify(S)),p1=D.ramen.policy(saved,1);p1.supplier='std';D.ramen.plan(saved,1,p1);
    if(saved.W.stores[0].supplier!=='std'||!D.ramen.opens(1).includes('supplier'))err('仕入先：保存再開後に月ごとに替えられない');
  }
  const W=Wd.create({seed:4});const before=JSON.stringify(W);
  smartPolicy(W,0);if(JSON.stringify(W)!==before)err('上手な方針が入力を書き換える');
  let b=BW.create(BW.presets[0].spec);b.age=20;
  if(BW.step(b,{tier:0,regShare:.9}).Fbase!==BW.step(b,{tier:0,regShare:0}).Fbase)err('一杯：常連による減衰半減が残る');
  info.push('版1.2回帰：予兆fixed・sim/engineのt=9・保存後の単回支払い・在庫t=12〜17・方針の入力不変・常連の減衰半減なし');
}

// PR #1 / 6381276347：まとめ買いの記帳・棚卸・翌期戻しとdata-bridgeの差分。
{
  const docs=D.months.flatMap(m=>m.events),doc=docs.find(e=>e.kind==='buy_bulk');
  const stock=docs.find(e=>e.id==='stock'),back=docs.find(e=>e.id==='stock-back'),genmo=docs.find(e=>e.id==='genmo');
  let checked=0;
  for(const seed of [0,2,4,6]){
    const run=choice=>{
      const S={seed,decisions:{supplier:'high'},profile:{}};
      for(let t=0;t<12;t++){
        D.ramen.plan(S,t,D.ramen.policy(S,t));
        for(const id of S.dealt[t])S.decisions[`${id}@${t}`]=id==='costOmen'?choice:CD.byId[id].options[0].id;
      }
      return S;
    };
    const bulk=run('bulk'),keep=run('keep'),entry=doc.ans(bulk);
    if(!doc.when(bulk)||doc.when(keep)||entry.dr[0][0]!=='仕入'||entry.cr[0][0]!=='普通預金'||entry.dr[0][1]!==300000||entry.cr[0][1]!==bulk.res[9].bulkPaid)err('まとめ買い：1月の仕訳と世界の支払いが一致しない');
    for(const t of [9,10,11]){
      // 同じ月の既存仕訳を共通の残高とし、追加した仕訳と世界の支払いの差だけを比較する。
      const brBulk=D.rview.bridge(bulk,t,{'普通預金':-entry.cr[0][1]}),brKeep=D.rview.bridge(keep,t,{});
      if(brBulk.rest!==brKeep.rest)err(`まとめ買い：seed${seed} t${t}でdata-bridgeの説明できない差が増えた`);
    }
    const noBulk=JSON.parse(JSON.stringify(bulk));delete noBulk.res[9].bulkPaid;
    if(stock.ans(bulk).dr[0][1]-stock.ans(noBulk).dr[0][1]!==300000||back.ans(bulk).dr[0][1]-back.ans(noBulk).dr[0][1]!==300000||genmo.ans(bulk).dr[0][1]!==genmo.ans(noBulk).dr[0][1])err('まとめ買い：棚卸/翌期戻し30万または通常の材料だけの減耗が不正');
    checked++;
  }
  info.push(`まとめ買いの帳簿：${checked} seedで1月仕訳・3月棚卸・4月戻し・通常在庫だけの減耗・data-bridge追加差0を検査`);
}

// 年ごとの価格7候補を全探索（7³=343経路）。共通の年の接頭部分は1回だけ計算。
// 36か月の同じ営業利益を比較し、1年目と3年目の別々の36か月を比べない。
const YEAR_PRICES = [700, 750, 800, 850, 900, 950, 1000];
function pricePlan(W, strategy, year = 0, fixedRivalPrices = null, firstPrices = YEAR_PRICES) {
  if (year === 3) return { value: 0, prices: [] };
  let best = null;
  for (const price of (year === 0 ? firstPrices : YEAR_PRICES)) {
    let x = W, sum = 0;
    for (let k = 0; k < 12; k++) {
      const p = smartPolicy(x, strategy, price);
      const r = Wd.month(x, p, { noise: false, noCards: true, noFactors: true, rng: D.rng(90001 + x.t + 7777 * x.seed), fixedRivalPrices });
      x = r.W; sum += r.res.op;
      if (x.bankrupt) break;
    }
    if (x.bankrupt) continue;
    const tail = pricePlan(x, strategy, year + 1, fixedRivalPrices, firstPrices);
    if (!tail) continue;
    const value = sum + tail.value;
    if (!best || value > best.value) best = { value, prices: [price, ...tail.prices] };
  }
  return best;
}
function pricePath(W, strategy, prices, fixedRivalPrices = null) {
  let x = W; const hist = [];
  for (let k = 0; k < 36; k++) {
    const p = smartPolicy(x, strategy, prices[Math.floor(k / 12)]);
    const r = Wd.month(x, p, { noise: false, noCards: true, noFactors: true, rng: D.rng(90001 + x.t + 7777 * x.seed), fixedRivalPrices });
    hist.push({ W: x, pol: p, res: r.res }); x = r.W;
  }
  return hist;
}
// d.9.1 の放置：地図だけ。毎月850円・パート1人、常連の呼び戻しや衛生などを足さない。
function idlePolicy(W) {
  const p = Wd.policy0(W,null,{neutral:true});
  for (const key of Wd.TIME_KEYS) p[key] = false;
  return {...p,price:850,parts:1,family:0,map:true,line:false,prep:'mid',flyer:0,borrow:false};
}
function idleCounts() {
  return Array.from({length:RUNS},(_,s)=>{
    const r=play(SEED0+s,{months:36,policy:idlePolicy});
    return r.hist.slice(24).reduce((sum,h)=>sum+h.res.N,0)/12;
  }).sort((a,b)=>a-b);
}
// 係数を勝率で合わせず、指定された放置店の客数だけで逆算。ファイルは書き換えない。
if (process.argv.includes('--calibrate')) {
  let low=C.table.potentialScale.lo, high=C.table.potentialScale.hi;
  for(let i=0;i<14;i++) {
    const mid=(low+high)/2; C.table.potentialScale.v=mid;
    const n=median(idleCounts());
    if(n<C('median')) low=mid; else high=mid;
  }
  C.table.potentialScale.v=Number(((low+high)/2).toFixed(6));
  console.log(`逆算（d.9.1）：seed ${SEED0}〜${SEED0+RUNS-1}、地図のみ・850円・パート1人、札/週の揺れあり、倒産後0人。potentialScale=${C('potentialScale')}、3年目中央値=${median(idleCounts()).toFixed(4)}人/日`);
  process.exit(0);
}
// 版1.2 (s.3)#3/4/8/10/11：実際の60か月のネットキャッシュで比較。
{
  const at=(r,t)=>Wd.netCash((r.hist[t-1]||r.hist.at(-1)).after);
  const run=(seed,policy)=>play(seed,{months:60,policy});
  const nc=(seed,policy)=>Wd.netCash(run(seed,policy).W);
  const rowsSup=[], rowsSign=[], rowsHire=[], rowsOmen=[], tasteWins={};
  const labels=['never','yearly','max','thermo','thermoAug'];
  const basicWins=[0,0,0],idleWins=[0,0,0];let baseWin=0,tasteN=0;
  const bestOf=values=>{const a=Object.entries(values).sort((a,b)=>b[1]-a[1]);return a[0][1]===a[1][1]?'tie':a[0][0];};
  const summarize=(rows,keys,label,pass)=>{
    const count=(rs,lab)=>{const wins=keys.map(k=>rs.filter(r=>r.best===k).length),den=rs.filter(r=>r.best!=='tie').length;
      const rates=wins.map(w=>pct(w,den));info.push(`${lab}（${rs.length}周・同点${rs.length-den}）：${keys.map((k,i)=>`${k} ${rates[i]}%${rates[i]>=70?' ✗':''}`).join('／')}`);
      if(pass&&lab===label){if(!den)err(`${label}：比較できる周が0`);else pass(rates);}
    };
    count(rows,label);
    const ps=rows.map(r=>r.pot).sort((a,b)=>a-b),lo=ps[Math.floor(ps.length/3)],hi=ps[Math.floor(ps.length*2/3)];
    for(const area of AREAS)count(rows.filter(r=>r.area===area),`${label}/${area}（参考）`);
    for(const [lab,fn] of [['薄い',r=>r.pot<lo],['中',r=>r.pot>=lo&&r.pot<hi],['厚い',r=>r.pot>=hi]])count(rows.filter(fn),`${label}/${lab}（参考）`);
    for(let st=0;st<3;st++)count(rows.filter(r=>r.st===st),`${label}/${SMART[st]}（参考）`);
  };
  let switchWin=0,switchN=0;const switchGap=[];
  for(let seed=SEED0;seed<SEED0+RUNS;seed++){
    const W=Wd.create({seed,area:AREAS[seed%3]}),st=Math.floor(seed/3)%3;
    const meta={seed,st,area:W.area,pot:W.town.areas[W.area].potentialMul};
    const idle=nc(seed,idlePolicy),basic=nc(seed,basicPolicy);
    if(basic>idle)baseWin++;
    for(let strategy=0;strategy<3;strategy++){
      const smart=nc(seed,W=>smartX(W,strategy));
      if(smart>basic)basicWins[strategy]++;if(smart>idle)idleWins[strategy]++;
    }
    const sup={};for(const supplier of ['cheap','std','high'])sup[supplier]=nc(seed,W=>smartX(W,st,{supplier}));
    rowsSup.push({...meta,best:bestOf(sup)});
    if(seed%2===0){const sw=nc(seed,W=>smartX(W,st,{supplier:W=>W.t>=9?'std':'high'}));switchN++;if(sw>sup.high)switchWin++;switchGap.push(sw-sup.high);}
    for(const who of ['idle','smart']){
      const sign={};for(const [key,kind,signAt] of [['none','none',3],['small','small',3],['large','large',3],['later','large',15]]){
        sign[key]=nc(seed,W=>who==='idle'?{...idlePolicy(W),line:true,sign:kind,signAt}:smartX(W,st,{sign:kind,signAt}));
      }
      rowsSign.push({...meta,who,best:bestOf(sign)});
    }
    const noHire=run(seed,W=>smartX(W,st,{parts:1})),noCash=Wd.netCash(noHire.W);
    const hire=Math.max(nc(seed,W=>smartX(W,st)),nc(seed,W=>smartX(W,st,{parts:W.t>=12?2:1})),nc(seed,W=>smartX(W,st,{parts:W.t>=24?3:W.t>=12?2:1})));
    rowsHire.push({...meta,win:hire>noCash,full:noHire.hist.slice(0,12).reduce((s,h)=>s+h.res.fullDays,0)});
    const taste={};
    for(const kind of labels)taste[kind]=nc(seed,W=>{
      const p=smartX(W,st),F=W.stores[0].bowl.Fbase;
      p.tweak=kind==='never'?false:kind==='yearly'?W.m===5&&Wd.canTweak(W):kind==='max'?Wd.canTweak(W):F<.92&&Wd.canTweak(W);
      p.limited=kind==='never'?false:kind==='max'?[5,8,11,2].includes(W.m):kind==='thermo'?F<.92&&W.m===8:W.m===8;
      if(p.tweak&&Wd.timeUsed(W,p)>Wd.timeBudget(W,p))for(const key of ['sns','forecast','haccp','map'])if(p[key]){p[key]=false;break;}
      return p;
    });
    const best=bestOf(taste);if(best!=='tie'){tasteN++;tasteWins[best]=(tasteWins[best]||0)+1;}
    if(W.flags.costOmen){
      const values={};for(const opt of ['switch','keep','bulk'])values[opt]=nc(seed,W=>{
        const p=smartX(W,st,{supplier:W=>W.t>=9&&W.flags.supplierNext?W.flags.supplierNext:'high'});
        if(W.t===8)p.cards={costOmen:opt};return p;
      });
      rowsOmen.push({...meta,rise:seed%2===0,best:bestOf(values)});
    }
  }
  for(let st=0;st<3;st++){
    const b=pct(basicWins[st],RUNS),i=pct(idleWins[st],RUNS);
    info.push(`上手${SMART[st]}（${RUNS}周・5年末）：基礎に勝つ${b}%、放置に勝つ${i}%`);
    if(b<80||i<90)err(`上手${SMART[st]}：基礎${b}%（≥80）・放置${i}%（≥90）`);
  }
  info.push(`基礎が放置に勝つ（5年末）：${pct(baseWin,RUNS)}%`);
  if(pct(baseWin,RUNS)<60)err('基礎が放置に勝つ周が60%未満');
  summarize(rowsSup,['cheap','std','high'],'仕入先',rates=>{if(rates[2]>=70)err('仕入先：高いが最良70%以上');});
  summarize(rowsSign.filter(r=>r.who==='idle'),['none','small','large','later'],'看板/放置＋LINE',rates=>{if(Math.max(...rates)>=70)err('看板：放置＋LINEで最多70%以上');});
  summarize(rowsSign.filter(r=>r.who==='smart'),['none','small','large','later'],'看板/上手（参考）');
  info.push(`仕入先（参考）：上がる町でt=9から標準に替える勝率${pct(switchWin,switchN)}%、差の中央値${Math.round(median(switchGap)/10000)}万`);
  const hireRate=rs=>pct(rs.filter(r=>r.win).length,rs.length);
  info.push(`雇う判断（1号店は参考・決定32）：雇う3手のどれかが勝つ${hireRate(rowsHire)}%、Wilson95% ${wilson(rowsHire.filter(r=>r.win).length,rowsHire.length)}`);
  const pots=rowsHire.map(r=>r.pot).sort((a,b)=>a-b),a=pots[Math.floor(pots.length/3)],b=pots[Math.floor(pots.length*2/3)];
  for(const [label,fn] of [['薄い',r=>r.pot<a],['中',r=>r.pot>=a&&r.pot<b],['厚い',r=>r.pot>=b],['満席0日',r=>r.full===0],['満席1〜20日',r=>r.full>0&&r.full<=20],['満席21日以上',r=>r.full>20]])info.push(`雇う判断/${label}（参考）：${hireRate(rowsHire.filter(fn))}%`);
  info.push(`味を変える5手（参考・${tasteN}周）：${labels.map(k=>`${k} ${pct(tasteWins[k]||0,tasteN)}%`).join('／')}`);
  summarize(rowsOmen,['switch','keep','bulk'],'原価の予兆',rates=>{if(Math.max(...rates)>=70)err('原価の予兆：最多の手が70%以上');});
  for(const rise of [true,false])summarize(rowsOmen.filter(r=>r.rise===rise),['switch','keep','bulk'],`原価の予兆/${rise?'上がる':'外れ'}（参考）`);
}

// 方針ごと・全体の3年目の年平均客数。倒産した店の残り月は0として母数を保つ。
{
  const all = [];
  for (let strategy = 0; strategy < SMART.length; strategy++) {
    const ns = [], ls = [], fs = [];
    for (let s = 0; s < RUNS; s++) {
      const r = play(SEED0 + s, { months: 36, policy: W => smartPolicy(W, strategy) });
      const late = r.hist.slice(24);
      ns.push(late.reduce((a,h)=>a+h.res.N,0)/12);
      ls.push(late.reduce((a,h)=>a+h.res.L/Math.max(1,h.res.N),0)/12);
      fs.push(late.reduce((a,h)=>a+h.res.fullDays,0)/12);
    }
    all.push(...ns); ns.sort((a,b)=>a-b);
    const q3 = ns[Math.floor(ns.length*0.75)];
    info.push(`上手な手（1号店・${SMART[strategy]}、${RUNS}周）：3年目客数 中央値${median(ns).toFixed(1)}・上位25% ${q3.toFixed(1)}人/日、常連割合 中央値${(100*median(ls)).toFixed(1)}%、満席日/月 中央値${median(fs).toFixed(1)}`);
  }
  all.sort((a,b)=>a-b); const q3 = all[Math.floor(all.length*0.75)];
  info.push(`参考：1号店3方針の3年目上位25% ${q3.toFixed(1)}人/日。客数は版1.2 (s.3)により参考。合否は5年目末のネットキャッシュで比較。`);
}

// ---------- 1. 式の端：値段を1円刻みで回して客数が単調に減る ----------
{
  let bad = 0, n = 0;
  for (let s = 0; s < 10; s++) {
    const { hist } = play(SEED0 + s, { months: 8 });
    for (const h of [hist[2], hist[7]].filter(Boolean)) {
      let last = Infinity;
      for (let p = 500; p <= 1500; p += 1) { const N = Wd.expectN(h.W, p); n++; if (!(N <= last + 1e-9) || !isFinite(N) || N < 0) { bad++; break; } last = N; }
    }
  }
  if (bad) err(`式の端：値段を上げて客数が増える／数でない所が ${bad} 状態`);
  info.push(`式の端：500〜1,500円を1円刻み、${n} 点で単調に減る`);
}

// ---------- 2. 平均の店（評判3・品質3・値段は相場・パート1人・手を打たない）が育ったときの客数：中央値 44±8 人/日 ----------
{
  const avg = idleCounts();
  const med = avg[Math.floor(avg.length / 2)], q3 = avg[Math.floor(avg.length * 0.75)];
  if (med < 36 || med > 52) err(`平均の店：育った後（3年目）の客数の中央値 ${med.toFixed(1)} 人/日（44±8 の外）`);
  info.push(`平均の店（手を打たない・3年目）：客数の中央値 ${med.toFixed(1)} 人/日、上位25% ${q3.toFixed(1)} 人/日（上手な3方針は別に検査）`);
}

// ---------- 3. 無作為の通し（1年目＋翌4月 13か月）：倒産・詰み・出ない札・札の重み ----------
const dealt = {};
let bankrupt1 = 0, stuck = 0, weightBad = 0, cardsChecked = 0;
const netCash = [];
for (let s = 0; s < RUNS; s++) {
  let stuckHere = false;
  const { W } = play(SEED0 + s, {
    policy: (W, k, prev, rng) => widePolicy(W, rng, prev),
    onMonth: (before, pol, r) => {
      for (const id of r.res.cards || []) dealt[id] = (dealt[id] || 0) + 1;
      // 札の重み：この状態で出せる札の、どの選択肢の結果の重みも合計100・結果は2つ以上
      for (const c of CD.deck) {
        if (!c.when || !c.when(before)) continue;
        for (const o of c.options) { cardsChecked++; const ws = DC.weights(c, o.id, before); const sum = ws.reduce((a, x) => a + x.w, 0); if (Math.abs(sum - 100) > 1e-6 || ws.length < (c.id === 'costOmen' ? 1 : 2) || ws.some((x) => !(x.w >= 0))) { weightBad++; if (weightBad < 5) err(`札 ${c.id}・${o.id}：重みの合計 ${sum}・結果 ${ws.length}（合計100・2つ以上）`); } }
      }
      // 詰み：口座がまだ残っているのに、人を減らし・宣伝をやめ・値段を据え置いても3か月以内に支払不能
      if (!stuckHere && r.W.cash >= 0 && !r.W.bankrupt) { if (Wd.rescueFails(r.W, 3)) stuckHere = true; }
    },
  });
  if (W.bankrupt && W.t <= 12) bankrupt1++;
  if (stuckHere) stuck++;
  netCash.push(Wd.netCash(W));
}
{
  if (pct(bankrupt1, RUNS) < 5 || pct(bankrupt1, RUNS) > 10) err(`F7：1年目の倒産 ${pct(bankrupt1, RUNS)}%（5〜10%）`);
  const never = CD.deck.filter((c) => !dealt[c.id]).map((c) => c.id);
  if (never.length) err(`出ない札：${RUNS}周で一度も出ない札 ${never.join('・')}`);
  if (pct(stuck, RUNS) >= 1) err(`詰み：${pct(stuck, RUNS)}% の周（1% 未満）`);
  netCash.sort((a, b) => a - b);
  info.push(`無作為 ${RUNS}周（13か月）：1年目（12か月以内）の倒産 ${pct(bankrupt1, RUNS)}%（F7 の目安 5〜10%）、詰み ${pct(stuck, RUNS)}%、札 ${CD.deck.length} 本すべて出た（${never.length ? '×' : '○'}）、重みの検査 ${cardsChecked} 回。翌4月のネットキャッシュ（口座−借入）の中央値 ${Math.round(netCash[Math.floor(RUNS / 2)] / 1e4)}万・下位10% ${Math.round(netCash[Math.floor(RUNS * 0.1)] / 1e4)}万・上位10% ${Math.round(netCash[Math.floor(RUNS * 0.9)] / 1e4)}万`);
}

// 版1.2 (s.3)#7：母集団を替えた参考。合否は8か月保持の上の結果だけ。
for(const hold of [7,9,12]){
 let dead=0,stuck=0;
 for(let seed=SEED0;seed<SEED0+RUNS;seed++){
  let hit=false;const r=play(seed,{policy:(W,k,prev,rng)=>widePolicy(W,rng,prev,true,hold),onMonth:(before,p,r)=>{if(!hit&&r.W.cash>=0&&!r.W.bankrupt&&Wd.rescueFails(r.W,3))hit=true;}});
  if(r.W.bankrupt&&r.W.t<=12)dead++;if(hit)stuck++;
 }
 info.push(`F7参考（人数${hold}か月保持）：倒産${pct(dead,RUNS)}%・詰み${pct(stuck,RUNS)}%`);
}

// ---------- 4. 値段：最も良い手が状態で割れるか（X4・k.5） ----------
// (a) 支配的な手：無作為の周の1年目6月と3年目6月の状態で、いまの値段からの手（下げる・据え置く・上げる・上限まで下げる・1,000円越え）を3か月の試算で比べる
// (b) 上手な手の年別価格を36か月の累計営業利益で比較する。立地×方針の9通りを巡回。
{
  const OPTS = [['floor', null], ['down100', -100], ['down50', -50], ['keep', 0], ['up50', 50], ['up100', 100], ['over1000', null]];
  const cat = (id) => (/down|floor/.test(id) ? 'down' : id === 'keep' ? 'keep' : 'up');
  const cnt = { down: 0, keep: 0, up: 0 };
  let floorBest = 0, n = 0;
  const N = Math.min(RUNS, 150);
  for (let s = 0; s < N; s++) {
    const { hist } = play(SEED0 + s, { months: 27 });
    for (const h of [hist[2], hist[26]]) {
      if (!h) continue;
      const cur = h.pol.price;
      let b = null;
      for (const [id, d] of OPTS) {
        const p = id === 'floor' ? Wd.PRICE_MIN : id === 'over1000' ? Math.max(1050, cur + 150) : cur + d;
        if (p < Wd.PRICE_MIN || p > Wd.PRICE_MAX) continue;
        const v = Wd.evalPolicy(h.W, { ...h.pol, price: p }, 3);
        if (!b || v > b.v) b = { id, v, p };
      }
      n++; cnt[cat(b.id)]++; if (b.id === 'floor') floorBest++;
    }
  }
  for (const k of ['down', 'keep', 'up']) if (pct(cnt[k], n) >= 70) err(`値段：「${k}」が最適な状態が ${pct(cnt[k], n)}%（70% 未満）`);
  if (pct(floorBest, n) >= 40) err(`値段：上限まで下げる（${Wd.PRICE_MIN}円）が最適な状態が ${pct(floorBest, n)}%（40% 未満）`);
  info.push(`値段の手（${n} 状態）：最適が 下げる ${pct(cnt.down, n)}%・据え置く ${pct(cnt.keep, n)}%・上げる ${pct(cnt.up, n)}%、上限まで下げる ${pct(floorBest, n)}%`);
  // (b) 3年の累計で選んだ年別価格。利益の物差しは res.op（営業利益）。
  let swap = 0, signSwap = 0, runs = 0, firstFloor = 0, fixedSwap = 0, fixedFloor = 0;
  const bestP = [], changes = [], fineP = []; let fineSwap = 0, corner = 0;
  for (let s = 0; s < N; s++) {
    const seed = SEED0 + s, strategy = Math.floor(seed / 3) % 3;
    const W = Wd.create({ seed, area: AREAS[seed % 3], form: 'part1', tier: 0, bowl: BW.presets[seed % 3].spec });
    const fixedPrices=Object.fromEntries(W.rivals.map(r=>[r.id,r.price]));
    const fine = pricePlan(W,strategy,0,null,Array.from({length:41},(_,i)=>600+10*i));
    if(fine){fineP.push(fine.prices[0]);if(fine.prices[0]<850&&fine.prices[2]>850)fineSwap++;if(Math.abs(fine.prices[0]-765)<=10)corner++;}
    const fixed = pricePlan(W,strategy,0,fixedPrices);
    if(fixed && fixed.prices[0]<850 && fixed.prices[2]>850) fixedSwap++;
    if(fixed && fixed.prices[0]===YEAR_PRICES[0]) fixedFloor++;
    const best = pricePlan(W, strategy);
    runs++; // 全候補が倒産したseedも母数に残す
    if (!best) continue;
    if (best.prices[0]===YEAR_PRICES[0]) firstFloor++;
    if (best.prices[0] < 850 && best.prices[2] > 850) swap++;
    const hist = pricePath(W, strategy, best.prices);
    const at = [hist[2], hist[26]];
    const deltas = at.map((h) => {
      // 共通の850円を基準に±50円を比較。価格以外の手はその店の方針。
      const base = Wd.month(h.W, { ...h.pol, price: 850 }, { noise: false, noCards: true, noFactors: true, rng: D.rng(90001+h.W.t+7777*h.W.seed) }).res.op;
      return [-50, 50].map((d) => Wd.month(h.W, { ...h.pol, price: 850 + d }, { noise: false, noCards: true, noFactors: true, rng: D.rng(90001+h.W.t+7777*h.W.seed) }).res.op - base);
    });
    if (deltas[0][0] > 0 && deltas[0][1] < 0 && deltas[1][0] < 0 && deltas[1][1] > 0) signSwap++;
    bestP.push(best.prices); changes.push(deltas);
  }
  if (pct(swap, runs) <= 50) err(`値段：36か月累計の最適が1年目<850・3年目>850 ${pct(swap, runs)}%（50%超）`);
  // 版1.2 (s.3)#5：符号逆転は参考。合否は長期・下端・最頻値。
  if (pct(firstFloor,runs)>=40) err('値段：1年目700円が40%以上');
  const freq={};for(const ps of bestP)freq[ps[0]]=(freq[ps[0]]||0)+1;
  const mode=Object.entries(freq).sort((a,b)=>b[1]-a[1])[0];
  if(mode&&pct(mode[1],runs)>=70)err('値段：1年目最頻値が70%以上');
  info.push(`値段：長期逆転Wilson95% ${wilson(swap,runs)}、1年目最頻値${mode?.[0]}円 ${pct(mode?.[1]||0,runs)}%、下端${pct(firstFloor,runs)}%`);
  info.push(`値段（上手な3方針・${runs}周）：36か月累計の入れ替わり ${pct(swap, runs)}%、±50円の符号逆転 ${pct(signSwap, runs)}%、最適の中央値 ${median(bestP.map(x=>x[0]))}→${median(bestP.map(x=>x[1]))}→${median(bestP.map(x=>x[2]))}円。年別700〜1,000円・50円刻みの343経路を全探索（札なし・週の揺れなし）。毎月自由に変える大域最適ではない`);
  info.push(`診断（合否なし・${runs}周）：ライバル反応ありの長期逆転${pct(swap,runs)}%／他店価格固定${pct(fixedSwap,runs)}%、1年目最適が下端700円${pct(firstFloor,runs)}%／固定${pct(fixedFloor,runs)}%`);
  const ff={};fineP.forEach(p=>ff[p]=(ff[p]||0)+1);const fm=Object.entries(ff).sort((a,b)=>b[1]-a[1])[0];
  info.push(`1年目10円刻み（参考・${runs}周）：長期逆転${pct(fineSwap,runs)}%、最頻値${fm?.[0]}円 ${pct(fm?.[1]||0,runs)}%、角765±10円 ${pct(corner,runs)}%`);
  info.push(`±50円の今月の営業利益差の中央値：1年目 ${[0,1].map(i=>Math.round(median(changes.map(x=>x[0][i])))).join('/')}円、3年目 ${[0,1].map(i=>Math.round(median(changes.map(x=>x[1][i])))).join('/')}円（値下げ/値上げ）`);
}

// ---------- 5. 時間の予算：「全部やる」（足りない分は人を雇って買う）が最適な状態 <70%（X27・c.9） ----------
{
  let allBest = 0, n = 0;
  const KEYS = ['forecast', 'map', 'sns', 'haccp', 'inspect', 'tweak'];
  for (let s = 0; s < Math.min(RUNS, 120); s++) {
    const { hist } = play(SEED0 + s, { months: 9 });
    for (const h of [hist[1], hist[5], hist[8]].filter(Boolean)) {
      const base = { ...h.pol };
      const all = { ...base }; KEYS.forEach((k) => { all[k] = true; });
      const need = Wd.timeUsed(h.W, all) - Wd.timeBudget(h.W, all);
      if (need > 0) all.parts = base.parts + Math.min(C('timeHireMax'), need);
      if (Wd.timeUsed(h.W, all) > Wd.timeBudget(h.W, all)) continue; // 雇っても足りない状態は比べない
      const vAll = Wd.evalPolicy(h.W, all, 3, { mc: 6 });
      let bestSub = -Infinity;
      for (let mask = 0; mask < 1 << KEYS.length; mask++) {
        const q = { ...base }; KEYS.forEach((k, i) => { q[k] = !!(mask & (1 << i)); });
        if (Wd.timeUsed(h.W, q) > Wd.timeBudget(h.W, q)) continue;
        bestSub = Math.max(bestSub, Wd.evalPolicy(h.W, q, 3, { mc: 6 }));
      }
      n++; if (vAll >= bestSub) allBest++;
    }
  }
  if (!n) err('時間の予算：比べられる状態が0');
  else if (pct(allBest, n) >= 70) err(`時間の予算：「全部やる」が最適な状態が ${pct(allBest, n)}%（70% 未満）`);
  info.push(`時間の予算（${n} 状態）：全部やる（人を雇って時間を買う）が最適 ${pct(allBest, n)}%`);
}

// 版1.2 (s.3)#6：旧randPolicyの合否を、放置どうし/上手どうしに置き換える。
for(const mode of ['放置どうし','上手どうし']) {
  const wins=[0,0],ties=[0,0];
  for(let seed=SEED0;seed<SEED0+RUNS;seed++) {
    const cash={};
    for(const form of ['family','part1']) {
      const r=play(seed,{form,months:60,policy:W=>{
        const p=mode==='放置どうし'?idlePolicy(W):smartPolicy(W,Math.floor(seed/3)%3);
        p.parts=form==='family'?0:p.parts; p.family=form==='family'?1:0;
        return Wd.fitTime(W,p,D.rng(seed*37+W.t));
      }});
      cash[form]=[36,60].map(t=>Wd.netCash((r.hist[t-1]||r.hist[r.hist.length-1]).after));
    }
    for(let i=0;i<2;i++){if(cash.family[i]>cash.part1[i])wins[i]++;else if(cash.family[i]===cash.part1[i])ties[i]++;}
  }
  const rate=pct(wins[0],RUNS-ties[0]);
  if(mode==='放置どうし'&&(rate<60||rate>80))err(`店の形：放置3年末${rate}%（60〜80%）`);
  if(mode==='上手どうし'&&rate>40)err(`店の形：上手3年末${rate}%（40%以下）`);
  info.push(`店の形（${mode}・${RUNS}周）：家族の3年末${pct(wins[0],RUNS-ties[0])}%／5年末${pct(wins[1],RUNS-ties[1])}%、引き分け${ties.join('/')}周`);
}

// ---------- 7. 雇いすぎで倒産しうる（n.17）：手を打たない店で人だけ多く雇う ----------
{
  const rate = {};
  for (const parts of [1, 2, 3, 4, 5, 6]) {
    let dry = 0, dead = 0;
    for (let s = 0; s < 100; s++) {
      const { W, hist } = play(SEED0 + s, { months: 13, area: 'shotengai', policy: (W, k, prev) => { const q = Wd.policy0(W, prev, { neutral: true }); q.parts = parts; return q; } });
      if (hist.some((h) => h.res.cash < 0)) dry++;
      if (W.bankrupt) dead++;
    }
    rate[parts] = { dry, dead };
  }
  if (rate[1].dry > 5) err(`雇いすぎ：パート1人でも ${rate[1].dry}% の周で口座が尽きる（5% 以下）`);
  if (rate[4].dry < 50) err(`雇いすぎ：パート4人で口座が尽きる周が ${rate[4].dry}%（50% 以上：設計の試算は10か月で尽きる）`);
  if (!Object.values(rate).some((r) => r.dead >= 50)) err('雇いすぎ：0〜6人のどの人数でも、13か月で倒産する周が半分に届かない（雇いすぎて倒産しうる、にならない）');
  info.push(`雇いすぎ（手を打たない・商店街・13か月）：${Object.entries(rate).map(([k, r]) => `${k}人 口座が尽きる ${r.dry}%・倒産 ${r.dead}%`).join('／')}`);
}

// ---------- 8. 一杯の魅力 F（d.8）：1年目は落ちない・3年放ると F 0.7 前後で客数 −10% 前後・山の月は一杯が最大の要因 ----------
{
  const W0 = Wd.create({ seed: 1, area: 'shotengai', form: 'part1', tier: 1 });
  let b = W0.stores[0].bowl;
  for (let t = 0; t < 12; t++) b = BW.step(b, { tier: 1, regShare: 0 });
  if (Math.abs(b.Fbase - 1) > 1e-9) err(`一杯：1年目に基準の魅力が落ちた（${b.Fbase}）`);
  for (let t = 12; t < 36; t++) b = BW.step(b, { tier: 1, regShare: 0 });
  const drop = Math.exp(C('bF') * Math.log(b.Fbase)) - 1;
  if (Math.abs(b.Fbase-Math.max(C('decayFloor'),Math.pow(1-C('decay'),24)))>1e-9) err('一杯：版1.2の24か月減衰と不一致');
  // 古び−2%への変更（s.1）に伴い、旧−1.5%由来の客数帯は参考にする。
  let b0 = W0.stores[0].bowl; for (let t = 0; t < 36; t++) b0 = BW.step(b0, { tier: 0, regShare: 0 });
  // 山：限定を出した月に、要因の分解で「一杯」が最大の要因になる周がある
  let peakTop = 0, peakEff = [];
  for (let s = 0; s < 40; s++) {
    play(SEED0 + s, { months: 10, factors: true, policy: (W, k, prev) => { const q = Wd.policy0(W, prev, { neutral: true }); if (k === 7) q.limited = true; return q; }, onMonth: (bf, pol, r, k) => { if (k === 7) { const f = r.res.factors; const top = Object.entries(f).filter(([key]) => key !== 'total').sort((a, c) => Math.abs(c[1]) - Math.abs(a[1]))[0]; if (top && top[0] === 'bowl') peakTop++; peakEff.push(r.res.peakEffect); } } });
  }
  if (!peakTop) err('一杯：限定を出した月に、一杯が最大の要因になる周が1つもない（山が見えない）');
  peakEff.sort((a, c) => a - c);
  info.push(`一杯：1年目は基準の魅力 1.000 のまま。3年放る（基準 −2%/月）と ${b.Fbase.toFixed(3)}・客数 ${(100 * drop).toFixed(1)}%、段0（半分）なら ${b0.Fbase.toFixed(3)}。限定の山の月に一杯が最大の要因 ${peakTop}/40周、山の客数への効き 中央値 ${(100 * peakEff[Math.floor(peakEff.length / 2)]).toFixed(1)}%`);
}

// ---------- 9. ライバル：数と型は seed、前の周の自分（W.flags.ghost）、手の内（W.flags.rivalInfo の4候補） ----------
{
  const sets = new Set();
  for (let s = 0; s < 30; s++) { const W = Wd.create({ seed: s, area: 'shotengai' }); const types = W.rivals.map((r) => r.type); sets.add(types.slice().sort().join('+')); const cnt = {}; types.forEach((t) => { cnt[t] = (cnt[t] || 0) + 1; }); if (Object.values(cnt).some((v) => v > 2)) err(`ライバル：seed ${s} で同じ型が3軒以上`); if (s === 0 && types.join('+') !== 'cheap+kodawari+shinise') err(`ライバル：切り身の seed 0 は安売り・こだわり・老舗（いま ${types.join('+')}）`); }
  if (sets.size < 3) err(`ライバル：型の組が seed で変わらない（${sets.size} 通り）`);
  const nums = new Set(); for (let s = 0; s < 30; s++) nums.add(Wd.create({ seed: s, area: 'ekimae', run: 2 }).rivals.length);
  if (![...nums].every((n) => n >= 2 && n <= 5) || nums.size < 2) err(`ライバル：2周目以降の数が 2〜5軒の seed にならない（${[...nums].join(',')}）`);
  const vis = ['A', 'B', 'C', 'D'].map((f) => JSON.stringify(RV.visible(Wd.create({ seed: 0, area: 'shotengai', rivalInfo: f }), 0)));
  if (new Set(vis).size !== 4) err('ライバル：手の内の4候補で見えるものが4通りにならない');
  // 前の周の自分：前の周の値段の手をそのまま打つ
  const prev = play(SEED0 + 3, { months: 13 });
  const choices = prev.hist.map((h) => ({ t: h.k, price: h.pol.price }));
  const g = play(SEED0 + 3, { months: 13, policy: (W, k, pv) => Wd.policy0(W, pv, { neutral: true }) });
  const Wg = Wd.create({ seed: SEED0 + 3, area: AREAS[(SEED0 + 3) % 3], ghost: true, ghostChoices: choices });
  const gh = Wg.rivals.find((r) => r.type === 'ghost');
  if (!gh) err('ライバル：ghost を on にしても前の周の自分が町にいない');
  else { let W = Wg; const seen = []; for (let k = 0; k < 13; k++) { W = Wd.month(W, Wd.policy0(W, null, { neutral: true }), { rng: D.rng(k) }).W; seen.push(W.rivals.find((r) => r.type === 'ghost').price); } if (seen.some((p, k) => p !== choices[k].price)) err('ライバル：前の周の自分が、前の周と同じ月に同じ値段を打っていない'); }
  if (Wd.create({ seed: 0, area: 'shotengai' }).rivals.some((r) => r.type === 'ghost')) err('ライバル：ghost を off にしても前の周の自分がいる');
  void g;
  info.push(`ライバル：型の組 ${sets.size} 通り（30 seed）、2周目以降の数 ${[...nums].sort().join('・')} 軒、手の内の4候補で見えるもの4通り、前の周の自分は同じ月に同じ値段`);
}

// ---------- 10. 再現：同じ seed と同じ手で同じ結果 ----------
{
  const a = play(SEED0 + 5, { months: 13 }), b = play(SEED0 + 5, { months: 13 });
  if (JSON.stringify(a.hist.map((h) => h.res)) !== JSON.stringify(b.hist.map((h) => h.res))) err('再現：同じ seed と手で結果が違う');
}

// ---------- 11. 保存 v4（段2）：v3 から読める・往復で同じ・スロット3つ ----------
{
  const V4 = B.store.v4;
  const v3 = { v: 3, mi: 5, ei: 2, L: [{ id: 'a' }], examLog: [{ key: 'auto:buy_credit', ok: true, t: 1, from: 'recall' }], growth: [{ t: 1 }], plan: { buy_credit: { n: 1 } }, mode: '2026', modeOk: true };
  const d = V4.fromV3(v3);
  if (!V4.isV4(d) || d.slots.length < 3) err('保存 v4：スロットが3つ以上の v4 にならない');
  if (d.meta.examLog.length !== 1 || !d.meta.examLog[0].ok || d.meta.plan.buy_credit.n !== 1) err('保存 v4：v3 の学びの記録（examLog・予定表）が meta に入らない');
  if (d.slots.some((x) => x.run)) err('保存 v4：v3 のレモネードの会社がスロットに入った（n.9：開く入口は作らない）');
  const S1 = Object.assign(V4.compose(d, 's2'), { mi: 3, L: [{ id: 'x' }], choices: [{ y: 1, m: 4, card: 'price', option: 'keep' }], seed: 7, W: { t: 3 } });
  const d2 = V4.split(d, S1, '麺や ピヨ・7月');
  const back = V4.compose(d2, 's2');
  if (back.mi !== 3 || back.seed !== 7 || back.choices.length !== 1 || back.W.t !== 3 || back.examLog.length !== 1) err('保存 v4：run（choices・seed・W）と meta の往復で値が変わる');
  if (V4.compose(d2, 's1').mi !== undefined) err('保存 v4：別のスロットの run が混ざる');
  const S2 = Object.assign(V4.compose(d2, 's1'), { examLog: [...back.examLog, { key: 'auto:x', ok: true, t: 2, from: 'recall' }] });
  if (V4.compose(V4.split(d2, S2), 's2').examLog.length !== 2) err('保存 v4：meta（examLog）がスロットで共有されない');
}

if (errors.length) { console.error(errors.join('\n')); console.error(`\n${errors.length} 件（${((Date.now() - t0) / 1000).toFixed(1)}秒）`); if (process.argv.includes('--info')) console.log(info.join('\n')); process.exit(1); }
console.log(info.join('\n'));
console.log(`OK：ラーメン版の無作為の通し試験（1・3・5年版）${RUNS}周（${((Date.now() - t0) / 1000).toFixed(1)}秒）`);

