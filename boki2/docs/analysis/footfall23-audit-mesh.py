# -*- coding: utf-8 -*-
# BIZ-FOOTFALL23 の判定：北千住・品川・三軒茶屋のメッシュの値を、元の台本と別の書き方（緯度経度を秒にして整数で割る）で数え直す
# 実行：python3 -I boki2/docs/analysis/footfall23-audit-mesh.py boki2/research/raw/web/footfall23 boki2/js/data/tokyo23.js
import sys, os, json, math, zipfile, io, csv
RAW, T23 = sys.argv[1], sys.argv[2]
t = open(T23, encoding='utf8').read(); d, _ = json.JSONDecoder().raw_decode(t[t.index('SIM.tokyo23 = ') + 14:])
O = d['origin']; KX = 111.32 * math.cos(math.radians(35.68)); KY = 110.95
def mesh(lat, lon):
  la = lat * 3600; lo = (lon - 100) * 3600          # 秒
  p, la = divmod(la, 2400); u, lo = divmod(lo, 3600) # 1次：緯度40分・経度1度
  q, la = divmod(la, 300); v, lo = divmod(lo, 450)   # 2次：5分・7.5分
  r, la = divmod(la, 30); w, lo = divmod(lo, 45)     # 3次：30秒・45秒
  s = 1 + (1 if lo >= 22.5 else 0) + (2 if la >= 15 else 0)
  c = f'{int(p)}{int(u)}{int(q)}{int(v)}{int(r)}{int(w)}'; return c, c + str(s)
def table(fn, col):
  z = zipfile.ZipFile(os.path.join(RAW, fn)); rows = list(csv.reader(io.TextIOWrapper(z.open(z.namelist()[0]), encoding='cp932')))
  i = rows[0].index(col); return {r[0]: r[i] for r in rows[2:]}
P1, P5 = table('estat-T001140-5339.xlsx', 'T001140001'), table('estat-T001141-5339.xlsx', 'T001141001')
E1, E5 = table('estat-T001157-5339.xlsx', 'T001157022'), table('estat-T001162-5339.xlsx', 'T001162022')
F5, FE5 = table('estat-T001162-5339.xlsx', 'T001162015'), table('estat-T001162-5339.xlsx', 'T001162036')
for s in d['stations']:
  if s['name'] not in ('北千住', '品川', '三軒茶屋'): continue
  lat, lon = O[0] - s['y'] / KY, O[1] + s['x'] / KX; c3, c4 = mesh(lat, lon)
  p1, e1 = int(P1[c3]), int(E1[c3])
  print(f"{s['name']} 緯度{lat:.4f} 経度{lon:.4f} 1km {c3}：夜間 {p1:,}・従業者 {e1:,}・L {e1 / (e1 + p1):.2f}／500m {c4}：夜間 {P5.get(c4)}・従業者 {E5.get(c4)}・宿泊飲食の事業所 {F5.get(c4)}・宿泊飲食の従業者 {FE5.get(c4)}・割合 {int(FE5[c4]) / int(E5[c4]):.1%}")
