#!/usr/bin/env node
// J-B（BRIEF-CINC-REBUILD-AUDIT）：担当Bの報告の「79行の表」から、引かれたコードの行と写真の S 番号を自分で抜き出す。
// B の count-rows.js は使わない（同じ数になるかを別の書き方で確かめる）。
// 使い方：
//   node cinc-rebuild-B-fact-refs.js            … 数のまとめ（JSON）
//   node cinc-rebuild-B-fact-refs.js --ctx 4    … 引かれた行ごとに前後4行を並べる（判定のために全部開く）
//   node cinc-rebuild-B-fact-refs.js --shots    … S 番号ごとに、引いた行と画像ファイルの道を並べる
//   node cinc-rebuild-B-fact-refs.js --verdicts … 判定の表（cinc-rebuild-B-fact.md）の79行の判定と写真の判定を数える
'use strict';
const fs = require('fs'), path = require('path');
const B = path.resolve(__dirname, '../..');
const md = fs.readFileSync(path.join(B, 'docs/analysis/cinc-rebuild-B-game.md'), 'utf8');
// 1章の表だけを取る（「## 1. 79行の表」から「## 2.」まで）
const sec = md.slice(md.indexOf('## 1. 79行の表'), md.indexOf('## 2. 遊んだ体験'));
const rows = [];
for (const line of sec.split('\n')) {
  if (!line.startsWith('| ')) continue;
  const c = line.split('|').map(s => s.trim());
  const id = c[1];
  if (!/^(P\d|R\d+|L\d+[ab]|V\d+|E\d)$/.test(id)) continue;
  rows.push({ id, item: c[2], where: c[3], deg: c[4], when: c[5], note: c[6], line });
}
const refsOf = r => [...r.line.matchAll(/js\/[\w./-]+?\.js:\d+/g)].map(m => m[0]);
const shotsOf = r => [...r.line.matchAll(/S(\d{3})(?:〜S(\d{3}))?/g)].flatMap(m => {
  if (!m[2]) return ['S' + m[1]];
  const out = []; for (let i = +m[1]; i <= +m[2]; i++) out.push('S' + String(i).padStart(3, '0')); return out;
});
const arg = k => process.argv.includes(k);
const ctxN = (() => { const i = process.argv.indexOf('--ctx'); return i > 0 ? +process.argv[i + 1] : 0; })();
if (ctxN) {
  let n = 0;
  for (const r of rows) for (const ref of refsOf(r)) {
    n++;
    const [f, ln] = ref.split(':'); const L = fs.readFileSync(path.join(B, f), 'utf8').split('\n');
    console.log(`\n#${n} ${r.id}（${r.deg}） ${ref}`);
    for (let i = Math.max(1, +ln - ctxN); i <= Math.min(L.length, +ln + ctxN); i++) console.log(`${i === +ln ? '>' : ' '}${i}: ${L[i - 1].slice(0, 220)}`);
  }
  process.exit(0);
}
if (arg('--shots')) {
  const img = fs.readdirSync(path.join(B, 'docs/screens/images'));
  const m = new Map();
  for (const r of rows) for (const s of shotsOf(r)) { if (!m.has(s)) m.set(s, []); m.get(s).push(r.id); }
  for (const [s, ids] of m) console.log(`${s}\t${ids.join(',')}\t${img.filter(f => f.startsWith(s + '-')).join(' ') || '（画像なし）'}`);
  process.exit(0);
}
if (arg('--verdicts')) {
  const v = fs.readFileSync(path.join(B, 'docs/audit/cinc-rebuild-B-fact.md'), 'utf8');
  const t79 = v.slice(v.indexOf('<!-- T79 -->'), v.indexOf('<!-- /T79 -->'));
  const tS = v.slice(v.indexOf('<!-- TSHOT -->'), v.indexOf('<!-- /TSHOT -->'));
  const cnt = (txt, col) => { const o = {}; let n = 0; for (const l of txt.split('\n')) { if (!/^\| (P|R|L|V|E|S)\d/.test(l)) continue; n++; const c = l.split('|').map(s => s.trim()); const k = c[col]; o[k] = (o[k] || 0) + 1; } return { rows: n, ...o }; };
  console.log(JSON.stringify({ t79_rows_and_verdict: cnt(t79, 4), t79_ids: [...t79.matchAll(/^\| ((?:P|R|L|V|E)\d+[ab]?) \|/gm)].map(m => m[1]).length, shots_rows_and_verdict: cnt(tS, 4) }, null, 1));
  process.exit(0);
}
const allRefs = rows.flatMap(refsOf), allShots = rows.flatMap(shotsOf);
const deg = {}; for (const r of rows) deg[r.deg] = (deg[r.deg] || 0) + 1;
console.log(JSON.stringify({
  rows: rows.length, uniqueIds: new Set(rows.map(r => r.id)).size, degrees: deg,
  codeRefs: allRefs.length, uniqueCodeRefs: new Set(allRefs).size,
  shotRefs_countedAsWritten: [...sec.matchAll(/S\d{3}/g)].length,
  shotRefs_rangeExpanded: allShots.length, uniqueShots: new Set(allShots).size,
  naiRows: rows.filter(r => r.deg === 'ない').map(r => r.id),
}, null, 1));
