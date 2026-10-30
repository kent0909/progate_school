#!/usr/bin/env python3
# 出店の地図（東京23区）のデータを作る。出力：boki2/js/data/tokyo23.js（SIMDATA.tokyo23）
# 元データ（国土交通省 国土数値情報。research/raw/geo/geodata/ に research-fetch.js で取得した zip。git に入れない）：
#   S12-25 駅別乗降客数（2024年度の値を使う）・N02-25 鉄道（路線の形）・N03-20260101 行政区域（東京都）・L01-26 地価公示（2026年1月1日）・L02-26 都道府県地価調査（2026年7月1日）
# 依存：pip install pyshp shapely（geojson を読むだけなら shapely だけ）
# Usage: python3 boki2/tools/stations-build.py [--out boki2/js/data/tokyo23.js] [--report scratch/report.tsv]
#
# 作り方の要点（設計の元は docs/DESIGN-STATIONMAP.md）
#  1. 駅：JR東日本と東京メトロの駅のうち、位置が23区の中にあるもの。同じ駅名で 800m 以内の駅は1つにまとめる（乗り換え駅）
#  2. 駅の人の多さ：同じ駅にある全事業者（私鉄・都営も含む）の1日の乗降客数の合計。重複コード1（その事業者の代表の駅）だけを足す
#     中目黒・代々木上原のように東京メトロの数が相手の私鉄に含まれる駅も、全事業者の合計なら正しく入る
#  3. 候補地：地価公示の地点を、いちばん近い駅（1と同じ187駅のどれか、直線 1,000m 以内）に割り当てる。
#     属性は「周辺の土地利用の状況」の文と用途区分から5つに分ける（classify）。駅ごとのピン数は乗降客数の段（PIN_TIERS）
#  4. 地図：区の境界と路線を、緯度経度から km の平面に写して間引く
import json, math, re, sys, zipfile, io, collections, os
from shapely.geometry import shape, Point, mapping
from shapely.ops import unary_union

ROOT = os.path.join(os.path.dirname(__file__), '..')
RAW = os.path.join(ROOT, 'research', 'raw', 'geo', 'geodata')
args = sys.argv[1:]
opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
OUT = opt('--out', os.path.join(ROOT, 'js', 'data', 'tokyo23.js'))
REPORT = opt('--report')

JM = ('東日本旅客鉄道', '東京地下鉄')
# --ops all（23区の中の全事業者の駅。標準）／jm（JR とメトロだけ。判定 H3：世田谷区に駅が0）
OPS_MODE = opt('--ops', 'all')  # 版0.3：オーナーの決定（10/30）で全事業者が標準
OPS = JM if OPS_MODE == 'jm' else None
inops = lambda op: OPS is None or op in OPS
SHORT = {'東日本旅客鉄道': 'JR', '東京地下鉄': 'メトロ', '東京都': '都営', '東急電鉄': '東急', '小田急電鉄': '小田急', '京王電鉄': '京王', '西武鉄道': '西武', '東武鉄道': '東武', '京成電鉄': '京成', '京浜急行電鉄': '京急', '首都圏新都市鉄道': 'TX', '東京臨海高速鉄道': 'りんかい', 'ゆりかもめ': 'ゆりかもめ', '東京モノレール': 'モノレール', '東海旅客鉄道': 'JR東海', '北総鉄道': '北総', '埼玉高速鉄道': '埼玉高速'}
short = lambda op: SHORT.get(op, op)
MERGE_M = 800        # 同じ駅名をまとめる距離
SITE_M = 1000        # 候補地を駅に割り当てる距離（直線）
# ピン数の段（1日の乗降客数・全事業者の合計 → ピン数）。置き値：DESIGN-STATIONMAP 3章
PIN_TIERS = [(1000000, 8), (500000, 6), (250000, 5), (120000, 4), (60000, 3), (30000, 2), (0, 1)]
ORIGIN = (35.82, 139.56)  # 地図の左上（北西）。x は東へ、y は南へ km
KX = 111.32 * math.cos(math.radians(35.68))
KY = 110.95


