#!/usr/bin/env python3
"""BIZ-FILL-RAMEN の論証の検査（docs/audit/BIZ-FILL-RAMEN-reasoning.md）の検算と感度。
書き手：論証検査役（BIZ-FILL-RAMEN の書き手とも、事実の判定役とも別）。外部には取りに行かない。手元の原文だけを読む。

やること：
 A. S1「8月の超過27のうち13は休みの日の多さ、14は8月そのものの水準」の検算と、作り方を変えたときの感度
    （お盆の日の扱い・夏休みの平日・月の日数・日のばらつき・2023/2024年への当てはめ）
 B. 家計調査の「こづかい（使途不明）」の曜日の偏り（勤め先の昼食が中華そばの行に入らないことの大きさの目安）
 C. 日本フードサービス協会の月次12本：麺類の前年比と、外食全体・東京の気温の前年差の並び
 D. 地域の採算（銀座100杯・奥多摩30杯）の検算と、前提（坪単価・広さ・人数・時給・値段・持ち家・家族の労働・返済・
    店主の取り分・営業日数・原価率）を動かしたときの感度
 E. 地域の差の順「家賃3.4倍＞値段2.1倍＞最低賃金1.18倍」を、外れ値に強い物差しと利益への効き方で並べ直す
 F. 検査書の判定の列を数える
使い方: python3 -I boki2/docs/analysis/fill-ramen-reasoning-check.py
"""
import os, sys, re, datetime, statistics, subprocess, random, itertools, shutil, tempfile, zipfile, html
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
RAWM = os.path.join(ROOT, 'research', 'raw', 'web', 'bizmgmt')
RAWR = os.path.join(ROOT, 'research', 'raw', 'web', 'ramen')
TOOL = os.path.join(ROOT, 'tools', 'sheet-text.py')
AUDIT = os.path.join(ROOT, 'docs', 'audit', 'BIZ-FILL-RAMEN-reasoning.md')

def sheet_text(f):
    return subprocess.run(['python3', '-I', TOOL, f], capture_output=True, text=True).stdout

# ---------------------------------------------------------------- A. 家計の日別
HOL = {2023: {(1, 1), (1, 2), (1, 9), (2, 11), (2, 23), (3, 21), (4, 29), (5, 3), (5, 4), (5, 5), (7, 17), (8, 11), (9, 18), (9, 23), (10, 9), (11, 3), (11, 23)},
       2024: {(1, 1), (1, 8), (2, 11), (2, 12), (2, 23), (3, 20), (4, 29), (5, 3), (5, 4), (5, 5), (5, 6), (7, 15), (8, 11), (8, 12), (9, 16), (9, 22), (9, 23), (10, 14), (11, 3), (11, 4), (11, 23)},
       2025: {(1, 1), (1, 13), (2, 11), (2, 23), (2, 24), (3, 20), (4, 29), (5, 3), (5, 4), (5, 5), (5, 6), (7, 21), (8, 11), (9, 15), (9, 23), (10, 13), (11, 3), (11, 23), (11, 24)}}
NEN = {(12, 29), (12, 30), (12, 31), (1, 1), (1, 2), (1, 3)}
OBON = {(8, 13), (8, 14), (8, 15), (8, 16)}

def kind_orig(d):  # 報告と同じ
    md = (d.month, d.day)
    if md in NEN: return '年末年始'
    if md in OBON: return 'お盆'
    if md in HOL[d.year]: return '祝日'
    return {5: '土', 6: '日'}.get(d.weekday(), '平日')
def kind_obon_as_holiday(d):  # お盆を祝日と同じ型に（お盆に固有の倍率を持たせない）
    k = kind_orig(d); return '祝日' if k == 'お盆' else k
def kind_obon_as_weekday(d):  # お盆を暦の型に入れない（曜日のまま。お盆の上乗せは8月の水準に入る）
    md = (d.month, d.day)
    if md in NEN: return '年末年始'
    if md in HOL[d.year]: return '祝日'
    return {5: '土', 6: '日'}.get(d.weekday(), '平日')
def kind_summer(d):  # 夏休みの平日（7/21〜8/31、お盆を除く）を別の型に
    k = kind_orig(d)
    if k == '平日' and ((d.month == 7 and d.day >= 21) or d.month == 8): return '夏休み平日'
    return k

