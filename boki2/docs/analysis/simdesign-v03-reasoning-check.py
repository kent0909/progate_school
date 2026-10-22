#!/usr/bin/env python3
# BIZ-SIMDESIGN 版0.3 の論証の再検査（docs/audit/BIZ-SIMDESIGN-v02-reasoning.md 15章）のための感度分析。
# 書き手：論証検査役。版0.3 の検算 simdesign-v03-effects.py の関数をそのまま読み込み（出力は捨てる）、
# 線の置き方・置き値の格子の組み方・比べ方の公平さ・地域の固定費の形の選び方で、結論が変わるかを見る。
# 使い方: python3 -I boki2/docs/analysis/simdesign-v03-reasoning-check.py   （約1分）
# 置き値を変えた所は全部【検査役の推論】。
import os, io, sys, runpy, contextlib, itertools, math
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
with contextlib.redirect_stdout(io.StringIO()):
    M = runpy.run_path(os.path.join(HERE, 'simdesign-v03-effects.py'))
d2_profit, regret, calib_V0, P, TOP = M['d2_profit'], M['regret'], M['calib_V0'], M['P'], M['TOP']
EPS0, CAPS, LFS, NRIV, PAS, COND = M['EPS0'], M['CAPS'], M['LFS'], M['NRIV'], M['PAS'], M['COND']
ITEMS, COST, DAYS, AVG = M['ITEMS'], M['COST'], M['DAYS'], M['AVG']

def rows_for(cname, eps_set=EPS0, caps=(2200, 2900, 3700), kink=True, kw_override=None, lfs=LFS, nrivs=NRIV, pas=PAS):
    kw = dict(COND[cname]) if kw_override is None else dict(kw_override)
    add = kw.pop('nriv_add', 0)
    out = []
    for (e0, cap, Lf, nr, PA) in itertools.product(eps_set, caps, lfs, nrivs, pas):
        V0 = calib_V0(PA, nr, Lf)
        if V0 < 0.3: continue
        b = d2_profit(e0, cap, Lf, nr, PA, kink=kink, V0=V0)
        n = d2_profit(e0, cap, Lf, nr + add, PA, kink=kink, V0=V0, **kw)
        p0, p1, loss, yen = regret(b, n)
        out.append(dict(e0=e0, cap=cap, Lf=Lf, nr=nr, PA=PA, loss=loss, top=(p0 >= TOP or p1 >= TOP)))
    return out
def share(rows, L):
    ok = [r for r in rows if not r['top']]
    return 100.0 * sum(1 for r in ok if r['loss'] >= L) / len(ok) if ok else float('nan')

print('=== C1：線を1%・3%・5%にしたとき「判断を作る（半分以上の組）」の判定がどう変わるか（d.2 と M1、上限あり）')
verdict = {}
for model, kink, eps in (('d.2', True, EPS0), ('M1', False, (1.75, 2.0, 2.5))):
    for c in COND:
        r = rows_for(c, eps_set=eps, kink=kink)
        s = [share(r, L) for L in (1.0, 3.0, 5.0)]
        v = ''.join('作' if x >= 50 else '・' for x in s)
        verdict[(model, c)] = v
        flag = '' if len(set(v)) == 1 else '  ← 線で判定が変わる'
        print('  %-3s %-44s 1%%:%5.0f%% 3%%:%5.0f%% 5%%:%5.0f%%  [%s]%s' % (model, c, s[0], s[1], s[2], v, flag))
print('  （[ ] は 1%・3%・5% の線での判定。作＝半分以上の組で線を越える）')

print()
print('=== C2：「半分以上の組」は置き値の格子の組み方しだいか。d.2 の季節（冬・8月）を、席の上限ごと・潜在客ごとに分ける')
for c in ('季節 冬 W×1.10（d.3）', '暦 8月の山 W×1.18（BIZ-RAMEN 12.1）'):
    r = rows_for(c)
    for cap in (2200, 2900, 3700):
        print('  %s 上限%d：3%%以上 %.0f%%' % (c[:12], cap, share([x for x in r if x['cap'] == cap], 3.0)))
    for PA in PAS:
        print('  %s 潜在客%d：3%%以上 %.0f%%' % (c[:12], PA, share([x for x in r if x['PA'] == PA], 3.0)))
