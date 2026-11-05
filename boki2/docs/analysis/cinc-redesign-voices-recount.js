#!/usr/bin/env node
// 設計者 W（DESIGN-CINC-REBUILD 版0.2）：BIZ-COFFEEINC2 の声の数（委任の不満・くり返し・後半の手詰まり・任せる気持ちよさ ほか）を、
// 分類コードの表 coffeeinc2-voices-codes.md（第2版・160件）から自分で数え直す。目隠しの付け直し2回の表（blind・blind2）があれば同じ記号で数える。
// 使い方：node boki2/docs/analysis/cinc-redesign-voices-recount.js
'use strict';
const fs = require('fs'), path = require('path');
const dir = __dirname;
function rows(file) {
  const p = path.join(dir, file); if (!fs.existsSync(p)) return null;
  const out = [];
  for (const l of fs.readFileSync(p, 'utf8').split('\n')) {
    const c = l.split('|').map(s => s.trim());
    if (c.length < 7 || !/^\d+$/.test(c[1])) continue;
    out.push({ n: +c[1], src: c[2], star: c[3], good: c[4].split(/\s+/), bad: c[5].split(/\s+/), when: c[6] || '' });
  }
  return out;
}
const DUP = new Set([142, 149]); // codes.md の頭書き：#142 は #47 と同じ口コミ、#149 は #145 の書き直し
const CODES = { e: '委任が当てにならない', b: 'くり返しの操作', a: '後半の手詰まり', g: '一覧・比較の不足', c: '週の集計の待ち', h: '範囲を広げて（要望）' };
const GOOD = { A: '任せる気持ちよさ', S: '副業・金融の層', I: '没入' };
for (const f of ['coffeeinc2-voices-codes.md', 'coffeeinc2-voices-blind.md', 'coffeeinc2-voices-blind2.md']) {
  const R = rows(f); if (!R) { console.log(f, 'なし'); continue; }
  const uniq = R.filter(r => !DUP.has(r.n));
  console.log(`== ${f}：行 ${R.length}（重複2つを除くと ${uniq.length}）`);
  for (const [k, v] of Object.entries(CODES)) { const hit = uniq.filter(r => r.bad.includes(k)); console.log(`  不満 ${k} ${v}: ${hit.length}  #${hit.map(r => r.n).join(',')}`); }
  for (const [k, v] of Object.entries(GOOD)) { const hit = uniq.filter(r => r.good.includes(k)); console.log(`  褒め ${k} ${v}: ${hit.length}  #${hit.map(r => r.n).join(',')}`); }
  const late = uniq.filter(r => r.good.includes('I') && r.when === '後半'); console.log(`  没入×後半: ${late.length}  #${late.map(r => r.n).join(',')}`);
}