def ndays(y, m): return (datetime.date(y + (m == 12), m % 12 + 1, 1) - datetime.date(y, m, 1)).days
CACHE = {}
def read_month(m, item, prefix):
    f = os.path.join(RAWM, f'r6-fc-estat-kakei-hibetsu-2025{m:02d}.html')
    if f not in CACHE: CACHE[f] = sheet_text(f)
    sheet = None
    for line in CACHE[f].split('\n'):
        if line.startswith('# '): sheet = line[2:]; continue
        c = line.split('\t')
        if sheet and sheet.startswith(prefix) and len(c) > 13 and c[11].strip() == item and c[12] == '円':
            v = [float(x) for x in c[13:] if x.strip() != '']
            return v[:ndays(2025, m)], v[-1]
    raise SystemExit(f'{m}月 {item} なし')

def fit(daily, kindf, year=2025, iters=80):
    kinds = sorted({kindf(datetime.date(year, m, i + 1)) for m in daily for i in range(len(daily[m]))})
    w = {k: 1.0 for k in kinds}; lev = {}
    for _ in range(iters):
        for m in daily:
            lev[m] = sum(daily[m]) / sum(w[kindf(datetime.date(year, m, i + 1))] for i in range(len(daily[m])))
        for k in kinds:
            num = den = 0.0
            for m in daily:
                for i, x in enumerate(daily[m]):
                    if kindf(datetime.date(year, m, i + 1)) == k: num += x; den += lev[m]
            w[k] = num / den if den else 1
        s = w['平日']; w = {k: v / s for k, v in w.items()}
    return w, lev

def indices(tot, lev):
    a = statistics.mean(tot.values()); la = statistics.mean(lev.values())
    return {m: tot[m] / a * 100 for m in tot}, {m: lev[m] / la * 100 for m in lev}

print('# BIZ-FILL-RAMEN 論証の検査の検算（fill-ramen-reasoning-check.py）\n')
print('## A. 家計の8月の山の分け方（二人以上の世帯・中華そば（外食）・2025年）\n')
daily, tot = {}, {}
for m in range(1, 13): daily[m], tot[m] = read_month(m, '中華そば', '二人')
variants = [('A0 報告と同じ（お盆に固有の倍率）', kind_orig), ('A1 お盆を祝日と同じ倍率に', kind_obon_as_holiday),
            ('A2 お盆を暦の型に入れない（曜日のまま）', kind_obon_as_weekday), ('A3 夏休みの平日を別の型に', kind_summer)]
print('| 作り方 | 倍率（平日＝1） | 8月の指数（そのまま） | 8月の水準 | 暦で説明できる分 | 7月の水準 | 1月・2月の水準 |')
print('|---|---|---|---|---|---|---|')
res = {}
for name, kf in variants:
    w, lev = fit(daily, kf)
    raw, adj = indices(tot, lev)
    res[name] = (w, lev, raw, adj)
    print(f'| {name} | ' + '・'.join(f'{k}{v:.2f}' for k, v in sorted(w.items(), key=lambda x: x[0])) +
          f' | {raw[8]:.0f} | {adj[8]:.0f} | {raw[8]-adj[8]:+.0f} | {adj[7]:.0f} | {adj[1]:.0f}・{adj[2]:.0f} |')

# 8月の暦の分（A0）を、日数・ふつうの休日・お盆に割る
w, lev, raw, adj = res[variants[0][0]]
def S(m, wmap, kf, year=2025, obon_as=None):
    s = 0
    for i in range(ndays(year, m)):
        k = kf(datetime.date(year, m, i + 1))
        if k == 'お盆' and obon_as is not None: s += wmap[obon_as] if obon_as in wmap else obon_as
        else: s += wmap[k]
    return s
