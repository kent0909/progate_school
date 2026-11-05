#!/usr/bin/env node
// 論証の検査役 R-D（cinc-redesign-reasoning.md）：設計者 W の 2号店の坂の出力（--json）を読み直し、
// 設計書の結論「立て直しの手を早く打っても会社の取り戻しは早まらない」「効くのは読んで選ぶ体験で、お金ではない」
// 「2号店の坂は1号店の坂と同じ形」が、同じ数から言えるかを数える。ゲームのファイルも設計者のスクリプトも変えない。
// 使い方：node cinc-redesign-reasoning-slope.js [--json-file <path>]
//   --json-file がなければ docs/analysis/cinc-redesign-site2-slope.js --seeds 0-9 --json を走らせる（約8分）。
'use strict';
const path = require('path'), fs = require('fs'), cp = require('child_process');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
let raw;
const jf = arg('--json-file');
if (jf) raw = fs.readFileSync(jf, 'utf8');
else raw = cp.execFileSync('node', [path.join(__dirname, '../analysis/cinc-redesign-site2-slope.js'), '--seeds', '0-9', '--json'], { maxBuffer: 1 << 30 }).toString();
const J = JSON.parse(raw.slice(raw.indexOf('{')));
const rows = J.rows.filter((r) => r.form !== 'family'); // 設計書の主の数（家族を除く60組）
const key = (r) => `${r.seed}|${r.area}|${r.form}`;
const groups = [...new Set(rows.map(key))];
const out = [];
const P = (s) => out.push(s);
P(`家族を除く組：${groups.length}`);

// 1. 「同じ形」：1号店は赤字の月の数（10 seed×8か月）、2号店も同じ物差し（月の数）で数える
const none = rows.filter((r) => r.kind === 'none');
const s1 = J.store1;
P(`[1] 1号店 開店から8か月の赤字の月：${s1.reduce((s, x) => s + x.loss8, 0)}/${s1.length * 8}`);
P(`[1] 2号店（何もしない） 開いて8か月の赤字の月：${none.reduce((s, x) => s + x.loss8, 0)}/${none.length * 8}`);
P(`[1] 2号店（何もしない） 8か月全部赤字の組：${none.filter((r) => r.loss8 === 8).length}/${none.length}`);
P(`[1] 1号店 8か月全部赤字の seed：${s1.filter((x) => x.loss8 === 8).length}/${s1.length}`);

// 2. 手の選び方は会社のお金を変えるか（組ごとに、手の会社の累計 cumCompany を比べる）
// 手の候補（設計書の「坂の上の手」）：何もしない／改装／一杯と看板9通り、打つ時点 4・6・8か月目の末
const byG = new Map(); for (const r of rows) { const k = key(r); if (!byG.has(k)) byG.set(k, []); byG.get(k).push(r); }
const label = (r) => (r.kind === 'none' ? 'none' : r.kind === 'stick' ? `stick@${r.cardT}` : `${r.strategy}@${r.cardT}`);
const bestKinds = {}; let spreadSum = [], noneBest = 0, payFlip = 0, bestCount = {};
const timingDiff = []; // 同じ手で 4か月目と8か月目の会社の累計の差
for (const [k, rs] of byG) {
  const n = rs.find((r) => r.kind === 'none');
  const sorted = rs.slice().sort((a, b) => b.cumCompany - a.cumCompany);
  const b = sorted[0];
  const kind = b.kind; bestKinds[kind] = (bestKinds[kind] || 0) + 1;
  const bl = b.kind === 'format' ? b.strategy.split(':').slice(1).join(':') : b.kind; bestCount[bl] = (bestCount[bl] || 0) + 1;
  if (b.kind === 'none' || b.kind === 'stick') noneBest++;
  spreadSum.push(b.cumCompany - sorted[sorted.length - 1].cumCompany);
  if (n.payCompany == null && rs.some((r) => r.payCompany != null)) payFlip++;
  for (const st of new Set(rs.filter((r) => r.cardT != null).map((r) => r.strategy))) {
    const a4 = rs.find((r) => r.strategy === st && r.cardT === 22), a8 = rs.find((r) => r.strategy === st && r.cardT === 26);
    if (a4 && a8) timingDiff.push(a4.cumCompany - a8.cumCompany);
  }
}
const med = (a) => { const b = a.slice().sort((x, y) => x - y); return b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2; };
P(`[2] 組ごとに会社の累計（72か月）が最大の手の種類：${JSON.stringify(bestKinds)}（何もしない・粘るが最大の組 ${noneBest}/${groups.length}）`);
P(`[2] 最大の一杯と看板の組み合わせの内訳（9通りのうちどれが最良か）：${JSON.stringify(bestCount)}`);
P(`[2] 組ごとの手の最良と最悪の会社の累計の差 中央値 ${Math.round(med(spreadSum))}円`);
P(`[2] 何もしないと会社の取り戻しが来ないが、どれかの手で来る組：${payFlip}/${groups.length}`);
P(`[2] 同じ手を4か月目の末と8か月目の末に打ったときの会社の累計の差（4か月−8か月）中央値 ${Math.round(med(timingDiff))}円、正の割合 ${timingDiff.filter((x) => x > 0).length}/${timingDiff.length}`);

