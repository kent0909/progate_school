#!/usr/bin/env python3
"""BIZ-FILL-RAMEN 版1.1 の再検査（docs/audit/BIZ-FILL-RAMEN-reasoning.md の「版1.1の再検査」）の検算。
書き手：論証検査役。版1.1 の書き手のスクリプト（fill-ramen-*-v2.py）は別に走らせ直し、出力が保存の .out.txt と同じことを確かめた。
ここでは、版1.1 の数のうち結論を左右するものを、作り方を変えて出し直す。外部には取りに行かない。
 G1. オーナーの例の格子（2.7）：書き手と同じ格子を組み直して 6,550・11 を再現し、
     (a) 資料のない端を外した上で銀座の雇う人時を+8・+16・+24時間にした時、(b) 端の外し方を両側でそろえた時、
     (c) 格子の中の店主の取り分の刻みを変えた時、の割合を出す（割合が格子の作り方でどれだけ動くか）
 G2. 場所だけの差（2.5）：奥多摩の家賃を広さに比例させた時の比と、比でなく杯数の差で見た時
 G3. こづかいの土日÷平日を、書き手の作り方（祝日を土日に、年末年始を除く）で自分で出し直す
 G4. お盆の日（平日に当たる 8/13〜15）の値を、8月の土日・ふつうの平日と比べる（「お盆＝帰省」の名の根拠になるか）
 G5. 検索の記録（research/searches/fill-ramen.jsonl）：検索先の内訳と、項目ごとの検索の数
 G6. 「検査役の筋から採ったもの」の章の語句が原文に出るか
 G7. 検査書の「版1.1の再検査」の判定の列を数える
使い方: python3 -I boki2/docs/analysis/fill-ramen-reasoning-recheck-v2.py
"""
import unicodedata, os, re, json, itertools, statistics, subprocess, datetime, html, collections
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
RAWM = os.path.join(ROOT, 'research', 'raw', 'web', 'bizmgmt')
RAWR = os.path.join(ROOT, 'research', 'raw', 'web', 'ramen')
TOOL = os.path.join(ROOT, 'tools', 'sheet-text.py')
REP = os.path.join(ROOT, 'docs', 'BIZ-FILL-RAMEN.md')
AUDIT = os.path.join(ROOT, 'docs', 'audit', 'BIZ-FILL-RAMEN-reasoning.md')

# ---------------------------------------------------------------- G1
W, TSUBO = 1280, 58.6 / 3.305785
def month(cups, p, rent_m, hours, other, debt, owner, days, cost):
    return cups * days * p * (1 - cost) - (rent_m + hours * days * W + other + debt + owner)
H = (0, 4, 8, 12, 16, 24); OWN = (0, 50000, 100000, 150000, 200000, 300000)
OTHER = (150000, 200000, 250000); DEBT = (0, 80000); COST = (0.30, 0.35); DAYS = (22, 25)
def grid(gprices, gtsubo, oprices, orents, delta=0, own=OWN, areas=(10, TSUBO)):
    n = hit = 0
    for h, ow, ot, de, co, da in itertools.product(H, own, OTHER, DEBT, COST, DAYS):
        for gp, gt, ga in itertools.product(gprices, gtsubo, areas):
            g = month(100, gp, gt * ga, h + delta, ot, de, ow, da, co) < 0
            for op, orr in itertools.product(oprices, orents):
                n += 1
                if g and month(30, op, orr, h, ot, de, ow, da, co) >= 0: hit += 1
    return n, hit
print('# BIZ-FILL-RAMEN 版1.1 の再検査の検算（fill-ramen-reasoning-recheck-v2.py）\n')
print('## G1. オーナーの例の格子（版1.1 の 2.7 と同じ格子を組み直す）')
GP_ALL, GT_ALL = (617, 800, 1000, 1300, 1500), (36250, 42497, 85000)
OP, OR = (747, 890, 1000), (0, 30000, 60000, 100000)
n, h = grid(GP_ALL, GT_ALL, OP, OR); print(f'  再現：全部の端を入れる {n:,}通り中 {h:,}（{h/n*100:.2f}%）［書き手 311,040中 6,550］')
n, h = grid((800, 1000, 1300, 1500), (36250, 42497), OP, OR); print(f'  再現：銀座800円以上・坪2つ {n:,}通り中 {h:,}（{h/n*100:.3f}%）［書き手 165,888中 11］')
print('  (a) 端を外したまま、銀座の雇う人時を奥多摩より多くする（100杯と30杯で人の要る量が違う）：')
for d in (8, 16, 24):
    n, h = grid((800, 1000, 1300, 1500), (36250, 42497), OP, OR, delta=d)
    print(f'     +{d}時間：{n:,}通り中 {h:,}（{h/n*100:.2f}%）')
