#!/usr/bin/env node
// 調査の報告・設計書の質の形を確かめる（決まりは docs/QUALITY.md）。中身の深さは別の担当が判定する。これは形の検査。
// Usage: node boki2/tools/report-check.js [ファイル…]   （省略すると docs/BIZ-*.md と docs/DESIGN-*.md を全部）
// 先頭に <!-- quality:v2 --> がある報告は章が欠けたらエラー。ない報告は「旧形式（未監査）」として一覧に出すだけ。
const fs = require('fs');
const path = require('path');
const D = path.join(__dirname, '..', 'docs');
let files = process.argv.slice(2);
if (!files.length) files = fs.readdirSync(D).filter((f) => /^(BIZ|DESIGN)-.*\.md$/.test(f)).map((f) => path.join(D, f));
const REPORT = ['問いの設計', '資料の内訳', 'うまくいく理由', 'うまくいかない理由', '反証と限界', '捨てた案と理由'];
// 理由の形を変えた棄却の言い回し（2.4）。台帳の行にあれば可
const EASY = /簡単な|簡易|一覧だけ|範囲外|後回し|省く|省略|棚に上げ|固定(?:する|に|で)|手間|作業量|実装が重|今のコード/;
let errs = 0;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const name = path.basename(f);
  const v2 = s.includes('<!-- quality:v2 -->');
  const heads = s.split('\n').filter((l) => /^#{2,3} /.test(l));
  const has = (h) => heads.some((l) => l.includes(h));
  const isDesign = name.startsWith('DESIGN-');
  if (!v2) { console.log(`- ${name}：旧形式（未監査）`); continue; }
  const need = isDesign ? ['簡略化の台帳'] : REPORT;
  const miss = need.filter((h) => !has(h));
  if (miss.length) { errs++; console.log(`✗ ${name}：章がない：${miss.join('・')}`); }
  // 台帳の外にある簡略化の言い回し
  const lines = s.split('\n');
  let inLedger = false; const hits = [];
  lines.forEach((l, i) => {
    if (/^#{2,3} /.test(l)) inLedger = /簡略化の台帳|捨てた案と理由/.test(l);
    if (!inLedger && EASY.test(l) && !/^\s*<!--/.test(l)) hits.push(i + 1);
  });
  if (hits.length) console.log(`△ ${name}：台帳の外に簡略化の言い回し ${hits.length} か所（行 ${hits.slice(0, 12).join(', ')}${hits.length > 12 ? '…' : ''}）。台帳に載せて理由を書くか、言い回しを直す`);
  if (!miss.length) console.log(`✓ ${name}`);
}
process.exit(errs ? 1 : 0);