def zip_geojson(name, inner):
  # raw の zip（取得時に拡張子が xlsx になっているものもある）から geojson を1つ読む
  for f in os.listdir(RAW):
    if f.startswith(name):
      z = zipfile.ZipFile(os.path.join(RAW, f))
      hit = sorted([n for n in z.namelist() if n.endswith(inner)], key=lambda n: 'Shift' in n)  # UTF-8 版を先に
      if not hit: sys.exit(f'{f} に {inner} がない')
      return json.loads(z.read(hit[0]).decode('utf-8'))
  sys.exit(f'{RAW} に {name} がない。research-fetch.js で取得すること（README の geo）')


def xy(lat, lon):
  return (round((lon - ORIGIN[1]) * KX, 2), round((ORIGIN[0] - lat) * KY, 2))


def dist_m(a, b):
  return math.hypot((a[0] - b[0]) * KY * 1000, (a[1] - b[1]) * KX * 1000)


def classify(desc, kubun, zone=''):
  # 周辺の土地利用の状況（L01_047）・用途区分（000 住宅地・005 商業地・009 工業地）・用途地域から属性を決める。上から順に当てる。
  # 版0.2（判定 H1・M2・M3・M4）：店舗と事務所が混ざる文（「中高層の店舗、事務所ビル」）は、文だけではオフィス街か商店街か決められないので
  # 6つめの属性「店とオフィスが混ざる商業地」shogyo にする。事務所が先で店舗が後（「事務所、店舗等」）はオフィス街。
  # 「飲食」だけでは繁華街にしない（「小売店舗、飲食店等」は町の商店街）。工場の語があっても「住宅地域」の文は住宅地
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


KAN = {k: i + 1 for i, k in enumerate('一 二 三 四 五 六 七 八 九 十'.split())}


def town_of(addr):
  # 「東京都　渋谷区松濤１丁目２６番３７外」→ 区「渋谷区」・町「松濤1丁目」
  a = addr.replace('東京都', '').strip().replace('　', '')
  m = re.match(r'(.+?区)(.+?(?:[０-９0-9一二三四五六七八九十]+丁目)?)(?:[０-９0-9]+番|[０-９0-9]+$|$)', a)
  ward, town = (m.group(1), m.group(2)) if m else ('', a)
  town = town.translate(str.maketrans('０１２３４５６７８９', '0123456789'))
  town = re.sub(r'([一二三四五六七八九十]+)丁目', lambda m: str(KAN[m.group(1)]) + '丁目', town)
  return ward, town


# ---------- 23区 ----------
n03 = zip_geojson('N03-20260101-13', '.geojson')
wards = collections.defaultdict(list)
ward_name = {}
for f in n03['features']:
  p = f['properties']; c = p.get('N03_007') or ''
  if c and 13101 <= int(c) <= 13123:
    wards[c].append(shape(f['geometry'])); ward_name[c] = p['N03_004']
wards = {c: unary_union(g) for c, g in wards.items()}
assert len(wards) == 23, len(wards)
ku23 = unary_union(list(wards.values()))

def ward_at(pt):
  for c, g in wards.items():
    if g.contains(pt): return c
  return None

# ---------- 駅 ----------
s12 = zip_geojson('S12-25', 'S12-25_NumberOfPassengers.geojson')
YEAR, NF, DUPF, HASF = 2024, 'S12_061', 'S12_058', 'S12_059'
feats = []
for f in s12['features']:
  p = f['properties']; c = shape(f['geometry']).centroid
  feats.append({'name': p['S12_001'], 'op': p['S12_002'], 'line': re.sub(r'^\d+号線', '', p['S12_003']), 'dup': p[DUPF], 'has': p[HASF], 'n': p[NF] or 0, 'pt': (c.y, c.x)})

