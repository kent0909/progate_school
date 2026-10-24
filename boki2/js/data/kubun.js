// 決算書の区分と表示科目の表（ピヨ商店の区分の決算書・札の速さ・札で見る、旧版の仕分けラッシュで共有する）
// pl：損益計算書のどの区分か。bs：貸借対照表のどの区分か。show：決算書に書く名前（勘定科目と違うもの）
// byContext：相手で区分が変わる札（貸倒引当金繰入は、売掛金の分なら販管費、貸付金の分なら営業外費用）
(function () {
  const B = typeof BOKI !== 'undefined' ? BOKI : (window.BOKI = window.BOKI || {});
  const PL_BINS = ['売上高', '売上原価', '販売費及び一般管理費', '営業外収益', '営業外費用', '特別利益', '特別損失', '法人税等'];
  const pl = {};
  const put = (bin, list) => list.forEach((a) => { pl[a] = bin; });
  put('売上高', ['売上', '役務収益']);
  put('売上原価', ['仕入', '売上原価', '役務原価', '期首商品棚卸高', '当期商品仕入高', '商品評価損', '原価差異']);
  put('販売費及び一般管理費', ['給料', '広告宣伝費', '減価償却費', '貸倒引当金繰入', '貸倒損失', '旅費交通費', '支払家賃', '退職給付費用', 'のれん償却', '研究開発費', 'ソフトウェア償却', '租税公課', '賞与引当金繰入', '修繕費', '水道光熱費', '支払手数料', '通信費', '消耗品費', '保険料', '発送費']);
  put('営業外収益', ['受取利息', '受取配当金', '有価証券利息', '有価証券評価益', '仕入割引', '為替差益', '有価証券売却益', '償却債権取立益', '雑益']);
  put('営業外費用', ['支払利息', '手形売却損', '有価証券評価損', '有価証券売却損', '為替差損', '創立費', '株式交付費', '電子記録債権売却損', '売掛債権売却損', '雑損']);
  put('特別利益', ['固定資産売却益', '保険差益', '国庫補助金受贈益', '投資有価証券売却益', '負ののれん発生益']);
  put('特別損失', ['固定資産売却損', '固定資産除却損', '火災損失', '固定資産圧縮損', '投資有価証券売却損']);
  put('法人税等', ['法人税等']);

  const BS_BINS = ['流動資産', '固定資産', '流動負債', '固定負債', '純資産'];
  const bs = {};
  const putB = (bin, list) => list.forEach((a) => { bs[a] = bin; });
  putB('固定資産', ['車両運搬具', '機械装置', '建設仮勘定', '備品', '建物', '土地', '車両運搬具減価償却累計額', '減価償却累計額', '機械装置減価償却累計額', '建物減価償却累計額', '備品減価償却累計額', 'ソフトウェア', 'のれん', '投資有価証券', '長期貸付金', '長期前払費用']);
  putB('固定負債', ['長期借入金', '退職給付引当金', 'リース債務', '長期未払金']);
  // ほかは棚（資産・負債・純資産）で決まる：資産→流動資産、負債→流動負債、純資産→純資産（ピヨ商店の借入金は1年以内に返す約束）

  const show = { 繰越商品: '商品', 前払家賃: '前払費用', 未払賃金: '未払費用', 仕入: '売上原価', 売上: '売上高', 役務収益: '売上高' };
  const byContext = { 貸倒引当金繰入: [['売掛金', '販売費及び一般管理費'], ['貸付金', '営業外費用']] };

  // 札の区分。cat は勘定科目マスタの棚（資産・負債…）
  const plOf = (a) => pl[a] || ((B.accounts || {})[a] && B.accounts[a].cat === '費用' ? '販売費及び一般管理費' : (B.accounts || {})[a] && B.accounts[a].cat === '収益' ? '営業外収益' : null);
  const bsOf = (a) => {
    if (bs[a]) return bs[a];
    const c = ((B.accounts || {})[a] || {}).cat;
    return c === '資産' ? '流動資産' : c === '負債' ? '流動負債' : c === '純資産' ? '純資産' : a === '貸倒引当金' ? '流動資産' : null;
  };
  // ---------- 年度表（docs/DESIGN-ROUND2.md 6.1 の4・7.5、決定12）：年度で変わる札の名前と、その年度に出してはいけない語を1か所に ----------
  // 台本（year2.js の家賃の札など）・validate（参考書の語）・engine（会社の書き方）がここを読む
  const yearly = {
    2026: { label: '2026年度（2027年3月までの試験）', rent: '支払家賃', prepaidRent: '前払家賃', lease: ['リース資産', 'リース債務'], tegata: true,
      forbid: /使用権資産|リース負債/, forbidWhy: '2026年度の試験に新リースの語（使用権資産・リース負債）は出ない' },
    2027: { label: '2027年度（2027年4月からの試験）', rent: '支払リース料', prepaidRent: '前払費用', lease: ['使用権資産', 'リース負債'], tegata: false,
      forbid: /約束手形|支払手形|受取手形|リース資産|リース債務|ファイナンス・リース|オペレーティング・リース/, forbidWhy: '2027年度の試験に手形・旧リースの語は出ない' },
  };
  // 状態 S から年度（S.mode。決めていなければ今日の日付）
  const yearOf = (S) => ((S && S.mode) || (Date.now() < Date.parse('2027-04-01T00:00:00+09:00') ? '2026' : '2027'));
  const Y = (S) => yearly[yearOf(S)] || yearly[2027];

  // ---------- 書き方の規範（docs/DESIGN-ROUND2.md 6章、決定11）：正＝試験の書き方、alt＝会社の書き方（通るが橋渡しの一言） ----------
  // alt は台本に手で書かず、この表から機械的に作る（altsOf）。from の札を to に置きかえた仕訳が alt。when で当てる書類を絞る
  const ACCUM = /^(機械装置|備品|建物|車両運搬具)減価償却累計額$/;
  const examForm = [
    { id: 'gaichu', from: '仕掛品', to: '外注加工賃', when: (ev) => ev.kind === 'outsource',
      bridge: () => '外注加工賃の箱を通しても正しい（会社では月末に仕掛品へ運ぶ2段にすることもある）。試験では、直接経費の外注加工賃は「仕掛品／買掛金」の1行で書く。帳簿は1行の形で書いた。' },
    { id: 'accum', from: ACCUM, to: '減価償却累計額',
      bridge: () => '「減価償却累計額」の1つの札でも正しい。試験では、資産の名前を前につけた長い札で書くことが多い。帳簿は長い名前で書いた。' },
    { id: 'prepaid', from: '前払家賃', to: '前払費用', when: (ev) => ev.kind === 'prepaid',
      bridge: () => '前払費用でも正しい。家賃と分かる札として、帳簿は「前払家賃」で書いた。試験では、問題が示す札の名前に合わせる。' },
    { id: 'prepaid27', from: '前払費用', to: '前払家賃', when: (ev) => ev.kind === 'prepaid',
      bridge: () => '前払家賃でも正しい。2027年度の試験では家賃を支払リース料で書くので、前払いの分は「前払費用」と書くのが安全。帳簿は前払費用で書いた。' },
    { id: 'eigai', from: '営業外電子記録債務', to: '電子記録債務',
      bridge: () => '電子記録債務でも通る。試験では、商品の代金でないもの（修理代など）は「営業外電子記録債務」と分ける（未払金と買掛金の区別と同じ）。帳簿は分けて書いた。' },
  ];
  const hit = (from, a) => (from instanceof RegExp ? from.test(a) : from === a);
  // truth（正の仕訳）と書類 ev から、会社の書き方の仕訳の一覧 [{ entry, note, form }]。from が無い・置きかえ先がもう同じ側にあるものは作らない
  const altsOf = (truth, ev) => {
    if (!truth || !truth.dr) return [];
    const out = [];
    for (const r of examForm) {
      if (r.when && !r.when(ev || {})) continue;
      const sides = ['dr', 'cr'];
      if (!sides.some((sd) => truth[sd].some(([a]) => hit(r.from, a)))) continue;
      if (sides.some((sd) => truth[sd].some(([a]) => a === r.to))) continue;
      const entry = { dr: truth.dr.map(([a, v]) => [hit(r.from, a) ? r.to : a, v]), cr: truth.cr.map(([a, v]) => [hit(r.from, a) ? r.to : a, v]) };
      out.push({ entry, note: r.bridge(), form: r.id });
    }
    return out;
  };
  // 帳簿は変えず、決算書の表示だけを組み替える（PR #2 6386994295）。
  const reclassifyBS=(balances,transfers)=>{const out={...balances};for(const {from,to,amount}of transfers){out[from]=(out[from]||0)-amount;out[to]=(out[to]||0)+amount;}return out;};
  B.kubun = { reclassifyBS, PL_BINS, BS_BINS, pl, bs, show, byContext, plOf, bsOf, yearly, yearOf, Y, examForm, altsOf };
})();
