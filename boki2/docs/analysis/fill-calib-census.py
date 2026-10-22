#!/usr/bin/env python3
"""中華料理店・ラーメン店の事業所数の推移と、立地の型ごとの1店の売上（BIZ-FILL-CALIB の CENSUS）。
資料（e-Stat、経済センサス‐活動調査）：
  2012年（平成24年、2012年2月）第13表 飲食店（細分類）… r6-fc-estat-census2012-inshoku（CSV、Shift_JIS）
  2016年（平成28年、2016年6月）第17表 … BIZ-CALIB が取った r5-cal-estat-census2016-inshoku（CSV、Shift_JIS）
  2021年（令和3年、2021年6月）サービス関連産業 第1表（小分類まで）… r6-fc-estat-census-000040032976（xlsx）
  2021年 立地環境特性編 第1表 … r6-fc-estat-census-000040186980（xlsx）
注意：2021年の表は小分類「76B 中華料理店」までで、細分類（7623 中華料理店・7624 ラーメン店）に分けていない。76B は 762 専門料理店の中の中華料理店の集まり。
売上は前年の1年（2012年の表は2011年、2016年の表は2015年、2021年の表は2020年）。
使い方: python3 -I boki2/docs/analysis/fill-calib-census.py
"""
import csv, io, os, subprocess
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'research', 'raw', 'web', 'bizmgmt')
def sj(f): return open(os.path.join(RAW, f), 'rb').read().decode('cp932', errors='replace')
def sheet(f): return subprocess.run(['python3', '-I', os.path.join(ROOT, 'tools', 'sheet-text.py'), os.path.join(RAW, f)], capture_output=True, text=True).stdout
out = {}
for y, f in (('2012', 'r6-fc-estat-census2012-inshoku.html'), ('2016', 'r5-cal-estat-census2016-inshoku.html')):
    for r in csv.reader(io.StringIO(sj(f))):
        if len(r) > 13 and r[3] == '全国':
            name = r[6].strip()
            for k in ('76 飲食店', '76B 中華料理店', '7623 中華料理店', '7624 ラーメン店', '762A 中華料理店，ラーメン店格付不能'):
                if name == k: out[(y, k)] = (int(r[7]), int(r[13]))
t21 = sheet('r6-fc-estat-census-000040032976.xlsx')
for l in t21.split('\n'):
    c = l.split('\t')
    if len(c) > 7 and c[0] == '00_全国' and c[4] == '0_総数' and c[3] in ('76_飲食店', '76B_中華料理店'):
        out[('2021', {'76_飲食店': '76 飲食店', '76B_中華料理店': '76B 中華料理店'}[c[3]])] = (int(c[5]), int(c[7]))
if ('2012', '76B 中華料理店') not in out:  # 2012年の表には 76B の行がないので、細分類の3行を足す
    k = [out[('2012', x)] for x in ('7623 中華料理店', '7624 ラーメン店', '762A 中華料理店，ラーメン店格付不能')]
    out[('2012', '76B 中華料理店（7623＋7624＋762A の和）')] = (sum(a for a, _ in k), sum(b for _, b in k))
print('## 事業所数と売上（全国、民営）\n')
print('| 年 | 区分 | 事業所数 | 売上（百万円） | 1事業所の年売上（万円） |'); print('|---|---|---|---|---|')
for (y, k), (n, s) in sorted(out.items()):
    print(f'| {y} | {k} | {n:,} | {s:,} | {s / n * 100:,.0f} |')
a = out[('2016', '76B 中華料理店')][0]; b = out[('2021', '76B 中華料理店')][0]
print(f'\n76B の 2016→2021：{a:,} → {b:,}（{(b / a - 1) * 100:+.1f}%）')
a = out[('2012', '7624 ラーメン店')][0]; b = out[('2016', '7624 ラーメン店')][0]
print(f'ラーメン店（細分類）2012→2016：{a:,} → {b:,}（{(b / a - 1) * 100:+.1f}%）')
a = out[('2012', '7623 中華料理店')][0]; b = out[('2016', '7623 中華料理店')][0]
print(f'中華料理店（細分類）2012→2016：{a:,} → {b:,}（{(b / a - 1) * 100:+.1f}%）')
print('\n## 立地の型ごとの 76B 中華料理店（2021年、売上は2020年）\n')
print('| 立地の型 | 事業所数 | 従業者数 | 売上（百万円） | 1事業所の年売上（万円） | 1事業所の従業者 |'); print('|---|---|---|---|---|---|')
for l in sheet('r6-fc-estat-census-000040186980.xlsx').split('\n'):
    c = l.split('\t')
    if len(c) >= 6 and c[2] == '76B_中華料理店':
        n, p, s = int(c[3]), int(c[4]), int(c[5])
        print(f'| {c[0]} | {n:,} | {p:,} | {s:,} | {s / n * 100:,.0f} | {p / n:.1f} |')
