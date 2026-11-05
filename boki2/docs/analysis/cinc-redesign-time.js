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
if (process.argv[2] !== 'v04' && process.argv[2] !== 'v05') { console.log(out.join('\n')); process.exit(0); }
// ■ 版0.4（J-D G4・G5、R-D Q2・Y7・T1-3）。置き値は回す前に決めた（この節を書いてから回した）：
//   SCAN 一括確定の点検：PEDAGOGY 1.6「監査が条件の外の取引を仕込む」を見つけるには一括確定の一覧を目で追う。1枚 3秒【置き値】（組 D の「1回の押下15秒」に足す）
//   H120 重い判断を 60秒→120秒（版0.3 は暗算で約16時間と書いた所を回す）
//   OVS  海外の1店を本編に（Q3b (b)）：9・10年目に、手で書く書類 +1（外貨建の換算）・一括確定 +1・新聞 +20秒・任せた店 +1【置き値】
//   静かな月は、骨のほかの7か月がそれぞれ重み w で静かになる（年に Bin(7, w) 回）。w ごとに、1周の時間の分布を年ごとの二項分布の畳み込みで出す
const out4 = [];
function month4(y, o) {
  const d = docsMeasured(y), hand = Math.min(d, y <= 3 ? 5 : y === 4 ? 4 : 3) + (o.ovs && y >= 9 ? 1 : 0), bulk = d - Math.min(d, y <= 3 ? 5 : y === 4 ? 4 : 3) + (o.ovs && y >= 9 ? 1 : 0);
  const framed = (y >= 3 ? Math.max(0, stores(y) - 1) : 0) + (o.ovs && y >= 9 ? 1 : 0);
  const hv = o.h120 ? 120 : 60;
  return (hand * 45 + (bulk > 0 ? 15 : 0) + (o.scan ? 3 * bulk : 0) + heavy(y) * hv + light(y) * 15 + 90 + news(y) + (o.ovs && y >= 9 ? 20 : 0) + framed * 0.3 * 10) / 60;
}
const total4 = (o, qOf) => { let m = 0; for (const y of Y) { const q = y >= 4 ? qOf(y) : 0; m += (12 - q) * month4(y, o) + q * QUIET + KESSAN; } return m / 60; };
const binom = (n, k, p) => { let c = 1; for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1); return c * Math.pow(p, k) * Math.pow(1 - p, n - k); };
function dist(o, w) {
  // 分（時間×60）の分布を年ごとに畳み込む。静かでない月の分の合計から、静かな月1回で減る分を引く
  let pd = new Map([[0, 1]]);
  for (const y of Y) {
    const base = 12 * month4(y, o) + KESSAN, save = month4(y, o) - QUIET; const nx = new Map();
    for (const [v, p] of pd) for (let k = 0; k <= (y >= 4 ? 7 : 0); k++) { const pk = y >= 4 ? binom(7, k, w) : 1; const key = Math.round((v + base - k * save) * 100) / 100; nx.set(key, (nx.get(key) || 0) + p * pk); }
    pd = nx;
  }
  const arr = [...pd.entries()].map(([v, p]) => [v / 60, p]).sort((a, b) => a[0] - b[0]);
  const mean = arr.reduce((s, [v, p]) => s + v * p, 0), le15 = arr.filter(([v]) => v <= 15).reduce((s, [, p]) => s + p, 0);
  let acc = 0, p10 = null, p90 = null; for (const [v, p] of arr) { acc += p; if (p10 == null && acc >= 0.1) p10 = v; if (p90 == null && acc >= 0.9) p90 = v; }
  return { mean, le15, p10, p90 };
}
const SETS4 = [['D（版0.3 の推奨の組）', {}], ['D＋一括確定の点検 3秒/枚', { scan: 1 }], ['D＋点検＋重い判断120秒', { scan: 1, h120: 1 }], ['D＋点検＋海外の1店（Q3b (b)）', { scan: 1, ovs: 1 }], ['D＋点検＋重い判断120秒＋海外', { scan: 1, h120: 1, ovs: 1 }]];
out4.push('版0.4：1周の時間（4年目から静かな月 q 回/年、整数で）');
for (const [name, o] of SETS4) out4.push(`  ${name}：${[0, 3, 4, 5, 6, 7].map((q) => `q=${q} ${total4(o, () => q).toFixed(2)}`).join('、')}時間　10年目の1か月 ${month4(10, o).toFixed(2)}分`);
out4.push('版0.4：静かな月の重み w（骨のほかの7か月がそれぞれ w で静か。年に平均 7w 回）ごとの1周の時間の分布（平均・下10%・上10%・15時間以内に入る割合）');
for (const [name, o] of SETS4) out4.push(`  ${name}：` + [0.6, 0.65, 0.7, 0.72, 0.8, 0.9].map((w) => { const r = dist(o, w); return `w=${w}（年${(7 * w).toFixed(1)}回）平均 ${r.mean.toFixed(2)}・${r.p10.toFixed(2)}〜${r.p90.toFixed(2)}・15時間以内 ${Math.round(100 * r.le15)}%`; }).join('／'));
out4.push(`海外の1店で増える分（D＋点検、q=5）：${(total4({ scan: 1, ovs: 1 }, () => 5) - total4({ scan: 1 }, () => 5)).toFixed(2)}時間`);
if (process.argv[2] === 'v04') { console.log(out4.join('\n')); process.exit(0); }
// ■ 版0.5（R-D v04 Q2・Y7・A24 不当、J-D v04 H3）。置き値は回す前に決めた（この節を書き、件名に「事前登録」と入れて commit してから回した）。秒は v04 のまま1つも動かさない。
//   G1 重い判断の帯を5年目から1.0で頭打ち（R-D の v04-time.js と同じ。帯は T7.2-1 の目標の置き値）
//   G2 点検を月に1回の抜き打ち5枚に（R-D と同じ。3秒×min(一括確定の枚数, 5)）
//   OVS 海外の1店を本編に（v04 と同じ：手で書く +1・一括確定 +1・新聞 +20秒・任せた店 +1）／OVSL 海外の1店を方針の札で任せる（手で書く +0。換算は枠の行の1行：一括確定 +1・新聞 +20秒・任せた店 +1）
//   H120 重い判断120秒
//   全案（(f) の土台＝D＋点検、(g)＝G1＋G2）を、Q3b の推奨（海外）と重い判断120秒の組み合わせで比べる。w は 0.6・0.65・0.7（年4.2〜4.9回）
function month5(y, o) {
  const d = docsMeasured(y), cap = y <= 3 ? 5 : y === 4 ? 4 : 3, ov = (o.ovs || o.ovsl) && y >= 9;
  const hand = Math.min(d, cap) + (o.ovs && y >= 9 ? 1 : 0), bulk = d - Math.min(d, cap) + (ov ? 1 : 0);
  const framed = (y >= 3 ? Math.max(0, stores(y) - 1) : 0) + (ov ? 1 : 0);
  const hv = (o.h120 ? 120 : 60) * (o.g1 ? Math.min(heavy(y), y >= 5 ? 1.0 : 9) : heavy(y));
  const scan = 3 * (o.g2 ? Math.min(bulk, 5) : bulk);
  return (hand * 45 + (bulk > 0 ? 15 : 0) + scan + hv + light(y) * 15 + 90 + news(y) + (ov ? 20 : 0) + framed * 0.3 * 10) / 60;
}
function dist5(o, w) {
  let pd = new Map([[0, 1]]);
  for (const y of Y) { const m = month5(y, o), base = 12 * m + KESSAN, save = m - QUIET, nx = new Map(); for (const [v, p] of pd) for (let k = 0; k <= (y >= 4 ? 7 : 0); k++) { const pk = y >= 4 ? binom(7, k, w) : 1; const key = Math.round((v + base - k * save) * 100) / 100; nx.set(key, (nx.get(key) || 0) + p * pk); } pd = nx; }
  const arr = [...pd.entries()].map(([v, p]) => [v / 60, p]).sort((a, b) => a[0] - b[0]);
  let acc = 0, p90 = null; for (const [v, p] of arr) { acc += p; if (p90 == null && acc >= 0.9) p90 = v; }
  return { mean: arr.reduce((s, [v, p]) => s + v * p, 0), le15: arr.filter(([v]) => v <= 15).reduce((s, [, p]) => s + p, 0), p90 };
}
const out5 = ['版0.5：全案の1周の時間（w＝0.6／0.65／0.7 の平均・上10%・15時間以内）と10年目の1か月'];
for (const [bn, bo] of [['(f) の土台 D＋点検', {}], ['(g) G1＋G2', { g1: 1, g2: 1 }]]) for (const [an, ao] of [['', {}], ['＋海外', { ovs: 1 }], ['＋海外（方針の札で任せる）', { ovsl: 1 }], ['＋重い判断120秒', { h120: 1 }], ['＋海外＋重い判断120秒', { ovs: 1, h120: 1 }], ['＋海外（任せる）＋重い判断120秒', { ovsl: 1, h120: 1 }]]) {
  const o = { ...bo, ...ao };
  out5.push(`  ${bn}${an}：` + [0.6, 0.65, 0.7].map((w) => { const r = dist5(o, w); return `w=${w} 平均 ${r.mean.toFixed(2)}・上10% ${r.p90.toFixed(2)}・15時間以内 ${Math.round(100 * r.le15)}%`; }).join('／') + `　10年目の1か月 ${month5(10, o).toFixed(2)}分`);
}
console.log(out5.join('\n'));
