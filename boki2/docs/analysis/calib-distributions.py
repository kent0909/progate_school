#!/usr/bin/env python3
# BIZ-CALIB 0.2 の分布・年ごとの振れ・割合をすべてここで計算する（QUALITY 6.2-2：数えるのは道具で）。
# 使い方：python3 -I boki2/docs/analysis/calib-distributions.py > boki2/docs/analysis/calib-distributions.md
# 原文は boki2/research/raw/（git に入れない）。原文がないときはその節を「原文なし」と出して止まらない。
import csv, io, json, math, os, re, statistics as st, subprocess, sys, unicodedata

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'research', 'raw')
def raw(*p): return os.path.join(ROOT, *p)
def pdftext(f): return subprocess.run(['pdftotext', '-layout', f, '-'], capture_output=True, text=True).stdout
def norm(s): return unicodedata.normalize('NFKC', s)
out = []
def p(*a): out.append(' '.join(str(x) for x in a))

# ---------- 1. 公庫「小企業の経営指標調査」の表を読む ----------
def parse_jfc(f):
    txt = pdftext(f); recs = []
    for page in txt.split('\f'):
        lines = page.split('\n'); kind = None
        for i, l in enumerate(lines):
            if '業種別経営指標' in l and '…' not in l: kind, hi = 'ind', i; break
            if '従業者規模別経営指標' in l and '…' not in l: kind, hi = 'size', i; break
        if not kind: continue
        rec = {'kind': kind, 'name': lines[hi + 1].strip(), 'rows': {}}
        m = re.search(r'調査対象数\s+(\d+)\s+黒字かつ自己資本プラス企業数\s+(\d+)', page)
        if kind == 'ind' and m: rec['n'] = int(m.group(1)); rec['n_good'] = int(m.group(2))
        if kind == 'size': rec['n'] = [int(x) for x in re.findall(r'調査対象数\s+(\d+)', page)]
        for l in lines:
            mm = re.match(r'\s*(\S+?)\s*[（(]([^)）]+)[)）]\s+(.*)$', l)
            if not mm: continue
            vals = re.findall(r'-?[\d,]+\.\d+|-?[\d,]+|(?<!\S)-(?!\S)', mm.group(3))
            if len(vals) < 4: continue
            rec['rows'][mm.group(1)] = [None if v == '-' else float(v.replace(',', '')) for v in vals]
        recs.append(rec)
    return recs

IND = [('売上高営業利益率', '営業利益率%'), ('売上高総利益率', '総利益率%'), ('人件費対売上高比率', '人件費率%'),
       ('諸経費対売上高比率', '諸経費率%'), ('損益分岐点比率', '損益分岐点比率%'), ('店舗面積3.3㎡当たり売上高', '3.3㎡売上 千円/年'),
       ('１企業当たり店舗面積', '面積㎡'), ('借入金回転期間', '借入金 月商の月数'), ('自己資本比率', '自己資本比率%'),
       ('従業者１人当たり売上高', '1人あたり売上 千円'), ('従業者１人当たり人件費', '1人あたり人件費 千円')]
FILES = {'2025年度': ('bizmgmt', 'r4-calib-jfc-shihyou-08a.pdf', 'r4-calib-jfc-shihyou-07a.pdf'),
         '2019年度': ('bizmgmt', 'r5-cal-jfc-shihyou-202008-08a.pdf', 'r5-cal-jfc-shihyou-202008-07a.pdf')}
J = {}
for y, (c, f8, f7) in FILES.items():
    if not (os.path.exists(raw('web', c, f8)) and os.path.exists(raw('web', c, f7))): p(f'## {y}：原文なし'); continue
    J[y] = parse_jfc(raw('web', c, f8)) + parse_jfc(raw('web', c, f7))
def get(y, kind, name):
    for r in J.get(y, []):
        if r['kind'] == kind and r['name'] == name: return r

