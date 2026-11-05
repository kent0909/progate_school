#!/usr/bin/env node
// 設計者 W（DESIGN-CINC-REBUILD 版0.3）：2号店の2つの支配的な手を、設計の仕組みで崩せるかを数える。
//   ① 出店の場所×形（J-D F1：住宅地・パート1人が 40/40）
//   ② 坂の上の立て直しの手の一杯（R-D 2.2：豚骨が 44/60＝73%）
// 物差しは設計書の約束「どの状態でも1つの選択肢が最適な状態 <70%」（T7.2-3・DESIGN-RAMEN k.5）。
// ゲームのファイルは変えない。読み込んだあと、このスクリプトの中だけで状態を書き換えて「仕組みを入れた版」を作る（反実仮想）。
// 入れる仕組み（どれも設計書の本文に書いた案。数は【置き値】）：
//   S1 同じ町の認知の引き継ぎ（V4・L1大）：同じエリアに出した2号店は、開いた月に1号店の認知 A の半分を持つ（屋号が知られている）
//   S2 急拡大型が住宅地へ来る（DESIGN-RAMEN c.2 L258「なし→急拡大型が来る」、f.1 L848「2年目以降に住宅地・郊外へ出てくる」）：
//      住宅地に自店がある町では、3年目4月（t=24）に安売りの型の店が1軒、住宅地に開く（ゲームに急拡大型の型が無いので、型は安売りで代える）
//   S3 隣のエリアの少しの食い合い（T2.2-4 の置き値の案）：別のエリアの2号店でも、2号店の客の5%が1号店から来た客とみなし、
//      1号店の月の営業利益から「その客数×1号店の1人あたりの粗利」を引く
//   S4 パート2人（昼夜）なら夜も開ける（DESIGN-RAMEN e.2 hours「①夜が乗って増益35」）：別のエリアの2号店がパート2人なら、そのエリアの潜在客を
//      駅前 +25%・商店街 +10%・住宅地 +5%【置き値】（夜の勤め人・観光の客。同じエリアの1号店がある所では測れないので別のエリアだけ）
//   B1 豚骨を炊く手間の原価（d.8 の原価の置き値の見直し）：とんこつのスープの原価を 145→205円（+60円。光熱と仕込みの時間を原価に入れた【置き値】）
//   R1 改装の効きを DESIGN-RAMEN e.4 renovate L757「効果は R +0.5 と cap 増、F +0.1」に（ゲームの札は品質 +0.2 だけ）。cap 増は入れていない
//   B2 町ごとの客層の混ざりの変種（DESIGN-RAMEN i.3「型の混ざり ±10」）：2号店のエリアの家族・勤め人の割合を seed で ±0.10 動かす
// 使い方：node cinc-redesign-dominance.js [site|bowl|all] [bowl の組の番号（例 4,5）]
'use strict';
global.window = global;
const path = require('path');
const root = path.resolve(__dirname, '../..');
const STORY = require(path.join(root, 'tools/ramen-files.js')).story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA, Wd = D.world, C = D.coef, BW = D.bowl;
const mode = process.argv[2] || 'all';
const clone = (x) => JSON.parse(JSON.stringify(x));
const price1 = (t) => (t < 12 ? 800 : t < 24 ? 850 : 900);
const pol1 = (W, prev) => { const p = Wd.policy0(W, prev); Object.assign(p, { price: price1(W.t), map: true, haccp: true, line: true, flyer: 30000, parts: 1, family: 0, prep: 'mid', supplier: 'std', sns: false, forecast: false, inspect: false, tweak: false }); return Wd.fitTime(W, p, D.rng(W.seed * 37 + W.t)); };
const completeFx = D.cards.byId.site2_complete.options[0].outcomes[0].fx;
const closeCard = D.cards.byId.close;
const FITOUT = C('fitout'), DEPOSIT = C('deposit');
const EXTRA = { none: 0, stick: 0, renovate: 750000, format: 330000 };
const OPEN_T = 19;
const TONKOTSU0 = BW.SOUP.tonkotsu.cost;

