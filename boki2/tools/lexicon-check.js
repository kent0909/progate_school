#!/usr/bin/env node
// 言葉の関所：台本（js/sim/scenario.js）を遊ぶ順に読み、まだ教えていない会計用語が画面に出ていないかを調べる。
// あわせて、答えの先出し（正解の選択肢だけ補足・説明が長い）と、負荷の約束（1か月の新しい科目2つ・発見2つ・新しい原理1つ・1画面180字）も調べる。
// 本試験の文言（b4.exam）は例外として、先に出している語を一覧で出すだけにする。
// Usage: node boki2/tools/lexicon-check.js [--ramen]   （--ramen：ラーメン版 ramen.html の台本を読む。DESIGN-RAMEN l.2 段4）
global.window = global;
const path = require('path');
const root = path.join(__dirname, '..');
const RAMEN = process.argv.includes('--ramen');
const STORY = RAMEN ? require('./ramen-files.js').story : ['js/sim/scenario.js', 'js/sim/year2.js'];
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/data/siblings.js', 'js/sim/lexicon.js', ...STORY].forEach((f) => require(path.join(root, f)));
const B = window.BOKI, D = window.SIMDATA, LX = B.lex;
const errors = [], notes = [];
const taught = new Set();
const altSeen = new Set();
const fake = { decisions: {}, T: [], L: [] };
const val = (x) => (typeof x === 'function' ? x(fake) : x);
const branches = [{ crunch: 'loan', credit: 'credit', dep: 'straight' }, { crunch: 'discount', credit: 'cash', dep: 'rate' }];

function check(where, text, extra = [], { doc = false } = {}) {
  if (text == null || text === '') return;
  const ok = new Set([...taught, ...extra]);
  let bad = LX.unknown(String(text), ok);
  if (doc) bad = bad.filter((w) => !(w in LX.docWords));
  if (bad.length) errors.push(`${where}：まだ教えていない語 ${bad.join('・')} 「${String(text).slice(0, 40)}…」`);
}
// 1画面の字数に加えて、1文の長さ（60字まで）と名詞化（「〜の計上」「〜を行う」など。子どもには読みにくい）を注意として出す
const len = (where, text, max = 180) => {
  const t = String(text || '');
  if (t.length > max) errors.push(`${where}：${t.length}字（${max}字まで）`);
  for (const sen of t.split(/[。！？]/)) if (sen.length > 60) notes.push(`${where} 1文が${sen.length}字：「${sen.slice(0, 24)}…」`);
  const nom = t.match(/[^、。]{0,6}(の計上|の実施|を行う|の処理を|の把握|の確認を)/g);
  if (nom) notes.push(`${where} 名詞化：${[...new Set(nom)].join('・')}`);
};
// 判断の枝と、2026／2027年度モード（S.mode）の両方の台詞を読む
const talkText = (lines) => (typeof lines === 'function' ? branches.flatMap((b) => [...lines({ ...fake, decisions: b }), ...lines({ ...fake, decisions: b, mode: '2026' })]) : lines || []).map((l) => l[1]).join('');
function docCheck(where, doc) {
  if (!doc) return;
  check(`${where} 書類`, [doc.title, doc.type, doc.from, doc.to].join(' '), [], { doc: true });
  for (const r of val(doc.rows)) check(`${where} 書類`, `${r[0]} ${typeof r[1] === 'string' ? r[1] : ''}`, [], { doc: true });
}
function leak(where, targets, reasons) {
  const oks = (targets || []).filter((t) => t.ok), ngs = (targets || []).filter((t) => !t.ok);
  if (ngs.length && oks.some((t) => t.sub) && ngs.every((t) => !t.sub)) errors.push(`${where}：正解の選択肢にだけ補足がある`);
  const okR = (reasons || []).filter((r) => r.ok), ngR = (reasons || []).filter((r) => !r.ok);
  if (okR.length && ngR.length) { const mx = Math.max(...ngR.map((r) => r.t.length)); okR.forEach((r) => { if (r.t.length > mx * 1.6) errors.push(`${where}：正解の理由だけ長い（${r.t.length}字 / ほか最大${mx}字）`); }); }
}
const teach = (list) => (list || []).forEach((w) => taught.add(w));
// 教えた語は、その場の本文（名前カード・台詞）に出ていること
const shown = (where, list, text) => (list || []).forEach((w) => { if (!String(text).includes(w)) errors.push(`${where}：teaches の「${w}」が本文に出てこない`); });
// 仕訳の「動き」（資産+ など）。初めての動きは、それより前に発見・プロローグ・はじめての問いで練習していること
const practiced = new Set(['資産+', '資産-', '負債+', '純資産+', '純資産-']);
function moves(entry) {
  const out = [];
  for (const s of ['dr', 'cr']) for (const [a] of entry[s]) {
    const c = /累計額|貸倒引当金$/.test(a) ? 'マイナス' : (B.accounts[a] || {}).cat;
    const up = c === '資産' || c === '費用' ? s === 'dr' : s === 'cr';
    out.push(`${c}${up ? '+' : '-'}`);
  }
  if (entry.dr.length + entry.cr.length > 2) out.push('2行');
  return out;
}
const isAccount = (w) => !!B.accounts[w];

