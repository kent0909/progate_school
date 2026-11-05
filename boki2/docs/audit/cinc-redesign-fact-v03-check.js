#!/usr/bin/env node
// J-D（DESIGN-CINC-REBUILD 版0.3 の判定）：設計者の cinc-redesign-dominance.js・-thick.js の写し方と数え方の確かめ。
// ゲームと設計者のスクリプトは変えない。設計者のスクリプトと同じ手・同じ物差し（会社の累計＝2号店の営業の現金−1号店の食い合い−内装−保証金−追加）で、
// 次を数える：
//   bowl   「B1＋R1 の半分」で、判断ごとの分母で最良の割合（札の1段目＝手の種類／2段目＝一杯（一杯と看板を選んだ組の中）／看板／打つ時点）
//   s2     S2 の写し方：設計者は住宅地に最初からいる3軒（rivals.create）を残したまま安売りを1軒足す。DESIGN-RAMEN c.2 L258「なし→急拡大型が来る」に
//          合わせ、住宅地の2号店の町の最初の競合を0にして3年目4月に1軒来る形で数え直す（S2'）。S1＋S2'＋S4 も
//   thick  社長が2店を見る（T3）を、設計者の「評判 −0.3 を1回」から、DESIGN-RAMEN e.5 L770「社長が見ると1号店の Q が落ちる」の写し（Q −0.3 を続ける）に替え、
//          Q5 (b) の3択（社長が2店を見る／店長を雇う／1号店を厚くする）の中で組ごとの最良を数える
// 使い方：node boki2/docs/audit/cinc-redesign-fact-v03-check.js <bowl|s2|thick>
'use strict';
global.window = global;
const path = require('path');
const root = path.resolve(__dirname, '../..');
const STORY = require(path.join(root, 'tools/ramen-files.js')).story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA, Wd = D.world, C = D.coef, BW = D.bowl;
const mode = process.argv[2] || 'bowl';
const clone = (x) => JSON.parse(JSON.stringify(x));
const price1 = (t) => (t < 12 ? 800 : t < 24 ? 850 : 900);
const pol1 = (W, prev, parts = 1) => { const p = Wd.policy0(W, prev); Object.assign(p, { price: price1(W.t), map: true, haccp: true, line: true, flyer: 30000, parts, family: 0, prep: 'mid', supplier: 'std', sns: false, forecast: false, inspect: false, tweak: false }); return Wd.fitTime(W, p, D.rng(W.seed * 37 + W.t)); };
const completeFx = D.cards.byId.site2_complete.options[0].outcomes[0].fx;
const closeCard = D.cards.byId.close;
const FITOUT = C('fitout'), DEPOSIT = C('deposit'), OPEN_T = 19;
const EXTRA = { none: 0, renovate: 750000, format: 330000 };
const warm = (seed, home) => { let W = Wd.create({ seed, area: home, form: 'part1', bowl: BW.presets[0].spec }); let prev = null; for (let t = 0; t < OPEN_T; t++) { const p = pol1(W, prev); const r = Wd.month(W, p, { noise: false, noCards: true, rng: D.rng(seed * 104729 + t) }); W = r.W; prev = p; } return { W, prev }; };
function run(base, H, o) {
  let w = clone(base.W), pr = base.prev; const m = o.mech || {};
  if (o.area) {
    w.flags.y2Build = { area: o.area, form: o.form, at: w.t, staff: 'hire' }; completeFx(w);
    const st = w.stores[1];
    if (m.S1 && o.area === w.stores[0].area) st.A = (w.stores[0].A || 0) * 0.5;
    if (m.S4 && o.form === 'part2' && o.area !== w.stores[0].area) w.town.areas[o.area].P *= 1 + ({ ekimae: 0.25, shotengai: 0.10, jutaku: 0.05 })[o.area];
    if (m.S2f && o.area === 'jutaku' && w.stores[0].area !== 'jutaku') w.rivals = w.rivals.filter((r) => r.area !== 'jutaku'); // 住宅地の最初の競合は「なし」
    if (o.way === 'T3q') { const s0 = w.stores[0]; s0.Q = BW.Q(s0.bowl, {}) - 0.3; }
  }
  const op1 = [], op2 = [], dep2 = [];
  for (let t = OPEN_T; t < OPEN_T + H; t++) {
    if (o.area && (m.S2 || m.S2f) && t === 24 && w.stores[1] && w.stores[1].area === 'jutaku') { const r = D.rivals.make('cheap', 9); r.id = 'entrant'; r.area = 'jutaku'; w.rivals.push(r); }
    if (o.area && o.close && o.close !== 'none' && t === o.cardT + 1 && w.stores[1]) {
      w.flags.y2CloseImprove = 'quality'; w.flags.y2CloseBowl = o.bowl || 'shoyu'; w.flags.y2CloseSign = o.sign || 'none'; w.flags.y2CloseQuote = {};
      const c = closeCard.options.find((x) => x.id === o.close); if (c.outcomes[0].fx) c.outcomes[0].fx(w);
      if (m.R1 && o.close === 'renovate') { const st = w.stores[1]; st.R = Math.min(5, (st.R || 3) + 0.5 * m.R1); st.bowl.Fbase = Math.min(1.4, (st.bowl.Fbase || 1) + 0.1 * m.R1); }
    }
    const parts = o.way === 'T1' ? 3 : 1;
    const p = pol1(w, pr, o.area ? parts : 1); const r = Wd.month(w, p, { noise: false, noCards: true, rng: D.rng(base.W.seed * 104729 + t) }); w = r.W; pr = p;
    const a = r.res.stores ? r.res.stores[0] : r.res; let x1 = a.op; if (o.way === 'T1') x1 -= 200000; op1.push(x1);
    const b = r.res.stores && r.res.stores[1]; if (b && b.sales != null) { op2.push(b.op - (o.way === 'T2' ? 250000 : 0)); dep2.push(b.dep || 0); }
  }
  return { op1, op2, dep2 };
}
const company = (alone, r, extra) => { let cum = 0; for (let i = 0; i < r.op2.length; i++) cum += r.op2[i] + r.dep2[i] - (alone[i] - r.op1[i]); return cum - FITOUT - extra - DEPOSIT; };
const pct = (o) => { const tot = Object.values(o).reduce((s, x) => s + x, 0); const [k, v] = Object.entries(o).sort((a, b) => b[1] - a[1])[0]; return `${k} ${v}/${tot}（${Math.round((100 * v) / tot)}%）`; };
const inc = (o, k) => { o[k] = (o[k] || 0) + 1; };