# 平均の店（月2,860杯）は d.1 の上限 2,200〜3,700杯のどこに来るか
print('  参考：d 章の平均の店は月%d杯。d.1 の席の幅 2,200〜3,700杯のうち、平均の店で席が足りない（上限<平均）のは 2,200 と（ほぼ）2,900' % AVG)
# 上限ごとに、ふつうの月に上限に当たっている店の割合
for cap in (2200, 2900, 3700):
    hit = 0; n = 0
    for (e0, Lf, nr, PA) in itertools.product(EPS0, LFS, NRIV, PAS):
        V0 = calib_V0(PA, nr, Lf)
        if V0 < 0.3: continue
        pr = d2_profit(e0, cap, Lf, nr, PA, V0=V0); i = int(np.argmax(pr))
        if P[i] >= TOP: continue
        X = pr[i] / (ITEMS * P[i] - COST); n += 1; hit += X >= cap - 1
    print('  上限%d：ふつうの月の最適の値段で席が埋まっている組 %d／%d（%.0f%%）' % (cap, hit, n, 100 * hit / n))

print()
print('=== C3：「状況で ε を変える規則が値段の判断を強く作る」は規則の跳ねの大きさを置いただけか。M1 にも同じ割合の跳ねを入れる')
# d.2 の規則は ε0 1.0〜1.5 → 2.0（×1.33〜×2.0）。M1（ε0 1.75〜2.5）で「2.0 に置き換え」は跳ねがほぼ0か逆向き。
for mult in (1.33, 1.6, 2.0):
    r = rows_for('2割安いライバル（ε→2.0、d.2）', eps_set=(1.75, 2.0, 2.5), kink=False, kw_override=dict(eps_mult=mult))
    print('  M1・安いライバルで ε×%.2f：3%%以上 %.0f%%（1%%以上 %.0f%%・5%%以上 %.0f%%）' % (mult, share(r, 3), share(r, 1), share(r, 5)))
for mult in (1.1, 1.2, 1.33):
    r = rows_for('2割安いライバル（ε→2.0、d.2）', kw_override=dict(eps_mult=mult))
    print('  d.2・安いライバルで ε×%.2f（2.0 の置き換えでなく割合）：3%%以上 %.0f%%' % (mult, share(r, 3)))

print()
print('=== C4：動く壁（推し③）の「判断」は、壁の位置を最適に重ねた作り方から出るか。壁の位置を月報に出せば読むだけになる')
# E9 の B：k＝1,000×(1＋0.10(R−3))。評判3→4 で最適は k に乗って +100円動く。壁の位置を知っていれば、正解は「k に置く」。
cnt = 0; on_k = 0; n = 0
for (e0, cap, Lf, nr, PA) in itertools.product(EPS0, (2200, 2900, 3700), LFS, NRIV, PAS):
    V0 = calib_V0(PA, nr, Lf)
    if V0 < 0.3: continue
    pr = d2_profit(e0, cap, Lf, nr, PA, V0=V0, R=4.0, kp=1100.0); i = int(np.argmax(pr))
    if P[i] >= TOP: continue
    n += 1; on_k += abs(P[i] - 1100) <= 5
print('  評判4・壁1,100円：最適が壁の位置±5円にある組 %d／%d（%.0f%%）＝壁の位置を見せれば値段は「壁に置く」で決まる' % (on_k, n, 100 * on_k / n))

print()
print('=== C5：地域の「両方が成り立つ38%」は固定費の形の選び方しだいか（BIZ-CALIB 版0.3 の検査 R3 と同じ問い）')
fixed, f_gz, f_ok = M['fixed'], M['F_gz'], M['F_ok']
F_g3 = M['F_ok_g3']
def both_count(F_u, F_r, potus=(300, 600, 1000, 2000, 3000)):
    tot = both = gz = ok = 0
    by = {}
    for potu, nru, V0, e0, potr, nrr in itertools.product(potus, (2, 4, 8), (4.0, 8.0), (1.1, 1.25, 1.5), (60, 100, 150, 300), (0, 1)):
        pu = d2_profit(e0, 3700, 0.2, nru, potu * DAYS, V0=V0); pr_ = d2_profit(e0, 2200, 0.2, nrr, potr * DAYS, V0=V0)
        iu, ir = int(np.argmax(pu)), int(np.argmax(pr_))
        if P[iu] >= TOP or P[ir] >= TOP: continue
        lu = pu[iu] - F_u < 0; wr = pr_[ir] - F_r > 0
        tot += 1; gz += lu; ok += wr; both += lu and wr
        by.setdefault(potu, [0, 0]); by[potu][0] += 1; by[potu][1] += lu
    return tot, gz, ok, both, by
