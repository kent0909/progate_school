#!/usr/bin/env node
'use strict';
// 出店の地図の測定器。ゲームのファイルは読み取るだけ。差し込みはこのプロセスのメモリ内に限定する。
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const ROOT = path.resolve(__dirname, '..');
const DATA_V06 = path.join(ROOT, 'docs/analysis/stationmap-sim/tokyo23-v06.js');
const PARAMS = path.join(__dirname, 'data/stationmap-params.json');
const TYPES = ['cheap', 'kodawari', 'shinise'];
const KEY = { hanka: 'ekimae', shogyo: 'ekimae', office: 'ekimae', shoten: 'shotengai', jutaku: 'jutaku', kojo: 'jutaku' };
const clone = x => JSON.parse(JSON.stringify(x));
const mean = a => a.length ? a.reduce((t, x) => t + x, 0) / a.length : null;
const quantile = (a, p = .5) => a.length ? [...a].sort((x, y) => x - y)[Math.floor((a.length - 1) * p)] : null;
const variance = a => { const m = mean(a); return mean(a.map(x => (x - m) ** 2)); };
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const seedFor = (seed, ...xs) => { let s = seed >>> 0; for (const c of JSON.stringify(xs)) s = Math.imul(s ^ c.charCodeAt(0), 16777619) >>> 0; return s; };
function ranks(a, ties = true) {
  const order = a.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v), out = [];
  for (let i = 0; i < order.length;) { let j = i + 1; if (ties) while (j < order.length && order[j].v === order[i].v) j++;
    for (let k = i; k < j; k++) out[order[k].i] = (i + j - 1) / 2; i = j; }
  return out;
}
function spearman(a, b, ties = true) {
  const x = ranks(a, ties), y = ranks(b, ties), mx = mean(x), my = mean(y);
  const den = Math.sqrt(x.reduce((s, v) => s + (v - mx) ** 2, 0) * y.reduce((s, v) => s + (v - my) ** 2, 0));
  return den ? x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0) / den : null;
}
function readParams(file = PARAMS, override = {}) {
  const schema = JSON.parse(fs.readFileSync(file, 'utf8')), values = {};
  for (const [k, x] of Object.entries(schema)) {
    if (!x || !['v', 'lo', 'hi', 'src'].every(f => f in x)) throw Error(`置き値の形式: ${k}`);
    values[k] = clone(x.v);
  }
  for (const [k, v] of Object.entries(override)) {
    if (!(k in schema)) throw Error(`未知の置き値: ${k}`);
    if (['foot.tierRatio', 'foot.distRatio'].includes(k)) throw Error(`比の制約は直接上書きできない: ${k}`);
    const s = schema[k];
    if (s.v != null && (Array.isArray(s.v) ? !Array.isArray(v) : typeof s.v !== typeof v)) throw Error(`置き値の型が違う: ${k}`);
    if (typeof v === 'number' && (!Number.isFinite(v) || s.lo != null && v < s.lo || s.hi != null && v > s.hi)) throw Error(`探索幅の外: ${k}=${v}`);
    values[k] = v;
  }
  for (const [k, v] of Object.entries(values)) if (/countProb|typeWeight|mix\.|rivalLunchOnly|entryRate/.test(k) && (typeof v !== 'number' || v < 0 || v > 1)) throw Error(`確率が0〜1でない: ${k}`);
  const sum = ks => ks.reduce((s, k) => s + values[k], 0);
  if (Math.abs(sum(['minus', 'center', 'plus'].map(k => 'rival.countProb.' + k)) - 1) > 1e-9) throw Error('軒数の確率の合計が1でない');
  const tr = values['foot.tier.8'] / values['foot.tier.1'], dr = values['foot.dist.near'] / values['foot.dist.far'];
  if (tr < schema['foot.tierRatio'].lo || tr > schema['foot.tierRatio'].hi || dr < schema['foot.distRatio'].lo || dr > schema['foot.distRatio'].hi) throw Error('人通りの比の制約の外');
  for (const a of Object.keys(KEY)) {
    if (Math.abs(sum(TYPES.map(t => `rival.typeWeight.${a}.${t}`)) - 1) > 1e-9) throw Error(`型の重みの合計: ${a}`);
    if (Math.abs(sum(['office', 'family', 'student', 'tourist'].map(s => `mix.${a}.${s}`)) - 1) > 1e-9) throw Error(`客層の合計: ${a}`);
  }
  return { schema, values };
}
function loadGame(instrument = false, dataFile, memoize = true) {
  global.window = global;
  const story = require('./ramen-files.js').story;
  for (const f of ['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...story]) {
    if (instrument && f === 'js/sim/world.js') {
      let source = fs.readFileSync(path.join(ROOT, f), 'utf8');
      const replace = (before, after) => { if (source.split(before).length !== 2) throw Error(`差し込み位置が変わった: ${before.slice(0, 65)}`); source = source.replace(before, after); };
      replace('SIM.world = { netCash,', 'SIM.world = { expected, netCash,');
      replace('const ex = expected(W, list, comp);', 'const ex = SIM.stationmap.expected(W, list, comp, expected);');
      replace('const servable = 20 * Math.min(dW, cap) + 6 * Math.min(k * dW, cap);', 'const servable = SIM.stationmap.servable(W, e0, Nd, cap, k);');
      replace("Math.round(laborOf(me) + me.parts * C('wagePart') * ((me.wageUp || 1) - 1))", "SIM.stationmap.laborCost(W, me, Math.round(laborOf(me) + me.parts * C('wagePart') * ((me.wageUp || 1) - 1)))");
      replace("Math.round(C('utilFixed') + C('utilVar') * sales)", "SIM.stationmap.utilityCost(W, Math.round(C('utilFixed') + C('utilVar') * sales))");
      const start = source.indexOf('    const regularBefore = me.L;'), end = source.indexOf('    const fullDays =', start);
      if (start < 0 || end < 0) throw Error('常連の差し込み位置が変わった');
      source = source.slice(0, start) + `    const { regularBefore, regularAdded, regularDelta, regularLost } = SIM.stationmap.regular(W, me, e0, sold, churn);\n` + source.slice(end);
      replace('regularLost: regularBefore * churn,', 'regularLost,');
      replace('regShare: me.L / Math.max(1, e0.N)', 'regShare: SIM.stationmap.activeRegular(W, me) / Math.max(1, e0.N)');
      replace("a.pRef = list.slice(1).every(x=>x.open===false) ? C('price0') : (1 - C('pRefStep')) * a.pRef + C('pRefStep') * weightedPrice(list);", 'a.pRef = SIM.stationmap.price(W);');
      vm.runInThisContext(source, { filename: path.join(ROOT, f) });
    } else require(path.join(ROOT, f));
  }
  require(dataFile || DATA_V06);
  const D = global.SIMDATA;
  if (D.y2) D.y2.stream = null;
  if (instrument && memoize && !D.bowl.__stationmapMemo) memoizeBowl(D);
  return D;
}

// 同じ一杯の部品の純粋な読み出しだけを保存。元の関数で求めた数をそのまま返す。
function memoizeBowl(D) {
  const B = D.bowl, original = { fit: B.fit, Q: B.Q, cost: B.cost }, identities = new WeakMap(), recipes = new Map();
  const get = b => {
    let entry = identities.get(b.spec);
    if (!entry) {
      const key = JSON.stringify(b.spec); entry = recipes.get(key);
      if (!entry) { entry = { quality: original.Q(b), cost: original.cost(b), fits: new Map() }; recipes.set(key, entry); }
      identities.set(b.spec, entry);
    }
    return entry;
  };
  B.fit = (b, seg) => { const e = get(b); if (!e.fits.has(seg)) e.fits.set(seg, original.fit(b, seg)); return e.fits.get(seg); };
  B.Q = (b, store) => store && store.Q != null ? original.Q(b, store) : get(b).quality;
  B.cost = b => get(b).cost;
  B.__stationmapMemo = true;
}

function neutral(D, W, parts = 1) {
  const p = D.world.policy0(W, null, { neutral: true });
  for (const k of D.world.TIME_KEYS) p[k] = false;
  return { ...p, price: 850, parts, family: 0, map: true, line: false, prep: 'mid', flyer: 0, borrow: false };
}
function runLegacy(D, W, parts = 1) {
  const y = { N: 0, demand: 0, profit: 0, rent: 0 };
  for (let t = 0; t < 36; t++) {
    const r = D.world.month(W, neutral(D, W, parts), { noise: false, noCards: true, noFactors: true, rng: D.rng(90001 + t) });
    if (t >= 24) { y.N += r.res.N / 12; y.demand += r.res.demand / 12; y.profit += r.res.op; y.rent += r.res.rent / 12; }
    W = r.W;
  }
  return y;
}
function legacyWorld(D, key, potential, rivals, eps, rent) {
  const W = D.world.create({ seed: 0, area: key }), a = W.town.areas[key];
  a.potentialMul = 1; a.P = potential; if (eps) a.epsScale = eps;
  W.rivals = rivals.map((t, k) => D.rivals.make(t, k)); W.events = [];
  W.otherFixed = D.coef('otherFixed'); W.rentMul = rent / D.coef('rentPerTsubo')[key]; return W;
}
function regression(opts) {
  const file = opts.data || path.join(ROOT, 'docs/analysis/stationmap-sim/tokyo23-v04.js');
  const D = loadGame(false, file), DEF = require(path.join(ROOT, 'docs/analysis/stationmap-v04-reasoning/lib.js')).DEF;
  // DEF を参照するが、その require が読み込む現行 tokyo23 による置換を避ける。
  delete require.cache[require.resolve(file)]; require(file);
  const P = { ...DEF, ...opts.legacyOverride }, T = D.tokyo23, stations = Object.fromEntries(T.stations.map(s => [s.id, s]));
  const key = 'shotengai', W0 = D.world.create({ seed: 0, area: key }), a = W0.town.areas[key];
  const ref = { id: 'ref', price: a.pRef, R: 3, A: 0, L: 0, bowl: D.bowl.create(D.bowl.presets[0].spec), parts: 1, family: 0 };
  const sh = D.world.sharesFor(W0, [ref, ...P.refRivals.map((t, k) => ({ ...D.rivals.make(t, k), rival: true }))], { neutralFit: true })[0];
  const eps = 1 / Math.max(.5, 1 - sh), Fb = P.tier[3] * P.attr.shoten;
  let lo = 10, hi = 5000;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (runLegacy(D, legacyWorld(D, key, mid * Fb, P.refRivals, eps, 12000)).N < P.target) lo = mid; else hi = mid; }
  const Pref = (lo + hi) / 2, out = [];
  for (let i = 0; i < T.sites.length; i++) {
    const s = T.sites[i], tier = stations[s.st].tier ?? stations[s.st].pins, F = P.tier[tier] * P.dist(s.walk) * P.attr[s.type], draws = [];
    for (let k = 0; k < opts.K; k++) {
      const rng = D.rng(7000 + i * 101 + k + opts.seed), lam = P.lamTier[tier] * P.lamAttr[s.type] * P.lamMul;
      let prod = 1, n = -1; do { n++; prod *= rng(); } while (prod > Math.exp(-lam));
      n = Math.min(P.lamCap, n); const rivals = [], w = P.w[s.type];
      for (let j = 0; j < n; j++) { const x = rng(); rivals.push(x < w[0] ? 'cheap' : x < w[0] + w[1] ? 'kodawari' : 'shinise'); }
      const rent = Math.max(P.floor, P.R0 * (s.price / 1e7) ** P.b) * (1 + P.rentSpread * (2 * D.rng(5000 + i * 37 + k + opts.seed)() - 1));
      draws.push({ ...runLegacy(D, legacyWorld(D, KEY[s.type], Pref * F, rivals, eps, rent)), rivalCount: n });
    }
    out.push({ id: s.id, tier, type: s.type, F, draws });
  }
  const ranked = out.map(s => ({ ...s, profit: mean(s.draws.map(d => d.profit)) })).sort((a, b) => b.profit - a.profit);
  const result = { mode: '版0.4回帰・期待値（週の揺れなし）', K: opts.K, seed: opts.seed, stations: T.stations.length, sites: out.length, Pref, medianCustomers: quantile(out.flatMap(s => s.draws.map(d => d.N))), overflowSitesPct: 100 * out.filter(s => mean(s.draws.map(d => d.demand)) > 70).length / out.length, overflowDrawsPct: 100 * mean(out.flatMap(s => s.draws.map(d => +(d.demand > 70)))), spearmanLegacy: spearman(ranked.map(s => s.profit), ranked.map(s => s.F), false), spearmanMidrank: spearman(ranked.map(s => s.profit), ranked.map(s => s.F)), dataSha256: hash(fs.readFileSync(file)) };
  const reference = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/analysis/stationmap-sim/regression-reference.json'), 'utf8'));
  result.reference = reference;
  result.comparison = [['客数中央値', result.medianCustomers, reference.medianDisplay, reference.medianDisplay * .02], ['上限越え候補地%', result.overflowSitesPct, reference.overflowSitesPct, reference.overflowSitesPct * .02], ['順位相関', result.spearmanLegacy, reference.spearmanLegacy, Math.abs(reference.spearmanLegacy) * .02]].map(([metric, actual, expected, tolerance]) => ({ metric, actual, expected, tolerance, pass: Math.abs(actual - expected) <= tolerance }));
  fs.mkdirSync(opts.out, { recursive: true });
  fs.writeFileSync(path.join(opts.out, 'regression.json'), JSON.stringify(result, null, 2) + '\n');
  fs.writeFileSync(path.join(opts.out, 'regression.md'), '# 版0.4 回帰\n\n' + JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { readParams, loadGame, regression, quantile, spearman, seedFor };

// 4.5 の昼夜を分け、需要・損益・評判のゲーム式を保ったままつなぐ。
function installHooks(D, p) {
  const C = D.coef;
  D.stationmap = {
    price: W => p['market.price.' + W.stationmap.attribute],
    activeRegular: (W, me) => W.stationmap.hours === 'both' ? me.L : me.regularBands[W.stationmap.hours === 'lunch' ? 0 : 1],
    expected(W, list, comp, original) {
      const meta = W.stationmap, weight = meta.lunchWeight;
      const bands = [weight, 1 - weight].map((w, b) => {
        const a = W.town.areas[W.area], Wx = { ...W, town: { areas: { [W.area]: { ...a, P: a.P * w } } } };
        const xs = list.map((s, i) => ({ ...s, L: (s.regularBands || [s.L * weight, s.L * (1 - weight)])[b], open: s.open !== false && (i ? !(W.rivals[i - 1].lunchOnly && b === 1) : meta.hours === 'both' || meta.hours === (b ? 'night' : 'lunch')) }));
        return original(Wx, xs, comp);
      });
      return list.map((_, i) => ({ N: bands[0][i].N + bands[1][i].N, Nnew: bands[0][i].Nnew + bands[1][i].Nnew, Nreg: bands[0][i].Nreg + bands[1][i].Nreg, bands: bands.map(x => x[i]) }));
    },
    servable(W, ex, noisyN, cap, weekend) {
      const m = noisyN / Math.max(1e-12, ex.N), c = p['hours.lunchCapacity'];
      const bandSold = ex.bands.map((e, b) => {
        const n = e.N * m, daily = n * C('days') / (20 + 6 * weekend), capacity = cap * (b ? 1 - c : c);
        return 20 * Math.min(daily, capacity) + 6 * Math.min(weekend * daily, capacity);
      });
      // 仕込み不足による配分は後で sold/servable を等比に掛ける。
      W.stationmap.servableBands = bandSold;
      return bandSold[0] + bandSold[1];
    },
    closedFraction(W) {
      const m = W.stationmap;
      return m.hours === 'both' ? 0 : p[m.hours === 'lunch' ? 'hours.nightHours' : 'hours.lunchHours'] / (p['hours.lunchHours'] + p['hours.nightHours']);
    },
    laborCost(W, me, full) {
      const fraction = D.stationmap.closedFraction(W);
      const saving = fraction && (me.parts === 2 || me.parts === 1 && p['hours.costMode'] === 'part-full') ? C('wagePart') : me.parts === 1 ? C('wagePart') * fraction : 0;
      const cost = Math.max(0, Math.round(full - saving)); W.stationmap.savedLabor = full - cost; return cost;
    },
    utilityCost(W, full) {
      const cost = Math.round(full * (1 - D.stationmap.closedFraction(W))); W.stationmap.savedUtility = full - cost; return cost;
    },
    saving: W => (W.stationmap.savedLabor || 0) + (W.stationmap.savedUtility || 0),
    regular(W, me, ex, sold, baseChurn) {
      const a = W.stationmap.attribute, weight = W.stationmap.lunchWeight;
      const previous = me.regularBands || [me.L * weight, me.L * (1 - weight)];
      const totalServable = W.stationmap.servableBands.reduce((s, x) => s + x, 0);
      let regularAdded = 0, regularLost = 0;
      const bands = previous.map((old, b) => {
        const band = ex.bands[b], served = sold * W.stationmap.servableBands[b] / Math.max(1e-12, totalServable);
        const fresh = served * band.Nnew / Math.max(1e-12, band.N * C('days'));
        const added = C('retain') * p['regular.retain.' + a] * fresh * (1 + .3 * (me.R - 3));
        const switched = W.stationmap.changed && !(W.stationmap.hours === 'both' || W.stationmap.hours === (b ? 'night' : 'lunch'));
        const churn = Math.min(1, baseChurn * p['regular.churn.' + a] + (switched ? p['hours.switchChurn'] : 0));
        regularAdded += added; regularLost += old * churn;
        return Math.max(0, old * (1 - churn) + added);
      });
      const regularBefore = me.L; me.regularBands = bands; me.L = bands[0] + bands[1];
      return { regularBefore, regularAdded, regularLost, regularDelta: me.L - regularBefore };
    },
  };
  const originalSettle = D.rivals.settle;
  D.rivals.settle = (W, expected, comp) => {
    const weight = W.stationmap.lunchWeight;
    const before = W.rivals.map(r => r.regularBands || [r.L * (r.lunchOnly ? 1 : weight), r.L * (r.lunchOnly ? 0 : 1 - weight)]);
    originalSettle(W, expected, comp);
    W.rivals.forEach((r, i) => {
      if (r.open === false) return;
      r.regularBands = before[i].map((v, b) => Math.max(0, v * (1 - C('churn')) + C('retain') * expected[i].bands[b].Nnew));
      r.L = r.regularBands[0] + r.regularBands[1];
    });
  };
}

function median(a) {
  if (!a.length) throw Error('中央値を計算するデータがない');
  const b = [...a].sort((x, y) => x - y), m = Math.floor(b.length / 2);
  return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
}
function prepareSites(D, p) {
  const st = Object.fromEntries(D.tokyo23.stations.map(s => [s.id, s]));
  const days = Object.fromEntries(Object.keys(KEY).map(a => [a, median(D.tokyo23.sites.filter(s => s.type === a && s.day != null).map(s => s.day))]));
  return D.tokyo23.sites.map(s => {
    const day = s.day == null ? days[s.type] : s.day;
    if (!Number.isFinite(day) || !Number.isFinite(s.food)) throw Error('day/foodが不正: ' + s.id);
    const night = Math.max(p['hours.nightFloor'], (1 - day) + p['hours.kappa'] * (s.food / p['hours.foodMedian'] - 1));
    return { ...s, tier: st[s.st].tier, day, dayFilled: s.day == null, lunchWeight: day / (day + night) };
  });
}
function entryProbability(W, p) {
  const m = W.stationmap, average = m.history.length ? mean(m.history) : 0;
  const success = Math.max(0, Math.min(1, (average - p['rival.successTarget']) / p['rival.successTarget'])) * (W.stores[0].R / 3);
  return Math.min(1, p['rival.entryBase'] * m.lambda + p['rival.entrySuccess'] * success);
}

function siteFactors(s, p) {
  const d = s.walk <= 200 ? 'near' : s.walk <= 500 ? 'mid' : 'far';
  return { F: p['foot.tier.' + s.tier] * p['foot.dist.' + d] * p['foot.attr.' + s.type], lambda: p['rival.lambdaTier.' + s.tier] * p['rival.lambdaAttr.' + s.type] * p['rival.lambdaMultiplier'] };
}
function pickType(D, attr, seed, p) {
  const u = D.rng(seed)(), a = p[`rival.typeWeight.${attr}.cheap`], b = p[`rival.typeWeight.${attr}.kodawari`];
  return u < a ? 'cheap' : u < a + b ? 'kodawari' : 'shinise';
}
function makeRival(D, type, index, attr, seed, p, weight) {
  const r = D.rivals.make(type, index), lunchOnly = D.rng(seed)() < p['hours.rivalLunchOnly.' + type];
  const w = lunchOnly ? 1 : weight;
  return { ...r, lunchOnly, regularBands: [r.L * w, r.L * (1 - w)] };
}
function opening(D, site, k, seed, p, fixedRivals) {
  const { F, lambda } = siteFactors(site, p), base = seedFor(seed, site.id, k, 'opening');
  const u = D.rng(base)(), center = Math.round(lambda), delta = u < p['rival.countProb.minus'] ? -1 : u < p['rival.countProb.minus'] + p['rival.countProb.center'] ? 0 : 1;
  const n = Math.min(p['rival.cap'], Math.max(0, center + delta));
  const ts = fixedRivals || Array.from({ length: n }, (_, i) => pickType(D, site.type, seedFor(base, i, 'type'), p));
  const rivals = ts.map((t, i) => makeRival(D, t, i, site.type, seedFor(base, i, 'hours'), p, site.lunchWeight));
  const rent = Math.max(p['rent.floor'], p['rent.R0'] * (site.price / 1e7) ** p['rent.b']) * (1 + p['rent.spread'] * (2 * D.rng(seedFor(base, 'rent'))() - 1));
  return { F, lambda, rivals, rent, seed: base, lunchWeight: site.lunchWeight };
}
function makeWorld(D, site, open, cal, seed, p, parts = 1, hours = 'both') {
  const key = KEY[site.type], W = legacyWorld(D, key, cal.Pref * open.F, [], cal.eps, open.rent), a = W.town.areas[key];
  W.seed = seed; W.rivals = clone(open.rivals);
  a.pRef = p['market.price.' + site.type]; a.mix = Object.fromEntries(['office', 'family', 'student', 'tourist'].map(s => [s, p[`mix.${site.type}.${s}`]])); a.cal = p['calendar.' + site.type];
  W.stores[0].R = p['reference.reputation']; W.stores[0].price = p['reference.price']; W.stores[0].parts = parts;
  W.stores[0].regularBands = [0, 0];
  W.stationmap = { attribute: site.type, lunchWeight: site.lunchWeight, hours, previousHours: 'both', lambda: open.lambda, pending: [], nextRival: open.rivals.length, events: [], history: [], station: site.st };
  // 初期キャッシュの未指定を営業利益で代用しない。
  return W;
}
function run36(D, site, open, cal, p, opt = {}) {
  const parts = opt.parts || 1, hours = opt.hours || 'both', seed = opt.seed || 0;
  let W = makeWorld(D, site, open, cal, seed, p, parts, hours);
  const y = { N: 0, demand: 0, profit: 0, rent: 0, year1N: 0, cutWindowN: 0, cumulativeProfit: 0, overflowMonths: 0, entries: 0, lunchN: 0, nightN: 0, closedSaving: 0 };
  for (let t = 0; t < 36; t++) {
    const m = W.stationmap;
    m.changed = m.hours !== m.previousHours; m.previousHours = m.hours;
    // 予兆と参入の乱数は天気・仕込みと独立。方策の比較にも同じ将来列を使う。
    if (!opt.noEntry) {
      for (const e of m.pending.filter(e => e.at === t)) if (W.rivals.filter(r => r.open !== false).length < p['rival.cap']) {
        const r = makeRival(D, e.type, m.nextRival++, site.type, e.seed, p, m.lunchWeight); W.rivals.push(r); y.entries++;
      }
      m.pending = m.pending.filter(e => e.at > t);
      if (W.rivals.filter(r => r.open !== false).length < p['rival.cap'] && D.rng(seedFor(seed, t, 'entry'))() < entryProbability(W, p)) {
        const entrySeed = seedFor(seed, t, 'entry-type');
        const own = D.world.typeOf(W.stores[0]), same = D.rng(seedFor(seed, t, 'entry-copy'))() < p['rival.sameTypeProbability'];
        m.pending.push({ at: t + p['rival.entryDelay'], type: same ? (own === 'normal' ? 'shinise' : own) : pickType(D, site.type, entrySeed, p), seed: entrySeed, station: site.st });
      }
    }
    if (t === 24) y.rivalsYear3Start = W.rivals.filter(r => r.open !== false).length;
    const pol = neutral(D, W, parts); pol.price = p['reference.price'];
    if (opt.rivalCut && t === 24) for (const r of W.rivals) if (r.open !== false) { r.cutOriginalPrice = r.price; r.price = Math.max(D.world.PRICE_MIN, r.price - 50); }
    if (opt.rivalCut && t === 27) for (const r of W.rivals) if (r.cutOriginalPrice != null) r.price = r.cutOriginalPrice;
    if (opt.trace) opt.trace(t, W);
    const r = D.world.month(W, pol, { noise: !!opt.noise, noCards: true, noFactors: true, rng: D.rng(seedFor(seed, t, 'month')) });
    if (opt.fixedRoster) for (const rival of r.W.rivals) rival.open = true;
    r.W.stationmap.history.push(r.res.N); r.W.stationmap.history = r.W.stationmap.history.slice(-3);
    if (t >= 24 && t < 27) y.cutWindowN += r.res.N / 3;
    if (t < 12) y.year1N += r.res.N / 12;
    y.cumulativeProfit += r.res.op;
    if (t >= 24) {
      y.N += r.res.N / 12; y.demand += r.res.demand / 12; y.profit += r.res.op; y.rent += r.res.rent / 12;
      y.overflowMonths += +(r.res.demand > 70);
      const b = r.W.stationmap.servableBands, total = b[0] + b[1];
      y.lunchN += r.res.N * b[0] / Math.max(1e-12, total) / 12; y.nightN += r.res.N * b[1] / Math.max(1e-12, total) / 12;
      y.closedSaving += D.stationmap.saving(r.W);
    }
    W = r.W;
  }
  y.finalRivals = W.rivals.filter(r => r.open !== false).length; y.finalZeroShare = +(y.finalRivals === 0);
  return y;
}
function calibrate(D, p, opts) {
  const referenceSites = prepareSites(D, p).filter(s => s.type === 'shoten');
  const Lref = median(referenceSites.map(s => s.lunchWeight));
  const site = { lunchWeight: Lref, id: 'reference', tier: p['reference.tier'], walk: { near: 100, mid: 300, far: 600 }[p['reference.distance']], type: p['reference.attribute'], price: 1e7 };
  const open = opening(D, site, 0, opts.seed, p, p['reference.rivals']);
  if (p['decision.referenceHours'] === 'both') for (const r of open.rivals) { const w = site.lunchWeight; r.lunchOnly = false; r.regularBands = [r.L * w, r.L * (1 - w)]; }
  const key = KEY[site.type], W = D.world.create({ seed: 0, area: key });
  W.town.areas[key].pRef = p['market.price.' + site.type];
  W.town.areas[key].mix = Object.fromEntries(['office', 'family', 'student', 'tourist'].map(s => [s, p[`mix.${site.type}.${s}`]]));
  const ref = { id: 'ref', price: p['reference.price'], R: p['reference.reputation'], A: 0, L: 0, bowl: D.bowl.create(D.bowl.presets[0].spec), parts: p['reference.parts'], family: 0 };
  const share = D.world.sharesFor(W, [ref, ...open.rivals.map(r => ({ ...r, rival: true }))], { neutralFit: true })[0];
  const eps = 1 / Math.max(.5, 1 - share);
  const score = Pref => quantile(Array.from({ length: opts.N }, (_, n) => run36(D, site, open, { Pref, eps }, p, { noise: true, noEntry: true, fixedRoster: true, seed: seedFor(opts.seed, 'calibration', n) }).N));
  let lo = 10, hi = 5000;
  if (score(lo) > p['reference.target'] || score(hi) < p['reference.target']) throw Error('基準の客数44を較正の区間内で挟めない');
  for (let i = 0; i < 26; i++) { const mid = (lo + hi) / 2; if (score(mid) < p['reference.target']) lo = mid; else hi = mid; }
  const Pref = (lo + hi) / 2;
  return { Pref, eps, referenceSampleCount: referenceSites.length, referenceLunchWeight: Lref, referenceLunchWeightRule: p['reference.lunchWeightMode'], N: opts.N, median: score(Pref), target: p['reference.target'], scope: '基準候補地の同一初期組・天気と仕込みを含むN周の3年目中央値', entry: p['decision.calibrationEntry'], opening: open.rivals.map(r => ({ type: r.type, lunchOnly: r.lunchOnly })) };
}

function evaluateSite(D, site, p, cal, opts) {
  const draws = [];
  for (let k = 0; k < opts.K; k++) {
    const open = opening(D, site, k, opts.seed, p);
    const variants = ['both', ...(site.type === 'office' ? ['lunch'] : site.type === 'hanka' ? ['night'] : []), 'extra'];
    const evaluate = (noise, n) => {
      const seed = seedFor(opts.seed, site.id, k, noise ? n : 'expected');
      const base = run36(D, site, open, cal, p, { seed, noise });
      const out = { ...base };
      for (const h of variants.slice(1)) {
        
        out[h + 'Profit'] = run36(D, site, open, cal, p, { seed, noise, parts: h === 'extra' ? 2 : 1, hours: h === 'extra' ? 'both' : h }).profit;
      }
      return out;
    };
    const expected = evaluate(false, 0), samples = Array.from({ length: opts.N }, (_, n) => evaluate(true, n));
    const selectionScore = mean(Array.from({ length: opts.N }, (_, n) => run36(D, site, open, cal, p, { seed: seedFor(opts.seed, site.id, k, 'selection-training', n), noise: true }).cumulativeProfit));
    const monteCarlo = Object.fromEntries(Object.keys(expected).map(key => [key, expected[key] == null ? null : mean(samples.map(x => x[key]))]));
    // ①の中央値を「各候補地で平均を取った値の中央値」に取り替えない。
    draws.push({ k, selectionScore, F: open.F, lambda: open.lambda, rentPerTsubo: open.rent, rivals: open.rivals.map(r => ({ type: r.type, lunchOnly: r.lunchOnly })), expected, monteCarlo, customerSamples: samples.map(s => s.N), profitSamples: samples.map(s => s.profit), demandSamples: samples.map(s => s.demand), finalRivalSamples: samples.map(s => s.finalRivals) });
  }
  return { id: site.id, station: site.st, type: site.type, tier: site.tier, walk: site.walk, price: site.price, lunchWeight: site.lunchWeight, day: site.day, food: site.food, quiet: !!site.quiet, draws };
}
const LABELS = ['3年目の客数中央値', '上限70人を越える候補地', '利益上位50の多様さ', '候補地内のくじの分散比', '各世界上位50の0軒', '単純規則3つ/上手な選択', '昼だけ・夜だけが得な候補地', '上限越えで増員が得な候補地', '住宅地/繁華街の客数成長比', 'ライバルの値下げで自店客数減'];
function summarize(sites, mode, direction, p, opts) {
  const pool = sites.flatMap(s => s.draws.map(d => ({ ...d[mode], site: s, d })));
  const avgSite = s => Object.fromEntries(['N', 'demand', 'profit', 'rent', 'year1N', 'extraProfit', 'lunchProfit', 'nightProfit'].map(k => [k, mean(s.draws.map(d => d[mode][k]).filter(x => x != null))]));
  const ranked = sites.map(s => ({ ...s, avg: avgSite(s) })).sort((a, b) => b.avg.profit - a.avg.profit || a.id.localeCompare(b.id, 'en'));
  const top = ranked.slice(0, 50), tiers = new Set(top.map(s => s.tier)).size, attrs = new Set(top.map(s => s.type)).size, local = top.filter(s => ['jutaku', 'shoten'].includes(s.type)).length;
  const sampleCustomers = mode === 'expected' ? pool.map(x => x.N) : sites.flatMap(s => s.draws.flatMap(d => d.customerSamples));
  const profits = s => mode === 'expected' ? s.draws.map(d => d.expected.profit) : s.draws.flatMap(d => d.profitSamples);
  const totalVar = variance(sites.flatMap(profits)), within = mean(sites.map(s => variance(profits(s))));
  const worlds = Array.from({ length: opts.K }, (_, k) => sites.map(s => ({ s, d: s.draws[k], v: s.draws[k][mode] })).sort((a, b) => b.v.profit - a.v.profit || a.s.id.localeCompare(b.s.id, 'en')));
  const zeros = mode === 'expected'
    ? worlds.map(w => w.slice(0, 50).filter(x => x.v.finalRivals === 0).length)
    : Array.from({ length: opts.K }, (_, k) => Array.from({ length: opts.N }, (_, n) => sites.map(s => ({ id: s.id, profit: s.draws[k].profitSamples[n], rivals: s.draws[k].finalRivalSamples[n] })).sort((a, b) => b.profit - a.profit || a.id.localeCompare(b.id, 'en')).slice(0, 50).filter(x => x.rivals === 0).length)).flat();
  const simple = worlds.map(w => {
    const rentQ = quantile(w.map(x => x.d.rentPerTsubo), .25);
    // 選び方そのものの定義はPRで確定させる。未承認のときは判定不能。
    const groups = [w.filter(x => x.s.tier >= 5), w.filter(x => x.d.rivals.length <= 1), w.filter(x => x.d.rentPerTsubo <= rentQ)];
    const selected = w.map(x => ({ ...x, estimate: x.d.selectionScore })).sort((a, b) => b.estimate - a.estimate || a.s.id.localeCompare(b.s.id, 'en'))[0];
    return { selectedSite: selected.s.id, skilledProfit: selected.v.cumulativeProfit, profits: groups.map(g => mean(g.map(x => x.v.cumulativeProfit))), candidateCounts: groups.map(g => g.length) };
  });
  const skilled = mean(simple.map(s => s.skilledProfit));
  const simpleRatios = [0, 1, 2].map(i => skilled > 0 ? mean(simple.map(s => s.profits[i])) / skilled : null);
  const subset = type => ranked.filter(s => s.type === type), office = subset('office'), hanka = subset('hanka');
  const hoursOffice = mean(office.map(s => +(s.avg.lunchProfit > s.avg.profit)));
  const hoursHanka = mean(hanka.map(s => +(s.avg.nightProfit > s.avg.profit)));
  const over = ranked.filter(s => s.avg.demand > 70), extra = mean(over.map(s => +(s.avg.extraProfit > s.avg.profit)));
  const growth = type => mean(subset(type).map(s => s.avg.N)) / mean(subset(type).map(s => s.avg.year1N));
  const growthRatio = growth('jutaku') / growth('hanka');
  const rows = [];
  const add = (i, value, status, target, reason = null) => rows.push({ number: i, label: LABELS[i - 1], value, status, target, reason });
  const median = quantile(sampleCustomers); add(1, median, median >= 40 && median <= 52 ? '合格' : '不合格', '40〜52人/日');
  add(2, 100 * over.length / sites.length, '報告のみ', '目標なし');
  add(3, { tiers, attributes: attrs, localSites: local }, tiers >= 4 && attrs >= 4 && local >= 8 ? '合格' : '不合格', '段4以上・属性4以上・住宅地か商店街8以上');
  add(4, totalVar && opts.K > 1 ? within / totalVar : null, opts.K < 2 || !totalVar ? '測定不能' : within / totalVar <= .4 ? '合格' : '不合格', '40%以下', opts.K < 2 ? 'K>=2が必要。K=1を分散ゼロとして合格にしない' : null);
  add(5, { min: Math.min(...zeros), max: Math.max(...zeros), mean: mean(zeros), worlds: zeros.length, over15: zeros.filter(x => x > 15).length }, zeros.every(x => x <= 15) ? '合格' : '不合格', 'すべての世界で15以下');
  const decision6 = p['decision.simpleSelection'] != null && p['decision.skilledBot'] != null;
  add(6, { ratios: simpleRatios, skilled, worlds: simple }, !decision6 || skilled <= 0 ? '測定不能' : simpleRatios.every(x => x != null && x < .85) ? '合格' : '不合格', '3規則すべて85%未満', !decision6 ? '単純規則と上手の定義を相談中。数は仮の一様選択/別seedのN周で36か月利益の推定最大' : skilled <= 0 ? '上手の利益が0以下なので比による判定が定義できない' : null);
  add(7, { office: hoursOffice, hanka: hoursHanka }, hoursOffice == null ? '測定不能' : hoursOffice >= .2 && hoursHanka >= .2 ? '合格' : '不合格', 'オフィス昼だけ・繁華街夜だけが各20%以上', hoursOffice == null ? '閉めて減る費用の初期値を相談中' : null);
  add(8, { share: extra, denominator: over.length }, !over.length ? '測定不能' : extra >= .3 && extra <= .7 ? '合格' : '不合格', '上限越え候補地の30〜70%', !over.length ? '上限越え候補地が0' : null);
  add(9, { ratio: growthRatio, jutaku: growth('jutaku'), hanka: growth('hanka') }, growthRatio >= 1.3 ? '合格' : '不合格', '住宅地/繁華街の成長比1.3倍以上');
  const dd = direction[mode]; add(10, dd, p['decision.rivalCut'] == null ? '測定不能' : dd.after < dd.before ? '合格' : '不合格', 'ライバル値下げ時に客数減', p['decision.rivalCut'] == null ? '既存札に指定の値下げ札がない。50円介入の参考値であり、札の検査の合格とはしない' : null);
  const group = key => [...new Set(sites.map(s => s[key]))].sort().map(value => {
    const ss = ranked.filter(s => s[key] === value);
    return { [key]: value, count: ss.length, customers: quantile(ss.map(s => s.avg.N)), annualProfit: quantile(ss.map(s => s.avg.profit)), monthlyRent: quantile(ss.map(s => s.avg.rent)) };
  });
  const lossFraction = mean(sites.flatMap(profits).map(v => +(v < 0)));
  return { mode: mode === 'expected' ? '期待値（週の揺れ・仕込み誤差なし、参入と営業時間くじはseed付き条件）' : `乱数込み（N=${opts.N}周、各候補地×開店くじごと）`, rows, worldZeroCounts: zeros, byTier: group('tier'), byAttribute: group('type'), spearman: spearman(ranked.map(s => s.avg.profit), ranked.map(s => s.draws[0].F)), lossFraction, rivalAddition: direction[mode].additions, rivalAdditionPass: direction[mode].additionPass, admissible: lossFraction <= .5, allPass: direction[mode].additionPass && p['hours.costMode'] === 'design' && !opts.limit && lossFraction <= .5 && rows.every(r => ['合格', '報告のみ'].includes(r.status)) };
}
function directionTest(D, p, cal, opts) {
  const s = { id: 'direction', tier: 3, walk: 300, type: 'shoten', price: 1e7, lunchWeight: cal.referenceLunchWeight }, open = opening(D, s, 0, opts.seed, p, ['shinise']);
  for (const r of open.rivals) { r.lunchOnly = false; r.regularBands = [r.L * s.lunchWeight, r.L * (1 - s.lunchWeight)]; }
  const out = {};
  for (const [mode, noise] of [['expected', false], ['monteCarlo', true]]) {
    const samples = Array.from({ length: noise ? opts.N : 1 }, (_, n) => {
      const seed = seedFor(opts.seed, 'direction', n);
      const before = run36(D, s, open, cal, p, { noise, seed, noEntry: true, fixedRoster: true });
      const after = run36(D, s, open, cal, p, { noise, seed, noEntry: true, fixedRoster: true, rivalCut: true });
      const additions = Object.fromEntries(TYPES.map(type => { const competitor = makeRival(D, type, 1, s.type, seedFor(seed, 'addition', type), p, s.lunchWeight); competitor.lunchOnly = false; competitor.regularBands = [competitor.L * s.lunchWeight, competitor.L * (1 - s.lunchWeight)]; const y = run36(D, s, { ...open, rivals: [...open.rivals, competitor] }, cal, p, { noise, seed, noEntry: true, fixedRoster: true }); return [type, y.demand / before.demand - 1]; }));
      return { before: before.cutWindowN, after: after.cutWindowN, year3Before: before.N, year3After: after.N, additions };

    });
    const additions = Object.fromEntries(TYPES.map(t => [t, mean(samples.map(s => s.additions[t]))]));
    const additionPass = TYPES.every(t => additions[t] >= -.4 && additions[t] <= -.05) && additions.shinise < additions.cheap && additions.shinise < additions.kodawari;
    out[mode] = { additions, additionPass, additionConditions: '基準に通しの1軒を追加し、参入なし・同じ乱数で3年目の需要を比較', before: mean(samples.map(x => x.before)), after: mean(samples.map(x => x.after)), year3Before: mean(samples.map(x => x.year3Before)), year3After: mean(samples.map(x => x.year3After)), window: 't24〜26の3か月平均客数/日', intervention: '3年目の初月から3か月だけ基準の老舗を50円値下げ。4か月目に復元。ほかの乱数は対で固定' };
  }
  return out;
}

function gameEvidence() {
  return Object.fromEntries(['js/core.js', 'docs/analysis/stationmap-sim/tokyo23-v06.js', ...require('./ramen-files.js').story].map(f => [f, hash(fs.readFileSync(path.join(ROOT, f)))]));
}
function toMarkdown(report) {
  let s = '# 出店の地図 測定結果\n\n' + `seed=${report.input.seed} / K=${report.input.K} / N=${report.input.N} / 候補地=${report.siteCount}\n\n`;
  s += `条件: ${report.designStatus}\n\n`;
  s += `較正: P_ref=${report.calibration.Pref}、基準のN周中央値=${report.calibration.median}人/日\n\n`;
  if (report.pending.length) s += '未決定: ' + report.pending.join('、') + '。関連する判定は確定していない。\n\n';
  for (const r of report.summaries) {
    s += `## ${r.mode}\n\n|検査|値|目標|判定|理由|\n|---|---|---|---|---|\n`;
    for (const row of r.rows) s += `|${row.number} ${row.label}|${JSON.stringify(row.value).replace(/\|/g, '\\|')}|${row.target}|${row.status}|${row.reason || ''}|\n`;
    for (const [title, values] of [['段ごと', r.byTier], ['属性ごと', r.byAttribute]]) {
      s += `\n### ${title}の中央値\n\n|区分|候補地数|客数/日|営業利益/年|家賃/月|\n|---|---|---|---|---|\n`;
      for (const row of values) s += `|${row.tier ?? row.type}|${row.count}|${row.customers}|${row.annualProfit}|${row.monthlyRent}|\n`;
    }
    s += `\n4.3の効きの向き: ${JSON.stringify(r.rivalAddition)} / ${r.rivalAdditionPass ? '合格' : '不合格'}\n`;
    s += `\n赤字のくじの割合=${r.lossFraction}、利益と人通りの順位相関（同順位は平均順位）=${r.spearman}\n`;
  }
  return s;
}
function writeReport(report, sites, out) {
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(out, 'report.md'), toMarkdown(report));
  const headers = ['site', 'station', 'tier', 'attribute', 'draw', 'mode', 'N', 'customers', 'demand', 'annualProfit', 'monthlyRent', 'rentPerTsubo', 'rivals', 'rivalHours', 'overflow70', 'entries', 'finalRivals', 'year1Customers', 'lunchCustomers', 'nightCustomers', 'extraProfit', 'lunchProfit', 'nightProfit', 'lunchWeight', 'day', 'food', 'quiet'];
  const csv = x => x == null ? '' : typeof x === 'string' ? '"' + x.replace(/"/g, '""') + '"' : String(x);
  const rows = [headers.join(',')];
  for (const s of sites) for (const d of s.draws) for (const mode of ['expected', 'monteCarlo']) {
    const v = d[mode]; rows.push([s.id, s.station, s.tier, s.type, d.k, mode, mode === 'expected' ? 1 : report.input.N, v.N, v.demand, v.profit, v.rent, d.rentPerTsubo, d.rivals.map(r => r.type).join('+') || '0', d.rivals.map(r => r.lunchOnly ? 'lunch' : 'both').join('+'), v.demand > 70, v.entries, v.finalRivals, v.year1N, v.lunchN, v.nightN, v.extraProfit, v.lunchProfit, v.nightProfit, s.lunchWeight, s.day, s.food, s.quiet].map(csv).join(','));
  }
  fs.writeFileSync(path.join(out, 'sites.csv'), rows.join('\n') + '\n');
}
function workerRun(data) {
  return new Promise((resolve, reject) => {
    const w = new Worker(__filename, { workerData: data }); let message;
    w.once('message', x => { message = x; }); w.once('error', reject);
    w.once('exit', code => code ? reject(Error(`測定worker失敗: ${code}`)) : resolve(message));
  });
}

function projectPartFull(site, D, p) {
  const out = clone(site), hours = p['hours.lunchHours'] + p['hours.nightHours'];
  for (const d of out.draws) for (const mode of ['expected', 'monteCarlo']) for (const band of ['lunch', 'night']) {
    const key = band + 'Profit';
    if (d[mode][key] != null) d[mode][key] += 12 * Math.round(D.coef('wagePart') * p['hours.' + band + 'Hours'] / hours);
  }
  return out;
}

async function measure(opts, override = {}) {
  const { schema, values: p } = readParams(opts.params, override);
  p['hours.costMode'] = opts.costMode || p['hours.costMode'];
  const pending = Object.entries(p).filter(([k, v]) => k.startsWith('decision.') && v == null).map(([k]) => k);
  // 指定のない機構を黙って採用しない。相談中の実装は走らせず、その理由を明示する。
  const required = ['decision.entryTiming', 'decision.regularClosed', 'decision.partSaving', 'decision.referenceHours', 'decision.calibrationEntry'];
  const missing = required.filter(k => p[k] == null);
  if (missing.length) {
    const pendingReport = { status: '回答待ち・未測定', input: { K: opts.K, N: opts.N, seed: opts.seed, parameters: p }, missing, comments: [6569301272, 6569400310], tables: ['期待値（未測定）', '乱数込み（未測定）'].map(mode => ({ mode, rows: LABELS.map((label, i) => ({ number: i + 1, label, value: null, status: '測定不能', reason: '較正条件・昼夜の仕組みの回答待ち: ' + missing.join(', ') })) })) };
    fs.mkdirSync(opts.out, { recursive: true });
    fs.writeFileSync(path.join(opts.out, 'pending.json'), JSON.stringify(pendingReport, null, 2) + '\n');
    fs.writeFileSync(path.join(opts.out, 'pending.md'), '# 版0.5 初期値の測定状況\n\n回答待ちのため未測定。数値を捏造せず、候補地の周回前に停止した。\n\n' + pendingReport.tables.map(t => '## ' + t.mode + '\n\n|検査|値|判定|\n|---|---|---|\n' + t.rows.map(r => `|${r.number} ${r.label}|未測定|${r.status}|`).join('\n')).join('\n\n') + '\n');
    throw Error(`PR #11 の回答待ち: ${missing.join(', ')}。未承認の機構では測定しない`);
  }
  const evidence = gameEvidence();
  const trajectoryParams = { ...p, 'hours.costMode': 'design' };
  const cacheKey = hash(JSON.stringify({ p: trajectoryParams, K: opts.K, N: opts.N, seed: opts.seed, evidence, tool: hash(fs.readFileSync(__filename)) }));
  const cache = path.resolve(opts.cache || path.join('work', 'stationmap-cache'), cacheKey); fs.mkdirSync(cache, { recursive: true });
  const calPath = path.join(cache, 'calibration.json');
  let cal;
  if (fs.existsSync(calPath)) cal = JSON.parse(fs.readFileSync(calPath, 'utf8'));
  else { cal = await workerRun({ action: 'calibrate', p, opts }); fs.writeFileSync(calPath, JSON.stringify(cal)); }
  const D = loadGame(false), st = Object.fromEntries(D.tokyo23.stations.map(s => [s.id, s]));
  let sites = prepareSites(D, p);
  if (opts.limit) sites = sites.slice(0, opts.limit);
  const chunks = Array.from({ length: Math.min(opts.workers, sites.length) }, (_, i) => sites.filter((_, n) => n % opts.workers === i));
  let values = (await Promise.all(chunks.map(sites => workerRun({ action: 'sites', sites, p: trajectoryParams, cal, opts, cache })))).flat();
  if (p['hours.costMode'] === 'part-full') values = values.map(s => projectPartFull(s, D, p));
  const order = new Map(sites.map((s, i) => [s.id, i])); values.sort((a, b) => order.get(a.id) - order.get(b.id));
  const direction = await workerRun({ action: 'direction', p, cal, opts });
  const input = { K: opts.K, N: opts.N, seed: opts.seed, overrides: override, parameters: p };
  const summaries = ['expected', 'monteCarlo'].map(mode => summarize(values, mode, direction, p, opts));
  const report = { input, designStatus: p['hours.costMode'] === 'design' ? '設計書の式' : '設計書の外・参考値（合格に使わない）', parameterSchemaSha256: hash(JSON.stringify(schema)), gameSha256: evidence, toolSha256: hash(fs.readFileSync(__filename)), siteCount: values.length, calibration: cal, pending, summaries, limitations: ['天気・仕込みの条件付き期待値とN周の乱数込みは別の推定量', '保証金と造作の分布が未定の場合は初期キャッシュ・倒産率は未測定', 'ランダム札と町の行事は回帰台本と同様に無効。参入は別の独立した抽選', ...(opts.limit ? ['--limit の試運転。全候補地の受入判定には使えない'] : [])] };
  if (hash(JSON.stringify(gameEvidence())) !== hash(JSON.stringify(evidence))) throw Error('ゲームのファイルが測定中に変わった');
  writeReport(report, values, opts.out); return report;
}
function searchCombinations(schema, spec, seed) {
  const entries = Object.entries(spec.fields || {});
  if (!entries.length) throw Error('探索する項目を fields に指定する');
  for (const [k, vals] of entries) {
    const s = schema[k]; if (['foot.tierRatio', 'foot.distRatio'].includes(k)) throw Error(`比の制約は探索する係数ではない: ${k}`); if (!s || s.lo == null || s.hi == null) throw Error(`探索幅が未指定: ${k}`);
    if (!Array.isArray(vals) || !vals.length || vals.some(v => typeof v !== 'number' || !Number.isFinite(v) || v < s.lo || v > s.hi)) throw Error(`探索値が幅の外: ${k}`);
  }
  if (spec.mode === 'random') {
    let state = seed >>> 0;
    const rng = () => { state = Math.imul(state, 1664525) + 1013904223 >>> 0; return state / 4294967296; };
    if (!Number.isInteger(spec.trials) || spec.trials < 1) throw Error('random探索はtrials>=1');
    const combinations = Array.from({ length: spec.trials }, () => Object.fromEntries(entries.map(([k, a]) => [k, a[0] + rng() * (a[a.length - 1] - a[0])])));
    for (const [key, values] of Object.entries(spec.mandatoryValues || {})) {
      if (!spec.fields[key] || values.length > combinations.length || values.some(v => v < schema[key].lo || v > schema[key].hi)) throw Error('必須の探索値が不正: ' + key);
      values.forEach((v, i) => { combinations[i][key] = v; });
    }
    return combinations;
  }
  if (spec.mode !== 'grid') throw Error('探索modeはgridまたはrandom');
  return entries.reduce((all, [key, vals]) => all.flatMap(o => vals.map(v => ({ ...o, [key]: v }))), [{}]);
}
async function search(opts, override) {
  const { schema } = readParams(opts.params, override), spec = JSON.parse(fs.readFileSync(opts.search, 'utf8'));
  let combinations;
  try { combinations = searchCombinations(schema, spec, opts.seed); }
  catch (e) {
    fs.mkdirSync(opts.out, { recursive: true });
    fs.writeFileSync(path.join(opts.out, 'search-pending.json'), JSON.stringify({ status: '探索未実行', reason: e.message, specification: spec, K: opts.K, N: opts.N, seed: opts.seed, passing: [], trials: [], note: '0組を試したので解なしとは判定できない' }, null, 2) + '\n');
    throw e;
  }
  const results = [];
  const bValues = combinations.map(c => c['rent.b']);
  // 4.4 に必須の b=0.25/0.4/0.55 を探索記録で確認できる。
  for (let i = 0; i < combinations.length; i++) {
    const trial = String(i).padStart(4, '0'), p = { ...override, ...combinations[i] };
    const r = await measure({ ...opts, out: path.join(opts.out, 'trial-' + trial) }, p);
    const modes = r.summaries.map(s => ({ mode: s.mode, allPass: s.allPass, failures: s.rows.filter(r => !['合格', '報告のみ'].includes(r.status)), parameterRangeFailure: s.admissible ? null : '4.4: 赤字のくじが50%を越える', rivalAdditionFailure: s.rivalAdditionPass ? null : s.rivalAddition }));
    results.push({ trial, overrides: p, modes, allPass: modes.every(m => m.allPass) && r.pending.length === 0, failedCount: modes.reduce((n, m) => n + m.failures.length, 0) });
  }
  const result = { mode: spec.mode, seed: opts.seed, K: opts.K, N: opts.N, mandatoryBTested: [.25, .4, .55].map(b => ({ b, tested: bValues.includes(b) })), passing: results.filter(r => r.allPass), trials: results };
  fs.writeFileSync(path.join(opts.out, 'search.json'), JSON.stringify(result, null, 2) + '\n');
  fs.writeFileSync(path.join(opts.out, 'search.md'), '# 探索結果\n\n通過組数: ' + result.passing.length + '\n\n' + results.map(r => `- ${r.trial}: ${JSON.stringify(r.overrides)} / 外れ・測定不能の検査数=${r.failedCount}`).join('\n') + '\n');
  return result;
}
function parseArgs(argv) {
  const opts = { params: PARAMS, K: 8, N: 300, seed: 0, workers: 4, costMode: 'design', out: path.join(ROOT, 'docs/analysis/stationmap-sim/latest') };
  const map = { '--params': 'params', '--override': 'override', '--K': 'K', '--N': 'N', '--seed': 'seed', '--workers': 'workers', '--out': 'out', '--search': 'search', '--limit': 'limit', '--cache': 'cache', '--data': 'data', '--legacy-override': 'legacyOverride', '--cost-mode': 'costMode' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]; if (a === '--no-memo') opts.memoize = false;
    else if (a === '--regression' || a === '--self-test' || a === '--help') opts[a.slice(2)] = true;
    else if (map[a] && argv[i + 1] != null) opts[map[a]] = ['K', 'N', 'seed', 'workers', 'limit'].includes(map[a]) ? Number(argv[++i]) : argv[++i];
    else throw Error('未知の引数、または値がない: ' + a);
  }
  if (!['design', 'part-full'].includes(opts.costMode)) throw Error('cost-modeはdesignまたはpart-full');
  for (const k of ['K', 'N', 'workers']) if (!Number.isInteger(opts[k]) || opts[k] < 1) throw Error(k + 'は正の整数');
  if (!Number.isInteger(opts.seed) || opts.seed < 0 || opts.seed > 0xffffffff) throw Error('seedは0〜2^32-1の整数');
  if (opts.limit != null && (!Number.isInteger(opts.limit) || opts.limit < 1)) throw Error('limitは正の整数');
  return opts;
}
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { console.log('node boki2/tools/stationmap-sim.js [--params file] [--override JSON|file] [--K 8] [--N 300] [--seed 0] [--workers 4] [--out dir] [--search file] [--regression --data file --legacy-override JSON] [--self-test] [--cost-mode design|part-full]'); return; }
  if (opts['self-test']) return selfTest();
  if (opts.regression) { opts.legacyOverride = opts.legacyOverride ? JSON.parse(opts.legacyOverride) : {}; return regression(opts); }
  const over = opts.override ? JSON.parse(opts.override.trim().startsWith('{') ? opts.override : fs.readFileSync(opts.override, 'utf8')) : {};
  const r = opts.search ? await search(opts, over) : await measure(opts, over);
  console.log(opts.search ? `探索${r.trials.length}組、合格${r.passing.length}組` : toMarkdown(r));
}
if (!isMainThread) {
  try {
    const { action, p, opts, sites, cal, cache } = workerData, D = loadGame(true, undefined, opts.memoize !== false); installHooks(D, p);
    if (action === 'calibrate') parentPort.postMessage(calibrate(D, p, opts));
    else if (action === 'direction') parentPort.postMessage(directionTest(D, p, cal, opts));
    else if (action === 'sites') {
      parentPort.postMessage(sites.map(s => {
        const file = path.join(cache, hash(s.id) + '.json');
        if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
        const result = evaluateSite(D, s, p, cal, opts); fs.writeFileSync(file + '.tmp', JSON.stringify(result)); fs.renameSync(file + '.tmp', file); return result;
      }));
    } else throw Error('未知のworker処理');
  } catch (e) { console.error(e.stack); process.exitCode = 1; }
} else if (require.main === module) main().catch(e => { console.error(e.stack); process.exitCode = 1; });

