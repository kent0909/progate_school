#!/usr/bin/env python3
"""BIZ-CALIB.md の行の区分 (a)(b)(c) を数える（版0.3）。
数える表：「M・K・L・R」章の表（3列目が区分）と「新しい行の一覧と区分」の表（3列目）。
「(a)→(b)」のように変えた行は矢印の右を数える。区分が (a)(b)(c) でない行（(→) 引き継ぎ待ち、(—) 数字でない）は「その他」。
数え方を3つ出す（判定書 BIZ-CALIB-v02-audit.md 3.3 と検査書 S01 に応える）：
 1. 版0.2の数え方：表の1行を1行と数える。L を含む。
 2. 依頼の数え方：依頼文の基準2は「M・K・R と D・V・T・X・G」なので L を外す。版0.2で1行にまとめた
    「K2〜K6・K8〜K12・K14〜K16・K18〜K20」を版0.1どおり16行に数える。
 3. ゲームの値の区分：2 に加えて、資料の数字（(a)）をラーメン店のゲームの値に当てはめた行（業種・母集団が違う）を (b) と数える。
使い方: python3 -I calib-count.py ../BIZ-CALIB.md
"""
import re, sys, collections
path = sys.argv[1] if len(sys.argv) > 1 else 'boki2/docs/BIZ-CALIB.md'
text = open(path, encoding='utf-8').read()
sec = None; rows = []
for ln in text.split('\n'):
    if ln.startswith('## '):
        sec = 'old' if 'M・K・L・R' in ln else ('new' if '新しい行の一覧' in ln else None)
        continue
    if sec and ln.startswith('|') and not ln.startswith('|---'):
        cells = [c.strip() for c in ln.strip('|').split('|')]
        if len(cells) < 3 or cells[0] in ('#', '行'): continue
        k = cells[2].replace('*', '')
        m = re.search(r'\(([abc])\)', k.split('→')[-1])
        rows.append((sec, cells[0], m.group(1) if m else 'その他', k))
# ゲームの値として当てはめた (a) の行（中華料理店・全業種・別の母集団の値をラーメン店のゲームに使う）
GAME_B = {'M17', 'M18', 'M22', 'M28', 'M29', 'M43', 'M52'}
def count(method):
    c = collections.Counter()
    for sec, rid, k, _ in rows:
        if method >= 2 and rid.startswith('L'): continue
        n = 16 if (method >= 2 and rid.startswith('K2〜K6')) else 1
        if method == 3 and rid in GAME_B and k == 'a': k = 'b'
        c[k] += n
    return c
print('# BIZ-CALIB の区分の集計（calib-count.py の出力）\n')
print('| 数え方 | (a) | (b) | (c) | その他 | 計 | (c)÷((a)+(b)+(c)) |')
print('|---|---|---|---|---|---|---|')
for m, name in ((1, '1. 版0.2の数え方（表の1行＝1行、L を含む）'), (2, '2. 依頼の数え方（L を外し、K2〜K20 を16行）'), (3, '3. ゲームの値の区分（2 に加え、資料の値をラーメン店に当てた行を (b)）')):
    c = count(m); abc = c['a'] + c['b'] + c['c']
    print(f"| {name} | {c['a']} | {c['b']} | {c['c']} | {c['その他']} | {sum(c.values())} | {c['c']}/{abc}＝{100 * c['c'] / abc:.1f}% |")
def _k(x):
    m = re.search(r'\(([abc])\)', x); return m.group(1) if m else None
changed = [r for r in rows if '→' in r[3] and _k(r[3].split('→')[0]) and _k(r[3].split('→')[-1]) and _k(r[3].split('→')[0]) != _k(r[3].split('→')[-1])]
print(f"\n版0.1から区分を変えた行（{len(changed)}）：" + '、'.join(f'{r[1]} {r[3].split("（")[0]}' for r in changed))
others = [r for r in rows if r[2] == 'その他']
print(f"\nその他の行（{len(others)}）：" + '、'.join(r[1] for r in others))
print('\n新しい行（D・V・T・X・G）は表1つを1行と数え、M 章は重み1つで1行と数えるので、粒の違いで (a) が多く見える（判定書3.3）。')
