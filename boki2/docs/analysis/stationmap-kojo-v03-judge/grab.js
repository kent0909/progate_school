// 判定役：out3 の出力から、指定の行（正規表現）を「ファイル:行番号: 中身」で出す。node grab.js 正規表現 ファイル名...
const fs = require('fs'), D = '/home/user/progate_school/boki2/docs/analysis/stationmap-kojo-draft/out3/';
const re = new RegExp(process.argv[2]);
for (const f of process.argv.slice(3)) { const L = fs.readFileSync(D + f + '.txt', 'utf8').split('\n'); L.forEach((l, i) => { if (re.test(l)) console.log(`${f}.txt:${i + 1}: ${l.slice(0, +(process.env.W || 300))}`); }); }