p('# BIZ-CALIB 0.2 の計算の結果（calib-distributions.py の出力。手で書き換えない）\n')
p('## 1. 公庫の表：業種別の平均と標準偏差（店ごとのばらつき）\n')
p('列は「平均（標準偏差）」。信頼限界は母平均の90%の区間で、店の幅ではないので載せない。\n')
for name in ['中華料理店', '一般飲食店', '食堂，レストラン', '喫茶店', 'パン小売業（製造小売）', '飲食店，宿泊業']:
    p(f'### {name}')
    p('| 指標 | ' + ' | '.join(f'{y}' for y in J) + ' | 平均の年の差 |'); p('|---|' + '---|' * (len(J) + 1))
    recs = {y: get(y, 'ind', name) for y in J}
    p('| 調査対象数（黒字かつ自己資本プラス） | ' + ' | '.join(f"{r.get('n')}（{r.get('n_good')}）" if r else '—' for r in recs.values()) + ' | |')
    for k, lab in IND:
        cells = []; means = []
        for y, r in recs.items():
            v = r and r['rows'].get(k)
            if v and v[0] is not None: cells.append(f'{v[0]:g}（{v[5]:g}）'); means.append(v[0])
            else: cells.append('—')
        d = f'{means[0] - means[1]:+.1f}' if len(means) == 2 else ''
        p(f'| {lab} | ' + ' | '.join(cells) + f' | {d} |')
    p('')

p('## 2. 公庫の表：従業者規模別の平均±標準偏差\n')
p('規模の段は表の印字のまま（飲食の表は最上段を「21〜49人」と印字。調査の説明は「20〜49人」）。\n')
for name in ['中華料理店', '一般飲食店', '食堂，レストラン', '飲食店，宿泊業', '菓子・パン小売業']:
    for y in J:
        r = get(y, 'size', name)
        if not r: p(f'- {name}（{y}）：規模別の表なし'); continue
        p(f'### {name}（{y}、調査対象数 {r["n"]}）')
        p('| 指標 | 1〜4人 | 5〜9人 | 10〜19人 | 20(21)〜49人 | 標準偏差の比（最小の段÷最大の段） |'); p('|---|---|---|---|---|---|')
        for k, lab in IND:
            v = r['rows'].get(k)
            if not v or v[0] is None: continue
            sds = [v[i + 1] for i in range(0, 8, 2)]
            ratio = f'{sds[0] / sds[3]:.1f}' if sds[3] else ''
            p(f'| {lab} | ' + ' | '.join(f'{v[i]:g}±{v[i + 1]:g}' for i in range(0, 8, 2)) + f' | {ratio} |')
        p('')

p('## 3. 上位と下位の店（正規分布とみた【推論】）\n')
p('平均±1標準偏差は、分布が正規分布なら上下それぞれ約16%の店の境目。公庫の表は分布の形を示していないので、この行は (b)【推論】。\n')
p('| 業種・規模（年度） | 営業利益率 平均 | 上位約16%の境（平均+1SD） | 下位約16%の境（平均−1SD） | 赤字の店の割合（正規分布とみた計算） | 損益分岐点比率 平均+1SD |')
p('|---|---|---|---|---|---|')
def phi(z): return 0.5 * (1 + math.erf(z / math.sqrt(2)))
for y in J:
    for name, kind, idx in [('中華料理店', 'ind', None), ('中華料理店', 'size', 0), ('中華料理店', 'size', 3), ('一般飲食店', 'ind', None), ('一般飲食店', 'size', 0), ('一般飲食店', 'size', 3)]:
        r = get(y, kind, name)
        if not r: continue
        v = r['rows']['売上高営業利益率']; b = r['rows']['損益分岐点比率']
        if kind == 'ind': m, s, bm, bs, lab = v[0], v[5], b[0], b[5], '全体'
        else: m, s, bm, bs, lab = v[idx * 2], v[idx * 2 + 1], b[idx * 2], b[idx * 2 + 1], ['1〜4人', '', '', '20(21)〜49人'][idx]
        p(f'| {name} {lab}（{y}） | {m:g}% | {m + s:+.1f}% | {m - s:+.1f}% | {phi((0 - m) / s) * 100:.0f}% | {bm + bs:.1f}% |')
p('')

p('## 4. 1店の月商の推計（平均の積。【推論】(b)）\n')
p('月商 ≒ 1企業当たり店舗面積（㎡）÷3.3 × 3.3㎡当たり年売上（千円）÷12。平均どうしの積なので店ごとの月商の平均とは一致しない。\n')
p('| 業種・規模（年度） | 面積㎡ | 3.3㎡売上 千円/年 | 推計の月商 万円 |'); p('|---|---|---|---|')
for y in J:
    for name in ['中華料理店', '一般飲食店']:
        r = get(y, 'size', name)
        if not r: continue
        a = r['rows']['１企業当たり店舗面積']; s = r['rows']['店舗面積3.3㎡当たり売上高']
        for i, lab in enumerate(['1〜4人', '5〜9人', '10〜19人', '20(21)〜49人']):
            mon = a[i * 2] / 3.3 * s[i * 2] / 12 / 10
            p(f'| {name} {lab}（{y}） | {a[i * 2]:g} | {s[i * 2]:g} | {mon:.0f} |')
