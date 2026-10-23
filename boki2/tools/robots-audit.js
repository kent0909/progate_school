#!/usr/bin/env node
// 過去の取得を robots.txt で照らし直す（2026-10-23）。research-fetch の robotsGate は 2026-10-22 夕に足したので、それより前の取得は
// パスごとの robots.txt を確かめていなかった。取得記録（ledger.jsonl と ledger-pending/*.jsonl）の、skipped 以外の全取得を照らす。
// 決め方は research-fetch.js の robotsGate と同じ：User-agent: * と boki2-quest-research の組の Allow/Disallow を集め、
// いちばん長く合う行で決める（同じ長さなら Allow が勝つ）。* は任意の文字列、末尾の $ は終わり。robots.txt 自体の取得は数えない。
//
// Usage:
//   node boki2/tools/robots-audit.js            照らした結果の要約を出す（外へは通信しない）
//   node boki2/tools/robots-audit.js --plan     robots.txt が手元にないホストと、取りに行くときの --src/--coll を出す
//   node boki2/tools/robots-audit.js --fetch    手元にないホストの robots.txt を research-fetch で取る（ホストごとに1回だけ。
//                                               doc 名は r9-robots-<host>。取った中身は research/raw/.robots/<host>.txt にも置く）
//   node boki2/tools/robots-audit.js --write    research/ROBOTS-AUDIT.md を書く
//
// robots.txt の「手元にある」の決め方（新しいものを使う）：
//   1. 取得記録の /robots.txt の取得で、状態が 200（原文が raw/ にある）か 4xx（429 を除く。＝制限なし）のもの
//   2. research/raw/.robots/<host>.txt（research-fetch の自動の確かめが残す。200 のときだけ本文が入り、それ以外は空）で中身があるもの
//   どちらもなく、取得記録が 0・5xx・429 だけ／.robots が空だけのホストは「不確か」として取り直す対象にする。
//   取り直しても取れない（404 など）は依頼どおり「制限なし」とみなすが、0・5xx・429 は表で「不確か」と分けて示す。
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const B = path.join(__dirname, '..');
const R = path.join(B, 'research');
const DOCS = path.join(B, 'docs');
const RD = path.join(R, 'raw', '.robots');
const a = process.argv.slice(2);
const UA = 'boki2-quest-research';

const readJsonl = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (x) { return null; } }).filter(Boolean);
const ledgerFiles = () => [path.join(R, 'ledger.jsonl'), ...(fs.existsSync(path.join(R, 'ledger-pending')) ? fs.readdirSync(path.join(R, 'ledger-pending')).filter((f) => f.endsWith('.jsonl')).sort().map((f) => path.join(R, 'ledger-pending', f)) : [])];
const loadLedger = () => ledgerFiles().flatMap((f) => readJsonl(f).map((e) => ({ ...e, _ledger: path.relative(R, f) })));
const urlOf = (e) => { try { return new URL(e.url); } catch (x) { return null; } };
const isRobots = (u) => u && u.pathname === '/robots.txt';
const rawPath = (e) => (e.file ? (path.isAbsolute(e.file) ? e.file : path.join(R, e.file)) : null);
const hostFile = (h) => path.join(RD, h.replace(/[^\w.-]/g, '_') + '.txt');
const definite = (s) => s === 200 || (typeof s === 'number' && s >= 400 && s < 500 && s !== 429);

// ---------- robotsGate と同じ決め方（research-fetch.js からそのまま写した。直すときは両方を直す） ----------
const parseRules = (text) => {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim());
  const rules = []; let agents = []; let inRules = false;
  for (const l of lines) {
    const m = l.match(/^([A-Za-z-]+)\s*:\s*(.*)$/); if (!m) continue;
    const k = m[1].toLowerCase(); const v = m[2].trim();
    if (k === 'user-agent') { if (inRules) { agents = []; inRules = false; } agents.push(v.toLowerCase()); continue; }
    if (k === 'allow' || k === 'disallow') { inRules = true; if (agents.some((g) => g === '*' || UA.startsWith(g)) && v) rules.push({ allow: k === 'allow', p: v }); }
  }
  return rules;
};
const re = (p) => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
const decide = (rules, target) => rules.filter((r) => re(r.p).test(target)).sort((x, y) => y.p.length - x.p.length || (x.allow ? -1 : 1))[0] || null;

