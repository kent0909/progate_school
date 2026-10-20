// ピヨ商店の2年目（docs/YEAR2.md）。1年目（scenario.js）の月のあとに続く。
// 書くときの約束は scenario.js の冒頭と同じ（tools/lexicon-check.js・sim-check.js が検査する）。
// ・2年目の月には year: 2。ラベルは「2年目 4月」のように年をつける
// ・1か月に新しい原理は1つ、新しい勘定科目は2つ、発見は2つまで。社長の台詞に会計用語を出さない
// ・金額は1年目の判断で変わる。帳簿（正しいほう）の残高から計算する
(function () {
  const SIM = window.SIMDATA;
  const { SHOP, opts, je, passbook, yen, D_, bSale } = SIM.__h;
  const Y = 2;
  const L = (m) => `2年目 ${m}月`;
  // 帳簿（正しいほう）の残高。科目ごと、締め切りも含めた今の残高
  const bal = (S, acc) => S.T.reduce((t, e) => t + e.dr.filter(([a]) => a === acc).reduce((x, [, v]) => x + v, 0) - e.cr.filter(([a]) => a === acc).reduce((x, [, v]) => x + v, 0), 0);
  const credit = (S, acc) => -bal(S, acc);
  // 1年目の税金（3月に未払法人税等として書いた額）と、1年目の締め切りで繰越利益剰余金に移したもうけ。あとで動かない値
  const tax1 = (S) => S.T.filter((e) => (e.y || 1) === 1).reduce((t, e) => t + e.cr.filter(([a]) => a === '未払法人税等').reduce((x, [, v]) => x + v, 0), 0);
  const re1 = (S) => S.T.filter((e) => e.closing && (e.y || 1) === 1).reduce((t, e) => t + e.cr.filter(([a]) => a === '繰越利益剰余金').reduce((x, [, v]) => x + v, 0) - e.dr.filter(([a]) => a === '繰越利益剰余金').reduce((x, [, v]) => x + v, 0), 0);
  const down = (n, u = 10000) => Math.floor(n / u) * u;
  const tax8 = (n) => Math.floor(n * 0.08), tax10 = (n) => Math.floor(n * 0.1);

  // ---------- 2年目の取引の部品（5月から消費税の行がつく） ----------
  const VAT_FROM = 5;
  const vat = (m) => m >= VAT_FROM || m <= 3;
  // B社の毎月の注文。1年目に督促の手紙で怒らせた枝は、4〜6月も半分のまま（信頼が戻るのに3か月）
  const bAmt = (S, m) => (D_(S).dun === 'send' && m >= 4 && m <= 6 ? 70000 : 140000);
  const bWith = (S, m) => bAmt(S, m) + (vat(m) ? tax8(bAmt(S, m)) : 0);
  const sellB2 = (m) => ({ t: 'doc', kind: vat(m) ? 'sell_credit_vat' : 'sell_credit', id: `y2sell${m}-B社`,
    doc: { type: '請求書（控え）', title: '請求書', from: SHOP, to: 'B社', date: `${m}月20日`, rows: (S) => vat(m) ? [['品名', 'レモネード（業務用）'], ['税抜の金額', bAmt(S, m), 'amt'], ['消費税（8％）', tax8(bAmt(S, m)), 'amt'], ['合計', bWith(S, m), 'amt'], ['お支払期日', '翌月末']] : [['品名', 'レモネード（業務用）'], ['金額', bAmt(S, m), 'amt'], ['お支払期日', '翌月末']] },
    ans: (S) => vat(m) ? je([['売掛金', bWith(S, m)]], [['売上', bAmt(S, m)], ['仮受消費税', tax8(bAmt(S, m))]]) : je([['売掛金', bAmt(S, m)]], [['売上', bAmt(S, m)]]),
    opts: opts('仮受消費税', '仮払消費税') });
  const colB2 = (m) => ({ t: 'doc', kind: 'collect_ar', id: `y2col${m}-B社`,
    doc: { ...passbook(`${m}月末`, 'B社から 代金のお支払い', 'お預け入れ', 0), rows: (S) => [['摘要', 'B社から 代金のお支払い（先月分）'], ['お預け入れ', m === 4 ? bSale(S, 3) : bWith(S, m - 1), 'amt']] },
    ans: (S) => { const a = m === 4 ? bSale(S, 3) : bWith(S, m - 1); return je([['普通預金', a]], [['売掛金', a]]); }, opts: opts() });
  const BUY = 90000;
  const buyWith = (m) => BUY + (vat(m) ? tax8(BUY) : 0);
  const buy2 = (m) => ({ t: 'doc', kind: vat(m) ? 'buy_credit_vat' : 'buy_credit', id: `y2buy${m}`,
    doc: { type: '請求書', title: '請求書', from: 'ハッピー問屋', to: SHOP, date: `${m}月5日`, rows: vat(m) ? [['品名', 'レモン・砂糖・紙コップ（お店用）'], ['税抜の金額', BUY, 'amt'], ['消費税（8％）', tax8(BUY), 'amt'], ['合計', buyWith(m), 'amt'], ['お支払期日', '翌月末']] : [['品名', 'レモン・砂糖・紙コップ（お店用）'], ['金額', BUY, 'amt'], ['お支払期日', '翌月末']] },
    ans: vat(m) ? je([['仕入', BUY], ['仮払消費税', tax8(BUY)]], [['買掛金', buyWith(m)]]) : je([['仕入', BUY]], [['買掛金', BUY]]),
    opts: opts('仮受消費税', '仮払消費税') });
  const payAP2 = (m) => ({ t: 'doc', kind: 'pay_ap', id: `y2pap${m}`, doc: passbook(`${m}月末`, '振込 ハッピー問屋（先月分の商品代金）', 'お引出し', m === 4 ? BUY : buyWith(m - 1)),
    ans: je([['買掛金', m === 4 ? BUY : buyWith(m - 1)]], [['普通預金', m === 4 ? BUY : buyWith(m - 1)]]), opts: opts() });
  // 屋台と2号店のレジ締め日報（2号店は7月から）
  const cash2 = (m, shop, amt) => ({ t: 'doc', kind: vat(m) ? 'cash_sale_vat' : 'cash_sale', id: `y2cs${m}-${shop}`,
    doc: { type: 'レジ締め日報', title: `${m}月のレジ締め日報（${shop}）`, from: `${shop}レジ`, to: '経理', date: `${m}月末`, rows: vat(m) ? [['売れた金額（税込）', amt + tax8(amt), 'amt'], ['うち 税抜の金額', amt, 'amt'], ['うち 消費税（8％）', tax8(amt), 'amt'], ['メモ', '毎日、閉店後にATMで普通預金へ入金ずみ']] : [['売れた金額', amt, 'amt'], ['メモ', '毎日、閉店後にATMで普通預金へ入金ずみ']] },
    ans: vat(m) ? je([['普通預金', amt + tax8(amt)]], [['売上', amt], ['仮受消費税', tax8(amt)]]) : je([['普通預金', amt]], [['売上', amt]]), opts: opts('仮受消費税', '仮払消費税') });
  const salary2 = (m, amt) => ({ t: 'doc', kind: 'pay_salary', id: `y2sal${m}`, doc: passbook(`${m}月25日`, `給与振込（${amt > 30000 ? 'お店のスタッフ6名' : 'アルバイト3名'}）`, 'お引出し', amt),
    ans: je([['給料', amt]], [['普通預金', amt]]), opts: opts() });
  const routine2 = (m) => [buy2(m), sellB2(m), colB2(m), payAP2(m), salary2(m, m >= 7 || m <= 3 ? 60000 : 30000), cash2(m, '屋台', 30000), ...(m >= 7 || m <= 3 ? [cash2(m, '2号店', 90000)] : [])];

  // ---------- 名前の札・はじめての動き・自動仕訳の型（2年目のぶん） ----------
  Object.assign(SIM.namings, {
    支払家賃: { q: '2号店の家賃を払った。お店を借りて使うためのお金。これは？', opts: [
      { t: 'じぶんのお金をへらした原因（費用）', ok: true },
      { t: 'もっているもの（資産）', react: 'お店そのものは大家さんのもの。ピヨ商店が手に入れたのは「使わせてもらうこと」で、使ったぶんだけ消えていく' },
    ], line: 'お店や事務所を借りて払うお金は、費用の「支払家賃」。', teaches: ['支払家賃'] },
    機械装置: { q: '瓶詰めの機械（充填ライン）。何年も使って瓶詰めを作る。これは？', opts: [
      { t: 'もっているもの（資産）', ok: true },
      { t: 'じぶんのお金をへらした原因（費用）', react: '1年で使い切るものではない。トラックと同じで、何年も役に立つ' },
    ], line: '物を作る機械は、資産の「機械装置」。トラックは車両運搬具、機械は機械装置、と分けて書く。', teaches: ['機械装置'] },
    未払配当金: { q: '株主総会で配当を決めた。払うのは来月。いま、まだ払っていない配当は？', opts: [
      { t: '返すお金（負債）', ok: true },
      { t: '返さないお金（純資産）', react: '総会で決めたので、株主に払う約束ができた。約束のあるお金は、どっちだった？' },
    ], line: '決めたけれどまだ払っていない配当は、負債の「未払配当金」。', teaches: ['未払配当金'] },
  });
  Object.assign(SIM.kindIntro, {
    sell_credit_vat: { move: '3行', q: '請求書に「消費税」の行が増えた。B社から受け取る合計のうち、ピヨ商店のもうけになるのは？', opts: [
      { t: '税抜の金額だけ。消費税は、国に渡すために預かるお金', ok: true },
      { t: '合計の全部', react: '消費税の分は、年の終わりに国に渡す。ピヨ商店のものにはならない' },
    ], line: '右に2行書く。売上（税抜）と、預かった消費税。左は受け取る合計。' },
    buy_credit_vat: { move: '3行', q: '問屋の請求書にも消費税の行。問屋に払った消費税は、どうなる？', opts: [
      { t: '国に渡す消費税から、あとで引いてもらえる', ok: true },
      { t: 'レモンの値段の一部', react: 'レモンの値段は税抜の金額。払った消費税は、預かった消費税と差し引きできる' },
    ], line: '左に2行書く。仕入（税抜）と、払った消費税（仮払消費税）。右は払う合計。' },
    machine: { move: '資産+', q: '充填ラインの請求書。本体のほかに、運搬・据付・試運転のお金がある。去年のトラックと同じ？', opts: [
      { t: '同じ。使える状態にするまでのお金は、機械の値段に入れる', ok: true },
      { t: 'ちがう。本体だけが機械の値段', react: '据え付けて試運転しないと、瓶は作れない。トラックの登録と同じだね' },
    ], line: '機械も、使える状態にするまでのお金（付随費用）を足して記帳する。消費税は別の行に。' },
    dividend_pay: { move: '負債-', q: '先月決めた配当を、株主に振り込んだ。何がへった？', opts: [
      { t: '株主に払う約束（未払配当金）', ok: true },
      { t: '繰越利益剰余金', react: '繰越利益剰余金は、総会で配当を決めた先月、もうへらしたね。今日は約束を果たしただけ' },
    ], line: '負債がへったので、左（借方）に未払配当金。右は普通預金。' },
  });
  Object.assign(SIM.rules, {
    sell_credit_vat: { y: 2, label: '商品の掛け売り（消費税つき）', entry: [['売掛金'], ['売上', '仮受消費税']], conds: [
      { t: '商品を掛けで売り、請求書に消費税の行があるとき', ok: true },
      { t: 'B社に請求書を出したとき', ok: false, why: '同じB社でも、保守つきのマシンのように売上を分ける取引がある。「何を、どう売ったか」で決めよう' },
    ] },
    buy_credit_vat: { y: 2, label: '商品の掛け仕入れ（消費税つき）', entry: [['仕入', '仮払消費税'], ['買掛金']], conds: [
      { t: 'お店で売る商品を掛けで仕入れ、請求書に消費税の行があるとき', ok: true },
      { t: 'ハッピー問屋から請求書が来たとき', ok: false, why: '問屋からは、瓶詰めの材料も届くようになる。「お店で売る商品か」で決めよう' },
    ] },
    cash_sale_vat: { y: 2, label: 'お店の売上（消費税つき）', entry: [['普通預金'], ['売上', '仮受消費税']], conds: [
      { t: 'お店で商品を売り、その日のうちに預金へ入れたとき', ok: true },
      { t: '預金にお金が入ったとき', ok: false, why: '教室の月謝のように、先にもらうお金も預金に入る。売上かどうかは「商品を渡したか」で決まる' },
    ] },
  });

  // ---------- 2年目 4月：開始記入、増資（E10） ----------
  const offerOf = (S) => ((S.carry || {}).y1 || {}).offer || 0;
  const capOf0 = (S) => (D_(S).uncle === 'equity' ? 400000 : 300000); // 増資の前の資本金
  const capOf = capOf0;
  const ZOUSHI = 3000000, FEE = 20000;
  const m4 = { m: 4, year: Y, label: L(4), title: '2号店を出す。お金は株主から', events: [
    { t: 'opening', id: 'opening2', p: 'P1' },
    { t: 'talk', lines: (S) => [['shacho', offerOf(S) ? `銀行は ${yen(offerOf(S))}円までなら貸すって。でも2号店と瓶詰めの機械には足りないんだ。` : '銀行は、今は貸せないって。2号店と瓶詰めの機械のお金が足りないんだ。'], ['shacho', 'さくら投資の佐藤さんが、300万円出してくれるって。そのかわり、株を300株わたす。手数料も2万円払っておいたよ。']] },
    { t: 'discover', id: 'd-zoushi', moves: ['資産+', '純資産+'], p: 'P2', title: '300万円は、全部返さないお金？',
      b1: { talk: [['shacho', '300万円、全部返さないお金でいいよね。大きいほうがカッコいい。'], ['piyo', '手数料の2万円は、そこから引くピヨ？']],
        doc: { type: '通帳', title: '普通預金 通帳', from: 'みらい銀行', to: SHOP, date: '4月5日', rows: [['摘要', '入金 さくら投資（株式300株の払込み）'], ['お預け入れ', ZOUSHI, 'amt']] } },
      predict: { q: '株主が出した300万円。返さないお金は、いくら増えると思う？', opts: [{ t: '300万円', ok: true }, { t: '298万円（手数料を引く）' }, { t: '増えない' }] },
      b2: { q: '佐藤さんの300万円と、手数料の2万円。返さないお金の札は、いくらにする？', token: '払い込まれた 3,000,000', layout: 'options', targets: [
        { id: 'all', label: '300万円。手数料は別に書く', ok: true },
        { id: 'net', label: '手数料を引いた298万円', ok: false, react: '佐藤さんが出したのは300万円。手数料は、株を出すために会社が別に払ったお金だね' },
      ], reasons: [
        { t: '株主が出したお金は全部、返さないお金。手数料は会社が使った別の出来事だから', ok: true },
        { t: '口座に最後に残る額で決めるから', ok: false, fork: '入れ物で決める', react: '口座の残りで決めると、何が起きたかが分からなくなる。出してもらった額と、使った額を分けて書く' },
        { t: '手数料は株主のために使ったから、株主のお金から引く', ok: false, fork: '費用と元手の混同', react: '手数料は、会社が株を出すのに使ったお金。株主が出した元手とは別に、会社の費用にする' },
      ], hints: ['佐藤さんは、いくら払い込んだ？', '手数料を払ったのは、だれ？'] },
      b3: { ok: '返さないお金が300万円増え、手数料2万円は会社の費用。出してもらった額と、使った額を分けた。', bs: { 資産: [['普通預金', ZOUSHI]], 純資産: [['株主が出したお金', ZOUSHI]] } },
      b4: { name: '資本準備金・株式交付費', line: '株主が出したお金のうち、資本金にしないで別にとっておく分を「資本準備金」という。半分までは資本金にしなくてよい、と会社法で決まっている。株を出すときの手数料は、費用の「株式交付費」。',
        exam: '「株式を発行し、払込金は普通預金とした。払込金のうち会社法で認められる最低額を資本金とする」', teaches: ['資本準備金', '株式交付費', '会社法'], leaf: { p: 'P2', label: '資本金と資本準備金' } },
      hand: '株式を発行したら、株主が払い込んだお金の全額を資本金にするのが原則。ただし、2分の1までは資本金にしないで資本準備金にできる（会社法）。株式交付費（株を出すための手数料など）は、原則として支払った年の費用。会社をつくるときや、開業の準備にかかった費用も、似た扱いになる。' },
    { t: 'decision', id: 'capital', q: '300万円のうち、資本金にいくら入れる？', talk: [['shacho', '資本金は大きいほうが立派に見えるよね。全部入れよう。'], ['senpai', '半分を資本準備金にすることもできる。どちらも認められている。']],
      trial: (S, o) => { const c = capOf(S) + (o === 'all' ? ZOUSHI : ZOUSHI / 2); return [['資本金', c], ['資本準備金', o === 'all' ? 0 : ZOUSHI / 2], ['資本金の4分の1', c / 4]]; },
      options: [
        { id: 'all', label: '社長の言うとおり、全部を資本金に', desc: '資本金が大きく見える', result: '300万円をすべて資本金にする。' },
        { id: 'half', label: '半分の150万円を資本準備金に', desc: '法律で認められた最低額だけ資本金に', result: '資本金に150万円、資本準備金に150万円。' },
      ] },
    { t: 'doc', kind: 'zoushi', id: 'zoushi', doc: { type: '通帳', title: '普通預金 通帳', from: 'みらい銀行', to: SHOP, date: '4月5日', rows: (S) => [['摘要', '入金 さくら投資（株式300株の払込み）'], ['お預け入れ', ZOUSHI, 'amt'], ...(D_(S).capital === 'half' ? [['（メモ）資本金にする額', ZOUSHI / 2, 'amt'], ['（メモ）資本準備金にする額', ZOUSHI / 2, 'amt']] : [])] },
      ans: (S) => (D_(S).capital === 'half' ? je([['普通預金', ZOUSHI]], [['資本金', ZOUSHI / 2], ['資本準備金', ZOUSHI / 2]]) : je([['普通預金', ZOUSHI]], [['資本金', ZOUSHI]])), opts: opts('資本準備金', '株式交付費') },
    { t: 'doc', kind: 'stockfee', id: 'stockfee', doc: { type: '請求書', title: '請求書（株式の発行の手続き）', from: 'みらい証券', to: SHOP, date: '4月5日', rows: [['内容', '株式の発行の手続き・登記の手数料'], ['金額', FEE, 'amt'], ['お支払い', '4月5日 口座から引き落とし']] },
      ans: je([['株式交付費', FEE]], [['普通預金', FEE]]), opts: opts('資本準備金', '株式交付費', '支払手数料') },
    { t: 'talk', lines: (S) => [['senpai', `株主は${D_(S).uncle === 'equity' ? '4' : '3'}人になった。佐藤さんの300株は、全部の株の${Math.round((300 / (300 + (D_(S).uncle === 'equity' ? 40 : 30))) * 100)}％。会社の大事なことは、株の多い人の意見で決まる。`], ['shacho', 'え、ぼくより佐藤さんのほうが多いの？ …まあ、お金を出してくれたしね。']] },
    payAP2(4), colB2(4), buy2(4), sellB2(4), salary2(4, 30000), cash2(4, '屋台', 30000),
  ] };

  // ---------- 2年目 5月：消費税（E13）、去年の税金を納める（E14前半） ----------
  const m5 = { m: 5, year: Y, label: L(5), title: '預かった消費税で、仕入れを増やそう', events: [
    { t: 'talk', teaches: ['消費税', 'インボイス', '税抜'], lines: [['eigyo', 'B社から「5月から、消費税の行がある請求書（インボイス）にしてほしい」って。社長が税務署で手続きしてくれた。'], ['senpai', 'これからの請求書は、税抜の金額と消費税を分けて書く。お客さんは、合計を払う。'], ['shacho', 'これで請求書の合計が増えるね。口座のお金も増える！']] },
    { t: 'discover', id: 'd-shohizei', moves: ['資産+', '負債+'], p: 'P2', title: '請求書の消費税は、だれのお金？',
      b1: { talk: [['shacho', '口座に、消費税のぶんも入ってくるよね。これで仕入れを増やせる。'], ['zeirishi', 'その消費税、年の終わりにどうなるか、知っていますか？']],
        doc: { type: '請求書（控え）', title: '請求書', from: SHOP, to: 'B社', date: '5月20日', rows: [['品名', 'レモネード（業務用）'], ['税抜の金額', 140000, 'amt'], ['消費税（8％）', 11200, 'amt'], ['合計', 151200, 'amt']] } },
      predict: { q: '請求書の11,200円は、年の終わりにどうなると思う？', opts: [{ t: 'ピヨ商店のもうけになる' }, { t: '国に納める', ok: true }, { t: 'B社に返す' }] },
      b2: { q: '3枚の札を、どの棚に置く？', layout: 'sort', tokens: [
        { id: 'uri', label: '売上 140,000', target: 'rev' },
        { id: 'uke', label: 'B社から預かった消費税 11,200', target: 'debt' },
        { id: 'hara', label: '問屋に払った消費税 7,200', target: 'asset' },
      ], targets: [{ id: 'rev', label: 'じぶんのお金を増やした原因（収益）' }, { id: 'debt', label: 'あとで国に納める約束（負債）' }, { id: 'asset', label: 'あとで国に納める額から引ける権利（資産）' }],
      wrongReact: '預かった消費税は、ピヨ商店のものではない。年の終わりに国に納める。問屋に払った消費税は、その納める額から引ける。', reasons: [
        { t: '預かっただけで、年の終わりに国に渡すから', ok: true },
        { t: '口座に入ったお金は、全部売上だから', ok: false, fork: '入れ物で決める', react: '口座に入っても、ピヨ商店のものとは限らない。預かったお金もある' },
        { t: '税金は全部、費用だから', ok: false, fork: '預かりと負担の混同', react: 'もうけにかかる税金（法人税等）は費用。でも消費税は、お客さんが負担して、ピヨ商店は預かって納めるだけ' },
      ], hints: ['11,200円を最後に負担するのは、だれ？', '年の終わりに、ピヨ商店はそのお金をどうする？'] },
      b3: { ok: '預かった消費税は負債、払った消費税は資産。年の終わりに差し引きして、残りを国に納める。もうけは税抜の金額だけ。', bs: { 資産: [['売掛金', 151200], ['払った消費税', 7200]], 負債: [['預かった消費税', 11200]] } },
      b4: { name: '仮受消費税・仮払消費税（税抜方式）', line: '預かった消費税は負債の「仮受消費税」、払った消費税は資産の「仮払消費税」。売上や仕入を税抜の金額で書くやり方を「税抜方式」という。年の終わりに差し引きして、納める額を出す。',
        exam: '「消費税の処理は税抜方式による」', teaches: ['仮受消費税', '仮払消費税', '税抜方式'], leaf: { p: 'P2', label: '預かった消費税' } },
      hand: '税抜方式では、売上・仕入を税抜の額で書き、消費税は仮受消費税（負債）・仮払消費税（資産）に分ける。決算で「仮受消費税−仮払消費税」を計算し、国に納める約束（負債）にして、翌年に納める。払ったほうが多ければ、国から戻ってくる。' },
    { t: 'decision', id: 'vat', q: '口座のお金のうち、預かった消費税の分をどうする？', talk: [['shacho', '口座にお金があるんだから、使っていいでしょ。来年の分は来年考えればいいよ。'], ['senpai', '口座の帯に「預かり」の線を引いておく、というやり方もある。']],
      trial: (S, o) => [['5月の終わりに預かっている消費税（見込み）', 11200 + 2400 - 7200], ['口座の帯', o === 'line' ? '預かり分に線を引き、その分は使わない' : '線は引かない。全部を使えるお金として見る']],
      options: [
        { id: 'line', label: '預かり分に線を引いて、使わない', desc: '使えるお金が少なく見える', result: 'これから毎月、口座の帯に「預かり」の線を引く。' },
        { id: 'follow', label: '社長の言うとおり、線は引かない', desc: '口座のお金を全部使える', result: '口座のお金は、全部使えるお金として見る。' },
      ] },
    { t: 'talk', when: (S) => D_(S).vat === 'line', diary: '5月：口座の帯に、預かった消費税の線を引いた', lines: [['senpai', 'これで口座の帯に、預かり分の線が出る。線より上が、本当に使えるお金だ。']] },
    { t: 'talk', when: (S) => D_(S).vat === 'follow', diary: '5月：預かった消費税も、使えるお金として見ることにした', lines: [['zeirishi', '分かりました。ただ、来年の5月には、1年分を まとめて納めますよ。']] },
    { t: 'doc', kind: 'pay_tax', id: 'pay-tax1', when: (S) => tax1(S) > 0,
      doc: { type: '納付書（領収済）', title: '法人税等の納付書（1年目の分）', from: '税務署', to: SHOP, date: '5月31日', rows: (S) => [['納めた税金（1年目のもうけの分）', tax1(S), 'amt'], ['お支払い', '普通預金から']] },
      ans: (S) => je([['未払法人税等', tax1(S)]], [['普通預金', tax1(S)]]), opts: opts('未払法人税等', '法人税等') },
    { t: 'talk', when: (S) => tax1(S) > 0, lines: [['zeirishi', '去年のもうけの税金は、去年の費用として書いてありました。今年は、払うだけです。']] },
    payAP2(5), colB2(5), buy2(5), sellB2(5), salary2(5, 30000), cash2(5, '屋台', 30000),
  ] };

  // ---------- 2年目 6月：配当（E11）と株主資本等変動計算書（E12） ----------
  // 配当の1/10を利益準備金に積む（資本準備金と利益準備金の合計が資本金の1/4になるまで）
  // 値は総会の前の姿で固定する（記帳のたびに変わらないように）
  const reNow = (S) => re1(S);
  const capNow = (S) => capOf0(S) + (D_(S).capital === 'half' ? ZOUSHI / 2 : ZOUSHI);
  const resNow = (S) => (D_(S).capital === 'half' ? ZOUSHI / 2 : 0);
  const needRes = (S) => resNow(S) < capNow(S) / 4; // まだ積む必要があるか
  const divLimit = (S) => (needRes(S) ? down(reNow(S) / 1.1) : down(reNow(S)));
  const divOf = (S) => ({ all: reNow(S), max: divLimit(S), half: down(divLimit(S) / 2), none: 0 }[D_(S).dividend] || 0);
  const resOf = (S) => (D_(S).dividend === 'all' || !needRes(S) ? 0 : Math.min(divOf(S) / 10, capNow(S) / 4 - resNow(S)));
  SIM.__div = { divOf, resOf, divLimit, reNow };
  const shareholders = (S) => [['ミライ社長', 20], ['ユウタさん', 10], ...(D_(S).uncle === 'equity' ? [['ミライ ゲンジさん', 10]] : []), ['さくら投資（佐藤さん）', 300]];
  const m6 = { m: 6, year: Y, label: L(6), title: 'もうけは、全部配ろう', events: [
    { t: 'talk', lines: [['senpai', '6月は株主総会。決算から3か月以内に、株主に1年の結果を報告して、もうけの使い道を決める。'], ['shacho', '佐藤さんも来るよ。去年のもうけ、全部配っちゃおう！']] },
    { t: 'discover', id: 'd-haito', moves: ['純資産-', '負債+'], p: 'P2', title: '配れる上限は、どこ？',
      b1: { talk: [['shacho', '去年のもうけ、全部配ろう。佐藤さんも喜ぶよ。'], ['senpai', '配るときには、守る約束がある。']], dyn: (S) => `これまでのもうけの貯まり（繰越利益剰余金）：${yen(reNow(S))}円　資本金：${yen(capNow(S))}円　準備金の合計：${yen(resNow(S))}円` },
      predict: { q: '配れる上限は、去年のもうけと比べてどうだと思う？', opts: [{ t: '同じ' }, { t: '少ない', ok: true }, { t: '多い' }] },
      b2: { q: '株主に分けるたびに、分ける額の10分の1を会社に残す約束がある（準備金が資本金の4分の1になるまで）。上限はどこ？', token: 'これまでのもうけの貯まり', layout: 'options', targets: [
        { id: 'all', label: 'もうけの貯まりの全部', ok: false, react: '全部配ると、10分の1を残す分がなくなる。配る額と、残す額の合計が、貯まりの中に収まらないといけない' },
        { id: 'limit', label: '配る額＋その10分の1が、貯まりに収まるところまで', ok: true },
        { id: 'cash', label: '口座にあるお金まで', ok: false, react: '口座のお金には、佐藤さんの300万円も入っている。配れるのは、会社がかせいだもうけの貯まりから' },
      ], reasons: [
        { t: '配るたびに10分の1を会社に残す約束があり、それも貯まりから出すから', ok: true },
        { t: '口座にあるだけ配れるから', ok: false, fork: '純資産と現金の取り違え', react: '口座のお金と、配れるもうけの貯まりは別のもの' },
        { t: 'もうけは株主のものだから、全部配ってよいから', ok: false, fork: '純資産＝分配可能額', react: 'もうけは株主のもの。でも、会社にお金を貸している人を守るために、全部は配れない約束がある' },
      ], hints: ['10分の1を残すお金は、どこから出す？', '口座のお金には、何が入っている？'] },
      b3: { ok: '配る額と、その10分の1の合計が、もうけの貯まりに収まるところまで。準備金がもう資本金の4分の1に達していれば、10分の1を残す必要はない。' },
      b4: { name: '配当・利益準備金・分配可能額', line: '株主にもうけを分けることを「配当」という。配るたびに10分の1を「利益準備金」として会社に残す（準備金の合計が資本金の4分の1になるまで）。配れる上限を「分配可能額」という。会社法の約束で、純資産が300万円未満なら1円も配れない。',
        exam: '「繰越利益剰余金を財源として配当を行う。会社法の定める額を利益準備金として積み立てる」', teaches: ['配当', '利益準備金', '分配可能額'], leaf: { p: 'P2', label: '配当と準備金' } },
      hand: '剰余金の配当をするときは、配当額の10分の1を、資本準備金と利益準備金の合計が資本金の4分の1に達するまで積み立てる（会社法）。繰越利益剰余金から配当するなら利益準備金に。仕訳は、繰越利益剰余金をへらして、株主に払う約束と利益準備金を増やす。' },
    { t: 'decision', id: 'dividend', q: 'いくら配当する？', talk: [['shacho', '全部配ろうよ。佐藤さんにいいところを見せたい。'], ['senpai', '上限を超えないか、残す額はいくらか、確かめてから決めよう。瓶詰めの機械にも、お金がいる。']],
      trial: (S, o) => { const d = { all: reNow(S), max: divLimit(S), half: down(divLimit(S) / 2), none: 0 }[o]; const r = o === 'all' || !needRes(S) ? 0 : Math.min(d / 10, capNow(S) / 4 - resNow(S)); return [['配る額', d], ['会社に残す準備金', r], ['配ったあとのもうけの貯まり', reNow(S) - d - r], ['配当の上限（10分の1を残すとき）', divLimit(S)]]; },
      options: [
        { id: 'all', label: '社長の言うとおり、もうけの貯まりを全部配る', desc: '佐藤さんが喜ぶ', result: 'もうけの貯まりを、全部株主に配る。' },
        { id: 'max', label: '上限いっぱいまで配る', desc: '10分の1を残したうえで、いちばん多く', result: '上限まで配り、10分の1を利益準備金に残す。', ending: ['be5-warn', 'be5-final'] },
        { id: 'half', label: '上限の半分を配る', desc: '機械のためにお金を残す', result: '上限の半分を配り、10分の1を残す。' },
        { id: 'none', label: '今年は配らない', desc: '全部を機械と2号店に使う', result: '配当はしない。' },
      ] },
    { t: 'doc', kind: 'dividend', id: 'dividend-dec', when: (S) => D_(S).dividend !== 'none',
      doc: { type: '株主総会議事録', title: '定時株主総会議事録（抜粋）', from: SHOP, to: '株主のみなさま', date: '6月25日', rows: (S) => [['第2号議案', '剰余金の配当の件　可決'], ['配当の総額', divOf(S), 'amt'], ...(resOf(S) ? [['積み立てる利益準備金', resOf(S), 'amt'], ['繰越利益剰余金からへらす額', divOf(S) + resOf(S), 'amt']] : []), ['お支払い', '7月10日']] },
      ans: (S) => je([['繰越利益剰余金', divOf(S) + resOf(S)]], [['未払配当金', divOf(S)], ...(resOf(S) ? [['利益準備金', resOf(S)]] : [])]), opts: opts('繰越利益剰余金', '未払配当金', '利益準備金', '資本準備金') },
    { t: 'discover', id: 'd-ss', moves: [], p: 'P5', title: '純資産の1年を、1枚で',
      b1: { talk: [['kabunushi', '佐藤です。去年から今日までに、会社の返さないお金がなぜ動いたのか、1枚で説明してもらえますか。'], ['shacho', '決算書を渡せば分かるでしょ？']] },
      predict: { q: '貸借対照表を見れば、純資産がなぜ動いたかは分かると思う？', opts: [{ t: '分かる' }, { t: '残りは分かるが、動いた理由は分からない', ok: true }] },
      b2: { q: '純資産を動かした出来事を、どの行に置く？', layout: 'sort', tokens: (S) => [
        { id: 'zou', label: `増資（資本金にした分）${yen(D_(S).capital === 'half' ? ZOUSHI / 2 : ZOUSHI)}`, target: 'cap' },
        ...(D_(S).capital === 'half' ? [{ id: 'zou2', label: `増資（資本準備金にした分）${yen(ZOUSHI / 2)}`, target: 'capres' }] : []),
        { id: 'ni', label: '去年1年のもうけ', target: 're' },
        ...(divOf(S) ? [{ id: 'div', label: `配当 △${yen(divOf(S))}`, target: 're' }] : []),
        ...(resOf(S) ? [{ id: 'res', label: `利益準備金の積立 ${yen(resOf(S))}`, target: 'res' }] : []),
      ], targets: [{ id: 'cap', label: '資本金の行' }, { id: 'capres', label: '資本準備金の行' }, { id: 'res', label: '利益準備金の行' }, { id: 're', label: '繰越利益剰余金の行' }],
      wrongReact: '株主が出したお金は資本金か資本準備金、かせいだもうけと配当は繰越利益剰余金、残す約束の分は利益準備金。原因ごとに行を分ける。', reasons: [
        { t: '株主が知りたいのは「なぜ動いたか」だから', ok: true },
        { t: '貸借対照表を写せば足りるから', ok: false, fork: '残高と変動の混同', react: '貸借対照表は1年の終わりの残りだけ。増資や配当で動いた理由は見えない' },
      ], hints: ['佐藤さんの300万円は、どの行？', '配当は、どの行をへらした？'] },
      b3: { ok: '行は純資産の項目、列は「はじめ・動いた理由・終わり」。終わりの合計は、貸借対照表の純資産と一致する。' },
      b4: { name: '株主資本等変動計算書', line: '純資産の1年の動きを、原因ごとに見せる表を「株主資本等変動計算書」という。読む人（株主）が「会社のお金がなぜ動いたか」を判断するための表。決算書をどう並べて見せるかを「表示」という。',
        exam: '「株主資本等変動計算書を完成しなさい」', teaches: ['株主資本等変動計算書', '表示'], leaf: { p: 'P5', label: '純資産の動きの表' } },
      hand: '株主資本等変動計算書：項目は資本金・資本準備金・利益準備金・繰越利益剰余金。動いた理由は、株の発行・配当・利益準備金の積立・1年のもうけ。終わりの残りは、貸借対照表の純資産と一致する。' },
    { t: 'decision', id: 'ss', q: '佐藤さんに出す表を、どうする？', talk: [['shacho', '細かいところは、適当でいいよ。佐藤さんも忙しいし。'], ['senpai', '合計が貸借対照表と合うまで、ちゃんと組もう。']],
      trial: (S, o) => [['表の終わりの合計', o === 'right' ? '貸借対照表の純資産と一致' : '貸借対照表と合わないまま'], ['準備にかかる時間', o === 'right' ? '半日' : '1時間']],
      options: [
        { id: 'right', label: '合計が合うまで、正しく組む', desc: '時間がかかる', result: '行ごとに確かめ、合計を貸借対照表と合わせる。' },
        { id: 'rough', label: '社長の言うとおり、ざっくりで出す', desc: 'すぐ終わる', result: '合計が合わないまま、表を出す。' },
      ] },
    { t: 'talk', when: (S) => D_(S).ss === 'right', diary: '6月：佐藤さんに純資産の動きを1枚で説明できた', lines: [['kabunushi', '分かりやすい。増資のお金がどこにあって、配当がどこから出たかが、1枚で追えますね。']] },
    { t: 'talk', when: (S) => D_(S).ss === 'rough', diary: '6月：合わない表を出し、佐藤さんに指摘された', lines: [['kabunushi', '表の終わりの合計が、貸借対照表の純資産と合いませんね。'], ['kabunushi', 'お金を出した会社の数字が、説明できないのは困ります。来年も同じなら、経営の体制を見直す提案をします。']] },
    { t: 'talk', lines: (S) => [['senpai', `株主の一覧：${shareholders(S).map(([n, k]) => `${n} ${k}株`).join('、')}。`]] },
    payAP2(6), colB2(6), buy2(6), sellB2(6), salary2(6, 30000), cash2(6, '屋台', 30000),
  ] };

  // ---------- 2年目 7月：2号店・中古の充填ライン・家賃（後始末型。発見なし） ----------
  const RENT = 600000, MACH = 1200000;
  const m7 = { m: 7, year: Y, label: L(7), title: '2号店と、工場の機械', events: [
    { t: 'talk', lines: [['shacho', '2号店、居抜きで借りたよ！ 家賃は1年分まとめて払うと安くなるって言うから、払っちゃった。'], ['shacho', 'あと、中古の瓶詰めの機械も買った。搬入と試運転で、動くのは秋から。']] },
    { t: 'doc', kind: 'dividend_pay', id: 'pay-div', when: (S) => D_(S).dividend !== 'none', doc: { ...passbook('7月10日', '配当金の支払い（株主のみなさま）', 'お引出し', 0), rows: (S) => [['摘要', '配当金の支払い（株主のみなさま）'], ['お引出し', divOf(S), 'amt']] },
      ans: (S) => je([['未払配当金', divOf(S)]], [['普通預金', divOf(S)]]), opts: opts('未払配当金', '繰越利益剰余金') },
    { t: 'ending', id: 'be5-warn', when: (S) => D_(S).dividend === 'all' && D_(S).capital === 'all' },
    { t: 'doc', kind: 'rent', id: 'rent', doc: { type: '領収書', title: '家賃の領収書（2号店）', from: 'さくら不動産', to: SHOP, date: '7月1日', rows: [['内容', '2号店の家賃 7月〜翌年6月の12か月分'], ['税抜の金額', RENT, 'amt'], ['消費税（10％）', tax10(RENT), 'amt'], ['合計（普通預金から振込）', RENT + tax10(RENT), 'amt']] },
      ans: je([['支払家賃', RENT], ['仮払消費税', tax10(RENT)]], [['普通預金', RENT + tax10(RENT)]]), opts: opts('支払家賃', '仮払消費税', '仮受消費税') },
    { t: 'talk', lines: [['kansa', '家賃の66万円。来年の6月までの分も入っていますね。今年の費用は、本当に全部でしょうか。'], ['senpai', 'それは、3月の決算で考えよう。']] },
    { t: 'doc', kind: 'machine', id: 'machine', manual: true, doc: { type: '請求書', title: '請求書（充填ライン）', from: 'オオヤマ機械', to: SHOP, date: '7月20日', rows: [['充填ライン本体（中古）', 1000000, 'amt'], ['運搬・据付', 150000, 'amt'], ['試運転', 50000, 'amt'], ['税抜の合計', MACH, 'amt'], ['消費税（10％）', tax10(MACH), 'amt'], ['合計', MACH + tax10(MACH), 'amt'], ['お支払期日', '8月31日']] },
      ans: je([['機械装置', MACH], ['仮払消費税', tax10(MACH)]], [['未払金', MACH + tax10(MACH)]]), opts: opts('機械装置', '車両運搬具', '仮払消費税', '修繕費') },
    ...routine2(7),
  ] };

  // ---------- 2年目 8月：保守つきで売る・リベート（E15） ----------
  const MAC_BUY = 400000, MAC_SELL = 300000, HOSHU = 60000;
  const macWith = MAC_SELL + HOSHU + tax10(MAC_SELL + HOSHU);
  const m8 = { m: 8, year: Y, label: L(8), title: '保守をつけて売ろう', events: [
    { t: 'doc', kind: 'pay_other', id: 'pay-machine', doc: passbook('8月31日', '振込 オオヤマ機械（充填ラインの代金）', 'お引出し', MACH + tax10(MACH)),
      ans: je([['未払金', MACH + tax10(MACH)]], [['普通預金', MACH + tax10(MACH)]]), opts: opts('機械装置') },
    { t: 'talk', lines: [['shacho', 'お店用のレモネードマシンを2台仕入れて、B社に1台売ったよ。2年間の点検つき！ 全部今年の売上でいいよね。']] },
    { t: 'doc', kind: 'buy_credit_vat', id: 'mac-buy', manual: true, doc: { type: '請求書', title: '請求書（業務用レモネードマシン 2台）', from: 'ツバサ製作所', to: SHOP, date: '8月5日', rows: [['品名', '業務用レモネードマシン 2台（販売用）'], ['税抜の金額', MAC_BUY, 'amt'], ['消費税（10％）', tax10(MAC_BUY), 'amt'], ['合計', MAC_BUY + tax10(MAC_BUY), 'amt'], ['お支払期日', '9月30日']] },
      ans: je([['仕入', MAC_BUY], ['仮払消費税', tax10(MAC_BUY)]], [['買掛金', MAC_BUY + tax10(MAC_BUY)]]), opts: opts('仮払消費税', '仮受消費税', '機械装置') },
    { t: 'discover', id: 'd-revenue', moves: ['資産+', '負債+'], p: 'P3', title: '2年の点検つきで売った。今年の売上は？',
      b1: { talk: [['shacho', 'マシンを30万円、2年の点検を6万円。合わせて36万円、全部今年の売上だね。'], ['piyo', '点検は、これから2年かけてやるピヨ…']],
        doc: { type: '契約書', title: '売買と点検の契約書（B社）', from: SHOP, to: 'B社', date: '8月10日', rows: [['マシン本体（8月10日に引き渡し）', MAC_SELL, 'amt'], ['点検（8月から2年間、毎月）', HOSHU, 'amt'], ['税抜の合計', MAC_SELL + HOSHU, 'amt'], ['お支払期日', '9月30日']] } },
      predict: { q: '点検の6万円。今年の売上に入ると思う？', opts: [{ t: '全部入る' }, { t: '一部だけ入る', ok: true }, { t: '1円も入らない' }] },
      b2: { q: '点検の6万円（24か月分）。売った日に、どこに置く？', token: '点検 60,000', layout: 'timeline', targets: [
        { id: 'now', label: '今日の売上', sub: '契約した日', ok: false, react: '点検は、まだ1回もしていない。やっていない仕事の分まで売上にすると、来年の売上がなくなってしまう' },
        { id: 'later', label: 'これからやる約束', sub: '点検するたびに売上へ', ok: true },
        { id: 'end', label: '2年後の売上', sub: '契約が終わる日', ok: false, react: '点検は毎月している。やった分は、その月までの売上にしてよい' },
      ], reasons: [
        { t: '点検は2年かけて「やる」仕事で、やった分だけが売上だから', ok: true },
        { t: 'お金はもう請求したから', ok: false, fork: '現金主義', react: '請求した日やお金をもらう日ではなく、仕事をした分で売上を数えるのだった' },
        { t: 'マシンと一緒に売ったから、1つの売上', ok: false, fork: '契約＝1つの売上', react: '1つの契約でも、「渡したら終わる仕事」と「続く仕事」が入っている。分けて考える' },
      ], hints: ['マシンの仕事は、いつ終わった？', '点検の仕事は、いつ終わる？'] },
      b3: { ok: 'マシン30万円は渡した今日の売上。点検6万円は「これからやる約束」として負債に置き、点検した分だけ売上へ移す。今年（8月〜3月）は8か月分。' },
      b4: { name: '履行義務・契約負債・収益認識', line: '売る約束の中の、1つ1つの仕事を「履行義務」という。まだやっていない仕事の分は、負債の「契約負債」。仕事をした分だけ売上にする考え方を「収益認識」という。',
        exam: '「保守サービスは契約期間にわたり履行義務が充足される」', teaches: ['履行義務', '契約負債', '収益認識'], leaf: { p: 'P3', label: '続く仕事の売上' } },
      hand: '収益認識：契約の中の履行義務ごとに、取引価格を配分する。一時点で終わる義務（商品の引渡し）は引き渡したときに収益、一定の期間にわたる義務（保守・点検）は期間がたつのに応じて収益。お金を受け取った（請求した）が、まだやっていない分は契約負債。' },
    { t: 'decision', id: 'revenue', q: 'B社のマシンと点検の売上、どう書く？', talk: [['shacho', '全部今年の売上にしようよ。今年のもうけが大きく見えるし。'], ['senpai', '点検の分は、やった分ずつ売上にするやり方が決まっている。']],
      trial: (S, o) => [['今年の売上（マシンと点検）', o === 'split' ? MAC_SELL + HOSHU / 3 : MAC_SELL + HOSHU], ['来年の売上（点検）', o === 'split' ? HOSHU / 2 : 0], ['再来年の売上（点検）', o === 'split' ? HOSHU / 6 : 0]],
      options: [
        { id: 'split', label: '点検の分は、これからやる約束に置く', desc: '今年の売上は少し小さい', result: 'マシンは売上、点検は契約負債。点検した分だけ売上へ。', ending: ['be3-warn', 'be3-final'] },
        { id: 'follow', label: '社長の言うとおり、全部今年の売上', desc: '今年の売上が大きく見える', result: '36万円をすべて今年の売上にする。' },
      ] },
    { t: 'doc', kind: 'sell_machine', id: 'mac-sell', manual: true, doc: { type: '請求書（控え）', title: '請求書（マシンと点検）', from: SHOP, to: 'B社', date: '8月10日', rows: [['マシン本体', MAC_SELL, 'amt'], ['点検（2年間）', HOSHU, 'amt'], ['税抜の合計', MAC_SELL + HOSHU, 'amt'], ['消費税（10％）', tax10(MAC_SELL + HOSHU), 'amt'], ['合計', macWith, 'amt'], ['お支払期日', '9月30日']] },
      ans: (S) => (D_(S).revenue === 'follow' ? je([['売掛金', macWith]], [['売上', MAC_SELL + HOSHU], ['仮受消費税', tax10(MAC_SELL + HOSHU)]]) : je([['売掛金', macWith]], [['売上', MAC_SELL], ['契約負債', HOSHU], ['仮受消費税', tax10(MAC_SELL + HOSHU)]])), opts: opts('契約負債', '仮受消費税', '前受金') },
    { t: 'discover', id: 'd-rebate', moves: ['収益-', '負債+'], p: 'P3', title: '「たくさん買ったら2％戻す」は、どこに書く？',
      b1: { talk: [['eigyo', '学校のD社と、1年間の約束をしたよ。今年100万円以上買ってくれたら、買った額の2％を年度末に戻す。'], ['shacho', '戻すのは年度末なんだから、今は気にしなくていいよね。']] },
      predict: { q: 'D社が100万円以上買うのが、ほぼ確かなとき。2％の分は、売った日の売上に入れていいと思う？', opts: [{ t: '入れてよい' }, { t: '入れないほうがよい', ok: true }] },
      b2: { q: 'D社への売上のうち、あとで戻す見込みの2％。売った日に、どうする？', token: '戻す見込み 2％', layout: 'options', targets: [
        { id: 'minus', label: '売上から引いて、返す約束として置く', ok: true },
        { id: 'later', label: '戻すときに、費用として書く', ok: false, react: 'それだと、売った年のもうけが大きく見える。戻すことがほぼ確かなら、はじめから受け取れない分だね' },
      ], reasons: [
        { t: '戻す見込みの分は、受け取れない売上だから', ok: true },
        { t: 'まだ1円も戻していないから、今は気にしなくてよい', ok: false, fork: '現金主義', react: 'お金が動く日ではなく、受け取れる見込みの額で売上を数える' },
      ], hints: ['D社から、最後に受け取れるのはいくら？'] },
      b3: { ok: '戻す見込みの分は売上から引き、負債に「返す約束」として置く。年度末に戻したら、その約束がへる。' },
      b4: { name: '返金負債・変動対価', line: 'あとで戻す見込みの分は、売上から引いて負債の「返金負債」に置く。リベートのように、受け取る額が変わりうる代金を「変動対価」という。',
        exam: '「売上割戻（リベート）の見込額を返金負債として計上する」', teaches: ['返金負債', '変動対価', 'リベート'], leaf: { p: 'P3', label: '戻す見込みの売上' } },
      hand: '変動対価（リベート・返品の見込みなど）は、受け取ると見込む額で収益にする。戻す見込みの額は返金負債。D社への40万円のうち2％の8,000円は返金負債、売上は392,000円。' },
    ...routine2(8),
  ] };

  // ---------- 2年目 9月：レモネード教室（E16） ----------
  const KYOSHITSU = 300000, KAI = 50000;
  const serviceRev = (m) => ({ t: 'doc', kind: 'service_rev', id: `y2kai${m}`, doc: { type: '受講者名簿', title: `レモネード教室 ${m}月の講座`, from: '教室（ハルカ）', to: '経理', date: `${m}月末`, rows: [['今月の講座', '1回（6回のうち）終わった'], ['1回分の月謝（税抜）', KAI, 'amt']] },
    ans: je([['前受金', KAI]], [['役務収益', KAI]]), opts: opts('前受金', '役務収益', '売上', '契約負債') });
  SIM.__y2 = { serviceRev, routine2, bal, credit, divOf, resOf };
  const m9 = { m: 9, year: Y, label: L(9), title: 'レモネード教室を開く', events: [
    { t: 'talk', lines: [['shacho', '教室を始めたよ！ 10人が6回分の月謝を先に払ってくれた。33万円入った！ 今月の売上だね。']] },
    { t: 'discover', id: 'd-service', moves: ['資産+', '負債+'], p: 'P3', title: '6回分の月謝を先にもらった。今月の売上は？',
      b1: { talk: [['eigyo', '講座は9月から月に1回、全部で6回。今月は1回目が終わったよ。']],
        doc: { type: '通帳', title: '普通預金 通帳', from: 'みらい銀行', to: SHOP, date: '9月1日', rows: [['摘要', '入金 レモネード教室の月謝（10人×6回分）'], ['お預け入れ', KYOSHITSU + tax10(KYOSHITSU), 'amt'], ['うち 税抜', KYOSHITSU, 'amt'], ['うち 消費税（10％）', tax10(KYOSHITSU), 'amt']] } },
      predict: { q: '6回のうち1回が終わった9月。売上はいくらだと思う？', opts: [{ t: '30万円' }, { t: '5万円', ok: true }, { t: '0円' }] },
      b2: { q: '月謝30万円（消費税を除く・6回分）。9月の分は、どこまで？', token: '月謝 300,000', layout: 'timeline', targets: [
        { id: 'one', label: '1回分 50,000', sub: '9月に1回終わった', ok: true },
        { id: 'all', label: '6回分 300,000', sub: 'お金が入った', ok: false, react: 'まだ5回分の講座をしていない。やっていない仕事は、まだ売上にできない' },
        { id: 'zero', label: '0円', sub: '6回終わるまで待つ', ok: false, react: '9月の講座は、もう終わった。やった分の仕事は、売上にしてよい' },
      ], reasons: [
        { t: 'やった回の分だけが売上だから', ok: true },
        { t: '6回分のお金が、もう全部入ったから', ok: false, fork: '現金主義', react: 'お金が入った日ではなく、仕事をした分で売上を数える。8月の点検と同じ' },
        { t: '契約したから', ok: false, fork: '契約＝売上', react: '契約しただけでは、まだ教えていない' },
      ], hints: ['9月に、講座は何回終わった？', '8月の点検と、似ていない？'] },
      b3: { ok: '先にもらった30万円は「これから教える約束」（負債）。毎月1回終わるたびに5万円ずつ、約束をへらして売上にする。' },
      b4: { name: '前受金・役務収益・役務原価', line: '先にもらったお金は、負債の「前受金」。形のない仕事（サービス）の売上は「役務収益」、そのためにかかった費用は「役務原価」。8月の契約負債と同じ考え方の兄弟で、2級の問題では前受金と書く場面もある。',
        exam: '「役務の提供が完了した部分について役務収益を計上する」', teaches: ['前受金', '役務収益', '役務原価', 'サービス'], leaf: { p: 'P3', label: 'サービスの売上' } },
      hand: 'サービス業：お金を先に受け取ったら前受金（契約負債）。サービスをした分だけ、役務収益に移す。サービスのためにかかった費用は、いったん別の箱に集めておき、売上にするときに役務原価へ移す。' },
    { t: 'doc', kind: 'service_pre', id: 'kyoshitsu', manual: true, doc: { type: '通帳', title: '普通預金 通帳', from: 'みらい銀行', to: SHOP, date: '9月1日', rows: [['摘要', '入金 レモネード教室の月謝（10人×6回分）'], ['お預け入れ', KYOSHITSU + tax10(KYOSHITSU), 'amt'], ['うち 税抜', KYOSHITSU, 'amt'], ['うち 消費税（10％）', tax10(KYOSHITSU), 'amt']] },
      ans: je([['普通預金', KYOSHITSU + tax10(KYOSHITSU)]], [['前受金', KYOSHITSU], ['仮受消費税', tax10(KYOSHITSU)]]), opts: opts('前受金', '役務収益', '仮受消費税', '契約負債') },
    serviceRev(9),
    { t: 'doc', kind: 'collect_ar', id: 'col-mac', doc: passbook('9月30日', 'B社から マシンと点検の代金', 'お預け入れ', macWith), ans: je([['普通預金', macWith]], [['売掛金', macWith]]), opts: opts() },
    { t: 'doc', kind: 'pay_ap', id: 'pay-mac', doc: passbook('9月30日', '振込 ツバサ製作所（マシン2台の代金）', 'お引出し', MAC_BUY + tax10(MAC_BUY)), ans: je([['買掛金', MAC_BUY + tax10(MAC_BUY)]], [['普通預金', MAC_BUY + tax10(MAC_BUY)]]), opts: opts() },
    { t: 'ending', id: 'be3-warn', when: (S) => D_(S).revenue === 'follow' },
    ...routine2(9),
  ] };


  // ---------- 工場（E35〜E38）：2年目10月から。工場の帳簿は2年目は商業と同じ帳簿（docs/YEAR2.md 5章） ----------
  // 工場の数字：1本あたり材料90円（1月からは予定価格）、工員の賃金 月100,000（1,500本なら150,000）、
  // 工場長 40,000・電気 20,000・機械の月割 20,000（2本目のラインを買えば2月から＋14,000）、外注の殺菌 1本20円（12月から）。
  // 毎月、作った瓶はその月のうちに検品まで終わる（10月の分だけ11月にまとめて）。売れた瓶の原価は、その月にできた瓶の1本あたりで数える（ゲームの約束）
  const lots = (S, m) => (m === 10 || m === 11 || D_(S).lots !== '1500' ? 1000 : 1500);
  const MAT = 90, ACT = { 1: 95, 2: 88, 3: 93 }; // 1月からの材料の実際の値段（1本あたり）
  const planP = (S) => ({ same: 90, low: 80, high: 100 }[D_(S).yprice] || 90);
  const yotei = (m) => m >= 1 && m <= 3;
  const matAct = (S, m) => lots(S, m) * (yotei(m) ? ACT[m] : MAT);
  const matUse = (S, m) => lots(S, m) * (yotei(m) ? planP(S) : MAT);
  const wageBase = (S, m) => (lots(S, m) === 1500 ? 150000 : 100000);
  const RAISE = 1.04; // 1月から賃金が4％上がる
  const wageAct = (S, m) => Math.round(wageBase(S, m) * (yotei(m) ? RAISE : 1));
  // 12月から25日払い：1〜25日（8割）を当月25日に払い、26日〜月末（2割）は翌月25日に払う
  const wagePay = (S, m) => (m === 12 ? wageBase(S, 12) * 0.8 : Math.round(wageBase(S, m === 1 ? 12 : m - 1) * (m - 1 === 0 || m === 1 ? 1 : RAISE) * 0.2) + Math.round(wageAct(S, m) * 0.8));
  const OH = (S, m) => (m < 11 && m > 3 ? 0 : 40000 + 20000 + 20000 + (m === 12 ? 2000 : 0) + (D_(S).line2 === 'buy' && (m === 2 || m === 3) ? 14000 : 0));
  const gaichu = (S, m) => (m === 12 || yotei(m) ? lots(S, m) * 20 : 0);
  const wipIn = (S, m) => matUse(S, m) + (yotei(m) ? wageBase(S, m) : wageBase(S, m)) + OH(S, m) + gaichu(S, m);
  const done = (S, m) => (m === 10 ? 0 : m === 11 ? wipIn(S, 10) + wipIn(S, 11) : wipIn(S, m));
  const doneN = (S, m) => (m === 10 ? 0 : m === 11 ? 2000 : lots(S, m));
  const SOLD_B = 600, SOLD_SHOP = 200, PB = 380, PS = 450;
  const cogs = (S, m) => Math.round(((SOLD_B + SOLD_SHOP) * done(S, m)) / doneN(S, m));
  const unit = (S, m) => Math.round(done(S, m) / doneN(S, m));
  SIM.__fac = { lots, matAct, matUse, wageAct, wagePay, OH, gaichu, wipIn, done, doneN, cogs, unit, planP };

  const facDocs = (m) => {
    const out = [];
    const d = (o) => out.push(Object.assign({ t: 'doc', opts: opts('材料', '仕掛品', '製品', '製造間接費', '売上原価', '仮払消費税', '仮受消費税', '賃金', '外注加工賃', '減価償却累計額') }, o));
    // 材料の仕入（工場用）
    d({ kind: 'buy_material', id: `y2mat${m}`, doc: { type: '請求書', title: '請求書（工場用）', from: 'ハッピー問屋', to: SHOP, date: `${m}月3日`, rows: (S) => { const a = m === 10 ? 100000 : matAct(S, m); return [['品名', 'レモン・砂糖・瓶（瓶詰め用）'], ['税抜の金額', a, 'amt'], ['消費税（8％）', tax8(a), 'amt'], ['合計', a + tax8(a), 'amt'], ['お支払期日', '翌月末']]; } },
      ans: (S) => { const a = m === 10 ? 100000 : matAct(S, m); return je([['材料', a], ['仮払消費税', tax8(a)]], [['買掛金', a + tax8(a)]]); } });
    // 材料の出庫（1月からは予定の値段で）
    d({ kind: 'issue', id: `y2iss${m}`, doc: { type: '出庫票', title: `${m}月の材料の出庫票`, from: '工場', to: '経理', date: `${m}月末`, rows: (S) => [['使った材料', `${lots(S, m).toLocaleString()}本分`], [yotei(m) ? `予定の値段（1本 ${planP(S)}円）で` : '使った材料の金額', matUse(S, m), 'amt']] },
      ans: (S) => je([['仕掛品', matUse(S, m)]], [['材料', matUse(S, m)]]) });
    if (yotei(m)) d({ kind: 'mat_var', id: `y2mvar${m}`, doc: { type: '材料の計算表', title: `${m}月の材料の差（予定と実際）`, from: '工場', to: '経理', date: `${m}月末`, rows: (S) => [['予定の値段で使った額', matUse(S, m), 'amt'], ['実際の値段で使った額', matAct(S, m), 'amt'], [matAct(S, m) > matUse(S, m) ? '差（実際のほうが高い）' : '差（実際のほうが安い）', Math.abs(matAct(S, m) - matUse(S, m)), 'amt']] },
      ans: (S) => { const v = matAct(S, m) - matUse(S, m); return v >= 0 ? je([['材料消費価格差異', v]], [['材料', v]]) : je([['材料', -v]], [['材料消費価格差異', -v]]); } });
    // 工員の給料（11月までは月末払いで、払った額＝働いた分。12月から25日払いで賃金の勘定）
    if (m === 10 || m === 11) {
      d({ kind: 'pay_salary', id: `y2fsal${m}`, doc: passbook(`${m}月末`, '給与振込（工場の工員）', 'お引出し', 100000), ans: je([['給料', 100000]], [['普通預金', 100000]]) });
      d({ kind: 'labor_use', id: `y2flab${m}`, doc: { type: '作業の記録', title: `${m}月の工員の作業の記録`, from: '工場', to: '経理', date: `${m}月末`, rows: [['瓶詰めの作業（1か月）', 100000, 'amt']] }, ans: je([['仕掛品', 100000]], [['給料', 100000]]) });
    } else {
      d({ kind: 'pay_wage', id: `y2wpay${m}`, doc: { ...passbook(`${m}月25日`, '給与振込（工場の工員）', 'お引出し', 0), rows: (S) => [['摘要', '給与振込（工場の工員）'], ['お引出し', wagePay(S, m), 'amt']] }, ans: (S) => je([['賃金', wagePay(S, m)]], [['普通預金', wagePay(S, m)]]) });
      d({ kind: 'wage_use', id: `y2wuse${m}`, doc: { type: '賃金の計算表', title: `${m}月の賃金の計算表`, from: '工場', to: '経理', date: `${m}月末`, rows: (S) => [[yotei(m) ? '予定の賃率で数えた、今月働いた分' : '今月働いた分（1日〜月末）', wageBase(S, m), 'amt'], ...(yotei(m) ? [['実際の賃率で数えた、今月働いた分', wageAct(S, m), 'amt'], ['差（実際のほうが高い）', wageAct(S, m) - wageBase(S, m), 'amt']] : [])] },
        ans: (S) => (yotei(m) ? je([['仕掛品', wageBase(S, m)], ['賃率差異', wageAct(S, m) - wageBase(S, m)]], [['賃金', wageAct(S, m)]]) : je([['仕掛品', wageBase(S, m)]], [['賃金', wageBase(S, m)]])) });
    }
    if (m !== 10) {
      // 工場長の給料・電気代・機械の月割は、どの瓶の分か分けられない
      d({ kind: 'oh_boss', id: `y2boss${m}`, doc: passbook(`${m}月末`, '給与振込（工場長）', 'お引出し', 40000), ans: je([['製造間接費', 40000]], [['普通預金', 40000]]) });
      d({ kind: 'oh_power', id: `y2pow${m}`, doc: { type: '検針票', title: `電気の使用量のお知らせ（${m}月）`, from: 'みらい電力', to: SHOP, date: `${m}月末`, rows: [['工場の電気代（税抜）', 20000, 'amt'], ['消費税（10％）', 2000, 'amt'], ['合計（口座から引き落とし）', 22000, 'amt']] }, ans: je([['製造間接費', 20000], ['仮払消費税', 2000]], [['普通預金', 22000]]) });
      d({ kind: 'oh_dep', id: `y2mdep${m}`, doc: { type: '固定資産台帳', title: `機械の月割（${m}月）`, from: '経理', to: '経理', date: `${m}月末`, rows: (S) => [['充填ライン 1,200,000円・5年', 20000, 'amt'], ...(D_(S).line2 === 'buy' && (m === 2 || m === 3) ? [['2本目のライン 840,000円・5年', 14000, 'amt'], ['合計', 34000, 'amt']] : [])] },
        ans: (S) => { const a = 20000 + (D_(S).line2 === 'buy' && (m === 2 || m === 3) ? 14000 : 0); return je([['製造間接費', a]], [['減価償却累計額', a]]); } });
      if (m === 12) d({ kind: 'oh_shrink', id: 'y2shrink', doc: { type: '棚卸表', title: '材料の棚卸表（12月）', from: '工場', to: '経理', date: '12月末', rows: [['帳簿の材料', 10000, 'amt'], ['数えた材料', 8000, 'amt'], ['足りない（こぼれ・割れ）', 2000, 'amt']] }, ans: je([['製造間接費', 2000]], [['材料', 2000]]) });
    }
    if (gaichu({ decisions: {} }, m) || m === 12 || yotei(m)) {
      d({ kind: 'outsource', id: `y2gai${m}`, doc: { type: '請求書', title: '請求書（殺菌の外注）', from: 'キレイ殺菌', to: SHOP, date: `${m}月末`, rows: (S) => [['殺菌（1本20円）', `${lots(S, m).toLocaleString()}本`], ['税抜の金額', gaichu(S, m), 'amt'], ['消費税（10％）', tax10(gaichu(S, m)), 'amt'], ['合計', gaichu(S, m) + tax10(gaichu(S, m)), 'amt'], ['お支払期日', '翌月末']] },
        ans: (S) => je([['外注加工賃', gaichu(S, m)], ['仮払消費税', tax10(gaichu(S, m))]], [['買掛金', gaichu(S, m) + tax10(gaichu(S, m))]]) });
      d({ kind: 'out_use', id: `y2gaiu${m}`, doc: { type: '工場日報', title: `${m}月の殺菌の記録`, from: '工場', to: '経理', date: `${m}月末`, rows: (S) => [['殺菌した瓶', `${lots(S, m).toLocaleString()}本`], ['外注の殺菌の金額', gaichu(S, m), 'amt']] }, ans: (S) => je([['仕掛品', gaichu(S, m)]], [['外注加工賃', gaichu(S, m)]]) });
    }
    if (m !== 10) {
      d({ kind: 'alloc', id: `y2alloc${m}`, doc: { type: '製造間接費の集計表', title: `${m}月の製造間接費の集計表`, from: '工場', to: '経理', date: `${m}月末`, rows: (S) => [['今月の瓶の分にまとめて配る額', OH(S, m), 'amt']] }, ans: (S) => je([['仕掛品', OH(S, m)]], [['製造間接費', OH(S, m)]]) });
      d({ kind: 'complete', id: `y2done${m}`, doc: { type: '工場日報', title: `${m}月の工場日報（検品）`, from: '工場', to: '経理', date: `${m}月末`, rows: (S) => [['検品が終わった瓶', `${doneN(S, m).toLocaleString()}本`], ['その瓶にかかったお金', done(S, m), 'amt'], ['1本あたり', `${unit(S, m).toLocaleString()}円`]] }, ans: (S) => je([['製品', done(S, m)]], [['仕掛品', done(S, m)]]) });
      d({ kind: 'sell_product', id: `y2bot${m}`, doc: { type: '請求書（控え）', title: '請求書（瓶詰めレモネード）', from: SHOP, to: 'B社', date: `${m}月25日`, rows: [['品名', `瓶詰めレモネード ${SOLD_B}本（1本${PB}円）`], ['税抜の金額', SOLD_B * PB, 'amt'], ['消費税（8％）', tax8(SOLD_B * PB), 'amt'], ['合計', SOLD_B * PB + tax8(SOLD_B * PB), 'amt'], ['お支払期日', '翌月末']] },
        ans: je([['売掛金', SOLD_B * PB + tax8(SOLD_B * PB)]], [['売上', SOLD_B * PB], ['仮受消費税', tax8(SOLD_B * PB)]]) });
      d({ kind: 'sell_product_shop', id: `y2bots${m}`, doc: { type: 'レジ締め日報', title: `${m}月のレジ締め日報（瓶詰め）`, from: '2号店レジ', to: '経理', date: `${m}月末`, rows: [['瓶詰めレモネード', `${SOLD_SHOP}本（1本${PS}円）`], ['税抜の金額', SOLD_SHOP * PS, 'amt'], ['消費税（8％）', tax8(SOLD_SHOP * PS), 'amt'], ['合計（普通預金へ入金ずみ）', SOLD_SHOP * PS + tax8(SOLD_SHOP * PS), 'amt']] },
        ans: je([['普通預金', SOLD_SHOP * PS + tax8(SOLD_SHOP * PS)]], [['売上', SOLD_SHOP * PS], ['仮受消費税', tax8(SOLD_SHOP * PS)]]) });
      d({ kind: 'ship', id: `y2ship${m}`, doc: { type: '出荷の記録', title: `${m}月に出荷した瓶`, from: '工場', to: '経理', date: `${m}月末`, rows: (S) => [['出荷した瓶（B社と2号店）', `${SOLD_B + SOLD_SHOP}本`], ['1本あたりの原価', `${unit(S, m).toLocaleString()}円`], ['出荷した瓶の原価', cogs(S, m), 'amt']] }, ans: (S) => je([['売上原価', cogs(S, m)]], [['製品', cogs(S, m)]]) });
      // 先月の材料代・外注代の支払い、先月の瓶の代金の回収
      d({ kind: 'pay_ap', id: `y2fpap${m}`, doc: { ...passbook(`${m}月末`, '振込 ハッピー問屋（先月の工場用の材料）', 'お引出し', 0), rows: (S) => { const a = m === 11 ? 100000 : matAct(S, m === 1 ? 12 : m - 1); return [['摘要', '振込 ハッピー問屋（先月の工場用の材料）'], ['お引出し', a + tax8(a), 'amt']]; } }, ans: (S) => { const a = m === 11 ? 100000 : matAct(S, m === 1 ? 12 : m - 1); return je([['買掛金', a + tax8(a)]], [['普通預金', a + tax8(a)]]); } });
    }
    if (m !== 10 && m !== 11) {
      d({ kind: 'collect_ar', id: `y2fcol${m}`, doc: passbook(`${m}月末`, 'B社から 瓶詰めの代金（先月分）', 'お預け入れ', SOLD_B * PB + tax8(SOLD_B * PB)), ans: je([['普通預金', SOLD_B * PB + tax8(SOLD_B * PB)]], [['売掛金', SOLD_B * PB + tax8(SOLD_B * PB)]]) });
    }
    if (m === 1 || m === 2 || m === 3) {
      d({ kind: 'pay_ap', id: `y2gpay${m}`, doc: { ...passbook(`${m}月末`, '振込 キレイ殺菌（先月の殺菌代）', 'お引出し', 0), rows: (S) => { const a = gaichu(S, m === 1 ? 12 : m - 1); return [['摘要', '振込 キレイ殺菌（先月の殺菌代）'], ['お引出し', a + tax10(a), 'amt']]; } }, ans: (S) => { const a = gaichu(S, m === 1 ? 12 : m - 1); return je([['買掛金', a + tax10(a)]], [['普通預金', a + tax10(a)]]); } });
    }
    return out;
  };
  SIM.__y2.facDocs = facDocs;

  Object.assign(SIM.namings, {
    賃金: { q: '工場の工員さんに払う給料。お店の給料と、どこがちがう？', opts: [
      { t: '瓶を作るために働いた分なので、瓶の原価に入る', ok: true },
      { t: 'ちがわない。お店の給料と同じ費用', react: '工員さんの働きは、瓶に乗り移る。売れるまでは、瓶と一緒に倉庫に残る' },
    ], line: '工場で働く人の給料は「賃金」と書く。払った額ではなく、働いた分を作っている途中の箱へ運ぶ。', teaches: ['賃金'] },
    外注加工賃: { q: '瓶の殺菌を、外の会社に1本20円で頼んだ。このお金は、どの瓶の分か分かる？', opts: [
      { t: '分かる。殺菌した瓶1本ずつの分', ok: true },
      { t: '分からない。工場全体の分', react: '1本20円で、本数が決まっている。どの瓶の分かが、はっきり分かる' },
    ], line: '外の会社に作業を頼んだお金は「外注加工賃」。どの瓶の分か分かるので、作っている途中の箱へ直接運ぶ。', teaches: ['外注加工賃'] },
  });
  Object.assign(SIM.rules, {
    buy_material: { y: 2, label: '工場の材料の掛け仕入れ', entry: [['材料', '仮払消費税'], ['買掛金']], conds: [
      { t: '瓶詰めに使う材料を掛けで買ったとき', ok: true },
      { t: 'ハッピー問屋から請求書が来たとき', ok: false, why: '同じ問屋から、お店で売る商品も届く。「何に使うものか」で決めよう' },
    ] },
    issue: { y: 2, label: '材料の出庫', entry: [['仕掛品'], ['材料']], conds: [
      { t: '出庫票で、材料を瓶詰めに使ったとき', ok: true },
      { t: '材料を買ったとき', ok: false, why: '買っただけでは、まだ使っていない。使ったときに、作っている途中の箱へ運ぶ' },
    ] },
    alloc: { y: 2, label: '製造間接費の配賦', entry: [['仕掛品'], ['製造間接費']], conds: [
      { t: '月末に、分けられないお金をまとめて今月の瓶に配るとき', ok: true },
      { t: '電気代を払ったとき', ok: false, why: '払ったときは、まず分けられないお金の箱に集める。配るのは月末' },
    ] },
    complete: { y: 2, label: '瓶の完成', entry: [['製品'], ['仕掛品']], conds: [
      { t: '工場日報で、検品が終わった瓶が分かったとき', ok: true },
      { t: '瓶が売れたとき', ok: false, why: '売れたときは、できあがりの箱から売れた分の箱へ運ぶ。完成とは別' },
    ] },
    ship: { y: 2, label: '出荷した瓶の原価', entry: [['売上原価'], ['製品']], conds: [
      { t: '瓶を出荷して、売れた瓶の原価が分かったとき', ok: true },
      { t: '月末に倉庫を数えたとき', ok: false, why: '工場の瓶は、売るたびに原価を出す。店の商品のように1年の終わりにまとめるのではない' },
    ] },
  });
  const flowTok = (id, label, target, j) => ({ id, label, target, je: j });

  // ---------- 2年目 10月：工場、動き出す（E35） ----------
  const m10 = { m: 10, year: Y, factory: true, label: L(10), title: '工場、動き出す', events: [
    { t: 'talk', teaches: ['工場'], lines: [['shacho', '瓶詰めの機械が動き出したよ！ 工場長の大山さんと、工員さんが1人。'], ['kojo', '工場長の大山です。今月は1,000本作ります。検品は来月です。']] },
    { t: 'discover', id: 'd-flow', moves: ['資産+', '資産-'], p: 'P6', title: 'レモンと瓶と工員さんの給料は、どこへ行く？',
      b1: { talk: [['shacho', 'レモンも瓶も、工員さんの給料も、使ったら全部その月の費用でいいよね。売れたら売上。'], ['kojo', 'でも、作った瓶は、まだ倉庫にありますよ。']] },
      predict: { q: '10月に使ったお金は、10月の費用になると思う？', opts: [{ t: '全部なる' }, { t: '売れた瓶の分だけなる', ok: true }, { t: '1円もならない' }] },
      b2: { q: '使ったお金を、川の箱に運ぼう。1枚ずつ、どの箱へ？', layout: 'flow', tokens: [
        flowTok('mat', 'レモン・瓶を使った 90,000', 'wip', ['仕掛品', '材料', 90000]),
        flowTok('lab', '工員さんが働いた 100,000', 'wip', ['仕掛品', '給料', 100000]),
        flowTok('done', '検品が終わった瓶 190,000', 'fg', ['製品', '仕掛品', 190000]),
        flowTok('sold', '売れた瓶（半分）95,000', 'cogs', ['売上原価', '製品', 95000]),
      ], targets: [{ id: 'mat', label: '材料の箱' }, { id: 'wip', label: '作っている途中' }, { id: 'fg', label: 'できあがり' }, { id: 'cogs', label: '売れた分' }],
      wrongReact: '使った材料と働いた分は、まず「作っている途中」の瓶に乗り移る。検品が終われば「できあがり」へ、売れた分だけ「売れた分」へ。', reasons: [
        { t: '使ったお金は消えずに、瓶に乗り移るから', ok: true },
        { t: '払ったお金は、その月の費用だから', ok: false, fork: '現金主義', react: '払った月ではなく、売れた月の費用になる。それまでは瓶と一緒に倉庫にある' },
        { t: '材料は、買ったときに費用にする約束だから', ok: false, fork: '三分法の転用', react: 'お店の商品は、買ったときに仕入として書いた。でも工場では、作っている途中の瓶の値段が分からなくなる' },
      ], hints: ['10月の瓶は、まだ売れていない？', '工員さんの働きは、どこに残る？'] },
      b3: { ok: '使ったお金は「作っている途中」→「できあがり」→「売れた分」と流れる。売れていない瓶の分は、費用にならずに倉庫の箱に残る。' },
      b4: { name: '材料・仕掛品・製品・売上原価（原価の流れ）', line: '工場では、使ったお金は消えずに瓶に乗り移る。材料→作っている途中（仕掛品）→できあがり（製品）→売れた分（売上原価）。瓶を作るためにかかったお金を「原価」、この流れを「原価の流れ」という。',
        exam: '「材料を消費した。直接材料費は仕掛品勘定に振り替える」', teaches: ['材料', '仕掛品', '製品', '原価', '原価の流れ'], leaf: { p: 'P6', label: '原価の流れ' } },
      hand: '工場のお金の流れ：材料・工員さんの給料・そのほかのお金→仕掛品→（完成）製品→（販売）売上原価。作るのに使った価値は費用にならず、製品という資産に乗り移り、売れたときに売上原価になる。お店の三分法とは別の考え方。' },
    { t: 'discover', id: 'd-zairyo-box', moves: [], p: 'P6', title: '買った材料と、使った材料はちがう',
      b1: { talk: [['kojo', '問屋から10万円分の材料が届きました。今月使ったのは9万円分です。']],
        doc: { type: '出庫票', title: '10月の材料の出庫票', from: '工場', to: '経理', date: '10月末', rows: [['買った材料（税抜）', 100000, 'amt'], ['使った材料', 90000, 'amt']] } },
      b2: { q: '買った10万円と、使った9万円。どの箱へ運ぶ？', layout: 'flow', tokens: [
        flowTok('buy', '買った材料 100,000', 'mat', ['材料', '買掛金', 100000]),
        flowTok('use', '使った材料 90,000', 'wip', ['仕掛品', '材料', 90000]),
      ], targets: [{ id: 'mat', label: '材料の箱' }, { id: 'wip', label: '作っている途中' }, { id: 'fg', label: 'できあがり' }],
      wrongReact: '買った材料は、まず材料の箱へ。使った分だけ、作っている途中へ運ぶ。残りの1万円は材料の箱に残る。', reasons: [
        { t: '買っただけでは、まだ瓶に乗り移っていないから', ok: true },
        { t: '同じ月なら、全部使ったことにしてよいから', ok: false, fork: '三分法の転用', react: '使っていない材料まで瓶に乗せると、1本の値段が高く見えてしまう' },
      ], hints: ['倉庫に、材料は残っている？'] },
      b3: { ok: '材料の箱に10万円入り、使った9万円が作っている途中へ。残った1万円は、材料の箱（資産）のまま来月へ。' },
      b4: { name: '材料の消費（直接材料費）', line: 'どの瓶に使ったか分かる材料は「直接材料費」。使ったときに、材料の箱から作っている途中の箱へ運ぶ。これを材料の「消費」という。',
        exam: '「材料を出庫した（直接材料）」', teaches: ['直接材料費', '消費'], leaf: { p: 'P6', label: '材料の消費' } },
      hand: '材料の箱：左に買った額（買うのにかかった運賃なども含める）、右に使った額（どの瓶の分か分かる材料は仕掛品へ）。残りは月末の材料（資産）。' },
    { t: 'doc', kind: 'sell_credit_vat', id: 'd-sha-order', manual: true, doc: { type: '請求書（控え）', title: '請求書（D社 学園祭）', from: SHOP, to: 'D社', date: '10月12日', rows: [['品名', 'レモネード（業務用）'], ['税抜の金額', 400000, 'amt'], ['うち 年間の約束で戻す見込み（2％）', 8000, 'amt'], ['売上にする額', 392000, 'amt'], ['消費税（8％）', 32000, 'amt'], ['合計', 432000, 'amt'], ['お支払期日', '3月末']] },
      ans: je([['売掛金', 432000]], [['売上', 392000], ['返金負債', 8000], ['仮受消費税', 32000]]), opts: opts('返金負債', '契約負債', '仮受消費税') },
    { t: 'doc', kind: 'service_cost', id: 'textbook', manual: true, doc: { type: '請求書', title: '請求書（教室のテキスト 6回分）', from: 'ピヨ印刷', to: SHOP, date: '10月5日', rows: [['教室のテキスト・材料（6回分）', 60000, 'amt'], ['消費税（10％）', 6000, 'amt'], ['合計', 66000, 'amt'], ['お支払期日', '10月末']] },
      ans: je([['仕掛品', 60000], ['仮払消費税', 6000]], [['未払金', 66000]]), opts: opts('仕掛品', '役務原価', '仮払消費税') },
    { t: 'doc', kind: 'pay_other', id: 'textbook-pay', doc: passbook('10月31日', '振込 ピヨ印刷（教室のテキスト）', 'お引出し', 66000), ans: je([['未払金', 66000]], [['普通預金', 66000]]), opts: opts() },
    ...facDocs(10), serviceRev(10), ...routine2(10),
  ] };

  // ---------- 2年目 11月：分けられないお金と、できあがった瓶（E35つづき・E38前半） ----------
  const m11 = { m: 11, year: Y, factory: true, label: L(11), title: 'どの瓶の分か、分けられないお金', events: [
    { t: 'discover', id: 'd-kansetsu', moves: ['その他+', 'その他-'], p: 'P6', title: '工場長の給料と電気代は、どの瓶の分？',
      b1: { talk: [['kojo', 'ぼくの給料と、工場の電気代。どの瓶の分かって聞かれても、1本ずつには分けられないよ。'], ['shacho', '瓶に関係ないなら、会社の費用でいいんじゃない？']] },
      predict: { q: '工場長の給料は、瓶の値段に入ると思う？', opts: [{ t: '入る', ok: true }, { t: '入らない' }] },
      b2: { q: '工場長の給料・電気代・機械の月割を、どの箱へ運ぶ？', layout: 'flow', tokens: [
        flowTok('boss', '工場長の給料 40,000', 'oh', ['製造間接費', '普通預金', 40000]),
        flowTok('power', '電気代 20,000', 'oh', ['製造間接費', '普通預金', 20000]),
        flowTok('dep', '機械の月割 20,000', 'oh', ['製造間接費', '減価償却累計額', 20000]),
        flowTok('alloc', '月末：まとめて今月の瓶へ 80,000', 'wip', ['仕掛品', '製造間接費', 80000]),
      ], targets: [{ id: 'oh', label: '分けられないお金の箱', side: true }, { id: 'wip', label: '作っている途中' }, { id: 'fg', label: 'できあがり' }, { id: 'cogs', label: '売れた分' }],
      wrongReact: '1本ずつに分けられないお金も、瓶を作るためのお金。いったん「分けられないお金の箱」に集めて、月末にまとめて今月の瓶へ配る。', reasons: [
        { t: '1本ずつ分けられなくても、瓶を作るためのお金だから', ok: true },
        { t: '瓶に関係ないので、会社の費用にするから', ok: false, fork: '工場の費用＝販売の費用', react: '工場長も電気も、瓶を作るために使っている。瓶の値段に入れないと、1本の値段が安く見えてしまう' },
        { t: '工場長の給料も、工員さんと同じように直接入れるから', ok: false, fork: '直接と間接の混同', react: '工員さんの働きは、どの瓶の分か分かる。工場長の仕事は、工場全体のためで分けられない' },
      ], hints: ['工場長がいないと、瓶はできる？', '電気代を1本ずつに分けられる？'] },
      b3: { ok: '分けられないお金は、いったん1つの箱に集め、月末にまとめて今月の瓶へ配る。工員さんや材料のように、どの瓶の分か分かるお金は直接運ぶ。' },
      b4: { name: '製造間接費・直接費と間接費・配賦', line: 'どの瓶の分か分かるお金を「直接費」、分けられないお金を「間接費」という。工場の間接費は「製造間接費」の箱に集め、月末に瓶へ配る。配ることを「配賦」という。',
        exam: '「製造間接費を製品に配賦した」', teaches: ['製造間接費', '直接費', '間接費', '配賦'], leaf: { p: 'P6', label: '製造間接費' } },
      hand: '製造原価＝直接材料費＋直接労務費＋直接経費＋製造間接費。製造間接費（間接材料費・間接労務費・間接経費）は製造間接費の箱に集め、作業時間などの割合で製品に配賦する。2年目の工場は1種類の瓶だけなので、月末に全額を仕掛品へ。' },
    { t: 'discover', id: 'd-seihin', moves: [], p: 'P6', title: '検品が終わった瓶と、売れた瓶',
      b1: { talk: [['kojo', '10月と11月の瓶、2,000本の検品が終わりました。B社に600本、2号店で200本売れました。']],
        doc: { type: '工場日報', title: '11月の工場日報', from: '工場', to: '経理', date: '11月末', rows: [['検品が終わった瓶', '2,000本'], ['その瓶にかかったお金', 460000, 'amt'], ['売れた瓶', '800本']] } },
      predict: { q: '売れた800本の原価は、いくらだと思う？', opts: [{ t: '460,000円（作った分全部）' }, { t: '184,000円（売れた分だけ）', ok: true }] },
      b2: { q: 'できあがった瓶と、売れた瓶。どの箱へ運ぶ？', layout: 'flow', tokens: [
        flowTok('fg', '検品が終わった2,000本 460,000', 'fg', ['製品', '仕掛品', 460000]),
        flowTok('sold', '売れた800本 184,000', 'cogs', ['売上原価', '製品', 184000]),
      ], targets: [{ id: 'wip', label: '作っている途中' }, { id: 'fg', label: 'できあがり' }, { id: 'cogs', label: '売れた分' }],
      wrongReact: 'できあがった瓶は全部できあがりの箱へ。そのうち売れた800本の分だけを、売れた分の箱へ。', reasons: [
        { t: '売れた瓶の分だけが今年の費用で、残りは倉庫の資産だから', ok: true },
        { t: '作った分は全部、作った月の費用だから', ok: false, fork: '製造＝費用', react: '倉庫に残っている1,200本は、まだ売れていない。売れるまでは資産として残る' },
      ], hints: ['倉庫に残っている瓶は、何本？'] },
      b3: { ok: 'できあがり（製品）は資産。売れた瓶の分だけ「売れた分（売上原価）」へ。1本230円×800本＝184,000円。' },
      b4: { name: '製品・売上原価（工場）', line: 'できあがった瓶は資産の「製品」。売れるたびに、売れた瓶の原価を「売上原価」へ運ぶ。お店の商品は1年の終わりにまとめて数えたが、工場の瓶は売るたびに原価を出す。',
        exam: '「製品を掛けで販売した。売上原価は製品の原価による」', teaches: ['製品', '売上原価'], leaf: { p: 'P6', label: '製品と売上原価' } },
      hand: '完成：製品／仕掛品。販売：売掛金／売上 と 売上原価／製品 の2つの仕訳。工業簿記では、販売のつど売上原価を記帳するのが普通。' },
    { t: 'decision', id: 'lots', q: '12月から、月に何本作る？', talk: [['shacho', '冬はホットレモネードが売れるから、月に1,500本作ろう！'], ['kojo', '売れているのは月に800本です。1,000本で十分ですよ。']],
      trial: (S, o) => { const n = o === '1500' ? 1500 : 1000; return [['12月の材料（税抜）', n * MAT], ['12月の工員さんの給料', n === 1500 ? 150000 : 100000], ['12月の終わりに倉庫に残る瓶（見込み）', `${(1200 + n - 800).toLocaleString()}本`]]; },
      options: [
        { id: '1000', label: '月に1,000本（工場長の案）', desc: '売れる量に近い', result: '12月からも月に1,000本作る。' },
        { id: '1500', label: '社長の言うとおり、月に1,500本', desc: '冬に備える', result: '12月から月に1,500本作る。工員さんは残業になる。' },
      ] },
    ...facDocs(11), serviceRev(11), ...routine2(11),
  ] };

  // ---------- 2年目 12月：工員の給料日は25日（E37）、経費の4つの顔（E38後半） ----------
  const m12 = { m: 12, year: Y, factory: true, label: L(12), title: '工員さんの給料日は25日', events: [
    { t: 'talk', lines: [['senpai', '12月から、工員さんの給料もお店と同じ25日払いになる。1日から25日の分を、その月の25日に払うんだ。']] },
    { t: 'discover', id: 'd-romu', moves: [], p: 'P3', title: '25日に払った額と、今月働いた分',
      b1: { talk: [['kojo', '25日に払った8万円が、今月の工員さんの分でしょ？'], ['piyo', '26日から31日も働いてるピヨ…その分は来月払う。']] },
      predict: { q: '今月の瓶の値段に入れる働いた分は、払った額より多い？ 少ない？', opts: [{ t: '多い', ok: true }, { t: '少ない' }, { t: '同じ' }] },
      b2: { q: '12月の工員さんの分。どこまでを今月の瓶に運ぶ？', token: '工員さんの働き', layout: 'timeline', targets: [
        { id: 'paid', label: '払った分（1日〜25日）', sub: '80,000', ok: false, react: '26日から31日も、12月の瓶を作るために働いた。払うのが来月でも、働いたのは今月' },
        { id: 'worked', label: '働いた分（1日〜31日）', sub: '100,000', ok: true },
      ], reasons: [
        { t: '瓶の値段に入るのは、働いた日の分だから', ok: true },
        { t: '払った額が、今月の分だから', ok: false, fork: '現金主義', react: '払った日で数えると、月末の6日分がどの月の瓶にも入らなくなる' },
      ], hints: ['26日から31日に作った瓶は、何月の瓶？'] },
      b3: { ok: '今月働いた分100,000円を瓶へ。払っていない20,000円は「払う約束」として給料の箱に残り、来月の25日に払う。' },
      b4: { name: '賃金の消費額（当月支払・前月未払・当月未払）', line: '工員さんの給料は「賃金」。瓶に入れるのは働いた分（消費額）。消費額＝今月払った額−先月の未払分＋今月の未払分。1年の終わりの「いつの分か」と同じ考え方を、毎月する。',
        exam: '「賃金の当月消費額を計算しなさい（前月未払・当月支払・当月未払）」', teaches: ['賃金', '消費額', '未払'], leaf: { p: 'P3', label: '賃金の消費額' } },
      hand: '賃金の箱：左に今月払った額、右に先月の未払分（月のはじめの残り）と今月の消費額（仕掛品・製造間接費へ）。消費額＝今月払った額−先月の未払＋今月の未払。未払分は賃金の箱の右の残りとして、翌月へ持ち越す。' },
    { t: 'discover', id: 'd-keihi', moves: [], p: 'P6', title: '経費の4つの顔',
      b1: { talk: [['kojo', '電気代は検針票で分かる。殺菌は外の会社に頼んだ。機械は1年分を12で割る。材料の目減りは、数えてみて分かった。']] },
      b2: { q: '4つのお金。いくらかは、どうやって分かる？', layout: 'sort', tokens: [
        { id: 'gai', label: '外注の殺菌（請求書で払う）', target: 'pay' },
        { id: 'pow', label: '電気（検針票で測る）', target: 'meas' },
        { id: 'mac', label: '機械（1年分を12か月で割る）', target: 'month' },
        { id: 'loss', label: '材料の目減り（数えて分かる）', target: 'occur' },
      ], targets: [{ id: 'pay', label: '払った額で分かる' }, { id: 'month', label: '月で割って分かる' }, { id: 'meas', label: '測って分かる' }, { id: 'occur', label: '起きたことで分かる' }],
      wrongReact: '経費は、いくらかが分かる方法で4つに分かれる。払った額・月割・測った量・起きたこと。', reasons: [
        { t: '額の分かり方が4つあるから', ok: true },
        { t: '全部、払った額で分かるから', ok: false, fork: '現金主義', react: '機械の月割や目減りは、お金を払っていないのに起きている' },
      ], hints: ['機械の月割は、だれかにお金を払った？'] },
      b3: { ok: '外注の殺菌は、どの瓶の分か分かるので作っている途中へ直接。ほかは分けられないお金の箱へ。額の分かり方が4つある。' },
      b4: { name: '経費（支払経費・月割経費・測定経費・発生経費）・外注加工賃', line: '材料と賃金以外の工場のお金を「経費」という。額の分かり方で、支払・月割・測定・発生の4つに分ける。外の会社に作業を頼んだお金は「外注加工賃」で、どの瓶の分か分かる直接経費。',
        exam: '「外注加工賃は直接経費として仕掛品勘定に振り替える」', teaches: ['経費', '外注加工賃', '直接経費'], leaf: { p: 'P6', label: '経費の4つの顔' } },
      hand: '経費の分類：支払経費（外注加工賃など、払った額）、月割経費（減価償却費など）、測定経費（電気代・ガス代など、検針）、発生経費（材料の目減りなど）。外注加工賃は直接経費→仕掛品、ほかは間接経費→製造間接費。' },
    ...facDocs(12), serviceRev(12), ...routine2(12),
  ] };

  // ---------- 2年目 1月：予定の値段で進める（E36・E37後半）、2本目のライン ----------
  const m1 = { m: 1, year: Y, factory: true, label: L(1), title: 'レモンの値段が、毎回ちがう', events: [
    { t: 'discover', id: 'd-yotei', moves: ['その他+'], p: 'P4', title: '月末まで待てない。予定の値段で進めて、差は箱に',
      b1: { talk: [['kojo', 'レモンの買う値段が毎回ちがう。使った分がいくらか、月末の請求書まで分からない。'], ['shacho', 'ざっくりでいいよ。瓶の値段を早く知りたいんだ。']] },
      predict: { q: '予定の値段で進めると、月末に何が起きると思う？', opts: [{ t: 'ぴったり合う' }, { t: '差が出る', ok: true }, { t: '瓶の値段が分からなくなる' }] },
      b2: { q: '予定の値段で使った分と、実際との差。どの箱へ？', layout: 'flow', tokens: [
        flowTok('use', '予定の値段で使った材料', 'wip', ['仕掛品', '材料', 90000]),
        flowTok('var', '実際との差（実際のほうが高い）', 'var', ['材料消費価格差異', '材料', 5000]),
      ], targets: [{ id: 'mat', label: '材料の箱' }, { id: 'wip', label: '作っている途中' }, { id: 'var', label: '差の箱', side: true }],
      wrongReact: '予定の値段で、作っている途中へ運ぶ。月末に分かった実際との差は、瓶に乗せずに「差の箱」に取っておく。', reasons: [
        { t: '瓶の値段を早く出し、差は別に取っておくから', ok: true },
        { t: '差は、材料の箱に戻しておくから', ok: false, fork: '差異を資産に残す', react: '差を材料の箱に戻すと、残った材料の値段が本当とずれてしまう' },
        { t: '差は、瓶の値段に上乗せするから', ok: false, fork: '差異を製品原価に', react: '差を瓶に乗せると、予定の値段で進めた意味がなくなる。差は差で見ておく' },
      ], hints: ['予定の値段で進める理由は？', '差を瓶に乗せたら、どうなる？'] },
      b3: { ok: '予定の値段で瓶の値段を早く出し、実際との差は「差の箱」に集める。差の箱は、1年の終わりに売れた分の箱で片づける。' },
      b4: { name: '予定価格・材料消費価格差異・予定賃率・賃率差異', line: 'あらかじめ決めた値段を「予定価格」、実際との差を「差異」という。材料の差は「材料消費価格差異」、賃金の差は「賃率差異」。差異は、1年の終わりに売上原価で片づける。',
        exam: '「材料の消費には予定価格を用いている。材料消費価格差異を計上する」', teaches: ['予定価格', '材料消費価格差異', '予定賃率', '賃率差異', '差異'], leaf: { p: 'P4', label: '予定と実際の差' } },
      hand: '予定消費価格による消費：仕掛品／材料（予定価格×実際消費量）。月末：材料消費価格差異＝（予定価格−実際価格）×実際消費量。マイナス（実際のほうが高い）は不利差異で借方。賃率差異も同じ。差異は会計年度末に売上原価に振り替える。' },
    { t: 'decision', id: 'yprice', q: '材料の予定の値段（1本あたり）を、いくらにする？', talk: [['shacho', '安く見積もれば、瓶の値段も安く言えるよ。80円にしよう。'], ['kojo', '去年は1本90円でした。']],
      trial: (S, o) => { const p = { same: 90, low: 80, high: 100 }[o]; return [['予定の値段で数えた瓶1本の材料', p], ['1月の材料（予定の値段×1,000本）', p * 1000], ['1月の実際の材料（見込み）', 95000]]; },
      options: [
        { id: 'same', label: '去年並みの90円', desc: 'これまでの実際に近い', result: '予定の値段を1本90円にする。' },
        { id: 'low', label: '社長の言うとおり、安めの80円', desc: '瓶の値段が安く見える', result: '予定の値段を1本80円にする。' },
        { id: 'high', label: '高めの100円', desc: '値上がりに備える', result: '予定の値段を1本100円にする。' },
      ] },
    { t: 'decision', id: 'line2', q: '2本目の中古ラインを、今買う？', talk: [['shacho', '2本目の中古ラインが出たよ。92万円。今買えば春から2倍作れる！'], ['senpai', '口座のお金と、これからの支払いを見てから決めよう。']],
      trial: (S, o) => [['1月の終わりに払うお金', o === 'buy' ? 924000 : 0], ['5月に納める税金（見込み）', '消費税と法人税等'], ['預かった消費税の線', D_(S).vat === 'line' ? '口座の帯に出ている' : '引いていない']],
      options: [
        { id: 'buy', label: '社長の言うとおり、今買う', desc: '春から2倍作れる', result: '2本目のラインを買い、1月末に払う。' },
        { id: 'wait', label: '春まで待つ', desc: '税金を払ってから考える', result: '今は買わない。' },
      ] },
    { t: 'doc', kind: 'machine', id: 'line2-buy', when: (S) => D_(S).line2 === 'buy', manual: true, doc: { type: '請求書', title: '請求書（2本目の充填ライン）', from: 'オオヤマ機械', to: SHOP, date: '1月20日', rows: [['充填ライン（中古・据付込み）', 840000, 'amt'], ['消費税（10％）', 84000, 'amt'], ['合計（1月31日に振込）', 924000, 'amt']] },
      ans: je([['機械装置', 840000], ['仮払消費税', 84000]], [['普通預金', 924000]]), opts: opts('機械装置', '仮払消費税', '未払金') },
    ...facDocs(1), serviceRev(1), ...routine2(1),
  ] };

  // ---------- 2年目 2月：でんさい・クレジット（E18）、紙の手形（E17・参考） ----------
  // 帳簿（正しいほう）の残高。ただし、いま書いている書類そのものの仕訳は数えない（書き直しても金額が変わらないように）
  const balEx = (S, acc, ex) => S.T.filter((e) => e.ev !== ex).reduce((t, e) => t + e.dr.filter(([a]) => a === acc).reduce((x, [, v]) => x + v, 0) - e.cr.filter(([a]) => a === acc).reduce((x, [, v]) => x + v, 0), 0);
  const CARD = 25000;
  const m2 = { m: 2, year: Y, label: L(2), title: '紙をやめて、電子にする', events: [
    { t: 'talk', teaches: ['でんさい'], lines: [['eigyo', 'B社が「これからは請求書の代金を、でんさいで払いたい」って。2号店では、カードで払いたいお客さんも増えてきた。'], ['shacho', 'でんさいって何？ カードの手数料は、だれが払うの？']] },
    { t: 'discover', id: 'd-denshi', moves: ['資産+', '資産-'], p: 'P1', title: 'B社からの「発生記録」は何？',
      b1: { talk: [['piyo', 'B社から「発生記録のお知らせ」が届いたピヨ。お金はまだ入っていない。']],
        doc: { type: '発生記録のお知らせ', title: 'でんさい 発生記録のお知らせ', from: 'みらい銀行（でんさい）', to: SHOP, date: '2月10日', rows: [['払う人', 'B社'], ['受け取る人', SHOP], ['金額', bWith({ decisions: {} }, 1), 'amt'], ['支払期日', '4月30日']] } },
      predict: { q: 'この知らせが来たとき、売掛金はどうなると思う？', opts: [{ t: 'そのまま' }, { t: '別の形に変わる', ok: true }, { t: 'お金になる' }] },
      b2: { q: 'B社の1月分の売掛金。発生記録のあと、どの札にする？', token: '売掛金 151,200', layout: 'options', targets: [
        { id: 'keep', label: '売掛金のまま', ok: false, react: '「4月30日に払う」と電子の記録に残った。ただの後払いの約束より、強い約束に変わった' },
        { id: 'denshi', label: '電子の約束の札に置きかえる', ok: true },
        { id: 'cash', label: 'お金が入ったことにする', ok: false, react: 'お金が入るのは4月30日。今日はまだ入っていない' },
      ], reasons: [
        { t: '期日に払う約束が、電子の記録になったから', ok: true },
        { t: '期日が先なので、売上も先に動くから', ok: false, fork: '期日＝実現', react: '売上は、レモネードを渡した1月に、もう書いた。動いたのは約束の形だけ' },
      ], hints: ['お金は、今日入った？', '約束の中身は、何が変わった？'] },
      b3: { ok: '売掛金が、電子の記録の約束に変わった。売上はもう書いてあるので、資産の中で札が変わっただけ。お金は4月30日に入る。' },
      b4: { name: '電子記録債権・電子記録債務・クレジット売掛金', line: '電子の記録（でんさい）で「期日に払う」と約束した、もらう権利が「電子記録債権」、払う義務が「電子記録債務」。カードで売った代金をカード会社からもらう権利は「クレジット売掛金」。カード会社に払う手数料は、売ったときに支払手数料にする。',
        exam: '「売掛金について電子記録債権の発生記録が行われた」「クレジット払いで販売した。信販会社への手数料は販売時に計上する」', teaches: ['電子記録債権', '電子記録債務', 'クレジット売掛金'], leaf: { p: 'P1', label: '電子の約束' } },
      hand: '電子記録債権（でんさい）：発生記録で 電子記録債権／売掛金、支払期日に 普通預金／電子記録債権。払う側は 買掛金／電子記録債務。クレジット販売：クレジット売掛金（手数料を引いた額）・支払手数料／売上。むかしの紙の約束と同じ役目で、2027年度からの試験では、紙の約束のかわりに出る。' },
    { t: 'talk', teaches: ['約束手形'], lines: [['senpai', '参考の話。むかしは、紙の「約束手形」で同じことをしていた。2027年度の試験には出ない。でんさいが、その代わりになっている。']] },
    { t: 'doc', kind: 'denshi_rec', id: 'denshi1', doc: { type: '発生記録のお知らせ', title: 'でんさい 発生記録のお知らせ', from: 'みらい銀行（でんさい）', to: SHOP, date: '2月10日', rows: (S) => [['払う人', 'B社（1月分の代金）'], ['金額', bWith(S, 1), 'amt'], ['支払期日', '4月30日']] },
      ans: (S) => je([['電子記録債権', bWith(S, 1)]], [['売掛金', bWith(S, 1)]]), opts: opts('電子記録債権', 'クレジット売掛金', '電子記録債務') },
    { t: 'doc', kind: 'card_sale', id: 'card2', doc: { type: 'レジ締め日報', title: '2月のカード払いの日報（2号店）', from: '2号店レジ', to: '経理', date: '2月末', rows: [['カード払いの売上（税抜）', CARD, 'amt'], ['消費税（8％）', tax8(CARD), 'amt'], ['カード会社の手数料（3％）', Math.round((CARD + tax8(CARD)) * 0.03), 'amt'], ['カード会社から入る額', CARD + tax8(CARD) - Math.round((CARD + tax8(CARD)) * 0.03), 'amt']] },
      ans: je([['クレジット売掛金', CARD + tax8(CARD) - Math.round((CARD + tax8(CARD)) * 0.03)], ['支払手数料', Math.round((CARD + tax8(CARD)) * 0.03)]], [['売上', CARD], ['仮受消費税', tax8(CARD)]]), opts: opts('クレジット売掛金', '電子記録債権', '支払手数料', '仮受消費税') },
    { t: 'decision', id: 'due', q: '払う約束の期日の一覧を作る？', talk: [['shacho', 'でんさいなら、払う日を先にのばせるんでしょ。一覧なんていらないよ。'], ['senpai', '3月からは問屋への支払いもでんさいになる。期日がばらばらになるぞ。']],
      trial: (S, o) => [['4月30日に払うでんさい（見込み）', buyWith(3)], ['一覧', o === 'list' ? '期日ごとに、払う額と口座を書き出す' : '作らない。通知が来たら考える']],
      options: [
        { id: 'list', label: '期日の一覧を作る', desc: '毎月、少し手間がかかる', result: '払う約束を、期日の順に一覧にする。', ending: ['be10-warn'] },
        { id: 'none', label: '社長の言うとおり、作らない', desc: '手間がかからない', result: '一覧は作らない。' },
      ] },
    ...routine2(2).filter((e) => e.id !== 'y2col2-B社'), ...facDocs(2),
  ] };

  // ---------- 2年目 3月：問屋への支払いもでんさいに（E18後半）、A社とC社の貸倒れ（E19）、銀行の問い（E23の困りごと） ----------
  const C_SALE = 50000;
  const m3 = { m: 3, year: Y, label: L(3), title: '払えなくなったお客さん', events: [
    { t: 'doc', kind: 'denshi_pay', id: 'denshi2', doc: { type: '発生記録のお知らせ', title: 'でんさい 発生記録（問屋への支払い）', from: 'みらい銀行（でんさい）', to: SHOP, date: '3月10日', rows: [['払う人', SHOP], ['受け取る人', 'ハッピー問屋（3月分の代金）'], ['金額', buyWith(3), 'amt'], ['支払期日', '4月30日']] },
      ans: je([['買掛金', buyWith(3)]], [['電子記録債務', buyWith(3)]]), opts: opts('電子記録債務', '電子記録債権') },
    { t: 'doc', kind: 'denshi_rec', id: 'denshi3', doc: { type: '発生記録のお知らせ', title: 'でんさい 発生記録のお知らせ', from: 'みらい銀行（でんさい）', to: SHOP, date: '3月10日', rows: (S) => [['払う人', 'B社（2月分の代金）'], ['金額', bWith(S, 2), 'amt'], ['支払期日', '5月31日']] },
      ans: (S) => je([['電子記録債権', bWith(S, 2)]], [['売掛金', bWith(S, 2)]]), opts: opts('電子記録債権', '電子記録債務') },
    { t: 'talk', when: (S) => D_(S).due === 'none', lines: [['kansa', '期日の一覧がないと、どの日にいくら口座に入れておくか、だれにも分かりませんよ。でんさいは、期日に口座から自動で引き落とされます。']] },
    { t: 'talk', when: (S) => D_(S).due === 'list', lines: [['senpai', '一覧に書いておいた。4月30日：問屋へのでんさい。5月31日：税金。口座のお金を、期日の前に入れておこう。']] },
    { t: 'discover', id: 'd-kashidaore', moves: ['費用+', 'マイナス-'], p: 'P4', title: '去年の見込みに、今年のお客さんは入っていた？',
      b1: { talk: [['eigyo', 'A社の再生の計画が決まって、20万円のうち8万円だけ払ってくれた。それと、2号店のお客さんのC社が、店をたたんじゃった。'], ['shacho', '去年、もらえない見込みを作ったよね。全部それで消せばいいんでしょ。C社も。']],
        dyn: (S) => (D_(S).credit === 'credit' ? 'A社：売掛金 200,000円（去年作ったマイナスの札 100,000円）　C社：売掛金 54,000円（今年12月に売った）' : 'C社：売掛金 54,000円（今年12月に売った）。A社には、うちは売っていない') },
      predict: { q: '去年作ったマイナスの札で消せるのは、どっち？', opts: [{ t: 'A社の分', ok: true }, { t: 'C社の分' }, { t: '両方' }] },
      b2: { q: 'もらえなくなった2つの売掛金。どう消す？', layout: 'sort', tokens: [
        { id: 'a', label: 'A社（去年の見込みに入っていた）', target: 'allow' },
        { id: 'c', label: 'C社（今年のお客さん）', target: 'loss' },
      ], targets: [{ id: 'allow', label: '去年作ったマイナスの札で消す' }, { id: 'loss', label: '今年の費用にする' }],
      wrongReact: 'マイナスの札は、去年の売掛金のために作った見込み。今年売ったC社の分は、その見込みに入っていない。今年の費用にする。', reasons: [
        { t: '去年の見込みは、去年の売掛金のためのものだから', ok: true },
        { t: 'マイナスの札が残っていれば、何にでも使えるから', ok: false, fork: '残高があるから引当金を使う', react: '残っていても、見込みに入っていなかった売掛金には使えない' },
        { t: '足りない分は、マイナスの札をマイナスにしてよいから', ok: false, fork: '引当金をマイナスに', react: 'マイナスの札が足りないときは、足りない分を今年の費用にする' },
      ], hints: ['去年の3月に、C社はお客さんだった？'] },
      b3: { ok: 'A社の分は、去年作ったマイナスの札で消す。足りない分と、今年売ったC社の分は、今年の費用にする。' },
      b4: { name: '貸倒れ・貸倒損失', line: '売掛金がもらえなくなることを「貸倒れ」という。去年の売掛金なら、作っておいたマイナスの札（貸倒引当金）で消し、足りない分は費用の「貸倒損失」。今年売った分は、全部「貸倒損失」。あとで払ってもらえたら、収益の「償却債権取立益」。',
        exam: '「前期に貸倒引当金を設定した売掛金が貸し倒れた。引当金の残高を超える額は貸倒損失とする」', teaches: ['貸倒れ', '貸倒損失', '償却債権取立益'], leaf: { p: 'P4', label: '貸倒れの消し方' } },
      hand: '去年までの売掛金の貸倒れ：貸倒引当金（残りまで）と貸倒損失（足りない分）で売掛金を消す。今年売った売掛金の貸倒れ：全部を貸倒損失にする（貸倒引当金は使わない）。去年までに消した売掛金をあとで払ってもらえたら、償却債権取立益。' },
    { t: 'doc', kind: 'bad_debt', id: 'bad-a', when: (S) => D_(S).credit === 'credit', doc: { type: '再生計画のお知らせ', title: 'A社 再生計画による支払いのお知らせ', from: 'A社（再生債務者）', to: SHOP, date: '3月20日', rows: [['お持ちの売掛金', 200000, 'amt'], ['払われる額（40％）', 80000, 'amt'], ['払われない額', 120000, 'amt'], ['去年作ったマイナスの札（A社の分）', 100000, 'amt'], ['足りない分', 20000, 'amt']] },
      ans: je([['普通預金', 80000], ['貸倒引当金', 100000], ['貸倒損失', 20000]], [['売掛金', 200000]]), opts: opts('貸倒引当金', '貸倒損失', '貸倒引当金繰入') },
    { t: 'doc', kind: 'bad_debt', id: 'bad-c', doc: { type: '廃業のお知らせ', title: 'C社 廃業のお知らせ', from: 'C社', to: SHOP, date: '3月25日', rows: [['お持ちの売掛金（12月の分）', C_SALE + tax8(C_SALE), 'amt'], ['払われる見込み', 'なし']] },
      ans: je([['貸倒損失', C_SALE + tax8(C_SALE)]], [['売掛金', C_SALE + tax8(C_SALE)]]), opts: opts('貸倒引当金', '貸倒損失', '貸倒引当金繰入') },
    { t: 'doc', kind: 'collect_card', id: 'card-col', doc: passbook('3月10日', 'カード会社から 2月分の入金', 'お預け入れ', CARD + tax8(CARD) - Math.round((CARD + tax8(CARD)) * 0.03)),
      ans: je([['普通預金', CARD + tax8(CARD) - Math.round((CARD + tax8(CARD)) * 0.03)]], [['クレジット売掛金', CARD + tax8(CARD) - Math.round((CARD + tax8(CARD)) * 0.03)]]), opts: opts('クレジット売掛金', '売掛金') },
    { t: 'talk', lines: [['ginko', '来年、工場を広げるご相談なら、決算書で「本業でいくらもうけたか」「本業以外でいくらか」「1年以内に払うお金はいくらか」を見せてください。'], ['shacho', '全部まとめて、もうけでいいじゃん。']] },
    ...routine2(3).filter((e) => e.id !== 'y2col3-B社'), ...facDocs(3),
  ] };
  // 12月に、2号店のお客さんC社へ掛けで売った（3月に廃業する）
  m12.events.splice(m12.events.length - routine2(12).length, 0, { t: 'doc', kind: 'sell_credit_vat', id: 'sell-c', doc: { type: '請求書（控え）', title: '請求書', from: SHOP, to: 'C社', date: '12月15日', rows: [['品名', 'レモネード（業務用）'], ['税抜の金額', C_SALE, 'amt'], ['消費税（8％）', tax8(C_SALE), 'amt'], ['合計', C_SALE + tax8(C_SALE), 'amt'], ['お支払期日', '3月末']] },
    ans: je([['売掛金', C_SALE + tax8(C_SALE)]], [['売上', C_SALE], ['仮受消費税', tax8(C_SALE)]]), opts: opts('仮受消費税') });

  // ---------- 決算作業台①：机（整理事項を自分で見つける。未処理2つ） ----------
  const D_PAY = 432000;
  const vatNet = (S) => -balEx(S, '仮受消費税', 'vat-settle') - balEx(S, '仮払消費税', 'vat-settle'); // 預かった−払った
  const deskA = { m: 3, year: Y, seg: 'desk', label: '2年目 決算①', title: '机の上の書類から、直すものを探す', events: [
    { t: 'desk', id: 'desk2', q: '机の上の11の書類。決算で帳簿を直す必要があるのは、どれ？（いくつでも）',
      talk: [['kansa', '2年目の決算です。書類が増えましたね。直すものを、自分で探してみてください。'], ['shacho', '毎月ちゃんと書いてきたんだから、ほとんどないでしょ？']],
      items: [
        { id: 'fee', title: '普通預金 通帳（3月31日）', line: '3月31日に振込手数料 660円。帳簿にない。', need: true, why: '書き忘れ（未処理）。決算の前に書く。' },
        { id: 'dpay', title: '普通預金 通帳（3月30日）', line: '「D社から 代金 432,000」が3月30日に入っている。帳簿にない。', need: true, why: '未処理。売掛金がへるので、もらえない見込み（貸倒引当金）の計算も変わる。' },
        { id: 'ar', title: '売掛金と電子記録債権の明細', line: 'B社の売掛金とでんさい。C社は消した。', need: true, why: '残りの2％の見込みを作る。去年の残りとの差だけ。' },
        { id: 'stock', title: '棚卸表（お店）', line: '残っている商品 60,000円と、売れ残りのマシン1台 200,000円。', need: true, why: '売れ残りは今年の費用ではない。去年の売れ残りと入れかえる。' },
        { id: 'fstock', title: '棚卸表（工場）', line: '材料と製品の残り。帳簿と同じ数だった。', need: false, why: '工場の瓶は、売るたびに原価を出してきた。目減りも12月に書いた。直すことはない。' },
        { id: 'fa', title: '固定資産台帳', line: 'トラック（2年目）と、充填ライン（月割で毎月書いてある）。', need: true, why: 'トラックの今年の分を書く。機械は毎月書いてあるので、そのまま。' },
        { id: 'rent', title: '家賃の領収書（1年分）', line: '7月に66万円。7月〜翌年6月の分。', need: true, why: '来年4〜6月の分は、今年の費用ではない。' },
        { id: 'hoshu', title: 'B社の点検の契約の一覧', line: '2年間の点検 60,000円。8月から8か月たった。', need: true, why: '点検した8か月分を、これからやる約束から売上へ移す（全部売上にしていたら、多すぎる分を戻す）。' },
        { id: 'class', title: '教室の受講者名簿', line: '6回のうち5回終わった。6回目は4月。テキスト代は作業の途中の箱に60,000円。', need: true, why: '5回分のテキスト代を、教室の費用（役務原価）へ移す。6回目の月謝は、まだ約束のまま。' },
        { id: 'vat', title: '消費税の集計表', line: '1年間に預かった消費税と、払った消費税。', need: true, why: '差し引きして、国に納める（または戻ってくる）額を出す。' },
        { id: 'order', title: 'B社の4月分の注文書', line: '4月に届けるレモネードの注文。', need: false, why: '来年のこと。今年の売上には入れない。' },
      ] },
    { t: 'doc', kind: 'fee', id: 'fee-y2', doc: passbook('3月31日', '振込手数料', 'お引出し', 660), ans: je([['支払手数料', 660]], [['普通預金', 660]]), opts: opts('支払手数料') },
    { t: 'doc', kind: 'collect_ar', id: 'd-col', doc: passbook('3月30日', 'D社から 代金のお支払い', 'お預け入れ', D_PAY), ans: je([['普通預金', D_PAY]], [['売掛金', D_PAY]]), opts: opts() },
    { t: 'doc', kind: 'service_cost', id: 'class-cost', doc: { type: '受講者名簿', title: '教室のテキスト代の振替', from: '教室（ハルカ）', to: '経理', date: '3月31日', rows: [['作業の途中の箱にあるテキスト代（6回分）', 60000, 'amt'], ['終わった5回分', 50000, 'amt']] },
      ans: je([['役務原価', 50000]], [['仕掛品', 50000]]), opts: opts('役務原価', '仕掛品', '前受金', '役務収益') },
    { t: 'doc', kind: 'vat_settle', id: 'vat-settle', doc: { type: '消費税の集計表', title: '消費税の集計表（1年分）', from: '経理', to: '経理', date: '3月31日', rows: (S) => { const u = -balEx(S, '仮受消費税', 'vat-settle'), p = balEx(S, '仮払消費税', 'vat-settle'); return [['預かった消費税', u, 'amt'], ['払った消費税', p, 'amt'], [u >= p ? '国に納める額' : '国から戻ってくる額', Math.abs(u - p), 'amt']]; } },
      ans: (S) => { const u = -balEx(S, '仮受消費税', 'vat-settle'), p = balEx(S, '仮払消費税', 'vat-settle'); return u >= p ? je([['仮受消費税', u]], [['仮払消費税', p], ['未払消費税', u - p]]) : je([['仮受消費税', u], ['未収還付消費税', p - u]], [['仮払消費税', p]]); }, opts: opts('仮受消費税', '仮払消費税', '未払消費税', '未収還付消費税') },
  ] };
  Object.assign(SIM.namings, {
    未払消費税: { q: '預かった消費税から払った消費税を引いた残りは、5月に国に納める。いまは何の札？', opts: [
      { t: '返すお金（負債）', ok: true },
      { t: 'じぶんのお金をへらした原因（費用）', react: '消費税はお客さんが負担したもの。ピヨ商店の費用ではなく、預かって納めるだけ' },
    ], line: 'まだ納めていない消費税は、負債の「未払消費税」。', teaches: ['未払消費税'] },
    未収還付消費税: { q: '払った消費税のほうが多かった。その差は、国から戻ってくる。いまは何の札？', opts: [
      { t: 'もっているもの（資産）', ok: true },
      { t: 'じぶんのお金を増やした原因（収益）', react: '戻ってくるのは、払いすぎていた分。もうけではない' },
    ], line: '国から戻ってくる消費税は、資産の「未収還付消費税」。', teaches: ['未収還付消費税'] },
    前払家賃: { q: '来年4〜6月の家賃を、もう払っている。いまは何の札？', opts: [
      { t: 'もっているもの（資産）', ok: true },
      { t: 'じぶんのお金をへらした原因（費用）', react: 'まだ使っていない3か月分は、これから使える権利。費用になるのは来年' },
    ], line: '来年の分を先に払った家賃は、資産の「前払家賃」。', teaches: ['前払家賃'] },
  });

  // ---------- 決算作業台②：時間（経過勘定・減価償却・引当金・商品・収益の訂正・税金） ----------
  const PRE_RENT = 150000; // 4〜6月の3か月分
  const stockOpen = (S) => (D_(S).volume === '3m' ? 140000 : 50000), STOCK_END = 260000;
  const arEnd = (S) => balEx(S, '売掛金', 'y2allow') + balEx(S, '電子記録債権', 'y2allow');
  const allowSet = (S) => Math.max(0, Math.round(arEnd(S) * 0.02) + balEx(S, '貸倒引当金', 'y2allow'));
  const depY2 = (S) => (D_(S).dep === 'rate' ? 73600 : 48000);
  const deskB = { m: 3, year: Y, seg: 'time', label: '2年目 決算②', title: '1年分の家賃のうち、今年の分は？', events: [
    { t: 'discover', id: 'd-keika', moves: ['資産+', '費用-'], p: 'P3', title: '家賃66万円のうち、今年の分は？',
      b1: { talk: [['kansa', '7月に払った家賃は、来年6月までの12か月分でしたね。'], ['shacho', '払ったのは今年なんだから、全部今年の費用でしょ。']] },
      predict: { q: '今年の費用になる家賃は、12か月分より多い？ 少ない？', opts: [{ t: '少ない', ok: true }, { t: '同じ' }, { t: '多い' }] },
      b2: { q: '家賃60万円（税抜・12か月分）の帯を、どこで切る？', token: '家賃 600,000', layout: 'timeline', targets: [
        { id: 'all', label: '12か月分 全部が今年', sub: '払った年', ok: false, react: '来年4〜6月の3か月分は、まだ使っていない。払った年ではなく、使った期間で分ける' },
        { id: 'nine', label: '7〜3月の9か月分が今年', sub: '残り3か月は来年', ok: true },
        { id: 'zero', label: '全部が来年', sub: '1年たってから', ok: false, react: '7月から3月まで、もう2号店を使ってきた。その分は今年の費用' },
      ], reasons: [
        { t: '費用は、使った期間の分だけだから', ok: true },
        { t: '払った年に、全部まとめて費用にするから', ok: false, fork: '現金主義', react: '払った日で費用を決めると、来年は家賃ゼロで店を使っているように見える' },
      ], hints: ['3月31日までに、何か月使った？'] },
      b3: { ok: '9か月分45万円が今年の費用。残り3か月分15万円は、来年使う権利として資産に残す。来年の4月1日に、費用へ戻す。' },
      b4: { name: '前払費用（前払家賃）・経過勘定', line: '来年の分を先に払った費用は、資産の「前払費用」（家賃なら前払家賃）にする。年をまたぐお金を、期間で切り分ける札をまとめて「経過勘定」という。兄弟に、前受・未払・未収がある。',
        exam: '「家賃は毎年7月1日に向こう1年分を支払っている」', teaches: ['前払費用', '前払家賃', '経過勘定', '前受', '未収'], leaf: { p: 'P3', label: '年をまたぐお金' } },
      hand: '年をまたぐお金の札：前払費用（来年の費用を先に払った・資産）、前受（来年の収益を先にもらった・負債）、未払（今年の費用をまだ払っていない・負債）、未収（今年の収益をまだもらっていない・資産）。来年の4月1日に、元の札に戻す。' },
    { t: 'doc', kind: 'prepaid', id: 'pre-rent', doc: { type: '家賃の計算表', title: '家賃の切り分け（3月31日）', from: '経理', to: '経理', date: '3月31日', rows: [['7月に払った家賃（12か月分・税抜）', RENT, 'amt'], ['来年4〜6月の3か月分', PRE_RENT, 'amt']] },
      ans: je([['前払家賃', PRE_RENT]], [['支払家賃', PRE_RENT]]), opts: opts('前払家賃', '支払家賃', '未払金') },
    { t: 'doc', kind: 'dep', id: 'dep-y2', doc: { type: '固定資産台帳', title: '固定資産台帳（トラック・2年目）', from: '経理', to: '経理', date: '3月31日', rows: (S) => [['トラック 取得原価', 240000, 'amt'], ['やり方', D_(S).dep === 'rate' ? '定率法（償却率0.4）' : '定額法（5年）'], ['今年の減価償却費（12か月）', depY2(S), 'amt']] },
      ans: (S) => je([['減価償却費', depY2(S)]], [['車両運搬具減価償却累計額', depY2(S)]]), opts: opts('減価償却費', '車両運搬具減価償却累計額', '減価償却累計額') },
    { t: 'doc', kind: 'allow', id: 'y2allow', doc: { type: '監査メモ', title: '貸倒れの見込み（2年目）', from: '森（会計士）', to: '経理', date: '3月31日', rows: (S) => [['売掛金と電子記録債権の残り', arEnd(S), 'amt'], ['その2％', Math.round(arEnd(S) * 0.02), 'amt'], ['いまのマイナスの札の残り', -balEx(S, '貸倒引当金', 'y2allow'), 'amt'], ['足りない分（今年の費用）', allowSet(S), 'amt']] },
      ans: (S) => je([['貸倒引当金繰入', allowSet(S)]], [['貸倒引当金', allowSet(S)]]), opts: opts('貸倒引当金', '貸倒引当金繰入', '貸倒損失') },
    { t: 'doc', kind: 'stock_open', id: 'stock-open', doc: { type: '棚卸表', title: '去年の売れ残り（期首の商品）', from: '倉庫', to: '経理', date: '3月31日', rows: (S) => [['去年の3月31日に残っていた商品', stockOpen(S), 'amt'], ['メモ', '今年、売れて費用になった']] },
      ans: (S) => je([['仕入', stockOpen(S)]], [['繰越商品', stockOpen(S)]]), opts: opts('繰越商品', '仕入', '売上原価') },
    { t: 'doc', kind: 'stock', id: 'stock-y2', doc: { type: '棚卸表', title: '棚卸表（お店・3月31日）', from: '倉庫', to: '経理', date: '3月31日', rows: [['レモン・砂糖ほか', 60000, 'amt'], ['業務用マシン 1台', 200000, 'amt'], ['合計', STOCK_END, 'amt']] },
      ans: je([['繰越商品', STOCK_END]], [['仕入', STOCK_END]]), opts: opts('繰越商品', '仕入', '売上原価') },
    { t: 'doc', kind: 'hoshu', id: 'hoshu-rev', when: (S) => D_(S).revenue !== 'follow', doc: { type: '契約の一覧', title: 'B社の点検（8か月分）', from: '経理', to: '経理', date: '3月31日', rows: [['点検の約束（24か月分）', HOSHU, 'amt'], ['8〜3月に点検した8か月分', HOSHU / 3, 'amt']] },
      ans: je([['契約負債', HOSHU / 3]], [['売上', HOSHU / 3]]), opts: opts('契約負債', '売上', '前受金') },
    { t: 'decision', id: 'fix15', when: (S) => D_(S).revenue === 'follow', q: '8月に全部売上にした点検の分。どうする？', talk: [['kansa', '9月の指摘事項です。来年以降の点検16か月分、4万円が今年の売上に入ったままです。'], ['shacho', '今年はもうけが大きいほうがいいんだよなあ。このままにしておいてよ。']],
      trial: (S, o) => [['今年の売上（点検の分）', o === 'fix' ? HOSHU / 3 : HOSHU], ['来年以降の売上（点検の分）', o === 'fix' ? HOSHU * 2 / 3 : 0]],
      options: [
        { id: 'fix', label: '直す。まだやっていない16か月分を、約束に戻す', desc: '今年の売上は4万円へる', result: '売上から4万円を契約負債へ戻す。', ending: ['be3-final'] },
        { id: 'keep', label: '社長の言うとおり、このままにする', desc: '今年の売上が大きく見える', result: '直さずに決算書を作る。' },
      ] },
    { t: 'doc', kind: 'hoshu_fix', id: 'hoshu-fix', when: (S) => D_(S).fix15 === 'fix', doc: { type: '訂正のメモ', title: '点検の売上の訂正', from: '経理', to: '経理', date: '3月31日', rows: [['8月に売上にした点検', HOSHU, 'amt'], ['まだやっていない16か月分', HOSHU * 2 / 3, 'amt']] },
      ans: je([['売上', HOSHU * 2 / 3]], [['契約負債', HOSHU * 2 / 3]]), opts: opts('契約負債', '売上', '前受金') },
    { t: 'decision', id: 'divfix', when: (S) => D_(S).dividend === 'all' && D_(S).capital === 'all', q: '6月の配当が、上限を超えていた。どうする？', talk: [['kansa', '配当の上限を超えた分と、積み立てていない利益準備金。このまま決算書を出すと、問題になります。'], ['shacho', '佐藤さんに返してなんて言えないよ。このままでいいでしょ。']],
      trial: (S, o) => [['上限を超えた配当', reNow(S) - divLimit(S)], ['積み立てるはずだった利益準備金', divLimit(S) / 10], ['手当て', o === 'fix' ? '超えた分の返還を株主にお願いし、準備金を積む' : 'そのまま決算書を出す']],
      options: [
        { id: 'fix', label: '株主に事情を話して、超えた分を返してもらい、準備金を積む', desc: '佐藤さんに頭を下げる', result: '超えた分の返還をお願いし、利益準備金を積む。', ending: ['be5-final'] },
        { id: 'keep', label: '社長の言うとおり、このまま', desc: 'だれにも言わない', result: '配当はそのまま。準備金も積まない。' },
      ] },
    { t: 'doc', kind: 'div_fix', id: 'div-back', when: (S) => D_(S).divfix === 'fix', doc: { ...passbook('3月25日', '入金 株主のみなさま（配当の返還）', 'お預け入れ', 0), rows: (S) => [['摘要', '入金 株主のみなさま（上限を超えた配当の返還）'], ['お預け入れ', reNow(S) - divLimit(S), 'amt']] },
      ans: (S) => je([['普通預金', reNow(S) - divLimit(S)]], [['繰越利益剰余金', reNow(S) - divLimit(S)]]), opts: opts('繰越利益剰余金', '未払配当金', '利益準備金') },
    { t: 'doc', kind: 'div_fix', id: 'div-res', when: (S) => D_(S).divfix === 'fix', doc: { type: '株主総会議事録', title: '臨時株主総会議事録（抜粋）', from: SHOP, to: '株主のみなさま', date: '3月25日', rows: (S) => [['議案', '利益準備金の積立の件　可決'], ['積み立てる利益準備金', divLimit(S) / 10, 'amt']] },
      ans: (S) => je([['繰越利益剰余金', divLimit(S) / 10]], [['利益準備金', divLimit(S) / 10]]), opts: opts('繰越利益剰余金', '利益準備金', '資本準備金') },
    { t: 'doc', kind: 'tax', id: 'tax2', when: (S) => SIM.__h.taxOf(S) > 0, doc: { type: '税金の見込み（計算メモ）', title: '法人税・住民税・事業税の見込み（2年目）', from: '岩田税理士事務所', to: SHOP, date: '3月31日', rows: (S) => [['税金をかける前の、この1年のもうけ', SIM.__h.niOf(S, { pre: true }), 'amt'], ['税金（およそ3割・100円未満は切り捨て）', SIM.__h.taxOf(S), 'amt'], ['納める期限', '5月31日']] },
      ans: (S) => je([['法人税等', SIM.__h.taxOf(S)]], [['未払法人税等', SIM.__h.taxOf(S)]]), opts: opts('法人税等', '未払法人税等') },
  ] };

  // ---------- 決算作業台③：差異の片づけ・精算表・区分・締め切り ----------
  const varBal = (S, acc) => balEx(S, acc, 'var-close');
  const deskC = { m: 3, year: Y, seg: 'sheet', label: '2年目 決算③', title: '1年の締めを、1枚で', events: [
    { t: 'discover', id: 'd-sai', moves: ['費用+'], p: 'P3', title: 'ムダ（差異）を、来年の瓶に乗せない',
      b1: { talk: [['kojo', '1月から、予定の値段と実際との差が、差の箱にたまっています。'], ['shacho', '来年の瓶の値段に入れておけばいいんじゃない？']], dyn: (S) => `材料の差：${yen(varBal(S, '材料消費価格差異'))}円　賃金の差：${yen(varBal(S, '賃率差異'))}円（プラスは実際のほうが高かった分）` },
      b2: { q: '差の箱にたまった差。1年の終わりに、どこへ運ぶ？', layout: 'flow', tokens: (S) => [
        flowTok('mv', `材料の差 ${yen(Math.abs(varBal(S, '材料消費価格差異')))}`, 'cogs', varBal(S, '材料消費価格差異') >= 0 ? ['売上原価', '材料消費価格差異', varBal(S, '材料消費価格差異')] : ['材料消費価格差異', '売上原価', -varBal(S, '材料消費価格差異')]),
        flowTok('wv', `賃金の差 ${yen(Math.abs(varBal(S, '賃率差異')))}`, 'cogs', ['売上原価', '賃率差異', varBal(S, '賃率差異')]),
      ], targets: [{ id: 'var', label: '差の箱', side: true }, { id: 'fg', label: 'できあがり' }, { id: 'cogs', label: '売れた分' }],
      wrongReact: '差は、今年のやり方のずれ。来年の瓶に乗せずに、今年の「売れた分（売上原価）」で片づける。', reasons: [
        { t: '今年のずれは、今年の費用で片づけるから', ok: true },
        { t: '差は、倉庫の瓶に戻すから', ok: false, fork: '差異を製品に戻す', react: '倉庫の瓶に戻すと、来年の瓶の値段に今年のずれが混ざってしまう' },
      ], hints: ['その差は、何年のこと？'] },
      b3: { ok: '差の箱を空にして、売上原価へ。実際のほうが高かった差は売上原価を増やし、安かった差はへらす。' },
      b4: { name: '原価差異の処理（売上原価に賦課）', line: '予定と実際の差（原価差異）は、1年の終わりに売上原価に足したり引いたりして片づける。これを売上原価に「賦課する」という。',
        exam: '「原価差異は、会計年度末に売上原価に賦課する」', teaches: ['原価差異', '賦課'], leaf: { p: 'P3', label: '差異の片づけ' } },
      hand: '原価差異（材料消費価格差異・賃率差異など）は、原則として1年の終わりに売上原価に振り替える。不利差異（借方残高）は売上原価に加算、有利差異（貸方残高）は減算。' },
    { t: 'doc', kind: 'var_close', id: 'var-close', doc: { type: '差異の集計表', title: '原価差異の集計表（1年分）', from: '工場', to: '経理', date: '3月31日', rows: (S) => { const m = varBal(S, '材料消費価格差異'), w = varBal(S, '賃率差異'); return [[m >= 0 ? '材料消費価格差異（実際のほうが高かった）' : '材料消費価格差異（実際のほうが安かった）', Math.abs(m), 'amt'], [w >= 0 ? '賃率差異（実際のほうが高かった）' : '賃率差異（実際のほうが安かった）', Math.abs(w), 'amt'], [m + w >= 0 ? '売上原価に足す額（差し引き）' : '売上原価から引く額（差し引き）', Math.abs(m + w), 'amt']]; } },
      ans: (S) => { const m = varBal(S, '材料消費価格差異'), w = varBal(S, '賃率差異'), dr = [], cr = []; const put = (acc, v) => { if (v > 0) cr.push([acc, v]); else if (v < 0) dr.push([acc, -v]); }; put('材料消費価格差異', m); put('賃率差異', w); const net = m + w; if (net > 0) dr.unshift(['売上原価', net]); else if (net < 0) cr.unshift(['売上原価', -net]); return je(dr, cr); }, opts: opts('売上原価', '材料消費価格差異', '賃率差異', '製品') },
    { t: 'sheet', id: 'sheet2' },
    { t: 'discover', id: 'd-kubun', moves: [], p: 'P5', title: '銀行が聞いてくる「区分」',
      b1: { talk: [['ginko', '本業でいくらもうけたか。本業以外でいくらか。1年以内に払うお金はいくらか。決算書のどこを見れば分かりますか。'], ['shacho', '全部まとめて「もうけ」でいいじゃん。']] },
      predict: { q: '「株を出すときの手数料」は、本業のお金だと思う？', opts: [{ t: '本業' }, { t: '本業以外', ok: true }] },
      b2: { q: '損益計算書と貸借対照表の札を、区分に分けよう。', layout: 'sort', tokens: [
        { id: 'cogs', label: '売上原価', target: 'genka' },
        { id: 'rent', label: '支払家賃', target: 'hankan' },
        { id: 'fee', label: '株式交付費', target: 'eigaigai' },
        { id: 'int', label: '支払利息', target: 'eigaigai' },
        { id: 'ar', label: '売掛金', target: 'ryudo' },
        { id: 'mac', label: '機械装置', target: 'kotei' },
      ], targets: [{ id: 'genka', label: '売った物の原価' }, { id: 'hankan', label: '売るための費用' }, { id: 'eigaigai', label: '本業以外の費用' }, { id: 'ryudo', label: '1年以内にお金になる資産' }, { id: 'kotei', label: '長く使う資産' }],
      wrongReact: '売った物そのものの原価、売るための費用、本業以外のお金に分ける。資産は、1年以内にお金になるか、長く使うかで分ける。', reasons: [
        { t: '読む人が判断しやすくするため', ok: true },
        { t: '金額の大きい順に並べるため', ok: false, fork: '見せ方の好み', react: '大きさの順ではなく、読む人が何を判断したいかで区分を決める' },
      ], hints: ['借りたお金の利息は、レモネードを売る仕事のお金？'] },
      b3: { ok: '売上から売った物の原価を引くと、ざっくりのもうけ。そこから売るための費用を引くと、本業のもうけ。本業以外を足し引きすると、ふだんのもうけ。資産と負債は、1年以内かどうかで分ける。' },
      b4: { name: '売上総利益・営業利益・経常利益・流動と固定', line: '損益計算書は、売上総利益→営業利益（販売費及び一般管理費を引く）→経常利益（営業外費用などを足し引き）→税引前当期純利益→当期純利益の順に区分する。貸借対照表は、1年以内にお金になる・払うものを「流動」（流動資産など）、長く使うものを「固定」（固定資産など）に分ける。',
        exam: '「損益計算書と貸借対照表を完成しなさい（区分表示による）」', teaches: ['売上総利益', '営業利益', '経常利益', '税引前当期純利益', '販売費及び一般管理費', '営業外費用', '流動資産', '固定資産', '流動', '固定', '区分'], leaf: { p: 'P5', label: '区分して見せる' } },
      hand: '損益計算書：売上高−売上原価＝売上総利益、−販売費及び一般管理費＝営業利益、＋営業外収益−営業外費用＝経常利益、＋特別利益−特別損失＝税引前当期純利益、−法人税等＝当期純利益。貸借対照表：流動資産・固定資産、流動負債・固定負債（1年基準と、営業の取引は流動の正常営業循環基準）。表示科目：繰越商品は「商品」、前払家賃は「前払費用」。' },
    { t: 'report', id: 'report2', teaches: [] },
    { t: 'closing', id: 'closing2' },
    { t: 'talk', lines: (S) => { const re = credit(S, '繰越利益剰余金'); return [['ginko', `2年目の決算書、拝見しました。区分があるので、本業のもうけが読めます。返さなくていいお金（純資産）は、増資のおかげで厚くなりました。`], ['ginko', D_(S).due === 'list' ? '期日の一覧と資金繰りの表まで出していただいたのは、心強いです。' : '払う約束の期日の一覧は、まだないのですね。工場のお金をお貸しするときは、毎月出していただくことになります。'], ['senpai', `繰越利益剰余金は ${yen(re)}円。これが3年目のはじまりの、もうけの貯まりだ。`]]; } },
  ] };

  // ---------- 2年目の翌年4月（3年目のはじまり）：再振替・でんさいの期日・改良・ファクタリング・結末 ----------
  const CAPEX = 400000, REPAIR = 100000;
  const nx = { m: 4, year: 3, label: '3年目 4月', title: '2年目の決算書と、3年目のはじまり', closeless: true, events: [
    { t: 'talk', teaches: ['再振替'], lines: [['senpai', '4月1日。去年の3月に「来年の分」として切った家賃の3か月分を、今年の費用に戻す。年のはじめに戻すこの仕訳を「再振替」という。']] },
    { t: 'doc', kind: 'reverse', id: 'rev-rent', doc: { type: '家賃の計算表', title: '前払家賃の戻し（4月1日）', from: '経理', to: '経理', date: '4月1日', rows: [['去年の3月31日に前払家賃にした3か月分', PRE_RENT, 'amt']] },
      ans: je([['支払家賃', PRE_RENT]], [['前払家賃', PRE_RENT]]), opts: opts('支払家賃', '前払家賃') },
    { t: 'ending', id: 'be5-final', when: (S) => D_(S).divfix === 'keep' },
    { t: 'ending', id: 'be3-final', when: (S) => D_(S).fix15 === 'keep' },
    { t: 'doc', kind: 'denshi_settle', id: 'denshi-in', doc: { ...passbook('4月30日', 'でんさい 期日の入金（B社）', 'お預け入れ', 0), rows: (S) => [['摘要', 'でんさい 期日の入金（B社 1月分）'], ['お預け入れ', bWith(S, 1), 'amt']] }, ans: (S) => je([['普通預金', bWith(S, 1)]], [['電子記録債権', bWith(S, 1)]]), opts: opts('電子記録債権', '電子記録債務') },
    { t: 'doc', kind: 'denshi_settle', id: 'denshi-out', when: (S) => D_(S).due === 'list', doc: passbook('4月30日', 'でんさい 期日の引き落とし（ハッピー問屋）', 'お引出し', buyWith(3)), ans: je([['電子記録債務', buyWith(3)]], [['普通預金', buyWith(3)]]), opts: opts('電子記録債権', '電子記録債務') },
    { t: 'ending', id: 'be10-warn', when: (S) => D_(S).due === 'none' },
    { t: 'doc', kind: 'denshi_settle', id: 'denshi-late', when: (S) => D_(S).due === 'none', doc: passbook('5月7日', '振込 ハッピー問屋（4月30日のでんさいの分）', 'お引出し', buyWith(3)), ans: je([['電子記録債務', buyWith(3)]], [['普通預金', buyWith(3)]]), opts: opts('電子記録債権', '電子記録債務') },
    { t: 'discover', id: 'd-capex', moves: ['資産+'], p: 'P4', title: '直した代金と、強いエンジンの代金',
      b1: { talk: [['shacho', 'トラックを直したよ。ついでにエンジンを強いのに取りかえた。40万円、全部修理代だから今年の費用でいいよね。']],
        doc: { type: '請求書', title: '請求書（トラックの修理と改造）', from: 'ミライ自動車', to: SHOP, date: '4月10日', rows: [['こわれた部品の修理', REPAIR, 'amt'], ['エンジンの取りかえ（前より強い）', CAPEX - REPAIR, 'amt'], ['税抜の合計', CAPEX, 'amt'], ['消費税（10％）', tax10(CAPEX), 'amt'], ['合計', CAPEX + tax10(CAPEX), 'amt'], ['お支払期日', '5月31日']] } },
      predict: { q: '40万円のうち、今年の費用になるのはいくらだと思う？', opts: [{ t: '40万円全部' }, { t: '修理の10万円だけ', ok: true }, { t: '0円' }] },
      b2: { q: '修理と、エンジンの取りかえ。どう分ける？', layout: 'sort', tokens: [
        { id: 'fix', label: 'こわれた部品の修理 100,000', target: 'exp' },
        { id: 'up', label: '前より強いエンジン 300,000', target: 'asset' },
      ], targets: [{ id: 'exp', label: '今年の費用' }, { id: 'asset', label: 'トラックの値段に足す' }],
      wrongReact: '元に戻すための修理は今年の費用。前より強く・長く使えるようにした分は、トラックの値段に足して、これから毎年の減価償却で費用にする。', reasons: [
        { t: '役に立つ期間がちがうから', ok: true },
        { t: '全部、修理屋さんに払ったお金だから', ok: false, fork: '支払先で決める', react: 'だれに払ったかではなく、そのお金で何が手に入ったかで決める' },
      ], hints: ['強いエンジンは、何年役に立つ？'] },
      b3: { ok: '修理10万円は今年の費用。強いエンジン30万円はトラックの値段に足し、来年からの減価償却で少しずつ費用にする。' },
      b4: { name: '資本的支出・収益的支出（修繕費）', line: '前より価値を高めたり、長く使えるようにしたりした支出は「資本的支出」で、資産の値段に足す。元の状態に戻すための支出は「収益的支出」で、費用の「修繕費」。',
        exam: '「建物の改修を行い、うち資本的支出は○円、残りは修繕費として処理する」', teaches: ['資本的支出', '収益的支出', '修繕費'], leaf: { p: 'P4', label: '直すと良くするのちがい' } },
      hand: '固定資産の支出：耐用年数を延ばす・価値を高める部分は資本的支出（固定資産の取得原価に加算し、残りの耐用年数で減価償却）、原状回復・維持の部分は収益的支出（修繕費）。全額を修繕費にすると、税務調査で否認されることがある。' },
    { t: 'decision', id: 'capex', q: 'トラックの40万円、どう書く？', talk: [['shacho', '全部修理代にすれば、今年のもうけが小さくなって、税金も少なくなるでしょ。'], ['zeirishi', '分け方には、決まりがありますよ。']],
      trial: (S, o) => [['今年の費用（修理と改造）', o === 'split' ? REPAIR : CAPEX], ['トラックの値段に足す額', o === 'split' ? CAPEX - REPAIR : 0]],
      options: [
        { id: 'split', label: '修理は費用、強いエンジンはトラックの値段に足す', desc: '今年の費用は10万円', result: '修繕費10万円、車両運搬具に30万円を足す。', ending: ['be4-ifonly'] },
        { id: 'all', label: '社長の言うとおり、全部修理代', desc: '今年の費用は40万円', result: '40万円をすべて修繕費にする。' },
      ] },
    { t: 'doc', kind: 'capex', id: 'capex', manual: true, doc: { type: '請求書', title: '請求書（トラックの修理と改造）', from: 'ミライ自動車', to: SHOP, date: '4月10日', rows: [['こわれた部品の修理', REPAIR, 'amt'], ['エンジンの取りかえ（前より強い）', CAPEX - REPAIR, 'amt'], ['税抜の合計', CAPEX, 'amt'], ['消費税（10％）', tax10(CAPEX), 'amt'], ['合計', CAPEX + tax10(CAPEX), 'amt'], ['お支払期日', '5月31日']] },
      ans: (S) => (D_(S).capex === 'all' ? je([['修繕費', CAPEX], ['仮払消費税', tax10(CAPEX)]], [['未払金', CAPEX + tax10(CAPEX)]]) : je([['修繕費', REPAIR], ['車両運搬具', CAPEX - REPAIR], ['仮払消費税', tax10(CAPEX)]], [['未払金', CAPEX + tax10(CAPEX)]])), opts: opts('修繕費', '車両運搬具', '仮払消費税', '機械装置') },
    { t: 'talk', when: (S) => D_(S).capex === 'all', diary: '3年目4月：エンジンの取りかえも、全部修理代にした', lines: [['zeirishi', 'エンジンを前より強いものに取りかえた分まで修繕費にすると、税務署の調査で「それは資産です」と言われることがあります。そのときは、税金を後から払い直すことになります。']] },
    { t: 'decision', id: 'fund', q: '工場を広げる頭金のために、B社の瓶の売掛金を、今すぐお金にする？', talk: [['shacho', '3年目は工場を広げたい。頭金を早く用意したいんだ。'], ['senpai', '売掛金を買い取って、先にお金にしてくれる会社がある。手数料はかかる。B社が払うのを待つこともできる。']],
      trial: (S, o) => [['B社の瓶の売掛金（3月分）', SOLD_B * PB + tax8(SOLD_B * PB)], ['手数料（2％）', o === 'sell' ? Math.round((SOLD_B * PB + tax8(SOLD_B * PB)) * 0.02) : 0], ['お金が入る日', o === 'sell' ? '4月15日' : '4月30日']],
      options: [
        { id: 'sell', label: '売掛金を売って、今すぐお金にする', desc: '手数料2％', result: 'B社の売掛金を、買い取りの会社に売る。' },
        { id: 'wait', label: 'B社が払うのを待つ', desc: '手数料はかからない', result: '4月30日のB社の支払いを待つ。' },
      ] },
    { t: 'discover', id: 'd-factoring', when: (S) => D_(S).fund === 'sell', moves: ['資産+', '資産-', '費用+'], p: 'P4', title: '売掛金を、売る',
      b1: { talk: [['senpai', 'みらいファクターという会社が、B社の売掛金246,240円を買ってくれる。手数料2％を引いて、今日お金が入る。']] },
      b2: { q: '手数料の分は、どう書く？', token: '手数料 4,925', layout: 'options', targets: [
        { id: 'loss', label: '売掛金を売ったときの費用', ok: true },
        { id: 'ar', label: '売掛金のまま残しておく', ok: false, react: '売掛金はもう買い取った会社のもの。B社はそちらに払う。ピヨ商店に手数料の分は戻ってこない' },
      ], reasons: [
        { t: '早くお金にするために、手放した分だから', ok: true },
        { t: 'B社があとで払ってくれるから', ok: false, fork: '売った債権がまだ自分のもの', react: '売ったので、B社が払う相手は買い取った会社になった' },
      ], hints: ['売った売掛金は、だれのもの？'] },
      b3: { ok: '売掛金を手放し、手数料を引いたお金を受け取った。手数料は、早くお金にするための費用。' },
      b4: { name: 'ファクタリング・売掛債権売却損', line: '売掛金を、期日の前に別の会社に売ってお金にすることを「ファクタリング」という。手数料の分は、費用の「売掛債権売却損」。',
        exam: '「売掛金をファクタリング会社に譲渡し、手数料を差し引いた額が普通預金に入金された」', teaches: ['ファクタリング', '売掛債権売却損'], leaf: { p: 'P4', label: '売掛金を売る' } },
      hand: 'ファクタリング（売掛金の譲渡）：普通預金（受取額）・売掛債権売却損（手数料）／売掛金。電子記録債権を期日の前に銀行で割り引くときも、同じように手数料を費用にする。' },
    { t: 'doc', kind: 'factoring', id: 'factor', when: (S) => D_(S).fund === 'sell', doc: { type: '買取の計算書', title: '売掛金の買取の計算書', from: 'みらいファクター', to: SHOP, date: '4月15日', rows: [['お買い取りする売掛金（B社 3月分）', SOLD_B * PB + tax8(SOLD_B * PB), 'amt'], ['手数料（2％）', Math.round((SOLD_B * PB + tax8(SOLD_B * PB)) * 0.02), 'amt'], ['お振込みする額', SOLD_B * PB + tax8(SOLD_B * PB) - Math.round((SOLD_B * PB + tax8(SOLD_B * PB)) * 0.02), 'amt']] },
      ans: je([['普通預金', SOLD_B * PB + tax8(SOLD_B * PB) - Math.round((SOLD_B * PB + tax8(SOLD_B * PB)) * 0.02)], ['売掛債権売却損', Math.round((SOLD_B * PB + tax8(SOLD_B * PB)) * 0.02)]], [['売掛金', SOLD_B * PB + tax8(SOLD_B * PB)]]), opts: opts('売掛債権売却損', '支払手数料', '電子記録債権') },
    { t: 'doc', kind: 'collect_ar', id: 'col-bot3', when: (S) => D_(S).fund !== 'sell', doc: passbook('4月30日', 'B社から 瓶詰めの代金（3月分）', 'お預け入れ', SOLD_B * PB + tax8(SOLD_B * PB)), ans: je([['普通預金', SOLD_B * PB + tax8(SOLD_B * PB)]], [['売掛金', SOLD_B * PB + tax8(SOLD_B * PB)]]), opts: opts() },
    { t: 'ifonly' },
    { t: 'quiz' },
    { t: 'end', y: 2 },
  ] };

  // ---------- 2年目の結末（警告→重い結末。条文は research/notes/law/ で確かめたものだけ） ----------
  Object.assign(SIM.endings, {
    'be5-warn': { level: '中', back: 'dividend', title: '配当が、上限を超えていた',
      check: { q: '配当の上限を超えてしまったのは、なぜ？', opts: [
        { t: '配る額の10分の1を準備金に残す分まで、配ってしまったから', ok: true },
        { t: '口座のお金が足りなかったから', react: '口座にはお金があった。超えたのは、もうけの貯まりから配ってよい上限' },
        { t: '佐藤さんの株が多かったから', react: '株の数は、配当の分け方を決めるだけ。上限とは関係ない' } ] },
      cause: () => '6月：社長の「全部配ろう」で、もうけの貯まりを全部配った。配る額の10分の1を利益準備金に残す分まで、配ってしまった。',
      numbers: (S) => ({ rows: [['配った額', reNow(S)], ['10分の1を残すときの上限', divLimit(S)], ['超えた額', reNow(S) - divLimit(S)], ['積み立てていない利益準備金', divLimit(S) / 10]] }),
      docs: (S) => [{ from: '森（会計士）', to: SHOP, date: '7月15日', title: '監査上の指摘事項（配当）', body: ['6月25日の定時株主総会で決議された剰余金の配当について、利益準備金の積立てがありません。', '積み立てるべき額を考えると、配当の額は分配可能額を超えています。', '決算までに、是正の方法をご検討ください。'],
        marks: [{ text: '利益準備金の積立てがありません', plain: '配るたびに10分の1を会社に残す約束を、守っていない。' }, { text: '分配可能額を超えています', plain: '配ってよい上限より、多く配ってしまった。' }] }],
      scene: () => [['kansa', '超えた分は、本来は会社に戻さなければなりません。年度末までに手当てを考えましょう。'], ['shacho', '佐藤さんに「返して」なんて言えないよ…。']],
      reality: '配当をするときは、配当の10分の1を、準備金が資本金の4分の1になるまで積み立てなければならない（会社法445条4項）。配れる上限（分配可能額）を超えた配当は認められていない（会社法461条）。',
      lesson: '配当の上限は、もうけの貯まりそのものではない。配るたびに10分の1を準備金に残す約束があり、それも貯まりから出す。上限を計算してから決める。' },
    'be5-final': { level: '重', back: 'dividend', final: true, closes: false, title: '株主から、訴えられた',
      check: { q: 'この結末を防げたのは、どれ？', opts: [
        { t: '配当の前に上限を計算し、10分の1の準備金を残して決める', ok: true },
        { t: '配当を、もっと遅い月にする', react: '月を変えても、上限は同じ。上限を計算しなかったことが原因' },
        { t: '佐藤さんに、配当のことを言わないでおく', react: '隠しても、決算書と議事録から分かる。森さんにも指摘された' } ] },
      cause: () => '6月：上限を超えて配当した。7月に森さんに指摘されたが、決算でも直さずに決算書を出した。',
      numbers: (S) => ({ rows: [['配った額', reNow(S)], ['配ってよい上限', divLimit(S)], ['超えた額', reNow(S) - divLimit(S)]] }),
      docs: (S) => [
        { from: 'みらい銀行', to: '株主 さくら投資（佐藤様）', date: '4月20日', title: '配当金の返還のご請求', body: ['株式会社ピヨ商店が昨年6月に行った剰余金の配当は、分配可能額を超えるものでした。', '当行は同社の債権者として、配当を受け取られた株主様に、超えた額の返還を請求いたします。'],
          marks: [{ text: '分配可能額を超える', plain: '配ってよい上限より多く配った配当。' }, { text: '債権者として', plain: '会社にお金を貸している銀行は、会社のお金が外に出すぎないように守る立場にある。' }] },
        { from: 'さくら投資（佐藤）', to: '株式会社ピヨ商店 監査をする人', date: '5月10日', title: '責任追及等の訴えの提起の請求書', body: ['違法な配当を決めた取締役（社長）に対し、会社が受けた損害の責任を追及する訴えを起こすよう請求します。', '60日以内に会社が訴えを起こさないときは、株主として訴えを起こします。'],
          marks: [{ text: '責任追及等の訴え', plain: '会社に損をさせた取締役（社長）に、会社がつぐないを求める裁判。会社がしないなら、株主が代わりにできる。' }] },
        { from: '地方裁判所', to: 'ミライ（取締役）', date: '7月15日', title: '訴状（株主代表訴訟）', body: ['原告 さくら投資　被告 ミライ', '被告は、株式会社ピヨ商店に対し、分配可能額を超えて配当した額を支払え。'],
          marks: [{ text: '被告', plain: '訴えられた人。社長が、自分のお金で会社に払うよう求められている。' }] }],
      scene: () => [['shacho', '佐藤さんに喜んでほしかっただけなのに…。家にまで裁判所の書類が来た。'], ['senpai', '上限を超えた配当は、会社のお金を外に出しすぎること。お金を貸している銀行も、株主も、黙っていない。']],
      reality: '分配可能額を超えた配当は、受け取った株主と、配当を決めた取締役が、会社に返す義務を負う（会社法462条）。会社にお金を貸している人は、株主に直接返すよう請求できる（会社法463条）。株主は、会社に代わって取締役の責任を追及する訴えを起こせる（会社法847条）。',
      lesson: '配当は「もうけの貯まりの中から、約束を守って」配るもの。上限を超えると、会社にお金を貸している人を傷つける。だから法律が厳しく決めている。' },
    'be3-warn': { level: '中', back: 'revenue', title: '監査上の指摘事項',
      check: { q: '森さんが指摘したのは、どこ？', opts: [
        { t: 'まだやっていない点検の分まで、今年の売上にしたこと', ok: true },
        { t: 'マシンを高く売りすぎたこと', react: '値段は会社が決めてよい。問題は、いつ売上にしたか' },
        { t: '消費税の計算', react: '消費税は合っていた。問題は、点検の売上の時期' } ] },
      cause: () => '8月：社長の「全部今年の売上」で、2年間の点検の分まで売上にした。',
      numbers: () => ({ rows: [['8月に売上にした点検', HOSHU], ['今年（8〜3月）に点検する分', HOSHU / 3], ['来年以降の分', HOSHU * 2 / 3]] }),
      docs: () => [{ from: '森（会計士）', to: SHOP, date: '9月15日', title: '監査上の指摘事項（売上）', body: ['8月の売上高に、翌期以降の点検の対価が含まれています。', '点検は期間にわたって行う義務であり、まだ行っていない分は契約負債とする必要があります。', '決算までに訂正してください。'],
        marks: [{ text: '翌期以降の点検の対価', plain: '来年と再来年にやる点検の分のお金。' }, { text: '契約負債', plain: 'これからやる約束。まだ売上ではない。' }] }],
      scene: () => [['kansa', '決算までに直せば、問題にはなりません。'], ['shacho', '今年のもうけが小さくなるのは、いやだなあ…。']],
      reality: '会計監査人は、決算書が正しく作られているかを調べ、意見を出す。正しくないところがあれば、会社に直すよう求める。',
      lesson: '売上は「仕事をした分」だけ。2年間続く点検は、点検した期間の分ずつ売上にする。' },
    'be3-final': { level: '重', back: 'revenue', final: true, closes: false, title: '決算書に、意見がつかなかった',
      check: { q: 'この結末を防げたのは、どれ？', opts: [
        { t: '点検の分を契約負債に分け、指摘されたら決算で直す', ok: true },
        { t: '森さんに決算書を見せない', react: '株式会社の決算書は、会計の専門家が確かめる。見せないことはできない' },
        { t: '点検の値段を安くする', react: '値段ではなく、売上にする時期が問題だった' } ] },
      cause: () => '8月：点検の分まで売上にした。9月に指摘され、決算でも直さなかった。',
      numbers: () => ({ rows: [['今年の売上に入れた点検', HOSHU], ['本当の今年の分', HOSHU / 3], ['売上が大きすぎる額', HOSHU * 2 / 3]] }),
      docs: () => [
        { from: '森（会計士）', to: '株式会社ピヨ商店 株主のみなさま', date: '5月20日', title: '監査報告書（抜粋）', body: ['当監査人は、会社の計算書類が、売上高に翌期以降の対価を含めている点で、会社の財産と損益の状況を、すべての重要な点において適正に表示していないと認める。'],
          marks: [{ text: '適正に表示していない', plain: '「この決算書は正しくない」という意見。銀行も株主も、この決算書を信じなくなる。' }] },
        { from: 'みらい銀行', to: SHOP, date: '5月25日', title: '工場の増築のご融資について', body: ['監査の意見が「適正でない」となっている決算書では、ご融資の審査を進めることができません。'],
          marks: [{ text: '審査を進めることができません', plain: '工場を広げるお金を、借りられなくなった。' }] }],
      scene: () => [['ginko', '正しくないと言われた決算書では、貸せません。'], ['kabunushi', '数字を飾る経営なら、取締役を替える提案をします。']],
      reality: '決算書（計算書類）にうその記載をすると、取締役などに過料が科されることがある（会社法976条）。正しくない決算書を見せて融資を受けると、罪に問われることもある。',
      lesson: '売上を早く入れると、今年は大きく見えるが、来年の売上がなくなる。決算書を読む人は、それを信じてお金を貸し、株を持つ。' },
    'be10-warn': { level: '中', back: 'due', title: 'でんさいの期日に、払えなかった',
      check: { q: '払えなかったのは、なぜ？', opts: [
        { t: '期日の一覧がなく、4月30日の引き落としに気づかなかったから', ok: true },
        { t: '会社にお金がなかったから', react: '会社の口座には、お金があった。引き落としの口座に入れておかなかった' },
        { t: '問屋が期日をまちがえたから', react: '期日は記録に残っている。見ていなかったのは、こちら' } ] },
      cause: () => '2月：社長の「一覧なんていらない」で、払う約束の期日を書き出さなかった。4月30日、引き落としの口座にお金を入れていなかった。',
      numbers: () => ({ rows: [['4月30日に引き落とされるはずだった額', buyWith(3)], ['引き落とし口座にあった額', 0]] }),
      docs: () => [
        { from: 'みらい銀行（でんさい）', to: SHOP, date: '5月7日', title: '支払不能のお知らせ', body: ['4月30日が支払期日のでんさいについて、口座の残高が足りず、お支払いができませんでした（支払不能）。', 'この日から6か月以内に、もう一度支払不能があると、取引停止処分となります。'],
          marks: [{ text: '支払不能', plain: '期日に払えなかった、と記録に残った。' }, { text: '取引停止処分', plain: 'もう一度やると、銀行からお金を借りられなくなる。' }] },
        { from: 'ハッピー問屋', to: SHOP, date: '5月8日', title: 'お取引の条件の変更', body: ['4月30日のお支払いがありませんでした。', '今後のお取引は、代金の前払いとさせていただきます。'],
          marks: [{ text: '前払い', plain: '先にお金を払わないと、レモンを送ってもらえなくなった。' }] }],
      scene: () => [['eigyo', 'ハッピー問屋から「次からは前払いで」って…。'], ['senpai', 'お金はあったのに、期日を見ていなかった。払う約束は、期日の順に並べておかないと見えない。']],
      reality: 'でんさいの期日に払えないと、支払不能として参加している銀行に知らされる。6か月以内に2回目があると取引停止処分になり、2年間、銀行からお金を借りられなくなる（でんさいネットの業務規程）。',
      lesson: '払う約束は、紙がなくなっても消えない。電子の記録は、期日に自動で引き落とされる。期日の一覧を作り、その前に口座にお金を入れておく。' },
    'be4-ifonly': { level: '重', back: 'capex', ifOnly: true, title: '税務署の調査で、払い直し',
      check: { q: 'この結末で、いちばんの原因は？', opts: [
        { t: '前より強くしたエンジンの代金まで、修理代（費用）にしたこと', ok: true },
        { t: 'トラックを直したこと', react: '直すことは悪くない。問題は、良くした分まで費用にしたこと' },
        { t: '消費税を払ったこと', react: '消費税は正しく払っていた' } ] },
      cause: () => '3年目4月：強いエンジンへの取りかえ30万円まで、修繕費にした。',
      numbers: () => ({ rows: [['修繕費にした額', CAPEX], ['本当の修繕費', REPAIR], ['資産にすべきだった額', CAPEX - REPAIR]] }),
      docs: () => [{ from: '税務署', to: SHOP, date: '5年目 10月', title: '更正の通知', body: ['車両の修繕費として計上された300,000円は、性能を高める支出であり、資産の取得価額に含めるべきものと認められます。', 'これにより所得金額を更正し、不足する税額と過少申告加算税を納めていただきます。'],
        marks: [{ text: '更正', plain: '税務署が、会社の出した税金の計算を正しく直すこと。' }, { text: '過少申告加算税', plain: '少なく申告していた罰として、上乗せで払う税金。' }] }],
      scene: () => [['zeirishi', '分けて書いていれば、こうはなりませんでした。'], ['shacho', 'もうけを小さく見せて、税金を減らしたつもりだったのに…。']],
      reality: '税務署は、申告の内容を調べ、正しくない所得を直す（更正）ことができる。少なく申告していた場合は、不足する税額に加えて加算税がかかる（国税通則法65条）。',
      lesson: '直す支出と良くする支出は、役に立つ期間がちがう。良くした分は資産にして、使う年に分けて費用にする。' },
  });

  // 結末に届く判断の組み合わせ（tools/sim-check.js が、1つ替えとは別にこのとおりにも進める）
  SIM.combos = [{ dividend: 'all', divfix: 'keep' }, { revenue: 'follow', fix15: 'keep' }, { due: 'none', line2: 'buy', vat: 'follow' }, { capital: 'half', dividend: 'all' }];
  SIM.months.push(m4, m5, m6, m7, m8, m9, m10, m11, m12, m1, m2, m3, deskA, deskB, deskC, nx);
  SIM.__y2.months = [m4, m5, m6, m7, m8, m9, m10, m11, m12, m1, m2, m3, deskA, deskB, deskC, nx];
})();
