#!/usr/bin/env node
// R（論証の検査役）の数えるスクリプト。BRIEF-CINC-REBUILD-AUDIT の R の受け入れの基準 1・2 に使う。
// 使い方：node boki2/docs/audit/cinc-rebuild-reasoning-count.js
// 1. 検査の対象の結論の数（A・B の 要点／うまくいく理由／うまくいかない理由／論証の表、取りまとめ役の要約）を報告から数え、
//    検査書 cinc-rebuild-reasoning.md の結論の表に全部の番号があるかを確かめ、妥当／弱い／不当を数える
// 2. A の79行：項目の文の長さと程度（長い項目ほど「入っている」が付きにくいか＝測り方が「一部」に寄るか）
// 3. A の「逆」5行の出どころの DESIGN-RAMEN の行（同じ行を2度数えていないか）
// 4. B の生の出力：2号店の8か月の赤字を、1号店の開店から同じ月数の赤字と比べる（立ち上がりの坂か）
// 5. B の生の出力：ライバルの要因の大きさを閾値を変えて数える。暦・天気の要因と比べる
// B の analyze.js は使わない（生の out/*.json.gz を直接読む）。
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = path.resolve(__dirname, '..', '..');           // boki2/
const A = fs.readFileSync(path.join(ROOT, 'docs/analysis/cinc-rebuild-A-design.md'), 'utf8').split('\n');
const B = fs.readFileSync(path.join(ROOT, 'docs/analysis/cinc-rebuild-B-game.md'), 'utf8').split('\n');
const BRIEF = fs.readFileSync(path.join(ROOT, 'docs/BRIEF-CINC-REBUILD-AUDIT.md'), 'utf8');
const RPATH = path.join(ROOT, 'docs/audit/cinc-rebuild-reasoning.md');
const R = fs.existsSync(RPATH) ? fs.readFileSync(RPATH, 'utf8').split('\n') : [];
let errors = 0;
const out = (s) => console.log(s);