// 参考（判定には使わない）：Claude を名指しした組（ClaudeBot・Claude-User・anthropic-ai など）が禁じるか
const AI = /^(claudebot|claude-user|claude-searchbot|claude-web|anthropic-ai)$/;
const parseNamed = (text) => {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim());
  const rules = []; let agents = []; let inRules = false;
  for (const l of lines) {
    const m = l.match(/^([A-Za-z-]+)\s*:\s*(.*)$/); if (!m) continue;
    const k = m[1].toLowerCase(); const v = m[2].trim();
    if (k === 'user-agent') { if (inRules) { agents = []; inRules = false; } agents.push(v.toLowerCase()); continue; }
    if (k === 'allow' || k === 'disallow') { inRules = true; if (agents.some((g) => AI.test(g)) && v) rules.push({ allow: k === 'allow', p: v, ag: agents.filter((g) => AI.test(g)).join(',') }); }
  }
  return rules;
};

// ---------- ホストごとの robots.txt ----------
const robotsFor = (host, L) => {
  const recs = L.filter((e) => { const u = urlOf(e); return isRobots(u) && u.host === host; }).sort((x, y) => Date.parse(y.t) - Date.parse(x.t));
  const cands = [];
  for (const e of recs) {
    if (e.status === 200) { const f = rawPath(e); if (f && fs.existsSync(f)) cands.push({ t: Date.parse(e.t), kind: 'ledger', status: 200, text: fs.readFileSync(f, 'utf8'), from: `${e.src}:${e.coll}:${e.doc}`, at: e.t }); }
    else if (definite(e.status)) cands.push({ t: Date.parse(e.t), kind: 'ledger', status: e.status, text: '', from: `${e.src}:${e.coll}:${e.doc}`, at: e.t });
  }
  const hf = hostFile(host);
  if (fs.existsSync(hf)) { const st = fs.statSync(hf); const txt = fs.readFileSync(hf, 'utf8'); if (txt.trim()) cands.push({ t: st.mtimeMs, kind: 'auto', status: 200, text: txt, from: 'raw/.robots（自動の確かめ）', at: new Date(st.mtimeMs).toISOString() }); }
  cands.sort((x, y) => y.t - x.t);
  if (cands.length) return { ok: true, ...cands[0] };
  const indef = recs.map((e) => e.status);
  const emptyAuto = fs.existsSync(hf);
  return { ok: false, status: indef.length ? indef[0] : emptyAuto ? 'empty-auto' : 'none', text: '', from: indef.length ? `${recs[0].src}:${recs[0].coll}:${recs[0].doc}` : emptyAuto ? 'raw/.robots（空）' : '', at: recs[0] ? recs[0].t : '' };
};

// ---------- 取りに行くときの --src/--coll ----------
const SRC = JSON.parse(fs.readFileSync(path.join(R, 'sources.json'), 'utf8')).sources;
const POL = fs.existsSync(path.join(R, 'site-policy.json')) ? JSON.parse(fs.readFileSync(path.join(R, 'site-policy.json'), 'utf8')) : {};
const pickSrc = (host, L) => {
  const cnt = {};
  for (const e of L) { if (e.status === 'skipped') continue; const u = urlOf(e); if (!u || u.host !== host) continue; const k = `${e.src}|${e.coll}`; cnt[k] = (cnt[k] || 0) + (e.via === 'research-fetch' ? 1000 : 1); }
  const why = [];
  for (const k of Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x])) {
    const [s, c] = k.split('|'); const S = SRC.find((x) => x.id === s);
    if (!S) { why.push(`${s}：台帳にない`); continue; }
    if (!S.collections.some((x) => x.id === c)) { why.push(`${s}/${c}：集合がない`); continue; }
    if (!S.hosts.includes('*') && !S.hosts.includes(host)) { why.push(`${s}：hosts にない`); continue; }
    if (S.tos.verdict === 'no-automation' || S.tos.verdict === 'unchecked') { why.push(`${s}：規約 ${S.tos.verdict}`); continue; }
    if (S.tos.verdict === 'per-site') {
      if (!POL[host]) { why.push(`${s}：site-policy.json に判定がない`); continue; }
      if (POL[host].verdict === 'no-automation') { why.push(`${s}：site-policy.json で自動取得が禁止（${POL[host].basis.slice(0, 60)}）`); continue; }
    }
    return { src: s, coll: c };
  }
  return { src: null, why: why.join('／') || '取得記録にない' };
};

