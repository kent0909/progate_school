#!/usr/bin/env node
// BIZ-RAMEN（第3版）の件数・割合・合計を数えるスクリプト（QUALITY 6.2-2：頭の中で数えた数は書かない）。
// Usage: node boki2/docs/analysis/ramen-biz-counts.js
// データは読了ノート（boki2/research/notes/web/ramen/）と原文から書き写したもの。分類は書き手（BIZ-RAMEN の担当）の判断で、
// 1件を1つの主な理由に振っている。分類を変えたいときはここを直して走らせ直す。
'use strict';

// ---------- 1. 新しく足した資料（文書単位。複数ページの記事は1本と数える） ----------
const sources = [
  ['一次資料・統計', 'r5-rmn-gdfreak-chukasoba1', '家計調査の中華そば（外食）の月別'],
  ['一次資料・統計', 'r5-rmn-ndl-sru-subject', '国立国会図書館 件名「ラーメン」の件数'],
  ['研究', 'r5-rmn-paper-sophia2010', '卒業論文 ラーメン二郎 行列の理由'],
  ['研究', 'r5-rmn-paper-kitakata-psm', '福島県 喜多方ラーメンの価格感度'],
  ['研究', 'r5-rmn-paper-tachikawa-b', '学芸地理 立川のラーメン店の集積'],
  ['研究', 'r5-rmn-book-okada-chikuma', '本：ラーメンの誕生（書誌・目次）'],
  ['研究', 'r5-rmn-book-hayamizu-kino', '本：ラーメンと愛国（書誌・目次・感想）'],
  ['研究', 'r5-rmn-book-gotochi-kino', '本：ご当地ラーメンの地域ブランド戦略（書誌・目次）'],
  ['研究', 'r5-rmn-book-solt-ucpress', '本：The Untold History of Ramen（出版社の紹介）'],
  ['研究', 'r5-rmn-book-jiro-kino', '本：ラーメン二郎にまなぶ経営学（書誌・目次）'],
  ['作り手の話', 'r5-rmn-pres-ishido', '石動龍の本の抜粋：原価と回転'],
  ['作り手の話', 'r5-rmn-pres-ishido1', '石動龍の本の抜粋：後発の真似'],
  ['作り手の話', 'r5-rmn-pres-ishido-tsuburenikui', '石動龍：系統ごとの潰れにくさ'],
  ['作り手の話', 'r5-rmn-pres-ishido-topping', '石動龍：自分の店の2年'],
  ['作り手の話', 'r5-rmn-pres-taishoken0', '北尾トロの本の抜粋：大勝軒の修業（前編）'],
  ['作り手の話', 'r5-rmn-pres-taishoken1', '北尾トロの本の抜粋：大勝軒の修業（後編）'],
  ['作り手の話', 'r5-rmn-pres-rokurinsha', 'つけめん さなだ 店主'],
  ['作り手の話', 'r5-rmn-pres-fukuoka-tonkotsu', '福岡の豚骨離れ（博多一双 店主ほか）'],
  ['作り手の話', 'r5-rmn-maker-taisei', '製麺機メーカーの発表'],
  ['作り手の話', 'r5-rmn-pres-tenichi1', '井手隊長の本の抜粋：天下一品の本部'],
  ['作り手の話', 'r5-rmn-pres-tenichi2', '井手隊長の本の抜粋：ラーメンビジネス（麺）'],
  ['事例', 'r5-rmn-itm-dosanko', 'どさん子の盛衰（ITmedia 5ページ）'],
  ['事例', 'r5-rmn-nippon-dosanko', 'どさん子の海外・宅麺'],
  ['事例', 'r5-rmn-jprime-nandenkanden', 'なんでんかんでんの盛衰（4ページ）'],
  ['事例', 'r5-rmn-case-jcast-metro', '神戸の食中毒'],
  ['事例', 'r5-rmn-case-batonz24058', '個人店の売却案件（三重）'],
  ['事例', 'r5-rmn-case-batonz31517', '個人店の売却案件（静岡）'],
  ['事例', 'r5-rmn-goods-tenkaippin', '天下一品のコラボTシャツ'],
  ['利用者の声', 'r5-rmn-voice-mynavi2020', 'マイナビ 好きな種類と理由'],
  ['利用者の声', 'r5-rmn-voice-nexer-ichiran', 'NEXER×一蘭 おうちラーメン'],
  ['利用者の声', 'r5-rmn-voice-navit', 'ナビット 1000人'],
  ['利用者の声', 'r5-rmn-voice-maruha2018', 'マルハニチロ 1000人'],
  ['実務者・業界', 'r5-rmn-cost-canaeru', 'USEN 開業支援 1杯の原価'],
  ['実務者・業界', 'r5-rmn-cost-mfbiz', 'マネーフォワード 売上と原価の目安'],
  ['実務者・業界', 'r5-rmn-cost-moneypost', 'マネーポスト 濃縮スープ（2ページ）'],
  ['反対意見', 'r5-rmn-health-chiba-matsudo', '保健所の減塩のちらし'],
];
// 第4版で新しく取った資料（文書単位。マネーポストの原価の記事は2ページで1本）
const sourcesV4 = [
  ['実務者・業界', 'r7-rmn-moneypost-genka', 'マネーポスト 飲食店の原価 ラーメン編（魚介の店の1杯の内訳）'],
  ['実務者・業界', 'r7-rmn-moneypost-tsukemen', 'マネーポスト つけ麺・油そばの大盛り無料'],
  ['利用者の声', 'r7-rmn-jnet21-cons-ramen2', 'J-Net21 ラーメン店（2023年版）消費者1,000人'],
  ['利用者の声', 'r7-rmn-jnet21-cons-ramen', 'J-Net21 ラーメン店（2013年版）'],
  ['研究', 'r7-rmn-ucpress-solt', 'UC Press Solt の本の書誌・目次'],
];
const byType = {};
for (const [t] of sources) byType[t] = (byType[t] || 0) + 1;
console.log('## 1. 新しく足した資料（文書単位）');
console.log(`合計 ${sources.length} 本、種類 ${Object.keys(byType).length}`);
for (const [t, n] of Object.entries(byType)) console.log(`- ${t}: ${n} 本（${(n / sources.length * 100).toFixed(1)}%）`);
console.log(`第4版で足した資料: ${sourcesV4.length} 本（` + sourcesV4.map((x) => x[2]).join('／') + '）');
const bookBody = ['石動龍『会計の基本と儲け方はラーメン屋が教えてくれる』', '北尾トロ（大勝軒・田内川真介の聞き書き）', '井手隊長『天下一品 無限の熱狂が生まれる仕掛け』', '井手隊長『ラーメンビジネス』'];
console.log(`本の本文の抜粋（出版社のサイトの再編集記事）を読んだ本: ${bookBody.length} 冊（どれも一部）`);
console.log(`書誌・目次・紹介・感想だけを読んだ本: ${sources.filter(([, d]) => d.startsWith('r5-rmn-book-')).length} 冊`);

