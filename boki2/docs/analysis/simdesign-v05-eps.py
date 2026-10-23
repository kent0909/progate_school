#!/usr/bin/env python3
# BIZ-SIMDESIGN 版0.5 の検算：推しの効きが「式の違い（折れ目の有無）」から来るか「ε0 の置き方」から来るかを分ける。
# 書き手：BIZ-SIMDESIGN の担当。0.3 の simdesign-v03-effects.py の関数を読み込む（式は変えない）。
# 0.4 の F12「M1＋壁」は d2_profit(e0, …, kink=True) を ε0 1.75〜2.5 で呼んだもの＝ d.2 の式そのもの（検査書 G1 の指摘を自分で確かめる：H0）。
# 使い方: python3 -I boki2/docs/analysis/simdesign-v05-eps.py   （約2分）。置き値は全部【推論】。線は3%（threshold.txt）のまま。
import os, io, math, runpy, contextlib, itertools
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
with contextlib.redirect_stdout(io.StringIO()):
    M = runpy.run_path(os.path.join(HERE, 'simdesign-v03-effects.py'))
d2_profit, regret, calib_V0, P, TOP = M['d2_profit'], M['regret'], M['calib_V0'], M['P'], M['TOP']
ITEMS, COST, DAYS, AVG = M['ITEMS'], M['COST'], M['DAYS'], M['AVG']
fixed, cm = M['fixed'], M['cm']
LINES = (1.0, 3.0, 5.0)
def pct(a, b): return 100.0 * a / b if b else float('nan')
def shares(vals, n_top=0):
    vals = sorted(vals); n = len(vals)
    if n == 0: return '組   0'
    return '組%4d｜中央%6.2f%%・最大%6.2f%%｜' % (n, vals[n // 2], vals[-1]) + ' '.join('%g%%以上 %3.0f%%' % (L, 100.0 * sum(1 for v in vals if v >= L) / n) for L in LINES) + ('｜際限なし %d' % n_top)

def grid(eps_set):
    return [(e0, cap, Lf, nr, PA) for e0, cap, Lf, nr, PA in itertools.product(eps_set, (2200, 2900, 3700), (0.0, 0.2, 0.35), (1, 2, 3), (15000, 20000, 30000)) if calib_V0(PA, nr, Lf) >= 0.3]
def run(eps_set, kink, kw_new, kw_base=None):
    out = []; top = 0
    for (e0, cap, Lf, nr, PA) in grid(eps_set):
        V0 = calib_V0(PA, nr, Lf)
        kn = dict(kw_new)
        if kn.pop('cheap_proportional', False): kn['eps_mult'] = 2.0 / e0          # d.2 の「→2.0」を、その店の ε0 から見た割合で書いた形
        b = d2_profit(e0, cap, Lf, nr, PA, kink=kink, V0=V0, **(kw_base or {}))
        n = d2_profit(e0, cap, Lf, nr, PA, kink=kink, V0=V0, **kn)
        p0, p1, loss, yen = regret(b, n)
        if p0 >= TOP or p1 >= TOP: top += 1; continue
        out.append(dict(e0=e0, cap=cap, loss=loss, p1=p1))
    return out, top

COND = [('冬 W×1.10', dict(W=1.10)), ('8月 W×1.18', dict(W=1.18)), ('評判4.5（ε×0.7）', dict(R=4.5)),
        ('評判4・壁が1,100円に動く', dict(R=4.0, kp=1100.0)), ('評判4・壁は動かない', dict(R=4.0)),
        ('安いライバル ε×1.6', dict(eps_mult=1.6)), ('安いライバル（書いてある「→2.0」）', dict(cheap_rival=True))]

print('=== H0：0.4 の F12「M1＋壁」は d.2 の式に ε0 1.75〜2.5 を入れたものか（同じ関数・同じ引数で同じ数が出るか）')
r, t = run((1.75, 2.0, 2.5), True, dict(W=1.10))
print('  d2_profit(kink=True)・ε0 1.75/2.0/2.5・冬：%s  ← 0.4 の F12 の「M1＋壁 冬」と同じ（70%%）なら、式は d.2 そのもの' % shares([x['loss'] for x in r], t))

print()
print('=== H1：同じ d.2 の式で ε0 だけを変える（ε0 ごとの3%以上の組の割合）')
hdr = '  %-26s' % '状況' + ''.join('  ε0=%-5s' % e for e in ('1.0', '1.25', '1.5', '1.75', '2.0', '2.5'))
print(hdr)
for lab, kw in COND:
    cells = []
    for e0 in (1.0, 1.25, 1.5, 1.75, 2.0, 2.5):
        r, t = run((e0,), True, kw)
        v = [x['loss'] for x in r]
        cells.append(('%4.0f%%' % (100.0 * sum(1 for x in v if x >= 3) / len(v)) if v else '  — ') + ('*' if t else ' '))
    print('  %-26s' % lab + ''.join('  %-8s' % c for c in cells))
print('  （* はその ε0 で際限なしの組がある）')

print()
print('=== H2：2×2（＋1）。折れ目の有無 × ε0 の幅（低い 1.0〜1.5／高い 1.75〜2.5）で、どちらの軸が効きを作るか')
LOW, HIGH = (1.0, 1.1, 1.25, 1.4, 1.5), (1.75, 2.0, 2.5)
for lab, kw in COND:
    line = []
    for kink, eps, name in ((True, LOW, '折れ目あり・低い（今の d.2）'), (True, HIGH, '折れ目あり・高い（0.4 の推し）'), (False, LOW, '折れ目なし・低い'), (False, HIGH, '折れ目なし・高い（M1）')):
        r, t = run(eps, kink, kw)
        v = [x['loss'] for x in r]
        line.append('%s %3.0f%%（際限なし%d）' % (name, 100.0 * sum(1 for x in v if x >= 3) / len(v) if v else float('nan'), t))
    print('  %-26s｜%s' % (lab, '｜'.join(line)))

print()
print('=== H3：安いライバルの「→2.0」を割合で書くと何倍か。ε0 ごとの跳ね 2.0/ε0 と、その形の規則の効き')
for e0 in (1.0, 1.25, 1.5, 1.75, 2.0, 2.5):
    r, t = run((e0,), True, dict(cheap_proportional=True))
    v = [x['loss'] for x in r]
    print('  ε0=%.2f：跳ね 2.0/ε0 = ×%.2f｜3%%以上 %3.0f%%' % (e0, 2.0 / e0, 100.0 * sum(1 for x in v if x >= 3) / len(v) if v else float('nan')))
print('  → 0.4 の ×1.6 は ε0=1.25 の店で「→2.0」を割合にした値（2.0÷1.25＝1.6）')

print()
print('=== H4：動く壁の効きを、評判で客が増える効きと分ける（評判3→4、壁が動く／動かない）。ε0 の幅ごと')
for eps, name in ((LOW, 'ε0 1.0〜1.5'), (HIGH, 'ε0 1.75〜2.5')):
    a, ta = run(eps, True, dict(R=4.0, kp=1100.0)); b, tb = run(eps, True, dict(R=4.0))
    print('  %s：壁が動く %s' % (name, shares([x['loss'] for x in a], ta)))
    print('  %s  壁は動かない %s' % (' ' * len(name), shares([x['loss'] for x in b], tb)))
    on = sum(1 for x in a if abs(x['p1'] - 1100) <= 5)
    print('  %s  壁が動くとき最適が壁±5円 %d／%d' % (' ' * len(name), on, len(a)))

print()
print('=== H5：暦の値段（1年1つの値段）を ε0 の幅ごとに（観光地・住宅（趨勢除去）、上限ごと）')
CAL = dict(M['CAL']); CAL['住宅（趨勢除去）'] = [1.017, 0.974, 1.043, 0.951, 1.014, 0.952, 0.962, 1.151, 0.983, 0.987, 1.048, 0.934]
for typ in ('観光地', '住宅（趨勢除去）'):
    for eps, name in ((LOW, 'ε0 低い'), (HIGH, 'ε0 高い')):
        for cap in (2200, 2900, 3700):
            losses = []
            for (e0, Lf, nr, PA) in itertools.product(eps, (0.0, 0.2, 0.35), (1, 2, 3), (15000, 20000, 30000)):
                V0 = calib_V0(PA, nr, Lf)
                if V0 < 0.3: continue
                prs = [d2_profit(e0, cap, Lf, nr, PA, V0=V0, PAmult=m) for m in CAL[typ]]
                year = np.sum(prs, axis=0); iy = int(np.argmax(year)); best = sum(p.max() for p in prs)
                if P[iy] >= TOP or any(P[int(np.argmax(p))] >= TOP for p in prs): continue
                losses.append(pct(best - year[iy], best))
            print('  %-10s %-6s 上限%d：%s' % (typ, name, cap, shares(losses)))

print()
print('=== H6：観光地の8月（×1.50）の仕込みに、席の上限を入れる（週の上限＝月の上限÷4.3）')
def prep_profit(prep, W, capw, noise=0.10, waste=0.4, sims=4000, base=AVG / 4.3):
    U = np.random.default_rng(11).uniform(1 - noise, 1 + noise, size=(sims,))
    N = base * W * U; X = np.minimum(np.minimum(N, prep), capw); left = np.maximum(0, prep - X)
    return np.mean(X * (ITEMS * 1000 - COST) - left * COST * waste)
g = np.arange(300, 1500, 2.0)
for cap in (2200, 2900, 3700, 1e9):
    capw = cap / 4.3
    pn = np.array([prep_profit(x, 1.0, capw) for x in g]); p8 = np.array([prep_profit(x, 1.50, capw) for x in g])
    gn = g[int(np.argmax(pn))]; g8 = g[int(np.argmax(p8))]
    print('  上限%s：仕込み ふつう %.0f杯 → 8月 %.0f杯／ふつうの仕込みのままの取りこぼし %.2f%%' % ('なし' if cap > 1e8 else '%d杯/月' % cap, gn, g8, pct(p8.max() - prep_profit(gn, 1.50, capw), p8.max())))

print()
print('=== H7：判定の決まりを「半分以上の組」から「条件ごと」に替えたとき、判定が変わる項（入れ子の町の顔ぶれごと）')
nested = None
with contextlib.redirect_stdout(io.StringIO()):
    MV = runpy.run_path(os.path.join(HERE, 'simdesign-v04-measure.py'))
nested, CHEAP, KODA, PREF = MV['nested'], MV['CHEAP'], MV['KODA'], M['PREF']
for lam in (0.3, 0.5, 0.7):
    by = {}
    for e, V0, nc, nk in itertools.product((1.25, 1.75), (2.0, 4.0, 8.0), range(4), range(4)):
        if nc + nk == 0: continue
        def prof(town, own): return nested(town + [own], lam, e, V0, 0.16)[-1] * 20000 * (ITEMS * own[0] - own[3])
        ref = max((CHEAP, KODA), key=lambda o: prof([CHEAP, KODA], o))
        town = [CHEAP] * nc + [KODA] * nk
        best = max(prof(town, CHEAP), prof(town, KODA)); loss = pct(best - prof(town, ref), best)
        key = '同じ型が2軒以上多い' if abs(nc - nk) >= 2 else ('1軒差' if abs(nc - nk) == 1 else '同数')
        by.setdefault(key, []).append(loss)
    print('  λ=%.1f：' % lam + '　'.join('%s %d組中 %.0f%%' % (k, len(v), 100.0 * sum(1 for x in v if x >= 3) / len(v)) for k, v in sorted(by.items())))
# 天気の仕込み（×0.85）を廃棄の割合・週の揺れごとに
for noise, waste in itertools.product((0.05, 0.10, 0.20), (0.2, 0.4, 0.6)):
    pn = np.array([prep_profit(x, 1.0, 1e9, noise, waste) for x in g]); pr = np.array([prep_profit(x, 0.85, 1e9, noise, waste) for x in g])
    gn = g[int(np.argmax(pn))]
    print('  天気の仕込み ×0.85・週の揺れ±%2.0f%%・廃棄%2.0f%%：取りこぼし %.2f%%' % (100 * noise, 100 * waste, pct(pr.max() - prep_profit(gn, 0.85, 1e9, noise, waste), pr.max())))

print()
print('=== H8：銀座の坪単価を同じ原文の銀座の値 42,497円で（BIZ-CALIB の式、店主30万・パート1.5・その他30万・18坪）')
F = fixed(42497, 300000, 1280, 1.5, 300000)
print('  固定費 %.0f円・分岐点 %.1f杯/日・100杯 %+.0f円' % (F, F / cm(1077) / DAYS, 100 * DAYS * cm(1077) - F))
both = tot = 0
for owner, part, other, own, tsubo in itertools.product((0, 100000, 200000, 300000), (0, 1.0, 1.5, 3.0), (120000, 150000, 300000, 400000), (False, True), (10, 15, 18)):
    Fg = fixed(0 if own else 42497, owner, 1280, part, other, tsubo); Fo = fixed(0 if own else 3000, owner, 1085, part, other, tsubo)
    tot += 1; both += (100 * DAYS * cm(1077) - Fg < 0) and (30 * DAYS * cm(1034) - Fo > 0)
print('  そろえた形 %d 組（銀座の坪 42,497円）：両方が成り立つ %d' % (tot, both))
for lab, form in (('雇う・借り', (300000, 1.5, 300000, False)), ('家族（店主30万・パート0・その他30万）・借り', (300000, 0, 300000, False)), ('家族（店主10万・その他15万）・借り', (100000, 0, 150000, False))):
    owner, part, other, own = form
    Fg = fixed(0 if own else 42497, owner, 1280, part, other); Fo = fixed(0 if own else 3000, owner, 1085, part, other)
    tot = n = 0
    for potu, nru, V0, e0, potr, nrr in itertools.product((300, 600, 1000, 2000, 3000), (2, 4, 8), (4.0, 8.0), (1.1, 1.25, 1.5), (60, 100, 150, 300), (0, 1)):
        pu = d2_profit(e0, 3700, 0.2, nru, potu * DAYS, V0=V0); pr_ = d2_profit(e0, 2200, 0.2, nrr, potr * DAYS, V0=V0)
        iu, ir = int(np.argmax(pu)), int(np.argmax(pr_))
        if P[iu] >= TOP or P[ir] >= TOP: continue
        tot += 1; n += (pu[iu] - Fg < 0) and (pr_[ir] - Fo > 0)
    print('  需要の式・%s（銀座の坪 42,497円）：両方 %d／%d（%.0f%%）' % (lab, n, tot, 100 * n / tot))
