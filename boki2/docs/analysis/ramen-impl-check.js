#!/usr/bin/env node
// 実装の sim（Codex のブランチ codex/ramen-balance-v05 の boki2/js/sim/*）で較正と4判断の検査をする道具（版0.9）。
// 模型 (10)（ramen-slice-numbers.js）ではなく、実装の式を直接まわす。実装の tools/sim-ramen.js と同じ seed・同じ手で動かし、
// 差（札・週の揺れ・週末の山・人数の上限・ライバルの追随…）を1つずつ切り替えて、どの数がどれで動くかを測る。
// 使い方：node boki2/docs/analysis/ramen-impl-check.js --root <Codex ブランチの boki2 のパス> --exp base|causes|flip|follow|f7|v08|ceiling [--runs 300] [--seeds 60]
// 0.8 の置き値（看板・仕入先・歯止め・古び −2%・常連3割の半分を外す）は、実装の world.js/bowl.js/rivals.js に global.__X の差し込みを足した
// 作業ツリー（試すだけ。push しない）で動く。差し込みが無い素の実装では __X は無視され、素の数になる。
global.window = global;
const path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const root = path.resolve(arg('--root', path.join(__dirname, '..', '..')));
const STORY = require(path.join(root, 'tools', 'ramen-files.js')).story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA, Wd = D.world, BW = D.bowl, RV = D.rivals, C = D.coef;
const RUNS = Number(arg('--runs', 300)), SEEDS = Number(arg('--seeds', 60)), EXP = arg('--exp', 'base');
const AREAS = ['shotengai', 'ekimae', 'jutaku'];
const median = (xs) => { const a = xs.slice().sort((a, b) => a - b); return a.length ? a[Math.floor(a.length / 2)] : NaN; };
const q = (xs, p) => { const a = xs.slice().sort((a, b) => a - b); return a.length ? a[Math.min(a.length - 1, Math.floor(a.length * p))] : NaN; };
const pct = (a, n) => (n ? Math.round((1000 * a) / n) / 10 : 0);
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '—');
const man = (x) => `${Math.round(x / 10000)}万`;
// 95% の信頼区間（Wilson）
const ci = (k, n) => { if (!n) return '—'; const z = 1.96, p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z / d) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n)); return `${pct(k, n)}%（${Math.round(100 * (c - h))}〜${Math.round(100 * (c + h))}%）`; };
const setX = (x) => { global.__X = x || {}; };
const withX = (x, fn) => { const old = global.__X; setX({ ...(old || {}), ...x }); try { return fn(); } finally { global.__X = old; } };
const withCoef = (kv, fn) => { const old = {}; for (const k of Object.keys(kv)) { old[k] = C.table[k].v; C.table[k].v = kv[k]; } try { return fn(); } finally { for (const k of Object.keys(kv)) C.table[k].v = old[k]; } };
const out = (s) => console.log(s);

