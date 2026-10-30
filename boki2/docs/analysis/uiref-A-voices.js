#!/usr/bin/env node
// 担当A（日本語のアプリの画面）の利用者の声を数える。BRIEF-UIREF 4章の受け入れ基準4（見た目・操作・分かりやすさの声 50件以上、1件ずつ符号）。
// 資料：APPLION（App Store の口コミの集約。web/uiref の uA-applion-*）8アプリ×20件＝160件を全部抜き出し、
// 見た目・操作・分かりやすさに触れる文を含む口コミだけに符号を付けた（抜き出しの語の一覧は報告の「やっていないこと」）。
// 1件＝1つの口コミ。1件に複数の符号が付くことがある。
// このスクリプトは、①語句が原文（research/raw）にそのまま出るか、②その語句がどの口コミ（何件目）にあるか、
// ③同じ本文の口コミ（紹介コードの使い回しの定型文）を1件にまとめたか、を確かめてから数える。
// 使い方：node boki2/docs/analysis/uiref-A-voices.js
const fs = require('fs');
const path = require('path');
const RAW = path.join(__dirname, '..', '..', 'research', 'raw', 'web', 'uiref');
const norm = (s) => String(s || '').normalize('NFKC').replace(/[\s　]+/g, '');
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");

// 符号（見た目・操作・分かりやすさの声の中身）
const CODES = {
  'LOOK+': '見た目がよい（かわいい・おしゃれ・色・見やすいデザイン）',
  'LOOK-': '見た目が悪い（子どもっぽい・ダサい）',
  'EASY+': '使いやすい・シンプル・迷わない',
  'NAV-': '操作に迷う・行き先が分からない・一覧や並べ替えがほしい（ナビゲーションと情報の置き場）',
  'CLEAR+': '解説・表示が分かりやすい',
  'DATA+': '数字・グラフ・記録が見えるのがよい',
  'DATA-': '数字・グラフの見せ方への不満・要望',
  'CHAR+': 'キャラクターへの愛着・キャラの変化が楽しい',
  'MOTION+': '動き・音・演出がよい',
  'MOTION-': '動き・音・演出が邪魔・派手すぎる・待たされる',
  'TEXT-': '文字が小さい・文字の大きさの変更への不満',
  'GAME+': 'ゲーム感覚・楽しい・間違えても安心',
  'PRESS-': '失敗の罰・プレッシャーがつらい',
  'FEED+': '入力の結果・誤りがすぐ見える',
  'CHANGE-': '見た目・操作の変更で使いにくくなった',
  'CHANGE+': '見た目・操作の変更で見やすくなった',
  'AD-': '広告・割り込みの表示が邪魔',
};

