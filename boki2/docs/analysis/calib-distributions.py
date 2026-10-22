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

p('## 3. 分布の形：平均・中央値・黒字企業平均・信頼限界・黒字かつ自己資本プラスの割合\n')
p('判定書版3の指摘どおり、平均±標準偏差で正規分布を当てる書き方はしない。上側は「中央値・黒字かつ自己資本プラス企業の平均・その社数の割合」、平均と中央値の差で尾の向きを見る。\n')
p('| 業種（年度） | n | 営業利益率 平均 | 中央値 | 平均−中央値 | 黒字かつ自己資本プラス企業の平均 | 上方／下方信頼限界（母平均の90%） | 標準偏差 | 黒字かつ自己資本プラスの社数 | 損益分岐点比率 平均／中央値／黒字企業 |')
p('|---|---|---|---|---|---|---|---|---|---|')
for y in J:
    for r in J[y]:
        if r['kind'] != 'ind' or 'n' not in r or r.get('n') is None: continue
        if not any(k in r['name'] for k in ['飲食店，宿泊業','一般飲食店','食堂，レストラン','一般食堂','日本料理店','西洋料理店','中華料理店','朝鮮料理店','カレー料理店','そば・うどん店','すし店','喫茶店','お好み焼き屋','ハンバーガー店','酒場，ビヤホール','パン小売業','菓子・パン小売業','飲食料品小売業']): continue
        v = r['rows'].get('売上高営業利益率'); b = r['rows'].get('損益分岐点比率')
        if not v or any(x is None for x in v[:6]) or not b: continue
        p(f"| {r['name']}（{y}） | {r['n']} | {v[0]:g} | {v[2]:g} | {v[0]-v[2]:+.1f} | {v[1]:g} | {v[3]:g}／{v[4]:g} | {v[5]:g} | {r['n_good']}/{r['n']}＝{r['n_good']/r['n']*100:.0f}% | {b[0]:g}／{b[2]:g}／{b[1]:g} |")
p('')
p('平均が中央値より低い業種の数：' + '、'.join(f"{y} {sum(1 for r in J[y] if r['kind']=='ind' and r.get('n') and r['rows'].get('売上高営業利益率') and r['rows']['売上高営業利益率'][0] < r['rows']['売上高営業利益率'][2])}/{sum(1 for r in J[y] if r['kind']=='ind' and r.get('n') and r['rows'].get('売上高営業利益率'))}業種" for y in J) + '（07a の卸・小売の全業種を含む）\n')

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


# ---------- 11. 厚労省2014年：1日の客数の分布（ラーメン店）と中央値 ----------
p('## 11. ラーメン店の1日の客数の分布（厚労省2014年、表1）\n')
f = raw('law', 'primary', 'r4-mgmt-mhlw-chuka.pdf')
if os.path.exists(f):
    t = pdftext(f); rows = {}
    for l in t.split('\n'):
        m = re.match(r'\s*(総数|中華そば（ラーメン）店|食堂・レストラン)\s+((?:[\d.]+%\s+){10})100\.0%\s+([\d.]+)', l)
        if m: rows[m.group(1)] = ([float(x) for x in re.findall(r'([\d.]+)%', m.group(2))], float(m.group(3)))
    bins = [(0, 20), (20, 30), (30, 40), (40, 50), (50, 60), (60, 80), (80, 100), (100, 150), (150, 300)]
    for name, (pc, avg) in rows.items():
        known = pc[:9]; tot = sum(known); cum = 0; med = None; cdf = []
        for (lo, hi), x in zip(bins, known):
            share = x / tot
            if med is None and cum + share >= 0.5: med = lo + (0.5 - cum) / share * (hi - lo)
            q75 = None
            cum += share; cdf.append((hi, cum))
        cum = 0; q75 = None; q25 = None
        for (lo, hi), x in zip(bins, known):
            share = x / tot
            if q25 is None and cum + share >= 0.25: q25 = lo + (0.25 - cum) / share * (hi - lo)
            if q75 is None and cum + share >= 0.75: q75 = lo + (0.75 - cum) / share * (hi - lo)
            cum += share
        ge100 = sum(known[7:]) / tot * 100
        p(f'- {name}：階級の割合 {pc}（最後は不詳）、平均 {avg}人。不詳を除いて按分した【推論】中央値 約{med:.0f}人、下位25%の境 約{q25:.0f}人、上位25%の境 約{q75:.0f}人、100人以上の店 {ge100:.1f}%（階級の中は一様とみた直線の按分）')
    p('')
    t2 = norm(re.sub(r'\s+', '', t))
    m1 = re.search(r'飲食店営業の許可を受けた施設数は全国で([\d、]+)施設', t2); m2 = re.search(r'飲食店営業で([\d、]+)施設、喫茶店営業([\d、]+)施設、平成19年度から22年度までの営業廃止', t2); m3 = re.search(r'営業取消件数は飲食店営業で([\d、]+)施設', t2)
    if m1 and m2 and m3:
        N = int(m1.group(1).replace('、', '')); new = int(m2.group(1).replace('、', '')); out_ = int(m3.group(1).replace('、', ''))
        p(f'## 12. 飲食店営業の許可の新規と廃止（2007〜2010年度の4年、衛生行政報告例）\n\n許可施設 {N:,}（2011年3月末）。新規 {new:,}・廃止と取消 {out_:,}（4年）。年あたり 新規 {new/4:,.0f}（{new/4/N*100:.1f}%）・廃止 {out_/4:,.0f}（{out_/4/N*100:.1f}%）。廃止の率が毎年続くとき10年で残る割合 (1−{out_/4/N:.3f})^10 ＝ {(1-out_/4/N)**10*100:.0f}%【推論】（許可の単位で、名義の変更・移転も廃止と新規に数えられる）\n')
