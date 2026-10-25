// 場面の表（DESIGN-RAMEN 版0.4 g.4・k.7）：scope.js の77項目それぞれに「場面（遊ぶ人が自分の手で仕訳・計算する所）」を書く。
// scene：{ card|ev, y, hand, doc|calc, note }。hand は 'doc'（docScreen で仕訳）｜'calc'（作業台・計算の画面）｜'read'（読むだけ：数えない）。
//   card：cards.js の札（doc は札の書類の番号）。ev：月の骨の出来事の id（ramen-y1.js。月ごとに番号がつくものは「sale」のように頭だけ。any:true）
// alt：別ルートの札、again：周回でもう一度出る場面（番人 guard:<id> を含む。切り身の段では台本に実在するもの）、againLater：後の段で足す周回の場面、gate：関門、deadline：番人の期限（年）。stage：埋める段（l.1 の表：1＝切り身、2＝2年目、3＝3年目、4＝4〜5年目、5＝5〜7年目）
// 切り身の段（stage 1）の26項目は、場面の札・出来事が台本に実在すること、手で書く場面が2つ以上の別の場面であることを coverage.js --ramen が確かめる。
// 2年目以降の51項目は、場面が書かれていること（実装は後の段）を確かめる。札の id は e章の判断の id（まだ cards.js にないものもある）。
(function (g) {
  const SIM = (g.SIMDATA = g.SIMDATA || {});
  const sc = (o) => o;
  SIM.scopeMap = {
    // ===== 土台（3級の範囲）9 =====
    'b-je': { stage: 1, deadline: { y: 1 }, scenes: [sc({ ev: 'prologue', y: 1, hand: 'calc', calc: 'board' }), sc({ ev: 'found', y: 1, hand: 'doc', doc: 'found' }), sc({ ev: 'loan', y: 1, hand: 'doc', doc: 'loan' })], alt: [], again: ['found'] },
    'b-tb': { stage: 1, deadline: { y: 1 }, gate: 'K1', scenes: [sc({ ev: 'close', y: 1, hand: 'calc', calc: 'close', note: '毎月の締め（closeScreen）' }), sc({ ev: 'sheet1', y: 1, hand: 'calc', calc: 'sheet' })], alt: [], again: ['close'] },
    'b-ledger': { stage: 1, deadline: { y: 2 }, gate: 'K1', scenes: [sc({ ev: 'opening2', y: 1, hand: 'calc', calc: 'opening' }), sc({ ev: 'closing1', y: 1, hand: 'calc', calc: 'closing' })], alt: ['equip'], again: ['opening2'] },
    'b-cycle': { stage: 1, deadline: { y: 1 }, gate: 'K1', scenes: [sc({ ev: 'closing1', y: 1, hand: 'calc', calc: 'closing' }), sc({ ev: 'report1', y: 1, hand: 'calc', calc: 'report' })], alt: [], again: ['closing1'] },
    'b-credit': { stage: 1, deadline: { y: 1 }, scenes: [sc({ ev: 'buy', any: true, y: 1, hand: 'doc', doc: 'buy_credit' }), sc({ ev: 'pap', any: true, y: 1, hand: 'doc', doc: 'pay_ap' })], alt: ['supplier'], again: ['buy'] },
    'b-mibarai': { stage: 1, deadline: { y: 1 }, scenes: [sc({ ev: 'flyer', any: true, y: 1, hand: 'doc', doc: 'ad_credit' }), sc({ card: 'freelance', doc: 0, y: 1, hand: 'doc' }), sc({ card: 'maintain', doc: 0, y: 1, hand: 'doc' })], alt: ['maintain'], again: ['flyer'] },
    'b-expense': { stage: 1, deadline: { y: 1 }, scenes: [sc({ ev: 'sal', any: true, y: 1, hand: 'doc', doc: 'pay_salary' }), sc({ ev: 'util', any: true, y: 1, hand: 'doc', doc: 'util' }), sc({ card: 'minwage', doc: 0, y: 1, hand: 'doc' })], alt: [], again: ['sal'] },
    'b-loan': { stage: 1, deadline: { y: 1 }, gate: 'K4', scenes: [sc({ ev: 'loan', y: 1, hand: 'doc', doc: 'loan' }), sc({ ev: 'repay', any: true, y: 1, hand: 'doc', doc: 'repay' })], alt: ['bigloan'], again: ['repay'] },
    'b-accrual': { stage: 1, deadline: { y: 2 }, gate: 'K1', scenes: [sc({ card: 'mayfund', y: 1, hand: 'calc', calc: 'mayfund-calc' }), sc({ card: 'due', y: 1, hand: 'calc', calc: 'due-calc' })], alt: ['site2'], again: ['guard:b-accrual'] },
    // ===== 株式会社の純資産 5 =====
    's-stock': { stage: 2, deadline: { y: 2 }, gate: 'K2', scenes: [sc({ card: 'issue', y: 2, hand: 'calc', calc: 'issue-amount' }), sc({ card: 'issue', y: 2, hand: 'doc', doc: 0 })], alt: ['openloan_family'], again: ['issue'] },
    's-dividend': { stage: 2, deadline: { y: 3 }, gate: 'K2', scenes: [sc({ card: 'dividend', y: 2, hand: 'calc', calc: 'div-limit' }), sc({ card: 'dividend', y: 2, hand: 'doc', doc: 0 })], alt: [], again: ['dividend'] },
    's-keisu': { stage: 3, deadline: { y: 4 }, gate: 'K4', scenes: [sc({ card: 'keisu', y: 4, hand: 'doc', doc: 'keisu' }), sc({ card: 'kesson', y: 4, hand: 'doc', doc: 'kesson' })], alt: ['kesson'], again: ['guard:s-keisu'] },
    's-ssce': { stage: 2, deadline: { y: 2 }, gate: 'K2', scenes: [sc({ ev: 'ss2', y: 2, hand: 'calc', calc: 'ss' }), sc({ ev: 'ss3', y: 3, hand: 'calc', calc: 'ss' })], alt: [], again: ['ss2'] },
    's-merger': { stage: 5, deadline: { y: 6 }, gate: 'K7', scenes: [sc({ card: 'shinise_buy', y: 6, hand: 'calc', calc: 'goodwill' }), sc({ card: 'shinise_buy', y: 6, hand: 'doc', doc: 'merger' })], alt: ['ohnami_store'], again: ['ohnami_store'] },
    // ===== 商品売買と収益 6 =====
    's-sanbunpo': { stage: 1, deadline: { y: 1 }, scenes: [sc({ ev: 'buy', any: true, y: 1, hand: 'doc', doc: 'buy_credit' }), sc({ card: 'defect', doc: 0, y: 1, hand: 'doc' }), sc({ card: 'bulk', doc: 0, y: 1, hand: 'doc' })], alt: ['bulk'], again: ['buy'] },
    's-taiwitsu': { stage: 2, deadline: { y: 5 }, y27: 'to3', scenes: [sc({ card: 'ticket_items', y: 2, hand: 'doc', doc: 1 }), sc({ card: 'ticket_items', y: 2, hand: 'calc', calc: 'taiwitsu-vs' })], alt: ['ticket_items'], again: ['ticket_items'] },
    's-cogs': { stage: 1, deadline: { y: 1 }, gate: 'K1', scenes: [sc({ ev: 'stock', y: 1, hand: 'doc', doc: 'stock' }), sc({ ev: 'stock-back', y: 1, hand: 'doc', doc: 'stock_back' })], alt: [], again: ['stock'] },
    's-genmo': { stage: 1, deadline: { y: 1 }, gate: 'K1', scenes: [sc({ ev: 'genmo', y: 1, hand: 'doc', doc: 'genmo' }), sc({ ev: 'hyoka-bulk', y: 1, hand: 'doc', doc: 'hyoka', note: 'まとめ買い（bulk）で湿気たとき' })], alt: ['bulk'], again: ['genmo'] },
    's-revenue': { stage: 1, deadline: { y: 3 }, scenes: [sc({ ev: 'coupon', any: true, y: 1, hand: 'doc', doc: 'discount', note: 'クーポンは値引き（あとの約束ではない）の対比' }), sc({ card: 'coupon_dual', doc: 0, y: 1, hand: 'doc' })], alt: ['stamp'], again: ['coupon'], againLater: ['stamp', 'fc'] },
    's-service': { stage: 2, deadline: { y: 4 }, scenes: [sc({ card: 'ev_summer_y2', y: 2, hand: 'doc', doc: 0, note: '町の行事の出店（2年目から役務収益で書く）' }), sc({ card: 'kyoshitsu', y: 3, hand: 'doc', doc: 1 })], alt: ['kyoshitsu'], again: ['ev_summer_y2'] },
    // ===== 税金 3 =====
    's-shohizei': { stage: 1, deadline: { y: 1 }, gate: 'K1', scenes: [sc({ ev: 'sale', any: true, y: 1, hand: 'doc', doc: 'cash_sale_vat' }), sc({ ev: 'vat-close', y: 1, hand: 'doc', doc: 'vat_close' }), sc({ ev: 'buy', any: true, y: 1, hand: 'doc', doc: 'buy_credit_vat' })], alt: [], again: ['vat-close'] },
    's-hojinzei': { stage: 1, deadline: { y: 2 }, gate: 'K1', scenes: [sc({ ev: 'tax1', y: 1, hand: 'doc', doc: 'tax' }), sc({ ev: 'tax-pay', y: 1, hand: 'doc', doc: 'tax_pay' })], alt: [], again: ['tax1'] },
    's-kazei': { stage: 3, deadline: { y: 4 }, gate: 'K8', scenes: [sc({ card: 'kosaihi', y: 4, hand: 'calc', calc: 'kazei' }), sc({ ev: 'tax4', y: 4, hand: 'doc', doc: 'tax' })], alt: ['tax_audit'], again: ['tax4'] },
    // ===== 債権と債務 7 =====
    's-bankrec': { stage: 1, deadline: { y: 1 }, gate: 'K1', scenes: [sc({ ev: 'bankrec', y: 1, hand: 'calc', calc: 'bankrec' }), sc({ ev: 'fee-3', y: 1, hand: 'doc', doc: 'fee' })], alt: ['touza'], again: ['bankrec'] },
    's-tegata': { stage: 4, deadline: { y: 5 }, y26only: true, gate: 'K6', scenes: [sc({ card: 'tonya_tegata', y: 5, hand: 'doc', doc: 'tegata-in' }), sc({ card: 'tonya_tegata', y: 5, hand: 'doc', doc: 'tegata-discount' })], alt: [], again: ['tonya_tegata'] },
    's-denshi': { stage: 1, deadline: { y: 2 }, gate: 'K6', scenes: [sc({ ev: 'card', any: true, y: 1, hand: 'doc', doc: 'card_sale' }), sc({ ev: 'cardin', any: true, y: 1, hand: 'doc', doc: 'card_in' })], alt: ['wholesale'], again: ['card'] },
    's-factoring': { stage: 4, deadline: { y: 5 }, gate: 'K6', scenes: [sc({ card: 'factoring', y: 4, hand: 'doc', doc: 'factoring' }), sc({ card: 'mayfund', y: 4, hand: 'calc', calc: 'factoring-cost' })], alt: ['mayfund'], again: ['mayfund'] },
    's-allow': { stage: 1, deadline: { y: 2 }, gate: 'K6', scenes: [sc({ ev: 'desk', y: 1, hand: 'read', note: '決算の机で見つける（選ぶだけなので数えない）' }), sc({ ev: 'allow-calc', y: 1, hand: 'calc', calc: 'calc' }), sc({ ev: 'allow', y: 1, hand: 'doc', doc: 'allow' })], alt: ['fc_unpaid'], again: ['allow'] },
    's-kashidaore': { stage: 4, deadline: { y: 5 }, gate: 'K6', scenes: [sc({ card: 'customer_bankrupt', y: 5, hand: 'doc', doc: 'kashidaore' }), sc({ card: 'customer_bankrupt', y: 6, hand: 'doc', doc: 'toritate' })], alt: [], again: ['customer_bankrupt'] },
    's-hosho': { stage: 5, deadline: { y: 6 }, gate: 'K7', scenes: [sc({ card: 'guarantee', y: 6, hand: 'doc', doc: 'hosho' }), sc({ card: 'guarantee', y: 6, hand: 'doc', doc: 'hosho-rikou' })], alt: ['noren_guarantee'], again: ['noren_guarantee'] },
    // ===== 外貨 3 =====
    's-fx': { stage: 3, deadline: { y: 4 }, gate: 'K4', scenes: [sc({ card: 'fx', y: 3, hand: 'doc', doc: 'fx-buy' }), sc({ card: 'fx', y: 3, hand: 'doc', doc: 'fx-pay' })], alt: ['fc_overseas'], again: ['fx'] },
    's-fxend': { stage: 3, deadline: { y: 4 }, gate: 'K4', scenes: [sc({ ev: 'fx-end', y: 3, hand: 'calc', calc: 'fx-end' }), sc({ ev: 'fx-end', y: 3, hand: 'doc', doc: 'fx-end' })], alt: [], again: ['fx-end'] },
    's-yoyaku': { stage: 3, deadline: { y: 5 }, gate: 'K4', scenes: [sc({ card: 'fx', y: 4, hand: 'doc', doc: 'fx-yoyaku' }), sc({ card: 'fx', y: 4, hand: 'calc', calc: 'yoyaku-diff' })], alt: [], again: ['fx'] },
    // ===== 固定資産 15 =====
    's-cost': { stage: 1, deadline: { y: 1 }, gate: 'K1', scenes: [sc({ ev: 'fitout', y: 1, hand: 'doc', doc: 'buy_asset' }), sc({ ev: 'equip', y: 1, hand: 'doc', doc: 'buy_asset' }), sc({ card: 'maintain', doc: 1, y: 1, hand: 'doc' })], alt: ['maintain'], again: ['equip'], againLater: ['site2'] },
    's-capex': { stage: 1, deadline: { y: 2 }, gate: 'K3', scenes: [sc({ card: 'maintain', doc: 0, y: 1, hand: 'doc', note: 'もとに戻す修理（修繕費）' }), sc({ card: 'maintain', doc: 1, y: 1, hand: 'doc', note: '前より良くした器材（資産に足す）' })], alt: ['renovate'], again: ['maintain'] },
    's-dep': { stage: 1, deadline: { y: 1 }, gate: 'K1', scenes: [sc({ ev: 'dep-fitout', y: 1, hand: 'doc', doc: 'dep' }), sc({ ev: 'dep-equip', y: 1, hand: 'doc', doc: 'dep' })], alt: [], again: ['dep-fitout'] },
    's-dep-rate': { stage: 2, deadline: { y: 3 }, gate: 'K5', scenes: [sc({ card: 'equip', y: 3, hand: 'calc', calc: 'dep-rate' }), sc({ card: 'equip', y: 3, hand: 'doc', doc: 0 })], alt: ['factory'], again: ['equip'] },
    's-indirect': { stage: 1, deadline: { y: 1 }, gate: 'K1', scenes: [sc({ ev: 'dep-fitout', y: 1, hand: 'doc', doc: 'dep' }), sc({ ev: 'dep-equip', y: 1, hand: 'doc', doc: 'dep' })], alt: [], again: ['dep-fitout'] },
    's-seisandaka': { stage: 4, deadline: { y: 4 }, gate: 'K5', scenes: [sc({ card: 'truck', y: 4, hand: 'calc', calc: 'seisandaka' }), sc({ card: 'truck', y: 4, hand: 'doc', doc: 'seisandaka' })], alt: ['factory'], again: ['truck'] },
    's-sale': { stage: 2, deadline: { y: 3 }, gate: 'K3', scenes: [sc({ card: 'maintain_replace', y: 3, hand: 'calc', calc: 'sale-gain' }), sc({ card: 'close', y: 3, hand: 'doc', doc: 1 })], alt: ['sign_typhoon', 'own_building'], again: ['close'] },
    's-fire': { stage: 3, deadline: { y: 4 }, gate: 'K4', scenes: [sc({ card: 'fire', y: 4, hand: 'doc', doc: 'mikessan' }), sc({ card: 'fire', y: 4, hand: 'doc', doc: 'hoken-saeki' })], alt: ['water_leak'], again: ['insurance'] },
    's-kensetsu': { stage: 2, deadline: { y: 2 }, gate: 'K3', scenes: [sc({ card: 'site2', y: 2, hand: 'doc', doc: 0 }), sc({ card: 'site2', y: 2, hand: 'doc', doc: 2 })], alt: ['start_c'], again: ['site2'], againLater: ['factory'] },
    's-asshuku': { stage: 4, deadline: { y: 4 }, gate: 'K4', scenes: [sc({ card: 'subsidy', y: 4, hand: 'doc', doc: 'subsidy-gain' }), sc({ card: 'subsidy', y: 4, hand: 'doc', doc: 'asshuku-loss' }), sc({ card: 'subsidy-energy', y: 5, hand: 'calc', calc: 'asshuku-vs-tax' })], alt: ['subsidy-energy'], again: ['subsidy-energy', 'guard:s-asshuku'] },
    's-kappu': { stage: 2, deadline: { y: 3 }, gate: 'K4', scenes: [sc({ card: 'finance_asset', y: 3, hand: 'doc', doc: 0 }), sc({ card: 'finance_asset', y: 3, hand: 'calc', calc: 'kappu-interest' }), sc({ card: 'finance_asset', y: 3, hand: 'calc', calc: 'kappu-current' }), sc({ card: 'finance_asset', y: 3, hand: 'calc', calc: 'kappu-prepaid' })], alt: ['kitchen_replace'], again: ['finance_asset'], againLater: ['kitchen_replace'] },
    's-lease': { stage: 3, deadline: { y: 4 }, gate: 'K4', scenes: [sc({ card: 'finance_asset', y: 4, hand: 'doc', doc: 'lease' }), sc({ card: 'hq_office', y: 4, hand: 'doc', doc: 'lease-hq' })], alt: ['delivery_car'], again: ['delivery_car'] },
    's-mukei': { stage: 5, deadline: { y: 5 }, gate: 'K7', scenes: [sc({ card: 'ec', y: 5, hand: 'doc', doc: 'software' }), sc({ card: 'ec', y: 5, hand: 'doc', doc: 'software-dep' })], alt: ['merger'], again: ['order_app'] },
    's-rd': { stage: 2, deadline: { y: 3 }, scenes: [sc({ card: 'bowl_limited_y2', y: 2, hand: 'doc', doc: 0, note: '2年目から限定の試作を研究開発費で書く（社長「資産でしょ」）' }), sc({ card: 'frozen_noodle', y: 3, hand: 'doc', doc: 0 })], alt: ['frozen_noodle'], again: ['bowl_limited_y2'] },
    // ===== 有価証券 4 =====
    's-sec': { stage: 3, deadline: { y: 5 }, gate: 'K7', scenes: [sc({ card: 'outside_invest', y: 5, hand: 'calc', calc: 'hasu-risoku' }), sc({ card: 'outside_invest', y: 5, hand: 'doc', doc: 'sec-buy' })], alt: ['partner_stock'], again: ['outside_invest'] },
    's-secval': { stage: 3, deadline: { y: 5 }, gate: 'K7', scenes: [sc({ ev: 'secval', y: 5, hand: 'doc', doc: 'secval' }), sc({ ev: 'secval', y: 5, hand: 'calc', calc: 'secval' })], alt: [], again: ['secval'] },
    's-mankigo': { stage: 3, deadline: { y: 5 }, gate: 'K7', scenes: [sc({ ev: 'amortized', y: 5, hand: 'calc', calc: 'amortized' }), sc({ ev: 'amortized', y: 5, hand: 'doc', doc: 'amortized' })], alt: [], again: ['amortized'] },
    's-sonota': { stage: 3, deadline: { y: 5 }, gate: 'K7', scenes: [sc({ card: 'partner_stock', y: 5, hand: 'doc', doc: 'sonota-val' }), sc({ card: 'partner_stock', y: 5, hand: 'doc', doc: 'kogaisha' })], alt: ['shinise_stock'], again: ['partner_stock'] },
    // ===== 引当金と税効果 2 =====
    's-hikiate': { stage: 2, deadline: { y: 4 }, gate: 'K4', scenes: [sc({ card: 'bonus', y: 3, hand: 'doc', doc: 1 }), sc({ card: 'maintain_y2', y: 3, hand: 'doc', doc: 0 })], alt: ['ec'], again: ['bonus'] },
    's-zeikoka': { stage: 3, deadline: { y: 5 }, gate: 'K8', scenes: [sc({ ev: 'zeikoka', y: 5, hand: 'calc', calc: 'zeikoka' }), sc({ ev: 'zeikoka', y: 5, hand: 'doc', doc: 'zeikoka' })], alt: [], again: ['zeikoka'] },
    // ===== 決算と財務諸表 3 =====
    's-keika': { stage: 1, deadline: { y: 1 }, gate: 'K1', scenes: [sc({ card: 'insurance', doc: 0, y: 1, hand: 'doc' }), sc({ ev: 'prepaid-ins', y: 1, hand: 'doc', doc: 'prepaid' }), sc({ ev: 'accrued', y: 1, hand: 'doc', doc: 'accrued' })], alt: ['line_year'], again: ['prepaid-ins'] },
    's-seisanhyo': { stage: 1, deadline: { y: 1 }, gate: 'K1', scenes: [sc({ ev: 'desk', y: 1, hand: 'read', note: '決算整理の書類を選ぶ（数えない）' }), sc({ ev: 'ni-calc', y: 1, hand: 'calc', calc: 'calc' }), sc({ ev: 'sheet1', y: 1, hand: 'calc', calc: 'sheet' })], alt: [], again: ['sheet1'] },
    's-fs': { stage: 1, deadline: { y: 2 }, gate: 'K1', scenes: [sc({ ev: 'report1', y: 1, hand: 'calc', calc: 'report' }), sc({ ev: 'fs-ratio', y: 1, hand: 'calc', calc: 'calc' }), sc({ ev: 'bank1', y: 1, hand: 'read', note: '銀行の審査の台詞（読むだけ）' })], alt: ['rival_fs'], again: ['report1'] },
    // ===== 本支店会計 1 =====
    's-honshiten': { stage: 2, deadline: { y: 3 }, gate: 'K3', scenes: [sc({ card: 'site2', y: 2, hand: 'doc', doc: 3 }), sc({ ev: 'gappei-fs', y: 3, hand: 'calc', calc: 'gappei-fs' })], alt: ['factory'], again: ['close'] },
    // ===== 連結会計 4 =====
    's-renketsu1': { stage: 5, deadline: { y: 6 }, gate: 'K7', scenes: [sc({ card: 'partner_stock', y: 6, hand: 'calc', calc: 'shihon-renketsu' }), sc({ card: 'ohnami_buy', y: 6, hand: 'doc', doc: 'renketsu-start' })], alt: ['ohnami_buy'], again: ['partner_stock'] },
    's-renketsu2': { stage: 5, deadline: { y: 7 }, gate: 'K7', scenes: [sc({ ev: 'renketsu2', y: 7, hand: 'doc', doc: 'kaishi-shiwake' }), sc({ ev: 'renketsu2', y: 7, hand: 'calc', calc: 'noren-shokyaku' })], alt: [], again: ['renketsu2'] },
    's-naibu': { stage: 5, deadline: { y: 7 }, gate: 'K7', scenes: [sc({ card: 'parent_price', y: 7, hand: 'calc', calc: 'mijitsugen' }), sc({ card: 'parent_price', y: 7, hand: 'doc', doc: 'naibu' })], alt: ['delivery_outsource'], again: ['parent_price'] },
    's-renketsufs': { stage: 5, deadline: { y: 7 }, gate: 'K8', scenes: [sc({ ev: 'consol', y: 7, hand: 'calc', calc: 'consol-sheet' }), sc({ ev: 'k8', y: 8, hand: 'calc', calc: 'consol-sheet' })], alt: [], again: ['consol'] },
    // ===== 工業簿記 16 =====
    'k-flow': { stage: 4, deadline: { y: 4 }, gate: 'K5', scenes: [sc({ ev: 'river', y: 4, hand: 'calc', calc: 'river' }), sc({ card: 'own_noodle', y: 4, hand: 'calc', calc: 'river-small' })], alt: ['own_noodle'], again: ['river'] },
    'k-zairyo': { stage: 4, deadline: { y: 4 }, gate: 'K5', scenes: [sc({ card: 'wheat_up', y: 4, hand: 'doc', doc: 'zairyo-sai' }), sc({ card: 'issue_method', y: 4, hand: 'calc', calc: 'issue-method' })], alt: ['bulk'], again: ['wheat_up'] },
    'k-romu': { stage: 4, deadline: { y: 4 }, gate: 'K5', scenes: [sc({ ev: 'wage', y: 4, hand: 'doc', doc: 'wage-use' }), sc({ ev: 'wage', y: 4, hand: 'calc', calc: 'chinritsu-sai' })], alt: [], again: ['wage'] },
    'k-keihi': { stage: 4, deadline: { y: 4 }, gate: 'K5', scenes: [sc({ ev: 'keihi', y: 4, hand: 'doc', doc: 'keihi' }), sc({ card: 'chashu_out', y: 4, hand: 'doc', doc: 'gaichu' })], alt: [], again: ['keihi'] },
    'k-yotei': { stage: 4, deadline: { y: 4 }, gate: 'K5', scenes: [sc({ card: 'rate', y: 4, hand: 'calc', calc: 'yotei-rate' }), sc({ ev: 'haifu', y: 4, hand: 'doc', doc: 'haifu-sai' })], alt: [], again: ['rate'] },
    'k-bumon': { stage: 4, deadline: { y: 5 }, gate: 'K5', scenes: [sc({ ev: 'bumon', y: 5, hand: 'calc', calc: 'chokusetsu-haifu' }), sc({ ev: 'bumon', y: 5, hand: 'calc', calc: 'sogo-haifu' })], alt: ['hq_alloc'], again: ['bumon'] },
    'k-kobetsu': { stage: 4, deadline: { y: 5 }, gate: 'K5', scenes: [sc({ card: 'custom_order', y: 5, hand: 'calc', calc: 'sashizu' }), sc({ card: 'collab', y: 5, hand: 'calc', calc: 'shison-kobetsu' })], alt: ['collab'], again: ['custom_order'] },
    'k-sogo': { stage: 4, deadline: { y: 4 }, gate: 'K5', scenes: [sc({ ev: 'soup-wip', y: 4, hand: 'calc', calc: 'heikin' }), sc({ ev: 'soup-wip', y: 4, hand: 'calc', calc: 'sakiire' })], alt: ['dough'], again: ['soup-wip'] },
    'k-shison': { stage: 4, deadline: { y: 5 }, gate: 'K5', scenes: [sc({ ev: 'shison', y: 5, hand: 'calc', calc: 'kensaten' }), sc({ ev: 'genson', y: 5, hand: 'calc', calc: 'genson' })], alt: [], again: ['shison'] },
    'k-kotei': { stage: 4, deadline: { y: 5 }, gate: 'K5', scenes: [sc({ card: 'bowl_second', y: 5, hand: 'calc', calc: 'kumibetsu' }), sc({ ev: 'koteibetsu', y: 5, hand: 'calc', calc: 'koteibetsu' })], alt: ['bowl_second'], again: ['bowl_second'] },
    'k-hyojun': { stage: 4, deadline: { y: 5 }, gate: 'K5', scenes: [sc({ card: 'std', y: 5, hand: 'calc', calc: 'sai-bunseki' }), sc({ ev: 'schlatter', y: 5, hand: 'calc', calc: 'schlatter' })], alt: [], again: ['std'] },
    'k-chokusetsu': { stage: 4, deadline: { y: 5 }, gate: 'K5', scenes: [sc({ card: 'volume', y: 5, hand: 'calc', calc: 'direct-cost' }), sc({ card: 'volume', y: 5, hand: 'calc', calc: 'kotei-chosei' })], alt: [], again: ['volume'] },
    'k-cvp': { stage: 1, deadline: { y: 2 }, gate: 'K3', scenes: [sc({ ev: 'cvp-hire', y: 1, hand: 'calc', calc: 'calc' }), sc({ ev: 'cvp', y: 1, hand: 'calc', calc: 'calc' })], alt: ['site2', 'price'], again: ['cvp-hire'], againLater: ['site2'] },
    'k-hokoku': { stage: 4, deadline: { y: 5 }, gate: 'K8', scenes: [sc({ ev: 'genka-hokoku', y: 5, hand: 'calc', calc: 'hokokusho' }), sc({ ev: 'k8', y: 8, hand: 'calc', calc: 'hokokusho' })], alt: [], again: ['genka-hokoku'] },
    'k-honsha': { stage: 4, deadline: { y: 5 }, gate: 'K5', scenes: [sc({ card: 'separate', y: 5, hand: 'doc', doc: 'kojo-kanjo' }), sc({ card: 'separate', y: 5, hand: 'doc', doc: 'honsha-kanjo' })], alt: [], again: ['separate'] },
    'k-kessan': { stage: 4, deadline: { y: 5 }, gate: 'K5', scenes: [sc({ ev: 'factory-close', y: 4, hand: 'doc', doc: 'genka-sai' }), sc({ ev: 'factory-close', y: 5, hand: 'calc', calc: 'sai-fuka' })], alt: [], again: ['factory-close'] },
  };
  // 段ごとの数（l.1 の表）：切り身26・2年目12・3年目12・4〜5年目20・5〜7年目7
  SIM.scopeStages = { 1: '切り身（1年目＋翌4月）', 2: '2年目（S2）', 3: '3年目（S3）', 4: '4〜5年目（S4）', 5: '5〜7年目（S5）' };
})(typeof window !== 'undefined' ? window : globalThis);
