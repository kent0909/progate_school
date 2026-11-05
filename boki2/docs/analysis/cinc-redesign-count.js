#!/usr/bin/env node
// 設計者 W：DESIGN-CINC-REBUILD.md の形を数える（中身の当否は判定役の役）。
//  1. 79行の決定：ID のそろい（P1〜P5・R1〜R14・L1小〜L12大・V1〜V33・E1〜E3）、決定の4つの言葉、内訳（群ごと）、
//     最小・捨てるの行の理由が4つ（学習効果・面白さ・正しさ・規約）だけか、その ID が簡略化の台帳にあるか、
//     大胆の行に悪い面の欄があるか、DESIGN-RAMEN の変える節と UI の欄が空でないか
//  2. 10の主題の章（T1〜T10）：各章に Tn.1 今の姿／Tn.2 見直した仕組み／Tn.3 2級の論点との結び／Tn.4 5列の表／Tn.5 UI の5つの欄が
//     そろい、中身があるか。5列の表の行の数と、悪い面の欄が空の行
//  3. オーナーへの問いの数と、各問いに選択肢・推奨・推奨の理由・失うもの
//  4. PEDAGOGY との突き合わせの表の行、体験の検討の索引の行（5列の表の行の合計と同じか）
//  5. （版0.2）読んだ範囲の表が DESIGN-RAMEN・DESIGN-UI-IDEAL の全行を隙間なく覆うか、ぶつかりの表と X の突き合わせの表がそろうか
// 使い方：node cinc-redesign-count.js [設計書のパス]
'use strict';
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.join(__dirname, '..', 'DESIGN-CINC-REBUILD.md');
const s = fs.readFileSync(file, 'utf8');
const lines = s.split('\n');
let errs = 0; const err = (m) => { errs++; out.push('エラー：' + m); };
const out = [];
const cells = (l) => l.split('|').slice(1, -1).map((c) => c.trim());
// ---- 1. 79行 ----
const a = s.indexOf('<!-- T79 -->'), b = s.indexOf('<!-- /T79 -->');
if (a < 0 || b < 0) err('79行の表の印がない');
const trows = s.slice(a, b).split('\n').filter((l) => /^\|/.test(l)).slice(2).map(cells);
const want = [];
for (let i = 1; i <= 5; i++) want.push('P' + i);
for (let i = 1; i <= 14; i++) want.push('R' + i);
for (let i = 1; i <= 12; i++) { want.push(`L${i}小`); want.push(`L${i}大`); }
for (let i = 1; i <= 33; i++) want.push('V' + i);
for (let i = 1; i <= 3; i++) want.push('E' + i);
const ids = trows.map((r) => r[0]);
const missing = want.filter((x) => !ids.includes(x)), extra = ids.filter((x) => !want.includes(x));
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
out.push(`79行の表：${trows.length} 行（期待 ${want.length}）。欠け ${missing.length}（${missing.join(' ') || 'なし'}）、余分 ${extra.length}（${extra.join(' ') || 'なし'}）、重複 ${dup.length}（${dup.join(' ') || 'なし'}）`);
if (trows.length !== 79 || missing.length || extra.length || dup.length) err('79行がそろわない');
const DEC = ['大胆な形を採る', '最小の形で足りる', '捨てる', 'オーナーに決めてもらう'];
const REASONS = ['学習効果', '面白さ', '正しさ', '規約'];
// 簡略化の台帳の ID
const ledgerStart = lines.findIndex((l) => /^## .*簡略化の台帳/.test(l));
const ledgerEnd = lines.findIndex((l, i) => i > ledgerStart && /^## /.test(l));
const ledgerRows = lines.slice(ledgerStart, ledgerEnd).filter((l) => /^\|/.test(l)).slice(2).map(cells);
const ledgerIds = new Set(ledgerRows.map((r) => r[1]));
const group = (id) => (id[0] === 'L' ? (id.endsWith('小') ? 'L小' : 'L大') : id[0]);
const tally = {}; const bad = [];
for (const r of trows) {
  const [id, , , dec, reason, body, dr, ui, harm] = r;
  if (!DEC.includes(dec)) { bad.push(`${id}：決定の言葉「${dec}」`); continue; }
  const g = group(id); tally[g] = tally[g] || {}; tally[g][dec] = (tally[g][dec] || 0) + 1;
  tally.all = tally.all || {}; tally.all[dec] = (tally.all[dec] || 0) + 1;
  if (!body || body === '—') bad.push(`${id}：中身が空`);
  if (!dr || dr === '—') bad.push(`${id}：DESIGN-RAMEN の変える節が空`);
  if (!ui) bad.push(`${id}：UI の欄が空`);
  if (dec === '最小の形で足りる' || dec === '捨てる') {
    const rs = (reason || '').split(/[・、]/).map((x) => x.trim()).filter(Boolean);
    if (!rs.length || rs.some((x) => !REASONS.includes(x))) bad.push(`${id}：理由の種類「${reason}」が4つの外`);
    if (!ledgerIds.has(id)) bad.push(`${id}：簡略化の台帳にない`);
  }
  if (dec === '大胆な形を採る' && (!harm || harm === '—')) bad.push(`${id}：大胆なのに悪い面の欄が空`);
}
const fmt = (o) => DEC.map((d) => `${d.replace(/な形を採る|の形で足りる|に決めてもらう/, '')} ${o && o[d] || 0}`).join('／');
out.push(`決定の内訳（全体）：${fmt(tally.all)}（合計 ${DEC.reduce((n, d) => n + ((tally.all || {})[d] || 0), 0)}）`);
for (const g of ['P', 'R', 'L小', 'L大', 'V', 'E']) out.push(`  ${g.padEnd(3, '　')}：${fmt(tally[g])}`);
const listOf = (dec) => trows.filter((r) => r[3] === dec).map((r) => r[0]).join(' ');
out.push(`最小の形で足りる：${listOf('最小の形で足りる')}`);
out.push(`捨てる：${listOf('捨てる')}`);
out.push(`オーナーに決めてもらう：${listOf('オーナーに決めてもらう')}`);
out.push(`簡略化の台帳の行：${ledgerRows.length}（79行の ID を持つ行 ${ledgerRows.filter((r) => want.includes(r[1])).length}）`);
if (bad.length) { bad.forEach((x) => err(x)); }
// ---- 2. 10の主題 ----
const FIELDS = [['1', '今の姿'], ['2', '見直した仕組み'], ['3', '2級の論点との結び'], ['4', '5列の表'], ['5', 'UI']];
let fiveRowsTotal = 0;
for (let n = 1; n <= 10; n++) {
  const st = lines.findIndex((l) => new RegExp(`^## T${n} `).test(l));
  if (st < 0) { err(`T${n} の章がない`); continue; }
  const en = lines.findIndex((l, i) => i > st && /^## /.test(l));
  const sec = lines.slice(st, en < 0 ? lines.length : en);
  const res = [];
  for (const [k, name] of FIELDS) {
    const hs = sec.findIndex((l) => new RegExp(`^#### T${n}\\.${k} .*${name}`).test(l));
    if (hs < 0) { err(`T${n}.${k} ${name} がない`); res.push(`${name}×`); continue; }
    const he = sec.findIndex((l, i) => i > hs && /^#{2,4} /.test(l));
    const body = sec.slice(hs + 1, he < 0 ? sec.length : he).join('\n').trim();
    if (body.length < 60) err(`T${n}.${k} ${name} の中身が短い（${body.length}字）`);
    if (k === '4') {
      const rows = body.split('\n').filter((l) => /^\|/.test(l));
      const head = rows[0] ? cells(rows[0]) : []; const bi = head.findIndex((c) => /悪い面/.test(c));
      const bodyRows = rows.slice(2).map(cells);
      const empty = bodyRows.filter((r) => !r[bi] || /^[-—・なし]*$/.test(r[bi])).length;
      if (bi < 0) err(`T${n}.4 に悪い面の列がない`);
      if (empty) err(`T${n}.4 に悪い面が空の行 ${empty}`);
      if (head.length < 5) err(`T${n}.4 の列が5つ未満`);
      fiveRowsTotal += bodyRows.length;
      res.push(`5列の表 ${bodyRows.length}行（悪い面が空 ${empty}）`);
    } else res.push(`${name} ${body.length}字`);
  }
  out.push(`T${n}：${res.join('／')}`);
}
out.push(`5列の表の行の合計：${fiveRowsTotal}`);
// ---- 3. オーナーへの問い ----
const qs = []; lines.forEach((l, i) => { if (/^### Q\d+ /.test(l)) qs.push(i); });
qs.forEach((qi, j) => {
  const end = j + 1 < qs.length ? qs[j + 1] : lines.findIndex((l, i) => i > qi && /^## /.test(l));
  const body = lines.slice(qi, end).join('\n');
  const opts = (body.match(/^\| \(\w\) /gm) || []).length;
  const ok = [opts >= 2, /推奨の理由/.test(body), /選ばなかった場合に失うもの/.test(body), /（推奨）/.test(body)];
  out.push(`${lines[qi].replace(/^### /, '')}：選択肢 ${opts}、推奨 ${ok[3] ? 'あり' : 'なし'}、推奨の理由 ${ok[1] ? 'あり' : 'なし'}、失うもの ${ok[2] ? 'あり' : 'なし'}`);
  if (ok.includes(false)) err(`${lines[qi]} の欄が欠ける`);
});
out.push(`オーナーへの問い：${qs.length}`);
// ---- 4. PEDAGOGY の表・体験の検討の索引 ----
const tableAfter = (re) => { const st = lines.findIndex((l) => re.test(l)); if (st < 0) return null; const en = lines.findIndex((l, i) => i > st && /^## /.test(l)); return lines.slice(st, en < 0 ? lines.length : en).filter((l) => /^\|/.test(l)).slice(2).map(cells); };
const ped = tableAfter(/^## .*PEDAGOGY との突き合わせ/); out.push(`PEDAGOGY との突き合わせの表：${ped ? ped.length : 0} 行`);
const idx = tableAfter(/^## .*体験の検討/); out.push(`体験の検討の索引：${idx ? idx.length : 0} 行（5列の表の行の合計 ${fiveRowsTotal}）`);
if (!idx || idx.length !== fiveRowsTotal) err('体験の検討の索引の行が5列の表の行の合計と合わない');
// ---- 5. 読んだ範囲とぶつかり（版0.2）----
//  ・<!-- READ --> の表：文書ごとに行の範囲が 1 から文書の最終行までを隙間なく・重ならずに覆うか。ぶつかりの欄が「あり」「なし」か。
//    「あり」の行は K の番号を1つ以上持ち、その K が <!-- CONFLICT --> の表にあるか。
//  ・<!-- CONFLICT --> の表：K が連番か、どの K も READ の「あり」の行から引かれているか、決着と反映先が空でないか、
//    反映先に書いた Tn.k の欄が本文の見出しにあるか。
//  ・<!-- XROWS --> の表：X1〜X42 がそろうか。
const block = (tag) => { const i = s.indexOf(`<!-- ${tag} -->`), j = s.indexOf(`<!-- /${tag} -->`); return i < 0 || j < 0 ? null : s.slice(i, j).split('\n').filter((l) => /^\|/.test(l)).slice(2).map(cells); };
const docsDir = path.join(path.dirname(file));
const docLines = { 'DESIGN-RAMEN': null, 'DESIGN-UI-IDEAL': null };
for (const k of Object.keys(docLines)) { const p = path.join(docsDir, k + '.md'); if (fs.existsSync(p)) { const t = fs.readFileSync(p, 'utf8'); docLines[k] = t.endsWith('\n') ? t.split('\n').length - 1 : t.split('\n').length; } }
const read = block('READ'); const conf = block('CONFLICT'); const xr = block('XROWS');
if (!read) err('READ の表がない');
if (!conf) err('CONFLICT の表がない');
const confIds = conf ? conf.map((r) => r[0]) : [];
const usedK = new Set();
if (read) {
  for (const [doc, n] of Object.entries(docLines)) {
    const rs = read.filter((r) => r[0] === doc).map((r) => ({ r, ab: r[2].split('-').map(Number) }));
    let next = 1, gaps = 0; const per = { あり: 0, なし: 0 };
    for (const { r, ab: [x, y] } of rs) {
      if (x !== next) { gaps++; err(`${doc} の読んだ範囲が ${next} からでなく ${x} から（${r[1]}）`); }
      if (!(y >= x)) err(`${doc} の範囲が逆（${r[2]}）`);
      next = y + 1;
      if (!['あり', 'なし'].includes(r[3])) err(`${doc} ${r[1]} のぶつかりの欄が「${r[3]}」`); else per[r[3]]++;
      const ks = (r[5].match(/K\d+/g) || []);
      if (r[3] === 'あり') { if (!ks.length) err(`${doc} ${r[1]} は「あり」なのに K がない`); ks.forEach((k) => { usedK.add(k); if (!confIds.includes(k)) err(`${k} がぶつかりの表にない`); }); }
    }
    if (n == null) err(`${doc}.md が読めない`); else if (next - 1 !== n) err(`${doc} の読んだ範囲の終わり ${next - 1} が文書の最終行 ${n} と違う`);
    out.push(`読んだ範囲 ${doc}：節 ${rs.length} 行（ぶつかり あり ${per.あり}／なし ${per.なし}）、覆った行 1〜${next - 1}／文書 ${n} 行、隙間 ${gaps}`);
  }
}
if (conf) {
  conf.forEach((r, i) => {
    if (r[0] !== `K${i + 1}`) err(`ぶつかりの表の ${i + 1} 行目が K${i + 1} でない（${r[0]}）`);
    if (!usedK.has(r[0])) err(`${r[0]} がどの「あり」の行からも引かれていない`);
    if (!r[3] || !r[4]) err(`${r[0]} の決着か反映先が空`);
    for (const t of (r[4].match(/T\d+\.\d/g) || [])) { if (!lines.some((l) => l.startsWith(`#### ${t} `))) err(`${r[0]} の反映先 ${t} の見出しがない`); }
  });
  out.push(`ぶつかりの表：${conf.length} 件（${confIds.join(' ')}）`);
}
if (xr) {
  const xs = xr.map((r) => r[0]); const wantX = []; for (let i = 1; i <= 42; i++) wantX.push('X' + i);
  const miss = wantX.filter((x) => !xs.includes(x));
  out.push(`(a-2)・g.6 の X の突き合わせ：${xr.length} 行（欠け ${miss.length}${miss.length ? '：' + miss.join(' ') : ''}）、K のある行 ${xr.filter((r) => /K\d+/.test(r[3])).length}`);
  if (miss.length || xr.length !== 42) err('X の突き合わせが42行そろわない');
} else err('XROWS の表がない');
out.push(`エラー ${errs}`);
console.log(out.join('\n'));
process.exit(errs ? 1 : 0);
