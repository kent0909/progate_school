#!/usr/bin/env node
// Bundles index.html + css + js into one self-contained page fragment (for Claude Artifacts or single-file sharing).
// Usage: node boki2/tools/build.js <out.html> [--full]   (--full keeps the <!DOCTYPE>/<html> skeleton)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = process.argv[2] || path.join(root, 'dist', 'boki2-quest.html');
const full = process.argv.includes('--full');
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const css = read('css/style.css');
const scripts = [...src.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const js = scripts.map((s) => `/* ${s} */\n${read(s)}`).join('\n').replace(/<\/script/gi, '<\\/script');
const head = src.match(/<!--BUILD:HEAD-->([\s\S]*?)<!--\/BUILD:HEAD-->/)[1]
  .replace(/<link rel="stylesheet" href="css\/style.css">/, `<style>\n${css}\n</style>`);
const body = `<noscript>このゲームを遊ぶには JavaScript を有効にしてください。</noscript>\n<script>\n${js}\n</script>\n`;
const html = full
  ? `<!DOCTYPE html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">${head}</head>\n<body>\n${body}</body>\n</html>\n`
  : `${head.trim()}\n${body}`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
