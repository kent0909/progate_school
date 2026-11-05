#!/usr/bin/env node
// 設計者 W（DESIGN-CINC-REBUILD）：2号店の坂を、ゲームの式（js/sim）で数える。ゲームのファイルは変えない（読み込んで関数を呼ぶだけ）。
// 元にしたのは J-B の docs/audit/cinc-rebuild-B-fact-site2.js（同じ読み込み・同じ1号店の手・同じ完成の fx）。違いは3つ：
//   ① 台本の39か月で切らず、2号店の開店（t=19）から72か月（6年）先まで回す（式に年の上限はない。台本だけが39か月で終わる）
//   ② seed を0〜9の10通りにする（J-B は0と4）
//   ③ 「抜ける月」を3つの物差しで数える：初めて黒字の月／3か月続けて黒字に入った月／出店のお金（内装150万＋立て直しの追加）を
//      2号店の営業の現金（営業利益＋減価償却）で取り戻した月。あわせて、選ぶ前の試算に出ない数（1号店の食い合い・その他の固定費・
//      損益分岐の客数）を数える。
// 乱数なし・札なし（noise:false, noCards:true）。1号店は上手に近い固定の手（値段 800→850→900・地図・衛生・LINE・チラシ3万・パート1人）。
// 一杯の手直しはしない（J-B と同じ）。そのため長く回すと1号店も2号店も一杯の魅力が落ちる。結果は「手直しなしの下側」と読む。
// 使い方：node cinc-redesign-site2-slope.js [--seeds 0-9] [--months 72] [--json]
'use strict';
global.window = global;
const path = require('path');
const root = path.resolve(__dirname, '../..');
const STORY = require(path.join(root, 'tools/ramen-files.js')).story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA, Wd = D.world, C = D.coef, BW = D.bowl;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const [s0, s1] = String(arg('--seeds', '0-9')).split('-').map(Number);
const SEEDS = []; for (let s = s0; s <= (s1 == null ? s0 : s1); s++) SEEDS.push(s);
const HORIZON = +arg('--months', 72);
const clone = (x) => JSON.parse(JSON.stringify(x));
const price1 = (t) => (t < 12 ? 800 : t < 24 ? 850 : 900);
const pol1 = (W, prev) => { const p = Wd.policy0(W, prev); Object.assign(p, { price: price1(W.t), map: true, haccp: true, line: true, flyer: 30000, parts: 1, family: 0, prep: 'mid', supplier: 'std', sns: false, forecast: false, inspect: false, tweak: false }); return Wd.fitTime(W, p, D.rng(W.seed * 37 + W.t)); };
const completeFx = D.cards.byId.site2_complete.options[0].outcomes[0].fx;
const closeCard = D.cards.byId.close;
const FITOUT = C('fitout'), DEPOSIT = C('deposit');
const EXTRA = { none: 0, stick: 0, renovate: 750000, format: 330000 }; // ramen-y2-close.js:34〜35 の札の支出（内装45万＋器材30万、試作3万＋器材30万。予備の器材なし）
const OPEN_T = 19, CARD_T = 26; // 2年目11月に開く（cards-y2.js:93）。3か月赤字の札は3年目6月（t=26、ramen-y2-close.js:25）、結果は翌月から

