#!/usr/bin/env python3
"""BIZ-REPLAY 版0.3 の再検査（docs/audit/BIZ-REPLAY-reasoning.md 15章）で使う確かめと感度。

  python3 -I boki2/docs/analysis/replay-reasoning-recheck03.py > boki2/docs/analysis/replay-reasoning-recheck03.out.txt

1) 条件A（js/sim/engine.js 411行）に何が入るか：S.examLog に書く行をコードから拾う
2) 実装に近い前提での感度：条件Aを進めるのは「本試験の文の問題」（腕だめし・発見のあとの確かめ・検定会場・練習室）で、
   月初の想起は誤ったときだけ 'auto:' の誤りとして入る（＝最後の試行が誤りになり外れる）。
   本試験の文の問題が1項目に1周あたり λ 回出るとして、全77項目が届く日を出す
3) ゲーム発展国++ の口コミのうち、大賞の時点でレビューを求められて書いたと分かるもの
4) 大賞に届いた周の8対7の幅、「目標の後にすることがない19件」と「周回の声44件」の分母
5) 15章の表の数（B：14.6 の11項目への応え、W：版0.3の結論の判定）
乱数の種は固定。外部には何も取りに行かない。
"""
import os, re, csv, math, random
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))

def hr(t):
    print('\n==== ' + t + ' ====')

hr('1) S.examLog に書く行（js/sim/engine.js）')
eng = open(os.path.join(ROOT, 'js', 'sim', 'engine.js'), encoding='utf-8').read().split('\n')
for i, l in enumerate(eng, 1):
    if 'S.examLog.push' in l:
        s = l.strip()
        print(f'{i}行：{s[:150]}')
for i, l in enumerate(eng, 1):
    if "planMark(pick.x.kind" in l:
        print(f'{i}行（月初の想起）：{l.strip()[:150]}')
print('→ 月初の想起の正解は S.plan と S.recall にだけ入り、条件Aの S.examLog には入らない。誤りだけが auto:<型> の ok:false として入る')

hr('2) 実装に近い前提での感度（1周10日・1日1時間・毎日・通算 N=2・7日以上・最後が正解）')
def sim(seed, lam, p, p_recall, n_items=77, run_days=10, horizon=600):
    """λ：1項目に本試験の文の問題が1周あたり何回出るか（ポアソン）。p：その正解率。
    月初の想起：1周120回、毎回、初出した項目から1つを選んで思い出す。誤り（1-p_recall）なら、その項目の最後の試行が誤りになる。"""
    rnd = random.Random(seed)
    per_day = 120 / run_days
    first = [rnd.uniform(0, 0.7 * run_days) for _ in range(n_items)]
    ev = []
    rate_per_day = lam / run_days
    for i in range(n_items):
        t = first[i]
        while t < horizon:
            t += rnd.expovariate(rate_per_day) if rate_per_day > 0 else horizon
            ev.append((t, 'q', i))
    t = 0.0
    while t < horizon:
        t += 1 / per_day
        ev.append((t, 'r', None))
    ev.sort()
    okT = [[] for _ in range(n_items)]
    last = [None] * n_items
    done = [False] * n_items
    ndone = 0
    for t, kind, i in ev:
        if kind == 'r':
            cand = [j for j in range(n_items) if first[j] <= t]
            if not cand:
                continue
            j = rnd.choice(cand)
            if rnd.random() >= p_recall:
                last[j] = False
                if done[j]:
                    done[j] = False; ndone -= 1
            continue
        ok = rnd.random() < p
        last[i] = ok
        if ok:
            okT[i].append(t)
        st = ok and len(okT[i]) >= 2 and max(okT[i]) - min(okT[i]) >= 7
        if st and not done[i]:
            done[i] = True; ndone += 1
        elif not st and done[i]:
            done[i] = False; ndone -= 1
        if ndone == n_items:
            return t
    return float('inf')

