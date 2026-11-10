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
print('| 段 | 駅 | foot の中央（万） | ピンの数の中央 | foot÷ピン の中央（万） | 事業所の中央 | foot÷事業所 の中央 |')
print('|---|---|---|---|---|---|---|')
M = {}
for k in sorted(set(r['tier'] for r in rows)):
  a = [r for r in rows if r['tier'] == k]
  pp = [r['foot'] / r['pins'] for r in a if r['pins'] > 0]
  fe = [r['foot'] / r['est'] for r in a if r['est']]
  M[k] = dict(foot=stt.median([r['foot'] for r in a]), pp=stt.median(pp), fe=stt.median(fe))
  print(f"| {k} | {len(a)} | {M[k]['foot']/1e4:.1f} | {stt.median([r['pins'] for r in a])} | {M[k]['pp']/1e4:.2f} | {stt.median([r['est'] for r in a if r['est'] is not None]):.0f} | {M[k]['fe']:.0f} |")
r_foot = M[8]['foot'] / M[1]['foot']; r_pp = M[8]['pp'] / M[1]['pp']; r_fe = M[8]['fe'] / M[1]['fe']
S = round(math.sqrt(r_pp * r_fe), 1)
print(f'段8÷段1：foot {r_foot:.1f}倍・ピン1本あたり {r_pp:.2f}倍・事業所1つあたり {r_fe:.2f}倍 → 段の比 S＝√({r_pp:.2f}×{r_fe:.2f})＝{S}')
print(f'（事業所の数がない駅 {sum(1 for r in rows if not r["est"])}。事業所0・メッシュなしは事業所1つあたりから除く）')
cnt = {}
for s in sites:
  k = (next(x['tier'] for x in st if x['id'] == s['st']), s['type']); cnt[k] = cnt.get(k, 0) + 1
at = {}; ti = {}
for (k, ty), n in cnt.items(): at[ty] = at.get(ty, 0) + n; ti[k] = ti.get(k, 0) + n
print('属性ごとの候補地：' + json.dumps(at, ensure_ascii=False) + '  段ごと：' + json.dumps(dict(sorted(ti.items()))))
print('10%と2か所の大きいほう（⑪⑫で上位30%に要る数）：属性 ' + json.dumps({k: max(2, math.ceil(0.1 * n)) for k, n in at.items()}) + '・段 ' + json.dumps({k: max(2, math.ceil(0.1 * n)) for k, n in sorted(ti.items())}))
# ⑦ 案A：繁華街の day の読み
med = stt.median
H = [s for s in sites if s['type'] == 'hanka' and s.get('day') is not None]
def L(dd, f, nu, kap=0.6, fm=0.0708):
  d2 = dd * (1 - nu * f) / (dd * (1 - nu * f) + (1 - dd)) if nu else dd
  Nt = max(0.05, (1 - d2) + kap * (f / fm - 1)); return d2 / (d2 + Nt)
for nu in (0, 0.3, 0.5, 0.8):
  print(f'ν {nu}：繁華街 {len(H)}本の L の中央 {med([L(s["day"], s["food"], nu) for s in H]):.3f}・全候補地の L の中央 {med([L(s["day"], s["food"], nu) for s in sites if s.get("day") is not None]):.3f}')