// ---------- 2. 利用者の声（自由回答）の分類 ----------
const CAT = {
  A: 'あっさり・さっぱり・昔ながら', B: 'こってり・コク・旨み・パンチ・辛さ', C: '育ち・地元・思い出', D: '店の腕が分かる',
  E: '栄養・体・健康', F: '組み合わせ・具・食べる場面', G: '苦手・不満', H: '手軽さ・安さ・量', I: '特別感（遠くの名店・ご当地・外食の質）',
  J: '話題・贈り物', K: '特定の店がお気に入り', L: '定番・特に理由なし・麺そのもの', M: '動画・メディアで知った', N: '分類への異議',
};
// マイナビ（記事に載った順。しょうゆ13・みそ11・とんこつ8・塩8・魚介4・ない3・その他6）
const mynavi = 'ACAFALLAAFFAL' + 'BCCEFCEEFBD' + 'BCBBGFCC' + 'DAEFDCDC' + 'BAAB' + 'GGN' + 'BBEEBG';
// NEXER×一蘭（家での理由9・お取り寄せの理由9・贈り物の理由5、記事の順）
const nexer = 'HHLHLHIKH' + 'IIIIIMIII' + 'JJIJJ';
// ナビット（おすすめの店の自由回答の抜粋3）
const navit = 'CKK';
// J-Net21 ラーメン店（2023年版）の利用者1,000人のアンケートで記事が載せた自由回答19件（記事の順）。第4版で足した「店の利用者の声」
// O＝店の味は家で出せない／P＝衛生・感染の不安／Q＝店が恋しい・安心／R＝どうしても食べたい／S＝健康の心配／T＝値上がり・物価高
const jnet = 'OO' + 'PPPP' + 'QQQP' + 'RRRR' + 'SSSTT';
const count = (s) => { const c = {}; for (const ch of s) c[ch] = (c[ch] || 0) + 1; return c; };
const all = mynavi + nexer + navit;
const CAT2 = { O: '店の味は家で出せない', P: '衛生・感染の不安（行かなくても困らない を含む）', Q: '店が恋しい・食券と仕切りで安心', R: 'どうしても食べたい・確かめたい', S: '健康（塩分・カロリー・太る）', T: '値上がり・物価高' };
const cm = count(mynavi), cn = count(nexer), cv = count(navit), ca = count(all);
console.log('\n## 2. 利用者の声（自由回答）の分類');
console.log(`マイナビ ${mynavi.length} 件 + NEXER ${nexer.length} 件 + ナビット ${navit.length} 件 = ${all.length} 件`);
console.log('| 分類 | マイナビ | NEXER | ナビット | 計 |\n|---|---|---|---|---|');
for (const k of Object.keys(CAT)) if (ca[k]) console.log(`| ${CAT[k]} | ${cm[k] || 0} | ${cn[k] || 0} | ${cv[k] || 0} | ${ca[k]} |`);
{ const cj = count(jnet); console.log(`\nJ-Net21 2023（ラーメン店の利用者・1,000人の調査の記事に載った自由回答）${jnet.length} 件`); for (const k of Object.keys(CAT2)) console.log(`- ${CAT2[k]}: ${cj[k] || 0}`); console.log(`店の側に向いた不満・不安（P・S・T）${(cj.P || 0) + (cj.S || 0) + (cj.T || 0)} 件、店を求める声（O・Q・R）${(cj.O || 0) + (cj.Q || 0) + (cj.R || 0)} 件。79件と合わせて ${all.length + jnet.length} 件、うち店の利用者の声は ${jnet.length} 件`); }
const praise = all.length - (ca.G || 0) - (ca.N || 0);
console.log(`褒め・好きの理由 ${praise} 件、苦手・不満 ${ca.G || 0} 件、異議 ${ca.N || 0} 件`);

