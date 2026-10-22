#!/usr/bin/env node
// BIZ-RAMEN 第4版の再検査（docs/audit/BIZ-RAMEN-v2-reasoning.md 16章）の検算。
// Usage: node boki2/docs/analysis/ramen-v4-recheck.js
// 置き値は boki2/docs/analysis/ramen-biz-counts.js 8・8b・8c・9節（第4版の書き手のもの）を写した。【検査役の仮定】は動かす幅。
'use strict';
const COGS = 0.32, UTIL = 0.07, K = 1 - COGS - UTIL;
const r1 = (x) => Math.round(x * 10) / 10;
const G = { name: '銀座の1階', rent: 34830 * 12, price: 1000, wage: 1300, other: 150000, days: 26, ph: 22 };
const R = { name: '地方の商店街', rent: 80000, price: 800, wage: 1000, other: 100000, days: 25, ph: 8 };
const profit = (s, cups, ph, own) => cups * s.days * s.price * K - s.rent - ph * s.wage * s.days - s.other - own;

console.log('## A. オーナーの2つの例を「同じ固定費の形」で試す（銀座100杯で赤字、地方30杯で採算）');
console.log('書き手の選び方：銀座は22人時を雇い店主の取り分30万円を引く → ' + Math.round(profit(G, 100, 22, 300000) / 1000) + '千円（赤字）。地方は人時0（家族で回す）・取り分0 → ' + Math.round(profit(R, 30, 0, 0) / 1000) + '千円（黒字）');
console.log('| 形（両方に同じ） | 銀座100杯 | 地方30杯 | 両方が成り立つ |');
console.log('|---|---|---|---|');
const shapes = [];
for (const ph of [0, 4, 8, 12, 16, 22]) for (const own of [0, 100000, 200000, 300000]) shapes.push([ph, own]);
let both = 0;
for (const [ph, own] of shapes) {
  const g = profit(G, 100, ph, own), r = profit(R, 30, ph, own);
  const ok = g < 0 && r >= 0; if (ok) both++;
  if (own === 0 || own === 300000) console.log(`| 人時${ph}・取り分${own / 10000}万 | ${Math.round(g / 1000)}千円 | ${Math.round(r / 1000)}千円 | ${ok ? 'はい' : 'いいえ'} |`);
}
console.log(`人時6通り×取り分4通り＝${shapes.length}通りのうち、両方が成り立つのは ${both} 通り（${r1(both / shapes.length * 100)}%）`);
// 値段・家賃も動かした格子（同じ人時・取り分を両方に）
let n = 0, nb = 0;
for (const ph of [0, 2, 4, 6, 8, 10, 12, 16, 22]) for (const own of [0, 50000, 100000, 150000, 200000, 300000])
  for (const gp of [617, 800, 1000, 1200]) for (const rp of [600, 700, 800, 900]) for (const gr of [0.8, 1, 1.2]) for (const rr of [0.5, 1, 1.5]) {
    n++;
    const g = profit({ ...G, price: gp, rent: G.rent * gr }, 100, ph, own), r = profit({ ...R, price: rp, rent: R.rent * rr }, 30, ph, own);
    if (g < 0 && r >= 0) nb++;
  }
console.log(`値段（銀座617〜1,200円・地方600〜900円）と家賃（銀座±20%・地方0.5〜1.5倍）も動かした ${n.toLocaleString()} 通り（人時と取り分は両方に同じ）：両方が成り立つ ${nb} 通り（${r1(nb / n * 100)}%）`);
// 店の大きさの違いを認めて、人時だけは立地ごとに書き手の値（銀座22・地方8）、取り分だけを両方に同じにした場合
for (const own of [0, 150000, 300000]) {
  const g = profit(G, 100, 22, own), r = profit(R, 30, 8, own);
  console.log(`人時は書き手の値（銀座22・地方8）、取り分を両方${own / 10000}万：銀座 ${Math.round(g / 1000)}千円・地方 ${Math.round(r / 1000)}千円 → 両方 ${g < 0 && r >= 0 ? '成り立つ' : '成り立たない'}`);
}

console.log('\n## B. 「家族で回す地方の30杯」の家族の時給');
const fam = profit(R, 30, 0, 0);
for (const [people, hours] of [[1, 8], [2, 8], [2, 10]]) {
  const h = people * hours * R.days;
  console.log(`店主と家族${people}人×1日${hours}時間×${R.days}日＝${h}時間 → 残り${Math.round(fam).toLocaleString()}円 ÷ ${h} ＝ 時給 ${Math.round(fam / h)} 円（置き値の地方の時給は1,000円）`);
}

console.log('\n## C. 「席は詰まらない」はピークの集まり方に頼るか（12席、稼働0.75、3回転/時）');
const seats = 12, perHour = seats * 0.75 * 3;
for (const base of [89, 100]) for (const lunchShare of [0.4, 0.5, 0.6, 0.7]) {
  const aug = base * (0.5 * 1.18 + 0.5 * 1.0); // 家族5割【書き手の置き値】
  const lunchDemand = aug * lunchShare, lunchCap = perHour * 2; // 昼のピーク2時間（11:30〜13:30）
  console.log(`平常${base}杯・8月${r1(aug)}杯・昼の2時間に${lunchShare * 100}%集まる → 昼の需要${r1(lunchDemand)}杯／昼の上限${lunchCap}杯 → ${lunchDemand > lunchCap ? '昼に詰まる' : '詰まらない'}`);
}
console.log('（書き手の9節は1日の需要を5時間分の上限135杯と比べ、ピークの中の集まりを見ていない。昼の割合は資料にない【検査役の仮定】）');

console.log('\n## D. 大型ロードサイドの分岐（8b節）の検算');
{
  const stores = 195, sales = 43000e6, labor = (13561e6 + 1396e6) / stores / 12, rent = 1046e6 / stores / 12;
  const otherSga = (403 + 382 + 664 + 4795) * 1e6 / stores / 12; // 広告・衛生・減価償却・その他
  const k = 1 - 13129 / 43000 - 2831 / 43000;
  for (const price of [900]) {
    const lo = (labor + rent) / (30.4 * price * (k - otherSga / (sales / stores / 12))), hi = (labor + rent + otherSga) / (30.4 * price * k);
    console.log(`人件費 月${Math.round(labor).toLocaleString()}・家賃 月${Math.round(rent).toLocaleString()}・その他の販管費 月${Math.round(otherSga).toLocaleString()}円、客単価${price}円：分岐 ${Math.round(lo)}（その他を変動）〜${Math.round(hi)}（全部固定）杯/日。実際 ${Math.round(sales / stores / 365 / price)} 杯/日`);
  }
}
