// 遊びの検査（プレイテスト）の記録係。検査する人は、ゲームをこの道具を通してだけ操作する。
// すべての操作（押した所・ねらい・その前後のゲームの状態・画面写真の sha256）と、その場の気持ちを log.jsonl に1行ずつ残す。
// 各行は1つ前の行の sha256 を持つ（あとから書き換えると鎖が切れる）。persona.md（人物像）と knowledge.md（前提知識の棚卸し）は最初に開いた時点で固定され、あとから変えると開けない。
// 検証は verify.js（ログの鎖・ペルソナ・画面写真・報告の引用・会話記録の時刻との突き合わせ）。
//
// 使い方（検査する人のスクリプトの中で）：
//   const H = require('/home/user/progate_school/boki2/tools/playtest/harness.js');
//   const s = await H.open('<作業フォルダ>', { viewport: { width: 375, height: 760 } });
//   await s.read();                          // 画面の文字を読む（戻り値は文字。ログには sha256）
//   await s.click('[data-go]', 'ねらい');     // 押す。ねらい（なぜ押すか）は必ず書く
//   await s.fill('input[data-s="dr"]', '1000', 'ねらい'); await s.select('select…', '普通預金', 'ねらい');
//   await s.feel('いま、ここで分からなくなった');  // その場の気持ち（あとで書かない）
//   await s.shot('名前');                      // 画面写真（操作のたびにも自動で撮る）
//   await s.auto({ months: 2 }, 'ねらい');     // 長い区間を自動で進める（自動の区間もログに残る）
//   人がする操作（ゲームの中の答えは読めないが、ふつうの人ができる操作は全部できる）：
//   s.tap(sel)・s.tapAt(x, y)（押し損ね）・s.type(sel, '１０００')（1字ずつ打つ）・s.hover・s.longPress・s.drag(from, to)・s.scroll(dy)・s.swipe(dy)
//   s.press('Tab')（キーボードだけで進める）と s.focus()（いま選ばれている所が見えるか）・s.a11y()（読み上げソフトから見た画面）
//   s.back()・s.reload()（中断して戻る）・s.rotate()（画面を回す）・s.textScale(150)（文字を大きく）・s.offline(true)（ネットが切れる）・s.inspect(sel)（大きさ・色・コントラスト比）
//   ※ どの操作にも、最後の引数に「ねらい」を必ず書く
//   await s.close();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const autoRun = require('./auto.js');

const GAME = '/tmp/claude-0/-home-user-progate-school/0f5c124a-6604-5e69-b554-2beafc4f2038/scratchpad/review/game.html';
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const fileSha = (f) => sha(fs.readFileSync(f));