function warm(seed) { // 1号店だけで t=0..18
  let W = Wd.create({ seed, area: 'shotengai', form: 'part1', bowl: BW.presets[0].spec });
  let prev = null; const op1 = [];
  for (let t = 0; t < OPEN_T; t++) { const p = pol1(W, prev); const r = Wd.month(W, p, { noise: false, noCards: true, rng: D.rng(seed * 104729 + t) }); W = r.W; prev = p; op1.push(Math.round(r.res.op)); }
  return { W, prev, op1 };
}
function runFrom(base, { area, form, close = 'none', closeImprove = 'quality', closeBowl = 'shoyu', closeSign = 'none', cf = null, noStore2 = false }) {
  let w = clone(base.W), pr = base.prev;
  if (!noStore2) { w.flags.y2Build = { area, form, at: w.t, staff: 'hire' }; completeFx(w); }
  const op2 = [], N2 = [], be2 = [], op1 = [], fixed2 = [];
  for (let t = OPEN_T; t < OPEN_T + HORIZON; t++) {
    if (!noStore2 && close !== 'none' && t === CARD_T + 1 && w.stores[1]) {
      w.flags.y2CloseImprove = closeImprove; w.flags.y2CloseBowl = closeBowl; w.flags.y2CloseSign = closeSign; w.flags.y2CloseQuote = {};
      const o = closeCard.options.find((x) => x.id === close); if (o.outcomes[0].fx) o.outcomes[0].fx(w);
    }
    const st = w.stores[1];
    if (cf && st && st.open !== false) { if (cf.price != null) st.price = cf.price; if (cf.line) st.line = true; }
    const p = pol1(w, pr);
    const r = Wd.month(w, p, { noise: false, noCards: true, rng: D.rng(base.W.seed * 104729 + t) });
    w = r.W; pr = p;
    const a = r.res.stores ? r.res.stores[0] : r.res; op1.push(Math.round(a.op));
    const b = r.res.stores && r.res.stores[1];
    if (b && b.sales != null) {
      op2.push(Math.round(b.op)); N2.push(+b.N.toFixed(1));
      const F = b.labor + b.rent + C('utilFixed') + b.other + b.dep + b.ads; // 月の固定費（店ごとの「その他」15〜20万・内装の償却を含む）
      const CM = b.sales - b.cogs - b.wasteCost - C('utilVar') * b.sales; // 客数に比例する分を引いた残り
      be2.push(CM > 0 ? +(b.N * F / CM).toFixed(1) : null); fixed2.push({ rent: b.rent, labor: b.labor, other: b.other, dep: b.dep, util: C('utilFixed') });
    }
  }
  return { op2, N2, be2, op1, fixed2 };
}
const firstIdx = (a, f) => { for (let i = 0; i < a.length; i++) if (f(a, i)) return i; return -1; };
function slope(op, invest) { // 月は「開いた月を1か月目」と数える
  const black1 = firstIdx(op, (a, i) => a[i] >= 0);
  const black3 = firstIdx(op, (a, i) => i + 2 < a.length && a[i] >= 0 && a[i + 1] >= 0 && a[i + 2] >= 0);
  const dep = FITOUT / C('fitoutLife') / 12; let cum = 0; let pay = -1;
  for (let i = 0; i < op.length; i++) { cum += op[i] + dep; if (cum >= invest) { pay = i; break; } }
  const m = (x) => (x < 0 ? null : x + 1);
  return { firstBlack: m(black1), black3From: m(black3), paybackMonth: m(pay), loss8: op.slice(0, 8).filter((x) => x < 0).length, cumOp: Math.round(op.reduce((s, x) => s + x, 0)) };
}
const AREAS = ['shotengai', 'ekimae', 'jutaku'], FORMS = ['family', 'part1', 'part2'];
const rows = [], store1 = [];
for (const seed of SEEDS) {
  const base = warm(seed);
  // 1号店の坂（開店 t=0 から）：比べる相手
  const s1o = slope(base.op1.concat(runFrom(base, { noStore2: true }).op1), FITOUT);
  store1.push({ seed, ...s1o });
  const alone = runFrom(base, { noStore2: true }).op1;
  for (const area of AREAS) for (const form of FORMS) {
    const strategies = [['none', {}], ['stick', { close: 'stick' }], ['renovate', { close: 'renovate', closeImprove: 'quality' }]];
    for (const b of BW.presets.map((p) => p.id)) for (const sg of ['none', 'small', 'large']) strategies.push([`format:${b}:${sg}`, { close: 'format', closeBowl: b, closeSign: sg }]);
    for (const [name, o] of strategies) {
      const r = runFrom(base, { area, form, ...o });
      const kind = name.split(':')[0];
      const invest = FITOUT + (EXTRA[kind] || 0);
      const cannib8 = Math.round(alone.slice(0, 8).reduce((s, x, i) => s + (x - r.op1[i]), 0) / 8);
      rows.push({ seed, area, form, strategy: name, kind, ...slope(r.op2, invest), N_open: r.N2[0], N_m8: r.N2[7], N_m24: r.N2[23], be_m1: r.be2[0], be_m8: r.be2[7], cannib1_8avg: cannib8, fixed_m1: r.fixed2[0] });
    }
  }
}
// ---- 集計 ----
const med = (a) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); if (!b.length) return null; return b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2; };
const share = (a, f) => `${a.filter(f).length}/${a.length}`;
const lines = [];
lines.push(`2号店の坂（ゲームの式・乱数なし・札なし。seed ${SEEDS[0]}〜${SEEDS[SEEDS.length - 1]}、開店から${HORIZON}か月）`);
lines.push(`1号店（開店 t=0 から、同じ手）：初めて黒字の月の中央値 ${med(store1.map((x) => x.firstBlack))}、3か月続く黒字に入った月の中央値 ${med(store1.map((x) => x.black3From))}、開店から8か月の赤字の月 ${store1.reduce((s, x) => s + x.loss8, 0)}/${store1.length * 8}`);
const g = (kind) => rows.filter((r) => r.kind === kind);
const fmtGroup = (label, rs) => {
  lines.push(`${label}：組 ${rs.length}。最初の8か月が全部赤字 ${share(rs, (r) => r.loss8 === 8)}。初めて黒字の月 中央値 ${med(rs.map((r) => r.firstBlack))}（${HORIZON}か月で来ない ${share(rs, (r) => r.firstBlack == null)}）。3か月続く黒字 中央値 ${med(rs.map((r) => r.black3From))}（来ない ${share(rs, (r) => r.black3From == null)}）。出店のお金を取り戻す月 中央値 ${med(rs.map((r) => r.paybackMonth))}（来ない ${share(rs, (r) => r.paybackMonth == null)}）`);
};
fmtGroup('何もしない（札を打たず続ける）', g('none'));
fmtGroup('3年目6月に「粘る」', g('stick'));
fmtGroup('3年目6月に「改装（品質）」', g('renovate'));
// 一杯と看板は9通りのうち最良を選んだ場合（人が後から最良を知っているわけではないので上側）
const bestFormat = []; const keys = new Set(rows.filter((r) => r.kind === 'format').map((r) => `${r.seed}|${r.area}|${r.form}`));
for (const k of keys) { const rs = rows.filter((r) => r.kind === 'format' && `${r.seed}|${r.area}|${r.form}` === k); bestFormat.push(rs.slice().sort((a, b) => b.cumOp - a.cumOp)[0]); }
fmtGroup('3年目6月に「一杯と看板を変える」（9通りの最良＝上側）', bestFormat);
lines.push('場所×形ごと（何もしない）：初めて黒字の月の中央値／取り戻す月の中央値／取り戻せない組');
for (const area of AREAS) for (const form of FORMS) { const rs = g('none').filter((r) => r.area === area && r.form === form); lines.push(`  ${area}・${form}：${med(rs.map((r) => r.firstBlack))}／${med(rs.map((r) => r.paybackMonth))}／${share(rs, (r) => r.paybackMonth == null)}`); }
const n = g('none');
lines.push(`開いた月の客数 中央値 ${med(n.map((r) => r.N_open))}人/日 → 8か月目 ${med(n.map((r) => r.N_m8))} → 24か月目 ${med(n.map((r) => r.N_m24))}`);
lines.push(`損益分岐の客数（式から：客数×固定費÷客数に比例しない残り） 1か月目 中央値 ${med(n.map((r) => r.be_m1))}人/日、8か月目 ${med(n.map((r) => r.be_m8))}人/日`);
lines.push(`1号店の食い合い（2号店を出した周と出さない周の1号店の月の営業利益の差、最初の8か月の平均）：同じ商店街 中央値 ${med(n.filter((r) => r.area === 'shotengai').map((r) => r.cannib1_8avg))}円/月、駅前 ${med(n.filter((r) => r.area === 'ekimae').map((r) => r.cannib1_8avg))}円/月、住宅地 ${med(n.filter((r) => r.area === 'jutaku').map((r) => r.cannib1_8avg))}円/月`);
const fx = n[0].fixed_m1; lines.push(`選ぶ前の試算に出ない固定費（1か月目の例 seed${n[0].seed} ${n[0].area}・${n[0].form}）：その他 ${fx.other}円・内装の償却 ${fx.dep}円・光熱の固定 ${fx.util}円（試算に出るのは家賃 ${fx.rent}円と給料 ${fx.labor}円）`);
lines.push('seed ごと（何もしない、9組）：最初の8か月が全部赤字の組／取り戻せない組／その町の「その他の固定費」');
for (const seed of SEEDS) { const rs = n.filter((r) => r.seed === seed); lines.push(`  seed ${seed}：${share(rs, (r) => r.loss8 === 8)}／${share(rs, (r) => r.paybackMonth == null)}／${rs[0].fixed_m1.other}円`); }
const card8 = n.filter((r) => r.firstBlack != null && r.firstBlack > 8).length;
lines.push(`「3か月赤字」の札（開店から8か月目）の時点でまだ初めての黒字が来ていない組：${card8}/${n.length}（何もしない）`);
if (process.argv.includes('--json')) console.log(JSON.stringify({ seeds: SEEDS, horizon: HORIZON, store1, rows }, null, 1));
else console.log(lines.join('\n'));
