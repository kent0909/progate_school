#!/usr/bin/env node
// ピヨ商店の1年目（js/sim/scenario.js）を、正しい記帳で、すべての判断の分かれ道について進めて検算する。
// ・判断ごとに枝分かれ（when のある判断は、その条件を満たす枝だけ）。会社がなくなる結末（final）でその枝は終わる
// ・すべての枝で：仕訳の貸借一致、科目の存在、書類のタップ欄に金額があること、書類を記帳するたびに預金がマイナスにならないこと、試算表の合計0
// ・判断の返り：同じ判断の別の選択肢を選んで、その後の出来事（書類の金額・会話・結末）がまったく同じになる判断は「返りのない判断」として失敗にする
// ・11月の資金不足：E社への支払いの直前の預金が、台本の preBank と一致し、手を打たないと足りない（不足額が正）こと
// Usage: node boki2/tools/sim-check.js   （--ramen [--runs N]：ラーメン版の無作為の通し試験 tools/sim-ramen.js）
if (process.argv.includes('--ramen')) { require('./ramen-view-check.js'); require('./sim-ramen.js'); return; }
global.window = global;
const path = require('path');
const root = path.join(__dirname, '..');
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/scenario.js', 'js/sim/year2.js'].forEach((f) => require(path.join(root, f)));
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
let leaves = 0, altN = 0;
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
      if (e.id === 'dividend' && D.__div && !(D.__div.divLimit(S) > 0)) err(`${label}：純資産が300万円未満なのに、配当の判断が出た（${JSON.stringify(S.decisions)}）`);
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
      // 配当の上限の3つの変種（docs/DESIGN-PRO3-ISSUE.md 2.4 の3）：純資産が300万円未満→none、300万円の線が先に効く→floor、準備金がもう資本金の4分の1→all、ほか→limit
      if (e.id === 'd-haito' && D.__div) {
        const V = D.__div, k = V.haitoKind(S), na = V.netAssets(S);
        const want = na < V.LINE ? 'none' : V.room(S) < (V.needRes(S) ? Math.floor((V.reNow(S) * 10) / 11) : V.reNow(S)) ? 'floor' : !V.needRes(S) ? 'all' : 'limit';
        if (k !== want || (okT[0] || {}).id !== want) err(`${label} d-haito：正解の札が ${(okT[0] || {}).id}（変種 ${k}）。純資産 ${na}・上限 ${V.divLimit(S)}・貯まり ${V.reNow(S)} なら ${want}（${JSON.stringify(S.decisions)}）`);
        if ((want === 'none') !== !(V.divLimit(S) > 0)) err(`${label} d-haito：純資産 ${na} と配当の上限 ${V.divLimit(S)} が食い違う（300万円未満なら上限0）`);
      }
    }
    // 増資の判断 issue のあと（2.4 の1・2）：株主の一覧・配当の明細・違法配当の請求額は、同じ株数（総株数＝30(+10)＋佐藤さんの株）
    if (e.id === 'zoushi' && D.__div) {
      const V = D.__div, a = val(e.ans, S), crOf = (acc) => a.cr.filter(([x]) => x === acc).reduce((t, [, v]) => t + v, 0), amt = V.amtOf(S), is = V.issueOf(S);
      if (amt !== is.n * is.p) err(`${label} zoushi：払込み ${amt} が ${is.n}株×${is.p}円 と合わない`);
      if (crOf('資本金') + crOf('資本準備金') !== amt || a.dr[0][1] !== amt) err(`${label} zoushi：資本金と資本準備金の合計が払込み ${amt} と合わない（${JSON.stringify(S.decisions)}）`);
      if (crOf('資本準備金') * 2 > amt) err(`${label} zoushi：資本準備金 ${crOf('資本準備金')} が払込みの2分の1を超える（会社法445条2項）`);
      const hs = V.holdersOf(S), tot = hs.reduce((t, [, n]) => t + n, 0);
      if (tot !== V.shares(S) || tot !== (S.decisions.uncle === 'equity' ? 40 : 30) + is.n) err(`${label} zoushi：株主の一覧の株数 ${tot} が総株数 ${V.shares(S)} と合わない`);
    }
    if (e.id === 'stockfee' && (B.accounts[val(e.ans, S).dr[0][0]] || {}).cat !== '費用') err(`${label} stockfee：株式交付費が費用でない`);
    // 配当（2.4 の4・5）：1株あたりの整数円×総株数、上限以内、準備金の積立、配ったあとの純資産が300万円以上（会社法458条・会社計算規則158条6号）
    if (e.id === 'dividend-dec' && D.__div) {
      const V = D.__div, d = V.divOf(S), r = V.resOf(S), o = S.decisions.dividend, sh = V.shares(S), dj = JSON.stringify(S.decisions);
      if (d % sh || d !== V.divPer(S) * sh) err(`${label} 配当 ${d} が、1株あたり ${V.divPer(S)}円×${sh}株 になっていない（${dj}）`);
      if ((o === 'max' || o === 'half') && d > V.divLimit(S)) err(`${label} 配当 ${d} が上限 ${V.divLimit(S)} を超える（${dj}）`);
      if (d + r > V.reNow(S)) err(`${label} 配当と準備金 ${d + r} が、もうけの貯まり ${V.reNow(S)} を超える（${dj}）`);
      if ((r === 0) !== (!V.needRes(S) || o === 'all')) err(`${label} 準備金の積立 ${r} が、積む必要（${V.needRes(S)}）と合わない（${dj}）`);
      if (o !== 'all' && V.netAssets(S) - d < V.LINE) err(`${label} 配ったあとの純資産 ${V.netAssets(S) - d} が300万円を下回る（${dj}）`);
      if (o === 'all' && (V.overOf(S) > 0) !== (d > V.divLimit(S))) err(`${label} 上限を超えた配当の額 ${V.overOf(S)} が合わない（${dj}）`);
    }
    if (e.id === 'pay-div' && D.__div) {
      const V = D.__div, rows = V.divRows(S), sum = rows.reduce((t, [, , v]) => t + v, 0);
      if (sum !== V.divOf(S)) err(`${label} pay-div：株主ごとの行の合計 ${sum} が配当 ${V.divOf(S)} と合わない`);
      const shown = val(e.doc.rows, S).filter((r) => /^うち /.test(r[0]));
      if (shown.length !== rows.length || shown.reduce((t, r) => t + r[1], 0) !== sum) err(`${label} pay-div：通帳の株主ごとの行が明細と合わない`);
    }
    // 株主資本等変動計算書（2.4 の6）：当期末残高＝純資産、新株の発行＝払込み、配当の行＝配当（year2 の ssCheck。engine の ssScreen も同じ関数で検算する）
    if (e.t === 'ss' && D.__y2 && D.__y2.ssCheck) for (const m of D.__y2.ssCheck(S, D.months[mi].year || 1)) err(`${label} ${e.id}：${m}（${JSON.stringify(S.decisions)}）`);
    if (e.t === 'ending') {
      if (!D.endings[e.id]) err(`${label}：結末 ${e.id} が SIM.endings にない`);
      ends[e.id] = (ends[e.id] || 0) + 1;
      S.hits = (S.hits || []).concat(e.id);
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
    // 会社の書き方（alt。台本の ev.alts と、B.kubun.examForm の表から作るもの）：貸借一致、科目の実在、正と違う、合計が正と同じ（docs/DESIGN-ROUND2.md 6.3）
    for (const x of [...(val(e.alts, S) || []), ...B.kubun.altsOf(a, e)]) {
      const al = x.entry, sa = (sd) => al[sd].reduce((t, y) => t + y[1], 0);
      if (sa('dr') !== sa('cr')) err(`${label} ${e.id}：alt（${x.form || '台本'}）の貸借が合わない`);
      if (sa('dr') !== sum('dr')) err(`${label} ${e.id}：alt（${x.form || '台本'}）の合計が正と違う`);
      if (JSON.stringify(al) === JSON.stringify(a)) err(`${label} ${e.id}：alt（${x.form || '台本'}）が正と同じ`);
      for (const [acc] of al.dr.concat(al.cr)) if (!B.accounts[acc]) err(`${label} ${e.id}：alt の科目がない ${acc}`);
      altN++;
    }
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
    // 棚卸減耗損・商品評価損のあと：繰越商品の残高＝帳簿の残り−減耗−評価損＝実地の数×低い方の値段（＋砂糖・紙コップ）
    if (e.id === 'hyoka') { const inv = S.T.reduce((t, x) => t + x.dr.filter(([q]) => q === '繰越商品').reduce((u, [, v]) => u + v, 0) - x.cr.filter(([q]) => q === '繰越商品').reduce((u, [, v]) => u + v, 0), 0); const sugar = S.decisions.volume === '3m' ? 110000 : 20000; if (inv !== sugar + 240 * 100 + 40 * 60) err(`${label} hyoka：繰越商品 ${inv} が、実地×低い方の値段 ${sugar + 240 * 100 + 40 * 60} と合わない`); }
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
const comboLeaves = [];
function finish(S, where) {
  leaves++;
  if (S.combo) comboLeaves.push({ combo: S.combo, d: S.decisions, hits: S.hits || [] });
  traces.push({ d: S.decisions, tr: S.tr.join('|') });
  const bal = {};
  for (const e of S.T) { for (const [a, v] of e.dr) bal[a] = (bal[a] || 0) + v; for (const [a, v] of e.cr) bal[a] = (bal[a] || 0) - v; }
  const total = Object.values(bal).reduce((t, v) => t + v, 0);
  if (total !== 0) err(`${where}：試算表の合計が合わない ${total}（${JSON.stringify(S.decisions)}）`);
}
run(0, { T: [], tr: [], decisions: {} });
// 2027年度の区分表を選んだ人の道（家賃は支払リース料・前払費用）。2年目は最初の選択肢
run(0, { T: [], tr: [], decisions: {}, mode: '2027', varied: true });
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
// 増資の判断の組み合わせ（2.4 の9）：1年目が標準の枝（1年目の判断はすべて最初の選択肢。combo が決めたものは除く）で、設計どおりに結末に届く／届かない
{
  const std = (x) => Object.entries(x.d).every(([k, v]) => !(k in Y1FIRST) || k in x.combo || Y1FIRST[k] === v);
  const expect = [
    [{ issue: 's50' }, (x) => !x.hits.includes('be5-warn') && x.d.dividend === undefined, '50株・標準の枝：純資産が300万円未満で配当の判断が出ず、BE5 に届かない'],
    [{ uncle: 'equity', issue: 's50', dividend: 'all' }, (x) => x.hits.includes('be5-warn'), '50株・おじさんが株主：配当でき、全部配ると BE5 の警告に届く'],
    [{ issue: 's100', capital: 'half', dividend: 'all' }, (x) => !x.hits.includes('be5-warn'), '100株・半分を資本準備金：準備金が4分の1に届いていて、全部配っても上限を超えない'],
  ];
  for (const [c, ok, what] of expect) {
    const ls = comboLeaves.filter((x) => JSON.stringify(x.combo) === JSON.stringify(c) && std(x));
    if (!ls.length) err(`組み合わせ ${JSON.stringify(c)}：標準の枝が1本もない`);
    else if (!ls.every(ok)) err(`組み合わせ ${JSON.stringify(c)}：${what}、になっていない（${JSON.stringify(ls.find((x) => !ok(x)))}）`);
  }
}
// 3級既習の近道（SIM.pro3）：自動にする型・確認だけにする発見・先取りする語が、1年目の3級の範囲に収まっていること
{ const P = D.pro3; if (P) {
  for (const k of P.kinds) { const r = D.rules[k]; if (!r || !r.conds.some((c) => c.ok && !c.broad)) err(`近道：型 ${k} に、狭い正しい条件文がない`); }
  const y1 = flat.filter((x) => (D.months[x.mi].year || 1) === 1).map((x) => x.e);
  // プロローグの段（steps）の語と、自動仕訳の導入（engine の ruleScreen）で教える「自動仕訳」も1年目の語
  const y1words = new Set([...y1.flatMap((e) => [...((e.b4 || {}).teaches || []), ...(e.teaches || []), ...(e.steps || []).flatMap((st) => st.teaches || [])]), ...Object.values(D.namings).flatMap((n) => n.teaches || []), '自動仕訳']);
  for (const w of P.words) if (!y1words.has(w)) err(`近道：先取りの語「${w}」は1年目に教える語ではない`);
  for (const id of P.lite) { const e = y1.find((x) => x.t === 'discover' && x.id === id); if (!e) { err(`近道：確認だけの発見 ${id} が1年目にない`); continue; } const out = (e.b4.teaches || []).filter((w) => !P.words.includes(w)); if (out.length) err(`近道：${id} は3級でない語（${out.join('・')}）を教えるので、確認だけにできない`); }
  for (const e of y1.filter((x) => x.t === 'discover' && x.id !== 'prologue')) if (!P.lite.includes(e.id) && !P.keep.includes(e.id)) err(`近道：1年目の発見 ${e.id} が、確認だけ（lite）にも残す（keep）にも入っていない`);
  for (const k of P.intros) if (!D.kindIntro[k]) err(`近道：はじめての動き ${k} がない`);
  const covered = P.gate.flatMap((g) => g.kinds);
  if (new Set(covered).size !== covered.length || P.kinds.some((k) => !covered.includes(k))) err('近道：切符の3問が、自動にする6型を重なりなく覆っていない');
  for (const g of P.gate) { const d = g.ans.dr.reduce((t, [, v]) => t + v, 0), c = g.ans.cr.reduce((t, [, v]) => t + v, 0); if (d !== c) err(`近道：切符「${g.q}」の貸借が合わない`); for (const [a] of [...g.ans.dr, ...g.ans.cr]) if (!B.accounts[a]) err(`近道：切符の科目 ${a} がない`); }
} }

// 製品の払出（先入先出法・平均法）：どの方法・本数でも、出荷の原価の合計＋3月末の残り＝できた瓶の原価の合計。先入先出の1本目は古い山から
{ const F = D.__fac; if (F && F.fgFlow) for (const payout of ['fifo', 'avg']) for (const lots of ['1000', '1500']) for (const yprice of ['same', 'low', 'high']) for (const line2 of ['buy', 'wait']) {
  const S = { decisions: { payout, lots, yprice, line2 } }, f = F.fgFlow(S), ms = [11, 12, 1, 2, 3];
  const made = ms.reduce((t, m) => t + F.done(S, m), 0), out = ms.reduce((t, m) => t + f[m].cost, 0);
  if (out + f[3].endC !== made) err(`製品の払出（${payout}・${lots}本）：出荷の原価 ${out} ＋ 残り ${f[3].endC} ができた瓶 ${made} と合わない`);
  if (ms.reduce((t, m) => t + F.doneN(S, m), 0) - 800 * ms.length !== f[3].endN) err(`製品の払出（${payout}）：残りの本数が合わない`);
  if (payout === 'fifo' && f[12].cost !== Math.round((F.done(S, 11) * 800) / F.doneN(S, 11))) err(`製品の払出（先入先出）：12月の出荷が11月の瓶から出ていない（${f[12].cost}）`);
} }

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`OK：${leaves} 本の分かれ道で検算した（会社の書き方 alt ${altN} 件も検算。結末：${Object.entries(ends).map(([k, v]) => `${k} ${v}`).join('・')}）`);
