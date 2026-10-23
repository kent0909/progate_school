#!/usr/bin/env python3
# BIZ-GROWTH 9.3 の数え直し（2026-10-23）：robots.txt の禁じる経路（J-STAGE の PDF）から取った2本
# （r5-growth-js-fc-ranyo2015・r5-growth-js-cvs-part2024）の行を除いて、bizgrowth-fc-voices.tsv を数える。
# 使い方：python3 -I boki2/docs/analysis/bizgrowth-fc-voices-robots.py
import csv, collections, os
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bizgrowth-fc-voices.tsv')
rows = list(csv.DictReader(open(p, encoding='utf8'), delimiter='\t'))
drop = {'r5-growth-js-fc-ranyo2015', 'r5-growth-js-cvs-part2024'}
keep = [r for r in rows if r['source'] not in drop]
print('全行', len(rows), '／除いた', len(rows) - len(keep), '／残り', len(keep))
print('資料ごと', dict(collections.Counter(r['source'] for r in keep)))
print('種類', dict(collections.Counter(r['kind'] for r in keep)))
print('業種', dict(collections.Counter(r['industry'] for r in keep)))
j = [r for r in keep if r['kind'] == '判例']
print('判例', len(j), '結果', dict(collections.Counter(r['result'] for r in j)))
print('外食の判例', [r['case'] for r in j if r['industry'] == '外食'])
print('争点', dict(collections.Counter(r['topic'] for r in keep)))
