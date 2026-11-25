// 判定役：抜いた数ごとに、out3 の出力の読める行（SUMMARY でなく人の読む行）から値を引き、ファイル:行 と一緒に出す。
const fs = require('fs'), D = '/home/user/progate_school/boki2/docs/analysis/stationmap-kojo-draft/out3/';
const get = (f) => { const L = fs.readFileSync(D + f + '.txt', 'utf8').split('\n'); const r = {};
  L.forEach((l, i) => {
    let m;
    if ((m = l.match(/^工場 ⑪k 上位30%に (\d+)\/(\d+)/))) { r.k = `${m[1]}/${m[2]}`; r.kL = i + 1; }
    if ((m = l.match(/^湾岸の種類（版0.3）：上位30%（線 [-\d]+万）に (\d+)\/(\d+).*湾岸の利益の中央 ([-\d—]+)万?・全体の中央 ([-\d]+)万.*上位30%に入る ([\d—]+)%?/))) { r.w = `${m[1]}/${m[2]}`; r.wMed = m[3]; r.all = m[4]; r.hit = m[5]; r.wL = i + 1; }
    if ((m = l.match(/^湾岸の判定：⑪w(.) .*H3w(.)/))) { r.w11 = m[1]; r.h3 = m[2]; r.jL = i + 1; }
  }); return r; };
const q = process.argv.slice(2);
for (const f of q) { const r = get(f); console.log(`${f}.txt  工場 ${r.k}（${r.kL}行）  湾岸 ${r.w}（${r.wL}行）  ⑪w${r.w11} H3w${r.h3}（${r.jL}行）  湾岸の中央 ${r.wMed}・全体 ${r.all}・無作為 ${r.hit}%（${r.wL}行）`); }