print('  (b) 端の外し方を両側でそろえる（資料の無い値は銀座の1,300・1,500円も同じ。奥多摩の家賃0＝持ち家も資料が無い）：')
for lab, gp, orr in (('銀座800・1,000円だけ、奥多摩の家賃は全部', (800, 1000), OR), ('銀座800・1,000円だけ、奥多摩の家賃0を外す', (800, 1000), (30000, 60000, 100000)),
                     ('銀座800〜1,500円、奥多摩の家賃0を外す', (800, 1000, 1300, 1500), (30000, 60000, 100000))):
    for d in (0, 16):
        n, h = grid(gp, (36250, 42497), OP, orr, delta=d)
        print(f'     {lab}・雇う人時+{d}：{n:,}通り中 {h:,}（{h/n*100:.2f}%）')
print('  (c) 店主の取り分の刻みだけを変える（端を外し、人時の差0）：')
for lab, own in (('0・5・10・15・20・30万（書き手）', OWN), ('0・15・30万', (0, 150000, 300000)), ('15・30万（店主が暮らせる額だけ）', (150000, 300000)), ('0だけ', (0,))):
    n, h = grid((800, 1000, 1300, 1500), (36250, 42497), OP, OR, own=own)
    print(f'     {lab}：{n:,}通り中 {h:,}（{h/n*100:.3f}%）')
print('  (d) 「ふつうの形」の1点：銀座 1,000円・坪42,497・17.7坪・アルバイト2人（16時間）・店主15万、奥多摩 890円・家賃6万・家族（0時間）・店主15万、その他20万・返済8万・原価30%・25日')
g = month(100, 1000, 42497 * TSUBO, 16, 200000, 80000, 150000, 25, 0.30); o = month(30, 890, 60000, 0, 200000, 80000, 150000, 25, 0.30)
print(f'     銀座 {g/1e4:+.1f}万・奥多摩 {o/1e4:+.1f}万 → 両方成り立つ：{g < 0 and o >= 0}')
o15 = month(30, 890, 60000, 0, 150000, 80000, 150000, 25, 0.30)
print(f'     奥多摩のその他を15万にすると {o15/1e4:+.1f}万')

# ---------------------------------------------------------------- G2
print('\n## G2. 場所だけの差（版1.1 の 2.5）：比は共通の固定費で動く。杯数の差で見る')
def be(p, rent_m, hours, other, debt):
    return (rent_m + hours * 25 * W + other + debt) / (25 * p * 0.7)
print('| 人・値段 | 広さ | 銀座 | 奥多摩6万（固定） | 比 | 奥多摩を坪6,000円×広さ | 比 | 杯数の差（家賃6万） |')
print('|---|---|---|---|---|---|---|---|')
for hrs, p in ((16, 1000), (0, 1000), (8, 890), (16, 747)):
    for area in (10, TSUBO):
        gb = be(p, 42497 * area, hrs, 250000, 80000); ob = be(p, 60000, hrs, 250000, 80000); ob2 = be(p, 6000 * area, hrs, 250000, 80000)
        print(f'| {hrs}時間・{p}円 | {area:.1f}坪 | {gb:.0f} | {ob:.0f} | {gb/ob:.2f} | {ob2:.0f} | {gb/ob2:.2f} | {gb-ob:.0f} |')
for other in (150000, 250000, 350000):
    gb = be(1000, 42497 * TSUBO, 0, other, 80000); ob = be(1000, 60000, 0, other, 80000)
    print(f'  人0・1,000円・17.7坪で共通のその他を{other//10000}万円：比 {gb/ob:.2f}・差 {gb-ob:.0f}杯')

