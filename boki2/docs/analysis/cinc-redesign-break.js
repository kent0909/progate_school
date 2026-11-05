#!/usr/bin/env node
// 設計者 W（DESIGN-CINC-REBUILD 版0.4）：2号店の支配的な手を「崩す仕組み」を考え直し、判断ごとの分母（DESIGN-RAMEN k.5 L1361「判断ごとに」）で数える。
// 版0.3 の cinc-redesign-dominance.js を置き換える（R-D Y3・T2-7、J-D G1・G2・G3）。ゲームのファイルは変えない。読み込んだあと、このスクリプトの中だけで状態を書き換える（反実仮想）。
//
// ■ 置き値の事前登録（版0.4。数を回す前にこの表を書き、この形で commit してから回した。回したあとで値は動かさない。R-D「置き値を線の内へ選び直すことは禁止」）
//   どの値も DESIGN-RAMEN の既存の行か、ゲームの既存の係数から取る。出どころの無い値は【置き値】と書き、主の行には入れず感度の行にだけ入れる。
//   ─ 2号店の場所（site）
//   P  区画の人通りと家賃（DESIGN-RAMEN e.4 site2 L755「物件（人通り・家賃・保証金・内装・坪）」、c.2 L262「区画は人通り・月の家賃…の5つの数」、
//      幅は d.9.5 の町の seed「潜在客 ±20%・家賃 ±20%」＝ゲームの係数 townPotentialSpread 0.2・townRentSpread 0.2）：
//      2号店の候補の区画（場所ごとに1つ）は、人通りの倍率 u と家賃の倍率 r を ±20% の一様で別々に持つ（rng(seed×7907＋場所の番号)）。
//      ゲームでは潜在客の倍率と家賃の倍率が町に1つで、2号店の町でも同じ値になる（world.js:67〜68、cards-y2.js:95 が同じ seed で作る）。
//      人通りは2号店の新しい客の流れに掛ける（地図の倍率 mapBoost の2つ目の呼び出しに掛ける。prepareStore の中で呼ぶのは world.js:275 だけ）。
//      家賃は2号店の月の営業利益を (r − 会社の家賃の倍率)×場所の坪の家賃×10坪 だけ動かす（家賃は口座にしか効かない）。
//   E  急拡大型（DESIGN-RAMEN c.2 L258「住宅地：最初の競合 なし→急拡大型が来る」、f.1 L848「2年目以降に住宅地・郊外へ出てくる」「1年の新店が今の店数を超えると崩れ 40〜60」）：
//      住宅地の2号店の町は最初の競合を0にする（J-D の S2'）。急拡大型は t_e＝12＋floor(24×rng) か月目（2〜3年目のどこか。seed）に住宅地へ1軒開く。
//      型の数：値段 850円（f.1「値付け 中」＝相場 price0）、品質 3.0・評判 3.0（f.1「得意 速さ」で品質の型は普通）、認知 1.0・原価率 0.32・人件費 38万・家賃 18万（安売りチェーンと同じチェーンの数）、
//      常連 0（新店）、元手 300万（f.1「元手 低（借入）」）。入れ子の型は普通（typeOf が型の名を入れ子に使うので、型の名を 'normal' にして登録する。rivals.create は最初の3つの型しか引かない）。
//      崩れ：f.1 の 40〜60 の中ほど 50% で、seed が崩れの側なら開いて18か月目【置き値：時期】に閉める。
//   S1 同じ町の認知の引き継ぎ（版0.3 のまま。V4・L1大）：同じエリアの2号店は開いた月に1号店の認知 A の半分。
//   S4 パート2人なら夜も開ける（版0.3 のまま。e.2 hours）：夜の客 駅前 +25%・商店街 +10%・住宅地 +5%【置き値：資料なし】。**主の行に入れず、感度の行だけ**。
//   人（staff：DESIGN-RAMEN e.5 hire_cook L770「修業経験者（高い）／未経験を育てる（安い・時間）／社長が2店を見る」「未経験は Q が半年低い。社長が見ると1号店の Q が落ちる」、
//      c.3 L271「人の構成を厚くに変える（社長の報酬・パート3人以上）」）：
//      owner  いまの式（社長の働きがただで2号店にも付く。DESIGN-RAMEN の条件の外。比べの基準としてだけ数える）
//      boss   社長が2店を見る：1号店の品質 Q を開いた月から −0.3 のまま（J-D の T3q の写し。量は【置き値】）
//      pro    修業経験者を雇う：2号店に月25万（版0.3 の置き値のまま）
//      novice 未経験を育てる：2号店に月20万（ゲームの wagePart）、2号店の Q が開いてから6か月 −0.3（量は boss と同じ）
//      thick  法人で厚く：1号店をパート3人にし、社長の報酬 月20万（c.8 L333 の表の「法人で厚く」）
//      none   出さない（会社の累計 0）
//   ─ 立て直しの札（bowl）
//   F0 ゲームの札の形に合わせる直し（正しさ）：一杯と看板で今の一杯（醤油）は選べない（ramen-y2-close.js:197 の optionsFor）。「閉める」も選択肢に入れる
//      （保証金90万が返り、原状回復30万を払う：ramen-y2-close.js:162・190）。版0.3 は醤油を選べ、閉めるを数えていなかった。
//   B1 豚骨を炊く時間を原価に +60円（版0.3 のまま。d.8 L497。版0.3 で値を選び直していない）
//   R1 改装の効きを e.4 L757 そのままに：R +0.5・F +0.1・処理量 +10杯/日（ゲームの改装の「処理量」の量）、改装中の休業1か月（e.4 L757）。**版0.3 の「半分」は取り下げ**（線に合わせた選び直し：R-D）
//   N1 新しい一杯の話題の山（d.8 L509「新しい一杯：F の基準を 1.0 に戻し、話題の山」）：当たり20 +0.25・普通50 +0.15・外れ30 +0.05 の期待値 +0.14 を4か月（peakMonths）
//   O1 開く一杯を選ぶ（d.8 の組み立て。ゲームの2号店は社長の案の1つ目＝醤油で開く：cards-y2.js:95）：その状態で何もしないときに会社の累計が最大の案で開く（上手な人の仮定）
//   時点（timing）：乱数ありの5回（noise）で、「22か月目に打つ」「26か月目の前の3か月の2号店の営業利益の合計が負なら打つ（待つ）」「何もしない」の期待値を比べる
//   物差し：判断ごとに、分母は全部の状態（k.5 L1361）。「〜としたら」の判断（場所・形・人・一杯・看板・時点）も分母は全部の状態にそろえる。
// 使い方：node cinc-redesign-break.js <site|staff|bowl|timing>
'use strict';
global.window = global;
const path = require('path');
const root = path.resolve(__dirname, '../..');
const STORY = require(path.join(root, 'tools/ramen-files.js')).story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA, Wd = D.world, BW = D.bowl;
const mode = process.argv[2] || 'site';
const clone = (x) => JSON.parse(JSON.stringify(x));
// 地図の倍率の呼び出しに区画の人通りを掛ける（2つ目の呼び出し＝2号店）
const coef0 = D.coef; let MBQ = [];
D.coef = (k) => (k === 'mapBoost' ? coef0(k) * (MBQ.length ? MBQ.shift() : 1) : coef0(k));
const C = D.coef;
// 急拡大型の型を登録する（入れ子は普通）
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

