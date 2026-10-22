#!/usr/bin/env node
// BIZ-GROWTH 用：JFA に提出された FC 開示書面（法定開示）から写した数を数える。
// 入力：docs/analysis/bizgrowth-fc-disclosures.csv（数字は各書面の「加盟者の店舗に関する事項」「訴訟件数」の表から手で写した）
// 出力：チェーンごとの合計と、FC店数が分かる年の「中途終了÷期末FC店数」、全体の合計
const fs = require('fs');
const path = require('path');
const rows = fs.readFileSync(path.join(__dirname, 'bizgrowth-fc-disclosures.csv'), 'utf8').trim().split('\n');
const head = rows.shift().split(',');
const data = rows.map((l) => { const c = l.split(','); const o = {}; head.forEach((h, i) => (o[h] = c[i])); return o; });
const num = (v) => (v === '' || v === undefined ? null : Number(v));
const by = {};
for (const r of data) (by[r.chain] = by[r.chain] || []).push(r);
let T = { years: 0, new_fc: 0, exit_mid: 0, transfer: 0, suits: 0, suitYears: 0, rateYears: 0, exitWithFc: 0, fcSum: 0 };
console.log('chain | 年数 | 新規FC計 | 中途終了計 | うち引継・直営化 | 加盟店からの訴訟計（年数） | 中途終了÷期末FC店（FC店数が分かる年の平均）');
for (const [k, rs] of Object.entries(by)) {
  const s = { n: rs.length, nf: 0, ex: 0, tr: 0, su: 0, sy: 0, rates: [] };
  for (const r of rs) {
    s.nf += num(r.new_fc) || 0; s.ex += num(r.exit_mid) || 0; s.tr += num(r.exit_mid_transfer) || 0;
    if (num(r.suits_from_fc) !== null) { s.su += num(r.suits_from_fc); s.sy++; }
    if (num(r.fc_end) && num(r.exit_mid) !== null) { s.rates.push(num(r.exit_mid) / num(r.fc_end)); T.exitWithFc += num(r.exit_mid); T.fcSum += num(r.fc_end); T.rateYears++; }
  }
  const avg = s.rates.length ? (s.rates.reduce((a, b) => a + b, 0) / s.rates.length * 100).toFixed(1) + '%' : '（FC店数なし）';
  console.log(`${k} | ${s.n} | ${s.nf} | ${s.ex} | ${s.tr} | ${s.su}（${s.sy}年） | ${avg}`);
  T.years += s.n; T.new_fc += s.nf; T.exit_mid += s.ex; T.transfer += s.tr; T.suits += s.su; T.suitYears += s.sy;
}
console.log(`チェーン数 ${Object.keys(by).length}、チェーン×年 ${T.years}、新規FC計 ${T.new_fc}、中途終了計 ${T.exit_mid}（うち引継・直営化と明記 ${T.transfer}）、加盟店からの訴訟計 ${T.suits}（${T.suitYears} チェーン×年）`);
console.log(`FC店数が分かる ${T.rateYears} チェーン×年で：中途終了 ${T.exitWithFc} ÷ 期末FC店の延べ ${T.fcSum} = ${(T.exitWithFc / T.fcSum * 100).toFixed(2)}%`);
