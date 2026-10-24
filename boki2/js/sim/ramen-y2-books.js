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
  SIM.y2books = { balance, cash, income, monthly, monthOf, bridge, assetValue };
})(typeof window !== 'undefined' ? window : globalThis);
