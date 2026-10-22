#!/usr/bin/env node
// BIZ-RAMEN 第2版の論証の検査（docs/audit/BIZ-RAMEN-v2-reasoning.md）で使った検算。
// Usage: node boki2/docs/analysis/ramen-v2-reasoning-recheck.js
// 数字はすべて原文（boki2/research/raw/web/ramen/ の各資料）から書き写した。どの資料のどこかは各節の頭に書いた。
// 【検査役の仮定】と書いた数は資料にない仮置き。仮定を変えて走らせ直せるよう、変数にまとめてある。
// 最後に、検査書の表（7章）の判定の列を数える。
'use strict';
const fs = require('fs');
const path = require('path');
const r1 = (x) => Math.round(x * 10) / 10;
const r0 = (x) => Math.round(x);

// ---------- 1. 季節（家計調査・二人以上の世帯の中華そば（外食）。GD Freak! の表 r5-rmn-gdfreak-chukasoba1） ----------
const months = { // 円。2023, 2024, 2025（2025年12月は表にない）
  1: [665, 731, 772], 2: [553, 646, 691], 3: [637, 738, 840], 4: [603, 646, 760], 5: [702, 725, 836], 6: [594, 673, 721],
  7: [649, 704, 730], 8: [757, 877, 1027], 9: [650, 713, 811], 10: [686, 742, 834], 11: [727, 751, 891], 12: [657, 717, null],
};
const days = { 1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31 }; // 2024年2月は29日だが平年で置く
console.log('## 1. 季節の指数の検算（家計調査 二人以上の世帯 中華そば（外食））');
const yAvg = (i) => Object.values(months).reduce((s, v) => s + v[i], 0) / 12;
const a23 = yAvg(0), a24 = yAvg(1);
const idxA = {}; // 報告と同じ作り方（各年平均=100、2年平均）
for (const m of Object.keys(months)) idxA[m] = ((months[m][0] / a23 + months[m][1] / a24) / 2) * 100;
// (B) 1日あたりに直す（月の日数の差を除く）
const idxB = {};
{
  const perDay = (i) => Object.keys(months).map((m) => months[m][i] / days[m]);
  const pd23 = perDay(0), pd24 = perDay(1);
  const av = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const A23 = av(pd23), A24 = av(pd24);
  Object.keys(months).forEach((m, k) => { idxB[m] = ((pd23[k] / A23 + pd24[k] / A24) / 2) * 100; });
}
// (C) 趨勢を除く：中心化12か月移動平均（2×12）に対する比。2023年7月〜2025年5月で計算できる月だけ
const series = [];
for (const y of [0, 1, 2]) for (let m = 1; m <= 12; m++) if (months[m][y] != null) series.push({ y: 2023 + y, m, v: months[m][y] });
const ratios = {};
for (let t = 6; t < series.length - 6; t++) {
  let s = 0.5 * series[t - 6].v + 0.5 * series[t + 6].v;
  for (let k = -5; k <= 5; k++) s += series[t + k].v;
  const cma = s / 12;
  (ratios[series[t].m] = ratios[series[t].m] || []).push(series[t].v / cma);
}
const idxC = {};
{
  const raw = {};
  for (const m of Object.keys(ratios)) raw[m] = ratios[m].reduce((s, x) => s + x, 0) / ratios[m].length;
  const mean = Object.values(raw).reduce((s, x) => s + x, 0) / Object.keys(raw).length;
  for (const m of Object.keys(raw)) idxC[m] = raw[m] / mean * 100;
}
console.log('| 月 | (A)報告の作り方 | (B)1日あたり | (C)趨勢を除く(2×12移動平均比) | (C)の標本の数 |');
console.log('|---|---|---|---|---|');
for (let m = 1; m <= 12; m++) console.log(`| ${m} | ${r0(idxA[m])} | ${r0(idxB[m])} | ${idxC[m] ? r0(idxC[m]) : '—'} | ${ratios[m] ? ratios[m].length : 0} |`);
console.log(`7月→8月の差：(A) ${r0(idxA[7])}→${r0(idxA[8])}、(C) ${r0(idxC[7])}→${r0(idxC[8])}。暑さが主因なら暑い7月も同じ向きに動くはず【検査役の推論】`);
console.log(`8月の山の大きさ（8月÷7月）：2023年 ${r1(757 / 649 * 100 - 100)}%、2024年 ${r1(877 / 704 * 100 - 100)}%、2025年 ${r1(1027 / 730 * 100 - 100)}%`);
const peakMonths = (idx) => Object.keys(idx).sort((a, b) => idx[b] - idx[a]).slice(0, 3).join('・');
console.log(`上位3か月：(A) ${peakMonths(idxA)}、(B) ${peakMonths(idxB)}、(C) ${peakMonths(idxC)}`);
console.log(`谷（下位3か月）：(A) ${Object.keys(idxA).sort((a, b) => idxA[a] - idxA[b]).slice(0, 3).join('・')}、(B) ${Object.keys(idxB).sort((a, b) => idxB[a] - idxB[b]).slice(0, 3).join('・')}`);
console.log(`年の伸び（同じ月の前年比の平均）：2024/2023 ${r1((a24 / a23 - 1) * 100)}%。年内の趨勢は12月を押し上げ1月を押し下げる向きに効く`);

