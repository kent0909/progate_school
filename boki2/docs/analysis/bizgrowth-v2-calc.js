#!/usr/bin/env node
// BIZ-GROWTH 第2版の計算（書いた担当の検算）。入力の数は research/raw の原文から、BIZ-GROWTH の担当が自分で写した（行は各節の注）。
// 論証検査役の検算（bizgrowth-reasoning-recheck.js）とは別に書き、同じ数が出るかを確かめる。
// Usage: node boki2/docs/analysis/bizgrowth-v2-calc.js
const fs = require('fs');
const path = require('path');
const r1 = (x) => Math.round(x * 10) / 10;
const r2 = (x) => Math.round(x * 100) / 100;
const p = (s) => console.log(s);

p('## V1. 倍率の起点とコロナ（コロナの期間＝2020年3月〜2022年度の決算を「コロナの期」とする）');
// 売上（日高：千円、hidaka-yuho2020 51行・yuho2026b 経営指標。大戸屋：ootoya-yuho2021 72行（千円）・yuho2026 51行（百万円）。
// 幸楽苑：kourakuen-setsumei2511 13頁のグラフ（百万円、48期=2018/3）。山岡家：yamaokaya-setsumei2603 39〜44頁のグラフ（億円、決算は1月）。
// ギフト：r6-fc-gift-yuho2019 51行（千円、2019/10）と gift-yuho2025（2025/10 35,878,100千円、2021/10 13,470百万円）。力の源：chikara-yuho2026 の経営指標（千円））
const rows = [
  ['日高 売上', '2022/2（コロナの期）', 26402538, '2026/2', 62252860, '2020/2（コロナ前）', 42209743],
  ['大戸屋 売上', '2022/3（コロナの期）', 18834, '2026/3', 37016, '2019/3（買われる前・コロナ前）', 25729.084],
  ['山岡家 売上', '2023/1', 187, '2026/1', 430, '2020/1（コロナ前）', 141],
  ['ギフト 売上', '2021/10（コロナの期）', 13470, '2025/10', 35878.1, '2019/10（コロナ前）', 9052.421],
  ['力の源 売上', '2022/3（コロナの期）', 19398.059, '2026/3', 36261.804, '（コロナ前の連結売上は手元の原文にない）', null],
];
for (const [k, a, va, b, vb, c, vc] of rows) {
  const s = `${k}：${a}→${b} ${r2(vb / va)}倍` + (vc ? `／${c}→${b} ${r2(vb / vc)}倍` : `／${c}`);
  p(s);
}
p(`日高 直営店 443（2020/2）→472（2026/2）：+${r1((472 / 443 - 1) * 100)}%。2022/2 の売上はコロナ前の ${r1(26402538 / 42209743 * 100)}%`);
p(`日高 2020/2→2026/2 の年率：${r1((Math.pow(62252860 / 42209743, 1 / 6) - 1) * 100)}%`);
p(`山岡家 店 163（2020/1）→195（2026/1）：+${r1((195 / 163 - 1) * 100)}%`);
const kk = { 47: 37803, 48: 38576, 49: 41268, 50: 38237, 51: 26565, 52: 25023, 53: 25461, 55: 27775 };
p(`幸楽苑 48期（2018/3、京都工場譲渡の期）${kk[48]} → 49期（2019/3）${kk[49]}：+${r1((kk[49] / kk[48] - 1) * 100)}%（40〜56期で最大）`);
p(`幸楽苑 49→52期 ${r1((kk[52] / kk[49] - 1) * 100)}%。うち50期→51期（2020/4〜2021/3、コロナの1年）の減りが ${r1((kk[50] - kk[51]) / (kk[49] - kk[52]) * 100)}%`);
p(`幸楽苑 営業利益 48期 △72 → 49期 1,636（4.0%）。工場を譲渡した翌期に黒字へ戻った`);

