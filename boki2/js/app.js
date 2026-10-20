// 簿記2級クエスト — game engine. Reads window.BOKI (core.js + js/data/*.js).
(function () {
  'use strict';
  const B = window.BOKI;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const strip = (s) => String(s || '').replace(/\[\[[\s\S]*?\]\]/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => {
    if (n === null || n === undefined || n === '') return '';
    const x = Number(n);
    return isFinite(x) ? x.toLocaleString('ja-JP', { maximumFractionDigits: 4 }) : String(n);
  };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const dstr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => dstr(new Date());
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dstr(d); };
  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= icons ================= */
  const I = {
    star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.4l2.95 6.07 6.65.8-4.9 4.6 1.27 6.6L12 17.3l-5.97 3.17 1.27-6.6-4.9-4.6 6.65-.8z"/></svg>',
    coin: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="currentColor"/><circle cx="12" cy="12" r="7.6" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.4"/><path d="M8.6 7.4 12 11.8l3.4-4.4M12 11.8v5.4M9.2 12.4h5.6M9.2 14.8h5.6" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round"/></svg>',
    fire: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.6 1.8c.6 3.6 5.4 5.6 5.4 11.4a6 6 0 0 1-12 0c0-2.8 1.3-4.7 2.9-5.9-.1 2.2.9 3.5 2.2 3.8-1-3.3-.1-6.6 1.5-9.3z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-8.5-5.3-8.5-11.4A4.9 4.9 0 0 1 12 6.4a4.9 4.9 0 0 1 8.5 3.2C20.5 15.7 12 21 12 21z"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 2 4 13.5h6.5L9.5 22 20 9.5h-6.6z"/></svg>',
    paper: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M6 2.5h8.5L19 7v14.5H6z"/><path d="M14 2.5V7h5M9 12h7M9 16h5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M4 4.5A2 2 0 0 1 6 3h14v15H6a2 2 0 0 0-2 2z"/><path d="M4 20a2 2 0 0 0 2 1.5h14V18"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9 18h6M10 21.5h4M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.5.4.8 1 .8 1.7h6c0-.7.3-1.3.8-1.7A6.5 6.5 0 0 0 12 2.5z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7zm0 9.6A2.6 2.6 0 1 1 12 6.4a2.6 2.6 0 0 1 0 5.2z"/></svg>',
  };
  const PIYO = '<svg class="piyo" viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="41" rx="22" ry="19" fill="#ffd43b"/><ellipse cx="17" cy="42" rx="6.5" ry="9.5" fill="#fcc419" transform="rotate(18 17 42)"/><circle cx="32" cy="24" r="15.5" fill="#ffd43b"/><path d="M30 8.5c1-4 5-4.6 6-1.4-2.6-.4-4 .4-6 1.4z" fill="#f59f00"/><circle cx="26" cy="23" r="2.6" fill="#1d1d1b"/><circle cx="38" cy="23" r="2.6" fill="#1d1d1b"/><circle cx="26.8" cy="22.2" r=".9" fill="#fff"/><circle cx="38.8" cy="22.2" r=".9" fill="#fff"/><circle cx="21.5" cy="28.5" r="2.6" fill="#ff8787" opacity=".6"/><circle cx="42.5" cy="28.5" r="2.6" fill="#ff8787" opacity=".6"/><path d="M28.6 27.6h6.8L32 32.6z" fill="#f76707"/><rect x="38" y="38" width="15" height="18" rx="2" fill="#0a8566" transform="rotate(-10 45 47)"/><path d="M41 42.5h9M41 46.5h9M41 50.5h6" stroke="#d4efe5" stroke-width="1.6" transform="rotate(-10 45 47)"/><path d="M26 59.5l-2 3M38 59.5l2 3" stroke="#f59f00" stroke-width="2.4" stroke-linecap="round"/></svg>';
  function monster(hue, seed) {
    const s = seed || 0;
    const c1 = `hsl(${hue} 62% 52%)`, c2 = `hsl(${hue} 55% 34%)`, c3 = `hsl(${hue} 70% 80%)`;
    const horn = s % 2 ? 'M34 34 26 8 50 28zM86 34 94 8 70 28z' : 'M38 30c-8-6-10-16-6-24 4 8 10 12 16 14zM82 30c8-6 10-16 6-24-4 8-10 12-16 14z';
    return `<svg class="mon" viewBox="0 0 120 120" aria-hidden="true"><path d="${horn}" fill="${c2}"/><path d="M18 72c0-30 18-46 42-46s42 16 42 46c0 26-16 38-42 38S18 98 18 72z" fill="${c1}"/><ellipse cx="60" cy="88" rx="22" ry="14" fill="${c3}" opacity=".55"/><text x="60" y="96" text-anchor="middle" font-size="20" font-weight="900" fill="${c2}" font-family="sans-serif">¥</text><ellipse cx="44" cy="62" rx="9" ry="10" fill="#fff"/><ellipse cx="76" cy="62" rx="9" ry="10" fill="#fff"/><circle cx="46" cy="64" r="4.5" fill="#1d1d1b"/><circle cx="74" cy="64" r="4.5" fill="#1d1d1b"/><path d="M33 49l20 7M87 49l-20 7" stroke="${c2}" stroke-width="5" stroke-linecap="round"/><path d="M46 78l4 5 5-5 5 5 5-5 5 5 4-5" fill="none" stroke="${c2}" stroke-width="3" stroke-linejoin="round"/></svg>`;
  }
  const CAST = { piyo: [48, ''], senpai: [205, 'タ'], bucho: [338, 'サ'], shacho: [24, '社'], eigyo: [12, 'ハ'], kojo: [36, 'ゴ'], ginko: [222, '田'], kansa: [150, '森'], zeirishi: [268, '大'] };
  function avatar(k) {
    if (k === 'piyo') return `<div class="ava">${PIYO}</div>`;
    const [h, g] = CAST[k] || [190, '?'];
    return `<div class="ava" style="background:hsl(${h} 55% 46%)">${g}</div>`;
  }
  const CAT_HUE = { 資産: 212, 負債: 2, 純資産: 272, 収益: 142, 費用: 30, その他: 190 };
  const CATS5 = ['資産', '負債', '純資産', '収益', '費用'];

  /* ================= state ================= */
  const KEY = 'boki2quest.v1';
  const DEF = () => ({
    name: '', xp: 0, coins: 20, stars: {}, best: {}, cards: [], wrong: {}, boss: {}, rush: {}, exams: [], badges: [],
    streak: { last: '', days: 0 }, daily: { date: '', correct: 0, stages: 0, rush: 0, claimed: [] },
    total: { answered: 0, correct: 0, maxCombo: 0, reviewOk: 0 }, read: {}, hist: {}, mastered: 0, lastPlay: {}, examSeen: [], examDate: '', askedDate: false, settings: { sound: true, free: false },
  });
  function load() {
    const d = DEF();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = Object.assign(d, JSON.parse(raw));
        for (const k of ['settings', 'total', 'streak', 'daily']) s[k] = Object.assign(DEF()[k], s[k]);
        return s;
      }
    } catch (e) { /* storage unavailable: play without saving */ }
    return d;
  }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }

  const xpFor = (L) => 25 * L * (L - 1);
  const levelOf = (xp) => { let L = 1; while (xpFor(L + 1) <= xp) L++; return L; };
  const titleOf = (L) => { let t = B.titles[0][1]; for (const [l, n] of B.titles) if (L >= l) t = n; return t; };

  /* ================= data index ================= */
  const chNum = (id) => parseInt(String(id).replace(/\D/g, ''), 10) || 0;
  const CHAPTERS = B.chapters.slice().sort((a, b) => chNum(a.id) - chNum(b.id));
  const CH = {};
  CHAPTERS.forEach((c) => { CH[c.id] = c; (c.qs || []).forEach((q, i) => { q._key = `${c.id}:${i}`; q._ch = c; }); });
  const QBYKEY = {};
  B.exams.forEach((x) => { x.type = 'fill'; x._key = `exam:${x.id}`; x._ch = { title: `模試 第${x.part}問 ${x.title}`, world: 'exam' }; QBYKEY[x._key] = x; });
  CHAPTERS.forEach((c) => (c.qs || []).forEach((q) => { QBYKEY[q._key] = q; }));
  const WORLDS = B.worlds.map((w) => Object.assign(w, { chapters: CHAPTERS.filter((c) => c.world === w.id) })).filter((w) => w.chapters.length);
  const W = {}; WORLDS.forEach((w) => { W[w.id] = w; });

  const cleared = (cid) => (S.stars[cid] || 0) > 0;
  function worldUnlocked(w) {
    if (S.settings.free) return true;
    const i = WORLDS.indexOf(w);
    if (i <= 0) return true;
    if (w.id === 'w8') return cleared('c00') || !CH.c00;
    const prev = WORLDS[i - 1];
    return prev.chapters.every((c) => cleared(c.id));
  }
  function chapterUnlocked(c) {
    if (S.settings.free) return true;
    const w = W[c.world];
    if (!worldUnlocked(w)) return false;
    const i = w.chapters.indexOf(c);
    return i === 0 || cleared(w.chapters[i - 1].id);
  }
  const bossUnlocked = (w) => S.settings.free || w.chapters.every((c) => cleared(c.id));
  function currentChapter() {
    for (const w of WORLDS) {
      if (!worldUnlocked(w)) continue;
      for (const c of w.chapters) if (chapterUnlocked(c) && !cleared(c.id)) return c;
    }
    return null;
  }

  /* ================= sound ================= */
  let AC = null;
  function tone(f, dur, type, vol, when) {
    if (!S.settings.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const t = AC.currentTime + (when || 0);
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(vol || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) { /* audio unavailable */ }
  }
  const SFX = {
    tap: () => tone(620, 0.04, 'triangle', 0.05),
    ok: (combo) => { const b = 520 * Math.pow(1.06, Math.min(combo || 0, 12)); tone(b, 0.08, 'square', 0.05); tone(b * 1.5, 0.14, 'square', 0.05, 0.07); },
    ng: () => { tone(220, 0.12, 'sawtooth', 0.05); tone(150, 0.25, 'sawtooth', 0.05, 0.1); },
    coin: () => { tone(988, 0.06, 'square', 0.04); tone(1318, 0.18, 'square', 0.04, 0.06); },
    win: () => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, 0.14, 'square', 0.05, i * 0.1)),
    level: () => [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.08, i * 0.09)),
    hit: () => { tone(160, 0.1, 'square', 0.07); tone(90, 0.2, 'sawtooth', 0.06, 0.05); },
    lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.22, 'triangle', 0.07, i * 0.16)),
  };

  /* ================= fx ================= */
  const fxCanvas = document.createElement('canvas');
  fxCanvas.id = 'fx';
  let parts = [], fxRun = false;
  function confetti(n) {
    if (reduceMotion()) return;
    const W0 = (fxCanvas.width = innerWidth * devicePixelRatio), H0 = (fxCanvas.height = innerHeight * devicePixelRatio);
    const cols = ['#0a8566', '#2459d6', '#d63f38', '#e09400', '#ffd43b', '#43dc89'];
    for (let i = 0; i < (n || 120); i++) parts.push({ x: W0 / 2 + (Math.random() - 0.5) * W0 * 0.3, y: H0 * 0.35, vx: (Math.random() - 0.5) * 26, vy: -Math.random() * 26 - 6, r: (Math.random() * 6 + 4) * devicePixelRatio, c: pick(cols), a: Math.random() * 6, life: 1 });
    if (!fxRun) { fxRun = true; requestAnimationFrame(stepFx); }
  }
  function stepFx() {
    const ctx = fxCanvas.getContext('2d');
    ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
    parts.forEach((p) => { p.vy += 0.9; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.a += 0.2; p.life -= 0.008; ctx.save(); ctx.globalAlpha = Math.max(p.life, 0); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); });
    parts = parts.filter((p) => p.life > 0 && p.y < fxCanvas.height + 40);
    if (parts.length) requestAnimationFrame(stepFx); else { fxRun = false; ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height); }
  }
  function floaty(text, el, color) {
    const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
    const f = document.createElement('div');
    f.className = 'floaty'; f.textContent = text;
    f.style.left = r.left + r.width / 2 + 'px'; f.style.top = r.top - 10 + 'px';
    if (color) f.style.color = color;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1200);
  }
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2900);
  }
  function shakeEl(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

  /* ================= rich text (shortcodes) ================= */
  function parseRows(side) {
    return (side || '').split(',').map((x) => x.trim()).filter(Boolean).map((r) => {
      const p = r.split(/\s+/);
      let amt = null;
      if (p.length > 1 && /^(-?[\d.]+|\?|？)$/.test(p[p.length - 1])) amt = p.pop();
      return { label: p.join(' '), amt };
    });
  }
  const showAmt = (a) => (a == null ? '' : a === '?' || a === '？' ? '？' : fmt(a));
  function jeTable(dr, cr) {
    const n = Math.max(dr.length, cr.length);
    let rows = '';
    for (let i = 0; i < n; i++) {
      const d = dr[i] || {}, c = cr[i] || {};
      rows += `<tr><td>${esc(d.label || '')}</td><td class="amt">${showAmt(d.amt)}</td><td class="sep">${esc(c.label || '')}</td><td class="amt">${showAmt(c.amt)}</td></tr>`;
    }
    return `<div class="tbl-wrap"><table class="je"><tr><th class="d" colspan="2">借方</th><th class="c" colspan="2">貸方</th></tr>${rows}</table></div>`;
  }
  function tAcc(body, kind) {
    const [name, l, r] = body.split('|');
    const col = (rows) => rows.map((x) => `<div class="tacc-row"><span>${esc(x.label)}</span><span class="amt">${showAmt(x.amt)}</span></div>`).join('');
    return `<div class="tacc ${kind === 'box' ? 'boxd' : ''}"><div class="tacc-name">${esc((name || '').trim())}</div><div class="tacc-body"><div>${col(parseRows(l))}</div><div>${col(parseRows(r))}</div></div></div>`;
  }
  function rich(s) {
    if (!s) return '';
    let out = String(s).replace(/\[\[(je|t|box):([\s\S]*?)\]\]/g, (m, k, body) => {
      if (k === 'je') { const [d, c] = body.split('|'); return jeTable(parseRows(d), parseRows(c)); }
      return tAcc(body, k);
    });
    // try boxes last, so a [[je]] inside one has already become html
    out = out.replace(/\[\[try:([\s\S]*?)\]\]/g, (m, body) => tryHTML(body));
    // wrap bare tables so they scroll instead of widening the page
    out = out.replace(/<table(?![^>]*class="je")/g, '<div class="tbl-wrap"><table').replace(/<\/table>(?!<\/div>)/g, '</table></div>');
    return out;
  }
  /* ================= lesson visuals ================= */
  // A lesson may carry `viz` (one object or an array). Each renders where the lesson html says [[viz]], or at the end.
  // Types: bs (balance sheet / P/L boxes stepping through transactions), flow (amounts moving between accounts),
  // timeline (a period split into parts), bars (values over time). All step with 前へ / 次へ.
  const VZ = [];
  const vizSlot = (v) => `<div class="viz viz-${esc(v.type)}" data-viz="${VZ.push(v) - 1}"></div>`;
  function withViz(html, viz) {
    if (!viz) return html;
    const list = [].concat(viz);
    let n = 0;
    let out = html.replace(/\[\[viz\]\]/g, () => (n < list.length ? vizSlot(list[n++]) : ''));
    while (n < list.length) out += vizSlot(list[n++]);
    return out;
  }
  function mountViz(root) {
    $$('[data-viz]', root).forEach((el) => {
      if (el.dataset.on) return;
      el.dataset.on = '1';
      const v = VZ[+el.dataset.viz];
      if (v && VIZ[v.type]) VIZ[v.type](el, v);
    });
  }
  function stepper(el, n, render, label) {
    let i = 0;
    if (n <= 1) { render(0, 0); return; }
    el.insertAdjacentHTML('beforeend', `<div class="viz-nav"><button class="btn ghost sm" data-vp aria-label="前の場面">◀ 前へ</button><span class="viz-count num"></span><button class="btn sm" data-vn aria-label="次の場面">次へ ▶</button></div>`);
    const nav = el.lastElementChild;
    const go = (k) => {
      const prev = i; i = Math.max(0, Math.min(n - 1, k));
      $('.viz-count', nav).textContent = `${label || '場面'} ${i + 1} / ${n}`;
      $('[data-vp]', nav).disabled = i === 0; $('[data-vn]', nav).disabled = i === n - 1;
      render(i, prev);
    };
    nav.addEventListener('click', (e) => { if (e.target.closest('[data-vp]')) { SFX.tap(); go(i - 1); } else if (e.target.closest('[data-vn]')) { SFX.tap(); go(i + 1); } });
    go(0);
  }
  const vsum = (rows) => (rows || []).reduce((t, r) => t + r[1], 0);
  const vcap = (s) => `${s.je ? `<div class="viz-je">${rich('[[je: ' + s.je + ']]')}</div>` : ''}<div class="viz-cap">${rich(s.t || '')}</div>`;
  function segs(rows, cat, scale, prev, H) {
    return (rows || []).filter((r) => r[1] > 0).map(([name, val]) => {
      const p = prev ? (prev.find((x) => x[0] === name) || [])[1] : undefined;
      const cls = p === undefined ? 'new' : p !== val ? 'chg' : '';
      const h = Math.max(36, (val / scale) * H);
      return `<div class="seg ${prev ? cls : ''}" style="--ch:${CAT_HUE[cat] || 190};height:${h}px"><span>${esc(name)}</span><b class="num">${fmt(val)}</b></div>`;
    }).join('');
  }
  const VIZ = {
    bs(el, v) {
      const H = 210, steps = v.steps, showPL = v.pl !== false;
      const prof = (s) => vsum(s.収益) - vsum(s.費用);
      const scaleBS = Math.max(1, ...steps.map((s) => Math.max(vsum(s.資産) + Math.max(0, -prof(s)), vsum(s.負債) + vsum(s.純資産) + Math.max(0, prof(s)))));
      const scalePL = Math.max(1, ...steps.map((s) => Math.max(vsum(s.費用) + Math.max(0, prof(s)), vsum(s.収益) + Math.max(0, -prof(s)))));
      el.innerHTML = '<div class="viz-body"></div>';
      const body = el.firstChild;
      stepper(el, steps.length, (i, pi) => {
        const s = steps[i], p = i === pi ? null : steps[pi], pr = prof(s);
        const pseg = (label, val, cat, scale) => (val > 0 ? `<div class="seg ghost" style="--ch:${CAT_HUE[cat]};height:${Math.max(36, (val / scale) * H)}px"><span>${label}</span><b class="num">${fmt(val)}</b></div>` : '');
        const pick = (k) => (p ? p[k] || [] : null);
        const bs = `<div class="sheet"><div class="sheet-t">貸借対照表 <small>持っているもの ／ そのお金の出どころ</small></div><div class="sheet-cols"><div class="col">${segs(s.資産, '資産', scaleBS, pick('資産'), H)}${showPL ? pseg('損失', -pr, '費用', scaleBS) : ''}</div><div class="col">${segs(s.負債, '負債', scaleBS, pick('負債'), H)}${segs(s.純資産, '純資産', scaleBS, pick('純資産'), H)}${showPL ? pseg('もうけ', pr, '純資産', scaleBS) : ''}</div></div><div class="col-labels"><span>資産</span><span>負債 ＋ 純資産</span></div></div>`;
        const plEmpty = !vsum(s.収益) && !vsum(s.費用);
        const pl = showPL ? `<div class="sheet"><div class="sheet-t">損益計算書 <small>この期間のもうけの計算</small></div>${plEmpty ? '<div class="sheet-empty">まだ（または決算で締め切って）空っぽ</div>' : ''}<div class="sheet-cols"><div class="col">${segs(s.費用, '費用', scalePL, pick('費用'), H)}${pseg('もうけ', pr, '純資産', scalePL)}</div><div class="col">${segs(s.収益, '収益', scalePL, pick('収益'), H)}${pseg('損失', -pr, '費用', scalePL)}</div></div><div class="col-labels"><span>費用</span><span>収益</span></div></div>` : '';
        const a = vsum(s.資産), l = vsum(s.負債), e = vsum(s.純資産);
        const eq = `<div class="viz-eq">資産 <b class="num">${fmt(a)}</b> ＝ 負債 <b class="num">${fmt(l)}</b> ＋ 純資産 <b class="num">${fmt(e)}</b>${showPL && (vsum(s.収益) || vsum(s.費用)) ? ` ＋ もうけ <b class="num">${fmt(pr)}</b>` : ''}</div>`;
        body.innerHTML = `<div class="sheets">${bs}${pl}</div>${eq}${vcap(s)}`;
      }, v.label);
    },
    flow(el, v) {
      const steps = v.steps;
      const vals = []; let cur = {};
      steps.forEach((s) => { cur = Object.assign({}, cur, s.vals || {}); vals.push(cur); });
      const mx = Math.max(1, ...vals.flatMap((m) => Object.values(m)));
      el.innerHTML = '<div class="viz-body"></div>';
      const body = el.firstChild;
      stepper(el, steps.length, (i, pi) => {
        const s = steps[i], m = vals[i], pm = i === pi ? {} : vals[pi];
        const mv = s.move || [];
        const boxes = v.boxes.map((b, k) => {
          const val = m[b] || 0, d = val - (pm[b] || 0);
          const arrow = k < v.boxes.length - 1 ? `<div class="flow-arrow ${mv[0] === b && mv[1] === v.boxes[k + 1] ? 'on' : ''}">${mv[0] === b && mv[1] === v.boxes[k + 1] ? `<b class="num">${fmt(mv[2])}</b>` : ''}→</div>` : '';
          const hue = CAT_HUE[(B.accounts[b] || {}).cat] || 190;
          return `<div class="flow-box ${d ? 'chg' : ''}" style="--ch:${hue}"><span>${esc(b)}</span><b class="num">${fmt(val)}</b><i style="height:${(val / mx) * 100}%"></i>${d ? `<em class="num">${d > 0 ? '+' : '−'}${fmt(Math.abs(d))}</em>` : ''}</div>${arrow}`;
        }).join('');
        body.innerHTML = `<div class="flow-row">${boxes}</div>${vcap(s)}`;
      }, v.label);
    },
    timeline(el, v) {
      const n = v.units.length;
      el.innerHTML = '<div class="viz-body"></div>';
      const body = el.firstChild;
      stepper(el, v.steps.length, (i) => {
        const s = v.steps[i];
        const spans = (s.spans || []).map((sp) => `<div class="tl-span" style="--ch:${CAT_HUE[sp.cat] || 190};left:${(sp.from / n) * 100}%;width:${((sp.to - sp.from) / n) * 100}%"><span>${esc(sp.label)}</span></div>`).join('');
        const marks = (s.marks || []).map((mk) => `<div class="tl-mark" style="left:${(mk.at / n) * 100}%"><span>${esc(mk.label)}</span></div>`).join('');
        body.innerHTML = `<div class="tl"><div class="tl-units">${v.units.map((u) => `<span>${esc(u)}</span>`).join('')}</div><div class="tl-track">${spans}${marks}</div></div>${vcap(s)}`;
      }, v.label);
    },
    bars(el, v) {
      const n = v.labels.length;
      const mx = Math.max(1, ...v.labels.map((_, k) => v.series.reduce((t, s) => t + (s.vals[k] || 0), 0)));
      el.innerHTML = '<div class="viz-body"></div>';
      const body = el.firstChild;
      stepper(el, n, (i) => {
        const cols = v.labels.map((lb, k) => `<div class="bar-col ${k > i ? 'later' : ''} ${k === i ? 'now' : ''}"><div class="bar-stack">${v.series.map((s) => (s.vals[k] ? `<div class="bar-seg" style="--ch:${CAT_HUE[s.cat] || 190};height:${(s.vals[k] / mx) * 170}px"><b class="num">${fmt(s.vals[k])}</b></div>` : '')).join('')}</div><span>${esc(lb)}</span></div>`).join('');
        const legend = v.series.map((s) => `<span><i style="background:hsl(${CAT_HUE[s.cat] || 190} 55% 55%)"></i>${esc(s.name)}</span>`).join('');
        body.innerHTML = `<div class="bars-legend">${legend}</div><div class="bars">${cols}</div>${vcap({ t: (v.notes || [])[i] || '', je: (v.jes || [])[i] })}`;
      }, v.label || '時点');
    },
  };
  // [[try: 問い | 選択肢 ; *正解 ; 選択肢 | 解説]] — predict before reading on
  function tryHTML(body) {
    const a = body.indexOf('|'), b = body.lastIndexOf('|');
    const q = body.slice(0, a).trim(), opts = body.slice(a + 1, b).split(';').map((x) => x.trim()).filter(Boolean), ex = body.slice(b + 1).trim();
    return `<div class="try"><div class="try-q">考えてみよう：${q}</div><div class="try-opts">${opts.map((o) => `<button type="button" data-try="${o.startsWith('*') ? 1 : 0}">${o.replace(/^\*/, '')}</button>`).join('')}</div><div class="try-a" hidden>${ex}</div></div>`;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-try]');
    if (!b) return;
    const box = b.closest('.try');
    if (box.dataset.done) return;
    box.dataset.done = '1';
    const ok = b.dataset.try === '1';
    b.classList.add(ok ? 'ok' : 'ng');
    $$('[data-try="1"]', box).forEach((x) => x.classList.add('ok'));
    $('.try-a', box).hidden = false;
    (ok ? SFX.ok : SFX.ng)(0);
    if (ok) { gainXP(2); floaty('+2 XP', b); }
  });

  const entryTable = (e) => (e === 'none' ? '<p><b>仕訳なし</b></p>' : jeTable(e.dr.map(([a, v]) => ({ label: a, amt: v })), e.cr.map(([a, v]) => ({ label: a, amt: v }))));

  /* ================= overlays ================= */
  function openOverlay(html, opts) {
    const ov = document.createElement('div');
    ov.className = 'overlay' + (opts && opts.center ? ' center' : '');
    ov.innerHTML = html;
    document.body.appendChild(ov);
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); if (opts && opts.onClose) opts.onClose(); };
    const onKey = (e) => { if (e.key === 'Escape' && !(opts && opts.sticky)) close(); if (opts && opts.onKey) opts.onKey(e); };
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', (e) => { if (e.target === ov && !(opts && opts.sticky)) close(); });
    return { el: ov, close };
  }
  function modal(html, buttons, opts) {
    const o = openOverlay(`<div class="modal" role="dialog" aria-modal="true">${html}<div class="row">${buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-mi="${i}">${b.t}</button>`).join('')}</div></div>`, Object.assign({ center: true }, opts));
    o.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-mi]');
      if (!b) return;
      const fn = buttons[+b.dataset.mi].on;
      o.close();
      if (fn) fn();
    });
    const first = $('[data-mi]', o.el); if (first) first.focus();
    return o;
  }
  function confirmBox(msg, yes, onYes) {
    modal(`<h2>${msg}</h2>`, [{ t: 'もどる', cls: 'ghost' }, { t: yes, cls: 'bad', on: onYes }]);
  }

  function accOrder(list) {
    const ci = (a) => { const c = (B.accounts[a] || {}).cat || 'その他'; const i = ['資産', '負債', '純資産', '収益', '費用', 'その他'].indexOf(c); return i < 0 ? 9 : i; };
    return list.slice().sort((a, b) => ci(a) - ci(b));
  }
  function pickAccount(options, onPick) {
    const legend = ['資産', '負債', '純資産', '収益', '費用', 'その他'].map((c) => `<span><i style="background:hsl(${CAT_HUE[c]} 55% 55%)"></i>${c === 'その他' ? '評価勘定など' : c}</span>`).join('');
    const o = openOverlay(`<div class="sheet" role="dialog" aria-label="勘定科目をえらぶ"><div class="sheet-head"><h3>勘定科目をえらぶ</h3><button class="icon-btn" data-x aria-label="閉じる">${I.x}</button></div><div class="acc-legend">${legend}</div><div class="acc-grid">${accOrder(options).map((a) => { const m = B.accounts[a] || { cat: 'その他' }; return `<button class="acc-chip" style="--ch:${CAT_HUE[m.cat] || 190}" data-a="${esc(a)}">${esc(a)}</button>`; }).join('')}</div></div>`);
    o.el.addEventListener('click', (e) => {
      if (e.target.closest('[data-x]')) return o.close();
      const b = e.target.closest('[data-a]');
      if (b) { SFX.tap(); o.close(); onPick(b.dataset.a); }
    });
  }
  function keypad(opts) {
    let v = opts.value != null && opts.value !== '' ? String(opts.value) : '';
    const keys = ['7', '8', '9', '←', '4', '5', '6', 'C', '1', '2', '3', opts.neg ? '−' : '', '0', '00', '000', opts.dec ? '.' : ''];
    const o = openOverlay(`<div class="sheet" role="dialog" aria-label="金額を入力"><div class="sheet-head"><h3>${esc(opts.title || '金額を入力')}</h3><button class="icon-btn" data-x aria-label="閉じる">${I.x}</button></div><div class="pad-display"><small>${esc(opts.hint || 'キーボード入力もOK')}</small><span data-d></span></div><div class="pad">${keys.map((k) => (k ? `<button data-k="${k}" class="${/[←C−.]/.test(k) ? 'k-fn' : ''}">${k}</button>` : '<span></span>')).join('')}<button data-k="ok" class="k-ok" style="grid-column:span 4">決定</button></div></div>`, { onKey });
    const disp = $('[data-d]', o.el);
    const show = () => { disp.textContent = v === '' ? '0' : v === '-' ? '−' : (v.startsWith('-') ? '−' : '') + fmtTyping(v.replace('-', '')) + (opts.unit ? ' ' + opts.unit : ''); };
    function fmtTyping(s) { const [i, d] = s.split('.'); return (i ? Number(i).toLocaleString('ja-JP') : '0') + (d !== undefined ? '.' + d : ''); }
    function press(k) {
      if (k === 'ok') { o.close(); const n = v === '' || v === '-' ? null : Number(v); opts.onDone(n); return; }
      SFX.tap();
      if (k === '←') v = v.slice(0, -1);
      else if (k === 'C') v = '';
      else if (k === '−') v = v.startsWith('-') ? v.slice(1) : '-' + v;
      else if (k === '.') { if (!v.includes('.')) v = (v === '' || v === '-' ? v + '0' : v) + '.'; }
      else if (v.replace(/[-.]/g, '').length < 13) v = (v === '0' ? '' : v === '-0' ? '-' : v) + k;
      show();
    }
    function onKey(e) {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('←');
      else if (e.key === 'Enter') { e.preventDefault(); press('ok'); }
      else if (e.key === '-' && opts.neg) press('−');
      else if (e.key === '.' && opts.dec) press('.');
    }
    o.el.addEventListener('click', (e) => {
      if (e.target.closest('[data-x]')) return o.close();
      const b = e.target.closest('[data-k]');
      if (b) press(b.dataset.k);
    });
    show();
  }

  /* ================= question components ================= */
  const TYPE_LABEL = { journal: '仕訳', choice: '選択', number: '計算', fill: '穴埋め', sort: '仕分け' };
  const ansAccounts = (q) => { const out = []; for (const e of [q.ans, ...(q.alt || [])]) if (e && e !== 'none') for (const s of ['dr', 'cr']) for (const [a] of e[s]) out.push(a); return out; };
  function accOptions(q) {
    const ans = ansAccounts(q);
    const pool = q.opts && q.opts.length ? q.opts : (q._ch && q._ch.accounts) || [];
    const set = new Set([...pool, ...ans]);
    if (set.size < 8) {
      const cats = new Set(ans.map((a) => (B.accounts[a] || {}).cat));
      const extra = shuffle(Object.keys(B.accounts).filter((a) => cats.has(B.accounts[a].cat) && !set.has(a)));
      while (set.size < 8 && extra.length) set.add(extra.pop());
    }
    return [...set];
  }
  function normEntry(e) {
    if (e === 'none') return 'none';
    const m = { dr: {}, cr: {} };
    for (const s of ['dr', 'cr']) for (const [a, v] of e[s]) m[s][a] = (m[s][a] || 0) + v;
    return m;
  }
  function sameEntry(a, b) {
    if (a === 'none' || b === 'none') return a === b;
    for (const s of ['dr', 'cr']) {
      const ka = Object.keys(a[s]), kb = Object.keys(b[s]);
      if (ka.length !== kb.length) return false;
      for (const k of ka) if (a[s][k] !== b[s][k]) return false;
    }
    return true;
  }
  const SCALE_SVG = `<svg class="scale" viewBox="0 0 240 104" aria-hidden="true"><path d="M120 24V92" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/><path d="M94 96h52" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/><g class="beam" style="transform-origin:120px 24px"><path d="M30 24H210" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/></g><g class="pan pl" style="transform:translate(30px,24px)"><path d="M0 0-24 34M0 0 24 34" stroke="var(--muted)" stroke-width="1.6"/><path d="M-30 34h60q-6 14-30 14t-30-14z" fill="var(--dr-soft)" stroke="var(--dr)" stroke-width="2.4"/><text y="45" text-anchor="middle" font-size="10" font-weight="700" fill="var(--dr)">借方</text></g><g class="pan pr" style="transform:translate(210px,24px)"><path d="M0 0-24 34M0 0 24 34" stroke="var(--muted)" stroke-width="1.6"/><path d="M-30 34h60q-6 14-30 14t-30-14z" fill="var(--cr-soft)" stroke="var(--cr)" stroke-width="2.4"/><text y="45" text-anchor="middle" font-size="10" font-weight="700" fill="var(--cr)">貸方</text></g><circle cx="120" cy="24" r="6.5" fill="var(--gold)" stroke="var(--ink)" stroke-width="2"/></svg>`;

  function mountJournal(q, el, ctx) {
    const st = { dr: [{ a: '', v: 0 }], cr: [{ a: '', v: 0 }], none: false, locked: false };
    const opts = accOptions(q);
    el.classList.add('jq');
    el.innerHTML = `<div class="scale-box">${SCALE_SVG}<div class="scale-msg"></div></div><div class="jcols"></div><button class="none-btn" type="button">仕訳なし</button>`;
    const cols = $('.jcols', el), noneBtn = $('.none-btn', el);
    const total = (s) => st[s].reduce((t, r) => t + (r.a && r.v ? r.v : 0), 0);
    const filled = () => st.none || (st.dr.some((r) => r.a && r.v) && st.cr.some((r) => r.a && r.v));
    function updateScale() {
      const d = total('dr'), c = total('cr'), mx = Math.max(d, c, 1);
      const ang = Math.max(-13, Math.min(13, ((c - d) / mx) * 13)), rad = (ang * Math.PI) / 180;
      $('.beam', el).style.transform = `rotate(${ang}deg)`;
      $('.pl', el).style.transform = `translate(${120 - 90 * Math.cos(rad)}px, ${24 - 90 * Math.sin(rad)}px)`;
      $('.pr', el).style.transform = `translate(${120 + 90 * Math.cos(rad)}px, ${24 + 90 * Math.sin(rad)}px)`;
      const msg = $('.scale-msg', el);
      const even = d === c && d > 0;
      msg.className = 'scale-msg' + (even ? ' even' : '');
      msg.textContent = st.none ? '仕訳なし を選択中' : even ? `つり合った！ 借方 ${fmt(d)} ＝ 貸方 ${fmt(c)}` : `借方 ${fmt(d)} ／ 貸方 ${fmt(c)}`;
    }
    function draw() {
      cols.classList.toggle('disabled', st.none);
      noneBtn.classList.toggle('on', st.none);
      cols.innerHTML = ['dr', 'cr'].map((s) => `<div class="jcol ${s}"><div class="jhead">${s === 'dr' ? '借方' : '貸方'}<small>${fmt(total(s))}</small></div>${st[s].map((r, i) => `<div class="jrow" data-s="${s}" data-i="${i}"><button class="acc-btn ${r.a ? 'set' : ''}" data-k="acc">${esc(r.a)}</button><button class="amt-btn ${r.v ? 'set' : ''}" data-k="amt">${r.v ? fmt(r.v) : ''}</button>${st[s].length > 1 && !st.locked ? '<button class="row-del" data-k="del" aria-label="この行を消す">×</button>' : ''}</div>`).join('')}${st[s].length < 5 && !st.locked ? `<button class="add-row" data-k="add" data-s="${s}">＋ 行を追加</button>` : ''}</div>`).join('');
      updateScale();
      ctx.ready(filled());
    }
    const askAmt = (r) => keypad({ title: r.a ? `${r.a} の金額` : '金額', value: r.v || '', unit: '円', onDone: (v) => { r.v = v && v > 0 ? Math.round(v) : 0; draw(); } });
    cols.addEventListener('click', (e) => {
      if (st.locked) return;
      const b = e.target.closest('[data-k]');
      if (!b) return;
      const k = b.dataset.k;
      if (k === 'add') { const s = b.dataset.s; st[s].push({ a: '', v: 0 }); SFX.tap(); draw(); return; }
      const row = b.closest('.jrow'), s = row.dataset.s, i = +row.dataset.i, r = st[s][i];
      if (k === 'del') { st[s].splice(i, 1); draw(); return; }
      if (k === 'acc') pickAccount(opts, (a) => { r.a = a; draw(); if (!r.v) askAmt(r); });
      if (k === 'amt') askAmt(r);
    });
    noneBtn.addEventListener('click', () => { if (st.locked) return; st.none = !st.none; SFX.tap(); draw(); });
    draw();
    function userEntry() {
      if (st.none) return 'none';
      const e = { dr: [], cr: [] };
      for (const s of ['dr', 'cr']) for (const r of st[s]) if (r.a && r.v) e[s].push([r.a, r.v]);
      return normEntry(e);
    }
    return {
      check() {
        const u = userEntry();
        const ok = [q.ans, ...(q.alt || [])].some((e) => sameEntry(u, normEntry(e)));
        return { ok, ratio: ok ? 1 : 0 };
      },
      reveal(allOk) {
        st.locked = true; draw();
        const a = normEntry(q.ans), u = userEntry();
        $$('.jrow', cols).forEach((row) => {
          const r = st[row.dataset.s][+row.dataset.i];
          if (!r.a) return;
          row.classList.add(allOk || (a !== 'none' && u !== 'none' && a[row.dataset.s][r.a] === u[row.dataset.s][r.a]) ? 'ok' : 'ng');
        });
      },
      answerHTML: () => entryTable(q.ans),
      hint: () => (q.ans === 'none' ? 'この取引は…本当に仕訳が必要かな？' : `使う科目 → 借方：${q.ans.dr.map((x) => x[0]).join('・')} ／ 貸方：${q.ans.cr.map((x) => x[0]).join('・')}`),
      hintCost: 5,
      summary() { const fm = form(); if (o.exam && fm.dup.length) return `同じ側に同じ科目を2行（${fm.dup.join('・')}）`; const u = userEntry(); if (u === 'none') return '仕訳なし'; const f = (m) => Object.entries(m).map(([a, v]) => `${a} ${fmt(v)}`).join('・') || '（なし）'; return `借方 ${f(u.dr)} ／ 貸方 ${f(u.cr)}`; },
    };
  }

  function mountChoice(q, el, ctx) {
    const order = shuffle(q.c.map((_, i) => i));
    let sel = -1, locked = false;
    el.innerHTML = `<div class="choices">${order.map((i) => `<button class="choice" data-i="${i}">${rich(q.c[i])}</button>`).join('')}</div>`;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('.choice');
      if (!b || locked) return;
      sel = +b.dataset.i;
      $$('.choice', el).forEach((x) => x.classList.toggle('sel', x === b));
      SFX.tap();
      ctx.ready(true);
      if (ctx.instant) ctx.submit();
    });
    return {
      check: () => ({ ok: sel === q.a, ratio: sel === q.a ? 1 : 0 }),
      reveal() { locked = true; $$('.choice', el).forEach((x) => { const i = +x.dataset.i; if (i === q.a) x.classList.add('ok'); else if (i === sel) x.classList.add('ng'); }); },
      answerHTML: () => `<p>正解：<b>${rich(q.c[q.a])}</b></p>`,
      hint() { const wrong = $$('.choice', el).filter((x) => +x.dataset.i !== q.a && !x.classList.contains('gone')); if (wrong.length > 1) pick(wrong).classList.add('gone'); return 'まちがいの選択肢を1つ消したよ'; },
      hintCost: 3,
      summary: () => (sel >= 0 ? strip(q.c[sel]) : '未回答'),
    };
  }

  function mountNumber(q, el, ctx) {
    let v = null, locked = false;
    el.innerHTML = `<button class="num-big" type="button"></button><div class="muted center" style="font-size:12px">タップして数字を入力${q.unit ? `（単位：${esc(q.unit)}）` : ''}</div>`;
    const btn = $('.num-big', el);
    const draw = () => { btn.textContent = v == null ? '' : fmt(v) + (q.unit ? ' ' + q.unit : ''); btn.classList.toggle('set', v != null); ctx.ready(v != null); };
    btn.addEventListener('click', () => { if (!locked) keypad({ title: '答えを入力', value: v == null ? '' : v, unit: q.unit, dec: true, neg: true, onDone: (n) => { v = n; draw(); } }); });
    draw();
    const ok = () => v != null && Math.abs(v - q.a) < 1e-6 + Math.abs(q.a) * 1e-9;
    return {
      check: () => ({ ok: ok(), ratio: ok() ? 1 : 0 }),
      reveal() { locked = true; btn.classList.add(ok() ? 'ok' : 'ng'); },
      answerHTML: () => `<p>正解：<b class="num">${fmt(q.a)}</b> ${esc(q.unit || '')}</p>`,
      summary: () => (v == null ? '未回答' : fmt(v) + (q.unit || '')),
    };
  }

  function mountFill(q, el, ctx) {
    const vals = q.blanks.map(() => null);
    let locked = false;
    const html = rich(q.sheet).replace(/\{\{(\d+)\}\}/g, (m, n) => {
      const b = q.blanks[+n];
      if (b && typeof b === 'object') return `<select class="blank-sel" data-i="${n}" aria-label="空欄${+n + 1}"><option value="">えらぶ</option>${b.opts.map((o, j) => `<option value="${j}">${esc(o)}</option>`).join('')}</select>`;
      return `<button class="blank" type="button" data-i="${n}" aria-label="空欄${+n + 1}"></button>`;
    });
    el.innerHTML = `<div class="sheet-wrap rich">${html}</div>`;
    const anyFilled = () => vals.some((x) => x != null);
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button.blank');
      if (!b || locked) return;
      const i = +b.dataset.i;
      keypad({ title: `空欄 ${i + 1}`, value: vals[i] == null ? '' : vals[i], neg: true, dec: true, hint: 'マイナスは − キー', onDone: (n) => { vals[i] = n; b.textContent = n == null ? '' : fmt(n); b.classList.toggle('set', n != null); ctx.ready(anyFilled()); } });
    });
    el.addEventListener('change', (e) => {
      const s = e.target.closest('.blank-sel');
      if (!s) return;
      vals[+s.dataset.i] = s.value === '' ? null : +s.value;
      ctx.ready(anyFilled());
    });
    const right = (i) => { const b = q.blanks[i], v = vals[i]; if (v == null) return false; return typeof b === 'object' ? v === b.a : Math.abs(v - b) < 1e-6; };
    ctx.ready(false);
    return {
      summary() { let n = 0; q.blanks.forEach((_, i) => { if (right(i)) n++; }); return `${n}/${q.blanks.length} 欄正解`; },
      check() { let n = 0; q.blanks.forEach((_, i) => { if (right(i)) n++; }); return { ok: n === q.blanks.length, ratio: n / q.blanks.length, got: n, of: q.blanks.length }; },
      reveal() {
        locked = true;
        $$('[data-i]', el).forEach((x) => {
          const i = +x.dataset.i, ok = right(i), b = q.blanks[i];
          x.classList.add(ok ? 'ok' : 'ng');
          if (x.tagName === 'SELECT') x.disabled = true;
          if (!ok) x.insertAdjacentHTML('afterend', `<span class="fix">正解 ${esc(typeof b === 'object' ? b.opts[b.a] : fmt(b))}</span>`);
        });
      },
      answerHTML: () => '',
    };
  }

  function mountSort(q, el, ctx) {
    const queue = shuffle(q.items);
    const log = [];
    let i = 0;
    const hues = q.bins.map((b, j) => CAT_HUE[b] || [212, 2, 272, 142, 30, 320, 60, 190][j % 8]);
    el.innerHTML = `<div class="sort-stage"><div class="muted center" data-c style="font-size:12px"></div><div class="sort-item" data-item></div><div class="bins">${q.bins.map((b, j) => `<button class="bin" style="--bh:${hues[j]}" data-b="${j}">${esc(b)}</button>`).join('')}</div><div class="sort-log"></div></div>`;
    const item = $('[data-item]', el), cnt = $('[data-c]', el);
    let busy = false;
    const show = () => { item.className = 'sort-item'; void item.offsetWidth; item.textContent = queue[i][0]; cnt.textContent = `${i + 1} / ${queue.length}`; };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-b]');
      if (!b || busy || i >= queue.length) return;
      const ok = +b.dataset.b === queue[i][1];
      log.push({ t: queue[i][0], ok, right: queue[i][1] });
      item.classList.add(ok ? 'ok' : 'ng');
      (ok ? SFX.ok : SFX.ng)(log.filter((x) => x.ok).length);
      $('.sort-log', el).insertAdjacentHTML('beforeend', `<span class="${ok ? 'ok' : 'ng'}">${esc(queue[i][0])}${ok ? '' : ' → ' + esc(q.bins[queue[i][1]])}</span>`);
      busy = true;
      setTimeout(() => {
        busy = false; i++;
        if (i < queue.length) show();
        else { const n = log.filter((x) => x.ok).length; $('.bins', el).remove(); item.remove(); cnt.textContent = `${n} / ${queue.length} 正解`; ctx.autoDone({ ok: n === queue.length, ratio: n / queue.length }); }
      }, ok ? 380 : 900);
    });
    show();
    ctx.ready(false);
    return { check: () => ({ ok: log.every((x) => x.ok), ratio: log.filter((x) => x.ok).length / queue.length }), reveal() {}, answerHTML: () => '', summary: () => { const m = log.filter((x) => !x.ok).map((x) => x.t); return m.length ? `まちがえた：${m.join('、')}` : ''; } };
  }
  /* ---------- CBT-style inputs (used by the mock exam) ---------- */
  // Accepts what people type in the real CBT: half/full-width digits, commas, 円, and △/▲/- for negatives.
  function toNum(s) {
    if (s == null) return null;
    let t = String(s).trim().replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[,，\s円]/g, '');
    if (t === '') return null;
    let neg = false;
    if (/^[△▲\-−－ー]/.test(t)) { neg = true; t = t.replace(/^[△▲\-−－ー]/, ''); }
    if (!/^\d*\.?\d+$/.test(t)) return NaN;
    return (neg ? -1 : 1) * Number(t);
  }
  // 本番の金額欄は半角数字だけ（カンマ・円・全角は入らない）。マイナスは「-」か「△」。
  const strictNum = (s) => { const t = String(s == null ? '' : s).trim(); if (t === '') return null; if (!/^[-△]?\d+(\.\d+)?$/.test(t)) return NaN; return toNum(t); };
  const halfOnlyWarn = (x) => { const bad = x.value.trim() !== '' && Number.isNaN(strictNum(x.value)); x.classList.toggle('halfbad', bad); x.title = bad ? '半角の数字だけで入力（カンマ・円・全角は使えない）' : ''; return bad; };
  // 第1問の候補：本番と同じく問題ごとに5〜8個。正解の科目に、まちがえやすい科目（問題が用意したもの→同じ章→同じ分類）を混ぜる。
  function shortOptions(q) {
    const ans = [...new Set(ansAccounts(q))];
    const n = Math.min(8, Math.max(6, ans.length + 2));
    const set = new Set(ans);
    const add = (list) => { for (const a of shuffle(list)) { if (set.size >= n) return; if (!set.has(a)) set.add(a); } };
    add(q.opts || []);
    add((q._ch && q._ch.accounts) || []);
    const cats = new Set(ans.map((a) => (B.accounts[a] || {}).cat));
    add(Object.keys(B.accounts).filter((a) => cats.has(B.accounts[a].cat)));
    return shuffle([...set]);
  }
  function mountJournalCBT(q, el, o = {}) {
    const need = q.ans === 'none' ? 1 : Math.max(q.ans.dr.length, q.ans.cr.length);
    const N = Math.max(4, need + 1);
    const opts = o.exam ? shortOptions(q) : accOrder(accOptions(q));
    const optHTML = `<option value="">　</option><option value="__none">仕訳なし</option>${opts.map((a) => `<option value="${esc(a)}">${esc(a)}</option>`).join('')}`;
    el.innerHTML = `<div class="cbt-je"><table><thead><tr><th colspan="2" class="d">借方</th><th colspan="2" class="c">貸方</th></tr><tr><th>勘定科目</th><th>金額</th><th>勘定科目</th><th>金額</th></tr></thead><tbody>${Array.from({ length: N }, (_, i) => `<tr data-r="${i}">${['dr', 'cr'].map((s) => `<td><select data-s="${s}" aria-label="${s === 'dr' ? '借方' : '貸方'}の勘定科目 ${i + 1}行目">${optHTML}</select></td><td><input data-s="${s}" inputmode="numeric" autocomplete="off" spellcheck="false" aria-label="${s === 'dr' ? '借方' : '貸方'}の金額 ${i + 1}行目"></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    const num = o.exam ? strictNum : toNum;
    if (o.exam) el.addEventListener('input', (e) => { if (e.target.matches('input')) halfOnlyWarn(e.target); });
    const rows = () => $$('tbody tr', el).map((tr) => ({ tr, dr: { a: $('select[data-s="dr"]', tr).value, raw: $('input[data-s="dr"]', tr).value, v: num($('input[data-s="dr"]', tr).value) }, cr: { a: $('select[data-s="cr"]', tr).value, raw: $('input[data-s="cr"]', tr).value, v: num($('input[data-s="cr"]', tr).value) } }));
    // 本番の採点で0点になる書き方：同じ科目を同じ側に2行、半角でない金額
    function form() {
      const rs = rows(), dup = [], bad = [];
      for (const s of ['dr', 'cr']) { const seen = new Set(); for (const r of rs) if (r[s].a && r[s].a !== '__none') { if (seen.has(r[s].a)) dup.push(r[s].a); seen.add(r[s].a); } }
      for (const r of rs) for (const s of ['dr', 'cr']) if (r[s].raw.trim() !== '' && Number.isNaN(r[s].v)) bad.push(r[s].raw.trim());
      return { dup: [...new Set(dup)], bad };
    }
    function userEntry() {
      const rs = rows();
      if (rs.some((r) => r.dr.a === '__none' || r.cr.a === '__none')) return 'none';
      const e = { dr: [], cr: [] };
      for (const r of rs) for (const s of ['dr', 'cr']) if (r[s].a && r[s].v > 0) e[s].push([r[s].a, Math.round(r[s].v)]);
      return normEntry(e);
    }
    const accSet = (m) => (m === 'none' ? 'none' : ['dr', 'cr'].map((s) => Object.keys(m[s]).sort().join('|')).join('/'));
    return {
      answered: () => $$('select, input', el).some((x) => x.value.trim() !== ''),
      check() {
        const u = userEntry(), f = o.exam ? form() : { dup: [], bad: [] };
        const same = [q.ans, ...(q.alt || [])].some((e) => sameEntry(u, normEntry(e)));
        const ok = same && !f.dup.length && !f.bad.length;
        // 誤りの見立て：科目は合っていて金額だけ違う→計算、書き方の規則違反→形式
        const accOk = [q.ans, ...(q.alt || [])].some((e) => accSet(normEntry(e)) === accSet(u));
        const why = ok ? '' : f.dup.length ? 'dup' : f.bad.length ? 'half' : accOk ? 'amount' : 'account';
        return { ok, ratio: ok ? 1 : 0, why, dup: f.dup, bad: f.bad };
      },
      reveal(allOk) {
        const a = normEntry(q.ans), u = userEntry();
        rows().forEach((r) => {
          for (const s of ['dr', 'cr']) {
            const cells = $$(`[data-s="${s}"]`, r.tr);
            if (!r[s].a && r[s].v == null) continue;
            const good = allOk || (a !== 'none' && u !== 'none' && r[s].a && a[s][r[s].a] != null && a[s][r[s].a] === u[s][r[s].a]);
            cells.forEach((c) => c.classList.add(good ? 'ok' : 'ng'));
          }
        });
        $$('select, input', el).forEach((x) => { x.disabled = true; });
      },
      answerHTML: () => entryTable(q.ans),
      summary() { const fm = form(); if (o.exam && fm.dup.length) return `同じ側に同じ科目を2行（${fm.dup.join('・')}）`; const u = userEntry(); if (u === 'none') return '仕訳なし'; const f = (m) => Object.entries(m).map(([k, v]) => `${k} ${fmt(v)}`).join('・') || '（なし）'; return `借方 ${f(u.dr)} ／ 貸方 ${f(u.cr)}`; },
    };
  }
  function mountFillCBT(q, el, o = {}) {
    const html = rich(q.sheet).replace(/\{\{(\d+)\}\}/g, (m, n) => {
      const b = q.blanks[+n];
      if (b && typeof b === 'object') return `<select class="blank-sel" data-i="${n}" aria-label="空欄${+n + 1}"><option value="">　</option>${b.opts.map((o, j) => `<option value="${j}">${esc(o)}</option>`).join('')}</select>`;
      return `<input class="blank-in" data-i="${n}" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="空欄${+n + 1}">`;
    });
    el.innerHTML = `<div class="sheet-wrap rich">${html}</div>`;
    const num = o.exam ? strictNum : toNum;
    if (o.exam) el.addEventListener('input', (e) => { if (e.target.matches('input')) halfOnlyWarn(e.target); });
    const val = (i) => { const x = $(`[data-i="${i}"]`, el); if (!x) return null; if (x.tagName === 'SELECT') return x.value === '' ? null : +x.value; return num(x.value); };
    const right = (i) => { const b = q.blanks[i], v = val(i); if (v == null || Number.isNaN(v)) return false; return typeof b === 'object' ? v === b.a : Math.abs(v - b) < 1e-6; };
    const count = () => q.blanks.reduce((n, _, i) => n + (right(i) ? 1 : 0), 0);
    return {
      answered: () => $$('[data-i]', el).some((x) => x.value.trim() !== ''),
      check() {
        const n = count(), half = $$('input[data-i]', el).filter((x) => x.value.trim() !== '' && Number.isNaN(num(x.value))).length;
        const empty = $$('[data-i]', el).filter((x) => x.value.trim() === '').length;
        return { ok: n === q.blanks.length, ratio: n / q.blanks.length, got: n, of: q.blanks.length, half, empty };
      },
      reveal() {
        $$('[data-i]', el).forEach((x) => {
          const i = +x.dataset.i, ok = right(i), b = q.blanks[i];
          x.classList.add(ok ? 'ok' : 'ng'); x.disabled = true;
          if (!ok) x.insertAdjacentHTML('afterend', `<span class="fix">正解 ${esc(typeof b === 'object' ? b.opts[b.a] : fmt(b))}</span>`);
        });
      },
      answerHTML: () => '',
      summary: () => `${count()}/${q.blanks.length} 欄正解`,
    };
  }
  // On-screen calculator for practice without a physical one (the real exam allows bringing your own).
  function calcPanel() {
    let cur = '0', acc = null, op = null, fresh = true;
    const keys = ['C', '←', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '00', '.', '='];
    const el = document.createElement('div');
    el.className = 'cbt-tool calc';
    el.innerHTML = `<div class="tool-head"><b>電卓</b><button class="icon-btn" data-close aria-label="電卓を閉じる">${I.x}</button></div><div class="calc-disp" data-d>0</div><div class="calc-keys">${keys.map((k) => `<button data-k="${k}" class="${/[÷×−+=]/.test(k) ? 'op' : ''}">${k}</button>`).join('')}</div>`;
    const disp = $('[data-d]', el);
    const ap = (a, b, o) => (o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : o === '÷' ? (b === 0 ? NaN : a / b) : b);
    const show = () => { const n = Number(cur); disp.textContent = Number.isFinite(n) ? n.toLocaleString('ja-JP', { maximumFractionDigits: 6 }) + (cur.endsWith('.') ? '.' : '') : 'エラー'; };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      const k = b.dataset.k;
      if (/^\d+$/.test(k)) { cur = fresh || cur === '0' ? (k === '00' ? '0' : k) : cur + k; fresh = false; }
      else if (k === '.') { if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.')) cur += '.'; }
      else if (k === 'C') { cur = '0'; acc = null; op = null; fresh = true; }
      else if (k === '←') { cur = cur.length > 1 ? cur.slice(0, -1) : '0'; }
      else if (k === '%') { cur = String((acc != null ? acc : 1) * Number(cur) / 100); fresh = true; }
      else if (k === '=') { if (op) { cur = String(ap(acc, Number(cur), op)); acc = null; op = null; } fresh = true; }
      else { acc = op && !fresh ? ap(acc, Number(cur), op) : acc == null ? Number(cur) : op && fresh ? acc : Number(cur); if (!op || !fresh) cur = String(acc); op = k; fresh = true; }
      show();
    });
    return el;
  }
  const MOUNT = { journal: mountJournal, choice: mountChoice, number: mountNumber, fill: mountFill, sort: mountSort };

  /* ================= progress helpers ================= */
  function ensureDaily() { if (S.daily.date !== today()) S.daily = { date: today(), correct: 0, stages: 0, rush: 0, claimed: [] }; }
  function markStudy() {
    const t = today();
    if (S.streak.last === t) return;
    S.streak.days = S.streak.last === yesterday() ? S.streak.days + 1 : 1;
    S.streak.last = t;
  }
  const levelQueue = [];
  function gainXP(n) {
    const before = levelOf(S.xp);
    S.xp += Math.max(0, Math.round(n));
    const after = levelOf(S.xp);
    if (after > before) levelQueue.push([before, after]);
    renderHUD();
  }
  function gainCoins(n) { S.coins = Math.max(0, S.coins + n); renderHUD(); }
  function flushLevelUps(then) {
    const lv = levelQueue.shift();
    if (!lv) { if (then) then(); return; }
    while (levelQueue.length) lv[1] = levelQueue.shift()[1];
    const [a, b] = lv, newTitle = titleOf(b) !== titleOf(a);
    SFX.level(); confetti(160);
    modal(`<div class="eyebrow">LEVEL UP</div><div class="pix" style="font-size:54px;color:var(--brand);line-height:1">Lv.${b}</div>${newTitle ? `<p>昇進！ 肩書きが <b>${titleOf(b)}</b> になった！</p>` : `<p>${esc(S.name || 'キミ')}さんの経理力がアップした！</p>`}`, [{ t: 'やったね', on: then }], { sticky: true });
  }
  const DAY = 864e5;
  // Leitner-style: a miss is due now; each correct answer on its due day pushes it out 1, 3, then 7 days; the next correct graduates it.
  const SRS = [1, 3, 7];
  function recordAnswer(q, ok, review, last) {
    ensureDaily(); markStudy();
    S.total.answered++;
    if (q._ch && q._ch.id) S.lastPlay[q._ch.id] = Date.now();
    if (q._key) { const h = S.hist[q._key] || (S.hist[q._key] = [0, 0]); h[0]++; if (ok) h[1]++; }
    if (ok) {
      S.total.correct++; S.daily.correct++;
      const w = S.wrong[q._key];
      // only an answer given when the item is due moves it up a step
      if (w && (w.due || 0) <= Date.now()) { w.ok = (w.ok || 0) + 1; if (w.ok > SRS.length) { delete S.wrong[q._key]; S.mastered = (S.mastered || 0) + 1; } else w.due = Date.now() + SRS[w.ok - 1] * DAY; }
      if (review) S.total.reviewOk++;
    } else if (q._key) {
      const p = S.wrong[q._key] || {};
      S.wrong[q._key] = { n: (p.n || 0) + 1, ok: 0, t: Date.now(), due: Date.now(), last: last || '' };
    }
  }

  const BADGES = [
    ['first', 'はじめの一歩', 'ステージを初めてクリア', () => Object.keys(S.stars).length >= 1, 162],
    ['st10', '10ステージ制覇', 'ステージを10個クリア', () => Object.values(S.stars).filter((x) => x > 0).length >= 10, 162],
    ['stall', '全ステージ制覇', 'すべてのステージをクリア', () => CHAPTERS.every((c) => cleared(c.id)), 45],
    ['perfect', 'パーフェクト', 'ステージを全問正解でクリア', () => Object.values(S.stars).includes(3), 45],
    ['perf10', '完璧主義者', '★3つのステージが10個', () => Object.values(S.stars).filter((x) => x === 3).length >= 10, 45],
    ['combo10', '10コンボ', '10問連続で正解', () => S.total.maxCombo >= 10, 2],
    ['combo25', '25コンボ', '25問連続で正解', () => S.total.maxCombo >= 25, 2],
    ['q100', '100問突破', '累計100問正解', () => S.total.correct >= 100, 212],
    ['q500', '500問突破', '累計500問正解', () => S.total.correct >= 500, 212],
    ['boss1', '初ボス撃破', 'ボスを1体たおす', () => Object.keys(S.boss).length >= 1, 330],
    ['bossall', '全ボス撃破', 'すべてのボスをたおす', () => WORLDS.every((w) => S.boss[w.id]), 330],
    ['rush30', 'スピード仕分け', '仕分けラッシュで30点', () => Object.values(S.rush).some((x) => x >= 30), 30],
    ['exam70', '模試合格', '模擬試験で70点以上', () => S.exams.some((e) => e.score >= 70), 142],
    ['exam90', '満点が見えた', '模擬試験で90点以上', () => S.exams.some((e) => e.score >= 90), 142],
    ['exam100', '満点合格', '模擬試験で100点', () => S.exams.some((e) => e.score >= 100), 50],
    ['streak3', '3日連続', '3日続けて学習', () => S.streak.days >= 3, 18],
    ['streak7', '1週間連続', '7日続けて学習', () => S.streak.days >= 7, 18],
    ['cards20', '実務コレクター', '実務カードを20枚集める', () => S.cards.length >= 20, 185],
    ['review20', '復習の達人', '復習モードで20問正解', () => S.total.reviewOk >= 20, 272],
  ];
  const medal = (h) => `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 2h7l4 14h-7zM33 2h-7l-4 14h7z" fill="hsl(${h} 50% 45%)"/><circle cx="24" cy="30" r="15" fill="hsl(${h} 70% 55%)" stroke="hsl(${h} 60% 35%)" stroke-width="3"/><path d="M24 21.5l2.6 5.3 5.8.8-4.2 4 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.2-4 5.8-.8z" fill="#fff"/></svg>`;
  function checkBadges() {
    for (const [id, name, , test] of BADGES) {
      if (!S.badges.includes(id) && test()) { S.badges.push(id); setTimeout(() => { toast(`バッジ獲得：${name}`); SFX.coin(); }, 600); }
    }
    save();
  }

  /* ================= chrome ================= */
  const app = document.createElement('div');
  app.id = 'app';
  app.innerHTML = '<header class="hud"></header><main id="main"></main><nav class="tabbar" aria-label="メニュー"></nav>';
  document.body.appendChild(app);
  document.body.appendChild(fxCanvas);
  const main = $('#main'), hud = $('.hud'), tabbar = $('.tabbar');

  function renderHUD() {
    const L = levelOf(S.xp), lo = xpFor(L), hi = xpFor(L + 1);
    const pct = Math.min(100, ((S.xp - lo) / (hi - lo)) * 100);
    hud.innerHTML = `<div class="hud-lv"><div class="lv-badge"><div><small>LV</small>${L}</div></div><div class="hud-xp"><div class="hud-title">${esc(titleOf(L))}${S.name ? ` ・ ${esc(S.name)}` : ''}</div><div class="bar"><i style="width:${pct}%"></i></div></div></div><span class="chip-stat" title="連続学習日数"><span class="fire-c">${I.fire}</span>${S.streak.last === today() || S.streak.last === yesterday() ? S.streak.days : 0}</span><span class="chip-stat" title="コイン"><span class="coin-c">${I.coin}</span><span data-coins>${S.coins}</span></span><button class="icon-btn" data-go="settings" aria-label="設定">${I.gear}</button>`;
  }
  const TABS = [['home', 'マップ', I.map], ['review', '復習', I.redo], ['rush', 'ラッシュ', I.bolt], ['exam', '模試', I.paper], ['zukan', '図鑑', I.book]];
  function renderTabs(cur) {
    const nDue = (() => { const now = Date.now(); return Object.keys(S.wrong).filter((k) => QBYKEY[k] && (S.wrong[k].due || 0) <= now).length; })();
    tabbar.innerHTML = TABS.map(([k, t, ic]) => `<button data-go="${k}" ${k === cur ? 'aria-current="page"' : ''}>${ic}<span>${t}</span>${k === 'review' && nDue ? `<em class="tab-badge" aria-label="今日の復習 ${nDue}問">${nDue > 99 ? '99+' : nDue}</em>` : ''}</button>`).join('');
  }
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]');
    if (g && !g.closest('.overlay')) { SFX.tap(); guardLeave(() => go(g.dataset.go)); }
  });

  let cleanup = null, leaveGuard = null;
  function guardLeave(fn) {
    if (leaveGuard) { const msg = leaveGuard; confirmBox(msg, 'やめる', () => { leaveGuard = null; fn(); }); } else fn();
  }
  const FOCUS = new Set(['stage', 'quiz', 'boss', 'rushplay', 'examplay']);
  function go(name, ...args) {
    if (cleanup) { cleanup(); cleanup = null; }
    leaveGuard = null;
    document.body.classList.toggle('focus', FOCUS.has(name));
    window.scrollTo(0, 0);
    renderHUD();
    renderTabs({ quiz: 'home', stage: 'home', boss: 'home', rushplay: 'rush', examplay: 'exam', settings: '' }[name] ?? name);
    SCREENS[name](...args);
  }

  /* ================= screens ================= */
  const TIPS = [
    '仕訳に迷ったら「何が増えて、何が減った？」を先に考えるピヨ。',
    '商品以外を後払いで買ったら「未払金」。買掛金は商品だけピヨ！',
    '本試験の第1問は仕訳5題で20点。ここを満点にすると合格がぐっと近づくピヨ。',
    '工業簿記は「材料 → 仕掛品 → 製品 → 売上原価」の流れが命ピヨ。',
    '会計ソフトに入力するのも、中身は仕訳。簿記がわかれば経理の仕事がわかるピヨ。',
    '貸倒引当金は「売掛金のうち、回収できなさそうな分」の見積もりピヨ。',
    '連結は「グループを1つの会社とみなす」。親子の間の取引は消すピヨ。',
    '減価償却は「長く使うものの値段を、使う年数に分けて費用にする」しくみピヨ。',
    '標準原価計算の差異は「実際 − 標準」。マイナスなら有利差異ピヨ。',
  ];

  SCREENS = {};
  var SCREENS;

  SCREENS.home = function () {
    ensureDaily();
    const cur = currentChapter();
    const nClear = CHAPTERS.filter((c) => cleared(c.id)).length;
    const MISSIONS = [['m1', '10問正解する', 'correct', 10], ['m2', 'ステージを1つクリア', 'stages', 1], ['m3', '仕分けラッシュを1回あそぶ', 'rush', 1]];
    const mis = MISSIONS.map(([id, t, f, n]) => {
      const v = Math.min(S.daily[f], n), done = S.daily.claimed.includes(id);
      return `<div class="mission ${done ? 'done' : ''}"><div>${t} <span class="num muted">${v}/${n}</span></div><div class="bar gold"><i style="width:${(v / n) * 100}%"></i></div>${done ? '<span class="tag">受取済</span>' : `<button class="btn gold sm" data-claim="${id}" ${v < n ? 'disabled' : ''}>受け取る</button>`}</div>`;
    }).join('');
    let html = `<div class="stack"><div class="hero">${PIYO}<div class="stack" style="gap:6px"><h1>${S.name ? `<span class="hero-name">${esc(S.name)}さん</span>` : ''}今日も仕訳を切ろう</h1><div class="bubble">${pick(TIPS)}</div></div></div>`;
    if (S.examDate) {
      const days = Math.ceil((new Date(S.examDate + 'T00:00:00') - new Date(today() + 'T00:00:00')) / DAY);
      const left = CHAPTERS.filter((c) => !cleared(c.id)).length;
      if (days >= 0) html += `<div class="card countdown"><div><div class="eyebrow">本試験まで</div><span class="pix" style="font-size:30px;color:var(--cr)">${days}</span><b> 日</b></div><div style="font-size:13px;text-align:right">残り ${left} ステージ<br>${left ? `1日 <b>${days ? Math.ceil(left / Math.max(1, days - 7)) : left}</b> ステージで、最後の1週間を模試にあてられる` : '全ステージクリア！ 模試と復習で仕上げよう'}</div></div>`;
    } else html += '<button class="link" data-go="settings" style="justify-self:start">受験予定日を設定すると、残り日数と1日の目安が出るよ</button>';
    html += cur ? `<button class="btn wide" data-stage="${cur.id}">${I.pin}<span>つづきから：${esc(cur.title)}</span></button>` : `<button class="btn gold wide" data-go="exam">${I.paper}<span>全ステージクリア！ 模擬試験で満点をねらう</span></button>`;
    html += `<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h3>今日のミッション</h3><span class="muted" style="font-size:12px">報酬 各 ${'コイン15・XP40'}</span></div><div class="missions">${mis}</div></div>`;
    const weak = THEMES.map((t) => ({ t, s: themeStats(t) })).filter((r) => r.s.wrong > 0).sort((a, b) => b.s.wrong - a.s.wrong).slice(0, 3);
    if (weak.length) html += `<div class="card stack" style="gap:8px"><div class="row" style="justify-content:space-between"><h3>苦手テーマ</h3><button class="link" data-go="review">復習の部屋へ</button></div>${weak.map(({ t, s }) => `<div class="row" style="justify-content:space-between;flex-wrap:nowrap"><span style="min-width:0"><b>${esc(t.title)}</b> <span class="muted" style="font-size:12px">まちがい ${s.wrong}・正答率 ${s.acc ?? '-'}%</span></span><button class="btn sm" style="flex:none" data-homedrill="${t.id}">特訓</button></div>`).join('')}</div>`;
    html += `<div class="muted" style="font-size:13px">ステージ ${nClear} / ${CHAPTERS.length} クリア ・ 実務カード ${S.cards.length} 枚</div></div>`;
    WORLDS.forEach((w, wi) => {
      const un = worldUnlocked(w);
      const done = w.chapters.filter((c) => cleared(c.id)).length;
      html += `<section class="world ${un ? '' : 'locked'}" style="--h:${w.hue}"><div class="world-head"><div class="eyebrow">WORLD ${wi + 1} ・ ${esc(w.area)}</div><h2>${esc(w.name)}</h2><div style="font-size:12px;opacity:.9">${esc(w.theme)}</div><div class="wprog">${un ? `${done}/${w.chapters.length}` : I.lock.replace('<svg', '<svg width="22" height="22"')}</div></div><div class="path">`;
      const X = [0, 46, 80, 46, 0, 30, 64, 30];
      w.chapters.forEach((c, i) => {
        const u = chapterUnlocked(c), rusty = cleared(c.id) && S.lastPlay[c.id] && Date.now() - S.lastPlay[c.id] > 30 * DAY, st = Math.max(0, (S.stars[c.id] || 0) - (rusty ? 1 : 0));
        html += `<div class="node ${u ? '' : 'locked'} ${cur === c ? 'current' : ''}" style="padding-left:${X[i % X.length]}px"><button class="node-btn" data-stage="${c.id}" aria-label="${esc(c.title)}" ${u ? '' : 'aria-disabled="true"'}>${u ? chNum(c.id) : I.lock.replace('<svg', '<svg width="24" height="24"')}</button><div class="node-info"><div class="node-title">${esc(c.title)}</div><div class="node-sub">${esc(c.sub || '')}</div>${rusty ? '<span class="tag lv2">30日ぶり・復習どき</span> ' : ''}<div class="stars">${[1, 2, 3].map((k) => `<span class="${k <= st ? 'star-on' : 'star-off'}">${I.star}</span>`).join('')}</div></div></div>`;
      });
      const bu = bossUnlocked(w) && un;
      html += `<div class="node boss ${bu ? '' : 'locked'}" style="padding-left:30px"><button class="node-btn" data-boss="${w.id}" aria-label="ボス ${esc(w.boss.name)}">${monster(w.hue, wi)}</button><div class="node-info"><div class="eyebrow">BOSS</div><div class="node-title">${esc(w.boss.name)}</div><div class="node-sub">${S.boss[w.id] ? '撃破済み・再戦OK' : bu ? '挑戦できる！' : 'ワールドの全ステージをクリアで出現'}</div></div></div></div></section>`;
    });
    main.innerHTML = html;
    main.onclick = (e) => {
      const s = e.target.closest('[data-stage]');
      if (s) { const c = CH[s.dataset.stage]; if (chapterUnlocked(c)) { SFX.tap(); go('stage', c.id); } else { shakeEl(s); toast('前のステージをクリアすると開くよ'); } return; }
      const bo = e.target.closest('[data-boss]');
      if (bo) { const w = W[bo.dataset.boss]; if (bossUnlocked(w) && worldUnlocked(w)) go('boss', w.id); else { shakeEl(bo); toast('このワールドの全ステージをクリアしよう'); } return; }
      const hd = e.target.closest('[data-homedrill]');
      if (hd) { const t = TH[hd.dataset.homedrill]; startReview(drillItems(t, 10), `${t.title} 特訓`); return; }
      const cl = e.target.closest('[data-claim]');
      if (cl) { S.daily.claimed.push(cl.dataset.claim); gainCoins(15); gainXP(40); SFX.coin(); floaty('+15', cl); save(); flushLevelUps(() => SCREENS.home()); }
    };
    if (!S.name) setTimeout(askName, 300);
    else if (!S.examDate && !S.askedDate && today() >= '2027-04-01') { S.askedDate = true; save(); modal('<h2>受験予定日を教えて</h2><p style="margin:0">2027年度（2027年4月〜）の試験から出題範囲が変わる見込みです。受験日を設定すると、範囲に合わせて模試を出題します。</p>', [{ t: 'あとで', cls: 'ghost' }, { t: '設定する', on: () => go('settings') }]); }
    else flushLevelUps();
  };

  function askName() {
    const o = openOverlay(`<div class="modal" role="dialog" aria-modal="true"><div style="width:90px;margin:0 auto">${PIYO}</div><h2>ミライ商事へようこそ！</h2><p style="margin:0">キミは今日から経理部の新人。<br>会社のお金の動きを記録して、会社を守るのが仕事だピヨ。<br>名前を教えて！</p><form data-f class="stack" style="gap:10px"><input id="player-name" class="search" maxlength="12" placeholder="なまえ（12文字まで）" autocomplete="nickname"><button class="btn wide" type="submit">入社する</button></form></div>`, { center: true, sticky: true });
    const inp = $('#player-name', o.el);
    setTimeout(() => inp.focus(), 50);
    $('[data-f]', o.el).addEventListener('submit', (e) => { e.preventDefault(); S.name = inp.value.trim().slice(0, 12) || 'ルーキー'; save(); o.close(); SFX.win(); renderHUD(); SCREENS.home(); });
  }

  /* ---------- stage: scene → lessons → quiz → result ---------- */
  SCREENS.stage = function (cid, phase) {
    if (cleanup) { cleanup(); cleanup = null; }
    const c = CH[cid];
    const w = W[c.world];
    const again = cleared(cid);
    const top = (pct, label) => `<div class="stage-top"><button class="icon-btn" data-quit aria-label="マップにもどる">${I.x}</button><div class="bar"><i style="width:${pct}%"></i></div><span class="muted" style="font-size:12px;font-weight:700">${label}</span></div>`;
    main.onclick = null;
    const quitHandler = (e) => { if (e.target.closest('[data-quit]')) guardLeave(() => go('home')); };
    main.addEventListener('click', quitHandler);
    cleanup = () => main.removeEventListener('click', quitHandler);

    if (!phase || phase === 'scene') {
      let shown = 1;
      const draw = () => {
        const lines = c.scene.lines.slice(0, shown).map(([k, t], li) => `<div class="line ${li === shown - 1 ? 'new' : ''}">${avatar(k)}<div><div class="who">${esc((B.cast[k] || {}).name || k)}${B.cast[k] ? ` ・ ${esc(B.cast[k].role)}` : ''}</div><div class="bubble">${rich(t)}</div></div></div>`).join('');
        const end = shown >= c.scene.lines.length;
        main.innerHTML = `${top(8, 'ストーリー')}<div class="stack" style="--h:${w.hue}"><div><div class="eyebrow">STAGE ${chNum(c.id)} ・ ${esc(w.name)}</div><h1 style="font-size:24px">${esc(c.title)}</h1></div><div><span class="place">${I.pin.replace('<svg', '<svg width="14" height="14"')}${esc(c.scene.place || w.area)}</span></div><div class="talk">${lines}</div>${end ? `<div class="mission-card"><span class="eyebrow">MISSION</span><b>${esc(c.scene.mission)}</b></div><button class="btn wide" data-next>レッスンへ</button>` : '<button class="btn wide ghost" data-more>つぎへ ▶</button>'}${again ? '<button class="link" data-skip>クイズから始める</button>' : ''}</div>`;
      };
      draw();
      main.onclick = (e) => {
        if (e.target.closest('[data-more]')) { shown++; SFX.tap(); draw(); }
        else if (e.target.closest('[data-next]')) SCREENS.stage(cid, 'lesson');
        else if (e.target.closest('[data-skip]')) SCREENS.stage(cid, 'quiz');
      };
      return;
    }
    if (phase === 'lesson') {
      let i = 0;
      const draw = () => {
        const L = c.lessons[i];
        const notice = i === 0 && OUT27_CH.has(c.id) ? `<div class="warn notice" style="margin:0 0 12px">${c.id === 'c11' ? '日商の発表では、2027年度（2027年4月〜）の試験から手形は出題範囲外になる見込み' : 'この章は2027年度（2027年4月〜）の試験に合わせた新しいリースの基準（使用権資産・リース負債）で書いている'}です（公式の区分表で要確認）。${examYear() >= 2027 ? 'キミの受験は2027年度なので、この章は参考として読んでね。模試からは外してあるよ。' : '2026年度（〜2027年3月）の試験は、このまま出題範囲だよ。'}</div>` : '';
        const k = `${cid}:${i}`;
        if (!S.read[k]) { S.read[k] = 1; gainXP(3); save(); }
        main.innerHTML = `${top(10 + (i / c.lessons.length) * 30, `レッスン ${i + 1}/${c.lessons.length}`)}${notice}<div class="card lesson stack" style="gap:6px"><div class="eyebrow">LESSON ${i + 1}</div><h2>${esc(L.t)}</h2><div class="rich">${withViz(rich(L.h), L.viz)}</div></div><div class="row" style="margin-top:14px">${i > 0 ? '<button class="btn ghost" data-prev>もどる</button>' : ''}${i < c.lessons.length - 1 ? '<button class="btn" data-nx>つぎへ</button>' : '<button class="btn gold" data-go-quiz>クイズに挑戦！</button>'}</div>`;
        mountViz(main);
        window.scrollTo(0, 0);
      };
      draw();
      main.onclick = (e) => {
        if (e.target.closest('[data-prev]')) { i--; draw(); }
        else if (e.target.closest('[data-nx]')) { i++; SFX.tap(); draw(); }
        else if (e.target.closest('[data-go-quiz]')) SCREENS.stage(cid, 'quiz');
      };
      return;
    }
    if (phase === 'quiz') {
      const items = c.qs.slice().sort((a, b) => (a.lv || 1) - (b.lv || 1));
      runQuiz({ items, mode: 'stage', chapter: c, onDone: (r) => stageResult(c, r) });
    }
  };

  function stageResult(c, r) {
    const ratio = r.correct / r.total;
    const stars = ratio >= 1 ? 3 : ratio >= 0.8 ? 2 : ratio >= 0.6 ? 1 : 0;
    const prev = S.stars[c.id] || 0;
    const firstClear = stars > 0 && prev === 0;
    if (stars > prev) S.stars[c.id] = stars;
    S.best[c.id] = Math.max(S.best[c.id] || 0, Math.round(ratio * 100));
    S.lastPlay[c.id] = Date.now();
    let bonus = 0;
    if (stars > 0) { bonus = 30 + stars * 10; ensureDaily(); S.daily.stages++; gainCoins(5 + stars); }
    if (firstClear && !S.cards.includes(c.id)) S.cards.push(c.id);
    gainXP(bonus);
    save(); checkBadges();
    document.body.classList.add('focus');
    main.onclick = null;
    if (stars > 0) { SFX.win(); confetti(stars * 60); } else SFX.lose();
    const card = firstClear ? `<div class="realcard flip-in"><div class="eyebrow">NEW 実務カード</div><h3>${esc(c.real.t)}</h3><div class="where">${esc(c.real.where || '')}</div><div class="rich">${rich(c.real.h)}</div></div>` : '';
    const next = CHAPTERS[CHAPTERS.indexOf(c) + 1];
    main.innerHTML = `<div class="result"><div class="eyebrow">STAGE ${chNum(c.id)} ・ ${esc(c.title)}</div><h1 style="font-size:28px">${stars > 0 ? (stars === 3 ? 'パーフェクト！' : 'ステージクリア！') : 'あと少し！'}</h1><div class="big-stars">${[1, 2, 3].map((k) => `<span class="${k <= stars ? 'star-on' : 'star-off'}">${I.star}</span>`).join('')}</div><div class="stats3"><div class="stat"><b>${r.correct}/${r.total}</b><span>正解</span></div><div class="stat"><b>${r.maxCombo}</b><span>最大コンボ</span></div><div class="stat"><b>+${r.xp + bonus}</b><span>XP</span></div></div>${stars === 0 ? '<p class="muted" style="margin:0">6割正解でクリア。まちがえた問題は「復習」に入ったよ。レッスンを読み直してもう一度！</p>' : ''}${card}<div class="row" style="width:100%"><button class="btn ghost" data-retry>もう一度</button>${stars > 0 && next && chapterUnlocked(next) ? `<button class="btn" data-next="${next.id}">次のステージへ</button>` : '<button class="btn" data-go="home">マップへ</button>'}</div>${r.missed.length ? `<button class="btn gold wide" data-redo>まちがえた ${r.missed.length} 問をすぐ解き直す</button>` : ''}<button class="link" data-relearn>レッスンを読み直す</button></div>`;
    main.onclick = (e) => {
      if (e.target.closest('[data-retry]')) go('stage', c.id, 'quiz');
      else if (e.target.closest('[data-relearn]')) go('stage', c.id, 'lesson');
      else if (e.target.closest('[data-redo]')) startReview(r.missed, `${c.title} 解き直し`);
      else { const n = e.target.closest('[data-next]'); if (n) go('stage', n.dataset.next); }
    };
    flushLevelUps();
  }

  /* ---------- generic quiz runner (stage / review / boss) ---------- */
  function runQuiz(o) {
    const st = { missed: [], i: 0, correct: 0, combo: 0, maxCombo: 0, xp: 0, total: 0, hearts: 3, hp: o.bossHP || 0, timer: null };
    leaveGuard = 'クイズをやめる？ここまでの結果は保存されないよ';
    const items = o.items;
    const stopTimer = () => { if (st.timer) { cancelAnimationFrame(st.timer); st.timer = null; } };
    const prevCleanup = cleanup;
    cleanup = () => { stopTimer(); if (prevCleanup) prevCleanup(); };
    function finish() { stopTimer(); leaveGuard = null; o.onDone({ correct: st.correct, total: st.total, maxCombo: st.maxCombo, xp: st.xp, hearts: st.hearts, hp: st.hp, missed: st.missed }); }
    function render() {
      if (o.mode === 'boss' && (st.hp <= 0 || st.hearts <= 0)) return finish();
      if (o.mode !== 'boss' && st.i >= items.length) return finish();
      const q = items[st.i % items.length];
      const w = o.world;
      const pct = o.mode === 'boss' ? 100 - (st.hp / o.bossHP) * 100 : (st.i / items.length) * 100;
      const bossArena = o.mode === 'boss' ? `<div class="boss-arena" style="--h:${w.hue}">${monster(w.hue, WORLDS.indexOf(w))}<div class="stack" style="gap:6px"><div class="boss-name">${esc(w.boss.name)}</div><div class="hp"><i style="width:${(st.hp / o.bossHP) * 100}%"></i></div><div class="row" style="justify-content:space-between"><div class="hearts">${[0, 1, 2].map((k) => `<span style="color:${k < st.hearts ? 'var(--cr)' : 'var(--line)'}">${I.heart}</span>`).join('')}</div><span class="pix muted">HP ${st.hp}/${o.bossHP}</span></div><div class="timer"><i></i></div></div></div>` : '';
      const lv = q.lv || 1;
      window.__bokiQ = q;
      main.innerHTML = `<div class="stage-top"><button class="icon-btn" data-quit aria-label="やめる">${I.x}</button><div class="bar"><i style="width:${pct}%"></i></div><span class="combo ${st.combo >= 2 ? 'hot' : ''}">${st.combo >= 2 ? I.fire.replace('<svg', '<svg width="18" height="18"') + st.combo : ''}</span></div>${bossArena}<div class="qcard"><div class="qmeta"><span class="tag">${TYPE_LABEL[q.type]}</span><span class="tag lv${lv}">${'★'.repeat(lv)}</span>${B.outOfScope2 && B.outOfScope2(q) ? '<span class="tag" title="本支店の未達は2級の出題範囲外。考え方の参考として残している">参考（2級では出ない）</span>' : examYear() >= 2027 && B.outdated27 && B.outdated27(q) ? '<span class="tag" title="2027年度の試験からは出ない見込み">2027年度は出ない</span>' : ''}<span class="muted">${o.mode === 'stage' ? `${st.i + 1} / ${items.length}` : esc(q._ch ? q._ch.title : '')}</span></div><div class="qtext rich">${rich(q.q)}</div><div data-body></div><div data-hint></div><div data-fb></div><div class="qactions" data-act><button class="btn ghost hint-btn" data-hintbtn hidden>${I.bulb.replace('<svg', '<svg width="18" height="18"')}ヒント <span class="coin-c">${I.coin.replace('<svg', '<svg width="14" height="14"')}</span><span data-cost></span></button><button class="btn" data-check disabled>チェック</button></div></div>`;
      const body = $('[data-body]', main), checkBtn = $('[data-check]', main), hintBtn = $('[data-hintbtn]', main);
      let done = false;
      const ctx = { ready: (b) => { checkBtn.disabled = !b; }, instant: q.type === 'choice', submit: () => submit(), autoDone: (r) => submit(r) };
      const comp = MOUNT[q.type](q, body, ctx);
      if (q.type === 'sort') checkBtn.hidden = true;
      if (comp.hint) { hintBtn.hidden = false; $('[data-cost]', main).textContent = comp.hintCost; }
      hintBtn.onclick = () => {
        if (S.coins < comp.hintCost) { toast('コインが足りない！ 正解するとたまるよ'); return; }
        gainCoins(-comp.hintCost); save();
        $('[data-hint]', main).innerHTML = `<div class="hintbox">${esc(comp.hint())}</div>`;
        hintBtn.disabled = true;
      };
      checkBtn.onclick = () => submit();
      // boss timer
      if (o.mode === 'boss') {
        const limit = ({ journal: 120, fill: 240, sort: 60 }[q.type] || 45) * 1000, t0 = performance.now(), bar = $('.timer > i', main);
        const tick = (now) => {
          const left = 1 - (now - t0) / limit;
          if (bar) bar.style.width = Math.max(0, left * 100) + '%';
          if (left <= 0) { st.timer = null; if (!done) submit({ ok: false, ratio: 0, timeout: true }); return; }
          st.timer = requestAnimationFrame(tick);
        };
        st.timer = requestAnimationFrame(tick);
      }
      function submit(forced) {
        if (done) return;
        done = true; stopTimer();
        const r = forced || comp.check();
        comp.reveal(r.ok);
        st.total++;
        const ok = r.ok;
        recordAnswer(q, ok, o.mode === 'review', !ok && comp.summary ? comp.summary() : '');
        if (!ok) st.missed.push(q);
        let gained = 0;
        if (ok) {
          st.correct++; st.combo++; st.maxCombo = Math.max(st.maxCombo, st.combo);
          S.total.maxCombo = Math.max(S.total.maxCombo, st.combo);
          gained = 10 + 5 * ((q.lv || 1) - 1) + Math.min(st.combo, 10) * 2;
          st.xp += gained; gainXP(gained); gainCoins(1 + (st.combo % 5 === 0 ? 2 : 0));
          SFX.ok(st.combo);
          floaty(`+${gained} XP`, checkBtn);
          if (st.combo % 5 === 0) { confetti(50); floaty(`${st.combo} COMBO!`, $('.combo', main) || checkBtn, 'var(--cr)'); }
          if (o.mode === 'boss') { st.hp--; SFX.hit(); const a = $('.boss-arena', main); if (a) { a.classList.add('hit'); } const hpb = $('.hp > i', main); if (hpb) hpb.style.width = (st.hp / o.bossHP) * 100 + '%'; }
        } else {
          st.combo = 0; SFX.ng(); shakeEl($('.qcard', main));
          if (o.mode === 'boss') { st.hearts--; const hs = $$('.hearts > span', main); if (hs[st.hearts]) hs[st.hearts].style.color = 'var(--line)'; }
        }
        save();
        const partial = r.of ? `<span class="muted" style="font-size:13px;font-weight:700">${r.got}/${r.of} 欄 正解</span>` : '';
        const answer = ok ? '' : comp.answerHTML();
        $('[data-fb]', main).innerHTML = `<div class="fb ${ok ? 'ok' : 'ng'}"><div class="fb-title">${ok ? (st.combo >= 3 ? `正解！ ${st.combo}コンボ` : '正解！') : r.timeout ? '時間切れ！' : 'おしい！'} ${partial}</div>${answer ? `<div>${answer}</div>` : ''}<div class="rich">${rich(q.exp)}</div>${q.real ? `<div class="real rich">${rich(q.real)}</div>` : ''}</div>`;
        $('[data-act]', main).innerHTML = `<button class="btn ${ok ? '' : 'ghost'}" data-nextq>${(o.mode === 'boss' && (st.hp <= 0 || st.hearts <= 0)) || (o.mode !== 'boss' && st.i + 1 >= items.length) ? '結果を見る' : 'つぎの問題'}</button>`;
        $('[data-nextq]', main).onclick = () => { st.i++; render(); window.scrollTo(0, 0); };
        if (!ok || q.type === 'fill') setTimeout(() => { const f = $('[data-fb]', main); if (f) f.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' }); }, 80);
      }
    }
    main.onclick = null;
    render();
  }

  /* ---------- boss ---------- */
  SCREENS.boss = function (wid) {
    const w = W[wid];
    const wi = WORLDS.indexOf(w);
    main.onclick = null;
    main.innerHTML = `<div class="result" style="--h:${w.hue}"><div class="eyebrow">WORLD ${wi + 1} BOSS</div><div style="width:170px">${monster(w.hue, wi)}</div><h1 style="font-size:26px">${esc(w.boss.name)} があらわれた！</h1><p class="muted" style="margin:0">「${esc(w.theme)}」の問題で攻撃しよう。<br>正解で1ダメージ、まちがい・時間切れでハートが1つ減る。HP ${w.boss.hp} を削りきれば勝利！</p><div class="row" style="width:100%"><button class="btn ghost" data-go="home">にげる</button><button class="btn bad" data-fight>勝負する</button></div></div>`;
    main.onclick = (e) => {
      if (!e.target.closest('[data-fight]')) return;
      const pool = [];
      w.chapters.forEach((c) => c.qs.forEach((q) => { if ((q.lv || 1) >= 2 && q.type !== 'sort') pool.push(q); }));
      const items = shuffle(pool.length >= 8 ? pool : w.chapters.flatMap((c) => c.qs));
      const quit = (e2) => { if (e2.target.closest('[data-quit]')) guardLeave(() => go('home')); };
      main.addEventListener('click', quit);
      cleanup = () => main.removeEventListener('click', quit);
      runQuiz({ items, mode: 'boss', world: w, bossHP: w.boss.hp, onDone: (r) => bossResult(w, r) });
    };
  };
  function bossResult(w, r) {
    const win = r.hp <= 0;
    main.onclick = null;
    if (win) {
      const first = !S.boss[w.id];
      S.boss[w.id] = true;
      const xp = first ? 150 : 50;
      gainXP(xp); gainCoins(first ? 30 : 10);
      SFX.win(); confetti(220);
      save(); checkBadges();
      main.innerHTML = `<div class="result" style="--h:${w.hue}"><div class="eyebrow">VICTORY</div><h1 style="font-size:28px">${esc(w.boss.name)} をたおした！</h1><div class="stats3"><div class="stat"><b>${r.correct}/${r.total}</b><span>正解</span></div><div class="stat"><b>${r.hearts}</b><span>残りハート</span></div><div class="stat"><b>+${xp + r.xp}</b><span>XP</span></div></div><p class="muted" style="margin:0">「${esc(w.theme)}」はもう本試験レベル。${first ? '次のワールドへ進もう！' : ''}</p><button class="btn wide" data-go="home">マップへ</button></div>`;
    } else {
      SFX.lose(); save();
      main.innerHTML = `<div class="result" style="--h:${w.hue}"><div style="width:130px;opacity:.8">${monster(w.hue, WORLDS.indexOf(w))}</div><h1 style="font-size:26px">やられた…</h1><p class="muted" style="margin:0">あと HP ${r.hp}！ まちがえた問題は「復習」に入ったよ。解説を読んでリベンジしよう。</p><div class="row" style="width:100%"><button class="btn ghost" data-go="review">復習する</button><button class="btn bad" data-again>リベンジ</button></div></div>`;
      main.onclick = (e) => { if (e.target.closest('[data-again]')) go('boss', w.id); };
    }
    flushLevelUps();
  }

  /* ---------- review ---------- */
  // Themes = chapters, plus the mock-exam big problems grouped by part.
  const THEMES = CHAPTERS.map((c) => ({ id: c.id, title: c.title, hue: W[c.world] ? W[c.world].hue : 190, wid: c.world, qs: c.qs }))
    .concat([2, 3, 4, 5].map((p) => ({ id: `exam${p}`, title: `模試 第${p}問の大問`, hue: 45, wid: 'exam', qs: B.exams.filter((x) => x.part === p), exam: true })).filter((t) => t.qs.length));
  const TH = {}; THEMES.forEach((t) => { TH[t.id] = t; });
  function themeStats(t) {
    let a = 0, c = 0, wrong = 0, due = 0;
    const now = Date.now();
    t.qs.forEach((q) => { const h = S.hist[q._key]; if (h) { a += h[0]; c += h[1]; } const w = S.wrong[q._key]; if (w) { wrong++; if ((w.due || 0) <= now) due++; } });
    return { a, c, wrong, due, acc: a ? Math.round((c / a) * 100) : null, tried: t.qs.filter((q) => S.hist[q._key]).length };
  }
  const wrongKeys = () => Object.keys(S.wrong).filter((k) => QBYKEY[k]);
  const dueKeys = () => { const now = Date.now(); return wrongKeys().filter((k) => (S.wrong[k].due || 0) <= now); };
  function drillItems(t, n) {
    // missed first (most-missed first), then never-tried, then lowest accuracy
    const score = (q) => { const w = S.wrong[q._key], h = S.hist[q._key]; if (w) return -1000 - w.n; if (!h) return -500; return h[1] / h[0]; };
    return shuffle(t.qs).sort((a, b) => score(a) - score(b)).slice(0, n);
  }
  function answerView(q) {
    let ans = '';
    if (q.type === 'journal') ans = entryTable(q.ans);
    else if (q.type === 'choice') ans = `<p>正解：<b>${rich(q.c[q.a])}</b></p>`;
    else if (q.type === 'number') ans = `<p>正解：<b class="num">${fmt(q.a)}</b> ${esc(q.unit || '')}</p>`;
    else if (q.type === 'fill') ans = `<div class="sheet-wrap rich">${rich(q.sheet).replace(/\{\{(\d+)\}\}/g, (m, i) => { const b = q.blanks[+i]; return `<b class="ans-fill">${esc(typeof b === 'object' ? b.opts[b.a] : fmt(b))}</b>`; })}</div>`;
    else if (q.type === 'sort') ans = `<div class="acc-list">${q.bins.map((bn, j) => `<div class="acc-item"><i style="background:hsl(${CAT_HUE[bn] || 190} 55% 52%)"></i><b>${esc(bn)}</b><span>${q.items.filter((x) => x[1] === j).map((x) => esc(x[0])).join('、')}</span></div>`).join('')}</div>`;
    return ans;
  }
  function showAnswer(key) {
    const q = QBYKEY[key], w = S.wrong[key];
    modal(`<div style="text-align:left" class="stack"><div class="qmeta"><span class="tag">${TYPE_LABEL[q.type]}</span><span class="muted">${esc(q._ch ? q._ch.title : '')}</span></div><div class="qtext rich">${rich(q.q)}</div>${w && w.last ? `<div class="hintbox">前回のキミの答え：${esc(w.last)}</div>` : ''}<div><div class="eyebrow">正解</div>${answerView(q)}</div><div class="rich">${rich(q.exp)}</div>${q.real ? `<div class="real rich">${rich(q.real)}</div>` : ''}</div>`, [{ t: 'とじる', cls: 'ghost' }, { t: 'この問題を解く', on: () => startReview([q], '1問') }]);
  }
  let reviewTab = 'theme', noteWorld = 'all';
  SCREENS.review = function (tab) {
    if (tab) reviewTab = tab;
    const wk = wrongKeys(), due = dueKeys();
    const clearedQs = CHAPTERS.filter((c) => cleared(c.id)).flatMap((c) => c.qs);
    let body = '';
    if (reviewTab === 'theme') {
      const rows = THEMES.map((t) => ({ t, s: themeStats(t) })).filter((r) => r.s.a > 0 || r.s.wrong > 0);
      rows.sort((a, b) => b.s.wrong - a.s.wrong || (a.s.acc ?? 101) - (b.s.acc ?? 101));
      body = rows.length ? `<p class="muted" style="margin:0;font-size:13px">挑戦したテーマを苦手な順に表示。「要点」でレッスンを読み直し、「特訓」でそのテーマだけを集中的に解く。</p><div class="theme-list">${rows.map(({ t, s }) => `<div class="theme" style="--h:${t.hue}"><div class="theme-top"><b>${esc(t.title)}</b>${s.wrong ? `<span class="tag lv3">まちがい ${s.wrong}</span>` : '<span class="tag">ミスなし</span>'}</div><div class="theme-acc"><div class="bar ${s.acc != null && s.acc < 70 ? 'bad' : ''}"><i style="width:${s.acc ?? 0}%"></i></div><span class="num">${s.acc ?? '-'}%</span></div><div class="muted" style="font-size:11.5px">解いた ${s.tried}/${t.qs.length}問 ・ 正答率 ${s.c}/${s.a}</div><div class="row">${t.exam ? '' : `<button class="btn ghost sm" data-learn="${t.id}">要点</button>`}<button class="btn sm" data-drill="${t.id}">特訓 ${Math.min(10, t.qs.length)}問</button></div></div>`).join('')}</div>` : '<div class="card center muted">まだ問題を解いていないよ。ステージに挑戦すると、ここにテーマごとの成績が出る。</div>';
      body += `<div class="card stack"><h3>ワールド特訓</h3><p class="muted" style="margin:0;font-size:13px">ワールド全体から、まちがえた問題と未挑戦の問題を優先して15問。</p><div class="row">${WORLDS.filter(worldUnlocked).map((w) => `<button class="btn ghost sm" style="flex:none" data-wdrill="${w.id}">${esc(w.name)}</button>`).join('')}</div></div>`;
    } else {
      const worlds = [['all', 'すべて']].concat(WORLDS.map((w) => [w.id, w.name]), B.exams.length ? [['exam', '模試大問']] : []);
      const list = wk.filter((k) => noteWorld === 'all' || (QBYKEY[k]._ch && QBYKEY[k]._ch.world) === noteWorld || (noteWorld === 'exam' && k.startsWith('exam:')))
        .sort((a, b) => S.wrong[b].n - S.wrong[a].n || S.wrong[b].t - S.wrong[a].t);
      body = `<select id="note-world" class="search">${worlds.map(([id, n]) => `<option value="${id}" ${id === noteWorld ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>${list.length ? `<div class="note-list">${list.map((k) => { const q = QBYKEY[k], w = S.wrong[k]; return `<div class="note"><div class="qmeta"><span class="tag">${TYPE_LABEL[q.type]}</span><span class="tag lv3">×${w.n}</span>${w.ok ? `<span class="tag lv2">${w.ok >= SRS.length ? 'あと1回で卒業' : `卒業まで ${SRS.length + 1 - w.ok} 回`}</span>` : ''}${(w.due || 0) > Date.now() ? `<span class="tag">次は ${Math.ceil(((w.due || 0) - Date.now()) / DAY)}日後</span>` : ''}<span class="muted">${esc(q._ch ? q._ch.title : '')}</span></div><div class="note-q">${esc(strip(q.q).slice(0, 90))}${strip(q.q).length > 90 ? '…' : ''}</div>${w.last ? `<div class="muted" style="font-size:12px">前回の答え：${esc(w.last)}</div>` : ''}<div class="row"><button class="btn ghost sm" data-ans="${esc(k)}">答えと解説</button><button class="btn sm" data-one="${esc(k)}">解き直す</button></div></div>`; }).join('')}</div>` : '<div class="card center muted">このワールドのまちがいノートは空っぽ。いい調子！</div>'}`;
    }
    main.innerHTML = `<div class="stack"><div class="hero">${PIYO}<div><h1>復習の部屋</h1><div class="muted" style="font-size:13px">まちがえた問題は、正解すると翌日・3日後・7日後にもう一度出てくる。そのたびに正解できたら卒業。時間をあけて解き直すのが、いちばん記憶に残るピヨ。</div></div></div><div class="card stack"><div class="stats3"><div class="stat"><b style="color:var(--cr)">${due.length}</b><span>今日の復習</span></div><div class="stat"><b>${wk.length}</b><span>まちがいノート</span></div><div class="stat"><b style="color:var(--good)">${S.mastered || 0}</b><span>卒業した問題</span></div></div><button class="btn wide" data-due ${due.length ? '' : 'disabled'}>今日の復習をはじめる（${Math.min(10, due.length)}問）</button><div class="row"><button class="btn ghost sm" data-allwrong ${wk.length ? '' : 'disabled'}>まちがいから10問</button><button class="btn ghost sm" data-mix ${clearedQs.length ? '' : 'disabled'}>ミックス10問</button></div></div><div class="seg"><button data-rt="theme" aria-pressed="${reviewTab === 'theme'}">テーマ別</button><button data-rt="note" aria-pressed="${reviewTab === 'note'}">まちがいノート</button></div>${body}</div>`;
    const sel = $('#note-world'); if (sel) sel.onchange = (e) => { noteWorld = e.target.value; SCREENS.review(); };
    main.onclick = (e) => {
      const g = (s) => e.target.closest(s);
      if (g('[data-rt]')) SCREENS.review(g('[data-rt]').dataset.rt);
      else if (g('[data-due]')) startReview(dueKeys().sort((a, b) => (S.wrong[a].due || 0) - (S.wrong[b].due || 0)).slice(0, 10).map((k) => QBYKEY[k]), '今日の復習');
      else if (g('[data-allwrong]')) startReview(shuffle(wrongKeys()).slice(0, 10).map((k) => QBYKEY[k]), 'まちがい復習');
      else if (g('[data-mix]')) startReview(shuffle(clearedQs).slice(0, 10), 'ミックス');
      else if (g('[data-drill]')) { const t = TH[g('[data-drill]').dataset.drill]; startReview(drillItems(t, 10), `${t.title} 特訓`); }
      else if (g('[data-wdrill]')) { const w = W[g('[data-wdrill]').dataset.wdrill]; startReview(drillItems({ qs: w.chapters.flatMap((c) => c.qs) }, 15), `${w.name} 特訓`); }
      else if (g('[data-learn]')) go('stage', g('[data-learn]').dataset.learn, 'lesson');
      else if (g('[data-ans]')) showAnswer(g('[data-ans]').dataset.ans);
      else if (g('[data-one]')) startReview([QBYKEY[g('[data-one]').dataset.one]], '1問');
    };
  };
  function startReview(items, label) {
    if (!items.length) return;
    go('quiz');
    const quit = (e) => { if (e.target.closest('[data-quit]')) guardLeave(() => go('review')); };
    main.addEventListener('click', quit);
    cleanup = () => main.removeEventListener('click', quit);
    runQuiz({ items, mode: 'review', onDone: (r) => {
      checkBadges();
      main.onclick = null;
      if (r.correct === r.total) { SFX.win(); confetti(100); }
      main.innerHTML = `<div class="result"><div class="eyebrow">${esc(label)} 結果</div><h1 style="font-size:28px">${r.correct}/${r.total} 正解</h1><div class="stats3"><div class="stat"><b>${r.maxCombo}</b><span>最大コンボ</span></div><div class="stat"><b>+${r.xp}</b><span>XP</span></div><div class="stat"><b>${dueKeys().length}</b><span>今日の残り</span></div></div>${r.missed.length ? `<p class="muted" style="margin:0">まちがえた ${r.missed.length} 問はノートに残ったよ。解説を読んでからもう一度！</p>` : ''}<div class="row" style="width:100%">${r.missed.length ? '<button class="btn ghost" data-redo>まちがいを解き直す</button>' : ''}<button class="btn" data-go="review">復習の部屋へ</button></div></div>`;
      main.onclick = (e) => { if (e.target.closest('[data-redo]')) startReview(r.missed, 'もう一度'); };
      flushLevelUps();
    } });
  }
  SCREENS.quiz = function () { main.innerHTML = ''; };

  /* ---------- rush mini games ---------- */
  const PL_BINS = ['売上原価', '販売費及び一般管理費', '営業外収益', '営業外費用', '特別利益', '特別損失'];
  const PL_ITEMS = [
    ['期首商品棚卸高', 0], ['当期商品仕入高', 0], ['商品評価損', 0],
    ['給料', 1], ['広告宣伝費', 1], ['減価償却費', 1], ['貸倒引当金繰入（売掛金）', 1], ['旅費交通費', 1], ['支払家賃', 1], ['退職給付費用', 1], ['のれん償却', 1], ['研究開発費', 1], ['ソフトウェア償却', 1], ['租税公課', 1], ['賞与引当金繰入', 1], ['修繕費', 1], ['水道光熱費', 1],
    ['受取利息', 2], ['受取配当金', 2], ['有価証券利息', 2], ['有価証券評価益', 2], ['仕入割引', 2], ['為替差益', 2], ['有価証券売却益', 2],
    ['支払利息', 3], ['手形売却損', 3], ['有価証券評価損', 3], ['有価証券売却損', 3], ['為替差損', 3], ['貸倒引当金繰入（貸付金）', 3], ['創立費', 3], ['株式交付費', 3], ['電子記録債権売却損', 3],
    ['固定資産売却益', 4], ['保険差益', 4], ['国庫補助金受贈益', 4], ['投資有価証券売却益', 4], ['負ののれん発生益', 4],
    ['固定資産売却損', 5], ['固定資産除却損', 5], ['火災損失', 5], ['固定資産圧縮損', 5], ['投資有価証券売却損', 5],
  ];
  const RUSH = {
    acc: { t: '5グループ仕分け', d: '勘定科目を資産・負債・純資産・収益・費用にすばやく仕分け。すべての土台。', bins: CATS5, gen() { const a = pick(Object.keys(B.accounts).filter((k) => CATS5.includes(B.accounts[k].cat))); return { text: a, sub: '', ans: CATS5.indexOf(B.accounts[a].cat), why: B.accounts[a].d }; } },
    side: { t: '増えたら左？右？', d: '「〇〇が増えた／減った」を借方・貸方に。仕訳スピードが一気に上がる。', bins: ['借方（左）', '貸方（右）'], gen() { const a = pick(Object.keys(B.accounts).filter((k) => CATS5.includes(B.accounts[k].cat))); const cat = B.accounts[a].cat; const inc = Math.random() < 0.6; const left = ['資産', '費用'].includes(cat) === inc; const verb = cat === '収益' || cat === '費用' ? (inc ? '発生した' : '取り消された') : inc ? '増えた' : '減った'; return { text: a, sub: `${cat} が${verb}`, ans: left ? 0 : 1, why: `${a}は${cat}。${cat === '資産' || cat === '費用' ? '定位置は借方' : '定位置は貸方'}なので、${inc ? '増加・発生は定位置側' : '減少・取消は反対側'}。` }; } },
    pl: { t: '損益計算書の区分', d: '費用・収益が P/L のどの区分に入るか。第3問の財務諸表作成で必須。', bins: PL_BINS, gen() { const [t, a] = pick(PL_ITEMS); return { text: t, sub: '', ans: a, why: `${t} は「${PL_BINS[a]}」の区分。` }; } },
  };
  SCREENS.rush = function () {
    main.onclick = null;
    main.innerHTML = `<div class="stack"><div><div class="eyebrow">ARCADE</div><h1>仕分けラッシュ</h1><p class="muted" style="margin:4px 0 0;font-size:13px">60秒でどれだけ仕分けられるか。連続正解でボーナス、ミスは −3秒。</p></div><div class="mode-grid">${Object.entries(RUSH).map(([k, m]) => `<button class="mode" data-mode="${k}"><h3>${m.t}</h3><span class="muted" style="font-size:13px">${m.d}</span><span class="hi">${I.star.replace('<svg', '<svg width="14" height="14"')} ベスト ${S.rush[k] || 0}</span></button>`).join('')}</div></div>`;
    main.onclick = (e) => { const m = e.target.closest('[data-mode]'); if (m) go('rushplay', m.dataset.mode); };
  };
  SCREENS.rushplay = function (mode) {
    const M = RUSH[mode];
    let score = 0, combo = 0, n = 0, end = 0, cur = null, raf = null, over = false, miss = [];
    main.onclick = null;
    main.innerHTML = `<div class="rush-stage"><div class="stage-top"><button class="icon-btn" data-quit aria-label="やめる">${I.x}</button><div class="timer" style="flex:1;height:12px"><i style="width:100%"></i></div></div><div class="rush-hud"><span>SCORE <b data-s>0</b></span><span class="combo" data-c></span><span data-t>60</span></div><div class="rush-card" data-card><div style="font-size:16px" class="muted">準備はいい？</div></div><div class="muted" data-why style="min-height:3.4em;font-size:13px"></div><div class="bins" data-bins>${M.bins.map((b, j) => `<button class="bin" style="--bh:${CAT_HUE[b] || [212, 2, 272, 142, 30, 320][j]}" data-b="${j}">${esc(b)}</button>`).join('')}</div><button class="btn gold wide" data-start>スタート</button></div>`;
    const card = $('[data-card]', main), bar = $('.timer > i', main);
    function next() { cur = M.gen(); n++; card.className = 'rush-card'; void card.offsetWidth; card.innerHTML = `${esc(cur.text)}${cur.sub ? `<small>${esc(cur.sub)}</small>` : ''}`; }
    function tick() {
      const left = Math.max(0, end - performance.now());
      bar.style.width = (left / 60000) * 100 + '%';
      $('[data-t]', main).textContent = Math.ceil(left / 1000);
      if (left <= 0) return finish();
      raf = requestAnimationFrame(tick);
    }
    function finish() {
      over = true; leaveGuard = null;
      const best = S.rush[mode] || 0;
      if (score > best) S.rush[mode] = score;
      ensureDaily(); S.daily.rush++;
      gainXP(score * 2); gainCoins(Math.floor(score / 5));
      save(); checkBadges();
      SFX.win(); if (score > best) confetti(140);
      main.innerHTML = `<div class="result"><div class="eyebrow">${esc(M.t)}</div><h1 style="font-size:28px">${score > best ? 'ベスト更新！' : 'タイムアップ！'}</h1><div class="stats3"><div class="stat"><b>${score}</b><span>スコア</span></div><div class="stat"><b>${Math.max(best, score)}</b><span>ベスト</span></div><div class="stat"><b>+${score * 2}</b><span>XP</span></div></div>${miss.length ? `<div class="card" style="width:100%;text-align:left"><h3 style="margin-bottom:6px">まちがえたもの</h3><div class="acc-list">${miss.slice(0, 8).map((m) => `<div class="acc-item"><i style="background:var(--bad)"></i><b>${esc(m.text)}${m.sub ? `（${esc(m.sub)}）` : ''} → ${esc(M.bins[m.ans])}</b><span>${esc(m.why)}</span></div>`).join('')}</div></div>` : ''}<div class="row" style="width:100%"><button class="btn ghost" data-go="rush">モード選択</button><button class="btn gold" data-again>もう一回</button></div></div>`;
      main.onclick = (e) => { if (e.target.closest('[data-again]')) go('rushplay', mode); };
      flushLevelUps();
    }
    cleanup = () => { if (raf) cancelAnimationFrame(raf); };
    main.onclick = (e) => {
      if (e.target.closest('[data-quit]')) { guardLeave(() => go('rush')); return; }
      if (e.target.closest('[data-start]')) { e.target.closest('[data-start]').remove(); leaveGuard = 'ラッシュをやめる？'; end = performance.now() + 60000; next(); raf = requestAnimationFrame(tick); return; }
      const b = e.target.closest('[data-b]');
      if (!b || !cur || over) return;
      if (+b.dataset.b === cur.ans) {
        combo++; score += 1 + Math.floor(combo / 5);
        SFX.ok(combo); card.classList.add('ok');
        $('[data-why]', main).textContent = '';
      } else {
        combo = 0; end -= 3000; miss.push(cur);
        SFX.ng(); card.classList.add('ng');
        $('[data-why]', main).textContent = `${cur.text}${cur.sub ? `（${cur.sub}）` : ''} → 正解は「${M.bins[cur.ans]}」。${cur.why}`;
      }
      $('[data-s]', main).textContent = score;
      $('[data-c]', main).innerHTML = combo >= 2 ? I.fire.replace('<svg', '<svg width="18" height="18"') + combo : '';
      setTimeout(next, 120);
    };
  };

  /* ---------- mock exam ---------- */
  const PARTS = [
    { k: 1, t: '第1問', d: '仕訳 5題（商業簿記）', pts: 20 },
    { k: 2, t: '第2問', d: '個別論点・連結など', pts: 20 },
    { k: 3, t: '第3問', d: '財務諸表・本支店など', pts: 20 },
    { k: 4, t: '第4問', d: '(1) 工業簿記の仕訳3題 (2) 原価計算', pts: 28 },
    { k: 5, t: '第5問', d: '標準原価・CVPなど', pts: 12 },
  ];
  const INDUSTRIAL = new Set(['w8', 'w9']);
  // 2027年度（2027/4〜）の区分表で範囲外・処理変更の見込みとされる論点。内容は書き換えず、表示と模試の出題だけを切り替える。
  const OUT27_CH = new Set(['c11']), OUT27_X = new Set();
  // 範囲外の問題を模試から外す：未達（2級の範囲外）は常に、2027年度に出ない問題（手形・小切手・旧リース）は受験年度が2027年度以降のとき
  const skipQ = (q, y27) => (B.outOfScope2 && B.outOfScope2(q)) || (y27 && B.outdated27 && B.outdated27(q));
  const fiscalYear = (d) => (d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1);
  const examYear = () => fiscalYear(S.examDate ? new Date(S.examDate + 'T00:00:00') : new Date());
  const CH_FREQ = { c01: 2, c02: 2, c04: 2, c07: 2, c13: 2, c14: 2, c16: 2, c17: 2, c18: 2, c19: 2, c21: 2, c22: 2, c24: 2, c28: 2, c34: 2, c35: 2, c37: 2, c43: 2, c45: 2 };
  // weighted sample, one question per chapter, avoiding recently seen keys
  function sampleExam(pool, n, recent) {
    const fresh = pool.filter((q) => !recent.has(q._key));
    const use = fresh.length >= n * 3 ? fresh : pool;
    const keyed = use.map((q) => ({ q, k: Math.pow(Math.random(), 1 / (CH_FREQ[q._ch.id] || 1)) })).sort((a, b) => b.k - a.k);
    const out = [], used = new Set();
    for (const { q } of keyed) { if (out.length >= n) break; if (!used.has(q._ch.id)) { out.push(q); used.add(q._ch.id); } }
    for (const { q } of keyed) { if (out.length >= n) break; if (!out.includes(q)) out.push(q); }
    return out;
  }
  const PART_MIN = { 1: 15, 4: 20, 5: 10, 2: 20, 3: 25 };
  // 先輩の下書き：題に draft がなければ、大問ごとの手順を見せる
  const GEN_DRAFT = {
    1: [{ t: '但し書きを先に', h: '記帳法（三分法・間接法）、税抜・税込、「本日」がどの段階かを、取引文より先に読む。' }, { t: '経緯を線で', h: '「かねて」「前期に」の取引があれば、計算用紙に日付の線を引いて、すでに済んだ仕訳を小さく書く。' }, { t: '候補を見る', h: '科目の候補を見て、使う科目を決める。候補にない科目は使えない。' }, { t: '1科目1行', h: '同じ側に同じ科目が2回出たら、合計して1行にする。2行に分けると、その問は0点。' }, { t: '検算', h: '借方の合計と貸方の合計が一致するかを確かめる。' }],
    2: [{ t: '問いと解答欄から', h: '最後の問いと解答欄の形（勘定・台帳・表）を先に見る。何を出せばよいかが決まる。' }, { t: '時系列の線表', h: '資料を日付順に並べ、計算用紙に線表を書く。期首・期中・期末に印をつける。' }, { t: '1件ずつ仕訳', h: '線表の順に仕訳を切り、勘定や台帳へ写す。' }, { t: '残高で照合', h: '期末の残高を、前期繰越と増減から計算した額と照らす。' }, { t: '検算', h: '解答欄の合計と、貸借が一致するかを確かめる。' }],
    3: [{ t: '解答欄を資料に', h: '解答欄の科目の並びを見る。整理で増える科目の手がかりになる。' }, { t: '未処理から', h: '未処理事項・修正事項を先に片づける。決算整理（引当金・売上原価など）に波及する科目に印をつける。' }, { t: '科目ごとの増減', h: '決算整理事項を1つずつ処理し、計算用紙に「科目：前T/B ± 増減」を1行ずつ書く。' }, { t: '解答欄へ', h: '前T/Bの金額に増減を足して、解答欄へ写す。' }, { t: '検算', h: '当期純利益を、P/Lの差額とB/Sの繰越利益剰余金の両方で確かめる。' }],
    4: [{ t: '流れの図', h: '材料→仕掛品→製品→売上原価の流れを、計算用紙に小さな箱で描く。' }, { t: 'ボックス図', h: '原価計算は、月初・当月投入・完成・月末の4つの欄を持つ箱を書く。' }, { t: '数量が先', h: '数量（加工費は換算量）を先に埋め、次に金額を入れる。' }, { t: '検算', h: '完成品原価と月末仕掛品原価の合計が、月初と当月投入の合計に一致するかを確かめる。' }],
    5: [{ t: '型を決める', h: '標準原価ならシュラッター図、CVPなら「売上−変動費−固定費＝利益」の式を先に書く。' }, { t: '数字を置く', h: '与えられた数字を、図や式の該当する場所に置く。' }, { t: '向きを判定', h: '差異は「実際−標準」で考え、プラスなら不利、マイナスなら有利。' }, { t: '検算', h: '問いの単位（円・個・％）と、端数処理の指示を確かめる。' }],
  };
  // 誤りの3分類と戻り先（本物は点数しか返さない。ここが本物を超える所）
  const MISS = {
    unlearned: { t: '習っていない', d: 'その論点をまだ学んでいない、または初めて見る形。', go: 'レッスンか先輩の手本へ' },
    forgot: { t: '忘れていた', d: '前に解けたのに、今回は書けなかった。', go: '日をあけて同じ型を解き直す（まちがいノート）' },
    calc: { t: '計算・形式・時間', d: '科目は合っていて金額だけ違う、書き方の規則違反、時間切れ。', go: '大問別の練習（時間あり）と、計算用紙の使い方' },
  };
  const EXAM_MODES = [['model', '先輩の手本を見る', '下書きを1手ずつ見ながら解く'], ['trace', '下書きをなぞる', '下書きを全部出したまま解く'], ['self', '自分で', '下書きなし・時間なし'], ['timed', '時間あり', '本番の目安の時間で']];
  let drillMode = 'self';
  SCREENS.exam = function () {
    main.onclick = null;
    const full = S.exams.filter((e) => e.mode !== 'untimed');
    const hist = S.exams.slice(-5).reverse();
    const best = full.reduce((m, e) => Math.max(m, e.score), 0);
    const untimed = S.exams.filter((e) => e.mode === 'untimed').length;
    const counts = [2, 3, 4, 5].map((p) => B.exams.filter((x) => x.part === p).length);
    main.innerHTML = `<div class="stack"><div><div class="eyebrow">MOCK EXAM</div><h1>本試験シミュレーター</h1><p class="muted" style="margin:4px 0 0;font-size:13px">日商簿記2級と同じ5問構成・90分・100点満点。70点で合格。毎回ちがう組み合わせで出題される。</p></div>`
      + `<div class="card"><table class="score-table">${PARTS.map((p) => `<tr><th style="text-align:left">${p.t}</th><td class="muted" style="font-size:13px">${p.d}</td><td>${p.pts}点</td></tr>`).join('')}</table><p class="muted" style="font-size:12px;margin:8px 0 0">問題バンク：第2問 ${counts[0]}・第3問 ${counts[1]}・第4問(2) ${counts[2]}・第5問 ${counts[3]} 題 ＋ 仕訳 ${CHAPTERS.flatMap((c) => c.qs).filter((q) => q.type === 'journal').length} 題</p></div>`
      + `<div class="card" style="font-size:13px"><b>本番の画面の決まり</b><ul class="exam-rules"><li>勘定科目は、問題ごとの候補（5〜8個）から選ぶ。使わない科目もまざっている。</li><li>同じ科目は、借方・貸方それぞれ1行だけ。2行に分けるとその問は0点。</li><li>金額は半角の数字だけ。カンマ・円・全角は入らない。</li><li>問題文には書き込めない。計算用紙はA4で2枚。</li><li>終わると点数だけが出る。どこを間違えたかは本物では返ってこない。</li></ul><b>おすすめの解く順番</b><br>第1問（15分）→ 第4問（20分）→ 第5問（10分）→ 第2問（20分）→ 第3問（25分）<br><span class="muted">確実に点が取れる仕訳と工業簿記を先に終わらせ、重い第2問・第3問に残り時間を使う。</span>${CH.c47 ? '<br><button class="link" data-guide style="padding-left:0">本試験の戦い方（ネット試験の操作・取引文の読み方・捨て問）を読む</button>' : ''}${examYear() >= 2027 ? '<br><b style="color:var(--cr)">2027年度モード：</b>手形・リースの区分は模試から外しています。' : ''}</div>`
      + `<div class="card stack"><h3>通しで解く（2段）</h3><p class="muted" style="margin:0;font-size:13px">1段目は時間なしで本番の形に慣れる。2段目で90分を計る。時間に追われる練習は、形に慣れてからのほうが身につく。</p><div class="row"><button class="btn ${untimed ? 'ghost' : 'gold'}" data-start="practice">1段目 時間なし${untimed ? `（${untimed}回）` : ''}</button><button class="btn ${untimed ? 'gold' : 'ghost'}" data-start>${I.paper}2段目 90分 本番</button></div><button class="link" data-op style="padding-left:0;font-size:13px">はじめての人：操作の練習（1題・採点しない）</button></div>`
      + `<div class="card stack"><h3>大問別の連続練習</h3><p class="muted" style="margin:0;font-size:13px">同じ大問を続けて解く。先輩の手本 → なぞる → 自分で → 時間あり、の順に進めるのがおすすめ。</p><div class="seg exam-modes">${EXAM_MODES.map(([k, t, d]) => `<button data-dm="${k}" aria-pressed="${k === drillMode}" title="${esc(d)}">${t}</button>`).join('')}</div><p class="muted" style="margin:0;font-size:12px" data-dmd>${esc(EXAM_MODES.find((m) => m[0] === drillMode)[2])}</p><div class="row">${PARTS.map((p) => `<button class="btn ghost sm" style="flex:none" data-drillpart="${p.k}">${p.t}</button>`).join('')}</div></div>`
      + `${hist.length ? `<div class="card"><div class="row" style="justify-content:space-between"><h3>これまでの成績</h3>${best ? `<span class="pix" style="color:var(--brand)">自己ベスト ${best}点</span>` : ''}</div><table class="score-table" style="margin-top:6px">${hist.map((e) => `<tr><td>${esc(e.date)}</td><td class="muted" style="font-size:12px">${e.mode === 'untimed' ? '時間なし' : '90分'}</td><td>${e.score >= 70 ? '<b style="color:var(--good)">合格</b>' : '<span class="muted">不合格</span>'}</td><td>${e.score}点</td></tr>`).join('')}</table></div>` : ''}</div>`;
    main.onclick = (e) => {
      if (e.target.closest('[data-guide]')) { go('stage', 'c47', 'lesson'); return; }
      if (e.target.closest('[data-op]')) { go('examplay', { part: 1, op: true }); return; }
      const dm = e.target.closest('[data-dm]');
      if (dm) { drillMode = dm.dataset.dm; $$('[data-dm]', main).forEach((b) => b.setAttribute('aria-pressed', String(b === dm))); $('[data-dmd]', main).textContent = EXAM_MODES.find((m) => m[0] === drillMode)[2]; return; }
      const dp = e.target.closest('[data-drillpart]');
      if (dp) { go('examplay', { part: +dp.dataset.drillpart, mode: drillMode }); return; }
      const s = e.target.closest('[data-start]'); if (s) go('examplay', s.dataset.start === 'practice');
    };
  };
  // arg：true＝通し・時間なし、false＝通し・90分、{ part, mode, key, op }＝大問別の練習
  SCREENS.examplay = function (arg) {
    const o = arg && typeof arg === 'object' ? arg : { full: true, mode: arg ? 'self' : 'timed' };
    const full = !!o.full, only = full ? null : o.part;
    const timed = o.mode === 'timed' && !o.op, coach = o.mode === 'model' || o.mode === 'trace' ? o.mode : null;
    const limit = full ? 90 : PART_MIN[only];
    const y27 = examYear() >= 2027;
    const allQ = CHAPTERS.filter((c) => c.id !== 'c00' && c.id !== 'c47' && !(y27 && OUT27_CH.has(c.id))).flatMap((c) => c.qs.filter((q) => q.type === 'journal' && !skipQ(q, y27)));
    const strong = (list) => { const s = list.filter((q) => (q.lv || 1) >= 2); return s.length >= 15 ? s : list; };
    const recent = new Set(S.examSeen);
    const want = (p) => full || only === p;
    let com = [], ind = [];
    if (o.op) com = [pick(allQ.filter((q) => !INDUSTRIAL.has(q._ch.world) && (q.lv || 1) === 1 && q.ans !== 'none' && q.ans.dr.length + q.ans.cr.length <= 3))];
    else {
      if (want(1)) com = sampleExam(strong(allQ.filter((q) => !INDUSTRIAL.has(q._ch.world))), 5, recent);
      if (want(4)) ind = sampleExam(strong(allQ.filter((q) => INDUSTRIAL.has(q._ch.world))), 3, recent);
    }
    const big = {};
    if (!o.op) [2, 3, 4, 5].filter(want).forEach((p) => {
      const pool = B.exams.filter((x) => x.part === p && !(y27 && OUT27_X.has(x.id)) && !skipQ(x, y27));
      const fixed = o.key && pool.find((x) => x._key === o.key);
      const fresh = pool.filter((x) => !recent.has(x._key));
      big[p] = fixed || (pool.length ? pick(fresh.length ? fresh : pool) : null);
    });
    if (!o.op) { S.examSeen = [...com, ...ind, ...Object.values(big).filter(Boolean)].map((q) => q._key).concat(S.examSeen).slice(0, 80); save(); }
    const parts = PARTS.filter((p) => want(p.k));
    const partTime = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let partT0 = performance.now();
    const comps = {}, flags = new Set(), keysOf = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    window.__bokiExam = comps;
    let curPart = parts[0].k, submitted = false, raf = null;
    const memo = ['', ''];
    const end = performance.now() + limit * 60000;
    leaveGuard = o.op ? null : '試験を途中でやめる？解答は保存されないよ';
    main.onclick = null;
    const title = o.op ? '操作の練習（採点しない）' : full ? `日商簿記2級 模擬試験（ネット試験形式${timed ? '' : '・時間なし'}）` : `${PARTS[only - 1].t}の練習（${EXAM_MODES.find((m) => m[0] === o.mode)[1]}）`;
    main.innerHTML = `<div class="cbt"><div class="cbt-head"><b class="cbt-title">${esc(title)}</b><span class="exam-timer" data-timer title="残り時間">${timed ? `残り ${String(limit).padStart(2, '0')}:00` : '時間なし'}</span><div class="cbt-tools"><button class="btn ghost sm" data-tool="memo">計算用紙</button><button class="btn ghost sm" data-tool="calc">電卓</button><button class="btn bad sm" data-submit>${full ? '試験終了' : '答え合わせ'}</button></div></div>${parts.length > 1 ? `<nav class="cbt-nav" aria-label="大問の切り替え">${parts.map((p) => `<button class="cbt-q" data-part="${p.k}"><b>${p.t}</b><small data-st="${p.k}"></small></button>`).join('')}</nav>` : ''}<div data-score></div>${parts.map((p) => `<section class="exam-part" data-sec="${p.k}" hidden></section>`).join('')}${parts.length > 1 ? '<div class="cbt-foot"><button class="btn ghost" data-step="-1">◀ 前の問題</button><button class="btn ghost" data-step="1">次の問題 ▶</button></div>' : ''}<p class="muted" style="font-size:12px;margin:10px 0 0">本番と同じく、勘定科目は問題ごとの候補から選び、金額は半角の数字で入力します（カンマ・円は不要）。マイナスは先頭に「-」または「△」。問題文には書き込めません。計算用紙は2枚まで。</p></div>`;
    if (o.op) $('[data-score]', main).innerHTML = `<div class="card coach"><b>タカシ先輩</b><p style="margin:4px 0 0">本番の画面の練習だ。点数には入らない。3つだけ試してみて。</p><ol style="margin:6px 0 0;padding-left:20px"><li>勘定科目はプルダウンから選ぶ。</li><li>金額にカンマや全角の数字を入れてみる。枠が赤くなる。本番では入らない。</li><li>同じ科目を同じ側に2行書いて「答え合わせ」を押してみる。正しい金額でも0点になる。</li></ol></div>`;
    const draftHTML = (q, part) => {
      const steps = (q.draft && q.draft.length ? q.draft : GEN_DRAFT[part]) || [];
      return `<div class="coach draft" data-draft><div class="qmeta"><b>先輩の下書き</b><span class="muted" style="font-size:12px">${q.draft ? 'この題の手順' : 'この大問の手順'}</span></div><ol>${steps.map((s, i) => `<li data-ds="${i}" ${coach === 'model' && i > 0 ? 'hidden' : ''}><b>${esc(s.t)}</b> ${esc(s.h)}</li>`).join('')}</ol>${coach === 'model' && steps.length > 1 ? '<button class="btn ghost sm" data-dnext>次の1手</button>' : ''}</div>`;
    };
    const sub = (subTitle, q, key, part) => {
      const box = document.createElement('div');
      box.className = 'exam-sub';
      box.dataset.key = key;
      box.innerHTML = `<div class="qmeta"><b>${subTitle}</b>${o.op ? '' : `<button class="cbt-flag" data-flag="${key}" aria-pressed="false">見直す</button>`}</div>${coach && (q.type !== 'journal' || key.endsWith('-0')) ? draftHTML(q, part) : ''}<div class="qtext rich noink">${rich(q.q)}</div><div data-b></div><div data-x></div>`;
      const target = $('[data-b]', box);
      comps[key] = { q, part, comp: q.type === 'journal' ? mountJournalCBT(q, target, { exam: true }) : mountFillCBT(q, target, { exam: true }), box };
      keysOf[part].push(key);
      return box;
    };
    const sec = (k) => $(`[data-sec="${k}"]`, main);
    if (want(1)) {
      sec(1).insertAdjacentHTML('beforeend', `<h2>第1問（20点）</h2><p class="muted" style="margin:0;font-size:13px">次の各取引について仕訳しなさい。勘定科目は各問のプルダウンの中から最も適当なものを選ぶこと。</p>`);
      com.forEach((q, i) => sec(1).appendChild(sub(`問${i + 1}`, q, `1-${i}`, 1)));
    }
    [2, 3, 5].filter(want).forEach((p) => {
      const P = PARTS[p - 1];
      sec(p).insertAdjacentHTML('beforeend', `<h2>${P.t}（${P.pts}点）${big[p] ? ` ${esc(big[p].title)}` : ''}</h2>`);
      if (big[p]) sec(p).appendChild(sub('', big[p], `${p}`, p)); else sec(p).insertAdjacentHTML('beforeend', '<p class="muted">この大問は準備中です。</p>');
    });
    if (want(4)) {
      sec(4).insertAdjacentHTML('beforeend', '<h2>第4問（28点）</h2><h3>(1) 仕訳（12点）</h3>');
      ind.forEach((q, i) => sec(4).appendChild(sub(`問${i + 1}`, q, `4-${i}`, 4)));
      sec(4).insertAdjacentHTML('beforeend', `<h3 style="margin-top:10px">(2) ${big[4] ? esc(big[4].title) : ''}（16点）</h3>`);
      if (big[4]) sec(4).appendChild(sub('', big[4], '4b', 4));
    }
    function status() {
      parts.forEach((p) => {
        const ks = keysOf[p.k], done = ks.filter((k) => comps[k].comp.answered()).length, fl = ks.filter((k) => flags.has(k)).length;
        const el = $(`[data-st="${p.k}"]`, main);
        if (el) el.innerHTML = ks.length ? `${done}/${ks.length}${fl ? ` <span class="flagmark">見直し${fl}</span>` : ''}` : '-';
        const btn = el && el.parentElement; if (btn) btn.classList.toggle('done', ks.length > 0 && done === ks.length);
      });
    }
    function show(k) {
      if (!submitted) { partTime[curPart] += performance.now() - partT0; partT0 = performance.now(); }
      curPart = k;
      $$('.cbt-q', main).forEach((t) => t.setAttribute('aria-current', String(+t.dataset.part === k)));
      $$('[data-sec]', main).forEach((s) => { s.hidden = +s.dataset.sec !== k; });
      const pi = parts.findIndex((p) => p.k === k);
      const pv = $('[data-step="-1"]', main), nx = $('[data-step="1"]', main);
      if (pv) pv.disabled = pi === 0; if (nx) nx.disabled = pi === parts.length - 1;
      window.scrollTo(0, 0);
    }
    show(curPart); status();
    main.oninput = status;
    function tick() {
      const left = Math.max(0, end - performance.now());
      const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
      const t = $('[data-timer]', main);
      if (t) { t.textContent = `残り ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; t.classList.toggle('low', left < Math.min(600000, limit * 6000)); }
      if (left <= 0) { toast('時間が終了しました。自動で採点します'); grade(true); return; }
      raf = requestAnimationFrame(tick);
    }
    if (timed) raf = requestAnimationFrame(tick);
    // 計算用紙：本番と同じ2枚。1枚に書ける量にも限りがある（A4の1枚を、30行×40字ほどの枠で）
    const SHEET_MAX = 1200, SHEET_LINES = 30;
    let memoEl = null, calcEl = null, sheet = 0;
    function toggleTool(kind) {
      if (kind === 'memo') {
        if (memoEl) { memo[sheet] = $('textarea', memoEl).value; memoEl.remove(); memoEl = null; return; }
        memoEl = document.createElement('div');
        memoEl.className = 'cbt-tool memo';
        memoEl.innerHTML = `<div class="tool-head"><b>計算用紙</b><div class="seg memo-tabs">${[0, 1].map((i) => `<button data-sheet="${i}" aria-pressed="${i === sheet}">${i + 1}枚目</button>`).join('')}</div><button class="icon-btn" data-close aria-label="計算用紙を閉じる">${I.x}</button></div><textarea id="cbt-memo" maxlength="${SHEET_MAX}" placeholder="下書き・計算メモ。本番と同じく2枚まで（試験が終わると消えます）"></textarea><small class="muted" data-left></small>`;
        const ta = $('textarea', memoEl);
        const left = () => { const lines = ta.value.split('\n'); if (lines.length > SHEET_LINES) { ta.value = lines.slice(0, SHEET_LINES).join('\n'); toast(`1枚に書けるのは${SHEET_LINES}行まで。2枚目を使うか、小さくまとめよう`); } $('[data-left]', memoEl).textContent = `${sheet + 1}枚目：のこり ${SHEET_MAX - ta.value.length}字・${SHEET_LINES - ta.value.split('\n').length}行`; };
        ta.value = memo[sheet]; left();
        ta.addEventListener('input', left);
        memoEl.addEventListener('click', (e) => {
          if (e.target.closest('[data-close]')) { toggleTool('memo'); return; }
          const sb = e.target.closest('[data-sheet]');
          if (sb) { memo[sheet] = ta.value; sheet = +sb.dataset.sheet; ta.value = memo[sheet]; $$('[data-sheet]', memoEl).forEach((b) => b.setAttribute('aria-pressed', String(b === sb))); left(); ta.focus(); }
        });
        document.body.appendChild(memoEl);
        ta.focus();
      } else {
        if (calcEl) { calcEl.remove(); calcEl = null; return; }
        calcEl = calcPanel();
        calcEl.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) toggleTool('calc'); });
        document.body.appendChild(calcEl);
      }
    }
    cleanup = () => { if (raf) cancelAnimationFrame(raf); if (memoEl) memoEl.remove(); if (calcEl) calcEl.remove(); main.oninput = null; main.onchange = null; };
    // 誤りの見立て（本人があとで直せる）
    function classify(c, r, timeUp) {
      const q = c.q, h = S.hist[q._key] || [0, 0];
      const learnedBefore = h[1] > 0 || (q._ch && q._ch.id && cleared(q._ch.id)) || (q.scope || []).some((id) => { const it = B.scope.find((x) => x.id === id); return it && cleared(it.ch); });
      if (!c.comp.answered()) return timeUp ? 'calc' : learnedBefore ? 'forgot' : 'unlearned';
      if (q.type === 'journal') { if (r.why === 'amount' || r.why === 'dup' || r.why === 'half') return 'calc'; return learnedBefore ? 'forgot' : 'unlearned'; }
      if (r.ratio >= 0.6 || r.half) return 'calc';
      return learnedBefore ? 'forgot' : 'unlearned';
    }
    const items = [];
    function grade(timeUp) {
      if (submitted) return;
      submitted = true; leaveGuard = null;
      if (raf) cancelAnimationFrame(raf);
      const score = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const add = (p, pts, key) => {
        const c = comps[key]; if (!c) return;
        const r = c.comp.check();
        const got = Math.round(pts * r.ratio * 10) / 10;
        score[p] += got;
        const miss = r.ok ? null : classify(c, r, timeUp);
        items.push({ key, p, pts, got, r, miss, c });
        if (o.op) return;
        // 手本・なぞりで解いた正解は、定着には数えない（間違いは記録する）
        if (!coach || !r.ok) recordAnswer(c.q, r.ok, false, !r.ok && c.comp.summary ? c.comp.summary() : '');
      };
      com.forEach((_, i) => add(1, 4, `1-${i}`));
      [2, 3, 5].filter(want).forEach((p) => add(p, PARTS[p - 1].pts, `${p}`));
      ind.forEach((_, i) => add(4, 4, `4-${i}`));
      if (want(4)) add(4, 16, '4b');
      Object.keys(score).forEach((k) => { score[k] = Math.round(score[k]); });
      const total = parts.reduce((a, p) => a + score[p.k], 0), max = o.op ? 4 * com.length : parts.reduce((a, p) => a + p.pts, 0);
      partTime[curPart] += performance.now() - partT0;
      const mins = {}; Object.keys(partTime).forEach((k) => { mins[k] = Math.round(partTime[k] / 60000); });
      const missN = { unlearned: 0, forgot: 0, calc: 0 }; items.forEach((it) => { if (it.miss) missN[it.miss]++; });
      let rec = null;
      if (full) {
        rec = { date: today(), score: total, parts: score, mins, cbt: true, mode: timed ? 'timed' : 'untimed', miss: missN };
        S.exams.push(rec);
        gainXP(total * 3); gainCoins(Math.floor(total / 5));
      } else if (!o.op) gainXP(Math.round(total / 2));
      save(); checkBadges();
      const pass = full && total >= 70;
      if (full) { if (pass) { SFX.win(); confetti(260); } else SFX.lose(); } else (total === max ? SFX.ok : SFX.ng)(1);
      $$('.cbt-flag', main).forEach((b) => { b.disabled = true; });
      $$('select, input', main).forEach((x) => { x.disabled = true; });
      // まず本物と同じく、点数だけを出す
      const head = full ? `<div class="eyebrow">試験結果</div><div class="pix" style="font-size:60px;line-height:1">${total}<span style="font-size:22px">点</span></div><span class="pass-stamp ${pass ? '' : 'fail'}">${pass ? '合格' : '不合格'}</span>` : `<div class="eyebrow">${o.op ? '操作の練習' : '大問別の練習'}</div><div class="pix" style="font-size:44px;line-height:1">${total}<span style="font-size:18px"> / ${max}点</span></div>`;
      const table = full ? `<table class="score-table"><tr><th></th><th>得点</th><th>かけた時間</th><th>目安</th></tr>${PARTS.map((p) => `<tr><th style="text-align:left">${p.t}</th><td>${score[p.k]} / ${p.pts}</td><td class="num ${mins[p.k] > PART_MIN[p.k] + 3 ? 'over' : ''}">${mins[p.k]}分</td><td class="num muted">${PART_MIN[p.k]}分</td></tr>`).join('')}</table>` : `<p class="muted" style="margin:0;font-size:13px">かけた時間 ${Math.max(1, mins[only])}分（目安 ${PART_MIN[only]}分）</p>`;
      $('[data-score]', main).innerHTML = `<div class="card result" style="margin-bottom:14px">${head}${table}${full ? '<p class="muted" style="margin:0;font-size:13px">本物の試験の画面はここまで。点数だけが出て、どこを間違えたかは返ってこない。</p>' : ''}<div class="row" style="justify-content:center"><button class="btn gold" data-look>振り返る${full ? '（本物にはない）' : ''}</button>${!full && !o.op ? `<button class="btn ghost" data-again>同じ大問をもう1題</button>` : ''}</div><div data-look-body></div></div>`;
      $('[data-submit]', main).outerHTML = '<button class="btn sm" data-go="exam">試験メニューへ</button>';
      window.scrollTo(0, 0);
      flushLevelUps();
      main._look = () => look(total, rec);
    }
    // 振り返り：各問の正誤と解説、誤りの3分類と戻り先、合格ラインとの距離
    function look(total, rec) {
      items.forEach(({ key, pts, got, r, c }) => {
        c.comp.reveal(r.ok);
        const why = r.why === 'dup' ? `<p class="rulemiss">同じ側に同じ科目（${esc(r.dup.join('・'))}）を2行に分けて書いている。金額が合っていても、本番ではこの問は0点。1行にまとめる。</p>` : r.why === 'half' || r.half ? '<p class="rulemiss">半角の数字でない金額がある。本番の画面では入力できない。</p>' : '';
        $('[data-x]', c.box).innerHTML = `<div class="fb ${r.ok ? 'ok' : 'ng'}"><div class="fb-title">${r.ok ? '正解' : '不正解'} <span class="pix" style="font-size:15px">${got} / ${pts}点</span></div>${why}${r.ok ? '' : c.comp.answerHTML()}<div class="rich">${rich(c.q.exp)}</div></div>`;
        if (!coach && (c.q.type !== 'journal' || key === '1-0' || key === '4-0')) $('[data-x]', c.box).insertAdjacentHTML('beforeend', `<details class="coach draft-after"><summary>先輩ならこう解く（下書き）</summary>${draftHTML(Object.assign({}, c.q), c.part).replace(/ hidden/g, '').replace(/<button[^>]*data-dnext[^>]*>[^<]*<\/button>/, '')}</details>`);
      });
      $('[data-look]', main).remove();
      main._recat = (key, v) => { const it = items.find((x) => x.key === key); if (!it) return; it.miss = v; if (rec) { rec.miss = { unlearned: 0, forgot: 0, calc: 0 }; items.forEach((x) => { if (x.miss) rec.miss[x.miss]++; }); save(); } const keep = window.scrollY; summary(total, rec); window.scrollTo(0, keep); };
      summary(total, rec);
    }
    function summary(total, rec) {
      const wrong = items.filter((it) => it.miss);
      const lost = { unlearned: 0, forgot: 0, calc: 0 }; wrong.forEach((it) => { lost[it.miss] += it.pts - it.got; });
      const label = (it) => it.c.q.type === 'journal' ? `${PARTS[it.p - 1].t} ${it.key.endsWith('b') ? '' : `問${+it.key.split('-')[1] + 1}`}` : `${PARTS[it.p - 1].t} ${esc(it.c.q.title || '')}`;
      let border = '';
      if (full) {
        if (total >= 70) {
          const margin = total - 70, safe = PARTS.filter((p) => (rec.parts[p.k] || 0) <= margin && rec.parts[p.k] > 0);
          border = `<p style="margin:0">あと ${margin}点 落としても合格だった。${safe.length ? `${safe.map((p) => p.t).join('・')}を丸ごと落としても届いていた。` : 'どの大問を丸ごと落としても届かない。全部の大問が合格を支えている。'}</p>`;
        } else {
          const need = 70 - total;
          border = `<p style="margin:0">合格まであと ${need}点。${lost.calc >= need ? `「計算・形式・時間」で落とした ${Math.round(lost.calc)}点のうち ${need}点を拾えば届いていた。新しく覚えることより、手順を直すほうが近い。` : lost.calc + lost.forgot >= need ? `「計算・形式・時間」と「忘れていた」を合わせた ${Math.round(lost.calc + lost.forgot)}点で届く。` : '習っていない論点を埋めるのが先。'}</p>`;
        }
      }
      const groups = Object.keys(MISS).map((k) => {
        const list = wrong.filter((it) => it.miss === k);
        if (!list.length) return '';
        const dest = k === 'unlearned' ? list.map((it) => it.c.q._ch && it.c.q._ch.id && CH[it.c.q._ch.id] ? `<button class="btn ghost sm" data-lesson="${it.c.q._ch.id}">${esc(it.c.q._ch.title)} のレッスン</button>` : `<button class="btn ghost sm" data-coach="${esc(it.c.q._key)}" data-cp="${it.p}">この題を先輩の手本で</button>`).filter((x, i, a) => a.indexOf(x) === i).join('') : k === 'forgot' ? '<button class="btn ghost sm" data-go-note>まちがいノートへ（日をあけて解き直す）</button>' : `${[...new Set(list.map((it) => it.p))].map((p) => `<button class="btn ghost sm" data-drill-timed="${p}">${PARTS[p - 1].t}を時間ありで</button>`).join('')}${CH.c47 ? '<button class="btn ghost sm" data-guide2>計算用紙の使い方を読む</button>' : ''}`;
        return `<section class="miss-group" data-mg="${k}"><h4>${esc(MISS[k].t)} <small>${list.length}問・${Math.round(lost[k])}点</small></h4><p class="muted" style="margin:0;font-size:12px">${esc(MISS[k].d)} → ${esc(MISS[k].go)}</p><ul class="miss-list">${list.map((it) => `<li><span>${label(it)}</span><select data-recat="${esc(it.key)}" aria-label="誤りの分類を直す">${Object.keys(MISS).map((m) => `<option value="${m}" ${m === k ? 'selected' : ''}>${esc(MISS[m].t)}</option>`).join('')}</select></li>`).join('')}</ul><div class="row">${dest}</div></section>`;
      }).join('');
      $('[data-look-body]', main).innerHTML = `<div class="stack" style="text-align:left;margin-top:12px">${border}${wrong.length ? `<h3>間違いの見立て</h3><p class="muted" style="margin:0;font-size:12px">ゲームが見立てた分類。違うと思ったら選び直せる。分類ごとに戻る場所が変わる。</p>${groups}` : '<p style="margin:0">全問正解。この大問の型は手に入っている。</p>'}</div>`;
    }
    main.onchange = (e) => { const s = e.target.closest('[data-recat]'); if (s && main._recat) main._recat(s.dataset.recat, s.value); else status(); };
    main.onclick = (e) => {
      const g = (s) => e.target.closest(s);
      if (g('[data-look]')) { main._look && main._look(); return; }
      if (g('[data-again]')) { go('examplay', { part: only, mode: o.mode }); return; }
      if (g('[data-lesson]')) { go('stage', g('[data-lesson]').dataset.lesson, 'lesson'); return; }
      if (g('[data-coach]')) { go('examplay', { part: +g('[data-coach]').dataset.cp, mode: 'model', key: g('[data-coach]').dataset.coach }); return; }
      if (g('[data-go-note]')) { go('review', 'note'); return; }
      if (g('[data-drill-timed]')) { go('examplay', { part: +g('[data-drill-timed]').dataset.drillTimed, mode: 'timed' }); return; }
      if (g('[data-guide2]')) { go('stage', 'c47', 'lesson'); return; }
      if (g('[data-dnext]')) { const d = g('[data-draft]'), nx = $('li[hidden]', d); if (nx) nx.hidden = false; if (!$('li[hidden]', d)) g('[data-dnext]').remove(); return; }
      const t = g('[data-part]');
      if (t) { show(+t.dataset.part); return; }
      const st = g('[data-step]');
      if (st) { const pi = parts.findIndex((p) => p.k === curPart); const np = parts[Math.min(parts.length - 1, Math.max(0, pi + +st.dataset.step))]; show(np.k); return; }
      const fl = g('[data-flag]');
      if (fl) { const k = fl.dataset.flag; if (flags.has(k)) flags.delete(k); else flags.add(k); fl.setAttribute('aria-pressed', String(flags.has(k))); status(); return; }
      const tool = g('[data-tool]');
      if (tool) { toggleTool(tool.dataset.tool); return; }
      if (g('[data-submit]')) {
        if (!full) { grade(false); return; }
        const keys = Object.keys(comps), empty = keys.filter((k) => !comps[k].comp.answered()).length;
        modal(`<h2>試験を終了しますか？</h2><p style="margin:0">終了すると採点され、解答は変更できません。</p>${empty || flags.size ? `<p class="muted" style="margin:0">${empty ? `未回答 ${empty} 問` : ''}${empty && flags.size ? '・' : ''}${flags.size ? `見直しマーク ${flags.size} 問` : ''}があります。</p>` : ''}`, [{ t: '問題に戻る', cls: 'ghost' }, { t: '終了して採点', cls: 'bad', on: () => grade(false) }]);
      }
    };
  };

  /* ---------- collection ---------- */
  let zukanTab = 'cards';
  SCREENS.zukan = function (tab) {
    if (tab) zukanTab = tab;
    const tabs = [['cards', '実務カード'], ['acc', '勘定科目'], ['badge', 'バッジ']];
    let body = '';
    if (zukanTab === 'cards') {
      body = `<p class="muted" style="margin:0;font-size:13px">ステージを初クリアすると、その知識が「現場のどこで使われるか」がわかる実務カードが手に入る。 ${S.cards.length} / ${CHAPTERS.length}</p><div class="coll">${CHAPTERS.map((c) => { const has = S.cards.includes(c.id); return `<button class="coll-card ${has ? '' : 'locked'}" data-card="${c.id}"><span class="eyebrow">No.${String(chNum(c.id)).padStart(2, '0')} ・ ${esc(W[c.world].name)}</span><b>${has ? esc(c.real.t) : '？？？'}</b><span class="muted" style="font-size:11px">${has ? esc(c.real.where || '') : `「${esc(c.title)}」をクリア`}</span></button>`; }).join('')}</div>`;
    } else if (zukanTab === 'acc') {
      const names = Object.keys(B.accounts);
      body = `<input id="acc-search" class="search" placeholder="科目名や説明でさがす" autocomplete="off"><div data-acc-list></div>`;
      setTimeout(() => {
        const draw = (qs) => {
          const list = names.filter((n) => !qs || n.includes(qs) || B.accounts[n].d.includes(qs));
          $('[data-acc-list]', main).innerHTML = ['資産', '負債', '純資産', '収益', '費用', 'その他'].map((cat) => { const l = list.filter((n) => B.accounts[n].cat === cat); return l.length ? `<h3 style="margin:14px 0 6px">${cat === 'その他' ? 'その他（評価勘定・工業簿記など）' : cat} <span class="muted num" style="font-size:13px">${l.length}</span></h3><div class="acc-list">${l.map((n) => `<div class="acc-item"><i style="background:hsl(${CAT_HUE[cat]} 55% 52%)"></i><b>${esc(n)}</b><span>${esc(B.accounts[n].d)}</span></div>`).join('')}</div>` : ''; }).join('') || '<p class="muted">見つからなかった</p>';
        };
        draw('');
        $('#acc-search').addEventListener('input', (e) => draw(e.target.value.trim()));
      });
    } else {
      body = `<div class="badge-grid">${BADGES.map(([id, n, d, , h]) => `<div class="badge ${S.badges.includes(id) ? '' : 'locked'}">${medal(h)}<b>${n}</b><span>${d}</span></div>`).join('')}</div>`;
    }
    main.innerHTML = `<div class="stack"><div><div class="eyebrow">COLLECTION</div><h1>図鑑</h1></div><div class="seg">${tabs.map(([k, t]) => `<button data-zt="${k}" aria-pressed="${k === zukanTab}">${t}</button>`).join('')}</div>${body}</div>`;
    main.onclick = (e) => {
      const t = e.target.closest('[data-zt]');
      if (t) { SCREENS.zukan(t.dataset.zt); return; }
      const c = e.target.closest('[data-card]');
      if (c) {
        const ch = CH[c.dataset.card];
        if (!S.cards.includes(ch.id)) { toast(`「${ch.title}」をクリアすると手に入るよ`); return; }
        modal(`<div class="realcard" style="max-width:none"><div class="eyebrow">実務カード No.${chNum(ch.id)}</div><h3>${esc(ch.real.t)}</h3><div class="where">${esc(ch.real.where || '')}</div><div class="rich">${rich(ch.real.h)}</div></div>`, [{ t: 'とじる', cls: 'ghost' }, { t: 'レッスンを読む', on: () => go('stage', ch.id, 'lesson') }]);
      }
    };
  };

  /* ---------- settings ---------- */
  SCREENS.settings = function () {
    const t = S.total;
    main.innerHTML = `<div class="stack"><div><div class="eyebrow">SETTINGS</div><h1>設定と記録</h1></div><div class="card stack"><label for="nm"><b>なまえ</b></label><div class="row"><input id="nm" class="search" style="flex:1" maxlength="12" value="${esc(S.name)}"><button class="btn sm" data-savename>変更</button></div><label class="row" style="justify-content:space-between" for="exam-date"><span><b>受験予定日</b><br><span class="muted" style="font-size:12px">残り日数の表示と、試験年度（${examYear()}年度）に合わせた模試の出題に使う</span></span><input type="date" id="exam-date" class="search" style="width:auto" value="${esc(S.examDate)}"></label><label class="row" style="justify-content:space-between"><span><b>効果音</b></span><input type="checkbox" id="snd" ${S.settings.sound ? 'checked' : ''}></label><label class="row" style="justify-content:space-between"><span><b>フリーモード</b><br><span class="muted" style="font-size:12px">全ステージ・全ボスを最初から開放（得意・苦手な論点だけ練習したい人向け）</span></span><input type="checkbox" id="free" ${S.settings.free ? 'checked' : ''}></label></div><div class="card"><h3 style="margin-bottom:6px">学習の記録</h3><table class="score-table"><tr><th style="text-align:left">解いた問題</th><td>${t.answered}</td></tr><tr><th style="text-align:left">正解</th><td>${t.correct}（${t.answered ? Math.round((t.correct / t.answered) * 100) : 0}%）</td></tr><tr><th style="text-align:left">最大コンボ</th><td>${t.maxCombo}</td></tr><tr><th style="text-align:left">クリアしたステージ</th><td>${CHAPTERS.filter((c) => cleared(c.id)).length} / ${CHAPTERS.length}</td></tr><tr><th style="text-align:left">倒したボス</th><td>${Object.keys(S.boss).length} / ${WORLDS.length}</td></tr><tr><th style="text-align:left">累計XP</th><td>${S.xp}</td></tr></table></div><div class="card stack"><h3>データ</h3><p class="muted" style="margin:0;font-size:13px">進み具合はこのブラウザだけに保存されます。</p><button class="btn bad" data-reset>データをすべて消す</button></div></div>`;
    main.onclick = (e) => {
      if (e.target.closest('[data-savename]')) { S.name = $('#nm').value.trim().slice(0, 12) || S.name; save(); renderHUD(); toast('なまえを変更したよ'); }
      if (e.target.closest('[data-reset]')) confirmBox('本当にすべてのデータを消す？', '消す', () => { S = DEF(); save(); go('home'); });
    };
    $('#snd').onchange = (e) => { S.settings.sound = e.target.checked; save(); SFX.tap(); };
    $('#exam-date').onchange = (e) => { S.examDate = e.target.value || ''; save(); toast(S.examDate ? `受験日を ${S.examDate}（${examYear()}年度）に設定したよ` : '受験日を消したよ'); SCREENS.settings(); };
    $('#free').onchange = (e) => { S.settings.free = e.target.checked; save(); toast(e.target.checked ? 'フリーモード ON' : 'フリーモード OFF'); };
  };

  go('home');
})();
