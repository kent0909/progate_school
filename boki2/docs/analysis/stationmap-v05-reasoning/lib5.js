// DESIGN-STATIONMAP 版0.5 の 4章（4.1〜4.7）の初めの置き値を、いまのゲームの式（js/sim/world.js・rivals.js・coef.js）にそのまま当てる共通部品。
// 論証の検査（docs/audit/DESIGN-STATIONMAP-v05-reasoning.md）の数字の論証のために、検査役が書いた。ゲームのファイル・データは書き換えない
// （coef の値は1か所ずつ一時的に変えて、元に戻す）。データは js/data/tokyo23.js（452駅・886候補地・foot・tier・quiet）。
// 前の検査の台本（../stationmap-v04-reasoning/lib.js）からの違い：
//   段は tier（乗り換えを除いた foot の段。閑静の枠でピンが増えても変わらない）、客層の混ざり・暦・昼の重み L・相場の値段は 4.1 の表で属性ごと、
//   相場の値段は固定（4.3）、軒数は四捨五入の中心±1（0.2・0.6・0.2）、開店のあとの参入（月 0.01×λ）、老舗の3割は昼だけ（4.5）、
//   昼と夜を2つの世界に分けて回す（4.5：新規は N×L と N×(1−L)、常連も昼と夜に分けて持つ、席と人の上限は昼0.45・夜0.55）、
//   常連の入り方 retain・離れ方 churn に属性の倍率（4.7）。
global.window = global; const path = require('path'); const root = path.resolve(__dirname, '../../..');
const STORY = require(root + '/tools/ramen-files.js').story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY, 'js/data/tokyo23.js'].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA, Wd = D.world, RV = D.rivals, C = D.coef, T = D.tokyo23; if (D.y2) D.y2.stream = null;
const ST = Object.fromEntries(T.stations.map((s) => [s.id, s]));
const TYPES3 = ['cheap', 'kodawari', 'shinise'];
// ---- 版0.5 4章の初めの置き値 ----
const DEF = {
  // 4.1 人通りの倍率 F＝段×距離×属性（段は station.tier）
  tier: { 1: 0.7, 2: 0.8, 3: 0.9, 4: 1.0, 5: 1.15, 6: 1.3, 8: 1.5 },
  dist: [1.15, 1.0, 0.8], // 〜200m・〜500m・501m〜
  attr: { hanka: 1.15, shogyo: 1.1, office: 1.0, shoten: 1.0, jutaku: 0.8, kojo: 0.6 },
  // 4.1 の表：客層の混ざり・暦・昼の重み L・相場の値段 pRef
  mix: {
    office: { office: 0.70, family: 0.10, student: 0.05, tourist: 0.15 },
    shogyo: { office: 0.50, family: 0.25, student: 0.10, tourist: 0.15 },
    hanka: { office: 0.35, family: 0.15, student: 0.20, tourist: 0.30 },
    shoten: { office: 0.30, family: 0.55, student: 0.10, tourist: 0.05 },
    jutaku: { office: 0.15, family: 0.75, student: 0.10, tourist: 0 },
    kojo: { office: 0.60, family: 0.30, student: 0.10, tourist: 0 },
  },
  cal: { office: 'office', shogyo: 'shoten', hanka: 'kanko', shoten: 'shoten', jutaku: 'jutaku', kojo: 'office' },
  L: { office: 0.75, shogyo: 0.55, hanka: 0.30, shoten: 0.50, jutaku: 0.35, kojo: 0.85 },
  pRef: { office: 900, shogyo: 900, hanka: 950, shoten: 850, jutaku: 850, kojo: 800 },
  pRefFixed: true,
  // 4.3 ライバル
  lamTier: { 1: 0.3, 2: 0.5, 3: 0.8, 4: 1.1, 5: 1.5, 6: 2.0, 8: 2.6 },
  lamAttr: { hanka: 1.4, shogyo: 1.2, office: 1.0, shoten: 1.0, jutaku: 0.6, kojo: 0.4 },
  lamCap: 5, lamMul: 1, countMode: 'pm1', pm: [0.2, 0.6, 0.2],
  w: { hanka: [0.4, 0.4, 0.2], office: [0.5, 0.3, 0.2], shogyo: [0.5, 0.3, 0.2], shoten: [0.3, 0.3, 0.4], jutaku: [0.3, 0.3, 0.4], kojo: [0.3, 0.3, 0.4] },
  entry: 0.01, // 開店のあとの参入：毎月 0.01×λ
  shiniseLunch: 0.3, // 老舗の3割は昼だけ（4.5）
  // 4.4 家賃
  R0: 28000, b: 0.25, floor: 13000, rentSpread: 0.2,
  // 4.5 営業時間
  split: true, capLunch: 0.45, save: 160000,
  // 4.7 常連の倍率 [retain, churn]
  ret: { jutaku: [1.3, 0.8], shoten: [1.2, 0.85], shogyo: [1.0, 1.0], office: [0.9, 1.1], hanka: [0.7, 1.25], kojo: [1.1, 0.9] },
  // 4.2 較正：基準の候補地（段3・〜500m・商店街）・老舗1軒（通し）・平均の店の3年目の売れた客 44人/日
  refRivals: ['shinise'], target: 44,
};
// 属性 → いまの AREAS のキー（4.8 の読み替え：家賃の表のキー・看板の倍率だけに使う。客層・暦は 4.1 の表で上書き）
const KEY = { hanka: 'ekimae', shogyo: 'ekimae', office: 'ekimae', shoten: 'shotengai', jutaku: 'jutaku', kojo: 'jutaku' };
const sites = T.sites.map((s) => ({ ...s, tier: ST[s.st].tier, foot: ST[s.st].foot, riders: ST[s.st].riders, stName: ST[s.st].name }));
const distIdx = (w) => (w <= 200 ? 0 : w <= 500 ? 1 : 2);
const Fsite = (s, P) => P.tier[s.tier] * P.dist[distIdx(s.walk)] * P.attr[s.type];
const rentOf = (s, P, u = 0) => Math.max(P.floor, P.R0 * Math.pow(s.price / 1e7, P.b)) * (1 + P.rentSpread * u);
const lamOf = (s, P) => P.lamTier[s.tier] * P.lamAttr[s.type] * P.lamMul;
function poisson(rng, lam) { const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= rng(); } while (p > L); return k - 1; }
const pickType = (rng, w) => { const x = rng(); return x < w[0] ? 'cheap' : x < w[0] + w[1] ? 'kodawari' : 'shinise'; };
// 開店の前のくじ：軒数（中心±1）・型・営業時間（老舗の3割は昼だけ）
function drawRivals(s, seed, P) {
  const rng = D.rng(seed), lam = lamOf(s, P), c = Math.max(P.cMin || 0, Math.round(lam)); // cMin：中心の下限（検査役の試し。設計にない）
  let n;
  if (P.countMode === 'poisson') n = poisson(rng, lam);
  else if (P.countMode === 'round') n = c;
  else { const x = rng(); n = x < P.pm[0] ? c - 1 : x < P.pm[0] + P.pm[1] ? c : c + 1; }
  n = Math.max(0, Math.min(P.lamCap, n));
  const out = []; for (let i = 0; i < n; i++) { const t = pickType(rng, P.w[s.type]); out.push({ type: t, lunchOnly: t === 'shinise' && rng() < P.shiniseLunch }); }
  return out;
}
const idle = (parts) => (W) => { const p = Wd.policy0(W, null, { neutral: true }); for (const k of Wd.TIME_KEYS) p[k] = false; return { ...p, price: 850, parts, family: 0, map: true, line: false, prep: 'mid', flyer: 0, borrow: false }; };
const BIG = 1e15;
function mkRival(spec, k) { const r = RV.make(spec.type, k); r.lunchOnly = !!spec.lunchOnly; r.cash = BIG; return r; }
function makeWorld(attr, Pabs, rivals, eps, rentPerTsubo, P) {
  const key = KEY[attr];
  const W = Wd.create({ seed: 0, area: key }); const a = W.town.areas[key];
  a.mix = { ...P.mix[attr] }; a.cal = P.cal[attr];
  a.potentialMul = 1; a.P = Pabs; if (eps) a.epsScale = eps;
  a.pRef = P.pRefFixed ? P.pRef[attr] : C('price0');
  W.rivals = rivals.map((r) => JSON.parse(JSON.stringify(r))); W.events = [];
  W.otherFixed = C('otherFixed');
  W.rentMul = rentPerTsubo / C('rentPerTsubo')[key];
  return W;
}
// coef を一時的に変える（席と人の上限・常連の倍率）
const T0 = { capBy: C('capBy').slice(), capSeat: C('capSeat'), retain: C('retain'), churn: C('churn'), pRefStep: C('pRefStep') };
function setCap(mul) { C.table.capBy.v = T0.capBy.map((x) => x * mul); C.table.capSeat.v = T0.capSeat * mul; }
function setRet(attr, P) { const m = P.ret[attr] || [1, 1]; C.table.retain.v = T0.retain * m[0]; C.table.churn.v = T0.churn * m[1]; }
function restore() { C.table.capBy.v = T0.capBy.slice(); C.table.capSeat.v = T0.capSeat; C.table.retain.v = T0.retain; C.table.churn.v = T0.churn; C.table.pRefStep.v = T0.pRefStep; }
// 1つの候補地・1つのくじを36か月（期待値：週の揺れ・札・行事なし）。昼と夜を2つの世界で回し、店の固定費は1回だけ数える。
// 返す値：3年目の 通し・昼だけ・夜だけ の営業利益（年）、売れた客/日（昼・夜）、需要/日、1年目の売れた客/日、ライバルの数
function runSite(o) {
  const { attr, Pabs, rivals, eps, rent, P } = o, parts = o.parts || 1;
  const L = P.split ? P.L[attr] : 1;
  const erng = D.rng(o.entrySeed || 1);
  let nid = rivals.length;
  const rl = rivals.map((r, k) => mkRival(r, k));
  let xl = makeWorld(attr, Pabs * L, rl, eps, rent, P);
  let xn = P.split ? makeWorld(attr, Pabs * (1 - L), rl.filter((r) => !r.lunchOnly), eps, rent, P) : null;
  const cash = Object.fromEntries(rl.map((r) => [r.id, RV.TYPES[r.type].cash]));
  const y = { opL: 0, opN: 0, fixed: 0, NL: 0, NN: 0, demL: 0, demN: 0, N1: 0, lost: 0 };
  setRet(attr, P); if (P.pRefFixed) C.table.pRefStep.v = 0; else C.table.pRefStep.v = T0.pRefStep;
  const pol = idle(parts), opts = (k) => ({ noise: false, noCards: true, noFactors: true, rng: D.rng(90001 + k) });
  for (let k = 0; k < 36; k++) {
    // 開店のあとの参入（毎月 0.01×λ、上限5）
    if (P.entry) {
      const open = xl.rivals.filter((r) => r.open !== false).length;
      const u = erng(); const ty = pickType(erng, P.w[attr]); const lo = ty === 'shinise' && erng() < P.shiniseLunch;
      if (open < P.lamCap && u < P.entry * o.lam) { const r = mkRival({ type: ty, lunchOnly: lo }, nid++); r.id = 'e' + r.id; cash[r.id] = RV.TYPES[ty].cash; xl.rivals.push(r); if (xn && !lo) xn.rivals.push(JSON.parse(JSON.stringify(r))); }
    }
    if (o.hook) o.hook(k, xl, xn);
    setCap(P.split ? P.capLunch : 1);
    const a = Wd.month(xl, pol(xl), opts(k)); xl = a.W;
    let b = null; if (xn) { setCap(1 - P.capLunch); b = Wd.month(xn, pol(xn), opts(k)); xn = b.W; }
    setCap(1);
    if (P.pRefFixed) { xl.town.areas[KEY[attr]].pRef = P.pRef[attr]; if (xn) xn.town.areas[KEY[attr]].pRef = P.pRef[attr]; }
    // ライバルの口座：昼と夜の世界の損益を足し、固定費は1回だけ。-300万で両方の世界から撤退（rivals.settle と同じ線）
    for (const r of xl.rivals) {
      if (r.open === false) continue; const TT = RV.TYPES[r.type];
      const rn = xn ? xn.rivals.find((q) => q.id === r.id) : null;
      const fx = TT.labor + TT.rent + 150000 + C('utilFixed');
      const tot = (r.lastOp || 0) + (rn && rn.open !== false ? (rn.lastOp || 0) + fx : 0);
      cash[r.id] += tot; r.cash = BIG; if (rn) rn.cash = BIG;
      if (cash[r.id] < -3000000) { r.open = false; if (rn) rn.open = false; }
    }
    const fixed = a.res.labor + a.res.rent + C('utilFixed') + a.res.other + a.res.dep + a.res.ads;
    if (k < 12) y.N1 += (a.res.N + (b ? b.res.N : 0)) / 12;
    if (k >= 24) { y.opL += a.res.op; y.opN += b ? b.res.op : 0; y.fixed += fixed; y.NL += a.res.N / 12; y.NN += b ? b.res.N / 12 : 0; y.demL += a.res.demand / 12; y.demN += b ? b.res.demand / 12 : 0; y.lost += (a.res.lost + (b ? b.res.lost : 0)) / 12; }
  }
  restore();
  const save12 = (o.save != null ? o.save : P.save) * 12;
  y.thru = xn ? y.opL + y.opN + y.fixed : y.opL; y.lunch = y.opL + save12; y.night = xn ? y.opN + save12 : -Infinity;
  y.N = y.NL + y.NN; y.dem = y.demL + y.demN; y.rivalsEnd = xl.rivals.filter((r) => r.open !== false).length; y.n0 = rivals.length;
  return y;
}
// 4.2 の較正：基準の候補地（段3・〜500m・商店街・老舗1軒・通し）で、3年目の売れた客（昼＋夜）＝target になる P_ref（F=1 あたり）を二分法で
function calibrate(P) {
  const attr = 'shoten', Fb = P.tier[3] * P.dist[1] * P.attr.shoten;
  const W0 = makeWorld(attr, 1, P.refRivals.map((t, k) => mkRival({ type: t }, k)), null, 12000, P);
  const a = W0.town.areas[KEY[attr]];
  const ref = { id: 'ref', price: 850, R: 3, A: 0, L: 0, bowl: D.bowl.create(D.bowl.presets[0].spec), parts: 1, family: 0 };
  const rs = (r) => ({ id: r.id, price: r.price, R: r.R, A: r.A, L: r.L, bowl: r.bowl, type: r.type, Q: r.Q, rival: true, open: true });
  const sh = Wd.sharesFor(W0, [ref, ...W0.rivals.map(rs)], { neutralFit: true })[0];
  const eps = 1 / Math.max(0.5, 1 - sh);
  let lo = 10, hi = 5000;
  for (let i = 0; i < 34; i++) { const mid = (lo + hi) / 2; const y = runSite({ attr, Pabs: mid * Fb, rivals: P.refRivals.map((t) => ({ type: t })), eps, rent: 12000, P: { ...P, entry: 0 }, lam: 0 }); if (y.N < P.target) lo = mid; else hi = mid; }
  return { Pref: (lo + hi) / 2, eps, Fb, shRef: sh };
}
// 置き値の上書き：JSON の浅い上書き＋表の部分の上書き
function params(over = {}) {
  const P = JSON.parse(JSON.stringify(DEF)); P.dist = DEF.dist.slice();
  for (const [k, v] of Object.entries(over)) { if (v && typeof v === 'object' && !Array.isArray(v) && P[k] && typeof P[k] === 'object' && !Array.isArray(P[k])) P[k] = { ...P[k], ...v }; else P[k] = v; }
  return P;
}
module.exports = { D, Wd, RV, C, T, ST, DEF, KEY, sites, Fsite, rentOf, lamOf, drawRivals, makeWorld, runSite, calibrate, params, restore, mkRival, T0 };
