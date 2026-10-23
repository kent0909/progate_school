// ライバル（DESIGN-RAMEN 版0.4 f章）。純粋関数。プレイヤーと同じ需要の式（world.js）で客を取り、同じ形の損益で口座を持つ。
// 切り身は3つの型（安売りチェーン・こだわりの個人店・老舗）。数と型の組は seed（同じ型は2軒まで。seed 0 は安売り・こだわり・老舗）。
// 2周目以降は 2〜5軒（seed）。前の周の自分（W.flags.ghost）は前の周の choices の値段をそのまま打つ。手の内の見せ方は W.flags.rivalInfo の4候補（A〜D）。
// 反応のルール（f.3）のうち切り身の3つ：値下げの追随・限定で返す・近くに出店の予兆（6〜8月に1回。cards.js の rival_open）
(function (g) {
  const SIM = (g.SIMDATA = g.SIMDATA || {});
  const C = (k) => SIM.coef(k);
  // 型ごとの中身【置き値。f.1 の性格を数にした】。cost は原価率、labor は月の人件費
  const TYPES = {
    cheap: { name: 'ごうりき軒', label: '安売りチェーン', price: 690, R: 3.0, Q: 2.6, A: 1.0, L: 6, cost: 0.32, labor: 380000, rent: 180000, cash: 8000000, bowl: { noodle: 'mid', src: 'ready', soup: 'tonkotsu', top: ['nori'] }, weak: '値段では勝てない', follow: 0.5 },
    kodawari: { name: '麺処 ふじしろ', label: 'こだわりの個人店', price: 1200, R: 4.5, Q: 4.2, A: 0.3, L: 10, cost: 0.38, labor: 200000, rent: 120000, cash: 3000000, bowl: { noodle: 'thin', src: 'custom', soup: 'shio', top: ['chashu', 'ajitama'] }, weak: '評判では勝てない', follow: 0 },
    shinise: { name: '中華そば 小松', label: '老舗', price: 850, R: 3.8, Q: 3.2, A: 0, L: 18, cost: 0.36, labor: 0, rent: 0, cash: 2000000, bowl: { noodle: 'mid', src: 'ready', soup: 'shoyu', top: ['chashu', 'nori'] }, weak: '常連では勝てない', follow: 0 },
  };
  // 型が現れる条件（「現れる条件」がそろわない型は出ない：f.1）
  // 老舗は駅前にいない（駅前の最初の競合は安売りチェーン：c.2）。安売り・こだわりはどこにでも
  const CAN = { cheap: () => true, kodawari: () => true, shinise: (area) => area !== 'ekimae' };
  function make(type, k) {
    const T = TYPES[type];
    return { id: `r${k}`, type, name: T.name, label: T.label, price: T.price, R: T.R, Q: T.Q, A: T.A, L: T.L, cash: T.cash, bowl: SIM.bowl.create(T.bowl, T.name), open: true, mood: 0, pending: [], weak: T.weak };
  }
  function create(seed, area, o = {}) {
    const rng = SIM.rng(seed * 40503 + 11);
    const run = o.run || 1;
    let types;
    if (seed === 0 && run === 1) types = ['cheap', 'kodawari', 'shinise'];
    else {
      const n = run === 1 ? 3 : 2 + Math.floor(rng() * 4);
      types = []; let guard = 50;
      while (types.length < n && guard--) { const t = Object.keys(TYPES)[Math.floor(rng() * 3)]; if (!CAN[t](area)) continue; if (types.filter((x) => x === t).length >= 2) continue; types.push(t); }
    }
    const list = types.map((t, k) => make(t, k));
    if (o.ghost && o.ghostChoices) {
      // 前の周の自分：顔なしの看板「前の店主」。前の周と同じ一杯の形で、同じ月に同じ値段を打つ。新しい手は打たない（読み勝てる：(o) 20）
      list.push({ id: 'ghost', type: 'ghost', name: '前の店主', label: '前の周の自分', price: (o.ghostChoices[0] || {}).price || 850, R: 3, Q: 3, A: 0, L: 0, cash: 0, bowl: SIM.bowl.create(SIM.bowl.presets[0].spec), open: true, choices: o.ghostChoices, pending: [], weak: '前の周のあなたと同じ手' });
    }
    return list;
  }
  // 反応（f.3）。me：{prevPrice, price, limited}。反応は1〜2か月の遅れで（pending に積む）
  function step(W, me, rng) {
    const out = JSON.parse(JSON.stringify(W.rivals));
    for (const r of out) {
      if (!r.open) continue;
      if (r.type === 'ghost') { const c = (r.choices || [])[W.t]; if (c && c.price) r.price = c.price; r.bowl = SIM.bowl.step(r.bowl, { tier: W.tier }); continue; }
      // 予定の反応を実行
      r.pending = (r.pending || []).filter((p) => { if (p.at > W.t) return true; if (p.kind === 'cut') r.price = Math.max(SIM.world.PRICE_MIN, r.price - p.amt); if (p.kind === 'limited') r.bowl = SIM.bowl.apply(r.bowl, 'limited', rng, W.t); return false; });
      // 値下げの追随：安売りは確率50で1か月後（f.3）
      if (me.price < me.prevPrice && TYPES[r.type].follow && rng() < TYPES[r.type].follow) r.pending.push({ kind: 'cut', amt: Math.min(50, me.prevPrice - me.price), at: W.t + 1 });
      // 限定で返す：こだわりは翌月に限定
      if (me.limited && r.type === 'kodawari') r.pending.push({ kind: 'limited', at: W.t + 1 });
      // こだわりは毎年一杯を手直しする（F の減衰はプレイヤーと同じ：f.2 ⑥）
      if (r.type === 'kodawari' && W.t % 12 === 6) r.bowl = SIM.bowl.apply(r.bowl, 'tweak', rng, W.t);
      r.bowl = SIM.bowl.step(r.bowl, { tier: W.tier, regShare: 0.4 });
      // 安売りは半年に1度の値下げ週間の後に戻す（ここでは値段は据え置き）
    }
    return out;
  }
  // 月の終わり：同じ式で出た客数から、ライバルの常連と口座（f.2 の損益）
  function settle(W, ex, comp) {
    W.rivals.forEach((r, i) => {
      if (!r.open || r.type === 'ghost') return;
      const T = TYPES[r.type], e = ex[i];
      const sold = e.N * C('days'), sales = sold * r.price * C('items');
      const op = sales * (1 - T.cost - C('utilVar')) - T.labor - T.rent - 150000 - C('utilFixed');
      r.cash += op;
      r.lastN = e.N; r.lastOp = op;
      r.L = Math.max(0, r.L * (1 - C('churn')) + C('retain') * e.Nnew);
      r.R = Math.max(1, Math.min(5, r.R + C('repAlpha') * (r.Q + 2 * Math.log(SIM.bowl.F(r.bowl)) - r.R) * 0.5));
      if (r.cash < -3000000) { r.open = false; r.closedAt = W.t; } // 倒産・撤退（居抜き物件が出る）
    });
    void comp;
  }
  // 手の内の見せ方（X32・n.6）。A 常時公開／B 条件達成で公開（決算書を読んだ型だけ）／C 回数制限つき（月1回のぞく）／D 一律非公開（予兆だけ）
  function visible(W, idx) {
    const r = W.rivals[idx]; if (!r) return null;
    const mode = W.flags.rivalInfo || 'A';
    const base = { name: r.name, label: r.label };
    const full = { ...base, price: r.price, R: Math.round(r.R * 2) / 2, rule: ruleOf(r.type), weak: r.weak, cash: r.cash };
    if (mode === 'A') return full;
    if (mode === 'B') return (W.flags.read || []).includes(r.type) ? full : { ...base, price: r.price, locked: '決算書を読むと手の内が分かる' };
    if (mode === 'C') return { ...base, price: r.price, R: Math.round(r.R * 2) / 2, peeks: W.flags.peeks, peek: 'のぞくと反応のルールが分かる（月1回）' };
    return { ...base, omen: (W.flags.omen && W.flags.omen.by === r.id) ? W.flags.omen : null };
  }
  const RULES = { cheap: '値下げには1か月後に半々で追随。値上げには「安さ」の宣伝', kodawari: '限定には翌月に限定で返す。値段は動かさない', shinise: '動かない。常連が厚く、暦に強い', ghost: '前の周のあなたと同じ月に同じ値段' };
  const ruleOf = (t) => RULES[t] || '';
  SIM.rivals = { TYPES, create, step, settle, visible, ruleOf };
})(typeof window !== 'undefined' ? window : globalThis);
