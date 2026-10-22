#!/usr/bin/env node
// BIZ-FUNVISUAL 版0.2 の優先順（docs/analysis/funvisual-priority.js）の感度分析。論証検査役が書いた（docs/audit/BIZ-FUNVISUAL-reasoning.md 10章）。
// 使い方：node boki2/docs/analysis/funvisual-priority-sensitivity.js
// 書き手のスクリプトの items をそのまま読み込み（書き換えない）、
//  (1) 見立ての d・e を各項目 ±1（0〜2 に収める）で無作為に動かす
//  (2) 式の重み（a・b の上限・c の割る数・d と e の重み）を格子で動かす
//  (3) 声と鎖の割り当てを、検査役が疑った所だけ変える
// のそれぞれで、順位の上位3つがどれだけ動くかを数える。
'use strict';
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'funvisual-priority.js'), 'utf8');
const m = src.match(/const items = (\[[\s\S]*?\n\]);/);
const items = Function('"use strict"; return ' + m[1])();
const short = ['外の事業', '絵', '一杯', '段', '毎回変わる', '出来事', '客', '品目', '設計の言語', '一覧', '固有', '相場', 'のんびり', '判定', '寄り道', '飾り', '数字'];
const key = (it) => {
  if (it.n.startsWith('店の外')) return '外の事業';
  if (it.n.startsWith('店・一杯・客')) return '絵';
  if (it.n.startsWith('一杯の組み立て')) return '一杯';
  if (it.n.startsWith('段の目標')) return '段';
  if (it.n.startsWith('毎回変わる')) return '毎回変わる';
  if (it.n.startsWith('両方向')) return '出来事';
  if (it.n.startsWith('客の個性')) return '客';
  if (it.n.startsWith('品目')) return '品目';
  if (it.n.startsWith('設計の言語')) return '設計の言語';
  if (it.n.startsWith('全店')) return '一覧';
  if (it.n.startsWith('題材')) return '固有';
  if (it.n.startsWith('共有')) return '相場';
  if (it.n.startsWith('のんびり')) return 'のんびり';
  if (it.n.startsWith('判定')) return '判定';
  if (it.n.startsWith('寄り道')) return '寄り道';
  if (it.n.startsWith('飾り')) return '飾り';
  if (it.n.startsWith('数字')) return '数字';
  return it.n;
};
const base = items.map((it) => ({ k: key(it), a: it.chains.length, b: it.src.length, c: Object.values(it.voices).reduce((s, v) => s + v, 0), d: it.d, e: it.e, voices: it.voices, chains: it.chains }));

function rank(rows, w) {
  // w: {wa, bcap, cdiv, wd, we}
  const sc = rows.map((r) => ({ k: r.k, c: r.c, s: w.wa * r.a + Math.min(w.bcap, r.b) + (w.cdiv ? Math.floor(r.c / w.cdiv) : 0) + w.wd * r.d + w.we * r.e }));
  sc.sort((x, y) => y.s - x.s || y.c - x.c);
  return sc;
}
const W0 = { wa: 1, bcap: 8, cdiv: 25, wd: 2, we: 2 };
const top3 = (sc) => sc.slice(0, 3).map((x) => x.k);
const fmt = (sc, n = 6) => sc.slice(0, n).map((x, i) => `${i + 1}.${x.k}(${x.s})`).join(' ');

console.log('0) 書き手の式のまま：', fmt(rank(base, W0), 7));
const T0 = top3(rank(base, W0));

// ---- (1) d・e を ±1 で無作為に（乱数は種つきで再現できる）----
let seed = 20261022;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const N = 20000;
const inTop3 = {}; const first = {}; let same3 = 0, sameSet = 0;
for (let t = 0; t < N; t++) {
  const rows = base.map((r) => ({ ...r, d: Math.max(0, Math.min(2, r.d + Math.floor(rnd() * 3) - 1)), e: Math.max(0, Math.min(2, r.e + Math.floor(rnd() * 3) - 1)) }));
  const sc = rank(rows, W0); const t3 = top3(sc);
  t3.forEach((k) => (inTop3[k] = (inTop3[k] || 0) + 1));
  first[sc[0].k] = (first[sc[0].k] || 0) + 1;
  if (t3.join() === T0.join()) same3++;
  if ([...t3].sort().join() === [...T0].sort().join()) sameSet++;
}
const pct = (x) => `${Math.round((100 * (x || 0)) / N)}%`;
console.log(`1) d・e を各項目 ±1 で無作為に ${N} 回：上位3つが順まで同じ ${pct(same3)}、顔ぶれが同じ ${pct(sameSet)}`);
console.log('   上位3つに入る割合：', Object.entries(inTop3).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v)}`).join('・'));
console.log('   1位になる割合：', Object.entries(first).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v)}`).join('・'));

