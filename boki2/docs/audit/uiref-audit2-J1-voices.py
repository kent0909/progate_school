#!/usr/bin/env python3
# 事実の判定 2回目（J1）：R1 が uiref-B-voices.tsv に足した「#R1」の行から無作為に20行を抜き、
# その口コミの全文（題・本文）と、同じ口コミにある元の行・R1 の行の符号を並べて出す。符号が妥当かは判定役が読んで決める。
# 使い方: python3 -I boki2/docs/audit/uiref-audit2-J1-voices.py [seed]   （既定の seed 20261101）
import re, html, glob, os, sys, random
here = os.path.dirname(os.path.abspath(__file__))
ana = os.path.join(here, '..', 'analysis')
raw = os.path.join(here, '..', '..', 'research', 'raw', 'web', 'uiref')
seed = int(sys.argv[1]) if len(sys.argv) > 1 else 20261101

def load(files):
    rv = {}
    for f in files:
        doc = os.path.basename(f)[:-5]
        t = open(f, encoding='utf8').read()
        for m in re.finditer(r'<div class="review_comment">(.*?)<div class="foot"><p>(.*?)</p></div>', t, re.S):
            blk = m.group(1)
            rid = re.search(r'/review/(\d+)/', blk)
            txt = html.unescape(re.sub(r'<[^>]+>', ' ', blk))
            rv[(doc, rid.group(1) if rid else '?')] = re.sub(r'\s+', ' ', txt).strip()
    return rv

files = sorted(glob.glob(os.path.join(raw, 'uB-applion-*-rev.html'))) + [os.path.join(raw, 'uB-applion-coffeeinc2.html')]
rv = load(files)
orig, r1 = {}, []
for line in open(os.path.join(ana, 'uiref-B-voices.tsv'), encoding='utf8'):
    line = line.rstrip('\n')
    if line.startswith('#R1\t'):
        p = line.split('\t')
        r1.append(p[1:])
        continue
    if line.startswith('#') or not line.strip():
        continue
    doc, rid, codes, quote = line.split('\t')
    orig.setdefault((doc, rid), []).append(codes)
print('R1 の行', len(r1), '／ seed', seed)
random.seed(seed)
pick = sorted(random.sample(range(len(r1)), 20))
for n, i in enumerate(pick, 1):
    doc, rid, codes, quote, kind, memo = r1[i]
    others = [x for j, x in enumerate(r1) if x[0] == doc and x[1] == rid and j != i]
    print(f'\n== {n}. R1 の {i+1} 行目 {doc} {rid}')
    print('  R1 の符号:', codes, '／語句:', quote, '／種類:', kind, '／メモ:', memo)
    print('  元の行の符号:', orig.get((doc, rid), []), '／同じ口コミの他の R1 の行:', [o[2] for o in others])
    print('  口コミの全文:', rv.get((doc, rid), '（見つからない）'))
