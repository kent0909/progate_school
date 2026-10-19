#!/usr/bin/env node
// ピヨ商店の台本（js/sim/scenario.js）を、正しい答えだけで1年進めて検算する。
// ・すべての選択肢の組み合わせで、仕訳の貸借一致・科目の存在・月末の現金がマイナスにならないこと
// ・資金不足の手当てをしなければ、9月に初めて預金がマイナスになること
// Usage: node boki2/tools/sim-check.js
global.window = global;
const path = require('path');
const root = path.join(__dirname, '..');
['js/core.js', 'js/data/accounts.js', 'js/sim/scenario.js'].forEach((f) => require(path.join(root, f)));
const B = window.BOKI, D = window.SIMDATA;
const errors = [];
const err = (m) => errors.push(m);
const val = (x, S) => (typeof x === 'function' ? x(S) : x);

const decisions = [];
for (const m of D.months) for (const e of m.events) if (e.t === 'decision') decisions.push(e);
const combos = decisions.reduce((acc, d) => acc.flatMap((c) => d.options.map((o) => ({ ...c, [d.id]: o.id }))), [{}]);

function play(dec, { skipCrunch = false } = {}) {
  const S = { decisions: dec };
  const bal = {};
  const months = [];
  for (const m of D.months) {
    for (const e of m.events) {
      if (e.when && !e.when(S)) continue;
      if (e.t !== 'doc') continue;
      if (skipCrunch && ['loan', 'discount', 'col-d-early', 'repay'].includes(e.id)) continue;
      const a = val(e.ans, S);
      const sum = (s) => a[s].reduce((t, x) => t + x[1], 0);
      if (sum('dr') !== sum('cr')) err(`${m.label} ${e.id}: 貸借不一致 ${sum('dr')} / ${sum('cr')}`);
      for (const [acc] of a.dr.concat(a.cr)) if (!B.accounts[acc]) err(`${m.label} ${e.id}: 科目がない ${acc}`);
      const taps = val(e.doc.rows, S).filter((r) => r[2] === 'amt').map((r) => r[1]);
      for (const [, v] of a.dr.concat(a.cr)) if (!taps.includes(v)) err(`${m.label} ${e.id}: 金額 ${v} が書類のタップ欄にない`);
      for (const [acc, v] of a.dr) bal[acc] = (bal[acc] || 0) + v;
      for (const [acc, v] of a.cr) bal[acc] = (bal[acc] || 0) - v;
    }
    months.push({ label: m.label, bank: bal['普通預金'] || 0, cash: bal['現金'] || 0 });
  }
  return { bal, months };
}

const crunchMonths = play(combos[0], { skipCrunch: true }).months.filter((x) => x.bank < 0).map((x) => x.label);
if (crunchMonths[0] !== '9月') err(`手当てなしで最初に預金がマイナスになる月が9月でない：${crunchMonths.join('・') || 'なし'}`);

for (const c of combos) {
  const { bal, months } = play(c);
  for (const x of months) if (x.bank < 0) err(`${JSON.stringify(c)} ${x.label}: 預金がマイナス ${x.bank}`);
  const total = Object.values(bal).reduce((t, v) => t + v, 0);
  if (total !== 0) err(`${JSON.stringify(c)}: 試算表の合計が合わない ${total}`);
}

// 物語の中の数字と、帳簿の数字の照合
const base = play(combos[0], { skipCrunch: true }).months;
const aug = base.find((x) => x.label === '8月');
console.log('月末の預金・現金（手当てなし）：', base.map((x) => `${x.label} ${x.bank}/${x.cash}`).join('  '));
const sepTalk = D.months.find((m) => m.m === 9).events[0].b1.talk.map((x) => x[1]).join('');
if (!sepTalk.includes(`${Math.floor(aug.bank / 10000)}万${(aug.bank % 10000).toLocaleString('ja-JP')}円`)) err(`9月の台詞の預金残高が8月末の預金 ${aug.bank} と合わない`);

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK：${combos.length} 通りの選択で検算した`);
