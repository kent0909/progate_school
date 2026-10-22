#!/usr/bin/env python3
# BIZ-SIMDESIGN 0.2 の論証の検査（docs/audit/BIZ-SIMDESIGN-v02-reasoning.md）のための感度分析。
# 書き手：論証検査役。元の検算 simdesign-optimum-check.py の式を写し、置き値と省いた項を変えて、
# 報告の結論（最適が動く・動かない、地域で採算が分かれる、入れ子が要る）が置き値に依存していないかを見る。
# 使い方: python3 -I boki2/docs/analysis/simdesign-reasoning-sensitivity.py
# 置き値はすべて検査役の【推論】。元のスクリプトと同じ値は「元」と書いた。
import math, itertools
import numpy as np

COST, ITEMS = 324, 1.2          # 元：1杯の材料 324円、点数 1.2
def argmax(f, xs):
    best = max(xs, key=f); return best, f(best)

# ------------------------------------------------------------------------------------------------
print('=== S1：元の d.2 の検算は d.2 の一部だけ。常連 L・待ち wait・席の上限（d.1 の 2,200〜3,700杯）を戻すと最適は天気で動くか')
# d.2（DESIGN-RAMEN 215〜223行）：V = exp(0.16(R-3) - ε·lnp' - 0.10·wait)。lnp' は 1,000円で折れる。
# 常連 L は「値段の弾力性が半分、天気の反応が半分」（d.2 の注）。wait は N/cap が 0.9 を越えた分。
def lnp_kink(p, pref, eps, kink=True):
    if not kink or p <= 1000: return eps * math.log(p / pref)
    return eps * math.log(1000 / pref) + 1.5 * eps * math.log(p / 1000)
def d2_full(p, W, nriv, eps, cap, Lfrac, V0=4.0, PA=20000, pref=900, R=3.0, kink=True, wait_on=True):
    # 固定点で wait を解く（10回）
    wait = 0.0
    Vr = math.exp(-lnp_kink(900, pref, eps, kink))
    L0 = Lfrac * 2860                     # 常連：平均の店の月の客（110杯×26日）の Lfrac 割
    for _ in range(10):
        V = math.exp(.16 * (R - 3) - lnp_kink(p, pref, eps, kink) - (0.10 * wait if wait_on else 0))
        s = V / (V0 + V + nriv * Vr)
        Wl = 1 + 0.5 * (W - 1)            # 常連は天気に半分だけ反応
        L = L0 * Wl * math.exp(-0.5 * lnp_kink(p, pref, eps, kink))   # 値段の弾力性も半分
        N = PA * (1 - Lfrac * 0.5) * s * W + L   # 常連の分だけ一見の潜在客を減らす（合計がふくらまないように）
        wait = max(0.0, N / cap - 0.9) if cap < 1e8 else 0.0
    X = min(N, cap)
    return X * (ITEMS * p - COST)
ps = list(range(600, 2510, 10))
Ws = (0.85, 1.0, 1.10)                    # d.3 の季節の倍率（7〜8月 ×0.85・12〜2月 ×1.10）
rows = []
for eps, cap, Lfrac, nriv, PA in itertools.product((1.0, 1.25, 1.5), (2200, 2900, 3700, 1e9), (0.0, 0.2, 0.35), (1, 2, 3), (10000, 20000, 40000)):
    opt = [argmax(lambda q: d2_full(q, W, nriv, eps, cap, Lfrac, PA=PA), ps)[0] for W in Ws]
    rows.append((eps, cap, Lfrac, nriv, PA, opt))
def summarize(sel, label):
    n = len(sel); moved = sum(1 for r in sel if len(set(r[5])) > 1)
    at1000 = sum(1 for r in sel if r[5][1] == 1000); attop = sum(1 for r in sel if r[5][1] >= ps[-1])
    print('  %s：組 %d／季節の倍率で最適が動いた %d（%.0f%%）／ふつうの月の最適が1,000円 %d／探索の上限（2,500円）%d' % (label, n, moved, 100 * moved / n, at1000, attop))
