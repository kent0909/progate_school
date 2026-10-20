#!/usr/bin/env node
// 結末（SIM.endings）が画面に出す法令の条文番号が、一次資料で確かめた読了ノート（research/notes/law/）にあるかを調べる。
// 「〇〇法123条」「会社計算規則5条」の形を拾い、ノートの本文・pages: に同じ法令名と条番号が出ているかで判定する。
// Usage: node boki2/tools/law-check.js
global.window = global;
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
['js/core.js', 'js/data/accounts.js', 'js/sim/scenario.js'].forEach((f) => require(path.join(root, f)));
const D = window.SIMDATA;
const dir = path.join(root, 'research', 'notes', 'law');
const lsr = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? lsr(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const notes = lsr(dir).filter((p) => p.endsWith('.md')).map((p) => ({ p, t: fs.readFileSync(p, 'utf8').normalize('NFKC') }));
const kanji = { 〇: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
// ノートの中の「第四百三十二条」も数字に直して探す
const kanjiNum = (s) => { let n = 0, cur = 0; for (const ch of s) { if (ch in kanji) cur = kanji[ch]; else if (ch === '十') { n += (cur || 1) * 10; cur = 0; } else if (ch === '百') { n += (cur || 1) * 100; cur = 0; } else if (ch === '千') { n += (cur || 1) * 1000; cur = 0; } } return n + cur; };
const noteHas = (law, art) => notes.some(({ t }) => {
  if (!t.includes(law)) return false;
  const nums = new Set([...t.matchAll(/第?(\d+)条/g)].map((m) => Number(m[1])).concat([...t.matchAll(/第([〇一二三四五六七八九十百千]+)条/g)].map((m) => kanjiNum(m[1]))));
  return nums.has(art);
});
const texts = [];
const walk = (x, where) => { if (typeof x === 'string') texts.push([where, x]); else if (Array.isArray(x)) x.forEach((y, i) => walk(y, where)); else if (x && typeof x === 'object') Object.entries(x).forEach(([k, v]) => walk(v, `${where}.${k}`)); };
const S0 = { decisions: {}, L: [], T: [] };
for (const [id, E] of Object.entries(D.endings)) {
  for (const k of ['reality', 'lesson', 'cause']) { const v = typeof E[k] === 'function' ? E[k](S0) : E[k]; walk(v, `${id}.${k}`); }
  try { walk(typeof E.docs === 'function' ? E.docs(S0) : E.docs, `${id}.docs`); } catch (e) { /* 判断しだいの書類は飛ばす */ }
}
const errors = [], seen = [];
for (const [where, t] of texts) {
  const norm = t.normalize('NFKC');
  // 「民法415条・419条」のように法令名が1つで条番号が続く形も拾う
  for (const m of norm.matchAll(/([一-龥ァ-ヶー]+?(?:法|規則|令))((?:\d+条(?:の\d+)?(?:\d+項)?[・、]?)+)/g)) {
    const law = m[1].replace(/^(.*?)(民法|会社法|破産法|会社計算規則|労働基準法|民事保全法|.+)$/, '$2');
    for (const a of m[2].matchAll(/(\d+)条/g)) {
      const art = Number(a[1]);
      seen.push(`${law}${art}条`);
      if (!noteHas(law, art)) errors.push(`${where}：${law}${art}条 を確かめた読了ノートがない（research/notes/law/）`);
    }
  }
}
if (errors.length) { console.error([...new Set(errors)].join('\n')); process.exit(1); }
console.log(`OK：結末に出る法令の条文 ${[...new Set(seen)].length} 件（${[...new Set(seen)].join('・')}）をすべて一次資料のノートで確認`);
