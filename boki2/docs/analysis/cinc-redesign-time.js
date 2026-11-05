#!/usr/bin/env node
// 設計者 W（DESIGN-CINC-REBUILD 版0.3）：1周（10期）の時間を、決算・新聞・枠の行・静かな月を入れて計り直す（J-D F6・R-D 2.6）。
// 1か月の分＝(手で書く書類×45秒＋一括確定の書類×8秒＋重い判断×60秒＋軽い判断×15秒＋月報と締め90秒＋新聞の読み＋枠の行×店の数)÷60。
// 決算の月は ＋決算の画面（DESIGN-RAMEN h.4 の締めの月 12〜16画面）＝ 10分【置き値】。静かな月は (1×45＋2×15＋90)÷60＝2.75分。
// 置き値：秒の数は版0.2 の T1 と同じ。新聞 40秒（4欄・1欄2〜3行。5年目から町の外の欄で 60秒）、枠の行 10秒/店、一括確定 8秒/枚。
// 書類の枚数の出どころ：J-B の道具の出力（上手の10周：判断の画面 1.83・1.88・2.00/月、判断1つあたりの書類 2.44・3.12・3.54）から
//   月の書類の画面 ≒（判断の画面＋作戦の机1）×判断1つあたりの書類 ＝ 6.9・9.0・10.6 枚（J-D F6 の近似）。4年目以降は3年目の 10.6 から
//   層が開くたびに +1.5枚/年【置き値】と置く（工場月報・支店の月報が足される向き：DESIGN-RAMEN h 結論「工場があれば +2〜3枚」）。
// 3つの組で比べる：
//   A 版0.2 の表（手で書く書類は5〜6枚の置き値のまま）に決算・新聞・枠の行を足す
//   B 書類は測った向き（増える）のまま、降ろす仕組みなし
//   C 書類は測った向きのまま、降ろす仕組み（自動仕訳で手で書く書類を「新しい論点の書類2＋？の行2＋抜き打ち1＝5枚」に止め、残りは一括確定）
// どの組にも静かな月 q か月/年（4年目以降）を 0〜6 で振り、1周が DESIGN-RAMEN b.5 の 10〜15時間に入る q を出す。
'use strict';
const Y = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const docsMeasured = (y) => (y === 1 ? 6.9 : y === 2 ? 9.0 : y === 3 ? 10.6 : 10.6 + 1.5 * (y - 3));
const lerp = (y, pts) => { const ks = Object.keys(pts).map(Number).sort((a, b) => a - b); for (let i = 0; i < ks.length - 1; i++) if (y >= ks[i] && y <= ks[i + 1]) { const a = ks[i], b = ks[i + 1]; return pts[a] + ((pts[b] - pts[a]) * (y - a)) / (b - a); } return pts[ks[ks.length - 1]]; };
const heavy = (y) => lerp(y, { 1: 0.2, 3: 0.8, 5: 1.2, 10: 1.5 });
const light = (y) => lerp(y, { 1: 7, 3: 6, 5: 5, 10: 4 });
const stores = (y) => lerp(y, { 1: 1, 2: 1, 3: 2, 5: 5, 10: 10 }); // 1章の表の店の数の目安
const news = (y) => (y < 3 ? 0 : y < 5 ? 40 : 60);
function month(y, set) {
  let hand, bulk = 0;
  if (set === 'A') hand = lerp(y, { 1: 5, 3: 5, 5: 6, 10: 5 });
  else if (set === 'B') hand = docsMeasured(y);
  else if (set === 'C') { const d = docsMeasured(y); hand = Math.min(d, 5); bulk = d - hand; }
  else { const d = docsMeasured(y); hand = Math.min(d, y <= 3 ? 5 : y === 4 ? 4 : 3); bulk = d - hand; }
  const framed = y >= 3 ? Math.max(0, stores(y) - 1) : 0; // 任せた店の枠の行
  // D：降ろす仕組みを強めた組。手で書く書類は 5→4→3枚（DESIGN-RAMEN h 結論の3〜6枚の下の端へ）、一括確定は1回の押下で15秒（枚数によらない）、
  //    枠の行は外れた店だけ（T4.4。外れる店の割合 30%【置き値】）
  if (set === 'D') return (hand * 45 + (bulk > 0 ? 15 : 0) + heavy(y) * 60 + light(y) * 15 + 90 + news(y) + framed * 0.3 * 10) / 60;
  return (hand * 45 + bulk * 8 + heavy(y) * 60 + light(y) * 15 + 90 + news(y) + framed * 10) / 60;
}
// 静かな月（版0.3）：PEDAGOGY 1.1 L42「新しい判断が要るイベントは1〜3件」の下の端を守り、新しい判断は新聞の印の記事から1件（15秒）＋作戦の机の「前月のまま」（15秒）、書類1枚、月報と締め、新聞の見出し40秒
const QUIET = (1 * 45 + 2 * 15 + 90 + 40) / 60;
const KESSAN = 10;
const out = [];
out.push('1か月の分（静かな月でない月）：年／A／B／C／D');
for (const y of Y) out.push(`  ${y}年目：${month(y, 'A').toFixed(2)}／${month(y, 'B').toFixed(2)}／${month(y, 'C').toFixed(2)}／${month(y, 'D').toFixed(2)}`);
out.push(`静かな月 ${QUIET.toFixed(2)}分、決算 ${KESSAN}分/年`);
for (const set of ['A', 'B', 'C', 'D']) {
  const row = [];
  for (let q = 0; q <= 6; q++) { let min = 0; for (const y of Y) { const qq = y >= 4 ? q : 0; min += (12 - qq) * month(y, set) + qq * QUIET + KESSAN; } row.push(`q=${q}：${(min / 60).toFixed(2)}時間`); }
  out.push(`組 ${set}（4年目以降の静かな月 q か月/年）：${row.join('、')}`);
}
// 年ごとの1か月の分が PEDAGOGY 1.1 の5〜10分に入るか
for (const set of ['A', 'B', 'C', 'D']) out.push(`組 ${set}：10分を越える年 ${Y.filter((y) => month(y, set) > 10).join('・') || 'なし'}`);
console.log(out.join('\n'));
