#!/usr/bin/env python3
# BIZ-LAW-RAMEN.md の論証の検査（docs/audit/BIZ-LAW-RAMEN-reasoning.md）で使った検算と数え直しを、すべてここで行う。
# 使い方: python3 -I boki2/docs/analysis/bizlaw-ramen-reasoning-recheck.py
# 書き手：論証検査役（報告を書いた担当とも、事実の判定役とも別）。
# 【検査役の仮定】と書いた数は、原文にない仮の置き値。結論はその置き値の幅で言える範囲だけを書く。
import os, re, unicodedata

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
REP = os.path.join(ROOT, 'docs', 'BIZ-LAW-RAMEN.md')
AUD = os.path.join(ROOT, 'docs', 'audit', 'BIZ-LAW-RAMEN-reasoning.md')
rep = open(REP, encoding='utf-8').read()

def yen(x): return f'{x:,.0f}円'

# ---------------------------------------------------------------- 1
print('## 1) 課徴金の試算を検算する（報告「課徴金の計算」・要点1・T1〜T4）')
# 式：景表法8条1項・2項（対象期間は最長36か月、3%、150万円未満は命じない）
def kachoukin(annual, share, months, tax=1.0):
    base = annual * tax * share * min(months, 36) / 12
    return base, base * 0.03
def months_to_threshold(annual, share, tax=1.0):
    return 1_500_000 * 12 / (0.03 * annual * share * tax)
A = 35_000_000  # DESIGN-RAMEN 68行の年商（BIZ-CALIB）。DESIGN は税抜方式（535行 s-shohizei）
print('(a) 報告の表の再現（年商3,500万円をそのまま売上額に使った場合）')
for share, m in [(0.85, 36), (0.85, 24), (0.85, 20), (0.10, 36), (0.50, 36)]:
    b, k = kachoukin(A, share, m)
    print(f'  割合{share} {m}か月: 対象売上 {yen(b)} → 課徴金 {yen(k)} {"命じる" if k >= 1_500_000 else "命じない"}')
print('    → 報告の表の5行と一致（式は正しい）')
# 考え方 第4の3(1)：売上額は「消費税相当額も含む」。報告 T3 も「試算は税込で」と書くが、表は税抜の年商のまま。
# 税込の倍率：店内だけなら1.10。報告 J34 の店内70%・持ち帰り30%なら 0.7*1.10+0.3*1.08 = 1.094
mix = 0.7 * 1.10 + 0.3 * 1.08
print(f'(b) 税込にした場合（T3 のとおり）。店内・持ち帰りの混合の倍率 {mix:.3f}（J34 の 70:30）')
for share in (1.0, 0.85, 0.5):
    print(f'  割合{share}: 足切りに届く月数 税抜 {months_to_threshold(A, share):.1f} → 税込 {months_to_threshold(A, share, mix):.1f} か月')
b, k = kachoukin(A, 0.85, 36, mix)
print(f'  割合0.85・36か月の課徴金：税抜 {yen(kachoukin(A,0.85,36)[1])} → 税込 {yen(k)}')
print('    → 報告の「20.2か月」「約268万円」は税抜の数。T3（税込）を当てると約18.5か月・約293万円。向きは同じで、報告の結論より早く届く')
# 年商3,500万円の1号店が免税事業者の間は消費税を別に受け取らないので、そのときは3,500万円が税込の額そのもの。
print('    （1号店が免税の2年は、3,500万円がそのまま対価の総額。どちらの前提かを試算に書く必要がある）')

print('(c) T2「大きい店でも限定の1品なら足切り」を、店の数で検算する（1店あたり年商3,500万円・限定の割合0.10）')
for months in (12, 24, 36):
    need = 5_000 * 10_000 / (A * 0.10 * months / 12)
    n = 1
    while kachoukin(A * n, 0.10, months)[1] < 1_500_000: n += 1
    print(f'  {months}か月：足切りを超えるのは {n} 店以上（必要な店数の実数 {need:.2f}）')
print('    → 全店で同じ限定の1品を偽れば、36か月なら5店、24か月なら8店、12か月なら15店で課徴金。'
      '「店の大小ではなく」は言い過ぎで、店の数（＝同じ商品の売上）が効く。元の BIZ-LAW の「大きくなれば」にも半分は理がある')

