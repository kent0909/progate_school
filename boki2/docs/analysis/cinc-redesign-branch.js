#!/usr/bin/env node
// 設計者 W（DESIGN-CINC-REBUILD 版0.5）：2号店の式のどこが割に合わなくしているかを切り分け（diag）、会社が育つ道（T2）が「町と読みで割れる」形になるかを数える（site5）。
// あわせて、崩せなかった立て直しの札の候補の仕組みを回す（bowl5）。版0.4 の cinc-redesign-break.js の写し方を引き継ぐ（ゲームのファイルは変えない。反実仮想）。
// 取りまとめ役の決定（版0.5）：2号店の場所の主の数は E（事前登録の形：住宅地の最初の3軒を外し、較正し直さない）。Ec は感度の行だけ。
//
// ■ 置き値の事前登録（版0.5。回す前にこの表を書き、件名に「事前登録」と入れて commit してから回す。回したあとで値は動かさない）
//   ─ 2号店の式（site5）。主の行は P＋E2＋S1＋K、人は e.5・c.3 の4つ＋出さない
//   P・S1・人の4つ：版0.4 の break.js と同じ値
//   E2 急拡大型を f.1 L848「出店 最高」「借入で年2〜3店」の形で：住宅地に t_e で1軒、t_e＋6 でもう1軒（年2店。郊外のエリアはこの町に無いので住宅地だけ）。
//      崩れ（f.1「1年の新店が今の店数を超えると崩れ 40〜60」の中ほど50%）は、seed が崩れの側なら t_e＋18 で2軒とも閉める。型の数は break.js の 'normal' のまま
//   K 2号店にも作戦の机と方針の札（この設計の T2.2-2）：ゲームの2号店は policy0 の既定（チラシ0・LINE なし・値段は開店の850円のまま：world.js:213〜216）で回る。
//      K は1号店と同じ手を2号店にも打つ：チラシ月3万（認知 A に月 0.3 を足し、2号店の営業利益から3万を引く）・LINE（churnLine）・値段は1号店と同じ（3年目から900円）。
//      チラシの効きはゲームの式（A ← 0.2·A＋チラシ÷10万）をそのまま写す（月の前に A を「0.2 を掛けると今月の値になる数」に置く）。
//      ■ 回す前の直し（2026-11-05、件名に「事前登録」）：最初の commit の実装は「月の後に 0.3 を足す」で、ゲームの式の定常の A 0.375 に対し 0.075 にしかならない写しの誤りだった
//        （diag の K の行の A 0.08 で気づいた。site5 の K の行は1行も出力が出る前に止めた）。値（チラシ月3万）は変えていない
//   ─ 感度の行（主の行に入れない。出どころの無い値）
//   O 2号店のその他の固定費（15万／20万：W.otherFixed を店ごとに払う式）の半分を本部の費用とみなし、2号店の営業利益に戻す【置き値：店ごとの内訳の資料なし】
//   B 屋号の認知を別のエリアにも：別のエリアの2号店は開いた月に1号店の認知 A の4分の1【置き値】（同じエリアは S1 の半分のまま）
//   S4 夜の客（版0.3 の値のまま）／Ec（版0.4 の較正し直し）
//   ─ 規則の当たり（Q7：見える数から計算すれば当たる判断か）
//   形の規則：パート1人で開いたときの24か月目の「席が埋まっている日」（ゲームの試算の行：world.js:431）が月6日以上ならパート2人、未満ならパート1人
//   一杯の規則：2号店のエリアの客層の混ざりで、相性（bowl.js の fit）の平均が一番高い一杯（今の一杯を除く）
//   ─ 立て直しの札（bowl5）。土台は版0.4 の主の行（F0＋B1＋R1＋N1）に E を入れた形（2号店の場所と同じ E）
//   B2 客層の混ざりの seed（d.1 L379「固定（seed で ±10）」・K25）：2号店のエリアの家族と勤め人を seed で ±0.10 動かす（版0.3 の dominance.js と同じ式）
//   CH 一杯を替えると常連が離れる（d.8 の手直し「変えすぎると常連の離れ +1%」の向き）：一杯と看板は麺・スープ・具の3つを替えるので手直し3回分、
//      離れ +3%/月を4か月（話題の山と同じ長さ）【置き値：量】
//   RV 改装の後の居心地の不満（e.4 L757 の「その後」：競合が来た店は居心地の不満）：改装の後12か月の内に2号店のエリアに新しいライバルが開いたら、2号店の評判 −0.25（改装の効き R +0.5 の半分）【置き値：量】
// 使い方：node cinc-redesign-branch.js diag | site5 <行の番号> | bowl5 <行の番号>
'use strict';
global.window = global;
const path = require('path');
const root = path.resolve(__dirname, '../..');
const STORY = require(path.join(root, 'tools/ramen-files.js')).story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA, Wd = D.world, BW = D.bowl;
const mode = process.argv[2] || 'diag', rowArg = process.argv[3];
const clone = (x) => JSON.parse(JSON.stringify(x));
const coef0 = D.coef; let MBQ = [];
D.coef = (k) => (k === 'mapBoost' ? coef0(k) * (MBQ.length ? MBQ.shift() : 1) : coef0(k));
const C = D.coef;
D.rivals.TYPES.normal = { name: 'らーめん 大波', label: '急拡大型', price: 850, R: 3.0, Q: 3.0, A: 1.0, L: 0, cost: 0.32, labor: 380000, rent: 180000, cash: 3000000, bowl: { noodle: 'mid', src: 'ready', soup: 'shoyu', top: ['nori'] }, weak: '店数では勝てない', follow: 0 };
const price1 = (t) => (t < 12 ? 800 : t < 24 ? 850 : 900);
const pol1 = (W, prev, parts = 1) => { const p = Wd.policy0(W, prev); Object.assign(p, { price: price1(W.t), map: true, haccp: true, line: true, flyer: 30000, parts, family: 0, prep: 'mid', supplier: 'std', sns: false, forecast: false, inspect: false, tweak: false }); return Wd.fitTime(W, p, D.rng(W.seed * 37 + W.t)); };
const completeFx = D.cards.byId.site2_complete.options[0].outcomes[0].fx;
const closeCard = D.cards.byId.close;
const FITOUT = C('fitout'), DEPOSIT = C('deposit'), OPEN_T = 19, H = 72;
const AREAS = ['shotengai', 'ekimae', 'jutaku'], FORMS = ['part1', 'part2'];
const EXTRA = { none: 0, renovate: 750000, format: 330000, close: -(DEPOSIT - 300000) };
const TONKOTSU0 = BW.SOUP.tonkotsu.cost;
const plotOf = (seed, area) => { const g = D.rng(seed * 7907 + AREAS.indexOf(area) + 1); return { u: 1 + (2 * g() - 1) * 0.2, r: 1 + (2 * g() - 1) * 0.2 }; };
const entrantOf = (seed) => { const g = D.rng(seed * 6151 + 29); return { at: 12 + Math.floor(24 * g()), fold: g() < 0.5 }; };
const fitAvg = (spec, mix) => { const b = BW.create(spec); return Object.entries(mix).reduce((t, [sg, w]) => t + w * BW.fit(b, sg), 0); };