// ---------- sim-ramen.js と同じ回し方（seed・乱数の位置を揃える） ----------
function play(seed, o = {}) {
  const rng = D.rng(seed * 7919 + 13);
  let W = Wd.create({ seed, area: o.area || AREAS[seed % 3], form: o.form || 'part1', parts: o.parts, family: o.family, tier: 0, bowl: o.bowl || BW.presets[seed % 3].spec });
  if (o.otherFixed50 && W.otherFixed === C('otherFixed') && seed % 4 === 1) W.otherFixed = 200000; // 20万の店を 25%→50% に増やす実験
  const hist = [];
  let pol = null;
  const months = o.months || 13;
  for (let k = 0; k < months; k++) {
    pol = o.policy ? o.policy(W, k, pol, rng) : null;
    const before = W;
    const r = Wd.month(W, pol, { rng: D.rng(seed * 104729 + k), noFactors: true, noCards: !!o.noCards, noise: o.noNoise ? false : undefined, fixedRivalPrices: o.fixedRivalPrices ? o.fixedRivalPrices(W) : null });
    W = r.W;
    hist.push({ k, W: before, after: W, pol, res: r.res });
    if (o.onMonth) o.onMonth(before, pol, r, k);
    if (W.bankrupt) break;
  }
  return { W, hist };
}
const at = (r, t) => (r.hist[t - 1] || r.hist[r.hist.length - 1]).after;
const yearN = (r, y) => { const h = r.hist.slice(12 * (y - 1), 12 * y); return h.length === 12 ? h.reduce((a, x) => a + x.res.N, 0) / 12 : h.reduce((a, x) => a + x.res.N, 0) / 12; };
// 放置：地図だけ・850円・パート1人（d.9.1 の較正の基準。sim-ramen の idlePolicy と同じ）
function idlePolicy(W) {
  const p = Wd.policy0(W, null, { neutral: true });
  for (const key of Wd.TIME_KEYS) p[key] = false;
  return { ...p, price: 850, parts: 1, family: 0, map: true, line: false, prep: 'mid', flyer: 0, borrow: false };
}
// 上手な3方針（sim-ramen の smartPolicy の写し。price を渡せる）
const SMART = ['常連と地図', '一杯と衛生', '集客と席'];
function smartPolicy(W, strategy, price, o = {}) {
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
  if (o.sign) { p.sign = o.sign === 'cash' ? (W.flags.signPick || (W.flags.signPick = W.cash > 2000000 ? 'large' : W.cash > 1000000 ? 'small' : 'none')) : o.sign; p.signAt = o.signAt != null ? o.signAt : 3; }
  if (o.supplier) p.supplier = typeof o.supplier === 'function' ? o.supplier(W) : o.supplier;
  if (o.limited && W.m === 8) p.limited = true;
  return p;
}
// 版0.8 d.9.3 の上手（状況に応じる）：値段は年で、雇うのは客数が上限の9割を越え口座が150万以上のとき、看板は口座で、仕入先は方針で
const PRICES = [[800, 850, 950, 1000, 1000], [850, 900, 1000, 1000, 1050], [750, 800, 900, 950, 950]];
function smartX(W, strategy, o = {}) {
  const y = Math.min(4, Math.floor(W.t / 12));
  const price = o.prices ? o.prices[Math.min(o.prices.length - 1, y)] : PRICES[strategy][y];
  const p = smartPolicy(W, strategy, price, { maxParts: 1, sign: o.sign || 'cash', supplier: o.supplier || (strategy === 1 ? 'high' : strategy === 0 ? (W.t >= 12 ? 'high' : 'std') : 'std'), limited: true });
  const me = W.stores[0];
  let parts = o.parts != null ? o.parts : me.parts;
  if (o.parts == null && W.t >= 12 && me.Nlast > 0.9 * Wd.capOf(me) && W.cash > 1500000 && parts < (o.maxParts || 3)) parts += 1;
  p.parts = parts;
  if (o.flyer != null) p.flyer = o.flyer;
  return Wd.fitTime(W, p, D.rng(W.seed * 37 + W.t));
}
// 基礎の手だけの店：放置に 小の看板・LINE・高い仕入先（d.9.3）
function basicPolicy(W) { return { ...idlePolicy(W), line: true, sign: 'small', signAt: 3, supplier: 'high' }; }
// F7 の母集団（sim-ramen の widePolicy）。hold：人数を年初に引いて何か月保つか（12＝実装）。notice：赤字が続いたら人を減らす（k か月の遅れ）
function widePolicy(W, rng, prev, o = {}) {
  const p = Wd.policy0(W, prev);
  if (W.t % 12 === 0) p.price = 700 + 50 * Math.floor(rng() * 7);
  p.prep = ['low', 'mid', 'high'][Math.floor(rng() * 3)];
  p.flyer = 10000 * Math.floor(rng() * 11);
  p.coupon = rng() < 0.1;
  p.line = rng() < 0.4;
  for (const k of ['forecast', 'map', 'sns', 'haccp', 'inspect']) p[k] = rng() < 0.6;
  p.tweak = rng() < 0.15;
  const hold = o.hold || 12;
  if (W.t % hold === 0) p.parts = Math.floor(rng() * 5);
  if (o.notice && W.last && W.t >= o.notice) { const red = (W.flags.redRun || 0); if (red >= o.notice && p.parts > 0) p.parts -= 1; }
  p.borrow = rng() < 0.5 && W.cash < 300000;
  return Wd.fitTime(W, p, rng);
}
// 年別の値段の全探索（sim-ramen の pricePlan と同じ：36か月の営業利益の累計。候補は年ごとに渡せる）
function pricePlan(W, polFn, cands, year = 0, fixed = null) {
  if (year === 3) return { value: 0, prices: [] };
  let best = null;
  for (const price of cands[year]) {
    let x = W, sum = 0;
    for (let k = 0; k < 12; k++) {
      const p = polFn(x, price);
      const r = Wd.month(x, p, { noise: false, noCards: true, noFactors: true, rng: D.rng(90001 + x.t), fixedRivalPrices: fixed });
      x = r.W; sum += r.res.op;
      if (x.bankrupt) break;
    }
    if (x.bankrupt) continue;
    const tail = pricePlan(x, polFn, cands, year + 1, fixed);
    if (!tail) continue;
    const value = sum + tail.value;
    if (!best || value > best.value) best = { value, prices: [price, ...tail.prices] };
  }
  return best;
}
const Y50 = [700, 750, 800, 850, 900, 950, 1000];
const Y10 = Array.from({ length: 41 }, (_, i) => 600 + 10 * i);
function flipStat(label, o = {}) {
  const cands = o.cands || [Y50, Y50, Y50];
  let swap = 0, runs = 0, floor = 0, corner = 0; const p1 = [], p3 = [], hist = {};
  for (let s = 0; s < SEEDS; s++) {
    const seed = s, strategy = Math.floor(seed / 3) % 3;
    const W = Wd.create({ seed, area: AREAS[seed % 3], form: 'part1', tier: 0, bowl: BW.presets[seed % 3].spec });
    const fixed = o.fixedRival ? Object.fromEntries(W.rivals.map((r) => [r.id, r.price])) : null;
    const polFn = o.polFn ? (x, price) => o.polFn(x, strategy, price) : (x, price) => smartPolicy(x, strategy, price, o.smartOpts || {});
    const best = pricePlan(W, polFn, cands, 0, fixed);
    runs++;
    if (!best) continue;
    if (best.prices[0] < 850 && best.prices[2] > 850) swap++;
    if (best.prices[0] === cands[0][0]) floor++;
    // 式の角：相場850の0.9倍 765円の ±10円（坂の始まり）に1年目の最適が集まるか
    if (Math.abs(best.prices[0] - 765) <= 10) corner++;
    p1.push(best.prices[0]); p3.push(best.prices[2]); hist[best.prices[0]] = (hist[best.prices[0]] || 0) + 1;
  }
  const mode = Object.entries(hist).sort((a, b) => b[1] - a[1])[0];
  out(`${label}（${runs}周）：入れ替わり ${ci(swap, runs)}、1年目が下端 ${pct(floor, runs)}%、最適の中央値 ${median(p1)}→${median(p3)}円、1年目の最頻値 ${mode ? `${mode[0]}円 ${pct(mode[1], runs)}%` : '—'}、坂の始まり765±10円に集まる周 ${pct(corner, runs)}%`);
  return { swap, runs, p1, p3 };
}
// 較正：放置の3年目中央値を 44 に（実装の --calibrate と同じ：札・揺れあり、倒産後0人）
function idleMedian(n, o = {}) { const xs = []; for (let s = 0; s < n; s++) xs.push(yearN(play(s, { months: 36, policy: idlePolicy, ...o }), 3)); return xs; }
function calibrate(n, o = {}) {
  let lo = 0.2, hi = 1.2;
  for (let i = 0; i < 12; i++) { const mid = (lo + hi) / 2; C.table.potentialScale.v = mid; if (median(idleMedian(n, o)) < C('median')) lo = mid; else hi = mid; }
  C.table.potentialScale.v = Number(((lo + hi) / 2).toFixed(6));
  return C('potentialScale');
}
function smartStats(n, polFn, o = {}) {
  const res = [];
  for (let strategy = 0; strategy < 3; strategy++) {
    const ns = [], dead = [];
    for (let s = 0; s < n; s++) { const r = play(s, { months: o.months || 36, policy: (W) => polFn(W, strategy), ...o }); ns.push(yearN(r, 3)); dead.push(r.W.bankrupt ? 1 : 0); }
    res.push({ med: median(ns), q3: q(ns, 0.75), dead: dead.reduce((a, b) => a + b, 0), ns });
  }
  return res;
}
function familyStats(n, mode, o = {}) {
  const wins = [0, 0], ties = [0, 0];
  for (let seed = 0; seed < n; seed++) {
    const cash = {};
    for (const form of ['family', 'part1']) {
      const r = play(seed, { form, months: 60, ...o, policy: (W) => { const p = mode === 'idle' ? idlePolicy(W) : mode === 'basic' ? basicPolicy(W) : smartX(W, Math.floor(seed / 3) % 3, { parts: form === 'family' ? 0 : undefined }); p.parts = form === 'family' ? 0 : p.parts; p.family = form === 'family' ? 1 : 0; return Wd.fitTime(W, p, D.rng(seed * 37 + W.t)); } });
      cash[form] = [36, 60].map((t) => Wd.netCash(at(r, t)));
    }
    for (let i = 0; i < 2; i++) { if (cash.family[i] > cash.part1[i]) wins[i]++; else if (cash.family[i] === cash.part1[i]) ties[i]++; }
  }
  return `3年末 ${ci(wins[0], n - ties[0])}／5年末 ${ci(wins[1], n - ties[1])}`;
}
function f7Stats(n, o = {}) {
  let dead = 0, stuck = 0; const nc = []; let partsAtDeath = [];
  for (let s = 0; s < n; s++) {
    let stuckHere = false;
    const r = play(s, { months: 13, policy: (W, k, prev, rng) => widePolicy(W, rng, prev, o), onMonth: (before, pol, rr) => { rr.W.flags.redRun = rr.res.op < 0 ? (before.flags.redRun || 0) + 1 : 0; if (!stuckHere && rr.W.cash >= 0 && !rr.W.bankrupt && Wd.rescueFails(rr.W, 3)) stuckHere = true; } });
    if (r.W.bankrupt && r.W.t <= 12) { dead++; partsAtDeath.push(r.W.stores[0].parts); }
    if (stuckHere) stuck++;
    nc.push(Wd.netCash(r.W));
  }
  return `1年目の倒産 ${ci(dead, n)}、詰み ${ci(stuck, n)}、翌4月のネットキャッシュ 中央値 ${man(median(nc))}（下位10% ${man(q(nc, 0.1))}）、倒産した店の人数の中央値 ${partsAtDeath.length ? median(partsAtDeath) : '—'}人`;
}

