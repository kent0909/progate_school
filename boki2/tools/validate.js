#!/usr/bin/env node
// Content validator: node boki2/tools/validate.js [file-filter]
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'js', 'data');
const ctx = { console };
ctx.globalThis = ctx;
vm.createContext(ctx);
const load = (f) => vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });

load(path.join(root, 'js', 'core.js'));
load(path.join(dataDir, 'accounts.js'));
const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.js') && f !== 'accounts.js').sort();
for (const f of files) {
  try {
    load(path.join(dataDir, f));
  } catch (e) {
    console.error(`LOAD ERROR ${f}: ${e.message}`);
    process.exitCode = 1;
  }
}

const B = ctx.BOKI;
const filter = process.argv[2];
const errors = [];
const warns = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warns.push(`${where}: ${msg}`);
const worldIds = new Set(B.worlds.map((w) => w.id));
const castIds = new Set(Object.keys(B.cast));
const acc = B.accounts;

function checkHtml(where, s) {
  if (typeof s !== 'string') return;
  for (const tag of ['div', 'table', 'tr', 'ul', 'ol', 'b', 'em', 'span', 'p']) {
    const open = (s.match(new RegExp(`<${tag}(\\s|>)`, 'g')) || []).length;
    const close = (s.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (open !== close) err(where, `<${tag}> open ${open} / close ${close}`);
  }
  for (const m of s.matchAll(/\[\[je:([^\]]*)\]\]/g)) {
    const [d, c] = m[1].split('|');
    if (c === undefined) { err(where, `je shortcode missing "|": ${m[0]}`); continue; }
    const sum = (side) => side.split(',').map((r) => r.trim()).filter(Boolean).reduce((t, r) => {
      const mm = r.match(/^(.+?)\s+(-?\d+)$/);
      if (!mm) return t;
      if (!acc[mm[1].trim()]) warn(where, `je shortcode unknown account "${mm[1].trim()}"`);
      return t + Number(mm[2]);
    }, 0);
    const ds = sum(d), cs = sum(c);
    if (ds && cs && ds !== cs) err(where, `je shortcode unbalanced ${ds} vs ${cs}: ${m[0].slice(0, 80)}`);
  }
}

function checkEntry(where, e) {
  if (e === 'none') return;
  if (!e || !Array.isArray(e.dr) || !Array.isArray(e.cr) || !e.dr.length || !e.cr.length) return err(where, 'ans must have dr/cr arrays');
  let ds = 0, cs = 0;
  for (const [side, rows] of [['dr', e.dr], ['cr', e.cr]]) {
    const seen = new Set();
    for (const r of rows) {
      if (!Array.isArray(r) || r.length !== 2) { err(where, `${side} row malformed ${JSON.stringify(r)}`); continue; }
      const [a, v] = r;
      if (!acc[a]) err(where, `unknown account "${a}"`);
      if (seen.has(a)) err(where, `duplicate account "${a}" on ${side}`);
      seen.add(a);
      if (!Number.isInteger(v) || v <= 0) err(where, `amount must be positive integer: ${v}`);
      if (side === 'dr') ds += v; else cs += v;
    }
  }
  if (ds !== cs) err(where, `unbalanced dr ${ds} / cr ${cs}`);
}