// ---------- 3. 成功と失敗の事例（第3版：区分の列を足した。論証の検査 R09・R37、事実の判定 E1・N1・N2・N6・R6） ----------
// [id, 成否, 上場か, 名前, 年, 判断→結果, 出典, 区分]
// 区分：確か＝原文から成否が言える／原因の帰属なし＝結果はあるが原因を原文が言わない／切り取り＝伸びている会社の一部／
//       混在＝成否が混ざる・推定／ラーメン以外＝ラーメン店に限らない／結果なし＝結果が書かれていない／転換＝失敗→成功
const cases = [
  ['F1', '失敗', '上場', '山岡家', '2010〜2012', '2年で店を34.3%増やす→営業利益率5.1%→0.2%（会社の吹き出しは「急速な出店によるコスト増と売上停滞」）', 'r4-ramen-yamaokaya-setsumei2603', '確か'],
  ['F2', '失敗', '上場', '幸楽苑', '2023〜2025', '他業態（焼肉ライク・からやま・赤から・自社の家系らーめん等）の店→2025年9月末に餃子の味よし1店を残して0（撤退の理由・損益は資料にない）', 'r4-ramen-kourakuen-setsumei2511', '原因の帰属なし'],
  ['F3', '失敗', '上場', '幸楽苑', '40〜53期', '営業利益率6.8〜5.7%→47期0.4%→48期損失→49期4.0%に戻る→51〜53期に大きな損失', 'r4-ramen-kourakuen-setsumei2511', '確か'],
  ['F4', '失敗', '上場', '幸楽苑', '2022〜2023', '客単価の上昇（12か月移動平均で約112%）と客数の減少（約94%）が同じ時期（値上げの語は資料にない。同じ時期に他の麺チェーンの客数は100%超）', 'r4-ramen-kourakuen-setsumei2511', '原因の帰属なし'],
  ['F5', '失敗', '上場', '一風堂（海外）', '2025', '海外で12店を閉店（同じ年に16店を出店、純増4）、来店客数が減り利益率が悪化', 'r4-ramen-chikara-tanshin2026', '切り取り'],
  ['F6', '失敗', '上場', '一風堂', '2024〜2026（3月期）', '国内は約2年半値上げせず→連結営業利益率10.4%→8.2%→6.4%（落ちた利益の72%は値上げした海外）', 'r4-ramen-chikara-tanshin2026', '混在'],
  ['F7', '失敗', '上場', 'ギフト', '2024・2025（10月期）', '損益が続けてマイナスの店→減損（8+2店、4+1店）。同じ年に直営は52店の純増', 'r4-ramen-gift-yuho2025', '切り取り'],
  ['F8', '失敗', '非上場', '福岡市の公募屋台（第2回）', '2019〜2025', '公募で開業→9軒が4軒に（屋台はラーメン以外を含む・コロナの時期。第4回は13→13）', 'r4-ramen-fukuoka-yatai-5th', 'ラーメン以外'],
  ['F9', '失敗', '上場（当時）', 'どさん子（加盟店）', '1980〜2000年代', 'FCで急拡大→模倣・陳腐化（決定的な原因は豚骨への流れ）・後継者難で閉店', 'r5-rmn-itm-dosanko2', '確か'],
  ['F10', '失敗', '上場（当時）', 'どさん子（本部）', '1990〜2012', '多角化（パン・カフェ）→赤字・虚偽記載→上場廃止', 'r5-rmn-itm-dosanko4', '確か'],
  ['F11', '失敗', '上場（当時）', 'どさん子（米国）', '1970年代〜1990', 'ニューヨークに早く出る→11店を構えたが撤退', 'r5-rmn-nippon-dosanko', '確か'],
  ['F12', '失敗', '非上場', 'なんでんかんでん 本店', '〜2012', '車で来る客の多い環七の立地→取り締まりで客が減り閉店、移転もにおいで断られる', 'r5-rmn-jprime-nandenkanden-p4', '確か'],
  ['F13', '失敗', '非上場', 'なんでんかんでん FC', '〜2015', 'FCで各地に出す→軌道に乗らず全店閉店', 'r5-rmn-jprime-nandenkanden-p4', '確か'],
  ['F14', '失敗', '非上場', 'ドラゴンラーメン（八戸）', '2020〜2022', '昼だけ・兼業の店。麺・光熱費の上昇で利幅が減る→2年で閉店（閉店の理由の続きは会員限定）', 'r5-rmn-pres-ishido-topping', '原因の帰属なし'],
  ['F15', '失敗', '非上場', 'METRO RAMEN（神戸）', '2025', '低温の鶏チャーシュー→食中毒・営業停止3日', 'r5-rmn-case-jcast-metro', '確か'],
  ['F16', '失敗', '非上場', '静岡のラーメン店（売却案件）', '2022〜2023', '開業1年たたずに売りに出す。原文は「お客様も定着」とも書く', 'r5-rmn-case-batonz31517', '混在'],
  ['F17', '失敗', '非上場', 'ブロスアップ（仙台）', '2024', 'コロナ禍の投資の失敗と原材料高→民事再生、負債約2億6,000万円', 'r4-ramen-tsr-2024', '確か'],
  ['F18', '失敗', '非上場', '立川の店主（元は西麻布）', '〜2022', '西麻布で失敗→立川に移って成功→西麻布に支店', 'r5-rmn-paper-tachikawa-b', '転換'],
  ['F19', '失敗', '非上場', 'Ｄ－ｖｉｓｉｏｎ', '2026', '食材価格の高騰と同業との競争激化で販売不振→破産', 'r4-ramen-tdb-tosan26q3', '確か'],
  ['S1', '成功', '上場', '山岡家', '2023〜2026', '既存店の需要の急増（客数115.8%）で売上2.3倍・営業利益率10.9%。出店は計画未達（10店計画→8店）。原因は会社の挙げる7つ＋コロナ後の戻り', 'r4-ramen-yamaokaya-setsumei2603', '原因の帰属なし'],
  ['S2', '成功', '上場', 'ギフト（元祖油堂）', '2025', 'スープの要らない油そば→1年で15店、都心23区に出られた', 'r4-ramen-gift-yuho2025', '確か'],
  ['S3', '成功', '上場', '幸楽苑', '2024〜2025', '不採算店の整理・改装・営業時間延長・人の確保→上期の営業利益率5.2%', 'r4-ramen-kourakuen-setsumei2511', '確か'],
  ['S4', '成功', '上場（当時）', 'どさん子（初期）', '1967〜1977', '東京に味噌の専門店がない所にFCで出す→10年で1000店', 'r5-rmn-itm-dosanko1', '確か'],
  ['S5', '成功', '非上場', 'ラーメン二郎', '1968〜2010', '大学の近く・量と達成感・のれん分け→直系35店ほとんどで行列', 'r5-rmn-paper-sophia2010', '確か'],
  ['S6', '成功', '非上場', 'なんでんかんでん（開業期）', '1987〜', '赤字2年→雑誌に売り込み→1日1200杯（雑誌の影響力が高かった時代）', 'r5-rmn-jprime-nandenkanden-p3', '確か'],
  ['S7', '成功', '非上場', 'つけめん さなだ', '2014〜2024', '六厘舎の初代店長が独立→口コミの点数3.74', 'r5-rmn-pres-rokurinsha', '確か'],
  ['S8', '成功', '非上場', '博多一双', '〜2024', '呼び戻しの豚骨で差別化→3店、連日行列', 'r5-rmn-pres-fukuoka-tonkotsu-p2', '確か'],
  ['S9', '成功', '非上場', '宅麺', '2010〜2015', '有名店の冷凍の通販（買い取り制）→シンガポールにライセンスの店', 'r5-rmn-nippon-dosanko', '確か'],
  ['S10', '成功', '非上場', '天下一品', '近年', 'FCの味と見た目を本部が統一し直す（結果の数字はない）', 'r5-rmn-pres-tenichi1-p2', '結果なし'],
];
const fail = cases.filter((c) => c[1] === '失敗'), succ = cases.filter((c) => c[1] === '成功');
const nonListed = cases.filter((c) => c[2] === '非上場');
console.log('\n## 3. 事例（区分つき）');
console.log(`表の行：失敗 ${fail.length} 件・成功 ${succ.length} 件（計 ${cases.length}）。非上場 ${nonListed.length} 件`);
const KUBUN = ['確か', '原因の帰属なし', '切り取り', '混在', 'ラーメン以外', '結果なし', '転換'];
console.log('| 区分 | 失敗 | 成功 |\n|---|---|---|');
for (const k of KUBUN) console.log(`| ${k} | ${fail.filter((c) => c[7] === k).length} | ${succ.filter((c) => c[7] === k).length} |`);
const cf = fail.filter((c) => c[7] === '確か'), cs = succ.filter((c) => c[7] === '確か');
console.log(`区分「確か」だけ：失敗 ${cf.length}・成功 ${cs.length}。うち非上場 失敗 ${cf.filter((c) => c[2] === '非上場').length}・成功 ${cs.filter((c) => c[2] === '非上場').length}`);
const indep = ['r5-rmn-itm-dosanko2', 'r5-rmn-itm-dosanko4', 'r5-rmn-nippon-dosanko', 'r5-rmn-jprime-nandenkanden-p4', 'r5-rmn-case-jcast-metro', 'r4-ramen-tsr-2024', 'r4-ramen-tdb-tosan26q3'];
console.log(`失敗のうち会社自身の開示でない資料（報道・調査会社）：${fail.filter((c) => indep.includes(c[6])).length} 件（${fail.filter((c) => indep.includes(c[6])).map((c) => c[0]).join('・')}）`);
const firms = (arr) => new Set(arr.map((c) => c[3].replace(/（.*?）| 本店| FC/g, '')));
const ff = firms(fail), fs2 = firms(succ);
console.log(`会社・店：失敗側 ${ff.size}・成功側 ${fs2.size}・両側に出る ${[...ff].filter((n) => fs2.has(n)).length}（${[...ff].filter((n) => fs2.has(n)).join('・')}）`);
console.log(`一風堂の海外：出店 ${2 + 2 + 2 + 2 + 1 + 1 + 1 + 2 + 1 + 1 + 1}（シンガポール2・豪2・米2・台湾2・英1・インドネシア1・スペイン1・タイ2・中国1・フィリピン1・ベトナム1）、閉店 ${2 + 1 + 1 + 2 + 2 + 2 + 1 + 1}（台湾2・米1・インドネシア1・香港2・中国2・タイ2・マレーシア1・ミャンマー1）、純増 ${16 - 12}`);

