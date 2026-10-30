# BIZ-RENT23 版0.2 の数（判定書 docs/audit/BIZ-RENT23-audit.md の H1・H2・M2・M4・M5・M6 と、論証の検査 R2・R4b に答える）。
# 頭で数えない（QUALITY 6.2）。版0.1 の rent23-land-match.py はそのまま残し（判定の再現に使ったため）、ここで直した作り方を足す。
# 使い方: python3 -I rent23-v02.py <jrei2026.tsv> <原文の文字のフォルダ>
#   jrei2026.tsv は rent23-jrei-addr.py の出力。原文の文字のフォルダは research/raw/web/rent23 の PDF を
#   pdftotext -layout、HTML をタグを外した <doc>.txt を置いたもの（引用の語句の照合に使う）
# 直したこと：
#   M6 地価公示（L01）と地価調査（L02）の同じ地点（15m 以内）を二重に数えない（L01 を残す）
#   H1 丁目の属性が同数のときの規則：同数の属性の地点のうち、地価がいちばん高い地点の属性にする。
#      あわせて、同数の割り当てを全部試した倍率の幅と、割り当てで中身が変わるセルを出す
import ast, collections, itertools, math, os, re, statistics as st, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
TSV, TXT = sys.argv[1], sys.argv[2]
# rent23-land-match.py の前半（地価の地点を読む・classify）をそのまま使う
_src = open(os.path.join(HERE, 'rent23-land-match.py'), encoding='utf8').read().split('def fit(')[0]
_g = {'__file__': os.path.join(HERE, 'rent23-land-match.py'), '__name__': 'lm'}
_argv = sys.argv; sys.argv = ['x', '/dev/null', '/dev/null']; exec(_src, _g); sys.argv = _argv
COM, KX, KY, ROOT = _g['COM'], _g['KX'], _g['KY'], _g['ROOT']
T975 = {7: 2.365, 8: 2.306, 21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064}


def dist(a, b):
    return math.hypot((a['lon'] - b['lon']) * KX, (a['lat'] - b['lat']) * KY) * 1000


L01 = [q for q in COM if q['src'] == 'L01']
COMD = L01 + [q for q in COM if q['src'] == 'L02' and not any(dist(q, p) <= 15 for p in L01)]
print(f'# 0. 商業地の地価の地点：重ねて数えたまま {len(COM)} → 15m 以内の L02 を除いて {len(COMD)}（除いた {len(COM) - len(COMD)}）')


def fit(pts):
    xs = [math.log10(p) for p, _ in pts]; ys = [math.log10(r) for _, r in pts]
    n = len(xs); mx = sum(xs) / n; my = sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs); sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys)); syy = sum((y - my) ** 2 for y in ys)
    b = sxy / sxx; se = math.sqrt((syy - b * sxy) / (n - 2) / sxx); t = T975.get(n - 2, 2.0)
    return b, b - t * se, b + t * se, sxy / math.sqrt(sxx * syy), my - b * mx


def theil(pts):
    s = [(math.log10(r2) - math.log10(r1)) / (math.log10(p2) - math.log10(p1)) for (p1, r1), (p2, r2) in itertools.combinations(pts, 2) if p1 != p2]
    return st.median(s)


BAND = lambda p: '100万未満' if p < 1e6 else '100〜300万' if p < 3e6 else '300〜1000万' if p < 1e7 else '1000万以上'
BANDS = ['1000万以上', '300〜1000万', '100〜300万', '100万未満']
TYPES = ['hanka', 'shogyo', 'office', 'shoten', 'jutaku', 'kojo']


def town_rows(pts_pool):
    rows = []
    for l in open(TSV, encoding='utf8'):
        c = l.rstrip('\n').split('\t')
        if len(c) < 6 or not re.match(r'(千代田|中央|港|新宿|渋谷|豊島)区', c[1]): continue
        town, rent, n = c[1], int(c[2]), int(c[3])
        if n < 5: continue
        hq = [q for q in pts_pool if q['addr'].startswith(town)]
        if not hq: continue
        cnt = collections.Counter(q['type'] for q in hq).most_common()
        top = [k for k, v in cnt if v == cnt[0][1]]
        # H1 の規則：同数なら、同数の属性の地点のうち地価のいちばん高い地点の属性
        rule = max((q for q in hq if q['type'] in top), key=lambda q: q['price'])['type'] if len(top) > 1 else top[0]
        rows.append({'town': town, 'rent': rent, 'n': n, 'lp': st.median(q['price'] for q in hq), 'pts': len(hq), 'cnt': cnt, 'top': top, 'rule': rule,
                     'desc': [(q['type'], q['price'], q['src'], q['desc']) for q in sorted(hq, key=lambda q: -q['price'])]})
    return rows


