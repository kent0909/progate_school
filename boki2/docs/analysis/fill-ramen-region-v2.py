#!/usr/bin/env python3
"""BIZ-FILL-RAMEN 1.1 の地域の採算。1.0（fill-region.py）の表を、検査（BIZ-FILL-RAMEN-audit・-reasoning）の指摘に合わせて組み直す。
1.0 から変えた所：
  ・広さ：10坪【推論】をやめ、日本政策金融公庫『小企業の経営指標』中華料理店・従業者1〜4人の店舗面積 58.6㎡（約17.7坪）を基準にする。10坪は比べの行として残す。
  ・人：「アルバイトを何人雇うか（0＝家族と店主だけ）」と「店主の取り分（0・15・30万円）」を軸にした表にする。
  ・値段：銀座は 617円（区部の統計）・800・1,000・1,300・1,500円の帯で分ける。
  ・奥多摩は「30杯で黒字になる固定費の上限」を式で出す（30杯×25日×値段×(1−原価率)）。
  ・場所だけの差：人と値段をそろえて家賃だけを替えた時の分岐の杯数の比。
  ・1つずつ動かした時の効き（感度）と、地域の散らばりの順（値段・家賃・最低賃金）と利益への効きの順を別に出す。
資料の数：中華そば（外食）1杯と民営家賃（小売物価統計 2026年7月 81市）、銀座の飲食店の募集賃料 42,497円/坪（飲食店ドットコム）・36,250円/坪（アットホーム）、
  東京9エリアの飲食可 30,227円/坪（アットホーム）、最低賃金（令和8年度 47都道府県）、公庫の店舗面積 58.6㎡・3.3㎡あたり年の売上 1,977千円。
【推論】の数：その他の固定費（光熱・水道・通信・消耗品など）25万円（銀座）／15万円（奥多摩）、返済・税保険 8万円、原価率30%、25日営業、アルバイトは1人8時間（奥多摩は6時間）、奥多摩の賃料。
使い方: python3 -I boki2/docs/analysis/fill-ramen-region-v2.py
"""
import os, re, shutil, tempfile, subprocess, statistics, itertools
RAW = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'research', 'raw', 'web', 'ramen')
def xl_row(name, key):
    import openpyxl
    tmp = tempfile.mkdtemp(); q = os.path.join(tmp, 'a.xlsx'); shutil.copy(os.path.join(RAW, name), q)
    rows = list(openpyxl.load_workbook(q, read_only=True).worksheets[0].iter_rows(values_only=True))
    shutil.rmtree(tmp, ignore_errors=True)
    hdr = [r for r in rows if r and any(str(x) == '札幌市' for x in r)][0]
    r = [r for r in rows if r and any(str(x).startswith(key) for x in r if x)][0]
    i = [str(x) for x in hdr].index('札幌市')
    return {hdr[j]: r[j] for j in range(i, len(hdr)) if hdr[j] and isinstance(r[j], (int, float))}
price = xl_row('r6-fill-kouri-toshi-b0011-202607.html', '中華そば(外食)')
rent = xl_row('r6-fill-kouri-toshi-b0012-202607.html', '民営家賃')
mwt = subprocess.run(['pdftotext', '-layout', os.path.join(RAW, 'r6-fill-mhlw-minwage-r8.pdf'), '-'], capture_output=True, text=True).stdout
mw = [int(x.replace(',', '')) for x in re.findall(r'^\s*\S.*?\s(1,\d{3})\s+（', mwt, re.M)][:47]
print(f'読んだ数：中華そば {len(price)}市（中央値 {statistics.median(price.values()):.0f}円）、民営家賃 {len(rent)}市、最低賃金 {len(mw)}都道府県（{min(mw)}〜{max(mw)}円）')

TSUBO = 58.6 / 3.305785
print(f'\n## 1. 広さ：公庫の 58.6㎡ ＝ {TSUBO:.1f}坪。公庫の 3.3㎡あたり年の売上 1,977千円 × {TSUBO:.1f}坪 ＝ 年 {1977*TSUBO/1000:.1f}百万円 ＝ 月 {1977*TSUBO/12/1000:.2f}百万円'
      f'（1杯1,000円・25日なら1日 {1977e3*TSUBO/12/25/1000:.0f}杯、747円なら {1977e3*TSUBO/12/25/747:.0f}杯）')

DAYS, COST = 25, 0.30
def month(cups, p, rent_m, staff, hours, wage, other, debt, owner=0, days=DAYS, cost=COST):
    return cups * days * p * (1 - cost) - (rent_m + staff * hours * days * wage + other + debt + owner)
def be(p, rent_m, staff, hours, wage, other, debt, owner=0, days=DAYS, cost=COST):
    return (rent_m + staff * hours * days * wage + other + debt + owner) / (days * p * (1 - cost))
W = 1280
G_RENT = 42497 * TSUBO
print(f'銀座の家賃（月）：42,497円 × {TSUBO:.1f}坪 ＝ {G_RENT/1e4:.1f}万円（10坪なら {42497*10/1e4:.1f}万円、アットホーム 36,250円なら {36250*TSUBO/1e4:.1f}万円）')