D.months.forEach((m, mi) => {
  const before = new Set(taught);
  const used = new Set();
  let discs = 0;
  const principles = new Set(Object.keys(D.principles).filter(() => false));
  const evs = m.events;
  for (const e of evs) {
    const w = `${m.label} ${e.id || e.t}`;
    // 決算の机：書類の題名は書類の言葉（タップで説明が出る）、ほかはふつうの文
    if (e.t === 'desk') { check(`${w} 書類の題名`, e.items.map((it) => it.title).join(' '), [], { doc: true }); check(w, `${talkText(e.talk)} ${e.q} ${e.items.map((it) => `${typeof it.line === 'function' ? ['credit', 'cash', 'none'].map((c) => it.line({ decisions: { credit: c } })).join(' ') : it.line} ${it.why}`).join(' ')}`); len(w, `${talkText(e.talk)}${e.q}`); }
    if (e.t === 'bank' && e.lines) { const all = [{}, { due: 'list', vat: 'line', divfix: 'keep', fix15: 'keep', crunch2: 'hiloan' }, { due: 'none', vat: 'follow', revenue: 'follow', fix15: 'fix' }].flatMap((dd) => e.lines({ ...fake, decisions: dd, T: [] })); check(w, all.map((l) => l[1]).join('')); all.forEach((l) => len(w, l[1])); }
    if (e.t === 'audit' || e.t === 'duelist') { check(w, talkText(e.talk)); len(w, talkText(e.talk)); }
    if (e.t === 'talk') { check(w, talkText(e.lines), e.teaches); (typeof e.lines === 'function' ? branches.map((b) => talkText(e.lines({ ...fake, decisions: b }))) : [talkText(e.lines)]).forEach((t) => len(w, t)); shown(w, e.teaches, talkText(e.lines)); teach(e.teaches); }
    if (e.t === 'board') {
      for (const [i, st] of e.steps.entries()) {
        const ww = `${w} 手順${i + 1}`;
        const pre = [talkText(st.say), st.q, ...(st.tokens || []).map((t) => `${t.label} ${t.react || ''}`), ...(st.dests || []).map((d) => d.label), ...(st.opts || []).map((o) => `${o.t} ${o.result || ''}`), ...(st.lines || []).flatMap((l) => [l.title, ...l.cards.map((c) => c.label)]), ...Object.values(st.react || {}), talkText(st.after)].join(' ');
        if (st.k === 'card') { check(ww, `${st.name} ${st.line}`, st.teaches); len(ww, st.line); shown(ww, st.teaches, st.line); teach(st.teaches); } else { check(ww, pre); len(ww, `${talkText(st.say)}${st.q}`); }
      }
      check(`${w} つづき`, talkText(e.next));
    }
    if (e.t === 'discover') {
      discs++;
      check(`${w} 困りごと`, talkText(e.b1.talk) + (e.b1.dyn ? branches.map((b) => e.b1.dyn({ ...fake, decisions: b })).join('') : ''));
      len(`${w} 困りごと`, talkText(e.b1.talk));
      docCheck(w, e.b1.doc);
      const b2 = e.b2;
      check(`${w} 問い`, [b2.q, b2.token, b2.wrongReact, ...(typeof b2.tokens === 'function' ? branches.flatMap((b) => b2.tokens({ ...fake, decisions: b })) : b2.tokens || []).map((t) => t.label), ...b2.targets.map((t) => `${t.label} ${t.sub || ''} ${t.react || ''}`), ...b2.reasons.map((r) => `${r.t} ${r.react || ''}`), ...(b2.hints || [])].join(' '));
      if (!(b2.hints || []).length) errors.push(`${w}：ヒント（hints）がない`);
      leak(w, b2.layout === 'sort' || b2.layout === 'flow' ? [] : b2.targets, b2.reasons);
      if (b2.layout !== 'sort' && b2.layout !== 'flow' && b2.targets.filter((t) => t.ok).length > 1) errors.push(`${w}：正解の選択肢が2つ以上ある（理由と選択が噛み合わなくなる）`);
      check(`${w} 結果`, [e.b3.ok, ...Object.values(e.b3.bs || {}).flat().map((x) => x[0]), ...((e.b3.bars || {}).series || []).map((s) => s.name)].join(' '));
      len(`${w} 結果`, e.b3.ok);
      const tt = e.b4.teaches || [];
      if (!tt.length) errors.push(`${w}：名前カードに teaches がない`);
      check(`${w} 名前`, `${e.b4.name} ${e.b4.line} ${e.b4.rule || ''}`, tt);
      len(`${w} 名前`, e.b4.line);
      shown(`${w} 名前`, tt, `${e.b4.name} ${e.b4.line}`);
      (e.moves || []).forEach((mv) => practiced.add(mv));
      teach(tt);
      const exam = LX.unknown(e.b4.exam, taught);
      if (exam.length) notes.push(`${w} 本試験の文言で先に出る語：${exam.join('・')}`);
      check(`${w} 手帳`, e.hand);
      // 会社の状態で書き換わる発見（ev.dynamic。例：配当の上限の変種、増資の額）も、その場までの語で読めること・1画面の字数
      if (typeof e.dynamic === 'function') for (const dd of [{ issue: 's25' }, { issue: 's100', capital: 'half' }, { issue: 's50', uncle: 'equity' }, { crunch: 'loan' }]) {
        const x = e.dynamic({ ...fake, decisions: dd }, e), b = x.b2, ww = `${w}（変種 ${JSON.stringify(dd)}）`;
        check(`${ww} 困りごと`, talkText(x.b1.talk)); len(`${ww} 困りごと`, talkText(x.b1.talk)); docCheck(ww, x.b1.doc);
        check(`${ww} 問い`, [x.predict && x.predict.q, ...((x.predict || {}).opts || []).map((o) => o.t), b.q, b.token, ...b.targets.map((t) => `${t.label} ${t.react || ''}`), ...b.reasons.map((r) => `${r.t} ${r.react || ''}`), ...(b.hints || [])].join(' '));
        leak(ww, b.layout === 'sort' || b.layout === 'flow' ? [] : b.targets, b.reasons);
        if (b.layout !== 'sort' && b.layout !== 'flow' && b.targets.filter((t) => t.ok).length !== 1) errors.push(`${ww}：正解の選択肢が1つでない`);
        check(`${ww} 結果`, x.b3.ok); len(`${ww} 結果`, x.b3.ok);
      }
      if (!taught.has(e.p)) principles.add(e.p);
    }
    if (e.t === 'decision') {
      check(w, [e.q, talkText(e.talk), ...e.options.map((o) => `${o.label} ${o.desc} ${o.result || ''}`)].join(' '), e.teaches);
      // 試算は「すぐ動く数字」だけ。外の反応（表情・結末）を判断の前に見せない
      if (e.trial) for (const b of branches) for (const o of e.options) { const rows = e.trial({ ...fake, decisions: b }, o.id); check(`${w} 試算`, rows.map((x) => `${x[0]} ${typeof x[1] === 'string' ? x[1] : ''}`).join(' '), e.teaches); if (/田中|森さん|表情|結末|倒産|つぶれ/.test(JSON.stringify(rows))) errors.push(`${w}：試算に外の反応や結末が入っている（答え合わせになる）`); }
      shown(w, e.teaches, e.options.map((o) => o.label).join(' '));
      if (e.options.some((o) => !o.result)) errors.push(`${w}：判断の結果（result）がない選択肢がある`);
      teach(e.teaches);
    }
    if (e.t === 'doc') {
      docCheck(w, e.doc);
      if (e.auditWhy) { check(`${w} 監査の点検`, e.auditWhy); len(`${w} 監査の点検`, e.auditWhy, 90); }
      const ki = D.kindIntro[e.kind];
      if (ki && !practiced.has(ki.move)) { check(`${w} はじめての問い`, [ki.q, ...ki.opts.map((o) => `${o.t} ${o.react || ''}`), ki.line].join(' ')); practiced.add(ki.move); }
      for (const b of branches) {
        const a = val(typeof e.ans === 'function' ? e.ans({ ...fake, decisions: b }) : e.ans);
        // 会社の書き方（alt。B.kubun.examForm の表）：書類の札の候補にある alt の札は既習、橋渡しの一言はその場までの語で読める
        for (const x of B.kubun.altsOf(a, e)) {
          for (const [acc] of x.entry.dr.concat(x.entry.cr)) if ((e.opts || []).includes(acc) && !taught.has(acc) && !D.namings[acc]) errors.push(`${w}：会社の書き方（${x.form}）の札「${acc}」をまだ教えていない`);
          if (!altSeen.has(x.form + e.id)) { altSeen.add(x.form + e.id); check(`${w} 橋渡しの一言（${x.form}）`, x.note); len(`${w} 橋渡しの一言`, x.note, 120); }
        }
        moves(a).forEach((mv) => { if (!practiced.has(mv)) { errors.push(`${w}：はじめての動き「${mv}」を、それまでに練習していない（発見の moves か kindIntro が要る）`); practiced.add(mv); } });
        for (const [acc] of a.dr.concat(a.cr)) {
          if (!before.has(acc)) used.add(acc);
          if (taught.has(acc)) continue;
          const nm = D.namings[acc];
          if (!nm) { errors.push(`${w}：記帳に使う「${acc}」を、それまでに教えていない（名前の札もない）`); taught.add(acc); continue; }
          check(`${w} 名前の札 ${acc}`, [nm.q, ...nm.opts.map((o) => `${o.t} ${o.react || ''}`)].join(' '));
          check(`${w} 名前の札 ${acc}`, nm.line, nm.teaches);
          shown(`${w} 名前の札`, nm.teaches, nm.line);
          teach(nm.teaches);
        }
      }
    }
    if (e.t === 'report') teach(e.teaches);
    // ラーメン版の計算の作業台（calc）・月報（rreport）・作戦の机（plan）の文（DESIGN-RAMEN l.3：作戦の机・月報の label も検査）
    if (e.t === 'calc') {
      const rows = typeof e.rows === 'function' ? e.rows(fake) : e.rows || [];
      check(w, [e.title, talkText(e.talk), e.q, ...rows.map((r) => r[0]), e.unit].join(' '), e.teaches);
      len(w, `${talkText(e.talk)}${e.q}`); len(`${w} 理由`, e.why); check(`${w} 理由`, e.why, e.teaches);
      if (e.answer == null) errors.push(`${w}：計算の答え（answer）がない`);
      teach(e.teaches);
    }
    if (e.t === 'rreport') { const rows = e.rows(fake); check(w, rows.map((r) => r[0]).join(' ')); for (const x of e.auto({ ...fake, res: { 0: {} } }) || []) check(`${w} 一括確定`, x.label); }
    if (e.t === 'plan') check(w, (e.opens || []).join(' '));
    // 締め切り・開始記入の画面（engine の closingScreen・openingScreen）が教える語
    if (e.t === 'closing') teach(['損益', '繰越利益剰余金', '締め切り', '当期純利益', '決算振替']);
    if (e.t === 'opening') teach(['前期繰越', '開始記入']);
    if (e.t === 'ending') {
      const E = D.endings[e.id];
      if (!E) { errors.push(`${w}：結末 ${e.id} がない`); continue; }
      const S0 = { ...fake, decisions: branches[0] };
      check(`${w} 結末`, [E.title, E.cause(S0), ...E.numbers(S0).rows.map((x) => x[0]), talkText(E.scene(S0)), E.lesson].join(' '));
      const lawUnknown = LX.unknown(E.reality, taught);
      if (lawUnknown.length) notes.push(`${w} 現実では：教えていない語 ${lawUnknown.join('・')}（現実の制度の説明として許す）`);
      // 不意打ちにしない：重い結末の前に、同じ判断の警告（中）を通っていること
      if (E.level === '重' && !E.ifOnly && !Object.values(D.endings).some((x) => x.level === '中' && x.back === E.back)) errors.push(`${w}：重い結末の前に、警告（中）の段がない`);
    }
  }
  // 自動仕訳ルールの提案が出はじめるのは、同じ種類を3回正しく書いたあと（8月ごろ）
  // 2年目の型は、その型の書類が出た月の終わりに調べる（ルールの提案は、慣れたあとの月のはじめ）
  if (m.label === '8月') teach(['自動仕訳']);
  if (taught.has('自動仕訳')) Object.entries(D.rules).forEach(([k, r]) => { if (r._checked || (r.y ? !evs.some((e) => e.kind === k) : m.label !== '8月')) return; r._checked = true; check(`ルール ${k}`, [r.label, ...r.conds.map((c) => `${c.t} ${c.why || ''}`), ...r.entry.flat()].join(' ')); });
  // 新しく記帳に使う勘定科目（説明の中で触れるだけの科目名は数えない）
  const newAcc = [...used].filter(isAccount);
  if (newAcc.length > 2) errors.push(`${m.label}：記帳に使う新しい勘定科目が${newAcc.length}つ（${newAcc.join('・')}）。1か月2つまで`);
  if (discs > 2) errors.push(`${m.label}：発見が${discs}つ。1か月2つまで`);
  // 前の判断の返り（SIM.returns）は、その月のはじめに出る。その月の前までに教えた語で読めること
  for (const r of D.returns || []) if ((m.year || 1) === r.y && m.m === r.m && (r.seg || null) === (m.seg || null) && !String(m.label).includes('後半')) { check(`${m.label} 返り ${r.id}`, talkText(r.lines)); len(`${m.label} 返り ${r.id}`, talkText(r.lines)); }
  // 札の兄弟の違いの1行（js/data/siblings.js）は、兄弟の札がぜんぶ教わった月から出る。その月までの語で読めること
  for (const sb of B.siblings) if (!sb._checked && sb.accs.every((a) => taught.has(a))) { sb._checked = true; check(`${m.label} 札の兄弟 ${sb.accs.join('・')}`, sb.line); len(`${m.label} 札の兄弟`, sb.line, 90); }
  m._p = [...new Set(evs.filter((e) => e.t === 'discover').map((e) => e.p))];
});
// 新しい原理は1か月に1つまで
const seenP = new Set(['P1']);
D.months.forEach((m) => { const fresh = m._p.filter((p) => !seenP.has(p)); if (fresh.length > 1) errors.push(`${m.label}：新しい原理が${fresh.length}つ（${fresh.join('・')}）`); m._p.forEach((p) => seenP.add(p)); });

