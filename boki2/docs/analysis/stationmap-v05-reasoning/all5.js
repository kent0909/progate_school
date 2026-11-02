// 数字の論証の本体：版0.5 の 4章の初めの置き値を、いまの world.js の式で全886候補地に当て、6章の検査①〜⑩（⑩は dir5.js）を出す。
// 平均の店（850円・パート1人・地図のみ・宣伝なし・通し）を36か月、期待値（週の揺れ・札・行事なし）で回し、3年目を見る。くじは候補地ごとに K 回。
// 使い方：node all5.js [K] [置き値の上書きの JSON]   例：node all5.js 6 '{"b":0.4}'
// 環境変数 SAVE にパスを渡すと、くじごとの結果を JSON で書く（hours5.js が読む）。PARTS2=0 で検査⑧（パート2人の回し直し）を省く。
const L = require('./lib5.js');
const K = +(process.argv[2] || 6); const over = JSON.parse(process.argv[3] || '{}');
const P = L.params(over);
if (over.tierSpan) { // 段1を据え置き、段8＝段1×tierSpan、間は初めの置き値の対数の割合のまま並べ直す（4.1 の探してよい幅：1.6〜3.0倍）
  const keys = [1, 2, 3, 4, 5, 6, 8], d0 = L.DEF.tier, span0 = Math.log(d0[8] / d0[1]);
  P.tier = Object.fromEntries(keys.map((k) => [k, d0[1] * Math.pow(over.tierSpan, Math.log(d0[k] / d0[1]) / span0)])); }
