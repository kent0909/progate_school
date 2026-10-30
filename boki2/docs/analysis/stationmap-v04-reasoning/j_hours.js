// 4.5 営業時間の毎月の設定：昼の重み L（属性）と上限の分け方（昼0.45・夜0.55）で、3つの選び方の月の損得が属性で分かれるかを、i_all.js の3年目の需要/日（くじごと）に当てる。
// 静的な近似：3年目の需要 D（新規＋常連）を昼 D·L・夜 D·(1−L) に分ける（設計書は常連も分けるとする）。昼だけ・夜だけで常連が減っていく動きは入れない（昼だけ・夜だけに有利な向きの近似）。
// 1客の限界の残り＝850×1.12×(1−0.35−0.04)。昼だけ：夜の分の人件費 −40%（パート20万の40%）・ガス代 −35%（光熱の固定5万の35%と置いた）。夜だけも同じ大きさ。
const fs = require('fs'); const file = process.argv[2] || 'out/sites_v1.json'; const S = JSON.parse(fs.readFileSync(file));
const Lw = { office: 0.75, kojo: 0.85, shogyo: 0.55, shoten: 0.5, jutaku: 0.35, hanka: 0.3 };
const m = 850 * 1.12 * (1 - 0.35 - 0.04), days = 26, save = 200000 * 0.4 + 50000 * 0.35, capT = 70;
const capL = 0.45 * capT, capN = 0.55 * capT;
const rows = []; for (const s of S) for (const D of s.dems) {
  const L = Lw[s.type], dl = D * L, dn = D * (1 - L);
  const thru = (Math.min(dl, capL) + Math.min(dn, capN)) * days * m; // 上限を分けた通し
  const thru0 = Math.min(D, capT) * days * m; // 上限を分けない通し（いまの式）
  const lunch = Math.min(dl, capL) * days * m + save, night = Math.min(dn, capN) * days * m + save;
  rows.push({ type: s.type, D, L, best: lunch > thru && lunch >= night ? 'lunch' : night > thru ? 'night' : 'thru', dLunch: lunch - thru, dNight: night - thru, splitLoss: thru0 - thru });
}
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
console.log(`file ${file}  1客の残り ${m.toFixed(0)}円・昼だけ/夜だけで減る費用 ${save}円/月・昼だけが得になる夜の客の境 ${(save / days / m).toFixed(2)}人/日`);
for (const t of Object.keys(Lw)) { const a = rows.filter((r) => r.type === t); if (!a.length) continue; const c = (k) => (100 * a.filter((r) => r.best === k).length / a.length).toFixed(0);
  console.log(`${t} L=${Lw[t]} くじ${a.length}：需要/日の中央 ${q(a.map(r=>r.D),0.5).toFixed(1)}｜いちばん得：昼だけ ${c('lunch')}%・夜だけ ${c('night')}%・通し ${c('thru')}%｜昼だけ−通し の中央 ${(q(a.map(r=>r.dLunch),0.5)/1e4).toFixed(1)}万円/月・夜だけ−通し の中央 ${(q(a.map(r=>r.dNight),0.5)/1e4).toFixed(1)}万円/月｜上限を分けたことで通しが失う客の中央 ${(q(a.map(r=>r.splitLoss),0.5)/1e4).toFixed(1)}万円/月`); }
console.log(`検査の基準：オフィスで昼だけ>通し が20%以上 → ${(100*rows.filter(r=>r.type==='office'&&r.dLunch>0).length/rows.filter(r=>r.type==='office').length).toFixed(0)}%、繁華街で夜だけ>通し が20%以上 → ${(100*rows.filter(r=>r.type==='hanka'&&r.dNight>0).length/rows.filter(r=>r.type==='hanka').length).toFixed(0)}%`);
// 境：オフィスで昼だけが得になる需要/日、繁華街で夜だけが得になる需要/日
console.log(`境の需要/日：オフィスで昼だけが得 D< ${(save/days/m/(1-Lw.office)).toFixed(1)}・繁華街で夜だけが得 D< ${(save/days/m/Lw.hanka).toFixed(1)}・住宅地で夜だけが得 D< ${(save/days/m/Lw.jutaku).toFixed(1)}`);
// どの置き値をどちらへ動かせば基準（各20%以上）を満たしうるか：①減る費用 save ②昼の重み L の両端
const need = (type, Lv, slot) => { const a = S.filter((s) => s.type === type).flatMap((s) => s.dems).map((D) => Math.min(slot === 'lunchOnly' ? D * (1 - Lv) : D * Lv, slot === 'lunchOnly' ? capN : capL) * days * m); return q(a, 0.2); };
console.log(`満たすのに要る「片方を閉めて減る費用」：オフィス(L=0.75)で ${(need('office', 0.75, 'lunchOnly') / 1e4).toFixed(1)}万円/月以上・繁華街(L=0.3)で ${(need('hanka', 0.3, 'nightOnly') / 1e4).toFixed(1)}万円/月以上（いまの置き値 ${(save / 1e4).toFixed(2)}万円）`);
for (const Lo of [0.85, 0.9, 0.95]) console.log(`  L を動かすと：オフィス L=${Lo} で要る費用 ${(need('office', Lo, 'lunchOnly') / 1e4).toFixed(1)}万円/月`);
for (const Lh of [0.2, 0.15, 0.1]) console.log(`  繁華街 L=${Lh} で要る費用 ${(need('hanka', Lh, 'nightOnly') / 1e4).toFixed(1)}万円/月`);