out(`# 実装の sim で測る（root=${root}、potentialScale=${C('potentialScale')}、runs=${RUNS}、seeds=${SEEDS}、exp=${EXP}）`);
const t0 = Date.now();

if (EXP === 'base') {
  const im = idleMedian(RUNS);
  out(`放置（${RUNS}周・3年目）：中央値 ${f1(median(im))}、上位25% ${f1(q(im, 0.75))}`);
  const ss = smartStats(RUNS, (W, s) => smartPolicy(W, s));
  out(`上手（実装の smartPolicy・${RUNS}周・3年目）：上位25% ${ss.map((x, i) => `${SMART[i]} ${f1(x.q3)}`).join('／')}、中央値 ${ss.map((x) => f1(x.med)).join('／')}、倒産 ${ss.map((x) => x.dead).join('/')}`);
  out(`家族の勝率（放置どうし・${RUNS}周）：${familyStats(RUNS, 'idle')}`);
  out(`家族の勝率（上手どうし・${RUNS}周）：${familyStats(RUNS, 'smart')}`);
  flipStat('値段（実装の smartPolicy・50円刻み・反応あり）');
  flipStat('値段（他店固定）', { fixedRival: true });
  out(`F7（widePolicy・${RUNS}周・13か月）：${f7Stats(RUNS)}`);
}

if (EXP === 'causes') {
  // 上手の上位25%・放置の中央値・家族（放置どうし）の勝率を、差を1つずつ切り替えて測る。較正はそのまま（potentialScale 固定）と再較正の両方
  const N = Math.min(RUNS, 100);
  const row = (label, o = {}, xs = {}, coefs = {}, smartOpts = {}) => withX(xs, () => withCoef(coefs, () => {
    const base = C('potentialScale');
    const one = (tag) => {
      const im = idleMedian(N, o); const ss = smartStats(N, (W, s) => smartPolicy(W, s, null, smartOpts), o);
      const fam = familyStats(N, 'idle', o);
      out(`| ${label} | ${tag} | ${f1(median(im))} | ${ss.map((x) => f1(x.q3)).join('／')}（まとめ ${f1(q(ss.flatMap((x) => x.ns), 0.75))}） | ${fam} |`);
    };
    one('較正そのまま');
    if (o.recal) { calibrate(N, o); one(`再較正 ${C('potentialScale')}`); C.table.potentialScale.v = base; }
  }));
  out(`\n| 違い | 較正 | 放置3年目 中央値 | 上手3年目 上位25%（3方針／まとめ） | 家族（放置どうし）3年末／5年末 |\n|---|---|---|---|---|`);
  row('素の実装', {});
  row('札なし', { noCards: true, recal: true });
  row('週の揺れ・雨なし', { noNoise: true, recal: true });
  row('札も揺れもなし（模型と同じ）', { noCards: true, noNoise: true, recal: true });
  row('週末の山なし（模型は平日と週末を分けない）', { recal: true }, { noWeekend: true });
  row('上手がパート3人まで雇える（上限100）', {}, {}, {}, { maxParts: 3 });
  row('人数の上限 [40,70,100,…]（家族の上限40）', {}, {}, { capBy: [40, 70, 100, 125, 145, 160, 170] });
  row('常連3割以上で古び半分を外す', {}, { noRegHalf: true });
  row('古び −2%/月＋常連3割の半分を外す', {}, { noRegHalf: true }, { decay: 0.02 });
  row('ライバルの追随なし（follow 0）', { fixedRivalPrices: (W) => Object.fromEntries(W.rivals.map((r) => [r.id, r.price])) });
  row('その他固定費20万の店を 25%→50%', { otherFixed50: true });
}

