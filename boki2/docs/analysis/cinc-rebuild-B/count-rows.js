#!/usr/bin/env node
// 担当B：報告（cinc-rebuild-B-game.md）の「79行の表」を数える。
// ①番号が P1〜P5・R1〜R14・L1a〜L12b・V1〜V33・E1〜E3 の79個そろい、重複がないか
// ②程度（作られている／一部／ない）の数
// ③表の中の `js/…:行` が実在するファイルの行数の範囲か、S番号が写真集 INDEX.md にあるか
// 使い方：node count-rows.js [報告のパス]
'use strict';
const fs = require('fs'), path = require('path');
const B = path.resolve(__dirname, '../../..');   // boki2/
const file = process.argv[2] || path.join(B, 'docs/analysis/cinc-rebuild-B-game.md');
const md = fs.readFileSync(file, 'utf8');
const want = [...[1, 2, 3, 4, 5].map(i => 'P' + i), ...Array.from({ length: 14 }, (_, i) => 'R' + (i + 1)),
  ...Array.from({ length: 12 }, (_, i) => ['L' + (i + 1) + 'a', 'L' + (i + 1) + 'b']).flat(), ...Array.from({ length: 33 }, (_, i) => 'V' + (i + 1)), 'E1', 'E2', 'E3'];
const ID = /^(P[1-5]|R(?:1[0-4]|[1-9])|L(?:1[0-2]|[1-9])[ab]|V(?:3[0-3]|[12]\d|[1-9])|E[1-3])$/;
const rows = md.split('\n').filter(l => l.startsWith('|')).map(l => l.split('|').slice(1, -1).map(c => c.trim())).filter(c => ID.test(c[0]));
const ids = rows.map(r => r[0]);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i), missing = want.filter(x => !ids.includes(x));
const DEG = ['作られている', '一部', 'ない'];
const count = Object.fromEntries(DEG.map(d => [d, 0])), byGroup = {};
const badDeg = [];
for (const r of rows) {
  const d = r[3]; if (!DEG.includes(d)) { badDeg.push(r[0] + ':' + d); continue; }
  count[d]++; const g = r[0][0]; (byGroup[g] ||= Object.fromEntries(DEG.map(x => [x, 0])))[d]++;
}
const index = fs.readFileSync(path.join(B, 'docs/screens/INDEX.md'), 'utf8');
const badRef = [], badS = [], shown = []; let refs = 0, sRefs = 0;
for (const r of rows) for (const m of r.join(' ').matchAll(/((?:js|tools)\/[\w./-]+\.js):(\d+)/g)) {
  refs++; const f = path.join(B, m[1]);
  if (!fs.existsSync(f)) { badRef.push(`${r[0]} ${m[1]}（ない）`); continue; }
  const L = fs.readFileSync(f, 'utf8').split('\n'), n = L.length; if (+m[2] < 1 || +m[2] > n) { badRef.push(`${r[0]} ${m[1]}:${m[2]}（${n}行まで）`); continue; }
  shown.push(`${r[0]}\t${m[1]}:${m[2]}\t${L[+m[2] - 1].trim().slice(0, 110)}`);
}
// --lines：引いた行の中身を並べる（取りまとめ役が無作為に開くときの手がかり）
if (process.argv.includes('--lines')) { console.log(shown.join('\n')); process.exit(0); }
for (const r of rows) for (const m of r.join(' ').matchAll(/S(\d{3})/g)) { sRefs++; if (!index.includes(`|S${m[1]}|`)) badS.push(r[0] + ' S' + m[1]); }
const noWhere = rows.filter(r => r[3] !== 'ない' && !/(js|tools)\/[\w./-]+\.js:\d+/.test(r[2])).map(r => r[0]);
console.log(JSON.stringify({ file: path.relative(B, file), rows: rows.length, expected: want.length, missing, duplicated: dup, degrees: count, byGroup, badDegree: badDeg, codeRefs: refs, badCodeRefs: badRef, screenRefs: sRefs, badScreenRefs: badS, presentRowsWithoutCodeRef: noWhere }, null, 1));
process.exit(missing.length || dup.length || badDeg.length || badRef.length || badS.length ? 1 : 0);
