#!/usr/bin/env python3
"""BIZ-FILL-RAMEN 版1.2 の再検査（docs/audit/BIZ-FILL-RAMEN-reasoning.md の9章）の検算。書き手：論証検査役。外部には取りに行かない。
 H1. 2.7 の格子の表（端の外し方3通り×人時の差 0/8/16/24）を、書き手と別に組み直す（検査役の8.4の「5%未満」が誤りかを確かめる）
 H2. お盆の平日÷8月のふつうの平日（書き手の取り方：お盆と前後の日を除く）と、8月の土日祝の比
 H3. 版1.2 で新しく引かれた r8-fill の語句が原文に出るか
 H4. WebSearch の記録（43行）：取得した数、結果に数が見えたのに取っていない行、後から書いた記録の行
 H5. 9章の判定の列を数える
使い方: python3 -I boki2/docs/analysis/fill-ramen-reasoning-recheck-v3.py
"""
import os, re, json, itertools, statistics, subprocess, datetime, html, unicodedata, collections
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
RAWM = os.path.join(ROOT, 'research', 'raw', 'web', 'bizmgmt'); RAWR = os.path.join(ROOT, 'research', 'raw', 'web', 'ramen')
TOOL = os.path.join(ROOT, 'tools', 'sheet-text.py'); REP = os.path.join(ROOT, 'docs', 'BIZ-FILL-RAMEN.md')
AUDIT = os.path.join(ROOT, 'docs', 'audit', 'BIZ-FILL-RAMEN-reasoning.md')
print('# BIZ-FILL-RAMEN 版1.2 の再検査の検算（fill-ramen-reasoning-recheck-v3.py）\n')

# H1
W, TSUBO = 1280, 58.6 / 3.305785
def month(cups, p, rent_m, hours, other, debt, owner, days, cost):
    return cups * days * p * (1 - cost) - (rent_m + hours * days * W + other + debt + owner)
H = (0, 4, 8, 12, 16, 24); OWN = (0, 50000, 100000, 150000, 200000, 300000)
SH = list(itertools.product(H, OWN, (150000, 200000, 250000), (0, 80000), (0.30, 0.35), (22, 25)))
def grid(gp, gt, op, orr, d):
    n = hit = 0
    for h, ow, ot, de, co, da in SH:
        for p, t, a in itertools.product(gp, gt, (10, TSUBO)):
            if month(100, p, t * a, h + d, ot, de, ow, da, co) >= 0:
                n += len(op) * len(orr); continue
            for q, r in itertools.product(op, orr):
                n += 1; hit += month(30, q, r, h, ot, de, ow, da, co) >= 0
    return n, hit
print('## H1. 2.7 の格子（営業22/25日）')
rows = (('外さない', (617, 800, 1000, 1300, 1500), (36250, 42497, 85000), (0, 30000, 60000, 100000)),
        ('銀座の低い側だけ外す', (800, 1000, 1300, 1500), (36250, 42497), (0, 30000, 60000, 100000)),
        ('両側の資料の無い端を外す', (800, 1000), (36250, 42497), (30000, 60000, 100000)))
print('| 端の外し方 | +0 | +8 | +16 | +24 |'); print('|---|---|---|---|---|')
mx = 0
for lab, gp, gt, orr in rows:
    cells = []
    for d in (0, 8, 16, 24):
        n, h = grid(gp, gt, (747, 890, 1000), orr, d); cells.append(f'{h/n*100:.2f}%'); mx = max(mx, h / n * 100)
    print(f'| {lab} | ' + ' | '.join(cells) + ' |')
print(f'  表の最大 {mx:.2f}%。検査役の8.4の「どの置き方でも5%未満」は +24時間の行で成り立たない')

# H2
HOL = {(1, 1), (1, 13), (2, 11), (2, 23), (2, 24), (3, 20), (4, 29), (5, 3), (5, 4), (5, 5), (5, 6), (7, 21), (8, 11), (9, 15), (9, 23), (10, 13), (11, 3), (11, 23), (11, 24)}
t = subprocess.run(['python3', '-I', TOOL, os.path.join(RAWM, 'r6-fc-estat-kakei-hibetsu-202508.html')], capture_output=True, text=True).stdout
sheet = None; v = None
for line in t.split('\n'):
    if line.startswith('# '): sheet = line[2:]; continue
    c = line.split('\t')
    if sheet and sheet.startswith('二人') and len(c) > 13 and c[11].strip() == '中華そば' and c[12] == '円':
        v = [float(x) for x in c[13:] if x.strip() != ''][:31]; break
