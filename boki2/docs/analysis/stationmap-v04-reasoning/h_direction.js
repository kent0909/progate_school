// 4.3「効きの向きの決まり」：基準の候補地（P 固定）で、ライバルを1軒足したときの自店の新規の割合と3年目の客数の変わり方。
// 自店（平均の店）の型は typeOf で normal。老舗も normal（world.js:89）。だから「同じ型」＝老舗、「違う型」＝安売り・こだわり。
const L = require('./lib.js'); const { D, Wd, RV, C } = L;
const cal = L.calibrate(); const key = 'shotengai';
const share = (riv) => { const W = L.makeWorld(key, cal.Pref * cal.Fb, riv, cal.eps, 12000); const a = W.town.areas[key]; return Wd.sharesFor(W, [L.refStore(a), ...W.rivals.map(L.rs)], { neutralFit: true })[0]; };
const n3 = (riv) => L.run36(L.makeWorld(key, cal.Pref * cal.Fb, riv, cal.eps, 12000));
console.log('P_ref(F=1あたり)', cal.Pref.toFixed(1), ' 基準の候補地の自店の新規の割合', cal.shRef.toFixed(4), ' epsScale', cal.eps.toFixed(3));
const bases = { '0軒': [], '基準(安売り+老舗)': ['cheap', 'shinise'], '安売り1': ['cheap'], '老舗1': ['shinise'], 'こだわり1': ['kodawari'], '安売り+こだわり': ['cheap', 'kodawari'] };
console.log('\n元の組 → 足す型 | 新規の割合の変化 | 3年目の売れた客/日（元→後、変化）| 3年目の需要/日の変化');
for (const [nm, b] of Object.entries(bases)) {
  const s0 = share(b), y0 = n3(b);
  for (const t of ['shinise', 'cheap', 'kodawari']) {
    const s1 = share([...b, t]), y1 = n3([...b, t]);
    const tag = t === 'shinise' ? '同じ型(老舗)' : t === 'cheap' ? '違う型(安売り)' : '違う型(こだわり)';
    console.log(`${nm} + ${tag} | ${(100 * (s1 / s0 - 1)).toFixed(1)}% | ${y0.N.toFixed(1)}→${y1.N.toFixed(1)} (${(100 * (y1.N / y0.N - 1)).toFixed(1)}%) | ${(100 * (y1.dem / y0.dem - 1)).toFixed(1)}%`);
  }
}
// 外の選択 V0 との関係：入れ子のロジットでは、ほかの店を足すと自店の割合は必ず下がる（分母が増えるだけ）。増えることがあるかを、全ての組（0〜5軒、3型の重複組合せ）で確かめる
const types = ['cheap', 'kodawari', 'shinise']; let combos = [[]];
for (let n = 1; n <= 5; n++) { const nx = []; for (const c of combos) if (c.length === n - 1) for (const t of types) { if (c.length && types.indexOf(t) < types.indexOf(c[c.length - 1])) continue; nx.push([...c, t]); } combos = combos.concat(nx); }
let up = 0, tot = 0, worst = { r: 0 };
for (const c of combos) { if (c.length >= 5) continue; const s0 = share(c); for (const t of types) { const s1 = share([...c, t]); tot++; if (s1 > s0) up++; } }
console.log(`\n全ての組（${combos.filter(c=>c.length<5).length}組×3型＝${tot}通り）でライバルを1軒足して新規の割合が増えた数：${up}`);
// 組ごとの新規の割合（基準比）
console.log('\n組ごとの新規の割合（基準の組との比）');
for (const c of combos.filter((c) => c.length <= 3)) console.log((c.join('+') || '0軒').padEnd(28), (share(c) / cal.shRef).toFixed(2));
