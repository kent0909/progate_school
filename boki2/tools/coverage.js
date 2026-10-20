#!/usr/bin/env node
// 試験範囲（js/scope.js）のうち、どこまでゲームで体験できるようになっているかを表で出す（開発用）。
// ・試作（js/sim/scenario.js）で体験できる場面・本試験形式の問題が付いているか
// ・scope.js が指す発見イベント・書類・問題が実在するか、全章がどこかの項目に属しているか
// Usage: node boki2/tools/coverage.js [--md]
global.window = global;
const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]).filter((f) => !f.endsWith('app.js'));
[...files, 'js/scope.js', 'js/sim/lexicon.js', 'js/sim/scenario.js'].forEach((f) => require(path.join(root, f)));
const B = window.BOKI, D = window.SIMDATA;
const md = process.argv.includes('--md');

const evs = D.months.flatMap((m) => m.events);
const discIds = new Set(evs.filter((e) => e.t === 'discover' || e.t === 'board').map((e) => e.id));
const docIds = new Set(evs.filter((e) => e.t === 'doc').map((e) => e.id));
const kinds = new Set(evs.filter((e) => e.t === 'doc').map((e) => e.kind));
const qKeys = new Set(B.chapters.flatMap((c) => c.qs.map((_, i) => `${c.id}:${i}`)));
const errors = [];
const ids = new Set();
for (const s of B.scope) {
  if (ids.has(s.id)) errors.push(`重複したID ${s.id}`);
  ids.add(s.id);
  if (!B.scopeAreas.some((a) => a.secs.includes(s.sec))) errors.push(`${s.id}: 区分 ${s.sec} が scopeAreas にない`);
  if (!B.chapters.some((c) => c.id === s.ch)) errors.push(`${s.id}: 章 ${s.ch} がない`);
  const sim = s.sim || {};
  for (const d of sim.disc || []) if (!discIds.has(d)) errors.push(`${s.id}: 発見イベント ${d} が台本にない`);
  for (const d of sim.docs || []) if (!docIds.has(d)) errors.push(`${s.id}: 書類 ${d} が台本にない`);
  for (const k of sim.kinds || []) if (!kinds.has(k)) errors.push(`${s.id}: 取引の種類 ${k} が台本にない`);
  for (const q of s.q || []) if (!qKeys.has(q)) errors.push(`${s.id}: 問題 ${q} がない`);
}
for (const c of B.chapters) if (c.id !== 'c47' && !B.scope.some((s) => s.ch === c.id)) errors.push(`章 ${c.id}（${c.title}）がどの項目にも属していない`);
for (const d of discIds) if (!B.scope.some((s) => ((s.sim || {}).disc || []).includes(d))) errors.push(`発見イベント ${d} がどの項目にも属していない`);

const has = (s) => { const x = s.sim || {}; return !!((x.disc || []).length || (x.docs || []).length || (x.kinds || []).length || x.close || x.report); };
const lines = [];
let total = { n: 0, sim: 0, q: 0 };
for (const a of B.scopeAreas) {
  const list = B.scope.filter((s) => a.secs.includes(s.sec));
  // 2027年度から出ない論点（y27: out）と3級へ移る論点（to3）は2級の分母に入れない
  const core = list.filter((s) => !s.y27 || s.y27 === 'chg' || s.y27 === 'new');
  const n = core.length, sim = core.filter(has).length, q = core.filter((s) => (s.q || []).length).length;
  if (a.id !== 'base') { total.n += n; total.sim += sim; total.q += q; }
  lines.push(md ? `\n### ${a.label}（${sim}/${n} 項目が体験できる）\n\n| 区分 | 項目 | 章 | 原理 | 体験 | 本試験形式 |\n|---|---|---|---|---|---|` : `\n■ ${a.label}　体験できる ${sim}/${n}　本試験形式の問題 ${q}/${n}`);
  for (const s of list) {
    const x = s.sim || {};
    const where = [...(x.disc || []), ...(x.docs || []), ...(x.kinds || []).map((k) => `種類:${k}`), x.close ? '月末締め' : '', x.report ? '決算書' : ''].filter(Boolean).join(' ');
    lines.push(md ? `| ${s.sec} | ${s.name} | ${s.ch} | ${s.p} | ${where || '—'} | ${(s.q || []).join(' ') || '—'} |` : `  ${has(s) ? '●' : '・'} ${s.sec.padEnd(10, '　')} ${s.name}${s.y27 ? `〔2027:${s.y27}〕` : ''}  [${s.ch} ${s.p}]${where ? '  ← ' + where : ''}${(s.q || []).length ? '  問:' + s.q.join(',') : ''}`);
  }
}
console.log(`2級の範囲（2027年4月施行の区分表）${total.n} 項目のうち、ゲームで体験できる ${total.sim}（${Math.round((total.sim / total.n) * 100)}%）、本試験形式の問題が付いている ${total.q}`);
console.log(lines.join('\n'));
if (errors.length) { console.error('\n' + errors.join('\n')); process.exit(1); }
