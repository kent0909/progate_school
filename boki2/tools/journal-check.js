#!/usr/bin/env node
// 段1の関所。UIの実入力は --browser（通信を遮断したlocalhost）で検査する。
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
global.window = global;
const root = path.join(__dirname, '..');
['js/core.js', 'js/data/accounts.js', 'js/data/kubun.js', 'js/sim/store.js', ...require('./ramen-files.js').story].forEach(f => require(path.join(root, f)));
const J = BOKI.journal, pro = SIMDATA.months.flatMap(m => m.events).find(e => e.id === 'prologue'), note = pro.steps.find(s => s.k === 'note');
assert(note.q.includes('何があるか') && note.q.includes('どこから来たか') && note.q.includes('増えた'));
assert(!note.q.includes('反対'), '反対の列は3行目の発見で示す');
assert.deepEqual(note.demo, { line: 0, card: 0 });
assert.equal(note.lines.length, 3);
for (const line of note.lines) for (const c of line.cards) {
  assert(!c.label.includes('：')); assert([...c.label].length <= 24);
  assert(typeof c.delta === 'number' || ['sale', '-cost'].includes(c.delta)); assert(['L', 'R'].includes(c.side));
}
assert(note.lines[2].ask && note.lines[2].cards.every(c => c.delta === '-cost'));
console.log('OK：noteの問いの手がかり・6枚の札・符号・手本・3行目の発見');
for (const [key, value] of Object.entries(J.limits)) { const [lo, hi] = J.ranges[key]; assert(value >= lo && value <= hi, key + ' の範囲'); }
for (const [name, seq] of Object.entries(J.timelines)) {
  const feedback = seq.filter(a => a.type === 'feedback');
  for (const a of feedback) {
    assert(a.duration <= 400, name + ':' + a.name); assert(a.start >= 0);
    assert(!a.calm.some(p => /transform|height|translate|scale/.test(p)), '控えめは位置と形を補間しない');
  }
  assert(Math.max(0, ...feedback.map(a => a.start + a.duration)) <= J.limits.timeline);
  seq.filter(a => a.type !== 'feedback').forEach(a => assert(a.skippable));
}
const end = name => Math.max(...J.timelines[name].map(a => a.start + a.duration));
assert.equal(end('note'), 650); assert.equal(Math.max(end('note'), end('row')), 680); assert.equal(end('doc'), 630);
console.log('OK：時間の線 note 650ms・行がそろった680ms・書類630ms、1つ400ms以内、控えめは色と不透明度');
// 既存v4へ追加する項目は省略可。設定はスロット共通、noteの記録は周の側。
const V = BOKI.store.v4, old = V.empty(), state = V.compose(old);
assert(!('noteLog' in state));
const changed = V.split(old, { ...state, motion: 'calm', sound: 'off', soundAsked: true, noteLog: [{ card: '0-1', firstSide: 'L', firstCorrect: false }] });
assert.equal(changed.meta.motion, 'calm'); assert(!('noteLog' in changed.meta));
assert.equal(V.compose(changed).noteLog[0].firstSide, 'L'); assert(V.encodedBytes(changed) < V.SAVE_BUDGET);
console.log('OK：古いv4互換・設定の共有・初回列の保存・2MiB上限');
const html = J.markup({ cards: [{ id: '0-0', label: '小銭', amount: 10000 }, { id: '0-1', label: '返すお金', amount: 10000 }], columns: [{ id: 'L', label: '左の列', cue: '何があるか' }, { id: 'R', label: '右の列', cue: 'どこから来たか' }], positions: { '0-0': 'L' } });
for (const handle of ['data-card', 'data-col', 'data-placed', 'data-note', 'data-side']) assert(html.includes(handle));
assert(!html.includes('親方に1万円借りた：小銭')); assert(html.includes('手札') && html.includes('押すと直せる') && html.includes('role="status"'));
const engine = fs.readFileSync(path.join(root, 'js/sim/engine.js'), 'utf8');
for (const handle of ['data-undo-card', 'data-demo-skip', 'data-note-reason', 'data-react-close']) assert((engine + fs.readFileSync(path.join(root, 'js/sim/journal-ui.js'), 'utf8')).includes(handle));
console.log('OK：札と列の取っ手・読み上げの名前・状態通知（実画面は--browser）');
if (process.argv.includes('--browser')) require('./playtest/journal-inputs.js').main().catch(e => { console.error(e); process.exitCode = 1; });