function warm(seed, home) {
  let W = Wd.create({ seed, area: home, form: 'part1', bowl: BW.presets[0].spec }); let prev = null;
  for (let t = 0; t < OPEN_T; t++) { MBQ = [1]; const p = pol1(W, prev); const r = Wd.month(W, p, { noise: false, noCards: true, rng: D.rng(seed * 104729 + t) }); W = r.W; prev = p; }
  return { W, prev };
}
function run(base, o) {
  let w = clone(base.W), pr = base.prev; const m = o.mech || {}, seed = base.W.seed, home = base.W.stores[0].area;
  const plot = o.area && m.P ? plotOf(seed, o.area) : { u: 1, r: 1 };
  const ent = entrantOf(seed), staff = o.staff || 'owner', E = m.E || m.E2 || m.Ec;
  const rows = [];
  if (o.area) {
    w.flags.y2Build = { area: o.area, form: o.form, at: w.t, staff: 'hire' }; completeFx(w);
    const st = w.stores[1];
    if (m.S1 && o.area === home) st.A = (w.stores[0].A || 0) * 0.5;
    if (m.B && o.area !== home) st.A = (w.stores[0].A || 0) * 0.25;
    if (m.S4 && o.form === 'part2' && o.area !== home) w.town.areas[o.area].P *= 1 + ({ ekimae: 0.25, shotengai: 0.10, jutaku: 0.05 })[o.area];
    if (E && o.area === 'jutaku' && home !== 'jutaku') w.rivals = w.rivals.filter((r) => r.area !== 'jutaku');
    if (m.Ec && o.area === 'jutaku' && home !== 'jutaku') { const a = w.town.areas.jutaku; const ref = { id: 'ref', price: a.pRef, R: 3, A: 0, L: 0, bowl: BW.create(BW.presets[0].spec), parts: 1, family: 0, ref: true }; const sh = Wd.sharesFor({ area: 'jutaku', town: { areas: { jutaku: a } } }, [ref], { neutralFit: true })[0]; a.P = C('median') * C('potentialScale') * (a.potentialMul || 1) / Math.max(1e-6, sh); a.epsScale = 1 / Math.max(0.5, 1 - sh); }
    if (m.B2 && o.area !== home) { const a = w.town.areas[o.area]; const u = D.rng(w.seed * 7919 + 5)() * 2 - 1; const d = Math.max(-a.mix.family + 0.05, Math.min(a.mix.office - 0.05, 0.10 * u)); a.mix = { ...a.mix, family: +(a.mix.family + d).toFixed(3), office: +(a.mix.office - d).toFixed(3) }; }
    if (m.K) st.line = true;
    if (staff === 'boss') { const s0 = w.stores[0]; s0.Q = BW.Q(s0.bowl, {}) - 0.3; }
    if (staff === 'novice') st.Q = BW.Q(st.bowl, {}) - 0.3;
  }
  const op1 = [], op2 = [], dep2 = []; let Ad = o.area ? (w.stores[1].A || 0) : 0, closedRenov = -1, renovAt = -99, lastFixed = 0, chLeft = 0, rivalsBefore = null;
  for (let t = OPEN_T; t < OPEN_T + H; t++) {
    const st = w.stores[1];
    if (st && E && o.area === 'jutaku') {
      const opens = m.E2 ? [ent.at, ent.at + 6] : [ent.at];
      opens.forEach((at, j) => { if (t === Math.max(at, OPEN_T)) { const r = D.rivals.make('normal', 9 + j); r.id = 'entrant' + j; r.area = 'jutaku'; w.rivals.push(r); } });
      if (ent.fold && t === ent.at + 18) for (const r of w.rivals) if (/^entrant/.test(r.id)) r.open = false;
    }
    if (st && m.RV && renovAt >= 0 && t - renovAt <= 12) { const ids = w.rivals.filter((r) => (r.area || w.area) === st.area && r.open !== false).map((r) => r.id); if (rivalsBefore && ids.some((x) => !rivalsBefore.includes(x))) { st.R = Math.max(1, st.R - 0.25); rivalsBefore = ids; } }
    if (st && staff === 'novice' && t === OPEN_T + 6) st.Q = null;
    if (st && closedRenov === t - 1) st.open = true;
    if (st && m.K) { st.price = price1(t); Ad = C('adKeepFlyer') * Ad + 30000 / C('adUnit'); st.A = Ad / C('adKeepFlyer'); }
    if (st && chLeft > 0) { st.churnUp = (st.churnUp || 0) + 0.03; chLeft--; }
    if (o.close && o.close !== 'none' && t === o.cardT + 1 && st) {
      w.flags.y2CloseImprove = 'quality'; w.flags.y2CloseBowl = o.bowl || 'shoyu'; w.flags.y2CloseSign = o.sign || 'none'; w.flags.y2CloseQuote = {};
      const c = closeCard.options.find((x) => x.id === o.close); if (c.outcomes[0].fx) c.outcomes[0].fx(w);
      if (m.R1 && o.close === 'renovate') { st.R = Math.min(5, (st.R || 3) + 0.5); st.bowl.Fbase = Math.min(1.4, (st.bowl.Fbase || 1) + 0.1); st.equipmentCapacity = (st.equipmentCapacity || 0) + 10; st.open = false; closedRenov = t; renovAt = t; rivalsBefore = w.rivals.filter((r) => (r.area || w.area) === st.area && r.open !== false).map((r) => r.id); }
      if (m.N1 && o.close === 'format') { st.bowl.peak = 0.14; st.bowl.peak0 = 0.14; st.bowl.peakLeft = C('peakMonths'); }
      if (m.CH && o.close === 'format') { st.churnUp = (st.churnUp || 0) + 0.03; chLeft = 3; }
    }
    MBQ = [1, plot.u];
    const p = pol1(w, pr, o.area && staff === 'thick' ? 3 : 1);
    const r = Wd.month(w, p, { noise: false, noCards: true, rng: D.rng(seed * 104729 + t) }); w = r.W; pr = p;
    const a = r.res.stores ? r.res.stores[0] : r.res; let x1 = a.op; if (o.area && staff === 'thick') x1 -= 200000; op1.push(x1);
    const b = r.res.stores && r.res.stores[1];
    if (b && b.sales != null) {
      let y = b.op - (staff === 'pro' ? 250000 : staff === 'novice' ? 200000 : 0) - (plot.r - (w.rentMul || 1)) * C('rentPerTsubo')[o.area] * C('tsubo') - (m.K ? 30000 : 0) + (m.O ? 0.5 * w.otherFixed : 0);
      lastFixed = b.rent + b.labor + b.other + C('utilFixed');
      op2.push(y); dep2.push(b.dep || 0);
      rows.push({ i: t - OPEN_T, N: b.N, sales: b.sales, cogs: b.cogs + b.wasteCost, labor: b.labor + (staff === 'pro' ? 250000 : staff === 'novice' ? 200000 : 0), rent: b.rent, util: b.util, other: b.other, dep: b.dep, ads: b.ads + (m.K ? 30000 : 0), op: y, L: b.L, R: b.R, A: b.A, fullDays: b.fullDays, cap: b.cap });
    } else if (o.area && closedRenov === t) { op2.push(-lastFixed); dep2.push(0); }
    else { op2.push(0); dep2.push(0); }
  }
  return { op1, op2, dep2, rows };
}
function company(alone, r, extra) { let cum = 0, pay = null; for (let i = 0; i < alone.length; i++) { cum += (r.op2[i] || 0) + (r.dep2[i] || 0) - (alone[i] - r.op1[i]); if (pay == null && cum >= FITOUT + extra + DEPOSIT) pay = i + 1; } return { cum: cum - FITOUT - extra - DEPOSIT, pay }; }
const inc = (o, k) => { o[k] = (o[k] || 0) + 1; };
const pct = (o) => { const e = Object.entries(o).sort((a, b) => b[1] - a[1]); const tot = e.reduce((s, x) => s + x[1], 0); return e.length ? `${e[0][0]} ${e[0][1]}/${tot}（${Math.round((100 * e[0][1]) / tot)}%）` : '—'; };
const med = (a) => { const s = a.slice().sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };
const man = (x) => `${Math.round(x / 1e4)}万円`;
const out = (x) => console.log(x);
const STATES = []; for (const home of ['shotengai', 'ekimae']) for (let seed = 0; seed <= 29; seed++) STATES.push({ seed, home });