p('')

# ---------- 5. 消費者物価の品目別 前年比（2006〜2025年） ----------
p('## 5. 消費者物価 品目別の前年比（2006〜2025年の20年）\n')
f = raw('web', 'bizmgmt', 'r5-cal-estat-cpi-item-yoy.html')
if os.path.exists(f):
    rows = list(csv.reader(io.StringIO(open(f, 'rb').read().decode('cp932'))))
    hdr = rows[0]
    items = ['総合', '食料', '外食', '中華そば（外食）', '中華麺', '小麦粉', '豚肉（国産品）', '鶏肉', '卵', 'ねぎ', 'もやし', '食用油', 'しょう油', '電気代', '都市ガス代', 'プロパンガス', '水道料']
    col = {it: hdr.index(it) for it in items if it in hdr}
    data = {int(r[0].strip()): r for r in rows if r and r[0].strip().isdigit()}
    yrs = list(range(2006, 2026))
    p('| 品目 | 平均 | 標準偏差 | 最大（年） | 最小（年） | 上がった年 | ' + ' | '.join(str(y) for y in yrs[-6:]) + ' |')
    p('|---|---|---|---|---|---|' + '---|' * 6)
    for it, j in col.items():
        v = [(float(data[y][j]), y) for y in yrs if data[y][j].strip() not in ('', '-')]
        xs = [a for a, _ in v]; mx = max(v); mn = min(v)
        last = {y: a for a, y in v}
        p(f'| {it} | {st.mean(xs):+.2f} | {st.stdev(xs):.2f} | {mx[0]:+}（{mx[1]}） | {mn[0]:+}（{mn[1]}） | {sum(1 for a in xs if a > 0)}/{len(xs)} | ' + ' | '.join(f"{last.get(y, float('nan')):+.1f}" for y in yrs[-6:]) + ' |')
    p('')
    p('全20年の各年（前年比%）：')
    p('| 年 | ' + ' | '.join(col) + ' |'); p('|---|' + '---|' * len(col))
    for y in yrs: p(f'| {y} | ' + ' | '.join(data[y][j].strip() for j in col.values()) + ' |')
    p('')
else: p('原文なし\n')

# ---------- 6. 日銀 貸出約定平均金利（年平均） ----------
p('## 6. 貸出約定平均金利（国内銀行、月次の年平均）\n')
f = raw('web', 'bizmgmt', 'r5-cal-boj-ir04.html')
if os.path.exists(f):
    b = open(f, 'rb').read()
    try: t = b.decode('utf-8')
    except UnicodeDecodeError: t = b.decode('shift_jis', 'replace')
    rs = [[re.sub(r'<[^>]+>', '', c).strip() for c in re.findall(r'<t[dh][^>]*>([\s\S]*?)</t[dh]>', r)] for r in re.findall(r'<tr[\s\S]*?</tr>', t)]
    hdr = rs[1][1:]; byy = {}
    for r in rs:
        if r and re.match(r'\d{4}/\d\d$', r[0]): byy.setdefault(int(r[0][:4]), []).append([float(x) if x else None for x in r[1:]])
    p('| 年 | ' + ' | '.join(hdr) + ' | 月数 |'); p('|---|' + '---|' * (len(hdr) + 1))
    prev = None; diffs = []
    for y in sorted(byy):
        if y < 2006: continue
        m = [st.mean([v for v in c if v is not None]) for c in zip(*byy[y])]
        if prev: diffs.append((round(m[1] - prev[1], 3), y))
        prev = m
        p(f'| {y} | ' + ' | '.join(f'{x:.3f}' for x in m) + f' | {len(byy[y])} |')
    p(f'\n新規・長期の前年差：最大 {max(diffs)}、最小 {min(diffs)}（ポイント、（差, 年））\n')
else: p('原文なし\n')

# ---------- 7. 最低賃金（全国加重平均）の前年比 ----------
p('## 7. 地域別最低賃金（全国加重平均）の前年比\n')
mw = {2007: 687, 2008: 703, 2009: 713, 2010: 730, 2011: 737, 2012: 749, 2013: 764, 2014: 780, 2015: 798, 2016: 823,
      2017: 848, 2018: 874, 2019: 901, 2020: 902, 2021: 930, 2022: 961, 2023: 1004, 2024: 1055, 2025: 1121, 2026: 1177}
