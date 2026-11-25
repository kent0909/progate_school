// 出力 out/K*.txt の SUMMARY と「工場の候補地ごと」の行から、組×段の比の表を作る（PLAN.md 3章の線は台本の中。ここは並べるだけ）。
// 壊れの比べ：同じ段の比・同じ SEEDOFF の K0 で○の検査が、その組で×なら「壊れた」。K0 で×のものは「元から外れ」。
const fs = require('fs'), path = require('path'); const O = path.join(__dirname, 'out');
const files = fs.readdirSync(O).filter((f) => /^K.*\.txt$/.test(f));
const S = {}, site = {};
for (const f of files) { const t = fs.readFileSync(path.join(O, f), 'utf8'); const m = t.match(/^SUMMARY (.*)$/m); if (!m) continue; S[f.replace('.txt', '')] = JSON.parse(m[1]);
  const l = t.match(/^工場の候補地ごと.*?：(.*)$/m); if (l) site[f.replace('.txt', '')] = l[1].split('｜'); }
const groups = ['K0', 'K1', 'K1hi', 'K2', 'K3', 'K5', 'K6', 'K7', 'K7hi', 'K1R4', 'K1R3', 'K1R2'], spans = ['s79', 's45', 's214', 's79_so18'];
const kNames = ['⑪k', 'H1', 'H2', 'H3'];
const rows = []; const verdict = {};
console.log('| 組 | 段の比・seed | 工場 上位30% | 湾岸・物流 | 住工混在 | 事務所街 | 営業時間も選ぶ（うち湾岸） | 工場の利益の中央（万円） | 全体の中央 | H2（工場だけ／湾岸だけ／湾岸・昼だけ） | 工場の判定 | 壊れた検査 | 元から外れ（K0 で×） | P_ref |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const g of groups) for (const sp of spans) {
  const k = `${g}_${sp}`, s = S[k], b = S[`K0_${sp}`]; if (!s || !b) { console.log(`| ${g} | ${sp} | （出力なし） |`); continue; }
  const K = s.kojo, KB = b.kojo.passB; const by = (t) => (K.kBy[t] ? `${K.kBy[t].top}/${K.kBy[t].n}（${K.kBy[t].med}万）` : '—');
  const broken = Object.keys(K.passB).filter((c) => KB[c] && !K.passB[c]); const pre = Object.keys(KB).filter((c) => !KB[c]);
  const kp = kNames.map((n) => `${n}${K.kpass[n] ? '○' : '×'}`).join(' ');
  verdict[k] = { kAll: kNames.every((n) => K.kpass[n]), broken };
  console.log(`| ${g} | ${sp} | ${K.kTop}/25 | ${by('wangan')} | ${by('mix')} | ${by('office')} | ${K.kTopBest}（${K.kTopBestW}） | ${K.kMed} | ${K.allMed} | ${Object.values(K.H2).join('／')}% | ${kp} | ${broken.join('・') || 'なし'} | ${pre.join('・') || 'なし'} | ${s.Pref} |`);
}
console.log('\n## 選ぶ規則（PLAN.md 5章）の当てはめ');
for (const g of groups) { if (g === 'K0') continue; const ok = spans.map((sp) => { const v = verdict[`${g}_${sp}`]; return v ? v.kAll && !v.broken.length : null; });
  console.log(`- ${g}：` + spans.map((sp, i) => `${sp} ${ok[i] == null ? '—' : ok[i] ? '通る' : '外れ'}`).join('・') + `→ ${ok.every((x) => x) ? '候補' : ok.some((x) => x) ? '段の比しだい' : '候補でない'}`); }
console.log('\n## 工場の候補地ごと（段の比 7.9・SEEDOFF 6。利益の平均/売れた客/昼の需要/夜の需要、★＝上位30%）');
for (const g of ['K0', 'K1', 'K1hi', 'K3', 'K7', 'K7hi']) { const a = site[`${g}_s79`]; if (!a) continue; console.log(`- ${g}：` + a.filter((x) => /wangan|office/.test(x) || /★/.test(x)).join('｜')); }
