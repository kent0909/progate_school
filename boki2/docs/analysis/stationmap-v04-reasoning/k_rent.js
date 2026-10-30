// BIZ-RENT23 2章「家賃は地価に比例しない（b≈0.25〜0.32）」の論証の検算。点は docs/analysis/rent23-land-match.out.txt の表をそのまま写した（家賃 円/坪・地価 万円/㎡）。
const A = [['銀座2', 52566, 1020], ['銀座3', 62621, 1168], ['銀座4', 50991, 5135], ['銀座5', 74169, 3435], ['銀座6', 85630, 3600], ['銀座7', 81298, 939], ['銀座8', 63666, 1520], ['歌舞伎町1', 68355, 1069], ['新宿2', 28208, 588], ['新宿3', 79352, 2110], ['新宿5', 34171, 352], ['西新宿1', 53690, 2330], ['南青山3', 49795, 1051], ['南青山5', 55231, 875], ['北青山3', 64535, 3260], ['神宮前1', 70277, 1865], ['神宮前3', 40185, 418], ['神宮前4', 46703, 2990], ['神宮前6', 77127, 998], ['西池袋1', 54291, 687], ['東池袋1', 54757, 1430], ['東池袋3', 19483, 257], ['南池袋1', 39432, 693], ['南池袋2', 29618, 557]];
const B = [['銀座', (23990 + 34830) / 2, 1475], ['新橋虎ノ門', (31069 + 29329) / 2, 1010], ['六本木', (29220 + 28049) / 2, 528], ['渋谷', (29151 + 31072) / 2, 985], ['原宿表参道', (33170 + 30120) / 2, 1040], ['恵比寿目黒中目黒', (28923 + 27734) / 2, 525], ['新宿', (23931 + 19937) / 2, 1050], ['池袋', (19867 + 19502) / 2, 358], ['上野浅草', (20177 + 16453) / 2, 248]];
function fit(P) { const x = P.map((p) => Math.log10(p[2])), y = P.map((p) => Math.log10(p[1])), n = x.length; const mx = x.reduce((a, b) => a + b) / n, my = y.reduce((a, b) => a + b) / n; let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; } const b = sxy / sxx, r = sxy / Math.sqrt(sxx * syy), a = my - b * mx; const res = y.map((v, i) => v - a - b * x[i]); const se = Math.sqrt(res.reduce((t, v) => t + v * v, 0) / (n - 2) / sxx); return { n, b, r, a, se, res, rev: b / (r * r) }; }
for (const [nm, P] of [['A', A], ['B', B]]) {
  const f = fit(P);
  console.log(`\n資料${nm}：n=${f.n} b=${f.b.toFixed(3)}（標準誤差 ${f.se.toFixed(3)}）r=${f.r.toFixed(2)}`);
  console.log(`  逆回帰（地価を家賃で説明して傾きを戻す＝地価の側の誤差がすべてのときの上限）b=${f.rev.toFixed(3)}。地価10倍で家賃 ${Math.pow(10, f.b).toFixed(2)}〜${Math.pow(10, f.rev).toFixed(2)}倍`);
  const loo = P.map((_, i) => fit(P.filter((__, j) => j !== i)).b); console.log(`  1点ずつ外したときの b：${Math.min(...loo).toFixed(3)}〜${Math.max(...loo).toFixed(3)}`);
  // いちばん低い地価の点の残差（下へ延ばす向きの手がかり）
  const idx = P.map((p, i) => [p[2], i]).sort((a, b) => a[0] - b[0]).slice(0, 3).map((x) => x[1]);
  console.log('  地価の低い3点の残差（式に対する実際の比）：' + idx.map((i) => `${P[i][0]} ${P[i][2]}万 ×${Math.pow(10, f.res[i]).toFixed(2)}`).join('・'));
  if (nm === 'A') { const ng = fit(P.filter((p) => !p[0].startsWith('銀座'))); console.log(`  銀座7点を外す：n=${ng.n} b=${ng.b.toFixed(3)} r=${ng.r.toFixed(2)} 逆回帰 ${ng.rev.toFixed(3)}`); const hi = fit(P.filter((p) => p[2] < 3000)); console.log(`  地価3000万未満だけ：n=${hi.n} b=${hi.b.toFixed(3)} r=${hi.r.toFixed(2)}`); }
}
// 比例（b=1）の式を、資料Bの地価1000万の点に合わせて引いたときの、候補地の段の代表値（72万・153万・448万・1560万）と、b=0.25 の式との比
for (const p of [30, 72, 153, 448, 1560, 3530]) console.log(`地価${p}万：b=0.25 → ${(28000 * Math.pow(p / 1000, 0.25)).toFixed(0)}円/坪・b=0.48（Bの逆回帰）→ ${(28000 * Math.pow(p / 1000, 0.48)).toFixed(0)}・b=0.71（Aの逆回帰）→ ${(28000 * Math.pow(p / 1000, 0.71)).toFixed(0)}`);
