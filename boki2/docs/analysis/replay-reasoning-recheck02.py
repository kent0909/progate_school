#!/usr/bin/env python3
"""BIZ-REPLAY 版0.2 の再検査（docs/audit/BIZ-REPLAY-reasoning.md「版0.2の再検査」）で使う検算と感度。

  python3 -I boki2/docs/analysis/replay-reasoning-recheck02.py > boki2/docs/analysis/replay-reasoning-recheck02.out.txt

1) 版0.2 の replay-estimate-sim.py の模型（＝検査役が版0.1の検査で置いた模型の写し）を同じ前提で再現する
2) その模型の前提のうち、版0.2 が動かしていないもの（月初の想起の件数 k、ふだんの記帳での自然な思い出し、
   正解のたびに正解率が上がること、初出の時期）を動かす
3) 「1日1時間・毎日で約2〜10周分」の幅が、どの前提から来るかを分ける
4) 経営シムの周回の声（replay-mgmt-voices-codes.md）の割合
5) 再検査の判定の数（検査書の表の V で始まる番号の行）
乱数の種は固定。各条件200人。外部には何も取りに行かない。
"""
import math, random, os, re
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
GAPS = {2: (7, 7), 3: (3, 7, 14), 4: (3, 7, 14, 21)}

def sim(seed, *, p=1.0, d=7, N=3, run_days=10, k=1, reset=True, p_learn=False,
        nat=0.0, intro_end=0.7, n_items=77, horizon=500):
    """月初（1周120回）ごとに、期日の来た項目を期日の早い順に k 件思い出す。
    nat：ふだんの記帳で毎月その型を自分で書く項目の割合（自動仕訳にしていない型）。
         その項目は毎月初に期日が来ていれば k の枠を使わずに思い出しが起きる。
    p_learn：正解のたびに誤りの率が半分（1-(1-p)/2^n）。
    intro_end：初出が1周目のどこまでに収まるか（番人が7期目までなら0.7）。"""
    rnd = random.Random(seed)
    pattern = {7: [1]*7, 5: [1,1,1,1,1,0,0], 3: [1,0,1,0,1,0,0]}[d]
    per_day = 120.0 / run_days
    times = []
    day = 0
    acc = 0.0
    while day < horizon:
        if pattern[day % 7]:
            acc += per_day
            n = int(acc)
            acc -= n
            for j in range(n):
                times.append(day + j / max(n, 1))
        day += 1
    tm = lambda m: times[min(len(times)-1, max(0, math.ceil(m) - 1))]
    gaps = GAPS[N]
    items = []
    for _ in range(n_items):
        f = rnd.uniform(0, intro_end * 120)
        items.append({'first': tm(f), 'n': 0, 'due': tm(f) + gaps[0], 'nat': rnd.random() < nat})
    done = 0
    def attempt(it, t):
        nonlocal done
        pp = (1 - (1 - p) * (0.5 ** it['n'])) if p_learn else p
        if rnd.random() < pp:
            it['n'] += 1
            if it['n'] >= N:
                done += 1
                return True
            it['due'] = t + gaps[it['n']]
        else:
            if reset:
                it['n'] = 0
            it['due'] = t + 1
        return False
    for t in times:
        live = [it for it in items if it['n'] < N and it['first'] <= t and it['due'] <= t]
        for it in [x for x in live if x['nat']]:
            attempt(it, t)
        rest = sorted([x for x in live if not x['nat'] and x['n'] < N], key=lambda x: x['due'])
        for it in rest[:k]:
            attempt(it, t)
        if done >= n_items:
            return t
    return float('inf')