// [文書, 口コミの番号（ページ内の順）, 原文の語句, 符号の配列]
const V = [
  // みんなの銀行（uA-applion-minna）
  ['uA-applion-minna', 2, 'アプリのデザインがポップで可愛く', ['LOOK+']],
  ['uA-applion-minna', 2, '慣れるまでは操作に迷うところが結構ありました', ['NAV-']],
  ['uA-applion-minna', 2, '全体の項目一覧のようなもの', ['NAV-']],
  ['uA-applion-minna', 3, 'アプリ内のイラストもなんだかオシャレ', ['LOOK+', 'EASY+']],
  ['uA-applion-minna', 4, 'ホームの画面もスッキリしています', ['EASY+', 'LOOK+']],
  ['uA-applion-minna', 5, '慣れるまで操作に迷うことが結構ありました', ['NAV-', 'LOOK+']],
  ['uA-applion-minna', 6, 'とにかく操作に無駄がないのが気に入っています', ['EASY+', 'LOOK+']],
  ['uA-applion-minna', 9, '見に行く場所が多いため', ['NAV-', 'LOOK+']],
  ['uA-applion-minna', 10, 'シンプルなモノクロベース', ['LOOK+', 'EASY+']],
  ['uA-applion-minna', 10, 'アニメーション効果はなくてもいいんだけれど', ['MOTION+']],
  ['uA-applion-minna', 10, '記憶のフックや生活リズムを整える', ['LOOK+']],
  ['uA-applion-minna', 16, 'みんなの銀行の使いやすさは一番', ['EASY+', 'LOOK+']],
  ['uA-applion-minna', 11, '画面に写るだけでした', ['EASY+']],
  // おぢポ（uA-applion-odipo）
  ['uA-applion-odipo', 2, '機能を使う時の強制広告', ['AD-']],
  ['uA-applion-odipo', 4, '小さなおじさんがかわいいポイ活アプリ', ['CHAR+']],
  ['uA-applion-odipo', 5, 'おじさんが変化していくのが楽しい', ['CHAR+', 'GAME+']],
  ['uA-applion-odipo', 8, 'おじさんの見た目が変わっていくのが', ['CHAR+']],
  ['uA-applion-odipo', 10, 'キャラが成長していくのがツボ', ['CHAR+', 'GAME+']],
  ['uA-applion-odipo', 15, 'ごちゃごちゃしておらず', ['EASY+']],
  ['uA-applion-odipo', 20, 'おじさんがレベルアップしていくのが楽しみ', ['CHAR+']],
  // mikan（uA-applion-mikan）
  ['uA-applion-mikan', 2, '爆音ファンファーレが派手過ぎる', ['MOTION-']],
  ['uA-applion-mikan', 3, '操作や画面表示がシンプル', ['EASY+']],
  ['uA-applion-mikan', 4, 'カードめくりでポンポンと速いテンポ', ['GAME+', 'EASY+']],
  ['uA-applion-mikan', 5, 'ゲーム感覚で身につけられる', ['GAME+']],
  ['uA-applion-mikan', 6, 'めちゃくちゃ見やすく表示される', ['DATA+', 'GAME+']],
  ['uA-applion-mikan', 8, '毎回フォルダ選択のタブが出てくる', ['NAV-']],
  ['uA-applion-mikan', 11, '文字の大きさの改悪', ['TEXT-', 'MOTION-', 'CHANGE-']],
  ['uA-applion-mikan', 13, '跳ねているむけおのアニメーションも好き', ['MOTION+', 'CHAR+']],
  ['uA-applion-mikan', 14, '全体のデザインも優しい色合いで視認性も高く', ['LOOK+', 'EASY+']],
  ['uA-applion-mikan', 15, 'もう1タップされてから次の問題に行く', ['MOTION-', 'NAV-']],
  ['uA-applion-mikan', 16, '大きなUI変更が入る際は', ['CHANGE-', 'NAV-']],
  ['uA-applion-mikan', 17, '見た目がダサいとやる気が起きない', ['LOOK+']],
  ['uA-applion-mikan', 18, '音もうるさくなくて', ['MOTION+']],
  ['uA-applion-mikan', 19, 'キャラクターの「むけお」がとっても可愛い', ['CHAR+']],
  // freee（uA-applion-freee）
  ['uA-applion-freee', 4, '最初はやり方とかさっぱり分からない', ['NAV-']],
  ['uA-applion-freee', 7, '全体的には使いやすいと思います', ['EASY+']],
  ['uA-applion-freee', 9, 'エラー探しの際に分かりやすく', ['FEED+', 'NAV-']],
  ['uA-applion-freee', 14, '表示がリアルタイムで出てくれる', ['FEED+']],
  ['uA-applion-freee', 16, '最近UIが変わって見やすくなり', ['CHANGE+', 'DATA+']],
  // Zaim（uA-applion-zaim）
  ['uA-applion-zaim', 2, '子供ぽっく', ['LOOK-', 'CHANGE-']],
  ['uA-applion-zaim', 7, 'Uiがわかりやすい', ['EASY+', 'DATA+']],
  ['uA-applion-zaim', 9, '操作が分かりやすく使いやすい点が魅力', ['EASY+']],
  ['uA-applion-zaim', 10, 'UIがわかりやすくて良いです', ['EASY+']],
  ['uA-applion-zaim', 11, 'レイアウトも見やすいので本当便利', ['LOOK+']],
  ['uA-applion-zaim', 13, '毎日画面を見るのが楽しみ', ['DATA+', 'NAV-']],
  ['uA-applion-zaim', 14, 'デザインがとても見やすくて', ['LOOK+']],
  ['uA-applion-zaim', 16, '画面なのに文字が小さい', ['TEXT-']],
  ['uA-applion-zaim', 18, '項目ごとの色分けも見やすく', ['LOOK+', 'DATA+']],
  ['uA-applion-zaim', 20, 'ボタンが妙に押しづらい', ['LOOK+', 'NAV-', 'DATA-']],
  // パブロフ簿記2級（uA-applion-pboki2）
  ['uA-applion-pboki2', 1, '解説がとにかくわかりやすく', ['CLEAR+']],
  ['uA-applion-pboki2', 3, '解説もわかりやすいので簿記初心者', ['CLEAR+']],
  ['uA-applion-pboki2', 4, '表示区分が大分わかるようになってきました', ['CLEAR+']],
  ['uA-applion-pboki2', 6, '分からないことはその場で解決', ['CLEAR+', 'FEED+']],
  ['uA-applion-pboki2', 7, 'キャラクターも可愛いし', ['CHAR+', 'EASY+']],
  ['uA-applion-pboki2', 9, '解説も丁寧で分かりやすいです', ['CLEAR+']],
  ['uA-applion-pboki2', 11, '知りたかったことが書いてある', ['CLEAR+']],
  ['uA-applion-pboki2', 12, '電卓機能が少し使いにくいかも', ['NAV-']],
  ['uA-applion-pboki2', 13, '解説も無駄がなく簡潔で分かり易い', ['CLEAR+']],
  ['uA-applion-pboki2', 18, '仕訳の理由・発展事項が問題ごとにまとめられて', ['CLEAR+']],
  ['uA-applion-pboki2', 20, 'アンダーラインを引けるようにしてほしい', ['NAV-']],
  // Duolingo（uA-applion-duolingo）
  ['uA-applion-duolingo', 1, '明るいアニメーションとともに学べて', ['MOTION+', 'GAME+']],
  ['uA-applion-duolingo', 2, '間違えても大丈夫だという安心感', ['GAME+']],
  ['uA-applion-duolingo', 3, 'ゲーム性があり', ['GAME+']],
  ['uA-applion-duolingo', 7, 'アニメーションも動きが滑らか', ['MOTION+']],
  ['uA-applion-duolingo', 8, 'デザインが可愛い', ['LOOK+', 'GAME+']],
  ['uA-applion-duolingo', 10, 'アップデートされてから全体的に見やすくなった', ['CHANGE+']],
  ['uA-applion-duolingo', 11, 'ゲーム感覚で出来る', ['GAME+']],
  ['uA-applion-duolingo', 14, 'ゲーム感覚で学べる', ['GAME+']],
  ['uA-applion-duolingo', 15, 'けっこうヒリヒリします', ['PRESS-', 'AD-']],
  ['uA-applion-duolingo', 18, 'わかりやすく教えてくれました', ['CHAR+', 'CLEAR+']],
  ['uA-applion-duolingo', 20, 'Duoの絵も可愛いです', ['CHAR+', 'LOOK+']],
  // マネーフォワード（uA-applion-moneyforward）
  ['uA-applion-moneyforward', 1, 'ゲーム感覚で習慣化しやすいものでした', ['GAME+']],
  ['uA-applion-moneyforward', 2, '一画面で見える範囲が狭くなり', ['CHANGE-', 'NAV-']],
  ['uA-applion-moneyforward', 3, 'UIは、meが良い', ['EASY+']],
  ['uA-applion-moneyforward', 6, 'ポップアップ広告はウザイです', ['AD-']],
  ['uA-applion-moneyforward', 7, 'グラフとして表れるのでとても見やすく', ['DATA+', 'EASY+']],
  ['uA-applion-moneyforward', 9, 'ひたすら右フリックする必要がある', ['NAV-', 'DATA-']],
  ['uA-applion-moneyforward', 10, '好きな順番に入れ替えられる機能', ['DATA-', 'NAV-', 'EASY+']],
  ['uA-applion-moneyforward', 11, 'カレンダー画面の上部や下部にスイッチ', ['NAV-', 'EASY+']],
  ['uA-applion-moneyforward', 14, 'グラフで視覚的に確認できる', ['DATA+']],
  ['uA-applion-moneyforward', 16, '色分けを自分で設定できる機能', ['DATA-']],
  ['uA-applion-moneyforward', 20, '表示を並べ替えできる機能', ['NAV-']],
];

