// 縦の切り身（居抜きの1号店の1年目）の置き値の検算。DESIGN-RAMEN 0.2 の l章の表はこの出力から写す。
// 使い方：node boki2/docs/analysis/ramen-slice-numbers.js
// 置き値の出どころは DESIGN-RAMEN l.4 の表（CALIB・FILL-RAMEN・FILL-CALIB・BIZ-RAMEN の行）。ここでは計算だけをする。
const PRICE = 850;            // 1杯の値段（円）。小売物価の中央747円と「払える金額」857円の間（FILL-RAMEN 2.1）
const ITEMS = 1.12;           // 点数（トッピング・ギョウザ）。客単価 ≒ 952円 [CALIB M23 (b) 950〜1,050]
const COGS = 0.35;            // 原価率 [CALIB]（上場チェーンは30〜33%）
const DAYS = 26;              // 営業日 [CALIB M24 の仮置き (c)]
const UNIT = PRICE * ITEMS;   // 客単価
const GM = UNIT * (1 - COGS); // 1人あたりの粗利
// 店の形（人の厚さ）：月の人件費（円）。時給1,280円×6時間×26日 ≒ 20万円がパート1人の目安（令和8年度の最低賃金の上端）
const FORMS = {
  '家族で小さく（家族1人は無給・社長の報酬は利益から）': 0,
  'パート1人': 200000,
  'パート2人（昼夜の2回転）': 400000,
  '法人で厚く（パート3人＋社長の報酬20万）': 800000,
};
// 立地：月の家賃（10坪）。地方の商店街1.0万/坪は資料がない置き値 (c)。都心の商業地は at home の銀座 36,250円/坪（募集）
const SITES = {
  '地方の商店街（置き値 1.0万/坪）': 100000,
  '郊外の道沿い（置き値 0.8万/坪＋駐車場2万）': 100000,
  '県庁所在地の駅前（置き値 2.0万/坪）': 200000,
  '都心の商業地（銀座の募集 3.6万/坪）': 362500,
};
const OTHER_FIXED = [150000, 200000]; // その他固定費（通信・保険・消耗品・会計士・清掃）[FILL-CALIB：15/20万で奥多摩の黒字が入れ替わる]
const UTIL_FIXED = 50000, UTIL_VAR = 0.04;   // 光熱：固定5万＋売上の4%（光熱は固定費的 [CALIB M20 (b)] 6〜8%）
const DEP = 1500000 / 5 / 12;                // 居抜きの造作150万を中古の耐用年数5年で（月2.5万）
const LOAN = 7000000, RATE = 0.025, YEARS = 7; // 公庫700万・年2.5%（置き値）・7年返済。月の返済 ≒ 8.3万（元金）
const REPAY = LOAN / YEARS / 12, INTEREST = LOAN * RATE / 12;

function breakEven(form, rent, other) {
  const fixed = form + rent + other + UTIL_FIXED + DEP + INTEREST;   // 営業利益0の固定費
  const gmNet = GM - UNIT * UTIL_VAR;                                // 光熱の変動分を引いた1人の粗利
  const bowlsPL = fixed / gmNet / DAYS;                              // 1日に要る客数（損益）
  const bowlsCash = (fixed - DEP + REPAY) / gmNet / DAYS;            // 1日に要る客数（口座が減らない）
  return { bowlsPL, bowlsCash };
}

console.log('## 1日に要る客数（損益が0／口座が減らない）。行＝店の形、列＝立地。その他固定費15万');
const siteNames = Object.keys(SITES);
console.log(['店の形', ...siteNames].join(' | '));
for (const [fn, f] of Object.entries(FORMS)) {
  const row = siteNames.map((s) => { const b = breakEven(f, SITES[s], OTHER_FIXED[0]); return `${b.bowlsPL.toFixed(0)}／${b.bowlsCash.toFixed(0)}`; });
  console.log([fn, ...row].join(' | '));
}
console.log('\n## その他固定費を20万にしたとき（家族で小さく・地方の商店街）');
for (const o of OTHER_FIXED) { const b = breakEven(0, SITES[siteNames[0]], o); console.log(`その他固定費 ${o / 1e4}万：損益 ${b.bowlsPL.toFixed(1)}人／口座 ${b.bowlsCash.toFixed(1)}人`); }
console.log('\n## 立地の差を「1日に余計に要る杯数」で（店の形＝パート1人、地方の商店街との差）');
const base = breakEven(200000, SITES[siteNames[0]], OTHER_FIXED[0]).bowlsPL;
for (const s of siteNames) console.log(`${s}：+${(breakEven(200000, SITES[s], OTHER_FIXED[0]).bowlsPL - base).toFixed(0)} 杯/日`);

