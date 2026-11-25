// 版0.7 の論証の検査で数える事実（論証検査役、11/5）。ゲームの式は回さない（lib6r.js のデータと置き値の読み出しだけ）。
// 1. 中心 c＝round(λ) が0の候補地の割合と、くじで0軒になる割合（lamMul 1 と 2）
// 2. 段ごとの駅の人通り foot の中央値（設計書 0章の「段1 1.5万・段8 100万、約68倍」の確かめ）と、段の倍率の比
// 3. 繁華街の候補地の day・food・L（⑦の (c) を退ける理由の確かめ）
// 使い方：node facts.js
const L = require('../stationmap-v06-reasoning/lib6r.js');
const med = L.med;
for (const m of [1, 2]) {
  const P = L.params({ lamMul: m });
  let c0 = 0, exp0 = 0;
  for (const s of L.sites) { const lam = L.lamOf(s, P), c = Math.round(lam); if (c === 0) c0++; exp0 += c === 0 ? 0.8 : c === 1 ? 0.2 : 0; }
  // くじで実際に引いた0軒の割合（seed は all6r.js と同じ 7000+101i+k、k=0..11）
  let z = 0, n = 0; L.sites.forEach((s, i) => { for (let k = 0; k < 12; k++) { if (L.drawRivals(s, 7000 + i * 101 + k, P).length === 0) z++; n++; } });
  console.log(`lamMul ${m}: 中心0の候補地 ${c0}/${L.sites.length}（${(100 * c0 / L.sites.length).toFixed(1)}%）・0軒の期待の割合 ${(100 * exp0 / L.sites.length).toFixed(1)}%・くじで0軒（K=12）${(100 * z / n).toFixed(1)}%`);
}
const st = L.T.stations; const byT = {};
for (const s of st) (byT[s.tier] = byT[s.tier] || []).push(s.foot);
console.log('段ごとの駅の数と foot の中央値：' + Object.keys(byT).sort((a, b) => a - b).map((t) => `段${t} ${byT[t].length}駅 ${(med(byT[t]) / 1e4).toFixed(1)}万`).join('・'));
console.log(`段8÷段1 の foot の中央値の比 ${(med(byT[8]) / med(byT[1])).toFixed(1)}`);
for (const sp of [2.14, 6]) { const r = Math.pow(med(byT[8]) / med(byT[1]), 0); console.log(`  段の比 ${sp} は foot の比の ${(Math.log(sp) / Math.log(med(byT[8]) / med(byT[1]))).toFixed(2)} 乗`); }
// 候補地ごと（候補地の駅の foot）での比：段1と段8の候補地の foot の中央
const sf = {}; for (const s of L.sites) (sf[s.tier] = sf[s.tier] || []).push(s.foot);
console.log('候補地の駅の foot の中央値：' + Object.keys(sf).sort((a, b) => a - b).map((t) => `段${t} ${(med(sf[t]) / 1e4).toFixed(1)}万`).join('・'));
const P = L.params({});
const H = L.sites.filter((s) => s.type === 'hanka');
const q = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(p * (b.length - 1))]; };
console.log(`繁華街 ${H.length}本：day の中央 ${med(H.map((s) => s.day)).toFixed(2)}・food の中央 ${med(H.map((s) => s.food)).toFixed(3)}（全候補地の中央 0.0708）・L の中央 ${med(H.map((s) => L.Lof(s, P))).toFixed(2)}`);
const all = L.sites;
const rk = (a) => { const o = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = Array(a.length); o.forEach((x, k) => (r[x[1]] = k)); return r; };
const sp = (a, b) => { const ra = rk(a), rb = rk(b), n = a.length, m = (n - 1) / 2; let sxy = 0, sx = 0, sy = 0; for (let i = 0; i < n; i++) { sxy += (ra[i] - m) * (rb[i] - m); sx += (ra[i] - m) ** 2; sy += (rb[i] - m) ** 2; } return sxy / Math.sqrt(sx * sy); };
console.log(`全候補地：day と food の順位相関 ${sp(all.map((s) => s.day), all.map((s) => s.food)).toFixed(2)}・繁華街の中で ${sp(H.map((s) => s.day), H.map((s) => s.food)).toFixed(2)}`);
for (const t of ['office', 'shogyo', 'hanka', 'shoten', 'jutaku', 'kojo']) { const a = all.filter((s) => s.type === t); console.log(`  ${t}: day 中央 ${med(a.map((s) => s.day)).toFixed(2)}・food 中央 ${med(a.map((s) => s.food)).toFixed(3)}`); }
// κ を動かしたときの繁華街の L の中央（κ の幅 0.3〜1.0 と外）
for (const k of [0.3, 0.6, 1.0, 1.5, 2.0]) { const P2 = L.params({ kappa: k }); console.log(`  κ ${k}: 繁華街の L の中央 ${med(H.map((s) => L.Lof(s, P2))).toFixed(2)}・25% ${q(H.map((s) => L.Lof(s, P2)), 0.25).toFixed(2)}`); }
// 商店街の型の重み（基準の組を「多い2つ」で選べるか）
console.log('商店街の型の重み [安売り, こだわり, 老舗] =', JSON.stringify(P.w.shoten));
