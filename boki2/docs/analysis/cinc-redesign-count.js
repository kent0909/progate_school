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
const qs = []; lines.forEach((l, i) => { if (/^### Q\d+[a-z]? /.test(l)) qs.push(i); });
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
// ---- 6. （版0.3）別々の、小さくしていない大胆な形の数（R-D D61・J-D の要点）----
//  大胆の行から、L小（L大 の土台）・中身に【二度数え】の印がある行・簡略化の台帳で一部を小さくした ID（取り下げの行を除く）を引く
{
  const bold = trows.filter((r) => r[3] === '大胆な形を採る');
  const lsmall = bold.filter((r) => /^L\d+小$/.test(r[0]));
  const dbl = bold.filter((r) => /【二度数え/.test(r[5]));
  const reducedIds = new Set(ledgerRows.filter((r) => want.includes(r[1]) && !/取り下げ/.test(r[5] || '')).map((r) => r[1]));
  const reduced = bold.filter((r) => reducedIds.has(r[0]) && !/^L\d+小$/.test(r[0]) && !/【二度数え/.test(r[5]));
  const rest = bold.length - lsmall.length - dbl.length - reduced.length;
  out.push(`別々の、小さくしていない大胆な形：${rest}（大胆 ${bold.length} − L小の土台 ${lsmall.length} − 二度数え ${dbl.length}（${dbl.map((r) => r[0]).join(' ')}） − 台帳で一部を小さくした ${reduced.length}（${reduced.map((r) => r[0]).join(' ')}））`);
  // ---- 6b. （版0.4）名のとおりの数「新しく書いた、別々の、小さくしていない大胆な形」（R-D v03 D36・Y10・2.6）----
  //  上の残りから、さらに次を引く。どれも設計者 W が79行の中身の欄と DESIGN-RAMEN の行を開いて決めた（本文 4章の定義）
  //   延長：DESIGN-RAMEN に同じ仕組みがすでにあり、この設計は中身を足すか食い違いを決着するだけ
  //   束ね：ほかの行の仕組みを並べ直しただけの行
  //   重なり：別の行と同じ仕組み（代表の行だけ数える）
  //   検査：形ではなく検査の約束
  const restIds = bold.filter((r) => !lsmall.includes(r) && !dbl.includes(r) && !reduced.includes(r)).map((r) => r[0]);
  const NAMED = {
    延長: { P1: 'c.4 の1つの財布', L2大: 'e.2 hours・limited（新しいのは席数）', V7: 'e.3 supplier の3択', R9: 'DESIGN-RAMEN L1237「3期比較」を最初から（D17 の決着）', R12: 'L1275「予告したことは必ず起こす」（D18 は言葉の分けの決着）', L11大: 'b.7 付帯目標・i.6 ③「会社を続ける」に項目を足す', R14: '版0.5：A の程度「入」。新しいのは2号店から全店を地図に描くことだけ（J-D v04）', R5: '版0.5：e.5 delegate L773 の理由の書き換えと L1237「全店の一覧と前月比は最初から」のまま（J-D v04）' },
    束ね: { P4: 'T3 の年表＝L3大・L12大 の並べ', P5: 'R13・L10大・L12大 の並べ', R1: '6層＝ほかの行の層の並べ' },
    重なり: { V22: '版0.5：P3 の借りる手の枠（T8.2-2 の1つの枠の規則）と同じ（J-D v04）', L5大: 'R6 と同じ方針の札', V32: 'R6 の欄の1つ（任せる額）', E1: 'R8 と同じ規模の利益', V5: 'R4 と同じ店の断面の席', E3: 'V21 と同じ議案と否決' },
    検査: { E2: '支配的な手の検査の約束' },
  };
  const minus = Object.values(NAMED).flatMap((o) => Object.keys(o));
  const bad = minus.filter((x) => !restIds.includes(x)); if (bad.length) err(`名のとおりの数で引く ID が残りの中に無い：${bad.join(' ')}`);
  const named = restIds.filter((x) => !minus.includes(x));
  out.push(`名のとおりの数（1つの分け方の数。新しく書いた、別々の、小さくしていない大胆な形）：${named.length}（残り ${restIds.length} − ${Object.entries(NAMED).map(([k, o]) => `${k} ${Object.keys(o).length}（${Object.keys(o).join(' ')}）`).join(' − ')}）：${named.join(' ')}`);
}
// ---- 7. （版0.3）判定と検査への対応表が、判定書の指摘とちょうどそろうか ----
{
  const auditDir = path.join(path.dirname(file), 'audit');
  const rd = path.join(auditDir, 'cinc-redesign-reasoning.md'), jd = path.join(auditDir, 'cinc-redesign-fact.md');
  const between = (t, tag) => { const i = t.indexOf(`<!-- ${tag} -->`), j = t.indexOf(`<!-- /${tag} -->`); return i < 0 || j < 0 ? null : t.slice(i, j).split('\n').filter((l) => /^\|/.test(l)).slice(2).map(cells); };
  const cmp = (name, wantIds, rows) => {
    if (!rows) { err(`${name} の対応表がない`); return; }
    const got = rows.map((r) => r[0]); const miss = wantIds.filter((x) => !got.includes(x)), extra = got.filter((x) => !wantIds.includes(x)), dupe = got.filter((x, i) => got.indexOf(x) !== i);
    const empty = rows.filter((r) => !r[2] || !r[3]).map((r) => r[0]);
    const kinds = {}; rows.forEach((r) => { const k = (r[2] || '').replace(/（.*$/, ''); kinds[k] = (kinds[k] || 0) + 1; });
    out.push(`${name} の対応表：${rows.length} 行／指摘 ${wantIds.length}。欠け ${miss.length}${miss.length ? '（' + miss.join(' ') + '）' : ''}・余分 ${extra.length}${extra.length ? '（' + extra.join(' ') + '）' : ''}・重複 ${dupe.length}・扱いか場所が空 ${empty.length}。扱い ${JSON.stringify(kinds)}`);
    if (miss.length || extra.length || dupe.length || empty.length) err(`${name} の対応表が指摘とそろわない`);
  };
  if (fs.existsSync(rd)) {
    const t = fs.readFileSync(rd, 'utf8'); const v = between(t, 'VERDICTS') || [];
    const ids = v.filter((r) => r[4] && r[4] !== '妥当').map((r) => r[0]);
    const mine = between(s, 'RD');
    cmp('R-D（弱い・不当）', ids, mine);
    if (mine) for (const r of mine) { const vv = v.find((x) => x[0] === r[0]); if (vv && vv[4] !== r[1]) err(`R-D ${r[0]} の判定の写しが違う（${r[1]}／${vv[4]}）`); }
  } else err('R-D の検査書が読めない');
  if (fs.existsSync(jd)) {
    const t = fs.readFileSync(jd, 'utf8'); const tl = t.split('\n');
    const F = tl.filter((l) => /^\| F\d+ \|/.test(l)).map((l) => cells(l)[0]);
    const j79 = (between(t, 'J79') || []).filter((r) => /弱い|違う/.test(r[3])).map((r) => 'J79-' + r[0]);
    const jk = (between(t, 'JK') || []).filter((r) => /弱い|違う/.test(r[2])).map((r) => 'JK-' + r[0]);
    const jr = (between(t, 'JREAD') || []).filter((r) => /^見落とし/.test(r[3])).map((r) => 'JREAD-' + r[1]);
    const sec = (h) => { const a = tl.findIndex((l) => l.startsWith(h)); const b = tl.findIndex((l, i) => i > a && /^## /.test(l)); return a < 0 ? [] : tl.slice(a, b < 0 ? tl.length : b); };
    const led = sec('## 6. 簡略化の台帳と言い換え').filter((l) => /^\d+\. /.test(l)).map((l, i) => '台帳-' + (i + 1));
    const kizu = sec('## 既知の傷').filter((l) => /^\d+\. /.test(l)).map((l, i) => '傷-' + (i + 1));
    const extraIds = ['深み', '問い-K3', '問い-K21', '問い-V22', '問い-科目', '問い-案F']; // 判定書の本文の「深みが出る」型の段落（1つ）と【問い】5つ（K3・K21・V22・5章の科目・5章の案F）
    cmp('J-D', [...F, ...j79, ...jk, ...jr, ...led, ...kizu, ...extraIds], between(s, 'JD'));
  } else err('J-D の判定書が読めない');
}
// ---- 8. （版0.4）v03 の判定（J-D G1〜G6 と47行の弱い）と検査（R-D の弱い・不当、41行の 直った 以外）への対応表がそろうか ----
{
  const auditDir = path.join(path.dirname(file), 'audit');
  const between = (t, tag) => { const i = t.indexOf(`<!-- ${tag} -->`), j = t.indexOf(`<!-- /${tag} -->`); return i < 0 || j < 0 ? null : t.slice(i, j).split('\n').filter((l) => /^\|/.test(l)).slice(2).map(cells); };
  const cmp = (name, wantIds, rows) => {
    if (!rows) { err(`${name} の対応表がない`); return; }
    const got = rows.map((r) => r[0]); const miss = wantIds.filter((x) => !got.includes(x)), extra = got.filter((x) => !wantIds.includes(x)), dupe = got.filter((x, i) => got.indexOf(x) !== i);
    const empty = rows.filter((r) => !r[2] || !r[3] || !r[4]).map((r) => r[0]);
    const kinds = {}; rows.forEach((r) => { const k = (r[2] || '').replace(/（.*$/, ''); kinds[k] = (kinds[k] || 0) + 1; });
    out.push(`${name} の対応表：${rows.length} 行／指摘 ${wantIds.length}。欠け ${miss.length}${miss.length ? '（' + miss.join(' ') + '）' : ''}・余分 ${extra.length}${extra.length ? '（' + extra.join(' ') + '）' : ''}・重複 ${dupe.length}・空の欄 ${empty.length}。扱い ${JSON.stringify(kinds)}`);
    if (miss.length || extra.length || dupe.length || empty.length) err(`${name} の対応表が指摘とそろわない`);
  };
  const rd3 = path.join(auditDir, 'cinc-redesign-reasoning-v03.md'), jd3 = path.join(auditDir, 'cinc-redesign-fact-v03.md');
  if (fs.existsSync(rd3)) {
    const t = fs.readFileSync(rd3, 'utf8');
    const v = (between(t, 'VERDICTS') || []).filter((r) => r[4] && r[4] !== '妥当').map((r) => 'V-' + r[0]);
    const r41 = (between(t, 'RD41') || []).filter((r) => r[2] && r[2] !== '直った').map((r) => '41-' + r[0]);
    cmp('R-D v03（不当・弱い＝V-、41行の直った以外＝41-）', [...v, ...r41], between(s, 'RD3'));
    const mine = between(s, 'RD3') || [];
    for (const r of mine) { if (r[0].startsWith('V-')) { const vv = (between(t, 'VERDICTS') || []).find((x) => 'V-' + x[0] === r[0]); if (vv && vv[4] !== r[1]) err(`R-D v03 ${r[0]} の判定の写しが違う（${r[1]}／${vv[4]}）`); } if (r[0].startsWith('41-')) { const vv = (between(t, 'RD41') || []).find((x) => '41-' + x[0] === r[0]); if (vv && vv[2] !== r[1]) err(`R-D v03 ${r[0]} の結果の写しが違う（${r[1]}／${vv[2]}）`); } }
  } else err('R-D v03 の検査書が読めない');
  if (fs.existsSync(jd3)) {
    const t = fs.readFileSync(jd3, 'utf8');
    const G = t.split('\n').filter((l) => /^\| G\d+ \|/.test(l)).map((l) => cells(l)[0]);
    const j47 = (between(t, 'J47') || []).filter((r) => /弱い/.test(r[3])).map((r) => 'J47-' + r[0]);
    cmp('J-D v03（G と47行の弱い）', [...G, ...j47], between(s, 'JD3'));
  } else err('J-D v03 の判定書が読めない');
  // ---- 9. （版0.5）v04 の判定（J-D H1〜H6 と J8 の直った以外）と検査（R-D の弱い・不当＝V-、抜き取りの直った以外＝S-）への対応表 ----
  const rd4 = path.join(auditDir, 'cinc-redesign-reasoning-v04.md'), jd4 = path.join(auditDir, 'cinc-redesign-fact-v04.md');
  if (fs.existsSync(rd4)) {
    const t = fs.readFileSync(rd4, 'utf8'); const V = between(t, 'VERDICTS') || [], SM = between(t, 'SAMPLE') || [];
    const want = [...V.filter((r) => r[4] && r[4] !== '妥当').map((r) => 'V-' + r[0]), ...SM.filter((r) => r[2] && r[2] !== '直った').map((r) => 'S-' + r[0])];
    const mine = between(s, 'RD4'); cmp('R-D v04（弱い・不当＝V-、抜き取りの直った以外＝S-）', want, mine);
    for (const r of mine || []) { if (r[0].startsWith('V-')) { const vv = V.find((x) => 'V-' + x[0] === r[0]); if (vv && vv[4] !== r[1]) err(`R-D v04 ${r[0]} の判定の写しが違う（${r[1]}／${vv[4]}）`); } if (r[0].startsWith('S-')) { const vv = SM.find((x) => 'S-' + x[0] === r[0]); if (vv && vv[2] !== r[1]) err(`R-D v04 ${r[0]} の結果の写しが違う（${r[1]}／${vv[2]}）`); } }
  } else err('R-D v04 の検査書が読めない');
  if (fs.existsSync(jd4)) {
    const t = fs.readFileSync(jd4, 'utf8');
    const Hs = t.split('\n').filter((l) => /^\| H\d+ \|/.test(l)).map((l) => cells(l)[0]);
    const j8 = (between(t, 'J8') || []).filter((r) => r[3] && r[3] !== '直った').map((r) => 'J8-' + r[0]);
    cmp('J-D v04（H と J8 の直った以外）', [...Hs, ...j8], between(s, 'JD4'));
  } else err('J-D v04 の判定書が読めない');
}
out.push(`エラー ${errs}`);
console.log(out.join('\n'));
process.exit(errs ? 1 : 0);