stations = []
for r in feats:
  if not inops(r['op']): continue
  w = ward_at(Point(r['pt'][1], r['pt'][0]))
  if not w: continue
  for s in stations:
    if s['name'] == r['name'] and dist_m(r['pt'], s['pt0']) < MERGE_M: break
  else:
    s = {'name': r['name'], 'pt0': r['pt'], 'pts': [], 'ops': set(), 'lines': collections.OrderedDict(), 'wards': collections.Counter()}
    stations.append(s)
  s['pts'].append(r['pt']); s['ops'].add(r['op']); s['lines'][(r['op'], r['line'])] = 1; s['wards'][w] += 1

# 全事業者の乗降客数（同じ駅名で MERGE_M 以内、重複コード1だけ）
for s in stations:
  lat = sum(p[0] for p in s['pts']) / len(s['pts']); lon = sum(p[1] for p in s['pts']) / len(s['pts'])
  s['pt'] = (lat, lon)
  by = collections.defaultdict(int)
  for r in feats:
    if r['name'] == s['name'] and r['dup'] == 1 and dist_m(r['pt'], s['pt']) < MERGE_M: by[r['op']] += r['n']
  s['by'] = dict(by)
  s['all'] = sum(by.values())
  s['jm'] = sum(v for k, v in by.items() if k in JM)
# 名前の違う同じ乗り換え駅（浜松町・モノレール浜松町・大門、など）を1駅にまとめる（版0.3、判定 v02 N2）。
# 中心の駅（乗降客数の多い順）の重心から XFER_M 以内の駅を1つにする。名前は乗降客数のいちばん多い駅、ほかは別名（aliases）に残す
XFER_M = int(opt('--xfer', '300'))
merged = []
if XFER_M > 0:
  # 鎖のようにつなげると別の駅まで1つになる（湯島が御徒町に入る）ので、乗降客数の多い駅を中心にして、中心から XFER_M 以内だけを入れる
  hubs, groups = [], collections.OrderedDict()
  for st in sorted(stations, key=lambda st: -st['all']):
    h = next((h for h in hubs if dist_m(st['pt'], h['pt']) < XFER_M), None)
    if h is None: hubs.append(st); groups[id(st)] = [st]
    else: groups[id(h)].append(st)
  out = []
  for g in groups.values():
    g.sort(key=lambda st: -st['all'])
    m = g[0]
    if len(g) > 1:
      m['aliases'] = [st['name'] for st in g[1:]]
      for st in g[1:]:
        m['pts'] += st['pts']; m['ops'] |= st['ops']; m['wards'] += st['wards']
        for k in st['lines']: m['lines'][k] = 1
        for k, v in st['by'].items(): m['by'][k] = m['by'].get(k, 0) + v
      m['pt'] = (sum(q[0] for q in m['pts']) / len(m['pts']), sum(q[1] for q in m['pts']) / len(m['pts']))
      m['all'] = sum(m['by'].values()); m['jm'] = sum(v for k, v in m['by'].items() if k in JM)
      merged.append([st['name'] for st in g])
    out.append(m)
  stations = out
# 2025年の鉄道データ（N02-25）に駅がなく、乗降客数も0の駅（廃止。上野懸垂線の上野動物園東園・西園）は除く（判定 v04 の中の指摘）。
# 乗降客数0でも駅が残るもの（とうきょうスカイツリー：数が押上の側に入る）は残す
_n02s = zip_geojson('N02-25', 'N02-25_Station.geojson')
N02_NAMES = {f['properties']['N02_005'] for f in _n02s['features']}
DROPPED = [st['name'] for st in stations if st['all'] == 0 and st['name'] not in N02_NAMES]
stations = [st for st in stations if not (st['all'] == 0 and st['name'] not in N02_NAMES)]
for s in stations:
  s['pins'] = next(n for th, n in PIN_TIERS if s['all'] >= th)
stations.sort(key=lambda s: -s['all'])
for i, s in enumerate(stations): s['id'] = f's{i + 1:03d}'

