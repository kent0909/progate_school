#!/usr/bin/env node
// J-B：担当Bの打ち手の生の出力（cinc-rebuild-B/out/*.json.gz）から、P1〜P5・会社の大きさを自分で数え直す。
// B の analyze.js は読まない・呼ばない。数え方は下に全部書いた（B と同じ定義のものと、B と違う分け方のもの）。
// 使い方：node cinc-rebuild-B-fact-count.js [出力のフォルダ] > 結果.json
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const dir = process.argv[2] || path.resolve(__dirname, '../analysis/cinc-rebuild-B/out');
const files = fs.readdirSync(dir).filter(f => /\.json(\.gz)?$/.test(f) && !/metrics|probe/.test(f));
const load = f => { const b = fs.readFileSync(path.join(dir, f)); return JSON.parse(f.endsWith('.gz') ? zlib.gunzipSync(b) : b); };
// 中央値：偶数個は「真ん中2つの平均」（medLo は下側、medHi は上側も出す。B の書き方がどれかを突き合わせるため）
const sorted = a => a.filter(v => v != null && !Number.isNaN(v)).sort((p, q) => p - q);
const med = a => { const x = sorted(a); if (!x.length) return null; const n = x.length; return n % 2 ? x[(n - 1) / 2] : (x[n / 2 - 1] + x[n / 2]) / 2; };
const medLo = a => { const x = sorted(a); return x.length ? x[Math.floor((x.length - 1) / 2)] : null; };
const medHi = a => { const x = sorted(a); return x.length ? x[Math.floor(x.length / 2)] : null; };
const LABEL = t => t == null ? null : `${Math.floor(t / 12) + 1}年目${[4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3][t % 12]}月`;
// 帯の文（画面に出た「手もとに残るお金」）を読む
const bandNet = s => { const m = /手もとに残るお金\n(-?[\d,]+)円/.exec(s.text || ''); return m ? +m[1].replace(/,/g, '') : null; };
const mean = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : null;
const yearOf = t => t < 12 ? 1 : t < 24 ? 2 : t < 36 ? 3 : 4;
const MONEY_HANDS = ['price', 'prep', 'staff', 'supplier', 'flyer', 'line', 'coupon']; // B の①と同じ7手
const BTN = { price: 5, prep: 3, supplier: 3, staff: 3, flyer: 3 };                    // ui.js の RV.OPTS（ramen-view.js:31〜37）。ほかは する／しない の2
const MON = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
const runs = [];
for (const f of files) {
  const d = load(f), F = d.final, R = F.res || {}, ts = Object.keys(R).map(Number).sort((a, b) => a - b);
  const kind = /-site2-/.test(f) ? 'site2' : /-risky-/.test(f) ? 'risky' : d.args.style;
  const lastT = ts.length ? ts[ts.length - 1] : -1;
  // ---- P1：月ごと ----
  const per = {};
  const P = t => (per[t] ||= { plan: 0, planMoney: 0, planBtn: 0, dec: 0, decCard: 0, decMoneyDiff: 0, decBtn: 0, decBig: 0, docs: 0, planScreens: 0 });
  for (const s of d.screens) {
    if (s.ramenT == null) continue; const x = P(s.ramenT);
    if (s.t === 'plan') { const k = s.planKeys || []; x.planScreens++; x.plan = k.length; x.planMoney = k.filter(h => MONEY_HANDS.includes(h)).length; x.planBtn = k.reduce((n, h) => n + (BTN[h] || 2), 0); }
    if (s.t === 'decision') {
      x.dec++; x.decBtn += (s.options || []).length;
      if (s.card) x.decCard++;
      if (Array.isArray(s.money)) {
        const pairs = new Set(s.money.map(m => m[1] + ':' + m[2])); if (pairs.size > 1) x.decMoneyDiff++;
        if (Math.max(...s.money.flatMap(m => [Math.abs(m[1]), Math.abs(m[2])])) >= 100000) x.decBig++;
      }
    }
    if (s.t === 'doc') x.docs++;
  }
  // 開店の前（ramenT が null の月）の判断
  const pre = d.screens.filter(s => s.ramenT == null && s.t === 'decision').map(s => s.id);
  // ---- P2：札の結果が返るまで（res[t].carried の x.t との差） ----
  const delay = {}; let carriedN = 0;
  for (const t of ts) for (const c of (R[t].carried || [])) { const k = t - c.t; delay[k] = (delay[k] || 0) + 1; carriedN++; }
  // ---- P3：口座の負の山 ----
  let neg = 0, rec = 0, inNeg = false;
  for (const t of ts) { const c = R[t].cash; if (c < 0 && !inNeg) { neg++; inNeg = true; } else if (c >= 0 && inNeg) { rec++; inNeg = false; } }
  let streak = 0, streak3 = false; for (const t of ts) { if (t < 12) continue; streak = R[t].op < 0 ? streak + 1 : 0; if (streak >= 3) streak3 = true; }
  const firstBlack = ts.find(t => R[t].op > 0);
  // ---- P4：開いた時点と触った回数 ----
  const openedHand = {}; for (const s of d.screens) if (s.t === 'plan' && s.ramenT != null) for (const k of s.planKeys || []) if (openedHand[k] == null) openedHand[k] = s.ramenT;
  const firstCard = {}; for (const [t, ids] of Object.entries(F.dealt || {})) for (const id of ids) if (firstCard[id] == null || +t < firstCard[id]) firstCard[id] = +t;
  const touch = {}; const pols = F.pols || {};
  for (const t of ts) { if (!t || !pols[t] || !pols[t - 1]) continue; for (const k of Object.keys(openedHand)) { if (openedHand[k] >= t) continue; const key = k === 'staff' ? 'parts' : k; if (JSON.stringify(pols[t][key]) !== JSON.stringify(pols[t - 1][key])) touch[k] = (touch[k] || 0) + 1; } }
  // ---- P5：ライバルの要因 ----
  let rivMoved = 0, rivTop = 0, rivMonths = 0;
  for (const t of ts) { const f = R[t].factors; if (!f) continue; rivMonths++; const ks = Object.keys(f).filter(k => k !== 'total'); if (Math.abs(f.rival || 0) >= 0.1) rivMoved++; const top = ks.sort((a, b) => Math.abs(f[b]) - Math.abs(f[a]))[0]; if (top === 'rival' && Math.abs(f.rival) > 0) rivTop++; }
  const rivals = (F.W && F.W.rivals) || [];
  // ---- 会社の大きさ（年度末と最後の月） ----
  const at = t => { const r = R[t]; if (!r) return null; const open = r.stores ? r.stores.filter(s => s.open !== false && s.sales != null).length : 1; return { t, stores: open, sales: Math.round(r.sales), cash: Math.round(r.cash), parts: t >= 12 ? r.staffParts : (pols[t] || {}).parts }; };
  const size = { y1: at(11), y2: at(23), y3: at(35), y4: at(38) };
  const maxStores = Math.max(1, ...ts.map(t => R[t].stores ? R[t].stores.filter(s => s.open !== false && s.sales != null).length : 1));
  // 2号店の月ごとのもうけ（2号店が開いて売上のある月）
  const site2op = ts.filter(t => R[t].stores && R[t].stores[1] && R[t].stores[1].open !== false && R[t].stores[1].sales != null).map(t => ({ t, op: Math.round(R[t].stores[1].op) }));
  const store1op = ts.filter(t => R[t].stores && R[t].stores[0]).map(t => ({ t, op: Math.round(R[t].stores[0].op) }));
  const dec = F.decisions || {}, pick = re => Object.entries(dec).filter(([k]) => re.test(k)).map(([k, v]) => k + '=' + v);
  const lastBand = [...d.screens].reverse().find(s => bandNet(s) != null);
  runs.push({ file: f, kind, style: d.args.style, seed: d.args.seed, end: lastT === 38 && !(F.W && F.W.bankrupt) ? '4年目6月まで' : LABEL(lastT), lastT, bandNetLast: lastBand ? bandNet(lastBand) : null, bandNetLastAt: lastBand ? lastBand.label : null, netRes: lastT >= 0 ? Math.round(R[lastT].cash - R[lastT].loan) : null, netCashW: F.W ? F.W.cash - F.W.loan - (F.W.short || 0) : null, bankrupt: !!(F.W && F.W.bankrupt), outcome: d.outcome, errors: d.errors.length,
    per, pre, delay, carriedN, neg, rec, streak3, firstBlack, finalNet: F.W ? F.W.cash - F.W.loan : null,
    openedHand, firstCard, touch, rivMoved, rivTop, rivMonths, rivalsClosed: rivals.filter(r => r.open === false).map(r => `${r.name}@${r.closedAt}`), rivalNew: rivals.some(r => r.id === 'rnew'),
    size, maxStores, site2op, store1op, picks: pick(/^(issue|dividend|site2|close|finance_asset)@/), worldCards: Object.values(F.dealt || {}).flat().filter(id => /^(ev_|minwage|foodup|costOmen|wheat|heat|rival_open)/.test(id)).length });
}
// ---- まとめ（打ち方ごと） ----
const kinds = [...new Set(runs.map(r => r.kind))];
const sum = {};
for (const k of kinds) {
  const rs = runs.filter(r => r.kind === k);
  const yr = (y, fn) => rs.map(r => { const t = Object.keys(r.per).map(Number).filter(t => yearOf(t) === y); return t.length ? mean(t.map(tt => fn(r.per[tt]))) : null; }).filter(v => v != null);
  const P1 = {};
  for (const y of [1, 2, 3, 4]) P1['y' + y] = {
    B_same_money: med(yr(y, x => x.planMoney + x.decMoneyDiff)),       // B と同じ定義を自分で書いたもの
    planMoney: med(yr(y, x => x.planMoney)), cardMoney: med(yr(y, x => x.decMoneyDiff)),
    A_allScenes: med(yr(y, x => x.plan + x.dec)),                      // 分け方A：開いた手の全部＋判断の画面の全部（お金を問わない）
    Bt_buttons: med(yr(y, x => x.planBtn + x.decBtn)),                 // 分け方B：押せる選択肢のボタンの数（作戦の机の全選択肢＋判断の全選択肢）
    C_bigCards: med(yr(y, x => x.decBig)),                             // 分け方C：1回で口座が10万円以上動きうる札だけ
    decScreens: med(yr(y, x => x.dec)),
    docPerDecision: med(rs.map(r => { const t = Object.keys(r.per).map(Number).filter(t => yearOf(t) === y); const a = t.reduce((n, tt) => n + r.per[tt].docs, 0), b = t.reduce((n, tt) => n + r.per[tt].dec + r.per[tt].planScreens, 0); return b ? a / b : null; })),
  };
  const firstMonths = {}; for (const t of [0, 1, 2, 3, 4]) firstMonths['t' + t] = { planMoney: med(rs.map(r => r.per[t] && r.per[t].planMoney)), cardMoney: med(rs.map(r => r.per[t] && r.per[t].decMoneyDiff)) };
  const delay = {}; for (const r of rs) for (const [d, n] of Object.entries(r.delay)) delay[d] = (delay[d] || 0) + n;
  const touch = {}; for (const r of rs) for (const [h, n] of Object.entries(r.touch)) touch[h] = (touch[h] || 0) + n;
  const sizeY = y => ({ stores: med(rs.map(r => r.size[y] && r.size[y].stores)), maxStores: Math.max(...rs.map(r => (r.size[y] && r.size[y].stores) || 0)), sales: med(rs.map(r => r.size[y] && r.size[y].sales)), salesHi: medHi(rs.map(r => r.size[y] && r.size[y].sales)), cash: med(rs.map(r => r.size[y] && r.size[y].cash)), cashLo: medLo(rs.map(r => r.size[y] && r.size[y].cash)), salesLo: medLo(rs.map(r => r.size[y] && r.size[y].sales)), cashHi: medHi(rs.map(r => r.size[y] && r.size[y].cash)), parts: med(rs.map(r => r.size[y] && r.size[y].parts)) });
  sum[k] = { runs: rs.length, reachedEnd: rs.filter(r => r.end === '4年目6月まで').length, bankrupt: rs.filter(r => r.bankrupt).length, bankruptMonth: rs.filter(r => r.bankrupt).map(r => r.lastT + 1).sort((a, b) => a - b),
    firstBlack: rs.map(r => LABEL(r.firstBlack)), finalNetMedian_W: med(rs.map(r => r.finalNet)), finalNetRes_med: med(rs.map(r => r.netRes)), finalNetRes_medLo: medLo(rs.map(r => r.netRes)), finalNetMedian_band: med(rs.map(r => r.bandNetLast)), finalNetMedianHi_band: medHi(rs.map(r => r.bandNetLast)), finalNet_band_each: rs.map(r => r.bandNetLast), P1, firstMonths, pre: med(rs.map(r => r.pre.length)),
    carried: rs.reduce((n, r) => n + r.carriedN, 0), delay, neg: rs.reduce((n, r) => n + r.neg, 0), rec: rs.reduce((n, r) => n + r.rec, 0), streak3: rs.filter(r => r.streak3).length,
    touch, rivMovedMedian: med(rs.map(r => r.rivMoved)), rivTopMedian: med(rs.map(r => r.rivTop)), rivMonths: med(rs.map(r => r.rivMonths)), rivalClosedRuns: rs.filter(r => r.rivalsClosed.length).length, rivalNewRuns: rs.filter(r => r.rivalNew).length, worldCardsMedian: med(rs.map(r => r.worldCards)),
    size: { y1: sizeY('y1'), y2: sizeY('y2'), y3: sizeY('y3'), y4: sizeY('y4') }, maxStoresEver: Math.max(...rs.map(r => r.maxStores)),
    picks: rs.flatMap(r => r.picks).reduce((o, p) => { const [k, v] = p.split('='); const kk = k.split('@')[0] + '=' + v; o[kk] = (o[kk] || 0) + 1; return o; }, {}) };
  if (k === 'site2') { const all = rs.flatMap(r => r.site2op.map(x => ({ ...x, file: r.file }))); sum[k].site2months = all.length; sum[k].site2loss = all.filter(x => x.op < 0).length; sum[k].site2profit = all.filter(x => x.op >= 0); sum[k].site2opRange = [Math.min(...all.map(x => x.op)), Math.max(...all.map(x => x.op))]; }
}
const detail = process.argv.includes('--runs');
console.log(JSON.stringify(detail ? { summary: sum, runs } : { files: files.length, summary: sum }, null, 1));
