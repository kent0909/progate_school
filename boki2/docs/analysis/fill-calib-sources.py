#!/usr/bin/env python3
"""BIZ-FILL-CALIB の資料の内訳を数える。新しく読了ノートを書いたもの（doc 名が r6-fc- で始まるものと、
この報告で初めてノートを書いた r4-calib-mhlw-shokuchu-r7）と、ほかの担当が取った原文を読み直して引いたもの（数えるが別の列）。
種類は doc 名で決める（下の KIND）。使い方: python3 -I boki2/docs/analysis/fill-calib-sources.py
"""
import os, glob, re, collections
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
N = os.path.join(ROOT, 'research', 'notes')
new = sorted(set(os.path.basename(p)[:-3] for p in glob.glob(os.path.join(N, '*', '*', 'r6-fc-*.md'))) | {'r4-calib-mhlw-shokuchu-r7'})
reused = ['r5-cal-athome-kashitenpo24h1', 'r5-cal-chikara-yuho2025b', 'r4-ramen-gift-yuho2025', 'nta-hikisage-leaflet', 'accountant-asbj-29-revenue',
          'r6-fill-kouri-toshi-b0011-202607', 'r5-cal-yamaokaya-yuho2026', 'r5-cal-hidaka-yuho2026', 'r5-cal-kourakuen-yuho-a', 'r5-cal-kourakuen-yuho-b',
          'r5-cal-estat-census2016-inshoku', 'r5-cal-jfc-shihyou-202008-08a', 'r5-cal-jfc-shihyou-202008-08c', 'r4-calib-jfc-shihyou-08a', 'r4-calib-jfc-shihyou-08c']
KIND = [(r'estat|stat-|jfc|mhlw|nta-|asbj', '一次資料・統計（官公庫・基準）'), (r'yuho|tsr|athome|kouri', '実務者・業界（有報・信用調査・業者の調査）'),
        (r'repec|kiefer', '研究'), (r'gdt', '作り手の話・一次資料（ゲームの公開の API）')]
def kind(d):
    for rx, k in KIND:
        if re.search(rx, d): return k
    return 'その他'
c_new = collections.Counter(kind(d) for d in new); c_re = collections.Counter(kind(d) for d in reused)
print('| 種類 | 新しく読了ノートを書いた | 読み直して引いた（ほかの担当の取得） |'); print('|---|---|---|')
for k in sorted(set(c_new) | set(c_re)): print(f'| {k} | {c_new[k]} | {c_re[k]} |')
print(f'| 計 | {sum(c_new.values())} | {sum(c_re.values())} |')
print('\n新しい資料：' + '・'.join(new))
