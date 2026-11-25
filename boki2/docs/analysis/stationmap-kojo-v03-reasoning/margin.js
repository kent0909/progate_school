// 論証の検査役：出力の「工場の候補地ごと」の行と topLine から、線（上位30%）との差を並べる。使い方：node margin.js <出力.txt>...
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const t = fs.readFileSync(f, 'utf8'); const m = t.match(/"topLine":(-?\d+)/); const line = m ? +m[1] : null;
  const row = t.split('\n').find((l) => l.startsWith('工場の候補地ごと')); if (!row) { console.log(f, 'no row'); continue; }
  const items = row.split('：').slice(1).join('：').split('｜').map((s) => { const q = s.match(/^(.+?)\[(\w+)\] (-?\d+)万/); return q ? { town: q[1], type: q[2], op: +q[3], top: s.includes('★') } : null; }).filter(Boolean);
  const pos = items.filter((x) => x.op > 0).length; const near = items.filter((x) => !x.top && x.op >= line - 30).map((x) => `${x.town}[${x.type}]${x.op}`);
  console.log(`${f.split('/').pop().replace('.txt', '')}｜線${line}万｜上位：${items.filter((x) => x.top).map((x) => x.town + x.op).join('・') || 'なし'}｜線の30万下まで：${near.join('・') || 'なし'}｜黒字の工場 ${pos}/${items.length}｜上位6：${items.slice(0, 6).map((x) => `${x.town}[${x.type}]${x.op}`).join(' ')}`);
}
