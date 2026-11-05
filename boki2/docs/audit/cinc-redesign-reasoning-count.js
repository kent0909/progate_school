#!/usr/bin/env node
// 論証の検査役 R-D の数えるスクリプト（BRIEF-CINC-REDESIGN-AUDIT の R-D の基準 1・2）。
// 使い方：node boki2/docs/audit/cinc-redesign-reasoning-count.js
// 1. 設計書 DESIGN-CINC-REBUILD の検査の対象の結論を章から数え、期待の ID の一覧を作る
//    （要点 Y・うまくいく理由 U・うまくいかない理由 N・論証の表 A・各主題の「見直した仕組み」T・オーナーへの問い Q・
//     79行の「大胆61」D61・最小と捨てるの13行 M/S）。検査書の判定の表（<!-- VERDICTS -->）に全部の ID があるか、判定を数える
// 2. 79行の「大胆な形を採る」61行の中身：土台の行・他の行の参照だけの行・台帳で一部を小さくした行
// 3. T1 の年ごとの分の表から、1周の長さを足し上げる（設計書は足していない）
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const DS = fs.readFileSync(path.join(ROOT, 'docs/DESIGN-CINC-REBUILD.md'), 'utf8');
const D = DS.split('\n');
const RP = path.join(ROOT, 'docs/audit/cinc-redesign-reasoning.md');
const R = fs.existsSync(RP) ? fs.readFileSync(RP, 'utf8') : '';
let errors = 0; const out = (s) => console.log(s);
const sec = (re, stop = /^## /) => { const i = D.findIndex((l) => re.test(l)); if (i < 0) return []; let j = i + 1; while (j < D.length && !stop.test(D[j])) j++; return D.slice(i + 1, j); };
const numbered = (s) => s.filter((l) => /^\d+\. /.test(l)).length;
const rows = (s) => s.filter((l) => /^\| /.test(l) && !/^\|[-| ]+\|$/.test(l)).length - 1;
const ids = [];
const add = (p, n) => { for (let i = 1; i <= n; i++) ids.push(`${p}${i}`); return n; };
out('== 1. 検査の対象の結論の数（設計書から数えた）');
out(`  Y 要点: ${add('Y', numbered(sec(/^## 0\. 要点/)))}`);
out(`  U うまくいく理由: ${add('U', numbered(sec(/^## 7\. うまくいく理由/)))}`);
out(`  N うまくいかない理由: ${add('N', numbered(sec(/^## 8\. うまくいかない理由/)))}`);
out(`  A 論証の表の行: ${add('A', rows(sec(/^## 16\. 論証の表/)))}`);
let tsum = 0;
for (let k = 1; k <= 10; k++) {
  let n = numbered(sec(new RegExp(`^#### T${k}\\.2 `), /^#{2,4} /));
  if (n === 0) n = k === 3 ? 3 : k === 9 ? 3 : 0; // T3.2 は年表＋2つの箇条、T9.2 は3つの表（番号の付いた項目がないので検査書で 3 つに分けた）
  tsum += n; for (let i = 1; i <= n; i++) ids.push(`T${k}-${i}`);
}
out(`  T 見直した仕組み（T1〜T10 の Tn.2）: ${tsum}`);
const qs = ['Q1', 'Q2', 'Q3a', 'Q3b', 'Q4']; ids.push(...qs); out(`  Q オーナーへの問いの推奨: ${qs.length}（Q3 は「上場は副目標」と「海外は届いた後」の2つの結論に分けた）`);
// 79行
const T79 = DS.split('<!-- T79 -->')[1].split('<!-- /T79 -->')[0].split('\n').filter((l) => /^\| [A-Z]/.test(l) && !/^\| ID/.test(l)).map((l) => l.split('|').map((c) => c.trim())).map((c) => ({ id: c[1], dec: c[4], body: c[6], bad: c[9] }));
const mini = T79.filter((r) => r.dec === '最小の形で足りる').map((r) => r.id), drop = T79.filter((r) => r.dec === '捨てる').map((r) => r.id);
ids.push('D61'); mini.forEach((m) => ids.push(`M-${m}`)); drop.forEach((m) => ids.push(`S-${m}`));
out(`  D61（大胆61の結論）: 1、M 最小: ${mini.length}（${mini.join(' ')}）、S 捨てる: ${drop.length}（${drop.join(' ')}）`);
out(`  合計: ${ids.length}`);
// 検査書の判定
const vt = R.includes('<!-- VERDICTS -->') ? R.split('<!-- VERDICTS -->')[1].split('<!-- /VERDICTS -->')[0] : '';
const vr = vt.split('\n').filter((l) => /^\| [A-Z]/.test(l) && !/^\| ID/.test(l)).map((l) => l.split('|').map((c) => c.trim()));
const got = new Map(vr.map((c) => [c[1], c[5]]));
const miss = ids.filter((i) => !got.has(i)), extra = [...got.keys()].filter((k) => !ids.includes(k));
const cnt = { 妥当: 0, 弱い: 0, 不当: 0 }; const bad = [];
for (const [k, v] of got) { const m = (v || '').match(/妥当|弱い|不当/); if (m) cnt[m[0]]++; else bad.push(k); }
if (R) {
  out(`== 検査書の判定の表：${got.size} 行、欠け ${miss.length}（${miss.join(' ') || 'なし'}）、余分 ${extra.length}（${extra.join(' ') || 'なし'}）、判定のない行 ${bad.length}（${bad.join(' ') || 'なし'}）`);
  out(`   判定：妥当 ${cnt['妥当']}／弱い ${cnt['弱い']}／不当 ${cnt['不当']}（合計 ${cnt['妥当'] + cnt['弱い'] + cnt['不当']}）`);
  for (const v of ['不当', '弱い']) out(`   ${v}：${[...got].filter(([, x]) => (x || '').includes(v)).map(([k]) => k).join(' ')}`);
  if (miss.length || extra.length || bad.length) errors++;
  // 基準4：逆の結論・直し方の欄の各行に【確かめた】か【問い】
  const noMark = vr.filter((c) => !/【確かめた|【問い】/.test(`${c[6] || ''}${c[7] || ''}`)).map((c) => c[1]);
  out(`   反対の結論・直し方の欄に【確かめた】【問い】の印のない行：${noMark.length}（${noMark.join(' ') || 'なし'}）`);
  if (noMark.length) errors++;
}
// 2. 大胆61の中身
out('== 2. 79行の「大胆な形を採る」の中身');
const bold = T79.filter((r) => r.dec === '大胆な形を採る');
const base = bold.filter((r) => /土台/.test(r.body));
const refOnly = bold.filter((r) => !/土台/.test(r.body) && /^[LRPVE]\d{1,2}[小大]? (と同じ|の)/.test(r.body)); // 例：V9「L3大 の産地との契約」、V18「R5 の書き換えで開く」
const ledger = (DS.split('## 11. 簡略化の台帳')[1] || '').split('## 12.')[0];
const lids = [...new Set(ledger.split('\n').filter((l) => /^\| \d+ \|/.test(l)).map((l) => l.split('|')[2].trim()))];
const reduced = bold.filter((r) => lids.includes(r.id) && !/土台/.test(r.body));
out(`  大胆 ${bold.length}。うち L小 の土台（今の形を残す行）${base.length}（${base.map((r) => r.id).join(' ')}）`);
out(`  中身が他の行の参照だけ（同じ形の二度数え）${refOnly.length}（${refOnly.map((r) => r.id + '→' + r.body.slice(0, 6)).join(' ')}）`);
out(`  別々の大胆な形：${bold.length}−${base.length}−${refOnly.length}＝${bold.length - base.length - refOnly.length}`);
out(`  そのうち台帳で一部を小さくした ID ${reduced.length}（${reduced.map((r) => r.id).join(' ')}）→ 小さくしていない大胆な形 ${bold.length - base.length - refOnly.length - reduced.filter((r) => !refOnly.includes(r)).length}`);
const badRef = bold.filter((r) => /^[A-Z0-9小大]+ と同じ$/.test(r.bad));
out(`  悪い面の欄が他の行の参照だけ ${badRef.length}（${badRef.map((r) => r.id).join(' ')}）`);
// 3. 1周の長さ（T1 の表の分を年で線形に埋める【推論】。決算と静かな月は入れない）
out('== 3. T1 の分の表から1周の長さ（設計書は足していない）');
const pts = { 1: 7.2, 3: 7.55, 5: 8.45, 10: 7.75 }; const xs = Object.keys(pts).map(Number);
const at = (y) => { if (pts[y] != null) return pts[y]; const lo = Math.max(...xs.filter((x) => x < y)), hi = Math.min(...xs.filter((x) => x > y)); return pts[lo] + ((pts[hi] - pts[lo]) * (y - lo)) / (hi - lo); };
let sum = 0; const per = []; for (let y = 1; y <= 10; y++) { per.push(at(y).toFixed(2)); sum += at(y) * 12; }
out(`  年ごとの1か月の分（表の4点を線形に埋めた）：${per.join(' ')}`);
out(`  10期×12か月の合計 ${sum.toFixed(1)} 分＝${(sum / 60).toFixed(2)} 時間（決算・静かな月・新聞を読む時間は入れていない）`);
out(`  DESIGN-RAMEN b.5 の1周 10〜15時間（後半 3〜5分/区切り）の上の端 900 分を越える分：${(sum - 900).toFixed(1)} 分。静かな月（2.75分）1か月で縮む分は 年の平均 ${(sum / 120).toFixed(2)}−2.75＝${(sum / 120 - 2.75).toFixed(2)} 分 → 上の端に収めるには静かな月が ${Math.ceil((sum - 900) / (sum / 120 - 2.75))} か月以上（決算を入れるとさらに多く）`);
const check = [[5, 0.2, 7, 7.2], [5, 0.8, 6, 7.55], [6, 1.2, 5, 8.45], [5, 1.5, 4, 7.75]].map(([d, h, l, v]) => ((d * 45 + h * 60 + l * 15 + 90) / 60).toFixed(2) + (Math.abs((d * 45 + h * 60 + l * 15 + 90) / 60 - v) < 0.001 ? '○' : '✗'));
out(`  表の式の検算：${check.join(' ')}、静かな月 ${((45 + 2 * 15 + 90) / 60).toFixed(2)}`);
out(`エラー ${errors}`);
process.exitCode = errors ? 1 : 0;
