#!/usr/bin/env python3
# 経営シム（カイロソフト3作と Good Pizza, Great Pizza）の口コミから「周」「週」の語を全件拾い、周回の声を数える（BIZ-REPLAY 版0.2。論証検査の依頼4）
# 原文は BIZ-FUNVISUAL の担当が取得した APPLION の口コミのページ（research/raw/web/simgames/r5-fv-applion-*）
# 使い方：python3 -I boki2/docs/analysis/replay-mgmt-voices.py          … 集計
#         python3 -I boki2/docs/analysis/replay-mgmt-voices.py --dump   … 拾った口コミを番号つきで（分類を付けるために読む用）
import re, html, os, sys, collections, difflib
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'research', 'raw', 'web', 'simgames')
CODES = os.path.join(ROOT, 'docs', 'analysis', 'replay-mgmt-voices-codes.md')
clean = lambda s: re.sub(r'[ \t]+', ' ', html.unescape(re.sub(r'<br\s*/?>', '\n', re.sub(r'<(?!br)[^>]+>', '', s)))).strip()
nn = lambda s: re.sub(r'[\s\W]', '', s)
def pages(prefix):
    fs = sorted(f[:-5] for f in os.listdir(RAW) if re.fullmatch(prefix + r'(-p\d+)?\.html', f))
    return fs
WORKS = [('ゲーム発展国++', pages('r5-fv-applion-gamedevstory')), ('こだわりラーメン館', pages('r5-fv-applion-ramenkan')),
         ('こだわりラーメン館 全国編', pages('r5-fv-applion-ramenkan-zenkoku')), ('大盛グルメ食堂', pages('r5-fv-applion-gurume')),
         ('Good Pizza, Great Pizza', pages('r5-fv-applion-goodpizza'))]
A = []
for work, pgs in WORKS:
    for pg in pgs:
        t = open(os.path.join(RAW, pg + '.html'), encoding='utf8').read()
        for m in re.finditer(r'<div class="review_comment">(.*?)<div class="foot"><p>(.*?)</p></div>', t, re.S):
            ti = re.search(r'<p class="title">(.*?)</p>', m.group(1), re.S)
            b = re.search(r'<div class="body">\s*<p>(.*?)</p>', m.group(1), re.S)
            st = re.search(r'<span class="star_on">([★☆]*)</span>', m.group(2))
            A.append({'work': work, 'page': pg, 'title': clean(ti.group(1)) if ti else '', 'body': clean(b.group(1)) if b else '',
                      'stars': st.group(1).count('★') if st else 0})
U = []
for a in A:
    if any(u['work'] == a['work'] and difflib.SequenceMatcher(None, nn(u['body'])[:200], nn(a['body'])[:200]).ratio() >= 0.9 for u in U):
        continue
    U.append(a)
HIT = re.compile(r'[周週]')
H = [u for u in U if HIT.search(u['title'] + u['body'])]
for i, u in enumerate(H, 1):
    u['id'] = i
if '--dump' in sys.argv:
    for u in H:
        print('#%d [%s] %s ★%d\n%s\n%s\n' % (u['id'], u['work'], u['page'], u['stars'], u['title'], u['body']))
    sys.exit()
print('切り出した口コミ：%d 件（重複を除く前 %d 件）' % (len(U), len(A)))
print('作品ごと：', dict(collections.Counter(u['work'] for u in U)))
print('「周」か「週」の字を含む口コミ：%d 件' % len(H), dict(collections.Counter(u['work'] for u in H)))
rows = {}
if os.path.exists(CODES):
    for line in open(CODES, encoding='utf8'):
        m = re.match(r'\|\s*(\d+)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|', line)
        if m: rows[int(m.group(1))] = [x.strip() for x in m.groups()[2:]]
miss = [u['id'] for u in H if u['id'] not in rows]
print('コードのない口コミ：', miss or 'なし')
rel = [u for u in H if rows.get(u['id'], ['-'])[0] != '-']
print('周回（始め直し・2周目以降・周回の回数）に触れた口コミ：%d 件' % len(rel), dict(collections.Counter(u['work'] for u in rel)))
c = collections.Counter(k for u in rel for k in rows[u['id']][1].split() if k != '-')
print('  中身：', ', '.join('%s=%d' % kv for kv in c.most_common()))
c2 = collections.Counter(k for u in rel for k in rows[u['id']][2].split() if k != '-')
print('  周回の回数の申告：', ', '.join('%s=%d' % kv for kv in c2.most_common()))
