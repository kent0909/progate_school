#!/usr/bin/env node
// BIZ-FUNVISUAL 2章の利用者の声を数える（QUALITY 6.2-2：件数は道具で数える）。
// 使い方：node boki2/docs/analysis/funvisual-voices.js        （集計の表を出す）
//         node boki2/docs/analysis/funvisual-voices.js --list C1   （その符号の件を本文の頭つきで並べる。数え直しの確かめ用）
// 入力：①原文 research/raw/web/simgames/r5-fv-applion-*.html と Coffee Inc 2 の r4-cinc-applion-reviews.html・r5-cinc-applion-p2〜p7.html（APPLION の口コミのページ。git に入らないので手元にあるときだけ照合）
//       ②符号 docs/analysis/funvisual-voices-codes.txt（1行1件。書き手が1件ずつ読んで付けた）
// 照合：ページごとの件数が原文と符号で一致しないとエラーで止まる。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const RAW = path.join(ROOT, 'research', 'raw', 'web', 'simgames');
const CODES = path.join(__dirname, 'funvisual-voices-codes.txt');

const DEF = {
  // 褒め
  C1: '数字・値・お金・会社が少しずつ伸びることを具体に言う', C2: '結果の言葉だけ（時間を忘れた・ハマった・やり込める・長く続く）',
  A1: '自分で作る・組む自由', A2: '隠れた好み・予想外の評価・手探り', A3: '現実に沿う・現実を参考にすると当たる・現実のもじり', A4: '想像の余地・試したくなる',
  B: '名前をつける・愛着・記録・役を演じる', W: 'やれること・要素・選択肢の多さ、奥の深さ', WX: '要素の絡み合いを言う',
  D1: '新しい仕組み・要素・食材の解放、更新', D2: '店・事務所・地域が広がる', D3: '段の目標・大会・賞・グランプリ',
  E: '経営の手ごたえ（値段と原価・資金繰り・投資・雇用）', F: '客・人物の個性・物語・世界', RD: '注文を読み解く・覚える技能',
  FR: '失敗・赤字からの立て直しを楽しむ', G1: '出来事が多い・予告つきの大事件', G2: '予告なしの揺れ・乱数・故障を楽しむ',
  H1: '絵（ドット絵・キャラ・飾り）', H2: '音・曲', H3: '操作・画面の分かりやすさ・テンポ', H4: '小さな動き・演出を眺める', HL: '見た目の簡素さを肯定する',
  I: '周回・再訪・持ち越し', J1: 'せかされない・自分のペース・隙間時間・待ちの楽しみ', J2: '買い切り・課金や広告が少ない・無料で遊べる',
  K: '作り手への信頼・ファン', V: '配信・動画で知った', X: '題材が好き・その仕事の気分', ED: '学び・練習になる', DF: '難しさ・手ごたえを好む',
  SG: 'すごろく・ミニゲームを楽しむ', PP: 'ライバルが出ることを好む',
  BV: '店の外の事業の変数（株・不動産・融資・上場・買収・豆の栽培・投資）を楽しむ（Coffee Inc 2 で足した）', BVR: '店の外の事業の変数をもっと欲しがる（別業種の買収・社債・子会社など）', BVN: '店の外の事業が店の遊びを食う・面白くない',
  // 不満
  R: '不具合・動作・保存が消える', L1: '中身の谷・やることがなくなる・物語が尽きる', L2: '目標が消える・クリア後・終わりが早い', L3: '作業感・繰り返し', L4: '易しすぎ',
  M1: '注文・評価の判定が一貫しない（不具合を含む）', M2: '悪い方だけの出来事・対処の手がない', M3: '運が強すぎ・罰が重い',
  N: '一覧・並べ替え・テンポ・操作・保存数の不満', O: '初めの複雑さ・説明不足', S: '題材の要素の不足・もっと増やしてほしい',
  P: 'ライバルへの不満・ライバルとの勝負', Q: '支配的な手・抜け道・裏技', T: '課金・広告・スタミナへの不満', U: '難しすぎ', Y: '値段が高い', SGm: 'すごろくを嫌う', NG: '全体に物足りない',
};
const KAIRO = new Set(['ramenkan', 'zenkoku', 'gurume', 'gds']);
const NAME = { gdt: 'Game Dev Tycoon', cinc: 'Coffee Inc 2', ramenkan: 'ラーメン館（買い切り）', zenkoku: 'ラーメン館 全国編', gurume: '大盛グルメ食堂', gds: 'ゲーム発展国++', pizza: 'グッドピザ' };
const BASE = { gdt: 'r6-sd-applion-gamedevtycoon', cinc: 'r5-cinc-applion', ramenkan: 'r5-fv-applion-ramenkan', zenkoku: 'r5-fv-applion-ramenkan-zenkoku', gurume: 'r5-fv-applion-gurume', gds: 'r5-fv-applion-gamedevstory', pizza: 'r5-fv-applion-goodpizza' };
const PAGES = { gdt: 1, cinc: 7, ramenkan: 1, zenkoku: 10, gurume: 2, gds: 10, pizza: 10 };