# ---------------------------------------------------------------- 2
print('\n## 2) 「偽る側が常に得に見える」（うまくいかない理由・捨てた案・L13）を損得で検算する')
# 報告はこの損得を計算していない。【検査役の仮定】で幅をとる。
# 得の側：①原価の差＝小麦は中華そば1杯の値段の約1%（BIZ-RAMEN 115行・農水省）。国産が輸入の1.5〜2倍なら差は値段の0.5〜1%。
#          ②値段の上乗せ・客の増加＝「○○産と押し出せば、割高でもオーダーが増えます」（r5-blr-gendai-gisou）。額は資料にない。
# 損の側：課徴金（上の表）。措置命令の周知の費用・評判は資料に額がない。
cups = A * 0.85 / 900  # 【検査役の仮定】1杯900円 → 年の杯数
print(f'  看板の麺の年の杯数（年商3,500万円×0.85÷1杯900円【仮定】）: {cups:,.0f} 杯')
k36 = kachoukin(A, 0.85, 36)[1]
for label, gain_per_cup in [('原価の差 値段の0.5%（4.5円/杯）', 4.5), ('原価の差 値段の1%（9円/杯）', 9.0),
                            ('上乗せ 30円/杯【仮定】', 30.0), ('上乗せ 100円/杯【仮定】', 100.0)]:
    g3 = gain_per_cup * cups * 3
    # 3年で見つかる確率 p のとき、得 g3 と期待の損 p*k36 が釣り合う p = g3/k36（見つかっても得は返さない前提の粗い近似）
    print(f'  {label}: 3年の得 {yen(g3)} 対 3年分の課徴金 {yen(k36)}。課徴金だけで釣り合う「3年で見つかる確率」≒ {g3 / k36 * 100:.0f}%')
print('    → 原価の差だけが得なら、3年で見つかる確率が約17〜33%を超えると課徴金だけで偽りは損。'
      '上乗せで1杯30円以上稼ぐなら、必ず見つかって課徴金を払っても偽りが得（111%・370%）。'
      'つまり「常に得に見える」かは得の大きさしだいで、しかも上乗せの場合は発覚の確率をいくら太くしても課徴金では釣り合わない。'
      '効くのは課徴金の外の返り（措置命令の周知・返金・評判・客の減り）の大きさ。報告はこの損得を計算していない（⑦）')

# ---------------------------------------------------------------- 3
print('\n## 3) 労基署の監督の確率（要点5②・S01・S02・写し方「申告の経路を太く」）')
p_teiki = 0.037      # r5-blr-ayusawa-chousa「全国の約3.7%」
v_teiki = 0.70       # 同じ記事「定期監督を受けた事業場の約7割で法令違反」（報告は使っていない）
v_target = 2519 / 2901  # r5-blr-mhlw-chojikan-r6 接客娯楽業（長時間労働が疑われる事業場だけ）
share_teiki, share_shinkoku = 0.8, 0.1  # 同じ記事の表「定期 全体の約8割」「申告 全体の約1割」
print(f'  接客娯楽業の違反率（疑いのある所だけ）: {v_target*100:.1f}%  ← 報告の要点が「入られれば飲食は」と書いた数')
print(f'  定期監督の違反率（同じ税理士の記事）: {v_teiki*100:.0f}%')
print(f'  町田支署の管内の飲食業の労働時間関連の違反率: 12.8%（r5-blr-rodo-machida-tencho。報告は同じ記事を引きながら使っていない）')
print(f'  1年に定期監督が入り違反が見つかる確率: {p_teiki*v_teiki*100:.2f}%（報告の組み合わせなら {p_teiki*v_target*100:.2f}%）')
p_shinkoku = p_teiki * share_shinkoku / share_teiki
print(f'  申告監督の年の率（定期3.7%×申告1割÷定期8割の粗い比）: {p_shinkoku*100:.2f}%  → 申告は定期の約1/8。「申告の経路を太く」は記事の割合と逆向き')

