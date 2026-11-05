#!/usr/bin/env node
// J-A（担当 A の報告の事実の判定役）が自分で書いた数えるスクリプト。A の cinc-rebuild-A-count.js は使わない・写さない。
// Usage: node boki2/docs/audit/cinc-rebuild-A-fact-count.js [--lines]
//  1. A の報告（analysis/cinc-rebuild-A-design.md）の「79行の表」を自分で読み、ID・程度・節の欄の最初の L<n>・引用を取り出す。
//     引用がその行に出るか、DESIGN-RAMEN.md の中でほかにどの行に出るかを数える。
//  2. A の「食い違いの表」D1〜D29 の両側（L<n> と `…`）を取り出し、両方の行に引用が出るかを数える。--lines で両側の行の頭を出す。
//  3. A が「0件」と書いた語と、J-A が足した別の言い方の語を DESIGN-RAMEN.md で数える（出た行番号つき）。
//  4. 版1.3 の書きかけの印【1.3:…】の数と行。
//  5. 判定書（audit/cinc-rebuild-A-fact.md）の「79行の判定」の表を読み、①②③と総合の 合う／弱い／違う を数える。
//     79の ID がそろうか、弱い・違うの行の根拠に L<行番号> があるかを確かめる。
//  6. 判定書の「D の判定」の表と「A が拾っていない食い違い」の表（N）を数え、N の引用が DESIGN-RAMEN の行に出るかを確かめる。
//  7. 判定書の「読んだ範囲」の表の行の範囲が 1〜最終行を抜けなく覆うかを確かめる。
//  8. 判定書の表のうち見出しに「逆の結論」「別の解釈」「直し方」を持つ列の空でない欄に【確かめた】か【問い】があるかを数える。
const fs = require('fs');
const path = require('path');
const DOCS = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(DOCS, p), 'utf8');
const des = read('DESIGN-RAMEN.md').split('\n');
const rep = read('analysis/cinc-rebuild-A-design.md').split('\n');
const factPath = path.join(DOCS, 'audit', 'cinc-rebuild-A-fact.md');
const fact = fs.existsSync(factPath) ? fs.readFileSync(factPath, 'utf8').split('\n') : null;
const SHOW = process.argv.includes('--lines');
const out = [];
const log = (s) => out.push(s);
const errs = [];
const splitRow = (l) => l.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((x) => x.trim());
const occ = (q) => des.map((l, i) => (l.includes(q) ? i + 1 : 0)).filter(Boolean);

// 79の ID（依頼書 BRIEF-CINC-REBUILD の番号の決まりから自分で作る）
const IDS = [];
for (let i = 1; i <= 5; i++) IDS.push('P' + i);
for (let i = 1; i <= 14; i++) IDS.push('R' + i);
for (let i = 1; i <= 12; i++) IDS.push('L' + i + '小', 'L' + i + '大');
for (let i = 1; i <= 33; i++) IDS.push('V' + i);
for (let i = 1; i <= 3; i++) IDS.push('E' + i);