// ---------- 照らす ----------
const audit = () => {
  const L = loadLedger();
  const fetches = L.filter((e) => e.status !== 'skipped').map((e) => ({ e, u: urlOf(e) })).filter((x) => x.u && !isRobots(x.u));
  const bad = L.filter((e) => e.status !== 'skipped' && !urlOf(e));
  const hosts = [...new Set(fetches.map((x) => x.u.host))].sort();
  const H = {};
  for (const h of hosts) {
    const rb = robotsFor(h, L);
    const rules = rb.ok ? parseRules(rb.text) : [];
    const named = rb.ok ? parseNamed(rb.text) : [];
    H[h] = { rb, rules, named, n: 0, hits: [], namedHits: [] };
  }
  for (const { e, u } of fetches) {
    const h = H[u.host]; h.n++;
    const target = u.pathname + u.search;
    const hit = decide(h.rules, target);
    if (hit && !hit.allow) h.hits.push({ e, target, p: hit.p });
    const nh = decide(h.named, target);
    if (nh && !nh.allow && !(hit && !hit.allow)) h.namedHits.push({ e, target, p: nh.p, ag: nh.ag });
  }
  return { L, fetches, bad, hosts, H };
};

// ---------- 報告の引用 ----------
const lsr = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((x) => (x.isDirectory() ? lsr(path.join(d, x.name)) : [path.join(d, x.name)]));
const citations = () => {
  const out = [];
  for (const f of lsr(DOCS).filter((p) => p.endsWith('.md'))) {
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/\[\[([\w-]+):([\w-]+):([^\]\s|]+)(?:\|「([^」]{1,40})」)?\]\]/g)) out.push({ file: path.relative(B, f), key: `${m[1]}:${m[2]}:${m[3].split('#')[0]}` });
  }
  return out;
};

const ago = () => new Date().toISOString();

