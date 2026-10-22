#!/usr/bin/env python3
# BIZ-MKT-RAMEN.md の表から件数を数える（QUALITY 6.2-2：件数は道具で数える）。版1.1：印のないマス・試みの例・形と数の支え・本文と14章の突き合わせを足した。
# Usage: python3 boki2/docs/analysis/bizmkt-ramen-count.py
import re, os, collections

P = os.path.join(os.path.dirname(__file__), '..', 'BIZ-MKT-RAMEN.md')
S = open(P, encoding='utf-8').read()


def section(start, end):
    i = S.index(start)
    j = S.index(end, i + len(start))
    return S[i:j]


def cells(line):
    # 表の行をマスに分ける。出典の [[...|「...」]] の中の | では分けない
    body = re.sub(r'\[\[[^\]]*\]\]', lambda m: m.group(0).replace('|', '\x00'), line.strip().strip('|'))
    return [c.strip().replace('\x00', '|') for c in body.split('|')]


def rows(text, idpat):
    out = []
    for line in text.splitlines():
        m = re.match(r'^\| (' + idpat + r') \|(.*)$', line)
        if m:
            out.append(cells(line))
    return out

# 1. 打ち手（1.1 の表）
t11 = section('### 1.1', '### 1.2')
acts = rows(t11, r'[RG]\d+')
nR = sum(1 for r in acts if r[0].startswith('R'))
nG = sum(1 for r in acts if r[0].startswith('G'))
print(f'打ち手：{len(acts)} 本（ラーメン特有 R {nR}・一般 G {nG}）')

# 1.2 の表のマスごとの根拠の印
t12 = section('### 1.2', '### 1.3')
MK = r'\[(一|手|研|実|事|声|作|宣|推)\]|【推論】|\[\[[\w-]+:'
marks = collections.Counter(re.findall(r'\[(一|手|研|実|事|声|作|宣|推)\]', t11 + t12))
marks['推'] += len(re.findall(r'【推論】', t11 + t12))
print('1.1・1.2 の根拠の印の数：' + '・'.join(f'{k} {marks[k]}' for k in ['一', '手', '研', '実', '事', '声', '作', '宣', '推']))
unmarked = []
for r in acts:
    for j, c in enumerate(r[2:7], start=2):
        if not re.search(MK, c):
            unmarked.append(f'1.1 {r[0]} 列{j + 1}')
r12 = rows(t12, r'[RG]\d+')
for r in r12:
    for j, c in enumerate(r[1:7], start=1):
        if not re.search(MK, c):
            unmarked.append(f'1.2 {r[0]} 列{j + 1}')
print(f'印のないマス：{len(unmarked)}' + ('（' + '・'.join(unmarked) + '）' if unmarked else ''))
prob = [r for r in r12 if '[推]' not in r[2]]
print(f'1.2 の当たりの確率の列で [推] のないマス：{len(prob)}' + ('（' + '・'.join(r[0] for r in prob) + '）' if prob else ''))

# 2.2 うまくいく理由の鎖・3章うまくいかない理由の鎖
t22 = section('### 2.2', '## 3. うまくいかない理由')
t3 = section('## 3. うまくいかない理由', '## 4. 打ち手の組み合わせ')
print(f'うまくいく理由の鎖：{len(re.findall(r"^\d+\. \*\*", t22, re.M))} 本・うまくいかない理由の鎖：{len(re.findall(r"^\d+\. \*\*", t3, re.M))} 本')

# 4. 組み合わせの鎖
t4 = section('## 4. 打ち手の組み合わせ', '## 5. 成功と失敗の事例')
chains = re.findall(r'^\d+\. \*\*', t4, re.M)
print(f'組み合わせの因果の鎖：{len(chains)} 本')