// ---- 1. A の79行 ----
let inTable = false;
const aRows = {};
for (let i = 0; i < rep.length; i++) {
  const l = rep[i];
  if (/^## /.test(l)) inTable = /^## 79行の表/.test(l);
  if (!inTable || !l.startsWith('|')) continue;
  const c = splitRow(l);
  if (!IDS.includes(c[0])) continue;
  if (aRows[c[0]]) errs.push('A の表で ' + c[0] + ' が2回');
  const lm = c[2].match(/L(\d+)/);
  const qm = c[4].match(/`([^`]+)`/);
  aRows[c[0]] = { grade: c[3], line: lm ? +lm[1] : null, quote: qm ? qm[1] : null, repLine: i + 1 };
}
const grades = ['入っている', '一部', '入っていない', '逆'];
const gcount = Object.fromEntries(grades.map((g) => [g, 0]));
const byGroup = {};
let qAt = 0; const qElse = []; const qNone = [];
for (const id of IDS) {
  const r = aRows[id];
  if (!r) { errs.push('A の表に ' + id + ' が無い'); continue; }
  if (!(r.grade in gcount)) errs.push(id + ' の程度が読めない：' + r.grade); else gcount[r.grade]++;
  const g = id.startsWith('L') ? id.replace(/\d+/, '') : id[0];
  byGroup[g] = byGroup[g] || Object.fromEntries(grades.map((x) => [x, 0]));
  byGroup[g][r.grade]++;
  const at = r.quote ? occ(r.quote) : [];
  r.occ = at;
  if (r.line && at.includes(r.line)) qAt++;
  else if (at.length) qElse.push(id + '(L' + r.line + '→' + at.join(',') + ')');
  else qNone.push(id);
}
log('== 1. A の79行の表（J-A のスクリプトで数え直し）==');
log('行の数：' + Object.keys(aRows).length + '（ID のそろい：' + IDS.filter((x) => aRows[x]).length + '/79）');
log('程度：' + grades.map((g) => g + ' ' + gcount[g]).join('／') + '（式：' + grades.map((g) => gcount[g]).join('＋') + '＝' + grades.reduce((a, g) => a + gcount[g], 0) + '）');
for (const g of ['P', 'R', 'L小', 'L大', 'V', 'E']) log('  ' + g + '：' + grades.map((x) => x + ' ' + byGroup[g][x]).join('／'));
log('引用が A の書いた行に出る：' + qAt + '/79。ほかの行にだけ出る：' + (qElse.join(' ') || 'なし') + '。どこにも出ない：' + (qNone.join(' ') || 'なし'));
const multi = IDS.filter((x) => aRows[x] && aRows[x].occ.length > 1).map((x) => x + '(' + aRows[x].occ.join(',') + ')');
log('引用が2行以上に出る（行の取り違えの恐れを見る）：' + (multi.join(' ') || 'なし'));

// ---- 2. A の D1〜D29 ----
inTable = false;
const dRows = [];
for (let i = 0; i < rep.length; i++) {
  const l = rep[i];
  if (/^## /.test(l)) inTable = /食い違い/.test(l);
  if (!inTable || !/^\| *D\d+/.test(l)) continue;
  const c = splitRow(l);
  const side = (cell) => {
    const m = (cell || '').match(/L(\d+)[^`]*`([^`]+)`/);
    return m ? { line: +m[1], q: m[2], ok: (des[+m[1] - 1] || '').includes(m[2]) } : null;
  };
  dRows.push({ id: c[0], old: side(c[2]), neu: side(c[3]) });
}
log('');
log('== 2. A の食い違い D（両側の行）==');
log('D の行の数：' + dRows.length);
let bothOk = 0; let oneSide = 0;
for (const d of dRows) {
  const o = d.old; const n = d.neu;
  const s = (x) => (x ? 'L' + x.line + (x.ok ? ' 出る' : ' 出ない') : '引用なし');
  if (o && o.ok && n && n.ok) bothOk++; else oneSide++;
  log('  ' + d.id + '：古い側 ' + s(o) + '／新しい側 ' + s(n));
  if (SHOW) {
    if (o) log('     古 L' + o.line + '：' + des[o.line - 1].slice(0, 120));
    if (n) log('     新 L' + n.line + '：' + des[n.line - 1].slice(0, 120));
  }
}
log('両側とも引用が行に出る：' + bothOk + '、片側だけ引用がある・出ない：' + oneSide);

// ---- 3. 語の数 ----
const words = ['新聞', '重役', '取締役', '部長', 'ベンチャー', '出資先', '球団', 'スポンサー', '移動', '出張', '現地', '方針の札', '枠', '原価率の上限', '人件費率の上限', '社長の財布', '社長個人', '個人の資産', '寄付', '寄附', '希薄', '目減り', '自社株', '株式報酬', '市長', 'ロビー', '献金', '議決', '否決', '規模の利益', '入居率', '占有率', '指値', '産地', '縮む', '県庁所在地', '東京', '海外', '台湾', 'オフィス', '収容', '配達', 'アプリ', '宝探し', '又貸し', '先に取', '2階'];
log('');
log('== 3. 語の数（DESIGN-RAMEN.md 全 ' + des.length + ' 行。数＝出た回数、行＝出た行）==');
for (const w of words) {
  let n = 0; const ls = [];
  des.forEach((l, i) => { const k = l.split(w).length - 1; if (k) { n += k; ls.push(i + 1); } });
  log('  ' + w + '：' + n + (ls.length ? '（L' + ls.slice(0, 25).join(',') + (ls.length > 25 ? ',…' : '') + '）' : ''));
}

// ---- 4. 書きかけの印 ----
const marks = []; des.forEach((l, i) => { const m = l.match(/【1\.3:[^】]*】/g); if (m) marks.push('L' + (i + 1) + ' ' + m.join('')); });
log('');
log('== 4. 版1.3 の書きかけの印【1.3:…】==');
log('印の数：' + marks.reduce((a, s) => a + (s.match(/【/g) || []).length, 0) + '、行の数：' + marks.length + '：' + marks.join(' ／ '));

// ---- 5〜8. 判定書 ----
if (!fact) { log(''); log('判定書がまだ無い'); }
else {
  const tables = []; // {head, rows:[{cells,line}], section}
  let sec = ''; let cur = null;
  for (let i = 0; i < fact.length; i++) {
    const l = fact[i];
    if (/^#{2,3} /.test(l)) { sec = l; cur = null; }
    if (l.startsWith('|')) {
      if (!cur) { cur = { head: splitRow(l), rows: [], section: sec, start: i + 1 }; tables.push(cur); continue; }
      if (/^\|[\s:|-]+\|$/.test(l)) continue;
      cur.rows.push({ cells: splitRow(l), line: i + 1 });
    } else cur = null;
  }
  const find = (re) => tables.find((t) => re.test(t.section));
  // 5. 79行の判定
  const jt = find(/79行の判定/);
  log('');
  log('== 5. 判定書の79行の判定 ==');
  if (!jt) errs.push('判定書に「79行の判定」の表が無い');
  else {
    const col = (name) => jt.head.findIndex((h) => h.includes(name));
    const ci = { id: 0, c1: col('①'), c2: col('②'), c3: col('③'), all: col('総合'), why: col('根拠') };
    const J = ['合う', '弱い', '違う'];
    const cnt = { c1: {}, c2: {}, c3: {}, all: {} };
    for (const k in cnt) J.forEach((j) => (cnt[k][j] = 0));
    const seen = new Set(); const noLine = [];
    const allBy = { 合う: [], 弱い: [], 違う: [] };
    for (const r of jt.rows) {
      const id = r.cells[ci.id];
      if (!IDS.includes(id)) continue;
      if (seen.has(id)) errs.push('判定書の79行で ' + id + ' が2回');
      seen.add(id);
      for (const k of ['c1', 'c2', 'c3', 'all']) {
        const v = (r.cells[ci[k]] || '').replace(/\*/g, '').trim();
        const j = J.find((x) => v.startsWith(x));
        if (!j) errs.push(id + ' の ' + k + ' が 合う／弱い／違う でない：' + v); else cnt[k][j]++;
        if (k === 'all' && j) allBy[j].push(id);
      }
      const allv = (r.cells[ci.all] || '');
      if (!/^合う/.test(allv.replace(/\*/g, '')) && !/L\d+/.test(r.cells[ci.why] || '')) noLine.push(id);
    }
    const miss = IDS.filter((x) => !seen.has(x));
    log('判定した行：' + seen.size + '/79' + (miss.length ? '（抜け：' + miss.join(' ') + '）' : ''));
    for (const [k, nm] of [['c1', '① 引用がその行に出る'], ['c2', '② 本文が程度を支える'], ['c3', '③ BIZ の項目の読み'], ['all', '総合']]) {
      log('  ' + nm + '：' + J.map((j) => j + ' ' + cnt[k][j]).join('／') + '（計 ' + J.reduce((a, j) => a + cnt[k][j], 0) + '）');
    }
    log('  総合が弱い：' + allBy['弱い'].join(' '));
    log('  総合が違う：' + allBy['違う'].join(' '));
    if (noLine.length) errs.push('弱い・違うなのに根拠に行番号が無い：' + noLine.join(' '));
    if (miss.length) errs.push('79行の判定の抜け：' + miss.join(' '));
  }
  // 6. D と N
  const dt = find(/D1〜D29 の判定/);
  log('');
  log('== 6. 判定書の D と N ==');
  if (!dt) errs.push('判定書に「D1〜D29 の判定」の表が無い');
  else {
    const ci = dt.head.findIndex((h) => h.includes('判定'));
    const c = { 合う: 0, 弱い: 0, 違う: 0 }; const ids = [];
    for (const r of dt.rows) { if (!/^D\d+$/.test(r.cells[0])) continue; ids.push(r.cells[0]); const v = (r.cells[ci] || '').replace(/\*/g, ''); for (const k in c) if (v.startsWith(k)) c[k]++; }
    log('D の判定：' + ids.length + ' 行（' + Object.entries(c).map(([k, v]) => k + ' ' + v).join('／') + '）');
    const want = Array.from({ length: 29 }, (_, i) => 'D' + (i + 1));
    const miss = want.filter((x) => !ids.includes(x));
    if (miss.length) errs.push('D の判定の抜け：' + miss.join(' '));
  }
  const nt = find(/A が拾っていない食い違い/);
  if (!nt) errs.push('判定書に「A が拾っていない食い違い」の表が無い');
  else {
    let nOk = 0; let nAll = 0; const bad = []; const eff = { 効く: 0, 傷: 0 };
    const ce = nt.head.findIndex((h) => h.includes('効く'));
    for (const r of nt.rows) {
      if (!/^N\d+/.test(r.cells[0])) continue;
      nAll++;
      const cellsTxt = r.cells.join(' ');
      const ms = [...cellsTxt.matchAll(/L(\d+)\s*`([^`]+)`/g)];
      if (!ms.length) { bad.push(r.cells[0] + '(引用なし)'); continue; }
      const ok = ms.every((m) => (des[+m[1] - 1] || '').includes(m[2]));
      if (ok) nOk++; else bad.push(r.cells[0] + '(' + ms.filter((m) => !(des[+m[1] - 1] || '').includes(m[2])).map((m) => 'L' + m[1]).join(',') + ')');
      const v = r.cells[ce] || '';
      if (/^効く/.test(v)) eff['効く']++; else eff['傷']++;
    }
    log('N（A が拾っていない食い違い）：' + nAll + ' 件、引用がすべて行に出る ' + nOk + ' 件' + (bad.length ? '、出ない：' + bad.join(' ') : '') + '。面白さ・決定・数に効く ' + eff['効く'] + '／既知の傷 ' + eff['傷']);
    if (bad.length) errs.push('N の引用が行に出ない：' + bad.join(' '));
  }
  const pt = find(/D の古い側の残り/);
  if (!pt) errs.push('判定書に「D の古い側の残り」の表が無い');
  else {
    let all = 0; let ok = 0; const bad = [];
    for (const r of pt.rows) {
      if (!/^D\d+\+/.test(r.cells[0])) continue;
      all++;
      const ms = [...r.cells.join(' ').matchAll(/L(\d+)\s*`([^`]+)`/g)];
      if (ms.length && ms.every((m) => (des[+m[1] - 1] || '').includes(m[2]))) ok++; else bad.push(r.cells[0]);
    }
    log('D の古い側の残り：' + all + ' 行、引用がすべて行に出る ' + ok + ' 行' + (bad.length ? '、出ない：' + bad.join(' ') : ''));
    if (bad.length) errs.push('D の古い側の残りの引用が行に出ない：' + bad.join(' '));
  }
  // 7. 読んだ範囲
  const rt = find(/読んだ範囲/);
  log('');
  log('== 7. 読んだ範囲の表 ==');
  if (!rt) errs.push('判定書に「読んだ範囲」の表が無い');
  else {
    const ranges = [];
    for (const r of rt.rows) { const m = (r.cells[1] || '').match(/L?(\d+)\s*[–〜~-]\s*L?(\d+)/); if (m) ranges.push([+m[1], +m[2], r.cells[0]]); }
    ranges.sort((a, b) => a[0] - b[0]);
    let next = 1; const gaps = [];
    for (const [a, b] of ranges) { if (a > next) gaps.push(next + '〜' + (a - 1)); if (a < next) gaps.push('重なり ' + a); next = Math.max(next, b + 1); }
    const last = des.filter((x, i) => i < des.length).length;
    const lastNonEmpty = des.length - (des[des.length - 1] === '' ? 1 : 0);
    if (next <= lastNonEmpty) gaps.push(next + '〜' + lastNonEmpty);
    log('章の行：' + ranges.length + '、覆う範囲 L1〜L' + (next - 1) + '（DESIGN-RAMEN の行の数 ' + lastNonEmpty + '）、抜け・重なり：' + (gaps.join(' ') || 'なし'));
    if (gaps.length) errs.push('読んだ範囲に抜け・重なり：' + gaps.join(' '));
  }
  // 8. 【確かめた】【問い】
  let cells = 0; let tagged = 0; const untagged = [];
  for (const t of tables) {
    const cols = t.head.map((h, i) => (/逆の結論|別の解釈|直し方/.test(h) ? i : -1)).filter((i) => i >= 0);
    if (!cols.length) continue;
    for (const r of t.rows) for (const ci of cols) {
      const v = (r.cells[ci] || '').trim();
      if (!v || v === '—') continue;
      cells++;
      if (/【確かめた】|【問い】/.test(v)) tagged++; else untagged.push('判定書 ' + r.line + '行');
    }
  }
  log('');
  log('== 8. 「逆の結論」「別の解釈」「直し方」の欄の印 ==');
  log('欄の数 ' + cells + '、【確かめた】か【問い】がある ' + tagged + (untagged.length ? '、無い：' + untagged.join(' ') : ''));
  if (untagged.length) errs.push('印の無い欄：' + untagged.join(' '));
  const tq = fact.join('\n');
  log('【確かめた】' + (tq.match(/【確かめた】/g) || []).length + ' 個、【問い】' + (tq.match(/【問い】/g) || []).length + ' 個（判定書全体）');
}

log('');
log(errs.length ? 'エラー ' + errs.length + ' 件\n' + errs.map((e) => '  ✗ ' + e).join('\n') : 'エラー 0');
console.log(out.join('\n'));
process.exit(errs.length ? 1 : 0);