if (EXP === 'flip') {
  flipStat('A 素の実装（50円刻み・反応あり）');
  flipStat('B 他店固定', { fixedRival: true });
  flipStat('C 1年目だけ10円刻み（600〜1000）', { cands: [Y10, Y50, Y50] });
  withCoef({ discountChurn: 1 }, () => flipStat('D 値下げ後の値上げ ×2 なし'));
  flipStat('E 上手がパート3人まで', { smartOpts: { maxParts: 3 } });
  withCoef({ capBy: [35, 70, 100, 125, 145, 160, 170].map((x) => x * 2) }, () => flipStat('F 人数の上限を2倍（席の上限が効かない）'));
  withCoef({ epsCheaperRival: 1.0 }, () => flipStat('G 2割安い同じ型の店 ×1.3 なし'));
  withX({ retainP: 1.0 }, () => flipStat('H 歯止め① retain×(p/p_ref)^1.0'));
  withX({ retainP: 1.0, cheapHit: 0.3 }, () => flipStat('I 歯止め①＋②印象 −0.3×坂'));
  withX({ retainP: 1.0, cheapHit: 0.3, cheapNest: 0.3 }, () => flipStat('J 歯止め①②③（安売りの型 ×0.7）'));
  withX({ retainP: 1.0, cheapHit: 0.3, cheapNest: 0.3 }, () => flipStat('K 歯止め①②③・1年目10円刻み', { cands: [Y10, Y50, Y50] }));
  withX({ retainP: 1.0, cheapHit: 0.3, cheapNest: 0.3 }, () => flipStat('L 歯止め①②③・他店固定', { fixedRival: true }));
}

if (EXP === 'follow') {
  // 追随の確率と幅の上限（決定3）：入れ替わりが残る上限を数で示す
  for (const P of [0.5, 0.25, 0]) for (const cap of [50, 30, 20]) {
    if (P === 0 && cap !== 50) continue;
    const old = RV.TYPES.cheap.follow; RV.TYPES.cheap.follow = P;
    withX({ followCap: cap, retainP: 1.0, cheapHit: 0.3, cheapNest: 0.3 }, () => flipStat(`追随 確率${P}・幅≤${cap}円（歯止め①②③あり）`));
    RV.TYPES.cheap.follow = old;
  }
  for (const P of [0.5, 0.25]) for (const cap of [50, 30]) {
    const old = RV.TYPES.cheap.follow; RV.TYPES.cheap.follow = P;
    withX({ followCap: cap }, () => flipStat(`追随 確率${P}・幅≤${cap}円（歯止めなし）`));
    RV.TYPES.cheap.follow = old;
  }
}

if (EXP === 'causes2') {
  // 上手の「手」の違いだけ（置き値は素の実装のまま）：実装の smartPolicy（パート≤2・値段800/850/900）と d.9.3 の状況に応じる手（年別の値段・パート3人まで）
  const N = Math.min(RUNS, 100);
  const line = (label, polFn, o = {}) => { const ss = smartStats(N, polFn, o); out(`| ${label} | ${ss.map((x) => f1(x.q3)).join('／')}（まとめ ${f1(q(ss.flatMap((x) => x.ns), 0.75))}） | ${ss.map((x) => f1(x.med)).join('／')} | ${ss.map((x) => x.dead).join('/')} |`); };
  out(`\n| 上手の手 | 3年目 上位25%（3方針／まとめ） | 中央値 | 倒産 |\n|---|---|---|---|`);
  line('実装の smartPolicy（パート≤2・800/850/900円）', (W, s) => smartPolicy(W, s));
  line('同・パート3人まで', (W, s) => smartPolicy(W, s, null, { maxParts: 3 }));
  line('d.9.3 の年別の値段（多店舗 800/850/950、品質 850/900/1000、宣伝 750/800/900）・パート≤2', (W, s) => smartPolicy(W, s, PRICES[s][Math.min(4, Math.floor(W.t / 12))]));
  line('d.9.3 の状況に応じる手（smartX：年別の値段・雇うのは上限の9割＋口座150万・8月の限定。看板・仕入先は素の実装にないので無効）', (W, s) => smartX(W, s));
  line('同・札なし・揺れなし（模型と同じ条件。較正はそのまま）', (W, s) => smartX(W, s), { noCards: true, noNoise: true });
  line('同・パート2人まで', (W, s) => smartX(W, s, { maxParts: 2 }));
  line('同・値段を850円に固定', (W, s) => smartX(W, s, { prices: [850, 850, 850, 850, 850] }));
}

