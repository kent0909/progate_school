// 版0.3（11/25）の写し。元は kojodata.js（書き換えない）。町の名で引く形に変えた（PLAN.md 9章）。25か所の元の地図では kojodata.js と同じ結果。
// 工場・倉庫の候補地（tokyo23.js の type＝kojo、25か所）のメッシュの値を、調べ物の出力 ramencount23/out/count.txt §6 の表から読む（手で写さない）。
// 返す値：site id → { town, W（従業者）, R（夜間人口、— は null）, eat（宿泊飲食の事業所）, per1000（従業者1,000人あたり）, osm200, osm500, mesh }
// 型の分け方（PLAN.md 1章）：R1・R1z・R4・R3・R5・R2（分けない）。
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../../..');
function load(T) {
  const txt = fs.readFileSync(path.join(root, 'docs/analysis/ramencount23/out/count.txt'), 'utf8');
  const sec = txt.split('## 6.')[1].split('\n\n')[0];
  const rows = sec.split('\n').filter((l) => /^\| \d+ \|/.test(l)).map((l) => l.split('|').map((c) => c.trim()));
  const num = (c) => (c === '—' ? null : +c.replace(/,/g, ''));
  // 版0.3：入れ替えたあとの地図では kojo が25か所より少ない・別の kojo の点が入りうるので、順でなく町の名で引く。count.txt §6 にない kojo の候補地は M なし（どの型にも入れない。K3 だけ効く）
  const byTown = {}; for (const c of rows) { if (byTown[c[2]]) throw new Error(`町の名が重なる：${c[2]}`); byTown[c[2]] = c; }
  const kojo = T.sites.filter((s) => s.type === 'kojo');
  const out = {}; const missing = [];
  for (const s of kojo) { const c = byTown[s.town]; if (!c) { missing.push(s.id + ' ' + s.town); continue; }
    const [o200, o500] = c[15].split('・').map(Number);
    out[s.id] = { town: s.town, mesh: c[7], R: num(c[8]), W: num(c[9]), eat: num(c[13]), per1000: +c[14], osm200: o200, osm500: o500 }; }
  if (missing.length) console.error('kojodata3：count.txt §6 にない kojo の候補地 ' + missing.join('・'));
  return out;
}
const R4CUT = 2.7; // オフィス街の候補地の「従業者1,000人あたりの宿泊飲食の事業所」の25%点（count.txt §6 の属性の表）
function typeSets(T, M, k = {}) {
  const dayCut = k.dayCut || 0.8, wCut = k.wCut || 10000, r4 = k.r4 || R4CUT;
  const kojo = T.sites.filter((s) => s.type === 'kojo');
  const set = (f) => new Set(kojo.filter(f).map((s) => s.id));
  return {
    R1: set((s) => M[s.id] && (s.day == null || s.day >= dayCut) && M[s.id].W < wCut),
    R1z: set((s) => (s.day == null || s.day >= dayCut) && s.zone !== '商業'),
    R4: set((s) => M[s.id] && M[s.id].per1000 < r4),
    R3: set((s) => !/住宅|アパート|住/.test(s.desc)),
    R5: set((s) => s.zone === '工専'),
    R2: set(() => true), // 分けない（重みは day、day なしは1）
  };
}
module.exports = { load, typeSets, R4CUT, WREF: 1885 };