print('\n## 2. 銀座・1日100杯：アルバイトの人数 × 店主の取り分（値段の帯ごと、17.7坪・坪42,497円・その他25万・返済税保険8万）。月の残り（万円）')
for p in (617, 800, 1000, 1300, 1500):
    print(f'\n値段 {p:,}円（100杯×25日の売上 {100*25*p/1e4:.0f}万円）')
    print('| アルバイト（8時間） | 店主0円 | 店主15万 | 店主30万 |'); print('|---|---|---|---|')
    for st in (0, 1, 2, 3):
        print(f'| {st}人 | ' + ' | '.join(f'{month(100, p, G_RENT, st, 8, W, 250000, 80000, owner=o)/1e4:+.1f}' for o in (0, 150000, 300000)) + ' |')
print('\n銀座：前提を広く振った時の赤字の割合（坪 36,250/42,497、広さ 10/17.7坪、アルバイト 1〜3人、原価率 30/35%、その他 20/25万）')
print('| 値段 | 店主0円 | 店主15万 | 店主30万 |'); print('|---|---|---|---|')
for p in (617, 800, 1000, 1300, 1500):
    cells = []
    for o in (0, 150000, 300000):
        g = list(itertools.product((36250, 42497), (10, TSUBO), (1, 2, 3), (0.30, 0.35), (200000, 250000)))
        red = sum(1 for t, a, st, c, ot in g if month(100, p, t * a, st, 8, W, ot, 80000, owner=o, cost=c) < 0)
        cells.append(f'{red}/{len(g)}（{red/len(g)*100:.0f}%）')
    print(f'| {p:,}円 | ' + ' | '.join(cells) + ' |')
r1000 = month(100, 1000, 42497 * 10, 3, 8, W, 250000, 80000)
print(f'\n1.0 の銀座1,000円の行（10坪・3人）：店主の前 {r1000/1e4:+.1f}万円 → 店主15万の後 {(r1000-150000)/1e4:+.1f}万円 → 店主30万の後 {(r1000-300000)/1e4:+.1f}万円')
r1000b = month(100, 1000, G_RENT, 3, 8, W, 250000, 80000)
print(f'同じ行を17.7坪にすると：店主の前 {r1000b/1e4:+.1f}万円 → 店主30万の後 {(r1000b-300000)/1e4:+.1f}万円')

print('\n## 3. 奥多摩・1日30杯：黒字の条件（式）')
for p in (747, 890, 1000):
    print(f'  1杯 {p}円：30杯×25日×{p}円×0.7 ＝ {30*25*p*0.7/1e4:.2f}万円。家賃＋人件費＋その他＋返済税保険＋店主の取り分 がこれ以下なら黒字')
print('\n奥多摩・30杯：アルバイト × 店主の取り分（1杯890円＝八王子の値、家賃6万、その他15万、返済税保険8万）。月の残り（万円）')
print('| アルバイト | 店主0円 | 店主15万 | 店主30万 |'); print('|---|---|---|---|')
for st, h in ((0, 6), (1, 6), (1, 8)):
    print(f'| {st}人{"（"+str(h)+"時間）" if st else "（家族と店主だけ）"} | ' + ' | '.join(f'{month(30, 890, 60000, st, h, W, 150000, 80000, owner=o)/1e4:+.1f}' for o in (0, 150000, 300000)) + ' |')
print('\n奥多摩：前提を広く振った時の黒字の割合（値段 747/890/1,000、家賃 0/3/6/10万、その他 10/15/20万、返済税保険 0/8万、原価率 30/35%、営業 20/25日）')
print('| アルバイト | 店主0円 | 店主15万 | 店主30万 |'); print('|---|---|---|---|')
for st in (0, 1):
    cells = []
    for o in (0, 150000, 300000):
        g = list(itertools.product((747, 890, 1000), (0, 30000, 60000, 100000), (100000, 150000, 200000), (0, 80000), (0.30, 0.35), (20, 25)))
        ok = sum(1 for p, r, ot, d, c, dy in g if month(30, p, r, st, 6, W, ot, d, owner=o, days=dy, cost=c) >= 0)
        cells.append(f'{ok}/{len(g)}（{ok/len(g)*100:.0f}%）')
    print(f'| {st}人 | ' + ' | '.join(cells) + ' |')
old = month(30, 890, 60000, 1, 6, W, 200000, 80000)
print(f'\n1.0 の奥多摩の行（その他20万・アルバイト1人6時間）：30杯で {old/1e4:+.2f}万円。アルバイトを外すと {month(30, 890, 60000, 0, 6, W, 200000, 80000)/1e4:+.2f}万円、分岐 {be(890, 60000, 0, 6, W, 200000, 80000):.1f}杯')
print(f'1.0 の行の固定費 {(60000+1*6*25*W+200000+80000)/1e4:.1f}万円 ＞ 上限 {30*25*890*0.7/1e4:.2f}万円 → 赤字')