Sm = {m: S(m, w, kind_orig) for m in range(1, 13)}
cal = {m: Sm[m] / statistics.mean(Sm.values()) * 100 for m in Sm}
days_only = {m: ndays(2025, m) / statistics.mean(ndays(2025, x) for x in range(1, 13)) * 100 for m in range(1, 13)}
S8_no_obon = S(8, w, kind_orig, obon_as=1.0)  # お盆の4日を平日の重みにした時
print(f'\n8月の暦の係数（A0の倍率で、日の重みの合計÷12か月の平均）＝{cal[8]:.1f}。うち日数だけ（31日÷平均{statistics.mean(ndays(2025, x) for x in range(1, 13)):.2f}日）＝{days_only[8]:.1f}')
print(f'お盆の4日を平日の重みに置いた時の8月の暦の係数＝{S8_no_obon / statistics.mean(Sm.values()) * 100:.1f}')
share_obon = (Sm[8] - S8_no_obon) / (Sm[8] - statistics.mean(Sm.values())) * 100 if Sm[8] > statistics.mean(Sm.values()) else float('nan')
print(f'→ 8月の暦の上乗せ（係数−100＝{cal[8]-100:.1f}）のうち、お盆の4日の分 {(Sm[8]-S8_no_obon)/statistics.mean(Sm.values())*100:.1f}、日数の分 {days_only[8]-100:.1f}、残り（ふつうの土日祝の多さ） {cal[8]-100-(Sm[8]-S8_no_obon)/statistics.mean(Sm.values())*100-(days_only[8]-100):.1f}（足し算の近似）')
cnt = {}
for i in range(31):
    k = kind_orig(datetime.date(2025, 8, i + 1)); cnt[k] = cnt.get(k, 0) + 1
print('2025年8月の日の型の数：', cnt)

# 日のばらつき：月と型の中で日を復元抽出して当てはめ直す（1000回）
random.seed(20261022)
def boot(kf, B=400):
    out8, outd = [], []
    cells = {}
    for m in daily:
        for i, x in enumerate(daily[m]):
            cells.setdefault((m, kf(datetime.date(2025, m, i + 1))), []).append(i)
    for _ in range(B):
        d2 = {m: list(daily[m]) for m in daily}
        for (m, k), idx in cells.items():
            pick = [daily[m][random.choice(idx)] for _ in idx]
            for j, i in enumerate(idx): d2[m][i] = pick[j]
        t2 = {m: sum(d2[m]) for m in d2}
        w2, l2 = fit(d2, kf, iters=30)
        r2, a2 = indices(t2, l2)
        out8.append(a2[8]); outd.append(r2[8] - a2[8])
    out8.sort(); outd.sort()
    return out8[int(B * .025)], out8[int(B * .975)], outd[int(B * .025)], outd[int(B * .975)]
b = boot(kind_orig)
print(f'\n日の復元抽出（400回、月×型の中で）：8月の水準の95%の幅 {b[0]:.0f}〜{b[1]:.0f}、暦で説明できる分の95%の幅 {b[2]:+.0f}〜{b[3]:+.0f}')

# 2023・2024年への当てはめ（2025年の倍率と2025年の月の水準をそのまま使い、各年の暦だけを入れ替える）
GD = {2023: [665, 553, 637, 603, 702, 594, 649, 757, 650, 686, 727, 657], 2024: [731, 646, 738, 646, 725, 673, 704, 877, 713, 742, 751, 717]}
# 出典：r5-rmn-gdfreak-chukasoba1（総務省 家計調査の月次の転記、二人以上の世帯）。12月までそろうのは2023・2024年
print('\n2025年の倍率と水準を、2023・2024年の暦に当てはめた8月の指数（予測）と実際：')
la = statistics.mean(lev.values())
for y, vals in GD.items():
    pred = {m: lev[m] * S(m, w, kind_orig, year=y) for m in range(1, 13)}
    pa = statistics.mean(pred.values()); act = statistics.mean(vals)
    c = {}
    for i in range(31):
        k = kind_orig(datetime.date(y, 8, i + 1)); c[k] = c.get(k, 0) + 1
    print(f'  {y}年：予測 {pred[8]/pa*100:.0f}・実際 {vals[7]/act*100:.0f}（8月の日の型 {c}）。7月 予測 {pred[7]/pa*100:.0f}・実際 {vals[6]/act*100:.0f}。12月 予測 {pred[12]/pa*100:.0f}・実際 {vals[11]/act*100:.0f}')

# 趨勢（値上げ・伸び）を除く：2×12か月の中心移動平均に対する比（2023年1月〜2025年12月。2025年12月は家計の日別の計800円）
ser = GD[2023] + GD[2024] + [tot[m] for m in range(1, 13)]
print('\n趨勢を除いた月の比（中心移動平均＝100。2023年7月〜2025年6月の2年）：')
ratios = {}
for i in range(6, len(ser) - 6):
    ma = (sum(ser[i - 6:i + 6]) + sum(ser[i - 5:i + 7])) / 24
    ratios.setdefault(i % 12 + 1, []).append(ser[i] / ma * 100)
