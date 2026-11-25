// 判定役（11/25）：rules.md 1章の 25か所×9規則（X1 X2 X2b X3 X4 X5 L A U）から無作為に18マス。種 1125、mulberry32。
// X1 と X2 は別に、全25行を手で確かめる（判定書の「規則の当てはめの確かめ」）。
const fs = require('fs');
const t = fs.readFileSync('/home/user/progate_school/boki2/docs/analysis/stationmap-kojo-draft/out3/rules.md', 'utf8').split('\n');
const rows = t.filter((l) => /^\| s\d{3}-\d/.test(l)).map((l) => l.split('|').slice(1, -1).map((x) => x.trim()));
const hdr = t.find((l) => l.startsWith('| id |')).split('|').slice(1, -1).map((x) => x.trim());
const R = ['X1', 'X2', 'X2b', 'X3', 'X4', 'X5', 'L', 'A', 'U'];
let s = 1125; const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let q = Math.imul(s ^ s >>> 15, 1 | s); q = q + Math.imul(q ^ q >>> 7, 61 | q) ^ q; return ((q ^ q >>> 14) >>> 0) / 4294967296; };
const cells = []; rows.forEach((r) => R.forEach((k) => cells.push([r, k])));
for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
console.log('マス', cells.length);
cells.slice(0, 18).forEach(([r, k], n) => console.log(`${n + 1}\t${r[0]}\t${r[1]}\t${k}\t${r[hdr.indexOf(k)]}\tzone=${r[4]} walk=${r[5]} W=${r[6]} N=${r[7]} food=${r[8]} desc=${r[9]}`));