else: p('原文なし\n')

# ---------- 13. 東京消防庁 飲食店の火災（10年） ----------
p('## 13. 飲食店の火災（東京消防庁管内、表7-2-1・7-2-2）\n')
f = raw('web', 'bizmgmt', 'r4-calib-tfd-youto.pdf')
if os.path.exists(f):
    t = pdftext(f); yrs = []
    i = t.find('表 7-2-1'); seg = t[i:i + 3000]
    for l in seg.split('\n'):
        m = re.match(r'\s*(\d+\s*年|元年)\s+(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+)\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)\s+(\S+)\s+(\d+)', l)
        if m: yrs.append((m.group(1), int(m.group(2)), int(m.group(6)), int(m.group(9).replace(',', '')), int(m.group(11))))
    if yrs:
        p('| 年（平成27〜令和6） | 件数 | うちぼや | 損害額（千円） | 1件あたり（千円） | 負傷者 |'); p('|---|---|---|---|---|---|')
        for y, n, boya, dmg, inj in yrs: p(f'| {y} | {n} | {boya}（{boya/n*100:.0f}%） | {dmg:,} | {dmg/n:,.0f} | {inj} |')
        ns = [x[1] for x in yrs]; p(f'\n10年の件数：平均 {st.mean(ns):.0f}、最小 {min(ns)}、最大 {max(ns)}\n')
    m = re.search(r'中\s*華\s*料\s*理\s*店\s+(\d+)\s+\S+\s+\S+\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d,]+)', t)
    if m: p(f'2024年の中華料理店：{m.group(1)}件、ぼや{m.group(3)}件、損害額{m.group(6)}千円 → 1件あたり {int(m.group(6).replace(",",""))/int(m.group(1)):,.0f}千円\n')
else: p('原文なし\n')

# ---------- 14. 石川県の食中毒（2024年度の21件の患者数） ----------
p('## 14. 食中毒の重さ（石川県）\n')
f = raw('web', 'bizmgmt', 'r4-calib-ishikawa-shokuchu.pdf')
if os.path.exists(f):
    t = pdftext(f); i = t.find('令和６年度石川県食中毒発生状況', t.find('令和６年度石川県食中毒発生状況') + 1)
    pts = [int(m.group(1)) for m in re.finditer(r'^\s*\d+\s+R6\.\d+\.\d+\s+\S+\s+(\d+)\s+\d+\s+\d+', t[i:], re.M)]
    if pts: p(f'2024年度の表の1件ごとの患者数（{len(pts)}件）：{pts}。合計 {sum(pts)}、中央値 {st.median(pts)}、最大 {max(pts)}、1人の件 {pts.count(1)}件\n')
    pat = [560, 226, 100, 116, 181, 31, 85, 34, 973, 296]; cas = [20, 13, 7, 8, 19, 11, 18, 12, 16, 21]
    p(f'10年（2015〜2024年度）の図（6頁、画像で読んだ値）：件数 {cas}（計 {sum(cas)}）、患者 {pat}（計 {sum(pat)}）、1件あたり {sum(pat)/sum(cas):.1f}人、年の患者数の最大÷最小 {max(pat)/min(pat):.0f}倍\n')
