#!/usr/bin/env python3
# BIZ-SIMDESIGN 版0.4 の論証の再検査（docs/audit/BIZ-SIMDESIGN-v02-reasoning.md 16章）のための検算。書き手：論証検査役。
# 版0.3 の simdesign-v03-effects.py の関数をそのまま読み込み（出力は捨てる）、版0.4 の「M1＋壁」が式の上で何かを確かめる。
# 使い方: python3 -I boki2/docs/analysis/simdesign-v04-reasoning-check.py   （約1分）。置き値を変えた所は【検査役の推論】。
import os, io, runpy, contextlib, itertools
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
with contextlib.redirect_stdout(io.StringIO()):
    M = runpy.run_path(os.path.join(HERE, 'simdesign-v03-effects.py'))
d2_profit, regret, calib_V0, P, TOP = M['d2_profit'], M['regret'], M['calib_V0'], M['P'], M['TOP']

def grid(eps):
    return [(e0, cap, Lf, nr, PA) for e0, cap, Lf, nr, PA in itertools.product(eps, (2200, 2900, 3700), (0.0, 0.2, 0.35), (1, 2, 3), (15000, 20000, 30000)) if calib_V0(PA, nr, Lf) >= 0.3]
CONDS = (('冬 W×1.10', {}, dict(W=1.10)), ('8月 W×1.18', {}, dict(W=1.18)), ('評判4.5（×0.7）', {}, dict(R=4.5)),
         ('評判4（壁1,100円に動く）', {}, dict(R=4.0, kp=1100.0)), ('安いライバル ε×1.6', {}, dict(eps_mult=1.6)))
def share3(g, kb, kn):
    ls = []; top = 0
    for (e0, cap, Lf, nr, PA) in g:
        V0 = calib_V0(PA, nr, Lf)
        b = d2_profit(e0, cap, Lf, nr, PA, V0=V0, kink=True, **kb); n = d2_profit(e0, cap, Lf, nr, PA, V0=V0, kink=True, **kn)
        p0, p1, loss, _ = regret(b, n)
        if p0 >= TOP or p1 >= TOP: top += 1; continue
        ls.append(loss)
    return (100.0 * sum(1 for x in ls if x >= 3) / len(ls) if ls else float('nan')), top, len(ls)

print('=== G1：版0.4 の「M1＋壁」は、d.2 の式（d2_profit、折れ目あり）に ε0 1.75〜2.5 を入れたものと同じか')
print('  simdesign-v04-measure.py の F12 は d2_profit(e0, …, kink=True) を ε0 (1.75, 2.0, 2.5) の格子で呼ぶ（同じ関数・同じ常連・待ち・ε の規則）。')
for lab, kb, kn in CONDS:
    s, top, n = share3(grid((1.75, 2.0, 2.5)), kb, kn)
    print('  d.2 の式・ε0 1.75〜2.5：%-22s 3%%以上 %.0f%%（際限なし %d）' % (lab, s, top))
print('  → F12 の M1＋壁（冬70%・8月81%・評判4.5 95%・評判4 73%・安いライバル67%）と同じ数なら、「芯の交代」は ε0 の幅の付け替え')

print()
print('=== G2：ε0 ごとに、同じ d.2 の式の効き（3%以上の割合）。BIZ-CALIB M1 の幅は −1.0〜−1.5（広げた幅 −0.5〜−2.5）')
for e0 in (1.0, 1.25, 1.5, 1.75, 2.0, 2.5):
    row = []
    for lab, kb, kn in CONDS:
        s, top, n = share3(grid((e0,)), kb, kn)
        row.append('%s %s' % (lab[:6], ('%3.0f%%' % s) + ('(際限%d)' % top if top else '')))
    print('  ε0=%.2f：%s' % (e0, '／'.join(row)))
