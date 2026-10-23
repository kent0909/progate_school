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
