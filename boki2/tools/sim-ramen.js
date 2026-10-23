#!/usr/bin/env node
// ラーメン版の無作為の通し試験（1年版）。DESIGN-RAMEN 版0.4 l.2 段3・k.5・l.5 F7。式（world.js など）より先に書いた検査。
// 使い方：node boki2/tools/sim-check.js --ramen [--runs 300] [--seed0 0]（このファイルを直接 node で動かしてもよい）
// 世界・需要・一杯・ライバル・札は純粋関数（DOM なし）。検査はそれを数百〜数千周まわして、
//  ①式の端（値段で客が単調に減る・係数の範囲・平均の店の客数）
//  ②支配的な手がないか（値段：値下げ・据え置き・値上げのどれも最適 <70%、上限まで下げる <40%、1年目と3年目で最適が入れ替わる周 >50%。時間の予算：全部やる <70%。店の形：家族とパート1人の勝率 30〜70%）
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

// ---------- 無作為の手（いつでも手：値段・仕込み・集客・人・一杯） ----------
const AREAS = ['shotengai', 'ekimae', 'jutaku'];
const PRICE_STEPS = [-100, -50, 0, 50, 100];
function randPolicy(W, rng, prev) {
  const p = Wd.policy0(W, prev);
  const cur = prev ? prev.price : W.stores[0].price;
  p.price = Math.max(Wd.PRICE_MIN, Math.min(Wd.PRICE_MAX, cur + PRICE_STEPS[Math.floor(rng() * PRICE_STEPS.length)]));
  p.prep = ['low', 'mid', 'high'][Math.floor(rng() * 3)];
  p.flyer = [0, 0, 30000, 100000][Math.floor(rng() * 4)];
  p.coupon = rng() < 0.1;
  p.line = rng() < 0.4;
  for (const k of ['forecast', 'map', 'sns', 'haccp', 'inspect']) p[k] = rng() < 0.6;
  p.tweak = rng() < 0.15;
  if (rng() < 0.08) p.parts = Math.max(0, Math.min(3, p.parts + (rng() < 0.5 ? -1 : 1)));
  return Wd.fitTime(W, p, rng);
}
function play(seed, o = {}) {
  const rng = D.rng(seed * 7919 + 13);
  let W = Wd.create({ seed, area: o.area || AREAS[seed % 3], form: o.form || 'part1', parts: o.parts, family: o.family, tier: 0 });
  const hist = [];
  let pol = null;
  const months = o.months || 13;
  for (let k = 0; k < months; k++) {
    pol = o.policy ? o.policy(W, k, pol, rng) : randPolicy(W, rng, pol);
    const before = W;
    const r = Wd.month(W, pol, { rng: D.rng(seed * 104729 + k) });
    W = r.W;
    hist.push({ k, W: before, pol, res: r.res });
    if (o.onMonth) o.onMonth(before, pol, r, k);
    if (W.bankrupt) break;
  }
  return { W, hist };
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
  const avg = [];
  for (let s = 0; s < 60; s++) {
    const { hist } = play(SEED0 + s, { months: 36, policy: (W, k, prev) => Wd.policy0(W, prev, { neutral: true }) });
    const late = hist.slice(24).map((h) => h.res.N);
    avg.push(late.reduce((a, b) => a + b, 0) / late.length);
  }
  avg.sort((a, b) => a - b);
  const med = avg[Math.floor(avg.length / 2)], q3 = avg[Math.floor(avg.length * 0.75)];
  if (med < 36 || med > 52) err(`平均の店：育った後（3年目）の客数の中央値 ${med.toFixed(1)} 人/日（44±8 の外）`);
  info.push(`平均の店（手を打たない・3年目）：客数の中央値 ${med.toFixed(1)} 人/日、上位25% ${q3.toFixed(1)} 人/日（上位25%の店 100±15 は「上手な手」の店の数で、切り身の検査の外。報告に数だけ）`);
}