else: p('原文なし\n')

# ---------- 15. 外食産業の食品ロス（環境省の図、文字で出る値） ----------
p('## 15. 外食産業の食品ロス（万t、2012〜2023年度、環境省の図の数値ラベル）\n')
fl = [(2012, 119), (2013, 117), (2014, 120), (2015, 133), (2016, 133), (2017, 127), (2018, 116), (2019, 103), (2020, 81), (2021, 80), (2022, 60), (2023, 66)]
p('| 年度 | ' + ' | '.join(str(y) for y, _ in fl) + ' |'); p('|---|' + '---|' * len(fl)); p('| 万t | ' + ' | '.join(str(v) for _, v in fl) + ' |')
p(f'\n2019年度までの平均 {st.mean([v for y, v in fl if y <= 2019]):.0f}万t、2020年度以後の平均 {st.mean([v for y, v in fl if y >= 2020]):.0f}万t\n')

# ---------- 16. ラーメン店の倒産（TDB）と原価指数（図を画像で読んだ値） ----------
p('## 16. ラーメン店の倒産件数（TDB、負債1,000万円以上・法的整理）とラーメン原価指数（図、画像で読んだ値）\n')
tdb = dict(zip(range(2010, 2026), [26, 26, 26, 36, 38, 38, 25, 43, 37, 46, 54, 17, 33, 53, 79, 59]))
p('| 年 | ' + ' | '.join(str(y) for y in tdb) + ' |'); p('|---|' + '---|' * len(tdb)); p('| 件数（TDB 2026年1月の公表） | ' + ' | '.join(str(v) for v in tdb.values()) + ' |')
p(f'\n16年の平均 {st.mean(tdb.values()):.1f}件、中央値 {st.median(tdb.values())}、最小 {min(tdb.values())}（2021）、最大 {max(tdb.values())}（2024）\n')
idx = {2019: 92, 2020: 100, 2021: 107, 2022: 108, 2023: 117, 2024: 128, 2025: 141}
p('ラーメン原価指数（豚骨ベース、東京都区部、2020年＝100）：' + '、'.join(f'{y} {v}' for y, v in idx.items()) + '。前年比：' + '、'.join(f'{y} {(idx[y]/idx[y-1]-1)*100:+.1f}%' for y in list(idx)[1:]) + f'。2020→2025年の年率 {((141/100)**(1/5)-1)*100:.1f}%\n')

# ---------- 17. 山岡家の17年（決算説明資料39〜41頁の図、画像で読んだ値） ----------
p('## 17. 丸千代山岡家の17年（2010年1月期〜2026年1月期）\n')
yy = list(range(2010, 2027))
sales = [7223, 7952, 8712, 8909, 8758, 9005, 10068, 11110, 12134, 12827, 14106, 14263, 15122, 18676, 26611, 34585, 43000]
stores = [102, 121, 137, 137, 129, 129, 138, 149, 153, 157, 163, 167, 169, 178, 183, 188, 195]
opm = [5.1, 3.2, 0.2, 1.5, 2.2, 2.6, 5.1, 3.9, 2.4, 3.2, 4.3, 2.3, 2.0, 2.8, 7.8, 10.7, 10.9]
p('| 期 | 売上（百万円） | 店数 | 1店の年売上（百万円） | 営業利益率% |'); p('|---|---|---|---|---|')
for i, y in enumerate(yy): p(f'| {y}年1月期 | {sales[i]:,} | {stores[i]} | {sales[i]/stores[i]:.1f} | {opm[i]} |')
p(f'\n2010→2012年：店数 {stores[0]}→{stores[2]}（+{(stores[2]/stores[0]-1)*100:.0f}%）、営業利益率 {opm[0]}→{opm[2]}%。2026年の1店の年売上は2016年の {sales[16]/stores[16]/(sales[6]/stores[6]):.1f}倍\n')

