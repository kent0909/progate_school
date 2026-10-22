#!/usr/bin/env node
// BIZ-GROWTH.md の出典を数える（資料の種類ごとの本数）と、自己点検の表（資料ごとの原文の箇所と報告の行）を出す。
// Usage: node boki2/docs/analysis/bizgrowth-sources.js          → 資料の内訳の表
//        node boki2/docs/analysis/bizgrowth-sources.js --lines  → 自己点検の表
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const rep = fs.readFileSync(path.join(ROOT, 'docs', 'BIZ-GROWTH.md'), 'utf8').split('\n');
const cites = new Map(); // key src:coll:doc -> {lines:Set}
rep.forEach((l, i) => {
  for (const m of l.matchAll(/\[\[([\w-]+):([\w-]+):([^\]\s|]+)\|「[^」]+」\]\]/g)) {
    const k = `${m[1]}:${m[2]}:${m[3]}`;
    if (!cites.has(k)) cites.set(k, new Set());
    cites.get(k).add(i + 1);
  }
});
const type = (doc) => {
  if (/jfa-soudan/.test(doc)) return '利用者の声（の代わり：協会の相談件数）';
  if (/jfa-/.test(doc)) return '実務者・業界（FCの法定開示書面・協会の一覧）';
  if (/jpx-|mhlw-|jfc-shoukei/.test(doc)) return '一次資料・統計（取引所の規則・官庁と公庫の調査）';
  if (/jfc-panel2016|arxiv/.test(doc)) return '研究（論文）';
  if (/wiki-/.test(doc)) return '入口（ウィキペディア。根拠にせず有報で確かめ直した）';
  if (/yuho|q3-|ipo|setsumei|tanshin/.test(doc)) return '事例（会社の一次資料：有報・四半期報告書・決算説明資料・決算短信・取引所の上場資料）';
  return '分類なし';
};
const noteOf = (src, coll, doc) => {
  const p = path.join(ROOT, 'research', 'notes', src, coll, `${doc}.md`);
  if (!fs.existsSync(p)) return null;
  const t = fs.readFileSync(p, 'utf8');
  const read = (t.match(/^read: (.*)$/m) || [])[1] || '';
  const pages = (t.match(/^pages: (.*)$/m) || [])[1] || '';
  return { read, pages };
};
const base = (doc) => doc.split('#')[0];
if (process.argv.includes('--lines')) {
  console.log('| 資料（src:coll:doc） | 原文の該当箇所（読了ノートの read と pages） | この報告で引いた行 |');
  console.log('|---|---|---|');
  for (const [k, ls] of [...cites].sort()) {
    const [s, c, d] = k.split(':');
    const n = noteOf(s, c, d);
    const where = n ? (n.read === 'full' ? '全文' : `一部：${n.pages}`) : '（読了ノートなし）';
    console.log(`| ${k} | ${where.replace(/\|/g, '／')} | ${[...ls].join(', ')} |`);
  }
  process.exit(0);
}
const byType = new Map();
const seen = new Set();
for (const k of cites.keys()) {
  const [, , d] = k.split(':');
  const b = base(d);
  if (seen.has(b)) continue; // 同じ原文の別ノートは1本
  seen.add(b);
  const t = type(b);
  if (!byType.has(t)) byType.set(t, []);
  byType.get(t).push(b);
}
const total = seen.size;
console.log('| 種類 | 本数 | 割合 | 資料 |');
console.log('|---|---|---|---|');
for (const [t, ds] of [...byType].sort((a, b) => b[1].length - a[1].length)) console.log(`| ${t} | ${ds.length} | ${(100 * ds.length / total).toFixed(1)}% | ${ds.join('、')} |`);
console.log(`| 合計（原文の数） | ${total} | 100% | |`);
const companyTypes = [...byType.keys()].filter((t) => !/入口|分類なし/.test(t));
console.log(`\n依頼の7種類のうち出てきた種類：${companyTypes.length}（入口を除く）`);
