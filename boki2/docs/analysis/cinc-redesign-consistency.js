#!/usr/bin/env node
// 設計者 W（DESIGN-CINC-REBUILD 版0.4）：直した文と古い文が同じ設計書の中で食い違う所を機械で探す（R-D v03 2.1・うまくいかない理由1「直した所と同じ結論の別の場所をそろえない」）。
// 3つを出す：
//  [1] 古い語：版0.3 までの決定の言い回しで、版0.4 では使わない語。本文（18〜20章の変更の一覧・対応表と、「版0.x の「…」」の引用は除く）に残っていればエラー
//  [2] 同じ ID・同じ決定の語を本文全体で並べる（人が読み比べるための一覧。エラーにはしない）
//  [3] 「N/60（P%）」「N/40（P%）」の割合が、analysis・audit の出力のどれかに同じ形で出ているか（出ていない数は警告）
// 使い方：node boki2/docs/analysis/cinc-redesign-consistency.js（出力は cinc-redesign-consistency.out.txt に写す）
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const doc = fs.readFileSync(path.join(root, 'docs/DESIGN-CINC-REBUILD.md'), 'utf8').split('\n');
// 決定ごとの古い語（版0.4 で直した決定）。note は今の形
const STALE = [
  { key: 'Q1 社長の財布', note: '推奨は経理が枠と候補を組む（版0.4：社長個人の頼みで、会社の帳簿の外の相談として）', words: ['議案」だけ', '議案だけ', '提案を1つ'] },
  { key: '新聞の字数', note: '先月の返りの画面は見出し80字、本文は押して開く頁', words: ['1欄2〜3行で4欄1画面', '1欄2〜3行、4欄で1画面', '4欄で1画面', '4欄1画面'] },
  { key: '台帳 #4 V6', note: 'e.4 L756 の損の側', words: ['「払えば良くなる」一方向（BIZ 鎖1b'] },
  { key: '台帳 #5 V8', note: '33件は外した', words: ['33件と同じ形'] },
  { key: '台帳 #11 V25', note: '面白さ（鎖A）', words: ['区分の判断から離れる'] },
  { key: '台帳 #13 V31', note: '面白さだけ', words: ['2級の論点につながらない'] },
  { key: '要点3 支配的な手', note: '崩せたものと崩せなかったものを判断ごとに', words: ['支配的な手を数えて、崩した', '崩した**'] },
  { key: '版0.3 の採る組', note: '版0.4 は break.js の事前登録の組', words: ['（採る組）', 'R1 の半分（R +0.25', '採る組）'] },
  { key: 'P2 の悪い面', note: '版0.4 の数', words: ['40/40 のまま'] },
  { key: 'PEDAGOGY 表の山札', note: '骨の月は1〜2枚、ほかの7か月は0〜2枚', words: ['札は月1〜3枚'] },
  { key: 'V22 の枠', note: 'T8.2-2 の1つの枠の規則', words: ['枠は使うと縮む'] },
  { key: '雇う判断', note: 'Q5 の数で雇う道は立たない', words: ['雇う判断（2号店から）', '雇う判断は2号店から生かす（決定32）'] },
  { key: 'Q2 の年5回', note: '点検を入れると15時間に入らない。b.5 の線は Q2 (f)', words: ['14.76時間で DESIGN-RAMEN b.5', '収める唯一の組', '0.6〜0.7【置き値】にすると'] },
  { key: 'Q3b・台帳 #35 の理由', note: '1周の時間の理由は取り下げ', words: ['本編にもう1つ町を足すと後半の1か月が重くなり', '本編にもう1つ町を足すと後半の1か月がさらに重くなり'] },
  { key: 'Q5 (c)', note: '損を重くする推奨は取り下げ', words: ['社長が2店を見る損を重くする（推奨）', '3択＋社長が見る損を重く'] },
  { key: '大胆の数', note: 'オーナーに見せる数は名のとおりに数え直した', words: ['大胆な形」36', '形」36', '大胆な形 36'] },
  { key: 'V17', note: '最小に戻した', words: ['版0.3 で「最小」から変えた'] },
];
// 章の見出しで、古い語を許す章（変更の一覧・対応表）
const isHistory = (title) => /^## (17|18|19|20)\./.test(title);
let sec = '', errors = 0; const out = [];
const quoted = (line, w) => { const i = line.indexOf(w); const a = line.lastIndexOf('「', i), b = line.lastIndexOf('」', i); return a >= 0 && a > b && /版0\.[0-3][^「]{0,12}$/.test(line.slice(Math.max(0, a - 14), a)); };
out.push('[1] 古い語（本文に残っていればエラー。18〜20章と「版0.x の「…」」の引用は除く）');
const hits = {};
doc.forEach((line, i) => {
  if (/^## /.test(line)) sec = line;
  if (isHistory(sec)) return;
  for (const s of STALE) for (const w of s.words) if (line.includes(w) && !quoted(line, w)) { (hits[s.key] = hits[s.key] || []).push(`L${i + 1}（${sec.slice(3, 20)}）「${w}」`); }
});
for (const s of STALE) { const h = hits[s.key] || []; if (h.length) errors += h.length; out.push(`  ${s.key}：${h.length ? 'エラー ' + h.length + '：' + h.join('、') : 'なし'}　（今の形：${s.note}）`); }
// [2] 同じ ID・同じ決定の語を並べる
const IDS = ['V6', 'V8', 'V13', 'V16', 'V17', 'V22', 'V25', 'V27', 'V31', 'R4', 'P2', 'P19', 'L21', 'Q1', 'Q2', 'Q3b', 'Q5', '#35', '#24', '社長が2店を見る', '静かな月', '坂の見張り', '待つ判断'];
out.push('[2] 同じ ID・同じ決定の語の出る行（読み比べ用。18〜20章は数えない）');
for (const id of IDS) {
  const re = new RegExp(`(^|[^A-Za-z0-9#])${id.replace('#', '\\#')}([^0-9a-z]|$)`);
  const rows = []; sec = '';
  doc.forEach((line, i) => { if (/^## /.test(line)) sec = line; if (!isHistory(sec) && re.test(line)) rows.push(`L${i + 1}`); });
  out.push(`  ${id}：${rows.length} 行（${rows.join(' ')}）`);
}
// [3] 割合の出どころ
const outs = [];
for (const d of ['docs/analysis', 'docs/audit']) for (const f of fs.readdirSync(path.join(root, d))) if (/\.out\.txt$/.test(f)) outs.push(fs.readFileSync(path.join(root, d, f), 'utf8'));
const all = outs.join('\n');
const missing = []; sec = '';
doc.forEach((line, i) => {
  if (/^## /.test(line)) sec = line;
  if (isHistory(sec)) return;
  for (const m of line.matchAll(/(\d+)\/(60|40)（(\d+)%）/g)) if (!all.includes(m[0])) missing.push(`L${i + 1}「${m[0]}」`);
});
out.push(`[3] 割合「N/60（P%）」「N/40（P%）」で、出力のどれにも同じ形で無いもの：${missing.length ? missing.join('、') : 'なし'}（警告）`);
out.push(`エラー ${errors}`);
console.log(out.join('\n'));
process.exitCode = errors ? 1 : 0;
