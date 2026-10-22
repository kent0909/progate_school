#!/usr/bin/env node
// BIZ-RAMEN 第3版 13.2「立地の型ごとの損益分岐の杯数」の感度分析（論証検査役。docs/audit/BIZ-RAMEN-v2-reasoning.md 15章）。
// Usage: node boki2/docs/analysis/ramen-v3-sensitivity.js
// 置き値は boki2/docs/analysis/ramen-biz-counts.js 8節（第3版の書き手のもの）をそのまま写した。
// 確かめること：(1)「家賃より人時が分岐を動かす」は置き値の割合の産物か (2) 立地の順位（地方の商店街が最も低い・銀座の1階が小さな店で最も高い・大型ロードサイドが最も高い）は置き値を動かしても保たれるか
// (3)「銀座の1階は100杯でも取り分30万を払うと赤字」「地方の商店街は30杯でほぼとんとん」はどれほど置き値に頼るか
// 乱数は種つき（同じ数が出る）。【検査役の仮定】＝置き値を動かす幅。
'use strict';
const COGS = 0.32, UTIL = 0.07;
const yamaRent = 1046e6 / 195 / 12;
// [名前, 家賃/月, 家賃が資料か, 席, 客単価, 人時/日, 時給, その他の固定費/月, 営業日]
const T = [
  ['銀座の1階', 34830 * 12, true, 14, 1000, 22, 1300, 150000, 26],
  ['駅前（9エリア中央値）', 27500 * 10, true, 12, 900, 16, 1300, 150000, 26],
  ['駅前（上野・浅草）', 19395 * 10, true, 12, 900, 16, 1300, 150000, 26],
  ['大型ロードサイド', yamaRent, true, 40, 900, 60, 1200, 300000, 30],
  ['ロードサイド個人店', 200000, false, 25, 850, 24, 1100, 150000, 26],
  ['地方の商店街', 80000, false, 10, 800, 8, 1000, 100000, 25],
  ['観光地', 200000, false, 15, 1000, 16, 1100, 150000, 25],
  ['学生街', 120000, false, 15, 800, 16, 1100, 120000, 25],
];
const be = (p, own = 0, cogs = COGS, util = UTIL) => (p.rent + p.ph * p.wage * p.days + p.other + own) / (p.days * p.price * (1 - cogs - util));
const obj = (t) => ({ name: t[0], rent: t[1], rentData: t[2], seats: t[3], price: t[4], ph: t[5], wage: t[6], other: t[7], days: t[8] });
const base = T.map(obj);
const r1 = (x) => Math.round(x * 10) / 10;

console.log('## 1. 置き値のままの分岐と、固定費の内訳（家賃と人件費の比）');
console.log('| 立地 | 分岐(取り分0) | 家賃 | 人件費 | 人件費÷家賃 | 家賃±50%の振れ | 人時±50%の振れ |');
console.log('|---|---|---|---|---|---|---|');
for (const p of base) {
  const labor = p.ph * p.wage * p.days;
  const sR = be({ ...p, rent: p.rent * 1.5 }) - be({ ...p, rent: p.rent * 0.5 });
  const sL = be({ ...p, ph: p.ph * 1.5 }) - be({ ...p, ph: p.ph * 0.5 });
  console.log(`| ${p.name} | ${r1(be(p))} | ${Math.round(p.rent).toLocaleString()} | ${Math.round(labor).toLocaleString()} | ${r1(labor / p.rent)} | ${r1(sR)} | ${r1(sL)} |`);
}
console.log('同じ±50%で動かすと、振れの大きさは「家賃と人件費のどちらが大きいか」だけで決まる（式が線形なので）。報告の「人時8〜24（±50%）が家賃±50%より大きい」は、置き値で人件費540,800円＞家賃275,000円としたことの言い換え');

