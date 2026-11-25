// 版0.3（戦略構想 Opus 5.5、11/25）：out3/ の SUMMARY・SUMMARY3 から表を作る（PLAN.md 9章。線・規則の式は PLAN.md 7.3・7.4・9.3・9.5 を写した。数を並べ、規則を機械で当てる）。
// out2/ の数（K7m・K1hi）を引くところは「out2」と書く。使い方：node tablek3.js > out3/table3.md
const fs = require('fs'), path = require('path'); const O3 = path.join(__dirname, 'out3'), O2 = path.join(__dirname, 'out2');
const S = {}, S3 = {}, site = {}, p2 = {};
const load = (dir, pre) => { for (const f of fs.readdirSync(dir).filter((f) => /\.txt$/.test(f) && /^[A-J]_/.test(f))) { const t = fs.readFileSync(path.join(dir, f), 'utf8'); const k = pre + f.replace('.txt', '');
  const m = t.match(/^SUMMARY (.*)$/m); if (m) S[k] = JSON.parse(m[1]); const m3 = t.match(/^SUMMARY3 (.*)$/m); if (m3) S3[k] = JSON.parse(m3[1]);
  const w = t.match(/^工場の候補地ごと.*?：(.*)$/m); if (w) site[k] = w[1].split('｜');
  const q = t.match(/^P2ALL 全候補地.*?に入る工場 (\d+)\/(\d+)（うち湾岸 (\d+)）.*?越える工場 (\d+)\/(\d+)/m); if (q) p2[k] = { in: +q[1], n: +q[2], w: +q[3], vs1: +q[4] }; } };
load(O3, ''); load(O2, 'out2:');
const p = (x) => console.log(x);
const spans = ['s214', 's45', 's65', 's79'], seeds = ['6', '18', '30', '42', '54'];
const kN = ['⑪k', 'H1', 'H2', 'H3'], wN = ['⑪w', 'H1w', 'H2w', 'H3w'];
const t1 = (s) => s.c12a['1'];
const brk = (s, b) => (s && b ? Object.keys(s.kojo.passB).filter((c) => c !== '⑫a' && b.kojo.passB[c] && !s.kojo.passB[c]) : ['（基準の出力なし）']);
const by = (s, t) => (s.kojo.kBy[t] ? `${s.kojo.kBy[t].top}/${s.kojo.kBy[t].n}（${s.kojo.kBy[t].med}万）` : '—');
const jw = (s3) => (s3 ? wN.map((n) => n + (s3.wpass[n] ? '○' : '×')).join(' ') : '—');
const jk = (s) => kN.map((n) => n + (s.kojo.kpass[n] ? '○' : '×')).join(' ');
const nameOf = { K0: 'K0 基準', KO: 'KO（K1 m_C1.93＋K2＋K3＋K5）', KOT: 'KO で T を掛けない', KO_noK1: 'KO から K1 を抜く（K2＋K3。夜の項も消える）', KO_noK2: 'KO から K2 を抜く', KO_noK3h: 'KO から K3 を抜く（m_C 2.54）', KO_noK3m: 'KO から K3 を抜く（m_C 1.93 のまま、比べ）', KO_noK5: 'KO から K5 を抜く（＝K1＋K2＋K3 m_C1.93）', K7m: 'K7m（KO＋K6）', K1only: 'K1 だけ（m_C 1.59）', K2only: 'K2 だけ', K3only: 'K3 だけ', K6only: 'K6 だけ', K1hiK5: 'K1（m_C 2.54）＋K5', K1hi: 'K1 だけ（m_C 2.54）' };
const hdr = '| 組 | 段の比 | seed | 候補地 | 上位30%の線（万円） | 工場の上位30% | 湾岸（上位/数・中央） | 住工混在 | 事務所街 | 工場の判定 | 湾岸の判定 | H2w（人通り／働き手／昼だけ） | 湾岸を無作為に選んで上位30%に入る | 湾岸の中央・全体の中央（万円） | ⑫a のほかで壊れた（K0 と対で） | ⑫a 段1 | P_ref |';
const sep = '|' + '---|'.repeat(17);
const row = (lab, k, kb, span, seed) => { const s = S[k], s3 = S3[k]; if (!s) return `| ${lab} | ${span} | ${seed} | （出力なし：${k}） |`;
  return `| ${lab} | ${span} | ${seed} | ${s3 ? s3.nSites : '—'} | ${s3 ? s3.topLine : '—'} | ${s.kojo.kTop}/${s3 ? s3.kojoN : 25} | ${s3 ? `${s3.wTop}/${s3.wN}（${s3.wMed}万）` : by(s, 'wangan')} | ${by(s, 'mix')} | ${by(s, 'office')} | ${jk(s)} | ${jw(s3)} | ${s3 ? Object.values(s3.H2w).map((v) => (v == null ? '—' : v + '%')).join('／') : '—'} | ${s3 && s3.hitW != null ? s3.hitW + '%' : '—'} | ${s3 ? `${s3.wMed}・${s3.allMed}` : `${s.kojo.kBy.wangan ? s.kojo.kBy.wangan.med : '—'}・${s.kojo.allMed}`} | ${brk(s, S[kb]).join('・') || 'なし'} | ${t1(s)} | ${s.Pref} |`; };