print('  ' + '・'.join(f'{m}月 ' + '/'.join(f'{v:.0f}' for v in ratios[m]) for m in range(1, 13)))
yoy = [tot[m] / GD[2024][m - 1] * 100 - 100 for m in range(1, 13)]
print('  2025年の前年同月比（%）：' + '・'.join(f'{m}月{v:+.0f}' for m, v in zip(range(1, 13), yoy)) + f'。平均 {statistics.mean(yoy):+.1f}%')

# ---------------------------------------------------------------- B. こづかい
print('\n## B. 家計の「こづかい（使途不明）」と中華そばの、平日と土日の比（2025年12か月の日の平均）\n')
print('| 世帯 | 品目 | 平日の日の平均（円） | 土日の日の平均（円） | 土日÷平日 |')
print('|---|---|---|---|---|')
for prefix, lab in (('二人', '二人以上'), ('勤労', '勤労者')):
    for item in ('中華そば', '外食', 'こづかい(使途不明)', '世帯主こづかい'):
        wd, we = [], []
        for m in range(1, 13):
            v, _ = read_month(m, item, prefix)
            for i, x in enumerate(v):
                k = kind_orig(datetime.date(2025, m, i + 1))
                if k == '平日': wd.append(x)
                elif k in ('土', '日'): we.append(x)
        print(f'| {lab} | {item} | {statistics.mean(wd):.1f} | {statistics.mean(we):.1f} | {statistics.mean(we)/statistics.mean(wd):.2f} |')

# ---------------------------------------------------------------- C. 業界団体の月次
print('\n## C. 日本フードサービス協会の月次：FF「麺類」と外食全体の前年比、東京の気温・雨・休日の前年差\n')
print('| 月 | 外食全体 | FF 全体 | FF 麺類 | 麺類−FF全体 | 東京の平均気温の前年差 | 東京の雨天日の前年差 | 休日の前年差 | 麺類の説明の文（抜き書き） |')
print('|---|---|---|---|---|---|---|---|---|')
rows = []
for ym in ['202508', '202509', '202510', '202511', '202512', '202601', '202602', '202603', '202604', '202605', '202606', '202608']:
    f = os.path.join(RAWR, f'r6-fill-jf-{ym}.pdf')
    t = subprocess.run(['pdftotext', '-layout', f, '-'], capture_output=True, text=True).stdout
    flat = re.sub(r'\s+', '', t)
    mm = re.search(r'「麺類」は、(.*?)(\d{2,3}\.\d)[％%]', flat)
    ov = re.search(r'＜全体概況＞.*?(\d{2,3}\.\d)[％%]', flat)
    ff = re.search(r'FF(?:は、|の)全体売上(?:は)?(\d{2,3}\.\d)[％%]', flat)
    wl = [l for l in t.split('\n') if re.search(r'\d{4}年\s+\d+月\s+\d+日', l)]
    def nums(l): return re.findall(r'(\d+(?:\.\d)?)', l.split('月', 1)[1])
    prev, cur = nums(wl[0]), nums(wl[1])
    dT = float(cur[3]) - float(prev[3]); dR = int(cur[2]) - int(prev[2]); dH = int(cur[0]) - int(prev[0])
    men = float(mm.group(2)); allv = float(ov.group(1)); ffv = float(ff.group(1))
    rows.append((ym, allv, men, dT, ffv))
    print(f'| {ym[:4]}年{int(ym[4:])}月 | {allv:.1f} | {ffv:.1f} | {men:.1f} | {men-ffv:+.1f} | {dT:+.1f} | {dR:+d} | {dH:+d} | {mm.group(1)[:38]} |')
xs = [r[3] for r in rows]; ys = [r[2] - r[4] for r in rows]
mx, my = statistics.mean(xs), statistics.mean(ys)
cov = sum((a - mx) * (b - my) for a, b in zip(xs, ys)); vx = sum((a - mx) ** 2 for a in xs); vy = sum((b - my) ** 2 for b in ys)
print(f'\n12か月の「麺類−FF全体」と「東京の気温の前年差」の相関 r = {cov/(vx*vy)**0.5:.2f}（12点。因果は言えない。向きの目安だけ）')

