#!/usr/bin/env node
// BIZ-GROWTH の論証の検査（docs/audit/BIZ-GROWTH-reasoning.md）の検算。
// 書いた担当とは別の論証検査役が、報告の計算と、その計算から言えることを確かめる。
// 入力の数は research/raw の原文（pdftotext -layout で文字に直したもの）から写した。行は検査書の「読んだ範囲」に書いた。
// 最後の節は、検査書の表の「判定」の列を数える。
// Usage: node boki2/docs/analysis/bizgrowth-reasoning-recheck.js
const fs = require('fs');
const path = require('path');
const r1 = (x) => Math.round(x * 10) / 10;
const r2 = (x) => Math.round(x * 100) / 100;
const out = (s) => console.log(s);

out('## 1. 成長の倍率の基準年（コロナの底を起点にしていないか）');
// 日高屋：r5-growth-hidaka-yuho2020 の経営指標（2016/2〜2020/2）と r5-growth-hidaka-yuho2026b（2022/2〜2026/2）、単位千円
const hidaka = { '2019/2': 41862978, '2020/2': 42209743, '2022/2': 26402538, '2026/2': 62252860 };
out(`日高 2022/2→2026/2（報告の G5）: ${r2(hidaka['2026/2'] / hidaka['2022/2'])}倍`);
out(`日高 2020/2（コロナ前）→2026/2: ${r2(hidaka['2026/2'] / hidaka['2020/2'])}倍、6年の年率 ${r1((Math.pow(hidaka['2026/2'] / hidaka['2020/2'], 1 / 6) - 1) * 100)}%`);
out(`日高 2022/2 はコロナ前（2020/2）の ${r1(hidaka['2022/2'] / hidaka['2020/2'] * 100)}%。G5 の2.4倍のうち、コロナ前の水準へ戻るまでが ${r1((hidaka['2020/2'] - hidaka['2022/2']) / (hidaka['2026/2'] - hidaka['2022/2']) * 100)}%`);
out(`日高 直営店 443（2020/2）→472（2026/2）: +${r1((472 / 443 - 1) * 100)}%。店の伸びに比べ、売上の伸びの大半は1店あたりの回復と値上げ・客数`);
// 大戸屋：r5-growth-ootoya-yuho2021（2017/3〜2021/3、千円）と r5-growth-ootoya-yuho2026（2022/3〜2026/3、百万円）
const ootoya = { '2019/3': 25729.084, '2020/3': 24579.663, '2021/3': 16139.168, '2022/3': 18834, '2026/3': 37016 };
out(`大戸屋 2022/3→2026/3（報告の G10）: ${r2(ootoya['2026/3'] / ootoya['2022/3'])}倍`);
out(`大戸屋 2019/3（買われる前・コロナ前）→2026/3: ${r2(ootoya['2026/3'] / ootoya['2019/3'])}倍。2020/3→2026/3: ${r2(ootoya['2026/3'] / ootoya['2020/3'])}倍`);
// 幸楽苑：r4-ramen-kourakuen-setsumei2511 の13頁（40期＝2010/3）。r5-growth-kourakuen-yuho2018 で48期＝2018/3 の売上38,576百万円を確かめた
const kk = { 48: 38576, 49: 41268, 50: 38237, 51: 26565, 52: 25023 };
const kkYear = (ki) => `${2010 + (ki - 40)}/3`;
out(`幸楽苑 48期=${kkYear(48)}（減損・特約抵触・京都工場譲渡の期）${kk[48]} → 49期=${kkYear(49)} ${kk[49]}（+${r1((kk[49] / kk[48] - 1) * 100)}%、最大）→ 50期=${kkYear(50)} ${kk[50]} → 51期=${kkYear(51)} ${kk[51]}（${r1((kk[51] / kk[50] - 1) * 100)}%）→ 52期=${kkYear(52)} ${kk[52]}`);
out(`幸楽苑 報告の G7（49→52期 ${r1((kk[52] / kk[49] - 1) * 100)}%）の減りのうち、コロナの年（50期→51期）の1年で起きた分: ${r1((kk[50] - kk[51]) / (kk[49] - kk[52]) * 100)}%`);
// 山岡家：r4-ramen-yamaokaya-setsumei2603#growth のノート（グラフを画像で読んだ値）。有利子負債の総資産比率
const yd = { 2010: 52.4, 2012: 64.5, 2016: 44.1, 2023: 38.0, 2026: 9.8 };
out(`山岡家 有利子負債比率 2010 ${yd[2010]}% → 山 2012 ${yd[2012]}% → 2016 ${yd[2016]}%：急な出店の前（2010）の水準を下回ったのは遅くとも2016年（山から4年）。「10年以上」は9.8%（2026）まで下がった年で数えた形`);