# ---------------------------------------------------------------- G3・G4
HOL = {(1, 1), (1, 13), (2, 11), (2, 23), (2, 24), (3, 20), (4, 29), (5, 3), (5, 4), (5, 5), (5, 6), (7, 21), (8, 11), (9, 15), (9, 23), (10, 13), (11, 3), (11, 23), (11, 24)}
NEN = {(12, 29), (12, 30), (12, 31), (1, 1), (1, 2), (1, 3)}
CACHE = {}
def rowv(m, item, prefix):
    f = os.path.join(RAWM, f'r6-fc-estat-kakei-hibetsu-2025{m:02d}.html')
    if f not in CACHE: CACHE[f] = subprocess.run(['python3', '-I', TOOL, f], capture_output=True, text=True).stdout
    sheet = None
    nd = (datetime.date(2025 + (m == 12), m % 12 + 1, 1) - datetime.date(2025, m, 1)).days
    for line in CACHE[f].split('\n'):
        if line.startswith('# '): sheet = line[2:]; continue
        c = line.split('\t')
        if sheet and sheet.startswith(prefix) and len(c) > 13 and c[11].strip() == item and c[12] == '円':
            return [float(x) for x in c[13:] if x.strip() != ''][:nd]
print('\n## G3. こづかい(使途不明) の土日÷平日を、書き手の作り方（祝日とお盆の土日を土日の側、年末年始を除く）で出し直す')
for prefix in ('二人', '勤労'):
    for item in ('こづかい(使途不明)', '中華そば'):
        we, wd, we2, wd2 = [], [], [], []
        for m in range(1, 13):
            for i, x in enumerate(rowv(m, item, prefix)):
                d = datetime.date(2025, m, i + 1); md = (m, d.day)
                if md in NEN: continue
                hol = d.weekday() >= 5 or md in HOL
                (we if hol else wd).append(x)
                if d.weekday() >= 5 and md not in HOL: we2.append(x)
                elif d.weekday() < 5 and md not in HOL: wd2.append(x)
        print(f'  {prefix}・{item}：土日祝÷平日 {statistics.mean(we)/statistics.mean(wd):.2f}（書き手の作り方）／土日だけ÷平日 {statistics.mean(we2)/statistics.mean(wd2):.2f}')
print('\n## G4. お盆の日（2025年 8/13〜15 は水〜金）を8月の土日・ふつうの平日と比べる（二人以上・中華そば）')
v = rowv(8, '中華そば', '二人')
obon_wd = [v[d - 1] for d in (13, 14, 15)]; sat16 = v[15]
aug_we = [v[i] for i in range(31) if datetime.date(2025, 8, i + 1).weekday() >= 5 and i + 1 != 16]
aug_wd = [v[i] for i in range(31) if datetime.date(2025, 8, i + 1).weekday() < 5 and (8, i + 1) not in HOL and i + 1 not in (13, 14, 15)]
print(f'  お盆の平日3日の平均 {statistics.mean(obon_wd):.1f}円、8月の土日（16日を除く）{statistics.mean(aug_we):.1f}円、8月のふつうの平日 {statistics.mean(aug_wd):.1f}円')
print(f'  お盆の平日÷ふつうの平日 {statistics.mean(obon_wd)/statistics.mean(aug_wd):.2f}、8月の土日÷ふつうの平日 {statistics.mean(aug_we)/statistics.mean(aug_wd):.2f}')
print('  → お盆の平日は8月の土日とほぼ同じ高さ。この表からは「休みの日」と「帰省」を分けられない（帰省先で使ったかも分からない）')

# ---------------------------------------------------------------- G5
print('\n## G5. 検索の記録（research/searches/fill-ramen.jsonl）')
recs = [json.loads(l) for l in open(os.path.join(ROOT, 'research', 'searches', 'fill-ramen.jsonl'), encoding='utf8')]
eng = collections.Counter(r['query'].split('：')[0] for r in recs)
print(f'  行 {len(recs)}、検索先 {dict(eng)}')
per = collections.Counter(re.sub(r'^BIZ-FILL-RAMEN 1\.1 ', '', r.get('item', '')) for r in recs)
print(f'  項目ごとの検索の数の分布：{dict(sorted(collections.Counter(per.values()).items()))}（{len(per)}項目の記録）')
print('  検索1回だけで「埋まらず（探したが無い）」とした項目：', sorted(k for k, c in per.items() if c == 1))
rs = open(REP, encoding='utf8').read()
sec4 = rs.split('## 4. 上位30の外の項目', 1)[1].split('### 判定書から足した項目', 1)[0]
q4 = [len(re.findall(r'q-[a-z0-9-]+', l)) for l in sec4.split('\n') if re.match(r'^\| [MR]\d', l) and '探したが無い' in l]
print(f'  4章の「埋まらず（探したが無い）」{len(q4)}行が指す検索の数：{dict(sorted(collections.Counter(q4).items()))}')