if (EXP === 'taste') {
  // 味を変える手（決定2：いつ・何に）。版0.8 の置き値を差し込み、外れの年（山が外れなら F −0.05・その月の離れ +1%）と時間の予算を含めて、5年目末ネットキャッシュで比べる
  const X08 = { sign: true, supplier: true, retainP: 1.0, cheapHit: 0.3, cheapNest: 0.3, noRegHalf: true, shock: true };
  C.table.decay.v = 0.02; C.table.capBy.v = [40, 70, 100, 125, 145, 160, 170];
  const N = Math.min(RUNS, 120);
  setX(X08); out(`較正 potentialScale=${calibrate(N)}`);
  const PLANS = {
    never: (W, p) => { p.tweak = false; p.limited = false; },
    yearly: (W, p) => { p.tweak = W.m === 5 && Wd.canTweak(W); p.limited = W.m === 8; },
    max: (W, p) => { p.tweak = Wd.canTweak(W); p.limited = [5, 8, 11, 2].includes(W.m); },
    thermo: (W, p) => { const F = W.stores[0].bowl.Fbase; p.tweak = F < 0.92 && Wd.canTweak(W); p.limited = F < 0.92 && W.m === 8; },
    thermoAug: (W, p) => { const F = W.stores[0].bowl.Fbase; p.tweak = F < 0.92 && Wd.canTweak(W); p.limited = W.m === 8; },
  };
  const run = (label, xs) => withX(xs, () => {
    const wins = {}, diff = []; let n = 0; const timeDrop = {};
    for (let s = 0; s < N; s++) {
      const st = Math.floor(s / 3) % 3, nc = {};
      for (const [k, plan] of Object.entries(PLANS)) {
        let dropped = 0;
        const r = play(s, { months: 60, policy: (W) => { const p = smartX(W, st); const before = Wd.TIME_KEYS.filter((x) => p[x]).length; plan(W, p); if (p.tweak && Wd.timeUsed(W, p) > Wd.timeBudget(W, p)) { for (const x of ['sns', 'forecast', 'haccp', 'map']) { if (p[x]) { p[x] = false; dropped++; break; } } } return p; } });
        nc[k] = Wd.netCash(r.W); timeDrop[k] = (timeDrop[k] || 0) + dropped;
      }
      const best = Object.entries(nc).sort((a, b) => b[1] - a[1]);
      if (best[0][1] === best[1][1]) continue;
      n++; wins[best[0][0]] = (wins[best[0][0]] || 0) + 1; diff.push(Math.max(nc.yearly, nc.thermo, nc.thermoAug, nc.max) - nc.never);
    }
    out(`| ${label} | ${n} | ${Object.keys(PLANS).map((k) => `${k} ${pct(wins[k] || 0, n)}%`).join('・')} | ${man(median(diff))} | 変える店が時間の予算で外した手 ${Object.entries(timeDrop).map(([k, v]) => `${k} ${(v / N).toFixed(1)}`).join('・')} 回/周 |`);
  });
  out(`\n| 条件 | 周 | 最良の手の割合（never 変えない／yearly 毎年5月の手直し＋8月の限定／max 3か月ごと＋限定年4回／thermo F<0.92 のときだけ／thermoAug 体温計で手直し＋8月の限定） | 変える最良 − 変えない の中央値 | 時間 |\n|---|---|---|---|---|`);
  run('外れの年なし（実装のまま：外れでも +0.05）', {});
  run('外れの年：山が外れ（30%）なら F −0.05・その月の離れ +1%', { missPenalty: 0.05 });
  run('外れの年：F −0.10・離れ +1%', { missPenalty: 0.10 });
}

