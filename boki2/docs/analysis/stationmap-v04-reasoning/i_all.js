// 数字の論証の本体：版0.4 の 4.1（人通り）・4.3（ライバルのくじ）・4.4（家賃）を、いまの world.js の式で全965候補地に当てる。
// 平均の店（850円・パート1人・地図のみ）を36か月、期待値（週の揺れ・札・行事なし）で回し、3年目を見る。くじは候補地ごとに K 回（seed）。
// 使い方：node i_all.js [K] [変える置き値の JSON]   例：node i_all.js 8 '{"b":0.5}'
const L = require('./lib.js');
const K = +(process.argv[2] || 8); const over = JSON.parse(process.argv[3] || '{}');
const P = { ...L.DEF, ...over };
if (over.tierMul) { P.tier = Object.fromEntries(Object.entries(L.DEF.tier).map(([k, v]) => [k, 1 + (v - 1) * over.tierMul])); }
if (over.attrSet) P.attr = { ...L.DEF.attr, ...over.attrSet };
if (over.lamTierSet) P.lamTier = { ...L.DEF.lamTier, ...over.lamTierSet };
if (P.pRefStep != null) L.C.table.pRefStep.v = P.pRefStep;
const cal = L.calibrate(P); if (P.Pmul) cal.Pref *= P.Pmul;
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
const out = [];
for (let i = 0; i < L.sites.length; i++) {
  const s = L.sites[i], F = L.Fsite(s, P), key = L.KEY[s.type], draws = [];
  for (let k = 0; k < K; k++) {
    const riv = L.drawRivals(s, 7000 + i * 101 + k, P);
    const u = (L.D.rng(5000 + i * 37 + k)() * 2 - 1); // 町の物件のばらつき ±20%
    const rent = L.rentOf(s, P, P.rentSpread ? u : 0);
    let y = L.run36(L.makeWorld(key, cal.Pref * F, riv, cal.eps, rent)); if (P.bestParts) { const y2 = L.run36(L.makeWorld(key, cal.Pref * F, riv, cal.eps, rent), L.idleParts(2)); if (y2.op > y.op) y = { ...y2, parts2: 1 }; }
    draws.push({ p2: y.parts2 || 0, riv: riv.slice().sort().join('+') || '0', n: riv.length, N: y.N, dem: y.dem, op: y.op, rent: y.rent / 12, u });
  }
  out.push({ id: s.id, st: s.st, type: s.type, pins: s.pins, walk: s.walk, price: s.price, F, rentBase: L.rentOf(s, P, 0), draws });
}
const pool = out.flatMap((o) => o.draws);
const mean = (a) => a.reduce((t, v) => t + v, 0) / a.length;
const siteMean = (o, k) => mean(o.draws.map((d) => d[k]));
console.log(`置き値の変更 ${JSON.stringify(over)}  K=${K}  P_ref=${cal.Pref.toFixed(1)}  基準の組=${P.refRivals.join('+')}`);
console.log(`① 3年目の売れた客/日 の中央値（全くじ） ${q(pool.map((d) => d.N), 0.5).toFixed(1)}  需要の中央値 ${q(pool.map((d) => d.dem), 0.5).toFixed(1)}  （候補地の平均の中央値 ${q(out.map((o) => siteMean(o, 'N')), 0.5).toFixed(1)}）`);
const over70 = pool.filter((d) => d.dem > 70).length / pool.length, over70s = out.filter((o) => siteMean(o, 'dem') > 70).length;
console.log(`② 需要/日が上限70を越える：くじの ${(100 * over70).toFixed(1)}%・候補地の平均で ${over70s}/${out.length}（${(100 * over70s / out.length).toFixed(1)}%）`);
// ③ 利益の上位50（候補地のくじの平均）
const ranked = out.map((o) => ({ ...o, op: siteMean(o, 'op'), N: siteMean(o, 'N'), dem: siteMean(o, 'dem'), dems: o.draws.map((d) => d.dem) })).sort((a, b) => b.op - a.op);
const top = ranked.slice(0, 50); const cnt = (arr, f) => arr.reduce((m, x) => ((m[f(x)] = (m[f(x)] || 0) + 1), m), {});
const tp = cnt(top, (x) => x.pins), ta = cnt(top, (x) => x.type);
console.log(`③ 利益の上位50：駅の段 ${JSON.stringify(tp)}（${Object.keys(tp).length}種）・属性 ${JSON.stringify(ta)}（${Object.keys(ta).length}種）・住宅地か商店街 ${(ta.jutaku || 0) + (ta.shoten || 0)}か所`);
console.log(`   上位10：` + top.slice(0, 10).map((o) => `${L.ST[o.st].name}/${o.type}/段${o.pins}/F${o.F.toFixed(2)}/家賃${(o.rentBase / 1000).toFixed(1)}千/年${(o.op / 1e4).toFixed(0)}万`).join('  '));
// ④ 分散の分け方（3年目の営業利益）：全体＝候補地の間（人通り・家賃の基準・属性）＋候補地の中（くじ：ライバルの軒数と型・家賃のばらつき）
const all = pool.map((d) => d.op), vt = mean(all.map((v) => (v - mean(all)) ** 2));
const vb = mean(out.map((o) => (siteMean(o, 'op') - mean(all)) ** 2));
const vw = mean(out.map((o) => { const m = siteMean(o, 'op'); return mean(o.draws.map((d) => (d.op - m) ** 2)); }));
// 候補地の中を、さらに「軒数が同じくじの中」（＝型の組だけの差）へ
let vType = 0, nT = 0; for (const o of out) { const g = {}; o.draws.forEach((d) => (g[d.n] = g[d.n] || []).push(d.op)); for (const a of Object.values(g)) { if (a.length < 2) continue; const m = mean(a); a.forEach((v) => { vType += (v - m) ** 2; nT++; }); } }
console.log(`④ 利益の分散：全体 ${(vt / 1e10).toFixed(2)}（万円²×1e6）・候補地の間 ${(100 * vb / vt).toFixed(0)}%・候補地の中（くじ） ${(100 * vw / vt).toFixed(0)}%（うち軒数が同じで型だけ違う分の目安 ${(100 * (vType / Math.max(1, nT)) / vt).toFixed(0)}%、家賃のばらつき±20%も中に入る）`);
// 順位の形：人通り・家賃・属性・段ごとの利益の中央値
const by = (f) => { const g = {}; ranked.forEach((o) => (g[f(o)] = g[f(o)] || []).push(o)); return Object.entries(g).map(([k, a]) => `${k}:${a.length}か所 利益${(q(a.map((x) => x.op), 0.5) / 1e4).toFixed(0)}万 客${q(a.map((x) => x.N), 0.5).toFixed(0)} 家賃${(q(a.map((x) => x.rentBase), 0.5) / 1000).toFixed(1)}千/坪`).join(' | '); };
console.log('段ごと（3年目の営業利益の中央値・年）', by((o) => '段' + o.pins));
console.log('属性ごと', by((o) => o.type));
const rk = (a) => { const o = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = Array(a.length); o.forEach((x, k) => (r[x[1]] = k)); return r; };
const sp = (a, b) => { const ra = rk(a), rb = rk(b), n = a.length, m = (n - 1) / 2; let sxy = 0, sx = 0, sy = 0; for (let i = 0; i < n; i++) { sxy += (ra[i] - m) * (rb[i] - m); sx += (ra[i] - m) ** 2; sy += (rb[i] - m) ** 2; } return sxy / Math.sqrt(sx * sy); };
console.log(`利益と人通りの倍率の順位相関 ${sp(ranked.map((o) => o.op), ranked.map((o) => o.F)).toFixed(2)}・利益と地価 ${sp(ranked.map((o) => o.op), ranked.map((o) => o.price)).toFixed(2)}・人通りと家賃 ${sp(ranked.map((o) => o.F), ranked.map((o) => o.rentBase)).toFixed(2)}`);
console.log(`家賃（坪）の分布：最小${(q(ranked.map(o=>o.rentBase),0)/1000).toFixed(1)}千 中央${(q(ranked.map(o=>o.rentBase),0.5)/1000).toFixed(1)}千 最大${(q(ranked.map(o=>o.rentBase),1)/1000).toFixed(1)}千・下限1.3万に張りつく候補地 ${ranked.filter(o=>o.rentBase<=P.floor+1).length}`);
console.log(`赤字（3年目の営業利益<0）の候補地 ${ranked.filter((o) => o.op < 0).length}・くじの中の赤字 ${(100 * pool.filter((d) => d.op < 0).length / pool.length).toFixed(1)}%`);
// 人通りの段（F の5分位）ごとの利益
const Fq = [0.2, 0.4, 0.6, 0.8].map((p) => q(ranked.map((o) => o.F), p));
const fb = (F) => Fq.filter((x) => F > x).length;
console.log('人通りの5分位ごと', by((o) => 'F第' + (fb(o.F) + 1)));
console.log('ライバルの軒数ごと（くじ）', Object.entries(cnt(pool, (d) => d.n)).map(([n, c]) => `${n}軒:${c} 利益${(q(pool.filter((d) => d.n == n).map((d) => d.op), 0.5) / 1e4).toFixed(0)}万`).join(' | '));
// 遊ぶ人はくじの結果を開店前に見て選ぶ（4.3）。だから1つの世界（くじ k）の中で、実現したライバルを見たうえでの上位50を見る
{ const r0 = []; for (let k = 0; k < K; k++) { const w = out.map((o) => ({ o, d: o.draws[k] })).sort((a, b) => b.d.op - a.d.op).slice(0, 50); r0.push({ zero: w.filter((x) => x.d.n === 0).length, tiers: new Set(w.map((x) => x.o.pins)).size, attrs: new Set(w.map((x) => x.o.type)).size, js: w.filter((x) => ['jutaku', 'shoten'].includes(x.o.type)).length, top1: w[0].o.type + '/段' + w[0].o.pins + '/' + w[0].d.riv }); }
  const allZero = pool.filter((d) => d.n === 0).length / pool.length;
  console.log(`⑤ 1つの世界（くじ1回）の中の利益の上位50：ライバル0軒の候補地 ${r0.map((x) => x.zero).join('/')}（全体の0軒の割合 ${(100 * allZero).toFixed(0)}%）・駅の段の種類 ${r0.map((x) => x.tiers).join('/')}・属性の種類 ${r0.map((x) => x.attrs).join('/')}・住宅地か商店街 ${r0.map((x) => x.js).join('/')}・1位 ${r0.map((x) => x.top1).join(' ')}`); }
if (P.bestParts) console.log(`パート2人のほうが利益が上のくじ ${(100 * pool.filter((d) => d.p2).length / pool.length).toFixed(1)}%・利益の上位50で2人を選ぶ候補地 ${top.filter((o) => mean(o.draws.map((d) => d.p2)) > 0.5).length}`);
if (process.env.SAVE) require('fs').writeFileSync(process.env.SAVE, JSON.stringify(ranked.map(({ draws, ...o }) => o)));
