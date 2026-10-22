#!/usr/bin/env python3
"""都市別の中華そば（外食）の価格の分布（BIZ-FILL-CALIB の PRICE）。
資料：小売物価統計調査（動向編）第1表 主要品目の都市別小売価格 2026年7月 第1部（e-Stat の Excel）。取得と読了ノートは並行の担当
（BIZ-FILL-RAMEN、doc 名 r6-fill-kouri-toshi-b0011-202607）。この報告では同じ原文の中華そばの行を自分で数え直す。
使い方: python3 -I boki2/docs/analysis/fill-calib-price.py
"""
import os, subprocess, statistics as st
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
f = os.path.join(ROOT, 'research', 'raw', 'web', 'ramen', 'r6-fill-kouri-toshi-b0011-202607.html')
t = subprocess.run(['python3', '-I', os.path.join(ROOT, 'tools', 'sheet-text.py'), f], capture_output=True, text=True).stdout.split('\n')
head = next(l.split('\t') for l in t if '札幌市' in l and '那覇市' in l)
row = next(l.split('\t') for l in t if '中華そば(外食)' in l)
i0 = head.index('札幌市')
cities = head[i0:]; vals = row[i0:i0 + len(cities)]
pairs = [(c, int(v)) for c, v in zip(cities, vals) if v.strip().isdigit()]
v = sorted(x for _, x in pairs)
q = st.quantiles(v, n=4)
print(f'市の数 {len(pairs)}、中央値 {st.median(v):.0f}円、平均 {st.mean(v):.0f}円、標準偏差 {st.pstdev(v):.0f}、下位25%の境 {q[0]:.0f}円、上位25%の境 {q[2]:.0f}円')
print('最低3市:', sorted(pairs, key=lambda x: x[1])[:3]); print('最高3市:', sorted(pairs, key=lambda x: -x[1])[:3])
print(f'最高÷最低 {max(v) / min(v):.2f}、上位25%の境÷下位25%の境 {q[2] / q[0]:.2f}')
for c in ('東京都区部', '大阪市', '名古屋市', '札幌市', '福岡市', '山形市'):
    print(c, dict(pairs).get(c))
