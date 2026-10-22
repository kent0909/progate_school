#!/usr/bin/env python3
# BIZ-SIMDESIGN 0.2：需要の式ごとに「最適な手（値段）が状況で動くか」を総当たりで数える。
# 使い方: python3 -I boki2/docs/analysis/simdesign-optimum-check.py
# 式の出典：(1) Lemonade Stand（Apple II 版）の行1190〜1300（simdesign-applesoft-list.py で取り出した一覧）
#           (2) DESIGN-RAMEN d.2（215〜222行）。係数は d.2 のとおり、置けない値は【推論】として下の PARAM に明記
#           (3)(4) BIZ-SIMDESIGN 0.2 の案 M2（客層の混合ロジット）・B1（客一人ずつの閾値）。係数は全部【推論】
import math, itertools

def argmax(f, xs):
    best = max(xs, key=f); return best, f(best)

print('=== (1) Lemonade Stand：値段P（セント）×看板S（枚）を総当たり。作る杯数は売れる数ちょうど（売れ残りなし）')
def lemon(P, S, R1, C):
    N1 = (10 - P) / 10 * .8 * 30 + 30 if P < 10 else (10 ** 2) * 30 / P ** 2   # 行1190〜1220
    V = 1 - math.exp(-S * .5) * 1                                              # 行1230〜1232
    N2 = int(R1 * (N1 + N1 * V))                                               # 行1234〜1240
    return N2 * P * .01 - S * .15 - N2 * C * .01                                # 行1270〜1290（L=N2）
rows = []
for C in (2, 4, 5):                       # 行540〜550：1〜2日目2セント、3〜6日目4、7日目以降5
    for R1 in (2, 1, .7, .6, .5, .4, .3):  # 猛暑2（行2410以降）、晴れ1、曇りは 1−雨の確率（行2110〜2120：30〜70%）
        (P, S), pr = argmax(lambda x: lemon(x[0], x[1], R1, C), list(itertools.product(range(0, 101), range(0, 51))))
        rows.append((C, R1, P, S, round(pr, 2)))
for r in rows: print('原価%dセント 天気の倍率%.1f → 最適の値段%dセント 看板%d枚 利益$%.2f' % r)
print('最適の値段の種類:', sorted(set(r[2] for r in rows)), ' 条件の数:', len(rows))

print()
print('=== (2) DESIGN-RAMEN d.2：自店の値段p（10円刻み 600〜1500円）を総当たり。ライバルは値段900円・評判3・品質3')
EPS, V0, PA, CAP, COST, ITEMS = 1.25, 4.0, 20000, 3000, 324, 1.2  # 【推論】ε は d.2 の基準1.0〜1.5の中、V0 は平均の店が月約2,860杯（110杯×26日）になる値、原価は客単価約1,080円の3割
def lnp(p, pref):  # d.2 の「1,000円を越える部分だけ×1.5」
    if p <= 1000: return EPS * math.log(p / pref)
    return EPS * math.log(1000 / pref) + 1.5 * EPS * math.log(p / 1000)
def d2_profit(p, W=1.0, nriv=2, R=3.0, pref=900, cap=CAP):
    V = math.exp(.16 * (R - 3) - lnp(p, pref))
    Vr = math.exp(-lnp(900, pref))
    s = V / (V0 + V + nriv * Vr)
    N = PA * s * W
    X = min(N, cap)
    return X * (ITEMS * p - COST)
ps = list(range(600, 1510, 10))
res = []
for W, nriv, R, cap in itertools.product((.8, 1.0, 1.2), (0, 1, 2, 3), (2.5, 3.0, 4.0), (CAP, 99999)):
    p, pr = argmax(lambda q: d2_profit(q, W, nriv, R, cap=cap), ps)
    res.append((W, nriv, R, cap, p))
def show(rs, label):
    by = {}
    for W, n, R, cap, p in rs: by.setdefault((n, R, cap), []).append((W, p))
    moved_by_weather = sum(1 for k, v in by.items() if len(set(p for _, p in v)) > 1)
    print(label, '条件の数', len(rs), '／最適の値段の種類', sorted(set(r[4] for r in rs)))
    print('  天気・季節の倍率Wだけを変えたとき最適が動いた組', moved_by_weather, '／', len(by),
          '（席の上限なしの組では', sum(1 for k, v in by.items() if k[2] == 99999 and len(set(p for _, p in v)) > 1), '／', sum(1 for k in by if k[2] == 99999), '）')
    for n in (0, 1, 2, 3):
        print('  ライバル%d軒（評判3・上限なし・W=1）→ %d円' % (n, [r[4] for r in rs if r[0] == 1.0 and r[1] == n and r[2] == 3.0 and r[3] == 99999][0]))