# ---------------------------------------------------------------- 4
print('\n## 4) 統計の割り算を検算する（S01・S04・S07・S11・S12）')
print(f'  S01 違反 2519/2901 = {2519/2901*100:.1f}%、違法な時間外 1461/2901 = {1461/2901*100:.1f}%、不払残業 341/2901 = {341/2901*100:.1f}%')
print(f'  S04 6.3億円/2,832件 = {6.3e8/2832/1e4:.1f}万円/件、6.3億円/10,263人 = {6.3e8/10263/1e4:.1f}万円/人')
print(f'  S07 破産 54/57 = {54/57*100:.1f}%、民事再生 2/57 = {2/57*100:.1f}%、54+2+1 = {54+2+1}')
print(f'  S11 令和6年 1,037件×52.8% = {1037*0.528:.0f}件（52.8%は令和6年だけの割合。令和4年の962件に当てる根拠はない）')
print(f'  S12 11,230/26,512 = {11230/26512*100:.1f}%、21,495/26,512 = {21495/26512*100:.1f}%')

# ---------------------------------------------------------------- 5
print('\n## 5) 事例の成否の数（受け入れ基準5：失敗6・成功4以上）')
def sect(title):
    m = re.search(r'^## ' + re.escape(title) + r'.*?$(.*?)(?=^## |\Z)', rep, re.M | re.S)
    return m.group(1) if m else ''
rows = re.findall(r'^\| (E\d+) \|([^|]*)\|([^|]*)\|', sect('事例と判例'), re.M)
succ = [e for e, a, b in rows if '成功' in b]
fail = [e for e, a, b in rows if '失敗' in b]
print(f'  成功 {len(succ)} {succ}、失敗 {len(fail)}')
print(f'  E14（訴訟が0件だった、という「起きなかったこと」を成功に数えたもの）を除くと成功 {len([e for e in succ if e != "E14"])} → 基準の4に届かない')

# ---------------------------------------------------------------- 6
print('\n## 6) 灰色の判断32件を、検査役が3つの型に分け直す（L05・要点4・うまくいく理由）')
# a = 法の当てはめそのものが実態で揺れる（本当の灰色）
# b = 決まりがはっきりしていて、条件を満たすかどうかで決まる（灰色ではなく、手続き・うっかり）
# c = どちらも合法で、経営の損得の引き換え（法の灰色ではない）
# d = 違反ははっきりしていて、揺れるのは見つかるかどうかだけ
TYPE = {
 'G01':'c','G02':'c','G03':'a','G04':'a','G05':'a','G06':'b','G07':'b','G08':'a','G09':'c','G10':'d',
 'G11':'a','G12':'b','G13':'a','G14':'a','G15':'c','G16':'a','G17':'c','G18':'b','G19':'b','G20':'c',
 'G21':'a','G22':'a','G23':'a','G24':'b','G25':'a','G26':'c','G27':'a','G28':'b','G29':'a','G30':'a',
 'G31':'c','G32':'c'}
gs = re.findall(r'^\| (G\d+) ', sect('灰色の判断の一覧'), re.M)
assert set(gs) == set(TYPE), (set(gs) ^ set(TYPE))
from collections import Counter
c = Counter(TYPE[g] for g in gs)
print(f'  報告の行 {len(gs)} 件 → a 本当の灰色 {c["a"]}、b 決まりで決まる {c["b"]}、c 合法どうしの引き換え {c["c"]}、d 違反は明らか・発覚だけが揺れる {c["d"]}（{c["a"]}+{c["b"]}+{c["c"]}+{c["d"]}={sum(c.values())}）')
print('  　a:', ' '.join(g for g in gs if TYPE[g]=='a'))
print('  　b:', ' '.join(g for g in gs if TYPE[g]=='b'))
print('  　c:', ' '.join(g for g in gs if TYPE[g]=='c'))
print('  　d:', ' '.join(g for g in gs if TYPE[g]=='d'))

# ---------------------------------------------------------------- 7
print('\n## 7) 仕訳41例の貸借を検算する（行ごと・（借）の区切りごと）')
jl = re.findall(r'^（(J\d+)[^）]*）(.*)$', sect('仕訳の例'), re.M)
amt = re.compile(r'\d{1,3}(?:,\d{3})+')
def strip_paren(t): return re.sub(r'（[^（）]*）', '', re.sub(r'（[^（）]*）', '', t))
bad = []
for j, body in jl:
    for seg in body.split('（借）')[1:]:
        if '／（貸）' not in seg: continue
        dr, cr = seg.split('／（貸）', 1)
        cr = re.split(r'、(?=[^0-9])', strip_paren(cr))[0]
        d = sum(int(x.replace(',', '')) for x in amt.findall(strip_paren(dr)))
        k = sum(int(x.replace(',', '')) for x in amt.findall(cr))
        if d != k: bad.append((j, d, k))
