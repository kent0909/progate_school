// 論証の検査役：out/*.txt の SUMMARY 行を、主な検査の表にする。使い方：node table.js out/A.txt out/B.txt …
const fs = require('fs');
const g = (s, k) => s.split('\n').find((l) => l.startsWith(k)) || '';
for (const f of process.argv.slice(2)) {
  const t = fs.readFileSync(f, 'utf8'); const line = g(t, 'SUMMARY '); if (!line) { console.log(f, '（SUMMARY なし）'); continue; }
  const S = JSON.parse(line.slice(8)); const fail = Object.entries(S.pass).filter(([, v]) => !v).map(([k]) => k).join('');
  const c5max = Math.max(...S.c5), over = S.c5.filter((x) => x > 15).length;
  const tierLine = (g(t, '段ごと').match(/段\d:\d+か所 利益-?\d+万/g) || []).map((x) => x.replace(/:\d+か所 利益/, ' ')).sort().join(' ');
  console.log(`| ${f.replace(/.*\//, '').replace('.txt', '')} | K${S.K}・SO${S.SO} | P_ref ${S.Pref} | ① ${S.c1} | ⑤ 最大${c5max}（15超 ${over}/${S.c5.length}） | ⑦ 繁華街 ${S.c7.hanka}%（slot ${S.c7slot.hanka}%） | ⑨ ${S.c9} | ⑪ office ${S.c11.office}・kojo ${S.c11.kojo} | ⑫a 段1 ${S.c12a[1]}・段6 ${S.c12a[6]} | ⑫b 需要 ${S.c12b.dem.join('/')}（逆転 ${S.c12b.revD.join('・') || 'なし'}） | ⑬ 最小 ${Math.min(...S.c13)} | ⑭ ${S.loss}% | ⑥ 最大 ${S.c6max}% | 外れ ${fail} | ${tierLine} |`);
}
