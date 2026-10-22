#!/usr/bin/env node
// 情報収集の証跡を検査する（さぼり・取りこぼし・規約違反・転載を機械で見つける）。
//   台帳 research/sources.json … 何を集めるか（expected）、何を対象外にしたか（excluded と理由）、利用規約の確認結果
//   記録 research/ledger.jsonl と research/ledger-pending/*.jsonl … 1回の取得ごとに1行（URL・時刻・状態・サイズ・sha256）
//   読了 research/notes/<src>/<coll>/<doc>.md … 読んだ証拠（sha256・本文にそのまま出る語句 anchors）と自分の言葉の分析
//   原文 research/raw/（git に入れない）… あれば anchors と転載を本文で照合する。なければ「照合不能」として数える
// Usage: node boki2/tools/research-check.js [--write] [--spot N] [--src id]
//   --write  集計を research/STATUS.md に書く（コミットして証跡にする）
//   --spot N 読了ノートを N 本無作為に選び、anchors が原文のどこに出るかを前後の文字つきで表示（人の目での抜き打ち）
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const R = path.join(__dirname, '..', 'research');
const DOCS = path.join(__dirname, '..', 'docs');
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const onlySrc = opt('--src');
const spotN = Number(opt('--spot') || 0);

const errors = [], warns = [];
const err = (s, m) => errors.push(`${s}: ${m}`);
const warn = (s, m) => warns.push(`${s}: ${m}`);

// ---------- 読み込み ----------
const sources = JSON.parse(fs.readFileSync(path.join(R, 'sources.json'), 'utf8')).sources;
const ledger = [];
for (const f of [path.join(R, 'ledger.jsonl'), ...lsr(path.join(R, 'ledger-pending')).filter((p) => p.endsWith('.jsonl'))]) {
  if (!fs.existsSync(f)) continue;
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    try { ledger.push({ ...JSON.parse(line), _at: `${path.relative(R, f)}:${i + 1}` }); } catch (e) { err('記録', `${path.relative(R, f)}:${i + 1} がJSONとして読めない`); }
  });
}
const notes = lsr(path.join(R, 'notes')).filter((p) => p.endsWith('.md')).map(readNote).filter(Boolean);
// 取得記録は追記だけ：最後のコミットにある記録の行が、いまの記録（ledger.jsonl と ledger-pending のどこか）にすべて残っていること
{
  const { spawnSync: sp } = require('child_process');
  const now = new Set(ledger.map(({ _at, ...e }) => JSON.stringify(e)));
  const rel = path.relative(path.join(R, '..', '..'), R);
  const files = (sp('git', ['ls-tree', '-r', '--name-only', 'HEAD', rel], { cwd: path.join(R, '..', '..'), encoding: 'utf8' }).stdout || '').split('\n').filter((f) => /ledger(\.jsonl|-pending\/.*\.jsonl)$/.test(f));
  let lost = 0; const ex = [];
  for (const f of files) for (const line of (sp('git', ['show', `HEAD:${f}`], { cwd: path.join(R, '..', '..'), encoding: 'utf8', maxBuffer: 1 << 28 }).stdout || '').split('\n')) {
    if (!line.trim()) continue; let e; try { e = JSON.parse(line); } catch (x) { continue; }
    if (!now.has(JSON.stringify(e))) { lost++; if (ex.length < 3) ex.push(`${e.doc}（${e.status}）`); }
  }
  if (lost) err('記録', `最後のコミットにあった取得記録が ${lost} 行、消えている・書き換えられている（${ex.join('・')}）。取得記録は追記だけ`);
}