// 1年目の月ごと：客数は中央値44人/日 [CALIB M24 (b)] に、開業の年の0.67倍 [CALIB M22] を1〜12か月で 0.55→0.85 の坂で近づける（年の平均 ≒ 0.70）
console.log('\n## 1年目の月ごとの客数と営業利益（パート1人・地方の商店街・その他固定費15万）。8月は暦で×1.15、2月は×0.9（住宅・郊外の型）');
const CAL = { 4: 1, 5: 1.05, 6: 0.95, 7: 1, 8: 1.15, 9: 1, 10: 1, 11: 1, 12: 1.0, 1: 0.95, 2: 0.9, 3: 1 };
let cash = 3000000 + LOAN - 1500000 - 900000 - 600000; // 自己資金300万＋借入700万 − 造作150万 − 保証金6か月90万 − 器材・開業費60万
let cum = 0;
const months = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
months.forEach((m, i) => {
  const ramp = 0.55 + (0.85 - 0.55) * (i / 11);
  const perDay = 44 * ramp * CAL[m];
  const sales = perDay * DAYS * UNIT;
  const op = sales * (1 - COGS - UTIL_VAR) - (200000 + SITES[siteNames[0]] + OTHER_FIXED[0] + UTIL_FIXED + DEP) - INTEREST;
  cash += op + DEP - REPAY - (m === 5 && i > 0 ? 0 : 0);
  cum += op;
  console.log(`${m}月: 客数/日 ${perDay.toFixed(0)}  売上 ${(sales / 1e4).toFixed(0)}万  営業利益 ${(op / 1e4).toFixed(1)}万  口座 ${(cash / 1e4).toFixed(0)}万`);
});
console.log(`年の営業利益の合計 ${(cum / 1e4).toFixed(0)}万円。期末の口座 ${(cash / 1e4).toFixed(0)}万円、借入残 ${((LOAN - REPAY * 12) / 1e4).toFixed(0)}万円、ネットキャッシュ ${((cash - LOAN + REPAY * 12) / 1e4).toFixed(0)}万円`);
console.log(`（客単価 ${UNIT.toFixed(0)}円、1人の粗利 ${GM.toFixed(0)}円、月の返済 ${(REPAY / 1e4).toFixed(1)}万、月の利息 ${(INTEREST / 1e4).toFixed(2)}万）`);

// ---- 版0.3 で足した検算（遊ぶ人の目の確認 docs/audit/DESIGN-RAMEN-player-review.md を受けて） ----
// (1) 値段の弾力性 ε と最も良い値段。d.2 の値段の項 exp(−ε·ln(p/p_ref)) だけ（取り合い・入れ子・p_ref の動き・追随は入れない。向きを見るための数）。
//     常連 L は ε が半分。L の割合を年で変えて（1年目 15%・2年目 30%・3年目 45%）、最も良い値段が年で入れ替わるかを見る。
function bestPrice(epsNew, shareL, nBase, cap) {
  let best = null;
  for (let p = 500; p <= 1200; p += 10) {
    const r = p / PRICE;
    const n = Math.min(nBase * ((1 - shareL) * Math.pow(r, -epsNew) + shareL * Math.pow(r, -epsNew / 2)), cap);
    const sales = n * DAYS * p * ITEMS, cogs = n * DAYS * PRICE * COGS * ITEMS; // 1杯の原価は850円のときの額で動かさない
    const op = sales * (1 - UTIL_VAR) - cogs - (200000 + 100000 + 150000 + UTIL_FIXED + DEP) - INTEREST;
    if (!best || op > best.op) best = { p, n, op };
  }
  return best;
}
console.log('\n## ε（新規の客）× 常連の割合 → 最も良い値段（パート1人・地方の商店街・上限70人/日）。ラーナーの点 ε*＝1/(1−変動費率 0.39)＝' + (1 / (1 - COGS - UTIL_VAR)).toFixed(2));
console.log('ε(新規) | 1年目（L 15%・客31人/日） | 2年目（L 30%・44人/日） | 3年目（L 45%・55人/日）');
for (const eps of [1.25, 1.6, 1.9, 2.2, 2.5]) {
  const row = [[0.15, 44 * 0.70], [0.30, 44], [0.45, 55]].map(([L, n]) => { const b = bestPrice(eps, L, n, 70); return `${b.p}円・${b.n.toFixed(0)}人・${(b.op / 1e4).toFixed(1)}万`; });
  console.log([eps, ...row].join(' | '));
}
// (2) 家族で小さく：1人で回せる上限を昼の山で35人/日にしたとき、1年目の月ごとに上限を越える日の割合（週末の客は平日の1.6倍と置く：平日20日・週末6日で月平均が perDay）
console.log('\n## 家族で小さく（上限35人/日）：月の平均の客数と、週末（平日の1.6倍）が上限を越えるか');
months.forEach((m, i) => {
  const ramp = 0.55 + (0.85 - 0.55) * (i / 11);
  const perDay = 44 * ramp * CAL[m];
  const weekday = perDay * 26 / (20 + 6 * 1.6), weekend = weekday * 1.6;
  console.log(`${m}月: 平均 ${perDay.toFixed(0)}人/日、平日 ${weekday.toFixed(0)}、週末 ${weekend.toFixed(0)} → ${weekend > 35 ? '週末は上限を越える（待ち・体の札）' : '越えない'}`);
});
// (3) 一杯の魅力 F：話題の山（+0.15 が4か月で戻る）と13か月目からの減衰（段0 −0.75%/月、基準 −1.5%/月）の客数への効き（係数 0.30）
console.log('\n## 一杯の魅力 F の効き（0.30·ln F）');
for (const [name, F] of [['話題の山 +0.15', 1.15], ['当たりの山 +0.25', 1.25], ['外れの山 +0.05', 1.05], ['24か月放置（基準 −1.5%×12）', Math.pow(0.985, 12)], ['36か月放置（基準 ×24）', Math.pow(0.985, 24)], ['下限 0.6', 0.6]]) {
  console.log(`${name}：F ${F.toFixed(3)} → 客数 ${(100 * (Math.exp(0.30 * Math.log(F)) - 1)).toFixed(1)}%`);
}
console.log(`山（1.15）と3年放置（0.6）の差：${(100 * (Math.exp(0.30 * Math.log(1.15 / 0.6)) - 1)).toFixed(1)}%。相性の項 ◎ +0.10／△ −0.05 → 客数 ${(100 * (Math.exp(0.10) - 1)).toFixed(1)}%／${(100 * (Math.exp(-0.05) - 1)).toFixed(1)}%`);

