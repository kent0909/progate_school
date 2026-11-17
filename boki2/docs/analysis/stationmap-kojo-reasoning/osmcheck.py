# -*- coding: utf-8 -*-
# 論証の検査役（Opus 5.5、11/17）の確かめ。BIZ-RAMENCOUNT23 の結論 A・B・C の「半径・単位・網羅」を数え直す。
# 読むのは調べ物と同じ生データ（OSM の写し・tokyo23.js）だけ。ラーメン店の拾い方は count.py の RAMEN_RE と同じ式（23区の境の判定は省き、四角の中の点を使う）。
# 使い方：python3 -I osmcheck.py <research/raw/web/ramencount23> <js/data/tokyo23.js>
import csv, json, math, os, re, sys, random, statistics as st
RAW, T23 = sys.argv[1:3]
t = open(T23, encoding='utf8').read()
D, _ = json.JSONDecoder().raw_decode(t[t.index('SIM.tokyo23 = ') + len('SIM.tokyo23 = '):])
O = D['origin']; KX = 111.32 * math.cos(math.radians(35.68)); KY = 110.95
def xy(lat, lon): return ((lon - O[1]) * KX, (O[0] - lat) * KY)
ST = D['stations']; SITES = D['sites']; SID = {s['id']: s for s in ST}
RAMEN_RE = re.compile(r'ラーメン|らーめん|らあめん|ラーメソ|拉麺|拉麵|中華そば|中華蕎麦|支那そば|つけ麺|つけめん|担々麺|担担麺|坦々麺|まぜそば|油そば|家系|二郎|ramen', re.I)
FOODAM = {'restaurant', 'fast_food', 'food_court'}
R = []
with open(os.path.join(RAW, 'osm-overpass-kumi-eat23.html'), encoding='utf8') as fh:
  for r in csv.DictReader(fh, delimiter='\t'):
    try: lat, lon = float(r['@lat']), float(r['@lon'])
    except ValueError: continue
    cu = (r.get('cuisine') or '').lower(); nm = (r.get('name') or '') + ' ' + (r.get('name:en') or '')
    if r['amenity'] in FOODAM and ('ramen' in cu.split(';') or bool(RAMEN_RE.search(nm))): R.append(xy(lat, lon))
print(f'# ラーメン店の点（四角の中）{len(R)}')
def near(x, y, rad, pts): return [p for p in pts if (p[0] - x) ** 2 + (p[1] - y) ** 2 <= rad * rad]
TIERS = [1, 2, 3, 4, 5, 6, 8]
# ---- A・B：半径を変えたときの「店の数の比」と「1店あたりの人通りの比」（段8÷段1）----
print('\n## A・B 半径ごとの段8÷段1（駅の点から）')
print('| 半径 | 段1 店の平均 | 段8 店の平均 | 店の数の比（平均） | 1店あたりの人通り 合計どうし 段1・段8・比 | 駅ごとの中央（店1以上）比 | 0軒を0.5軒の中央 比 |')
print('|---|---|---|---|---|---|---|')
for rad in [0.3, 0.5, 0.8, 1.0]:
  row = {}
  for k in TIERS:
    a = [s for s in ST if s['tier'] == k]; c = [len(near(s['x'], s['y'], rad, R)) for s in a]
    row[k] = dict(mean=st.mean(c), fsum=sum(s['foot'] for s in a), csum=sum(c),
                  medpos=st.median([s['foot'] / n for s, n in zip(a, c) if n > 0]) if any(c) else None,
                  med05=st.median([s['foot'] / max(0.5, n) for s, n in zip(a, c)]))
  r1, r8 = row[1], row[8]
  pp1, pp8 = r1['fsum'] / r1['csum'], r8['fsum'] / r8['csum']
  print(f"| {int(rad*1000)}m | {r1['mean']:.2f} | {r8['mean']:.2f} | {r8['mean']/r1['mean']:.1f} | {pp1:,.0f}・{pp8:,.0f}・{pp8/pp1:.2f} | {r8['medpos']/r1['medpos']:.2f} | {r8['med05']/r1['med05']:.2f} |")
