#!/usr/bin/env python3
# 経営シム（カイロソフト3作と Good Pizza, Great Pizza）の口コミ643件を全件読んで付けたコード（replay-mgmt-voices-codes.tsv）を数える（BIZ-REPLAY 版0.3）
# 版0.2は「周」「週」の字を含む34件だけを読んだ。版0.3は643件すべてを全文で読み、周回の関係・中身・目標に届いた周を付け直した
# 原文は BIZ-FUNVISUAL の担当が取得した APPLION の口コミのページ（research/raw/web/simgames/r5-fv-applion-*）
# 使い方：python3 -I boki2/docs/analysis/replay-mgmt-voices.py            … 集計（判定役の数との食い違いを件番号で出す）
#         python3 -I boki2/docs/analysis/replay-mgmt-voices.py --dumpall  … 643件を番号つきで全文（コードを付けるために読む用）
import re, html, os, sys, collections, difflib
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'research', 'raw', 'web', 'simgames')
CODES = os.path.join(ROOT, 'docs', 'analysis', 'replay-mgmt-voices-codes.tsv')
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
for i, u in enumerate(U, 1):
    u['all'] = i
if '--dumpall' in sys.argv:
    for u in U:
        print('@%d [%s] %s ★%d | %s | %s' % (u['all'], u['work'], u['page'], u['stars'], u['title'], re.sub(r'\s*\n\s*', ' / ', u['body'])))
    sys.exit()
txt = lambda u: re.sub(r'\s+', ' ', u['title'] + ' ' + u['body'])
C = {}
for n, line in enumerate(open(CODES, encoding='utf8')):
    f = line.rstrip('\n').split('\t')
    if n == 0: continue
    C[int(f[0])] = dict(zip(['work', 'rel', 'code', 'count', 'goal', 'round', 'memo'], f[1:]))
print('1) 読んだ範囲')
print('  切り出した口コミ：%d 件（重複を除く前 %d 件）。コードのある件：%d 件（番号 %d〜%d）' % (len(U), len(A), len(C), min(C), max(C)))
miss = [u['all'] for u in U if u['all'] not in C]
bad = [u['all'] for u in U if u['all'] in C and C[u['all']]['work'] != u['work']]
print('  コードのない件：', miss or 'なし', '／作品名の食い違い：', bad or 'なし')
W = [w for w, _ in WORKS]
print('  作品ごと：', ', '.join('%s=%d' % (w, sum(1 for u in U if u['work'] == w)) for w in W))
print('  星の内訳：', dict(collections.Counter(u['stars'] for u in U)), '（APPLION の口コミのページに載っていたもの。ほぼ星5に偏る）')
def by_work(ids):
    c = collections.Counter(C[i]['work'] for i in ids)
    return ', '.join('%s=%d' % (w, c[w]) for w in W if c[w])
def tally(ids, key):
    c = collections.Counter(k for i in ids for k in C[i][key].split() if k != '-')
    return ', '.join('%s=%d' % kv for kv in sorted(c.items(), key=lambda kv: (-kv[1], kv[0])))
HIT = re.compile(r'[周週]')
hit = {u['all'] for u in U if HIT.search(txt(u))}
shu = [i for i in sorted(C) if C[i]['rel'] == '周']
sai = [i for i in sorted(C) if C[i]['rel'] == '再']
print('2) 周回の関係（全643件）')
print('  周（この作品で始め直した・2周目以降・周の回数・周回の仕組みに触れた。意向を含む）：%d 件（%s）' % (len(shu), by_work(shu)))
print('    うち「周」「週」の字を含まない件：%d 件 #%s' % (len([i for i in shu if i not in hit]), ' #'.join(str(i) for i in shu if i not in hit)))
print('  再（時間をおいて・別の機種で遊び直した。周回かは区切れない）：%d 件（%s）' % (len(sai), by_work(sai)))
print('  「周」「週」の字を含むのに周回の話でない件：%d 件 #%s' % (len([i for i in sorted(hit) if C[i]['rel'] == '-']), ' #'.join(str(i) for i in sorted(hit) if C[i]['rel'] == '-')))
print('  「周」「週」の字を含み 再 とした件：#%s' % ' #'.join(str(i) for i in sorted(hit) if C[i]['rel'] == '再'))
print('  周 の中身：', tally(shu, 'code'))
print('  周 の回数の申告：', ', '.join('#%d=%s' % (i, C[i]['count']) for i in shu if C[i]['count'] != '-'))
zk = [i for i in shu if C[i]['work'] == 'こだわりラーメン館 全国編']
print('  全国編の 周 は %d 件。全国編の「周回」は地方を変えて引き継いで続ける形（#261 #263 #269 が仕組みを書く）で、始めからやり直す周回とは別に数える' % len(zk))
print('    全国編を除く 周：%d 件（%s） 中身：%s' % (len(shu) - len(zk), by_work([i for i in shu if i not in zk]), tally([i for i in shu if i not in zk], 'code')))
print('3) 全643件の中身（周回に限らない）：', tally(sorted(C), 'code'))
for k in ['E', 'F', 'Q', 'S', 'T', 'x', 'D', 'V', 'H']:
    ids = [i for i in sorted(C) if k in C[i]['code'].split()]
    print('  %s：%d 件 #%s' % (k, len(ids), ' #'.join(map(str, ids))))
