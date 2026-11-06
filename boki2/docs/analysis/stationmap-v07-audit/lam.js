const L = require('../stationmap-v06-measure/lib6.js');
for (const mul of [1, 1.5, 2, 2.5]) { const P = L.params({ lamMul: mul }); const c = L.sites.map((s) => Math.round(L.lamOf(s, P)));
  const z = c.filter((x) => x === 0).length; const exp0 = L.sites.reduce((t, s, i) => t + (c[i] === 0 ? 0.8 : c[i] === 1 ? 0.2 : 0), 0);
  console.log(`lamMul ${mul}: 中心0 ${z}/${L.sites.length} (${(100 * z / L.sites.length).toFixed(1)}%)  くじで0軒の期待 ${exp0.toFixed(1)} (${(100 * exp0 / L.sites.length).toFixed(1)}%)  λ表 ${Object.values(P.lamTier).map((v) => +(v * mul).toFixed(2)).join(',')}`); }
// 段の倍率（tierSpan 6）
const d0 = L.DEF.tier, keys = [1, 2, 3, 4, 5, 6, 8], span0 = Math.log(d0[8] / d0[1]);
for (const ts of [6, 8]) console.log('tierSpan', ts, keys.map((k) => (d0[1] * Math.pow(ts, Math.log(d0[k] / d0[1]) / span0)).toFixed(4)).join(' '));
console.log('v06 段比', (d0[8] / d0[1]).toFixed(4));
// 段ごとの foot の中央
const ST = L.T.stations; const med = (a) => { const b = a.slice().sort((x, y) => x - y), n = b.length; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; };
const tiers = [...new Set(ST.map((s) => s.tier))].sort((a, b) => a - b);
for (const t of tiers) { const f = ST.filter((s) => s.tier === t).map((s) => s.foot); console.log('段', t, '駅', f.length, 'foot 中央', Math.round(med(f)), '最小', Math.round(Math.min(...f)), '最大', Math.round(Math.max(...f))); }
const m1 = med(ST.filter((s) => s.tier === 1).map((s) => s.foot)), m8 = med(ST.filter((s) => s.tier === 8).map((s) => s.foot));
console.log('段8中央/段1中央', (m8 / m1).toFixed(2), ' ln6/ln(比)', (Math.log(6) / Math.log(m8 / m1)).toFixed(4), ' ln6/ln68', (Math.log(6) / Math.log(68)).toFixed(4));
// 版0.7 の λ で中心0の候補地の内訳
const P2 = L.params({ lamMul: 2 }); const z2 = L.sites.filter((s) => Math.round(L.lamOf(s, P2)) === 0); const cnt = {}; z2.forEach((s) => { const k = '段' + s.tier + '/' + s.type; cnt[k] = (cnt[k] || 0) + 1; }); console.log('lamMul2 中心0 内訳', JSON.stringify(cnt));
// 段8 の候補地の λ（lamMul 2）
const t8 = L.sites.filter((s) => s.tier === 8); const c8 = {}; t8.forEach((s) => { const c = Math.min(5, Math.round(L.lamOf(s, P2))); c8[s.type + ':' + c] = (c8[s.type + ':' + c] || 0) + 1; }); console.log('段8 属性:中心', JSON.stringify(c8));
