#!/usr/bin/env python3
"""BIZ-REPLAY の論証検査（docs/audit/BIZ-REPLAY-reasoning.md）で使う数え直しと検算。

  python3 -I boki2/docs/analysis/replay-reasoning-check.py > boki2/docs/analysis/replay-reasoning-check.out.txt

1) 報告 3.3 の見積りの算術をそのまま再現する（前提は報告のまま）
2) 前提を変えたときの感度（模擬。乱数の種は固定なので同じ数が出る）
3) 「満点」の確率の目安（1項目の保持率 r と出題される項目数 m からの r^m。独立を仮定した説明用の数）
4) Cepeda 2008 の比を「最後の正解から受験日まで」で当て直す
5) 声 K（組み合わせ・毎回違う展開）×周 20件の小分け（検査役の印）
6) 1章の22作品の「段」の有無と、「どれも答えが変わる」の7作品の内訳
7) 検査書の判定の数（表の判定の列を数える）

外部には何も取りに行かない。数は全部この中で計算する。
"""
import math, random, re, os, sys, statistics as st

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))

def hr(t):
    print('\n' + '=' * 4 + ' ' + t + ' ' + '=' * 4)

# ---------------------------------------------------------------- 1
hr('1) 報告 3.3 の算術の再現（前提は報告のまま：1日1時間・毎日・思い出しは毎回正解・間隔3/7/14日）')
for run_days in (10, 15):
    last_first = 0.7 * run_days            # 7期目までに全77項目が初出
    done_A = last_first + 3 + 7 + 14        # 初出→3日後→10日後→24日後
    run_no = math.floor(done_A / run_days) + 1
    print(f'1周 {run_days}日：最後の初出 {last_first:.1f}日目 → 3回目の正解 {done_A:.1f}日目'
          f' ＝ {done_A/run_days:.2f}周分（{run_no}周目の中）・{done_A/7:.1f}週')
print('報告は「31〜34.5日目は3周目（21〜45日目）の中」と書くが、3周目は1周10日なら21〜30日目、15日なら31〜45日目。'
      '1周10日の場合 31日目は4周目に入る（上の行）。「21〜45日目」は2つの場合を混ぜた範囲。')
print('条件Aだけなら 2.3〜3.1周分・4.4〜4.9週。報告の「5〜8週」の上側（8週＝56日）は、1周15日で4周目の終わり（60日）'
      'に当たり、条件Bの「3周目の終わりから4周目の初め」（1周10日で30日・15日で45日＝4.3〜6.4週）からは出ない。'
      '式が書かれていないので、5〜8週の作り方は再現できない。')
print('1日30分（1周20〜30日）：3周×20〜30日＝60〜90日＝{:.1f}〜{:.1f}週（報告の 9〜13週 と合う）'.format(60/7, 90/7))
print('想起の機会：月初 10期×12か月＝120回/周。必要 3回×77＝231回 → 1回1項目なら {:.2f}周分、2項目なら {:.2f}周分'
      .format(231/120, 231/240))

# ---------------------------------------------------------------- 2
hr('2) 感度：全77項目が「日をあけた正解N回」に届くまでの日数（模擬、各条件200人、中央値と9割の人が届く日）')

