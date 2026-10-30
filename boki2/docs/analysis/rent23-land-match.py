# 1階の店舗の家賃（資料の値）と、同じ場所の地価（地価公示 L01-26・都道府県地価調査 L02-26、2026年）を突き合わせ、
# 「地価が10倍で家賃は何倍か」（両対数の傾き b：家賃 ∝ 地価^b）を、独立した資料ごとに出す。BIZ-RENT23.md 3章。
# 使い方: python3 -I rent23-land-match.py <jrei2026.tsv> <jrei2019.tsv>
#   jrei*.tsv は rent23-jrei-addr.py の出力（日本不動産研究所・BAC「店舗賃料トレンド」の住所別1F平均賃料）
# 地価の生データは boki2/research/raw/geo/geodata/（research-fetch で取得。git に入れない）
import collections, json, math, os, re, statistics as st, sys, zipfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'research', 'raw', 'geo', 'geodata')
ORIGIN = (35.82, 139.56); KX = 111.32 * math.cos(math.radians(35.68)); KY = 110.95
KAN = {k: i + 1 for i, k in enumerate('一 二 三 四 五 六 七 八 九 十'.split())}


def zip_geojson(name, inner):
    for f in os.listdir(RAW):
        if f.startswith(name):
            z = zipfile.ZipFile(os.path.join(RAW, f))
            hit = sorted([n for n in z.namelist() if n.endswith(inner)], key=lambda n: 'Shift' in n)
            return json.loads(z.read(hit[0]).decode('utf-8'))
    sys.exit(name + ' がない')


def norm(addr):
    a = addr.replace('東京都', '').replace('　', '').strip()
    a = a.translate(str.maketrans('０１２３４５６７８９', '0123456789'))
    a = re.sub(r'([一二三四五六七八九十]+)丁目', lambda m: str(KAN[m.group(1)]) + '丁目', a)
    return a


pts = []
for f in zip_geojson('L01-26-13', 'L01-26_13.geojson')['features']:
    p = f['properties']; lon, lat = f['geometry']['coordinates'][:2]
    pts.append({'addr': norm(p['L01_025']), 'price': p['L01_008'], 'kubun': p['L01_002'], 'lat': lat, 'lon': lon, 'src': 'L01', 'desc': p['L01_047'], 'zone': p['L01_051']})
for f in zip_geojson('L02-26-13', 'L02-26_13.geojson')['features']:
    p = f['properties']; lon, lat = f['geometry']['coordinates'][:2]
    pts.append({'addr': norm(p['L02_022']), 'price': p['L02_006'], 'kubun': p['L02_001'], 'lat': lat, 'lon': lon, 'src': 'L02', 'desc': p['L02_044'], 'zone': p['L02_047']})


def classify(desc, kubun, zone=''):
    # tools/stations-build.py の classify（版0.2）を写したもの。ゲームの候補地と同じ規則で、資料の地点の属性を決める
    s = desc or ''
    if re.search(r'繁華|歓楽|遊興|遊技|娯楽|ホテル等が集まる', s): return 'hanka'
    if re.search(r'飲食', s) and not re.search(r'小売|日用品|店舗併用|一般住宅|近隣商業', s) and zone != '近商': return 'hanka'
    if kubun == '009' or re.search(r'工業地域|流通業務', s): return 'kojo'
    if '住宅地域' in s: return 'jutaku'
    if re.search(r'工場|倉庫|作業所', s) and not re.search(r'店舗', s): return 'kojo'
    if re.search(r'大規模ビル|特定街区|業務|本社', s): return 'office'
    office = re.search(r'事務所|オフィス', s)
    shop = re.search(r'店舗|商店|小売|商業ビル|ホテル|劇場|百貨店', s)
    if office and shop: return 'office' if re.search(r'事務所(ビル)?[、等]', s[:shop.start()]) and not re.search(r'店舗', s[:office.start()]) else 'shogyo'
    if re.search(r'中心商業|高度商業', s): return 'shogyo'
    if office: return 'office'
    if shop or '商業地域' in s: return 'shoten'
    return 'jutaku'


for q in pts: q['type'] = classify(q['desc'], q['kubun'], q['zone'])
COM = [q for q in pts if str(q['kubun']) in ('5', '005')]  # 商業地
print(f'# 地価の地点 全{len(pts)}・うち商業地{len(COM)}')