console.log('\n## 2. 立地の間の差を何が作るか（1つの入力だけを8つの立地の中央値にそろえたとき、分岐の幅がどれだけ縮むか）');
const med = (a) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const range = (arr) => Math.max(...arr) - Math.min(...arr);
const smallIdx = base.map((p, i) => i).filter((i) => base[i].name !== '大型ロードサイド');
const show = (label, ps) => {
  const all = ps.map((p) => be(p)), small = smallIdx.map((i) => be(ps[i]));
  console.log(`| ${label} | ${r1(range(all))} | ${r1(range(small))} | ${r1(Math.min(...small))}〜${r1(Math.max(...small))} |`);
};
console.log('| そろえた入力 | 8立地の分岐の幅 | 大型を除く7立地の幅 | 7立地の範囲 |');
console.log('|---|---|---|---|');
show('（そろえない）', base);
for (const k of ['rent', 'ph', 'price', 'wage', 'other', 'days']) {
  const m = med(base.map((p) => p[k]));
  show(`${k}＝中央値 ${Math.round(m).toLocaleString()}`, base.map((p) => ({ ...p, [k]: m })));
}
{ // 人件費（人時×時給）をまとめてそろえる
  const m = med(base.map((p) => p.ph * p.wage));
  show(`人時×時給＝中央値 ${Math.round(m)}`, base.map((p) => ({ ...p, ph: m / p.wage })));
}
console.log('幅が大きく縮む入力ほど、立地の間の差を作っている（置き値の上で）');

console.log('\n## 3. 名目の置き値を変えたときの順位（小さな店7立地、分岐の低い順）');
const order = (ps) => smallIdx.map((i) => [ps[i].name, be(ps[i])]).sort((a, b) => a[1] - b[1]).map(([n, v]) => `${n} ${r1(v)}`).join(' < ');
console.log(`置き値のまま：${order(base)}`);
const scen = [
  ['客単価を統計の銘柄の値段に（都心・駅前617円＝東京都区部、ほか591〜890円の中で地方700・観光地800・学生街650・ロードサイド700）', { '銀座の1階': { price: 617 }, '駅前（9エリア中央値）': { price: 617 }, '駅前（上野・浅草）': { price: 617 }, 'ロードサイド個人店': { price: 700 }, '地方の商店街': { price: 700 }, '観光地': { price: 800 }, '学生街': { price: 650 } }],
  ['地方の商店街も1日16人時（店主のほかに1人を8時間）', { '地方の商店街': { ph: 16 } }],
  ['地方の時給を最低賃金の水準1,000→1,050、都心1,300→1,226（東京の最低賃金の水準）', { '地方の商店街': { wage: 1050 }, '銀座の1階': { wage: 1226 }, '駅前（9エリア中央値）': { wage: 1226 }, '駅前（上野・浅草）': { wage: 1226 } }],
  ['賃料を2025年度下期（9エリア30,227円/坪、銀座の駅42,497円/坪）に', { '銀座の1階': { rent: 42497 * 12 }, '駅前（9エリア中央値）': { rent: 30227 * 10 } }],
  ['銀座の1階を8坪・人時16（小さな店）', { '銀座の1階': { rent: 34830 * 8, ph: 16 } }],
];
for (const [label, ch] of scen) {
  const ps = base.map((p) => ({ ...p, ...(ch[p.name] || {}) }));
  console.log(`- ${label}：${order(ps)}`);
}