// ---------- 3. 無作為の通し（1年目＋翌4月 13か月）：倒産・詰み・出ない札・札の重み ----------
const dealt = {};
let bankrupt1 = 0, stuck = 0, weightBad = 0, cardsChecked = 0;
const netCash = [];
for (let s = 0; s < RUNS; s++) {
  let stuckHere = false;
  const { W } = play(SEED0 + s, {
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
  if (W.bankrupt) bankrupt1++;
  if (stuckHere) stuck++;
  netCash.push(W.cash - W.loan);
}
{
  const never = CD.deck.filter((c) => !dealt[c.id]).map((c) => c.id);
  if (never.length) err(`出ない札：${RUNS}周で一度も出ない札 ${never.join('・')}`);
  if (pct(stuck, RUNS) >= 1) err(`詰み：${pct(stuck, RUNS)}% の周（1% 未満）`);
  netCash.sort((a, b) => a - b);
  info.push(`無作為 ${RUNS}周（13か月）：倒産 ${pct(bankrupt1, RUNS)}%（F7 の目安 5〜10%。段10で合わせる）、詰み ${pct(stuck, RUNS)}%、札 ${CD.deck.length} 本すべて出た（${never.length ? '×' : '○'}）、重みの検査 ${cardsChecked} 回。翌4月のネットキャッシュ（口座−借入）の中央値 ${Math.round(netCash[Math.floor(RUNS / 2)] / 1e4)}万・下位10% ${Math.round(netCash[Math.floor(RUNS * 0.1)] / 1e4)}万・上位10% ${Math.round(netCash[Math.floor(RUNS * 0.9)] / 1e4)}万`);
}

// ---------- 4. 値段：最も良い手が状態で割れるか（X4・k.5）。1年目6月と3年目6月の状態で、値段の手を3か月の試算で比べる ----------
{
  const OPTS = [['floor', null], ['down100', -100], ['down50', -50], ['keep', 0], ['up50', 50], ['up100', 100], ['over1000', null]];
  const cat = (id) => (/down|floor/.test(id) ? 'down' : id === 'keep' ? 'keep' : 'up');
  const cnt = { down: 0, keep: 0, up: 0 }, bestP = [];
  let floorBest = 0, n = 0, swap = 0, runs = 0, rise = 0;
  const N = Math.min(RUNS, 200);
  for (let s = 0; s < N; s++) {
    const { hist } = play(SEED0 + s, { months: 27 });
    const at = [hist[2], hist[26]];
    if (at.some((h) => !h)) continue;
    const best = at.map((h) => {
      const cur = h.pol.price;
      let b = null;
      for (const [id, d] of OPTS) {
        const p = id === 'floor' ? Wd.PRICE_MIN : id === 'over1000' ? Math.max(1050, cur + 150) : cur + d;
        if (p < Wd.PRICE_MIN || p > Wd.PRICE_MAX) continue;
        const v = Wd.evalPolicy(h.W, { ...h.pol, price: p }, 3);
        if (!b || v > b.v) b = { id, v, p };
      }
      n++; cnt[cat(b.id)]++; if (b.id === 'floor') floorBest++;
      return b;
    });
    runs++;
    if (cat(best[0].id) !== cat(best[1].id)) swap++;
    if (best[1].p > best[0].p) rise++;
    bestP.push([best[0].p, best[1].p]);
  }
  for (const k of ['down', 'keep', 'up']) if (pct(cnt[k], n) >= 70) err(`値段：「${k}」が最適な状態が ${pct(cnt[k], n)}%（70% 未満）`);
  if (pct(floorBest, n) >= 40) err(`値段：上限まで下げる（${Wd.PRICE_MIN}円）が最適な状態が ${pct(floorBest, n)}%（40% 未満）`);
  if (pct(swap, runs) <= 50) err(`値段：1年目と3年目で最適の手（下げる・据え置く・上げる）が入れ替わる周が ${pct(swap, runs)}%（50% 超）`);
  const med = (k) => { const a = bestP.map((x) => x[k]).sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
  info.push(`値段（${n} 状態・${runs}周）：最適が 下げる ${pct(cnt.down, n)}%・据え置く ${pct(cnt.keep, n)}%・上げる ${pct(cnt.up, n)}%、上限まで下げる ${pct(floorBest, n)}%。1年目と3年目で入れ替わる周 ${pct(swap, runs)}%、3年目の最適の値段が1年目より高い周 ${pct(rise, runs)}%。最適の値段の中央値 1年目6月 ${med(0)}円 → 3年目6月 ${med(1)}円`);
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

// ---------- 6. 店の形：家族で小さく と パート1人 の勝率がどちらも 30〜70%（X2・k.5）。同じ seed・同じ無作為の手で、人の構成だけ替える ----------
{
  let famWinCash = 0, famWinMonths = 0, nCash = 0, nMonths = 0;
  for (let s = 0; s < Math.min(RUNS, 300); s++) {
    const out = {};
    for (const form of ['family', 'part1']) {
      const rng = D.rng((SEED0 + s) * 31 + 7);
      let prev = null;
      const r = play(SEED0 + s, { form, months: 36, policy: (W, k, pv) => { const q = randPolicy(W, rng, prev); q.parts = Wd.FORMS[form].parts; q.family = Wd.FORMS[form].family; prev = q; return Wd.fitTime(W, q, rng); } });
      out[form] = { cash: r.W.cash - r.W.loan, black: r.hist.slice(0, 12).filter((h) => h.res.op > 0).length, dead: r.W.bankrupt };
    }
    if (out.family.cash !== out.part1.cash) { nCash++; if (out.family.cash > out.part1.cash) famWinCash++; }
    if (out.family.black !== out.part1.black) { nMonths++; if (out.family.black > out.part1.black) famWinMonths++; }
  }
  for (const [what, w, n] of [['3年目末のネットキャッシュ', famWinCash, nCash], ['1年目の黒字の月の数', famWinMonths, nMonths]]) {
    const p = pct(w, n);
    if (p < 30 || p > 70) err(`店の形：${what}で家族の勝率 ${p}%（パート1人 ${pct(n - w, n)}%）。どちらも 30〜70%`);
  }
  info.push(`店の形（同じ seed・同じ手）：家族の勝率 3年目末のネットキャッシュ ${pct(famWinCash, nCash)}%（${nCash}周）・1年目の黒字の月の数 ${pct(famWinMonths, nMonths)}%（${nMonths}周）`);
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
    play(SEED0 + s, { months: 10, policy: (W, k, prev) => { const q = Wd.policy0(W, prev, { neutral: true }); if (k === 7) q.limited = true; return q; }, onMonth: (bf, pol, r, k) => { if (k === 7) { const f = r.res.factors; const top = Object.entries(f).filter(([key]) => key !== 'total').sort((a, c) => Math.abs(c[1]) - Math.abs(a[1]))[0]; if (top && top[0] === 'bowl') peakTop++; peakEff.push(r.res.peakEffect); } } });
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
console.log(`OK：ラーメン版の無作為の通し試験（1年版）${RUNS}周（${((Date.now() - t0) / 1000).toFixed(1)}秒）`);