if (mode === 'diag') {
  // 2号店（社長の働きはただ、P＋E＋S1）と1号店の、開いて25〜72か月目の月の損益の中央値（360組・60状態）
  const keys = ['N', 'sales', 'cogs', 'labor', 'rent', 'util', 'other', 'dep', 'ads', 'op', 'L', 'R', 'A'];
  for (const [name, mech] of [['いまの式（P＋E＋S1）', { P: 1, E: 1, S1: 1 }], ['K を足す（2号店にも1号店と同じ手）', { P: 1, E: 1, S1: 1, K: 1 }]]) {
    const acc = {}, one = {}; keys.forEach((k) => { acc[k] = []; one[k] = []; });
    for (const S of STATES) {
      const base = warm(S.seed, S.home);
      for (const ar of AREAS) for (const fm of FORMS) { const r = run(base, { area: ar, form: fm, mech }); const late = r.rows.filter((x) => x.i >= 24); keys.forEach((k) => acc[k].push(med(late.map((x) => x[k])))); }
      const r0 = (() => { let W = clone(base.W), pr = base.prev; const rs = []; for (let t = OPEN_T; t < OPEN_T + 30; t++) { MBQ = [1]; const p = pol1(W, pr); const rr = Wd.month(W, p, { noise: false, noCards: true, rng: D.rng(S.seed * 104729 + t) }); W = rr.W; pr = p; rs.push({ ...rr.res, cogs: rr.res.cogs + rr.res.wasteCost }); } return rs.slice(5); })();
      keys.forEach((k) => one[k].push(med(r0.map((x) => (k === 'L' || k === 'R' || k === 'A' ? x[k] : x[k])))));
    }
    out(`== diag：${name}。月の中央値（2号店は開いて25〜72か月目、360組／1号店は2年目11月から6〜30か月目、60状態）`);
    out('  項目：2号店／1号店');
    keys.forEach((k) => out(`  ${k}：${k === 'N' || k === 'L' || k === 'R' || k === 'A' ? med(acc[k]).toFixed(2) : man(med(acc[k]))}／${k === 'N' || k === 'L' || k === 'R' || k === 'A' ? med(one[k]).toFixed(2) : man(med(one[k]))}`));
  }
}

