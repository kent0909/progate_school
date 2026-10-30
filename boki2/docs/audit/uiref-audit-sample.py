# 事実の判定（BIZ-UIREF）用の無作為の抜き取り。seed を固定して、誰が走らせても同じ物が出る。
# 使い方: python3 -I boki2/docs/audit/uiref-audit-sample.py
#  1) 出典：BIZ-UIREF.md の [[web:uiref:doc|「語句」]] の出現（行番号つき）から 55 件（seed 20261030）
#  2) 画像：3本の下書きの「開いた画像の一覧／見た画像の一覧」から担当ごとに 10 枚（seed 20261031）。我々の画面（sheet・w）は除く
#  3) 統合の行：BIZ-UIREF.md の 2・3・5・6章の表の行から 20 行（seed 20261032）
import os, re, random

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
rep = open(os.path.join(ROOT, 'docs', 'BIZ-UIREF.md'), encoding='utf-8').read().split('\n')

# 1) 出典
cites = []
for i, line in enumerate(rep, 1):
    for m in re.finditer(r'\[\[web:uiref:([^|\]]+)\|「([^」]*)」\]\]', line):
        cites.append((i, m.group(1), m.group(2)))
print('出典の出現', len(cites))
r = random.Random(20261030)
pick = sorted(r.sample(range(len(cites)), 55))
print('■ 出典の抜き取り 55 件（seed 20261030）')
for k in pick:
    i, d, p = cites[k]
    print(f'C{k:02d}\tL{i}\t{d}\t{p}')

# 2) 画像
A = open(os.path.join(ROOT, 'docs', 'analysis', 'uiref-A-jpapps.md'), encoding='utf-8').read()
B = open(os.path.join(ROOT, 'docs', 'analysis', 'uiref-B-gameui.md'), encoding='utf-8').read()
C = open(os.path.join(ROOT, 'docs', 'analysis', 'uiref-C-visual.md'), encoding='utf-8').read()
a_sec = A[A.index('## 開いた画像の一覧'):]
a_imgs = [m for m in re.findall(r'^\| \d+ \| `([^`]+)`', a_sec, re.M) if not re.match(r'(sheet\d|w\d\d)', m)]
b_sec = B[B.index('## 開いた画像の一覧'):B.index('## 既知の傷')]
b_imgs = re.findall(r'(uB-[\w-]+\.(?:png|jpg|webp))', b_sec)
c_sec = C[C.index('## 見た画像の一覧'):C.index('## 既知の傷')]
c_imgs = re.findall(r'^\| I\d+ \| ([^|]+?) \|', c_sec, re.M)
print('\n■ 画像の母数  A', len(a_imgs), ' B', len(b_imgs), ' C', len(c_imgs))
r2 = random.Random(20261031)
for name, lst in [('A', a_imgs), ('B', b_imgs), ('C', c_imgs)]:
    s = sorted(r2.sample(range(len(lst)), 10))
    print(f'■ 担当{name} の画像 10 枚（seed 20261031）')
    for k in s:
        print(f'  {name}{k+1:02d}\t{lst[k]}')

# 3) 統合の行（表の本文の行。見出しと区切りの行を除く）
sec = {}
cur = None
for i, line in enumerate(rep, 1):
    m = re.match(r'^## (\d+)\.', line)
    if m: cur = int(m.group(1))
    elif line.startswith('## '): cur = None
    if cur in (2, 3, 5, 6) and line.startswith('|') and not re.match(r'^\|[-| ]+\|$', line):
        cells = [c.strip() for c in line.strip('|').split('|')]
        if cells[0] in ('P', '我々の画面（w）', '番号', '#'): continue
        sec.setdefault(cur, []).append(i)
pool = [(c, i) for c in sorted(sec) for i in sec[c]]
print('\n■ 2・3・5・6章の表の行', {c: len(v) for c, v in sec.items()}, '合計', len(pool))
r3 = random.Random(20261032)
for c, i in sorted(r3.sample(pool, 20), key=lambda x: x[1]):
    print(f'  {c}章 L{i}\t{rep[i-1][:90]}')
