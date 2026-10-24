// ラーメン版の画面（DESIGN-RAMEN 版0.4 l.2 段5〜8・l.3・j章・m.3）。engine.js（js/sim/engine.js）から呼ばれる。index.html（ピヨ商店）は読まない。
// 画面：作戦の机 planScreen・一杯の組み立て bowlScreen・月報 reportScreen（＋締めの帯）・ふりかえり debriefScreen（四半期は4問と今の位置）・分かれ道の図 forkMapScreen・
//       町の地図 mapScreen（3エリア・予兆の印）・シェアの表 shareScreen・口座の帯（3層：全体・年次・目の前）・期日の一覧（常に見せる）。
// 置き方（j.2）：PC は3段（左＝期日の一覧・棚・シェア、中央＝出来事、右＝帳簿｜町｜店｜日誌｜会社）。幅48em 未満は中央だけ（左右は上のタブから窓で開く）。
// 押せる所には data-* の取っ手（tools/playtest の harness が押す：l.5）。数と言葉は js/sim/ramen-view.js（純粋関数・検査と同じ）。
(function () {
  'use strict';
  const D = window.SIMDATA, A = window.RAMENART, RV = D.rview;
  const RUI = (D.ramenUI = {});
  let api = null;
  const S = () => api.S;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const yen = (n) => `${Math.round(n).toLocaleString('ja-JP')}円`;
  const man = (n, sign = true) => `${sign ? (n >= 0 ? '＋' : '−') : n < 0 ? '−' : ''}${(Math.abs(n) / 10000).toLocaleString('ja-JP', { maximumFractionDigits: 1, minimumFractionDigits: Math.abs(n) < 100000 ? 1 : 0 })}万`;
  const pct = (x) => `${Math.round(x * 100)}%`;
  const ICON = (k, s) => A.icon(k, { size: s });
  const W = () => S().W;
  const tNow = () => { const m = api.month(); return m && m.ramenT != null ? m.ramenT : null; };
  const word = (w) => RV.word(w, api.knows);
  const bowlSpec = () => (W() ? W().stores[0].bowl.spec : S().bowlSpec || (D.bowl.presets.find((x) => x.id === (S().decisions || {}).bowl) || D.bowl.presets[0]).spec);
  const bowlName = () => ((S().profile || {}).bowlName || (W() && W().stores[0].bowl.name) || (D.bowl.presets.find((x) => x.id === (S().decisions || {}).bowl) || D.bowl.presets[0]).name);
  const formOf = () => { const st = W() ? W().stores[0] : null; if (!st) return (S().decisions || {}).form || 'part1'; return st.parts >= 2 ? 'part2' : st.parts === 0 && st.family >= 1 ? 'family' : 'part1'; };
  const seasonOf = () => RV.season(W() ? W().m : ((api.month() || {}).m || 4));
  const mixOf = () => D.world.AREAS[W() ? W().area : (S().decisions || {}).site || 'shotengai'].mix;
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  RUI.init = (x) => {
    api = x;
    document.body.classList.add('r-app');
    // 右の段・窓・地図の取っ手（どの画面の上でも効く）
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-rtab]');
      if (tab) { S().rtab = tab.dataset.rtab; api.save(); const r = document.querySelector('.r-right'); if (r) r.innerHTML = rightInner(); return; }
      const pn = e.target.closest('[data-rpanel]');
      if (pn) { panel(pn.dataset.rpanel); return; }
      const ar = e.target.closest('[data-area]');
      if (ar && ar.closest('.r-map')) { areaDetail(ar.dataset.area); return; }
      const lot = e.target.closest('[data-lot]');
      if (lot) { lotDetail(lot.dataset.lotArea, lot.dataset.lot); return; }
      const rv = e.target.closest('[data-rival]');
      if (rv) { rivalDetail(rv.dataset.rival); return; }
      const f = e.target.closest('[data-factor]');
      if (f && f.closest('.r-factors')) { const d = f.parentElement.querySelector('.r-fline'); if (d) d.hidden = !d.hidden; f.setAttribute('aria-expanded', d && !d.hidden ? 'true' : 'false'); }
    });
    document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.r-map g[role=button]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
  };
  RUI.on = () => S().mi > 0 && S().phase !== 'title';

  /* ======================= 口座の帯（3層）と、3段の枠 ======================= */
  const bookNow = () => { const b = api.balances(api.preClose(S().L)); return { b, cash: api.cashOf(b), loan: -(b['借入金'] || 0), vat: api.knows('仮受消費税') ? Math.max(0, -((b['仮受消費税'] || 0) + (b['仮払消費税'] || 0))) : 0 }; };
  let lastBand = null;
  function band() {
    const k = bookNow(), m = api.month(), t = tNow();
    const net = k.cash - k.loan;
    const st = W() ? RV.stages(S()) : null;
    const tt = t != null ? t : null;
    const near = nearGoal(tt);
    const prev = lastBand || { cash: k.cash, net };
    lastBand = { cash: k.cash, net };
    const num = (v, p, cls = '') => `<b class="r-num ${cls} ${v < 0 ? 'neg' : ''}" data-from="${Math.round(p)}" data-to="${Math.round(v)}">${yen(v)}</b>`;
    const steps = st ? st.list.map((x, i) => `<li class="${x.done ? 'done' : i === st.cur ? 'cur' : ''}" title="${esc(x.label)}"><i></i><span>${esc(x.id === 'fund' ? '2号店の自己資金' : x.label)}${x.done && x.at != null ? `<small>${RV.MON[x.at]}月</small>` : x.id === 'black' && x.shadowAt != null ? `<small>影の線は${RV.MON[x.shadowAt]}月</small>` : x.id === 'fund' ? `<small>${pct(x.prog)}</small>` : ''}</span></li>`).join('') : '<li class="cur"><i></i><span>開店の準備</span></li>';
    const g = Math.max(0, Math.min(1, net / RV.GOAL));
    const due = dueOf();
    const nd = due && due.items.find((x) => x.amt);
    return `<header class="r-band" data-band>
<div class="r-band-top"><div class="s-month"><small>${esc(api.shopName())}</small><b>${esc(m ? m.label : '')}</b></div>
<button class="r-bowlchip" data-rpanel="shop" aria-label="看板の一杯：${esc(bowlName())}">${A.bowl(bowlSpec(), { steam: false, label: bowlName() })}<span>${esc(bowlName())}</span></button>
<div class="r-kpis"><div class="r-kpi"><small>${ICON('wallet', 16)}口座のお金</small>${S().__predicting ? '<b>予想のあとで</b>' : num(k.cash, prev.cash)}${k.vat ? `<small class="r-azu">うち預かり ${yen(k.vat)}</small>` : ''}</div>
<div class="r-kpi"><small>${ICON('debt', 16)}${esc(word('借入金'))}</small><b>${yen(k.loan)}</b></div>
<div class="r-kpi main"><small>${ICON('coin', 16)}手もとに残るお金</small>${S().__predicting ? '<b>予想のあとで</b>' : num(net, prev.net)}</div></div></div>
<div class="r-goals">
<div class="r-goal near" data-band-near><span class="r-gl">目の前</span><span class="r-gt">${near ? esc(near.label) : '開店の準備（物件・人・一杯を決める）'}</span>${S().__est && S().__est.t === tt ? `<span class="r-est">見込み ${S().__est.N[0].toFixed(0)}〜${S().__est.N[2].toFixed(0)}人/日 → 月報で答え合わせ</span>` : ''}</div>
<div class="r-goal year"><span class="r-gl">${tNow() != null && tNow() >= 12 ? Math.floor(tNow() / 12) + 1 : 1}年目</span><ol class="r-steps">${steps}</ol></div>
<div class="r-goal all"><span class="r-gl">1億まで</span><span class="r-line" role="img" aria-label="手もとに残るお金が1億円までの${pct(g)}"><i style="width:${Math.max(0.6, g * 100)}%"></i></span><small class="r-rank">${g > 0 ? pct(g) : '0%'}・見込みは2年目から</small></div>
</div>
${nd ? `<div class="r-nextdue" data-due-next>${ICON('cal', 15)}次の期日：${nd.m}月${nd.d === 31 ? '末' : `${nd.d}日`} ${esc(nd.what)} <b class="${nd.amt < 0 ? '' : 'plus'}">${man(nd.amt)}</b>${due.low < 0 ? `<span class="r-risk">${ICON('warn', 15)}${RV.MON[due.items.find((x) => x.short).k % 12]}月に口座が足りなくなる</span>` : ''}</div>` : ''}
<nav class="r-tabs" aria-label="店の窓">${[['money', 'お金', 'wallet'], ['town', '町', 'pin'], ['shop', '店', 'shop'], ['book', '帳簿', 'paper'], ['log', '日誌', 'clip'], ['co', 'ほか', 'flag']].map(([k2, l, ic]) => `<button data-rpanel="${k2}" class="r-tab-${k2}">${ICON(ic, 16)}${l}</button>`).join('')}</nav>
</header>`;
  }
  RUI.shell = (body) => `${band()}<div class="r-grid"><aside class="r-left" aria-label="お金の約束と棚">${leftInner()}</aside><main class="s-main r-main" id="s-main" tabindex="-1">${body}</main><aside class="r-right" aria-label="帳簿・町・店">${rightInner()}</aside></div>`;
  // 描き直しのあと：数字を前から今へ動かす（0.5秒以内。動きを減らす設定では動かさない）
  RUI.afterFrame = () => {
    const bh = document.querySelector('.r-band'); if (bh) document.documentElement.style.setProperty('--band-h', `${bh.offsetHeight}px`);
    if (reduced()) return;
    document.querySelectorAll('.r-num[data-from]').forEach((el) => {
      const a = +el.dataset.from, b = +el.dataset.to; if (a === b || !isFinite(a)) return;
      const t0 = performance.now(), dur = 480;
      el.classList.add(b > a ? 'up' : 'down');
      const step = (now) => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = yen(a + (b - a) * e); if (k < 1) requestAnimationFrame(step); else setTimeout(() => el.classList.remove('up', 'down'), 900); };
      requestAnimationFrame(step);
    });
  };

  /* ---------- 左の段：期日の一覧（常に）・棚・シェア ---------- */
  function dueOf() { const t = tNow(); if (t == null && !W()) return null; const tt = t != null ? t : W() ? W().t - 1 : -1; return RV.dueList(S(), tt, bookNow().cash, api.knows); }
  function dueHTML(full) {
    const d = dueOf();
    if (!d) return '<p class="muted r-small">開店すると、払う約束・入る約束が日付の順に並ぶ。</p>';
    const rows = d.items.filter((x) => x.amt || x.kind === 'tax').slice(0, full ? 99 : 9);
    return `<div class="r-due" data-due><h4>${ICON('cal', 18)}期日の一覧 <small>${d.made ? '先6か月' : '先2か月（一覧を作ると6か月先まで）'}</small></h4><table class="r-tb"><tbody>${rows.map((x) => `<tr class="${x.short ? 'short' : ''}${x.amt > 0 ? ' in' : ''}"><td class="d">${x.m}/${x.d === 31 ? '末' : x.d}</td><td>${esc(x.what)}${x.est ? '<small>見込み</small>' : ''}</td><td class="n">${x.amt ? man(x.amt) : '—'}</td><td class="n bal">${man(x.bal, false)}</td></tr>`).join('')}</tbody></table>${d.low < 0 ? `<p class="r-risk">${ICON('warn', 16)}このままだと、口座が足りなくなる日がある</p>` : ''}${!full && d.items.length > rows.length ? '<button class="link" data-rpanel="money">ぜんぶ見る</button>' : ''}</div>`;
  }
  function shelfHTML() {
    const b = api.balances(api.preClose(S().L)), bs = api.bsFrom(b), sum = (a) => a.reduce((t, [, v]) => t + v, 0);
    const L = sum(bs.資産), R1 = sum(bs.負債), R2 = sum(bs.純資産), tot = Math.max(1, L, R1 + R2);
    return `<div class="r-shelf"><h4>${ICON('paper', 18)}棚（いまの店）</h4><div class="r-shelfbars"><div class="col"><i class="as" style="height:${(L / tot) * 100}%"><span>${esc(api.gw('資産'))}<b>${man(L, false)}</b></span></i></div><div class="col"><i class="li" style="height:${(Math.max(0, R1) / tot) * 100}%"><span>${esc(api.gw('負債'))}<b>${man(R1, false)}</b></span></i><i class="eq" style="height:${(Math.max(0, R2) / tot) * 100}%"><span>${esc(api.gw('純資産'))}<b>${man(R2, false)}</b></span></i></div></div></div>`;
  }
  function shareMini() {
    const t = W() ? W().t - 1 : null, sh = t != null && t >= 0 ? RV.shares(S(), t) : null;
    if (!sh) return '';
    return `<div class="r-sharemini" data-share><h4>${ICON('pin', 18)}町の客の取り合い <small>${esc(D.world.AREAS[W().area].label)}</small></h4>${sh.rows.map((r) => `<div class="r-srow ${r.type}"><span class="nm">${r.type === 'me' ? esc(api.shopName()) : esc(r.name)}</span><span class="bar"><i style="width:${(r.share * 100).toFixed(1)}%"></i></span><b>${pct(r.share)}</b>${r.d != null ? `<em class="${r.d >= 0.005 ? 'up' : r.d <= -0.005 ? 'dn' : ''}">${r.d >= 0.005 ? '▲' : r.d <= -0.005 ? '▼' : '―'}</em>` : '<em></em>'}</div>`).join('')}${sh.why ? `<p class="r-small">${esc(sh.why)}</p>` : ''}<button class="link" data-rpanel="town">地図で見る</button></div>`;
  }
  const leftInner = () => `${dueHTML(false)}${shelfHTML()}${shareMini()}`;

  /* ---------- 右の段：帳簿｜町｜店｜日誌｜会社 ---------- */
  const RTABS = [['town', '町'], ['shop', '店'], ['book', '帳簿'], ['log', '日誌'], ['co', '会社']];
  function rightInner() {
    const k = RTABS.some(([x]) => x === S().rtab) ? S().rtab : 'town';
    return `<div class="r-rtabs" role="tablist">${RTABS.map(([x, l]) => `<button role="tab" aria-selected="${x === k}" class="${x === k ? 'on' : ''}" data-rtab="${x}">${l}</button>`).join('')}</div><div class="r-rbody">${panelBody(k)}</div>`;
  }
  function panelBody(k) {
    if (k === 'money') return dueHTML(true) + shelfHTML();
    if (k === 'town') return townHTML();
    if (k === 'shop') return shopHTML();
    if (k === 'book') return `<div class="r-book">${api.companyView(api.balances(api.preClose(S().L)))}<button class="btn ghost wide" data-ov="co">元帳をひらく</button></div>`;
    if (k === 'log') return S().diary.length ? `<ul class="s-diary r-diary">${S().diary.slice().reverse().map((d) => `<li><b>${esc(d.m)}</b> ${esc(d.t)}</li>`).join('')}</ul>` : '<p class="muted">まだ記録はない。</p>';
    return `<div class="r-co"><button class="btn ghost wide" data-ov="map">考え方の地図（見つけた考え方）</button><button class="btn ghost wide" data-ov="grow">成長の記録</button><button class="btn ghost wide" data-ov="room">練習室</button><button class="btn ghost wide" data-ov="co">会社の棚と元帳</button><button class="btn ghost wide" data-ov="title">セーブスロット・設定</button>${forkSetting()}</div>`;
  }
  const forkSetting = () => `<label class="r-check"><input type="checkbox" data-fork-set ${S().forkOff ? '' : 'checked'}> 分かれ道の図を出す（割れた月だけ）</label>`;
  document.addEventListener('change', (e) => { if (e.target.matches && e.target.matches('[data-fork-set]')) { S().forkOff = !e.target.checked; api.save(); } });
  function panel(k) {
    const title = { money: 'お金の約束（期日の一覧）と棚', town: '町の地図とシェア', shop: '店と一杯', book: '帳簿（会社の棚）', log: '経営日誌', co: 'ほか' }[k] || '';
    const o = api.overlay(`<h3>${esc(title)}</h3><div class="r-panel">${panelBody(k)}</div>`);
    o.classList.add('r-ov');
  }

  /* ---------- 町の地図（mapScreen）・シェアの表（shareScreen） ---------- */
  function townHTML() {
    const t = W() ? Math.max(0, W().t - 1) : 0;
    const m = RV.mapModel(S(), tNow() != null ? tNow() : t);
    return `<div class="r-town" data-screen="map">${A.map(m, { shopName: api.shopName() })}<ul class="r-legend"><li><i class="me"></i>自分の店</li><li><i class="rv"></i>ほかのラーメン屋（型で色）</li><li><i class="lot"></i>空き物件（押すと5つの数）</li><li><i class="om"></i>予兆（工事・求人・回覧）</li></ul>${m.omens.length ? `<ul class="r-omens">${m.omens.map((o) => `<li data-omen-row="${o.card}">${ICON('warn', 16)}${esc(o.label)}</li>`).join('')}</ul>` : ''}${shareHTML()}</div>`;
  }
  function shareHTML() {
    const t = W() ? W().t - 1 : null, sh = t != null && t >= 0 ? RV.shares(S(), t) : null;
    if (!sh) return '<p class="muted r-small">開店すると、町の客の取り合い（シェア）が出る。</p>';
    return `<div class="r-share" data-share data-screen="share"><h4>町の客の取り合い（シェア・推定）<small>${RV.MON[t % 12]}月</small></h4><table class="r-tb"><thead><tr><th>店</th><th>割合</th><th>先月から</th><th>半年</th></tr></thead><tbody>${sh.rows.map((r) => `<tr class="${r.type}"><td>${r.type === 'me' ? `<b>${esc(api.shopName())}</b>` : esc(r.name)}</td><td class="n"><span class="bar"><i style="width:${(r.share * 100).toFixed(1)}%"></i></span>${pct(r.share)}</td><td class="n ${r.d >= 0.005 ? 'up' : r.d <= -0.005 ? 'dn' : ''}">${r.d == null ? '—' : `${r.d >= 0.005 ? '▲' : r.d <= -0.005 ? '▼' : '―'}${Math.abs(r.d * 100).toFixed(1)}pt`}</td><td>${A.spark(r.hist, { cls: r.type === 'me' ? '' : 'rv', lo: 0 })}</td></tr>`).join('')}</tbody></table>${sh.why ? `<p class="r-small">いちばん効いた要因：${esc(sh.why)}</p>` : ''}</div>`;
  }
  function areaDetail(id) {
    const a = D.world.AREAS[id], cal = D.world.CAL[a.cal];
    const faces = Object.entries(a.mix).filter(([, w]) => w > 0).map(([sg, w]) => `<span class="r-facew" style="--w:${w}">${A.face(sg, 0, { size: 26 + w * 40 })}<small>${pct(w)}</small></span>`).join('');
    const eps = Object.entries(a.mix).reduce((tt, [sg, w]) => tt + w * D.coef({ office: 'epsOffice', family: 'epsFamily', student: 'epsStudent', tourist: 'epsTourist' }[sg]), 0);
    api.overlay(`<h3>${esc(a.label)}のエリア</h3><div class="r-area"><h4>客層の顔の列</h4><div class="r-faces">${faces}</div><p class="r-small">値段への敏感さ（客層の平均）：${eps.toFixed(1)}（大きいほど、値上げで客がへりやすい）</p><h4>暦の型</h4><div class="r-calbars">${cal.map((x, i) => `<span style="--h:${(x - 0.6) * 140}%" class="${x >= 1.04 ? 'hi' : x <= 0.96 ? 'lo' : ''}"><i></i><small>${i + 1}</small></span>`).join('')}</div>${W() && W().area === id ? shareHTML() : '<p class="r-small">ここには、まだ自分の店がない。空き物件を押すと、出すときの数が分かる。</p>'}</div>`);
  }
  function lotDetail(area, id) {
    const lot = (RV.LOTS[area] || []).find((l) => l.id === id); if (!lot) return;
    const x = RV.lotInfo(W(), area, lot);
    api.overlay(`<h3>空き物件：${esc(D.world.AREAS[area].label)}の${esc(x.kind)}</h3><table class="r-tb r-lot" data-lot-info="${esc(id)}"><tr><td>人通り</td><td class="n">${esc(x.flow)}</td></tr><tr><td>家賃（月）</td><td class="n">${yen(x.rent)}</td></tr><tr><td>保証金</td><td class="n">${yen(x.deposit)}</td></tr><tr><td>内装</td><td class="n">${yen(x.fit)}</td></tr><tr><td>広さ</td><td class="n">${x.tsubo}坪</td></tr></table><p class="r-big">1日に余計に要る杯数：<b>${x.extra >= 0 ? '＋' : '−'}${Math.abs(x.extra)}杯</b></p><p class="r-small">いまの店と比べて増える家賃と内装の分を、1杯の残りで割った数。2号店を考えるのは2年目から。</p>`);
  }
  function rivalDetail(id) {
    const i = W() ? W().rivals.findIndex((r) => r.id === id) : -1; if (i < 0) return;
    const r = W().rivals[i], v = D.rivals.visible(W(), i) || {};
    api.overlay(`<h3>${esc(r.name)}</h3><div class="r-rivaldet" data-rival-info="${esc(id)}">${A.rival(r.type, r.name, { price: r.price, closed: r.open === false })}<p class="r-small">${esc(r.label)}${r.open === false ? '（閉店した）' : ''}</p><table class="r-tb">${v.price != null ? `<tr><td>1杯の値段</td><td class="n">${yen(v.price)}</td></tr>` : ''}${v.R != null ? `<tr><td>評判</td><td class="n">${'★'.repeat(Math.round(v.R))}${'☆'.repeat(5 - Math.round(v.R))} ${v.R}</td></tr>` : ''}${v.rule ? `<tr><td>動き方</td><td>${esc(v.rule)}</td></tr>` : ''}${v.weak ? `<tr><td>この店に勝てない所</td><td>${esc(v.weak)}</td></tr>` : ''}${v.locked ? `<tr><td colspan="2">${esc(v.locked)}</td></tr>` : ''}</table></div>`);
  }

  /* ---------- 店と一杯（右の段「店」） ---------- */
  const REG_LINES = {
    hike: ['値上げ、ちょっと考えちゃうな…', '50円高くなったね。味は好きだけど'],
    cut: ['安くなった！ 同僚も連れてくるよ', 'この値段なら毎週来られる'],
    wait: ['今日も並んだよ。昼休みがぎりぎり', '行列できてるね。すごいじゃない'],
    stock: ['売り切れだった…また来るね', 'スープ終わりって、早くない？'],
    peak: ['新しい味、うまい！', '手直ししたでしょ。前より好き'],
    rain: ['雨だから空いてると思った', '雨の日のスープは、しみるね'],
    summer: ['暑いけど、ここのは食べたくなる', '夏祭りの日、混んでたね'],
    winter: ['寒い日は、ここに限る', 'あったまる。いつもの一杯'],
    spring: ['開店おめでとう。近所なんだ', '春の売り出しで知ったよ'],
    autumn: ['涼しくなって、また通いはじめた', '秋はみその気分'],
    steady: ['いつもの、お願い', '変わらない味がいいんだよ', 'ここの{一杯}、仕事帰りに寄るんだ'],
  };
  const REGS = [{ seg: 'office', name: '佐野さん（勤め人）' }, { seg: 'family', name: '森田さん（近所の家族）' }, { seg: 'student', name: 'ケンタくん（学生）' }, { seg: 'tourist', name: 'リンさん（旅の人）' }];
  function regulars(t) {
    const r = (S().res || {})[t], p = (S().res || {})[t - 1], pol = (S().pols || {})[t] || {}, pp = (S().pols || {})[t - 1] || {};
    if (!r) return [];
    const st = r.lost > 0.04 * Math.max(1, r.X) ? 'stock' : (r.cap && r.demand > r.cap * 0.95) ? 'wait' : pp.price && pol.price > pp.price ? 'hike' : pp.price && pol.price < pp.price ? 'cut' : (W() && W().stores[0].bowl.peak > 0.05) ? 'peak' : r.weeks && r.weeks.filter((w) => w.rain).length >= 2 ? 'rain' : t % 3 === 0 ? RV.season(RV.MON[t % 12]) : 'steady';
    const mood = st === 'hike' || st === 'stock' ? -1 : st === 'cut' || st === 'peak' ? 1 : 0;
    const mix = mixOf(), segs = REGS.filter((x) => mix[x.seg] > 0).sort((a, b) => mix[b.seg] - mix[a.seg]).slice(0, Math.min(3, 1 + Math.floor(r.L / 3)));
    const lines = REG_LINES[st] || REG_LINES.steady;
    const changed = !p || st !== 'steady';
    return segs.map((x, i) => ({ ...x, mood: i === 0 ? mood : mood > 0 ? 1 : 0, line: changed && i < 2 ? lines[(t + i) % lines.length].replace('{一杯}', bowlName()) : null }));
  }
  function shopHTML() {
    const t = W() ? W().t - 1 : null, r = t != null && t >= 0 ? S().res[t] : null;
    const q = r ? Math.max(0, (r.demand || r.N) - 18) / 3 : 0;
    const spec = bowlSpec(), b = D.bowl, st = W() ? W().stores[0] : null;
    const cost = b.cost({ spec }), price = st ? st.price : D.coef('price0');
    const regs = t != null && t >= 0 ? regulars(t) : [];
    return `<div class="r-shoptab">${A.shop(formOf(), { name: api.shopName(), season: seasonOf(), queue: q, mix: mixOf() })}
<div class="r-bowlcard">${A.bowl(spec, { label: bowlName() })}<div><b class="r-bname">${esc(bowlName())}</b><small>${esc(b.label(spec))}</small><table class="r-tb"><tr><td>1杯の値段</td><td class="n">${yen(price)}</td></tr><tr><td>材料の値段（1杯）</td><td class="n">${yen(cost)}（${pct(cost / price)}）</td></tr>${st ? `<tr><td>一杯の魅力</td><td class="n">${st.bowl.peak > 0.01 ? `<span class="r-peak">話題の山 ＋${Math.round(st.bowl.peak * 100)}</span>` : ''}${(b.F(st.bowl) * 100).toFixed(0)}</td></tr>` : ''}</table></div></div>
${regs.length ? `<h4>常連さん</h4><ul class="r-regs">${regs.map((x) => `<li>${A.face(x.seg, x.mood, { size: 36 })}<div><small>${esc(x.name)}</small>${x.line ? `<p>「${esc(x.line)}」</p>` : ''}</div></li>`).join('')}</ul>` : ''}
${W() ? `<h4>ほかのラーメン屋</h4><div class="r-rivals">${W().rivals.filter((x) => x.type !== 'ghost').map((x) => `<button class="r-rivalbtn" data-rival="${x.id}">${A.rival(x.type, x.name, { price: x.price, closed: x.open === false })}</button>`).join('')}</div>` : ''}</div>`;
  }

  /* ======================= 目の前の目標（b.6） ======================= */
  function nearGoal(t) {
    if (t == null || !W()) return null;
    const saved = (S().nearSaved || {})[t]; if (saved) return saved;
    const list = RV.nearGoals(S(), t); if (!list.length) return null;
    const pick = (S().nearPick || {})[t];
    return list.find((x) => x.id === pick) || list[0];
  }

  /* ======================= 作戦の机（planScreen） ======================= */
  let PLAN = null;
  RUI.plan = (ev) => {
    const RM = D.ramen, t = ev.ramenT, s = S();
    if ((s.res || {})[t]) return api.next();
    const Wx = RM.world(s);
    // 一杯の組み立てで直した一杯を、世界の自店に入れる（ramen.js の RM.world は社長の案の一杯で作るので、画面の側で差し替える）
    if (s.bowlSpec && !s.__bowlIn) { Wx.stores[0].bowl = D.bowl.create(s.bowlSpec, (s.profile || {}).bowlName); s.__bowlIn = true; }
    if (!PLAN || PLAN.t !== t) { const pol = RM.policy(s, t); PLAN = { t, pol, base: { ...pol }, spread: null, open: false }; }
    const p = PLAN.pol, open = (ev.opens || []).filter((k) => RV.HANDS[k] || k === 'staff'), WD = D.world;
    if (!PLAN.spread) { PLAN.spread = {}; for (const k of open) PLAN.spread[k] = RV.spread(Wx, PLAN.base, k); }
    const used = WD.timeUsed(Wx, p), budget = WD.timeBudget(Wx, p);
    const prevOpen = t ? RM.opens(t - 1) : [];
    const wanted = (s.debriefNext || {})[t - 1];
    // 今月考える手：5つまで上に。新しく開いた手・ふりかえりで決めた手・動きの大きい手の順。残りはたたむ
    const order = [...open].sort((a, b) => score(b) - score(a));
    function score(k) { return (prevOpen.includes(k) ? 0 : 1e9) + (k === wanted ? 5e8 : 0) + (k === 'price' || k === 'prep' ? 1e6 : 0) + (PLAN.spread[k] || 0); }
    const top = order.slice(0, 5), rest = order.slice(5);
    const bigK = Object.entries(PLAN.spread).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 15000).slice(0, 2).map(([k]) => k);
    const trialNow = RV.trial(Wx, p, 12), trialSame = RV.trial(Wx, PLAN.base, 12);
    const near = nearGoal(t), nears = RV.nearGoals(s, t);
    const cal = RV.calendar3(Wx);
    const q = Math.max(0, trialNow.N[1] - 18) / 3;
    const hand = (k) => {
      const H = RV.HANDS[k], cur = RV.current(k, p, PLAN.base), opts = RV.optsOf(k, PLAN.base);
      const curTxt = k === 'price' ? yen(p.price) : k === 'staff' ? `${p.parts}人` : k === 'flyer' ? (p.flyer ? `${(p.flyer / 10000).toFixed(0)}万円` : 'なし') : k === 'prep' ? { low: '少なめ', mid: 'ふつう', high: '多め' }[p.prep] : k === 'supplier' ? { cheap: '安い問屋', std: '標準の問屋', high: '高い問屋' }[p.supplier || 'std'] : p[k] ? 'する' : 'しない';
      const isOn = (v) => String(v) === String(cur);
      const baseCash = trialNow.cash[1];
      const btns = opts.map(([v, l]) => {
        const q2 = RV.withHand(p, k, v), tr = isOn(v) ? trialNow : RV.trial(Wx, q2, 8), dd = tr.cash[1] - baseCash;
        const needT = WD.timeUsed(Wx, q2) > WD.timeBudget(Wx, q2) && !isOn(v);
        return `<button class="r-opt ${isOn(v) ? 'on' : ''}" data-plan="${k}" data-opt="${esc(v)}" ${needT ? 'disabled aria-disabled="true"' : ''}><b>${esc(l)}</b><small>${isOn(v) ? 'いまの手' : needT ? '時間が足りない' : `口座 ${man(dd)}`}</small></button>`;
      }).join('');
      const extra = k === 'price' && p.price < PLAN.base.price ? `<p class="r-note">${ICON('warn', 15)}${esc(RV.TEXT.plan.find((x) => x.startsWith('値下げは')))}</p>` : k === 'staff' ? `<p class="r-note">1人ふやすと：人のお金 月${man(D.coef('wagePart'))}・回せる客 ${WD.capOf({ parts: Math.min(6, p.parts + 1), family: p.family })}人/日・時間 ＋1（2人まで）</p>` : '';
      return `<div class="r-hand ${k === wanted ? 'wanted' : ''}" data-plan-row="${k}"><div class="r-hand-h">${ICON(H.icon, 22)}<b>${esc(H.label)}</b><span class="r-cur">いま：${esc(curTxt)}</span>${H.time ? `<span class="r-time">時間 ${D.coef('timeCost')[k === 'map' && !Wx.stores[0].mapDone ? 'mapFirst' : k] || 1}</span>` : ''}${bigK.includes(k) ? '<span class="r-big">動きの大きい手</span>' : ''}${k === wanted ? '<span class="r-want">先月のふりかえりで決めた手</span>' : ''}${!prevOpen.includes(k) && t ? '<span class="r-new">今月から</span>' : ''}</div><div class="r-opts" role="group" aria-label="${esc(H.label)}">${btns}</div>${extra}</div>`;
    };
    const row = (label, a, b2, unit, money) => { const f = (x) => (money ? man(x) : `${x.toFixed(1)}${unit}`); const lo = Math.min(a[0], b2[0]), hi = Math.max(a[2], b2[2]), sp = hi - lo || 1; const pos = (x) => ((x - lo) / sp) * 100; return `<tr><td>${esc(label)}</td><td class="r-range"><span class="rg same" style="left:${pos(b2[0])}%;width:${Math.max(1, pos(b2[2]) - pos(b2[0]))}%"></span><span class="rg" style="left:${pos(a[0])}%;width:${Math.max(1, pos(a[2]) - pos(a[0]))}%"></span><i style="left:${pos(a[1])}%"></i></td><td class="n">${f(a[0])}〜${f(a[2])}</td><td class="n mid">${f(a[1])}</td></tr>`; };
    const dCash = trialNow.cash[1] - trialSame.cash[1];
    const arrows = [['wallet', '口座', dCash], ['up', '利益', trialNow.op[1] - trialSame.op[1]], ['star', '評判', (p.prep === 'low' ? -1 : 0) + (p.price > PLAN.base.price ? -1 : 0) + (p.tweak ? 1 : 0)], ['person', '人', (p.parts - PLAN.base.parts) * 1 - (used > budget - 1 ? 1 : 0)], ['warn', '先の危険', -(RV.dueList(s, t, bookNow().cash + trialNow.cash[1], api.knows).low < 0 ? 1 : 0)]];
    api.frame(`<div class="r-plan" data-screen="plan">
<div class="r-scene">${A.shop(formOf(), { name: api.shopName(), season: seasonOf(), queue: q, mix: mixOf() })}<div class="r-scene-cap"><small>${esc(api.month().label)}・${esc(D.world.AREAS[Wx.area].label)}</small><b>${esc(bowlName())}</b></div></div>
<div class="s-card r-card"><div class="r-card-h"><small>${esc(api.month().label)}の作戦の机</small><h2>今月の手を決める</h2></div>
${near ? `<div class="r-near" data-goal="${near.id}">${ICON('flag', 18)}<div><small>目の前の目標</small><b>${esc(near.label)}</b></div>${nears.length > 1 ? '<button class="link" data-goal-next>ほかの目標にする</button>' : ''}</div>` : ''}
<div class="r-cal" aria-label="先3か月の暦">${cal.map((c) => `<span class="${c.mark === '◎' ? 'hi' : c.mark === '△' ? 'lo' : ''}"><b>${c.m}月</b><i>${c.mark}</i>${c.ev ? `<small>${esc(c.ev)}</small>` : ''}</span>`).join('')}</div>
<div class="r-timebar" data-time-left="${budget - used}"><span>${ICON('clip', 18)}時間の予算</span><span class="dots">${[...Array(budget).keys()].map((i) => `<i class="${i < used ? 'used' : ''}"></i>`).join('')}</span><b>のこり ${budget - used} ／ ${budget}</b>${t >= 12 && Wx.last && Wx.last.cardTime ? `<small>先月の札で使った分：${Wx.last.cardTime}</small>` : ''}${budget - used <= 0 ? '<small>人をふやすと、時間が1つふえる（2人まで）</small>' : ''}</div>
<h3 class="r-h3">今月考える手</h3><div class="r-hands">${top.map(hand).join('')}</div>
${rest.length ? `<details class="r-more" ${PLAN.open ? 'open' : ''} data-plan-more><summary>ほかの手（${rest.length}）</summary><div class="r-hands">${rest.map(hand).join('')}</div></details>` : ''}
<div class="r-trial" data-plan-trial><h3 class="r-h3">試算 <small>（12回まわした幅。うすい帯は前月のまま）</small></h3><table class="r-tb"><tbody>${row('客数（1日）', trialNow.N, trialSame.N, '人')}${row(`${word('売上')}（月）`, trialNow.sales, trialSame.sales, '', true)}${row('材料を引いた残り（月）', trialNow.gross, trialSame.gross, '', true)}${row('口座の増え方（月）', trialNow.cash, trialSame.cash, '', true)}${trialNow.reg && trialSame.reg ? row('常連さんの増え方（月）', trialNow.reg, trialSame.reg, '人') : ''}${trialNow.full && trialSame.full ? row('席が埋まっている日（月）', trialNow.full, trialSame.full, '日') : ''}${(() => { const xr = RV.extraRows(Wx, p); return xr.length && !(trialNow.reg || trialNow.full) ? xr.map((x) => `<tr data-trial-extra><td>${esc(x.label)}</td><td></td><td class="n" colspan="2">${esc(typeof x.value === 'number' ? x.value.toLocaleString('ja-JP') : x.value)}</td></tr>`).join('') : ''; })()}</tbody></table>
<div class="r-five">${arrows.map(([ic, l, v]) => `<span class="${v > 0.5 ? 'up' : v < -0.5 ? 'dn' : ''}">${ICON(ic, 18)}${l}<b>${v > 0.5 ? '↑' : v < -0.5 ? '↓' : '→'}</b></span>`).join('')}</div></div>
<div class="r-actions"><button class="btn wide" data-plan-ok>これで決める</button><button class="btn ghost" data-plan-same>前月のまま</button></div></div></div>`);
    const md = document.querySelector('[data-plan-more]'); if (md) md.addEventListener('toggle', () => { PLAN.open = md.open; });
    api.app.onclick = (e) => {
      const b = e.target.closest('[data-plan]');
      if (b && !b.disabled) {
        const k = b.dataset.plan, v0 = b.dataset.opt, v = k === 'prep' || k === 'supplier' ? v0 : v0 === 'true' ? true : v0 === 'false' ? false : Number(v0);
        PLAN.pol = RV.withHand(PLAN.base, k, v);
        // ほかの手の今の選び方は残す（1つずつ変える）
        for (const kk of open) if (kk !== k) { const cv = RV.current(kk, p, PLAN.base); PLAN.pol = RV.withHand(PLAN.pol, kk, cv); }
        if (k === 'tweak' && v === true) return bowlScreen({ mode: 'tweak', done: () => RUI.plan(ev) });
        RUI.plan(ev); return;
      }
      if (e.target.closest('[data-goal-next]')) { const i = nears.findIndex((x) => x.id === near.id); (s.nearPick = s.nearPick || {})[t] = nears[(i + 1) % nears.length].id; api.save(); RUI.plan(ev); return; }
      const same = e.target.closest('[data-plan-same]');
      if (same) PLAN.pol = { ...PLAN.base };
      if (e.target.closest('[data-plan-ok]') || same) {
        if (WD.timeUsed(Wx, PLAN.pol) > WD.timeBudget(Wx, PLAN.pol)) PLAN.pol = WD.fitTime(Wx, PLAN.pol, D.rng(t));
        const tr = RV.trial(Wx, PLAN.pol, 12);
        (s.trials = s.trials || {})[t] = { N: tr.N, op: tr.op, cash: tr.cash };
        s.__est = { t, N: tr.N };
        if (PLAN.spec) { Wx.stores[0].bowl.spec = PLAN.spec; s.bowlSpec = PLAN.spec; }
        if (near) (s.nearSaved = s.nearSaved || {})[t] = { id: near.id, label: near.label };
        RM.plan(s, t, PLAN.pol);
        // シェアの表と今の位置のための記録（同じ式で出た客数。ライバルは月の終わりの客数）
        (s.shareLog = s.shareLog || {})[t] = { me: s.res[t].N, rivals: s.W.rivals.filter((x) => x.type !== 'ghost' || s.W.flags.ghost).map((x) => ({ id: x.id, name: x.name, type: x.type, N: x.open === false ? 0 : x.lastN || 0, R: x.R, open: x.open !== false })) };
        if(t>=12){
          const log=s.shareLog[t];log.me=s.res[t].stores?s.res[t].stores[0].N:s.res[t].N;
          const local=new Set(s.W.rivals.filter(r=>(r.area||s.W.area)===s.W.area).map(r=>r.id));log.rivals=log.rivals.filter(r=>local.has(r.id));
          s.W.stores.forEach((st,i)=>{if(i&&st.open!==false&&(st.area||s.W.area)===s.W.area)log.rivals.push({id:st.id,name:`${i+1}号店`,type:'own',N:s.res[t].stores[i].N,R:st.R,open:true});});
        }

        const pp = PLAN.pol;
        s.diary.push({ m: api.month().label, t: `作戦の机：値段 ${yen(pp.price)}・仕込み ${{ low: '少なめ', mid: 'ふつう', high: '多め' }[pp.prep]}・パート ${pp.parts}人${pp.flyer ? `・チラシ ${(pp.flyer / 10000).toFixed(0)}万円` : ''}${pp.sns ? '・SNS' : ''}${pp.line ? '・LINE' : ''}${pp.coupon ? '・クーポン' : ''}${pp.tweak ? '・一杯の手直し' : ''}（見込み ${tr.N[0].toFixed(0)}〜${tr.N[2].toFixed(0)}人/日）` });
        PLAN = null; api.save(); api.next();
      }
    };
  };

  /* ======================= 一杯の組み立て（bowlScreen） ======================= */
  function bowlScreen(o) {
    const s = S(), b = D.bowl, start = JSON.parse(JSON.stringify(o.spec || bowlSpec()));
    let spec = JSON.parse(JSON.stringify(PLAN && PLAN.spec && o.mode === 'tweak' ? PLAN.spec : start));
    let name = o.mode === 'open' ? (s.profile && s.profile.bowlName) || (b.presets.find((x) => x.id === (s.decisions || {}).bowl) || b.presets[0]).name : bowlName();
    const price = W() ? W().stores[0].price : D.coef('price0');
    const diffN = (a, c) => (a.noodle !== c.noodle) + ((a.src || 'ready') !== (c.src || 'ready')) + (a.soup !== c.soup) + (JSON.stringify([...(a.top || [])].sort()) !== JSON.stringify([...(c.top || [])].sort()));
    const draw = (msg) => {
      const bw = b.create(spec), Q = b.Qb(bw), cost = b.cost(bw), ty = Q >= 3.6 ? 'こだわり' : Q < 2.8 ? '安売り' : 'ふつう';
      const mix = mixOf();
      const col = (k, label, opts, multi) => `<fieldset class="r-bcol" data-bowl="${k}"><legend>${esc(label)}</legend>${opts.map(([v, l, sub]) => { const on = multi ? (spec.top || []).includes(v) : (spec[k] || (k === 'src' ? 'ready' : '')) === v; return `<button class="r-opt ${on ? 'on' : ''}" data-bowl="${k}" data-v="${v}" aria-pressed="${on}"><b>${esc(l)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</button>`; }).join('')}</fieldset>`;
      const nd = o.mode === 'tweak' ? diffN(spec, start) : 0;
      const segs = Object.keys(mix).filter((x) => mix[x] > 0).sort((x, y) => mix[y] - mix[x]);
      api.frame(`<div class="r-bowlscr" data-screen="bowl">
<div class="s-card r-card"><div class="r-card-h"><small>${o.mode === 'tweak' ? '一杯の手直し（1か所だけ変える）' : '一杯の組み立て'}</small><h2>${o.mode === 'tweak' ? '看板の一杯を、少し直す' : '看板の一杯を組み立てて、名前をつける'}</h2></div>
${o.mode === 'open' ? api.talk([['shacho', 'ぼくの案をもとに、{名}が好きに直していいよ。名前もつけて！']]) : ''}
<div class="r-bowlgrid"><div class="r-bowlview">${A.bowl(spec, { label: name || '一杯' })}<div class="r-noren-name" aria-live="polite">${esc(name || '（名前をつける）')}</div>
<table class="r-tb"><tr><td>材料の値段（1杯）</td><td class="n">${yen(cost)}</td></tr><tr><td>材料の割合（値段 ${yen(price)}）</td><td class="n ${cost / price > 0.4 ? 'risk' : ''}">${pct(cost / price)}</td></tr><tr><td>店の型</td><td class="n">${ty}</td></tr></table>
<div class="r-fit"><small>客との相性（多い客から）</small>${segs.map((sg) => { const mk = b.fitMark(bw, sg); return `<span class="r-fitf" style="--w:${mix[sg]}">${A.face(sg, mk === '◎' ? 1 : mk === '△' ? -1 : 0, { size: 24 + mix[sg] * 30 })}<b class="${mk === '◎' ? 'good' : mk === '△' ? 'bad' : ''}">${mk}</b></span>`; }).join('')}</div></div>
<div class="r-bowlpick">${col('noodle', '麺', Object.entries(b.NOODLE).map(([k, x]) => [k, x.label, `${x.cost}円`]))}${col('src', '麺の出どころ', Object.entries(b.SRC).map(([k, x]) => [k, x.label, x.cost ? `＋${x.cost}円` : '']))}${col('soup', 'スープ', Object.entries(b.SOUP).map(([k, x]) => [k, x.label, `${x.cost}円`]))}${col('top', '具（3つまで）', Object.entries(b.TOP).map(([k, x]) => [k, x.label, `${x.cost}円`]), true)}
<label class="r-namebox">一杯の名前<input data-bowl-name maxlength="14" value="${esc(name)}" autocomplete="off" aria-label="一杯の名前（14字まで）"></label>
<div class="r-namechips">${[`${api.shopName().replace(/\s/g, '')}の${b.SOUP[spec.soup].label}`, `${b.SOUP[spec.soup].label}${{ thin: '細麺', mid: 'そば', thick: '太麺' }[spec.noodle]}`, `特製${b.SOUP[spec.soup].label}`].map((x) => `<button class="s-pill" data-name-chip="${esc(x)}">${esc(x)}</button>`).join('')}</div></div></div>
${msg ? `<p class="s-react ng">${esc(msg)}</p>` : ''}${o.mode === 'tweak' ? `<p class="r-note">変えた所：${nd}か所（手直しは1か所まで。話題の山は4か月で戻る）</p>` : ''}
<div class="r-actions">${o.mode === 'tweak' ? `<button class="btn wide" data-bowl-tweak ${nd !== 1 ? 'disabled' : ''}>この手直しで決める</button><button class="btn ghost" data-bowl-cancel>やめる（今のまま）</button>` : `<button class="btn wide" data-bowl-ok>この一杯で決める</button>`}</div></div></div>`);
      const inp = document.querySelector('[data-bowl-name]');
      if (inp) inp.addEventListener('input', () => { name = inp.value; const nn = document.querySelector('.r-noren-name'); if (nn) nn.textContent = name || '（名前をつける）'; });
    };
    draw();
    api.app.onclick = (e) => {
      const c = e.target.closest('[data-name-chip]');
      if (c) { name = c.dataset.nameChip; draw(); return; }
      const x = e.target.closest('button[data-bowl][data-v]');
      if (x) {
        const k = x.dataset.bowl, v = x.dataset.v;
        if (k === 'top') { const tp = new Set(spec.top || []); if (tp.has(v)) tp.delete(v); else { if (tp.size >= 3) return draw('具は3つまで。どれかを外してから足そう'); tp.add(v); } spec.top = [...tp]; } else spec[k] = v;
        draw(); return;
      }
      if (e.target.closest('[data-bowl-cancel]')) { if (PLAN) { PLAN.pol = { ...PLAN.pol, tweak: false }; PLAN.spec = null; } o.done(); return; }
      if (e.target.closest('[data-bowl-tweak]')) { PLAN.spec = spec; if (name) { s.profile.bowlName = name.trim(); W().stores[0].bowl.name = name.trim(); } o.done(); return; }
      if (e.target.closest('[data-bowl-ok]')) {
        const nm = (name || '').trim() || b.presets[0].name;
        s.bowlSpec = spec; s.profile.bowlName = nm;
        if (W()) { W().stores[0].bowl.spec = spec; W().stores[0].bowl.name = nm; }
        s.diary.push({ m: api.month().label, t: `看板の一杯「${nm}」（${b.label(spec)}）` });
        api.save(); o.done();
      }
    };
  }
  RUI.bowl = () => bowlScreen({ mode: 'open', done: () => api.next() });

  /* ======================= 月報（reportScreen）と締めの帯 ======================= */
  const FN = RV.FACTORS;
  RUI.report = (ev) => {
    const s = S(), t = ev.ramenT, r = (s.res || {})[t];
    if (!r) return api.next();
    if ((s.repDone || {})[t]) return closeBand(ev);
    const pol = (s.pols || {})[t] || {}, prev = (s.res || {})[t - 1];
    const sh = RV.shadow(s).months[t], trial = (s.trials || {})[t];
    const st = RV.stages(s), black = st.list[0];
    const firstNow = black.done && black.at === t;
    const ng = (s.nearSaved || {})[t];
    const ngOk = ng ? RV.goalCheck(ng.id, s, t, r) : null;
    const weeks = RV.weeks(r, pol, s.seed, t);
    const f = r.factors || {}, fk = RV.FACTOR_KEYS.filter((k) => typeof f[k] === 'number');
    const fmax = Math.max(0.5, ...fk.map((k) => Math.abs(f[k])));
    const auto = ev.auto(s);
    const card = (t >= 5 ? 0.3 : 0), take = 0.05;
    const known = (w) => api.knows(w);
    const hist = (key) => [...Array(6).keys()].map((k) => { const x = (s.res || {})[t - 5 + k]; return x ? (typeof key === 'function' ? key(x) : x[key]) : null; });
    const row = (label, v, key, o2 = {}) => `<tr data-rep-row="${esc(o2.id || label)}" class="${o2.cls || ''}"><td>${o2.ic ? ICON(o2.ic, 18) : ''}${esc(label)}${o2.sub ? `<small>${esc(o2.sub)}</small>` : ''}</td><td class="n ${v < 0 ? 'neg' : ''}">${typeof v === 'number' ? yen(v) : esc(v)}</td><td>${key ? A.spark(hist(key), { cls: o2.spark || '' }) : ''}</td></tr>`;
    const salesRows = known('仮受消費税') || t >= 7
      ? [row('売上（店内）', Math.round(r.sales * (1 - take) * (1 - card)), null, { sub: '税抜' }), row('売上（持ち帰り）', Math.round(r.sales * take * (1 - card)), null, { sub: '税抜' }), ...(card ? [row('売上（カード払い）', Math.round(r.sales * card), null, { sub: '入金は翌月20日' })] : [])]
      : [row('売上（現金）', Math.round(r.sales * (1 - card)), null), ...(card ? [row('売上（カード払い）', Math.round(r.sales * card), null, { sub: '入金は翌月20日' })] : [])];
    const sup = W().stores[0].supplier === 'cheap' || (s.decisions || {})[`supplier@${Object.keys(s.dealt || {}).find((k) => (s.dealt[k] || []).includes('supplier'))}`] === 'cheap' ? '安い問屋' : 'いつもの問屋（杉田食品）';
    const ads = [pol.flyer ? ['チラシ', -pol.flyer] : null, W().stores[0].line ? ['LINE の配信', -5000] : null, r.limited ? ['夏の限定', -30000] : null].filter(Boolean);
    const regs = regulars(t);
    const segs = Object.entries(mixOf()).filter(([, w]) => w > 0).sort((a, b) => b[1] - a[1]);
    const mood = r.R >= 3.8 ? 1 : r.R < 3 ? -1 : 0;
    const back = (s.cardOutcomes || []).filter((x) => x.t === t - 1);
    const fixesNow = (s.fixLog || []).filter((x) => x.mi === s.mi).length;
    const lead = firstNow ? `<div class="r-celebrate" data-first-black>${ICON('flag', 26)}<div><b>初めての月次黒字！</b><small>手を打たない店（影の線）は${black.shadowAt != null ? `${RV.MON[black.shadowAt]}月` : '1年のうちに来ない'}。${black.shadowAt != null && black.shadowAt > t ? `${black.shadowAt - t}か月早い` : black.shadowAt === t ? '同じ月' : ''}</small></div></div>` : '';
    api.frame(`<div class="r-report" data-screen="report">
<div class="r-rephead"><div class="r-repart">${A.shop(formOf(), { name: api.shopName(), season: seasonOf(), queue: Math.max(0, r.N - 18) / 3, mix: mixOf() })}</div>
<div class="r-repnums"><small>${esc(api.month().label)}の月報・${esc(bowlName())}</small>
<div class="r-bigrow"><div><small>1日のお客さん</small><b class="r-big">${r.N.toFixed(1)}<span>人</span></b>${trial ? `<small class="r-vs">見込み ${trial.N[0].toFixed(0)}〜${trial.N[2].toFixed(0)}人</small>` : ''}</div>
<div><small>この月のもうけ</small><b class="r-big r-num ${r.op < 0 ? 'neg' : 'pos'}" data-from="${Math.round(sh.op)}" data-to="${Math.round(r.op)}">${yen(r.op)}</b><small class="r-vs">手を打たない店 ${man(sh.op)}（${r.op - sh.op >= 0 ? '影の線より上' : '影の線より下'}）</small></div></div>
${lead}${ng && ngOk != null ? `<p class="r-ngoal ${ngOk ? 'ok' : ''}" data-goal-check="${ngOk ? 'ok' : 'ng'}">${ICON('flag', 16)}目の前の目標「${esc(ng.label)}」：${ngOk ? 'とどいた' : 'とどかなかった'}</p>` : ''}
${back.length ? `<ul class="r-back">${back.map((x) => { const c = D.cards.byId[x.card]; const o2 = c && c.options.find((y) => y.id === x.option); const oc = o2 && o2.outcomes.find((y) => y.id === x.outcome); return `<li>${ICON('paper', 16)}先月の「${esc(c ? c.title : x.card)}」→ ${esc(oc ? oc.label : x.outcome)}</li>`; }).join('')}</ul>` : ''}
</div></div>
<section class="s-card r-card"><h3 class="r-h3">週ごとの返り</h3><div class="r-weeks">${weeks.map((w, i) => `<div class="r-week"><small>第${i + 1}週</small><div class="wx">${w.fc == null ? '<span class="nofc">予報は見ていない</span>' : `<span>予報${ICON(w.fc ? 'rain' : 'sun', 20)}</span>`}<span>実際${ICON(w.rain ? 'rain' : 'sun', 24)}</span></div><b>${w.N.toFixed(0)}<small>人/日</small></b><span>${man(w.sales)}</span><i class="wbar" style="height:${Math.min(100, (w.N / Math.max(1, r.cap || 70)) * 140)}%"></i></div>`).join('')}</div></section>
<section class="s-card r-card"><h3 class="r-h3">お金の行</h3><table class="r-tb r-money"><tbody>
${salesRows.join('')}
${row(`材料（${sup}）`, -Math.round(r.cogs), 'cogs', { ic: 'pot', id: '材料', spark: 'rv' })}
${r.wasteCost ? row('廃棄（余ったスープと麺）', -Math.round(r.wasteCost), null, { sub: `${Math.round(r.waste)}杯分`, cls: 'warnrow' }) : ''}
${row('人のお金（給料）', -Math.round(r.labor + (r.famPay || 0)), (x) => x.labor + (x.famPay || 0), { ic: 'person', id: '人のお金' })}
${row('家賃', -Math.round(r.rent), null, { sub: t < 3 ? '最初の3か月は家賃なし' : '' })}
${row('ガス・水道・電気', -Math.round(r.util), 'util')}
${row('その他（電話・掃除・小物）', -Math.round(r.other), null)}
${ads.map(([l, v]) => row(`宣伝：${l}`, v, null, { ic: 'paper' })).join('')}
${r.fx ? row(r.fx > 0 ? '札で入ったお金' : '札で出ていったお金', Math.round(r.fx), null) : ''}
<tr class="sum"><td><b>この月のもうけ（およそ）</b></td><td class="n ${r.op < 0 ? 'neg' : ''}"><b>${yen(r.op)}</b></td><td>${A.spark(hist('op'))}</td></tr>
</tbody></table>
<div class="r-custs"><div class="r-segs">${segs.map(([sg, w]) => `<span class="r-segf">${A.face(sg, mood, { size: 22 + w * 26 })}<small>${pct(w)}</small></span>`).join('')}</div>
<table class="r-tb"><tr><td>${ICON('star', 18)}評判</td><td class="n">${'★'.repeat(Math.round(r.R))}${'☆'.repeat(5 - Math.round(r.R))} ${r.R.toFixed(2)}</td></tr><tr><td>${ICON('person', 18)}常連さん</td><td class="n">${r.L.toFixed(1)}人/日</td></tr><tr><td>${ICON('queue', 18)}品切れ・待ちで帰った客</td><td class="n ${r.lost > 0.04 * r.X ? 'risk' : ''}">${Math.round(r.lost)}人</td></tr><tr><td>${ICON('bowl', 18)}一杯の魅力</td><td class="n">${(r.F * 100).toFixed(0)}${W().stores[0].bowl.peak > 0.01 ? '（話題の山）' : ''}</td></tr></table></div>
${regs.length ? `<ul class="r-regs">${regs.filter((x) => x.line).map((x) => `<li>${A.face(x.seg, x.mood, { size: 34 })}<div><small>${esc(x.name)}</small><p>「${esc(x.line)}」</p></div></li>`).join('')}</ul>` : ''}</section>
${fk.length && prev ? `<section class="s-card r-card"><h3 class="r-h3">先月から客数が動いた理由 <small>（${f.total >= 0 ? '＋' : '−'}${Math.abs(f.total || 0).toFixed(1)}人/日。押すと説明）</small></h3><ul class="r-factors">${fk.sort((a, b) => Math.abs(f[b]) - Math.abs(f[a])).map((k) => `<li><button class="r-frow" data-factor="${k}" aria-expanded="false">${ICON(FN[k].icon, 18)}<span class="nm">${esc(FN[k].label)}</span><span class="fb"><i class="${f[k] >= 0 ? 'p' : 'm'}" style="width:${(Math.abs(f[k]) / fmax) * 50}%"></i></span><b>${f[k] >= 0 ? '＋' : '−'}${Math.abs(f[k]).toFixed(1)}</b></button><p class="r-fline" hidden>${esc(FN[k].line)}</p></li>`).join('')}</ul></section>` : ''}
${trial ? `<section class="s-card r-card r-gap"><h3 class="r-h3">あのときの試算と、実際の差</h3><p>作戦の机の試算：口座 ${man(trial.cash[1])}（幅 ${man(trial.cash[0])}〜${man(trial.cash[2])}）→ 実際 <b>${man(r.ord + r.dep - r.repay)}</b>。<b>${man(Math.abs(r.ord + r.dep - r.repay - trial.cash[1]), false)}</b> ずれた。${Math.abs(r.fx || 0) > 0 ? `ずれのうち ${man(r.fx)} は、先月の札の結果。` : ''}${fixesNow ? '今月は帳簿を直した。直したから、来月の試算は合う。' : ''}</p></section>` : ''}
${t >= 12 ? `<div class="s-card r-card">${(r.departures || []).map(x=>`<p>${esc(x.label)}が辞めた。来月の人の数を見直そう。</p>`).join('')}<h4>株主・店を作るお金</h4><table class="r-tb"><tbody>${row('株主とのお金', r.capital || 0, null, {id:'capital'})}${row('店を作るお金', r.invest || 0, null, {id:'invest'})}</tbody></table>${r.stores ? `<h4>店ごとの営業</h4><table class="r-tb"><thead><tr><th>店</th><th>1日のお客さん</th><th>売上</th></tr></thead><tbody>${r.stores.map((st,i)=>`<tr data-store-report="${i}"><td>${i+1}号店${st.open === false ? '（閉店）' : ''}</td><td>${(st.N || 0).toFixed(1)}人</td><td>${yen(st.sales || 0)}</td></tr>`).join('')}</tbody></table>` : ''}</div>` : ''}
<details class="s-card r-card r-bridge" data-bridge><summary>帳簿の口座と、店の口座のずれ</summary>${bridgeHTML(t)}</details>
${(() => { const hand = s.L.filter((x) => x.mi === s.mi && !x.auto); const fixed = new Set((s.fixLog || []).filter((x) => x.mi === s.mi).map((x) => x.ev)); return hand.length ? `<section class="s-card r-card"><h3 class="r-h3">今月、手で書いた書類 <small>（${hand.length}枚。押すと書いた仕訳）</small></h3><ul class="r-handdocs">${hand.map((x) => `<li><button class="link" data-rep-q="${esc(x.id)}">${esc(docTitle(x.ev))}</button>${fixed.has(x.ev) ? '<small>見直しで直した</small>' : ''}</li>`).join('')}</ul></section>` : ''; })()}
<section class="s-card r-card"><p class="r-small">一括確定で帳簿に入れる行：${auto.map((x) => esc(x.label)).join('・') || 'なし'}。手で書いた書類は、もう帳簿に入っている。</p><button class="btn wide" data-rep-ok>一括確定して、帳簿に入れる</button></section>
</div>`);
    api.app.onclick = (e) => {
      const qd = e.target.closest('[data-rep-q]');
      if (qd) { const x = s.L.find((y) => y.id === qd.dataset.repQ); if (x) api.overlay(`<h3>${esc(docTitle(x.ev))}</h3><table class="r-tb"><tr><th>借方</th><th></th><th>貸方</th><th></th></tr>${[...Array(Math.max(x.dr.length, x.cr.length)).keys()].map((i) => `<tr><td>${esc((x.dr[i] || [''])[0])}</td><td class="n">${x.dr[i] ? x.dr[i][1].toLocaleString('ja-JP') : ''}</td><td>${esc((x.cr[i] || [''])[0])}</td><td class="n">${x.cr[i] ? x.cr[i][1].toLocaleString('ja-JP') : ''}</td></tr>`).join('')}</table>`); return; }
      if (!e.target.closest('[data-rep-ok]')) return;
      for (const x of auto) api.post({ id: x.id, kind: 'auto_report', ans: { dr: x.dr, cr: x.cr } }, { dr: x.dr, cr: x.cr }, true);
      (s.repDone = s.repDone || {})[t] = true;
      if (firstNow) s.diary.push({ m: api.month().label, t: `初めての月次黒字（${yen(r.op)}）` });
      api.save(); closeBand(ev);
    };
  };
  // 帳簿（自分の書いた通帳）と、店の口座（世界の計算）の橋
  function bridgeHTML(t) {
    const s = S(), mi = s.mi;
    const b = api.balances(s.L.filter((x) => x.mi <= mi && !(x.closing)));
    const cardBook = s.L.filter((x) => x.mi === mi && /-doc\d+@/.test(x.ev || x.id || '')).reduce((tt, x) => tt + cashMove(x), 0);
    const br = RV.bridge(s, t, b, cardBook);
    if (!br) return '';
    return `<table class="r-tb"><tr><td>帳簿の口座（自分で書いた通帳の残り）</td><td class="n">${yen(br.book)}</td></tr>${br.rows.map((x) => `<tr><td>${esc(x.label)}<small>${esc(x.why)}</small></td><td class="n">${x.v >= 0 ? '＋' : '−'}${yen(Math.abs(x.v))}</td></tr>`).join('')}${br.rest ? `<tr class="warnrow"><td>まだ説明できていない差</td><td class="n">${yen(br.rest)}</td></tr>` : ''}<tr class="sum"><td>店の口座の計算（使った月に動かす）</td><td class="n">${yen(br.world)}</td></tr></table><p class="r-small">月報の「もうけ」は使った月で、通帳は払った日で動く。だから差が出る。差の中身が分かれば、どちらも正しい。</p>`;
  }
  const docTitle = (id) => { for (const m of D.months) for (const e of m.events) if (e.id === id && e.doc) return `${e.doc.date || ''} ${e.doc.title || ''}`.trim(); return id; };
  const cashMove = (x) => { let v = 0; for (const [a, n] of x.dr) if (a === '普通預金' || a === '現金') v += n; for (const [a, n] of x.cr) if (a === '普通預金' || a === '現金') v -= n; return v; };
  RUI.bridge = (t) => { const s = S(), mi = D.ramen.monthIndexOfT(t); const b = api.balances(s.L.filter((x) => x.mi <= mi && !x.closing)); const cardBook = s.L.filter((x) => x.mi === mi && /-doc\d+@/.test(x.ev || x.id || '')).reduce((tt, x) => tt + cashMove(x), 0); return RV.bridge(s, t, b, cardBook); };
  // 締めの帯（締め2画面目）：店じまいの絵と、数字が前の月から今へ動く。シェアの表は帯の中の1行
  function closeBand(ev) {
    const s = S(), t = ev.ramenT, r = s.res[t];
    const mi = s.mi, before = api.cashOf(api.balances(s.L.filter((x) => x.mi < mi))), now = bookNow();
    const loanBefore = -(api.balances(s.L.filter((x) => x.mi < mi))['借入金'] || 0);
    const sh = RV.shares(s, t), me = sh ? sh.rows.find((x) => x.id === 'me') : null;
    const st = RV.stages(s);
    api.frame(`<div class="r-closeband" data-screen="band"><div class="r-night">${A.shop(formOf(), { name: api.shopName(), season: seasonOf(), lit: false })}<p class="r-closecap">${esc(api.month().label)}の店じまい</p></div>
<div class="s-card r-card"><h3 class="r-h3">今月の帯</h3><div class="r-bandrows">
<div><small>口座のお金</small><b class="r-num" data-from="${Math.round(before)}" data-to="${Math.round(now.cash)}">${yen(now.cash)}</b><em class="${now.cash - before >= 0 ? 'up' : 'dn'}">${man(now.cash - before)}</em></div>
<div><small>手もとに残るお金</small><b class="r-num" data-from="${Math.round(before - loanBefore)}" data-to="${Math.round(now.cash - now.loan)}">${yen(now.cash - now.loan)}</b><em class="${now.cash - now.loan - (before - loanBefore) >= 0 ? 'up' : 'dn'}">${man(now.cash - now.loan - (before - loanBefore))}</em></div>
<div><small>この月のもうけ</small><b>${yen(r.op)}</b><em class="${r.op >= 0 ? 'up' : 'dn'}">${r.op >= 0 ? '黒字' : '赤字'}</em></div>
${me ? `<div data-share-line><small>町の客の取り合い</small><b>${pct(me.share)}</b><em class="${me.d >= 0.005 ? 'up' : me.d <= -0.005 ? 'dn' : ''}">${me.d == null ? '' : `${me.d >= 0 ? '▲' : '▼'}${Math.abs(me.d * 100).toFixed(1)}pt`}</em></div>` : ''}
</div><ol class="r-steps big">${st.list.map((x, i) => `<li class="${x.done ? 'done' : i === st.cur ? 'cur' : ''}"><i></i><span>${esc(x.label)}${x.done && x.at != null ? `<small>${RV.MON[x.at]}月</small>` : ''}</span></li>`).join('')}</ol>
<p class="r-small">帳簿の数字は、このあと書類と合っているかを見直す。</p><button class="btn wide" data-band-next>見直しへ</button></div></div>`);
    api.app.onclick = (e) => { if (e.target.closest('[data-band-next]')) api.next(); };
  }

  /* ======================= 月末のあと：ふりかえり・今の位置・分かれ道の図 ======================= */
  RUI.after = (done) => {
    const s = S(), t = tNow();
    // 周の記録（次の周の「前の周の自分」）
    s.runId = s.runId || `run${Date.now()}`;
    s.runs = (s.runs || []).filter((u) => u.id !== s.runId).concat([RV.runRecord(s)]).slice(-6);
    const db = RV.debrief(s, t);
    const fk = RV.forkTree(s, t);
    const steps = [];
    if (db && !((s.debriefs || {})[t] || {}).done) steps.push('deb');
    if (fk.split && !s.forkOff && (fk.now.length || fk.back.length)) steps.push('fork');
    const go = () => { const k = steps.shift(); if (!k) { api.save(); return done(); } if (k === 'deb') return debriefScreen(t, db, go); return forkMapScreen(t, fk, go); };
    go();
  };
  function debriefScreen(t, db, done) {
    const s = S(), rec = ((s.debriefs = s.debriefs || {})[t] = (s.debriefs || {})[t] || { picks: {}, ok: {} });
    let i = db.qs.findIndex((q) => rec.picks[q.id] == null);
    if (i < 0) i = db.qs.length;
    const pos = db.quarter ? RV.position(s, t) : null;
    const qhtml = (q) => {
      const picked = rec.picks[q.id];
      const opts = `<div class="r-debopts ${q.kind}" data-deb="${q.id}" role="group">${q.opts.map((o) => `<button class="r-opt ${picked === o.id ? 'on' : ''} ${picked != null && q.ans === o.id ? 'ans' : ''}" ${q.kind === 'factor' ? `data-deb-factor="${o.id}"` : `data-deb-opt="${o.id}"`} ${picked != null ? 'disabled' : ''}>${o.icon ? ICON(o.icon, 20) : ''}<b>${esc(o.label)}</b></button>`).join('')}</div>`;
      let res = '';
      if (picked != null && q.kind === 'factor') { const f = q.f, ks = RV.FACTOR_KEYS.filter((k) => typeof f[k] === 'number').sort((a, b) => Math.abs(f[b]) - Math.abs(f[a])), mx = Math.max(0.5, ...ks.map((k) => Math.abs(f[k]))); res = `<p class="s-react ${picked === q.ans ? '' : 'ng'}">${picked === q.ans ? '当たり。' : `いちばん大きかったのは「${esc(FN[q.ans].label)}」。`}${esc(FN[q.ans].line)}</p><ul class="r-factors small">${ks.slice(0, 5).map((k) => `<li><span class="r-frow ${k === q.ans ? 'top' : ''}">${ICON(FN[k].icon, 16)}<span class="nm">${esc(FN[k].label)}</span><span class="fb"><i class="${f[k] >= 0 ? 'p' : 'm'}" style="width:${(Math.abs(f[k]) / mx) * 50}%"></i></span><b>${f[k] >= 0 ? '＋' : '−'}${Math.abs(f[k]).toFixed(1)}</b></span></li>`).join('')}</ul>`; }
      if (picked != null && q.kind === 'other') res = `<p class="s-react ${picked === q.ans ? '' : 'ng'}">${picked === q.ans ? '当たり。' : 'じつは逆。'}ほかの理由を合わせると ${q.val >= 0 ? '＋' : '−'}${Math.abs(q.val).toFixed(1)}人/日。</p>`;
      if (picked != null && q.kind === 'book') res = `<p class="s-react ${picked === q.ans ? '' : 'ng'}">${picked === q.ans ? '当たり。' : `いちばん動いたのは「${esc(q.opts.find((o) => o.id === q.ans).label)}」の行（${man(q.val)}）。`}帳簿のこの行が、来月の試算の元になる。</p>`;
      if (picked != null && q.kind === 'next') res = `<p class="s-react">来月の作戦の机で「${esc(RV.HANDS[picked].label)}」を上に出す。</p>`;
      return `<div class="r-debq ${picked != null ? 'answered' : ''}"><p class="s-q">${q.id}. ${esc(q.q)}</p>${opts}${res}</div>`;
    };
    const shown = db.qs.slice(0, Math.min(db.qs.length, i + 1));
    const finished = i >= db.qs.length;
    api.frame(`<div class="r-debrief" data-screen="debrief"><div class="s-card r-card"><div class="r-card-h"><small>${esc(api.month().label)}のふりかえり${db.quarter ? '（四半期の4問）' : ''}</small><h2>${db.quarter ? 'この3か月をふりかえる' : '客数が動いた理由を当てる'}</h2></div>
${shown.map(qhtml).join('')}
${finished && pos ? positionHTML(pos, t) : ''}
${finished ? '<button class="btn wide" data-deb-next>つぎへ</button>' : ''}</div></div>`);
    api.app.onclick = (e) => {
      const b = e.target.closest('[data-deb-factor],[data-deb-opt]');
      if (b && !b.disabled) {
        const q = db.qs[i], v = b.dataset.debFactor || b.dataset.debOpt;
        rec.picks[q.id] = v; rec.ok[q.id] = q.ans == null ? null : v === q.ans;
        if (q.kind === 'factor') { (s.f4 = s.f4 || []).push({ t, pick: v, top: q.ans, ok: v === q.ans, factors: Object.fromEntries(RV.FACTOR_KEYS.map((k) => [k, +(q.f[k] || 0).toFixed(2)])) }); s.diary.push({ m: api.month().label, t: `ふりかえり：客数が動いた理由「${FN[v].label}」${v === q.ans ? '（当たり）' : `（実際は「${FN[q.ans].label}」）`}` }); }
        if (q.kind === 'next') (s.debriefNext = s.debriefNext || {})[t] = v;
        api.save(); debriefScreen(t, db, done); return;
      }
      if (e.target.closest('[data-deb-next]')) { rec.done = true; api.save(); done(); }
    };
  }
  function positionHTML(p, t) {
    const s = S();
    return `<div class="r-pos" data-pos><h3 class="r-h3">${ICON('flag', 20)}今の位置（${RV.MON[t % 12]}月）</h3>
<div class="r-ladder">${p.list.map((x, k) => `<div class="r-rung ${x.id === 'me' ? 'me' : ''}"><span class="no">${k + 1}</span>${x.id === 'me' ? `<span class="r-mebadge">${A.bowl(bowlSpec(), { steam: false })}</span><b>${esc(api.shopName())}</b>` : `${A.rival(x.type, x.name, { price: null })}`}<span class="r-rungN">${x.N.toFixed(1)}人/日</span><span class="r-rungR">★${x.R.toFixed(1)}</span></div>`).join('')}</div>
<p>町の中の位置：客数で <b>${p.rankN}番目</b>・評判で <b>${p.rankR}番目</b>（${p.of}軒の中）${p.rankN === p.of ? '。伸びしろは町でいちばん大きい' : ''}</p>
${p.prev ? `<p data-pos-prev>前の周の自分との差：手もとに残るお金 <b>${man(p.prev.dNet)}</b>・客数 <b>${p.prev.dN >= 0 ? '＋' : '−'}${Math.abs(p.prev.dN).toFixed(1)}人/日</b>${p.prev.dNet > 0 ? '。前の周の自分を越えている' : ''}</p>` : `<p data-pos-prev>前の周の自分との差：この周の線が、次の周の「前の自分」になる（2周目から）。いまは、手を打たない店との差：手もとに残るお金 <b>${man(p.shadow.dNet)}</b>・客数 <b>${p.shadow.dN >= 0 ? '＋' : '−'}${Math.abs(p.shadow.dN).toFixed(1)}人/日</b></p>`}
<p data-pos-award>ラーメン賞の候補：${p.award.cand ? '<b class="r-award">候補に入った</b>' : `まだ（評判 4.0以上で、町で客数がいちばん多い店。あと${p.award.needR > 0 ? `評判 ＋${p.award.needR.toFixed(2)}` : ''}${p.award.needR > 0 && p.award.needN > 0 ? '・' : ''}${p.award.needN > 0 ? `客数 ＋${p.award.needN.toFixed(1)}人/日` : ''}）`}</p>
<p class="r-small">ほかの人（別のプレイヤー）との順位は出さない。比べるのは、町の店と、前の周の自分だけ。${s.runs && s.runs.length > 1 ? '' : ''}</p></div>`;
  }
  // 分かれ道の図（forkMapScreen）：今月の判断の木。通った道は太く、通らなかった道は輪郭。先月の札の結果（割れた結果）も
  function forkMapScreen(t, fk, done) {
    const W0 = 420;
    const blocks = [...fk.back.map((b) => ({ kind: 'back', title: `先月：${b.title}`, paths: [{ label: b.option, chosen: true, outs: [{ label: b.got, w: b.gotW, got: true }, ...(b.split ? [{ label: b.most, w: null, got: false }] : [])] }] })), ...fk.now.map((n) => ({ kind: 'now', title: n.title, paths: n.paths }))];
    let y = 16; const svg = [];
    for (const bl of blocks) {
      svg.push(`<text x="8" y="${y + 4}" class="f-title">${esc(bl.title.length > 22 ? bl.title.slice(0, 22) + '…' : bl.title)}</text>`);
      const n = bl.paths.length;
      bl.paths.forEach((p2, k) => {
        const py = y + 22 + k * 26, ch = p2.chosen;
        svg.push(`<path d="M16 ${y + 10} C 40 ${y + 10}, 40 ${py}, 70 ${py}" class="f-edge ${ch ? 'on' : ''}"/><circle cx="70" cy="${py}" r="${ch ? 6 : 4}" class="f-node ${ch ? 'on' : ''}"/><text x="80" y="${py + 4}" class="f-lab ${ch ? 'on' : ''}">${esc(p2.label.length > 16 ? p2.label.slice(0, 16) + '…' : p2.label)}</text>`);
        if (ch && bl.kind === 'back') p2.outs.forEach((o, j) => { const oy = py - 8 + j * 18; svg.push(`<path d="M290 ${py} C 305 ${py}, 305 ${oy}, 320 ${oy}" class="f-edge ${o.got ? 'on' : ''}"/><text x="326" y="${oy + 4}" class="f-lab sm ${o.got ? 'on' : ''}">${esc((o.got ? '' : 'ふつうは：') + (o.label.length > 12 ? o.label.slice(0, 12) + '…' : o.label))}</text>`); });
        if (ch && bl.kind === 'now') svg.push(`<text x="300" y="${py + 4}" class="f-lab sm">結果は来月の月報で</text>`);
      });
      y += 30 + n * 26;
    }
    const H = Math.max(80, y);
    api.frame(`<div class="r-fork" data-screen="fork"><div class="s-card r-card"><div class="r-card-h"><small>${esc(api.month().label)}の分かれ道の図</small><h2>今月の分かれ道</h2></div>
<svg class="r-forksvg" viewBox="0 0 ${W0 + 60} ${H}" role="img" aria-label="今月の判断の分かれ道。太い線が通った道">${svg.join('')}</svg>
<p class="r-small">太い線が通った道、細い線が通らなかった道。${fk.changed.length >= 2 ? `作戦の机で ${fk.changed.length}つの手を変えた月。` : ''}</p>
<label class="r-check"><input type="checkbox" data-fork-off> 分かれ道の図を、これから出さない（「会社」の窓で戻せる）</label>
<button class="btn wide" data-fork-next>次の月へ</button></div></div>`);
    api.app.onclick = (e) => {
      if (e.target.closest('[data-fork-next]')) { const c = document.querySelector('[data-fork-off]'); if (c && c.checked) S().forkOff = true; api.save(); done(); }
    };
  }

  /* ======================= 月のはじめ（暦がめくれる） ======================= */
  RUI.monthIntro = (go) => {
    const m = api.month(), t = m.ramenT;
    const Wx = W();
    const cal = Wx ? RV.calendar3(Wx) : null;
    const prev = t ? (S().res || {})[t - 1] : null, sh = Wx && t ? RV.shadow(S()).months[t - 1] : null;
    api.frame(`<div class="r-intro" data-screen="intro"><div class="r-introart">${A.shop(formOf(), { name: api.shopName(), season: RV.season(m.m), queue: prev ? Math.max(0, prev.N - 18) / 3 : 0, mix: mixOf() })}<div class="r-mon"><b>${m.m}</b><small>月</small></div></div>
<div class="s-card r-card"><small>${esc(m.label)}</small><h2>${esc(api.fill(m.title))}</h2>
${prev && sh ? `<p class="r-shadowline">先月のもうけ ${man(prev.op)}・手を打たない店 ${man(sh.op)}（${prev.op >= sh.op ? '影の線より上' : '影の線より下'}）</p>` : ''}
${cal ? `<div class="r-cal">${cal.map((c) => `<span class="${c.mark === '◎' ? 'hi' : c.mark === '△' ? 'lo' : ''}"><b>${c.m}月</b><i>${c.mark}</i>${c.ev ? `<small>${esc(c.ev)}</small>` : ''}</span>`).join('')}</div>` : ''}
<p class="r-order">${['作戦の机', '書類', '札', '思い出す', '月報'].map((x, k) => `<span>${k + 1} ${x}</span>`).join('<i>→</i>')}</p>
<button class="btn wide" data-go>作戦の机へ</button></div></div>`);
    api.app.onclick = (e) => { if (e.target.closest('[data-go]')) go(); };
  };
})();
