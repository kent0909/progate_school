// h_direction.js で「こだわりを1軒足すと3年目の客が増える」が出た。理由が相場の値段 pRef（world.js:377、ライバルの値段の平均へ寄る）か、外の選択 V0 かを分ける。
const L = require('./lib.js'); const { Wd, C } = L;
const cal = L.calibrate(); const key = 'shotengai';
const go = (riv, fixPref) => { const T = C.table; const keep = T.pRefStep.v; if (fixPref) T.pRefStep.v = 0; const W = L.makeWorld(key, cal.Pref * cal.Fb, riv, cal.eps, 12000); let x = W, pr = []; for (let k = 0; k < 36; k++) { const r = Wd.month(x, L.idle(x), { noise: false, noCards: true, noFactors: true }); if (k === 35) pr.push(r.res.pRef); x = r.W; } const y = L.run36(L.makeWorld(key, cal.Pref * cal.Fb, riv, cal.eps, 12000)); T.pRefStep.v = keep; return { N: y.N, dem: y.dem, pRef: pr[0] }; };
for (const fix of [false, true]) {
  console.log(fix ? '\n相場 pRef を850に固定（pRefStep=0）' : '今の式（pRef はライバルの値段の平均へ寄る）');
  for (const [b, t] of [[['cheap', 'shinise'], 'kodawari'], [['cheap'], 'kodawari'], [[], 'kodawari'], [['cheap', 'shinise'], 'cheap'], [['cheap', 'shinise'], 'shinise']]) {
    const y0 = go(b, fix), y1 = go([...b, t], fix);
    console.log(`${(b.join('+') || '0軒')} + ${t}: 需要 ${y0.dem.toFixed(1)}→${y1.dem.toFixed(1)} (${(100 * (y1.dem / y0.dem - 1)).toFixed(1)}%)  36か月目の相場 ${y0.pRef.toFixed(0)}→${y1.pRef.toFixed(0)}`);
  }
}
