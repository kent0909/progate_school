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
  const CAST = { piyo: ['ピヨ', 48], haha: ['お母さん', 330], esha: ['E社の担当者', 100], senpai: ['タカシ先輩', 205], shacho: ['ミライ社長', 24], eigyo: ['ハルカ（営業）', 12], ginko: ['田中さん（銀行）', 222], kansa: ['森さん（会計士）', 150], zeirishi: ['岩田さん（税理士）', 285], kabunushi: ['佐藤さん（株主）', 330], kojo: ['大山さん（工場長）', 60], oyakata: ['屋台の親方', 30] };
  // ラーメン版（ramen.html。DESIGN-RAMEN l.2）は台本（SIMDATA）が ramen:true を持ち、保存の鍵も別にする。index.html のピヨ商店はそのまま
  const RAMEN = !!D.ramen;
  // ラーメン版の画面（js/ramen/ui.js：作戦の机・一杯の組み立て・月報・ふりかえり・分かれ道の図・地図・口座の帯・3段の枠）。ピヨ商店では null
  const RUI = RAMEN && D.ramenUI ? D.ramenUI : null;
  const KEY = D.key || 'boki2sim.v3';
  // 屋号とプレイヤーの名前（ラーメン版。自由入力で lexicon-check の外。既定は「麺や ピヨ」「あなた」）
  const PROFILE0 = { shopName: '麺や ピヨ', playerName: 'あなた' };

  /* ---------- state ---------- */
  const fresh = () => ({ v: 3, bm: {}, seenEnds: [], ifSeen: [], mi: 0, ei: 0, phase: 'title', L: [], T: [], decisions: {}, rules: {}, kinds: {}, leaves: [], diary: [], trapHit: false, taught: [], silentIntro: false, ruleIntro: false,
    discDone: {}, docLog: [], fixLog: [], closes: [], examLog: [], reportSeen: false, profile: { ...PROFILE0 },
    metrics: { started: Date.now(), disc: {}, docs: { n: 0, first: 0 }, fixes: 0, hints: 0, hand: 0, autoPosted: 0, quiz: null, forks: {} } });
  let S = fresh();
  let RECALL = null;
  // 保存は store.js：端末の中にすぐ、公開ページの保存機能にも少し遅らせて（docs/STORAGE.md）
  const ST = B.store;
  // ラーメン版は保存の v4（store.js の ST.v4：meta はスロットで共有、run はスロットごと。セーブスロット3つ）。ピヨ商店は v3 のまま
  const V4 = ST.v4;
  let DOC = null;
  const fromDoc = (d, slot) => Object.assign(fresh(), V4.compose(d, slot));
  const loadS = () => { if (RAMEN) { DOC = V4.load(KEY, 'boki2sim.v3'); return fromDoc(DOC); } const raw = ST.loadLocal(KEY); return raw ? Object.assign(fresh(), raw) : fresh(); };
  // やり直し：ラーメン版は周（run）だけ新しく、学びの記録（meta）は残す
  const freshKeep = () => { const o = fresh(); if (RAMEN) for (const k of V4.META) if (S[k] !== undefined) o[k] = S[k]; if (RAMEN) o.__slot = S.__slot; return o; };
  const slotLabel = () => `${shopName()}・${(month() || {}).label || 'おわり'}`;
  S = loadS();
  // 保存の文書（端末・クラウド・ファイル）から S を作る。ラーメン版は v4 の文書（v3 のファイルなら学びの記録だけ写す）
  const fromSaved = (st) => { if (!RAMEN) return Object.assign(fresh(), st); DOC = V4.isV4(st) ? st : V4.fromV3(st); return fromDoc(DOC); };
  const save = () => { if (RAMEN) { DOC = V4.split(DOC, S, slotLabel()); S.bm=DOC.slots.find(sl=>sl.id===DOC.cur).run.bm; ST.save(KEY, DOC); } else ST.save(KEY, S); };
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
    // 工場の途中の箱（賃金・製造間接費・差異など「その他」の札）は、増えた・へったでは言えない。どちらの側に書いたかで言う
    if (c === 'その他') return `${acc}に、${side === 'dr' ? '借方（左）' : '貸方（右）'}で ${fmt(amt)} 書いた`;
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
  // 表情：銀行・株主・会計士・税理士は、これまでの判断で顔が変わる（year2.js の SIM.moods。1〜5）
  const MOOD_WORD = ['', 'とても心配', '心配', 'ふつう', '少し安心', '安心'];
  const moodOf = (k) => { if (!D.moods || S.mi === 0) return 0; try { return D.moods(S)[k] || 0; } catch (x) { return 0; } };
  const avatar = (k) => { const [n, h] = k === 'me' ? [playerName(), 190] : CAST[k] || [k, 190]; const md = moodOf(k); const mouth = md ? `<svg class="s-mood" viewBox="0 0 20 20" role="img" aria-label="表情：${MOOD_WORD[md]}"><circle cx="10" cy="10" r="9" fill="#fff" stroke="hsl(${h} 40% 45%)" stroke-width="1.5"/><circle cx="7" cy="8" r="1.3" fill="#334"/><circle cx="13" cy="8" r="1.3" fill="#334"/><path d="M6 ${14 - (md - 3)} Q10 ${14 + (md - 3) * 1.6} 14 ${14 - (md - 3)}" fill="none" stroke="#334" stroke-width="1.4" stroke-linecap="round"/></svg>` : ''; return `<span class="s-ava" style="--h:${h}">${esc(n.slice(0, 1))}${mouth}</span>`; };
  // 台詞の {店}・{名} は、遊ぶ人が決めた屋号と名前（ラーメン版）に置きかえる
  const shopName = () => ((S.profile || {}).shopName || PROFILE0.shopName);
  const playerName = () => ((S.profile || {}).playerName || PROFILE0.playerName);
  const fill = (t) => String(t == null ? '' : t).replace(/\{店\}/g, shopName()).replace(/\{名\}/g, playerName());
  const talk = (lines) => (lines || []).map(([k, t]) => `<div class="s-line">${avatar(k)}<div><small>${esc(k === 'me' ? playerName() : (CAST[k] || [k])[0])}</small><p>${esc(fill(t))}</p></div></div>`).join('');
  // 書類だけの言葉（摘要など）は、タップすると一言の説明が出る
  const gloss = (text) => {
    let h = esc(text);
    for (const w of Object.keys(LX.docWords).sort((a, b) => b.length - a.length)) { const ew = esc(w); if (h.includes(ew)) { h = h.split(ew).join(`<button class="s-gl" data-gl="${ew}">${ew}</button>`); break; } }
    return h;
  };
  function docHTML(doc0, tappable) {
    if (!doc0) return '';
    // ラーメン版：書類の相手・題名の {店}・{名} は、遊ぶ人が決めた屋号と名前
    const doc = RAMEN ? { ...doc0, from: fill(doc0.from), to: fill(doc0.to), title: fill(doc0.title) } : doc0;
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
  // 間違えたときの返し（オーナーの決定 2026-10-21）：「ここが違う」の一言と誤りの型（短く）、自分の答えの違う行に印、正しい形と並べる
  function missHTML(entry, truth, lead) {
    const inT = (sd, a) => truth[sd].some(([x]) => x === a);
    const same = (sd, a, v) => truth[sd].some(([x, y]) => x === a && y === v);
    const kinds = new Set(), other = { dr: 'cr', cr: 'dr' };
    if (!entry.dr.length && !entry.cr.length) kinds.add('空欄');
    const mark = (sd, a, v) => { if (same(sd, a, v)) return ''; if (inT(sd, a)) { kinds.add('金額が違う'); return '金額'; } if (inT(other[sd], a)) { kinds.add('左右が逆'); return '左右'; } kinds.add('札が違う'); return '札'; };
    const rowsOf = (sd) => entry[sd].map(([a, v]) => ({ a, v, m: mark(sd, a, v) }));
    const d = rowsOf('dr'), c = rowsOf('cr');
    if (truth.dr.length + truth.cr.length > entry.dr.length + entry.cr.length && entry.dr.length + entry.cr.length) kinds.add('行が足りない');
    const n = Math.max(d.length, c.length, 1);
    let r = '';
    for (let i = 0; i < n; i++) { const x = d[i], y = c[i]; const cell = (o) => (o ? `<td class="${o.m ? 'ng' : ''}">${o.m ? '✗ ' : ''}${esc(o.a)}</td><td class="n ${o.m ? 'ng' : ''}">${fmt(o.v)}</td>` : '<td></td><td></td>'); r += `<tr>${cell(x)}${cell(y)}</tr>`; }
    const mine = `<table class="s-je mine"><tr><th colspan="2">借方（左）</th><th colspan="2">貸方（右）</th></tr>${r}</table>`;
    return `<p class="s-react ng">ここが違う：${esc([...kinds].join('・') || '組み合わせ')}</p><div class="s-pair"><div><small>あなたの答え（✗ の行が違う）</small>${mine}</div><div><small>${esc(lead)}</small>${jeTable(truth)}</div></div>`;
  }
  function jeTable(e) {
    const n = Math.max(e.dr.length, e.cr.length);
    let r = '';
    for (let i = 0; i < n; i++) { const d = e.dr[i] || ['', ''], c = e.cr[i] || ['', '']; r += `<tr><td>${esc(d[0])}</td><td class="n">${d[1] === '' ? '' : fmt(d[1])}</td><td>${esc(c[0])}</td><td class="n">${c[1] === '' ? '' : fmt(c[1])}</td></tr>`; }
    return `<table class="s-je"><tr><th colspan="2">借方（左）</th><th colspan="2">貸方（右）</th></tr>${r}</table>`;
  }

  /* ---------- header ---------- */
  const app = document.getElementById('sim');
  function header(headerYear) {
    const displayYear=headerYear||yearOf(S.mi);
    const b=balances(headerYear?S.L:preClose(S.L)),p=headerYear?pl(balances(S.L.filter(e=>(e.y||yearOf(e.mi))===headerYear&&!e.closing))):pl(b);
    const m = month();
    const inShop = S.mi > 0;
    // 月末の予想の間は、答えになる数字（口座のお金・もうけ）を隠す
    const hideKpi = !!S.__predicting;
    // 預かった消費税に線を引いた会社（判断 vat）は、口座のお金のうち預かり分を見せる
    const azu = S.decisions.vat === 'line' && knows('仮受消費税') ? Math.max(0, -(b['仮受消費税'] || 0) - (b['仮払消費税'] || 0)) : 0;
    const kpi = inShop && hideKpi ? '<div class="s-kpi"><small>口座のお金</small><b>予想のあとで</b></div>' : inShop ? `<div class="s-kpi"><small>口座のお金</small><b class="${cashOf(b) < 0 ? 'neg' : ''}">${fmt(cashOf(b))}</b>${azu ? `<small class="s-azu">うち預かり ${fmt(azu)}</small>` : ''}</div>${knows('収益') ? `<div class="s-kpi"><small>${displayYear > 1 ? `${displayYear}年目のもうけ（4月から）` : 'この1年のもうけ'}</small><b class="${p.ni < 0 ? 'neg' : ''}">${fmt(p.ni)}</b></div>` : ''}${Object.keys(S.rules).length ? `<div class="s-kpi"><small>自動で書く書類</small><b>${Object.keys(S.rules).length}種類</b></div>` : ''}` : '';
    const nav = inShop ? '<nav class="s-nav"><button data-ov="co">会社の棚</button><button data-ov="map">マップ</button><button data-ov="grow">成長</button><button data-ov="log">日誌</button>' + (S.dueBuilt ? '<button data-ov="due">期日</button>' : '') + '<button data-ov="room">練習室</button>' + (RAMEN ? '<button data-ov="title">スロット</button>' : '') + '</nav>' : '';
    // 「本文へ」：キーボードで最初に届く。ナビより先に画面の中身へ（見えるのはフォーカスしたときだけ）
    return `<header class="s-head"><button class="s-skip" data-skiplink>本文へ</button><div class="s-month"><small>${esc(RAMEN ? (inShop ? shopName() : `${shopName()}（屋台）`) : inShop ? '株式会社ピヨ商店' : 'ピヨの屋台')}</small><b>${m ? esc(m.label) : ''}</b></div>${kpi}${nav}</header>`;
  }
  let onFocus = null;
  app.addEventListener('focusin', (e) => { const x = e.target.closest('input[data-s]'); if (x && onFocus) onFocus(x); });
  // 文字の大きさ（2回目の検査 access・uiux：ゲームの中に設定がなかった）。画面は rem で組んであるので、根の大きさを変える
  function applyScale() { const z = S.textScale || 100; document.documentElement.style.fontSize = z !== 100 ? `${z}%` : ''; document.documentElement.classList.toggle('s-big', z > 100); }
  // 金額の入力欄の横に、3桁区切りと「〇万」を映す（2回目の検査 access：自分が打った数だけカンマがなく、60万か6万か見分けられない）。入力そのものは半角の数字のまま
  function amtHint(inp) {
    let o = inp.nextElementSibling && inp.nextElementSibling.classList && inp.nextElementSibling.classList.contains('s-amth') ? inp.nextElementSibling : null;
    const v = Number(String(inp.value || '').normalize('NFKC').replace(/[^\d]/g, ''));
    if (!v || v < 1000) { if (o) o.textContent = ''; return; }
    if (!o) { o = document.createElement('small'); o.className = 's-amth'; o.setAttribute('aria-live', 'polite'); inp.after(o); }
    const man = v >= 10000 ? `（${(v / 10000).toLocaleString('ja-JP', { maximumFractionDigits: 4 })}万）` : '';
    o.textContent = `${v.toLocaleString('ja-JP')}${man}`;
  }
  app.addEventListener('input', (e) => { if (e.target.matches && e.target.matches('input[inputmode="numeric"]')) amtHint(e.target); }, true);
  // 読み上げで区別できない部品を直す（2回目の検査 uiux・lowvision：同じ名前のボタンが並ぶ・選んだ状態が伝わらない）
  // ・同じ文字のボタンが2つ以上あれば、その行（表の行・並びの行・練習室の項目など）の見出しを前につけた名前にする
  // ・選んだ印（.on）のボタンに aria-pressed、選択肢の並び（.s-opts）に role=group
  function a11yNames(root) {
    const btns = [...root.querySelectorAll('button, [role="button"]')];
    const txt = (b) => (b.getAttribute('aria-label') || b.textContent || '').replace(/\s+/g, ' ').trim();
    const count = {}; btns.forEach((b) => { const t = txt(b); count[t] = (count[t] || 0) + 1; });
    for (const b of btns) {
      if (b.classList.contains('on') && !b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', 'true');
      if (count[txt(b)] < 2 || b.hasAttribute('aria-label')) continue;
      const row = b.closest('tr, .s-sorti, .s-row, .s-room-it, li, .s-doc-card, .s-card-doc, [data-rowlabel]');
      let head = row && (row.getAttribute('data-rowlabel') || (row.querySelector('th, td:first-child, b, span, small') || {}).textContent || '');
      head = String(head || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      if (head && head !== txt(b)) b.setAttribute('aria-label', `${head}：${txt(b)}`);
    }
    root.querySelectorAll('.s-opts').forEach((g) => { if (!g.hasAttribute('role')) g.setAttribute('role', 'group'); });
  }
  // 焦点の管理（2回目の検査 lowvision P1：押すたびに焦点が消え、Tab がページの頭からやり直しになった）。
  // キーボードで操作しているときだけ、描き直しのあとに焦点を戻す：同じ部品（同じ data-* の組）があればそこへ、なければ本文の最初の押せる所へ
  let kbUser = false;
  document.addEventListener('keydown', (e) => { if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ' || e.key.startsWith('Arrow')) kbUser = true; }, true);
  document.addEventListener('pointerdown', () => { kbUser = false; }, true);
  const focusKey = (el) => (el && el.attributes ? [el.tagName, ...[...el.attributes].filter((a) => a.name.startsWith('data-') || a.name === 'name').map((a) => `${a.name}=${a.value}`)].join('|') : '');
  function frame(body, headerYear) {
    if(headerYear==null&&RAMEN&&!month())headerYear=D.months[D.months.length-1].year||1;
    const was = document.activeElement, key = kbUser && was && app.contains(was) && was !== app ? focusKey(was) : null, scrolled = window.scrollY;
    onFocus = null; app.oninput = null; app.onkeydown = null;
    const shell = RUI && RUI.on();
    app.classList.toggle('r-shell', !!shell);
    app.innerHTML = shell ? RUI.shell(body, headerYear) : header(headerYear) + `<main class="s-main" id="s-main" tabindex="-1">${body}</main>`;
    a11yNames(app);
    if (shell) RUI.afterFrame();
    $$('input[inputmode="numeric"]', app).forEach(amtHint);
    if (key) {
      const same = [...app.querySelectorAll('button, [role="button"], input, select, textarea, a[href]')].find((x) => focusKey(x) === key && !x.disabled);
      const main = $('#s-main', app), first = main && main.querySelector('button:not([disabled]):not([hidden]), [role="button"], input:not([disabled]), select:not([disabled])');
      const to = same || first || main;
      if (to) { to.focus({ preventScroll: true }); if (same) { window.scrollTo(0, scrolled); return; } }
    }
    window.scrollTo(0, 0);
  }
  app.addEventListener('click', (e) => { if (e.target.closest('[data-skiplink]')) { const m = $('#s-main', app); if (m) m.focus(); } }, true);

  /* ---------- overlays ---------- */
  function overlay(html) {
    const o = document.createElement('div');
    o.className = 's-ov';
    o.innerHTML = `<div class="s-sheet" role="dialog" aria-modal="true" tabindex="-1">${html}<button class="btn wide ghost" data-close>とじる</button></div>`;
    // 開いたら窓に、閉じたら開く前の場所にフォーカスを戻す。Esc で閉じる
    const back = document.activeElement;
    const close = () => { o.remove(); if (back && back.isConnected && back.focus) back.focus({ preventScroll: true }); };
    o.addEventListener('click', (e) => { if (e.target === o || e.target.closest('[data-close]')) close(); });
    o.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
    document.body.appendChild(o);
    o.firstElementChild.focus({ preventScroll: true });
    return o;
  }
  // 工場の途中の箱（製造間接費・賃金・差異など「その他」の札）は、借方の残りなら資産の側、貸方の残りなら負債の側に見せる（合計がそろうように）
  const isOther = (a) => cat(a) === 'その他' && !CONTRA.has(a) && a !== '損益';
  function companyView(b) {
    const rows = (pred) => Object.entries(b).filter(([a, v]) => v && pred(a, v)).map(([a, v]) => [a, v]);
    const assets0 = rows((a, v) => cat(a) === '資産' || CONTRA.has(a) || (isOther(a) && v > 0));
    // マイナスの札は、引く相手（売掛金・車両運搬具など）のすぐ下に置く（決算書の控除形式）
    const assets = assets0.filter(([a]) => !CONTRA.has(a) || !assets0.some(([x]) => x === CONTRA_OF[a]));
    assets0.filter(([a]) => CONTRA.has(a) && assets0.some(([x]) => x === CONTRA_OF[a])).forEach((c) => { const k = assets.findIndex(([x]) => x === CONTRA_OF[c[0]]); assets.splice(k + 1, 0, c); });
    const liab = rows((a, v) => cat(a) === '負債' || (isOther(a) && v < 0)).map(([a, v]) => [a, -v]);
    const eq = rows((a) => cat(a) === '純資産').map(([a, v]) => [a, -v]);
    const p = pl(b);
    // 仕掛品の箱には、工場の瓶と教室のテキスト（役務の途中）の両方が入る。勘定は1つのまま、内訳を添える
    const svcWip = S.L.filter((e) => e.kind === 'service_cost').reduce((t, e) => t + e.dr.reduce((x, [a, v]) => x + (a === '仕掛品' ? v : 0), 0) - e.cr.reduce((x, [a, v]) => x + (a === '仕掛品' ? v : 0), 0), 0);
    const note = (a, v) => (a === '仕掛品' && svcWip > 0 && svcWip < v ? `<small class="s-sub">うち教室のテキスト ${fmt(svcWip)}・工場の瓶 ${fmt(v - svcWip)}</small>` : a === '仕掛品' && svcWip > 0 && svcWip === v ? '<small class="s-sub">教室のテキスト（まだ終わっていない回の分）</small>' : '');
    const showN = (a) => (knows('貸借対照表') && B.kubun && B.kubun.show[a] && !['仕入', '売上', '役務収益'].includes(a) ? `${B.kubun.show[a]}` : a);
    const tbl = (list) => list.map(([a, v]) => `<tr><td>${CONTRA.has(a) ? '　− ' : ''}${esc(showN(a))}${note(a, v)}</td><td class="n">${fmt(CONTRA.has(a) ? -v : v)}</td></tr>`).join('');
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
    if (k === 'title') { document.querySelectorAll('.s-ov').forEach((o) => o.remove()); save(); titleScreen(); return; }
    if (k === 'co') coOverlay();
    if (k === 'map') mapOverlay();
    if (k === 'grow') overlay(B.growth.view(GAPI));
    if (k === 'hall') { document.querySelectorAll('.s-ov').forEach((o) => o.remove()); hallScreen(); return; }
    if (k === 'room') { document.querySelectorAll('.s-ov').forEach((o) => o.remove()); practiceScreen(); return; }
    if (k === 'due') overlay(`<h3>払う約束・もらう約束の期日（資金繰り）</h3><p class="muted" style="font-size:13px;margin:0">これからの口座の出入りを、期日の順に。いまの口座のお金から、1行ずつ足し引きした残り。</p>${dueTable(dueItems())}`);
    if (k === 'log') overlay(`<h3>経営日誌</h3>${S.diary.length ? `<ul class="s-diary">${S.diary.map((d) => `<li><b>${esc(d.m)}</b> ${esc(d.t)}</li>`).join('')}</ul>` : '<p class="muted">まだ記録はない。</p>'}`);
  });
  // 会社の棚：棚の絵と、元帳（勘定ごとに、日付・摘要・相手の札・残高）
  function ledgerView(acc) {
    const rows = [];
    let bal = 0;
    const plus = cat(acc) === '資産' || cat(acc) === '費用';
    // 元帳は日付の順（月、その月の書類の順）。月末に直した行も、もとの書類の位置に並べる。締め切りの行はその月の最後
    const pos = (x) => { const k = allEvents.findIndex(({ e, mi }) => e.id === x.ev && mi === x.mi); return x.mi * 1e5 + (k < 0 ? 99999 : k); };
    for (const x of [...S.L].sort((a, b) => pos(a) - pos(b))) {
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
    const holders = D.holders ? D.holders(S) : [];
    const o = overlay(`<div class="s-maptabs"><button data-cotab="bs">棚の絵</button>${accs.length ? '<button data-cotab="gl">元帳</button>' : ''}${knows('株主') && holders.length ? '<button data-cotab="sh">株主</button>' : ''}</div><div class="s-cobody"></div>`);
    let acc = accs[0];
    const paint = () => {
      $$('[data-cotab]', o).forEach((x) => x.classList.toggle('on', x.dataset.cotab === tab));
      const all = holders.reduce((t, [, n]) => t + n, 0);
      $('.s-cobody', o).innerHTML = tab === 'bs' ? companyView(b) : tab === 'sh' ? `<h3>株主の一覧</h3><div class="s-scrollx"><table class="s-tb"><tr><th>株主</th><th>株数</th><th>1株の値段</th><th>割合（増資の前→あと）</th></tr>${holders.map(([nm, n, p, pre]) => `<tr><td>${esc(nm)}</td><td class="n">${fmt(n)}株</td><td class="n">${p ? `${fmt(p)}円` : '—'}</td><td class="n">${pre != null ? `${pre}%→` : ''}${Math.round((n / all) * 1000) / 10}%</td></tr>`).join('')}<tr class="sum"><td>合計</td><td class="n">${fmt(all)}株</td><td></td><td></td></tr></table></div><p class="muted" style="font-size:13px">株主総会では、1株に1票（議決権）。株主がみな出席したとき、半分より多くの株を持つ株主は、取締役を選ぶ・替えるなど多くのことを決められる。定款を変えるなど特に大事なことは、3分の2以上が要る。配当は、株数に応じて分ける。</p>` : `<p class="muted" style="font-size:12px">札ごとに、いつ・何の書類で・相手の札は何で動いたかが並ぶ。あとから森さんや銀行が「この日に何があったの？」と読むための記録。</p><div class="s-maptabs">${accs.map((a) => `<button data-glacc="${esc(a)}" class="${a === acc ? 'on' : ''}">${esc(a)}</button>`).join('')}</div><div class="s-scrollx">${ledgerView(acc)}</div>`;
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
  // 受験する年度（出題区分表）。選んでいなければ今日の日付で決める：2027年3月31日までは2026年度の区分表、4月1日からは2027年度
  const modeOf = () => S.mode || (Date.now() < Date.parse('2027-04-01T00:00:00+09:00') ? '2026' : '2027');
  // 試験範囲の項目の名前（2026年度の試験では旧基準の名前があるものは name26）
  // 章ごとの試験範囲の項目の数（scopeState で、章の問題をどの項目のものとして数えるか）
  const CH_SOLO = (B.scope || []).reduce((o, it) => { if (it.ch) o[it.ch] = (o[it.ch] || 0) + 1; return o; }, {});
  const sname = (it) => (modeOf() === '2026' && it.name26) || it.name;
  const MODE_TXT = { 2026: '2026年度（2027年3月までの試験）', 2027: '2027年度（2027年4月からの試験）' };
  // ---- 3級既習の近道（docs/DESIGN-PRO3-ISSUE.md 設計1） ----
  function pro3Ask(done) {
    app.innerHTML = `<main class="s-main"><div class="s-card"><small>はじめる前に（2つめ）</small><h3>日商簿記3級の仕訳は、もう書ける？</h3><p>掛けの仕入・売上、給料、減価償却、貸倒引当金のような3級の仕訳のこと。「書ける」なら、短い確かめを3問。合った型の書類はパソコンが自動で書く（近道）。2級の出来事と、社長の判断は、近道でも全部ある。あとからタイトルで切れる。</p><button class="btn wide" data-p3="yes">書ける（3級に合格した・勉強した）</button><button class="btn wide ghost" data-p3="no">まだ</button><button class="btn wide ghost" data-p3="no">わからない</button></div></main>`;
    app.onclick = (e) => { const b = e.target.closest('[data-p3]'); if (!b) return; if (b.dataset.p3 === 'yes') return gateScreen(done); S.pro3 = { on: false }; save(); done(); };
  }
  // 近道の切符：3級の仕訳を3問。合った問の型だけ自動仕訳に入れる（記録は成長の記録に入れない。測定ではないため）
  function gateScreen(done) {
    const G = D.pro3.gate, res = [];
    let i = 0;
    const draw = () => {
      if (i >= G.length) {
        const ok = res.filter(Boolean).length;
        if (ok < 2) { S.pro3 = { on: false, gate: res }; save(); app.innerHTML = `<main class="s-main"><div class="s-card"><h3>今回は、ふつうの道がおすすめ</h3><p>3問のうち ${ok} 問が書けた。屋台から始めて、3級の型も手で書いてみよう。思い出すのは早いはず。</p><button class="btn wide" data-go2>屋台から始める</button></div></main>`; app.onclick = (e) => { if (e.target.closest('[data-go2]')) done(); }; return; }
        applyPro3(G.filter((_, k) => res[k]).flatMap((g) => g.kinds), res);
        const rules = Object.keys(S.rules).filter((k) => S.rules[k].preset);
        app.innerHTML = `<main class="s-main"><div class="s-card"><small>近道</small><h3>3問のうち ${ok} 問が書けた</h3>${D.pro3.card.map((t) => `<p>${esc(t)}</p>`).join('')}<p><b>パソコンが自動で書く書類（3級の型）</b></p><ul>${rules.map((k) => `<li>${esc(D.rules[k].conds.find((c) => c.ok && !c.broad).t)}</li>`).join('')}</ul><p class="muted">自動で書いた分は、成長の記録で「3級の型（見ただけ）」。検定会場の「自動仕訳の棚卸」や練習室で手で書けたら「自分でできた」になる。</p><button class="btn wide" data-go2>${RAMEN ? "屋台へ行く" : "会社へ行く（4月から）"}</button></div></main>`;
        app.onclick = (e) => { if (e.target.closest('[data-go2]')) done(); };
        return;
      }
      const g = G[i], opt = `<option value="">札をえらぶ</option>${g.opts.map((a) => `<option>${esc(a)}</option>`).join('')}`;
      const side = (sd) => `<div class="s-row"><select data-s="${sd}" aria-label="${sd === 'dr' ? '借方' : '貸方'}の札">${opt}</select><input data-s="${sd}" inputmode="numeric" placeholder="金額" aria-label="${sd === 'dr' ? '借方' : '貸方'}の金額"></div>`;
      app.innerHTML = `<main class="s-main"><div class="s-card"><small>近道の確かめ ${i + 1} / ${G.length}（ヒントなし）</small><p class="s-q">${esc(g.q)}</p><div class="s-entry"><div class="s-cols"><div class="s-side dr"><h4>借方（左）</h4>${side('dr')}</div><div class="s-side cr"><h4>貸方（右）</h4>${side('cr')}</div></div></div><div data-res></div><button class="btn wide" data-gq>答える</button></div></main>`;
      app.onclick = (e) => {
        if (e.target.closest('[data-gn]')) { i++; draw(); return; }
        if (!e.target.closest('[data-gq]')) return;
        const entry = { dr: [], cr: [] };
        for (const sd of ['dr', 'cr']) { const x = $(`select[data-s="${sd}"]`, app), v = Number(($(`input[data-s="${sd}"]`, app).value || '').normalize('NFKC').replace(/[^\d]/g, '')); if (x.value && v) entry[sd].push([x.value, v]); }
        const ok = !!(entry.dr.length && entry.cr.length && sameEntry(entry, g.ans));
        res.push(ok);
        $('[data-res]', app).innerHTML = `${ok ? '<p class="s-react">書けた</p>' : missHTML(entry, g.ans, '正しくは')}<button class="btn wide" data-gn>つぎへ</button>`;
        $('[data-gq]', app).remove();
      };
    };
    draw();
  }
  function applyPro3(kinds, res) {
    teach(D.pro3.words);
    for (const k of kinds) if (D.rules[k] && !S.rules[k]) S.rules[k] = { cond: D.rules[k].conds.find((c) => c.ok && !c.broad).t, broad: false, at: 0, preset: true };
    S.introSeen = S.introSeen || {}; D.pro3.intros.forEach((k) => { S.introSeen[k] = true; });
    S.ruleIntro = true;
    S.pro3 = { on: true, gate: res, at: Date.now() };
    // ラーメン版は屋台のプロローグを飛ばさず、縮めた段で通す（PEDAGOGY 1.10「原理の発見は飛ばせない」。台本の ev.lite）
    if (RAMEN) { S.phase = 'monthIntro'; save(); return; }
    S.discDone.prologue = 0;
    if (!S.leaves.some((l) => l.label === '左右に書く（仕訳）')) S.leaves.push({ p: 'P1', label: '左右に書く（仕訳）', mi: 0, lite: true });
    S.decisions.price = S.decisions.price || '100';
    S.mi = 1; S.ei = 0; S.phase = 'monthIntro';
    save();
  }
  // 確認だけの発見：困りごとの台詞と書類、名前カード、試験の文。「知っている」で進み、本試験の文の1問は解く
  function discoverLite(ev) {
    const b4 = ev.b4;
    frame(`<div class="s-card s-lite"><small>3級の確認（近道）</small>${talk(ev.b1.talk)}${ev.b1.dyn ? `<p class="s-dyn">${esc(ev.b1.dyn(S))}</p>` : ''}${docHTML(ev.b1.doc)}<div class="s-name"><small>この考え方の名前</small><h2>${rb(b4.name)}</h2><p>${rb(b4.line)}</p>${b4.exam ? `<details class="s-exam"><summary>試験では、どんな文で出る？</summary><p>${esc(b4.exam)}</p></details>` : ''}</div><button class="btn wide" data-lite>知っている（つぎへ）</button></div>`);
    app.onclick = (e) => {
      if (!e.target.closest('[data-lite]')) return;
      teach(b4.teaches);
      S.discDone[ev.id] = S.mi;
      S.metrics.disc[ev.id] = { tries: 0, first: null, hand: 0, forks: [], lite: true };
      if (b4.leaf && !S.leaves.some((l) => l.label === b4.leaf.label)) S.leaves.push({ p: b4.leaf.p, label: b4.leaf.label, mi: S.mi, lite: true });
      save();
      const qs = discQuiz(ev);
      if (qs.length) quickQuiz(qs, '本試験の文で確かめる', () => next(), scopesOfDisc(ev)); else next();
    };
  }
  // ラーメン版：屋号とプレイヤーの名前を決める（DESIGN-RAMEN c.6・l.2 段0、オーナー n.9）。自由入力。空なら既定の名前
  function nameScreen(done) {
    const p = S.profile || { ...PROFILE0 };
    app.innerHTML = `<main class="s-main"><div class="s-card"><small>はじめる前に</small><h3>店の名前と、あなたの名前</h3><p>あなたは、ミライ社長の店でお金の記録をまかされる人。店の名前（屋号）と、ゲームの中で呼ばれる名前を決めよう。あとからタイトルで変えられる。</p><label class="s-field">店の名前（屋号）<input data-shop maxlength="12" value="${esc(p.shopName)}" placeholder="${esc(PROFILE0.shopName)}"></label><label class="s-field">あなたの名前<input data-player maxlength="10" value="${esc(p.playerName)}" placeholder="${esc(PROFILE0.playerName)}"></label><button class="btn wide" data-nameok>これで始める</button></div></main>`;
    app.onclick = (e) => {
      if (!e.target.closest('[data-nameok]')) return;
      const clean = (x, d, n) => (String(x || '').replace(/[<>{}]/g, '').trim().slice(0, n) || d);
      S.profile = { shopName: clean($('[data-shop]', app).value, PROFILE0.shopName, 12), playerName: clean($('[data-player]', app).value, PROFILE0.playerName, 10) };
      S.profileOk = true; save(); done();
    };
  }
  // はじめる前に1回だけ、受験する年度を確かめる（科目の名前と出る論点が変わるため）
  function modeScreen(done) {
    const d = modeOf();
    app.innerHTML = `<main class="s-main"><div class="s-card"><small>はじめる前に</small><h3>いつの試験を受ける？</h3><p>2027年4月から、2級の出題の範囲が変わる（紙の手形がなくなる、リースの科目が変わる など）。受ける試験に合わせて、ゲームの中の科目と問題を選ぶ。あとからタイトルの「受験する年度」で変えられる。</p>${['2026', '2027'].map((m) => `<button class="btn wide ${m === d ? '' : 'ghost'}" data-pickmode="${m}">${MODE_TXT[m]}${m === d ? '（今日の日付ならこちら）' : ''}</button>`).join('')}</div></main>`;
    app.onclick = (e) => { const b = e.target.closest('[data-pickmode]'); if (b) { S.mode = b.dataset.pickmode; S.modeOk = true; save(); done(); } };
  }
  const allEvents = D.months.flatMap((m, mi) => m.events.map((e) => ({ e, mi })));
  const monthLabel = (mi) => (D.months[mi] || {}).label || '';
  // 成長の記録（growth.js）に渡す窓口
  const GAPI = { S: () => S, scopeState: (it) => scopeState(it), monthLabel, esc };
  const grew = (why) => { if (B.growth.snapshot(GAPI, why)) save(); };
  function scopeState(it) {
    const x = it.sim || {}, disc = x.disc || [], docs = x.docs || [], kinds = x.kinds || [];
    const mets = [];
    // その判断を選んだ人だけが出会う論点（例：定率法）は、選んでいなければ「まだ」
    const whenOk = !x.when || Object.entries(x.when).every(([k, v]) => S.decisions[k] === v);
    if (!whenOk) return { met: null, own: false, shaky: false, exam: null, built: true };
    disc.forEach((d) => { if (S.discDone[d] != null) mets.push(S.discDone[d]); });
    S.L.forEach((l) => { if (docs.includes(l.ev) || kinds.includes(l.kind)) mets.push(l.mi); });
    if (x.close && S.closes.length) mets.push(S.closes[0].mi);
    if (x.report && S.reportSeen) mets.push(D.months.length - 1);
    const met = mets.length ? Math.min(...mets) : null;
    // 自分で：発見は1回目から理由まで正しく、書類は1回目で正しく、同じ種類は別の月にもう一度正しく（＝慣れた・自動仕訳ルールの条件）
    const parts = [];
    if (disc.length) parts.push(disc.every((d) => S.discDone[d] != null && (d === 'prologue' || (S.metrics.disc[d] || {}).first)));
    if (docs.length) { const seen = S.docLog.filter((l) => docs.includes(l.ev)); parts.push(seen.length > 0 && seen.every((l) => l.ok)); }
    // 近道で最初から入れた自動仕訳（preset）は、自分で登録した熟達の結果ではないので数えない
    if (kinds.length) parts.push(kinds.some((k) => (S.rules[k] && !S.rules[k].preset) || mastered(k)));
    const lite = disc.some((d) => (S.metrics.disc[d] || {}).lite) || (kinds.length > 0 && kinds.some((k) => S.rules[k] && S.rules[k].preset) && !kinds.some((k) => mastered(k)));
    if (x.close) parts.push(S.closes.filter((c) => !c.fixed).length >= 2);
    let own = met != null && parts.length > 0 && parts.every(Boolean);
    // 月末に直した取引は「ゆらぎ」。同じ種類を、直した月より後に1回目で正しく書けたら戻る
    const fixes = S.fixLog.filter((f) => docs.includes(f.ev) || kinds.includes(f.kind));
    const shaky = fixes.some((f) => !S.docLog.some((l) => l.ok && l.mi > f.mi && (l.kind === f.kind || l.ev === f.ev)));
    if (shaky) own = false;
    // 本試験の文の問題は、it.q と、その章の問題で拾う。章を2つ以上の項目で分けているときは、その項目のために出した問題（l.scope）だけ（2回目の検査：同じ章の1問で章の全部の項目に「書けた」が点いた）。自動仕訳の棚卸・思い出すで書けなかった種類（auto:<kind>）も拾う
    const ex = S.examLog.filter((l) => (it.q || []).includes(l.key) || (it.sim && it.ch && l.key.split(':')[0] === it.ch && !l.key.startsWith('exam:') && !l.key.startsWith('auto:') && (CH_SOLO[it.ch] === 1 || (l.scopes || []).includes(it.id))) || (l.key.startsWith('auto:') && kinds.includes(l.key.slice(5))) || (B.examScope && (B.examScope[l.key] || []).includes(it.id)));
    const okT = ex.filter((l) => l.ok).map((l) => l.t);
    const exam = !ex.length ? null : !ex[ex.length - 1].ok ? 'miss' : okT.length >= 2 && Math.max(...okT) - Math.min(...okT) >= 7 * 864e5 ? 'exam2' : 'exam1';
    return { met, own, shaky, exam, lite: lite && !own, built: !!(disc.length || docs.length || kinds.length || x.close || x.report) };
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
      if (DEV) return `<button class="s-cell dev ${st.built ? 'built' : ''}" data-scope="${it.id}"><b>${esc(sname(it))}</b><small>${it.id}・${it.ch}・${it.p}${st.built ? '' : '・未実装'}${(it.q || []).length ? '・問' + it.q.length : ''}</small></button>`;
      if (st.met == null && !st.exam) {
        if (next.includes(it.id)) return `<button class="s-cell next" data-scope="${it.id}"><small>これから起きること</small><span>${esc(it.teaser)}</span></button>`;
        return '<span class="s-cell fog" aria-hidden="true"></span>';
      }
      const word = st.met == null ? 'まだ会社では起きていない' : st.shaky ? '月末に直した。もう一度で定着' : st.own ? '自分でできた' : st.lite ? '3級の型（見ただけ）' : `${monthLabel(st.met)}に起きた`;
      return `<button class="s-cell ${st.shaky ? 'shaky' : st.own ? 'own' : 'met'} ${st.exam || ''}" data-scope="${it.id}" style="--h:${PHUE[it.p] || 190}"><b>${esc(sname(it))}</b><small>${esc(word)}</small>${st.exam ? `<em>${esc(EXAM_WORD[st.exam])}</em>` : ''}${it.y27 ? `<i>${esc(Y27[it.y27])}</i>` : ''}</button>`;
    };
    const legend = DEV ? '<p class="s-mapnote">開発者表示：全項目の名前・章・原理と、まだゲームにない項目（点線）。数は <code>node boki2/tools/coverage.js</code> で。</p>'
      : '<p class="muted s-mapnote">日商簿記2級の試験に出るところを、まとまりごとに並べた地図。会社で起きたことから順に明るくなる。まだ先のことは輪郭だけ。</p>';
    const devToggle = !/[?&]dev\b/.test(location.search) ? '' : `<label class="s-devtoggle"><input type="checkbox" data-dev ${DEV ? 'checked' : ''}> 開発者表示（全項目の名前と、まだゲームにない項目が見える）</label>`;
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
    const o = overlay('<div class="s-maptabs"><button data-maptab="p">考え方で見る</button><button data-maptab="s">試験範囲で見る</button><button data-maptab="c">札で見る</button></div><div class="s-mapbody"></div>');
    let cardQ = '';
    const paint = () => { $$('[data-maptab]', o).forEach((b) => b.classList.toggle('on', b.dataset.maptab === mapTab)); $('.s-mapbody', o).innerHTML = mapTab === 'p' ? principleView() : mapTab === 'c' ? cardsView(cardQ) : scopeView(); };
    paint();
    o.addEventListener('input', (e) => { if (e.target.matches('[data-cardq]')) { cardQ = e.target.value.trim(); const pos = e.target.selectionStart; paint(); const inp = $('[data-cardq]', o); inp.focus(); inp.setSelectionRange(pos, pos); } });
    o.addEventListener('click', (e) => {
      const t = e.target.closest('[data-maptab]');
      if (t) { mapTab = t.dataset.maptab; paint(); return; }
      if (e.target.closest('[data-dev]')) { DEV = e.target.closest('[data-dev]').checked; paint(); return; }
      const cd = e.target.closest('[data-card]');
      if (cd) { const d = overlay(cardDetail(cd.dataset.card)); d.addEventListener('click', (ev) => { const r = ev.target.closest('[data-replay]'); if (r) { d.remove(); o.remove(); replay(r.dataset.replay); return; } const sb = ev.target.closest('[data-card]'); if (sb) { d.remove(); cd.dataset.card = sb.dataset.card; cd.click(); } }); return; }
      const c = e.target.closest('[data-scope]');
      if (c) { const d = overlay(scopeDetail(c.dataset.scope)); d.addEventListener('click', (ev) => { const r = ev.target.closest('[data-replay]'); if (r) { d.remove(); o.remove(); replay(r.dataset.replay); } }); }
    });
  }
  function replay(id) {
    const ev = allEvents.find(({ e }) => e.id === id).e;
    if (ev.t === 'board') boardScreen(ev, true); else discoverScreen(ev, true);
  }

  /* ---------- 検定会場（js/hall.js。会社の外の第2のループ。合否は会社に影響しない：docs/DESIGN-REVISION.md 3.4） ---------- */
  const chNum = (id) => parseInt(String(id).replace(/\D/g, ''), 10) || 0;
  const HCH = B.chapters.slice().sort((a, b) => chNum(a.id) - chNum(b.id));
  HCH.forEach((c) => (c.qs || []).forEach((q, i) => { q._key = q._key || `${c.id}:${i}`; q._ch = c; }));
  (B.exams || []).forEach((x) => { x.type = 'fill'; x._key = `exam:${x.id}`; x._ch = { title: `模試 第${x.part}問 ${x.title}`, world: 'exam' }; });
  // 大問の範囲タグ：成長の記録で、大問の正誤をその項目に数える
  B.examScope = {}; (B.exams || []).forEach((x) => { B.examScope[x._key] = x.scope || []; });
  let hallGuard = null, hallClean = null;
  const hallCtx = (root) => ({
    root, state: (S.hall = S.hall || { exams: [], examSeen: [] }), chapters: HCH, save,
    examExtra: () => S.examExtra || 0,
    hist: (k) => { const l = S.examLog.filter((x) => x.key === k); return [l.length, l.filter((x) => x.ok).length]; },
    // 会社で起きた論点なら「習った」
    cleared: (ch) => B.scope.some((it) => it.ch === ch && scopeState(it).met != null),
    record: (q, ok) => { S.examLog.push({ key: q._key, ok, t: Date.now(), hall: true }); save(); },
    // 第1問の候補に混ぜる札：答えの札の兄弟（js/data/siblings.js）。札の速さで迷った札を先に
    confused: (ans) => { const miss = new Set([...speedMissed('shelf'), ...speedMissed('side'), ...speedMissed('kubun')]); const sibs = [...new Set(B.siblings.filter((sb) => sb.accs.some((a) => ans.includes(a))).flatMap((sb) => sb.accs))].filter((a) => !ans.includes(a)); return [...sibs.filter((a) => miss.has(a)), ...sibs.filter((a) => !miss.has(a))]; },
    extras: () => autoMenu() + `<div class="card stack"><h3>第1問の前に：札の速さ</h3><p class="muted" style="margin:0;font-size:13px">候補の札から選ぶ前に、札の置き場所を速く。教わった札だけが出る。</p>${speedMenu()}</div>`,
    y27: () => modeOf() !== '2026', today: () => new Date().toISOString().slice(0, 10),
    go: (name, arg) => (name === 'exam' ? hallScreen() : hallScreen({ play: arg === undefined ? true : arg })),
    // 習っていない → その論点の会社の場面へ（見つけていれば、もう一度見る）
    lesson: (ch) => { if (ch === 'c47') { const c = HCH.find((x) => x.id === 'c47'); overlay(`<h3>${esc(c.title)}</h3>${c.lessons.map((l) => `<h4>${esc(l.t)}</h4><div class="rich">${B.hall.rich(l.h)}</div>`).join('')}`); return; } const it = B.scope.find((x) => x.ch === ch && ((x.sim || {}).disc || []).some((d) => S.discDone[d] != null)); if (it) { leaveHall(); replay(it.sim.disc.find((d) => S.discDone[d] != null)); } else { const n = B.scope.find((x) => x.ch === ch); toast(`「${n ? n.name : ch}」は、会社でまだ起きていない。先の月で出会う。`); } },
    review: () => overlay(B.growth.view(GAPI)),
    guard: (m) => { hallGuard = m; }, cleanup: (fn) => { hallClean = fn; },
    after: () => grew('検定会場'), toast,
    icons: { paper: '', x: '×' },
  });
  function leaveHall() { if (hallClean) { hallClean(); hallClean = null; } hallGuard = null; }
  function hallScreen(arg) {
    leaveHall();
    frame(`<div class="s-hallbar"><button class="btn sm ghost" data-hallback>← 会社へもどる</button><small>検定会場（本試験の形の模試）。合否は会社に影響しない</small></div><div class="s-hall"></div>`);
    const root = $('.s-hall', app);
    app.onclick = (e) => {
      if (e.target.closest('[data-autoinv]')) { roomDrill(autoQs(), '自動仕訳の棚卸', () => hallScreen()); return; }
      const sp = e.target.closest('[data-speed]');
      if (sp) { speedScreen(sp.dataset.speed, () => hallScreen()); return; }
      if (!e.target.closest('[data-hallback]')) return;
      if (hallGuard) { const o = overlay(`<p>${esc(hallGuard)}</p><button class="btn wide bad" data-hallquit>やめて会社へもどる</button>`); o.addEventListener('click', (x) => { if (x.target.closest('[data-hallquit]')) { o.remove(); leaveHall(); render(); } }); return; }
      leaveHall(); render();
    };
    const H = B.hall.use(hallCtx(root));
    if (arg && arg.play !== undefined) H.play(arg.play); else H.menu();
  }

  /* ---------- 練習室：論点ごとの問題・まちがいノート・検定会場（学習ゲームの章の問題をここへ移した） ---------- */
  // 会社で出会った論点は「会社の場面をもう一度」、まだの論点は「参考書」（章の説明）を読んでから問題へ。受験が近い人のため、全範囲を開いておく
  const roomQs = (it) => { const c = HCH.find((x) => x.id === it.ch); return c ? c.qs.filter((q) => !B.outOfScope2(q) && !(modeOf() !== '2026' && B.outdated27(q)) && !(modeOf() === '2026' && B.new27(q)) && !/上記|前問/.test(q.q || '')) : []; };
  const lastOf = (k) => { const l = S.examLog.filter((x) => x.key === k); return l.length ? l[l.length - 1] : null; };
  let roomTab = 'items';
  function practiceScreen(tab) {
    if (tab) roomTab = tab;
    leaveHall();
    let body = '';
    if (roomTab === 'items') {
      body = B.scopeAreas.map((a) => `<section class="s-room-area"><h4>${esc(a.label)}</h4>${B.scope.filter((it) => a.secs.includes(it.sec) && (it.y27 !== 'out' || modeOf() === '2026')).map((it) => {
        const r = B.growth.item(GAPI, it), n = roomQs(it).length, met = r.lv > 0;
        return `<div class="s-room-it"><div><b>${esc(sname(it))}</b><small>${esc(B.growth.LV[r.lv])}${met ? '' : '・会社ではまだ'}</small></div><div class="s-room-btns"><button class="btn ghost sm" data-ref="${it.id}">参考書</button>${n ? `<button class="btn sm" data-drill="${it.id}">問題 ${Math.min(5, n)}</button>` : ''}</div></div>`;
      }).join('')}</section>`).join('');
    } else if (roomTab === 'speed') {
      body = `<p class="muted" style="font-size:13px">本試験の第1問は、候補の札から選ぶ。札の置き場所が速く分かれば、ありえない札をすぐ外せる。順位や点はない。前の自分の秒数とくらべるだけ。</p>${speedMenu()}`;
    } else {
      // 自動仕訳の型（auto:<kind>）は問題の番号ではないので、ここには出さない（月はじめの思い出すで出る）
      const keys = [...new Set(S.examLog.map((l) => l.key))].filter((k) => { const l = lastOf(k); return l && !l.ok && !k.startsWith('auto:') && (k.startsWith('exam:') ? (B.exams || []).some((x) => x._key === k) : qByKey(k)); });
      body = keys.length ? keys.map((k) => { const q = k.startsWith('exam:') ? (B.exams || []).find((x) => x._key === k) : qByKey(k); if (!q) return ''; const t = String(q.title || q.q || '').replace(/<[^>]+>/g, '').slice(0, 70); return `<div class="s-room-it"><div><b>${esc(t)}</b><small>${esc(q._ch ? q._ch.title : '')}</small></div><div class="s-room-btns"><button class="btn sm" data-redo="${esc(k)}">解き直す</button></div></div>`; }).join('') : '<p class="muted">いまは、間違えたままの問題はない。本試験の文で確かめる・腕だめし・練習室・検定会場で間違えた問題が、ここにたまる。正しく解き直すと消える。</p>';
    }
    frame(`<div class="s-hallbar"><button class="btn sm ghost" data-hallback>← 会社へもどる</button><small>練習室（会社の外で練習する。会社の数字には影響しない）</small></div><div class="seg s-room-tabs"><button data-rt="items" aria-pressed="${roomTab === 'items'}">論点ごと</button><button data-rt="miss" aria-pressed="${roomTab === 'miss'}">まちがいノート</button><button data-rt="speed" aria-pressed="${roomTab === 'speed'}">札の速さ</button><button data-rhall>検定会場</button></div><div class="s-room">${body}</div>`);
    app.onclick = (e) => {
      const g = (x) => e.target.closest(x);
      if (g('[data-hallback]')) { render(); return; }
      if (g('[data-rt]')) { practiceScreen(g('[data-rt]').dataset.rt); return; }
      if (g('[data-rhall]')) { hallScreen(); return; }
      if (g('[data-speed]')) { speedScreen(g('[data-speed]').dataset.speed, () => practiceScreen('speed')); return; }
      if (g('[data-ref]')) { const it = B.scope.find((x) => x.id === g('[data-ref]').dataset.ref), c = HCH.find((x) => x.id === it.ch); overlay(`<h3>参考書：${esc(sname(it))}</h3><p class="muted" style="font-size:12px">試験のための説明。会社で出会う前に読んでも、出会ったあとに読み直してもいい。</p>${c && (c.lessons26 && modeOf() === '2026' ? c.lessons26 : c.lessons) ? (c.lessons26 && modeOf() === '2026' ? c.lessons26 : c.lessons).map((l) => `<h4>${esc(l.t)}</h4><div class="rich">${B.hall.rich(l.h)}</div>`).join('') : '<p>まだ説明がない。</p>'}${c && c.real ? `<h4>実務では：${esc(c.real.t)}</h4><p class="muted" style="font-size:12px">${esc(c.real.where)}</p><div class="rich">${B.hall.rich(c.real.h)}</div>` : ''}`); return; }
      if (g('[data-drill]')) { const it = B.scope.find((x) => x.id === g('[data-drill]').dataset.drill); const qs = roomQs(it); const pref = qs.filter((q) => { const l = lastOf(q._key); return !l || !l.ok; }); const pickQ = (pref.length >= 3 ? pref : qs).slice().sort(() => Math.random() - 0.5).slice(0, 5); roomDrill(pickQ, sname(it), () => practiceScreen(), it.id); return; }
      if (g('[data-redo]')) { const k = g('[data-redo]').dataset.redo; if (k.startsWith('exam:')) { const x = (B.exams || []).find((y) => y._key === k); hallScreen({ play: { part: x.part, mode: 'self', key: k } }); } else roomDrill([qByKey(k)], 'まちがいノート', () => practiceScreen('miss')); }
    };
  }
  // 1問ずつ：仕訳と穴埋めは検定会場と同じ入力（半角・候補から選ぶ）、選択・計算・仕分けはこの場の部品
  function roomDrill(qs, label, done, roomScope) {
    let i = 0;
    const draw = () => {
      if (i >= qs.length) { grew('練習室'); return done(); }
      const q = qs[i];
      frame(`<div class="s-card s-roomq"><small>${esc(label)} ${i + 1} / ${qs.length}</small><div class="qtext rich">${B.hall.rich(q.q)}</div><div data-qb></div><div data-res></div><button class="btn wide" data-qcheck>答え合わせ</button></div>`);
      const box = $('[data-qb]', app);
      let comp;
      if (q.type === 'journal') comp = B.hall.mountJournalCBT(q, box, { exam: true });
      else if (q.type === 'fill') comp = B.hall.mountFillCBT(q, box, { exam: true });
      else if (q.type === 'choice') { let pick = null; box.innerHTML = `<div class="s-opts">${q.c.map((c, k) => `<button class="s-opt" data-ch="${k}"><b>${B.hall.rich(c)}</b></button>`).join('')}</div>`; box.onclick = (e) => { const b = e.target.closest('[data-ch]'); if (!b) return; pick = +b.dataset.ch; $$('[data-ch]', box).forEach((x) => x.classList.toggle('on', x === b)); }; comp = { check: () => ({ ok: pick === q.a, ratio: pick === q.a ? 1 : 0 }), reveal() { $$('[data-ch]', box).forEach((x) => x.classList.add(+x.dataset.ch === q.a ? 'ok' : 'ng')); }, answerHTML: () => `<p>正解：${B.hall.rich(q.c[q.a])}</p>` }; }
      else if (q.type === 'number') { box.innerHTML = `<div class="s-row"><input data-num inputmode="decimal" placeholder="答え"><span>${esc(q.unit || '')}</span></div>`; const v = () => B.hall.toNum($('[data-num]', box).value); comp = { check: () => { const ok = Math.abs((v() || 0) - q.a) < 1e-6; return { ok, ratio: ok ? 1 : 0 }; }, reveal() {}, answerHTML: () => `<p>正解：${fmt(q.a)}${esc(q.unit || '')}</p>` }; }
      else { box.innerHTML = q.items.map(([t], k) => `<div class="s-sorti"><span>${esc(t)}</span><select data-so="${k}"><option value="">えらぶ</option>${q.bins.map((b2, j) => `<option value="${j}">${esc(b2)}</option>`).join('')}</select></div>`).join(''); const got = () => q.items.filter(([, a], k) => $(`[data-so="${k}"]`, box).value === String(a)).length; comp = { check: () => ({ ok: got() === q.items.length, ratio: got() / q.items.length }), reveal() {}, answerHTML: () => `<p>${q.items.map(([t, a]) => `${esc(t)}→${esc(q.bins[a])}`).join('、')}</p>` }; }
      app.onclick = (e) => {
        if (e.target.closest('[data-qnext]')) { i++; draw(); return; }
        if (!e.target.closest('[data-qcheck]')) return;
        const r = comp.check(); comp.reveal(r.ok);
        S.examLog.push(Object.assign({ key: q._key, ok: !!r.ok, t: Date.now(), room: true }, roomScope ? { scopes: [roomScope] } : {})); save();
        $('[data-res]', app).innerHTML = `<div class="fb ${r.ok ? 'ok' : 'ng'}"><p class="s-react ${r.ok ? '' : 'ng'}">${r.ok ? '正解' : '正しくは：'}</p>${r.ok ? '' : comp.answerHTML()}<div class="rich">${B.hall.rich(q.exp || '')}</div></div><button class="btn wide" data-qnext>${i + 1 < qs.length ? 'つぎへ' : '練習室へもどる'}</button>`;
        e.target.closest('[data-qcheck]').remove();
      };
    };
    draw();
  }

  /* ---------- 札の速さ（旧版の仕分けラッシュの変形：docs/CLASSIC-MIGRATION.md 1章） ----------
     出す札は教わったものだけ。1回20枚・カウントダウンなし。誤りは減点せず、理由を1行出して、同じ回の後ろでもう一度出す。
     記録は S.speedLog（札ごと）と S.speedRuns（回ごと。前回の秒数を見せるだけ） */
  const FIVE = ['資産', '負債', '純資産', '収益', '費用'];
  // 区分の名前のうち、まだ教えていない語は会社の言葉で
  const kbLab = (b) => (b === '売上高' && !knows('売上高') ? '本業の売上' : b);
  const shelfAccs = () => S.taught.filter((a) => B.accounts[a] && (FIVE.includes(cat(a)) || CONTRA.has(a)));
  const SPEED = {
    shelf: { t: '札の置き場所', d: '札を、棚（グループ）に分ける。第1問の候補から、ありえない札をすぐ外すために。', open: () => shelfAccs().length >= 12, lock: '札を12枚見つけると開く',
      deck: () => shelfAccs().map((a) => { const ans = CONTRA.has(a) ? 'マイナスの札' : gw(cat(a)); return { acc: a, text: a, ans, why: `${a}は「${ans}」。${(B.accounts[a] || {}).d || ''}` }; }),
      bins: (deck) => [...FIVE.map((c) => gw(c)).filter((g) => deck.some((x) => x.ans === g)), ...(deck.some((x) => x.ans === 'マイナスの札') ? ['マイナスの札'] : [])] },
    side: { t: '増えたら左？右？', d: '自分の会社の帳簿から。「〇〇が増えた」を左（借方）か右（貸方）か。仕訳の速さの土台。', open: () => knows('借方'), lock: '「借方・貸方」を見つけると開く',
      deck: () => {
        const out = [], seen = new Set();
        for (const e of S.T) for (const side of ['dr', 'cr']) for (const [a] of e[side]) {
          if (!knows(a) || !(FIVE.includes(cat(a)) || CONTRA.has(a))) continue;
          const plus = CONTRA.has(a) ? side === 'cr' : ['資産', '費用'].includes(cat(a)) === (side === 'dr');
          const pl = ['収益', '費用'].includes(cat(a));
          const key = `${a}:${plus}`; if (seen.has(key)) continue; seen.add(key);
          const verb = pl ? (plus ? '生まれた（増えた）' : '取り消された（減った）') : plus ? '増えた' : '減った';
          const L = knows('借方') ? '借方（左）' : '左', R = knows('貸方') ? '貸方（右）' : '右';
          const home = CONTRA.has(a) ? R : ['資産', '費用'].includes(cat(a)) ? L : R;
          out.push({ acc: a, text: `${a}が${verb}`, ans: side === 'dr' ? L : R, why: `${CONTRA.has(a) ? 'マイナスの札' : gw(cat(a))}の札は、増えたら${home}。減ったら反対の側。` });
        }
        return out;
      },
      bins: () => [knows('借方') ? '借方（左）' : '左', knows('貸方') ? '貸方（右）' : '右'] },
    kubun: { t: '決算書のどこ？', d: '札が、決算書のどこに出るか。第3問の決算書づくりで、区分と表示の名前をまちがえないために。', open: () => knows('損益計算書'), lock: '「損益計算書」を見つけると開く',
      deck: () => {
        const KB = B.kubun, accs = shelfAccs();
        const fine = knows('販売費及び一般管理費'), bsFine = knows('流動資産');
        const out = accs.map((a) => {
          const isPL = ['収益', '費用'].includes(cat(a));
          if (isPL && fine) { const bin = kbLab(KB.plOf(a)); return bin && { acc: a, text: a, ans: bin, why: `${a}は、損益計算書の「${bin}」。` }; }
          if (!isPL && bsFine) { const bin = KB.bsOf(a); return bin && { acc: a, text: a, ans: bin, why: `${a}は、貸借対照表の「${bin}」。` }; }
          const ans = isPL ? '損益計算書' : '貸借対照表';
          return { acc: a, text: a, ans, why: isPL ? `${a}は、1年のもうけの中身（損益計算書）に出る。` : `${a}は、1年の終わりの棚の絵（貸借対照表）に出る。` };
        }).filter(Boolean);
        // 表示科目：帳簿の名前と、決算書に書く名前がちがう札（第3問でいちばん多いまちがい）
        if (knows('表示科目')) for (const a of ['繰越商品', '前払家賃', '未払賃金']) if (knows(a)) out.push({ acc: a, text: `帳簿の「${a}」は、決算書では？`, opts: [KB.show[a], a, a === '繰越商品' ? '製品' : a === '前払家賃' ? '前払金' : '未払金'], ans: KB.show[a], why: `決算書では「${KB.show[a]}」と書く。帳簿の名前のまま書くと、第3問では点にならない。` });
        return out;
      },
      bins: (deck) => { const KB = B.kubun; const all = [...KB.PL_BINS.map(kbLab), ...KB.BS_BINS, '損益計算書', '貸借対照表']; return all.filter((b) => deck.some((x) => !x.opts && x.ans === b)); } },
  };
  // 迷った札：直近の回で誤った札から
  const speedMissed = (mode) => { const l = (S.speedLog || []).filter((x) => x.mode === mode).slice(-80); const last = {}; l.forEach((x) => { last[x.acc] = x.ok; }); return Object.keys(last).filter((a) => last[a] === false); };
  function speedScreen(mode, back) {
    const M = SPEED[mode];
    const deck0 = M.deck();
    const bins = M.bins(deck0);
    const shuf = (l) => l.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    // 前に迷った札を先頭に、残りから20枚（足りなければ同じ札をもう一度）
    const miss = speedMissed(mode), first = shuf(deck0.filter((x) => miss.includes(x.acc))), rest = shuf(deck0.filter((x) => !miss.includes(x.acc)));
    let cards = [...first, ...rest];
    while (cards.length < 20 && deck0.length) cards = cards.concat(shuf(deck0));
    cards = cards.slice(0, 20);
    let i = 0, t0 = Date.now(), tc = Date.now(), wrong = null;
    const missed = [];
    const draw = () => {
      if (i >= cards.length) return finish();
      const c = cards[i], opts = c.opts ? shuf(c.opts) : bins;
      frame(`<div class="s-hallbar"><button class="btn sm ghost" data-sback>← もどる</button><small>${esc(M.t)}　${Math.min(i + 1, cards.length)} / ${cards.length}</small></div><div class="s-card s-speed"><p class="s-speedcard">${rb(c.text)}</p>${wrong ? `<p class="s-speedwhy">${esc(c.why)}</p><button class="btn wide" data-snext>つぎへ</button>` : `<div class="s-speedbins">${opts.map((b) => `<button class="s-opt" data-sbin="${esc(b)}"><b>${esc(b)}</b></button>`).join('')}</div>`}</div>`);
    };
    const finish = () => {
      const ms = Date.now() - t0, runs = (S.speedRuns = S.speedRuns || []), prev = runs.filter((r) => r.mode === mode).pop();
      runs.push({ mode, n: cards.filter((c) => !c.again).length, ms, miss: missed.length, t: Date.now() }); if (runs.length > 60) runs.splice(0, runs.length - 60);
      save();
      const uniq = [...new Set(missed)];
      frame(`<div class="s-card"><small>${esc(M.t)}</small><h3>${cards.filter((c) => !c.again).length}枚を ${Math.round(ms / 1000)}秒</h3>${missed.length ? `<p class="muted">迷った札は、その回のうちにもう一度出した。</p>` : ''}${prev ? `<p class="muted">前回は ${Math.round(prev.ms / 1000)}秒${prev.miss ? `（迷った札 ${prev.miss}枚）` : ''}。</p>` : ''}${uniq.length ? `<h4>迷った札</h4><p class="muted" style="font-size:13px">次の回は、この札から出る。押すと、生まれた場面や兄弟との違いが見られる。</p><div class="s-cardgrid">${uniq.map((a) => `<button class="s-cardbtn" data-card="${esc(a)}"><b>${rb(a)}</b></button>`).join('')}</div>` : '<p>迷った札はなかった。</p>'}<button class="btn wide" data-sagain>もう一度</button><button class="btn wide ghost" data-sback>もどる</button></div>`);
    };
    draw();
    app.onclick = (e) => {
      const g = (x) => e.target.closest(x);
      if (g('[data-sback]')) { back(); return; }
      if (g('[data-sagain]')) { speedScreen(mode, back); return; }
      if (g('[data-card]')) { const d = overlay(cardDetail(g('[data-card]').dataset.card)); d.addEventListener('click', (ev) => { const r = ev.target.closest('[data-replay]'); if (r) { d.remove(); replay(r.dataset.replay); } }); return; }
      if (g('[data-snext]')) { wrong = null; i++; tc = Date.now(); draw(); return; }
      const b = g('[data-sbin]');
      if (!b) return;
      const c = cards[i], ok = b.dataset.sbin === c.ans;
      (S.speedLog = S.speedLog || []).push({ acc: c.acc, mode, ok, ms: Date.now() - tc, t: Date.now() });
      if (S.speedLog.length > 800) S.speedLog.splice(0, S.speedLog.length - 800);
      if (ok) { i++; tc = Date.now(); draw(); return; }
      missed.push(c.acc);
      // 同じ札を、同じ回の少しあとでもう一度
      if (!c.again) cards.splice(Math.min(cards.length, i + 4), 0, Object.assign({}, c, { again: true }));
      wrong = true; draw();
    };
  }
  /* ---------- 自動仕訳の棚卸（PEDAGOGY 1.6・docs/CLASSIC-MIGRATION.md 3章）：本試験では自動仕訳は効かない。自動で書いている書類を、本番の入力で手で書き直す ---------- */
  function autoQ(kind) {
    const x = S.L.filter((l) => l.kind === kind).pop();
    if (!x) return null;
    const ev = (allEvents.find(({ e }) => e.id === x.ev) || {}).e, t = S.T.find((y) => y.id === x.id);
    if (!ev || !ev.doc || !t) return null;
    const rows = val(ev.doc.rows, S) || [];
    const text = `${esc(ev.doc.type)}「${esc(ev.doc.title)}」（${esc(ev.doc.date)}）<br>${rows.map((r) => `${esc(r[0])}：${typeof r[1] === 'number' ? `${fmt(r[1])}円` : esc(r[1])}`).join('<br>')}<br>この書類の仕訳を書きなさい。`;
    return { type: 'journal', q: text, ans: { dr: t.dr, cr: t.cr }, opts: (ev.opts || []).filter(knows), _key: `auto:${kind}`, _ch: { title: '自動仕訳の棚卸', world: 'auto' }, exp: S.rules[kind] ? `自動で書いていた条件：${esc(S.rules[kind].cond || '')}` : '' };
  }
  const autoQs = () => Object.keys(S.rules).map(autoQ).filter(Boolean).slice(0, 10);
  const autoMenu = () => { const n = autoQs().length; return n ? `<div class="card stack"><h3>自動仕訳の棚卸</h3><p class="muted" style="margin:0;font-size:13px">本試験では、自動仕訳は効かない。会社で自動にしている書類を、本番と同じ入力で手で書き直す。</p><button class="btn" data-autoinv>${n}枚を手で書く</button></div>` : ''; };

  const speedMenu = () => `<div class="s-speedmenu">${Object.entries(SPEED).map(([k, M]) => `<div class="s-room-it"><div><b>${esc(M.t)}</b><small>${esc(M.open() ? M.d : M.lock)}</small></div><div class="s-room-btns">${M.open() ? `<button class="btn sm" data-speed="${k}">20枚</button>` : ''}</div></div>`).join('')}</div>`;

  /* ---------- screens ---------- */
  function render() {
    applyScale();
    if (S.phase === 'title') return titleScreen();
    const m = month();
    if (!m) return RAMEN && D.months.length <= 1 ? sliceTodo() : endScreen();
    if (S.phase === 'monthIntro') return monthIntro();
    if (S.phase === 'after' && RUI) return RUI.after(advanceMonth);
    // 月のはじめの「思い出す」は phase 'recall' で持つ（途中で閉じて開き直しても、とばされずに出る）
    if (S.phase === 'recall') return recallScreen(() => { S.phase = 'event'; save(); render(); });
    // 月のはじめ：自動仕訳ルールの提案
    if (S.ei === 0 && S.phase === 'event') { const k = ruleOffer(); if (k) return ruleScreen(k); }
    // 月のはじめ：前の判断の返り（遅延反応のキュー：year2.js の SIM.returns）
    if (S.ei === 0 && S.phase === 'event') { const r = pendingReturn(); if (r) return returnScreen(r); }
    const evs = events();
    if (S.ei >= evs.length) return m.closeless ? advanceMonth() : closeScreen();
    const ev = evs[S.ei];
    // 社長が自分で書いた書類（監査の点検で見つける）：画面は出さず、社長の書いた形で帳簿に入る
    if (ev.t === 'doc' && ev.byPres) { post(ev, val(ev.wrote, S), false); const x = S.L.find((l) => l.id === ev.id + '@' + S.mi); if (x) x.pres = true; return next(); }
    // 3級既習の近道：3級の語を教えるだけの発見は、確認だけの1画面
    if (ev.t === 'discover' && S.pro3 && S.pro3.on && D.pro3 && D.pro3.lite.includes(ev.id) && S.discDone[ev.id] == null) return discoverLite(ev);
    ({ plan: RUI ? RUI.plan : planScreen, rreport: RUI ? RUI.report : rreportScreen, bowl: RUI ? RUI.bowl : next, recall: () => recallScreen(next), calc: calcScreen, ss: ssScreen, duelist: duelistScreen, audit: auditScreen, desk: deskScreen, talk: talkScreen, board: boardScreen, doc: docScreen, discover: discoverScreen, decision: decisionScreen, ending: (x) => endingScreen(x.id), ifonly: ifOnlyScreen, report: reportScreen, closing: closingScreen, opening: openingScreen, sheet: sheetScreen, bank: bankScreen, quiz: quizScreen, end: endScreen }[ev.t])(ev);
  }
  // 前の判断の返り：いまの月（年・月・区切り）に当たり、条件が真で、まだ見ていないもの
  function pendingReturn() {
    const m = month(); if (!m) return null;
    const seen = S.returnsSeen || {};
    return (D.returns || []).find((r) => !seen[r.id] && (m.year || 1) === r.y && m.m === r.m && (r.seg || null) === (m.seg || null) && !m.label.includes('後半') && (() => { try { return r.cond(S); } catch (x) { return false; } })()) || null;
  }
  function returnScreen(r) {
    frame(`<div class="s-card s-return"><small>前の判断が、返ってきた：${esc(r.from)}</small>${talk(r.lines)}<button class="btn wide" data-n>つぎへ</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-n]')) { (S.returnsSeen = S.returnsSeen || {})[r.id] = S.mi; S.diary.push({ m: month().label, t: `前の判断の返り：${r.from}` }); save(); render(); } };
  }
  function saveWord() {
    const st = ST.status();
    if(st.localError)return st.localError;
    return st.mode === 'cloud' ? 'この端末と、claude.ai のこのページに保存（別の端末でも続きから遊べる）' : st.mode === 'cloud-error' ? 'この端末に保存（claude.ai への保存はいま失敗している）' : 'この端末に保存';
  }
  function titleScreen() {
    const started = S.mi > 0 || S.ei > 0;
    const ps = ST.profiles(), cur = ST.currentProfile();
    const who = ps.length > 1 || (ps[0] && ps[0].name) ? `<div class="s-who"><small>だれが遊ぶ？</small>${ps.map((p, k) => `<button class="${p.id === cur ? 'on' : ''}" data-prof="${p.id}">${esc(p.name || `${k + 1}人目`)}</button>`).join('')}<button data-addprof>＋</button></div>` : '<button class="link" data-addprof>ほかの人もこの端末で遊ぶ</button>';
    const logo = RAMEN ? `<div class="s-logo" data-nofuri>${esc(shopName())}<br><b>ラーメン</b></div><p>屋台の一杯から、町いちばんの店へ。<br>一杯を作り、値段を決め、お金の出入りを記録して店を育てよう。</p>` : '<div class="s-logo">ピヨ<br><b>商店</b></div><p>小さな屋台が、工場をもつ会社になるまで。<br>お金の出入りを記録して、会社を育てよう。</p>';
    // セーブスロット（ラーメン版。n.15）：店ごとに3つ。学びの記録はスロットをまたいで共有
    const slots = RAMEN && DOC ? `<div class="s-who s-slots"><small>セーブスロット（学びの記録は共通）</small>${DOC.slots.map((sl, k) => `<button class="${sl.id === S.__slot ? 'on' : ''}" data-slot="${sl.id}">${k + 1}：${esc(sl.run && sl.label ? sl.label : 'あき')}</button>`).join('')}</div>` : '';
    app.innerHTML = `<main class="s-main s-title">${logo}${slots}<p class="muted" style="font-size:.8rem">受験する年度：${esc(MODE_TXT[modeOf()])}</p>${who}<button class="btn wide" data-start>${started ? 'つづきから' : 'はじめる'}</button>${started ? '<button class="link" data-reset>最初からやり直す</button>' : ''}<details class="s-more"><summary>受験する年度・ふりがな・文字の大きさ・保存と引っ越し</summary>${RAMEN && S.profileOk ? `<div class="s-who"><small>店の名前・あなたの名前（いま：${esc(shopName())}・${esc(playerName())}）</small><button data-rename>名前を変える</button></div>` : ''}<div class="s-who"><small>受験する年度（問題の出し方が変わる）</small><button class="${modeOf() === '2026' ? 'on' : ''}" data-mode="2026">2027年3月まで</button><button class="${modeOf() !== '2026' ? 'on' : ''}" data-mode="2027">2027年4月から</button></div>${S.pro3 && S.pro3.on ? '<div class="s-who"><small>近道（3級の型は自動）</small><button data-p3off>近道を切る（3級の型も手で書く）</button></div>' : ''}<div class="s-who"><small>ふりがな</small><button class="${S.furigana !== 'always' ? 'on' : ''}" data-furi="auto">はじめてと、押したとき</button><button class="${S.furigana === 'always' ? 'on' : ''}" data-furi="always">いつも</button></div><div class="s-who"><small>文字の大きさ（書類と表も同じ割合で大きくなる）</small>${[100, 125, 150].map((z) => `<button class="${(S.textScale || 100) === z ? 'on' : ''}" data-tscale="${z}">${z}%</button>`).join('')}</div><div class="s-who"><small>検定会場の時間（読むのに時間がかかる人のための、はじめからの延長）</small>${[0, 10, 20, 30].map((z) => `<button class="${(S.examExtra || 0) === z ? 'on' : ''}" data-exx="${z}">${z ? `+${z}分` : 'なし'}</button>`).join('')}</div><p class="muted" style="font-size:12px" data-saveword>${esc(saveWord())}</p><button class="btn wide ghost" data-export>保存データをファイルにする</button><label class="btn wide ghost s-file">ファイルから続きを読み込む<input type="file" accept="application/json,.json" data-import hidden></label><button class="btn wide ghost" data-test>確認テスト（協力してくれる人向け）</button></details></main>`;
    app.onclick = (e) => {
      if (e.target.closest('[data-start]')) { const go = () => { if (S.phase === 'title') S.phase = started ? 'event' : 'monthIntro'; save(); render(); }; if (!started && RAMEN && !S.profileOk) return nameScreen(() => (S.modeOk ? pro3Ask(go) : modeScreen(() => pro3Ask(go)))); if (!started && !S.modeOk) return modeScreen(() => pro3Ask(go)); go(); }
      if (e.target.closest('[data-reset]')) { if (!confirm(RAMEN ? 'このスロットの店を消して、最初からやり直しますか？（学びの記録は残る）' : 'この人の記録を消して、最初からやり直しますか？')) return; S = freshKeep(); S.phase = 'monthIntro'; save(); render(); }
      const pb = e.target.closest('[data-prof]');
      if (pb) { ST.switchProfile(pb.dataset.prof); S = loadS(); render(); ST.connect(KEY, (st) => { S = fromSaved(st); if (document.querySelector('.s-title')) render(); }); }
      const sb = e.target.closest('[data-slot]');
      if (sb) { save(); S = fromDoc(DOC, sb.dataset.slot); DOC.cur = S.__slot; save(); titleScreen(); return; }
      if (e.target.closest('[data-addprof]')) { const name = prompt('遊ぶ人の呼び名（あとで変えられる。本名でなくてよい）', ''); if (name == null) return; ST.addProfile(name); S = fresh(); render(); }
      if (e.target.closest('[data-rename]')) { nameScreen(() => titleScreen()); return; }
      if (e.target.closest('[data-export]')) { ST.download(`piyo-save-${new Date().toISOString().slice(0, 10)}.json`, ST.exportText(KEY) || JSON.stringify(S)); }
      if (e.target.closest('[data-test]')) testScreen();
      const md = e.target.closest('[data-mode]');
      if (md) { S.mode = md.dataset.mode; S.modeOk = true; save(); titleScreen(); }
      if (e.target.closest('[data-p3off]')) { Object.keys(S.rules).forEach((k) => { if (S.rules[k].preset) delete S.rules[k]; }); S.pro3.on = false; save(); titleScreen(); return; }
      const fu = e.target.closest('[data-furi]');
      if (fu) { S.furigana = fu.dataset.furi; save(); titleScreen(); }
      const ts = e.target.closest('[data-tscale]');
      if (ts) { S.textScale = +ts.dataset.tscale; save(); applyScale(); titleScreen(); }
      const xx = e.target.closest('[data-exx]');
      if (xx) { S.examExtra = +xx.dataset.exx; save(); titleScreen(); }
    };
    const inp = $('[data-import]', app);
    if (inp) inp.onchange = async () => { const f = inp.files[0]; if (!f) return; try { const st = ST.importText(KEY, await f.text()); S = fromSaved(st); save(); render(); } catch (err) { alert('このファイルは読み込めませんでした。'); } };
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
  /* ---------- 期日一覧と資金繰り表（docs/YEAR2.md 12項・2年目2月の判断 due と、3年目4月の fund） ----------
     台本の、これからの書類から作る：口座のお金が動く書類（でんさいの期日の引き落とし・入金は除く）、でんさいの「支払期日」、社長が約束した支払い（予定）。
     でんさいの期日は、帳簿の電子記録債務・債権の残りからも出す（期日に自動で動く） */
  const parseDay = (t) => { const m = String(t || '').match(/(\d+)月(\d+日|末)/); return m ? { m: +m[1], d: m[2] === '末' ? 31 : parseInt(m[2], 10) } : null; };
  const DUE_PLAN = new Set(['pay_ap', 'collect_ar', 'pay_salary', 'pay_wage', 'cash_sale', 'cash_sale_vat', 'cash_sale_point', 'pay_tax', 'dividend_pay', 'rent', 'collect_card', 'construction', 'factoring', 'pay_other', 'repay', 'oh_power']);
  const DUE_FIXED = new Set(['pay_ap', 'collect_ar', 'pay_tax', 'dividend_pay', 'rent', 'collect_card', 'construction', 'factoring', 'repay']);
  function dueItems() {
    const cur = (month() || {}).m || 4, key = (x) => (((x.m - cur) % 12) + 12) % 12 * 100 + x.d;
    const items = [];
    const add = (o) => { if (o.date && key(o.date) <= 3 * 100 + 31) items.push(o); };
    const memo = (e, pay) => { const rows = val(e.doc.rows, S) || []; const r = rows.find((x) => x[0] === '摘要') || rows.find((x) => x[0] === (pay ? '受け取る人' : '払う人')); return r ? String(r[1]) : e.doc.title; };
    const bank = (t) => { const d = t.dr.filter(([a]) => a === '普通預金').reduce((x, [, v]) => x + v, 0), c = t.cr.filter(([a]) => a === '普通預金').reduce((x, [, v]) => x + v, 0); return d - c; };
    // 帳簿にある、でんさいの約束（まだ期日が来ていないもの）
    const denshi = (acc, sign) => {
      let bal = (balances(S.T)[acc] || 0) * sign;
      const made = S.T.filter((t) => (sign > 0 ? t.dr : t.cr).some(([a]) => a === acc)).map((t) => { const e = (allEvents.find(({ e: x }) => x.id === t.ev) || {}).e; const r = e && e.doc && (val(e.doc.rows, S) || []).find((x) => x[0] === '支払期日'); return r ? { e, t, date: parseDay(r[1]), amt: (sign > 0 ? t.dr : t.cr).filter(([a]) => a === acc).reduce((x, [, v]) => x + v, 0) } : null; }).filter(Boolean).reverse();
      for (const o of made) { if (bal <= 0) break; const amt = Math.min(o.amt, bal); bal -= amt; add({ date: o.date, what: `でんさい：${memo(o.e, sign < 0)}`, amt: sign > 0 ? amt : -amt, fixed: true, top: true }); }
    };
    denshi('電子記録債務', -1); denshi('電子記録債権', 1);
    // これからの書類
    const evs0 = events();
    for (let mi = S.mi; mi < Math.min(D.months.length, S.mi + 6); mi++) {
      const list = mi === S.mi ? evs0.slice(S.ei + 1) : D.months[mi].events.filter((e) => { try { return !e.when || e.when(S); } catch (x) { return false; } });
      for (const e of list) {
        if (e.t !== 'doc' || !e.doc || e.byPres || e.kind === 'denshi_settle') continue;
        // 前もって分かっている出入りだけ（貸倒れのお知らせのような、起きてから分かることは入れない）
        const plan = DUE_PLAN.has(e.kind);
        let t; try { t = val(e.ans, S); } catch (x) { continue; }
        const rows = val(e.doc.rows, S) || [], due = rows.find((x) => x[0] === '支払期日');
        const dn = [...t.cr.filter(([a]) => a === '電子記録債務').map(([, v]) => -v), ...t.dr.filter(([a]) => a === '電子記録債権').map(([, v]) => v)];
        if (due && dn.length) { add({ date: parseDay(due[1]), what: `でんさい：${memo(e, dn[0] < 0)}`, amt: dn[0], fixed: true, top: true }); continue; }
        const v = plan ? bank(t) : 0;
        if (v) add({ date: parseDay(e.doc.date), what: memo(e), amt: v, fixed: DUE_FIXED.has(e.kind), top: ['construction', 'pay_tax', 'dividend_pay'].includes(e.kind) });
      }
    }
    // 社長が約束した支払い（まだ書類が来ていないもの）
    for (const o of (D.__y2 && D.__y2.duePlanned ? D.__y2.duePlanned(S) : [])) add(Object.assign({ fixed: true }, o, { date: parseDay(o.date) }));
    // 帳簿に残っている、払う日が法律で決まっている約束（書類がまだ台本にない月でも、残高から載せる）：法人税等は決算から2か月以内（5月31日）
    const taxBal = -(balances(S.T)['未払法人税等'] || 0);
    if (taxBal > 0 && !items.some((o) => /税金|法人税/.test(o.what))) add({ date: { m: 5, d: 31 }, what: '法人税等の納付（決算から2か月以内。帳簿の未払法人税等）', amt: -taxBal, fixed: true, top: true });
    // 帳簿に残っている払う約束（未払消費税・未払金・買掛金）のうち、これからの書類で払う分を引いた残りも載せる
    // 未払消費税は決算から2か月以内（5月31日）、未払金・買掛金は書類の支払期日（なければ翌月末）
    { const fut = {};
      for (let mi = S.mi; mi < Math.min(D.months.length, S.mi + 6); mi++) {
        const list = mi === S.mi ? evs0.slice(S.ei + 1) : D.months[mi].events.filter((e) => { try { return !e.when || e.when(S); } catch (x) { return false; } });
        for (const e of list) { if (e.t !== 'doc' || !e.ans) continue; let t; try { t = val(e.ans, S); } catch (x) { continue; } for (const [a, v] of t.dr) fut[a] = (fut[a] || 0) + v; }
      }
      const nextEnd = { m: (cur % 12) + 1, d: 31 };
      for (const [acc, what, date] of [['未払消費税', '消費税の納付（決算から2か月以内。帳簿の未払消費税）', { m: 5, d: 31 }], ['未払金', '未払金の支払い（帳簿に残っている分）', null], ['買掛金', '買掛金の支払い（帳簿に残っている分）', null]]) {
        const left = -(balances(S.T)[acc] || 0) - (fut[acc] || 0);
        if (left <= 0 || (acc === '未払消費税' && items.some((o) => /消費税の納付/.test(o.what)))) continue;
        let d = date;
        if (!d) { const src = S.T.filter((t) => t.cr.some(([a]) => a === acc)).map((t) => (allEvents.find(({ e: x }) => x.id === t.ev) || {}).e).filter(Boolean).reverse().map((e) => (val(e.doc && e.doc.rows, S) || []).find((x) => x[0] === '支払期日')).find(Boolean); d = src ? parseDay(src[1]) : nextEnd; }
        add({ date: d, what, amt: -left, fixed: true, top: acc !== '買掛金' });
      }
    }
    // ふだんの出入り（売上・給料・電気代など）は、月ごとに1行にまとめる（約束の期日が見えるように）
    const out = items.filter((o) => o.fixed), byM = {};
    items.filter((o) => !o.fixed).forEach((o) => { const k = o.date.m; byM[k] = byM[k] || { date: { m: k, d: 31 }, what: `${k}月のふだんの出入り（売上・給料など）`, amt: 0, fixed: false }; byM[k].amt += o.amt; });
    out.push(...Object.values(byM).filter((o) => o.amt));
    out.sort((a, b) => key(a.date) - key(b.date) || (a.fixed === b.fixed ? a.amt - b.amt : a.fixed ? 1 : -1));
    return out;
  }
  function dueTable(items, mark) {
    let bal = cashOf(balances(S.T));
    const start = bal;
    let min = { bal: Infinity };
    const rows = items.map((o, k) => { bal += o.amt; if (bal < min.bal) min = { bal, k }; return { o, bal }; });
    const tr = rows.map(({ o, bal: b }, k) => `<tr class="${k === min.k && mark !== false ? 'min' : ''} ${o.fixed ? 'fixed' : ''}"><td>${o.date.m}/${o.date.d === 31 ? '末' : o.date.d}</td><td>${esc(o.what)}</td><td class="n">${o.amt > 0 ? '+' : '−'}${fmt(Math.abs(o.amt))}</td><td class="n ${b < 0 ? 'neg' : ''}">${fmt(b)}</td></tr>`).join('');
    return `<table class="s-tb s-due"><tr><th>期日</th><th>内容</th><th>入る＋<br>出る−</th><th>口座の<br>残り</th></tr><tr><td></td><td>いまの口座のお金</td><td></td><td class="n">${fmt(start)}</td></tr>${tr}</table>`;
  }
  // 一覧を作る（2年目2月）／見直す（3年目4月、手付金のあと）
  function duelistScreen(ev) {
    const items = dueItems();
    const fixed = [...items.filter((o) => o.top), ...items.filter((o) => o.fixed && !o.top)].slice(0, 6).sort((a, b) => items.indexOf(a) - items.indexOf(b));
    const order = fixed.slice().sort(() => Math.random() - 0.5);
    const picked = [];
    let stage = ev.review ? 'table' : 'order', msg = '', ans = null;
    const lowest = () => { let bal = cashOf(balances(S.T)), m = { bal: Infinity }; items.forEach((o, k) => { bal += o.amt; if (bal < m.bal) m = { bal, k, o }; }); return m; };
    const draw = () => {
      let body = '';
      if (stage === 'order') {
        body = `${talk(ev.talk)}<p class="s-q">払う約束・もらう約束を、期日の早い順に押そう。</p><div class="s-desk">${order.map((o) => { const k = picked.indexOf(o); return `<div class="s-deskit ${k >= 0 ? 'on' : ''}" data-do="${order.indexOf(o)}" role="button" tabindex="0"><b>${k >= 0 ? `${k + 1}. ` : ''}${esc(o.what)}</b><small>${o.amt > 0 ? '入る' : '出る'} ${fmt(Math.abs(o.amt))}円・${o.date.m}月${o.date.d === 31 ? '末' : `${o.date.d}日`}</small></div>`; }).join('')}</div>${msg ? `<p class="s-react ng">${esc(msg)}</p>` : ''}`;
      } else {
        const lo = lowest(), opts = [...new Set([lo.k, ...items.map((_, k) => k).filter((k) => k !== lo.k && items[k].fixed).slice(0, 2)])].sort((a, b) => a - b);
        if (!ev.review) { S.dueBuilt = true; save(); body = `${talk([['senpai', '期日の順に並べて、いまの口座のお金から1行ずつ足し引きした表を「資金繰り表」という。もうけの表とはちがう。お金がいつ足りなくなるかを見る表だ。'], ['senpai', 'この表は、上の「期日」からいつでも見られる。新しい約束が増えたら、表も増える。']])}${dueTable(items)}<button class="btn wide" data-n>つぎへ</button>`; frame(`<div class="s-card"><small>期日の一覧</small>${body}</div>`); return; }
        body = `${talk(ev.talk)}${dueTable(items, ans !== null)}<p class="s-q">口座のお金が、いちばん少なくなるのはどこ？</p>${ans === null ? `<div class="s-opts">${opts.map((k) => `<button class="s-opt" data-dl="${k}"><b>${items[k].date.m}月${items[k].date.d === 31 ? '末' : `${items[k].date.d}日`}：${esc(items[k].what)}</b></button>`).join('')}</div>` : `<p class="s-react ${ans === lo.k ? '' : 'ng'}">${ans === lo.k ? 'そう。' : `いちばん少ないのは、${lo.o.date.m}月${lo.o.date.d === 31 ? '末' : `${lo.o.date.d}日`}の「${esc(lo.o.what)}」のあと。`}残りは ${fmt(lo.bal)}円。${lo.bal < 0 ? '口座が足りない。期日の前に手を打たないと、払えない。' : 'その日の前に、口座のお金を減らしすぎないようにする。'}</p><button class="btn wide" data-n>つぎへ</button>`}`;
      }
      frame(`<div class="s-card"><small>期日の一覧</small>${body}</div>`);
    };
    draw();
    app.onclick = (e) => {
      const d = e.target.closest('[data-do]');
      if (d && stage === 'order') {
        const o = order[+d.dataset.do]; if (picked.includes(o)) return;
        const rest = fixed.filter((x) => !picked.includes(x));
        const kd = (x) => fixed.indexOf(x);
        if (kd(o) !== Math.min(...rest.map(kd)) && !(rest.some((x) => x !== o && x.date.m === o.date.m && x.date.d === o.date.d && kd(x) < kd(o)))) { msg = 'もっと早い期日の約束がある。'; draw(); return; }
        picked.push(o); msg = '';
        if (picked.length === fixed.length) stage = 'table';
        draw(); return;
      }
      const l = e.target.closest('[data-dl]');
      if (l && ans === null) { ans = +l.dataset.dl; S.dueBuilt = true; save(); draw(); return; }
      if (e.target.closest('[data-n]')) next();
    };
  }

  /* ---------- 株主資本等変動計算書の本番（docs/YEAR2.md 3.3・付録の ssScreen）：この1年の純資産の動きを、資料から表に埋める ----------
     行＝変動の理由（当期首残高・新株の発行・剰余金の配当・利益準備金の積立・当期純利益・当期末残高）、列＝資本金・資本準備金・利益準備金・繰越利益剰余金・合計（本試験の S/S と同じ向き） */
  const SS_COLS = ['資本金', '資本準備金', '利益準備金', '繰越利益剰余金'];
  const SS_ROWS = [['start', '当期首残高'], ['new', '新株の発行'], ['div', '剰余金の配当'], ['res', '利益準備金の積立'], ['ni', '当期純利益'], ['end', '当期末残高']];
  function ssData() {
    const y = yearOf(S.mi), cr = (e, a) => e.cr.filter(([x]) => x === a).reduce((t, [, v]) => t + v, 0) - e.dr.filter(([x]) => x === a).reduce((t, [, v]) => t + v, 0);
    const M = {}; SS_ROWS.forEach(([r]) => { M[r] = {}; SS_COLS.forEach((c) => { M[r][c] = 0; }); });
    const before = S.T.filter((e) => (e.y || 1) < y);
    SS_COLS.forEach((c) => { M.start[c] = before.reduce((t, e) => t + cr(e, c), 0); });
    const memo = [];
    for (const e of S.T.filter((x) => (x.y || 1) === y && !x.closing)) {
      const dv = Math.max(0, cr(e, '未払配当金')), rs = Math.max(0, cr(e, '利益準備金')), cap = cr(e, '資本金'), cap2 = cr(e, '資本準備金'), re = cr(e, '繰越利益剰余金');
      if (dv) { M.div['繰越利益剰余金'] -= dv; memo.push(['剰余金の配当（株主総会の決議）', dv]); }
      if (rs) { M.res['利益準備金'] += rs; M.res['繰越利益剰余金'] -= rs; memo.push(['利益準備金の積立', rs]); }
      if (cap || cap2) { M.new['資本金'] += cap; M.new['資本準備金'] += cap2; memo.push([`新株の発行（払込 ${fmt(cap + cap2)}円のうち、資本金 ${fmt(cap)}円・資本準備金 ${fmt(cap2)}円）`, cap + cap2]); }
      const rest = re + dv + rs; // 配当と積立のほかに、繰越利益剰余金が動いた分（配当の返還など）
      if (rest && !cap && !cap2) { M.div['繰越利益剰余金'] += rest; memo.push([rest > 0 ? '配当の返還（剰余金の配当の取消し）' : '剰余金の配当', rest]); }
    }
    const ni = pl(balances(S.T.filter((e) => (e.y || 1) === y && !e.closing))).ni;
    M.ni['繰越利益剰余金'] = ni; memo.push(['当期純利益（損益計算書）', ni]);
    SS_COLS.forEach((c) => { M.end[c] = SS_ROWS.slice(0, 5).reduce((t, [r]) => t + M[r][c], 0); });
    return { M, memo };
  }
  function ssScreen(ev) {
    const { M, memo } = ssData();
    // 検算：当期末残高の合計は、貸借対照表の純資産（締め切りの前なので、今年のもうけを足す）と同じ
    // 検算は year2.js の ssCheck（tools/sim-check.js も同じ関数を使う）：当期末残高＝純資産、新株の発行＝払込み、配当の行＝配当
    if (D.__y2 && D.__y2.ssCheck) D.__y2.ssCheck(S, yearOf(S.mi), M).forEach((m) => console.error(m));
    else { const b = balances(S.T.filter((e) => !(e.closing && (e.y || 1) === yearOf(S.mi)))); const eq = SS_COLS.reduce((t, c) => t - (b[c] || 0), 0) + pl(b).ni; const end = SS_COLS.reduce((t, c) => t + M.end[c], 0); if (eq !== end) console.error(`S/S の当期末残高 ${end} が、純資産 ${eq} と合わない`); }
    const blank = new Set();
    for (const [r] of SS_ROWS.slice(1)) for (const c of SS_COLS) if (r !== 'ni' && M[r][c]) blank.add(`${r}:${c}`);
    const vals = {};
    let tries = 0, marks = null;
    const num = (t) => { const z = String(t || '').normalize('NFKC').replace(/[,\s円]/g, ''); if (!/^[-−△▲]?\d+$/.test(z)) return null; const n = parseInt(z.replace(/^[-−△▲]/, ''), 10); return /^[-−△▲]/.test(z) ? -n : n; };
    const cell = (r, c) => { const k = `${r}:${c}`; if (!blank.has(k)) { const v = M[r][c]; return `<td class="n">${v ? (v < 0 ? `△${fmt(-v)}` : fmt(v)) : '—'}</td>`; } return `<td class="n ${marks ? (marks[k] ? 'ok' : 'ng') : ''}"><input data-ssk="${k}" inputmode="text" value="${esc(vals[k] || '')}" aria-label="${esc(c)} の ${esc(SS_ROWS.find((x) => x[0] === r)[1])}"></td>`; };
    const sumRow = (r) => SS_COLS.reduce((t, c) => t + M[r][c], 0);
    const draw = () => {
      const all = marks && Object.values(marks).every(Boolean);
      frame(`<div class="s-card"><small>株主資本等変動計算書</small>${talk(ev.talk)}<h4>資料（この1年）</h4><ul class="s-ssmemo">${memo.map(([t, v]) => `<li>${esc(t)}：${fmt(Math.abs(v))}円</li>`).join('')}</ul><div class="s-sheetwrap"><table class="s-tb s-ss"><tr><th></th>${SS_COLS.map((c) => `<th>${esc(c)}</th>`).join('')}<th>合計</th></tr>${SS_ROWS.map(([r, lab]) => `<tr class="${r === 'start' || r === 'end' ? 'sum' : ''}"><td>${esc(lab)}</td>${SS_COLS.map((c) => cell(r, c)).join('')}<td class="n">${r === 'end' && !all ? '?' : (sumRow(r) < 0 ? `△${fmt(-sumRow(r))}` : fmt(sumRow(r)))}</td></tr>`).join('')}</table></div><p class="muted" style="font-size:12px;margin:0">表は横に動かせる（右に利益準備金・繰越利益剰余金・合計）。減った分は「−」か「△」をつけて書く。当期末残高は、上の行を足した額。</p>${all ? `<p class="s-react">表がそろった。当期末残高の合計 ${fmt(sumRow('end'))}円は、貸借対照表の純資産と同じ。</p><button class="btn wide" data-n>つぎへ</button>` : `${marks ? `<p class="s-react ng">赤いマスがちがう。${tries >= 2 ? '赤いマスに、正しい数字を入れておいた。たしかめてから、もう一度。' : '資料のどの行の数字かを、もう一度見よう。'}</p>` : ''}<button class="btn wide" data-sscheck>たしかめる</button>`}</div>`);
    };
    draw();
    app.oninput = (e) => { const k = e.target.dataset && e.target.dataset.ssk; if (k) vals[k] = e.target.value; };
    app.onclick = (e) => {
      if (e.target.closest('[data-sscheck]')) {
        tries++;
        marks = {};
        for (const k of blank) { const [r, c] = k.split(':'); marks[k] = num(vals[k]) === M[r][c]; }
        if (tries >= 2) for (const k of blank) if (!marks[k]) { const [r, c] = k.split(':'); vals[k] = M[r][c] < 0 ? `△${M[r][c] * -1}` : String(M[r][c]); }
        const m = (S.metrics.ss = S.metrics.ss || {}); if (m.first == null) m.first = Object.values(marks).every(Boolean);
        save(); draw(); return;
      }
      if (e.target.closest('[data-n]')) { S.diary.push({ m: '決算', t: `株主資本等変動計算書：返さないお金の当期末残高 ${fmt(sumRow('end'))}円` }); next(); }
    };
  }

  /* ---------- 監査の点検（docs/CLASSIC-MIGRATION.md 3章：旧版のボス戦の変形。HP・時間切れはない） ----------
     社長が自分で書いた書類と、ふだんの書類（自動仕訳を含む）を混ぜて6枚。あやしいものを選び、答え合わせのあと、ちがっていたものを書き直す。
     見落としたものも、森さんが示して書き直す（帳簿は最後には正しくなる）。結果は S.audits と S.fixLog（audit: true）に残る */
  function auditScreen(ev) {
    const traps = ev.traps.map((id) => S.L.find((l) => l.id === id + '@' + S.mi)).filter(Boolean);
    const trapIds = new Set(traps.map((x) => x.id));
    // ふだんの書類：今年の、記帳が書類と合っているもの。自動仕訳を先に、種類がちがうものを3枚
    const kinds = new Set();
    const normal = S.L.filter((l) => l.y === yearOf(S.mi) && !trapIds.has(l.id) && l.kind && !l.closing && sameEntry(l, S.T.find((t) => t.id === l.id) || { dr: [], cr: [] })).sort((a, b) => (b.auto ? 1 : 0) - (a.auto ? 1 : 0) || b.mi - a.mi).filter((l) => (kinds.has(l.kind) ? false : (kinds.add(l.kind), true))).slice(0, 3);
    const seed = S.mi * 7 + 3;
    const items = [...traps, ...normal].map((x, k) => ({ x, k: (k * 5 + seed) % 11 })).sort((a, b) => a.k - b.k).map((o) => o.x);
    const evOf = (x) => (allEvents.find(({ e }) => e.id === x.ev) || {}).e || {};
    const sel = new Set();
    let checked = false;
    const card = (x) => { const e = evOf(x), d = e.doc || {}; const rows = (val(d.rows, S) || []).filter((r) => r[2] === 'amt' || r[0] === '摘要' || r[0] === '品名').slice(0, 3); const bad = trapIds.has(x.id); const on = sel.has(x.id);
      return `<div class="s-deskit ${on ? 'on' : ''} ${checked ? (on === bad ? 'ok' : 'ng') : ''}" data-ak="${esc(x.id)}" role="button" tabindex="0" aria-pressed="${on}"><b>${gloss(`${d.type || ''}（${d.date || ''}）`)}</b><small>${rows.map((r) => `${esc(r[0])}：${typeof r[1] === 'number' ? fmt(r[1]) : esc(r[1])}`).join('　')}</small>${jeTable(x)}${checked ? `<small class="muted">${x.pres ? '社長が書いた' : x.auto ? '自動で書いた' : 'ピヨが書いた'}</small>` : ''}${checked ? `<em>${bad ? `直す：${esc(e.auditWhy || '')}` : '合っている'}</em>` : ''}</div>`; };
    const draw = () => {
      const found = traps.filter((x) => sel.has(x.id)).length, extra = [...sel].filter((id) => !trapIds.has(id)).length;
      const res = checked ? `<p class="s-react ${found === traps.length && !extra ? '' : 'ng'}">${found === traps.length && !extra ? 'あやしい書類を、ぜんぶ見つけた。' : `ちがっていたのは${traps.length}枚。見つけたのは${found}枚${extra ? `、合っているのに選んだのが${extra}枚` : ''}。`}</p>${talk([['kansa', found === traps.length ? '自動仕訳と同じ形でも、中身がちがう取引でしたね。では、書き直しましょう。' : '形が同じだと、見落としやすいんです。ちがっていた書類を、書き直しましょう。']])}<button class="btn wide" data-afix>書き直す</button>` : `<button class="btn wide" data-acheck ${sel.size ? '' : 'disabled'}>選んだ書類を、森さんと確かめる</button>`;
      frame(`<div class="s-card">${talk(ev.talk)}<p class="s-q">帳簿の${items.length}枚。書類とちがう書き方をしているのは、どれ？（いくつでも）</p><div class="s-desk">${items.map(card).join('')}</div>${res}</div>`);
    };
    const fixNext = () => {
      const x = traps.find((t) => !sameEntry(S.L.find((l) => l.id === t.id), S.T.find((y) => y.id === t.id)));
      if (!x) {
        const found = traps.filter((t) => sel.has(t.id)).map((t) => t.ev), missed = traps.filter((t) => !sel.has(t.id)).map((t) => t.ev);
        (S.audits = S.audits || {})[ev.id] = { mi: S.mi, found, missed, extra: [...sel].filter((id) => !trapIds.has(id)).length };
        traps.filter((t) => !sel.has(t.id)).forEach((t) => S.fixLog.push({ ev: t.ev, kind: evOf(t).kind, mi: S.mi, audit: true }));
        missed.forEach((id) => { S.metrics.forks['自動仕訳の形に見える別の取引'] = (S.metrics.forks['自動仕訳の形に見える別の取引'] || 0) + 1; });
        S.diary.push({ m: month().label, t: `監査の点検：社長が書いた${traps.length}枚のうち${found.length}枚を見つけ、書き直した` });
        save(); return next();
      }
      docScreen(evOf(x), fixNext);
    };
    draw();
    app.onclick = (e) => {
      if (e.target.closest('[data-gl]')) return;
      const d = e.target.closest('[data-ak]');
      if (d && !checked) { const id = d.dataset.ak; if (sel.has(id)) sel.delete(id); else sel.add(id); draw(); return; }
      if (e.target.closest('[data-acheck]')) { checked = true; save(); draw(); return; }
      if (e.target.closest('[data-afix]')) fixNext();
    };
  }
  function deskScreen(ev) {
    const sel = new Set(); let checked = false;
    const draw = () => {
      const res = checked ? ev.items.map((it) => ({ it, ok: sel.has(it.id) === it.need })) : null;
      const allOk = res && res.every((r) => r.ok);
      frame(`<div class="s-card">${talk(ev.talk)}<p class="s-q">${esc(ev.q)}</p><div class="s-desk">${ev.items.map((it, k) => { const r = res && res[k]; return `<div class="s-deskit ${sel.has(it.id) ? 'on' : ''} ${r ? (r.ok ? 'ok' : 'ng') : ''}"><button class="s-dkbtn" data-dk="${it.id}" aria-pressed="${sel.has(it.id)}"><b>${sel.has(it.id) ? '✓ 選んだ ' : ''}${esc(it.title)}</b><small>${esc(val(it.line, S))}</small></button>${gloss(it.title) !== esc(it.title) ? `<span class="s-dkg">言葉の説明：${gloss(it.title)}</span>` : ''}${r ? `<em>${it.need ? '直す' : '直さない'}：${esc(it.why)}</em>` : ''}</div>`; }).join('')}</div>${!checked ? `<button class="btn wide" data-dkc ${sel.size ? '' : 'disabled'}>これで確かめる</button>` : allOk ? `${talk([['kansa', '全部見つけたね。直すものから、順に片づけよう。']])}<button class="btn wide" data-n>片づけはじめる</button>` : `${talk([['kansa', `見落とし・選びすぎが ${res.filter((r) => !r.ok).length} つある。理由を読んで、もう一度選んでみて。`]])}<button class="btn wide ghost" data-dkr>もう一度選ぶ</button>`}</div>`);
    };
    draw();
    app.onclick = (e) => {
      if (e.target.closest('[data-gl]')) return; // 書類の言葉の説明は、選ぶこととは別
      const d = e.target.closest('[data-dk]');
      if (d && !checked) { const id = d.dataset.dk; if (sel.has(id)) sel.delete(id); else sel.add(id); draw(); return; }
      if (e.target.closest('[data-dkc]')) { checked = true; const m = (S.metrics.desk = S.metrics.desk || { tries: 0 }); m.tries++; if (m.first == null) m.first = ev.items.every((it) => sel.has(it.id) === it.need); save(); draw(); return; }
      // もう一度選ぶ：前に選んだ印は残す（2回目の検査：全部消えて、足りない分だけ足そうとした人が困った）
      if (e.target.closest('[data-dkr]')) { checked = false; draw(); return; }
      if (e.target.closest('[data-n]')) next();
    };
  }
  function monthIntro() {
    const m = month();
    // ラーメン版の店の月：月の順は「作戦の机→書類→札→想起→月報」（c.7）。想起は月の中の出来事（recall）にした
    if (RUI && m.ramenT != null) return RUI.monthIntro(() => { S.phase = 'event'; S.ei = 0; save(); render(); });
    frame(`<div class="s-card s-intro"><small>${esc(m.label)}</small><h2>${esc(fill(m.title))}</h2><button class="btn wide" data-go>${S.mi === 0 ? '屋台へ行く' : '机に向かう'}</button></div>`);
    app.onclick = (e) => { if (e.target.closest('[data-go]')) { S.phase = 'recall'; S.ei = 0; save(); render(); } };
  }
  // 月のはじめに、先月の書類と同じ種類を、金額を変えて1つ思い出して書く（想起。答えは書いたあとに見せる）
  /* ---- 想起の予定表（S.plan。docs/DESIGN-ROUND2.md 3.8）----
     項目は書類の型（kind）ごと。{ lastOk, lastMiss, n（正解の連続数）, due（次に出す実時間） }。
     月はじめの思い出すは、①前に間違えた型 ②間隔が来た型（7→30→90日）③自動仕訳にした型 ④それより前の月の書類、の順で選ぶ。
     試験に出ない型（2号店のポイント＝1級）は出さない。同じ型を2か月続けて出さない（交互に） */
  const PLAN_OUT = new Set(['cash_sale_point', 'point_use']);
  const PLAN_GAP = [7, 30, 90].map((d) => d * 864e5);
  function planMark(kind, ok, from) {
    if (!kind) return;
    S.plan = S.plan || {};
    const p = (S.plan[kind] = S.plan[kind] || { n: 0 }), now = Date.now();
    if (ok) { p.lastOk = now; p.n = (p.n || 0) + 1; p.due = now + PLAN_GAP[Math.min(PLAN_GAP.length - 1, p.n - 1)]; }
    else { p.lastMiss = now; p.n = 0; p.due = now; }
    p.from = from || p.from;
  }
  function planPick(cands) {
    // cands：[{ kind, ... }]（新しい順でなくてよい）。選ぶ順に並べて先頭を返す
    S.plan = S.plan || {};
    const now = Date.now(), lastKinds = (S.recall || []).filter((r) => r.kind).slice(-1).map((r) => r.kind);
    const rank = (o) => { const p = S.plan[o.kind] || {}; if (p.lastMiss && (!p.lastOk || p.lastMiss > p.lastOk)) return 0; if (p.due && p.due <= now) return 1; if (S.rules[o.kind]) return 2; return 3; };
    const pool = cands.filter((o) => !PLAN_OUT.has(o.kind));
    const fresh = pool.filter((o) => !lastKinds.includes(o.kind));
    const list = (fresh.length ? fresh : pool).map((o) => ({ o, r: rank(o) }));
    // 同じ順位の中では、古い月の書類から（間隔をあける）
    list.sort((x, y) => x.r - y.r || x.o.mi - y.o.mi);
    return list.length ? list[0].o : null;
  }
  function recallScreen(done) {
    S.recall = S.recall || [];
    if (S.recall.some((r) => r.mi === S.mi && !r.due)) return done();
    // 7日前後たった、間違えた論点の別の問題があれば、先にそれを1問
    const due = dueReview();
    if (due && !S.recall.some((r) => r.mi === S.mi && r.due)) {
      S.recall.push({ mi: S.mi, due: due._key }); save();
      if (due._key.startsWith('exam:')) {
        // 検定会場の大問：同じ型の別の大問を、自分で（時間なし）解き直すかを聞く
        frame(`<div class="s-card"><small>日をあけて確かめる</small>${talk([['senpai', `前に検定会場で間違えた大問と同じ型の「${due.title}」がある。日をあけて解けたら、本当に身についている。`]])}<button class="btn wide" data-dueplay>検定会場で解き直す</button><button class="link" data-duelater>今はやめて、今月へ</button></div>`);
        app.onclick = (e) => { if (e.target.closest('[data-dueplay]')) hallScreen({ play: { part: due.part, mode: 'self', key: due._key } }); else if (e.target.closest('[data-duelater]')) recallScreen(done); };
        return;
      }
      return quickQuiz([due], '日をあけて確かめる', () => recallScreen(done));
    }
    // 候補：これまでの月に手で書いた書類（型ごとに、いちばん新しい1枚）。選ぶ順は planPick
    const prev = S.L.filter((x) => x.mi < S.mi && x.kind && !x.auto).map((x) => ({ x, ev: (allEvents.find(({ e }) => e.id === x.ev) || {}).e })).filter((o) => o.ev && o.ev.doc && o.ev.opts && !(o.ev.noRecallIf && o.ev.noRecallIf(S))); // 社長の言うとおりにした誤った書き方（例：点検の分まで今年の売上）は、思い出す練習の手本にしない（オーナーの決定1）
    const byKind = {};
    prev.filter((o) => { const t = S.T.find((y) => y.id === o.x.id); return t && [...t.dr, ...t.cr].every(([a]) => knows(a)); }).forEach((o) => { byKind[o.x.kind] = o; });
    const chosen = planPick(Object.values(byKind).map((o) => ({ kind: o.x.kind, mi: o.x.mi, o })));
    const pick = chosen && chosen.o;
    if (!pick) return done();
    const t = S.T.find((y) => y.id === pick.x.id), k = S.mi % 2 ? 3 : 2;
    // 同じ名前の書類が先月に何枚あっても1つに決まるように、日付と相手をつけて指す
    const pd = val(pick.ev.doc, S) || {}, who = pd.from && !/ピヨ/.test(pd.from) ? pd.from : (pd.to && !/ピヨ/.test(pd.to) ? pd.to : ''), docName = `${pd.date ? pd.date + 'の' : ''}${who ? who + 'の' : ''}「${pd.title}」`;
    const truth = { dr: t.dr.map(([a, v]) => [a, v * k]), cr: t.cr.map(([a, v]) => [a, v * k]) };
    const opts = [...new Set([...(pick.ev.opts || []), ...truth.dr.map((x) => x[0]), ...truth.cr.map((x) => x[0])])].filter(knows).sort((a, b) => order(a) - order(b));
    RECALL = { kind: pick.x.kind, truth }; // 検査の道具（tools・scratchpad の通し試験）が想起の答えを読むため
    const opt = `<option value="">札をえらぶ</option>${opts.map((a) => `<option>${esc(a)}</option>`).join('')}`;
    const side = (sd) => [...Array(Math.max(2, truth[sd].length)).keys()].map((i) => `<div class="s-row"><select data-s="${sd}" aria-label="${sd === 'dr' ? '借方' : '貸方'}の札">${opt}</select><input data-s="${sd}" inputmode="numeric" placeholder="金額" aria-label="${sd === 'dr' ? '借方' : '貸方'}の金額"></div>`).join('');
    frame(`<div class="s-card"><small>${esc(month().label)}のはじめに 思い出す</small>${talk([['senpai', `${pick.x.mi === S.mi - 1 ? '先月' : ((D.months[pick.x.mi] || {}).label || '前') + '（' + (S.mi - pick.x.mi) + 'か月前）'}の${docName}を思い出して。同じ種類の書類で、金額が下の数だったら、どう書く？ 書類は見ないで。`]])}${D.examText && D.examText[pick.x.kind] ? `<p class="s-q">本試験の文の形で：${esc(D.examText[pick.x.kind](truth))}</p>` : ''}<p class="s-recall-amt">使う金額（順不同）：${[...new Set([...truth.dr, ...truth.cr].map(([, v]) => v))].sort(() => Math.random() - 0.5).map((v) => `<b>${fmt(v)}</b>円`).join('・')}</p>${''}<div class="s-entry"><div class="s-cols"><div class="s-side dr"><h4>借方（左）</h4>${side('dr')}</div><div class="s-side cr"><h4>貸方（右）</h4>${side('cr')}</div></div></div><div data-res></div><button class="btn wide" data-rc>書いた</button><button class="link" data-rskip>思い出せないので、今月へ進む</button></div>`);
    app.onclick = (e) => {
      if (e.target.closest('[data-rnext]')) { done(); return; }
      const skip = e.target.closest('[data-rskip]');
      if (!skip && !e.target.closest('[data-rc]')) return;
      const entry = { dr: [], cr: [] };
      for (const sd of ['dr', 'cr']) { const sel = $$(`select[data-s="${sd}"]`, app), ins = $$(`input[data-s="${sd}"]`, app); sel.forEach((x, i) => { const v = Number((ins[i].value || '').normalize('NFKC').replace(/[^\d]/g, '')); if (x.value && v) entry[sd].push([x.value, v]); }); }
      const ok = !skip && entry.dr.length && entry.cr.length && sameEntry(entry, truth);
      S.recall.push({ mi: S.mi, kind: pick.x.kind, ok: !!ok, skipped: !!skip }); planMark(pick.x.kind, !!ok, 'recall');
      // 月はじめの想起は、正解も誤りも examLog に入れる（DESIGN-RAMEN i.4・X10、オーナーの決定 n.20：条件A「日をあけても書けた」の入口）。思い出せないで飛ばしたのは誤り
      if (pick.x.kind) S.examLog.push({ key: 'auto:' + pick.x.kind, ok: !!ok, t: Date.now(), from: 'recall', ...(skip ? { skipped: true } : {}) });
      save();
      $('[data-res]', app).innerHTML = `${ok ? `<p class="s-react">思い出せた。書き方はこれで合っている（金額は${k}倍）。</p>${jeTable(truth)}` : skip ? `<p class="s-react ng">前の書き方は、こうだった（金額は${k}倍）。</p>${jeTable(truth)}` : missHTML(entry, truth, `前の書き方（金額は${k}倍）`)}<button class="btn wide" data-rnext>今月へ</button>`;
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
    // 売れた額・使った額は、段の中の判断（choice の sale・cost）で決まる。ラーメン版は台本の sale0・cost0 が既定
    let i = 0, sub = {}, msg = '', done = false, sale = ev.sale0 != null ? ev.sale0 : Number(S.decisions.price === '200' ? 1600 : 2000), cost = ev.cost0 || 0;
    const amt = (a) => (a === 'sale' ? sale : a === 'cost' ? cost : a === '-cost' ? -cost : a);
    // 3級既習の近道（PEDAGOGY 1.10）：発見は飛ばさず、ev.lite に書いた段だけ縮める（ラーメン版）
    const skipStep = (k) => !isReplay && S.pro3 && S.pro3.on && (ev.lite || []).includes(k);
    const sum = (list) => list.reduce((t, x) => t + x.amt, 0);
    const coin = (d) => { const c = st.L.find((x) => x.id === 'coin'); if (c) c.amt += d; };
    // 戻る・取り消すで棚が二重にならないように、段の始まりと一手ごとの状態を取っておく
    const snap = () => JSON.stringify({ st, sale, cost, sub });
    const restore = (j) => { const o = JSON.parse(j); st.L = o.st.L; st.R1 = o.st.R1; st.R0 = o.st.R0; sale = o.sale; cost = o.cost || 0; sub = o.sub; };
    let stepStart = [snap()], subs = [];
    let hist = [];
    const mark = () => hist.push(snap());
    // プロローグの途中（どの段まで進み、棚に何を並べたか）は S.drafts に残す。途中で閉じても、同じ段の同じ棚から
    S.drafts = S.drafts || {};
    const bk = `board:${ev.id}`;
    if (!isReplay && S.drafts[bk]) { const o = S.drafts[bk]; restore(o.snap); i = o.i; stepStart = o.stepStart; subs.push(...o.subs); hist = o.hist; }
    const keepBoard = () => { if (!isReplay) { S.drafts[bk] = { snap: snap(), i, stepStart, subs, hist }; save(); } };
    const shelf = (showR) => `<div class="s-board"><div class="s-shelf"><h4>もっているもの</h4>${st.L.map((x) => `<div class="s-item">${esc(x.label)}<b>${fmt(x.amt)}</b></div>`).join('') || '<em>（からっぽ）</em>'}<div class="s-sum">${fmt(sum(st.L))}</div></div>${showR ? `<div class="s-shelf r"><h4>どこから来たか</h4><div class="s-row2"><small>返すお金</small>${st.R1.map((x) => `<div class="s-item">${esc(x.label)}<b>${fmt(x.amt)}</b></div>`).join('')}</div><div class="s-row2"><small>返さないお金（じぶんのお金）</small>${st.R0.map((x) => `<div class="s-item">${esc(x.label)}<b>${fmt(x.amt)}</b></div>`).join('')}</div><div class="s-sum">${fmt(sum(st.R1) + sum(st.R0))}</div></div>` : ''}</div>`;
    const ART = { steam: '<svg class="s-art" viewBox="0 0 120 80" role="img" aria-label="湯気の立つラーメンの丼"><path d="M44 14c-6 6 6 10 0 18M60 8c-6 7 6 12 0 22M76 14c-6 6 6 10 0 18" fill="none" stroke="#9aa" stroke-width="3" stroke-linecap="round"><animate attributeName="stroke-opacity" values="0.3;0.9;0.3" dur="2.4s" repeatCount="indefinite"/></path><path d="M18 40h84a42 30 0 0 1-84 0z" fill="#c4442a"/><path d="M18 40h84" stroke="#e8c070" stroke-width="5"/><ellipse cx="46" cy="40" rx="10" ry="3" fill="#f3e3b5"/><ellipse cx="74" cy="40" rx="8" ry="3" fill="#8a5a3a"/><rect x="52" y="68" width="16" height="6" rx="2" fill="#7a2a1a"/></svg>' };
    const draw = () => {
      keepBoard();
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
      frame(`<div class="s-card">${s.art && ART[s.art] ? ART[s.art] : ''}${talk(s.say)}${s.q && !(ready && s.k !== 'card') ? `<p class="s-q">${esc(fill(s.q))}</p>` : ''}${body}${msg ? `<p class="s-react ng">${esc(msg)}</p>` : ''}${after}${ready ? '<button class="btn wide" data-step>つぎへ</button>' : ''}${hist.length ? '<button class="btn ghost sm" data-undo>ひとつ取り消す</button>' : ''}${i > 0 ? '<button class="btn ghost sm" data-back>← もどる</button>' : ''}</div>`);
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
      if (g('[data-pick]')) { const o = s.opts.find((x) => x.id === g('[data-pick]').dataset.pick); mark(); sub.pick = o.id; sale = o.sale; if (o.cost != null) cost = o.cost; if (!isReplay) S.decisions[s.id || 'price'] = o.id; msg = ''; draw(); return; }
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
      if (g('[data-back]')) { restore(stepStart[i]); i--; while (i > 0 && skipStep(i)) i--; sub = subs[i] || {}; hist = []; msg = ''; draw(); return; }
      if (g('[data-step]')) {
        if (s.k === 'card' && !isReplay) { teach(s.teaches); if (!S.leaves.some((l) => l.label === s.leaf.label)) S.leaves.push({ p: s.leaf.p, label: s.leaf.label, mi: S.mi }); }
        if (i + 1 < ev.steps.length) { subs[i] = JSON.parse(JSON.stringify(sub)); i++; while (i + 1 < ev.steps.length && skipStep(i)) { subs[i] = {}; i++; } sub = {}; hist = []; stepStart[i] = snap(); msg = ''; draw(); return; }
        if (isReplay) { render(); return; }
        if (!done && ev.next) { done = true; frame(`<div class="s-card">${talk(ev.next)}<button class="btn wide" data-fin>つぎへ</button></div>`); app.onclick = (x) => { if (x.target.closest('[data-fin]')) { S.discDone[ev.id] = S.mi; next(); } }; return; }
        S.discDone[ev.id] = S.mi; delete S.drafts[bk]; next();
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
  /* ---------- 札で見る（旧版の勘定科目図鑑の変形：docs/CLASSIC-MIGRATION.md 2章、PEDAGOGY 4.2） ----------
     教わった札だけ。原理ごとに並べ、1枚ごとに、生まれた場面・兄弟との違い・決算書での位置・自分の記録 */
  const cardOrigin = (a) => {
    const hit = allEvents.find(({ e }) => (e.t === 'discover' || e.t === 'board') && ((e.b4 && e.b4.teaches) || e.teaches || []).includes(a));
    return hit ? { p: hit.e.p || 'P1', id: hit.e.id, mi: hit.mi } : null;
  };
  const cardSibs = (a) => B.siblings.filter((sb) => sb.accs.includes(a));
  function cardsView(q) {
    const accs = S.taught.filter((w) => B.accounts[w] && (!q || w.includes(q) || (LX.kana && String(LX.kana(w) || '').includes(q))));
    const groups = {};
    for (const a of accs) { const o = cardOrigin(a); const k = o ? o.p : 'doc'; (groups[k] = groups[k] || []).push(a); }
    const keys = [...Object.keys(D.principles).filter((k) => groups[k]), ...(groups.doc ? ['doc'] : [])];
    const sec = (k) => `<section class="s-cardsec"><h4>${esc(k === 'doc' ? '書類を書く中で見つけた札' : `${D.principles[k].q}（${D.principles[k].name}）`)}</h4><div class="s-cardgrid">${groups[k].sort((x, y) => order(x) - order(y)).map((a) => `<button class="s-cardbtn" data-card="${esc(a)}"><b>${rb(a)}</b><small>${esc(CONTRA.has(a) ? 'マイナスの札' : gw(cat(a)))}</small></button>`).join('')}</div></section>`;
    return `<p class="muted s-mapnote">これまでに見つけた札。押すと、生まれた場面や、まちがえやすい兄弟との違いが見られる。</p><input class="s-cardq" data-cardq placeholder="札の名前でさがす" value="${esc(q || '')}">${keys.length ? keys.map(sec).join('') : '<p class="muted">見つからない。</p>'}`;
  }
  function cardDetail(a) {
    const o = cardOrigin(a);
    const firstL = S.L.find((x) => [...x.dr, ...x.cr].some(([k]) => k === a));
    const born = o && S.discDone[o.id] != null ? `<p>${esc(monthLabel(S.discDone[o.id]))}に、会社で見つけた。</p><button class="btn wide ghost" data-replay="${esc(o.id)}">生まれた場面をもう一度</button>` : firstL ? `<p>${esc(monthLabel(firstL.mi))}に、書類を書く中で見つけた。</p>` : '';
    const sibs = cardSibs(a).map((sb) => { const others = sb.accs.filter((x) => x !== a); return others.every((x) => knows(x)) ? `<li><span>${others.map((x) => `<button class="s-pill" data-card="${esc(x)}">${rb(x)}</button>`).join('')}</span><p>${esc(sb.line)}</p></li>` : '<li class="muted">まだ出会っていない兄弟がある。</li>'; });
    const KB = B.kubun;
    const show = KB.show[a] && knows('表示科目') ? `<p>決算書では「${esc(KB.show[a])}」と書く。</p>` : '';
    const isPL = ['収益', '費用'].includes(cat(a));
    const other = cat(a) === 'その他' && !CONTRA.has(a) ? (/差異/.test(a) ? '年の終わりに売上原価に足し引きするので、決算書には残らない' : '工場の途中の箱。作った物の原価へ移すので、決算書には残らない') : null;
    const where = other || (knows('流動資産') || knows('販売費及び一般管理費') ? (isPL ? KB.plOf(a) : KB.bsOf(a)) : knows('損益計算書') ? (isPL ? '損益計算書' : '貸借対照表') : isPL ? '1年のもうけの中身' : '1年の終わりの棚の絵');
    const ctx = KB.byContext[a] && knows('営業外費用') ? `<p class="muted">${esc(KB.byContext[a].map(([w, bin]) => `${w}の分なら${bin}`).join('、'))}。</p>` : '';
    // 自分の記録：書類を1回目で正しく書けた数（この札が答えにある書類）
    const logs = S.docLog.filter((l) => { const ev = (allEvents.find(({ e }) => e.id === l.ev) || {}).e; if (!ev || !ev.ans) return false; try { const t = val(ev.ans, S); return [...t.dr, ...t.cr].some(([k]) => k === a); } catch (x) { return false; } });
    const auto = Object.keys(S.rules).filter((k) => allEvents.some(({ e }) => e.kind === k && e.ans && (() => { try { const t = val(e.ans, S); return [...t.dr, ...t.cr].some(([x]) => x === a); } catch (x) { return false; } })()));
    return `<h3>${rb(a)}</h3><p class="muted">${esc(CONTRA.has(a) ? 'マイナスの札' : gw(cat(a)))}の札。${esc((B.accounts[a] || {}).d || '')}</p>${born}${sibs.length ? `<h4>まちがえやすい兄弟</h4><ul class="s-sibs">${sibs.join('')}</ul>` : ''}<h4>決算書のどこ？</h4><p>${esc(where || '')}</p>${show}${ctx}<h4>自分の記録</h4><p>${logs.length ? `この札が出る書類を、1回目で正しく書けた：${logs.filter((l) => l.ok).length} / ${logs.length}` : 'まだ書類で書いていない。'}${auto.length ? '　自動で書く書類にも出てくる。' : ''}</p>${ledgerView(a)}`;
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
    // 打ちかけの札と金額は S.drafts に残す（途中で閉じても、開き直すと同じ所から）。記帳したら消す
    S.drafts = S.drafts || {};
    const dkey = `${ev.id}@${S.mi}${fixMode ? ':fix' : ''}`, dr0 = S.drafts[dkey];
    const rows = dr0 ? JSON.parse(JSON.stringify(dr0)) : { dr: prev ? prev.dr.map(([a, v]) => ({ a, v })) : [{ a: '', v: '' }], cr: prev ? prev.cr.map(([a, v]) => ({ a, v })) : [{ a: '', v: '' }] };
    const keepDraft = () => { S.drafts[dkey] = rows; save(); };
    let active = null, hintLv = 0, tries = 0, panel = '';
    const optHTML = (sel) => `<option value="">札をえらぶ</option>${opts.map((a) => `<option ${a === sel ? 'selected' : ''}>${esc(a)}</option>`).join('')}`;
    const totals = () => ({ d: rows.dr.reduce((t, r) => t + (Number(r.v) || 0), 0), c: rows.cr.reduce((t, r) => t + (Number(r.v) || 0), 0) });
    const balText = (d, c) => (d === c && d > 0 ? '左と右が同じ数になった' : `左 ${fmt(d)} ／ 右 ${fmt(c)}`);
    const draw = () => {
      const { d, c } = totals();
      const side = (s) => rows[s].map((r, i) => `<div class="s-row"><select data-s="${s}" data-i="${i}" aria-label="${s === 'dr' ? '借方' : '貸方'}の札">${optHTML(r.a)}</select><input data-s="${s}" data-i="${i}" inputmode="numeric" placeholder="金額" value="${esc(r.v)}" aria-label="${s === 'dr' ? '借方' : '貸方'}の金額" class="${active && active.s === s && active.i === i ? 'act' : ''}"></div>`).join('') + (rows[s].length < 3 ? `<button class="s-add" data-add="${s}">＋行をふやす</button>` : '');
      $('.s-entry', app).innerHTML = `<div class="s-cols"><div class="s-side dr"><h4>借方（左） <span class="s-tot">${fmt(d)}</span></h4>${side('dr')}</div><div class="s-side cr"><h4>貸方（右） <span class="s-tot">${fmt(c)}</span></h4>${side('cr')}</div></div><div class="s-bal ${d === c && d > 0 ? 'even' : ''}">${balText(d, c)}</div>`;
      $('.s-panel', app).innerHTML = panel;
      $('.s-actions', app).hidden = !!panel;
    };
    // 並べ方：スマホは縦1列。広い画面（css/sim.css の .s-docgrid）では、左に書類、右に仕訳の入力と返し
    frame(`<div class="s-card s-docscreen">${fixMode ? '<p class="s-fix">森さん「この書類、もう一度見てみよう」</p>' : ''}<p class="s-ask">この書類の出来事を、帳簿に書こう。金額は、書類の数字を押しても入る。</p>${!fixMode && ev.manual && S.rules[ev.kind] ? '<p class="s-why-off" style="text-align:left">自動仕訳に登録した型だけれど、大口の注文・初めての相手の書類は、パソコンにまかせずに手で書く（金額や条件がいつもと違うことがあるため）。</p>' : ''}<div class="s-docgrid"><div class="s-docpane">${docHTML(ev.doc, true)}</div><div class="s-workpane"><div class="s-entry"></div><div class="s-hint" hidden></div><div class="s-panel"></div><div class="s-actions"><button class="btn ghost" data-hint>ヒント</button><button class="btn" data-ok>帳簿に書く</button></div><button class="link" data-cards>札の一覧を見る</button></div></div></div>`);
    draw();
    // Enter：金額の欄で押すと、左右がそろっていれば記帳、そろっていなければ次の欄へ（最後の欄なら記帳を試して理由を出す）
    app.onkeydown = (e) => {
      if (e.key !== 'Enter' || e.isComposing || !e.target.matches('input[data-s]') || $('.s-actions', app).hidden) return;
      e.preventDefault();
      const { d, c } = totals();
      const fields = $$('.s-entry [data-s]', app), k = fields.indexOf(e.target);
      if ((d === c && d > 0) || k < 0 || k === fields.length - 1) { $('[data-ok]', app).click(); return; }
      fields[k + 1].focus();
    };
    app.oninput = (e) => {
      const x = e.target.closest('[data-s]');
      if (!x) return;
      const r = rows[x.dataset.s][+x.dataset.i];
      if (x.tagName === 'SELECT') r.a = x.value; else r.v = x.value.normalize('NFKC').replace(/[^\d]/g, '');
      keepDraft();
      const { d, c } = totals();
      $('.s-bal', app).className = 's-bal' + (d === c && d > 0 ? ' even' : '');
      $('.s-bal', app).textContent = balText(d, c);
      $$('.s-side h4 .s-tot', app)[0].textContent = fmt(d); $$('.s-side h4 .s-tot', app)[1].textContent = fmt(c);
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
        tap.classList.add('used'); active = null; keepDraft(); draw(); return;
      }
      const add = e.target.closest('[data-add]');
      if (add) { rows[add.dataset.add].push({ a: '', v: '' }); keepDraft(); draw(); return; }
      if (e.target.closest('[data-hint]')) return hint();
      if (e.target.closest('[data-cards]')) { mapTab = 'c'; mapOverlay(); return; }
      if (e.target.closest('[data-redo]')) { panel = ''; draw(); return; }
      if (e.target.closest('[data-n]')) { next(); return; }
      if (e.target.closest('[data-ok]')) {
        const entry = { dr: rows.dr.filter((r) => r.a && Number(r.v)).map((r) => [r.a, Number(r.v)]), cr: rows.cr.filter((r) => r.a && Number(r.v)).map((r) => [r.a, Number(r.v)]) };
        const d = entry.dr.reduce((t, x) => t + x[1], 0), c = entry.cr.reduce((t, x) => t + x[1], 0);
        if (!entry.dr.length || !entry.cr.length || d !== c) { const bl = $('.s-bal', app); bl.textContent = !entry.dr.length || !entry.cr.length ? '左と右の両方に、札と金額を入れよう' : '左と右を同じ数にしてから書こう'; bl.classList.add('shake'); setTimeout(() => bl.classList.remove('shake'), 400); return; }
        // 別の書き方でも正しいもの（ev.alts：[{ entry, note }]）。通ったら帳簿には正解の形で書き、試験での書き方を一言そえる
        // 会社の書き方（alt）は、台本の ev.alts と書き方の規範の表（B.kubun.examForm。docs/DESIGN-ROUND2.md 6章）から
        const altHit = sameEntry(entry, truth) ? null : [...(val(ev.alts, S) || []), ...(B.kubun && B.kubun.altsOf ? B.kubun.altsOf(truth, ev) : [])].find((x) => sameEntry(entry, x.entry));
        const ok = sameEntry(entry, truth) || !!altHit;
        tries++;
        if (!fixMode && tries === 1) { S.docLog.push({ ev: ev.id, kind: ev.kind, mi: S.mi, ok, hint: hintLv > 0, ...(altHit ? { alt: altHit.form || true } : {}) }); planMark(ev.kind, ok && hintLv === 0, 'doc'); S.metrics.docs.n++; if (ok) { S.metrics.docs.first++; if (ev.kind) (S.kinds[ev.kind] = S.kinds[ev.kind] || []).push(S.mi); } }
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
        post(ev, altHit ? { dr: truth.dr.map((x) => x.slice()), cr: truth.cr.map((x) => x.slice()) } : entry, false);
        delete S.drafts[dkey];
        save();
        if (fixMode) return typeof fixMode === 'function' ? fixMode() : closeScreen();
        if (coach) {
          panel = `<div class="s-check good"><p><b>帳簿に書けた</b></p>${altHit ? `<p class="s-altnote">${esc(altHit.note)}</p>` : ''}<ul>${[...entry.dr.map(([a, v]) => moveText(a, 'dr', v)), ...entry.cr.map(([a, v]) => moveText(a, 'cr', v))].map((t) => `<li>${esc(t)}</li>`).join('')}</ul>${miniBS(bsFrom(balances(S.L)))}<button class="btn wide" data-n>つぎへ</button></div>`;
          draw(); return;
        }
        // 慣れた種類は止めずに進む。何が動いたかだけ1行で知らせる
        if (altHit) toast(altHit.note); else toast(entry.dr.concat([]).map(([a, v]) => moveText(a, 'dr', v)).concat(entry.cr.map(([a, v]) => moveText(a, 'cr', v))).join('／'));
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
    const newT = new Set(ev.b4.teaches || []);
    for (const x of evs.slice(k + 1)) {
      if (x.t !== 'doc' || (x.when && !x.when(S))) continue;
      const a = val(x.ans, S);
      // すぐあとの書類の答えそのものは見せない。同じ形で金額だけ変えた「たとえば」にする
      // 例は、いま名前を教えた札を少なくとも1つ使う書類だけ（別の論点の仕訳を例にしない）。なければ例を出さない
      const accs = [...a.dr, ...a.cr].map(([acc]) => acc);
      if (accs.some((acc) => newT.has(acc)) && accs.every((acc) => teach.has(acc))) return { dr: a.dr.map(([x, v]) => [x, v * 2]), cr: a.cr.map(([x, v]) => [x, v * 2]) };
    }
    return null;
  }
  // 本試験の文で読める問題（教わった言葉と札だけ）。腕だめし・発見のあとの確かめ・想起で使う
  function readableQ(q) {
    const taught = new Set(S.taught);
    return q && q.type === 'journal' && !(modeOf() !== '2026' && B.outdated27(q)) && !(modeOf() === '2026' && B.new27(q)) && !B.outOfScope2(q) && !/上記|前問/.test(q.q) && !LX.unknown(q.q, taught).length && [...q.ans.dr, ...q.ans.cr].every(([a]) => taught.has(a));
  }
  const qByKey = (k) => { const [c, i] = k.split(':'); const ch = B.chapters.find((x) => x.id === c); return ch ? ch.qs[+i] : null; };
  // 本試験の文で1〜数問、その場で答え合わせ。結果は examLog（成長の記録・7日後の確かめに使う）
  // その発見が受け持つ試験範囲の項目（問題の答えを、どの項目の「本試験の文」として数えるか）
  const scopesOfDisc = (ev) => B.scope.filter((it) => ((it.sim || {}).disc || []).includes(ev.id)).map((it) => it.id);
  function quickQuiz(qs, label, done, scopes) {
    let i = 0;
    const draw = () => {
      if (i >= qs.length) return done();
      const q = qs[i];
      const ch = B.chapters.find((c) => c.qs.includes(q) || (q._key && c.id === q._key.split(":")[0]));
      const accs = [...new Set([...((ch || {}).accounts || []), ...(q.opts || []), ...B.siblings.filter((sb) => sb.accs.some((a) => [...q.ans.dr, ...q.ans.cr].some(([x]) => x === a))).flatMap((sb) => sb.accs), ...q.ans.dr.map((x) => x[0]), ...q.ans.cr.map((x) => x[0])])].filter(knows).sort((a, b) => order(a) - order(b));
      const opt = `<option value="">札をえらぶ</option>${accs.map((a) => `<option>${esc(a)}</option>`).join('')}`;
      const side = (sd) => [0, 1].map(() => `<div class="s-row"><select data-s="${sd}" aria-label="${sd === 'dr' ? '借方' : '貸方'}の札">${opt}</select><input data-s="${sd}" inputmode="numeric" placeholder="金額" aria-label="${sd === 'dr' ? '借方' : '貸方'}の金額"></div>`).join('');
      frame(`<div class="s-card"><small>${esc(label)} ${i + 1} / ${qs.length}</small><p class="muted" style="font-size:12px;margin:0">本試験と同じ文章で出たら、書ける？</p><p class="s-q">${q.q}</p><div class="s-entry"><div class="s-cols"><div class="s-side dr"><h4>借方（左）</h4>${side('dr')}</div><div class="s-side cr"><h4>貸方（右）</h4>${side('cr')}</div></div></div><div data-res></div><button class="btn wide" data-qq>答える</button></div>`);
      app.onclick = (e) => {
        if (e.target.closest('[data-qn]')) { i++; draw(); return; }
        if (!e.target.closest('[data-qq]')) return;
        const entry = { dr: [], cr: [] };
        for (const sd of ['dr', 'cr']) { const sel = $$(`select[data-s="${sd}"]`, app), ins = $$(`input[data-s="${sd}"]`, app); sel.forEach((x, k) => { const v = Number((ins[k].value || '').normalize('NFKC').replace(/[^\d]/g, '')); if (x.value && v) entry[sd].push([x.value, v]); }); }
        const ok = entry.dr.length && entry.cr.length && [q.ans, ...(q.alt || [])].some((a) => sameEntry(entry, a));
        S.examLog.push(Object.assign({ key: q._key, ok: !!ok, t: Date.now() }, scopes && scopes.length ? { scopes } : {})); save();
        $('[data-res]', app).innerHTML = `${ok ? '<p class="s-react">書けた</p>' : missHTML(entry, q.ans, '本試験の文では、こう書く')}${q.exp ? `<div class="muted rich" style="font-size:13px">${B.hall.rich(q.exp)}</div>` : ''}<button class="btn wide" data-qn>つぎへ</button>`;
        $('[data-qq]', app).remove();
      };
    };
    draw();
  }
  function discQuiz(ev) {
    const items = B.scope.filter((it) => ((it.sim || {}).disc || []).includes(ev.id));
    const keys = [...items.flatMap((it) => it.q || []), ...items.flatMap((it) => ((B.chapters.find((c) => c.id === it.ch) || { qs: [] }).qs.map((_, k) => `${it.ch}:${k}`)))];
    const seen = new Set(S.examLog.map((l) => l.key));
    // その発見で名前を教えた札を答えに使う問題だけ（2回目の検査：前払費用のあとに消費税、のように論点のずれた問題が出た）。it.q に挙げた問題はそのまま候補
    const own = new Set([...((ev.b4 || {}).teaches || []), ...items.flatMap((it) => it.accs || [])].filter((a) => B.accounts[a]));
    const listed = new Set(items.flatMap((it) => it.q || []));
    const fits = (q) => listed.has(q._key) || (own.size > 0 && [...q.ans.dr, ...q.ans.cr].some(([a]) => own.has(a)));
    return [...new Set(keys)].map(qByKey).filter((q) => readableQ(q) && !seen.has(q._key) && fits(q)).slice(0, 1);
  }
  // 7日前後（現実の時間）たった、本試験の文で間違えた問題の章から、別の問題を1つ
  // 日をあけて確かめる：6日以上前に間違えて、そのあと同じ型で書けていない問題があれば、同じ型の別の問題を1つ選ぶ。
  // 章の問題（会社の腕だめし・検定会場の第1問）は同じ章の別の問題を、検定会場の大問は範囲タグが重なる別の大問を
  const scopeOfKey = (k) => (k.startsWith('exam:') ? (B.examScope || {})[k] || [] : B.scope.filter((it) => it.ch === k.split(':')[0]).map((it) => it.id));
  const sameKind = (a, b) => (a.startsWith('auto:') || b.startsWith('auto:') ? a === b : a.startsWith('exam:') || b.startsWith('exam:') ? scopeOfKey(a).some((id) => scopeOfKey(b).includes(id)) : a.split(':')[0] === b.split(':')[0]);
  function dueReview() {
    const now = Date.now(), seen = new Set(S.examLog.map((l) => l.key)), done = new Set((S.recall || []).filter((r) => r.due).map((r) => r.due));
    const miss = S.examLog.filter((l) => !l.ok && now - l.t >= 6 * 864e5 && !S.examLog.some((x) => x.ok && x.t > l.t && sameKind(x.key, l.key)));
    for (const l of miss) {
      // 自動仕訳の棚卸で書けなかった種類：その種類のいちばん新しい書類を、月はじめにもう一度（1行ずつの入力に収まるものだけ）
      if (l.key.startsWith('auto:')) {
        const q = autoQ(l.key.slice(5));
        if (q && q.ans.dr.length <= 2 && q.ans.cr.length <= 2) return q;
        continue;
      }
      if (l.key.startsWith('exam:')) {
        const x0 = (B.exams || []).find((x) => x._key === l.key);
        const alt = (B.exams || []).find((x) => x._key !== l.key && !seen.has(x._key) && !done.has(x._key) && x.part === (x0 || {}).part && sameKind(x._key, l.key));
        if (alt) return alt;
        continue;
      }
      const c = B.chapters.find((x) => x.id === l.key.split(':')[0]);
      const q = c && c.qs.find((x) => readableQ(x) && !seen.has(x._key) && !done.has(x._key));
      if (q) return q;
    }
    return null;
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
    // 会社の状態で正解が変わる発見（例：準備金がもう資本金の4分の1に届いていれば、配当の上限は貯まりの全部）は、ev.dynamic(S, ev) が書き換えた ev を使う
    if (typeof ev.dynamic === 'function') ev = ev.dynamic(S, ev);
    // もう一度見るときは、記録（1回目の正誤・分かれ道）に数えない
    const m = isReplay ? { tries: 0, first: null, hand: 0, forks: [] } : (S.metrics.disc[ev.id] = S.metrics.disc[ev.id] || { tries: 0, first: null, hand: 0, forks: [] });
    const metrics = isReplay ? { forks: {}, hand: 0 } : S.metrics;
    // 5拍（困りごと→予想→手の操作と理由→結果（最初の誤りと並べる）→名前）は設計の言葉。画面には出さず、ボタンは次の行動の言葉にする
    let beat = 1, picked = null, sorted = {}, reason = null, hintLv = 0, guess = null, firstWrong = null;
    // 途中の段（予想・置いた札・理由・ヒント）は S.drafts に残す。途中で閉じても同じ段から（もう一度見るときは残さない）
    S.drafts = S.drafts || {};
    const dk = `disc:${ev.id}@${S.mi}`;
    if (!isReplay && S.drafts[dk]) ({ beat, picked, sorted, reason, hintLv, guess, firstWrong } = S.drafts[dk]);
    const draw = () => {
      if (!isReplay) { S.drafts[dk] = { beat, picked, sorted, reason, hintLv, guess, firstWrong }; save(); }
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
          field = `<div class="s-sort">${b2.tokens.map((t) => `<div class="s-sorti" role="group" aria-label="${esc(t.label)}"><span>${esc(t.label)}</span><div>${b2.targets.map((g) => `<button class="s-pill ${sorted[t.id] === g.id ? 'on' : ''}" data-sort="${t.id}" data-to="${g.id}" aria-pressed="${sorted[t.id] === g.id}" aria-label="${esc(t.label)}：${esc(g.label)}">${esc(g.label)}</button>`).join('')}</div></div>`).join('')}</div>`;
        } else {
          field = `${b2.token ? `<div class="s-token ${picked ? 'placed' : ''}">${esc(b2.token)}</div>` : ''}<div class="s-targets ${b2.layout}">${b2.targets.map((g) => `<button class="s-target ${picked === g.id ? 'on' : ''}" data-pick="${g.id}"><b>${esc(g.label)}</b>${g.sub ? `<small>${esc(g.sub)}</small>` : ''}</button>`).join('')}</div>`;
        }
        const placed = isSort(b2) ? b2.tokens.every((t) => sorted[t.id]) : !!picked;
        body = `${ev.b1.doc ? `<details class="s-redoc"><summary>書類をもう一度見る</summary>${docHTML(ev.b1.doc)}</details>` : ''}<p class="s-q">${esc(b2.q)}</p>${field}${placed ? `${talk([['piyo', 'どうしてそう思ったピヨ？']])}<div class="s-reasons">${b2.reasons.map((r, i) => `<button class="s-reason ${reason === i ? 'on' : ''}" data-reason="${i}">${esc(r.t)}</button>`).join('')}</div>` : ''}<div class="s-hint" ${hintLv ? '' : 'hidden'}>${(b2.hints || []).slice(0, hintLv).map((h) => `<p>${esc(h)}</p>`).join('')}</div><button class="btn wide" data-decide ${placed && reason !== null ? '' : 'disabled'}>これで決める</button>${placed && reason === null ? '<p class="s-why-off">「これで決める」は、理由を1つ選ぶと押せる</p>' : !placed ? '<p class="s-why-off">まず上から1つ選ぶ。そのあと理由を選ぶと「これで決める」が押せる</p>' : ''}<div class="s-actions"><button class="btn ghost sm" data-b="1">← もどる</button>${(b2.hints || []).length > hintLv ? '<button class="btn ghost sm" data-hint>ヒント</button>' : ''}</div>`;
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
        body = `<div class="s-name"><small>この考え方の名前</small><h2>${rb(b4.name)}</h2><p>${rb(b4.line)}</p>${pair}${flowJE}<details class="s-exam"><summary>試験では、どんな文章で出る？</summary>${esc(modeOf() === '2026' && b4.exam26 ? b4.exam26 : b4.exam)}</details><p class="s-leaf">マップに「${esc(b4.leaf.label)}」が加わった</p></div>${ev.hand ? '<button class="btn wide ghost" data-hand>先輩の手帳で、くわしく読む</button>' : ''}<button class="btn wide" data-done>つぎへ</button>`;
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
        S.discDone[ev.id] = S.mi; delete S.drafts[dk];
        if (!S.leaves.some((l) => l.label === ev.b4.leaf.label)) S.leaves.push({ p: ev.b4.leaf.p, label: ev.b4.leaf.label, mi: S.mi });
        const qs = discQuiz(ev);
        if (qs.length) quickQuiz(qs, '本試験の文で確かめる', () => { grew('発見のあとの確かめ'); next(); }, scopesOfDisc(ev)); else next();
      }
    };
  }

  // 判断：選ぶ前に見られるのは、経理が出せる「すぐ動く数字」（試算）だけ。外の反応や結末は、選んでから返ってくる
  // 判断の画面に来たら、会社の状態を栞にはさむ（バッドエンドから、ここへ戻れる）
  // 栞で戻っても残すもの。ラーメン版は学びの記録（meta：examLog・成長・条件A）とスロットも戻さない（X12）
  const KEEP = ['leaves', 'taught', 'diary', 'seenEnds', 'ifSeen', 'metrics', 'bm', ...(RAMEN ? [...V4.META, '__slot'] : [])];
  function snapshot() { const o = {}; for (const [k, v] of Object.entries(S)) if (!KEEP.includes(k)&&(!RAMEN||k!=='drafts')) o[k] = v; return JSON.parse(JSON.stringify(o)); }
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
    const options = ev.optionsFor ? ev.optionsFor(S) : ev.options;
    if (!S.bm[ev.id] || S.bm[ev.id].mi !== S.mi) { S.bm[ev.id] = snapshot(); if(RAMEN)S.bm=V4.pruneBookmarks(S.bm); save(); }
    let pick = null;
    const draw = () => {
      const o = options.find((x) => x.id === pick);
      const trial = o && ev.trial ? `<p class="s-q small">試算（すぐ動く数字）</p>${trialHTML(ev.trial(S, o.id))}` : '';
      frame(`<div class="s-card"><h3>${esc(ev.q)}</h3>${talk(ev.talk)}${o ? `<div class="s-check"><p><b>${esc(o.label)}</b></p>${trial}<p>${esc(o.result)}</p><button class="btn wide" data-yes>これで決める</button><button class="btn wide ghost" data-no>えらび直す</button></div>` : `<div class="s-opts">${options.map((x) => `<button class="s-opt" data-opt="${x.id}" ${x.disabled ? 'disabled aria-disabled="true"' : ''}><b>${esc(x.label)}</b><small>${esc(x.desc)}</small>${(S.seenEnds || []).some((id) => D.endings[id] && D.endings[id].back === ev.id) && !x.ending ? '<i class="s-seen">この先の結末を見た</i>' : ''}</button>`).join('')}</div>`}</div>`);
    };
    draw();
    app.onclick = (e) => {
      const b = e.target.closest('[data-opt]');
      if (b) { if(options.find(x=>x.id===b.dataset.opt).disabled)return; pick = b.dataset.opt; draw(); return; }
      if (e.target.closest('[data-no]')) { pick = null; draw(); return; }
      if (e.target.closest('[data-yes]')) {
        S.decisions[ev.id] = pick;
        S.diary.push({ m: month().label, t: `${ev.q} → ${options.find((x) => x.id === pick).label}` });
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
    // 結末の「もしも」の数字は、1年目の決算書のもうけ（締め切りの前）。締め切ったあとの S.L から取ると、収益・費用が0で「0円」になる
    S.__ni = pl(balances(S.L.filter((e) => (e.y || 1) === 1 && !e.closing))).ni;
    // 「もしも」で見るときは、選ばなかった道（back の判断を via の選択にした場合）の数字と原因で書く
    const SX = view && E.back && E.via && E.via.length && S.decisions[E.back] !== E.via[0] ? Object.assign(Object.create(Object.getPrototypeOf(S)), S, { decisions: { ...S.decisions, ...(E.as || {}), [E.back]: E.via[0] } }) : S;
    const docs = E.docs(SX);
    const steps = ['cause', 'numbers', ...docs.map((_, i) => 'doc' + i), 'scene', 'reality', 'lesson'];
    let i = 0, answered = !E.check, msg = '';
    const draw = () => {
      const st = steps[i];
      let body = '';
      if (st === 'cause') body = `<small>${view ? 'もしも、' : ''}原因</small><p class="s-result">${esc(E.cause(SX))}</p>`;
      else if (st === 'numbers') body = `<small>数字</small>${trialHTML(E.numbers(SX).rows)}`;
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
      if (e.target.closest('[data-restart]')) { const keep = { leaves: S.leaves, taught: S.taught, diary: S.diary, seenEnds: S.seenEnds, ifSeen: S.ifSeen }; S = Object.assign(freshKeep(), keep); S.phase = 'monthIntro'; S.mi = 1; save(); render(); }
    };
  }
  // 事後のもしも：正しく選んだ人も、選ばなかった道の結末を見に行ける（会社の状態は動かない）
  // もしも：その年の判断のうち、選ばなかった道の先にあった結末。「もし〜を選んでいたら」には、その結末に届く選択肢（E.via）だけを出す
  function ifOnlyList(y) {
    const out = [];
    D.months.forEach((m) => { if ((m.year || 1) !== y && (m.year || 1) !== y + 1) return; for (const ev of m.events) {
      if (ev.t !== 'decision' || !S.decisions[ev.id]) continue;
      ev.options.flatMap((x) => x.ending || []).forEach((id) => {
        if (S.seenEnds.includes(id) || out.some((x) => x.id === id)) return;
        const E = D.endings[id] || {};
        const alts = ev.options.filter((x) => (E.via ? E.via.includes(x.id) : !x.ending));
        out.push({ id, q: ev.q, alt: alts.map((x) => x.label).join('／') });
      });
    } });
    return out;
  }
  function ifOnlyScreen(ev) {
    const list = ifOnlyList((ev && ev.y) || yearOf(S.mi));
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
    S.__predicting = true;
    frame(`<div class="s-card"><small>${esc(month().label)}の締めの前に</small>${talk([['senpai', `先月の終わり、口座のお金は ${fmt(before)} だった。今月の終わりは、どうなっていると思う？ 見直しの前に予想してみよう。`]])}<div class="s-opts">${[['up', '増えた'], ['down', 'へった'], ['flat', 'ほとんど変わらない（2,000円か、3％以内）']].map(([k, t]) => `<button class="s-opt" data-pc="${k}"><b>${t}</b></button>`).join('')}</div></div>`);
    app.onclick = (e) => { const b = e.target.closest('[data-pc]'); if (!b) return; S.predicts[S.mi] = { g: b.dataset.pc, before }; S.__predicting = false; save(); done(); };
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
      frame(`<div class="s-card"><small>${esc(month().label)}の見直し</small><h3>帳簿と書類が、ぜんぶ合った</h3><p class="s-why-off" style="text-align:left">${/決算/.test(month().label) ? (S.mi + 1 < D.months.length && /決算/.test(D.months[S.mi + 1].label || '') ? '書類と帳簿の数字は合った。決算の作業は、まだ続く（次の机へ）。' : '書類と帳簿の数字は合った。これで決算の作業は終わり。') : '書類と帳簿の数字が一致した、という確かめ。売上を入れる月や、費用か資産かの正しさは、決算でもう一度見る。'}</p>${miniBS(bsFrom(bu))}<p style="margin:0">口座のお金 <b>${fmt(cashOf(bu))}</b>${knows('収益') ? `　この1年のもうけ <b>${fmt(p.ni)}</b>` : ''}</p>${predictLine(bu)}${note}<button class="btn wide" data-next>${S.mi + 1 < D.months.length ? '次の月へ' : 'つぎへ'}</button></div>`);
      app.onclick = (e) => { if (e.target.closest('[data-next]')) { S.closes.push({ mi: S.mi, fixed: S.fixLog.some((f) => f.mi === S.mi) }); grew('月末の締め'); if (RUI && month().ramenT != null) { S.phase = 'after'; save(); return RUI.after(advanceMonth); } advanceMonth(); } };
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
        // 罠ごとの言葉（書類の trapNote）。ないときは1年目のチラシの言葉
        const tn = ev.trapNote || { was: '掛けで何かを買ったとき', what: 'チラシ代まで「仕入／買掛金」と書いてしまった', ask: 'この請求書は、手で書き直そう。チラシは商品？' };
        S.diary.push({ m: month().label, t: `自動仕訳の条件を直した：${S.rules[ev.trapFor].cond}（${tn.was}、という広い条件だった）` });
        save();
        overlay(`<h3>自動仕訳の条件を直した</h3><p>「${esc(tn.was)}」という条件では、${esc(tn.what || 'ちがう取引まで同じ形で書いてしまった')}。条件を「${esc(S.rules[ev.trapFor].cond)}」に直した。</p><p>${esc(tn.ask)}</p>`);
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
      if (cat(a) === '資産' || (isOther(a) && v > 0)) out.資産.push([a, v]);
      else if (cat(a) === '負債' || (isOther(a) && v < 0)) out.負債.push([a, -v]);
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
    const assets = Object.entries(b).filter(([a, v]) => v && (cat(a) === '資産' || CONTRA.has(a) || (isOther(a) && v > 0)));
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
  // 区分のある決算書（2年目から。docs/YEAR2.md 3.3）：損益計算書は5つの利益、貸借対照表は流動・固定と表示科目
  // 区分の表は js/data/kubun.js（札の速さ・札で見るとも共有）。ここだけの表示名（工場の累計額など）は SHOW に足す
  const KB = B.kubun;
  const FIXED = { has: (a) => KB.bsOf(a) === '固定資産' };
  const SHOW = { 繰越商品: '商品', 前払家賃: '前払費用', 未払賃金: '未払費用', 減価償却累計額: '機械装置減価償却累計額' };
  function kubunView(b) {
    const v = (a) => b[a] || 0, list = (pred) => Object.keys(b).filter((a) => v(a) && pred(a)).sort((x, y) => order(x) - order(y));
    const sec = (bin) => list((a) => ['収益', '費用'].includes(cat(a)) && KB.plOf(a) === bin);
    const rev = sec('売上高'), cogs = sec('売上原価'), sga = sec('販売費及び一般管理費'), nrev = sec('営業外収益'), nonop = sec('営業外費用'), sp = sec('特別利益'), sl = sec('特別損失'), tax = sec('法人税等');
    const sum = (l, sg) => l.reduce((t, a) => t + sg * v(a), 0);
    const R = sum(rev, -1), C = sum(cogs, 1), G = R - C, X = sum(sga, 1), O = G - X, K = O + sum(nrev, -1) - sum(nonop, 1), P = K + sum(sp, -1) - sum(sl, 1), T = sum(tax, 1), NI = P - T;
    const row = (a, val, ind) => `<tr><td>${ind ? '　' : ''}${esc(SHOW[a] || a)}</td><td class="n">${fmt(val)}</td></tr>`, tot = (t, val) => `<tr class="sum"><td>${esc(t)}</td><td class="n">${fmt(val)}</td></tr>`;
    const rows = (l, ind) => l.map((a) => row(a, -v(a), ind)).join('');
    const plT = `<h3>損益計算書（区分）</h3><table class="s-tb">${rows(rev)}${rows(cogs, 1)}${tot('売上総利益', G)}${rows(sga, 1)}${tot('営業利益', O)}${rows(nrev, 1)}${rows(nonop, 1)}${tot('経常利益', K)}${sp.length || sl.length ? `${rows(sp, 1)}${rows(sl, 1)}` : ''}${tot('税引前当期純利益', P)}${rows(tax, 1)}${tot('当期純利益', NI)}</table>`;
    const asset = (a) => cat(a) === '資産' || CONTRA.has(a) || (isOther(a) && v(a) > 0);
    const ca = list((a) => asset(a) && !FIXED.has(a)), fa = list((a) => asset(a) && FIXED.has(a));
    const cl = list((a) => cat(a) === '負債' || (isOther(a) && v(a) < 0));
    // 純資産は 資本金→資本剰余金→利益剰余金 の順。繰越利益剰余金は当期純利益を足した額で1行（締め切りのあとの姿）
    const EQ_ORD = ['資本金', '新株式申込証拠金', '資本準備金', 'その他資本剰余金', '利益準備金', '別途積立金', '繰越利益剰余金'];
    const eqO = (a) => (EQ_ORD.indexOf(a) < 0 ? 50 : EQ_ORD.indexOf(a));
    const eq = list((a) => cat(a) === '純資産' && a !== '繰越利益剰余金').concat(['繰越利益剰余金']).sort((x, y) => eqO(x) - eqO(y));
    const eqVal = (a) => (a === '繰越利益剰余金' ? -v(a) + NI : -v(a));
    // マイナスの札（貸倒引当金・減価償却累計額）は、相手の資産のすぐ下に置く
    const withContra = (l) => { const base = l.filter((a) => !CONTRA.has(a)), out = []; for (const a of base) { out.push(a); for (const c of l) if (CONTRA.has(c) && CONTRA_OF[c] === a) out.push(c); } for (const c of l) if (!out.includes(c)) out.push(c); return out; };
    const bsT = `<h3>貸借対照表（区分）</h3><div class="s-two"><table class="s-tb"><tr><th colspan="2">流動資産</th></tr>${withContra(ca).map((a) => row(a, v(a), CONTRA.has(a))).join('')}${tot('流動資産 計', sum(ca, 1))}<tr><th colspan="2">固定資産</th></tr>${withContra(fa).map((a) => row(a, v(a), CONTRA.has(a))).join('')}${tot('固定資産 計', sum(fa, 1))}${tot('資産 合計', sum(ca, 1) + sum(fa, 1))}</table><table class="s-tb"><tr><th colspan="2">流動負債</th></tr>${cl.map((a) => row(a, -v(a))).join('')}${tot('流動負債 計', sum(cl, -1))}<tr><th colspan="2">純資産</th></tr>${eq.map((a) => row(a, eqVal(a))).join('')}${tot('純資産 計', eq.reduce((t, a) => t + eqVal(a), 0))}${tot('負債・純資産 合計', sum(cl, -1) + eq.reduce((t, a) => t + eqVal(a), 0))}</table></div>`;
    return bsT + plT;
  }
  function reportScreen(ev) {
    if (ev.kubun) {
      const { b } = statements();
      S.reportSeen = true; save();
      frame(`<div class="s-card"><small>${yearOf(S.mi)}年目の決算書（区分）</small>${kubunView(b)}<button class="btn wide" data-n>つぎへ</button></div>`);
      app.onclick = (e) => { if (e.target.closest('[data-n]')) { S.diary.push({ m: '決算', t: `${yearOf(S.mi)}年目のもうけ ${fmt(statements().p.ni)}円` }); next(); } };
      return;
    }
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
    const openingYear = ev.year || month().year || 2;
    if (S.discDone[ev.id] != null) return next();
    const b = balances(S.L);
    const cards = Object.entries(b).filter(([a, v]) => v && (cat(a) === '資産' || cat(a) === '負債' || cat(a) === '純資産' || CONTRA.has(a))).map(([a, v]) => ({ a, v: Math.abs(v), to: cat(a) === '資産' && !CONTRA.has(a) ? 'L' : 'R' })).sort((x, y) => order(x.a) - order(y.a));
    const put = {}; let msg = '', miss = 0, done = false;
    const col = (k) => cards.filter((c) => put[c.a] === k).map((c) => `${esc(c.a)} ${fmt(c.v)}`).join('<br>') || '　';
    const draw = () => {
      const left = cards.filter((c) => !put[c.a]);
      const body = done
        ? `<div class="s-name"><small>この書き方の名前</small><h2>${rb('前期繰越・開始記入')}</h2><p>${rb('去年の終わりの資産・負債・純資産は、そのまま今年のはじめの姿になる。今年のノートの1行目に「前期繰越」として書き写すことを「開始記入」という。収益と費用は締め切りで0になったので、書き写さない。')}</p><details class="s-exam"><summary>試験では、どんな文章で出る？</summary>${esc('「各勘定の前期繰越を記入し、開始記入を行う」')}</details><p class="s-leaf">マップに「前期繰越」が加わった</p></div><button class="btn wide" data-odone>${openingYear}年目をはじめる</button>`
        : `${talk([['senpai', `${openingYear}年目の朝だ。去年の終わりの棚を、今年のノートの1行目に写そう。左の列と右の列、どちらに書く？`]])}<table class="s-tb s-tacc"><tr><th>今年のノートの1行目（左）</th><th>（右）</th></tr><tr><td>${col('L')}</td><td>${col('R')}</td></tr></table>${left.length ? `<div class="s-sorti"><span><b>${esc(left[0].a)}</b> ${fmt(left[0].v)}${CONTRA.has(left[0].a) ? '（マイナスの札）' : ''}</span><div><button class="s-pill" data-op="L">左の列</button><button class="s-pill" data-op="R">右の列</button></div></div>` : `${talk([['senpai', `左も右も ${fmt(cards.filter((c) => c.to === 'L').reduce((t, c) => t + c.v, 0))}。去年の売上や給料は、写さなくていいのかな？`]])}<div class="s-opts"><button class="s-opt" data-oq="ok"><b>写さない。締め切りで0になって、もうけは繰越利益剰余金に入っている</b></button><button class="s-opt" data-oq="ng"><b>写す。去年の売上も、今年の売上に足す</b></button></div>`}${msg ? `<p class="s-react ng">${esc(msg)}</p>` : ''}<p class="muted" style="font-size:12px">のこり ${left.length} 枚</p>`;
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
    // 整理したあとの残りが0の行（消費税の精算などで消えた札）は、運ぶものがないので聞かない
    rows.filter((r) => !r.after).forEach((r) => { put[r.a] = r.to; });
    const plR = () => rows.filter((r) => r.to === 'PL'), ni = -plR().reduce((t, r) => t + r.after, 0);
    const n = (v) => (v ? fmt(v) : '');
    const table = () => `<div class="s-sheetwrap"><table class="s-tb s-wsheet"><tr><th rowspan="2">勘定科目</th><th colspan="2">試算表</th><th colspan="2">整理記入</th>${eight ? '' : '<th colspan="2">整理後</th>'}<th colspan="2">損益計算書</th><th colspan="2">貸借対照表</th></tr><tr>${'<th>借方</th><th>貸方</th>'.repeat(eight ? 4 : 5)}</tr>${rows.map((r) => `<tr class="${put[r.a] ? '' : 'todo'}"><td>${esc(r.a)}</td><td class="n">${n(Math.max(0, r.pre))}</td><td class="n">${n(Math.max(0, -r.pre))}</td><td class="n">${n(r.adr)}</td><td class="n">${n(r.acr)}</td>${eight ? '' : `<td class="n">${n(Math.max(0, r.after))}</td><td class="n">${n(Math.max(0, -r.after))}</td>`}${['PL', 'BS'].map((k) => put[r.a] === k ? `<td class="n">${n(Math.max(0, r.after))}</td><td class="n">${n(Math.max(0, -r.after))}</td>` : '<td></td><td></td>').join('')}</tr>`).join('')}${step !== 'rows' && step !== 'ni' ? `<tr><td>当期純利益</td><td></td><td></td><td></td><td></td>${eight ? '' : '<td></td><td></td>'}<td class="n">${n(Math.max(0, ni))}</td><td class="n">${n(Math.max(0, -ni))}</td><td class="n">${n(Math.max(0, -ni))}</td><td class="n">${n(Math.max(0, ni))}</td></tr>` : ''}</table></div>`;
    const draw = () => {
      const left = rows.filter((r) => !put[r.a]);
      let body = '';
      if (step === 'rows') {
        const r = left[0];
        body = `${talk([['kansa', '1年の締めを、1枚の表にしよう。左から、整理する前の残り・決算で直した額・整理したあとの残り。整理したあとの残りを、損益計算書か貸借対照表へ運んで。']])}<details class="s-fje"><summary>表の全体を見る（横にスクロールできる）</summary>${table()}</details><div class="s-sorti"><span><b>${esc(r.a)}</b> ${fmt(Math.abs(r.after))}<small class="s-sheetrow">整理前 ${fmt(Math.abs(r.pre))}${r.adr ? `　＋整理（借方）${fmt(r.adr)}` : ''}${r.acr ? `　＋整理（貸方）${fmt(r.acr)}` : ''}　→ 整理後 ${fmt(Math.abs(r.after))}（${r.after > 0 ? '借方' : '貸方'}）</small></span><div><button class="s-pill" data-sh="PL">損益計算書へ</button><button class="s-pill" data-sh="BS">貸借対照表へ</button></div></div>${rows.filter((x) => put[x.a] && x.after).length >= 4 && left.length > 1 ? `<button class="link" data-shall>残りの ${left.length} 行も同じように運ぶ</button>` : ''}${msg ? `<p class="s-react ng">${esc(msg)}</p>` : ''}`;
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
  function bankScreen(ev) {
    const { p, ta, eq } = statements();
    const d = S.decisions, ratio = Math.round((eq / ta) * 100), r = ev && ev.rating ? ev.rating(S) : bankRating();
    const lines = [];
    // 2年目からの審査は、台本（year2.js の bank）の台詞で
    if (ev && ev.lines) {
      lines.push(...ev.lines(S));
      const offer = r >= 3 ? Math.max(500000, Math.round((eq * 0.5) / 100000) * 100000) : r === 2 ? Math.round((eq * 0.2) / 100000) * 100000 : 0;
      lines.push(['ginko', offer ? `工場を広げるなら、${offer.toLocaleString()}円まで、ご相談に乗れます。` : '申し訳ありませんが、今は、これ以上お貸しすることはできません。']);
      S.carry = Object.assign(S.carry || {}, { [`y${yearOf(S.mi)}`]: { offer, rating: r, ni: p.ni, ratio } });
      S.diary.push({ m: month().label, t: offer ? `銀行（見方：${RATING[r]}）：工場を広げるなら ${fmt(offer)}円まで相談できる` : `銀行（見方：${RATING[r]}）：追加の融資は断られた` });
      return bankView(lines, r, ratio, `${yearOf(S.mi)}年目の決算のあと みらい銀行の審査`);
    }
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
    return bankView(lines, r, ratio, '翌年4月 みらい銀行の審査');
  }
  function bankView(lines, r, ratio, label) {
    // 1画面に1つの発言。最後に銀行の見方
    let k = 0;
    // 銀行の見方は、数ではなく田中さんの表情と、返さなくていいお金の割合（会社の体力）の帯で見せる
    const face = `<svg class="s-face" viewBox="0 0 64 64" role="img" aria-label="田中さんの表情：${RATING[r]}"><circle cx="32" cy="32" r="28" fill="hsl(222 60% 92%)" stroke="hsl(222 40% 50%)" stroke-width="2"/><circle cx="23" cy="27" r="3" fill="#334"/><circle cx="41" cy="27" r="3" fill="#334"/><path d="M20 ${44 - (r - 2) * 3} Q32 ${44 + (r - 2) * 5} 44 ${44 - (r - 2) * 3}" fill="none" stroke="#334" stroke-width="3" stroke-linecap="round"/></svg>`;
    const stamina = knows('純資産') ? `<div class="s-stamina"><small>会社の体力（資産のうち、返さなくていいお金でまかなっている割合）</small><div class="s-gbar"><span class="lv2" style="flex:${Math.max(0, ratio)}"></span><span class="lv0" style="flex:${Math.max(0, 100 - ratio)}"></span></div><b>${ratio}%</b></div>` : '';
    const draw = () => frame(`<div class="s-card"><small>${esc(label)}（${k + 1}/${lines.length}）</small>${talk([lines[k]])}${k === lines.length - 1 ? `<div class="s-bankview">${face}<p class="s-dyn">銀行の見方：<b>${RATING[r]}</b></p></div>${stamina}` : ''}<button class="btn wide" data-n>つぎへ</button></div>`);
    draw();
    app.onclick = (e) => { if (e.target.closest('[data-n]')) { if (k < lines.length - 1) { k++; draw(); } else next(); } };
  }
  // 腕だめし：体験した論点のうち、教わった言葉だけで読める本試験形式の問題を選ぶ
  function pickQuiz() {
    const taught = new Set(S.taught);
    // 2級の論点を先に、3級の土台はあとに。1つの章から2問まで
    const items = B.scope.filter((it) => scopeState(it).met != null).sort((x, y) => (x.base ? 1 : 0) - (y.base ? 1 : 0));
    const byKey = Object.fromEntries(B.chapters.flatMap((c) => c.qs.map((q, k) => [`${c.id}:${k}`, q])));
    const readable = (q) => q && q.type === 'journal' && !(modeOf() !== '2026' && B.outdated27(q)) && !(modeOf() === '2026' && B.new27(q)) && !B.outOfScope2(q) && !/上記|前問/.test(q.q) && !LX.unknown(q.q, taught).length && [...q.ans.dr, ...q.ans.cr].every(([a]) => taught.has(a));
    const keys = [...items.flatMap((it) => it.q || []), ...items.flatMap((it) => (B.chapters.find((c) => c.id === it.ch) || { qs: [] }).qs.map((_, k) => `${it.ch}:${k}`))];
    // 腕だめしは2つの組に分ける（オーナーの決定 2026-10-21）：前に出た問題で思い出す（2問まで。間違えたものを先に）と、初めて見る問題で力を測る（残り）
    const seen = new Set(S.examLog.map((l) => l.key)), missed = new Set(S.examLog.filter((l) => !l.ok).map((l) => l.key));
    const uniq = [...new Set(keys)].filter((k) => readable(byKey[k]));
    const old = uniq.filter((k) => seen.has(k)).sort((a, b) => (missed.has(b) ? 1 : 0) - (missed.has(a) ? 1 : 0)).slice(0, 2);
    const out = [], perCh = {};
    for (const k of uniq.filter((x) => !seen.has(x))) { const ch = k.split(':')[0]; if (out.length >= 5 - old.length) break; if ((perCh[ch] || 0) < 2) { out.push(k); perCh[ch] = (perCh[ch] || 0) + 1; } }
    return [...old.map((k) => Object.assign({}, byKey[k], { _role: 'recall' })), ...out.map((k) => Object.assign({}, byKey[k], { _role: 'new' }))];
  }
  function quizScreen() {
    // 何問目まで解いたかは S.drafts に残す（途中で閉じても、同じ問題の続きから。同じ問題を二度記録しない）
    S.drafts = S.drafts || {};
    const qk = `quiz@${S.mi}`, qd = S.drafts[qk];
    const qs = qd ? qd.keys.map((k, j) => (qByKey(k) ? Object.assign({}, qByKey(k), { _role: (qd.roles || [])[j] || 'new' }) : null)).filter(Boolean) : pickQuiz();
    let i = qd ? qd.i : 0, score = qd ? qd.score : 0;
    const results = qd ? qd.results : [];
    const keepQ = () => { S.drafts[qk] = { keys: qs.map((q) => q._key), roles: qs.map((q) => q._role), i, score, results }; save(); };
    const draw = () => {
      if (i >= qs.length) {
        delete S.drafts[qk];
        S.metrics.quiz = { score, of: qs.length, results };
        grew('腕だめし');
        save();
        frame(`<div class="s-card"><small>腕だめし</small><h3>${qs.length ? `${score} / ${qs.length} 問 正解` : '今回は問題なし'}</h3>${qs.length ? `<p>初めて見る問題（力を測る）：${results.filter((r) => r.role !== 'recall' && r.ok).length} / ${qs.filter((q) => q._role !== 'recall').length}　前に出た問題（思い出す）：${results.filter((r) => r.role === 'recall' && r.ok).length} / ${qs.filter((q) => q._role === 'recall').length}</p>` : ''}<p>本試験と同じ文章で出された問題。会社で体験したことが、試験の形でも使えたかを確かめた。結果はマップの「試験範囲で見る」に残る。</p><button class="btn wide" data-n>1年をふりかえる</button></div>`);
        app.onclick = (e) => { if (e.target.closest('[data-n]')) next(); };
        return;
      }
      const q = qs[i];
      const accs = [...new Set([...(B.chapters.find((c) => c.qs.includes(q) || (q._key && c.id === q._key.split(":")[0])).accounts || []), ...q.ans.dr.map((x) => x[0]), ...q.ans.cr.map((x) => x[0])])].filter(knows).sort((a, b) => order(a) - order(b));
      const optHTML = `<option value="">札をえらぶ</option>${accs.map((a) => `<option>${esc(a)}</option>`).join('')}`;
      const side = (s) => [0, 1, 2].map((k) => `<div class="s-row"><select data-s="${s}" data-i="${k}" aria-label="${s === 'dr' ? '借方' : '貸方'}の札">${optHTML}</select><input data-s="${s}" data-i="${k}" inputmode="numeric" placeholder="金額" aria-label="${s === 'dr' ? '借方' : '貸方'}の金額"></div>`).join('');
      frame(`<div class="s-card"><small>腕だめし ${i + 1} / ${qs.length}　${q._role === 'recall' ? '前に出た問題（思い出す）' : '初めて見る問題（力を測る）'}</small><p class="s-q">${q.q}</p><div class="s-entry"><div class="s-cols"><div class="s-side dr"><h4>借方（左）</h4>${side('dr')}</div><div class="s-side cr"><h4>貸方（右）</h4>${side('cr')}</div></div></div><div data-res></div><button class="btn wide" data-check>答える</button></div>`);
      app.onclick = (e) => {
        if (e.target.closest('[data-check]')) {
          const entry = { dr: [], cr: [] };
          for (const s of ['dr', 'cr']) { const sels = $$(`select[data-s="${s}"]`, app), ins = $$(`input[data-s="${s}"]`, app); sels.forEach((x, k) => { const v = Number((ins[k].value || '').normalize('NFKC').replace(/[^\d]/g, '')); if (x.value && v) entry[s].push([x.value, v]); }); }
          // 札を選んだのに金額が空の行があれば、答える前に知らせる（空のまま答えて「おしい」にならないように）
          const blank = ['dr', 'cr'].some((sd) => $$(`select[data-s="${sd}"]`, app).some((x, k) => x.value && !Number(($$(`input[data-s="${sd}"]`, app)[k].value || '').normalize('NFKC').replace(/[^\d]/g, ''))));
          if (blank) { $('[data-res]', app).innerHTML = '<p class="s-react ng">金額が空の行がある。金額を入れてから答えよう</p>'; return; }
          const ok = [q.ans, ...(q.alt || [])].some((a) => entry.dr.length && entry.cr.length && sameEntry(entry, a));
          if (ok) score++;
          results.push({ key: q._key, ok, role: q._role });
          S.examLog.push({ key: q._key, ok, t: Date.now() });
          i++; keepQ(); i--;
          $('[data-res]', app).innerHTML = `${ok ? '<p class="s-react">正解</p>' : missHTML(entry, q.ans, '正しくは')}${q.exp ? `<div class="muted rich" style="font-size:13px">${B.hall.rich(q.exp)}</div>` : ''}`;
          e.target.closest('[data-check]').outerHTML = '<button class="btn wide" data-nextq>つぎへ</button>';
          return;
        }
        if (e.target.closest('[data-nextq]')) { i++; keepQ(); draw(); }
      };
    };
    draw();
  }
  /* ---- ラーメン版の仮の画面（段5で作戦の机・月報・作業台を作り直す。DESIGN-RAMEN l.3）。いまは台本と世界の式を通して遊べるための最小の形 ---- */
  // 作戦の机（仮）：今月の手を決める。開いている手だけ。時間の予算の残り。「前月のまま」でも進める
  let PLAN = null;
  function planScreen(ev) {
    const RMx = D.ramen, t = ev.ramenT;
    if ((S.res || {})[t]) return next();
    const W = RMx.world(S);
    if (!PLAN || PLAN.t !== t) PLAN = { t, pol: RMx.policy(S, t) };
    const p = PLAN.pol, open = ev.opens || [], WD = D.world;
    const used = WD.timeUsed(W, p), budget = WD.timeBudget(W, p);
    const tog = (k, label) => (open.includes(k) ? `<button class="s-pill ${p[k] ? 'on' : ''}" data-plan="${k}" data-opt="toggle">${esc(label)}${p[k] ? '：する' : '：しない'}</button>` : '');
    const row = (k, label, opts) => (open.includes(k) ? `<div class="s-who" data-plan-row="${k}"><small>${esc(label)}</small>${opts.map(([v, l]) => `<button class="${String(p[k === 'staff' ? 'parts' : k]) === String(v) ? 'on' : ''}" data-plan="${k}" data-opt="${v}">${esc(l)}</button>`).join('')}</div>` : '');
    const trial = (() => { try { const v = WD.evalPolicy(W, p, 1); return `<p class="s-dyn">今月の見込み（乱数なし）：もうけ ${fmt(Math.round(v))}円</p>`; } catch (e) { return ''; } })();
    frame(`<div class="s-card"><small>${esc(month().label)}の作戦の机（仮の画面）</small>${talk([['senpai', '今月の手を決めよう。時間を使う手は、時間の予算の中で。']])}<p data-time-left>時間の予算：のこり ${budget - used} ／ ${budget}</p>
      ${row('price', `1杯の値段（いま ${fmt(p.price)}円）`, [[p.price - 50, '−50円'], [p.price, '据え置き'], [p.price + 50, '+50円']])}
      ${row('prep', '仕込み', [['low', '少なめ'], ['mid', 'ふつう'], ['high', '多め']])}
      ${row('staff', `パートの人数（いま ${p.parts}人）`, [[Math.max(0, p.parts - 1), '1人へらす'], [p.parts, 'そのまま'], [Math.min(6, p.parts + 1), '1人ふやす']])}
      ${row('flyer', 'チラシ', [[0, 'なし'], [30000, '3,000部（3万円）'], [100000, '1万部（10万円）']])}
      <div class="s-opts">${tog('map', '地図と口コミの整備')}${tog('forecast', '天気の予報を見る')}${tog('haccp', '衛生の記録')}${tog('inspect', '材料の検品')}${tog('sns', 'SNS に投稿')}${tog('line', 'LINE の配信')}${tog('coupon', 'クーポン')}${tog('tweak', '一杯の手直し')}</div>
      ${trial}${used > budget ? '<p class="s-react ng">時間の予算を越えている。手を減らすか、人をふやそう</p>' : ''}<button class="btn wide" data-plan-ok ${used > budget ? 'disabled' : ''}>これで決める</button><button class="btn ghost" data-plan-same>前月のまま</button></div>`);
    app.onclick = (e) => {
      const b = e.target.closest('[data-plan]');
      if (b) { const k = b.dataset.plan, v = b.dataset.opt; if (v === 'toggle') p[k] = !p[k]; else if (k === 'price') p.price = Math.max(WD.PRICE_MIN, Math.min(WD.PRICE_MAX, +v)); else if (k === 'staff') p.parts = +v; else if (k === 'flyer') p.flyer = +v; else p[k] = v; planScreen(ev); return; }
      if (e.target.closest('[data-plan-same]')) { PLAN = { t, pol: RMx.policy(S, t) }; }
      if (e.target.closest('[data-plan-ok]') || e.target.closest('[data-plan-same]')) {
        if (WD.timeUsed(W, PLAN.pol) > WD.timeBudget(W, PLAN.pol)) PLAN.pol = WD.fitTime(W, PLAN.pol, D.rng(t));
        RMx.plan(S, t, PLAN.pol); S.diary.push({ m: month().label, t: `作戦の机：値段 ${fmt(PLAN.pol.price)}円・パート ${PLAN.pol.parts}人${PLAN.pol.flyer ? '・チラシ' : ''}` }); PLAN = null; save(); next();
      }
    };
  }
  // 月報（仮）：今月の結果と要因、一括確定の行（その他の店のお金・札のお金）を帳簿へ
  function rreportScreen(ev) {
    const r = (S.res || {})[ev.ramenT];
    if (!r) return next();
    const rows = ev.rows(S), auto = ev.auto(S);
    const f = Object.entries(r.factors || {}).filter(([k]) => k !== 'total').sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 3);
    const FN = { ramp: '開店からの立ち上がり', calendar: '暦・行事', weather: '天気', price: '値段', rep: '評判', bowl: '一杯', ad: '宣伝・地図', rival: 'ほかの店', stockout: '品切れ' };
    frame(`<div class="s-card"><small>${esc(month().label)}の月報（仮の画面）</small><table class="s-tb">${rows.map(([k, v]) => `<tr data-rep-row><td>${esc(k)}</td><td class="n">${typeof v === 'number' ? fmt(v) + '円' : esc(v)}</td></tr>`).join('')}</table>${f.length ? `<p class="s-dyn">先月から客数が動いた理由（大きい順）：${f.map(([k, v]) => `<span data-factor="${k}">${esc(FN[k] || k)} ${v >= 0 ? '+' : ''}${v.toFixed(1)}人</span>`).join('・')}</p>` : ''}${auto.length ? `<p class="muted">一括確定で帳簿に入れる行：${auto.map((x) => esc(x.label)).join('・')}</p>` : ''}<button class="btn wide" data-rep-ok>一括確定して、月末の見直しへ</button></div>`);
    app.onclick = (e) => {
      if (!e.target.closest('[data-rep-ok]')) return;
      for (const x of auto) post({ id: x.id, kind: 'auto_report', ans: { dr: x.dr, cr: x.cr } }, { dr: x.dr, cr: x.cr }, true);
      save(); next();
    };
  }
  // 計算の作業台（calc）：数を1つ、手で計算して入れる
  function calcScreen(ev) {
    const need=(ev.names || []).find(acc=>!knows(acc));
    if(need)return namingScreen(need,()=>calcScreen(ev));
    const rows = typeof ev.rows === 'function' ? ev.rows(S) : ev.rows || [];
    const ans = Math.round(Number(typeof ev.answer === 'function' ? ev.answer(S) : ev.answer));
    let tries = 0;
    const draw = (msg) => frame(`<div class="s-card"><small>計算の作業台</small><h3>${esc(ev.title || '')}</h3>${talk(ev.talk)}${rows.length ? `<table class="s-tb">${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${typeof v === 'number' ? fmt(v) + (/％|割合/.test(k) ? '' : '円') : esc(v)}</td></tr>`).join('')}</table>` : ''}<p class="s-q">${esc(ev.q)}</p><div class="s-row"><input data-calc-in inputmode="numeric" aria-label="答えの数"><span>${esc(ev.unit || '')}</span></div>${msg || ''}<button class="btn wide" data-calc-ok>答える</button><button class="link" data-calc-skip>わからないので答えを見る</button></div>`);
    draw();
    app.onclick = (e) => {
      const skip = e.target.closest('[data-calc-skip]');
      if (e.target.closest('[data-calc-next]')) { teach(ev.teaches); S.calcLog = (S.calcLog || []).concat([{ id: ev.id, mi: S.mi, ok: !skip && tries === 1, tries }]); save(); next(); return; }
      if (!skip && !e.target.closest('[data-calc-ok]')) return;
      tries++;
      const raw = ($('[data-calc-in]', app).value || '').normalize('NFKC').replace(/[^\d-]/g, ''), v = Number(raw);
      if (!skip && raw !== '' && v === ans) { frame(`<div class="s-card"><small>計算の作業台</small><p class="s-react">合っている：${fmt(ans)}${esc(ev.unit || '')}</p><p>${esc(ev.why || '')}</p><button class="btn wide" data-calc-next>つぎへ</button></div>`); return; }
      if (skip || tries >= 3) { frame(`<div class="s-card"><small>計算の作業台</small><p class="s-react ng">答えは ${fmt(ans)}${esc(ev.unit || '')}</p><p>${esc(ev.why || '')}</p><button class="btn wide" data-calc-next>つぎへ</button></div>`); return; }
      draw('<p class="s-react ng">ちがうみたい。表の数をもう一度見て計算しよう</p>');
    };
  }
  // ラーメン版の作りかけ（月の中身は DESIGN-RAMEN l.2 の段4・5で入る）。ここまで遊んだ記録は保存されている
  function sliceTodo() {
    frame(`<div class="s-card"><small>${esc(shopName())}</small><h3>この先は準備中</h3>${talk([['shacho', '{名}、店の話は、もう少し待ってくれ。居抜きの店を見に行く準備をしてる！'], ['piyo', '屋台で見つけた「左と右に書く」約束は、店でも使うピヨ。']])}<button class="btn wide ghost" data-ov="map">マップで、見つけた考え方を見る</button></div>`);
  }
  function endScreen(ev) {
    const M = S.metrics;
    const finalOutside=RAMEN&&S.mi>=D.months.length,lastMonth=D.months[D.months.length-1];
    const endY = (ev && ev.y) || (finalOutside?lastMonth.year||1:yearOf(S.mi));
    const endTitle=finalOutside?`${endY}年目${lastMonth.m}月まで進んだ`:`${endY}年目、おつかれさま`;
    const endIntro=finalOutside?`${endY}年目4〜${lastMonth.m}月の`:endY===1?(RAMEN?`${esc(shopName())}は、開店の1年で`:'屋台の小銭2,000円から始まった会社は、1年で'):`${endY}年目の1年で、会社は`;
    const st = statements(), b = st.b;
    // 翌年4月（次の年の月）で振り返るときは、締め切りのときに残した、その年のもうけを使う
    const p = finalOutside?pl(balances(S.L.filter(e=>(e.y||yearOf(e.mi))===endY&&!e.closing))):endY === yearOf(S.mi) ? st.p : { ni: ((S.carry || {})[`y${endY}`] || {}).ni || 0 };
    const disc = Object.entries(M.disc);
    const firstOk = disc.filter(([, d]) => d.first).length;
    const mins = Math.round((Date.now() - M.started) / 60000);
    const forks = Object.entries(M.forks).sort((a, c) => c[1] - a[1]);
    frame(`<div class="s-card"><small>${finalOutside?'ここまでのふりかえり':'1年のふりかえり'}</small><h3>${endTitle}</h3><p>${endIntro}もうけ <b>${fmt(p.ni)}円</b>、口座のお金 <b>${fmt(cashOf(b))}円</b> になった。</p><h4>あなたが決めたこと</h4><ul class="s-diary">${S.diary.map((d) => `<li><b>${esc(d.m)}</b> ${esc(d.t)}</li>`).join('')}</ul><button class="btn wide ghost" data-ov="map">マップで、見つけた考え方を見る</button><details class="s-devlog" ${DEV ? "" : "hidden"}><summary>開発用の記録</summary><table class="s-tb"><tr><td>考える場面で、1回目から正しくたどり着いた</td><td class="n">${firstOk} / ${disc.length}</td></tr><tr><td>先輩の手帳を開いた回数</td><td class="n">${M.hand}</td></tr><tr><td>書類の記帳で、1回目から正しかった</td><td class="n">${M.docs.first} / ${M.docs.n}</td></tr><tr><td>月末に直した回数</td><td class="n">${M.fixes}</td></tr><tr><td>ヒントを見た回数</td><td class="n">${M.hints}</td></tr><tr><td>自動仕訳で進んだ書類</td><td class="n">${M.autoPosted}</td></tr><tr><td>腕だめし</td><td class="n">${M.quiz ? `${M.quiz.score} / ${M.quiz.of}` : '-'}</td></tr><tr><td>予想が当たった（発見の前・月末の締めの前）</td><td class="n">${disc.filter(([, d]) => d.predict && d.predict.ok).length} / ${disc.filter(([, d]) => d.predict).length}・${Object.values(S.predicts || {}).filter((x) => x.ok).length} / ${Object.values(S.predicts || {}).filter((x) => x.act).length}</td></tr><tr><td>ヒントなしで1回目から正しく書けた書類</td><td class="n">${S.docLog.filter((l) => l.ok && !l.hint).length} / ${S.docLog.length}</td></tr><tr><td>月はじめの思い出し</td><td class="n">${(S.recall || []).filter((r) => r.ok).length} / ${(S.recall || []).filter((r) => !r.due).length}</td></tr><tr><td>決算の机（1回目で全部見つけた）</td><td class="n">${S.metrics.desk ? (S.metrics.desk.first ? 'はい' : 'いいえ') : '-'}</td></tr><tr><td>かかった時間</td><td class="n">${mins}分</td></tr></table>${forks.length ? `<p>迷ったところ</p><ul class="s-diary">${forks.map(([f, n]) => `<li>${esc(f)} <b>${n}</b></li>`).join('')}</ul>` : ''}</details><button class="btn wide ghost" data-ov="hall">検定会場で、本試験の形で確かめる</button>${month() && D.months[S.mi + 1] ? `<button class="btn wide" data-n>${endY + 1}年目へ進む</button>` : ''}<button class="btn wide ghost" data-again>最初からもう一度</button></div>`, finalOutside?endY:undefined);
    app.onclick = (e) => { if (e.target.closest('[data-n]')) { next(); return; } if (e.target.closest('[data-again]')) { if (!confirm('ここまでの記録を消して、最初からやり直しますか？（2年目へ進むなら「2年目へ進む」）')) return; S = freshKeep(); S.phase = 'monthIntro'; save(); render(); } };
  }

  B.chapters.forEach((c) => c.qs.forEach((q, i) => { q._key = `${c.id}:${i}`; }));
  if (RUI) RUI.init({ get S() { return S; }, get app() { return app; }, frame, next, save, render, post, talk, month, overlay, teach, knows, gw, balances, preClose, cashOf, pl, shopName, playerName, fill, companyView, bsFrom, advanceMonth, yearOf });
  window.__sim = { get S() { return S; }, get recall() { return RECALL; }, get doc() { return DOC; }, balances, events, render, mastered, testForms };
  // ふりがな（オーナーの決定 2026-10-21）：設定「いつも」なら画面の用語すべてにふりがな。既定（はじめて＋押したとき）は、名前の札などで最初にふりがなを見せ、
  // それ以外の場所の用語は押すと読みが出る。画面が描き直されるたびに、まだ処理していない文字だけを見る
  const RD = LX.read, RDW = Object.keys(RD).sort((a, b) => b.length - a.length);
  const RDRE = new RegExp(RDW.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  const VERB_RD = { 仕入: ['れ', 'しい'], 売上: ['げ', 'うりあ'] };
  function furi(root) {
    if (!root || !RDW.length) return;
    const always = S.furigana === 'always', nodes = [];
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => { const p = n.parentElement; RDRE.lastIndex = 0; return p && !p.closest('ruby,.s-ruby,script,style,select,option,textarea,.s-rd,[data-nofuri],.s-logo') && RDRE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
    while (tw.nextNode()) nodes.push(tw.currentNode);
    for (const n of nodes) {
      const t = n.nodeValue, f = document.createDocumentFragment();
      let last = 0;
      RDRE.lastIndex = 0;
      for (let m; (m = RDRE.exec(t));) {
        const w = m[0], v = VERB_RD[w], rd = v && t[m.index + w.length] === v[0] ? v[1] : RD[w];
        f.append(t.slice(last, m.index));
        // 読みは漢字の上に重ねる（ruby だと読みが長いとき漢字の字の間が開き、語の形が崩れる。2回目の検査 access）。読み上げは漢字だけ
        if (always) { const r = document.createElement('span'); r.className = 's-ruby'; r.append(w); const rt = document.createElement('span'); rt.className = 's-rt'; rt.setAttribute('aria-hidden', 'true'); rt.textContent = rd; r.append(rt); f.append(r); }
        else { const sp = document.createElement('span'); sp.className = 's-rd'; sp.dataset.rd = rd; sp.title = rd; sp.textContent = w; f.append(sp); }
        last = m.index + w.length;
      }
      f.append(t.slice(last));
      n.replaceWith(f);
    }
  }
  new MutationObserver((ms) => { for (const m of ms) for (const x of m.addedNodes) if (x.nodeType === 1) furi(x); }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', (e) => {
    const r = e.target.closest && e.target.closest('.s-rd');
    if (!r || e.target.closest('button,a,label')) return;
    const t = document.createElement('div'); t.className = 's-toast'; t.setAttribute('role', 'status'); t.textContent = `${r.textContent}：${r.dataset.rd}`;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2500);
  });
  // ボタンの形をしたカード（role="button"）も、Enter とスペースで押せる
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    if ((e.key === 'Enter' || e.key === ' ') && t && t.getAttribute && t.getAttribute('role') === 'button' && t.tagName !== 'BUTTON') { e.preventDefault(); t.click(); }
  });
  // ブラウザの「戻る」：ゲームから出ていかないように、履歴に1つ足しておく。戻るを押したら、開いている窓（会社の棚・マップなど）を閉じる。
  // 窓が開いていなければ、いまの画面にとどまり、ゲームの中の「← もどる」の場所を知らせる（ゲームの進み具合は、いつも保存されている）
  try {
    history.pushState({ piyo: 1 }, '');
    window.addEventListener('popstate', () => {
      const ovs = document.querySelectorAll('.s-ov');
      if (ovs.length) ovs[ovs.length - 1].remove();
      else {
        const t = document.createElement('div'); t.className = 's-toast'; t.setAttribute('role', 'status');
        t.textContent = 'ゲームの中にとどまっています。ひとつ前に戻るときは、画面の「← もどる」を。進み具合は保存されています';
        document.body.appendChild(t); setTimeout(() => t.remove(), 4000);
      }
      history.pushState({ piyo: 1 }, '');
    });
  } catch (e) { /* 履歴が使えない環境では何もしない */ }
  // ラーメン版はセーブスロットを選ぶため、いつもタイトルから（つづきから で前の場面へ）
  if (/[?&]test\b/.test(location.search)) testScreen(); else if (RAMEN) titleScreen(); else render();
  // 公開ページとして開かれていれば、ページの保存機能につなぐ。別の端末の新しい続きがあれば読み込む
  const bootAt = Date.now();
  const pulled = (st) => { if (Date.now() - bootAt > 20000 && !document.querySelector('.s-title')) return; S = fromSaved(st); render(); };
  ST.connect(KEY, pulled);
  ST.onStatus(() => { const w = document.querySelector('[data-saveword]'); if (w) w.textContent = saveWord(); });
})();