p('# out3/ の表（版0.3。day＝1・K12・γ・正本ではない。tablek3.js が SUMMARY・SUMMARY3 から作った）\n');
p(`回した本数：out3/ に SUMMARY3 のある出力 ${Object.keys(S3).filter((k) => !k.startsWith('out2:')).length} 本（jobs3.txt の行 ${fs.existsSync(path.join(O3, 'jobs3.txt')) ? fs.readFileSync(path.join(O3, 'jobs3.txt'), 'utf8').trim().split('\n').length : '—'}）。`);
const missing = fs.existsSync(path.join(O3, 'jobs3.txt')) ? fs.readFileSync(path.join(O3, 'jobs3.txt'), 'utf8').trim().split('\n').map((l) => l.split(' ')[0]).filter((n) => !S3[n]) : [];
p(`回していない（出力のない）組：${missing.length} 本${missing.length ? '：' + missing.join('・') : ''}\n`);
// 1. 今の地図
p('## 1. 今の地図（A。seed 6）\n'); p(hdr); p(sep);
for (const g of ['K0', 'KO', 'KOT']) for (const sp of spans) p(row(nameOf[g], `A_${g}_${sp}`, `A_K0_${sp}`, sp, 6));
const same = spans.map((sp) => { const a = S[`A_K0_${sp}`], b = S[`out2:A_K0_${sp}`]; return a && b ? JSON.stringify(a) === JSON.stringify(b) : null; });
p(`\n- 台本の確かめ：A の K0 の SUMMARY の行が out2/ の K0 と文字まで同じか：${spans.map((sp, i) => sp + ' ' + (same[i] == null ? '—' : same[i] ? '同じ' : '違う')).join('・')}`);
// 2. seed（7.9）
p('\n## 2. 段の比 7.9 の5つの seed（今の地図）\n'); p(hdr); p(sep);
const key79 = (g, so, pre = '') => (so === '6' ? `${pre}A_${g}_s79` : `${pre}B_${g}_s79_so${so}`);
for (const g of ['K0', 'KO', 'KOT']) for (const so of seeds) p(row(nameOf[g], key79(g, so), key79('K0', so), 's79', so));
const S12 = seeds.filter((so) => S[key79('K0', so)] && S[key79('K0', so)].kojo.passB['⑫a']);
p(`\n- ⑫a（7.3）：K0 で○の seed ＝ {${S12.join('・')}}（${S12.length}/5）→ ${S12.length <= 2 ? '「分けられない」（報告だけ）' : '判定する'}`);
for (const g of ['KO', 'KOT']) { const n = seeds.filter((so) => S[key79(g, so)]).length, w = seeds.filter((so) => S3[key79(g, so)] && S3[key79(g, so)].wpass['⑪w']).length, k = seeds.filter((so) => S[key79(g, so)] && S[key79(g, so)].kojo.kpass['⑪k']).length;
  p(`- ${nameOf[g]}：回した seed ${n}/5、⑪k ○ ${k}/5、⑪w ○ ${w}/5、工場の上位30% ${seeds.map((so) => (S[key79(g, so)] ? S[key79(g, so)].kojo.kTop : '—')).join('・')}`); }
