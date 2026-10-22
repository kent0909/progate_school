#!/usr/bin/env python3
# Coffee Inc 2 の利用者の声を数えるスクリプト（BIZ-COFFEEINC2.md 3章の数はすべてここから出す。QUALITY 6.2-2）
# 使い方：python3 -I boki2/docs/analysis/coffeeinc2-voices-count.py
# 1) 原文（research/raw/web/simgames/ の APPLION 7ページと appreview.jp）から口コミを切り出し、重なりを除いて件数と星の分布を数える
# 2) 分類のコードの表（docs/analysis/coffeeinc2-voices-codes.md）から、分類ごとの件数・割合・組み合わせを数える
import re, html, json, difflib, collections, os, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'research', 'raw', 'web', 'simgames')
CODES = os.path.join(ROOT, 'docs', 'analysis', 'coffeeinc2-voices-codes.md')
nn = lambda s: re.sub(r'[\s\W]', '', s)
clean = lambda s: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<br\s*/?>', '\n', re.sub(r'<(?!br)[^>]+>', '', s)))).strip()

# ---- 1. 原文から切り出す ----
A = []
pages = ['r4-cinc-applion-reviews'] + ['r5-cinc-applion-p%d' % i for i in range(2, 8)]
for pg in pages:
    t = open(os.path.join(RAW, pg + '.html'), encoding='utf8').read()
    for m in re.finditer(r'<div class="review_comment">(.*?)<div class="foot"><p>(.*?)</p></div>', t, re.S):
        b = re.search(r'<div class="body">\s*<p>(.*?)</p>', m.group(1), re.S)
        st = re.search(r'<span class="star_on">([★☆]*)</span>', m.group(2))
        A.append({'page': pg, 'body': clean(b.group(1)), 'stars': st.group(1).count('★')})
t = open(os.path.join(RAW, 'r4-cinc-appreview.html'), encoding='utf8').read()
R = []
for blk in t.split('<div class="c-review">')[1:]:
    st = re.search(r'<div class="c-review-rating">\s*<em>(★*)</em>', blk)
    bo = re.search(r'<p class="c-review-body">(.*?)</p>', blk, re.S)
    by = re.search(r'by (.*?)\s*</p>', blk, re.S)
    R.append({'page': 'r4-cinc-appreview', 'body': clean(bo.group(1)), 'stars': len(st.group(1)), 'by': clean(by.group(1)) if by else ''})

def sim(a, b):
    return difflib.SequenceMatcher(None, nn(a)[:300], nn(b)[:300]).ratio()

TH = 0.75  # 本文の一致率がこれ以上なら同じ口コミ（同じ人の再投稿・書き直し・名前だけ違う同文を含む）
dupA = [r for r in R if max(sim(r['body'], a['body']) for a in A) >= TH]
rest = [r for r in R if r not in dupA]
uniq = []
for r in rest:
    if any(sim(r['body'], u['body']) >= TH for u in uniq):
        continue
    uniq.append(r)
print('APPLION の口コミ', len(A), '件（7ページ）')
print('appreview の表示', len(R), '件 ＝ APPLION と同じ', len(dupA), '件の表示 ＋ appreview の中の再投稿', len(rest) - len(uniq), '件の表示 ＋ appreview だけ', len(uniq), '件')
ALL = A + uniq
print('重なりを除いた件数', len(A), '+', len(uniq), '=', len(ALL))
sc = collections.Counter(v['stars'] for v in ALL)
print('星の分布（5/4/3/2/1）', '/'.join(str(sc.get(k, 0)) for k in (5, 4, 3, 2, 1)), '星5の割合 %.1f%%' % (100 * sc.get(5, 0) / len(ALL)))

# ---- 2. コードの表から数える ----
rows = [l for l in open(CODES, encoding='utf8') if re.match(r'^\| \d+ \|', l)]
P, N, T, S = {}, {}, {}, {}
for l in rows:
    c = [x.strip() for x in l.strip().strip('|').split('|')]
    i = int(c[0]); S[i] = int(c[2]); P[i] = c[3].split(); N[i] = c[4].split(); T[i] = c[5]
n = len(P)
print('\nコードの表の件数', n, '（原文から数えた件数と一致：', n == len(ALL), '）')
print('コードの表の星の分布', '/'.join(str(collections.Counter(S.values()).get(k, 0)) for k in (5, 4, 3, 2, 1)))
reason = [i for i, v in P.items() if v not in (['Z'], ['-'])]
print('理由を書いた声（Z・- 以外）', len(reason), '件')
cp = collections.Counter(x for v in P.values() for x in v)
cn = collections.Counter(x for v in N.values() for x in v)
print('\n褒め（記号 件数 160件中% 理由88件中%）')
for k, m in cp.most_common():
    print(' ', k, m, '%.0f%%' % (100 * m / n), '' if k in 'Z-' else '%.0f%%' % (100 * m / len(reason)))
print('\n不満（記号 件数 160件中%）')
for k, m in cn.most_common():
    print(' ', k, m, '%.0f%%' % (100 * m / n))
h = sorted(i for i, v in N.items() if 'h' in v)
print('\n範囲を広げて（h）', len(h), '件。うち同じ口コミに後半の手詰まり（a）', [i for i in h if 'a' in N[i]])
print('他の機種（m）', sorted(i for i, v in N.items() if 'm' in v))
I = sorted(i for i, v in P.items() if 'I' in v)
tc = collections.Counter(T[i] or '時期不明' for i in I)
print('没入（I）', len(I), '件の時期', dict(tc))
for k in ('最初', '後半', '後半?', '時期不明'):
    print('  ', k, [i for i in I if (T[i] or '時期不明') == k])
for k in 'WS':
    print(k, sorted(i for i, v in P.items() if k in v))

# ---- 3. 記事10本 ----
art = {}
inart = False
for l in open(CODES, encoding='utf8'):
    if l.startswith('## 記事10本'):
        inart = True
    m = re.match(r'^\| (r\d-cinc-[\w-]+) \| ([A-Z ]+) \|', l)
    if inart and m:
        art[m.group(1)] = m.group(2).split()
ca = collections.Counter(x for v in art.values() for x in v)
print('\n記事', len(art), '本の褒め', ca.most_common())