p('\n## V2. FC 加盟店の抜け方（bizgrowth-fc-disclosures.csv。書面から写した表）');
const csv = fs.readFileSync(path.join(__dirname, 'bizgrowth-fc-disclosures.csv'), 'utf8').trim().split('\n');
const head = csv.shift().split(',');
const R = csv.map((l) => { const c = l.split(','); const o = {}; head.forEach((h, i) => (o[h] = c[i])); return o; });
const n = (v) => (v === '' || v === undefined ? null : Number(v));
const W = R.filter((r) => n(r.fc_end) && n(r.exit_mid) !== null);
const sum = (rs, f) => rs.reduce((a, r) => a + (f(r) || 0), 0);
const rate = (rs) => ({ e: sum(rs, (r) => n(r.exit_mid)), f: sum(rs, (r) => n(r.fc_end)) });
const all = rate(W);
p(`全部（FC店数の分かる ${W.length} 行）：中途終了 ${all.e}÷期末FC店 ${all.f} = ${r2(all.e / all.f * 100)}%`);
for (const c of ['CoCo壱番屋', 'コメダ珈琲店']) p(`  分母のうち ${c}：${r1(sum(W.filter((r) => r.chain === c), (r) => n(r.fc_end)) / all.f * 100)}%`);
const rest = rate(W.filter((r) => !['CoCo壱番屋', 'コメダ珈琲店'].includes(r.chain)));
p(`CoCo壱番屋とコメダを除く：${rest.e}÷${rest.f} = ${r2(rest.e / rest.f * 100)}%`);
const RAMEN = ['らあめん花月嵐', '8番らーめん', '喜多方ラーメン坂内', 'ラーメン山小屋'];
const ra = rate(W.filter((r) => RAMEN.includes(r.chain)));
p(`ラーメンの4チェーン（花月嵐・8番・坂内・山小屋）：${ra.e}÷${ra.f} = ${r2(ra.e / ra.f * 100)}%`);
const chains = [...new Set(W.map((r) => r.chain))];
const cr = chains.map((c) => { const rs = W.filter((r) => r.chain === c); return [c, rs.reduce((a, r) => a + n(r.exit_mid) / n(r.fc_end), 0) / rs.length * 100]; }).sort((a, b) => a[1] - b[1]);
cr.forEach(([c, v]) => p(`  ${c}：${r2(v)}%`));
const vs = cr.map((x) => x[1]); const med = vs.length % 2 ? vs[(vs.length - 1) / 2] : (vs[vs.length / 2 - 1] + vs[vs.length / 2]) / 2;
p(`チェーンの率の中央値 ${r2(med)}%（${vs.length}チェーン）`);
const Wn = W.filter((r) => n(r.not_renewed) !== null);
const e2 = sum(Wn, (r) => n(r.exit_mid) + n(r.not_renewed)), f2 = sum(Wn, (r) => n(r.fc_end));
p(`中途終了＋更新されず（更新の数が書かれた ${Wn.length} 行）：${e2}÷${f2} = ${r2(e2 / f2 * 100)}%（うち更新されず ${sum(Wn, (r) => n(r.not_renewed))}件）`);
const nrAll = sum(W, (r) => n(r.not_renewed));
p(`中途終了＋更新されず（全 ${W.length} 行、更新の数のない行は0とする）：${all.e + nrAll}÷${all.f} = ${r2((all.e + nrAll) / all.f * 100)}%`);
let imp = 0, rep = 0, base = 0;
for (const c of chains) {
  const rs = R.filter((r) => r.chain === c && n(r.fc_end)).sort((a, b) => a.year - b.year);
  for (let i = 1; i < rs.length; i++) { const x = n(rs[i - 1].fc_end) + n(rs[i].new_fc) - n(rs[i].fc_end); imp += x; rep += n(rs[i].exit_mid) + (n(rs[i].not_renewed) || 0); base += n(rs[i - 1].fc_end); p(`  逆算 ${c} ${rs[i].year}：前年FC＋新規−今年FC＝${x}（書面の中途＋更新されず ${n(rs[i].exit_mid) + (n(rs[i].not_renewed) || 0)}）`); }
}
p(`逆算の合計 ${imp}＝前年FC店の延べ ${base} の ${r2(imp / base * 100)}%。書面の数（中途＋更新されず）の合計 ${rep} の ${r2(imp / rep)}倍`);
p(`無尽蔵 総店舗 87（令和元年5月期）→56（令和6年5月期）：${r1((56 / 87 - 1) * 100)}%（書面の中途終了は3年で ${sum(R.filter((r) => r.chain === '越後秘蔵麺無尽蔵'), (r) => n(r.exit_mid))}件）`);

p('\n## V3. コメダ：本部単体の売上は全店売上の何割か（jfa-komeda-fc 435・445行、百万円、5期）');
const ks = [35139, 38760, 44181, 47291, 52585], ka = [68963, 81547, 94669, 117547, 128817];
ks.forEach((s, i) => p(`  期${i + 1}：${r1(s / ka[i] * 100)}%`));
p(`全店売上 ${r2(ka[4] / ka[0])}倍、本部単体売上 ${r2(ks[4] / ks[0])}倍`);
p(`コメダHD 営業利益率 2026/2：9,424÷57,225 = ${r1(9424 / 57225 * 100)}%、2024/2：8,717÷43,236 = ${r1(8717 / 43236 * 100)}%`);

p('\n## V4. トリドールの減損（toridoll-yuho2026、百万円）');
p(`減損 11,408 のうち のれん 5,287（${r1(5287 / 11408 * 100)}%）・商標権 2,755・残り ${11408 - 5287 - 2755}（店の資産など）。前期の減損 8,066`);
p(`当期利益 2,311：計画 5,500 比 ${r1((2311 / 5500 - 1) * 100)}%、前期 1,874 比 +${r1((2311 / 1874 - 1) * 100)}%`);
p(`減損の売上比：トリドール ${r2(11408 / 278715 * 100)}%、ギフト ${r2(88.892 / 35878.1 * 100)}%（ギフトは店の資産でのれんではない）`);