if (a.includes('--plan') || a.includes('--fetch')) {
  const { L, hosts } = audit();
  const need = hosts.filter((h) => !robotsFor(h, L).ok);
  const plan = need.map((h) => ({ h, done: L.some((e) => e.doc === `r9-robots-${h}`), ...pickSrc(h, L) }));
  if (a.includes('--plan')) {
    console.log(`ホスト ${hosts.length}、robots.txt が手元にない ${need.length}（うち r9 で取得済み ${plan.filter((p) => p.done).length}）`);
    for (const p of plan) console.log(`${p.h}\t${p.done ? '取得済み' : p.src ? `--src ${p.src} --coll ${p.coll}` : `取れない：${p.why}`}`);
    process.exit(0);
  }
  for (const p of plan) {
    if (p.done || !p.src) continue;
    const doc = `r9-robots-${p.h}`;
    const r = spawnSync('node', [path.join(__dirname, 'research-fetch.js'), '--src', p.src, '--coll', p.coll, '--doc', doc, '--url', `https://${p.h}/robots.txt`], { encoding: 'utf8' });
    const e = loadLedger().filter((x) => x.doc === doc && x.src === p.src && x.coll === p.coll).pop();
    if (e && e.status !== 'skipped') {
      const f = rawPath(e);
      fs.mkdirSync(RD, { recursive: true });
      fs.writeFileSync(hostFile(p.h), e.status === 200 && f && fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
    }
    console.log(`${p.h}\t${e ? e.status : '記録なし'}\t${(r.stdout + r.stderr).trim().split('\n').slice(-1)[0]}`);
  }
  // robots.txt は確かめのためだけに取るので、読了ノートの代わりに「読まない」記録を足す（先例：r5-blr-robots-* と同じ文言。通信はしない）
  const L2 = loadLedger();
  for (const e of L2.filter((x) => /^r9-robots-/.test(x.doc) && x.status !== 'skipped')) {
    if (L2.some((x) => x.doc === e.doc && x.src === e.src && x.coll === e.coll && x.status === 'skipped')) continue;
    spawnSync('node', [path.join(__dirname, 'research-fetch.js'), '--src', e.src, '--coll', e.coll, '--doc', e.doc, '--skip', '利用規約・robots.txt の確認のためだけに取得した。分析の資料ではないので読了ノートは書かない'], { encoding: 'utf8' });
  }
  process.exit(0);
}

const { L, fetches, bad, hosts, H } = audit();
const cites = citations();
const rows = [];
for (const h of hosts) {
  const g = {};
  for (const x of H[h].hits) (g[x.p] = g[x.p] || []).push(x);
  for (const [p, xs] of Object.entries(g)) rows.push({ h, p, xs });
}
const totalHits = rows.reduce((s, r) => s + r.xs.length, 0);
const okN = hosts.filter((h) => H[h].rb.ok).length;
const got200 = hosts.filter((h) => H[h].rb.ok && H[h].rb.status === 200).length;
const notOk = hosts.filter((h) => !H[h].rb.ok);
const docKeys = (xs) => [...new Set(xs.map((x) => `${x.e.src}:${x.e.coll}:${x.e.doc}`))];
const citeOf = (keys) => { const by = {}; for (const c of cites) if (keys.includes(c.key)) by[c.file] = (by[c.file] || 0) + 1; return by; };
const allHitKeys = docKeys(rows.flatMap((r) => r.xs));
const allBy = citeOf(allHitKeys);
const viaCount = (xs) => { const c = {}; for (const x of xs) c[x.e.via || '（なし）'] = (c[x.e.via || '（なし）'] || 0) + 1; return Object.entries(c).map(([k, v]) => `${k} ${v}`).join('、'); };
const stCount = (xs) => { const c = {}; for (const x of xs) c[x.e.status] = (c[x.e.status] || 0) + 1; return Object.entries(c).map(([k, v]) => `${k}:${v}`).join(' '); };

if (!a.includes('--write')) {
  console.log(`取得 ${fetches.length}（robots.txt 自体を除く、skipped を除く）／ホスト ${hosts.length}／robots.txt が決まった ${okN}（うち本文あり ${got200}）／不確か・なし ${notOk.length}`);
  console.log(`禁じるパスに当たった取得 ${totalHits}`);
  for (const r of rows) console.log(`${r.h}\t${r.p}\t${r.xs.length}`);
  process.exit(0);
}

const esc = (s) => String(s).replace(/\|/g, '\\|');
const md = [];
md.push('# 過去の取得を robots.txt で照らした結果（ROBOTS-AUDIT）', '');
md.push(`生成：${ago()}（\`node boki2/tools/robots-audit.js --write\`。走らせ直せば作り直せる）`, '');
md.push('research-fetch はパスごとの robots.txt を 2026-10-22 夕まで確かめていなかった。それより前の取得も含め、取得記録（`ledger.jsonl` と `ledger-pending/*.jsonl`）の skipped 以外の全取得を、research-fetch の robotsGate と同じ決め方で照らした。');
md.push('', '- 決め方：`User-agent: *` と `boki2-quest-research`（前方一致）の組の Allow/Disallow を集め、パス（＋クエリ）にいちばん長く合う行で決める。同じ長さなら Allow。`*` は任意の文字列、末尾の `$` は終わり。`tools/robots-audit.js` の parseRules・decide は research-fetch.js の robotsGate からそのまま写した');
md.push('- robots.txt は「いま」のもの（2026-10-22〜23 に取ったもの）。取得した当時の robots.txt ではない');
md.push('- robots.txt が 404・403 などで取れないホストは、依頼どおり「制限なし」とみなした。0（つながらない）・5xx・429 は「不確か」と分けて下に並べた（これも制限なしとして数えている）');
md.push('- robots.txt 自体の取得は数えない。`via` が backfill・curl・crawl_bp.py・refetch・relocate の記録も「取得」として数えた（relocate は取得済みの原文を移した記録）');
md.push('- 判断（原文や報告をどうするか）は取りまとめ役とオーナーがする。この文書は事実だけを並べる。raw の削除・報告の書き換えはしていない', '');
md.push('## 数', '');
md.push(`| 項目 | 数 |`, `|---|---|`);
md.push(`| 取得（skipped と robots.txt 自体を除く） | ${fetches.length} |`);
md.push(`| URL の読めない記録 | ${bad.length} |`);
md.push(`| ホスト | ${hosts.length} |`);
md.push(`| robots.txt が決まったホスト | ${okN}（本文あり ${got200}、4xx で制限なし ${okN - got200}） |`);
md.push(`| robots.txt が不確か・取れないホスト（制限なしとして数えた） | ${notOk.length} |`);
md.push(`| 禁じるパスに当たった取得 | ${totalHits}（${rows.length} 組、ホスト ${new Set(rows.map((r) => r.h)).size}） |`);
md.push(`| 当たった取得の doc | ${allHitKeys.length} |`);
md.push(`| その doc を引く報告 | ${Object.keys(allBy).length} 本、引用 ${Object.values(allBy).reduce((s, v) => s + v, 0)} 個 |`, '');
md.push('## 禁じるパスに当たった取得', '');
md.push('| ホスト | 禁じるパス | 件数 | 取得方法・状態 | doc の一覧 | その doc を引いている報告（引用の数） |', '|---|---|---|---|---|---|');
for (const r of rows) {
  const keys = docKeys(r.xs); const by = citeOf(keys);
  md.push(`| ${r.h} | \`${esc(r.p)}\` | ${r.xs.length} | ${viaCount(r.xs)}／${stCount(r.xs)} | ${keys.map((k) => `\`${k}\``).join('<br>')} | ${Object.entries(by).sort((x, y) => y[1] - x[1]).map(([f, n]) => `${f}（${n}）`).join('<br>') || '（引用なし）'} |`);
}
md.push('', '### 報告ごとの引用（当たった doc すべてについて）', '');
md.push('| 報告 | 引用の数 | 引いている doc |', '|---|---|---|');
for (const [f, n] of Object.entries(allBy).sort((x, y) => y[1] - x[1])) {
  const ks = [...new Set(cites.filter((c) => c.file === f && allHitKeys.includes(c.key)).map((c) => c.key))];
  md.push(`| ${f} | ${n} | ${ks.map((k) => `\`${k}\``).join('、')} |`);
}
md.push('', '### 取得ごとの一覧', '');
md.push('| ホスト | 禁じるパス | 時刻 | doc | 状態 | via | 照らしたパス |', '|---|---|---|---|---|---|---|');
for (const r of rows) for (const x of r.xs) md.push(`| ${r.h} | \`${esc(r.p)}\` | ${x.e.t} | \`${x.e.src}:${x.e.coll}:${x.e.doc}${x.e.part ? '_' + x.e.part : ''}\` | ${x.e.status} | ${x.e.via || ''} | \`${esc(x.target.slice(0, 120))}\` |`);
md.push('', '## 参考：Claude を名指しした組でだけ禁じられる取得（判定には入れていない）', '');
md.push('robotsGate は `*` と `boki2-quest-research` の組しか見ない。取得は Claude が動かしているので、ClaudeBot・Claude-User・Claude-SearchBot・Claude-Web・anthropic-ai を名指しした組が禁じるパスも別に数えた（上の表と重なるものは除く）。判定に入れるかは取りまとめ役とオーナーが決める。', '');
const nrows = hosts.filter((h) => H[h].namedHits.length);
if (!nrows.length) md.push('（なし）');
else {
  md.push('| ホスト | 件数 | 禁じるパス（名指しの名前） | doc の一覧 | その doc を引いている報告（引用の数） |', '|---|---|---|---|---|');
  for (const h of nrows) { const xs = H[h].namedHits; const keys = docKeys(xs); const by = citeOf(keys); md.push(`| ${h} | ${xs.length} | ${[...new Set(xs.map((x) => '`' + esc(x.p) + '`（' + x.ag + '）'))].join(' ')} | ${keys.map((k) => `\`${k}\``).join('<br>')} | ${Object.entries(by).map(([f, n]) => `${f}（${n}）`).join('<br>') || '（引用なし）'} |`); }
}
md.push('', '## robots.txt が不確か・取れなかったホスト', '');
md.push('最後の状態が 0（つながらない）・5xx・429、または research-fetch の自動の確かめが空のファイルだけを残したホスト、取りに行けなかったホスト。依頼どおり「制限なし」として数えたが、本当に制限がないかは分からない。', '');
if (!notOk.length) md.push('（なし）');
else {
  md.push('| ホスト | 取得の数 | 最後の状態 | 記録 | 取りに行けない理由 |', '|---|---|---|---|---|');
  for (const h of notOk) { const p = pickSrc(h, L); md.push(`| ${h} | ${H[h].n} | ${H[h].rb.status} | ${H[h].rb.from} ${H[h].rb.at || ''} | ${p.src ? '' : esc(p.why)} |`); }
}
md.push('', '## 全ホストの一覧', '');
md.push('| ホスト | 取得の数 | robots.txt | どこから | 規則の数（*・boki2） | 禁じるパスに当たった数 |', '|---|---|---|---|---|---|');
for (const h of hosts) { const x = H[h]; md.push(`| ${h} | ${x.n} | ${x.rb.ok ? x.rb.status : '不確か:' + x.rb.status} | ${x.rb.from} ${x.rb.at ? x.rb.at.slice(0, 16) : ''} | ${x.rules.length} | ${x.hits.length} |`); }
md.push('');
fs.writeFileSync(path.join(R, 'ROBOTS-AUDIT.md'), md.join('\n'));
console.log(`research/ROBOTS-AUDIT.md を書いた（取得 ${fetches.length}、ホスト ${hosts.length}、当たり ${totalHits}）`);
