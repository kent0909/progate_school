#!/usr/bin/env python3
# BIZ-REPLAY 版0.3 3.3：満点の4条件のうち条件A（全77項目が「日をあけても書けた」）に届くまでの日数の感度（模擬）
# 使い方：python3 -I boki2/docs/analysis/replay-estimate-sim.py > boki2/docs/analysis/replay-estimate-sim.out.txt
#
# 版0.2からの変更（論証の検査 14.6 の指摘を、前提をコードと資料で確かめてから入れた）：
#  1) 数え方を2通りにした。
#     ・連続：誤ると正解の回数が0に戻る。想起の予定表 S.plan の n（js/sim/engine.js 1028行「n（正解の連続数）」、
#       1039行 誤りで p.n = 0）の数え方。版0.2の模型はこれだけだった。
#     ・通算：誤っても正解の回数を消さず、最後の1回が正解なら届く。条件Aの判定そのもの（js/sim/engine.js 411行：
#       正解の時刻 okT が2つ以上で、最初と最後が7日以上離れ、最後の試行が正解なら exam2＝lv4。誤りで数は消えない）。
#     → 今のコードの条件Aは「通算・N=2・7日」。N=3・4 と「連続」は、設計で選べる別の案として並べる。
#  2) 正解率を2通りにした。
#     ・一定：どの回も正解率 p0（版0.2）。
#     ・上がる：k 回正解したあとの正解率 = 1 −（1 − p0）× q^k（q=0.5：正解するたびに誤る率が半分）。
#       想起の練習で後の想起が強くなる（テスト効果）ことの単純な写し。q の値は資料から決めたものではない（仮定）。
#  3) 届いた項目が後でまた出て誤ると外れる（engine.js 411行：最後の試行が誤りなら 'miss'）ことを、表2で入れた。
#
# 模型（すべて仮定。設計者が数を変えれば結果も変わる）：
#  - 1周＝10期×12か月＝120回の月初。1日1時間なら1周は run_days 日（DESIGN-RAMEN の10〜15時間）。
#  - 遊ぶのは週 d 日（遊ぶ日に1時間）。月初は遊んだ時間に比例して来る。
#  - 77項目は1周目の0〜7割の位置に一様に初出（番人は7期目まで：DESIGN-RAMEN i.4）。
#  - 月初ごとに、期日の来た項目を期日の早い順に1件思い出す（誤った項目は翌日に期日）。
#  - 間隔は版0.2と同じ：N=2 は（7, 7）、N=3 は（3, 7, 14）、N=4 は（3, 7, 14, 21）日。1つ目は初出から最初の想起まで、
#    あとは正解のあと次の想起まで。届いたあとの次の確かめは30日後（PLAN_GAP の2つ目）で、表2だけで使う。
#  - 条件B・C・D、ふだんの記帳での自然な思い出し、検定会場の問題での正解は入れていない（入れると短くなる）。
#  乱数の種は固定（同じ数が出る）。各条件40人の中央値。
import random, math, itertools
GAPS = {2: (7, 7), 3: (3, 7, 14), 4: (3, 7, 14, 21)}
RECHECK = 30
def sim(seed, p0, d, N, run_days, mode='run', q=1.0, recheck=False, n_items=77, horizon=700):
    rnd = random.Random(seed)
    pattern = {7: [1] * 7, 3: [1, 0, 1, 0, 1, 0, 0]}[d]
    mph = 120.0 / run_days
    gaps = GAPS[N]
    first = sorted(rnd.uniform(0, 0.7 * 120) for _ in range(n_items))
    times = []
    day = 0
    while day < horizon:
        if pattern[day % 7]:
            k = int(mph)
            for j in range(k):
                times.append(day + j / k)
        day += 1
    tm = lambda m: times[min(len(times) - 1, max(0, math.ceil(m) - 1))]
    # 項目：[初出の日, 正解の回数（連続または通算）, 期日, 最後が正解か, 届いたか, 正解の累計（正解率用）]
    items = [[tm(f), 0, tm(f) + gaps[0], False, False, 0] for f in first]
    done = 0
    for t in times:
        best = None
        for it in items:
            if it[0] <= t and it[2] <= t and (recheck or not it[4]) and (best is None or it[2] < best[2]):
                best = it
        if best is None:
            continue
        p = 1 - (1 - p0) * (q ** best[5])
        if rnd.random() < p:
            best[1] += 1; best[5] += 1; best[3] = True
            if best[1] >= N and not best[4]:
                best[4] = True; done += 1
            best[2] = t + (gaps[best[1]] if best[1] < N else RECHECK)
        else:
            best[3] = False
            if mode == 'run':
                best[1] = 0
            if best[4]:
                best[4] = False; done -= 1
            best[2] = t + 1
        if done == n_items:
            return t
    return float('inf')
