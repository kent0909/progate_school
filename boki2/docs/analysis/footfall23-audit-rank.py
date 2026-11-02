# -*- coding: utf-8 -*-
# BIZ-FOOTFALL23「うまくいく理由2」の確かめ：主要10駅の乗り換えの割合（D13 からの見積もり・D12）の順位相関
# 値は footfall23-count.out.txt の §1（D12 乗換え÷合計）・§7（見積もり1・見積もり2）から写した
# 実行：python3 -I boki2/docs/analysis/footfall23-audit-rank.py
d13 = {'新宿': 54, '渋谷': 65, '池袋': 58, '北千住': 81, '品川': 53, '東京': 47, '上野': 50, '下北沢': 56, '三軒茶屋': 14, '中目黒': 68}
d12 = {'新宿': 68, '渋谷': 66, '池袋': 77, '北千住': 83, '品川': 53, '東京': 56, '上野': 73, '下北沢': 71, '三軒茶屋': 28, '中目黒': 52}
def rk(v):
  o = sorted(v, key=lambda k: v[k]); r = {}; i = 0
  while i < len(o):
    j = i
    while j + 1 < len(o) and v[o[j + 1]] == v[o[i]]: j += 1
    for k in o[i:j + 1]: r[k] = (i + j) / 2
    i = j + 1
  return r
a, b = rk(d13), rk(d12); n = len(a); ks = list(a)
ma = sum(a.values()) / n; mb = sum(b.values()) / n
num = sum((a[k] - ma) * (b[k] - mb) for k in ks); den = (sum((a[k] - ma) ** 2 for k in ks) * sum((b[k] - mb) ** 2 for k in ks)) ** .5
print(f'主要10駅の順位相関（D13 見積もり と D12）：{num / den:.3f}')
x = {k: v for k, v in d13.items() if k not in ('北千住', '三軒茶屋')}; y = {k: d12[k] for k in x}
a, b = rk(x), rk(y); ks = list(a); n = len(ks); ma = sum(a.values()) / n; mb = sum(b.values()) / n
num = sum((a[k] - ma) * (b[k] - mb) for k in ks); den = (sum((a[k] - ma) ** 2 for k in ks) * sum((b[k] - mb) ** 2 for k in ks)) ** .5
print(f'北千住・三軒茶屋を除く8駅：{num / den:.3f}')
for k in d13: print(f'- {k}：D13 見積もり {d13[k]}%（順位 {rk(d13)[k] + 1:.1f}）・D12 {d12[k]}%（順位 {rk(d12)[k] + 1:.1f}）')
