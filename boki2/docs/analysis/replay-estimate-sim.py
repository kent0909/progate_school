#!/usr/bin/env python3
# BIZ-REPLAY 版0.2 3.3：満点の4条件のうち条件A（全77項目が「日をあけた正解N回」）に届くまでの日数の感度（模擬）
# 使い方：python3 -I boki2/docs/analysis/replay-estimate-sim.py > boki2/docs/analysis/replay-estimate-sim.out.txt
# 模型（すべて仮定。設計者が数を変えれば結果も変わる）：
#  - 1周＝10期×12か月＝120回の月初。1日1時間なら1周は run_days 日（DESIGN-RAMEN 95行の10〜15時間）。
#  - 遊ぶのは週 d 日（遊ぶ日に1時間）。月初は遊んだ時間に比例して来る。
#  - 77項目は1周目の0〜7割の位置に一様に初出（番人は7期目まで：DESIGN-RAMEN 725行）。
#  - 月初ごとに、期日の来た項目を期日の早い順に1件思い出す。正解の確率 p。
#  - 正解なら連続の回数+1、次の期日は gaps[回数] 日後。誤りなら回数0に戻り（S.plan の n は正解の連続数）、1日後に再び候補。
#  - 必要な回数 N：2（間隔7・7日。今の条件Aに近い）・3（3・7・14日）・4（3・7・14・21日）。
#  - 条件B・C・D、ふだんの記帳での自然な思い出しは入れていない（入れると短くなる側もある）。
#  乱数の種は固定（同じ数が出る）。各条件40人の中央値。
import random, math, itertools
GAPS = {2: (7, 7), 3: (3, 7, 14), 4: (3, 7, 14, 21)}
def sim(seed, p, d, N, run_days, n_items=77, horizon=500, reset=True):
    rnd = random.Random(seed)
    pattern = {7: [1] * 7, 5: [1, 1, 1, 1, 1, 0, 0], 3: [1, 0, 1, 0, 1, 0, 0]}[d]
    mph = 120.0 / run_days                      # 1時間あたりの月初の数
    gaps = GAPS[N]
    first = sorted(rnd.uniform(0, 0.7 * 120) for _ in range(n_items))  # 初出の月（通しの月番号）
    # 月番号 → 実日数
    times = []
    h = 0.0; day = 0
    while day < horizon and len(times) < 120 * 40:
        if pattern[day % 7]:
            k = int(mph)
            for j in range(k):
                times.append(day + j / k)
        day += 1
    tm = lambda m: times[min(len(times) - 1, max(0, math.ceil(m) - 1))]
    items = [[tm(f), 0, tm(f) + gaps[0]] for f in first]   # 初出の日, 連続の回数, 期日
    done = 0
    for t in times:
        best = None
        for it in items:
            if it[1] < N and it[0] <= t and it[2] <= t and (best is None or it[2] < best[2]):
                best = it
        if best is None:
            continue
        if rnd.random() < p:
            best[1] += 1
            if best[1] >= N:
                done += 1
                if done == n_items:
                    return t
            else:
                best[2] = t + gaps[best[1]]
        else:
            if reset:
                best[1] = 0
            best[2] = t + 1
    return float('inf')
print('| 1周（1日1時間） | 週に遊ぶ日 | 必要な正解 N | 正解率 p | 条件Aに届く日（中央値） | 週 | 何周目（1周の実日数で割る） |')
print('|---|---|---|---|---|---|---|')
for run_days, d, N, p in itertools.product((10, 15), (7, 3), (2, 3, 4), (1.0, 0.9, 0.8)):
    r = sorted(sim(1000 + s, p, d, N, run_days) for s in range(40))
    med = r[len(r) // 2]
    real_run = run_days * 7.0 / d
    if med == float('inf'):
        print('| %d日 | %d | %d | %.1f | 500日以内に届かない | — | — |' % (run_days, d, N, p)); continue
    print('| %d日 | %d | %d | %.1f | %.0f日 | %.1f | %.1f周分（%d周目） |' % (run_days, d, N, p, med, med / 7, med / real_run, math.floor(med / real_run) + 1))
print()
print('誤っても連続の回数を0に戻さない（条件Aを「通算の正解」と読む）場合：1周10日・毎日')
for N, p in ((3, 0.9), (3, 0.8), (2, 0.8)):
    r = sorted(sim(1000 + s, p, 7, N, 10, reset=False) for s in range(40)); med = r[len(r) // 2]
    print('  N=%d p=%.1f：中央値 %.0f日（%.1f週・%.1f周分）' % (N, p, med, med / 7, med / 10))
print()
print('満点の目安：1項目の受験日の保持率 r、本試験で問われる項目数 m のとき全部正しい確率 r^m（独立を仮定した説明用の数）')
print('| r | m=10 | m=20 | m=40 |')
print('|---|---|---|---|')
for r in (0.55, 0.8, 0.9, 0.95):
    print('| %.2f | %.3f | %.3f | %.4f |' % (r, r ** 10, r ** 20, r ** 40))
