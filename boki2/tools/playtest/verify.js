#!/usr/bin/env node
// 遊びの検査（プレイテスト）の検証。偽装・手抜き（遊ばずに書く、ログを作る・書き換える、ペルソナをあとで直す、他人の報告を写す、まとめ役が代筆する）を機械で見つける。
// Usage: node verify.js <playtest.json>
//   playtest.json：{ "game": "<game.html>", "main": "<まとめ役の会話記録.jsonl>", "reviewers": [{ "id", "dir", "transcript", "min": { "manual", "feel", "minutes", "months", "kinds": [...] } }] }
// 調べること（1人ずつ）：
//  1. ログの鎖：各行の prev が1つ前の行の sha256。行番号が連続。時刻が増えていく
//  2. 同じゲーム・同じ道具：session 行の game_sha・harness_sha・auto_sha が、いまのファイルと同じ
//  3. ペルソナ：persona.md の sha256 が全 session で同じ（遊ぶ前に固定）。必須の見出しがあり、各見出しに中身がある
//  4. 遊んだ量：手の操作（click・fill・select・press）の数、気持ちの記録の数、遊んだ時間、手で触った月の数、手で触った画面の種類
//  5. 画面写真：ログにある写真がすべてあり、sha256 が合う
//  6. 報告：report.md があり、[#行番号] の引用が実在し、引用の多くが手の操作か気持ちの記録を指す
//  7. 会話記録との突き合わせ（本人の記録は仕組みが書くので、本人には書き換えられない）：
//     - 各 session の開始〜終了が、本人の Bash の呼び出しの時間の中にある
//     - 本人の会話記録が persona.md・report.md を書いている
//     - 本人がゲームを、道具を通さずに直接開いていない（playwright・chromium を直接呼ぶスクリプトがない）
//     - 本人が log.jsonl を書き換えていない（読む以外のコマンドで log.jsonl に触れていない）
//  8. まとめ役（main）の会話記録が、検査する人のフォルダの persona.md・report.md・log.jsonl を書いていない
//  9. 報告どうしの似かより（10文字の断片の重なり）が大きすぎない
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const HARNESS = path.join(__dirname, 'harness.js'), AUTO = path.join(__dirname, 'auto.js');
const PERSONA_HEADS = ['名前', '年齢', '経歴', '知識', 'ゲーム歴', '動機', '環境', '性格', '物差し', '偏り', 'やめる'];
const MANUAL = new Set(['click', 'fill', 'select', 'press', 'tap', 'tapAt', 'type', 'hover', 'longPress', 'drag', 'scroll', 'swipe', 'back', 'reload', 'rotate', 'textScale', 'zoom', 'offline']);
const out = [];
let bad = 0;
const ng = (who, m) => { bad++; out.push(`✗ ${who}：${m}`); };
const ok = (who, m) => out.push(`✓ ${who}：${m}`);

