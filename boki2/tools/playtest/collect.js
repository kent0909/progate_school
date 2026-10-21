#!/usr/bin/env node
// 検査する人の report.md の Write が「下請けは報告のファイルを書かない」の決まりで断られたとき、
// 本人が書いた中身を、本人の会話記録から1字も変えずに取り出して保存する。まとめ役は中身を書かない。
//   - 遊び終わったあと（最後の close の後）の断られた Write があれば、その中身
//   - なければ（下書きしか Write していない）、本人の最後の返事（SubagentHandback）の本文
// --write をつけると、遊び終わる前でも最後の断られた Write の中身を使う（返事の本文が「全文は前の返答に」とだけ書いた人のため）。
// ファイルが既にあるときは上書きしない。ただし、いまの中身が本人の返事か本人の Write のどれかと同じときだけは置き換える（本人の文どうしの入れ替えで、他人の文は消さない）。verify.js は、いまのファイルがこのどちらかと1字でも違えば落とす。
//   2回目からは、本人が返事の中に印をつけて本文を書く（=====REPORT===== … =====END REPORT=====、議論は RESPONSE）。--tag REPORT|RESPONSE でその本文を report.md・response.md に保存する
// Usage: node boki2/tools/playtest/collect.js <playtest.json> <id> [--write | --tag REPORT|RESPONSE]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const [, , cfgFile, id, opt, tagArg] = process.argv;
if (!cfgFile || !id) { console.error('Usage: node collect.js <playtest.json> <id>'); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
const R = cfg.reviewers.find((r) => r.id === id);
if (!R) { console.error(`playtest.json に ${id} がない`); process.exit(1); }
const dir = path.resolve(R.dir), target = path.join(dir, opt === '--tag' && tagArg === 'RESPONSE' ? 'response.md' : 'report.md');
const tfile = cfg.archive && fs.existsSync(path.join(cfg.archive, id + '.jsonl')) ? path.join(cfg.archive, id + '.jsonl') : R.transcript;
const L = fs.readFileSync(tfile, 'utf8').split('\n').filter((l) => l.trim()).map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
const writes = [], refused = new Set(), handbacks = [];
for (const e of L) {
  const c = e.message && e.message.content; if (!Array.isArray(c)) continue;
  for (const b of c) {
    if (b.type === 'tool_use' && b.name === 'Write' && b.input && path.resolve(b.input.file_path) === target) writes.push({ t: Date.parse(e.timestamp), id: b.id, content: String(b.input.content) });
    if (b.type === 'tool_use' && b.name === 'SubagentHandback') handbacks.push({ t: Date.parse(e.timestamp), message: String((b.input || {}).message || '') });
    if (b.type === 'tool_result' && /Subagents should return findings as text/.test(JSON.stringify(b.content || ''))) refused.add(b.tool_use_id);
  }
}
if (opt === '--tag') {
  if (!/^(REPORT|RESPONSE)$/.test(tagArg || '')) { console.error('--tag は REPORT か RESPONSE'); process.exit(1); }
  const re = new RegExp(`=====${tagArg}=====\\n([\\s\\S]*?)\\n=====END ${tagArg}=====`);
  const hit = handbacks.map((h) => h.message.match(re)).filter(Boolean).pop();
  if (!hit) { console.error(`本人の返事に =====${tagArg}===== の印つきの本文がない`); process.exit(1); }
  const body = hit[1] + '\n';
  if (fs.existsSync(target)) { const cur = fs.readFileSync(target, 'utf8'); if (cur === body) { console.error('すでに同じ中身'); process.exit(0); } if (!handbacks.some((h) => (h.message.match(re) || [])[1] + '\n' === cur)) { console.error(`${target} は本人の文ではない中身。上書きしない`); process.exit(1); } }
  fs.writeFileSync(target, body);
  console.log(JSON.stringify({ id, file: target, from: `返事の ${tagArg}`, sha256: crypto.createHash('sha256').update(body).digest('hex'), chars: body.length }));
  process.exit(0);
}
const log = fs.readFileSync(path.join(dir, 'log.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const closes = log.filter((x) => x.kind === 'close');
const lastClose = closes.length ? Date.parse(closes[closes.length - 1].t) : 0;
const w = writes.filter((x) => refused.has(x.id) && (opt === '--write' || x.t > lastClose)).pop();
const body = w ? w.content : handbacks.length ? handbacks[handbacks.length - 1].message : null;
if (body == null) { console.error('本人の会話記録に、断られた report.md の Write も最後の返事もない'); process.exit(1); }
if (fs.existsSync(target)) {
  const cur = fs.readFileSync(target, 'utf8');
  if (cur === body) { console.error('すでに同じ中身'); process.exit(0); }
  if (!writes.some((x) => x.content === cur) && !handbacks.some((h) => h.message === cur)) { console.error(`${target} は本人の文ではない中身。上書きしない`); process.exit(1); }
}
fs.writeFileSync(target, body);
console.log(JSON.stringify({ id, from: w ? `断られた Write（${w.id}）` : '最後の返事（SubagentHandback）', sha256: crypto.createHash('sha256').update(body).digest('hex'), chars: body.length }));