const cal = L.calibrate(P); if (P.Pmul) cal.Pref *= P.Pmul;
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
const mean = (a) => a.reduce((t, v) => t + v, 0) / a.length;
const LS = P.LsiteFile ? JSON.parse(require('fs').readFileSync(P.LsiteFile)) : null;
const out = []; const doP2 = process.env.PARTS2 !== '0';
for (let i = 0; i < L.sites.length; i++) {
  const s = L.sites[i], F = L.Fsite(s, P), lam = L.lamOf(s, P), draws = [];
  for (let k = 0; k < K; k++) {
    const riv = L.drawRivals(s, 7000 + i * 101 + k, P);
    const u = (L.D.rng(5000 + i * 37 + k)() * 2 - 1);
    const rent = L.rentOf(s, P, P.rentSpread ? u : 0);
    const base = { attr: s.type, Pabs: cal.Pref * F, rivals: riv, eps: cal.eps, rent, P, lam, entrySeed: 3000 + i * 53 + k, Lsite: LS && LS[s.id] != null && (!P.LsiteTypes || P.LsiteTypes.includes(s.type)) ? LS[s.id] : null };
    const y = L.runSite(base);
    let p2 = null; if (doP2 && y.dem > 70) { const y2 = L.runSite({ ...base, parts: 2 }); p2 = y2.thru; }
    draws.push({ n: riv.length, riv: riv.map((r) => r.type[0] + (r.lunchOnly ? 'L' : '')).sort().join('') || '0', N: y.N, N1: y.N1, NL: y.NL, NN: y.NN, dem: y.dem, demL: y.demL, demN: y.demN, op: y.thru, opL: y.opL, opN: y.opN, fixed: y.fixed, p2, end: y.rivalsEnd, rent });
  }
  out.push({ id: s.id, st: s.st, name: s.stName, town: s.town, type: s.type, tier: s.tier, walk: s.walk, price: s.price, quiet: !!s.quiet, F, lam, rentBase: L.rentOf(s, P, 0), draws });
}
const pool = out.flatMap((o) => o.draws);
const siteMean = (o, k) => mean(o.draws.map((d) => d[k]));
console.log(`置き値の上書き ${JSON.stringify(over)}  K=${K}  候補地 ${out.length}  P_ref(F=1)=${cal.Pref.toFixed(1)}  eps=${cal.eps.toFixed(3)}  基準の組=${P.refRivals.join('+')}  相場固定=${P.pRefFixed}  昼夜を分ける=${P.split}`);
const R = {};
R.c1 = q(pool.map((d) => d.N), 0.5);
console.log(`① 3年目の売れた客/日 の中央値（全くじ） ${R.c1.toFixed(1)}（目標 40〜52）  需要の中央値 ${q(pool.map((d) => d.dem), 0.5).toFixed(1)}  （候補地の平均の中央値 ${q(out.map((o) => siteMean(o, 'N')), 0.5).toFixed(1)}）`);
const over70 = pool.filter((d) => d.dem > 70).length / pool.length, over70s = out.filter((o) => siteMean(o, 'dem') > 70).length;
const slotOver = pool.filter((d) => d.demL > 70 * P.capLunch || d.demN > 70 * (1 - P.capLunch)).length / pool.length;
R.c2 = over70;
console.log(`② 需要/日が上限70を越える：くじの ${(100 * over70).toFixed(1)}%・候補地の平均で ${over70s}/${out.length}（${(100 * over70s / out.length).toFixed(1)}%）。昼か夜のどちらかの上限（${(70 * P.capLunch).toFixed(1)}・${(70 * (1 - P.capLunch)).toFixed(1)}）を越えるくじ ${(100 * slotOver).toFixed(1)}%（報告だけ）`);
const ranked = out.map((o) => ({ ...o, op: siteMean(o, 'op'), N: siteMean(o, 'N'), dem: siteMean(o, 'dem') })).sort((a, b) => b.op - a.op);
const top = ranked.slice(0, 50); const cnt = (arr, f) => arr.reduce((m, x) => ((m[f(x)] = (m[f(x)] || 0) + 1), m), {});
const tp = cnt(top, (x) => x.tier), ta = cnt(top, (x) => x.type); const js = (ta.jutaku || 0) + (ta.shoten || 0);
R.c3 = { tiers: Object.keys(tp).length, attrs: Object.keys(ta).length, js };
console.log(`③ 利益の上位50（候補地のくじの平均）：段 ${JSON.stringify(tp)}（${R.c3.tiers}種、目標4以上）・属性 ${JSON.stringify(ta)}（${R.c3.attrs}種、目標4以上）・住宅地か商店街 ${js}（目標8以上）`);
console.log('   上位10：' + top.slice(0, 10).map((o) => `${o.name}/${o.town}/${o.type}/段${o.tier}/F${o.F.toFixed(2)}/家賃${(o.rentBase / 1000).toFixed(1)}千/年${(o.op / 1e4).toFixed(0)}万`).join('  '));
const all = pool.map((d) => d.op), mu = mean(all), vt = mean(all.map((v) => (v - mu) ** 2));
const vb = mean(out.map((o) => (siteMean(o, 'op') - mu) ** 2)), vw = mean(out.map((o) => { const m = siteMean(o, 'op'); return mean(o.draws.map((d) => (d.op - m) ** 2)); }));
R.c4 = vw / vt;
console.log(`④ 利益の分散：候補地の間 ${(100 * vb / vt).toFixed(0)}%・同じ候補地のくじの揺れ ${(100 * vw / vt).toFixed(0)}%（目標40%以下。家賃のばらつき±20%と開店のあとの参入も揺れに入る）`);
// ⑤ 1つの世界（くじ k）の上位50
const zero = [], r0 = [];
for (let k = 0; k < K; k++) { const w = out.map((o) => ({ o, d: o.draws[k] })).sort((a, b) => b.d.op - a.d.op).slice(0, 50); zero.push(w.filter((x) => x.d.n === 0).length); r0.push(w); }
R.c5 = Math.max(...zero);
console.log(`⑤ 1つの世界の上位50のうち開店の前にライバル0軒の所 ${zero.join('/')}（目標15以下）・全くじの0軒の割合 ${(100 * pool.filter((d) => d.n === 0).length / pool.length).toFixed(0)}%`);
// ⑥ 単純な規則：1つの世界で、規則の並べ方で上から10か所を選んだ平均の利益 ÷ その世界の本当の上位10の平均（上手なボット＝見える情報で利益を当てる上限として、本当の上位を使う）
const rules = {
  '大きい駅（段5以上、人通りの倍率の大きい順）': (x) => (x.o.tier >= 5 ? x.o.F : -1),
  'ライバル0〜1軒（その中で人通りの倍率の大きい順）': (x) => (x.d.n <= 1 ? x.o.F : -1),
  '家賃が下から25%（その中で人通りの倍率の大きい順）': (x) => (x.d.rent <= q(pool.map((d) => d.rent), 0.25) ? x.o.F : -1),
  'ライバル0軒（その中で人通りの倍率の大きい順）': (x) => (x.d.n === 0 ? x.o.F : -1),
};
R.c6 = {};
for (const [nm, f] of Object.entries(rules)) {
  const ratios = [], rnd = [];
  for (let k = 0; k < K; k++) { const w = out.map((o) => ({ o, d: o.draws[k] })); const best = mean(w.map((x) => x.d.op).sort((a, b) => b - a).slice(0, 10)); const pick = w.slice().sort((a, b) => f(b) - f(a)).slice(0, 10); ratios.push(mean(pick.map((x) => x.d.op)) / best); const sat = w.filter((x) => f(x) >= 0); rnd.push(mean(sat.map((x) => x.d.op)) / best); }
  R.c6[nm] = mean(ratios);
  console.log(`⑥ ${nm}：上から10か所の利益÷本当の上位10 ${ratios.map((x) => (100 * x).toFixed(0) + '%').join('/')}（目標85%未満）・規則を満たす所から無作為に選ぶと ${(100 * mean(rnd)).toFixed(0)}%`);
}
// 参考：遊ぶ人が「人通りの倍率の大きい順」「ライバルが少ない順→人通り」で選ぶと
// ⑦ 営業時間：オフィス街で昼だけ＞通し、繁華街で夜だけ＞通しの割合（閉めて減る費用 save）
const hours = (save) => { const f = (t, k) => { const a = pool.filter((d, j) => out[Math.floor(j / K)].type === t); return a.filter((d) => (k === 'L' ? d.opL + save * 12 : d.opN + save * 12) > d.op).length / a.length; }; return { off: f('office', 'L'), hanka: f('hanka', 'N'), offN: f('office', 'N'), hankaL: f('hanka', 'L') }; };
for (const sv of [P.save, 160000, 200000]) { const h = hours(sv); console.log(`⑦ 閉めて減る費用 月${sv / 1e4}万：オフィスで昼だけ＞通し ${(100 * h.off).toFixed(0)}%（目標20%以上）・繁華街で夜だけ＞通し ${(100 * h.hanka).toFixed(0)}%（目標20%以上）｜参考 オフィスで夜だけ＞通し ${(100 * h.offN).toFixed(0)}%・繁華街で昼だけ＞通し ${(100 * h.hankaL).toFixed(0)}%`); }
R.c7 = hours(P.save);
for (const t of ['office', 'shogyo', 'hanka', 'shoten', 'jutaku', 'kojo']) { const a = pool.filter((d, j) => out[Math.floor(j / K)].type === t); if (!a.length) continue; const sv = P.save * 12; const best = (d) => { const v = { 通し: d.op, 昼だけ: d.opL + sv, 夜だけ: d.opN + sv }; return Object.entries(v).sort((x, y) => y[1] - x[1])[0][0]; }; const c = cnt(a, best); console.log(`   ${t}（L=${P.L[t]}）くじ${a.length}：いちばん得 ${JSON.stringify(c)}・昼の売れた客の中央 ${q(a.map((d) => d.NL), 0.5).toFixed(1)}・夜 ${q(a.map((d) => d.NN), 0.5).toFixed(1)}・昼だけ−通し の中央 ${(q(a.map((d) => d.opL + sv - d.op), 0.5) / 12e4).toFixed(1)}万円/月・夜だけ−通し ${(q(a.map((d) => d.opN + sv - d.op), 0.5) / 12e4).toFixed(1)}万円/月`); }
// ⑧ 上限を越えるくじのうち、パート2人で3年目の利益が上がる割合
const ov = pool.filter((d) => d.p2 != null); R.c8 = ov.length ? ov.filter((d) => d.p2 > d.op).length / ov.length : null;
console.log(`⑧ 需要が70を越えるくじ ${ov.length}：パートを1人足すと3年目の利益が上がる ${R.c8 == null ? '—' : (100 * R.c8).toFixed(0) + '%'}（目標30〜70%）${ov.length ? `・差の中央 ${(q(ov.map((d) => d.p2 - d.op), 0.5) / 1e4).toFixed(0)}万円/年` : ''}`);
// ⑨ 住宅地と繁華街の、1年目→3年目の客数の伸びの比
const g = (t) => q(pool.filter((d, j) => out[Math.floor(j / K)].type === t).map((d) => d.N / Math.max(1e-9, d.N1)), 0.5);
const gj = g('jutaku'), gh = g('hanka'), gs = g('shoten'); R.c9 = gj / gh;
console.log(`⑨ 3年目÷1年目の売れた客の中央：住宅地 ${gj.toFixed(2)}・商店街 ${gs.toFixed(2)}・繁華街 ${gh.toFixed(2)}・オフィス ${g('office').toFixed(2)}｜住宅地÷繁華街 ${R.c9.toFixed(2)}（目標1.3以上）`);
// ほかの数
const by = (f) => { const gg = {}; ranked.forEach((o) => (gg[f(o)] = gg[f(o)] || []).push(o)); return Object.entries(gg).map(([k, a]) => `${k}:${a.length}か所 利益${(q(a.map((x) => x.op), 0.5) / 1e4).toFixed(0)}万 客${q(a.map((x) => x.N), 0.5).toFixed(0)} 家賃${(q(a.map((x) => x.rentBase), 0.5) / 1000).toFixed(1)}千/坪`).join(' | '); };
console.log('段ごと（3年目の営業利益の中央値・年）', by((o) => '段' + o.tier));
console.log('属性ごと', by((o) => o.type));
console.log('閑静の枠', by((o) => (o.quiet ? 'quiet' : 'ほか')));
const rk = (a) => { const o = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = Array(a.length); o.forEach((x, k) => (r[x[1]] = k)); return r; };
const sp = (a, b) => { const ra = rk(a), rb = rk(b), n = a.length, m = (n - 1) / 2; let sxy = 0, sx = 0, sy = 0; for (let i = 0; i < n; i++) { sxy += (ra[i] - m) * (rb[i] - m); sx += (ra[i] - m) ** 2; sy += (rb[i] - m) ** 2; } return sxy / Math.sqrt(sx * sy); };
console.log(`利益と人通りの倍率の順位相関 ${sp(ranked.map((o) => o.op), ranked.map((o) => o.F)).toFixed(2)}・利益と地価 ${sp(ranked.map((o) => o.op), ranked.map((o) => o.price)).toFixed(2)}・利益と λ ${sp(ranked.map((o) => o.op), ranked.map((o) => o.lam)).toFixed(2)}`);
console.log(`赤字（3年目の営業利益<0）のくじ ${(100 * pool.filter((d) => d.op < 0).length / pool.length).toFixed(1)}%・候補地 ${ranked.filter((o) => o.op < 0).length}`);
console.log('ライバルの軒数（開店の前）ごと', Object.entries(cnt(pool, (d) => d.n)).map(([n, c]) => `${n}軒:${c} 利益${(q(pool.filter((d) => d.n == n).map((d) => d.op), 0.5) / 1e4).toFixed(0)}万`).join(' | '));
console.log(`開店の前に0軒だった所の3年目の終わりのライバル：0軒のまま ${(100 * pool.filter((d) => d.n === 0 && d.end === 0).length / Math.max(1, pool.filter((d) => d.n === 0).length)).toFixed(0)}%`);
const pass = { '①': R.c1 >= 40 && R.c1 <= 52, '③': R.c3.tiers >= 4 && R.c3.attrs >= 4 && R.c3.js >= 8, '④': R.c4 <= 0.4, '⑤': R.c5 <= 15, '⑥': Object.values(R.c6).every((x) => x < 0.85), '⑦': R.c7.off >= 0.2 && R.c7.hanka >= 0.2, '⑧': R.c8 != null && R.c8 >= 0.3 && R.c8 <= 0.7, '⑨': R.c9 >= 1.3 };
console.log('判定：' + Object.entries(pass).map(([k, v]) => `${k}${v ? '○' : '×'}`).join(' ') + '（②は目標なし、⑩は dir5.js）');
console.log('SUMMARY ' + JSON.stringify({ over, c1: +R.c1.toFixed(1), c2: +(100 * R.c2).toFixed(1), c3: R.c3, c4: Math.round(100 * R.c4), c5: zero, c6: Object.fromEntries(Object.entries(R.c6).map(([k, v]) => [k.slice(0, 6), Math.round(100 * v)])), c7: { off: Math.round(100 * R.c7.off), hanka: Math.round(100 * R.c7.hanka) }, c8: R.c8 == null ? null : Math.round(100 * R.c8), c9: +R.c9.toFixed(2), pass }));
if (process.env.SAVE) require('fs').writeFileSync(process.env.SAVE, JSON.stringify(out));
