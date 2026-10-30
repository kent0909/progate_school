// DESIGN-STATIONMAP 版0.4 の 4.1・4.3・4.4 を、いまのゲームの式（js/sim/world.js・rivals.js）にそのまま当てるための共通部品。
// 読み込みは tools/sim-ramen.js と同じ（tools/ramen-files.js の story）。データは js/data/tokyo23.js（453駅・965候補地）。上書きはしない。
global.window = global; const path = require('path'); const root = path.resolve(__dirname, '../../..');
const STORY = require(root + '/tools/ramen-files.js').story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY, 'js/data/tokyo23.js'].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA, Wd = D.world, RV = D.rivals, C = D.coef, T = D.tokyo23; if (D.y2) D.y2.stream = null;
const ST = Object.fromEntries(T.stations.map((s) => [s.id, s]));
// ---- 4.1 人通りの倍率（版0.4 の初めの置き値）----
const DEF = {
  tier: { 1: 0.7, 2: 0.8, 3: 0.9, 4: 1.0, 5: 1.15, 6: 1.3, 8: 1.5 },
  dist: (w) => (w <= 200 ? 1.15 : w <= 500 ? 1.0 : 0.8),
  attr: { hanka: 1.15, shogyo: 1.1, office: 1.0, shoten: 1.0, jutaku: 0.8, kojo: 0.6 },
  // 4.3 ライバルの軒数 λ（段×属性）・上限5
  lamTier: { 1: 0.3, 2: 0.5, 3: 0.8, 4: 1.1, 5: 1.5, 6: 2.0, 8: 2.6 },
  lamAttr: { hanka: 1.4, shogyo: 1.2, office: 1.0, shoten: 1.0, jutaku: 0.6, kojo: 0.4 },
  lamCap: 5, lamMul: 1,
  // 型の重み（cheap,kodawari,shinise）。shogyo・kojo は設計書にないので、shogyo＝オフィス、kojo＝住宅地と置いた【検査役の置き方】
  w: { hanka: [0.4, 0.4, 0.2], office: [0.5, 0.3, 0.2], shogyo: [0.5, 0.3, 0.2], shoten: [0.3, 0.3, 0.4], jutaku: [0.3, 0.3, 0.4], kojo: [0.3, 0.3, 0.4] },
  // 4.4 家賃
  R0: 28000, b: 0.25, floor: 13000, rentSpread: 0.2,
  // 4.2 基準の候補地のライバル（初めの置き値：安売り1・老舗1）
  refRivals: ['cheap', 'shinise'], target: 44,
};
// 属性 → いまの AREAS のキー（4.6 の読み替え。客層の混ざり・週末の倍率・暦はこれで決まる。設計書 版0.4 は属性ごとの客層を書いていない）
const KEY = { hanka: 'ekimae', shogyo: 'ekimae', office: 'ekimae', shoten: 'shotengai', jutaku: 'jutaku', kojo: 'jutaku' };
const sites = T.sites.map((s) => ({ ...s, pins: ST[s.st].pins, riders: ST[s.st].riders }));
const Fsite = (s, P = DEF) => P.tier[s.pins] * P.dist(s.walk) * P.attr[s.type];
const rentOf = (s, P = DEF, u = 0) => Math.max(P.floor, P.R0 * Math.pow(s.price / 1e7, P.b)) * (1 + P.rentSpread * u);
const lamOf = (s, P = DEF) => P.lamTier[s.pins] * P.lamAttr[s.type] * P.lamMul;
function poisson(rng, lam) { const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= rng(); } while (p > L); return k - 1; }
function drawRivals(s, seed, P = DEF) { const rng = D.rng(seed); const n = Math.min(P.lamCap, poisson(rng, lamOf(s, P))); const w = P.w[s.type]; const out = []; for (let i = 0; i < n; i++) { const x = rng(); out.push(x < w[0] ? 'cheap' : x < w[0] + w[1] ? 'kodawari' : 'shinise'); } return out; }
const rs = (r) => ({ id: r.id, price: r.price, R: r.R, A: r.A, L: r.L, bowl: r.bowl, type: r.type, Q: r.Q, rival: true, open: true });
const idle = (W) => { const p = Wd.policy0(W, null, { neutral: true }); for (const k of Wd.TIME_KEYS) p[k] = false; return { ...p, price: 850, parts: 1, family: 0, map: true, line: false, prep: 'mid', flyer: 0, borrow: false }; };
const refStore = (a) => ({ id: 'ref', price: a.pRef, R: 3, A: 0, L: 0, bowl: D.bowl.create(D.bowl.presets[0].spec), parts: 1, family: 0 });
// 世界を作る：P は外から与える（4.2 の「1回だけの逆算」）。epsScale も基準の候補地で1回（E.eps）
function makeWorld(key, Pabs, rivals, eps, rentPerTsubo) {
  const W = Wd.create({ seed: 0, area: key }); const a = W.town.areas[key];
  a.potentialMul = 1; a.P = Pabs; if (eps) a.epsScale = eps;
  W.rivals = rivals.map((t, k) => RV.make(t, k)); W.events = []; // 行事は外す（期待値の比較）
  W.otherFixed = C('otherFixed');
  W.rentMul = rentPerTsubo / C('rentPerTsubo')[key];
  return W;
}
// 36か月を期待値で回し、3年目の値を返す
function run36(W, pol = idle) {
  let x = W, y = { N: 0, dem: 0, op: 0, rent: 0, lost: 0, full: 0, Nnew: 0 };
  for (let k = 0; k < 36; k++) { const r = Wd.month(x, pol(x), { noise: false, noCards: true, noFactors: true, rng: D.rng(90001 + k) }); if (k >= 24) { y.N += r.res.N / 12; y.dem += r.res.demand / 12; y.op += r.res.op; y.rent += r.res.rent; y.lost += r.res.lost; y.full += r.res.fullDays / 12; } x = r.W; }
  y.L = x.stores[0].L; y.openRivals = x.rivals.filter((r) => r.open !== false).length; return y;
}
// 4.2 の較正：基準の候補地（段3・〜500m・商店街・基準のライバル）で、3年目の売れた客＝target になる P_ref（F=1 あたり）を二分法で
function calibrate(P = DEF) {
  const key = 'shotengai', Fb = P.tier[3] * 1.0 * P.attr.shoten;
  const W0 = Wd.create({ seed: 0, area: key }); const a = W0.town.areas[key];
  const sh = Wd.sharesFor(W0, [refStore(a), ...P.refRivals.map((t, k) => rs(RV.make(t, k)))], { neutralFit: true })[0];
  const eps = 1 / Math.max(0.5, 1 - sh);
  const rentB = 12000; // 基準の候補地の家賃は客数に効かない
  let lo = 10, hi = 5000;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; const y = run36(makeWorld(key, mid * Fb, P.refRivals, eps, rentB)); if (y.N < P.target) lo = mid; else hi = mid; }
  return { Pref: (lo + hi) / 2, eps, Fb, shRef: sh };
}
module.exports = { D, Wd, RV, C, T, ST, DEF, KEY, sites, Fsite, rentOf, lamOf, drawRivals, makeWorld, run36, calibrate, rs, refStore, idle, poisson };