if (mode === 'bowl') {
  BW.SOUP.tonkotsu.cost += 60; const mech = { R1: 0.5 };
  const kind = {}, bowlF = {}, signF = {}, timeF = {}, combo = {}, comboFull = {}, bowlAll = {};
  for (let seed = 0; seed <= 9; seed++) {
    const base = warm(seed, 'shotengai'); const alone = run(base, 72, { mech }).op1;
    for (const ar of ['shotengai', 'ekimae', 'jutaku']) for (const fm of ['part1', 'part2']) {
      const S = [['none', 'none', {}]];
      for (const ct of [22, 24, 26]) { S.push([`renovate@${ct}`, 'renovate', { close: 'renovate', cardT: ct }]); for (const bo of ['shoyu', 'tonkotsu', 'miso']) for (const sg of ['none', 'small', 'large']) S.push([`format:${bo}:${sg}@${ct}`, 'format', { close: 'format', cardT: ct, bowl: bo, sign: sg }]); }
      const rs = S.map(([k, kd, oo]) => ({ k, kd, oo, cum: company(alone, run(base, 72, { area: ar, form: fm, mech, ...oo }), EXTRA[kd]) })).sort((a, b) => b.cum - a.cum);
      const b = rs[0]; inc(kind, b.kd); inc(comboFull, b.k);
      const bf = rs.find((r) => r.kd === 'format'); inc(bowlAll, bf.oo.bowl); // 一杯と看板を選んだとしたら、どの一杯が最良か（60組すべてで）
      if (b.kd === 'format') { inc(bowlF, b.oo.bowl); inc(signF, b.oo.sign); inc(combo, 'format:' + b.oo.bowl); } else inc(combo, b.kd);
      inc(timeF, String(b.oo.cardT || '—'));
    }
  }
  console.log('B1＋R1 の半分（設計者の採る組）。家族を除く60組・72か月。判断ごとの分母で、最良の選択肢の割合（設計書の物差し：どの状態でも1つの選択肢が最適 <70%）');
  console.log(`  札の1段目（手の種類、分母60）：${pct(kind)} ${JSON.stringify(kind)}`);
  console.log(`  札の2段目（一杯。一杯と看板を選んだ組が分母）：${pct(bowlF)} ${JSON.stringify(bowlF)}`);
  console.log(`  札の2段目（一杯。一杯と看板を選んだとしたらの最良、分母60）：${pct(bowlAll)} ${JSON.stringify(bowlAll)}`);
  console.log(`  看板（同）：${pct(signF)} ${JSON.stringify(signF)}`);
  console.log(`  打つ時点（分母60）：${pct(timeF)} ${JSON.stringify(timeF)}`);
  console.log(`  種類と一杯を1つの選択肢にまとめた分け方（設計書 L410 の数え方、分母60）：${pct(combo)} ${JSON.stringify(combo)}`);
  console.log(`  種類・一杯・看板・時点の全部を1つの選択肢にした分け方（分母60）：${pct(comboFull)}`);
}

