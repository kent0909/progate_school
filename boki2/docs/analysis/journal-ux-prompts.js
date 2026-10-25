#!/usr/bin/env node
// 仕訳・分類を問う画面の「問いの文」と「札の文」を、ラーメン版の台本（ramen.html が読む js/sim/*.js）から全部拾って数える。
// DESIGN-JOURNAL-UX.md 2章の表の元データ。頭の中で数えない（QUALITY 6.2）。
// Usage: node boki2/docs/analysis/journal-ux-prompts.js [--tsv 出力先]
//  数える対象（画面＝engine.js の関数）：
//   board（boardScreen）  ：段ごとの q、tap/sort の tokens.label、note の lines.title・cards.label、dests.label
//   discover（discoverScreen）：b2.q・predict.q、b2.token、b2.tokens.label、b2.targets.label
//   namings（namingScreen）：q と opts.t（新しい札の問い）
//   kindIntro（introScreen）：q（はじめての書類の問い）
//   calc（calcScreen）     ：q（計算の作業台）
//   doc（docScreen）       ：問いは engine.js の固定の1文。札は勘定科目名（opts）。書類の種類（kind）と題（title）の数を出す
//  まずさの印：
//   「A：B」    ：文の中に全角コロンで2つの文をつないでいる（engine が作る「{出来事}：{札}」も数える）
//   手がかりなし ：左右（列・棚）を選ばせる問いなのに、何を見て決めるか（何があるか／どこから来たか、増えた／へった）が文にない
//   何の数か不明 ：札に金額だけが付き、増えた／へった・何の額かが分からない
//   60字超       ：1文60字を超える（PEDAGOGY 10.6 の検査と同じ目安）
global.window = global;
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');
const STORY = require(path.join(root, 'tools', 'ramen-files.js')).story;
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/data/siblings.js', 'js/sim/lexicon.js', ...STORY].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA;
const S0 = { decisions: {}, W: null, res: {}, pols: {}, L: [], taught: [], mode: '2026' };
const rows = [];
const add = (screen, where, kind, id, text, extra = {}) => { if (text == null || text === '') return; rows.push({ screen, where, kind, id, text: String(text), ...extra }); };
const CUE = /何があるか|どこから来たか|増え|ふえ|へっ|減っ|もっているもの|左の棚|右の棚|左の列|右の列|借方|貸方/;
const SIDEQ = /左|右|列|棚|どちら|どっち/;
const flags = (r) => {
  const f = [];
  if (/：/.test(r.text) && !/^[^：]{1,8}：/.test(r.text)) f.push('A：B'); // 先頭の短い見出し（「摘要：」など）は除く
  if (r.kind === 'q' && SIDEQ.test(r.text) && !CUE.test(r.text)) f.push('手がかりなし');
  if (r.kind === 'token' && /[\d,]{3,}$/.test(r.text) && !/増|減|へ|ふ|＋|−|-/.test(r.text)) f.push('何の数か不明');
  if (r.text.replace(/\s/g, '').length > 60) f.push('60字超');
  return f;
};
// --- board（プロローグ） ---
const B = D.y1.prologue;
B.steps.forEach((s, i) => {
  add('board', `prologue.steps[${i}]`, 'q', `${B.id}:${i}:${s.k}`, s.q, { k: s.k });
  (s.tokens || []).forEach((t) => add('board', `prologue.steps[${i}].tokens`, 'token', t.id, `${t.label} ${typeof t.amt === 'number' ? t.amt.toLocaleString('ja-JP') : t.amt}`, { k: s.k }));
  (s.dests || []).forEach((d) => add('board', `prologue.steps[${i}].dests`, 'target', d.id, d.label, { k: s.k }));
  (s.lines || []).forEach((l, li) => {
    add('board', `prologue.steps[${i}].lines[${li}]`, 'title', `${li}`, l.title, { k: s.k });
    l.cards.forEach((c, ci) => {
      add('board', `prologue.steps[${i}].lines[${li}].cards[${ci}]`, 'token', `${li}-${ci}`, `${c.label} ${typeof c.amt === 'number' ? c.amt.toLocaleString('ja-JP') : c.amt}`, { k: s.k });
      // engine.js boardScreen が画面に出す形「{出来事}：{札} {金額}」（1206行）
      add('board', `engine.boardScreen note`, 'shown', `${li}-${ci}`, `${l.title}：${c.label} ${typeof c.amt === 'number' ? c.amt.toLocaleString('ja-JP') : c.amt}`, { k: 'note-shown' });
    });
    if (l.ask) add('board', `prologue.steps[${i}].lines[${li}].ask`, 'q', `${li}:ask`, l.ask.say.map((x) => x[1]).join(''), { k: 'ask' });
  });
});
// --- discover ---
const seenDisc = new Set();
const discs = [];
D.months.forEach((m, mi) => m.events.forEach((e) => { if (e.t === 'discover' && !seenDisc.has(e.id)) { seenDisc.add(e.id); discs.push({ e, mi }); } }));
discs.forEach(({ e, mi }) => {
  let ev = e;
  try { if (ev.b2 && typeof ev.b2.tokens === 'function') ev = Object.assign({}, ev, { b2: Object.assign({}, ev.b2, { tokens: ev.b2.tokens(S0) }) }); } catch (x) { /* 状態が要る札は数だけ */ }
  const b2 = ev.b2 || {};
  add('discover', `months[${mi}] ${ev.id}`, 'q', `${ev.id}:b2`, b2.q, { layout: b2.layout });
  if (ev.predict) add('discover', `months[${mi}] ${ev.id}`, 'q', `${ev.id}:predict`, ev.predict.q, { layout: 'predict' });
  if (b2.token) add('discover', `months[${mi}] ${ev.id}`, 'token', `${ev.id}:token`, b2.token, { layout: b2.layout });
  (Array.isArray(b2.tokens) ? b2.tokens : []).forEach((t) => add('discover', `months[${mi}] ${ev.id}`, 'token', `${ev.id}:${t.id}`, t.label, { layout: b2.layout }));
  (b2.targets || []).forEach((g) => add('discover', `months[${mi}] ${ev.id}`, 'target', `${ev.id}:${g.id}`, g.label + (g.sub ? `／${g.sub}` : ''), { layout: b2.layout }));
  // engine.js discoverScreen の sort の aria-label「{札}：{箱}」（1584行）
  if (b2.layout === 'sort' || b2.layout === 'flow') (Array.isArray(b2.tokens) ? b2.tokens : []).forEach((t) => (b2.targets || []).forEach((g) => add('discover', 'engine.discoverScreen sort aria-label', 'shown', `${ev.id}:${t.id}:${g.id}`, `${t.label}：${g.label}`, { layout: 'sort-aria' })));
});
// --- namings / kindIntro ---
Object.entries(D.namings).forEach(([acc, N]) => { add('naming', `namings.${acc}`, 'q', acc, N.q); });
Object.entries(D.kindIntro).forEach(([k, N]) => { add('kindIntro', `kindIntro.${k}`, 'q', k, N.q); });
// --- calc ---
const seenCalc = new Set();
D.months.forEach((m, mi) => m.events.forEach((e) => { if (e.t === 'calc' && !seenCalc.has(e.id)) { seenCalc.add(e.id); add('calc', `months[${mi}] ${e.id}`, 'q', e.id, e.q); } }));
// --- doc：問いは engine の固定文。書類の種類と題の数 ---
const DOC_ASK = 'この書類の出来事を、帳簿に書こう。金額は、書類の数字を押しても入る。'; // engine.js docScreen 1344行
add('doc', 'engine.docScreen', 'q', 'docScreen', DOC_ASK);
add('doc', 'engine.docScreen fix', 'q', 'docScreen:fix', '森さん「この書類、もう一度見てみよう」');
const docKinds = new Map(), docTitles = new Set(); let docN = 0;
D.months.forEach((m) => m.events.forEach((e) => { if (e.t === 'doc') { docN++; docKinds.set(e.kind, (docKinds.get(e.kind) || 0) + 1); try { docTitles.add(typeof e.doc.title === 'function' ? e.doc.title(S0) : e.doc.title); } catch (x) { docTitles.add(`(関数) ${e.id}`); } } }));
// 書類の札（勘定科目の選択肢）：全書類の opts と答えの科目の和集合
const accs = new Set();
D.months.forEach((m) => m.events.forEach((e) => { if (e.t === 'doc') { (e.opts || []).forEach((a) => accs.add(a)); try { const t = typeof e.ans === 'function' ? e.ans(S0) : e.ans; [...t.dr, ...t.cr].forEach(([a]) => accs.add(a)); } catch (x) { /* 状態が要る */ } } }));
// --- 集計 ---
rows.forEach((r) => { r.flags = flags(r); });
const by = (k) => rows.reduce((o, r) => { o[r[k]] = (o[r[k]] || 0) + 1; return o; }, {});
const out = [];
out.push('# 問いの文・札の文の洗い出し（journal-ux-prompts.js の出力）');
out.push(`台本のファイル：${STORY.join(' ')}`);
out.push(`行の数（問い・札・箱・見出し・engine が作る表示）：${rows.length}`);
out.push(`画面ごと：${JSON.stringify(by('screen'))}`);
out.push(`種類ごと：${JSON.stringify(by('kind'))}`);
const fc = {}; rows.forEach((r) => r.flags.forEach((f) => { fc[f] = (fc[f] || 0) + 1; }));
out.push(`まずさの印ごと：${JSON.stringify(fc)}`);
out.push(`問いの文（kind=q）：${rows.filter((r) => r.kind === 'q').length}　うち手がかりなし：${rows.filter((r) => r.kind === 'q' && r.flags.includes('手がかりなし')).length}`);
out.push(`札の文（kind=token）：${rows.filter((r) => r.kind === 'token').length}　うち何の数か不明：${rows.filter((r) => r.kind === 'token' && r.flags.includes('何の数か不明')).length}`);
out.push(`「A：B」の形（engine が作る表示を含む）：${rows.filter((r) => r.flags.includes('A：B')).length}（台本の文：${rows.filter((r) => r.flags.includes('A：B') && r.kind !== 'shown').length}・engine が組む表示：${rows.filter((r) => r.flags.includes('A：B') && r.kind === 'shown').length}）`);
out.push(`書類（t: 'doc'）の出来事の数：${docN}　書類の種類（kind）：${docKinds.size}　題（title）の種類：${docTitles.size}　札（勘定科目の選択肢）の種類：${accs.size}`);
out.push(`発見（discover）の数：${discs.length}　layout ごと：${JSON.stringify(discs.reduce((o, { e }) => { const l = (e.b2 || {}).layout || '-'; o[l] = (o[l] || 0) + 1; return o; }, {}))}`);
console.log(out.join('\n'));
const tsvPath = process.argv.includes('--tsv') ? process.argv[process.argv.indexOf('--tsv') + 1] : path.join(__dirname, 'journal-ux-prompts.tsv');
fs.writeFileSync(tsvPath, ['screen\twhere\tkind\tid\tflags\ttext', ...rows.map((r) => [r.screen, r.where, r.kind, r.id, r.flags.join('・'), r.text.replace(/\t|\n/g, ' ')].join('\t'))].join('\n') + '\n');
fs.writeFileSync(path.join(__dirname, 'journal-ux-prompts.out.txt'), out.join('\n') + '\n\n## 書類の種類（kind）と数\n' + [...docKinds.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}\t${n}`).join('\n') + '\n\n## 書類の題\n' + [...docTitles].sort().join('\n') + '\n\n## 札（勘定科目）\n' + [...accs].sort().join('\n') + '\n');
console.log(`TSV: ${tsvPath}`);
