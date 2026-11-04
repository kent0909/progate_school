// 参入の仕組みの効き：同じくじ（軒数・型・家賃・参入の乱数の並び）で、参入なし／版0.5 の参入（p1＝0）／版0.6 の参入 を並べ、
// 「参入で上位の店が潰れるだけになっていないか」を見る。入力は all6.js の SAVE の JSON。
// 使い方：node cmp6.js 参入なし.json 版0.5参入.json 版0.6参入.json
const fs = require('fs');
const [A, B, C] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f)));
const K = A[0].draws.length, mean = (a) => a.reduce((t, v) => t + v, 0) / a.length;
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
const names = ['参入なし', '版0.5 の参入（p0×λ のみ）', '版0.6 の参入（p0×λ＋p1×s）'];
[A, B, C].forEach((X, xi) => {
  const pool = X.flatMap((o) => o.draws.map((d) => d.op));
  const z = []; for (let k = 0; k < K; k++) { const w = X.map((o) => o.draws[k]).sort((a, b) => b.op - a.op).slice(0, 50); z.push(w.filter((d) => d.end === 0).length); }
  console.log(`${names[xi]}：赤字のくじ ${(100 * pool.filter((v) => v < 0).length / pool.length).toFixed(1)}%・利益の 50% ${(q(pool, 0.5) / 1e4).toFixed(0)}万・90% ${(q(pool, 0.9) / 1e4).toFixed(0)}万・99% ${(q(pool, 0.99) / 1e4).toFixed(0)}万｜1つの世界の上位50の利益の平均 ${(mean([...Array(K).keys()].map((k) => mean(X.map((o) => o.draws[k].op).sort((a, b) => b - a).slice(0, 50)))) / 1e4).toFixed(0)}万・上位10 ${(mean([...Array(K).keys()].map((k) => mean(X.map((o) => o.draws[k].op).sort((a, b) => b - a).slice(0, 10)))) / 1e4).toFixed(0)}万｜⑤ 3年目の終わりに0軒 ${z.join('/')}`);
});
for (const [nm, Y] of [['版0.5 の参入', B], ['版0.6 の参入', C]]) {
  const kept = [], loss = [], drop = [], hitTop = [], hitAll = [];
  for (let k = 0; k < K; k++) {
    const ia = A.map((o, i) => [o.draws[k].op, i]).sort((a, b) => b[0] - a[0]).slice(0, 50).map((x) => x[1]);
    const iy = new Set(Y.map((o, i) => [o.draws[k].op, i]).sort((a, b) => b[0] - a[0]).slice(0, 50).map((x) => x[1]));
    kept.push(ia.filter((i) => iy.has(i)).length);
    loss.push(ia.filter((i) => Y[i].draws[k].op < 0).length);
    drop.push(mean(ia.map((i) => Y[i].draws[k].op - A[i].draws[k].op)));
    hitTop.push(ia.filter((i) => Y[i].draws[k].entries > 0).length / 50);
    hitAll.push(Y.filter((o) => o.draws[k].entries > 0).length / Y.length);
  }
  console.log(`${nm}：参入なしの上位50のうち、${nm}でも上位50に残る ${kept.join('/')}・赤字に落ちる ${loss.join('/')}・利益の変わりの平均 ${drop.map((v) => (v / 1e4).toFixed(0) + '万').join('/')}・その上位50に1軒以上入った ${(100 * mean(hitTop)).toFixed(0)}%（全くじでは ${(100 * mean(hitAll)).toFixed(0)}%）`);
  // 参入なしの利益の十分位ごとに、参入で変わる利益と、1軒以上入る割合
  const rows = A.flatMap((o, i) => o.draws.map((d, k) => ({ a: d.op, y: Y[i].draws[k].op, e: Y[i].draws[k].entries, Na: d.N })));
  rows.sort((x, y) => x.a - y.a); const n = rows.length, dec = [];
  for (let j = 0; j < 10; j++) { const r = rows.slice(Math.floor(j * n / 10), Math.floor((j + 1) * n / 10)); dec.push(`${j + 1}:${(mean(r.map((x) => x.a)) / 1e4).toFixed(0)}→${(mean(r.map((x) => x.y)) / 1e4).toFixed(0)}万（入る${(100 * r.filter((x) => x.e > 0).length / r.length).toFixed(0)}%・赤字${(100 * r.filter((x) => x.y < 0).length / r.length).toFixed(0)}%）`); }
  console.log(`   参入なしの利益の十分位（1＝下）ごとの 参入なし→${nm} の利益の平均：` + dec.join(' '));
  const ra = rows.map((x) => x.a), ry = rows.map((x) => x.y);
  const rk = (a) => { const o = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = Array(a.length); o.forEach((x, k) => (r[x[1]] = k)); return r; };
  const ka = rk(ra), ky = rk(ry), m = (n - 1) / 2; let sxy = 0, sx = 0, sy = 0; for (let i = 0; i < n; i++) { sxy += (ka[i] - m) * (ky[i] - m); sx += (ka[i] - m) ** 2; sy += (ky[i] - m) ** 2; }
  console.log(`   くじごとの利益の順位相関（参入なし vs ${nm}）${(sxy / Math.sqrt(sx * sy)).toFixed(3)}`);
}