p('\n## V5. 力の源の海外（chikara-tanshin2026 の店舗数の表）');
p(`ライセンス 72→69（${r1((69 / 72 - 1) * 100)}%）、直営 ${140 - 72}→${144 - 69}（+${r1(((144 - 69) / (140 - 72) - 1) * 100)}%）`);

p('\n## V6. 中華料理店の今後の方針（mhlw-chuka 表8、366施設、複数回答の19項目）');
const t8 = [['食事メニューの工夫', 56.8], ['接客サービスの充実', 34.7], ['価格の見直し', 24.0], ['広告・宣伝等の強化', 18.9], ['特になし', 14.5], ['施設・設備の改装', 13.1], ['集客のためのイベント実施', 12.8], ['廃業', 11.2], ['営業時間の変更', 7.1], ['事業規模の拡大・縮小', 7.1], ['経営の多角化', 4.1], ['経営指導を受ける', 2.7], ['専門店化・高級店化', 2.5], ['施設の移転', 2.5], ['その他', 1.9], ['パソコン等の導入', 1.6], ['事業の共同化・協業化', 1.4], ['他の飲食業へ転業', 0.3], ['不詳', 0.3]];
p(`項目数 ${t8.length}、回答の和 ${r1(t8.reduce((a, x) => a + x[1], 0))}%（複数回答）`);
const g = (k) => t8.find((x) => x[0] === k)[1];
const shop = g('食事メニューの工夫') + g('接客サービスの充実') + g('価格の見直し') + g('広告・宣伝等の強化') + g('施設・設備の改装') + g('集客のためのイベント実施') + g('営業時間の変更');
p(`店の中で動く7項目（メニュー・接客・価格・広告・改装・イベント・営業時間）の和 ${r1(shop)}%`);
const grow = g('経営の多角化') + g('専門店化・高級店化');
p(`拡大と言い切れる項目（多角化＋専門店化）${r1(grow)}%：廃業 ${g('廃業')}% の ${r2(grow / g('廃業'))}倍。第1版の和16.2%は「拡大・縮小」と「移転」を入れた値`);

p('\n## V7. 魁力屋：新しい県（sakigake-yuho2025 沿革257〜286行）');
const before = ['広島（2021/12）', '茨城（2022/5）', '福岡（2023/8）', '群馬（2023/11）', '鹿児島（2023/12）'];
const after = ['宮崎', '福島', '高知', '岩手', '石川', '徳島', '青森', '長野', '和歌山'];
p(`上場（2023/12）の前2年：${before.length}県、後2年：${after.length}県。外部FCの開始は2023/2（上場の前）`);

p('\n## V8. 山岡家の有利子負債の総資産比率（setsumei2603 39〜44頁のグラフ、ノートの値）');
p('2010 52.4% → 2012 64.5%（山）→ 2016 44.1%（出店前の水準を下回る。山から4年）→ 2023 38.0% → 2026 9.8%');

p('\n## V9. 本部費（全社費用÷売上）を規模の順に並べる（第1版の H1〜H6）');
const hq = [['ハチバン 2026/3', 86.4, 8.9], ['力の源 2026/3', 363, 1.5], ['ペッパー 2019/12', 675, 4.9], ['トリドール 2026/3', 2787, 3.6]];
hq.sort((a, b) => a[1] - b[1]).forEach(([k, s, v]) => p(`  ${k}：売上 ${s}億円、全社費用の比 ${v}%`));
p('規模の順に並べても比率は 8.9→1.5→4.9→3.6 で、向きはそろわない（定義も会社ごとに違う）');

p('\n## V10. 加盟店の側の争いと声（bizgrowth-fc-voices.tsv）');
const T = fs.readFileSync(path.join(__dirname, 'bizgrowth-fc-voices.tsv'), 'utf8').trim().split('\n');
const th = T.shift().split('\t');
const V = T.map((l) => { const c = l.split('\t'); const o = {}; th.forEach((h, i) => (o[h] = c[i])); return o; });
const cnt = (k) => { const m = new Map(); V.forEach((v) => m.set(v[k], (m.get(v[k]) || 0) + 1)); return [...m].sort((a, b) => b[1] - a[1]).map(([a, b]) => `${a} ${b}`).join('、'); };
p(`行 ${V.length}`);
p(`種類：${cnt('kind')}`);
p(`業種：${cnt('industry')}`);
p(`争点・話題：${cnt('topic')}`);
p(`加盟者の結果（判例だけ）：${(() => { const m = new Map(); V.filter((v) => v.kind === '判例').forEach((v) => m.set(v.result, (m.get(v.result) || 0) + 1)); return [...m].map(([a, b]) => `${a} ${b}`).join('、'); })()}`);
p(`外食の判例：${V.filter((v) => v.kind === '判例' && v.industry === '外食').map((v) => v.case).join('・')}`);
