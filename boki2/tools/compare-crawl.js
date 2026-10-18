#!/usr/bin/env node
// Compares crawled pages (tools/crawl.js output) with the game's content and lists topics that look missing.
//   node boki2/tools/compare-crawl.js [boki2/crawl] > boki2/crawl/coverage.md
// Heuristic: each heading on the site is reduced to its kanji/katakana terms; a heading counts as covered when
// most of its character trigrams appear somewhere in our lessons, questions or account names.
// The output is a review list for a person (or an agent) to judge, not a verdict.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const dir = process.argv[2] || path.join(root, 'crawl');
const ctx = {}; ctx.globalThis = ctx; vm.createContext(ctx);
const load = (f) => vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
load(path.join(root, 'js', 'core.js'));
load(path.join(root, 'js', 'data', 'accounts.js'));
fs.readdirSync(path.join(root, 'js', 'data')).filter((f) => f.endsWith('.js') && f !== 'accounts.js').sort().forEach((f) => load(path.join(root, 'js', 'data', f)));
const B = ctx.BOKI;

const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\[\[|\]\]/g, ' ');
const parts = [];
for (const c of B.chapters) {
  parts.push(c.title, c.sub, c.scene && c.scene.mission, c.real && c.real.t, c.real && c.real.h);
  for (const l of c.lessons || []) parts.push(l.t, l.h);
  for (const q of c.qs || []) parts.push(q.q, q.exp, q.real, ...(q.c || []));
}
for (const x of B.exams) parts.push(x.title, x.q, x.sheet, x.exp);
parts.push(...Object.keys(B.accounts));
const corpus = strip(parts.join(' '));

// words that say nothing about the topic
const NOISE = /簿記|日商|検定|試験|[0-9０-９]+級|第[0-9０-９]+回|過去問|問題|解説|講義|講座|動画|無料|教科書|テキスト|問題集|とは|について|まとめ|方法|やり方|ポイント|コツ|対策|勉強|学習|合格|わかりやすく|初心者|入門|基本|基礎|一覧|目次|おすすめ|CPA|ラーニング|チャンネル|ログイン|会員|登録|お問い合わせ|プライバシー|利用規約|会社概要|トップ|ホーム/g;
const terms = (s) => (String(s).replace(NOISE, ' ').match(/[一-龯゠-ヿー々]{2,}/g) || []);
const tri = (w) => { const out = []; if (w.length <= 3) return [w]; for (let i = 0; i + 3 <= w.length; i++) out.push(w.slice(i, i + 3)); return out; };
function coverage(s) {
  const ws = terms(s);
  if (!ws.length) return null;
  let hit = 0, all = 0;
  const miss = [];
  for (const w of ws) {
    const g = tri(w);
    const h = g.filter((x) => corpus.includes(x)).length;
    hit += h; all += g.length;
    if (h / g.length < 0.5) miss.push(w);
  }
  return { ratio: hit / all, miss, ws };
}

const file = path.join(dir, 'pages.jsonl');
if (!fs.existsSync(file)) { console.error(`no ${file} — run tools/crawl.js first`); process.exit(1); }
const pages = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((p) => p.status === 200);
const rows = new Map();
for (const p of pages) {
  for (const h of [{ lv: 0, t: p.title }, ...(p.heads || [])]) {
    if (h.lv > 3) continue;
    const c = coverage(h.t);
    if (!c) continue;
    const key = c.ws.join('・');
    const r = rows.get(key) || { t: h.t, ratio: c.ratio, miss: c.miss, urls: new Set() };
    r.urls.add(p.url);
    rows.set(key, r);
  }
}
const list = [...rows.values()].sort((a, b) => a.ratio - b.ratio);
const gaps = list.filter((r) => r.ratio < 0.6);
const fmtPct = (x) => `${Math.round(x * 100)}%`;
console.log(`# 外部サイトとの論点比較\n`);
console.log(`- 対象: ${pages.length} ページ（${dir}）\n- 見出し ${list.length} 件のうち、教材内に語が見つからない／少ない見出し: **${gaps.length} 件**\n- 判定は文字の一致による目安。最終判断は人が見出しとページを確認して行う。\n`);
console.log(`## 不足の可能性がある見出し（一致率の低い順）\n\n| 一致率 | 見出し | 教材に無い語 | ページ |\n|---|---|---|---|`);
for (const r of gaps) console.log(`| ${fmtPct(r.ratio)} | ${r.t.replace(/\|/g, '｜').slice(0, 80)} | ${r.miss.join('、')} | ${[...r.urls].slice(0, 2).join('<br>')} |`);
console.log(`\n## カバー済みと判定した見出し\n\n${list.filter((r) => r.ratio >= 0.6).map((r) => `- ${fmtPct(r.ratio)} ${r.t.slice(0, 80)}`).join('\n')}`);
