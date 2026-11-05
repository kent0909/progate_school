#!/usr/bin/env node
// J-D（DESIGN-CINC-REBUILD 版0.2 の事実と出来の判定役）：設計書とスクリプトの中身を自分で確かめる道具。
// ゲームのファイル・設計者のスクリプトは変えない（読み込んで呼ぶだけ）。
// 使い方：node boki2/docs/audit/cinc-redesign-fact-check.js <節>
//   tally    79行の決定を自分の数え方で数え、土台の列（A／B の程度）を A・B の表と突き合わせる
//   ramp     2号店にも開業の坂が掛かるか（world.js:137 と :320 の写し方の確かめ）
//   lever    2号店の値段・LINE・人の手（設計書が測っていない、いちばん素直な立て直しの手）を変えたときの坂
//   phrases  簡略化の言い回し（依頼書の12語と同じ働きの語）を本文から全部拾い、台帳の行と並べる
//   numbers  本文の数（分数・小数・人/日・円/月・か月目・倍）を抜き出し、スクリプトの出力にあるかを見る
//   judge <判定書>  判定書の 79行の表と K の表の行数・判定の内訳を数える
'use strict';
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../..');
const DOC = path.join(root, 'docs/DESIGN-CINC-REBUILD.md');
const s = fs.readFileSync(DOC, 'utf8'); const L = s.split('\n');
const cells = (l) => l.split('|').slice(1, -1).map((c) => c.trim());
const mode = process.argv[2] || 'tally';
const out = (...a) => console.log(...a);

function t79() { const a = s.indexOf('<!-- T79 -->'), b = s.indexOf('<!-- /T79 -->'); return s.slice(a, b).split('\n').filter((l) => /^\|/.test(l)).slice(2).map(cells); }

if (mode === 'tally') {
  const rows = t79(); const tally = {};
  for (const r of rows) tally[r[3]] = (tally[r[3]] || 0) + 1;
  out(`79行：${rows.length} 行。決定の内訳`, JSON.stringify(tally));
  // 「大胆」と書いて中身が「土台として残す」だけの行
  const base = rows.filter((r) => r[3] === '大胆な形を採る' && /の土台/.test(r[5]));
  out(`大胆のうち中身が「◯大の土台」の行：${base.length}（${base.map((r) => r[0]).join(' ')}）→ 新しく大胆な形を書いた行 ${tally['大胆な形を採る'] - base.length}`);
  // A の表と B の表の程度
  const A = {}; const a = fs.readFileSync(path.join(root, 'docs/analysis/cinc-rebuild-A-design.md'), 'utf8').split('\n');
  for (const l of a) { const c = cells(l); if (c.length > 4 && /^(P|R|L|V|E)\d/.test(c[0])) A[c[0]] = c[3]; }
  const B = {}; const b = fs.readFileSync(path.join(root, 'docs/analysis/cinc-rebuild-B-game.md'), 'utf8').split('\n');
  for (const l of b) { const c = cells(l); if (c.length > 4 && /^(P|R|L|V|E)\d/.test(c[0])) { const id = c[0].replace(/^L(\d+)a$/, 'L$1小').replace(/^L(\d+)b$/, 'L$1大'); B[id] = c[3]; } }
  const nA = { '入っている': '入', '一部': '一部', '入っていない': '無', '逆': '逆' };
  const nB = { '作られている': '作', '一部': '一部', 'ない': '無' };
  let ok = 0; const diff = [];
  for (const r of rows) {
    const m = r[2].match(/^([^／（→ ]+)(?:（[^）]*）)?(?:[^／]*)?／([^ →（]+)/);
    const da = m ? m[1] : '?', db = m ? m[2] : '?';
    const ea = nA[A[r[0]]], eb = nB[B[r[0]]];
    if (da === ea && db === eb) ok++; else diff.push(`${r[0]}：設計書「${r[2]}」／A「${A[r[0]]}」B「${B[r[0]]}」`);
  }
  out(`土台の列の A／B が A・B の表と同じ：${ok}/${rows.length}`); diff.forEach((d) => out('  違う：' + d));
  // 最小・捨てるの理由の語
  for (const r of rows.filter((r) => /最小|捨てる/.test(r[3]))) out(`  ${r[0]} ${r[3]} 理由「${r[4]}」`);
}

