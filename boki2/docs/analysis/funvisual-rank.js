#!/usr/bin/env node
// BIZ-FUNVISUAL 1.13 の見取り図：変数の数と周回の強さの順位相関（スピアマン。同順位は平均の順位）。
// 使い方：node boki2/docs/analysis/funvisual-rank.js
// 値はどちらも書き手の見立て（変数の数は1章の表の「変数」の行を数えた概数、周回の強さは 弱=1・弱〜中=1.5・中=2・中〜強=2.5・強=3）。
// 「比例しない」と言えるかどうかを、版0.1の表のままと、版0.2で足した2作（Coffee Inc 2・Big Ambitions）を入れた表の両方で見る。
const rank = (xs) => { const s = xs.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]); const r = Array(xs.length); for (let i = 0; i < s.length;) { let j = i; while (j + 1 < s.length && s[j + 1][0] === s[i][0]) j++; const avg = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[s[k][1]] = avg; i = j + 1; } return r; };
const pearson = (a, b) => { const n = a.length, ma = a.reduce((x, y) => x + y) / n, mb = b.reduce((x, y) => x + y) / n; let num = 0, da = 0, db = 0; for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return num / Math.sqrt(da * db); };
const rho = (rows) => pearson(rank(rows.map((r) => r[1])), rank(rows.map((r) => r[2])));
// [作品, 変数の数, 周回の強さ]
const v01 = [['ラーメン館', 12, 2], ['グルメ食堂', 8, 2], ['発展国++', 10, 2.5], ['Game Dev Tycoon', 12, 2], ['Lemonade Tycoon', 8, 1], ['Offworld', 20, 3], ['Capitalism Lab', 30, 3], ['Two Point Hospital', 15, 2.5], ['Good Pizza', 10, 1.5], ['Cook Serve Delicious', 8, 2], ['Startup Company', 40, 1.5]];
// 版0.2：Capitalism Lab は公式の見出しの DLC（子会社・市の経済・デジタル）で 40 に、Coffee Inc 2（店＋株・不動産・豆・投資・買収）と Big Ambitions（店＋物件・輸入・卸・人・ライバル）を足した。
// Coffee Inc 2 の周回：声135件に「何度も最初からやり直して」（1-1）「別のセーブデータで新たに始める」（2-7）「次は難易度マックス」（5-7）の3件。中〜強=2.5 と置いた（見立て）。
// Big Ambitions の周回：資料に周回の記述がない。中=2 と置いた（見立て。外して計った値も出す）。
const v02 = v01.map((r) => (r[0] === 'Capitalism Lab' ? [r[0], 40, r[2]] : r)).concat([['Coffee Inc 2', 40, 2.5], ['Big Ambitions', 35, 2]]);
const out = (name, rows) => console.log(`${name}：${rows.length}作品 ρ=${rho(rows).toFixed(2)}`);
out('版0.1の表のまま', v01);
out('版0.1の表から Startup Company を除く', v01.filter((r) => r[0] !== 'Startup Company'));
out('版0.2の表', v02);
out('版0.2の表から Startup Company を除く', v02.filter((r) => r[0] !== 'Startup Company'));
out('版0.2の表から Big Ambitions を除く（周回の資料がない作品）', v02.filter((r) => r[0] !== 'Big Ambitions'));
