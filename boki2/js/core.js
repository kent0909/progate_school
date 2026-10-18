// BOKI namespace: data registration. Loaded before every data file.
(function (g) {
  const B = (g.BOKI = g.BOKI || {});
  B.accounts = B.accounts || {};
  B.chapters = B.chapters || [];
  B.exams = B.exams || [];

  B.addAccounts = function (map) {
    for (const k in map) B.accounts[k] = map[k];
  };
  B.chapter = function (c) {
    B.chapters.push(c);
  };
  B.exam = function (x) {
    B.exams.push(x);
  };

  // 9 worlds = the player's career path through ミライ商事 and its factory.
  B.worlds = [
    { id: 'w1', name: '経理部デビュー', area: '本社 経理部', theme: '株式会社のしくみ', hue: 162, boss: { name: 'カブヌシ・ゴーレム', hp: 5 } },
    { id: 'w2', name: '商いの街', area: '営業部・倉庫', theme: '商品売買と収益認識・税金', hue: 28, boss: { name: 'ウリアゲ・ドラゴン', hp: 6 } },
    { id: 'w3', name: 'お金と債権の銀行', area: '財務部・取引銀行', theme: '預金・手形・債権・外貨', hue: 205, boss: { name: 'フワタリ・ファントム', hp: 6 } },
    { id: 'w4', name: '固定資産の工房', area: '設備管理課', theme: '固定資産・リース・無形資産', hue: 95, boss: { name: 'ゲンカショウキャク・タイタン', hp: 7 } },
    { id: 'w5', name: '投資と引当金の塔', area: '財務部・税理士事務所', theme: '有価証券・引当金・税効果', hue: 265, boss: { name: 'ゼイコウカ・ウィザード', hp: 7 } },
    { id: 'w6', name: '決算の城', area: '決算プロジェクト室', theme: '決算整理・財務諸表・本支店', hue: 350, boss: { name: 'ケッサン・デーモン', hp: 8 } },
    { id: 'w7', name: 'グループ連結島', area: '子会社 ミライ物流', theme: '連結会計', hue: 185, boss: { name: 'レンケツ・キメラ', hp: 8 } },
    { id: 'w8', name: 'モクモク工場', area: 'ミライ製作所 第1工場', theme: '工業簿記の基礎・個別原価計算', hue: 40, boss: { name: 'セイゾウカンセツ・マシン', hp: 7 } },
    { id: 'w9', name: '量産ライン', area: 'ミライ製作所 第2工場', theme: '総合原価・標準原価・CVP', hue: 220, boss: { name: 'ヒョウジュンゲンカ・キング', hp: 8 } },
  ];

  B.cast = {
    piyo: { name: 'ピヨ', role: '相棒' },
    senpai: { name: 'タカシ先輩', role: '経理部の先輩' },
    bucho: { name: 'サクラ部長', role: '経理部長' },
    shacho: { name: 'ミライ社長', role: '社長' },
    eigyo: { name: 'ハルカ', role: '営業部' },
    kojo: { name: 'ゴン工場長', role: '工場長' },
    ginko: { name: '田中さん', role: '銀行員' },
    kansa: { name: '森さん', role: '公認会計士' },
    zeirishi: { name: '大川先生', role: '税理士' },
  };

  // Career titles by player level.
  B.titles = [
    [1, '見習い経理'], [4, '経理部員'], [8, '主任'], [13, '係長'],
    [19, '課長'], [26, '経理部長'], [34, 'CFO'], [44, '伝説の簿記マスター'],
  ];
})(typeof window !== 'undefined' ? window : globalThis);
