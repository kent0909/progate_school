// ラーメン版の置き値（係数）。DESIGN-RAMEN 版0.5 の d章・c.8・c.9・f章・l.4 から。
// 1行＝{ v：使う値, lo・hi：動かしてよい幅, src：出どころ（設計書の節・報告の名前と区分 (a)(b)(c)） }。
// 読み込み時に v が幅の中にあるかを確かめる（SIM.coef.check。tools/sim-check.js --ramen も呼ぶ）。
// 設計と違う値にした行は note に理由を書く（報告にも写す）。純粋なデータで DOM は触らない。
(function (g) {
  const SIM = (g.SIMDATA = g.SIMDATA || {});
  const T = {
    // DESIGN-RAMEN 版1.2 (s)：許可された置き値。幅は今回の指定値に固定。
    cheapFollow: { v: 0.25, lo: 0.25, hi: 0.25, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    signSmall: { v: 0.03, lo: 0.03, hi: 0.03, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    signLarge: { v: 0.07, lo: 0.07, hi: 0.07, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    signCostSmall: { v: 100000, lo: 100000, hi: 100000, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    signCostLarge: { v: 500000, lo: 500000, hi: 500000, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    signPermit: { v: 2500, lo: 2500, hi: 2500, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    signRenew: { v: 500000, lo: 500000, hi: 500000, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    signKeep: { v: 0.9, lo: 0.9, hi: 0.9, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    signFadeAt: { v: 30, lo: 30, hi: 30, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    signRenewAt: { v: 36, lo: 36, hi: 36, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    signFade: { v: 0.5, lo: 0.5, hi: 0.5, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    signLuckMin: { v: 0.7, lo: 0.7, hi: 0.7, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    signLuckWidth: { v: 0.6, lo: 0.6, hi: 0.6, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    signDelayRange: { v: 3, lo: 3, hi: 3, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    supplierCheapMul: { v: 0.8857142857142857, lo: 0.8857142857142857, hi: 0.8857142857142857, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    supplierHighMul: { v: 1.1714285714285715, lo: 1.1714285714285715, hi: 1.1714285714285715, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    supplierCheapQ: { v: -0.2, lo: -0.2, hi: -0.2, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    supplierHighQ: { v: 0.8, lo: 0.8, hi: 0.8, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    supplierQSpread: { v: 0.2, lo: 0.2, hi: 0.2, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    supplierDefectMin: { v: 4, lo: 4, hi: 4, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    supplierDefectRange: { v: 5, lo: 5, hi: 5, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    supplierDefectHit: { v: 1.2, lo: 1.2, hi: 1.2, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    supplierHighFixed: { v: 30000, lo: 30000, hi: 30000, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    shockTown: { v: 0.05, lo: 0.05, hi: 0.05, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    shockHighExtra: { v: 0.02, lo: 0.02, hi: 0.02, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    shockAt: { v: 12, lo: 12, hi: 12, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    costOmenFalse: { v: 0.3333333333333333, lo: 0.3333333333333333, hi: 0.3333333333333333, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    bulkPay: { v: 300000, lo: 300000, hi: 300000, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    bulkBack: { v: 45000, lo: 45000, hi: 45000, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    bulkMonths: { v: 6, lo: 6, hi: 6, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    missPenalty: { v: 0.05, lo: 0.05, hi: 0.05, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    missChurn: { v: 0.01, lo: 0.01, hi: 0.01, src: 'DESIGN-RAMEN 版1.2 (s) s.1【置き値】' },
    areaSign: { v: { ekimae: 1, shotengai: 0.8, jutaku: 0.6 }, lo: null, hi: null, src: 'DESIGN-RAMEN 版1.2 (s) s.1 看板の立地倍率' },

    // ---- 需要の式 d.2 ----
    bR: { v: 0.16, lo: 0.10, hi: 0.22, src: 'd.2 評判の係数（半段で約±3.5%）[CALIB M10 (b)]' },
    bQ: { v: 0.06, lo: 0.02, hi: 0.10, src: 'd.2 品質の係数【置き値 (c)】' },
    bF: { v: 0.30, lo: 0.20, hi: 0.40, src: 'd.2 一杯の魅力 F の係数【置き値 (c)】' },
    bA: { v: 0.25, lo: 0.15, hi: 0.35, src: 'd.2 宣伝の頭打ち 0.25·ln(1+A)（Lemonade の看板は最大2倍）' },
    bWait: { v: 0.008, lo: 0.004, hi: 0.012, src: 'd.2 待ちの係数（待ちは8円ぶん：SIMDESIGN）' },
    fitGood: { v: 0.10, lo: 0.05, hi: 0.15, src: 'd.2・l.4 客層との相性 ◎【置き値 (c)】' },
    fitBad: { v: -0.05, lo: -0.10, hi: -0.02, src: 'd.2・l.4 客層との相性 △【置き値 (c)】' },
    lambda: { v: 0.5, lo: 0.3, hi: 0.7, src: 'd.2 入れ子の λ【置き値 SIMDESIGN 10.1】・l.4 は 0.5' },
    // ---- 値段の弾力性（案C＋客層＋個人の傾き。X4・n.16）----
    epsStudent: { v: 2.5, lo: 2.0, hi: 2.6, src: 'd.2 版0.5（新規 +0.2）・n.16 学生【置き値 (c)】' },
    epsOffice: { v: 2.2, lo: 1.7, hi: 2.3, src: 'd.2 版0.5（新規 +0.2）・n.16 勤め人【置き値 (c)】' },
    epsFamily: { v: 2.0, lo: 1.5, hi: 2.1, src: 'd.2 版0.5（新規 +0.2）・n.16 家族・地元【置き値 (c)】' },
    epsTourist: { v: 1.9, lo: 1.4, hi: 2.0, src: 'd.2 版0.5（新規 +0.2）・n.16 観光【置き値 (c)】' },
    epsTilt: { v: 0.4, lo: 0.2, hi: 0.6, src: 'n.16 個人ごとの傾き ±0.4（敏感・中・寛容 各1/3）' },
    epsRegular: { v: 0.3, lo: 0.3, hi: 0.7, src: 'd.9.1 版0.6 常連 ×0.3【置き値 (c)】' },
    epsHighRep: { v: 0.7, lo: 0.5, hi: 0.9, src: 'X4 評判4.5以上 ×0.7 [M11 (c)]' },
    epsOver1000: { v: 1.5, lo: 1.2, hi: 2.0, src: 'd.2 1,000円を越える部分 ×1.5 [M3 (c)]' },
    epsCheaperRival: { v: 1.3, lo: 1.1, hi: 1.5, src: 'd.2 同じ型に2割以上安い競合 ×1.3' },
    pRefStep: { v: 0.25, lo: 0.15, hi: 0.35, src: 'd.1 p_ref ← 0.75·p_ref＋0.25·加重平均 [K13 (b)]（値下げの効きは3か月で半分）' },
    pRefOwn: { v: 0, lo: 0, hi: 1.0, src: 'd.9.1 版0.6 自店0・町1【置き値 (c)】' },
    // ---- 客数の大きさ ----
    median: { v: 44, lo: 36, hi: 52, src: 'd 結論・l.4 平均の店の中央値 44人/日 [CALIB M24 (b)]' },
    rampStart: { v: 0.55, lo: 0.45, hi: 0.65, src: 'l.4 開業の年の坂 0.55→0.85（平均0.70≒0.67倍 [CALIB M22]）' },
    rampEnd: { v: 0.85, lo: 0.75, hi: 0.95, src: 'l.4 同上' },
    noise: { v: 0.10, lo: 0.05, hi: 0.15, src: 'd 結論・c.4 週の客数 ±10%（一様）' },
    weekendFamily: { v: 2.16, lo: 1.8, hi: 2.5, src: 'd.3 週末の倍率：家族の型 2.16 [FILL-CALIB]' },
    weekendSingle: { v: 1.44, lo: 1.2, hi: 1.7, src: 'd.3 週末の倍率：単身の型 1.44 [FILL-CALIB]' },
    rainCut: { v: 0.9, lo: 0.8, hi: 0.95, src: 'd.3 雨の週は N ×0.9' },
    potentialScale: { v: 0.579913, lo: 0.2, hi: 1.2, src: 'DESIGN-RAMEN 版1.2 (s) s.3#9 逆算（d.9.1）：地図のみ・850円・パート1人の3年目中央値44。sim-ramen --calibrate --runs 300で再現' },
    townPotentialSpread: { v: 0.2, lo: 0.2, hi: 0.2, src: 'd.9.5 町seed：潜在客±20%（一様）' },
    townRentSpread: { v: 0.2, lo: 0.2, hi: 0.2, src: 'd.9.5 町seed：家賃±20%（一様）' },
    churnLine: { v: 0.009, lo: 0.009, hi: 0.009, src: 'd.9.1 LINEで離れ−0.009' },
    churnRep: { v: 0.005, lo: 0.005, hi: 0.005, src: 'd.9.1 評判3より上の1段で離れ−0.005' },
    churnFloor: { v: 0.01, lo: 0.01, hi: 0.01, src: 'd.9.1 常連の離れの下限' },
    // ---- 常連・評判・宣伝 ----
    retain: { v: 0.035, lo: 0.015, hi: 0.04, src: 'd.1・k.8 #4 版0.5 常連を1日あたりの杯数で保持【置き値 (c)】', note: 'd.9.1 版0.6の指定値0.035。価格の勝率に合わせた調整はしない' },
    regularVisits: { v: 4, lo: 4, hi: 4, src: 'k.8 #4・retain の単位換算：常連1人は月4回来店【置き値 (c)】' },
    churn: { v: 0.03, lo: 0.02, hi: 0.05, src: 'd.1 常連の離れ 月3%（値上げ・飽き・待ちで上がる）[試算]' },
    churnPerHike: { v: 0.04, lo: 0.02, hi: 0.08, src: '【置き値 (c)】値上げ10%あたりの離れの上乗せ（d.1「値上げで上がる」）' },
    repStock: { v: 1, lo: 0.5, hi: 3, src: '【置き値 (c)】品切れで帰った客の割合が体験を下げる強さ（d.2「品切れは評判に待ちと同じ −」）' },
    repWait: { v: 3, lo: 1, hi: 6, src: '【置き値 (c)】上限を越えて待たせた・帰した客の割合が体験を下げる強さ（d.2「行列は長期で評判を下げる」、c.8「越えた日は待ち（評判−）」）' },
    repAlpha: { v: 0.25, lo: 0.15, hi: 0.35, src: 'd.1 評判 R ← R＋α(体験−R)、α＝0.25/月（効くまで約3か月 [M40 (c)]）' },
    adUnit: { v: 100000, lo: 100000, hi: 100000, src: 'd.2 A の単位は月の宣伝費 ÷ 10万円' },
    adKeepFlyer: { v: 0.2, lo: 0.0, hi: 0.4, src: 'd.1 チラシの残り λ 0.2 [K2 (c)]' },
    adKeepSns: { v: 0.5, lo: 0.3, hi: 0.7, src: 'd.1 SNS の残り λ 0.5 [K2 (c)]' },
    mapBoost: { v: 1.2, lo: 1.1, hi: 1.3, src: 'd.4 地図・口コミの整備で新規の来店 ×1.2／未整備 ×0.8 [K10 (c)]' },
    mapNone: { v: 0.8, lo: 0.7, hi: 0.9, src: 'd.4 同上' },
    lineBack: { v: 0.07, lo: 0.05, hi: 0.10, src: 'd.1 LINE の呼び戻し 5〜10%（[K7] の9%は1社の例 [MKT 11]）。常連の離れを減らす' },
    // ---- 一杯の魅力 F（d.8）----
    peakHit: { v: 0.25, lo: 0.15, hi: 0.35, src: 'd.8 話題の山 当たり +0.25' },
    peakMid: { v: 0.15, lo: 0.08, hi: 0.20, src: 'd.8 普通 +0.15' },
    peakMiss: { v: 0.05, lo: 0.0, hi: 0.10, src: 'd.8 外れ +0.05' },
    peakW: { v: [20, 50, 30], lo: null, hi: null, src: 'd.8 当たり20・普通50・外れ30 [M14 (c)]' },
    peakMonths: { v: 4, lo: 3, hi: 6, src: 'd.8 山は4か月で元へ（月ごとに差の1/4）' },
    decayStart: { v: 13, lo: 13, hi: 13, src: 'd.8 基準の減衰は13か月目から（1年目は落ちない）' },
    decay: { v: 0.02, lo: 0.02, hi: 0.02, src: 'DESIGN-RAMEN 版1.2 (s) s.1 オーナー決定' },
    decayTier0: { v: 0.5, lo: 0.5, hi: 0.5, src: 'd.8 段0は半分' },
    decayFloor: { v: 0.6, lo: 0.5, hi: 0.7, src: 'd.8 下限 0.6' },
    // ---- 店の形・人（c.8・n.17）----
    capBy: { v: [45, 70, 100, 125, 145, 160, 170], lo: null, hi: null, src: 'DESIGN-RAMEN 版1.2 (s) s.1 家族上限45：目安による置き値、決定28' },
    capSeat: { v: 150, lo: 120, hi: 180, src: 'd.1 席×回転：12席×8回転＝96〜 [R4 (c)]。昼夜で 150/日を上限に【置き値】' },
    wagePart: { v: 200000, lo: 180000, hi: 240000, src: 'l.4 パート1人 月20万（時給1,280円×6時間×26日。令和8年度の最低賃金の上端 [FILL-RAMEN 2.1]）' },
    wageFamily2: { v: 150000, lo: 100000, hi: 200000, src: 'n.17 家族の2人目からは給料【置き値 (c)】' },
    familyMax: { v: 2, lo: 2, hi: 2, src: 'n.17 家族の働き手は上限2人（全員に給料）' },
    hireMax: { v: 6, lo: 6, hi: 6, src: 'n.17 雇う人数は0〜6人' },
    wageFamily1: { v: 120000, lo: 120000, hi: 120000, src: 'c.8・l.4・k.8 #6 版0.5 家族1人目の月給12万【置き値 (c)】' },
    discountChurn: { v: 1, lo: 1, hi: 1, src: 'DESIGN-RAMEN 版1.2 (s) s.1 オーナー決定' },
    familySickP: { v: 0.03, lo: 0.01, hi: 0.06, src: 'c.8 客数30人/日を越えた月は体を壊す札が月3%' },
    // ---- 月の時間の予算（c.9）----
    timeBy: { v: { family: 3, part1: 4, part2: 5 }, lo: null, hi: null, src: 'c.9 家族3・パート1人4・パート2人5' },
    timeTier0: { v: 1, lo: 0, hi: 1, src: 'c.9 段0は +1' },
    timeHireMax: { v: 2, lo: 2, hi: 2, src: 'c.9 人を雇う：予算 +1/人、上限2' },
    timeCost: { v: { forecast: 1, inspect: 1, map: 1, mapFirst: 2, sns: 1, haccp: 1, tweak: 1, rivalRead: 1 }, lo: null, hi: null, src: 'c.9 時間を使う手' },
    // ---- お金（l.4）----
    price0: { v: 850, lo: 700, hi: 1000, src: 'l.4 1杯の値段 850円（小売物価の中央747円・払える金額857円 [FILL-RAMEN 2.1]）' },
    items: { v: 1.12, lo: 1.10, hi: 1.30, src: 'l.4 点数 1.12（客単価 952円 [CALIB M23 (b)]）' },
    cogs: { v: 0.35, lo: 0.30, hi: 0.40, src: 'l.4 原価率35% [CALIB]。一杯の組み立て（bowl.js）で 30〜40%' },
    utilFixed: { v: 50000, lo: 40000, hi: 60000, src: 'l.4 光熱 固定5万 [M20 (b)]' },
    utilVar: { v: 0.04, lo: 0.03, hi: 0.05, src: 'l.4 光熱 売上の4%' },
    otherFixed: { v: 150000, lo: 150000, hi: 200000, src: 'l.4 その他固定費15万（20万の seed も）[FILL-CALIB 2]' },
    days: { v: 26, lo: 24, hi: 28, src: 'l.4 営業日 26日 [CALIB M24 の仮置き (c)]' },
    ownCash: { v: 3000000, lo: 3000000, hi: 3000000, src: 'l.4 自己資金300万' },
    loan: { v: 7000000, lo: 7000000, hi: 7000000, src: 'l.4 公庫700万（年2.5%・7年）[BIZ-RAMEN 2.1]' },
    loanRate: { v: 0.025, lo: 0.02, hi: 0.03, src: 'l.4 年2.5%（(c)）' },
    loanYears: { v: 7, lo: 7, hi: 7, src: 'l.4 7年返済' },
    shortLimit: { v: 2000000, lo: 1000000, hi: 3000000, src: '【置き値 (c)】c.4 支払不能の手①短期借入の枠（1年目は1回）' },
    shortRate: { v: 0.045, lo: 0.04, hi: 0.06, src: 'e.6 銀行 4.5%【置き値、CALIB：4〜5%台】' },
    freeRent: { v: 3, lo: 0, hi: 3, src: '【置き値 (c)】居抜きの契約で最初の家賃なしの月数（フリーレント）。台本の家賃の札を7月に教えるため（PEDAGOGY 7：1か月の新しい札2つまで）', note: '設計 l.4 にない。家賃の書類が4月から出ると4月の新しい札が3つになるので置いた。1年目の損益は家賃3か月分（36〜60万円）良くなる' },
    loanGrace: { v: 3, lo: 0, hi: 6, src: '【置き値 (c)】公庫の返済のすえおきの月数（創業の融資にはすえおきがある）。返済の札（支払利息）を7月に教えるため', note: '設計 l.4 は月8.3万円を最初の月から。すえおき中の利息はためて7月に払うので、利息の合計は同じ' },
    fitout: { v: 1500000, lo: 1500000, hi: 1500000, src: 'l.4 居抜きの造作150万（中古・耐用年数5年）' },
    fitoutLife: { v: 5, lo: 5, hi: 5, src: 'l.4 中古の耐用年数5年 [LAW D]' },
    deposit: { v: 900000, lo: 900000, hi: 900000, src: 'l.4 保証金6か月90万' },
    equipOpen: { v: 600000, lo: 600000, hi: 600000, src: 'l.4 器材と開業費60万' },
    rentPerTsubo: { v: { shotengai: 12000, ekimae: 20000, jutaku: 9000 }, lo: null, hi: null, src: 'l.4 県庁所在地の町：商店街1.2万・駅前2.0万・住宅地0.9万/坪【置き値】' },
    tsubo: { v: 10, lo: 10, hi: 10, src: 'l.4 10坪' },
    wasteShare: { v: 0.4, lo: 0.3, hi: 0.6, src: '【置き値 (c)】仕込んで売れ残った1杯の材料のうち捨てる割合（スープ・具。麺はゆでていない）。R10 (c) スープの5〜10%が廃棄' },
    prepErr: { v: 0.15, lo: 0.10, hi: 0.20, src: '【置き値 (c)】仕込みの見込みの外れ幅（予報を見ると ×0.5 [M8 (c)]）' },
  };
  const coef = (k) => { const r = T[k]; if (!r) throw new Error(`coef ${k} がない`); return r.v; };
  // v が幅の中か（幅のない表の行は形だけ）。違反の文の一覧を返す
  coef.check = () => {
    const out = [];
    for (const [k, r] of Object.entries(T)) {
      if (!r.src) out.push(`${k}：出どころがない`);
      if (typeof r.v === 'number' && (r.lo == null || r.hi == null || r.v < r.lo || r.v > r.hi)) out.push(`${k}：${r.v} が幅 ${r.lo}〜${r.hi} の外`);
    }
    return out;
  };
  coef.table = T;
  SIM.coef = coef;
})(typeof window !== 'undefined' ? window : globalThis);

