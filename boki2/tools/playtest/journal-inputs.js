#!/usr/bin/env node
// note の実入力による通し検査。外部リクエストは遮断。進行状態を注入しない。
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium } = require(process.env.PIYO_PLAYWRIGHT || 'playwright');
const auto = require('./auto.js');
const ROOT = path.resolve(__dirname, '../..'), OUT = path.resolve(process.env.JOURNAL_OUT || 'work/journal-evidence');
const mime = f => f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html';
async function server() {
  const s = http.createServer((req, res) => { const f = path.resolve(ROOT, '.' + new URL(req.url, 'http://localhost').pathname); if (!f.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); } try { res.setHeader('Content-Type', mime(f) + ';charset=utf-8'); res.end(fs.readFileSync(f)); } catch { res.writeHead(404); res.end(); } });
  await new Promise(r => s.listen(0, '127.0.0.1', r)); return { s, origin: `http://127.0.0.1:${s.address().port}` };
}
const exists = async (p, sel) => !!await p.$(sel);
async function move(p, id, side, input) {
  const sel = `[data-card="${id}"]`, el = p.locator(sel);
  if (input === 'tap') { await el.click(); if (await exists(p, '[data-ask]')) return; await p.locator(`[data-col="${side}"]`).click(); }
  if (input === 'keyboard') { await el.focus(); await p.keyboard.press('Enter'); if (await exists(p, '[data-ask]')) return; await p.keyboard.press(side === 'L' ? 'ArrowLeft' : 'ArrowRight'); await p.keyboard.press('Enter'); }
  if (input === 'drag') { await el.dragTo(p.locator(`[data-col="${side}"]`)); }
  if (input === 'swipe') {
    await el.scrollIntoViewIfNeeded(); const r = await el.boundingBox(), cdp = await p.context().newCDPSession(p), x = r.x + r.width / 2, y = r.y + r.height / 2, dx = Math.max(r.width * .4, 80) * (side === 'L' ? -1 : 1);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let k = 1; k <= 6; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * k / 6, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach();
  }
}
async function prepare(p, origin) {
  await p.goto(origin + '/ramen.html');
  const r = await auto(p, { style: 'idle', maxSteps: 100, stopWhen: async () => exists(p, '[data-journal]') }); assert(r.stopped); assert.deepEqual(r.overflow, []);
  if (await exists(p, '[data-j-sound]')) await p.click('[data-j-sound="off"]');
  if (await exists(p, '[data-demo-skip]')) await p.click('[data-demo-skip]');
  await p.waitForTimeout(510);
}
async function complete(p, input) {
  for (let step = 0; step < 30; step++) {
    if (await exists(p, '[data-step]')) return;
    if (await exists(p, '[data-ask]')) { await p.click('[data-ask="2-0"]'); continue; }
    if (await exists(p, '[data-note-reason]')) { const li = (await p.getAttribute('[data-note-reason]', 'data-note-reason')).split('-')[0]; const sel = `[data-note-reason="${li}-0"]`; await p.click(sel); await p.waitForSelector(sel, { state: 'detached' }); continue; }
    const id = await p.getAttribute('[data-card]', 'data-card'); assert(id, '次の札がある');
    const side = await p.evaluate(id => { const [li, ci] = id.split('-').map(Number); return window.__sim.events()[window.__sim.S.ei].steps.find(s => s.k === 'note').lines[li].cards[ci].side; }, id);
    await move(p, id, side, input);
    if (!await exists(p, '[data-ask]')) await p.waitForFunction(id => JSON.parse(window.__sim.S.drafts['board:prologue'].snap).sub[id], id, { timeout: 3000 });
  }
  throw Error('note を最後まで書けない');
}
async function main() {
  fs.mkdirSync(OUT, { recursive: true }); const { s, origin } = await server();
  const b = await chromium.launch({ executablePath: process.env.PIYO_CHROMIUM || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  let checks = 0;
  try {
    for (const width of [390, 1280]) for (const input of ['tap', 'keyboard', 'drag', 'swipe']) {
      const errors = [], c = await b.newContext({ viewport: { width, height: 900 }, hasTouch: input === 'swipe', reducedMotion: 'reduce' });
      await c.route('**/*', r => r.request().url().startsWith(origin + '/') ? r.continue() : r.abort());
      const p = await c.newPage(); p.on('pageerror', e => errors.push(e.message)); p.setDefaultTimeout(5000); await prepare(p, origin);
      if (width === 1280) assert(await p.locator('[data-journal]').evaluate(el => el.getBoundingClientRect().width > 1000), 'PCは3段の枠を広く使う');
      assert.match(await p.locator('[data-card="0-1"]').getAttribute('aria-label'), /手札/);
      assert.match(await p.locator('[data-placed="0-0"]').getAttribute('aria-label'), /押すと直せる/);
      await complete(p, input);
      const state = await p.evaluate(() => { const s = window.__sim.S; return { sub: JSON.parse(s.drafts['board:prologue'].snap).sub, log: s.noteLog, bytes: window.BOKI.store.v4.encodedBytes(window.__sim.doc), overflow: document.documentElement.scrollWidth > innerWidth + 1 }; });
      assert.deepEqual(Object.fromEntries(Object.entries(state.sub).filter(([k]) => /^\d-\d$/.test(k))), { '0-0': 'L', '0-1': 'R', '1-0': 'L', '1-1': 'R', '2-0': 'R', '2-1': 'L' });
      assert.equal(state.log.filter(x => !x.demo && x.firstCorrect).length, 5); assert(state.bytes < 2 * 1024 * 1024); assert.equal(state.overflow, false); assert.deepEqual(errors, []);
      fs.writeFileSync(path.join(OUT, `${width}-${input}.json`), JSON.stringify(state, null, 2));
      await p.click('[data-step]'); assert(await exists(p, '.s-name')); await c.close(); checks++;
      console.log(`OK：${width} ${input} note完走・5枚の初回列・保存・名前・はみ出しなし`);
    }
    // 誤答・閉じるまでのロック・保存の開き直し・特定の1枚を戻す。
    const c = await b.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' }); await c.route('**/*', r => r.request().url().startsWith(origin + '/') ? r.continue() : r.abort()); const p = await c.newPage(); p.setDefaultTimeout(5000); await prepare(p, origin);
    await move(p, '0-1', 'L', 'tap'); await p.waitForTimeout(420); assert(await p.locator('[data-card="0-1"]').isDisabled());
    const first = await p.evaluate(() => window.__sim.S.noteLog.find(x => x.card === '0-1')); assert.equal(first.firstSide, 'L'); assert.equal(first.firstCorrect, false);
    await p.reload(); await p.click('[data-start]'); assert(await p.locator('[data-card="0-1"]').isDisabled()); await p.click('[data-react-close]');
    await move(p, '0-1', 'R', 'tap'); await p.waitForTimeout(320); await p.click('[data-placed="0-0"]'); await p.click('[data-undo-card="0-0"]');
    assert(await exists(p, '[data-placed="0-1"]')); assert(await exists(p, '[data-card="0-0"]'));
    await move(p, '0-0', 'L', 'tap'); await complete(p, 'tap'); assert.equal(await p.evaluate(() => window.__sim.S.noteLog.find(x => x.card === '0-1').firstSide), 'L'); await c.close(); checks++;
    console.log('OK：誤答後のロックと再開・最初の列の保持・手本1枚だけを戻して修正');
    // 3段の録画と実際のAnimationの検査（両幅）。
    for (const width of [390, 1280]) for (const motion of ['rich', 'normal', 'calm']) {
      const c = await b.newContext({ viewport: { width, height: 900 }, recordVideo: { dir: OUT, size: { width, height: 900 } } }); await c.route('**/*', r => r.request().url().startsWith(origin + '/') ? r.continue() : r.abort()); const p = await c.newPage(); await prepare(p, origin);
      // 設定はタイトルの実ボタンで変える。ゲーム中の状態は注入しない。
      await p.reload(); await p.locator('summary').filter({ hasText: 'ゲームの設定' }).click(); await p.click(`button[data-motion="${motion}"]`); await p.click('[data-start]');
      const from = await p.locator('[data-card="0-1"]').boundingBox(); await p.click('[data-note="0-1"][data-side="R"]');
      const evidence = await p.evaluate(() => document.getAnimations().map(a => ({ timing: a.effect.getTiming(), frames: a.effect.getKeyframes().map(f => ({ transform: f.transform, opacity: f.opacity, height: f.height })) })));
      if (motion === 'calm') assert(evidence.every(a => a.frames.every(f => !f.transform && !f.height)), '控えめは位置・高さの補間なし');
      else assert(evidence.some(a => a.frames.some(f => f.transform)), '札の位置の補間あり');
      for (const ms of [0, 80, 170, 80, 150, 200]) { await p.waitForTimeout(ms); await p.screenshot({ path: path.join(OUT, `${width}-${motion}-${ms}-${Date.now()}.png`), fullPage: true }); }
      fs.writeFileSync(path.join(OUT, `${width}-${motion}-animations.json`), JSON.stringify({ from, evidence }, null, 2)); const video = p.video(); await c.close(); await video.saveAs(path.join(OUT, `${width}-${motion}.webm`)); checks++;
      console.log(`OK：${width} ${motion} 録画・連続画面写真・実Animation`);
    }
    console.log(`OK：noteブラウザ検査 ${checks}件`);
  } finally { await b.close(); s.close(); }
}
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
module.exports = { main, prepare, complete, move, server };