// ---- (2) 式の重みの格子 ----
const grid = [];
for (const wa of [1, 2]) for (const bcap of [4, 8, 99]) for (const cdiv of [10, 25, 50, 0]) for (const wd of [0, 1, 2, 3]) for (const we of [0, 1, 2, 3]) grid.push({ wa, bcap, cdiv, wd, we });
const g3 = {}; const g1 = {}; let gSame = 0;
for (const w of grid) { const sc = rank(base, w); top3(sc).forEach((k) => (g3[k] = (g3[k] || 0) + 1)); g1[sc[0].k] = (g1[sc[0].k] || 0) + 1; if ([...top3(sc)].sort().join() === [...T0].sort().join()) gSame++; }
const gp = (x) => `${Math.round((100 * (x || 0)) / grid.length)}%`;
console.log(`2) 重みの格子 ${grid.length} 通り（a の重み1・2／b の上限4・8・なし／c を割る数10・25・50・使わない／d と e の重み0〜3）：上位3つの顔ぶれが同じ ${gp(gSame)}`);
console.log('   上位3つに入る割合：', Object.entries(g3).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${gp(v)}`).join('・'));
console.log('   1位になる割合：', Object.entries(g1).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${gp(v)}`).join('・'));
// 見立て（d・e）を使わない式
console.log('   d・e を使わない（a＋b＋⌊c/25⌋ だけ）：', fmt(rank(base, { ...W0, wd: 0, we: 0 }), 6));
console.log('   d・e を全項目1にそろえる：', fmt(rank(base.map((r) => ({ ...r, d: 1, e: 1 })), W0), 6));

// ---- (3) 割り当ての変更 ----
const variant = (name, f) => { const rows = base.map((r) => ({ ...r })); f(rows); rows.forEach((r) => { r.c = Object.values(r.voices).reduce((s, v) => s + v, 0); r.a = r.chains.length; }); console.log(`3) ${name}：`, fmt(rank(rows, W0), 6)); };
const get = (rows, k) => rows.find((r) => r.k === k);
variant('「外の事業」の声から W（やれることの多さ一般。109件の大半は店の中のやり込み）を外す', (rows) => { const r = get(rows, '外の事業'); r.voices = { ...r.voices }; delete r.voices.W; });
variant('W を外し、鎖 I（店の外が店を食う＝害の鎖）も外す', (rows) => { const r = get(rows, '外の事業'); r.voices = { ...r.voices }; delete r.voices.W; r.chains = r.chains.filter((c) => c !== 'I'); });
variant('W を「一杯」に移す（W の多くはトッピング・スープ・麺の組み合わせの多さ）', (rows) => { const r = get(rows, '外の事業'); r.voices = { ...r.voices }; delete r.voices.W; const s = get(rows, '一杯'); s.voices = { ...s.voices, W: 109 }; });
variant('「絵」の声から H3（操作・画面の分かりやすさ・テンポ）を外す', (rows) => { const r = get(rows, '絵'); r.voices = { ...r.voices }; delete r.voices.H3; });
variant('上の2つ（外の事業から W、絵から H3）を同時に', (rows) => { const r = get(rows, '外の事業'); r.voices = { ...r.voices }; delete r.voices.W; const s = get(rows, '絵'); s.voices = { ...s.voices }; delete s.voices.H3; });
variant('「段」の声から D3 のうち発展国++ の大賞（47件、カイロソフトの型）を外す', (rows) => { const r = get(rows, '段'); r.voices = { ...r.voices, D3: 12 }; });

// ---- (4) W を外した上で (1) と同じ揺らし ----
{
  const rowsW = base.map((r) => (r.k === '外の事業' ? { ...r, c: r.c - (r.voices.W || 0) } : { ...r }));
  seed = 20261022;
  const t3c = {}; const f1 = {};
  for (let t = 0; t < N; t++) {
    const rows = rowsW.map((r) => ({ ...r, d: Math.max(0, Math.min(2, r.d + Math.floor(rnd() * 3) - 1)), e: Math.max(0, Math.min(2, r.e + Math.floor(rnd() * 3) - 1)) }));
    const sc = rank(rows, W0);
    top3(sc).forEach((k) => (t3c[k] = (t3c[k] || 0) + 1));
    f1[sc[0].k] = (f1[sc[0].k] || 0) + 1;
  }
  console.log('4) W を外したうえで d・e を ±1：上位3つに入る割合：', Object.entries(t3c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v)}`).join('・'));
  console.log('   1位になる割合：', Object.entries(f1).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v)}`).join('・'));
  const g3w = {}; for (const w of grid) top3(rank(rowsW, w)).forEach((k) => (g3w[k] = (g3w[k] || 0) + 1));
  console.log('   W を外したうえで重みの格子：上位3つに入る割合：', Object.entries(g3w).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${gp(v)}`).join('・'));
}