# ---------------------------------------------------------------- D. 地域の採算
print('\n## D. 地域の採算の検算と感度\n')
def month(cups, price, rent, staff_n, hours, wage, other, debt, days=25, cost=0.30, owner=0):
    labor = staff_n * hours * days * wage
    return cups * days * price * (1 - cost) - (rent + labor + other + debt + owner)
def be(price, rent, staff_n, hours, wage, other, debt, days=25, cost=0.30, owner=0):
    return (rent + staff_n * hours * days * wage + other + debt + owner) / (days * price * (1 - cost))
print('報告の6行の再計算（店主0円の分岐・店主30万円の分岐・100杯・30杯）：')
cases = [('銀座617', 617, 424970, 3, 8, 1280, 250000, 80000), ('銀座1000', 1000, 424970, 3, 8, 1280, 250000, 80000),
         ('銀座1300', 1300, 424970, 3, 8, 1280, 250000, 80000), ('都心中央', 1000, 302270, 2, 8, 1280, 200000, 80000),
         ('奥多摩', 890, 60000, 1, 6, 1280, 200000, 80000)]
for n, p, r, s, h, wg, o, d in cases:
    print(f'  {n}: {be(p,r,s,h,wg,o,d):.0f}杯・{be(p,r,s,h,wg,o,d,owner=300000):.0f}杯・100杯{month(100,p,r,s,h,wg,o,d)/1e4:+.1f}万・30杯{month(30,p,r,s,h,wg,o,d)/1e4:+.1f}万')
print('  元店主の型: 店主0円の分岐', round((0 + 100000 + 400000 + 80000) / (25 * 1000 * 0.7)), '杯（報告の33杯と同じ）')

print('\n### D1. 銀座で1日100杯、店主の取り分を引いた後に赤字になる組み合わせの割合')
grid = list(itertools.product([36250, 42497, 85000], [8, 10, 15], [2, 3, 4], [1280, 1280 * 1.15, 1500 * 1.15], [617, 1000, 1300, 1500], [0.30, 0.35], [0, 300000]))
# 坪単価：アットホームの銀座36,250・飲食店ドットコムの銀座駅の募集42,497・路面の一等地を倍と置く85,000【検査役の仮定】
# 時給：最低賃金・社会保険と通勤費で15%増し・1,500円の15%増し【検査役の仮定】。その他25万・返済8万・25日・8時間は報告のまま
red = [g for g in grid if month(100, g[4], g[0] * g[1], g[2], 8, g[3], 250000, 80000, cost=g[5], owner=g[6]) < 0]
print(f'  全 {len(grid)} 通りのうち赤字 {len(red)}（{len(red)/len(grid)*100:.0f}%）')
for p in [617, 1000, 1300, 1500]:
    for own in [0, 300000]:
        sub = [g for g in grid if g[4] == p and g[6] == own]
        rr = [g for g in sub if month(100, g[4], g[0] * g[1], g[2], 8, g[3], 250000, 80000, cost=g[5], owner=g[6]) < 0]
        print(f'  値段{p}円・店主の取り分{own//10000}万円：{len(rr)}/{len(sub)}（{len(rr)/len(sub)*100:.0f}%）が赤字')
print('  1杯の値段を1,000〜1,500円、店主の取り分30万円に限ると：', end='')
sub = [g for g in grid if g[4] >= 1000 and g[6] == 300000]
rr = [g for g in sub if month(100, g[4], g[0] * g[1], g[2], 8, g[3], 250000, 80000, cost=g[5], owner=g[6]) < 0]
print(f'{len(rr)}/{len(sub)}（{len(rr)/len(sub)*100:.0f}%）が赤字')

print('\n### D2. 奥多摩で1日30杯、店主の取り分を引いた後に黒字（採算）になる組み合わせの割合')
grid2 = list(itertools.product([0, 30000, 60000, 100000], [0, 1], [890, 1000, 1100], [100000, 150000, 200000], [0, 80000], [0, 150000, 300000], [25, 20], [0.30, 0.35]))
# 家賃0＝持ち家、人0＝家族の労働（店主＋家族）、1＝アルバイト1人6時間。その他（光熱・消耗品）10〜20万、返済0か8万【検査役の仮定】
ok = [g for g in grid2 if month(30, g[2], g[0], g[1], 6, 1280, g[3], g[4], days=g[6], cost=g[7], owner=g[5]) >= 0]
print(f'  全 {len(grid2)} 通りのうち黒字 {len(ok)}（{len(ok)/len(grid2)*100:.0f}%）')
for own in [0, 150000, 300000]:
    for st in [0, 1]:
        sub = [g for g in grid2 if g[5] == own and g[1] == st]
        oo = [g for g in sub if month(30, g[2], g[0], g[1], 6, 1280, g[3], g[4], days=g[6], cost=g[7], owner=g[5]) >= 0]
        print(f'  店主の取り分{own//10000}万円・アルバイト{st}人：{len(oo)}/{len(sub)}（{len(oo)/len(sub)*100:.0f}%）が黒字')
