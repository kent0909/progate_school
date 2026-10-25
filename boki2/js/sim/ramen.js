// ラーメン版の月の生成（DESIGN-RAMEN 版0.4 k.3・c.7・l.2 段4）。SIM.ramen.month(S, W) は既存の events() と同じ形（その月に出る出来事の配列）を返す。
// 月の中身＝作戦の机（plan）→ 決まった骨の書類（ramen-y1.js）→ 札（cards.js：その月に引いた札だけ）→ 月報（rreport）→ 月末の締め（engine の closeScreen）。
// engine は月の中身がどう作られたかを知らない：SIMDATA.months は月ごとの出来事の一覧で、札や書類は when(S)（その月に引いたか・選んだか）で出る。
// 札の結果は、札を選んだ翌月の作戦の机のあとに返る（world.month の carry）。番人（g.3）は骨：scope-map の期限が近い項目の札の重みを上げる。
(function (g) {
  const SIM = (g.SIMDATA = g.SIMDATA || {});
  const Y = SIM.y1, MON = Y.MON;
  const RM = (SIM.ramen = SIM.ramen || {});

  // ---------- 世界の状態（S.W）。開店の前の判断（物件・店の形・一杯）から作る ----------
  RM.world = (S) => {
    if (S.W) return S.W;
    const d = S.decisions || {}, p = SIM.bowl.presets.find((x) => x.id === d.bowl) || SIM.bowl.presets[0];
    S.seed = S.seed == null ? 0 : S.seed;   // 1周目は seed 0（(o) 17）
    S.W = SIM.world.create({ seed: S.seed, area: d.site || 'shotengai', form: d.form || 'part1', bowl: p.spec, bowlName: (S.profile && S.profile.bowlName) || p.name, tier: 0, rivalInfo: (S.rivalInfo || 'A'), ghost: !!S.ghost, ghostChoices: S.ghostChoices || null });
    const sign = { none: ['none', 3], small: ['small', 3], large: ['large', 3], later: ['large', 15] }[d.sign] || ['none', 3];
    S.W.stores[0].sign = sign[0]; S.W.stores[0].signAt = sign[1];
    S.W.stores[0].supplier = ['cheap', 'std', 'high'].includes(d.supplier) ? d.supplier : 'std';
    S.res = {}; S.pols = {}; S.dealt = {}; S.cardOutcomes = []; S.choices = S.choices || [];
    return S.W;
  };
  // 作戦の机の手は月ごとに開く（X28：4月 値段・仕込み、5月 ＋地図、6月 ＋人、7月 ＋SNS・LINE、8月 ＋チラシ・クーポン・一杯の手直し・限定）
  RM.supplierOptions = [{ id: 'cheap', label: '安い問屋' }, { id: 'std', label: '標準の問屋' }, { id: 'high', label: '高い問屋' }];
  RM.opens = (t) => ['price', 'prep', 'supplier', ...(t >= 1 ? ['map', 'forecast'] : []), ...(t >= 2 ? ['staff', 'haccp', 'inspect'] : []), ...(t >= 3 ? ['sns', 'line'] : []), ...(t >= 4 ? ['flyer', 'coupon', 'tweak'] : [])];
  RM.policy = (S, t) => {
    const W = RM.world(S), prev = S.pols[t - 1];
    const p = SIM.world.policy0(W, prev || null);
    if(t>=12)p.parts+=(W.flags.y2PendingHires || []).filter(x=>x.store===0).length;
    const open = RM.opens(t), base = SIM.world.policy0(W, null), before = t ? RM.opens(t - 1) : [];
    // 今月はじめて開いた手は、ふつうの既定から（前月の「まだ開いていない」のまま引き継がない）
    for (const k of open) if (!before.includes(k) && k in base) p[k] = base[k];
    if (!open.includes('flyer')) p.flyer = 0;
    if (!open.includes('coupon')) p.coupon = false;
    if (!open.includes('sns')) p.sns = false;
    if (!open.includes('line')) p.line = false;
    if (!open.includes('map')) p.map = false;
    if (!open.includes('forecast')) p.forecast = false;
    return SIM.world.fitTime(W, p, SIM.rng(S.seed * 7 + t));
  };
  // 月を回す（作戦の机の「決定」）：前の月の札の結果を返し、今月の結果（res）を出し、今月の札を引く
  RM.plan = (S, t, pol) => {
    const W0 = RM.world(S);
    if (S.res[t]) return S.res[t];
    const rng = SIM.rng((S.seed + 1) * 7919 + t * 104729);
    let dealt;
    if(t>=12){dealt=SIM.cards.deal(RM.guarded(W0),SIM.y2.stream(W0,'deal'));W0.flags.y2CurrentDealt=dealt;}
    if (t >= 12 && SIM.y2.beforePlan) SIM.y2.beforePlan(S, t, pol);
    const carry = Object.entries(S.decisions || {}).filter(([k]) => k.endsWith(`@${t - 1}`) && SIM.cards.byId[k.split('@')[0]]).map(([k, v]) => ({ id: k.split('@')[0], option: v, t: t - 1 }));
    if (t >= 12 && SIM.y2.carry) carry.push(...SIM.y2.carry(S, t));
    if(t<12)dealt=SIM.cards.deal(RM.guarded(W0),rng);
    const r = SIM.world.month(W0, pol, { rng, carry });
    for (const id of dealt) r.W.cardsSeen[id] = (r.W.cardsSeen[id] || 0) + 1;
    S.W = r.W; S.res[t] = r.res; S.pols[t] = t >= 12 ? { ...pol, parts: r.W.stores[0].parts, family: r.W.stores[0].family } : pol; S.dealt[t] = dealt;
    if (t >= 12) r.res.staffParts = r.W.stores.filter(st => st.open !== false).reduce((n, st) => n + st.parts, 0);
    if (t >= 12 && SIM.y2.afterPlan) SIM.y2.afterPlan(S, t, r);
    (r.res.carried || []).forEach((x) => S.cardOutcomes.push(x));
    S.choices.push({ y: Math.floor(t / 12) + 1, m: MON[t % 12], t, card: 'plan', option: JSON.stringify({ price: pol.price, prep: pol.prep, parts: pol.parts, flyer: pol.flyer || 0, sign: pol.sign, signAt: pol.signAt, supplier: pol.supplier }), seed: S.seed });
    return r.res;
  };
  // 番人（g.3）の骨：まだ出会っていない項目で期限（年）が近いものは、その項目を生む札の重みを上げる（scope-map の deadline）
  RM.guarded = (W) => {
    const map = SIM.scopeMap || {}, met = (W.flags && W.flags.met) || {};
    const boost = {};
    for (const [id, it] of Object.entries(map)) {
      if (met[id] || !it.deadline) continue;
      const left = it.deadline.y * 12 - W.t; // 残りの月
      if (left > 12) continue;
      for (const sc of it.scenes || []) if (sc.card && SIM.cards.byId[sc.card]) boost[sc.card] = Math.max(boost[sc.card] || 1, 1 + 3 * Math.max(0, (12 - left) / 12));
    }
    const W2 = Object.assign({}, W, { guardBoost: boost });
    return W2;
  };
  const dealtAt = (S, t) => ((S.dealt || {})[t] || []);
  const resAt = (S, t) => (S.res || {})[t];
  // ---------- 札を月の出来事に（判断の画面と、選んだ手の書類） ----------
  const fakeW = (t) => { try { const W = SIM.world.create({ seed: 0 }); W.t = t; W.m = MON[t % 12]; W.y = Math.floor(t / 12) + 1; return W; } catch (e) { return null; } };
  function cardEvents(t) {
    const out = [];
    for(const handler of Object.values(RM.fxBookers))out.push(...handler.docs(t));
    for (const c of SIM.cards.deck) {
      if (c.y2) continue;
      if (c.tFrom != null && t < c.tFrom) continue;
      const key = `${c.id}@${t}`, dealt = (S) => dealtAt(S, t).includes(c.id);
      if (c.disc && Y.disc[c.disc]) out.push({ ...Y.disc[c.disc], id: `${Y.disc[c.disc].id}`, when: (S) => dealt(S) && (!(S.discDone || {})[Y.disc[c.disc].id] || ((S.discDone || {})[Y.disc[c.disc].id]===S.mi)) });
      out.push({ t: 'decision', id: key, card: c.id, ramenT: t, when: dealt, q: c.q || c.title, talk: c.talk,
        trial: (S, oid) => { const W = S.W || fakeW(t), tr = SIM.decide.trial(c, oid, W); const o = c.options.find((x) => x.id === oid); return [['うまくいく見込み（いちばん多い結果）', `${Math.round(Math.max(...tr.weights.map((x) => x.w)))}%`], ...(o.time ? [['使う時間', `${o.time}`]] : []), ...(tr.cashMin !== tr.cashMax ? [['すぐ動くお金の幅', `${tr.cashMin.toLocaleString()}〜${tr.cashMax.toLocaleString()}円`]] : [])]; },
        options: c.options.map((o) => ({ id: o.id, label: o.label, desc: o.desc || '', result: `${o.label}。結果は来月の月報で分かる。` })) });
      if (c.docs && !RM.fxBookers[c.id]?.deferDocs) {
        const W0 = fakeW(t), docs = W0 ? c.docs(W0) : [];
        docs.forEach((d, k) => {
          const forOpts = c.docFor ? Object.entries(c.docFor).filter(([, v]) => v.includes(k)).map(([o]) => o) : c.options.map((o) => o.id);
          out.push({ ...d, id: `${c.id}-doc${k}@${t}`, card: c.id, ramenT: t, when: (S) => dealt(S) && forOpts.includes((S.decisions || {})[key]),
            doc: { ...d.doc, rows: (S) => { const x = c.docs((S && S.W) || W0)[k].doc; return typeof x.rows === 'function' ? x.rows(S) : x.rows; } }, ans: (S) => c.docs((S && S.W) || W0)[k].ans });
        });
      }
      if (c.calc && RM.calcs[c.calc]) out.push({ ...RM.calcs[c.calc](t), when: (S) => dealt(S) && !!(S.decisions || {})[key] });
    }
    return t >= 12 ? out.concat(SIM.y2.cardEvents(t)) : out;
  }
  // 札につく計算（b-accrual：もうけと口座のずれを、自分の帳簿の数で数える）
  RM.calcs = {
    mayfund: (t) => Y.calc(`mayfund-calc@${t}`, { scope: ['b-accrual'], title: 'もうけと、口座の増え方のずれ', talk: [['senpai', '先月のもうけと、先月に口座が増えた額を並べてみよう。']],
      rows: (S) => { const r = resAt(S, t - 1) || Y.R(S, t - 1); return [['先月のもうけ（売上−費用）', Math.round(r.op)], ['先月に払った、その前の月の給料とガス代', Math.round((Y.R(S, t - 2).labor || 0) + (Y.R(S, t - 2).util || 0))]]; },
      q: '先月の給料とガス代を、その月に払っていたとしたら、口座の増え方はもうけより何円小さくなった？', answer: (S) => { const r = Y.R(S, t - 2); return Math.round((r.labor || 0) + (r.util || 0)); }, unit: '円', why: '払う月がずれると、口座の増え方はもうけとずれる。もうけは働いてもらった・使った月、口座は払った月で動く。' }),
    due: (t) => Y.calc(`due-calc@${t}`, { scope: ['b-accrual'], title: '期日の一覧で、来月の口座を読む', talk: [['senpai', '来月に払う約束を並べよう。']],
      rows: (S) => { const r = resAt(S, t) || Y.R(S, t); return [['いまの口座（およそ）', Math.round((S.W && S.W.cash) || 3000000)], ['来月末に払う材料の代金（買掛金）', Math.round(r.cogs + r.wasteCost)], ['来月25日に払う給料', Math.round(r.labor + (r.famPay || 0))], ['来月1日の家賃', Math.round(r.rent || 0)]]; },
      q: '来月の売上が入る前に払う約束は、合わせていくら？', answer: (S) => { const r = resAt(S, t) || Y.R(S, t); return Math.round(r.cogs + r.wasteCost) + Math.round(r.labor + (r.famPay || 0)) + Math.round(r.rent || 0); }, unit: '円', why: '払う約束を日付の順に並べると、売上が入る前に口座がいくら要るかが分かる。' }),
  };

  // ---------- 月報（rreport）：月の結果。「その他の店のお金」と札のお金は一括確定で帳簿へ（h.1） ----------
  // 札の金額を汎用fxへ重ねないための口。PR #3のbulkもidごとに追加できる。
  const resultAt=(S,t,id)=>(resAt(S,t)?.choices||[]).find(x=>x.card===id);
  const manualFx=(book,docs,deferDocs=false)=>Object.assign(book,{docs,deferDocs});
  RM.fxBookers = {
    bulk:manualFx((S,t,x)=>x.option==='bulk'?{cash:x.cash,manual:true,entries:[]}:null,t=>{const out=[];
    if (t >= 6) SIM.cards.byId.bulk.docs(fakeW(t)).forEach((d,k) => out.push({
      ...d, id: `bulk-doc${k}@${t}`, card: 'bulk', ramenT: t,
      when: S => resultAt(S,t,'bulk')?.option==='bulk' && resultAt(S,t,'bulk')?.outcome === ['cheap','spoil','space'][k]
    }));
      return out;},true),
    coupon_dual:manualFx((S,t,x)=>({cash:x.cash,manual:true,entries:[]}),t=>{const out=[];
    if(t>=3){const payment=S=>(resAt(S,t)?.choices||[]).find(x=>x.card==='coupon_dual');
      out.push({t:'doc',kind:'discount',id:`coupon_dual-doc0@${t}`,card:'coupon_dual',ramenT:t,scope:['s-revenue'],when:S=>!!payment(S),
        fixture:()=>({res:{[t]:{choices:[{card:'coupon_dual',option:'check',outcome:'ok',cash:SIM.cards.byId.coupon_dual.options[0].outcomes[0].cash(fakeW(t))}]}}}),
        doc:{type:'値引きの記録',title:'前月に決めた値引きの記録',from:'券売機',to:'経理',date:`${MON[t%12]}月末`,rows:S=>[['値引きした額',-(payment(S)?.cash||0),'amt'],['メモ','前月の売上の3%（千円丸め）。結果が返る今月に、売上と口座から引いた']]},
        ans:S=>({dr:[['売上',-(payment(S)?.cash||0)]],cr:[['普通預金',-(payment(S)?.cash||0)]]}),opts:['売上','普通預金','広告宣伝費','支払手数料']});
    }
      return out;},true),
    maintain:manualFx((S,t,x)=>{
      if(!x||!(x.cash<0)||!['repair','new','wait'].includes(x.option))return null;
      return {cash:x.cash,manual:true,entries:[{id:`fx-book-maintain@${t}`,label:x.option!=='wait'?'前月の器材代・修理代の支払':'故障した器材の修理代',dr:[[x.option!=='wait'?'未払金':'修繕費',-x.cash]],cr:[['普通預金',-x.cash]]}]};
    },t=>{const out=[];
    if(t>=9&&t<=12){
      const payment=S=>(resAt(S,t)?.choices||[]).find(x=>x.card==='maintain'&&x.cash<0);
      const paymentView=S=>payment(S)||{option:'repair',cash:0};
      out.push({t:'doc',id:`fx-book-maintain@${t}`,scope:['b-mibarai'],
        when:S=>!!payment(S),doc:{type:'通帳',title:'普通預金 通帳（器材・修理代の振込）',from:'みらい銀行',to:'{店}',date:`${MON[t%12]}月末`,rows:S=>[['摘要',paymentView(S).option==='wait'?'故障した器材の修理代':'前月の器材・修理代の支払'],['お引出し',-paymentView(S).cash,'amt']]},
        ans:S=>{const a=RM.fxBookers.maintain(S,t,payment(S))?.entries[0];return a?{dr:a.dr,cr:a.cr}:{dr:[],cr:[]};},opts:['未払金','修繕費','備品','普通預金']});
    }
      return out;})
  };
  const rreport = (t) => ({ t: 'rreport', id: `rep${t}`, ramenT: t,
    rows: (S) => { const r = resAt(S, t) || Y.R(S, t); return [['1日のお客さん', `${(r.N || 0).toFixed(1)}人`], ['売上', Math.round(r.sales)], ['材料', -Math.round(r.cogs + (r.wasteCost || 0))], ['人のお金', -Math.round(r.labor + (r.famPay || 0))], ['家賃・ガス水道電気・その他', -Math.round(r.rent + r.util + r.other)], ['この月のもうけ（およそ）', Math.round(r.op)]]; },
    // 一括確定で帳簿に入れる行（月報の行のうち、手で書かない行）。その他の店のお金（通信・掃除・会計の先生など）は消耗品費の札でまとめる【簡略：段5で行を分ける】
    auto: (S) => { const r = resAt(S, t); if (!r) return []; const rows = [{ id: `other${t}`, label: 'その他の店のお金（電話・掃除・小物）', dr: [['消耗品費', Math.round(r.other)]], cr: [['普通預金', Math.round(r.other)]] }]; let fx = r.fx;
      for(const x of r.choices || []){const handler=RM.fxBookers[x.card];if(!handler)continue;const booked=handler(S,t,x);if(booked){if(!booked.manual)rows.push(...booked.entries);fx-=booked.cash;}}
      if (t >= 12) {
        // 年2の札は、実際にお金が動いた月に手書き済み。月報で二重に書かない。
        fx -= (r.choices || []).reduce((n, x) => { const c = SIM.cards.byId[x.card]; if (!c || !c.y2) return n; const o = c.options.find(o => o.id === x.option).outcomes.find(o => o.id === x.outcome); return n + ((o.flow || 'op') === 'op' ? x.cash : 0); }, 0);
        if(r.borrowed)rows.push({id:`borrowed${t}`,label:'追加借入の入金',dr:[['普通預金',r.borrowed]],cr:[['借入金',r.borrowed]]});
        const extraAds = Math.round(r.ads - ((S.pols[t] || {}).flyer || 0));
        if (extraAds) rows.push({ id: `ads-other${t}`, label: '配信などの宣伝の支払', dr: [['広告宣伝費', extraAds]], cr: [['普通預金', extraAds]] });
      }
      if (fx && fx !== 0) rows.push({ id: `fx${t}`, label: fx > 0 ? '札で入ったお金（出店・弁当など）' : '札で出ていったお金', dr: fx > 0 ? [['普通預金', Math.round(fx)]] : [['消耗品費', Math.round(-fx)]], cr: fx > 0 ? [['売上', Math.round(fx)]] : [['普通預金', Math.round(-fx)]] }); return rows; } });
  const plan = (t) => ({ t: 'plan', id: `plan${t}`, ramenT: t, opens: RM.opens(t) });
  const endings = (t) => [
    { t: 'ending', id: 'r-warn', ramenT: t, when: (S) => !!(S.W && S.W.insolvent >= 1 && !S.W.bankrupt && !(S.seenEnds || []).includes('r-warn')) },
    { t: 'ending', id: 'r-final', ramenT: t, when: (S) => !!(S.W && S.W.bankrupt) },
  ];

  // ---------- 月の一覧（SIMDATA.months） ----------
  const months = [{ m: 0, label: 'プロローグ', title: '{店}の屋台', closeless: true, events: [Y.prologue] }];
  Y.pre.forEach((p) => months.push({ m: 3, label: p.label, title: p.title, closeless: true, pre: true, events: p.events }));
  const TITLES = ['開店！ 看板の一杯を出す', 'もうけたのに、口座がへった？', '問屋さんと掛けで', '家賃と返済が始まる', '夏の限定と、チラシ', 'カードで払うお客さん', '消費税を預かる', '通帳と帳簿が合わない', '年末の売り出し', '寒い月の一杯', '谷の月', '1年のしめくくり'];
  for (let t = 0; t < 12; t++) months.push({ m: MON[t], label: `${MON[t]}月`, title: TITLES[t], ramenT: t, events: [plan(t), ...Y.months[t], ...cardEvents(t), rreport(t), ...endings(t)] });
  Y.kessan.forEach((k) => months.push({ m: k.next4 ? 4 : 3, label: k.label, title: k.title, seg: k.seg, closeless: k.closeless, events: k.events }));
  for (const year of [2, 3]) {
    for (let t = (year - 1) * 12; t < year * 12; t++) months.push({ year, m: MON[t % 12], label: `${year}年目 ${MON[t % 12]}月`, title: SIM.y2.monthTitle(t), ramenT: t,
      events: [plan(t), ...SIM.y2.routine(t), ...cardEvents(t), { t: 'recall', id: `recall${t}` }, rreport(t), ...endings(t)] });
    months.push(...SIM.y2.kessan(year));
  }
  for (let t = 36; t < 39; t++) months.push({ year: 4, m: MON[t % 12], label: `4年目 ${MON[t % 12]}月`, title: '前の年の約束を払う', ramenT: t,
    events: [plan(t), ...SIM.y2.routine(t), ...SIM.y2.cardEvents(t), ...cardEvents(t).filter(e=>RM.fxBookers[e.card]?.deferDocs), { t: 'recall', id: `recall${t}` }, rreport(t), ...endings(t)] });
  // 承認6385898424：PR #3と同じ0円書類の規則。統合時には関数を共通化する。
  months.flatMap(m=>m.events).forEach(Y.omitZeroDoc);
  SIM.months = months;
  RM.monthIndexOfT = (t) => months.findIndex((m) => m.ramenT === t);
  // 既存の events() と同じ形：いまの月（S.mi）の出来事のうち、その状態で出るもの
  RM.month = (S, W) => { void W; const m = months[S.mi]; return m ? m.events.filter((e) => !e.when || e.when(S)) : []; };
})(typeof window !== 'undefined' ? window : globalThis);

