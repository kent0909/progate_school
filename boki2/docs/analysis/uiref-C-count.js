#!/usr/bin/env node
// 担当 C（見た目の規則と動き）の報告 uiref-C-visual.md の数を道具で数える（QUALITY 6.2-2）。
// Usage: node boki2/docs/analysis/uiref-C-count.js
// 数えるもの：
//  1. 実例の台帳の行（「## 実例の台帳」の表で | C で始まる行）、楽しさの表の行、P1〜P9 の表の行
//  2. 読了ノート uC-*（boki2/research/notes/web/uiref/）を資料の種類ごとに（種類は下の KIND の決め）
//  3. 取った画像（raw の uC-* の png/jpg/gif）と動画（_video）。Read で開いた画像の一覧は報告の「見た画像の一覧」にあり、ここでは行数を数える
//  4. いまの CSS（style.css・sim.css・ramen.css）の font-size の値の種類の数、@keyframes の数、色の変数の数
const fs = require('fs');
const path = require('path');
const B = path.join(__dirname, '..', '..');
const rep = fs.readFileSync(path.join(B, 'docs', 'analysis', 'uiref-C-visual.md'), 'utf8');
const section = (title) => { const m = rep.match(new RegExp('^## .*' + title + '.*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))', 'm')); return m ? m[1] : ''; };
const rows = (s, re) => s.split('\n').filter((l) => re.test(l));
const ledger = rows(section('実例の台帳'), /^\| C\d+ /);
const fun = rows(section('楽しさ・面白さに何が効くか'), /^\| F\d+ /);
const pt = rows(section('オーナーの困りごと'), /^\| P\d /);
const seen = rows(section('見た画像の一覧'), /^\| I\d+ /);
console.log('実例の台帳の行', ledger.length);
console.log('楽しさの表の行', fun.length);
console.log('P1〜P9 の表の行', pt.length);
console.log('見た画像の一覧の行（Read で開いた参考の画像）', seen.length);
// 段の列（取りまとめ役の追加の決まり）：台帳の行ごとの段の値を数える
const stageCol = (() => { const head = section('実例の台帳').split('\n').find((l) => /^\| 番号 /.test(l)); return head ? head.split('|').map((c) => c.trim()).indexOf('段') : -1; })();
if (stageCol > 0) {
  const cnt = {};
  for (const l of ledger) { const v = (l.replace(/\[\[[^\]]*\]\]/g, 'CITE').split('|')[stageCol] || '').trim() || '（空）'; for (const k of v.split(/[・,、\s]+/).filter(Boolean)) cnt[k] = (cnt[k] || 0) + 1; }
  console.log('段の列の値ごとの行数', JSON.stringify(cnt));
}
// 2. ノートの種類
const KIND = {
  work: /^uC-(collectui|muzli-ui-trends|parts|gp)-/,
  creator: /^uC-(duolingo|kirby|muzli-font)/,
  research: /^uC-(juul|hicks|arx|tversky|heer|bateman|wsu|m3)-/,
};
const ND = path.join(B, 'research', 'notes', 'web', 'uiref');
const notes = fs.readdirSync(ND).filter((f) => /^uC-.*\.md$/.test(f)).map((f) => f.replace(/\.md$/, ''));
const byKind = { work: [], creator: [], research: [], other: [] };
for (const n of notes) { const k = Object.keys(KIND).find((x) => KIND[x].test(n)) || 'other'; byKind[k].push(n); }
console.log('読了ノート uC- の数', notes.length);
for (const [k, v] of Object.entries(byKind)) console.log(`  ${k}: ${v.length}  ${v.join(' ')}`);
const total = notes.length;
for (const [k, v] of Object.entries(byKind)) if (v.length * 2 > total) console.log(`  ! ${k} が半分を超える（${v.length}/${total}）`);
console.log('研究・ガイドライン＋作り手の話', byKind.research.length + byKind.creator.length);
// 報告が引く出典の文書の数
const cited = new Set([...rep.matchAll(/\[\[web:uiref:([\w-]+)\|/g)].map((m) => m[1]));
console.log('報告が出典に引く uiref の文書', cited.size);
const uncited = notes.filter((n) => !cited.has(n));
if (uncited.length) console.log('  ノートはあるが報告が引かない文書', uncited.join(' '));
// 3. 取った画像と動画
const RD = path.join(B, 'research', 'raw', 'web', 'uiref');
const raw = fs.readdirSync(RD).filter((f) => /^uC-/.test(f));
const imgs = raw.filter((f) => /\.(png|jpe?g|gif|webp)$/i.test(f));
const vids = raw.filter((f) => /_video\./.test(f));
console.log('取った画像（ページの画面写真を含む）', imgs.length, ' 動画', vids.length);
// 4. いまの CSS
const css = ['style.css', 'sim.css', 'ramen.css'].map((f) => [f, fs.readFileSync(path.join(B, 'css', f), 'utf8')]);
const sizes = new Set(); const sizeCount = {};
let kf = 0; let vars = 0;
for (const [f, s] of css) {
  for (const m of s.matchAll(/font-size:\s*([0-9.]+(?:rem|px|em))/g)) { sizes.add(m[1]); sizeCount[f] = (sizeCount[f] || 0) + 1; }
  kf += (s.match(/@keyframes/g) || []).length;
  const root = s.match(/:root\s*\{([^}]*)\}/); if (root) vars += (root[1].match(/--[\w-]+:/g) || []).length;
}
console.log('CSS の font-size の値の種類', sizes.size, ' 書かれた回数', JSON.stringify(sizeCount));
console.log('CSS の @keyframes', kf, ' 最初の :root の色・寸法の変数', vars);