print(f'  報告の奥多摩の行からアルバイトだけを外す（家族の労働）：30杯で {month(30, 890, 60000, 0, 6, 1280, 200000, 80000)/1e4:+.1f}万円、店主0円の分岐 {be(890, 60000, 0, 6, 1280, 200000, 80000):.1f}杯')
print(f'  さらに持ち家・返済なし：30杯で {month(30, 890, 0, 0, 6, 1280, 200000, 0)/1e4:+.1f}万円（店主の取り分の前）')
print(f'  元店主の型（八戸、地方は1日40人が現実的と原文）で30杯：{(30*25*1000*0.7 - 580000)/1e4:+.1f}万円（店主の取り分の前、税・保険・返済を引いた後）')

print('\n### D3. 「黒字の線は33〜169杯（5倍）」のうち、立地で決まる分と人の数・値段（店の選択）で決まる分')
base = dict(other=200000, debt=80000)
print(f'  人の数と値段をそろえる（2人×8時間・1杯1,000円）：銀座の家賃 {be(1000, 424970, 2, 8, 1280, **base):.0f}杯・都心中央 {be(1000, 302270, 2, 8, 1280, **base):.0f}杯・奥多摩6万 {be(1000, 60000, 2, 8, 1280, **base):.0f}杯 → 倍率 {be(1000, 424970, 2, 8, 1280, **base)/be(1000, 60000, 2, 8, 1280, **base):.2f}')
print(f'  人0（家族）・1,000円でそろえる：銀座 {be(1000, 424970, 0, 8, 1280, **base):.0f}杯・奥多摩 {be(1000, 60000, 0, 8, 1280, **base):.0f}杯 → 倍率 {be(1000, 424970, 0, 8, 1280, **base)/be(1000, 60000, 0, 8, 1280, **base):.2f}')
print(f'  報告の両端（銀座617円・3人／元店主の型）：169÷33＝{169/33:.1f}倍、141÷33＝{141/33:.1f}倍')
print(f'  銀座の行を3人→1人6時間にすると（617円）：{be(617, 424970, 1, 6, 1280, 250000, 80000):.0f}杯、3人のまま1,300円：{be(1300, 424970, 3, 8, 1280, 250000, 80000):.0f}杯')

print('\n### D4. 1つずつ動かす（報告の銀座1,000円の行、100杯、店主の取り分の前の月の残り）')
b0 = month(100, 1000, 424970, 3, 8, 1280, 250000, 80000)
print(f'  基準 {b0/1e4:+.1f}万円')
for lab, kw in [('坪単価を倍（85,000円）', dict(rent=850000)), ('坪単価をアットホームの銀座36,250円', dict(rent=362500)),
                ('15坪', dict(rent=42497 * 15)), ('人を2人', dict(staff_n=2)), ('人を4人', dict(staff_n=4)),
                ('時給を1,500円×1.15', dict(wage=1500 * 1.15)), ('値段1,300円', dict(price=1300)), ('値段800円', dict(price=800)),
                ('原価率35%', dict(cost=0.35)), ('営業日数22日', dict(days=22))]:
    a = dict(cups=100, price=1000, rent=424970, staff_n=3, hours=8, wage=1280, other=250000, debt=80000); a.update(kw)
    print(f'  {lab}：{month(**a)/1e4:+.1f}万円（基準との差 {(month(**a)-b0)/1e4:+.1f}万円）')