# ---------- 18. ギフトの5年（有報の主要な経営指標） ----------
p('## 18. ギフトHD の5年（2021年10月期〜2025年10月期、有報の主要な経営指標）\n')
g = [(2021, 13474995, 1748254, 4116387), (2022, 17015009, 2442777, 5432061), (2023, 22982625, 2424467, 6772048), (2024, 28472954, 2972177, 8377551), (2025, 35878100, 3374634, 10380083)]
p('| 期 | 売上（千円） | 経常利益（千円） | 経常利益率 | 純資産（千円） | 売上の前年比 |'); p('|---|---|---|---|---|---|')
for i, (y, sl, op, na) in enumerate(g): p(f'| {y}年10月期 | {sl:,} | {op:,} | {op/sl*100:.1f}% | {na:,} | {"" if i == 0 else f"{(sl/g[i-1][1]-1)*100:+.1f}%"} |')
p('')


# ---------- 19. 人口あたりのラーメン店（2016年、経済センサス×人口推計） ----------
p('## 19. 都道府県の人口10万人あたりのラーメン店（2016年）\n')
f1 = raw('web', 'bizmgmt', 'r5-cal-stat-jinsui2016-gaiyou3.pdf'); f2 = raw('web', 'bizmgmt', 'r5-cal-estat-census2016-inshoku.html')
POP = {}
if os.path.exists(f1) and os.path.exists(f2):
    t = pdftext(f1)
    for m in re.finditer(r'\d+\s+((?:[^\s\d]\s*){2,4}?[都道府県])\s+([\d,]+)\s+[\d.]+\s+[\d,]+\s+[\d.]+', t):
        POP[re.sub(r'\s', '', m.group(1))] = int(m.group(2).replace(',', '')) * 1000
    rows = list(csv.reader(io.StringIO(open(f2, 'rb').read().decode('cp932'))))
    dens = []
    for r in rows:
        if len(r) > 14 and '7624' in r[6] and r[3] != '全国' and r[3] in POP:
            dens.append((r[3], int(r[7]), POP[r[3]], int(r[7]) / POP[r[3]] * 1e5, int(r[13]) / int(r[7]) * 100 / 12))
    xs = [d[3] for d in dens]
    p(f'読めた都道府県 {len(dens)}。人口10万人あたりの店数：平均 {st.mean(xs):.1f}、中央値 {st.median(xs):.1f}、最小 {min(dens, key=lambda d: d[3])[0]} {min(xs):.1f}、最大 {max(dens, key=lambda d: d[3])[0]} {max(xs):.1f}。1店あたりの人口：最小 {1e5/max(xs):,.0f}人、最大 {1e5/min(xs):,.0f}人\n')
    p('| 都道府県 | 店数 | 人口 | 10万人あたり店数 | 1店の月売上（万円） |'); p('|---|---|---|---|---|')
    for d in sorted(dens, key=lambda d: -d[3])[:6] + sorted(dens, key=lambda d: d[3])[:6]:
        p(f'| {d[0]} | {d[1]} | {d[2]:,} | {d[3]:.1f} | {d[4]:.0f} |')
    import statistics
    xy = [(d[3], d[4]) for d in dens]; mx = st.mean([a for a, _ in xy]); my = st.mean([b for _, b in xy])
    cov = sum((a - mx) * (b - my) for a, b in xy) / (len(xy) - 1); r_ = cov / (st.stdev([a for a, _ in xy]) * st.stdev([b for _, b in xy]))
    p(f'\n人口あたりの店数と1店の月売上の相関係数 r = {r_:.2f}（47都道府県。店が多い県ほど1店の売上が少ないか、の目安）\n')
else: p('原文なし\n')

# ---------- 20. 地域ごとの損益分岐点の杯数（【推論】(b) と (c) の混ざった試算） ----------
p('## 20. 地域ごとの損益分岐点の1日の杯数（試算。入力の区分を列に書く）\n')
p('式：分岐点の客数/日 ＝ 月の固定費 ÷（客単価 ×（1 − 原価率 − 変動費率））÷ 月の営業日数。月の固定費 ＝ 家賃（坪単価×坪数） ＋ 人件費（店主の報酬 ＋ パートの時給×時間） ＋ その他の固定費。\n')
# 値段：ラーメン店の客単価 2014年 885.8円（厚労省）×中華そば（外食）の CPI の2015〜2025年の前年比の積 × 地域ブロックの客単価の比（中華料理店 2014年、全体1,269.2円）
cpi = list(csv.reader(io.StringIO(open(raw('web', 'bizmgmt', 'r5-cal-estat-cpi-item-yoy.html'), 'rb').read().decode('cp932'))))
j = cpi[0].index('中華そば（外食）'); mult = 1.0
for r in cpi:
    if r and r[0].strip().isdigit() and 2015 <= int(r[0].strip()) <= 2025: mult *= 1 + float(r[j]) / 100