// ---------- 2. 値上げと客数（山岡家 r4-ramen-yamaokaya-setsumei2603 の12ページの表、幸楽苑 r4-ramen-kourakuen-setsumei2511） ----------
console.log('\n## 2. 値上げと客数');
const yk = { // 2026年1月期の月別の既存店前年比（%）。2月〜翌1月
  sales: [119.4, 124.1, 126.9, 129.6, 118.6, 117.6, 121.0, 112.4, 116.5, 115.7, 115.1, 116.7],
  cust: [117.1, 120.9, 122.7, 124.2, 114.4, 114.9, 117.8, 109.6, 112.2, 112.8, 112.3, 113.3],
  price: [101.9, 102.7, 103.5, 104.3, 103.7, 102.4, 102.7, 102.6, 103.8, 102.6, 102.5, 103.0],
};
const pear = (x, y) => { const n = x.length, mx = x.reduce((s, v) => s + v, 0) / n, my = y.reduce((s, v) => s + v, 0) / n; let a = 0, b = 0, c = 0; for (let i = 0; i < n; i++) { a += (x[i] - mx) * (y[i] - my); b += (x[i] - mx) ** 2; c += (y[i] - my) ** 2; } return a / Math.sqrt(b * c); };
console.log(`山岡家：年間の客単価の前年比 102.9%（4月・10月の2回の改定を含む）。会社は「最小限の値上げ」と書く。月別の客単価の伸びと客数の伸びの相関 r = ${pear(yk.price, yk.cust).toFixed(2)}（12か月。値上げで客が減る向きの相関は出ない。ただし前年の水準・新店・動画などが混ざり、値上げの効果だけは取り出せない）`);
console.log(`山岡家：月別の客単価の伸びの幅 ${Math.min(...yk.price)}〜${Math.max(...yk.price)}%。「値上げしても客が増える」の実験は、1回あたり数%の小幅の値上げの範囲でしか起きていない`);
console.log('幸楽苑：2026年3月期上期 既存店 客数109.8%・客単価100.5%。客単価の前年比が100%前後に戻っても、値段の水準は前年の高さのまま（前年比は水準ではない）');
console.log('4社の結果の物差し：山岡家＝既存店客数（月次）、幸楽苑＝12か月移動平均の客数・客単価の前年比（グラフ）、一風堂＝連結営業利益率、ギフト＝国内直営の既存店売上高。共通の物差しはない');

