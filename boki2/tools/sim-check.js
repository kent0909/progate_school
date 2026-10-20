#!/usr/bin/env node
// ピヨ商店の1年目（js/sim/scenario.js）を、正しい記帳で、すべての判断の分かれ道について進めて検算する。
// ・判断ごとに枝分かれ（when のある判断は、その条件を満たす枝だけ）。会社がなくなる結末（final）でその枝は終わる
// ・すべての枝で：仕訳の貸借一致、科目の存在、書類のタップ欄に金額があること、書類を記帳するたびに預金がマイナスにならないこと、試算表の合計0
// ・判断の返り：同じ判断の別の選択肢を選んで、その後の出来事（書類の金額・会話・結末）がまったく同じになる判断は「返りのない判断」として失敗にする
// ・11月の資金不足：E社への支払いの直前の預金が、台本の preBank と一致し、手を打たないと足りない（不足額が正）こと
// Usage: node boki2/tools/sim-check.js
global.window = global;
const path = require('path');
const root = path.join(__dirname, '..');
['js/core.js', 'js/data/accounts.js', 'js/sim/scenario.js', 'js/sim/year2.js'].forEach((f) => require(path.join(root, f)));
const B = window.BOKI, D = window.SIMDATA;
const errors = [];
const err = (m) => { if (!errors.includes(m)) errors.push(m); };
const val = (x, S) => (typeof x === 'function' ? x(S) : x);
const bank = (S) => S.T.reduce((t, e) => t + e.dr.filter(([a]) => a === '普通預金').reduce((x, [, v]) => x + v, 0) - e.cr.filter(([a]) => a === '普通預金').reduce((x, [, v]) => x + v, 0), 0);
const flat = [];
D.months.forEach((m, mi) => m.events.forEach((e) => flat.push({ e, mi, label: m.label })));
// 締め切り（engine の closingEntries と同じ）：収益・費用を損益へ、差を繰越利益剰余金へ
function closingOf(T, mi) {
  const b = {};
  for (const e of T) { for (const [a, v] of e.dr) b[a] = (b[a] || 0) + v; for (const [a, v] of e.cr) b[a] = (b[a] || 0) - v; }
  const cat = (a) => (B.accounts[a] || {}).cat, rev = [], exp = [];
  for (const [a, v] of Object.entries(b)) { if (!v) continue; if (cat(a) === '収益') rev.push([a, -v]); else if (cat(a) === '費用') exp.push([a, v]); }
  const R = rev.reduce((t, [, v]) => t + v, 0), X = exp.reduce((t, [, v]) => t + v, 0), ni = R - X, y = D.months[mi].year || 1, out = [];
  if (rev.length) out.push({ dr: rev, cr: [['損益', R]] });
  if (exp.length) out.push({ dr: [['損益', X]], cr: exp });
  if (ni > 0) out.push({ dr: [['損益', ni]], cr: [['繰越利益剰余金', ni]] }); else if (ni < 0) out.push({ dr: [['繰越利益剰余金', -ni]], cr: [['損益', -ni]] });
  return out.map((e) => Object.assign(e, { y, closing: true }));
}
let leaves = 0;
const ends = {};

