#!/usr/bin/env node
// J-B：「2号店が48か月中47か月赤字」は打ち手の決め方から来るのか、ゲームの式から来るのか。
// ゲームの式（js/sim/world.js の month と、cards-y2.js の 2号店の完成・ramen-y2-close.js の改装と一杯の変更）を、ゲームのファイルを変えずに node で回す。
// 1号店は上手の打ち手に近い手（値段 800→850→900、地図・衛生・LINE・チラシ3万、パート1人）で、乱数なし・札なしで t=0〜38 を回す。
// 2号店は 2年目11月（t=19）に開く（cards-y2.js:93〜101 の完成の fx をそのまま呼ぶ）。
// 調べる手：
//  (G) ゲームが人に渡している手：場所3×店の形3×人の用意2（新しく雇う／1号店から1人回す）＋3年目6月の赤字の札（改装：品質／処理量、一杯と看板を変える：一杯3×看板4、粘る）
//  (X) 式にはあるが画面で人が動かせない手（反実仮想）：2号店の値段 700〜1,200円・パートの人数 0〜3・LINE
// 使い方：node cinc-rebuild-B-fact-site2.js [--seed 0]
'use strict';
global.window = global;
const path = require('path');
const root = path.resolve(__dirname, '../..');
const STORY = require(path.join(root, 'tools/ramen-files.js')).story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA, Wd = D.world, C = D.coef, BW = D.bowl;
const seed = (() => { const i = process.argv.indexOf('--seed'); return i > 0 ? +process.argv[i + 1] : 0; })();
const clone = x => JSON.parse(JSON.stringify(x));
const price1 = t => t < 12 ? 800 : t < 24 ? 850 : 900;
const pol1 = (W, prev) => { const p = Wd.policy0(W, prev); Object.assign(p, { price: price1(W.t), map: true, haccp: true, line: true, flyer: 30000, parts: 1, family: 0, prep: 'mid', supplier: 'std', sns: false, forecast: false, inspect: false, tweak: false }); return Wd.fitTime(W, p, D.rng(W.seed * 37 + W.t)); };
// 1号店だけで t=0..18
let W = Wd.create({ seed, area: 'shotengai', form: 'part1', bowl: BW.presets[0].spec });
let prev = null;
for (let t = 0; t < 19; t++) { const p = pol1(W, prev); W = Wd.month(W, p, { noise: false, noCards: true, rng: D.rng(seed * 104729 + t) }).W; prev = p; }
const W19 = clone(W);
const completeFx = D.cards.byId.site2_complete.options[0].outcomes[0].fx;
const closeCard = D.cards.byId.close;
function run({ area, form, staff = 'hire', close = null, closeImprove = 'quality', closeBowl = 'shoyu', closeSign = 'none', cf = null }) {
  let w = clone(W19), pr = prev;
  w.flags.y2Build = { area, form, at: w.t, staff };
  completeFx(w);
  const ops = [], sales = [], N = [];
  for (let t = 19; t < 39; t++) {
    // 3年目6月（t=26）の赤字の札：選んだ手の fx を翌月のはじめに当てる（ゲームと同じく、札の結果は翌月）
    if (close && t === 27 && w.stores[1] && (w.stores[1].lossMonths || 0) >= 0) {
      w.flags.y2CloseImprove = closeImprove; w.flags.y2CloseBowl = closeBowl; w.flags.y2CloseSign = closeSign; w.flags.y2CloseQuote = {};
      const o = closeCard.options.find(x => x.id === close); if (o.outcomes[0].fx) o.outcomes[0].fx(w);
    }
    const st = w.stores[1];
    if (cf && st && st.open !== false) { if (cf.price != null) st.price = cf.price; if (cf.parts != null) st.parts = cf.parts; if (cf.line) st.line = true; }
    const p = pol1(w, pr);
    const r = Wd.month(w, p, { noise: false, noCards: true, rng: D.rng(seed * 104729 + t) });
    w = r.W; pr = p;
    const s1 = r.res.stores && r.res.stores[1];
    if (w.stores[1]) w.stores[1].lossMonths = s1 && s1.op < 0 ? (w.stores[1].lossMonths || 0) + 1 : 0;
    if (s1 && s1.sales != null && w.stores[1].open !== false) { ops.push(Math.round(s1.op)); sales.push(Math.round(s1.sales)); N.push(+s1.N.toFixed(1)); }
  }
  const first8 = ops.slice(0, 8), after = ops.slice(8);
  return { ops: ops.map(x => Math.round(x / 1000)), lossMonths8: first8.filter(x => x < 0).length, op8avg: Math.round(first8.reduce((a, b) => a + b, 0) / first8.length), opAfterAvg: after.length ? Math.round(after.reduce((a, b) => a + b, 0) / after.length) : null, lossAfter: after.filter(x => x < 0).length, bestMonth: Math.max(...ops), N8: N.slice(0, 8), opLast: ops[ops.length - 1], NLast: N[N.length - 1] };
}
const AREAS = ['shotengai', 'ekimae', 'jutaku'], FORMS = ['family', 'part1', 'part2'];
const out = { seed, note: '乱数なし・札なし。1号店は上手に近い固定の手。2号店の月のもうけ（res.stores[1].op）', G_open: [], G_close: [], X_counterfactual: [] };
for (const area of AREAS) for (const form of FORMS) for (const staff of ['hire', 'transfer']) out.G_open.push({ area, form, staff, ...run({ area, form, staff }) });
// 赤字の札（t=26）の手：いちばん赤字の小さい開き方と、上手の6周と同じパート1人の3か所で
for (const area of AREAS) for (const form of ['family', 'part1']) {
  out.G_close.push({ area, form, close: 'stick', ...run({ area, form, close: 'stick' }) });
  for (const imp of ['quality', 'capacity']) out.G_close.push({ area, form, close: 'renovate:' + imp, ...run({ area, form, close: 'renovate', closeImprove: imp }) });
  for (const b of BW.presets.map(p => p.id)) for (const sg of ['none', 'small', 'large']) out.G_close.push({ area, form, close: `format:${b}:${sg}`, ...run({ area, form, close: 'format', closeBowl: b, closeSign: sg }) });
}
// 反実仮想：2号店の値段・人・LINE を人が動かせたら
for (const area of AREAS) for (const form of FORMS) for (const price of [700, 800, 850, 900, 1000, 1100, 1200]) for (const parts of [0, 1, 2, 3]) for (const line of [false, true]) {
  if (form === 'family' && parts > 1) continue;
  if (form !== 'family' && parts === 0) continue; // 家族なし・パート0人は「だれも働かない店」で、式の端（回せる客45人/日・人件費0）。人の店として外す
  out.X_counterfactual.push({ area, form, price, parts, line, ...run({ area, form, cf: { price, parts, line } }) });
}
const best = (list, key) => list.slice().sort((a, b) => b[key] - a[key])[0];
out.summary = {
  G_open_bestOp8: best(out.G_open, 'op8avg'), G_open_anyProfitMonth: out.G_open.filter(x => x.bestMonth >= 0).length + '/' + out.G_open.length,
  G_close_bestAfter: best(out.G_close, 'opAfterAvg'), G_close_profitAfter: out.G_close.filter(x => x.opAfterAvg >= 0).map(x => `${x.area}:${x.form}:${x.close}=${x.opAfterAvg}`),
  X_bestOp8: best(out.X_counterfactual, 'op8avg'), X_bestAfter: best(out.X_counterfactual, 'opAfterAvg'), X_profit8: out.X_counterfactual.filter(x => x.op8avg >= 0).length + '/' + out.X_counterfactual.length,
  X_profitAfter: out.X_counterfactual.filter(x => x.opAfterAvg >= 0).length + '/' + out.X_counterfactual.length,
};
console.log(JSON.stringify(process.argv.includes('--all') ? out : { seed, note: out.note, summary: out.summary, G_open: out.G_open }, null, 1));
