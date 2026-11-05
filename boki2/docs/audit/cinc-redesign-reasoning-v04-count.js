#!/usr/bin/env node
// 論証の検査役 R-D の数えるスクリプト（版0.4 の検査）。使い方：node boki2/docs/audit/cinc-redesign-reasoning-v04-count.js [--list-changed]
// 1. 設計書 版0.4（作業場のファイル）と版0.3（git の 860b2f3）から、同じ数え方で結論を抜き出す（v03 の検査と同じ種類：主124の種類＋足し163の種類。
//    版0.4 で Q7 が増え、Q5 は「切り分け」を別の結論 Q5c として足す）
// 2. 結論ごとに、版0.3 と文が1字も違わないかを比べる。違わない結論は、版0.3 の検査書（cinc-redesign-reasoning-v03.md）の判定を引き継ぐ
//    （引き継ぎは文が同じことをこのスクリプトが確かめたものだけ）。文が変わった・新しい結論は、版0.4 の検査書（-v04.md）の判定の表に要る
// 3. 判定を数える（引き継ぎと版0.4 の表を合わせて）。19章の R-D v03 の69行のうち私が本文で確かめた行（<!-- SAMPLE -->）の数と結果を数える
// 4. 大胆な形の数（設計書の20）の中身を出す
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..'), REPO = path.resolve(ROOT, '..');
const V4 = fs.readFileSync(path.join(ROOT, 'docs/DESIGN-CINC-REBUILD.md'), 'utf8');
const V3 = cp.execFileSync('git', ['show', '860b2f3:boki2/docs/DESIGN-CINC-REBUILD.md'], { cwd: REPO, maxBuffer: 1 << 26 }).toString();
const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
const R3 = read(path.join(ROOT, 'docs/audit/cinc-redesign-reasoning-v03.md')), R4 = read(path.join(ROOT, 'docs/audit/cinc-redesign-reasoning-v04.md'));
let errors = 0; const out = (s) => console.log(s);
function extract(src) {
  const D = src.split('\n'), m = new Map();
  const sec = (re, stop = /^## /) => { const i = D.findIndex((l) => re.test(l)); if (i < 0) return []; let j = i + 1; while (j < D.length && !stop.test(D[j])) j++; return D.slice(i + 1, j); };
  // 番号つきの項目は、その行から次の番号つきの行（か節の終わり）までの塊を1つの結論の文とする（下の箇条・表の直しも拾う）
  const items = (s, re) => { if (!/\\d/.test(re.source)) return s.filter((l) => re.test(l)); const b = []; for (const l of s) { if (re.test(l)) b.push([l]); else if (b.length) b[b.length - 1].push(l); } return b.map((x) => x.join('\n').trim()); };
  const rows = (s) => s.filter((l) => /^\| /.test(l) && !/^\|[-| ]+\|$/.test(l)).slice(1);
  const put = (p, arr, sep = '') => arr.forEach((t, i) => m.set(`${p}${sep}${i + 1}`, t));
  put('Y', items(sec(/^## 0\. 要点/), /^\d+\. /));
  put('U', items(sec(/^## 7\. うまくいく理由/), /^\d+\. /));
  put('N', items(sec(/^## 8\. うまくいかない理由/), /^\d+\. /));
  put('A', rows(sec(/^## 16\. 論証の表/)));
  for (let k = 1; k <= 10; k++) {
    const s = sec(new RegExp(`^#### T${k}\\.2 `), /^#{2,4} /); const n = items(s, /^\d+\. /);
    if (n.length) put(`T${k}-`, n); else { const all = s.join('\n'); [1, 2, 3].forEach((i) => m.set(`T${k}-${i}`, all)); }
  }
  for (const q of ['Q1', 'Q2', 'Q3a', 'Q3b', 'Q4', 'Q5', 'Q6', 'Q7']) { const s = sec(new RegExp(`^### ${q} `), /^#{2,3} /); if (s.length) m.set(q, s.join('\n')); }
  if (m.has('Q5')) m.set('Q5c', (m.get('Q5').match(/^- \*\*切り分け\*\*.*$/m) || [''])[0] || m.get('Q5'));
  const t79 = src.split('<!-- T79 -->')[1].split('<!-- /T79 -->')[0].split('\n').filter((l) => /^\| [A-Z]/.test(l) && !/^\| ID/.test(l));
  for (const l of t79) { const c = l.split('|').map((x) => x.trim()); if (c[4] === '最小の形で足りる') m.set(`M-${c[1]}`, l); if (c[4] === '捨てる') m.set(`S-${c[1]}`, l); if (c[4] === '大胆な形を採る') m.set(`B-${c[1]}`, l); }
  m.set('D', (src.match(/^10\. \*\*79行の決定\*\*.*$/m) || src.match(/^9\. \*\*79行の決定\*\*.*$/m) || [''])[0]);
  put('C', items(sec(/^### 1\.2 /, /^##/), /^- /));
  put('H', items(sec(/^## 9\. 反証と限界/), /^- /));
  put('X', rows(sec(/^## 10\. 捨てた案/)));
  const led = (src.split('## 11. 簡略化の台帳')[1] || '').split('## 12.')[0].split('\n').filter((l) => /^\| \d+ \|/.test(l));
  for (const l of led) { const n = +l.split('|')[1].trim(); if (n >= 14) m.set(`L${n}`, l); }
  for (let k = 1; k <= 10; k++) put(`F${k}-`, rows(sec(new RegExp(`^#### T${k}\\.4 `), /^#{2,4} /)));
  put('P', rows(sec(/^## 5\. PEDAGOGY/)));
  return m;
}
const m4 = extract(V4), m3 = extract(V3);
// 版0.3 の検査書の判定（ID→判定）。版0.3 の D36 は版0.4 の D に当たる
const vt = (R, tag = 'VERDICTS') => { const t = R.includes(`<!-- ${tag} -->`) ? R.split(`<!-- ${tag} -->`)[1].split(`<!-- /${tag} -->`)[0] : ''; return t.split('\n').filter((l) => /^\| [A-Z]/.test(l) && !/^\| (ID|番号)/.test(l)).map((l) => l.split('|').map((c) => c.trim())); };
const v3 = new Map(vt(R3).map((c) => [c[1] === 'D36' ? 'D' : c[1], c[5]])), v4rows = vt(R4), v4 = new Map(v4rows.map((c) => [c[1], c]));
// 文が同じ結論を探す：同じ ID で同じ文、なければ同じ種類の中で同じ文の ID
const kind = (id) => id.replace(/[-]?\d+$/, '').replace(/-$/, '');
const sameOld = (id) => { const t = m4.get(id); if (m3.get(id) === t) return id; for (const [k, s] of m3) if (s === t && kind(k) === kind(id)) return k; return null; };
const ids = [...m4.keys()];
const changed = [], carried = [];
for (const id of ids) { const o = sameOld(id); if (o && v3.has(o) && !v4.has(id)) carried.push([id, o, v3.get(o)]); else changed.push(id); }
if (process.argv.includes('--list-changed')) { console.log(changed.join(' ')); process.exit(0); }
out('== 1. 検査の対象（設計書 版0.4 から、版0.3 の検査と同じ種類で数えた）');
const byKind = {}; for (const id of ids) { const k = kind(id); byKind[k] = (byKind[k] || 0) + 1; }
out(`  種類ごと：${Object.entries(byKind).map(([k, n]) => `${k} ${n}`).join('・')}　計 ${ids.length}`);
out(`  版0.3 と文が1字も違わず、版0.3 の判定を引き継ぐもの：${carried.length}　文が変わったか新しいもの（版0.4 の表で判定）：${changed.length}`);
const miss = changed.filter((id) => !v4.has(id)), extra = [...v4.keys()].filter((k) => !ids.includes(k));
const noMark = v4rows.filter((c) => !/【確かめた|【問い】/.test(`${c[6] || ''}${c[7] || ''}`)).map((c) => c[1]);
const noV = v4rows.filter((c) => !/妥当|弱い|不当/.test(c[5] || '')).map((c) => c[1]);
out(`== 判定の表（版0.4）：${v4.size} 行、要る行の欠け ${miss.length}（${miss.join(' ') || 'なし'}）、余分 ${extra.length}（${extra.join(' ') || 'なし'}）、判定のない行 ${noV.length}、印のない行 ${noMark.length}（${noMark.join(' ') || 'なし'}）`);
if (miss.length || extra.length || noV.length || noMark.length) errors++;
const verdictOf = (id) => { if (v4.has(id)) return (v4.get(id)[5] || '').match(/妥当|弱い|不当/)?.[0]; const c = carried.find((x) => x[0] === id); return c ? (c[2] || '').match(/妥当|弱い|不当/)?.[0] : null; };
const tally = (list) => { const c = { 妥当: 0, 弱い: 0, 不当: 0 }; for (const i of list) { const v = verdictOf(i); if (v) c[v]++; } return c; };
const main = ids.filter((i) => /^(Y|U|N|A|T|Q|D|M-|S-)/.test(i)), ext = ids.filter((i) => !main.includes(i));
for (const [lab, list] of [['主', main], ['足し', ext], ['総計', ids], ['うち版0.4 の表で判定', changed]]) { const t = tally(list); out(`   ${lab} ${list.length}：妥当 ${t['妥当']}／弱い ${t['弱い']}／不当 ${t['不当']}`); }
for (const v of ['不当', '弱い']) out(`   ${v}：${ids.filter((i) => verdictOf(i) === v).map((i) => (v4.has(i) ? i : `${i}（引き継ぎ）`)).join(' ')}`);
// 3. 69行の抜き取り
const sr = vt(R4, 'SAMPLE');
const rd3 = (V4.split('<!-- RD3 -->')[1] || '').split('<!-- /RD3 -->')[0].split('\n').filter((l) => /^\| [A-Z0-9]/.test(l) && !/^\| 番号/.test(l)).map((l) => l.split('|')[1].trim());
const res = {}; for (const c of sr) { const k = (c[3] || '').replace(/[（(].*$/, ''); res[k] = (res[k] || 0) + 1; }
const notIn = sr.filter((c) => !rd3.includes(c[1])).map((c) => c[1]);
out(`== 3. 19章の R-D v03 の行 ${rd3.length}、私が本文で確かめた行 ${sr.length}（表にない番号 ${notIn.length}：${notIn.join(' ') || 'なし'}）。結果 ${JSON.stringify(res)}`);
if (sr.length < 20 || notIn.length) errors++;
// 4. 大胆な形の数
const t79 = V4.split('<!-- T79 -->')[1].split('<!-- /T79 -->')[0].split('\n').filter((l) => /^\| [A-Z]/.test(l) && !/^\| ID/.test(l)).map((l) => l.split('|').map((c) => c.trim()));
const bold = t79.filter((c) => c[4] === '大胆な形を採る').map((c) => c[1]);
const base = bold.filter((i) => /小$/.test(i)), dup = ['V2', 'V9', 'V18', 'V26', 'V28'], red = ['R7', 'L3大', 'L7大', 'L10大', 'L12大', 'V1', 'V13', 'V20', 'V24', 'V33'];
const ext6 = ['P1', 'L2大', 'V7', 'R9', 'R12', 'L11大'], umb = ['P4', 'P5', 'R1'], ovl = ['L5大', 'V32', 'E1', 'V5', 'E3'], tst = ['E2'];
const s35 = bold.filter((i) => !base.includes(i) && !dup.includes(i) && !red.includes(i));
const s20 = s35.filter((i) => ![...ext6, ...umb, ...ovl, ...tst].includes(i));
out(`== 4. 大胆 ${bold.length}、土台・二度数え・一部を小さくした を引いて ${s35.length}、さらに延長6・束ね3・重なり5・検査1 を引いて ${s20.length}（${s20.join(' ')}）`);
out(`エラー ${errors}`);
process.exitCode = errors ? 1 : 0;
