#!/usr/bin/env node
const fs = require('fs');
// BIZ-FUNVISUAL 5章の優先順の点数（K53：点数の付け方を先に決め、その点で並べる）。
// 使い方：node boki2/docs/analysis/funvisual-priority.js
// 点 = a（効く鎖の数：「うまくいく理由」と「うまくいかない理由」の鎖のうち、その項目が起こす・直すもの）
//     + b（支える資料の数。読了ノートの文書の数、上限8）
//     + floor(c/25)（支える声の件数。2章の符号の件数の和）
//     + 2×d（今のチープさ〔鎖C〕・だれ〔鎖A・B・C'〕を直す大きさ 0〜2）
//     + 2×e（周回への効き 0〜2。オーナーの「周回したくなる要素」）
// d と e は書き手の【見立て】。a・b・c は数えられる。
// 版0.3（論証の検査 10章 N12b）：声 W（やれることの多さ）を「店の外の事業」に丸ごと数えるのをやめ、funvisual-w-split.txt で件ごとに中身で振り分けた
//   Wp（作る物の組み合わせ・種類の多さ）は「一杯の組み立て」に、Wo（店の外の事業の多さ）は「店の外の事業」に、Ws（店の運営・全体の多さ）はどの項目にも数えない。
// 版0.4：Ws を全件読み直して Wm（店の中の具体）38・Wn（中身を言わない）38・Wb（店の中と外の両方）2 に分け、取りこぼしの2件を Wo に移した（Wo 7）。Wo と Wb を「店の外の事業」に数え、Wm・Wn はどこにも数えない。
// 害の鎖（I：店の外が店を食う）は加点の a から外した（条件として本文に書く）。
// 同点は c（声の件数）の多い順。順は見立て1段で入れ替わるので、本文では「上位の組」として読む（funvisual-priority-sensitivity.js）。
const items = [
  { n: '毎回変わる町・相手・相場と周回の持ち越し', old: 7, chains: ['10', '3', '6'], src: ['r5-fv-capilab-home', 'r5-fv-mohawk-offworld', 'r5-fv-matchstick-offworld', 'r4-cinc-applion-reviews', 'r5-fv-capilab-beginners', 'r5-fv-wiki-offworld'], voices: { I: 55 }, d: 1, e: 2 },
  { n: '店・一杯・客を絵にする（絵と音の作り手を置く）、締めの儀式', old: 3, chains: ['7', 'C'], src: ['r5-fv-wiki-minimetro', 'r5-fv-cgm-twopoint', 'r5-fv-pcgi-twopoint', 'r4-sim-denfami-kairosoft', 'r5-fv-gamesasylum-startup', 'r5-fv-gd-juice', 'r5-fv-applion-cinc-app', 'r5-fv-applion-ramenkan-app', 'r5-fv-capilab-home'], voices: { H1: 57, H2: 12, H3: 35, H4: 15 }, d: 2, e: 1 },
  { n: '店の外の事業の変数（土地・賃貸・工場・農地・通販・M&A・資金）と、店→会社へ段が変わる形', old: null, chains: ['0'], src: ['r4-cinc-applion-reviews', 'r5-cinc-applion-p2', 'r5-cinc-applion-p4', 'r5-fv-capilab-home', 'r4-cinc-applizm-kojinsisan', 'r6-sd-gamesfuze-bigambitions-rivals', 'r5-fv-wiki-twopointhospital', 'r6-sd-gamediscover-bigambitions'], voices: { BV: 22, BVR: 18, Wo: 7, Wb: 3 }, d: 1, e: 2 },
  { n: '一杯の組み立て＋名づけ（現実に沿って当てられる相性）', old: 1, chains: ['1', '2', '9'], src: ['r5-fv-applion-ramenkan-app', 'r5-fv-applion-gamedevstory', 'r5-fv-gd-gamedevstory', 'r5-fv-mogura-ramenkan', 'r5-fv-applion-gurume-app', 'r5-fv-applion-ramenkan-zenkoku'], voices: { A1: 83, A2: 16, A3: 16, B: 32, Wp: 24 }, d: 1, e: 1 },
  { n: '客の個性と物語（客を同じ線の約束で大勢描き分け、注文を読む）', old: null, chains: ['8', '7'], src: ['r5-fv-wiki-goodpizza', 'r5-fv-pmq-goodpizza', 'r5-fv-applion-goodpizza', 'r5-fv-applion-goodpizza-app'], voices: { F: 74, RD: 25 }, d: 2, e: 1 },
  { n: '設計の言語（意味の色・罫・余白・数字の帯・小さな線・地図の印）', old: 2, chains: ['C'], src: ['r5-fv-tufte-sparkline', 'r5-fv-wiki-minimetro', 'r5-fv-applion-cinc-app', 'r5-fv-capilab-home', 'r5-fv-applion-goodpizza-app'], voices: { H3: 35 }, d: 2, e: 0 },
  { n: '段の目標と、新しい仕組みを伴う解放・前の店に戻る・クリア後の目標', old: 4, chains: ['4', '5', 'A'], src: ['r5-fv-pcgi-twopoint', 'r5-fv-sixthaxis-twopoint', 'r5-fv-applion-gamedevstory', 'r5-fv-pocketgamer-lemonadetycoon', 'r5-fv-applion-ramenkan-zenkoku'], voices: { D1: 44, D2: 16, D3: 59, L2: 13 }, d: 1, e: 1 },
  { n: '品目・エリアごとに効く手の違いと詰まりの表示', old: 5, chains: ['3', 'B'], src: ['r5-fv-capilab-beginners', 'r5-fv-matchstick-offworld', 'r5-fv-wiki-csd', 'r5-fv-digdl-gamedevtycoon'], voices: { E: 43 }, d: 1, e: 1 },
  { n: '両方向の小さな出来事（3条件）・予告つきの大事件・町の新聞', old: 6, chains: ['6', '8', 'D'], src: ['r5-fv-applion-gamedevstory', 'r5-fv-applion-goodpizza', 'r5-fv-sixthaxis-twopoint', 'r5-fv-wiki-offworld', 'r5-fv-pmq-goodpizza', 'r5-fv-gd-mgmtdepth'], voices: { G1: 9, G2: 5, FR: 13, M2: 4 }, d: 1, e: 2 },
  { n: '全店の一覧・型・複製・並べ替え・委任', old: 9, chains: ['E'], src: ['r4-cinc-applion-reviews', 'r5-fv-wiki-twopointhospital', 'r6-sd-gamesfuze-bigambitions-pricing'], voices: { N: 56 }, d: 1, e: 0 },
  { n: '題材に固有の変数と、極端な値に届く道', old: 10, chains: ['B'], src: ['r5-fv-gd-mgmtdepth', 'r4-sim-tynan-simdream'], voices: { L3: 19 }, d: 1, e: 1 },
  { n: '飾り×人の特性×客層', old: 11, chains: ['3'], src: ['r5-fv-pcgi-twopoint', 'r5-fv-cgm-twopoint'], voices: {}, d: 1, e: 0 },
  { n: '判定の一貫性と、重ねると見える理由', old: 13, chains: ['D', '1'], src: ['r5-fv-applion-goodpizza', 'r5-fv-applion-gamedevstory'], voices: { M1: 24 }, d: 1, e: 0 },
  { n: '数字の手ざわり（合った瞬間の止めと音）', old: 12, chains: [], src: ['r5-fv-gd-juice'], voices: { C1: 44 }, d: 1, e: 0 },
  { n: 'のんびりの設定と本番の設定、止めて考えられる', old: 14, chains: [], src: ['r5-fv-wiki-csd', 'r5-fv-matchstick-offworld'], voices: { J1: 71 }, d: 0, e: 1 },
  { n: '寄り道（すごろく型の行商に判断の手を足す）', old: null, chains: ["C'"], src: ['r5-fv-applion-ramenkan-zenkoku'], voices: { SG: 13 }, d: 1, e: 1 },
  { n: '共有の相場（町で数が限られる物：製麺所の枠・居抜き物件・人・地元の野菜）', old: 8, chains: ['3', '10'], src: ['r5-fv-matchstick-offworld', 'r4-ramen-maff-komugi2610', 'r4-ramen-maff-kyodo-hokkaido'], voices: {}, d: 0, e: 1 },
];
const fs2 = fs;
const sc = items.map((it) => { const a = it.chains.length, b = Math.min(8, it.src.length), c = Object.values(it.voices).reduce((s, v) => s + v, 0); return { ...it, a, b, c, s: a + b + Math.floor(c / 25) + 2 * it.d + 2 * it.e }; });
// 声の数を符号の表から数え直して、items の数と合うかを確かめる
const path = require('path');
const cnt = {};
for (const l of fs.readFileSync(path.join(__dirname, 'funvisual-voices-codes.txt'), 'utf8').split('\n')) { if (!l || l.startsWith('#')) continue; for (const c of l.trim().split(/\s+/).slice(2)) cnt[c] = (cnt[c] || 0) + 1; }
for (const l of fs.readFileSync(path.join(__dirname, 'funvisual-w-split.txt'), 'utf8').split('\n')) { if (!l || l.startsWith('#')) continue; const c = l.trim().split(/\s+/)[2]; cnt[c] = (cnt[c] || 0) + 1; }
for (const it of items) for (const [k, v] of Object.entries(it.voices)) if (cnt[k] !== v) console.log(`注意：${it.n.slice(0, 12)} の ${k} は表では ${cnt[k]}、items では ${v}`);
sc.sort((x, y) => y.s - x.s || y.c - x.c);
console.log('| 新しい順 | 項目 | a 鎖 | b 資料 | c 声 | d | e | 点 | 版0.1 の順 |');
console.log('|---|---|---|---|---|---|---|---|---|');
sc.forEach((it, i) => console.log(`| ${i + 1} | ${it.n} | ${it.a} | ${it.b} | ${it.c} | ${it.d} | ${it.e} | ${it.s} | ${it.old ?? '（新）'} |`));
