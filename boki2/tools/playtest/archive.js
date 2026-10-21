#!/usr/bin/env node
// 会話記録の保管。会話が長くなって要約（compaction）されると、会話記録の前半が消えることがある（1回目の検査で、2人分の persona の Write と前半の遊びが確かめられなくなった）。
// 検査のあいだ、まとめ役がこれをくり返し動かし、本人とまとめ役の会話記録を、行を足すだけの写しに残す（一度でも見えた行は消さない）。
// verify.js は、写しがあれば写しを読む。写しは元の会話記録の行をそのまま持つので、まとめ役が中身を作ることはできない（作れば、元の記録にない行が混ざる）。
// Usage: node archive.js <playtest.json>
const fs = require('fs');
const path = require('path');
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = cfg.archive;
if (!out) { console.error('playtest.json に archive（写しを置くフォルダ）がない'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const keep = (src, name) => {
  if (!src || !fs.existsSync(src)) return null;
  const dst = path.join(out, name + '.jsonl');
  const have = fs.existsSync(dst) ? fs.readFileSync(dst, 'utf8').split('\n').filter(Boolean) : [];
  const seen = new Set(have);
  const add = fs.readFileSync(src, 'utf8').split('\n').filter((l) => l && !seen.has(l));
  if (add.length) fs.appendFileSync(dst, add.join('\n') + '\n');
  return { name, lines: have.length + add.length, added: add.length };
};
const res = [keep(cfg.main, 'main'), ...cfg.reviewers.map((r) => keep(r.transcript, r.id))].filter(Boolean);
console.log(JSON.stringify(res));
