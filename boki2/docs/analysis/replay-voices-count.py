#!/usr/bin/env python3
# 周回（遊び直し）についての利用者の声を数えるスクリプト（BIZ-REPLAY.md の利用者の声の数はすべてここから出す。QUALITY 6.2-2）
# 使い方：python3 -I boki2/docs/analysis/replay-voices-count.py          … 集計を出す
#         python3 -I boki2/docs/analysis/replay-voices-count.py --dump   … 切り出した口コミを通し番号つきで出す（分類を付けるために読む用）
# 1) 原文（research/raw/web/simgames/ の APPLION の口コミのページ）から口コミを切り出し、同じ本文の重複を除いて番号を振る
# 2) 分類のコードの表（docs/analysis/replay-voices-codes.md）から、分類ごとの件数を数える
import re, html, os, sys, collections, difflib

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'research', 'raw', 'web', 'simgames')
CODES = os.path.join(ROOT, 'docs', 'analysis', 'replay-voices-codes.md')
clean = lambda s: re.sub(r'[ \t]+', ' ', html.unescape(re.sub(r'<br\s*/?>', '\n', re.sub(r'<(?!br)[^>]+>', '', s)))).strip()
nn = lambda s: re.sub(r'[\s\W]', '', s)

PAGES = [  # (作品, 読了ノートの doc)
  ('Slay the Spire', ['r6-rp-applion-sts-p1', 'r6-rp-applion-sts-s20', 'r6-rp-applion-sts-s40', 'r6-rp-applion-sts-s60', 'r6-rp-applion-sts-s80']),
  ('Balatro', ['r6-rp-applion-balatro-p1', 'r6-rp-applion-balatro-s20', 'r6-rp-applion-balatro-s40']),
  ('FTL', ['r6-rp-applion-ftl-p1', 'r6-rp-applion-ftl-s20']),
  ('Stardew Valley', ['r6-rp-applion-stardew-p1', 'r6-rp-applion-stardew-s20', 'r6-rp-applion-stardew-s40']),
  ('Game Dev Tycoon', ['r6-rp-applion-gdt-p1']),
]
A = []
for work, pages in PAGES:
    for pg in pages:
        t = open(os.path.join(RAW, pg + '.html'), encoding='utf8').read()
        for m in re.finditer(r'<div class="review_comment">(.*?)<div class="foot"><p>(.*?)</p></div>', t, re.S):
            ti = re.search(r'<p class="title">(.*?)</p>', m.group(1), re.S)
            b = re.search(r'<div class="body">\s*<p>(.*?)</p>', m.group(1), re.S)
            st = re.search(r'<span class="star_on">([★☆]*)</span>', m.group(2))
            dt = re.search(r'(\d{4}-\d{2}-\d{2})', m.group(2))
            A.append({'work': work, 'page': pg, 'title': clean(ti.group(1)) if ti else '', 'body': clean(b.group(1)) if b else '',
                      'stars': st.group(1).count('★') if st else 0, 'date': dt.group(1) if dt else ''})
U = []
for a in A:  # 同じ作品で本文がほぼ同じものは1件にまとめる
    if any(u['work'] == a['work'] and difflib.SequenceMatcher(None, nn(u['body'])[:200], nn(a['body'])[:200]).ratio() >= 0.9 for u in U):
        continue
    U.append(a)
for i, u in enumerate(U, 1):
    u['id'] = i

if '--dump' in sys.argv:
    for u in U:
        print('#%d [%s] %s ★%d %s\n%s\n%s\n' % (u['id'], u['work'], u['page'], u['stars'], u['date'], u['title'], u['body']))
    sys.exit()

print('切り出した口コミ：%d 件（重複を除く前 %d 件）' % (len(U), len(A)))
print('作品ごと：', dict(collections.Counter(u['work'] for u in U)))
print('星の分布：', dict(sorted(collections.Counter(u['stars'] for u in U).items())))

# ---- 2. 分類のコード ----
rows = {}
for line in open(CODES, encoding='utf8'):
    m = re.match(r'\|\s*(\d+)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|', line)
    if m:
        rows[int(m.group(1))] = [x.strip() for x in m.groups()[1:]]
missing = [u['id'] for u in U if u['id'] not in rows]
print('コードのない口コミ：', missing if missing else 'なし')
rel = [u for u in U if rows.get(u['id'], ['', '-'])[1] != '-']
print('周回・遊び直し・長く遊ぶことに触れた口コミ：%d 件 / %d 件' % (len(rel), len(U)))
print('  作品ごと：', dict(collections.Counter(u['work'] for u in rel)))
def tally(col, name):
    c = collections.Counter()
    for u in rel:
        for k in rows[u['id']][col].split():
            if k != '-':
                c[k] += 1
    print(name, '：', ', '.join('%s=%d' % kv for kv in sorted(c.items(), key=lambda kv: -kv[1])))
tally(1, '楽しみ（周回の動機）')
tally(2, '不満・やめた理由')
q = collections.Counter(rows[u['id']][3] or '書いていない' for u in rel)
print('遊んだ量の申告：', dict(q))
# 量の申告ごとに、楽しみの上位
for lvl in ['数十時間', '百時間以上', '周回の段を上まで']:
    c = collections.Counter()
    n = 0
    for u in rel:
        if rows[u['id']][3] == lvl:
            n += 1
            for k in rows[u['id']][1].split():
                if k != '-':
                    c[k] += 1
    print('  %s（%d 件）の楽しみ：' % (lvl, n), ', '.join('%s=%d' % kv for kv in c.most_common()))
stop = [u for u in rel if any(k in rows[u['id']][2].split() for k in ['x', 'y'])]
print('やめた・飽きたと書いた口コミ：%d 件（#%s）' % (len(stop), ' #'.join(str(u['id']) for u in stop)))
