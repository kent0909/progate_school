// 判定役：lib71.js の較正 mix の確かめ。(a) くじを「老舗だけ・中心だけ・昼だけ0」に縮めると、決まった組 ["shinise"] の較正と同じ P_ref になるか
// (b) T2・T3 の置き値で、くじの組の数・重みの和・重みつきの中央値が 44 に当たっているか
const L = require('../stationmap-v071-draft/lib71.js');
const fix = (o) => { const P = L.params(o); if (o.tierSpan) { const keys = [1, 2, 3, 4, 5, 6, 8], d0 = L.DEF.tier, s0 = Math.log(d0[8] / d0[1]); P.tier = Object.fromEntries(keys.map((k) => [k, d0[1] * Math.pow(o.tierSpan, Math.log(d0[k] / d0[1]) / s0)])); } return P; };
const a = L.calibrate(fix({})), b = L.calibrate(fix({ refMode: 'mix', w: { shoten: [0, 0, 1] }, pm: [0, 1, 0], shiniseLunch: 0 }));
console.log('(a) rivals["shinise"] P_ref', a.Pref.toFixed(4), ' mix(老舗だけ・中心だけ・昼だけ0) P_ref', b.Pref.toFixed(4), ' 差', Math.abs(a.Pref - b.Pref).toExponential(2), ' 組', b.combos);
for (const [nm, o] of [['T2', { tierSpan: 6, lamMul: 2, refMode: 'mix', entryDelay: 2 }], ['T3', { tierSpan: 7.9, lamMul: 1, refMode: 'mix', entryDelay: 2, b: 0.15 }]]) {
  const P = fix(o), cal = L.calibrate(P), { combos } = L.refCombos(P);
  const rows = combos.map((cb) => [L.runSite({ attr: 'shoten', Pabs: cal.Pref * cal.Fb, rivals: cb.rivals, eps: cal.eps, rent: 12000, P: { ...P, entry: false, noise: false }, lam: 0, L: cal.Lref }).N, cb.w, cb.n]).sort((x, y) => x[0] - y[0]);
  const tot = rows.reduce((t, r) => t + r[1], 0); let acc = 0, below = 0; for (const r of rows) { if (r[0] < 44) below += r[1]; }
  const mean = rows.reduce((t, r) => t + r[0] * r[1], 0) / tot;
  console.log(nm, 'P_ref', cal.Pref.toFixed(2), '組', combos.length, '重みの和', tot.toFixed(6), '44未満の重み', below.toFixed(4), '重みつきの平均', mean.toFixed(2), '最小〜最大', rows[0][0].toFixed(1), rows[rows.length - 1][0].toFixed(1));
}
