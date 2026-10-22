#!/usr/bin/env python3
# BIZ-SIMDESIGN 0.2：simdesign-voices.tsv（口コミ83件の1件ずつの分類）を数える。
# 使い方: python3 -I boki2/docs/analysis/simdesign-voices-count.py
import csv, collections, os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'simdesign-voices.tsv')
R = [r for r in csv.DictReader((l for l in open(P, encoding='utf-8') if not l.startswith('#')), delimiter='\t')]
lab = lambda r, k: [x for x in r[k].split(';') if x and x != '-']
print('件数', len(R))
print('作品ごと', dict(collections.Counter(r['作品'] for r in R)))
print('星', dict(collections.Counter(r['星'] for r in R)))
print('期間（本文に書いてある人）', dict(collections.Counter(r['期間'] for r in R)))
for k in ('褒め', '不満', '辞めた'):
    c = collections.Counter(x for r in R for x in lab(r, k))
    print(k, '（重複あり、件数）', c.most_common(), ' 1つ以上ある口コミ', sum(1 for r in R if lab(r, k)))
L = [r for r in R if r['期間'] in ('1年', '数年', '長年')]
S = [r for r in R if r['期間'] in ('数時間', '2日')]
print('1年以上と書いた人', len(L), '褒め', collections.Counter(x for r in L for x in lab(r, '褒め')).most_common(), '不満', collections.Counter(x for r in L for x in lab(r, '不満')).most_common())
print('数日以内と書いた人', len(S), [(r['id'], r['褒め'], r['不満']) for r in S])
for g in ('PocketCity', 'SCB-iOS', 'SCB-And', 'RCT-Touch'):
    G = [r for r in R if r['作品'] == g]
    print(g, len(G), '件  褒め上位', collections.Counter(x for r in G for x in lab(r, '褒め')).most_common(3), ' 不満上位', collections.Counter(x for r in G for x in lab(r, '不満')).most_common(3))
