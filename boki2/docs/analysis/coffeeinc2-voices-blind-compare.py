#!/usr/bin/env python3
# 目隠しの付け直し（coffeeinc2-voices-blind.md）と作り手の分類（coffeeinc2-voices-codes.md）の一致率
# 使い方：python3 -I boki2/docs/analysis/coffeeinc2-voices-blind-compare.py
# 番号の対応：目隠し側は count.py の ALL の順の 1〜160。作り手は #142・#149 を欠番にした 1〜162。
#   作り手の表の行の順はALLの順と同じ（目隠し 1〜141＝#1〜#141、142〜148＝#143〜#148、149〜160＝#150〜#162 ではなく #151〜#162、148＝#150）。
#   行の順で対応させ、本文で確かめた（例：目隠し143＝#144、159＝#161）。
# 引数 --selfcheck：作り手の自己点検（coffeeinc2-voices-codebook-selfcheck.md）の24件を作り手の側に当ててから比べる
import os, re, sys, collections
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import importlib.util
spec = importlib.util.spec_from_file_location('bc', os.path.join(HERE, 'coffeeinc2-voices-blind-count.py'))
bc = importlib.util.module_from_spec(spec); spec.loader.exec_module(bc)

blind = bc.load(); bc.check(blind)
mk = []
for line in open(os.path.join(HERE, 'coffeeinc2-voices-codes.md'), encoding='utf8'):
    m = re.match(r'^\|\s*(\d+)\s*\|\s*r[45]-cinc-[^|]*\|\s*\d\s*\|([^|]*)\|([^|]*)\|([^|]*)\|', line)
    if m:
        mk.append((int(m.group(1)), m.group(2).split(), m.group(3).split(), m.group(4).strip()))
assert len(mk) == 160
maker = {}
for i, (num, pr, co, tm) in enumerate(mk, 1):   # 作り手の表の行の順＝通し番号の順
    maker[i] = {'num': num, 'praise': pr, 'compl': co, 'time': tm}
N = 160
if '--selfcheck' in sys.argv:
    num2i = {m['num']: i for i, m in maker.items()}
    for n in (48, 65, 68, 71, 86, 96, 98, 102, 132):
        maker[num2i[n]]['praise'] = ['-']
    maker[num2i[161]]['praise'] = ['Z']
    for n in (16, 30, 47, 51, 52, 56, 61, 67, 76, 156, 160):
        maker[num2i[n]]['praise'] = maker[num2i[n]]['praise'] + ['U']   # 自己点検は Z を残したまま U を足している（Z 60→52 の計算）
    for n in (28, 53, 154):
        maker[num2i[n]]['praise'] = maker[num2i[n]]['praise'] + ['I']
    print('（作り手の側に自己点検の24件を当てた比較）')

def kappa(a, b, c, d):
    # a=両方あり b=作り手だけ c=目隠しだけ d=両方なし
    n = a + b + c + d; po = (a + d) / n
    pe = ((a + b) * (a + c) + (c + d) * (b + d)) / n / n
    return po, (po - pe) / (1 - pe) if pe < 1 else float('nan')

out = []
P = lambda *x: out.append(' '.join(str(v) for v in x))
for side, codes, label in (('praise', bc.PRAISE, '褒め'), ('compl', bc.COMPL, '不満')):
    ex = sum(1 for i in range(1, N + 1) if set(maker[i][side]) == set(blind[i][side]))
    P('%s：件ごとの完全一致 %d/%d = %.1f%%' % (label, ex, N, 100 * ex / N))
for_both = sum(1 for i in range(1, N + 1) if set(maker[i]['praise']) == set(blind[i]['praise']) and set(maker[i]['compl']) == set(blind[i]['compl']))
P('褒め・不満とも完全一致 %d/%d = %.1f%%' % (for_both, N, 100 * for_both / N))
# Jaccard の平均
for side, label in (('praise', '褒め'), ('compl', '不満')):
    js = [len(set(maker[i][side]) & set(blind[i][side])) / len(set(maker[i][side]) | set(blind[i][side])) for i in range(1, N + 1)]
    P('%s：件ごとの重なり（Jaccard）の平均 %.3f' % (label, sum(js) / N))
P('')
P('| 側 | 符号 | 作り手 | 目隠し | 差 | 両方 | 作り手だけ | 目隠しだけ | 一致率 | κ |')
P('|---|---|---|---|---|---|---|---|---|---|')
rows = []
for side, codes, label in (('praise', bc.PRAISE, '褒め'), ('compl', bc.COMPL, '不満')):
    for c in codes:
        a = sum(1 for i in range(1, N + 1) if c in maker[i][side] and c in blind[i][side])
        b = sum(1 for i in range(1, N + 1) if c in maker[i][side] and c not in blind[i][side])
        cc = sum(1 for i in range(1, N + 1) if c not in maker[i][side] and c in blind[i][side])
        d = N - a - b - cc
        po, k = kappa(a, b, cc, d)
        rows.append((label, c, a + b, a + cc, a, b, cc, po, k))
        P('| %s | %s | %d | %d | %+d | %d | %d | %d | %.1f%% | %s |' % (label, c, a + b, a + cc, a + cc - a - b, a, b, cc, 100 * po, ('%.2f' % k) if k == k else '—'))
P('')
# 符号ごとの κ の平均（件数で重みづけ）
for label in ('褒め', '不満'):
    rs = [r for r in rows if r[0] == label and r[2] + r[3] > 0 and r[8] == r[8]]
    w = sum(r[2] + r[3] for r in rs)
    P('%s：符号ごとの κ の加重平均（重み＝作り手＋目隠しの件数） %.2f' % (label, sum((r[2] + r[3]) * r[8] for r in rs) / w))
    # 全符号をまとめた 2x2（件×符号）
    a = sum(r[4] for r in rs); b = sum(r[5] for r in rs); c = sum(r[6] for r in rs); d = len(rs) * N - a - b - c
    po, k = kappa(a, b, c, d)
    P('%s：件×符号をまとめた κ %.2f（一致率 %.1f%%）' % (label, k, 100 * po))
P('')
P('食い違いの件（目隠しの番号 / 作り手の#：作り手 → 目隠し）')
for i in range(1, N + 1):
    m, bl = maker[i], blind[i]
    dp = set(m['praise']) != set(bl['praise']); dc = set(m['compl']) != set(bl['compl'])
    if dp or dc:
        P('  %3d / #%d：褒め %s → %s ｜ 不満 %s → %s' % (i, m['num'], ' '.join(m['praise']), ','.join(bl['praise']), ' '.join(m['compl']), ','.join(bl['compl'])))
print('\n'.join(out))