// ---------- 4. 中華そば（外食）の月別（家計調査・二人以上の世帯、GD Freak! の表から） ----------
const months = { // 2023, 2024, 2025（2025年12月はまだない）
  1: [665, 731, 772], 2: [553, 646, 691], 3: [637, 738, 840], 4: [603, 646, 760], 5: [702, 725, 836], 6: [594, 673, 721],
  7: [649, 704, 730], 8: [757, 877, 1027], 9: [650, 713, 811], 10: [686, 742, 834], 11: [727, 751, 891], 12: [657, 717, null],
};
console.log('\n## 4. 中華そば（外食）の月別の指数（各年の平均=100、2023・2024年の2年の平均。2025年は12月がないので外す）');
const yearAvg = (i) => Object.values(months).reduce((s, v) => s + v[i], 0) / 12;
const a23 = yearAvg(0), a24 = yearAvg(1);
console.log(`2023年の月平均 ${a23.toFixed(1)} 円、2024年の月平均 ${a24.toFixed(1)} 円`);
for (const [m, v] of Object.entries(months)) {
  const idx = ((v[0] / a23 + v[1] / a24) / 2) * 100;
  console.log(`- ${m}月: ${idx.toFixed(0)}（2023年 ${v[0]}、2024年 ${v[1]}${v[2] ? `、2025年 ${v[2]}` : ''}）`);
}

// ---------- 5. 式で出した数 ----------
console.log('\n## 5. 式');
console.log(`二郎の1日の処理の上限（卒論の前提）: 15席 × (60分 ÷ 20分) × 8時間 = ${15 * (60 / 20) * 8} 人`);
const mach = [1688000, 2475000], diff = 30;
for (const d of [100, 40]) for (const p of mach) console.log(`製麺機 ${p.toLocaleString()}円 ÷ (1玉${diff}円 × 1日${d}玉 × 300日) = ${(p / (diff * d * 300)).toFixed(1)} 年【推論：電気代・人の時間・置き場所を入れない】`);
console.log(`濃縮スープの1杯: 4500円 ÷ 300杯 = ${4500 / 300} 円。豚骨を店で炊いた1杯の100〜150円との比は ${(100 / 15).toFixed(1)}〜${(150 / 15).toFixed(1)} 倍`);
console.log(`USEN の1杯の原価: 醤油 ${12.5 + 50 + 60 + 65}（タレ10〜15の中央12.5+スープ50+麺60+具65。記事は185） 豚骨 ${12.5 + 100 + 20 + 55}（記事は215） 味噌 ${12.5 + 120 + 60 + 80}（記事は270）`);
console.log(`石動龍の1日40杯の個人店: 1000円×40杯×25日 = ${1000 * 40 * 25} 円/月、残り ${1000000 - 300000 - 100000 - 400000} 円、税・保険3万と返済5万を引いて ${1000000 - 300000 - 100000 - 400000 - 30000 - 50000} 円`);
console.log(`山岡家 2023→2026年1月期: 店 179→195（${((195 / 179 - 1) * 100).toFixed(1)}%増）、売上 18,676→43,000百万円（${(43000 / 18676).toFixed(2)}倍）`);
console.log(`山岡家 2010→2012年1月期: 店 102→137（${((137 / 102 - 1) * 100).toFixed(1)}%増）、売上 7,223→8,712百万円（${((8712 / 7223 - 1) * 100).toFixed(1)}%増）`);
console.log(`福岡の公募屋台（開始時→2025年3月）: 23→18, 9→4, 5→4, 13→13。残った割合 ${[[23, 18], [9, 4], [5, 4], [13, 13]].map(([a, b]) => (b / a * 100).toFixed(0) + '%').join('・')}、計 ${23 + 9 + 5 + 13}→${18 + 4 + 4 + 13}`);
console.log(`立川の集合施設の店の割合: 89 ÷ 142 = ${(89 / 142 * 100).toFixed(1)}%`);
console.log(`NEXER のお取り寄せ: 経験 11.4% + 関心 22.8% = ${(11.4 + 22.8).toFixed(1)}%`);
console.log(`ナビット: 好き 621 + どちらかといえば好き 318 = ${621 + 318} 人（1000人中）`);
console.log(`二郎好きの理由（卒論の表、N=539）: ${325 + 91 + 83 + 14 + 13 + 12 + 3} 件の合計`);
console.log('\n## 6. 前の版の比率の検算');
console.log(`一風堂の売上原価率: 11,060,288 ÷ 36,261,804 = ${(11060288 / 36261804 * 100).toFixed(1)}%（千円、2026年3月期）`);
console.log(`ギフトの売上原価率: 11,922,753 ÷ 35,878,100 = ${(11922753 / 35878100 * 100).toFixed(1)}%（千円、2025年10月期、連結）`);
console.log(`黒字ラーメン店60社（TKC）の人件費の比率: 3,882 ÷ 9,388 = ${(3882 / 9388 * 100).toFixed(1)}%、その他の固定費 1,683 ÷ 9,388 = ${(1683 / 9388 * 100).toFixed(1)}%`);