// 符号を読む
const rows = fs.readFileSync(CODES, 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => { const [w, pi, ...c] = l.trim().split(/\s+/); const [p, i] = pi.split('-').map(Number); return { w, p, i, c: c.filter((x) => x !== '-') }; });
for (const r of rows) for (const c of r.c) if (!DEF[c]) { console.error(`未定義の符号 ${c}（${r.w} ${r.p}-${r.i}）`); process.exit(1); }

// 原文からページごとの口コミを取り出す（★の行で区切る）
const strip = (s) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<(br|\/p|\/div|\/li|\/h\d)[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
const pageFile = (w, p) => path.join(RAW, w === 'gdt' ? 'r6-sd-applion-gamedevtycoon.html' : w === 'cinc' ? (p === 1 ? 'r4-cinc-applion-reviews.html' : `r5-cinc-applion-p${p}.html`) : `${BASE[w]}${p === 1 ? '' : '-p' + p}.html`);
const reviews = {}; const dist = {}; let haveRaw = true;
for (const w of Object.keys(PAGES)) for (let p = 1; p <= PAGES[w]; p++) {
  const f = pageFile(w, p);
  if (!fs.existsSync(f)) { haveRaw = false; continue; }
  const L = strip(fs.readFileSync(f, 'utf8'));
  const s = L.findIndex((l) => l.includes('評価とおすすめ口コミ')); const e = L.findIndex((l) => l.includes('このアプリのレビューやランキングの詳細情報'));
  let block = L.slice(s + 1, e);
  if (p === 1) { // ページ上部の全体の評価：平均、5つ星〜1つ星の件数
    const avg = block[0]; const n = []; for (let k = 5; k >= 1; k--) { const j = block.indexOf(`${k}つ星`); n.push(+(block[j + 1] || '0').replace(/,/g, '')); }
    dist[w] = { avg, n }; block = block.slice(11);
  } else if (/つ星/.test(block[1] || '')) block = block.slice(11);
  let cur = [], i = 0;
  for (const l of block) { const m = l.match(/(★[★☆]{4})/); if (m) { i++; (reviews[w] = reviews[w] || []).push({ p, i, star: (m[1].match(/★/g) || []).length, t: cur.join(' ') }); cur = []; } else cur.push(l); }
}
if (haveRaw) for (const w of Object.keys(PAGES)) for (let p = 1; p <= PAGES[w]; p++) {
  const a = (reviews[w] || []).filter((r) => r.p === p).length, b = rows.filter((r) => r.w === w && r.p === p).length;
  if (a !== b) { console.error(`件数の不一致：${w} ${p}ページ 原文${a}件・符号${b}件`); process.exit(1); }
}

if (process.argv.includes('--dump')) { rows.forEach((r) => { const t = haveRaw ? (reviews[r.w].find((x) => x.p === r.p && x.i === r.i) || {}).t || '' : ''; console.log(`${r.w}\t${r.p}-${r.i}\t${r.c.join(' ')}\t${t.replace(/\s+/g, ' ')}`); }); process.exit(0); }
const list = process.argv.indexOf('--list');
if (list >= 0) { const c = process.argv[list + 1]; rows.filter((r) => r.c.includes(c)).forEach((r) => { const t = haveRaw ? (reviews[r.w].find((x) => x.p === r.p && x.i === r.i) || {}).t || '' : ''; console.log(`${r.w} ${r.p}-${r.i} [${r.c.join(' ')}] ${t.slice(0, 80)}`); }); process.exit(0); }

const works = Object.keys(PAGES);
console.log(`原文の照合：${haveRaw ? '済（ページごとの件数が一致）' : '原文が手元にないので未照合'}`);
console.log(`件数：計 ${rows.length}（${works.map((w) => `${NAME[w]} ${rows.filter((r) => r.w === w).length}`).join('・')}）`);
console.log(`符号の数：${rows.reduce((s, r) => s + r.c.length, 0)}、どの符号も付けなかった件：${rows.filter((r) => !r.c.length).length}`);
if (haveRaw) {
  console.log('\n全体の評価の分布（各作品の1ページ目の上部）：');
  for (const w of works) { const d = dist[w]; const tot = d.n.reduce((a, b) => a + b, 0); const low = d.n[2] + d.n[3] + d.n[4]; console.log(`  ${NAME[w]}：平均 ${d.avg}／★5 ${d.n[0]}・★4 ${d.n[1]}・★3 ${d.n[2]}・★2 ${d.n[3]}・★1 ${d.n[4]}／計 ${tot}／★3以下 ${low}（${(100 * low / tot).toFixed(0)}%）`); }
  console.log('\n載っている口コミの星（ページに出た件の★）：');
  for (const w of works) { const s = [5, 4, 3, 2, 1].map((k) => reviews[w].filter((r) => r.star === k).length); console.log(`  ${NAME[w]}：★5 ${s[0]}・★4 ${s[1]}・★3 ${s[2]}・★2 ${s[3]}・★1 ${s[4]}`); }
}
console.log('\n符号ごとの件数（1件が複数に入る）：');
console.log(`| 符号 | 中身 | ${works.map((w) => NAME[w]).join(' | ')} | 計 | カイロソフト4作の割合 |`);
console.log(`|---|---|${works.map(() => '---').join('|')}|---|---|`);
const tally = Object.keys(DEF).map((c) => { const per = works.map((w) => rows.filter((r) => r.w === w && r.c.includes(c)).length); const tot = per.reduce((a, b) => a + b, 0); const k = works.filter((w) => KAIRO.has(w)).reduce((s, w, j) => s + rows.filter((r) => r.w === w && r.c.includes(c)).length, 0); return { c, per, tot, k }; });
for (const t of tally) console.log(`| ${t.c} | ${DEF[t.c]} | ${t.per.join(' | ')} | ${t.tot} | ${t.tot ? Math.round(100 * t.k / t.tot) + '%' : '—'} |`);
const kai = rows.filter((r) => KAIRO.has(r.w)).length;
console.log(`\nカイロソフト4作のページの件：${kai}/${rows.length}（${(100 * kai / rows.length).toFixed(0)}%）`);
// 合わせた見出し（本文で使う束ね）
const any = (cs) => rows.filter((r) => r.c.some((c) => cs.includes(c))).length;
const B = { 'A（作る・組む）': ['A1', 'A2', 'A3', 'A4'], 'C（積み上げ・ハマった）': ['C1', 'C2'], 'D（解放・段）': ['D1', 'D2', 'D3'], 'H（見た目・音・手ざわり）': ['H1', 'H2', 'H3', 'H4'], 'J（ペース・料金）': ['J1', 'J2'], 'L（だれ）': ['L1', 'L2', 'L3', 'L4'], 'M（理不尽）': ['M1', 'M2', 'M3'], 'F または RD（客・物語・読解）': ['F', 'RD'], 'G（出来事）': ['G1', 'G2'], 'BV 系（店の外の事業：楽しむ・欲しがる）': ['BV', 'BVR'] };
console.log('\n束ねた件数（どれか1つでも付いた件）：');
for (const [k, v] of Object.entries(B)) console.log(`  ${k}：${any(v)}`);

// オーナーの仮説（やれることの多さ・店の外の事業の変数）に直接かかわる件を作品ごとに
console.log('\n仮説にかかわる符号の作品ごとの件数（W＝やれることの多さ・深さ、BV・BVR・BVN＝店の外の事業、L1・L2・L3＝だれ、S＝要素の不足）：');
for (const w of works) { const n = rows.filter((r) => r.w === w).length; const c = (k) => rows.filter((r) => r.w === w && r.c.includes(k)).length; console.log(`  ${NAME[w]}（${n}件）：W ${c('W')}・BV ${c('BV')}・BVR ${c('BVR')}・BVN ${c('BVN')}・L1 ${c('L1')}・L2 ${c('L2')}・L3 ${c('L3')}・S ${c('S')}`); }

// 版0.4：W（やれることの多さ）の中身の振り分け（funvisual-w-split.txt。書き手1人が全件を読んで付けた）を作品ごとに数える
{
  const sp = path.join(__dirname, 'funvisual-w-split.txt');
  if (fs.existsSync(sp)) {
    const ws = fs.readFileSync(sp, 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.trim().split(/\s+/));
    const wRows = rows.filter((r) => r.c.includes('W'));
    const miss = wRows.filter((r) => !ws.some((x) => x[0] === r.w && x[1] === `${r.p}-${r.i}`));
    if (miss.length || ws.length !== wRows.length) console.log(`注意：W の件 ${wRows.length} と振り分け ${ws.length} が合わない（抜け ${miss.length}）`);
    const cls = ['Wp', 'Wo', 'Wb', 'Wm', 'Wn'];
    const lab = { Wp: '作る物の組み合わせ・種類', Wo: '店の外の事業', Wb: '店の中と外の両方', Wm: '店の中の具体の中身', Wn: '中身を言わない' };
    console.log(`\nW の中身の振り分け（計 ${ws.length}）：` + cls.map((c) => `${c} ${lab[c]} ${ws.filter((x) => x[2] === c).length}`).join('・'));
    for (const w of works) { const a = ws.filter((x) => x[0] === w); if (a.length) console.log(`  ${NAME[w]}：` + cls.map((c) => `${c} ${a.filter((x) => x[2] === c).length}`).join('・')); }
  }
}

// 版0.4：K（作り手への信頼）が、仕組みを褒める声に偏って付いているか（K の付く割合を符号ごとに）
{
  const pk = (a) => `${a.filter((r) => r.c.includes('K')).length}/${a.length}（${a.length ? Math.round((100 * a.filter((r) => r.c.includes('K')).length) / a.length) : 0}%）`;
  console.log(`\nK の付く割合：全体 ${pk(rows)}・` + ['A1', 'A2', 'D3', 'B', 'I', 'W', 'H1', 'C2', 'J2', 'BV'].map((c) => `${c} ${pk(rows.filter((r) => r.c.includes(c)))}`).join('・'));
}
