#!/usr/bin/env python3
# 担当B（ゲームの画面）の報告の数を道具で数える。
# 使い方: python3 -I boki2/docs/analysis/uiref-B-count.py
# 1) 取得記録（research/ledger*.jsonl）の uB- の文書を種類ごとに数える（資料の内訳）
# 2) 取得した画像（uB- の画面写真・図）を数え、報告の「開いた画像の一覧」にすべて載っているかを確かめる
# 3) 報告の表の行を数える：実例の台帳（| E..）、楽しさの表（| F..）、困りごとの表（| P..）。困りごとの行ごとに、効く実例3件以上・逆の実例1件以上かを確かめる
import json, glob, os, re, collections, sys
here = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(here, '..', '..', 'research')
rep = open(os.path.join(here, 'uiref-B-gameui.md'), encoding='utf8').read()
L = []
for f in [os.path.join(R, 'ledger.jsonl')] + glob.glob(os.path.join(R, 'ledger-pending', '*.jsonl')):
    for line in open(f, encoding='utf8'):
        try: e = json.loads(line)
        except Exception: continue
        if e.get('coll') == 'uiref' and str(e.get('doc', '')).startswith('uB-') and e.get('status') == 200: L.append(e)
docs = sorted({e['doc'] for e in L if not e.get('part')})
def kind(d):
    if d.endswith('-rev'): return '利用者の声（APPLION の App Store 口コミの1ページ目）'
    if d.startswith('uB-applion-'): return '作品の画面（APPLION の作品ページ：画面写真と紹介文）'
    if d.startswith(('uB-4g-', 'uB-fami-', 'uB-gw-', 'uB-gi-', 'uB-duolingo-')): return '作り手の話（講演レポート・インタビュー・開発ブログ）'
    if d.startswith('uB-wiki-'): return '百科事典（二次資料）'
    return 'その他'
c = collections.Counter(kind(d) for d in docs)
print('文書の数:', len(docs))
for k, n in c.most_common(): print(f'  {k}\t{n}\t{n/len(docs):.0%}')
imgs = sorted(os.path.basename(e['file']) for e in L if e.get('part') and re.search(r'\.(png|jpe?g|webp|gif)$', e.get('file', '')))
print('取得した画像:', len(imgs))
m = re.search(r'## 開いた画像の一覧\n(.*?)\n## ', rep, re.S)
listed = set(re.findall(r'uB-[\w-]+_(?:shot|img)\d+\.(?:png|jpg)', m.group(1))) if m else set()
miss = [i for i in imgs if i not in listed]
print('報告の一覧に載る画像:', len(listed), ' 一覧にない取得画像:', len(miss), miss[:5])
E = re.findall(r'^\| (E\d\d) \|', rep, re.M)
F = re.findall(r'^\| (F\d\d) \|', rep, re.M)
print('実例の台帳の行:', len(E), ' 重複:', len(E) - len(set(E)))
print('楽しさの表の行:', len(F))
bad = 0
for p, eff, con in re.findall(r'^\| (P\d) \|[^|]*\|([^|]*)\|([^|]*)\|', rep, re.M):
    ne, nc = len(set(re.findall(r'E\d\d', eff))), len(set(re.findall(r'E\d\d|反\d', con)))
    ok = ne >= 3 and nc >= 1
    bad += not ok
    print(f'  {p}: 効く実例 {ne} / 逆・反対 {nc} {"OK" if ok else "NG"}')
sys.exit(1 if miss or bad or len(E) < 30 or len(F) < 30 else 0)
