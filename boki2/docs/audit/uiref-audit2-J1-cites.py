#!/usr/bin/env python3
# 事実の判定 2回目（J1）：BIZ-UIREF.md 版2 が [[web:uiref:uA-…|「語句」]]・[[web:uiref:uB-…|「語句」]] で引く出典の全部について、
# 語句が原文に何回出るか（research-check と同じく NFKC・空白を除いて照合）と、原文の中の前後の文（±70字）を出す。
# 「支える／弱い／支えない」の判定は判定役が原文を全文読んで決め、判定書 BIZ-UIREF-audit2-J1.md の表に書いた（このスクリプトは判定しない）。
# 使い方: python3 -I boki2/docs/audit/uiref-audit2-J1-cites.py <uiref-audit-extract.py の出力フォルダ>
import os, re, sys, unicodedata
here = os.path.dirname(os.path.abspath(__file__))
rep = open(os.path.join(here, '..', 'BIZ-UIREF.md'), encoding='utf-8').read().split('\n')
ext = sys.argv[1]

def norm(s):
    return re.sub(r'\s+', '', unicodedata.normalize('NFKC', s))

rows, docs = [], set()
for i, l in enumerate(rep, 1):
    for m in re.finditer(r'\[\[web:uiref:(u[AB][^|\]]+)\|「([^」]*)」\]\]', l):
        rows.append((i, m.group(1), m.group(2)))
        docs.add(m.group(1))
print('出典（uA・uB）', len(rows), '件／文書', len(docs))
miss = 0
cache = {}
for n, (i, d, q) in enumerate(rows, 1):
    if d not in cache:
        raw = open(os.path.join(ext, d + '.txt'), encoding='utf-8').read()
        cache[d] = (raw, norm(raw))
    raw, nr = cache[d]
    c = nr.count(norm(q))
    if c == 0:
        miss += 1
    flat = re.sub(r'\s+', ' ', raw)
    k = flat.find(q)
    ctx = flat[max(0, k - 70):k + len(q) + 70] if k >= 0 else '（そのままの形では見つからない。正規化では ' + str(c) + ' 回）'
    print(f'{n}\tL{i}\t{d}\t「{q}」\t出る回数 {c}\t…{ctx}…')
print('原文に出ない語句', miss)
