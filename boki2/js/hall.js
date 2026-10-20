// 検定会場（本試験の形の模試）。学習ゲーム（app.js）と試作（sim）の両方から使う部品。
// 使う側は B.hall.use(ctx) で、画面を描く場所・成績の置き場・記録・移動などを渡す（ctx の形は下の DEFAULT_CTX）。
(function () {
  'use strict';
  const B = window.BOKI;
  const H = (B.hall = {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => { if (n === null || n === undefined || n === '') return ''; const x = Number(n); return isFinite(x) ? x.toLocaleString('ja-JP', { maximumFractionDigits: 4 }) : String(n); };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  // 使う側から受け取るもの
  const noop = () => {};
  const DEFAULT_CTX = {
    root: null, // 画面を描く要素
    state: { exams: [], examSeen: [] }, // 成績（通しの回の記録）と、最近出した問題
    chapters: [], // 章（qs に _key・_ch を持つ）
    save: noop, hist: () => [0, 0], cleared: () => false, record: noop,
    y27: () => false, today: () => new Date().toISOString().slice(0, 10),
    go: noop, lesson: noop, review: noop, guard: noop, cleanup: noop,
    reward: noop, after: noop, toast: (m) => alert(m), modal: null,
    sfx: { ok: noop, ng: noop, win: noop, lose: noop, confetti: noop },
    icons: { paper: '', x: '×' },
  };
  let CTX = DEFAULT_CTX;
  const ctx = () => CTX;
  // 使う側が modal を渡さないときの、簡単な確認の窓
  const simpleModal = (html, buttons) => {
    const ov = document.createElement('div');
    ov.className = 'overlay center';
    ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}<div class="row">${buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-mi="${i}">${b.t}</button>`).join('')}</div></div>`;
    ov.addEventListener('click', (e) => { const b = e.target.closest('[data-mi]'); if (!b) return; ov.remove(); const fn = buttons[+b.dataset.mi].on; if (fn) fn(); });
    document.body.appendChild(ov);
  };
  DEFAULT_CTX.modal = simpleModal;
  H.use = (c) => { CTX = Object.assign({}, DEFAULT_CTX, c); if (!c.modal) CTX.modal = simpleModal; CTX.sfx = Object.assign({}, DEFAULT_CTX.sfx, c.sfx || {}); return H; };
  const chMap = () => { const m = {}; ctx().chapters.forEach((c) => { m[c.id] = c; }); return m; };

  /* ---------- 書式（[[je:..]] [[t:..]] [[box:..]]・表） ---------- */
  function parseRows(side) {
    return (side || '').split(',').map((x) => x.trim()).filter(Boolean).map((r) => {
      const p = r.split(/\s+/);
      let amt = null;
      if (p.length > 1 && /^(-?[\d.]+|\?|？)$/.test(p[p.length - 1])) amt = p.pop();
      return { label: p.join(' '), amt };
    });
  }
  const showAmt = (a) => (a == null ? '' : a === '?' || a === '？' ? '？' : fmt(a));
  function jeTable(dr, cr) {
    const n = Math.max(dr.length, cr.length);
    let rows = '';
    for (let i = 0; i < n; i++) { const d = dr[i] || {}, c = cr[i] || {}; rows += `<tr><td>${esc(d.label || '')}</td><td class="amt">${showAmt(d.amt)}</td><td class="sep">${esc(c.label || '')}</td><td class="amt">${showAmt(c.amt)}</td></tr>`; }
    return `<div class="tbl-wrap"><table class="je"><tr><th class="d" colspan="2">借方</th><th class="c" colspan="2">貸方</th></tr>${rows}</table></div>`;
  }
  function tAcc(body, kind) {
    const [name, l, r] = body.split('|');
    const col = (rows) => rows.map((x) => `<div class="tacc-row"><span>${esc(x.label)}</span><span class="amt">${showAmt(x.amt)}</span></div>`).join('');
    return `<div class="tacc ${kind === 'box' ? 'boxd' : ''}"><div class="tacc-name">${esc((name || '').trim())}</div><div class="tacc-body"><div>${col(parseRows(l))}</div><div>${col(parseRows(r))}</div></div></div>`;
  }
  function rich(s) {
    if (!s) return '';
    let out = String(s).replace(/\[\[(je|t|box):([\s\S]*?)\]\]/g, (m, k, body) => { if (k === 'je') { const [d, c] = body.split('|'); return jeTable(parseRows(d), parseRows(c)); } return tAcc(body, k); });
    out = out.replace(/\[\[try:[\s\S]*?\]\]/g, '');
    out = out.replace(/<table(?![^>]*class="je")/g, '<div class="tbl-wrap"><table').replace(/<\/table>(?!<\/div>)/g, '</table></div>');
    return out;
  }
  const entryTable = (e) => (e === 'none' ? '<p><b>仕訳なし</b></p>' : jeTable(e.dr.map(([a, v]) => ({ label: a, amt: v })), e.cr.map(([a, v]) => ({ label: a, amt: v }))));
  H.rich = rich; H.entryTable = entryTable;

  /* ---------- 科目と仕訳 ---------- */
  function accOrder(list) {
    const ci = (a) => { const c = (B.accounts[a] || {}).cat || 'その他'; const i = ['資産', '負債', '純資産', '収益', '費用', 'その他'].indexOf(c); return i < 0 ? 9 : i; };
    return list.slice().sort((a, b) => ci(a) - ci(b));
  }
  const ansAccounts = (q) => { const out = []; for (const e of [q.ans, ...(q.alt || [])]) if (e && e !== 'none') for (const s of ['dr', 'cr']) for (const [a] of e[s]) out.push(a); return out; };
  function accOptions(q) {
    const ans = ansAccounts(q);
    const pool = q.opts && q.opts.length ? q.opts : (q._ch && q._ch.accounts) || [];
    const set = new Set([...pool, ...ans]);
    if (set.size < 8) { const cats = new Set(ans.map((a) => (B.accounts[a] || {}).cat)); const extra = shuffle(Object.keys(B.accounts).filter((a) => cats.has(B.accounts[a].cat) && !set.has(a))); while (set.size < 8 && extra.length) set.add(extra.pop()); }
    return [...set];
  }
  function normEntry(e) { if (e === 'none') return 'none'; const m = { dr: {}, cr: {} }; for (const s of ['dr', 'cr']) for (const [a, v] of e[s]) m[s][a] = (m[s][a] || 0) + v; return m; }
  function sameEntry(a, b) {
    if (a === 'none' || b === 'none') return a === b;
    for (const s of ['dr', 'cr']) { const ka = Object.keys(a[s]), kb = Object.keys(b[s]); if (ka.length !== kb.length) return false; for (const k of ka) if (a[s][k] !== b[s][k]) return false; }
    return true;
  }
  /* ---------- CBT-style inputs (used by the mock exam) ---------- */
  // Accepts what people type in the real CBT: half/full-width digits, commas, 円, and △/▲/- for negatives.
  function toNum(s) {
    if (s == null) return null;
    let t = String(s).trim().replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[,，\s円]/g, '');
    if (t === '') return null;
    let neg = false;
    if (/^[△▲\-−－ー]/.test(t)) { neg = true; t = t.replace(/^[△▲\-−－ー]/, ''); }
    if (!/^\d*\.?\d+$/.test(t)) return NaN;
    return (neg ? -1 : 1) * Number(t);
  }
  // 本番の金額欄は半角数字だけ（カンマ・円・全角は入らない）。マイナスは「-」か「△」。
  const strictNum = (s) => { const t = String(s == null ? '' : s).trim(); if (t === '') return null; if (!/^[-△]?\d+(\.\d+)?$/.test(t)) return NaN; return toNum(t); };
  const halfOnlyWarn = (x) => { const bad = x.value.trim() !== '' && Number.isNaN(strictNum(x.value)); x.classList.toggle('halfbad', bad); x.title = bad ? '半角の数字だけで入力（カンマ・円・全角は使えない）' : ''; return bad; };
  // 第1問の候補：本番と同じく問題ごとに5〜8個。正解の科目に、まちがえやすい科目（問題が用意したもの→同じ章→同じ分類）を混ぜる。
  function shortOptions(q) {
    const ans = [...new Set(ansAccounts(q))];
    const n = Math.min(8, Math.max(6, ans.length + 2));
    const set = new Set(ans);
    const add = (list) => { for (const a of shuffle(list)) { if (set.size >= n) return; if (!set.has(a)) set.add(a); } };
    add(q.opts || []);
    add((q._ch && q._ch.accounts) || []);
    const cats = new Set(ans.map((a) => (B.accounts[a] || {}).cat));
    add(Object.keys(B.accounts).filter((a) => cats.has(B.accounts[a].cat)));
    return shuffle([...set]);
  }
  function mountJournalCBT(q, el, o = {}) {
    const need = q.ans === 'none' ? 1 : Math.max(q.ans.dr.length, q.ans.cr.length);
    const N = Math.max(4, need + 1);
    const opts = o.exam ? shortOptions(q) : accOrder(accOptions(q));
    const optHTML = `<option value="">　</option><option value="__none">仕訳なし</option>${opts.map((a) => `<option value="${esc(a)}">${esc(a)}</option>`).join('')}`;
    el.innerHTML = `<div class="cbt-je"><table><thead><tr><th colspan="2" class="d">借方</th><th colspan="2" class="c">貸方</th></tr><tr><th>勘定科目</th><th>金額</th><th>勘定科目</th><th>金額</th></tr></thead><tbody>${Array.from({ length: N }, (_, i) => `<tr data-r="${i}">${['dr', 'cr'].map((s) => `<td><select data-s="${s}" aria-label="${s === 'dr' ? '借方' : '貸方'}の勘定科目 ${i + 1}行目">${optHTML}</select></td><td><input data-s="${s}" inputmode="numeric" autocomplete="off" spellcheck="false" aria-label="${s === 'dr' ? '借方' : '貸方'}の金額 ${i + 1}行目"></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    const num = o.exam ? strictNum : toNum;
    if (o.exam) el.addEventListener('input', (e) => { if (e.target.matches('input')) halfOnlyWarn(e.target); });
    const rows = () => $$('tbody tr', el).map((tr) => ({ tr, dr: { a: $('select[data-s="dr"]', tr).value, raw: $('input[data-s="dr"]', tr).value, v: num($('input[data-s="dr"]', tr).value) }, cr: { a: $('select[data-s="cr"]', tr).value, raw: $('input[data-s="cr"]', tr).value, v: num($('input[data-s="cr"]', tr).value) } }));
    // 本番の採点で0点になる書き方：同じ科目を同じ側に2行、半角でない金額
    function form() {
      const rs = rows(), dup = [], bad = [];
      for (const s of ['dr', 'cr']) { const seen = new Set(); for (const r of rs) if (r[s].a && r[s].a !== '__none') { if (seen.has(r[s].a)) dup.push(r[s].a); seen.add(r[s].a); } }
      for (const r of rs) for (const s of ['dr', 'cr']) if (r[s].raw.trim() !== '' && Number.isNaN(r[s].v)) bad.push(r[s].raw.trim());
      return { dup: [...new Set(dup)], bad };
    }
    function userEntry() {
      const rs = rows();
      if (rs.some((r) => r.dr.a === '__none' || r.cr.a === '__none')) return 'none';
      const e = { dr: [], cr: [] };
      for (const r of rs) for (const s of ['dr', 'cr']) if (r[s].a && r[s].v > 0) e[s].push([r[s].a, Math.round(r[s].v)]);
      return normEntry(e);
    }
    const accSet = (m) => (m === 'none' ? 'none' : ['dr', 'cr'].map((s) => Object.keys(m[s]).sort().join('|')).join('/'));
    return {
      answered: () => $$('select, input', el).some((x) => x.value.trim() !== ''),
      check() {
        const u = userEntry(), f = o.exam ? form() : { dup: [], bad: [] };
        const same = [q.ans, ...(q.alt || [])].some((e) => sameEntry(u, normEntry(e)));
        const ok = same && !f.dup.length && !f.bad.length;
        // 誤りの見立て：科目は合っていて金額だけ違う→計算、書き方の規則違反→形式
        const accOk = [q.ans, ...(q.alt || [])].some((e) => accSet(normEntry(e)) === accSet(u));
        const why = ok ? '' : f.dup.length ? 'dup' : f.bad.length ? 'half' : accOk ? 'amount' : 'account';
        return { ok, ratio: ok ? 1 : 0, why, dup: f.dup, bad: f.bad };
      },
      reveal(allOk) {
        const a = normEntry(q.ans), u = userEntry();
        rows().forEach((r) => {
          for (const s of ['dr', 'cr']) {
            const cells = $$(`[data-s="${s}"]`, r.tr);
            if (!r[s].a && r[s].v == null) continue;
            const good = allOk || (a !== 'none' && u !== 'none' && r[s].a && a[s][r[s].a] != null && a[s][r[s].a] === u[s][r[s].a]);
            cells.forEach((c) => c.classList.add(good ? 'ok' : 'ng'));
          }
        });
        $$('select, input', el).forEach((x) => { x.disabled = true; });
      },
      answerHTML: () => entryTable(q.ans),
      summary() { const fm = form(); if (o.exam && fm.dup.length) return `同じ側に同じ科目を2行（${fm.dup.join('・')}）`; const u = userEntry(); if (u === 'none') return '仕訳なし'; const f = (m) => Object.entries(m).map(([k, v]) => `${k} ${fmt(v)}`).join('・') || '（なし）'; return `借方 ${f(u.dr)} ／ 貸方 ${f(u.cr)}`; },
    };
  }
  function mountFillCBT(q, el, o = {}) {
    const html = rich(q.sheet).replace(/\{\{(\d+)\}\}/g, (m, n) => {
      const b = q.blanks[+n];
      if (b && typeof b === 'object') return `<select class="blank-sel" data-i="${n}" aria-label="空欄${+n + 1}"><option value="">　</option>${b.opts.map((o, j) => `<option value="${j}">${esc(o)}</option>`).join('')}</select>`;
      return `<input class="blank-in" data-i="${n}" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="空欄${+n + 1}">`;
    });
    el.innerHTML = `<div class="sheet-wrap rich">${html}</div>`;
    const num = o.exam ? strictNum : toNum;
    if (o.exam) el.addEventListener('input', (e) => { if (e.target.matches('input')) halfOnlyWarn(e.target); });
    const val = (i) => { const x = $(`[data-i="${i}"]`, el); if (!x) return null; if (x.tagName === 'SELECT') return x.value === '' ? null : +x.value; return num(x.value); };
    const right = (i) => { const b = q.blanks[i], v = val(i); if (v == null || Number.isNaN(v)) return false; return typeof b === 'object' ? v === b.a : Math.abs(v - b) < 1e-6; };
    // ○×の正誤問題（tf）は、全部○・全部×の解答を0点にする（当て推量の防止）
    const allSame = () => { if (!q.tf) return false; const v = q.blanks.map((_, i) => val(i)); return v.every((x) => x != null) && v.every((x) => x === v[0]); };
    const count = () => (allSame() ? 0 : q.blanks.reduce((n, _, i) => n + (right(i) ? 1 : 0), 0));
    return {
      answered: () => $$('[data-i]', el).some((x) => x.value.trim() !== ''),
      check() {
        const n = count(), half = $$('input[data-i]', el).filter((x) => x.value.trim() !== '' && Number.isNaN(num(x.value))).length;
        const empty = $$('[data-i]', el).filter((x) => x.value.trim() === '').length;
        return { ok: n === q.blanks.length, ratio: n / q.blanks.length, got: n, of: q.blanks.length, half, empty };
      },
      reveal() {
        $$('[data-i]', el).forEach((x) => {
          const i = +x.dataset.i, ok = right(i), b = q.blanks[i];
          x.classList.add(ok ? 'ok' : 'ng'); x.disabled = true;
          if (!ok) x.insertAdjacentHTML('afterend', `<span class="fix">正解 ${esc(typeof b === 'object' ? b.opts[b.a] : fmt(b))}</span>`);
        });
      },
      answerHTML: () => '',
      summary: () => (allSame() ? '全部同じ答えなので0点' : `${count()}/${q.blanks.length} 欄正解`),
    };
  }
  // On-screen calculator for practice without a physical one (the real exam allows bringing your own).
  function calcPanel() {
    let cur = '0', acc = null, op = null, fresh = true;
    const keys = ['C', '←', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '00', '.', '='];
    const el = document.createElement('div');
    el.className = 'cbt-tool calc';
    el.innerHTML = `<div class="tool-head"><b>電卓</b><button class="icon-btn" data-close aria-label="電卓を閉じる">${ctx().icons.x}</button></div><div class="calc-disp" data-d>0</div><div class="calc-keys">${keys.map((k) => `<button data-k="${k}" class="${/[÷×−+=]/.test(k) ? 'op' : ''}">${k}</button>`).join('')}</div>`;
    const disp = $('[data-d]', el);
    const ap = (a, b, o) => (o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : o === '÷' ? (b === 0 ? NaN : a / b) : b);
    const show = () => { const n = Number(cur); disp.textContent = Number.isFinite(n) ? n.toLocaleString('ja-JP', { maximumFractionDigits: 6 }) + (cur.endsWith('.') ? '.' : '') : 'エラー'; };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      const k = b.dataset.k;
      if (/^\d+$/.test(k)) { cur = fresh || cur === '0' ? (k === '00' ? '0' : k) : cur + k; fresh = false; }
      else if (k === '.') { if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.')) cur += '.'; }
      else if (k === 'C') { cur = '0'; acc = null; op = null; fresh = true; }
      else if (k === '←') { cur = cur.length > 1 ? cur.slice(0, -1) : '0'; }
      else if (k === '%') { cur = String((acc != null ? acc : 1) * Number(cur) / 100); fresh = true; }
      else if (k === '=') { if (op) { cur = String(ap(acc, Number(cur), op)); acc = null; op = null; } fresh = true; }
      else { acc = op && !fresh ? ap(acc, Number(cur), op) : acc == null ? Number(cur) : op && fresh ? acc : Number(cur); if (!op || !fresh) cur = String(acc); op = k; fresh = true; }
      show();
    });
    return el;
  }

  const PARTS = [
    { k: 1, t: '第1問', d: '仕訳 5題（商業簿記）', pts: 20 },
    { k: 2, t: '第2問', d: '個別論点・連結など', pts: 20 },
    { k: 3, t: '第3問', d: '財務諸表・本支店など', pts: 20 },
    { k: 4, t: '第4問', d: '(1) 工業簿記の仕訳3題 (2) 原価計算', pts: 28 },
    { k: 5, t: '第5問', d: '標準原価・CVPなど', pts: 12 },
  ];
  const INDUSTRIAL = new Set(['w8', 'w9']);
  // 2027年度（2027/4〜）の区分表で範囲外・処理変更の見込みとされる論点。内容は書き換えず、表示と模試の出題だけを切り替える。
  const OUT27_CH = new Set(['c11']), OUT27_X = new Set();
  // 範囲外の問題を模試から外す：未達（2級の範囲外）は常に、2027年度に出ない問題（手形・小切手・旧リース）は受験年度が2027年度以降のとき
  const skipQ = (q, y27) => (B.outOfScope2 && B.outOfScope2(q)) || (y27 && B.outdated27 && B.outdated27(q));
  const CH_FREQ = { c01: 2, c02: 2, c04: 2, c07: 2, c13: 2, c14: 2, c16: 2, c17: 2, c18: 2, c19: 2, c21: 2, c22: 2, c24: 2, c28: 2, c34: 2, c35: 2, c37: 2, c43: 2, c45: 2 };
  // weighted sample, one question per chapter, avoiding recently seen keys
  function sampleExam(pool, n, recent) {
    const fresh = pool.filter((q) => !recent.has(q._key));
    const use = fresh.length >= n * 3 ? fresh : pool;
    const keyed = use.map((q) => ({ q, k: Math.pow(Math.random(), 1 / (CH_FREQ[q._ch.id] || 1)) })).sort((a, b) => b.k - a.k);
    const out = [], used = new Set();
    for (const { q } of keyed) { if (out.length >= n) break; if (!used.has(q._ch.id)) { out.push(q); used.add(q._ch.id); } }
    for (const { q } of keyed) { if (out.length >= n) break; if (!out.includes(q)) out.push(q); }
    return out;
  }
  const PART_MIN = { 1: 15, 4: 20, 5: 10, 2: 20, 3: 25 };
  // 先輩の下書き：題に draft がなければ、大問ごとの手順を見せる
  const GEN_DRAFT = {
    1: [{ t: '但し書きを先に', h: '記帳法（三分法・間接法）、税抜・税込、「本日」がどの段階かを、取引文より先に読む。' }, { t: '経緯を線で', h: '「かねて」「前期に」の取引があれば、計算用紙に日付の線を引いて、すでに済んだ仕訳を小さく書く。' }, { t: '候補を見る', h: '科目の候補を見て、使う科目を決める。候補にない科目は使えない。' }, { t: '1科目1行', h: '同じ側に同じ科目が2回出たら、合計して1行にする。2行に分けると、その問は0点。' }, { t: '検算', h: '借方の合計と貸方の合計が一致するかを確かめる。' }],
    2: [{ t: '問いと解答欄から', h: '最後の問いと解答欄の形（勘定・台帳・表）を先に見る。何を出せばよいかが決まる。' }, { t: '時系列の線表', h: '資料を日付順に並べ、計算用紙に線表を書く。期首・期中・期末に印をつける。' }, { t: '1件ずつ仕訳', h: '線表の順に仕訳を切り、勘定や台帳へ写す。' }, { t: '残高で照合', h: '期末の残高を、前期繰越と増減から計算した額と照らす。' }, { t: '検算', h: '解答欄の合計と、貸借が一致するかを確かめる。' }],
    3: [{ t: '解答欄を資料に', h: '解答欄の科目の並びを見る。整理で増える科目の手がかりになる。' }, { t: '未処理から', h: '未処理事項・修正事項を先に片づける。決算整理（引当金・売上原価など）に波及する科目に印をつける。' }, { t: '科目ごとの増減', h: '決算整理事項を1つずつ処理し、計算用紙に「科目：前T/B ± 増減」を1行ずつ書く。' }, { t: '解答欄へ', h: '前T/Bの金額に増減を足して、解答欄へ写す。' }, { t: '検算', h: '当期純利益を、P/Lの差額とB/Sの繰越利益剰余金の両方で確かめる。' }],
    4: [{ t: '流れの図', h: '材料→仕掛品→製品→売上原価の流れを、計算用紙に小さな箱で描く。' }, { t: 'ボックス図', h: '原価計算は、月初・当月投入・完成・月末の4つの欄を持つ箱を書く。' }, { t: '数量が先', h: '数量（加工費は換算量）を先に埋め、次に金額を入れる。' }, { t: '検算', h: '完成品原価と月末仕掛品原価の合計が、月初と当月投入の合計に一致するかを確かめる。' }],
    5: [{ t: '型を決める', h: '標準原価ならシュラッター図、CVPなら「売上−変動費−固定費＝利益」の式を先に書く。' }, { t: '数字を置く', h: '与えられた数字を、図や式の該当する場所に置く。' }, { t: '向きを判定', h: '差異は「実際−標準」で考え、プラスなら不利、マイナスなら有利。' }, { t: '検算', h: '問いの単位（円・個・％）と、端数処理の指示を確かめる。' }],
  };
  // 誤りの3分類と戻り先（本物は点数しか返さない。ここが本物を超える所）
  const MISS = {
    unlearned: { t: '習っていない', d: 'その論点をまだ学んでいない、または初めて見る形。', go: 'レッスンか先輩の手本へ' },
    forgot: { t: '忘れていた', d: '前に解けたのに、今回は書けなかった。', go: '日をあけて同じ型を解き直す（まちがいノート）' },
    calc: { t: '計算・形式・時間', d: '科目は合っていて金額だけ違う、書き方の規則違反、時間切れ。', go: '大問別の練習（時間あり）と、計算用紙の使い方' },
  };
  const EXAM_MODES = [['model', '先輩の手本を見る', '下書きを1手ずつ見ながら解く'], ['trace', '下書きをなぞる', '下書きを全部出したまま解く'], ['self', '自分で', '下書きなし・時間なし'], ['timed', '時間あり', '本番の目安の時間で']];
  let drillMode = 'self';
  H.menu = function () {
    const ST = ctx().state, CH = chMap();
    const main = ctx().root;
    main.onclick = null;
    const full = ST.exams.filter((e) => e.mode !== 'untimed');
    const hist = ST.exams.slice(-5).reverse();
    const best = full.reduce((m, e) => Math.max(m, e.score), 0);
    const untimed = ST.exams.filter((e) => e.mode === 'untimed').length;
    const counts = [2, 3, 4, 5].map((p) => B.exams.filter((x) => x.part === p).length);
    main.innerHTML = `<div class="stack"><div><div class="eyebrow">MOCK EXAM</div><h1>本試験シミュレーター</h1><p class="muted" style="margin:4px 0 0;font-size:13px">日商簿記2級と同じ5問構成・90分・100点満点。70点で合格。毎回ちがう組み合わせで出題される。</p></div>`
      + `<div class="card"><table class="score-table">${PARTS.map((p) => `<tr><th style="text-align:left">${p.t}</th><td class="muted" style="font-size:13px">${p.d}</td><td>${p.pts}点</td></tr>`).join('')}</table><p class="muted" style="font-size:12px;margin:8px 0 0">問題バンク：第2問 ${counts[0]}・第3問 ${counts[1]}・第4問(2) ${counts[2]}・第5問 ${counts[3]} 題 ＋ 仕訳 ${ctx().chapters.flatMap((c) => c.qs).filter((q) => q.type === 'journal').length} 題</p></div>`
      + `<div class="card" style="font-size:13px"><b>本番の画面の決まり</b><ul class="exam-rules"><li>勘定科目は、問題ごとの候補（5〜8個）から選ぶ。使わない科目もまざっている。</li><li>同じ科目は、借方・貸方それぞれ1行だけ。2行に分けるとその問は0点。</li><li>金額は半角の数字だけ。カンマ・円・全角は入らない。</li><li>問題文には書き込めない。計算用紙はA4で2枚。</li><li>終わると点数だけが出る。どこを間違えたかは本物では返ってこない。</li></ul><b>おすすめの解く順番</b><br>第1問（15分）→ 第4問（20分）→ 第5問（10分）→ 第2問（20分）→ 第3問（25分）<br><span class="muted">確実に点が取れる仕訳と工業簿記を先に終わらせ、重い第2問・第3問に残り時間を使う。</span>${CH.c47 ? '<br><button class="link" data-guide style="padding-left:0">本試験の戦い方（ネット試験の操作・取引文の読み方・捨て問）を読む</button>' : ''}${ctx().y27() ? '<br><b style="color:var(--cr)">2027年度モード：</b>手形・リースの区分は模試から外しています。' : ''}</div>`
      + `<div class="card stack"><h3>通しで解く（2段）</h3><p class="muted" style="margin:0;font-size:13px">1段目は時間なしで本番の形に慣れる。2段目で90分を計る。時間に追われる練習は、形に慣れてからのほうが身につく。</p><div class="row"><button class="btn ${untimed ? 'ghost' : 'gold'}" data-start="practice">1段目 時間なし${untimed ? `（${untimed}回）` : ''}</button><button class="btn ${untimed ? 'gold' : 'ghost'}" data-start>${ctx().icons.paper}2段目 90分 本番</button></div><button class="link" data-op style="padding-left:0;font-size:13px">はじめての人：操作の練習（1題・採点しない）</button></div>`
      + `<div class="card stack"><h3>大問別の連続練習</h3><p class="muted" style="margin:0;font-size:13px">同じ大問を続けて解く。先輩の手本 → なぞる → 自分で → 時間あり、の順に進めるのがおすすめ。</p><div class="seg exam-modes">${EXAM_MODES.map(([k, t, d]) => `<button data-dm="${k}" aria-pressed="${k === drillMode}" title="${esc(d)}">${t}</button>`).join('')}</div><p class="muted" style="margin:0;font-size:12px" data-dmd>${esc(EXAM_MODES.find((m) => m[0] === drillMode)[2])}</p><div class="row">${PARTS.map((p) => `<button class="btn ghost sm" style="flex:none" data-drillpart="${p.k}">${p.t}</button>`).join('')}</div></div>`
      + `${hist.length ? `<div class="card"><div class="row" style="justify-content:space-between"><h3>これまでの成績</h3>${best ? `<span class="pix" style="color:var(--brand)">自己ベスト ${best}点</span>` : ''}</div><table class="score-table" style="margin-top:6px">${hist.map((e) => `<tr><td>${esc(e.date)}</td><td class="muted" style="font-size:12px">${e.mode === 'untimed' ? '時間なし' : '90分'}</td><td>${e.score >= 70 ? '<b style="color:var(--good)">合格</b>' : '<span class="muted">不合格</span>'}</td><td>${e.score}点</td></tr>`).join('')}</table></div>` : ''}</div>`;
    main.onclick = (e) => {
      if (e.target.closest('[data-guide]')) { ctx().lesson('c47'); return; }
      if (e.target.closest('[data-op]')) { ctx().go('examplay', { part: 1, op: true }); return; }
      const dm = e.target.closest('[data-dm]');
      if (dm) { drillMode = dm.dataset.dm; $$('[data-dm]', main).forEach((b) => b.setAttribute('aria-pressed', String(b === dm))); $('[data-dmd]', main).textContent = EXAM_MODES.find((m) => m[0] === drillMode)[2]; return; }
      const dp = e.target.closest('[data-drillpart]');
      if (dp) { ctx().go('examplay', { part: +dp.dataset.drillpart, mode: drillMode }); return; }
      const s = e.target.closest('[data-start]'); if (s) ctx().go('examplay', s.dataset.start === 'practice');
    };
  };
  // arg：true＝通し・時間なし、false＝通し・90分、{ part, mode, key, op }＝大問別の練習
  H.play = function (arg) {
    const ST = ctx().state, CH = chMap();
    const main = ctx().root;
    const o = arg && typeof arg === 'object' ? arg : { full: true, mode: arg ? 'self' : 'timed' };
    const full = !!o.full, only = full ? null : o.part;
    const timed = o.mode === 'timed' && !o.op, coach = o.mode === 'model' || o.mode === 'trace' ? o.mode : null;
    const limit = full ? 90 : PART_MIN[only];
    const y27 = ctx().y27();
    const allQ = ctx().chapters.filter((c) => c.id !== 'c00' && c.id !== 'c47' && !(y27 && OUT27_CH.has(c.id))).flatMap((c) => c.qs.filter((q) => q.type === 'journal' && !skipQ(q, y27)));
    const strong = (list) => { const s = list.filter((q) => (q.lv || 1) >= 2); return s.length >= 15 ? s : list; };
    const recent = new Set(ST.examSeen);
    const want = (p) => full || only === p;
    let com = [], ind = [];
    if (o.op) com = [pick(allQ.filter((q) => !INDUSTRIAL.has(q._ch.world) && (q.lv || 1) === 1 && q.ans !== 'none' && q.ans.dr.length + q.ans.cr.length <= 3))];
    else {
      if (want(1)) com = sampleExam(strong(allQ.filter((q) => !INDUSTRIAL.has(q._ch.world))), 5, recent);
      if (want(4)) ind = sampleExam(strong(allQ.filter((q) => INDUSTRIAL.has(q._ch.world))), 3, recent);
    }
    const big = {};
    if (!o.op) [2, 3, 4, 5].filter(want).forEach((p) => {
      const pool = B.exams.filter((x) => x.part === p && !(y27 && OUT27_X.has(x.id)) && !skipQ(x, y27));
      const fixed = o.key && pool.find((x) => x._key === o.key);
      const fresh = pool.filter((x) => !recent.has(x._key));
      big[p] = fixed || (pool.length ? pick(fresh.length ? fresh : pool) : null);
    });
    if (!o.op) { ST.examSeen = [...com, ...ind, ...Object.values(big).filter(Boolean)].map((q) => q._key).concat(ST.examSeen).slice(0, 80); ctx().save(); }
    const parts = PARTS.filter((p) => want(p.k));
    const partTime = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let partT0 = performance.now();
    const comps = {}, flags = new Set(), keysOf = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    window.__bokiExam = comps;
    let curPart = parts[0].k, submitted = false, raf = null;
    const memo = ['', ''];
    const end = performance.now() + limit * 60000;
    ctx().guard(o.op ? null : '試験を途中でやめる？解答は保存されないよ');
    main.onclick = null;
    const title = o.op ? '操作の練習（採点しない）' : full ? `日商簿記2級 模擬試験（ネット試験形式${timed ? '' : '・時間なし'}）` : `${PARTS[only - 1].t}の練習（${EXAM_MODES.find((m) => m[0] === o.mode)[1]}）`;
    main.innerHTML = `<div class="cbt"><div class="cbt-head"><b class="cbt-title">${esc(title)}</b><span class="exam-timer" data-timer title="残り時間">${timed ? `残り ${String(limit).padStart(2, '0')}:00` : '時間なし'}</span><div class="cbt-tools"><button class="btn ghost sm" data-tool="memo">計算用紙</button><button class="btn ghost sm" data-tool="calc">電卓</button><button class="btn bad sm" data-submit>${full ? '試験終了' : '答え合わせ'}</button></div></div>${parts.length > 1 ? `<nav class="cbt-nav" aria-label="大問の切り替え">${parts.map((p) => `<button class="cbt-q" data-part="${p.k}"><b>${p.t}</b><small data-st="${p.k}"></small></button>`).join('')}</nav>` : ''}<div data-score></div>${parts.map((p) => `<section class="exam-part" data-sec="${p.k}" hidden></section>`).join('')}${parts.length > 1 ? '<div class="cbt-foot"><button class="btn ghost" data-step="-1">◀ 前の問題</button><button class="btn ghost" data-step="1">次の問題 ▶</button></div>' : ''}<p class="muted" style="font-size:12px;margin:10px 0 0">本番と同じく、勘定科目は問題ごとの候補から選び、金額は半角の数字で入力します（カンマ・円は不要）。マイナスは先頭に「-」または「△」。問題文には書き込めません。計算用紙は2枚まで。</p></div>`;
    if (o.op) $('[data-score]', main).innerHTML = `<div class="card coach"><b>タカシ先輩</b><p style="margin:4px 0 0">本番の画面の練習だ。点数には入らない。3つだけ試してみて。</p><ol style="margin:6px 0 0;padding-left:20px"><li>勘定科目はプルダウンから選ぶ。</li><li>金額にカンマや全角の数字を入れてみる。枠が赤くなる。本番では入らない。</li><li>同じ科目を同じ側に2行書いて「答え合わせ」を押してみる。正しい金額でも0点になる。</li></ol></div>`;
    const draftHTML = (q, part) => {
      const steps = (q.draft && q.draft.length ? q.draft : GEN_DRAFT[part]) || [];
      return `<div class="coach draft" data-draft><div class="qmeta"><b>先輩の下書き</b><span class="muted" style="font-size:12px">${q.draft ? 'この題の手順' : 'この大問の手順'}</span></div><ol>${steps.map((s, i) => `<li data-ds="${i}" ${coach === 'model' && i > 0 ? 'hidden' : ''}><b>${esc(s.t)}</b> ${esc(s.h)}</li>`).join('')}</ol>${coach === 'model' && steps.length > 1 ? '<button class="btn ghost sm" data-dnext>次の1手</button>' : ''}</div>`;
    };
    const sub = (subTitle, q, key, part) => {
      const box = document.createElement('div');
      box.className = 'exam-sub';
      box.dataset.key = key;
      box.innerHTML = `<div class="qmeta"><b>${subTitle}</b>${o.op ? '' : `<button class="cbt-flag" data-flag="${key}" aria-pressed="false">見直す</button>`}</div>${coach && (q.type !== 'journal' || key.endsWith('-0')) ? draftHTML(q, part) : ''}<div class="qtext rich noink">${rich(q.q)}</div><div data-b></div><div data-x></div>`;
      const target = $('[data-b]', box);
      comps[key] = { q, part, comp: q.type === 'journal' ? mountJournalCBT(q, target, { exam: true }) : mountFillCBT(q, target, { exam: true }), box };
      keysOf[part].push(key);
      return box;
    };
    const sec = (k) => $(`[data-sec="${k}"]`, main);
    if (want(1)) {
      sec(1).insertAdjacentHTML('beforeend', `<h2>第1問（20点）</h2><p class="muted" style="margin:0;font-size:13px">次の各取引について仕訳しなさい。勘定科目は各問のプルダウンの中から最も適当なものを選ぶこと。</p>`);
      com.forEach((q, i) => sec(1).appendChild(sub(`問${i + 1}`, q, `1-${i}`, 1)));
    }
    [2, 3, 5].filter(want).forEach((p) => {
      const P = PARTS[p - 1];
      sec(p).insertAdjacentHTML('beforeend', `<h2>${P.t}（${P.pts}点）${big[p] ? ` ${esc(big[p].title)}` : ''}</h2>`);
      if (big[p]) sec(p).appendChild(sub('', big[p], `${p}`, p)); else sec(p).insertAdjacentHTML('beforeend', '<p class="muted">この大問は準備中です。</p>');
    });
    if (want(4)) {
      sec(4).insertAdjacentHTML('beforeend', '<h2>第4問（28点）</h2><h3>(1) 仕訳（12点）</h3>');
      ind.forEach((q, i) => sec(4).appendChild(sub(`問${i + 1}`, q, `4-${i}`, 4)));
      sec(4).insertAdjacentHTML('beforeend', `<h3 style="margin-top:10px">(2) ${big[4] ? esc(big[4].title) : ''}（16点）</h3>`);
      if (big[4]) sec(4).appendChild(sub('', big[4], '4b', 4));
    }
    function status() {
      parts.forEach((p) => {
        const ks = keysOf[p.k], done = ks.filter((k) => comps[k].comp.answered()).length, fl = ks.filter((k) => flags.has(k)).length;
        const el = $(`[data-st="${p.k}"]`, main);
        if (el) el.innerHTML = ks.length ? `${done}/${ks.length}${fl ? ` <span class="flagmark">見直し${fl}</span>` : ''}` : '-';
        const btn = el && el.parentElement; if (btn) btn.classList.toggle('done', ks.length > 0 && done === ks.length);
      });
    }
    function show(k) {
      if (!submitted) { partTime[curPart] += performance.now() - partT0; partT0 = performance.now(); }
      curPart = k;
      $$('.cbt-q', main).forEach((t) => t.setAttribute('aria-current', String(+t.dataset.part === k)));
      $$('[data-sec]', main).forEach((s) => { s.hidden = +s.dataset.sec !== k; });
      const pi = parts.findIndex((p) => p.k === k);
      const pv = $('[data-step="-1"]', main), nx = $('[data-step="1"]', main);
      if (pv) pv.disabled = pi === 0; if (nx) nx.disabled = pi === parts.length - 1;
      window.scrollTo(0, 0);
    }
    show(curPart); status();
    main.oninput = status;
    function tick() {
      const left = Math.max(0, end - performance.now());
      const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
      const t = $('[data-timer]', main);
      if (t) { t.textContent = `残り ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; t.classList.toggle('low', left < Math.min(600000, limit * 6000)); }
      if (left <= 0) { ctx().toast('時間が終了しました。自動で採点します'); grade(true); return; }
      raf = requestAnimationFrame(tick);
    }
    if (timed) raf = requestAnimationFrame(tick);
    // 計算用紙：本番と同じ2枚。1枚に書ける量にも限りがある（A4の1枚を、30行×40字ほどの枠で）
    const SHEET_MAX = 1200, SHEET_LINES = 30;
    let memoEl = null, calcEl = null, sheet = 0;
    function toggleTool(kind) {
      if (kind === 'memo') {
        if (memoEl) { memo[sheet] = $('textarea', memoEl).value; memoEl.remove(); memoEl = null; return; }
        memoEl = document.createElement('div');
        memoEl.className = 'cbt-tool memo';
        memoEl.innerHTML = `<div class="tool-head"><b>計算用紙</b><div class="seg memo-tabs">${[0, 1].map((i) => `<button data-sheet="${i}" aria-pressed="${i === sheet}">${i + 1}枚目</button>`).join('')}</div><button class="icon-btn" data-close aria-label="計算用紙を閉じる">${ctx().icons.x}</button></div><textarea id="cbt-memo" maxlength="${SHEET_MAX}" placeholder="下書き・計算メモ。本番と同じく2枚まで（試験が終わると消えます）"></textarea><small class="muted" data-left></small>`;
        const ta = $('textarea', memoEl);
        const left = () => { const lines = ta.value.split('\n'); if (lines.length > SHEET_LINES) { ta.value = lines.slice(0, SHEET_LINES).join('\n'); ctx().toast(`1枚に書けるのは${SHEET_LINES}行まで。2枚目を使うか、小さくまとめよう`); } $('[data-left]', memoEl).textContent = `${sheet + 1}枚目：のこり ${SHEET_MAX - ta.value.length}字・${SHEET_LINES - ta.value.split('\n').length}行`; };
        ta.value = memo[sheet]; left();
        ta.addEventListener('input', left);
        memoEl.addEventListener('click', (e) => {
          if (e.target.closest('[data-close]')) { toggleTool('memo'); return; }
          const sb = e.target.closest('[data-sheet]');
          if (sb) { memo[sheet] = ta.value; sheet = +sb.dataset.sheet; ta.value = memo[sheet]; $$('[data-sheet]', memoEl).forEach((b) => b.setAttribute('aria-pressed', String(b === sb))); left(); ta.focus(); }
        });
        document.body.appendChild(memoEl);
        ta.focus();
      } else {
        if (calcEl) { calcEl.remove(); calcEl = null; return; }
        calcEl = calcPanel();
        calcEl.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) toggleTool('calc'); });
        document.body.appendChild(calcEl);
      }
    }
    ctx().cleanup(() => { if (raf) cancelAnimationFrame(raf); if (memoEl) memoEl.remove(); if (calcEl) calcEl.remove(); main.oninput = null; main.onchange = null; });
    // 誤りの見立て（本人があとで直せる）
    function classify(c, r, timeUp) {
      const q = c.q, h = ctx().hist(q._key) || [0, 0];
      const learnedBefore = h[1] > 0 || (q._ch && q._ch.id && ctx().cleared(q._ch.id)) || (q.scope || []).some((id) => { const it = B.scope.find((x) => x.id === id); return it && ctx().cleared(it.ch); });
      if (!c.comp.answered()) return timeUp ? 'calc' : learnedBefore ? 'forgot' : 'unlearned';
      if (q.type === 'journal') { if (r.why === 'amount' || r.why === 'dup' || r.why === 'half') return 'calc'; return learnedBefore ? 'forgot' : 'unlearned'; }
      if (r.ratio >= 0.6 || r.half) return 'calc';
      return learnedBefore ? 'forgot' : 'unlearned';
    }
    const items = [];
    function grade(timeUp) {
      if (submitted) return;
      submitted = true; ctx().guard(null);
      if (raf) cancelAnimationFrame(raf);
      const score = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const add = (p, pts, key) => {
        const c = comps[key]; if (!c) return;
        const r = c.comp.check();
        const got = Math.round(pts * r.ratio * 10) / 10;
        score[p] += got;
        const miss = r.ok ? null : classify(c, r, timeUp);
        items.push({ key, p, pts, got, r, miss, c });
        if (o.op) return;
        // 手本・なぞりで解いた正解は、定着には数えない（間違いは記録する）
        if (!coach || !r.ok) ctx().record(c.q, r.ok, false, !r.ok && c.comp.summary ? c.comp.summary() : '');
      };
      com.forEach((_, i) => add(1, 4, `1-${i}`));
      [2, 3, 5].filter(want).forEach((p) => add(p, PARTS[p - 1].pts, `${p}`));
      ind.forEach((_, i) => add(4, 4, `4-${i}`));
      if (want(4)) add(4, 16, '4b');
      Object.keys(score).forEach((k) => { score[k] = Math.round(score[k]); });
      const total = parts.reduce((a, p) => a + score[p.k], 0), max = o.op ? 4 * com.length : parts.reduce((a, p) => a + p.pts, 0);
      partTime[curPart] += performance.now() - partT0;
      const mins = {}; Object.keys(partTime).forEach((k) => { mins[k] = Math.round(partTime[k] / 60000); });
      const missN = { unlearned: 0, forgot: 0, calc: 0 }; items.forEach((it) => { if (it.miss) missN[it.miss]++; });
      let rec = null;
      if (full) {
        rec = { date: ctx().today(), score: total, parts: score, mins, cbt: true, mode: timed ? 'timed' : 'untimed', miss: missN };
        ST.exams.push(rec);
        ctx().reward(total, true);
      } else if (!o.op) ctx().reward(total, false);
      ctx().save(); ctx().after();
      const pass = full && total >= 70;
      const fx = ctx().sfx; if (full) { if (pass) { fx.win(); fx.confetti(); } else fx.lose(); } else (total === max ? fx.ok : fx.ng)(1);
      $$('.cbt-flag', main).forEach((b) => { b.disabled = true; });
      $$('select, input', main).forEach((x) => { x.disabled = true; });
      // まず本物と同じく、点数だけを出す
      const head = full ? `<div class="eyebrow">試験結果</div><div class="pix" style="font-size:60px;line-height:1">${total}<span style="font-size:22px">点</span></div><span class="pass-stamp ${pass ? '' : 'fail'}">${pass ? '合格' : '不合格'}</span>` : `<div class="eyebrow">${o.op ? '操作の練習' : '大問別の練習'}</div><div class="pix" style="font-size:44px;line-height:1">${total}<span style="font-size:18px"> / ${max}点</span></div>`;
      const table = full ? `<table class="score-table"><tr><th></th><th>得点</th><th>かけた時間</th><th>目安</th></tr>${PARTS.map((p) => `<tr><th style="text-align:left">${p.t}</th><td>${score[p.k]} / ${p.pts}</td><td class="num ${mins[p.k] > PART_MIN[p.k] + 3 ? 'over' : ''}">${mins[p.k]}分</td><td class="num muted">${PART_MIN[p.k]}分</td></tr>`).join('')}</table>` : `<p class="muted" style="margin:0;font-size:13px">かけた時間 ${Math.max(1, mins[only])}分（目安 ${PART_MIN[only]}分）</p>`;
      $('[data-score]', main).innerHTML = `<div class="card result" style="margin-bottom:14px">${head}${table}${full ? '<p class="muted" style="margin:0;font-size:13px">本物の試験の画面はここまで。点数だけが出て、どこを間違えたかは返ってこない。</p>' : ''}<div class="row" style="justify-content:center"><button class="btn gold" data-look>振り返る${full ? '（本物にはない）' : ''}</button>${!full && !o.op ? `<button class="btn ghost" data-again>同じ大問をもう1題</button>` : ''}</div><div data-look-body></div></div>`;
      $('[data-submit]', main).outerHTML = '<button class="btn sm" data-hall-menu>試験メニューへ</button>';
      window.scrollTo(0, 0);
      main._look = () => look(total, rec);
    }
    // 振り返り：各問の正誤と解説、誤りの3分類と戻り先、合格ラインとの距離
    function look(total, rec) {
      items.forEach(({ key, pts, got, r, c }) => {
        c.comp.reveal(r.ok);
        const why = r.why === 'dup' ? `<p class="rulemiss">同じ側に同じ科目（${esc(r.dup.join('・'))}）を2行に分けて書いている。金額が合っていても、本番ではこの問は0点。1行にまとめる。</p>` : r.why === 'half' || r.half ? '<p class="rulemiss">半角の数字でない金額がある。本番の画面では入力できない。</p>' : '';
        $('[data-x]', c.box).innerHTML = `<div class="fb ${r.ok ? 'ok' : 'ng'}"><div class="fb-title">${r.ok ? '正解' : '不正解'} <span class="pix" style="font-size:15px">${got} / ${pts}点</span></div>${why}${r.ok ? '' : c.comp.answerHTML()}<div class="rich">${rich(c.q.exp)}</div></div>`;
        if (!coach && (c.q.type !== 'journal' || key === '1-0' || key === '4-0')) $('[data-x]', c.box).insertAdjacentHTML('beforeend', `<details class="coach draft-after"><summary>先輩ならこう解く（下書き）</summary>${draftHTML(Object.assign({}, c.q), c.part).replace(/ hidden/g, '').replace(/<button[^>]*data-dnext[^>]*>[^<]*<\/button>/, '')}</details>`);
      });
      $('[data-look]', main).remove();
      main._recat = (key, v) => { const it = items.find((x) => x.key === key); if (!it) return; it.miss = v; if (rec) { rec.miss = { unlearned: 0, forgot: 0, calc: 0 }; items.forEach((x) => { if (x.miss) rec.miss[x.miss]++; }); ctx().save(); } const keep = window.scrollY; summary(total, rec); window.scrollTo(0, keep); };
      summary(total, rec);
    }
    function summary(total, rec) {
      const wrong = items.filter((it) => it.miss);
      const lost = { unlearned: 0, forgot: 0, calc: 0 }; wrong.forEach((it) => { lost[it.miss] += it.pts - it.got; });
      const label = (it) => it.c.q.type === 'journal' ? `${PARTS[it.p - 1].t} ${it.key.endsWith('b') ? '' : `問${+it.key.split('-')[1] + 1}`}` : `${PARTS[it.p - 1].t} ${esc(it.c.q.title || '')}`;
      let border = '';
      if (full) {
        if (total >= 70) {
          const margin = total - 70, safe = PARTS.filter((p) => (rec.parts[p.k] || 0) <= margin && rec.parts[p.k] > 0);
          border = `<p style="margin:0">あと ${margin}点 落としても合格だった。${safe.length ? `${safe.map((p) => p.t).join('・')}を丸ごと落としても届いていた。` : 'どの大問を丸ごと落としても届かない。全部の大問が合格を支えている。'}</p>`;
        } else {
          const need = 70 - total;
          border = `<p style="margin:0">合格まであと ${need}点。${lost.calc >= need ? `「計算・形式・時間」で落とした ${Math.round(lost.calc)}点のうち ${need}点を拾えば届いていた。新しく覚えることより、手順を直すほうが近い。` : lost.calc + lost.forgot >= need ? `「計算・形式・時間」と「忘れていた」を合わせた ${Math.round(lost.calc + lost.forgot)}点で届く。` : '習っていない論点を埋めるのが先。'}</p>`;
        }
      }
      const groups = Object.keys(MISS).map((k) => {
        const list = wrong.filter((it) => it.miss === k);
        if (!list.length) return '';
        const dest = k === 'unlearned' ? list.map((it) => it.c.q._ch && it.c.q._ch.id && CH[it.c.q._ch.id] ? `<button class="btn ghost sm" data-lesson="${it.c.q._ch.id}">${esc(it.c.q._ch.title)} のレッスン</button>` : `<button class="btn ghost sm" data-coach="${esc(it.c.q._key)}" data-cp="${it.p}">この題を先輩の手本で</button>`).filter((x, i, a) => a.indexOf(x) === i).join('') : k === 'forgot' ? '<button class="btn ghost sm" data-go-note>まちがいノートへ（日をあけて解き直す）</button>' : `${[...new Set(list.map((it) => it.p))].map((p) => `<button class="btn ghost sm" data-drill-timed="${p}">${PARTS[p - 1].t}を時間ありで</button>`).join('')}${CH.c47 ? '<button class="btn ghost sm" data-guide2>計算用紙の使い方を読む</button>' : ''}`;
        return `<section class="miss-group" data-mg="${k}"><h4>${esc(MISS[k].t)} <small>${list.length}問・${Math.round(lost[k])}点</small></h4><p class="muted" style="margin:0;font-size:12px">${esc(MISS[k].d)} → ${esc(MISS[k].go)}</p><ul class="miss-list">${list.map((it) => `<li><span>${label(it)}</span><select data-recat="${esc(it.key)}" aria-label="誤りの分類を直す">${Object.keys(MISS).map((m) => `<option value="${m}" ${m === k ? 'selected' : ''}>${esc(MISS[m].t)}</option>`).join('')}</select></li>`).join('')}</ul><div class="row">${dest}</div></section>`;
      }).join('');
      $('[data-look-body]', main).innerHTML = `<div class="stack" style="text-align:left;margin-top:12px">${border}${wrong.length ? `<h3>間違いの見立て</h3><p class="muted" style="margin:0;font-size:12px">ゲームが見立てた分類。違うと思ったら選び直せる。分類ごとに戻る場所が変わる。</p>${groups}` : '<p style="margin:0">全問正解。この大問の型は手に入っている。</p>'}</div>`;
    }
    main.onchange = (e) => { const s = e.target.closest('[data-recat]'); if (s && main._recat) main._recat(s.dataset.recat, s.value); else status(); };
    main.onclick = (e) => {
      const g = (s) => e.target.closest(s);
      if (g('[data-hall-menu]')) { ctx().go('exam'); return; }
      if (g('[data-look]')) { main._look && main._look(); return; }
      if (g('[data-again]')) { ctx().go('examplay', { part: only, mode: o.mode }); return; }
      if (g('[data-lesson]')) { ctx().lesson(g('[data-lesson]').dataset.lesson); return; }
      if (g('[data-coach]')) { ctx().go('examplay', { part: +g('[data-coach]').dataset.cp, mode: 'model', key: g('[data-coach]').dataset.coach }); return; }
      if (g('[data-go-note]')) { ctx().review(); return; }
      if (g('[data-drill-timed]')) { ctx().go('examplay', { part: +g('[data-drill-timed]').dataset.drillTimed, mode: 'timed' }); return; }
      if (g('[data-guide2]')) { ctx().lesson('c47'); return; }
      if (g('[data-dnext]')) { const d = g('[data-draft]'), nx = $('li[hidden]', d); if (nx) nx.hidden = false; if (!$('li[hidden]', d)) g('[data-dnext]').remove(); return; }
      const t = g('[data-part]');
      if (t) { show(+t.dataset.part); return; }
      const st = g('[data-step]');
      if (st) { const pi = parts.findIndex((p) => p.k === curPart); const np = parts[Math.min(parts.length - 1, Math.max(0, pi + +st.dataset.step))]; show(np.k); return; }
      const fl = g('[data-flag]');
      if (fl) { const k = fl.dataset.flag; if (flags.has(k)) flags.delete(k); else flags.add(k); fl.setAttribute('aria-pressed', String(flags.has(k))); status(); return; }
      const tool = g('[data-tool]');
      if (tool) { toggleTool(tool.dataset.tool); return; }
      if (g('[data-submit]')) {
        if (!full) { grade(false); return; }
        const keys = Object.keys(comps), empty = keys.filter((k) => !comps[k].comp.answered()).length;
        ctx().modal(`<h2>試験を終了しますか？</h2><p style="margin:0">終了すると採点され、解答は変更できません。</p>${empty || flags.size ? `<p class="muted" style="margin:0">${empty ? `未回答 ${empty} 問` : ''}${empty && flags.size ? '・' : ''}${flags.size ? `見直しマーク ${flags.size} 問` : ''}があります。</p>` : ''}`, [{ t: '問題に戻る', cls: 'ghost' }, { t: '終了して採点', cls: 'bad', on: () => grade(false) }]);
      }
    };
  };


  H.mountJournalCBT = mountJournalCBT; H.mountFillCBT = mountFillCBT; H.toNum = toNum;
})();