if (EXP === 'v09') {
  // 版0.9 の調整：看板の置き値（大の費用・効き・乱数）、仕入先の「いつ変えるか」、家族の上限。版0.8 の置き値の上で測る
  const X08 = { sign: true, supplier: true, retainP: 1.0, cheapHit: 0.3, cheapNest: 0.3, noRegHalf: true, shock: true, missPenalty: 0.05 };
  C.table.decay.v = 0.02; C.table.capBy.v = [40, 70, 100, 125, 145, 160, 170];
  const N = Math.min(RUNS, 120);
  setX(X08); out(`較正 potentialScale=${calibrate(N)}`);
  const cellTally = (rows, keys, label, order) => { const c = {}; rows.forEach((r) => { c[r.best] = (c[r.best] || 0) + 1; }); const n = rows.length; const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; out(`| ${label} | ${n} | ${order.map((k) => `${pct(c[k] || 0, n)}%`).join(' / ')} | ${top ? `${top[0]} ${pct(top[1], n)}%${pct(top[1], n) >= 70 ? ' ✗' : ''}` : '—'} |`); };
  const byCells = (rows, order, who) => { cellTally(rows, null, `${who} 全体`, order); for (const a of AREAS) cellTally(rows.filter((r) => r.area === a), null, `${who}・${a}`, order); const ps = rows.map((r) => r.pot).sort((a, b) => a - b), u1 = ps[Math.floor(ps.length / 3)], u2 = ps[Math.floor((2 * ps.length) / 3)]; cellTally(rows.filter((r) => r.pot < u1), null, `${who}・薄い町`, order); cellTally(rows.filter((r) => r.pot >= u1 && r.pot < u2), null, `${who}・中の町`, order); cellTally(rows.filter((r) => r.pot >= u2), null, `${who}・厚い町`, order); };
  // (1) 看板：大の費用と効きの格子（放置に近い店・上手「常連と地図」・上手「集客と席」）
  const signGrid = arg('--sign', 'grid');
  if (signGrid !== 'skip') {
    out(`\n### 看板の4択の格子（5年目末ネットキャッシュで最良。引き分けは除く）\n| 条件 | 周 | なし / 小 / 大 / 大をあとで | 最多 |\n|---|---|---|---|`);
    for (const [largeCost, signLarge, lucky] of [[500000, 0.07, 0], [400000, 0.07, 0], [300000, 0.07, 0], [500000, 0.10, 0], [400000, 0.10, 0], [400000, 0.10, 1]]) {
      withX({ largeCost, signLarge, signLuck: lucky }, () => {
        const rows = { idle: [], smart0: [], smart2: [] };
        for (let s = 0; s < N; s++) {
          const W0 = Wd.create({ seed: s, area: AREAS[s % 3] });
          const mk = { idle: (sign, at) => (W) => ({ ...idlePolicy(W), line: true, sign, signAt: at }), smart0: (sign, at) => (W) => smartX(W, 0, { sign, signAt: at }), smart2: (sign, at) => (W) => smartX(W, 2, { sign, signAt: at }) };
          for (const who of Object.keys(rows)) {
            const nc = {}; for (const [k, sign, at] of [['none', 'none', 3], ['small', 'small', 3], ['large', 'large', 3], ['later', 'large', 15]]) nc[k] = Wd.netCash(play(s, { months: 60, policy: mk[who](sign, at) }).W);
            const best = Object.entries(nc).sort((a, b) => b[1] - a[1]); if (best[0][1] === best[1][1]) continue;
            rows[who].push({ area: AREAS[s % 3], pot: W0.town.areas[W0.area].potentialMul, best: best[0][0], gap: best[0][1] - best[1][1] });
          }
        }
        const tag = `大 ${man(largeCost)}・+${signLarge}${lucky ? '・乱数（効き ×0.7〜1.3・許可の遅れ0〜2か月）' : ''}`;
        for (const [who, label] of [['idle', '放置に近い店'], ['smart0', '上手（常連と地図）'], ['smart2', '上手（集客と席）']]) byCells(rows[who], ['none', 'small', 'large', 'later'], `${tag}・${label}`);
      });
    }
  }
  // (2) 仕入先：いつ・何に。固定の3択＋「高い→原価上昇の予兆で標準」「標準→口座300万で高い」「安い→不良が出たら標準」
  out(`\n### 仕入先（固定3択＋いつ変えるか。5年目末ネットキャッシュで最良）\n| 条件 | 周 | 安い / 標準 / 高い / 高い→予兆で標準 / 標準→口座で高い / 安い→不良で標準 | 最多 |\n|---|---|---|---|`);
  {
    const SUPS = { cheap: () => 'cheap', std: () => 'std', high: () => 'high', highToStd: (W) => (W.seed % 2 === 0 && W.t >= 10 ? 'std' : 'high'), stdToHigh: (W) => (W.flags.supUp || (W.cash > 3000000 && W.t >= 12 ? (W.flags.supUp = true) : false) ? 'high' : 'std'), cheapToStd: (W) => (W.flags.defectSeen || (W.stores[0].defect ? (W.flags.defectSeen = true) : false) ? 'std' : 'cheap') };
    const rows = [];
    for (let s = 0; s < N; s++) {
      const st = Math.floor(s / 3) % 3, W0 = Wd.create({ seed: s, area: AREAS[s % 3] }), nc = {};
      for (const [k, fn] of Object.entries(SUPS)) nc[k] = Wd.netCash(play(s, { months: 60, policy: (W) => smartX(W, st, { supplier: fn }) }).W);
      const best = Object.entries(nc).sort((a, b) => b[1] - a[1]); if (best[0][1] === best[1][1]) continue;
      rows.push({ st, area: AREAS[s % 3], pot: W0.town.areas[W0.area].potentialMul, shock: s % 2 === 0, best: best[0][0] });
    }
    const order = Object.keys(SUPS);
    byCells(rows, order, '仕入先');
    for (let st = 0; st < 3; st++) cellTally(rows.filter((r) => r.st === st), null, `方針 ${SMART[st]}`, order);
    cellTally(rows.filter((r) => r.shock), null, '原価の上がる町', order); cellTally(rows.filter((r) => !r.shock), null, '上がらない町', order);
  }
  // (3) 家族の上限 40／45／50：放置どうし・立地と厚さの枡
  out(`\n### 店の形：家族の上限と枡（放置どうし。家族が勝つ割合）\n| 上限 | 全体 3年末／5年末 | 商店街 | 駅前 | 住宅地 | 薄い町 | 中の町 | 厚い町 |\n|---|---|---|---|---|---|---|---|`);
  for (const cap0 of [40, 45, 50]) withCoef({ capBy: [cap0, 70, 100, 125, 145, 160, 170] }, () => {
    const rows = [];
    for (let seed = 0; seed < N; seed++) {
      const W0 = Wd.create({ seed, area: AREAS[seed % 3] }), cash = {};
      for (const form of ['family', 'part1']) { const r = play(seed, { form, months: 60, policy: (W) => { const p = idlePolicy(W); p.parts = form === 'family' ? 0 : 1; p.family = form === 'family' ? 1 : 0; return p; } }); cash[form] = [36, 60].map((t) => Wd.netCash(at(r, t))); }
      rows.push({ area: AREAS[seed % 3], pot: W0.town.areas[W0.area].potentialMul, w3: cash.family[0] > cash.part1[0], w5: cash.family[1] > cash.part1[1] });
    }
    const rate = (rs) => `${pct(rs.filter((r) => r.w3).length, rs.length)}／${pct(rs.filter((r) => r.w5).length, rs.length)}%`;
    const ps = rows.map((r) => r.pot).sort((a, b) => a - b), u1 = ps[Math.floor(ps.length / 3)], u2 = ps[Math.floor((2 * ps.length) / 3)];
    out(`| ${cap0} | ${rate(rows)} | ${AREAS.map((a) => rate(rows.filter((r) => r.area === a))).join(' | ')} | ${rate(rows.filter((r) => r.pot < u1))} | ${rate(rows.filter((r) => r.pot >= u1 && r.pot < u2))} | ${rate(rows.filter((r) => r.pot >= u2))} |`);
  });
}

