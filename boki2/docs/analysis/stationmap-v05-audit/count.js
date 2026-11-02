// DESIGN-STATIONMAP 版0.5 の判定：数の数え直し（判定役）。
// 使い方：node boki2/docs/analysis/stationmap-v05-audit/count.js [data.js]（既定はリポジトリの js/data/tokyo23.js）
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const file = process.argv[2] || path.join(ROOT, 'js', 'data', 'tokyo23.js');
const ctx = {}; ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(file, 'utf8'), ctx);
const D = ctx.SIMDATA.tokyo23, S = D.stations, T = D.sites;
const FF = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'data', 'footfall-adj.json'), 'utf8'));
const byId = Object.fromEntries(S.map(s => [s.id, s]));
const med = a => { const b = [...a].sort((x, y) => x - y), n = b.length; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; };
const tierOf = f => D.pinTiers.find(([th]) => f >= th)[1];
const p = (...a) => console.log(...a);

p('# 1. 駅・ピン'); p('駅', S.length, '候補地', T.length, 'ピンの和', S.reduce((a, s) => a + s.pins, 0));
const tiers = {}; for (const s of S) { tiers[s.tier] = tiers[s.tier] || []; tiers[s.tier].push(s); }
for (const t of [8, 6, 5, 4, 3, 2, 1]) p(`段${t}`, (tiers[t] || []).length, t >= 6 ? (tiers[t] || []).map(s => s.name).join('・') : '');
p('tier と foot の段が食い違う駅', S.filter(s => tierOf(s.foot) !== s.tier).map(s => s.name));
p('foot ≠ round(riders×adj) の駅', S.filter(s => s.foot !== Math.round(s.riders * s.adj)).map(s => s.name));
p('pins − tier の和（閑静の枠）', S.reduce((a, s) => a + s.pins - s.tier, 0));
const placed = {}; for (const t of T) placed[t.st] = (placed[t.st] || 0) + 1;
const short = S.filter(s => (placed[s.id] || 0) < s.pins);
p('足りない駅', short.length, '足りない本数', short.reduce((a, s) => a + s.pins - (placed[s.id] || 0), 0));
p(short.map(s => `${s.name} ${placed[s.id] || 0}/${s.pins}`).join('・'));
const adjN = S.filter(s => FF.stations[s.name]).length, adj1 = S.filter(s => !FF.stations[s.name]);
p('係数のある駅（json に名がある）', adjN, 'ない駅', adj1.length, adj1.map(s => s.name).join('・'));
p('adj が1ちょうど（json にあり）', S.filter(s => FF.stations[s.name] && s.adj === 1).length);
p('json と data の adj の食い違い', S.filter(s => FF.stations[s.name] && FF.stations[s.name].adj !== s.adj).map(s => s.name));
p('json の駅のうち data にない名', Object.keys(FF.stations).filter(n => !S.find(s => s.name === n)).length);
const ridTier = s => tierOf(s.riders);
const down = S.filter(s => ridTier(s) > s.tier), up = S.filter(s => ridTier(s) < s.tier);
p('riders の段→foot の段：下がる', down.length, '上がる', up.length, '同じ', S.length - down.length - up.length);
p('下がる駅のうち係数の json にある駅', down.filter(s => FF.stations[s.name]).length);
p('riders の段の駅の数', [8, 6, 5, 4, 3, 2, 1].map(t => `${t}:${S.filter(s => ridTier(s) === t).length}`).join(' '));
p('段が2つ以上下がる駅', down.filter(s => [8, 6, 5, 4, 3, 2, 1].indexOf(s.tier) - [8, 6, 5, 4, 3, 2, 1].indexOf(ridTier(s)) >= 2).map(s => `${s.name} ${ridTier(s)}→${s.tier}`).join('・'));

p('\n# 2. 個別の駅（foot・adj・riders・段）');
for (const n of ['新宿', '渋谷', '池袋', '東京', '品川', '北千住', '上野', '押上', '下北沢', '三軒茶屋', '中目黒', '高田馬場', '秋葉原', '新橋', '恵比寿', '田町', '目黒', '二子玉川', 'とうきょうスカイツリー']) {
  const s = S.find(x => x.name === n); if (!s) { p(n, 'なし'); continue; }
  const f = FF.stations[n];
  p(n, 'riders', s.riders, 'adj', s.adj, 'foot', s.foot, '段(riders)', ridTier(s), '段(foot)', s.tier, 'pins', s.pins, '置けた', placed[s.id] || 0, f ? `json A ${f.A} gate13 ${Math.round(f.gate13)} used ${f.used}` : 'json なし');
}