# 5. 事例
t5 = section('## 5. 成功と失敗の事例', '## 6. 利用者の声')
cases = rows(t5, r'[SFT]\d+')
succ = [r for r in cases if r[1] == '成功']
fail = [r for r in cases if r[1] == '失敗']
tries = [r for r in cases if r[1] == '試み']
ftypes = collections.Counter(r[2] for r in fail)
stypes = collections.Counter(r[2] for r in succ)
print(f'事例：成功 {len(succ)} 件・失敗 {len(fail)} 件・試み {len(tries)} 件')
print(f'  失敗の型（束ねた型）{len(ftypes)} 種類：' + '・'.join(f'{k} {v}' for k, v in ftypes.items()))
print(f'  成功の型 {len(stypes)} 種類：' + '・'.join(f'{k} {v}' for k, v in stypes.items()))
csrc = collections.Counter(re.search(r'r[45]-[\w-]+', r[-1]).group(0) for r in cases)
print('  出典ごと（2件以上）：' + '・'.join(f'{k} {v}' for k, v in csrc.most_common() if v > 1))

# 6. 利用者の声
t6 = section('## 6. 利用者の声', '## 7. 店主')
voices = rows(t6, r'V\d+')
cls = collections.Counter(r[2] for r in voices)
src = collections.Counter(re.search(r'r[45]-[\w-]+', r[3]).group(0) for r in voices)
print(f'利用者の声：{len(voices)} 件')
print('  分類：' + '・'.join(f'{k} {v}' for k, v in cls.most_common()))
print('  出典ごと：' + '・'.join(f'{k} {v}' for k, v in src.most_common()))

# 7. 店主・実務者・作り手
t7 = section('## 7. 店主', '## 8. CPA')
talks = rows(t7, r'P\d+')
print(f'店主・実務者・作り手の話：{len(talks)} 本')

# 11. DESIGN-RAMEN の差し替え
t11b = section('## 11. DESIGN-RAMEN', '## 12. BIZ-MKT')
repl = [cells(l) for l in t11b.splitlines() if re.match(r'^\| (\d+|新規) \|', l)]
print(f'DESIGN-RAMEN の差し替えの行：{len(repl)} 行')
print('  形の支え：' + '・'.join(f'{k} {v}' for k, v in collections.Counter(r[3] for r in repl).most_common()))
print('  数の支え：' + '・'.join(f'{k} {v}' for k, v in collections.Counter(r[4] for r in repl).most_common()))

# 14. 資料の一覧
t14 = section('## 14. 資料の一覧', '## 反証と限界')
srcs = []
for line in t14.splitlines():
    m = re.match(r'^\| \[\[([^\]|]+)\|[^\]]*\]\] \| (\S+) \|', line)
    if m:
        srcs.append((m.group(1), m.group(2)))
kinds = collections.Counter(k for _, k in srcs)
n = len(srcs)
print(f'引いた資料：{n} 本、種類 {len(kinds)}：' + '・'.join(f'{k} {v}' for k, v in kinds.most_common()))
print(f'  業者の宣伝の割合：{kinds["宣"]}/{n} = {kinds["宣"] / n * 100:.1f}%')
print(f'  最多の種類の割合：{kinds.most_common(1)[0][0]} {kinds.most_common(1)[0][1]}/{n} = {kinds.most_common(1)[0][1] / n * 100:.1f}%')

# 本文の出典の数と、14章との突き合わせ
CITE = r'\[\[([\w-]+):([\w-]+):([^\]\s|]+)(?:\|「([^」]{1,40})」)?\]\]'
allc = list(re.finditer(CITE, S))
cites = [m for m in allc if m.group(4)]
print(f'本文の出典（語句つき）：{len(cites)} 件（うち頁つき #p {sum(1 for m in cites if "#" in m.group(3))} 件）・語句なし {len(allc) - len(cites)} 件・形の崩れた二重角括弧 {S.count("[[") - len(allc)} 件')
body_docs = set(f'{m.group(1)}:{m.group(2)}:{m.group(3).split("#")[0]}' for m in allc)
list_docs = set(d for d, _ in srcs)
print(f'本文が引く文書：{len(body_docs)} 本・14章の一覧：{len(list_docs)} 本・一覧にない文書：{sorted(body_docs - list_docs) or "なし"}・本文にない一覧の文書：{sorted(list_docs - body_docs) or "なし"}')