if (mode === 'site5') {
  const ROWS = [
    ['版0.4 の E の主の行の再現（P＋E＋S1、人4つ＋出さない）', { P: 1, E: 1, S1: 1 }],
    ['主の行（版0.5）：P＋E2＋S1＋K、人4つ＋出さない', { P: 1, E2: 1, S1: 1, K: 1 }],
    ['感度：主の行＋O（その他の固定費の半分を本部へ）', { P: 1, E2: 1, S1: 1, K: 1, O: 1 }],
    ['感度：主の行＋B（屋号の認知を別のエリアにも）', { P: 1, E2: 1, S1: 1, K: 1, B: 1 }],
    ['感度：主の行＋S4（夜の客）', { P: 1, E2: 1, S1: 1, K: 1, S4: 1 }],
    ['感度：主の行の E2 を Ec の較正で（P＋E2＋Ec＋S1＋K）', { P: 1, E2: 1, Ec: 1, S1: 1, K: 1 }],
    ['K だけ（E2 なし：P＋E＋S1＋K）', { P: 1, E: 1, S1: 1, K: 1 }],
    ['E2 だけ（K なし：P＋E2＋S1）', { P: 1, E2: 1, S1: 1 }],
  ];
  const pick = rowArg != null ? rowArg.split(',').map(Number) : ROWS.map((_, i) => i);
  const staffs = ['boss', 'pro', 'novice', 'thick'];
  for (const ri of pick) {
    const [name, mech] = ROWS[ri];
    const dec = { open: {}, area: {}, form: {}, staff: {} }; const bestCum = [], stMed = {}; let formRule = 0, uRule = 0; const openByHome = { shotengai: 0, ekimae: 0 };
    for (const S of STATES) {
      const base = warm(S.seed, S.home); const alone = run(base, { mech }).op1;
      let bk = null, bv = -Infinity; const runs = {};
      for (const ar of AREAS) for (const fm of FORMS) for (const sf of staffs) { const r = run(base, { area: ar, form: fm, staff: sf, mech }); runs[`${ar}:${fm}:${sf}`] = r; const v = company(alone, r, 0).cum; (stMed[sf] = stMed[sf] || []).push(v); if (v > bv) { bv = v; bk = { ar, fm, sf }; } }
      inc(dec.area, bk.ar); inc(dec.form, bk.fm); inc(dec.staff, bk.sf); inc(dec.open, bv > 0 ? '出す' : '出さない'); if (bv > 0) openByHome[S.home]++; bestCum.push(bv);
      // 形の規則：最良の場所・人で、パート1人で開いたときの24か月目の「席が埋まっている日」
      const r1 = runs[`${bk.ar}:part1:${bk.sf}`]; const m24 = r1.rows.find((x) => x.i === 23); const rule = m24 && m24.fullDays >= 6 ? 'part2' : 'part1'; if (rule === bk.fm) formRule++;
      if (mech.P) { const mu = AREAS.slice().sort((a, b) => plotOf(S.seed, b).u - plotOf(S.seed, a).u)[0]; if (mu === bk.ar) uRule++; }
    }
    out(`== site5 ${ri}：${name}（60状態＝町 seed 0〜29×1号店の場所2、72か月）`);
    out(`  出すか：${pct(dec.open)} ${JSON.stringify(dec.open)}（出すが最良：1号店が商店街 ${openByHome.shotengai}/30・駅前 ${openByHome.ekimae}/30）　最良の出し方の会社の累計の中央値 ${man(med(bestCum))}`);
    out(`  場所（出すとしたら）：${pct(dec.area)} ${JSON.stringify(dec.area)}　規則「人通りが一番多い区画」の当たり ${uRule}/60`);
    out(`  形（同）：${pct(dec.form)} ${JSON.stringify(dec.form)}　規則「パート1人の24か月目に席が埋まる日が月6日以上ならパート2人」の当たり ${formRule}/60（${Math.round(formRule / 0.6)}%）`);
    out(`  人（同）：${pct(dec.staff)} ${JSON.stringify(dec.staff)}`);
    out(`  人の道ごとの会社の累計の中央値（360）：${Object.entries(stMed).map(([k, v]) => `${k} ${man(med(v))}`).join('・')}`);
  }
}

