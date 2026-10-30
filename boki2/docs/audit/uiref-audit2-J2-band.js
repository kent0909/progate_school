// 事実の判定2（J2）：ramen.html を幅390・高さ844で開き、文字の大きさの設定 100%・125%・150% ごとに、
// 上部の帯（.r-band）が初めて出た画面で、帯の高さ・position・帯の中の字の大きさ（計算後の値）を測る。外部への通信はしない（file://）。
// 使い方: node boki2/docs/audit/uiref-audit2-J2-band.js <リポジトリの根> <画像の出力先>
const { chromium } = require('playwright');
const B = process.argv[2], OUT = process.argv[3];
const autoRun = require(B + '/boki2/tools/playtest/auto.js');
(async () => {
  for (const z of [100, 125, 150]) {
    const b = await chromium.launch();
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    let blocked = 0; await p.route(/^(?!file:)/, r => { blocked++; r.abort(); });
    await p.goto('file://' + B + '/boki2/ramen.html'); await p.waitForTimeout(600);
    if (z !== 100) { await p.click('details.s-more > summary'); await p.click(`[data-tscale="${z}"]`); await p.waitForTimeout(300); }
    await autoRun(p, { style: 'random', seed: 3, maxSteps: 120, stopWhen: async (q) => (await q.$('.r-band .r-kpi')) !== null });
    await p.waitForTimeout(400);
    const m = await p.evaluate(() => {
      const band = document.querySelector('.r-band'); const r = band.getBoundingClientRect(); const cs = getComputedStyle(band);
      const fs = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).fontSize : null; };
      const sizes = new Set(); band.querySelectorAll('*').forEach(e => { if (e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) sizes.add(getComputedStyle(e).fontSize); });
      return { html: getComputedStyle(document.documentElement).fontSize, top: r.top, bottom: r.bottom, height: r.height, position: cs.position,
        kpiSmall: fs('.r-band .r-kpi small'), kpiB: fs('.r-band .r-kpi b'), month: fs('.r-band .s-month b'), tabs: fs('.r-tabs button'),
        textSizes: [...sizes].sort((a, b) => parseFloat(a) - parseFloat(b)), docH: document.documentElement.scrollHeight };
    });
    await p.screenshot({ path: `${OUT}/band-${z}.png` });
    await p.evaluate(() => window.scrollTo(0, 400)); await p.waitForTimeout(200);
    const after = await p.evaluate(() => document.querySelector('.r-band').getBoundingClientRect().top);
    await p.screenshot({ path: `${OUT}/band-${z}-scrolled.png` });
    console.log(z + '%', JSON.stringify(m), 'スクロール400後の帯の上端', after, '外部への通信を止めた数', blocked);
    await b.close();
  }
})();