if (mode === 's2') {
  const V = [['いまの式', {}], ['S2（設計者：3軒を残して1軒足す）', { S2: 1 }], ["S2'（c.2 の写し：最初の競合なし→3年目4月に1軒）", { S2f: 1 }], ['S1＋S2＋S4（設計者の採る組）', { S1: 1, S2: 1, S4: 1 }], ["S1＋S2'＋S4", { S1: 1, S2f: 1, S4: 1 }]];
  for (const [name, mech] of V) {
    const best = {}, area = {}, form = {};
    for (const home of ['shotengai', 'ekimae']) for (const H of [24, 72]) for (let seed = 0; seed <= 9; seed++) {
      const base = warm(seed, home); const alone = run(base, H, { mech }).op1; let bk = null, bv = -Infinity;
      for (const ar of ['shotengai', 'ekimae', 'jutaku']) for (const fm of ['part1', 'part2']) { const v = company(alone, run(base, H, { area: ar, form: fm, mech }), 0); if (v > bv) { bv = v; bk = [ar, fm]; } }
      inc(best, bk.join('・')); inc(area, bk[0]); inc(form, bk[1]);
    }
    console.log(`${name}：最大の組 ${pct(best)}　場所 ${pct(area)}　形 ${pct(form)}　${JSON.stringify(best)}`);
  }
}