// 3. 1つずつ抜く
p('\n## 3. KO から1つずつ抜いた組（C）と、K6 を足した組（out2 の K7m）\n'); p(hdr); p(sep);
for (const g of ['KO', 'KO_noK1', 'KO_noK2', 'KO_noK3h', 'KO_noK3m', 'KO_noK5']) for (const sp of spans) p(row(nameOf[g], g === 'KO' ? `A_KO_${sp}` : `C_${g}_${sp}`, `A_K0_${sp}`, sp, 6));
for (const sp of spans) p(row(nameOf.K7m + '（out2）', `out2:A_K7m_${sp}`, `out2:A_K0_${sp}`, sp, 6));
// 4. P2ALL
p('\n## 4. パート1人と2人の良いほうで並べる（D、P2ALL。day＝1・m_C 1.93）\n');
p('| 組 | 段の比 | 良いほうで並べた上位30%に入る工場 | うち湾岸 | 工場だけ良いほう・ほかはパート1人の線を越える工場 | （比べ）パート1人の工場の上位30% |'); p('|---|---|---|---|---|---|');
for (const g of ['K0', 'KO']) for (const sp of spans) { const k = `D_${g}_${sp}`, q = p2[k]; p(`| ${nameOf[g]} | ${sp} | ${q ? q.in + '/' + q.n : '（出力なし）'} | ${q ? q.w : '—'} | ${q ? q.vs1 + '/' + q.n : '—'} | ${S[k] ? S[k].kojo.kTop + '/25' : '—'} |`); }
// 5. capLunch
p('\n## 5. 昼夜の上限の分け方（E、R15。主は 0.45＝A の列）\n'); p(hdr.replace('| 組 |', '| 組（capLunch） |')); p(sep);
for (const g of ['K0', 'KO', 'KO_noK5']) for (const sp of ['s79', 's45']) { p(row(`${nameOf[g]}（0.45）`, g === 'KO_noK5' ? `C_KO_noK5_${sp}` : `A_${g}_${sp}`, `A_K0_${sp}`, sp, 6));
  for (const c of ['40', '50']) p(row(`${nameOf[g]}（0.${c}）`, `E_${g}_cap${c}_${sp}`, `E_K0_cap${c}_${sp}`, sp, 6)); }