// 事後のもしも（ifOnly）の結末は、1年を通して教えた語で読めること
for (const [id, E] of Object.entries(D.endings)) if (E.ifOnly) { const S0 = { ...fake, decisions: branches[0] }; check(`もしも ${id}`, [E.title, E.cause(S0), ...E.numbers(S0).rows.map((x) => x[0]), talkText(E.scene(S0)), E.lesson].join(' ')); }
// 反例：「資産が増えたら収益」「お金が出たら費用」と覚えてしまわないように、1年のうちに反例の書類があること
{
  const yearMoves = [];
  D.months.forEach((m) => m.events.filter((e) => e.t === 'doc').forEach((e) => { try { yearMoves.push(moves(typeof e.ans === 'function' ? e.ans({ decisions: {} }) : e.ans)); } catch (x) { /* 判断しだいの書類は飛ばす */ } }));
  if (!yearMoves.some((mv) => mv.includes('資産+') && !mv.includes('収益+'))) errors.push('反例がない：資産が増えて収益ではない書類（借入・出資など）が1年に1つもない');
  if (!yearMoves.some((mv) => mv.includes('資産-') && !mv.includes('費用+'))) errors.push('反例がない：お金が出て費用ではない書類（買掛金の支払い・返済など）が1年に1つもない');
}
if (notes.length) console.log(notes.join('\n'));
if (errors.length) { console.error('\n' + errors.join('\n')); console.error(`\n${errors.length} 件`); process.exit(1); }
B.siblings.filter((s) => !s._checked).forEach((s) => notes.length && console.log(`（まだ出ない札の兄弟：${s.accs.join('・')}）`));
console.log(`OK：教えた語 ${taught.size}・札の兄弟 ${B.siblings.filter((s) => s._checked).length}/${B.siblings.length}`);