if (mode === 'judge') {
  // 判定書（cinc-redesign-fact-v03.md）の表の行数と判定の内訳を数え、設計書 19章の J-D の行を全部見たかを確かめる
  const fs = require('fs');
  const t = fs.readFileSync(process.argv[3], 'utf8');
  const cells = (l) => l.split('|').slice(1, -1).map((c) => c.trim());
  const block = (s, tag) => { const i = s.indexOf(`<!-- ${tag} -->`), j = s.indexOf(`<!-- /${tag} -->`); return i < 0 || j < 0 ? [] : s.slice(i, j).split('\n').filter((l) => /^\|/.test(l)).slice(2).map(cells); };
  for (const tag of ['J47', 'JK10', 'JREAD6']) { const rs = block(t, tag); const v = {}; rs.forEach((r) => inc(v, r[r.length - 2])); console.log(`${tag}：${rs.length} 行　判定の内訳 ${JSON.stringify(v)}`); }
  const d = fs.readFileSync(path.join(root, 'docs/DESIGN-CINC-REBUILD.md'), 'utf8');
  const ids = block(d, 'JD').map((r) => r[0]); const mine = block(t, 'J47').map((r) => r[0]);
  console.log(`設計書 19章の J-D の行 ${ids.length}、判定書で見た行 ${mine.length}、見ていない行 ${ids.filter((x) => !mine.includes(x)).join(' ') || 'なし'}`);
  console.log(`【確かめた】${(t.match(/【確かめた/g) || []).length}／【問い】${(t.match(/【問い/g) || []).length}`);
}

if (mode === 'thick') {
  const WAYS = { T1: '1号店を厚くする', T2: '店長を雇う', T3: '社長が2店を見る（設計者：評判 −0.3 を1回）', T3q: '社長が2店を見る（e.5 L770 の写し：1号店の Q −0.3 を続ける）' };
  const res = {}; for (const k of Object.keys(WAYS)) res[k] = [];
  for (let seed = 0; seed <= 9; seed++) {
    const base = warm(seed, 'shotengai'); const alone = run(base, 72, {}).op1;
    for (const ar of ['shotengai', 'ekimae', 'jutaku']) for (const fm of ['part1', 'part2']) for (const w of Object.keys(WAYS)) {
      const r = run(base, 72, { area: ar, form: fm, way: w === 'T3' ? 'T3r' : w });
      if (w === 'T3') { /* 設計者の T3：開いた月に1号店の評判 −0.3 を1回 */ }
      res[w].push(company(alone, r, 0));
    }
  }
  // 設計者の T3（評判 −0.3 を1回）は run の way では入れていないので、ここで入れて数え直す
  res.T3 = [];
  for (let seed = 0; seed <= 9; seed++) {
    const base = warm(seed, 'shotengai'); const alone = run(base, 72, {}).op1;
    for (const ar of ['shotengai', 'ekimae', 'jutaku']) for (const fm of ['part1', 'part2']) {
      const b2 = clone(base); const r = (() => { let w = clone(b2.W), pr = b2.prev; w.flags.y2Build = { area: ar, form: fm, at: w.t, staff: 'hire' }; completeFx(w); w.stores[0].R = Math.max(1, w.stores[0].R - 0.3); const op1 = [], op2 = [], dep2 = []; for (let t = OPEN_T; t < OPEN_T + 72; t++) { const p = pol1(w, pr); const rr = Wd.month(w, p, { noise: false, noCards: true, rng: D.rng(base.W.seed * 104729 + t) }); w = rr.W; pr = p; const a = rr.res.stores[0]; op1.push(a.op); const b = rr.res.stores[1]; if (b && b.sales != null) { op2.push(b.op); dep2.push(b.dep || 0); } } return { op1, op2, dep2 }; })();
      res.T3.push(company(alone, r, 0));
    }
  }
  const med = (a) => { const s = a.slice().sort((x, y) => x - y); return (s[29] + s[30]) / 2; };
  for (const [k, n] of Object.entries(WAYS)) console.log(`${n}：72か月の会社の累計の中央値 ${Math.round(med(res[k]) / 1e4)}万円`);
  for (const set of [['T1', 'T2', 'T3'], ['T1', 'T2', 'T3q']]) { const best = {}; for (let i = 0; i < 60; i++) { let bk = set[0]; for (const k of set) if (res[k][i] > res[bk][i]) bk = k; inc(best, WAYS[bk]); } console.log(`Q5 (b) の3択（${set.join('・')}）で組ごとの最良：${pct(best)} ${JSON.stringify(best)}`); }
}