// ---------- 7. 製麺機の回収（人の時間を入れる。論証の検査 R08・R59） ----------
// 機械の値段・1玉約30円・年間最大90万円は r5-rmn-maker-taisei。人の時間と時給は資料にない【仮定】（検査役と同じ幅にそろえた）
console.log('\n## 7. 製麺機の回収年数（人の時間＝1日の製麺・掃除の時間×時給を引く。300日営業）');
const machines = [1688000, 2475000];
console.log(`メーカーの「年間最大90万円」÷ 30円 ÷ 300日 = 1日 ${Math.round(900000 / 30 / 300)} 玉。30円の差は「最大」側の前提`);
console.log('| 1日の玉数 | 製麺の時間/日 | 時給 | 年の差し引き(円) | 回収 168.8万円 | 回収 247.5万円 |\n|---|---|---|---|---|---|');
for (const d of [40, 100, 200]) for (const h of [0, 0.5, 1, 2]) for (const w of (h === 0 ? [0] : [1100, 1300])) {
  const net = 30 * d * 300 - h * w * 300;
  const y = machines.map((p) => (net > 0 ? (p / net).toFixed(1) + '年' : '回収しない'));
  console.log(`| ${d} | ${h} | ${w} | ${net.toLocaleString()} | ${y[0]} | ${y[1]} |`);
}
const beCups = (h, w) => (h * w) / 30; // 人の時間の費用を30円の差で埋める玉数
console.log(`人の時間を埋めるだけで要る玉数：0.5時間×1,100円 ${beCups(0.5, 1100).toFixed(0)} 玉、1時間×1,100円 ${beCups(1, 1100).toFixed(0)} 玉、1時間×1,300円 ${beCups(1, 1300).toFixed(0)} 玉、2時間×1,300円 ${beCups(2, 1300).toFixed(0)} 玉/日`);

// ---------- 8. 地域と規模：立地の型ごとの損益分岐の杯数（論証の検査 R35、14章の基準3） ----------
// 式：分岐の杯数/日 = (家賃 + 人件費 + その他の固定費 + 店主の取り分) ÷ (営業日 × 客単価 × (1 − 原価率 − 光熱費率))
// 収容：席 × 稼働率0.75（r5-rmn-cost-canaeru）× 1時間の回転(60÷滞在20分) × ピークの時間5（11:30〜13:30と18〜21時、同） → 「ピークだけで届く上限」
// 家賃：東京9エリアの募集賃料の中央値（r5-cal-athome-kashitenpo24h1 の3頁の表）×坪数。一等地は銀座の1階 34,830円/坪、駅前は飲食店可 27,500円/坪（9エリア）と上野・浅草 19,395円/坪
//       郊外ロードサイドの大型は山岡家の地代家賃1,046百万円÷195店÷12か月（r4-ramen-yamaokaya-setsumei2603）
//       地方・観光地・学生街の家賃は手元に資料がない【仮定】
// 客単価：都心は千円の壁（r4-ramen-tdb-tosan26q3）、地方は近畿808円〜（r5-rmn-voice-maruha2018 の払ってよい額）、観光地は旅行者が高い値を受け入れる（r5-rmn-paper-kitakata-psm）を目安にした【仮定】
const COGS = 0.32, UTIL = 0.07; // 原材料32〜33%・水道光熱5〜7%（r5-rmn-cost-canaeru）
const yamaRent = 1046e6 / 195 / 12;
// 山岡家の2026年1月期のコスト内訳（10ページ、百万円）：給与・雑給13,561＋法定福利費1,396、広告438・衛生462・減価償却664・その他4,795
const yamaLabor = (13561 + 1396) * 1e6 / 195 / 12;
const yamaOther = (438 + 462 + 664 + 4795) * 1e6 / 195 / 12; // 「その他の固定費」の上の端（販管費を全部固定とみる）
const types = [
  // [名前, 家賃/月, 家賃の出どころ, 席, 客単価, 人件費の人時/日, 時給, その他の固定費/月, 営業日]
  ['都心の一等地（銀座の1階の中央値・12坪）', 34830 * 12, '資料×仮定（坪数）', 14, 1000, 22, 1300, 150000, 26],
  ['駅前（東京9エリアの中央値・10坪）', 27500 * 10, '資料×仮定（坪数）', 12, 900, 16, 1300, 150000, 26],
  ['駅前（上野・浅草の中央値・10坪）', 19395 * 10, '資料×仮定（坪数）', 12, 900, 16, 1300, 150000, 26],
  ['郊外ロードサイドの大型（山岡家の1店平均。人件費とその他の販管費も同社の内訳）', yamaRent, '資料（1社の平均）', 40, 900, -1, 0, yamaOther, 30.4],
  ['郊外ロードサイドの個人店', 200000, '仮定', 25, 850, 24, 1100, 150000, 26],
  ['地方の商店街', 80000, '仮定', 10, 800, 8, 1000, 100000, 25],
  ['観光地', 200000, '仮定', 15, 1000, 16, 1100, 150000, 25],
  ['学生街（大学の休みの月を除く）', 120000, '仮定', 15, 800, 16, 1100, 120000, 25],
];
console.log('\n## 8. 立地の型ごとの1日の損益分岐の杯数（店主の取り分0／月30万円）と、ピークだけで届く上限');
console.log(`原価率${Math.round(COGS * 100)}%・光熱費率${Math.round(UTIL * 100)}%（USEN の目安）。1杯の貢献＝客単価×${(1 - COGS - UTIL).toFixed(2)}`);
console.log('| 立地の型 | 家賃/月 | 家賃の出どころ | 席 | 客単価 | 人件費/月 | 分岐(取り分0) | 分岐(取り分30万) | ピークの上限 | 分岐÷上限 |\n|---|---|---|---|---|---|---|---|---|---|');
const beRows = [];
for (const [n, rent, src, seats, price, ph, wage, other, days] of types) {
  const labor = ph < 0 ? yamaLabor : ph * wage * days;
  const c = price * (1 - COGS - UTIL) * days;
  const be0 = (rent + labor + other) / c, be30 = (rent + labor + other + 300000) / c;
  const cap = seats * 0.75 * 3 * 5;
  beRows.push([n, be0, be30, cap]);
  console.log(`| ${n} | ${Math.round(rent).toLocaleString()} | ${src} | ${seats} | ${price} | ${Math.round(labor).toLocaleString()} | ${be0.toFixed(0)} | ${be30.toFixed(0)} | ${cap.toFixed(0)} | ${(be30 / cap * 100).toFixed(0)}% |`);
}

