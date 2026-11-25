// 論証の検査役：検査役が作った地図（maps/）の候補地・工場・湾岸・候補地0の駅を数える（draft の mapcount.js の数え方の一部）。
const fs = require('fs'); const KD = require('../stationmap-kojo-draft/kojodata3.js');
const load = (f) => { const t = fs.readFileSync(f, 'utf8'); return JSON.parse(t.slice(t.indexOf('SIM.tokyo23 = ') + 14, t.lastIndexOf(';\n})('))); };
for (const f of process.argv.slice(2)) { const T = load(f); const KM = KD.load(T); const KS = KD.typeSets(T, KM);
  const st0 = T.stations.filter((st) => !T.sites.some((s) => s.st === st.id)).map((st) => st.name);
  console.log(`${f.split('/').pop()}｜候補地 ${T.sites.length}｜工場 ${T.sites.filter((s) => s.type === 'kojo').length}｜湾岸 ${KS.R1.size}（${T.sites.filter((s) => KS.R1.has(s.id)).map((s) => s.town).join('・')}）｜候補地0の駅 ${st0.length}（${st0.join('・')}）`); }
