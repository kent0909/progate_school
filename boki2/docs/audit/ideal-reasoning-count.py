#!/usr/bin/env python3
"""論証の検査（DESIGN-UI-IDEAL 版0.1）の数え。
1) DESIGN-UI-IDEAL.md から検査の対象の結論を章ごとに数える。
   Z＝0章の番号つきの行、A＝1章（1.1〜1.3 の各節に表と本文の決定の2つ）、S＝2章の画面の見出し、
   C＝3章の表で「決めた」を含む行と、「決めない」でも「置く」所を決めた行、R＝4章 4.1〜4.3 の番号つきの行＋4.4＋4.5、
   D＝9章の「**推し**」、T＝7章の論証の表の行。
2) 検査書 DESIGN-UI-IDEAL-reasoning.md の結論の表（ID が Z/A/S/C/R/D/T＋数字の行）を数え、1) と合うかを見る。
3) 判定（妥当／弱い／不当）を数え、不当の ID を出す。
4) 「逆の結論・別の解釈」と「直し方」の欄に【確かめた】か【問い】（【確かめた：所】の形を含む）があるかを見る（直し方が「なし」の行は直し方を除く）。
使い方: python3 -I boki2/docs/audit/ideal-reasoning-count.py boki2/docs/DESIGN-UI-IDEAL.md boki2/docs/audit/DESIGN-UI-IDEAL-reasoning.md
"""
import re, sys, collections

doc = open(sys.argv[1], encoding='utf-8').read().split('\n')
rsn = open(sys.argv[2], encoding='utf-8').read().split('\n')

def section(lines, start_pat, end_pat):
    s = next(i for i, l in enumerate(lines) if re.match(start_pat, l))
    e = next(i for i, l in enumerate(lines) if i > s and re.match(end_pat, l))
    return lines[s + 1:e]

exp = collections.OrderedDict()
exp['Z'] = len([l for l in section(doc, r'^## 0\. ', r'^## 1\. ') if re.match(r'^\d+\. ', l)])
exp['A'] = 2 * len([l for l in section(doc, r'^## 1\. ', r'^## 2\. ') if re.match(r'^### 1\.\d', l)])
exp['S'] = len([l for l in section(doc, r'^## 2\. ', r'^## 3\. ') if re.match(r'^### 2\.\d+ 画面\d+', l)])
c_rows = [l for l in section(doc, r'^## 3\. ', r'^## 4\. ') if re.match(r'^\| C\d+ ', l)]
c_dec = [l for l in c_rows if '決めた' in l or ('決めない' in l and '置く' in l)]
exp['C'] = len(c_dec)
r_block = section(doc, r'^## 4\. ', r'^## 5\. ')
r_num = 0; sub = None
for l in r_block:
    m = re.match(r'^### (4\.\d)', l)
    if m: sub = m.group(1); continue
    if sub in ('4.1', '4.2', '4.3') and re.match(r'^\d+\. ', l): r_num += 1
exp['R'] = r_num + 2  # 4.4 の動きの段・4.5 の報酬
exp['D'] = len([l for l in section(doc, r'^## 9\. ', r'^## 10\. ') if l.startswith('**推し**')])
exp['T'] = len([l for l in section(doc, r'^## 7\. ', r'^## 8\. ') if re.match(r'^\| \d+ \|', l)])

print('== 対象の結論の数（DESIGN-UI-IDEAL から） ==')
for k, v in exp.items(): print(f'  {k}: {v}')
print(f'  計: {sum(exp.values())}')
print('  3章の決めた行:', [re.match(r"^\| (C\d+)", l).group(1) for l in c_dec])

rows = []
for l in rsn:
    m = re.match(r'^\| ([ZASCRDT])(\d+) \|', l)
    if m:
        cells = [c.strip() for c in l.strip().strip('|').split('|')]
        rows.append((m.group(1), m.group(1) + m.group(2), cells))

got = collections.Counter(k for k, _, _ in rows)
print('== 検査書の表の行 ==')
ok = True
for k in exp:
    flag = '' if got[k] == exp[k] else '  ← 合わない'
    if flag: ok = False
    print(f'  {k}: {got[k]}（対象 {exp[k]}）{flag}')
print(f'  計: {sum(got.values())}  章ごとの数の一致:', 'はい' if ok else 'いいえ')
ids = [i for _, i, _ in rows]
dup = [i for i, n in collections.Counter(ids).items() if n > 1]
print('  ID の重複:', dup or 'なし')

J = collections.Counter(); bych = collections.defaultdict(collections.Counter); bad = []
miss_mark = []
for k, i, c in rows:
    j = c[5]
    J[j] += 1; bych[k][j] += 1
    if j == '不当': bad.append(i)
    if not re.search('【(確かめた|問い)[：】]', c[4]): miss_mark.append((i, '逆の結論'))
    if c[6] != 'なし' and not re.search('【(確かめた|問い)[：】]', c[6]): miss_mark.append((i, '直し方'))
print('== 判定 ==')
print(f'  妥当 {J["妥当"]}・弱い {J["弱い"]}・不当 {J["不当"]}（合計 {sum(J.values())}）')
other = [j for j in J if j not in ('妥当', '弱い', '不当')]
print('  ほかの値:', other or 'なし')
print('  不当の ID:', ' '.join(bad))
for k in exp:
    b = bych[k]; print(f'  {k}: 妥当 {b["妥当"]}・弱い {b["弱い"]}・不当 {b["不当"]}')
print('== 印 ==')
print('  印のない欄:', miss_mark or 'なし')
nk = sum(len(re.findall('【確かめた[：】]', '|'.join(c[4:7]))) for _, _, c in rows)
nq = sum(len(re.findall('【問い[：】]', '|'.join(c[4:7]))) for _, _, c in rows)
print(f'  【確かめた】{nk}・【問い】{nq}（逆の結論・判定・直し方の欄）')
