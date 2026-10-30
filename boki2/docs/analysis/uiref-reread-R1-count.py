#!/usr/bin/env python3
# 読み直し R1（2026-10-30）の数を出す。頭で数えないため（QUALITY 6.2）。
# 使い方: python3 -I boki2/docs/analysis/uiref-reread-R1-count.py
# 1) A の APPLION 8ページ（uA-applion-*）の口コミのうち、紹介コード（英数字8字前後のコード＋「入力」「コード」）を含むものの数と、
#    同じ本文の使い回し（先頭60字が同じ）の数。みんなの銀行・おぢポの声を根拠に使うときの割り引きの大きさを見るため
# 2) uiref-B-voices.tsv の R1 の行の W（待たされる）を、メモ列の「W（…）」の中身で分けて数える
import re, html, glob, os, collections
here = os.path.dirname(os.path.abspath(__file__))
raw = os.path.join(here, '..', '..', 'research', 'raw', 'web', 'uiref')
code = re.compile(r'(?<![A-Za-z0-9])[A-Za-z0-9]{8}(?![A-Za-z0-9])')
print('1) 紹介コードつきの口コミ（APPLION 1ページ目）')
for f in sorted(glob.glob(os.path.join(raw, 'uA-applion-*.html'))):
    t = open(f, encoding='utf8').read()
    rs = []
    for m in re.finditer(r'<div class="review_comment">(.*?)<div class="foot"><p>(.*?)</p></div>', t, re.S):
        txt = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', m.group(1))))
        rs.append(txt)
    promo = [r for r in rs if ('コード' in r or '入力' in r or '招待' in r) and any(re.search(r'[A-Z0-9]', c) and re.search(r'[A-Za-z]', c) and not re.fullmatch(r'[A-Z][a-z]+', c) for c in code.findall(r))]  # 「Duolingo」のような頭だけ大文字の語はコードでない
    # 使い回し：コードと記号・空白を除いた本文で、40字の同じ断片を別の口コミと共有している口コミの数
    cl = [re.sub(r'[A-Za-z0-9\s【】「」\[\]（）()‎ ️]', '', r) for r in rs]
    gs = [set(x[i:i+40] for i in range(0, max(0, len(x) - 39))) for x in cl]
    dup = sum(1 for i in range(len(rs)) if any(gs[i] & gs[j] for j in range(len(rs)) if j != i))
    print(f'   {os.path.basename(f)[:-5]}\t口コミ {len(rs)}\t紹介コードつき（「コード・入力・招待」の語と英数字8字の両方があるもの。下限） {len(promo)}\t別の口コミと40字の同じ断片を持つ（使い回し） {dup}')
print('2) R1 で足した W の中身（tsv のメモ列）')
c = collections.Counter()
for line in open(os.path.join(here, 'uiref-B-voices.tsv'), encoding='utf8'):
    if not line.startswith('#R1\t'): continue
    p = line.rstrip('\n').split('\t')
    if 'W' in p[3].split(';'):
        m = re.search(r'W（([^）]*)）', p[6]); c[m.group(1) if m else '（メモなし）'] += 1
for k, n in c.most_common(): print(f'   {k}\t{n}')
print('   計', sum(c.values()))