function lsr(d) { if (!fs.existsSync(d)) return []; return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? lsr(path.join(d, e.name)) : [path.join(d, e.name)])); }
function readNote(p) {
  const s = fs.readFileSync(p, 'utf8');
  const m = s.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) { err('ノート', `${path.relative(R, p)} に先頭ヘッダ（--- … ---）がない`); return null; }
  const h = {};
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^(\w+):\s*(.*)$/);
    if (!mm) continue;
    let v = mm[2].trim();
    // 配列は JSON（["…", "…"]）か、半角カンマ区切り。語句の中の「、」では区切らない（数字の桁区切りを含むなら JSON で書く）
    if (v.startsWith('[')) { try { v = JSON.parse(v); } catch (x) { v = v.replace(/^\[|\]$/g, '').split(/\s*,\s*/).map((y) => y.trim().replace(/^["']|["']$/g, '')).filter(Boolean); } }
    h[mm[1]] = v;
  }
  return { ...h, doc: String(h.doc), body: m[2], _path: path.relative(R, p) };
}

// ---------- 原文の場所と本文テキスト ----------
const rawByHash = new Map();
// ファイルの sha256 は、パス・サイズ・更新時刻が同じなら research/raw/.hashcache.json の値を使う
const HC = path.join(R, 'raw', '.hashcache.json');
const hashCache = fs.existsSync(HC) ? JSON.parse(fs.readFileSync(HC, 'utf8')) : {};
function fileSha(p) { const st = fs.statSync(p); const k = `${st.size}:${st.mtimeMs}`; if (hashCache[p] && hashCache[p].k === k) return hashCache[p].h; const h = sha(fs.readFileSync(p)); hashCache[p] = { k, h }; return h; }
// 他の担当が取得・改名している最中のファイルは消えていることがある。検査ごと落とさず、その1件だけ飛ばす
for (const p of lsr(path.join(R, 'raw'))) { if (!p.includes(`${path.sep}.text${path.sep}`) && !p.endsWith('.hashcache.json')) { try { rawByHash.set(fileSha(p), p); } catch (x) {} } }
try { fs.writeFileSync(HC, JSON.stringify(hashCache)); } catch (x) {}
function sha(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function rawFile(e) {
  if (e.sha256 && rawByHash.has(e.sha256)) return rawByHash.get(e.sha256);
  const fp = e.file ? path.resolve(R, e.file) : null;
  if (fp && fs.existsSync(fp) && (!e.sha256 || fileSha(fp) === e.sha256)) return fp;
  return null;
}
const textCache = new Map();
// pdftotext の結果は research/raw/.text/<sha256>.txt に保存して使い回す（毎回の抽出で検査が遅くならないように）
function pdfText(file) {
  const dir = path.join(R, 'raw', '.text');
  const key = fileSha(file);
  const c = path.join(dir, key + '.txt');
  if (fs.existsSync(c)) return fs.readFileSync(c, 'utf8');
  const t = spawnSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8', maxBuffer: 1 << 28 }).stdout || '';
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(c, t);
  return t;
}
// 2段組みの PDF は -layout だと隣の段が文の途中に混ざり、正しく写した語句が見つからない（誤検出）。段組みの順の抽出（-layout なし）も持つ
function pdfTextFlow(file) {
  const dir = path.join(R, 'raw', '.text');
  const c = path.join(dir, fileSha(file) + '.flow.txt');
  if (fs.existsSync(c)) return fs.readFileSync(c, 'utf8');
  const t = spawnSync('pdftotext', [file, '-'], { encoding: 'utf8', maxBuffer: 1 << 28 }).stdout || '';
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(c, t);
  return t;
}
// 語句が文書のどこにあるか（0〜1）。どちらの抽出にもなければ -1
function posIn(texts, a) { for (const t of texts) { const i = t.indexOf(a); if (i >= 0) return i / t.length; } return -1; }
const textsOf = (file) => { const a = norm(textOf(file)); return /\.pdf$/i.test(file) ? [a, norm(pdfTextFlow(file))] : [a]; };
function textOf(file) {
  if (!file) return null;
  if (textCache.has(file)) return textCache.get(file);
  let t = '';
  const magic = (() => { try { const fd = fs.openSync(file, 'r'); const b = Buffer.alloc(8); fs.readSync(fd, b, 0, 8, 0); fs.closeSync(fd); return b; } catch (x) { return Buffer.alloc(0); } })();
  if (/\.pdf$/i.test(file)) t = pdfText(file);
  // 表計算（xlsx は zip の PK、旧形式の xls は D0CF11E0）：拡張子に関係なく中身の印で見分け、tools/sheet-text.py でセルの値を文字にする（結果は raw/.text/ に保存して使い回す）
  else if ((magic[0] === 0x50 && magic[1] === 0x4b) || magic.toString('hex') === 'd0cf11e0a1b11ae1') {
    const dir = path.join(R, 'raw', '.text');
    const c = path.join(dir, fileSha(file) + '.sheet.txt');
    if (fs.existsSync(c)) t = fs.readFileSync(c, 'utf8');
    else {
      t = spawnSync('python3', ['-I', path.join(__dirname, 'sheet-text.py'), file], { encoding: 'utf8', maxBuffer: 1 << 28 }).stdout || '';
      if (t) { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(c, t); }
    }
  }
  else {
    // 文字コード：Shift_JIS・EUC-JP のページも読む
    const buf = fs.readFileSync(file);
    const head = buf.slice(0, 3000).toString('latin1');
    const cs = (head.match(/charset=["']?([\w-]+)/i) || [])[1] || 'utf-8';
    let dec = 'utf-8';
    if (/shift_?jis|sjis|windows-31j|cp932/i.test(cs)) dec = 'shift_jis'; else if (/euc-?jp/i.test(cs)) dec = 'euc-jp';
    // 正しいUTF-8として読めるならUTF-8を優先（文字コードを変換した写しは meta の宣言と中身が食い違うため）
    try { t = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (x) { t = new TextDecoder(dec).decode(buf); }
    t = t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");
  }
  textCache.set(file, t);
  return t;
}
const norm = (s) => String(s || '').normalize('NFKC').replace(/[\s　]+/g, '');

// ---------- 範囲表記（"158-173"）を展開 ----------
function expandKeys(obj) {
  const out = new Map();
  for (const [k, v] of Object.entries(obj || {})) {
    const m = k.match(/^(\d+)-(\d+)$/);
    if (m) for (let i = +m[1]; i <= +m[2]; i++) out.set(String(i), v); else out.set(k, v);
  }
  return out;
}

// ---------- 規約・アクセス間隔 ----------
const srcById = Object.fromEntries(sources.map((s) => [s.id, s]));
const tosHits = {};
// 取得元の hosts は、1つずつ規約を確かめた根拠（tos.host_basis）があること（あとからホストだけ足すのを防ぐ）
for (const S of Object.values(srcById)) if (S.tos && S.tos.host_basis) for (const h of S.hosts) if (h !== '*' && !(S.tos.host_basis[h] || '').trim()) err(S.id, `hosts の ${h} に、規約を確かめた根拠（tos.host_basis）がない`);
for (const e of ledger) {
  const s = srcById[e.src];
  if (!s) { err('記録', `${e._at} 台帳にない取得元 ${e.src}`); continue; }
  let host = '';
  // 取得しなかった記録（skipped）は、URL がなくてよい（取得できなかった・取らないと決めた理由が要る）
  if (e.status === 'skipped' && !e.url) { if (!e.reason) err('記録', `${e._at} 取得しなかった理由がない`); continue; }
  try { host = new URL(e.url).host; } catch (x) { err('記録', `${e._at} URL が不正`); }
  if (s.tos.verdict === 'per-site' && e.status !== 'skipped' && e.via !== 'owner' && (!e.tos || !e.tos.verdict || !e.tos.basis)) err(e.src, `${e._at} サイトごとの規約確認の記録（tos.verdict・tos.basis）がない（${e.url}）`);
  if (s.tos.verdict === 'per-site' && e.tos && e.tos.verdict === 'no-automation' && !e.tos.owner_approved) err(e.src, `${e._at} 規約で自動取得が禁止のサイトを取得した（${e.url}）`);
  if (host && !s.hosts.includes('*') && !s.hosts.includes(host)) err(e.src, `${e._at} ${host} は台帳の hosts にない（取得元の登録漏れ）`);
  const auto = e.via && e.via !== 'manual-view' && e.via !== 'owner';
  if (auto && s.tos.verdict === 'no-automation' && !(e.purpose === 'tos-check' && (s.tos.urls || []).includes(e.url))) (tosHits[e.src] = tosHits[e.src] || []).push(e);
  if (!e.t) err(e.src, `${e._at} 取得時刻がない`);
}
for (const [id, hs] of Object.entries(tosHits)) err(id, `規約で自動取得が禁止されている取得元を自動で取得した記録が ${hs.length} 件（${[...new Set(hs.map((h) => h.t.slice(0, 10)))].join('・')}。例 ${hs[0].url}）。${srcById[id].tos.remedy || '対処を決めて sources.json の tos.remedy に書くこと'}`);
for (const s of sources) {
  if (s.tos.verdict === 'unchecked' && ledger.some((e) => e.src === s.id)) err(s.id, '利用規約を確認してから取得すること（sources.json の tos を埋める）');
  const hostOf = (e) => { try { return new URL(e.url).host; } catch (x) { return ''; } };
  const hits = ledger.filter((e) => e.src === s.id && e.via !== 'backfill' && e.via !== 'relocate' && e.via !== 'owner' && e.t && e.status !== 'skipped' && e.status !== 'headings-only').sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
  let fast = 0;
  const lastAt = {};
  // 起きてしまった違反で、原因と直し方を sources.json の tos.incidents に書いたものは数えない（記録は消さない）
  const known = new Set(((s.tos || {}).incidents || []).map((x) => x.t));
  for (const h of hits) { const k = hostOf(h); if (lastAt[k] != null && (Date.parse(h.t) - lastAt[k]) / 1000 < (s.tos.min_interval_s || 3) - 0.5 && !known.has(h.t)) fast++; lastAt[k] = Date.parse(h.t); }
  if (fast) err(s.id, `アクセス間隔が ${s.tos.min_interval_s || 3} 秒未満の取得が ${fast} 回ある`);
}

// ---------- 集合ごとの照合 ----------
const rows = [];
const okFetch = (e) => e.status === 200 || e.status === '200';
const generic = new Map(); // coll → anchor → 出現ノート数（ありふれた語は固有の証拠にしない）
for (const n of notes) { const k = `${n.src}:${n.coll}`; if (!generic.has(k)) generic.set(k, new Map()); for (const a of n.anchors || []) generic.get(k).set(norm(a), (generic.get(k).get(norm(a)) || 0) + 1); }

for (const s of sources) {
  if (onlySrc && s.id !== onlySrc) continue;
  for (const c of s.collections) {
    const tag = `${s.id}:${c.id}`;
    // 一覧ページは doc: "_index" でも coll: "<集合>_index" でもよい
    const L = ledger.filter((e) => e.src === s.id && (e.coll === c.id || e.coll === `${c.id}_index`)).map((e) => (e.coll === `${c.id}_index` && c.index ? { ...e, doc: c.index.doc } : e));
    const excluded = expandKeys(c.excluded);
    // 一覧ページから「載っているもの全部」を拾い、対象か対象外（理由つき）のどちらかに入っているかを見る
    let universe = null, indexText = '';
    if (c.index) {
      const ies = L.filter((e) => e.doc === c.index.doc && okFetch(e));
      if (!ies.length) err(tag, '一覧ページの取得記録がない（何件あるかを確かめていない）');
      else {
        const fs_ = ies.map(rawFile);
        indexText = fs_.map((f) => textOf(f) || '').join('\n');
        if (fs_.some((f) => !f)) warn(tag, '一覧ページの原文が手元にないので、取りこぼしの照合ができない');
        else if (c.index.pattern) universe = [...new Set(fs_.flatMap((f) => [...fs.readFileSync(f, 'utf8').matchAll(new RegExp(c.index.pattern, 'g'))].map((m) => m[1])))];
      }
    }
    let expected = c.expected;
    if (expected === 'index') expected = (universe || []).filter((d) => !excluded.has(d));
    if (expected === 'ledger') {
      // 取得記録にあるものが対象。ただし取得に失敗しただけ（404など、成功した記録が1つもない）のものは、読んでいない資料として注意に出す
      const docs = [...new Set(L.filter((e) => e.doc !== (c.index || {}).doc).map((e) => e.doc))];
      const failed = docs.filter((d) => !L.some((e) => e.doc === d && okFetch(e)) && L.some((e) => e.doc === d && Number(e.status) >= 300));
      for (const d of failed) warn(tag, `${d} は取得に失敗した（${L.filter((e) => e.doc === d).map((e) => e.status).join('・')}）。読んでいないので根拠にしない`);
      expected = docs.filter((d) => !failed.includes(d));
    }
    expected = expected.map(String);
    if (universe) for (const d of universe) if (!expected.includes(d) && !excluded.has(d)) err(tag, `一覧に載っている ${d} が、対象にも対象外（理由つき）にも入っていない`);
    for (const [d, why] of excluded) if (!why || why.length < 4) err(tag, `対象外 ${d} の理由が書かれていない`);

    const r = { tag, desc: c.desc, listed: universe ? universe.length : '—', target: expected.length, excl: excluded.size, fetched: 0, bad: 0, noted: 0, verified: 0, partial: 0, unverifiable: 0, missing: [], unread: [] };
    for (const d of expected) {
      const es = L.filter((e) => e.doc === d);
      const parts = c.parts && c.parts.length ? c.parts : [null];
      const got = parts.every((p) => es.some((e) => okFetch(e) && (p == null || e.part === p || (p.endsWith('*') && String(e.part || '').startsWith(p.slice(0, -1))) || (!e.part && parts.length === 1))));
      if (!got) {
        const sk = es.find((e) => e.status === 'skipped');
        // 対象を取得記録で決める集合（expected: ledger）は、理由つきで「取らない」と記録したものは注意にとどめる（取れなかった論文を正直に残せるように）
        if (sk && c.expected === 'ledger' && sk.reason && sk.reason.length >= 8) warn(tag, `${d} は取得できず、理由つきで飛ばした（${sk.reason}）。根拠には使っていないこと`);
        else if (sk) err(tag, `${d} を取得せずに飛ばしている（${sk.reason || '理由なし'}）。対象外にするなら sources.json の excluded に理由を書く`);
        else r.missing.push(d);
        continue;
      }
      r.fetched++;
      for (const e of es.filter(okFetch)) {
        const fj = rawFile(e); let isJson = false; try { if (fj) { JSON.parse(fs.readFileSync(fj, 'utf8')); isJson = true; } } catch (x) {}
        // robots.txt は、規約の確かめのためだけに取るもので、短くて当たり前（読了ノートも要らない）。小ささの検査から外す
        const robots = /\/robots\.txt(\?|$)/.test(e.url || '');
        // 小さすぎる取得物でも、その後に理由つきの「取らない」記録（skipped）があれば、取れなかったことを正直に残したものとして注意にとどめる（根拠には使わない）
        const laterSkip = es.find((x) => x.status === 'skipped' && x.reason && x.reason.length >= 8 && Date.parse(x.t) >= Date.parse(e.t));
        if (!isJson && !robots && (!e.bytes || e.bytes < 200)) { if (laterSkip) warn(tag, `${d} の取得物が小さすぎる（${e.bytes} バイト）が、取れない記録がある（${laterSkip.reason}）。根拠には使っていないこと`); else { r.bad++; err(tag, `${d} の取得物が小さすぎる（${e.bytes} バイト）`); } }
        const f = rawFile(e);
        if (f && /\.html?$/i.test(f) && /type=["']?password/i.test(fs.readFileSync(f, 'utf8')) && (textOf(f) || '').length < 3000) { r.bad++; err(tag, `${d} はログイン画面を取得しているように見える`); }
      }
      if (!c.need_notes) continue;
      // 厚い資料は章ごとのノート（doc: 30002#ch01 のように # で区切る）に分けてよい
      const ns = notes.filter((x) => x.src === s.id && x.coll === c.id && (x.doc === d || x.doc.startsWith(d + '#')));
      if (!ns.length) {
        // 中身がまったく同じファイル（sha256 一致）を別の名前で読了済みなら、読了として数える
        const hs = new Set(es.map((e) => e.sha256).filter(Boolean));
        const twin = hs.size && notes.find((x) => x.src === s.id && x.coll === c.id && hs.has(x.sha256));
        if (twin) { r.noted++; r.dup = (r.dup || 0) + 1; continue; }
        // 取得はできたが中身のない殻だった、などで「読まない」と理由つきで記録したものは、読んでいないことを正直に残した扱い（注意）
        const later = es.filter((e) => e.status === 'skipped' && e.reason && e.reason.length >= 8);
        if (later.length) { warn(tag, `${d} は取得したが読まない（${later[later.length - 1].reason}）。根拠にしない`); continue; }
        r.unread.push(d); continue;
      }
      r.noted++;
      const before = r.verified;
      for (const n of ns) checkNote(n, es.filter(okFetch), tag, indexText, generic.get(tag) || new Map(), { ...r, verified: 0, partial: 0, unverifiable: 0, _sub: true }, ns.length > 1);
      checkImagePages(ns, es.filter(okFetch), tag);
      const ok = coverage(ns, es.filter(okFetch), tag);
      if (ok === null) r.unverifiable++; else if (ok && !errors.some((e) => ns.some((n) => e.includes(n._path)))) r.verified = before + 1;
      if (ns.some((n) => n.read === 'partial')) { r.partial++; warn(tag, `${d} は一部だけ読了（${ns.filter((n) => n.read === 'partial').map((n) => n.pages || n.doc).join('・')}）`); }
    }
    if (r.unread.length) err(tag, `取得したが読了ノートがない（読んでいない）${r.unread.length} 件：${r.unread.slice(0, 12).join(' ')}${r.unread.length > 12 ? ' …' : ''}`);
    if (r.missing.length) err(tag, `未取得 ${r.missing.length} 件：${r.missing.slice(0, 12).join(' ')}${r.missing.length > 12 ? ' …' : ''}`);
    rows.push(r);
  }
}

function checkNote(n, es, tag, indexText, gen, r, isSection) {
  const where = n._path;
  const hashes = es.map((e) => e.sha256).filter(Boolean);
  if (!n.sha256) err(tag, `${where} に sha256 がない`);
  else if (!hashes.includes(n.sha256)) err(tag, `${where} の sha256 が取得記録のどれとも一致しない（別のファイルを読んだか、取得が記録されていない）`);
  const body = norm(n.body);
  if (body.length < 150) err(tag, `${where} の本文が短すぎる（${body.length} 字）。何を読み取ったかが書かれていない`);
  const anchors = (n.anchors || []).map(norm).filter(Boolean);
  if (anchors.length < 5) err(tag, `${where} の anchors が ${anchors.length} 個（5個以上）`);
  if (n.read !== 'full' && n.read !== 'partial') err(tag, `${where} の read が full / partial のどちらでもない`);
  // 原文と照合
  const files = es.map(rawFile).filter(Boolean);
  const target = files.find((f) => fileSha(f) === n.sha256) || files[0];
  const text = target ? norm(textOf(target)) : null;
  if (!text) { r.unverifiable++; return; }
  // 文字がほとんどない PDF（画像だけの講演スライドなど）は、語句で照合できない。照合できないもの（注意）として数え、画像として見たページの申告（image_pages）を求める
  if (/\.pdf$/i.test(target)) { const pages = +((spawnSync('pdfinfo', [target], { encoding: 'utf8' }).stdout || '').match(/Pages:\s+(\d+)/) || [0, 0])[1]; if (pages && text.replace(/[•・\-]/g, '').length < pages * 3) { if (!n.image_pages) err(tag, `${where} は文字のない PDF（${pages}ページ）。画像として見たページを image_pages: に書くこと`); else warn(tag, `${where} は文字のない PDF（${pages}ページ）。語句では照合できない（画像として見たと申告：${n.image_pages}）`); r.unverifiable++; return; } }
  const texts = textsOf(target);
  const absent = anchors.filter((a) => posIn(texts, a) < 0);
  if (absent.length) err(tag, `${where} の anchors が原文に出てこない：${absent.slice(0, 4).join(' / ')}（本文を読まずに書いた疑い）`);
  const idx = norm(indexText);
  const unique = anchors.filter((a) => posIn(texts, a) >= 0 && a.length >= 6 && !idx.includes(a) && (gen.get(a) || 0) <= 2);
  // 全部読んだと書くなら、証拠の語句が文書の前・中・後ろの3つの区間すべてから出ていること（冒頭だけの拾い読みを見つける）
  if (!isSection && n.read === 'full' && text.length > 3000 && text.length <= 45000) {
    const zones = new Set(anchors.map((x) => posIn(texts, x)).filter((q) => q >= 0).map((q) => Math.min(2, Math.floor(q * 3))));
    if (zones.size < 3) err(tag, `${where} は read: full だが、anchors が文書の${['前', '中', '後ろ'].filter((_, z) => !zones.has(z)).join('・')}の区間から出ていない（全部読んだ証拠にならない）`);
  }
  if (unique.length < 3) err(tag, `${where} の anchors のうち、一覧やタイトルに出ない・その文書に固有の語が ${unique.length} 個（3個以上）。タイトルだけで書いた疑い`);
  // 転載の検出：ノート本文と原文で30字以上そのまま一致する箇所
  const K = 30;
  const grams = new Set();
  for (let i = 0; i + K <= text.length; i++) grams.add(text.slice(i, i + K));
  let copied = null;
  for (let i = 0; i + K <= body.length; i++) if (grams.has(body.slice(i, i + K))) { copied = body.slice(i, i + K); break; }
  if (copied) err(tag, `${where} に原文と30字以上一致する箇所がある（転載）：「${copied}…」`);
  if (!absent.length && unique.length >= 3 && !copied) r.verified++;
}

// 文書全体の読了範囲：本文を約15,000字ごとの区間（3〜40区間）に分け、すべての区間からノートの anchors が出ていること。
// 厚い資料（教科書など）を冒頭や目次だけで済ませていないかを見る。原文が手元になければ null
function coverage(ns, es, tag) {
  const files = es.map(rawFile).filter(Boolean);
  const f = files.find((x) => ns.some((n) => fileSha(x) === n.sha256)) || files[0];
  if (!f) return null;
  const text = norm(textOf(f));
  if (text.length <= 45000 && ns.length === 1) return true; // 短い文書は checkNote の前・中・後ろで見ている
  const Z = Math.max(3, Math.min(40, Math.ceil(text.length / 15000)));
  const hit = new Set();
  const texts = textsOf(f);
  for (const n of ns) for (const a of (n.anchors || []).map(norm)) for (const t of texts) { let i = t.indexOf(a); if (i < 0) continue; while (i >= 0) { hit.add(Math.min(Z - 1, Math.floor((i / t.length) * Z))); i = t.indexOf(a, i + 1); if (hit.size >= Z) break; } break; }
  const full = ns.every((n) => n.read === 'full');
  const miss = [...Array(Z).keys()].filter((z) => !hit.has(z));
  if (full && miss.length) { err(tag, `${ns[0].doc.split('#')[0]} は全部読んだことになっているが、本文を${Z}区間に分けたうち ${miss.length} 区間（${miss.slice(0, 8).map((z) => `${Math.round((z / Z) * 100)}%付近`).join('・')}${miss.length > 8 ? '…' : ''}）から anchors が出ていない`); return false; }
  return true;
}

// 文字のないページ（画像だけのページ）。PDFで全部読んだと言うなら、どれかのノートの image_pages: にそのページが入っていること（画像として見た申告）
function imageOnlyPages(file) {
  const imgCache = imageOnlyPages.cache || (imageOnlyPages.cache = new Map());
  if (imgCache.has(file)) return imgCache.get(file);
  const t = pdfText(file);
  const pages = t.split('\f').map((x) => norm(x).length);
  const out = pages.map((n, i) => (n < 30 ? i + 1 : 0)).filter(Boolean).filter((p) => p <= pages.length - (pages[pages.length - 1] === 0 ? 1 : 0));
  imgCache.set(file, out);
  return out;
}
function pageSet(v) { const s = new Set(); for (const part of String(v || '').split(/[,、・\s]+/)) { const m = part.match(/^(\d+)(?:[-〜~](\d+))?$/); if (m) for (let i = +m[1]; i <= +(m[2] || m[1]); i++) s.add(i); } return s; }
function checkImagePages(ns, es, tag) {
  const f = es.map(rawFile).find((x) => x && /\.pdf$/i.test(x));
  if (!f || !ns.every((n) => n.read === 'full')) return;
  const img = imageOnlyPages(f);
  if (!img.length) return;
  const claimed = new Set(ns.flatMap((n) => [...pageSet(n.image_pages)]));
  const miss = img.filter((p) => !claimed.has(p));
  if (miss.length) err(tag, `${ns[0].doc.split('#')[0]} には文字のないページが ${img.length} ある。うち ${miss.length} ページ（${miss.slice(0, 15).join(',')}${miss.length > 15 ? '…' : ''}）を画像として見たという申告（ノートの image_pages:、白紙なら白紙と本文に書く）がない`);
}

// ---------- 出典の参照（docs の [[src:coll:doc]]） ----------
const cited = new Set();
let quoted = 0;
for (const f of lsr(DOCS).filter((p) => p.endsWith('.md'))) {
  const s = fs.readFileSync(f, 'utf8');
  // [[src:coll:doc|「語句」]]：主張ごとの出典。語句（4〜20字）が、その資料の原文にそのまま出ることを確かめる（資料にないことを資料の名で書くのを防ぐ。QUALITY 6章）
  for (const m of s.matchAll(/\[\[([\w-]+):([\w-]+):([^\]\s|]+)(?:\|「([^」]{1,40})」)?\]\]/g)) {
    if (/[<>…]|\.\.\./.test(m[3])) continue; // 記法の説明に書いた見本（<ID>、…）は出典として数えない
    if (m[1] === 'src' && m[3] === 'doc') continue; // 記法の見本（src:coll:doc）
    const k = `${m[1]}:${m[2]}:${m[3]}`;
    cited.add(k);
    if (!notes.some((n) => `${n.src}:${n.coll}:${n.doc}` === k)) err('出典', `${path.relative(DOCS, f)} が ${k} を引いているが、その読了ノートがない`);
    if (m[4] !== undefined) {
      quoted++;
      const q = norm(m[4]);
      if (q.length < 4 || q.length > 20) { err('出典の語句', `${path.relative(DOCS, f)} の ${k} の語句「${m[4]}」は4〜20字にする`); continue; }
      // 頁つき（doc#p2）や別名のノート（doc#rp）は、# の前の文書の原文で照合する
      const pick = (d) => ledger.filter((e) => e.src === m[1] && e.coll === m[2] && String(e.doc) === d && e.status === 200).map(rawFile).filter(Boolean);
      let files = pick(m[3]);
      if (!files.length && m[3].includes('#')) files = pick(m[3].split('#')[0]);
      if (!files.length) { warn('出典の語句', `${path.relative(DOCS, f)} の ${k}：原文が手元にないので語句を照合できない`); continue; }
      if (!files.some((x) => textsOf(x).some((t) => t.includes(q)))) err('出典の語句', `${path.relative(DOCS, f)} の ${k}：語句「${m[4]}」が原文に出てこない（資料にないことを資料の名で書いていないか）`);
    }
  }
}
// 外部資料にもとづいて書いた文書は、取得元ごとに少なくとも1本の読了ノートを出典として引くこと（引いていなければ未検査の分析）
const derivedRows = [];
for (const d of JSON.parse(fs.readFileSync(path.join(R, 'sources.json'), 'utf8')).derived_docs || []) {
  const f = path.join(__dirname, '..', d.path);
  if (!fs.existsSync(f)) { warn('分析文書', `${d.path} はまだない（作業中）`); derivedRows.push(`| ${d.path} | （未作成） | ${d.note} |`); continue; }
  const txt = fs.readFileSync(f, 'utf8');
  const per = d.sources.map((sid) => [sid, new Set([...txt.matchAll(new RegExp(`\\[\\[${sid}:([\\w-]+):([^\\]\\s]+)\\]\\]`, 'g'))].map((m) => m[0])).size]);
  for (const [sid, n] of per) if (!n) err('分析文書', `${d.path} は ${sid} の資料にもとづくが、読了ノートを1本も出典に引いていない（未検査の分析）。${d.note}`);
  derivedRows.push(`| ${d.path} | ${per.map(([sid, n]) => `${sid} ${n}本`).join('・')} | ${d.note} |`);
}
const uncited = notes.filter((n) => !cited.has(`${n.src}:${n.coll}:${n.doc}`)).length;
for (const n of notes) if (!srcById[n.src] || !srcById[n.src].collections.some((c) => c.id === n.coll)) err('ノート', `${n._path} の src/coll が台帳にない`);

// 検索の記録（research/searches/*.jsonl：{t, query, used:[採用したURL], note}）。検索結果の要約は根拠にしない（取得して読んだ資料だけが根拠）
const searchRows = [];
for (const f of lsr(path.join(R, 'searches')).filter((p) => p.endsWith('.jsonl'))) {
  const qs = fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (x) { err('検索', `${path.relative(R, f)} にJSONとして読めない行`); return null; } }).filter(Boolean);
  const used = new Set(qs.flatMap((q) => q.used || []));
  const fetched = used.size ? [...used].filter((u) => ledger.some((e) => e.url === u && okFetch(e))).length : 0;
  if (used.size && fetched < used.size) warn('検索', `${path.relative(R, f)}：採用したURL ${used.size} 件のうち ${used.size - fetched} 件に取得記録がない`);
  searchRows.push(`- ${path.relative(R, f)}：検索 ${qs.length} 回、採用したURL ${used.size} 件（うち取得済み ${fetched}）`);
}

// ---------- 出力 ----------
const tos = sources.map((s) => `- ${s.name}（${s.id}）：規約 ${({ ok: '確認済み・問題なし', gray: '確認済み・グレー（判断を記録）', 'owner-approved': '規約上は制限ありだがオーナーが条件付きで許可（判断を記録）', 'per-site': 'サイトごとに確認して取得記録に残す', 'no-automation': '確認済み・自動取得禁止', unchecked: '未確認' })[s.tos.verdict] || s.tos.verdict}${s.tos.checked ? `（${s.tos.checked}）` : ''}。${s.tos.note}`);
const table = ['| 集合 | 内容 | 一覧上 | 対象 | 対象外(理由あり) | 取得済 | 読了ノート | 原文で照合済 | 一部読了 | 照合不能 |', '|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.tag} | ${r.desc} | ${r.listed} | ${r.target} | ${r.excl} | ${r.fetched} | ${r.noted} | ${r.verified} | ${r.partial} | ${r.unverifiable} |`)];
const out = [`# 情報収集の証跡（自動集計）`, '', `\`node boki2/tools/research-check.js --write\` が生成。手で編集しない。`, '', `取得記録 ${ledger.length} 行・読了ノート ${notes.length} 本（うち docs から出典として引かれていない ${uncited} 本）`, '', '## 利用規約', ...tos, '', '## 集合ごとの状況', ...table, '', '## 検索の記録', ...(searchRows.length ? searchRows : ['- なし']), '', '## 外部資料にもとづく文書と出典の引用', '| 文書 | 引いている読了ノート | 説明 |', '|---|---|---|', ...derivedRows, '', `## 検査結果：エラー ${errors.length}・注意 ${warns.length}`, ...errors.map((e) => `- ✗ ${e}`), ...warns.map((w) => `- △ ${w}`), ''].join('\n');
console.log(out);
if (args.includes('--write')) fs.writeFileSync(path.join(R, 'STATUS.md'), out);

if (spotN) {
  const pool = notes.slice();
  console.log(`\n## 抜き打ち（${spotN} 本）`);
  for (let k = 0; k < spotN && pool.length; k++) {
    const n = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    const es = ledger.filter((e) => e.src === n.src && e.coll === n.coll && e.doc === n.doc && okFetch(e));
    const f = es.map(rawFile).find(Boolean);
    console.log(`\n### ${n.src}:${n.coll}:${n.doc}  (${n._path})`);
    if (!f) { console.log('  原文が手元にない'); continue; }
    const t = norm(textOf(f));
    for (const a of (n.anchors || []).map(norm)) { const i = t.indexOf(a); console.log(i < 0 ? `  ✗ ${a}` : `  ✓ …${t.slice(Math.max(0, i - 25), i)}【${a}】${t.slice(i + a.length, i + a.length + 25)}…`); }
  }
}
process.exit(errors.length ? 1 : 0);