// ---- 版0.4 で足した検算（オーナーの回答 n.16・n.17 を受けて） ----
// (4) 客層ごとの ε（学生2.3・勤め人2.0・家族1.8・観光1.7）に、個人ごとのランダムな傾き（±0.4 を3点：敏感・中・寛容 各1/3）を重ねたとき、最も良い値段が年で入れ替わるか（商店街の混ざり 勤め人30・家族60・学生10）
function bestPriceMix(mix, shareL, nBase, cap) {
  let best = null;
  for (let p = 500; p <= 1200; p += 10) {
    const r = p / PRICE; let n = 0;
    for (const [w, eps] of mix) for (const d of [-0.4, 0, 0.4]) n += nBase * (w / 3) * ((1 - shareL) * Math.pow(r, -(eps + d)) + shareL * Math.pow(r, -(eps + d) / 2));
    n = Math.min(n, cap);
    const sales = n * DAYS * p * ITEMS, cogs = n * DAYS * PRICE * COGS * ITEMS;
    const op = sales * (1 - UTIL_VAR) - cogs - (200000 + 100000 + 150000 + UTIL_FIXED + DEP) - INTEREST;
    if (!best || op > best.op) best = { p, n, op };
  }
  return best;
}
console.log('\n## 客層×個人の傾き（±0.4）を入れた最も良い値段。商店街（勤め人30・家族60・学生10）／駅前（勤め人50・家族30・観光20）／学生街（学生60・勤め人30・家族10）');
const MIX = { '商店街': [[0.3, 2.0], [0.6, 1.8], [0.1, 2.3]], '駅前': [[0.5, 2.0], [0.3, 1.8], [0.2, 1.7]], '学生街': [[0.6, 2.3], [0.3, 2.0], [0.1, 1.8]] };
for (const [name, mix] of Object.entries(MIX)) {
  const row = [[0.15, 44 * 0.70], [0.30, 44], [0.45, 55]].map(([L, n]) => { const b = bestPriceMix(mix, L, n, 70); return `${b.p}円・${b.n.toFixed(0)}人・${(b.op / 1e4).toFixed(1)}万`; });
  console.log([name, ...row].join(' | '));
}
// (5) 雇いすぎ：1年目の客数の坂（24→37人/日）のまま、パートを3人・4人雇ったときの年の営業利益と期末の口座（地方の商店街・その他固定費15万）
console.log('\n## 雇いすぎると倒産しうるか：1年目の坂のまま、パートの人数を変えたとき（開業時の口座700万）');
for (const [name, labor] of [['パート0（家族）', 0], ['パート1人', 200000], ['パート2人', 400000], ['パート3人', 600000], ['パート4人', 800000]]) {
  let c = 7000000, op12 = 0, first = null;
  months.forEach((m, i) => {
    const ramp = 0.55 + (0.85 - 0.55) * (i / 11); const perDay = 44 * ramp * CAL[m]; const sales = perDay * DAYS * UNIT;
    const op = sales * (1 - COGS - UTIL_VAR) - (labor + 100000 + 150000 + UTIL_FIXED + DEP) - INTEREST;
    c += op + DEP - REPAY; op12 += op; if (op > 0 && first == null) first = m;
  });
  console.log(`${name}：年の営業利益 ${(op12 / 1e4).toFixed(0)}万、期末の口座 ${(c / 1e4).toFixed(0)}万、初めての黒字の月 ${first ?? 'なし'}。この人件費で口座が尽きるまで ${(7000000 / Math.max(1, -(op12 / 12 + DEP - REPAY)) ).toFixed(0)} か月（1年目の平均の月で）`);
}