// ---------- 1. 結論の数 ----------
function section(lines, re) {
  const i = lines.findIndex((l) => re.test(l));
  if (i < 0) return [];
  let j = i + 1;
  while (j < lines.length && !/^## /.test(lines[j])) j++;
  return lines.slice(i + 1, j);
}
const numbered = (sec) => sec.filter((l) => /^\d+\. /.test(l)).length;
const tableRows = (sec) => sec.filter((l) => /^\| /.test(l) && !/^\|[-| ]+\|$/.test(l)).length - 1; // 見出しの行を引く
const parts = [
  ['A-Y', A, /^## 1\. 要点/, numbered], ['A-U', A, /^## うまくいく理由/, numbered], ['A-N', A, /^## うまくいかない理由/, numbered], ['A-T', A, /^## 論証の表/, tableRows],
  ['B-Y', B, /^## 要点/, numbered], ['B-U', B, /^## うまくいく理由/, numbered], ['B-N', B, /^## うまくいかない理由/, numbered], ['B-T', B, /^## 論証の表/, tableRows],
];
const expected = [];
out('== 1. 検査の対象の結論の数（報告から数えた）');
for (const [p, lines, re, f] of parts) {
  const n = f(section(lines, re));
  out(`  ${p}: ${n}`);
  for (let k = 1; k <= n; k++) expected.push(`${p}${k}`);
}
// 取りまとめ役の要約：依頼書の「判定する対象」の行の「」の中の文
const sumLine = BRIEF.split('\n').find((l) => /取りまとめ役（私）がオーナーに出した要約も対象/.test(l)) || '';
const aPart = sumLine.split('B の要約')[0], bPart = sumLine.split('B の要約')[1] || '';
const qa = [...aPart.matchAll(/「([^」]+)」/g)].map((m) => m[1]), qb = [...bPart.matchAll(/「([^」]+)」/g)].map((m) => m[1]);
out(`  S-A（A の要約の文）: ${qa.length}  ${qa.join(' / ')}`);
out(`  S-B（B の要約の文）: ${qb.length}  ${qb.join(' / ')}`);
qa.forEach((_, k) => expected.push(`S-A${k + 1}`));
qb.forEach((_, k) => expected.push(`S-B${k + 1}`));
out(`  合計（依頼書の対象）: ${expected.length}`);

// 検査書の表を読む：| ID | … | 判定 | の形。判定は 妥当／弱い／不当
const verdictOf = new Map();
for (const l of R) {
  const m = l.match(/^\| (A-[YUNT]\d+|B-[YUNT]\d+|S-[ABH]\d+) \|/);
  if (!m) continue;
  const cells = l.split('|').map((c) => c.trim());
  const v = cells.find((c) => /^\*{0,2}(妥当|弱い|不当)\*{0,2}$/.test(c));
  if (verdictOf.has(m[1])) { out(`  誤り：${m[1]} が2回`); errors++; }
  verdictOf.set(m[1], v ? v.replace(/\*/g, '') : null);
}
if (R.length) {
  const missing = expected.filter((id) => !verdictOf.has(id));
  const noVerdict = [...verdictOf].filter(([, v]) => !v).map(([id]) => id);
  const extra = [...verdictOf.keys()].filter((id) => !expected.includes(id));
  if (missing.length) { out(`  誤り：検査書に無い結論 ${missing.join(' ')}`); errors++; }
  if (noVerdict.length) { out(`  誤り：判定の無い結論 ${noVerdict.join(' ')}`); errors++; }
  const tally = (ids) => { const t = { 妥当: 0, 弱い: 0, 不当: 0 }; ids.forEach((id) => { const v = verdictOf.get(id); if (v) t[v]++; }); return t; };
  const fmt = (t) => `妥当 ${t.妥当}／弱い ${t.弱い}／不当 ${t.不当}（計 ${t.妥当 + t.弱い + t.不当}）`;
  out(`  検査書の表：対象 ${expected.length} のうち ${expected.filter((id) => verdictOf.has(id)).length} 行に判定`);
  out(`  対象の判定：${fmt(tally(expected))}`);
  for (const p of ['A-', 'B-', 'S-A', 'S-B']) out(`    ${p}: ${fmt(tally(expected.filter((id) => id.startsWith(p))))}`);
  if (extra.length) out(`  追加で検査した文（依頼書の対象の外。HANDOFF の要約）：${extra.join(' ')} → ${fmt(tally(extra))}`);
  const bad = [...verdictOf].filter(([, v]) => v !== '妥当').map(([id, v]) => `${id}(${v})`);
  out(`  弱い・不当の一覧：${bad.join(' ')}`);
}

// ---------- 2. A の79行：項目の長さと程度 ----------
out('\n== 2. A の79行：項目の文の長さ（字）と程度');
const aRows = A.filter((l) => /^\| (P\d|R\d|L\d+[小大]|V\d|E\d)/.test(l)).map((l) => {
  const c = l.split('|').map((x) => x.trim());
  return { id: c[1], item: c[2], deg: c[4] };
});
out(`  行数 ${aRows.length}`);
const byDeg = {};
for (const r of aRows) (byDeg[r.deg] ||= []).push(r.item.length);
for (const [d, a] of Object.entries(byDeg)) out(`  ${d}: ${a.length} 行、項目の長さの中央値 ${a.sort((x, y) => x - y)[Math.floor(a.length / 2)]} 字`);
const sorted = [...aRows].sort((x, y) => x.item.length - y.item.length);
const third = Math.ceil(sorted.length / 3);
[['短い', sorted.slice(0, third)], ['中', sorted.slice(third, 2 * third)], ['長い', sorted.slice(2 * third)]].forEach(([n, g]) => {
  const k = g.filter((r) => r.deg === '入っている').length;
  out(`  ${n}の3分の1（${g[0].item.length}〜${g[g.length - 1].item.length}字、${g.length}行）：入っている ${k}（${Math.round((100 * k) / g.length)}%）`);
});
for (const grp of ['R', 'L大']) {
  const g = aRows.filter((r) => (grp === 'R' ? /^R\d/.test(r.id) : /大$/.test(r.id)));
  out(`  ${grp}：項目の長さの中央値 ${g.map((r) => r.item.length).sort((x, y) => x - y)[Math.floor(g.length / 2)]} 字（全79行の中央値 ${sorted[Math.floor(sorted.length / 2)].item.length} 字）、程度 ${['入っている', '一部', '入っていない', '逆'].map((d) => `${d} ${g.filter((r) => r.deg === d).length}`).join('・')}`);
}

// ---------- 3. 逆の行の出どころ ----------
out('\n== 3. A の「逆」の行と、引いた DESIGN-RAMEN の行・引用');
const rev = A.filter((l) => /^\| (R\d+|L\d+大|V\d+) \|/.test(l) && l.split('|')[4].trim() === '逆').map((l) => {
  const c = l.split('|').map((x) => x.trim());
  return { id: c[1], where: c[3], quote: (c[5].match(/`([^`]+)`/) || [])[1] };
});
const byQuote = {};
for (const r of rev) { out(`  ${r.id}: ${r.where.slice(0, 40)} … 引用「${(r.quote || '').slice(0, 30)}」`); (byQuote[r.quote] ||= []).push(r.id); }
const distinct = Object.keys(byQuote).length;
out(`  逆 ${rev.length} 行、引用の異なり ${distinct}（同じ引用：${Object.values(byQuote).filter((a) => a.length > 1).map((a) => a.join('=')).join('、') || 'なし'}）`);
const byLine = {};
for (const r of rev) { const L = (r.where.match(/L(\d+)/) || [])[1]; (byLine[L] ||= []).push(r.id); }
out(`  主に引いた DESIGN-RAMEN の行（節の欄の最初の L）の異なり ${Object.keys(byLine).length}：${Object.entries(byLine).map(([L, a]) => `L${L}=${a.join('・')}`).join('、')}`);

// ---------- 4・5. B の生の出力 ----------
const OUT = path.join(ROOT, 'docs/analysis/cinc-rebuild-B/out');
const load = (f) => JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(OUT, f))).toString());
const files = fs.readdirSync(OUT).filter((f) => f.endsWith('.json.gz'));
const ym = (x) => `${x.y}年目${x.m}月`;

out('\n== 4. 2号店の赤字と、1号店の開店からの同じ月数の赤字（上手の打ち手）');
const site2 = files.filter((f) => /^skilled-site2-/.test(f));
let s2Red = 0, s2All = 0;
const s2N = [];
for (const f of site2) {
  const res = load(f).final.res, ts = Object.keys(res).map(Number).sort((a, b) => a - b);
  const life = ts.filter((t) => res[t].stores && res[t].stores[1] && res[t].stores[1].open !== false && res[t].stores[1].op != null);
  const red = life.filter((t) => res[t].stores[1].op < 0).length;
  s2Red += red; s2All += life.length;
  s2N.push(life.map((t) => Math.round(res[t].stores[1].N)));
  out(`  ${f.replace('.json.gz', '')}: 2号店の営業 ${life.length}か月（${ym(res[life[0]])}〜${ym(res[life[life.length - 1]])}）、赤字 ${red}、客数/日 ${life.map((t) => Math.round(res[t].stores[1].N)).join('→')}`);
}
out(`  2号店の合計：${s2All}か月のうち赤字 ${s2Red}`);
const sk = files.filter((f) => /^skilled-\d+-\d+\.json\.gz$/.test(f));
let r8 = 0, a8 = 0, rAllFirst = [];
for (const f of sk) {
  const res = load(f).final.res, ts = Object.keys(res).map(Number).sort((a, b) => a - b);
  const first = ts.slice(0, s2All / site2.length);
  const red = first.filter((t) => res[t].op < 0).length;
  r8 += red; a8 += first.length;
  rAllFirst.push(`${f.replace('.json.gz', '').replace('skilled-', '')}:${red}`);
}
out(`  1号店（上手の10周、2号店なし）の開店から${s2All / site2.length}か月：${a8}か月のうち赤字 ${r8}（周ごと ${rAllFirst.join(' ')}）`);
{
  // 1号店の客数の立ち上がり（開店の月から8か月）
  const ns = sk.map((f) => { const res = load(f).final.res; return Object.keys(res).map(Number).sort((a, b) => a - b).slice(0, 8).map((t) => Math.round(res[t].N)); });
  out(`  1号店の客数/日（上手10周の開店から8か月、周ごと）：${ns.map((a) => a.join('→')).join(' | ')}`);
}

out('\n== 5. ライバルの要因（factors.rival、人/日）を閾値を変えて数える。39か月の周、打ち方ごとの中央値');
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const ths = [0.01, 0.05, 0.1, 0.5, 1.0];
for (const style of ['idle', 'random', 'skilled']) {
  const fs_ = files.filter((f) => new RegExp(`^${style}-\\d+-\\d+\\.json\\.gz$`).test(f));
  const counts = ths.map(() => []), calWeather = [], months = [];
  for (const f of fs_) {
    const res = load(f).final.res, ts = Object.keys(res).map(Number);
    months.push(ts.length);
    ths.forEach((th, k) => counts[k].push(ts.filter((t) => Math.abs((res[t].factors || {}).rival || 0) >= th).length));
    calWeather.push(ts.filter((t) => Math.abs((res[t].factors || {}).calendar || 0) + Math.abs((res[t].factors || {}).weather || 0) >= 0.1).length);
  }
  out(`  ${style}（${fs_.length}周、月数の中央値 ${median(months)}）：` + ths.map((th, k) => `≥${th}人 ${median(counts[k])}か月`).join('・') + `／暦＋天気の要因 ≥0.1人 ${median(calWeather)}か月`);
}
{
  // 要因の分解で説明できない客数の動き（閉店の月の後など）：|ΔN − total| の大きい月
  let big = [];
  for (const f of files.filter((f) => /^(idle|skilled)-\d+-\d+\.json\.gz$/.test(f))) {
    const res = load(f).final.res, ts = Object.keys(res).map(Number).sort((a, b) => a - b);
    for (let i = 1; i < ts.length; i++) {
      const x = res[ts[i]], p = res[ts[i - 1]];
      if (!x.factors || x.N == null || p.N == null) continue;
      const gap = (x.N - p.N) - (x.factors.total || 0);
      if (Math.abs(gap) >= 3) big.push(`${f.replace('.json.gz', '')}@${ym(x)}:${gap.toFixed(1)}`);
    }
  }
  out(`  （参考）要因の合計と客数の動きの差が3人/日以上の月（放置・上手の20周）：${big.length} 件 ${big.slice(0, 12).join(' ')}`);
}

out(`\nエラー ${errors}`);
process.exitCode = errors ? 1 : 0;
