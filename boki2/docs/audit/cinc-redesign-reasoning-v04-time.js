#!/usr/bin/env node
// 論証の検査役 R-D（版0.4 の検査）：Q2 (f)「b.5 の線を15〜18時間に直す」の反対の結論を数で組む。
// 設計者の cinc-redesign-time.js v04 と同じ式・同じ秒の置き値（書類45秒・重い判断60秒・軽い判断15秒・月報と締め90秒・新聞・枠の行10秒・
// 一括確定15秒・点検3秒/枚・決算10分・静かな月3.42分）をそのまま使い、秒は1つも動かさない。動かすのは設計の仕組み（数の目安）だけ：
//   G1 重い判断の帯：設計書 T7.2-1 の目安【置き値】は 1年目0.2→3年目0.8→5年目1.2→10年目1.5。これを「5年目以降 1.0 で頭打ち」にする（帯は設計の目標で、測った数ではない）
//   G2 点検の抜き打ち：PEDAGOGY 1.6「監査が条件の外の取引を仕込む」を、一括確定の全部を目で追う形でなく、月に1回「仕込まれた疑わしい行5枚」を見せる形にする（3秒×5）
//   G3 4年目以降の書類の増え：設計者の置き値「+1.5枚/年」を、降ろす仕組み（支店の月報は型で一括）の上で「+0.75枚/年」にする（増えるのは一括確定の側で、手で書く枚数は同じ）
// 設計者の組 D＋点検（推奨 (f) の土台）と並べ、静かな月の重み w＝0.6〜0.7（推奨 (f) と同じ頻度）で1周の時間を出す。
'use strict';
const Y = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const lerp = (y, pts) => { const ks = Object.keys(pts).map(Number).sort((a, b) => a - b); for (let i = 0; i < ks.length - 1; i++) if (y >= ks[i] && y <= ks[i + 1]) { const a = ks[i], b = ks[i + 1]; return pts[a] + ((pts[b] - pts[a]) * (y - a)) / (b - a); } return pts[ks[ks.length - 1]]; };
const light = (y) => lerp(y, { 1: 7, 3: 6, 5: 5, 10: 4 });
const stores = (y) => lerp(y, { 1: 1, 2: 1, 3: 2, 5: 5, 10: 10 });
const news = (y) => (y < 3 ? 0 : y < 5 ? 40 : 60);
const QUIET = (1 * 45 + 2 * 15 + 90 + 40) / 60, KESSAN = 10;
function month(y, o) {
  const grow = o.g3 ? 0.75 : 1.5;
  const d = y === 1 ? 6.9 : y === 2 ? 9.0 : y === 3 ? 10.6 : 10.6 + grow * (y - 3);
  const cap = y <= 3 ? 5 : y === 4 ? 4 : 3, hand = Math.min(d, cap), bulk = d - hand;
  const heavy = o.g1 ? Math.min(lerp(y, { 1: 0.2, 3: 0.8, 5: 1.2, 10: 1.5 }), y >= 5 ? 1.0 : 9) : lerp(y, { 1: 0.2, 3: 0.8, 5: 1.2, 10: 1.5 });
  const scan = o.g2 ? 3 * Math.min(bulk, 5) : 3 * bulk;
  const framed = y >= 3 ? Math.max(0, stores(y) - 1) : 0;
  return (hand * 45 + (bulk > 0 ? 15 : 0) + scan + heavy * 60 + light(y) * 15 + 90 + news(y) + framed * 0.3 * 10) / 60;
}
const binom = (n, k, p) => { let c = 1; for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1); return c * Math.pow(p, k) * Math.pow(1 - p, n - k); };
function dist(o, w) {
  let pd = new Map([[0, 1]]);
  for (const y of Y) {
    const m = month(y, o), base = 12 * m + KESSAN, save = m - QUIET, nx = new Map();
    for (const [v, p] of pd) for (let k = 0; k <= (y >= 4 ? 7 : 0); k++) { const pk = y >= 4 ? binom(7, k, w) : 1; const key = Math.round((v + base - k * save) * 100) / 100; nx.set(key, (nx.get(key) || 0) + p * pk); }
    pd = nx;
  }
  const arr = [...pd.entries()].map(([v, p]) => [v / 60, p]);
  return { mean: arr.reduce((s, [v, p]) => s + v * p, 0), le15: arr.filter(([v]) => v <= 15).reduce((s, [, p]) => s + p, 0) };
}
const SETS = [['D＋点検（設計者の推奨 (f) の土台。検算）', {}], ['G1 重い判断を5年目から1.0で頭打ち', { g1: 1 }], ['G2 点検を抜き打ち5枚に', { g2: 1 }], ['G3 書類の増えを +0.75枚/年', { g3: 1 }], ['G1＋G2', { g1: 1, g2: 1 }], ['G1＋G2＋G3', { g1: 1, g2: 1, g3: 1 }]];
for (const [name, o] of SETS) {
  const r = [0.6, 0.65, 0.7].map((w) => { const d = dist(o, w); return `w=${w} 平均 ${d.mean.toFixed(2)}時間・15時間以内 ${Math.round(100 * d.le15)}%`; });
  console.log(`${name}：${r.join('／')}　10年目の1か月 ${month(10, o).toFixed(2)}分`);
}
