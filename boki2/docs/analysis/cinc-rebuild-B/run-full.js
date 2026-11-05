#!/usr/bin/env node
// 担当B（BRIEF-CINC-REBUILD）：既存の打ち手 auto.js を endMode 'y2' で呼び、プロローグから台本の終わり（4年目6月）または倒産まで通す。
// ゲームのファイルは変えない。外へは通信しない（localhost のサーバー以外はブラウザで拒否）。
// bot-runs.js は endMode 'slice'（1年目＋翌4月で止める）に固定されているので、同じ初期化（seedだけのv4保存・Math.random固定）でここから呼ぶ。
// 使い方：node run-full.js --style skilled --seed 0 [--strategy 1] [--choose '{"site":"ekimae"}'] [--out out/skilled-0.json]
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '../../..');           // boki2/
const autoRun = require(path.join(ROOT, 'tools/playtest/auto.js'));
const { initialSave } = require(path.join(ROOT, 'tools/playtest/bot-runs.js'));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const style = arg('--style', 'skilled'), seed = Number(arg('--seed', 0));
const strategy = arg('--strategy') != null ? Number(arg('--strategy')) : Math.floor(seed / 3) % 3;
const choose = JSON.parse(arg('--choose', '{}'));
const width = Number(arg('--width', 1280));
const tag = arg('--tag', '');
const out = path.resolve(arg('--out', path.join(__dirname, 'out', `${style}${tag}-${seed}-${strategy}.json`)));
const maxSteps = Number(arg('--max-steps', 8000));
async function serve() {
  const server = http.createServer((req, res) => {
    let f; try { f = path.resolve(ROOT, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); } catch { res.writeHead(400); res.end(); return; }
    if (!f.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end(); return; }
    try { const data = fs.readFileSync(f); res.setHeader('Content-Type', f.endsWith('.js') ? 'text/javascript; charset=utf-8' : f.endsWith('.css') ? 'text/css; charset=utf-8' : f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'); res.end(data); } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}
(async () => {
  const { chromium } = require('playwright');
  const { server, origin } = await serve();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', serviceWorkers: 'block', hasTouch: width < 1024, isMobile: width < 900 });
  await ctx.route('**/*', r => r.request().url().startsWith(origin + '/') ? r.continue() : r.abort());
  await ctx.addInitScript(({ save, seed }) => { localStorage.setItem('boki2sim.v4', JSON.stringify(save)); let n = seed >>> 0; Math.random = () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; }; }, { save: initialSave(seed), seed });
  const p = await ctx.newPage(); p.setDefaultTimeout(30000);
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.goto(origin + '/ramen.html');
  // 画面ごとの記録：判断（decision）・作戦の机（plan）・月報（rreport）・結末の画面に来たら、何が出ていたかを読む（読み出しのみ）
  const screens = [], seenKey = new Set();
  const onStep = async () => {
    const s = await p.evaluate(() => {
      const S = window.__sim.S, D = window.SIMDATA, ev = window.__sim.events()[S.ei], m = D.months[S.mi];
      if (!ev) return null;
      const key = `${S.mi}:${S.ei}:${ev.id}`;
      const text = () => ((document.querySelector('#sim') || {}).innerText || '');
      const base = { key, mi: S.mi, label: m && m.label, ramenT: m ? (m.ramenT == null ? null : m.ramenT) : null, t: ev.t, id: ev.id || null, card: ev.card || null };
      if (ev.t === 'plan') {
        const keys = [...new Set([...document.querySelectorAll('button[data-plan]')].map(x => x.dataset.plan))];
        // 月はじめの「作戦の机へ」の画面では手がまだ描かれていない。机が開いてから記録する
        if (!keys.length) return null;
        const enabled = keys.filter(k => document.querySelector(`button[data-plan="${k}"]:not([disabled])`));
        return { ...base, planKeys: keys, planEnabled: enabled, text: text() };
      }
      if (ev.t === 'decision') {
        const card = ev.card && D.cards.byId[ev.card];
        let money = null;
        try { if (card && S.W) money = card.options.map(o => { const tr = D.decide.trial(card, o.id, JSON.parse(JSON.stringify(S.W))); return [o.id, tr.cashMin, tr.cashMax]; }); } catch (e) { money = 'err:' + e.message; }
        return { ...base, q: ev.q || null, options: (ev.options || []).map(o => o.id), money, text: text() };
      }
      if (['rreport', 'ending', 'bank', 'report'].includes(ev.t)) return { ...base, text: text() };
      return { ...base };
    });
    if (s && !seenKey.has(s.key)) { seenKey.add(s.key); screens.push(s); }
  };
  const actions = [];
  let outcome;
  try {
    outcome = await autoRun(p, { style, seed, strategy, choose, endMode: 'y2', maxSteps, onStep, onAction: async a => { actions.push({ kind: a.kind, sel: a.sel, mi: a.before && a.before.mi, ev: a.before && a.before.ev, hands: a.after && a.after.hands }); } });
  } catch (e) { outcome = { error: e.message.split('\n')[0] }; }
  const final = await p.evaluate(() => {
    const S = window.__sim.S, D = window.SIMDATA, W = S.W;
    return { mi: S.mi, label: (D.months[S.mi] || {}).label, res: S.res, pols: S.pols, dealt: S.dealt, choices: S.choices, decisions: S.decisions, cardOutcomes: S.cardOutcomes,
      W: W ? { cash: W.cash, loan: W.loan, bankrupt: W.bankrupt, insolvent: W.insolvent, t: W.t, stores: W.stores.map(s => ({ id: s.id, area: s.area, open: s.open, parts: s.parts, family: s.family, price: s.price, R: s.R, L: s.L })), rivals: W.rivals.map(r => ({ id: r.id, name: r.name, type: r.type, open: r.open, closedAt: r.closedAt, price: r.price, cash: r.cash, area: r.area })), flags: { y2Build: W.flags.y2Build || null, omen: W.flags.omen || null, omenOpened: !!W.flags.omenOpened } } : null,
      months: D.months.map((m, i) => ({ i, label: m.label, ramenT: m.ramenT == null ? null : m.ramenT, year: m.year || null })) };
  });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ args: { style, seed, strategy, choose, width, maxSteps }, outcome, errors, screens, actions, final }));
  console.log(JSON.stringify({ out: path.basename(out), style, seed, strategy, outcome, errors: errors.length, reached: final.label, bankrupt: final.W && final.W.bankrupt, screens: screens.length }));
  await browser.close(); server.close();
})().catch(e => { console.error(e.stack); process.exit(1); });
