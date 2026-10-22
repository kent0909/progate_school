#!/usr/bin/env python3
# BIZ-SIMDESIGN 版0.3 の検算（効く大きさの表）。書き手：BIZ-SIMDESIGN の担当。
# 物差しと線は、このスクリプトより前に simdesign-v03-threshold.txt に書いて commit した（取りこぼし 主の線3%、副の線1%・5%、探索の上限5,000円）。
# 0.2 の simdesign-optimum-check.py は「動いた・動かない」を数えていた。ここでは全部の案で
#   移動（円、1円刻み）と 取りこぼし（％）＝ 状況に合わせなかったときに失う貢献利益の割合
# を出す。論証の検査の感度分析（simdesign-reasoning-sensitivity.py、S1〜S10）の式も参考にしたが、ここでは書き直して置き値を広げた。
# 使い方: python3 -I boki2/docs/analysis/simdesign-v03-effects.py   （出力は .out.txt に保存してある。1〜2分）
# 置き値はすべて【推論】。DESIGN-RAMEN（2026-10-22 の版）d.1・d.2・d.3 から取った値は「d.x」と書いた。
import math, itertools
import numpy as np

COST, ITEMS, PREF, DAYS = 324.0, 1.2, 900.0, 26      # 材料費・点数（d.2 の 1.15〜1.30 の中）・ふつうの値段・営業日
AVG = 110 * DAYS                                      # d 章の「平均の店」 1日110杯 → 月2,860杯
P = np.arange(500, 5001, 1, dtype=float)              # 1円刻み、500〜5,000円（threshold.txt の決まり）
TOP = 4990
LINES = (1.0, 3.0, 5.0)

def pct(a, b): return 100.0 * a / b if b else float('nan')

def regret(prof_ref, prof_new):
    """prof_*: 価格の格子 P の上の貢献利益。ふつうの最適の値段 → 新しい状況の最適との差（円）と取りこぼし（％）。"""
    i0 = int(np.argmax(prof_ref)); i1 = int(np.argmax(prof_new))
    best = prof_new[i1]
    loss = pct(best - prof_new[i0], best) if best > 0 else float('nan')
    return P[i0], P[i1], loss, best - prof_new[i0]