function warm(seed, home) {
  let W = Wd.create({ seed, area: home, form: 'part1', bowl: BW.presets[0].spec }); let prev = null;
  for (let t = 0; t < OPEN_T; t++) { MBQ = [1]; const p = pol1(W, prev); const r = Wd.month(W, p, { noise: false, noCards: true, rng: D.rng(seed * 104729 + t) }); W = r.W; prev = p; }
  return { W, prev };
}
// o：{ area, form, staff, mech:{P,E,S1,S4,R1,N1}, close, cardT, bowl, sign, openBowl, noise, rr, waitRule }
function run(base, o) {
  let w = clone(base.W), pr = base.prev; const m = o.mech || {}, seed = base.W.seed, home = base.W.stores[0].area;
  const plot = o.area && m.P ? plotOf(seed, o.area) : { u: 1, r: 1 };
  const ent = entrantOf(seed);
  const staff = o.staff || 'owner';
  if (o.area) {
    w.flags.y2Build = { area: o.area, form: o.form, at: w.t, staff: 'hire' }; completeFx(w);
    const st = w.stores[1];
    if (o.openBowl) { const p = BW.presets.find((x) => x.id === o.openBowl); st.bowl = BW.create(p.spec, p.name); }
    if (m.S1 && o.area === home) st.A = (w.stores[0].A || 0) * 0.5;
    if (m.S4 && o.form === 'part2' && o.area !== home) w.town.areas[o.area].P *= 1 + ({ ekimae: 0.25, shotengai: 0.10, jutaku: 0.05 })[o.area];
    if (m.E && o.area === 'jutaku' && home !== 'jutaku') w.rivals = w.rivals.filter((r) => r.area !== 'jutaku');
    if (staff === 'boss') { const s0 = w.stores[0]; s0.Q = BW.Q(s0.bowl, {}) - 0.3; }
    if (staff === 'novice') st.Q = BW.Q(st.bowl, {}) - 0.3;
  }
  const op1 = [], op2 = [], dep2 = []; let closedRenov = -1, lastFixed = 0, acted = false;
  for (let t = OPEN_T; t < OPEN_T + H; t++) {
    const st = w.stores[1];
    if (st && m.E && o.area === 'jutaku') {
      if (t === Math.max(ent.at, OPEN_T)) { const r = D.rivals.make('normal', 9); r.id = 'entrant'; r.area = 'jutaku'; w.rivals.push(r); }
      if (ent.fold && t === ent.at + 18) { const r = w.rivals.find((x) => x.id === 'entrant'); if (r) r.open = false; }
    }
    if (st && staff === 'novice' && t === OPEN_T + 6) st.Q = null;
    if (st && closedRenov === t - 1) { st.open = true; }
    let doAct = o.close && o.close !== 'none' && t === o.cardT + 1 && st;
    if (doAct && o.waitRule) { const s3 = op2.slice(-3).reduce((a, b) => a + b, 0); doAct = s3 < 0; }
    if (doAct) {
      acted = true;
      w.flags.y2CloseImprove = 'quality'; w.flags.y2CloseBowl = o.bowl || 'shoyu'; w.flags.y2CloseSign = o.sign || 'none'; w.flags.y2CloseQuote = {};
      const c = closeCard.options.find((x) => x.id === o.close); if (c.outcomes[0].fx) c.outcomes[0].fx(w);
      if (m.R1 && o.close === 'renovate') { st.R = Math.min(5, (st.R || 3) + 0.5); st.bowl.Fbase = Math.min(1.4, (st.bowl.Fbase || 1) + 0.1); st.equipmentCapacity = (st.equipmentCapacity || 0) + 10; st.open = false; closedRenov = t; }
      if (m.N1 && o.close === 'format') { st.bowl.peak = 0.14; st.bowl.peak0 = 0.14; st.bowl.peakLeft = C('peakMonths'); }
    }
    MBQ = [1, plot.u];
    const p = pol1(w, pr, o.area && staff === 'thick' ? 3 : 1);
    const rng = o.noise ? D.rng(seed * 104729 + t + 7777 * (o.rr + 1)) : D.rng(seed * 104729 + t);
    const r = Wd.month(w, p, { noise: !!o.noise, noCards: true, rng }); w = r.W; pr = p;
    const a = r.res.stores ? r.res.stores[0] : r.res; let x1 = a.op; if (o.area && staff === 'thick') x1 -= 200000; op1.push(x1);
    const b = r.res.stores && r.res.stores[1];
    if (b && b.sales != null) {
      let y = b.op - (staff === 'pro' ? 250000 : staff === 'novice' ? 200000 : 0) - (plot.r - (w.rentMul || 1)) * C('rentPerTsubo')[o.area] * C('tsubo');
      lastFixed = b.rent + b.labor + b.other + C('utilFixed');
      op2.push(y); dep2.push(b.dep || 0);
    } else if (o.area && closedRenov === t) { op2.push(-lastFixed - (staff === 'pro' ? 250000 : staff === 'novice' ? 200000 : 0)); dep2.push(0); }
    else { op2.push(0); dep2.push(0); }
  }
  return { op1, op2, dep2, acted };
}
function company(alone, r, extra) {
  let cum = 0, pay = null;
  for (let i = 0; i < alone.length; i++) { cum += (r.op2[i] || 0) + (r.dep2[i] || 0) - (alone[i] - r.op1[i]); if (pay == null && cum >= FITOUT + extra + DEPOSIT) pay = i + 1; }
  return { cum: cum - FITOUT - extra - DEPOSIT, pay };
}
const inc = (o, k) => { o[k] = (o[k] || 0) + 1; };
const pct = (o) => { const e = Object.entries(o).sort((a, b) => b[1] - a[1]); const tot = e.reduce((s, x) => s + x[1], 0); return e.length ? `${e[0][0]} ${e[0][1]}/${tot}（${Math.round((100 * e[0][1]) / tot)}%）` : '—'; };
const med = (a) => { const s = a.slice().sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const man = (x) => `${Math.round(x / 1e4)}万円`;
const out = (x) => console.log(x);
const STATES = []; for (const home of ['shotengai', 'ekimae']) for (let seed = 0; seed <= 29; seed++) STATES.push({ seed, home });

if (mode === 'site' || mode === 'staff') {
  const ROWS = mode === 'site'
    ? [['いまの式（社長の働きはただ）', {}, ['owner']], ['P 区画の人通りと家賃', { P: 1 }, ['owner']], ['E 急拡大型（c.2・f.1 の形）', { E: 1 }, ['owner']], ['P＋E＋S1（主の行）', { P: 1, E: 1, S1: 1 }, ['owner']], ['P＋E＋S1＋S4（感度：夜の客は置き値）', { P: 1, E: 1, S1: 1, S4: 1 }, ['owner']]]
    : [['P＋E＋S1、人は e.5・c.3 の4つ＋出さない（主の行）', { P: 1, E: 1, S1: 1 }, ['boss', 'pro', 'novice', 'thick']], ['同じ、ただし社長の働きがただの道も入れる（比べ）', { P: 1, E: 1, S1: 1 }, ['owner', 'boss', 'pro', 'novice', 'thick']], ['いまの式の町で、人は4つ＋出さない（P・E なし）', {}, ['boss', 'pro', 'novice', 'thick']]];
  out(`== ${mode}：状態は町（seed 0〜29）×1号店の場所（商店街・駅前）の60、2号店は2年目11月に開いて72か月。会社の累計＝2号店の営業の現金−1号店の食い合い−内装−保証金（−人の費用）`);
  for (const [name, mech, staffs] of ROWS) {
    const dec = { open: {}, area: {}, form: {}, staff: {}, combo: {} }, rule = { maxU: 0, minR: 0, jutaku: 0 }; const bestCum = [], posShare = {}; let nPos = 0; const stMed = {};
    for (const S of STATES) {
      const base = warm(S.seed, S.home); const alone = run(base, { mech }).op1;
      let bk = null, bv = -Infinity;
      for (const ar of AREAS) for (const fm of FORMS) for (const sf of staffs) {
        const v = company(alone, run(base, { area: ar, form: fm, staff: sf, mech }), 0).cum;
        (stMed[sf] = stMed[sf] || []).push(v);
        if (v > bv) { bv = v; bk = { ar, fm, sf }; }
      }
      inc(dec.area, bk.ar); inc(dec.form, bk.fm); inc(dec.staff, bk.sf); inc(dec.combo, `${bk.ar}・${bk.fm}・${bk.sf}`);
      inc(dec.open, bv > 0 ? '出す' : '出さない'); if (bv > 0) nPos++; bestCum.push(bv);
      if (mech.P) { const pl = Object.fromEntries(AREAS.map((a) => [a, plotOf(S.seed, a)])); const mu = AREAS.slice().sort((a, b) => pl[b].u - pl[a].u)[0], mr = AREAS.slice().sort((a, b) => pl[a].r - pl[b].r)[0]; if (bk.ar === mu) rule.maxU++; if (bk.ar === mr) rule.minR++; }
      if (bk.ar === 'jutaku') rule.jutaku++;
    }
    out(`  ${name}`);
    out(`    出すか（最良の出し方が正なら出す）：${pct(dec.open)} ${JSON.stringify(dec.open)}　最良の出し方の会社の累計の中央値 ${man(med(bestCum))}`);
    out(`    場所（出すとしたら、分母60）：${pct(dec.area)} ${JSON.stringify(dec.area)}`);
    out(`    形（同）：${pct(dec.form)} ${JSON.stringify(dec.form)}`);
    if (staffs.length > 1) out(`    人（同）：${pct(dec.staff)} ${JSON.stringify(dec.staff)}`);
    out(`    組（場所・形・人）：${pct(dec.combo)}`);
    if (mech.P) out(`    規則の当たり：「人通りが一番多い区画」が最良 ${rule.maxU}/60（${Math.round(rule.maxU / 0.6)}%）、「家賃が一番安い区画」${rule.minR}/60（${Math.round(rule.minR / 0.6)}%）、「住宅地」${rule.jutaku}/60（${Math.round(rule.jutaku / 0.6)}%）`);
    if (staffs.length > 1) out(`    人の道ごとの会社の累計の中央値（場所×形の6つ×60状態＝360の中央値）：${Object.entries(stMed).map(([k, v]) => `${k} ${man(med(v))}`).join('・')}`);
  }
  if (mode === 'staff') {
    // 2号店そのものの稼ぎ：社長の働きがただの道で、開いて25〜72か月目の2号店の月の営業利益（人の費用を引く前）の中央値
    const mo = [];
    for (const S of STATES) { const base = warm(S.seed, S.home); for (const ar of AREAS) for (const fm of FORMS) { const r = run(base, { area: ar, form: fm, staff: 'owner', mech: { P: 1, E: 1, S1: 1 } }); mo.push(med(r.op2.slice(24))); } }
    out(`  2号店の月の営業利益（社長の働きはただ、開いて25〜72か月目の各組の中央値を、360組でさらに中央値）：${man(med(mo))}/月（上位25% ${man(mo.slice().sort((a, b) => a - b)[Math.floor(mo.length * 0.75)])}/月）。修業経験者の月25万・未経験の月20万と比べる`);
  }
}

if (mode === 'bowl') {
  const ROWS = [['F0 ゲームの札の形（醤油は選べない・閉めるを入れる）', {}, 0, false], ['F0＋B1＋R1（e.4 L757 そのまま）＋N1（主の行）', { R1: 1, N1: 1 }, 60, false], ['主の行＋O1（開く一杯を選ぶ）', { R1: 1, N1: 1 }, 60, true], ['主の行＋P＋E＋S1（2号店の場所の仕組みも）', { R1: 1, N1: 1, P: 1, E: 1, S1: 1 }, 60, false]];
  out('== bowl：坂の上の立て直しの札（家族を除く60組＝町 seed 0〜9×2号店の場所3×形2、1号店は商店街、72か月）。手は 何もしない・改装×3時点・一杯と看板（豚骨・みそ×看板3）×3時点・閉める×3時点。判断ごとの分母は60');
  for (const [name, mech, add, chooseOpen] of ROWS) {
    BW.SOUP.tonkotsu.cost = TONKOTSU0 + add;
    const kind = {}, bowlAll = {}, signAll = {}, timeAll = {}, openB = {}; const spread = []; let flip = 0;
    for (let seed = 0; seed <= 9; seed++) {
      const base = warm(seed, 'shotengai'); const alone = run(base, { mech }).op1;
      for (const ar of AREAS) for (const fm of FORMS) {
        let ob = null;
        if (chooseOpen) { let bv = -Infinity; for (const p of BW.presets) { const v = company(alone, run(base, { area: ar, form: fm, mech, openBowl: p.id }), 0).cum; if (v > bv) { bv = v; ob = p.id; } } inc(openB, ob); }
        const cur = ob || 'shoyu';
        const S = [['none', 'none', {}]];
        for (const ct of [22, 24, 26]) {
          S.push([`renovate@${ct}`, 'renovate', { close: 'renovate', cardT: ct }]);
          S.push([`close@${ct}`, 'close', { close: 'close', cardT: ct }]);
          for (const bo of ['shoyu', 'tonkotsu', 'miso'].filter((x) => x !== cur)) for (const sg of ['none', 'small', 'large']) S.push([`format:${bo}:${sg}@${ct}`, 'format', { close: 'format', cardT: ct, bowl: bo, sign: sg }]);
        }
        const rs = S.map(([k, kd, oo]) => { const r = run(base, { area: ar, form: fm, mech, openBowl: ob, ...oo }); return { k, kd, oo, ...company(alone, r, EXTRA[kd]) }; }).sort((a, b) => b.cum - a.cum);
        const b = rs[0]; inc(kind, b.kd); inc(timeAll, String(b.oo.cardT || '—'));
        const bf = rs.find((r) => r.kd === 'format'); inc(bowlAll, bf.oo.bowl); inc(signAll, bf.oo.sign);
        const none = rs.find((r) => r.k === 'none'); if (none.pay == null && rs.some((r) => r.pay != null)) flip++; spread.push(b.cum - none.cum);
      }
    }
    out(`  ${name}`);
    if (chooseOpen) out(`    開く一杯（何もしないで最良の案）：${pct(openB)} ${JSON.stringify(openB)}`);
    out(`    札の1段目（手の種類）：${pct(kind)} ${JSON.stringify(kind)}`);
    out(`    一杯（一杯と看板を選んだとしたら）：${pct(bowlAll)} ${JSON.stringify(bowlAll)}`);
    out(`    看板（同）：${pct(signAll)} ${JSON.stringify(signAll)}`);
    out(`    打つ時点（最良の手の時点、何もしないは —）：${pct(timeAll)} ${JSON.stringify(timeAll)}`);
    out(`    最良と何もしないの差の中央値 ${man(med(spread))}、何もしないでは来ないが手で取り戻しが来る組 ${flip}/60`);
  }
  BW.SOUP.tonkotsu.cost = TONKOTSU0;
}

if (mode === 'timing') {
  // 主の行（F0＋B1＋R1＋N1）。決定論の回しで22か月目の最良の手と26か月目の最良の手を決め、乱数ありの5回で3つの打ち方の期待値を比べる
  BW.SOUP.tonkotsu.cost = TONKOTSU0 + 60; const mech = { R1: 1, N1: 1 };
  const best = {}, gain = [];
  const pick = (base, alone, ar, fm, ct) => { const S = [{ close: 'renovate', cardT: ct, kd: 'renovate' }, { close: 'close', cardT: ct, kd: 'close' }]; for (const bo of ['tonkotsu', 'miso']) for (const sg of ['none', 'small', 'large']) S.push({ close: 'format', cardT: ct, bowl: bo, sign: sg, kd: 'format' }); return S.map((oo) => ({ oo, cum: company(alone, run(base, { area: ar, form: fm, mech, ...oo }), EXTRA[oo.kd]).cum })).sort((a, b) => b.cum - a.cum)[0].oo; };
  for (let seed = 0; seed <= 9; seed++) {
    const base = warm(seed, 'shotengai'); const alone = run(base, { mech }).op1;
    for (const ar of AREAS) for (const fm of FORMS) {
      const a22 = pick(base, alone, ar, fm, 22), a26 = pick(base, alone, ar, fm, 26);
      const ev = { now22: 0, wait26: 0, none: 0 };
      for (let rr = 0; rr < 5; rr++) {
        const al = run(base, { mech, noise: 1, rr }).op1;
        ev.now22 += company(al, run(base, { area: ar, form: fm, mech, noise: 1, rr, ...a22 }), EXTRA[a22.kd]).cum / 5;
        const rw = run(base, { area: ar, form: fm, mech, noise: 1, rr, ...a26, waitRule: true });
        ev.wait26 += company(al, rw, rw.acted ? EXTRA[a26.kd] : 0).cum / 5;
        ev.none += company(al, run(base, { area: ar, form: fm, mech, noise: 1, rr }), 0).cum / 5;
      }
      const k = Object.entries(ev).sort((x, y) => y[1] - x[1])[0][0]; inc(best, k); gain.push(ev.now22 - ev.wait26);
    }
  }
  out('== timing：主の行（F0＋B1＋R1＋N1）、乱数ありの5回の期待値。打ち方は「22か月目に打つ」「26か月目の前の3か月の2号店の営業利益の合計が負なら打つ（待つ）」「何もしない」');
  out(`  最良の打ち方（分母60）：${pct(best)} ${JSON.stringify(best)}　「今打つ」−「待つ」の中央値 ${man(med(gain))}`);
  BW.SOUP.tonkotsu.cost = TONKOTSU0;
}
