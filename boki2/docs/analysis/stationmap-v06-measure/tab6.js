// out/r_*.txt の SUMMARY の行を、検査書の表の形（①〜⑨）に並べる。使い方：node tab6.js [名前の前置き…]
const fs = require('fs'), path = require('path'); const dir = path.join(__dirname, 'out');
const pre = process.argv.slice(2);
const files = fs.readdirSync(dir).filter((f) => /^r_.*\.txt$/.test(f) && (!pre.length || pre.some((p) => f.startsWith('r_' + p))));
console.log('| 組 | 上書き | ① | ③ 段・属性・住商 | ④ | ⑤ 3年目の終わり（開店の前） | ⑥ 最大 | ⑦ オフィス・繁華街〔slot〕 | ⑧ | ⑨ | 赤字 | 満たさない | 減る費用を slot にすると |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const f of files.sort()) {
  const l = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').find((x) => x.startsWith('SUMMARY ')); if (!l) continue;
  const S = JSON.parse(l.slice(8)); const r = (a) => `${Math.min(...a)}〜${Math.max(...a)}`;
  const miss2 = S.c7slot ? Object.entries(S.pass).filter(([k, v]) => k === '⑦' ? !(S.c7slot.off >= 20 && S.c7slot.hanka >= 20) : !v).map(([k]) => k).join('') || 'なし' : '—';
  const miss = Object.entries(S.pass).filter(([, v]) => !v).map(([k]) => k).join('') || 'なし';
  console.log(`| ${f.slice(2, -4)} | \`${JSON.stringify(S.over)}\` | ${S.c1} | ${S.c3.tiers}・${S.c3.attrs}・${S.c3.js} | ${S.c4}% | ${r(S.c5)}（${r(S.c5pre)}） | ${S.c6max}% | ${S.c7.off}・${S.c7.hanka}${S.c7slot ? `〔${S.c7slot.off}・${S.c7slot.hanka}〕` : ''} | ${S.c8}% | ${S.c9} | ${S.loss}% | ${miss} | ${miss2} |`);
}
