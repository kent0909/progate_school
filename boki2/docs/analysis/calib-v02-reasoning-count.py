#!/usr/bin/env python3
# docs/audit/BIZ-CALIB-v02-reasoning.md の結論ごとの表から、判定（妥当・弱い・不当）を数える。
# 数える行：表の1列目が番号（英字で始まる）で、7列目が判定の行。判定の欄の ** は外して読む。
# 使い方：python3 -I boki2/docs/analysis/calib-v02-reasoning-count.py [検査書のパス]
import re, sys, collections
path = sys.argv[1] if len(sys.argv) > 1 else 'boki2/docs/audit/BIZ-CALIB-v02-reasoning.md'
rows = []
sec = None
for ln in open(path, encoding='utf-8'):
    if ln.startswith('## '): sec = ln.strip()[3:]
    if not ln.startswith('|') or ln.startswith('|---'): continue
    cells = [c.strip() for c in ln.strip().strip('|').split('|')]
    if len(cells) < 8 or not re.match(r'^[A-Z][A-Za-z0-9・〜]*$', cells[0]): continue
    j = cells[6].replace('*', '').strip()
    if j not in ('妥当', '弱い', '不当'): continue
    rows.append((cells[0], j, sec))
c = collections.Counter(j for _, j, _ in rows)
ids = [i for i, _, _ in rows]
dup = [i for i, n in collections.Counter(ids).items() if n > 1]
print(f'判定の行 {len(rows)}：妥当 {c["妥当"]}・弱い {c["弱い"]}・不当 {c["不当"]}')
if dup: print('番号の重複：', dup)
by = collections.OrderedDict()
for i, j, s in rows: by.setdefault(s, collections.Counter())[j] += 1
print('\n| 章 | 妥当 | 弱い | 不当 | 計 |\n|---|---|---|---|---|')
for s, k in by.items(): print(f'| {s} | {k["妥当"]} | {k["弱い"]} | {k["不当"]} | {sum(k.values())} |')
for lab in ('不当', '弱い'):
    print(f'\n{lab}（{c[lab]}）：' + '・'.join(i for i, j, _ in rows if j == lab))
