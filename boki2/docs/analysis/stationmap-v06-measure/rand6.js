// 探してよい幅（設計書 4.1・4.3・4.4・4.5・4.7）の中で、置き値の組を乱数で作り、batch.sh の引数を出す（seed 固定で再現）。
// 使い方：node rand6.js 前置き 個数 seed [saveMode]   → 「名前 'JSON' 名前 'JSON' …」
const [pre, n, seed, mode] = [process.argv[2], +process.argv[3], +process.argv[4], process.argv[5] || 'hours'];
let s = seed >>> 0; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const pick = (a) => a[Math.floor(r() * a.length)];
const out = [];
for (let i = 0; i < n; i++) {
  const o = {
    p0: pick([0.005, 0.01, 0.015, 0.02]), p1: pick([0.03, 0.08, 0.12, 0.15]), kappa: pick([0.3, 0.6, 1.0]),
    tierSpan: pick([1.6, 2.14, 2.5, 3.0]), b: pick([0.15, 0.25, 0.4, 0.55, 0.7]), distSpan: pick([1.2, 1.44, 1.6]),
    capLunch: pick([0.4, 0.45, 0.5, 0.55, 0.6]), R0: pick([25000, 28000, 32000]), floor: pick([10000, 13000, 15000]),
    attr: { hanka: pick([1.0, 1.15, 1.3]), jutaku: pick([0.6, 0.8, 0.9]), kojo: pick([0.4, 0.6, 0.7]) },
    ret: { jutaku: [pick([1.1, 1.3, 1.5]), 0.8], hanka: [pick([0.5, 0.7, 0.9]), 1.25] },
  };
  if (mode !== 'hours') o.saveMode = mode;
  out.push(`${pre}${String(i).padStart(2, '0')}`, JSON.stringify(o));
}
console.log(out.map((x) => `'${x}'`).join(' '));