def cell(label, n=200, **kw):
    r = sorted(sim(2000 + s, **kw) for s in range(n))
    med, p90 = r[n // 2], r[int(n * 0.9)]
    run_real = kw.get('run_days', 10) * 7.0 / kw.get('d', 7)
    f = lambda x: '届かない' if x == float('inf') else f'{x:5.1f}日（{x/7:4.1f}週・{x/run_real:4.1f}周分）'
    print(f'{label:<46} 中央値 {f(med)} ／ 9割 {f(p90)}')
    return med

def hr(t):
    print('\n==== ' + t + ' ====')

hr('1) 版0.2 の模型を同じ前提で（1周10日・毎日・N=3・k=1・誤れば0・正解率一定）')
for p in (1.0, 0.9, 0.8):
    cell(f'p={p}', p=p)

hr('2) 版0.2 が動かしていない前提を動かす（1周10日・毎日・N=3）')
print('-- 月初に思い出せる件数 k（S.plan は月初の想起・工場の抜き打ち・5年目の変種・検定会場の第1問を同じ表から選ぶ）')
for k in (2, 3):
    for p in (0.9, 0.8):
        cell(f'k={k}・p={p}', k=k, p=p)
print('-- ふだんの記帳で自然に思い出す項目の割合 nat（毎月その型を自分で書く）')
for nat in (0.3, 0.6):
    for p in (0.9, 0.8):
        cell(f'nat={nat}・p={p}', nat=nat, p=p)
print('-- 正解のたびに正解率が上がる（初回 p、2回目以降 1-(1-p)/2^n）')
for p in (0.9, 0.8, 0.7):
    cell(f'上がる・初回p={p}', p=p, p_learn=True)
print('-- 初出の時期（番人が早く出す：1周目の0〜3割）')
for p in (1.0, 0.9):
    cell(f'intro_end=0.3・p={p}', intro_end=0.3, p=p)
print('-- 組み合わせ（k=2・nat=0.3・上がる）')
for p in (0.9, 0.8, 0.7):
    cell(f'k=2・nat=0.3・上がる・初回p={p}', k=2, nat=0.3, p_learn=True, p=p)
    cell(f'同上・誤っても0に戻さない', k=2, nat=0.3, p_learn=True, p=p, reset=False)

hr('3) 「約2〜10周分」の幅の出どころ（1周10日・毎日）')
a = cell('最短：N=2・p=1.0', N=2, p=1.0)
b = cell('版0.2 の上端：N=3・p=0.8', N=3, p=0.8)
c = cell('表にあるのに幅から外れた：N=4・p=0.8', N=4, p=0.8)
print('→ 版0.2 の出力表には N=4・p=0.8 の 20.8周分 があるが、要点・冒頭の「約2〜10周分」には入っていない')
print('→ 幅の大半は「誤れば回数0に戻す×正解率一定」の組み合わせから来る（2の「上がる」「戻さない」で縮む）')

hr('4) 経営シムの周回の声の割合')
rows = []
for l in open(os.path.join(HERE, 'replay-mgmt-voices-codes.md'), encoding='utf-8'):
    m = re.match(r'\|\s*(\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]*)\|\s*([^|]*)\|', l)
    if m:
        rows.append((int(m.group(1)), m.group(2).strip(), m.group(3).strip(), m.group(4).strip().split()))
shu = [r for r in rows if r[2] == '周']
c = Counter(code for r in shu for code in r[3] if code != '-')
print(f'「周」「週」を含む {len(rows)} 件のうち周回 {len(shu)} 件 ＝ 口コミ全体 643 件の {len(shu)/643*100:.1f}%')
kairo = 200 + 20 + 200 + 23
print(f'カイロソフト3作の口コミ {kairo} 件に対しては {len(shu)/kairo*100:.1f}%（Good Pizza 200件は周回0件）')
print(f'中身のコード：{dict(c)}（中身のコードなし {sum(1 for r in shu if r[3]==["-"])} 件）')
print('検査役の読み：#8 は「自分の開発したソフトでハードの売り上げや次回ハードの出現が変わるなら良かった」（遊ぶ人に応じて答えが動く作りを望む）で、'
      'コードに入っていない。#25 は「大地域を変更する＝周回」（全国編の周回は地域＝条件が変わる）。#5 は「同じ作業を繰り返し」2周目の後半で大賞')

hr('5) 再検査の判定の数')
audit = os.path.join(ROOT, 'docs', 'audit', 'BIZ-REPLAY-reasoning.md')
ids = {}
for l in open(audit, encoding='utf-8'):
    m = re.match(r'\|\s*(V\d{2})\s*\|', l)
    if not m:
        continue
    cols = [x.strip() for x in l.strip().strip('|').split('|')]
    v = None
    for key in ('不当', '弱い', '妥当'):
        if key in cols[-2]:
            v = key
            break
    ids[m.group(1)] = v
cnt = Counter(ids.values())
print(f'行 {len(ids)}：妥当 {cnt.get("妥当",0)}／弱い {cnt.get("弱い",0)}／不当 {cnt.get("不当",0)}／判定なし {cnt.get(None,0)}')
for key in ('妥当', '弱い', '不当'):
    print(f'  {key}: ' + '・'.join(sorted(x for x, v in ids.items() if v == key)))