show(res, 'd.2')
KINK = [True]
def lnp_nokink(p, pref): return EPS * math.log(p / pref)
_saved = lnp
lnp = lnp_nokink
res2 = []
for W, nriv, R, cap in itertools.product((.8, 1.0, 1.2), (0, 1, 2, 3), (2.5, 3.0, 4.0), (CAP, 99999)):
    p, pr = argmax(lambda q: d2_profit(q, W, nriv, R, cap=cap), ps)
    res2.append((W, nriv, R, cap, p))
print()
show(res2, 'd.2 から1,000円の折れ目だけを外した版')
lnp = _saved

print()
print('=== (3) 案M2：客層の混合ロジット（エリアの客層の割合×客層ごとの係数）。天気は客層ごとに違う倍率【推論】')
SEG = {  # 名前: (値段の弾力性, 評判の重み, 雨の倍率, 猛暑の倍率)
    '会社員': (1.4, .10, .95, .90),   # 弾力性が1以下だと値上げが際限なく得になる（ロジットの性質）ので1.4
    '学生':   (2.2, .04, .75, .70),
    '高齢':   (1.6, .14, .70, .80),
}
AREA = {'駅前': {'会社員': .6, '学生': .2, '高齢': .2}, '学生街': {'会社員': .1, '学生': .7, '高齢': .2}, '商店街': {'会社員': .2, '学生': .1, '高齢': .7}}
WEATHER = {'ふつう': 0, '雨': 2, '猛暑': 3}
def m2_profit(p, area, weather, nriv=2, R=3.0, pref=900):
    tot = 0
    for seg, share in AREA[area].items():
        e, wr, rain, hot = SEG[seg]
        w = {'ふつう': 1, '雨': rain, '猛暑': hot}[weather]
        V = math.exp(wr * (R - 3) * 1.6 - e * math.log(p / pref))
        Vr = 1.0
        tot += PA * share * w * V / (V0 + V + nriv * Vr)
    return min(tot, 99999) * (ITEMS * p - COST)
out = []
for area in AREA:
    for weather in WEATHER:
        for nriv in (1, 2, 3):
            p, _ = argmax(lambda q: m2_profit(q, area, weather, nriv), ps)
            out.append((area, weather, nriv, p))
for area in AREA:
    print(' ', area, '：', '  '.join('%s/ライバル%d→%d円' % (w, n, p) for a, w, n, p in out if a == area))
print('  最適の値段の種類', sorted(set(o[3] for o in out)), '／条件の数', len(out))
print('  天気だけを変えたとき最適が動いた組', sum(1 for a in AREA for n in (1, 2, 3) if len(set(o[3] for o in out if o[0] == a and o[2] == n)) > 1), '／', len(AREA) * 3)

print()
print('=== (4) 案B1：客一人ずつの閾値（RCT 型）。客ごとに払ってよい上限が違い、上限を越える店は候補から外す。残りの店から効用で選ぶ【推論】')
import random
random.seed(1)
def b1_profit(p, weather, nriv=2, n=20000):
    rng = random.Random(7)
    sold = 0
    for _ in range(n):
        seg = rng.choices(list(SEG), weights=[.5, .3, .2])[0]
        e, wr, rain, hot = SEG[seg]
        w = {'ふつう': 1, '雨': rain, '猛暑': hot}[weather]
        if rng.random() > w: continue                       # その日は外に出ない
        budget = 900 * math.exp(rng.gauss(0, .25)) * (1.25 if seg == '会社員' else 1.0)
        opts = [('自店', p)] + [('他%d' % i, 900) for i in range(nriv)]
        opts = [o for o in opts if o[1] <= budget * 1.3]     # 上限の1.3倍を越える店は候補から外す（RCT の「価値の2倍」の型）
        if not opts: continue
        us = [(-e * math.log(o[1] / 900) + rng.gauss(0, 1), o[0]) for o in opts] + [(math.log(V0) + rng.gauss(0, 1), '外')]
        if max(us)[1] == '自店': sold += 1
    return sold * (ITEMS * p - COST)
ps2 = list(range(400, 1310, 20))
b1 = {}
for weather in WEATHER:
    for nriv in (1, 3):
        b1[(weather, nriv)] = argmax(lambda q: b1_profit(q, weather, nriv), ps2)[0]
print('  ', '  '.join('%s/ライバル%d→%d円' % (k[0], k[1], v) for k, v in b1.items()))
print('  最適の値段の種類', sorted(set(b1.values())))
