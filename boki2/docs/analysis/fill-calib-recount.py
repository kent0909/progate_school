#!/usr/bin/env python3
"""BIZ-CALIB の区分 (a)(b)(c) を、BIZ-FILL-CALIB の補填の結果で付け直して数える。
数え方は calib-count.py と同じ（「M・K・L・R」と「新しい行の一覧」の表の3列目、矢印の右）。BIZ-CALIB.md は書き換えず、
補填で区分が変わる行だけを下の OVERRIDE で上書きして数える。行ごとの根拠は BIZ-FILL-CALIB.md の結果の表。
使い方: python3 -I boki2/docs/analysis/fill-calib-recount.py [BIZ-CALIB.md のパス]
"""
import re, sys, os, collections, subprocess
# 既定は依頼の時点の版（git 37b2376 の BIZ-CALIB.md、版0.2）。引数にファイルを渡せばそれを数える
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')
# 補填で区分が変わる行（行の名 → 新しい区分と理由の短い印）
OVERRIDE = {
    # 版2：M16 は (c) に戻した（家計の倍率は家族の外食の上の端で、店の倍率には当てはめ先との偏りがある。論証の検査 Z05）
    # 版2：R5 は (c) に戻した（大手の法人向けの条件で、1号店の加盟の入口・小さな本部とは対象がずれる。Z07）
    'K28': ('a', 'K28：企業会計基準第29号 第53項（返金負債）'),
}
text = open(sys.argv[1], encoding='utf-8').read() if len(sys.argv) > 1 else subprocess.run(['git', 'show', '37b2376:boki2/docs/BIZ-CALIB.md'], cwd=ROOT, capture_output=True, text=True).stdout
lines = text.split('\n')
sec = None; rows = []
for ln in lines:
    if ln.startswith('## '):
        sec = 'old' if 'M・K・L・R' in ln else ('new' if '新しい行の一覧' in ln else None); continue
    if sec and ln.startswith('|') and not ln.startswith('|---'):
        cells = [c.strip() for c in re.sub(r'\[\[[^\]]*\]\]', '', ln).strip('|').split('|')]
        if len(cells) < 3 or cells[0] in ('#', '行'): continue
        k = cells[2].replace('*', ''); right = k.split('→')[-1]
        m = re.search(r'\(([abc])\)', right)
        rows.append([sec, cells[0], m.group(1) if m else 'その他'])
before = collections.Counter(r[2] for r in rows)
changed = []
for r in rows:
    if r[1] in OVERRIDE and OVERRIDE[r[1]][0] != r[2]:
        changed.append((r[1], r[2], OVERRIDE[r[1]][0], OVERRIDE[r[1]][1])); r[2] = OVERRIDE[r[1]][0]
after = collections.Counter(r[2] for r in rows)
def pct(c): t = c['a'] + c['b'] + c['c']; return f"{c['c']}/{t} = {100 * c['c'] / t:.1f}%"
print('| | (a) | (b) | (c) | その他 | (c) の割合（(a)(b)(c) のうち） |'); print('|---|---|---|---|---|---|')
for name, c in (('BIZ-CALIB 版0.2 のまま', before), ('補填の後', after)):
    print(f"| {name} | {c['a']} | {c['b']} | {c['c']} | {c['その他']} | {pct(c)} |")
print(f'\n区分を変えた行 {len(changed)}：')
for n, a, b, why in changed: print(f'- {n}：({a})→({b})　{why}')
need = after['c'] - int(0.30 * (after['a'] + after['b'] + after['c']))
print(f"\n30%以下に届くには、(c) をあと {max(0, need)} 行 (a)(b) に上げる必要がある")