def cell(lam, p, pr, n=60):
    r = sorted(sim(3000 + s, lam, p, pr) for s in range(n))
    m = r[n // 2]
    return '届かない（600日）' if m == float('inf') else f'{m:5.0f}日（{m/10:4.1f}周分）'

print('| λ（1項目・1周あたりの本試験の文の問題） | 本試験の文の正解率 p | 月初の想起の正解率 | 全77項目が届く日（中央値） |')
print('|---|---|---|---|')
for lam in (1, 2, 4, 12):
    for p, pr in ((1.0, 1.0), (0.9, 0.9), (0.8, 0.8)):
        print(f'| {lam} | {p} | {pr} | {cell(lam, p, pr)} |')
print('（注）λ はこの検査で決めていない。腕だめし・発見のあとの確かめ・検定会場・練習室がどの頻度で各項目の本試験の文を出すかは、'
      'コードと遊び方で決まる。版0.3 の「いまの実装の数え方（通算・2回）なら約1.5〜2.4周分」は、月初の想起が条件Aを進める前提の値で、'
      '実装の入り方では λ に強く依存する')

hr('3) 大賞の時点でレビューを求められて書いたと分かる口コミ')
rows = {int(r['番号']): r for r in csv.DictReader(open(os.path.join(HERE, 'replay-mgmt-voices-codes.tsv'), encoding='utf-8'), delimiter='\t')}
# 本文は replay-mgmt-voices.py --dumpall で原文から読む。ここでは検査役が全文で確かめた番号を書く
prompted = {4: 'レビューお願いされて強制的にここに飛ばされた', 88: 'グランプリに選ばれたことで半強制的にレビュー画面に飛ばされた',
            117: '秘書からの依頼にて書き込んでいます', 192: 'グランプリ1位とったらレビュー画面になった',
            62: '受賞してすぐレビューを書きに来た'}
gds_reached = [n for n, r in rows.items() if r['作品'] == 'ゲーム発展国++' and r['目標'] == '届いた']
print(f'ゲーム発展国++ で「届いた」{len(gds_reached)}件。うちレビューを求められた・受賞してすぐ書いたと本文に書くもの {sum(1 for n in prompted if n in gds_reached)}件：')
for n, why in prompted.items():
    print(f'  #{n}（届いた周：{rows[n]["届いた周"]}）{why}（要旨）')
print('→ 届いた45件は「初めて大賞に届いた時点」の書き込みに寄る。届かずにやめた人は入りにくい')

hr('4) 8対7 と 19件の分母')
g = Counter(rows[n]['届いた周'] for n in gds_reached)
a, b, c = g.get('1周目', 0), g.get('2周目以降', 0), g.get('書かない', 0)
print(f'届いた{len(gds_reached)}件：1周目 {a}・2周目以降 {b}・書かない {c}')
print(f'2周目以降の割合の幅：{b}/{len(gds_reached)}={b/len(gds_reached)*100:.0f}% 〜 {(b+c)}/{len(gds_reached)}={(b+c)/len(gds_reached)*100:.0f}%')
print('「目標の後にすることがない」19件は643件の中の数、「周回の声」44件も643件の中の数で、19件が44件の中に含まれるとは限らない。'
      '「周回の声44件の半分に近い」は、別々の声の数を並べたもので、割合ではない')
shu = [n for n, r in rows.items() if r['周回'] == '周']
print(f'周の件数（tsv）：{len(shu)}')

hr('5) 15章の表の数')
audit = os.path.join(ROOT, 'docs', 'audit', 'BIZ-REPLAY-reasoning.md')
B, W = {}, {}
for l in open(audit, encoding='utf-8'):
    m = re.match(r'\|\s*([BW]\d{2})\s*\|', l)
    if not m:
        continue
    cols = [x.strip() for x in l.strip().strip('|').split('|')]
    key = m.group(1)
    if key.startswith('B'):
        v = next((k for k in ('応えていない', '一部', '応えた') if k in cols[-2]), None)
        B[key] = v
    else:
        v = next((k for k in ('不当', '弱い', '妥当') if k in cols[-2]), None)
        W[key] = v
cb, cw = Counter(B.values()), Counter(W.values())
print(f'B（14.6 の11項目）{len(B)}：応えた {cb.get("応えた",0)}／一部 {cb.get("一部",0)}／応えていない {cb.get("応えていない",0)}／判定なし {cb.get(None,0)}')
print(f'W（版0.3の結論）{len(W)}：妥当 {cw.get("妥当",0)}／弱い {cw.get("弱い",0)}／不当 {cw.get("不当",0)}／判定なし {cw.get(None,0)}')
for key in ('妥当', '弱い', '不当'):
    print(f'  {key}: ' + '・'.join(sorted(k for k, v in W.items() if v == key)))
print('  B 一部: ' + '・'.join(sorted(k for k, v in B.items() if v == '一部')))