# ---------- 候補地（地価公示） ----------
l01 = zip_geojson('L01-26-13', 'L01-26_13.geojson')
pts = []
for f in l01['features']:
  p = f['properties']
  if not (13101 <= int(p['L01_001']) <= 13123): continue
  g = shape(f['geometry'])
  pts.append({'lat': g.y, 'lon': g.x, 'kubun': p['L01_002'], 'price': p['L01_008'], 'desc': p['L01_047'], 'near': p['L01_048'], 'walk': p['L01_050'], 'zone': p['L01_051'], 'addr': p['L01_025'], 'no': f"公示 {p['L01_001']}-{p['L01_002']}-{p['L01_003']}"})
# 都道府県地価調査（基準地価、2026年7月1日時点）も足す。地価公示だけだと都心の大きな駅（東京・大手町など）で候補地が足りない
l02 = zip_geojson('L02-26-13', 'L02-26_13.geojson')
for f in l02['features']:
  p = f['properties']
  if not (13101 <= int(p['L02_020']) <= 13123): continue
  g = shape(f['geometry'])
  walk = {0: 30, 1: 80}.get(p['L02_046'], p['L02_046'])  # 0 は駅に接する・1 は駅に近い（置き値の距離）
  pts.append({'lat': g.y, 'lon': g.x, 'kubun': p['L02_001'], 'price': p['L02_006'], 'desc': p['L02_044'], 'near': p['L02_045'], 'walk': walk, 'zone': p['L02_047'], 'addr': p['L02_022'], 'no': f"調査 {p['L02_020']}-{p['L02_001']}-{p['L02_002']}"})
# 地価公示と地価調査は同じ土地を調べることがある（共通地点）。15m 以内の2点は1つにする（先に入れた地価公示を残す）
uniq = []
for q in pts:
  if not any(dist_m((q['lat'], q['lon']), (u['lat'], u['lon'])) < 15 for u in uniq): uniq.append(q)
DUP = len(pts) - len(uniq)
pts = uniq
for q in pts:
  q['type'] = classify(q['desc'], q['kubun'], q['zone'])
  q['ward'], q['town'] = town_of(q['addr'])
# 駅ごとの候補：半径 SITE_M 以内の地点（1つの地点は近くの何駅もの候補になりうる）
cand = {s['id']: sorted([(dist_m((q['lat'], q['lon']), s['pt']), i) for i, q in enumerate(pts) if dist_m((q['lat'], q['lon']), s['pt']) <= SITE_M]) for s in stations}
# 割り当て：ピン1本ずつの巡回（1巡目は全駅が1本、2巡目は2本以上の駅が…）。巡の中は乗降客数の多い順。
# 各駅は、まだ使われていない候補のうち、まだ持っていない属性を近い順に先に取り、なければ近い順（同じ駅で選べる型を増やす）。
# 1つの地点は1つの駅にだけ使う（地図の上でピンが重ならない）
def quad(s, q):
  dy, dx = (q['lat'] - s['pt'][0]) * KY, (q['lon'] - s['pt'][1]) * KX
  return ('北' if dy > 0 else '南') if abs(dy) >= abs(dx) else ('東' if dx > 0 else '西')


used, got = set(), {s['id']: [] for s in stations}
# 閑静な住宅地の枠（版0.5、オーナーの決定 10/30「その駅に実際にそういうエリアがあるなら入れる」）：
# ピン6本以上の駅で、重心から QUIET_M 以内に「閑静・大規模住宅・区画整然」と書かれた住宅地の地点があれば、地価のいちばん高い所を1本足す
# （渋谷なら松濤1丁目）。無い駅には足さない。普通のピンの巡回より先に取る（先に取らないと、近くの駅の普通のピンに取られる）
QUIET_M = 1200
QUIET_RE = re.compile(r'閑静|大規模住宅|区画整然')
quiet = []
for s in stations:
  if s['pins'] < 6: continue
  c = [(q['price'], dist_m((q['lat'], q['lon']), s['pt']), i) for i, q in enumerate(pts)
       if i not in used and q['type'] == 'jutaku' and QUIET_RE.search(q['desc'] or '') and dist_m((q['lat'], q['lon']), s['pt']) <= QUIET_M]
  if not c: continue
  pr, d, i = max(c)
  used.add(i); got[s['id']].append((d, i)); pts[i]['quiet'] = True; s['pins'] += 1
  quiet.append(f"{s['name']}:{pts[i]['town']}")