# ---------------------------------------------------------------- E. 地域の差の順
print('\n## E. 地域の差の物差しを変える\n')
def xl_row(f, key):
    import openpyxl
    tmp = tempfile.mkdtemp(); q = os.path.join(tmp, 'a.xlsx'); shutil.copy(f, q)
    ws = openpyxl.load_workbook(q, read_only=True).worksheets[0]
    rows_ = list(ws.iter_rows(values_only=True))
    hdr = [r for r in rows_ if r and any(str(x) == '札幌市' for x in r)][0]
    r = [r for r in rows_ if r and any(str(x).startswith(key) for x in r if x)][0]
    i = [str(x) for x in hdr].index('札幌市')
    shutil.rmtree(tmp, ignore_errors=True)
    return {hdr[j]: r[j] for j in range(i, len(hdr)) if hdr[j] and isinstance(r[j], (int, float))}
price = xl_row(os.path.join(RAWR, 'r6-fill-kouri-toshi-b0011-202607.html'), '中華そば(外食)')
rent = xl_row(os.path.join(RAWR, 'r6-fill-kouri-toshi-b0012-202607.html'), '民営家賃')
mw_t = subprocess.run(['pdftotext', '-layout', os.path.join(RAWR, 'r6-fill-mhlw-minwage-r8.pdf'), '-'], capture_output=True, text=True).stdout
mw = [int(x.replace(',', '')) for x in re.findall(r'^\s*\S.*?\s(1,\d{3})\s+（', mw_t, re.M)][:47]
def q(v, p):
    v = sorted(v); k = (len(v) - 1) * p; f = int(k); c = min(f + 1, len(v) - 1); return v[f] + (v[c] - v[f]) * (k - f)
print('| 値 | 数 | 最高÷最低 | 90%点÷10%点 | 75%点÷25%点 | 変動係数 |')
print('|---|---|---|---|---|---|')
for lab, v in (('中華そば1杯（81市）', list(price.values())), ('民営家賃（81市）', list(rent.values())), ('最低賃金（47都道府県）', mw)):
    print(f'| {lab} | {len(v)} | {max(v)/min(v):.2f} | {q(v,.9)/q(v,.1):.2f} | {q(v,.75)/q(v,.25):.2f} | {statistics.pstdev(v)/statistics.mean(v):.3f} |')
# 利益への効き方：1日60杯・2人8時間・10坪・その他20万・返済8万、店の賃料の中央を坪1.5万円と置き、住宅の家賃の比で動かす【検査役の仮定】
med_rent = statistics.median(rent.values()); med_p = statistics.median(price.values()); med_w = statistics.median(mw)
def prof(p, rent_ratio, wage):
    return month(60, p, 15000 * 10 * rent_ratio, 2, 8, wage, 200000, 80000)
print('\n利益への効き方（1日60杯・2人8時間・10坪、店の賃料の中央を坪1.5万円と置き住宅の家賃の比で動かす【検査役の仮定】）：25%点→75%点に動かした時の月の残りの差')
for lab, lo, hi in (('値段', prof(q(list(price.values()), .25), 1, med_w), prof(q(list(price.values()), .75), 1, med_w)),
                    ('家賃', prof(med_p, q(list(rent.values()), .25) / med_rent, med_w), prof(med_p, q(list(rent.values()), .75) / med_rent, med_w)),
                    ('最低賃金', prof(med_p, 1, q(mw, .25)), prof(med_p, 1, q(mw, .75)))):
    print(f'  {lab}：{(hi-lo)/1e4:+.1f}万円')
print('同じく最低→最高に動かした時：')
for lab, lo, hi in (('値段', prof(min(price.values()), 1, med_w), prof(max(price.values()), 1, med_w)),
                    ('家賃', prof(med_p, min(rent.values()) / med_rent, med_w), prof(med_p, max(rent.values()) / med_rent, med_w)),
                    ('最低賃金', prof(med_p, 1, min(mw)), prof(med_p, 1, max(mw)))):
    print(f'  {lab}：{(hi-lo)/1e4:+.1f}万円')
tky = ['東京都区部', '八王子市', '立川市', '府中市']
print('都の中の4市の中華そば：', {c: price[c] for c in tky}, '最高÷最低', round(max(price[c] for c in tky) / min(price[c] for c in tky), 2), '（最低賃金は同じ1,280円）')

