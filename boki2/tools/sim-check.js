#!/usr/bin/env node
// ピヨ商店の1年目（js/sim/scenario.js）を、正しい記帳で、すべての判断の分かれ道について進めて検算する。
// ・判断ごとに枝分かれ（when のある判断は、その条件を満たす枝だけ）。会社がなくなる結末（final）でその枝は終わる
// ・すべての枝で：仕訳の貸借一致、科目の存在、書類のタップ欄に金額があること、書類を記帳するたびに預金がマイナスにならないこと、試算表の合計0
// ・11月の資金不足：E社への支払いの直前の預金が、台本の preBank と一致し、手を打たないと足りない（不足額が正）こと
// Usage: node boki2/tools/sim-check.js
global.window = global;
const path = require('path');
const root = path.join(__dirname, '..');
['js/core.js', 'js/data/accounts.js', 'js/sim/scenario.js'].forEach((f) => require(path.join(root, f)));
const B = window.BOKI, D = window.SIMDATA;
const errors = [];
const err = (m) => { if (!errors.includes(m)) errors.push(m); };
const val = (x, S) => (typeof x === 'function' ? x(S) : x);
const bank = (S) => S.T.reduce((t, e) => t + e.dr.filter(([a]) => a === '普通預金').reduce((x, [, v]) => x + v, 0) - e.cr.filter(([a]) => a === '普通預金').reduce((x, [, v]) => x + v, 0), 0);
const flat = [];
D.months.forEach((m, mi) => m.events.forEach((e) => flat.push({ e, mi, label: m.label })));
let leaves = 0;
const ends = {};

function run(i, S) {
  for (; i < flat.length; i++) {
    const { e, label } = flat[i];
    if (e.when && !e.when(S)) continue;
    if (e.t === 'decision') {
      for (const o of e.options) run(i + 1, { ...S, T: S.T.slice(), decisions: { ...S.decisions, [e.id]: o.id } });
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
    if (e.t !== 'doc') continue;
    const a = val(e.ans, S);
    const sum = (s) => a[s].reduce((t, x) => t + x[1], 0);
    if (sum('dr') !== sum('cr')) err(`${label} ${e.id}: 貸借不一致 ${sum('dr')} / ${sum('cr')}`);
    for (const [acc] of a.dr.concat(a.cr)) if (!B.accounts[acc]) err(`${label} ${e.id}: 科目がない ${acc}`);
    const taps = val(e.doc.rows, S).filter((r) => r[2] === 'amt').map((r) => r[1]);
    for (const [, v] of a.dr.concat(a.cr)) if (!taps.includes(v)) err(`${label} ${e.id}: 金額 ${v} が書類のタップ欄にない`);
    S.T.push({ dr: a.dr, cr: a.cr });
    const b = bank(S);
    if (b < 0) err(`${label} ${e.id}: 預金がマイナス ${b}（${JSON.stringify(S.decisions)}）`);
  }
  finish(S, '1年の終わり');
}
function finish(S, where) {
  leaves++;
  const bal = {};
  for (const e of S.T) { for (const [a, v] of e.dr) bal[a] = (bal[a] || 0) + v; for (const [a, v] of e.cr) bal[a] = (bal[a] || 0) - v; }
  const total = Object.values(bal).reduce((t, v) => t + v, 0);
  if (total !== 0) err(`${where}：試算表の合計が合わない ${total}（${JSON.stringify(S.decisions)}）`);
}
run(0, { T: [], decisions: {} });
for (const id of Object.keys(D.endings)) if (!ends[id] && !D.endings[id].ifOnly) err(`結末 ${id} に、どの枝からも到達しない`);

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK：${leaves} 本の分かれ道で検算した（結末：${Object.entries(ends).map(([k, v]) => `${k} ${v}`).join('・')}）`);
