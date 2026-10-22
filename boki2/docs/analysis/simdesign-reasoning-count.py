#!/usr/bin/env python3
# BIZ-SIMDESIGN-v02-reasoning.md の表の判定を数える。
# 使い方: python3 -I boki2/docs/analysis/simdesign-reasoning-count.py          （0〜14章：版0.2 の検査。K の行の7列目）
#         python3 -I boki2/docs/analysis/simdesign-reasoning-count.py --sec 15 （15章：版0.3 の再検査。N の行の「判定」と「中身の判定」、応えの表）
import re, collections, os, sys
p = os.path.join(os.path.dirname(__file__), '..', 'audit', 'BIZ-SIMDESIGN-v02-reasoning.md')
txt = open(p, encoding='utf-8').read()
V = ('妥当', '弱い', '不当')
def v_of(c):
    c = c.replace('*', '').strip()
    return next((x for x in V if c.startswith(x)), '?')
if '--sec' in sys.argv and sys.argv[sys.argv.index('--sec') + 1] == '15':
    body = txt[txt.index('## 15. 版0.3の再検査'):]
    fin = collections.Counter(); con = collections.Counter(); ids = collections.defaultdict(list); seen = set()
    for line in body.splitlines():
        m = re.match(r'\| (N\d{3}) \|', line)
        if not m: continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if m.group(1) in seen: print('重複', m.group(1))
        seen.add(m.group(1)); f = v_of(cells[6]); c = v_of(cells[7])
        fin[f] += 1; con[c] += 1; ids[f].append(m.group(1))
        if f == '不当' and c != '不当': ids['形の不当'].append(m.group(1))
    print('版0.3 の結論：行', len(seen), '判定（形を当てた最終）', dict(fin), '／中身の判定', dict(con))
    for k in ('不当', '形の不当'): print(' ', k, '・'.join(ids[k]))
    resp = collections.Counter(); kinds = collections.Counter()
    for line in body.splitlines():
        m = re.match(r'\| (K\d{2,3})（(不当|弱い)） \|', line)
        if m:
            cells = [c.strip() for c in line.strip().strip('|').split('|')]
            resp[cells[-1]] += 1; kinds[m.group(2)] += 1
    print('版0.2 の不当・弱いへの応え：', dict(kinds), dict(resp))
    crit = collections.Counter()
    for line in body.splitlines():
        if re.match(r'\| 基準\d+[a-f]? \|', line):
            crit[[c.strip() for c in line.strip().strip('|').split('|')][-1]] += 1
    print('14章の基準への応え：', dict(crit))
else:
    body = txt[:txt.index('## 15. 版0.3の再検査')] if '## 15. 版0.3の再検査' in txt else txt
    cnt = collections.Counter(); ids = collections.defaultdict(list); seen = set()
    for line in body.splitlines():
        m = re.match(r'\| (K\d{2,3}) \|', line)
        if not m: continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        v = v_of(cells[6])
        if m.group(1) in seen: print('重複', m.group(1))
        seen.add(m.group(1)); cnt[v] += 1; ids[v].append(m.group(1))
    print('行', len(seen), dict(cnt), '合計', sum(cnt.values()))
    for k in ('不当', '弱い'): print(k, '・'.join(ids[k]))
