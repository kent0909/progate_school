#!/usr/bin/env node
// ピヨ商店の1年目（js/sim/scenario.js）を、正しい記帳で、すべての判断の分かれ道について進めて検算する。
// ・判断ごとに枝分かれ（when のある判断は、その条件を満たす枝だけ）。会社がなくなる結末（final）でその枝は終わる
// ・すべての枝で：仕訳の貸借一致、科目の存在、書類のタップ欄に金額があること、書類を記帳するたびに預金がマイナスにならないこと、試算表の合計0
// ・判断の返り：同じ判断の別の選択肢を選んで、その後の出来事（書類の金額・会話・結末）がまったく同じになる判断は「返りのない判断」として失敗にする
// ・11月の資金不足：E社への支払いの直前の預金が、台本の preBank と一致し、手を打たないと足りない（不足額が正）こと
// Usage: node boki2/tools/sim-check.js
global.window = global;
const path = require('path');
const root = path.join(__dirname, '..');
['js/core.js', 'js/data/accounts.js', 'js/sim/scenario.js', 'js/sim/year2.js'].forEach((f) => require(path.join(root, f)));
const B = window.BOKI, D = window.SIMDATA;
const errors = [];
const err = (m) => { if (!errors.includes(m)) errors.push(m); };
const val = (x, S) => (typeof x === 'function' ? x(S) : x);
const bank = (S) => S.T.reduce((t, e) => t + e.dr.filter(([a]) => a === '普通預金').reduce((x, [, v]) => x + v, 0) - e.cr.filter(([a]) => a === '普通預金').reduce((x, [, v]) => x + v, 0), 0);
const flat = [];
D.months.forEach((m, mi) => m.events.forEach((e) => flat.push({ e, mi, label: m.label })));
// 締め切り（engine の closingEntries と同じ）：収益・費用を損益へ、差を繰越利益剰余金へ
function closingOf(T, mi) {
  const b = {};
  for (const e of T) { for (const [a, v] of e.dr) b[a] = (b[a] || 0) + v; for (const [a, v] of e.cr) b[a] = (b[a] || 0) - v; }
  const cat = (a) => (B.accounts[a] || {}).cat, rev = [], exp = [];
  for (const [a, v] of Object.entries(b)) { if (!v) continue; if (cat(a) === '収益') rev.push([a, -v]); else if (cat(a) === '費用') exp.push([a, v]); }
  const R = rev.reduce((t, [, v]) => t + v, 0), X = exp.reduce((t, [, v]) => t + v, 0), ni = R - X, y = D.months[mi].year || 1, out = [];
  if (rev.length) out.push({ dr: rev, cr: [['損益', R]] });
  if (exp.length) out.push({ dr: [['損益', X]], cr: exp });
  if (ni > 0) out.push({ dr: [['損益', ni]], cr: [['繰越利益剰余金', ni]] }); else if (ni < 0) out.push({ dr: [['繰越利益剰余金', -ni]], cr: [['損益', -ni]] });
  return out.map((e) => Object.assign(e, { y, closing: true }));
}
let leaves = 0;
const ends = {};

