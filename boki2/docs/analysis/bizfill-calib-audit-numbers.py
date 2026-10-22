#!/usr/bin/env python3
# 事実の判定役（BIZ-FILL-CALIB の判定）が、報告の数を原文から書き手のスクリプトを使わずに出し直す。
# 読むもの（research/raw。書き換えない）：
#   W1  家計調査 日別支出 2025年1〜12月（openpyxl で直接。書き手は tools/sheet-text.py 経由）
#   CENSUS 経済センサス 2012・2016（CSV, cp932）と 2021（xlsx）
#   PRICE 小売物価統計 2026年7月（openpyxl で直接）
#   FOODPOI 食中毒 令和7年（openpyxl で直接）
#   DEBT 有報の借入金等明細表と売上（pdftotext の文字から行を探して表示する。値は判定役が目で確かめる）
# 使い方: python3 -I boki2/docs/analysis/bizfill-calib-audit-numbers.py > boki2/docs/analysis/bizfill-calib-audit-numbers.out.txt
import os, csv, io, re, datetime, statistics as st, subprocess, collections
import openpyxl
_load = openpyxl.load_workbook
def _lw(path, **k): return _load(open(path, 'rb'), **k)  # 拡張子が .html でも中身が xlsx なのでファイルとして渡す
openpyxl.load_workbook = _lw
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
RAW = os.path.join(ROOT, 'research', 'raw')
def P(*a): return os.path.join(RAW, *a)

print('#### W1 曜日（家計調査 日別支出 2025年。openpyxl で直接）')
HOL = {(1,1),(1,13),(2,11),(2,23),(2,24),(3,20),(4,29),(5,3),(5,4),(5,5),(5,6),(7,21),(8,11),(9,15),(9,23),(10,13),(11,3),(11,23),(11,24)}
NEN = {(12,29),(12,30),(12,31),(1,1),(1,2),(1,3)}; OBON = {(8,13),(8,14),(8,15),(8,16)}
def kind(d):
    md = (d.month, d.day)
    if md in NEN: return '年末年始'
    if md in OBON: return 'お盆'
    if md in HOL: return '祝日'
    return ['月〜木', '月〜木', '月〜木', '月〜木', '金', '土', '日'][d.weekday()]
kind2 = kind
def read_month(m):
    wb = openpyxl.load_workbook(P('web', 'bizmgmt', f'r6-fc-estat-kakei-hibetsu-2025{m:02d}.html'), read_only=True, data_only=True)
    out = {}
    for ws in wb.worksheets:
        for row in ws.iter_rows(values_only=True):
            row = list(row)
            if '円' in row:
                j = row.index('円'); name = row[j-1]
                if name in ('中華そば', '外食') and (ws.title, name) not in out:
                    out[(ws.title, name)] = row[j+1:j+32]
    return out
data = {m: read_month(m) for m in range(1, 13)}
for sheet in ('二人', '勤労'):
    for item in ('中華そば', '外食'):
        A = collections.defaultdict(list)   # 方法A：日÷その月の日の平均（書き手と同じ定義）
        B = collections.defaultdict(list)   # 方法B：日の値そのもの（年の平均で割る、月の効果を除かない）
        allv = []
        for m in range(1, 13):
            v = data[m][(sheet, item)]
            nd = (datetime.date(2025 + (m == 12), m % 12 + 1, 1) - datetime.timedelta(days=1)).day
            vals = [float(x) for x in v[:nd] if isinstance(x, (int, float))]
            mean = sum(vals) / len(vals)
            for d in range(1, nd + 1):
                x = v[d-1]
                if not isinstance(x, (int, float)): continue
                k = kind2(datetime.date(2025, m, d))
                A[k].append(x / mean); B[k].append(float(x)); allv.append(float(x))
        ym = sum(allv) / len(allv)
        print(f'{sheet} {item}：方法A（月の平均で割る） ' + '、'.join(f'{k} {st.mean(A[k]):.2f}（n={len(A[k])}, sd={st.pstdev(A[k]):.2f}）' for k in ('月〜木','金','土','日','祝日','お盆','年末年始')))
        print(f'{sheet} {item}：方法B（年の日の平均で割る） ' + '、'.join(f'{k} {st.mean(B[k])/ym:.2f}' for k in ('月〜木','金','土','日','祝日','お盆','年末年始')))
        wk = st.mean(A['月〜木']); print(f'   土÷月〜木 {st.mean(A["土"])/wk:.2f}、日÷月〜木 {st.mean(A["日"])/wk:.2f}、(土日の平均)÷月〜木 {st.mean(A["土"]+A["日"])/wk:.2f}')

