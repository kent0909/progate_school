# BIZ-RENT23 の判定（docs/audit/BIZ-RENT23-audit.md）で使った数え・再計算。頭で数えない（QUALITY 6.2）。
# 使い方: python3 -I rent23-audit-check.py <pdftotext と html の文字を置いたフォルダ>
#   フォルダには research/raw/web/rent23 の PDF を `pdftotext -layout` した <doc>.txt と、
#   HTML のタグを外した <doc>.txt を置く（引用の語句の照合に使う）。地価は rent23-land-match.py と同じ生データを読む。
import collections, itertools, math, os, re, statistics as st, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TXT = sys.argv[1]
T975 = {7: 2.365, 8: 2.306, 21: 2.080, 22: 2.074}  # t 分布の 97.5% 点（自由度）


def fit(pts):
    xs = [math.log10(p) for p, _ in pts]; ys = [math.log10(r) for _, r in pts]
    n = len(xs); mx = sum(xs) / n; my = sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs); sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys)); syy = sum((y - my) ** 2 for y in ys)
    b = sxy / sxx; se = math.sqrt((syy - b * sxy) / (n - 2) / sxx); t = T975.get(n - 2, 2.0)
    return b, b - t * se, b + t * se, sxy / math.sqrt(sxx * syy), my - b * mx


def theil(pts):
    s = [(math.log10(r2) - math.log10(r1)) / (math.log10(p2) - math.log10(p1)) for (p1, r1), (p2, r2) in itertools.combinations(pts, 2) if p1 != p2]
    return st.median(s)


out = open(os.path.join(HERE, 'rent23-land-match.out.txt'), encoding='utf8').read()
secA = out.split('# 資料A2')[0]
rowsA = re.findall(r'  (\S+丁目)\t家賃(\d+)円/坪（件数\d+）\t地価の中央値(\d+)万円/㎡（地点\d+）\t属性(\[.*?\])', secA)

print('# 1. 資料A（2026春）の傾きの再計算と頑健さ')
ptsA = [(int(l) * 1e4, int(r)) for _, r, l, _ in rowsA]
b, lo, hi, r, _ = fit(ptsA)
print(f'  n={len(ptsA)} b={b:.3f}（{lo:.2f}〜{hi:.2f}） r={r:.2f}  Theil-Sen={theil(ptsA):.3f}')
loo = {t: fit([(int(l) * 1e4, int(rr)) for tt, rr, l, _ in rowsA if tt != t])[0] for t, _, _, _ in rowsA}
k1 = min(loo, key=loo.get); k2 = max(loo, key=loo.get)
print(f'  1点ずつ抜く: 最小 {loo[k1]:.3f}（{k1}を抜く） 最大 {loo[k2]:.3f}（{k2}を抜く）')

print('\n# 2. 資料B（アットホーム 図表6・7 の画像から読み直した値）の傾き')
K = ['銀座', '新橋･虎ノ門', '六本木', '渋谷', '原宿･表参道', '恵比寿･目黒･中目黒', '新宿', '池袋', '上野･浅草']
LP = {k: int(v) * 1e4 for k, v in re.findall(r'  (\S+)\t地価の中央値(\d+)万円/㎡（地点\d+）\t1階', out)}
F24 = dict(zip(K, [34830, 29329, 28049, 31072, 30120, 27734, 19937, 19502, 16453]))  # 2024上 図表7 1階
F25 = dict(zip(K, [23990, 31069, 29220, 29151, 33170, 28923, 23931, 19867, 20177]))  # 2025下 図表7 1階
I24 = dict(zip(K, [30246, 28044, 28546, 31176, 31169, 28655, 25655, 24283, 19395]))  # 2024上 図表6 飲食店可
I25 = dict(zip(K, [36250, 28774, 32156, 34819, 35973, 29622, 26593, 25803, 22399]))  # 2025下 図表6 飲食店可
for lab, d in [('1階 2024上', F24), ('1階 2025下', F25), ('1階 2期平均', {k: (F24[k] + F25[k]) / 2 for k in K}),
               ('飲食店可 2期平均', {k: (I24[k] + I25[k]) / 2 for k in K})]:
    pts = [(LP[k], d[k]) for k in K]; b, lo, hi, r, a = fit(pts)
    print(f'  {lab}: b={b:.3f}（{lo:.2f}〜{hi:.2f}） r={r:.2f} Theil-Sen={theil(pts):.3f}  地価1000万の当てはめ {10 ** (a + 7 * b):.0f}')
avg = {k: (F24[k] + F25[k]) / 2 for k in K}
print('  1階2期平均を1点ずつ抜く:', ' '.join(f'{k}{fit([(LP[j], avg[j]) for j in K if j != k])[0]:.3f}' for k in K))
print('  2期の差（報告は「半期で」と書く。2024年度上期と2025年度下期は1年半離れている）:',
      ' '.join(f'{k}{(F25[k] / F24[k] - 1) * 100:+.0f}%' for k in K))
