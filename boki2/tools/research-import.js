#!/usr/bin/env node
// オーナーがブラウザで開いて保存した資料（HTML・PDF・貼り付けたテキスト）を、取得記録に via: owner として登録する。
// 自動取得ではない（人がふつうに閲覧したもの）ので規約の自動取得禁止には当たらない。読了ノートと転載検査は通常どおり。
// Usage: node boki2/tools/research-import.js --src … --coll … --doc … --url <元のURL> --file <保存したファイル>
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const R = path.join(__dirname, '..', 'research');
const a = process.argv.slice(2);
const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
const [src, coll, doc, part, url, file] = ['--src', '--coll', '--doc', '--part', '--url', '--file'].map(opt);
const die = (m) => { console.error(m); process.exit(1); };
if (!src || !coll || !doc || !url || !file) die('--src --coll --doc --url --file は必須');
const S = JSON.parse(fs.readFileSync(path.join(R, 'sources.json'), 'utf8')).sources.find((s) => s.id === src);
if (!S || !S.collections.some((c) => c.id === coll)) die(`台帳に ${src}/${coll} がない。sources.json に登録すること`);
if (!fs.existsSync(file)) die(`${file} がない`);
const ext = (path.extname(file).slice(1) || 'txt').toLowerCase();
const dir = path.join(R, 'raw', src, coll);
fs.mkdirSync(dir, { recursive: true });
const dst = path.join(dir, `${doc}${part ? '_' + part : ''}.${ext}`);
fs.copyFileSync(file, dst);
const buf = fs.readFileSync(dst);
fs.appendFileSync(path.join(R, 'ledger.jsonl'), JSON.stringify({ t: new Date().toISOString(), src, coll, doc: String(doc), ...(part ? { part } : {}), url, status: 200, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex'), file: path.relative(R, dst), via: 'owner' }) + '\n');
const W = path.join(R, 'WANTED.md');
if (fs.existsSync(W)) fs.writeFileSync(W, fs.readFileSync(W, 'utf8').split('\n').map((l) => (l.includes(url) ? l.replace(/\| 未 \|$/, '| 受け取り済み |') : l)).join('\n'));
console.log(`登録した → ${path.relative(R, dst)}（via: owner）。読了ノートを書くこと`);
