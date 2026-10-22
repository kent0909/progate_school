#!/usr/bin/env python3
"""BIZ-FILL-RAMEN の事実の判定（判定役）：小売物価統計 2026年7月 第1表（81市）から、
中華そば（外食）と民営家賃の値を自分で読み直す（書き手の fill-region.py を通さない）。
確かめる数：中華そば 81市 465〜993円・中央747円・最高÷最低2.14、区部617・立川591・府中817・八王子890・札幌858・山形851・福岡803・大阪761・名古屋729、
民営家賃 2,907〜9,980円（区部÷八戸3.43）。値に付く印（Y＝市の実情で銘柄を変えた等）も数える。
使い方: python3 -I boki2/docs/analysis/bizfill-ramen-audit-kouri.py
"""
import os, shutil, tempfile, statistics
import openpyxl
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'research', 'raw', 'web', 'ramen')

def rows(fn):
    t = tempfile.mkdtemp(); q = os.path.join(t, 'a.xlsx'); shutil.copy(os.path.join(RAW, fn), q)
    wb = openpyxl.load_workbook(q, read_only=True, data_only=True)
    out = []
    for ws in wb.worksheets:
        for r in ws.iter_rows(values_only=True):
            out.append(list(r))
    shutil.rmtree(t)
    return out

def item(fn, code):
    rs = rows(fn)
    head = next(r for r in rs if '札幌市' in r)
    c0 = head.index('札幌市')
    cities = head[c0:c0 + 81]
    ci = head.index('銘柄符号')  # 銘柄符号の列だけで探す（値の列に同じ数があっても拾わない）
    for r in rs:
        if r[ci] is not None and str(r[ci]).strip() == code:
            vals = r[c0:c0 + 81]
            return r, cities, vals
    raise SystemExit(code + ' なし')

for fn, code, name in (('r6-fill-kouri-toshi-b0011-202607.html', '2102', '中華そば(外食)'),
                       ('r6-fill-kouri-toshi-b0012-202607.html', '3001', '民営家賃')):
    r, cities, vals = item(fn, code)
    print(f'## {name}：行の見出し {[x for x in r[:14] if x is not None]}')
    num = {}; marks = {}
    for c, v in zip(cities, vals):
        try: num[c] = float(v)
        except (TypeError, ValueError): marks[c] = v
    xs = sorted(num.values())
    lo = min(num, key=num.get); hi = max(num, key=num.get)
    print(f'数値の市 {len(num)}、数値でない値 {marks}')
    print(f'最低 {lo} {num[lo]:.0f}、最高 {hi} {num[hi]:.0f}、中央 {statistics.median(xs):.0f}、最高÷最低 {num[hi]/num[lo]:.3f}')
    print('低い5：' + ' '.join(f'{c}{num[c]:.0f}' for c in sorted(num, key=num.get)[:5]))
    print('高い5：' + ' '.join(f'{c}{num[c]:.0f}' for c in sorted(num, key=num.get, reverse=True)[:5]))
    for c in ('東京都区部', '立川市', '府中市', '八王子市', '札幌市', '山形市', '福岡市', '大阪市', '名古屋市', '横浜市', '八戸市', '仙台市', 'さいたま市', '熊本市'):
        print(f'  {c} {num.get(c, marks.get(c))}')
    # 区部の順位
    order = sorted(num, key=num.get)
    print(f'東京都区部の順位（安い順）{order.index("東京都区部")+1}/{len(order)}')
    print()
# 銘柄設定の一覧（Y）の行が中華そばにあるか：表の注に Y の意味。値そのものに Y が付くかを上で数えた。