def simulate(seed, *, run_days=10, hours_per_day=1.0, play_days_per_week=7, p=1.0,
             gaps=(3, 7, 14), k=1, n_items=77, fail_retry_days=1.0, horizon_days=400,
             reset_on_fail=True, p_learn=False):
    """1人分。時間はすべて実日数。遊ぶ日だけ月初（想起の機会）が来る。
    1周＝10期×12か月＝120回の月初。1日の遊ぶ時間 h、1周の長さ run_days（1日1時間のとき）。
    1周を遊び終えるのに要る実日数 = run_days / h × 7/play_days_per_week（遊ばない日がある分のびる）。
    項目の初出：1周目の 0〜7割の位置に一様（番人が7期目までに全部出す）。
    想起：毎月初に、期日の来た項目を期日の早い順に k 件。正解なら回数+1、次の期日は gaps[回数]日後。
    誤りなら回数0に戻し、fail_retry_days 日後に再び候補（PEDAGOGY 6 の「間違えた問題は1/3/7日」の最初）。"""
    rnd = random.Random(seed)
    play_hours_per_run = run_days * 1.0           # 1日1時間で run_days 日
    months_per_hour = 120.0 / play_hours_per_run
    pattern = {7: [1]*7, 5: [1,1,1,1,1,0,0], 3: [1,0,1,0,1,0,0], 2: [0,0,1,0,0,1,0]}[play_days_per_week]
    # 月初の時刻（実日数）を並べる
    events = []
    play_hours = 0.0
    day = 0
    while day < horizon_days:
        if pattern[day % 7]:
            n_m = months_per_hour * hours_per_day
            # その日の中に均等に置く（端数は累積で扱う）
            start = play_hours * months_per_hour
            end = (play_hours + hours_per_day) * months_per_hour
            m = math.floor(start) + 1
            while m <= end:
                frac = (m - start) / max(n_m, 1e-9)
                events.append((day + frac * 0.99, m))
                m += 1
            play_hours += hours_per_day
        day += 1
    # 初出：1周目の 0〜0.7 の月の位置
    first_month = sorted(rnd.uniform(0, 0.7 * 120) for _ in range(n_items))
    month_time = {m: t for t, m in events}
    def time_of_month(x):
        m = max(1, math.ceil(x))
        return month_time.get(m, horizon_days)
    items = [{'first': time_of_month(fm), 'n': 0, 'due': None} for fm in first_month]
    for it in items:
        it['due'] = it['first'] + gaps[0]
    need = len(gaps)
    done_count = 0
    done_time = None
    for t, m in events:
        cand = [it for it in items if it['n'] < need and it['first'] <= t and it['due'] <= t]
        cand.sort(key=lambda it: it['due'])
        for it in cand[:k]:
            pp = (1 - (1 - p) * (0.5 ** it['n'])) if p_learn else p
            if rnd.random() < pp:
                it['n'] += 1
                if it['n'] >= need:
                    done_count += 1
                    if done_count == n_items:
                        done_time = t
                else:
                    it['due'] = t + gaps[it['n']]
            else:
                if reset_on_fail:
                    it['n'] = 0
                it['due'] = t + fail_retry_days
        if done_time is not None:
            break
    run_real_days = run_days / hours_per_day * 7.0 / play_days_per_week
    return done_time, run_real_days