import glob as _g
_n = _o = 0
for f in sorted(_g.glob(os.path.join(RAWR, 'r7-fill-q-js-*'))):
    t = open(f, encoding='utf8', errors='ignore').read()
    m = re.search(r'<opensearch:totalResults>(\d+)<', t) or re.search(r'totalResults[^0-9]{0,5}(\d+)', t)
    k = len(re.findall(r'<entry>', t))
    if m: _n += 1; _o += int(m.group(1)) > k
print(f'  J-STAGE の検索の結果の一覧 {_n}本のうち、総数が一覧に載った件数（上位の打ち切り）を超えるもの {_o}本')
_src = open(os.path.join(ROOT, 'docs', 'analysis', 'fill-ramen-region-v2.py'), encoding='utf8').read()
print('  2.7 の格子の営業日（スクリプト）：', re.search(r"days=\(([^)]*)\)", _src).group(1), '／本文の2.7の表：', '20/25日' if '20/25日' in rs.split('### 2.7', 1)[1][:800] else '?')

# ---------------------------------------------------------------- G6
print('\n## G6. 「検査役の筋から採ったもの」の章の語句が原文に出るか')
sec = rs.split('## 検査役の筋から採ったもの', 1)[1].split('\n## ', 1)[0]
rows = [l for l in sec.split('\n') if l.startswith('| ') and not l.startswith('| 検査書の番号') and not l.startswith('|---')]
print(f'  行 {len(rows)}')
TXT = {}
def raw_text(coll, doc):
    key = (coll, doc)
    if key in TXT: return TXT[key]
    d = os.path.join(ROOT, 'research', 'raw', 'web', coll)
    fs = [f for f in os.listdir(d) if f.startswith(doc + '.')]
    t = ''
    if fs:
        p = os.path.join(d, fs[0]); head = open(p, 'rb').read(8)
        if head.startswith(b'%PDF'): t = subprocess.run(['pdftotext', '-layout', p, '-'], capture_output=True, text=True).stdout
        elif head[:2] == b'PK': t = subprocess.run(['python3', '-I', TOOL, p], capture_output=True, text=True).stdout
        else:
            t = open(p, encoding='utf8', errors='ignore').read(); t = re.sub(r'<script.*?</script>|<style.*?</style>', '', t, flags=re.S); t = html.unescape(re.sub(r'<[^>]+>', '', t))
    TXT[key] = re.sub(r'\s+', '', unicodedata.normalize('NFKC', t)); return TXT[key]
n_ph = n_ok = 0; no_phrase = 0; no_out = 0
for l in rows:
    ph = re.findall(r'\[\[web:([\w-]+):([\w-]+)\|「([^」]+)」\]\]', l)
    c = [x.strip() for x in re.sub(r'\[\[[^\]]*\]\]', 'X', l).strip().strip('|').split('|')]
    if not ph: no_phrase += 1
    if c[2].startswith('なし'): no_out += 1
    for coll, doc, p in ph:
        n_ph += 1; ok = re.sub(r'\s+', '', unicodedata.normalize('NFKC', p)) in raw_text(coll, doc); n_ok += ok
        if not ok: print(f'   原文に見つからない：{doc}「{p}」')
print(f'  語句 {n_ph}、原文に出る {n_ok}。語句の無い行 {no_phrase}、出力の行が「なし」の行 {no_out}')

# ---------------------------------------------------------------- G7
print('\n## G7. 検査書「版1.1の再検査」の判定の数')
if os.path.exists(AUDIT):
    s = open(AUDIT, encoding='utf8').read()
    if '## 8. 版1.1の再検査' in s:
        p = s.split('## 8. 版1.1の再検査', 1)[1]
        kr = p.split('### 8.2', 1)[0]
        kv = collections.Counter(); kn = 0
        for l in kr.split('\n'):
            m = re.match(r'^\| (K\d\d) \| ([^|]+) \| ([^|]+) \|', l)
            if m: kn += 1; kv[m.group(3).strip()] += 1
        print(f'  8.1 K の応え（1.0 で不当・弱いの42行）：{kn}行 {dict(kv)}')
        nr = p.split('### 8.2', 1)[1].split('### 8.3', 1)[0] if '### 8.2' in p else ''
        vs = collections.Counter(); nn = 0
        for l in nr.split('\n'):
            if re.match(r'^\| N\d\d', l):
                c = [x.strip() for x in l.strip().strip('|').split('|')]; nn += 1; vs[c[-2]] += 1
        print(f'  8.2 版1.1 の結論：{nn}行 {dict(vs)}')
        print('  判定の語が3つ以外：', [k for k in vs if k not in ('妥当', '弱い', '不当')] or 'なし')
    else: print('  まだ無い')
