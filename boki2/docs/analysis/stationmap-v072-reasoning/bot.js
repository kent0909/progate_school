// 論証の検査役（版0.7.2 の検査、11/10）：all72.js の SAVE から、9章 (a) の選択肢2「考えて選んだ店」の赤字の割合を見積もる。
// 「考えて選ぶ」＝見える情報のボット（all71.js 104〜117行と同じ式：同じ候補地で開店の前の軒数が同じだった、ほかの世界のくじの利益の平均で並べる）。
// 世界ごとに上から n か所（10・50・98＝1割・294＝3割）を選び、その3年目の利益が負の割合。比べに「平均の店（全くじ）」と「無作為に選んだ所」。
const out = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8'));
const K = out[0].draws.length, mean = (a) => a.reduce((t, v) => t + v, 0) / a.length;
const res = {};
for (const n of [10, 50, 98, 294]) {
  const lossR = [];
  for (let k = 0; k < K; k++) {
    const est = (o) => { const others = o.draws.filter((_, j) => j !== k); const same = others.filter((d) => d.n === o.draws[k].n); return mean((same.length ? same : others).map((d) => d.op)); };
    const pick = out.map((o) => ({ o, e: est(o), d: o.draws[k] })).sort((a, b) => b.e - a.e).slice(0, n);
    lossR.push(pick.filter((x) => x.d.op < 0).length / n);
  }
  res[n] = mean(lossR);
}
const all = out.flatMap((o) => o.draws.map((d) => d.op));
console.log(`全くじの赤字 ${(100 * all.filter((v) => v < 0).length / all.length).toFixed(1)}%（平均の店を無作為に出したとき）`);
console.log('見える情報のボットが選んだ上から n か所の赤字の割合（世界の平均）：' + Object.entries(res).map(([n, v]) => `${n}か所 ${(100 * v).toFixed(1)}%`).join('・'));
// 同じ駅の中（ピン2本以上の駅）で、軒数だけで選ぶ規則が当たるか：世界ごとに、駅の中で3年目の利益がいちばん高いピンを、
// 「軒数の最も少ないピン」「最も多いピン」（同じ軒数が複数なら等確率）で当てる確率。比べ：無作為（1/ピン数）、人通りの倍率の大きいピン、家賃の安いピン。
const bySt = {}; for (const o of out) (bySt[o.st] = bySt[o.st] || []).push(o);
const sts = Object.values(bySt).filter((a) => a.length >= 2);
const hit = { few: [], many: [], rnd: [], F: [], rent: [] }, gap = { few: [], many: [], F: [] };
for (const a of sts) for (let k = 0; k < K; k++) {
  const w = a.map((o) => ({ o, d: o.draws[k] })); const best = w.reduce((b, x) => (x.d.op > b.d.op ? x : b));
  const pickBy = (f) => { const v = w.map(f), m = Math.max(...v); const set = w.filter((x, i) => v[i] === m); return { p: set.includes(best) ? 1 / set.length : 0, op: mean(set.map((x) => x.d.op)) }; };
  const few = pickBy((x) => -x.d.n), many = pickBy((x) => x.d.n), F = pickBy((x) => x.o.F), rent = pickBy((x) => -x.d.rent);
  hit.few.push(few.p); hit.many.push(many.p); hit.F.push(F.p); hit.rent.push(rent.p); hit.rnd.push(1 / w.length);
  gap.few.push((best.d.op - few.op) / 1e4); gap.many.push((best.d.op - many.op) / 1e4); gap.F.push((best.d.op - F.op) / 1e4);
}
console.log(`同じ駅の中で最良のピンを当てる確率（ピン2本以上の駅 ${sts.length}×${K}世界）：軒数の最も少ないピン ${(100 * mean(hit.few)).toFixed(0)}%・最も多いピン ${(100 * mean(hit.many)).toFixed(0)}%・人通りの倍率の大きいピン ${(100 * mean(hit.F)).toFixed(0)}%・家賃の安いピン ${(100 * mean(hit.rent)).toFixed(0)}%・無作為 ${(100 * mean(hit.rnd)).toFixed(0)}%`);
console.log(`最良のピンとの利益の差の平均（万円/年）：少ないピン ${mean(gap.few).toFixed(0)}・多いピン ${mean(gap.many).toFixed(0)}・人通りの大きいピン ${mean(gap.F).toFixed(0)}`);
// ⑦B（設計書 6.1・9章 (c) の選択肢2）：候補地のくじの平均で、昼だけ＞通し・夜だけ＞通しの候補地の、全候補地の中の割合。試しの台本は出していない
const sm = (o, k) => mean(o.draws.map((d) => d[k]));
const bL = out.filter((o) => sm(o, 'lunch') > sm(o, 'op')).length / out.length, bN = out.filter((o) => sm(o, 'night') > sm(o, 'op')).length / out.length;
const byA = {}; for (const o of out) { const g = (byA[o.type] = byA[o.type] || { n: 0, L: 0, N: 0 }); g.n++; if (sm(o, 'lunch') > sm(o, 'op')) g.L++; if (sm(o, 'night') > sm(o, 'op')) g.N++; }
console.log(`⑦B 昼だけ＞通しの候補地 ${(100 * bL).toFixed(1)}%・夜だけ＞通しの候補地 ${(100 * bN).toFixed(1)}%（線20%）｜属性ごと（昼／夜）：` + Object.entries(byA).map(([t, g]) => `${t} ${g.L}/${g.N}/${g.n}`).join('・'));