exports.GAME = GAME;
exports.open = async function open(dir, { viewport = { width: 375, height: 760 }, colorScheme = 'light', reset = false, touch = null } = {}) {
  dir = path.resolve(dir);
  const persona = path.join(dir, 'persona.md');
  if (!fs.existsSync(persona)) throw new Error('persona.md がない。遊ぶ前に、人物像を書いて固定すること');
  const knowledge = path.join(dir, 'knowledge.md');
  if (!fs.existsSync(knowledge)) throw new Error('knowledge.md がない。遊ぶ前に、前提知識の棚卸しを書いて固定すること');
  const logFile = path.join(dir, 'log.jsonl');
  const shots = path.join(dir, 'shots');
  fs.mkdirSync(shots, { recursive: true });
  const lines = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean) : [];
  const pre = path.join(dir, 'pretest.md');
  const personaSha = fileSha(persona), knowledgeSha = fileSha(knowledge), preSha = fs.existsSync(pre) ? fileSha(pre) : null;
  const first = lines.length ? JSON.parse(lines[0]) : null;
  if (first && first.persona_sha !== personaSha) throw new Error('persona.md が、最初に遊んだときから変わっている。人物像は遊ぶ前に固定する（変えたいときは、遊んだあとの気づきを report.md に書く）');
  if (first && first.knowledge_sha !== knowledgeSha) throw new Error('knowledge.md が、最初に遊んだときから変わっている。前提知識は遊ぶ前に固定する');
  if (first && (first.pretest_sha || null) !== preSha) throw new Error('pretest.md（遊ぶ前のテスト）が、最初に遊んだときから変わっている');
  let prev = lines.length ? sha(lines[lines.length - 1]) : '0';
  let n = lines.length;
  const sid = crypto.randomBytes(6).toString('hex');
  const write = (o) => {
    const line = JSON.stringify(Object.assign({ n: n++, t: new Date().toISOString(), sid, prev }, o));
    fs.appendFileSync(logFile, line + '\n');
    prev = sha(line);
    return n - 1;
  };
  // スマホ・タブレット（幅が1024未満）は指で押す端末として開く（tap が使える）
  const isTouch = touch == null ? viewport.width < 1024 : !!touch;
  const ctx = await chromium.launchPersistentContext(path.join(dir, 'profile'), { executablePath: '/opt/pw-browsers/chromium', viewport, colorScheme, hasTouch: isTouch, isMobile: isTouch && viewport.width < 900, deviceScaleFactor: isTouch ? 2 : 1 });
  const p = ctx.pages()[0] || (await ctx.newPage());
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + GAME);
  if (reset) { await p.evaluate(() => localStorage.clear()); await p.reload(); }
  write({ kind: 'session', touch: isTouch, game_sha: fileSha(GAME), harness_sha: fileSha(__filename), auto_sha: fileSha(path.join(__dirname, 'auto.js')), persona_sha: personaSha, knowledge_sha: knowledgeSha, pretest_sha: preSha, viewport, colorScheme, reset });
  const state = () => p.evaluate(() => { try { const S = window.__sim.S; const ev = (window.__sim.events() || [])[S.ei]; return { mi: S.mi, ei: S.ei, phase: S.phase, ev: ev ? `${ev.t}:${ev.id || ''}` : null, label: (document.querySelector('.s-month b') || document.querySelector('.s-head b') || {}).textContent || '' }; } catch (e) { return { err: String(e).slice(0, 80) }; } });
  let shotN = fs.readdirSync(shots).length;
  const shoot = async (label) => {
    const f = path.join(shots, `${String(++shotN).padStart(4, '0')}-${String(label || '').replace(/[^\w぀-ヿ一-鿿-]+/g, '_').slice(0, 40)}.jpg`);
    await p.screenshot({ path: f, type: 'jpeg', quality: 55 });
    return { file: path.relative(dir, f), sha: fileSha(f) };
  };
  const act = async (kind, sel, why, fn) => {
    if (!why || String(why).trim().length < 4) throw new Error('ねらい（なぜその操作をするか）を4字以上で書くこと');
    const before = await state();
    await fn();
    await p.waitForTimeout(120);
    const after = await state();
    const shot = await shoot(kind);
    return write({ kind, sel, why, before, after, shot, errs: errs.splice(0) });
  };
  return {
    // page（ブラウザそのもの）は渡さない。ゲームの中の答えを読めてしまうため。見た目を調べるときは inspect() を使う
    // 読み飛ばす人物は glance()（各まとまりの最初の1行・40字まで）を使い、read() で全文を読んだときは、読んだことになる
    async glance() { const parts = await p.evaluate(() => [...document.querySelectorAll('h2,h3,h4,p,button,small,b,li,td,th,label')].filter((e) => e.offsetParent !== null).map((e) => (e.innerText || '').split('\n')[0].slice(0, 40)).filter(Boolean)); const txt = parts.join('\n'); write({ kind: 'glance', state: await state(), text_sha: sha(txt), chars: txt.length }); return txt; },
    // 見た目の検査：要素の大きさ・文字の大きさ・色・背景色・コントラスト比だけを返す（文字の中身は返さない）
    async inspect(sel, why) {
      if (!why) throw new Error('調べるねらいを書くこと');
      const r = await p.evaluate((sel) => {
        const lum = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map((v) => { v = v / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
        const bgOf = (e) => { while (e) { const c = getComputedStyle(e).backgroundColor; if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; e = e.parentElement; } return 'rgb(255, 255, 255)'; };
        return [...document.querySelectorAll(sel)].slice(0, 40).map((e) => { const b = e.getBoundingClientRect(), cs = getComputedStyle(e), fg = cs.color, bg = bgOf(e), L1 = lum(fg), L2 = lum(bg); return { w: Math.round(b.width), h: Math.round(b.height), x: Math.round(b.x), y: Math.round(b.y), font: cs.fontSize, weight: cs.fontWeight, color: fg, bg, contrast: L1 != null && L2 != null ? +((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)).toFixed(2) : null, visible: e.offsetParent !== null }; });
      }, sel);
      write({ kind: 'inspect', sel, why, state: await state(), n: r.length, result: r });
      return r;
    },
    async read() { const txt = await p.evaluate(() => document.body.innerText); write({ kind: 'read', state: await state(), text_sha: sha(txt), chars: txt.length }); return txt; },
    click: (sel, why) => act('click', sel, why, () => p.click(sel)),
    fill: (sel, v, why) => act('fill', sel, why, () => p.fill(sel, String(v))),
    select: (sel, v, why) => act('select', sel, why, () => p.selectOption(sel, v)),
    press: (key, why) => act('press', key, why, () => p.keyboard.press(key)),
    // ── 人がする操作を、そのまま試す（答えは読めない） ──
    tap: (sel, why) => act('tap', sel, why, () => p.tap(sel)),                                   // 指で押す（タッチの端末）
    tapAt: (x, y, why) => act('tapAt', `${x},${y}`, why, () => (isTouch ? p.touchscreen.tap(x, y) : p.mouse.click(x, y))), // 画面の場所を押す（押し損ね・端の小さな所）
    type: (sel, text, why) => act('type', sel, why, async () => { await p.click(sel); await p.keyboard.type(String(text), { delay: 30 }); }), // 1字ずつ打つ（全角・半角のまちがいも試せる）
    hover: (sel, why) => act('hover', sel, why, () => p.hover(sel)),
    longPress: (sel, why) => act('longPress', sel, why, async () => { const b = await p.locator(sel).first().boundingBox(); await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down(); await p.waitForTimeout(800); await p.mouse.up(); }),
    drag: (from, to, why) => act('drag', `${from} -> ${to}`, why, () => p.dragAndDrop(from, to)),
    scroll: (dy, why) => act('scroll', String(dy), why, () => p.mouse.wheel(0, dy)),
    swipe: (dy, why) => act('swipe', String(dy), why, async () => { const w = viewport.width / 2, h = viewport.height / 2; await p.mouse.move(w, h); await p.mouse.down(); await p.mouse.move(w, h - dy, { steps: 8 }); await p.mouse.up(); }),
    back: (why) => act('back', 'history.back', why, () => p.goBack().catch(() => null)),
    reload: (why) => act('reload', 'reload', why, () => p.reload()),                              // 中断して戻ったとき、続きから遊べるか
    rotate: (why) => act('rotate', 'rotate', why, async () => { viewport = { width: viewport.height, height: viewport.width }; await p.setViewportSize(viewport); }), // 画面を回す
    textScale: (pct, why) => act('textScale', String(pct), why, () => p.addStyleTag({ content: `html{font-size:${pct}% !important}` })), // 文字を大きくする設定のかわり
    offline: (on, why) => act('offline', String(on), why, () => ctx.setOffline(!!on)),           // ネットが切れたとき（保存・再開）
    // キーボードだけで進めるか：いま選ばれている所（フォーカス）の名前・役割・枠線が見えるか
    async focus(why) { if (!why) throw new Error('ねらいを書くこと'); const r = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e), b = e.getBoundingClientRect(); return { tag: e.tagName, role: e.getAttribute('role'), label: (e.getAttribute('aria-label') || e.innerText || e.value || '').slice(0, 40), outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, boxShadow: cs.boxShadow !== 'none', w: Math.round(b.width), h: Math.round(b.height) }; }); write({ kind: 'focus', why, state: await state(), result: r }); return r; },
    // 読み上げソフトから見た画面（アクセシビリティの木）。見えている部品の役割と名前だけ
    async a11y(why) { if (!why) throw new Error('ねらいを書くこと'); const t = await p.locator('body').ariaSnapshot().catch((e) => `取れなかった：${e.message}`); write({ kind: 'a11y', why, state: await state(), text_sha: sha(t), chars: t.length }); return t; },
    async feel(text) { if (!text || text.length < 6) throw new Error('気持ちは6字以上で'); return write({ kind: 'feel', text, state: await state() }); },
    async shot(label) { return write({ kind: 'shot', label, state: await state(), shot: await shoot(label) }); },
    async auto(opts = {}, why) {
      if (!why) throw new Error('自動で進めるねらいを書くこと');
      const start = await state();
      const startMi = start.mi;
      const stopWhen = opts.until ? opts.until : opts.months ? async (pg) => (await pg.evaluate(() => window.__sim.S.mi)) >= startMi + opts.months : null;
      const id = write({ kind: 'auto-start', why, opts: { months: opts.months || null, choose: opts.choose || {}, broad: !!opts.broad, maxSteps: opts.maxSteps || 400 }, state: start });
      let k = 0;
      const r = await autoRun(p, { choose: opts.choose || {}, broad: !!opts.broad, maxSteps: opts.maxSteps || 400, stopWhen, onStep: async () => { if (++k % 20 === 0) write({ kind: 'auto-step', of: id, state: await state() }); }, shot: async (nm) => { write({ kind: 'auto-shot', of: id, shot: await shoot(nm) }); } });
      write({ kind: 'auto-end', of: id, result: { steps: r.steps, stopped: !!r.stopped, end: !!r.end, stuck: r.stuck || null }, state: await state(), shot: await shoot('auto-end') });
      return r;
    },
    async close() { write({ kind: 'close', state: await state(), errs: errs.splice(0) }); await ctx.close(); },
  };
};
