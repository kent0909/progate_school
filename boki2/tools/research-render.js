// research-fetch.js --render から呼ばれる下請け。単独では使わない（robots.txt・規約・間隔・取得記録の検査は research-fetch が行う）。
// JavaScript で画面を組み立てるページを Chromium で描画し、描画後の HTML と、画面写真（PNG）を保存する。
// オーナーの承認（2026-10-30「足してよい」）。ログインが要る所には入らない（ログイン画面やCookieを使わない新しい文脈で開く）。
// 使い方：node research-render.js <url> <html の保存先> <png の保存先> <幅> <高さ> <全体を撮るか 0|1>
const [url, htmlOut, pngOut, w, h, full] = process.argv.slice(2);
const UA = 'boki2-quest-research (personal study design)';
(async () => {
  let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
  const b = await chromium.launch();
  const ctx = await b.newContext({ userAgent: UA, viewport: { width: +w || 1280, height: +h || 900 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  let status = 0;
  try {
    const r = await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    status = r ? r.status() : 0;
    await p.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
    // 遅れて読み込む画像を出すため、ゆっくり下まで送ってから上に戻す
    await p.evaluate(async () => { for (let y = 0; y < Math.min(document.body.scrollHeight, 20000); y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 250)); } window.scrollTo(0, 0); }).catch(() => null);
    await p.waitForTimeout(1500);
    require('fs').writeFileSync(htmlOut, await p.content());
    await p.screenshot({ path: pngOut, fullPage: full === '1' });
  } catch (e) { console.error('描画に失敗：' + e.message); }
  console.log(String(status));
  await b.close();
})();