def fit(rows, label):
    # rows: [(名, 家賃, 地価)] 最小二乗で log10(家賃) = a + b log10(地価)
    xs = [math.log10(r[2]) for r in rows]; ys = [math.log10(r[1]) for r in rows]
    n = len(rows); mx = sum(xs) / n; my = sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs); sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys)); syy = sum((y - my) ** 2 for y in ys)
    b = sxy / sxx; a = my - b * mx; r = sxy / math.sqrt(sxx * syy)
    # 傾きの95%の幅（t 分布の近似。n-2 の自由度で 2.0〜2.3）
    se = math.sqrt(max(syy - b * sxy, 0) / (n - 2) / sxx) if n > 2 else float('nan')
    t = {3: 12.7, 4: 4.30, 5: 3.18, 6: 2.78, 7: 2.57, 8: 2.45, 9: 2.36, 10: 2.31}.get(n, 2.1 if n < 25 else 2.0)
    print(f'## {label}: n={n} 傾きb={b:.3f}（95%の幅 {b - t*se:.2f}〜{b + t*se:.2f}） 相関r={r:.2f}  地価10倍→家賃{10**b:.2f}倍  地価の幅 {min(r_[2] for r_ in rows)/1e4:.0f}〜{max(r_[2] for r_ in rows)/1e4:.0f}万円/㎡')
    return a, b


def town_rows(tsv, use_recent=False, min_n=5):
    rows = []
    for l in open(tsv, encoding='utf8'):
        c = l.rstrip('\n').split('\t')
        if c[0] == 'TREND' or len(c) < 6: continue
        town = c[1]
        if not re.match(r'(千代田|中央|港|新宿|渋谷|豊島)区', town): continue
        rent, n = (int(c[4]), int(c[5])) if use_recent and c[4] != '-' else (int(c[2]), int(c[3]))
        if n < min_n: continue
        hq = [q for q in COM if q['addr'].startswith(town)]
        hit = [q['price'] for q in hq]
        if not hit: print(f'  {town}: 同じ丁目に商業地の地価の地点なし（使わない）'); continue
        lp = st.median(hit)
        ty = collections.Counter(q['type'] for q in hq).most_common()
        rows.append((town, rent, lp, ty[0][0]))
        print(f'  {town}\t家賃{rent}円/坪（件数{n}）\t地価の中央値{lp/1e4:.0f}万円/㎡（地点{len(hit)}）\t属性{ty}')
    return rows


print('\n# 資料A：日本不動産研究所・BAC「店舗賃料トレンド2026春」 住所別の1F平均賃料（2023〜2025年、面積加重、共益費を含まない）')
A = town_rows(sys.argv[1])
fit(A, '資料A（2026春・丁目、件数5以上）')
print('\n# 資料A2：同じ系列の2019春（2016〜2018年）。地価は2026年のまま（時点がずれる）')
A2 = town_rows(sys.argv[2])
fit(A2, '資料A2（2019春・丁目、件数5以上）')


def deg(lat, lon, lat0, lon0):
    return math.hypot((lon - lon0) * KX, (lat - lat0) * KY) * 1000


def st_ll(x, y):
    return (ORIGIN[0] - y / KY, ORIGIN[1] + x / KX)


# 駅の位置（tokyo23.js の x,y から戻す。tokyo23.js は stations-build.py が作る）
src = open(os.path.join(ROOT, 'js', 'data', 'tokyo23.js'), encoding='utf8').read()
T = json.loads(re.search(r'SIM\.tokyo23 = (\{.*\});', src).group(1))
ST = {}
for s in T['stations']:
    for nm in [s['name']] + s.get('aliases', []): ST.setdefault(nm, s)


def near_price(names, radius=800):
    hq = []
    for nm in names:
        s = ST[nm]; lat0, lon0 = st_ll(s['x'], s['y'])
        hq += [q for q in COM if deg(q['lat'], q['lon'], lat0, lon0) <= radius]
    return st.median([q['price'] for q in hq]), len(hq), collections.Counter(q['type'] for q in hq).most_common(3)


print('\n# 資料B：アットホーム「50坪以下の貸店舗の募集動向」 東京9エリアの1階の募集賃料（中央値、共益費等込み、5〜50坪、駅徒歩10分以内）')
print('#   地価：エリアの駅から800m以内の商業地の地点の中央値（徒歩10分＝800m）')
AREA = {'銀座': ['銀座'], '新橋･虎ノ門': ['新橋', '虎ノ門'], '六本木': ['六本木'], '渋谷': ['渋谷'], '原宿･表参道': ['原宿', '表参道'],
        '恵比寿･目黒･中目黒': ['恵比寿', '目黒', '中目黒'], '新宿': ['新宿'], '池袋': ['池袋'], '上野･浅草': ['上野', '浅草']}
