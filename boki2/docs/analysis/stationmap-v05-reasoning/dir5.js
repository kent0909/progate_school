// 検査⑩と 4.3 の「効きの向きの決まり」：基準の候補地（段3・〜500m・商店街、P 固定、参入なし）で、
// (1) ライバルを1軒足したときの自店の3年目の需要の変わり方（同じ型 −20〜−35%・違う型 −5〜−15%）
// (2) ライバルの値下げ（13か月目から値段を下げたまま）で自店の3年目の需要がどれだけ減るか（値下げ合戦の手応え）
// を、相場の値段を固定（版0.5）と、いまの式（相場がライバルの値段の平均へ寄る）で並べる。昼夜を分ける版と分けない版の両方。
const L = require('./lib5.js');
for (const split of [true, false]) for (const fixed of [true, false]) {
  const P = L.params({ split, pRefFixed: fixed, entry: 0 });
  const cal = L.calibrate(L.params({ split, pRefFixed: true }));
  const run = (riv, hook) => L.runSite({ attr: 'shoten', Pabs: cal.Pref * cal.Fb, rivals: riv.map((t) => ({ type: t })), eps: cal.eps, rent: 12000, P, lam: 0, hook });
  console.log(`\n== 昼夜を分ける=${split}・相場を固定=${fixed}（P は相場固定・老舗1軒で較正。P_ref ${cal.Pref.toFixed(1)}）`);
  console.log('(1) 元の組 + 足す型 → 3年目の需要の変化（設計の幅：同じ型＝老舗 −20〜−35%、違う型 −5〜−15%）');
  for (const b of [[], ['shinise'], ['cheap'], ['cheap', 'shinise']]) {
    const y0 = run(b); const row = ['shinise', 'cheap', 'kodawari'].map((t) => { const y1 = run([...b, t]); return `${t}${t === 'shinise' ? '(同じ型)' : '(違う型)'} ${(100 * (y1.dem / y0.dem - 1)).toFixed(1)}%`; });
    console.log(`  ${b.join('+') || '0軒'}（需要 ${y0.dem.toFixed(1)}）: ` + row.join('  '));
  }
  console.log('(2) ライバルの値下げ（13か月目から、下げたまま）→ 自店の3年目の需要の変化');
  for (const [b, who, to] of [[['cheap', 'shinise'], 'cheap', 600], [['cheap', 'shinise'], 'shinise', 750], [['shinise'], 'shinise', 750], [['kodawari'], 'kodawari', 1000], [['cheap', 'shinise'], 'shinise', 680]]) {
    const y0 = run(b); const idx = b.indexOf(who);
    const hook = (k, xl, xn) => { if (k === 12) for (const x of [xl, xn]) if (x) { const r = x.rivals.find((q) => q.id === 'r' + idx); if (r) r.price = to; } };
    const y1 = run(b, hook);
    console.log(`  ${b.join('+')} の ${who} が ${L.RV.TYPES[who].price}→${to}円：需要 ${y0.dem.toFixed(1)}→${y1.dem.toFixed(1)}（${(100 * (y1.dem / y0.dem - 1)).toFixed(1)}%）`);
  }
}
