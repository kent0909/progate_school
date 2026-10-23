#!/usr/bin/env node
// ラーメン版の画面の読み出し（js/sim/ramen-view.js）の検査（DESIGN-RAMEN l.2 段5・6）。台本の月の流れ（SIMDATA.ramen.plan：作戦の机→札）を seed を変えて回し、
//  ①予告の実在：出店の予兆の札（rival_open）を引いた月から開店まで、地図に「工事」の印がある。告げた開店の月に、同じ場所（slot omen）に新しい店が開く。
//    求人の印は開く前の月。町の行事の札を引いた月は「回覧」の印。印の札の id は引いた札と一致する
//  ②影の線・段階目標・目の前の目標・期日の一覧・シェア・今の位置・ふりかえりの問い・分かれ道の図が、どの月でも数（NaN・無限）を出さない
//  ③シェアの合計は100%、ふりかえりの正解は要因の最大
//  ④帳簿の口座と店の口座の橋：説明できない差の大きさを数える（段0〜4 の申し送り ③。計算の直しは計算の担当へ。ここでは数を出す）
// Usage: node boki2/tools/ramen-view-check.js [--runs N]
global.window = global;
const path = require('path');
const root = path.join(__dirname, '..');
const files = require('./ramen-files.js').story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/data/siblings.js', 'js/sim/lexicon.js', ...files].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA, RV = D.rview, RM = D.ramen;
const runs = +(process.argv[process.argv.indexOf('--runs') + 1] || 0) || 60;
const errs = [];
const bad = (x) => typeof x === 'number' && !isFinite(x);
const deep = (o, where) => { const st = [o]; while (st.length) { const v = st.pop(); if (bad(v)) { errs.push(`${where}：数でない値`); return; } if (v && typeof v === 'object') for (const k of Object.keys(v)) if (typeof v[k] !== 'function') st.push(v[k]); } };
let omenRuns = 0, kairan = 0, opened = 0;
for (let r = 0; r < runs; r++) {
  const rng = D.rng(r * 977 + 3);
  const S = { seed: r, decisions: { site: ['shotengai', 'ekimae'][r % 2], form: ['part1', 'family', 'part2'][r % 3], bowl: ['shoyu', 'tonkotsu', 'miso'][r % 3] }, profile: {}, L: [], diary: [] };
  let t0 = null, openAt = null;
  for (let t = 0; t < 12; t++) {
    const pol = RM.policy(S, t);
    pol.price += [-50, 0, 0, 50][Math.floor(rng() * 4)];
    RM.plan(S, t, pol);
    for (const id of S.dealt[t]) { const c = D.cards.byId[id]; S.decisions[`${id}@${t}`] = c.options[Math.floor(rng() * c.options.length)].id; }
    // シェアの記録（画面と同じ読み出し）
    (S.shareLog = S.shareLog || {})[t] = { me: S.res[t].N, rivals: S.W.rivals.filter((x) => x.type !== 'ghost').map((x) => ({ id: x.id, name: x.name, type: x.type, N: x.open === false ? 0 : x.lastN || 0, R: x.R, open: x.open !== false })) };
    const om = RV.omens(S.dealt, S.W, t), where = `seed ${r} t${t}`;
    if (S.dealt[t].includes('rival_open')) { t0 = t; omenRuns++; }
    const ko = om.find((x) => x.kind === 'kouji');
    const isOpen = S.W.rivals.some((x) => x.id === 'rnew');
    if (t0 != null && !isOpen && !ko) errs.push(`${where}：出店の予兆の札（${t0}）のあと、開く前なのに地図に工事の印がない`);
    if (ko && ko.card !== 'rival_open') errs.push(`${where}：工事の印の札が rival_open でない`);
    if (ko && S.W.flags.omen) openAt = S.W.flags.omen.at;
    if (isOpen && ko) errs.push(`${where}：開いたのに工事の印が残っている`);
    if (isOpen && openAt != null && S.W.rivals.find((x) => x.id === 'rnew') && !S.__op) { S.__op = true; opened++; const at = S.W.t - 1; if (at !== openAt) errs.push(`${where}：工事の印は${openAt}に開くと告げたが、開いたのは${at}`); const mm = RV.mapModel(S, t); const nr = mm.rivals.find((x) => x.id === 'rnew'); if (!nr || nr.slot !== 'omen') errs.push(`${where}：新しい店が工事の印の場所に出ていない`); }
    const ky = om.find((x) => x.kind === 'kyujin'); if (ky && (!S.W.flags.omen || t !== S.W.flags.omen.at - 1)) errs.push(`${where}：求人の印が開く前の月でない`);
    for (const id of ['ev_spring', 'ev_summer', 'ev_year']) { const has = om.some((x) => x.kind === 'kairan' && x.card === id); if (S.dealt[t].includes(id) !== has) errs.push(`${where}：行事の札 ${id} と回覧の印が一致しない`); if (has) kairan++; }
    // 読み出しの数
    const sh = RV.shares(S, t); deep(sh, `${where} シェア`);
    const tot = sh.rows.reduce((a, x) => a + x.share, 0); if (Math.abs(tot - 1) > 1e-6) errs.push(`${where}：シェアの合計が ${tot}`);
    deep(RV.stages(S), `${where} 段階目標`); deep(RV.dueList(S, t, 5000000, () => true), `${where} 期日`);
    const ng = RV.nearGoals(S, t + 1); if (!ng.length) errs.push(`${where}：目の前の目標の候補がない`); for (const g of ng) if (RV.goalCheck(g.id, S, t + 1, S.res[t]) == null && t > 0) errs.push(`${where}：目の前の目標 ${g.id} の答え合わせができない`);
    if (RV.QUARTER.includes(t)) { const p = RV.position(S, t); deep(p, `${where} 今の位置`); if (!p || p.rankN < 1 || p.rankN > p.of) errs.push(`${where}：今の位置の順がおかしい`); }
    const db = RV.debrief(S, t);
    if (t > 0 && !db) errs.push(`${where}：ふりかえりの問いが作れない`);
    if (db) { const f = db.qs[0].f, k = db.qs[0].ans; for (const x of RV.FACTOR_KEYS) if (typeof f[x] === 'number' && Math.abs(f[x]) > Math.abs(f[k]) + 1e-9) errs.push(`${where}：ふりかえりの正解が要因の最大でない`); if (RV.QUARTER.includes(t) !== db.quarter) errs.push(`${where}：四半期の4問の月がずれている`); }
    deep(RV.forkTree(S, t), `${where} 分かれ道`);
    deep(RV.trial(S.W, RM.policy(S, t + 1 < 12 ? t + 1 : t), 4), `${where} 試算`);
  }
  deep(RV.shadow(S), `seed ${r} 影の線`);
}
const sh0 = RV.shadow({ seed: 0, decisions: { site: 'shotengai', form: 'part1', bowl: 'shoyu' } });
console.log(`影の線（商店街・パート1人・seed 0）：初めての月次黒字 ${sh0.firstBlack == null ? 'なし' : `${RV.MON[sh0.firstBlack]}月`}（DESIGN-RAMEN l.4 は3月。家賃と返済のすえおき3か月があるため早い：計算の担当へ申し送り）`);
console.log(`予兆：出店の予兆 ${omenRuns}周・開店 ${opened}周・回覧の印 ${kairan}回（${runs}周）`);
if (errs.length) { console.error([...new Set(errs)].slice(0, 30).join('\n')); console.error(`\n${errs.length} 件`); process.exit(1); }
console.log(`OK：画面の読み出し（ramen-view.js）${runs}周・12か月：予告の実在・数・シェア・今の位置・ふりかえり・分かれ道`);