for label, pool in [('版0.1 と同じ（二重に数える）', COM), ('版0.2（二重の数えを除く）', COMD)]:
    A = town_rows(pool)
    pts = [(r['lp'], r['rent']) for r in A]
    b, lo, hi, rr, a = fit(pts)
    print(f'\n# 1. 資料A 2026春 {label}: n={len(A)} b={b:.3f}（{lo:.2f}〜{hi:.2f}） r={rr:.2f} Theil-Sen={theil(pts):.3f}  地価10倍→家賃{10 ** b:.2f}倍')
    print(f'   地価の側の測り違いがすべてと置いた上限（逆回帰 b/r²）={b / rr ** 2:.3f}')
    sub = [(r['lp'], r['rent']) for r in A if not r['town'].startswith('中央区銀座')]
    sub2 = [(r['lp'], r['rent']) for r in A if r['lp'] < 3e7]
    print(f"   銀座の丁目（{sum(r['town'].startswith('中央区銀座') for r in A)}）を外す: b={fit(sub)[0]:.3f}（n={len(sub)}）　地価3,000万未満だけ: b={fit(sub2)[0]:.3f}（n={len(sub2)}）")
    loo = [fit([(x['lp'], x['rent']) for x in A if x is not r])[0] for r in A]
    print(f'   1点ずつ抜く: {min(loo):.3f}〜{max(loo):.3f}')
    low = sorted(A, key=lambda r: r['lp'])[:3]
    print('   地価の低い3丁目の実際÷式：' + '・'.join(f"{r['town']}{r['lp'] / 1e4:.0f}万 {r['rent'] / 10 ** (a + b * math.log10(r['lp'])):.2f}倍" for r in low))
    if pool is COMD:
        AD, aD, bD = A, a, b
        print('   当てはめ値（円/坪・月）：' + '  '.join(f'{p / 1e4:.0f}万→{10 ** (a + b * math.log10(p)):.0f}' for p in [7.2e5, 1.53e6, 4.48e6, 1.0e7, 1.56e7]))

print('\n# 2. 版0.2 の丁目ごとの地価・属性（同数の丁目は★。規則＝同数の属性の地点のうち地価のいちばん高い地点の属性）')
for r in AD:
    star = '★' if len(r['top']) > 1 else '　'
    print(f"  {star}{r['town']}\t家賃{r['rent']}（件数{r['n']}）\t地価{r['lp'] / 1e4:.0f}万（地点{r['pts']}）\t{BAND(r['lp'])}\t属性{r['cnt']}\t→ {r['rule']}")
    if len(r['top']) > 1:
        for ty, pr, src, d in r['desc']: print(f'       {src} {pr / 1e4:.0f}万 {ty}：{d}')


def cells_of(assign):
    cells = collections.defaultdict(list)
    for r, ty in zip(AD, assign): cells[(BAND(r['lp']), ty)].append((r['rent'], r['town']))
    return cells


ruleA = [r['rule'] for r in AD]
ties = [i for i, r in enumerate(AD) if len(r['top']) > 1]
allA = [list(ruleA) for _ in range(1)]
combos = []
for combo in itertools.product(*[AD[i]['top'] for i in ties]):
    asg = list(ruleA)
    for i, c in zip(ties, combo): asg[i] = c
    combos.append(asg)
print(f'\n# 3. 同数の丁目 {len(ties)}／{len(AD)}。割り当ての組 {len(combos)} 通り')
base = cells_of(ruleA)
memb = collections.defaultdict(set)
for asg in combos:
    c = cells_of(asg)
    for k in set(c) | set(base): memb[k].add(tuple(sorted(x[1] for x in c.get(k, []))))