def summarize(rows, label):
    """rows: (移動, 取りこぼし%, 上限フラグ, 円) のリスト。探索の上限に当たった組は「際限なし」として別に数え、
    移動・取りこぼしの統計からは外す（threshold.txt の決まり：どの案でも同じに構造の問題として扱う）"""
    top = sum(1 for r in rows if r[2]); ok = [r for r in rows if not r[2]]
    n = len(ok)
    if n == 0:
        print('  %-34s 組%4d｜全部が探索の上限' % (label, len(rows))); return {L: float('nan') for L in LINES}
    mv = sorted(abs(r[0]) for r in ok); ls = sorted(r[1] for r in ok)
    s = '  %-34s 組%4d｜移動 中央%5.0f円 最大%5.0f円｜取りこぼし 中央%6.2f%% 90%%点%6.2f%% 最大%6.2f%%｜' % (
        label, n, mv[n // 2], mv[-1], ls[n // 2], ls[int(n * .9)], ls[-1])
    s += ' '.join('%g%%以上 %3.0f%%' % (L, 100.0 * sum(1 for x in ls if x >= L) / n) for L in LINES)
    s += '｜際限なし（外した）%d' % top
    print(s)
    return {L: sum(1 for x in ls if x >= L) / n for L in LINES}

# =================================================================================================
# 共通：d.2 の書いてあるとおりの式（DESIGN-RAMEN 215〜227行）
#   V = exp(0.16(R−3) − ε·lnp' − 0.10·wait)、lnp' は 1,000円（kp）で折れて越えた分 ×1.5
#   ε：基準 ε0。2割以上安い競合がいれば 2.0。R≧4.5 なら ×0.7
#   N = P_a·s·W + L、L は値段の弾力性が半分・天気（季節）の反応が半分。X = min(N, cap)
#   wait = N/cap が 0.9 を越えた分。wait は V を通じて N を下げるので固定点で解く（15回）
#   V0 は「平均の店（R=3、値段900円、ライバルも900円）が月2,860杯」になるように P_a・ライバル数・常連から逆算（d 章の結論の置き方）
# =================================================================================================
def lnp(p, eps, kp=1000.0, km=1.5, kink=True, pref=PREF):
    if not kink: return eps * np.log(p / pref)
    base = eps * np.log(np.minimum(p, kp) / pref)
    over = km * eps * np.log(np.maximum(p, kp) / kp)
    return base + over

def eps_rule(eps0, R, cheap_rival):
    e = 2.0 if cheap_rival else eps0
    if R >= 4.5: e *= 0.7
    return e

def calib_V0(PA, nriv, Lf):
    s = AVG * (1 - Lf) / PA
    return 1.0 / s - 1.0 - nriv                    # V(900)=1 として

def d2_profit(eps0, cap, Lf, nriv, PA, W=1.0, R=3.0, cost=COST, cheap_rival=False, kink=True, kp=1000.0,
              wait_on=True, eps_mult=1.0, V0=None, rival_price=900.0, PAmult=1.0, items=ITEMS, pref_mult=1.0):
    if V0 is None: V0 = calib_V0(PA, nriv, Lf)
    e = eps_rule(eps0, R, cheap_rival) * eps_mult
    lp = lnp(P, e, kp=kp, kink=kink, pref=PREF * pref_mult)
    # ライバルの魅力度：基準の ε0（ライバル自身の値段の効き）で、値段 rival_price。安いライバルは1軒だけ 700円
    pr_ = PREF * pref_mult
    def Vp(price): return math.exp(-float(lnp(np.array([price]), eps0, kink=kink, pref=pr_)[0]))
    Vr = (nriv - 1) * Vp(rival_price) + Vp(700.0) if cheap_rival else nriv * Vp(rival_price)
    L0 = Lf * AVG
    Wl = 1 + 0.5 * (W - 1)
    Lp = L0 * Wl * np.exp(-0.5 * lp) * math.exp(0.16 * (R - 3) * 0.5)
    wait = np.zeros_like(P)
    for _ in range(15):
        V = np.exp(0.16 * (R - 3) - lp - (0.10 * wait if wait_on else 0))
        s = V / (V0 + V + Vr)
        N = PA * PAmult * s * W + Lp
        new = np.maximum(0.0, N / cap - 0.9) if (wait_on and cap < 1e8) else np.zeros_like(P)
        wait = 0.5 * wait + 0.5 * new
    X = np.minimum(N, cap)
    return X * (items * P - cost)

# 置き値の格子（d.1・d.2 の幅）
EPS0 = (1.0, 1.1, 1.25, 1.4, 1.5)
CAPS = (2200, 2900, 3700, 1e9)            # d.1 cap 2,200〜3,700杯。1e9 は「上限なし」（0.2 の検算の置き方、比べるため）
LFS = (0.0, 0.2, 0.35)                     # 常連の割合（d.1 の L。定着率20〜40%からの【推論】）
NRIV = (1, 2, 3)
PAS = (15000, 20000, 30000)
GRID = [g for g in itertools.product(EPS0, CAPS, LFS, NRIV, PAS) if calib_V0(g[4], g[3], g[2]) >= 0.3]

COND = {   # 状況の名前 → d2_profit への差分
    '季節 冬 W×1.10（d.3）': dict(W=1.10),
    '季節 夏 W×0.85（d.3・向きは誤り）': dict(W=0.85),
    '暦 8月の山 W×1.18（BIZ-RAMEN 12.1）': dict(W=1.18),
    '暦 2月の谷 W×0.87（同）': dict(W=0.87),
    '雨の多い月 W×0.93': dict(W=0.93),
    '雨の月に値段に鈍い ε×0.85（新）': dict(eps_mult=0.85),
    'ライバルが1軒ふえる': dict(nriv_add=1),
    '2割安いライバル（ε→2.0、d.2）': dict(cheap_rival=True),
    '評判 R=4.5（ε×0.7、d.2）': dict(R=4.5),
    '原価 324→360円（小麦の改定の型）': dict(cost=360.0),
    '寒い月に汁麺の値打ち p_ref×1.10（RCT の値打ちの型をロジットで）': dict(pref_mult=1.10),
}

def run_d2(label, kink=True, eps_set=EPS0, caps=CAPS, extra=None):
    print('--- %s' % label)
    res = {}
    grid = [g for g in itertools.product(eps_set, caps, LFS, NRIV, PAS) if calib_V0(g[4], g[3], g[2]) >= 0.3]
    for cname, kw in COND.items():
        rows = []; rows_cap = []; rows_nocap = []
        for (e0, cap, Lf, nr, PA) in grid:
            V0 = calib_V0(PA, nr, Lf)
            base = d2_profit(e0, cap, Lf, nr, PA, kink=kink, V0=V0, **(extra or {}))
            kw2 = dict(kw); add = kw2.pop('nriv_add', 0)
            new = d2_profit(e0, cap, Lf, nr + add, PA, kink=kink, V0=V0, **kw2, **(extra or {}))
            p0, p1, loss, yen = regret(base, new)
            r = (p1 - p0, loss, p1 >= TOP or p0 >= TOP, yen)
            rows.append(r); (rows_cap if cap < 1e8 else rows_nocap).append(r)
        res[cname] = summarize(rows_cap, cname + '［上限あり］')
        summarize(rows_nocap, '   〃［上限なし＝0.2の置き方］')
    return res

print('=== E1：d.2 を書いてあるとおりに（常連・待ち・上限・ε の規則・1,000円の折れ目）。ふつうの月の最適の値段のままにしたときの取りこぼし')
print('  置き値の組：ε0 %s × 上限 %s × 常連の割合 %s × ライバル %s × 潜在客 %s（V0 が0.3未満になる組は除く）→ 上限あり %d 組・上限なし %d 組' % (
    EPS0, CAPS[:3], LFS, NRIV, PAS, sum(1 for g in GRID if g[1] < 1e8), sum(1 for g in GRID if g[1] > 1e8)))
E1 = run_d2('d.2（折れ目あり）')

# ふつうの月の最適の分布（0.2 の「1,000円に貼りつく」の確かめ）
print('--- ふつうの月の最適の値段の分布（d.2・上限あり）')
opts = []
for (e0, cap, Lf, nr, PA) in GRID:
    if cap > 1e8: continue
    pr = d2_profit(e0, cap, Lf, nr, PA); opts.append(P[int(np.argmax(pr))])
opts = np.array(opts)
print('  組 %d：1,000円ちょうど %d（%.0f%%）・995〜1,005円 %d・最小 %.0f・中央 %.0f・最大 %.0f・探索の上限 %d' % (
    len(opts), np.sum(opts == 1000), 100 * np.mean(opts == 1000), np.sum(abs(opts - 1000) <= 5), opts.min(), np.median(opts), opts.max(), np.sum(opts >= TOP)))
for e0 in EPS0:
    o = []
    for (ee, cap, Lf, nr, PA) in GRID:
        if ee != e0 or cap > 1e8: continue
        o.append(P[int(np.argmax(d2_profit(ee, cap, Lf, nr, PA)))])
    o = np.array(o)
    print('    ε0=%.2f：1,000円ちょうど %d／%d、中央 %.0f円、最大 %.0f円' % (e0, np.sum(o == 1000), len(o), np.median(o), o.max()))
o = []
for (e0, cap, Lf, nr, PA) in GRID:
    if cap < 1e8 or Lf > 0: continue
    o.append(P[int(np.argmax(d2_profit(e0, cap, Lf, nr, PA)))])
o = np.array(o)
print('  参考：上限なし・常連なし（0.2 の置き方）%d 組：1,000円ちょうど %d、最小 %.0f、最大 %.0f' % (len(o), np.sum(o == 1000), o.min(), o.max()))

print('--- d.2 の常連の「値段の弾力性が半分」の穴：常連だけの需要の弾力性（1,000円を越えた所）＝0.5×ε0×1.5。1以下なら常連だけで値上げが際限なく得')
for e0 in EPS0:
    print('  ε0=%.2f：常連の弾力性（1,000円の上）%.2f %s' % (e0, 0.75 * e0, '← 1以下：常連が多い店は値上げが際限なし' if 0.75 * e0 <= 1 else ''))
hit = [(e0, Lf) for (e0, cap, Lf, nr, PA) in GRID if P[int(np.argmax(d2_profit(e0, cap, Lf, nr, PA)))] >= TOP]
print('  探索の上限 5,000円に当たった組：%d（ε0, 常連の割合 の内訳 %s）' % (len(hit), sorted(set(hit))))
for Lf in (0.2, 0.35):
    pr = d2_profit(1.0, 2900, Lf, 2, 20000); pr8 = None
    print('  ε0=1.0・上限2,900・常連%.0f%%：1,500円 %+.0f円・3,000円 %+.0f円・5,000円 %+.0f円（貢献利益）' % (100 * Lf, pr[1000], pr[2500], pr[4500]))

print()
print('=== E2：折れ目を外した d.2（M1 の芯）。探索の上限 5,000円で、最適は有限か（上限なし・常連なし・待ちなし・ライバル0〜3）')
for e0 in (1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5):
    line = []
    for nr in (0, 1, 2, 3):
        V0 = 4.0
        pr = d2_profit(e0, 1e9, 0.0, nr, 20000, kink=False, wait_on=False, V0=V0)
        i = int(np.argmax(pr)); p = P[i]
        line.append('%d軒 %s' % (nr, ('%.0f円' % p) if p < TOP else '5,000円＝際限なし'))
    print('  ε=%.2f：%s' % (e0, '／'.join(line)))
print('  読み：際限なしになるのは ε が1に近いとき（ε(1−s)≦1 の所）だけ。小さなシェアの極限 p*＝(原価/点数)·ε/(ε−1)：ε=1.25 → %.0f円、1.5 → %.0f円、2.0 → %.0f円' % (
    COST / ITEMS * 1.25 / .25, COST / ITEMS * 1.5 / .5, COST / ITEMS * 2.0 / 1.0))

print()
print('=== E3：案M1（d.2 を直す最小の案：折れ目を外し ε 1.75〜2.5、上限を効かせる、常連の慣性）を M1 の定義どおりに回す')
E3 = run_d2('M1（折れ目なし・ε0 1.75/2.0/2.5）', kink=False, eps_set=(1.75, 2.0, 2.5))

print()
print('=== E4：案M2（客層の混合）。0.2 の係数のまま、1円刻み・探索5,000円で、天気の効きと場所の効き')
SEG = {'会社員': (1.4, .10, .95, .90), '学生': (2.2, .04, .75, .70), '高齢': (1.6, .14, .70, .80)}   # 0.2 の値（ε、評判の効き、雨、猛暑）
AREA = {'駅前': {'会社員': .6, '学生': .2, '高齢': .2}, '学生街': {'会社員': .1, '学生': .7, '高齢': .2}, '商店街': {'会社員': .2, '学生': .1, '高齢': .7}}
def m2_profit(area, weather='ふつう', nriv=2, R=3.0, PA=20000, V0=4.0, seg=SEG, cap=None, wait_on=False, cost=COST, pref=PREF, eps_mult=1.0):
    tot = np.zeros_like(P); wait = np.zeros_like(P)
    for it in range(15 if (cap and wait_on) else 1):
        tot = np.zeros_like(P)
        for g, share in AREA[area].items():
            e, wr, rain, hot = seg[g]
            w = {'ふつう': 1, '雨': rain, '猛暑': hot}[weather]
            V = np.exp(wr * (R - 3) * 1.6 - e * eps_mult * np.log(P / pref) - (0.10 * wait if wait_on else 0))
            tot += PA * share * w * V / (V0 + V + nriv * 1.0)
        if cap and wait_on: wait = 0.5 * wait + 0.5 * np.maximum(0, tot / cap - 0.9)
    X = np.minimum(tot, cap) if cap else tot
    return X * (ITEMS * P - cost)
for capset, lab in ((None, '上限なし（0.2 と同じ）'), (2900, '上限2,900杯・待ちあり')):
    rows = []
    for area in AREA:
        for nr in (1, 2, 3):
            b = m2_profit(area, 'ふつう', nr, cap=capset, wait_on=True)
            for wn in ('雨', '猛暑'):
                n_ = m2_profit(area, wn, nr, cap=capset, wait_on=True)
                p0, p1, loss, yen = regret(b, n_)
                rows.append((p1 - p0, loss, p1 >= TOP or p0 >= TOP, yen))
    summarize(rows, 'M2 天気（雨・猛暑）' + lab)
# 置き値を500通り（ε 1.2〜3.0、雨 0.6〜1.0 を客層ごと）
rng = np.random.default_rng(3)
rows = []
for _ in range(300):
    seg = {g: (rng.uniform(1.2, 3.0), SEG[g][1], rng.uniform(0.6, 1.0), rng.uniform(0.6, 1.0)) for g in SEG}
    area = list(AREA)[rng.integers(3)]; nr = int(rng.integers(1, 4))
    b = m2_profit(area, 'ふつう', nr, seg=seg); n_ = m2_profit(area, '雨', nr, seg=seg)
    p0, p1, loss, yen = regret(b, n_)
    rows.append((p1 - p0, loss, p1 >= TOP or p0 >= TOP, yen))
summarize(rows, 'M2 天気・係数を300通り無作為')
# 場所の効き：駅前の最適の値段を、学生街・商店街でそのまま使ったときの取りこぼし
print('--- M2 の場所の効き（同じ値段を全部のエリアで使ったとき）')
for nr in (1, 2, 3):
    opt = {a: P[int(np.argmax(m2_profit(a, 'ふつう', nr)))] for a in AREA}
    for a in ('学生街', '商店街'):
        pr = m2_profit(a, 'ふつう', nr); i0 = int(np.where(P == opt['駅前'])[0][0]); best = pr.max()
        print('  ライバル%d：%s の最適 %.0f円、駅前の最適 %.0f円をそのまま使うと取りこぼし %.1f%%' % (nr, a, opt[a], opt['駅前'], pct(best - pr[i0], best)))
# 0.2 で書いた「会社員 ε=1.0 で駅前が1,500円に当たる」の確かめ（探索5,000円）
seg10 = dict(SEG); seg10['会社員'] = (1.0, .10, .95, .90)
pr = m2_profit('駅前', 'ふつう', 2, seg=seg10); print('  会社員 ε=1.0 にしたときの駅前の最適（探索5,000円）：%.0f円%s' % (P[int(np.argmax(pr))], '（際限なし）' if P[int(np.argmax(pr))] >= TOP else '（有限）'))

print()
print('=== E5：客層を混ぜない形で、状況が値段の判断を作る大きさ（d.2 の上限あり・常連ありの組だけ。E1 の行から抜き出し）')
for k in ('雨の月に値段に鈍い ε×0.85（新）', '暦 8月の山 W×1.18（BIZ-RAMEN 12.1）', '2割安いライバル（ε→2.0、d.2）', '評判 R=4.5（ε×0.7、d.2）', '原価 324→360円（小麦の改定の型）'):
    print('  %s：取りこぼし3%%以上の組の割合 %.0f%%（1%%以上 %.0f%%・5%%以上 %.0f%%）' % (k, 100 * E1[k][3.0], 100 * E1[k][1.0], 100 * E1[k][5.0]))

print()
print('=== E6：案B1（客一人ずつ）。10円・5円刻み × 乱数の種5つ × 崖あり/なし。共通の乱数で、ふつう→雨の取りこぼしを測る')
SEGL = list(SEG); W_SEG = np.array([.5, .3, .2])
def b1(prices, weather, nriv, n, seed, cliff=True, cap=None, pref=PREF, V0=4.0):
    r = np.random.default_rng(seed)
    gi = r.choice(3, size=n, p=W_SEG)
    e = np.array([SEG[g][0] for g in SEGL])[gi]
    w = np.array([{'ふつう': 1, '雨': SEG[g][2], '猛暑': SEG[g][3]}[weather] for g in SEGL])[gi]
    u_go = r.random(n)                      # 天気で外に出るか（共通の乱数）
    out_ = u_go <= w
    budget = 900 * np.exp(r.normal(0, .25, n)) * np.where(gi == 0, 1.25, 1.0)
    eo = r.gumbel(0, 1, n); er = r.gumbel(0, 1, (n, max(nriv, 1))); e0 = r.gumbel(0, 1, n)
    rival_ok = (900 <= budget * 1.3) if cliff else np.ones(n, bool)
    u_r = np.where(rival_ok, er[:, :nriv].max(axis=1), -1e9) if nriv else np.full(n, -1e9)
    u_o = math.log(V0) + e0
    prof = []; reasons = []
    for p in prices:
        ok = (p <= budget * 1.3) if cliff else np.ones(n, bool)
        u = np.where(ok, -e * math.log(p / pref) + eo, -1e9)
        buy = out_ & (u > u_r) & (u > u_o)
        sold = int(buy.sum())
        over = max(0, sold - cap) if cap else 0
        prof.append((sold - over) * (ITEMS * p - COST))
        reasons.append((int((~out_).sum()), int((out_ & ~ok).sum()), int((out_ & ok & (u_r >= np.maximum(u, u_o))).sum()),
                        int((out_ & ok & (u_o > np.maximum(u, u_r))).sum()), over, sold - over))
    return np.array(prof, float), reasons
for step in (10, 5):
    grid = np.arange(400, 1501, step, dtype=float)
    for cliff in (True, False):
        moves = []; losses = []
        for seed in range(5):
            for nr in (1, 3):
                pb, _ = b1(grid, 'ふつう', nr, 30000, seed, cliff); pr_, _ = b1(grid, '雨', nr, 30000, seed, cliff)
                i0, i1 = int(np.argmax(pb)), int(np.argmax(pr_))
                moves.append(grid[i1] - grid[i0]); losses.append(pct(pr_[i1] - pr_[i0], pr_[i1]))
        print('  刻み%2d円・崖%s：移動 %s 円／取りこぼし 中央 %.2f%%・最大 %.2f%%' % (step, 'あり' if cliff else 'なし',
              ','.join('%+.0f' % m for m in moves), float(np.median(losses)), max(losses)))
# 種の違いだけで最適と利益がどれだけ揺れるか（月2,860人ほどの客の数で）
grid = np.arange(400, 1501, 10, dtype=float)
opt_s = []; prof_at = []
for seed in range(20):
    pb, _ = b1(grid, 'ふつう', 2, 9000, seed)      # 潜在客9,000人 → 売れる数は月2,000〜3,000杯の帯
    opt_s.append(grid[int(np.argmax(pb))]); prof_at.append(pb[np.where(grid == 700)[0][0]])
prof_at = np.array(prof_at)
print('  種20個・潜在客9,000人（売れる数が月の平均の店の帯）：ふつうの日の最適 %s円／700円での貢献利益の揺れ 標準偏差 %.1f%%' % (
    sorted(set(int(x) for x in opt_s)), 100 * prof_at.std() / prof_at.mean()))
# 来なかった理由（B1 だけが式を書かずに出せる、と 0.2 が言った値打ち）
pb, rs = b1(np.array([700.0]), '雨', 2, 30000, 1, cliff=True, cap=4000)
t = rs[0]; n = 30000
print('  来なかった理由（雨・ライバル2・値段700円・席の上限4,000）：外に出ない %.0f%%・払える上限を越えた %.1f%%・ライバルへ %.0f%%・ラーメンをやめた %.0f%%・席からあふれ %.1f%%・売れた %.0f%%' % tuple(100.0 * x / n for x in t))

print()
print('=== E7：RCT の店の品の形（OpenRCT2 Guest.cpp の getItemValue と買うかの判定）をラーメンに写す')
# 原文の形：品の価値は気温で HotValue／ColdValue／BaseValue に切り替わる。値段が価値を越えたとき、
#   越えた分を幸福の段（128以上で半分、180以上でさらに半分）で割り、0〜7 の乱数より大きければ買わない。
# 写し【推論】：汁麺の価値 v は寒い日 1,100円・ふつう 1,000円・暑い日 850円（ColdValue/BaseValue/HotValue の役）。
#   越えた分 ÷ k（k=1・2・4：店の評判で決まる客の機嫌の段の割合）が 0〜Δ の一様乱数より大きければ来ない。Δ は v の 10/30/50%。
#   値段が v 以下なら、来る人は全員来る（RCT の店の品と同じく、価値より安ければ値段では断らない）。
def rct_profit(v, delta_frac, happy_mix, pot=3000, cost=COST):
    # happy_mix：(k=1 の割合, k=2, k=4)
    acc = np.zeros_like(P)
    for share, k in zip(happy_mix, (1, 2, 4)):
        gap = np.maximum(0.0, P - v) / k
        D = delta_frac * v
        acc += share * np.clip(1 - gap / D, 0, 1)
    return pot * acc * (ITEMS * P - cost)
for dfrac in (0.1, 0.3, 0.5):
    for mix, lab in (((1, 0, 0), '機嫌ふつう'), ((.3, .5, .2), '評判の良い店')):
        b = rct_profit(1000, dfrac, mix)
        for t, v in (('寒い日', 1100), ('暑い日', 850)):
            p0, p1, loss, yen = regret(b, rct_profit(v, dfrac, mix))
            print('  Δ=%2.0f%%・%s・%s：最適 %.0f→%.0f円（%+.0f円）、ふつうの日の値段のままの取りこぼし %.1f%%' % (100 * dfrac, lab, t, p0, p1, p1 - p0, loss))
# 機嫌の段（評判）が変わったとき
for dfrac in (0.1, 0.3):
    p0, p1, loss, yen = regret(rct_profit(1000, dfrac, (1, 0, 0)), rct_profit(1000, dfrac, (.3, .5, .2)))
    print('  Δ=%2.0f%%・評判が上がり機嫌の良い客がふえた（ふつう→評判の良い店）：最適 %.0f→%.0f円、取りこぼし %.1f%%' % (100 * dfrac, p0, p1, loss))

print()
print('=== E8：入れ子（型の取り合い）。新しい安い店が入ったときの、同じ型の店と違う型の店の客の減り方。λ 0.3〜1.0 × 店の数2〜5')
def nested_shares(stores, lam, e=1.75, V0=4.0):
    # stores: [(price, R, type)]
    V = [0.16 * 1.6 * (R - 3) - e * math.log(p / PREF) for p, R, t in stores]
    types = sorted(set(s[2] for s in stores))
    I = {t: math.log(sum(math.exp(V[i] / lam) for i, s in enumerate(stores) if s[2] == t)) for t in types}
    den = V0 + sum(math.exp(lam * I[t]) for t in types)
    return [math.exp(lam * I[s[2]]) / den * math.exp(V[i] / lam) / math.exp(I[s[2]]) for i, s in enumerate(stores)]
CHEAP, KODA = (700, 3.0, '安い'), (1100, 4.5, 'こだわり')
for nstores in (2, 3, 4, 5):
    # 自店A=安い、自店B=こだわり、残りは安い・こだわりを交互に
    others = [CHEAP if i % 2 == 0 else KODA for i in range(nstores - 2)]
    base = [CHEAP, KODA] + others
    line = []
    for lam in (0.3, 0.5, 0.7, 1.0):
        s0 = nested_shares(base, lam); s1 = nested_shares(base + [CHEAP], lam)
        la = 100 * (1 - s1[0] / s0[0]); lb = 100 * (1 - s1[1] / s0[1])
        line.append('λ=%.1f 安い−%.0f%%・こだわり−%.0f%%（比%.1f）' % (lam, la, lb, la / lb))
    print('  店%d軒：%s' % (nstores, '／'.join(line)))
# 型を選ぶ判断の大きさ：町の店の型の顔ぶれが変わると、自店がどちらの型に寄せるかで客数がどれだけ違うか
print('--- 型の選び（自店が安い型かこだわり型か）で、町の顔ぶれが変わったときの客数の差')
for lam in (0.5, 0.7, 1.0):
    for town, lab in (([CHEAP, CHEAP, CHEAP], '安い店が3軒の町'), ([KODA, KODA, KODA], 'こだわり店が3軒の町')):
        sc = nested_shares(town + [CHEAP], lam)[-1]; sk = nested_shares(town + [KODA], lam)[-1]
        print('  λ=%.1f・%s：自店が安い型 %.3f・こだわり型 %.3f（こだわり÷安い ＝ %.2f）' % (lam, lab, sc, sk, sk / sc))

print()
print('=== E9：1,000円の壁。形ごとに、ふつうの月の最適が壁（995〜1,005円）に集まる割合と、評判が上がったとき壁を越えるか')
def wall_stats(kp_fn, label, kink=True):
    at = 0; n = 0; moves = []; losses = []
    for (e0, cap, Lf, nr, PA) in GRID:
        if cap > 1e8: continue
        V0 = calib_V0(PA, nr, Lf)
        b = d2_profit(e0, cap, Lf, nr, PA, V0=V0, kink=kink, kp=kp_fn(3.0, Lf))
        nw = d2_profit(e0, cap, Lf, nr, PA, V0=V0, kink=kink, R=4.0, kp=kp_fn(4.0, Lf))
        p0, p1, loss, yen = regret(b, nw)
        n += 1; at += abs(p0 - 1000) <= 5; moves.append(p1 - p0); losses.append(loss)
    ms = sorted(moves); ls = sorted(losses)
    print('  %-42s 壁に集まる %3.0f%%｜評判3→4（ε の規則は R≧4.5 なので変わらない）：移動 中央 %+.0f円・取りこぼし 中央 %.2f%%・3%%以上 %.0f%%' % (
        label, 100 * at / n, ms[n // 2], ls[n // 2], 100 * sum(1 for x in ls if x >= 3) / n))
wall_stats(lambda R, Lf: 1000.0, 'A 壁の位置が固定（d.2）')
wall_stats(lambda R, Lf: 1000.0 * (1 + 0.10 * (R - 3)), 'B 壁の位置が評判で動く（R1段で+10%）')
wall_stats(lambda R, Lf: 1000.0 * (1 + 0.10 * (R - 3) + 0.3 * Lf), 'C 評判と常連の割合で動く（常連3割で+9%）')
wall_stats(lambda R, Lf: 1000.0, 'D 壁なし（M1 の折れ目なし）', kink=False)

print()
print('=== E10：地域の採算（オーナーの例「銀座だと100杯でも赤字、奥多摩なら30杯でも採算」）。固定費の構造を変数にする')
# BIZ-CALIB G3 の式と仮置き：分岐点＝月の固定費 ÷（客単価×(1−原価率0.35−変動費率0.05)）÷26
#   固定費＝家賃（坪単価×18坪）＋店主の報酬＋パートの時給×8時間×26日×人数＋その他の固定費
def fixed(rent_tsubo, owner, wage, part_n, other, tsubo=18):
    return rent_tsubo * tsubo + owner + wage * 8 * DAYS * part_n + other
def cm(tanka): return tanka * (1 - 0.35 - 0.05)
def profit_cups(cups, F, tanka): return cups * DAYS * cm(tanka) - F
def be(F, tanka): return F / cm(tanka) / DAYS
cases = [
    ('銀座：坪5万・店主30万・パート1.5人・その他30万', fixed(50000, 300000, 1280, 1.5, 300000), 1077),
    ('銀座：坪3.1万（渋谷の中央値）・同上', fixed(31176, 300000, 1280, 1.5, 300000), 1077),
    ('銀座：坪5万・店主30万・パート3人・その他40万', fixed(50000, 300000, 1280, 3.0, 400000), 1077),
    ('銀座：坪5万・客単価1,300円（値段の受け入れが高い）', fixed(50000, 300000, 1280, 1.5, 300000), 1300),
    ('奥多摩：G3 の過疎の仮置き（坪3千・店主30万・パート1.5人・その他30万）', fixed(3000, 300000, 1085, 1.5, 300000), 1034),
    ('奥多摩：家族で回す（パートなし）・店主30万', fixed(3000, 300000, 1085, 0, 300000), 1034),
    ('奥多摩：家族で回す・店主の報酬を低く（10万）・その他15万', fixed(3000, 100000, 1085, 0, 150000), 1034),
    ('奥多摩：家族＋建物は自己所有（家賃0）・店主10万・その他15万', fixed(0, 100000, 1085, 0, 150000), 1034),
    ('奥多摩：家族＋自己所有・店主の報酬0（年金・副業で暮らす）・その他12万', fixed(0, 0, 1085, 0, 120000), 1034),
]
for lab, F, tk in cases:
    print('  %-58s 固定費 %8.0f円｜分岐点 %5.1f杯/日｜100杯 %+9.0f円｜30杯 %+9.0f円' % (lab, F, be(F, tk), profit_cups(100, F, tk), profit_cups(30, F, tk)))
print('  0.2 の置き値（都心 家賃120万・人時40×1,500円・その他25万／郊外 家賃15万・人時14×1,050円・その他25万、1杯の貢献＝点数×値段−324円）：')
def f02(rent, wage, hours, other=250000): return rent + wage * hours * DAYS + other
for lab, F, p in (('都心型 1,100円', f02(1200000, 1500, 40), 1100), ('郊外型 850円', f02(150000, 1050, 14), 850)):
    c = ITEMS * p - COST
    print('    %s：固定費 %.0f円・分岐点 %.0f杯/日・100杯 %+.0f円・30杯 %+.0f円' % (lab, F, F / (DAYS * c), 100 * DAYS * c - F, 30 * DAYS * c - F))

print()
print('--- 需要の式から客数を出して比べる（d.2 の書いてあるとおりの式。都心＝潜在客が多くライバルが多い、郊外＝少なくライバルが少ない）')
# 都心：月の潜在客 PA=78,000（3,000人/日）、ライバル4、上限3,700。郊外：PA=7,800（300人/日）、ライバル0、上限2,200。
# V0 は「その地域の平均の店（R=3・900円）」が 2,860杯 にならないので、0.2 と同じく 4.0 に置き、地域ごとの V0 の置き方を2通り見る。
def area_case(PA, nr, cap, F, V0, e0=1.25, pref_mult=1.0, label=''):
    pr = d2_profit(e0, cap, 0.2, nr, PA, V0=V0, kink=True)
    i = int(np.argmax(pr)); p = P[i]
    i_ref = int(np.where(P == 900)[0][0])
    X = pr / (ITEMS * P - COST)
    return p, X[i] / DAYS, pr[i] - F, X[i_ref] / DAYS, pr[i_ref] - F
for V0 in (4.0, 8.0):
    for e0 in (1.0, 1.25, 1.5):
        u = area_case(78000, 4, 3700, f02(1200000, 1500, 40), V0, e0)
        s = area_case(7800, 0, 2200, f02(150000, 1050, 14), V0, e0)
        print('  V0=%.0f ε0=%.2f：都心 900円で%5.1f杯/日 %+9.0f円・最適%5.0f円で%5.1f杯 %+9.0f円｜郊外 900円で%5.1f杯 %+9.0f円・最適%5.0f円で%5.1f杯 %+9.0f円' % (
            V0, e0, u[3], u[4], u[0], u[1], u[2], s[3], s[4], s[0], s[1], s[2]))
print('  （d.2 は折れ目と ε の規則があるので、都心の最適は探索の上限に当たらない。0.2 の M2 の (6) は折れ目も待ちもない式だった）')

print('--- 置き値を振って、オーナーの例が両方とも成り立つ組を数える（最適の値段で。都心は銀座の固定費、奥多摩は家族＋自己所有の固定費）')
F_gz = fixed(50000, 300000, 1280, 1.5, 300000); F_ok = fixed(0, 100000, 1085, 0, 150000); F_ok_g3 = fixed(3000, 300000, 1085, 1.5, 300000)
both = 0; tot = 0; gz_loss = 0; ok_win = 0; ok_win_g3 = 0; ex = []
for potu, nru, V0, e0, potr, nrr in itertools.product((300, 600, 1000, 2000, 3000), (2, 4, 8), (4.0, 8.0), (1.1, 1.25, 1.5), (60, 100, 150, 300), (0, 1)):
    pu = d2_profit(e0, 3700, 0.2, nru, potu * DAYS, V0=V0); ps_ = d2_profit(e0, 2200, 0.2, nrr, potr * DAYS, V0=V0)
    iu = int(np.argmax(pu)); ir = int(np.argmax(ps_))
    if P[iu] >= TOP or P[ir] >= TOP: continue
    tot += 1
    lu = pu[iu] - F_gz < 0; wr = ps_[ir] - F_ok > 0; wr3 = ps_[ir] - F_ok_g3 > 0
    gz_loss += lu; ok_win += wr; ok_win_g3 += wr3; both += lu and wr
    cups_u = pu[iu] / (ITEMS * P[iu] - COST) / DAYS; cups_r = ps_[ir] / (ITEMS * P[ir] - COST) / DAYS
    if lu and wr and len(ex) < 4: ex.append('都心 潜在客%d/日・ライバル%d → %.0f円 %.0f杯/日 %+.0f円｜奥多摩 潜在客%d/日・ライバル%d → %.0f円 %.0f杯/日 %+.0f円（V0=%.0f ε0=%.2f）' % (
        potu, nru, P[iu], cups_u, pu[iu] - F_gz, potr, nrr, P[ir], cups_r, ps_[ir] - F_ok, V0, e0))
print('  組 %d：銀座が最適の値段でも赤字 %d（%.0f%%）／奥多摩（家族＋自己所有）が黒字 %d（%.0f%%）／両方 %d（%.0f%%）／奥多摩を G3 の過疎の仮置きにすると黒字 %d（%.0f%%）' % (
    tot, gz_loss, 100 * gz_loss / tot, ok_win, 100 * ok_win / tot, both, 100 * both / tot, ok_win_g3, 100 * ok_win_g3 / tot))
for e in ex: print('   例：' + e)
print('--- 待ちの項（d.2 の −0.10·wait）の効きの大きさ：都心（潜在客3,000/日・ライバル4・上限3,700・V0=4・ε0=1.25）')
for w in (True, False):
    pu = d2_profit(1.25, 3700, 0.2, 4, 78000, V0=4.0, wait_on=w); i = int(np.argmax(pu))
    print('  待ち%s：最適 %.0f円・貢献利益 %.0f円' % ('あり' if w else 'なし', P[i], pu[i]))

print()
print('--- Capitalism Lab の「賃金×必需度」の形（r5-fv-capilab-beginners）を需要に入れると、地域の値段の受け入れはどれだけ開くか')
# 写し【推論】：エリアのふつうの値段 p_ref_a ＝ 900 ×（賃金_a／賃金の平均）^(1−必需度)。ラーメン（食べ物）は必需度が高い。
for nec in (0.9, 0.7, 0.5):
    for lab, wr in (('都心（賃金1.3倍）', 1.3), ('過疎（賃金0.8倍）', 0.8)):
        print('  必需度 %.1f・%s：p_ref %.0f円' % (nec, lab, 900 * wr ** (1 - nec)), end='')
    print()

print()
print('=== E11：暦（エリア×月の人の多さ P_{a,t}）。立地の型ごとの月の倍率【推論：BIZ-RAMEN 12章の向き、大きさは仮置き→BIZ-CALIB】')
CAL = {   # 1〜12月
    'オフィス街':  [0.80, 1.00, 1.00, 1.00, 0.85, 1.00, 1.00, 0.80, 1.00, 1.00, 1.00, 0.85],
    '住宅・郊外':  [1.05, 0.92, 1.00, 0.95, 1.04, 0.95, 0.98, 1.18, 0.99, 1.04, 1.07, 1.02],
    '学生街':      [1.00, 0.70, 0.70, 1.05, 1.00, 1.00, 1.00, 0.70, 0.75, 1.05, 1.05, 0.95],
    '観光地':      [1.10, 0.90, 1.00, 1.05, 1.35, 0.95, 1.20, 1.50, 1.05, 1.10, 1.05, 1.10],
}
for typ, mul in CAL.items():
    for cap in (2900, 3700):
        rows = []
        for (e0, Lf, nr) in itertools.product((1.0, 1.25, 1.5), (0.0, 0.2), (1, 2)):
            PA = 20000; V0 = calib_V0(PA, nr, Lf)
            if V0 < 0.3: continue
            prs = [d2_profit(e0, cap, Lf, nr, PA, V0=V0, PAmult=m) for m in mul]
            year = np.sum(prs, axis=0); i_year = int(np.argmax(year))      # 1年を通して1つの値段
            best = sum(pr.max() for pr in prs)
            loss = pct(best - year[i_year], best)
            moves = [P[int(np.argmax(pr))] - P[i_year] for pr in prs]
            rows.append((max(moves) - min(moves), loss, False, best - year[i_year]))
        summarize(rows, '%s・上限%d：月ごとに値段を変えない' % (typ, cap))
print('  （取りこぼしは1年分の貢献利益に対する割合。移動は月ごとの最適の幅）')
# 値段でなく人手（上限）で受ける判断：8月だけパートを足して上限を上げる、の大きさ
print('--- 観光地の8月：人を足して上限を 2,900→3,700 にするか（値段は年の値段のまま）')
for e0 in (1.0, 1.25, 1.5):
    V0 = calib_V0(20000, 2, 0.2)
    a = d2_profit(e0, 2900, 0.2, 2, 20000, V0=V0, PAmult=1.5); b = d2_profit(e0, 3700, 0.2, 2, 20000, V0=V0, PAmult=1.5)
    i = int(np.where(P == 1000)[0][0])
    print('  ε0=%.2f・1,000円：上限2,900 %+.0f円 → 3,700 %+.0f円（差 %+.0f円＝パート約%.0f人時分）' % (e0, a[i], b[i], b[i] - a[i], (b[i] - a[i]) / 1085))

print()
print('=== E12：天気が値段でなく仕込み（prep）の判断を作る大きさ（d.2 の X=min(N, prep)、d.6 の廃棄）')
# 置き値【推論】：月の見込み 2,860杯（ふつうの月）、週ごとの ±10% の一様乱数（d.2）を4.3週分、値段1,000円・点数1.2。
# 仕込んで売れ残った分は、1杯の材料費 324円のうち 40%（スープ・具。麺は持ち越せる）を廃棄で失う。
# 仕込みは週ごとに決める。「ふつうの月の仕込み」を雨の月にそのまま使ったときの取りこぼし（貢献利益に対する％）。
rng = np.random.default_rng(11)
def prep_profit(prep_w, Wm, sims=4000, waste=0.4, base=AVG / 4.3):
    U = rng.uniform(0.9, 1.1, size=(sims,))
    N = base * Wm * U
    X = np.minimum(N, prep_w)
    left = np.maximum(0, prep_w - N)
    return np.mean(X * (ITEMS * 1000 - COST) - left * COST * waste)
grid = np.arange(400, 900, 1.0)
for Wm, lab in ((0.93, '店内・雨の多い月 W×0.93'), (0.85, '屋台・雨の多い月 W×0.85（d.3 の屋外）'), (1.18, '観光地・8月 W×1.18（席の上限は別）')):
    pr_n = np.array([prep_profit(g, 1.0) for g in grid]); g_n = grid[int(np.argmax(pr_n))]
    pr_r = np.array([prep_profit(g, Wm) for g in grid]); g_r = grid[int(np.argmax(pr_r))]
    best = pr_r.max(); keep = prep_profit(g_n, Wm)
    print('  %s：週の仕込み ふつう %.0f杯 → この月 %.0f杯。ふつうの仕込みのままの取りこぼし %.2f%%（%+.0f円/週）' % (lab, g_n, g_r, pct(best - keep, best), keep - best))
