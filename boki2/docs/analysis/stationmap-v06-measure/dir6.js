// 検査⑩と 4.3 の「効きの向きの決まり」（版0.6）：基準の候補地（段3・〜500m・商店街、P 固定、参入なし）で、
// (1) ライバルを1軒足したときの自店の3年目の需要の変わり方。版0.6 の決まり：同じ型（平均の店に近い老舗）のほうが違う型より大きく減り、どちらも −5〜−40%
// (2) ライバルの値下げ（13か月目から値段を下げたまま）で自店の3年目の需要がどれだけ減るか（値下げ合戦の手応え）
// 版0.5 の dir5.js を写し、昼の重み L を基準の候補地の L（商店街の候補地の L の中央値。版0.6 の κ で決まる）にした。参考に L 0.5 と κ の両端も出す。
// 使い方：node dir6.js [置き値の上書きの JSON]
const L = require('./lib6.js');
const over = JSON.parse(process.argv[2] || '{}');
const cases = [['版0.6 の基準（κ0.6、基準の L＝商店街の中央）', {}], ['κ0.3', { kappa: 0.3 }], ['κ1.0', { kappa: 1.0 }], ['L0.5（参考：版0.5 の商店街の L）', { Lref: 0.5 }], ['昼夜を分けない（参考）', { split: false }]];
for (const [nm, o] of cases) {
  const P = L.params({ ...over, ...o, entry: false });
  const cal = L.calibrate(P);
  const run = (riv, hook) => L.runSite({ attr: 'shoten', Pabs: cal.Pref * cal.Fb, rivals: riv.map((t) => ({ type: t })), eps: cal.eps, rent: 12000, P, lam: 0, L: cal.Lref, hook });
  console.log(`\n== ${nm}（基準の L ${cal.Lref.toFixed(3)}・P_ref ${cal.Pref.toFixed(1)}）`);
  console.log('(1) 元の組 + 足す型 → 3年目の需要の変化（版0.6 の決まり：同じ型＝老舗が違う型より大きく減る・どちらも −5〜−40%）');
  for (const b of [[], ['shinise'], ['cheap'], ['cheap', 'shinise']]) {
    const y0 = run(b); const d = {};
    for (const t of ['shinise', 'cheap', 'kodawari']) { const y1 = run([...b, t]); d[t] = 100 * (y1.dem / y0.dem - 1); }
    const inRange = Object.values(d).every((v) => v <= -5 && v >= -40), order = d.shinise < d.cheap && d.shinise < d.kodawari;
    console.log(`  ${b.join('+') || '0軒'}（需要 ${y0.dem.toFixed(1)}）: 老舗(同じ型) ${d.shinise.toFixed(1)}%  安売り(違う型) ${d.cheap.toFixed(1)}%  こだわり(違う型) ${d.kodawari.toFixed(1)}%  → 幅 ${inRange ? '○' : '×'}・同じ型が最も大きく減る ${order ? '○' : '×'}`);
  }
  console.log('(2) ライバルの値下げ（13か月目から、下げたまま）→ 自店の3年目の需要の変化');
  for (const [b, who, to] of [[['cheap', 'shinise'], 'cheap', 600], [['cheap', 'shinise'], 'shinise', 750], [['shinise'], 'shinise', 750], [['kodawari'], 'kodawari', 1000], [['cheap', 'shinise'], 'shinise', 680]]) {
    const y0 = run(b); const idx = b.indexOf(who);
    const hook = (k, xl, xn) => { if (k === 12) for (const x of [xl, xn]) if (x) { const r = x.rivals.find((q) => q.id === 'r' + idx); if (r) r.price = to; } };
    const y1 = run(b, hook);
    console.log(`  ${b.join('+')} の ${who} が ${L.RV.TYPES[who].price}→${to}円：需要 ${y0.dem.toFixed(1)}→${y1.dem.toFixed(1)}（${(100 * (y1.dem / y0.dem - 1)).toFixed(1)}%）`);
  }
}
