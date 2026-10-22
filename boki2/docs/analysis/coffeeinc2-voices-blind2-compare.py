#!/usr/bin/env python3
# 目隠しの付け直し（2回目）と、作り手の第2版・1回目の目隠しとの一致率
# 使い方：python3 -I boki2/docs/analysis/coffeeinc2-voices-blind2-compare.py
# 番号の対応：2回目・1回目の目隠しは count.py の切り出し順の 1〜160。作り手の表は自分の通し番号（142・149 が欠番の 1〜162）
#   なので、表の行の順に 1〜160 へ振り直す（星の列が切り出しの星と160件すべて一致することで確かめる）
import re, os, collections
HERE = os.path.dirname(os.path.abspath(__file__))
PRAISE = list('LDISTRUFCGVAWHOZ') + ['-']
COMPL = list('abcdefghmijklnopqxy') + ['-']

def table(path, cols):
    """cols = (番号, 褒め, 不満, 時期) の列位置。符号は空白かカンマで区切る"""
    out = []
    for l in open(path, encoding='utf8'):
        if not re.match(r'^\| \d+ \|', l):
            continue
        c = [x.strip() for x in l.strip().strip('|').split('|')]
        sp = lambda s: set(x for x in re.split(r'[\s,]+', s) if x)
        out.append((int(c[cols[0]]), sp(c[cols[1]]), sp(c[cols[2]]), c[cols[3]] if len(c) > cols[3] else '', c))
    return out

B2 = {n: (p, q, t) for n, p, q, t, _ in table(os.path.join(HERE, 'coffeeinc2-voices-blind2.md'), (0, 3, 4, 5))}
B1 = {n: (p, q, t) for n, p, q, t, _ in table(os.path.join(HERE, 'coffeeinc2-voices-blind.md'), (0, 1, 2, 3))}
mk = table(os.path.join(HERE, 'coffeeinc2-voices-codes.md'), (0, 3, 4, 5))
MK = {i + 1: (p, q, t) for i, (n, p, q, t, c) in enumerate(mk)}
MKNO = {i + 1: n for i, (n, p, q, t, c) in enumerate(mk)}
MKSTAR = {i + 1: int(c[2]) for i, (n, p, q, t, c) in enumerate(mk)}

# 星で番号の対応を確かめる（切り出しは count.py の1〜48行と同じ）
p = os.path.join(HERE, 'coffeeinc2-voices-count.py')
src = open(p, encoding='utf8').read().split('# ---- 2.')[0]
ns = {'__file__': p}
exec(compile(src.replace('print(', '(lambda *a, **k: None)('), p, 'exec'), ns)
assert len(ns['ALL']) == 160 and all(ns['ALL'][i - 1]['stars'] == MKSTAR[i] for i in range(1, 161)), '作り手の表の行の順と切り出しの順が合わない'
for D in (B2, B1, MK):
    assert sorted(D) == list(range(1, 161))
IDS = range(1, 161)
WHO = {'B2': ('2回目の目隠し', B2), 'MK': ('作り手の第2版', MK), 'B1': ('1回目の目隠し', B1)}

def kappa(a, b, c, d):
    n = a + b + c + d
    po = (a + d) / n
    pe = ((a + b) * (a + c) + (c + d) * (b + d)) / n / n
    return None if pe == 1 else (po - pe) / (1 - pe)

def fmt(k):
    return '—' if k is None else '%.2f' % k