// 会話記録（jsonl）から、Bash の呼び出しの時間帯と、書いたファイル・実行したコマンドを取り出す
function transcript(file) {
  const calls = [], writes = [], cmds = [], wtimes = {}, handbacks = [];
  if (!file || !fs.existsSync(file)) return null;
  const pend = {};
  for (const l of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!l.trim()) continue;
    let d; try { d = JSON.parse(l); } catch (e) { continue; }
    const c = d.message && Array.isArray(d.message.content) ? d.message.content : [];
    for (const x of c) {
      if (x.type === 'tool_use') {
        pend[x.id] = { t0: Date.parse(d.timestamp), name: x.name, input: x.input || {} };
        if (['Write', 'Edit', 'NotebookEdit'].includes(x.name)) { wtimes[path.resolve((x.input || {}).file_path || '.')] = Date.parse(d.timestamp); }
        if (['Write', 'Edit', 'NotebookEdit'].includes(x.name)) writes.push({ id: x.id, tool: x.name, file: (x.input || {}).file_path || '', content: String((x.input || {}).content || (x.input || {}).new_string || '') });
        if (x.name === 'SubagentHandback') handbacks.push({ t: Date.parse(d.timestamp), message: String((x.input || {}).message || '') });
        if (x.name === 'Bash') cmds.push(String((x.input || {}).command || ''));
      }
      // 「下請けは報告のファイルを書かない」の決まりで断られた Write（中身は本人が書いたもの。collect.js で1字も変えずに保存する）
      if (x.type === 'tool_result' && /Subagents should return findings as text/.test(JSON.stringify(x.content || ''))) { const w = writes.find((y) => y.id === x.tool_use_id); if (w) w.refused = true; }
      if (x.type === 'tool_result' && pend[x.tool_use_id]) { const q = pend[x.tool_use_id]; q.t1 = Date.parse(d.timestamp); if (q.name === 'Bash') calls.push(q); }
    }
  }
  return { calls, writes, cmds, wtimes, handbacks };
}
// 会話記録は、archive.js の写し（行を足すだけ。要約で消えた前半も残る）があればそちらを読む
const tfile = (name, orig) => { const a = cfg.archive && path.join(cfg.archive, name + '.jsonl'); return a && fs.existsSync(a) ? a : orig; };
// 返事（SubagentHandback）の中の印つきの本文：=====REPORT===== … =====END REPORT=====
const marked = (msg, tag) => { const m = msg.match(new RegExp(`=====${tag}=====\\n([\\s\\S]*?)\\n=====END ${tag}=====`)); return m ? m[1] + '\n' : null; };
const grams = (t, k = 10) => { const s = new Set(); const z = t.replace(/\s+/g, ''); for (let i = 0; i + k <= z.length; i++) s.add(z.slice(i, i + k)); return s; };

