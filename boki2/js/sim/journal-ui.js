// 札と列の共通部品。台本・正解・保存は読まない。engine が判断を渡す。
(function (g) {
  'use strict';
  const J = (g.BOKI = g.BOKI || {}).journal = {};
  // コメント6405792276の条件：全部が【推論・置き値】。lo/hiは試遊で決める幅で、出典の実測値ではない。
  // 画面の手ざわりの数であり、経営の計算を扱う coef.js の世界の係数とは別のもの。
  // sectionは DESIGN-JOURNAL-UX 版0.4の節。値を変えるときも5.1の時間の線の上限は守る。
  J.parameters = {
    drag: { value: 3, lo: 1, hi: 6, section: '4.1・4.4' },
    swipe: { value: .35, lo: .2, hi: .5, section: '4.1・4.4' },
    velocity: { value: .3, lo: .1, hi: .6, section: '4.1・4.4' },
    vertical: { value: 1.5, lo: 1, hi: 2, section: '4.1・4.4' },
    scrollMs: { value: 60, lo: 30, hi: 100, section: '4.4' },
    hit: { value: 24, lo: 0, hi: 32, section: '4.1・4.4' },
    finger: { value: 12, lo: 0, hi: 24, section: '4.4' },
    repeat: { value: 300, lo: 200, hi: 400, section: '4.4' },
    returnMs: { value: 250, lo: 150, hi: 300, section: '4.4・5.2 A4' },
    timeline: { value: 700, lo: 680, hi: 700, section: '5.1' },
  };
  J.limits = Object.fromEntries(Object.entries(J.parameters).map(([key, p]) => [key, p.value]));
  J.ranges = Object.fromEntries(Object.entries(J.parameters).map(([key, p]) => [key, [p.lo, p.hi]]));
  // 同じ表を実際の再生とjournal-checkが読む。startLo/Hiは開始時刻、lo/hiは長さの幅（ms）。
  const motion = (name, start, duration, props, calm = ['opacity']) => ({ name, start, duration,
    section: '5.1・5.2・5.5', startLo: Math.max(0, start - 50), startHi: start + 50,
    lo: Math.max(0, duration - 50), hi: Math.min(400, duration + 50),
    type: 'feedback', rich: props, normal: props, calm });
  J.timelines = {
    note: [motion('press', 0, 80, ['transform']), motion('flight', 80, 250, ['transform']), motion('land', 330, 150, ['transform']), motion('shelf', 250, 400, ['transform', 'height', 'number'], ['color', 'opacity']), motion('money', 250, 300, ['transform'], [])],
    row: [motion('row', 330, 150, ['color']), motion('reward', 330, 300, ['transform'], []), motion('circle', 480, 200, ['transform'])],
    doc: [motion('press', 0, 80, ['transform']), motion('ledger', 80, 300, ['transform']), motion('shelf', 230, 400, ['height', 'number'], ['color']), motion('reward', 230, 300, ['transform'], []), motion('row', 380, 150, ['opacity'])],
    demo: [{ name: 'demo', start: 0, startLo: 0, startHi: 0, duration: 2100, lo: 1500, hi: 2100, section: '3.3・5.2 A9・5.5', type: 'teaching', skippable: true, rich: ['transform'], normal: ['transform'], calm: ['opacity'] }],
    speech: [{ name: 'speech', start: 0, startLo: 0, startHi: 0, duration: 1500, lo: 0, hi: 1500, section: '5.2 A14・5.5', type: 'teaching', skippable: true, rich: ['text'], normal: ['text'], calm: [] }],
  };
  J.motion = value => ['rich', 'normal', 'calm'].includes(value) ? value : g.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'calm' : 'normal';
  let settings = { motion: J.motion(), sound: 'on', soundAsked: false }, active = null, audio;
  J.configure = prefs => { settings = { ...settings, ...prefs, motion: J.motion(prefs.motion) }; if (g.document) g.document.documentElement.dataset.motion = settings.motion; };
  J.sfx = {};
  // 全音とも自作。外部の素材・通信なし（設計5.6の既定）。発音は明示的な同意後だけ。
  const tone = (notes, duration, wave = 'triangle') => {
    if (settings.sound !== 'on' || !settings.soundAsked) return;
    try {
      audio ||= new (g.AudioContext || g.webkitAudioContext)(); audio.resume().catch(() => {});
      notes.forEach((freq, i) => { const o = audio.createOscillator(), v = audio.createGain(), t = audio.currentTime + i * duration / notes.length / 1000;
        o.type = wave; o.frequency.value = freq; v.gain.setValueAtTime(.035, t); v.gain.exponentialRampToValueAtTime(.001, t + duration / 1000);
        o.connect(v); v.connect(audio.destination); o.start(t); o.stop(t + duration / 1000); });
    } catch (_) { /* 音が使えなくても操作は続く */ }
  };
  J.sfx.tap = () => tone([440], 40, 'square'); J.sfx.land = () => tone([660, 880], 80);
  J.sfx.correct = () => tone([523, 659, 784], 250); J.sfx.money = () => tone([1320, 1760], 200); J.sfx.error = () => tone([180], 120);
  J.cleanup = () => { active?.destroy(); active = null; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  J.amount = n => Math.abs(n) % 10000 === 0 ? Math.abs(n) / 10000 + '万円' : Math.abs(n) % 1000 === 0 ? Math.abs(n) / 1000 + '千円' : Math.abs(n).toLocaleString('ja-JP') + '円';
  J.label = (c, placed) => `${c.label} ${placed ? '' : c.amount < 0 ? '−' : '＋'}${J.amount(c.amount)}`;
  // button を入れ子にせず、列の取っ手と置いた札を別々の button にする。
  J.markup = ({ cards, columns, positions = {}, blocked = null }) => `<div class="j-deck"><div class="j-columns">${columns.map(col => `<section class="j-column" data-zone="${col.id}"><button class="j-drop" data-col="${col.id}" aria-describedby="j-cue-${col.id}">${esc(col.label)}<small id="j-cue-${col.id}">${esc(col.cue)}</small></button><div class="j-placed">${cards.filter(c => positions[c.id] === col.id).map(c => `<button class="j-card" data-placed="${c.id}" data-state="settled-pending" aria-label="${esc(J.label(c, true))}、${esc(col.label)}に入っている。押すと直せる">✓ ${esc(c.label)} <span class="j-sign" data-negative="${c.amount < 0}">${c.amount < 0 ? '−' : ''}</span>${J.amount(c.amount)}</button>`).join('')}</div></section>`).join('')}</div><div class="j-hand" data-hand>${cards.filter(c => !positions[c.id]).map(c => `<div class="j-hand-card"><button class="j-card" data-card="${c.id}" data-state="${(Array.isArray(blocked) ? blocked.includes(c.id) : blocked === c.id) ? 'blocked' : 'idle'}" ${(Array.isArray(blocked) ? blocked.includes(c.id) : blocked === c.id) ? 'disabled' : ''} aria-label="${esc(J.label(c))}、手札">${esc(J.label(c))}</button><div class="j-directions">${columns.map(col => `<button class="j-direct" data-note="${c.id}" data-side="${col.id}" ${(Array.isArray(blocked) ? blocked.includes(c.id) : blocked === c.id) ? 'disabled' : ''} aria-label="${esc(J.label(c))}を${esc(col.label)}に入れる">${col.id === 'L' ? '◀ ' : ''}${esc(col.label)}に入れる${col.id === 'R' ? ' ▶' : ''}</button>`).join('')}</div></div>`).join('')}</div><div class="j-menu" data-menu hidden></div><p class="j-status" role="status" aria-live="polite" data-j-status></p></div>`;
  J.deck = opts => {
    J.cleanup();
    const { root, cards, columns, positions, onStart = () => true, onPlace, onRemove, onState = () => {} } = opts;
    const abort = new AbortController(), animations = new Set(), timers = new Set(), ghosts = new Set();
    let continuation = null;
    let lifted = null, selected = null, pointer = null, suppressClick = false, lastPlace = opts.lastPlacedAt || 0, dead = false;
    const findCard = id => cards.find(c => c.id === id), cardEl = id => [...root.querySelectorAll('[data-card],[data-placed]')].find(e => (e.dataset.card || e.dataset.placed) === id);
    const status = text => { const e = root.querySelector('[data-j-status]'); if (e) e.textContent = text; };
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!dead && root.isConnected) fn(); }, ms); timers.add(t); return t; };
    const anim = (el, frames, options) => {
      if (!el?.isConnected) return null;
      const a = el.animate(frames, { easing: 'cubic-bezier(.2,.8,.2,1)', ...options }); animations.add(a);
      a.finished.then(() => { animations.delete(a); if (a.playState !== 'idle') a.cancel(); }).catch(() => animations.delete(a)); return a;
    };
    const finish = () => { const fn = continuation; continuation = null; [...animations].forEach(a => { try { a.finish(); } catch (_) {} }); if (!dead) fn?.(); };
    const state = (id, value) => { const e = cardEl(id); if (e) e.dataset.state = value; onState(id, value); };
    const highlight = side => { root.querySelectorAll('[data-zone]').forEach(e => e.classList.toggle('j-target', e.dataset.zone === side)); };
    const reset = () => { if (lifted) state(lifted, positions[lifted] ? 'settled-pending' : 'idle'); lifted = selected = null; highlight(null); root.querySelector('[data-menu]').hidden = true; };
    const lift = id => { finish(); if (!onStart(id)) return false; lifted = id; state(id, 'lifted'); J.sfx.tap(); status(`${J.label(findCard(id))}を持った。左右を選び、Enterで入れる。Escでやめる`); return true; };
    const place = (id, side, input, rect) => {
      if (!findCard(id) || !columns.some(c => c.id === side)) return;
      if (positions[id] === side) { anim(cardEl(id), settings.motion === 'calm' ? [{ backgroundColor: '#fff4bd' }, { backgroundColor: '#fff8df' }] : [{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 200 }); status('この札は、ここにある'); return; }
      if (cardEl(id)?.disabled) return;
      finish(); lastPlace = Date.now(); state(id, 'placed'); onPlace(id, side, { input, rect: rect || cardEl(id)?.getBoundingClientRect() });
    };
    const menu = id => { if (Date.now() - lastPlace < J.limits.repeat) return; finish(); lifted = id; state(id, 'menu');
      const e = root.querySelector('[data-menu]'); e.hidden = false;
      e.innerHTML = columns.filter(c => c.id !== positions[id]).map(c => `<button data-menu-side="${c.id}">${esc(c.label)}へ</button>`).join('') + `<button data-undo-card="${id}">棚へ戻す</button>`;
      anim(e, settings.motion === 'calm' ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 120 });
      e.querySelector('button')?.focus({ preventScroll: true });
    };
    const listen = (type, fn, options = {}) => root.addEventListener(type, fn, { ...options, signal: abort.signal });
    listen('click', e => {
      const b = e.target.closest('button'); if (!b || !root.contains(b) || !b.closest('.j-deck')) return;
      e.stopPropagation(); if (suppressClick) { suppressClick = false; return; }
      if (b.dataset.note) { if (lift(b.dataset.note)) place(b.dataset.note, b.dataset.side, 'tap'); }
      else if (b.dataset.card) { lifted === b.dataset.card ? reset() : lift(b.dataset.card); }
      else if (b.dataset.placed) menu(b.dataset.placed);
      else if (b.dataset.col && lifted) place(lifted, b.dataset.col, 'tap');
      else if (b.dataset.menuSide && lifted) place(lifted, b.dataset.menuSide, 'menu');
      else if (b.dataset.undoCard) { finish(); onRemove(b.dataset.undoCard, { input: 'menu', rect: cardEl(b.dataset.undoCard)?.getBoundingClientRect() }); }
    });
    listen('keydown', e => {
      if (continuation) { e.preventDefault(); finish(); return; }
      const b = e.target.closest('[data-card],[data-placed]');
      if (e.key === 'Escape') { e.preventDefault(); reset(); return; }
      const id = b && (b.dataset.card || b.dataset.placed);
      if (id && e.key === 'Backspace' && positions[id]) { e.preventDefault(); onRemove(id, { input: 'keyboard', rect: b.getBoundingClientRect() }); return; }
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && (lifted || id)) { e.preventDefault(); if (!lifted && !lift(id)) return; selected = e.key === 'ArrowLeft' ? columns[0].id : columns[1].id; highlight(selected); status(`${columns.find(c => c.id === selected).label}を選んだ`); return; }
      if (id && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); if (lifted === id && selected) place(id, selected, 'keyboard'); else if (positions[id]) menu(id); else lift(id); }
    });
    const zoneAt = (x, y) => {
      const zs = [...root.querySelectorAll('[data-zone]')].map(el => ({ el, r: el.getBoundingClientRect() }));
      return zs.filter(({ r }) => x >= r.left - J.limits.hit && x <= r.right + J.limits.hit && y >= r.top - J.limits.hit && y <= r.bottom + J.limits.hit).sort((a, b) => Math.abs(x - (a.r.left + a.r.width / 2)) - Math.abs(x - (b.r.left + b.r.width / 2)))[0]?.el.dataset.zone;
    };
    listen('pointerdown', e => {
      if (continuation) { e.preventDefault(); finish(); return; }
      const el = e.target.closest('[data-card],[data-placed]'); if (!el || el.disabled || e.button > 0) return;
      const id = el.dataset.card || el.dataset.placed;
      if (!onStart(id)) { e.preventDefault(); suppressClick = true; return; }
      finish(); pointer = { id, el, x: e.clientX, y: e.clientY, px: e.clientX, py: e.clientY, t: performance.now(), lastT: performance.now(), vx: 0, dx: 0, dy: 0, type: e.pointerType, moved: false, rect: el.getBoundingClientRect() };
      el.setPointerCapture(e.pointerId);
    });
    listen('pointermove', e => {
      const p = pointer; if (!p) return;
      const now = performance.now(), dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (p.type === 'touch' && !p.moved && Math.abs(dy) > Math.abs(dx) * J.limits.vertical && Math.abs(dy) > J.limits.drag && !positions[p.id]) { pointer = null; reset(); return; }
      if (Math.hypot(dx, dy) < J.limits.drag) return;
      if (!p.moved) {
        if (!lift(p.id)) { pointer = null; return; } p.moved = true; state(p.id, 'dragging');
        const ghost = p.el.cloneNode(true); ghost.removeAttribute('data-card'); ghost.removeAttribute('data-placed'); ghost.className = 'j-card j-ghost'; ghost.setAttribute('aria-hidden', 'true'); ghost.style.cssText = `left:${p.rect.left}px;top:${p.rect.top}px;width:${p.rect.width}px;height:${p.rect.height}px;`; document.body.append(ghost); ghosts.add(ghost); p.ghost = ghost; p.el.classList.add('j-drag-origin');
      }
      e.preventDefault(); p.dx = dx; p.dy = dy;
      if (now > p.lastT) p.vx = (e.clientX - p.px) / (now - p.lastT); p.px = e.clientX; p.py = e.clientY; p.lastT = now;
      if (settings.motion !== 'calm') p.ghost.style.transform = `translate(${dx}px,${dy - (p.type === 'touch' ? J.limits.finger : 0)}px)`;
      const side = p.type === 'touch' ? (Math.abs(dx) >= p.rect.width * J.limits.swipe ? (dx < 0 ? columns[0].id : columns[1].id) : null) : zoneAt(p.rect.left + p.rect.width / 2 + dx, p.rect.top + p.rect.height / 2 + dy);
      highlight(side);
      if (p.type !== 'touch' && (e.clientY < 30 || e.clientY > innerHeight - 30)) g.scrollBy(0, e.clientY < 30 ? -12 : 12);
    }, { passive: false });
    const release = (e, cancel) => {
      const p = pointer; pointer = null; if (!p) return;
      p.el.classList.remove('j-drag-origin'); highlight(null);
      if (!p.moved) return;
      suppressClick = true; later(() => { suppressClick = false; }, 0);
      const recentV = performance.now() - p.lastT < J.limits.scrollMs ? p.vx : 0;
      const side = cancel ? null : p.type === 'touch' ? ((Math.abs(p.dx) >= p.rect.width * J.limits.swipe || Math.abs(recentV) >= J.limits.velocity) ? (p.dx < 0 ? columns[0].id : columns[1].id) : null) : zoneAt(p.rect.left + p.rect.width / 2 + p.dx, p.rect.top + p.rect.height / 2 + p.dy);
      const rect = p.ghost.getBoundingClientRect();
      if (!cancel && positions[p.id] && p.dy > p.rect.height && Math.abs(p.dy) > Math.abs(p.dx) * J.limits.vertical) { p.ghost.remove(); ghosts.delete(p.ghost); onRemove(p.id, { input: 'swipe', rect }); }
      else if (side) { p.ghost.remove(); ghosts.delete(p.ghost); place(p.id, side, p.type === 'touch' ? 'swipe' : 'drag', rect); }
      else {
        const a = anim(p.ghost, settings.motion === 'calm' ? [{ opacity: .6 }, { opacity: 0 }] : [{ transform: p.ghost.style.transform }, { transform: 'translate(0,0)' }], { duration: J.limits.returnMs });
        a?.finished.finally(() => { p.ghost.remove(); ghosts.delete(p.ghost); }).catch(() => {}); reset();
      }
    };
    listen('pointerup', e => release(e, false)); listen('pointercancel', e => release(e, true));
    // HTML DnD は Playwright dragTo と通常のブラウザ操作にも対応。Pointer経路と同じ place を使う。
    root.querySelectorAll('[data-card],[data-placed]').forEach(e => { e.draggable = true; });
    listen('dragstart', e => { const b = e.target.closest('[data-card],[data-placed]'); if (!b) return; const id = b.dataset.card || b.dataset.placed; if (!lift(id)) { e.preventDefault(); return; } if (pointer?.ghost) { pointer.ghost.remove(); ghosts.delete(pointer.ghost); pointer.el.classList.remove('j-drag-origin'); } pointer = null; state(id, 'dragging'); e.dataTransfer.setData('text/plain', id); });
    listen('dragover', e => { if (!lifted) return; e.preventDefault(); highlight(zoneAt(e.clientX, e.clientY)); });
    listen('drop', e => { e.preventDefault(); e.stopPropagation(); const id = e.dataTransfer.getData('text/plain'), side = zoneAt(e.clientX, e.clientY); if (findCard(id) && side) place(id, side, 'drag'); else if (findCard(id) && e.target.closest('[data-hand]') && positions[id]) onRemove(id, { input: 'drag', rect: cardEl(id)?.getBoundingClientRect() }); reset(); });
    listen('dragend', () => { highlight(null); pointer = null; root.querySelectorAll('.j-drag-origin').forEach(e => e.classList.remove('j-drag-origin')); ghosts.forEach(e => { if (e.classList.contains('j-ghost')) { e.remove(); ghosts.delete(e); } }); reset(); });
    const phase = (timeline, name) => J.timelines[timeline].find(x => x.name === name);
    const api = {
      anim, later, finish, status, state, root,
      layout(fn) { g.addEventListener('resize', fn, { signal: abort.signal }); fn(); },
      choose(button, next) {
        if (continuation) { finish(); return; }
        J.sfx.tap(); continuation = next;
        button.setAttribute('aria-pressed', 'true');
        const others = [...button.parentElement.querySelectorAll('button')].filter(e => e !== button);
        anim(button, settings.motion === 'calm' ? [{ backgroundColor: '#fff4bd' }, { backgroundColor: '#eef5f2' }] : [{ transform: 'translateY(2px)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 230 });
        others.forEach(el => { el.style.opacity = '.6'; anim(el, [{ opacity: 1 }, { opacity: .6 }], { duration: 150 }); });
        later(() => { const fn = continuation; continuation = null; fn?.(); }, 230);
      },
      flight(id, from, { wrong = false, returning = false, demo = false, side = null } = {}) {
        const el = cardEl(id); if (!el || !from) return;
        const to = el.getBoundingClientRect(), x = from.left - to.left, y = from.top - to.top, flight = phase('note', 'flight'), land = phase('note', 'land');
        if (wrong) {
          const col = [...root.querySelectorAll('[data-col]')].find(e => e.dataset.col === side), edge = col?.getBoundingClientRect();
          anim(col, settings.motion === 'calm' ? [{ backgroundColor: '#f5cec0' }, { backgroundColor: 'transparent' }] : [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 160 });
          const ex = edge ? edge.left + edge.width / 2 - to.left - to.width / 2 : x, ey = edge ? edge.bottom - to.top - to.height / 2 : y, scale = edge ? Math.min(1, edge.width / to.width) : 1;
          anim(el, settings.motion === 'calm' ? [{ opacity: .25 }, { opacity: 1 }] : [{ transform: `translate(${x}px,${y}px)` }, { transform: `translate(${ex}px,${ey}px) scale(${scale})`, offset: .375 }, { transform: 'translate(0,0)' }], { duration: 400 }); return;
        }
        if (settings.motion === 'calm') { anim(el, [{ opacity: .25 }, { opacity: 1 }], { duration: 150 }); return; }
        anim(el, [{ transform: `translate(${x}px,${y}px)`, opacity: .75 }, { transform: `translate(${x / 2}px,${y / 2 - 24}px)`, opacity: 1 }, { transform: 'translate(0,0)', opacity: 1 }], { delay: returning || demo ? 0 : flight.start, duration: returning || demo ? 200 : flight.duration, fill: 'backwards' });
        if (!returning) anim(el, [{ transform: 'scaleY(.96)' }, { transform: 'scaleY(1)' }], { delay: demo ? 200 : land.start, duration: land.duration });
        if (settings.motion === 'rich') later(() => api.coins(el, el, 0), 330);
      },
      coins(fromEl, toEl, delay = 250, outward = false) {
        if (settings.motion === 'calm' || !fromEl || !toEl) return;
        const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
        for (let k = 0; k < (settings.motion === 'rich' ? 3 : 2); k++) { const c = document.createElement('span'); c.className = 'j-coin'; c.textContent = '●'; c.setAttribute('aria-hidden', 'true'); c.style.cssText = `left:${a.left + a.width / 2}px;top:${a.top}px`; document.body.append(c); ghosts.add(c);
          const x = b.left + b.width / 2 - a.left - a.width / 2, y = b.top - a.top;
          const animation = anim(c, [{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${x / 2 + k * 8}px,${y / 2 - 32}px)`, opacity: 1 }, { transform: `translate(${x + k * 8}px,${y + (outward ? 25 : 0)}px)`, opacity: 0 }], { delay, duration: 300 });
          animation?.finished.finally(() => { c.remove(); ghosts.delete(c); }).catch(() => {});
        }
      },
      shelf(before, after, bands, delay = phase('note', 'shelf').start) {
        const duration = phase('note', 'shelf').duration;
        later(() => {
          bands.forEach((el, k) => { if (before[k] === after[k]) return; const bar = el.querySelector('[data-bar]'), num = el.querySelector('[data-number]'), old = Math.max(2, before[k] / 350);
            bar.style.height = Math.max(2, after[k] / 350) + 'px'; num.textContent = after[k].toLocaleString('ja-JP') + '円';
            el.classList.add('j-changed'); later(() => el.classList.remove('j-changed'), 1200);
            if (settings.motion !== 'calm') { anim(bar, [{ height: old + 'px' }, { height: Math.max(2, after[k] / 350) + 'px' }], { duration });
              const clock = { v: before[k] }, steps = 20; for (let n = 0; n <= steps; n++) later(() => { clock.v = before[k] + (after[k] - before[k]) * n / steps; num.textContent = Math.round(clock.v).toLocaleString('ja-JP') + '円'; }, n * duration / steps);
            } else anim(el, [{ opacity: .5 }, { opacity: 1 }], { duration: 150 });
          });
        }, delay);
      },
      reward(row, delay = phase('row', 'reward').start) {
        later(() => { J.sfx.correct(); if (settings.motion !== 'calm') {
          api.coins(root.querySelector('[data-shelf-art]'), root.querySelector('[data-shelf-art]'), 0);
          anim(root.closest('.j-layout'), [{ transform: 'translateX(0)' }, { transform: `translateX(${settings.motion === 'rich' ? 4 : 2}px)` }, { transform: 'translateX(0)' }], { duration: 120 });
        }
          anim(row, [{ backgroundColor: '#fff4bd' }, { backgroundColor: '#eef5f2' }], { duration: 150 });
        }, delay);
        const circle = row?.querySelector('[data-circle]'); if (circle) anim(circle, settings.motion === 'calm' ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: 'scale(.6)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { delay: phase('row', 'circle').start, duration: phase('row', 'circle').duration, fill: 'backwards' });
      },
      speech(el, full) {
        if (!el || settings.motion === 'calm') return;
        let complete = false;
        const chars = [...full], dt = Math.min(30, 1500 / Math.max(1, chars.length)); el.textContent = '';
        chars.forEach((_, i) => later(() => { if (!complete) el.textContent = chars.slice(0, i + 1).join(''); }, (i + 1) * dt));
        const reveal = () => { complete = true; el.textContent = full; }; el.addEventListener('click', reveal, { once: true, signal: abort.signal });
      },
      destroy() { dead = true; finish(); abort.abort(); timers.forEach(clearTimeout); ghosts.forEach(e => e.remove()); root.querySelectorAll('.j-drag-origin').forEach(e => e.classList.remove('j-drag-origin')); },
    };
    active = api; return api;
  };
})(typeof window !== 'undefined' ? window : globalThis);
