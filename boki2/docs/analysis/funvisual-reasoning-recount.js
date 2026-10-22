#!/usr/bin/env node
// BIZ-FUNVISUAL の論証検査（docs/audit/BIZ-FUNVISUAL-reasoning.md）で使った数え直し。
// 使い方：node boki2/docs/analysis/funvisual-reasoning-recount.js
// 1) 付録A の符号表から2章の表の合計を数え直す（報告の表と一致するか）
// 2) 分類 C（少しずつ上がる…時間を忘れる）29件と A（組み合わせ・意外な結果）17件の中身を、
//    検査役が原文（research/raw/web/simgames/r5-fv-applion-*.html）を1件ずつ読んで小分けしたもの（手で付けた印）を合計する
// 3) 4章の「絡む相手」の列から、外向き（その変数が挙げる相手の数）と内向き（他の変数から挙げられる数）を数える
// 4) 1.13 の見取り図の「変数の数」と「周回の強さ」の順位相関（報告の「比例しない」の検算）
// 5) 3.1 の「易」14項目のうち、別の（中〜難の）絵の部品がないと成り立たないもの
'use strict';
const fs = require('fs');
const path = require('path');
const doc = fs.readFileSync(path.join(__dirname, '..', 'BIZ-FUNVISUAL.md'), 'utf8').split('\n');

// ---- 1) 付録A ----
const appendix = doc.filter(l => /^\*\*(こだわり|大盛|ゲーム発展国|グッドピザ)/.test(l));
const total = {};
const perPage = {};
for (const l of appendix) {
  const name = l.split('**')[1];
  const items = l.split('：').slice(1).join('：').split('／');
  perPage[name] = { n: items.length, codes: {} };
  for (let it of items) {
    it = it.replace(/（[^）]*）/g, '').trim();
    const m = it.match(/^(\d+)\s*(.*)$/);
    const codes = m[2].split(/\s+/).filter(x => x && x !== '—');
    for (const c of codes) {
      total[c] = (total[c] || 0) + 1;
      perPage[name].codes[c] = (perPage[name].codes[c] || 0) + 1;
    }
  }
}
console.log('1) 付録A：ページ数', appendix.length, '／各ページの件数', Object.values(perPage).map(p => p.n).join(','));
console.log('   分類の合計', JSON.stringify(Object.keys(total).sort().reduce((o, k) => (o[k] = total[k], o), {})));
const kairo = ['こだわりラーメン館（買い切り）', 'こだわりラーメン館〜全国編〜', '大盛グルメ食堂', 'ゲーム発展国++'];
for (const c of ['A', 'B', 'F', 'H', 'D', 'C']) {
  const k = kairo.reduce((s, p) => s + ((perPage[p] && perPage[p].codes[c]) || 0), 0);
  console.log(`   ${c}：計 ${total[c]}、うちカイロソフト4ページ ${k}（${Math.round(100 * k / total[c])}%）、グッドピザ ${total[c] - k}`);
}

// ---- 2) C と A の小分け（検査役の手の印。番号は付録A と同じ「各ページの上からの順」）----
// C の印： g＝数字・値・お金が少しずつ上がることを言っている／s＝記録・人気・レベルの伸びに触れるが弱い／o＝「ハマった・時間を忘れた・やり込める」という結果だけ
const C = {
  'ラーメン館': { 4: 'g コツコツレベルアップ・アイテム回収', 9: 's キャラや食材のレベルなど遊び要素が多い', 12: 'o 内容が複雑・奥が深い', 15: 'o また時間を費やしてしまう', 20: 'o 単純だけど長続き' },
  '全国編': { 1: 'o 48時間以上プレイ', 3: 'g 小さな変化を楽しむ', 5: 'o いくらでも暇が潰せる', 6: 'g 味・魅力が100→200', 8: 'o 気づいたらこんな時間', 9: 's 利用客と人気が増え昇段が進む', 11: 'o 時間が溶ける', 12: 'o 気づけば2、3時間', 17: 'g 味とカリスマ性が少しずつ高まる' },
  'グルメ食堂': { 1: 'o 一日中やっていた', 3: 'o かなりはまれる', 5: 'o やり込み要素も豊富', 6: 'o 時間を忘れていつまででも' },
  '発展国++': { 2: 's 最高売上の本数', 4: 'o やめ時が分からない', 6: 'o 気付いたら朝', 9: 's 売上の最高記録更新・育成…時間を忘れる', 10: 'g 少しずつ増えていくお金・アイデア', 11: 'o やり込み要素が多く長時間', 15: 'o いつのまにか時間を浪費', 18: 'o 初日で8時間', 20: 'o 時間泥棒' },
  'グッドピザ': { 10: 'o 40日目でも飽きない', 13: 'o 毎日の楽しみ' },
};
// A の印： h＝隠れた相性・予想外の評価を言っている／i＝想像の余地／t＝組み合わせを試したくなる／p＝現実を参考にすると当たる（見える相性）／m＝自分で作る・考える自由
const A = {
  'ラーメン館': { 7: 'm ラーメン作るのが面白い', 8: 'm 自由にラーメン・店を作れる' },
  '全国編': { 2: 'h 頑張ったのに散々・思いがけない組み合わせで看板', 7: 'm トッピングをありえない角度で置く', 10: 'm 名前・スープや麺を一から', 12: 'm ラーメン作ってしまう', 14: 'h 好み100%が低評価・何気ない物が名品' },
  'グルメ食堂': { 1: 'm 新しいメニューを考える', 6: 'm メニューを増やしたり強化したり' },
  '発展国++': { 1: 't 色んな組み合わせを試したくなる', 4: 'p 実際にあるものを参考にすれば大体正解', 11: 'm ゲームを作るような気分', 14: 'm ジャンルと属性を合わせて作る', 16: 'm 方向性・名前を自分で決められる', 20: 'i 想像の余地' },
  'グッドピザ': { 1: 'm 自分オリジナルのピザ', 19: 'm 頼まれた料理を自由に作れる' },
};
function tally(obj) {
  const t = {}; let n = 0;
  for (const p of Object.values(obj)) for (const v of Object.values(p)) { const k = v[0]; t[k] = (t[k] || 0) + 1; n++; }
  return { n, t };
}
const ct = tally(C), at = tally(A);
console.log('2) C の小分け：計', ct.n, JSON.stringify(ct.t), '（g＝数字が少しずつ上がる／s＝弱く触れる／o＝結果だけ）');
console.log('   A の小分け：計', at.n, JSON.stringify(at.t), '（h＝隠れた相性・予想外／i＝想像の余地／t＝試したくなる／p＝現実で当たる／m＝作る自由）');

