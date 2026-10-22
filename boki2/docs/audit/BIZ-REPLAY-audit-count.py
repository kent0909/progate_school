#!/usr/bin/env python3
# BIZ-REPLAY 判定書（audit/BIZ-REPLAY-audit.md）の数を出すスクリプト（判定役。QUALITY 6.2-2）
# 使い方：python3 -I boki2/docs/audit/BIZ-REPLAY-audit-count.py
# 1) APPLION の各ページに載る App Store の星の分布（星1〜5の件数）を原文から読み、星1〜3の割合を出す
# 2) 判定役が「始め直しに触れていない」と読んだ口コミを 周→長 に移したときの、周 の楽しみの数え直し
import re, os, html, collections
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'research', 'raw', 'web', 'simgames')
CODES = os.path.join(ROOT, 'docs', 'analysis', 'replay-voices-codes.md')
works = [('Slay the Spire','r6-rp-applion-sts-p1'),('Balatro','r6-rp-applion-balatro-p1'),('FTL','r6-rp-applion-ftl-p1'),
         ('Stardew Valley','r6-rp-applion-stardew-p1'),('Game Dev Tycoon','r6-rp-applion-gdt-p1')]
tot = collections.Counter()
print('1) 原文のページに載る星の分布（App Store の評価の件数）')
for w, pg in works:
    t = html.unescape(re.sub(r'<[^>]+>', ' ', open(os.path.join(RAW, pg + '.html'), encoding='utf8').read()))
    t = re.sub(r'\s+', ' ', t)
    m = re.search(r'5つ星 ([\d,]+) 4つ星 ([\d,]+) 3つ星 ([\d,]+) 2つ星 ([\d,]+) 1つ星 ([\d,]+)', t)
    v = [int(x.replace(',', '')) for x in m.groups()]
    n, low = sum(v), v[2] + v[3] + v[4]
    tot['n'] += n; tot['low'] += low
    print('  %s: 星5=%d 星4=%d 星3=%d 星2=%d 星1=%d 計=%d 星1〜3=%d（%.1f%%）' % (w, *v, n, low, 100.0 * low / n))
print('  5作品の合計: 計=%d 星1〜3=%d（%.1f%%）' % (tot['n'], tot['low'], 100.0 * tot['low'] / tot['n']))
rows = {}
for line in open(CODES, encoding='utf8'):
    m = re.match(r'\|\s*(\d+)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|', line)
    if m: rows[int(m.group(1))] = [x.strip() for x in m.groups()]
MOVE = [110, 113, 119, 121, 149, 150, 166, 229]  # 判定役が原文で読んで「始め直し（周回・やり直し）に触れていない」とした 周 の口コミ
def tally(ids):
    c = collections.Counter(k for i in ids for k in rows[i][3].split() if k != '-')
    return ', '.join('%s=%d' % kv for kv in c.most_common())
shu = [i for i, r in rows.items() if r[2] == '周']
print('2) 周 の数え直し')
print('  元のコード: 周=%d件 楽しみ: %s' % (len(shu), tally(shu)))
shu2 = [i for i in shu if i not in MOVE]
print('  %d件（#%s）を 長 に移すと: 周=%d件 楽しみ: %s' % (len(MOVE), ' #'.join(map(str, MOVE)), len(shu2), tally(shu2)))