def med(**kw):
    r = sorted(sim(1000 + s, **kw) for s in range(40))
    return r[len(r) // 2]
def cell(m, run_real):
    return '届かない' if m == float('inf') else '%.0f日（%.1f周分）' % (m, m / run_real)
MODELS = [('連続・一定', 'run', 1.0), ('連続・上がる', 'run', 0.5), ('通算・一定', 'total', 1.0), ('通算・上がる', 'total', 0.5)]
print('表1 条件Aに届く日（中央値）と、1周の実日数で割った周分。届いた項目はもう出さない')
print()
print('| 1周（1日1時間） | 週に遊ぶ日 | N | 最初の正解率 p0 | ' + ' | '.join(m[0] for m in MODELS) + ' |')
print('|---|---|---|---|' + '---|' * len(MODELS))
ALL = []
for run_days, d, N, p0 in itertools.product((10, 15), (7, 3), (2, 3, 4), (1.0, 0.9, 0.8)):
    run_real = run_days * 7.0 / d
    row = []
    for name, mode, q in MODELS:
        m = med(p0=p0, d=d, N=N, run_days=run_days, mode=mode, q=q)
        row.append(cell(m, run_real)); ALL.append((name, run_days, d, N, p0, m / run_real))
    print('| %d日 | %d | %d | %.1f | %s |' % (run_days, d, N, p0, ' | '.join(row)))
print()
fin = [a for a in ALL if a[5] != float('inf')]
lo = min(fin, key=lambda a: a[5]); hi = max(fin, key=lambda a: a[5])
print('表1の幅：最短 %.1f周分（%s・1周%d日・週%d日・N=%d・p0=%.1f）、最長 %.1f周分（%s・1周%d日・週%d日・N=%d・p0=%.1f）' % (lo[5], lo[0], lo[1], lo[2], lo[3], lo[4], hi[5], hi[0], hi[1], hi[2], hi[3], hi[4]))
for name, _, _ in MODELS:
    xs = [a[5] for a in fin if a[0] == name]
    print('  %s：%.1f〜%.1f周分' % (name, min(xs), max(xs)))
for N in (2, 3, 4):
    xs = [a[5] for a in fin if a[3] == N]
    print('  N=%d：%.1f〜%.1f周分' % (N, min(xs), max(xs)))
print()
print('表2 届いた項目も30日後にまた出し、誤れば外れる（engine.js 411行の「最後の試行が正解」）。1周10日・毎日')
print()
print('| N | p0 | ' + ' | '.join(m[0] for m in MODELS) + ' |')
print('|---|---|' + '---|' * len(MODELS))
for N, p0 in itertools.product((2, 3, 4), (0.9, 0.8)):
    print('| %d | %.1f | %s |' % (N, p0, ' | '.join(cell(med(p0=p0, d=7, N=N, run_days=10, mode=mode, q=q, recheck=True), 10) for _, mode, q in MODELS)))
print()
print('満点の目安：1項目の受験日の保持率 r、本試験で問われる項目数 m のとき全部正しい確率 r^m（独立を仮定した説明用の数）')
print('| r | m=10 | m=20 | m=40 |')
print('|---|---|---|---|')
for r in (0.55, 0.8, 0.9, 0.95):
    print('| %.2f | %.3f | %.3f | %.4f |' % (r, r ** 10, r ** 20, r ** 40))
