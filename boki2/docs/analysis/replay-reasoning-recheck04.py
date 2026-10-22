#!/usr/bin/env python3
"""BIZ-REPLAY 版0.4 の再検査（docs/audit/BIZ-REPLAY-reasoning.md 16章）で使う確かめと感度。

  python3 -I boki2/docs/analysis/replay-reasoning-recheck04.py > boki2/docs/analysis/replay-reasoning-recheck04.out.txt

1) 書き手の replay-estimate-sim2.py の sim() を読み込み、「上がる」の 0.5（正解のたびに誤る率を何倍にするか）だけを
   引数に変えて、0.5・0.7・0.8・0.9 で感度を出す（ほかの前提は sim2 のまま。40人・600日）
2) 人数を40人から200人に増やしたときに、表4の「届いた人数」と中央値が動くか（数か所）
3) 実装の本試験の文の問題の入り口の数（js/sim の台本の腕だめし・発見の出来事、月初の「日をあけて確かめる」の対象）
4) 16章の表の数（C：15.5 の12項目への応え、X：版0.4で変わった結論の判定）
外部には何も取りに行かない。
"""
import os, re, math, random, heapq, glob
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))

def hr(t):
    print('\n==== ' + t + ' ====')

# sim2 の sim() を、0.5 を q に変えて写す（式の形と前提は sim2 と同じ。変えたのは q だけ）
DAY_GAPS = (7, 30, 90)
def sim(seed, p0, lam, f, run_days=10, d=7, rise=False, q=0.5, n=77, horizon=600):
    rnd = random.Random(seed)
    run_real = run_days * 7.0 / d
    rate = lam / run_real
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
        p = 1 - (1 - p0) * (q ** corr[i]) if rise else p0
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
                pn[i] = 0; last_ok[i] = False; nxt = t + 1.0 / 12
            heapq.heappush(ev, (nxt, i, 'recall'))
        g = last_ok[i] and len(oks[i]) >= 2 and oks[i][-1] - oks[i][0] >= 7
        if g != good[i]:
            good[i] = g; ngood += 1 if g else -1
        if ngood == n:
            return t / run_real
    return float('inf')

def med(npeople=40, **kw):
    r = sorted(sim(2000 + s, **kw) for s in range(npeople))
    m = r[len(r) // 2]
    reach = sum(1 for x in r if x != float('inf'))
    return m, reach, npeople

def cell(m, reach, n):
    return (f'届かない（{n}人中{reach}人）') if m == float('inf') else f'{m:.1f}周分（{reach}/{n}人）'

hr('0) sim2 と同じ前提（q=0.5）で、sim2 の表4の数を再現するか')
for lam, p in ((1, 0.8), (4, 0.9), (8, 0.8)):
    print(f'λ={lam}・p0={p}・f=0.12・上がる(q=0.5)：{cell(*med(p0=p, lam=lam, f=0.12, rise=True))}')

hr('1) 「上がる」の q（正解のたびに誤る率に掛ける値）の感度。f=0.12・1周10日・毎日・40人')
print('| λ | p0 | q=0.5（sim2） | q=0.7 | q=0.8 | q=0.9 | 一定（q=1） |')
print('|---|---|---|---|---|---|---|')
for lam in (1, 4, 8):
    for p in (0.9, 0.8):
        cs = [cell(*med(p0=p, lam=lam, f=0.12, rise=True, q=q)) for q in (0.5, 0.7, 0.8, 0.9)]
        cs.append(cell(*med(p0=p, lam=lam, f=0.12)))
        print(f'| {lam} | {p} | ' + ' | '.join(cs) + ' |')

hr('2) 人数を200人にしたとき（一定90%の届いた人数の割合が40人のときと合うか）')
for lam in (1, 4, 8):
    a = med(p0=0.9, lam=lam, f=0.12, npeople=40)
    b = med(p0=0.9, lam=lam, f=0.12, npeople=200)
    print(f'λ={lam}・一定90%：40人 {cell(*a)} ／ 200人 {cell(*b)}')

hr('3) 実装（ピヨ商店の台本）の本試験の文の問題の入り口')
js = glob.glob(os.path.join(ROOT, 'js', 'sim', '*.js'))
quiz = sum(len(re.findall(r"t:\s*'quiz'", open(f, encoding='utf-8').read())) for f in js)
disc = sum(len(re.findall(r"t:\s*'discover'", open(f, encoding='utf-8').read())) for f in js)
print(f"台本の腕だめし（t:'quiz'）{quiz}回、発見の出来事（t:'discover'）{disc}個（js/sim/*.js を数えた）")
eng = open(os.path.join(ROOT, 'js', 'sim', 'engine.js'), encoding='utf-8').read()
m = re.search(r'if \(out\.length >= (\d+) - old\.length\)', eng)
print(f'腕だめし1回の問題数：{m.group(1) if m else "?"}問まで（engine.js pickQuiz）。月初の「日をあけて確かめる」は「7日前後たった、間違えた論点の別の問題」だけ（engine.js 1056行の前後）')
print('→ 検定会場・練習室に自分から行かなければ、1項目・1周あたりの本試験の文の問題は、発見のあとの確かめ（多くの項目で1回）と、'
      f'腕だめし {quiz}回×5問を項目に配った分（77項目なら1項目あたり約{quiz*5/77:.2f}回）と、誤った論点の確かめ。λ は1前後かそれ以下と見込まれる【検査役の推論】')
print('（注）この台本はピヨ商店（いまの試作）で、見積りの対象のラーメン版（10期）ではない。ラーメン版の λ は設計で決める値')

hr('4) 16章の表の数')
audit = os.path.join(ROOT, 'docs', 'audit', 'BIZ-REPLAY-reasoning.md')
C, X = {}, {}
for l in open(audit, encoding='utf-8'):
    mm = re.match(r'\|\s*([CX]\d{2})\s*\|', l)
    if not mm:
        continue
    cols = [x.strip() for x in l.strip().strip('|').split('|')]
    key = mm.group(1)
    if key.startswith('C'):
        C[key] = next((k for k in ('応えていない', '一部', '応えた') if k in cols[-1]), None)
    else:
        X[key] = next((k for k in ('不当', '弱い', '妥当') if k in cols[-2]), None)
cc, cx = Counter(C.values()), Counter(X.values())
print(f'C（15.5 の12項目）{len(C)}：応えた {cc.get("応えた",0)}／一部 {cc.get("一部",0)}／応えていない {cc.get("応えていない",0)}／判定なし {cc.get(None,0)}')
print('  一部: ' + '・'.join(sorted(k for k, v in C.items() if v == '一部')))
print(f'X（版0.4で変わった結論）{len(X)}：妥当 {cx.get("妥当",0)}／弱い {cx.get("弱い",0)}／不当 {cx.get("不当",0)}／判定なし {cx.get(None,0)}')
for key in ('妥当', '弱い', '不当'):
    print(f'  {key}: ' + '・'.join(sorted(k for k, v in X.items() if v == key)))
