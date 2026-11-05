#!/usr/bin/env node
// 既存の道具の生ログから付録(s.4)との比較表を作る。数・幅を動かさない。
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2];
if (!root) throw new Error('ログのディレクトリを指定してください');
const read = (name) => fs.readFileSync(path.join(root, name + '.log'), 'utf8');
const texts = Object.fromEntries(['flip10', 'taste10', 'ceil10', 'calib10', 'hire10'].map((n) => [n, read(n)]));
const rows = [];
function add(label, expect, value, lo, hi, unit = '%') {
  const status = value === null ? '未完了' : value >= lo && value <= hi ? '幅内' : '幅外';
  rows.push({ label, expect, value, unit, status });
}
const number = (match, i = 1) => match ? Number(match[i]) : null;
for (const [p, target] of [[0, 70], [0.25, 54.7], [0.5, 43.3], [1, 22]]) {
  const line = texts.flip10.split('\n').find((s) => s.startsWith(`追随 確率${p}・幅≤50円`));
  add(`flip10 追随${p}`, `${target}±7pt`, number(line?.match(/入れ替わり ([\d.]+)%/)), target - 7, target + 7);
}
for (const [prefix, label, lo, hi] of [['上手の上限（口座で選ぶ', 'ceil10 口座で選んだ上限', 350, 490], ['規則の上手（', 'ceil10 規則の上手', 180, 260]]) {
  const line = texts.ceil10.split('\n').find((s) => s.startsWith(prefix));
  add(label, `${lo}〜${hi}万`, number(line?.match(/中央値 ([-\d]+)万/)), lo, hi, '万');
}
for (const n of [60, 120, 300]) {
  const line = texts.calib10.split('\n').find((s) => s.startsWith(`| ${n} |`));
  add(`calib10 較正${n}周 potentialScale`, '0.57〜0.59', line ? Number(line.split('|')[2]) : null, 0.57, 0.59, '');
  add(`calib10 較正${n}周 家族3年末`, '67〜82%', number(line?.match(/3年末 ([\d.]+)%/)), 67, 82);
}
for (const [prefix, label, lo, hi] of [['| 版1.0（手直しの時間1', '時間1', 50, 60], ['| 手直しの時間2 |', '時間2だけ', 35, 50]]) {
  const line = texts.taste10.split('\n').find((s) => s.startsWith(prefix));
  add(`taste10 ${label} 変えない`, '≤5%', number(line?.match(/never ([\d.]+)%/)), 0, 5);
  add(`taste10 ${label} 3か月ごと`, `${lo}〜${hi}%`, number(line?.match(/max ([\d.]+)%/)), lo, hi);
}
for (const [cell, target, lo, hi] of [['全体', '7.5%（4〜13%）', 4, 13], ['厚い町', '20%（幅なし）', 20, 20], ['薄い町', '0%（幅なし）', 0, 0]]) {
  const line = texts.hire10.split('\n').find((s) => s.startsWith('| 版1.0（再較正 ') && s.includes(`・${cell} |`));
  const value = line ? parseFloat(line.split('|')[4]) : null;
  add(`hire10 基準 ${cell}`, target, value, lo, hi);
  if (lo === hi && value !== null) rows.at(-1).status = value === lo ? '点の記載と一致' : '点の記載と不一致（幅なし）';
}
console.log('| 印 | 指標 | 期待 | 実測 | 比較 |\n|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.value === null ? '【問い】' : '【確かめた】'} | ${r.label} | ${r.expect} | ${r.value === null ? '未完了' : r.value + r.unit} | ${r.status} |`);
const counts = rows.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
console.log('\n集計（比較表の行数。実験や周数ではない）：' + JSON.stringify(counts));
if (rows.some((r) => r.value === null)) process.exitCode = 2;