out('\n## 2. FC 加盟店の抜け方（bizgrowth-fc-disclosures.csv を読み直す）');
const csv = fs.readFileSync(path.join(__dirname, 'bizgrowth-fc-disclosures.csv'), 'utf8').trim().split('\n');
const head = csv.shift().split(',');
const rows = csv.map((l) => { const c = l.split(','); const o = {}; head.forEach((h, i) => (o[h] = c[i])); return o; });
const n = (v) => (v === '' || v === undefined ? null : Number(v));
const withFc = rows.filter((r) => n(r.fc_end) && n(r.exit_mid) !== null);
const pooled = (rs) => { const e = rs.reduce((a, r) => a + n(r.exit_mid), 0); const f = rs.reduce((a, r) => a + n(r.fc_end), 0); return { e, f, p: r2(e / f * 100) }; };
const all = pooled(withFc);
out(`報告の値（FC店数の分かる行の合算）: ${all.e}÷${all.f} = ${all.p}%（行数 ${withFc.length}）`);
const big = ['CoCo壱番屋', 'コメダ珈琲店'];
const fcShare = (name) => r1(withFc.filter((r) => r.chain === name).reduce((a, r) => a + n(r.fc_end), 0) / all.f * 100);
out(`分母のうち CoCo壱番屋 ${fcShare('CoCo壱番屋')}%、コメダ ${fcShare('コメダ珈琲店')}%（どちらもラーメンではない）`);
const noBig = pooled(withFc.filter((r) => !big.includes(r.chain)));
out(`CoCo壱番屋とコメダを除く合算: ${noBig.e}÷${noBig.f} = ${noBig.p}%`);
const ramenOnly = ['らあめん花月嵐', '8番らーめん', '喜多方ラーメン坂内', 'ラーメン山小屋'];
const ro = pooled(withFc.filter((r) => ramenOnly.includes(r.chain)));
out(`ラーメンの4チェーン（花月嵐・8番・坂内・山小屋）の合算: ${ro.e}÷${ro.f} = ${ro.p}%`);
const chains = [...new Set(withFc.map((r) => r.chain))];
const chainRates = chains.map((c) => { const rs = withFc.filter((r) => r.chain === c); return rs.reduce((a, r) => a + n(r.exit_mid) / n(r.fc_end), 0) / rs.length * 100; }).sort((a, b) => a - b);
const median = (a) => (a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2);
out(`チェーンごとの率の単純平均 ${r2(chainRates.reduce((a, b) => a + b, 0) / chainRates.length)}%、中央値 ${r2(median(chainRates))}%（${chains.length}チェーン）`);
// 中途終了に「更新されなかった」を足す（抜けた店の数として）
const withNr = withFc.filter((r) => n(r.not_renewed) !== null);
const e2 = withNr.reduce((a, r) => a + n(r.exit_mid) + n(r.not_renewed), 0); const f2 = withNr.reduce((a, r) => a + n(r.fc_end), 0);
out(`中途終了＋更新されず（不明の行を除く ${withNr.length}行）: ${e2}÷${f2} = ${r2(e2 / f2 * 100)}%`);
// FC 店数の差から逆算した「抜けた店」（前年の FC 店＋新規−今年の FC 店。直営化・持ち主の交代を含む）と、書面の中途終了の比
let imp = 0, rep = 0, prevFc = 0; const impRows = [];
for (const c of chains) {
  const rs = rows.filter((r) => r.chain === c && n(r.fc_end)).sort((a, b) => a.year - b.year);
  for (let i = 1; i < rs.length; i++) {
    const x = n(rs[i - 1].fc_end) + n(rs[i].new_fc) - n(rs[i].fc_end);
    imp += x; rep += n(rs[i].exit_mid) + (n(rs[i].not_renewed) || 0); prevFc += n(rs[i - 1].fc_end);
    impRows.push(`${c} ${rs[i].year}: 逆算 ${x} / 書面（中途＋更新されず）${n(rs[i].exit_mid) + (n(rs[i].not_renewed) || 0)}`);
  }
}
impRows.forEach((s) => out('  ' + s));
out(`逆算の合計 ${imp}（前年FC店の延べ ${prevFc} の ${r2(imp / prevFc * 100)}%）、書面の中途＋更新されずの合計 ${rep}`);
// 無尽蔵：総店舗数の推移（r5-growth-jfa-mujinzo の店舗数推移の表）
const muj = { R1: 87, R6: 56 };
out(`無尽蔵 総店舗 令和元年5月期 ${muj.R1} → 令和6年5月期 ${muj.R6}: ${r1((muj.R6 / muj.R1 - 1) * 100)}%。同じ書面の中途終了は3年で6件`);

