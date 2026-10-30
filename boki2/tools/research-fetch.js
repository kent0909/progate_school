#!/usr/bin/env node
// 情報収集の取得はこれを通す。台帳（research/sources.json）に登録された取得元だけを、規約の判定とアクセス間隔を守って取得し、
// 原文を research/raw/ に保存して（git に入れない）、取得記録を research/ledger.jsonl に1行追記する。
// Usage: node boki2/tools/research-fetch.js --src kentei --coll kouhyou2 --doc 139 [--part pdf] --url <URL> [--force]
//        node boki2/tools/research-fetch.js --src … --coll … --doc … --skip "理由"   （取得しないことを記録する）
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const R = path.join(__dirname, '..', 'research');
const a = process.argv.slice(2);
const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
const [src, coll, doc, part, url, skip] = ['--src', '--coll', '--doc', '--part', '--url', '--skip'].map(opt);
const die = (m) => { console.error(m); process.exit(1); };
if (!src || !coll || !doc) die('--src --coll --doc は必須');

const S = JSON.parse(fs.readFileSync(path.join(R, 'sources.json'), 'utf8')).sources.find((s) => s.id === src);
if (!S) die(`台帳に取得元 ${src} がない。先に research/sources.json に登録し、利用規約を確認すること`);
if (!S.collections.some((c) => c.id === coll)) die(`取得元 ${src} に集合 ${coll} がない。sources.json に登録すること`);
const L = path.join(R, 'ledger.jsonl');
const append = (o) => fs.appendFileSync(L, JSON.stringify({ t: new Date().toISOString(), src, coll, doc: String(doc), ...(part ? { part } : {}), ...o }) + '\n');

if (skip) { append({ url: url || '', status: 'skipped', reason: skip, via: 'research-fetch' }); console.log('取得しないことを記録した'); process.exit(0); }
if (!url) die('--url が必要');
// 自動取得が禁止のページで作業を止めない：「取らない」記録と、オーナーに頼むページの一覧（research/WANTED.md）への追記だけして、
// 終了コード3で返す。調べる側は代わりの資料（二次資料・別の公式窓口）で続け、オーナーへの依頼は区切りでまとめて出す（毎回は止めない）
const wanted = (why) => {
  append({ url: url || '', status: 'skipped', reason: why, via: 'research-fetch' });
  const W = path.join(R, 'WANTED.md');
  const cur = fs.existsSync(W) ? fs.readFileSync(W, 'utf8') : '# オーナーに開いて保存してほしいページ\n\n自動取得が規約で禁止されているページ。research-fetch が自動で追記する。保存のしかたと取り込み方は research/README.md の「オーナーが開いた資料」。\n\n| 追加日 | 取得元/集合/文書 | URL | 理由 | 状態 |\n|---|---|---|---|---|\n';
  if (url && !cur.includes(url)) fs.writeFileSync(W, cur + `| ${new Date().toISOString().slice(0, 10)} | ${src}/${coll}/${doc} | ${url} | ${why.replace(/\|/g, '／')} | 未 |\n`);
  console.log(`取得しない（${why}）。WANTED.md に追加した。止まらずに代わりの資料で続けること`);
  process.exit(3);
};
if (S.tos.verdict === 'no-automation') wanted(`${S.name} は利用規約で自動取得が禁止（${S.tos.note}）`);
// サイトを横断する取得元（tos.verdict が per-site）は、取得ごとにそのサイトの規約確認の結果を付ける。
// 一度確認したホストの結果は research/site-policy.json に残り、次からは誰も確認し直さなくてよい（付けた場合はその結果で上書き）
let [tosV, tosB, tosC] = ['--tos-verdict', '--tos-basis', '--tos-checked'].map(opt);
if (S.tos.verdict === 'per-site') {
  const PP = path.join(R, 'site-policy.json');
  const P = fs.existsSync(PP) ? JSON.parse(fs.readFileSync(PP, 'utf8')) : {};
  const h = url ? new URL(url).host : '';
  if (tosV && tosB) { P[h] = { verdict: tosV, basis: tosB, checked: tosC || new Date().toISOString().slice(0, 10) }; fs.writeFileSync(PP, JSON.stringify(P, null, 1) + '\n'); }
  else if (P[h]) ({ verdict: tosV, basis: tosB, checked: tosC } = P[h]);
  if (!tosV || !tosB) die('このサイトの利用規約・robots.txt を一度だけ確認し、--tos-verdict ok|gray|no-automation と --tos-basis "根拠（規約のURLと条項、robotsの結果）" を付けること（結果は site-policy.json に残る）。\n判定の目安：規約に自動取得・スクレイピング・bot の明示的な禁止がある→no-automation。規約に明示がない／規約ページが開けないが robots.txt が許している→gray として取得してよい');
  if (tosV === 'no-automation') wanted(`規約で自動取得が禁止のサイト（${tosB}）`);
}
if (S.tos.verdict === 'unchecked') die(`${S.name} の利用規約がまだ確認されていない。sources.json の tos を埋めてから取得すること`);
const host = new URL(url).host;
if (!S.hosts.includes('*') && !S.hosts.includes(host)) die(`${host} は ${src} の hosts にない`);

