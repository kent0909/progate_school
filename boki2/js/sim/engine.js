// ピヨ商店 — 1か月ずつ経営・記帳するシミュレーション（縦切りの試作）。docs/PEDAGOGY.md の段階1。
(function () {
  'use strict';
  const B = window.BOKI, D = window.SIMDATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('ja-JP') : esc(n));
  const val = (x, S) => (typeof x === 'function' ? x(S) : x);
  const CATS = ['資産', '負債', '純資産', '収益', '費用'];
  const CAT_HUE = { 資産: 212, 負債: 2, 純資産: 272, 収益: 142, 費用: 30, その他: 190 };
  const cat = (a) => (B.accounts[a] || {}).cat || 'その他';
  // 評価勘定（マイナスの箱）は資産の側に、マイナスとして置く
  const CONTRA_OF = { 貸倒引当金: '売掛金', 車両運搬具減価償却累計額: '車両運搬具', 備品減価償却累計額: '備品', 建物減価償却累計額: '建物' };
  const CONTRA = new Set(Object.keys(CONTRA_OF));
  const order = (a) => (CONTRA.has(a) ? 0.5 : CATS.indexOf(cat(a)) < 0 ? 9 : CATS.indexOf(cat(a)));
  const CAST = { piyo: ['ピヨ', 48], senpai: ['タカシ先輩', 205], bucho: ['サクラ部長', 338], shacho: ['ミライ社長', 24], eigyo: ['ハルカ（営業）', 12], ginko: ['田中さん（銀行）', 222], kansa: ['森さん（監査）', 150], zeirishi: ['大川先生', 268] };
  const KEY = 'boki2sim.v1';

  /* ---------- state ---------- */
  const fresh = () => ({ v: 1, mi: 0, ei: 0, phase: 'title', L: [], T: [], decisions: {}, rules: {}, kinds: {}, leaves: [], diary: [], trapHit: false,
    discDone: {}, docLog: [], fixLog: [], closes: [], examLog: [], reportSeen: false,
    metrics: { started: Date.now(), disc: {}, docs: { n: 0, first: 0 }, fixes: 0, hints: 0, hand: 0, autoPosted: 0, quiz: null, forks: {} } });
  let S = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { /* play without saving */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };

  /* ---------- ledgers ---------- */
  function balances(entries) {
    const b = {};
    for (const e of entries) {
      for (const [a, v] of e.dr) b[a] = (b[a] || 0) + v;
      for (const [a, v] of e.cr) b[a] = (b[a] || 0) - v;
    }
    return b;
  }
  const cashOf = (b) => (b['現金'] || 0) + (b['普通預金'] || 0);
  function pl(b) {
    let rev = 0, exp = 0;
    for (const [a, v] of Object.entries(b)) { if (cat(a) === '収益') rev -= v; if (cat(a) === '費用') exp += v; }
    return { rev, exp, ni: rev - exp };
  }
  function sameEntry(a, b) {
    const norm = (e) => { const m = { dr: {}, cr: {} }; for (const s of ['dr', 'cr']) for (const [k, v] of e[s]) m[s][k] = (m[s][k] || 0) + v; return m; };
    const x = norm(a), y = norm(b);
    for (const s of ['dr', 'cr']) { const kx = Object.keys(x[s]), ky = Object.keys(y[s]); if (kx.length !== ky.length) return false; for (const k of kx) if (x[s][k] !== y[s][k]) return false; }
    return true;
  }

  /* ---------- flow ---------- */
  const month = () => D.months[S.mi];
  const events = () => (month() ? month().events.filter((e) => !e.when || e.when(S)) : []);
  function post(ev, userEntry, auto) {
    const truth = val(ev.ans, S);
    const id = ev.id + '@' + S.mi;
    S.L = S.L.filter((x) => x.id !== id).concat([{ id, mi: S.mi, ev: ev.id, kind: ev.kind, dr: userEntry.dr, cr: userEntry.cr, auto: !!auto }]);
    S.T = S.T.filter((x) => x.id !== id).concat([{ id, mi: S.mi, ev: ev.id, dr: truth.dr, cr: truth.cr }]);
    return sameEntry(userEntry, truth);
  }
  function next() { S.ei++; S.phase = 'event'; save(); render(); }

  /* ---------- small renderers ---------- */
  const avatar = (k) => { const [n, h] = CAST[k] || [k, 190]; return `<span class="s-ava" style="--h:${h}">${esc(n.slice(0, 1))}</span>`; };
  const talk = (lines) => (lines || []).map(([k, t]) => `<div class="s-line">${avatar(k)}<div><small>${esc((CAST[k] || [k])[0])}</small><p>${esc(t)}</p></div></div>`).join('');
  function docHTML(doc, tappable) {
    if (!doc) return '';
    const rows = val(doc.rows, S);
    return `<div class="s-doc" data-type="${esc(doc.type)}"><div class="s-doc-head"><b>${esc(doc.title)}</b><span>${esc(doc.date || '')}</span></div><div class="s-doc-meta">${esc(doc.from || '')} → ${esc(doc.to || '')}</div><table>${rows.map(([k, v, tap]) => `<tr><td>${esc(k)}</td><td>${tap && tappable ? `<button class="s-tap" data-tap="${v}">${fmt(v)}</button>` : fmt(v)}</td></tr>`).join('')}</table></div>`;
  }
  function miniBS(bs) {
    const side = (groups) => groups.flatMap((g) => (bs[g] || []).map(([n, v]) => `<div class="s-seg" style="--h:${CAT_HUE[g]};flex:${Math.max(v, 1)}"><span>${esc(n)}</span><b>${fmt(v)}</b></div>`)).join('');
    return `<div class="s-minibs"><div class="s-col">${side(['資産'])}</div><div class="s-col">${side(['負債', '純資産'])}</div></div><div class="s-minibs-l"><span>資産</span><span>負債＋純資産</span></div>`;
  }
  function barsHTML(b) {
    const mx = Math.max(1, ...b.series.flatMap((s) => s.vals));
    return `<div class="s-bars">${b.labels.map((l, i) => `<div class="s-barcol">${b.series.map((s) => `<i style="--h:${CAT_HUE[s.cat] || 190};height:${(s.vals[i] / mx) * 110}px" title="${esc(s.name)}"></i>`).join('')}<span>${esc(l)}</span></div>`).join('')}</div><div class="s-legend">${b.series.map((s) => `<span><i style="--h:${CAT_HUE[s.cat] || 190}"></i>${esc(s.name)}</span>`).join('')}</div>`;
  }
  function jeTable(e) {
    const n = Math.max(e.dr.length, e.cr.length);
    let r = '';
    for (let i = 0; i < n; i++) { const d = e.dr[i] || ['', ''], c = e.cr[i] || ['', '']; r += `<tr><td>${esc(d[0])}</td><td class="n">${d[1] === '' ? '' : fmt(d[1])}</td><td>${esc(c[0])}</td><td class="n">${c[1] === '' ? '' : fmt(c[1])}</td></tr>`; }
    return `<table class="s-je"><tr><th colspan="2">借方</th><th colspan="2">貸方</th></tr>${r}</table>`;
  }

  /* ---------- header ---------- */
  const app = document.getElementById('sim');
  function header() {
    const b = balances(S.L), p = pl(b);
    const m = month();
    return `<header class="s-head"><div class="s-month"><small>株式会社ピヨ商店</small><b>${m ? esc(m.label) : ''}</b></div><div class="s-kpi"><small>お金</small><b class="${cashOf(b) < 0 ? 'neg' : ''}">${fmt(cashOf(b))}</b></div><div class="s-kpi"><small>今期のもうけ</small><b class="${p.ni < 0 ? 'neg' : ''}">${fmt(p.ni)}</b></div><div class="s-kpi"><small>自動仕訳</small><b>${Object.values(S.rules).length}</b></div><nav class="s-nav"><button data-ov="co">会社</button><button data-ov="map">マップ</button><button data-ov="log">日誌</button></nav></header>`;
  }
  let onFocus = null;
  app.addEventListener('focusin', (e) => { const x = e.target.closest('input[data-s]'); if (x && onFocus) onFocus(x); });
  function frame(body) { onFocus = null; app.oninput = null; app.innerHTML = header() + `<main class="s-main">${body}</main>`; window.scrollTo(0, 0); }

  /* ---------- overlays ---------- */
  function overlay(html) {
    const o = document.createElement('div');
    o.className = 's-ov';
    o.innerHTML = `<div class="s-sheet">${html}<button class="btn wide ghost" data-close>とじる</button></div>`;
    o.addEventListener('click', (e) => { if (e.target === o || e.target.closest('[data-close]')) o.remove(); });
    document.body.appendChild(o);
    return o;
  }
  function companyView(b) {
    const rows = (pred) => Object.entries(b).filter(([a, v]) => v && pred(a)).map(([a, v]) => [a, v]);
    const assets = rows((a) => cat(a) === '資産' || CONTRA.has(a)).map(([a, v]) => [a, v]);
    const liab = rows((a) => cat(a) === '負債').map(([a, v]) => [a, -v]);
    const eq = rows((a) => cat(a) === '純資産').map(([a, v]) => [a, -v]);
    const p = pl(b);
    const tbl = (list) => list.map(([a, v]) => `<tr><td>${CONTRA.has(a) ? '　△ ' : ''}${esc(a)}</td><td class="n">${fmt(CONTRA.has(a) ? -v : v)}</td></tr>`).join('');
    const ta = assets.reduce((t, [, v]) => t + v, 0);
    return `<h3>貸借対照表（いま）</h3><div class="s-two"><table class="s-tb">${tbl(assets)}<tr class="sum"><td>資産 合計</td><td class="n">${fmt(ta)}</td></tr></table><table class="s-tb">${tbl(liab)}${tbl(eq)}<tr><td>今期のもうけ</td><td class="n">${fmt(p.ni)}</td></tr><tr class="sum"><td>合計</td><td class="n">${fmt(liab.concat(eq).reduce((t, [, v]) => t + v, 0) + p.ni)}</td></tr></table></div><h3>損益計算書（今期）</h3><table class="s-tb">${rows((a) => cat(a) === '収益').map(([a, v]) => `<tr><td>${esc(a)}</td><td class="n">${fmt(-v)}</td></tr>`).join('')}${rows((a) => cat(a) === '費用').map(([a, v]) => `<tr><td>${esc(a)}</td><td class="n">△${fmt(v)}</td></tr>`).join('')}<tr class="sum"><td>もうけ</td><td class="n">${fmt(p.ni)}</td></tr></table>`;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ov]');
    if (!b) return;
    const k = b.dataset.ov;
    if (k === 'co') overlay(companyView(balances(S.L)));
    if (k === 'map') mapOverlay();
    if (k === 'log') overlay(`<h3>経営日誌</h3>${S.diary.length ? `<ul class="s-diary">${S.diary.map((d) => `<li><b>${esc(d.m)}</b> ${esc(d.t)}</li>`).join('')}</ul>` : '<p class="muted">まだ記録はない。</p>'}`);
  });
  function principleView() {
    return `<p class="muted s-mapnote">見つけた言葉は、どの原理から生まれたか。</p><div class="s-map">${Object.entries(D.principles).map(([k, p]) => { const ls = S.leaves.filter((l) => l.p === k); return `<div class="s-node ${ls.length ? 'on' : ''}"><b>${k} ${esc(p.name)}</b><small>${esc(p.q)}</small><div class="s-leaves">${ls.map((l) => `<span>${esc(l.label)}</span>`).join('') || '<em>まだ見つけていない</em>'}</div></div>`; }).join('')}</div>`;
  }

  /* ---------- 試験範囲マップ（原理マップのもう一つの並べ方） ----------
     数や％は出さない。各項目の状態を、会社で起きたことの言葉で示す。
     未体験の項目は、次に起きる3件だけ困りごとを見せ、それより先は輪郭だけ。名前は体験してから。 */
  let DEV = /[?&]dev\b/.test(location.search);
  const allEvents = D.months.flatMap((m, mi) => m.events.map((e) => ({ e, mi })));
  const monthLabel = (mi) => (D.months[mi] || {}).label || '';
  function scopeState(it) {
    const x = it.sim || {}, disc = x.disc || [], docs = x.docs || [], kinds = x.kinds || [];
    const mets = [];
    disc.forEach((d) => { if (S.discDone[d] != null) mets.push(S.discDone[d]); });
    S.L.forEach((l) => { if (docs.includes(l.ev) || kinds.includes(l.kind)) mets.push(l.mi); });
    if (x.close && S.closes.length) mets.push(S.closes[0].mi);
    if (x.report && S.reportSeen) mets.push(D.months.length - 2);
    const met = mets.length ? Math.min(...mets) : null;
    // 自力で：発見は1回目から理由まで正しく、書類は1回目で正しく、同じ種類は別の月にもう一度正しく（＝自動仕訳ルールの条件）
    const parts = [];
    if (disc.length) parts.push(disc.every((d) => S.discDone[d] != null && (S.metrics.disc[d] || {}).first));
    if (docs.length) { const seen = S.docLog.filter((l) => docs.includes(l.ev)); parts.push(seen.length > 0 && seen.every((l) => l.ok)); }
    if (kinds.length) parts.push(kinds.some((k) => S.rules[k] || new Set(S.docLog.filter((l) => l.kind === k && l.ok).map((l) => l.mi)).size >= 2));
    if (x.close) parts.push(S.closes.filter((c) => !c.fixed).length >= 2);
    let own = met != null && parts.length > 0 && parts.every(Boolean);
    // 月末に直した取引は「ゆらぎ」。同じ種類を、直した月より後に1回目で正しく記帳できたら戻る
    const fixes = S.fixLog.filter((f) => docs.includes(f.ev) || kinds.includes(f.kind));
    const shaky = fixes.some((f) => !S.docLog.some((l) => l.ok && l.mi > f.mi && (l.kind === f.kind || l.ev === f.ev)));
    if (shaky) own = false;
    const ex = S.examLog.filter((l) => (it.q || []).includes(l.key));
    const okT = ex.filter((l) => l.ok).map((l) => l.t);
    const exam = !ex.length ? null : !ex[ex.length - 1].ok ? 'miss' : okT.length >= 2 && Math.max(...okT) - Math.min(...okT) >= 7 * 864e5 ? 'exam2' : 'exam1';
    return { met, own, shaky, exam, built: !!(disc.length || docs.length || kinds.length || x.close || x.report) };
  }
  function upcoming() {
    // まだ起きていない項目を、台本で起きる順に
    const firstMi = (it) => { const x = it.sim || {}; const hit = allEvents.filter(({ e, mi }) => mi >= S.mi && ((x.disc || []).includes(e.id) || (x.docs || []).includes(e.id) || (x.kinds || []).includes(e.kind) || (x.report && e.t === 'report'))); return hit.length ? Math.min(...hit.map((h) => h.mi)) : null; };
    return B.scope.map((it) => ({ it, st: scopeState(it), at: firstMi(it) })).filter((o) => o.st.met == null && o.at != null).sort((a, b) => a.at - b.at).slice(0, 3).map((o) => o.it.id);
  }
  const EXAM_WORD = { exam1: '本試験の文章でも書けた', exam2: '本試験の文章で、日をあけても書けた', miss: '本試験の文章で間違えた' };
  function scopeView() {
    const next = upcoming();
    const cell = (it) => {
      const st = scopeState(it), principle = D.principles[it.p] ? `${it.p} ${D.principles[it.p].name}` : it.p;
      if (DEV) return `<button class="s-cell dev ${st.built ? 'built' : ''}" data-scope="${it.id}"><b>${esc(it.name)}</b><small>${it.id}・${it.ch}・${it.p}${st.built ? '' : '・未実装'}${(it.q || []).length ? '・問' + it.q.length : ''}</small></button>`;
      if (st.met == null && !st.exam) {
        if (next.includes(it.id)) return `<button class="s-cell next" data-scope="${it.id}"><small>これから起きること</small><span>${esc(it.teaser)}</span></button>`;
        return '<span class="s-cell fog" aria-hidden="true"></span>';
      }
      const word = st.met == null ? 'まだ会社では起きていない' : st.shaky ? '締めで直した。もう一度で定着' : st.own ? '自分で記帳・判断できた' : `${monthLabel(st.met)}に起きた`;
      return `<button class="s-cell ${st.shaky ? 'shaky' : st.own ? 'own' : 'met'} ${st.exam || ''}" data-scope="${it.id}" style="--h:${PHUE[it.p] || 190}"><b>${esc(it.name)}</b><small>${esc(word)}</small>${st.exam ? `<em>${esc(EXAM_WORD[st.exam])}</em>` : ''}${it.ref ? '<i>2027年度から変更</i>' : ''}<span class="s-p">${esc(principle)}</span></button>`;
    };
    const legend = DEV ? '<p class="s-mapnote">開発者表示：全項目の名前・章・原理と、まだゲームにない項目（点線）。数は <code>node boki2/tools/coverage.js</code> で。</p>'
      : '<p class="muted s-mapnote">日商簿記2級の出題範囲を、区分ごとに並べた地図。会社で起きたことから順に明るくなる。まだ先のことは輪郭だけ。</p>';
    const devToggle = `<label class="s-devtoggle"><input type="checkbox" data-dev ${DEV ? 'checked' : ''}> 開発者表示（全項目の名前と、まだゲームにない項目が見える）</label>`;
    return legend + B.scopeAreas.map((a) => `<section class="s-area"><h4>${esc(a.label)}</h4>${a.secs.map((sec) => { const list = B.scope.filter((it) => it.sec === sec); return `<div class="s-sec"><span class="s-secname">${esc(sec)}</span><div class="s-cells">${list.map(cell).join('')}</div></div>`; }).join('')}</section>`).join('') + devToggle;
  }
  const PHUE = { P1: 212, P2: 272, P3: 30, P4: 142, P5: 190, P6: 48, P7: 338, P8: 2 };
  function scopeDetail(id) {
    const it = B.scope.find((x) => x.id === id), st = scopeState(it);
    const known = DEV || st.met != null || st.exam;
    const disc = ((it.sim || {}).disc || []).find((d) => S.discDone[d] != null);
    const p = D.principles[it.p];
    return `<h3>${esc(known ? it.name : 'まだ名前のない困りごと')}</h3><p>${esc(it.teaser)}</p>${p ? `<p class="muted">${esc(it.p)} ${esc(p.name)}：${esc(p.q)}</p>` : ''}${st.met != null ? `<p>${esc(monthLabel(st.met))}に会社で起きた。${st.shaky ? '月末の締めで直したので、次に同じ取引が来たときが確かめどき。' : st.own ? '自分で記帳・判断できた。' : ''}</p>` : '<p class="muted">会社ではまだ起きていない。</p>'}${st.exam ? `<p>${esc(EXAM_WORD[st.exam])}。${st.exam === 'exam1' ? '日をあけてもう一度解けたら定着。' : ''}</p>` : ''}${it.ref ? '<p class="muted">2027年度の出題区分の変更で、扱いが変わる論点（いまは参考として扱う）。</p>' : ''}${disc ? `<button class="btn wide ghost" data-replay="${disc}">生まれた場面をもう一度</button>` : ''}`;
  }
  let mapTab = 'p';
  function mapOverlay() {
    const o = overlay('<div class="s-maptabs"><button data-maptab="p">原理で見る</button><button data-maptab="s">試験範囲で見る</button></div><div class="s-mapbody"></div>');
    const paint = () => { $$('[data-maptab]', o).forEach((b) => b.classList.toggle('on', b.dataset.maptab === mapTab)); $('.s-mapbody', o).innerHTML = mapTab === 'p' ? principleView() : scopeView(); };
    paint();
    o.addEventListener('click', (e) => {
      const t = e.target.closest('[data-maptab]');
      if (t) { mapTab = t.dataset.maptab; paint(); return; }
      if (e.target.closest('[data-dev]')) { DEV = e.target.closest('[data-dev]').checked; paint(); return; }
      const c = e.target.closest('[data-scope]');
      if (c) { const d = overlay(scopeDetail(c.dataset.scope)); d.addEventListener('click', (ev) => { const r = ev.target.closest('[data-replay]'); if (r) { d.remove(); o.remove(); replay(r.dataset.replay); } }); }
    });
  }
  function replay(id) {
    const ev = allEvents.find(({ e }) => e.id === id).e;
    discoverScreen(ev, true);
  }

  /* ---------- screens ---------- */
  function render() {
    if (S.phase === 'title') return titleScreen();
    const m = month();
    if (!m) return endScreen();
    if (S.phase === 'monthIntro') return monthIntro();
    // rule offers at the start of a month
    if (S.ei === 0 && S.phase === 'event') { const k = ruleOffer(); if (k) return ruleScreen(k); }
    const evs = events();
    if (S.ei >= evs.length) return m.closeless ? advanceMonth() : closeScreen();
    const ev = evs[S.ei];
    ({ talk: talkScreen, doc: docScreen, discover: discoverScreen, decision: decisionScreen, report: reportScreen, bank: bankScreen, quiz: quizScreen, end: endScreen }[ev.t])(ev);
  }
  function titleScreen() {
    const started = S.L.length > 0;
    app.innerHTML = `<main class="s-main s-title"><div class="s-logo">株式会社<br><b>ピヨ商店</b></div><p>レモネード屋台から始まる、経理の1年。<br>届いた書類を記帳して、月末に締めて、会社を守ろう。</p><p class="muted" style="font-size:12px">試作版：簿記2級の論点のうち、株式・商品売買・固定資産・銀行照合・利益と現金・貸倒引当金・減価償却を体験します（約30〜40分）。</p><button class="btn wide" data-start>${started ? 'つづきから' : 'はじめる'}</button>${started ? '<button class="link" data-reset>最初からやり直す</button>' : ''}</main>`;
    app.onclick = (e) => {
      if (e.target.closest('[data-start]')) { if (!started) { S.phase = 'monthIntro'; } else if (S.phase === 'title') S.phase = 'monthIntro'; save(); render(); }
      if (e.target.closest('[data-reset]')) { S = fresh(); S.phase = 'monthIntro'; save(); render(); }
    };
  }
  function monthIntro() {
    const m = month();
    frame(`<div class="s-card s-intro"><small>${esc(m.label)}</small><h2>${esc(m.title)}</h2><button class="btn wide" data-go>机に向かう</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-go]')) { S.phase = 'event'; S.ei = 0; save(); render(); } };
  }
  function talkScreen(ev) {
    frame(`<div class="s-card">${talk(ev.lines)}<button class="btn wide" data-n>つぎへ</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-n]')) next(); };
  }

  /* ---- doc: record from a document ---- */
  function autoRule(ev) {
    if (ev.trapFor && S.rules[ev.trapFor] && S.rules[ev.trapFor].broad) return { trap: true, cond: S.rules[ev.trapFor].cond };
    return S.rules[ev.kind] ? { cond: S.rules[ev.kind].cond } : null;
  }
  function docScreen(ev, fixMode) {
    if (!fixMode && autoRule(ev)) {
      // 続けて自動で記帳できる書類は、まとめて1画面で見せる
      const evs = events(), done = [];
      while (S.ei < evs.length && evs[S.ei].t === 'doc' && autoRule(evs[S.ei])) {
        const x = evs[S.ei], r = autoRule(x);
        const entry = r.trap ? x.trapEntry : val(x.ans, S);
        if (r.trap) S.trapHit = true;
        post(x, entry, true);
        S.metrics.autoPosted++;
        done.push({ x, entry, cond: r.cond });
        S.ei++;
      }
      S.ei--; // next() で1つ進む
      save();
      frame(`<div class="s-card s-auto"><small>自動仕訳</small><h3>会計ソフトが ${done.length} 件を記帳した</h3>${done.map(({ x, entry, cond }) => `<details class="s-autoi"><summary><span>${esc(x.doc.date)} ${esc(x.doc.title)}</span><b>${fmt(entry.dr.reduce((t, d) => t + d[1], 0))}</b></summary><p class="muted">ルール「${esc(cond)}」</p>${jeTable(entry)}</details>`).join('')}<p class="muted" style="font-size:13px">開くと、どのルールでどう記帳したかが見られる。</p><button class="btn wide" data-n>つぎへ</button></div>`);
      app.onclick = (e) => { if (e.target.closest('[data-n]')) next(); };
      return;
    }
    const opts = [...new Set([...(ev.opts || []), ...val(ev.ans, S).dr.map((x) => x[0]), ...val(ev.ans, S).cr.map((x) => x[0])])].sort((a, b) => order(a) - order(b));
    const prev = fixMode ? S.L.find((x) => x.id === ev.id + '@' + S.mi) : null;
    const rows = { dr: prev ? prev.dr.map(([a, v]) => ({ a, v })) : [{ a: '', v: '' }], cr: prev ? prev.cr.map(([a, v]) => ({ a, v })) : [{ a: '', v: '' }] };
    let active = null, hintLv = 0;
    const optHTML = (sel) => `<option value="">科目</option>${opts.map((a) => `<option ${a === sel ? 'selected' : ''}>${esc(a)}</option>`).join('')}`;
    const draw = () => {
      const tot = (s) => rows[s].reduce((t, r) => t + (Number(r.v) || 0), 0);
      const d = tot('dr'), c = tot('cr');
      const side = (s) => rows[s].map((r, i) => `<div class="s-row"><select data-s="${s}" data-i="${i}" aria-label="${s === 'dr' ? '借方' : '貸方'}の科目">${optHTML(r.a)}</select><input data-s="${s}" data-i="${i}" inputmode="numeric" placeholder="金額" value="${esc(r.v)}" aria-label="${s === 'dr' ? '借方' : '貸方'}の金額" class="${active && active.s === s && active.i === i ? 'act' : ''}"></div>`).join('') + (rows[s].length < 3 ? `<button class="s-add" data-add="${s}">＋行</button>` : '');
      $('.s-entry', app).innerHTML = `<div class="s-cols"><div class="s-side dr"><h4>借方 <span>${fmt(d)}</span></h4>${side('dr')}</div><div class="s-side cr"><h4>貸方 <span>${fmt(c)}</span></h4>${side('cr')}</div></div><div class="s-bal ${d === c && d > 0 ? 'even' : ''}">${d === c && d > 0 ? 'てんびんがつり合った' : `借方 ${fmt(d)} ／ 貸方 ${fmt(c)}`}</div>`;
    };
    frame(`<div class="s-card">${fixMode ? '<p class="s-fix">森さん「この記帳、もう一度見て」</p>' : ''}<p class="s-ask">この書類を記帳しよう。書類の金額をタップすると、選んだ欄に入る。</p>${docHTML(ev.doc, true)}<div class="s-entry"></div><div class="s-hint" hidden></div><div class="s-actions"><button class="btn ghost" data-hint>ヒント</button><button class="btn" data-ok>記帳する</button></div></div>`);
    draw();
    app.oninput = (e) => {
      const x = e.target.closest('[data-s]');
      if (!x) return;
      const r = rows[x.dataset.s][+x.dataset.i];
      if (x.tagName === 'SELECT') r.a = x.value; else { r.v = x.value.normalize('NFKC').replace(/[^\d]/g, ''); }
      const d = rows.dr.reduce((t, q) => t + (Number(q.v) || 0), 0), c = rows.cr.reduce((t, q) => t + (Number(q.v) || 0), 0);
      $('.s-bal', app).className = 's-bal' + (d === c && d > 0 ? ' even' : '');
      $('.s-bal', app).textContent = d === c && d > 0 ? 'てんびんがつり合った' : `借方 ${fmt(d)} ／ 貸方 ${fmt(c)}`;
      $$('.s-side h4 span', app)[0].textContent = fmt(d); $$('.s-side h4 span', app)[1].textContent = fmt(c);
    };
    onFocus = (x) => { active = { s: x.dataset.s, i: +x.dataset.i }; $$('input[data-s]', app).forEach((y) => y.classList.toggle('act', y === x)); };
    app.onclick = (e) => {
      const tap = e.target.closest('[data-tap]');
      if (tap) {
        const target = active || { s: rows.dr.some((r) => !r.v) ? 'dr' : 'cr', i: Math.max(0, (rows.dr.some((r) => !r.v) ? rows.dr : rows.cr).findIndex((r) => !r.v)) };
        rows[target.s][target.i].v = tap.dataset.tap;
        tap.classList.add('used'); active = null; draw(); return;
      }
      const add = e.target.closest('[data-add]');
      if (add) { rows[add.dataset.add].push({ a: '', v: '' }); draw(); return; }
      if (e.target.closest('[data-hint]')) {
        hintLv = Math.min(3, hintLv + 1); S.metrics.hints++; save();
        const t = val(ev.ans, S), anchor = t.dr.concat(t.cr).find(([a]) => ['現金', '普通預金', '売掛金', '買掛金', '未払金', '借入金'].includes(a));
        const other = t.dr.concat(t.cr).filter(([a]) => !anchor || a !== anchor[0]);
        const msgs = ['いつ、何が起きた？ まず「確実に動いたもの」（お金・あとでもらう権利・あとで払う義務）を決めよう。', `相手は「${[...new Set(other.map(([a]) => cat(a)))].join('・')}」のグループ。`, `使う科目：${t.dr.map((x) => x[0]).join('・')}（借方）／${t.cr.map((x) => x[0]).join('・')}（貸方）`];
        const h = $('.s-hint', app); h.hidden = false; h.innerHTML = msgs.slice(0, hintLv).map((m) => `<p>${esc(m)}</p>`).join('');
        return;
      }
      if (e.target.closest('[data-ok]')) {
        const entry = { dr: rows.dr.filter((r) => r.a && Number(r.v)).map((r) => [r.a, Number(r.v)]), cr: rows.cr.filter((r) => r.a && Number(r.v)).map((r) => [r.a, Number(r.v)]) };
        const d = entry.dr.reduce((t, x) => t + x[1], 0), c = entry.cr.reduce((t, x) => t + x[1], 0);
        if (!entry.dr.length || !entry.cr.length || d !== c) { const bl = $('.s-bal', app); bl.classList.add('shake'); setTimeout(() => bl.classList.remove('shake'), 400); return; }
        const ok = post(ev, entry, false);
        if (!fixMode) { S.docLog.push({ ev: ev.id, kind: ev.kind, mi: S.mi, ok }); S.metrics.docs.n++; if (ok) S.metrics.docs.first++; if (ok && ev.kind) { (S.kinds[ev.kind] = S.kinds[ev.kind] || []).push(S.mi); } }
        save();
        if (fixMode) closeScreen(); else next();
      }
    };
  }

  /* ---- discover: 4 beats ---- */
  function discoverScreen(ev, isReplay) {
    // もう一度見るときは、記録（1回目の正誤・分かれ道）に数えない
    const m = isReplay ? { tries: 0, first: null, hand: 0, forks: [] } : (S.metrics.disc[ev.id] = S.metrics.disc[ev.id] || { tries: 0, first: null, hand: 0, forks: [] });
    const metrics = isReplay ? { forks: {}, hand: 0 } : S.metrics;
    let beat = 1, picked = null, sorted = {}, reason = null;
    const steps = ['困りごと', '考える', '結果', '名前'];
    const stepper = () => `<div class="s-steps">${steps.map((s, i) => `<span class="${i + 1 === beat ? 'on' : i + 1 < beat ? 'done' : ''}">${s}</span>`).join('')}</div>`;
    const draw = () => {
      let body = '';
      if (beat === 1) {
        body = `${talk(ev.b1.talk)}${ev.b1.dyn ? `<p class="s-dyn">${esc(ev.b1.dyn(S))}</p>` : ''}${docHTML(ev.b1.doc)}<button class="btn wide" data-b="2">考える</button>`;
      } else if (beat === 2) {
        const b2 = ev.b2;
        let field = '';
        if (b2.layout === 'sort') {
          field = `<div class="s-sort">${b2.tokens.map((t) => `<div class="s-sorti"><span>${esc(t.label)}</span><div>${b2.targets.map((g) => `<button class="s-pill ${sorted[t.id] === g.id ? 'on' : ''}" data-sort="${t.id}" data-to="${g.id}">${esc(g.label)}</button>`).join('')}</div></div>`).join('')}</div>`;
        } else {
          field = `${b2.token ? `<div class="s-token ${picked ? 'placed' : ''}">${esc(b2.token)}</div>` : ''}<div class="s-targets ${b2.layout}">${b2.targets.map((g) => `<button class="s-target ${picked === g.id ? 'on' : ''}" data-pick="${g.id}"><b>${esc(g.label)}</b>${g.sub ? `<small>${esc(g.sub)}</small>` : ''}</button>`).join('')}</div>`;
        }
        const placed = b2.layout === 'sort' ? b2.tokens.every((t) => sorted[t.id]) : !!picked;
        body = `<p class="s-q">${esc(b2.q)}</p>${field}${placed ? `<p class="s-q small">なぜそうした？</p><div class="s-reasons">${b2.reasons.map((r, i) => `<button class="s-reason ${reason === i ? 'on' : ''}" data-reason="${i}">${esc(r.t)}</button>`).join('')}</div>` : ''}<button class="btn wide" data-decide ${placed && reason !== null ? '' : 'disabled'}>決める</button>`;
      } else if (beat === 3) {
        const b2 = ev.b2;
        const tgtOk = b2.layout === 'sort' ? b2.tokens.every((t) => sorted[t.id] === t.target) : b2.targets.find((g) => g.id === picked).ok;
        const r = b2.reasons[reason];
        if (tgtOk && r.ok) {
          const g = b2.layout === 'sort' ? null : b2.targets.find((x) => x.id === picked);
          body = `${g && g.react ? `<p class="s-react">${esc(g.react)}</p>` : ''}<p class="s-result">${esc(ev.b3.ok)}</p>${ev.b3.bs ? miniBS(ev.b3.bs) : ''}${ev.b3.bars ? barsHTML(ev.b3.bars) : ''}<button class="btn wide" data-b="4">名前を知る</button>`;
        } else {
          const why = !tgtOk ? (b2.layout === 'sort' ? b2.wrongReact : b2.targets.find((x) => x.id === picked).react) : r.react;
          body = `<p class="s-react ng">${esc(why)}</p><button class="btn wide ghost" data-retry>もう一度考える</button>`;
        }
      } else {
        const b4 = ev.b4;
        body = `<div class="s-name"><small>この考え方の名前</small><h2>${esc(b4.name)}</h2><p>${esc(b4.line)}</p>${b4.rule ? `<p class="s-rule">${esc(b4.rule)}</p>` : ''}<p class="s-exam">本試験では ${esc(b4.exam)}</p><p class="s-leaf">原理マップ ${esc(b4.leaf.p)}「${esc(D.principles[b4.leaf.p].name)}」に「${esc(b4.leaf.label)}」が加わった</p></div><button class="btn wide" data-done>つぎへ</button>`;
      }
      frame(`<div class="s-card s-disc"><div class="s-disc-head"><small>${esc(ev.p)} ${esc(D.principles[ev.p].name)}｜${esc(D.principles[ev.p].q)}</small><h3>${esc(ev.title)}</h3>${stepper()}</div>${body}${beat < 4 ? '<button class="link" data-hand>先輩の手帳を見る</button>' : ''}</div>`);
    };
    draw();
    app.onclick = (e) => {
      const g = (s) => e.target.closest(s);
      if (g('[data-hand]')) { m.hand++; metrics.hand++; save(); overlay(`<h3>先輩の手帳</h3><p>${esc(ev.hand)}</p>`); return; }
      if (g('[data-b]')) { beat = +g('[data-b]').dataset.b; draw(); return; }
      if (g('[data-pick]')) { picked = g('[data-pick]').dataset.pick; draw(); return; }
      if (g('[data-sort]')) { const x = g('[data-sort]'); sorted[x.dataset.sort] = x.dataset.to; draw(); return; }
      if (g('[data-reason]')) { reason = +g('[data-reason]').dataset.reason; draw(); return; }
      if (g('[data-decide]')) {
        const b2 = ev.b2;
        const tgtOk = b2.layout === 'sort' ? b2.tokens.every((t) => sorted[t.id] === t.target) : b2.targets.find((x) => x.id === picked).ok;
        const r = b2.reasons[reason];
        m.tries++;
        if (m.first === null) m.first = !!(tgtOk && r.ok);
        if (!r.ok && r.fork) { m.forks.push(r.fork); metrics.forks[r.fork] = (metrics.forks[r.fork] || 0) + 1; }
        if (!tgtOk) { const f = b2.layout === 'sort' ? '日付のずれと記録漏れの区別' : (b2.targets.find((x) => x.id === picked).fork || `${ev.id}:${picked}`); m.forks.push(f); metrics.forks[f] = (metrics.forks[f] || 0) + 1; }
        save(); beat = 3; draw(); return;
      }
      if (g('[data-retry]')) { beat = 2; picked = null; sorted = {}; reason = null; draw(); return; }
      if (g('[data-done]')) {
        if (isReplay) { render(); return; }
        S.discDone[ev.id] = S.mi;
        if (!S.leaves.some((l) => l.label === ev.b4.leaf.label)) S.leaves.push({ p: ev.b4.leaf.p, label: ev.b4.leaf.label, mi: S.mi });
        next();
      }
    };
  }

  function decisionScreen(ev) {
    frame(`<div class="s-card"><h3>${esc(ev.q)}</h3>${talk(ev.talk)}<div class="s-opts">${ev.options.map((o) => `<button class="s-opt" data-opt="${o.id}"><b>${esc(o.label)}</b><small>${esc(o.desc)}</small></button>`).join('')}</div></div>`);
    app.onclick = (e) => {
      const o = e.target.closest('[data-opt]');
      if (!o) return;
      S.decisions[ev.id] = o.dataset.opt;
      const opt = ev.options.find((x) => x.id === o.dataset.opt);
      S.diary.push({ m: month().label, t: `${ev.q} → ${opt.label}` });
      next();
    };
  }

  /* ---- auto rules ---- */
  function ruleOffer() {
    for (const [k, list] of Object.entries(S.kinds)) {
      if (S.rules[k] || !D.rules[k] || (S.declined || []).includes(k + '@' + S.mi)) continue;
      if (list.length >= 3 && new Set(list).size >= 2) return k;
    }
    return null;
  }
  function ruleScreen(k) {
    const R = D.rules[k];
    let msg = '';
    const draw = () => frame(`<div class="s-card"><small>会計ソフト</small><h3>「${esc(R.label)}」は、もう3回正しく記帳できた</h3><p>自動仕訳ルールに登録すると、この種類の取引は自動で記帳される。どんな条件で登録する？</p><div class="s-opts">${R.conds.map((c, i) => `<button class="s-opt" data-cond="${i}"><b>${esc(c.t)}</b><small>→ ${esc(R.entry)}</small></button>`).join('')}</div>${msg}<button class="link" data-skip>今は登録しない</button></div>`);
    draw();
    app.onclick = (e) => {
      if (e.target.closest('[data-skip]')) { (S.declined = S.declined || []).push(k + '@' + S.mi); save(); render(); return; }
      const b = e.target.closest('[data-cond]');
      if (!b) return;
      const c = R.conds[+b.dataset.cond];
      if (!c.ok) { msg = `<p class="s-react ng">森さん「${esc(c.why)}」</p>`; draw(); return; }
      S.rules[k] = { cond: c.t, broad: !!c.broad, at: S.mi };
      S.diary.push({ m: month().label, t: `自動仕訳ルール登録：${c.t} → ${R.entry}` });
      save(); render();
    };
  }

  /* ---- month-end close ---- */
  function closeScreen() {
    const bu = balances(S.L), bt = balances(S.T);
    const diff = [...new Set([...Object.keys(bu), ...Object.keys(bt)])].filter((a) => (bu[a] || 0) !== (bt[a] || 0));
    if (!diff.length) {
      const p = pl(bt);
      const note = p.ni < 0 && (bt['仕入'] || 0) > 0 && !bt['繰越商品'] ? '<p class="muted" style="font-size:13px;margin:0">仕入れた商品は、売れ残りも全部「仕入」（費用）に入れている。売れ残りを資産に戻すのは決算の日だから、それまでは、もうけが小さく見える。</p>' : '';
      frame(`<div class="s-card"><small>${esc(month().label)}の締め</small><h3>試算表が合った</h3>${miniBS(bsFrom(bt))}<p style="margin:0">お金 <b>${fmt(cashOf(bt))}</b>　今期のもうけ <b>${fmt(p.ni)}</b></p>${note}<button class="btn wide" data-next>${S.mi + 1 < D.months.length ? '次の月へ' : 'つぎへ'}</button></div>`);
      app.onclick = (e) => { if (e.target.closest('[data-next]')) { S.closes.push({ mi: S.mi, fixed: S.fixLog.some((f) => f.mi === S.mi) }); advanceMonth(); } };
      return;
    }
    // which of this month's entries disagree with the documents
    const wrong = S.L.filter((x) => x.mi === S.mi && !sameEntry(x, S.T.find((t) => t.id === x.id)));
    const autoWrong = wrong.some((x) => x.auto);
    frame(`<div class="s-card"><small>${esc(month().label)}の締め</small><h3>試算表が合わない</h3><p class="s-react ng">森さん「${esc(diff.slice(0, 3).join('・'))}の残高が、書類と合わないみたい。${autoWrong ? '自動仕訳ルールが、ルールの外の取引にまで使われていないかな？' : 'このあたりの記帳を見直して。'}」</p><div class="s-wrong">${wrong.map((x) => `<button class="s-opt" data-fix="${esc(x.ev)}"><b>${esc(evTitle(x.ev))}</b><small>${x.dr.map((d) => d[0]).join('・')} ／ ${x.cr.map((c) => c[0]).join('・')}${x.auto ? '（自動仕訳）' : ''}</small></button>`).join('')}</div></div>`);
    app.onclick = (e) => {
      const b = e.target.closest('[data-fix]');
      if (!b) return;
      S.metrics.fixes++;
      const ev = events().find((x) => x.id === b.dataset.fix);
      S.fixLog.push({ ev: ev.id, kind: ev.kind, mi: S.mi });
      if (ev.trapFor && S.rules[ev.trapFor] && S.rules[ev.trapFor].broad) {
        S.rules[ev.trapFor].broad = false; S.rules[ev.trapFor].cond = D.rules[ev.trapFor].conds.find((c) => c.ok && !c.broad).t;
        S.diary.push({ m: month().label, t: `自動仕訳ルールを修正：${S.rules[ev.trapFor].cond}（チラシ代まで仕入にしていた）` });
        save();
        overlay(`<h3>自動仕訳ルールを直した</h3><p>「掛けで何かを買ったとき」では、チラシ代まで「仕入／買掛金」になってしまった。条件を「商品を掛けで仕入れたとき」に直した。</p><p>商品以外を後払いで買ったときの義務は「買掛金」ではなく何だった？ この請求書は手で記帳し直そう。</p>`);
      }
      docScreen(ev, true);
    };
  }
  const evTitle = (id) => { const ev = D.months.flatMap((m) => m.events).find((e) => e.id === id); return ev && ev.doc ? `${ev.doc.date} ${ev.doc.title}（${ev.doc.from === '株式会社ピヨ商店' ? ev.doc.to + ' あて' : ev.doc.from}）` : id; };
  function bsFrom(b) {
    const out = { 資産: [], 負債: [], 純資産: [] };
    const net = { ...b };
    for (const a of CONTRA) if (net[a]) { net[CONTRA_OF[a]] = (net[CONTRA_OF[a]] || 0) + net[a]; delete net[a]; }
    for (const [a, v] of Object.entries(net)) {
      if (!v) continue;
      if (cat(a) === '資産') out.資産.push([a, v]);
      else if (cat(a) === '負債') out.負債.push([a, -v]);
      else if (cat(a) === '純資産') out.純資産.push([a, -v]);
    }
    const p = pl(b);
    if (p.ni > 0) out.純資産.push(['今期のもうけ', p.ni]);
    // 損が出ているときは、純資産をその分だけ小さく見せる
    if (p.ni < 0) out.純資産 = [[`純資産（今期の損 ${fmt(-p.ni)} を引いた後）`, out.純資産.reduce((t, [, v]) => t + v, 0) + p.ni]];
    return out;
  }
  function advanceMonth() {
    S.mi++; S.ei = 0; S.phase = S.mi < D.months.length ? 'monthIntro' : 'event'; save(); render();
  }

  /* ---- year end ---- */
  function statements() {
    const b = balances(S.T), p = pl(b);
    const assets = Object.entries(b).filter(([a, v]) => v && (cat(a) === '資産' || CONTRA.has(a)));
    const ta = assets.reduce((t, [, v]) => t + v, 0);
    const eq = Object.entries(b).filter(([a]) => cat(a) === '純資産').reduce((t, [, v]) => t - v, 0) + p.ni;
    return { b, p, ta, eq };
  }
  function reportScreen() {
    const { b } = statements();
    S.reportSeen = true; save();
    frame(`<div class="s-card"><small>決算</small><h3>1年目の決算書ができた</h3>${companyView(b)}<button class="btn wide" data-n>銀行へ持っていく</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-n]')) { S.diary.push({ m: '3月', t: `決算：もうけ ${fmt(statements().p.ni)}円` }); next(); } };
  }
  function bankScreen() {
    const { p, ta, eq } = statements();
    const ratio = Math.round((eq / ta) * 100);
    const lines = [];
    lines.push(['ginko', `1年目のもうけは${p.ni.toLocaleString()}円、純資産の割合は${ratio}%ですね。`]);
    if (S.decisions.dep === 'rate') lines.push(['ginko', 'トラックを定率法で早めに費用にしているのは、慎重な会社という印象です。そのぶん今年のもうけは小さく見えますが、来年以降は軽くなります。']);
    else lines.push(['ginko', '定額法で毎年同じ額を費用にしているので、来年以降のもうけの見通しが立てやすいですね。']);
    if (S.decisions.credit === 'credit') lines.push(['ginko', 'A社の件で10万円の引当金を積んだのは誠実です。ただ、噂のあった相手に掛けで売ったのは、与信管理の課題ですね。']);
    else if (S.decisions.credit === 'cash') lines.push(['ginko', 'A社に現金での取引を求めたのは、いい判断でした。']);
    else lines.push(['ginko', 'A社との取引を見送ったのは慎重でしたね。']);
    if (S.decisions.crunch === 'loan') lines.push(['ginko', '9月の資金不足は、うちの融資で乗り切りましたね。利息9,000円は、売掛金の回収を待つための費用でした。']);
    else lines.push(['ginko', '9月はD社に値引きして早く払ってもらいましたね。1万円の値引きは、利息より高くつきました。']);
    if (S.metrics.fixes >= 3) lines.push(['ginko', '帳簿の訂正が多かったのは少し気になります。月次の数字は早く正確に、が信用の基本です。']);
    const offer = Math.max(100000, Math.round((eq * 0.8) / 10000) * 10000);
    lines.push(['ginko', `2年目は、${offer.toLocaleString()}円までのご融資を検討できます。`]);
    S.diary.push({ m: '翌年4月', t: `銀行審査：融資枠 ${fmt(offer)}円` });
    frame(`<div class="s-card"><small>翌年4月</small><h3>みらい銀行の審査</h3>${talk(lines)}<button class="btn wide" data-n>検定会場で腕だめし</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-n]')) next(); };
  }
  function quizScreen() {
    // 本試験の文言で、体験した論点を測る（処理の層）
    const byKey = Object.fromEntries(B.chapters.flatMap((c) => c.qs.map((q, k) => [`${c.id}:${k}`, q])));
    const qs = D.quiz.map((k) => byKey[k]);
    let i = 0, score = 0;
    const results = [];
    const draw = () => {
      if (i >= qs.length) {
        S.metrics.quiz = { score, of: qs.length, results };
        save();
        frame(`<div class="s-card"><small>検定会場（ミニ）</small><h3>${score} / ${qs.length} 問 正解</h3><p>本試験と同じ文章で出された問題。体験した論点が、本試験の形でも解けたかを測った。</p><button class="btn wide" data-n>試作の記録を見る</button></div>`);
        app.onclick = (e) => { if (e.target.closest('[data-n]')) next(); };
        return;
      }
      const q = qs[i];
      const accs = [...new Set([...(B.chapters.find((c) => c.qs.includes(q)).accounts || []), ...q.ans.dr.map((x) => x[0]), ...q.ans.cr.map((x) => x[0])])].sort((a, b) => order(a) - order(b));
      const rows = { dr: [0, 1, 2], cr: [0, 1, 2] };
      const optHTML = `<option value="">科目</option>${accs.map((a) => `<option>${esc(a)}</option>`).join('')}`;
      const side = (s) => rows[s].map((k) => `<div class="s-row"><select data-s="${s}" data-i="${k}" aria-label="${s === 'dr' ? '借方' : '貸方'}の科目">${optHTML}</select><input data-s="${s}" data-i="${k}" inputmode="numeric" placeholder="金額" aria-label="${s === 'dr' ? '借方' : '貸方'}の金額"></div>`).join('');
      const paint = () => { $('.s-entry', app).innerHTML = `<div class="s-cols"><div class="s-side dr"><h4>借方</h4>${side('dr')}</div><div class="s-side cr"><h4>貸方</h4>${side('cr')}</div></div>`; };
      frame(`<div class="s-card"><small>検定会場（ミニ） ${i + 1} / ${qs.length}</small><p class="s-q">${q.q}</p><div class="s-entry"></div><div data-res></div><button class="btn wide" data-check>解答する</button></div>`);
      paint();
      app.onclick = (e) => {
        if (e.target.closest('[data-check]')) {
          const entry = { dr: [], cr: [] };
          for (const s of ['dr', 'cr']) { const sels = $$(`select[data-s="${s}"]`, app), ins = $$(`input[data-s="${s}"]`, app); sels.forEach((x, k) => { const v = Number((ins[k].value || '').normalize('NFKC').replace(/[^\d]/g, '')); if (x.value && v) entry[s].push([x.value, v]); }); }
          const ok = [q.ans, ...(q.alt || [])].some((a) => entry.dr.length && entry.cr.length && sameEntry(entry, a));
          if (ok) score++;
          results.push({ key: q._key, ok });
          S.examLog.push({ key: q._key, ok, t: Date.now() });
          $('[data-res]', app).innerHTML = `<p class="s-react ${ok ? '' : 'ng'}">${ok ? '正解' : '不正解。正しくは：'}</p>${ok ? '' : jeTable(q.ans)}`;
          e.target.closest('[data-check]').outerHTML = '<button class="btn wide" data-nextq>つぎへ</button>';
          return;
        }
        if (e.target.closest('[data-nextq]')) { i++; draw(); }
      };
    };
    draw();
  }
  function endScreen() {
    const M = S.metrics;
    const disc = Object.entries(M.disc);
    const firstOk = disc.filter(([, d]) => d.first).length;
    const mins = Math.round((Date.now() - M.started) / 60000);
    const forks = Object.entries(M.forks).sort((a, b) => b[1] - a[1]);
    frame(`<div class="s-card"><small>試作の記録</small><h3>1年目、おつかれさま</h3><table class="s-tb"><tr><td>考える場面で、1回目から正しくたどり着いた</td><td class="n">${firstOk} / ${disc.length}</td></tr><tr><td>先輩の手帳を開いた回数</td><td class="n">${M.hand}</td></tr><tr><td>書類の記帳で、1回目から正しかった</td><td class="n">${M.docs.first} / ${M.docs.n}</td></tr><tr><td>月末に直した回数</td><td class="n">${M.fixes}</td></tr><tr><td>ヒントを見た回数</td><td class="n">${M.hints}</td></tr><tr><td>自動仕訳で進んだ取引</td><td class="n">${M.autoPosted}</td></tr><tr><td>検定会場（本試験の文章）</td><td class="n">${M.quiz ? `${M.quiz.score} / ${M.quiz.of}` : '-'}</td></tr><tr><td>かかった時間</td><td class="n">${mins}分</td></tr></table>${forks.length ? `<h4>迷ったところ</h4><ul class="s-diary">${forks.map(([f, n]) => `<li>${esc(f)} <b>${n}</b></li>`).join('')}</ul>` : ''}<p class="muted" style="font-size:12px">この記録は、試作の仮説（説明を読まずに正しい処理にたどり着けるか、本試験の形でも解けるか、など）を確かめるためのもの。</p><button class="btn wide ghost" data-again>最初からもう一度</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-again]')) { S = fresh(); S.phase = 'monthIntro'; save(); render(); } };
  }

  // tag questions with chapter for the quiz
  B.chapters.forEach((c) => c.qs.forEach((q, i) => { q._key = `${c.id}:${i}`; }));
  window.__sim = { get S() { return S; }, balances, events, render };
  render();
})();
