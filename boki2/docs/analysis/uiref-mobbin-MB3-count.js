#!/usr/bin/env node
// uiref-mobbin-MB3.md の数を数える（QUALITY 6.2：頭で数えない）。
// Usage: node boki2/docs/analysis/uiref-mobbin-MB3-count.js
const fs = require('fs');
const path = require('path');
const B = path.join(__dirname, '..', '..');
const doc = fs.readFileSync(path.join(__dirname, 'uiref-mobbin-MB3.md'), 'utf8');
const NOTES = path.join(B, 'research', 'notes', 'mobbin-mcp', 'screens');
const RAW = path.join(B, 'research', 'raw', 'mobbin-mcp', 'screens');

// 1. 実例の台帳の行（| Q数字 | で始まる行）
const rows = doc.split('\n').filter((l) => /^\| Q\d+ \|/.test(l));
const app = (l) => l.split('|')[2].trim().split(/[：「（]/)[0].trim();
const byApp = {};
rows.forEach((l) => { const a = app(l); byApp[a] = (byApp[a] || 0) + 1; });
const duo = rows.filter((l) => /^Duolingo/.test(app(l))).length;
console.log(`実例の台帳の行: ${rows.length}`);
console.log(`アプリの種類: ${Object.keys(byApp).length}`);
console.log(`Duolingo（ABC を含む）が主の行: ${duo} / ${rows.length} = ${(100 * duo / rows.length).toFixed(1)}%`);
console.log('行の多いアプリ: ' + Object.entries(byApp).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([a, n]) => `${a} ${n}`).join('、'));

// 2. 本文が引く Mobbin の画面・流れ
const scr = new Set([...doc.matchAll(/mobbin\.com\/screens\/([0-9a-f-]{36})/g)].map((m) => m[1]));
const flw = new Set([...doc.matchAll(/mobbin\.com\/flows\/([0-9a-f-]{36})/g)].map((m) => m[1]));
console.log(`本文が引く画面の URL: ${scr.size}、流れの URL: ${flw.size}`);

// 3. MB3 が書いた読了ノート（本文に「担当 MB3」）と、その原寸・見た所
const mine = fs.readdirSync(NOTES).filter((f) => fs.readFileSync(path.join(NOTES, f), 'utf8').includes('担当 MB3'));
let rawOk = 0, minLen = 1e9, web = 0, flowNotes = 0;
for (const f of mine) {
  const s = fs.readFileSync(path.join(NOTES, f), 'utf8');
  const id = f.replace(/\.md$/, '');
  if (fs.existsSync(path.join(RAW, id + '.jpg'))) rawOk++;
  const m = s.match(/image_seen: "(.*)"/); if (m) minLen = Math.min(minLen, [...m[1]].length);
  if (/（PC/.test(m ? m[1] : '')) web++;
  if (/流れ https:\/\/mobbin\.com\/flows\//.test(s)) flowNotes++;
}
console.log(`MB3 の読了ノート: ${mine.length}（うち流れの画面 ${flowNotes}、単独の画面 ${mine.length - flowNotes}、PC ${web}）`);
console.log(`原寸の画像がある: ${rawOk} / ${mine.length}`);
console.log(`image_seen の最短: ${minLen} 字`);
const ids = new Set(mine.map((f) => f.replace(/\.md$/, '')));
const notMine = [...scr].filter((i) => !ids.has(i) && !fs.existsSync(path.join(NOTES, i + '.md')));
console.log(`本文が引く画面のうちノートが無いもの: ${notMine.length}`);

// 4. 取得記録（research-fetch）の行
const led = fs.readFileSync(path.join(B, 'research', 'ledger.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
const fetched = new Set(led.filter((o) => o.src === 'mobbin-mcp' && o.status === 200 && o.via === 'research-fetch' && ids.has(o.doc)).map((o) => o.doc));
console.log(`MB3 のノートの画面のうち research-fetch の取得記録があるもの: ${fetched.size} / ${ids.size}`);

// 5. 検索の記録の行
const srch = doc.split('\n').filter((l) => /^\| S\d+ \|/.test(l));
console.log(`検索の記録: ${srch.length} 回（screens ${srch.filter((l) => /screens/.test(l)).length}、flows ${srch.filter((l) => /\| flows/.test(l)).length}）`);
