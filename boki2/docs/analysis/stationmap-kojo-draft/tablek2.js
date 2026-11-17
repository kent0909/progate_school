// out2/ の SUMMARY から表を作る（PLAN.md 7章。線・規則の式は PLAN.md 7.3・7.4 を写した。数を並べ、規則を機械で当てる）。
// 使い方：node tablek2.js > out2/table2.md
const fs = require('fs'), path = require('path'); const O = path.join(__dirname, 'out2'), O1 = path.join(__dirname, 'out');
const S = {}, site = {};
const load = (dir, pre) => { for (const f of fs.readdirSync(dir).filter((f) => /\.txt$/.test(f))) { const t = fs.readFileSync(path.join(dir, f), 'utf8'); const m = t.match(/^SUMMARY (.*)$/m); if (!m) continue; const k = pre + f.replace('.txt', ''); S[k] = JSON.parse(m[1]); const l = t.match(/^工場の候補地ごと.*?：(.*)$/m); if (l) site[k] = l[1].split('｜'); } };
load(O, ''); load(O1, 'old:');
const kN = ['⑪k', 'H1', 'H2', 'H3'];
const t1 = (s) => s.c12a['1'];
const kp = (s) => kN.every((n) => s.kojo.kpass[n]);
const brokenNo12a = (s, b) => Object.keys(s.kojo.passB).filter((c) => c !== '⑫a' && b.kojo.passB[c] && !s.kojo.passB[c]);
const by = (s, t) => (s.kojo.kBy[t] ? `${s.kojo.kBy[t].top}/${s.kojo.kBy[t].n}（${s.kojo.kBy[t].med}万）` : '—');
const spans = ['s214', 's45', 's65', 's79'], groups = ['K0', 'K1hi', 'K123a', 'K123m', 'K123h', 'K7', 'K7m', 'K7mT'];
const name = { K0: 'K0 基準', K1hi: 'K1hi（K1 だけ・m_C 2.54）', K123a: 'K1＋K2＋K3（m_C 1.59）', K123m: 'K1＋K2＋K3（m_C 1.93）', K123h: 'K1＋K2＋K3（m_C 2.54、比べ）', K7: 'K7（m_C 1.59）', K7m: 'K7m＝新しい K7hi（m_C 1.93）', K7mT: 'K7m で T を掛けない' };
const p = (x) => console.log(x);
p('# out2/ の表（day＝1 で埋める・K12。正本ではない。tablek2.js が SUMMARY から作った）\n');
p('## 1. 組×段の比（SEEDOFF 6）');
p('| 組 | 段の比 | 工場の上位30% | 湾岸・物流 | 住工混在 | 事務所街 | 営業時間も選ぶ（湾岸） | 工場の利益の中央（万円） | 全体の中央 | H2（工場だけ／湾岸だけ／湾岸・昼だけ） | 工場の判定 | ⑫a のほかで壊れた検査 | ⑫a 段1 | K0 で× | P_ref |');
p('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const g of groups) for (const sp of spans) { const s = S[`A_${g}_${sp}`], b = S[`A_K0_${sp}`]; if (!s || !b) { p(`| ${name[g]} | ${sp} | （出力なし） |`); continue; }
  const pre = Object.keys(b.kojo.passB).filter((c) => !b.kojo.passB[c]);
  p(`| ${name[g]} | ${sp} | ${s.kojo.kTop}/25 | ${by(s, 'wangan')} | ${by(s, 'mix')} | ${by(s, 'office')} | ${s.kojo.kTopBest}（${s.kojo.kTopBestW}） | ${s.kojo.kMed} | ${s.kojo.allMed} | ${Object.values(s.kojo.H2).join('／')}% | ${kN.map((n) => n + (s.kojo.kpass[n] ? '○' : '×')).join(' ')} | ${brokenNo12a(s, b).join('・') || 'なし'} | ${t1(s)} | ${pre.join('・') || 'なし'} | ${s.Pref} |`); }
// seed の表（7.9）
p('\n## 2. 段の比 7.9 の5つの seed（6・18・30・42・54）');
const seeds = ['6', '18', '30', '42', '54'];
const key = (g, so) => (so === '6' ? `A_${g}_s79` : `B_${g}_s79_so${so}`);
p('| 組 | seed | 工場の上位30% | 湾岸 | 工場の判定 | ⑫a 段1 | ⑫a | ⑫a のほかで壊れた（同じ seed の K0 と対で） |');
p('|---|---|---|---|---|---|---|---|');
const verdict12 = {};
for (const g of ['K0', 'K7', 'K7m']) for (const so of seeds) { const s = S[key(g, so)], b = S[key('K0', so)]; if (!s) { p(`| ${g} | ${so} | （出力なし） |`); continue; }
  p(`| ${name[g]} | ${so} | ${s.kojo.kTop}/25 | ${by(s, 'wangan')} | ${kN.map((n) => n + (s.kojo.kpass[n] ? '○' : '×')).join(' ')} | ${t1(s)} | ${s.kojo.passB['⑫a'] ? '○' : '×'} | ${brokenNo12a(s, b).join('・') || 'なし'} |`); }
