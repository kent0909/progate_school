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
for (const p of lsr(path.join(R, 'raw'))) { if (!p.includes(`${path.sep}.text${path.sep}`)) rawByHash.set(sha(fs.readFileSync(p)), p); }
function sha(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function rawFile(e) {
  if (e.sha256 && rawByHash.has(e.sha256)) return rawByHash.get(e.sha256);
  const fp = e.file ? path.resolve(R, e.file) : null;
  if (fp && fs.existsSync(fp) && (!e.sha256 || sha(fs.readFileSync(fp)) === e.sha256)) return fp;
  return null;
}
const textCache = new Map();
function textOf(file) {
  if (!file) return null;
  if (textCache.has(file)) return textCache.get(file);
  let t = '';
  if (/\.pdf$/i.test(file)) t = spawnSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8', maxBuffer: 1 << 28 }).stdout || '';
  else t = fs.readFileSync(file, 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");
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
for (const e of ledger) {
  const s = srcById[e.src];
  if (!s) { err('記録', `${e._at} 台帳にない取得元 ${e.src}`); continue; }
  let host = '';
  try { host = new URL(e.url).host; } catch (x) { err('記録', `${e._at} URL が不正`); }
  if (host && !s.hosts.includes(host)) err(e.src, `${e._at} ${host} は台帳の hosts にない（取得元の登録漏れ）`);
  const auto = e.via && e.via !== 'manual-view';
  if (auto && s.tos.verdict === 'no-automation' && !(e.purpose === 'tos-check' && (s.tos.urls || []).includes(e.url))) (tosHits[e.src] = tosHits[e.src] || []).push(e);
  if (!e.t) err(e.src, `${e._at} 取得時刻がない`);
}
for (const [id, hs] of Object.entries(tosHits)) err(id, `規約で自動取得が禁止されている取得元を自動で取得した記録が ${hs.length} 件（${[...new Set(hs.map((h) => h.t.slice(0, 10)))].join('・')}。例 ${hs[0].url}）。${srcById[id].tos.remedy || '対処を決めて sources.json の tos.remedy に書くこと'}`);
for (const s of sources) {
  if (s.tos.verdict === 'unchecked' && ledger.some((e) => e.src === s.id)) err(s.id, '利用規約を確認してから取得すること（sources.json の tos を埋める）');
  const hits = ledger.filter((e) => e.src === s.id && e.via !== 'backfill' && e.t && e.status !== 'skipped').sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
  let fast = 0;
  for (let i = 1; i < hits.length; i++) if ((Date.parse(hits[i].t) - Date.parse(hits[i - 1].t)) / 1000 < (s.tos.min_interval_s || 3) - 0.5) fast++;
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
    if (expected === 'ledger') expected = [...new Set(L.filter((e) => e.doc !== (c.index || {}).doc).map((e) => e.doc))];
    expected = expected.map(String);
    if (universe) for (const d of universe) if (!expected.includes(d) && !excluded.has(d)) err(tag, `一覧に載っている ${d} が、対象にも対象外（理由つき）にも入っていない`);
    for (const [d, why] of excluded) if (!why || why.length < 4) err(tag, `対象外 ${d} の理由が書かれていない`);

    const r = { tag, desc: c.desc, listed: universe ? universe.length : '—', target: expected.length, excl: excluded.size, fetched: 0, bad: 0, noted: 0, verified: 0, partial: 0, unverifiable: 0, missing: [], unread: [] };
    for (const d of expected) {
      const es = L.filter((e) => e.doc === d);
      const parts = c.parts && c.parts.length ? c.parts : [null];
      const got = parts.every((p) => es.some((e) => okFetch(e) && (p == null || e.part === p || (!e.part && parts.length === 1))));
      if (!got) {
        const sk = es.find((e) => e.status === 'skipped');
        if (sk) err(tag, `${d} を取得せずに飛ばしている（${sk.reason || '理由なし'}）。対象外にするなら sources.json の excluded に理由を書く`);
        else r.missing.push(d);
        continue;
      }
      r.fetched++;
      for (const e of es.filter(okFetch)) {
        if (!e.bytes || e.bytes < 200) { r.bad++; err(tag, `${d} の取得物が小さすぎる（${e.bytes} バイト）`); }
        const f = rawFile(e);
        if (f && /\.html?$/i.test(f) && /type=["']?password/i.test(fs.readFileSync(f, 'utf8')) && (textOf(f) || '').length < 3000) { r.bad++; err(tag, `${d} はログイン画面を取得しているように見える`); }
      }
      if (!c.need_notes) continue;
      const n = notes.find((x) => x.src === s.id && x.coll === c.id && x.doc === d);
      if (!n) { r.unread.push(d); continue; }
      r.noted++;
      checkNote(n, es.filter(okFetch), tag, indexText, generic.get(tag) || new Map(), r);
    }
    if (r.unread.length) err(tag, `取得したが読了ノートがない（読んでいない）${r.unread.length} 件：${r.unread.slice(0, 12).join(' ')}${r.unread.length > 12 ? ' …' : ''}`);
    if (r.missing.length) err(tag, `未取得 ${r.missing.length} 件：${r.missing.slice(0, 12).join(' ')}${r.missing.length > 12 ? ' …' : ''}`);
    rows.push(r);
  }
}

function checkNote(n, es, tag, indexText, gen, r) {
  const where = n._path;
  const hashes = es.map((e) => e.sha256).filter(Boolean);
  if (!n.sha256) err(tag, `${where} に sha256 がない`);
  else if (!hashes.includes(n.sha256)) err(tag, `${where} の sha256 が取得記録のどれとも一致しない（別のファイルを読んだか、取得が記録されていない）`);
  const body = norm(n.body);
  if (body.length < 150) err(tag, `${where} の本文が短すぎる（${body.length} 字）。何を読み取ったかが書かれていない`);
  const anchors = (n.anchors || []).map(norm).filter(Boolean);
  if (anchors.length < 5) err(tag, `${where} の anchors が ${anchors.length} 個（5個以上）`);
  if (n.read === 'partial') { r.partial++; warn(tag, `${where} は一部だけ読了（${n.pages || '範囲不明'}）`); }
  else if (n.read !== 'full') err(tag, `${where} の read が full / partial のどちらでもない`);
  // 原文と照合
  const files = es.map(rawFile).filter(Boolean);
  const target = files.find((f) => sha(fs.readFileSync(f)) === n.sha256) || files[0];
  const text = target ? norm(textOf(target)) : null;
  if (!text) { r.unverifiable++; return; }
  const absent = anchors.filter((a) => !text.includes(a));
  if (absent.length) err(tag, `${where} の anchors が原文に出てこない：${absent.slice(0, 4).join(' / ')}（本文を読まずに書いた疑い）`);
  const idx = norm(indexText);
  const unique = anchors.filter((a) => text.includes(a) && a.length >= 6 && !idx.includes(a) && (gen.get(a) || 0) <= 2);
  // 全部読んだと書くなら、証拠の語句が文書の前・中・後ろの3つの区間すべてから出ていること（冒頭だけの拾い読みを見つける）
  if (n.read === 'full' && text.length > 3000) {
    const zones = new Set(anchors.map((x) => text.indexOf(x)).filter((i) => i >= 0).map((i) => Math.min(2, Math.floor((i / text.length) * 3))));
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

// ---------- 出典の参照（docs の [[src:coll:doc]]） ----------
const cited = new Set();
for (const f of lsr(DOCS).filter((p) => p.endsWith('.md'))) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/\[\[([\w-]+):([\w-]+):([\w.-]+)\]\]/g)) {
    const k = `${m[1]}:${m[2]}:${m[3]}`;
    cited.add(k);
    if (!notes.some((n) => `${n.src}:${n.coll}:${n.doc}` === k)) err('出典', `${path.relative(DOCS, f)} が ${k} を引いているが、その読了ノートがない`);
  }
}
const uncited = notes.filter((n) => !cited.has(`${n.src}:${n.coll}:${n.doc}`)).length;
for (const n of notes) if (!srcById[n.src] || !srcById[n.src].collections.some((c) => c.id === n.coll)) err('ノート', `${n._path} の src/coll が台帳にない`);

// ---------- 出力 ----------
const tos = sources.map((s) => `- ${s.name}（${s.id}）：規約 ${({ ok: '確認済み・問題なし', gray: '確認済み・グレー（判断を記録）', 'no-automation': '確認済み・自動取得禁止', unchecked: '未確認' })[s.tos.verdict] || s.tos.verdict}${s.tos.checked ? `（${s.tos.checked}）` : ''}。${s.tos.note}`);
const table = ['| 集合 | 内容 | 一覧上 | 対象 | 対象外(理由あり) | 取得済 | 読了ノート | 原文で照合済 | 一部読了 | 照合不能 |', '|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.tag} | ${r.desc} | ${r.listed} | ${r.target} | ${r.excl} | ${r.fetched} | ${r.noted} | ${r.verified} | ${r.partial} | ${r.unverifiable} |`)];
const out = [`# 情報収集の証跡（自動集計）`, '', `\`node boki2/tools/research-check.js --write\` が生成。手で編集しない。`, '', `取得記録 ${ledger.length} 行・読了ノート ${notes.length} 本（うち docs から出典として引かれていない ${uncited} 本）`, '', '## 利用規約', ...tos, '', '## 集合ごとの状況', ...table, '', `## 検査結果：エラー ${errors.length}・注意 ${warns.length}`, ...errors.map((e) => `- ✗ ${e}`), ...warns.map((w) => `- △ ${w}`), ''].join('\n');
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
