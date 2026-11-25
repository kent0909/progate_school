// 版0.3（戦略構想 Opus 5.5、11/25）：入れ替えた地図を、元の tokyo23.js と比べて数える（PLAN.md 9.2）。使い方：node mapcount.js > out3/maps.md
const fs = require('fs'), path = require('path'); const root = path.resolve(__dirname, '../../..');
const load = (f) => { const t = fs.readFileSync(f, 'utf8'); return JSON.parse(t.slice(t.indexOf('SIM.tokyo23 = ') + 14, t.lastIndexOf(';\n})('))); };
const KD = require('./kojodata3.js');
const T0 = load(path.join(root, 'js/data/tokyo23.js')); const M = path.join(__dirname, 'out3/maps');
const types = ['hanka', 'shogyo', 'office', 'shoten', 'jutaku', 'kojo'];
const sum = (T) => { const c = Object.fromEntries(types.map((t) => [t, 0])); for (const s of T.sites) c[s.type]++;
  const KM = KD.load(T); const KS = KD.typeSets(T, KM); const st0 = T.stations.filter((st) => !T.sites.some((s) => s.st === st.id)).length;
  return { n: T.sites.length, c, wangan: KS.R1.size, wanganTowns: T.sites.filter((s) => KS.R1.has(s.id)).map((s) => s.town), mix: T.sites.filter((s) => s.type === 'kojo' && !KS.R1.has(s.id) && !(KM[s.id] && KM[s.id].W >= 10000)).length, nomesh: T.sites.filter((s) => s.type === 'kojo' && !KM[s.id]).map((s) => s.town), quiet: T.sites.filter((s) => s.quiet).length, st0, nullDay: T.sites.filter((s) => s.day == null).length }; };
const base = sum(T0); const byId0 = Object.fromEntries(T0.sites.map((s) => [s.id, JSON.stringify(s)]));
const L = ['# 入れ替えた地図の数（mapcount.js が作る。手順は PLAN.md 9.2、地図は mk-maps.sh）', ''];
L.push('| 地図 | 候補地 | 繁華街 | 店とオフィス | オフィス | 商店街 | 住宅地 | 工場 | うち湾岸（R1） | うち住工混在 | quiet | 候補地0の駅 | day が null | id も中身も同じ候補地 | 中身の変わった id | 消えた id | 新しい id | 入れ替え（同じ駅） | 別の駅へ | 減らした |');
L.push('|' + '---|'.repeat(21));
const row = (nm, s, d, x) => `| ${nm} | ${s.n} | ${types.map((t) => s.c[t]).join(' | ')} | ${s.wangan} | ${s.mix} | ${s.quiet} | ${s.st0} | ${s.nullDay} | ${d.same} | ${d.changed} | ${d.gone} | ${d.added} | ${x ? x.replaced.length : '—'} | ${x ? x.moved.length : '—'} | ${x ? x.dropped.length : '—'} |`;
L.push(row('元（tokyo23.js）', base, { same: T0.sites.length, changed: 0, gone: 0, added: 0 }, null));
const files = fs.readdirSync(M).filter((f) => /^[A-Za-z0-9]+_P\w+\.js$/.test(f)).sort();
const detail = [];
for (const f of files) { const nm = f.replace('.js', ''); const T = load(path.join(M, f)); const x = JSON.parse(fs.readFileSync(path.join(M, nm + '.json'), 'utf8'));
  const s = sum(T); const byId = Object.fromEntries(T.sites.map((q) => [q.id, JSON.stringify(q)]));
  const d = { same: 0, changed: 0, gone: 0, added: 0 }; const ch = [];
  for (const id of Object.keys(byId0)) { if (!(id in byId)) { d.gone++; ch.push('消えた ' + id + ' ' + JSON.parse(byId0[id]).town); } else if (byId[id] === byId0[id]) d.same++; else { d.changed++; const a = JSON.parse(byId0[id]), b = JSON.parse(byId[id]); ch.push(`変わった ${id} ${a.town}（${a.type}）→ ${b.town}（${b.type}、歩き${b.walk}m・day ${b.day}・food ${b.food}）`); } }
  for (const id of Object.keys(byId)) if (!(id in byId0)) { d.added++; const b = JSON.parse(byId[id]); ch.push(`新しい ${id} ${b.town}（${b.type}、歩き${b.walk}m）`); }
  L.push(row(nm, s, d, x));
  detail.push(`### ${nm}`, `- 外した：${x.removed.map((r) => r.stName + '/' + r.town).join('・') || (x.p1_pre_excluded || []).map((r) => r.town + '（' + r.type + '）').join('・')}`,
    `- 同じ駅で入れ替え：${x.replaced.map((r) => `${r.stName}：${r.from}→${r.to}（${r.toType}、${r.radius}、駅から直線${r.d}m）`).join('・') || 'なし'}`,
    `- 別の駅へ：${x.moved.map((r) => `${r.fromName}/${r.from}→${r.toName}/${r.to}（${r.toType}、駅の間${r.stDist}m）`).join('・') || 'なし'}`,
    `- 減らした：${x.dropped.map((r) => r.st + '/' + r.town).join('・') || 'なし'}`,
    `- 湾岸（R1）に残る：${s.wanganTowns.join('・')}${s.nomesh.length ? '｜メッシュの値がない工場：' + s.nomesh.join('・') : ''}`,
    `- 元と比べた差（${ch.length}件）：` + (ch.length > 40 ? ch.slice(0, 40).join('｜') + `｜…ほか${ch.length - 40}件` : ch.join('｜')), ''); }
L.push('', '## 地図ごとの中身', '', ...detail);
console.log(L.join('\n'));
