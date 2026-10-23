#!/usr/bin/env node
// ラーメン版の「体験できない項目を0にする関門」（DESIGN-RAMEN 版0.4 g.4・g.5・k.7）。node boki2/tools/coverage.js --ramen [--stage N]
// js/sim/scope-map.js（g.4 の表）を読み、確かめること：
//  ① scope.js の全77項目に場面（scenes）が1つ以上ある
//  ② 手で書く場面（hand が doc か calc。読むだけ read は数えない）が、別々の場面で2つ以上ある
//  ③ 段 N までの項目は、場面の札が cards.js に実在して札の scope にその項目があるか、場面の出来事が台本（SIMDATA.months）に実在する
//  ④ 段 N までの項目の doc の場面は、書類（t:'doc' で正しい仕訳 ans を持つ）として、calc の場面は作業台の部品（calc・board・desk・sheet・closing・opening・report・bank・毎月の締め）として実在する
//  ⑤ again（周回でもう一度出る場面）は実在し、1周に1回きり（once）の札でない（番人 guard:<id> は骨として許す）
//  ⑥ deadline（番人の期限）が g.4 の「番」の列と同じ
//  ⑦ 年度表：s-tegata は2026年度だけ、s-taiwitsu は2027年度は3級の土台（scope.js の y27 と合う）
// 段 N より先の項目は「場面が書かれている」（①②⑥）だけを確かめる（実装は後の段）。1つでも欠けたら exit 1
global.window = global;
const path = require('path');
const root = path.join(__dirname, '..');
const STORY = require('./ramen-files.js').story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/scope.js', 'js/sim/store.js', ...STORY].forEach((f) => require(path.join(root, f)));
const B = window.BOKI, D = window.SIMDATA, MAP = D.scopeMap;
const si = process.argv.indexOf('--stage'), STAGE = si > 0 ? Number(process.argv[si + 1]) : 1;
const errors = [];
// g.4 の「番」の列（番人の期限・年）。設計書の表を写した（scope-map.js と独立に持ち、食い違いを見つける）
const DEADLINE = { 'b-je': 1, 'b-tb': 1, 'b-ledger': 2, 'b-cycle': 1, 'b-credit': 1, 'b-mibarai': 1, 'b-expense': 1, 'b-loan': 1, 'b-accrual': 2, 's-stock': 2, 's-dividend': 3, 's-keisu': 4, 's-ssce': 2, 's-merger': 6, 's-sanbunpo': 1, 's-taiwitsu': 5, 's-cogs': 1, 's-genmo': 1, 's-revenue': 3, 's-service': 4, 's-shohizei': 1, 's-hojinzei': 2, 's-kazei': 4, 's-bankrec': 1, 's-tegata': 5, 's-denshi': 2, 's-factoring': 5, 's-allow': 2, 's-kashidaore': 5, 's-hosho': 6, 's-fx': 4, 's-fxend': 4, 's-yoyaku': 5, 's-cost': 1, 's-capex': 2, 's-dep': 1, 's-dep-rate': 3, 's-indirect': 1, 's-seisandaka': 4, 's-sale': 3, 's-fire': 4, 's-kensetsu': 2, 's-asshuku': 4, 's-kappu': 3, 's-lease': 4, 's-mukei': 5, 's-rd': 3, 's-sec': 5, 's-secval': 5, 's-mankigo': 5, 's-sonota': 5, 's-hikiate': 4, 's-zeikoka': 5, 's-keika': 1, 's-seisanhyo': 1, 's-fs': 2, 's-honshiten': 3, 's-renketsu1': 6, 's-renketsu2': 7, 's-naibu': 7, 's-renketsufs': 7, 'k-flow': 4, 'k-zairyo': 4, 'k-romu': 4, 'k-keihi': 4, 'k-yotei': 4, 'k-bumon': 5, 'k-kobetsu': 5, 'k-sogo': 4, 'k-shison': 5, 'k-kotei': 5, 'k-hyojun': 5, 'k-chokusetsu': 5, 'k-cvp': 2, 'k-hokoku': 5, 'k-honsha': 5, 'k-kessan': 5 };
// 段ごとの数（l.1 の表）
const WANT = { 1: 26, 2: 12, 3: 12, 4: 20, 5: 7 };
const evs = D.months.flatMap((m, mi) => m.events.map((e) => ({ e, mi, label: m.label })));
const hasClose = D.months.some((m) => !m.closeless);
const CALC_T = new Set(['calc', 'board', 'desk', 'sheet', 'closing', 'opening', 'report', 'bank']);
const findEv = (sc) => {
  if (sc.ev === 'close') return hasClose ? [{ e: { t: 'close', id: 'close' } }] : [];
  const re = sc.any ? new RegExp(`^${sc.ev}\\d+(@\\d+)?$`) : new RegExp(`^${sc.ev}(@\\d+)?$`);
  return evs.filter((x) => x.e.id && re.test(x.e.id));
};
const findCardDoc = (sc) => evs.filter((x) => x.e.card === sc.card && new RegExp(`^${sc.card}-doc${sc.doc}@\\d+$`).test(x.e.id || ''));
const findCardCalc = (sc) => evs.filter((x) => x.e.card === undefined && x.e.t === 'calc' && new RegExp(`^${sc.calc}@\\d+$`).test(x.e.id || '') && x.e.scope);
const S0 = { decisions: {}, T: [], L: [] };
const truthOk = (e) => { try { const a = typeof e.ans === 'function' ? e.ans(S0) : e.ans; const s = (k) => a[k].reduce((t, x) => t + x[1], 0); return a && a.dr.length && a.cr.length && s('dr') === s('cr'); } catch (x) { return false; } };
const lines = [], stat = {};
for (const it of B.scope) {
  const m = MAP[it.id];
  if (!m) { errors.push(`${it.id}：場面の表（scope-map.js）にない`); continue; }
  const st = m.stage;
  stat[st] = (stat[st] || 0) + 1;
  const scenes = m.scenes || [];
  if (!scenes.length) errors.push(`${it.id}：場面がない`);
  const hands = scenes.filter((x) => x.hand === 'doc' || x.hand === 'calc');
  const key = (x) => `${x.card || x.ev}|${x.doc != null ? x.doc : ''}|${x.calc || ''}`;
  const distinct = new Set(hands.map(key));
  if (distinct.size < 2) errors.push(`${it.id}：手で書く場面が ${distinct.size}（別々の場面で2つ以上）`);
  if (DEADLINE[it.id] == null) errors.push(`${it.id}：g.4 の番の列にない`);
  else if (!m.deadline || m.deadline.y !== DEADLINE[it.id]) errors.push(`${it.id}：番人の期限 ${m.deadline && m.deadline.y} が g.4 の ${DEADLINE[it.id]} と違う`);
  if (it.id === 's-tegata' && !m.y26only) errors.push('s-tegata：2026年度だけの印（y26only）がない');
  if ((it.y27 === 'to3') !== (m.y27 === 'to3')) errors.push(`${it.id}：2027年度の扱い（scope.js の y27=${it.y27}）と場面の表（${m.y27}）が合わない`);
  let real = 0;
  if (st <= STAGE) {
    for (const sc of hands) {
      let ok = false;
      if (sc.card) {
        const c = D.cards.byId[sc.card];
        if (!c) { errors.push(`${it.id}：札 ${sc.card} が cards.js にない`); continue; }
        if (!(c.scope || []).includes(it.id)) errors.push(`${it.id}：札 ${sc.card} の scope にこの項目がない`);
        if (sc.hand === 'doc') { const f = findCardDoc(sc); ok = f.length > 0 && f.every((x) => x.e.t === 'doc' && truthOk(x.e)); if (!ok) errors.push(`${it.id}：札 ${sc.card} の書類 ${sc.doc} が台本に実在しない（または正しい仕訳がない）`); }
        else { const f = evs.filter((x) => new RegExp(`^${sc.calc}@\\d+$`).test(x.e.id || '') && x.e.t === 'calc'); ok = f.length > 0 && f.every((x) => (x.e.scope || []).includes(it.id) && x.e.answer != null); if (!ok) errors.push(`${it.id}：札 ${sc.card} の計算 ${sc.calc} が台本に実在しない`); }
      } else {
        const f = findEv(sc);
        if (!f.length) { errors.push(`${it.id}：出来事 ${sc.ev} が台本にない`); continue; }
        if (sc.hand === 'doc') { const d = f.filter((x) => x.e.t === 'doc' && (!sc.doc || x.e.kind === sc.doc) && truthOk(x.e)); ok = d.length > 0; if (!ok) errors.push(`${it.id}：出来事 ${sc.ev} が書類（種類 ${sc.doc}・正しい仕訳つき）として実在しない`); }
        else { ok = f.some((x) => x.e.t === 'close' || (CALC_T.has(x.e.t) && (x.e.t !== 'calc' || x.e.answer != null))); if (!ok) errors.push(`${it.id}：出来事 ${sc.ev} が作業台の部品として実在しない`); }
        if (ok && !f.some((x) => x.e.t === 'close' || x.e.t === 'board' || !x.e.scope || x.e.scope.includes(it.id) || (sc.doc && x.e.kind === sc.doc))) errors.push(`${it.id}：出来事 ${sc.ev} の scope にこの項目がない`);
      }
      if (ok) real++;
    }
    for (const a of m.again || []) {
      if (/^guard:/.test(a)) continue;
      const c = D.cards.byId[a];
      if (c) { if (c.once) errors.push(`${it.id}：周回でもう一度出る札 ${a} が1周に1回きり（once）`); continue; }
      if (!findEv({ ev: a }).length && !findEv({ ev: a, any: true }).length) errors.push(`${it.id}：周回でもう一度出る場面 ${a} が台本にない`);
    }
    if (real < 2) errors.push(`${it.id}：段 ${st} の項目なのに、台本に実在する手で書く場面が ${real}（2つ以上）`);
  }
  lines.push(`  ${st <= STAGE ? (real >= 2 ? '●' : '×') : '・'} 段${st} ${it.sec.padEnd(10, '　')} ${it.name}　手で書く場面 ${distinct.size}${st <= STAGE ? `（台本に実在 ${real}）` : '（場面は表に書いた・実装は後）'}`);
}
for (const [k, n] of Object.entries(WANT)) if ((stat[k] || 0) !== n) errors.push(`段 ${k} の項目の数 ${stat[k] || 0}（l.1 の表は ${n}）`);
const upto = Object.entries(stat).filter(([k]) => +k <= STAGE).reduce((t, [, n]) => t + n, 0);
console.log(`ラーメン版の場面の表：全 ${B.scope.length} 項目に場面あり。段 ${STAGE} まで（${D.scopeStages[STAGE] || ''}）の ${upto} 項目は台本で手で書く場面が2つ以上かを確かめた（段ごと：${Object.entries(stat).sort().map(([k, n]) => `段${k} ${n}`).join('・')}）`);
console.log(lines.join('\n'));
if (errors.length) { console.error('\n' + errors.join('\n')); console.error(`\n${errors.length} 件`); process.exit(1); }
console.log(`OK：段 ${STAGE}（累計 ${upto}/77）`);
