#!/usr/bin/env node
// 論証の検査役 R-D：「2号店の坂は現実の形なので消さない」の反対の筋を、ゲームの式で試す。
// 2号店は SIM.world.create で新しく作られ（cards-y2.js:95）、評判 R・認知 A・常連 L を0か初期値から始める。
// 現実の2店目は1店目の評判を引き継ぐのではないか、という筋を、「2号店の R と A を開店の月の1号店の値にそろえる」で測る。
// 設計者 W の cinc-redesign-site2-slope.js と同じ読み込み・同じ1号店の手・同じ物差し（何もしない、家族を除く60組）。ゲームのファイルは変えない。
// 使い方：node cinc-redesign-reasoning-inherit.js
'use strict';
global.window = global;
const path = require('path');
const root = path.resolve(__dirname, '../..');
const STORY = require(path.join(root, 'tools/ramen-files.js')).story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA, Wd = D.world, C = D.coef, BW = D.bowl;
const clone = (x) => JSON.parse(JSON.stringify(x));
const price1 = (t) => (t < 12 ? 800 : t < 24 ? 850 : 900);
const pol1 = (W, prev) => { const p = Wd.policy0(W, prev); Object.assign(p, { price: price1(W.t), map: true, haccp: true, line: true, flyer: 30000, parts: 1, family: 0, prep: 'mid', supplier: 'std', sns: false, forecast: false, inspect: false, tweak: false }); return Wd.fitTime(W, p, D.rng(W.seed * 37 + W.t)); };
const completeFx = D.cards.byId.site2_complete.options[0].outcomes[0].fx;
const FITOUT = C('fitout'), DEPOSIT = C('deposit'), OPEN_T = 19, HORIZON = 72;
function warm(seed) { let W = Wd.create({ seed, area: 'shotengai', form: 'part1', bowl: BW.presets[0].spec }); let prev = null; for (let t = 0; t < OPEN_T; t++) { const p = pol1(W, prev); const r = Wd.month(W, p, { noise: false, noCards: true, rng: D.rng(seed * 104729 + t) }); W = r.W; prev = p; } return { W, prev }; }
function run(base, area, form, mode) {
  let w = clone(base.W), pr = base.prev; w.flags.y2Build = { area, form, at: w.t, staff: 'hire' }; completeFx(w);
  const st = w.stores[1];
  const info = { R1: +w.stores[0].R.toFixed(2), A1: +(w.stores[0].A || 0).toFixed(2), L1: +(w.stores[0].L || 0).toFixed(1), R2: +st.R.toFixed(2) };
  if (mode === 'inheritRA') { st.R = w.stores[0].R; st.A = w.stores[0].A; }
  const op2 = [];
  for (let t = OPEN_T; t < OPEN_T + HORIZON; t++) { const p = pol1(w, pr); const r = Wd.month(w, p, { noise: false, noCards: true, rng: D.rng(base.W.seed * 104729 + t) }); w = r.W; pr = p; const b = r.res.stores && r.res.stores[1]; if (b && b.sales != null) op2.push(Math.round(b.op)); }
  const fb = op2.findIndex((x) => x >= 0);
  return { loss8: op2.slice(0, 8).filter((x) => x < 0).length, firstBlack: fb < 0 ? null : fb + 1, info };
}
const med = (a) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); if (!b.length) return null; return b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2; };
const res = { base: [], inheritRA: [] }; const infos = [];
for (let seed = 0; seed <= 9; seed++) {
  const base = warm(seed);
  for (const area of ['shotengai', 'ekimae', 'jutaku']) for (const form of ['part1', 'part2']) for (const mode of ['base', 'inheritRA']) { const r = run(base, area, form, mode); res[mode].push(r); if (mode === 'base' && area === 'shotengai' && form === 'part1') infos.push({ seed, ...r.info }); }
}
console.log('開店の月（t=19）の1号店と2号店の評判（R）・認知（A）・常連（L。1号店）：' + infos.map((x) => `seed${x.seed} R1=${x.R1} A1=${x.A1} L1=${x.L1} R2=${x.R2}`).join(' / '));
for (const m of ['base', 'inheritRA']) {
  const x = res[m];
  console.log(`${m === 'base' ? 'いまの式（2号店は R・A を初期値から）' : '2号店の R・A を開店の月の1号店にそろえる'}［家族を除く60組・何もしない］：8か月全部赤字 ${x.filter((r) => r.loss8 === 8).length}/${x.length}、8か月の赤字の月 ${x.reduce((s, r) => s + r.loss8, 0)}/${x.length * 8}、初めて黒字の中央値 ${med(x.map((r) => r.firstBlack))}（来ない ${x.filter((r) => r.firstBlack == null).length}/${x.length}）`);
}