print('4) 目標（ゲーム発展国++ は大賞・グランプリ、ほかは全国制覇・最後のチャプターなど）に届いたか')
for w in W:
    ids = [i for i in sorted(C) if C[i]['work'] == w]
    g = collections.Counter(C[i]['goal'] for i in ids)
    print('  %s：届いた=%d 狙う=%d 言及=%d' % (w, g['届いた'], g['狙う'], g['言及']))
for w in W:
    got = [i for i in sorted(C) if C[i]['work'] == w and C[i]['goal'] == '届いた']
    if not got: continue
    r = collections.Counter(C[i]['round'] for i in got)
    print('  %s で届いた %d 件の周：1周目=%d 2周目以降=%d 書かない=%d' % (w, len(got), r['1周目'], r['2周目以降'], r['書かない']))
    for k in ['1周目', '2周目以降']:
        print('    %s：#%s' % (k, ' #'.join(str(i) for i in got if C[i]['round'] == k)))
print('5) 判定役（docs/audit/BIZ-REPLAY-audit-count.py の 3a・3b）との食い違い（判定役の語の条件をここで同じに組んで件番号を出し、コードと突き合わせる）')
REPLAY = re.compile(r'最初からやり直|最初からプレイ|やり直しても|２回目|2回目|引き継ぎ|リセットされる')
a3 = {u['all'] for u in U if not HIT.search(txt(u)) and REPLAY.search(txt(u))}
gd = {u['all'] for u in U if u['work'] == 'ゲーム発展国++' and re.search(r'グランプリ|大賞|賞とれ', txt(u))}
LATER = re.compile(r'2周目|２周目|2週目\+|苦節2週目|3周目|2周しまし|２回目')
FIRST = re.compile(r'1週目グランプリ|初プレイ|始めたばかりですが、グランプリ|初めてのカイロソフト|DLしてから約6時間|３日でグランプリ|2週目まだやってない|呆気なくグランプリ|一周目からそこそこ|約8時間でグランプリ|初日で8時間')
lat = {i for i in gd if LATER.search(txt(U[i - 1]))}
fst = {i for i in gd if FIRST.search(txt(U[i - 1])) and i not in lat}
mygd = {i for i in C if C[i]['work'] == 'ゲーム発展国++' and C[i]['goal'] == '届いた'}
print('  5a) 大賞・グランプリ：判定役は語で %d 件（2周目以降 %d・1周目 %d・書かない %d）。このコードの「届いた」は %d 件' % (len(gd), len(lat), len(fst), len(gd) - len(lat) - len(fst), len(mygd)))
for i in sorted(gd - mygd): print('     判定役にあってコードで「届いた」でない #%d：目標=%s メモ=%s' % (i, C[i]['goal'], C[i]['memo']))
for i in sorted(mygd - gd): print('     コードで「届いた」で判定役の語に当たらない #%d：メモ=%s' % (i, C[i]['memo']))
def lab(i):
    return '2周目以降' if i in lat else '1周目' if i in fst else '書かない'
for i in sorted(gd & mygd):
    if lab(i) != C[i]['round']: print('     周の読みが違う #%d：判定役=%s コード=%s メモ=%s' % (i, lab(i), C[i]['round'], C[i]['memo']))
print('     → 判定役の %d 件と「届いた」%d 件の差 %d 件は、上の「届いた」でない件（大賞を狙う・大賞に触れるだけ）' % (len(gd), len(mygd), len(gd) - len(mygd)))
old = set(shu) & hit
print('  5b) 周回の声：判定役は「周・週の字の %d 件のうち周回の話」+「字のない %d 件」で32件以上と見た。このコードの 周 は %d 件（字あり %d・字なし %d）、再 は %d 件' % (len(hit), len(a3), len(shu), len(old), len(shu) - len(old), len(sai)))
for i in sorted(a3): print('     判定役の字なし #%d：コード=%s（%s）' % (i, C[i]['rel'], C[i]['memo']))
for i in [i for i in shu if i not in hit and i not in a3]: print('     コードで字なしの 周 として足した #%d：%s' % (i, C[i]['memo']))
# 6) メモが原文の写しになっていないか（メモと本文の共通部分が30字未満か）
def lcs(a, b):
    best = 0; prev = [0] * (len(b) + 1)
    for x in a:
        cur = [0] * (len(b) + 1)
        for j, y in enumerate(b, 1):
            if x == y:
                cur[j] = prev[j - 1] + 1
                if cur[j] > best: best = cur[j]
        prev = cur
    return best
long = [i for i in sorted(C) if lcs(nn(C[i]['memo']), nn(txt(U[i - 1]))) >= 30]
print('6) メモと原文の共通部分が30字以上の件：', long or 'なし')