if (EXP === 'f7b') {
  out(`A 実装の母集団：${f7Stats(RUNS)}`);
  withX({ deferRepay: 6 }, () => out(`E 返済猶予の札（口座がマイナスになった月から6か月、公庫の返済を止める）：${f7Stats(RUNS)}`));
  withX({ deferRepay: 12 }, () => out(`F 返済猶予12か月：${f7Stats(RUNS)}`));
  out(`G 3か月ごとに引き直し＋赤字2か月で減らす：${f7Stats(RUNS, { hold: 3, notice: 2 })}`);
  withX({ deferRepay: 6 }, () => out(`H 3か月ごとに引き直し＋赤字3か月で減らす＋返済猶予6か月：${f7Stats(RUNS, { hold: 3, notice: 3 })}`));
}

if (EXP === 'f7') {
  out(`A 実装の母集団（人数は年初に引いて12か月保つ）：${f7Stats(RUNS)}`);
  for (const hold of [6, 3]) out(`B 人数を${hold}か月ごとに引き直す：${f7Stats(RUNS, { hold })}`);
  for (const k of [2, 3, 6]) out(`C 赤字が${k}か月続いたら人を1人減らす（気づく遅れ ${k}か月）：${f7Stats(RUNS, { notice: k })}`);
  for (const k of [3]) out(`D 3か月ごとに引き直し＋赤字${k}か月で減らす：${f7Stats(RUNS, { hold: 3, notice: k })}`);
}

