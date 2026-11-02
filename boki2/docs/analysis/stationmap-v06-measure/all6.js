// 数字の論証の本体：版0.6 の 4章の置き値を、いまの world.js の式で全981候補地に当て、6章の検査①〜⑨（⑩と効きの向きは dir6.js）を出す。
// 版0.5 の all5.js（../stationmap-v05-reasoning/）を写して、版0.6 の仕組み（成功で寄ってくる参入・候補地ごとの L・時間で数える閉めて減る費用・⑤を3年目で数える）を入れた。
// 平均の店（850円・パート1人・地図のみ・宣伝なし・通し）を36か月。月の中は期待値（週の揺れ・札・行事なし）。乱数で引くのは
// ライバルのくじ（軒数・型・昼だけ）・家賃のばらつき・開店のあとの参入。'{"noise":true}' で週の揺れも入れる。くじは候補地ごとに K 回。
// 使い方：node all6.js [K] [置き値の上書きの JSON]   例：node all6.js 6 '{"b":0.4}'
// 環境変数：SAVE＝くじごとの結果を JSON で書くパス。PARTS2=0 で検査⑧を省く。SEEDOFF＝くじの seed をずらす（K を増やした確かめ用）。
const L = require('./lib6.js');
const K = +(process.argv[2] || 6); const over = JSON.parse(process.argv[3] || '{}');
const SO = +(process.env.SEEDOFF || 0);
const P = L.params(over);
if (over.tierSpan) { // 段1を据え置き、段8＝段1×tierSpan、間は初めの置き値の対数の割合のまま並べ直す（4.1 の探してよい幅：1.6〜3.0倍）
  const keys = [1, 2, 3, 4, 5, 6, 8], d0 = L.DEF.tier, span0 = Math.log(d0[8] / d0[1]);
  P.tier = Object.fromEntries(keys.map((k) => [k, d0[1] * Math.pow(over.tierSpan, Math.log(d0[k] / d0[1]) / span0)])); }