// ---------- 3. 製麺機の回収（r5-rmn-maker-taisei、r5-rmn-pres-tenichi2、r5-rmn-cost-canaeru） ----------
console.log('\n## 3. 製麺機の回収年数（人の時間を入れる）');
const machines = [1688000, 2475000];
const DAYS = 300; // 報告と同じ
const wage = [1100, 1300]; // 【検査役の仮定】時給
const hours = [0.5, 1, 2]; // 【検査役の仮定】1日の製麺・掃除の時間
const saving = [30, 50]; // 30＝メーカーの主張。50＝報告6章の麺60円−小麦代約10円の差から見た上限【検査役の仮定】
console.log(`メーカーの「年間最大90万円」÷「1玉約30円」＝ ${900000 / 30} 玉/年 ＝ 1日 ${r0(900000 / 30 / DAYS)} 玉（300日）。30円は「最大」側の値`);
console.log('| 1日の玉数 | 1玉の差 | 製麺の時間/日 | 時給 | 年の差し引き(円) | 回収年数 168.8万 | 回収年数 247.5万 |');
console.log('|---|---|---|---|---|---|---|');
for (const d of [40, 100, 200]) for (const s of saving) for (const h of [0, ...hours]) for (const w of (h === 0 ? [0] : wage)) {
  const net = s * d * DAYS - h * w * DAYS;
  const yrs = machines.map((p) => (net > 0 ? r1(p / net) : '回収しない'));
  console.log(`| ${d} | ${s} | ${h} | ${w} | ${net.toLocaleString()} | ${yrs[0]} | ${yrs[1]} |`);
}

// ---------- 4. 町中華と二郎系（r5-rmn-pres-ishido-p5、r5-rmn-paper-sophia2010、r5-rmn-cost-canaeru） ----------
console.log('\n## 4. 1人あたりと1日あたり（石動龍の仮定の計算を1日に広げる）');
const jiro = 1000 * (1 - 0.40), koukyu = 1500 * (1 - 0.40), machi = 700 * (1 - 0.30) + 2800 * (1 - 0.20);
console.log(`1人あたりの限界利益：二郎系 ${jiro}・高級 ${koukyu}・町中華 ${machi} 円（町中華は1人が酒とつまみを2,800円頼む仮定。比 ${r1(machi / jiro)} 倍）`);
const cap = 15 * (60 / 20) * 8;
for (const occ of [1.0, 0.75]) console.log(`二郎系の1日：上限 ${cap} 人 × 稼働 ${occ * 100}%（USEN「席の稼働率は75％程度が限界」）＝ ${cap * occ} 人 → ${(cap * occ * jiro).toLocaleString()} 円/日。町中華が同じ額に届く客数 ${r0(cap * occ * jiro / machi)} 人/日`);
for (const share of [1.0, 0.5, 0.2]) { const m = 700 * 0.7 + share * 2800 * 0.8; console.log(`町中華で酒を頼む客の割合 ${share * 100}%【検査役の仮定】→ 1人あたり ${m} 円（二郎系の ${r1(m / jiro)} 倍）`); }

// ---------- 5. 例え話の時間の並び（r5-rmn-pres-ishido1-p2〜p4） ----------
console.log('\n## 5. 例え話（大森の大盛）の時間の並び');
const t1 = 0; const t2decide = t1 + 3; const t2open = t2decide + 3; const t3decide = t2open + 3; const t3open = t3decide + 3;
console.log(`1軒目の開店 ${t1}か月 → 2軒目の決意 ${t2decide} → 2軒目の開店 ${t2open} → 3軒目の決意 ${t3decide} → 3軒目の開店 ${t3open} → 1軒目の閉店 ${t3open}+24 = ${t3open + 24}か月（「それから2年後」を3軒目の開店からと読む）`);
console.log(`後発の開店の間隔は ${t2open - t1}か月・${t3open - t2open}か月（報告の「3か月ごと」ではない）。杯数は 200 → 200+130+100 = ${200 + 130 + 100}（後発の出店で地区の合計の杯数は ${r1((430 / 200 - 1) * 100)}% 増えている）`);

