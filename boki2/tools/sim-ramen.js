#!/usr/bin/env node
// ラーメン版の無作為の通し試験（1・3・5年版）。DESIGN-RAMEN 版0.5 l.2 段3・k.5・l.5 F7。式（world.js など）より先に書いた検査。
// 使い方：node boki2/tools/sim-check.js --ramen [--runs 300] [--seed0 0]（このファイルを直接 node で動かしてもよい）
// 世界・需要・一杯・ライバル・札は純粋関数（DOM なし）。検査はそれを数百〜数千周まわして、
//  ①式の端（値段で客が単調に減る・係数の範囲・平均の店の客数）
//  ②支配的な手がないか（値段：値下げ・据え置き・値上げのどれも最適 <70%、上限まで下げる <40%、1年目と3年目で最適が入れ替わる周 >50%。時間の予算：全部やる <70%。店の形：家族の勝率は1年目≤90%・3年末30〜60%・5年末≤40%）
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
  if (!up.discountRebound || Math.abs(up.regularLost - 2*plain.regularLost) > 1e-9) err('常連：値下げの持ち越し後の値上げで離れが2倍でない');
  const tr = Wd.trial(cut, pol);
  if (Math.abs(tr.res.L-cut.stores[0].L-tr.res.regularDelta)>1e-9 || !Number.isFinite(tr.regularPeople) || ![0,6,20,26].includes(tr.res.fullDays)) err('試算：常連増減または満席日数の単位が不正');
  info.push('回帰：家族0/1/2人の固定月給・損益と口座・入力不変・保存後の値上げの離れ×2・常連と満席の試算を検査');
}

