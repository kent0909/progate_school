#!/usr/bin/env python3
"""BIZ-FILL-RAMEN の事実の判定（判定役）：宿泊旅行統計 2025年 第2表（月別）を、列の位置（C＝観光目的50%以上、D＝50%未満）で
自分で読み直す（書き手の fill-season-kanko.py は値の並びで列を決めていて、空のセルがあると列がずれる作りなので、別の読み方で確かめる）。
確かめる数：観光50%以上の施設の山÷谷 47都道府県の中央1.96・東京1.23・富山3.43、8月が最多の県43、長野8月171・4月65、
北海道1月117、京都10月119・2月72、青森8月153。丸めない比も出す。
使い方: python3 -I boki2/docs/analysis/bizfill-ramen-audit-kanko.py
"""
import os, shutil, tempfile, statistics
import openpyxl
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
F = os.path.join(ROOT, 'research', 'raw', 'web', 'ramen', 'r6-fill-mlit-shukuhaku-2025.html')
t = tempfile.mkdtemp(); q = os.path.join(t, 'a.xlsx'); shutil.copy(F, q)
wb = openpyxl.load_workbook(q, read_only=True)
data = {}
for m in range(1, 13):
    ws = wb[f'第2表({m}月)']
    for r in ws.iter_rows(min_row=8, values_only=True):
        a = r[0]
        if isinstance(a, str) and a.strip()[:2].isdigit() and a.strip()[-1] in '都道府県':
            name = a.strip()[2:]
            data.setdefault(name, {})[m] = (r[2], r[3])  # C, D
shutil.rmtree(t)
print('都道府県の数', len(data))
for k, lab in ((0, '観光50%以上'), (1, '観光50%未満')):
    ratios, n8 = [], 0
    for p, d in data.items():
        s = [d[m][k] for m in range(1, 13)]
        a = statistics.mean(s); ix = [x / a * 100 for x in s]
        ratios.append((max(ix) / min(ix), p))
        if max(range(1, 13), key=lambda m: s[m - 1]) == 8: n8 += 1
    ratios.sort()
    rs = [r for r, _ in ratios]
    print(f'{lab}: 山÷谷 最小{rs[0]:.3f}({ratios[0][1]}) 中央{statistics.median(rs):.3f} 最大{rs[-1]:.3f}({ratios[-1][1]})、8月が最多 {n8}')
for p in ('東京都', '富山県', '長野県', '北海道', '京都府', '青森県'):
    s = [data[p][m][0] for m in range(1, 13)]; a = statistics.mean(s)
    print(p, ' '.join(f'{m}:{x/a*100:.0f}' for m, x in zip(range(1, 13), s)))