// ---------- 6. 立川（r5-rmn-paper-tachikawa-b） ----------
console.log('\n## 6. 立川駅周辺の入れ替わり');
console.log(`集合施設の出店 ラーメンスクエア67 + たま館22 = ${67 + 22} 店 / 存在した142店 = ${r1(89 / 142 * 100)}%。路面店などは ${142 - 89} 店（2005〜2020年）。論文は開閉店の多さを「定期的に店舗を入れ替える」施設に帰している`);

// ---------- 7. 事例の数え直し（報告7章の表） ----------
console.log('\n## 7. 事例（報告7章）の数え直し');
// [id, 報告の成否, 会社・店, 検査役の区分]
// 検査役の区分：clean＝原文から失敗/成功と言える、mixed＝報告自身が混在・推定・失敗→成功と書く、slice＝伸びている会社の一部の切り取り、
// notramen＝ラーメン店に限らない、noresult＝結果が書かれていない、weakcause＝結果はあるが原因の帰属が原文にない
const cases = [
  ['F1', '失敗', '山岡家', 'clean'], ['F2', '失敗', '幸楽苑', 'clean'], ['F3', '失敗', '幸楽苑', 'clean'], ['F4', '失敗', '幸楽苑', 'weakcause'],
  ['F5', '失敗', '一風堂', 'slice'], ['F6', '失敗', '一風堂', 'mixed'], ['F7', '失敗', 'ギフト', 'slice'], ['F8', '失敗', '福岡の公募屋台', 'notramen'],
  ['F9', '失敗', 'どさん子', 'clean'], ['F10', '失敗', 'どさん子', 'clean'], ['F11', '失敗', 'どさん子', 'clean'], ['F12', '失敗', 'なんでんかんでん', 'clean'],
  ['F13', '失敗', 'なんでんかんでん', 'clean'], ['F14', '失敗', 'ドラゴンラーメン', 'weakcause'], ['F15', '失敗', 'METRO RAMEN', 'clean'], ['F16', '失敗', '静岡の店', 'mixed'],
  ['F17', '失敗', '仙台の店', 'clean'], ['F18', '失敗', '立川の店主', 'mixed'],
  ['S1', '成功', '山岡家', 'weakcause'], ['S2', '成功', 'ギフト', 'clean'], ['S3', '成功', '幸楽苑', 'clean'], ['S4', '成功', 'どさん子', 'clean'],
  ['S5', '成功', '二郎', 'clean'], ['S6', '成功', 'なんでんかんでん', 'clean'], ['S7', '成功', 'さなだ', 'clean'], ['S8', '成功', '博多一双', 'clean'],
  ['S9', '成功', '宅麺', 'clean'], ['S10', '成功', '天下一品', 'noresult'],
];
const cnt = (arr, f) => arr.filter(f).length;
const F = cases.filter((c) => c[1] === '失敗'), S = cases.filter((c) => c[1] === '成功');
console.log(`報告の数：失敗 ${F.length}・成功 ${S.length}`);
console.log(`会社・店の数：失敗側 ${new Set(F.map((c) => c[2])).size}・成功側 ${new Set(S.map((c) => c[2])).size}・両方に出る ${[...new Set(F.map((c) => c[2]))].filter((n) => S.some((s) => s[2] === n)).length}`);
for (const k of ['clean', 'weakcause', 'slice', 'mixed', 'notramen', 'noresult']) console.log(`- ${k}: 失敗 ${cnt(F, (c) => c[3] === k)}・成功 ${cnt(S, (c) => c[3] === k)}`);
console.log(`原文から言える（clean）だけ：失敗 ${cnt(F, (c) => c[3] === 'clean')}・成功 ${cnt(S, (c) => c[3] === 'clean')}`);

// ---------- 8. 利用者の声（報告11章の表） ----------
console.log('\n## 8. 声の「3分」');
const three = 9 + 10 + 10, total = 79;
console.log(`あっさり9＋こってり10＋育ち10 = ${three} / ${total} = ${r1(three / total * 100)}%。14分類のうちの3つ。マイナビの質問は好きな種類ごとの理由（しょうゆ・みそ・とんこつ・塩…）なので、あっさり・こってりは種類の聞き方から出やすい`);
console.log('こってりの拒否の声：苦手4件のうち2件（自由回答）。マルハニチロの1,000人：こってり20.3%・ふつう48.3%・あっさり31.4%（いちばん多いのは「ふつう」）');

