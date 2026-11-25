// 版0.3（戦略構想 Opus 5.5、11/25）：「店が出せない」の規則（PLAN.md 9.1。この台本より前に書いた）を、工場の候補地25か所に当てた表を作る。
// 使い方：node rulesk.js > out3/rules.md
global.window = global; const path = require('path'); const root = path.resolve(__dirname, '../../..');
require(path.join(root, 'js/data/tokyo23.js')); const T = SIMDATA.tokyo23; const ST = Object.fromEntries(T.stations.map((s) => [s.id, s]));
const KD = require('./kojodata3.js'); const M = KD.load(T); const KS = KD.typeSets(T, M);
const kojo = T.sites.filter((s) => s.type === 'kojo');
const DANTI = { 大田区: ['平和島2丁目', '平和島3丁目', '平和島6丁目'], 江戸川区: ['臨海町2丁目', '臨海町3丁目', '臨海町4丁目'], 板橋区: ['高島平6丁目', '高島平7丁目'], 足立区: ['入谷1丁目', '入谷5丁目', '入谷6丁目', '入谷7丁目'] };
const typ = (s) => (KS.R1.has(s.id) ? '湾岸' : M[s.id].W >= 10000 ? '事務所街' : '住工混在');
const X4cut = +(process.env.X4CUT || 1000), X5cut = +(process.env.X5CUT || 1000);
// 返す値 true＝出せない・false＝出せる・null＝データがなくて決まらない
const R = {
  X1: (s) => s.zone === '工専',
  X2: (s) => (DANTI[s.ward] || []).includes(s.town),
  X2b: (s) => /流通業務/.test(s.desc || ''),
  X3: (s) => (M[s.id].eat == null ? null : M[s.id].eat === 0),
  X4: (s, cut = X4cut) => M[s.id].W + (M[s.id].R || 0) < cut,
  X4s: (s, cut = X4cut) => (M[s.id].R == null ? (M[s.id].W >= cut ? false : null) : M[s.id].W + M[s.id].R < cut), // 厳しい読み（「—」は分からない）
  X5: (s, cut = X5cut) => s.walk > cut,
};
const or = (...ks) => (s) => { const v = ks.map((k) => R[k](s)); return v.some((x) => x === true) ? true : v.some((x) => x === null) ? null : false; };
R.L = or('X1', 'X2'); R.A = or('X1', 'X2b'); R.U = or('X1', 'X2', 'X2b', 'X3', 'X4', 'X5');
const names = ['X1', 'X2', 'X2b', 'X3', 'X4', 'X4s', 'X5', 'L', 'A', 'U'];
const mk = (v) => (v === true ? '出せない' : v === false ? '出せる' : '決まらない');
const L = [];
L.push('# 「店が出せない」の規則の当てはめ（rulesk.js が作る。規則は PLAN.md 9.1）', '');
L.push('## 1. 25か所×規則', '');
L.push('| id | 町 | 駅（段） | 型 | zone | 歩き | 従業者 | 夜間人口 | 宿泊飲食 | desc | ' + names.join(' | ') + ' |');
L.push('|' + '---|'.repeat(10 + names.length));
for (const s of kojo) { const m = M[s.id];
  L.push(`| ${s.id} | ${s.town} | ${ST[s.st].name}（${ST[s.st].tier}） | ${typ(s)} | ${s.zone} | ${s.walk} | ${m.W.toLocaleString()} | ${m.R == null ? '—' : m.R.toLocaleString()} | ${m.eat} | ${s.desc} | ` + names.map((k) => mk(R[k](s))).join(' | ') + ' |'); }
L.push('', '## 2. 規則ごとの数（出せない／決まらない）と型ごとの消える数・残る湾岸', '');
L.push('| 規則 | 出せない | 決まらない | 湾岸（7）で消える | 住工混在（17）で消える | 事務所街（1）で消える | 残る湾岸 | 東雲2丁目は残るか | 2つの決定（PLAN 9.1 の物差し） | 出せない所 |');
L.push('|---|---|---|---|---|---|---|---|---|---|');
const rows = {};
for (const k of names) { const hit = kojo.filter((s) => R[k](s) === true), und = kojo.filter((s) => R[k](s) === null);
  const by = (t) => hit.filter((s) => typ(s) === t).length; const wLeft = 7 - by('湾岸');
  const shin = kojo.find((s) => s.town === '東雲2丁目'); const shinLeft = R[k](shin) !== true;
  rows[k] = { hit: hit.length, und: und.length, w: by('湾岸'), m: by('住工混在'), o: by('事務所街'), wLeft };
  L.push(`| ${k} | ${hit.length} | ${und.length}${und.length ? '（' + und.map((s) => s.town).join('・') + '）' : ''} | ${by('湾岸')} | ${by('住工混在')} | ${by('事務所街')} | ${wLeft} | ${shinLeft ? '残る' : '消える'} | ${wLeft >= 2 ? '両立しうる' : '両立しない'}${und.length ? '（決まらない所を出せないと読むと残る湾岸 ' + (wLeft - und.filter((s) => typ(s) === '湾岸').length) + '）' : ''} | ${hit.map((s) => s.town).join('・') || '—'} |`); }
L.push('', '## 3. 線の頑健さ（報告だけ。PLAN.md 9.1）', '');
L.push('| 規則と線 | 出せない | 湾岸で消える | 住工混在で消える | 出せない所 |', '|---|---|---|---|---|');
for (const c of [800, 1000, 1200, 2000, 2200]) { const hit = kojo.filter((s) => R.X4(s, c) === true); L.push(`| X4 ${c}人 | ${hit.length} | ${hit.filter((s) => typ(s) === '湾岸').length} | ${hit.filter((s) => typ(s) === '住工混在').length} | ${hit.map((s) => s.town).join('・')} |`); }
for (const c of [800, 1000, 1200, 1500]) { const hit = kojo.filter((s) => R.X5(s, c) === true); L.push(`| X5 ${c}m | ${hit.length} | ${hit.filter((s) => typ(s) === '湾岸').length} | ${hit.filter((s) => typ(s) === '住工混在').length} | ${hit.map((s) => s.town).join('・')} |`); }
L.push('', '## 4. 工場の外の候補地で規則に当たる所（報告だけ。入れ替えの対象にはしない）', '');
const other = T.sites.filter((s) => s.type !== 'kojo');
for (const k of ['X1', 'X2', 'X2b']) { const h = other.filter((s) => R[k](s) === true); L.push(`- ${k}：${h.length}か所 ` + h.map((s) => `${s.id} ${s.town}（${s.type}）`).join('・')); }
L.push(`- X5（歩き1,000m 超）：${other.filter((s) => s.walk > 1000).length}か所（属性ごと ${JSON.stringify(other.filter((s) => s.walk > 1000).reduce((m, s) => ((m[s.type] = (m[s.type] || 0) + 1), m), {}))}）`);
console.log(L.join('\n'));
