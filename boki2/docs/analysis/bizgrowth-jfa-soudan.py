#!/usr/bin/env python3
# JFA「フランチャイズ相談件数」20年分（2006〜2026年度）の HTML 原文から、年度ごとの件数と業種別（外食）を数える。
# Usage: python3 boki2/docs/analysis/bizgrowth-jfa-soudan.py
import re, html, os
R = os.path.join(os.path.dirname(__file__), '..', '..', 'research', 'raw', 'web', 'bizgrowth')
rows = []
for y in range(2006, 2027):
    t = open(os.path.join(R, f'r5-growth-jfa-soudan{y}.html'), encoding='utf-8', errors='ignore').read()
    t = re.sub(r'(?is)<(script|style).*?</\1>', '', t)
    t = html.unescape(re.sub(r'<[^>]+>', '\n', t))
    s = '|'.join(l.strip() for l in t.split('\n') if l.strip())
    m = re.search(r'１．月別相談件数(.*?)２．', s)
    tot, tr, ot = map(int, re.search(r'合計\|(\d+)\|(\d+)\|(\d+)', m.group(1)).groups())
    b = re.search(r'２．業種別相談件数\|業種\|件数\|内訳\|①\|②\|(.*?)（', s).group(1)
    food = re.search(r'外食(?:業)?\|(\d+)\|(\d+)\|', b)
    btot = re.search(r'合計\|(\d+)', b)
    annual = btot and int(btot.group(1)) == tot  # 業種別が年度全体の表か（後年は最後の月だけ）
    cont = re.search(r'(?:多い順に|多い内容は、?|多い項目は、?|主な相談内容は、?)(.{0,100}?)(?:に関する相談であ|に関する相談であった|などである|等である|である|と続き|。)', s)
    rows.append((y, tot, tr, ot, annual, int(food.group(1)) if food else None, int(food.group(2)) if food else None, (cont.group(1) if cont else '')))
print('| 年度 | 相談計 | ①本部と加盟店のトラブル | ②事前相談など | 業種別は年度全体か | 外食の相談 | うち外食の① | 主な相談内容（原文の語） |')
print('|---|---|---|---|---|---|---|---|')
for r in rows:
    print('| ' + ' | '.join('' if v is None else ('年度' if v is True else ('最後の月だけ' if v is False else str(v))) for v in r) + ' |')
ann = [r for r in rows if r[4]]
full = [r for r in rows if r[0] <= 2025]
print(f'\n2006〜2025年度（20年）のトラブル①の合計 {sum(r[2] for r in full)}、年平均 {sum(r[2] for r in full)/len(full):.1f}、最小 {min(r[2] for r in full)}・最大 {max(r[2] for r in full)}')
if ann:
    f1 = sum(r[6] for r in ann if r[6] is not None); a1 = sum(r[2] for r in ann)
    print(f'業種別が年度全体で出ている {len(ann)} 年度（{ann[0][0]}〜{ann[-1][0]}）：トラブル①のうち外食 {f1} ÷ 全業種 {a1} = {100*f1/a1:.1f}%')

# 主な相談内容に出てくる語（「」でくくられた項目）を年度ごとに数える
from collections import Counter
c = Counter()
for r in rows:
    for k in set(re.findall(r'「([^」]+)」', r[7])):
        k = re.sub(r'（.*?）|関連', '', k)
        c[k] += 1
print('\n主な相談内容に挙がった項目（挙がった年度の数、21年度中）：' + '、'.join(f'{k} {v}' for k, v in c.most_common()))