// 8b. 大型ロードサイドを山岡家の内訳で置き直す（論証の検査 T03）。その他の固定費を0〜全部の幅で
{
  const c = 900 * (1 - 0.305 - 0.066) * 30.4; // 原価率30.5%・水道光熱6.6%（同じ内訳）
  const lo = (yamaRent + yamaLabor) / c, hi = (yamaRent + yamaLabor + yamaOther) / c;
  const sold = 43000e6 / 195 / 365 / 900;
  console.log(`\n### 8b. 大型ロードサイド（山岡家の1店平均）：人件費 月${Math.round(yamaLabor).toLocaleString()}円・家賃 月${Math.round(yamaRent).toLocaleString()}円・その他の販管費 月${Math.round(yamaOther).toLocaleString()}円`);
  console.log(`分岐 ${lo.toFixed(0)}杯（その他の販管費を変動とみる）〜 ${hi.toFixed(0)}杯（全部固定とみる）。実際の売上は1日約${sold.toFixed(0)}杯（客単価900円【仮定】で割った目安）。分岐÷実際 ${(lo / sold * 100).toFixed(0)}〜${(hi / sold * 100).toFixed(0)}%。ピークの上限450杯（40席）を超える＝24時間のピーク外の売上が大きい`);
  console.log(`（第3版の177杯は人件費を月216万円【仮定】と置いた値で、内訳の${(yamaLabor / 2160000).toFixed(1)}分の1だった）`);
}
// 8c. 小さな店7立地の分岐の幅と順位（置き値を同時に動かす。乱数の種を固定）
{
  let seed = 20261023; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const U = (a, b) => a + (b - a) * rnd();
  const small = types.filter((t) => t[5] > 0);
  const N = 20000; const mins = small.map(() => Infinity), maxs = small.map(() => 0); let chiLow = 0, ginzaHigh = 0;
  for (let i = 0; i < N; i++) {
    const cg = U(0.30, 0.35), ut = U(0.05, 0.09);
    const be = small.map(([n, rent, src, seats, price, ph, wage, other, days]) => {
      const r = rent * (src.startsWith('資料') ? U(0.8, 1.25) : U(0.5, 1.6));
      const L = ph * U(0.6, 1.5) * wage * U(0.9, 1.15) * days;
      return (r + L + other * U(0.6, 1.5)) / (price * U(0.75, 1.1) * (1 - cg - ut) * days);
    });
    be.forEach((v, k) => { mins[k] = Math.min(mins[k], v); maxs[k] = Math.max(maxs[k], v); });
    const mi = be.indexOf(Math.min(...be)), ma = be.indexOf(Math.max(...be));
    if (small[mi][0].startsWith('地方')) chiLow++;
    if (small[ma][0].startsWith('都心')) ginzaHigh++;
  }
  console.log('\n### 8c. 置き値を同時に動かした分岐の幅（2万回、店主の取り分0。家賃は資料の立地±20%・仮定の立地0.5〜1.6倍、人時0.6〜1.5倍、時給0.9〜1.15倍、客単価0.75〜1.1倍、その他0.6〜1.5倍、原価率30〜35%、光熱費率5〜9%【仮定の幅】）');
  small.forEach((t, k) => console.log(`- ${t[0]}: ${mins[k].toFixed(0)}〜${maxs[k].toFixed(0)}杯`));
  console.log(`順位：地方の商店街が最低 ${(chiLow / N * 100).toFixed(1)}%、都心の一等地が最高 ${(ginzaHigh / N * 100).toFixed(1)}%`);
  // 立地の差の内訳：1つの入力を7立地の中央値にそろえたときの分岐の幅（最大−最小）
  const med = (a) => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
  const beOf = (t, o = {}) => { const [n, rent, src, seats, price, ph, wage, other, days] = t; const R = o.rent ?? rent, P = o.ph ?? ph, Pr = o.price ?? price; return (R + P * wage * days + other) / (Pr * (1 - COGS - UTIL) * days); };
  const spread = (o) => { const v = small.map((t) => beOf(t, o)); return Math.max(...v) - Math.min(...v); };
  console.log(`立地の差（7立地の分岐の最大−最小）：そのまま ${spread({}).toFixed(1)}杯、人時をそろえる ${spread({ ph: med(small.map((t) => t[5])) }).toFixed(1)}、家賃をそろえる ${spread({ rent: med(small.map((t) => t[1])) }).toFixed(1)}、客単価をそろえる ${spread({ price: med(small.map((t) => t[4])) }).toFixed(1)}`);
  console.log(`人件費÷家賃（置き値）：` + small.map((t) => `${t[0].slice(0, 6)} ${((t[5] * t[6] * t[8]) / t[1]).toFixed(1)}`).join('・') + '。USEN の目安は人件費約27%・家賃5〜10%（2.7〜5.4倍）');
  // 銀座の別の置き方
  const g = small.find((t) => t[0].startsWith('都心'));
  console.log(`銀座の1階の別の置き方：客単価を統計の区部617円 → ${beOf(g, { price: 617 }).toFixed(1)}杯、8坪・16人時 → ${beOf(g, { rent: 34830 * 8, ph: 16 }).toFixed(1)}杯`);
  // オーナーの例
  const chi = small.find((t) => t[0].startsWith('地方'));
  const prof = (t, cups, o = {}) => { const [n, rent, src, seats, price, ph, wage, other, days] = t; const P = o.ph ?? ph; return cups * price * (1 - COGS - UTIL) * days - rent - P * wage * days - other; };
  console.log(`銀座の1階で100杯：店主の取り分の前 ${Math.round(prof(g, 100) / 1000)}千円、取り分30万を引くと ${Math.round((prof(g, 100) - 300000) / 1000)}千円`);
  console.log(`地方の商店街で30杯：雇う（8人時）${Math.round(prof(chi, 30) / 1000)}千円、雇わず家族で回す（人時0）${Math.round(prof(chi, 30, { ph: 0 }) / 1000)}千円（分岐 ${beOf(chi, { ph: 0 }).toFixed(1)}杯）`);
}
// 同じ100杯で利益はいくらか（オーナーの「銀座だと100杯売れても赤字、奥多摩なら30杯でも採算」に対応）
console.log('同じ杯数での月の利益（店主の取り分の前）：');
for (const [n, rent, , , price, ph, wage, other, days] of types) {
  const labor = ph < 0 ? yamaLabor : ph * wage * days, c = price * (1 - COGS - UTIL);
  const p = (k) => Math.round((k * c * days - rent - labor - other) / 1000);
  console.log(`- ${n}: 30杯 ${p(30)}千円・60杯 ${p(60)}千円・100杯 ${p(100)}千円`);
}
// 何が分岐を一番動かすか（駅前の中央値の店を基準に、1つずつ動かす）
{
  const base = { rent: 275000, price: 900, labor: 16 * 1300 * 26, other: 150000, days: 26 };
  const be = (b) => (b.rent + b.labor + b.other) / (b.price * (1 - COGS - UTIL) * b.days);
  console.log(`感度（駅前・中央値の店：分岐 ${be(base).toFixed(1)} 杯）：家賃±50% → ${be({ ...base, rent: base.rent * 0.5 }).toFixed(1)}〜${be({ ...base, rent: base.rent * 1.5 }).toFixed(1)}、客単価800〜1000円 → ${be({ ...base, price: 1000 }).toFixed(1)}〜${be({ ...base, price: 800 }).toFixed(1)}、人時8〜24 → ${be({ ...base, labor: 8 * 1300 * 26 }).toFixed(1)}〜${be({ ...base, labor: 24 * 1300 * 26 }).toFixed(1)}`);
}
// 石動龍の地方の40杯の店（r5-rmn-pres-ishido-tsuburenikui）を同じ式で
console.log(`石動龍の地方の店：(アルバイト10万＋家賃込みの経費40万) ÷ (1000円×0.7×25日) = ${((100000 + 400000) / (1000 * 0.7 * 25)).toFixed(1)} 杯で店主の取り分0。40杯で残り ${(40 * 1000 * 0.7 * 25 - 500000).toLocaleString()} 円`);
console.log(`山岡家の1店あたり：売上 43,000百万円÷195店 = 年 ${(43000 / 195).toFixed(0)} 百万円、地代家賃 月 ${Math.round(yamaRent).toLocaleString()} 円（売上の2.4%）`);
console.log(`マネーフォワードの「1席あたり月20万円で繁盛店」：10席で月200万円 ÷ 26日 ÷ 900円 = ${(2000000 / 26 / 900).toFixed(0)} 杯/日`);