out('\n## 3. コメダ：本部は加盟店の売上の伸びを取らないか');
// r5-growth-jfa-komeda-fc（株式会社コメダ単体の5期の損益と全店売上の推定、百万円）
const kom = { sales: [35139, 38760, 44181, 47291, 52585], op: [4870, 5259, 6115, 6108, 6557], allStore: [68963, 81547, 94669, 117547, 128817] };
kom.sales.forEach((s, i) => out(`  期${i + 1}: 本部単体売上÷全店売上 ${r1(s / kom.allStore[i] * 100)}%、本部単体営業利益率 ${r1(kom.op[i] / s * 100)}%`));
out(`全店売上 ${r2(kom.allStore[4] / kom.allStore[0])}倍に対し本部単体売上 ${r2(kom.sales[4] / kom.sales[0])}倍：本部の売上は全店売上の4〜5割で、全店売上とともに増える（卸は客数に比例する）`);
out('有報2026：卸売価格を9月から値上げ、加盟店向け卸の既存店売上前年比109.5%（原文の語句「加盟店向け卸売価格値上げ」）');

out('\n## 4. のれんの減損（トリドール）');
// r5-growth-toridoll-yuho2026：無形資産及びのれんの表（百万円）と損益の表
const tor = { impTotal: 11408, impGoodwill: 5287, impTrademark: 2755, impPrevTotal: 8066, net25: 1874, net26: 2311, netPlan: 5500, op25: 8674, op26: 10578 };
out(`減損114.08億のうち、のれん ${tor.impGoodwill / 100}億（${r1(tor.impGoodwill / tor.impTotal * 100)}%）、商標権 ${tor.impTrademark / 100}億、のれん・無形以外 ${r2((tor.impTotal - tor.impGoodwill - tor.impTrademark) / 100)}億`);
out(`前期の減損 ${tor.impPrevTotal / 100}億：2期続けて80億超（「一度に出る」ではなく毎期出ている）`);
out(`当期利益：計画比 ${r1((tor.net26 / tor.netPlan - 1) * 100)}%、前期比 +${r1((tor.net26 / tor.net25 - 1) * 100)}%。営業利益 前期比 +${r1((tor.op26 / tor.op25 - 1) * 100)}%`);
out(`ギフトの減損 0.89億は店の資産の減損（のれんの減損ではない）。売上比 ギフト ${r2(0.889 / 358.8 * 100)}%・トリドール ${r2(114.08 / 2787.15 * 100)}%`);