// 6. 2.14 の seed
p('\n## 6. 段の比 2.14 の5つの seed（F。K7m の seed 6 は out2）\n'); p(hdr); p(sep);
const key214 = (g, so) => (so === '6' ? (g === 'K7m' ? `out2:A_K7m_s214` : `A_${g}_s214`) : `F_${g}_s214_so${so}`);
for (const g of ['K0', 'K7m', 'KO']) for (const so of seeds) p(row(nameOf[g], key214(g, so), key214('K0', so), 's214', so));
for (const g of ['K7m', 'KO']) { const v = seeds.map((so) => S[key214(g, so)]); p(`- ${nameOf[g]}：工場の上位30% ${v.map((s) => (s ? s.kojo.kTop : '—')).join('・')}（⑪k ○ ${v.filter((s) => s && s.kojo.kpass['⑪k']).length}/5）`); }
// 7. 単独
p('\n## 7. 単独の仕組み（G、day＝1。K1hi は out2）\n'); p(hdr); p(sep);
for (const g of ['K1only', 'K2only', 'K3only', 'K6only', 'K1hiK5']) for (const sp of spans) p(row(nameOf[g], `G_${g}_${sp}`, `A_K0_${sp}`, sp, 6));
for (const sp of spans) p(row(nameOf.K1hi + '（out2）', `out2:A_K1hi_${sp}`, `out2:A_K0_${sp}`, sp, 6));
// 8. 入れ替えた地図
const MAPS = ['X1', 'X2', 'X2b', 'X3', 'X4', 'X5', 'L', 'A', 'U'];
p('\n## 8. 入れ替えた地図（H、P2a・seed 6）\n'); p(hdr.replace('| 組 |', '| 地図・組 |')); p(sep);
for (const m of MAPS) for (const g of ['K0', 'KO', 'KOT']) for (const sp of spans) p(row(`${m}・${nameOf[g]}`, `H_${m}_${g}_${sp}`, `H_${m}_K0_${sp}`, sp, 6));
p('\n## 9. 入れ替えた地図の 7.9 の5つの seed（I）\n'); p(hdr.replace('| 組 |', '| 地図・組 |')); p(sep);
const keyM = (m, g, so) => (so === '6' ? `H_${m}_${g}_s79` : `I_${m}_${g}_s79_so${so}`);
for (const m of MAPS) for (const g of ['K0', 'KO']) for (const so of seeds) p(row(`${m}・${nameOf[g]}`, keyM(m, g, so), keyM(m, 'K0', so), 's79', so));
p('\n## 10. 入れ替えの手順の比べ（J。L・A の地図、seed 6。P2a は 8章）\n'); p(hdr.replace('| 組 |', '| 地図・手順・組 |')); p(sep);
for (const m of ['L', 'A']) for (const pr of ['P2b', 'P3', 'P1']) for (const g of ['K0', 'KO']) for (const sp of spans) p(row(`${m}・${pr}・${nameOf[g]}`, `J_${m}${pr}_${g}_${sp}`, `J_${m}${pr}_K0_${sp}`, sp, 6));
// 11. 選ぶ規則
p('\n## 11. 選ぶ規則（PLAN.md 7.4 を、⑪k の形と ⑪w の形の両方で。9.5）\n');
p('| 地図 | 組 | 4つの段の比（seed 6）：⑪k 形の判定 | 4つの段の比：⑪w 形の判定 | 7.9 の5 seed：⑪k 形○／⑪w 形○／壊れのあった seed | 当てはめ（⑪k 形） | 当てはめ（⑪w 形） |'); p('|---|---|---|---|---|---|---|');
const sel = (m, g) => { const kA = (sp) => (m === 'now' ? `A_${g}_${sp}` : `H_${m}_${g}_${sp}`), kB = (sp) => (m === 'now' ? `A_K0_${sp}` : `H_${m}_K0_${sp}`);
  const okK = (k, b) => S[k] && kN.every((n) => S[k].kojo.kpass[n]) && !brk(S[k], S[b]).length, okW = (k, b) => S[k] && S3[k] && wN.every((n) => S3[k].wpass[n]) && !brk(S[k], S[b]).length;
  const aK = spans.map((sp) => okK(kA(sp), kB(sp))), aW = spans.map((sp) => okW(kA(sp), kB(sp)));
  const kk = (so) => (m === 'now' ? key79(g, so) : keyM(m, g, so)), kb = (so) => (m === 'now' ? key79('K0', so) : keyM(m, 'K0', so));
  const ran = seeds.filter((so) => S[kk(so)]); const bK = ran.filter((so) => S[kk(so)] && kN.every((n) => S[kk(so)].kojo.kpass[n])).length, bW = ran.filter((so) => S3[kk(so)] && wN.every((n) => S3[kk(so)].wpass[n])).length, bB = ran.filter((so) => brk(S[kk(so)], S[kb(so)]).length).length;
  const finalK = aK.every(Boolean) && ran.length === 5 && bK >= 3 && bB < 3, finalW = aW.every(Boolean) && ran.length === 5 && bW >= 3 && bB < 3;
  const fmt = (a) => spans.map((sp, i) => `${sp}${a[i] ? '○' : '×'}`).join(' ');
  p(`| ${m === 'now' ? '今の地図' : m} | ${nameOf[g]} | ${fmt(aK)} | ${fmt(aW)} | ${ran.length < 5 ? `seed ${ran.length}/5 だけ` : `${bK}/5・${bW}/5・${bB}/5`} | ${finalK ? '通る' : aK.some(Boolean) ? '一部の段の比だけ（段の比しだい）' : '通らない'} | ${finalW ? '通る' : aW.some(Boolean) ? '一部の段の比だけ（段の比しだい）' : '通らない'} |`); };
for (const m of ['now', ...MAPS]) for (const g of ['KO', 'KOT']) sel(m, g);
// 12. 湾岸の候補地ごと
p('\n## 12. 湾岸の候補地ごとの利益（KO、seed 6。★＝上位30%）\n');
for (const m of ['now', ...MAPS]) for (const sp of ['s79', 's214']) { const k = m === 'now' ? `A_KO_${sp}` : `H_${m}_KO_${sp}`; const s3 = S3[k]; if (!s3) continue;
  p(`- ${m === 'now' ? '今の地図' : m}・${sp}：` + s3.wSites.map((w) => `${w.town} ${w.op}万${w.top ? '★' : ''}`).join('｜') + `（上位30%の線 ${s3.topLine}万）`); }
p('\n## 13. 工場の候補地ごと（KO・今の地図・7.9 と 2.14。利益/売れた客/昼の需要/夜の需要）\n');
for (const sp of ['s79', 's214']) { const a = site[`A_KO_${sp}`]; if (a) p(`- ${sp}：` + a.join('｜')); }
