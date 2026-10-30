#!/usr/bin/env node
// 担当A の報告（uiref-A-jpapps.md）の数を道具で数える（QUALITY 6.2-2。頭の中で数えない）。
// 1. 実例の台帳の行数（章「2. 実例の台帳」の表の本文の行）と、台帳が引く資料（uA-）の数
// 2. 楽しさ・面白さの表の行数（章「3.」）
// 3. P1〜P9 の表：各行の「効く実例」の番号の数と「効かない・逆効果」の数
// 4. 開いた画像の一覧（章「開いた画像の一覧」）の数と、各ファイルが実在するか
// 5. 資料の種類（読了ノート uA-* を名前の頭で分類）と、1種類が半分を超えるか
// 使い方：node boki2/docs/analysis/uiref-A-count.js
const fs = require('fs');
const path = require('path');
const REP = path.join(__dirname, 'uiref-A-jpapps.md');
const NOTES = path.join(__dirname, '..', '..', 'research', 'notes', 'web', 'uiref');
const RAW = path.join(__dirname, '..', '..', 'research', 'raw', 'web', 'uiref');
const SHOTS = '/tmp/claude-0/-home-user-progate-school/2ed2d185-9667-561f-833a-47fa8a0986df/scratchpad';
const s = fs.readFileSync(REP, 'utf8');
const section = (re) => { const m = s.match(new RegExp(`^## ${re}.*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'm')); return m ? m[1] : ''; };
const rows = (txt) => txt.split('\n').filter((l) => /^\|/.test(l)).slice(2).filter((l) => !/^\|\s*-/.test(l));

const ledger = rows(section('2\\. 実例の台帳'));
const ids = ledger.map((l) => l.split('|')[1].trim());
const docs = new Set([...section('2\\. 実例の台帳').matchAll(/\[\[web:uiref:(uA-[\w-]+)\|/g)].map((m) => m[1]));
console.log(`実例の台帳：${ledger.length} 行（番号 ${ids[0]}〜${ids[ids.length - 1]}、重なり ${ids.length - new Set(ids).size}）`);
console.log(`台帳が出典に引く資料（uA-）：${docs.size} 本`);
const emptyCols = ledger.map((l, i) => [ids[i], l.split('|').slice(1, -1).map((c) => c.trim())]).filter(([, c]) => c.some((x, j) => !x && j !== 10)); // 列10（段）は使えなければ空でよい
console.log(`台帳で「段」以外の列が空の行：${emptyCols.length}${emptyCols.length ? '（' + emptyCols.map(([i]) => i).join('・') + '）' : ''}`);

const fun = rows(section('3\\. 楽しさ'));
console.log(`楽しさ・面白さの表：${fun.length} 行（因果の矢印「→」が2つ以上の行 ${fun.filter((l) => (l.match(/→/g) || []).length >= 2).length}）`);

const P = rows(section('4\\. オーナーの困りごと'));
for (const l of P) {
  const c = l.split('|').map((x) => x.trim());
  const good = new Set((c[2].match(/A\d+/g) || [])); const bad = new Set((c[3].match(/A\d+|声|反対/g) || []));
  console.log(`  ${c[1].slice(0, 12)}：効く実例 ${good.size}、効かない・逆効果 ${bad.size}`);
}

const imgSec = section('開いた画像の一覧');
const imgs = rows(imgSec).map((l) => l.split('|')[2].trim().replace(/`/g, ''));
const exists = (f) => [path.join(RAW, f), path.join(SHOTS, 'shots', f), path.join(SHOTS, 'crops', f)].some((p) => fs.existsSync(p));
const ours = imgs.filter((f) => /^(sheet\d|w\d\d)/.test(f));
console.log(`開いた画像：${imgs.length} 枚（うち我々の画面 ${ours.length}、参考の画面 ${imgs.length - ours.length}）。手元にないファイル：${imgs.filter((f) => !exists(f)).join('・') || 'なし'}`);

const kind = (d) => /^uA-applion-/.test(d) ? '利用者の声' : /^uA-(uip|uipcat|uipocket|gp)-/.test(d) ? '作品の画面' : /^uA-dads-/.test(d) ? '研究・ガイドライン' : /^uA-(gmark|prt)-/.test(d) ? '作り手・評者の話' : 'その他';
const notes = fs.readdirSync(NOTES).filter((f) => /^uA-.*\.md$/.test(f)).map((f) => f.replace(/\.md$/, ''));
const byKind = {}; notes.forEach((d) => (byKind[kind(d)] = (byKind[kind(d)] || 0) + 1));
console.log(`読了ノート（uA-）：${notes.length} 本`);
for (const [k, n] of Object.entries(byKind)) console.log(`  - ${k}：${n} 本（${Math.round((n / notes.length) * 100)}%）${n / notes.length > 0.5 ? ' ← 半分を超える' : ''}`);
console.log(`資料の種類：${Object.keys(byKind).length}`);
