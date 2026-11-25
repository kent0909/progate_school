// 論証の検査役：くじ（世界）ごとに、その世界の上位30%に入る工場の候補地と、世界ごとの利益の揺れ（工場の上位と、全候補地の上位10の顔ぶれの入れ替わり）を数える。
const fs = require('fs');
for (const f of process.argv.slice(2)) { const out = JSON.parse(fs.readFileSync(f, 'utf8')); const K = out[0].draws.length; const nTop = Math.round(0.3 * out.length);
  const cnt = {}; const top10 = {}; const sd = (a) => { const m = a.reduce((s, v) => s + v, 0) / a.length; return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };
  for (let k = 0; k < K; k++) { const w = out.map((o) => ({ o, op: o.draws[k].op })).sort((a, b) => b.op - a.op);
    w.slice(0, nTop).filter((x) => x.o.type === 'kojo').forEach((x) => { cnt[x.o.town] = (cnt[x.o.town] || 0) + 1; });
    w.slice(0, 10).forEach((x) => { top10[x.o.town] = (top10[x.o.town] || 0) + 1; }); }
  const ko = out.filter((o) => o.type === 'kojo'); const sh = out.find((o) => o.town === '東雲2丁目');
  const cv = (o) => sd(o.draws.map((d) => d.op)) / 1e4;
  const med = (a) => a.sort((x, y) => x - y)[a.length >> 1];
  console.log(`${f.split('/').pop()}｜世界${K}：その世界の上位30%に入った工場（回数）${JSON.stringify(cnt)}｜東雲の利益の世界ごとの標準偏差 ${cv(sh).toFixed(0)}万・全候補地の中央 ${med(out.map(cv)).toFixed(0)}万・工場の中央 ${med(ko.map(cv)).toFixed(0)}万｜世界ごとの上位10に入った町の数 ${Object.keys(top10).length}`); }
