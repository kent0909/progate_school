// 2・3年目の台本と帳簿（CODEX-TASK-scenes-y2・PR #2の設計回答）。
// 店の需要と口座はworld.monthのまま。発生主義の損益はy2booksから別に読む。
(function (g) {
  'use strict';
  const SIM = g.SIMDATA, Y1 = SIM.y1, BK = SIM.y2books;
  const C = SIM.coef, MON = Y1.MON, R = Y1.R, polOf = Y1.polOf, salesNet = Y1.salesNet;
  const je = (dr, cr) => ({ dr, cr });
  const SHOP = '{店}', yen = n => Math.round(n).toLocaleString('ja-JP');
  const opts = (...extra) => [...new Set(['普通預金','売上','仕入','買掛金','給料','借入金','資本金', ...extra])];
  const pb = (date,memo,kind,amt) => ({type:'通帳', title:'普通預金 通帳', from:'みらい銀行',to:SHOP,date,rows:[['摘要',memo],[kind,amt,'amt']]});
  // 1年目と同じ決済条件（ramen-y1.js）。新しい経営係数はここでは足さない。
  const CARD_FROM = Y1.CARD_FROM, VAT_FROM = Y1.VAT_FROM;
  const DEF = { interest: Math.round(C('loan') * C('loanRate') / 12) };
  const cardShare = () => 0.3;
  const cashPart = (S,t) => Math.round(salesNet(S,t) * (1-cardShare(t)));
  const cardPart = (S,t) => salesNet(S,t)-cashPart(S,t);
  const vat10 = n => Math.floor(n * 0.1), vat8 = n => Math.floor(n * 0.08);
  const split = n => {const out = Math.round(n * 0.05);return {inn:n-out,out};};
  const buyAmt = (S,t) => Math.round(R(S,t).cogs + R(S,t).wasteCost);
  const rentAmt = (S,t) => Math.round(R(S,t).rent);
  const RENT_A = S => g.BOKI.kubun.Y(S).rent, RENTS = ['支払家賃','支払リース料'];
  const salesDoc = (t) => {
    const m = MON[t % 12];
    if (t < VAT_FROM) return { t: 'doc', kind: 'cash_sale', id: `sale${t}`, doc: { type: 'レジ締め日報', title: `${m}月のレジ締め日報（現金）`, from: '券売機', to: '経理', date: `${m}月末`, rows: (S) => [['お客さんの数（現金）', `${Math.round(R(S, t).X * (1 - cardShare(t)))}人`], ['売れた金額', cashPart(S, t), 'amt'], ['メモ', '毎日、閉店後に普通預金へ入金ずみ']] },
      ans: (S) => je([['普通預金', cashPart(S, t)]], [['売上', cashPart(S, t)]]), opts: opts() };
    return { t: 'doc', kind: 'cash_sale_vat', id: `sale${t}`, doc: { type: 'レジ締め日報', title: `${m}月のレジ締め日報（現金）`, from: '券売機', to: '経理', date: `${m}月末`, rows: (S) => { const s = split(cashPart(S, t)); return [['店内（税抜）', s.inn, 'amt'], ['消費税（10％）', vat10(s.inn), 'amt'], ['持ち帰り（税抜）', s.out, 'amt'], ['消費税（8％）', vat8(s.out), 'amt'], ['入金の合計', s.inn + s.out + vat10(s.inn) + vat8(s.out), 'amt']]; } },
      ans: (S) => { const s = split(cashPart(S, t)), tx = vat10(s.inn) + vat8(s.out); return je([['普通預金', s.inn + s.out + tx]], [['売上', s.inn + s.out], ['仮受消費税', tx]]); }, opts: opts('仮受消費税', '仮払消費税') };
  };
  // クーポンを出した月の売上：値引きは売上から引く（あとの約束ではない：s-revenue の対比）
  const couponDoc = (t) => ({ t: 'doc', kind: 'discount', id: `coupon${t}`, when: (S) => !!polOf(S, t).coupon, doc: { type: '値引きの記録', title: `${MON[t % 12]}月のクーポンの値引き`, from: '券売機', to: '経理', date: `${MON[t % 12]}月末`, rows: (S) => { const g0 = Math.round(cashPart(S, t) / 0.95), d = g0 - cashPart(S, t); return [['クーポンを使った分の値引き', d, 'amt'], ['メモ', 'レジ締め日報の金額は、値引きのあと。帳簿に書いた売上と見比べて、ちがいがあれば直す']]; } },
    ans: (S) => { const d = Math.round(cashPart(S, t) / 0.95) - cashPart(S, t); return je([['売上', d]], [['普通預金', d]]); }, opts: opts(), noAuto: true, scope: ['s-revenue'] });
  const cardDoc = (t) => ({ t: 'doc', kind: t < VAT_FROM ? 'card_sale' : 'card_sale_vat', id: `card${t}`, doc: { type: '売上の明細', title: `${MON[t % 12]}月のカード払いの売上`, from: 'みらいカード', to: SHOP, date: `${MON[t % 12]}月末`, rows: (S) => (t < VAT_FROM ? [['カードで払った売上', cardPart(S, t), 'amt'], ['入金の日', '翌月20日']] : [['カードで払った売上（税抜）', cardPart(S, t), 'amt'], ['消費税（10％）', vat10(cardPart(S, t)), 'amt'], ['合計（翌月20日に入金）', cardPart(S, t) + vat10(cardPart(S, t)), 'amt']]) },
    ans: (S) => (t < VAT_FROM ? je([['クレジット売掛金', cardPart(S, t)]], [['売上', cardPart(S, t)]]) : je([['クレジット売掛金', cardPart(S, t) + vat10(cardPart(S, t))]], [['売上', cardPart(S, t)], ['仮受消費税', vat10(cardPart(S, t))]])), opts: opts('クレジット売掛金', '売掛金') });
  const cardIn = (t) => { const p = t - 1, gross = (S) => cardPart(S, p) + (p >= VAT_FROM ? vat10(cardPart(S, p)) : 0), fee = (S) => Math.round(gross(S) * 0.0324);
    return { t: 'doc', kind: 'card_in', id: `cardin${t}`, doc: { type: '通帳', title: '普通預金 通帳', from: 'みらい銀行', to: SHOP, date: `${MON[t % 12]}月20日`, rows: (S) => [['摘要', `みらいカード ${MON[p % 12]}月分（手数料3.24％を引いた額）`], ['お預け入れ', gross(S) - fee(S), 'amt'], ['カード会社の手数料', fee(S), 'amt']] },
      ans: (S) => je([['普通預金', gross(S) - fee(S)], ['支払手数料', fee(S)]], [['クレジット売掛金', gross(S)]]), opts: opts('クレジット売掛金', '支払手数料') }; };
  // 材料：4・5月は市場で現金、6月から問屋に掛け（d-kake）。10月から消費税（8％）
  const buyDoc = (t) => {
    const m = MON[t % 12];
    if (t < 2) return { t: 'doc', kind: 'buy_cash', id: `buy${t}`, doc: { ...pb(`${m}月末`, '引出し（市場で材料をまとめて買った分）', 'お引出し', 0), rows: (S) => [['摘要', `${m}月 市場で買った材料（麺・豚・野菜）`], ['お引出し', buyAmt(S, t), 'amt']] }, ans: (S) => je([['仕入', buyAmt(S, t)]], [['普通預金', buyAmt(S, t)]]), opts: opts() };
    if (t < VAT_FROM) return { t: 'doc', kind: 'buy_credit', id: `buy${t}`, doc: { type: '請求書', title: `請求書（${m}月の麺・豚・野菜）`, from: '杉田食品', to: SHOP, date: `${m}月末`, rows: (S) => [['品名', '麺・豚・野菜（1か月分）'], ['金額', buyAmt(S, t), 'amt'], ['お支払期日', '翌月末']] }, ans: (S) => je([['仕入', buyAmt(S, t)]], [['買掛金', buyAmt(S, t)]]), opts: opts('未払金') };
    return { t: 'doc', kind: 'buy_credit_vat', id: `buy${t}`, doc: { type: '請求書', title: `請求書（${m}月の麺・豚・野菜）`, from: '杉田食品', to: SHOP, date: `${m}月末`, rows: (S) => [['麺・豚・野菜（税抜）', buyAmt(S, t), 'amt'], ['消費税（8％）', vat8(buyAmt(S, t)), 'amt'], ['合計', buyAmt(S, t) + vat8(buyAmt(S, t)), 'amt'], ['お支払期日', '翌月末']] },
      ans: (S) => je([['仕入', buyAmt(S, t)], ['仮払消費税', vat8(buyAmt(S, t))]], [['買掛金', buyAmt(S, t) + vat8(buyAmt(S, t))]]), opts: opts('仮払消費税', '仮受消費税', '未払金') };
  };
  const payAP = (t) => { const p = t - 1, amt = (S) => buyAmt(S, p) + (p >= VAT_FROM ? vat8(buyAmt(S, p)) : 0);
    return { t: 'doc', kind: 'pay_ap', id: `pap${t}`, doc: { ...pb(`${MON[t % 12]}月末`, '', 'お引出し', 0), rows: (S) => [['摘要', `振込 杉田食品（${MON[p % 12]}月の材料の代金）`], ['お引出し', amt(S), 'amt']] }, ans: (S) => je([['買掛金', amt(S)]], [['普通預金', amt(S)]]), opts: opts() }; };
  // 給料：4月分は5月にまとめて（月末締め・翌月25日払い。5月からは前の月の分）
  const salaryDoc = (t) => { const amt = (S) => Math.round(R(S, t - 1).labor + R(S, t - 1).famPay);
    return { t: 'doc', kind: 'pay_salary', id: `sal${t}`, when: (S) => amt(S) > 0, doc: { ...pb(`${MON[t % 12]}月25日`, '', 'お引出し', 0), rows: (S) => [['摘要', `給与振込（${MON[(t - 1) % 12]}月分）`], ['お引出し', amt(S), 'amt']] }, ans: (S) => je([['給料', amt(S)]], [['普通預金', amt(S)]]), opts: opts('未払金') }; };
  const utilDoc = (t) => { const amt = (S) => Math.round(R(S, t - 1).util);
    return { t: 'doc', kind: 'util', id: `util${t}`, doc: { ...pb(`${MON[t % 12]}月27日`, '', 'お引出し', 0), rows: (S) => [['摘要', `ガス・水道・電気（${MON[(t - 1) % 12]}月分）`], ['お引出し', amt(S), 'amt']] }, ans: (S) => je([['水道光熱費', amt(S)]], [['普通預金', amt(S)]]), opts: opts('水道光熱費') }; };
  // 家賃：最初の3か月は家賃なし（居抜きの契約。7月から）。年度で札の名前が変わる（年度表 B.kubun.yearly）
  const rentDoc = (t) => ({ t: 'doc', kind: t < VAT_FROM ? 'rent' : 'rent_vat', id: `rent${t}`, doc: { ...pb(`${MON[t % 12]}月1日`, '', 'お引出し', 0), rows: (S) => (t < VAT_FROM ? [['摘要', `家賃 ${MON[t % 12]}月分（大家 青木さん）`], ['お引出し', rentAmt(S, t), 'amt']] : [['摘要', `家賃 ${MON[t % 12]}月分（税抜 ${yen(rentAmt(S, t))}円・消費税10％）`], ['家賃（税抜）', rentAmt(S, t), 'amt'], ['消費税（10％）', vat10(rentAmt(S, t)), 'amt'], ['お引出し', rentAmt(S, t) + vat10(rentAmt(S, t)), 'amt']]) },
    ans: (S) => (t < VAT_FROM ? je([[RENT_A(S), rentAmt(S, t)]], [['普通預金', rentAmt(S, t)]]) : je([[RENT_A(S), rentAmt(S, t)], ['仮払消費税', vat10(rentAmt(S, t))]], [['普通預金', rentAmt(S, t) + vat10(rentAmt(S, t))]])), opts: opts(...RENTS, '仮払消費税') });
  // 返済：7月から毎月。7月は4〜7月の利息をまとめて
  const repayDoc = t => {
    const value = (S,k,fallback) => Math.round(S && S.res && S.res[t] ? S.res[t][k] : fallback);
    const ints = S => value(S,'interest',DEF.interest), prin = S => value(S,'repay',Math.round(C('loan') / C('loanYears') / 12));
    return {t:'doc',kind:'repay',id:`repay${t}`,doc:{...pb(`${MON[t%12]}月10日`,'公庫の返済','お引出し',0),rows:S=>[['元の分',prin(S),'amt'],['利息',ints(S),'amt'],['お引出し',prin(S)+ints(S),'amt']]},ans:S=>je([['借入金',prin(S)],['支払利息',ints(S)]],[['普通預金',prin(S)+ints(S)]]),opts:opts('支払利息')};
  };
  // チラシ（8月から作戦の机で選べる）：後払い（未払金）、翌月に払う
  const flyerDoc = (t) => ({ t: 'doc', kind: 'ad_credit', id: `flyer${t}`, when: (S) => (polOf(S, t).flyer || 0) > 0, doc: { type: '請求書', title: `請求書（${MON[t % 12]}月のチラシの印刷と配布）`, from: '町の印刷屋 さくら', to: SHOP, date: `${MON[t % 12]}月25日`, rows: (S) => [['内容', 'チラシの印刷と配布'], ['金額', polOf(S, t).flyer || 30000, 'amt'], ['お支払期日', '翌月末']] },
    ans: (S) => je([['広告宣伝費', polOf(S, t).flyer || 30000]], [['未払金', polOf(S, t).flyer || 30000]]), opts: opts('広告宣伝費', '未払金'), scope: ['b-mibarai'] });
  const flyerPay = (t) => ({ t: 'doc', kind: 'pay_mibarai', id: `flyerpay${t}`, when: (S) => (polOf(S, t - 1).flyer || 0) > 0, doc: { ...pb(`${MON[t % 12]}月末`, '', 'お引出し', 0), rows: (S) => [['摘要', `振込 町の印刷屋 さくら（${MON[(t - 1) % 12]}月のチラシ）`], ['お引出し', polOf(S, t - 1).flyer || 30000, 'amt']] },
    ans: (S) => je([['未払金', polOf(S, t - 1).flyer || 30000]], [['普通預金', polOf(S, t - 1).flyer || 30000]]), opts: opts('未払金') });

  const routine = t => [salesDoc(t),cardDoc(t),cardIn(t),buyDoc(t),payAP(t),salaryDoc(t),utilDoc(t),rentDoc(t),repayDoc(t),flyerDoc(t),flyerPay(t)];
  // 3月に費用と未払を認識済みなので、4月は逆仕訳を先に入れる。
  // 払った4月に同じ費用をもう一度計上しない。
  const reverseMarch = t => ({t:'doc',id:`y${Math.floor(t/12)+1}-reverse`,kind:'accrued_reverse',
    doc:{type:'振替伝票',title:'4月1日・去年の未払分を戻す',from:'経理',to:'経理',date:'4月1日',rows:S=>[['去年3月の給料',Math.round(R(S,t-1).labor),'amt'],['去年3月のガス・水道・電気',Math.round(R(S,t-1).util),'amt'],['メモ','去年の費用に入れた分。今月の支払と重ねない']]},
    ans:S=>je([['未払費用',Math.round(R(S,t-1).labor+R(S,t-1).util)]],[['給料',Math.round(R(S,t-1).labor)],['水道光熱費',Math.round(R(S,t-1).util)]]),opts:opts('未払費用','水道光熱費')});
  const routineAt = t => [...(t % 12 === 0 ? [reverseMarch(t)] : []),...routine(t)];
  const monthTitle = t => `${Math.floor(t/12)+1}年目・${MON[t%12]}月の店`;
  const bal = (S,a) => BK.balance(S.T || [],a);
  const positive = n => Math.max(0,Math.round(n));
  const doc = (id,kind,title,rows,ans,accounts) => ({t:'doc',id,kind,doc:{type:'振替伝票',title,from:'経理',to:'経理',date:'3月31日',rows},ans,opts:opts(...accounts)});
  const yearIncome = (S,y) => BK.income((S.T || []).filter(e => (e.y || 1) === y && !e.closing));
  // 同じ基準の1年目と同じ税額の教材条件。税率の制度を新設していない。
  const tax = (S,y) => Math.max(70000,Math.floor(BK.income((S.T || []).filter(e=>(e.y || 1)===y && e.ev!==`tax${y}`)).net*0.3/100)*100+70000);
  const kessan = y => {
    const t = y*12-1;
    const stock = S => Math.round(buyAmt(S,t)*0.15/100)*100;
    const accrued = S => Math.round(R(S,t).labor+R(S,t).util);
    const dep = S => SIM.y2.fitoutAnnual ? SIM.y2.fitoutAnnual(S,y) : Array.from({length:12},(_,i)=>Math.round(R(S,t-11+i).dep || 0)).reduce((a,b)=>a+b,0);
    const allowance = S => Math.round(positive(bal(S,'クレジット売掛金'))*0.01);
    const taxEntry = S => (S.T || []).find(e => e.ev === `tax${y}`);
    const taxDue = S => taxEntry(S) ? taxEntry(S).cr.reduce((n,[a,v])=>n+(a==='未払法人税等'?v:0),0) : tax(S,y);
    const equity = S => Object.entries(g.BOKI.accounts).filter(([,a])=>a.cat==='純資産').reduce((n,[a])=>n-bal(S,a),0)+yearIncome(S,y).net;
    const settle = {year:y,m:3,bookT:t,seg:`y${y}-adjust`,label:`${y}年目の決算`,title:'残った材料と、まだ払っていない分',closeless:true,events:[
      ...(SIM.y2.adjustments || []).flatMap(fn=>fn(y)),
      doc(`stock${y}`,'stock','残った材料の棚卸表',S=>[['3月末の材料（実地で数えた分）',stock(S),'amt'],['販売用の鉢・商品の帳簿残高',positive(bal(S,'商品')),'amt'],['鉢の扱い','販売時に売上原価へ移しているため、残っている商品は資産のまま。ここで原価を二重に戻さない。']],S=>je([['繰越商品',stock(S)]],[['仕入',stock(S)]]),['繰越商品']),
      doc(`accrued${y}`,'accrued','3月に働いてもらった分・使った分',S=>[['給料',Math.round(R(S,t).labor),'amt'],['ガス・水道・電気',Math.round(R(S,t).util),'amt'],['支払','4月25日・27日']],S=>je([['給料',Math.round(R(S,t).labor)],['水道光熱費',Math.round(R(S,t).util)]],[['未払費用',accrued(S)]]),['未払費用','水道光熱費']),
      doc(`dep-fitout${y}`,'dep','内装の、今年使った分',S=>[['月ごとの費用の合計',dep(S),'amt']],S=>je([['減価償却費',dep(S)]],[['建物減価償却累計額',dep(S)]]),['減価償却費','建物減価償却累計額']),
      doc(`allow${y}`,'allow','カード会社から入る分の見積り',S=>[['3月末の請求残高',positive(bal(S,'クレジット売掛金')),'amt'],['見積率','資料の条件：1%'],['必要な3月末残高',allowance(S),'amt']],S=>{const old=-bal(S,'貸倒引当金'),d=allowance(S)-old;return d>=0?je([['貸倒引当金繰入',d]],[['貸倒引当金',d]]):je([['貸倒引当金',-d]],[['貸倒引当金戻入',-d]]);},['貸倒引当金繰入','貸倒引当金戻入','貸倒引当金']),
      doc(`vat-close${y}`,'vat_close','預かった分と払った分を差し引く',S=>[['預かった分',-bal(S,'仮受消費税'),'amt'],['払った分',bal(S,'仮払消費税'),'amt']],S=>{const recv=-bal(S,'仮受消費税'),paid=bal(S,'仮払消費税');return recv>=paid?je([['仮受消費税',recv]],[['仮払消費税',paid],['未払消費税',recv-paid]]):je([['仮受消費税',recv],['未収還付消費税',paid-recv]],[['仮払消費税',paid]]);},['仮受消費税','仮払消費税','未払消費税','未収還付消費税']),
      doc(`tax${y}`,'tax','今年の税金の計算書',S=>[['今年の税金',tax(S,y),'amt'],['支払','翌4月']],S=>je([['法人税等',tax(S,y)]],[['未払法人税等',tax(S,y)]]),['法人税等','未払法人税等']),
    ]};
    const statement = {year:y,m:3,bookT:t,seg:`y${y}-statements`,label:`${y}年目の決算書`,title:'株主から来たお金と、店で残したお金',closeless:true,events:[
      {t:'report',id:`report${y}`},
      Y1.calc(`ss${y}`,{scope:['s-ssce'],title:'返さなくてよいお金の、3月末の合計',rows:S=>[['資本金',-bal(S,'資本金')],['資本準備金',-bal(S,'資本準備金')],['利益準備金',-bal(S,'利益準備金')],['これまでのもうけの貯まり',-bal(S,'繰越利益剰余金')],['今年のもうけ',yearIncome(S,y).net]],q:'資料の5つを合わせると、今年末はいくら？',answer:equity,unit:'円',why:'株主から集めた分と、店でかせいで残した分を分けたまま、合計を確かめる。'}),
      ...(y===3?[{...Y1.calc('gappei-fs',{scope:['s-honshiten'],title:'本店と2号店の表を、会社全体の表へ',
        rows:S=>{const q=SIM.y2.consolidation(S);return [['両店の資産の合計（社内の分を消す前）',q.before],['その中の支店の札',q.internal],['支店側にある同額の本店の札',q.internal]];},
        q:'会社の中のやり取りを消すと、会社全体の資産はいくら？',answer:S=>SIM.y2.consolidation(S).assets,unit:'円',why:'支店の札は外への債権ではない。本店の札と消し合い、会社の外に対して持つ資産だけを残す。'}),when:S=>(S.T||[]).some(e=>/^site2-doc3@/.test(e.ev||''))}]:[]),
      {t:'ss',id:`ss-table${y}`,talk:[['senpai','増えた原因と、減った原因を、1年分の表に並べよう。']]},
      {t:'closing',id:`closing${y}`},
    ]};
    const next = {year:y+1,m:4,bookT:t+1,seg:`y${y}-next`,label:`${y+1}年目のはじめ`,title:'去年の約束を引き継ぐ',closeless:true,events:[
      {t:'opening',id:`opening${y+1}`,year:y+1},
      {...doc(`tax-pay${y}`,'tax_pay','去年の税金の振込',S=>[['お引出し',taxDue(S),'amt']],S=>je([['未払法人税等',taxDue(S)]],[['普通預金',taxDue(S)]]),['未払法人税等']),doc:{...pb('4月30日','去年の税金','お引出し',0),rows:S=>[['お引出し',taxDue(S),'amt']]}},
      doc(`stock-back${y}`,'stock_back','今年へ持ち越した材料',S=>[['前3月末の材料',stock(S),'amt']],S=>je([['仕入',stock(S)]],[['繰越商品',stock(S)]]),['繰越商品']),
    ]};
    return [settle,statement,next];
  };
  const consolidation=S=>{
    const T=S.T||[], internal=T.filter(e=>/^site2-doc3@/.test(e.ev||'')).reduce((n,e)=>n+BK.balance([e],'支店'),0);
    const assets=Object.entries(g.BOKI.accounts).filter(([a,v])=>v.cat==='資産'||a==='貸倒引当金'||a.endsWith('減価償却累計額')).reduce((n,[a])=>n+BK.balance(T,a),0);
    // 送金時の消去仕訳を戻した、合併前の作業用資料。会社全体の帳簿自体は変更しない。
    return {internal,assets,before:assets+internal};
  };
  // 抽選の種類ごとに独立。同じseed・月・種類なら、ほかの判断の有無で乱数をずらさない。
  const stream=(W,kind)=>{let h=0;for(const c of kind)h=(h*31+c.charCodeAt(0))>>>0;return SIM.rng((W.seed*1000003+W.t*10007+h)>>>0);};
  SIM.y2 = {stream, consolidation, routine: routineAt, monthTitle, kessan, books: BK, je, opts, pb, R, MON, yearIncome};
})(typeof window !== 'undefined' ? window : globalThis);
