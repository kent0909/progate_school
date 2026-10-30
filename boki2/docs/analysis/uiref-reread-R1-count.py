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
print('3) uiref-reread-R1.md の3章の表の行を、「向き」の列の頭の語で数える（反する・悪い面／支える／新しい）')
md = open(os.path.join(here, 'uiref-reread-R1.md'), encoding='utf8').read()
sec = md[md.index('## 3. '):md.index('## 4. ')]
cnt, per = collections.Counter(), collections.Counter()
cur = None
for line in sec.split('\n'):
    if line.startswith('### '): cur = line[4:].split('（')[0].strip(); continue
    if not line.startswith('| ') or line.startswith('| #') or line.startswith('|---'): continue
    line = re.sub(r'\[\[web:uiref:([^|\]]+)\|', r'[[web:uiref:\1¦', line)  # 出典の中の | を外す
    cells = [x.strip() for x in line.strip('|').split('|')]
    # 3.0 は「文書」の列が1つ多い。出典の列（[[web:）の次が向き
    i = next(k for k, x in enumerate(cells) if x.startswith('[[web:'))
    head = cells[i + 1][:3]
    key = '反する' if head.startswith('反する') else '支える' if head.startswith('支える') else '新しい' if head.startswith('新しい') else '？' + head
    cnt[key] += 1; per[(cur, key)] += 1
    if '反する' in cells[i + 1]: cnt['反するを含む'] += 1
    if cur and cur.startswith('3.0'): cnt['判定書から'] += 1
for k in ['反する', '支える', '新しい']: print(f'   {k}\t{cnt[k]}')
others = {k: v for k, v in cnt.items() if k not in ('反する', '支える', '新しい', '反するを含む', '判定書から')}
if others: print('   ほか', others)
print('   計', cnt['反する'] + cnt['支える'] + cnt['新しい'], '行')
print('   向きの列のどこかに「反する」がある行（頭が支える・新しいでも）', cnt['反するを含む'])
print('   うち 3.0 判定書から', cnt['判定書から'], '行')
