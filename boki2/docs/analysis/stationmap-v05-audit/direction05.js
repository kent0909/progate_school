// 4.3「効きの向きの決まり」の検算：基準の候補地（段3・〜500m・商店街、F=0.9）で、版0.5 の基準の組（老舗1軒）と、0軒から、
// ライバルを1軒足したときの自店の3年目の需要の変化。相場 pRef は属性の値（商店街850）に毎月固定。sim05.js の部品を使うため同じ読み込みをする。
process.argv[2] = '0'; // K=0 で本体のループを回さない
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'sim05.js'), 'utf8').split('\nconst out = [];\nfor')[0];
const m = { exports: {} }; new Function('require', 'module', '__dirname', 'process', src + '\nmodule.exports = { calibrate, makeWorld, run36, cal, P };')(require, m, __dirname, process);
const { makeWorld, run36, cal, P } = m.exports;
const F = P.tier[3] * 1.0 * P.attr.shoten;
const dem = (riv) => run36(makeWorld('shoten', cal.Pref * F, riv, cal.eps, 12000), 'shoten', null).dem;
for (const base of [['shinise'], [], ['cheap'], ['cheap', 'shinise']]) {
  const d0 = dem(base);
  console.log(`元の組 ${base.join('+') || '0軒'}：需要 ${d0.toFixed(1)}／` + ['shinise', 'cheap', 'kodawari'].map((t) => `${t} を足す ${(100 * (dem([...base, t]) / d0 - 1)).toFixed(1)}%`).join('・'));
}