print('\n## 4. 場所だけの差（人と値段をそろえ、家賃だけ替える。その他25万・返済税保険8万、店主0円の分岐の杯数）')
for st, p in ((2, 1000), (0, 1000), (1, 890), (2, 747)):
    a = be(p, G_RENT, st, 8, W, 250000, 80000); a10 = be(p, 42497 * 10, st, 8, W, 250000, 80000); b = be(p, 60000, st, 8, W, 250000, 80000)
    print(f'  アルバイト{st}人・{p}円：銀座17.7坪 {a:.0f}杯／銀座10坪 {a10:.0f}杯／奥多摩6万 {b:.0f}杯 → 比 {a/b:.2f}（10坪 {a10/b:.2f}）')
print('  （その他を両方15万にした時）', ' '.join(f'{st}人:{be(1000, G_RENT, st, 8, W, 150000, 80000)/be(1000, 60000, st, 8, W, 150000, 80000):.2f}' for st in (0, 1, 2)))

print('\n## 5. 1つずつ動かす（基準：銀座・100杯・1,000円・10坪・3人8時間・その他25万・返済税保険8万、店主の前）')
base = dict(cups=100, p=1000, rent_m=42497 * 10, staff=3, hours=8, wage=W, other=250000, debt=80000)
b0 = month(**base); print(f'  基準 {b0/1e4:+.1f}万円')
for lab, kw in (('坪単価を倍（85,000円）', dict(rent_m=85000 * 10)), ('広さ17.7坪（公庫）', dict(rent_m=G_RENT)), ('広さ15坪', dict(rent_m=42497 * 15)),
                ('人を1人減らす（2人）', dict(staff=2)), ('人を1人増やす（4人）', dict(staff=4)), ('値段1,300円', dict(p=1300)), ('値段800円', dict(p=800)),
                ('値段747円（81市の中央値）', dict(p=747)), ('時給を最低の県1,085円', dict(wage=1085))):
    a = dict(base); a.update(kw); print(f'  {lab}：{(month(**a)-b0)/1e4:+.1f}万円')
for lab, kw in (('原価率35%', dict(cost=0.35)), ('22日営業', dict(days=22))):
    print(f'  {lab}：{(month(**base, **kw)-b0)/1e4:+.1f}万円')

print('\n## 6. 地域の散らばりの順と、利益への効きの順（別の物差し）')
def q(v, pp):
    v = sorted(v); k = (len(v) - 1) * pp; f = int(k); c = min(f + 1, len(v) - 1); return v[f] + (v[c] - v[f]) * (k - f)
print('| 値 | 数 | 最高÷最低 | 90%点÷10%点 | 75%点÷25%点 |'); print('|---|---|---|---|---|')
for lab, v in (('中華そば1杯', list(price.values())), ('民営家賃（住宅）', list(rent.values())), ('最低賃金', mw)):
    print(f'| {lab} | {len(v)} | {max(v)/min(v):.2f} | {q(v,.9)/q(v,.1):.2f} | {q(v,.75)/q(v,.25):.2f} |')
# 店の賃料は市ごとの資料がない。東京9エリアの飲食可 30,227円/坪 ÷ 区部の住宅家賃 9,980円 を店／住宅の比とみなし、市の住宅家賃に掛ける【推論】
k = 30227 / rent['東京都区部']; medr = statistics.median(rent.values()); medp = statistics.median(price.values()); medw = statistics.median(mw)
print(f'店の賃料の目安：店÷住宅 ＝ 30,227÷{rent["東京都区部"]} ＝ {k:.2f}。中央の市の店の坪単価 ＝ {medr:.0f}×{k:.2f} ＝ {medr*k:,.0f}円【推論】')
def prof(p, r33, w):  # 1日60杯・アルバイト1人8時間・17.7坪・その他20万・返済税保険8万、店主の前
    return month(60, p, r33 * k * TSUBO, 1, 8, w, 200000, 80000)
print('利益への効き（1日60杯・アルバイト1人8時間・17.7坪、他の2つは中央の値に固定）：')
for lab, f in (('値段', lambda x: prof(x, medr, medw)), ('家賃', lambda x: prof(medp, x, medw)), ('最低賃金', lambda x: prof(medp, medr, x))):
    v = {'値段': list(price.values()), '家賃': list(rent.values()), '最低賃金': mw}[lab]
    print(f'  {lab}：25%点→75%点で {(f(q(v,.75))-f(q(v,.25)))/1e4:+.1f}万円、最低→最高で {(f(max(v))-f(min(v)))/1e4:+.1f}万円')
tky = ['東京都区部', '八王子市', '立川市', '府中市']
print('東京都の4市の中華そば：', {c: price[c] for c in tky}, f'最高÷最低 {max(price[c] for c in tky)/min(price[c] for c in tky):.2f}（最低賃金は同じ1,280円）')
print(f'中華そばの81市の中央値 {medp:.0f}円（床の値に使う）')