# 上位30項目の仕分けを、報告自身の判定の語の定義（支持・修正＝向きと大きさを資料が支える／一部＝範囲の違う資料だけ、または向きだけ）で数え直す
# 左＝報告の判定、右＝検査役の付け直し（理由は検査書の3章・4章）。「未探索」は報告が「探しに行っていない／作業をしていない」と書いた行
RECOUNT = {
 'S1': ('修正', '修正'), 'L1': ('埋まらず', '埋まらず'), 'M3': ('埋まらず', '埋まらず'), 'S4': ('支持', '一部'), 'M1': ('一部', '埋まらず'),
 'S5': ('修正', '一部'), 'L2': ('埋まらず', '埋まらず'), 'L3': ('埋まらず', '埋まらず'), 'M2': ('修正', '埋まらず'), 'S3': ('支持', '一部'),
 'M4': ('埋まらず', '埋まらず'), 'S6': ('一部', '一部'), 'M15': ('埋まらず', '埋まらず'), 'M10': ('支持', '一部'), 'M11': ('埋まらず', '埋まらず'),
 'M13': ('否定', '埋まらず'), 'M5': ('埋まらず', '埋まらず'), 'M6': ('埋まらず', '埋まらず'), 'R1': ('埋まらず', '埋まらず'), 'R3': ('埋まらず', '埋まらず'),
 'L4': ('修正', '一部'), 'M18': ('埋まらず', '埋まらず'), 'R2': ('一部', '一部'), 'M12': ('埋まらず', '埋まらず'), 'M7': ('埋まらず', '埋まらず'),
 'M16': ('埋まらず', '埋まらず（未探索）'), 'R4': ('埋まらず', '埋まらず（未探索）'), 'M17': ('埋まらず', '埋まらず（未探索）'), 'M8': ('埋まらず', '埋まらず（未探索）'), 'R17': ('一部', '一部')}
from collections import Counter as _C
print('\n上位30項目の仕分けの数え直し：')
print('  報告の判定：', dict(_C(a for a, _ in RECOUNT.values())), '計', len(RECOUNT))
print('  検査役の付け直し：', dict(_C(b for _, b in RECOUNT.values())), '計', len(RECOUNT))
print('  判定が変わった項目：', [k for k, (a, b) in RECOUNT.items() if a != b.replace('（未探索）', '')])
filled = sum(1 for a, _ in RECOUNT.values() if a in ('支持', '修正', '否定')); filled2 = sum(1 for _, b in RECOUNT.values() if b in ('支持', '修正', '否定'))
print(f'  「一次・研究・実務者・事例で埋まった（支持・修正・否定）」：報告 {filled} → 付け直し {filled2}')

# 報告4章（上位30の外）で「探していない」と書かれた項目の数（1行に複数の項目があるものは「・」で分ける）
REP = os.path.join(ROOT, 'docs', 'BIZ-FILL-RAMEN.md')
rs = open(REP, encoding='utf8').read()
sec4 = rs.split('## 4. 上位30の外の項目', 1)[1].split('判定書から足した項目', 1)[0]
n_items = n_not = n_not5 = 0
for l in sec4.split('\n'):
    c = [x.strip() for x in l.strip().strip('|').split('|')]
    if len(c) == 3 and re.match(r'^[MR]\d', c[0]):
        items = [x for x in re.split(r'[・\s]', c[0]) if re.match(r'^[MR]\d+$', x)]
        n_items += len(items)
        if '探していない' in c[2]:
            n_not += len(items)
            if c[1].isdigit() and int(c[1]) >= 5: n_not5 += len(items)
print(f'\n報告4章：項目 {n_items}、「探していない」と書いた項目 {n_not}、うち点5以上 {n_not5}。上位30の未探索4と合わせ点5以上の未探索 {n_not5 + 4}')

# ---------------------------------------------------------------- F. 判定の数
print('\n## F. 検査書の判定の数\n')
if os.path.exists(AUDIT):
    s = open(AUDIT, encoding='utf8').read()
    sec = s.split('## 3. 結論ごとの検査', 1)[1].split('\n## 4.', 1)[0] if '## 3. 結論ごとの検査' in s else ''
    vs = []
    for l in sec.split('\n'):
        if re.match(r'^\| K\d+', l):
            c = [x.strip() for x in l.strip().strip('|').split('|')]
            vs.append((c[0], c[-2]))
    from collections import Counter
    cc = Counter(v for _, v in vs)
    print(f'結論の行 {len(vs)}：', dict(cc), '／計', sum(cc.values()))
    bad = [k for k, v in vs if v not in ('妥当', '弱い', '不当')]
    print('判定の語が3つ以外の行：', bad or 'なし')
else:
    print('検査書がまだない')
