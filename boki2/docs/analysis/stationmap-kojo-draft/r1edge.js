// 版0.3（11/25）：型の規則 R1 の端にいる候補地（線を少し動かすと入れ替わる所）。報告だけ。使い方：node r1edge.js > out3/r1edge.md
global.window = global; const path = require('path'); require(path.join(__dirname, '../../../js/data/tokyo23.js'));
const T = SIMDATA.tokyo23, KD = require('./kojodata3.js'), M = KD.load(T);
const p = (x) => console.log(x);
p('# R1 の端（r1edge.js）\n'); p('| day の線 | 従業者の線 | R1 の数 | R1 の中身 |'); p('|---|---|---|---|');
for (const d of [0.7, 0.72, 0.75, 0.8, 0.84, 0.88, 0.9]) for (const w of [5000, 10000, 30000]) { const s = KD.typeSets(T, M, { dayCut: d, wCut: w }).R1; p(`| ${d} | ${w} | ${s.size} | ${T.sites.filter((q) => s.has(q.id)).map((q) => q.town).join('・')} |`); }
p('\n- day の値の近い工場の候補地（0.5〜1、null）：' + T.sites.filter((s) => s.type === 'kojo' && (s.day == null || s.day >= 0.5)).sort((a, b) => (b.day ?? 2) - (a.day ?? 2)).map((s) => `${s.town} ${s.day ?? 'null'}（従業者 ${M[s.id].W}・zone ${s.zone}）`).join('・'));