def pair(x, y, out):
    nx, X = WHO[x]; ny, Y = WHO[y]
    out.append('\n### %s × %s\n' % (nx, ny))
    ep = sum(X[i][0] == Y[i][0] for i in IDS)
    en = sum(X[i][1] == Y[i][1] for i in IDS)
    eb = sum(X[i][0] == Y[i][0] and X[i][1] == Y[i][1] for i in IDS)
    out.append('- 件ごとの完全一致：褒め %d/160（%.1f%%）・不満 %d/160（%.1f%%）・両方 %d/160（%.1f%%）' % (ep, ep / 1.6, en, en / 1.6, eb, eb / 1.6))
    if y == 'B1':  # 1回目は第1版の定義書（x・y がない）で付けたので、x・y を除いて比べた値も出す
        dr = lambda s: (s - {'x', 'y'}) or {'-'}
        en2 = sum(dr(X[i][1]) == dr(Y[i][1]) for i in IDS)
        eb2 = sum(X[i][0] == Y[i][0] and dr(X[i][1]) == dr(Y[i][1]) for i in IDS)
        out.append('- （x・y を除いて比べると）不満 %d/160（%.1f%%）・両方 %d/160（%.1f%%）' % (en2, en2 / 1.6, eb2, eb2 / 1.6))
    jp = sum(len(X[i][0] & Y[i][0]) / len(X[i][0] | Y[i][0]) for i in IDS) / 160
    jn = sum(len(X[i][1] & Y[i][1]) / len(X[i][1] | Y[i][1]) for i in IDS) / 160
    out.append('- 件ごとの重なり（ジャカード係数の平均）：褒め %.2f・不満 %.2f' % (jp, jn))
    res = {}
    for side, codes, k in (('褒め', PRAISE, 0), ('不満', COMPL, 1)):
        A = B = C = Dd = 0
        rows = []
        for cd in codes:
            a = sum(cd in X[i][k] and cd in Y[i][k] for i in IDS)
            b = sum(cd in X[i][k] and cd not in Y[i][k] for i in IDS)
            c = sum(cd not in X[i][k] and cd in Y[i][k] for i in IDS)
            d = 160 - a - b - c
            A += a; B += b; C += c; Dd += d
            pos = None if a + b + c == 0 else 2 * a / (2 * a + b + c)
            rows.append((cd, a, b, c, kappa(a, b, c, d), pos))
            res[(side, cd)] = (a, b, c, kappa(a, b, c, d))
        out.append('- %sの件×符号をまとめたカッパ：%s（件×符号 %d 組の一致率 %.1f%%。付かない符号どうしの一致が大半なので高めに出る。付いた符号の一致 2a/(2a+b+c)＝%.2f）' % (
            side, fmt(kappa(A, B, C, Dd)), A + B + C + Dd, 100 * (A + Dd) / (A + B + C + Dd), 2 * A / (2 * A + B + C)))
        out.append('\n| %s | 両方 | %sだけ | %sだけ | カッパ | 付いた所の一致 |' % (side, nx, ny))
        out.append('|---|---|---|---|---|---|')
        for cd, a, b, c, kp, pos in rows:
            out.append('| %s | %d | %d | %d | %s | %s |' % (cd, a, b, c, fmt(kp), '—' if pos is None else '%.2f' % pos))
        out.append('')
    both_I = [i for i in IDS if 'I' in X[i][0] and 'I' in Y[i][0]]
    ti = sum(X[i][2] == Y[i][2] for i in both_I)
    out.append('- 没入 `I` の時期：両方が `I` を付けた %d 件のうち、時期（最初・後半・空）が同じ %d 件' % (len(both_I), ti))
    return res, (ep, en, eb)

out = ['（`coffeeinc2-voices-blind2-compare.py` の出力）']
R = {}
for x, y in (('B2', 'MK'), ('B2', 'B1'), ('B1', 'MK')):
    R[(x, y)] = pair(x, y, out)

out.append('\n### 符号ごとの3者の件数と幅\n')
out.append('| 側 | 符号 | 2回目の目隠し | 作り手の第2版 | 1回目の目隠し | 幅（最大−最小） | カッパ 2回目×作り手 | カッパ 2回目×1回目 |')
out.append('|---|---|---|---|---|---|---|---|')
for side, codes, k in (('褒め', PRAISE, 0), ('不満', COMPL, 1)):
    for cd in codes:
        v = [sum(cd in D[i][k] for i in IDS) for D in (B2, MK, B1)]
        out.append('| %s | %s | %d | %d | %d | %d | %s | %s |' % (side, cd, v[0], v[1], v[2], max(v) - min(v),
                   fmt(R[('B2', 'MK')][0][(side, cd)][3]), fmt(R[('B2', 'B1')][0][(side, cd)][3])))

out.append('\n### 3者とも同じ件\n')
for side, k in (('褒め', 0), ('不満', 1)):
    s = [i for i in IDS if B2[i][k] == MK[i][k] == B1[i][k]]
    out.append('- %s：%d/160' % (side, len(s)))
s = [i for i in IDS if B2[i][0] == MK[i][0] == B1[i][0] and B2[i][1] == MK[i][1] == B1[i][1]]
out.append('- 両方：%d/160' % len(s))

out.append('\n### 2回目の目隠しと作り手の第2版で褒めか不満が違った件（番号は切り出し順。括弧は作り手の表の #）\n')
out.append('| 番号 | 2回目 褒め | 作り手 褒め | 1回目 褒め | 2回目 不満 | 作り手 不満 | 1回目 不満 |')
out.append('|---|---|---|---|---|---|---|')
j = lambda s: ' '.join(sorted(s))
for i in IDS:
    if B2[i][0] != MK[i][0] or B2[i][1] != MK[i][1]:
        out.append('| %d（#%d） | %s | %s | %s | %s | %s | %s |' % (i, MKNO[i], j(B2[i][0]), j(MK[i][0]), j(B1[i][0]), j(B2[i][1]), j(MK[i][1]), j(B1[i][1])))
print('\n'.join(out))