function checkFill(where, q) {
  const idx = [...q.sheet.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
  if (!Array.isArray(q.blanks) || !q.blanks.length) return err(where, 'fill needs blanks');
  const set = new Set(idx);
  if (set.size !== idx.length) err(where, 'duplicate {{n}} placeholder');
  for (let i = 0; i < q.blanks.length; i++) if (!set.has(i)) err(where, `placeholder {{${i}}} missing in sheet`);
  for (const i of set) if (i >= q.blanks.length) err(where, `placeholder {{${i}}} has no blank`);
  q.blanks.forEach((b, i) => {
    if (typeof b === 'number') return;
    if (b && Array.isArray(b.opts) && Number.isInteger(b.a) && b.a >= 0 && b.a < b.opts.length) return;
    err(where, `blank ${i} malformed ${JSON.stringify(b)}`);
  });
  checkHtml(where + '.sheet', q.sheet);
}

function checkQ(where, q) {
  if (!q.q) err(where, 'missing q');
  if (!q.exp) err(where, 'missing exp');
  checkHtml(where + '.q', q.q);
  checkHtml(where + '.exp', q.exp);
  checkHtml(where + '.real', q.real);
  switch (q.type) {
    case 'journal':
      checkEntry(where, q.ans);
      (q.alt || []).forEach((e, i) => checkEntry(`${where}.alt${i}`, e));
      (q.opts || []).forEach((a) => { if (!acc[a]) err(where, `unknown opt account "${a}"`); });
      break;
    case 'choice':
      if (!Array.isArray(q.c) || q.c.length < 2 || q.c.length > 4) err(where, 'choice needs 2-4 options');
      else if (!Number.isInteger(q.a) || q.a < 0 || q.a >= q.c.length) err(where, 'choice answer out of range');
      break;
    case 'number':
      if (typeof q.a !== 'number' || Number.isNaN(q.a)) err(where, 'number answer must be number');
      break;
    case 'fill':
      checkFill(where, q);
      break;
    case 'sort':
      if (!Array.isArray(q.bins) || q.bins.length < 2) err(where, 'sort needs bins');
      else (q.items || []).forEach((it) => { if (!Number.isInteger(it[1]) || it[1] < 0 || it[1] >= q.bins.length) err(where, `sort item bin out of range ${it}`); });
      if (!q.items || q.items.length < 3) err(where, 'sort needs >=3 items');
      break;
    default:
      err(where, `unknown type ${q.type}`);
  }
}

const ids = new Set();
const stats = {};
for (const c of B.chapters) {
  if (filter && !c.id.includes(filter) && c.world !== filter) continue;
  const w = c.id || '(no id)';
  if (ids.has(c.id)) err(w, 'duplicate chapter id');
  ids.add(c.id);
  if (!worldIds.has(c.world)) err(w, `bad world ${c.world}`);
  if (!c.title) err(w, 'missing title');
  if (!c.scene || !Array.isArray(c.scene.lines) || !c.scene.mission) err(w, 'scene needs lines + mission');
  else c.scene.lines.forEach(([k], i) => { if (!castIds.has(k)) err(`${w}.scene[${i}]`, `unknown speaker ${k}`); });
  if (!Array.isArray(c.lessons) || c.lessons.length < 3) err(w, 'needs >=3 lessons');
  (c.lessons || []).forEach((l, i) => { if (!l.t || !l.h) err(`${w}.lesson${i}`, 'needs t/h'); checkHtml(`${w}.lesson${i}`, l.h); });
  if (!c.real || !c.real.t || !c.real.h) err(w, 'needs real card');
  else checkHtml(`${w}.real`, c.real.h);
  (c.accounts || []).forEach((a) => { if (!acc[a]) err(w, `unknown pool account "${a}"`); });
  if (!Array.isArray(c.qs) || c.qs.length < 6) warn(w, `only ${(c.qs || []).length} questions`);
  (c.qs || []).forEach((q, i) => checkQ(`${w}.q${i}`, q));
  const s = (stats[c.world] = stats[c.world] || { chapters: 0, qs: 0, journal: 0 });
  s.chapters++;
  s.qs += (c.qs || []).length;
  s.journal += (c.qs || []).filter((q) => q.type === 'journal').length;
}
const exParts = {};
for (const x of B.exams) {
  if (filter && !String(x.id).includes(filter)) continue;
  const w = `exam:${x.id}`;
  if (ids.has(x.id)) err(w, 'duplicate id');
  ids.add(x.id);
  if (![2, 3, 4, 5].includes(x.part)) err(w, 'part must be 2-5');
  if (!x.title) err(w, 'missing title');
  checkQ(w, { ...x, type: 'fill' });
  exParts[x.part] = (exParts[x.part] || 0) + 1;
}

for (const m of warns) console.log('WARN  ' + m);
for (const m of errors) console.log('ERROR ' + m);
console.log('---');
let tq = 0;
for (const k of Object.keys(stats).sort()) { const s = stats[k]; tq += s.qs; console.log(`${k}: ${s.chapters} chapters, ${s.qs} qs (${s.journal} journal)`); }
console.log(`total questions: ${tq}; exam problems by part: ${JSON.stringify(exParts)}`);
console.log(errors.length ? `${errors.length} error(s)` : 'OK');
if (errors.length) process.exitCode = 1;
