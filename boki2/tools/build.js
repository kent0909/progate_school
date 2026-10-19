#!/usr/bin/env node
// Bundles index.html + css + js into one self-contained page fragment (for Claude Artifacts or single-file sharing).
// Usage: node boki2/tools/build.js <out.html> [--full] [--page sim.html]   (--full keeps the <!DOCTYPE>/<html> skeleton)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = process.argv[2] || path.join(root, 'dist', 'boki2-quest.html');
const full = process.argv.includes('--full');
const pi = process.argv.indexOf('--page');
const page = pi > 0 ? process.argv[pi + 1] : 'index.html';
const src = fs.readFileSync(path.join(root, page), 'utf8');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const scripts = [...src.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const js = scripts.map((s) => `/* ${s} */\n${read(s)}`).join('\n').replace(/<\/script/gi, '<\\/script');
const head = src.match(/<!--BUILD:HEAD-->([\s\S]*?)<!--\/BUILD:HEAD-->/)[1]
  .replace(/<link rel="stylesheet" href="(css\/[^"]+)">/g, (_, p) => `<style>\n${read(p)}\n</style>`);
// keep the page's own body markup (e.g. a mount point), with all scripts merged into one
const markup = src.match(/<body>([\s\S]*?)<\/body>/)[1].replace(/<script src="[^"]+"><\/script>\s*/g, '').trim();
const body = `${markup}\n<script>\n${js}\n</script>\n`;
const html = full
  ? `<!DOCTYPE html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">${head}</head>\n<body>\n${body}</body>\n</html>\n`
  : `${head.trim()}\n${body}`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