print(f'  仕訳 {len(jl)} 例。貸借の合計が合わない区切り: {bad if bad else "なし"}')
j16 = dict(jl)['J16']
print('  J16 の建設仮勘定：借方に積んだのは 30,000,000、完成で貸方から落とすのは 90,000,000（残りの 60,000,000 の積み増しの仕訳がない）')
print('  J34 店内 700,000×10% + 持ち帰り 300,000×8% =', 700000*0.10 + 300000*0.08)
print('  J35 8,000×70% =', 8000*0.7, '／ 102,400+5,600 =', 102400+5600)
print('  J36 980,000−620,000 =', 980000-620000, '／ J37 980,000×20% =', 980000*0.2, '、980,000−620,000−196,000 =', 980000-620000-196000)
print('  J31 子会社の資本 50,000,000×80% =', 50_000_000*0.8, '→ のれん', 50_000_000-40_000_000, '、非支配', 50_000_000*0.2)

# ---------------------------------------------------------------- 8
print('\n## 8) 内装工事の見積期間（群1 1-5「明日までに見積りを」は施主の違反になりうる）')
print('  建設業法施行令6条（r4-law-mlit-hacchusha-gl の本文）：予定価格500万円未満は1日以上、500万〜5,000万円は10日以上、5,000万円以上は15日以上')
print('  → 500万円未満の内装なら「明日まで」は違反にならない。1店1,400万円（DESIGN 68行）の内装の部分がどちらかは資料にない')

# ---------------------------------------------------------------- 9
print('\n## 9) 本書（docs/audit/BIZ-LAW-RAMEN-reasoning.md）の判定の列を数える')
if os.path.exists(AUD):
    a = open(AUD, encoding='utf-8').read()
    vrows = re.findall(r'^\| (R\d+) \|.*$', a, re.M)
    cnt = Counter(); ids = {'妥当': [], '弱い': [], '不当': []}
    for line in re.findall(r'^\| R\d+ \|.*$', a, re.M):
        cells = [x.strip() for x in line.strip().strip('|').split('|')]
        v = cells[-2]
        cnt[v] += 1
        if v in ids: ids[v].append(cells[0])
    print(f'  行 {len(vrows)}：妥当 {cnt["妥当"]}／弱い {cnt["弱い"]}／不当 {cnt["不当"]}（合計 {cnt["妥当"]+cnt["弱い"]+cnt["不当"]}）')
    other = {k: v for k, v in cnt.items() if k not in ids}
    if other: print('  判定の列が3つのどれでもない行:', other)
    for k in ('不当', '弱い'):
        print(f'  {k}: ' + '・'.join(ids[k]))
else:
    print('  （検査書がまだない）')

# ================================================================ 第2版の再検査（docs/audit/BIZ-LAW-RAMEN-reasoning.md 15章）
print('\n## 10) 第2版の数を検算する')
print('(a) 税込で数えた店の数（第2版の表「税込で数えた店の数」）')
for months in (12, 24, 36):
    row = []
    for t in (1.0, mix):
        n = 1
        while A * n * t * 0.10 * months / 12 * 0.03 < 1_500_000: n += 1
        row.append(n)
    print(f'  {months}か月：税抜 {row[0]} 店、税込 {row[1]} 店')
print(f'  税込の年の売上 {A*mix:,.0f}円（第2版の 38,290,000円と一致するか）')
print('(b) 偽りの損得の表（第2版の「8)」）を、原価の差の置き値だけ変えて出し直す')
cups3 = A * 0.85 / 900 * 3
k = A * mix * 0.85 * 3 * 0.03
extra = 400_000 + A * 0.10 * 0.65
print(f'  36か月の杯数 {cups3:,.0f}、課徴金 {k:,.0f}円、周知＋客の減り {extra:,.0f}円')
for d, note in [(4.5, '小麦が1杯の値段の約1%（9円）で、国産が輸入の1.5倍のとき'),
                (9.0, '同じく2倍のとき（＝小麦代の全部が差になる上限）'),
                (15.0, '第2版の置き値（根拠の記述なし。小麦代の全部＝約9円を超える）')]:
    g = cups3 * d
    print(f'  1杯{d}円（{note}）：得 {g:,.0f}円、釣り合う3年の発覚確率 課徴金だけ {g/k:.2f}・課徴金＋周知＋客の減り {g/(k+extra):.2f}')