print('  表のセル（規則の割り当て）。† は割り当てで中身が変わるセル')
for band in BANDS:
    for ty in TYPES:
        k = (band, ty); v = sorted(base.get(k, []))
        dep = '†' if len(memb.get(k, {()})) > 1 else ''
        if not v and not dep: continue
        if v:
            print(f"  {band}\t{ty}{dep}\tn={len(v)}\t下{v[0][0]}（{v[0][1]}）\t中{st.median(x[0] for x in v):.0f}\t上{v[-1][0]}（{v[-1][1]}）\t" + '・'.join(f'{x[1]}{x[0]}' for x in v))
        else:
            print(f'  {band}\t{ty}{dep}\t規則では空（別の割り当てでは埋まる）')
filled = [k for k in base if base[k]]
nf = [len(cells_of(a)) for a in combos]
print(f'  埋まったセル（資料A、規則の割り当て）：{len(filled)}　全割り当てでの資料Aの埋まったセルの数：{min(nf)}〜{max(nf)}')

print('\n# 4. 属性の倍率（同じ段の商業地 shogyo の中央値を1）')
for label, pool in [('版0.1 と同じ（二重に数える）', COM), ('版0.2（二重の数えを除く）', COMD)]:
    A = town_rows(pool)
    tie_i = [i for i, r in enumerate(A) if len(r['top']) > 1]
    res = collections.defaultdict(list)
    rule_ratio = {}
    for combo in itertools.product(*[A[i]['top'] for i in tie_i]):
        asg = [r['rule'] for r in A]
        for i, c in zip(tie_i, combo): asg[i] = c
        cells = collections.defaultdict(list)
        for r, ty in zip(A, asg): cells[(BAND(r['lp']), ty)].append(r['rent'])
        for band in ['300〜1000万', '1000万以上']:
            bs = cells.get((band, 'shogyo'))
            for ty in ['hanka', 'shoten', 'office']:
                if bs and (band, ty) in cells: res[(band, ty)].append(st.median(cells[(band, ty)]) / st.median(bs))
    cells = collections.defaultdict(list)
    for r in A: cells[(BAND(r['lp']), r['rule'])].append(r['rent'])
    for band in ['300〜1000万', '1000万以上']:
        for ty in ['hanka', 'shoten', 'office']:
            if (band, 'shogyo') in cells and (band, ty) in cells: rule_ratio[(band, ty)] = st.median(cells[(band, ty)]) / st.median(cells[(band, 'shogyo')])
    allv = [x for v in res.values() for x in v]
    print(f'  {label}: 同数 {len(tie_i)} 丁目、全割り当ての倍率の幅 {min(allv):.2f}〜{max(allv):.2f}')
    for k in sorted(res): print(f'    {k[0]} {k[1]}: {min(res[k]):.2f}〜{max(res[k]):.2f}（{len(res[k])} 通り）　規則の割り当て: ' + (f'{rule_ratio[k]:.2f}' if k in rule_ratio else 'セルなし'))

print('\n# 5. 資料B（アットホーム）の傾き。地価は駅から800m以内の商業地の地点の中央値（版0.2 は二重の数えを除く）')
import json
ORIGIN = _g['ORIGIN']
deg = lambda lat, lon, lat0, lon0: math.hypot((lon - lon0) * KX, (lat - lat0) * KY) * 1000
st_ll = lambda x, y: (ORIGIN[0] - y / KY, ORIGIN[1] + x / KX)
_t = json.loads(re.search(r'SIM\.tokyo23 = (\{.*\});', open(os.path.join(ROOT, 'js', 'data', 'tokyo23.js'), encoding='utf8').read()).group(1))
ST = {}
for s in _t['stations']:
    for nm in [s['name']] + s.get('aliases', []): ST.setdefault(nm, s)
# rent23-land-match.py と同じエリアの駅
AREA = {'銀座': ['銀座'], '新橋･虎ノ門': ['新橋', '虎ノ門'], '六本木': ['六本木'], '渋谷': ['渋谷'], '原宿･表参道': ['原宿', '表参道'],
        '恵比寿･目黒･中目黒': ['恵比寿', '目黒', '中目黒'], '新宿': ['新宿'], '池袋': ['池袋'], '上野･浅草': ['上野', '浅草']}