// ---------- 9. 地域で変わる損益分岐（石動龍 r5-rmn-pres-ishido-tsuburenikui の仮定 ＋ 家賃だけを動かす） ----------
console.log('\n## 9. 家賃だけを動かしたときの1日の損益分岐の杯数（石動龍の仮定：1杯1,000円・原価30%・アルバイト月10万・25日営業）');
const price = 1000, cogs = 0.30, partTime = 100000, daysM = 25;
const otherFixed = 350000; // 【検査役の仮定】石動龍の「光熱水道費、家賃、その他の経費が合計で40万円」のうち家賃を5万と置いた残り
const contrib = price * (1 - cogs);
console.log('| 月の家賃 | 店主の取り分 0 の分岐 | 店主の取り分 月30万の分岐 |');
console.log('|---|---|---|');
for (const rent of [50000, 150000, 275000, 600000]) {
  const be0 = (partTime + otherFixed + rent) / (contrib * daysM);
  const be30 = (partTime + otherFixed + rent + 300000) / (contrib * daysM);
  console.log(`| ${rent.toLocaleString()} | ${r1(be0)} 杯/日 | ${r1(be30)} 杯/日 |`);
}
console.log('（家賃27.5万＝東京9エリアの飲食店可の募集賃料の中央値 27,500円/坪（r5-cal-athome-kashitenpo24h1）×10坪。60万は都心の一等地の仮置き【検査役の仮定】。光熱費・人件費も地域で違うが動かしていない）');

// ---------- 10. のれん分けの速さ（r5-rmn-paper-sophia2010、r5-rmn-pres-ishido-tsuburenikui-p3、r5-rmn-itm-dosanko1、r4-ramen-chikara-tanshin2026） ----------
console.log('\n## 10. 成長の速さ（のれん分け・FC・直営）');
console.log(`二郎：のれん分け開始1995年→2010年に直系35店 ＝ 年 ${r1(34 / 15)} 店。2010→2024年 35→約40店 ＝ 年 ${r1(5 / 14)} 店（同じ型で速さが10倍変わる）`);
console.log(`どさん子（FC）：1967→1971年 1→500店 ＝ 年 ${r0(499 / 4)} 店、→1977年 1000店`);
console.log(`ギフト（直営）：2025年10月期 直営 227→279店（+${r1((279 / 227 - 1) * 100)}%/年）で営業利益率9.4%。山岡家 2010→2012年 102→137店（2年で+34.3%、年 +${r1((Math.sqrt(137 / 102) - 1) * 100)}%）で0.2%`);
console.log('一風堂：暖簾分け制度を会社自身が「（フランチャイズモデル）」と書き、ロイヤリティを受け取る');

// ---------- 11. 検査書の判定の数 ----------
const audit = path.join(__dirname, '..', 'audit', 'BIZ-RAMEN-v2-reasoning.md');
if (fs.existsSync(audit)) {
  const lines = fs.readFileSync(audit, 'utf8').split('\n');
  const rows = lines.filter((l) => /^\| R\d+[a-z]? \|/.test(l));
  const tally = { 妥当: [], 弱い: [], 不当: [] };
  for (const l of rows) {
    const cols = l.split('|').map((s) => s.trim());
    const id = cols[1], verdict = cols[cols.length - 3];
    if (tally[verdict]) tally[verdict].push(id); else console.log(`判定の読めない行: ${id} → ${verdict}`);
  }
  console.log('\n## 11. 検査書の判定の数（表の「判定」の列を数えた）');
  console.log(`結論の行 ${rows.length}`);
  for (const [k, v] of Object.entries(tally)) console.log(`- ${k}: ${v.length}（${v.join('・')}）`);
}
