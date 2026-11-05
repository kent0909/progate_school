// DESIGN-STATIONMAP 版0.5 の 4.1〜4.4・4.7 を、いまの js/sim の式に当てて、6章の検査①③④⑤を測る（判定役の検算）。
// 版0.4 の論証の台本（docs/analysis/stationmap-v04-reasoning/lib.js・i_all.js）を版0.5 に合わせて作り直した。
// 版0.4 の台本との違い：段は tier（閑静の枠で pins が9の渋谷がある）／軒数＝round(λ)±1（0.2・0.6・0.2）／開店のあとの参入 毎月 0.01×λ（上限5）／
// 相場の値段 pRef を属性ごとの値に毎月固定（world.js:377 は0軒だと price0 に戻すので、毎月その前に置き直す）／客層と暦は 4.1 の表（AREAS に属性のキーを足す）／
// 常連 retain・churn に 4.7 の倍率。営業時間（4.5）は入れていない（実装がない）。リポジトリのデータ・コードは書き換えない（読み込んだ表をこのプロセスの中だけで足す）。
// 使い方：node sim05.js [K] [変える値の JSON]  例：node sim05.js 6 '{"b":0.4}'
global.window = global; const path = require('path'); const root = path.resolve(__dirname, '../../..');
const STORY = require(root + '/tools/ramen-files.js').story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY, process.env.DATA || 'js/data/tokyo23.js'].forEach((f) => require(path.isAbsolute(f) ? f : path.join(root, f)));
const D = window.SIMDATA, Wd = D.world, RV = D.rivals, C = D.coef, T = D.tokyo23; if (D.y2) D.y2.stream = null;
const ST = Object.fromEntries(T.stations.map((s) => [s.id, s]));
const K = +(process.argv[2] || 6); const over = JSON.parse(process.argv[3] || '{}');
const P = {
  tier: { 1: 0.7, 2: 0.8, 3: 0.9, 4: 1.0, 5: 1.15, 6: 1.3, 8: 1.5 },
  dist: (w) => (w <= 200 ? 1.15 : w <= 500 ? 1.0 : 0.8),
  attr: { hanka: 1.15, shogyo: 1.1, office: 1.0, shoten: 1.0, jutaku: 0.8, kojo: 0.6 },
  lamTier: { 1: 0.3, 2: 0.5, 3: 0.8, 4: 1.1, 5: 1.5, 6: 2.0, 8: 2.6 },
  lamAttr: { hanka: 1.4, shogyo: 1.2, office: 1.0, shoten: 1.0, jutaku: 0.6, kojo: 0.4 },
  w: { hanka: [0.4, 0.4, 0.2], shogyo: [0.5, 0.3, 0.2], office: [0.5, 0.3, 0.2], shoten: [0.3, 0.3, 0.4], jutaku: [0.3, 0.3, 0.4], kojo: [0.3, 0.3, 0.4] },
  count: 'pm1', entry: 0.01, cap: 5,
  pref: { office: 900, shogyo: 900, hanka: 950, shoten: 850, jutaku: 850, kojo: 800 },
  mix: { office: [0.70, 0.10, 0.05, 0.15], shogyo: [0.50, 0.25, 0.10, 0.15], hanka: [0.35, 0.15, 0.20, 0.30], shoten: [0.30, 0.55, 0.10, 0.05], jutaku: [0.15, 0.75, 0.10, 0], kojo: [0.60, 0.30, 0.10, 0] },
  cal: { office: 'office', shogyo: 'shoten', hanka: 'kanko', shoten: 'shoten', jutaku: 'jutaku', kojo: 'office' },
  ret: { jutaku: [1.3, 0.8], shoten: [1.2, 0.85], shogyo: [1, 1], office: [0.9, 1.1], hanka: [0.7, 1.25], kojo: [1.1, 0.9] },
  R0: 28000, b: 0.25, floor: 13000, rentSpread: 0.2, refRivals: ['shinise'], target: 44, useMix: true, useRet: true,
  ...over,
};
if (over.distSet) { const [a, b, c] = over.distSet; P.dist = (w) => (w <= 200 ? a : w <= 500 ? b : c); }
if (over.tierSet) P.tier = { ...P.tier, ...over.tierSet }; if (over.attrSet) P.attr = { ...P.attr, ...over.attrSet };
if (over.noRet) P.useRet = false; if (over.noMix) P.useMix = false;
// 属性のキーを AREAS と、エリアで引く係数の表に足す（このプロセスの中だけ）
const TBL = C.table || null;
for (const ty of Object.keys(P.mix)) {
  const m = P.mix[ty], key = 'a_' + ty;
  Wd.AREAS[key] = P.useMix ? { label: ty, mix: { office: m[0], family: m[1], student: m[2], tourist: m[3] }, cal: P.cal[ty] } : { ...Wd.AREAS[{ hanka: 'ekimae', shogyo: 'ekimae', office: 'ekimae', shoten: 'shotengai', jutaku: 'jutaku', kojo: 'jutaku' }[ty]] };
  C('rentPerTsubo')[key] = 12000; C('areaSign')[key] = 1;
}
const retain0 = C('retain'), churn0 = C('churn');
const setRet = (ty) => { const r = P.useRet ? P.ret[ty] : [1, 1]; const t = TBL || C.T; if (!t) throw new Error('coef table not found'); t.retain.v = retain0 * r[0]; t.churn.v = churn0 * r[1]; };
const sites = T.sites.map((s) => ({ ...s, tier: ST[s.st].tier }));
const Fsite = (s) => P.tier[s.tier] * P.dist(s.walk) * P.attr[s.type];
const rentOf = (s, u = 0) => Math.max(P.floor, P.R0 * Math.pow(s.price / 1e7, P.b)) * (1 + P.rentSpread * u);
const lamOf = (s) => P.lamTier[s.tier] * P.lamAttr[s.type];
const pickType = (rng, ty) => { const w = P.w[ty], x = rng(); return x < w[0] ? 'cheap' : x < w[0] + w[1] ? 'kodawari' : 'shinise'; };
function poisson(rng, lam) { const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= rng(); } while (p > L); return k - 1; }
function drawRivals(s, seed) {
  const rng = D.rng(seed), lam = lamOf(s); let n;
  if (P.count === 'pm1') { const c = Math.round(lam), x = rng(); n = Math.max(0, c + (x < 0.2 ? -1 : x < 0.8 ? 0 : 1)); }
  else if (P.count === 'round') n = Math.round(lam); else n = poisson(rng, lam);
  n = Math.min(P.cap, n); const out = []; for (let i = 0; i < n; i++) out.push(pickType(rng, s.type)); return out;
}
const rs = (r) => ({ id: r.id, price: r.price, R: r.R, A: r.A, L: r.L, bowl: r.bowl, type: r.type, Q: r.Q, rival: true, open: true });
const idle = (W) => { const p = Wd.policy0(W, null, { neutral: true }); for (const k of Wd.TIME_KEYS) p[k] = false; return { ...p, price: 850, parts: 1, family: 0, map: true, line: false, prep: 'mid', flyer: 0, borrow: false }; };
function makeWorld(ty, Pabs, rivals, eps, rentPerTsubo) {
  const key = 'a_' + ty; const W = Wd.create({ seed: 0, area: key }); const a = W.town.areas[key];
  a.potentialMul = 1; a.P = Pabs; if (eps) a.epsScale = eps; a.pRef = P.pref[ty];
  W.rivals = rivals.map((t, k) => RV.make(t, k)); W.events = []; W.otherFixed = C('otherFixed');
  W.rentMul = rentPerTsubo / 12000; return W;
}
function run36(W, ty, entry) {
  const key = 'a_' + ty; setRet(ty);
  let x = W, y = { N: 0, dem: 0, op: 0, rent: 0, entered: 0, N1: 0 };
  for (let k = 0; k < 36; k++) {
    x.town.areas[key].pRef = P.pref[ty];
    if (entry) { const u = entry.rng(); const open = x.rivals.filter((r) => r.open !== false).length; if (u < entry.p && open < P.cap) { x.rivals.push(RV.make(pickType(entry.rng, ty), x.rivals.length)); y.entered++; } }
    const r = Wd.month(x, idle(x), { noise: false, noCards: true, noFactors: true, rng: D.rng(90001 + k) });
    if (k < 12) y.N1 += r.res.N / 12; if (k >= 24) { y.N += r.res.N / 12; y.dem += r.res.demand / 12; y.op += r.res.op; y.rent += r.res.rent; }
    x = r.W;
  }
  y.nEnd = x.rivals.filter((r) => r.open !== false).length; return y;
}
function calibrate() {
  const ty = 'shoten', Fb = P.tier[3] * 1.0 * P.attr.shoten;
  const W0 = makeWorld(ty, 1, [], null, 12000); const a = W0.town.areas['a_' + ty];
  const ref = { id: 'ref', price: a.pRef, R: 3, A: 0, L: 0, bowl: D.bowl.create(D.bowl.presets[0].spec), parts: 1, family: 0 };
  const sh = Wd.sharesFor(W0, [ref, ...P.refRivals.map((t, k) => rs(RV.make(t, k)))], { neutralFit: true })[0];
  const eps = 1 / Math.max(0.5, 1 - sh);
  let lo = 10, hi = 5000;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; const y = run36(makeWorld(ty, mid * Fb, P.refRivals, eps, 12000), ty, null); if (y.N < P.target) lo = mid; else hi = mid; }
  return { Pref: (lo + hi) / 2, eps };
}
const cal = calibrate(); if (P.Pmul) cal.Pref *= P.Pmul;
const out = [];
for (let i = 0; i < sites.length; i++) {
  const s = sites[i], F = Fsite(s), draws = [];
  for (let k = 0; k < K; k++) {
    const riv = drawRivals(s, 7000 + i * 101 + k);
    const u = D.rng(5000 + i * 37 + k)() * 2 - 1;
    const rent = rentOf(s, P.rentSpread ? u : 0);
    const entry = P.entry ? { p: P.entry * lamOf(s), rng: D.rng(3000 + i * 53 + k) } : null;
    const y = run36(makeWorld(s.type, cal.Pref * F, riv, cal.eps, rent), s.type, entry);
    draws.push({ N1: y.N1, n: riv.length, riv: riv.slice().sort().join('+') || '0', N: y.N, dem: y.dem, op: y.op, entered: y.entered, nEnd: y.nEnd });
  }
  out.push({ id: s.id, st: s.st, name: ST[s.st].name, town: s.town, type: s.type, tier: s.tier, walk: s.walk, price: s.price, quiet: !!s.quiet, F, rentBase: rentOf(s, 0), draws });
}
const mean = (a) => a.reduce((t, v) => t + v, 0) / a.length;
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
const sm = (o, k) => mean(o.draws.map((d) => d[k]));
const pool = out.flatMap((o) => o.draws);
console.log(`版0.5 の検算 ${JSON.stringify(over)} K=${K} 候補地 ${out.length} P_ref=${cal.Pref.toFixed(1)} eps=${cal.eps.toFixed(3)}`);
console.log(`① 3年目の売れた客/日の中央値（全くじ） ${q(pool.map((d) => d.N), 0.5).toFixed(1)}・需要 ${q(pool.map((d) => d.dem), 0.5).toFixed(1)}`);
console.log(`② 需要が70を越える：くじの ${(100 * pool.filter((d) => d.dem > 70).length / pool.length).toFixed(1)}%・候補地の平均で ${out.filter((o) => sm(o, 'dem') > 70).length}/${out.length}`);
const ranked = out.map((o) => ({ ...o, op: sm(o, 'op'), N: sm(o, 'N') })).sort((a, b) => b.op - a.op);
const top = ranked.slice(0, 50), cnt = (arr, f) => arr.reduce((m, x) => ((m[f(x)] = (m[f(x)] || 0) + 1), m), {});
const tp = cnt(top, (x) => x.tier), ta = cnt(top, (x) => x.type);
console.log(`③ 利益の上位50（くじの平均）：段 ${JSON.stringify(tp)}（${Object.keys(tp).length}種）・属性 ${JSON.stringify(ta)}（${Object.keys(ta).length}種）・住宅地か商店街 ${(ta.jutaku || 0) + (ta.shoten || 0)}`);
console.log('   上位10：' + top.slice(0, 10).map((o) => `${o.name}/${o.town}/${o.type}/段${o.tier}/年${(o.op / 1e4).toFixed(0)}万`).join('  '));
const all = pool.map((d) => d.op), m0 = mean(all), vt = mean(all.map((v) => (v - m0) ** 2));
const vb = mean(out.map((o) => (sm(o, 'op') - m0) ** 2)), vw = mean(out.map((o) => { const m = sm(o, 'op'); return mean(o.draws.map((d) => (d.op - m) ** 2)); }));
console.log(`④ 利益の分散：候補地の間 ${(100 * vb / vt).toFixed(0)}%・候補地の中（くじ） ${(100 * vw / vt).toFixed(0)}%`);
const r0 = []; for (let k = 0; k < K; k++) { const w = out.map((o) => ({ o, d: o.draws[k] })).sort((a, b) => b.d.op - a.d.op).slice(0, 50); r0.push({ z: w.filter((x) => x.d.n === 0).length, js: w.filter((x) => ['jutaku', 'shoten'].includes(x.o.type)).length }); }
console.log(`⑤ 1つの世界の上位50でライバル0軒（開店のとき） ${r0.map((x) => x.z).join('/')}・住宅地か商店街 ${r0.map((x) => x.js).join('/')}・全体の0軒の割合 ${(100 * pool.filter((d) => d.n === 0).length / pool.length).toFixed(0)}%`);
console.log(`参入：3年で1軒以上入ったくじ ${(100 * pool.filter((d) => d.entered > 0).length / pool.length).toFixed(0)}%・0軒で始まったくじのうち入った ${(100 * pool.filter((d) => d.n === 0 && d.entered > 0).length / Math.max(1, pool.filter((d) => d.n === 0).length)).toFixed(0)}%`);
const by = (f) => { const g = {}; ranked.forEach((o) => (g[f(o)] = g[f(o)] || []).push(o)); return Object.entries(g).map(([k, a]) => `${k}:${a.length} 利益${(q(a.map((x) => x.op), 0.5) / 1e4).toFixed(0)}万 客${q(a.map((x) => x.N), 0.5).toFixed(0)}`).join(' | '); };
console.log('段ごと', by((o) => '段' + o.tier)); console.log('属性ごと', by((o) => o.type));
console.log('軒数ごと（くじ）', Object.entries(cnt(pool, (d) => d.n)).map(([n, c]) => `${n}軒:${c} 利益${(q(pool.filter((d) => d.n == n).map((d) => d.op), 0.5) / 1e4).toFixed(0)}万`).join(' | '));
console.log(`赤字のくじ ${(100 * pool.filter((d) => d.op < 0).length / pool.length).toFixed(1)}%`);
console.log('閑静の枠', ranked.filter((o) => o.quiet).map((o) => `${o.name}/${o.town} 順位${ranked.indexOf(o) + 1} 客${o.N.toFixed(0)} 年${(o.op / 1e4).toFixed(0)}万`).join('  '));
// ⑥ 単純な規則：段5以上／ライバル0〜1軒／家賃が下から25%。各世界で規則に合う候補地のうち利益最大を選ぶ（規則の中で一番よい所を選べた場合）、上手なボット＝全候補地の最大
const rentQ = q(out.map((o) => o.rentBase), 0.25); const rules = { 段5以上: (o, d) => o.tier >= 5, ライバル0から1: (o, d) => d.n <= 1, 家賃下25: (o, d) => o.rentBase <= rentQ };
for (const [nm, f] of Object.entries(rules)) { const rat = []; for (let k = 0; k < K; k++) { const best = Math.max(...out.map((o) => o.draws[k].op)); const sub = out.filter((o) => f(o, o.draws[k])).map((o) => o.draws[k].op); const medSub = q(sub, 0.5); rat.push((medSub / best).toFixed(2)); } console.log(`⑥ 規則「${nm}」に合う候補地の利益の中央値 ÷ 全体の最大：${rat.join('/')}`); }
const ratio = (ty) => q(out.filter((o) => o.type === ty).map((o) => sm(o, 'N') / Math.max(1e-9, sm(o, 'N1'))), 0.5);
console.log('⑨ 3年目÷1年目の客の中央値：' + ['jutaku', 'shoten', 'shogyo', 'office', 'hanka', 'kojo'].map((t) => `${t} ${ratio(t).toFixed(2)}`).join(' ') + `・住宅地÷繁華街 ${(ratio('jutaku') / ratio('hanka')).toFixed(2)}`);
console.log('② の候補地（需要の平均>70）：' + out.filter((o) => sm(o, 'dem') > 70).map((o) => `${o.name}/${o.town}/${o.type}/段${o.tier}/需要${sm(o, 'dem').toFixed(0)}`).join('  '));
console.log('需要>70 のくじの数 ' + pool.filter((d) => d.dem > 70).length + '・属性 ' + JSON.stringify(cnt(out.flatMap((o) => o.draws.filter((d) => d.dem > 70).map(() => o.type)), (x) => x)));