// ---------- 9. 季節：収容の上限と客層（論証の検査 R03・R30・R32・R54。第4版：上限を8節と同じ作り方にそろえた） ----------
// 売れる杯数_m = min(需要_m, 収容)。収容＝席×0.75×3回転×ピーク5時間（8節と同じ）。ピークの外の売上は入れない（ピークに需要が集まる前提）
// 家族客の8月の倍率1.18は家計調査の指数（4節）。単身・勤め先の客の8月の倍率は資料にない【仮定】
console.log('\n## 9. 季節の山と収容（8節と同じ上限。【仮定】の数で式の形を見せる）');
const family8 = 1.18;
const capOf = (seats) => seats * 0.75 * 3 * 5;
for (const [n, seats, base, fam] of [['12席の駅前店・平常は分岐の89杯・家族2割', 12, 89, 0.2], ['12席の駅前店・平常は分岐の89杯・家族5割', 12, 89, 0.5], ['12席の繁盛店・平常120杯・家族5割', 12, 120, 0.5], ['40席の大箱・平常300杯・家族6割', 40, 300, 0.6]]) {
  const cap = capOf(seats);
  for (const single8 of [1.0, 0.9]) {
    const d = base * (fam * family8 + (1 - fam) * single8), sold = Math.min(d, cap);
    console.log(`- ${n}（上限${cap}）・単身の8月倍率${single8}：需要 ${d.toFixed(1)} → 売れる ${sold.toFixed(1)}（取りこぼし ${(d - sold).toFixed(1)}）`);
  }
}
for (const fam of [0.2, 0.5, 0.8]) console.log(`12席（上限135）で8月に席が詰まる平常の需要の下限（家族${fam * 100}%・単身1.0）：${(135 / (fam * family8 + (1 - fam))).toFixed(0)}杯/日（上限の${(100 / (fam * family8 + (1 - fam))).toFixed(0)}%）`);
console.log('7月→8月：家計の指数 98→118（4節）。8月だけ跳ねるのは暦（お盆・夏休み）と重なる。7月・6月の低さの一部は暑さや梅雨とも読める【推論】');

// ---------- 10. 値上げの4社の物差し（論証の検査 R04、事実の判定 N1・E3） ----------
console.log('\n## 10. 値上げの4社：物差しをそろえる');
const price4 = [
  ['山岡家', '2025年1月期に2回・2026年1月期に2回の価格改定', '既存店売上 119.1%・既存店客数 115.8%・客単価 102.9%（2026年1月期）', '営業利益率 10.7%→10.9%', '同じ期の大手2社（G社・K社）の既存店売上もおおむね100%超（グラフ）'],
  ['幸楽苑', '資料に値上げ・価格改定の語がない', '12か月移動平均で客単価 約112%・客数 約94%（2023年8〜10月）。2026年3月期上期 既存店売上110.3%・客数109.8%', '上期の営業利益率5.2%（2026年3月期）', '同じ2023年4〜10月、麺業態の他社（Y社・H社）の客数は100%超（グラフ）'],
  ['一風堂', '2023年10月の値上げの後、国内は約2年半据え置き（海外は価格改定をした）', '既存店の数字は短信にない（国内は猛暑・残暑で来店客数が減ったと書く）', '連結営業利益率 10.4%→8.2%→6.4%。セグメント利益 国内−101・海外−254百万円', '—'],
  ['ギフト', '慎重かつ段階的に価格改定', '国内直営の既存店売上 105.8%（改装店を除く）', '営業利益率9.4%', '有報の外食の環境の文：観光地・都市部は客単価も上昇、地方・郊外は感応度が高い（自社の結果ではない）'],
];
console.log('| 会社 | 値段の判断 | 客数・客単価・既存店売上 | 利益 | 比べる相手・環境 |\n|---|---|---|---|---|');
for (const r of price4) console.log(`| ${r.join(' | ')} |`);
console.log('共通の物差しは「既存店売上の前年比」が3社（山岡家119.1・幸楽苑110.3（上期）・ギフト105.8）。期がずれ、一風堂は無い。客数は2社だけ');

// ---------- 11. 系統の原価の表のマスを数える（事実の判定 基準7。第4版：本文の6章の表を読んで機械で数える） ----------
// 区分：【推論】を含むマス＝推論、【計算】を含むマス＝計算（資料の数どうしを式でつないだ値）、それ以外＝資料（数か、向きの記述）
{
  const fs = require('fs'), path = require('path');
  const t = fs.readFileSync(path.join(__dirname, '..', 'BIZ-RAMEN.md'), 'utf8');
  const sec = t.split('\n## 6.')[1].split('\n## 7.')[0];
  const rows = sec.split('\n').filter((l) => /^\| [^-|系]/.test(l) && !l.startsWith('| 系統'));
  let tot = { 資料: 0, 計算: 0, 推論: 0 };
  console.log('\n## 11. 系統の原価の表（6章）のマス：10系統×9項目');
  console.log('| 系統 | 資料 | 計算 | 推論 |\n|---|---|---|---|');
  for (const r of rows) {
    const c = r.split('|').slice(1, -1).map((x) => x.trim());
    const cells = c.slice(1, 10); const k = { 資料: 0, 計算: 0, 推論: 0 };
    for (const x of cells) k[x.includes('【推論') ? '推論' : x.includes('【計算') ? '計算' : '資料']++;
    Object.keys(k).forEach((q) => { tot[q] += k[q]; });
    console.log(`| ${c[0]} | ${k.資料} | ${k.計算} | ${k.推論} |`);
  }
  const n = tot.資料 + tot.計算 + tot.推論;
  console.log(`計 ${n} マス：資料 ${tot.資料}・計算 ${tot.計算}・推論 ${tot.推論}（${(tot.推論 / n * 100).toFixed(1)}%）。第3版は資料37・推論53（58.9%）`);
}
console.log('TSR 2024年の倒産したラーメン店のスープ：醤油・中華29.8%・とんこつ24.5%・みそ12.2%・塩8.7%・家系5.2%・つけ麺1.7%（計 ' + (29.8 + 24.5 + 12.2 + 8.7 + 5.2 + 1.7).toFixed(1) + '%、残りはその他）。店の数の構成比がないので「倒れやすさ」ではない');
console.log(`系統の原価の差を月の利益と比べる：味噌270−醤油185＝85円 × 40杯 × 25日 = ${(85 * 40 * 25).toLocaleString()} 円（石動龍の40杯の店の残り20万円の ${Math.round(85 * 40 * 25 / 200000 * 100)}%）`);
console.log(`【計算】の値：つけ麺の麺 220g × (60円÷150g) = ${(220 * 60 / 150).toFixed(0)}円、油そばの麺 160g × (60円÷150g) = ${(160 * 60 / 150).toFixed(0)}円（麺の単価は USEN の150gで約60円）`);