// 1年目の判断の最初の選択肢と、2年目を替えて試す1年目の代表の枝
const Y1FIRST = {};
D.months.forEach((m) => { if ((m.year || 1) === 1) m.events.filter((e) => e.t === 'decision').forEach((e) => { Y1FIRST[e.id] = e.options[0].id; }); });
const Y1REPS = [{}, { uncle: 'equity', report: 'cash', volume: '3m' }, { recon: 'align', dun: 'send', credit: 'cash', dep: 'rate' }, { crunch: 'nothing', crunch2: 'hiloan', kessan: 'follow', kessan2: 'keep' }];
function run(i, S) {
  for (; i < flat.length; i++) {
    const { e, label, mi } = flat[i];
    S.mi = mi;
    if (e.when && !e.when(S)) continue;
    if (e.t !== 'decision') S.tr.push(trace(e, S));
    if (e.t === 'decision') {
      // 2年目からは枝が多すぎるので、「ほかの判断は最初の選択肢のまま、1つだけ替える」で検算する。
      // 結末に届く組み合わせ（SIM.combos）は、その組み合わせのとおりにも進める
      const y2 = (D.months[mi].year || 1) >= 2;
      const forced = S.combo && S.combo[e.id];
      // 1年目のすべての枝は、2年目を最初の選択肢で通す。2年目の判断を替えるのは、1年目の代表の枝（Y1REPS）の上だけ
      const rep = !y2 || Y1REPS.some((r) => Object.entries(S.decisions).every(([k, v]) => !(k in Y1FIRST) || (r[k] || Y1FIRST[k]) === v));
      const opts = forced ? e.options.filter((o) => o.id === forced) : y2 && (S.varied || !rep) ? [e.options[0]] : e.options;
      for (const o of opts) run(i + 1, { ...S, T: S.T.slice(), tr: S.tr.slice(), decisions: { ...S.decisions, [e.id]: o.id }, varied: S.varied || (y2 && !forced && o !== e.options[0]) });
      return;
    }
    // 会社の状態で正解が変わる発見（ev.dynamic）：正解の札がちょうど1つ・正解の理由がちょうど1つ。配当の上限は、正解の札が試算の上限（divLimit）と同じこと
    if (e.t === 'discover' && typeof e.dynamic === 'function') {
      const x = e.dynamic(S, e), okT = x.b2.targets.filter((g) => g.ok), okR = x.b2.reasons.filter((r) => r.ok);
      const sortL = ['sort', 'flow'].includes(x.b2.layout);
      if (sortL ? !x.b2.tokens.length || x.b2.tokens.some((t) => !x.b2.targets.some((g) => g.id === t.target)) : okT.length !== 1) err(`${label} ${e.id}：分ける札か正解の札がおかしい`);
      if (okR.length !== 1) err(`${label} ${e.id}：正解の理由が ${okR.length}（1つ）`);
      if (e.id === 'd-haito' && D.__div) { const all = !D.__div.needRes(S); if ((okT[0] || {}).id !== (all ? 'all' : 'limit')) err(`${label} d-haito：準備金を積む必要が${all ? 'ない' : 'ある'}（上限 ${D.__div.divLimit(S)}・貯まり ${D.__div.reNow(S)}）のに、正解の札が ${(okT[0] || {}).id}（${JSON.stringify(S.decisions)}）`); }
    }
    if (e.t === 'ending') {
      if (!D.endings[e.id]) err(`${label}：結末 ${e.id} が SIM.endings にない`);
      ends[e.id] = (ends[e.id] || 0) + 1;
      if (D.endings[e.id] && D.endings[e.id].final) { finish(S, `結末 ${e.id}`); return; }
      continue;
    }
    if (e.id === 'pap11-E') {
      const pre = bank(S);
      if (S.__pre !== undefined && S.__pre !== pre) err(`preBank の不一致`);
    }
    if (e.id === 'd-cash') {
      const pre = bank(S);
      if (pre !== D.__preBank(S)) err(`11月10日の前の預金 ${pre} が台本の preBank ${D.__preBank(S)} と合わない（${JSON.stringify(S.decisions)}）`);
      if (pre >= 300000) err(`手を打たなくても11月10日に払えてしまう（${pre}）`);
    }
    if (e.t === 'closing') {
      // 締め切りの前に、工場の途中の箱（製造間接費・賃金・差異）が空になっていること（決算書に載せる場所がない）
      const y = D.months[mi].year || 1, b = {};
      for (const x of S.T) { for (const [a, v] of x.dr) b[a] = (b[a] || 0) + v; for (const [a, v] of x.cr) b[a] = (b[a] || 0) - v; }
      for (const [a, v] of Object.entries(b)) if (v && (B.accounts[a] || {}).cat === 'その他' && !/累計額$|^貸倒引当金$/.test(a) && a !== '損益') err(`${label}：締め切りの前に ${a} の残高 ${v} が残っている（${JSON.stringify(S.decisions)}）`);
      S.T.push(...closingOf(S.T, mi)); continue;
    }
    if (e.t !== 'doc') continue;
    const a = val(e.ans, S);
    const sum = (s) => a[s].reduce((t, x) => t + x[1], 0);
    if (sum('dr') !== sum('cr')) err(`${label} ${e.id}: 貸借不一致 ${sum('dr')} / ${sum('cr')}`);
    for (const [acc] of a.dr.concat(a.cr)) if (!B.accounts[acc]) err(`${label} ${e.id}: 科目がない ${acc}`);
    const taps = val(e.doc.rows, S).filter((r) => r[2] === 'amt').map((r) => r[1]);
    for (const [, v] of a.dr.concat(a.cr)) if (!taps.includes(v)) err(`${label} ${e.id}: 金額 ${v} が書類のタップ欄にない`);
    // 消費税の端数：書類の「消費税（8％）」「（10％）」の行は、その前の金額の行（前の消費税の行のあとから）の合計×率の切り捨て
    // （「税抜」と書いた行があれば、その行がもとの金額）
    { const rows = val(e.doc.rows, S); let base = 0, nuki = null;
      for (const r of rows) {
        const m = String(r[0]).match(/消費税（(8|10)％）/);
        if (m && r[2] === 'amt') { const b = nuki != null ? nuki : base, want = Math.floor((b * +m[1]) / 100); if (r[1] !== want) err(`${label} ${e.id}：消費税 ${r[1]} が、${b}×${m[1]}％の切り捨て ${want} と合わない`); base = 0; nuki = null; continue; }
        if (r[2] !== 'amt') continue;
        if (/税抜/.test(r[0])) nuki = r[1];
        else if (!/合計|入金|税込|売上にする額|お支払|お預け入れ|お引出し|^うち/.test(r[0])) base += r[1];
      } }
    // 罠（trapEntry）と、社長が書いた帳簿（wrote）：貸借が合い、正しい仕訳と違う（月末の見直し・監査の点検で必ず差が出る）
    for (const k of ['trapEntry', 'wrote']) if (e[k]) { const w = val(e[k], S), sw = (x) => w[x].reduce((t, y) => t + y[1], 0); if (sw('dr') !== sw('cr')) err(`${label} ${e.id}：${k} の貸借が合わない`); if (JSON.stringify(w) === JSON.stringify(a)) err(`${label} ${e.id}：${k} が正しい仕訳と同じ`); }
    // 税金の見込み：その年の収益−費用（法人税等を除く）の3割、100円未満切り捨て
    if (e.kind === 'tax') {
      const y = D.months[mi].year || 1, plA = (x) => ['収益', '費用'].includes((B.accounts[x] || {}).cat) && x !== '法人税等';
      const pre = S.T.filter((x) => !x.closing && (x.y || 1) === y).reduce((t, x) => t + x.cr.reduce((u, [k, v]) => u + (plA(k) ? v : 0), 0) - x.dr.reduce((u, [k, v]) => u + (plA(k) ? v : 0), 0), 0);
      const want = Math.max(0, Math.floor((pre * 0.3) / 100) * 100);
      if (a.dr[0][1] !== want) err(`${label} ${e.id}：税金 ${a.dr[0][1]} が、もうけ ${pre} の3割 ${want} と合わない`);
    }
    S.T.push({ dr: a.dr, cr: a.cr, y: D.months[mi].year || 1, ev: e.id });
    const b = bank(S);
    // 税金の作り直し：書いたあと、その年の法人税等が作り直したもうけの3割と合う
    if (e.kind === 'taxfix') {
      const y = D.months[mi].year || 1, yr = S.T.filter((x) => !x.closing && (x.y || 1) === y), plA = (x) => ['収益', '費用'].includes((B.accounts[x] || {}).cat) && x !== '法人税等';
      const pre = yr.reduce((t, x) => t + x.cr.reduce((u, [k, v]) => u + (plA(k) ? v : 0), 0) - x.dr.reduce((u, [k, v]) => u + (plA(k) ? v : 0), 0), 0);
      const booked = yr.reduce((t, x) => t + x.dr.reduce((u, [k, v]) => u + (k === '法人税等' ? v : 0), 0) - x.cr.reduce((u, [k, v]) => u + (k === '法人税等' ? v : 0), 0), 0);
      if (booked !== Math.max(0, Math.floor((pre * 0.3) / 100) * 100)) err(`${label} ${e.id}：作り直したあとの税金 ${booked} が、もうけ ${pre} の3割と合わない`);
    }
    if (b < 0) err(`${label} ${e.id}: 預金がマイナス ${b}（${JSON.stringify(S.decisions)}）`);
  }
  finish(S, '1年の終わり');
}
// その後に起きたことの記録（判断そのものは含めない）
// ポイント（2号店）：配分と使われた分が割り切れ、使われた累計がつけた累計を超えない
{ const P = (D.__y2 || {}).points; if (P) {
  if (P.PT_N * P.PT_PTS % (P.PT_N + P.PT_PTS) || P.PT_N * P.PT_PTS / (P.PT_N + P.PT_PTS) !== P.PT_ALLOC) err(`ポイント：配分 ${P.PT_ALLOC} が ${P.PT_N}×${P.PT_PTS}÷${P.PT_N + P.PT_PTS} と合わない`);
  let got = 0, used = 0; for (const m of [9, 10, 11, 12, 1, 2, 3]) { got += P.PT_PTS; used += P.PT_USE[m] || 0; if (P.PT_USE[m] && !Number.isInteger(P.ptB(P.PT_USE[m]))) err(`ポイント：${m}月の使われた分が割り切れない`); if (used > got) err(`ポイント：${m}月に、使われた累計が、つけた累計を超えた`); }
} }
function trace(e, S) {
  if (e.t === 'doc') return `${e.id}:${JSON.stringify(val(e.ans, S))}`;
  if (e.t === 'talk') return `${e.id || ''}:${JSON.stringify(val(e.lines, S))}`;
  return `${e.t}:${e.id || ''}`;
}
const traces = [];
function finish(S, where) {
  leaves++;
  traces.push({ d: S.decisions, tr: S.tr.join('|') });
  const bal = {};
  for (const e of S.T) { for (const [a, v] of e.dr) bal[a] = (bal[a] || 0) + v; for (const [a, v] of e.cr) bal[a] = (bal[a] || 0) - v; }
  const total = Object.values(bal).reduce((t, v) => t + v, 0);
  if (total !== 0) err(`${where}：試算表の合計が合わない ${total}（${JSON.stringify(S.decisions)}）`);
}
run(0, { T: [], tr: [], decisions: {} });
// 結末に届く2年目の判断の組み合わせ（1年目は標準の枝で）
for (const combo of D.combos || []) run(0, { T: [], tr: [], decisions: {}, combo, varied: true });
// 判断ごとに：ほかの判断をそろえたとき、選択肢を変えても後の出来事が同じなら「返りがない」
for (const { e } of flat.filter((x) => x.e.t === 'decision')) {
  const groups = {};
  for (const t of traces) {
    if (!(e.id in t.d)) continue;
    const rest = JSON.stringify(Object.entries(t.d).filter(([k]) => k !== e.id).sort());
    (groups[rest] = groups[rest] || {})[t.d[e.id]] = t.tr;
  }
  const same = Object.values(groups).filter((g) => Object.keys(g).length > 1 && new Set(Object.values(g)).size < Object.keys(g).length);
  if (same.length && same.length === Object.values(groups).filter((g) => Object.keys(g).length > 1).length) err(`判断 ${e.id}：選択肢を変えても、その後の書類・会話・結末が変わらない（返りのない判断）`);
}
for (const id of Object.keys(D.endings)) if (!ends[id] && !D.endings[id].ifOnly) err(`結末 ${id} に、どの枝からも到達しない`);

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK：${leaves} 本の分かれ道で検算した（結末：${Object.entries(ends).map(([k, v]) => `${k} ${v}`).join('・')}）`);
