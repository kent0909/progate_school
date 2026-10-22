// BIZ-REPLAY 版0.5：いまの試作（ピヨ商店）の台本で、条件Aの記録（S.examLog）に入る本試験の文の問題が、1回の台本で最大何問出るかを数える
// 使い方：node boki2/docs/analysis/replay-lambda-count.js
// 数えるもの：台本の発見（t:'discover'。発見のあとの確かめは1発見に最大1問：engine.js discQuiz の slice(0,1)）、
// 腕だめし（t:'quiz'。1回に最大5問：pickQuiz）、試験範囲の項目のうち場面（sim）を持つもの（411行の章の問題の入り口は it.sim が要る）と持たないもの
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..', '..');
const cnt = (f, re) => (fs.readFileSync(path.join(R, 'js', 'sim', f), 'utf8').match(re) || []).length;
const disc = cnt('scenario.js', /t: 'discover'/g) + cnt('year2.js', /t: 'discover'/g);
const quiz = cnt('scenario.js', /t: 'quiz'/g) + cnt('year2.js', /t: 'quiz'/g);
global.window = global; require(path.join(R, 'js', 'scope.js'));
const L = global.BOKI.scope.filter((i) => i.y27 !== 'out');
const sim = L.filter((i) => i.sim), nosim = L.filter((i) => !i.sim);
const maxQ = disc * 1 + quiz * 5;
console.log('台本の発見', disc, '件（1件に最大1問）、腕だめし', quiz, '回（1回に最大5問）→ 1回の台本で最大', maxQ, '問');
console.log('試験範囲の項目', L.length, '：場面（sim）あり', sim.length, '、なし', nosim.length, '（なしの項目で it.q を持つもの', nosim.filter((i) => i.q && i.q.length).length, '）');
console.log('場面のある項目1つあたりの上限：', (maxQ / sim.length).toFixed(2), '問（1回の台本）。全項目で割ると', (maxQ / L.length).toFixed(2));
console.log('場面のない項目は、検定会場の大問（B.examScope）でしか条件Aの記録が増えない');