F_same_heavy = fixed(3000, 300000, 1085, 1.5, 300000)   # 奥多摩に銀座と同じ「人を雇う」形（家賃・時給だけ地域の値）
F_gz_family = fixed(50000, 100000, 1280, 0, 150000)      # 銀座に奥多摩と同じ「家族で回す」形（家賃0にはしない）
for lab, Fu, Fr in (('版0.3 の置き方（銀座＝人を雇う・奥多摩＝家族＋自己所有）', f_gz, f_ok),
                    ('同じ「人を雇う」形（奥多摩は G3 の過疎の仮置き）', f_gz, F_g3),
                    ('同じ「家族で回す」形（銀座も店主10万・パート0・その他15万）', F_gz_family, f_ok)):
    tot, gz, ok, both, by = both_count(Fu, Fr)
    print('  %s：組 %d／銀座赤字 %d（%.0f%%）／奥多摩黒字 %d（%.0f%%）／両方 %d（%.0f%%）' % (lab, tot, gz, 100 * gz / tot, ok, 100 * ok / tot, both, 100 * both / tot))
tot, gz, ok, both, by = both_count(f_gz, f_ok)
print('  版0.3 の置き方で、銀座の潜在客ごとの赤字の割合：' + '　'.join('%d人/日 %d/%d' % (k, v[1], v[0]) for k, v in sorted(by.items())))
print('  → 38% は格子の潜在客の5段（300〜3,000人/日）のうち低い2段がほぼ全部赤字、という格子の組み方の産物')
# 奥多摩の最適の値段（独占の値付け）
prices = []
for potr, nrr, V0, e0 in itertools.product((60, 100, 150, 300), (0, 1), (4.0, 8.0), (1.1, 1.25, 1.5)):
    pr_ = d2_profit(e0, 2200, 0.2, nrr, potr * DAYS, V0=V0); i = int(np.argmax(pr_))
    if P[i] < TOP: prices.append(P[i])
prices = np.array(prices)
print('  奥多摩の最適の値段：中央 %.0f円・最大 %.0f円・1,300円以上の組 %d／%d' % (np.median(prices), prices.max(), np.sum(prices >= 1300), len(prices)))
# 値段を地域のふつう（900〜1,000円）に止めたときの奥多摩の 30杯の採算（家族＋自己所有）
for p in (900, 1000):
    c = ITEMS * p - COST
    print('  奥多摩（家族＋自己所有、固定費 %.0f円）を %d円で：分岐点 %.1f杯/日（家族の労働を数えないとき）' % (f_ok, p, f_ok / (DAYS * c), ))
    # 家族1人の労働を最低賃金で数える
    Ff = f_ok + 1085 * 8 * DAYS
    print('    家族1人の労働を最低賃金1,085円×8時間で数える：固定費 %.0f円・分岐点 %.1f杯/日・30杯の営業利益 %+.0f円' % (Ff, Ff / (DAYS * c), 30 * DAYS * c - Ff))

print()
print('=== C6：B1 を捨てた理由「乱数の種の揺れ 2.0% が線3%に近く判断を埋める」と、d.2 自身の週の乱数の揺れ')
sd_w = 10 / math.sqrt(3); sd_m = sd_w / math.sqrt(4.3)
print('  d.2 の週の ±10%% 一様乱数：週の標準偏差 %.1f%%・月 %.1f%%（threshold.txt の線の根拠そのもの）。B1 の種の揺れ 2.0%% はこれより小さい' % (sd_w, sd_m))
print('  → 「揺れが判断を埋める」なら d.2 の芯にも同じ理由が当たる。B1 だけを捨てる理由にならない')

print()
print('=== C7：仕込みの「判断」（E12）の暦の倍率の食い違いと、予報が当たる前提')
print('  E12 は観光地の8月を W×1.18 で回したが、4.5 の暦の表の観光地の8月は 1.50。家計の 1.18 は住宅・郊外の行')
print('  暦は前もって分かる（確定）ので、8月に仕込みを増やすのは引き換えのない一択（点検表#1「引き換えがある」を満たさない）【検査役の推論】')
