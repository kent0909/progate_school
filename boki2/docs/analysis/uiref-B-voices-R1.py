#!/usr/bin/env python3
# 担当B（ゲームの画面）の利用者の声の数え直し（読み直し R1、2026-10-30。依頼 docs/BRIEF-UIREF-REREAD.md）。
# 使い方: python3 -I boki2/docs/analysis/uiref-B-voices-R1.py
#
# 元の uiref-B-voices.py と uiref-B-voices.tsv の元の行は変えていない。R1 が足した行は tsv の末尾に
# 「#R1<TAB>文書<TAB>口コミの番号<TAB>符号<TAB>語句<TAB>種類<TAB>メモ」の形で置いた（行頭の # で元のスクリプトは読み飛ばすので、
# 元のスクリプトは元の数をそのまま出す。これが「元の数」）。
#   種類＝追加：元の行がない口コミに符号を付けた／補い：元の行がある口コミに、元の行が落とした符号を足した（同じ口コミの符号は和集合）
# このスクリプトは
#   1) 元のスクリプトと同じ母数（uB-applion-*-rev.html の口コミ）で元の行だけを数え直し（元の数の再現）
#   2) 母数に Coffee Inc 2 の作品ページ（uB-applion-coffeeinc2.html）の口コミを足し、元の行＋R1 の行で数える（新しい数）
#   3) R1 の行が、その口コミに実在し、語句がその口コミの本文か題にそのまま出て、20字以内かを確かめる
#   4) 符号ごと・作品ごとの元→新、動きを褒める・求める声と待たされる声の元→新を出す
import re, html, glob, os, sys, collections
here = os.path.dirname(os.path.abspath(__file__))
raw = os.path.join(here, '..', '..', 'research', 'raw', 'web', 'uiref')

def load(files):
    rv = {}
    for f in files:
        doc = os.path.basename(f)[:-5]
        t = open(f, encoding='utf8').read()
        for m in re.finditer(r'<div class="review_comment">(.*?)<div class="foot"><p>(.*?)</p></div>', t, re.S):
            blk = m.group(1)
            rid = re.search(r'/review/(\d+)/', blk)
            txt = html.unescape(re.sub(r'<[^>]+>', ' ', blk))
            rv[(doc, rid.group(1) if rid else '?')] = re.sub(r'\s+', ' ', txt)
    return rv

old_files = sorted(glob.glob(os.path.join(raw, 'uB-applion-*-rev.html')))
new_files = old_files + [os.path.join(raw, 'uB-applion-coffeeinc2.html')]
rev_old, rev_new = load(old_files), load(new_files)

orig, r1, bad = [], [], []
for line in open(os.path.join(here, 'uiref-B-voices.tsv'), encoding='utf8'):
    line = line.rstrip('\n')
    if line.startswith('#R1\t'):
        p = line.split('\t')
        if len(p) != 7: bad.append(('列の数が7でない', line)); continue
        _, doc, rid, codes, quote, kind, memo = p
        key = (doc, rid)
        if key not in rev_new: bad.append(('口コミがない', doc, rid)); continue
        if re.sub(r'\s+', ' ', quote) not in rev_new[key]: bad.append(('語句が原文にない', doc, rid, quote)); continue
        if len(quote) > 20: bad.append(('語句が20字を超える', doc, rid, quote))
        if kind not in ('追加', '補い'): bad.append(('種類が追加・補いでない', doc, rid, kind))
        r1.append((doc, rid, codes.split(';'), kind))
        continue
    if line.startswith('#') or not line.strip(): continue
    doc, rid, codes, quote = line.split('\t')
    orig.append((doc, rid, codes.split(';')))

def merge(rows):
    d = collections.OrderedDict()
    for doc, rid, cs, *_ in rows:
        d.setdefault((doc, rid), set()).update(cs)
    return d

m_old = merge(orig)
m_new = merge(orig + r1)
# 種類の確かめ：補いは元の行がある口コミだけ、追加は元の行がない口コミだけ
okeys = set(m_old)
for doc, rid, cs, kind in r1:
    if kind == '補い' and (doc, rid) not in okeys: bad.append(('補いなのに元の行がない', doc, rid))
    if kind == '追加' and (doc, rid) in okeys: bad.append(('追加なのに元の行がある', doc, rid))

