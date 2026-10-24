// 遊びの検査（プレイテスト）の自動で進める部分。回帰テストの通しプレイ（scratchpad の play2.js）と同じ進め方。
// playtest-harness.js の auto() からだけ呼ぶ（ログに残すため）。正解を台本から読んで進める
module.exports = async function autoRun(page, { choose = {}, broad = false, endMode = 'y2', maxSteps = 400, stopWhen = null, onStep = null, onAction = null, style = null, seed = 0, strategy = Math.floor(seed / 3) % 3, errorRate = 0, shot: shotFn = null } = {}) {
  if (style != null && !['idle', 'random', 'skilled'].includes(style)) throw new Error('打ち方が不正');
  if (!(errorRate >= 0 && errorRate <= 1) || !Number.isInteger(seed) || ![0, 1, 2].includes(strategy)) throw new Error('seed・strategy・誤答率が不正');
  const rng = seeded(seed), errorsRng = seeded(seed ^ 0x5f3759df), attempted = new Set();
  const miss = (key) => { if (attempted.has(key)) return false; attempted.add(key); return errorsRng() < errorRate; };
  // 操作は Playwright の通常の click/fill/select のみ。evaluate は台本と状態の読み出し専用。
  let presence = null;
  const p = new Proxy(page, { get(target, key) {
    if (key === 'click') return async (sel, ...args) => {
      const kind = actionKind(sel), before = kind && onAction ? await actionState(target) : null;
      const r = await target.click(sel, ...args);
      presence = null;
      if (kind && onAction) await onAction({ kind, sel, before, after: await actionState(target) });
      return r;
    };
    const v = target[key]; return typeof v === 'function' ? v.bind(target) : v;
  } });
  const plans = new Set();
  const plan = async (st) => {
    const key = `${st.mi}:${st.ei}`;
    if (plans.has(key)) return;
    plans.add(key);
    const base = await p.evaluate(() => { const s = window.__sim.S, e = window.__sim.events()[s.ei]; return { pol: window.SIMDATA.ramen.policy(JSON.parse(JSON.stringify(s)), e.ramenT), W: s.W }; });
    const desired = style === 'skilled' ? await p.evaluate(smartPolicy, strategy) : null;
    const keys = await p.$$eval('button[data-plan]', xs => [...new Set(xs.map(x => x.dataset.plan))]);
    // 時間を使わない手を先に戻し、そのあと smartX の優先順に付ける。
    const order = desired ? keys.sort((a,b) => Number(Boolean(desired[a])) - Number(Boolean(desired[b]))) : keys;
    for (const k of order) {
      const details = p.locator('[data-plan-more]');
      if (await details.count() && (await details.getAttribute('open')) === null) await p.click('[data-plan-more] > summary');
      const opts = await p.$$eval(`button[data-plan="${k}"]:not([disabled])`, xs => xs.map(x => ({ v:x.dataset.opt, on:x.classList.contains('on') })));
      if (!opts.length) continue;
      let v;
      if (style === 'random') v = opts[Math.floor(rng()*opts.length)].v;
      else {
        const want = k === 'price' ? desired.price-base.pol.price : k === 'staff' ? desired.parts-base.pol.parts : desired[k];
        if (k === 'price' || k === 'staff') v = [...opts].sort((a,b)=>Math.abs(+a.v-want)-Math.abs(+b.v-want))[0].v;
        else v = opts.find(o=>o.v===String(want))?.v;
      }
      if (v == null || opts.find(o=>o.v===v)?.on) continue;
      await p.click(`button[data-plan="${k}"][data-opt="${v}"]`);
      if (await has('[data-bowl-tweak]')) await bowl(true);
    }
  };
  const bowl = async (tweak = false) => {
    if (style === 'random' || (style === 'skilled' && tweak)) {
      const keys = tweak ? ['noodle'] : ['noodle','src','soup','top'];
      for (const k of keys) {
        const opts = await p.$$eval(`button[data-bowl="${k}"][data-v]`, xs=>xs.map(x=>({v:x.dataset.v,on:x.getAttribute('aria-pressed')==='true'})));
        const candidates = tweak ? opts.filter(x=>!x.on) : opts;
        if (!candidates.length) continue;
        const target = candidates[style === 'random' ? Math.floor(rng()*candidates.length) : 0];
        // top は複数選択。1つ外してから足し、上限を越えない。
        if (k==='top' && !target.on && opts.filter(x=>x.on).length>=3) await p.click(`button[data-bowl="top"][data-v="${opts.find(x=>x.on).v}"]`);
        if (!target.on || k==='top') await p.click(`button[data-bowl="${k}"][data-v="${target.v}"]`);
      }
    }
    await p.click(tweak ? (style === 'idle' ? '[data-bowl-cancel]' : '[data-bowl-tweak]') : '[data-bowl-ok]');
  };
  const debrief = async () => {
    const q = await p.evaluate(() => { const s=window.__sim.S, t=window.SIMDATA.months[s.mi].ramenT, id=document.querySelector('[data-deb-factor]:not([disabled]),[data-deb-opt]:not([disabled])').closest('[data-deb]').dataset.deb; return window.SIMDATA.rview.debrief(s,t).qs.find(x=>String(x.id)===id); });
    const bad = miss(`deb:${stKey}:${q.id}`), options=q.opts.filter(o=>bad ? o.id!==q.ans : q.ans==null || o.id===q.ans);
    const id=options[style==='random' && q.ans==null ? Math.floor(rng()*options.length) : 0].id;
    await p.click(`[data-deb-${q.kind==='factor'?'factor':'opt'}="${id}"]:not([disabled])`);
  };
  let stKey = '';

  const errs = [];
  const shot = async (name) => { if (shotFn) await shotFn('auto-' + name); };
  const has = async (s) => {
    if (!presence) presence = await p.evaluate(sels => Object.fromEntries(sels.map(s => [s, !!document.querySelector(s)])), SELECTORS);
    return s in presence ? presence[s] : p.evaluate(s => !!document.querySelector(s), s);
  };
  let steps = 0, shotN = 0, endMode2 = false; const over = new Set(), seen = new Set(), wrong = { doc: false, disc: false, board: false };
  while (steps++ < maxSteps) {
    presence = null;
    if (stopWhen && (await stopWhen(p))) return { steps, stopped: true, overflow: [...over] };
    if (onStep) await onStep(steps);
    const st = await p.evaluate(() => { const S = window.__sim.S; const ev = window.__sim.events()[S.ei]; return { mi: S.mi, ei: S.ei, ev: ev ? { t: ev.t, id: ev.id } : null, ow: document.documentElement.scrollWidth > innerWidth + 1, label: (document.querySelector('.s-month b') || {}).textContent }; });
    stKey = `${st.mi}:${st.ei}`;
    if (st.ow) over.add(`${st.label}:${st.ei}`);
    if (await has('.s-ov')) { await p.click('.s-ov:last-of-type [data-close]'); continue; }
    if (await has('[data-again]')) { if (endMode === 'y2' && (await has('[data-n]'))) { await shot('end-y1'); await p.click('[data-n]'); continue; } await shot('end'); return { steps, end: true, overflow: [...over] }; }
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
    // ラーメン版（ramen.html）：屋号と名前・作戦の机（仮）・月報（仮）・計算の作業台
    if (await has('[data-nameok]')) { await p.click('[data-nameok]'); continue; }
    if (await has('[data-plan-ok]')) { if (style && style !== 'idle') await plan(st); await shot(`plan-${st.label}`); await p.click(style === 'idle' || choose.plan === 'same' ? '[data-plan-same]' : '[data-plan-ok]'); continue; }
    if (await has('[data-rep-ok]')) { await shot(`report-${st.label}`); await p.click('[data-rep-ok]'); continue; }
    // ラーメン版の段5の画面：締めの帯・一杯の組み立て・ふりかえり（四半期は4問と今の位置）・分かれ道の図（正解は台本から読まずに、最初の選択肢を押す）
    if (await has('[data-band-next]')) { await shot(`band-${st.label}`); await p.click('[data-band-next]'); continue; }
    if (await has('[data-bowl-ok]')) { await shot('bowl'); await bowl(); continue; }
    if (await has('[data-bowl-tweak]')) { await bowl(true); continue; }
    if (style && await has('[data-deb-factor]:not([disabled]),[data-deb-opt]:not([disabled])')) { await debrief(); continue; }
    if (await has('[data-deb-factor]:not([disabled])')) { await p.click((choose.debrief ? `[data-deb-factor="${choose.debrief}"]` : '[data-deb-factor]:not([disabled])') + ' >> nth=0'); continue; }
    if (await has('[data-deb-opt]:not([disabled])')) { await p.click('[data-deb-opt]:not([disabled]) >> nth=0'); continue; }
    if (await has('[data-deb-next]')) { await shot(`debrief-${st.label}`); await p.click('[data-deb-next]'); continue; }
    if (await has('[data-fork-next]')) { await shot(`fork-${st.label}`); await p.click('[data-fork-next]'); continue; }
    if (await has('[data-calc-next]')) { await p.click('[data-calc-next]'); continue; }
    if (await has('[data-calc-in]')) { const v = await p.evaluate(() => { const S = window.__sim.S; const ev = window.__sim.events()[S.ei]; return Math.round(Number(typeof ev.answer === 'function' ? ev.answer(S) : ev.answer)); }); await p.fill('[data-calc-in]', String(v + (miss(`calc:${stKey}`) ? 1 : 0))); await p.click('[data-calc-ok]'); continue; }
    if (await has('[data-pickmode]')) { await p.click('[data-pickmode] >> nth=0'); continue; }
    if (await has('[data-p3]')) { await p.click('[data-p3="no"] >> nth=0'); continue; }
    if (await has('[data-go2]')) { await p.click('[data-go2]'); continue; }
    if (await has('[data-lite]')) { await p.click('[data-lite]'); continue; }
    if (await has('[data-go]')) { await p.click('[data-go]'); continue; }
    // プロローグ
    if (await has('[data-tok]')) { await p.click('[data-tok]'); continue; }
    if (await has('[data-put]')) {
      const [tok, to] = await p.evaluate((w) => { const S = window.__sim.S; const ev = window.__sim.events()[S.ei]; const id = document.querySelector('[data-put]').dataset.put; const t = ev.steps.flatMap((s) => s.tokens || []).find((x) => x.id === id); return [id, w ? (t.ok === 'R1' ? 'R0' : 'R1') : t.ok]; }, style ? miss(`board:${stKey}:${await p.getAttribute('[data-put]', 'data-put')}`) : !wrong.board);
      if (!style && !wrong.board) { wrong.board = true; await p.click(`[data-put="${tok}"][data-to="${to}"]`); await shot('board-wrong'); continue; }
      await p.click(`[data-put="${tok}"][data-to="${to}"]`); continue;
    }
    if (await has('[data-ask]')) { const k = await p.evaluate(() => { const S = window.__sim.S; const ev = window.__sim.events()[S.ei]; const st = ev.steps.find((s) => s.k === 'note'); const [li] = document.querySelector('[data-ask]').dataset.ask.split('-').map(Number); return `${li}-${st.lines[li].ask.opts.findIndex((o) => o.ok)}`; }); await p.click(`[data-ask="${k}"]`); continue; }
    if (await has('[data-note]')) {
      const [k, side] = await p.evaluate(() => { const S = window.__sim.S; const ev = window.__sim.events()[S.ei]; const n = document.querySelector('[data-note]'); const [li, ci] = n.dataset.note.split('-').map(Number); const st = ev.steps.find((s) => s.k === 'note'); return [n.dataset.note, st.lines[li].cards[ci].side]; });
      await p.click(`[data-note="${k}"][data-side="${side}"]`); continue;
    }
    if (await has('[data-step]')) { await p.click('[data-step]'); continue; }
    if (await has('[data-fin]')) { await p.click('[data-fin]'); continue; }
    if (!(await has('.s-disc')) && (await has('.s-opts [data-pick]'))) { await p.click((await has('[data-pick="100"]')) ? '[data-pick="100"]' : '.s-opts [data-pick] >> nth=0'); continue; }
    // 名前の札
    if (await has('[data-o]')) { const i = await p.evaluate(() => { const q = document.querySelector('.s-q').textContent; const all = [...Object.values(window.SIMDATA.namings), ...Object.values(window.SIMDATA.kindIntro)]; return all.find((n) => n.q === q).opts.findIndex((o) => o.ok); }); await p.click(`[data-o="${i}"]`); continue; }
    // 自動仕訳ルール
    if (await has('[data-cond]')) {
      const idx = await p.evaluate((broad) => { const R = Object.values(window.SIMDATA.rules).find((r) => document.querySelector('h3').textContent.includes(`「${r.label}」`)); const isBuy = R.label === '商品の掛け仕入れ'; return { bad: R.conds.findIndex((c) => !c.ok), good: R.conds.findIndex((c) => c.ok && (broad && isBuy ? c.broad : !c.broad)) }; }, broad);
      if (!style && idx.bad >= 0 && !(await has('.s-react.ng'))) { await p.click(`[data-cond="${idx.bad}"]`); continue; }
      await p.click(`[data-cond="${idx.good}"]`); continue;
    }
    // 判断
    if (await has('[data-yes]')) { await p.click('[data-yes]'); continue; }
    if (await has('[data-opt]')) {
      const opts = await p.$$eval('button[data-opt]:not([disabled])', xs=>xs.map(x=>x.dataset.opt));
      let id = (endMode2 && st.ev.id === 'crunch' ? 'loan' : choose[st.ev.id]);
      if (!id && style === 'idle' && st.ev.id === 'supplier') id = 'std';
      if (!id && style === 'idle') id = await p.evaluate(() => {
        const s=window.__sim.S,e=window.__sim.events()[s.ei];
        if(!e.card) return null;
        const o=e.options.find(o=>/^(keep|no|none|skip|wait|decline|small|one|lunch)$/.test(o.id) || /据え置|しない|断る|見送|そのまま|今まで|いつもどおり/.test(o.label));
        return o?.id || null;
      });
      if (!id && style === 'random') id = opts[Math.floor(rng()*opts.length)];
      if (!id && style === 'skilled') id = await p.evaluate(({id,strategy}) => {
        const D=window.SIMDATA, S=window.__sim.S;
        if (id==='sign') { const C=D.coef, cash=C('ownCash')+C('loan')-C('fitout')-C('deposit')-C('equipOpen'); return cash>2000000?'large':cash>1000000?'small':'none'; }
        if(id==='supplier') return strategy===1?'high':'std';
        const opening={site:'shotengai',form:'part1',openloan:'read'};
        return opening[id] || null;
      }, {id:st.ev.id,strategy});
      // smartX が札の選び方を定めていない所は既存の先頭選択を保ち、ログに残す。
      await p.click(`[data-opt="${id || opts[0]}"]`); continue;
    }
    // 結末・もしも
    if (await has('[data-chk]') && !(await has('[data-en]')) && !(await has('[data-cont]')) && !(await has('[data-restart]')) && !(await has('[data-back-view]'))) { const k = await p.evaluate(() => { const ttl = document.querySelector('.s-ending h3').textContent; const E = Object.values(window.SIMDATA.endings).find((x) => x.title === ttl); return E.check.opts.findIndex((o) => o.ok); }); await p.click(`[data-chk="${k}"]`); continue; }
    if (await has('[data-en]')) { if (await has('[data-mark]')) { await p.click('[data-mark]'); } await p.click('[data-en]'); continue; }
    if (await has('[data-restart]')) { await shot('final'); if (endMode === 'bm') { await p.click('[data-bm]'); endMode2 = true; continue; } return { steps, end: true, overflow: [...over] }; }
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
      if (!style && !wrong.doc && truth.id === 'sal5' && !(await has('.s-check'))) { wrong.doc = true; entry = { dr: [['売上', 30000]], cr: [['普通預金', 30000]] }; }
      if (style && !fix && miss(`doc:${stKey}:${truth.id}`)) { entry = JSON.parse(JSON.stringify(truth)); entry.dr[0][1] += 1; }
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
        const w = style ? miss(`disc:${stKey}`) : !wrong.disc; wrong.disc = true;
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
    return { steps, stuck: st, overflow: [...over] };
  }
  return { steps, maxed: true, overflow: [...over] };
};


