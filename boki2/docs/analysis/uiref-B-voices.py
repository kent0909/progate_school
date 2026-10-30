#!/usr/bin/env python3
# 担当B（ゲームの画面）の利用者の声を数える。
# 使い方: python3 -I boki2/docs/analysis/uiref-B-voices.py
# 1) research/raw/web/uiref/uB-applion-*-rev.html（APPLION の口コミの1ページ目）から口コミを全部取り出して数える（読んだ母数）
# 2) uiref-B-voices.tsv の符号の行が、その口コミに実在し、語句がその口コミの本文か題にそのまま出るかを確かめる
# 3) 符号ごと・作品ごとの件数を出す（1件が複数の符号に入る）
import re, html, glob, os, sys, collections
here = os.path.dirname(os.path.abspath(__file__))
raw = os.path.join(here, '..', '..', 'research', 'raw', 'web', 'uiref')
reviews = {}
for f in sorted(glob.glob(os.path.join(raw, 'uB-applion-*-rev.html'))):
    doc = os.path.basename(f)[:-5]
    t = open(f, encoding='utf8').read()
    for m in re.finditer(r'<div class="review_comment">(.*?)<div class="foot"><p>(.*?)</p></div>', t, re.S):
        blk = m.group(1)
        rid = re.search(r'/review/(\d+)/', blk)
        txt = html.unescape(re.sub(r'<[^>]+>', ' ', blk))
        txt = re.sub(r'\s+', ' ', txt)
        reviews[(doc, rid.group(1) if rid else '?')] = txt
per_doc = collections.Counter(d for d, _ in reviews)
print('読んだ口コミ（母数）:', len(reviews), '件 /', len(per_doc), '作品')
for d, n in sorted(per_doc.items()): print('  ', d, n)
rows, bad = [], []
for line in open(os.path.join(here, 'uiref-B-voices.tsv'), encoding='utf8'):
    if line.startswith('#') or not line.strip(): continue
    doc, rid, codes, quote = line.rstrip('\n').split('\t')
    key = (doc, rid)
    if key not in reviews: bad.append(('口コミがない', doc, rid)); continue
    if re.sub(r'\s+', ' ', quote) not in reviews[key]: bad.append(('語句が原文にない', doc, rid, quote)); continue
    if len(quote) > 20: bad.append(('語句が20字を超える', doc, rid, quote))
    rows.append((doc, rid, codes.split(';')))
dup = [k for k, c in collections.Counter((d, r) for d, r, _ in rows).items() if c > 1]
print('符号を付けた声:', len(rows), '件（見た目・操作・分かりやすさ・動きに触れたもの）  重複:', len(dup), ' 不一致:', len(bad))
for b in bad: print('  NG', b)
cc = collections.Counter(c for _, _, cs in rows for c in cs)
names = {'V+':'絵・見た目がよい','V-':'見た目・見分けの不満','M+':'動き・演出・振動・音がよい','M要':'動きが欲しい','W':'長い・待たされる・スキップしたい','T+':'待たされない・テンポがよい','S+':'スキップ・短縮・設定・自動がよい','O+':'操作がやりやすい','O-':'操作・配置の不満','C+':'分かりやすい・読みやすい','C-':'分かりにくい・表示が足りない','D':'説明なしで分かっていく楽しさ','U':'取り消し・やり直しの要望','L':'画面の向き','K+':'会話・物語の見せ方がよい'}
print('符号ごと（多い順）:')
for c, n in cc.most_common(): print(f'  {c}\t{n}\t{names.get(c, "?")}')
print('作品ごとの符号つきの声:')
for d, n in sorted(collections.Counter(d for d, _, _ in rows).items()): print('  ', d, n, '/', per_doc[d])
# 動きの向きの集計（迎合の確かめ用）：動きを褒める・求める声と、長い・待たされる声
pro = sum(1 for _, _, cs in rows if 'M+' in cs or 'M要' in cs)
con = sum(1 for _, _, cs in rows if 'W' in cs)
both = sum(1 for _, _, cs in rows if ('M+' in cs or 'M要' in cs) and 'W' in cs)
print(f'動きを褒める・求める声 {pro} 件 / 長い・待たされる声 {con} 件 / 両方 {both} 件')
skip = sum(1 for _, _, cs in rows if 'S+' in cs or 'T+' in cs)
print(f'スキップ・短縮・待たない・テンポを褒める声 {skip} 件')
sys.exit(1 if bad or dup else 0)