const reports = {};
const gameSha = sha(fs.readFileSync(cfg.game)), harnessSha = sha(fs.readFileSync(HARNESS)), autoSha = sha(fs.readFileSync(AUTO));
for (const R of cfg.reviewers) {
  const who = R.id, dir = path.resolve(R.dir), min = R.min || {};
  const logF = path.join(dir, 'log.jsonl');
  if (!fs.existsSync(logF)) { ng(who, 'log.jsonl がない'); continue; }
  const lines = fs.readFileSync(logF, 'utf8').split('\n').filter(Boolean);
  const E = lines.map((l) => JSON.parse(l));
  // 1. 鎖
  let chain = true, prev = '0', lastT = 0;
  // inspect の行だけは、記録係の不具合（write に n: r.length を渡した）で n が結果の数に上書きされている。その行は番号を見ず、prev の鎖で順番を確かめる
  E.forEach((e, i) => { if ((e.kind !== 'inspect' && e.n !== i) || e.prev !== prev) chain = false; prev = sha(lines[i]); const t = Date.parse(e.t); if (t < lastT) chain = false; lastT = t; });
  chain ? ok(who, `ログの鎖がつながっている（${E.length}行）`) : ng(who, 'ログの鎖が切れている（書き換え・差し込み・並べ替えの疑い）');
  // 割り当て（panel.json）からいまの端末の画面の大きさを決める（引き直しを反映）
  if (cfg.panel && fs.existsSync(cfg.panel)) { const PN = JSON.parse(fs.readFileSync(cfg.panel, 'utf8')); const a = PN.panel[who]; if (a) R.viewport = PN.viewports[a.viewport_device || a.device] || R.viewport; }
  // 1b. 割り当てられた端末の画面の大きさで遊んだ（panel.json）
  if (R.viewport && E.some((e) => e.kind === 'session' && e.viewport && (e.viewport.width !== R.viewport[0] || e.viewport.height !== R.viewport[1])) && !R.extraViewports && !(R.otherForm && E.filter((e) => e.kind === 'session' && e.viewport && (e.viewport.width !== R.viewport[0] || e.viewport.height !== R.viewport[1])).every((e) => (e.viewport.width < 1024) !== (R.viewport[0] < 1024)))) ng(who, `割り当ての端末（${R.viewport.join('×')}）と違う画面の大きさで遊んだ回がある`);
  // 1c. スマホとPCの両方（オーナー：どちらで遊んでもよい体験に）。otherForm の人は、幅1024未満と1024以上の両方の回がある
  if (R.otherForm) { const ws = E.filter((e) => e.kind === 'session' && e.viewport).map((e) => e.viewport.width); const small = ws.some((w) => w < 1024), big = ws.some((w) => w >= 1024); small && big ? ok(who, 'スマホ・タブレットの幅とPCの幅の両方で遊んだ') : ng(who, `スマホ・タブレットの幅とPCの幅の${small ? 'PC' : 'スマホ'}の側で遊んでいない`); }
  // 2. 同じゲーム・道具
  const sess = E.filter((e) => e.kind === 'session');
  if (!sess.length) ng(who, 'session 行がない');
  if (sess.some((s) => s.game_sha !== gameSha)) ng(who, '別のゲームのファイルで遊んだ回がある');
  if (sess.some((s) => s.harness_sha !== harnessSha || s.auto_sha !== autoSha)) ng(who, '記録係（harness.js・auto.js）が書き換えられた回がある');
  // 3. ペルソナ
  const pf = path.join(dir, 'persona.md');
  if (!fs.existsSync(pf)) ng(who, 'persona.md がない');
  else {
    const ptxt = fs.readFileSync(pf, 'utf8'), psha = sha(fs.readFileSync(pf));
    if (sess.some((s) => s.persona_sha !== psha)) ng(who, 'persona.md が遊んだあとに変わっている');
    const miss = PERSONA_HEADS.filter((h) => !new RegExp(`^#+.*${h}`, 'm').test(ptxt));
    miss.length ? ng(who, `ペルソナの見出しが足りない：${miss.join('・')}`) : ok(who, `ペルソナ ${ptxt.replace(/\s/g, '').length}字・見出しそろう`);
    if (ptxt.replace(/\s/g, '').length < (min.persona || 2500)) ng(who, `ペルソナが短い（${ptxt.replace(/\s/g, '').length}字）`);
  }
  // 3b. 前提知識の棚卸し：固定・見出し・深さ。専門家の役は、実際に読んだ資料（読了ノート）を根拠に引く
  const kf = path.join(dir, 'knowledge.md');
  if (!fs.existsSync(kf)) ng(who, 'knowledge.md がない');
  else {
    const ktxt = fs.readFileSync(kf, 'utf8'), ksha = sha(fs.readFileSync(kf)), klen = ktxt.replace(/\s/g, '').length;
    if (sess.some((s) => s.knowledge_sha !== ksha)) ng(who, 'knowledge.md が遊んだあとに変わっている');
    const heads = min.kheads || ['知っていること', '知らないこと', '物差し', '確かめ方'];
    const miss = heads.filter((h) => !new RegExp(`^#+.*${h}`, 'm').test(ktxt));
    miss.length ? ng(who, `前提知識の見出しが足りない：${miss.join('・')}`) : ok(who, `前提知識 ${klen}字・見出しそろう`);
    if (klen < (min.knowledge || 3000)) ng(who, `前提知識が浅い（${klen}字）`);
    const refs = [...new Set([...ktxt.matchAll(/\[\[([\w-]+):([\w-]+):([\w.-]+)\]\]/g)].map((m) => m.slice(1).join('/')))];
    const notes = refs.filter((r) => fs.existsSync(path.join(cfg.notes, ...r.split('/')) + '.md'));
    if ((min.krefs || 0) > 0) (notes.length >= min.krefs ? ok(who, `前提知識の根拠に読んだ資料 ${notes.length}本`) : ng(who, `前提知識の根拠の資料が少ない：${notes.length}本（${min.krefs}本以上。読了ノートのあるもの）`));
    if (refs.length > notes.length) ng(who, `読了ノートのない資料を引いている：${refs.filter((r) => !notes.includes(r)).slice(0, 3).join(', ')}`);
  }
  // 4. 遊んだ量
  const man = E.filter((e) => MANUAL.has(e.kind)), feel = E.filter((e) => e.kind === 'feel');
  const t0 = Date.parse(E[0].t), t1 = Date.parse(E[E.length - 1].t), mins = Math.round((t1 - t0) / 60000);
  const months = new Set(man.map((e) => e.after && e.after.mi).filter((x) => x != null));
  const kinds = new Set(man.map((e) => String((e.after && e.after.ev) || (e.before && e.before.ev) || '').split(':')[0]).filter(Boolean));
  const need = (x, m, label) => (x >= (m || 0) ? ok(who, `${label} ${x}（${m || 0}以上）`) : ng(who, `${label}が少ない：${x}（${m}以上）`));
  need(man.length, min.manual, '手の操作'); need(feel.length, min.feel, '気持ちの記録'); need(mins, min.minutes, '遊んだ時間（分）'); need(months.size, min.months, '手で触った月');
  const lackK = (min.kinds || []).filter((k) => !kinds.has(k));
  lackK.length ? ng(who, `手で触っていない画面の種類：${lackK.join('・')}`) : ok(who, `手で触った画面の種類：${[...kinds].join('・')}`);
  // 必ず手で触る画面（押した所の一部の文字で決める。練習室・検定会場・マップなど、会社の月の外の画面）
  const lackS = (min.sels || []).filter((x) => !man.some((e) => String(e.sel).includes(x)));
  lackS.length ? ng(who, `手で押していない所：${lackS.join('・')}`) : (min.sels || []).length && ok(who, `必ず押す所をすべて押した（${min.sels.length}）`);
  const whys = man.map((e) => e.why); const uniqW = new Set(whys).size;
  if (man.length && uniqW / man.length < 0.3) ng(who, `ねらいの書き方が同じものばかり（${uniqW}/${man.length}）。考えずに押した疑い`);
  // 5. 画面写真
  let lost = 0; for (const e of E) for (const s of [e.shot].filter(Boolean)) { const f = path.join(dir, s.file); if (!fs.existsSync(f) || sha(fs.readFileSync(f)) !== s.sha) lost++; }
  lost ? ng(who, `画面写真が ${lost} 枚、ない・中身が違う`) : ok(who, '画面写真の sha256 がすべて合う');
  // 6. 報告
  const rf = path.join(dir, 'report.md');
  if (!fs.existsSync(rf)) { ng(who, 'report.md がない'); continue; }
  const rtxt = fs.readFileSync(rf, 'utf8'); reports[who] = rtxt;
  const cites = [...rtxt.matchAll(/\[#(\d+)\]/g)].map((m) => +m[1]);
  const badC = cites.filter((c) => !E[c]);
  const real = cites.filter((c) => E[c] && (MANUAL.has(E[c].kind) || E[c].kind === 'feel' || E[c].kind === 'read' || E[c].kind === 'shot'));
  need(new Set(cites).size, min.cites || 30, '報告の引用（[#行]）');
  if (badC.length) ng(who, `存在しない行の引用：${badC.slice(0, 5).join(',')}`);
  if (cites.length && real.length / cites.length < 0.7) ng(who, '引用の多くが自動の区間を指している');
  // 7. 会話記録
  const T = transcript(tfile(who, R.transcript));
  if (!T) { ng(who, `会話記録が読めない：${R.transcript}`); continue; }
  const inCall = (t) => T.calls.some((c) => t >= c.t0 - 2000 && t <= (c.t1 || Infinity) + 2000);
  const outS = E.filter((e) => e.kind === 'session' || e.kind === 'close').filter((e) => !inCall(Date.parse(e.t)));
  outS.length ? ng(who, `本人の Bash の呼び出しの外で記録された session が ${outS.length} 回（本人が遊んでいない疑い）`) : ok(who, `全 session が本人の Bash の呼び出しの中（${sess.length}回）`);
  // persona.md・report.md は、本人が Write で丸ごと書いた最後の中身と、いまのファイルが1字も違わないこと（あとから誰かが直すと合わなくなる）
  const lastWrite = (f) => { const ws = T.writes.filter((w) => w.tool === 'Write' && path.resolve(w.file) === path.join(dir, f)); return ws.length ? ws[ws.length - 1].content : null; };
  for (const f of ['persona.md', 'knowledge.md', 'report.md']) {
    const w = lastWrite(f), cur = fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), 'utf8') : null;
    // report.md は、断られた Write の中身か、本人の最後の返事（SubagentHandback）の本文と1字も違わないこと（collect.js が保存する）
    const hb = f === 'report.md' && T.handbacks.length ? T.handbacks[T.handbacks.length - 1].message : null;
    if (f === 'report.md' && cur != null && T.handbacks.some((h) => marked(h.message, 'REPORT') === cur)) { ok(who, 'report.md は本人の返事の印つきの本文のまま（collect.js で保存）'); continue; }
    if (f === 'report.md' && cur != null && hb === cur) { ok(who, 'report.md は本人の最後の返事の本文のまま（Write が決まりで断られたため collect.js で保存）'); continue; }
    w == null ? ng(who, `本人の会話記録に、${f} を Write で書いた跡がない`) : w !== cur ? ng(who, `${f} が、本人が最後に Write で書いた中身と違う（あとから変えられた疑い）`) : ok(who, `${f} は本人が書いた中身のまま${T.writes.filter((x) => x.content === w && x.refused).length ? '（Write が決まりで断られたため collect.js で保存）' : ''}`);
  }
  for (const f of (R.extra || [])) { const w = lastWrite(f), cur = fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), 'utf8') : null; const tag = f.replace(/\.md$/, '').toUpperCase(); if (cur != null && T.handbacks.some((h) => marked(h.message, tag) === cur)) { ok(who, `${f} は本人の返事の印つきの本文のまま`); continue; } w == null ? ng(who, `${f} を本人が Write で書いた跡がない`) : w !== cur ? ng(who, `${f} が本人の書いた中身と違う`) : ok(who, `${f} は本人が書いた中身のまま`); }
  // ログのすべての行が、本人の Bash の呼び出しの中で書かれている
  const outL = E.filter((e) => !inCall(Date.parse(e.t)));
  outL.length ? ng(who, `本人の Bash の呼び出しの外で書かれたログの行が ${outL.length} 行`) : ok(who, 'ログのすべての行が本人の Bash の呼び出しの中');
  const scripts = [...T.writes.map((w) => w.content), ...T.cmds];
  const direct = scripts.filter((s) => /chromium\.launch|launchPersistentContext|require\(['"][^'"]*playwright['"]\)/.test(s) && !/playtest\/harness\.js/.test(s));
  direct.length ? ng(who, `道具を通さずにブラウザを直接開いたスクリプトが ${direct.length} 本`) : ok(who, 'ブラウザはすべて記録係を通して開いた');
  const touch = T.cmds.filter((c) => /log\.jsonl/.test(c) && !/^\s*(cat|head|tail|wc|grep|jq|node [^|]*verify\.js|less|ls)\b/.test(c.replace(/^cd [^&;]+(&&|;)\s*/, '')));
  const touchW = T.writes.filter((w) => /log\.jsonl/.test(w.file));
  touch.length || touchW.length ? ng(who, `log.jsonl に読む以外で触れたコマンドが ${touch.length + touchW.length} 個（中身を確かめること）`) : ok(who, 'log.jsonl を書き換えていない');
}
// 7b. 人物像の重なり（オーナー：1人の頭で何役も演じる形を防ぐ）。persona.md の先頭の属性と、文の重なり
const fm = (t) => { const m = t.match(/^---\n([\s\S]*?)\n---/); const o = {}; if (!m) return null; for (const l of m[1].split('\n')) { const k = l.match(/^(\w+):\s*(.*)$/); if (k) o[k[1]] = k[2].replace(/^\[|\]$/g, '').split(/[,、]\s*/).map((x) => x.trim()).filter(Boolean); } return o; };
const P = {};
for (const R of cfg.reviewers) { const f = path.join(path.resolve(R.dir), 'persona.md'); if (fs.existsSync(f)) { const t = fs.readFileSync(f, 'utf8'); P[R.id] = { t, a: fm(t) }; if (!P[R.id].a) ng(R.id, 'persona.md の先頭に属性（--- で囲んだ id・age・gender・region・devices・play_slots・background・games）がない'); } }
const pid = Object.keys(P);
for (let i = 0; i < pid.length; i++) for (let j = i + 1; j < pid.length; j++) {
  const A = P[pid[i]], Bp = P[pid[j]]; if (!A.a || !Bp.a) continue;
  const same = (k) => (A.a[k] || []).some((x) => (Bp.a[k] || []).includes(x));
  const age = Math.abs(+((A.a.age || [])[0]) - +((Bp.a.age || [])[0])) <= 4;
  const ga = new Set(A.a.games || []), gb = new Set(Bp.a.games || []); let gi = 0; for (const x of ga) if (gb.has(x)) gi++;
  const gj = gi / (ga.size + gb.size - gi || 1);
  const score = [age, same('gender'), same('region'), same('devices'), same('play_slots'), same('background')].filter(Boolean).length + (gj > 0.25 ? 1 : 0);
  const a = grams(A.t), b = grams(Bp.t); let inter = 0; for (const x of a) if (b.has(x)) inter++; const jac = inter / (a.size + b.size - inter || 1);
  if (score >= 4) ng(`${pid[i]}×${pid[j]}`, `人物像の属性が重なりすぎ（${score}/7：年齢・性別・地域・端末・遊ぶ時間・経歴・好きな作品）`);
  if (jac > 0.05) ng(`${pid[i]}×${pid[j]}`, `人物像の文が似すぎ（重なり ${(jac * 100).toFixed(1)}%）`);
}
if (pid.length > 1) ok('人物像', `${pid.length}人の属性と文の重なりを調べた`);
// 7c. 遊ぶ前と後のテスト（受験する役）：pretest.md は遊ぶ前に本人が書き固定、posttest.md は遊んだあとに本人が書く
for (const R of cfg.reviewers.filter((r) => r.tests)) {
  const dir = path.resolve(R.dir), T = transcript(tfile(R.id, R.transcript)); if (!T) continue;
  const E = fs.existsSync(path.join(dir, 'log.jsonl')) ? fs.readFileSync(path.join(dir, 'log.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
  const first = E.find((e) => e.kind === 'session'), last = E[E.length - 1];
  for (const [f, cond] of [['pretest.md', (t) => first && t < Date.parse(first.t)], ['posttest.md', (t) => last && t > Date.parse(last.t)]]) {
    const ws = T.writes.filter((w) => w.tool === 'Write' && path.resolve(w.file) === path.join(dir, f));
    if (!ws.length) { ng(R.id, `${f} を本人が Write で書いていない`); continue; }
    const cur = fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), 'utf8') : null;
    if (ws[ws.length - 1].content !== cur) ng(R.id, `${f} が本人の書いた中身と違う`);
    const call = T.calls.length ? null : null; // Write の時刻は会話記録の並びで見る
    const tw = T.wtimes && T.wtimes[path.join(dir, f)]; if (tw && !cond(tw)) ng(R.id, `${f} を書いた時刻が決まりと合わない（pretest は遊ぶ前、posttest は遊んだあと）`); else ok(R.id, `${f} の時刻が決まりどおり`);
  }
}
// 8. まとめ役
const M = transcript(tfile('main', cfg.main));
if (M) {
  const dirs = cfg.reviewers.map((r) => path.resolve(r.dir));
  const hit = M.writes.filter((w) => dirs.some((d) => path.resolve(w.file).startsWith(d + path.sep) && /(persona|report)\.md$|log\.jsonl$/.test(w.file)));
  // フォルダの名前（pt-<id>）はほかで使わない名前にしてあるので、変数で書いたコマンドでも名前で見つかる
  const hitC = M.cmds.filter((c) => !/^\s*(cd [^&;]+&&\s*)?node [^|;&>]*playtest\/collect\.js [^|;&>]+$/.test(c) && dirs.some((d) => c.includes(path.basename(d))) && /(persona|report)\.md|log\.jsonl|shots/.test(c) && /(>|tee|cat <<|python|node -e|sed -i|cp |mv |rm |echo )/.test(c));
  hit.length || hitC.length ? ng('まとめ役', `検査する人のファイルを書いた・動かした跡が ${hit.length + hitC.length} 個`) : ok('まとめ役', '検査する人の persona・report・log を書いていない');
} else ng('まとめ役', 'まとめ役の会話記録が読めない');
// 9. 似かより
const ids = Object.keys(reports);
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
  const a = grams(reports[ids[i]]), b = grams(reports[ids[j]]); let inter = 0; for (const x of a) if (b.has(x)) inter++;
  const jac = inter / (a.size + b.size - inter || 1);
  jac > 0.08 ? ng(`${ids[i]}×${ids[j]}`, `報告が似すぎている（重なり ${(jac * 100).toFixed(1)}%）`) : ok(`${ids[i]}×${ids[j]}`, `重なり ${(jac * 100).toFixed(1)}%`);
}
console.log(out.join('\n'));
console.log(bad ? `\n✗ ${bad} 件` : '\nOK');
process.exit(bad ? 1 : 0);