// ---------- 無作為の手（いつでも手：値段・仕込み・集客・人・一杯） ----------
const AREAS = ['shotengai', 'ekimae', 'jutaku'];
function widePolicy(W, rng, prev, fit = true) {
  const p = Wd.policy0(W, prev);
  if (W.t % 12 === 0) p.price = 700 + 50 * Math.floor(rng() * 7);
  p.prep = ['low', 'mid', 'high'][Math.floor(rng() * 3)];
  p.flyer = 10000 * Math.floor(rng() * 11);
  p.coupon = rng() < 0.1;
  p.line = rng() < 0.4;
  for (const k of ['forecast', 'map', 'sns', 'haccp', 'inspect']) p[k] = rng() < 0.6;
  p.tweak = rng() < 0.15;
  // 人数は年初に0〜4人を一様に引いて1年保持（毎月雇い直す分布と区別）。
  if (W.t % 12 === 0) p.parts = Math.floor(rng() * 5);
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
function smartPolicy(W, strategy, price) {
  const p = Wd.policy0(W, null, { neutral: true });
  p.price = price != null ? price : W.t < 12 ? 800 : W.t < 24 ? 850 : 900;
  // 週末だけ70人を超える段階で20万円を増やすと、育てる手を過剰雇用で罰してしまう。
  // 価格候補ごとの見込客数・原価から、追加の粗利が給料を上回る時に増員する。
  const nd = Wd.expectN(W, p.price), mix = W.town.areas[W.area].mix.family;
  const weekend = mix*C('weekendFamily')+(1-mix)*C('weekendSingle');
  const weekday = nd*C('days')/(20+6*weekend);
  const sold = cap => 20*Math.min(weekday,cap)+6*Math.min(weekday*weekend,cap);
  const cost = BW.cost(W.stores[0].bowl)+(C('items')-1)*C('price0')*C('cogs');
  const margin = p.price*C('items')*(1-C('utilVar'))-cost;
  p.parts = (sold(C('capBy')[2])-sold(C('capBy')[1]))*margin > C('wagePart') ? 2 : 1;
  p.family = 0; p.line = true; p.prep = 'mid';
  p.flyer = [30000, 0, 100000][strategy];
  const order = strategy === 0 ? ['map', 'haccp', 'forecast', 'tweak', 'sns'] : strategy === 1 ? ['haccp', 'tweak', 'map', 'forecast', 'inspect'] : ['map', 'sns', 'haccp', 'forecast', 'tweak'];
  for (const k of Wd.TIME_KEYS) p[k] = false;
  for (const k of order) { p[k] = k !== 'tweak' || Wd.canTweak(W); if (Wd.timeUsed(W,p) > Wd.timeBudget(W,p)) p[k] = false; }
  p.borrow = W.cash < 300000;
  return p;
}
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
  info.push(`町seed：潜在客±${100*C('townPotentialSpread')}%・家賃±${100*C('townRentSpread')}%・その他固定費15/20万。F7の人数/価格は年初固定、借入は薄い月に半々、枠200万1回`);
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
    if(prev&&(p.price!==prev.price||p.parts!==prev.parts))err('F7：年内に価格または人数を再抽選');
    prev=p;
  }
  info.push('d.9回帰：LINE/評判の離れ・他店0軒の850円・他店価格固定・町seedの保存・F7年内固定');
}
// 年ごとの価格7候補を全探索（7³=343経路）。共通の年の接頭部分は1回だけ計算。
// 36か月の同じ営業利益を比較し、1年目と3年目の別々の36か月を比べない。
const YEAR_PRICES = [700, 750, 800, 850, 900, 950, 1000];
function pricePlan(W, strategy, year = 0, fixedRivalPrices = null) {
  if (year === 3) return { value: 0, prices: [] };
  let best = null;
  for (const price of YEAR_PRICES) {
    let x = W, sum = 0;
    for (let k = 0; k < 12; k++) {
      const p = smartPolicy(x, strategy, price);
      const r = Wd.month(x, p, { noise: false, noCards: true, noFactors: true, rng: D.rng(90001 + x.t), fixedRivalPrices });
      x = r.W; sum += r.res.op;
      if (x.bankrupt) break;
    }
    if (x.bankrupt) continue;
    const tail = pricePlan(x, strategy, year + 1, fixedRivalPrices);
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
    const r = Wd.month(x, p, { noise: false, noCards: true, noFactors: true, rng: D.rng(90001 + x.t), fixedRivalPrices });
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
  info.push(`参考：1号店3方針の3年目上位25% ${q3.toFixed(1)}人/日。100±15の合否は事業拡張3方針が未実装のため保留（Claude設計回答：PR #1、2026-10-23）。`);
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
        for (const o of c.options) { cardsChecked++; const ws = DC.weights(c, o.id, before); const sum = ws.reduce((a, x) => a + x.w, 0); if (Math.abs(sum - 100) > 1e-6 || ws.length < 2 || ws.some((x) => !(x.w >= 0))) { weightBad++; if (weightBad < 5) err(`札 ${c.id}・${o.id}：重みの合計 ${sum}・結果 ${ws.length}（合計100・2つ以上）`); } }
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

// ---------- 4. 値段：最も良い手が状態で割れるか（X4・k.5） ----------
// (a) 支配的な手：無作為の周の1年目6月と3年目6月の状態で、いまの値段からの手（下げる・据え置く・上げる・上限まで下げる・1,000円越え）を3か月の試算で比べる
// (b) 上手な手の年別価格を36か月の累計営業利益で比較する。立地×方針の9通りを巡回。
{
  const OPTS = [['floor', null], ['down100', -100], ['down50', -50], ['keep', 0], ['up50', 50], ['up100', 100], ['over1000', null]];
  const cat = (id) => (/down|floor/.test(id) ? 'down' : id === 'keep' ? 'keep' : 'up');
  const cnt = { down: 0, keep: 0, up: 0 };
  let floorBest = 0, n = 0;
  const N = Math.min(RUNS, 200);
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
  const bestP = [], changes = [];
  for (let s = 0; s < N; s++) {
    const seed = SEED0 + s, strategy = Math.floor(seed / 3) % 3;
    const W = Wd.create({ seed, area: AREAS[seed % 3], form: 'part1', tier: 0, bowl: BW.presets[seed % 3].spec });
    const fixedPrices=Object.fromEntries(W.rivals.map(r=>[r.id,r.price]));
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
      const base = Wd.month(h.W, { ...h.pol, price: 850 }, { noise: false, noCards: true, noFactors: true, rng: D.rng(90001+h.W.t) }).res.op;
      return [-50, 50].map((d) => Wd.month(h.W, { ...h.pol, price: 850 + d }, { noise: false, noCards: true, noFactors: true, rng: D.rng(90001+h.W.t) }).res.op - base);
    });
    if (deltas[0][0] > 0 && deltas[0][1] < 0 && deltas[1][0] < 0 && deltas[1][1] > 0) signSwap++;
    bestP.push(best.prices); changes.push(deltas);
  }
  if (pct(swap, runs) <= 50) err(`値段：36か月累計の最適が1年目<850・3年目>850 ${pct(swap, runs)}%（50%超）`);
  if (pct(signSwap, runs) <= 50) err(`値段：±50円の今月の損得が両側とも年で逆転 ${pct(signSwap, runs)}%（50%超）`);
  info.push(`値段（上手な3方針・${runs}周）：36か月累計の入れ替わり ${pct(swap, runs)}%、±50円の符号逆転 ${pct(signSwap, runs)}%、最適の中央値 ${median(bestP.map(x=>x[0]))}→${median(bestP.map(x=>x[1]))}→${median(bestP.map(x=>x[2]))}円。年別700〜1,000円・50円刻みの343経路を全探索（札なし・週の揺れなし）。毎月自由に変える大域最適ではない`);
  info.push(`診断（合否なし・${runs}周）：ライバル反応ありの長期逆転${pct(swap,runs)}%／他店価格固定${pct(fixedSwap,runs)}%、1年目最適が下端700円${pct(firstFloor,runs)}%／固定${pct(fixedFloor,runs)}%`);
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

// ---------- 6. 店の形：同じseed・同じ手の60か月を実際に回す（k.5 版0.5） ----------
{
  const wins = [0, 0, 0], ties = [0, 0, 0], count = Math.min(RUNS, 300);
  for (let s = 0; s < count; s++) {
    const out = {};
    for (const form of ['family', 'part1']) {
      const rng = D.rng((SEED0 + s) * 31 + 7);
      let prev = null;
      const r = play(SEED0 + s, { form, months: 60, policy: (W) => {
        // 手を引く乱数と時間に収める乱数を分け、形による時間差で翌月の抽選をずらさない。
        const q = randPolicy(W, rng, prev, false); q.parts = Wd.FORMS[form].parts; q.family = Wd.FORMS[form].family;
        prev = q; return Wd.fitTime(W, q, D.rng((SEED0 + s) * 37 + W.t));
      } });
      // 倒産後は営業を続けず、最終状態を保持。両方倒産でも比較から外さない。
      const at = (t) => (r.hist[t - 1] || r.hist[r.hist.length - 1]).after;
      out[form] = [r.hist.slice(0, 12).filter(h => h.res.op > 0).length, Wd.netCash(at(36)), Wd.netCash(at(60))];
    }
    for (let i = 0; i < 3; i++) { if (out.family[i] > out.part1[i]) wins[i]++; else if (out.family[i] === out.part1[i]) ties[i]++; }
  }
  // 旧検査と同じく引き分けを除いた勝率。引き分け数・全周の勝率も出す。
  const rates = wins.map((w,i) => pct(w, count - ties[i]));
  if (rates[0] > 90) err(`店の形：1年目の黒字の月で家族 ${rates[0]}%（90%以下）`);
  if (rates[1] < 30 || rates[1] > 60) err(`店の形：3年目末ネットキャッシュで家族 ${rates[1]}%（30〜60%）`);
  if (rates[2] > 40) err(`店の形：5年目末ネットキャッシュで家族 ${rates[2]}%（40%以下）`);
  info.push(`店の形（${count}周・60か月）：家族の勝率 1年目黒字月 ${rates[0]}%、3年末 ${rates[1]}%、5年末 ${rates[2]}%。引き分け ${ties.join('/')}周、全周に対する勝ち ${wins.map(w=>pct(w,count)).join('/')}%`);
}

// d.9の新しい家族の分け方は参考のみ。従来の無作為比較の合否を置き換えない。
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
  info.push(`参考（合否なし・${mode}・${RUNS}周）：家族の3年末${pct(wins[0],RUNS-ties[0])}%／5年末${pct(wins[1],RUNS-ties[1])}%、引き分け${ties.join('/')}周`);
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
  if (b.Fbase < 0.65 || b.Fbase > 0.75) err(`一杯：3年放った魅力 ${b.Fbase.toFixed(3)}（0.7 前後：d.8）`);
  if (drop < -0.13 || drop > -0.08) err(`一杯：3年放った客数の差 ${(100 * drop).toFixed(1)}%（−10% 前後：d.8）`);
  let b0 = W0.stores[0].bowl; for (let t = 0; t < 36; t++) b0 = BW.step(b0, { tier: 0, regShare: 0 });
  // 山：限定を出した月に、要因の分解で「一杯」が最大の要因になる周がある
  let peakTop = 0, peakEff = [];
  for (let s = 0; s < 40; s++) {
    play(SEED0 + s, { months: 10, factors: true, policy: (W, k, prev) => { const q = Wd.policy0(W, prev, { neutral: true }); if (k === 7) q.limited = true; return q; }, onMonth: (bf, pol, r, k) => { if (k === 7) { const f = r.res.factors; const top = Object.entries(f).filter(([key]) => key !== 'total').sort((a, c) => Math.abs(c[1]) - Math.abs(a[1]))[0]; if (top && top[0] === 'bowl') peakTop++; peakEff.push(r.res.peakEffect); } } });
  }
  if (!peakTop) err('一杯：限定を出した月に、一杯が最大の要因になる周が1つもない（山が見えない）');
  peakEff.sort((a, c) => a - c);
  info.push(`一杯：1年目は基準の魅力 1.000 のまま。3年放る（基準 −1.5%/月）と ${b.Fbase.toFixed(3)}・客数 ${(100 * drop).toFixed(1)}%、段0（半分）なら ${b0.Fbase.toFixed(3)}。限定の山の月に一杯が最大の要因 ${peakTop}/40周、山の客数への効き 中央値 ${(100 * peakEff[Math.floor(peakEff.length / 2)]).toFixed(1)}%`);
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