for k in range(max(s['pins'] for s in stations)):
  for s in stations:
    n = len(got[s['id']])
    if n >= s['pins'] or n > k: continue  # 持っている本数で数える（閑静の枠を先に持つ駅がある）。1巡に1本
    free = [(d, i) for d, i in cand[s['id']] if i not in used]
    if not free: continue
    have = {pts[i]['type'] for _, i in got[s['id']]}
    towns = {pts[i]['town'] for _, i in got[s['id']]}
    quads = {quad(s, pts[i]) for _, i in got[s['id']]}
    # 優先（版0.2、判定 M5）：属性がまだない＞方角（北・東・南・西）がまだない＞町がまだない＞近い。
    # 渋谷の「西口・センター街・松濤」のように、駅のまわりの方角ごとに性格の違う町が出るようにする
    d, i = min(free, key=lambda x: (pts[x[1]]['type'] in have, quad(s, pts[x[1]]) in quads, pts[x[1]]['town'] in towns, x[0]))
    used.add(i); got[s['id']].append((d, i))

# まだ足りない駅だけ、半径を SITE_M2 まで広げてもう一度（近い順）。それでも足りない数は報告に出し、作り話の候補地は足さない
SITE_M2 = 1500
for s in stations:
  while len(got[s['id']]) < s['pins']:
    free = sorted((dist_m((q['lat'], q['lon']), s['pt']), i) for i, q in enumerate(pts) if i not in used and dist_m((q['lat'], q['lon']), s['pt']) <= SITE_M2)
    if not free: break
    used.add(free[0][1]); got[s['id']].append(free[0])

sites = []
for s in stations:
  chosen = []
  for d, i in sorted(got[s['id']]):
    q = dict(pts[i]); q['d'] = d
    # 歩く距離：地価公示の最寄り駅がこの駅なら公示の道路距離、違えば直線×1.25（置き値）
    q['walkm'] = (q['walk'] or 30) if q['near'] == s['name'] and q['walk'] is not None else int(round(d * 1.25, -1))
    chosen.append(q)
  s['short'] = s['pins'] - len(chosen)
  for k, q in enumerate(chosen):
    ward, town = q['ward'], q['town']
    x, y = xy(q['lat'], q['lon'])
    sites.append({'id': f"{s['id']}-{k + 1}", 'st': s['id'], 'town': town, 'ward': ward, 'type': q['type'], 'x': x, 'y': y, 'walk': q['walkm'], 'price': q['price'], 'zone': q['zone'], 'desc': q['desc'], 'l01': q['no'], **({'quiet': True} if q.get('quiet') else {})})

# ---------- 地図の線 ----------
def coords(geom, tol):
  g = geom.simplify(tol / KX / 1000, preserve_topology=True)
  out = []
  for poly in (getattr(g, 'geoms', None) or [g]):
    ring = getattr(poly, 'exterior', poly)
    out.append([xy(lat, lon) for lon, lat in ring.coords])
  return out

ward_out = [{'code': c, 'name': ward_name[c], 'rings': [r for r in coords(g, 60) if len(r) > 3]} for c, g in sorted(wards.items())]
n02 = zip_geojson('N02-25', 'N02-25_RailroadSection.geojson')
lines = collections.defaultdict(list)
box = ku23.buffer(0.01)
for f in n02['features']:
  p = f['properties']
  if not inops(p['N02_004']): continue
  g = shape(f['geometry'])
  if not g.intersects(box): continue
  g = g.intersection(box)
  for part in (getattr(g, 'geoms', None) or [g]):
    if part.geom_type != 'LineString' or part.length == 0: continue
    lines[(p['N02_004'], re.sub(r'^\d+号線', '', p['N02_003']))].append([xy(lat, lon) for lon, lat in part.simplify(25 / KX / 1000).coords])
