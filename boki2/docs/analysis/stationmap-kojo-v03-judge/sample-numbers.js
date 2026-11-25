// 判定役（11/25）：設計書 版0.3（1〜361行）の数を無作為に抜く。種 20261125、mulberry32。
// 母集団：19〜281行（0v3.0〜論証の表）の数の字句。除くもの：章番号（0v3.x）・[[..]] の中・`..` の中・「N行」「N章」・PLAN の節番号（数字.数字 の直後が章/節）。
// 抜いた順に並べ、確かめは手で（judge 書の表）。
const fs = require('fs');
const L = fs.readFileSync('/home/user/progate_school/boki2/docs/DESIGN-STATIONMAP-KOJO.md', 'utf8').split('\n');
let s = 20261125; const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pop = [];
for (let i = 18; i < 281; i++) {
  let t = L[i].replace(/\[\[[^\]]*\]\]/g, ' ').replace(/`[^`]*`/g, ' ').replace(/0v3(\.\d+)*/g, ' ').replace(/PLAN(\.md)? ?\d+(\.\d+)?/g, ' ').replace(/\d+(〜\d+)?(行|章)/g, ' ').replace(/[A-Z][0-9a-z]*/g, ' ').replace(/[⑪⑫⑬⑥][a-z]?/g, ' ');
  const re = /[−-]?\d[\d,]*(\.\d+)?/g; let m;
  while ((m = re.exec(t))) pop.push({ line: i + 1, tok: m[0], ctx: t.slice(Math.max(0, m.index - 18), m.index + m[0].length + 12).replace(/\s+/g, ' ') });
}
const idx = pop.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
console.log('母集団', pop.length);
idx.slice(0, +(process.argv[2] || 70)).forEach((k, n) => console.log(`${n + 1}\tL${pop[k].line}\t${pop[k].tok}\t${pop[k].ctx}`));
