// 判断の抽選（DESIGN-RAMEN 版0.4 e.1・k.3）。純粋関数。
// 札の選択肢の結果は、台本に書いた重み（合計100）を、状態の条件 shift で結果どうしの間で動かす（合計は100のまま）。
// 「選ばなかった時だけ不運」は作らない：shift は状態（評判・資金・暦・手の内）で動き、選んだ手で下げられる。
(function (g) {
  const SIM = (g.SIMDATA = g.SIMDATA || {});
  // 重み：[{ id, w }]。shift：{ if(W), from, to, amt }（from から to へ amt を移す。from の重みより多くは移さない）
  function weights(card, optId, W) {
    const o = card.options.find((x) => x.id === optId);
    if (!o) throw new Error(`札 ${card.id} に選択肢 ${optId} がない`);
    const ws = o.outcomes.map((x) => ({ id: x.id, w: typeof x.w === 'function' ? x.w(W) : x.w }));
    for (const sh of o.shift || []) {
      if (!sh.if(W)) continue;
      const f = ws.find((x) => x.id === sh.from), t = ws.find((x) => x.id === sh.to);
      if (!f || !t) continue;
      const amt = Math.min(f.w, typeof sh.amt === 'function' ? sh.amt(W) : sh.amt);
      f.w -= amt; t.w += amt;
    }
    return ws;
  }
  function resolve(card, optId, W, rng) {
    const ws = weights(card, optId, W), o = card.options.find((x) => x.id === optId);
    let x = rng() * 100, out = ws[ws.length - 1];
    for (const w of ws) { if (x < w.w) { out = w; break; } x -= w.w; }
    return { id: out.id, outcome: o.outcomes.find((y) => y.id === out.id), weights: ws };
  }
  // 試算（d.7）：選ぶ前に分かること＝結果の重みと、すぐ動くお金の幅（外の反応・結末は出さない）
  function trial(card, optId, W) {
    const ws = weights(card, optId, W), o = card.options.find((x) => x.id === optId);
    const cash = o.outcomes.map((y) => (y.cash ? (typeof y.cash === 'function' ? y.cash(W) : y.cash) : 0));
    return { weights: ws, cashMin: Math.min(...cash), cashMax: Math.max(...cash), time: o.time || 0 };
  }
  SIM.decide = { weights, resolve, trial };
})(typeof window !== 'undefined' ? window : globalThis);