const Sset = seeds.filter((so) => S[key('K0', so)] && S[key('K0', so)].kojo.passB['⑫a']);
p(`\n- 7.3 の当てはめ：K0 で⑫a が○の seed ＝ {${Sset.join('・')}}（${Sset.length}/5）。` + (Sset.length <= 2 ? '**K0 が過半の seed で⑫a を外すので、段の比 7.9 の⑫a は「分けられない」（報告だけ）**。' : ''));
for (const g of ['K7', 'K7m']) { const f = Sset.filter((so) => S[key(g, so)] && !S[key(g, so)].kojo.passB['⑫a']).length;
  verdict12[g] = Sset.length <= 2 ? '分けられない' : f > Sset.length / 2 ? '壊す' : '壊さない';
  p(`- ${name[g]}：S のうち⑫a が× ${f}/${Sset.length} → ${verdict12[g]}`); }
// 選ぶ規則 7.4
p('\n## 3. 選ぶ規則（PLAN.md 7.4）の当てはめ');
for (const g of ['K1hi', 'K123a', 'K123m', 'K123h', 'K7', 'K7m', 'K7mT']) {
  const a = spans.map((sp) => { const s = S[`A_${g}_${sp}`], b = S[`A_K0_${sp}`]; return s && b ? { kp: kp(s), br: brokenNo12a(s, b) } : null; });
  const aOK = a.every((x) => x && x.kp && !x.br.length);
  let bTxt = '7.9 の5 seed は回していない（A の4列だけ）'; let bOK = null;
  if (['K7', 'K7m'].includes(g)) { const r = seeds.map((so) => { const s = S[key(g, so)], b = S[key('K0', so)]; return s && b ? { kp: kp(s), br: brokenNo12a(s, b).length > 0 } : null; });
    const nk = r.filter((x) => x && x.kp).length, nb = r.filter((x) => x && x.br).length; bOK = nk >= 3 && nb < 3 && verdict12[g] !== '壊す';
    bTxt = `7.9 の5 seed：工場の判定が全部○ ${nk}/5・⑫a のほかの壊れ ${nb}/5・⑫a ${verdict12[g]}`; }
  const all = aOK && bOK === true;
  p(`- ${name[g]}：4つの段の比（seed 6）：` + spans.map((sp, i) => `${sp} ${a[i] ? (a[i].kp && !a[i].br.length ? '○' : '×（' + [a[i].kp ? '' : '工場の線', a[i].br.join('・')].filter(Boolean).join('・') + '）') : '—'}`).join('・') + `｜${bTxt} → ${all ? '**候補**' : aOK || a.some((x) => x && x.kp && !x.br.length) ? '一部の列でだけ通る' : '通る列なし'}`); }
// C・D・E
p('\n## 4. 1つずつ抜いた組（K7m から、SEEDOFF 6）と、day の埋めの比べ');
p('| 組 | 段の比 | 工場の上位30% | 湾岸の利益の中央 | 工場の判定 | ⑫a 段1 |');
p('|---|---|---|---|---|---|');
for (const g of ['K7m', 'K7m_noK2', 'K7m_noK3', 'K7m_noK5', 'K7m_noK6']) for (const sp of ['s79', 's45']) { const s = S[g === 'K7m' ? `A_K7m_${sp}` : `C_${g}_${sp}`]; if (!s) continue;
  p(`| ${g} | ${sp} | ${s.kojo.kTop}/25 | ${s.kojo.kBy.wangan.med}万 | ${kN.map((n) => n + (s.kojo.kpass[n] ? '○' : '×')).join(' ')} | ${t1(s)} |`); }
for (const [k, nm] of [['D_K7m_median_s79', 'K7m・day を中央値で埋める（比べ）'], ['old:K7hi_s79', '前の K7hi（m_C 2.54・中央値で埋める、out/）'], ['E_repro_I_K7hi_daynull1', '前の K7hi を day＝1 で（論証の検査役の I_K7hi_daynull1 と同じコマンド）']]) { const s = S[k]; if (!s) continue;
  p(`| ${nm} | s79 | ${s.kojo.kTop}/25 | ${s.kojo.kBy.wangan.med}万 | ${kN.map((n) => n + (s.kojo.kpass[n] ? '○' : '×')).join(' ')} | ${t1(s)} |`); }
p('\n## 5. 工場の湾岸・物流の7か所（段の比 7.9・SEEDOFF 6。利益の平均/売れた客/昼の需要/夜の需要、★＝上位30%）');
for (const g of ['K1hi', 'K123m', 'K7', 'K7m', 'K7mT']) { const a = site[`A_${g}_s79`]; if (a) p(`- ${name[g]}：` + a.filter((x) => /wangan/.test(x)).join('｜')); }
const a2 = site['A_K7mT_s214']; if (a2) p(`- ${name.K7mT}（段の比 2.14）：` + a2.filter((x) => /wangan|★/.test(x)).join('｜'));
