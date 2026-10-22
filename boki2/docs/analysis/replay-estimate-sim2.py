#!/usr/bin/env python3
# BIZ-REPLAY 版0.4 3.3：条件Aの入り口を実装に合わせた模擬（replay-estimate-sim.py の表1〜3は「月初の想起の正解が条件Aを進める」模型で、実装と違った）
# 使い方：python3 -I boki2/docs/analysis/replay-estimate-sim2.py > boki2/docs/analysis/replay-estimate-sim2.out.txt
#
# 実装で確かめたこと（書き手が js/sim/engine.js を読んだ）：
#  - 条件A（lv4＝exam2）は 411行：その項目の S.examLog の記録のうち、正解が2回以上・最初と最後の正解が7日以上離れ・最後の記録が正解。
#  - S.examLog に書くのは 487行（検定会場）・568行（練習室）・1442行（発見のあとの確かめ）・2144行（腕だめし）＝本試験の文の問題と、
#    1091行（月初の想起で誤ったときだけ、'auto:<型>' を ok:false で書く）。月初の想起の正解は書かない。
#  - 409行：'auto:<型>' の記録が効くのは、その型を sim.kinds に持つ項目だけ。js/scope.js の試験範囲の項目のうち sim.kinds を持つのは
#    76項目中9項目（node で数えた）。つまり月初の想起の誤りで条件Aが外れうるのは、この9項目だけ。
# 模型（仮定）：
#  - 77項目は1周目の0〜7割に一様に初出（版0.3と同じ）。1周10日・毎日（1周の実日数は 10×7÷週に遊ぶ日）。
#  - 本試験の文の問題は、各項目に初出の後、1周あたり平均 λ 回、ポアソンで出る（λ は実装から数えていない：前提として振る）。
#  - 月初の想起：sim.kinds を持つ項目（割合 f）は S.plan の期日（正解で7→30→90日、誤りでその場）ごとに思い出す。誤ると 'auto:' の誤りが入り、
#    次に本試験の文の問題で正解するまで条件Aから外れる。f=0.12 は実装の9/76、f=1.0 は全項目が型を持つ場合（論証の検査役の置き方に近い）。
#  - 正解率：一定 p、または「上がる」（正解のたびに誤る率が半分。本試験の文と想起の両方の正解で上がる）。0.5 は仮定。
#  - 全77項目が同時に条件Aを満たした最初の時刻。600日以内に届かなければ「届かない」。各条件40人の中央値（半数以上が届かなければ「届かない」）。
import random, math, heapq, itertools
DAY_GAPS = (7, 30, 90)
def sim(seed, p0, lam, f, run_days=10, d=7, rise=False, n=77, horizon=600, qv=0.5):
    rnd = random.Random(seed)
    run_real = run_days * 7.0 / d            # 1周の実日数
    rate = lam / run_real                    # 1日あたりの本試験の文の問題の回数（1項目）
    first = [rnd.uniform(0, 0.7) * run_real for _ in range(n)]
    kind = [rnd.random() < f for _ in range(n)]
    oks = [[] for _ in range(n)]; last_ok = [False] * n; good = [False] * n; corr = [0] * n; pn = [0] * n
    ev = []
    for i in range(n):
        heapq.heappush(ev, (first[i] + rnd.expovariate(rate), i, 'exam'))
        if kind[i]:
            heapq.heappush(ev, (first[i] + DAY_GAPS[0], i, 'recall'))
    ngood = 0
    while ev:
        t, i, kd = heapq.heappop(ev)
        if t > horizon: break
        p = 1 - (1 - p0) * (qv ** corr[i]) if rise else p0
        ok = rnd.random() < p
        if ok: corr[i] += 1
        if kd == 'exam':
            if ok: oks[i].append(t)
            last_ok[i] = ok
            heapq.heappush(ev, (t + rnd.expovariate(rate), i, 'exam'))
        else:
            if ok:
                pn[i] += 1; nxt = t + DAY_GAPS[min(pn[i], 3) - 1]
            else:
                pn[i] = 0; last_ok[i] = False; nxt = t + 1.0 / 12   # 誤りは次の月初にまた候補（1日に12回の月初）
            heapq.heappush(ev, (nxt, i, 'recall'))
        g = last_ok[i] and len(oks[i]) >= 2 and oks[i][-1] - oks[i][0] >= 7
        if g != good[i]:
            good[i] = g; ngood += 1 if g else -1
        if ngood == n:
            return t / run_real
    return float('inf')
