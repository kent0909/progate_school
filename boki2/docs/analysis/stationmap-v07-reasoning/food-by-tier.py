# -*- coding: utf-8 -*-
# 版0.7 の論証の検査（論証検査役、11/5）：駅の段ごとの「宿泊・飲食サービス業の事業所数」（経済センサス2021、駅を含む500mメッシュ）。
# 設計書 版0.7 の λ の段の形（段1 0.6 … 段8 5.2、比 8.7倍）と、人通りの段の比 1:6 を、手元にある店の集まりの数と並べるため。
# ラーメン店の数ではない（宿泊・飲食の全部）。メッシュの読み方は docs/analysis/footfall23-count.py の meshvals と同じ（関数を写した）。
# 実行：python3 -I boki2/docs/analysis/stationmap-v07-reasoning/food-by-tier.py boki2/research/raw/web/footfall23 boki2/js/data/tokyo23.js
import json, math, os, sys, zipfile, statistics
RAW, T23 = sys.argv[1], sys.argv[2]
t = open(T23, encoding='utf8').read()
d, _ = json.JSONDecoder().raw_decode(t[t.index('SIM.tokyo23 = ') + len('SIM.tokyo23 = '):])
ORIGIN = d['origin']; KX = 111.32 * math.cos(math.radians(35.68)); KY = 110.95
def latlon(x, y): return (ORIGIN[0] - y / KY, ORIGIN[1] + x / KX)
def mesh3(lat, lon):
  p = int(lat * 1.5); a = lat * 60 - p * 40
  u = int(lon - 100); f = lon - 100 - u
  q = int(a / 5); v = int(f * 60 / 7.5)
  b = a - q * 5; g = f * 60 - v * 7.5
  r = int(b * 60 / 30); w = int(g * 60 / 45)
  b2 = b * 60 - r * 30; g2 = g * 60 - w * 45
  m4 = 1 + (1 if g2 >= 22.5 else 0) + (2 if b2 >= 15 else 0)
  c3 = f'{p:02d}{u:02d}{q}{v}{r}{w}'
  return c3, c3 + str(m4)
def readmesh(fn, cols):
  z = zipfile.ZipFile(os.path.join(RAW, fn)); txt = z.read(z.namelist()[0]).decode('cp932', 'replace').splitlines()
  head = txt[0].split(','); idx = {c: head.index(c) for c in cols}
  out = {}
  for line in txt[2:]:
    r = line.split(',')
    def num(x):
      try: return int(x)
      except: return None
    out[r[0]] = {c: num(r[idx[c]]) for c in cols}
  return out
EMP5 = readmesh('estat-T001162-5339.xlsx', ['T001162015'])
rows = []
for s in d['stations']:
  lat, lon = latlon(s['x'], s['y']); _, c4 = mesh3(lat, lon)
  f5 = (EMP5.get(c4) or {}).get('T001162015')
  if f5 is None or not s.get('foot'): continue
  rows.append((s['tier'], s['foot'], f5, s['name']))
print(f'駅 {len(rows)}（500m メッシュの宿泊・飲食の事業所数があり foot>0）')
lam = {1: 0.6, 2: 1.0, 3: 1.6, 4: 2.2, 5: 3.0, 6: 4.0, 8: 5.2}
tier = {1: 0.7, 2: 0.96, 3: 1.26, 4: 1.62, 5: 2.25, 6: 3.0, 8: 4.2}
med1 = statistics.median([r[2] for r in rows if r[0] == 1])
print('| 段 | 駅 | foot の中央（万） | 宿泊・飲食の事業所の中央 | 段1との比 | 版0.7 の λ の段1との比 | 版0.7 の人通りの段の段1との比 |')
print('|---|---|---|---|---|---|---|')
for k in sorted(set(r[0] for r in rows)):
  a = [r for r in rows if r[0] == k]; m = statistics.median([r[2] for r in a])
  print(f'| {k} | {len(a)} | {statistics.median([r[1] for r in a]) / 1e4:.1f} | {m:.0f} | {m / med1:.2f} | {lam[k] / lam[1]:.2f} | {tier[k] / tier[1]:.2f} |')
# 対数の傾き（最小二乗）：log(事業所) = a + β log(foot)
xs = [math.log(r[1]) for r in rows if r[2] > 0]; ys = [math.log(r[2]) for r in rows if r[2] > 0]
mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
beta = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
print(f'log(事業所) を log(foot) で回帰した傾き β＝{beta:.2f}（事業所0の駅 {sum(1 for r in rows if r[2] == 0)} を除く。68倍の foot で事業所は {68 ** beta:.1f} 倍）')
for k in (8, 6, 5):
  print(f'段{k}：' + '・'.join(f'{r[3]} {r[2]}' for r in rows if r[0] == k))
