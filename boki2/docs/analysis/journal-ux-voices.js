#!/usr/bin/env node
// 仕訳の画面の設計（DESIGN-JOURNAL-UX）で使う利用者の声の分類。頭の中で数えない（QUALITY 6.2）。
// 対象：research/raw/web の APPLION の口コミ一覧（パブロフ簿記2級 lite 20件・Reigns 20件）と Google Play の Reigns の代表レビュー3件。
// 口コミの本文は原文（raw）から機械で切り出し、符号は下の表で付ける。raw が消えた環境では動かない（取得記録の sha256 で照合する）。
// Usage: node boki2/docs/analysis/journal-ux-voices.js
const fs = require('fs');
const path = require('path');
const R = path.join(__dirname, '..', '..', 'research', 'raw', 'web');
const strip = (s) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, '\n').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n');
// 符号：OP 操作感への言及（+ 肯定／− 否定）、GUESS あてずっぽう・運・説明不足、FLOW 流れを止める・待たされる、CHAR キャラ・絵・音、EXPL 解説の手がかり、BORE 飽き・単調、OTHER
const CODES = {
  OP: /操作|サクサク|スパスパ|フリック|スワイプ|指先|動き/,
  GUESS: /適当に|運要素|運でクリア|フィーリング|じゃんけん|説明がない|勘が良くないと/,
  FLOW: /戻らなければ|次に進まない|フリーズ|落ち(る|なく)|何もできなく|待/,
  CHAR: /かわいい|わんちゃん|キャラクター|デザイン|雰囲気|美しい/,
  EXPL: /解説|手順|説明が|せつめい/,
  BORE: /飽き|単調|繰り返し/,
};
// APPLION の口コミ1件＝ <div class="review_comment"> … <div class="foot">（星と日付）。作者の更新履歴（制作者）は除く
const applion = (file) => {
  const html = fs.readFileSync(path.join(R, file), 'utf8');
  return [...html.matchAll(/<div class="review_comment">([\s\S]*?)<div class="foot"><p>([^<]*)<span class="star_on">/g)]
    .filter((m) => !/^制作者/.test(m[2].trim()))
    .map((m) => strip(m[1]).replace(/\s+/g, ' ').trim());
};
const sets = [
  { name: 'パブロフ簿記2級lite（APPLION 1ページ目）', items: applion('uiux/r11-ju-applion-pavlov2-reviews_html.html') },
  { name: 'Reigns（APPLION 1ページ目）', items: applion('simgames/r11-ju-applion-reigns-reviews_html.html') },
  { name: 'Reigns（Google Play 代表3件）', items: (() => { const t = strip(fs.readFileSync(path.join(R, 'simgames/r11-ju-gplay-reigns_html.html'), 'utf8')); return [...t.matchAll(/\d{4}年\d{1,2}月\d{1,2}日\n([^\n]+)\n/g)].map((m) => m[1]); })() },
];
const tot = {}; let n = 0;
const rows = [];
for (const s of sets) {
  for (const it of s.items) {
    n++;
    const codes = Object.keys(CODES).filter((k) => CODES[k].test(it));
    const op = codes.includes('OP') ? (/分からな|暗く|不具合|バグ/.test(it) ? 'OP−' : 'OP+') : null;
    const cs = codes.filter((k) => k !== 'OP').concat(op ? [op] : []);
    if (!cs.length) cs.push('OTHER');
    cs.forEach((c) => { tot[c] = (tot[c] || 0) + 1; });
    rows.push([s.name, cs.join('・'), it.replace(/\s+/g, ' ').slice(0, 70)]);
  }
  console.log(`${s.name}：${s.items.length} 件`);
}
console.log(`合計 ${n} 件（1件に複数の符号あり）`);
console.log('符号ごとの件数：', JSON.stringify(tot));
fs.writeFileSync(path.join(__dirname, 'journal-ux-voices.tsv'), ['出どころ\t符号\t本文（先頭70字）', ...rows.map((r) => r.join('\t'))].join('\n') + '\n');
fs.writeFileSync(path.join(__dirname, 'journal-ux-voices.out.txt'), `${sets.map((s) => `${s.name}：${s.items.length} 件`).join('\n')}\n合計 ${n} 件\n符号ごとの件数：${JSON.stringify(tot)}\n`);
