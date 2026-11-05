#!/usr/bin/env node
// J-B：sim-check --ramen の「詰み 1.7%」の切り分け。tools/sim-ramen.js の「3. 無作為の通し」と同じ読み込み・同じ手（widePolicy）・同じ判定（rescueFails）を
// ここに写して、詰みだけを数える（ゲームと道具のファイルは変えない。sim-ramen.js は読み込まずに、同じ手順をこのファイルに書いた）。
// 加えて、①どの seed が詰んだか ②詰みの判定から短期借入（画面で押せない手）を外すと何%か ③詰んだ周が本当に倒産したか、を出す。
// 使い方：node cinc-rebuild-B-fact-stuck.js [--runs 300]
'use strict';
global.window = global;
const path = require('path');
const root = path.resolve(__dirname, '../..');
const STORY = require(path.join(root, 'tools/ramen-files.js')).story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA, Wd = D.world, BW = D.bowl, CD = D.cards, C = D.coef;
const RUNS = (() => { const i = process.argv.indexOf('--runs'); return i > 0 ? +process.argv[i + 1] : 300; })();
// sim-ramen.js と同じ「旧比較」の準備（新札を止め、3札の旧条件、共有乱数）
const legacyDeck = CD.deck.filter(c => !c.y2); CD.deck.splice(0, CD.deck.length, ...legacyDeck);
for (const id of ['maintain', 'ev_summer', 'bowl_limited']) { const card = CD.byId[id], cur = card.when; card.when = W => cur({ ...W, t: Math.min(W.t, 11) }); }
D.y2.stream = null;
const AREAS = ['shotengai', 'ekimae', 'jutaku'];
function widePolicy(W, rng, prev, hold = 8) { // sim-ramen.js:72〜85 と同じ
  const p = Wd.policy0(W, prev);
  if (W.t % 12 === 0) p.price = 700 + 50 * Math.floor(rng() * 7);
  p.prep = ['low', 'mid', 'high'][Math.floor(rng() * 3)];
  p.flyer = 10000 * Math.floor(rng() * 11);
  p.coupon = rng() < 0.1; p.line = rng() < 0.4;
  for (const k of ['forecast', 'map', 'sns', 'haccp', 'inspect']) p[k] = rng() < 0.6;
  p.tweak = rng() < 0.15;
  if (W.t % hold === 0) p.parts = Math.floor(rng() * 5);
  p.borrow = rng() < 0.5 && W.cash < 300000;
  return Wd.fitTime(W, p, rng);
}
// rescueFails の写し。borrow を選べるようにする（world.js:436〜444 と同じ手順）
function rescueFails(W, n, borrow) {
  for (const d of [0, 100, -100]) {
    let x = W, dead = false;
    for (let k = 0; k < n; k++) { const p = Wd.policy0(x, null, { neutral: true }); p.price = W.stores[0].price + d; p.parts = 0; p.borrow = borrow; p.family = 0; p.flyer = 0; p.line = false; const r = Wd.month(x, p, { noise: false, noCards: true, noFactors: true }); x = r.W; if (x.cash < 0) { dead = true; break; } }
    if (!dead) return false;
  }
  return true;
}
function play(seed, onMonth) { // sim-ramen.js:100〜116 と同じ（13か月）
  const rng = D.rng(seed * 7919 + 13);
  let W = Wd.create({ seed, area: AREAS[seed % 3], form: 'part1', tier: 0, bowl: BW.presets[seed % 3].spec });
  let pol = null;
  for (let k = 0; k < 13; k++) {
    pol = widePolicy(W, rng, pol);
    const before = W; const r = Wd.month(W, pol, { rng: D.rng(seed * 104729 + k), noFactors: true });
    W = r.W; onMonth(before, pol, r, k); if (W.bankrupt) break;
  }
  return W;
}
const out = { runs: RUNS, stuckWithBorrow: [], stuckNoBorrow: [], realCheckIsSameAsMine: null, firstStuck: {} };
// 本物の rescueFails と私の写し（borrow=true）が同じ答えを出すかも数える
let agree = 0, compared = 0;
for (let s = 0; s < RUNS; s++) {
  let a = false, b = false;
  const W = play(s, (before, pol, r, k) => {
    if (r.W.cash >= 0 && !r.W.bankrupt) {
      if (!a) { const mine = rescueFails(r.W, 3, true), real = Wd.rescueFails(r.W, 3); compared++; if (mine === real) agree++; if (real) { a = true; out.firstStuck[s] = { k, cash: r.W.cash, parts: r.W.stores[0].parts, price: r.W.stores[0].price, short: r.W.short || 0 }; } }
      if (!b && rescueFails(r.W, 3, false)) b = true;
    }
  });
  if (a) { out.stuckWithBorrow.push(s); out.firstStuck[s].bankruptAtEnd = !!W.bankrupt; out.firstStuck[s].endT = W.t; }
  if (b) out.stuckNoBorrow.push(s);
}
out.realCheckIsSameAsMine = `${agree}/${compared}`;
out.pctWithBorrow = Math.round(1000 * out.stuckWithBorrow.length / RUNS) / 10;
out.pctNoBorrow = Math.round(1000 * out.stuckNoBorrow.length / RUNS) / 10;
out.first60WithBorrow = out.stuckWithBorrow.filter(s => s < 60);
console.log(JSON.stringify(out, null, 1));