p('出所：2007〜2016年度 r5-cal-mhlw-minwage-trend、2016〜2025年度 r5-cal-mhlw-minwage-2025、2026年度 r4-mgmt-mhlw-minwage（全国加重平均1,177円）。下の照合で原文に数字があるかを確かめる。\n')
chk = []
for d, ys in [('r5-cal-mhlw-minwage-trend.pdf', range(2007, 2017)), ('r5-cal-mhlw-minwage-2025.pdf', range(2016, 2026))]:
    f = raw('law', 'primary', d)
    if os.path.exists(f):
        t = norm(re.sub(r'\s+', '', pdftext(f)))
        for y in ys:
            if str(mw[y]) not in t.replace(',', ''): chk.append(f'{y}:{mw[y]} が {d} に見つからない')
p('原文との照合：' + ('すべて見つかった' if not chk else '; '.join(chk)) + '\n')
r = [((mw[y] / mw[y - 1] - 1) * 100, y) for y in range(2008, 2027)]
xs = [a for a, _ in r]
p('| 年度 | ' + ' | '.join(str(y) for _, y in r) + ' |'); p('|---|' + '---|' * len(r))
p('| 前年比% | ' + ' | '.join(f'{a:.1f}' for a, _ in r) + ' |')
p(f'\n19年の平均 {st.mean(xs):.2f}%、標準偏差 {st.stdev(xs):.2f}、最大 {max(r)[0]:.1f}%（{max(r)[1]}）、最小 {min(r)[0]:.1f}%（{min(r)[1]}）、+5%以上の年 {[y for a, y in r if a >= 5]}\n')

# ---------- 8. 経済センサス 2016：ラーメン店 ----------
p('## 8. 経済センサス（2016年）ラーメン店の全国と都道府県\n')
f = raw('web', 'bizmgmt', 'r5-cal-estat-census2016-inshoku.html')
if os.path.exists(f):
    rows = list(csv.reader(io.StringIO(open(f, 'rb').read().decode('cp932'))))
    R = [r for r in rows if len(r) > 14 and '7624' in r[6]]
    nat = R[0]
    n, emp, sales, ind = int(nat[7]), int(nat[8]), int(nat[13]), int(nat[14])
    p(f'全国：事業所 {n}、従業者 {emp}（1店 {emp / n:.1f}人）、売上 {sales}百万円 → 1店の年売上 {sales / n * 100:.0f}万円・月 {sales / n * 100 / 12:.0f}万円、個人 {ind}（{ind / n * 100:.0f}%）\n')
    pref = [(r[3], int(r[7]), int(r[13]) / int(r[7]) * 100 / 12, int(r[14]) / int(r[7])) for r in R[1:]]
    xs = [x[2] for x in pref]; ys = [x[3] for x in pref]
    p(f'都道府県（47）の1店の月の売上：平均 {st.mean(xs):.0f}万円、標準偏差 {st.stdev(xs):.0f}、最小 {min(pref, key=lambda x: x[2])[0]} {min(xs):.0f}、最大 {max(pref, key=lambda x: x[2])[0]} {max(xs):.0f}\n')
    p(f'個人の店の割合：平均 {st.mean(ys) * 100:.0f}%、最小 {min(pref, key=lambda x: x[3])[0]} {min(ys) * 100:.0f}%、最大 {max(pref, key=lambda x: x[3])[0]} {max(ys) * 100:.0f}%\n')
else: p('原文なし\n')

