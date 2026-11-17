// 版0.7 の下書き：効きの向きの決まりを「同じ魅力の店を足したとき」で測る（取りまとめ役、11/5）。
// 足す店は老舗と同じ値段・同じ一杯（RV.make('shinise')）で、型の札だけを変える：同じ入れ子（normal＝平均の店と同じ）か、違う入れ子（cheap・kodawari の札）か。
// 入れ子のロジット（world.js:114-119、λ0.5）で、同じ入れ子の店は互いに客を食い合いやすい。値段と一杯が同じなら、型の違いだけが効く。
// 使い方：node dir7.js [置き値の上書きの JSON]
const L = require('../stationmap-v06-reasoning/lib6r.js');
const over = JSON.parse(process.argv[2] || '{}');
const P = L.params({ ...over, entry: false });
if (over.tierSpan) { const keys = [1, 2, 3, 4, 5, 6, 8], d0 = L.DEF.tier, span0 = Math.log(d0[8] / d0[1]); P.tier = Object.fromEntries(keys.map((k) => [k, d0[1] * Math.pow(over.tierSpan, Math.log(d0[k] / d0[1]) / span0)])); }
const cal = L.calibrate(P);
const run = (rivs) => L.runSite({ attr: 'shoten', Pabs: cal.Pref * cal.Fb, rivals: rivs, eps: cal.eps, rent: 12000, P, lam: 0, L: cal.Lref });
console.log(`置き値の上書き ${JSON.stringify(over)}  基準の組 ${P.refRivals.join('+')}  P_ref ${cal.Pref.toFixed(1)}`);
for (const base of [[], ['shinise'], P.refRivals]) {
  const b = base.map((t) => ({ type: t }));
  const y0 = run(b);
  const res = {};
  for (const lab of ['shinise', 'cheap', 'kodawari']) {
    // 老舗と同じ値段・一杯の店に、型の札 lab を付けて足す（runSite は {type} から RV.make するので、札の付け替えは hook で行う）
    const y1 = L.runSite({ attr: 'shoten', Pabs: cal.Pref * cal.Fb, rivals: [...b, { type: 'shinise' }], eps: cal.eps, rent: 12000, P, lam: 0, L: cal.Lref,
      hook: (k, xl, xn) => { if (k === 0) for (const x of [xl, xn]) if (x) { const r = x.rivals[x.rivals.length - 1]; if (r && lab !== 'shinise') r.type = lab; } } });
    res[lab] = 100 * (y1.dem / y0.dem - 1);
  }
  const ok = res.shinise < res.cheap && res.shinise < res.kodawari;
  console.log(`  元 ${base.join('+') || '0軒'}（需要 ${y0.dem.toFixed(1)}）＋老舗と同じ店：同じ型の札 ${res.shinise.toFixed(1)}%・安売りの札 ${res.cheap.toFixed(1)}%・こだわりの札 ${res.kodawari.toFixed(1)}% → 同じ型が最も大きく減る ${ok ? '○' : '×'}`);
}
