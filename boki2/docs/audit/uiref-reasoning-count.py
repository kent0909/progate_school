#!/usr/bin/env python3
"""論証の検査（BIZ-UIREF 版3）の数え。
1) BIZ-UIREF.md から検査の対象の結論の数を章ごとに数える（0章の各行、1.1・1.2 の各行と「決めない所」、
   2章の P、3章の画面、4章の C の推しと統合の読み、6章の行、7章の鎖、11章の K）。
2) 検査書 BIZ-UIREF-reasoning.md の結論の表（ID が Z/D/P/S/R/X/G/N/K で始まる行）を数え、章ごとの数が 1) と合うかを見る。
3) 判定（妥当／弱い／不当）を数え、不当の ID を出す。
4) 「逆の結論・別の解釈」「直し方」の欄に【確かめた】か【問い】が付いているかを見る（直し方が「なし」の行は除く）。
使い方: python3 -I boki2/docs/audit/uiref-reasoning-count.py <BIZ-UIREF.md> <BIZ-UIREF-reasoning.md>
"""
import re, sys, collections

biz = open(sys.argv[1], encoding='utf-8').read().split('\n')
rsn = open(sys.argv[2], encoding='utf-8').read().split('\n')

def section(lines, start_pat, end_pat):
    s = next(i for i, l in enumerate(lines) if re.match(start_pat, l))
    e = next(i for i, l in enumerate(lines) if i > s and re.match(end_pat, l))
    return lines[s + 1:e]

def table_rows(block):
    rows = [l for l in block if l.startswith('|')]
    return [r for r in rows if not re.match(r'^\|\s*-', r) and not re.match(r'^\|\s*(#|P|論点|測ったもの|我々の画面[^|]*|案|結論|番号|鎖[^|]*)\s*\|', r)]

exp = collections.OrderedDict()
exp['Z'] = len([l for l in section(biz, r'^## 0\. 要点', r'^## 問いの設計') if re.match(r'^\d+\. ', l)])
d11 = table_rows(section(biz, r'^### 1\.1', r'^### 1\.2'))
d12 = table_rows(section(biz, r'^### 1\.2', r'^## 2\.'))
d_keep = [l for l in section(biz, r'^### 1\.2', r'^## 2\.') if l.startswith('**決めない所**')]
exp['D'] = len(d11) + len(d12) + len(d_keep)
exp['P'] = len([r for r in table_rows(section(biz, r'^## 2\.', r'^## 3\.')) if re.match(r'^\| P\d', r)])
exp['S'] = len(table_rows(section(biz, r'^## 3\.', r'^## 4\.')))
s4 = section(biz, r'^## 4\.', r'^## 5\.')
exp['R'] = len([l for l in s4 if l.startswith('**C の推し**')]) + len([l for l in s4 if l.startswith('- ')])
exp['X'] = len([r for r in table_rows(section(biz, r'^## 6\.', r'^## 7\.')) if re.match(r'^\| \d+ \|', r)])
s7a = section(biz, r'^### うまくいく理由', r'^### うまくいかない理由')
s7b = section(biz, r'^### うまくいかない理由', r'^## 8\.')
exp['G'] = len([r for r in s7a if re.match(r'^\| \d+ \|', r)])
exp['N'] = len([r for r in s7b if re.match(r'^\| \d+ \|', r)])
exp['K'] = len([r for r in table_rows(section(biz, r'^## 11\.', r'^## 12\.')) if re.match(r'^\| K\d', r)])

rows = [l for l in rsn if re.match(r'^\| [ZDPSRXGNK]\d+ \|', l)]
got = collections.Counter(re.match(r'^\| ([A-Z])', r).group(1) for r in rows)
ids = [re.match(r'^\| ([A-Z]\d+) ', r).group(1) for r in rows]
dup = [i for i, c in collections.Counter(ids).items() if c > 1]

print('■ 1. 検査の対象の結論（BIZ-UIREF.md から数えた）と検査書の行')
names = {'Z': '0章 要点', 'D': '1章 診断（1.1・1.2・決めない所）', 'P': '2章 P', 'S': '3章 画面', 'R': '4章 推し・読み',
         'X': '6章 ぶつかる点の案', 'G': '7章 うまくいく鎖', 'N': '7章 うまくいかない鎖', 'K': '11章 論証の表'}
ok = True
for k, v in exp.items():
    flag = '一致' if got[k] == v else '食い違い'
    ok &= got[k] == v
    print(f'  {k} {names[k]}: BIZ {v} ／ 検査書 {got[k]} … {flag}')
print(f'  合計: BIZ {sum(exp.values())} ／ 検査書 {len(rows)} … {"一致" if ok and len(rows) == sum(exp.values()) else "食い違い"}　重複した ID: {dup or "なし"}')

verdict = collections.Counter()
unfair, untagged = [], []
for r in rows:
    c = [x.strip() for x in r.strip().strip('|').split('|')]
    # 列: ID | 所 | 結論 | 観点の所見 | 逆の結論・別の解釈 | 判定 | 直し方
    if len(c) != 7:
        print('  列の数が7でない行:', c[0], len(c)); continue
    v = c[5].replace('*', '')
    verdict[v] += 1
    if v == '不当': unfair.append(c[0])
    if not re.search(r'【(確かめた|問い)】', c[4]): untagged.append(c[0] + ' 逆の結論')
    if c[6] not in ('なし',) and not re.search(r'【(確かめた|問い)】', c[6]): untagged.append(c[0] + ' 直し方')
print('■ 2. 判定')
print(f'  妥当 {verdict["妥当"]}・弱い {verdict["弱い"]}・不当 {verdict["不当"]}（合計 {sum(verdict.values())}）')
other = {k: v for k, v in verdict.items() if k not in ('妥当', '弱い', '不当')}
if other: print('  判定の語が3つのどれでもない:', other)
print('  不当の ID:', ' '.join(unfair))
by = collections.defaultdict(collections.Counter)
for r in rows:
    c = [x.strip() for x in r.strip().strip('|').split('|')]
    by[c[0][0]][c[5].replace('*', '')] += 1
for k in exp:
    print(f'  {k}: 妥当 {by[k]["妥当"]}・弱い {by[k]["弱い"]}・不当 {by[k]["不当"]}')
print('■ 3. 印（逆の結論・別の解釈、直し方の欄）')
print('  印のない欄:', untagged or 'なし')
sys.exit(0 if ok and not untagged and not other and not dup else 1)