// 1年目の判断の最初の選択肢と、2年目を替えて試す1年目の代表の枝
const Y1FIRST = {};
D.months.forEach((m) => { if ((m.year || 1) === 1) m.events.filter((e) => e.t === 'decision').forEach((e) => { Y1FIRST[e.id] = e.options[0].id; }); });
const Y1REPS = [{}, { uncle: 'equity', report: 'cash', volume: '3m' }, { recon: 'align', dun: 'send', credit: 'cash', dep: 'rate' }, { crunch: 'nothing', crunch2: 'hiloan', kessan: 'follow', kessan2: 'keep' }];
function run(i, S) {
  for (; i < flat.length; i++) {
    const { e, label, mi } = flat[i];
    S.mi = mi;
    if (e.when && !e.when(S)) continue;
    if (e.t !== 'decision') S.tr.push(trace(e, S));
    if (e.t === 'decision') {
      // 2年目からは枝が多すぎるので、「ほかの判断は最初の選択肢のまま、1つだけ替える」で検算する。
      // 結末に届く組み合わせ（SIM.combos）は、その組み合わせのとおりにも進める
      const y2 = (D.months[mi].year || 1) >= 2;
      const forced = S.combo && S.combo[e.id];
      // 1年目のすべての枝は、2年目を最初の選択肢で通す。2年目の判断を替えるのは、1年目の代表の枝（Y1REPS）の上だけ
      const rep = !y2 || Y1REPS.some((r) => Object.entries(S.decisions).every(([k, v]) => !(k in Y1FIRST) || (r[k] || Y1FIRST[k]) === v));
      const opts = forced ? e.options.filter((o) => o.id === forced) : y2 && (S.varied || !rep) ? [e.options[0]] : e.options;
      for (const o of opts) run(i + 1, { ...S, T: S.T.slice(), tr: S.tr.slice(), decisions: { ...S.decisions, [e.id]: o.id }, varied: S.varied || (y2 && !forced && o !== e.options[0]) });
      return;
    }
    if (e.t === 'ending') {
      if (!D.endings[e.id]) err(`${label}：結末 ${e.id} が SIM.endings にない`);
      ends[e.id] = (ends[e.id] || 0) + 1;
      if (D.endings[e.id] && D.endings[e.id].final) { finish(S, `結末 ${e.id}`); return; }
      continue;
    }
    if (e.id === 'pap11-E') {
      const pre = bank(S);
      if (S.__pre !== undefined && S.__pre !== pre) err(`preBank の不一致`);
    }
    if (e.id === 'd-cash') {
      const pre = bank(S);
      if (pre !== D.__preBank(S)) err(`11月10日の前の預金 ${pre} が台本の preBank ${D.__preBank(S)} と合わない（${JSON.stringify(S.decisions)}）`);
      if (pre >= 300000) err(`手を打たなくても11月10日に払えてしまう（${pre}）`);
    }
    if (e.t === 'closing') { S.T.push(...closingOf(S.T, mi)); continue; }
    if (e.t !== 'doc') continue;
    const a = val(e.ans, S);
    const sum = (s) => a[s].reduce((t, x) => t + x[1], 0);
    if (sum('dr') !== sum('cr')) err(`${label} ${e.id}: 貸借不一致 ${sum('dr')} / ${sum('cr')}`);
    for (const [acc] of a.dr.concat(a.cr)) if (!B.accounts[acc]) err(`${label} ${e.id}: 科目がない ${acc}`);
    const taps = val(e.doc.rows, S).filter((r) => r[2] === 'amt').map((r) => r[1]);
    for (const [, v] of a.dr.concat(a.cr)) if (!taps.includes(v)) err(`${label} ${e.id}: 金額 ${v} が書類のタップ欄にない`);
    S.T.push({ dr: a.dr, cr: a.cr, y: D.months[mi].year || 1 });
    const b = bank(S);
    if (b < 0) err(`${label} ${e.id}: 預金がマイナス ${b}（${JSON.stringify(S.decisions)}）`);
  }
  finish(S, '1年の終わり');
}
// その後に起きたことの記録（判断そのものは含めない）
function trace(e, S) {
  if (e.t === 'doc') return `${e.id}:${JSON.stringify(val(e.ans, S))}`;
  if (e.t === 'talk') return `${e.id || ''}:${JSON.stringify(val(e.lines, S))}`;
  return `${e.t}:${e.id || ''}`;
}
const traces = [];
function finish(S, where) {
  leaves++;
  traces.push({ d: S.decisions, tr: S.tr.join('|') });
  const bal = {};
  for (const e of S.T) { for (const [a, v] of e.dr) bal[a] = (bal[a] || 0) + v; for (const [a, v] of e.cr) bal[a] = (bal[a] || 0) - v; }
  const total = Object.values(bal).reduce((t, v) => t + v, 0);
  if (total !== 0) err(`${where}：試算表の合計が合わない ${total}（${JSON.stringify(S.decisions)}）`);
}
run(0, { T: [], tr: [], decisions: {} });
// 結末に届く2年目の判断の組み合わせ（1年目は標準の枝で）
for (const combo of D.combos || []) run(0, { T: [], tr: [], decisions: {}, combo, varied: true });
// 判断ごとに：ほかの判断をそろえたとき、選択肢を変えても後の出来事が同じなら「返りがない」
for (const { e } of flat.filter((x) => x.e.t === 'decision')) {
  const groups = {};
  for (const t of traces) {
    if (!(e.id in t.d)) continue;
    const rest = JSON.stringify(Object.entries(t.d).filter(([k]) => k !== e.id).sort());
    (groups[rest] = groups[rest] || {})[t.d[e.id]] = t.tr;
  }
  const same = Object.values(groups).filter((g) => Object.keys(g).length > 1 && new Set(Object.values(g)).size < Object.keys(g).length);
  if (same.length && same.length === Object.values(groups).filter((g) => Object.keys(g).length > 1).length) err(`判断 ${e.id}：選択肢を変えても、その後の書類・会話・結末が変わらない（返りのない判断）`);
}
for (const id of Object.keys(D.endings)) if (!ends[id] && !D.endings[id].ifOnly) err(`結末 ${id} に、どの枝からも到達しない`);

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK：${leaves} 本の分かれ道で検算した（結末：${Object.entries(ends).map(([k, v]) => `${k} ${v}`).join('・')}）`);