K = list(AREA)
F24 = dict(zip(K, [34830, 29329, 28049, 31072, 30120, 27734, 19937, 19502, 16453]))
F25 = dict(zip(K, [23990, 31069, 29220, 29151, 33170, 28923, 23931, 19867, 20177]))
I24 = dict(zip(K, [30246, 28044, 28546, 31176, 31169, 28655, 25655, 24283, 19395]))
I25 = dict(zip(K, [36250, 28774, 32156, 34819, 35973, 29622, 26593, 25803, 22399]))
for label, pool in [('版0.1 と同じ（二重に数える）', COM), ('版0.2（二重の数えを除く）', COMD)]:
    LP, TY = {}, {}
    for k, names in AREA.items():
        hq = []
        for nm in names:
            s = ST[nm]; la, lo_ = st_ll(s['x'], s['y'])
            hq += [q for q in pool if deg(q['lat'], q['lon'], la, lo_) <= 800]
        LP[k] = st.median(q['price'] for q in hq); TY[k] = collections.Counter(q['type'] for q in hq).most_common(3)
    print(f'  {label}')
    for lab, d in [('1階 2024上', F24), ('1階 2025下', F25), ('1階 2期平均', {k: (F24[k] + F25[k]) / 2 for k in K}), ('飲食店可（全階）2期平均', {k: (I24[k] + I25[k]) / 2 for k in K})]:
        pts = [(LP[k], d[k]) for k in K]; b, lo, hi, rr, a = fit(pts)
        loo = [fit([(LP[j], d[j]) for j in K if j != k])[0] for k in K]
        print(f'    {lab}: 逆回帰の上限 b/r²={b / rr ** 2:.3f}　地価の低い2エリアの実際÷式：' + '・'.join(f'{k} {d[k] / 10 ** (a + b * math.log10(LP[k])):.2f}倍' for k in sorted(K, key=lambda k: LP[k])[:2]))
        print(f'    {lab}: b={b:.3f}（{lo:.2f}〜{hi:.2f}） r={rr:.2f} Theil-Sen={theil(pts):.3f} 1点抜き{min(loo):.3f}〜{max(loo):.3f}  地価1000万の当てはめ {10 ** (a + 7 * b):.0f}'
              + ('  当てはめ値 ' + '  '.join(f'{p / 1e4:.0f}万→{10 ** (a + b * math.log10(p)):.0f}' for p in [7.2e5, 1.53e6, 4.48e6, 1.56e7]) if '2期平均' in lab else ''))
    if pool is COMD:
        cb = collections.defaultdict(list)
        for k in K: cb[(BAND(LP[k]), TY[k][0][0])].append(f'{k}{(F24[k] + F25[k]) / 2:.0f}')
        print('    表のセル（資料B、2期平均の1階）：' + '　'.join(f'{b_}×{t_}: ' + '・'.join(v) for (b_, t_), v in sorted(cb.items())))
        print('    最多の属性が同数のエリア：' + str([k for k in K if len(TY[k]) > 1 and TY[k][0][1] == TY[k][1][1]]))
        print('    エリアの地価と属性（上位3）：' + '　'.join(f'{k}{LP[k] / 1e4:.0f}万{TY[k]}' for k in K))
    print('    飲食店可（全階）÷1階（2期平均）：' + ' '.join(f'{k}{(I24[k] + I25[k]) / (F24[k] + F25[k]):.2f}' for k in K))

print('\n# 6. 資料Aと資料Bの比（同じエリア・同じ期。A はエリアの1F平均〔推移表〕、B は1階の中央値）')
JA = {'2025下': {'銀座': 63700, '原宿･表参道': 54100, '新宿': 53500, '渋谷': 45500, '池袋': 42500},
      '2024上': {'銀座': 64600, '原宿･表参道': 61900, '新宿': 46700, '渋谷': 53900, '池袋': 42000}}
allr = []
for per, J in JA.items():
    B = F25 if per == '2025下' else F24
    rs = {k: v / B[k] for k, v in J.items()}; allr += rs.values()
    print(f'  {per}: ' + ' '.join(f'{k}{v:.2f}' for k, v in rs.items()))
print(f'  幅：{min(allr):.2f}〜{max(allr):.2f}')

