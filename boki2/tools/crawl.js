#!/usr/bin/env node
// Polite same-site crawler for public study pages (no dependencies, Node 18+).
//   node boki2/tools/crawl.js https://www.cpa-learning.com/ [--out boki2/crawl] [--max 400] [--delay 1500] [--include 'boki|簿記|column']
// - honours robots.txt (User-agent: *), reads sitemap.xml first, stays on the start host
// - one request at a time with a delay, backs off on 429/5xx, never sends cookies or logs in
// - keeps only titles and headings by default (no body text); pass --text to also keep up to 20k chars of body text
// - writes <out>/pages.jsonl (one page per line) and <out>/summary.json
const fs = require('fs');
// Node's fetch ignores HTTPS_PROXY unless NODE_USE_ENV_PROXY is set; re-run once with it so proxied environments work.
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const r = require('child_process').spawnSync(process.execPath, ['--no-warnings', ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } });
  process.exit(r.status == null ? 1 : r.status);
}
const path = require('path');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const start = new URL(args.find((a) => /^https?:\/\//.test(a)) || 'https://www.cpa-learning.com/');
const OUT = opt('--out', path.join(__dirname, '..', 'crawl'));
const MAX = +opt('--max', 400);
const DELAY = +opt('--delay', 1500);
const INCLUDE = new RegExp(opt('--include', 'boki|%E7%B0%BF%E8%A8%98|簿記|column|course|lecture|kyu|2級'), 'i');
const KEEP_TEXT = args.includes('--text');
const UA = 'boki2-quest-coverage-check/1.0 (+study material comparison; 1 req per ' + DELAY + 'ms)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 3) {
  for (let t = 0; t < tries; t++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/xml;q=0.9,*/*;q=0.5' }, redirect: 'follow' });
      if (res.status === 429 || res.status >= 500) { await sleep(DELAY * 4 * (t + 1)); continue; }
      return { status: res.status, type: res.headers.get('content-type') || '', url: res.url, body: res.ok ? await res.text() : '' };
    } catch (e) {
      if (t === tries - 1) return { status: 0, type: '', url, body: '', error: String(e.message || e) };
      await sleep(DELAY * 2);
    }
  }
  return { status: 429, type: '', url, body: '' };
}

function robotsRules(txt) {
  // collect Allow/Disallow for the "*" group
  const rules = [];
  let applies = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') applies = v === '*';
    else if (applies && (k === 'disallow' || k === 'allow') && v) rules.push({ allow: k === 'allow', p: v });
  }
  return (p) => {
    let best = null;
    for (const r of rules) {
      const re = new RegExp('^' + r.p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
      if (re.test(p) && (!best || r.p.length > best.p.length)) best = r;
    }
    return !best || best.allow;
  };
}

const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n));
const clean = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
function parse(html, base) {
  const body = html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ');
  const title = clean((body.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const heads = [...body.matchAll(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ lv: +m[1], t: clean(m[2]) })).filter((h) => h.t);
  const main = (body.match(/<main[\s\S]*?<\/main>/i) || body.match(/<article[\s\S]*?<\/article>/i) || [body])[0];
  const text = clean(main).slice(0, 20000);
  const links = [...body.matchAll(/<a\s[^>]*href\s*=\s*["']([^"'#]+)/gi)].map((m) => { try { return new URL(decode(m[1]), base).href; } catch (e) { return null; } }).filter(Boolean);
  return { title, heads, text, links };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const out = fs.createWriteStream(path.join(OUT, 'pages.jsonl'));
  const robots = await get(new URL('/robots.txt', start).href);
  const allowed = robotsRules(robots.status === 200 ? robots.body : '');
  const crawlDelay = (robots.body.match(/crawl-delay\s*:\s*(\d+)/i) || [])[1];
  const delay = Math.max(DELAY, crawlDelay ? +crawlDelay * 1000 : 0);
  const seen = new Set(), queue = [start.href], skipped = { robots: 0, offsite: 0, filtered: 0 }, files = [];
  const enqueue = (u) => {
    let x; try { x = new URL(u); } catch (e) { return; }
    x.hash = '';
    if (x.host !== start.host) { skipped.offsite++; return; }
    if (/\.(pdf)$/i.test(x.pathname)) { if (!files.includes(x.href)) files.push(x.href); return; }
    if (/\.(jpg|jpeg|png|gif|webp|svg|css|js|zip|mp4|mp3|ico|woff2?)$/i.test(x.pathname)) return;
    if (!allowed(x.pathname + x.search)) { skipped.robots++; return; }
    if (x.href !== start.href && !INCLUDE.test(decodeURIComponent(x.href))) { skipped.filtered++; return; }
    if (!seen.has(x.href)) { seen.add(x.href); queue.push(x.href); }
  };
  // sitemaps (index or urlset), from robots.txt or the default location
  const maps = [...robots.body.matchAll(/sitemap\s*:\s*(\S+)/gi)].map((m) => m[1]);
  if (!maps.length) maps.push(new URL('/sitemap.xml', start).href);
  for (let i = 0; i < maps.length && i < 30; i++) {
    const sm = await get(maps[i]); await sleep(delay);
    for (const m of sm.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) { const u = decode(m[1]); if (/\.xml(\.gz)?$/i.test(u)) maps.push(u); else enqueue(u); }
  }
  seen.add(start.href);
  let n = 0, errors = 0;
  while (queue.length && n < MAX) {
    const url = queue.shift();
    const r = await get(url);
    n++;
    if (r.status !== 200 || !/html/i.test(r.type)) { errors++; out.write(JSON.stringify({ url, status: r.status, error: r.error || r.type }) + '\n'); }
    else {
      const p = parse(r.body, r.url);
      out.write(JSON.stringify({ url, final: r.url, status: 200, title: p.title, heads: p.heads, ...(KEEP_TEXT ? { text: p.text } : {}), at: new Date().toISOString() }) + '\n');
      p.links.forEach(enqueue);
    }
    if (n % 20 === 0) console.log(`${n} pages, queue ${queue.length}`);
    await sleep(delay);
  }
  out.end();
  const summary = { start: start.href, pages: n, errors, leftInQueue: queue.length, pdfLinks: files, skipped, delayMs: delay, finishedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
})();
