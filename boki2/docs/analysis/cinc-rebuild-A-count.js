#!/usr/bin/env node
// cinc-rebuild-A-design.md の「79行の表」と「食い違いの表」を数え、引用を DESIGN-RAMEN.md の原文と突き合わせる。
// Usage: node boki2/docs/analysis/cinc-rebuild-A-count.js
// 確かめること：
//  1. 79行の ID がそろっている（P1〜P5・R1〜R14・L1小〜L12大・V1〜V33・E1〜E3。抜け・重なりなし）
//  2. 各行の程度は 入っている／一部／入っていない／逆 のどれか。数を群ごとに出す
//  3. 各行の引用（`…` の中）が20字以上で、節の欄の最初の行番号 L<n> の行に、そのままの字で出る
//  4. 一部の行は「入：」と「欠：」の両方を持つ。入っていない・逆の行は「欠：」を持ち、面白さの欄に「悪い面」がある
//  5. 食い違いの表の各行の引用（古い側・新しい側の欄の L<n> と `…`）が原文の行に出る
const fs = require('fs');
const path = require('path');
const DOCS = path.join(__dirname, '..');
const rep = fs.readFileSync(path.join(DOCS, 'analysis', 'cinc-rebuild-A-design.md'), 'utf8').split('\n');
const des = fs.readFileSync(path.join(DOCS, 'DESIGN-RAMEN.md'), 'utf8').split('\n');

const want = [];
for (let i = 1; i <= 5; i++) want.push('P' + i);
for (let i = 1; i <= 14; i++) want.push('R' + i);
for (let i = 1; i <= 12; i++) { want.push('L' + i + '小'); want.push('L' + i + '大'); }
for (let i = 1; i <= 33; i++) want.push('V' + i);
for (let i = 1; i <= 3; i++) want.push('E' + i);

const GRADES = ['入っている', '一部', '入っていない', '逆'];
const cells = (l) => l.split('|').slice(1, -1).map((c) => c.trim());
const errs = [];
const rows = {};
let section = '';
for (const [i, l] of rep.entries()) {
  if (/^#{2,3} /.test(l)) section = l;
  if (!/^\| *(P|R|L|V|E)\d/.test(l)) continue;
  if (!/79行の表/.test(section)) continue;
  const c = cells(l);
  const id = c[0];
  if (rows[id]) errs.push(`${id}：2回出る（行 ${i + 1}）`);
  rows[id] = { line: i + 1, c };
}
const seen = Object.keys(rows);
const missing = want.filter((w) => !rows[w]);
const extra = seen.filter((s) => !want.includes(s));
if (missing.length) errs.push('抜けている ID：' + missing.join(' '));
if (extra.length) errs.push('余分な ID：' + extra.join(' '));

const count = {}; const byGroup = {};
const quoteOk = []; const quoteNg = [];
for (const id of want) {
  const r = rows[id]; if (!r) continue;
  const [, , sec, grade, quote, gap, fun] = r.c;
  const g = id[0] + (id.startsWith('L') ? (id.endsWith('小') ? '小' : '大') : '');
  if (!GRADES.includes(grade)) { errs.push(`${id}：程度が「${grade}」`); continue; }
  count[grade] = (count[grade] || 0) + 1;
  byGroup[g] = byGroup[g] || {}; byGroup[g][grade] = (byGroup[g][grade] || 0) + 1;
  const ln = (sec.match(/L(\d+)/) || [])[1];
  const q = (quote.match(/`([^`]+)`/) || [])[1];
  if (!ln || !q) { errs.push(`${id}：節の行番号か引用がない`); continue; }
  const len = [...q].length;
  const src = des[Number(ln) - 1] || '';
  if (len < 20) errs.push(`${id}：引用が ${len} 字（20字未満）`);
  if (src.includes(q)) quoteOk.push(id); else { quoteNg.push(id); errs.push(`${id}：引用が L${ln} に出ない：${q}`); }
  if (grade === '一部' && !(/入：/.test(gap) && /欠：/.test(gap))) errs.push(`${id}：一部なのに「入：」「欠：」の両方がない`);
  if ((grade === '入っていない' || grade === '逆') && (!/欠：/.test(gap) || !/悪い面/.test(fun || ''))) errs.push(`${id}：${grade}なのに「欠：」か面白さの欄の「悪い面」がない`);
}

// 食い違いの表
let dOk = 0; const dRows = [];
section = '';
for (const [i, l] of rep.entries()) {
  if (/^#{2,3} /.test(l)) section = l;
  if (!/食い違い/.test(section) || !/^\| *D\d+/.test(l)) continue;
  const c = cells(l);
  dRows.push(c[0]);
  let got = 0;
  for (const cell of [c[2], c[3]]) {
    const m = (cell || '').match(/L(\d+)[^`]*`([^`]+)`/);
    if (!m) continue;
    const src = des[Number(m[1]) - 1] || '';
    if (src.includes(m[2])) got++; else errs.push(`${c[0]}：引用が L${m[1]} に出ない：${m[2]}`);
  }
  if (got === 0) errs.push(`${c[0]}：確かめられる引用が1つもない`); else dOk++;
}

const total = want.filter((w) => rows[w]).length;
console.log(`79行の表：${total} 行（期待 79）`);
console.log('程度の数：' + GRADES.map((g) => `${g} ${count[g] || 0}`).join('／') + `（合計 ${GRADES.reduce((a, g) => a + (count[g] || 0), 0)}）`);
for (const g of ['P', 'R', 'L小', 'L大', 'V', 'E']) {
  const b = byGroup[g] || {};
  console.log(`  ${g.padEnd(3)}：` + GRADES.map((x) => `${x} ${b[x] || 0}`).join('／'));
}
const ng = want.filter((w) => rows[w] && (rows[w].c[3] === '入っていない' || rows[w].c[3] === '逆'));
console.log('入っていない・逆の行：' + ng.map((w) => `${w}(${rows[w].c[3]})`).join(' '));
console.log(`引用の突き合わせ：原文の行に出る ${quoteOk.length}／${total}`);
console.log(`食い違いの表：${dRows.length} 行、引用を確かめた行 ${dOk}`);
if (errs.length) { console.log('エラー ' + errs.length + ' 件'); errs.forEach((e) => console.log('  ✗ ' + e)); process.exit(1); }
console.log('エラー 0');
