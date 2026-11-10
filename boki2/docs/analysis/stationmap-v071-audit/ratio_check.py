# -*- coding: utf-8 -*-
# 版0.7.1 の試し（戦略構想・管理 Opus 5.5、11/10）：sim を回さない、データだけの数。
# 1. 段ごとの駅の人通り foot・ピンの数・ピン1本あたりの人通り（foot÷ピン）・飲食の事業所1つあたりの人通り（foot÷事業所）の中央値と、段8÷段1 の比
# 2. 段の比 S の規則（PLAN.md 3章）：S＝√(ピン1本あたりの比 × 事業所1つあたりの比) を小数1桁に丸める
# 3. 属性・段ごとの候補地の数（⑪⑫の「2か所以上」が数として満たせるか）
# 4. 繁華街の day・food と、day の読みを直す式（⑦ 案A：day'＝d(1−νf)/(d(1−νf)+(1−d))）での L の中央値（κ0.6）
# 事業所の数は経済センサス2021 の500mメッシュの宿泊業・飲食サービス業の事業所（T001162015）。メッシュの読み方は
# docs/analysis/footfall23-count.py と同じ（論証の検査役の food-by-tier.py と同じ式を、自分で書き直した）。ラーメン店の数ではない。
# 実行：python3 -I boki2/docs/analysis/stationmap-v071-draft/facts71.py boki2/research/raw/web/footfall23 boki2/js/data/tokyo23.js
import json, math, os, sys, zipfile, statistics as stt
RAW, T23 = sys.argv[1], sys.argv[2]
t = open(T23, encoding='utf8').read()
d, _ = json.JSONDecoder().raw_decode(t[t.index('SIM.tokyo23 = ') + len('SIM.tokyo23 = '):])
O = d['origin']; KX = 111.32 * math.cos(math.radians(35.68)); KY = 110.95
def mesh4(x, y):
  lat, lon = O[0] - y / KY, O[1] + x / KX
  p = int(lat * 1.5); a = lat * 60 - p * 40; u = int(lon - 100); f = lon - 100 - u
  q = int(a / 5); v = int(f * 60 / 7.5); b = a - q * 5; g = f * 60 - v * 7.5
  r = int(b * 60 / 30); w = int(g * 60 / 45); b2 = b * 60 - r * 30; g2 = g * 60 - w * 45
  return f'{p:02d}{u:02d}{q}{v}{r}{w}' + str(1 + (1 if g2 >= 22.5 else 0) + (2 if b2 >= 15 else 0))
z = zipfile.ZipFile(os.path.join(RAW, 'estat-T001162-5339.xlsx')); lines = z.read(z.namelist()[0]).decode('cp932', 'replace').splitlines()
ci = lines[0].split(',').index('T001162015'); EST = {}
for ln in lines[2:]:
  c = ln.split(',')
  try: EST[c[0]] = int(c[ci])
  except: pass
st = d['stations']; sites = d['sites']
pins = {}
for s in sites: pins[s['st']] = pins.get(s['st'], 0) + 1
rows = []
for s in st:
  if not s.get('foot'): continue
  e = EST.get(mesh4(s['x'], s['y']))
  rows.append(dict(tier=s['tier'], foot=s['foot'], pins=pins.get(s['id'], 0), est=e, name=s['name']))
# 判定役が足した所：段8÷段1 を「駅ごとの比の中央値どうし」と「中央値どうしの比」の両方で、丸めずに出す
for k in (1, 8):
  a = [r for r in rows if r['tier'] == k]
  print(k, 'n', len(a), 'foot med', stt.median([r['foot'] for r in a]), 'pins med', stt.median([r['pins'] for r in a]), 'est med', stt.median([r['est'] for r in a if r['est'] is not None]))
def mm(k, f):
  return stt.median([f(r) for r in rows if r['tier'] == k and f(r) is not None])
pp = lambda r: r['foot'] / r['pins'] if r['pins'] > 0 else None
fe = lambda r: r['foot'] / r['est'] if r['est'] else None
r_pp = mm(8, pp) / mm(1, pp); r_fe = mm(8, fe) / mm(1, fe)
print('駅ごとの比の中央値どうし：ピン', round(r_pp, 4), '事業所', round(r_fe, 4), '幾何平均', round(math.sqrt(r_pp * r_fe), 4))
fm = lambda k: stt.median([r['foot'] for r in rows if r['tier'] == k])
pm = lambda k: stt.median([r['pins'] for r in rows if r['tier'] == k])
em = lambda k: stt.median([r['est'] for r in rows if r['tier'] == k and r['est'] is not None])
a = (fm(8) / pm(8)) / (fm(1) / pm(1)); b = (fm(8) / em(8)) / (fm(1) / em(1))
print('中央値どうしの比：ピン', round(a, 4), '事業所', round(b, 4))
print('丸めた数（論証の検査役の書き方 100.2万/8 ÷ 1.5万/1、100.2/293 ÷ 1.5/23）', round((100.2/8)/(1.5/1), 3), round((100.2/293)/(1.5/23), 3))
print('最小〜最大（4つ）', round(min(r_pp, r_fe, a, b), 2), round(max(r_pp, r_fe, a, b), 2))