if (mode === 'bowl5') {
  const base0 = { R1: 1, N1: 1, E: 1 };
  const ROWS = [['土台：F0＋B1＋R1＋N1＋E', { ...base0 }], ['土台＋B2（客層の混ざりの seed）', { ...base0, B2: 1 }], ['土台＋CH（一杯を替えると常連が離れる）', { ...base0, CH: 1 }], ['土台＋RV（改装の後の居心地の不満。来る相手が要るので E2 も）', { ...base0, RV: 1, E2: 1 }], ['土台＋B2＋CH＋RV（3つとも）', { ...base0, B2: 1, CH: 1, RV: 1, E2: 1 }]];
  const pick = rowArg != null ? rowArg.split(',').map(Number) : ROWS.map((_, i) => i);
  BW.SOUP.tonkotsu.cost = TONKOTSU0 + 60;
  for (const ri of pick) {
    const [name, mech] = ROWS[ri];
    const kind = {}, bowlAll = {}, signAll = {}, timeAll = {}; let fitRule = 0; const spread = [];
    for (let seed = 0; seed <= 9; seed++) {
      const base = warm(seed, 'shotengai'); const alone = run(base, { mech }).op1;
      for (const ar of AREAS) for (const fm of FORMS) {
        const S = [['none', 'none', {}]];
        for (const ct of [22, 24, 26]) { S.push([`renovate@${ct}`, 'renovate', { close: 'renovate', cardT: ct }]); S.push([`close@${ct}`, 'close', { close: 'close', cardT: ct }]); for (const bo of ['tonkotsu', 'miso']) for (const sg of ['none', 'small', 'large']) S.push([`format:${bo}:${sg}@${ct}`, 'format', { close: 'format', cardT: ct, bowl: bo, sign: sg }]); }
        const rs = S.map(([k, kd, oo]) => ({ k, kd, oo, ...company(alone, run(base, { area: ar, form: fm, mech, ...oo }), EXTRA[kd]) })).sort((a, b) => b.cum - a.cum);
        const b = rs[0]; inc(kind, b.kd); inc(timeAll, String(b.oo.cardT || '—')); const bf = rs.find((r) => r.kd === 'format'); inc(bowlAll, bf.oo.bowl); inc(signAll, bf.oo.sign);
        // 一杯の規則：2号店のエリアの混ざり（B2 を入れた行は入れた後の混ざり）で相性の平均が一番高い一杯
        const w0 = clone(base.W); w0.flags.y2Build = { area: ar, form: fm, at: w0.t, staff: 'hire' }; completeFx(w0); let mix = w0.town.areas[ar].mix;
        if (mech.B2 && ar !== 'shotengai') { const u = D.rng(seed * 7919 + 5)() * 2 - 1; const d = Math.max(-mix.family + 0.05, Math.min(mix.office - 0.05, 0.10 * u)); mix = { ...mix, family: mix.family + d, office: mix.office - d }; }
        const rb = ['tonkotsu', 'miso'].sort((x, y) => fitAvg(BW.presets.find((p) => p.id === y).spec, mix) - fitAvg(BW.presets.find((p) => p.id === x).spec, mix))[0]; if (rb === bf.oo.bowl) fitRule++;
        spread.push(b.cum - rs.find((r) => r.k === 'none').cum);
      }
    }
    out(`== bowl5 ${ri}：${name}（60組＝町 seed 0〜9×2号店の場所3×形2、1号店は商店街）`);
    out(`  手の種類：${pct(kind)} ${JSON.stringify(kind)}`);
    out(`  一杯（一杯と看板を選んだとしたら）：${pct(bowlAll)} ${JSON.stringify(bowlAll)}　規則「客層との相性の平均が一番高い一杯」の当たり ${fitRule}/60（${Math.round(fitRule / 0.6)}%）`);
    out(`  看板（同）：${pct(signAll)} ${JSON.stringify(signAll)}`);
    out(`  打つ時点：${pct(timeAll)} ${JSON.stringify(timeAll)}　最良と何もしないの差の中央値 ${man(med(spread))}`);
  }
  BW.SOUP.tonkotsu.cost = TONKOTSU0;
}
