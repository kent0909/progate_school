// 論証の検査（BIZ-UIREF 版3）：P8・K1 の「数は残し、既定の100%のまま帯の字を14px 以上に」を、
// 並びを変えずにそのまま当てると帯がどれだけ伸びるかを測る（J2 の uiref-audit2-J2-band.js と同じ手順で帯を出す）。
// 100% のまま、帯の中で字を持つ要素のうち計算後の字が14px 未満のものを14px にし（大きい物はそのまま）、帯の高さを測る。
// 並び（列の数・折り返し）を作り直したときの高さではない。「数を残して字だけ上げる」最小の形の目安。外部への通信はしない（file://）。
// 使い方: node boki2/docs/audit/uiref-reasoning-band14.js <リポジトリの根>
const { chromium } = require('playwright');
const B = process.argv[2];
const autoRun = require(B + '/boki2/tools/playtest/auto.js');
(async () => {
  for (const floor of [0, 12, 14, 16]) {
    const b = await chromium.launch();
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    let blocked = 0; await p.route(/^(?!file:)/, r => { blocked++; r.abort(); });
    await p.goto('file://' + B + '/boki2/ramen.html'); await p.waitForTimeout(600);
    await autoRun(p, { style: 'random', seed: 3, maxSteps: 120, stopWhen: async (q) => (await q.$('.r-band .r-kpi')) !== null });
    await p.waitForTimeout(400);
    const m = await p.evaluate((floor) => {
      const band = document.querySelector('.r-band');
      let raised = 0;
      if (floor > 0) {
        const els = [...band.querySelectorAll('*')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
        const before = els.map(e => parseFloat(getComputedStyle(e).fontSize));
        els.forEach((e, i) => { if (before[i] < floor) { e.style.setProperty('font-size', floor + 'px', 'important'); raised++; } });
      }
      const r = band.getBoundingClientRect();
      const ell = [...band.querySelectorAll('*')].filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').length;
      return { height: Math.round(r.height * 10) / 10, pct: Math.round(r.height / 844 * 1000) / 10, position: getComputedStyle(band).position, raised, clipped: ell };
    }, floor);
    console.log(`下限 ${floor || 'なし（いまのまま）'}px`, JSON.stringify(m), '外部への通信を止めた数', blocked);
    await b.close();
  }
})();
