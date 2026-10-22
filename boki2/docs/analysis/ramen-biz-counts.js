#!/usr/bin/env node
// BIZ-RAMEN（第2版）の件数・割合・合計を数えるスクリプト（QUALITY 6.2-2：頭の中で数えた数は書かない）。
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
const byType = {};
for (const [t] of sources) byType[t] = (byType[t] || 0) + 1;
console.log('## 1. 新しく足した資料（文書単位）');
console.log(`合計 ${sources.length} 本、種類 ${Object.keys(byType).length}`);
for (const [t, n] of Object.entries(byType)) console.log(`- ${t}: ${n} 本（${(n / sources.length * 100).toFixed(1)}%）`);
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
const count = (s) => { const c = {}; for (const ch of s) c[ch] = (c[ch] || 0) + 1; return c; };
const all = mynavi + nexer + navit;
const cm = count(mynavi), cn = count(nexer), cv = count(navit), ca = count(all);
console.log('\n## 2. 利用者の声（自由回答）の分類');
console.log(`マイナビ ${mynavi.length} 件 + NEXER ${nexer.length} 件 + ナビット ${navit.length} 件 = ${all.length} 件`);
console.log('| 分類 | マイナビ | NEXER | ナビット | 計 |\n|---|---|---|---|---|');
for (const k of Object.keys(CAT)) if (ca[k]) console.log(`| ${CAT[k]} | ${cm[k] || 0} | ${cn[k] || 0} | ${cv[k] || 0} | ${ca[k]} |`);
const praise = all.length - (ca.G || 0) - (ca.N || 0);
console.log(`褒め・好きの理由 ${praise} 件、苦手・不満 ${ca.G || 0} 件、異議 ${ca.N || 0} 件`);