ob = [v[d - 1] for d in (13, 14, 15)]
excl = {8, 12, 13, 14, 15, 16, 18, 19}
wd = [v[i] for i in range(31) if datetime.date(2025, 8, i + 1).weekday() < 5 and (8, i + 1) not in HOL and i + 1 not in excl]
we = [v[i] for i in range(31) if (datetime.date(2025, 8, i + 1).weekday() >= 5 or (8, i + 1) in HOL) and i + 1 not in (13, 14, 15, 16)]
print('\n## H2. お盆の平日（8/13〜15）と8月の土日祝（お盆を除く）を、8月のふつうの平日（お盆と前後の 8/8・8/12・8/18・8/19 を除く）で割る')
print(f'  お盆の平日 {statistics.mean(ob):.1f}円 ÷ ふつうの平日 {statistics.mean(wd):.1f}円 ＝ {statistics.mean(ob)/statistics.mean(wd):.2f}、土日祝 {statistics.mean(we):.1f}円 ＝ {statistics.mean(we)/statistics.mean(wd):.2f}')

# H3
print('\n## H3. 版1.2 の r8-fill の語句が原文に出るか')
rs = open(REP, encoding='utf8').read()
def raw_text(doc):
    fs = [f for f in os.listdir(RAWR) if f.startswith(doc + '.')]
    if not fs: return None
    p = os.path.join(RAWR, fs[0]); head = open(p, 'rb').read(8)
    if head.startswith(b'%PDF'): x = subprocess.run(['pdftotext', '-layout', p, '-'], capture_output=True, text=True).stdout
    else:
        x = open(p, encoding='utf8', errors='ignore').read(); x = re.sub(r'<script.*?</script>|<style.*?</style>', '', x, flags=re.S); x = html.unescape(re.sub(r'<[^>]+>', '', x))
    return re.sub(r'\s+', '', unicodedata.normalize('NFKC', x))
ph = sorted(set(re.findall(r'\[\[web:ramen:(r8-fill-[\w-]+)\|「([^」]+)」\]\]', rs)))
ok = 0
for d, p in ph:
    tx = raw_text(d); hit = tx is not None and re.sub(r'\s+', '', unicodedata.normalize('NFKC', p)) in tx; ok += hit
    if not hit: print(f'   見つからない：{d}「{p}」')
print(f'  語句 {len(ph)}、原文に出る {ok}')

# H4
print('\n## H4. WebSearch の記録')
R = [json.loads(l) for l in open(os.path.join(ROOT, 'research', 'searches', 'fill-ramen.jsonl'), encoding='utf8')]
Wr = [r for r in R if r['query'].startswith('WebSearch')]
used = sum(1 for r in Wr if r.get('used')); post = sum(1 for r in Wr if '記録を書いた時刻' in r.get('note', ''))
seen = [r['item'].replace('BIZ-FILL-RAMEN 1.2 ', '') for r in Wr if re.search(r'[0-9]+(万円|円|%|％)', r.get('note', '')) and not r.get('used')]
print(f'  行 {len(Wr)}、取得して使った行 {used}、「時刻は記録を書いた時刻」と書かれた行 {post}、結果の一覧の保存（fetched）がある行 {sum(1 for r in Wr if r.get("fetched"))}')
print(f'  結果の要約に数が見えたのに取得していない行：{len(seen)} {seen}')
sec4 = rs.split('## 4. 上位30の外の項目', 1)[1].split('### 判定書から足した項目', 1)[0]
r9 = [l for l in sec4.split('\n') if l.startswith('| R9 ')][0]
print('  R9 の行：判定「' + ('実務の資料も探して無し' if '実務の資料も探して無し' in r9 else '?') + '」、同じ行に「約100万円とする国会の発言の報道は取得していない」：', '取得していない' in r9)

# H5
print('\n## H5. 9章の判定の数')
s = open(AUDIT, encoding='utf8').read()
if '## 9. 版1.2の再検査' in s:
    p = s.split('## 9. 版1.2の再検査', 1)[1]
    a = p.split('### 9.2', 1)[0]; b = p.split('### 9.2', 1)[1].split('### 9.3', 1)[0]
    ca = collections.Counter(re.match(r'^\| ([NK]\d\d) \| [^|]+ \| ([^|]+) \|', l).group(2).strip() for l in a.split('\n') if re.match(r'^\| [NK]\d\d \|', l))
    cb = collections.Counter([x.strip() for x in l.strip().strip('|').split('|')][-2] for l in b.split('\n') if re.match(r'^\| P\d\d', l))
    print(f'  9.1 8.5の11項目への応え：{sum(ca.values())}行 {dict(ca)}')
    print(f'  9.2 変わった結論：{sum(cb.values())}行 {dict(cb)}')
else:
    print('  まだ無い')
