#!/usr/bin/env python3
"""BIZ-CALIB.md の行の区分 (a)(b)(c) を数える。
数える表：「M・K・L・R」章の表（3列目が区分）と「新しい行の一覧と区分」の表（3列目）。
「(a)→(b)」のように変えた行は矢印の右を数える。区分が (a)(b)(c) でない行（引き継ぎ待ちなど）は「その他」。
使い方: python3 -I calib-count.py ../BIZ-CALIB.md
"""
import re, sys, collections
path = sys.argv[1] if len(sys.argv) > 1 else 'boki2/docs/BIZ-CALIB.md'
text = open(path, encoding='utf-8').read()
lines = text.split('\n')
sec = None
rows = []
for ln in lines:
    if ln.startswith('## '):
        if 'M・K・L・R' in ln: sec = 'old'
        elif '新しい行の一覧' in ln: sec = 'new'
        else: sec = None
        continue
    if sec and ln.startswith('|') and not ln.startswith('|---'):
        cells = [c.strip() for c in ln.strip('|').split('|')]
        if len(cells) < 3 or cells[0] in ('#', '行'): continue
        k = cells[2].replace('*', '')
        right = k.split('→')[-1]
        m = re.search(r'\(([abc])\)', right)
        rows.append((sec, cells[0], m.group(1) if m else 'その他', k))
cnt = collections.Counter(r[2] for r in rows)
by = collections.defaultdict(collections.Counter)
for r in rows: by[r[0]][r[2]] += 1
print('# BIZ-CALIB の区分の集計（calib-count.py の出力）\n')
print('| 表 | (a) | (b) | (c) | その他 | 計 |')
print('|---|---|---|---|---|---|')
for name, key in (('版0.1の行（M・K・L・R）', 'old'), ('新しい行（D・V・T・X・G）', 'new')):
    c = by[key]; print(f"| {name} | {c['a']} | {c['b']} | {c['c']} | {c['その他']} | {sum(c.values())} |")
tot = sum(cnt.values())
print(f"| 計 | {cnt['a']} | {cnt['b']} | {cnt['c']} | {cnt['その他']} | {tot} |")
abc = cnt['a'] + cnt['b'] + cnt['c']
if abc: print(f"\n(c) の割合（(a)(b)(c) のうち）: {cnt['c']}/{abc} = {100*cnt['c']/abc:.1f}%")
def _k(x):
    m = re.search(r'\(([abc])\)', x); return m.group(1) if m else None
changed = [r for r in rows if '→' in r[3] and _k(r[3].split('→')[0]) and _k(r[3].split('→')[-1]) and _k(r[3].split('→')[0]) != _k(r[3].split('→')[-1])]
print(f"\n版0.1から区分を変えた行: {len(changed)}")
for r in changed: print(f"- {r[1]}: {r[3]}")
others = [r for r in rows if r[2] == 'その他']
print(f"\nその他の行: {len(others)}")
for r in others: print(f"- {r[1]}: {r[3]}")