console.log('\n## 4. 置き値を同時にばらつかせる（モンテカルロ 20,000回、種つき）');
let seed = 20261022;
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const U = (a, b) => a + (b - a) * rnd();
const N = 20000;
const cnt = { ruralLowest: 0, ginzaTopSmall: 0, bigTop: 0, laborGtRentStation: 0, laborGtRentAll: 0, ginza100Loss: 0, rural30AtLeastEven: 0, rural30Profit30: 0 };
const rankSum = {}; base.forEach((p) => { rankSum[p.name] = []; });
for (let n = 0; n < N; n++) {
  const cogs = U(0.30, 0.35), util = U(0.05, 0.09), wageF = U(0.9, 1.15);
  const ps = base.map((p) => ({
    ...p,
    rent: p.rent * (p.rentData ? U(0.85, 1.25) : U(0.5, 1.6)), // 資料のある家賃は狭く、仮定の家賃は広く【検査役の仮定】
    ph: p.ph * U(0.6, 1.5),
    wage: p.wage * wageF,
    price: p.price * U(0.75, 1.1), // 統計の銘柄の値段は置き値より低い向き（13.4）なので下に広く
    other: p.other * U(0.6, 1.5),
  }));
  const v = ps.map((p) => be(p, 0, cogs, util));
  const small = smallIdx.map((i) => v[i]);
  if (v[5] === Math.min(...small)) cnt.ruralLowest++;
  if (v[0] === Math.max(...small)) cnt.ginzaTopSmall++;
  if (v[3] === Math.max(...v)) cnt.bigTop++;
  const st = ps[1]; if (st.ph * st.wage * st.days > st.rent) cnt.laborGtRentStation++;
  if (ps.every((p) => p.ph * p.wage * p.days > p.rent)) cnt.laborGtRentAll++;
  const g = ps[0], profit = (p, k) => k * p.days * p.price * (1 - cogs - util) - p.rent - p.ph * p.wage * p.days - p.other;
  if (profit(g, 100) - 300000 < 0) cnt.ginza100Loss++;
  if (profit(ps[5], 30) >= 0) cnt.rural30AtLeastEven++;
  if (profit(ps[5], 30) >= 300000) cnt.rural30Profit30++;
  const sortedSmall = smallIdx.map((i) => [base[i].name, v[i]]).sort((a, b) => a[1] - b[1]);
  sortedSmall.forEach(([nm], k) => rankSum[nm].push(k + 1));
}
const pct = (x) => `${r1(x / N * 100)}%`;
console.log(`- 地方の商店街が7立地で最も低い：${pct(cnt.ruralLowest)}`);
console.log(`- 銀座の1階が7立地で最も高い：${pct(cnt.ginzaTopSmall)}`);
console.log(`- 大型ロードサイドが8立地で最も高い：${pct(cnt.bigTop)}`);
console.log(`- 駅前（中央値）で人件費＞家賃（＝人時±50%の振れ＞家賃±50%の振れ）：${pct(cnt.laborGtRentStation)}`);
console.log(`- 8立地のすべてで人件費＞家賃：${pct(cnt.laborGtRentAll)}`);
console.log(`- 銀座の1階は100杯でも取り分30万を払うと赤字：${pct(cnt.ginza100Loss)}`);
console.log(`- 地方の商店街は30杯で取り分0以上（とんとん以上）：${pct(cnt.rural30AtLeastEven)}／取り分30万を払って黒字：${pct(cnt.rural30Profit30)}`);
console.log('7立地の順位（1＝分岐が最も低い）の中央値と、5〜95%の幅：');
for (const nm of Object.keys(rankSum)) {
  const a = rankSum[nm]; if (!a.length) continue; a.sort((x, y) => x - y);
  console.log(`  - ${nm}: 中央値 ${a[Math.floor(a.length / 2)]}、${a[Math.floor(a.length * 0.05)]}〜${a[Math.floor(a.length * 0.95)]}`);
}

console.log('\n## 5. 大型ロードサイドの分岐177杯は何と比べるか');
const yamaSalesPerDay = 43000e6 / 195 / 365;
console.log(`山岡家の1店の売上 ÷ 365日 = 1日 ${Math.round(yamaSalesPerDay).toLocaleString()} 円 ÷ 客単価900円 = 約 ${Math.round(yamaSalesPerDay / 900)} 杯/日（置き値の客単価で割った目安）。分岐177杯の約 ${r1(yamaSalesPerDay / 900 / 177)} 倍。置き値の人時60/日は、24時間営業を1日2.5人で回す計算`);
