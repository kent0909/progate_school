#!/usr/bin/env node
// 試験範囲（js/scope.js）のうち、どこまでゲームで体験できるようになっているかを表で出す（開発用）。
// ・試作（js/sim/scenario.js）で体験できる場面・本試験形式の問題（章の問題 q と、検定会場の大問の scope タグ）が付いているか
// ・scope.js が指す発見イベント・書類・問題が実在するか、全章がどこかの項目に属しているか
// Usage: node boki2/tools/coverage.js [--md]
global.window = global;
const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]).filter((f) => !f.endsWith('app.js'));
[...files, 'js/scope.js', 'js/sim/lexicon.js', 'js/sim/scenario.js', 'js/sim/year2.js'].forEach((f) => require(path.join(root, f)));
const B = window.BOKI, D = window.SIMDATA;
const md = process.argv.includes('--md');

const evs = D.months.flatMap((m) => m.events);
const discIds = new Set(evs.filter((e) => e.t === 'discover' || e.t === 'board' || e.t === 'closing' || e.t === 'opening' || e.t === 'sheet').map((e) => e.id));
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
// 検定会場の大問（BOKI.exams）の scope タグも「本試験形式の問題」に数える
const examQ = {};
for (const x of B.exams || []) for (const id of x.scope || []) {
  const s = B.scope.find((y) => y.id === id);
  if (!s) errors.push(`大問 ${x.id}: scope ${id} が scope.js にない`);
  else if (s.y27 === 'out') errors.push(`大問 ${x.id}: scope ${id} は2027年度の出題範囲外`);
  (examQ[id] = examQ[id] || []).push(x.id);
}
const qOf = (s) => [...(s.q || []), ...(examQ[s.id] || [])];
for (const c of B.chapters) if (c.id !== 'c47' && !B.scope.some((s) => s.ch === c.id)) errors.push(`章 ${c.id}（${c.title}）がどの項目にも属していない`);
for (const d of discIds) if (!B.scope.some((s) => ((s.sim || {}).disc || []).includes(d))) errors.push(`発見イベント ${d} がどの項目にも属していない`);

const has = (s) => { const x = s.sim || {}; return !!((x.disc || []).length || (x.docs || []).length || (x.kinds || []).length || x.close || x.report); };
const lines = [];
let total = { n: 0, sim: 0, q: 0, j: 0 };
// 第1問の形（章の仕訳問題）がある項目。章は複数の項目で共有するので、大問の範囲タグとは別に数える
const jOf = (s) => { const c = B.chapters.find((x) => x.id === s.ch); return c ? c.qs.filter((q) => q.type === 'journal').length : 0; };
for (const a of B.scopeAreas) {
  const list = B.scope.filter((s) => a.secs.includes(s.sec));
  // 2027年度から出ない論点（y27: out）と3級へ移る論点（to3）は2級の分母に入れない
  const core = list.filter((s) => !s.y27 || s.y27 === 'chg' || s.y27 === 'new');
  const n = core.length, sim = core.filter(has).length, q = core.filter((s) => qOf(s).length).length, j = core.filter((s) => jOf(s)).length;
  if (a.id !== 'base') { total.n += n; total.sim += sim; total.q += q; total.j += j; }
  lines.push(md ? `\n### ${a.label}（${sim}/${n} 項目が体験できる）\n\n| 区分 | 項目 | 章 | 原理 | 体験 | 本試験形式 |\n|---|---|---|---|---|---|` : `\n■ ${a.label}　体験できる ${sim}/${n}　本試験形式の大問 ${q}/${n}　章の仕訳（第1問の形）${j}/${n}`);
  for (const s of list) {
    const x = s.sim || {};
    const where = [...(x.disc || []), ...(x.docs || []), ...(x.kinds || []).map((k) => `種類:${k}`), x.close ? '月末締め' : '', x.report ? '決算書' : ''].filter(Boolean).join(' ');
    lines.push(md ? `| ${s.sec} | ${s.name} | ${s.ch} | ${s.p} | ${where || '—'} | ${qOf(s).join(' ') || '—'} |` : `  ${has(s) ? '●' : '・'} ${s.sec.padEnd(10, '　')} ${s.name}${s.y27 ? `〔2027:${s.y27}〕` : ''}  [${s.ch} ${s.p}]${where ? '  ← ' + where : ''}${qOf(s).length ? '  問:' + qOf(s).join(',') : ''}`);
  }
}
console.log(`2級の範囲（2027年4月施行の区分表）${total.n} 項目のうち、ゲームで体験できる ${total.sim}（${Math.round((total.sim / total.n) * 100)}%）、大問の範囲タグが付いている ${total.q}、章の仕訳（第1問の形）がある ${total.j}`);
console.log(lines.join('\n'));
if (errors.length) { console.error('\n' + errors.join('\n')); process.exit(1); }
