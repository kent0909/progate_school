#!/usr/bin/env python3
"""BIZ-FILL-RAMEN.md の表を数える（3章の判定・根拠の種類、4章、資料の内訳、出典の数）。
使い方: python3 -I boki2/docs/analysis/fill-count.py"""
import re, os, collections, glob
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
s = open(os.path.join(D, 'BIZ-FILL-RAMEN.md'), encoding='utf8').read()
def section(title):
    m = re.search(r'^## ' + re.escape(title) + r'.*?\n(.*?)(?=^## )', s, re.S | re.M); return m.group(1) if m else ''
def rows(text):
    out = []
    for l in text.split('\n'):
        if l.startswith('|') and not re.match(r'^\|[\s\-|:]+\|$', l):
            l2 = re.sub(r'\[\[[^\]]*\]\]', 'X', l)
            out.append([c.strip() for c in l2.strip().strip('|').split('|')])
    return out[1:]
def kind(j):
    if j.startswith('埋まらず'): return '埋まらず'
    if j.startswith('一部'): return '一部'
    if j.startswith('否定'): return '否定'
    if '修正' in j: return '修正'
    if j.startswith('支持'): return '支持'
    return '?' + j
r3 = rows(section('3. 上位30項目の補填の結果'))
c = collections.Counter(kind(r[5]) for r in r3)
print('3章の行:', len(r3), dict(c))
filled = [r for r in r3 if kind(r[5]) in ('支持', '修正', '否定')]
print('支持・修正・否定（一次・研究・実務者・事例の根拠）:', len(filled), '／一部:', c['一部'], '／埋まらず:', c['埋まらず'])
tk = collections.Counter()
for r in r3:
    if kind(r[5]) == '埋まらず': continue
    for t in re.findall(r'一|研|実|事|声|宣', r[7].split('（')[0] if not r[7].startswith('（') else ''): tk[t] += 1
print('埋まった・一部の行の根拠の種類（行の中の記号の出現）:', dict(tk))
noreason = [r[1] for r in r3 if kind(r[5]) == '埋まらず' and len(r[6]) < 8]
print('埋まらずで理由の欄が空に近い行:', noreason or 'なし')
r4 = rows(section('4. 上位30の外の項目（全件の扱い）'))
print('4章の行（判定書から足した X を含む表を含む）:', len(r4))
# 資料の内訳：読了ノートの数と、この報告の内訳の表
notes = sorted(glob.glob(os.path.join(D, '..', 'research', 'notes', 'web', 'ramen', 'r6-fill-*.md')))
print('r6-fill の読了ノート:', len(notes), '／うち read: partial', sum('read: partial' in open(n, encoding='utf8').read() for n in notes))
tab = rows(section('資料の内訳'))
nums = {r[0]: int(r[1]) for r in tab if r[1].isdigit()}
tot = nums.pop('計', None); ssum = sum(nums.values())
print('内訳の表:', nums, '計', ssum, '（表の計', tot, '）')
mx = max(nums, key=nums.get); print(f'最多 {mx} {nums[mx]}/{ssum} = {nums[mx]/ssum*100:.1f}%')
print(f'月次12本を1本と数えた場合: {nums[mx]-11}/{ssum-11} = {(nums[mx]-11)/(ssum-11)*100:.1f}%')
print(f'宣伝: {nums.get("宣伝・主催者の主張",0)}/{ssum} = {nums.get("宣伝・主催者の主張",0)/ssum*100:.1f}%')
cites = re.findall(r'\[\[[\w-]+:[\w-]+:[^\]|]+\|「[^」]+」\]\]', s)
print('出典（語句つき）:', len(cites), '文書の数:', len(set(re.findall(r'\[\[([\w-]+:[\w-]+:[^\]|#]+)', s))))