summarize([r for r in rows if r[1] > 1e8 and r[2] == 0], '元の検算と同じ（上限なし・常連なし）')
summarize([r for r in rows if r[1] > 1e8 and r[2] > 0], '上限なし・常連あり')
summarize([r for r in rows if r[1] < 1e8 and r[2] == 0], '上限あり（2,200〜3,700杯）・常連なし')
summarize([r for r in rows if r[1] < 1e8 and r[2] > 0], '上限あり・常連あり（d.2 の書いてあるとおりに近い）')
summarize([r for r in rows if r[1] < 1e8], '上限あり（全体）')
for eps in (1.0, 1.25, 1.5):
    summarize([r for r in rows if r[0] == eps and r[1] < 1e8 and r[2] > 0], '  うち ε=%.2f・上限あり・常連あり' % eps)
# 動いた幅
mv = [max(r[5]) - min(r[5]) for r in rows if r[1] < 1e8 and r[2] > 0 and len(set(r[5])) > 1]
if mv: print('  上限あり・常連ありで動いた組の幅（円）：最小 %d・中央 %d・最大 %d' % (min(mv), sorted(mv)[len(mv) // 2], max(mv)))
ex = [r for r in rows if r[0] == 1.25 and r[1] == 2900 and r[2] == 0.2 and r[3] == 2 and r[4] == 20000][0]
print('  例：ε=1.25・上限2,900杯・常連2割・ライバル2軒・潜在客2万 → 季節 0.85/1.0/1.10 の最適', ex[5])

print()
print('=== S2：「折れ目を外すと値上げがいつまでも得になる（ε=1.25）」は本当か。探索の上限を 5,000円まで広げる')
for eps in (1.0, 1.25, 1.5):
    p, _ = argmax(lambda q: d2_full(q, 1.0, 2, eps, 1e9, 0.0, kink=False, wait_on=False), list(range(600, 5010, 10)))
    print('  折れ目なし ε=%.2f・上限なし・ライバル2軒 → 最適 %d円%s' % (eps, p, '（探索の上限＝本当に際限なし）' if p >= 5000 else ''))
print('  参考：シェアが小さい極限の公式 p*＝(原価/点数)×ε/(ε−1)：ε=1.25 → %.0f円、ε=1.5 → %.0f円' % (COST / ITEMS * 1.25 / .25, COST / ITEMS * 1.5 / .5))

print()
print('=== S3：案M2 の「天気で9組中9組動く」の大きさ。1円刻みで動いた幅と、ふつうの日の値段のままにしたときの利益の取りこぼし（％）')
SEG = {'会社員': (1.4, .10, .95, .90), '学生': (2.2, .04, .75, .70), '高齢': (1.6, .14, .70, .80)}   # 元
AREA = {'駅前': {'会社員': .6, '学生': .2, '高齢': .2}, '学生街': {'会社員': .1, '学生': .7, '高齢': .2}, '商店街': {'会社員': .2, '学生': .1, '高齢': .7}}  # 元
V0, PA = 4.0, 20000
def m2_profit(p, area, weather, nriv=2, R=3.0, pref=900, seg=SEG, cap=None, cost=COST):
    tot = 0
    for g, share in AREA[area].items():
        e, wr, rain, hot = seg[g]
        w = {'ふつう': 1, '雨': rain, '猛暑': hot}[weather]
        V = math.exp(wr * (R - 3) * 1.6 - e * math.log(p / pref))
        tot += PA * share * w * V / (V0 + V + nriv * 1.0)
    if cap: tot = min(tot, cap)
    return tot * (ITEMS * p - cost)
ps1 = list(range(600, 1601, 1))
def regret(prof, w_ref, w_new):
    p_ref, _ = argmax(lambda q: prof(q, w_ref), ps1)
    p_new, best = argmax(lambda q: prof(q, w_new), ps1)
    return p_new - p_ref, 100 * (best - prof(p_ref, w_new)) / best
out = []
for area in AREA:
    for nriv in (1, 2, 3):
        for wn in ('雨', '猛暑'):
            d, loss = regret(lambda q, w: m2_profit(q, area, w, nriv), 'ふつう', wn)
            out.append((area, nriv, wn, d, loss))
for o in out: print('  %s ライバル%d %s：最適が %+d円、ふつうの日の値段のままの取りこぼし %.3f%%' % o)
print('  取りこぼしの最大 %.3f%%／動いた幅の最大 %d円' % (max(o[4] for o in out), max(abs(o[3]) for o in out)))

print()
print('=== S4：客層の係数を無作為に500通り置き直したとき（ε 1.2〜3.0、雨の倍率 0.6〜1.0 を客層ごと）の M2 の動き')
rng = np.random.default_rng(20261022)
ps10 = list(range(600, 2001, 5))
res = []
for _ in range(500):
    seg = {g: (rng.uniform(1.2, 3.0), SEG[g][1], rng.uniform(0.6, 1.0), 1.0) for g in SEG}
    area = list(AREA)[rng.integers(3)]
    pn, bn = argmax(lambda q: m2_profit(q, area, 'ふつう', 2, seg=seg), ps10)
    pr, br = argmax(lambda q: m2_profit(q, area, '雨', 2, seg=seg), ps10)
    loss = 100 * (br - m2_profit(pn, area, '雨', 2, seg=seg)) / br
    res.append((abs(pr - pn), loss, pn >= ps10[-1]))
d = sorted(r[0] for r in res); L = sorted(r[1] for r in res)
print('  動いた幅（円）：中央 %d・90%%点 %d・最大 %d／取りこぼし（%%）：中央 %.3f・90%%点 %.3f・最大 %.3f' % (d[250], d[450], d[-1], L[250], L[450], L[-1]))
print('  幅30円以上 %d／500、取りこぼし1%%以上 %d／500、ふつうの日の最適が探索の上限 %d／500' % (sum(1 for x in d if x >= 30), sum(1 for x in L if x >= 1), sum(1 for r in res if r[2])))

print()
print('=== S5：客層を混ぜなくても最適は状況で動くか（報告 4.2「動かすのは客の顔ぶれが変わる形だけ」の反例さがし）')
def one_seg(p, W=1.0, eps=1.75, cap=None, cost=COST, nriv=2):
    V = math.exp(-eps * math.log(p / 900)); s = V / (V0 + V + nriv)
    N = PA * s * W
    if cap: N = min(N, cap)
    return N * (ITEMS * p - cost)
cases = [
    ('単一客層・折れ目なし ε=1.75・上限なし（報告の M1）', lambda q, w: one_seg(q, W={'ふつう': 1, '雨': .85}[w])),
    ('同上に席の上限 2,900杯（d.1 の幅の中）', lambda q, w: one_seg(q, W={'ふつう': 1.15, '雨': .95}[w], cap=2900)),
    ('同上・雨の日は値段に鈍い（ε×0.85）', lambda q, w: one_seg(q, eps={'ふつう': 1.75, '雨': 1.75 * .85}[w])),
    ('同上・原価の改定（324円→360円、小麦の年2回の改定の型）', lambda q, w: one_seg(q, cost={'ふつう': 324, '雨': 360}[w])),
]
for label, f in cases:
    dd, loss = regret(f, 'ふつう', '雨')
    print('  %s：最適が %+d円、取りこぼし %.2f%%' % (label, dd, loss))

print()
print('=== S6：案B1（客一人ずつ）の「天気で動かない」は崖のせいか、刻みのせいか。元の式を写し、刻み・崖の有無・人数を変える')
SEGL = list(SEG); W_SEG = [.5, .3, .2]
def b1_profits(prices, weather, nriv, n=20000, cliff=True, seed=7):
    r = np.random.default_rng(seed)
    gi = r.choice(3, size=n, p=W_SEG)
    e = np.array([SEG[g][0] for g in SEGL])[gi]
    w = np.array([{'ふつう': 1, '雨': SEG[g][2], '猛暑': SEG[g][3]}[weather] for g in SEGL])[gi]
    out_ = r.random(n) <= w
    budget = 900 * np.exp(r.normal(0, .25, n)) * np.where(gi == 0, 1.25, 1.0)
    eps_own = r.normal(0, 1, n); eps_r = r.normal(0, 1, (n, max(nriv, 1))); eps_o = r.normal(0, 1, n)
    rival_ok = (900 <= budget * 1.3) if cliff else np.ones(n, bool)
    u_r = np.where(rival_ok[:, None], eps_r[:, :nriv], -1e9).max(axis=1) if nriv else np.full(n, -1e9)   # ライバルの値段は900円で ln(900/900)=0
    u_o = math.log(V0) + eps_o
    prof = []
    for p in prices:
        own_ok = (p <= budget * 1.3) if cliff else np.ones(n, bool)
        u_own = np.where(own_ok, -e * math.log(p / 900) + eps_own, -1e9)
        sold = np.sum(out_ & (u_own > u_r) & (u_own > u_o))
        prof.append(sold * (ITEMS * p - COST))
    return prof
for grid, label in ((list(range(400, 1310, 20)), '元の刻み20円'), (list(range(500, 900, 5)), '刻み5円')):
    for cliff in (True, False):
        line = []
        for weather in ('ふつう', '雨'):
            for nriv in (1, 3):
                pr = b1_profits(grid, weather, nriv, n=40000, cliff=cliff)
                line.append('%s/ライバル%d→%d円' % (weather, nriv, grid[int(np.argmax(pr))]))
        print('  %s・崖%s：%s' % (label, 'あり' if cliff else 'なし', '  '.join(line)))
# 崖が最適の所で効いているか：最適の値段で崖に引っかかる客の割合
r = np.random.default_rng(7); gi = r.choice(3, size=200000, p=W_SEG)
budget = 900 * np.exp(r.normal(0, .25, 200000)) * np.where(gi == 0, 1.25, 1.0)
print('  値段660円で「上限の1.3倍」を越えて候補から外れる客の割合 %.2f%%（崖がほとんど効いていない）' % (100 * np.mean(660 > budget * 1.3)))

print()
print('=== S7：入れ子は要るか。新しい安い店 C（700円）が入ったとき、安い店 A（700円）とこだわり店 B（1,100円・評判4.5）の客の減り方')
def shares_logit(stores, seg_e, seg_const=None, lam=None):
    # stores: [(name, price, R, type)]。seg_const: 型ごとの好み。lam: 型ごとの入れ子の係数（単一客層のとき）
    def V(st, e, cst):
        name, p, R, t = st
        return .16 * 1.6 * (R - 3) - e * math.log(p / 900) + (cst.get(t, 0) if cst else 0)
    tot = {s[0]: 0.0 for s in stores}
    for g, (e, wgt) in seg_e.items():
        cst = seg_const.get(g) if seg_const else None
        if lam is None:
            ex = {s[0]: math.exp(V(s, e, cst)) for s in stores}; den = V0 + sum(ex.values())
            for k in ex: tot[k] += wgt * ex[k] / den
        else:
            types = sorted(set(s[3] for s in stores))
            I = {t: math.log(sum(math.exp(V(s, e, cst) / lam) for s in stores if s[3] == t)) for t in types}
            den = V0 + sum(math.exp(lam * I[t]) for t in types)
            for s in stores:
                t = s[3]; pm = math.exp(lam * I[t]) / den
                tot[s[0]] += wgt * pm * math.exp(V(s, e, cst) / lam) / math.exp(I[t])
    return tot
base = [('A', 700, 3.0, '安い'), ('B', 1100, 4.5, 'こだわり')]
new = base + [('C', 700, 3.0, '安い')]
single = {'全員': (1.75, 1.0)}
mix = {'会社員': (1.4, .5), '学生': (2.2, .3), '高齢': (1.6, .2)}           # 元の M2 の係数と B1 の混ぜ方
mixc = {'会社員': {'こだわり': .6}, '学生': {'安い': .6}, '高齢': {}}       # 客層ごとの型の好み（入れ子の代わり）
for label, kw in (('単一客層のロジット', dict(seg_e=single)), ('M2（客層の混合・型の好みなし）', dict(seg_e=mix)),
                  ('M2＋客層ごとの型の好み（入れ子なし）', dict(seg_e=mix, seg_const=mixc)), ('入れ子（単一客層・λ=0.5）', dict(seg_e=single, lam=.5)),
                  ('M2＋入れ子（報告の推し 10.1）', dict(seg_e=mix, lam=.5))):
    s0 = shares_logit(base, **kw); s1 = shares_logit(new, **kw)
    la = 100 * (1 - s1['A'] / s0['A']); lb = 100 * (1 - s1['B'] / s0['B'])
    print('  %s：A −%.1f%%・B −%.1f%%（A の減り÷B の減り ＝ %.2f）' % (label, la, lb, la / lb if lb > 0 else float('inf')))

print()
print('=== S8：地域の採算の置き値依存（報告 4.4）。オーナーの例は「銀座100杯でも赤字・奥多摩30杯でも採算」')
DAYS = 26
def be(fixed, p): return fixed / (DAYS * (ITEMS * p - COST))
def fixed_(rent, wage, hours, other=250000): return rent + wage * hours * DAYS + other
print('  報告の置き値：都心 固定費 %d 分岐点 %.0f杯／郊外 固定費 %d 分岐点 %.0f杯' % (fixed_(1200000, 1500, 40), be(fixed_(1200000, 1500, 40), 1100), fixed_(150000, 1050, 14), be(fixed_(150000, 1050, 14), 850)))
print('  郊外の30杯の営業利益（報告の置き値・報告の .out.txt にもある）%+d円 → オーナーの「奥多摩30杯でも採算」は報告の置き値では成り立たない' % (30 * DAYS * (ITEMS * 850 - COST) - fixed_(150000, 1050, 14)))
for lab, rent, hours, other in (('家族経営：パートなし（人時0）・その他15万', 150000, 0, 150000), ('自己所有の建物：家賃0・人時8・その他15万', 0, 8, 150000), ('家族経営＋自己所有：家賃0・人時0・その他15万', 0, 0, 150000)):
    f = fixed_(rent, 1050, hours, other)
    print('  郊外 %s：固定費 %d 分岐点 %.0f杯／30杯の利益 %+d円' % (lab, f, be(f, 850), 30 * DAYS * (ITEMS * 850 - COST) - f))
cnt = 0; tot = 0
for rent, hours, p in itertools.product((560000, 800000, 1200000, 1600000), (14, 24, 40), (1000, 1100, 1300)):
    tot += 1; cnt += (100 * DAYS * (ITEMS * p - COST) - fixed_(rent, 1500, hours)) < 0
print('  都心の「100杯で赤字」：家賃 56万（BIZ-CALIB の渋谷の中央値×18坪）〜160万 × 人時14〜40 × 値段1,000〜1,300円 の %d 組のうち %d 組で赤字' % (tot, cnt))
for rent, hours in ((560000, 14), (560000, 40), (1200000, 14), (1200000, 24)):
    print('    家賃%d万・人時%d・値段1,100円：分岐点 %.0f杯' % (rent // 10000, hours, be(fixed_(rent, 1500, hours), 1100)))

print()
print('=== S9：M2 の需要で都心と郊外のどちらがもうかるか（報告 4.4 の (6) は都心の最適が探索の上限1,500円に張り付いていた）')
AREA['都心型'] = {'会社員': .8, '学生': .1, '高齢': .1}; AREA['郊外型'] = {'会社員': .2, '学生': .1, '高齢': .7}   # 元
psW = list(range(600, 3010, 10))
def area_best(area, pot, nriv, pref, cap, fixed):
    global PA
    PA_s = PA; PA = pot * DAYS
    p, prof = argmax(lambda q: m2_profit(q, area, 'ふつう', nriv, pref=pref, cap=cap), psW)
    PA = PA_s
    return p, prof - fixed
fx_u, fx_s = fixed_(1200000, 1500, 40), fixed_(150000, 1050, 14)
p, pr = area_best('都心型', 3000, 4, 1100, 3000, fx_u)
print('  報告の置き値（都心の潜在客3,000/日・ライバル4・席3,000杯）で探索を3,000円まで広げる：都心の最適 %d円・利益 %+d円' % (p, pr))
win_u = 0; tot = 0; top = 0
for pot_u, nr_u, cap in itertools.product((500, 1000, 2000, 3000), (2, 4, 8), (2200, 2900, 3700)):
    pu, pru = area_best('都心型', pot_u, nr_u, 1100, cap, fx_u)
    ps_, prs = area_best('郊外型', 300, 0, 850, cap, fx_s)
    tot += 1; win_u += pru > prs; top += pu >= psW[-1]
print('  都心の潜在客500〜3,000/日 × ライバル2〜8 × 席2,200〜3,700杯 の %d 組：都心の方がもうかる %d 組／都心の最適が探索の上限 %d 組' % (tot, win_u, top))
for pot_u, nr_u in ((500, 4), (1000, 4), (1000, 8), (2000, 8)):
    pu, pru = area_best('都心型', pot_u, nr_u, 1100, 2900, fx_u)
    print('    都心 潜在客%d・ライバル%d・席2,900：最適 %d円・利益 %+d円' % (pot_u, nr_u, pu, pru))
ps_, prs = area_best('郊外型', 300, 0, 850, 2900, fx_s)
print('    郊外 潜在客300・ライバル0・席2,900：最適 %d円・利益 %+d円' % (ps_, prs))