// 原文を口コミごとに分ける（APPLION の review_comment の塊。title と body）
const cache = {};
const reviews = (doc) => {
  if (cache[doc]) return cache[doc];
  const s = fs.readFileSync(path.join(RAW, doc + '.html'), 'utf8');
  const blocks = s.split('class="review_comment"').slice(1);
  cache[doc] = blocks.map((b) => {
    const t = (b.match(/<p class="title">([\s\S]*?)<\/p>/) || [])[1] || '';
    const body = (b.match(/<div class="body">([\s\S]*?)<\/div>/) || [])[1] || '';
    return { title: norm(strip(t)), body: norm(strip(body)) };
  });
  return cache[doc];
};

let bad = 0;
const voices = new Map(); // key: 文書#番号 → { codes:Set, body }
for (const [doc, n, phrase, codes] of V) {
  const rs = reviews(doc);
  const r = rs[n - 1];
  const p = norm(phrase);
  if (p.length < 4 || p.length > 24) { console.log(`✗ 語句の長さ ${p.length}：${phrase}`); bad++; }
  if (!r || !(r.title + r.body).includes(p)) {
    const where = rs.findIndex((x) => (x.title + x.body).includes(p));
    console.log(`✗ ${doc} の ${n}件目に「${phrase}」がない${where >= 0 ? `（${where + 1}件目にある）` : '（原文のどこにもない）'}`); bad++; continue;
  }
  for (const c of codes) if (!CODES[c]) { console.log(`✗ 未定義の符号 ${c}`); bad++; }
  const k = `${doc}#${n}`;
  if (!voices.has(k)) voices.set(k, { codes: new Set(), body: r.body, doc });
  codes.forEach((c) => voices.get(k).codes.add(c));
}
// 同じ本文、または符号を付けた語句を共有する口コミ（紹介コードだけ差し替えた定型文）は1件にまとめる。まとめた数を出す
const par = new Map([...voices.keys()].map((k) => [k, k]));
const find = (k) => (par.get(k) === k ? k : find(par.get(k)));
const unite = (a, b) => par.set(find(a), find(b));
const keys = [...voices.keys()];
for (const a of keys) for (const b of keys) { if (a >= b) continue; const va = voices.get(a), vb = voices.get(b); if (va.doc !== vb.doc) continue; if (va.body.slice(0, 200) === vb.body.slice(0, 200)) unite(a, b); }
for (const [doc, n, phrase] of V) { const p = norm(phrase); for (const b of keys) { const vb = voices.get(b); if (vb.doc === doc && b !== `${doc}#${n}` && vb.body.includes(p) && voices.has(`${doc}#${n}`)) unite(`${doc}#${n}`, b); } }
const groups = new Map(); for (const k of keys) { const r = find(k); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(k); }
const dupGroups = [...groups.values()].filter((g) => g.length > 1);
const uniq = [...groups.values()].map((g) => { const codes = new Set(); g.forEach((k) => voices.get(k).codes.forEach((c) => codes.add(c))); return { keys: g, doc: voices.get(g[0]).doc, codes }; });

