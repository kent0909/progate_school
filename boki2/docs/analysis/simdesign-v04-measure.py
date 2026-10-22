#!/usr/bin/env python3
# BIZ-SIMDESIGN 版0.4 の検算：推しの側にも、捨てた側（M2・B1）と同じ物差し（取りこぼし％）と線（3%）を当てる。
# 地域は固定費の形を両側でそろえた格子を先に出す。M1 と d.2 を同じ規則の形で比べる。
# 書き手：BIZ-SIMDESIGN の担当。版0.3 の simdesign-v03-effects.py の関数を読み込み（出力は捨てる）、式は変えない。
# 線と物差しは simdesign-v03-threshold.txt（版0.3 の前に commit）のまま。0.4 では線を動かさない。
# 使い方: python3 -I boki2/docs/analysis/simdesign-v04-measure.py   （約2分）。置き値は全部【推論】。
import os, io, math, runpy, contextlib, itertools
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
with contextlib.redirect_stdout(io.StringIO()):
    M = runpy.run_path(os.path.join(HERE, 'simdesign-v03-effects.py'))
d2_profit, regret, calib_V0, P, TOP = M['d2_profit'], M['regret'], M['calib_V0'], M['P'], M['TOP']
ITEMS, COST, DAYS, AVG, PREF = M['ITEMS'], M['COST'], M['DAYS'], M['AVG'], M['PREF']
fixed, be, cm = M['fixed'], M['be'], M['cm']
LINES = (1.0, 3.0, 5.0)

