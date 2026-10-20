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
  const CONTRA_OF = { 貸倒引当金: '売掛金', 車両運搬具減価償却累計額: '車両運搬具', 備品減価償却累計額: '備品', 建物減価償却累計額: '建物', 減価償却累計額: '機械装置', 機械装置減価償却累計額: '機械装置' };
  const CONTRA = new Set(Object.keys(CONTRA_OF));
  const order = (a) => (CONTRA.has(a) ? 0.5 : CATS.indexOf(cat(a)) < 0 ? 9 : CATS.indexOf(cat(a)));
  const CAST = { piyo: ['ピヨ', 48], haha: ['お母さん', 330], esha: ['E社の担当者', 100], senpai: ['タカシ先輩', 205], shacho: ['ミライ社長', 24], eigyo: ['ハルカ（営業）', 12], ginko: ['田中さん（銀行）', 222], kansa: ['森さん（会計士）', 150], zeirishi: ['岩田さん（税理士）', 285], kabunushi: ['佐藤さん（株主）', 330], kojo: ['大山さん（工場長）', 60] };
  const KEY = 'boki2sim.v3';

  /* ---------- state ---------- */
  const fresh = () => ({ v: 3, bm: {}, seenEnds: [], ifSeen: [], mi: 0, ei: 0, phase: 'title', L: [], T: [], decisions: {}, rules: {}, kinds: {}, leaves: [], diary: [], trapHit: false, taught: [], silentIntro: false, ruleIntro: false,
    discDone: {}, docLog: [], fixLog: [], closes: [], examLog: [], reportSeen: false,
    metrics: { started: Date.now(), disc: {}, docs: { n: 0, first: 0 }, fixes: 0, hints: 0, hand: 0, autoPosted: 0, quiz: null, forks: {} } });
  let S = fresh();
  // 保存は store.js：端末の中にすぐ、公開ページの保存機能にも少し遅らせて（docs/STORAGE.md）
  const ST = B.store;
  { const raw = ST.loadLocal(KEY); if (raw) S = Object.assign(fresh(), raw); }
  const save = () => ST.save(KEY, S);
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
  // 科目名を出さずに、どの箱がどちらへ動いたかだけを言う（結果パネルの2段目）
  function boxMove(acc, side) {
    const c = CONTRA.has(acc) ? 'マイナスの札' : cat(acc);
    const up = (c === '資産' || c === '費用') ? side === 'dr' : c === 'マイナスの札' ? side === 'cr' : side === 'cr';
    return `${c === 'マイナスの札' ? 'マイナスの札' : gw(c)}が${up ? '増えた' : 'へった'}`;
  }

  /* ---------- flow ---------- */
  const month = () => D.months[S.mi];
  // 年：1年目の月には year がない（1）。2年目からは month.year
  const yearOf = (mi) => (D.months[mi] || {}).year || 1;
  // いまの年の締め切りの前の帳簿（決算書・ヘッダーのもうけは、締め切りの前の姿で見せる）
  const preClose = (entries) => entries.filter((e) => !(e.closing && yearOf(e.mi) === yearOf(S.mi)));
  const events = () => (month() ? month().events.filter((e) => !e.when || e.when(S)) : []);
  function post(ev, userEntry, auto) {
    const truth = val(ev.ans, S);
    const id = ev.id + '@' + S.mi;
    const y = yearOf(S.mi);
    S.L = S.L.filter((x) => x.id !== id).concat([{ id, mi: S.mi, y, ev: ev.id, kind: ev.kind, dr: userEntry.dr, cr: userEntry.cr, auto: !!auto }]);
    S.T = S.T.filter((x) => x.id !== id).concat([{ id, mi: S.mi, y, ev: ev.id, dr: truth.dr, cr: truth.cr }]);
    return sameEntry(userEntry, truth);
  }
  function next() { S.ei++; S.phase = 'event'; save(); render(); }
  // 同じ種類の書類を、別々の月に2回、ヒントなしで1回目から正しく書けたら「慣れた」（助けなしで書けたかで判定する）
  const mastered = (kind) => !!kind && new Set(S.docLog.filter((l) => l.kind === kind && l.ok && !l.hint).map((l) => l.mi)).size >= 2;

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
    const b = balances(preClose(S.L)), p = pl(b);
    const m = month();
    const inShop = S.mi > 0;
    const kpi = inShop ? `<div class="s-kpi"><small>口座のお金</small><b class="${cashOf(b) < 0 ? 'neg' : ''}">${fmt(cashOf(b))}</b></div>${knows('収益') ? `<div class="s-kpi"><small>この1年のもうけ</small><b class="${p.ni < 0 ? 'neg' : ''}">${fmt(p.ni)}</b></div>` : ''}${Object.keys(S.rules).length ? `<div class="s-kpi"><small>自動で書く書類</small><b>${Object.keys(S.rules).length}種類</b></div>` : ''}` : '';
    const nav = inShop ? '<nav class="s-nav"><button data-ov="co">会社の棚</button><button data-ov="map">マップ</button><button data-ov="grow">成長</button><button data-ov="log">日誌</button></nav>' : '';
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
    if (k === 'co') coOverlay();
    if (k === 'map') mapOverlay();
    if (k === 'grow') overlay(B.growth.view(GAPI));
    if (k === 'log') overlay(`<h3>経営日誌</h3>${S.diary.length ? `<ul class="s-diary">${S.diary.map((d) => `<li><b>${esc(d.m)}</b> ${esc(d.t)}</li>`).join('')}</ul>` : '<p class="muted">まだ記録はない。</p>'}`);
  });
  // 会社の棚：棚の絵と、元帳（勘定ごとに、日付・摘要・相手の札・残高）
  function ledgerView(acc) {
    const rows = [];
    let bal = 0;
    const plus = cat(acc) === '資産' || cat(acc) === '費用';
    for (const x of S.L) {
      const ev = (allEvents.find(({ e }) => e.id === x.ev) || {}).e;
      const date = ev && ev.doc ? ev.doc.date : monthLabel(x.mi);
      const memo = ev && ev.doc ? ev.doc.title : '';
      for (const [side, other] of [['dr', 'cr'], ['cr', 'dr']]) for (const [a, v] of x[side]) {
        if (a !== acc) continue;
        bal += (side === 'dr') === plus ? v : -v;
        rows.push(`<tr><td>${esc(date)}</td><td>${esc(memo)}</td><td>${esc(x[other].map((o) => o[0]).join('・'))}</td><td class="n">${side === 'dr' ? fmt(v) : ''}</td><td class="n">${side === 'cr' ? fmt(v) : ''}</td><td class="n">${fmt(bal)}</td></tr>`);
      }
    }
    return rows.length ? `<table class="s-ledger"><tr><th>日付</th><th>摘要</th><th>相手の札</th><th>借方</th><th>貸方</th><th>残高</th></tr>${rows.join('')}</table>` : '<p class="muted">まだ記録はない。</p>';
  }
  function coOverlay() {
    const b = balances(S.L);
    const accs = ['普通預金', '売掛金', '買掛金', '未払金', '借入金'].filter((a) => b[a] !== undefined && knows(a));
    let tab = 'bs';
    const o = overlay(`<div class="s-maptabs"><button data-cotab="bs">棚の絵</button>${accs.length ? '<button data-cotab="gl">元帳</button>' : ''}</div><div class="s-cobody"></div>`);
    let acc = accs[0];
    const paint = () => {
      $$('[data-cotab]', o).forEach((x) => x.classList.toggle('on', x.dataset.cotab === tab));
      $('.s-cobody', o).innerHTML = tab === 'bs' ? companyView(b) : `<p class="muted" style="font-size:12px">札ごとに、いつ・何の書類で・相手の札は何で動いたかが並ぶ。あとから森さんや銀行が「この日に何があったの？」と読むための記録。</p><div class="s-maptabs">${accs.map((a) => `<button data-glacc="${esc(a)}" class="${a === acc ? 'on' : ''}">${esc(a)}</button>`).join('')}</div><div class="s-scrollx">${ledgerView(acc)}</div>`;
    };
    paint();
    o.addEventListener('click', (e) => {
      const t = e.target.closest('[data-cotab]'); if (t) { tab = t.dataset.cotab; paint(); return; }
      const g = e.target.closest('[data-glacc]'); if (g) { acc = g.dataset.glacc; paint(); }
    });
  }
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
  // 成長の記録（growth.js）に渡す窓口
  const GAPI = { S: () => S, scopeState: (it) => scopeState(it), monthLabel, esc };
  const grew = (why) => { if (B.growth.snapshot(GAPI, why)) save(); };
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
  // 2027年4月施行の出題区分表での扱い（scope.js の y27）
  const Y27 = { out: '2027年度から出ない', to3: '2027年度から3級', chg: '2027年度から変更', new: '2027年度に明記' };
  const Y27_LONG = {
    out: '紙の手形・小切手がなくなるため、2027年4月からの試験には出ない。会社の歴史として知っておく程度でよい。',
    to3: '2027年4月から3級の範囲に移る。2級でも前提として使うので、できるようにしておく。',
    chg: '2027年4月からの出題区分表で、扱いや範囲が変わった論点。',
    new: '2027年4月からの出題区分表で、新しくはっきり書かれた論点。',
  };
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
      return `<button class="s-cell ${st.shaky ? 'shaky' : st.own ? 'own' : 'met'} ${st.exam || ''}" data-scope="${it.id}" style="--h:${PHUE[it.p] || 190}"><b>${esc(it.name)}</b><small>${esc(word)}</small>${st.exam ? `<em>${esc(EXAM_WORD[st.exam])}</em>` : ''}${it.y27 ? `<i>${esc(Y27[it.y27])}</i>` : ''}</button>`;
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
    return `<h3>${esc(known ? it.name : 'まだ名前のない困りごと')}</h3><p>${esc(it.teaser)}</p>${st.met != null ? `<p>${esc(monthLabel(st.met))}に会社で起きた。${st.shaky ? '月末に直したので、次に同じ書類が来たときが確かめどき。' : st.own ? '自分でできた。' : ''}</p>` : '<p class="muted">会社ではまだ起きていない。</p>'}${st.exam ? `<p>${esc(EXAM_WORD[st.exam])}。${st.exam === 'exam1' ? '日をあけてもう一度解けたら定着。' : ''}</p>` : ''}${it.y27 ? `<p class="muted">${esc(Y27_LONG[it.y27])}</p>` : ''}${disc ? `<button class="btn wide ghost" data-replay="${disc}">生まれた場面をもう一度</button>` : ''}`;
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
    ({ desk: deskScreen, talk: talkScreen, board: boardScreen, doc: docScreen, discover: discoverScreen, decision: decisionScreen, ending: (x) => endingScreen(x.id), ifonly: ifOnlyScreen, report: reportScreen, closing: closingScreen, opening: openingScreen, sheet: sheetScreen, bank: bankScreen, quiz: quizScreen, end: endScreen }[ev.t])(ev);
  }
  function saveWord() {
    const st = ST.status();
    return st.mode === 'cloud' ? 'この端末と、claude.ai のこのページに保存（別の端末でも続きから遊べる）' : st.mode === 'cloud-error' ? 'この端末に保存（claude.ai への保存はいま失敗している）' : 'この端末に保存';
  }
  function titleScreen() {
    const started = S.mi > 0 || S.ei > 0;
    const ps = ST.profiles(), cur = ST.currentProfile();
    const who = ps.length > 1 || (ps[0] && ps[0].name) ? `<div class="s-who"><small>だれが遊ぶ？</small>${ps.map((p, k) => `<button class="${p.id === cur ? 'on' : ''}" data-prof="${p.id}">${esc(p.name || `${k + 1}人目`)}</button>`).join('')}<button data-addprof>＋</button></div>` : '<button class="link" data-addprof>ほかの人もこの端末で遊ぶ</button>';
    app.innerHTML = `<main class="s-main s-title"><div class="s-logo">ピヨの<br><b>レモネード</b></div><p>小さな屋台が、会社になるまでの1年。<br>お金の出入りを記録して、会社を育てよう。</p><p class="muted" style="font-size:12px">試作版（約40分）</p>${who}<button class="btn wide" data-start>${started ? 'つづきから' : 'はじめる'}</button>${started ? '<button class="link" data-reset>最初からやり直す</button>' : ''}<details class="s-more"><summary>受験する年度・保存と引っ越し・確認テスト</summary><div class="s-who"><small>受験する年度（問題の出し方が変わる）</small><button class="${S.mode === '2026' ? 'on' : ''}" data-mode="2026">2027年3月まで</button><button class="${S.mode !== '2026' ? 'on' : ''}" data-mode="2027">2027年4月から</button></div><p class="muted" style="font-size:12px" data-saveword>${esc(saveWord())}</p><button class="btn wide ghost" data-export>保存データをファイルにする</button><label class="btn wide ghost s-file">ファイルから続きを読み込む<input type="file" accept="application/json,.json" data-import hidden></label><button class="btn wide ghost" data-test>確認テスト（協力してくれる人向け）</button></details></main>`;
    app.onclick = (e) => {
      if (e.target.closest('[data-start]')) { if (S.phase === 'title') S.phase = started ? 'event' : 'monthIntro'; save(); render(); }
      if (e.target.closest('[data-reset]')) { if (!confirm('この人の記録を消して、最初からやり直しますか？')) return; S = fresh(); S.phase = 'monthIntro'; save(); render(); }
      const pb = e.target.closest('[data-prof]');
      if (pb) { ST.switchProfile(pb.dataset.prof); const raw = ST.loadLocal(KEY); S = raw ? Object.assign(fresh(), raw) : fresh(); render(); ST.connect(KEY, (st) => { S = Object.assign(fresh(), st); if (document.querySelector('.s-title')) render(); }); }
      if (e.target.closest('[data-addprof]')) { const name = prompt('遊ぶ人の呼び名（あとで変えられる。本名でなくてよい）', ''); if (name == null) return; ST.addProfile(name); S = fresh(); render(); }
      if (e.target.closest('[data-export]')) { ST.download(`piyo-save-${new Date().toISOString().slice(0, 10)}.json`, ST.exportText(KEY) || JSON.stringify(S)); }
      if (e.target.closest('[data-test]')) testScreen();
      const md = e.target.closest('[data-mode]');
      if (md) { S.mode = md.dataset.mode; save(); titleScreen(); }
    };
    const inp = $('[data-import]', app);
    if (inp) inp.onchange = async () => { const f = inp.files[0]; if (!f) return; try { S = Object.assign(fresh(), ST.importText(KEY, await f.text())); save(); render(); } catch (err) { alert('このファイルは読み込めませんでした。'); } };
  }

  /* ---- 確認テスト：ヒントなし・答え合わせなしで、体験した論点の本試験形式の仕訳を解く（docs/STORAGE.md）。
     1回目（遊んだ直後）と2回目（7日後）は、同じ論点で数字の違う問題。結果はオーナーだけが読める場所に残す */
  // 問題は testforms.js（1回目と2回目は同じ形で数字だけ違う）
  function testForms() {
    const pick = (form) => B.testForms.map((f) => Object.assign({}, f[form], { _key: `${f.id}:${form}`, scope: f.scope }));
    return { A: pick('A'), B: pick('B') };
  }
  function testScreen() {
    const logs = ST.testLogs();
    frame(`<div class="s-card"><small>確認テスト</small><h3>助けなしで解いてみる</h3><p>ゲームで体験したことが、本試験の文章でも書けるかを確かめるテスト。ヒントも答え合わせも出ない。間違えてかまわない。</p><p class="muted" style="font-size:12px">結果は、協力をお願いした人（このページの持ち主）だけが読める場所に残る。名前は残さず、下の番号だけを使う。</p><label class="s-field">協力者の番号（例：T1）<input data-code maxlength="8" value="${esc((logs[logs.length - 1] || {}).code || '')}"></label><div class="s-two"><button class="btn" data-form="A">1回目（遊んだすぐあと）</button><button class="btn" data-form="B">2回目（7日後）</button></div>${logs.length ? `<p class="muted" style="font-size:12px">この端末の記録：${logs.map((r) => `${esc(r.code)} ${r.form === 'A' ? '1回目' : '2回目'} ${new Date(r.at).toLocaleDateString('ja-JP')}`).join('、')}</p><button class="link" data-testexport>記録をファイルにする</button>` : ''}<button class="link" data-back>タイトルにもどる</button></div>`);
    app.onclick = (e) => {
      if (e.target.closest('[data-back]')) { titleScreen(); return; }
      if (e.target.closest('[data-testexport]')) { ST.download('piyo-testlogs.json', JSON.stringify(ST.testLogs(), null, 1)); return; }
      const f = e.target.closest('[data-form]');
      if (!f) return;
      const code = ($('[data-code]', app).value || '').trim().replace(/[^\w-]/g, '').slice(0, 8);
      if (!code) { alert('協力者の番号を入れてください（例：T1）'); return; }
      const prevA = logs.find((r) => r.code === code && r.form === 'A');
      if (f.dataset.form === 'B' && prevA && Date.now() - prevA.at < 6 * 864e5 && !confirm(`1回目から${Math.floor((Date.now() - prevA.at) / 864e5)}日しかたっていません。それでも2回目を始めますか？`)) return;
      runTest(code, f.dataset.form);
    };
  }
  function runTest(code, form) {
    const qs = testForms()[form];
    const run = { id: `${code}-${form}-${Date.now()}`, code, form, at: Date.now(), play: { mi: S.mi, minutes: Math.round((Date.now() - S.metrics.started) / 60000), growth: (S.growth || []).slice(-1)[0] || null }, items: [] };
    let i = 0, t0 = Date.now();
    const draw = () => {
      if (i >= qs.length) {
        run.done = Date.now();
        ST.saveTest(run).then((where) => {
          frame(`<div class="s-card"><small>確認テスト</small><h3>おつかれさま</h3><p>${qs.length}問、最後まで解いてくれてありがとう。結果は${where === 'cloud' ? 'ページの持ち主に届いた' : 'この端末に残した（下のボタンでファイルにして、持ち主に渡してください）'}。</p>${form === 'A' ? '<p>7日後に、もう一度「2回目」を解いてください。</p>' : ''}${where === 'cloud' ? '' : '<button class="btn wide ghost" data-testexport>記録をファイルにする</button>'}<button class="btn wide" data-back>タイトルにもどる</button></div>`);
          app.onclick = (e) => { if (e.target.closest('[data-back]')) titleScreen(); if (e.target.closest('[data-testexport]')) ST.download('piyo-testlogs.json', JSON.stringify(ST.testLogs(), null, 1)); };
        });
        return;
      }
      const q = qs[i];
      const accs = [...new Set([...(q.accounts || []), ...q.ans.dr.map((x) => x[0]), ...q.ans.cr.map((x) => x[0])])].sort((a, b) => order(a) - order(b));
      const opt = `<option value="">科目をえらぶ</option>${accs.map((a) => `<option>${esc(a)}</option>`).join('')}`;
      const side = (sd) => [0, 1, 2].map((k) => `<div class="s-row"><select data-s="${sd}" aria-label="${sd === 'dr' ? '借方' : '貸方'}の科目">${opt}</select><input data-s="${sd}" inputmode="numeric" placeholder="金額" aria-label="${sd === 'dr' ? '借方' : '貸方'}の金額"></div>`).join('');
      frame(`<div class="s-card"><small>確認テスト ${i + 1} / ${qs.length}</small><p class="s-q">${q.q}</p><div class="s-entry"><div class="s-cols"><div class="s-side dr"><h4>借方（左）</h4>${side('dr')}</div><div class="s-side cr"><h4>貸方（右）</h4>${side('cr')}</div></div></div><button class="btn wide" data-ans>次へ</button><button class="link" data-skip>わからないので飛ばす</button></div>`);
      t0 = Date.now();
      app.onclick = (e) => {
        const skip = e.target.closest('[data-skip]');
        if (!skip && !e.target.closest('[data-ans]')) return;
        const entry = { dr: [], cr: [] };
        for (const sd of ['dr', 'cr']) { const sel = $$(`select[data-s="${sd}"]`, app), ins = $$(`input[data-s="${sd}"]`, app); sel.forEach((x, k) => { const v = Number((ins[k].value || '').normalize('NFKC').replace(/[^\d]/g, '')); if (x.value && v) entry[sd].push([x.value, v]); }); }
        const okA = !skip && entry.dr.length && entry.cr.length && [q.ans, ...(q.alt || [])].some((a) => sameEntry(entry, a));
        run.items.push({ key: q._key, scope: q.scope, ok: !!okA, skipped: !!skip, ms: Date.now() - t0, entry: skip ? null : entry });
        i++; draw();
      };
    };
    draw();
  }

  // 決算の机：どの書類が決算で直すものかを選ぶ。答えは選び終えてから、1枚ずつ理由つきで返す
  function deskScreen(ev) {
    const sel = new Set(); let checked = false;
    const draw = () => {
      const res = checked ? ev.items.map((it) => ({ it, ok: sel.has(it.id) === it.need })) : null;
      const allOk = res && res.every((r) => r.ok);
      frame(`<div class="s-card">${talk(ev.talk)}<p class="s-q">${esc(ev.q)}</p><div class="s-desk">${ev.items.map((it, k) => { const r = res && res[k]; return `<div class="s-deskit ${sel.has(it.id) ? 'on' : ''} ${r ? (r.ok ? 'ok' : 'ng') : ''}" data-dk="${it.id}" role="button" tabindex="0" aria-pressed="${sel.has(it.id)}"><b>${gloss(it.title)}</b><small>${esc(val(it.line, S))}</small>${r ? `<em>${it.need ? '直す' : '直さない'}：${esc(it.why)}</em>` : ''}</div>`; }).join('')}</div>${!checked ? `<button class="btn wide" data-dkc ${sel.size ? '' : 'disabled'}>これで確かめる</button>` : allOk ? `${talk([['kansa', '全部見つけたね。直すものから、順に片づけよう。']])}<button class="btn wide" data-n>片づけはじめる</button>` : `${talk([['kansa', `見落とし・選びすぎが ${res.filter((r) => !r.ok).length} つある。理由を読んで、もう一度選んでみて。`]])}<button class="btn wide ghost" data-dkr>もう一度選ぶ</button>`}</div>`);
    };
    draw();
    app.onclick = (e) => {
      if (e.target.closest('[data-gl]')) return; // 書類の言葉の説明は、選ぶこととは別
      const d = e.target.closest('[data-dk]');
      if (d && !checked) { const id = d.dataset.dk; if (sel.has(id)) sel.delete(id); else sel.add(id); draw(); return; }
      if (e.target.closest('[data-dkc]')) { checked = true; const m = (S.metrics.desk = S.metrics.desk || { tries: 0 }); m.tries++; if (m.first == null) m.first = ev.items.every((it) => sel.has(it.id) === it.need); save(); draw(); return; }
      if (e.target.closest('[data-dkr]')) { checked = false; draw(); return; }
      if (e.target.closest('[data-n]')) next();
    };
  }
  function monthIntro() {
    const m = month();
    frame(`<div class="s-card s-intro"><small>${esc(m.label)}</small><h2>${esc(m.title)}</h2><button class="btn wide" data-go>${S.mi === 0 ? '屋台へ行く' : '机に向かう'}</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-go]')) { S.phase = 'event'; S.ei = 0; save(); recallScreen(render); } };
  }
  // 月のはじめに、先月の書類と同じ種類を、金額を変えて1つ思い出して書く（想起。答えは書いたあとに見せる）
  function recallScreen(done) {
    S.recall = S.recall || [];
    if (S.recall.some((r) => r.mi === S.mi && !r.due)) return done();
    // 7日前後たった、間違えた論点の別の問題があれば、先にそれを1問
    const due = dueReview();
    if (due && !S.recall.some((r) => r.mi === S.mi && r.due)) { S.recall.push({ mi: S.mi, due: due._key }); save(); return quickQuiz([due], '日をあけて確かめる', () => recallScreen(done)); }
    const prev = S.L.filter((x) => x.mi === S.mi - 1 && x.kind && !x.auto).map((x) => ({ x, ev: (allEvents.find(({ e }) => e.id === x.ev) || {}).e })).filter((o) => o.ev && o.ev.doc && o.ev.opts);
    const pick = prev.filter((o) => { const t = S.T.find((y) => y.id === o.x.id); return t && [...t.dr, ...t.cr].every(([a]) => knows(a)); }).pop();
    if (!pick) return done();
    const t = S.T.find((y) => y.id === pick.x.id), k = S.mi % 2 ? 3 : 2;
    const truth = { dr: t.dr.map(([a, v]) => [a, v * k]), cr: t.cr.map(([a, v]) => [a, v * k]) };
    const opts = [...new Set([...(pick.ev.opts || []), ...truth.dr.map((x) => x[0]), ...truth.cr.map((x) => x[0])])].filter(knows).sort((a, b) => order(a) - order(b));
    const opt = `<option value="">札をえらぶ</option>${opts.map((a) => `<option>${esc(a)}</option>`).join('')}`;
    const side = (sd) => [0, 1].map((i) => `<div class="s-row"><select data-s="${sd}" aria-label="${sd === 'dr' ? '借方' : '貸方'}の札">${opt}</select><input data-s="${sd}" inputmode="numeric" placeholder="金額" aria-label="${sd === 'dr' ? '借方' : '貸方'}の金額"></div>`).join('');
    frame(`<div class="s-card"><small>${esc(month().label)}のはじめに 思い出す</small>${talk([['senpai', `先月の「${pick.ev.doc.title}」を思い出して。同じ種類の書類で、金額が${k}倍だったら、どう書く？ 書類は見ないで。`]])}<div class="s-entry"><div class="s-cols"><div class="s-side dr"><h4>借方（左）</h4>${side('dr')}</div><div class="s-side cr"><h4>貸方（右）</h4>${side('cr')}</div></div></div><div data-res></div><button class="btn wide" data-rc>書いた</button><button class="link" data-rskip>思い出せないので、今月へ進む</button></div>`);
    app.onclick = (e) => {
      if (e.target.closest('[data-rnext]')) { done(); return; }
      const skip = e.target.closest('[data-rskip]');
      if (!skip && !e.target.closest('[data-rc]')) return;
      const entry = { dr: [], cr: [] };
      for (const sd of ['dr', 'cr']) { const sel = $$(`select[data-s="${sd}"]`, app), ins = $$(`input[data-s="${sd}"]`, app); sel.forEach((x, i) => { const v = Number((ins[i].value || '').normalize('NFKC').replace(/[^\d]/g, '')); if (x.value && v) entry[sd].push([x.value, v]); }); }
      const ok = !skip && entry.dr.length && entry.cr.length && sameEntry(entry, truth);
      S.recall.push({ mi: S.mi, kind: pick.x.kind, ok: !!ok, skipped: !!skip }); save();
      $('[data-res]', app).innerHTML = `<p class="s-react ${ok ? '' : 'ng'}">${ok ? '思い出せた。' : '先月の書き方は、こうだった（金額は' + k + '倍）。'}</p>${ok ? '' : jeTable(truth)}<button class="btn wide" data-rnext>今月へ</button>`;
      $$('[data-rc], [data-rskip]', app).forEach((x) => x.remove());
    };
  }
  function talkScreen(ev) {
    teach(ev.teaches);
    // 判断の結果が返ってきた場面は、経営日誌に「判断→返った結果」として残す
    if (ev.diary && !S.diary.some((d) => d.t === ev.diary)) { S.diary.push({ m: month().label, t: ev.diary, ret: true }); save(); }
    frame(`<div class="s-card">${talk(val(ev.lines, S))}<button class="btn wide" data-n>つぎへ</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-n]')) next(); };
  }

  /* ---- プロローグ：棚に並べる・右の棚に置く・ノートに書く ---- */
  function boardScreen(ev, isReplay) {
    const st = { L: [], R1: [], R0: [] };
    let i = 0, sub = {}, msg = '', done = false, sale = Number(S.decisions.price === '200' ? 1600 : 2000);
    const amt = (a) => (a === 'sale' ? sale : a);
    const sum = (list) => list.reduce((t, x) => t + x.amt, 0);
    const coin = (d) => { const c = st.L.find((x) => x.id === 'coin'); if (c) c.amt += d; };
    // 戻る・取り消すで棚が二重にならないように、段の始まりと一手ごとの状態を取っておく
    const snap = () => JSON.stringify({ st, sale, sub });
    const restore = (j) => { const o = JSON.parse(j); st.L = o.st.L; st.R1 = o.st.R1; st.R0 = o.st.R0; sale = o.sale; sub = o.sub; };
    const stepStart = [snap()], subs = [];
    let hist = [];
    const mark = () => hist.push(snap());
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
      frame(`<div class="s-card">${talk(s.say)}${s.q && !(ready && s.k !== 'card') ? `<p class="s-q">${esc(s.q)}</p>` : ''}${body}${msg ? `<p class="s-react ng">${esc(msg)}</p>` : ''}${after}${ready ? '<button class="btn wide" data-step>つぎへ</button>' : ''}${hist.length ? '<button class="btn ghost sm" data-undo>ひとつ取り消す</button>' : ''}${i > 0 ? '<button class="btn ghost sm" data-back>← もどる</button>' : ''}</div>`);
    };
    draw();
    app.onclick = (e) => {
      const s = ev.steps[i], g = (q) => e.target.closest(q);
      if (g('[data-undo]')) { if (hist.length) restore(hist.pop()); msg = ''; draw(); return; }
      if (g('[data-tok]')) { const t = s.tokens.find((x) => x.id === g('[data-tok]').dataset.tok); if (st.L.some((x) => x.id === t.id)) return; mark(); st.L.push({ id: t.id, label: t.label, amt: t.amt }); msg = ''; draw(); return; }
      if (g('[data-put]')) {
        const b = g('[data-put]'), t = s.tokens.find((x) => x.id === b.dataset.put);
        if (b.dataset.to !== t.ok) { msg = t.react; draw(); return; }
        if (sub[t.id]) return;
        mark(); sub[t.id] = b.dataset.to; st[t.ok].push({ id: t.id, label: t.label, amt: amt(t.amt) }); if (t.coin) coin(amt(t.coin)); msg = ''; draw(); return;
      }
      if (g('[data-pick]')) { const o = s.opts.find((x) => x.id === g('[data-pick]').dataset.pick); mark(); sub.pick = o.id; sale = o.sale; if (!isReplay) S.decisions.price = o.id; msg = ''; draw(); return; }
      if (g('[data-ask]')) {
        const [li, k] = g('[data-ask]').dataset.ask.split('-').map(Number), o = s.lines[li].ask.opts[k];
        if (!o.ok) { msg = o.react; draw(); return; }
        sub['ask' + li] = true; sub.askOk = o.react; msg = ''; draw(); return;
      }
      if (g('[data-note]')) {
        const b = g('[data-note]'), [li, ci] = b.dataset.note.split('-').map(Number), c = s.lines[li].cards[ci];
        if (b.dataset.side !== c.side) { msg = s.react[c.kind]; draw(); return; }
        if (sub[b.dataset.note]) return;
        mark(); sub[b.dataset.note] = c.side; msg = ''; draw(); return;
      }
      // もどる：この段でしたことを取り消してから、前の段を終えたときの状態に戻す
      if (g('[data-back]')) { restore(stepStart[i]); i--; sub = subs[i] || {}; hist = []; msg = ''; draw(); return; }
      if (g('[data-step]')) {
        if (s.k === 'card' && !isReplay) { teach(s.teaches); if (!S.leaves.some((l) => l.label === s.leaf.label)) S.leaves.push({ p: s.leaf.p, label: s.leaf.label, mi: S.mi }); }
        if (i + 1 < ev.steps.length) { subs[i] = JSON.parse(JSON.stringify(sub)); i++; sub = {}; hist = []; stepStart[i] = snap(); msg = ''; draw(); return; }
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
      frame(`<div class="s-card">${talk([['senpai', 'この種類の書類には、もう慣れたね。ここからは、書いたらすぐ次へ進もう。何が動いたかは1行で返るし、合っているかは月末に森さんとまとめて見直すよ。']])}<button class="btn wide" data-n>わかった</button></div>`);
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
        if (!fixMode && tries === 1) { S.docLog.push({ ev: ev.id, kind: ev.kind, mi: S.mi, ok, hint: hintLv > 0 }); S.metrics.docs.n++; if (ok) { S.metrics.docs.first++; if (ev.kind) (S.kinds[ev.kind] = S.kinds[ev.kind] || []).push(S.mi); } }
        if (coach && !ok) {
          // 正解は言わない。1回目：書類から確かに言えることと、自分の仕訳が言っていること（？の行）を並べる
          const lines = [...entry.dr.map(([a, v]) => ['dr', a, v]), ...entry.cr.map(([a, v]) => ['cr', a, v])];
          const inTruth = ([s, a, v]) => truth[s].some(([ta, tv]) => ta === a && tv === v);
          const tlines = [...truth.dr.map(([a, v]) => ['dr', a, v]), ...truth.cr.map(([a, v]) => ['cr', a, v])];
          const anchor = tlines.find(([, a]) => ['普通預金', '売掛金', '買掛金', '未払金', '借入金'].includes(a));
          const first = `<p><b>書類から確かに言えること</b><br>${anchor ? esc(moveText(anchor[1], anchor[0], anchor[2])) : '書類の金額と、何が起きたかをもう一度読もう'}</p><p><b>いまの仕訳が言っていること</b></p><ul>${lines.map((l) => `<li class="${inTruth(l) ? 'ok' : 'q'}">${inTruth(l) ? '✓' : '？'} ${esc(moveText(l[1], l[0], l[2]))}</li>`).join('')}</ul>`;
          let more = '';
          if (tries === 1) more = '<p class="muted">いつ、何が起きた書類？ 書類の出来事と「？」の行は合っている？</p>';
          else if (tries === 2) {
            // 2回目：なぜ違うかを箱の動きで見せる（科目名は出さない）
            const um = lines.map(([sd, a]) => boxMove(a, sd)), tm = tlines.map(([sd, a]) => boxMove(a, sd));
            const extra = [...new Set(um.filter((m) => !tm.includes(m)))], missing = [...new Set(tm.filter((m) => !um.includes(m)))];
            more = `<div class="s-why"><p><b>箱の動きでくらべると</b></p>${extra.length ? `<p>いまの仕訳では「${extra.map(esc).join('」「')}」。この書類の出来事には、その動きがない。</p>` : ''}${missing.length ? `<p>この書類の出来事には「${missing.map(esc).join('」「')}」という動きがあるのに、いまの仕訳にない。</p>` : ''}${!extra.length && !missing.length ? '<p>箱の動きは合っている。札の名前か金額が、書類とちがう。</p>' : ''}</div>`;
          } else {
            // 3回目から：別の事例の手本（同じ種類の、前に書いた書類）を見せてから、この書類にもう一度
            const model = S.T.filter((x) => x.ev !== ev.id && S.L.some((l) => l.id === x.id && l.kind === ev.kind)).pop();
            if (model) {
              const me = allEvents.find(({ e }) => e.id === model.ev);
              more = `<div class="s-why"><p><b>先輩「前に、同じ種類の書類をこう書いたよ」</b></p>${me ? `<p class="muted">${esc(me.e.doc.date)} ${esc(me.e.doc.title)}</p>` : ''}${jeTable(model)}<p>同じ考え方で、この書類の数字と相手で書いてみよう。</p></div>`;
            } else { hint(); hint(); hint(); more = '<p class="muted">ヒントの3つめに、使う札が出ている。</p>'; }
          }
          panel = `<div class="s-check">${first}${more}<button class="btn wide ghost" data-redo>書き直す</button></div>`;
          save(); draw(); return;
        }
        post(ev, entry, false);
        save();
        if (fixMode) return closeScreen();
        if (coach) {
          panel = `<div class="s-check good"><p><b>帳簿に書けた</b></p><ul>${[...entry.dr.map(([a, v]) => moveText(a, 'dr', v)), ...entry.cr.map(([a, v]) => moveText(a, 'cr', v))].map((t) => `<li>${esc(t)}</li>`).join('')}</ul>${miniBS(bsFrom(balances(S.L)))}<button class="btn wide" data-n>つぎへ</button></div>`;
          draw(); return;
        }
        // 慣れた種類は止めずに進む。何が動いたかだけ1行で知らせる
        toast(entry.dr.concat([]).map(([a, v]) => moveText(a, 'dr', v)).concat(entry.cr.map(([a, v]) => moveText(a, 'cr', v))).join('／'));
        next();
      }
    };
  }
  function toast(text) {
    const t = document.createElement('div');
    t.className = 's-toast'; t.setAttribute('role', 'status'); t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2800);
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
  // 名前カードの仕訳：この発見のすぐあとに出てくる、同じ月の最初の書類の正しい書き方（教わった札だけで書けるもの）
  function nameJE(ev) {
    const mi = D.months.findIndex((m) => m.events.includes(ev));
    if (mi < 0) return null;
    const evs = D.months[mi].events, k = evs.indexOf(ev);
    const teach = new Set([...(ev.b4.teaches || []), ...S.taught]);
    for (const x of evs.slice(k + 1)) {
      if (x.t !== 'doc' || (x.when && !x.when(S))) continue;
      const a = val(x.ans, S);
      // すぐあとの書類の答えそのものは見せない。同じ形で金額だけ変えた「たとえば」にする
      if ([...a.dr, ...a.cr].every(([acc]) => teach.has(acc))) return { dr: a.dr.map(([x, v]) => [x, v * 2]), cr: a.cr.map(([x, v]) => [x, v * 2]) };
      return null;
    }
    return null;
  }
  // 本試験の文で読める問題（教わった言葉と札だけ）。腕だめし・発見のあとの確かめ・想起で使う
  function readableQ(q) {
    const taught = new Set(S.taught);
    return q && q.type === 'journal' && !(S.mode !== '2026' && B.outdated27(q)) && !B.outOfScope2(q) && !/上記|前問/.test(q.q) && !LX.unknown(q.q, taught).length && [...q.ans.dr, ...q.ans.cr].every(([a]) => taught.has(a));
  }
  const qByKey = (k) => { const [c, i] = k.split(':'); const ch = B.chapters.find((x) => x.id === c); return ch ? ch.qs[+i] : null; };
  // 本試験の文で1〜数問、その場で答え合わせ。結果は examLog（成長の記録・7日後の確かめに使う）
  function quickQuiz(qs, label, done) {
    let i = 0;
    const draw = () => {
      if (i >= qs.length) return done();
      const q = qs[i];
      const ch = B.chapters.find((c) => c.qs.includes(q));
      const accs = [...new Set([...((ch || {}).accounts || []), ...q.ans.dr.map((x) => x[0]), ...q.ans.cr.map((x) => x[0])])].filter(knows).sort((a, b) => order(a) - order(b));
      const opt = `<option value="">札をえらぶ</option>${accs.map((a) => `<option>${esc(a)}</option>`).join('')}`;
      const side = (sd) => [0, 1].map(() => `<div class="s-row"><select data-s="${sd}" aria-label="${sd === 'dr' ? '借方' : '貸方'}の札">${opt}</select><input data-s="${sd}" inputmode="numeric" placeholder="金額" aria-label="${sd === 'dr' ? '借方' : '貸方'}の金額"></div>`).join('');
      frame(`<div class="s-card"><small>${esc(label)} ${i + 1} / ${qs.length}</small><p class="muted" style="font-size:12px;margin:0">本試験と同じ文章で出たら、書ける？</p><p class="s-q">${q.q}</p><div class="s-entry"><div class="s-cols"><div class="s-side dr"><h4>借方（左）</h4>${side('dr')}</div><div class="s-side cr"><h4>貸方（右）</h4>${side('cr')}</div></div></div><div data-res></div><button class="btn wide" data-qq>答える</button></div>`);
      app.onclick = (e) => {
        if (e.target.closest('[data-qn]')) { i++; draw(); return; }
        if (!e.target.closest('[data-qq]')) return;
        const entry = { dr: [], cr: [] };
        for (const sd of ['dr', 'cr']) { const sel = $$(`select[data-s="${sd}"]`, app), ins = $$(`input[data-s="${sd}"]`, app); sel.forEach((x, k) => { const v = Number((ins[k].value || '').normalize('NFKC').replace(/[^\d]/g, '')); if (x.value && v) entry[sd].push([x.value, v]); }); }
        const ok = entry.dr.length && entry.cr.length && [q.ans, ...(q.alt || [])].some((a) => sameEntry(entry, a));
        S.examLog.push({ key: q._key, ok: !!ok, t: Date.now() }); save();
        $('[data-res]', app).innerHTML = `<p class="s-react ${ok ? '' : 'ng'}">${ok ? '書けた' : '本試験の文では、こう書く：'}</p>${ok ? '' : jeTable(q.ans)}${q.exp ? `<p class="muted" style="font-size:13px">${q.exp}</p>` : ''}<button class="btn wide" data-qn>つぎへ</button>`;
        $('[data-qq]', app).remove();
      };
    };
    draw();
  }
  function discQuiz(ev) {
    const items = B.scope.filter((it) => ((it.sim || {}).disc || []).includes(ev.id));
    const keys = [...items.flatMap((it) => it.q || []), ...items.flatMap((it) => ((B.chapters.find((c) => c.id === it.ch) || { qs: [] }).qs.map((_, k) => `${it.ch}:${k}`)))];
    const seen = new Set(S.examLog.map((l) => l.key));
    return [...new Set(keys)].map(qByKey).filter((q) => readableQ(q) && !seen.has(q._key)).slice(0, 1);
  }
  // 7日前後（現実の時間）たった、本試験の文で間違えた問題の章から、別の問題を1つ
  function dueReview() {
    const now = Date.now();
    const miss = S.examLog.filter((l) => !l.ok && now - l.t >= 6 * 864e5 && !S.examLog.some((x) => x.ok && x.t > l.t && x.key.split(':')[0] === l.key.split(':')[0]));
    if (!miss.length) return null;
    const ch = miss[0].key.split(':')[0], seen = new Set(S.examLog.map((l) => l.key));
    const c = B.chapters.find((x) => x.id === ch);
    return c ? c.qs.find((q) => readableQ(q) && !seen.has(q._key)) || null : null;
  }
  // 札を箱に分ける問い（sort）と、工場の川（flow：材料→作っている途中→できあがり→売れた分へ価値を運ぶ）は同じしくみ
  const isSort = (b2) => b2.layout === 'sort' || b2.layout === 'flow';
  // 工場の川：箱を左から右へ並べ、運んだ札を箱の中に置く。運んだ札には、帳簿の1行（je）を添える
  function flowHTML(b2, sorted, withJE) {
    const box = (g) => { const inside = b2.tokens.filter((t) => sorted[t.id] === g.id); return `<div class="s-fbox ${g.side ? 'side' : ''}"><b>${esc(g.label)}</b>${inside.map((t) => `<span class="s-ftok">${esc(t.label)}</span>`).join('')}</div>`; };
    const main = b2.targets.filter((g) => !g.side), side = b2.targets.filter((g) => g.side);
    const next = b2.tokens.find((t) => !sorted[t.id]);
    const lines = !withJE ? '' : b2.tokens.filter((t) => sorted[t.id] && t.je && sorted[t.id] === t.target).map((t) => `<tr><td>${esc(t.je[0])}</td><td class="n">${fmt(t.je[2])}</td><td>${esc(t.je[1])}</td><td class="n">${fmt(t.je[2])}</td></tr>`).join('');
    return `${side.length ? `<div class="s-fside">${side.map(box).join('')}</div>` : ''}<div class="s-river">${main.map(box).join('<i class="s-farrow">→</i>')}</div>${next ? `<div class="s-sorti"><span><b>${esc(next.label)}</b></span><div>${b2.targets.map((g) => `<button class="s-pill" data-sort="${next.id}" data-to="${g.id}">${esc(g.label)}へ</button>`).join('')}</div></div>` : ''}${lines ? `<details class="s-fje" open><summary>この運びを、帳簿にはこう書く</summary><table class="s-tb"><tr><th>借方</th><th></th><th>貸方</th><th></th></tr>${lines}</table></details>` : ''}`;
  }
  function discoverScreen(ev, isReplay) {
    // 判断しだいで札が変わる発見（株主資本等変動計算書など）は、いまの帳簿で札を作る
    if (ev.b2 && typeof ev.b2.tokens === 'function') ev = Object.assign({}, ev, { b2: Object.assign({}, ev.b2, { tokens: ev.b2.tokens(S) }) });
    // もう一度見るときは、記録（1回目の正誤・分かれ道）に数えない
    const m = isReplay ? { tries: 0, first: null, hand: 0, forks: [] } : (S.metrics.disc[ev.id] = S.metrics.disc[ev.id] || { tries: 0, first: null, hand: 0, forks: [] });
    const metrics = isReplay ? { forks: {}, hand: 0 } : S.metrics;
    // 5拍（困りごと→予想→手の操作と理由→結果（最初の誤りと並べる）→名前）は設計の言葉。画面には出さず、ボタンは次の行動の言葉にする
    let beat = 1, picked = null, sorted = {}, reason = null, hintLv = 0, guess = null, firstWrong = null;
    const draw = () => {
      let body = '';
      if (beat === 1) {
        body = `${talk(ev.b1.talk)}${ev.b1.dyn ? `<p class="s-dyn">${esc(ev.b1.dyn(S))}</p>` : ''}${docHTML(ev.b1.doc)}<button class="btn wide" data-b="${ev.predict && guess === null ? 'p' : '2'}">${esc(ev.b1.go || 'ピヨといっしょに考える')}</button>`;
      } else if (beat === 'p') {
        // 予想：正しいかどうかは言わない。結果のあとで、自分の予想とくらべる
        body = `${talk([['senpai', '考える前に、まず予想してみよう。当たっても外れてもいい。']])}<p class="s-q">${esc(ev.predict.q)}</p><div class="s-opts">${ev.predict.opts.map((o, k) => `<button class="s-opt" data-guess="${k}"><b>${esc(o.t)}</b></button>`).join('')}</div>`;
      } else if (beat === 2) {
        const b2 = ev.b2;
        let field = '';
        if (b2.layout === 'flow') field = flowHTML(b2, sorted);
        else if (isSort(b2)) {
          field = `<div class="s-sort">${b2.tokens.map((t) => `<div class="s-sorti"><span>${esc(t.label)}</span><div>${b2.targets.map((g) => `<button class="s-pill ${sorted[t.id] === g.id ? 'on' : ''}" data-sort="${t.id}" data-to="${g.id}">${esc(g.label)}</button>`).join('')}</div></div>`).join('')}</div>`;
        } else {
          field = `${b2.token ? `<div class="s-token ${picked ? 'placed' : ''}">${esc(b2.token)}</div>` : ''}<div class="s-targets ${b2.layout}">${b2.targets.map((g) => `<button class="s-target ${picked === g.id ? 'on' : ''}" data-pick="${g.id}"><b>${esc(g.label)}</b>${g.sub ? `<small>${esc(g.sub)}</small>` : ''}</button>`).join('')}</div>`;
        }
        const placed = isSort(b2) ? b2.tokens.every((t) => sorted[t.id]) : !!picked;
        body = `${ev.b1.doc ? `<details class="s-redoc"><summary>書類をもう一度見る</summary>${docHTML(ev.b1.doc)}</details>` : ''}<p class="s-q">${esc(b2.q)}</p>${field}${placed ? `${talk([['piyo', 'どうしてそう思ったピヨ？']])}<div class="s-reasons">${b2.reasons.map((r, i) => `<button class="s-reason ${reason === i ? 'on' : ''}" data-reason="${i}">${esc(r.t)}</button>`).join('')}</div>` : ''}<div class="s-hint" ${hintLv ? '' : 'hidden'}>${(b2.hints || []).slice(0, hintLv).map((h) => `<p>${esc(h)}</p>`).join('')}</div><button class="btn wide" data-decide ${placed && reason !== null ? '' : 'disabled'}>これで決める</button><div class="s-actions"><button class="btn ghost sm" data-b="1">← もどる</button>${(b2.hints || []).length > hintLv ? '<button class="btn ghost sm" data-hint>ヒント</button>' : ''}</div>`;
      } else if (beat === 3) {
        const b2 = ev.b2;
        const tgtOk = isSort(b2) ? b2.tokens.every((t) => sorted[t.id] === t.target) : b2.targets.find((g) => g.id === picked).ok;
        const r = b2.reasons[reason];
        if (tgtOk && r.ok) {
          const g = isSort(b2) ? null : b2.targets.find((x) => x.id === picked);
          const pg = ev.predict && guess !== null ? ev.predict.opts[guess] : null;
          const contrast = firstWrong ? `<div class="s-contrast"><div><small>最初に考えたこと</small><p>${esc(firstWrong.what)}</p></div><div><small>いま分かったこと</small><p>${esc(firstWrong.why)}</p></div></div>` : '';
          body = `${g && g.react ? `<p class="s-react">${esc(g.react)}</p>` : ''}<p class="s-result">${esc(ev.b3.ok)}</p>${b2.layout === 'flow' ? flowHTML(b2, sorted, false) : ''}${contrast}${pg ? `<p class="s-guess">あなたの予想：「${esc(pg.t)}」${pg.ok ? '。予想どおりだった' : '。結果とくらべて、どこがちがった？'}</p>` : ''}${ev.b3.bs ? miniBS(ev.b3.bs) : ''}${ev.b3.bars ? barsHTML(ev.b3.bars) : ''}<button class="btn wide" data-b="4">これ、なんて呼ぶの？</button>`;
        } else {
          const why = !tgtOk ? (isSort(b2) ? b2.wrongReact : b2.targets.find((x) => x.id === picked).react) : r.react;
          body = `<p class="s-react ng">${esc(why)}</p><button class="btn wide ghost" data-retry>もう一度えらぶ</button>`;
        }
      } else {
        const b4 = ev.b4;
        // 名前カード：さっき手で動かした図と、帳簿の書き方（仕訳）を並べて、同じことの2つの表し方だと見せる
        const je = nameJE(ev);
        const pair = (ev.b3.bs || je) ? `<div class="s-pair">${ev.b3.bs ? `<div><small>さっき動かした棚</small>${miniBS(ev.b3.bs)}</div>` : ''}${je ? `<div><small>帳簿にはこう書く（たとえば金額が2倍なら）</small>${jeTable(je)}</div>` : ''}</div>` : '';
        // 工場の川：運んだ1回が帳簿の1行（名前を教わってから、科目名で見せる）
        const flowJE = ev.b2.layout === 'flow' ? `<div class="s-pair"><div><small>さっきの運びを、帳簿にはこう書く</small><table class="s-tb"><tr><th>借方</th><th></th><th>貸方</th><th></th></tr>${ev.b2.tokens.filter((t) => t.je).map((t) => `<tr><td>${esc(t.je[0])}</td><td class="n">${fmt(t.je[2])}</td><td>${esc(t.je[1])}</td><td class="n">${fmt(t.je[2])}</td></tr>`).join('')}</table></div></div>` : '';
        body = `<div class="s-name"><small>この考え方の名前</small><h2>${rb(b4.name)}</h2><p>${rb(b4.line)}</p>${pair}${flowJE}<details class="s-exam"><summary>試験では、どんな文章で出る？</summary>${esc(b4.exam)}</details><p class="s-leaf">マップに「${esc(b4.leaf.label)}」が加わった</p></div>${ev.hand ? '<button class="btn wide ghost" data-hand>先輩の手帳で、くわしく読む</button>' : ''}<button class="btn wide" data-done>つぎへ</button>`;
      }
      // 手帳（説明）は名前がついてから読める。考えている途中で答えを見せない
      frame(`<div class="s-card s-disc"><div class="s-disc-head"><h3>${esc(ev.title)}</h3></div>${body}</div>`);
    };
    draw();
    app.onclick = (e) => {
      const g = (s) => e.target.closest(s);
      if (g('[data-hand]')) { m.hand++; metrics.hand++; save(); overlay(`<h3>先輩の手帳</h3><p>${esc(ev.hand)}</p>`); return; }
      if (g('[data-b]')) { const bv = g('[data-b]').dataset.b; beat = bv === 'p' ? 'p' : +bv; if (beat === 4 && !isReplay) teach(ev.b4.teaches); draw(); return; }
      if (g('[data-hint]')) { hintLv++; m.hints = (m.hints || 0) + 1; save(); draw(); return; }
      if (g('[data-guess]')) { guess = +g('[data-guess]').dataset.guess; if (!isReplay) { m.predict = { k: guess, ok: !!ev.predict.opts[guess].ok }; save(); } beat = 2; draw(); return; }
      if (g('[data-pick]')) { picked = g('[data-pick]').dataset.pick; draw(); return; }
      if (g('[data-sort]')) { const x = g('[data-sort]'); sorted[x.dataset.sort] = x.dataset.to; draw(); return; }
      if (g('[data-reason]')) { reason = +g('[data-reason]').dataset.reason; draw(); return; }
      if (g('[data-decide]')) {
        const b2 = ev.b2;
        const tgtOk = isSort(b2) ? b2.tokens.every((t) => sorted[t.id] === t.target) : b2.targets.find((x) => x.id === picked).ok;
        const r = b2.reasons[reason];
        m.tries++;
        if (m.first === null) m.first = !!(tgtOk && r.ok);
        if (!r.ok && r.fork) { m.forks.push(r.fork); metrics.forks[r.fork] = (metrics.forks[r.fork] || 0) + 1; }
        if (!tgtOk) { const f = isSort(b2) ? `${ev.id}:分け方` : (b2.targets.find((x) => x.id === picked).fork || `${ev.id}:${picked}`); m.forks.push(f); metrics.forks[f] = (metrics.forks[f] || 0) + 1; }
        if (!(tgtOk && r.ok) && !firstWrong) {
          const what = isSort(b2) ? `分け方：${b2.tokens.map((t) => `${t.label.split('（')[0]}→${(b2.targets.find((x) => x.id === sorted[t.id]) || {}).label || ''}`).join('、')}` : `「${b2.targets.find((x) => x.id === picked).label}」、理由「${r.t}」`;
          const why = !tgtOk ? (isSort(b2) ? b2.wrongReact : b2.targets.find((x) => x.id === picked).react) : r.react;
          firstWrong = { what, why };
        }
        save(); beat = 3; draw(); return;
      }
      if (g('[data-retry]')) { beat = 2; picked = null; sorted = {}; reason = null; draw(); return; }
      if (g('[data-done]')) {
        if (isReplay) { render(); return; }
        S.discDone[ev.id] = S.mi;
        if (!S.leaves.some((l) => l.label === ev.b4.leaf.label)) S.leaves.push({ p: ev.b4.leaf.p, label: ev.b4.leaf.label, mi: S.mi });
        const qs = discQuiz(ev);
        if (qs.length) quickQuiz(qs, '本試験の文で確かめる', () => { grew('発見のあとの確かめ'); next(); }); else next();
      }
    };
  }

  // 判断：選ぶ前に見られるのは、経理が出せる「すぐ動く数字」（試算）だけ。外の反応や結末は、選んでから返ってくる
  // 判断の画面に来たら、会社の状態を栞にはさむ（バッドエンドから、ここへ戻れる）
  const KEEP = ['leaves', 'taught', 'diary', 'seenEnds', 'ifSeen', 'metrics', 'bm'];
  function snapshot() { const o = {}; for (const [k, v] of Object.entries(S)) if (!KEEP.includes(k)) o[k] = v; return JSON.parse(JSON.stringify(o)); }
  function restore(id) {
    const snap = S.bm[id];
    if (!snap) return false;
    const keep = {}; KEEP.forEach((k) => { keep[k] = S[k]; });
    S = Object.assign(fresh(), JSON.parse(JSON.stringify(snap)), keep);
    S.phase = 'event';
    save(); render();
    return true;
  }
  const trialHTML = (rows) => `<table class="s-tb s-trial">${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n ${typeof v === 'number' && v < 0 ? 'neg' : ''}">${typeof v === 'number' ? fmt(v) + '円' : esc(v)}</td></tr>`).join('')}</table>`;
  function decisionScreen(ev) {
    teach(ev.teaches);
    if (!S.bm[ev.id] || S.bm[ev.id].mi !== S.mi) { S.bm[ev.id] = snapshot(); save(); }
    let pick = null;
    const draw = () => {
      const o = ev.options.find((x) => x.id === pick);
      const trial = o && ev.trial ? `<p class="s-q small">試算（すぐ動く数字）</p>${trialHTML(ev.trial(S, o.id))}` : '';
      frame(`<div class="s-card"><h3>${esc(ev.q)}</h3>${talk(ev.talk)}${o ? `<div class="s-check"><p><b>${esc(o.label)}</b></p>${trial}<p>${esc(o.result)}</p><button class="btn wide" data-yes>これで決める</button><button class="btn wide ghost" data-no>えらび直す</button></div>` : `<div class="s-opts">${ev.options.map((x) => `<button class="s-opt" data-opt="${x.id}"><b>${esc(x.label)}</b><small>${esc(x.desc)}</small>${(S.seenEnds || []).some((id) => D.endings[id] && D.endings[id].back === ev.id) && !x.ending ? '<i class="s-seen">この先の結末を見た</i>' : ''}</button>`).join('')}</div>`}</div>`);
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

  /* ---- バッドエンド：原因→数字→書類→結末→現実では→学び ----
     書類は現実の様式に沿った架空のもの。マーカーをタップすると、何が起きたかの言い直しが出る */
  function docPaper(d) {
    let body = d.body.map((p) => esc(p)).join('</p><p>');
    (d.marks || []).forEach((m, i) => { body = body.split(esc(m.text)).join(`<button class="s-mark" data-mark="${i}">${esc(m.text)}</button>`); });
    return `<div class="s-paper"><div class="s-paper-head"><span>${esc(d.from)} → ${esc(d.to)}</span><span>${esc(d.date)}</span></div><h4>${LX.ruby(esc(d.title))}</h4><p>${LX.ruby(body)}</p><div class="s-plain" hidden></div></div>`;
  }
  function endingScreen(id, view) {
    const E = D.endings[id];
    if (!view && !S.seenEnds.includes(id)) { S.seenEnds.push(id); S.diary.push({ m: month() ? month().label : '', t: `結末：${E.title}` }); save(); }
    if (view && !S.ifSeen.includes(id)) { S.ifSeen.push(id); S.diary.push({ m: 'もしも', t: `もしもを見た：${E.title}` }); save(); }
    S.__ni = pl(balances(S.L)).ni;
    const docs = E.docs(S);
    const steps = ['cause', 'numbers', ...docs.map((_, i) => 'doc' + i), 'scene', 'reality', 'lesson'];
    let i = 0, answered = !E.check, msg = '';
    const draw = () => {
      const st = steps[i];
      let body = '';
      if (st === 'cause') body = `<small>${view ? 'もしも、' : ''}原因</small><p class="s-result">${esc(E.cause(S))}</p>`;
      else if (st === 'numbers') body = `<small>数字</small>${trialHTML(E.numbers(S).rows)}`;
      else if (st.startsWith('doc')) { const d = docs[+st.slice(3)]; body = `<small>届いた書類</small>${docPaper(d)}<p class="muted" style="font-size:13px;margin:0">色のついたところをタップすると、何が起きたかが分かる。</p>`; }
      else if (st === 'scene') body = `<small>そして</small>${talk(E.scene(S))}`;
      else if (st === 'reality') body = `<small>現実では</small><p>${LX.ruby(esc(E.reality))}</p>`;
      else body = `<small>学び</small><p>${LX.ruby(esc(E.lesson))}</p>${E.check ? `<p class="s-q small">${esc(E.check.q)}</p><div class="s-opts">${E.check.opts.map((o, k) => `<button class="s-opt ${answered && o.ok ? 'on' : ''}" data-chk="${k}"><b>${esc(o.t)}</b></button>`).join('')}</div>${msg}` : ''}`;
      const last = i === steps.length - 1 && answered;
      // 振り返りの3段目：判断したときに分かっていた数字（試算）を、選択肢ごとにもう一度見せる。どこで何を変えるかを考えてから栞へ
      if (last && !view && S.bm[E.back]) {
        const dev = (allEvents.find(({ e }) => e.t === 'decision' && e.id === E.back) || {}).e;
        if (dev && dev.trial) {
          const snapS = Object.assign(fresh(), JSON.parse(JSON.stringify(S.bm[E.back])));
          body += `<div class="s-why"><p><b>もう一度やるなら：「${esc(dev.q)}」のとき分かっていた数字</b></p>${dev.options.map((o) => `<p class="small"><b>${esc(o.label)}</b></p>${trialHTML(dev.trial(snapS, o.id))}`).join('')}<p class="muted">結末を知る前でも、この数字は見えていた。どこで何を変える？</p></div>`;
        }
      }
      const btns = i === steps.length - 1 && !answered ? '' : !last ? '<button class="btn wide" data-en>つぎへ</button>' : view ? '<button class="btn wide" data-back-view>もどる</button>'
        : `${S.bm[E.back] ? `<button class="btn wide" data-bm>栞（しおり）にもどる：その判断のところから</button>` : ''}${E.final ? `<button class="btn wide ghost" data-restart>${E.level === '重' && E.closes !== false ? '会社をたたんで、最初から' : '最初からやり直す'}</button>` : '<button class="btn wide ghost" data-cont>このまま続ける</button>'}`;
      frame(`<div class="s-card s-ending ${E.level === '重' ? 'heavy' : ''}"><div class="s-disc-head"><small>${view ? 'もしも' : E.level === '重' ? '結末' : '警告'}</small><h3>${esc(E.title)}</h3></div>${body}${btns}${i > 0 ? '<button class="btn ghost sm" data-enback>← もどる</button>' : ''}</div>`);
    };
    draw();
    app.onclick = (e) => {
      const m = e.target.closest('[data-mark]');
      if (m) { const d = docs[+steps[i].slice(3)]; const pl_ = $('.s-plain', app); pl_.hidden = false; pl_.textContent = d.marks[+m.dataset.mark].plain; return; }
      const ck = e.target.closest('[data-chk]');
      if (ck) { const o = E.check.opts[+ck.dataset.chk]; if (o.ok) { answered = true; msg = '<p class="s-react">そのとおり。</p>'; } else msg = `<p class="s-react ng">${esc(o.react)}</p>`; draw(); return; }
      if (e.target.closest('[data-en]')) { i++; draw(); return; }
      if (e.target.closest('[data-enback]')) { i--; draw(); return; }
      if (e.target.closest('[data-back-view]')) { render(); return; }
      if (e.target.closest('[data-bm]')) { restore(E.back); return; }
      if (e.target.closest('[data-cont]')) { next(); return; }
      if (e.target.closest('[data-restart]')) { const keep = { leaves: S.leaves, taught: S.taught, diary: S.diary, seenEnds: S.seenEnds, ifSeen: S.ifSeen }; S = Object.assign(fresh(), keep); S.phase = 'monthIntro'; S.mi = 1; save(); render(); }
    };
  }
  // 事後のもしも：正しく選んだ人も、選ばなかった道の結末を見に行ける（会社の状態は動かない）
  function ifOnlyList() {
    const out = [];
    for (const m of D.months) for (const ev of m.events) {
      if (ev.t !== 'decision' || !S.decisions[ev.id]) continue;
      const o = ev.options.find((x) => x.id === S.decisions[ev.id]);
      ev.options.flatMap((x) => x.ending || []).forEach((id) => { if (!S.seenEnds.includes(id) && !out.some((x) => x.id === id)) out.push({ id, q: ev.q, alt: ev.options.filter((x) => !x.ending).map((x) => x.label).join('／') }); });
    }
    return out;
  }
  function ifOnlyScreen() {
    const list = ifOnlyList();
    frame(`<div class="s-card"><small>1年のふりかえり</small><h3>もしも、あのとき…</h3>${talk([['senpai', 'あの判断で、ちがう道を選んでいたら何が起きていたか。見ておくと、なぜ今の処理が必要だったかが分かるよ。']])}${list.length ? `<div class="s-opts">${list.map((x) => `<button class="s-opt" data-if="${x.id}"><b>${esc(D.endings[x.id].title)}</b><small>${esc(x.q)} → もし「${esc(x.alt)}」を選んでいたら</small>${S.ifSeen.includes(x.id) ? '<i class="s-seen">見た</i>' : ''}</button>`).join('')}</div>` : '<p class="muted">見に行ける「もしも」はない。</p>'}<button class="btn wide" data-n>つぎへ</button></div>`);
    app.onclick = (e) => {
      const b = e.target.closest('[data-if]');
      if (b) { endingScreen(b.dataset.if, true); return; }
      if (e.target.closest('[data-n]')) next();
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
  // 月末の締めの前に、今月の口座のお金がどうなったかを予想する（当たり外れは数ではなく、実際と並べて見せる）
  const cashBefore = () => cashOf(balances(S.L.filter((x) => x.mi < S.mi)));
  function predictClose(done) {
    S.predicts = S.predicts || {};
    if (S.mi < 2 || S.predicts[S.mi]) return done();
    const before = cashBefore();
    frame(`<div class="s-card"><small>${esc(month().label)}の締めの前に</small>${talk([['senpai', `先月の終わり、口座のお金は ${fmt(before)} だった。今月の終わりは、どうなっていると思う？ 見直しの前に予想してみよう。`]])}<div class="s-opts">${[['up', '増えた'], ['down', 'へった'], ['flat', 'ほとんど変わらない']].map(([k, t]) => `<button class="s-opt" data-pc="${k}"><b>${t}</b></button>`).join('')}</div></div>`);
    app.onclick = (e) => { const b = e.target.closest('[data-pc]'); if (!b) return; S.predicts[S.mi] = { g: b.dataset.pc, before }; save(); done(); };
  }
  function predictLine(bu) {
    const pr = (S.predicts || {})[S.mi];
    if (!pr) return '';
    const d = cashOf(bu) - pr.before, act = Math.abs(d) <= Math.max(2000, Math.abs(pr.before) * 0.03) ? 'flat' : d > 0 ? 'up' : 'down';
    const W = { up: '増えた', down: 'へった', flat: 'ほとんど変わらない' };
    pr.act = act; pr.ok = act === pr.g;
    return `<p class="s-guess">予想「${W[pr.g]}」→ 実際「${W[act]}」（${d >= 0 ? '+' : '−'}${fmt(Math.abs(d))}）${pr.ok ? '' : '。何が予想とちがった？'}</p>`;
  }
  function closeScreen() {
    if (!(S.predicts || {})[S.mi] && S.mi >= 2) return predictClose(closeScreen);
    const bu = balances(S.L), bt = balances(S.T);
    const diff = [...new Set([...Object.keys(bu), ...Object.keys(bt)])].filter((a) => (bu[a] || 0) !== (bt[a] || 0));
    if (!diff.length) {
      const p = pl(bu);
      const note = knows('収益') && p.ni < 0 && (bu['仕入'] || 0) > 0 && !bu['繰越商品'] ? '<p class="muted" style="font-size:13px;margin:0">仕入れた商品は、売れ残りも全部「仕入」（費用）に入れている。売れ残りを資産に戻すのは1年の終わりだから、それまでは、もうけが小さく見える。</p>' : '';
      frame(`<div class="s-card"><small>${esc(month().label)}の見直し</small><h3>帳簿と書類が、ぜんぶ合った</h3>${miniBS(bsFrom(bu))}<p style="margin:0">口座のお金 <b>${fmt(cashOf(bu))}</b>${knows('収益') ? `　この1年のもうけ <b>${fmt(p.ni)}</b>` : ''}</p>${predictLine(bu)}${note}<button class="btn wide" data-next>${S.mi + 1 < D.months.length ? '次の月へ' : 'つぎへ'}</button></div>`);
      app.onclick = (e) => { if (e.target.closest('[data-next]')) { S.closes.push({ mi: S.mi, fixed: S.fixLog.some((f) => f.mi === S.mi) }); grew('月末の締め'); advanceMonth(); } };
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
    const b = balances(preClose(S.L)), p = pl(b);
    const assets = Object.entries(b).filter(([a, v]) => v && (cat(a) === '資産' || CONTRA.has(a)));
    const ta = assets.reduce((t, [, v]) => t + v, 0);
    const eq = Object.entries(b).filter(([a]) => cat(a) === '純資産').reduce((t, [, v]) => t - v, 0) + p.ni;
    return { b, p, ta, eq };
  }
  // 決算書を自分で組む：自分の帳簿の残高を札にして、決算書の4つの箱へ運ぶ（本試験の第3問と同じ部品）
  function buildScreen(ev, done) {
    const b = balances(S.L);
    const cards = Object.entries(b).filter(([, v]) => v).map(([a, v]) => ({ a, v: Math.abs(v), to: CONTRA.has(a) || cat(a) === '資産' ? 'A' : cat(a) === '負債' || cat(a) === '純資産' ? 'R' : cat(a) === '収益' ? 'I' : 'E' })).sort((x, y) => order(x.a) - order(y.a));
    // 名前（貸借対照表・損益計算書）は、組み終わってから教える
    const T1 = knows('貸借対照表') ? '貸借対照表' : '1年の終わりの棚の絵', T2 = knows('損益計算書') ? '損益計算書' : '1年のもうけの中身';
    const BOX = { A: `${T1}の左（${gw('資産')}）`, R: `${T1}の右（${gw('負債')}・${gw('純資産')}）`, I: `${T2}（${gw('収益')}）`, E: `${T2}（${gw('費用')}）` };
    const put = {}; let msg = '', step = 'cards', miss = 0;
    const sum = (k) => cards.filter((c) => put[c.a] === k).reduce((t, c) => t + (CONTRA.has(c.a) ? -c.v : c.v), 0);
    const draw = () => {
      const left = cards.filter((c) => !put[c.a]);
      let body;
      if (step === 'cards') {
        body = `${talk([['kansa', '1年の終わりの帳簿の残高を、決算書の箱へ運ぼう。1枚ずつ、どの箱か選んでね。']])}${left.slice(0, 1).map((c) => `<div class="s-sorti"><span><b>${esc(c.a)}</b> ${fmt(c.v)}${CONTRA.has(c.a) ? '（マイナスの札）' : ''}</span><div class="s-boxbtns">${Object.entries(BOX).map(([k, t]) => `<button class="s-pill" data-box="${k}" data-acc="${esc(c.a)}">${esc(t)}</button>`).join('')}</div></div>`).join('')}${msg ? `<p class="s-react ng">${esc(msg)}</p>` : ''}<p class="muted" style="font-size:12px">のこり ${left.length} 枚</p>`;
        if (!left.length) step = 'join';
      }
      if (step === 'join') {
        const ni = sum('I') - sum('E');
        body = `<div class="s-two"><div><small>${esc(BOX.A)}</small><b>${fmt(sum('A'))}</b></div><div><small>${esc(BOX.R)}</small><b>${fmt(sum('R'))}</b></div></div><div class="s-two"><div><small>${esc(BOX.I)}</small><b>${fmt(sum('I'))}</b></div><div><small>${esc(BOX.E)}</small><b>${fmt(sum('E'))}</b></div></div>${talk([['kansa', `${T1}の左と右が ${fmt(Math.abs(sum('A') - sum('R')))} ずれているね。${T2}で分かった1年のもうけ ${fmt(ni)} は、どこへ行く？`]])}<div class="s-opts"><button class="s-opt" data-join="R"><b>${esc(T1)}の右（${esc(gw('純資産'))}）に足す</b></button><button class="s-opt" data-join="A"><b>${esc(T1)}の左（${esc(gw('資産'))}）に足す</b></button><button class="s-opt" data-join="none"><b>${esc(T1)}には入れない</b></button></div>${msg ? `<p class="s-react ng">${esc(msg)}</p>` : ''}`;
      }
      frame(`<div class="s-card"><small>決算書を組む</small>${body}</div>`);
    };
    draw();
    app.onclick = (e) => {
      const bx = e.target.closest('[data-box]');
      if (bx) {
        const c = cards.find((x) => x.a === bx.dataset.acc);
        if (bx.dataset.box === c.to) { put[c.a] = c.to; msg = ''; }
        else { miss++; msg = c.to === 'A' && CONTRA.has(c.a) ? `${c.a}は、${gw('資産')}の箱の中でマイナスとして置く札だよ。` : `この札は ${cat(c.a)} の札。${cat(c.a) === '収益' || cat(c.a) === '費用' ? '1年のもうけの中身を見せる箱' : '1年の終わりの棚の絵の箱'}のどちら側？`; }
        draw(); return;
      }
      const j = e.target.closest('[data-join]');
      if (j) {
        if (j.dataset.join !== 'R') { miss++; msg = j.dataset.join === 'A' ? `もうけは、会社が自分でふやした「${gw('純資産')}」。右の側だよ。` : `入れないと、左と右がそろわない。もうけは${gw('純資産')}をふやしている。`; draw(); return; }
        S.metrics.build = { miss }; save(); done();
      }
    };
  }
  function reportScreen(ev) {
    if (!ev.redo && !(S.metrics.build)) return buildScreen(ev, () => reportScreen(ev));
    teach(ev.teaches);
    const { b } = statements();
    S.reportSeen = true; save();
    frame(`<div class="s-card"><small>${ev.redo ? '作り直した決算書' : `${yearOf(S.mi)}年目の決算書`}</small><div class="s-name"><p>1年の終わりの棚の絵を「貸借対照表」、1年のもうけの中身を「損益計算書」、2つあわせて「決算書」という。銀行や株主は、これを見て会社を判断する。</p></div>${companyView(b)}<button class="btn wide" data-n>${yearOf(S.mi) === 1 ? '銀行へ持っていく' : 'つぎへ'}</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-n]')) { S.diary.push({ m: '決算', t: `${yearOf(S.mi)}年目のもうけ ${fmt(statements().p.ni)}円` }); next(); } };
  }
  // 締め切り（簿記一巡）：収益と費用の札を「損益」の箱に集め、差（1年のもうけ）を繰越利益剰余金へ運ぶ。
  // 来年のノートは収益・費用が0から始まり、もうけは純資産の中に残る（docs/YEAR2.md 2.1-B）
  const closingEntries = (entries, mi) => {
    const b = balances(entries), rev = [], exp = [];
    for (const [a, v] of Object.entries(b)) { if (!v) continue; if (cat(a) === '収益') rev.push([a, -v]); else if (cat(a) === '費用') exp.push([a, v]); }
    const R = rev.reduce((t, [, v]) => t + v, 0), X = exp.reduce((t, [, v]) => t + v, 0), ni = R - X, y = yearOf(mi);
    const out = [];
    if (rev.length) out.push({ dr: rev, cr: [['損益', R]] });
    if (exp.length) out.push({ dr: [['損益', X]], cr: exp });
    if (ni > 0) out.push({ dr: [['損益', ni]], cr: [['繰越利益剰余金', ni]] }); else if (ni < 0) out.push({ dr: [['繰越利益剰余金', -ni]], cr: [['損益', -ni]] });
    return out.map((e, k) => Object.assign(e, { id: `closing${k}@${mi}`, mi, y, ev: 'closing', closing: true }));
  };
  function closingScreen(ev) {
    if (S.discDone[ev.id] != null) return next();
    const b = balances(S.L);
    const cards = Object.entries(b).filter(([a, v]) => v && (cat(a) === '収益' || cat(a) === '費用')).map(([a, v]) => ({ a, v: Math.abs(v), side: cat(a) === '収益' ? 'R' : 'L' })).sort((x, y) => order(x.a) - order(y.a));
    const moved = new Set(); let step = 'move', msg = '', miss = 0;
    const R = cards.filter((c) => c.side === 'R').reduce((t, c) => t + c.v, 0), X = cards.filter((c) => c.side === 'L').reduce((t, c) => t + c.v, 0), ni = R - X;
    const kuri = knows('繰越利益剰余金') ? '繰越利益剰余金' : 'これまでのもうけの貯まり';
    const tbox = () => `<table class="s-tb s-tacc"><tr><th colspan="2">${knows('損益') ? '損益' : '1年のもうけを集める箱'}</th></tr><tr><td>${cards.filter((c) => c.side === 'L' && moved.has(c.a)).map((c) => `${esc(c.a)} ${fmt(c.v)}`).join('<br>') || '　'}</td><td>${cards.filter((c) => c.side === 'R' && moved.has(c.a)).map((c) => `${esc(c.a)} ${fmt(c.v)}`).join('<br>') || '　'}</td></tr></table>`;
    const draw = () => {
      let body;
      const left = cards.filter((c) => !moved.has(c.a));
      if (step === 'move') {
        body = `${talk([['senpai', moved.size ? '収益の札は箱の右、費用の札は箱の左に入る。' : `1年が終わった。来年のノートを、${gw('収益')}と${gw('費用')}が0の状態から始めたい。今年の札を、1つの箱に集めよう。`]])}${tbox()}${left.length ? `<div class="s-sorti"><span><b>${esc(left[0].a)}</b> ${fmt(left[0].v)}（${gw(cat(left[0].a))}）</span><div><button class="s-pill" data-cl="${esc(left[0].a)}">箱へ運ぶ</button></div></div>${moved.size >= 2 && left.length > 1 ? `<button class="link" data-clall>残りの ${left.length} 枚も同じように運ぶ</button>` : ''}` : ''}<p class="muted" style="font-size:12px">のこり ${left.length} 枚</p>`;
        if (!left.length) step = 'ask';
      }
      if (step === 'ask') {
        body = `${tbox()}<p class="s-dyn">箱の右 ${fmt(R)} − 左 ${fmt(X)} ＝ ${fmt(ni)}（1年のもうけ）</p>${talk([['senpai', `箱の右と左の差 ${fmt(ni)} が残った。この差は、どこへ運ぶ？`]])}<div class="s-opts"><button class="s-opt" data-ca="re"><b>${esc(gw('純資産'))}の「${esc(kuri)}」へ</b></button><button class="s-opt" data-ca="cap"><b>${esc(gw('純資産'))}の「資本金」へ</b></button><button class="s-opt" data-ca="cash"><b>普通預金へ</b></button></div>${msg ? `<p class="s-react ng">${esc(msg)}</p>` : ''}`;
      }
      if (step === 'name') {
        body = `<div class="s-name"><small>この書き方の名前</small><h2>${rb('損益・繰越利益剰余金・締め切り')}</h2><p>${rb('1年の終わりに、収益と費用の札を「損益」の箱に集め、差の「当期純利益」を純資産の「繰越利益剰余金」へ移す。これを「締め切り」（決算振替）という。来年のノートは、収益と費用が0から始まる。')}</p><details class="s-exam"><summary>試験では、どんな文章で出る？</summary>${esc('「損益勘定で算定した当期純利益を、繰越利益剰余金勘定に振り替える」')}</details><p class="s-leaf">マップに「締め切り」が加わった</p></div><button class="btn wide" data-cdone>つぎへ</button>`;
      }
      frame(`<div class="s-card"><small>1年の締め切り</small>${body}</div>`);
    };
    draw();
    app.onclick = (e) => {
      const c = e.target.closest('[data-cl]');
      if (c) { moved.add(c.dataset.cl); draw(); return; }
      if (e.target.closest('[data-clall]')) { cards.forEach((x) => moved.add(x.a)); draw(); return; }
      const a = e.target.closest('[data-ca]');
      if (a) {
        if (a.dataset.ca !== 're') { miss++; msg = a.dataset.ca === 'cap' ? '資本金は、株主が出したお金の札。会社が自分でかせいだもうけは、別の札に貯める。' : 'もうけは、お金の形で残っているとは限らない。売掛金やトラックになっているかもしれない。もうけが増やしたのは、返さないお金のほう。'; draw(); return; }
        step = 'name'; msg = ''; draw(); return;
      }
      if (e.target.closest('[data-cdone]')) {
        teach(['損益', '繰越利益剰余金', '締め切り', '当期純利益', '決算振替']);
        const mi = S.mi;
        S.L = S.L.filter((x) => !(x.closing && x.mi === mi)).concat(closingEntries(S.L, mi));
        S.T = S.T.filter((x) => !(x.closing && x.mi === mi)).concat(closingEntries(S.T, mi));
        S.discDone[ev.id] = mi; S.metrics.disc[ev.id] = { first: miss === 0, forks: [] };
        if (!S.leaves.some((l) => l.label === '締め切り')) S.leaves.push({ p: 'P2', label: '締め切り', mi });
        S.diary.push({ m: month().label, t: `締め切り：1年のもうけ ${fmt(ni)}円を繰越利益剰余金へ` });
        S.carry = S.carry || {}; S.carry[`y${yearOf(mi)}`] = Object.assign(S.carry[`y${yearOf(mi)}`] || {}, { ni });
        grew('締め切り');
        next();
      }
    };
  }
  // 開始記入：去年の終わりの棚（資産・負債・純資産）を、今年のノートの1行目に書き写す（docs/YEAR2.md 2.1-C）。
  // 帳簿は年をまたいで続いているので、新しい仕訳は作らない。画面で「何が引き継がれ、何が0から始まるか」を確かめる
  function openingScreen(ev) {
    if (S.discDone[ev.id] != null) return next();
    const b = balances(S.L);
    const cards = Object.entries(b).filter(([a, v]) => v && (cat(a) === '資産' || cat(a) === '負債' || cat(a) === '純資産' || CONTRA.has(a))).map(([a, v]) => ({ a, v: Math.abs(v), to: cat(a) === '資産' && !CONTRA.has(a) ? 'L' : 'R' })).sort((x, y) => order(x.a) - order(y.a));
    const put = {}; let msg = '', miss = 0, done = false;
    const col = (k) => cards.filter((c) => put[c.a] === k).map((c) => `${esc(c.a)} ${fmt(c.v)}`).join('<br>') || '　';
    const draw = () => {
      const left = cards.filter((c) => !put[c.a]);
      const body = done
        ? `<div class="s-name"><small>この書き方の名前</small><h2>${rb('前期繰越・開始記入')}</h2><p>${rb('去年の終わりの資産・負債・純資産は、そのまま今年のはじめの姿になる。今年のノートの1行目に「前期繰越」として書き写すことを「開始記入」という。収益と費用は締め切りで0になったので、書き写さない。')}</p><details class="s-exam"><summary>試験では、どんな文章で出る？</summary>${esc('「各勘定の前期繰越を記入し、開始記入を行う」')}</details><p class="s-leaf">マップに「前期繰越」が加わった</p></div><button class="btn wide" data-odone>2年目をはじめる</button>`
        : `${talk([['senpai', '2年目の朝だ。去年の終わりの棚を、今年のノートの1行目に写そう。左の列と右の列、どちらに書く？']])}<table class="s-tb s-tacc"><tr><th>今年のノートの1行目（左）</th><th>（右）</th></tr><tr><td>${col('L')}</td><td>${col('R')}</td></tr></table>${left.length ? `<div class="s-sorti"><span><b>${esc(left[0].a)}</b> ${fmt(left[0].v)}${CONTRA.has(left[0].a) ? '（マイナスの札）' : ''}</span><div><button class="s-pill" data-op="L">左の列</button><button class="s-pill" data-op="R">右の列</button></div></div>` : `${talk([['senpai', `左も右も ${fmt(cards.filter((c) => c.to === 'L').reduce((t, c) => t + c.v, 0))}。去年の売上や給料は、写さなくていいのかな？`]])}<div class="s-opts"><button class="s-opt" data-oq="ok"><b>写さない。締め切りで0になって、もうけは繰越利益剰余金に入っている</b></button><button class="s-opt" data-oq="ng"><b>写す。去年の売上も、今年の売上に足す</b></button></div>`}${msg ? `<p class="s-react ng">${esc(msg)}</p>` : ''}<p class="muted" style="font-size:12px">のこり ${left.length} 枚</p>`;
      frame(`<div class="s-card"><small>${esc(month().label)} 1日</small>${body}</div>`);
    };
    draw();
    app.onclick = (e) => {
      const o = e.target.closest('[data-op]');
      if (o) { const c = cards.find((x) => !put[x.a]); if (o.dataset.op === c.to) { put[c.a] = c.to; msg = ''; } else { miss++; msg = CONTRA.has(c.a) ? `${c.a}はマイナスの札。資産から引くので、去年の仕訳でも右に書いていたね。` : c.to === 'L' ? '資産は、増えたら左に書いた。はじめの残りも左。' : '負債と純資産は、増えたら右に書いた。はじめの残りも右。'; } draw(); return; }
      const q = e.target.closest('[data-oq]');
      if (q) { if (q.dataset.oq === 'ok') { done = true; msg = ''; } else { miss++; msg = '去年の売上を今年に足すと、今年のもうけが去年の分まで大きく見えてしまう。去年のもうけは、もう繰越利益剰余金の中にある。'; } draw(); return; }
      if (e.target.closest('[data-odone]')) {
        teach(['前期繰越', '開始記入']);
        S.discDone[ev.id] = S.mi; S.metrics.disc[ev.id] = { first: miss === 0, forks: [] };
        if (!S.leaves.some((l) => l.label === '前期繰越')) S.leaves.push({ p: 'P1', label: '前期繰越', mi: S.mi });
        grew('開始記入'); next();
      }
    };
  }
  // 精算表（docs/YEAR2.md 3.3）：整理前の試算表と整理記入は自分の帳簿から自動で埋まる。
  // プレイヤーは各行の整理後の残高を、損益計算書か貸借対照表へ運ぶ。最後に10桁から8桁（検定会場の形）へ折りたたむ
  function sheetScreen(ev) {
    if (S.discDone[ev.id] != null) return next();
    const y = yearOf(S.mi);
    const deskMi = D.months.findIndex((m, i) => (m.year || 1) === y && m.seg === 'desk');
    const pre = balances(S.L.filter((e) => e.mi < deskMi)), adj = { dr: {}, cr: {} };
    S.L.filter((e) => e.mi >= deskMi && e.mi <= S.mi && !e.closing).forEach((e) => { e.dr.forEach(([a, v]) => { adj.dr[a] = (adj.dr[a] || 0) + v; }); e.cr.forEach(([a, v]) => { adj.cr[a] = (adj.cr[a] || 0) + v; }); });
    const accs = [...new Set([...Object.keys(pre), ...Object.keys(adj.dr), ...Object.keys(adj.cr)])].filter((a) => pre[a] || adj.dr[a] || adj.cr[a]).sort((x, z) => order(x) - order(z));
    const rows = accs.map((a) => { const after = (pre[a] || 0) + (adj.dr[a] || 0) - (adj.cr[a] || 0); return { a, pre: pre[a] || 0, adr: adj.dr[a] || 0, acr: adj.cr[a] || 0, after, to: cat(a) === '収益' || cat(a) === '費用' ? 'PL' : 'BS' }; }).filter((r) => r.pre || r.adr || r.acr || r.after);
    const put = {}; let step = 'rows', msg = '', miss = 0, eight = false;
    const plR = () => rows.filter((r) => r.to === 'PL'), ni = -plR().reduce((t, r) => t + r.after, 0);
    const n = (v) => (v ? fmt(v) : '');
    const table = () => `<div class="s-sheetwrap"><table class="s-tb s-sheet"><tr><th rowspan="2">勘定科目</th><th colspan="2">試算表</th><th colspan="2">整理記入</th>${eight ? '' : '<th colspan="2">整理後</th>'}<th colspan="2">損益計算書</th><th colspan="2">貸借対照表</th></tr><tr>${'<th>借方</th><th>貸方</th>'.repeat(eight ? 4 : 5)}</tr>${rows.map((r) => `<tr class="${put[r.a] ? '' : 'todo'}"><td>${esc(r.a)}</td><td class="n">${n(Math.max(0, r.pre))}</td><td class="n">${n(Math.max(0, -r.pre))}</td><td class="n">${n(r.adr)}</td><td class="n">${n(r.acr)}</td>${eight ? '' : `<td class="n">${n(Math.max(0, r.after))}</td><td class="n">${n(Math.max(0, -r.after))}</td>`}${['PL', 'BS'].map((k) => put[r.a] === k ? `<td class="n">${n(Math.max(0, r.after))}</td><td class="n">${n(Math.max(0, -r.after))}</td>` : '<td></td><td></td>').join('')}</tr>`).join('')}${step !== 'rows' && step !== 'ni' ? `<tr><td>当期純利益</td><td></td><td></td><td></td><td></td>${eight ? '' : '<td></td><td></td>'}<td class="n">${n(Math.max(0, ni))}</td><td class="n">${n(Math.max(0, -ni))}</td><td class="n">${n(Math.max(0, -ni))}</td><td class="n">${n(Math.max(0, ni))}</td></tr>` : ''}</table></div>`;
    const draw = () => {
      const left = rows.filter((r) => !put[r.a]);
      let body = '';
      if (step === 'rows') {
        const r = left[0];
        body = `${talk([['kansa', '1年の締めを、1枚の表にしよう。左から、整理する前の残り・決算で直した額・整理したあとの残り。整理したあとの残りを、損益計算書か貸借対照表へ運んで。']])}${table()}<div class="s-sorti"><span><b>${esc(r.a)}</b> ${fmt(Math.abs(r.after))}</span><div><button class="s-pill" data-sh="PL">損益計算書へ</button><button class="s-pill" data-sh="BS">貸借対照表へ</button></div></div>${Object.keys(put).length >= 4 && left.length > 1 ? `<button class="link" data-shall>残りの ${left.length} 行も同じように運ぶ</button>` : ''}${msg ? `<p class="s-react ng">${esc(msg)}</p>` : ''}`;
      } else if (step === 'ni') {
        body = `${table()}<p class="s-dyn">損益計算書の右と左の差：${fmt(ni)}（当期純利益）</p>${talk([['kansa', 'この差を、貸借対照表のどちら側に書けば、左右がそろう？']])}<div class="s-opts"><button class="s-opt" data-ni="R"><b>貸借対照表の右（純資産が増える）</b></button><button class="s-opt" data-ni="L"><b>貸借対照表の左</b></button></div>${msg ? `<p class="s-react ng">${esc(msg)}</p>` : ''}`;
      } else if (step === 'fold') {
        body = `${table()}${talk([['kansa', '左右がそろった。検定会場の精算表は、まん中の「整理後」の2列がない8桁の形。たたんでみよう。']])}<button class="btn wide" data-fold>8桁にたたむ</button>`;
      } else {
        body = `${table()}<div class="s-name"><small>この表の名前</small><h2>${rb('精算表')}</h2><p>${rb('整理する前の試算表から、決算で直した額（整理記入）を足し引きして、損益計算書と貸借対照表を1枚で作る表を「精算表」という。損益計算書の差（当期純利益）が、貸借対照表の右に入って左右がそろう。')}</p><details class="s-exam"><summary>試験では、どんな文章で出る？</summary>${esc('「次の決算整理事項にもとづいて、精算表を完成しなさい」')}</details><p class="s-leaf">マップに「精算表」が加わった</p></div><button class="btn wide" data-shdone>つぎへ</button>`;
      }
      frame(`<div class="s-card"><small>精算表</small>${body}</div>`);
    };
    draw();
    app.onclick = (e) => {
      const b = e.target.closest('[data-sh]');
      if (b) { const r = rows.find((x) => !put[x.a]); if (b.dataset.sh === r.to) { put[r.a] = r.to; msg = ''; } else { miss++; msg = r.to === 'PL' ? `${r.a}は${gw(cat(r.a))}。1年のもうけの中身を見せる表へ。` : `${r.a}は1年の終わりに残っているもの・約束。終わりの姿を見せる表へ。`; } if (!rows.some((x) => !put[x.a])) step = 'ni'; draw(); return; }
      if (e.target.closest('[data-shall]')) { rows.forEach((r) => { put[r.a] = r.to; }); step = 'ni'; draw(); return; }
      const q = e.target.closest('[data-ni]');
      if (q) { if (q.dataset.ni === 'R') { step = 'fold'; msg = ''; } else { miss++; msg = 'もうけは、返さないお金（純資産）を増やす。貸借対照表の右だ。'; } draw(); return; }
      if (e.target.closest('[data-fold]')) { eight = true; step = 'name'; draw(); return; }
      if (e.target.closest('[data-shdone]')) {
        teach(['精算表', '整理記入', '決算整理', '試算表']);
        S.discDone[ev.id] = S.mi; S.metrics.disc[ev.id] = { first: miss === 0, forks: [] };
        if (!S.leaves.some((l) => l.label === '精算表')) S.leaves.push({ p: 'P3', label: '精算表', mi: S.mi });
        grew('精算表'); next();
      }
    };
  }
  // 銀行の見方：1年の判断と、帳簿の正しさで決まる（乱数なし）
  function bankRating() {
    const d = S.decisions;
    let r = 3;
    if (d.crunch === 'nothing') r -= 1;
    if (d.kessan === 'follow') r -= 2;
    if (d.credit === 'credit') r -= 1;
    // 直した回数では減らさない（直すのは良いこと）。書類と合わない数字が決算書に残ったときだけ減らす
    if (ledgerGap().length) r -= 1;
    return Math.max(0, Math.min(4, r));
  }
  // 自分の帳簿（S.L）と、書類どおりの帳簿（S.T）で残高がちがう科目
  function ledgerGap() {
    const u = balances(S.L), t = balances(S.T);
    return [...new Set([...Object.keys(u), ...Object.keys(t)])].filter((a) => (u[a] || 0) !== (t[a] || 0));
  }
  const RATING = ['とても心配', '心配', '少し心配', 'ふつう', '安心'];
  function bankScreen() {
    const { p, ta, eq } = statements();
    const d = S.decisions, ratio = Math.round((eq / ta) * 100), r = bankRating();
    const lines = [];
    lines.push(['ginko', `1年目のもうけは${p.ni.toLocaleString()}円。資産のうち、返さなくていいお金（純資産）でまかなっている割合は${ratio}%ですね。`]);
    if (d.kessan === 'follow') lines.push(['ginko', 'トラックの減価償却費が、ありませんね。今年のもうけは、そのぶん大きく見えています。当行では、もうけを直して判断します。それと…決算書の作り方を、説明していただく必要があります。']);
    else if (d.dep === 'rate') lines.push(['ginko', 'トラックを最初に多く費用にしているのは、慎重な会社という印象です。そのぶん今年のもうけは小さく見えますが、来年からは軽くなります。']);
    else lines.push(['ginko', 'トラックを毎年同じ額ずつ費用にしているので、来年からのもうけの見通しが立てやすいですね。']);
    if (d.crunch === 'loan') lines.push(['ginko', '11月のお金不足は、うちからの借入で乗り切りましたね。お礼（利息）は、D社のお金を待つための費用でした。']);
    else if (d.crunch === 'discount') lines.push(['ginko', '11月はD社にまけて早く払ってもらいましたね。1万円の値引きも、お金を早く手に入れるための費用です。']);
    else lines.push(['ginko', '11月末にE社への支払いが遅れたことは、当行も把握しています。急ぎのご融資の利息は、1年で15％でした。支払いを遅らせた会社には、慎重にならざるを得ません。']);
    if (d.credit === 'credit') lines.push(['ginko', 'A社の件で、もらえない見込みを貸倒引当金にしたのは誠実です。ただ、支払いが遅れている噂のある相手に掛けで売ったのは、心配な点ですね。']);
    else if (d.credit === 'cash') lines.push(['ginko', 'A社に、すぐ払ってもらう取引を求めたのは、いい判断でした。']);
    else lines.push(['ginko', 'A社との取引を見送ったのは慎重でしたね。']);
    if (d.volume === '3m') lines.push(['ginko', '倉庫の在庫が多いですね。まとめて払ったお金が、まだレモンのまま眠っています。']);
    if (d.recon === 'align') lines.push(['ginko', 'B社の注文が半分になったのは、帳簿のまちがいからだったと聞きました。帳簿は、お客さんとの信頼にもつながっています。']);
    if (d.uncle === 'equity') lines.push(['ginko', 'おじさまが株主になって、返さなくていいお金が厚くなりましたね。株主が3人になったぶん、もうけの分け方は3人で決めることになります。']);
    else if (d.uncle === 'loan') lines.push(['ginko', 'おじさまからの10万円は借入で、3月にお返しになったのですね。返す約束を守ったことは確認しました。']);
    if (ledgerGap().length) lines.push(['ginko', `決算書に、書類と合わない数字が残っています（${ledgerGap().slice(0, 3).join('・')}）。毎月の締めで直しておけば、ここで困らずに済みました。`]);
    const offer = r >= 3 ? Math.max(100000, Math.round((eq * 0.8) / 10000) * 10000) : r === 2 ? Math.round((eq * 0.4) / 10000) * 10000 : 0;
    lines.push(['ginko', offer ? `2号店のために、${offer.toLocaleString()}円までお貸しできます。` : '申し訳ありませんが、2号店のためのご融資は、今はお受けできません。']);
    S.carry = Object.assign(S.carry || {}, { [`y${yearOf(S.mi)}`]: { offer, rating: r, ni: p.ni, ratio } });
    S.diary.push({ m: '翌年4月', t: offer ? `銀行（見方：${RATING[r]}）：2号店のために ${fmt(offer)}円まで借りられる` : `銀行（見方：${RATING[r]}）：2号店のための融資を断られた` });
    // 1画面に1つの発言。最後に銀行の見方
    let k = 0;
    // 銀行の見方は、数ではなく田中さんの表情と、返さなくていいお金の割合（会社の体力）の帯で見せる
    const face = `<svg class="s-face" viewBox="0 0 64 64" role="img" aria-label="田中さんの表情：${RATING[r]}"><circle cx="32" cy="32" r="28" fill="hsl(222 60% 92%)" stroke="hsl(222 40% 50%)" stroke-width="2"/><circle cx="23" cy="27" r="3" fill="#334"/><circle cx="41" cy="27" r="3" fill="#334"/><path d="M20 ${44 - (r - 2) * 3} Q32 ${44 + (r - 2) * 5} 44 ${44 - (r - 2) * 3}" fill="none" stroke="#334" stroke-width="3" stroke-linecap="round"/></svg>`;
    const stamina = knows('純資産') ? `<div class="s-stamina"><small>会社の体力（資産のうち、返さなくていいお金でまかなっている割合）</small><div class="s-gbar"><span class="lv2" style="flex:${Math.max(0, ratio)}"></span><span class="lv0" style="flex:${Math.max(0, 100 - ratio)}"></span></div><b>${ratio}%</b></div>` : '';
    const draw = () => frame(`<div class="s-card"><small>翌年4月 みらい銀行の審査（${k + 1}/${lines.length}）</small>${talk([lines[k]])}${k === lines.length - 1 ? `<div class="s-bankview">${face}<p class="s-dyn">銀行の見方：<b>${RATING[r]}</b></p></div>${stamina}` : ''}<button class="btn wide" data-n>つぎへ</button></div>`);
    draw();
    app.onclick = (e) => { if (e.target.closest('[data-n]')) { if (k < lines.length - 1) { k++; draw(); } else next(); } };
  }
  // 腕だめし：体験した論点のうち、教わった言葉だけで読める本試験形式の問題を選ぶ
  function pickQuiz() {
    const taught = new Set(S.taught);
    // 2級の論点を先に、3級の土台はあとに。1つの章から2問まで
    const items = B.scope.filter((it) => scopeState(it).met != null).sort((x, y) => (x.base ? 1 : 0) - (y.base ? 1 : 0));
    const byKey = Object.fromEntries(B.chapters.flatMap((c) => c.qs.map((q, k) => [`${c.id}:${k}`, q])));
    const readable = (q) => q && q.type === 'journal' && !(S.mode !== '2026' && B.outdated27(q)) && !B.outOfScope2(q) && !/上記|前問/.test(q.q) && !LX.unknown(q.q, taught).length && [...q.ans.dr, ...q.ans.cr].every(([a]) => taught.has(a));
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
        grew('腕だめし');
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
  function endScreen(ev) {
    const M = S.metrics;
    const endY = (ev && ev.y) || yearOf(S.mi);
    const st = statements(), b = st.b;
    // 翌年4月（次の年の月）で振り返るときは、締め切りのときに残した、その年のもうけを使う
    const p = endY === yearOf(S.mi) ? st.p : { ni: ((S.carry || {})[`y${endY}`] || {}).ni || 0 };
    const disc = Object.entries(M.disc);
    const firstOk = disc.filter(([, d]) => d.first).length;
    const mins = Math.round((Date.now() - M.started) / 60000);
    const forks = Object.entries(M.forks).sort((a, c) => c[1] - a[1]);
    frame(`<div class="s-card"><small>1年のふりかえり</small><h3>${endY}年目、おつかれさま</h3><p>${endY === 1 ? '屋台の小銭2,000円から始まった会社は、1年で' : `${endY}年目の1年で、会社は`}もうけ <b>${fmt(p.ni)}円</b>、口座のお金 <b>${fmt(cashOf(b))}円</b> になった。</p><h4>あなたが決めたこと</h4><ul class="s-diary">${S.diary.map((d) => `<li><b>${esc(d.m)}</b> ${esc(d.t)}</li>`).join('')}</ul><button class="btn wide ghost" data-ov="map">マップで、見つけた考え方を見る</button><details class="s-devlog"><summary>開発用の記録</summary><table class="s-tb"><tr><td>考える場面で、1回目から正しくたどり着いた</td><td class="n">${firstOk} / ${disc.length}</td></tr><tr><td>先輩の手帳を開いた回数</td><td class="n">${M.hand}</td></tr><tr><td>書類の記帳で、1回目から正しかった</td><td class="n">${M.docs.first} / ${M.docs.n}</td></tr><tr><td>月末に直した回数</td><td class="n">${M.fixes}</td></tr><tr><td>ヒントを見た回数</td><td class="n">${M.hints}</td></tr><tr><td>自動仕訳で進んだ書類</td><td class="n">${M.autoPosted}</td></tr><tr><td>腕だめし</td><td class="n">${M.quiz ? `${M.quiz.score} / ${M.quiz.of}` : '-'}</td></tr><tr><td>予想が当たった（発見の前・月末の締めの前）</td><td class="n">${disc.filter(([, d]) => d.predict && d.predict.ok).length} / ${disc.filter(([, d]) => d.predict).length}・${Object.values(S.predicts || {}).filter((x) => x.ok).length} / ${Object.values(S.predicts || {}).filter((x) => x.act).length}</td></tr><tr><td>ヒントなしで1回目から正しく書けた書類</td><td class="n">${S.docLog.filter((l) => l.ok && !l.hint).length} / ${S.docLog.length}</td></tr><tr><td>月はじめの思い出し</td><td class="n">${(S.recall || []).filter((r) => r.ok).length} / ${(S.recall || []).filter((r) => !r.due).length}</td></tr><tr><td>決算の机（1回目で全部見つけた）</td><td class="n">${S.metrics.desk ? (S.metrics.desk.first ? 'はい' : 'いいえ') : '-'}</td></tr><tr><td>かかった時間</td><td class="n">${mins}分</td></tr></table>${forks.length ? `<p>迷ったところ</p><ul class="s-diary">${forks.map(([f, n]) => `<li>${esc(f)} <b>${n}</b></li>`).join('')}</ul>` : ''}</details>${month() && D.months[S.mi + 1] ? `<button class="btn wide" data-n>${endY + 1}年目へ進む</button>` : ''}<button class="btn wide ghost" data-again>最初からもう一度</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-n]')) { next(); return; } if (e.target.closest('[data-again]')) { S = fresh(); S.phase = 'monthIntro'; save(); render(); } };
  }

  B.chapters.forEach((c) => c.qs.forEach((q, i) => { q._key = `${c.id}:${i}`; }));
  window.__sim = { get S() { return S; }, balances, events, render, mastered, testForms };
  if (/[?&]test\b/.test(location.search)) testScreen(); else render();
  // 公開ページとして開かれていれば、ページの保存機能につなぐ。別の端末の新しい続きがあれば読み込む
  const bootAt = Date.now();
  const pulled = (st) => { if (Date.now() - bootAt > 20000 && !document.querySelector('.s-title')) return; S = Object.assign(fresh(), st); render(); };
  ST.connect(KEY, pulled);
  ST.onStatus(() => { const w = document.querySelector('[data-saveword]'); if (w) w.textContent = saveWord(); });
})();