// アクセス間隔：同じホストへの直前の取得から min_interval_s 秒あける。
// 取得記録は ledger.jsonl と ledger-pending/ の両方を見る。何人もが同時に取りに行くので、ホストごとの鍵（mkdir）で順番に並べる
const lockDir = path.join(R, '.locks', host.replace(/[^\w.-]/g, '_'));
fs.mkdirSync(path.dirname(lockDir), { recursive: true });
for (let i = 0; ; i++) { try { fs.mkdirSync(lockDir); break; } catch (x) { if (i > 600) { try { if (Date.now() - fs.statSync(lockDir).mtimeMs > 180000) fs.rmSync(lockDir, { recursive: true }); } catch (y) {} } spawnSync('sleep', ['0.5']); } }
process.on('exit', () => { try { fs.rmSync(lockDir, { recursive: true }); } catch (x) {} });
const allLedgers = [L, ...(fs.existsSync(path.join(R, 'ledger-pending')) ? fs.readdirSync(path.join(R, 'ledger-pending')).filter((f) => f.endsWith('.jsonl')).map((f) => path.join(R, 'ledger-pending', f)) : [])];
const prev = allLedgers.filter((f) => fs.existsSync(f)).flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch (x) { return {}; } })).filter((e) => { try { return new URL(e.url).host === host && e.status !== 'skipped'; } catch (x) { return false; } });
let last = prev.reduce((m, e) => Math.max(m, Date.parse(e.t) || 0), 0);
// robots.txt：取得のたびに、そのパスが禁じられていないかを道具が確かめる（IRDB の /search を人が読み落として1回取った）。
// ホストごとの robots.txt は research/raw/.robots/ に1日だけ残して使い回す。User-agent: * の組の Allow/Disallow を、いちばん長く合う行で決める
const robotsGate = () => {
  const u = new URL(url);
  if (u.pathname === '/robots.txt') return;
  const RD = path.join(R, 'raw', '.robots'); fs.mkdirSync(RD, { recursive: true });
  const rf = path.join(RD, host.replace(/[^\w.-]/g, '_') + '.txt');
  if (!fs.existsSync(rf) || Date.now() - fs.statSync(rf).mtimeMs > 864e5) {
    const w = (S.tos.min_interval_s || 3) * 1000 - (Date.now() - last) + 300; if (w > 0) spawnSync('sleep', [String(Math.ceil(w / 1000))]);
    const rr = spawnSync('curl', ['-sS', '-L', '-m', '30', '-A', 'boki2-quest-research (personal study design)', '-w', '\n%{http_code}', `${u.protocol}//${host}/robots.txt`], { encoding: 'utf8' });
    last = Date.now();
    const out = rr.stdout || ''; const code = Number(out.slice(out.lastIndexOf('\n') + 1)) || 0;
    fs.writeFileSync(rf, code === 200 ? out.slice(0, out.lastIndexOf('\n')) : '');
  }
  // 取りに行くのは Claude が動かす道具なので、Anthropic の名を挙げて禁じる組も自分への禁止として守る（2026-10-23。ROBOTS-AUDIT.md で53件見つかった）。空の User-agent の組は合わせない
  const AI_UA = ['claudebot', 'claude-user', 'claude-searchbot', 'claude-web', 'anthropic-ai', 'anthropic'];
  const lines = fs.readFileSync(rf, 'utf8').split(/\r?\n/).map((l) => l.replace(/#.*/, '').trim());
  const star = []; const named = []; let agents = []; let inRules = false;
  // 名指しの組（自分の名・Anthropic の名）があればその組だけで決める（RFC 9309 のいちばん合う組）。なければ * の組で決める
  const isNamed = (g) => g && g !== '*' && ('boki2-quest-research'.startsWith(g) || AI_UA.some((n) => n === g || g.startsWith(n)));
  for (const l of lines) {
    const m = l.match(/^([A-Za-z-]+)\s*:\s*(.*)$/); if (!m) continue;
    const k = m[1].toLowerCase(); const v = m[2].trim();
    if (k === 'user-agent') { if (inRules) { agents = []; inRules = false; } agents.push(v.toLowerCase()); continue; }
    if (k === 'allow' || k === 'disallow') { inRules = true; if (!v) continue; const r = { allow: k === 'allow', p: v }; if (agents.some(isNamed)) named.push(r); else if (agents.includes('*')) star.push(r); }
  }
  const target = u.pathname + u.search;
  const re = (p) => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
  const rules = named.length ? named : star;
  const hit = rules.filter((r) => re(r.p).test(target)).sort((x, y) => y.p.length - x.p.length || (x.allow ? -1 : 1))[0];
  if (hit && !hit.allow) wanted(`robots.txt が禁じるパス（Disallow: ${hit.p}）。道具が自動で確かめた`);
};
robotsGate();
const wait = (S.tos.min_interval_s || 3) * 1000 - (Date.now() - last) + 300;
if (wait > 0) spawnSync('sleep', [String(Math.ceil(wait / 1000))]);

const ext = (url.match(/\.(pdf|html?|json|txt|xml)(?:$|\?)/i) || [, 'html'])[1].toLowerCase();
const dir = path.join(R, 'raw', src, coll);
fs.mkdirSync(dir, { recursive: true });
let file = path.join(dir, `${doc}${part ? '_' + part : ''}.${ext}`);
if (fs.existsSync(file) && !a.includes('--force')) die(`${path.relative(R, file)} は取得済み（取り直すなら --force）`);
// --render：JavaScript で組み立てるページを Chromium で描画してから保存する（2026-10-30 オーナーの承認）。描画後の HTML と、画面写真（PNG、part に _shot を付けた別の記録）を残す
// --viewport 390x844 で幅と高さ、--full で縦に全部を撮る
const render = a.includes('--render');
let r;
if (render) {
  const [vw, vh] = (opt('--viewport') || '1280x900').split('x');
  const png = file.replace(/\.[^.\/]+$/, '') + '_shot.png';
  if (fs.existsSync(png) && !a.includes('--force')) die(`${path.relative(R, png)} は取得済み（取り直すなら --force）`);
  r = spawnSync(process.execPath, [path.join(__dirname, 'research-render.js'), url, file, png, vw, vh, a.includes('--full') ? '1' : '0'], { encoding: 'utf8', timeout: 180000 });
  if (r.stderr) console.error(r.stderr.trim());
  if (fs.existsSync(png)) { const pb = fs.readFileSync(png); append({ url, part: (part ? part + '_' : '') + 'shot', status: Number((r.stdout || '').trim()) || 0, bytes: pb.length, sha256: crypto.createHash('sha256').update(pb).digest('hex'), file: path.relative(R, png), via: 'research-fetch-render', viewport: `${vw}x${vh}`, ...(S.tos.verdict === 'per-site' ? { tos: { verdict: tosV, basis: tosB, checked: tosC || new Date().toISOString().slice(0, 10) } } : {}) }); console.log(`画面写真 → ${path.relative(R, png)}`); }
} else r = spawnSync('curl', ['-sS', '-L', '-m', '90', '-A', 'boki2-quest-research (personal study design)', '-o', file, '-w', '%{http_code}', url], { encoding: 'utf8' });
const status = Number((r.stdout || '').trim()) || 0;
let buf = fs.existsSync(file) ? fs.readFileSync(file) : Buffer.alloc(0);
// 中身で拡張子を正す（URL に拡張子がない Excel・PDF が .html で保存され、「Excel だから読めない」と誤解された）
{ const magic = buf.slice(0, 4).toString('latin1'); const m12 = buf.slice(0, 12).toString('latin1');
  // 画像も拡張子を正す（画面の参考を集めるとき、画像が .html で保存されて開けなかった。2026-10-30）
  const real = magic.startsWith('%PDF') ? 'pdf' : magic.startsWith('PK') ? 'xlsx' : magic === '\xd0\xcf\x11\xe0' ? 'xls' : magic === '\x89PNG' ? 'png' : magic.startsWith('\xff\xd8\xff') ? 'jpg' : magic === 'GIF8' ? 'gif' : (magic === 'RIFF' && m12.slice(8) === 'WEBP') ? 'webp' : null;
  if (real && !file.endsWith('.' + real)) { const nf = file.replace(/\.[^.\/]+$/, '.' + real); if (!fs.existsSync(nf)) { fs.renameSync(file, nf); file = nf; console.log(`中身が ${real} だったので拡張子を直した → ${path.relative(R, nf)}`); } } }
append({ url, status, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex'), file: path.relative(R, file), via: render ? 'research-fetch-render' : 'research-fetch', ...(S.tos.verdict === 'per-site' ? { tos: { verdict: tosV, basis: tosB, checked: tosC || new Date().toISOString().slice(0, 10) } } : {}) });
console.log(`${status} ${buf.length}B → ${path.relative(R, file)}`);
if (status !== 200) {
  // 403 でも「ページが存在しない」の案内のことがある（中小企業庁は存在しない URL に 403 を返す）。拒否か URL 違いかを見分けられるよう、本文の先頭を見せる
  const head = buf.toString('utf8', 0, 4000).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  if (head) console.log(`本文の先頭：${head}`);
  if (/存在しません|見つかりません|not found|404/i.test(head)) console.log('→ URL が違う（移動・削除）可能性が高い。取得を拒否されたのではない。一覧のページから正しい URL を探すこと');
  process.exit(1);
}
