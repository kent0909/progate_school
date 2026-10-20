// 成長の記録。試験範囲（scope.js）の項目ごとに、いまの段階・得意か苦手か・確かめどきを出し、
// 月末の締めや腕だめしのたびに段階の数を記録して、時間とともにどう伸びたかを見せる。
// 段階：0 まだ／1 会社で起きた／2 自分でできた／3 本試験の文でも書けた／4 日をあけても書けた
// ゲームの判定（engine.js の scopeState）をそのまま使い、点数や順位は出さない（docs/DESIGN-REVISION.md 4章）。
(function (g) {
  const B = (g.BOKI = g.BOKI || {});
  const G = (B.growth = {});
  const DAY = 864e5;
  const LV = ['まだ', '会社で起きた', '自分でできた', '本試験の文でも書けた', '日をあけても書けた'];
  G.LV = LV;
  const inRange = (it) => it.y27 !== 'out';

  // 1項目の状態と、記帳・腕だめしの記録
  G.item = (api, it) => {
    const S = api.S(), st = api.scopeState(it);
    const x = it.sim || {}, docs = x.docs || [], kinds = x.kinds || [];
    const tries = S.docLog.filter((l) => docs.includes(l.ev) || kinds.includes(l.kind));
    const fixes = S.fixLog.filter((f) => docs.includes(f.ev) || kinds.includes(f.kind)).length;
    const exams = S.examLog.filter((l) => (it.q || []).includes(l.key) || (B.examScope && (B.examScope[l.key] || []).includes(it.id)));
    const lv = st.exam === 'exam2' ? 4 : st.exam === 'exam1' ? 3 : st.own ? 2 : st.met != null ? 1 : 0;
    const okRate = tries.length ? tries.filter((l) => l.ok).length / tries.length : null;
    const lastExamOk = exams.filter((l) => l.ok).map((l) => l.t).sort().pop() || null;
    return { it, st, lv, tries: tries.length, okRate, fixes, exams: exams.length, examMiss: exams.filter((l) => !l.ok).length, lastExamOk };
  };
  G.all = (api) => B.scope.filter(inRange).map((it) => G.item(api, it));

  // 得意・苦手・確かめどき（理由つき）
  G.judge = (r, now) => {
    const why = [];
    if (r.st.shaky) why.push('月末に直した。次に同じ書類が来たときに1回目で書けるか');
    if (r.st.exam === 'miss') why.push('本試験の文で間違えた');
    if (r.tries >= 2 && r.okRate != null && r.okRate < 0.6) why.push(`記帳の1回目の正しさが${Math.round(r.okRate * 100)}%`);
    const weak = why.length > 0;
    const strong = !weak && r.lv >= 2 && r.fixes === 0;
    const due = r.lv === 3 && r.lastExamOk && now - r.lastExamOk >= 7 * DAY ? '本試験の文で書けてから7日たった。もう一度解けたら定着' : r.st.shaky ? '次に同じ種類の書類が来たら確かめどき' : null;
    return { weak, strong, why, due };
  };

  // 段階ごとの数（全体・まとまりごと）
  G.counts = (rows) => { const c = [0, 0, 0, 0, 0]; rows.forEach((r) => c[r.lv]++); return c; };

  // 記録：段階の数が変わったときだけ、時刻とゲームの月と一緒に残す
  G.snapshot = (api, why) => {
    const S = api.S();
    S.growth = S.growth || [];
    const rows = G.all(api);
    const lv = {}; rows.forEach((r) => { if (r.lv) lv[r.it.id] = r.lv; });
    const prev = S.growth[S.growth.length - 1];
    if (prev && JSON.stringify(prev.lv) === JSON.stringify(lv)) return false;
    S.growth.push({ t: Date.now(), mi: S.mi, why: why || '', lv });
    if (S.growth.length > 200) S.growth.splice(1, S.growth.length - 200);
    return true;
  };

  // 画面
  G.view = (api) => {
    const S = api.S(), esc = api.esc, now = Date.now();
    const rows = G.all(api).map((r) => Object.assign(r, G.judge(r, now)));
    const met = rows.filter((r) => r.lv > 0);
    if (!met.length) return '<h3>成長の記録</h3><p>会社で何かが起きると、ここに試験範囲のどこまで進んだかが残っていく。</p>';
    const bar = (c, total) => `<div class="s-gbar" role="img" aria-label="${LV.map((w, i) => `${w} ${c[i]}`).join('、')}">${[4, 3, 2, 1].map((i) => (c[i] ? `<span class="lv${i}" style="flex:${c[i]}"></span>` : '')).join('')}<span class="lv0" style="flex:${Math.max(0, total - c[1] - c[2] - c[3] - c[4])}"></span></div>`;
    const legend = `<div class="s-glegend">${[4, 3, 2, 1].map((i) => `<span><i class="lv${i}"></i>${esc(LV[i])}</span>`).join('')}<span><i class="lv0"></i>まだ</span></div>`;
    // まとまり（土台・商業・工業）と、その中の区分
    const areas = B.scopeAreas.map((a) => {
      const list = rows.filter((r) => a.secs.includes(r.it.sec));
      const secs = a.secs.map((sec) => { const l = list.filter((r) => r.it.sec === sec); const c = G.counts(l); return c.slice(1).some(Boolean) ? `<div class="s-gsec"><span>${esc(sec)}</span>${bar(c, l.length)}</div>` : ''; }).join('');
      const c = G.counts(list);
      return `<section class="s-garea"><h4>${esc(a.label)} <small>${c[2] + c[3] + c[4]} / ${list.length} 項目を自分でできた</small></h4>${bar(c, list.length)}${secs}</section>`;
    }).join('');
    const li = (r, extra) => `<li><b>${esc(r.it.name)}</b>${extra ? `<small>${esc(extra)}</small>` : ''}</li>`;
    const strong = met.filter((r) => r.strong).sort((a, b) => b.lv - a.lv);
    const weak = met.filter((r) => r.weak);
    const due = met.filter((r) => r.due);
    // 推移：記録ごとの段階の数
    const hist = (S.growth || []).slice(-12);
    const total = rows.length;
    const trend = hist.length >= 2 ? `<section><h4>伸び方</h4><div class="s-gtrend">${hist.map((h) => { const c = [0, 0, 0, 0, 0]; Object.values(h.lv).forEach((v) => c[v]++); return `<div class="s-gcol" title="${esc(api.monthLabel(h.mi))}"><div class="s-gstack">${[1, 2, 3, 4].map((i) => (c[i] ? `<span class="lv${i}" style="height:${(c[i] / total) * 100}%"></span>` : '')).join('')}</div><small>${esc(api.monthLabel(h.mi).replace(/^.*?(\d+月)$/, '$1'))}</small></div>`; }).join('')}</div><p class="muted" style="font-size:12px">ゲームの月ごと（月末の締め・腕だめしのとき）に記録。高さは試験範囲の全${total}項目に対する割合。</p></section>` : '';
    return `<h3>成長の記録</h3>${legend}${areas}`
      + `<section><h4>得意</h4>${strong.length ? `<ul class="s-glist">${strong.map((r) => li(r, LV[r.lv])).join('')}</ul>` : '<p class="muted">まだない。1回目で正しく書けて、月末に直さずに済んだ項目がここに来る。</p>'}</section>`
      + `<section><h4>苦手</h4>${weak.length ? `<ul class="s-glist weak">${weak.map((r) => li(r, r.why.join('／'))).join('')}</ul>` : '<p class="muted">いまはない。</p>'}</section>`
      + `<section><h4>確かめどき</h4>${due.length ? `<ul class="s-glist due">${due.map((r) => li(r, r.due)).join('')}</ul>` : '<p class="muted">いまはない。</p>'}</section>`
      + trend;
  };
})(typeof window !== 'undefined' ? window : globalThis);
