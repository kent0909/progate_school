#!/usr/bin/env python3
# 事実の判定 2回目（J1）：BIZ-UIREF.md 版2 の16章（読み直しの反映表）のうち、uA-・uB- の文書に関わる行
# （R1 の全行と、R2 の 2.1〜2.9 節の行）について、R1・R2 の元の行（事実・出典・向き）と、
# BIZ の本文（16章より前）でその R 番号が出る行の全文を並べて出す。強めた・弱めた・向きを変えた・落としたの判定は判定役が読んで決める。
# 使い方: python3 -I boki2/docs/audit/uiref-audit2-J1-reflect.py
import os, re
here = os.path.dirname(os.path.abspath(__file__))
biz = open(os.path.join(here, '..', 'BIZ-UIREF.md'), encoding='utf-8').read().split('\n')
r1 = open(os.path.join(here, '..', 'analysis', 'uiref-reread-R1.md'), encoding='utf-8').read().split('\n')
r2 = open(os.path.join(here, '..', 'analysis', 'uiref-reread-R2.md'), encoding='utf-8').read().split('\n')

s16 = next(i for i, l in enumerate(biz) if l.startswith('## 16.'))
s15 = next(i for i, l in enumerate(biz) if l.startswith('## 15.'))
body = biz[:s15]
targets = []
for l in biz[s16:]:
    m = re.match(r'\| (R[12]-[0-9.]+(?:#|-)[0-9]+) \|', l)
    if m:
        rid = m.group(1)
        if rid.startswith('R2-'):
            sec = int(rid.split('-')[1].split('.')[1])
            if sec > 9:
                continue  # 2.10〜2.12 は uC の文書（J2 の範囲）
        targets.append(rid)

# R1：3.x 節の表の行。番号は「3.x の表の #」
r1rows = {}
sec = None
for l in r1:
    m = re.match(r'### (3\.\d+) ', l)
    if m:
        sec = m.group(1); continue
    m = re.match(r'\| (\d+) \|', l)
    if sec and m:
        r1rows[f'R1-{sec}#{m.group(1)}'] = l
# R2：2.x 節の表の行。番号は表の上から数える
r2rows = {}
sec = None; k = 0
for l in r2:
    m = re.match(r'### (2\.\d+) ', l)
    if m:
        sec = m.group(1); k = 0; continue
    if sec and l.startswith('| u') :
        k += 1
        r2rows[f'R2-{sec}-{k}'] = l

print('対象の行', len(targets), '（R1', sum(t.startswith('R1') for t in targets), '・R2', sum(t.startswith('R2') for t in targets), '）')
for t in targets:
    src = r1rows.get(t) or r2rows.get(t) or '（R の表に行が見つからない）'
    print('\n====', t)
    print('R の行:', src)
    pat = re.compile(re.escape(t) + r'(?![0-9])')
    hits = [(i + 1, l) for i, l in enumerate(body) if pat.search(l)]
    if not hits:
        print('BIZ 本文: （番号が出ない）')
    for i, l in hits:
        j = pat.search(l).start()
        print(f'BIZ L{i}: …{l[max(0, j - 260):j + 60]}…')
