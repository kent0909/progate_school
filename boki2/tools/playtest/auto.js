// 遊びの検査（プレイテスト）の自動で進める部分。回帰テストの通しプレイ（scratchpad の play2.js）と同じ進め方。
// playtest-harness.js の auto() からだけ呼ぶ（ログに残すため）。正解を台本から読んで進める
module.exports = async function autoRun(p, { choose = {}, broad = false, endMode = 'y2', maxSteps = 400, stopWhen = null, onStep = null, shot: shotFn = null } = {}) {
  const errs = [];
  const shot = async (name) => { if (shotFn) await shotFn('auto-' + name); };
  const has = (s) => p.evaluate((s) => !!document.querySelector(s), s);
  let steps = 0, shotN = 0, endMode2 = false; const over = new Set(), seen = new Set(), wrong = { doc: false, disc: false, board: false };
  while (steps++ < maxSteps) {
    if (stopWhen && (await stopWhen(p))) return { steps, stopped: true };
    if (onStep) await onStep(steps);
    const st = await p.evaluate(() => { const S = window.__sim.S; const ev = window.__sim.events()[S.ei]; return { mi: S.mi, ei: S.ei, ev: ev ? { t: ev.t, id: ev.id } : null, ow: document.documentElement.scrollWidth > innerWidth + 1, label: (document.querySelector('.s-month b') || {}).textContent }; });
    if (st.ow) over.add(`${st.label}:${st.ei}`);
    if (await has('.s-ov')) { await p.click('.s-ov:last-of-type [data-close]'); continue; }
    if (await has('[data-again]')) { if (endMode === 'y2' && (await has('[data-n]'))) { await shot('end-y1'); await p.click('[data-n]'); continue; } await shot('end'); return { steps, end: true }; }
    const key = `${st.ev && st.ev.t}-${st.ev && st.ev.id}`;
    if ((st.ev && ['decision','ending','ifonly','bank'].includes(st.ev.t))) await shot(`${st.label}-${key}`);
    if (await has('[data-guess]')) { await p.click('[data-guess]'); continue; }
    if (await has('[data-rnext]')) { await p.click('[data-rnext]'); continue; }
    if (await has('[data-qn]')) { await p.click('[data-qn]'); continue; }
    if (await has('[data-sscheck]')) { await shot('ss'); await p.click('[data-sscheck]'); continue; }
    if (await has('[data-do]')) { await shot('duelist'); const n = (await p.$$('[data-do]')).length; for (let k = 0; k < n; k++) { const on = await p.$eval(`[data-do="${k}"]`, (x) => x.classList.contains('on')).catch(() => true); if (on) continue; await p.click(`[data-do="${k}"]`); if (!(await p.$('.s-react.ng'))) break; } continue; }
    if (await has('[data-dl]')) { await shot('duetable'); await p.click('[data-dl]'); continue; }
    if (await has('[data-acheck]')) { if (!(await p.$('.s-deskit.on'))) { await p.click('[data-ak] >> nth=0'); await p.click('[data-ak] >> nth=1'); continue; } await shot('audit'); await p.click('[data-acheck]'); continue; }
    if (await has('[data-afix]')) { await shot('audit-res'); await p.click('[data-afix]'); continue; }
    if (await has('[data-dkc]')) { const ids = await p.evaluate(() => { const ev = window.__sim.events()[window.__sim.S.ei]; return ev.items.filter((x) => x.need).map((x) => x.id); }); for (const id of ids) await p.click(`[data-dk="${id}"]`); await shot('desk'); await p.click('[data-dkc]'); await shot('desk-ok'); continue; }
    if (await has('[data-qq]')) { await p.click('[data-qq]'); continue; }
    if (await has('[data-rskip]')) { await p.click('[data-rskip]'); continue; }
    if (await has('[data-pc]')) { await p.click('[data-pc="up"]'); continue; }
    if (await has('[data-shall]')) { await shot('sheet'); await p.click('[data-shall]'); continue; }
    if (await has('[data-sh]')) { const to = await p.evaluate(() => { const t = document.querySelector('.s-sorti b').textContent; const c = (window.BOKI.accounts[t] || {}).cat; return c === '収益' || c === '費用' ? 'PL' : 'BS'; }); await p.click(`[data-sh="${to}"]`); continue; }
    if (await has('[data-ni]')) { await p.click('[data-ni="R"]'); continue; }
    if (await has('[data-fold]')) { await p.click('[data-fold]'); continue; }
    if (await has('[data-shdone]')) { await shot('sheet8'); await p.click('[data-shdone]'); continue; }
    if (await has('[data-op]')) { const to = await p.evaluate(() => { const t = document.querySelector('.s-sorti b').textContent; const c = (window.BOKI.accounts[t] || {}).cat; return /累計額$|^貸倒引当金$/.test(t) ? 'R' : c === '資産' ? 'L' : 'R'; }); await p.click(`[data-op="${to}"]`); continue; }
    if (await has('[data-oq]')) { await shot('opening'); await p.click('[data-oq="ok"]'); continue; }
    if (await has('[data-odone]')) { await p.click('[data-odone]'); continue; }
    if (await has('[data-clall]')) { await p.click('[data-clall]'); continue; }
    if (await has('[data-cl]')) { await p.click('[data-cl]'); continue; }
    if (await has('[data-ca]')) { if (broad && !wrong.cl) { wrong.cl = true; await p.click('[data-ca="cap"]'); continue; } await shot('closing'); await p.click('[data-ca="re"]'); continue; }
    if (await has('[data-cdone]')) { await shot('closing-name'); await p.click('[data-cdone]'); continue; }
    if (await has('[data-box]')) { const k = await p.evaluate(() => { const a = document.querySelector('[data-box]').dataset.acc; const c = (window.BOKI.accounts[a] || {}).cat; return /累計額$|^貸倒引当金$/.test(a) || c === '資産' ? 'A' : c === '負債' || c === '純資産' ? 'R' : c === '収益' ? 'I' : 'E'; }); await p.click(`[data-box="${k}"]`); continue; }
    if (await has('[data-join]')) { await shot('build'); await p.click('[data-join="R"]'); continue; }
    if (await has('[data-start]')) { await p.click('[data-start]'); continue; }
    if (await has('[data-pickmode]')) { await p.click('[data-pickmode] >> nth=0'); continue; }
    if (await has('[data-p3]')) { await p.click('[data-p3="no"] >> nth=0'); continue; }
    if (await has('[data-go2]')) { await p.click('[data-go2]'); continue; }
    if (await has('[data-lite]')) { await p.click('[data-lite]'); continue; }
    if (await has('[data-go]')) { await p.click('[data-go]'); continue; }
    // プロローグ
    if (await has('[data-tok]')) { await p.click('[data-tok]'); continue; }
    if (await has('[data-put]')) {
      const [tok, to] = await p.evaluate((w) => { const S = window.__sim.S; const ev = window.__sim.events()[S.ei]; const id = document.querySelector('[data-put]').dataset.put; const t = ev.steps.flatMap((s) => s.tokens || []).find((x) => x.id === id); return [id, w ? (t.ok === 'R1' ? 'R0' : 'R1') : t.ok]; }, !wrong.board);
      if (!wrong.board) { wrong.board = true; await p.click(`[data-put="${tok}"][data-to="${to}"]`); await shot('board-wrong'); continue; }
      await p.click(`[data-put="${tok}"][data-to="${to}"]`); continue;
    }
    if (await has('[data-ask]')) { const k = await p.evaluate(() => { const S = window.__sim.S; const ev = window.__sim.events()[S.ei]; const st = ev.steps.find((s) => s.k === 'note'); const [li] = document.querySelector('[data-ask]').dataset.ask.split('-').map(Number); return `${li}-${st.lines[li].ask.opts.findIndex((o) => o.ok)}`; }); await p.click(`[data-ask="${k}"]`); continue; }
    if (await has('[data-note]')) {
      const [k, side] = await p.evaluate(() => { const S = window.__sim.S; const ev = window.__sim.events()[S.ei]; const n = document.querySelector('[data-note]'); const [li, ci] = n.dataset.note.split('-').map(Number); const st = ev.steps.find((s) => s.k === 'note'); return [n.dataset.note, st.lines[li].cards[ci].side]; });
      await p.click(`[data-note="${k}"][data-side="${side}"]`); continue;
    }
    if (await has('[data-step]')) { await p.click('[data-step]'); continue; }
    if (await has('[data-fin]')) { await p.click('[data-fin]'); continue; }
    if (!(await has('.s-disc')) && (await has('.s-opts [data-pick]'))) { await p.click('[data-pick="100"]'); continue; }
    // 名前の札
    if (await has('[data-o]')) { const i = await p.evaluate(() => { const q = document.querySelector('.s-q').textContent; const all = [...Object.values(window.SIMDATA.namings), ...Object.values(window.SIMDATA.kindIntro)]; return all.find((n) => n.q === q).opts.findIndex((o) => o.ok); }); await p.click(`[data-o="${i}"]`); continue; }
    // 自動仕訳ルール
    if (await has('[data-cond]')) {
      const idx = await p.evaluate((broad) => { const R = Object.values(window.SIMDATA.rules).find((r) => document.querySelector('h3').textContent.includes(`「${r.label}」`)); const isBuy = R.label === '商品の掛け仕入れ'; return { bad: R.conds.findIndex((c) => !c.ok), good: R.conds.findIndex((c) => c.ok && (broad && isBuy ? c.broad : !c.broad)) }; }, broad);
      if (idx.bad >= 0 && !(await has('.s-react.ng'))) { await p.click(`[data-cond="${idx.bad}"]`); continue; }
      await p.click(`[data-cond="${idx.good}"]`); continue;
    }
    // 判断
    if (await has('[data-yes]')) { await p.click('[data-yes]'); continue; }
    if (await has('[data-opt]')) { const id = (endMode2 && st.ev.id === 'crunch' ? 'loan' : choose[st.ev.id]) || await p.evaluate(() => document.querySelector('[data-opt]').dataset.opt); await p.click(`[data-opt="${id}"]`); continue; }
    // 結末・もしも
    if (await has('[data-chk]') && !(await has('[data-en]')) && !(await has('[data-cont]')) && !(await has('[data-restart]')) && !(await has('[data-back-view]'))) { const k = await p.evaluate(() => { const ttl = document.querySelector('.s-ending h3').textContent; const E = Object.values(window.SIMDATA.endings).find((x) => x.title === ttl); return E.check.opts.findIndex((o) => o.ok); }); await p.click(`[data-chk="${k}"]`); continue; }
    if (await has('[data-en]')) { if (await has('[data-mark]')) { await p.click('[data-mark]'); } await p.click('[data-en]'); continue; }
    if (await has('[data-restart]')) { await shot('final'); if (endMode === 'bm') { await p.click('[data-bm]'); endMode2 = true; continue; } return { steps, end: true }; }
    if (await has('[data-cont]')) { await p.click('[data-cont]'); continue; }
    if (await has('[data-back-view]')) { await p.click('[data-back-view]'); continue; }
    if (await has('[data-if]') && !(await has('.s-seen'))) { await p.click('[data-if]'); continue; }
    // 月末
    if (await has('[data-next]')) { await p.click('[data-next]'); continue; }
    if (await has('[data-fix]')) { await shot('close-ng'); await p.click('[data-fix]'); continue; }
    // 記帳
    if (await has('[data-redo]')) { await shot('doc-coach-ng'); await p.click('[data-redo]'); }
    if (await has('.s-check.good [data-n]')) { await p.click('.s-check.good [data-n]'); continue; }
    if (await has('.s-ask')) {
      const fix = await has('.s-fix');
      const truth = await p.evaluate((fix) => {
        const S = window.__sim.S; const evs = window.__sim.events(); let ev = evs[S.ei];
        if (fix) { const t = document.querySelector('.s-doc-head b').textContent, d = document.querySelector('.s-doc-head span').textContent; ev = evs.find((e) => e.t === 'doc' && e.doc.title === t && e.doc.date === d); }
        const a = typeof ev.ans === 'function' ? ev.ans(S) : ev.ans; return { dr: a.dr, cr: a.cr, id: ev.id };
      }, fix);
      let entry = truth;
      if (!wrong.doc && truth.id === 'sal5' && !(await has('.s-check'))) { wrong.doc = true; entry = { dr: [['売上', 30000]], cr: [['普通預金', 30000]] }; }
      for (const s of ['dr', 'cr']) {
        for (let i = 0; i < entry[s].length; i++) {
          let n = await p.locator(`select[data-s="${s}"]`).count();
          while (n <= i) { await p.click(`[data-add="${s}"]`); n = await p.locator(`select[data-s="${s}"]`).count(); }
          await p.selectOption(`select[data-s="${s}"][data-i="${i}"]`, entry[s][i][0]);
          await p.fill(`input[data-s="${s}"][data-i="${i}"]`, String(entry[s][i][1]));
        }
        const n = await p.locator(`select[data-s="${s}"]`).count();
        for (let i = entry[s].length; i < n; i++) { await p.selectOption(`select[data-s="${s}"][data-i="${i}"]`, ''); await p.fill(`input[data-s="${s}"][data-i="${i}"]`, ''); }
      }
      await p.click('[data-ok]'); continue;
    }
    // 発見
    if (await has('.s-disc')) {
      const ev = await p.evaluate(() => { const S = window.__sim.S; let e = window.__sim.events()[S.ei]; if (typeof e.dynamic === "function") e = e.dynamic(S, e); return { layout: e.b2.layout, targets: e.b2.targets.map((t) => ({ id: t.id, ok: t.ok })), tokens: typeof e.b2.tokens === 'function' ? e.b2.tokens(S) : e.b2.tokens, reasons: e.b2.reasons.map((r) => r.ok) }; });
      if (await has('[data-b="p"]')) { await p.click('[data-b="p"]'); continue; }
      if (await has('[data-b="2"]') && !(await has('[data-decide]'))) { await p.click('[data-b="2"]'); continue; }
      if (await has('[data-decide]')) {
        const w = !wrong.disc; wrong.disc = true;
        if (ev.layout === 'sort' || ev.layout === 'flow') for (const t of ev.tokens) await p.click(`[data-sort="${t.id}"][data-to="${t.target}"]`);
        else await p.click(`[data-pick="${ev.targets.find((t) => t.ok).id}"]`);
        await p.click(`[data-reason="${w ? ev.reasons.indexOf(false) : ev.reasons.indexOf(true)}"]`);
        await p.click('[data-decide]'); continue;
      }
      if (await has('[data-retry]')) { await p.click('[data-retry]'); continue; }
      if (await has('[data-b="4"]')) { await p.click('[data-b="4"]'); continue; }
      if (await has('[data-done]')) { await p.click('[data-done]'); continue; }
    }
    // 腕だめし
    if (await has('[data-nextq]')) { await p.click('[data-nextq]'); continue; }
    if (await has('[data-check]')) {
      const q = await p.evaluate(() => { const txt = document.querySelector('.s-q').textContent; const q = window.BOKI.chapters.flatMap((c) => c.qs).find((x) => { const d = document.createElement('div'); d.innerHTML = x.q; return d.textContent === txt; }); return q.ans; });
      for (const s of ['dr', 'cr']) for (let i = 0; i < q[s].length; i++) { await p.selectOption(`select[data-s="${s}"][data-i="${i}"]`, q[s][i][0]); await p.fill(`input[data-s="${s}"][data-i="${i}"]`, String(q[s][i][1])); }
      await p.click('[data-check]'); continue;
    }
    if (await has('[data-n]')) { await p.click('[data-n]'); continue; }
    return { steps, stuck: st };
  }
  return { steps, maxed: true };
};
