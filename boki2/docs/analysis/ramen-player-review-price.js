// 遊ぶ人の目の確認（docs/audit/DESIGN-RAMEN-player-review.md 3章・n.16）のための粗い検算。
// d.2 の値段の項 exp(-ε·ln(p/p_ref)) だけを残し（取り合い・入れ子・p_ref の動き・壁は入れない）、
// l.4 の置き値（1年目の平均の客数31人/日＝44×0.70、点数1.12、原価35%（850円のときの1杯の原価を固定）、
// パート1人・県庁所在地の商店街（家賃12万）、光熱 固定5万＋売上4%、その他固定費15万、上限70人/日）で、
// 「月の営業利益が最大になる値段」を ε ごとに出す。式の全体ではないので向きを見るためだけの数。
const base = { n: 44 * 0.70, p0: 850, pts: 1.12, cogsPerBowl: 850 * 0.35, rent: 12, labor: 20, other: 15, utilFix: 5, utilRate: 0.04, cap: 70, days: 26 };
function month(p, eps, b = base) {
  const n = Math.min(b.n * Math.pow(p / b.p0, -eps), b.cap);
  const sales = n * b.days * p * b.pts / 1e4; // 万円
  const cogs = n * b.days * b.cogsPerBowl * b.pts / 1e4;
  const op = sales - cogs - b.rent - b.labor - b.other - b.utilFix - sales * b.utilRate;
  return { n, sales, op };
}
console.log('ε | 850円の月の営業利益 | 最も良い値段 | そのときの客数/日 | 月の営業利益 | 850円との差');
for (const eps of [1.0, 1.25, 1.5, 1.54, 1.75, 2.0, 2.5]) {
  let best = null;
  for (let p = 500; p <= 1200; p += 10) { const m = month(p, eps); if (!best || m.op > best.op) best = { p, ...m }; }
  const at = month(850, eps);
  console.log(`${eps} | ${at.op.toFixed(1)}万 | ${best.p}円 | ${best.n.toFixed(0)} | ${best.op.toFixed(1)}万 | ${(best.op - at.op >= 0 ? '+' : '') + (best.op - at.op).toFixed(1)}万`);
}
// 損益が動かない ε（ラーナーの式：(p−c)/p＝1/ε。c は売上に対する原価と光熱の変動分の合計）
const varRate = 0.35 + base.utilRate;
console.log(`850円が最も良くなる ε（ラーナーの式、変動費率 ${varRate.toFixed(2)}）≒ ${(1 / (1 - varRate)).toFixed(2)}`);
// 魅力 F の効き（d.2 の 0.30·ln F）。段0（半分）と基準で、12か月手を入れないとき
for (const [name, rate] of [['段0（−0.75%/月）', 0.0075], ['基準（−1.5%/月）', 0.015]]) {
  const F = Math.pow(1 - rate, 12);
  console.log(`${name}：12か月後の F ${F.toFixed(3)}、客数への効き ${(100 * (Math.exp(0.30 * Math.log(F)) - 1)).toFixed(1)}%（31人/日なら ${(31 * (Math.exp(0.30 * Math.log(F)) - 1)).toFixed(1)}人/日）`);
}
for (const [name, F] of [['手直し +0.05', 1.05], ['手直し +0.10／限定 +0.1', 1.10], ['下限 0.6', 0.6]]) {
  console.log(`${name}：客数への効き ${(100 * (Math.exp(0.30 * Math.log(F)) - 1)).toFixed(1)}%`);
}
