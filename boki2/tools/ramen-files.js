// ラーメン版（ramen.html）の台本と純粋関数のファイル。検査の道具（lexicon-check・sim-check・coverage・law-check の --ramen）が同じ順で読む。
// 順は ramen.html の <script> の並びをそのまま読む（ずれようがない）
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'ramen.html'), 'utf8');
const all = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
// 台本と世界の純粋関数（engine・hall・store・growth は除く）
const story = all.filter((f) => /^js\/sim\//.test(f) && !/(engine|store|growth|testforms|lexicon)\.js$/.test(f));
module.exports = { all, story };
