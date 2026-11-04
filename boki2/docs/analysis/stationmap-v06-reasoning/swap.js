// 主張3「入られた所が上位50から落ち、入られなかった0軒の所が代わりに上がる」を、くじごとの保存（all6.js の SAVE）で分解する。
// 使い方：node swap.js 参入なし.json 参入あり.json [名前]
// 各世界 k で A＝参入なしの上位50、C＝参入ありの上位50。
//  (a) 参入ありの⑤＝C のうち3年目の終わりに0軒
//  (b) 顔ぶれを A に固定したときの0軒（入れ替わりがなければ⑤はこうなる）＝A のうち、参入ありの世界で終わりに0軒
//  (c) 参入なしの⑤＝A のうち参入なしで0軒
//  落ちた所（A−C）：参入ありで1軒以上入った割合／加わった所（C−A）：入られず終わりに0軒の割合
const fs = require('fs');
const [A, Y] = process.argv.slice(2, 4).map((f) => JSON.parse(fs.readFileSync(f)));
const nm = process.argv[4] || '';
const K = A[0].draws.length, mean = (a) => (a.length ? a.reduce((t, v) => t + v, 0) / a.length : NaN);
const top = (X, k) => X.map((o, i) => [o.draws[k].op, i]).sort((a, b) => b[0] - a[0]).slice(0, 50).map((x) => x[1]);
const rows = [];
for (let k = 0; k < K; k++) {
  const a = top(A, k), c = top(Y, k), sa = new Set(a), sc = new Set(c);
  const drop = a.filter((i) => !sc.has(i)), add = c.filter((i) => !sa.has(i)), stay = a.filter((i) => sc.has(i));
  const e = (i) => Y[i].draws[k];
  rows.push({
    k, z5: c.filter((i) => e(i).end === 0).length, fixedA: a.filter((i) => e(i).end === 0).length, z5none: a.filter((i) => A[i].draws[k].end === 0).length,
    nDrop: drop.length, dropHit: drop.filter((i) => e(i).entries > 0).length, addZero: add.filter((i) => e(i).entries === 0 && e(i).end === 0).length, addPre0: add.filter((i) => e(i).n === 0).length,
    stayHit: stay.filter((i) => e(i).entries > 0).length, nStay: stay.length,
    addZeroPreNone0: add.filter((i) => e(i).end === 0 && A[i].draws[k].end === 0).length,
  });
}
console.log(`== ${nm}  K=${K}`);
for (const r of rows) console.log(`世界${r.k}: ⑤(参入あり)=${r.z5}  顔ぶれを参入なしの上位50に固定した0軒=${r.fixedA}  参入なしの⑤=${r.z5none}  落ちた${r.nDrop}のうち入られた${r.dropHit}  加わった${r.nDrop}のうち入られず0軒${r.addZero}（開店の前0軒${r.addPre0}）  残った${r.nStay}のうち入られた${r.stayHit}`);
const m = (k) => mean(rows.map((r) => r[k])).toFixed(1);
console.log(`平均：⑤ 参入あり ${m('z5')}・顔ぶれ固定 ${m('fixedA')}・参入なし ${m('z5none')}｜落ちた ${m('nDrop')}（入られた ${m('dropHit')}）・加わった ${m('nDrop')}（入られず0軒 ${m('addZero')}）`);
console.log(`分解：参入なし→参入ありの⑤の差 ${(mean(rows.map((r) => r.z5 - r.z5none))).toFixed(1)} ＝ 直接の効き（顔ぶれ固定） ${(mean(rows.map((r) => r.fixedA - r.z5none))).toFixed(1)} ＋ 入れ替わりの効き ${(mean(rows.map((r) => r.z5 - r.fixedA))).toFixed(1)}`);