def pct(a, b): return 100.0 * a / b if b else float('nan')
def shares(vals):
    vals = sorted(vals); n = len(vals)
    return '組%4d｜中央%6.2f%%・最大%6.2f%%｜' % (n, vals[n // 2], vals[-1]) + ' '.join('%g%%以上 %3.0f%%' % (L, 100.0 * sum(1 for v in vals if v >= L) / n) for L in LINES)

D2GRID = [(e0, cap, Lf, nr, PA) for e0, cap, Lf, nr, PA in itertools.product((1.0, 1.1, 1.25, 1.4, 1.5), (2200, 2900, 3700), (0.0, 0.2, 0.35), (1, 2, 3), (15000, 20000, 30000)) if calib_V0(PA, nr, Lf) >= 0.3]
M1GRID = [(e0, cap, Lf, nr, PA) for e0, cap, Lf, nr, PA in itertools.product((1.75, 2.0, 2.5), (2200, 2900, 3700), (0.0, 0.2, 0.35), (1, 2, 3), (15000, 20000, 30000)) if calib_V0(PA, nr, Lf) >= 0.3]

def run(grid, kink, kw_new, kw_base=None, keep=False):
    out = []
    for (e0, cap, Lf, nr, PA) in grid:
        V0 = calib_V0(PA, nr, Lf)
        kb = dict(kw_base or {}); kn = dict(kw_new)
        add = kn.pop('nriv_add', 0)
        b = d2_profit(e0, cap, Lf, nr, PA, kink=kink, V0=V0, **kb)
        n = d2_profit(e0, cap, Lf, nr + add, PA, kink=kink, V0=V0, **kn)
        p0, p1, loss, yen = regret(b, n)
        if p0 >= TOP or p1 >= TOP: continue
        out.append(dict(e0=e0, cap=cap, Lf=Lf, nr=nr, PA=PA, loss=loss, p0=p0, p1=p1))
    return out

# =================================================================================================
print('=== F1：M1 と d.2 を同じ規則の形で比べる（安いライバルを「ε を割合で跳ねさせる」規則にそろえる）')
print('  d.2 の書いてある規則は「ε→2.0 に置き換え」＝ ε0 1.0〜1.5 から見て ×1.33〜×2.0 の跳ね。M1（ε0 1.75〜2.5）に置き換えを当てると跳ねは ×0.8〜×1.14 で、比べにならない')
for mult in (1.2, 1.33, 1.6, 2.0):
    a = run(D2GRID, True, dict(eps_mult=mult)); b = run(M1GRID, False, dict(eps_mult=mult))
    print('  ε×%.2f　d.2 %s' % (mult, shares([r['loss'] for r in a])))
    print('           M1  %s' % shares([r['loss'] for r in b]))
a = run(D2GRID, True, dict(cheap_rival=True)); print('  参考：d.2 の書いてあるとおり（→2.0）%s' % shares([r['loss'] for r in a]))
for lab, kw in (('冬 W×1.10', dict(W=1.10)), ('8月 W×1.18', dict(W=1.18)), ('評判4.5（×0.7）', dict(R=4.5)), ('寒い月の値打ち p_ref×1.10', dict(pref_mult=1.10))):
    a = run(D2GRID, True, kw); b = run(M1GRID, False, kw)
    print('  %-24s d.2 %s' % (lab, shares([r['loss'] for r in a])))
    print('  %-24s M1  %s' % ('', shares([r['loss'] for r in b])))

print()
print('=== F2：「半分以上の組」でなく、どの条件の店で3%を越えるか（d.2・M1、上限・常連・ε0 ごと）')
for model, grid, kink in (('d.2', D2GRID, True), ('M1', M1GRID, False)):
    for lab, kw in (('冬 W×1.10', dict(W=1.10)), ('8月 W×1.18', dict(W=1.18)), ('雨の月 ε×0.85', dict(eps_mult=0.85)), ('安いライバル ε×1.6', dict(eps_mult=1.6))):
        rows = run(grid, kink, kw)
        def sh(sel):
            s = [r for r in rows if sel(r)]
            return '%3.0f%%' % (100.0 * sum(1 for r in s if r['loss'] >= 3) / len(s)) if s else '  — '
        caps = ' '.join('上限%d %s' % (c, sh(lambda r, c=c: r['cap'] == c)) for c in (2200, 2900, 3700))
        lfs = ' '.join('常連%.0f%% %s' % (100 * l, sh(lambda r, l=l: r['Lf'] == l)) for l in (0.0, 0.2, 0.35))
        eps = ' '.join('ε0=%.2f %s' % (e, sh(lambda r, e=e: r['e0'] == e)) for e in sorted(set(g[0] for g in grid)))
        print('  %-3s %-16s｜%s｜%s｜%s' % (model, lab, caps, lfs, eps))
# 上限ごとに、ふつうの月に席が埋まっている店の割合
for model, grid, kink in (('d.2', D2GRID, True), ('M1', M1GRID, False)):
    for cap in (2200, 2900, 3700):
        hit = n = 0
        for (e0, c, Lf, nr, PA) in grid:
            if c != cap: continue
            pr = d2_profit(e0, cap, Lf, nr, PA, kink=kink, V0=calib_V0(PA, nr, Lf)); i = int(np.argmax(pr))
            if P[i] >= TOP: continue
            n += 1; hit += pr[i] / (ITEMS * P[i] - COST) >= cap - 1
        print('  %-3s 上限%d：ふつうの月の最適の値段で席が埋まっている組 %d／%d（%.0f%%）' % (model, cap, hit, n, 100 * hit / n))

print()
print('=== F3：推し①入れ子。自店の型を選び違えたときに失う貢献利益（％）')
def nested(stores, lam, e, V0, rcoef):
    V = [rcoef * (R - 3) - e * math.log(p / PREF) for p, R, t, c in stores]
    types = sorted(set(s[2] for s in stores))
    I = {t: math.log(sum(math.exp(V[i] / lam) for i, s in enumerate(stores) if s[2] == t)) for t in types}
    den = V0 + sum(math.exp(lam * I[t]) for t in types)
    return [math.exp(lam * I[s[2]]) / den * math.exp(V[i] / lam) / math.exp(I[s[2]]) for i, s in enumerate(stores)]
# 型の置き値【推論】：安い型 700円・評判3・材料費＝700×1.2×0.38、こだわり型 1,100円・評判4.5・材料費＝1,100×1.2×0.40（BIZ-CALIB の型の原価率の写し、DESIGN-RAMEN 419行）
CHEAP = (700, 3.0, '安い', 700 * ITEMS * 0.38); KODA = (1100, 4.5, 'こだわり', 1100 * ITEMS * 0.40)
for rlab, rcoef in (('評判の係数 0.16（d.2 のまま）', 0.16), ('評判の係数 0.256（0.3 の E8 の 0.16×1.6）', 0.256)):
    losses = []; wrong_c = []
    for lam, e, V0, nc, nk in itertools.product((0.3, 0.5, 0.7, 1.0), (1.25, 1.75), (2.0, 4.0, 8.0), range(4), range(4)):
        if nc + nk == 0: continue
        town = [CHEAP] * nc + [KODA] * nk
        prof = {}
        for own in (CHEAP, KODA):
            s = nested(town + [own], lam, e, V0, rcoef)[-1]
            prof[own[2]] = s * 20000 * (ITEMS * own[0] - own[3])
        best = max(prof.values()); worst = min(prof.values())
        losses.append((lam, pct(best - worst, best)))
    print('  %s：%s' % (rlab, shares([x for _, x in losses])))
    for lam in (0.3, 0.5, 0.7, 1.0):
        print('    λ=%.1f%s：%s' % (lam, '（入れ子なし＝ふつうのロジット）' if lam == 1.0 else '', shares([x for l, x in losses if l == lam])))
# 入れ子の比（0.3 の E8）が 1.6 の掛け算に頼っていないか
for rcoef in (0.16, 0.256):
    base = [CHEAP, KODA]; s0 = nested(base, 0.5, 1.75, 4.0, rcoef); s1 = nested(base + [CHEAP], 0.5, 1.75, 4.0, rcoef)
    la = 100 * (1 - s1[0] / s0[0]); lb = 100 * (1 - s1[1] / s0[1])
    print('  2軒・λ=0.5・評判の係数 %.3f：安い −%.1f%%・こだわり −%.1f%%（比 %.2f）' % (rcoef, la, lb, la / lb))

print()
print('=== F4：客層の混合で型の取り合いは作れるか（自分の計算。0.2 の M2 の係数）')
SEGW = {'会社員': (1.4, .5), '学生': (2.2, .3), '高齢': (1.6, .2)}
def mix_shares(stores, pref_type=None, V0=4.0, rcoef=0.256):
    tot = [0.0] * len(stores)
    for g, (e, w) in SEGW.items():
        V = [rcoef * (R - 3) - e * math.log(p / PREF) + ((pref_type or {}).get(g, {}).get(t, 0)) for p, R, t, c in stores]
        ex = [math.exp(v) for v in V]; den = V0 + sum(ex)
        for i in range(len(stores)): tot[i] += w * ex[i] / den
    return tot
for lab, pt in (('客層の混合（型の好みなし）', None), ('客層ごとに型の好み（会社員はこだわり +0.6、学生は安い +0.6）', {'会社員': {'こだわり': .6}, '学生': {'安い': .6}})):
    base = [CHEAP, KODA]; s0 = mix_shares(base, pt); s1 = mix_shares(base + [CHEAP], pt)
    la = 100 * (1 - s1[0] / s0[0]); lb = 100 * (1 - s1[1] / s0[1])
    print('  %s：安い −%.1f%%・こだわり −%.1f%%（比 %.2f）' % (lab, la, lb, la / lb))

print()
print('=== F5：推し③動く壁。壁の係数（評判1段で何%動くか）を振る。評判3→4 の取りこぼしと、壁の位置を見せたとき最適が壁±5円に乗る組')
for k in (0.05, 0.10, 0.15, 0.20):
    losses = []; on = n = 0
    for (e0, cap, Lf, nr, PA) in D2GRID:
        V0 = calib_V0(PA, nr, Lf)
        b = d2_profit(e0, cap, Lf, nr, PA, V0=V0, kp=1000.0)
        kp = 1000.0 * (1 + k); nw = d2_profit(e0, cap, Lf, nr, PA, V0=V0, R=4.0, kp=kp)
        p0, p1, loss, yen = regret(b, nw)
        if p0 >= TOP or p1 >= TOP: continue
        losses.append(loss); n += 1; on += abs(p1 - kp) <= 5
    print('  係数 %.2f（壁 %d円）：%s｜最適が壁±5円 %d／%d（%.0f%%）' % (k, 1000 * (1 + k), shares(losses), on, n, 100 * on / n))
losses = []
for (e0, cap, Lf, nr, PA) in D2GRID:
    V0 = calib_V0(PA, nr, Lf)
    p0, p1, loss, yen = regret(d2_profit(e0, cap, Lf, nr, PA, V0=V0), d2_profit(e0, cap, Lf, nr, PA, V0=V0, R=4.0))
    if p0 < TOP and p1 < TOP: losses.append(loss)
print('  参考：壁の位置が動かない（d.2 のまま）：%s' % shares(losses))

print()
print('=== F6：推し④暦。値段（1年1つの値段）と、人手（8月に席を広げる）を同じ物差し（その月の貢献利益の％）で')
CAL = dict(M['CAL'])
CAL['住宅（趨勢除去）'] = [1.017, 0.974, 1.043, 0.951, 1.014, 0.952, 0.962, 1.151, 0.983, 0.987, 1.048, 0.934]   # 0.4：BIZ-CALIB 0.4 の calib-v04.md T節（家計の中華そば、1日あたり・趨勢を除いた比）
for typ, mul in CAL.items():
    for cap in (2200, 2900, 3700):
        losses = []
        for (e0, Lf, nr, PA) in itertools.product((1.0, 1.25, 1.5), (0.0, 0.2, 0.35), (1, 2, 3), (15000, 20000, 30000)):
            V0 = calib_V0(PA, nr, Lf)
            if V0 < 0.3: continue
            prs = [d2_profit(e0, cap, Lf, nr, PA, V0=V0, PAmult=m) for m in mul]
            year = np.sum(prs, axis=0); iy = int(np.argmax(year)); best = sum(p.max() for p in prs)
            if P[iy] >= TOP or any(P[int(np.argmax(p))] >= TOP for p in prs): continue
            losses.append(pct(best - year[iy], best))
        print('  値段・%-6s 上限%d：%s' % (typ, cap, shares(losses)))
# 人手：その月の暦の倍率で、席を +800杯（パート1人×8時間×26日、時給1,085円）広げるか。取りこぼし＝広げないときに失う、その月の貢献利益（人件費を引いた後）の割合
staff = 1085 * 8 * DAYS
for m in (1.18, 1.35, 1.50):
    losses = []
    for (e0, Lf, nr, PA, cap) in itertools.product((1.0, 1.25, 1.5), (0.0, 0.2, 0.35), (1, 2, 3), (15000, 20000, 30000), (2200, 2900)):
        V0 = calib_V0(PA, nr, Lf)
        if V0 < 0.3: continue
        a = d2_profit(e0, cap, Lf, nr, PA, V0=V0, PAmult=m).max(); b = d2_profit(e0, cap + 800, Lf, nr, PA, V0=V0, PAmult=m).max() - staff
        best = max(a, b); losses.append(pct(best - a, best))
    print('  人手・その月の倍率 ×%.2f（席 +800杯、人件費 %d円を引く）：%s' % (m, staff, shares(losses)))

print()
print('=== F7：推し⑤天気→仕込み。置き値を振る（倍率×週の揺れ×廃棄の割合）。そのうえで予報が外れうるときの引き換え')
def prep_profit(prep, W, noise, waste, sims=4000, base=AVG / 4.3):
    U = np.random.default_rng(11).uniform(1 - noise, 1 + noise, size=(sims,))
    N = base * W * U; X = np.minimum(N, prep); left = np.maximum(0, prep - N)
    return np.mean(X * (ITEMS * 1000 - COST) - left * COST * waste)
grid = np.arange(300, 1500, 2.0)
def best_prep(W, noise, waste):
    pr = np.array([prep_profit(g, W, noise, waste) for g in grid]); return grid[int(np.argmax(pr))], pr.max()
for W in (0.85, 0.93, 1.18, 1.50):
    losses = []
    for noise, waste in itertools.product((0.05, 0.10, 0.20), (0.2, 0.4, 0.6)):
        g0, _ = best_prep(1.0, noise, waste); g1, b1 = best_prep(W, noise, waste)
        losses.append(pct(b1 - prep_profit(g0, W, noise, waste), b1))
    print('  月の倍率 ×%.2f をふつうの仕込みのまま：%s' % (W, shares(losses)))
# 予報が外れうる：月初の予報「雨が多い（×0.85）」が当たる確率 a。外れたらふつう（×1.0）。
print('  --- 予報の当たる確率 a で、屋台の雨の月（×0.85）。仕込みを「予報どおり」「ふつう」「期待値で最適」の3つで比べる（週の揺れ±10%・廃棄40%）')
for a in (0.5, 0.7, 0.9):
    gr, _ = best_prep(0.85, 0.10, 0.4); gn, _ = best_prep(1.0, 0.10, 0.4)
    def exp_profit(g): return a * prep_profit(g, 0.85, 0.10, 0.4) + (1 - a) * prep_profit(g, 1.0, 0.10, 0.4)
    ev = np.array([exp_profit(g) for g in grid]); gb = grid[int(np.argmax(ev))]; eb = ev.max()
    print('  a=%.1f：予報どおり %.0f杯 %.2f%%損・ふつう %.0f杯 %.2f%%損（期待値で最適 %.0f杯との比べ）。予報どおりで外れた月の損 %.2f%%・ふつうで当たった月の損 %.2f%%' % (
        a, gr, pct(eb - exp_profit(gr), eb), gn, pct(eb - exp_profit(gn), eb), gb,
        pct(best_prep(1.0, .1, .4)[1] - prep_profit(gr, 1.0, .1, .4), best_prep(1.0, .1, .4)[1]),
        pct(best_prep(0.85, .1, .4)[1] - prep_profit(gn, 0.85, .1, .4), best_prep(0.85, .1, .4)[1])))

print()
print('=== F8：地域。固定費の形を両側でそろえた格子（杯数を固定：銀座100杯・奥多摩30杯）')
# 地域の値（両側で違ってよいもの）：坪単価・最低賃金・客単価（BIZ-CALIB G3 の値）。銀座の坪は 3.1万（渋谷の中央値）〜5万【仮置き】
# 形（両側でそろえるもの）：店主の報酬・パートの人数・その他の固定費・建物（借り／自己所有）・広さ
both = 0; tot = 0; hold = []
for owner, part, other, own, tsubo in itertools.product((0, 100000, 200000, 300000), (0, 1.0, 1.5, 3.0), (120000, 150000, 300000, 400000), (False, True), (10, 15, 18)):
    for rent_g in (31176, 50000):
        Fg = fixed(0 if own else rent_g, owner, 1280, part, other, tsubo)
        Fo = fixed(0 if own else 3000, owner, 1085, part, other, tsubo)
        g_loss = 100 * DAYS * cm(1077) - Fg < 0; o_win = 30 * DAYS * cm(1034) - Fo > 0
        tot += 1; both += g_loss and o_win
print('  そろえた形 %d 組（店主の報酬4×パート4×その他4×建物2×広さ3×銀座の坪2）：銀座100杯で赤字かつ奥多摩30杯で黒字 %d（%.1f%%）' % (tot, both, 100 * both / tot))
# 両側で形を変えてよいとき、例が成り立つ組で、どの前提が違うか
diff = {'店主の報酬': 0, 'パートの人数': 0, 'その他の固定費': 0, '建物の所有': 0, '広さ': 0}; n_hold = 0; n_all = 0
forms = list(itertools.product((0, 100000, 300000), (0, 1.5, 3.0), (150000, 300000), (False, True), (10, 18)))
for fg, fo in itertools.product(forms, forms):
    Fg = fixed(0 if fg[3] else 50000, fg[0], 1280, fg[1], fg[2], fg[4]); Fo = fixed(0 if fo[3] else 3000, fo[0], 1085, fo[1], fo[2], fo[4])
    n_all += 1
    if 100 * DAYS * cm(1077) - Fg < 0 and 30 * DAYS * cm(1034) - Fo > 0:
        n_hold += 1
        for k, i in (('店主の報酬', 0), ('パートの人数', 1), ('その他の固定費', 2), ('建物の所有', 3), ('広さ', 4)):
            diff[k] += fg[i] != fo[i]
print('  形を両側で別々に選ぶ %d 組のうち、例が成り立つ %d 組（%.1f%%）。そのうち前提が地域で違う割合：' % (n_all, n_hold, 100 * n_hold / n_all) + '・'.join('%s %.0f%%' % (k, 100 * v / n_hold) for k, v in diff.items()))
# 1つの前提だけを地域で変えて、残りを全部そろえたとき
print('  --- 1つの前提だけを地域で違えて（残りはそろえて）例が成り立つ組の数')
for k, idx, opts in (('店主の報酬', 0, (0, 100000, 300000)), ('パートの人数', 1, (0, 1.5, 3.0)), ('その他の固定費', 2, (150000, 300000)), ('建物の所有', 3, (False, True)), ('広さ', 4, (10, 18))):
    cnt = 0; n = 0
    for base in forms:
        for vg, vo in itertools.product(opts, opts):
            if vg == vo: continue
            fg = list(base); fo = list(base); fg[idx] = vg; fo[idx] = vo
            Fg = fixed(0 if fg[3] else 50000, fg[0], 1280, fg[1], fg[2], fg[4]); Fo = fixed(0 if fo[3] else 3000, fo[0], 1085, fo[1], fo[2], fo[4])
            n += 1; cnt += (100 * DAYS * cm(1077) - Fg < 0) and (30 * DAYS * cm(1034) - Fo > 0)
    print('  %s だけ違う：%d／%d（%.1f%%）' % (k, cnt, n, 100 * cnt / n))

print()
print('=== F9：地域。需要の式から杯数を出す形で、固定費の形を両側でそろえる（d.2・最適の値段）')
def demand_both(form, potus=(300, 600, 1000, 2000, 3000)):
    owner, part, other, own = form
    Fg = fixed(0 if own else 50000, owner, 1280, part, other); Fo = fixed(0 if own else 3000, owner, 1085, part, other)
    by = {}; tot = both = 0
    for potu, nru, V0, e0, potr, nrr in itertools.product(potus, (2, 4, 8), (4.0, 8.0), (1.1, 1.25, 1.5), (60, 100, 150, 300), (0, 1)):
        pu = d2_profit(e0, 3700, 0.2, nru, potu * DAYS, V0=V0); pr_ = d2_profit(e0, 2200, 0.2, nrr, potr * DAYS, V0=V0)
        iu, ir = int(np.argmax(pu)), int(np.argmax(pr_))
        if P[iu] >= TOP or P[ir] >= TOP: continue
        ok = (pu[iu] - Fg < 0) and (pr_[ir] - Fo > 0)
        tot += 1; both += ok; by.setdefault(potu, [0, 0]); by[potu][0] += 1; by[potu][1] += ok
    return tot, both, by
for lab, form in (('雇う（店主30万・パート1.5・その他30万）・借り', (300000, 1.5, 300000, False)), ('雇う・自己所有', (300000, 1.5, 300000, True)),
                  ('家族（店主10万・パート0・その他15万）・借り', (100000, 0, 150000, False)), ('家族・自己所有', (100000, 0, 150000, True)),
                  ('家族（店主30万・パート0・その他30万）・借り', (300000, 0, 300000, False))):
    tot, both, by = demand_both(form)
    print('  %-34s：組 %d／両方 %d（%.0f%%）｜潜在客ごと ' % (lab, tot, both, 100 * both / tot) + '　'.join('%d人/日 %d/%d' % (k, v[1], v[0]) for k, v in sorted(by.items())))

print()
print('=== F10：B1 の種の揺れは客の数で小さくなるか（同じ値段700円、種20個）')
b1 = M['b1']
for n in (9000, 30000, 90000):
    vals = np.array([b1(np.array([700.0]), 'ふつう', 2, n, s)[0][0] for s in range(20)])
    print('  潜在客 %d人：貢献利益の標準偏差 %.2f%%（d.2 の週の乱数による月の揺れは 2.8%%）' % (n, 100 * vals.std() / vals.mean()))

print()
print('=== F11：常連の穴（要点4①）は、d.1 の「離れ（値上げで上がる）」を月ごとに回すと閉じるか')
# 置き方【推論】：L(t+1) = L(t)×(1−離れ) + 新規の常連。離れ＝0.03 + k×max(0, ln(p/900))。新規の常連＝一見の来店×0.3（定着率）×0.1。36か月回し、最後の12か月の平均の貢献利益で値段を比べる。
def steady(p_idx, e0, Lf, k, cap=2900, nr=2, PA=20000, months=36):
    V0 = calib_V0(PA, nr, Lf); L = Lf * AVG; pr_hist = []
    p = P[p_idx]
    for t in range(months):
        lf_now = min(0.9, L / AVG)
        pr = d2_profit(e0, cap, lf_now, nr, PA, V0=V0)
        N_tot = pr[p_idx] / (ITEMS * p - COST)
        walkin = max(0.0, N_tot - L)
        leave = 0.03 + k * max(0.0, math.log(p / 900))
        L = L * (1 - min(1.0, leave)) + walkin * 0.3 * 0.1
        pr_hist.append(pr[p_idx])
    return np.mean(pr_hist[-12:])
idxs = [int(np.where(P == q)[0][0]) for q in (900, 1000, 1200, 1500, 2000, 3000, 4000, 5000)]
for k in (0.0, 0.1, 0.3, 1.0):
    vals = [steady(i, 1.0, 0.35, k) for i in idxs]
    best = int(np.argmax(vals))
    print('  離れの値上げの効き k=%.1f：' % k + '　'.join('%d円 %+.0f' % (P[i], v) for i, v in zip(idxs, vals)) + '　→ 一番よいのは %d円' % P[idxs[best]])

print()
print('=== F12：M1 に1,000円の壁（越えた分 ε×1.5）を足した形（ε0 1.75〜2.5）。季節・評判・安いライバル（ε×1.6）の取りこぼしと、最適が壁に集まる割合')
opts = []
for (e0, cap, Lf, nr, PA) in M1GRID:
    pr = d2_profit(e0, cap, Lf, nr, PA, kink=True, V0=calib_V0(PA, nr, Lf)); i = int(np.argmax(pr))
    if P[i] < TOP: opts.append(P[i])
opts = np.array(opts)
print('  ふつうの月の最適：中央 %.0f円・最大 %.0f円・壁（995〜1,005円）に集まる組 %d／%d' % (np.median(opts), opts.max(), np.sum(abs(opts - 1000) <= 5), len(opts)))
for lab, kw in (('冬 W×1.10', dict(W=1.10)), ('8月 W×1.18', dict(W=1.18)), ('評判4.5（×0.7）', dict(R=4.5)), ('評判4（壁 1,100円に動く）', dict(R=4.0, kp=1100.0)), ('安いライバル ε×1.6', dict(eps_mult=1.6))):
    print('  M1＋壁 %-22s %s' % (lab, shares([r['loss'] for r in run(M1GRID, True, kw)])))
on = n = 0
for (e0, cap, Lf, nr, PA) in M1GRID:
    pr = d2_profit(e0, cap, Lf, nr, PA, kink=True, V0=calib_V0(PA, nr, Lf), R=4.0, kp=1100.0); i = int(np.argmax(pr))
    if P[i] >= TOP: continue
    n += 1; on += abs(P[i] - 1100) <= 5
print('  M1＋壁・評判4・壁1,100円：最適が壁±5円 %d／%d（%.0f%%）' % (on, n, 100 * on / n))

print()
print('=== F3b：入れ子が足すもの＝「どちらの型が正解か」が町の顔ぶれで入れ替わるか。釣り合った町（安い1・こだわり1）での正解の型を、実際の町でそのまま使ったときの取りこぼし')
for lam in (0.3, 0.5, 0.7, 1.0):
    losses = []
    for e, V0, nc, nk in itertools.product((1.25, 1.75), (2.0, 4.0, 8.0), range(4), range(4)):
        if nc + nk == 0: continue
        def prof(town, own): return nested(town + [own], lam, e, V0, 0.16)[-1] * 20000 * (ITEMS * own[0] - own[3])
        ref = max((CHEAP, KODA), key=lambda o: prof([CHEAP, KODA], o))
        town = [CHEAP] * nc + [KODA] * nk
        best = max(prof(town, CHEAP), prof(town, KODA))
        losses.append(pct(best - prof(town, ref), best))
    print('  λ=%.1f：%s' % (lam, shares(losses)))

print()
print('=== F9b：奥多摩（家族＋自己所有、固定費25万円）で、家族1人の労働を最低賃金で数えたときの30杯の採算（値段を地域のふつうに止める）')
for p in (900, 1000):
    c = ITEMS * p - COST; F0 = fixed(0, 100000, 1085, 0, 150000); Ff = F0 + 1085 * 8 * DAYS
    print('  %d円：固定費 %.0f→%.0f円、分岐点 %.1f杯/日、30杯の営業利益 %+.0f円' % (p, F0, Ff, Ff / (DAYS * c), 30 * DAYS * c - Ff))
