#!/usr/bin/env python3
# docs/audit/BIZ-CALIB-v02-reasoning.md の結論ごとの表から、判定（妥当・弱い・不当）を数える。
# 数える行：表の1列目が番号（英字で始まる）で、7列目が判定の行。判定の欄の ** は外して読む。
# --sec 11 を付けると、見出し「## 11.」の章（版0.3の再検査）だけを数え、あわせて「応え」の表（4列目が 応えた・一部・応えていない）を数える。
# 付けないときは 0〜10章（版0.2の検査）だけを数える（版0.2の数 241行を変えないため）。--sec 12 は版0.4の再検査。
# 使い方：python3 -I boki2/docs/analysis/calib-v02-reasoning-count.py [--sec 11] [検査書のパス]
import re, sys, collections
args = sys.argv[1:]
want = None
if '--sec' in args:
    i = args.index('--sec'); want = args[i + 1]; del args[i:i + 2]
path = args[0] if args else 'boki2/docs/audit/BIZ-CALIB-v02-reasoning.md'
rows, resp = [], []
sec = sub = None
for ln in open(path, encoding='utf-8'):
    if ln.startswith('## '): sec = ln.strip()[3:]; sub = None
    if ln.startswith('### '): sub = ln.strip()[4:]
    insec = (sec or '').startswith(want + '.') if want else not (sec or '').startswith(('11.', '12.'))
    if not insec or not ln.startswith('|') or ln.startswith('|---'): continue
    cells = [c.strip() for c in ln.strip().strip('|').split('|')]
    if not cells or not re.match(r'^[A-Z][A-Za-z0-9・〜]*$', cells[0]): continue
    if len(cells) >= 8 and cells[6].replace('*', '').strip() in ('妥当', '弱い', '不当'):
        rows.append((cells[0], cells[6].replace('*', '').strip(), sub if want else sec))
    elif len(cells) >= 5 and cells[3] in ('応えた', '一部', '応えていない'):
        resp.append((cells[0], cells[1], cells[3]))
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
if resp:
    r = collections.Counter(s for _, _, s in resp)
    nb = sum(1 for _, v, _ in resp if v == '不当'); nw = sum(1 for _, v, _ in resp if v == '弱い')
    head = f'（前の判定：不当 {nb}・弱い {nw}）' if nb + nw else ''
    print(f'\n応えの表 {len(resp)}行{head}：応えた {r["応えた"]}・一部 {r["一部"]}・応えていない {r["応えていない"]}')
    print('一部：' + '・'.join(i for i, _, s in resp if s == '一部'))
    if r['応えていない']: print('応えていない：' + '・'.join(i for i, _, s in resp if s == '応えていない'))