if (over.distSpan) { const m = Math.sqrt(over.distSpan / (1.15 / 0.8)); P.dist = [1.15 * m, 1.0, 0.8 / m]; } // 近い所÷遠い所（幅 1.2〜1.6）。初めの比 1.4375 からの開きを近い・遠いに半分ずつ
const cal = L.calibrate(P);
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
const mean = (a) => a.reduce((t, v) => t + v, 0) / a.length;
const out = []; const doP2 = process.env.PARTS2 !== '0';
for (let i = 0; i < L.sites.length; i++) {
  const s = L.sites[i], F = L.Fsite(s, P), lam = L.lamOf(s, P), Ls = L.Lof(s, P), draws = [];
  for (let k = SO; k < SO + K; k++) {
    const riv = L.drawRivals(s, 7000 + i * 101 + k, P);
    const u = (L.D.rng(5000 + i * 37 + k)() * 2 - 1);
    const rent = L.rentOf(s, P, P.rentSpread ? u : 0);
    const base = { attr: s.type, Pabs: cal.Pref * F, rivals: riv, eps: cal.eps, rent, P, lam, L: Ls, entrySeed: 3000 + i * 53 + k, noiseSeed: i * 1000 + k * 37 };
    const y = L.runSite(base);
    let p2 = null; if (doP2 && y.dem > 70) { const y2 = L.runSite({ ...base, parts: 2 }); p2 = y2.thru; }
    draws.push({ n: riv.length, riv: riv.map((r) => r.type[0] + (r.lunchOnly ? 'L' : '')).sort().join('') || '0', N: y.N, N1: y.N1, NL: y.NL, NN: y.NN, dem: y.dem, demL: y.demL, demN: y.demN,
      op: y.thru, opL: y.opL, opN: y.opN, lunch: y.lunch, night: y.night, saveL: y.saveL, saveN: y.saveN, op1: y.op1, op2: y.op2, p2, end: y.rivalsEnd, r24: y.r24, zero3: y.zero3, endTypes: y.endTypes,
      entries: y.entries, entryAt: y.entryAt, pMean: y.pSum / 36, sMean: y.sSum / 36, R: y.R, rent });
  }
  out.push({ id: s.id, st: s.st, name: s.stName, town: s.town, type: s.type, tier: s.tier, walk: s.walk, price: s.price, quiet: !!s.quiet, F, lam, L: Ls, rentBase: L.rentOf(s, P, 0), draws });
}
const pool = out.flatMap((o) => o.draws);
const siteMean = (o, k) => mean(o.draws.map((d) => d[k]));
const fmtTier = Object.entries(P.tier).map(([k, v]) => `${k}:${v.toFixed(2)}`).join(',');
console.log(`置き値の上書き ${JSON.stringify(over)}  K=${K}（seed のずらし ${SO}）  候補地 ${out.length}  P_ref(F=1)=${cal.Pref.toFixed(1)}  eps=${cal.eps.toFixed(3)}  基準の L=${cal.Lref.toFixed(3)}  基準の組=${P.refRivals.join('+')}  週の揺れ=${!!P.noise}`);
console.log(`   段 ${fmtTier}  距離 ${P.dist.map((x) => x.toFixed(2)).join('/')}  参入 p0=${P.p0} p1=${P.p1}${P.entry ? '' : '（参入なし）'}  κ=${P.kappa}（L ${P.Lmode}）  b=${P.b} R0=${P.R0} 下限=${P.floor}  減る費用 ${P.saveMode}（${P.saveMode === 'flat' ? P.save / 1e4 + '万' : `昼${P.hoursL}h・夜${P.hoursN}h`}：パート1人で夜を閉める ${(L.saveOf(P, 1, 'night') / 1e4).toFixed(1)}万・昼を閉める ${(L.saveOf(P, 1, 'lunch') / 1e4).toFixed(1)}万／月）  常連 ${JSON.stringify(P.ret)}`);
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
console.log(`③ 利益の上位50（候補地のくじの平均）：段 ${JSON.stringify(tp)}（${R.c3.tiers}種、目標4以上）・属性 ${JSON.stringify(ta)}（${R.c3.attrs}種、目標4以上）・住宅地か商店街 ${js}（目標8以上）・閑静の枠 ${top.filter((x) => x.quiet).length}`);
console.log('   上位10：' + top.slice(0, 10).map((o) => `${o.name}/${o.town}/${o.type}/段${o.tier}/F${o.F.toFixed(2)}/L${o.L.toFixed(2)}/家賃${(o.rentBase / 1000).toFixed(1)}千/年${(o.op / 1e4).toFixed(0)}万`).join('  '));
const all = pool.map((d) => d.op), mu = mean(all), vt = mean(all.map((v) => (v - mu) ** 2));
const vb = mean(out.map((o) => (siteMean(o, 'op') - mu) ** 2)), vw = mean(out.map((o) => { const m = siteMean(o, 'op'); return mean(o.draws.map((d) => (d.op - m) ** 2)); }));
R.c4 = vw / vt;
console.log(`④ 利益の分散：候補地の間 ${(100 * vb / vt).toFixed(0)}%・同じ候補地のくじの揺れ ${(100 * vw / vt).toFixed(0)}%（目標40%以下。家賃のばらつき±20%と開店のあとの参入も揺れに入る）`);
// ⑤ 1つの世界（くじ k）の上位50：3年目の時点で0軒（版0.6）。主＝3年目の終わり。参考＝3年目の初め・3年目にずっと0軒・開店の前（版0.5 の数え方）
const z = { end: [], r24: [], zero3: [], pre: [], weakEnd: [] }, r0 = [];
for (let k = 0; k < K; k++) { const w = out.map((o) => ({ o, d: o.draws[k] })).sort((a, b) => b.d.op - a.d.op).slice(0, 50); r0.push(w);
  z.end.push(w.filter((x) => x.d.end === 0).length); z.r24.push(w.filter((x) => x.d.r24 === 0).length); z.zero3.push(w.filter((x) => x.d.zero3).length); z.pre.push(w.filter((x) => x.d.n === 0).length);
  z.weakEnd.push(w.filter((x) => x.d.endTypes === '0' || x.d.endTypes === 'k').length); }
R.c5 = Math.max(...z.end);
{ const comp = {}, compE = {}; r0.forEach((w) => w.forEach((x) => { comp[x.d.riv] = (comp[x.d.riv] || 0) + 1; compE[x.d.endTypes] = (compE[x.d.endTypes] || 0) + 1; }));
  console.log(`   1つの世界の上位50のライバルの組（${K}つの世界の合計。c=安売り k=こだわり s=老舗 L=昼だけ）開店の前：` + Object.entries(comp).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}:${v}`).join(' ') + '｜3年目の終わり：' + Object.entries(compE).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}:${v}`).join(' '));
  const ent = r0.flat(); console.log(`   その上位50の参入：1軒以上入った ${(100 * ent.filter((x) => x.d.entries > 0).length / ent.length).toFixed(0)}%・平均 ${mean(ent.map((x) => x.d.entries)).toFixed(2)}軒・月の参入の確率の平均 ${(100 * mean(ent.map((x) => x.d.pMean))).toFixed(2)}%・成功の度合い s の平均 ${mean(ent.map((x) => x.d.sMean)).toFixed(2)}`); }
