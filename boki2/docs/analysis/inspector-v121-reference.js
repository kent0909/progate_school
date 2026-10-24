#!/usr/bin/env node
// 仕事1の再実行用。既存の道具・本体は書き換えない。
// PR #5 comment 6383583380: calib10/hire10 は --ps なし。
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const args = process.argv.slice(2);
const get = (key, fallback) => {
  const i = args.indexOf(key);
  return i < 0 ? fallback : args[i + 1];
};
if (args.includes('--help') || !get('--root') || !get('--check') || !get('--out')) {
  console.log('node inspector-v121-reference.js --root <54a5afa＋指定patchのboki2> --check <ramen-impl-check.js> --out <新規のログ保存先> [--exp flip10|taste10|ceil10|calib10|hire10]');
  process.exit(args.includes('--help') ? 0 : 1);
}
const root = path.resolve(get('--root'));
const check = path.resolve(get('--check'));
const out = path.resolve(get('--out'));
const blob = (file) => {
  const b = fs.readFileSync(file);
  return crypto.createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
};
const expected = [
  [check, '840416fdcb099554e40d03446045fd4f5d80e94e'],
  [path.join(root, 'js/sim/bowl.js'), '6fc74818684d5772d3eb6bede2496516d2ec3bc9'],
  [path.join(root, 'js/sim/rivals.js'), '3a4170d4adcdbe8fad73fdb64bd867b1b86f8297'],
  [path.join(root, 'js/sim/world.js'), '8c644611a584c17b48982ed3ea4977c2dd4bb312'],
];
for (const [file, sha] of expected) {
  if (blob(file) !== sha) throw new Error(`対象版が違う: ${file}`);
}
const experiments = {
  flip10: ['--ps', '0.581226', '--seeds', '150'],
  taste10: ['--ps', '0.581226'],
  ceil10: ['--ps', '0.581226', '--seeds', '150'],
  calib10: [],
  hire10: ['--recal', '1'],
};
const selected = get('--exp') ? [get('--exp')] : Object.keys(experiments);
for (const exp of selected) if (!(exp in experiments)) throw new Error(`未知の実験: ${exp}`);
fs.mkdirSync(out, { recursive: true });
for (const exp of selected) {
  const argv = [check, '--root', root, '--exp', exp, '--runs', '300', ...experiments[exp]];
  const fd = fs.openSync(path.join(out, `${exp}.log`), 'wx');
  const started = new Date().toISOString();
  console.log(`${exp} 開始（比較周数は既存の道具に従う）`);
  let result;
  try { result = spawnSync(process.execPath, argv, { stdio: ['ignore', fd, fd] }); }
  finally { fs.closeSync(fd); }
  const record = { node: process.version, argv, started, finished: new Date().toISOString(), status: result.status, signal: result.signal, error: result.error?.message, expected };
  fs.writeFileSync(path.join(out, `${exp}.json`), JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
  if (result.status !== 0 || result.error) process.exit(1);
  console.log(`${exp} 完了`);
}
