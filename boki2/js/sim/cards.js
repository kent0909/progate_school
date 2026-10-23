// 札（出来事）と判断の山札（DESIGN-RAMEN 版0.4 e章・d.6・l.1）。純粋なデータと関数（DOM なし）。
// 1枚＝{ id, title, shelf, kind, scope, when(W), weight(W), fixed, once, talk, q, options:[{ id, label, desc, time, shift, outcomes:[{ id, w, label, cash, fx, docs }] }] }
//  ・when：出せる状態か（暦・評判・手の内）。fixed：その月は必ず出す（決まった月の札）。once：1周に1回
//  ・outcomes の w は合計100（decide.js の shift で状態に応じて結果どうしの間で動かす）。結果は2つ以上（両方向：X13）
//  ・cash：その月の損益に入るお金（＋は収入）。fx(W, fx, me, rng)：状態の変化。docs(W)：帳簿に書く書類（ramen.js が月の出来事にする）
// 切り身の札（l.1 の26本＋猛暑・材料の値上がり）。社長の誘い（pres）は「ときどき正しい」（DESIGN-ROUND2 7.2）
(function (g) {
  const SIM = (g.SIMDATA = g.SIMDATA || {});
  const C = (k) => SIM.coef(k);
  const je = (dr, cr) => ({ dr, cr });
  const SHOP = '{店}';
  const man = (n) => Math.round(n / 1000) * 1000;
  const mm = (W) => `${W.m}月`;
  const pb = (W, day, memo, kind, amt) => ({ type: '通帳', title: '普通預金 通帳', from: 'みらい銀行', to: SHOP, date: `${W.m}月${day}`, rows: [['摘要', memo], [kind, amt, 'amt']] });
  const salesOf = (W) => (W.last ? W.last.sales : 700000);
  const me = (W) => W.stores[0];
  const pol = (W) => me(W).pol || {};
  // 書類1枚（engine の doc の形）。scope は試験範囲の項目 id（coverage.js --ramen が数える）
  const doc = (kind, id, d, ans, opts, scope) => ({ t: 'doc', kind, id, doc: d, ans, opts, scope });

  const deck = [
    // ---------- 資金の棚 ----------
    { id: 'openloan', title: '開業資金の借入の契約書', shelf: 'money', kind: 'decision', scope: ['b-loan'], fixed: true, once: true, when: (W) => W.t === 0,
      talk: [['ginko', '公庫の創業の融資、700万円。年2.5%で7年。毎月の返済は約8.3万円です。'], ['shacho', '{名}、読んどいて！ ハンコはもう押した！']], q: '契約書をどう読む？',
      options: [
        { id: 'read', label: '返済の表と特約を自分で読む', desc: '時間はかかるが、毎月の返済と利息が分かる', outcomes: [{ id: 'ok', w: 90, label: '返済の月と利息の額が分かった。期日の一覧に入る' }, { id: 'find', w: 10, label: '「決算書を毎年出す」の特約を見つけた。銀行は決算書を見る' }] },
        { id: 'trust', label: '社長に任せる', desc: 'すぐ終わる', outcomes: [{ id: 'ok', w: 70, label: '何も起きない（今は）' }, { id: 'miss', w: 30, label: '特約を知らないまま。1年目の決算書の出し方を後で聞かれる', fx: (W) => { W.flags.covenantUnknown = true; } }] },
      ],
      docs: (W) => [doc('loan_in', 'r-loan', pb(W, '1日', '公庫 創業融資 ご入金', 'お預け入れ', C('loan')), je([['普通預金', C('loan')]], [['借入金', C('loan')]]), ['普通預金', '借入金', '資本金', '売上'], ['b-loan'])] },
    { id: 'mayfund', title: '5月の支払いが重なる', shelf: 'money', kind: 'decision', scope: ['b-accrual'], fixed: true, once: true, when: (W) => W.m === 5,
      talk: [['senpai', '5月は、開店の月の材料の払いと、内装の残りと、返済が重なる。口座はもうけと同じ速さでは増えない。']], q: '5月の口座、どうする？',
      options: [
        { id: 'list', label: '期日の一覧で支払いの順を並べる', time: 0, outcomes: [{ id: 'ok', w: 85, label: '払う順を並べて、足りる月が分かった' }, { id: 'tight', w: 15, label: '並べたら6月がぎりぎり。仕入を少し減らした', cash: -10000 }] },
        { id: 'none', label: '通帳を見れば分かる（社長）', pres: true, outcomes: [{ id: 'ok', w: 60, label: 'たまたま足りた' }, { id: 'late', w: 40, label: '支払いが1日遅れた。遅れた分のお金を払う', cash: -3000, fx: (W, fx) => { fx.Rd -= 0.02; } }] },
      ] },
    { id: 'due', title: '期日の一覧を作るか', shelf: 'money', kind: 'decision', scope: ['b-accrual', 'b-credit'], once: true, when: (W) => W.t >= 3 && W.t <= 9, weight: () => 3,
      talk: [['shacho', '期日の表？ 通帳を見れば分かるだろ！'], ['senpai', '払う約束と、もらう約束の日。並べると先の口座が読める。']], q: '期日の一覧を作る？',
      options: [
        { id: 'make', label: '作る（毎月の月末に見直す）', outcomes: [{ id: 'ok', w: 80, label: '先の3か月の口座が見えた', fx: (W) => { W.flags.dueList = true; } }, { id: 'catch', w: 20, label: '作ったら、翌月の支払いの山に気づいた', fx: (W) => { W.flags.dueList = true; } }] },
        { id: 'skip', label: '作らない', outcomes: [{ id: 'ok', w: 65, label: '何も起きない（今は）' }, { id: 'miss', w: 35, label: '払う日を1つ見落とした。慌てて振り込んだ', cash: -2000 }] },
      ] },
    // ---------- 仕入・コストの棚 ----------
    { id: 'supplier', title: '仕入先を決める（半年ごと）', shelf: 'cost', kind: 'decision', scope: ['s-sanbunpo', 'b-credit'], when: (W) => W.t === 0 || W.m === 10, fixed: true,
      talk: [['shacho', '豚と麺の仕入先、安いところが見つかった！']], q: '仕入先は？',
      options: [
        { id: 'cheap', label: '安い問屋（品質がぶれる）', desc: '材料の値段 −5%', outcomes: [{ id: 'ok', w: 70, label: '安く仕入れられた', fx: (W, fx, s) => { s.costMul = 0.95; } }, { id: 'bad', w: 30, label: '品質がぶれる月がある', fx: (W, fx, s) => { s.costMul = 0.95; s.badSupply = true; } }] },
        { id: 'stable', label: 'いつもの問屋（高いが安定）', outcomes: [{ id: 'ok', w: 90, label: '品質は安定', fx: (W, fx, s) => { s.costMul = 1; s.badSupply = false; } }, { id: 'up', w: 10, label: '来月から少し値上げの知らせ', fx: (W, fx, s) => { s.costMul = 1.02; s.badSupply = false; } }] },
      ],
      docs: (W) => { const a = man(salesOf(W) * 0.3); return [doc('buy_credit', `r-buy-${W.t}`, { type: '請求書', title: '請求書（麺・豚・野菜）', from: '杉田食品', to: SHOP, date: `${W.m}月10日`, rows: [['品名', '麺・豚・野菜'], ['金額', a, 'amt'], ['お支払期日', '翌月末']] }, je([['仕入', a]], [['買掛金', a]]), ['仕入', '買掛金', '普通預金', '未払金'], ['s-sanbunpo', 'b-credit'])]; } },
    { id: 'defect', title: '届いた豚の色がおかしい', shelf: 'cost', kind: 'shock', scope: ['s-sanbunpo'], when: (W) => W.t >= 1, weight: (W) => (me(W).badSupply ? 4 : 1.5),
      talk: [['piyo', '今朝の豚、色がいつもとちがうピヨ…']], q: 'どうする？',
      options: [
        { id: 'return', label: '返品する（検品で気づいた分）', outcomes: [{ id: 'ok', w: 80, label: '返品が通った', fx: (W, fx, s) => { s.returned = true; } }, { id: 'late', w: 20, label: '気づくのが遅く、半分しか返せなかった', cash: -10000 }], shift: [{ if: (W) => !pol(W).inspect, from: 'ok', to: 'late', amt: 50 }] },
        { id: 'use', label: 'そのまま使う', outcomes: [{ id: 'ok', w: 60, label: '何も起きなかった' }, { id: 'complain', w: 40, label: 'お客さんから苦情。評判が下がった', fx: (W, fx) => { fx.Rd -= 0.08; } }] },
      ],
      docs: (W) => [doc('buy_return', `r-ret-${W.t}`, { type: '返品伝票', title: '返品伝票（豚肉）', from: '杉田食品', to: SHOP, date: `${W.m}月15日`, rows: [['返品した品', '豚肉 5kg'], ['金額', 20000, 'amt']] }, je([['買掛金', 20000]], [['仕入', 20000]]), ['買掛金', '仕入', '普通預金', '売上'], ['s-sanbunpo'])] },
    { id: 'bulk', title: '小麦の値上げの知らせ（まとめ買いの誘い）', shelf: 'cost', kind: 'decision', scope: ['s-sanbunpo', 's-genmo'], when: (W) => W.m === 9 || W.m === 3, weight: () => 4, once: true,
      talk: [['eigyo', '来月から小麦が上がるそうです。今まとめて買えば、少し戻しもあると。']], q: 'まとめて買う？',
      options: [
        { id: 'bulk', label: '3か月分まとめて買う', outcomes: [{ id: 'cheap', w: 50, label: '単価が下がり、仕入の戻し（割戻し）ももらえた', cash: 15000 }, { id: 'spoil', w: 30, label: '使い切れず、一部が湿気た', cash: -20000 }, { id: 'space', w: 20, label: '置き場が足りず、棚を借りた', cash: -8000 }] },
        { id: 'small', label: 'いつもどおり小分けに', outcomes: [{ id: 'ok', w: 70, label: '値上がりの分だけ原価が上がった', fx: (W, fx, s) => { s.costMul = (s.costMul || 1) * 1.01; } }, { id: 'nochange', w: 30, label: '値上げは小さかった' }] },
      ],
      docs: (W) => [doc('rebate', `r-reb-${W.t}`, { type: 'お知らせ', title: '仕入割戻しのお知らせ', from: '杉田食品', to: SHOP, date: `${W.m}月末`, rows: [['内容', 'まとめ買いの割戻し（買掛金から差し引き）'], ['金額', 15000, 'amt']] }, je([['買掛金', 15000]], [['仕入', 15000]]), ['買掛金', '仕入', '売上', '普通預金'], ['s-sanbunpo'])] },
    { id: 'foodup', title: '豚と油の値上がり', shelf: 'cost', kind: 'shock', scope: ['s-sanbunpo'], when: (W) => W.m === 4 || W.m === 10 || W.m === 1, weight: () => 2,
      talk: [['eigyo', '豚と油、来月から5%上がるそうです。']], q: 'どうする？',
      options: [
        { id: 'raise', label: '値段を上げる準備をする', outcomes: [{ id: 'ok', w: 60, label: '来月、値上げの手が試算つきで出る' }, { id: 'small', w: 40, label: '上がり方は小さかった' }] },
        { id: 'keep', label: '据え置き（もうけを削る）', outcomes: [{ id: 'ok', w: 60, label: '原価が少し上がった', fx: (W, fx, s) => { s.costMul = (s.costMul || 1) * 1.02; } }, { id: 'small', w: 40, label: '上がり方は小さかった' }] },
      ] },
    { id: 'haccp', title: '衛生の記録（社長の誘い）', shelf: 'cost', kind: 'decision', scope: [], when: (W) => W.t >= 2, weight: (W) => (pol(W).haccp ? 1 : 3),
      talk: [['shacho', '忙しい月は、衛生の記録なんて飛ばしていいだろ？']], q: '衛生の記録は？',
      options: [
        { id: 'keep', label: '毎日つける（時間1）', outcomes: [{ id: 'ok', w: 99, label: '何も起きない（記録が残った）' }, { id: 'sick', w: 1, label: 'お客さんがおなかをこわした。記録があったので、範囲を絞れた', cash: -50000, fx: (W, fx) => { fx.Rd -= 0.1; } }] },
        { id: 'skip', label: '忙しい月は飛ばす', outcomes: [{ id: 'ok', w: 97, label: '何も起きない（今は）' }, { id: 'sick', w: 3, label: '食中毒の疑い。3日の営業停止', cash: -250000, fx: (W, fx) => { fx.Rd -= 0.3; fx.demandMul *= 0.85; } }] },
      ] },
    { id: 'maintain', title: '寸胴の火が弱い（点検の報告）', shelf: 'cost', kind: 'decision', scope: ['s-capex', 's-cost'], when: (W) => W.t >= 2, weight: () => 1.6, once: true,
      talk: [['piyo', 'コンロの火が弱くなったピヨ。業者さんの見積りが来た。']], q: 'どうする？',
      options: [
        { id: 'repair', label: '修理する（12万円）', outcomes: [{ id: 'ok', w: 80, label: '直った', cash: -120000 }, { id: 'again', w: 20, label: '直ったが、また弱くなりそう', cash: -120000 }] },
        { id: 'new', label: '新しいコンロに買い替える（30万円）', outcomes: [{ id: 'ok', w: 90, label: '火が強くなり、炊く時間が短くなった' }, { id: 'late', w: 10, label: '届くまで3日休んだ', fx: (W, fx) => { fx.demandMul *= 0.9; } }] },
        { id: 'wait', label: 'まだ使う', outcomes: [{ id: 'ok', w: 60, label: 'しばらくは使えた' }, { id: 'stop', w: 40, label: '営業中に止まった。2日休んだ', cash: -150000, fx: (W, fx) => { fx.demandMul *= 0.93; fx.Rd -= 0.05; } }] },
      ],
      docs: (W) => [doc('repair', `r-rep-${W.t}`, { type: '請求書', title: '請求書（コンロの修理）', from: '山中厨房', to: SHOP, date: `${W.m}月20日`, rows: [['内容', 'コンロの部品の交換（もとの性能に戻す修理）'], ['金額', 120000, 'amt'], ['お支払期日', '翌月末']] }, je([['修繕費', 120000]], [['未払金', 120000]]), ['修繕費', '備品', '未払金', '買掛金'], ['s-capex', 'b-mibarai']),
        doc('buy_equip', `r-eq-${W.t}`, { type: '請求書', title: '請求書（業務用コンロ）', from: '山中厨房', to: SHOP, date: `${W.m}月20日`, rows: [['品名', '業務用コンロ'], ['本体', 280000, 'amt'], ['運送・取り付け', 20000, 'amt'], ['合計', 300000, 'amt'], ['お支払期日', '翌月末']] }, je([['備品', 300000]], [['未払金', 300000]]), ['備品', '修繕費', '未払金', '買掛金'], ['s-cost', 'b-mibarai'])] },
    { id: 'insurance', title: '火災保険に入るか（年1回）', shelf: 'cost', kind: 'decision', scope: ['s-keika'], fixed: true, once: true, when: (W) => W.t === 1,
      talk: [['senpai', '店の火災と休業の保険。1年分を先に払う形だよ。']], q: '保険は？',
      options: [
        { id: 'full', label: '火災と休業に入る（年6万円）', outcomes: [{ id: 'ok', w: 99.5, label: '何も起きない（備えた）' }, { id: 'fire', w: 0.5, label: 'ぼやが出たが、保険で直せた' }] },
        { id: 'fire', label: '火災だけ（年3.6万円）', outcomes: [{ id: 'ok', w: 99.5, label: '何も起きない（備えた）' }, { id: 'fire', w: 0.5, label: 'ぼやで3日休んだ。休んだ分は自分で', fx: (W, fx) => { fx.demandMul *= 0.9; } }] },
        { id: 'none', label: '入らない', outcomes: [{ id: 'ok', w: 99.5, label: '何も起きない（今は）' }, { id: 'fire', w: 0.5, label: 'ぼやで修理と休み。全部自分で', cash: -400000, fx: (W, fx) => { fx.demandMul *= 0.9; } }] },
      ],
      docs: (W) => [doc('insurance', `r-ins-${W.t}`, pb(W, '1日', '火災保険料（1年分）', 'お引出し', 60000), je([['保険料', 60000]], [['普通預金', 60000]]), ['保険料', '前払保険料', '普通預金', '未払金'], ['s-keika'])] },
    { id: 'waste', title: '閉店前に余ったスープ', shelf: 'cost', kind: 'decision', scope: ['s-genmo'], when: (W) => W.t >= 1 && W.last && W.last.waste > 20, weight: () => 2,
      talk: [['piyo', '今月、仕込みすぎてスープが余る日が多かったピヨ。']], q: '余りはどうする？',
      options: [
        { id: 'timesale', label: '閉店前の値下げ（タイムサービス）', outcomes: [{ id: 'ok', w: 60, label: '少し売れた', cash: 8000 }, { id: 'habit', w: 40, label: '閉店前を待つ客が出た', cash: 4000, fx: (W, fx) => { fx.demandMul *= 0.99; } }] },
        { id: 'toss', label: '捨てる', outcomes: [{ id: 'ok', w: 80, label: '捨てた分は材料の損' }, { id: 'think', w: 20, label: '仕込みの量を見直すきっかけになった' }] },
      ],
      docs: (W) => [doc('waste', `r-was-${W.t}`, { type: '棚卸の記録', title: `${W.m}月末の材料の棚卸`, from: '店', to: '経理', date: `${W.m}月末`, rows: [['帳簿の残り（材料）', 50000, 'amt'], ['実際に数えた残り', 38000, 'amt'], ['足りない分（捨てた・こぼれた）', 12000, 'amt']] }, je([['棚卸減耗損', 12000]], [['繰越商品', 12000]]), ['棚卸減耗損', '繰越商品', '仕入', '商品評価損'], ['s-genmo'])] },
    { id: 'soup', title: 'スープを店で炊くか、買うか', shelf: 'cost', kind: 'decision', scope: [], once: true, when: (W) => W.t >= 3, weight: () => 1.5,
      talk: [['shacho', 'スープは店で炊いてこそだ！'], ['eigyo', '外のスープを買えば、光熱費と人の手が減りますよ。']], q: 'スープは？',
      options: [
        { id: 'own', label: '店で炊く', outcomes: [{ id: 'ok', w: 70, label: '味の評判が少し上がった', fx: (W, fx) => { fx.Rd += 0.05; } }, { id: 'uneven', w: 30, label: '日によって味がぶれた', fx: (W, fx) => { fx.Rd -= 0.03; } }] },
        { id: 'buy', label: '外のスープを買う', outcomes: [{ id: 'ok', w: 70, label: '原価は上がったが、光熱費が下がった', cash: 15000, fx: (W, fx, s) => { s.costMul = (s.costMul || 1) * 1.03; } }, { id: 'noticed', w: 30, label: '常連に気づかれた', fx: (W, fx, s) => { s.churnUp = (s.churnUp || 0) + 0.02; } }] },
      ] },
    // ---------- 売上の棚 ----------
    { id: 'hours', title: '営業時間（半年ごと）', shelf: 'sales', kind: 'decision', scope: [], when: (W) => W.m === 6 || W.m === 12, weight: () => 3,
      talk: [['shacho', '夜もあけよう！ 酔ったお客さんが来る！']], q: '営業時間は？',
      options: [
        { id: 'night', label: '昼と夜', outcomes: [{ id: 'up', w: 35, label: '夜の客が乗った', fx: (W, fx) => { fx.demandMul *= 1.06; }, cash: -30000 }, { id: 'even', w: 40, label: '人と光熱でとんとん', cash: -30000, fx: (W, fx) => { fx.demandMul *= 1.03; } }, { id: 'tired', w: 25, label: '人が回らず疲れた', cash: -30000, fx: (W, fx, s) => { s.churnUp = (s.churnUp || 0) + 0.01; } }] },
        { id: 'lunch', label: '昼だけ', outcomes: [{ id: 'ok', w: 70, label: '今までどおり' }, { id: 'lost', w: 30, label: '夜に来た客が帰っていった', fx: (W, fx) => { fx.demandMul *= 0.98; } }] },
      ] },
    { id: 'menu', title: 'セットとギョウザ（季節）', shelf: 'sales', kind: 'decision', scope: [], when: (W) => W.m === 5 || W.m === 11, weight: () => 2.5,
      talk: [['shacho', 'ギョウザとライスのセットを出そう！']], q: 'メニューは？',
      options: [
        { id: 'set', label: 'セットを足す', outcomes: [{ id: 'up', w: 50, label: '1人あたりの売上が上がった', cash: 30000 }, { id: 'mid', w: 35, label: '真ん中のセットだけ売れた', cash: 10000 }, { id: 'waste', w: 15, label: '仕込みと捨てる分が増えた', cash: -15000 }] },
        { id: 'one', label: '看板の一杯に絞る', outcomes: [{ id: 'ok', w: 70, label: '仕込みが楽になった' }, { id: 'boring', w: 30, label: '「ほかにないの？」の声', fx: (W, fx) => { fx.Rd -= 0.02; } }] },
      ] },
    { id: 'heat', title: '猛暑の長期予報', shelf: 'sales', kind: 'shock', scope: [], once: true, when: (W) => W.m === 6 || W.m === 7, weight: () => 2.5,
      talk: [['piyo', '今年の夏はすごく暑くなるって、長期予報ピヨ。']], q: '夏はどうする？',
      options: [
        { id: 'cold', label: '冷たい麺を出す', outcomes: [{ id: 'fill', w: 60, label: '冷たい麺で客が埋まった', cash: -10000 }, { id: 'waste', w: 40, label: '冷たい麺の材料が余った', cash: -25000 }] },
        { id: 'none', label: 'いつもどおり', outcomes: [{ id: 'down', w: 60, label: '暑さで客が減った', fx: (W, fx) => { fx.demandMul *= 0.9; } }, { id: 'ok', w: 40, label: '思ったほど減らなかった' }] },
      ] },
    { id: 'coupon_dual', title: '「通常950円→今だけ850円」の張り紙（社長）', shelf: 'law', kind: 'decision', scope: ['s-revenue'], once: true, when: (W) => W.t >= 2, weight: () => 1.5,
      talk: [['shacho', '「通常950円」と書いて安く見せよう！ 1週間だけ950円で売ったから大丈夫！']], q: '張り紙は？',
      options: [
        { id: 'check', label: '帳簿で8週間の値段を確かめてから書く', outcomes: [{ id: 'ok', w: 80, label: '書けない形と分かった。普通の値引きにした' }, { id: 'fine', w: 20, label: '書ける形にそろえた' }] },
        { id: 'post', label: 'そのまま張る', pres: true, outcomes: [{ id: 'ok', w: 70, label: '客が少し増えた', fx: (W, fx) => { fx.demandMul *= 1.03; } }, { id: 'warn', w: 30, label: '「本当に通常価格？」と指摘され、評判が下がった', fx: (W, fx) => { fx.Rd -= 0.1; } }] },
      ],
      docs: (W) => { const a = man(salesOf(W) * 0.03); return [doc('discount', `r-disc-${W.t}`, { type: '値引きの記録', title: `${W.m}月の値引き（クーポン）`, from: '券売機', to: '経理', date: `${W.m}月末`, rows: [['値引きした額', a, 'amt'], ['メモ', '値引きした分は、売れた額から引く（ポイントのような後の約束ではない）']] }, je([['売上', a]], [['普通預金', a]]), ['売上', '普通預金', '広告宣伝費', '支払手数料'], ['s-revenue'])]; } },
    { id: 'premium', title: '商品券の抽選（社長）', shelf: 'law', kind: 'decision', scope: [], once: true, when: (W) => W.t >= 4, weight: () => 1.2,
      talk: [['shacho', '10杯食べたら1万円の商品券が当たる抽選、やろう！']], q: '景品は？',
      options: [
        { id: 'small', label: '200円以下のおまけを全員に', outcomes: [{ id: 'ok', w: 70, label: 'ちょっと喜ばれた', cash: -10000, fx: (W, fx) => { fx.demandMul *= 1.01; } }, { id: 'none', w: 30, label: '気づかれなかった', cash: -10000 }] },
        { id: 'big', label: '1万円の商品券の抽選', pres: true, outcomes: [{ id: 'ok', w: 50, label: '話題になった', cash: -30000, fx: (W, fx) => { fx.demandMul *= 1.03; } }, { id: 'warn', w: 50, label: '景品の上限を超えると指摘された。中止', cash: -30000, fx: (W, fx) => { fx.Rd -= 0.05; } }] },
      ] },
    { id: 'freelance', title: 'メニュー表のデザインを頼む', shelf: 'people', kind: 'decision', scope: ['b-mibarai'], once: true, when: (W) => W.t >= 1, weight: () => 1.5,
      talk: [['shacho', '友だちのデザイナーに、メニュー表を口で頼んどいた！ 払いは3か月後でいいって！']], q: '頼み方は？',
      options: [
        { id: 'write', label: '金額と期日を書いて送る（60日以内に払う）', outcomes: [{ id: 'ok', w: 85, label: 'いいメニュー表ができた', fx: (W, fx, s) => { s.A = (s.A || 0) + 0.2; } }, { id: 'late', w: 15, label: '少し遅れたが、できた' }] },
        { id: 'oral', label: '口約束のまま', pres: true, outcomes: [{ id: 'ok', w: 50, label: 'できた' }, { id: 'fight', w: 50, label: '金額でもめた。次は断られた', cash: -10000 }] },
      ],
      docs: (W) => [doc('ad_credit', `r-des-${W.t}`, { type: '請求書', title: '請求書（メニュー表のデザインと印刷）', from: 'デザイン工房 ミナト', to: SHOP, date: `${W.m}月25日`, rows: [['内容', 'メニュー表のデザインと印刷'], ['金額', 50000, 'amt'], ['お支払期日', '翌月末']] }, je([['広告宣伝費', 50000]], [['未払金', 50000]]), ['広告宣伝費', '未払金', '買掛金', '普通預金'], ['b-mibarai', 'b-expense'])] },
    { id: 'president_cash', title: '社長が店のお金で車を（社長）', shelf: 'people', kind: 'decision', scope: [], once: true, when: (W) => W.t >= 5, weight: () => 1.5,
      talk: [['shacho', '店のお金で、ぼくの車の修理代を払っといて！']], q: 'どうする？',
      options: [
        { id: 'stop', label: '止める（社長の財布で）', outcomes: [{ id: 'ok', w: 80, label: '社長はしぶしぶ自分で払った' }, { id: 'sulk', w: 20, label: '社長が少しすねた' }] },
        { id: 'pay', label: '店のお金で払う', pres: true, outcomes: [{ id: 'ok', w: 60, label: '口座が減った', cash: -80000 }, { id: 'tax', w: 40, label: '後で税理士に「店の費用ではない」と言われた', cash: -90000 }] },
      ] },
    { id: 'minwage', title: '最低賃金が上がる（10月）', shelf: 'people', kind: 'shock', scope: ['b-expense'], fixed: true, once: true, when: (W) => W.m === 10,
      talk: [['senpai', '10月から最低賃金が上がる。パートさんの時給を見直そう。']], q: '時給は？',
      options: [
        { id: 'min', label: '最低賃金に合わせる', outcomes: [{ id: 'ok', w: 80, label: '給料が少し上がった', fx: (W, fx, s) => { s.wageUp = 1.03; } }, { id: 'quit', w: 20, label: 'パートさんが近くの店へ移る話をしていた', fx: (W, fx, s) => { s.wageUp = 1.03; s.churnUp = (s.churnUp || 0) + 0.005; } }] },
        { id: 'plus', label: '少し上乗せする', outcomes: [{ id: 'ok', w: 90, label: 'パートさんが喜んだ', fx: (W, fx, s) => { s.wageUp = 1.05; fx.Rd += 0.02; } }, { id: 'same', w: 10, label: '変わらなかった', fx: (W, fx, s) => { s.wageUp = 1.05; } }] },
      ],
      docs: (W) => { const a = Math.round(me(W).parts * C('wagePart') * 1.03) || 30000; return [doc('pay_salary', `r-sal-${W.t}`, pb(W, '25日', '給与振込（パート）', 'お引出し', a), je([['給料', a]], [['普通預金', a]]), ['給料', '普通預金', '未払金', '預り金'], ['b-expense'])]; } },
    // ---------- 店の外から来る札（ライバル・取材・卸・町の行事・良い方の札） ----------
    { id: 'rival_open', title: '近くに工事の看板（出店の予兆）', shelf: 'outside', kind: 'shock', scope: [], fixed: true, once: true, when: (W) => (W.m === 6 || W.m === 7 || W.m === 8) && !W.flags.omen && (W.m === 8 || SIM.rng(W.seed * 13 + W.m)() < 0.5),
      talk: [['eigyo', '駅の方に工事の看板。ラーメン屋が出るらしいです。2か月後だとか。']], q: '先に何をする？',
      options: [
        { id: 'tweak', label: '一杯の手直しで迎える', outcomes: [{ id: 'hold', w: 60, label: '常連は残った', fx: (W) => { W.flags.omen = { at: W.t + 2, kind: 'cheap', by: 'new' }; W.flags.omenPrep = 'tweak'; } }, { id: 'lose', w: 40, label: '新しい店に少し流れた', fx: (W) => { W.flags.omen = { at: W.t + 2, kind: 'cheap', by: 'new' }; } }] },
        { id: 'cut', label: '値下げで迎える', outcomes: [{ id: 'hold', w: 50, label: '客は残ったが、もうけは削れた', fx: (W) => { W.flags.omen = { at: W.t + 2, kind: 'cheap', by: 'new' }; } }, { id: 'war', w: 50, label: '値下げ合戦になった', fx: (W) => { W.flags.omen = { at: W.t + 2, kind: 'cheap', by: 'new', war: true }; } }] },
        { id: 'none', label: '何もしない', outcomes: [{ id: 'ok', w: 40, label: '思ったほど流れなかった', fx: (W) => { W.flags.omen = { at: W.t + 2, kind: 'cheap', by: 'new', weak: true }; } }, { id: 'lose', w: 60, label: '客が1割流れた', fx: (W) => { W.flags.omen = { at: W.t + 2, kind: 'cheap', by: 'new' }; } }] },
      ] },
    { id: 'torizai', title: '地元のテレビの取材の打診', shelf: 'outside', kind: 'good', scope: [], once: true, when: (W) => (me(W).R >= 4 || (W.last && W.last.sns === 'buzz')) && W.t >= 3, weight: () => 6, // d.4：R≥4.0 か「バズ」の後に打診
      talk: [['eigyo', '地元のテレビが、取材したいそうです！']], q: 'どうする？',
      options: [
        { id: 'sign', label: '看板の一杯で出る（仕込みと人を増やす）', outcomes: [{ id: 'boom', w: 60, label: '放送の翌週に行列', cash: -20000, fx: (W, fx, s) => { fx.demandMul *= 1.25; s.A = (s.A || 0) + 1.5; } }, { id: 'small', w: 40, label: '放送は短かった', fx: (W, fx, s) => { s.A = (s.A || 0) + 0.5; } }] },
        { id: 'no', label: '断る（店が回らない）', outcomes: [{ id: 'ok', w: 70, label: 'いつもどおり' }, { id: 'regret', w: 30, label: '近くの店が代わりに出た', fx: (W, fx) => { fx.demandMul *= 0.98; } }] },
      ] },
    { id: 'wholesale_offer', title: '近くの居酒屋から「スープを分けて」', shelf: 'outside', kind: 'decision', scope: [], once: true, when: (W) => W.t >= 6, weight: () => 1.5,
      talk: [['eigyo', '近くの居酒屋さんが、スープを掛けで分けてほしいそうです。'], ['senpai', '工場も配送もない今は、量も代金の回収も心配だね。']], q: 'どうする？',
      options: [
        { id: 'no', label: '今は断る', outcomes: [{ id: 'ok', w: 80, label: '「また今度」と言われた' }, { id: 'later', w: 20, label: '「工場ができたら」と名刺を置いていった', fx: (W) => { W.flags.wholesaleLead = true; } }] },
        { id: 'ask', label: '条件だけ聞いて断る', outcomes: [{ id: 'ok', w: 70, label: '掛けの期日と量の話を聞いた', fx: (W) => { W.flags.wholesaleLead = true; } }, { id: 'pushy', w: 30, label: '強く頼まれたが断った' }] },
      ] },
    { id: 'ev_spring', title: '春の商店会の売り出し', shelf: 'outside', kind: 'good', scope: [], fixed: true, once: true, when: (W) => W.events.some((e) => e.id === 'ev_spring' && e.m === W.m + 1 || e.id === 'ev_spring' && e.m === 4 && W.t === 0),
      talk: [['eigyo', '来月、商店会の売り出しの回覧が来ました。']], q: '準備は？',
      options: [
        { id: 'prep', label: '仕込みと人を増やして迎える', outcomes: [{ id: 'busy', w: 65, label: '行列ができた', cash: -15000, fx: (W, fx) => { fx.demandMul *= 1.06; } }, { id: 'rain', w: 35, label: '雨で人出は少なめ', cash: -15000 }] },
        { id: 'none', label: 'いつもどおり', outcomes: [{ id: 'ok', w: 60, label: '少し忙しかった' }, { id: 'short', w: 40, label: '品切れで帰った客がいた', fx: (W, fx) => { fx.Rd -= 0.03; } }] },
      ] },
    { id: 'ev_summer', title: '夏祭りの出店の誘い', shelf: 'outside', kind: 'good', scope: [], fixed: true, once: true, when: (W) => W.m === 7,
      talk: [['eigyo', '来月の夏祭りで、屋台を出しませんかと。出店料をもらう形です。']], q: '出店する？',
      options: [
        { id: 'go', label: '出店する（人を1日借りる）', outcomes: [{ id: 'good', w: 60, label: '屋台が大にぎわい。店の名前も広まった', cash: 60000, fx: (W, fx, s) => { s.A = (s.A || 0) + 0.5; } }, { id: 'tired', w: 40, label: 'にぎわったが、店のほうが手薄になった', cash: 40000, fx: (W, fx) => { fx.Rd -= 0.02; } }] },
        { id: 'no', label: '店に集中する', outcomes: [{ id: 'ok', w: 70, label: '祭りの帰りの客が来た', fx: (W, fx) => { fx.demandMul *= 1.03; } }, { id: 'quiet', w: 30, label: '祭りに人を取られた', fx: (W, fx) => { fx.demandMul *= 0.98; } }] },
      ] },
    { id: 'ev_year', title: '年末の売り出し', shelf: 'outside', kind: 'good', scope: [], fixed: true, once: true, when: (W) => W.m === 11,
      talk: [['eigyo', '年末の売り出し、今年も商店会でやるそうです。']], q: '参加する？',
      options: [
        { id: 'join', label: '参加する（チラシ代を分担）', outcomes: [{ id: 'busy', w: 60, label: '年末の客が増えた', cash: -20000, fx: (W, fx) => { fx.demandMul *= 1.05; } }, { id: 'flat', w: 40, label: 'ふだんと変わらなかった', cash: -20000 }] },
        { id: 'skip', label: '参加しない', outcomes: [{ id: 'ok', w: 70, label: 'いつもどおり' }, { id: 'cold', w: 30, label: '商店会で少し気まずい', fx: (W, fx) => { fx.Rd -= 0.01; } }] },
      ] },
    { id: 'good_kouji', title: '工事の人たちが全部食べた', shelf: 'outside', kind: 'good', scope: [], once: true, when: (W) => W.t >= 2, weight: () => 1.5,
      talk: [['piyo', '近くの工事の人たちが、スープがなくなるまで食べてくれたピヨ！ 明日の弁当20食も頼めるかって。']], q: '弁当は？',
      options: [
        { id: 'take', label: '受ける', outcomes: [{ id: 'good', w: 70, label: '喜ばれて、また来てくれた', cash: 16000, fx: (W, fx, s) => { s.L = (s.L || 0) + 1; } }, { id: 'rush', w: 30, label: '朝の仕込みが大変だった', cash: 16000, fx: (W, fx) => { fx.Rd -= 0.02; } }] },
        { id: 'no', label: '断る', outcomes: [{ id: 'ok', w: 70, label: '「また来るよ」' }, { id: 'none', w: 30, label: '工事が終わって来なくなった' }] },
      ] },
    { id: 'good_jouren', title: '常連さんが地元紙の記者を連れてきた', shelf: 'outside', kind: 'good', scope: [], once: true, when: (W) => me(W).L >= 3, weight: () => 1.5,
      talk: [['piyo', '常連の山本さんが、地元紙の記者さんを連れてきたピヨ！']], q: '記事はどの一杯で？',
      options: [
        { id: 'sign', label: '看板の一杯で', outcomes: [{ id: 'good', w: 70, label: '看板の一杯が載った', fx: (W, fx, s) => { fx.demandMul *= 1.04; fx.Rd += 0.05; } }, { id: 'small', w: 30, label: '記事は小さかった', fx: (W, fx) => { fx.demandMul *= 1.01; } }] },
        { id: 'limited', label: '限定の一杯で', outcomes: [{ id: 'good', w: 50, label: '限定が話題に', fx: (W, fx, s) => { s.bowl = SIM.bowl.apply(s.bowl, 'limited', () => 0.3, W.t); } }, { id: 'miss', w: 50, label: '限定は売り切れ、記事を見た客が帰った', fx: (W, fx) => { fx.Rd -= 0.03; } }] },
      ] },
    { id: 'bowl_limited', title: '夏の限定の一杯（8月）', shelf: 'bowl', kind: 'decision', scope: [], fixed: true, once: true, when: (W) => W.m === 8,
      talk: [['shacho', '夏の限定、冷やし中華でいこう！']], q: '限定は？',
      options: [
        { id: 'go', label: '出す（試作の材料3万円）', outcomes: [{ id: 'hit', w: 20, label: '大当たり。話題になった', fx: (W, fx, s) => { s.bowl = SIM.bowl.apply(s.bowl, 'limited', () => 0.1, W.t); } }, { id: 'mid', w: 50, label: 'そこそこ売れた', fx: (W, fx, s) => { s.bowl = SIM.bowl.apply(s.bowl, 'limited', () => 0.4, W.t); } }, { id: 'miss', w: 30, label: '外れ。材料が余った', cash: -15000, fx: (W, fx, s) => { s.bowl = SIM.bowl.apply(s.bowl, 'limited', () => 0.9, W.t); } }], cash: -30000 },
        { id: 'no', label: '出さない', outcomes: [{ id: 'ok', w: 70, label: 'いつもの一杯で夏を越した' }, { id: 'rival', w: 30, label: '近くの店の限定に客が流れた', fx: (W, fx) => { fx.demandMul *= 0.97; } }] },
      ] },
    // 家族の形の上限（c.8）：客数30人/日を越えた月は、体を壊す札が月3%（seed と月で決まる）
    { id: 'family_sick', title: '社長の家族が倒れた', shelf: 'people', kind: 'shock', scope: [], fixed: true, when: (W) => W.stores[0].parts === 0 && W.last && W.last.N > 30 && SIM.rng(W.seed * 7 + W.t * 131)() < C('familySickP'),
      talk: [['piyo', '毎日いっぱいのお客さんで、おかみさんが倒れちゃったピヨ…']], q: 'どうする？',
      options: [
        { id: 'close', label: '2週間休む', outcomes: [{ id: 'rest', w: 70, label: '休んで元気になった', fx: (W, fx) => { fx.demandMul *= 0.5; fx.Rd -= 0.05; } }, { id: 'long', w: 30, label: '長引いて3週間休んだ', fx: (W, fx) => { fx.demandMul *= 0.3; fx.Rd -= 0.08; } }] },
        { id: 'hire', label: '急いで人を雇う（その月だけ）', outcomes: [{ id: 'ok', w: 60, label: '人が見つかった', cash: -250000 }, { id: 'none', w: 40, label: '見つからず1週間休んだ', cash: -50000, fx: (W, fx) => { fx.demandMul *= 0.75; fx.Rd -= 0.05; } }] },
      ] },
  ];
  const byId = Object.fromEntries(deck.map((c) => [c.id, c]));
  // 月の山札：決まった月の札（fixed）は必ず、ほかは状態の重みで引く。最初の月の札は1枚（X28）、ふだんは1〜3枚
  function deal(W, rng) {
    const seen = W.cardsSeen || {};
    const ok = (c) => { try { return c.when(W) && !(c.once && seen[c.id]); } catch (e) { return false; } };
    const fixed = deck.filter((c) => c.fixed && ok(c)).map((c) => c.id);
    const want = W.t === 0 ? 1 : 1 + (rng() < 0.6 ? 1 : 0) + (rng() < 0.15 ? 1 : 0);
    const out = fixed.slice(0, Math.max(1, want));
    let pool = deck.filter((c) => !c.fixed && ok(c) && !out.includes(c.id));
    while (out.length < want && pool.length) {
      const ws = pool.map((c) => (c.weight ? c.weight(W) : 1)), tot = ws.reduce((a, b) => a + b, 0);
      let x = rng() * tot, k = 0;
      for (; k < pool.length - 1; k++) { if (x < ws[k]) break; x -= ws[k]; }
      out.push(pool[k].id); pool = pool.filter((_, j) => j !== k);
    }
    // 決まった札が多い月（4月など）は全部出す
    for (const id of fixed) if (!out.includes(id)) out.push(id);
    return out;
  }
  // 選んだ手の結果を W に返す（fx は月の需要と損益の一時の足し）
  function apply(W, card, optId, outId, fx, res, rng) {
    const o = card.options.find((x) => x.id === optId), oc = o.outcomes.find((x) => x.id === outId), s = W.stores[0];
    const cash = (typeof oc.cash === 'function' ? oc.cash(W) : oc.cash || 0) + (typeof o.cash === 'function' ? o.cash(W) : o.cash || 0);
    fx.cash += cash;
    if (oc.fx) oc.fx(W, fx, s, rng);
    (res.choices = res.choices || []).push({ card: card.id, option: optId, outcome: outId, cash });
  }
  SIM.cards = { deck, byId, deal, apply };
})(typeof window !== 'undefined' ? window : globalThis);
