#!/usr/bin/env python3
# BIZ-MKT-RAMEN 8章のポスティングの行の計算し直し（2026-10-23）。
# 前の版の費用（3,000部で2.1万円・デザイン2万円〜）は crowdworks の記事（robots.txt が ClaudeBot の名の組で禁じる）の値だったので、
# imitsu の相場の記事（r10-rr-imitsu-posting）の幅に替える：ローラー配布 1枚3〜6円、印刷 A4 カラー 1枚2〜4円、A4 チラシのデザイン 2万〜5万円。
# 前提（下・中・上の LTV）は bizmkt-ramen-cpa.py と同じ。
# Usage: python3 -I boki2/docs/analysis/bizmkt-ramen-cpa-robots.py
S = {'下': dict(g=600, f=0.5, m=12, r=0.10), '中': dict(g=650, f=1.0, m=18, r=0.25), '上': dict(g=700, f=1.5, m=24, r=0.40)}
def ltv(g, f, m, r):
    reg = g * f * m
    return g + r * reg, 200 + r * (200 * 4 * m)
N = 3000
lo = N * (3 + 2); hi = N * (6 + 4)          # 配布＋印刷
dlo, dhi = lo + 20000, hi + 50000           # ＋デザイン
for name, (a, b) in {'配布＋印刷（デザイン自作）': (lo, hi), '配布＋印刷＋デザイン': (dlo, dhi)}.items():
    print(f"== {name}：{a:,}〜{b:,}円（{N}部）")
    print(f"  1回で元が取れる来店（g=650）：{a / 650:.1f}〜{b / 650:.1f}")
    for k, p in S.items():
        new, lem = ltv(**p)
        print(f"  {k}：新規 {a / new:.1f}〜{b / new:.1f}人（レモネード {a / lem:.1f}〜{b / lem:.1f}人）／反応率 {a / new / N * 100:.2f}〜{b / new / N * 100:.2f}%")
    new = ltv(**S['中'])[0]
    print(f"  中の新規は1日84.7人の店の月の客（約2,200人）の {a / new / 2200 * 100:.2f}〜{b / new / 2200 * 100:.2f}%")