names = {'V+':'絵・見た目がよい','V-':'見た目・見分けの不満','M+':'動き・演出・振動・音がよい','M要':'動きが欲しい','W':'長い・待たされる・スキップしたい','T+':'待たされない・テンポがよい','S+':'スキップ・短縮・設定・自動がよい','O+':'操作がやりやすい','O-':'操作・配置の不満','C+':'分かりやすい・読みやすい','C-':'分かりにくい・表示が足りない','D':'説明なしで分かっていく楽しさ','U':'取り消し・やり直しの要望','L':'画面の向き','K+':'会話・物語の見せ方がよい'}

def stats(m):
    cc = collections.Counter(c for cs in m.values() for c in cs)
    pro = sum(1 for cs in m.values() if 'M+' in cs or 'M要' in cs)
    con = sum(1 for cs in m.values() if 'W' in cs)
    both = sum(1 for cs in m.values() if ('M+' in cs or 'M要' in cs) and 'W' in cs)
    skip = sum(1 for cs in m.values() if 'S+' in cs or 'T+' in cs)
    return cc, pro, con, both, skip

def per_doc(rv): return collections.Counter(d for d, _ in rv)

pd_old, pd_new = per_doc(rev_old), per_doc(rev_new)
print('母数（読んだ口コミ）: 元', len(rev_old), '件 /', len(pd_old), '作品 → 新', len(rev_new), '件 /', len(pd_new), '作品',
      f'（差 {len(rev_new)}-{len(rev_old)}={len(rev_new)-len(rev_old)}：Coffee Inc 2 の作品ページ）')
print('R1 の行:', len(r1), '行（追加', sum(1 for x in r1 if x[3] == '追加'), '行・補い', sum(1 for x in r1 if x[3] == '補い'), '行）',
      ' 不一致:', len(bad))
for b in bad: print('  NG', b)
print('符号を付けた声（口コミの件数）: 元', len(m_old), '件 → 新', len(m_new), f'件（差 {len(m_new)}-{len(m_old)}={len(m_new)-len(m_old)}）')
nr = sum(1 for k in m_new if k not in m_old)
ch = sum(1 for k in m_old if m_new[k] != m_old[k])
print(f'  うち R1 で新しく符号を付けた口コミ {nr} 件、元の口コミに符号を補ったもの {ch} 件')
cc0, pro0, con0, both0, skip0 = stats(m_old)
cc1, pro1, con1, both1, skip1 = stats(m_new)
print('符号ごと（新の多い順。元→新、差）:')
for c, n in cc1.most_common():
    print(f'  {c}\t{cc0.get(c,0)}\t→ {n}\t(+{n-cc0.get(c,0)})\t{names.get(c,"?")}')
print('作品ごと（符号つきの声／母数。元→新）:')
for d in sorted(pd_new):
    o = sum(1 for k in m_old if k[0] == d); n = sum(1 for k in m_new if k[0] == d)
    print(f'   {d}\t{o}/{pd_old.get(d,0)}\t→ {n}/{pd_new[d]}')
print(f'動きを褒める・求める声（M+ か M要）: 元 {pro0} 件 → 新 {pro1} 件（+{pro1-pro0}）')
print(f'長い・待たされる声（W）: 元 {con0} 件 → 新 {con1} 件（+{con1-con0}）')
print(f'両方: 元 {both0} 件 → 新 {both1} 件')
print(f'スキップ・短縮・待たない・テンポを褒める声（S+ か T+）: 元 {skip0} 件 → 新 {skip1} 件（+{skip1-skip0}）')
# 待たされる声の中身の内訳（演出の長さか、処理・操作の長さか）は tsv のメモ列と本文で人が分けた。ここでは作品ごとの W を出す
print('W の作品ごと（元→新）:')
for d in sorted(pd_new):
    o = sum(1 for k, cs in m_old.items() if k[0] == d and 'W' in cs); n = sum(1 for k, cs in m_new.items() if k[0] == d and 'W' in cs)
    if o or n: print(f'   {d}\t{o}\t→ {n}')
print('M+・M要 の作品ごと（元→新）:')
for d in sorted(pd_new):
    o = sum(1 for k, cs in m_old.items() if k[0] == d and ('M+' in cs or 'M要' in cs)); n = sum(1 for k, cs in m_new.items() if k[0] == d and ('M+' in cs or 'M要' in cs))
    if o or n: print(f'   {d}\t{o}\t→ {n}')
sys.exit(1 if bad else 0)
