#!/usr/bin/env python3
# BIZ-SIMDESIGN-v02-reasoning.md の表の「判定」の列（7列目）を数える。
# 使い方: python3 -I boki2/docs/analysis/simdesign-reasoning-count.py
import re, collections, os
p = os.path.join(os.path.dirname(__file__), '..', 'audit', 'BIZ-SIMDESIGN-v02-reasoning.md')
cnt = collections.Counter(); ids = collections.defaultdict(list); seen = set()
for line in open(p, encoding='utf-8'):
    m = re.match(r'\| (K\d{2,3}) \|', line)
    if not m: continue
    cells = [c.strip() for c in line.strip().strip('|').split('|')]
    v = cells[6].replace('*', '')
    v = next((x for x in ('妥当', '弱い', '不当') if v.startswith(x)), '?')
    if m.group(1) in seen: print('重複', m.group(1))
    seen.add(m.group(1)); cnt[v] += 1; ids[v].append(m.group(1))
print('行', len(seen), dict(cnt), '合計', sum(cnt.values()))
for k in ('不当', '弱い'): print(k, '・'.join(ids[k]))