// ---- 3) 4章の絡む相手 ----
const start = doc.findIndex(l => l.startsWith('### 4.1'));
const end = doc.findIndex(l => l.startsWith('### 4.8'));
const out = {}; const inb = {};
for (const l of doc.slice(start, end)) {
  const m = l.match(/^\| (\d+) \|/);
  if (!m) continue;
  const cells = l.split('|').map(s => s.trim());
  const n = +cells[1];
  const s = new Set();
  for (const tok of cells[3].split(/[・、]/)) {
    let r = tok.match(/(\d+)〜(\d+)/);
    if (r) { for (let i = +r[1]; i <= +r[2]; i++) s.add(i); continue; }
    r = tok.match(/(\d+)/);
    if (r) s.add(+r[1]);
  }
  out[n] = s.size;
  for (const x of s) inb[x] = (inb[x] || 0) + 1;
}
const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `#${k}:${v}`).join(' ');
console.log('3) 4章の行数', Object.keys(out).length, '／外向きの上位', top(out));
console.log('   内向きの上位', top(inb), '／報告が要に挙げた4つ', [26, 15, 3, 6].map(k => `#${k} 外${out[k]}・内${inb[k] || 0}`).join(' '));

// ---- 4) 1.13 の順位相関 ----
// 変数の数は報告の値（約・超・数十は：数十＝40 と置く）。周回の強さ：弱1・弱〜中1.5・中2・中〜強2.5・強3
const works = [
  ['ラーメン館', 12, 2], ['グルメ食堂', 8, 2], ['発展国++', 10, 2.5], ['GDT', 12, 2], ['Lemonade', 8, 1],
  ['Offworld', 20, 3], ['CapLab', 30, 3], ['TwoPoint', 15, 2.5], ['GoodPizza', 10, 1.5], ['CSD', 8, 2], ['Startup', 40, 1.5],
];
function ranks(a) { const s = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = new Array(a.length); let i = 0; while (i < s.length) { let j = i; while (j + 1 < s.length && s[j + 1][0] === s[i][0]) j++; const avg = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[s[k][1]] = avg; i = j + 1; } return r; }
function spearman(rows) { const x = ranks(rows.map(r => r[1])), y = ranks(rows.map(r => r[2])); const mx = x.reduce((a, b) => a + b) / x.length, my = y.reduce((a, b) => a + b) / y.length; let n = 0, dx = 0, dy = 0; for (let i = 0; i < x.length; i++) { n += (x[i] - mx) * (y[i] - my); dx += (x[i] - mx) ** 2; dy += (y[i] - my) ** 2; } return n / Math.sqrt(dx * dy); }
console.log('4) 変数の数と周回の強さの順位相関：11作品', spearman(works).toFixed(2), '／Startup を除く10作品', spearman(works.filter(w => w[0] !== 'Startup')).toFixed(2));

// ---- 5) 3.1 の「易」----
const easy = [5, 6, 7, 8, 11, 14, 15, 16, 17, 18, 20, 22, 24, 25];
// 別の部品が要るもの（3.1 の表の「ピヨ商店での使い方」の列から）：5・6 は店員・客の絵（#19 中〜難／#3 中）の上に載る、20 は丼（#1 中）か寸胴の絵、22 は店の絵（#3 中・#4 中）
const needsArt = { 5: '#19・#3（店員・客の絵）', 6: '#19・#3（客の絵）', 20: '#1（丼）', 22: '#3・#4（店の絵）' };
// 3.1 の定義「中＝小さな JS の部品が要る」に当たるのに易にしているもの：24（requestAnimationFrame と明記）
const jsByOwnDef = { 24: 'requestAnimationFrame の補間（定義では中）' };
const standalone = easy.filter(n => !needsArt[n] && !jsByOwnDef[n]);
console.log('5) 易', easy.length, '項目／絵の部品が要る', Object.keys(needsArt).length, '／定義では中', Object.keys(jsByOwnDef).length, '／それだけで成り立つ易', standalone.length, standalone.join(','));
