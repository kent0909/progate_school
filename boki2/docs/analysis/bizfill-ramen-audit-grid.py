#!/usr/bin/env python3
"""BIZ-FILL-RAMEN 1.1 の再判定（判定役）：2.7 のオーナーの例の格子を、書き手の fill-ramen-region-v2.py を使わずに書き直して数える。
営業日はスクリプトの (22, 25) と本文の (20, 25) の両方。あわせて 2.4 の奥多摩の表を、その他の固定費を 1.0 の20万円にした時の値。
使い方: python3 -I boki2/docs/analysis/bizfill-ramen-audit-grid.py
"""
import itertools
T=58.6/3.305785; W=1280
def m(c,p,rent,hrs,other,debt,own,days,cost): return c*days*p*(1-cost)-(rent+hrs*days*W+other+debt+own)
n=h=0; ns=hs=0
for H,own,other,debt,cost,days in itertools.product((0,4,8,12,16,24),(0,5e4,1e5,1.5e5,2e5,3e5),(1.5e5,2e5,2.5e5),(0,8e4),(.3,.35),(22,25)):
  for gp,gt,ga in itertools.product((617,800,1000,1300,1500),(36250,42497,85000),(10,T)):
    for op,orent in itertools.product((747,890,1000),(0,3e4,6e4,1e5)):
      a=m(100,gp,gt*ga,H,other,debt,own,days,cost)<0; b=m(30,op,orent,H,other,debt,own,days,cost)>=0
      n+=1; h+=a and b
      if gp>=800 and gt<=42497: ns+=1; hs+=a and b
print(n,h,h/n*100, ns,hs,hs/ns*100)
# 営業日を報告の文の 20/25 にした時
n=h=0
for H,own,other,debt,cost,days in itertools.product((0,4,8,12,16,24),(0,5e4,1e5,1.5e5,2e5,3e5),(1.5e5,2e5,2.5e5),(0,8e4),(.3,.35),(20,25)):
  for gp,gt,ga in itertools.product((617,800,1000,1300,1500),(36250,42497,85000),(10,T)):
    for op,orent in itertools.product((747,890,1000),(0,3e4,6e4,1e5)):
      a=m(100,gp,gt*ga,H,other,debt,own,days,cost)<0; b=m(30,op,orent,H,other,debt,own,days,cost)>=0
      n+=1; h+=a and b
print('20/25日', n,h,h/n*100)
# 奥多摩表をその他20万（1.0 の値）で
for st,hr in ((0,0),(1,6)):
  print(st, [round(m(30,890,6e4,st*hr,2e5,8e4,o,25,.3)/1e4,1) for o in (0,1.5e5,3e5)])