// ---------- 3. 成功と失敗の事例（個別の名前・年・判断のあるもの） ----------
// [id, 成否, 上場か, 名前, 年, 判断→結果, 出典]
const cases = [
  ['F1', '失敗', '上場', '山岡家', '2010〜2012', '2年で店を約3割増やす→営業利益率5.1%→0.2%', 'r4-ramen-yamaokaya-setsumei2603'],
  ['F2', '失敗', '上場', '幸楽苑', '2023〜2025', '他社のFC業態（焼肉・唐揚げ・家系など）に加盟→全部撤退', 'r4-ramen-kourakuen-setsumei2511'],
  ['F3', '失敗', '上場', '幸楽苑', '48期〜53期', '長い低利益→赤字（51〜53期に営業損失）', 'r4-ramen-kourakuen-setsumei2511'],
  ['F4', '失敗', '上場', '幸楽苑', '2022〜2023', '値上げで客単価を上げる→客数が落ちる', 'r4-ramen-kourakuen-setsumei2511'],
  ['F5', '失敗', '上場', '一風堂（海外）', '2025', '各国で出店→13店を閉店、海外は来店客数が減る', 'r4-ramen-chikara-tanshin2026'],
  ['F6', '失敗', '上場', '一風堂', '2024〜2026（3月期）', '約2年半値上げせず→営業利益率10.4%→8.2%→6.4%（海外の要因も混ざる）', 'r4-ramen-chikara-tanshin2026'],
  ['F7', '失敗', '上場', 'ギフト', '2024・2025（10月期）', '出店した店のうち損益が続けてマイナスの店→減損（8+2店、4+1店）', 'r4-ramen-gift-yuho2025'],
  ['F8', '失敗', '非上場', '福岡市の公募屋台（第2回）', '2019〜2025', '公募で開業→9軒が4軒に', 'r4-ramen-fukuoka-yatai-5th'],
  ['F9', '失敗', '上場（当時）', 'どさん子（加盟店）', '1980〜2000年代', '素人でも2週間で開けるFCで急拡大→模倣・陳腐化・後継者難で閉店', 'r5-rmn-itm-dosanko2'],
  ['F10', '失敗', '上場（当時）', 'どさん子（本部）', '1990〜2012', '多角化（パン・カフェ）→赤字・虚偽記載→上場廃止', 'r5-rmn-itm-dosanko4'],
  ['F11', '失敗', '上場（当時）', 'どさん子（米国）', '1970年代〜1990', 'ニューヨークに早く出る→11店を構えたが撤退', 'r5-rmn-nippon-dosanko'],
  ['F12', '失敗', '非上場', 'なんでんかんでん 本店', '〜2012', '車で来る客の多い環七の立地→取り締まりで客が減り閉店', 'r5-rmn-jprime-nandenkanden-p4'],
  ['F13', '失敗', '非上場', 'なんでんかんでん FC', '〜2015', 'FCで各地に出す→軌道に乗らず全店閉店', 'r5-rmn-jprime-nandenkanden-p4'],
  ['F14', '失敗', '非上場', 'ドラゴンラーメン（八戸）', '2020〜2022', 'コロナ後の回復を見込んで開業→原価と光熱費の上昇で2年で閉店', 'r5-rmn-pres-ishido-topping'],
  ['F15', '失敗', '非上場', 'METRO RAMEN（神戸）', '2025', '低温の鶏チャーシュー→食中毒・営業停止3日', 'r5-rmn-case-jcast-metro'],
  ['F16', '失敗', '非上場', '静岡のラーメン店（売却案件）', '2022〜2023', '別業態の店を買って改装・開業→1年たたずに売りに出す（理由の詳細は不明）', 'r5-rmn-case-batonz31517'],
  ['F17', '失敗', '非上場', '仙台の人気ラーメン店', '2024', 'コロナ禍の投資の失敗→民事再生', 'r4-ramen-tsr-2024'],
  ['F18', '失敗', '非上場', '立川の店主（元は西麻布）', '〜2022', '西麻布で失敗→立川に移って成功→西麻布に支店', 'r5-rmn-paper-tachikawa-b'],
  ['S1', '成功', '上場', '山岡家', '2023〜2026', '店数をほぼ増やさず（179→195）既存店の客数を伸ばす→売上2.3倍・営業利益率10.9%', 'r4-ramen-yamaokaya-setsumei2603'],
  ['S2', '成功', '上場', 'ギフト（元祖油堂）', '2025', 'スープの要らない油そば→1年で15店、都心23区に出られた', 'r4-ramen-gift-yuho2025'],
  ['S3', '成功', '上場', '幸楽苑', '2024〜2025', '不採算店の整理・改装・営業時間延長→営業利益率5.2%（上期）', 'r4-ramen-kourakuen-setsumei2511'],
  ['S4', '成功', '上場（当時）', 'どさん子（初期）', '1967〜1977', '東京に味噌の専門店がない所にFCで出す→10年で1000店', 'r5-rmn-itm-dosanko1'],
  ['S5', '成功', '非上場', 'ラーメン二郎', '1968〜2010', '不便な立地・量と達成感・のれん分け→直系35店ほとんどで行列', 'r5-rmn-paper-sophia2010'],
  ['S6', '成功', '非上場', 'なんでんかんでん（開業期）', '1987〜', '赤字2年→雑誌に売り込み→1日1200杯', 'r5-rmn-jprime-nandenkanden-p3'],
  ['S7', '成功', '非上場', 'つけめん さなだ', '2014〜2024', '名店で修業し初代店長→独立、口コミで地区1位', 'r5-rmn-pres-rokurinsha'],
  ['S8', '成功', '非上場', '博多一双', '〜2024', '呼び戻しの豚骨で差別化→3店、連日行列', 'r5-rmn-pres-fukuoka-tonkotsu-p2'],
  ['S9', '成功', '非上場', '宅麺', '2010〜2015', '有名店の冷凍の通販（買い取り制）→シンガポールにライセンスの店', 'r5-rmn-nippon-dosanko'],
  ['S10', '成功', '非上場', '天下一品', '近年', 'FCの味と見た目を本部が統一し直す', 'r5-rmn-pres-tenichi1-p2'],
];
const fail = cases.filter((c) => c[1] === '失敗'), succ = cases.filter((c) => c[1] === '成功');
const nonListed = cases.filter((c) => c[2] === '非上場');
console.log('\n## 3. 事例');
console.log(`失敗 ${fail.length} 件・成功 ${succ.length} 件（計 ${cases.length}）。非上場 ${nonListed.length} 件（${(nonListed.length / cases.length * 100).toFixed(1)}%）、上場（当時を含む）${cases.length - nonListed.length} 件`);
console.log(`失敗のうち非上場 ${fail.filter((c) => c[2] === '非上場').length} 件、成功のうち非上場 ${succ.filter((c) => c[2] === '非上場').length} 件`);

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
