// ピヨ商店 — 1か月ずつ経営・記帳するシミュレーション（縦切りの試作）。docs/PEDAGOGY.md の段階1。
// 画面の言葉は、プレイヤーがすでに教わった言葉（S.taught）に合わせて変わる。教わる前は、やさしい言葉で言う。
(function () {
  'use strict';
  const B = window.BOKI, D = window.SIMDATA, LX = B.lex;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('ja-JP') : esc(n));
  const val = (x, S) => (typeof x === 'function' ? x(S) : x);
  const CATS = ['資産', '負債', '純資産', '収益', '費用'];
  const CAT_HUE = { 資産: 212, 負債: 2, 純資産: 272, 収益: 142, 費用: 30, その他: 190 };
  const cat = (a) => (B.accounts[a] || {}).cat || 'その他';
  // マイナスの札（評価勘定）は、資産の側にマイナスとして置く
  const CONTRA_OF = { 貸倒引当金: '売掛金', 車両運搬具減価償却累計額: '車両運搬具', 備品減価償却累計額: '備品', 建物減価償却累計額: '建物' };
  const CONTRA = new Set(Object.keys(CONTRA_OF));
  const order = (a) => (CONTRA.has(a) ? 0.5 : CATS.indexOf(cat(a)) < 0 ? 9 : CATS.indexOf(cat(a)));
  const CAST = { piyo: ['ピヨ', 48], haha: ['お母さん', 330], senpai: ['タカシ先輩', 205], shacho: ['ミライ社長', 24], eigyo: ['ハルカ（営業）', 12], ginko: ['田中さん（銀行）', 222], kansa: ['森さん（会計士）', 150] };
  const KEY = 'boki2sim.v2';

  /* ---------- state ---------- */
  const fresh = () => ({ v: 2, mi: 0, ei: 0, phase: 'title', L: [], T: [], decisions: {}, rules: {}, kinds: {}, leaves: [], diary: [], trapHit: false, taught: [], silentIntro: false, ruleIntro: false,
    discDone: {}, docLog: [], fixLog: [], closes: [], examLog: [], reportSeen: false,
    metrics: { started: Date.now(), disc: {}, docs: { n: 0, first: 0 }, fixes: 0, hints: 0, hand: 0, autoPosted: 0, quiz: null, forks: {} } });
  let S = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { /* play without saving */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
  const knows = (w) => S.taught.includes(w);
  const teach = (list) => { (list || []).forEach((w) => { if (!knows(w)) S.taught.push(w); }); save(); };
  // 5つのグループの呼び方。名前を教わる前は、プロローグの棚の言葉で言う
  const PLAIN = { 資産: 'もっているもの', 負債: '返すお金', 純資産: '返さないお金', 収益: 'じぶんのお金を増やした原因', 費用: 'じぶんのお金をへらした原因' };
  const gw = (c) => (knows(c) ? c : PLAIN[c] || c);
  // 名前カードなどでは、用語にふりがなをつける
  const rb = (t) => LX.ruby(esc(t));

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
  // 仕訳の1行を、やさしい言葉の「何が増えた・へった」にする
  function moveText(acc, side, amt) {
    const c = CONTRA.has(acc) ? 'マイナスの札' : cat(acc);
    const up = (c === '資産' || c === '費用') ? side === 'dr' : c === 'マイナスの札' ? side === 'cr' : side === 'cr';
    const grp = c === 'マイナスの札' ? 'マイナスの札' : gw(c);
    return `${acc}（${grp}）が ${fmt(amt)} ${up ? '増えた' : 'へった'}`;
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
  // 同じ種類の書類を、別々の月に2回、1回目で正しく書けたら「慣れた」
  const mastered = (kind) => !!kind && new Set(S.docLog.filter((l) => l.kind === kind && l.ok).map((l) => l.mi)).size >= 2;

  /* ---------- small renderers ---------- */
  const avatar = (k) => { const [n, h] = CAST[k] || [k, 190]; return `<span class="s-ava" style="--h:${h}">${esc(n.slice(0, 1))}</span>`; };
  const talk = (lines) => (lines || []).map(([k, t]) => `<div class="s-line">${avatar(k)}<div><small>${esc((CAST[k] || [k])[0])}</small><p>${esc(t)}</p></div></div>`).join('');
  // 書類だけの言葉（摘要など）は、タップすると一言の説明が出る
  const gloss = (text) => {
    let h = esc(text);
    for (const w of Object.keys(LX.docWords).sort((a, b) => b.length - a.length)) { const ew = esc(w); if (h.includes(ew)) { h = h.split(ew).join(`<button class="s-gl" data-gl="${ew}">${ew}</button>`); break; } }
    return h;
  };
  function docHTML(doc, tappable) {
    if (!doc) return '';
    const rows = val(doc.rows, S);
    return `<div class="s-doc" data-type="${esc(doc.type)}"><div class="s-doc-head"><b>${gloss(doc.title)}</b><span>${esc(doc.date || '')}</span></div><div class="s-doc-meta">${gloss(doc.type !== doc.title ? doc.type : '')} ${esc(doc.from || '')} → ${esc(doc.to || '')}</div><table>${rows.map(([k, v, tap]) => `<tr><td>${gloss(k)}</td><td>${tap && tappable ? `<button class="s-tap" data-tap="${v}">${fmt(v)}</button>` : fmt(v)}</td></tr>`).join('')}</table></div>`;
  }
  document.addEventListener('click', (e) => { const g = e.target.closest('[data-gl]'); if (g) { e.stopPropagation(); overlay(`<h3>${esc(g.dataset.gl)}</h3><p>${esc(LX.docWords[g.dataset.gl])}</p>`); } }, true);
  function miniBS(bs) {
    const side = (groups) => groups.flatMap((g) => (bs[g] || []).map(([n, v]) => `<div class="s-seg" style="--h:${CAT_HUE[g]};flex:${Math.max(v, 1)}"><span>${esc(n)}</span><b>${fmt(v)}</b></div>`)).join('');
    return `<div class="s-minibs"><div class="s-col">${side(['資産'])}</div><div class="s-col">${side(['負債', '純資産'])}</div></div><div class="s-minibs-l"><span>${esc(gw('資産'))}</span><span>${esc(gw('負債'))}＋${esc(gw('純資産'))}</span></div>`;
  }
  function barsHTML(b) {
    const mx = Math.max(1, ...b.series.flatMap((s) => s.vals));
    return `<div class="s-bars">${b.labels.map((l, i) => `<div class="s-barcol">${b.series.map((s) => `<i style="--h:${CAT_HUE[s.cat] || 190};height:${(s.vals[i] / mx) * 110}px" title="${esc(s.name)}"></i>`).join('')}<span>${esc(l)}</span></div>`).join('')}</div><div class="s-legend">${b.series.map((s) => `<span><i style="--h:${CAT_HUE[s.cat] || 190}"></i>${esc(s.name)}</span>`).join('')}</div>`;
  }
  function jeTable(e) {
    const n = Math.max(e.dr.length, e.cr.length);
    let r = '';
    for (let i = 0; i < n; i++) { const d = e.dr[i] || ['', ''], c = e.cr[i] || ['', '']; r += `<tr><td>${esc(d[0])}</td><td class="n">${d[1] === '' ? '' : fmt(d[1])}</td><td>${esc(c[0])}</td><td class="n">${c[1] === '' ? '' : fmt(c[1])}</td></tr>`; }
    return `<table class="s-je"><tr><th colspan="2">借方（左）</th><th colspan="2">貸方（右）</th></tr>${r}</table>`;
  }

  /* ---------- header ---------- */
  const app = document.getElementById('sim');
  function header() {
    const b = balances(S.L), p = pl(b);
    const m = month();
    const inShop = S.mi > 0;
    const kpi = inShop ? `<div class="s-kpi"><small>口座のお金</small><b class="${cashOf(b) < 0 ? 'neg' : ''}">${fmt(cashOf(b))}</b></div>${knows('収益') ? `<div class="s-kpi"><small>この1年のもうけ</small><b class="${p.ni < 0 ? 'neg' : ''}">${fmt(p.ni)}</b></div>` : ''}${Object.keys(S.rules).length ? `<div class="s-kpi"><small>自動で書く書類</small><b>${Object.keys(S.rules).length}種類</b></div>` : ''}` : '';
    const nav = inShop ? '<nav class="s-nav"><button data-ov="co">会社の棚</button><button data-ov="map">マップ</button><button data-ov="log">日誌</button></nav>' : '';
    return `<header class="s-head"><div class="s-month"><small>${inShop ? '株式会社ピヨ商店' : 'ピヨの屋台'}</small><b>${m ? esc(m.label) : ''}</b></div>${kpi}${nav}</header>`;
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
    const assets = rows((a) => cat(a) === '資産' || CONTRA.has(a));
    const liab = rows((a) => cat(a) === '負債').map(([a, v]) => [a, -v]);
    const eq = rows((a) => cat(a) === '純資産').map(([a, v]) => [a, -v]);
    const p = pl(b);
    const tbl = (list) => list.map(([a, v]) => `<tr><td>${CONTRA.has(a) ? '　− ' : ''}${esc(a)}</td><td class="n">${fmt(CONTRA.has(a) ? -v : v)}</td></tr>`).join('');
    const ta = assets.reduce((t, [, v]) => t + v, 0);
    if (!ta && !liab.length && !eq.length) return '<p class="muted">まだ、帳簿に何も書いていない。</p>';
    const bsTitle = knows('貸借対照表') ? '貸借対照表（いま）' : '会社の棚（いま）';
    const plPart = knows('収益') ? `<h3>${knows('損益計算書') ? '損益計算書（この1年）' : 'もうけの中身（この1年）'}</h3><table class="s-tb">${rows((a) => cat(a) === '収益').map(([a, v]) => `<tr><td>${esc(a)}</td><td class="n">${fmt(-v)}</td></tr>`).join('')}${rows((a) => cat(a) === '費用').map(([a, v]) => `<tr><td>${esc(a)}</td><td class="n">−${fmt(v)}</td></tr>`).join('')}<tr class="sum"><td>もうけ</td><td class="n">${fmt(p.ni)}</td></tr></table>` : '';
    return `<h3>${bsTitle}</h3><div class="s-two"><table class="s-tb"><tr><th colspan="2">${esc(gw('資産'))}</th></tr>${tbl(assets)}<tr class="sum"><td>合計</td><td class="n">${fmt(ta)}</td></tr></table><table class="s-tb"><tr><th colspan="2">${esc(gw('負債'))}・${esc(gw('純資産'))}</th></tr>${tbl(liab)}${tbl(eq)}${knows('収益') ? `<tr><td>この1年のもうけ</td><td class="n">${fmt(p.ni)}</td></tr>` : ''}<tr class="sum"><td>合計</td><td class="n">${fmt(liab.concat(eq).reduce((t, [, v]) => t + v, 0) + p.ni)}</td></tr></table></div>${plPart}`;
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
    const seen = Object.entries(D.principles).filter(([k]) => S.leaves.some((l) => l.p === k));
    return `<p class="muted s-mapnote">見つけた考え方は、どの「ものの見方」から生まれたか。まだ見つけていない見方は、輪郭だけ。</p><div class="s-map">${Object.entries(D.principles).map(([k, p]) => { const ls = S.leaves.filter((l) => l.p === k); return ls.length ? `<div class="s-node on"><b>${esc(p.q)}</b><small>${esc(p.name)}</small><div class="s-leaves">${ls.map((l) => `<span>${esc(l.label)}</span>`).join('')}</div></div>` : '<div class="s-node"><em>まだ見つけていない見方</em></div>'; }).join('')}</div>${seen.length ? '' : ''}`;
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
    if (x.report && S.reportSeen) mets.push(D.months.length - 1);
    const met = mets.length ? Math.min(...mets) : null;
    // 自分で：発見は1回目から理由まで正しく、書類は1回目で正しく、同じ種類は別の月にもう一度正しく（＝慣れた・自動仕訳ルールの条件）
    const parts = [];
    if (disc.length) parts.push(disc.every((d) => S.discDone[d] != null && (d === 'prologue' || (S.metrics.disc[d] || {}).first)));
    if (docs.length) { const seen = S.docLog.filter((l) => docs.includes(l.ev)); parts.push(seen.length > 0 && seen.every((l) => l.ok)); }
    if (kinds.length) parts.push(kinds.some((k) => S.rules[k] || mastered(k)));
    if (x.close) parts.push(S.closes.filter((c) => !c.fixed).length >= 2);
    let own = met != null && parts.length > 0 && parts.every(Boolean);
    // 月末に直した取引は「ゆらぎ」。同じ種類を、直した月より後に1回目で正しく書けたら戻る
    const fixes = S.fixLog.filter((f) => docs.includes(f.ev) || kinds.includes(f.kind));
    const shaky = fixes.some((f) => !S.docLog.some((l) => l.ok && l.mi > f.mi && (l.kind === f.kind || l.ev === f.ev)));
    if (shaky) own = false;
    const ex = S.examLog.filter((l) => (it.q || []).includes(l.key));
    const okT = ex.filter((l) => l.ok).map((l) => l.t);
    const exam = !ex.length ? null : !ex[ex.length - 1].ok ? 'miss' : okT.length >= 2 && Math.max(...okT) - Math.min(...okT) >= 7 * 864e5 ? 'exam2' : 'exam1';
    return { met, own, shaky, exam, built: !!(disc.length || docs.length || kinds.length || x.close || x.report) };
  }
  function upcoming() {
    const firstMi = (it) => { const x = it.sim || {}; const hit = allEvents.filter(({ e, mi }) => mi >= S.mi && ((x.disc || []).includes(e.id) || (x.docs || []).includes(e.id) || (x.kinds || []).includes(e.kind) || (x.report && e.t === 'report'))); return hit.length ? Math.min(...hit.map((h) => h.mi)) : null; };
    return B.scope.map((it) => ({ it, st: scopeState(it), at: firstMi(it) })).filter((o) => o.st.met == null && o.at != null).sort((a, b) => a.at - b.at).slice(0, 3).map((o) => o.it.id);
  }
  const EXAM_WORD = { exam1: '本試験の文章でも書けた', exam2: '本試験の文章で、日をあけても書けた', miss: '本試験の文章で間違えた' };
  const PHUE = { P1: 212, P2: 272, P3: 30, P4: 142, P5: 190, P6: 48, P7: 338, P8: 2 };
  function scopeView() {
    const next = upcoming();
    const cell = (it) => {
      const st = scopeState(it);
      if (DEV) return `<button class="s-cell dev ${st.built ? 'built' : ''}" data-scope="${it.id}"><b>${esc(it.name)}</b><small>${it.id}・${it.ch}・${it.p}${st.built ? '' : '・未実装'}${(it.q || []).length ? '・問' + it.q.length : ''}</small></button>`;
      if (st.met == null && !st.exam) {
        if (next.includes(it.id)) return `<button class="s-cell next" data-scope="${it.id}"><small>これから起きること</small><span>${esc(it.teaser)}</span></button>`;
        return '<span class="s-cell fog" aria-hidden="true"></span>';
      }
      const word = st.met == null ? 'まだ会社では起きていない' : st.shaky ? '月末に直した。もう一度で定着' : st.own ? '自分でできた' : `${monthLabel(st.met)}に起きた`;
      return `<button class="s-cell ${st.shaky ? 'shaky' : st.own ? 'own' : 'met'} ${st.exam || ''}" data-scope="${it.id}" style="--h:${PHUE[it.p] || 190}"><b>${esc(it.name)}</b><small>${esc(word)}</small>${st.exam ? `<em>${esc(EXAM_WORD[st.exam])}</em>` : ''}${it.ref ? '<i>2027年度から変更</i>' : ''}</button>`;
    };
    const legend = DEV ? '<p class="s-mapnote">開発者表示：全項目の名前・章・原理と、まだゲームにない項目（点線）。数は <code>node boki2/tools/coverage.js</code> で。</p>'
      : '<p class="muted s-mapnote">日商簿記2級の試験に出るところを、まとまりごとに並べた地図。会社で起きたことから順に明るくなる。まだ先のことは輪郭だけ。</p>';
    const devToggle = `<label class="s-devtoggle"><input type="checkbox" data-dev ${DEV ? 'checked' : ''}> 開発者表示（全項目の名前と、まだゲームにない項目が見える）</label>`;
    return legend + B.scopeAreas.map((a) => `<section class="s-area"><h4>${esc(a.label)}</h4>${a.secs.map((sec) => { const list = B.scope.filter((it) => it.sec === sec); const anyKnown = DEV || list.some((it) => scopeState(it).met != null); return `<div class="s-sec"><span class="s-secname">${anyKnown ? esc(sec) : ''}</span><div class="s-cells">${list.map(cell).join('')}</div></div>`; }).join('')}</section>`).join('') + devToggle;
  }
  function scopeDetail(id) {
    const it = B.scope.find((x) => x.id === id), st = scopeState(it);
    const known = DEV || st.met != null || st.exam;
    const disc = ((it.sim || {}).disc || []).find((d) => S.discDone[d] != null);
    return `<h3>${esc(known ? it.name : 'まだ名前のない困りごと')}</h3><p>${esc(it.teaser)}</p>${st.met != null ? `<p>${esc(monthLabel(st.met))}に会社で起きた。${st.shaky ? '月末に直したので、次に同じ書類が来たときが確かめどき。' : st.own ? '自分でできた。' : ''}</p>` : '<p class="muted">会社ではまだ起きていない。</p>'}${st.exam ? `<p>${esc(EXAM_WORD[st.exam])}。${st.exam === 'exam1' ? '日をあけてもう一度解けたら定着。' : ''}</p>` : ''}${it.ref ? '<p class="muted">2027年度の出題区分の変更で、扱いが変わる論点（いまは参考として扱う）。</p>' : ''}${disc ? `<button class="btn wide ghost" data-replay="${disc}">生まれた場面をもう一度</button>` : ''}`;
  }
  let mapTab = 'p';
  function mapOverlay() {
    const o = overlay('<div class="s-maptabs"><button data-maptab="p">考え方で見る</button><button data-maptab="s">試験範囲で見る</button></div><div class="s-mapbody"></div>');
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
    if (ev.t === 'board') boardScreen(ev, true); else discoverScreen(ev, true);
  }

  /* ---------- screens ---------- */
  function render() {
    if (S.phase === 'title') return titleScreen();
    const m = month();
    if (!m) return endScreen();
    if (S.phase === 'monthIntro') return monthIntro();
    // 月のはじめ：自動仕訳ルールの提案
    if (S.ei === 0 && S.phase === 'event') { const k = ruleOffer(); if (k) return ruleScreen(k); }
    const evs = events();
    if (S.ei >= evs.length) return m.closeless ? advanceMonth() : closeScreen();
    const ev = evs[S.ei];
    ({ talk: talkScreen, board: boardScreen, doc: docScreen, discover: discoverScreen, decision: decisionScreen, report: reportScreen, bank: bankScreen, quiz: quizScreen, end: endScreen }[ev.t])(ev);
  }
  function titleScreen() {
    const started = S.mi > 0 || S.ei > 0;
    app.innerHTML = `<main class="s-main s-title"><div class="s-logo">ピヨの<br><b>レモネード</b></div><p>小さな屋台が、会社になるまでの1年。<br>お金の出入りを記録して、会社を育てよう。</p><p class="muted" style="font-size:12px">試作版（約40分）</p><button class="btn wide" data-start>${started ? 'つづきから' : 'はじめる'}</button>${started ? '<button class="link" data-reset>最初からやり直す</button>' : ''}</main>`;
    app.onclick = (e) => {
      if (e.target.closest('[data-start]')) { if (S.phase === 'title') S.phase = started ? 'event' : 'monthIntro'; save(); render(); }
      if (e.target.closest('[data-reset]')) { S = fresh(); S.phase = 'monthIntro'; save(); render(); }
    };
  }
  function monthIntro() {
    const m = month();
    frame(`<div class="s-card s-intro"><small>${esc(m.label)}</small><h2>${esc(m.title)}</h2><button class="btn wide" data-go>${S.mi === 0 ? '屋台へ行く' : '机に向かう'}</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-go]')) { S.phase = 'event'; S.ei = 0; save(); render(); } };
  }
  function talkScreen(ev) {
    teach(ev.teaches);
    frame(`<div class="s-card">${talk(ev.lines)}<button class="btn wide" data-n>つぎへ</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-n]')) next(); };
  }

  /* ---- プロローグ：棚に並べる・右の棚に置く・ノートに書く ---- */
  function boardScreen(ev, isReplay) {
    const st = { L: [], R1: [], R0: [] };
    let i = 0, sub = {}, msg = '', done = false, sale = Number(S.decisions.price === '200' ? 1600 : 2000);
    const amt = (a) => (a === 'sale' ? sale : a);
    const sum = (list) => list.reduce((t, x) => t + x.amt, 0);
    const coin = (d) => { const c = st.L.find((x) => x.id === 'coin'); if (c) c.amt += d; };
    const shelf = (showR) => `<div class="s-board"><div class="s-shelf"><h4>もっているもの</h4>${st.L.map((x) => `<div class="s-item">${esc(x.label)}<b>${fmt(x.amt)}</b></div>`).join('') || '<em>（からっぽ）</em>'}<div class="s-sum">${fmt(sum(st.L))}</div></div>${showR ? `<div class="s-shelf r"><h4>どこから来たか</h4><div class="s-row2"><small>返すお金</small>${st.R1.map((x) => `<div class="s-item">${esc(x.label)}<b>${fmt(x.amt)}</b></div>`).join('')}</div><div class="s-row2"><small>返さないお金（じぶんのお金）</small>${st.R0.map((x) => `<div class="s-item">${esc(x.label)}<b>${fmt(x.amt)}</b></div>`).join('')}</div><div class="s-sum">${fmt(sum(st.R1) + sum(st.R0))}</div></div>` : ''}</div>`;
    const draw = () => {
      const s = ev.steps[i];
      let body = '', ready = false;
      if (s.k === 'tap') {
        const left = s.tokens.filter((t) => !st.L.some((x) => x.id === t.id));
        ready = !left.length;
        body = `<div class="s-tokens">${left.map((t) => `<button class="s-token" data-tok="${t.id}">${esc(t.label)} ${fmt(t.amt)}</button>`).join('')}</div>${shelf(false)}`;
      } else if (s.k === 'sort') {
        const left = s.tokens.filter((t) => !sub[t.id]);
        ready = !left.length;
        body = `${left.map((t) => `<div class="s-sorti"><span>${esc(t.label)} ${fmt(amt(t.amt))}</span><div>${s.dests.map((d) => `<button class="s-pill" data-put="${t.id}" data-to="${d.id}">${esc(d.label)}</button>`).join('')}</div></div>`).join('')}${shelf(true)}`;
      } else if (s.k === 'choice') {
        ready = !!sub.pick;
        const o = s.opts.find((x) => x.id === sub.pick);
        body = o ? `<p class="s-react">${esc(o.result)}</p>` : `<div class="s-opts">${s.opts.map((x) => `<button class="s-opt" data-pick="${x.id}"><b>${esc(x.t)}</b></button>`).join('')}</div>`;
      } else if (s.k === 'note') {
        const all = s.lines.flatMap((l, li) => l.cards.map((c, ci) => ({ ...c, key: `${li}-${ci}`, li })));
        ready = all.every((c) => sub[c.key]);
        // その行で新しい困りごとがあるときは、先に問う（マイナスは書かない→へったら反対の列）
        const curLi = (all.find((c) => !sub[c.key]) || {}).li;
        const ask = curLi != null && s.lines[curLi].ask && !sub['ask' + curLi] ? s.lines[curLi].ask : null;
        body = `<table class="s-note"><tr><th></th><th>左の列</th><th>右の列</th></tr>${s.lines.map((l, li) => { const cs = all.filter((c) => c.li === li); const put = (side) => cs.filter((c) => sub[c.key] === side).map((c) => `${esc(c.label)} ${fmt(amt(c.amt))}`).join('<br>'); return `<tr><td>${esc(l.title)}</td><td>${put('L')}</td><td>${put('R')}</td></tr>`; }).join('')}</table>${sub.askOk ? `<p class="s-react">${esc(sub.askOk)}</p>` : ''}${ask ? `${talk(ask.say)}<div class="s-opts">${ask.opts.map((o, k) => `<button class="s-opt" data-ask="${curLi}-${k}"><b>${esc(o.t)}</b></button>`).join('')}</div>` : all.filter((c) => !sub[c.key]).slice(0, 2).map((c) => `<div class="s-sorti"><span>${esc(s.lines[c.li].title)}：${esc(c.label)} ${fmt(amt(c.amt))}</span><div><button class="s-pill" data-note="${c.key}" data-side="L">左の列</button><button class="s-pill" data-note="${c.key}" data-side="R">右の列</button></div></div>`).join('')}${ready && s.showShelf ? shelf(true) : ''}`;
      } else if (s.k === 'card') {
        ready = true;
        body = `<div class="s-name"><small>この書き方の名前</small><h2>${rb(s.name)}</h2><p>${rb(s.line)}</p><p class="s-leaf">マップに「${esc(s.leaf.label)}」が加わった</p></div>`;
      }
      const after = ready && s.after ? talk(s.after) : '';
      frame(`<div class="s-card">${talk(s.say)}${s.q && !(ready && s.k !== 'card') ? `<p class="s-q">${esc(s.q)}</p>` : ''}${body}${msg ? `<p class="s-react ng">${esc(msg)}</p>` : ''}${after}${ready ? '<button class="btn wide" data-step>つぎへ</button>' : ''}${i > 0 ? '<button class="btn ghost sm" data-back>← もどる</button>' : ''}</div>`);
    };
    draw();
    app.onclick = (e) => {
      const s = ev.steps[i], g = (q) => e.target.closest(q);
      if (g('[data-tok]')) { const t = s.tokens.find((x) => x.id === g('[data-tok]').dataset.tok); st.L.push({ id: t.id, label: t.label, amt: t.amt }); msg = ''; draw(); return; }
      if (g('[data-put]')) {
        const b = g('[data-put]'), t = s.tokens.find((x) => x.id === b.dataset.put);
        if (b.dataset.to !== t.ok) { msg = t.react; draw(); return; }
        sub[t.id] = b.dataset.to; st[t.ok].push({ id: t.id, label: t.label, amt: amt(t.amt) }); if (t.coin) coin(amt(t.coin)); msg = ''; draw(); return;
      }
      if (g('[data-pick]')) { const o = s.opts.find((x) => x.id === g('[data-pick]').dataset.pick); sub.pick = o.id; sale = o.sale; if (!isReplay) S.decisions.price = o.id; msg = ''; draw(); return; }
      if (g('[data-ask]')) {
        const [li, k] = g('[data-ask]').dataset.ask.split('-').map(Number), o = s.lines[li].ask.opts[k];
        if (!o.ok) { msg = o.react; draw(); return; }
        sub['ask' + li] = true; sub.askOk = o.react; msg = ''; draw(); return;
      }
      if (g('[data-note]')) {
        const b = g('[data-note]'), [li, ci] = b.dataset.note.split('-').map(Number), c = s.lines[li].cards[ci];
        if (b.dataset.side !== c.side) { msg = s.react[c.kind]; draw(); return; }
        sub[b.dataset.note] = c.side; msg = ''; draw(); return;
      }
      if (g('[data-back]')) { i--; sub = {}; msg = ''; draw(); return; }
      if (g('[data-step]')) {
        if (s.k === 'card' && !isReplay) { teach(s.teaches); if (!S.leaves.some((l) => l.label === s.leaf.label)) S.leaves.push({ p: s.leaf.p, label: s.leaf.label, mi: S.mi }); }
        if (i + 1 < ev.steps.length) { i++; sub = {}; msg = ''; draw(); return; }
        if (isReplay) { render(); return; }
        if (!done && ev.next) { done = true; frame(`<div class="s-card">${talk(ev.next)}<button class="btn wide" data-fin>つぎへ</button></div>`); app.onclick = (x) => { if (x.target.closest('[data-fin]')) { S.discDone[ev.id] = S.mi; next(); } }; return; }
        S.discDone[ev.id] = S.mi; next();
      }
    };
  }

  /* ---- 書類を帳簿に書く ---- */
  function autoRule(ev) {
    if (ev.trapFor && S.rules[ev.trapFor] && S.rules[ev.trapFor].broad) return { trap: true, cond: S.rules[ev.trapFor].cond };
    // 大口の注文など、manual の書類は自動にしない
    return S.rules[ev.kind] && !ev.manual ? { cond: S.rules[ev.kind].cond } : null;
  }
  // まだ教わっていない科目が答えに出てくるときは、先に小さな問いで見つける
  function namingScreen(acc, cont) {
    const N = D.namings[acc];
    if (!N) { teach([acc]); return cont(); }
    let msg = '', solved = false;
    const draw = () => frame(`<div class="s-card"><small>新しい札</small><p class="s-q">${esc(N.q)}</p>${solved ? `<div class="s-name"><h2>${rb(acc)}</h2><p>${rb(N.line)}</p></div><button class="btn wide" data-n>帳簿に書く</button>` : `<div class="s-opts">${N.opts.map((o, i) => `<button class="s-opt" data-o="${i}"><b>${esc(o.t)}</b></button>`).join('')}</div>${msg ? `<p class="s-react ng">${esc(msg)}</p>` : ''}`}</div>`);
    draw();
    app.onclick = (e) => {
      const b = e.target.closest('[data-o]');
      if (b) { const o = N.opts[+b.dataset.o]; if (o.ok) { solved = true; teach(N.teaches); } else msg = o.react; draw(); return; }
      if (e.target.closest('[data-n]')) cont();
    };
  }
  // はじめての「動き」（負債がへる・権利がお金に変わる・2行で書く など）は、書く前に小さな問いで確かめる
  function introScreen(kind, cont) {
    const N = D.kindIntro[kind];
    let msg = '', solved = false;
    const draw = () => frame(`<div class="s-card"><small>はじめての書類</small><p class="s-q">${esc(N.q)}</p>${solved ? `<p class="s-react">${rb(N.line)}</p><button class="btn wide" data-n>帳簿に書く</button>` : `<div class="s-opts">${N.opts.map((o, i) => `<button class="s-opt" data-o="${i}"><b>${esc(o.t)}</b></button>`).join('')}</div>${msg ? `<p class="s-react ng">${esc(msg)}</p>` : ''}`}</div>`);
    draw();
    app.onclick = (e) => {
      const b = e.target.closest('[data-o]');
      if (b) { const o = N.opts[+b.dataset.o]; if (o.ok) { solved = true; (S.introSeen = S.introSeen || {})[kind] = true; save(); } else msg = o.react; draw(); return; }
      if (e.target.closest('[data-n]')) cont();
    };
  }
  // これまでに教わった札の一覧（記帳画面から開ける）
  function cardList() {
    const accs = S.taught.filter((w) => B.accounts[w]).sort((a, b) => order(a) - order(b));
    return `<h3>札の一覧</h3><p class="muted" style="font-size:13px;margin:0">これまでに見つけた札。どの棚の札かと、ひとこと。</p><table class="s-tb">${accs.map((a) => `<tr><td>${rb(a)}</td><td>${esc(CONTRA.has(a) ? 'マイナスの札' : cat(a))}</td><td>${esc((B.accounts[a] || {}).d || '')}</td></tr>`).join('')}</table>`;
  }
  function docScreen(ev, fixMode) {
    if (!fixMode && D.kindIntro[ev.kind] && !(S.introSeen || {})[ev.kind]) return introScreen(ev.kind, () => docScreen(ev, fixMode));
    if (!fixMode && autoRule(ev)) return autoScreen();
    const truth = val(ev.ans, S);
    const need = [...truth.dr, ...truth.cr].map(([a]) => a).find((a) => !knows(a));
    if (need) return namingScreen(need, () => docScreen(ev, fixMode));
    if (!fixMode && mastered(ev.kind) && !S.silentIntro) {
      S.silentIntro = true; save();
      frame(`<div class="s-card">${talk([['senpai', 'この種類の書類には、もう慣れたね。ここからは、書いたらすぐ次へ進もう。合っているかは、月末に森さんとまとめて見直すよ。']])}<button class="btn wide" data-n>わかった</button></div>`);
      app.onclick = (e) => { if (e.target.closest('[data-n]')) docScreen(ev, fixMode); };
      return;
    }
    // 慣れるまでは、書いたその場で結果が返る。慣れたら、月末の見直しで確かめる
    const coach = fixMode || !mastered(ev.kind);
    const opts = [...new Set([...(ev.opts || []), ...truth.dr.map((x) => x[0]), ...truth.cr.map((x) => x[0])])].filter(knows).sort((a, b) => order(a) - order(b));
    const prev = fixMode ? S.L.find((x) => x.id === ev.id + '@' + S.mi) : null;
    const rows = { dr: prev ? prev.dr.map(([a, v]) => ({ a, v })) : [{ a: '', v: '' }], cr: prev ? prev.cr.map(([a, v]) => ({ a, v })) : [{ a: '', v: '' }] };
    let active = null, hintLv = 0, tries = 0, panel = '';
    const optHTML = (sel) => `<option value="">札をえらぶ</option>${opts.map((a) => `<option ${a === sel ? 'selected' : ''}>${esc(a)}</option>`).join('')}`;
    const totals = () => ({ d: rows.dr.reduce((t, r) => t + (Number(r.v) || 0), 0), c: rows.cr.reduce((t, r) => t + (Number(r.v) || 0), 0) });
    const balText = (d, c) => (d === c && d > 0 ? '左と右が同じ数になった' : `左 ${fmt(d)} ／ 右 ${fmt(c)}`);
    const draw = () => {
      const { d, c } = totals();
      const side = (s) => rows[s].map((r, i) => `<div class="s-row"><select data-s="${s}" data-i="${i}" aria-label="${s === 'dr' ? '借方' : '貸方'}の札">${optHTML(r.a)}</select><input data-s="${s}" data-i="${i}" inputmode="numeric" placeholder="金額" value="${esc(r.v)}" aria-label="${s === 'dr' ? '借方' : '貸方'}の金額" class="${active && active.s === s && active.i === i ? 'act' : ''}"></div>`).join('') + (rows[s].length < 3 ? `<button class="s-add" data-add="${s}">＋行をふやす</button>` : '');
      $('.s-entry', app).innerHTML = `<div class="s-cols"><div class="s-side dr"><h4>借方（左） <span>${fmt(d)}</span></h4>${side('dr')}</div><div class="s-side cr"><h4>貸方（右） <span>${fmt(c)}</span></h4>${side('cr')}</div></div><div class="s-bal ${d === c && d > 0 ? 'even' : ''}">${balText(d, c)}</div>`;
      $('.s-panel', app).innerHTML = panel;
      $('.s-actions', app).hidden = !!panel;
    };
    frame(`<div class="s-card">${fixMode ? '<p class="s-fix">森さん「この書類、もう一度見てみよう」</p>' : ''}<p class="s-ask">この書類の出来事を、帳簿に書こう。金額は、書類の数字をタップしても入る。</p>${docHTML(ev.doc, true)}<div class="s-entry"></div><div class="s-hint" hidden></div><div class="s-panel"></div><div class="s-actions"><button class="btn ghost" data-hint>ヒント</button><button class="btn" data-ok>帳簿に書く</button></div><button class="link" data-cards>札の一覧を見る</button></div>`);
    draw();
    app.oninput = (e) => {
      const x = e.target.closest('[data-s]');
      if (!x) return;
      const r = rows[x.dataset.s][+x.dataset.i];
      if (x.tagName === 'SELECT') r.a = x.value; else r.v = x.value.normalize('NFKC').replace(/[^\d]/g, '');
      const { d, c } = totals();
      $('.s-bal', app).className = 's-bal' + (d === c && d > 0 ? ' even' : '');
      $('.s-bal', app).textContent = balText(d, c);
      $$('.s-side h4 span', app)[0].textContent = fmt(d); $$('.s-side h4 span', app)[1].textContent = fmt(c);
    };
    onFocus = (x) => { active = { s: x.dataset.s, i: +x.dataset.i }; $$('input[data-s]', app).forEach((y) => y.classList.toggle('act', y === x)); };
    const hint = () => {
      hintLv = Math.min(3, hintLv + 1); S.metrics.hints++; save();
      const anchor = truth.dr.concat(truth.cr).find(([a]) => ['普通預金', '売掛金', '買掛金', '未払金', '借入金'].includes(a));
      const other = truth.dr.concat(truth.cr).filter(([a]) => !anchor || a !== anchor[0]);
      const msgs = ['この書類で、確かに動いたものは何？（口座のお金・あとでもらう権利・あとで払う約束）', `もう一方は「${[...new Set(other.map(([a]) => gw(CONTRA.has(a) ? '資産' : cat(a))))].join('・')}」の札。`, `使う札：左に ${truth.dr.map((x) => x[0]).join('・')}／右に ${truth.cr.map((x) => x[0]).join('・')}`];
      const h = $('.s-hint', app); h.hidden = false; h.innerHTML = msgs.slice(0, hintLv).map((m) => `<p>${esc(m)}</p>`).join('');
    };
    app.onclick = (e) => {
      const tap = e.target.closest('[data-tap]');
      if (tap) {
        const target = active || { s: rows.dr.some((r) => !r.v) ? 'dr' : 'cr', i: Math.max(0, (rows.dr.some((r) => !r.v) ? rows.dr : rows.cr).findIndex((r) => !r.v)) };
        rows[target.s][target.i].v = tap.dataset.tap;
        tap.classList.add('used'); active = null; draw(); return;
      }
      const add = e.target.closest('[data-add]');
      if (add) { rows[add.dataset.add].push({ a: '', v: '' }); draw(); return; }
      if (e.target.closest('[data-hint]')) return hint();
      if (e.target.closest('[data-cards]')) { overlay(cardList()); return; }
      if (e.target.closest('[data-redo]')) { panel = ''; draw(); return; }
      if (e.target.closest('[data-n]')) { next(); return; }
      if (e.target.closest('[data-ok]')) {
        const entry = { dr: rows.dr.filter((r) => r.a && Number(r.v)).map((r) => [r.a, Number(r.v)]), cr: rows.cr.filter((r) => r.a && Number(r.v)).map((r) => [r.a, Number(r.v)]) };
        const d = entry.dr.reduce((t, x) => t + x[1], 0), c = entry.cr.reduce((t, x) => t + x[1], 0);
        if (!entry.dr.length || !entry.cr.length || d !== c) { const bl = $('.s-bal', app); bl.textContent = !entry.dr.length || !entry.cr.length ? '左と右の両方に、札と金額を入れよう' : '左と右を同じ数にしてから書こう'; bl.classList.add('shake'); setTimeout(() => bl.classList.remove('shake'), 400); return; }
        const ok = sameEntry(entry, truth);
        tries++;
        if (!fixMode && tries === 1) { S.docLog.push({ ev: ev.id, kind: ev.kind, mi: S.mi, ok }); S.metrics.docs.n++; if (ok) { S.metrics.docs.first++; if (ev.kind) (S.kinds[ev.kind] = S.kinds[ev.kind] || []).push(S.mi); } }
        if (coach && !ok) {
          // 正解は言わない。書類から確かに言えることと、自分の仕訳が言っていることを並べる
          const lines = [...entry.dr.map(([a, v]) => ['dr', a, v]), ...entry.cr.map(([a, v]) => ['cr', a, v])];
          const inTruth = ([s, a, v]) => truth[s].some(([ta, tv]) => ta === a && tv === v);
          const anchor = [...truth.dr.map(([a, v]) => ['dr', a, v]), ...truth.cr.map(([a, v]) => ['cr', a, v])].find(([, a]) => ['普通預金', '売掛金', '買掛金', '未払金', '借入金'].includes(a));
          panel = `<div class="s-check"><p><b>書類から確かに言えること</b><br>${anchor ? esc(moveText(anchor[1], anchor[0], anchor[2])) : '書類の金額と、何が起きたかをもう一度読もう'}</p><p><b>いまの仕訳が言っていること</b></p><ul>${lines.map((l) => `<li class="${inTruth(l) ? 'ok' : 'q'}">${inTruth(l) ? '✓' : '？'} ${esc(moveText(l[1], l[0], l[2]))}</li>`).join('')}</ul><p class="muted">「？」の行は、書類の出来事と合っている？</p><button class="btn wide ghost" data-redo>書き直す</button></div>`;
          save(); draw(); if (tries >= 2) hint(); return;
        }
        post(ev, entry, false);
        save();
        if (fixMode) return closeScreen();
        if (coach) {
          panel = `<div class="s-check good"><p><b>帳簿に書けた</b></p><ul>${[...entry.dr.map(([a, v]) => moveText(a, 'dr', v)), ...entry.cr.map(([a, v]) => moveText(a, 'cr', v))].map((t) => `<li>${esc(t)}</li>`).join('')}</ul>${miniBS(bsFrom(balances(S.L)))}<button class="btn wide" data-n>つぎへ</button></div>`;
          draw(); return;
        }
        next();
      }
    };
  }
  // 自動仕訳ルールで書ける書類は、まとめて1画面で見せる
  function autoScreen() {
    const evs = events(), done = [];
    while (S.ei < evs.length && evs[S.ei].t === 'doc' && autoRule(evs[S.ei]) && !(D.kindIntro[evs[S.ei].kind] && !(S.introSeen || {})[evs[S.ei].kind])) {
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
    frame(`<div class="s-card s-auto"><small>自動仕訳</small><h3>パソコンが ${done.length} 件を帳簿に書いた</h3>${done.map(({ x, entry, cond }) => `<details class="s-autoi"><summary><span>${esc(x.doc.date)} ${esc(x.doc.title)}</span><b>${fmt(entry.dr.reduce((t, d) => t + d[1], 0))}</b></summary><p class="muted">ルール「${esc(cond)}」</p>${jeTable(entry)}</details>`).join('')}<p class="muted" style="font-size:13px">開くと、どのルールでどう書いたかが見られる。</p><button class="btn wide" data-n>つぎへ</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-n]')) next(); };
  }

  /* ---- 困りごとから考え方を見つける ---- */
  function discoverScreen(ev, isReplay) {
    // もう一度見るときは、記録（1回目の正誤・分かれ道）に数えない
    const m = isReplay ? { tries: 0, first: null, hand: 0, forks: [] } : (S.metrics.disc[ev.id] = S.metrics.disc[ev.id] || { tries: 0, first: null, hand: 0, forks: [] });
    const metrics = isReplay ? { forks: {}, hand: 0 } : S.metrics;
    // 4拍（困りごと→問い→結果→名前）は設計の言葉。画面には出さず、ボタンは次の行動の言葉にする
    let beat = 1, picked = null, sorted = {}, reason = null, hintLv = 0;
    const draw = () => {
      let body = '';
      if (beat === 1) {
        body = `${talk(ev.b1.talk)}${ev.b1.dyn ? `<p class="s-dyn">${esc(ev.b1.dyn(S))}</p>` : ''}${docHTML(ev.b1.doc)}<button class="btn wide" data-b="2">${esc(ev.b1.go || 'ピヨといっしょに考える')}</button>`;
      } else if (beat === 2) {
        const b2 = ev.b2;
        let field = '';
        if (b2.layout === 'sort') {
          field = `<div class="s-sort">${b2.tokens.map((t) => `<div class="s-sorti"><span>${esc(t.label)}</span><div>${b2.targets.map((g) => `<button class="s-pill ${sorted[t.id] === g.id ? 'on' : ''}" data-sort="${t.id}" data-to="${g.id}">${esc(g.label)}</button>`).join('')}</div></div>`).join('')}</div>`;
        } else {
          field = `${b2.token ? `<div class="s-token ${picked ? 'placed' : ''}">${esc(b2.token)}</div>` : ''}<div class="s-targets ${b2.layout}">${b2.targets.map((g) => `<button class="s-target ${picked === g.id ? 'on' : ''}" data-pick="${g.id}"><b>${esc(g.label)}</b>${g.sub ? `<small>${esc(g.sub)}</small>` : ''}</button>`).join('')}</div>`;
        }
        const placed = b2.layout === 'sort' ? b2.tokens.every((t) => sorted[t.id]) : !!picked;
        body = `${ev.b1.doc ? `<details class="s-redoc"><summary>書類をもう一度見る</summary>${docHTML(ev.b1.doc)}</details>` : ''}<p class="s-q">${esc(b2.q)}</p>${field}${placed ? `${talk([['piyo', 'どうしてそう思ったピヨ？']])}<div class="s-reasons">${b2.reasons.map((r, i) => `<button class="s-reason ${reason === i ? 'on' : ''}" data-reason="${i}">${esc(r.t)}</button>`).join('')}</div>` : ''}<div class="s-hint" ${hintLv ? '' : 'hidden'}>${(b2.hints || []).slice(0, hintLv).map((h) => `<p>${esc(h)}</p>`).join('')}</div><button class="btn wide" data-decide ${placed && reason !== null ? '' : 'disabled'}>これで決める</button><div class="s-actions"><button class="btn ghost sm" data-b="1">← もどる</button>${(b2.hints || []).length > hintLv ? '<button class="btn ghost sm" data-hint>ヒント</button>' : ''}</div>`;
      } else if (beat === 3) {
        const b2 = ev.b2;
        const tgtOk = b2.layout === 'sort' ? b2.tokens.every((t) => sorted[t.id] === t.target) : b2.targets.find((g) => g.id === picked).ok;
        const r = b2.reasons[reason];
        if (tgtOk && r.ok) {
          const g = b2.layout === 'sort' ? null : b2.targets.find((x) => x.id === picked);
          body = `${g && g.react ? `<p class="s-react">${esc(g.react)}</p>` : ''}<p class="s-result">${esc(ev.b3.ok)}</p>${ev.b3.bs ? miniBS(ev.b3.bs) : ''}${ev.b3.bars ? barsHTML(ev.b3.bars) : ''}<button class="btn wide" data-b="4">これ、なんて呼ぶの？</button>`;
        } else {
          const why = !tgtOk ? (b2.layout === 'sort' ? b2.wrongReact : b2.targets.find((x) => x.id === picked).react) : r.react;
          body = `<p class="s-react ng">${esc(why)}</p><button class="btn wide ghost" data-retry>もう一度えらぶ</button>`;
        }
      } else {
        const b4 = ev.b4;
        body = `<div class="s-name"><small>この考え方の名前</small><h2>${rb(b4.name)}</h2><p>${rb(b4.line)}</p><details class="s-exam"><summary>試験では、どんな文章で出る？</summary>${esc(b4.exam)}</details><p class="s-leaf">マップに「${esc(b4.leaf.label)}」が加わった</p></div>${ev.hand ? '<button class="btn wide ghost" data-hand>先輩の手帳で、くわしく読む</button>' : ''}<button class="btn wide" data-done>つぎへ</button>`;
      }
      // 手帳（説明）は名前がついてから読める。考えている途中で答えを見せない
      frame(`<div class="s-card s-disc"><div class="s-disc-head"><h3>${esc(ev.title)}</h3></div>${body}</div>`);
    };
    draw();
    app.onclick = (e) => {
      const g = (s) => e.target.closest(s);
      if (g('[data-hand]')) { m.hand++; metrics.hand++; save(); overlay(`<h3>先輩の手帳</h3><p>${esc(ev.hand)}</p>`); return; }
      if (g('[data-b]')) { beat = +g('[data-b]').dataset.b; if (beat === 4 && !isReplay) teach(ev.b4.teaches); draw(); return; }
      if (g('[data-hint]')) { hintLv++; m.hints = (m.hints || 0) + 1; save(); draw(); return; }
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
        if (!tgtOk) { const f = b2.layout === 'sort' ? `${ev.id}:分け方` : (b2.targets.find((x) => x.id === picked).fork || `${ev.id}:${picked}`); m.forks.push(f); metrics.forks[f] = (metrics.forks[f] || 0) + 1; }
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

  // 判断：選ぶと、会社に何が起きるかがその場で返る。確かめてから決める
  function decisionScreen(ev) {
    teach(ev.teaches);
    let pick = null;
    const draw = () => {
      const o = ev.options.find((x) => x.id === pick);
      frame(`<div class="s-card"><h3>${esc(ev.q)}</h3>${talk(ev.talk)}${o ? `<div class="s-check"><p><b>${esc(o.label)}</b></p><p>${esc(o.result)}</p><button class="btn wide" data-yes>これで決める</button><button class="btn wide ghost" data-no>えらび直す</button></div>` : `<div class="s-opts">${ev.options.map((x) => `<button class="s-opt" data-opt="${x.id}"><b>${esc(x.label)}</b><small>${esc(x.desc)}</small></button>`).join('')}</div>`}</div>`);
    };
    draw();
    app.onclick = (e) => {
      const b = e.target.closest('[data-opt]');
      if (b) { pick = b.dataset.opt; draw(); return; }
      if (e.target.closest('[data-no]')) { pick = null; draw(); return; }
      if (e.target.closest('[data-yes]')) {
        S.decisions[ev.id] = pick;
        S.diary.push({ m: month().label, t: `${ev.q} → ${ev.options.find((x) => x.id === pick).label}` });
        next();
      }
    };
  }

  /* ---- 自動仕訳ルール ---- */
  function ruleOffer() {
    for (const [k, list] of Object.entries(S.kinds)) {
      if (S.rules[k] || !D.rules[k] || (S.declined || []).includes(k + '@' + S.mi)) continue;
      if (mastered(k)) return k;
    }
    return null;
  }
  function ruleScreen(k) {
    const R = D.rules[k];
    if (!S.ruleIntro) {
      S.ruleIntro = true; teach(['自動仕訳']);
      frame(`<div class="s-card">${talk([['piyo', 'また同じ書き方の書類ピヨ…。毎回同じなら、パソコンに覚えさせられないピヨ？'], ['senpai', 'いいところに気づいたね。「この条件のときは、こう書く」と覚えさせると、自動で帳簿に書いてくれる。これを「自動仕訳」というんだ。'], ['senpai', 'ただし、条件の決め方には気をつけて。広すぎると、ちがう書類まで同じように書いてしまう。']])}<button class="btn wide" data-n>やってみる</button></div>`);
      app.onclick = (e) => { if (e.target.closest('[data-n]')) ruleScreen(k); };
      return;
    }
    let msg = '';
    const ent = `借方 ${R.entry[0].join('・')} ／ 貸方 ${R.entry[1].join('・')}`;
    const draw = () => frame(`<div class="s-card"><small>自動仕訳</small><h3>「${esc(R.label)}」の書類には、もう慣れた</h3><p>どんな条件のとき、自動で「${esc(ent)}」と書かせる？</p><div class="s-opts">${R.conds.map((c, i) => `<button class="s-opt" data-cond="${i}"><b>${esc(c.t)}</b></button>`).join('')}</div>${msg}<button class="link" data-skip>今は登録しない</button></div>`);
    draw();
    app.onclick = (e) => {
      if (e.target.closest('[data-skip]')) { (S.declined = S.declined || []).push(k + '@' + S.mi); save(); render(); return; }
      if (e.target.closest('[data-n]')) { render(); return; }
      const b = e.target.closest('[data-cond]');
      if (!b) return;
      const c = R.conds[+b.dataset.cond];
      if (!c.ok) { msg = `<p class="s-react ng">森さん「${esc(c.why)}」</p>`; draw(); return; }
      S.rules[k] = { cond: c.t, broad: !!c.broad, at: S.mi };
      S.diary.push({ m: month().label, t: `自動仕訳を登録：${c.t} → ${ent}` });
      save();
      frame(`<div class="s-card"><small>自動仕訳</small><h3>登録した</h3><p>これからは「${esc(c.t)}」の書類が来たら、パソコンが「${esc(ent)}」と書く。</p><button class="btn wide" data-n>つぎへ</button></div>`);
    };
  }

  /* ---- 月末の見直し ---- */
  function closeScreen() {
    const bu = balances(S.L), bt = balances(S.T);
    const diff = [...new Set([...Object.keys(bu), ...Object.keys(bt)])].filter((a) => (bu[a] || 0) !== (bt[a] || 0));
    if (!diff.length) {
      const p = pl(bu);
      const note = knows('収益') && p.ni < 0 && (bu['仕入'] || 0) > 0 && !bu['繰越商品'] ? '<p class="muted" style="font-size:13px;margin:0">仕入れた商品は、売れ残りも全部「仕入」（費用）に入れている。売れ残りを資産に戻すのは1年の終わりだから、それまでは、もうけが小さく見える。</p>' : '';
      frame(`<div class="s-card"><small>${esc(month().label)}の見直し</small><h3>帳簿と書類が、ぜんぶ合った</h3>${miniBS(bsFrom(bu))}<p style="margin:0">口座のお金 <b>${fmt(cashOf(bu))}</b>${knows('収益') ? `　この1年のもうけ <b>${fmt(p.ni)}</b>` : ''}</p>${note}<button class="btn wide" data-next>${S.mi + 1 < D.months.length ? '次の月へ' : 'つぎへ'}</button></div>`);
      app.onclick = (e) => { if (e.target.closest('[data-next]')) { S.closes.push({ mi: S.mi, fixed: S.fixLog.some((f) => f.mi === S.mi) }); advanceMonth(); } };
      return;
    }
    // 今月の記帳のうち、書類と合わないもの
    const wrong = S.L.filter((x) => x.mi === S.mi && !sameEntry(x, S.T.find((t) => t.id === x.id)));
    const autoWrong = wrong.some((x) => x.auto);
    frame(`<div class="s-card"><small>${esc(month().label)}の見直し</small><h3>帳簿と書類が合わないところがある</h3><p class="s-react ng">森さん「${esc(diff.slice(0, 3).join('・'))}の残りの金額が、書類と合わないみたい。${autoWrong ? '自動仕訳が、条件の外の書類にまで使われていないかな？' : 'このあたりの書類を、もう一度見てみよう。'}」</p><div class="s-wrong">${wrong.map((x) => `<button class="s-opt" data-fix="${esc(x.ev)}"><b>${esc(evTitle(x.ev))}</b><small>${x.dr.map((d) => d[0]).join('・')} ／ ${x.cr.map((c) => c[0]).join('・')}${x.auto ? '（自動仕訳）' : ''}</small></button>`).join('')}</div></div>`);
    app.onclick = (e) => {
      const b = e.target.closest('[data-fix]');
      if (!b) return;
      S.metrics.fixes++;
      const ev = events().find((x) => x.id === b.dataset.fix);
      S.fixLog.push({ ev: ev.id, kind: ev.kind, mi: S.mi });
      if (ev.trapFor && S.rules[ev.trapFor] && S.rules[ev.trapFor].broad) {
        S.rules[ev.trapFor].broad = false; S.rules[ev.trapFor].cond = D.rules[ev.trapFor].conds.find((c) => c.ok && !c.broad).t;
        S.diary.push({ m: month().label, t: `自動仕訳の条件を直した：${S.rules[ev.trapFor].cond}（チラシ代まで仕入にしていた）` });
        save();
        overlay(`<h3>自動仕訳の条件を直した</h3><p>「掛けで何かを買ったとき」という条件では、チラシ代まで「仕入／買掛金」と書いてしまった。条件を「商品を掛けで仕入れたとき」に直した。</p><p>この請求書は、手で書き直そう。チラシは商品？</p>`);
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
    if (p.ni > 0) out.純資産.push(['この1年のもうけ', p.ni]);
    // 損が出ているときは、純資産をその分だけ小さく見せる
    if (p.ni < 0) out.純資産 = [[`${gw('純資産')}（この1年の損 ${fmt(-p.ni)} を引いた後）`, out.純資産.reduce((t, [, v]) => t + v, 0) + p.ni]];
    return out;
  }
  function advanceMonth() {
    S.mi++; S.ei = 0; S.phase = S.mi < D.months.length ? 'monthIntro' : 'event'; save(); render();
  }

  /* ---- 1年の終わり（自分の帳簿＝月末に直した帳簿から作る） ---- */
  function statements() {
    const b = balances(S.L), p = pl(b);
    const assets = Object.entries(b).filter(([a, v]) => v && (cat(a) === '資産' || CONTRA.has(a)));
    const ta = assets.reduce((t, [, v]) => t + v, 0);
    const eq = Object.entries(b).filter(([a]) => cat(a) === '純資産').reduce((t, [, v]) => t - v, 0) + p.ni;
    return { b, p, ta, eq };
  }
  function reportScreen(ev) {
    teach(ev.teaches);
    const { b } = statements();
    S.reportSeen = true; save();
    frame(`<div class="s-card"><small>1年目の決算書</small><div class="s-name"><p>1年の終わりの棚の絵を「貸借対照表」、1年のもうけの中身を「損益計算書」、2つあわせて「決算書」という。銀行や株主は、これを見て会社を判断する。</p></div>${companyView(b)}<button class="btn wide" data-n>銀行へ持っていく</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-n]')) { S.diary.push({ m: '決算', t: `1年目のもうけ ${fmt(statements().p.ni)}円` }); next(); } };
  }
  function bankScreen() {
    const { p, ta, eq } = statements();
    const ratio = Math.round((eq / ta) * 100);
    const lines = [];
    lines.push(['ginko', `1年目のもうけは${p.ni.toLocaleString()}円。資産のうち、返さなくていいお金（純資産）でまかなっている割合は${ratio}%ですね。`]);
    if (S.decisions.dep === 'rate') lines.push(['ginko', 'トラックを最初に多く費用にしているのは、慎重な会社という印象です。そのぶん今年のもうけは小さく見えますが、来年からは軽くなります。']);
    else lines.push(['ginko', 'トラックを毎年同じ額ずつ費用にしているので、来年からのもうけの見通しが立てやすいですね。']);
    if (S.decisions.credit === 'credit') lines.push(['ginko', 'A社の件で、もらえない見込みの10万円を貸倒引当金にしたのは誠実です。ただ、支払いが遅れている噂のある相手に掛けで売ったのは、心配な点ですね。']);
    else if (S.decisions.credit === 'cash') lines.push(['ginko', 'A社に、すぐ払ってもらう取引を求めたのは、いい判断でした。']);
    else lines.push(['ginko', 'A社との取引を見送ったのは慎重でしたね。']);
    if (S.decisions.crunch === 'loan') lines.push(['ginko', '11月のお金不足は、うちからの借入で乗り切りましたね。お礼の9,000円は、D社のお金を待つための費用でした。']);
    else lines.push(['ginko', '11月はD社にまけて早く払ってもらいましたね。1万円の値引きは、借りたときのお礼9,000円より高くつきました。']);
    if (S.metrics.fixes >= 3) lines.push(['ginko', '月末の直しが多かったのは少し気になります。毎月の数字を早く正確に出すことが、信用のもとです。']);
    const offer = Math.max(100000, Math.round((eq * 0.8) / 10000) * 10000);
    lines.push(['ginko', `2年目は、${offer.toLocaleString()}円までお貸しできます。`]);
    S.diary.push({ m: '翌年4月', t: `銀行：2年目は ${fmt(offer)}円まで借りられる` });
    frame(`<div class="s-card"><small>翌年4月</small><h3>みらい銀行の審査</h3>${talk(lines)}<button class="btn wide" data-n>本試験の問題で、腕だめし</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-n]')) next(); };
  }
  // 腕だめし：体験した論点のうち、教わった言葉だけで読める本試験形式の問題を選ぶ
  function pickQuiz() {
    const taught = new Set(S.taught);
    // 2級の論点を先に、3級の土台はあとに。1つの章から2問まで
    const items = B.scope.filter((it) => scopeState(it).met != null).sort((x, y) => (x.base ? 1 : 0) - (y.base ? 1 : 0));
    const byKey = Object.fromEntries(B.chapters.flatMap((c) => c.qs.map((q, k) => [`${c.id}:${k}`, q])));
    const readable = (q) => q && q.type === 'journal' && !/上記|前問/.test(q.q) && !LX.unknown(q.q, taught).length && [...q.ans.dr, ...q.ans.cr].every(([a]) => taught.has(a));
    const keys = [...items.flatMap((it) => it.q || []), ...items.flatMap((it) => (B.chapters.find((c) => c.id === it.ch) || { qs: [] }).qs.map((_, k) => `${it.ch}:${k}`))];
    const out = [];
    const perCh = {};
    for (const k of keys) { const ch = k.split(':')[0]; if (out.length >= 5) break; if (!out.includes(k) && (perCh[ch] || 0) < 2 && readable(byKey[k])) { out.push(k); perCh[ch] = (perCh[ch] || 0) + 1; } }
    return out.map((k) => byKey[k]);
  }
  function quizScreen() {
    const qs = pickQuiz();
    let i = 0, score = 0;
    const results = [];
    const draw = () => {
      if (i >= qs.length) {
        S.metrics.quiz = { score, of: qs.length, results };
        save();
        frame(`<div class="s-card"><small>腕だめし</small><h3>${qs.length ? `${score} / ${qs.length} 問 正解` : '今回は問題なし'}</h3><p>本試験と同じ文章で出された問題。会社で体験したことが、試験の形でも使えたかを確かめた。結果はマップの「試験範囲で見る」に残る。</p><button class="btn wide" data-n>1年をふりかえる</button></div>`);
        app.onclick = (e) => { if (e.target.closest('[data-n]')) next(); };
        return;
      }
      const q = qs[i];
      const accs = [...new Set([...(B.chapters.find((c) => c.qs.includes(q)).accounts || []), ...q.ans.dr.map((x) => x[0]), ...q.ans.cr.map((x) => x[0])])].filter(knows).sort((a, b) => order(a) - order(b));
      const optHTML = `<option value="">札をえらぶ</option>${accs.map((a) => `<option>${esc(a)}</option>`).join('')}`;
      const side = (s) => [0, 1, 2].map((k) => `<div class="s-row"><select data-s="${s}" data-i="${k}" aria-label="${s === 'dr' ? '借方' : '貸方'}の札">${optHTML}</select><input data-s="${s}" data-i="${k}" inputmode="numeric" placeholder="金額" aria-label="${s === 'dr' ? '借方' : '貸方'}の金額"></div>`).join('');
      frame(`<div class="s-card"><small>腕だめし ${i + 1} / ${qs.length}</small><p class="s-q">${q.q}</p><div class="s-entry"><div class="s-cols"><div class="s-side dr"><h4>借方（左）</h4>${side('dr')}</div><div class="s-side cr"><h4>貸方（右）</h4>${side('cr')}</div></div></div><div data-res></div><button class="btn wide" data-check>答える</button></div>`);
      app.onclick = (e) => {
        if (e.target.closest('[data-check]')) {
          const entry = { dr: [], cr: [] };
          for (const s of ['dr', 'cr']) { const sels = $$(`select[data-s="${s}"]`, app), ins = $$(`input[data-s="${s}"]`, app); sels.forEach((x, k) => { const v = Number((ins[k].value || '').normalize('NFKC').replace(/[^\d]/g, '')); if (x.value && v) entry[s].push([x.value, v]); }); }
          const ok = [q.ans, ...(q.alt || [])].some((a) => entry.dr.length && entry.cr.length && sameEntry(entry, a));
          if (ok) score++;
          results.push({ key: q._key, ok });
          S.examLog.push({ key: q._key, ok, t: Date.now() });
          save();
          $('[data-res]', app).innerHTML = `<p class="s-react ${ok ? '' : 'ng'}">${ok ? '正解' : 'おしい。正しくは：'}</p>${ok ? '' : jeTable(q.ans)}${q.exp ? `<p class="muted" style="font-size:13px">${q.exp}</p>` : ''}`;
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
    const { p, b } = statements();
    const disc = Object.entries(M.disc);
    const firstOk = disc.filter(([, d]) => d.first).length;
    const mins = Math.round((Date.now() - M.started) / 60000);
    const forks = Object.entries(M.forks).sort((a, c) => c[1] - a[1]);
    frame(`<div class="s-card"><small>1年のふりかえり</small><h3>1年目、おつかれさま</h3><p>屋台の小銭2,000円から始まった会社は、1年でもうけ <b>${fmt(p.ni)}円</b>、口座のお金 <b>${fmt(cashOf(b))}円</b> になった。</p><h4>あなたが決めたこと</h4><ul class="s-diary">${S.diary.map((d) => `<li><b>${esc(d.m)}</b> ${esc(d.t)}</li>`).join('')}</ul><button class="btn wide ghost" data-ov="map">マップで、見つけた考え方を見る</button><details class="s-devlog"><summary>開発用の記録</summary><table class="s-tb"><tr><td>考える場面で、1回目から正しくたどり着いた</td><td class="n">${firstOk} / ${disc.length}</td></tr><tr><td>先輩の手帳を開いた回数</td><td class="n">${M.hand}</td></tr><tr><td>書類の記帳で、1回目から正しかった</td><td class="n">${M.docs.first} / ${M.docs.n}</td></tr><tr><td>月末に直した回数</td><td class="n">${M.fixes}</td></tr><tr><td>ヒントを見た回数</td><td class="n">${M.hints}</td></tr><tr><td>自動仕訳で進んだ書類</td><td class="n">${M.autoPosted}</td></tr><tr><td>腕だめし</td><td class="n">${M.quiz ? `${M.quiz.score} / ${M.quiz.of}` : '-'}</td></tr><tr><td>かかった時間</td><td class="n">${mins}分</td></tr></table>${forks.length ? `<p>迷ったところ</p><ul class="s-diary">${forks.map(([f, n]) => `<li>${esc(f)} <b>${n}</b></li>`).join('')}</ul>` : ''}</details><button class="btn wide ghost" data-again>最初からもう一度</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-again]')) { S = fresh(); S.phase = 'monthIntro'; save(); render(); } };
  }

  B.chapters.forEach((c) => c.qs.forEach((q, i) => { q._key = `${c.id}:${i}`; }));
  window.__sim = { get S() { return S; }, balances, events, render, mastered };
  render();
})();