// ---------- 12. 業界の外の波（判定書 第3版 C9） ----------
console.log('\n## 12. TDB の倒産件数（暦年、負債1000万円以上・法的整理）と原価指数（2020年=100）');
const tdbYear = { 2010: 26, 2011: 26, 2012: 26, 2013: 36, 2014: 38, 2015: 38, 2016: 25, 2017: 43, 2018: 37, 2019: 46, 2020: 54, 2021: 17, 2022: 33, 2023: 53, 2024: 79, 2025: 59 };
const vals = Object.values(tdbYear);
console.log(Object.entries(tdbYear).map(([y, v]) => `${y}:${v}`).join(' '));
console.log(`16年の平均 ${(vals.reduce((s, x) => s + x, 0) / vals.length).toFixed(1)} 件、最少 ${Math.min(...vals)}（2021）・最多 ${Math.max(...vals)}（2024）。2025年は後の記事で60件に改定`);
const idx = { 2019: 92, 2020: 100, 2021: 107, 2022: 108, 2023: 117, 2024: 128, 2025: 141 };
const ks = Object.keys(idx);
console.log('原価指数の前年比：' + ks.slice(1).map((y, i) => `${y} ${((idx[y] / idx[ks[i]] - 1) * 100).toFixed(1)}%`).join('・'));
const wheat = [['2022年4月期', 72530], ['2023年4月期', 76750], ['2025年10月期', 61010], ['2026年4月期', 62520], ['2026年10月期', 70020]];
console.log('小麦の政府売渡価格（円/t）：' + wheat.map(([k, v]) => `${k} ${v.toLocaleString()}`).join('・') + `。最高から最安まで ${((61010 / 76750 - 1) * 100).toFixed(1)}%`);

// ---------- 13. 店の数の食い違い ----------
console.log('\n## 13. 全国の店の数（資料ごとに定義が違う）');
console.log('経済センサス（平成28年、J-Net21 の引用）18,041店／山岡家の推定 約30,000店／nippon.com の記事 3万5000〜4万軒。最大÷最小 = ' + (40000 / 18041).toFixed(2) + ' 倍');

// ---------- 14. 出典の数（本文の [[src:coll:doc|「語句」]] を数える。事実の判定 2.6） ----------
{
  const fs = require('fs'), path = require('path');
  const p = path.join(__dirname, '..', 'BIZ-RAMEN.md');
  if (fs.existsSync(p)) {
    const t = fs.readFileSync(p, 'utf8');
    const re = /\[\[([\w-]+):([\w-]+):([\w-]+)\|「(.*?)」\]\]/g;
    let m, n = 0; const docs = new Set(); const perDoc = {};
    while ((m = re.exec(t))) { n++; docs.add(`${m[1]}:${m[2]}:${m[3]}`); perDoc[m[3]] = (perDoc[m[3]] || 0) + 1; }
    const bare = (t.match(/\[\[[\w-]+:[\w-]+:[\w-]+\]\]/g) || []).length;
    console.log(`\n## 14. 出典の数：${n} 件・${docs.size} 文書（語句のない出典 ${bare} 件。書式の説明の <doc> の行は数えない）`);
    const cited = new Set(Object.keys(perDoc));
    const notCited = sources.concat(sourcesV4).map((s) => s[1]).filter((d) => ![...cited].some((c) => c === d || c.startsWith(d)));
    console.log(`1節の資料のうち本文で引いていないもの：${notCited.length ? notCited.join('・') : 'なし'}`);
  }
}

// ---------- 15. 例え話「大森の大盛」の時間の並びと杯数（r5-rmn-pres-ishido1-p2〜p4。著者の作り話。論証の検査 R05・R20） ----------
{
  const open1 = 0, decide2 = open1 + 3, open2 = decide2 + 3, decide3 = open2 + 3, open3 = decide3 + 3;
  console.log('\n## 15. 例え話の時間の並び（作り話）');
  console.log(`1軒目の開店 ${open1}か月 → 2軒目の決意 ${decide2} → 開店 ${open2} → 3軒目の決意 ${decide3} → 開店 ${open3}。後発の開店の間隔は ${open2 - open1}か月・${open3 - open2}か月`);
  console.log(`地区の1日の杯数の上限：1軒目が200杯のままなら 200+130+100 = ${200 + 130 + 100}。原文は2軒目の開店で1軒目の行列が「少し減った」、3軒目の後は2軒とも「行列が減ってしまいました」、その2年後に1軒目は閉店。地区の合計の実数は書かれていない（430 は上限で、増えた幅ではない）`);
}

// ---------- 16. 変数の絡み（5.1〜5.4 の「何と絡むか」の列を数える。論証の検査 T14） ----------
{
  const fs = require('fs'), path = require('path');
  const t = fs.readFileSync(path.join(__dirname, '..', 'BIZ-RAMEN.md'), 'utf8');
  const sec = t.split('\n### 5.1')[1].split('\n### 5.5')[0];
  const rows = sec.split('\n').filter((l) => /^\| /.test(l) && !/^\| (変数|---)/.test(l));
  const KEY = { 立地: /立地|物件|集積|地域/, 客層: /客層|好み|常連|遠くの客/, 値段: /値段|客単価|値上げ/, 収容: /席|回転|行列|営業時間|仕込みの量/, 人: /人の|人数|人件費|店主の体力|店長|修業|人（/, 原価と仕入れ: /原価|仕入|相場|為替|光熱/, 統制とブランド: /統制|模倣|ブランド|評判|名の格/ };
  const cnt = {}; Object.keys(KEY).forEach((k) => { cnt[k] = 0; });
  for (const l of rows) { const c = l.split('|').map((x) => x.trim()); const rel = c[3] || ''; for (const [k, re] of Object.entries(KEY)) if (re.test(rel)) cnt[k]++; }
  console.log(`\n## 16. 変数の絡み：5.1〜5.4 の${rows.length}行の「何と絡むか」の列に出る回数（1行に1回まで）`);
  Object.entries(cnt).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`- ${k}: ${v}`));
}
