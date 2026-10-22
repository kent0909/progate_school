#!/usr/bin/env node
// docs/audit/BIZ-FUNVISUAL-reasoning.md の判定の数を、表の判定の列から数える。
// 使い方：node boki2/docs/analysis/funvisual-reasoning-verdicts.js
'use strict';
const fs = require('fs');
const path = require('path');
const lines = fs.readFileSync(path.join(__dirname, '..', 'audit', 'BIZ-FUNVISUAL-reasoning.md'), 'utf8').split('\n');
const cnt = (re, col, words) => {
  const out = Object.fromEntries(words.map((w) => [w, 0])); let rows = 0;
  for (const l of lines) {
    if (!re.test(l)) continue; rows++;
    const v = l.split('|')[col].trim();
    if (/K44/.test(l.split('|')[1]) && v.includes('弱い') && v.includes('不当')) { out['弱い']++; out['不当']++; continue; }
    const w = words.find((x) => v.includes(x)); if (w) out[w]++; else out['?'] = (out['?'] || 0) + 1;
  }
  return { rows, out };
};
const v1 = cnt(/^\| K\d\d \|/, 7, ['不当', '弱い', '妥当']);
const r = cnt(/^\| R\d\d \|/, 5, ['一部', '応えていない', '応えた']);
const n = cnt(/^\| N\d\d[ab]? \|/, 7, ['不当', '弱い', '妥当']);
const s3 = cnt(/^\| S\d\d \|/, 5, ['一部', '応えていない', '応えた']);
const m3 = cnt(/^\| M\d\d \|/, 7, ['不当', '弱い', '妥当']);
console.log('版0.1 の検査（K）：行', v1.rows, '判定', JSON.stringify(v1.out));
console.log('版0.2 の応え（R）：行', r.rows, JSON.stringify(r.out));
console.log('版0.2 の新しい結論（N）：行', n.rows, JSON.stringify(n.out));
console.log('版0.3 の応え（S）：行', s3.rows, JSON.stringify(s3.out));
console.log('版0.3 の結論（M）：行', m3.rows, JSON.stringify(m3.out));
