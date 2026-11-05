#!/usr/bin/env node
// J-B：B の run-full.js を自分で走らせ直した出力（.json）と、B が保存した出力（out/*.json.gz）を突き合わせる。
// 比べるもの：月ごとの結果 res の全部の数、判断（decisions）、引いた札（dealt）、札の結果（cardOutcomes）、押した手の並び（actions の sel）、画面の数と順（screens の key）、結末。
// 画面の文（text）は時計・描き直しの差が出うるので、key の並びと、月報の文が一致するかを別に数える。
// 使い方：node cinc-rebuild-B-fact-rerun-compare.js <走らせ直した.json> <保存の.json.gz>
'use strict';
const fs = require('fs'), zlib = require('zlib');
const [a, b] = process.argv.slice(2);
const load = f => JSON.parse(f.endsWith('.gz') ? zlib.gunzipSync(fs.readFileSync(f)) : fs.readFileSync(f));
const A = load(a), B = load(b);
const J = x => JSON.stringify(x);
const diffKeys = (x, y) => { const ks = new Set([...Object.keys(x || {}), ...Object.keys(y || {})]); return [...ks].filter(k => J((x || {})[k]) !== J((y || {})[k])); };
const resDiff = diffKeys(A.final.res, B.final.res);
const out = {
  rerun: a, saved: b,
  args: J(A.args) === J(B.args),
  outcomeSteps: [A.outcome.steps, B.outcome.steps],
  resMonths: [Object.keys(A.final.res).length, Object.keys(B.final.res).length], resMonthsDiffering: resDiff,
  decisions: diffKeys(A.final.decisions, B.final.decisions),
  dealt: diffKeys(A.final.dealt, B.final.dealt),
  cardOutcomes: J(A.final.cardOutcomes) === J(B.final.cardOutcomes),
  W: J(A.final.W) === J(B.final.W),
  actions: [A.actions.length, B.actions.length, J(A.actions.map(x => x.sel)) === J(B.actions.map(x => x.sel))],
  screensKeys: [A.screens.length, B.screens.length, J(A.screens.map(s => s.key)) === J(B.screens.map(s => s.key))],
  rreportTextSame: (() => { const ra = A.screens.filter(s => s.t === 'rreport'), rb = B.screens.filter(s => s.t === 'rreport'); return `${ra.filter((s, i) => rb[i] && rb[i].text === s.text).length}/${Math.max(ra.length, rb.length)}`; })(),
  decisionMoneySame: (() => { const da = A.screens.filter(s => s.t === 'decision'), db = B.screens.filter(s => s.t === 'decision'); return `${da.filter((s, i) => db[i] && J(db[i].money) === J(s.money)).length}/${Math.max(da.length, db.length)}`; })(),
  errors: [A.errors.length, B.errors.length],
};
if (resDiff.length) { const t = resDiff[0]; out.firstResDiff = { t, keys: diffKeys(A.final.res[t], B.final.res[t]).slice(0, 10) }; }
console.log(JSON.stringify(out));