function warm(seed, home) {
  let W = Wd.create({ seed, area: home, form: 'part1', bowl: BW.presets[0].spec }); let prev = null;
  for (let t = 0; t < OPEN_T; t++) { const p = pol1(W, prev); const r = Wd.month(W, p, { noise: false, noCards: true, rng: D.rng(seed * 104729 + t) }); W = r.W; prev = p; }
  return { W, prev };
}
// o：{ area, form, close, cardT, bowl, sign, mech:{S1,S2,S3,B2} }
function run(base, H, o) {
  let w = clone(base.W), pr = base.prev; const m = o.mech || {};
  if (o.area) {
    w.flags.y2Build = { area: o.area, form: o.form, at: w.t, staff: 'hire' }; completeFx(w);
    const st = w.stores[1];
    if (m.S1 && o.area === w.stores[0].area) st.A = (w.stores[0].A || 0) * 0.5;
    if (m.S4 && o.form === 'part2' && o.area !== w.stores[0].area) w.town.areas[o.area].P *= 1 + ({ ekimae: 0.25, shotengai: 0.10, jutaku: 0.05 })[o.area];
    if (m.B2) { const a = w.town.areas[o.area]; const u = D.rng(w.seed * 7919 + 5)() * 2 - 1; const d = Math.max(-a.mix.family + 0.05, Math.min(a.mix.office - 0.05, 0.10 * u)); a.mix = { ...a.mix, family: +(a.mix.family + d).toFixed(3), office: +(a.mix.office - d).toFixed(3) }; }
  }
  const op1 = [], op2 = [], dep2 = [];
  for (let t = OPEN_T; t < OPEN_T + H; t++) {
    if (o.area && m.S2 && t === 24 && w.town.areas.jutaku && w.stores[1] && w.stores[1].area === 'jutaku') { const r = D.rivals.make('cheap', 9); r.id = 'entrant'; r.area = 'jutaku'; w.rivals.push(r); }
    if (o.area && o.close && o.close !== 'none' && t === o.cardT + 1 && w.stores[1]) {
      w.flags.y2CloseImprove = 'quality'; w.flags.y2CloseBowl = o.bowl || 'shoyu'; w.flags.y2CloseSign = o.sign || 'none'; w.flags.y2CloseQuote = {};
      const c = closeCard.options.find((x) => x.id === o.close); if (c.outcomes[0].fx) c.outcomes[0].fx(w);
      if (m.R1 && o.close === 'renovate') { const st = w.stores[1]; const k = m.R1; st.R = Math.min(5, (st.R || 3) + 0.5 * k); st.bowl.Fbase = Math.min(1.4, (st.bowl.Fbase || 1) + 0.1 * k); }
    }
    const p = pol1(w, pr); const r = Wd.month(w, p, { noise: false, noCards: true, rng: D.rng(base.W.seed * 104729 + t) }); w = r.W; pr = p;
    const a = r.res.stores ? r.res.stores[0] : r.res; let o1 = a.op;
    const b = r.res.stores && r.res.stores[1];
    if (b && b.sales != null) {
      if (m.S3 && w.stores[1].area !== w.stores[0].area && a.N > 0) { const per = (a.sales - a.cogs - a.wasteCost) / (a.N * C('days')); o1 -= 0.05 * b.N * C('days') * per; }
      op2.push(b.op); dep2.push(b.dep || 0);
    }
    op1.push(o1);
  }
  return { op1, op2, dep2 };
}
function company(alone, r, extra) {
  let cum = 0, pay = null;
  for (let i = 0; i < r.op2.length; i++) { cum += r.op2[i] + r.dep2[i] - (alone[i] - r.op1[i]); if (pay == null && cum >= FITOUT + extra + DEPOSIT) pay = i + 1; }
  return { cum: cum - FITOUT - extra - DEPOSIT, pay };
}
const share = (obj) => { const tot = Object.values(obj).reduce((s, x) => s + x, 0); const [k, v] = Object.entries(obj).sort((a, b) => b[1] - a[1])[0]; return `${k} ${v}/${tot}（${Math.round((100 * v) / tot)}%）`; };
const out = [];