print('\n# 7. 半期のぶれ（アットホーム図表7の1階。前期比は原文の画像の値、2期の差は道具で）')
P25 = dict(zip(K, [-28.9, 10.5, 11.9, 4.7, 3.2, -3.2, -3.4, -4.8, 15.9]))  # 2025下 前期比（2025上→2025下）
P24 = dict(zip(K, [-6.2, -6.4, 4.5, -8.4, -8.3, 0.8, -2.7, -3.3, -9.2]))  # 2024上 前期比（2023下→2024上）
d18 = {k: (F25[k] / F24[k] - 1) * 100 for k in K}
print(f'  前期比 2025下: {min(P25.values()):+.1f}%〜{max(P25.values()):+.1f}%　2024上: {min(P24.values()):+.1f}%〜{max(P24.values()):+.1f}%')
print(f'  2024上→2025下（1年半の差）: {min(d18.values()):+.0f}%〜{max(d18.values()):+.0f}%')
both = list(P25.values()) + list(P24.values())
print(f'  前期比18個の絶対値の中央値 {st.median(abs(x) for x in both):.1f}%、20%を越えるのは {sum(abs(x) > 20 for x in both)} 個')

print('\n# 8. 国交省ガイドライン 図2-5（y=1E-05x+0.5162、小売業の売場面積あたり売上、68都市の中心市街地）の弾力性')
for x in [5000, 10000, 20000, 40000]: print(f'  通行量{x}人/12h: 弾力性 {1e-5 * x / (1e-5 * x + 0.5162):.2f}')
print(f'  通行量1万→5万（5倍）で売上 {(0.5 + 0.5162) / (0.1 + 0.5162):.2f}倍。比べ物：家賃の弾力性0.21なら5倍で {5 ** 0.21:.2f}倍')
print('  R4b の検算（家賃＝R0×(地価/1000万)^b の形で、R0 を下げたときのよい場所と悪い場所の家賃の差の額。12坪・月）')
for R0 in [45000, 28000]:
    hi_ = R0 * (1.56e7 / 1e7) ** 0.25 * 12; lo_ = R0 * (7.2e5 / 1e7) ** 0.25 * 12
    print(f'    R0={R0}: 地価1,560万の候補地 月{hi_:,.0f}円・72万 月{lo_:,.0f}円・差 月{hi_ - lo_:,.0f}円（比は {hi_ / lo_:.2f} 倍で R0 によらない）')

print('\n# 9. 報告の引用の語句：原文に出るか・同じ語句の使い回し・判定の数え（判定は rent23-v02-cites.tsv に1件ずつ書いた）')
rep = open(os.path.join(HERE, '..', 'BIZ-RENT23.md'), encoding='utf8').read().split('\n')
nz = lambda s: re.sub(r'\s+', '', unicodedata.normalize('NFKC', s))
cites = []
for i, l in enumerate(rep, 1):
    for coll, doc, q in re.findall(r'\[\[(web:rent23|geo:geospec):([\w-]+)\|「(.*?)」\]\]', l): cites.append((i, coll, doc, q))
miss = []
for i, coll, doc, q in cites:
    if coll != 'web:rent23': continue
    p = os.path.join(TXT, doc + '.txt')
    if not os.path.exists(p) or nz(q) not in nz(open(p, encoding='utf8', errors='replace').read()): miss.append((i, doc, q))
dup = [k for k, v in collections.Counter((d, q) for _, _, d, q in cites).items() if v > 1]
print(f'  引用 {len(cites)} 件（web:rent23 {sum(c[1] == "web:rent23" for c in cites)}・geo {sum(c[1] == "geo:geospec" for c in cites)}）。原文に出ない web:rent23 {len(miss)} 件 {miss}')
print(f'  同じ（資料, 語句）の使い回し {len(dup)} 件 {dup}')
J = {}
for l in open(os.path.join(HERE, 'rent23-v02-cites.tsv'), encoding='utf8'):
    c = l.rstrip('\n').split('\t')
    if len(c) >= 3 and not l.startswith('#'): J[(c[0], c[1])] = (c[2], c[3] if len(c) > 3 else '')
cnt = collections.Counter()
nojudge = []
for i, coll, doc, q in cites:
    j = J.get((doc, q))
    if not j: nojudge.append((i, doc, q)); continue
    cnt[j[0]] += 1
    if j[0] != '支える': print(f'    {i}行 {doc}「{q}」: {j[0]}（{j[1]}）')
tot = sum(cnt.values())
print(f'  判定：{dict(cnt)}　判定のない引用 {len(nojudge)} 件 {nojudge}')
if tot: print(f'  支える割合 {cnt["支える"]}/{len(cites)} = {cnt["支える"] / len(cites) * 100:.1f}%')
