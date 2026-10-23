// ラーメン版の世界の状態 W と需要の式（DESIGN-RAMEN 版0.5 d章・c.2・c.8・c.9・k.3）。純粋関数（DOM なし）。
// 月をまたいで持ち越す値は W の中だけ。乱数は seed から作る（同じ seed と同じ手で同じ結果：k.5 再現）。
// 係数は js/sim/coef.js（範囲と出どころつき）。一杯は bowl.js、ライバルは rivals.js、札は cards.js・decide.js。
(function (g) {
  const SIM = (g.SIMDATA = g.SIMDATA || {});
  const C = (k) => SIM.coef(k);
  const clone = (x) => JSON.parse(JSON.stringify(x));

  // ---------- 乱数（mulberry32） ----------
  SIM.rng = (seed) => { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];

  // ---------- 町（c.2）：切り身は3つの型。客層の混ざりと暦の型（d.3） ----------
  const AREAS = {
    shotengai: { label: '商店街', mix: { office: 0.3, family: 0.6, student: 0.1, tourist: 0 }, cal: 'shoten' },
    ekimae: { label: '駅前', mix: { office: 0.5, family: 0.3, student: 0, tourist: 0.2 }, cal: 'shoten' },
    jutaku: { label: '住宅地', mix: { office: 0.2, family: 0.7, student: 0.1, tourist: 0 }, cal: 'jutaku' },
  };
  // d.3 の暦（1月〜12月）。商店街・駅前（商業）と住宅地・郊外幹線の行。数は置き値（SIMDESIGN 10.2 の小さな暦）[FILL-RAMEN 1.1・1.5]
  const CAL = {
    shoten: [1.0, 0.95, 1.0, 1.0, 1.05, 0.95, 1.0, 1.05, 1.0, 1.0, 1.0, 1.05],
    jutaku: [1.05, 0.95, 1.0, 1.0, 1.05, 0.95, 1.0, 1.15, 1.0, 1.0, 1.0, 1.05],
    office: [0.85, 1.0, 1.0, 1.0, 0.85, 1.0, 1.0, 0.85, 1.0, 1.0, 1.0, 0.85],
    student: [1.0, 0.7, 0.7, 1.0, 1.0, 1.0, 1.0, 0.7, 0.7, 1.0, 1.0, 1.0],
    kanko: [1.0, 0.9, 1.0, 1.0, 1.3, 0.9, 1.3, 1.3, 1.0, 1.0, 1.0, 1.0],
  };
  const calendar = (type, m) => CAL[type][m - 1];
  // 雨の週の見込み（月ごとの週の雨の確率。梅雨と秋雨が多い）【置き値 (c)】。天気は客数の月の合計ではなく仕込みの外れに効く（X14）
  const RAIN = [0.25, 0.25, 0.3, 0.3, 0.3, 0.5, 0.4, 0.25, 0.4, 0.35, 0.3, 0.2];
  const SEGS = ['office', 'family', 'student', 'tourist'];
  const EPS = { office: 'epsOffice', family: 'epsFamily', student: 'epsStudent', tourist: 'epsTourist' };

  // ---------- 店の形（c.8・n.17）：おすすめの組3つ。人の構成は 0〜6人で自由（家族は上限2人・全員に給料） ----------
  const FORMS = { family: { label: '家族で小さく', parts: 0, family: 1 }, part1: { label: 'パート1人', parts: 1, family: 0 }, part2: { label: 'パート2人（昼夜）', parts: 2, family: 0 } };
  const workersOf = (st) => Math.min(C('hireMax'), st.parts + Math.max(0, st.family - 1));
  const capOf = (st) => Math.min(C('capBy')[workersOf(st)], C('capSeat'));
  const laborOf = (st) => st.parts * C('wagePart') + (st.family >= 1 ? C('wageFamily1') : 0) + Math.max(0, st.family - 1) * C('wageFamily2');
  const PRICE_MIN = 600, PRICE_MAX = 1400;

  // ---------- 時間の予算（c.9）：店主の手の空き。家族3・パート1人4・パート2人5、人を雇うと +1/人（上限2）、段0は +1 ----------
  const timeBudget = (W, p) => { const st = { parts: p.parts != null ? p.parts : W.stores[0].parts, family: p.family != null ? p.family : W.stores[0].family }; return 3 + Math.min(C('timeHireMax'), workersOf(st)) + (W.tier === 0 ? C('timeTier0') : 0); };
  const canTweak = (W) => W.t - (W.stores[0].bowl.tweakAt == null ? -99 : W.stores[0].bowl.tweakAt) >= 3;
  const timeUsed = (W, p) => { const T = C('timeCost'), me = W.stores[0]; let u = 0; if (p.forecast) u += T.forecast; if (p.inspect) u += T.inspect; if (p.map) u += me.mapDone ? T.map : T.mapFirst; if (p.sns) u += T.sns; if (p.haccp) u += T.haccp; if (p.tweak && canTweak(W)) u += T.tweak; if (p.rivalRead) u += T.rivalRead; return u; };
  const TIME_KEYS = ['forecast', 'inspect', 'map', 'sns', 'haccp', 'tweak', 'rivalRead'];
  // 予算を越えた手を、乱数で外して収める（無作為の手と試算の両方で使う）
  const fitTime = (W, p, rng) => { const q = { ...p }; let guard = 20; while (timeUsed(W, q) > timeBudget(W, q) && guard--) { const on = TIME_KEYS.filter((k) => q[k]); if (!on.length) break; q[pick(rng || Math.random, on)] = false; } return q; };

  // ---------- 世界を作る ----------
  function create(o = {}) {
    const seed = o.seed || 0, rng = SIM.rng(seed * 2654435761 + 97);
    const area = o.area || 'shotengai', form = FORMS[o.form || 'part1'];
    const bowlSpec = o.bowl || SIM.bowl.presets[0].spec;
    const me = { id: 'me', area, price: C('price0'), R: o.R0 != null ? o.R0 : 3, A: 0, L: 0, bowl: SIM.bowl.create(bowlSpec, o.bowlName), parts: o.parts != null ? o.parts : form.parts, family: o.family != null ? o.family : form.family, mapDone: false, line: false, churnUp: 0 };
    const W = {
      seed, t: 0, y: 1, m: 4, tier: o.tier != null ? o.tier : 0, area,
      town: { areas: { [area]: { ...AREAS[area], pRef: C('price0'), P: 0, V0: 2.0 } } },
      stores: [me], rivals: [],
      cash: C('ownCash') + C('loan') - C('fitout') - C('deposit') - C('equipOpen'), loan: C('loan'),
      flags: { rivalInfo: o.rivalInfo || 'A', ghost: !!o.ghost, met: {}, once: [], read: [], peeks: 1, omen: null, fire: [] },
      events: [], insolvent: 0, bankrupt: false, otherFixed: (o.otherFixed || (rng() < 0.25 ? 200000 : C('otherFixed'))), last: null, comp: null, cardsSeen: {},
    };
    // 町の行事（X3。切り身は3回：春の商店会・夏祭り・年末の売り出し。月と大きさは seed）
    W.events = [{ id: 'ev_spring', m: pick(rng, [4, 5]), size: 1.3 + 0.2 * rng() }, { id: 'ev_summer', m: 8, size: 1.3 + 0.2 * rng() }, { id: 'ev_year', m: 12, size: 1.3 + 0.2 * rng() }];
    W.rivals = SIM.rivals.create(seed, area, { run: o.run || 1, ghost: o.ghost, ghostChoices: o.ghostChoices });
    // 町の幅は既存の出来事・一杯の抽選と独立させ、保存後も同じ値を保持する（d.9.5）。
    const townRng = SIM.rng(seed * 65537 + 173);
    W.town.areas[area].potentialMul = 1 + (2*townRng()-1)*C('townPotentialSpread');
    W.rentMul = 1 + (2*townRng()-1)*C('townRentSpread');
    calibrate(W);
    return W;
  }
  // 潜在客 P：「平均の店（評判3・品質3・値段が相場・パート1人・宣伝なし）」が育ったとき中央値 44人/日になるように置く（d.2 外の選択 V0・d 結論）。
  // d.9.1：常連を加算した36か月の放置の店からpotentialScaleを逆算する。
  function calibrate(W) {
    const a = W.town.areas[W.area];
    const ref = { id: 'ref', price: a.pRef, R: 3, A: 0, L: 0, bowl: SIM.bowl.create(SIM.bowl.presets[0].spec), parts: 1, family: 0, ref: true };
    const share = sharesFor(W, [ref, ...W.rivals.map(rivalStore)], { neutralFit: true })[0];
    a.P = C('median') * C('potentialScale') * (a.potentialMul || 1) / Math.max(1e-6, share);
    // 設計の ε は「その店の客数が値段にどれだけ反応するか（弾力性）」。ロジットでは係数 β の店の弾力性は β(1−s)（s はその店の割合）なので、
    // 基準の店の割合で β＝ε/(1−s) に直す（d.2 の案C の試算は弾力性＝ε で計算している。係数のままだと店の弾力性が1割ほど小さくなり、損得のない点1.64をまたがない）
    a.epsScale = 1 / Math.max(0.5, 1 - share);
  }
  const rivalStore = (r) => ({ id: r.id, price: r.price, R: r.R, A: r.A, L: r.L, bowl: r.bowl, type: r.type, Q: r.Q, rival: true, open: r.open !== false });

  // ---------- 需要の式（d.2） ----------
  // 店の型（入れ子の上の段）：値段と品質で決まる
  // 型は一杯の組み立て（品質）で決まる。ライバルは型を持つ。設計 d.1 は「値段帯と Q」だが、値段で型が飛ぶと値段を上げて客が増える段差が出る（式の端の検査）ので、値段は ε の側だけで効かせる
  const typeOf = (s) => (s.type && s.type !== 'ghost' ? (s.type === 'shinise' ? 'normal' : s.type) : SIM.bowl.Q(s.bowl, s) >= 3.6 ? 'kodawari' : SIM.bowl.Q(s.bowl, s) < 2.8 ? 'cheap' : 'normal');
  const Fof = (b) => SIM.bowl.F(b);
  // 値段の項 ε·ln(p/p_ref)（1,000円を越える部分は ×1.5）
  const priceTerm = (p, pRef) => Math.log(p / pRef) + (C('epsOver1000') - 1) * Math.max(0, Math.log(p / 1000));
  // 同じ型に「相場より2割以上安い」店がいれば ×1.3（d.2 は自店より2割安い。自店の値段で段差が出て単調でなくなるので相場と比べる）
  function epsMul(s, all, pRef) {
    let k = 1;
    if (s.R >= 4.5) k *= C('epsHighRep');
    const ty = typeOf(s);
    if (all.some((o) => o !== s && o.open !== false && typeOf(o) === ty && o.price <= pRef * 0.8)) k *= C('epsCheaperRival');
    return k;
  }
  // 1つの客層・1つの傾きの客が、各店を選ぶ割合（入れ子のロジット）
  function shareSeg(W, list, seg, tilt, o) {
    const a = W.town.areas[W.area], lam = C('lambda');
    const u = list.map((s) => {
      if (s.open === false) return null;
      const Q = SIM.bowl.Q(s.bowl, s), F = Fof(s.bowl);
      const fit = o.neutralFit ? 0 : SIM.bowl.fit(s.bowl, seg);
      // 値段への敏感さの倍率（評判4.5以上 ×0.7・安い同じ型 ×1.3）は「相場より高い分」にだけ掛ける（安い分に掛けると、倍率の切り替わりで値段を上げて客が増える段差が出る）
      const eps0 = (C(EPS[seg]) + tilt) * (a.epsScale || 1), mul = epsMul(s, list, a.pRef);
      const pEff = s.coupon ? s.price * 0.9 : s.price, pt = priceTerm(pEff, a.pRef);
      let v = C('bR') * (s.R - 3) + C('bQ') * (Q - 3) + C('bF') * Math.log(F) + fit - eps0 * (pt > 0 ? mul * pt : pt) + C('bA') * Math.log(1 + (s.A || 0)) - C('bWait') * (s.wait || 0);
      return v;
    });
    const nests = {};
    list.forEach((s, i) => { if (u[i] == null) return; const ty = typeOf(s); (nests[ty] = nests[ty] || []).push(i); });
    const inner = {}, Vm = {};
    let den = a.V0;
    for (const [ty, ids] of Object.entries(nests)) { inner[ty] = ids.reduce((t, i) => t + Math.exp(u[i] / lam), 0); Vm[ty] = Math.pow(inner[ty], lam); den += Vm[ty]; }
    return list.map((s, i) => (u[i] == null ? 0 : (Vm[typeOf(s)] / den) * (Math.exp(u[i] / lam) / inner[typeOf(s)])));
  }
  // 客層と個人の傾き（敏感・中・寛容 各1/3）を重ねた、新規の客の割合（n.16）
  function sharesFor(W, list, o = {}) {
    const a = W.town.areas[W.area], tilt = C('epsTilt'), out = list.map(() => 0);
    for (const seg of SEGS) { const w = a.mix[seg]; if (!w) continue; for (const d of [-tilt, 0, tilt]) { const sh = shareSeg(W, list, seg, d, o); sh.forEach((x, i) => { out[i] += (w / 3) * x; }); } }
    return out;
  }
  const rampOf = (t) => (t < 12 ? C('rampStart') + ((C('rampEnd') - C('rampStart')) * t) / 11 : t < 24 ? C('rampEnd') + ((1 - C('rampEnd')) * (t - 11)) / 12 : 1);
  const eventMul = (W, m) => { const e = W.events.find((x) => x.m === m); return e ? 1 + (e.size - 1) / 4 : 1; }; // 行事は1週だけ ×1.3〜1.5（月では ÷4）
  const segEps = (W) => { const a = W.town.areas[W.area]; return SEGS.reduce((t, s) => t + a.mix[s] * C(EPS[s]), 0); };
  // 期待の客数（1日あたり。乱数なし）。comp で月の条件（暦・坂・行事）を渡す
  function expected(W, stores, comp) {
    const a = W.town.areas[W.area];
    const shares = sharesFor(W, stores);
    const epsAvg = segEps(W);
    return stores.map((s, i) => {
      if (s.open === false) return { Nnew: 0, Nreg: 0, N: 0 };
      const ramp = s.id === 'me' ? comp.ramp : 1;
      // d.2：新規の流れと常連は加算する。L/Nlastで新規を相殺すると店の成長が消える。
      // 地図・口コミの整備は新規の来店に ×1.2／未整備 ×0.8（d.4。割合の式の外で掛ける：入れ子の中で掛けると 1/λ 倍に効いてしまう）
      const Nnew = a.P * shares[i] * comp.cal * comp.ev * ramp * (s.id === 'me' ? comp.rain : 1) * (s.mapMul || 1);
      const Nreg = (s.L || 0) * Math.pow(s.price / a.pRef, -epsAvg * C('epsRegular')) * Math.pow(comp.cal, 0.5);
      return { Nnew, Nreg, N: Nnew + Nreg };
    });
  }
  const compOf = (W, o = {}) => ({ ramp: o.ramp != null ? o.ramp : rampOf(W.t), cal: calendar(W.town.areas[W.area].cal, W.m), ev: eventMul(W, W.m), rain: o.rain != null ? o.rain : 1 });
  // 自店の値段だけを変えたときの期待の客数（式の端の検査用）
  function expectN(W, price) { const me = { ...W.stores[0], price }; const list = [me, ...W.rivals.map(rivalStore)]; return expected(W, list, compOf(W))[0].N; }

  // ---------- 方針（作戦の机のいつでも手）----------
  function policy0(W, prev, o = {}) {
    const me = W.stores[0];
    const base = { price: me.price, prep: 'mid', forecast: false, inspect: false, map: true, sns: false, haccp: true, tweak: false, limited: false, flyer: 0, coupon: false, line: false, parts: me.parts, family: me.family, rivalRead: false };
    if (prev && !o.neutral) Object.assign(base, { ...prev, tweak: false, limited: false, coupon: false });
    if (prev && o.neutral) Object.assign(base, { price: prev.price, parts: prev.parts, family: prev.family });
    return base;
  }

  // ---------- 1か月を進める（純粋：W を写して返す） ----------
  // opts：rng（週の揺れ・天気・札・ライバル）、noise:false（期待値で）、noCards（試算用）
  function month(W0, pol, opts = {}) {
    const W = clone(W0), rng = opts.rng || SIM.rng(W.seed * 31 + W.t), noise = opts.noise !== false;
    const me = W.stores[0], a = W.town.areas[W.area];
    const res = { t: W.t, y: W.y, m: W.m, cards: [], docs: [] };
    // 方針を店に入れる
    const prevPrice = me.price;
    me.price = Math.max(PRICE_MIN, Math.min(PRICE_MAX, Math.round(pol.price)));
    me.parts = Math.max(0, Math.min(C('hireMax'), pol.parts));
    me.family = Math.max(0, Math.min(C('familyMax'), pol.family));
    me.coupon = !!pol.coupon;
    me.mapMul = pol.map ? C('mapBoost') : me.mapDone ? 1 : C('mapNone');
    if (pol.map) me.mapDone = true;
    if (pol.line && !me.line) me.line = true;
    // 一杯の手直し・限定（話題の山：d.8）
    if (pol.tweak && canTweak(W)) { me.bowl = SIM.bowl.apply(me.bowl, 'tweak', rng, W.t); }
    if (pol.limited) { me.bowl = SIM.bowl.apply(me.bowl, 'limited', rng, W.t); res.limited = true; }
    // 宣伝の残り（A）
    const keep = pol.sns ? C('adKeepSns') : C('adKeepFlyer');
    let snsGain = 0;
    if (pol.sns) { const x = noise ? rng() : 0.5; snsGain = x < 0.7 ? 0.1 : x < 0.95 ? 0.6 : x < 0.99 ? 3 : -0.5; res.sns = x < 0.7 ? 'none' : x < 0.95 ? 'slow' : x < 0.99 ? 'buzz' : 'flame'; }
    me.A = Math.max(0, keep * me.A + (pol.flyer || 0) / C('adUnit') + snsGain);
    // 予兆のあった新店が開く（f.3「近くに出店の予兆」：2か月前の工事の看板）
    if (W.flags.omen && !W.flags.omenOpened && W.t >= W.flags.omen.at) { const r = SIM.rivals.make(W.flags.omen.kind, W.rivals.length); r.id = 'rnew'; r.name = 'ごうりき軒 駅前店'; if (W.flags.omen.weak) r.R = 2.6; if (W.flags.omen.war) r.price = 650; W.rivals.push(r); W.flags.omenOpened = true; res.opened = r.id; }
    // ライバルの手（反応のルール f.3。予兆・遅れつき）
    const fixedPrices = opts.fixedRivalPrices || null;
    W.rivals = SIM.rivals.step(W, { prevPrice, price: me.price, limited: !!pol.limited }, rng);
    if (fixedPrices) for (const r of W.rivals) { if (fixedPrices[r.id] != null) r.price = fixedPrices[r.id]; }
    // 札（出来事）：月の山札から引いて、選んだ手の結果を W に返す（試算では引かない）
    me.pol = { ...pol };
    const fx = { demandMul: 1, cash: 0, Rd: 0 };
    // 前の月に選んだ札の結果（engine の流れ：札は月の途中で選び、結果は翌月の作戦の机のあとに返る。ramen.js）
    for (const c of opts.carry || []) {
      const card = SIM.cards.byId[c.id]; if (!card) continue;
      const out = SIM.decide.resolve(card, c.option, W, rng);
      SIM.cards.apply(W, card, c.option, out.id, fx, res, rng);
      (res.carried = res.carried || []).push({ card: c.id, option: c.option, outcome: out.id, t: c.t });
    }
    if (!opts.noCards && !opts.carry && SIM.cards) {
      const ids = SIM.cards.deal(W, rng);
      for (const id of ids) {
        const card = SIM.cards.byId[id];
        const optId = (pol.cards && pol.cards[id]) || (opts.cardChoice ? opts.cardChoice(card, W, rng) : card.options[Math.floor(rng() * card.options.length)].id);
        const out = SIM.decide.resolve(card, optId, W, rng);
        SIM.cards.apply(W, card, optId, out.id, fx, res, rng);
        res.cards.push(id);
        W.cardsSeen[id] = (W.cardsSeen[id] || 0) + 1;
      }
    }
    // 天気（週ごと）：雨の週は客が ×0.9。予報は月初に（外れることもある）
    const weeks = [0, 1, 2, 3].map(() => { const r = noise ? rng() < RAIN[W.m - 1] : false; return { rain: r, u: noise ? (rng() * 2 - 1) * C('noise') : 0 }; });
    const rainMul = weeks.reduce((t, w) => t + (w.rain ? C('rainCut') : 1), 0) / 4;
    const noiseMul = 1 + weeks.reduce((t, w) => t + w.u, 0) / 4;
    const comp = compOf(W, { rain: rainMul });
    const list = [me, ...W.rivals.map(rivalStore)];
    const ex = expected(W, list, comp);
    const e0 = ex[0];
    const Nd = Math.max(0, (e0.N * noiseMul + (e0.Nnew * (fx.demandMul - 1))));
    // 回せる客数（店の形）と週末の山：平日20日・週末6日。週末の倍率は客層の混ざり（d.3）
    const cap = capOf(me), fam = a.mix.family, k = fam * C('weekendFamily') + (1 - fam) * C('weekendSingle');
    const days = C('days'), dW = (Nd * days) / (20 + 6 * k);
    const servable = 20 * Math.min(dW, cap) + 6 * Math.min(k * dW, cap);
    const demand = Nd * days, overflow = demand - servable;
    // 仕込み：見込み（期待の客数）の外れ。予報を見ると外れ幅が半分（M8）。少なめ・ふつう・多め
    const err = C('prepErr') * (pol.forecast ? 0.5 : 1);
    const guess = e0.N * days * (1 + (noise ? (rng() * 2 - 1) * err : 0));
    const prepared = guess * ({ low: 0.9, mid: 1.0, high: 1.12 }[pol.prep] || 1);
    const sold = Math.max(0, Math.min(servable, prepared));
    const waste = Math.max(0, prepared - sold), lostStock = Math.max(0, Math.min(servable, demand) - sold), lostCap = Math.max(0, overflow);
    // 帳簿の数字（月）
    const unitCost = SIM.bowl.cost(me.bowl) * (me.costMul || 1) + (C('items') - 1) * C('price0') * C('cogs');
    const sales = Math.round(sold * me.price * C('items') * (me.coupon ? 0.95 : 1));
    const cogs = Math.round(sold * unitCost), wasteCost = Math.round(waste * SIM.bowl.cost(me.bowl) * C('wasteShare'));
    // 居抜きの契約で最初の3か月は家賃なし（ramen-y1.js の家賃の書類は7月から）
    const labor = Math.round(laborOf(me) + me.parts * C('wagePart') * ((me.wageUp || 1) - 1)), rent = W.t < C('freeRent') ? 0 : Math.round(C('rentPerTsubo')[W.area] * C('tsubo') * (W.rentMul || 1));
    const util = Math.round(C('utilFixed') + C('utilVar') * sales), other = W.otherFixed, dep = Math.round(C('fitout') / C('fitoutLife') / 12);
    const ads = (pol.flyer || 0) + (me.line ? 5000 : 0) + (res.limited ? 30000 : 0);
    const op0 = sales - cogs - wasteCost - labor - rent - util - other - dep - ads + fx.cash;
    // 家族の給料は赤字の月も labor に含む。旧保存・月報との互換のため famPay は0。
    const famPay = 0, op = op0;
    // 短期借入（c.4 の支払不能の手①。枠は1回・置き値）：口座が足りない月の手。金利は年4.5%【置き値 CALIB：4〜5%台】
    if (pol.borrow && !W.flags.shortUsed) { W.cash += C('shortLimit'); W.short = (W.short || 0) + C('shortLimit'); W.flags.shortUsed = true; res.borrowed = C('shortLimit'); }
    // 公庫の返済は最初の3か月はすえおき（利息はためておき、7月に4か月分をまとめて払う）
    const g0 = C('loanGrace'), intMonth = (W.loan * C('loanRate')) / 12;
    const interest = Math.round((W.t < g0 ? 0 : W.t === g0 ? intMonth * (g0 + 1) : intMonth) + ((W.short || 0) * C('shortRate')) / 12), repay = W.t < g0 ? 0 : Math.round(C('loan') / C('loanYears') / 12);
    const ord = op - interest;
    W.cash += ord + dep - repay;
    W.loan = Math.max(0, W.loan - repay);
    // 評判（体験）・常連・相場の値段・一杯の魅力の月の動き
    const stockRate = (lostStock + lostCap) / Math.max(1, demand), waitRate = lostCap / Math.max(1, demand);
    const Q = SIM.bowl.Q(me.bowl, me), F = Fof(me.bowl);
    // 体験：一杯の品質と魅力、客層との相性、品切れと待ち（行列は長く続くと評判を下げる）、札の結果
    const fitAvg = SEGS.reduce((t, sg) => t + a.mix[sg] * SIM.bowl.fit(me.bowl, sg), 0);
    const exp = Q + 2 * Math.log(F) + 2 * fitAvg - C('repStock') * stockRate - C('repWait') * waitRate + (fx.Rd || 0) * 4;
    me.R = Math.max(1, Math.min(5, me.R + C('repAlpha') * (exp - me.R)));
    const hike = Math.max(0, (me.price - prevPrice) / prevPrice);
    const churnBase = Math.max(C('churnFloor'), C('churn') - (me.line ? C('churnLine') : 0) - C('churnRep')*Math.max(0,me.R-3) + C('churnPerHike')*hike*10 + (F<0.9?0.01:0) + (me.churnUp || 0));
    // 値下げをした後、最初に値上げした月の離れを2倍にする（d.2 版0.5）。
    const discountRebound = hike > 0 && !!me.discounted;
    const churn = Math.min(1, churnBase * (discountRebound ? C('discountChurn') : 1));
    if (me.price < prevPrice) me.discounted = true;
    else if (hike > 0) me.discounted = false;
    const regularBefore = me.L;
    const newServed = (sold * e0.Nnew) / Math.max(1e-9, e0.N * days); // 1日あたりの新規の客で、実際に食べた人
    const regularAdded = C('retain') * newServed * (1 + 0.3 * (me.R - 3));
    me.L = Math.max(0, me.L * (1 - churn) + regularAdded);
    const regularDelta = me.L - regularBefore;
    const fullDays = (dW >= cap ? 20 : 0) + (k * dW >= cap ? 6 : 0);
    me.churnUp = 0;
    me.Nlast = sold / days;
    me.wait = waitRate * 60;
    a.pRef = list.slice(1).every(x=>x.open===false) ? C('price0') : (1 - C('pRefStep')) * a.pRef + C('pRefStep') * weightedPrice(list);
    me.bowl = SIM.bowl.step(me.bowl, { tier: W.tier, regShare: me.L / Math.max(1, e0.N) });
    // ライバルの月の損益と常連（同じ式で：f.2）
    SIM.rivals.settle(W, ex.slice(1), comp);
    // 要因の分解（d.7）：前の月との差を、要因を1つずつ前の月の値に戻して測る
    const factors = W.comp && !opts.noFactors ? decompose(W0, W, comp, list, ex[0].N) : { total: 0 };
    res.peakEffect = Math.exp(C('bF') * Math.log(F)) / Math.exp(C('bF') * Math.log(me.bowl.Fbase || 1)) - 1;
    W.comp = { ...comp, price: me.price, pRef: a.pRef, R: me.R, F, A: me.A, rivals: W.rivals.map((r) => ({ id: r.id, price: r.price, open: r.open !== false, R: r.R })), N: ex[0].N, mapMul: me.mapMul };
    Object.assign(res, { regularAdded, regularDelta, regularLost: regularBefore * churn, fullDays, discountRebound, famPay, N: sold / days, Nd, demand: demand / days, X: Math.round(sold), waste: Math.round(waste), lost: Math.round(lostStock + lostCap), sales, cogs, wasteCost, labor, rent, util, other, dep, ads, op, interest, ord, repay, cash: W.cash, loan: W.loan, R: me.R, L: me.L, A: me.A, F, Q, cap, weeks, pRef: a.pRef, factors, time: { budget: timeBudget(W0, pol), used: timeUsed(W0, pol) }, fx: fx.cash });
    // 支払不能：口座が足りない月が3か月続くと倒産（c.4。切り身では短期の借入・猶予の手はまだない）
    W.insolvent = W.cash < 0 ? W.insolvent + 1 : 0;
    if (W.insolvent >= 3) W.bankrupt = true;
    W.last = res;
    // 暦を進める
    W.t += 1; W.m = (W.m % 12) + 1; if (W.m === 4) W.y += 1;
    return { W, res };
  }
  // d.9.1：相場は開いている町の店だけ。0軒なら基準850円を使い、自店で相場を動かさない。
  const weightedPrice = (list) => { const r = list.slice(1).filter((x) => x.open !== false); const w = SIM.coef('pRefOwn'); return r.length ? w * list[0].price + (1 - w) * (r.reduce((t, x) => t + x.price, 0) / r.length) : C('price0'); };
  // 要因の分解：要因を前の月の値に戻したときの期待の客数との差（1日あたり）
  function decompose(Wprev, W, comp, list, Nnow) {
    const P = W.comp, out = {};
    const mk = (patch) => {
      const a0 = Wprev.town.areas[Wprev.area], Wx = { area: Wprev.area, town: { areas: { [Wprev.area]: { ...a0 } } } };
      const meX = { ...list[0], ...(patch.me || {}) };
      const rivalsX = patch.rivals ? list.slice(1).map((s) => { const r = patch.rivals.find((x) => x.id === s.id); return r ? { ...s, price: r.price, open: r.open, R: r.R } : { ...s, open: false }; }) : list.slice(1);
      Wx.town.areas[Wx.area].pRef = patch.pRef != null ? patch.pRef : W.comp ? Wprev.town.areas[Wprev.area].pRef : Wx.town.areas[Wx.area].pRef;
      const c = { ...comp, ...(patch.comp || {}) };
      return expected(Wx, [meX, ...rivalsX], c)[0].N;
    };
    const base = mk({});
    const prevBowl = { ...list[0].bowl, peak: 0, Fbase: P.F, peakLeft: 0 };
    out.ramp = base - mk({ comp: { ramp: P.ramp } });
    out.calendar = base - mk({ comp: { cal: P.cal, ev: P.ev } });
    out.weather = base - mk({ comp: { rain: P.rain } });
    out.price = base - mk({ me: { price: P.price } });
    out.rep = base - mk({ me: { R: P.R } });
    out.bowl = base - mk({ me: { bowl: prevBowl } });
    out.ad = base - mk({ me: { A: P.A, mapMul: P.mapMul } });
    out.rival = base - mk({ rivals: P.rivals });
    out.stockout = (W.last ? 0 : 0);
    out.total = Nnow - P.N;
    return out;
  }

  // ---------- 試算（d.7）：乱数なし（mc>0 なら乱数の平均）で n か月の経常利益の合計 ----------
  function evalPolicy(W, pol, n, o = {}) {
    const runs = o.mc || 0;
    if (!runs) { let x = W, s = 0; for (let k = 0; k < n; k++) { const r = month(x, k ? { ...pol, tweak: false, limited: false } : pol, { noise: false, noCards: true, noFactors: true }); s += r.res.ord; x = r.W; } return s; }
    let tot = 0;
    for (let j = 0; j < runs; j++) { let x = W, s = 0; for (let k = 0; k < n; k++) { const r = month(x, k ? { ...pol, tweak: false, limited: false } : pol, { noCards: true, noFactors: true, rng: SIM.rng(1000 + j * 17 + k) }); s += r.res.ord; x = r.W; } tot += s; }
    return tot / runs;
  }
  // d.2・d.7：画面の担当にも渡せる試算の行。L は1日あたりの杯数なので、
  // 人数への換算は「月4回来る常連」（k.8 #4 の retain の由来）の置き値を明示。
  function trial(W, pol) {
    const res = month(W, pol, { noise: false, noCards: true, noFactors: true, rng: SIM.rng(90001 + W.t) }).res;
    const regularPeople = res.regularDelta * C('days') / C('regularVisits');
    return { res, regularPeople, rows: [
      ['常連の増減（月4回来る人に換算）', `常連 ${regularPeople >= 0 ? '+' : ''}${regularPeople.toFixed(1)}人/月`],
      ['席が埋まっている日', `${res.fullDays}日/月`],
    ] };
  }
  // 詰み：人を減らし（パート0人）・宣伝をやめ・値段は据え置いても、n か月のうちに口座が尽きる
  // 「どの手を打っても」：人を減らす手に、値段を据え置く・100円上げる・100円下げるの3つを掛けて、どれも尽きるなら詰み
  function rescueFails(W, n) {
    for (const d of [0, 100, -100]) {
      let x = W, dead = false;
      for (let k = 0; k < n; k++) { const p = policy0(x, null, { neutral: true }); p.price = W.stores[0].price + d; p.parts = 0; p.borrow = true; p.family = 0; p.flyer = 0; p.line = false; const r = month(x, p, { noise: false, noCards: true, noFactors: true }); x = r.W; if (x.cash < 0) { dead = true; break; } }
      if (!dead) return false;
    }
    return true;
  }

  // 手もとに残るお金（ネットキャッシュ）＝口座−借入（ゴールの物差し：b.1）
  const netCash = (W) => W.cash - W.loan - (W.short || 0);
  SIM.world = { netCash, AREAS, FORMS, CAL, calendar, create, month, policy0, expectN, evalPolicy, trial, rescueFails, timeBudget, timeUsed, fitTime, canTweak, capOf, laborOf, workersOf, typeOf, sharesFor, PRICE_MIN, PRICE_MAX, rampOf, TIME_KEYS };
})(typeof window !== 'undefined' ? window : globalThis);

