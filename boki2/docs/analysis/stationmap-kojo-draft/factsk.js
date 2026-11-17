// データだけの数（sim は回さない）：工場の25か所の一覧・型の分け方ごとの中身・線を ±10% 動かしたときの入れ替わり。PLAN.md 1章。
global.window = global; const path = require('path'); const root = path.resolve(__dirname, '../../..');
require(root + '/js/core.js'); require(root + '/js/data/tokyo23.js');
const T = window.SIMDATA.tokyo23, ST = Object.fromEntries(T.stations.map((s) => [s.id, s]));
const K = require('./kojodata.js'); const M = K.load(T);
const kojo = T.sites.filter((s) => s.type === 'kojo');
const sets = K.typeSets(T, M);
const med = (a) => { const b = a.slice().sort((x, y) => x - y), n = b.length; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; };
console.log('# 工場・倉庫の候補地 25か所（tokyo23.js の type＝kojo）とメッシュの値（ramencount23/out/count.txt §6 から読んだ）');
console.log('| id | 町 | 駅（段） | 歩き(m) | zone | 地価(円/㎡) | day | food | 従業者 | 夜間人口 | 宿泊飲食の事業所 | 1,000人あたり | ラーメン店 200m・500m | R1 | R4 | R3 | R5 |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const s of kojo) { const m = M[s.id], st = ST[s.st];
  console.log(`| ${s.id} | ${s.town} | ${st.name}（${st.tier}） | ${s.walk} | ${s.zone} | ${s.price.toLocaleString()} | ${s.day == null ? '—' : s.day.toFixed(2)} | ${s.food.toFixed(3)} | ${m.W.toLocaleString()} | ${m.R == null ? '—' : m.R.toLocaleString()} | ${m.eat} | ${m.per1000} | ${m.osm200}・${m.osm500} | ${['R1', 'R4', 'R3', 'R5'].map((r) => (sets[r].has(s.id) ? '○' : '')).join(' | ')} |`); }
console.log('');
for (const [r, S] of Object.entries(sets)) { if (r === 'R2') continue; const a = kojo.filter((s) => S.has(s.id)), b = kojo.filter((s) => !S.has(s.id));
  const f = (arr, k) => (arr.length ? med(arr.map((s) => M[s.id][k] == null ? 0 : M[s.id][k])) : null);
  console.log(`- ${r}：${a.length}か所（${a.map((s) => s.town).join('・')}）。中の従業者の中央 ${f(a, 'W')}・夜間人口の中央 ${f(a, 'R')}・1,000人あたりの中央 ${f(a, 'per1000')}・500m にラーメン店0軒 ${a.filter((s) => M[s.id].osm500 === 0).length}/${a.length}｜外 ${b.length}か所：従業者の中央 ${f(b, 'W')}・夜間人口の中央 ${f(b, 'R')}・1,000人あたりの中央 ${f(b, 'per1000')}`); }
console.log(`- R1 と R1z は同じか：${[...sets.R1].sort().join(',') === [...sets.R1z].sort().join(',') ? '同じ' : '違う'}`);
const R1med = med(kojo.filter((s) => sets.R1.has(s.id)).map((s) => M[s.id].W));
console.log(`- W_ref（R1 の従業者の中央）：${R1med}（台本の WREF ${K.WREF}）`);
// 線を ±10% 動かしたときの入れ替わり
const diff = (A, B) => { const add = [...B].filter((x) => !A.has(x)), rem = [...A].filter((x) => !B.has(x)); const nm = (id) => kojo.find((s) => s.id === id).town; return `入る ${add.map(nm).join('・') || 'なし'}／出る ${rem.map(nm).join('・') || 'なし'}`; };
for (const f of [0.9, 1.1]) {
  const S2 = K.typeSets(T, M, { dayCut: 0.8 * f, wCut: 10000 * f, r4: K.R4CUT * f });
  console.log(`- 線×${f}（day ${(0.8 * f).toFixed(2)}・従業者 ${10000 * f}・R4 ${(K.R4CUT * f).toFixed(2)}）：R1 ${diff(sets.R1, S2.R1)}｜R4 ${diff(sets.R4, S2.R4)}`);
}
// 属性ごとの地価の中央（参考）
const byT = {}; for (const s of T.sites) (byT[s.type] = byT[s.type] || []).push(s.price);
console.log('- 地価の中央（円/㎡）：' + Object.entries(byT).map(([k, a]) => `${k} ${med(a).toLocaleString()}`).join('・'));
