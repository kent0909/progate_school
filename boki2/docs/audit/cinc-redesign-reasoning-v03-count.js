#!/usr/bin/env node
// 論証の検査役 R-D の数えるスクリプト（版0.3 の検査）。使い方：node boki2/docs/audit/cinc-redesign-reasoning-v03-count.js
// 1. 設計書 DESIGN-CINC-REBUILD 版0.3 の検査の対象を章から数え、期待の ID を作る
//    主：要点 Y・うまくいく理由 U・うまくいかない理由 N・論証の表 A・Tn.2 の仕組み T・オーナーへの問い Q・大胆の数 D36・最小 M・捨てる S
//    足し（取りまとめ役の依頼2）：1.2 の鎖 C・9章 H・10章 X・台帳 #14〜#35 L・5列の表 F・PEDAGOGY の表 P・大胆の行 B
//    検査書 cinc-redesign-reasoning-v03.md の判定の表（<!-- VERDICTS -->）に全部の ID があるか、判定と印を数える
// 2. 19章の R-D の41行への私の確かめ（<!-- RD41 -->）が41行そろうか、結果を数える
// 3. 支配的な手の割合を設計者の出力から読み直す（一杯と看板を選んだ組の中の一杯の割合）
// 4. オーナーに見せる大胆な形の数「36」の中身
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const DS = fs.readFileSync(path.join(ROOT, 'docs/DESIGN-CINC-REBUILD.md'), 'utf8'), D = DS.split('\n');
const RP = path.join(ROOT, 'docs/audit/cinc-redesign-reasoning-v03.md');
const R = fs.existsSync(RP) ? fs.readFileSync(RP, 'utf8') : '';
let errors = 0; const out = (s) => console.log(s);
const sec = (re, stop = /^## /) => { const i = D.findIndex((l) => re.test(l)); if (i < 0) return []; let j = i + 1; while (j < D.length && !stop.test(D[j])) j++; return D.slice(i + 1, j); };
const numbered = (s) => s.filter((l) => /^\d+\. /.test(l)).length;
const bullets = (s) => s.filter((l) => /^- /.test(l)).length;
const rows = (s) => s.filter((l) => /^\| /.test(l) && !/^\|[-| ]+\|$/.test(l)).length - 1;
const ids = []; const add = (p, n, sep = '') => { for (let i = 1; i <= n; i++) ids.push(`${p}${sep}${i}`); return n; };
out('== 1. 検査の対象（設計書 版0.3 から数えた）');
const main = [];
main.push(['Y 要点', add('Y', numbered(sec(/^## 0\. 要点/)))]);
main.push(['U うまくいく理由', add('U', numbered(sec(/^## 7\. うまくいく理由/)))]);
main.push(['N うまくいかない理由', add('N', numbered(sec(/^## 8\. うまくいかない理由/)))]);
main.push(['A 論証の表の行', add('A', rows(sec(/^## 16\. 論証の表/)))]);
let tsum = 0;
for (let k = 1; k <= 10; k++) { let n = numbered(sec(new RegExp(`^#### T${k}\\.2 `), /^#{2,4} /)); if (n === 0) n = 3; tsum += n; add(`T${k}-`, n); }
main.push(['T 見直した仕組み（Tn.2。T3.2・T9.2 は3つずつに分けた）', tsum]);
const qs = ['Q1', 'Q2', 'Q3a', 'Q3b', 'Q4', 'Q5', 'Q6']; ids.push(...qs); main.push(['Q オーナーへの問いの推奨', qs.length]);
const T79 = DS.split('<!-- T79 -->')[1].split('<!-- /T79 -->')[0].split('\n').filter((l) => /^\| [A-Z]/.test(l) && !/^\| ID/.test(l)).map((l) => l.split('|').map((c) => c.trim())).map((c) => ({ id: c[1], dec: c[4], body: c[6], bad: c[9] }));
const mini = T79.filter((r) => r.dec === '最小の形で足りる').map((r) => r.id), drop = T79.filter((r) => r.dec === '捨てる').map((r) => r.id);
ids.push('D36'); mini.forEach((m) => ids.push(`M-${m}`)); drop.forEach((m) => ids.push(`S-${m}`));
main.push(['D36・M 最小・S 捨てる', 1 + mini.length + drop.length]);
const mainN = ids.length;
for (const [k, n] of main) out(`  ${k}: ${n}`);
out(`  主の合計: ${mainN}`);
const extra = [];
extra.push(['C 1.2 の因果の鎖', add('C', bullets(sec(/^### 1\.2 /, /^##/)))]);
extra.push(['H 9章 反証と限界', add('H', bullets(sec(/^## 9\. 反証と限界/)))]);
extra.push(['X 10章 捨てた案', add('X', rows(sec(/^## 10\. 捨てた案/)))]);
const ledger = (DS.split('## 11. 簡略化の台帳')[1] || '').split('## 12.')[0].split('\n').filter((l) => /^\| \d+ \|/.test(l)).map((l) => +l.split('|')[1].trim()).filter((n) => n >= 14);
ledger.forEach((n) => ids.push(`L${n}`)); extra.push(['L 台帳 #14〜', ledger.length]);
let fsum = 0; for (let k = 1; k <= 10; k++) { const n = rows(sec(new RegExp(`^#### T${k}\\.4 `), /^#{2,4} /)); fsum += n; add(`F${k}-`, n); }
extra.push(['F 5列の表の行（Tn.4）', fsum]);
extra.push(['P PEDAGOGY との突き合わせの表', add('P', rows(sec(/^## 5\. PEDAGOGY/)))]);
const bold = T79.filter((r) => r.dec === '大胆な形を採る'); bold.forEach((r) => ids.push(`B-${r.id}`)); extra.push(['B 大胆の行', bold.length]);
for (const [k, n] of extra) out(`  ${k}: ${n}`);
out(`  足しの合計: ${ids.length - mainN}　総計: ${ids.length}`);
if (R) {
  const vt = R.includes('<!-- VERDICTS -->') ? R.split('<!-- VERDICTS -->')[1].split('<!-- /VERDICTS -->')[0] : '';
  const vr = vt.split('\n').filter((l) => /^\| [A-Z]/.test(l) && !/^\| ID/.test(l)).map((l) => l.split('|').map((c) => c.trim()));
  const got = new Map(vr.map((c) => [c[1], c]));
  const miss = ids.filter((i) => !got.has(i)), ext = [...got.keys()].filter((k) => !ids.includes(k));
  const tally = (list) => { const c = { 妥当: 0, 弱い: 0, 不当: 0 }; for (const i of list) { const m = ((got.get(i) || [])[5] || '').match(/妥当|弱い|不当/); if (m) c[m[0]]++; } return c; };
  const bad = [...got].filter(([, c]) => !/妥当|弱い|不当/.test(c[5] || '')).map(([k]) => k);
  const noMark = vr.filter((c) => !/【確かめた|【問い】/.test(`${c[6] || ''}${c[7] || ''}`)).map((c) => c[1]);
  out(`== 判定の表：${got.size} 行、欠け ${miss.length}（${miss.join(' ') || 'なし'}）、余分 ${ext.length}（${ext.join(' ') || 'なし'}）、判定のない行 ${bad.length}、印のない行 ${noMark.length}（${noMark.join(' ') || 'なし'}）`);
  const tm = tally(ids.slice(0, mainN)), te = tally(ids.slice(mainN)), ta = tally(ids);
  out(`   主 ${mainN}：妥当 ${tm['妥当']}／弱い ${tm['弱い']}／不当 ${tm['不当']}`);
  out(`   足し ${ids.length - mainN}：妥当 ${te['妥当']}／弱い ${te['弱い']}／不当 ${te['不当']}`);
  out(`   総計 ${ids.length}：妥当 ${ta['妥当']}／弱い ${ta['弱い']}／不当 ${ta['不当']}`);
  for (const v of ['不当', '弱い']) out(`   ${v}：${ids.filter((i) => ((got.get(i) || [])[5] || '').includes(v)).join(' ')}`);
  if (miss.length || ext.length || bad.length || noMark.length) errors++;
  // 2. 41行の確かめ
  const rt = R.includes('<!-- RD41 -->') ? R.split('<!-- RD41 -->')[1].split('<!-- /RD41 -->')[0] : '';
  const rr = rt.split('\n').filter((l) => /^\| [A-Z]/.test(l) && !/^\| 番号/.test(l)).map((l) => l.split('|').map((c) => c.trim()));
  const rd = (DS.split('<!-- RD -->')[1] || '').split('<!-- /RD -->')[0].split('\n').filter((l) => /^\| [A-Z]/.test(l) && !/^\| 番号/.test(l)).map((l) => l.split('|')[1].trim());
  const rmiss = rd.filter((i) => !rr.some((c) => c[1] === i));
  const res = {}; for (const c of rr) { const k = (c[3] || '').replace(/[（(].*$/, ''); res[k] = (res[k] || 0) + 1; }
  out(`== 2. 19章の R-D の行 ${rd.length}、私の確かめ ${rr.length} 行、欠け ${rmiss.length}（${rmiss.join(' ') || 'なし'}）。結果 ${JSON.stringify(res)}`);
  if (rmiss.length || rr.length !== rd.length) errors++;
}
// 3. 支配的な手の読み直し
out('== 3. 支配的な手（設計者の出力を読み直す）');
const A = path.join(ROOT, 'docs/analysis');
for (const f of ['cinc-redesign-dominance-bowl.out.txt', 'cinc-redesign-dominance-bowl2.out.txt', 'cinc-redesign-dominance-bowl3.out.txt']) {
  for (const l of fs.readFileSync(path.join(A, f), 'utf8').split('\n')) {
    const m = l.match(/^\s+(.+?)：最良の手の種類 (\{[^}]*\})\s+最良の一杯 (\S+) (\d+)\/(\d+)/); if (!m) continue;
    const kinds = JSON.parse(m[2]), tot = Object.values(kinds).reduce((s, x) => s + x, 0), maxK = Math.max(...Object.values(kinds)), fmt = kinds.format || 0;
    out(`  ${m[1]}：手の種類の最大 ${maxK}/${tot}（${Math.round(100 * maxK / tot)}%）、一杯と看板を選んだ組 ${fmt} のうち最良の一杯 ${m[3]} ${m[4]}/${m[5]}（${Math.round(100 * m[4] / m[5])}%）、種類と一杯の組の最大（60組の中）${m[4]}/${tot}（${Math.round(100 * m[4] / tot)}%）`);
  }
}
const th = fs.readFileSync(path.join(A, 'cinc-redesign-thick.out.txt'), 'utf8');
const val = (re) => { const m = th.match(re); return m ? +m[1] : null; };
const now = val(/いまの式：[^\n]*累計の中央値 (-?\d+)万円/), see = val(/社長が2店を見る[^\n]*累計の中央値 (-?\d+)万円/), mgr = val(/店長を雇う[^\n]*累計の中央値 (-?\d+)万円/), thick = val(/法人で厚く[^\n]*累計の中央値 (-?\d+)万円/);
out(`  2号店の人（72か月の会社の累計の中央値）：いまの式 ${now}・社長が2店を見る ${see}・店長 ${mgr}・厚く ${thick} 万円`);
out(`  Q5 (c) で「社長が2店を見る」を店長に並ばせるのに要る損：${see}−(${mgr})＝${see - mgr}万円（72か月）＝月 ${((see - mgr) / 72).toFixed(1)}万円。そのとき最良の道の累計は ${mgr}万円（出さない＝0 より下）`);
// 4. 36 の中身
out('== 4. 「別々の、小さくしていない大胆な形 36」の中身');
const base = bold.filter((r) => /小$/.test(r.id)).map((r) => r.id), dup = ['V2', 'V9', 'V18', 'V26', 'V28'], red = ['R7', 'L3大', 'L7大', 'L10大', 'L12大', 'V1', 'V13', 'V20', 'V24', 'V33'];
const s36 = bold.map((r) => r.id).filter((i) => !base.includes(i) && !dup.includes(i) && !red.includes(i));
out(`  36：${s36.length}（${s36.join(' ')}）`);
const ext3 = ['P1', 'L2大', 'V7']; // 設計書自身が「今の延長」と書く
const umbrella = ['P4', 'P5', 'R1']; // 他の行の束ね（P4＝T3 と町の外、P5＝R13・L10大・L12大、R1＝6層の並び）【推論：私の読み】
const overlap = ['L5大', 'V32', 'E1', 'E3']; // L5大・V32 は R6（T4 の方針の札）と同じ仕組み、E1 は R8 と同じ文、E3 は V21 の議案と否決【推論】
const test = ['E2']; // 形でなく検査
const left = s36.filter((i) => ![...ext3, ...umbrella, ...overlap, ...test].includes(i));
out(`  36−延長3（${ext3.join(' ')}）＝${s36.length - 3}。さらに束ね3・重なり4・検査1を引くと ${left.length}（${left.join(' ')}）【推論：束ねと重なりは私の読み】`);
out(`エラー ${errors}`);
process.exitCode = errors ? 1 : 0;
