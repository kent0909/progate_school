// 論証の検査役（11/10）：all71.js の SAVE の出力から、⑥ にない単純な規則（ライバルの多い順・0軒を避ける）を、⑥ と同じ物差しで測る。
// 物差し：1つの世界 k で、規則の並べ方で上から10か所の利益の平均 ÷ その世界の本当の上位10（通し）の平均。all71.js の ⑥ と同じ式。
// 使い方：node rules.js <SAVE の JSON>
const out = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8'));
const K = out[0].draws.length, mean = (a) => a.reduce((t, v) => t + v, 0) / a.length;
const rules = {
  'ライバルの多い順（同じ軒数なら人通りの倍率の大きい順）': (x) => x.d.n * 100 + x.o.F,
  '0軒を避ける（1軒以上の中で人通りの倍率の大きい順）': (x) => (x.d.n >= 1 ? x.o.F : -1),
  '参考：人通りだけ（⑥ と同じ規則。all71.js の数と合うかの確かめ）': (x) => x.o.F,
};
for (const [nm, f] of Object.entries(rules)) {
  const r = [];
  for (let k = 0; k < K; k++) {
    const w = out.map((o) => ({ o, d: o.draws[k] }));
    const best = mean(w.map((x) => x.d.op).sort((a, b) => b - a).slice(0, 10));
    r.push(mean(w.slice().sort((a, b) => f(b) - f(a)).slice(0, 10).map((x) => x.d.op)) / best);
  }
  console.log(`${nm}：${r.map((x) => (100 * x).toFixed(0) + '%').join('/')}・平均 ${(100 * mean(r)).toFixed(0)}%（⑥ の線 85%未満）`);
}
// 開店の前の軒数ごとの、くじの利益の中央値と黒字の割合（全くじ）
const pool = out.flatMap((o) => o.draws.map((d) => ({ ...d, tier: o.tier })));
const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)]; };
const by = {}; for (const d of pool) (by[d.n] = by[d.n] || []).push(d);
console.log('開店の前の軒数ごと：' + Object.entries(by).map(([n, a]) => `${n}軒 ${a.length}くじ 利益の中央${(med(a.map((d) => d.op)) / 1e4).toFixed(0)}万 黒字${(100 * a.filter((d) => d.op > 0).length / a.length).toFixed(0)}%`).join(' | '));
// 同じ段の中で、軒数と利益の向き（段ごとに 0軒 と 2軒以上 の利益の中央値）
const tiers = [1, 2, 3, 4, 5, 6, 8];
console.log('段の中の比べ（0軒／1軒／2軒以上の利益の中央値、万円）：' + tiers.map((t) => { const a = pool.filter((d) => d.tier === t); const g = (f) => { const b = a.filter(f).map((d) => d.op); return b.length ? (med(b) / 1e4).toFixed(0) : '—'; }; return `段${t} ${g((d) => d.n === 0)}／${g((d) => d.n === 1)}／${g((d) => d.n >= 2)}`; }).join(' | '));