def med(people=40, **kw):
    r = sorted(sim(2000 + s, **kw) for s in range(people))
    m = r[len(r) // 2]
    reach = sum(1 for x in r if x != float('inf'))
    return m, reach
def cell(m, reach, people=40):
    return ('届かない（%d人中%d人）' % (people, reach)) if m == float('inf') else '%.1f周分（%d人）' % (m, reach)
print('表4 条件Aの入り口を実装に合わせた模擬：全77項目が同時に条件Aを満たす周分（中央値）と、600日以内に届いた人数（40人中）。1周10日・毎日')
print()
print('| λ（1項目・1周あたりの本試験の文の問題） | f（想起の誤りで外れる項目の割合） | 正解率 | 一定 | 上がる |')
print('|---|---|---|---|---|')
for lam, f, p in itertools.product((1, 2, 4, 8), (0.12, 1.0), (1.0, 0.95, 0.9, 0.8)):
    a = med(p0=p, lam=lam, f=f); b = med(p0=p, lam=lam, f=f, rise=True)
    print('| %d | %.2f | %.2f | %s | %s |' % (lam, f, p, cell(*a), cell(*b)))
print()
print('表5 週に3日遊ぶ場合（1周の実日数23.3日）。f=0.12')
print()
print('| λ | 正解率 | 一定 | 上がる |')
print('|---|---|---|---|')
for lam, p in itertools.product((1, 2, 4), (1.0, 0.9, 0.8)):
    a = med(p0=p, lam=lam, f=0.12, d=3); b = med(p0=p, lam=lam, f=0.12, d=3, rise=True)
    print('| %d | %.1f | %s | %s |' % (lam, p, cell(*a), cell(*b)))
print()
print('表6 正解のたびに誤る率に掛ける値 q の感度（版0.5。q=0.5 が表4の「上がる」）。1周10日・毎日・f=0.12・40人')
print()
print('| λ | 初回の正解率 | q=0.5 | q=0.7 | q=0.9 |')
print('|---|---|---|---|---|')
for lam, p in itertools.product((1, 4, 8), (0.9, 0.8)):
    print('| %d | %.1f | %s |' % (lam, p, ' | '.join(cell(*med(p0=p, lam=lam, f=0.12, rise=True, qv=q)) for q in (0.5, 0.7, 0.9))))
print()
print('表7 人数の粗さ：一定90%・f=0.12 で、40人と200人を比べる（600日以内に届いた人の割合と中央値）')
print()
print('| λ | 40人 | 200人 |')
print('|---|---|---|')
for lam in (1, 4, 8):
    out = []
    for n in (40, 200):
        m, reach = med(people=n, p0=0.9, lam=lam, f=0.12)
        out.append('%s・届いた%.0f%%' % (cell(m, reach, n), 100.0 * reach / n))
    print('| %d | %s |' % (lam, ' | '.join(out)))
print()
print('表8 いまの試作の流れに近い λ（replay-lambda-count.js：場面のある項目で1回の台本に最大約1.2問、全項目で割ると約0.6問）。λ=0.5・1.0、f=0.12')
print()
print('| λ | 正解率 | 一定 | q=0.5 | q=0.9 |')
print('|---|---|---|---|---|')
for lam, p in itertools.product((0.5, 1.0), (1.0, 0.9, 0.8)):
    print('| %.1f | %.1f | %s | %s | %s |' % (lam, p, cell(*med(p0=p, lam=lam, f=0.12)), cell(*med(p0=p, lam=lam, f=0.12, rise=True, qv=0.5)), cell(*med(p0=p, lam=lam, f=0.12, rise=True, qv=0.9))))