B25 = {'銀座': 23990, '新橋･虎ノ門': 31069, '六本木': 29220, '渋谷': 29151, '原宿･表参道': 33170, '恵比寿･目黒･中目黒': 28923, '新宿': 23931, '池袋': 19867, '上野･浅草': 20177}
B24 = {'銀座': 34830, '新橋･虎ノ門': 29329, '六本木': 28049, '渋谷': 31072, '原宿･表参道': 30120, '恵比寿･目黒･中目黒': 27734, '新宿': 19937, '池袋': 19502, '上野･浅草': 16453}
LP = {}
for k, v in AREA.items():
    LP[k] = near_price(v); print(f'  {k}\t地価の中央値{LP[k][0]/1e4:.0f}万円/㎡（地点{LP[k][1]}）\t1階 2025下期{B25[k]} 2024上期{B24[k]}\t属性{LP[k][2]}')
fit([(k, B25[k], LP[k][0]) for k in AREA], '資料B（アットホーム2025年度下期・1階）')
fit([(k, B24[k], LP[k][0]) for k in AREA], '資料B（アットホーム2024年度上期・1階）')
fit([(k, (B25[k] + B24[k]) / 2, LP[k][0]) for k in AREA], '資料B（2期の平均・1階）')

print('\n# 資料C：飲食店ドットコム（シンクロ・フード）駅別賃料相場 上位10駅（2025年10月〜2026年3月、全階、飲食店物件）')
print('#   地価：駅から500m以内の商業地の中央値。上位10駅だけなので家賃の幅が狭い（4.2万〜5.0万円）')
C = {'原宿': 50346, '神谷町': 48011, '表参道': 44429, '新宿': 43994, '渋谷': 43540, '内幸町': 42878, '新橋': 42645, '銀座': 42497, '銀座一丁目': 42308, '麻布十番': 42129}
CR = []
for k, v in C.items():
    lp, n, _ = near_price([k], 500); CR.append((k, v, lp)); print(f'  {k}\t{v}円/坪\t地価の中央値{lp/1e4:.0f}万円/㎡（地点{n}）')
fit(CR, '資料C（飲食店ドットコム上位10駅・全階）')

print('\n# 参考：ゲームの候補地の地価の段の代表値（tokyo23.js の sites）')
for lo, hi in [(0, 1e6), (1e6, 3e6), (3e6, 1e7), (1e7, 1e9)]:
    v = [s['price'] for s in T['sites'] if lo <= s['price'] < hi]
    print(f'  {lo/1e4:.0f}〜{hi/1e4:.0f}万円/㎡: 候補地{len(v)} 中央値{st.median(v)/1e4:.0f}万 下位10%{sorted(v)[len(v)//10]/1e4:.0f}万 上位10%{sorted(v)[len(v)*9//10]/1e4:.0f}万')


BAND = lambda p: '<100万' if p < 1e6 else '100〜300万' if p < 3e6 else '300〜1000万' if p < 1e7 else '1000万以上'
print('\n# 表の材料：資料A（2026春・丁目）を地価の段×属性に並べる（家賃は円/坪・月、1F、共益費を含まない）')
cell = collections.defaultdict(list)
for town, rent, lp, ty in A: cell[(BAND(lp), ty)].append((rent, town))
for k in sorted(cell): v = sorted(cell[k]); print(f'  {k[0]}\t{k[1]}\tn={len(v)}\t下{v[0][0]}（{v[0][1]}）\t中{st.median([x[0] for x in v]):.0f}\t上{v[-1][0]}（{v[-1][1]}）')
print('\n# 表の材料：資料B（アットホーム、2期の平均、1階、共益費込み）を地価の段×エリアの最多属性に並べる')
cellB = collections.defaultdict(list)
for k in AREA: cellB[(BAND(LP[k][0]), LP[k][2][0][0])].append(((B25[k] + B24[k]) / 2, k))
for k in sorted(cellB): v = sorted(cellB[k]); print(f'  {k[0]}\t{k[1]}\tn={len(v)}\t' + ' '.join(f'{x[1]}{x[0]:.0f}' for x in v))

print('\n# 式の当てはめ値（円/坪・月）。地価 72万・153万・448万・1560万 は候補地の段ごとの中央値。資料の地価の幅（約250万〜5000万）の外は【推論】の延長')
for lab, rows in [('資料A 2026春（共益費別・面積加重）', [(r[0], r[1], r[2]) for r in A]), ('資料B アットホーム2期平均（共益費込み・中央値・5〜50坪）', [(k, (B25[k] + B24[k]) / 2, LP[k][0]) for k in AREA])]:
    a, b = fit(rows, lab)
    print('   ' + '  '.join(f'{p/1e4:.0f}万→{10**(a + b*math.log10(p)):.0f}' for p in [3e5, 7.2e5, 1.53e6, 2.5e6, 4.48e6, 1.0e7, 1.56e7, 3.56e7]))
# 比例（b=1）だったら：資料Bの2期平均の中央の点（地価約1000万で約3万円）を通る比例の線と比べる
print('   比例（b=1）なら 1000万で3万円とすると 72万で' + f'{30000*0.072:.0f}円・3560万で{30000*3.56:.0f}円')