p('\n# 3. 属性');
const types = ['hanka', 'shogyo', 'office', 'shoten', 'jutaku', 'kojo'];
for (const ty of types) { const a = T.filter(t => t.type === ty); p(ty, a.length, '地価の中央値(万円/㎡)', med(a.map(t => t.price)) / 1e4); }
const below = T.filter(t => t.price < 3e6).length, beq = T.filter(t => t.price <= 3e6).length;
p('地価300万未満', below, `(${(below / T.length * 100).toFixed(1)}%)`, '300万以下', beq);

p('\n# 4. 閑静の枠');
const Q = T.filter(t => t.quiet);
p('quiet の候補地', Q.length);
for (const t of Q) { const s = byId[t.st]; p(`${s.name}（段${s.tier}・foot ${s.foot}）→ ${t.town}（${t.ward}）type ${t.type} 地価 ${t.price / 1e4}万 zone ${t.zone} walk ${t.walk} / ${t.desc} / ${t.l01}`); }
const RE = /閑静|大規模住宅|区画整然/;
const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) * 1000; // x,y は km
p('段5以上の駅', S.filter(s => s.tier >= 5).length, S.filter(s => s.tier >= 5).map(s => s.name).join('・'));
p('段5以上で quiet なしの駅と、置かれた候補地（全駅のもの）で1.2km 以内の「閑静…」住宅地の数');
for (const s of S.filter(s => s.tier >= 5)) {
  if (Q.find(t => t.st === s.id)) continue;
  const near = T.filter(t => t.type === 'jutaku' && RE.test(t.desc || '') && d(t, s) <= 1200);
  p(' ', s.name, near.length, near.map(t => `${t.town}(${byId[t.st].name})`).join('・'));
}
p('quiet の文に語が入っているか', Q.map(t => (t.desc.match(RE) || ['×'])[0]).join(' '));
p('quiet の駅からの距離（x,y から m）', Q.map(t => Math.round(d(t, byId[t.st]))).join(' '));

p('\n# 5. 渋谷');
const sb = S.find(s => s.name === '渋谷');
for (const t of T.filter(t => t.st === sb.id)) p(' ', t.town, t.type, t.quiet ? 'quiet' : '', t.price / 1e4, t.walk);

p('\n# 6. 世田谷区・下北沢など');
const sg = S.filter(s => s.ward === '世田谷区'); p('世田谷区の駅', sg.length);
for (const n of ['下北沢', '三軒茶屋', '二子玉川']) { const s = S.find(x => x.name === n); p(n, s.tier, T.filter(t => t.st === s.id).map(t => t.type).join(',')); }

p('\n# 7. 段ごとの候補地の数と λ（4.3 の置き値）');
const lamT = { 1: 0.3, 2: 0.5, 3: 0.8, 4: 1.1, 5: 1.5, 6: 2.0, 8: 2.6 }, lamA = { hanka: 1.4, shogyo: 1.2, office: 1.0, shoten: 1.0, jutaku: 0.6, kojo: 0.4 };
let zeroC = 0; const cdist = {};
for (const t of T) { const s = byId[t.st], lam = lamT[s.tier] * lamA[t.type], c = Math.round(lam); cdist[c] = (cdist[c] || 0) + 1; if (c === 0) zeroC++; }
p('中心 c の分布', JSON.stringify(cdist), 'c=0 の候補地', zeroC, `(${(zeroC / T.length * 100).toFixed(1)}%)`);
// c=0 なら軒数 = max(0, -1)=0 (0.2), 0 (0.6), 1 (0.2) → 0軒 80%
let p0 = 0; for (const t of T) { const s = byId[t.st], c = Math.round(lamT[s.tier] * lamA[t.type]); p0 += c === 0 ? 0.8 : c === 1 ? 0.2 : 0; }
p('0軒の期待の割合（くじの形どおり）', (p0 / T.length * 100).toFixed(1) + '%');
for (const t of [8, 6, 5, 4, 3, 2, 1]) p(`段${t} 候補地`, T.filter(x => byId[x.st].tier === t).length);
p('段3・〜500m・商店街の候補地', T.filter(x => byId[x.st].tier === 3 && x.walk <= 500 && x.type === 'shoten').length);
p('段5 で λ×属性の四捨五入：', types.map(ty => `${ty} ${(1.5 * lamA[ty]).toFixed(2)}→${Math.round(1.5 * lamA[ty])}`).join(' '));
p('段3 商店街 λ 0.8 → 中心', Math.round(0.8));