# ---------- 9. 有報から型ごとの損益（式を見せる） ----------
p('## 9. 上場チェーンの損益の比率（有価証券報告書の数字の割り算）\n')
p('数字は各有報の損益計算書・販管費の注記の金額（千円）。比率＝費目÷売上。人件費は社によって含める行が違う（行を列に書く）。\n')
Y = [
 ('幸楽苑 2026/3（低価格・郊外と駅前）', 29404657, {'売上原価': 9029898, '人件費（給料及び手当＋賞与引当金繰入）': 8469339 + 600095, '賃借料': 2499573, '水道光熱費': 1927560, '営業利益': 1515473}),
 ('ハイデイ日高 2026/2（駅前の低価格の中華食堂）', 62252860, {'売上原価': 19197796, '人件費（給与手当＋賞与引当金繰入＋役員報酬＋退職給付費用）': 18116722 + 551991 + 91200 + 133277, '賃借料': 5017897, '水道光熱費': 2919823}),
 ('丸千代山岡家 2026/1（郊外・24時間・店炊き）', 43000813, {'売上原価': 13128821, '人件費（役員報酬＋給料及び手当＋雑給＋法定福利費＋退職給付費用）': 112950 + 4339752 + 9220738 + 1395995 + 136752, '地代家賃': 1046079, '水道光熱費': 2831446, '営業利益': 4678935}),
 ('丸千代山岡家 2016/1（同じ会社の10年前）', 10068512, {'売上原価': 2533553, '人件費（同上の5行）': 70320 + 1303277 + 1853047 + 313481, '地代家賃': 686085, '水道光熱費': 1193351, '営業利益': 510440}),
 ('力の源HD 2025/3（都心・高価格・海外、連結）', 34166110, {'売上原価': 10171265, '給料及び手当（雑給等は含まず）': 8318673, '地代家賃': 3812584, '営業利益': 2809961}),
 ('ギフトHD 2025/10（家系・急拡大、連結）', 35878100, {'売上原価': 11922753, '人件費（給料及び手当＋雑給）': 3339829 + 5097250, '賃借料': 2675456}),
]
p('| 会社（年度・型） | 売上（千円） | ' + ' | '.join(['費目と比率']) + ' |'); p('|---|---|---|')
for name, s, d in Y:
    p(f'| {name} | {s:,} | ' + '；'.join(f'{k} {v:,}÷{s:,}＝{v / s * 100:.1f}%' for k, v in d.items()) + ' |')
p('')
p('ハイデイ日高の営業利益65億84百万円・山岡家の営業利益は本文の値。ギフトは経常利益3,374,634千円（9.4%）。\n')

# ---------- 9b. JF 外食産業動向調査 1994〜2024年（協会会員社の全店、新規店を含む） ----------
p('## 9b. 外食産業の年ごとの前年比（JF 会員社の全店、1994〜2024年）\n')
f = raw('web', 'bizmgmt', 'r4-mgmt-jf-nenkan2024.pdf')
if os.path.exists(f):
    t = pdftext(f); blocks = {}
    cur = None
    for l in t.split('\n'):
        for key in ['売上金額前年比', '利用客数前年比', '店舗数前年比', '客単価前年比']:
            if key in l: cur = key
        mm = re.match(r'\s*(全\s*体|ファーストフード)\s+(.*)$', l)
        if cur and mm:
            vals = [float(x) for x in re.findall(r'(\d+\.\d)%', mm.group(2))]
            if len(vals) == 31: blocks[(cur, re.sub(r'\s', '', mm.group(1)))] = vals
    yrs = list(range(1994, 2025))
    p('| 系列 | 31年の平均 | 標準偏差 | 最大（年） | 最小（年） | 2020〜2022年を除く27年の平均・標準偏差・最小 |'); p('|---|---|---|---|---|---|')
    for (k, g), v in blocks.items():
        xs = [x - 100 for x in v]; pairs = list(zip(xs, yrs)); ex = [a for a, y in pairs if y not in (2020, 2021, 2022)]
        p(f'| {g} {k} | {st.mean(xs):+.2f}% | {st.stdev(xs):.2f} | {max(pairs)[0]:+.1f}%（{max(pairs)[1]}） | {min(pairs)[0]:+.1f}%（{min(pairs)[1]}） | {st.mean(ex):+.2f}%・{st.stdev(ex):.2f}・{min(ex):+.1f}% |')
    p('\n注意：協会会員社（主に大手チェーン）の全店で、新しく出した店の分を含む。市場全体の景気の波でも、1店の既存店の振れでもない。\n')
else: p('原文なし\n')

# ---------- 10. 公庫パネル（2016年開業）の年ごと ----------
p('## 10. 新規開業パネル（2016年開業、公庫）\n')
p('| 時点 | 廃業の累計% | 黒字基調% | 平均月商（万円） | 予想月商の達成% |'); p('|---|---|---|---|---|')
for row in [('2016年末（1年目）', '—', 50.9, 181.6, 17.4), ('2017年末（2年目）', 2.2, 70.7, 273.0, 41.3), ('2018年末（3年目）', 4.7, 75.0, 284.9, 48.6), ('2019年末（4年目）', 7.0, 76.1, '—', '—'), ('2020年末（5年目）', 8.9, 62.8, '—', '—')]:
    p('| ' + ' | '.join(str(x) for x in row) + ' |')
p('\n出所：r5-cal-jfc-panel2016-final（廃業・黒字基調）、r5-cal-jfc-panel-inoue（深沼氏論文の脚注：平均月商と予想月商の達成）。2017年末の黒字基調→2016年末からの増分 70.7−50.9＝19.8ポイント。\n')

print('\n'.join(out))