print('    → 第2版の「原価の差だけの偽りは27〜51%を超えると損」は、小麦の資料（約1%）と合う置き値なら8〜30%。向き（確率しだいで損にも得にもなる）は変わらない')
print('(c) 灰色の判断の型：第2版の列は検査役の割り付けと32行すべて一致（入れ替え0）')
import re as _re
rep2 = open(REP, encoding='utf-8').read()
m2 = _re.search(r'^## 灰色の判断の一覧.*?$(.*?)(?=^## |\Z)', rep2, _re.M | _re.S)
same = diff = 0
for line in _re.findall(r'^\| (G\d+) \|.*$', m2.group(1) if m2 else '', _re.M):
    pass
for gid, last in _re.findall(r'^\| (G\d+) \|.*\| ([abcd]) [^|]*\|\s*$', m2.group(1) if m2 else '', _re.M):
    if TYPE.get(gid) == last: same += 1
    else: diff += 1
print(f'  一致 {same}、違う {diff}（第2版の書き手は「入れ替えはなかった」と書く。型 a は {c["a"]} 件で、基準の15件にちょうど届く）')
print('  　G05（加盟金の収益の時期）は会計基準の判断で「法の当てはめ」ではないので c と読む余地があり、そうすると a は14件で基準に届かない。G24 の b（決まりで決まる）も、決まりの原文（国税庁の Q&A）が読めていないので根拠がない【検査役の推論】')

print('\n## 11) 本書15章の判定の列と、対応の列を数える')
if os.path.exists(AUD):
    a = open(AUD, encoding='utf-8').read()
    vs = Counter()
    for line in _re.findall(r'^\| V\d+ \|.*$', a, _re.M):
        cells = [x.strip() for x in line.strip().strip('|').split('|')]
        vs[cells[-2]] += 1
    print(f'  第2版の結論の行 {sum(vs.values())}：' + '／'.join(f'{k} {v}' for k, v in sorted(vs.items())))
    rs = Counter()
    for line in _re.findall(r'^\| A-R\d+ \|.*$', a, _re.M):
        cells = [x.strip() for x in line.strip().strip('|').split('|')]
        rs[cells[2]] += 1
    print(f'  前回の不当・弱い {sum(rs.values())} 行への応え：' + '／'.join(f'{k} {v}' for k, v in sorted(rs.items())))
    ws = Counter()
    for line in _re.findall(r'^\| W\d+ \|.*$', a, _re.M):
        cells = [x.strip() for x in line.strip().strip('|').split('|')]
        ws[cells[-2]] += 1
    print(f'  「検査役の筋から採ったもの」16行の判定：' + '／'.join(f'{k} {v}' for k, v in sorted(ws.items())))

# ================================================================ 第3版の再検査（本書16章）
print('\n## 12) 第3版の数を検算する')
print('(a) 偽りの損得：第3版の4.5円・9円の行は、本書10節(b) と同じ式で同じ数になるか')
for d in (4.5, 9.0):
    g = cups3 * d
    print(f'  1杯{d}円：得 {g:,.0f}円、課徴金だけ {g/k:.2f}、課徴金＋周知＋客の減り {g/(k+extra):.2f}')
print('(b) 灰色の型：第3版の定義で a は15件。G18 を b にすれば', 15 - 1, '件。G05 を a に戻せば', 15 + 1, '件')
print('(c) 新しい群の割合：第3版の報告は 0.448 と書くが、書き手のスクリプトの 11) を走らせると 0.446（16章 X32）')
if os.path.exists(AUD):
    a = open(AUD, encoding='utf-8').read()
    for pre, col, name in (('X', -2, '第3版の変わった結論'), ('Y', -2, '「検査役の筋から採ったもの」の新しい・直した行'), ('B-', 2, '15.9 への応え')):
        cnt = Counter()
        for line in _re.findall(r'^\| ' + _re.escape(pre) + r'\d+ \|.*$', a, _re.M):
            cells = [x.strip() for x in line.strip().strip('|').split('|')]
            cnt[cells[col]] += 1
        print(f'  {name} {sum(cnt.values())} 行：' + '／'.join(f'{kk} {v}' for kk, v in sorted(cnt.items())))
