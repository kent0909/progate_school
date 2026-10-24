// 2年目以降の帳簿の読み出し。世界の損益を書き換えず、仕訳から発生主義の数を出す。
// 金額はすべて資料・帳簿に由来する。このファイルにはゲームの置き値を持たない。
(function (g) {
  'use strict';
  const SIM = g.SIMDATA;
  const sum = (entry, side, account) => (entry[side] || []).reduce((n, [a, v]) => n + (a === account ? v : 0), 0);
  const balance = (entries, account) => entries.reduce((n, e) => n + sum(e, 'dr', account) - sum(e, 'cr', account), 0);
  const cash = entries => balance(entries, '普通預金') + balance(entries, '現金');
  const monthOf = e => {
    const m = SIM.months[e.mi] || {};
    return e.ramenT != null ? e.ramenT : m.ramenT != null ? m.ramenT : m.bookT;
  };
  const income = entries => {
    let revenue = 0, expense = 0;
    for (const e of entries) {
      if (e.closing) continue;
      for (const side of ['dr', 'cr']) for (const [a, v] of e[side] || []) {
        const cat = (g.BOKI.accounts[a] || {}).cat;
        if (cat === '収益') revenue += side === 'cr' ? v : -v;
        if (cat === '費用') expense += side === 'dr' ? v : -v;
      }
    }
    return { revenue, expense, net: revenue - expense };
  };
  // 締切・期首の画面は月の営業とは分ける。S.Tは正しい帳簿、S.Lは遊ぶ人の帳簿。
  const monthly = (S, t, side = 'T') => {
    const entries = (S[side] || []).filter(e => monthOf(e) === t && !e.closing);
    return { ...income(entries), cash: cash(entries), entries };
  };
  // 残高を合わせるための差額行は作らない。資料から説明できた差だけを足す。
  // rows: [{id,label,amount,why,source}]。amountは「帳簿→世界」の向き。
  const bridge = (bookCash, worldCash, rows) => {
    const seen = new Set();
    for (const row of rows) {
      if (!row.id || seen.has(row.id)) throw new Error(`口座照合の根拠が重複：${row.id}`);
      if (!Number.isFinite(row.amount) || !row.source || !row.why) throw new Error(`口座照合に根拠がない：${row.id}`);
      seen.add(row.id);
    }
    const explained = rows.reduce((n, row) => n + row.amount, 0);
    return { book: bookCash, world: worldCash, rows, explained, rest: worldCash - bookCash - explained };
  };
  // 固定資産の売却・除却の正答は取得と償却の実績から計算する。
  // 台帳の各行はassetIdと取得額・当期までの償却額を持つ。選ばない資産は混ぜない。
  const assetValue = (ledger, assetId) => {
    const rows = ledger.filter(x => x.assetId === assetId);
    const cost = rows.reduce((n, x) => n + (x.cost || 0), 0);
    const accumulated = rows.reduce((n, x) => n + (x.depreciation || 0), 0);
    if (cost < 0 || accumulated < 0 || accumulated > cost) throw new Error(`資産台帳の残高が不正：${assetId}`);
    return { cost, accumulated, book: cost - accumulated };
  };
  // 現金の各出所を独立して照合する。未知の取引は残差に残し、調整行には入れない。
  const reconcile = (S,t,side='T') => {
    const labels={opening:'開業のお金',sales:'売上の入金・カードの翌月入金',materials:'材料の購入と翌月の支払',salary:'給料の翌月払い',util:'光熱費の翌月払い',rent:'家賃と消費税',finance:'借入・元本・利息',other:'通信・掃除・小物',ads:'宣伝の後払いと配信費',cards:'札の入出金',tax:'法人税の納付',fee:'銀行手数料'};
    const reasons={
      opening:'開業資金と、内装・器材・保証金の支払を資料どおりに比べる。',
      sales:'店は売上を当月入金する仮定。帳簿はカードの翌月入金、消費税、カード手数料を反映する。',
      materials:'店は使った材料を当月払う仮定。帳簿は掛け代金の翌月払い、消費税、まとめ買いの実支払を反映する。',
      salary:'通常の給料は、店の試算では働いた月、通帳では翌月に動く。退職時の精算は札の支払に含める。',
      util:'ガス・水道・電気を使った月と、代金を払う月が違う。',
      rent:'店の試算は税抜。通帳は、支払った消費税も含む。',
      finance:'元本・利息・追加借入を比べる。1年目から引き継いだ簡略計算と資料の差も含む。',
      other:'電話などの支出。月報でまとめて記帳する前は差が出る。',
      ads:'チラシは翌月払い、配信などは当月払いで記帳する。',
      cards:'札の入出金。結果が返る月の違いと、1年目の店の簡略計算に含めていない支払も分けて比べる。',
      tax:'帳簿は実際の法人税の支払を引く。店の営業を比べる試算には、この支払を含めていない。',
      fee:'銀行の振込手数料。店の営業の試算には含めていない。'
    };
    const model={},book={},sources={};for(const k of Object.keys(labels)){model[k]=0;book[k]=0;sources[k]=[];}
    const C=SIM.coef;model.opening=C('ownCash')+C('loan')-C('fitout')-C('deposit')-C('equipOpen');
    for(let k=0;k<=t;k++){const r=(S.res||{})[k];if(!r)continue;
      model.sales+=r.sales;model.materials-=r.cogs+r.wasteCost+(r.bulkPaid||0);model.salary-=r.labor+(r.famPay||0);model.util-=r.util;model.rent-=r.rent;model.finance+=(r.borrowed||0)-r.interest-r.repay;model.other-=r.other;model.ads-=r.ads;model.cards+=(r.fx||0)+(r.capital||0)+(r.invest||0);
    }
    const classify=id=>{
      if(['found','loan','deposit','fitout','equip'].includes(id))return 'opening';
      if(/^(sale|cardin|coupon)\d+$/.test(id))return 'sales';
      if(/^(buy|pap)\d+$/.test(id)||id==='buy-bulk9')return 'materials';
      if(/^sal\d+$/.test(id))return 'salary';if(/^util\d+$/.test(id))return 'util';if(/^rent\d+$/.test(id))return 'rent';
      if(/^repay\d+$/.test(id)||/^borrowed\d+$/.test(id))return 'finance';if(/^other\d+$/.test(id))return 'other';
      if(/^(flyerpay|ads-other)\d+$/.test(id))return 'ads';if(/^tax-pay/.test(id))return 'tax';if(id==='fee-3')return 'fee';
      if(/^fx-book-/.test(id)||/-doc\d+@/.test(id)||/^fx\d+$/.test(id)||/^(equipment-pay|items-stock-sale|spare-storage|close-restore|staff-cost|staff-left-pay|repair-failure)@/.test(id))return 'cards';
      return null;
    };
    const entries=(S[side]||[]).filter(e=>monthOf(e)==null||monthOf(e)<=t);
    // 説明の基準は正しい記帳T。遊ぶ人のLの誤りまで差額の説明に吸収しない。
    const truth=(S.T||[]).filter(e=>monthOf(e)==null||monthOf(e)<=t);
    const unknown=[];for(const e of truth){const v=cash([e]);if(!v)continue;const id=e.ev||e.id||'',k=classify(id);if(k){book[k]+=v;sources[k].push(id);}else unknown.push({id,cash:v});}
    const rows=Object.keys(labels).map(id=>({id,label:labels[id],amount:model[id]-book[id],v:model[id]-book[id],why:reasons[id],source:sources[id].join(', ')||'月報の入出金',model:model[id],book:book[id]}));
    rows.push({id:'noncash',label:'減価償却・引当金・棚卸の振替',amount:0,v:0,why:'損益や資産・負債は変わるが、この仕訳では口座は動かない。支払時の入出金は上の各行で照合。',source:'固定資産台帳・決算の振替仕訳'});
    const result=bridge(cash(entries),(S.res[t]||{}).cash,rows);return {...result,unknown,modelCash:Object.values(model).reduce((a,b)=>a+b,0)};
  };
  SIM.y2books = {reconcile,  balance, cash, income, monthly, monthOf, bridge, assetValue };
})(typeof window !== 'undefined' ? window : globalThis);