// 同じseedは打ち方の乱数も同じ。ゲーム内の乱数とは独立。
function seeded(seed) { let n=seed>>>0; return () => { n=(Math.imul(n,1664525)+1013904223)>>>0; return n/4294967296; }; }
function actionKind(sel) {
  if (/data-plan(?:[=\] -])/.test(sel)) return 'plan';
  if (/data-bowl|data-name-chip/.test(sel)) return 'bowl';
  if (/data-opt|data-yes/.test(sel)) return 'decision';
  if (/data-deb/.test(sel)) return 'debrief';
  if (/data-rep-|data-band-next/.test(sel)) return 'report';
  if (/data-fork/.test(sel)) return 'fork';
  return null;
}
async function actionState(page) { return page.evaluate(() => {
  const S=window.__sim.S, ev=window.__sim.events()[S.ei];
  return { mi:S.mi, ei:S.ei, ev:ev ? `${ev.t}:${ev.id || ''}` : null,
    choices:JSON.parse(JSON.stringify(S.choices || [])), decisions:{...S.decisions},
    hands:[...document.querySelectorAll('button[data-plan].on')].map(x=>({hand:x.dataset.plan,value:x.dataset.opt})),
    bowl:[...document.querySelectorAll('button[data-bowl][aria-pressed="true"]')].map(x=>({part:x.dataset.bowl,value:x.dataset.v})),
    bowlSpec:S.bowlSpec || null, pols:S.pols || {}, f4:S.f4 || [] };
}); }
// sim-ramen.js smartX の3方針を、画面で開いている手へ写す前の希望値として計算。
// 結果を見て探索・調整しない。worldは複製してから渡す。
function smartPolicy(strategy) {
  const D=window.SIMDATA, W=JSON.parse(JSON.stringify(window.__sim.S.W)), WD=D.world;
  const p=WD.policy0(W,null,{neutral:true}), y=Math.min(4,Math.floor(W.t/12));
  p.price=[[800,850,950,1000,1000],[850,900,1000,1000,1050],[750,800,900,950,950]][strategy][y];
  p.parts=W.stores[0].parts; p.family=0; p.line=true; p.prep='mid'; p.flyer=[30000,0,100000][strategy];
  if(W.t>=12 && W.stores[0].Nlast>0.9*WD.capOf(W.stores[0]) && W.cash>1500000 && p.parts<3) p.parts++;
  const order=[['map','haccp','forecast','tweak','sns'],['haccp','tweak','map','forecast','inspect'],['map','sns','haccp','forecast','tweak']][strategy];
  for(const k of WD.TIME_KEYS) p[k]=false;
  for(const k of order) { p[k]=k!=='tweak'||WD.canTweak(W); if(WD.timeUsed(W,p)>WD.timeBudget(W,p)) p[k]=false; }
  p.supplier=strategy===1 || (strategy===0 && W.t>=12)?'high':'std';
  return WD.fitTime(W,p,D.rng(W.seed*37+W.t));
}
module.exports.seeded=seeded;
module.exports.actionKind=actionKind;
module.exports.actionState=actionState;

// 画面ごとの存在確認をまとめて読み、クリックのたびに破棄する（状態の書き換えはしない）。
const SELECTORS = [...new Set([...require('fs').readFileSync(__filename, 'utf8').matchAll(/has\('([^']+)'\)/g)].map(x => x[1]))];