price0 = 885.8 * mult
p(f'客単価の基準：885.8円（2014年、ラーメン店）× 中華そば（外食）の2015〜2025年の上昇 {mult:.3f}倍 ＝ {price0:.0f}円【推論 (b)】\n')
blk = {'関東・甲信越': 1247.4, '近畿': 1495.5, '中国・四国': 1529.0, '東海・北陸': 1217.6, '九州': 1197.6, '北海道・東北': 1189.7}
p('地域ブロックの客単価（中華料理店2014年、全体1,269.2円）の比：' + '、'.join(f'{k} {v/1269.2:.2f}' for k, v in blk.items()) + '（中華料理店の値で、ラーメン店だけの地域差ではない）\n')
SC = [  # 名前, 家賃 円/坪/月, 区分, 最低賃金 2026, ブロック
    ('都心の繁華街（渋谷の飲食可・1階以外を含む中央値）', 31176, '(a) アットホーム2024年度上期', 1280, '関東・甲信越'),
    ('都心の下町（上野・浅草）', 19395, '(a) 同上', 1280, '関東・甲信越'),
    ('地方都市の駅前（家賃は資料なし）', 10000, '(c) 資料なし【推論】', 1085, '九州'),
    ('郊外ロードサイド（家賃は資料なし）', 6000, '(c) 資料なし【推論】', 1085, '九州'),
    ('過疎の町（家賃は資料なし）', 3000, '(c) 資料なし【推論】', 1085, '九州'),
]
tsubo = 18; owner = 300000; part_h = 8 * 26 * 1.5; other = 300000; cogs = 0.35; var = 0.05; days = 26
p(f'共通の仮置き（すべて (c)【推論】）：店の広さ {tsubo}坪（公庫 中華料理店1〜4人の平均58.6㎡≒17.8坪から）、店主の報酬 月{owner:,}円、パート 1日8時間×26日×1.5人分を最低賃金で、その他の固定費（光熱の固定分・減価償却・通信・保険など）月{other:,}円、原価率 {cogs:.0%}（公庫 中華 総利益率65%）、変動費率 {var:.0%}、営業 月{days}日。\n')
p('| 地域の型 | 家賃（円/坪/月）と区分 | 最低賃金 | 客単価 | 月の固定費 | 分岐点の客数/日 |'); p('|---|---|---|---|---|---|')
for name, rent, kb, wage, b in SC:
    price = price0 * blk[b] / 1269.2
    fixed = rent * tsubo + owner + wage * part_h + other
    be = fixed / (price * (1 - cogs - var)) / days
    p(f'| {name} | {rent:,}（{kb}） | {wage:,} | {price:.0f} | {fixed:,.0f} | {be:.0f} |')
p('\n読み方：家賃・時給・値段の地域差だけで分岐点は約1.3〜1.5倍動く。都心は家賃の比率が大きく、店主の報酬とパート代の固定費は地域で大きく変わらない。地方・過疎の家賃は資料がなく (c)。\n')

# ---------- 10. 公庫パネル（2016年開業）の年ごと ----------
p('## 10. 新規開業パネル（2016年開業、公庫）\n')
p('| 時点 | 廃業の累計% | 黒字基調% | 平均月商（万円） | 予想月商の達成% |'); p('|---|---|---|---|---|')
for row in [('2016年末（1年目）', '—', 50.9, 181.6, 17.4), ('2017年末（2年目）', 2.2, 70.7, 273.0, 41.3), ('2018年末（3年目）', 4.7, 75.0, 284.9, 48.6), ('2019年末（4年目）', 7.0, 76.1, '—', '—'), ('2020年末（5年目）', 8.9, 62.8, '—', '—')]:
    p('| ' + ' | '.join(str(x) for x in row) + ' |')
p('\n出所：r5-cal-jfc-panel2016-final（廃業・黒字基調）、r5-cal-jfc-panel-inoue（深沼氏論文の脚注：平均月商と予想月商の達成）。2017年末の黒字基調→2016年末からの増分 70.7−50.9＝19.8ポイント。\n')

print('\n'.join(out))