if (mode === 'site' || mode === 'all') {
  const VARIANTS = [['いまの式', {}], ['S1 同じ町の認知の引き継ぎ', { S1: 1 }], ['S2 急拡大型が住宅地へ（3年目4月）', { S2: 1 }], ['S3 隣のエリアの少しの食い合い（5%）', { S3: 1 }], ['S1＋S2', { S1: 1, S2: 1 }], ['S1＋S2＋S3', { S1: 1, S2: 1, S3: 1 }], ['S4 パート2人で夜も開ける（夜の客）', { S4: 1 }], ['S1＋S2＋S4', { S1: 1, S2: 1, S4: 1 }]];
  out.push('== ① 2号店の場所×形（家族を除く6通り）。町（seed 0〜9）×1号店の場所（商店街・駅前）×開いてからの月（24・72）の40通りで、会社の累計（2号店の営業の現金−1号店の食い合い−内装−保証金）が最大の組');
  for (const [name, mech] of VARIANTS) {
    const best = {}, form = {}, area = {}; let n = 0;
    for (const home of ['shotengai', 'ekimae']) for (const H of [24, 72]) for (let seed = 0; seed <= 9; seed++) {
      const base = warm(seed, home);
      const alone = run(base, H, { mech }).op1;
      let bk = null, bv = -Infinity;
      for (const ar of ['shotengai', 'ekimae', 'jutaku']) for (const fm of ['part1', 'part2']) { const r = run(base, H, { area: ar, form: fm, mech }); const v = company(alone, r, 0).cum; if (v > bv) { bv = v; bk = [ar, fm]; } }
      best[bk.join('・')] = (best[bk.join('・')] || 0) + 1; area[bk[0]] = (area[bk[0]] || 0) + 1; form[bk[1]] = (form[bk[1]] || 0) + 1; n++;
    }
    out.push(`  ${name}：最大の組 ${share(best)}　内訳 ${JSON.stringify(best)}　場所だけ ${share(area)}　形だけ ${share(form)}`);
  }
}
if (mode === 'bowl' || mode === 'all') {
  const ALL = [['いまの式', {}, 0], ['B1 豚骨の原価 +60円', {}, 60], ['B2 客層の混ざりの変種 ±0.10', { B2: 1 }, 0], ['B1＋B2', { B2: 1 }, 60], ['B1（+40円）＋R1 改装の効きを e.4 L757 に', { R1: 1 }, 40], ['B1＋R1 改装の効きを e.4 L757 に', { R1: 1 }, 60], ['B1＋R1 の半分（R +0.25・F +0.05）', { R1: 0.5 }, 60]];
  const pick = process.argv[3] ? process.argv[3].split(',').map(Number) : ALL.map((_, i) => i);
  const VARIANTS = pick.map((i) => ALL[i]);
  out.push('== ② 坂の上の立て直しの手（家族を除く60組、1号店は商店街、72か月）。手は 何もしない・粘る・改装×3時点・一杯と看板（3つの一杯×看板3つ×3時点）。組ごとに会社の累計が最大の手');
  for (const [name, mech, add] of VARIANTS) {
    BW.SOUP.tonkotsu.cost = TONKOTSU0 + add;
    const bestKind = {}, bestBowl = {}; let flip = 0, spread = [], noneCum = [], bestCum = [];
    for (let seed = 0; seed <= 9; seed++) {
      const base = warm(seed, 'shotengai'); const alone = run(base, 72, { mech }).op1;
      for (const ar of ['shotengai', 'ekimae', 'jutaku']) for (const fm of ['part1', 'part2']) {
        const S = [['none', { close: 'none' }]];
        for (const ct of [22, 24, 26]) { S.push([`renovate@${ct}`, { close: 'renovate', cardT: ct }]); for (const bo of ['shoyu', 'tonkotsu', 'miso']) for (const sg of ['none', 'small', 'large']) S.push([`format:${bo}:${sg}@${ct}`, { close: 'format', cardT: ct, bowl: bo, sign: sg }]); }
        const rs = S.map(([k, oo]) => { const r = run(base, 72, { area: ar, form: fm, mech, ...oo }); const kind = k.split(/[:@]/)[0]; return { k, kind, ...company(alone, r, EXTRA[kind]) }; });
        rs.sort((a, b) => b.cum - a.cum); const b = rs[0];
        bestKind[b.kind] = (bestKind[b.kind] || 0) + 1;
        if (b.kind === 'format') { const bo = b.k.split(':')[1]; bestBowl[bo] = (bestBowl[bo] || 0) + 1; }
        const none = rs.find((r) => r.k === 'none'); if (none.pay == null && rs.some((r) => r.pay != null)) flip++;
        noneCum.push(none.cum); bestCum.push(b.cum); spread.push(b.cum - none.cum);
      }
    }
    const med = (a) => { const s = a.slice().sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
    out.push(`  ${name}：最良の手の種類 ${JSON.stringify(bestKind)}　最良の一杯 ${Object.keys(bestBowl).length ? share(bestBowl) : '—'} ${JSON.stringify(bestBowl)}　最良と何もしないの差の中央値 ${Math.round(med(spread) / 1e4)}万円　何もしないでは来ないが手で取り戻しが来る組 ${flip}/60`);
  }
  BW.SOUP.tonkotsu.cost = TONKOTSU0;
}
console.log(out.join('\n'));
