#!/usr/bin/env node
// 入れなかった操作が誤答に数えられないこと、連打とキャンセルを確かめる。
'use strict';
const assert = require('node:assert/strict'), { chromium } = require(process.env.PIYO_PLAYWRIGHT || 'playwright');
const { prepare, move, server } = require('./journal-inputs');
(async () => {
  const { s, origin } = await server(), b = await chromium.launch({ executablePath: process.env.PIYO_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const width of [390, 1280]) {
      const c = await b.newContext({ viewport: { width, height: 900 }, hasTouch: true, reducedMotion: 'reduce' }); await c.route('**/*', r => r.request().url().startsWith(origin + '/') ? r.continue() : r.abort()); const p = await c.newPage(); p.setDefaultTimeout(5000); await prepare(p, origin);
      await p.locator('[data-card="0-1"]').focus(); await p.keyboard.press('Space'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('Escape');
      assert.equal(await p.locator('[data-card="0-1"]').getAttribute('data-state'), 'idle');
      const touch = async (dx, dy, cancel) => {
        const el = p.locator('[data-card="0-1"]'); await el.scrollIntoViewIfNeeded(); const r = await el.boundingBox(), x = r.x + r.width / 2, y = r.y + r.height / 2, cd = await c.newCDPSession(p);
        await cd.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        await cd.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx, y: y + dy }] });
        await p.waitForTimeout(100); await cd.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] }); await cd.detach(); await p.waitForTimeout(270);
      };
      await touch(10, 0, false); assert(await p.$('[data-card="0-1"]'));
      await touch(0, 70, false); assert(await p.$('[data-card="0-1"]'));
      await touch(60, 0, true); assert(await p.$('[data-card="0-1"]')); assert.equal(await p.locator('.j-ghost').count(), 0);
      assert.equal(await p.evaluate(() => (window.__sim.S.noteLog || []).filter(x => x.card === '0-1').length), 0);
      // 連打直後に、移動した札を押してもメニューへ化けない。
      await move(p, '0-1', 'R', 'tap'); await p.locator('[data-placed="0-1"]').click(); assert(await p.locator('[data-menu]').isHidden());
      await p.waitForTimeout(310); await p.locator('[data-placed="0-1"]').click(); assert(await p.locator('[data-menu]').isVisible());
      await p.keyboard.press('Escape'); assert(await p.locator('[data-menu]').isHidden());
      // 同じ札の2回連続の誤りは、あとで正しく直しても記録を消さない。
      await p.locator('[data-placed="0-1"]').click(); await p.click('[data-undo-card="0-1"]');
      for (let n = 0; n < 2; n++) { await move(p, '0-1', 'L', 'tap'); await p.waitForTimeout(420); await p.click('[data-react-close]'); }
      await move(p, '0-1', 'R', 'tap');
      const r = await p.evaluate(() => window.__sim.S.noteLog.find(x => x.card === '0-1')); assert.equal(r.errors, 2); assert.equal(r.repeatWrong, 1); assert.equal(r.sameSideTwice, true); assert.equal(r.firstSide, 'R');
      assert.equal(await p.locator('.j-ghost').count(), 0); await c.close(); console.log(`OK：${width} Esc・小さいスワイプ・縦スクロール・touchCancel・連打300ms・連続誤答の保持`);
    }
  } finally { await b.close(); s.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