// 同じ定型文が、符号を付けていない口コミにもいくつあるか（使い回しの規模）
const allDocs = [...new Set(V.map((x) => x[0]))];
let templ = 0;
for (const d of allDocs) { const seen = new Map(); reviews(d).forEach((r) => { const h = r.body.slice(0, 120); seen.set(h, (seen.get(h) || 0) + 1); }); for (const c of seen.values()) if (c > 1) templ += c - 1; }

// 紹介コードだけ差し替えた定型文（先頭は違うが感想の文が同じ）：符号を付けた語句が、同じページのほかの口コミにも出る数
const echo = V.map(([doc, n, phrase]) => ({ doc, n, phrase, others: reviews(doc).map((r, i) => i + 1).filter((i) => i !== n && (reviews(doc)[i - 1].title + reviews(doc)[i - 1].body).includes(norm(phrase))) })).filter((x) => x.others.length);
const total = allDocs.reduce((a, d) => a + reviews(d).length, 0);
console.log('同じ語句がほかの口コミにも出るもの（定型文の疑い。ほかの口コミには符号を付けず、数に入れていない）：');
echo.forEach((x) => console.log(`  - ${x.doc}#${x.n}「${x.phrase}」→ ほかに ${x.others.join('・')}件目`));
console.log(`読んだ口コミ（8アプリの1ページ目、全件）：${total} 件`);
console.log(`同じ本文の重なり（読んだ全件のうち、先頭120字が同じ2件目以降）：${templ} 件`);
console.log(`符号を付けた口コミ：${voices.size} 件（語句の行 ${V.length}）`);
console.log(`同じ本文・定型文を1件にまとめた後：${uniq.length} 件（まとめた組 ${dupGroups.length}：${dupGroups.map((g) => g.join('+')).join(' / ') || 'なし'}）`);
console.log('\n## アプリごと（まとめた後）');
for (const d of allDocs) console.log(`- ${d}：${uniq.filter((u) => u.doc === d).length}`);
console.log('\n## 符号ごと（まとめた後の件数。1件が複数の符号に入る）');
const cnt = {};
uniq.forEach((u) => u.codes.forEach((c) => (cnt[c] = (cnt[c] || 0) + 1)));
for (const [c, d] of Object.entries(CODES)) console.log(`- ${c}（${d}）：${cnt[c] || 0}`);
const pos = uniq.filter((u) => [...u.codes].some((c) => c.endsWith('+'))).length;
const neg = uniq.filter((u) => [...u.codes].some((c) => c.endsWith('-'))).length;
console.log(`\n肯定の符号を含む：${pos} 件、否定・要望の符号を含む：${neg} 件（両方を含む件は両方に数える）`);
console.log(bad ? `\n✗ 確かめで ${bad} 件の誤り` : '\n✓ すべての語句が、指定した口コミの原文にそのまま出る');
process.exit(bad ? 1 : 0);