if (EXP === 'v08' || EXP === 'ceiling') {
  // 版0.8 の置き値を実装の sim に差し込む：看板・仕入先・歯止め①②③・古び −2%（段0 −1%）・常連3割の半分を外す・家族の上限40・原価の上がる町（偶数 seed）
  const X08 = { sign: true, supplier: true, retainP: 1.0, cheapHit: 0.3, cheapNest: 0.3, noRegHalf: true, shock: true };
  setX(X08);
  C.table.decay.v = 0.02; C.table.capBy.v = [40, 70, 100, 125, 145, 160, 170];
  const N = Math.min(RUNS, 120);
  out(`\n## 版0.8 の置き値を差し込んだ実装（再較正）`);
  out(`較正 potentialScale=${calibrate(N)}（放置の3年目中央値 44）`);
  if (EXP === 'v08') {
    const im = idleMedian(N); out(`放置（${N}周）：中央値 ${f1(median(im))}、上位25% ${f1(q(im, 0.75))}`);
    const bs = []; for (let s = 0; s < N; s++) bs.push(yearN(play(s, { months: 36, policy: basicPolicy }), 3));
    out(`基礎の手だけの店（小の看板・LINE・高い仕入先・${N}周）：中央値 ${f1(median(bs))}、上位25% ${f1(q(bs, 0.75))}`);
    const ss = smartStats(N, (W, s) => smartX(W, s));
    out(`上手（d.9.3 の状況に応じる3方針・${N}周・3年目）：上位25% ${ss.map((x, i) => `${SMART[i]} ${f1(x.q3)}`).join('／')}（まとめ ${f1(q(ss.flatMap((x) => x.ns), 0.75))}）、中央値 ${ss.map((x) => f1(x.med)).join('／')}、倒産 ${ss.map((x) => x.dead).join('/')}`);
    for (let st = 0; st < 3; st++) { let plus = 0; for (let s = 0; s < N; s++) if (ss[st].ns[s] - bs[s] >= 10) plus++; out(`上手「${SMART[st]}」が基礎の手だけの店より +10人以上の周：${ci(plus, N)}`); }
    // 口座で見る上手さ：5年目末ネットキャッシュ 上手 vs 基礎
    { let win = 0; const ncS = [], ncB = []; for (let s = 0; s < N; s++) { const st = Math.floor(s / 3) % 3; const a = Wd.netCash(play(s, { months: 60, policy: (W) => smartX(W, st) }).W), b = Wd.netCash(play(s, { months: 60, policy: basicPolicy }).W); ncS.push(a); ncB.push(b); if (a > b) win++; } out(`5年目末ネットキャッシュ：上手 中央値 ${man(median(ncS))}／基礎 ${man(median(ncB))}、上手が勝つ周 ${ci(win, N)}`); }
    // 仕入先の3択：方針ごと・条件内（立地・町の厚さ三分位・原価の上がる町）
    out(`\n### 仕入先の3択（5年目末ネットキャッシュで最良。引き分けは除く）`);
    const supRows = [];
    for (let s = 0; s < N; s++) {
      const st = Math.floor(s / 3) % 3, W0 = Wd.create({ seed: s, area: AREAS[s % 3] });
      const nc = {}; for (const sup of ['cheap', 'std', 'high']) nc[sup] = Wd.netCash(play(s, { months: 60, policy: (W) => smartX(W, st, { supplier: sup }) }).W);
      const best = Object.entries(nc).sort((a, b) => b[1] - a[1]); if (best[0][1] === best[1][1]) continue;
      supRows.push({ s, st, area: AREAS[s % 3], pot: W0.town.areas[W0.area].potentialMul, shock: s % 2 === 0, other: W0.otherFixed, best: best[0][0] });
    }
    const tally = (rows, label) => { const c = {}; rows.forEach((r) => { c[r.best] = (c[r.best] || 0) + 1; }); const n = rows.length; out(`| ${label} | ${n} | ${['cheap', 'std', 'high'].map((k) => `${pct(c[k] || 0, n)}%`).join(' / ')} |`); };
    out(`| 条件 | 周 | 安い / 標準 / 高い |\n|---|---|---|`);
    tally(supRows, '全体');
    for (let st = 0; st < 3; st++) tally(supRows.filter((r) => r.st === st), `方針 ${SMART[st]}`);
    for (const a of AREAS) tally(supRows.filter((r) => r.area === a), `立地 ${a}`);
    const pots = supRows.map((r) => r.pot).sort((a, b) => a - b), t1 = pots[Math.floor(pots.length / 3)], t2 = pots[Math.floor((2 * pots.length) / 3)];
    tally(supRows.filter((r) => r.pot < t1), '薄い町（潜在客 下1/3）'); tally(supRows.filter((r) => r.pot >= t1 && r.pot < t2), '中の町'); tally(supRows.filter((r) => r.pot >= t2), '厚い町（上1/3）');
    tally(supRows.filter((r) => r.shock), '原価の上がる町（偶数 seed）'); tally(supRows.filter((r) => !r.shock), '原価の上がらない町');
    tally(supRows.filter((r) => r.other > 150000), 'その他固定費20万'); tally(supRows.filter((r) => r.other <= 150000), 'その他固定費15万');
    // 看板の4択：放置に近い店（放置＋LINE）と上手（多店舗）。5年目末ネットキャッシュ
    out(`\n### 看板の4択（5年目末ネットキャッシュで最良。引き分けは除く）`);
    const signRows = [];
    for (let s = 0; s < N; s++) {
      const W0 = Wd.create({ seed: s, area: AREAS[s % 3] });
      for (const [who, mk] of [['放置に近い店', (sign, at) => (W) => ({ ...idlePolicy(W), line: true, sign, signAt: at })], ['上手（常連と地図）', (sign, at) => (W) => smartX(W, 0, { sign, signAt: at })]]) {
        const nc = {}; for (const [k, sign, at] of [['none', 'none', 3], ['small', 'small', 3], ['large', 'large', 3], ['later', 'large', 15]]) nc[k] = Wd.netCash(play(s, { months: 60, policy: mk(sign, at) }).W);
        const best = Object.entries(nc).sort((a, b) => b[1] - a[1]); if (best[0][1] === best[1][1]) continue;
        signRows.push({ who, area: AREAS[s % 3], pot: W0.town.areas[W0.area].potentialMul, best: best[0][0] });
      }
    }
    const tallyS = (rows, label) => { const c = {}; rows.forEach((r) => { c[r.best] = (c[r.best] || 0) + 1; }); const n = rows.length; out(`| ${label} | ${n} | ${['none', 'small', 'large', 'later'].map((k) => `${pct(c[k] || 0, n)}%`).join(' / ')} |`); };
    out(`| 条件 | 周 | なし / 小 / 大 / 大をあとで |\n|---|---|---|`);
    for (const who of ['放置に近い店', '上手（常連と地図）']) { const rows = signRows.filter((r) => r.who === who); tallyS(rows, who); for (const a of AREAS) tallyS(rows.filter((r) => r.area === a), `${who}・${a}`); const ps = rows.map((r) => r.pot).sort((a, b) => a - b), u1 = ps[Math.floor(ps.length / 3)], u2 = ps[Math.floor((2 * ps.length) / 3)]; tallyS(rows.filter((r) => r.pot < u1), `${who}・薄い町`); tallyS(rows.filter((r) => r.pot >= u1 && r.pot < u2), `${who}・中の町`); tallyS(rows.filter((r) => r.pot >= u2), `${who}・厚い町`); }
    // 店の形
    out(`\n### 店の形（家族1人・パート0 vs パート1人。ネットキャッシュ）`);
    out(`放置どうし（${N}周）：${familyStats(N, 'idle')}`);
    out(`基礎の手だけどうし（${N}周）：${familyStats(N, 'basic')}`);
    out(`上手どうし（${N}周）：${familyStats(N, 'smart')}`);
    // 値段
    out(`\n### 値段（上手 smartX の手で年別の値段を全探索）`);
    const polX = (W, st, price) => smartX(W, st, { prices: [price, price, price, price, price] });
    flipStat('50円刻み・反応あり', { polFn: polX });
    flipStat('50円刻み・他店固定', { polFn: polX, fixedRival: true });
    flipStat('1年目10円刻み・反応あり', { polFn: polX, cands: [Y10, Y50, Y50] });
  }
  if (EXP === 'ceiling') {
    // 上手の上限：方針の置き値（人数の上限・看板・仕入先・チラシ・値段の道）を seed ごとに探索し、最良の3年目客数の上位25%を測る
    out(`\n### 上手の上限（seed ごとに置き値を総当たりし最良を採る。${SEEDS}周）`);
    const bestN = [], bestNC = [], ruleN = [];
    for (let s = 0; s < SEEDS; s++) {
      let bn = -1, bnc = -Infinity;
      for (const st of [0, 1, 2]) for (const maxParts of [2, 3, 4]) for (const sign of ['small', 'large']) for (const supplier of ['std', 'high']) for (const flyer of [0, 50000, 100000]) for (const prices of [PRICES[st], [750, 850, 950, 1000, 1000], [800, 900, 1000, 1050, 1050], [850, 850, 900, 950, 1000]]) {
        const r = play(s, { months: 36, policy: (W) => smartX(W, st, { maxParts, sign, supplier, flyer, prices }) });
        const n3 = yearN(r, 3); if (n3 > bn) bn = n3; const nc = Wd.netCash(r.W); if (nc > bnc) bnc = nc;
      }
      bestN.push(bn); bestNC.push(bnc);
      ruleN.push(Math.max(...[0, 1, 2].map((st) => yearN(play(s, { months: 36, policy: (W) => smartX(W, st) }), 3))));
    }
    out(`上限（最良の置き値）3年目客数：中央値 ${f1(median(bestN))}、上位25% ${f1(q(bestN, 0.75))}、上位10% ${f1(q(bestN, 0.9))}。3年目末ネットキャッシュ 中央値 ${man(median(bestNC))}`);
    out(`規則の上手（d.9.3 の3方針の最良）3年目客数：中央値 ${f1(median(ruleN))}、上位25% ${f1(q(ruleN, 0.75))}`);
  }
}
out(`\n（${((Date.now() - t0) / 1000).toFixed(0)}秒）`);
