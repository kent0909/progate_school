// 版0.3（11/25）：out3/ の SUMMARY・SUMMARY3 から、設計の案に写す短い表を作る（tablek3.js と同じ読み方。線は PLAN.md 9.3）。使い方：node summ3.js > out3/summary-table.md
const fs = require('fs'), path = require('path'); const O3 = path.join(__dirname, 'out3');
const S = {}, S3 = {};
for (const f of fs.readdirSync(O3).filter((f) => /^[A-J]_.*\.txt$/.test(f))) { const t = fs.readFileSync(path.join(O3, f), 'utf8'), k = f.replace('.txt', '');
  const m = t.match(/^SUMMARY (.*)$/m); if (m) S[k] = JSON.parse(m[1]); const m3 = t.match(/^SUMMARY3 (.*)$/m); if (m3) S3[k] = JSON.parse(m3[1]); }
const spans = ['s214', 's45', 's65', 's79'], seeds = ['18', '30', '42', '54'];
const cell = (k) => { const s = S[k], s3 = S3[k]; if (!s || !s3) return '—'; return `${s.kojo.kTop}/${s3.kojoN}・湾岸${s3.wTop}/${s3.wN}${s3.wpass['⑪w'] ? '○' : '×'}`; };
const p = (x) => console.log(x);
p('# 設計の案 版0.3 に写す表（summ3.js が out3/ の SUMMARY・SUMMARY3 から作った）\n');
p('「工場の上位30%／工場の数・湾岸の上位30%／湾岸の数」と ⑪w（湾岸2か所以上）の○×。seed 6。7.9 の seed 列は 18・30・42・54 の工場の数。\n');
p('| 地図（P2a） | 組 | 2.14 | 4.5 | 6.5 | 7.9 | 7.9 の seed 18・30・42・54（工場） | 湾岸を無作為に選んで上位30%（7.9・seed 6） | H3w（7.9・seed 6） |'); p('|---|---|---|---|---|---|---|---|---|');
for (const m of ['now', 'X1', 'X2', 'X2b', 'X3', 'X4', 'X5', 'L', 'A', 'U']) for (const g of ['K0', 'KO', 'KOT']) {
  const k = (sp) => (m === 'now' ? `A_${g}_${sp}` : `H_${m}_${g}_${sp}`);
  const ks = (so) => (m === 'now' ? `B_${g}_s79_so${so}` : `I_${m}_${g}_s79_so${so}`);
  const sd = seeds.map((so) => (S[ks(so)] ? S[ks(so)].kojo.kTop : '—')).join('・');
  const s3 = S3[k('s79')];
  p(`| ${m === 'now' ? '今の地図' : m} | ${g} | ${spans.map((sp) => cell(k(sp))).join(' | ')} | ${sd} | ${s3 && s3.hitW != null ? s3.hitW + '%' : '—'} | ${s3 ? (s3.wpass.H3w ? '○' : '×') + `（${s3.wMed}・${s3.allMed}）` : '—'} |`); }
p('\n## 今の地図の組（seed 6）');
p('| 組 | 2.14 | 4.5 | 6.5 | 7.9 |'); p('|---|---|---|---|---|');
const grp = [['KO から K1 を抜く', 'C_KO_noK1'], ['KO から K2 を抜く', 'C_KO_noK2'], ['KO から K3 を抜く（m_C 2.54）', 'C_KO_noK3h'], ['KO から K3 を抜く（m_C 1.93）', 'C_KO_noK3m'], ['KO から K5 を抜く', 'C_KO_noK5'], ['K1 だけ（1.59）', 'G_K1only'], ['K2 だけ', 'G_K2only'], ['K3 だけ', 'G_K3only'], ['K6 だけ', 'G_K6only'], ['K1（2.54）＋K5', 'G_K1hiK5']];
for (const [n, pre] of grp) p(`| ${n} | ${spans.map((sp) => cell(`${pre}_${sp}`)).join(' | ')} |`);
p('\n## 昼夜の上限の分け方（capLunch、seed 6）');
p('| 組 | 7.9：0.40 | 0.45 | 0.50 | 4.5：0.40 | 0.45 | 0.50 |'); p('|---|---|---|---|---|---|---|');
for (const [n, g, base] of [['K0', 'K0', 'A_K0'], ['KO', 'KO', 'A_KO'], ['KO から K5 を抜く', 'KO_noK5', 'C_KO_noK5']]) p(`| ${n} | ${['s79', 's45'].map((sp) => [cell(`E_${g}_cap40_${sp}`), cell(`${base}_${sp}`), cell(`E_${g}_cap50_${sp}`)].join(' | ')).join(' | ')} |`);
p('\n## 段の比 2.14 の seed（工場の上位30%、seed 6・18・30・42・54。K7m の seed 6 は out2）');
for (const g of ['K0', 'K7m', 'KO']) p(`- ${g}：` + ['6', ...seeds].map((so) => { const k = so === '6' ? (g === 'K7m' ? null : `A_${g}_s214`) : `F_${g}_s214_so${so}`; return k && S[k] ? S[k].kojo.kTop : (g === 'K7m' && so === '6' ? '3（out2）' : '—'); }).join('・'));
p('\n## 入れ替えの手順の比べ（KO、seed 6）');
p('| 地図 | 2.14 | 4.5 | 6.5 | 7.9 |'); p('|---|---|---|---|---|');
for (const m of ['L', 'A']) for (const pr of ['P2a', 'P2b', 'P3', 'P1']) p(`| ${m}・${pr} | ${spans.map((sp) => cell(pr === 'P2a' ? `H_${m}_KO_${sp}` : `J_${m}${pr}_KO_${sp}`)).join(' | ')} |`);