async function selfTest() {
  const assert = require('assert/strict'), { schema, values: p } = readParams();
  assert.throws(() => readParams(PARAMS, { 'rent.b': .71 }), /探索幅/);
  assert.throws(() => readParams(PARAMS, { 'rival.countProb.center': .9 }), /確率/);
  assert.throws(() => readParams(PARAMS, { mystery: 1 }), /未知/);
  assert.throws(() => searchCombinations(schema, { mode: 'grid', fields: { 'hours.lunchHours': [4] } }, 0), /未指定/);
  const spec = { mode: 'grid', fields: { 'rent.b': [.25, .4, .55], 'rent.R0': [25000, 40000] } };
  assert.equal(searchCombinations(schema, spec, 0).length, 6);
  const random = { mode: 'random', trials: 10, fields: { 'rent.b': [.15, .7] } };
  assert.deepEqual(searchCombinations(schema, random, 7), searchCombinations(schema, random, 7));
  assert.notEqual(seedFor(0, 'site1', 23), seedFor(0, 'site12', 3));
  assert.equal(spearman([1, 2, 2, 4], [1, 2, 2, 4]), 1);
  assert.equal(spearman([1, 1], [2, 2]), null);
  const D = loadGame(false), original = { ...D.world }, C = D.coef;
  C.table.pRefStep.v = 0;
  const site = { id: 'parity', st: 'test', tier: 3, type: 'shoten', walk: 300, price: 1e7, lunchWeight: .5 }, open = opening(D, site, 0, 0, p, ['shinise']);
  open.rivals[0].lunchOnly = false; open.rivals[0].regularBands = [9, 9];
  const a = original.create({ seed: 0, area: 'shotengai' }).town.areas.shotengai;
  for (const [seg, v] of Object.entries(a.mix)) p['mix.shoten.' + seg] = v;
  p['hours.lunchCapacity'] = .5;
  p['regular.retain.shoten'] = 1; p['regular.churn.shoten'] = 1;
  const cal = { Pref: 170, eps: 1.1 };
  const plain = runLegacy(D, legacyWorld(D, 'shotengai', cal.Pref * open.F, ['shinise'], cal.eps, open.rent));
  loadGame(true); installHooks(D, p);
  const patched = run36(D, site, open, cal, p, { noEntry: true, seed: 0 });
  for (const field of ['N', 'demand', 'profit', 'rent']) assert.ok(Math.abs(plain[field] - patched[field]) < 1e-6, `${field}: 元=${plain[field]} 差込=${patched[field]}`);
  const again = run36(D, site, open, cal, p, { noEntry: true, seed: 0 }); assert.deepEqual(patched, again);
  const costs = makeWorld(D, site, open, cal, 0, p, 1, 'lunch');
  assert.equal(D.stationmap.laborCost(costs, { parts: 1 }, 200000), 88889);
  assert.equal(D.stationmap.laborCost(costs, { parts: 2 }, 400000), 200000);
  assert.equal(D.stationmap.utilityCost(costs, 90000), 40000);
  p['hours.costMode'] = 'part-full'; assert.equal(D.stationmap.laborCost(costs, { parts: 1 }, 200000), 0); p['hours.costMode'] = 'design';
  costs.stationmap.history = [44, 88, 132]; costs.stores[0].R = 3;
  assert.ok(Math.abs(entryProbability(costs, p) - (p['rival.entryBase'] * open.lambda + p['rival.entrySuccess'])) < 1e-12);
  const regularCost = run36(D, site, open, cal, p, { seed: 1234, hours: 'lunch' });
  p['hours.costMode'] = 'part-full'; const fullCost = run36(D, site, open, cal, p, { seed: 1234, hours: 'lunch' }); p['hours.costMode'] = 'design';
  assert.ok(Math.abs(fullCost.profit - regularCost.profit - 12 * 88889) < 1e-7);
  for (const key of ['N', 'demand', 'year1N', 'entries', 'finalRivals']) assert.equal(regularCost[key], fullCost[key]);
  const prices = [];
  run36(D, site, open, cal, p, { noEntry: true, rivalCut: true, fixedRoster: true, trace: (t, W) => { if (t >= 24 && t <= 27) prices.push(W.rivals[0].price); } });
  assert.deepEqual(prices, [800, 800, 800, 850]);
  const forced = clone(p); forced['rival.entryBase'] = 10; forced['rival.entrySuccess'] = 0;
  const empty = { ...open, rivals: [] }, timeline = [];
  run36(D, site, empty, cal, forced, { trace: (t, W) => { if (t < 3) timeline.push(W.rivals.filter(r => r.open !== false).length); } });
  assert.deepEqual(timeline, [0, 0, 1]);
  // ライバルが昼だけなら夜の需要の分母から消える。元の需要式を両側で使って確かめる。
  const W = makeWorld(D, site, open, cal, 0, p), list = [W.stores[0], ...W.rivals.map(r => ({ ...r, rival: true }))], comp = { ramp: 1, cal: 1, ev: 1, rain: 1 };
  const full = D.stationmap.expected(W, list, comp, D.world.expected)[0];
  W.rivals[0].lunchOnly = true;
  const lunch = D.stationmap.expected(W, list, comp, D.world.expected)[0];
  assert.ok(lunch.bands[1].Nnew > full.bands[1].Nnew);
  assert.ok(Math.abs(lunch.bands[0].Nnew - full.bands[0].Nnew) < 1e-10);
  // ここだけは架空のテスト入力。180000円などを設計の初期値へ採用するものではない。
  const fixture = clone(p); fixture['decision.referenceHours'] = 'both'; fixture['decision.calibrationEntry'] = 'none';
  const opts = { K: 2, N: 2, seed: 123, workers: 2 };
  const fake = Object.keys(KEY).map((type, i) => ({ id: 'fixture-' + i, st: 'fixture', tier: 3, type, walk: 300, price: 1e7, lunchWeight: .5 }));
  const temp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'stationmap-fixture-'));
  try {
    const fitted = await workerRun({ action: 'calibrate', p: fixture, opts });
    assert.ok(Math.abs(fitted.median - fixture['reference.target']) < .01, '架空条件の較正が44に届かない');
    const cache1 = path.join(temp, 'one'), cache2 = path.join(temp, 'two'); fs.mkdirSync(cache1); fs.mkdirSync(cache2);
    const one = await workerRun({ action: 'sites', p: fixture, cal, opts, sites: fake, cache: cache1 });
    const two = (await Promise.all([0, 1].map(i => workerRun({ action: 'sites', p: fixture, cal, opts, sites: fake.filter((_, j) => j % 2 === i), cache: cache2 })))).flat().sort((a, b) => a.id.localeCompare(b.id, 'en'));
    assert.equal(JSON.stringify(one), JSON.stringify(two));
    const direction = await workerRun({ action: 'direction', p: fixture, cal, opts });
    for (const mode of ['expected', 'monteCarlo']) assert.equal(summarize(one, mode, direction, fixture, opts).rows.length, 10);
    const again = await workerRun({ action: 'sites', p: fixture, cal, opts, sites: fake, cache: cache1 }); assert.equal(JSON.stringify(one), JSON.stringify(again));
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  console.log('OK：入力の制約・探索の再現・同順位・較正・参入2か月予兆・時間別費用・3か月値下げと復元・差し込みなしとの36か月同値・決定論・昼だけライバルの夜の取り合い・架空6属性の10行出力・worker数1/2と保存再開のバイト一致');
}