line_out = [{'op': short(op), 'name': nm, 'paths': ps} for (op, nm), ps in sorted(lines.items())]

st_out = []
for s in stations:
  x, y = xy(*s['pt'])
  st_out.append({'id': s['id'], 'name': s['name'], 'aliases': s.get('aliases', []), 'x': x, 'y': y, 'ward': ward_name[s['wards'].most_common(1)[0][0]], 'riders': s['all'], 'ridersJM': s['jm'], 'pins': s['pins'],
                 'lines': [short(op) + ' ' + ln for op, ln in s['lines']], 'byOp': s['by']})

SRC = ('出典：「国土数値情報（駅別乗降客数データ S12-25・鉄道データ N02-25・行政区域データ N03-2026・地価公示データ L01-26・都道府県地価調査データ L02-26）」（国土交通省）'
       '（https://nlftp.mlit.go.jp/ksj/）をもとに加工して作成。乗降客数は2024年度、各事業者が独自に算出した値（統一の基準ではない）。')
data = {'src': SRC, 'ops': OPS_MODE, 'year': YEAR, 'origin': ORIGIN, 'pinTiers': PIN_TIERS, 'wards': ward_out, 'lines': line_out, 'stations': st_out, 'sites': sites}
js = ('// 出店の地図（東京23区）のデータ。tools/stations-build.py が作る（手で直さない）。\n// ' + SRC + '\n'
      '(function (g) {\n  const SIM = (g.SIMDATA = g.SIMDATA || {});\n  SIM.tokyo23 = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n})(typeof window !== \'undefined\' ? window : globalThis);\n')
open(OUT, 'w', encoding='utf-8').write(js)

tc = collections.Counter(x['type'] for x in sites)
print(f"駅 {len(st_out)}（--ops {OPS_MODE}。JRとメトロ両方 {sum(1 for s in stations if set(JM) <= s['ops'])}・JRあり {sum(1 for s in stations if JM[0] in s['ops'])}・メトロあり {sum(1 for s in stations if JM[1] in s['ops'])}・JRもメトロもない {sum(1 for s in stations if not (s['ops'] & set(JM)))}）／区ごとの駅 {dict(collections.Counter(ward_name[s['wards'].most_common(1)[0][0]] for s in stations).most_common())}")
print(f"ピン 求めた数 {sum(s['pins'] for s in stations)}・置けた数 {len(sites)}・足りない駅 {sum(1 for s in stations if s['short'] > 0)}（足りない数の合計 {sum(s['short'] for s in stations)}）・候補地0の駅 {sum(1 for s in stations if not got[s['id']])}")
print(f'乗り換え駅のまとめ（{XFER_M}m 以内）{len(merged)}組：' + '／'.join('・'.join(g) for g in merged))
print(f'閑静な住宅地の枠 {len(quiet)}駅：' + '・'.join(quiet) + f'／乗降客数0で除いた駅：' + '・'.join(DROPPED))
print(f'地価公示と地価調査の同じ地点 {DUP} をまとめた（候補の地点 {len(pts)}）')
print('属性', dict(tc), '／路線', len(line_out), '／出力', OUT, f'{len(js) // 1024}KB')
if REPORT:
  with open(REPORT, 'w', encoding='utf-8') as fo:
    fo.write('id\t駅\t区\t乗降(全)\t乗降(JR+メトロ)\tピン\t置けた\t候補地の数\t属性\n')
    for s in stations:
      fo.write(f"{s['id']}\t{s['name']}\t{ward_name[s['wards'].most_common(1)[0][0]]}\t{s['all']}\t{s['jm']}\t{s['pins']}\t{s['pins'] - s['short']}\t{len(cand[s['id']])}\t{','.join(x['type'] for x in sites if x['st'] == s['id'])}\n")