function loadSim() {
  global.window = global;
  const STORY = require(path.join(root, 'tools/ramen-files.js')).story;
  ['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...STORY].forEach((f) => require(path.join(root, f)));
  return window.SIMDATA;
}

if (mode === 'ramp') {
  // 同じ世界・同じ月で、坂の値だけを変えて2号店の客数が変わるかを見る。変わらなければ「2号店に坂は掛からない」が正しい。
  const D = loadSim(), Wd = D.world, C = D.coef, BW = D.bowl;
  const completeFx = D.cards.byId.site2_complete.options[0].outcomes[0].fx;
  const one = (rs, re, area) => {
    C.table.rampStart.v = rs; C.table.rampEnd.v = re;
    let W = Wd.create({ seed: 1, area: 'shotengai', form: 'part1', bowl: BW.presets[0].spec }); let prev = null;
    for (let t = 0; t < 19; t++) { const p = Wd.policy0(W, prev); const r = Wd.month(W, p, { noise: false, noCards: true }); W = r.W; prev = p; }
    W.flags.y2Build = { area, form: 'part1', at: W.t, staff: 'hire' }; completeFx(W);
    const res = []; for (let k = 0; k < 6; k++) { const p = Wd.policy0(W, prev); const r = Wd.month(W, p, { noise: false, noCards: true }); W = r.W; prev = p; res.push({ t: r.res.t, ramp: +Wd.rampOf(r.res.t).toFixed(3), N2: +r.res.stores[1].N.toFixed(2) }); }
    return res;
  };
  for (const area of ['jutaku', 'ekimae']) {
    const a = one(0.55, 0.85, area), b = one(0.55, 0.40, area), c = one(0.55, 1.0, area);
    out(`2号店（${area}、seed 1、t=19 に開店）の1日の客数：開業の坂 0.55→0.85（いま）／0.55→0.40／0.55→1.0`);
    a.forEach((x, i) => out(`  t=${x.t}（rampOf=${x.ramp}／${Wd.rampOf ? '' : ''}）：${x.N2}／${b[i].N2}／${c[i].N2}`));
  }
  C.table.rampStart.v = 0.55; C.table.rampEnd.v = 0.85;
  out('読み：world.js:320 は営業する店を list[0] に置くとき id を "me" に書き換える（{ ...me, id: "me" }）。そのため :137 の「id が me の店だけ坂」は2号店にも当たり、坂の値は会社の暦 W.t（2号店の開店からの月ではない）で引かれる。');
}

if (mode === 'lever') {
  // 設計者の site2-slope.js と同じ読み込み・同じ1号店の手・同じ完成の fx・同じ物差しで、2号店の「何もしない」の値段・LINE だけを変える。
  // 2号店の手は world.js:216 で policy0(v)（前の月の手なし）＝値段は店の price のまま。値段は st.price を毎月書けば policy0 が拾う（:152）。
  const D = loadSim(), Wd = D.world, C = D.coef, BW = D.bowl;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const price1 = (t) => (t < 12 ? 800 : t < 24 ? 850 : 900);
  const pol1 = (W, prev) => { const p = Wd.policy0(W, prev); Object.assign(p, { price: price1(W.t), map: true, haccp: true, line: true, flyer: 30000, parts: 1, family: 0, prep: 'mid', supplier: 'std', sns: false, forecast: false, inspect: false, tweak: false }); return Wd.fitTime(W, p, D.rng(W.seed * 37 + W.t)); };
  const completeFx = D.cards.byId.site2_complete.options[0].outcomes[0].fx;
  const FITOUT = C('fitout'), DEPOSIT = C('deposit'), OPEN_T = 19, H = 72;
  const warm = (seed) => { let W = Wd.create({ seed, area: 'shotengai', form: 'part1', bowl: BW.presets[0].spec }); let prev = null; for (let t = 0; t < OPEN_T; t++) { const p = pol1(W, prev); const r = Wd.month(W, p, { noise: false, noCards: true, rng: D.rng(seed * 104729 + t) }); W = r.W; prev = p; } return { W, prev }; };
  const run = (base, o) => { let w = clone(base.W), pr = base.prev; if (o.area) { w.flags.y2Build = { area: o.area, form: o.form, at: w.t, staff: 'hire' }; completeFx(w); }
    const op1 = [], op2 = [], dep2 = [];
    for (let t = OPEN_T; t < OPEN_T + H; t++) { if (o.area && w.stores[1]) { if (o.price) w.stores[1].price = o.price; if (o.line) w.stores[1].line = true; }
      const p = pol1(w, pr); const r = Wd.month(w, p, { noise: false, noCards: true, rng: D.rng(base.W.seed * 104729 + t) }); w = r.W; pr = p;
      const a = r.res.stores ? r.res.stores[0] : r.res; op1.push(a.op); const b = r.res.stores && r.res.stores[1]; if (b && b.sales != null) { op2.push(b.op); dep2.push(b.dep || 0); } }
    return { op1, op2, dep2 }; };
  const med = (a) => { const b = a.filter((x) => x != null).sort((x, y) => x - y); if (!b.length) return null; return b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2; };
  const VARS = [['いま（2号店は 850円・LINE なし）', {}], ['2号店も 900円', { price: 900 }], ['2号店 900円＋LINE', { price: 900, line: true }], ['2号店 800円', { price: 800 }], ['2号店 950円＋LINE', { price: 950, line: true }]];
  const res = VARS.map(() => []);
  for (let seed = 0; seed <= 9; seed++) { const base = warm(seed); const alone = run(base, {}).op1;
    for (const area of ['shotengai', 'ekimae', 'jutaku']) for (const form of ['part1', 'part2']) VARS.forEach(([, v], k) => { const r = run(base, { area, form, ...v });
      const cann = alone.map((x, i) => x - r.op1[i]); let cs = 0, cc = 0, pS = null, pC = null; let fb = null;
      for (let i = 0; i < r.op2.length; i++) { if (fb == null && r.op2[i] >= 0) fb = i + 1; cs += r.op2[i] + r.dep2[i]; cc += r.op2[i] + r.dep2[i] - cann[i]; if (pS == null && cs >= FITOUT) pS = i + 1; if (pC == null && cc >= FITOUT + DEPOSIT) pC = i + 1; }
      res[k].push({ seed, area, form, loss8: r.op2.slice(0, 8).filter((x) => x < 0).length, fb, pS, pC, cum: cc }); }); }
  out('2号店の値段・LINE を変えたときの坂（家族を除く60組・乱数なし・札なし・72か月。設計者の site2-slope.js と同じ物差し）');
  VARS.forEach(([name], k) => { const x = res[k]; out(`  ${name}：8か月全部赤字 ${x.filter((r) => r.loss8 === 8).length}/60、初めて黒字 中央値 ${med(x.map((r) => r.fb))}（来ない ${x.filter((r) => r.fb == null).length}）、店の取り戻し ${med(x.map((r) => r.pS))}（来ない ${x.filter((r) => r.pS == null).length}）、会社の取り戻し ${med(x.map((r) => r.pC))}（来ない ${x.filter((r) => r.pC == null).length}）、72か月の会社の累計の中央値 ${Math.round(med(x.map((r) => r.cum)) / 1e4)}万円`); });
  // 支配的か：組ごとに会社の累計が最大の手
  const best = {}; for (let i = 0; i < 60; i++) { let bk = 0; VARS.forEach((_, k) => { if (res[k][i].cum > res[bk][i].cum) bk = k; }); best[VARS[bk][0]] = (best[VARS[bk][0]] || 0) + 1; }
  out('  組ごとに会社の累計が最大になる手：' + JSON.stringify(best));
}

if (mode === 'site') {
  // T7.4「場所×形の最適が町で入れ替わる」の確かめ。設計者の site2-slope.js と同じ手・同じ物差し（何もしない）で、
  // 町（seed 0〜9）ごとに、2号店の場所×形（家族を除く6通り）のうち会社の累計（2号店の営業の現金−1号店の食い合い−内装−保証金）が最大の組を数える。
  // 設計者のスクリプトは1号店を商店街に固定している。ゲームの1号店は商店街か駅前（ramen-y1.js:161〜165）なので両方で回す。
  const D = loadSim(), Wd = D.world, C = D.coef, BW = D.bowl;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const price1 = (t) => (t < 12 ? 800 : t < 24 ? 850 : 900);
  const pol1 = (W, prev) => { const p = Wd.policy0(W, prev); Object.assign(p, { price: price1(W.t), map: true, haccp: true, line: true, flyer: 30000, parts: 1, family: 0, prep: 'mid', supplier: 'std', sns: false, forecast: false, inspect: false, tweak: false }); return Wd.fitTime(W, p, D.rng(W.seed * 37 + W.t)); };
  const completeFx = D.cards.byId.site2_complete.options[0].outcomes[0].fx;
  const OPEN_T = 19;
  for (const home of ['shotengai', 'ekimae']) for (const H of [24, 72]) {
    const best = {};
    for (let seed = 0; seed <= 9; seed++) {
      let W = Wd.create({ seed, area: home, form: 'part1', bowl: BW.presets[0].spec }); let prev = null;
      for (let t = 0; t < OPEN_T; t++) { const p = pol1(W, prev); const r = Wd.month(W, p, { noise: false, noCards: true, rng: D.rng(seed * 104729 + t) }); W = r.W; prev = p; }
      const run = (o) => { let w = clone(W), pr = prev; if (o) { w.flags.y2Build = { ...o, at: w.t, staff: 'hire' }; completeFx(w); } const op1 = [], v2 = [];
        for (let t = OPEN_T; t < OPEN_T + H; t++) { const p = pol1(w, pr); const r = Wd.month(w, p, { noise: false, noCards: true, rng: D.rng(seed * 104729 + t) }); w = r.W; pr = p; const a = r.res.stores ? r.res.stores[0] : r.res; op1.push(a.op); const b = r.res.stores && r.res.stores[1]; if (b && b.sales != null) v2.push(b.op + (b.dep || 0)); }
        return { op1, v2 }; };
      const alone = run(null).op1; let bk = null, bv = -Infinity;
      for (const area of ['shotengai', 'ekimae', 'jutaku']) for (const form of ['part1', 'part2']) { const r = run({ area, form }); const v = r.v2.reduce((s, x) => s + x, 0) - alone.reduce((s, x, i) => s + x - r.op1[i], 0) - C('fitout') - C('deposit'); if (v > bv) { bv = v; bk = `${area}・${form}`; } }
      best[bk] = (best[bk] || 0) + 1;
    }
    out(`1号店＝${home}、開いてから${H}か月：町ごとに会社の累計が最大の2号店の場所×形 ${JSON.stringify(best)}`);
  }
}

if (mode === 'phrases') {
  // 依頼書（BRIEF-CINC-REDESIGN-AUDIT J-D 基準6）の12語＋同じ働きの言い回し
  const WORDS = ['範囲外', '簡単な', '一覧だけ', '固定', '後回し', '省く', '最低限', 'まずは', '当面', '将来', '後の段', '別の版'];
  const SAME = ['入れない', '足さない', '作らない', '増やさない', '置かない', '広げない', '外す', '外した', 'だけにする', 'のまま', '変えない', '絞', '限る', '止める', '書かない', '測っていない', '数えていない', '決めていない', 'しない'];
  const ls = L.findIndex((l) => /^## 11\. 簡略化の台帳/.test(l)), le = L.findIndex((l, i) => i > ls && /^## /.test(l));
  const skip = (i) => (i >= ls && i < le) || /^## (15|17)\./.test('') ;
  const hit = {}; const lines = {};
  L.forEach((l, i) => { if (i >= ls && i < le) return; for (const w of [...WORDS, ...SAME]) { const re = new RegExp(w, 'g'); const n = (l.match(re) || []).length; if (n) { hit[w] = (hit[w] || 0) + n; (lines[w] = lines[w] || []).push(i + 1); } } });
  out('12語（台帳の章を除く本文）'); for (const w of WORDS) out(`  ${w}：${hit[w] || 0}${lines[w] ? '  行 ' + lines[w].join(',') : ''}`);
  out('同じ働きの言い回し（台帳の章を除く本文）'); for (const w of SAME) out(`  ${w}：${hit[w] || 0}${lines[w] ? '  行 ' + lines[w].slice(0, 60).join(',') + (lines[w].length > 60 ? ' …' : '') : ''}`);
}

if (mode === 'numbers') {
  const outs = ['cinc-redesign-site2-slope.out.txt', 'cinc-redesign-site2-slope-ramp.out.txt', 'cinc-redesign-stuck-rerun.out.txt', 'cinc-redesign-p1-recount.out.txt', 'cinc-redesign-voices-recount.out.txt', 'cinc-redesign-count.out.txt'].map((f) => fs.readFileSync(path.join(root, 'docs/analysis', f), 'utf8')).join('\n').replace(/,/g, '');
  const hay = outs;
  // 数の形：分数 a/b、小数、人/日・円/月・万円/月・か月目・倍（×n）
  const pats = [/\d+\/\d+/g, /\d+\.\d+/g, /[\d,]+(?:\.\d+)?人\/日/g, /[\d,]+(?:\.\d+)?円\/月/g, /\d+(?:\.\d+)?万円\/月/g, /\d+(?:\.\d+)?か月目/g];
  // 数え先の章：要点・1章・T2・T7.1・T1.1・T8.1・3章の判定のまま・7章・9章・16章（数の出どころがスクリプトの所）
  const want = [[12, 24], [29, 46], [270, 274], [318, 358], [606, 614], [677, 686], [99, 120], [1045, 1072], [1266, 1282]];
  const found = [], miss = [];
  for (const [a, b] of want) for (let i = a - 1; i < b; i++) { const l = L[i] || ''; if (/【置き値/.test(l) && !/スクリプト/.test(l)) continue;
    for (const p of pats) for (const m of (l.match(p) || [])) { let v = m.replace(/,/g, '').replace(/(人\/日|円\/月|万円\/月|か月目)$/, '');
      if (/万円\/月$/.test(m)) { const yen = Math.round(parseFloat(v) * 1e4); v = String(yen); }
      let ok = hay.includes(v);
      if (!ok && /^\d+\.\d+$/.test(v)) ok = hay.includes(v.replace(/0+$/, '').replace(/\.$/, ''));
      if (!ok && /^\d+(\.\d+)?万/.test(m)) { const t = Math.round(parseFloat(m) * 1e4); ok = new RegExp(String(t).slice(0, 2) + '\\d{3}').test(hay); }
      (ok ? found : miss).push(`L${i + 1}:${m}`); } }
  out(`本文の数（要点・1章・T1.1・T2.1・T7.1・T8.1・3章・7〜9章・16章）：${found.length + miss.length}。出力のファイルに同じ数がある ${found.length}／ない ${miss.length}`);
  out('ない数（手で1つずつ見る）：'); const uniq = [...new Set(miss)]; for (const m of uniq) out('  ' + m);
}

if (mode === 'judge') {
  const f = process.argv[3]; const t = fs.readFileSync(f, 'utf8');
  const block = (tag) => { const i = t.indexOf(`<!-- ${tag} -->`), j = t.indexOf(`<!-- /${tag} -->`); return i < 0 || j < 0 ? [] : t.slice(i, j).split('\n').filter((l) => /^\|/.test(l)).slice(2).map(cells); };
  const r79 = block('J79'), rk = block('JK'), rr = block('JREAD');
  const ids = new Set(t79().map((r) => r[0]));
  const miss = [...ids].filter((x) => !r79.some((r) => r[0] === x));
  const v = {}; r79.forEach((r) => { v[r[r.length - 2]] = (v[r[r.length - 2]] || 0) + 1; });
  out(`判定書の79行の表：${r79.length} 行、設計書の79行のうち欠け ${miss.length}（${miss.join(' ') || 'なし'}）。判定の内訳 ${JSON.stringify(v)}`);
  const kv = {}; rk.forEach((r) => { kv[r[r.length - 2]] = (kv[r[r.length - 2]] || 0) + 1; });
  const kmiss = []; for (let i = 1; i <= 22; i++) if (!rk.some((r) => r[0] === 'K' + i)) kmiss.push('K' + i);
  out(`判定書の K の表：${rk.length} 行、欠け ${kmiss.length}（${kmiss.join(' ') || 'なし'}）。判定の内訳 ${JSON.stringify(kv)}`);
  const rv = {}; rr.forEach((r) => { rv[r[r.length - 2]] = (rv[r[r.length - 2]] || 0) + 1; });
  out(`判定書の「ぶつかりなし」の節を自分で読んだ表：${rr.length} 行。内訳 ${JSON.stringify(rv)}`);
  const tag = (re) => (t.match(re) || []).length;
  out(`【確かめた】${tag(/【確かめた】/g)}／【問い】${tag(/【問い】/g)}`);
}