// 3. 来ない組を中央値から外すと、手の効きが見えなくなるか（生存の偏り）
for (const [lab, f] of [['何もしない', (r) => r.kind === 'none'], ['改装@8', (r) => r.kind === 'renovate' && r.cardT === 26], ['改装@4', (r) => r.kind === 'renovate' && r.cardT === 22]]) {
  const x = rows.filter(f); const come = x.filter((r) => r.payCompany != null);
  // 来ない組を72か月より後（73）と置いた中央値
  const withCens = x.map((r) => (r.payCompany == null ? 73 : r.payCompany));
  P(`[3] ${lab}：来た組 ${come.length}/${x.length}、来た組だけの中央値 ${med(come.map((r) => r.payCompany))}、来ない組を73と置いた中央値 ${med(withCens)}`);
}
// 一杯と看板の最良（組ごとに9通りの最大）を時点ごとに
for (const ct of [22, 24, 26]) {
  const best = []; for (const [k, rs] of byG) { const f = rs.filter((r) => r.kind === 'format' && r.cardT === ct).sort((a, b) => b.cumCompany - a.cumCompany); best.push(f[0]); }
  const withCens = best.map((r) => (r.payCompany == null ? 73 : r.payCompany));
  P(`[3] 一杯と看板の最良@${ct - 18}か月目：来た組 ${best.filter((r) => r.payCompany != null).length}/${best.length}、来ない組を73と置いた中央値 ${med(withCens)}`);
}
// 4. seed ごとに最良の手の種類（町を読んで選ぶ判断があるか）
const bySeed = {}; for (const [k, rs] of byG) { const s = k.split('|')[0]; const b = rs.slice().sort((a, c) => c.cumCompany - a.cumCompany)[0]; (bySeed[s] = bySeed[s] || []).push(label(b)); }
for (const s of Object.keys(bySeed)) P(`[4] seed ${s}：組ごとの最良の手 ${bySeed[s].join(' / ')}`);
// 5. 手の効き（何もしないとの差）と、支配的な手（設計書 T7.2-3・k.5 の「1つの選択肢が最適な状態 <70%」に当てる）
{
  const diffBest = [], diffReno = [], bowlBest = {};
  for (const [, rs] of byG) {
    const n = rs.find((r) => r.kind === 'none');
    const b = rs.slice().sort((a, c) => c.cumCompany - a.cumCompany)[0];
    diffBest.push(b.cumCompany - n.cumCompany);
    const r8 = rs.find((r) => r.kind === 'renovate' && r.cardT === 26); diffReno.push(r8.cumCompany - n.cumCompany);
    const bowl = b.strategy.split(':')[1]; bowlBest[bowl] = (bowlBest[bowl] || 0) + 1;
  }
  P(`[5] 組ごとの最良の手と何もしないの会社の累計（72か月）の差 中央値 ${Math.round(med(diffBest))}円（正 ${diffBest.filter((x) => x > 0).length}/${diffBest.length}）`);
  P(`[5] 8か月目の末の改装と何もしないの差 中央値 ${Math.round(med(diffReno))}円（正 ${diffReno.filter((x) => x > 0).length}/${diffReno.length}）`);
  P(`[5] 最良の手の一杯（看板と時点を問わず）：${JSON.stringify(bowlBest)}。最も多い一杯の割合 ${Math.max(...Object.values(bowlBest))}/${byG.size}`);
}
console.log(out.join('\n'));