def cell(label, n_people=200, **kw):
    res = []
    run_len = None
    for s in range(n_people):
        d, run_len = simulate(1000 + s, **kw)
        res.append(d if d is not None else float('inf'))
    res.sort()
    med = res[len(res)//2]
    p90 = res[int(len(res)*0.9)]
    fin = [x for x in res if x != float('inf')]
    def fmt(x):
        return '400日以内に届かない' if x == float('inf') else f'{x:5.1f}日（{x/7:4.1f}週・{x/run_len:4.2f}周分）'
    print(f'{label:<54} 中央値 {fmt(med)} ／ 9割 {fmt(p90)}')
    return med, p90

print('基準（報告の前提）：1周10日・1日1時間・毎日・正解率100%・N=3（3/7/14日）・月初1件')
cell('基準', p=1.0)
cell('基準（1周15日）', run_days=15, p=1.0)
print('-- 思い出しの正解率 p（誤れば回数0から。PEDAGOGY 6・S.plan の n＝正解の連続数）')
for p in (0.95, 0.9, 0.8, 0.7):
    cell(f'p={p}', p=p)
for p in (0.9, 0.8):
    cell(f'p={p}・1周15日', p=p, run_days=15)
print('-- 誤っても回数を0に戻さない（条件Aを「通算の正解」と読む場合）')
for p in (0.9, 0.8):
    cell(f'p={p}・戻さない', p=p, reset_on_fail=False)
print('-- 正解のたびに誤りの率が半分になる（初回の正解率 p、2回目以降 1-(1-p)/2^n）')
for p in (0.8, 0.7, 0.6):
    cell(f'初回p={p}・上がる', p=p, p_learn=True)
    cell(f'初回p={p}・上がる・戻さない', p=p, p_learn=True, reset_on_fail=False)
print('-- 遊ぶ日（週7・週5・週3・週2）')
for d in (5, 3, 2):
    cell(f'週{d}日・p=1.0', play_days_per_week=d, p=1.0)
    cell(f'週{d}日・p=0.9', play_days_per_week=d, p=0.9)
print('-- 必要な正解の回数（今の条件A=2回〔7日以上あけて〕／報告の案=3回／4回）')
cell('N=2（gaps 7,7：条件Aの今の形に近い）', gaps=(7, 7), p=1.0)
cell('N=2・p=0.9', gaps=(7, 7), p=0.9)
cell('N=4（3/7/14/21）', gaps=(3, 7, 14, 21), p=1.0)
cell('N=4・p=0.9', gaps=(3, 7, 14, 21), p=0.9)
print('-- 1日30分')
cell('1日30分・p=1.0', hours_per_day=0.5, p=1.0)
cell('1日30分・p=0.9', hours_per_day=0.5, p=0.9)
print('-- 月初に2件ずつ想起できる場合')
cell('k=2・p=0.8', k=2, p=0.8)
print('（注）条件B（段3で7日以上あけて2回続けて100点）・C・D は模擬に入れていない。B は1回90分の通しで、1日1時間なら'
      '1回に1.5日分の時間を使う。1回の通しで100点を取る確率を q とすると、2回続けて取るまでの回数の期待値は (1+q)/q^2'
      '（q=1 で2回、q=0.7 で約3.5回、q=0.5 で6回）で、そのたびに7日以上あけるので、B だけで 7〜35日ほど足される。')
for q in (1.0, 0.9, 0.7, 0.5):
    e = (1 + q) / (q * q)
    print(f'  q={q}: 2回続けて100点までの通しの回数の期待値 {e:.2f}回 → 7日おきなら最短から約 {7*(e-1):.0f}日')

# ---------------------------------------------------------------- 3
hr('3) 「満点」の目安：1項目の受験日の保持率 r、本試験で問われる項目数 m のとき、全部正しい確率 r^m（独立を仮定）')
print('r の参考（報告が引く原文の数）：Higham 2021 の学期末（3回の再学習・練習と同じ問題）約0.55、'
      'Rawson ら 2018（Higham の紹介）1週間後 0.80、3週間後 0.77、Bahrick 1993 の26回・56日おき 約0.76、'
      'Cepeda 2008 の最終テストの平均 0.41（85%以上を取った人は2.6%）')
rs = (0.55, 0.77, 0.8, 0.9, 0.95, 0.99)
ms = (15, 25, 40)
print('     m=' + '  '.join(f'{m:>8}' for m in ms))
for r in rs:
    print(f'r={r:<5}' + '  '.join(f'{r**m:8.4f}' for m in ms))
print('m は仮定（本試験の大問・小問の数から決まり、この検査では確かめていない）。満点は「部分点も含めてすべて正しい」の意味。'
      '項目どうしの独立は強い仮定で、実際は相関するので r^m より高くなりうる。それでも r=0.8 では m=15 で 3.5%。')

# ---------------------------------------------------------------- 4
hr('4) Cepeda 2008 の比を「最後の正解から受験日まで（RI）」で当て直す')
cep = [(7, 0.43), (35, 0.23), (70, 0.17), (350, 0.08)]
def ratio(ri):
    for (a, ra), (b, rb) in zip(cep, cep[1:]):
        if a <= ri <= b:
            # 対数で補間
            w = (math.log(ri) - math.log(a)) / (math.log(b) - math.log(a))
            return ra + (rb - ra) * w
    return cep[-1][1] if ri > 350 else cep[0][1]
for exam in (60, 90):
    for last in (31, 34.5):
        ri = exam - last
        r = ratio(ri)
        print(f'受験日 {exam}日目・最後の正解 {last}日目 → RI {ri:.1f}日・最適の比 {r:.2f} → 1回の復習の最適間隔 約{ri*r:.1f}日')
print('報告は「受験日まで90日なら最後の間隔9〜18日」と、RI を「始めから受験日まで」の90日で取っている。'
      'Cepeda の RI は「（2回目の）学習からテストまで」。また Cepeda は復習1回の実験で、3回の想起の「最後の間隔」には当てはまらない'
      '（報告 3.1 の表も「広げていく予定表は調べていない」と書く）。')

# ---------------------------------------------------------------- 5
hr('5) 声 K×周（20件）の小分け（検査役の印。本文は --dump で原文から読める）')
codes_path = os.path.join(HERE, 'replay-voices-codes.md')
rows = {}
for l in open(codes_path, encoding='utf-8'):
    m = re.match(r'\|\s*(\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|', l)
    if m:
        rows[int(m.group(1))] = (m.group(2).strip(), m.group(3).strip(), m.group(4).strip().split())
k_shu = sorted(n for n, (w, rel, fun) in rows.items() if rel == '周' and 'K' in fun)
# r = 周ごとに中身（マップ・札・敵・出来事・物語）が違うことを言う
# c = 自分で組む組み合わせ・コンボ・デッキの幅（固定の札の中の深さを含む）
# x = 「前の周の最善手・勝ち方が今周は通らない」とはっきり言う
mine = {2: 'r', 4: 'c', 9: 'r', 14: 'c', 22: 'c', 34: 'c', 51: 'c', 98: 'c', 100: 'c', 108: 'c', 109: 'c',
        113: 'c', 121: 'c', 144: 'r', 145: 'r', 148: 'r', 149: 'c', 152: 'r', 154: 'r', 164: 'r'}
assert sorted(mine) == k_shu, (sorted(mine), k_shu)
from collections import Counter
cnt = Counter(mine.values())
works = Counter(rows[n][0] for n in k_shu)
print(f'K×周の件数 {len(k_shu)}（作品 {dict(works)}）')
print(f'  r 周ごとに中身が違う {cnt.get("r",0)}、c 自分で組む組み合わせ・コンボ {cnt.get("c",0)}、'
      f'x 前の周の最善手が通らないと明言 {cnt.get("x",0)}')
print('  r:', ' '.join('#%d' % n for n in k_shu if mine[n] == 'r'))
print('  c:', ' '.join('#%d' % n for n in k_shu if mine[n] == 'c'))
print('  経営シム（Game Dev Tycoon）とカイロソフトの声は K×周に0件')

# ---------------------------------------------------------------- 6
hr('6) 1章の22作品：「尽きないための仕掛け」に段（難度の更新）があるか、と「どれも答えが変わる」の7作品')
dan = {'Slay the Spire': 1, 'Hades': 1, 'Into the Breach': 0, 'Balatro': 1, 'Spelunky': 0, 'Dead Cells': 1, 'FTL': 0,
       'Outer Wilds': 0, 'Obra Dinn': 0, 'NieR:Automata': 0, '80 Days／Heaven\'s Vault': 0, 'Papers, Please': 0,
       'Detroit': 0, 'Pyre': 0, 'Cultist Simulator': 0, 'カイロソフト3作': 0, 'Game Dev Tycoon': 0,
       'Stardew Valley': 0, 'Two Point Hospital': 0, 'ルセッティア': 1, 'Capsim': 0, '戦略MG': 0}
print(f'作品数 {len(dan)}、段（Ascension・Pact・賭け金・Boss Cells・借金の増えるモード）を持つ {sum(dan.values())}、持たない {len(dan)-sum(dan.values())}')
print('→ 報告の「尽きないための仕掛けは、どの作品も『段』と『固定の最適を崩す作り』の組み合わせ」は 22作品中 %d作品にしか当たらない' % sum(dan.values()))
seven = {'Slay the Spire': '周回のゲーム', 'Hades': '周回のゲーム', 'Balatro': '周回のゲーム', 'Dead Cells': '周回のゲーム',
         'FTL': '周回のゲーム', 'Capsim': '1回の授業の中のラウンド（遊び直しではない）', '戦略MG': '2日で5期の1回の研修（遊び直しではない）'}
print('「長い周回の声や作り手の話がある作品はどれも答えが変わる」の7作品：')
for k_, v in seven.items():
    print(f'  {k_}: {v}')
print('  同じ表で長い周回の声があるのに7作品に入っていないもの：Stardew Valley（200時間・#186、牧場を変えて始め直す #179）、'
      'カイロソフト（「二周目に突入」、グルメ食堂の「10週以上遊べる」）、80 Days（8〜10回）')

# ---------------------------------------------------------------- 7
hr('7) 検査書の判定の数')
audit = os.path.join(ROOT, 'docs', 'audit', 'BIZ-REPLAY-reasoning.md')
if os.path.exists(audit):
    ids = {}
    for l in open(audit, encoding='utf-8'):
        m = re.match(r'\|\s*([RDL]\d{2})\s*\|', l)
        if not m:
            continue
        cols = [c.strip() for c in l.strip().strip('|').split('|')]
        verdict = cols[-2]
        v = None
        for key in ('不当', '弱い', '妥当'):
            if key in verdict:
                v = key
                break
        ids[m.group(1)] = v
    for pre, name in (('R', '本文の結論'), ('D', '差し替え'), ('L', '論証の表')):
        sub = {k_: v for k_, v in ids.items() if k_.startswith(pre)}
        c = Counter(sub.values())
        print(f'{name} {len(sub)}：妥当 {c.get("妥当",0)}／弱い {c.get("弱い",0)}／不当 {c.get("不当",0)}／判定なし {c.get(None,0)}')
        for key in ('妥当', '弱い', '不当'):
            print(f'  {key}: ' + '・'.join(sorted(k_ for k_, v in sub.items() if v == key)))
else:
    print('検査書がまだない')
