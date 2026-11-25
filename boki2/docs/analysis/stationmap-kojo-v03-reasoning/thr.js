// 論証の検査役：SAVE の JSON（くじごとの結果）から、上位の線（20・25・30・35・40%）を動かしたときの工場・湾岸の数と、黒字の工場の数を出す。
// 湾岸は draft の R1（day≥0.8 か null・従業者1万未満。DAYNULL1 の前の day）を tokyo23.js と count §6 から引き直す（線は引数 cut で変えられる）。
const fs = require('fs'); const path = require('path');
const KD = require('../stationmap-kojo-draft/kojodata3.js');
const loadT = (f) => { const t = fs.readFileSync(f, 'utf8'); return JSON.parse(t.slice(t.indexOf('SIM.tokyo23 = ') + 14, t.lastIndexOf(';\n})('))); };
const T = loadT(process.env.TOKYO23 || path.resolve(__dirname, '../../../js/data/tokyo23.js'));
const KM = KD.load(T); const KS = KD.typeSets(T, KM, JSON.parse(process.env.CUT || '{}'));
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
for (const f of process.argv.slice(2)) {
  const out = JSON.parse(fs.readFileSync(f, 'utf8'));
  const r = out.map((o) => ({ id: o.id, type: o.type, town: o.town, op: mean(o.draws.map((d) => d.op)) })).sort((a, b) => b.op - a.op);
  const k = r.filter((o) => o.type === 'kojo');
  const cols = [0.2, 0.25, 0.3, 0.35, 0.4].map((p) => { const n = Math.round(p * r.length); const top = new Set(r.slice(0, n).map((o) => o.id));
    const kin = k.filter((o) => top.has(o.id)); return `${p * 100}%:${kin.length}（湾岸${kin.filter((o) => KS.R1.has(o.id)).length}）`; });
  const rank = (id) => r.findIndex((o) => o.id === id) + 1;
  console.log(`${path.basename(f, '.json')}｜${cols.join(' ')}｜黒字の工場 ${k.filter((o) => o.op > 0).length}/${k.length}｜工場の上位5：${k.slice(0, 5).map((o) => `${o.town}${KS.R1.has(o.id) ? '[湾]' : ''}${Math.round(o.op / 1e4)}万(${rank(o.id)}位)`).join(' ')}`);
}
