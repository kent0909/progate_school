// ラーメン版の画面に出す数と言葉（DESIGN-RAMEN 版0.4 j章・l.3・b.6・i.5・c.7。段5〜6）。純粋関数（DOM なし）。
// 画面（js/ramen/ui.js）も検査の道具（sim-check --ramen・lexicon-check --ramen）も同じ関数を読む：
//  ・試算の幅（d.7：選ぶ前の幅）・影の線（手を打たない店：X28）・段階目標と目の前の目標（b.6）・期日の一覧（先6か月）
//  ・町の地図の印と予兆（予告の実在：f.3）・シェアの表・今の位置（X31）・分かれ道の図・ふりかえりの問い（F4）・帳簿の口座と店の口座の橋
// 画面の言葉は TEXT にまとめ、lexicon-check が遊ぶ順に読む（未習の会計用語は、教わる前はやさしい言葉で：PLAIN）。
(function (g) {
  const SIM = (g.SIMDATA = g.SIMDATA || {});
  const C = (k) => SIM.coef(k);
  const RV = (SIM.rview = SIM.rview || {});
  const MON = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  RV.MON = MON;
  const q = (arr, p) => { const a = [...arr].sort((x, y) => x - y); if (!a.length) return 0; const i = (a.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); };
  const sum = (a) => a.reduce((t, x) => t + x, 0);

  // ---------- 画面の言葉（lexicon-check --ramen が読む。会計用語は教わった後だけ。前は PLAIN の言い方） ----------
  RV.HANDS = {
    price: { label: '1杯の値段', icon: 'price', shelf: '値段' },
    prep: { label: '仕込みの量', icon: 'pot', shelf: '仕込み' },
    supplier: { label: '材料の問屋', icon: 'pot', shelf: '仕込み' },
    map: { label: '地図と口コミの整備', icon: 'pin', shelf: '集客', time: true },
    forecast: { label: '天気の予報を見る', icon: 'cloud', shelf: '仕込み', time: true },
    staff: { label: 'パートさんの人数', icon: 'person', shelf: '人' },
    haccp: { label: '衛生の記録', icon: 'clip', shelf: '人', time: true },
    inspect: { label: '材料の検品', icon: 'lens', shelf: '仕込み', time: true },
    sns: { label: 'SNS に自分で投稿', icon: 'phone', shelf: '集客', time: true },
    line: { label: 'LINE で常連さんに知らせる', icon: 'chat', shelf: '集客' },
    flyer: { label: 'チラシ', icon: 'paper', shelf: '集客' },
    coupon: { label: 'クーポン（1割引き）', icon: 'ticket', shelf: '集客' },
    tweak: { label: '一杯の手直し', icon: 'bowl', shelf: '一杯', time: true },
  };
  RV.OPTS = {
    price: [[-100, '−100円'], [-50, '−50円'], [0, '据え置き'], [50, '＋50円'], [100, '＋100円']],
    prep: [['low', '少なめ'], ['mid', 'ふつう'], ['high', '多め']],
    supplier: [['cheap', '安い問屋'], ['std', '標準の問屋'], ['high', '高い問屋']],
    staff: [[-1, '1人へらす'], [0, 'そのまま'], [1, '1人ふやす']],
    flyer: [[0, 'なし'], [30000, '3,000枚（3万円）'], [100000, '1万枚（10万円）']],
    onoff: [[true, 'する'], [false, 'しない']],
  };
  RV.FACTORS = {
    ramp: { label: '開店からの立ち上がり', icon: 'sprout', line: '開店したての店は、まだ町に知られていない。月がたつと少しずつ客が増える。' },
    calendar: { label: '暦・町の行事', icon: 'cal', line: 'その月の暦（休みの多い月・寒い月）と、町の行事の週。' },
    weather: { label: '天気', icon: 'cloud', line: '雨の週は客が1割へる。天気は仕込みの外れにも効く。' },
    price: { label: '値段', icon: 'price', line: '自分の値段と、町の相場（みんなが覚えている値段）の差。' },
    rep: { label: '評判', icon: 'star', line: '食べた人の満足（一杯・待ち・品切れ）で動く。' },
    bowl: { label: '一杯の魅力', icon: 'bowl', line: '新しい一杯・手直し・限定で上がり、4か月で戻る。' },
    ad: { label: '宣伝・地図', icon: 'paper', line: 'チラシ・SNS・地図の整備で、店を知る人がふえる。' },
    rival: { label: 'ほかの店', icon: 'shop', line: 'ほかの店の値段・開店・限定で、客が動く。' },
    stockout: { label: '品切れ・待ち', icon: 'queue', line: '仕込みが足りない日や、回せる客数を越えた日。' },
  };
  RV.FACTOR_KEYS = Object.keys(RV.FACTORS);
  RV.TEXT = {
    plan: ['今月の作戦の机', '今月考える手', 'ほかの手（たたんだ）', '時間の予算', 'のこり', '先3か月の暦', '試算（12回まわした幅）', '客数（1日）', '売れた額（月）', '材料を引いた残り（月）', '口座の増え方（月）', '常連さんの増え方（月）', '席が埋まっている日（月）', '動きの大きい手', '前月のまま', 'これで決める', '値下げは、3か月で効きが半分になる（客が新しい値段に慣れる）', '目の前の目標', 'ほかの目標にする', '先月のふりかえりで決めた手'],
    bowl: ['一杯の組み立て', '麺', '麺の出どころ', 'スープ', '具（3つまで）', '材料の値段（1杯）', '材料の割合', '店の型', '客との相性', '一杯の名前', 'この一杯で決める', '飽きの体温計', '常連さんが新しいのを楽しみにしている', '手直し', '新しい一杯', 'やめる（今のまま）'],
    report: ['月報', '週ごとの返り', '予報', '実際', '客数', '売上', '店内', '持ち帰り', 'カード払い', '材料', '人のお金', '家賃・ガス水道電気・その他', '宣伝', '廃棄', '品切れ', '評判', '常連さん', '一杯の魅力', '先月から客数が動いた理由', 'あのときの試算と、実際の差', '手を打たない店（影の線）', '初めての月次黒字', '帳簿の口座と、店の口座のずれ', '一括確定して、帳簿に入れる'],
    debrief: ['ふりかえり', '先月から客数が動いた、いちばん大きな理由は？', 'それを除くと、客数は先月より増えた？へった？', '今月いちばん大きく動いたお金は、どの行に出た？', '来月、いちばん考えたい手は？', '分かれ道の図', '通った道', '通らなかった道', '今の位置', '町の中の位置', '前の周の自分との差', 'ラーメン賞の候補', '分かれ道の図を出さない'],
    band: ['口座のお金', 'うち預かり', '借りたお金', '手もとに残るお金', '目の前', '1年目の目標', '1億まで', '次の期日'],
  };
  // 教わる前の言い方（engine の gw と同じ考え方。会計の語は名前の札のあとだけ）
  RV.PLAIN = { 借入金: '借りたお金', 仮受消費税: '預かったお金', 買掛金: 'あとで払う材料の代金', 未払金: 'あとで払う約束', クレジット売掛金: 'あとで入るカードの代金', 給料: '人のお金', 仕入: '材料', 売上: '売れた額', 広告宣伝費: '宣伝のお金' };
  RV.word = (w, knows) => (knows && knows(w) ? w : RV.PLAIN[w] || w);

  // ---------- 試算の幅（d.7）：同じ手を、乱数の種を変えて n 回まわした幅（札は引かない）。種は月で固定（手を比べるとき、運は同じ） ----------
  RV.trial = (W, pol, n = 12) => {
    const o = { N: [], sales: [], gross: [], cash: [], op: [] };
    for (let j = 0; j < n; j++) {
      const r = SIM.world.month(W, pol, { noCards: true, noFactors: true, rng: SIM.rng(90001 + j * 7919 + W.t * 31) }).res;
      // regularDelta は「1日あたりの常連の杯数」の増減。画面は「人/月」で出すので、営業日 ÷ 常連1人の月の来店回数で換算する（world.trial と同じ）
      if (typeof r.regularDelta === 'number') (o.reg = o.reg || []).push(r.regularDelta * C('days') / C('regularVisits'));
      if (typeof r.fullDays === 'number') (o.full = o.full || []).push(r.fullDays);
      o.N.push(r.N); o.sales.push(r.sales); o.gross.push(r.sales - r.cogs - r.wasteCost); o.cash.push(r.ord + r.dep - r.repay); o.op.push(r.op);
    }
    const band = (a) => [q(a, 0.1), q(a, 0.5), q(a, 0.9)];
    // 計算の担当（版0.5）が res に足す常連の増減・席が埋まった日は、あれば幅にして返す（無ければ出さない）
    return { N: band(o.N), sales: band(o.sales), gross: band(o.gross), cash: band(o.cash), op: band(o.op), reg: o.reg ? band(o.reg) : null, full: o.full ? band(o.full) : null };
  };
  // 計算の側の試算の行（SIMDATA.world.trial(W, pol).rows。版0.5 で「常連 +○人/月」「席が埋まっている日 ○日/月」が入る）。無ければ空
  RV.extraRows = (W, pol) => {
    if (!SIM.world || typeof SIM.world.trial !== 'function') return [];
    let rows; try { rows = (SIM.world.trial(W, pol) || {}).rows || []; } catch (e) { return []; }
    return rows.map((r) => (Array.isArray(r) ? { label: r[0], value: r[1] } : { label: r.label || r.k || '', value: r.value != null ? r.value : r.v })).filter((r) => /常連|席/.test(String(r.label)));
  };
  // 1つの手だけを変えた方針
  RV.withHand = (pol, k, v) => {
    const p = { ...pol };
    if (k === 'price') p.price = Math.max(SIM.world.PRICE_MIN, Math.min(SIM.world.PRICE_MAX, pol.price + Number(v)));
    else if (k === 'staff') p.parts = Math.max(0, Math.min(C('hireMax'), pol.parts + Number(v)));
    else if (k === 'flyer') p.flyer = Number(v);
    else if (k === 'prep') p.prep = v;
    else if (k === 'supplier') p.supplier = v;
    else p[k] = v === true || v === 'true';
    return p;
  };
  // 手の「動きの大きさ」：選択肢の間で、口座の増え方の中央値がどれだけ違うか（良し悪しは言わない）
  RV.spread = (W, pol, k) => {
    const opts = RV.optsOf(k, pol);
    const mids = opts.map(([v]) => RV.trial(W, RV.withHand(pol, k, v), 6).cash[1]);
    return Math.max(...mids) - Math.min(...mids);
  };
  RV.optsOf = (k, pol) => (RV.OPTS[k] || RV.OPTS.onoff).filter(([v]) => !(k === 'price' && (pol.price + v < SIM.world.PRICE_MIN || pol.price + v > SIM.world.PRICE_MAX)) && !(k === 'staff' && (pol.parts + v < 0 || pol.parts + v > C('hireMax'))));
  // 今の設定の値（選択肢のどれに当たるか）
  RV.current = (k, pol, base) => (k === 'price' ? pol.price - base.price : k === 'staff' ? pol.parts - base.parts : k === 'flyer' ? pol.flyer || 0 : k === 'prep' ? pol.prep : k === 'supplier' ? pol.supplier || 'std' : !!pol[k]);

  // ---------- 先3か月の暦（◎○△）。町の行事は印つき ----------
  RV.calendar3 = (W) => [0, 1, 2].map((k) => {
    const m = ((W.m - 1 + k) % 12) + 1, x = SIM.world.calendar(W.town.areas[W.area].cal, m), ev = (W.events || []).find((e) => e.m === m);
    return { m, mul: x, mark: x >= 1.04 ? '◎' : x <= 0.96 ? '△' : '○', ev: ev ? { spring: '春の商店会の売り出し', summer: '夏祭り', year: '年末の売り出し' }[ev.id.replace('ev_', '')] : null };
  });

  // ---------- 影の線：手を打たない店（同じ物件・同じ店の形・同じ一杯で、開いた手をふつうの既定のまま）。乱数なし・札なし ----------
  const shadowCache = {};
  RV.shadow = (S) => {
    const d = S.decisions || {}, spec = S.bowlSpec || (SIM.bowl.presets.find((x) => x.id === d.bowl) || SIM.bowl.presets[0]).spec;
    const key = JSON.stringify([S.seed || 0, d.site, d.form, spec]);
    if (shadowCache[key]) return shadowCache[key];
    let W = SIM.world.create({ seed: S.seed || 0, area: d.site || 'shotengai', form: d.form || 'part1', bowl: spec, tier: 0 });
    const out = [];
    let prev = null;
    for (let t = 0; t < 12; t++) {
      const p = SIM.world.policy0(W, prev);
      const open = SIM.ramen.opens(t);
      for (const k of ['flyer', 'coupon', 'sns', 'line', 'forecast', 'inspect', 'tweak', 'limited']) p[k] = k === 'flyer' ? 0 : false;
      p.map = open.includes('map');
      p.haccp = open.includes('haccp');
      const r = SIM.world.month(W, p, { noise: false, noCards: true, noFactors: true });
      out.push({ t, op: r.res.op, N: r.res.N, cash: r.W.cash, net: SIM.world.netCash(r.W) });
      W = r.W; prev = p;
    }
    const first = out.find((x) => x.op > 0);
    return (shadowCache[key] = { months: out, firstBlack: first ? first.t : null });
  };

  // ---------- 段階目標（年次：S1 の主の線）と、1億の細い線（b.6・X28） ----------
  RV.SECOND_SHOP = 4200000; // 2号店の自己資金：出店1,400万の3割 [BIZ-RAMEN 2.1]（DESIGN-RAMEN b.3 の表）
  RV.GOAL = 100000000;
  RV.stages = (S) => {
    const res = S.res || {}, ts = Object.keys(res).map(Number).sort((a, b) => a - b);
    const first = ts.find((t) => res[t].op > 0);
    let run = 0, three = null;
    for (const t of ts) { run = res[t].op > 0 ? run + 1 : 0; if (run >= 3 && three == null) three = t; }
    const W = S.W, net = W ? SIM.world.netCash(W) : 0;
    const sh = S.W ? RV.shadow(S) : null;
    const st = [
      { id: 'black', label: '初めての月次黒字', done: first != null, at: first, shadowAt: sh ? sh.firstBlack : null },
      { id: 'three', label: '黒字を3か月つづける', done: three != null, at: three },
      { id: 'fund', label: '2号店の自己資金（手もとに残るお金 420万）', done: net >= RV.SECOND_SHOP, at: null, prog: Math.max(0, Math.min(1, net / RV.SECOND_SHOP)) },
    ];
    const cur = st.findIndex((x) => !x.done);
    return { list: st, cur: cur < 0 ? st.length : cur, net, toGoal: Math.max(0, Math.min(1, net / RV.GOAL)) };
  };

  // ---------- 目の前の目標（b.6：先月の結果と暦から候補を出し、選び直せる。達成しても報酬は出さない） ----------
  RV.nearGoals = (S, t) => {
    const last = (S.res || {})[t - 1], out = [], W = S.W;
    const sh = W ? RV.shadow(S).months[t] : null;
    const st = RV.stages(S);
    if (!st.list[0].done) out.push({ id: 'black', label: sh ? `今月のもうけを、手を打たない店（${man(sh.op)}）より上に` : '今月のもうけを黒字に', check: (r) => (sh ? r.op > sh.op : r.op > 0) });
    if (last && last.waste > 0.06 * Math.max(1, last.X)) out.push({ id: 'waste', label: `今月の廃棄を、先月（${Math.round(last.waste)}杯）の半分に`, check: (r) => r.waste <= last.waste / 2 });
    if (last && last.lost > 0.04 * Math.max(1, last.X)) out.push({ id: 'lost', label: `品切れ・待ちで帰った客（先月${Math.round(last.lost)}人）をへらす`, check: (r) => r.lost < last.lost });
    if (last) out.push({ id: 'reg', label: `常連さんを、先月（${last.L.toFixed(1)}人/日）より1人ふやす`, check: (r) => r.L >= last.L + 1 });
    if (W && (W.events || []).some((e) => e.m === W.m)) out.push({ id: 'event', label: '行事の週に、品切れを出さない', check: (r) => r.lost < 0.02 * Math.max(1, r.X) });
    if (W && W.flags && W.flags.omen && !W.flags.omenOpened) out.push({ id: 'omen', label: '新しい店が開く前に、常連さんを2人ふやす', check: (r) => last ? r.L >= last.L + 2 : r.L >= 2 });
    if (!out.length) out.push({ id: 'cash', label: '口座のお金を、先月より減らさない', check: (r) => r.ord + r.dep - r.repay >= 0 });
    return out.slice(0, 3);
  };
  // 目の前の目標の答え合わせ（作戦の机で決めた目標の id と、その月の結果）
  RV.goalCheck = (id, S, t, r) => {
    const last = (S.res || {})[t - 1], sh = S.W ? RV.shadow(S).months[t] : null;
    if (!r) return null;
    switch (id) {
      case 'black': return sh ? r.op > sh.op : r.op > 0;
      case 'waste': return last ? r.waste <= last.waste / 2 : null;
      case 'lost': return last ? r.lost < last.lost : null;
      case 'reg': return last ? r.L >= last.L + 1 : null;
      case 'event': return r.lost < 0.02 * Math.max(1, r.X);
      case 'omen': return last ? r.L >= last.L + 2 : r.L >= 2;
      default: return r.ord + r.dep - r.repay >= 0;
    }
  };

  // ---------- 期日の一覧（先6か月。作る前は先2か月だけ：札 due「期日の一覧を作るか」） ----------
  // 1年目の骨（ramen-y1.js）と同じ日付：家賃1日・返済10日・カードの入金20日・給料25日・ガス代27日・材料の代金は月末（6月から掛け）
  RV.dueList = (S, t, bookCash, knows) => {
    const res = S.res || {}, last = res[t] || res[t - 1] || { labor: 200000, famPay: 0, util: 70000, cogs: 250000, wasteCost: 0, sales: 700000 };
    const made = (S.decisions || {})[Object.keys(S.decisions || {}).find((k) => k.startsWith('due@')) || ''] === 'make';
    const horizon = made ? 6 : 2, items = [];
    const W = S.W, rent = W ? C('rentPerTsubo')[W.area] * C('tsubo') : 120000;
    const prin = Math.round(C('loan') / C('loanYears') / 12), intM = Math.round((C('loan') * C('loanRate')) / 12);
    const vatOn = (k) => k >= 7;
    for (let k = t + 1; k <= Math.min(t + horizon, 13); k++) {
      const m = MON[k % 12], est = k > t + 1;
      const r = res[k - 1] || last;
      if (k >= 3) items.push({ k, m, d: 1, what: '家賃', amt: -Math.round(rent * (vatOn(k) ? 1.1 : 1)), kind: 'rent' });
      if (k >= 3) items.push({ k, m, d: 10, what: `公庫の返済${k === 3 ? '（利息は4か月分）' : ''}`, amt: -(prin + (k === 3 ? intM * 4 : intM)), kind: 'repay' });
      if (k >= 6) { const card = Math.round((r.sales || 0) * 0.3 * (vatOn(k - 1) ? 1.1 : 1) * (1 - 0.0324)); items.push({ k, m, d: 20, what: 'カードの代金が入る', amt: card, kind: 'cardin', est }); }
      if (k >= 1) items.push({ k, m, d: 25, what: `給料（${MON[(k - 1) % 12]}月分）`, amt: -Math.round((r.labor || 0) + (r.famPay || 0)), kind: 'salary', est });
      if (k >= 1) items.push({ k, m, d: 27, what: `ガス水道電気（${MON[(k - 1) % 12]}月分）`, amt: -Math.round(r.util || 0), kind: 'util', est });
      if (k >= 3) items.push({ k, m, d: 31, what: `材料の代金（${MON[(k - 1) % 12]}月分）`, amt: -Math.round(((r.cogs || 0) + (r.wasteCost || 0)) * (vatOn(k - 1) ? 1.08 : 1)), kind: 'ap', est });
      if (k === 2 && (S.decisions || {})['insurance@2'] && (S.decisions || {})['insurance@2'] !== 'none') items.push({ k, m, d: 1, what: '火災の保険（1年分）', amt: (S.decisions['insurance@2'] === 'full' ? -60000 : -36000), kind: 'ins' });
      const fl = ((S.pols || {})[k - 1] || {}).flyer;
      if (fl) items.push({ k, m, d: 31, what: 'チラシの代金', amt: -fl, kind: 'flyer' });
      if (k === 13) items.push({ k, m, d: 31, what: knows && knows('法人税等') ? '法人税等と消費税の納付（決算で決まる）' : '1年のもうけの税金と、預かったお金の納付（決算で決まる）', amt: 0, kind: 'tax', est: true });
    }
    items.sort((a, b) => a.k - b.k || a.d - b.d);
    let bal = bookCash;
    for (const x of items) { bal += x.amt; x.bal = bal; x.short = bal < 0; }
    return { items, made, horizon, low: items.length ? Math.min(...items.map((x) => x.bal)) : bookCash };
  };

  // ---------- 町の地図（3エリア）：自店・ライバル・空き物件・予兆の印（工事・求人・回覧）。建物の後ろに隠れる印は作らない ----------
  RV.AREA_ORDER = ['ekimae', 'shotengai', 'jutaku'];
  // 空き物件（各エリア2つ：居抜き1・新店1）。人通り・家賃・保証金・内装・坪【置き値：l.4 の坪単価と c.5 の始め方 B・C の内装】
  RV.LOTS = {
    ekimae: [{ id: 'e1', kind: '居抜き', flow: '多い', tsubo: 10, fit: 1500000 }, { id: 'e2', kind: '新店', flow: '多い', tsubo: 12, fit: 8000000 }],
    shotengai: [{ id: 's1', kind: '居抜き', flow: 'ふつう', tsubo: 10, fit: 1500000 }, { id: 's2', kind: '新店', flow: 'ふつう', tsubo: 8, fit: 6000000 }],
    jutaku: [{ id: 'j1', kind: '居抜き', flow: '少ない', tsubo: 10, fit: 1500000 }, { id: 'j2', kind: '新店', flow: '少ない', tsubo: 15, fit: 9000000 }],
  };
  // 1日に余計に要る杯数：いまの店と比べて増える月の固定費（家賃＋内装の償却）÷（1杯の残り×営業日）
  RV.extraBowls = (W, area, lot) => {
    const price = W ? W.stores[0].price : C('price0');
    const margin = price * C('items') * (1 - C('cogs') - C('utilVar'));
    const myRent = W ? C('rentPerTsubo')[W.area] * C('tsubo') : 120000;
    const rent = C('rentPerTsubo')[area] * lot.tsubo, dep = lot.fit / 5 / 12, myDep = C('fitout') / C('fitoutLife') / 12;
    return Math.round((rent + dep - myRent - myDep) / (margin * C('days')));
  };
  RV.lotInfo = (W, area, lot) => ({ ...lot, area, rent: C('rentPerTsubo')[area] * lot.tsubo, deposit: C('rentPerTsubo')[area] * lot.tsubo * 6, extra: RV.extraBowls(W, area, lot) });
  // 予兆の印。dealt：月ごとに引いた札（{t: [id…]}）。W：今の世界。t：今の月
  // 工事：出店の予兆の札（rival_open）を引いた月から、新しい店が開くまで。求人：開く前の月。回覧：町の行事の札を引いた月（行事の前の月）
  RV.omens = (dealt, W, t) => {
    const out = [];
    const t0 = Object.keys(dealt || {}).map(Number).filter((k) => k <= t && (dealt[k] || []).includes('rival_open'))[0];
    const om = W && W.flags && W.flags.omen;
    const opened = W && W.flags && W.flags.omenOpened;
    if (t0 != null && !opened) {
      const openAt = om ? om.at : t0 + 3;
      out.push({ kind: 'kouji', card: 'rival_open', from: t0, at: 'omen', label: `工事の看板：ラーメン屋が${MON[openAt % 12]}月に開く見込み`, openAt });
      if (om && t >= om.at - 1) out.push({ kind: 'kyujin', card: 'rival_open', from: om.at - 1, at: 'omen', label: '新しい店の求人の張り紙（パート募集）' });
    }
    for (const id of ['ev_spring', 'ev_summer', 'ev_year']) if ((dealt[t] || []).includes(id)) out.push({ kind: 'kairan', card: id, from: t, at: 'board', label: `商店会の回覧：${{ ev_spring: '来月、春の売り出し', ev_summer: '夏祭り（出店の誘い）', ev_year: '来月、年末の売り出し' }[id]}` });
    return out;
  };
  // 地図の中身。自店と、自店のエリアのライバル（開いている店・閉じた店）、空き物件、予兆
  RV.mapModel = (S, t) => {
    const W = S.W, area = W ? W.area : (S.decisions || {}).site || 'shotengai';
    const rivals = W ? W.rivals.filter((r) => r.type !== 'ghost' || (W.flags && W.flags.ghost)).map((r, i) => ({ id: r.id, name: r.name, type: r.type === 'ghost' ? 'ghost' : r.type, label: r.label, price: r.price, R: r.R, open: r.open !== false, slot: r.id === 'rnew' ? 'omen' : `r${i}` })) : [];
    const lots = {};
    for (const a of RV.AREA_ORDER) lots[a] = RV.LOTS[a].filter((l) => !(a === area && l.kind === '居抜き')).map((l) => RV.lotInfo(W, a, l));
    return { area, areas: RV.AREA_ORDER.map((a) => ({ id: a, label: SIM.world.AREAS[a].label, mine: a === area, cal: SIM.world.AREAS[a].cal, mix: SIM.world.AREAS[a].mix })), rivals, lots, omens: RV.omens(S.dealt || {}, W, t), season: W ? RV.season(W.m) : 'spring' };
  };
  RV.season = (m) => (m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter');

  // ---------- シェアの表（エリア×店の推定客数の割合。前月比の矢印・半年の折れ線） ----------
  RV.shares = (S, t) => {
    const log = S.shareLog || {}, at = (k) => { const x = log[k]; if (!x) return null; const all = [{ id: 'me', N: x.me }, ...x.rivals.filter((r) => r.open)]; const tot = sum(all.map((r) => r.N)) || 1; const o = {}; all.forEach((r) => { o[r.id] = r.N / tot; }); return o; };
    const now = at(t), prev = at(t - 1);
    if (!now) return null;
    const x = log[t];
    const rows = [{ id: 'me', name: null, type: 'me', N: x.me }, ...x.rivals.filter((r) => r.open)].map((r) => ({ ...r, share: now[r.id] || 0, d: prev && prev[r.id] != null ? (now[r.id] || 0) - prev[r.id] : null, hist: [...Array(6).keys()].map((k) => { const s = at(t - 5 + k); return s ? s[r.id] || 0 : null; }) }));
    const f = ((S.res || {})[t] || {}).factors || {};
    const top = RV.topFactor(f);
    return { rows, why: top && Math.abs(f[top]) >= 0.3 ? `${RV.FACTORS[top].label}で ${f[top] >= 0 ? '＋' : '−'}${Math.abs(f[top]).toFixed(1)}人/日` : null };
  };
  RV.topFactor = (f) => { const ks = RV.FACTOR_KEYS.filter((k) => typeof f[k] === 'number'); if (!ks.length) return null; return ks.sort((a, b) => Math.abs(f[b]) - Math.abs(f[a]))[0]; };

  // ---------- 今の位置（四半期：6・9・12・3月。X31）：町の中の位置・前の周の自分との差・ラーメン賞の候補 ----------
  RV.QUARTER = [2, 5, 8, 11];
  RV.position = (S, t) => {
    const x = (S.shareLog || {})[t], W = S.W, r = (S.res || {})[t];
    if (!x || !W || !r) return null;
    const list = [{ id: 'me', N: x.me, R: r.R }, ...x.rivals.filter((y) => y.open).map((y) => ({ id: y.id, name: y.name, type: y.type, N: y.N, R: y.R }))];
    const byN = [...list].sort((a, b) => b.N - a.N), byR = [...list].sort((a, b) => b.R - a.R);
    const rankN = byN.findIndex((y) => y.id === 'me') + 1, rankR = byR.findIndex((y) => y.id === 'me') + 1;
    const runs = (S.runs || []).filter((u) => u.id !== S.runId && u.months && u.months[t]);
    const prevRun = runs.length ? runs[runs.length - 1] : null;
    const net = SIM.world.netCash(W), sh = RV.shadow(S).months[t];
    const award = { cand: r.R >= 4.0 && rankN === 1, needR: Math.max(0, 4.0 - r.R), needN: rankN === 1 ? 0 : Math.max(0, byN[0].N - x.me) };
    return { list: byN, rankN, rankR, of: list.length, prev: prevRun ? { net: prevRun.months[t].net, N: prevRun.months[t].N, dNet: net - prevRun.months[t].net, dN: x.me - prevRun.months[t].N } : null, shadow: { dNet: net - sh.net, dN: x.me - sh.N }, award };
  };
  // 周の記録（meta の runs：次の周の「前の周の自分」）
  RV.runRecord = (S) => ({ id: S.runId, shop: (S.profile || {}).shopName, seed: S.seed || 0, area: (S.decisions || {}).site, form: (S.decisions || {}).form, months: Object.fromEntries(Object.entries(S.res || {}).map(([k, r]) => [k, { N: r.N, op: r.op, net: (r.cash || 0) - (r.loan || 0) }])) });

  // ---------- ふりかえりの問い（F4。毎月1問、四半期は4問） ----------
  RV.debrief = (S, t) => {
    const r = (S.res || {})[t], p = (S.res || {})[t - 1];
    if (!r || !p) return null;
    const f = r.factors || {}, top = RV.topFactor(f);
    if (!top) return null;
    const quarter = RV.QUARTER.includes(t);
    const qs = [{ id: 1, kind: 'factor', q: RV.TEXT.debrief[1], opts: RV.FACTOR_KEYS.map((k) => ({ id: k, label: RV.FACTORS[k].label, icon: RV.FACTORS[k].icon })), ans: top, f }];
    if (quarter) {
      const rest = (f.total || 0) - f[top];
      qs.push({ id: 2, kind: 'other', q: `「${RV.FACTORS[top].label}」を除くと、客数は先月より増えた？へった？`, opts: [{ id: 'up', label: '増えた' }, { id: 'down', label: 'へった' }], ans: rest >= 0 ? 'up' : 'down', val: rest });
      const lines = [['sales', '売上', r.sales - p.sales], ['cogs', '材料', -((r.cogs + r.wasteCost) - (p.cogs + p.wasteCost))], ['labor', '人のお金', -((r.labor + r.famPay) - (p.labor + p.famPay))], ['ads', '宣伝', -((r.ads || 0) - (p.ads || 0))], ['rent', '家賃・ガス水道電気', -((r.rent + r.util) - (p.rent + p.util))]];
      const big = [...lines].sort((a, b) => Math.abs(b[2]) - Math.abs(a[2]))[0];
      qs.push({ id: 3, kind: 'book', q: RV.TEXT.debrief[3], opts: lines.map(([id, label]) => ({ id, label })), ans: big[0], val: big[2] });
      qs.push({ id: 4, kind: 'next', q: RV.TEXT.debrief[4], opts: ['price', 'prep', 'staff', 'flyer', 'tweak'].map((k) => ({ id: k, label: RV.HANDS[k].label })), ans: null });
    }
    return { quarter, qs };
  };

  // ---------- 分かれ道の図（その月に札で選んだ判断。通った道は太く、通らなかった道は輪郭。先月の札の結果も） ----------
  // 「割れた月」：先月に選んだ札の結果が、いちばん多い結果と違った月か、今月2つ以上の手を前月から変えた月（設定で消せる）
  RV.forkTree = (S, t) => {
    const cards = SIM.cards.byId, dec = S.decisions || {};
    const now = ((S.dealt || {})[t] || []).filter((id) => cards[id] && dec[`${id}@${t}`]).map((id) => {
      const c = cards[id], pick = dec[`${id}@${t}`];
      return { id, title: c.title, paths: c.options.map((o) => ({ id: o.id, label: o.label, chosen: o.id === pick, outs: o.outcomes.map((x) => ({ label: x.label, w: x.w })) })) };
    });
    const back = (S.cardOutcomes || []).filter((x) => x.t === t - 1).map((x) => {
      const c = cards[x.card]; if (!c) return null; const o = c.options.find((y) => y.id === x.option) || { outcomes: [] };
      const most = [...o.outcomes].sort((a, b) => b.w - a.w)[0] || {};
      const got = o.outcomes.find((y) => y.id === x.outcome) || {};
      return { id: x.card, title: c.title, option: o.label, got: got.label, gotW: got.w, most: most.label, split: got.id !== most.id };
    }).filter(Boolean);
    const pp = (S.pols || {})[t], pq = (S.pols || {})[t - 1];
    const changed = pp && pq ? ['price', 'prep', 'parts', 'flyer', 'sns', 'line', 'coupon', 'forecast', 'inspect', 'map', 'haccp'].filter((k) => JSON.stringify(pp[k]) !== JSON.stringify(pq[k])) : [];
    const split = back.some((b) => b.split) || changed.length >= 2;
    return { now, back, changed, split };
  };

  // ---------- 週の行（月報 ①）：週の天気（予報と実際）と客数・売上。月の合計を週の揺れと雨で4つに分ける ----------
  RV.weeks = (r, pol, seed, t) => {
    const ws = r.weeks || [];
    const wt = ws.map((w) => (1 + (w.u || 0)) * (w.rain ? C('rainCut') : 1));
    const tot = sum(wt) || 1, rng = SIM.rng((seed || 0) * 131 + t * 17 + 5);
    return ws.map((w, i) => { const hit = rng() < 0.8; return { rain: w.rain, fc: pol && pol.forecast ? (hit ? w.rain : !w.rain) : null, N: (r.N * wt[i] * 4) / tot, sales: (r.sales * wt[i]) / tot }; });
  };

  // ---------- 帳簿の口座と店の口座の橋（段0〜4の申し送り ③）。帳簿（自分で書いた通帳の残り）から、店の口座（世界の計算）へ ----------
  // 店の口座の計算は「使った月」にお金を動かす（給料・ガス代・材料は使った月、カードの売上は売れた月、消費税は数えない、札の結果は翌月）。
  // 帳簿は「払った・入った日」に書く。差は次の項目で説明でき、残り（説明できない差）は 0 になるように検査する（sim-check と画面の試験）
  RV.bridge = (S, t, b, cardBook = 0) => {
    const r = (S.res || {})[t]; if (!r) return null;
    const book = (b['現金'] || 0) + (b['普通預金'] || 0);
    const rows = [];
    const add = (label, v, why) => { if (Math.round(v)) rows.push({ label, v: Math.round(v), why }); };
    add('来月25日に払う、今月の給料', -(r.labor + (r.famPay || 0)), '店の計算は働いてもらった月に引く。帳簿は払った日に書く');
    add('来月27日に払う、今月のガス・水道・電気', -r.util, '使った月と払う月がずれる');
    add('あとで払う材料の代金（買掛金）', b['買掛金'] || 0, '材料は使った月、代金は翌月末');
    add('あとで払う約束（未払金）', b['未払金'] || 0, 'チラシや修理の代金は翌月末');
    add('あとで入るカードの代金', b['クレジット売掛金'] || 0, '売れた月と入金の月がずれる');
    add('預かったお金（消費税の差し引き）', (b['仮受消費税'] || 0) + (b['仮払消費税'] || 0), '預かった消費税は店のもうけではない。店の計算は消費税を数えない');
    // 札の書類：帳簿は札を選んだ月に書き、店の計算は翌月の作戦の机のあとに返す（c.7「札の結果は翌月」）
    add('今月の札の書類（店の計算では来月）', -cardBook, '札の結果は翌月に返る');
    add('カードの手数料（店の計算は数えていない）', b['支払手数料'] || 0, 'カードの会社が入金のときに引いたお金');
    const explained = sum(rows.map((x) => x.v));
    const world = Math.round(r.cash);
    return { book, world, rows, rest: world - (book + explained) };
  };
  // ---------- 月の並びに画面の出来事を足す（ramen.js の台本と計算は変えない。読み出しの側で足す） ----------
  //  ・開店の前：社長の案から一杯を選んだあとに、一杯の組み立て（bowl）
  //  ・店の月：月の順を「作戦の机→書類→札→想起→月報」に（c.7）。想起（recall）を月報の前に
  RV.arrange = () => {
    if (!SIM.months || SIM.months.__arranged) return;
    for (const m of SIM.months) {
      const i = m.events.findIndex((e) => e.t === 'decision' && e.id === 'bowl');
      if (i >= 0 && !m.events.some((e) => e.t === 'bowl')) m.events.splice(i + 1, 0, { t: 'bowl', id: 'bowl-build' });
      if (m.ramenT != null) { const k = m.events.findIndex((e) => e.t === 'rreport'); if (k >= 0 && !m.events.some((e) => e.t === 'recall')) m.events.splice(k, 0, { t: 'recall', id: `recall${m.ramenT}`, ramenT: m.ramenT }); }
    }
    SIM.months.__arranged = true;
  };
  RV.arrange();
  const man = (n) => `${n >= 0 ? '＋' : '−'}${(Math.abs(n) / 10000).toFixed(1)}万`;
  RV.man = man;
})(typeof window !== 'undefined' ? window : globalThis);
