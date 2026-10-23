#!/usr/bin/env python3
"""BIZ-FILL-CALIB の資料の内訳を数える。新しく読了ノートを書いたもの（doc 名が r6-fc- で始まるものと、
この報告で初めてノートを書いた r4-calib-mhlw-shokuchu-r7）と、ほかの担当が取った原文を読み直して引いたもの（数えるが別の列）。
種類は doc 名で決める（下の KIND）。使い方: python3 -I boki2/docs/analysis/fill-calib-sources.py
"""
import os, glob, re, collections
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
N = os.path.join(ROOT, 'research', 'notes')
new = sorted(set(os.path.basename(p)[:-3] for p in glob.glob(os.path.join(N, '*', '*', 'r6-fc-*.md'))) | {'r4-calib-mhlw-shokuchu-r7'})
# 版2で足した（r7-fc-）：検索の結果の頁・robots・e-Stat と Internet Archive の一覧の頁は「探し方の記録」として別に数え、資料の本数に入れない
v2all = sorted(set(os.path.basename(p)[:-3] for p in glob.glob(os.path.join(N, '*', '*', 'r7-fc-*.md'))))
v2nav = [d for d in v2all if re.search(r'-q-|robots|-top$|-meta$|kakeikozo2019-youbi|kakei-p1', d)]
v2 = [d for d in v2all if d not in v2nav]
reused = ['r5-cal-athome-kashitenpo24h1', 'r5-cal-chikara-yuho2025b', 'r4-ramen-gift-yuho2025', 'nta-hikisage-leaflet', 'accountant-asbj-29-revenue',
          'r6-fill-kouri-toshi-b0011-202607', 'r5-cal-yamaokaya-yuho2026', 'r5-cal-hidaka-yuho2026', 'r5-cal-kourakuen-yuho-a', 'r5-cal-kourakuen-yuho-b',
          'r5-cal-estat-census2016-inshoku', 'r5-cal-jfc-shihyou-202008-08a', 'r5-cal-jfc-shihyou-202008-08c', 'r4-calib-jfc-shihyou-08a', 'r4-calib-jfc-shihyou-08c']
# 版2：小売物価統計（kouri）は官庁の統計（事実の判定 E8）。J-STAGE の論文（r7-fc-js-）は研究。Apple の手引きは作り手の一次資料
KIND = [(r'estat|stat-|jfc|mhlw|nta-|asbj|kouri', '一次資料・統計（官公庫・基準）'), (r'yuho|tsr|athome|reinet|tanshin', '実務者・業界（有報・信用調査・業者の調査）'),
        (r'repec|kiefer|-js-|mcfadden', '研究'), (r'gdt|applesoft|micropolis|openrct2', '作り手の話・一次資料（ゲームの公開の API・手引き）')]
def kind(d):
    for rx, k in KIND:
        if re.search(rx, d): return k
    return 'その他'
reused += ['r6-cal-reinet-tenpo-2013spring', 'r6-sd-micropolis-ssim', 'r6-sd-openrct2-guest', 'r6-sd-mcfadden-nobel', 'r4-ramen-chikara-tanshin2026', 'r5-cal-tsr-news-1202872', 'r5-cal-yamaokaya-yuho-old', 'r4-ramen-tsr-fy2023', 'r5-cal-tsr-1202726']
c_new = collections.Counter(kind(d) for d in new); c_v2 = collections.Counter(kind(d) for d in v2); c_re = collections.Counter(kind(d) for d in reused)
print('| 種類 | 版1で新しく読了ノートを書いた | 版2で新しく読了ノートを書いた | 読み直して引いた（ほかの担当の取得） |'); print('|---|---|---|---|')
for k in sorted(set(c_new) | set(c_re) | set(c_v2)): print(f'| {k} | {c_new[k]} | {c_v2[k]} | {c_re[k]} |')
print(f'| 計 | {sum(c_new.values())} | {sum(c_v2.values())} | {sum(c_re.values())} |')
print(f'\n探し方の記録（検索の結果の頁・robots・一覧の頁、資料の本数に入れない）：{len(v2nav)}本')
print('\n版2の新しい資料：' + '・'.join(v2))
print('\n新しい資料：' + '・'.join(new))
