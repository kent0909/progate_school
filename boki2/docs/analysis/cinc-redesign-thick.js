#!/usr/bin/env node
// 設計者 W（DESIGN-CINC-REBUILD 版0.3）：2号店を出すための「社長が店を離れる」条件（DESIGN-RAMEN c.3 L271「人の構成を厚くに変える（社長の報酬・パート3人以上）」、
// c.8 L331「法人で厚く…社長が店を離れられる（2号店の条件）」、g.2 L930、e.4 L754「社長が1号店を離れると1号店の Q が落ちる」）を入れると、
// 2号店の会社の取り戻しがどう変わるか（J-D F4）。物差しは cinc-redesign-site2-slope.js と同じ（乱数なし・札なし・家族を除く60組・72か月）。
// 3つの道：
//   T0 いまの式（1号店はパート1人のまま、2号店は新しく雇う）
//   T1 法人で厚く：2号店を開く月から1号店をパート3人にし、社長の報酬 月20万を会社の費用に入れる（c.8 の表の「法人で厚く 80万」の形）
//   T2 店長を雇う：1号店はそのまま、2号店に修業経験者の店長（月25万【置き値】：hire_cook の「高い」）を足す
//   T3 社長が2店を見る：人は足さず、1号店の評判 R を開いた月から −0.3（c.8 L331・e.4 L754 の「1号店の Q が落ちる」を評判の下げで代える【置き値】）
// 使い方：node cinc-redesign-thick.js
'use strict';
global.window = global;
const path = require('path');
const root = path.resolve(__dirname, '../..');
const STORY = require(path.join(root, 'tools/ramen-files.js')).story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA, Wd = D.world, C = D.coef, BW = D.bowl;
const clone = (x) => JSON.parse(JSON.stringify(x));
const price1 = (t) => (t < 12 ? 800 : t < 24 ? 850 : 900);
const pol1 = (W, prev, parts) => { const p = Wd.policy0(W, prev); Object.assign(p, { price: price1(W.t), map: true, haccp: true, line: true, flyer: 30000, parts, family: 0, prep: 'mid', supplier: 'std', sns: false, forecast: false, inspect: false, tweak: false }); return Wd.fitTime(W, p, D.rng(W.seed * 37 + W.t)); };
const completeFx = D.cards.byId.site2_complete.options[0].outcomes[0].fx;
const FITOUT = C('fitout'), DEPOSIT = C('deposit'), OPEN_T = 19, H = 72;
function warm(seed) { let W = Wd.create({ seed, area: 'shotengai', form: 'part1', bowl: BW.presets[0].spec }); let prev = null; for (let t = 0; t < OPEN_T; t++) { const p = pol1(W, prev, 1); const r = Wd.month(W, p, { noise: false, noCards: true, rng: D.rng(seed * 104729 + t) }); W = r.W; prev = p; } return { W, prev }; }
function run(base, o) {
  let w = clone(base.W), pr = base.prev; const parts = o.way === 'T1' ? 3 : 1;
  if (o.area) { w.flags.y2Build = { area: o.area, form: o.form, at: w.t, staff: 'hire' }; completeFx(w); if (o.way === 'T3') w.stores[0].R = Math.max(1, w.stores[0].R - 0.3); }
  const op1 = [], op2 = [], dep2 = [];
  for (let t = OPEN_T; t < OPEN_T + H; t++) {
    const p = pol1(w, pr, o.area ? parts : 1); const r = Wd.month(w, p, { noise: false, noCards: true, rng: D.rng(base.W.seed * 104729 + t) }); w = r.W; pr = p;
    const a = r.res.stores ? r.res.stores[0] : r.res; let x1 = a.op; if (o.way === 'T1') x1 -= 200000; op1.push(x1);
    const b = r.res.stores && r.res.stores[1]; if (b && b.sales != null) { op2.push(b.op - (o.way === 'T2' ? 250000 : 0)); dep2.push(b.dep || 0); }
  }
  return { op1, op2, dep2 };
}
const med = (a) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); if (!b.length) return null; return b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2; };
const res = { T0: [], T1: [], T2: [], T3: [] };
for (let seed = 0; seed <= 9; seed++) {
  const base = warm(seed); const alone = run(base, {}).op1;
  for (const area of ['shotengai', 'ekimae', 'jutaku']) for (const form of ['part1', 'part2']) for (const way of Object.keys(res)) {
    const r = run(base, { area, form, way }); let cum = 0, pay = null;
    for (let i = 0; i < r.op2.length; i++) { cum += r.op2[i] + r.dep2[i] - (alone[i] - r.op1[i]); if (pay == null && cum >= FITOUT + DEPOSIT) pay = i + 1; }
    res[way].push({ pay, cum: cum - FITOUT - DEPOSIT });
  }
}
const NAME = { T0: 'いまの式', T1: '法人で厚く（1号店パート3人＋社長の報酬20万）', T2: '店長を雇う（2号店に月25万）', T3: '社長が2店を見る（1号店の評判 −0.3）' };
for (const [k, x] of Object.entries(res)) out(`${NAME[k]}：会社の取り戻し 中央値 ${med(x.map((r) => r.pay))}か月目（来ない ${x.filter((r) => r.pay == null).length}/60）、72か月の会社の累計の中央値 ${Math.round(med(x.map((r) => r.cum)) / 1e4)}万円`);
const best = {}; for (let i = 0; i < 60; i++) { let bk = 'T0'; for (const k of Object.keys(res)) if (res[k][i].cum > res[bk][i].cum) bk = k; best[NAME[bk]] = (best[NAME[bk]] || 0) + 1; }
out('組ごとに会社の累計が最大の道：' + JSON.stringify(best));
function out(x) { console.log(x); }