console.log(`⑤ 1つの世界の上位50のうち、3年目の終わりにライバル0軒 ${z.end.join('/')}（目標15以下）｜3年目の初めに0軒 ${z.r24.join('/')}・3年目にずっと0軒 ${z.zero3.join('/')}・開店の前に0軒（版0.5 の数え方） ${z.pre.join('/')}・3年目の終わりに0軒かこだわり1軒だけ ${z.weakEnd.join('/')}`);
console.log(`   全くじ：開店の前に0軒 ${(100 * pool.filter((d) => d.n === 0).length / pool.length).toFixed(0)}%・3年目の終わりに0軒 ${(100 * pool.filter((d) => d.end === 0).length / pool.length).toFixed(0)}%・開店の前に0軒だった所が3年目の終わりも0軒 ${(100 * pool.filter((d) => d.n === 0 && d.end === 0).length / Math.max(1, pool.filter((d) => d.n === 0).length)).toFixed(0)}%・1軒以上の参入があったくじ ${(100 * pool.filter((d) => d.entries > 0).length / pool.length).toFixed(0)}%`);
// ⑥ 単純な規則：1つの世界で、規則の並べ方で上から10か所を選んだ平均の利益 ÷ その世界の本当の上位10の平均（上手なボット＝見える情報で利益を当てる上限として本当の上位を使う。版0.5 と同じ物差し）。
// 規則が見るのは開店の前に見える数（人通りの倍率・駅の段・家賃・開店の前のくじ）。営業時間の規則は、その営業時間の利益で測り、物差しは「営業時間も選ぶ本当の上位10」。
const best3 = (d) => Math.max(d.op, d.lunch, d.night);
const rentQ25 = q(pool.map((d) => d.rent), 0.25);
const rules = {
  '大きい駅（段5以上、人通りの倍率の大きい順）': [(x) => (x.o.tier >= 5 ? x.o.F : -1), 'op'],
  'ライバル0〜1軒（その中で人通りの倍率の大きい順）': [(x) => (x.d.n <= 1 ? x.o.F : -1), 'op'],
  '家賃が下から25%（その中で人通りの倍率の大きい順）': [(x) => (x.d.rent <= rentQ25 ? x.o.F : -1), 'op'],
  'ライバル0軒（その中で人通りの倍率の大きい順）': [(x) => (x.d.n === 0 ? x.o.F : -1), 'op'],
  '弱いライバルだけ（0軒かこだわり1軒、その中で人通りの倍率の大きい順）': [(x) => (x.d.riv === '0' || x.d.riv === 'k' ? x.o.F : -1), 'op'],
  '人通りだけ（人通りの倍率の大きい順）': [(x) => x.o.F, 'op'],
  '家賃だけ（家賃の安い順）': [(x) => 1e9 - x.d.rent, 'op'],
  '競合だけ（軒数の少ない順→人通り）': [(x) => (10 - x.d.n) * 100 + x.o.F, 'op'],
  '人通り÷家賃（倍率÷坪家賃の大きい順）': [(x) => x.o.F / x.d.rent, 'op'],
  '時間帯：昼の重みの大きい順に昼だけ': [(x) => x.o.L, 'lunch'],
  '時間帯：夜の強い順（L の小さい順）に夜だけ': [(x) => 1 - x.o.L, 'night'],
  '時間帯：昼の重み0.75以上で昼だけ（その中で人通り順）': [(x) => (x.o.L >= 0.75 ? x.o.F : -1), 'lunch'],
};
R.c6 = {};
for (const [nm, [f, key]] of Object.entries(rules)) {
  const ratios = [], rnd = [];
  for (let k = 0; k < K; k++) {
    const w = out.map((o) => ({ o, d: o.draws[k] }));
    const val = (x) => (key === 'op' ? x.d.op : x.d[key]);
    const best = mean(w.map((x) => (key === 'op' ? x.d.op : best3(x.d))).sort((a, b) => b - a).slice(0, 10));
    const pick = w.slice().sort((a, b) => f(b) - f(a)).slice(0, 10); ratios.push(mean(pick.map(val)) / best);
    const sat = w.filter((x) => f(x) >= 0); rnd.push(mean(sat.map(val)) / best);
  }
  R.c6[nm] = mean(ratios);
  console.log(`⑥ ${nm}：上から10か所の利益÷本当の上位10${key === 'op' ? '' : '（営業時間も選ぶ）'} ${ratios.map((x) => (100 * x).toFixed(0) + '%').join('/')}（目標85%未満）・規則を満たす所から無作為に選ぶと ${(100 * mean(rnd)).toFixed(0)}%`);
}
{ const ratios = []; for (let k = 0; k < K; k++) { const w = out.map((o) => o.draws[k]); ratios.push(mean(w.map((d) => d.op).sort((a, b) => b - a).slice(0, 10)) / mean(w.map(best3).sort((a, b) => b - a).slice(0, 10))); }
  console.log(`   参考：通しだけの本当の上位10 ÷ 営業時間も選ぶ本当の上位10 ${ratios.map((x) => (100 * x).toFixed(0) + '%').join('/')}`); }
