#!/usr/bin/env python3
# JFA「フランチャイズチェーン統計調査」2003〜2009年度の PDF 原文の「ラーメン・餃子」の行から写した数（前年度→当年度）を、
# 原文の行に同じ並びで出てくるかを確かめたうえで、2002〜2009年度の推移として並べる。
# 2010〜2024年度の PDF はサイトのトップへの転送（64バイト）だけで取れなかった（取得記録に理由つきで記録）。
# 店舗数は直営＋加盟の合計（チェーン本部の申告、協会の推計を含む全FCチェーン）。売上高は店舗の末端売上（百万円）。
# Usage: python3 boki2/docs/analysis/bizgrowth-jfa-fcstat-ramen.py
import re, subprocess, os
R = os.path.join(os.path.dirname(__file__), '..', '..', 'research', 'raw', 'web', 'bizgrowth')
# 年度: (チェーン 前年, 当年, 店舗 前年, 当年, 売上 前年, 当年)  ※各年度の PDF の「ラーメン・餃子」行から写した
T = {
 2003: (74, 76, 6637, 6770, 286987, 272617),
 2004: (76, 78, 6770, 6737, 272617, 295846),
 2005: (78, 81, 6737, 6934, 295846, 313652),
 2006: (81, 76, 6934, 5393, 313652, 272111),
 2007: (76, 83, 5393, 5182, 272111, 254812),
 2008: (83, 91, 5182, 4983, 254812, 250774),
 2009: (91, 88, 4983, 4782, 250774, 236186),
}
fmt = lambda n: f'{n:,}'
ok = True
for y, v in T.items():
    t = subprocess.run(['pdftotext', '-layout', os.path.join(R, f'r5-growth-jfa-fcstat{y}.pdf'), '-'], capture_output=True, text=True).stdout
    line = next((l for l in t.replace(' ', '').split('\n') if l.startswith('ラーメン・餃子')), '')
    need = [fmt(v[2]) + fmt(v[3]) if False else None]
    seq = [str(v[0]), str(v[1]), fmt(v[2]), fmt(v[3]), fmt(v[4]), fmt(v[5])]
    pos = 0; good = True
    for s in seq:
        i = line.find(s, pos)
        if i < 0: good = False; break
        pos = i + len(s)
    if not good: ok = False; print(f'✗ {y} の行に写した数が並びどおりに出てこない：{line}')
print('| 年度 | チェーン数 | 店舗数（直営＋加盟） | 売上高（百万円） |')
print('|---|---|---|---|')
print(f'| 2002 | {T[2003][0]} | {fmt(T[2003][2])} | {fmt(T[2003][4])} |')
for y, v in T.items(): print(f'| {y} | {v[1]} | {fmt(v[3])} | {fmt(v[5])} |')
a, b = T[2003][2], T[2009][3]
print(f'\n店舗数 2002→2009年度：{fmt(a)}→{fmt(b)}（{100*(b/a-1):.1f}%）。チェーン数 {T[2003][0]}→{T[2009][1]}。'
      f'売上 {fmt(T[2003][4])}→{fmt(T[2009][5])}（{100*(T[2009][5]/T[2003][4]-1):.1f}%）。1チェーンあたりの店舗 {a/T[2003][0]:.0f}→{b/T[2009][1]:.0f}')
print('原文との照合：' + ('すべて一致' if ok else '不一致あり'))