# ---- A：候補地（ピン）の単位で、段の形を λ・設計の軒数の期待と並べる ----
LAM = {1: 0.3, 2: 0.5, 3: 0.8, 4: 1.1, 5: 1.5, 6: 2.0, 8: 2.6}
ATTR = {'hanka': 1.4, 'shogyo': 1.2, 'office': 1.0, 'shoten': 1.0, 'jutaku': 0.6, 'kojo': 0.4}
def design(s):
  c = math.floor(LAM[SID[s["st"]]["tier"]] * ATTR[s["type"]] * 1.0 + 0.5)  # JS の Math.round と同じ（count.py の c と合わせる）
  ks = [(c - 1, 0.2), (c, 0.6), (c + 1, 0.2)]; e = 0; z = 0
  for k, p in ks:
    kk = min(5, max(0, k)); e += p * kk; z += p * (kk == 0)
  return e, z
print('\n## A 候補地の単位の段の形（段1を1）：OSM 200m・300m の平均、λ、設計の軒数の期待')
print('| 段 | 候補地 | OSM 200m | OSM 300m | λ | 設計の期待 |')
print('|---|---|---|---|---|---|')
base = {}
for k in TIERS:
  a = [s for s in SITES if SID[s['st']]['tier'] == k]
  m2 = st.mean([len(near(s['x'], s['y'], 0.2, R)) for s in a]); m3 = st.mean([len(near(s['x'], s['y'], 0.3, R)) for s in a])
  de = st.mean([design(s)[0] for s in a])
  if k == 1: base = dict(m2=m2, m3=m3, de=de)
  print(f"| {k} | {len(a)} | {m2/base['m2']:.2f}（{m2:.2f}） | {m3/base['m3']:.2f}（{m3:.2f}） | {LAM[k]/LAM[1]:.2f} | {de/base['de']:.2f}（{de:.2f}） |")
# ---- C：網羅の低さで0軒がどれだけ多めに出るか（点を間引いて、網羅を下げたときの0軒の割合の動きを見る）----
print('\n## C 間引きの試し：OSM の点を割合 t だけ残したときの、候補地 200m・300m の0軒の割合（乱数20回の平均）。t＝1 が今の OSM')
print('| 段 | 設計の0軒の確率 | 200m t=0.25・0.5・0.75・1 | 300m t=0.25・0.5・0.75・1 | 200m の t=2 への外挿（log(0軒) を t で直線） |')
print('|---|---|---|---|---|')
rng = random.Random(20261117)
pre = {}
for s in SITES:
  pre[s['id']] = {0.2: near(s['x'], s['y'], 0.2, R), 0.3: near(s['x'], s['y'], 0.3, R)}
for k in TIERS:
  a = [s for s in SITES if SID[s['st']]['tier'] == k]
  dz = st.mean([design(s)[1] for s in a]); out = {}
  for rad in [0.2, 0.3]:
    zs = []
    for tt in [0.25, 0.5, 0.75, 1.0]:
      if tt == 1.0: zs.append(sum(1 for s in a if not pre[s['id']][rad]) / len(a)); continue
      v = []
      for rep in range(20):
        v.append(sum(1 for s in a if not any(rng.random() < tt for _ in pre[s['id']][rad])) / len(a))
      zs.append(st.mean(v))
    out[rad] = zs
  z = out[0.2]; ts = [0.5, 0.75, 1.0]; ly = [math.log(max(1e-6, x)) for x in z[1:]]
  mt, my = st.mean(ts), st.mean(ly); b = sum((x - mt) * (y - my) for x, y in zip(ts, ly)) / sum((x - mt) ** 2 for x in ts)
  ext = math.exp(my + b * (2 - mt))
  print(f"| {k} | {dz:.0%} | " + '・'.join(f'{x:.0%}' for x in out[0.2]) + ' | ' + '・'.join(f'{x:.0%}' for x in out[0.3]) + f' | {ext:.0%} |')
