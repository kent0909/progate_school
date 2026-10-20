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
if (S.tos.verdict === 'no-automation') die(`${S.name} は利用規約で自動取得が禁止されている（${S.tos.note}）`);
if (S.tos.verdict === 'unchecked') die(`${S.name} の利用規約がまだ確認されていない。sources.json の tos を埋めてから取得すること`);
const host = new URL(url).host;
if (!S.hosts.includes(host)) die(`${host} は ${src} の hosts にない`);

// アクセス間隔：同じホストへの直前の取得から min_interval_s 秒あける
const prev = fs.existsSync(L) ? fs.readFileSync(L, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((e) => { try { return new URL(e.url).host === host && e.status !== 'skipped'; } catch (x) { return false; } }) : [];
const last = prev.length ? Date.parse(prev[prev.length - 1].t) : 0;
const wait = (S.tos.min_interval_s || 3) * 1000 - (Date.now() - last);
if (wait > 0) spawnSync('sleep', [String(Math.ceil(wait / 1000))]);

const ext = (url.match(/\.(pdf|html?|json|txt|xml)(?:$|\?)/i) || [, 'html'])[1].toLowerCase();
const dir = path.join(R, 'raw', src, coll);
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${doc}${part ? '_' + part : ''}.${ext}`);
if (fs.existsSync(file) && !a.includes('--force')) die(`${path.relative(R, file)} は取得済み（取り直すなら --force）`);
const r = spawnSync('curl', ['-sS', '-L', '-m', '90', '-A', 'boki2-quest-research (personal study design)', '-o', file, '-w', '%{http_code}', url], { encoding: 'utf8' });
const status = Number((r.stdout || '').trim()) || 0;
const buf = fs.existsSync(file) ? fs.readFileSync(file) : Buffer.alloc(0);
append({ url, status, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex'), file: path.relative(R, file), via: 'research-fetch' });
console.log(`${status} ${buf.length}B → ${path.relative(R, file)}`);
if (status !== 200) process.exit(1);
