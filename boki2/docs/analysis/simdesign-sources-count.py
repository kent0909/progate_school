#!/usr/bin/env python3
# BIZ-SIMDESIGN 0.2：引いた資料の台帳 simdesign-sources.tsv を数える。使い方: python3 -I boki2/docs/analysis/simdesign-sources-count.py
import csv, collections, os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'simdesign-sources.tsv')
R = [r for r in csv.DictReader((l for l in open(P, encoding='utf-8') if not l.startswith('#')), delimiter='\t')]
print('資料の合計', len(R))
print('区分', dict(collections.Counter(r['区分'] for r in R)))
print('種類（全体）', collections.Counter(r['種類'] for r in R).most_common())
print('種類（新規だけ）', collections.Counter(r['種類'] for r in R if r['区分'] == '新規').most_common())
n = len(R); top = collections.Counter(r['種類'] for r in R).most_common(1)[0]
print('最も多い種類の割合 %s %d/%d = %.0f%%' % (top[0], top[1], n, 100 * top[1] / n))
D = [r for r in R if r['区分'] == '新規' and r['数える'] == '1']
print('新規の作り手の話（受け入れの基準2で数えるもの）', len(D), sorted(set(r['作品'] for r in D)))
print('新規の作り手の話で数えないもの', [r['doc'] for r in R if r['区分'] == '新規' and r['数える'] == '0'])
print('作品ごとの資料の数（作品名つきのもの）', collections.Counter(r['作品'] for r in R if not r['作品'].startswith('（')).most_common())