print('  原文の前期比（2025下 図表7 1階）: 銀座-28.9% 新橋虎ノ門+10.5% 六本木+11.9% 渋谷+4.7% 原宿表参道+3.2% 恵比寿-3.2% 新宿-3.4% 池袋-4.8% 上野浅草+15.9%')

print('\n# 3. 資料Aと資料Bの比（同じエリア・同じ期。A はエリアの1F平均）')
JA = {'2025下': {'銀座': 63700, '原宿･表参道': 54100, '新宿': 53500, '渋谷': 45500, '池袋': 42500},
      '2024上': {'銀座': 64600, '原宿･表参道': 61900, '新宿': 46700, '渋谷': 53900, '池袋': 42000}}
for per, J in JA.items():
    B = F25 if per == '2025下' else F24
    print(f'  {per}: ' + ' '.join(f'{k}{v / B[k]:.2f}' for k, v in J.items()))

print('\n# 4. 属性が同数で決まった丁目と、属性の倍率（商業地を1）の幅')
import ast
BAND = lambda p: '<100' if p < 100 else '100-300' if p < 300 else '300-1000' if p < 1000 else '1000+'
ties, fixed = [], []
for t, r, l, a in rowsA:
    a = ast.literal_eval(a); top = [k for k, c in a if c == a[0][1]]
    (ties if len(top) > 1 else fixed).append((t, int(r), int(l), top if len(top) > 1 else a[0][0]))
print(f'  丁目{len(rowsA)}のうち同数で決まった {len(ties)}:', '・'.join(f'{t}{c}' for t, _, _, c in ties))
res = collections.defaultdict(list)
for combo in itertools.product(*[x[3] for x in ties]):
    cells = collections.defaultdict(list)
    for t, r, l, ty in fixed + [(x[0], x[1], x[2], c) for x, c in zip(ties, combo)]: cells[(BAND(l), ty)].append(r)
    for band in ['300-1000', '1000+']:
        base = cells.get((band, 'shogyo'))
        for ty in ['hanka', 'shoten', 'office']:
            if base and (band, ty) in cells: res[(band, ty)].append(st.median(cells[(band, ty)]) / st.median(base))
for k, v in sorted(res.items()): print(f'  {k[0]} {k[1]}: 商業地比 {min(v):.2f}〜{max(v):.2f}（同数の割り当て {len(v)} 通り）')

print('\n# 5. 地価公示と地価調査の同じ地点（15m 以内）の二重の数え')
sys.argv = ['x', '/dev/null', '/dev/null']; __file__ = os.path.join(HERE, 'rent23-land-match.py')
exec(open(__file__, encoding='utf8').read().split('def fit(')[0])
dist = lambda a, b: math.hypot((a['lon'] - b['lon']) * KX, (a['lat'] - b['lat']) * KY) * 1000
L01 = [q for q in COM if q['src'] == 'L01']
COMd = L01 + [q for q in COM if q['src'] == 'L02' and not any(dist(q, p) <= 15 for p in L01)]
ptsD = []
for t, r, l, _ in rowsA:
    hq = [q for q in COMd if q['addr'].startswith(t)]; lp = st.median([q['price'] for q in hq]); ptsD.append((lp, int(r)))
    if abs(lp / 1e4 - int(l)) >= 1:
        print(f'  {t}: 地価の中央値 {l}万→{lp / 1e4:.0f}万（段 {BAND(int(l))}→{BAND(lp / 1e4)}） 属性{collections.Counter(q["type"] for q in hq).most_common()}')
b, lo, hi, r, _ = fit(ptsD); print(f'  重なりを除いた資料A: b={b:.3f}（{lo:.2f}〜{hi:.2f}） r={r:.2f}')

print('\n# 6. 国交省ガイドライン 図2-5 の線（y=1E-05x+0.5162、小売業の売場面積あたり売上・68都市）の通行量に対する弾力性')
for x in [5000, 10000, 20000, 40000]: print(f'  通行量{x}人/12h: 弾力性 {1e-5 * x / (1e-5 * x + 0.5162):.2f}')
print(f'  通行量1万→5万（5倍）で売上 {(0.5 + 0.5162) / (0.1 + 0.5162):.2f}倍（傾きは図の表示が丸めた 1E-05 なので目安）')

print('\n# 7. 報告の引用の語句が原文に出るか（空白を除いて照合。NFKC で字形の違いをそろえる）')
import unicodedata
rep = open(os.path.join(HERE, '..', 'BIZ-RENT23.md'), encoding='utf8').read()
cites = re.findall(r'\[\[web:rent23:([\w-]+)\|「(.*?)」\]\]', rep)
nz = lambda s: re.sub(r'\s+', '', unicodedata.normalize('NFKC', s))
miss = []
for d, q in cites:
    p = os.path.join(TXT, d + '.txt')
    if not os.path.exists(p) or nz(q) not in nz(open(p, encoding='utf8', errors='replace').read()): miss.append((d, q))
print(f'  web:rent23 の引用 {len(cites)}件、原文に出ないもの {len(miss)}件', miss)
print('  資料ごとの件数:', dict(collections.Counter(d for d, _ in cites)))
