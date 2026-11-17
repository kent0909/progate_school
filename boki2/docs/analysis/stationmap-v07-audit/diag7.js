// dir7.js と同じ測り方で、付け替えた店の開閉・値段・品質を月ごとに記録する（判定役の確かめ）
const L = require('../stationmap-v06-reasoning/lib6r.js');
const over = JSON.parse(process.argv[2] || '{}');
const P = L.params({ ...over, entry: false });
if (over.tierSpan) { const keys = [1, 2, 3, 4, 5, 6, 8], d0 = L.DEF.tier, span0 = Math.log(d0[8] / d0[1]); P.tier = Object.fromEntries(keys.map((k) => [k, d0[1] * Math.pow(over.tierSpan, Math.log(d0[k] / d0[1]) / span0)])); }
const cal = L.calibrate(P);
const noExit = process.env.NOEXIT === '1';
for (const base of [[], ['shinise'], P.refRivals]) {
  const b = base.map((t) => ({ type: t }));
  const y0 = L.runSite({ attr: 'shoten', Pabs: cal.Pref * cal.Fb, rivals: b, eps: cal.eps, rent: 12000, P, lam: 0, L: cal.Lref });
  const res = {};
  for (const lab of ['shinise', 'cheap', 'kodawari']) {
    const log = [];
    const y1 = L.runSite({ attr: 'shoten', Pabs: cal.Pref * cal.Fb, rivals: [...b, { type: 'shinise' }], eps: cal.eps, rent: 12000, P, lam: 0, L: cal.Lref,
      hook: (k, xl, xn) => {
        if (k === 0) for (const x of [xl, xn]) if (x) { const r = x.rivals[x.rivals.length - 1]; if (r && lab !== 'shinise') r.type = lab; }
        const r = xl.rivals[xl.rivals.length - 1], rn = xn && xn.rivals[xn.rivals.length - 1];
        if (noExit) { r.open = true; if (rn) rn.open = true; }
        log.push({ k, open: r.open !== false, openN: rn ? rn.open !== false : null, price: r.price, Q: +L.D.bowl.Q(r.bowl, r).toFixed(3), R: +r.R.toFixed(2), type: r.type, typeN: rn && rn.type });
      } });
    res[lab] = 100 * (y1.dem / y0.dem - 1);
    const closeAt = log.find((e) => !e.open); const qs = [...new Set(log.map((e) => e.Q))]; const ps = [...new Set(log.map((e) => e.price))];
    console.log(`  元 ${base.join('+') || '0軒'} 札 ${lab}: 需要の差 ${res[lab].toFixed(1)}%  閉店 ${closeAt ? 'k=' + closeAt.k : 'なし'}  値段 ${ps.join(',')}  Q ${qs.join(',')}  評判 k0 ${log[0].R}→k35 ${log[35].R}  昼の型 ${log[1].type} 夜の型 ${log[1].typeN}`);
  }
}