// ---- 版0.5 で足した検算（縦の切り身 段0〜4 の sim-check 300周とのずれを受けて） ----
// (6) 家族の働き手に給料を払う形（1年目から株式会社なので「給料」か「役員報酬」）：月12万【置き値】のとき、1日に要る客数と1年目の損益。
//     実装の置き値（家賃のフリーレント3か月・返済のすえおき3か月）も入れて、影の線（手を打たない店の初めての黒字の月）を出し直す
function year1(labor, { freeRent = 0, grace = 0, rent = 100000 } = {}) {
  let cash = 7000000, cum = 0, first = null, black = 0;
  months.forEach((m, i) => {
    const ramp = 0.55 + (0.85 - 0.55) * (i / 11), perDay = 44 * ramp * CAL[m], sales = perDay * DAYS * UNIT;
    const r = i < freeRent ? 0 : rent, rp = i < grace ? 0 : REPAY;
    const op = sales * (1 - COGS - UTIL_VAR) - (labor + r + OTHER_FIXED[0] + UTIL_FIXED + DEP) - INTEREST;
    cash += op + DEP - rp; cum += op; if (op > 0) { black++; if (first == null) first = m; }
  });
  return { cum, cash, first, black };
}
console.log('\n## 家族の働き手の対価を費用にしたとき（1年目・地方の商店街・手を打たない）');
for (const [name, labor] of [['家族1人・無給（版0.4 まで）', 0], ['家族1人・給料12万【置き値】', 120000], ['パート1人 20万', 200000]]) {
  const be = breakEven(labor, 100000, OTHER_FIXED[0]);
  const a = year1(labor), b = year1(labor, { freeRent: 3, grace: 3 });
  console.log(`${name}：1日に要る客数 損益 ${be.bowlsPL.toFixed(0)}／口座 ${be.bowlsCash.toFixed(0)}。1年目（設計の置き値）：営業利益 ${(a.cum / 1e4).toFixed(0)}万・黒字の月 ${a.black}・初めての黒字 ${a.first ?? 'なし'}月・期末口座 ${(a.cash / 1e4).toFixed(0)}万／（実装：フリーレント3・すえおき3）：営業利益 ${(b.cum / 1e4).toFixed(0)}万・黒字の月 ${b.black}・初めての黒字 ${b.first ?? 'なし'}月・期末口座 ${(b.cash / 1e4).toFixed(0)}万`);
}
// (7) 家族の店の伸びの壁：上限35人/日のとき、客数の坂が 3年目に 55人/日 に届く店で、家族の店が取りこぼす客（週末は平日の1.6倍）
console.log('\n## 家族の店（上限35）が2・3年目に取りこぼす客');
for (const [y, perDay] of [['2年目', 44], ['3年目', 55]]) {
  const weekday = perDay * 26 / (20 + 6 * 1.6), weekend = weekday * 1.6;
  const lost = 20 * Math.max(0, weekday - 35) + 6 * Math.max(0, weekend - 35);
  console.log(`${y}：平均 ${perDay}人/日、平日 ${weekday.toFixed(0)}・週末 ${weekend.toFixed(0)} → 月に ${lost.toFixed(0)} 人を帰す（売上 ${(lost * UNIT / 1e4).toFixed(0)}万円ぶん。待ちで評判 −）`);
}
// (8) 値段の入れ替わりの大きさ：相場 p_ref が自店の値段に寄る重み w（実装 0.5）を変えたとき、「850円から ±50円 動かした月の営業利益の差」が年でどう入れ替わるか（寄りは3か月後の定常で近似：p_ref = w·p + (1−w)·850）
console.log('\n## 値下げ50円と値上げ50円の月の営業利益の差（3か月後。商店街の混ざり・個人の傾き・常連 ×0.5）。相場への自店の重み w を変えて');
function opAt(p, w, shareL, nBase, cap, mix) {
  const pRef = w * p + (1 - w) * PRICE, r = p / pRef; let n = 0;
  for (const [wt, eps] of mix) for (const d of [-0.4, 0, 0.4]) n += nBase * (wt / 3) * ((1 - shareL) * Math.pow(r, -(eps + d)) + shareL * Math.pow(r, -(eps + d) / 2));
  n = Math.min(n, cap);
  const sales = n * DAYS * p * ITEMS, cogs = n * DAYS * PRICE * COGS * ITEMS;
  return sales * (1 - UTIL_VAR) - cogs - (200000 + 100000 + 150000 + UTIL_FIXED + DEP) - INTEREST;
}
const mixS = MIX['商店街'];
for (const w of [0.5, 0.3, 0.0]) {
  const row = [[0.15, 44 * 0.70, '1年目'], [0.30, 44, '2年目'], [0.45, 55, '3年目'], [0.45, 70, '3年目・上限70に届く店']].map(([L, n, nm]) => {
    const dn = (opAt(800, w, L, n, 70, mixS) - opAt(850, w, L, n, 70, mixS)) / 1e4, up = (opAt(900, w, L, n, 70, mixS) - opAt(850, w, L, n, 70, mixS)) / 1e4;
    return `${nm}：値下げ ${dn >= 0 ? '+' : ''}${dn.toFixed(1)}万／値上げ ${up >= 0 ? '+' : ''}${up.toFixed(1)}万`;
  });
  console.log(`w=${w}：` + row.join('、'));
}
// (9) 版0.5 の案：新規の客の ε を +0.2（学生2.5・勤め人2.2・家族2.0・観光1.9）、常連 ×0.4、相場への自店の重み w＝0.2 にしたとき
console.log('\n## 版0.5 の案（新規 +0.2・常連 ×0.4・w＝0.2）：値下げ50円／値上げ50円の月の営業利益の差');
function opAt2(p, w, shareL, nBase, cap, mix, regMul) {
  const pRef = w * p + (1 - w) * PRICE, r = p / pRef; let n = 0;
  for (const [wt, eps] of mix) for (const d of [-0.4, 0, 0.4]) n += nBase * (wt / 3) * ((1 - shareL) * Math.pow(r, -(eps + 0.2 + d)) + shareL * Math.pow(r, -(eps + 0.2 + d) * regMul));
  n = Math.min(n, cap);
  const sales = n * DAYS * p * ITEMS, cogs = n * DAYS * PRICE * COGS * ITEMS;
  return sales * (1 - UTIL_VAR) - cogs - (200000 + 100000 + 150000 + UTIL_FIXED + DEP) - INTEREST;
}
for (const [w, rm] of [[0.2, 0.4], [0.5, 0.4], [0.2, 0.5]]) {
  const row = [[0.15, 44 * 0.70, '1年目'], [0.30, 44, '2年目'], [0.45, 55, '3年目'], [0.45, 70, '3年目・上限に届く店']].map(([L, n, nm]) => {
    const dn = (opAt2(800, w, L, n, 70, mixS, rm) - opAt2(850, w, L, n, 70, mixS, rm)) / 1e4, up = (opAt2(900, w, L, n, 70, mixS, rm) - opAt2(850, w, L, n, 70, mixS, rm)) / 1e4;
    return `${nm}：値下げ ${dn >= 0 ? '+' : ''}${dn.toFixed(1)}万／値上げ ${up >= 0 ? '+' : ''}${up.toFixed(1)}万`;
  });
  console.log(`w=${w}・常連×${rm}：` + row.join('、'));
}

