# R3（BRIEF-UIREF-REREAD）：uiref-reread-R3.md の 2.1〜2.9 の表の行（# が R3- で始まる行）を、向きの頭の語で数える。
# 使い方: python3 -I boki2/docs/analysis/uiref-reread-R3-count.py
# 向きの列（5列目）の最初の語が 反する／悪い面／支える／新しい／訂正 のどれか。どれでもない行はエラーにする。
# 2.10（下書きにはあるが統合で落ちた）は数に入れず、行数だけ別に出す。
import os, re, sys
from collections import Counter, OrderedDict

P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uiref-reread-R3.md')
KINDS = ['反する', '悪い面', '支える', '新しい', '訂正']
lines = open(P, encoding='utf-8').read().split('\n')
sec = None
per = OrderedDict()
tot = Counter()
ids = []
dropped = 0
bad = []
for ln in lines:
    m = re.match(r'^### (2\.\d+) (.*)', ln)
    if m:
        sec = m.group(1); per.setdefault(sec, [m.group(2)[:40], Counter()]); continue
    if ln.startswith('## ') and not ln.startswith('## 2.'):
        if sec and not ln.startswith('### '):
            sec = None if not ln.startswith('## 2') else sec
    if not sec:
        continue
    cells = [c.strip() for c in re.sub(r'\[\[[^\]]*\]\]', '[[出典]]', ln).split('|')]  # 出典の中の | で切らない
    if len(cells) < 7:
        continue
    if sec == '2.10' and re.match(r'^D\d+$', cells[1]):
        dropped += 1; continue
    if not cells[1].startswith('R3-'):
        continue
    k = next((x for x in KINDS if cells[4].startswith(x)), None)
    if not k:
        bad.append(cells[1]); continue
    ids.append(cells[1])
    per[sec][1][k] += 1
    tot[k] += 1
dup = [x for x in set(ids) if ids.count(x) > 1]
for s, (name, c) in per.items():
    if s == '2.10':
        continue
    print(f"{s} {name}: 計 {sum(c.values())} ／ " + '・'.join(f"{k} {c[k]}" for k in KINDS))
print(f"合計 {sum(tot.values())}（= " + ' + '.join(f"{k} {tot[k]}" for k in KINDS) + '）')
print(f"2.10 下書きにはあるが統合で落ちた（数に入れない）: {dropped}")
print(f"向きの語がない行: {bad if bad else 'なし'} ／ 番号の重複: {dup if dup else 'なし'}")
sys.exit(1 if bad or dup else 0)
