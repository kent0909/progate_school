#!/usr/bin/env node
// 担当B：run-full.js の出力（out/*.json）から、受け入れの基準2の数（P1〜P5・会社が育つのが見えるか）を数える。
// 使い方：node analyze.js [out] > out/metrics.json
// 打ち手の出力は大きいので gzip して残した（out/*.json.gz）。.json のままでも読む。runs[].file は .gz を除いた名前。
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const dir = path.resolve(__dirname, process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'out');
const files = fs.readdirSync(dir).filter(f => /^(idle|random|skilled)(-risky|-site2-[a-z]+)?-\d+-\d\.json(\.gz)?$/.test(f)).sort();
const read = f => { const b = fs.readFileSync(path.join(dir, f)); return JSON.parse((f.endsWith('.gz') ? zlib.gunzipSync(b) : b).toString('utf8')); };
const runs = files.map(f => ({ ...read(f), f: f.replace(/\.gz$/, '') }));
const yOf = t => Math.floor(t / 12) + 1, MON = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
const at = t => t == null ? '開店の前' : `${yOf(t)}年目${MON[t % 12]}月`;
// 作戦の机の手のうち、口座のお金の使い道を直接選ぶ手（払う額が手で変わる）と、入る額を変える手
const SPEND_HANDS = ['staff', 'supplier', 'flyer', 'line', 'prep'];   // 人のお金・材料の質と量・宣伝
const INCOME_HANDS = ['price', 'coupon'];
const median = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
const out = { files: files.length, runs: [] };
for (const r of runs) {
  const F = r.final, res = F.res || {}, ts = Object.keys(res).map(Number).sort((a, b) => a - b);
  const monthOfMi = mi => (F.months[mi] || {}).ramenT;
  // ---- P1：月ごとの判断の数 ----
  const perMonth = {};
  const bump = (t, k) => { const key = t == null ? 'pre' : t; (perMonth[key] ||= { plan: 0, planSpend: 0, cardMoney: 0, cardOther: 0, ids: [] })[k]++; };
  for (const s of r.screens) {
    // 決算の月（ramenT なし）は直前の営業月の締めとして、その年の3月に数える
    let t = s.ramenT; if (t == null && s.label && /年目の(決算|はじめ)|決算/.test(s.label)) t = null;
    if (s.t === 'plan') { const en = s.planEnabled || []; const key = t; perMonth[key] ||= { plan: 0, planSpend: 0, cardMoney: 0, cardOther: 0, ids: [] }; perMonth[key].plan += en.length; perMonth[key].planSpend += en.filter(k => SPEND_HANDS.includes(k)).length + en.filter(k => INCOME_HANDS.includes(k)).length; }
    if (s.t === 'decision') {
      const money = Array.isArray(s.money) && s.money.some(([, a, b]) => a !== 0 || b !== 0);
      const known = /site|form|sign|supplier|openloan|capital|site2_staff|close-|issue|dividend|equip|staff|hire/.test(s.id || '');
      bump(t, money || (!s.card && known) ? 'cardMoney' : 'cardOther');
      (perMonth[t == null ? 'pre' : t].ids).push(s.card || s.id);
    }
  }
  // ---- P2：判断から結果が数字で返るまで ----
  const delays = [];
  for (const t of ts) for (const c of (res[t].carried || [])) delays.push({ card: c.card, chosen: c.t, returned: t, months: t - c.t });
  const build = F.W && F.W.flags.y2Build;
  // ---- P3：赤字・口座の不足から立て直せたか ----
  const series = ts.map(t => ({ t, op: Math.round(res[t].op), cash: Math.round(res[t].cash), loan: Math.round(res[t].loan || 0) }));
  const firstBlack = (series.find(x => x.op > 0) || {}).t;
  const neg = series.filter(x => x.cash < 0);
  let worst = series.reduce((a, x) => (x.op < a.op ? x : a), series[0] || { op: 0 });
  const recoverOp = worst ? series.find(x => x.t > worst.t && x.op > 0) : null;
  // 3か月以上続いた赤字の山（最初の1年の立ち上がりを除いた2年目以降）と、その後の立て直し
  const streaks = []; let cur = null;
  for (const x of series) { if (x.op < 0) { cur ||= { from: x.t, to: x.t, sum: 0 }; cur.to = x.t; cur.sum += x.op; } else if (cur) { streaks.push({ ...cur, back: x.t }); cur = null; } }
  if (cur) streaks.push({ ...cur, back: null });
  // 口座が足りない（負）の山：何か月続き、正に戻ったか（戻るまでの月数）
  const negEp = []; let ne = null;
  for (const x of series) { if (x.cash < 0) { ne ||= { from: x.t, months: 0 }; ne.months++; } else if (ne) { negEp.push({ from: at(ne.from), months: ne.months, recovered: true }); ne = null; } }
  if (ne) negEp.push({ from: at(ne.from), months: ne.months, recovered: false });
  // ---- P4：手・層が開いた時点と触った回数 ----
  const opened = {};
  for (const s of r.screens) {
    const t = s.ramenT, keyT = t == null ? -1 : t;
    if (s.t === 'plan') for (const k of s.planEnabled || []) if (!(k in opened)) opened['手:' + k] ??= keyT;
    if (s.t === 'decision') { const id = '札:' + (s.card || (s.id || '').replace(/@.*/, '')); if (!(id in opened)) opened[id] = keyT; }
  }
  // 触った回数：作戦の机の手は前の月から値を変えた回数、札は選んだ回数（据え置き・見送り以外）
  const touch = {};
  const pols = F.pols || {};
  for (const t of ts) { const p = pols[t], q = pols[t - 1]; if (!p || !q) continue; for (const k of ['price', 'prep', 'parts', 'supplier', 'flyer', 'coupon', 'line', 'sns', 'map', 'forecast', 'haccp', 'inspect', 'tweak', 'limited']) if (JSON.stringify(p[k]) !== JSON.stringify(q[k])) touch['手:' + k] = (touch['手:' + k] || 0) + 1; }
  for (const [k, v] of Object.entries(F.decisions || {})) { const id = '札:' + k.replace(/@.*/, ''); if (!/^(keep|no|none|skip|wait|decline|later)$/.test(String(v))) touch[id] = (touch[id] || 0) + 1; }
  // ---- P5：ライバル・町の出来事・制度が数字を動かした回数と画面に出た回数 ----
  const rivalMoved = ts.filter(t => Math.abs(((res[t].factors || {}).rival) || 0) >= 0.1).length;
  const rivalTop = ts.filter(t => { const f = res[t].factors || {}; const ks = ['ramp', 'calendar', 'weather', 'price', 'rep', 'bowl', 'ad', 'rival', 'stockout'].filter(k => typeof f[k] === 'number'); return ks.length && ks.sort((a, b) => Math.abs(f[b]) - Math.abs(f[a]))[0] === 'rival'; }).length;
  const opens = ts.filter(t => res[t].opened).map(t => at(t));
  const closed = ((F.W || {}).rivals || []).filter(x => x.open === false).map(x => `${x.name}:${at(x.closedAt)}`);
  const dealtAll = Object.entries(F.dealt || {}).flatMap(([t, ids]) => ids.map(id => ({ t: +t, id })));
  const WORLD = /^(rival_open|minwage|minwage_y2|minwage_y3|foodup|costOmen|ev_spring|ev_summer|ev_year|ev_summer_y2|heat|torizai|good_kouji|good_jouren|chain_hire)$/;
  const worldCards = dealtAll.filter(x => WORLD.test(x.id));
  const reports = r.screens.filter(s => s.t === 'rreport');
  const rivalNames = ['ごうりき軒', 'ふじしろ', '小松', 'ほかの店'];
  const reportsRival = reports.filter(s => rivalNames.some(n => (s.text || '').includes(n))).length;
  const reportsRivalName = reports.filter(s => ['ごうりき軒', 'ふじしろ', '小松'].some(n => (s.text || '').includes(n))).length;
  // ---- 会社の大きさ ----
  const size = ts.filter(t => t % 12 === 11 || t === ts[ts.length - 1]).map(t => ({ at: at(t), stores: (res[t].stores || [1]).filter(x => x.open !== false).length, sales: Math.round(res[t].sales), op: Math.round(res[t].op), cash: Math.round(res[t].cash), loan: Math.round(res[t].loan || 0), parts: res[t].staffParts != null ? res[t].staffParts : (pols[t] || {}).parts }));
  out.runs.push({ file: r.f, style: r.args.style + (/-risky-/.test(r.f) ? "-risky" : /-site2-/.test(r.f) ? "-site2" : ""), seed: r.args.seed, strategy: r.args.strategy, outcome: r.outcome, pageErrors: r.errors.length, reached: F.label, bankrupt: !!(F.W && F.W.bankrupt), months: ts.length, lastT: ts[ts.length - 1],
    P1: Object.fromEntries(Object.entries(perMonth).map(([k, v]) => [k, { plan: v.plan, planMoney: v.planSpend, cardMoney: v.cardMoney, cardOther: v.cardOther, ids: v.ids }])),
    P2: { delays, delayHist: delays.reduce((h, d) => (h[d.months] = (h[d.months] || 0) + 1, h), {}), site2Build: build },
    P3: { negEpisodes: negEp, firstBlack: firstBlack == null ? null : at(firstBlack), cashNegMonths: neg.map(x => at(x.t)), minCash: Math.min(...series.map(x => x.cash)), worst: worst && { at: at(worst.t), op: worst.op }, recoverFromWorst: recoverOp ? recoverOp.t - worst.t : null, streaks: streaks.map(s => ({ from: at(s.from), to: at(s.to), months: s.to - s.from + 1, sum: s.sum, backAfter: s.back == null ? null : s.back - s.to })), finalCash: series.length ? series[series.length - 1].cash : null, finalNet: series.length ? series[series.length - 1].cash - series[series.length - 1].loan : null },
    P4: { opened: Object.fromEntries(Object.entries(opened).sort((a, b) => a[1] - b[1]).map(([k, v]) => [k, v < 0 ? '開店の前' : at(v)])), touch },
    P5: { rivalMovedMonths: rivalMoved, rivalTopFactorMonths: rivalTop, rivalOpened: opens, rivalClosed: closed, worldCardsDealt: worldCards.map(x => `${x.id}@${at(x.t)}`), reports: reports.length, reportsMentionRival: reportsRival, reportsNameRival: reportsRivalName },
    size,
    // 画面の種類の数（年ごと）：記帳の書類（doc）と経営の判断（decision・plan）の釣り合い
    screenMix: r.screens.reduce((h, s) => { const y = s.ramenT == null ? 'その他' : String(yOf(s.ramenT)); (h[y] ||= {})[s.t] = (h[y][s.t] || 0) + 1; return h; }, {}) });
}
// ---- 打ち方ごとのまとめ ----
const styles = ["idle", "random", "skilled", "idle-risky", "skilled-site2"];
out.summary = styles.map(st => {
  const a = out.runs.filter(x => x.style === st); if (!a.length) return null;
  const yearAvg = (y) => { const vals = a.map(x => { const ks = Object.keys(x.P1).filter(k => k !== 'pre' && k !== 'null' && yOf(+k) === y); if (!ks.length) return null; const s = ks.reduce((n, k) => n + x.P1[k].planMoney + x.P1[k].cardMoney, 0); return s / ks.length; }).filter(v => v != null); return vals.length ? Math.round(10 * vals.reduce((p, q) => p + q, 0) / vals.length) / 10 : null; };
  const yearCard = (y) => { const vals = a.map(x => { const ks = Object.keys(x.P1).filter(k => k !== 'pre' && k !== 'null' && yOf(+k) === y); if (!ks.length) return null; return ks.reduce((n, k) => n + x.P1[k].cardMoney, 0) / ks.length; }).filter(v => v != null); return vals.length ? Math.round(10 * vals.reduce((p, q) => p + q, 0) / vals.length) / 10 : null; };
  return { style: st, runs: a.length, reachedEnd: a.filter(x => !x.bankrupt && x.lastT === 38).length, bankrupt: a.filter(x => x.bankrupt).length, stuckOrError: a.filter(x => x.outcome.stuck || x.outcome.maxed || x.outcome.error).length,
    bankruptAt: a.filter(x => x.bankrupt).map(x => `${x.seed}:${x.reached}`), firstBlack: a.map(x => x.P3.firstBlack), finalCashMedian: median(a.map(x => x.P3.finalCash)), finalNetMedian: median(a.map(x => x.P3.finalNet)), minCashMedian: median(a.map(x => x.P3.minCash)),
    cashNegRuns: a.filter(x => x.P3.cashNegMonths.length).length, negEpisodes: a.reduce((n, x) => n + x.P3.negEpisodes.length, 0), negRecovered: a.reduce((n, x) => n + x.P3.negEpisodes.filter(e => e.recovered).length, 0), bankruptMonthsFromStart: a.filter(x => x.bankrupt).map(x => x.lastT + 1),
    moneyDecisionsPerMonth: { y1: yearAvg(1), y2: yearAvg(2), y3: yearAvg(3), y4: yearAvg(4) }, cardMoneyPerMonth: { y1: yearCard(1), y2: yearCard(2), y3: yearCard(3), y4: yearCard(4) },
    delayHist: a.reduce((h, x) => { for (const [k, v] of Object.entries(x.P2.delayHist)) h[k] = (h[k] || 0) + v; return h; }, {}),
    rivalMovedMonths: median(a.map(x => x.P5.rivalMovedMonths)), rivalTopFactorMonths: median(a.map(x => x.P5.rivalTopFactorMonths)), reportsNameRival: median(a.map(x => x.P5.reportsNameRival)), reports: median(a.map(x => x.P5.reports)),
    site2Built: a.filter(x => x.P2.site2Build).length,
    // 触った回数の合計（周をまたいで足す）と、その手・札を1回でも触った周の数
    touchTotal: a.reduce((h, x) => { for (const [k, v] of Object.entries(x.P4.touch)) h[k] = (h[k] || 0) + v; return h; }, {}),
    touchRuns: a.reduce((h, x) => { for (const k of Object.keys(x.P4.touch)) h[k] = (h[k] || 0) + 1; return h; }, {}),
    docPerDecision: ['1', '2', '3', '4'].map(y => { const v = a.map(x => { const m = x.screenMix[y] || {}; const d = (m.decision || 0) + (m.plan || 0); return d ? (m.doc || 0) / d : null; }); return median(v) == null ? null : Math.round(median(v) * 10) / 10; }),
    worldCardsMedian: median(a.map(x => x.P5.worldCardsDealt.length)), rivalClosedRuns: a.filter(x => x.P5.rivalClosed.length).length,
    streak3plusAfterY1: a.filter(x => x.P3.streaks.some(s => s.months >= 3 && !/^1年目/.test(s.from))).length,
    sizeByYear: [0, 1, 2, 3].map(i => ({ at: (a[0].size[i] || {}).at, storesMax: Math.max(...a.map(x => (x.size[i] || {}).stores || 0)), salesMedian: median(a.map(x => (x.size[i] || {}).sales)), cashMedian: median(a.map(x => (x.size[i] || {}).cash)), partsMedian: median(a.map(x => (x.size[i] || {}).parts)) })) };
}).filter(Boolean);
console.log(JSON.stringify(out, null, 1));