// ---- 版0.6 で足した検算（Codex の PR #1 の問い：需要の式・育成の手・値段の入れ替わり・目安）----
// (10) 36か月の小さな模型：世界の式（world.js）を1店に絞って写し、(1−ℓ) を外し、相場は町の店だけ（自店の重み0）、
//     「放置」と「上手な3方針」で 平均店 44±8・上手な店 100±15・家族の勝率・値段の入れ替わり の4つが同時に目安に入るかを、置き値の組（案）ごとに見る。
//     潜在客 S0 は「放置の3年目の中央値が44になる」ように逆算した（逆算と明記）。seed は潜在客 ±20%・その他固定費 15/20万・家賃 ±20%（i.3 の町の変種）。
function model(V) {
  const BR = 0.16, BF = 0.30, BA = 0.25, S0SHARE = 0.25;
  const EPS_NEW = 2.1, EPS_REG = V.epsReg, RETAIN = V.retain, CHURN = 0.03, VISITS = 4;
  const CAPS = { family: 35, part1: 70, part2: 100 }, LABOR = { family: 120000, part1: 200000, part2: 400000 };
  const seeds = []; for (let i = 0; i < 60; i++) seeds.push({ pool: 0.8 + 0.4 * ((i * 37) % 60) / 59, other: i % 2 ? 150000 : 200000, rent: 100000 * (0.8 + 0.4 * ((i * 13) % 60) / 59) });
  function run(S0, seed, pol, { years = 3 } = {}) {
    let R = 3, A = 0, L = 0, cash = 7000000 - 1500000 - 900000 - 600000, cum = 0, F = 1, Q = 3, ramp;
    const out = [];
    for (let t = 0; t < 12 * years; t++) {
      const y = Math.floor(t / 12) + 1, p = pol(y, t);
      ramp = t < 12 ? 0.55 + 0.30 * t / 11 : t < 24 ? 0.85 + 0.15 * (t - 11) / 12 : 1;
      Q = p.supplier ? V.qHigh : 3; F = p.limited && t % 12 === 7 ? 1.15 : Math.max(1, F - 0.0375);
      A = (p.sign ? 0.9 : p.sns ? 0.5 : 0.2) * A + (p.flyer || 0) / 100000 + (p.sns ? 0.3 : 0) + (p.sign ? 0.3 : 0);
      const M = Math.exp(BR * (R - 3) + 0.06 * (Q - 3) + BF * Math.log(F) + (p.fit || 0) + BA * Math.log(1 + A));
      const share = (M * S0SHARE) / ((1 - S0SHARE) + M * S0SHARE);
      const pRef = 850, epsR = R >= 4.5 ? 0.7 : 1;
      const Nnew = S0 * seed.pool * share * ramp * (p.map ? 1.2 : 0.8) * Math.pow(p.price / pRef, -EPS_NEW * epsR);
      const Nreg = L * Math.pow(p.price / pRef, -EPS_NEW * EPS_REG);
      const cap = CAPS[p.form], N = Math.min(Nnew + Nreg, cap), waitRate = Math.max(0, (Nnew + Nreg - cap) / (Nnew + Nreg));
      const sales = N * DAYS * p.price * ITEMS, cogs = N * DAYS * (p.supplier ? PRICE * 0.38 : PRICE * COGS) * ITEMS;
      const fixed = LABOR[p.form] + seed.rent + seed.other + UTIL_FIXED + DEP + (p.flyer || 0) + (p.line ? 5000 : 0) + (p.sign && t === 3 ? 300000 : 0) + (p.supplier ? V.qCost : 0);
      const op = sales * (1 - UTIL_VAR) - cogs - fixed - INTEREST;
      cash += op + DEP - (t >= 3 ? REPAY : 0); cum += op;
      const exp = Q + 2 * Math.log(F) + 2 * (p.fit || 0) - 3 * waitRate;
      R = Math.max(1, Math.min(5, R + 0.25 * (exp - R)));
      const served = N * Nnew / (Nnew + Nreg || 1);
      const churn = Math.max(0.01, CHURN - (p.line ? 0.009 : 0) - V.churnRep * Math.max(0, R - 3));
      L = Math.max(0, L * (1 - churn) + RETAIN * served * (1 + 0.3 * (R - 3)));
      out.push({ t, y, N, Nnew, Nreg, L, R, A, cash, cum, full: Nnew + Nreg > cap });
    }
    return out;
  }
  const idle = (form) => (y, t) => ({ price: 850, form, map: true });
  const sk = (form) => ({
    '多店舗（人を雇う）': (y, t) => ({ price: y === 1 ? 800 : y === 2 ? 850 : 950, form: form || (y >= 2 ? 'part2' : 'part1'), map: true, flyer: t >= 3 && t < 18 ? 50000 : 0, line: t >= 6, sign: t >= 3, fit: 0.10, limited: true, supplier: y >= 2 }),
    '品質（こだわり）': (y, t) => ({ price: y === 1 ? 850 : y === 2 ? 900 : 1000, form: form || (y >= 3 ? 'part2' : 'part1'), map: true, sns: true, line: t >= 6, sign: t >= 3, fit: 0.10, limited: true, supplier: true }),
    '宣伝（安く集める）': (y, t) => ({ price: y === 1 ? 750 : y === 2 ? 800 : 900, form: form || (y >= 2 ? 'part2' : 'part1'), map: true, flyer: t >= 3 ? 80000 : 0, line: t >= 6, sign: t >= 3, fit: 0.05, limited: true, supplier: false }),
  });
  const skilled = sk(null);
  const q = (arr, k) => { const a = arr.slice().sort((x, y) => x - y); return a[Math.floor((a.length - 1) * k)]; };
  const y3 = (o) => o.filter((x) => x.y === 3).reduce((t, x) => t + x.N, 0) / 12;
  let S0 = 40; for (let it = 0; it < 30; it++) { const med = q(seeds.map((sd) => y3(run(S0, sd, idle('part1')))), 0.5); S0 *= 44 / med; }
  console.log(`\n## (10) 案「${V.name}」：(1−ℓ) なし・相場は町だけ・常連 ×${V.epsReg}・retain ${V.retain}・上手の品質 Q ${V.qHigh}（月 ${V.qCost / 1e4}万）・評判で離れ −${V.churnRep}/段。潜在客 S0＝${S0.toFixed(1)}人/日（逆算）`);
  const idleN = seeds.map((sd) => y3(run(S0, sd, idle('part1'))));
  const i0 = run(S0, seeds[0], idle('part1'));
  console.log(`放置（パート1人・850円）3年目：中央値 ${q(idleN, 0.5).toFixed(1)}・上位25% ${q(idleN, 0.75).toFixed(1)}人/日（目安 44±8）。常連の割合 ${(i0[35].L / i0[35].N).toFixed(2)}・R ${i0[35].R.toFixed(2)}`);
  const skN = {};
  for (const [name, pol] of Object.entries(skilled)) {
    const ns = seeds.map((sd) => y3(run(S0, sd, pol))); skN[name] = ns;
    const o = run(S0, seeds[0], pol), last = o[35];
    console.log(`上手「${name}」3年目：中央値 ${q(ns, 0.5).toFixed(1)}・上位25% ${q(ns, 0.75).toFixed(1)}人/日（目安 100±15）。seed0：R ${last.R.toFixed(2)}・A ${last.A.toFixed(2)}・常連の割合 ${(last.L / last.N).toFixed(2)}・満席の月 ${o.filter((x) => x.y === 3 && x.full).length}/12・3年目末ネットキャッシュ ${((last.cash - 7000000 + REPAY * 33) / 1e4).toFixed(0)}万`);
  }
  let famIdle = 0, famSk = 0;
  for (const sd of seeds) {
    if (run(S0, sd, idle('family'))[35].cash > run(S0, sd, idle('part1'))[35].cash) famIdle++;
    const f = run(S0, sd, sk('family')['多店舗（人を雇う）']), p = run(S0, sd, skilled['多店舗（人を雇う）']); if (f[35].cash > p[35].cash) famSk++;
  }
  console.log(`家族の勝率（3年目末のネットキャッシュ、${seeds.length}周）：放置どうし ${(100 * famIdle / seeds.length).toFixed(0)}%、上手な手どうし（家族のまま vs 人を雇う） ${(100 * famSk / seeds.length).toFixed(0)}%（目安 30〜60%）`);
  let flip = 0; const p1s = [], p3s = [];
  for (const sd of seeds.slice(0, 20)) {
    let best = null;
    for (let p1 = 700; p1 <= 1000; p1 += 50) for (let p2 = 700; p2 <= 1000; p2 += 50) for (let p3 = 700; p3 <= 1000; p3 += 50) {
      const base = skilled['多店舗（人を雇う）'];
      const o = run(S0, sd, (y, t) => ({ ...base(y, t), price: y === 1 ? p1 : y === 2 ? p2 : p3 }));
      if (!best || o[35].cum > best.cum) best = { cum: o[35].cum, p1, p2, p3 };
    }
    p1s.push(best.p1); p3s.push(best.p3); if (best.p1 < 850 && best.p3 > 850) flip++;
  }
  console.log(`値段の入れ替わり（上手「多店舗」・20 seed・年ごとの値段を総当たり）：1年目 <850 かつ 3年目 >850 の周 ${(100 * flip / 20).toFixed(0)}%（目安 >50%）。最適の中央値 1年目 ${q(p1s, 0.5)}円 → 3年目 ${q(p3s, 0.5)}円`);
}
model({ name: 'A 版0.5 のまま', epsReg: 0.4, retain: 0.03, qHigh: 3.4, qCost: 0, churnRep: 0 });
model({ name: 'B 品質の育成を厚く（Q 4.0・月3万）＋評判で離れ −0.5%/段', epsReg: 0.4, retain: 0.03, qHigh: 4.0, qCost: 30000, churnRep: 0.005 });
model({ name: 'C B＋常連 ×0.3・retain 0.035', epsReg: 0.3, retain: 0.035, qHigh: 4.0, qCost: 30000, churnRep: 0.005 });
// (11) 案C で、上手な店を5年目（常連の積み上がりの時定数 ≒ 1/離れ ≒ 33か月の後）まで回したときの客数。CALIB の上位25%＝100人/日は店の年齢を問わない断面なので、定常に近い5年目で比べる
(function () {
  const V = { epsReg: 0.3, retain: 0.035, qHigh: 4.0, qCost: 30000, churnRep: 0.005 };
  // model() の中身を5年で回すため、同じ式を短く写す（放置の S0 は 91.5）
  const S0 = 91.5, BR = 0.16, BF = 0.30, BA = 0.25, S0SHARE = 0.25, EPS_NEW = 2.1;
  const CAPS = { family: 35, part1: 70, part2: 100, part3: 125 };
  function run(seedPool, pol, years) {
    let R = 3, A = 0, L = 0, F = 1, Q = 3; const out = [];
    for (let t = 0; t < 12 * years; t++) {
      const y = Math.floor(t / 12) + 1, p = pol(y, t), ramp = t < 12 ? 0.55 + 0.30 * t / 11 : t < 24 ? 0.85 + 0.15 * (t - 11) / 12 : 1;
      Q = p.supplier ? V.qHigh : 3; F = p.limited && t % 12 === 7 ? 1.15 : Math.max(1, F - 0.0375);
      A = (p.sign ? 0.9 : 0.2) * A + (p.flyer || 0) / 100000 + (p.sign ? 0.3 : 0);
      const M = Math.exp(BR * (R - 3) + 0.06 * (Q - 3) + BF * Math.log(F) + (p.fit || 0) + BA * Math.log(1 + A));
      const share = (M * S0SHARE) / ((1 - S0SHARE) + M * S0SHARE), epsR = R >= 4.5 ? 0.7 : 1;
      const Nnew = S0 * seedPool * share * ramp * 1.2 * Math.pow(p.price / 850, -EPS_NEW * epsR), Nreg = L * Math.pow(p.price / 850, -EPS_NEW * V.epsReg);
      const cap = CAPS[p.form], N = Math.min(Nnew + Nreg, cap), waitRate = Math.max(0, (Nnew + Nreg - cap) / (Nnew + Nreg));
      R = Math.max(1, Math.min(5, R + 0.25 * (Q + 2 * Math.log(F) + 2 * (p.fit || 0) - 3 * waitRate - R)));
      const churn = Math.max(0.01, 0.03 - (p.line ? 0.009 : 0) - V.churnRep * Math.max(0, R - 3));
      L = Math.max(0, L * (1 - churn) + V.retain * (N * Nnew / (Nnew + Nreg || 1)) * (1 + 0.3 * (R - 3)));
      out.push({ y, N, R, L, full: Nnew + Nreg > cap });
    }
    return out;
  }
  const pol = (y, t) => ({ price: y === 1 ? 800 : y === 2 ? 850 : y === 3 ? 950 : 1000, form: y >= 4 ? 'part3' : y >= 2 ? 'part2' : 'part1', flyer: t >= 3 && t < 18 ? 50000 : 0, line: t >= 6, sign: t >= 3, fit: 0.10, limited: true, supplier: y >= 2 });
  const pools = []; for (let i = 0; i < 60; i++) pools.push(0.8 + 0.4 * ((i * 37) % 60) / 59);
  const q = (arr, k) => { const a = arr.slice().sort((x, y) => x - y); return a[Math.floor((a.length - 1) * k)]; };
  for (const yr of [3, 4, 5]) {
    const ns = pools.map((pl) => { const o = run(pl, pol, yr); return o.filter((x) => x.y === yr).reduce((t, x) => t + x.N, 0) / 12; });
    const o0 = run(1, pol, yr); const last = o0[12 * yr - 1];
    console.log(`(11) 案C・上手「多店舗」の ${yr}年目：中央値 ${q(ns, 0.5).toFixed(1)}・上位25% ${q(ns, 0.75).toFixed(1)}人/日。seed0：R ${last.R.toFixed(2)}・常連の割合 ${(last.L / last.N).toFixed(2)}・満席の月 ${o0.slice(-12).filter((x) => x.full).length}/12`);
  }
})();