print('\n#### CENSUS 経済センサス（全国・民営）')
def sj(p): return open(p, 'rb').read().decode('cp932', errors='replace')
for y, f in (('2012', 'r6-fc-estat-census2012-inshoku.html'), ('2016', 'r5-cal-estat-census2016-inshoku.html')):
    for r in csv.reader(io.StringIO(sj(P('web', 'bizmgmt', f)))):
        if len(r) > 13 and r[3] == '全国' and re.search(r'762|76B|^\s*76 ', r[6]):
            print(f'{y} {r[6].strip()}：事業所 {int(r[7]):,}・売上（百万円）{int(r[13]):,}')
wb = openpyxl.load_workbook(P('web', 'bizmgmt', 'r6-fc-estat-census-000040032976.xlsx'), read_only=True, data_only=True)
for ws in wb.worksheets:
    for row in ws.iter_rows(values_only=True):
        if row and row[0] == '00_全国' and row[3] in ('76_飲食店', '76B_中華料理店') and row[4] == '0_総数':
            print(f'2021 {row[3]}：事業所 {row[5]:,}・売上（百万円）{row[7]:,}')
print('（2016年の 76B と 7623＋7624 の差＝格付不能などの分は下で計算）')
wb = openpyxl.load_workbook(P('web', 'bizmgmt', 'r6-fc-estat-census-000040186980.xlsx'), read_only=True, data_only=True)
loc = []; tot76 = 0
for ws in wb.worksheets:
    for row in ws.iter_rows(values_only=True):
        if row and len(row) > 5 and row[2] == '76B_中華料理店':
            loc.append((row[0], row[3], row[5]))
        if row and len(row) > 3 and row[2] == '76_飲食店' and row[0] in ('20_オフィス街地区', '30_住宅地区', '40_工業地区', '50_その他地区', '10_商業集積地区'):
            tot76 += row[3]
for a, n, s in loc: print(f'立地 {a}：{n:,}店・1店 {s/n*100:,.0f}万円')
top = [x for x in loc if not re.match(r'1[1-5]_', x[0])]
print(f'立地の表の 76B の合計（10・20・30・40・50）{sum(n for _, n, _ in top):,}／同じ表の 76 飲食店の合計 {tot76:,}（主表の 76 は 430,360）')
v = [s/n*100 for a, n, s in loc]; print(f'1店の年売上の最大÷最小 {max(v)/min(v):.2f}')

print('\n#### PRICE 小売物価 2026年7月 中華そば（外食）（openpyxl で直接）')
wb = openpyxl.load_workbook(P('web', 'ramen', 'r6-fill-kouri-toshi-b0011-202607.html'), read_only=True, data_only=True)
head = row_ch = None
for ws in wb.worksheets:
    rows = list(ws.iter_rows(values_only=True))
    for r in rows:
        r = list(r)
        if head is None and '札幌市' in r and '那覇市' in r: head = r
        if any(isinstance(c, str) and '中華そば' in c for c in r) and row_ch is None: row_ch = r
i0 = head.index('札幌市')
pairs = [(c, x) for c, x in zip(head[i0:], row_ch[i0:]) if isinstance(c, str) and isinstance(x, (int, float))]
vals = sorted(x for _, x in pairs)
q = st.quantiles(vals, n=4)
print(f'{len(pairs)}市・中央値{st.median(vals)}・平均{st.mean(vals):.0f}・sd{st.pstdev(vals):.0f}・四分位{q[0]:.0f}〜{q[2]:.0f}（比{q[2]/q[0]:.2f}）・最小{min(pairs,key=lambda p:p[1])}・最大{max(pairs,key=lambda p:p[1])}')
d = dict(pairs); print('区部', d.get('東京都区部'), '大阪', d.get('大阪市'), '名古屋', d.get('名古屋市'), '札幌', d.get('札幌市'))
print('東京都区部の順位（安い方から）', sorted(vals).index(d['東京都区部']) + 1)

print('\n#### FOODPOI 食中毒 令和7年（openpyxl で直接、該当の行を全部出す）')
wb = openpyxl.load_workbook(P('law', 'primary', 'r4-calib-mhlw-shokuchu-r7.html'), read_only=True, data_only=True)
for ws in wb.worksheets:
    for row in ws.iter_rows(values_only=True):
        cells = [c for c in row if c not in (None, '')]
        s = ' '.join(str(c) for c in cells)
        if re.search(r'^(総数|全国|飲食店|R[67]|令和[67]|ノロ|アニサキス|不明|原因施設判明|総計)|飲食店|総数|ノロウイルス|アニサキス', s) and len(cells) < 30:
            print(f'[{ws.title}] {s[:200]}')
