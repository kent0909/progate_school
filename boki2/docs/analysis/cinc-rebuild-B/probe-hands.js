#!/usr/bin/env node
// 担当B：作戦の机の手を1つずつ動かすと、その月（と3か月後）の数字が動くかを、ゲームの純粋関数（world.month）で確かめる。
// 画面の「試算」（ramen-view.js の RV.trial）と同じ式。乱数なし・札なしで、手だけを変えた差を出す。
// 使い方：node probe-hands.js [--t 14] [--seed 0]
'use strict';
global.window = global;
const path = require('path');
const B = path.resolve(__dirname, '../../..');
const STORY = require(path.join(B, 'tools/ramen-files.js')).story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY].forEach(f => require(path.join(B, f)));
const D = window.SIMDATA, Wd = D.world;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? Number(process.argv[i + 1]) : d; };
const T = arg('--t', 14), seed = arg('--seed', 0);
let W = Wd.create({ seed, area: 'shotengai', form: 'part1' });
let prev = null;
for (let t = 0; t < T; t++) { const p = { ...Wd.policy0(W, prev) }; const r = Wd.month(W, p, { noise: false, noCards: true, noFactors: true }); W = r.W; prev = p; }
const base = Wd.policy0(W, prev);
const run = (pol, n) => { let x = W, s = { op: 0, cash0: W.cash, R: 0, L: 0, N: 0 }; let first; for (let k = 0; k < n; k++) { const r = Wd.month(x, k ? { ...pol, tweak: false, limited: false } : pol, { noise: false, noCards: true, noFactors: true }); if (!k) first = r.res; s.op += r.res.op; x = r.W; } return { first, op: s.op, cash: x.cash - W.cash, R: x.stores[0].R, L: x.stores[0].L }; };
const b1 = run(base, 1), b3 = run(base, 3), b12 = run(base, 12);
const HANDS = { price: [-100, -50, 50, 100].map(d => ['price', base.price + d, `${d > 0 ? '+' : ''}${d}円`]), prep: ['low', 'high'].map(v => ['prep', v, v]), parts: [-1, 1].map(d => ['parts', base.parts + d, `人${d > 0 ? '+' : ''}${d}`]), supplier: ['cheap', 'high'].map(v => ['supplier', v, v]),
  flyer: [30000, 100000].map(v => ['flyer', v, `チラシ${v / 10000}万`]), coupon: [['coupon', true, 'クーポン']], sns: [['sns', true, 'SNS']], line: [['line', !base.line, 'LINE切替']], map: [['map', !base.map, '地図切替']], forecast: [['forecast', true, '予報']], haccp: [['haccp', !base.haccp, '衛生切替']], inspect: [['inspect', true, '検品']], tweak: [['tweak', true, '手直し']] };
const rows = [];
const r1 = n => Math.round(n);
for (const [hand, list] of Object.entries(HANDS)) for (const [k, v, label] of list) {
  const pol = Wd.fitTime(W, { ...base, [k]: v }, D.rng(1));
  if (pol[k] !== v) { rows.push({ hand, label, note: '時間の予算で外れた' }); continue; }
  const a1 = run(pol, 1), a3 = run(pol, 3), a12 = run(pol, 12);
  rows.push({ hand, label, dSales1: r1(a1.first.sales - b1.first.sales), dOp1: r1(a1.first.op - b1.first.op), dCash1: r1(a1.cash - b1.cash), dOp3: r1(a3.op - b3.op), dOp12: r1(a12.op - b12.op), dR12: Math.round((a12.R - b12.R) * 100) / 100, dL12: Math.round((a12.L - b12.L) * 10) / 10 });
}
console.log(JSON.stringify({ seed, t: T, at: `${Math.floor(T / 12) + 1}年目${[4,5,6,7,8,9,10,11,12,1,2,3][T % 12]}月`, base: { price: base.price, parts: base.parts, supplier: base.supplier, op1: r1(b1.first.op) }, rows }, null, 1));