out('\n## 5. 力の源の海外：任せた国で店が減ったか（r4-ramen-chikara-tanshin2026 の店舗数の表）');
const lic = { prev: 72, cur: 69 }; const ovAll = { prev: 140, cur: 144 };
const dirPrev = ovAll.prev - lic.prev, dirCur = ovAll.cur - lic.cur;
out(`ライセンス ${lic.prev}→${lic.cur}（${r1((lic.cur / lic.prev - 1) * 100)}%）、直営 ${dirPrev}→${dirCur}（+${r1((dirCur / dirPrev - 1) * 100)}%）`);
out('国別のライセンス：中国（含む香港）−3、マレーシア−1、タイ IPPUDO−3・その他+3（タイは純減0）、ミャンマー−1、フィリピン+1、ベトナム+1。直営の国でも閉店：台湾2・米国1・インドネシア1');

out('\n## 6. 中華料理店の今後の方針（r4-mgmt-mhlw-chuka 表8、366施設・複数回答）');
const chuka = { menu: 56.8, service: 34.7, price: 24.0, ad: 18.9, none: 14.5, renov: 13.1, event: 12.8, close: 11.2, hours: 7.1, scale: 7.1, diversify: 4.1, guidance: 2.7, special: 2.5, move: 2.5 };
out(`報告が「ライバルの方針」に使った5項目の和（廃業＋規模＋多角化＋専門店化＋移転）: ${r1(chuka.close + chuka.scale + chuka.diversify + chuka.special + chuka.move)}%`);
out(`報告が落とした上位4項目（メニュー${chuka.menu}・接客${chuka.service}・価格${chuka.price}・広告${chuka.ad}）`);
out(`報告の C1（成長に向かう和 16.2%）から「拡大・縮小」と「移転」を除くと ${r1(chuka.diversify + chuka.special)}%：廃業 ${chuka.close}% の ${r2((chuka.diversify + chuka.special) / chuka.close)}倍`);
out(`報告の本文は「16.2%で廃業の1.4倍」、C2 の式は 11.2÷16.2＝${r2(11.2 / 16.2)}（逆数で同じこと）`);

out('\n## 7. 魁力屋：上場の前後で新しい県に出た数（r5-growth-sakigake-yuho2025 の沿革）');
const pref = { '2021': 1, '2022': 1, '2023pre': 3, '2024': 3, '2025': 6 }; // 2023年12月の鹿児島は上場と同じ月（上場の前に数える）
out(`上場前の2年（2021/12〜2023/12）: ${pref['2021'] + pref['2022'] + pref['2023pre']}県、上場後の2年（2024〜2025）: ${pref['2024'] + pref['2025']}県。加速は上場の前から始まり、外部FCの開始（2023年2月）も同じ時期`);

out('\n## 8. 判定の数（docs/audit/BIZ-GROWTH-reasoning.md の表）');
const auditPath = path.join(__dirname, '..', 'audit', 'BIZ-GROWTH-reasoning.md');
if (fs.existsSync(auditPath)) {
  const lines = fs.readFileSync(auditPath, 'utf8').split('\n').filter((l) => /^\| [A-Z]{1,2}\d{2} \|/.test(l));
  const cnt = { 妥当: [], 弱い: [], 不当: [] };
  for (const l of lines) {
    const cells = l.split('|').map((s) => s.trim());
    const id = cells[1];
    const v = cells[cells.length - 3];
    if (cnt[v]) cnt[v].push(id); else out(`  判定の読めない行: ${id} → ${v}`);
  }
  const total = lines.length;
  for (const k of Object.keys(cnt)) out(`${k} ${cnt[k].length}：${cnt[k].join('・')}`);
  out(`行 ${total}（${cnt['妥当'].length}＋${cnt['弱い'].length}＋${cnt['不当'].length}）`);
} else out('検査書がまだない');