// ⑦ 営業時間：オフィス街で昼だけ＞通し、繁華街で夜だけ＞通しの割合（閉めて減る費用はくじごとの saveL・saveN）
const ofType = (t) => pool.filter((d, j) => out[Math.floor(j / K)].type === t);
const hours = () => { const f = (t, k) => { const a = ofType(t); return a.filter((d) => (k === 'L' ? d.lunch : d.night) > d.op).length / a.length; }; return { off: f('office', 'L'), hanka: f('hanka', 'N'), offN: f('office', 'N'), hankaL: f('hanka', 'L') }; };
R.c7 = hours();
console.log(`⑦ オフィスで昼だけ＞通し ${(100 * R.c7.off).toFixed(0)}%（目標20%以上）・繁華街で夜だけ＞通し ${(100 * R.c7.hanka).toFixed(0)}%（目標20%以上）｜参考 オフィスで夜だけ＞通し ${(100 * R.c7.offN).toFixed(0)}%・繁華街で昼だけ＞通し ${(100 * R.c7.hankaL).toFixed(0)}%`);
for (const t of ['office', 'shogyo', 'hanka', 'shoten', 'jutaku', 'kojo']) { const a = ofType(t); if (!a.length) continue; const best = (d) => { const v = { 通し: d.op, 昼だけ: d.lunch, 夜だけ: d.night }; return Object.entries(v).sort((x, y) => y[1] - x[1])[0][0]; }; const c = cnt(a, best); const Ls = out.filter((o) => o.type === t).map((o) => o.L); console.log(`   ${t}（L の中央 ${q(Ls, 0.5).toFixed(2)}・幅 ${q(Ls, 0.1).toFixed(2)}〜${q(Ls, 0.9).toFixed(2)}）くじ${a.length}：いちばん得 ${JSON.stringify(c)}・昼の売れた客の中央 ${q(a.map((d) => d.NL), 0.5).toFixed(1)}・夜 ${q(a.map((d) => d.NN), 0.5).toFixed(1)}・昼だけ−通し の中央 ${(q(a.map((d) => d.lunch - d.op), 0.5) / 12e4).toFixed(1)}万円/月・夜だけ−通し ${(q(a.map((d) => d.night - d.op), 0.5) / 12e4).toFixed(1)}万円/月`); }
// ⑧ 上限を越えるくじのうち、パート2人で3年目の利益が上がる割合
const ov = pool.filter((d) => d.p2 != null); R.c8 = ov.length ? ov.filter((d) => d.p2 > d.op).length / ov.length : null;
console.log(`⑧ 需要が70を越えるくじ ${ov.length}：パートを1人足すと3年目の利益が上がる ${R.c8 == null ? '—' : (100 * R.c8).toFixed(0) + '%'}（目標30〜70%）${ov.length ? `・差の中央 ${(q(ov.map((d) => d.p2 - d.op), 0.5) / 1e4).toFixed(0)}万円/年` : ''}`);
// ⑨ 住宅地と繁華街の、1年目→3年目の客数の伸びの比
const g = (t) => q(ofType(t).map((d) => d.N / Math.max(1e-9, d.N1)), 0.5);
const gj = g('jutaku'), gh = g('hanka'), gs = g('shoten'); R.c9 = gj / gh;
console.log(`⑨ 3年目÷1年目の売れた客の中央：住宅地 ${gj.toFixed(2)}・商店街 ${gs.toFixed(2)}・繁華街 ${gh.toFixed(2)}・オフィス ${g('office').toFixed(2)}｜住宅地÷繁華街 ${R.c9.toFixed(2)}（目標1.3以上）`);
// ほかの数
const by = (f) => { const gg = {}; ranked.forEach((o) => (gg[f(o)] = gg[f(o)] || []).push(o)); return Object.entries(gg).map(([k, a]) => `${k}:${a.length}か所 利益${(q(a.map((x) => x.op), 0.5) / 1e4).toFixed(0)}万 客${q(a.map((x) => x.N), 0.5).toFixed(0)} 家賃${(q(a.map((x) => x.rentBase), 0.5) / 1000).toFixed(1)}千/坪`).join(' | '); };
console.log('段ごと（3年目の営業利益の中央値・年）', by((o) => '段' + o.tier));
console.log('属性ごと', by((o) => o.type));
console.log('閑静の枠', by((o) => (o.quiet ? 'quiet' : 'ほか')));
const rk = (a) => { const o = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = Array(a.length); o.forEach((x, k) => (r[x[1]] = k)); return r; };
const sp = (a, b) => { const ra = rk(a), rb = rk(b), n = a.length, m = (n - 1) / 2; let sxy = 0, sx = 0, sy = 0; for (let i = 0; i < n; i++) { sxy += (ra[i] - m) * (rb[i] - m); sx += (ra[i] - m) ** 2; sy += (rb[i] - m) ** 2; } return sxy / Math.sqrt(sx * sy); };
console.log(`利益と人通りの倍率の順位相関 ${sp(ranked.map((o) => o.op), ranked.map((o) => o.F)).toFixed(2)}・利益と地価 ${sp(ranked.map((o) => o.op), ranked.map((o) => o.price)).toFixed(2)}・利益と λ ${sp(ranked.map((o) => o.op), ranked.map((o) => o.lam)).toFixed(2)}・利益と L ${sp(ranked.map((o) => o.op), ranked.map((o) => o.L)).toFixed(2)}`);
const loss = pool.filter((d) => d.op < 0).length / pool.length; R.loss = loss;
console.log(`赤字（3年目の営業利益<0）のくじ ${(100 * loss).toFixed(1)}%・候補地 ${ranked.filter((o) => o.op < 0).length}｜3年目の利益の分布（万円/年）10% ${(q(all, 0.1) / 1e4).toFixed(0)}・25% ${(q(all, 0.25) / 1e4).toFixed(0)}・50% ${(q(all, 0.5) / 1e4).toFixed(0)}・75% ${(q(all, 0.75) / 1e4).toFixed(0)}・90% ${(q(all, 0.9) / 1e4).toFixed(0)}・99% ${(q(all, 0.99) / 1e4).toFixed(0)}・最大 ${(Math.max(...all) / 1e4).toFixed(0)}`);
console.log('開店のあとの参入の軒数ごと', Object.entries(cnt(pool, (d) => d.entries)).map(([n, c]) => `${n}軒:${c} 利益の中央${(q(pool.filter((d) => d.entries == n).map((d) => d.op), 0.5) / 1e4).toFixed(0)}万 赤字${(100 * pool.filter((d) => d.entries == n && d.op < 0).length / c).toFixed(0)}%`).join(' | '));
console.log('ライバルの軒数（開店の前）ごと', Object.entries(cnt(pool, (d) => d.n)).map(([n, c]) => `${n}軒:${c} 利益${(q(pool.filter((d) => d.n == n).map((d) => d.op), 0.5) / 1e4).toFixed(0)}万`).join(' | '));
const pass = { '①': R.c1 >= 40 && R.c1 <= 52, '③': R.c3.tiers >= 4 && R.c3.attrs >= 4 && R.c3.js >= 8, '④': R.c4 <= 0.4, '⑤': R.c5 <= 15, '⑥': Object.values(R.c6).every((x) => x < 0.85), '⑦': R.c7.off >= 0.2 && R.c7.hanka >= 0.2, '⑧': R.c8 != null && R.c8 >= 0.3 && R.c8 <= 0.7, '⑨': R.c9 >= 1.3 };
console.log('判定：' + Object.entries(pass).map(([k, v]) => `${k}${v ? '○' : '×'}`).join(' ') + '（②は目標なし、⑩と効きの向きは dir6.js）');
const c6max = Math.max(...Object.values(R.c6));
console.log('SUMMARY ' + JSON.stringify({ over, K, SO, c1: +R.c1.toFixed(1), c2: +(100 * R.c2).toFixed(1), c3: R.c3, c4: Math.round(100 * R.c4), c5: z.end, c5r24: z.r24, c5pre: z.pre, c6max: Math.round(100 * c6max), c6: Object.values(R.c6).map((v) => Math.round(100 * v)), c7: { off: Math.round(100 * R.c7.off), hanka: Math.round(100 * R.c7.hanka) }, c8: R.c8 == null ? null : Math.round(100 * R.c8), c9: +R.c9.toFixed(2), loss: +(100 * loss).toFixed(1), pass, nPass: Object.values(pass).filter(Boolean).length }));
if (process.env.SAVE) require('fs').writeFileSync(process.env.SAVE, JSON.stringify(out.map((o) => ({ ...o, draws: o.draws.map(({ entryAt, ...d }) => d) }))));
