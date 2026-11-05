#!/usr/bin/env node
'use strict';
// 復元: node boki2/docs/analysis/stationmap-sim/join-archives.js
// JSONの分割と見出し付きCSVの分割を、SHA256照合後に元のファイルへ戻す。ゲームは触らない。
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = __dirname, hash = s => crypto.createHash('sha256').update(s).digest('hex');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
for (const dir of ['v06-search-station/archive', 'v06-search-pin/archive', 'v06-followup-archive']) {
  const base = path.join(root, dir), index = read(path.join(base, 'index.json'));
  const trials = index.parts.flatMap(f => read(path.join(base, f)).trials);
  const content = JSON.stringify({ ...index.metadata, trials }, null, 2) + '\n';
  if (trials.length !== index.rows || hash(content) !== index.sha256) throw Error('JSON照合失敗: ' + dir);
  fs.writeFileSync(path.join(root, index.source), content);
  console.log('OK: ' + index.source);
}
for (const mode of ['station', 'pin']) {
  const base = path.join(root, 'v06-initial-' + mode), index = read(path.join(base, 'sites-manifest.json'));
  let content = '', rows = 0;
  index.parts.forEach((f, i) => {
    const lines = fs.readFileSync(path.join(base, f), 'utf8').split('\n');
    if (lines.pop() !== '') throw Error('CSV末尾改行: ' + f);
    const header = lines.shift();
    if (!i) content = header + '\n';
    content += lines.join('\n') + '\n'; rows += lines.length;
  });
  if (rows !== index.rows || hash(content) !== index.sha256) throw Error('CSV照合失敗: ' + mode);
  fs.writeFileSync(path.join(base, index.fullCSV), content);
  console.log('OK: v06-initial-' + mode + '/' + index.fullCSV);
}
