# -*- coding: utf-8 -*-
# BIZ-RAMENCOUNT23 の数を出す台本（調べ物の担当 Opus 5.5、2026-11-17）。報告の数はすべてこの出力（out/count.txt）から写す。
# 実行は run.sh（引数：research/raw/web/ramencount23・research/raw/web/footfall23・research/raw/geo/geodata・js/data/tokyo23.js・一般食堂の xls を xlsx に直したもの）
#
# 使う資料
#  OSM  OpenStreetMap（Overpass API の写し overpass.kumi.systems、2026-11-17 取得）の飲食の点：23区を囲む四角の中の amenity＝restaurant・fast_food・cafe・bar・pub・food_court
#       ラーメン店＝ amenity が restaurant・fast_food・food_court で、cuisine に ramen を含む、または店名にラーメン系の語（RAMEN_RE）を含むもの
#       © OpenStreetMap contributors（ODbL）。網羅は完全ではない（§1 で経済センサスと区ごとに比べる）
#  C21  令和3年経済センサス‐活動調査 第9-1A表（産業小分類別の全事業所数、市区町村）：76 飲食店・76B 中華料理店（ラーメン店を含む。2021年は細分類の表がない）
#  MESH 経済センサス2021・国勢調査2020 の500mメッシュ（footfall23 で取ったもの）：宿泊・飲食の事業所数・従業者数、製造業・運輸業の従業者数、夜間人口
#  RIC  令和3年経済センサス 立地環境特性編 第1表（76B 中華料理店などの立地の型ごとの事業所数・従業者数・売上）
#  MHLW 厚労省 生活衛生関係営業経営実態調査：平成26年度 中華料理店（甲票・乙票）、平成25年度 一般食堂（甲票）
#  A29  国土数値情報 用途地域（2019、東京都）／N03 行政区域（2026）
import csv, io, json, math, os, re, sys, zipfile, statistics as st, collections
import openpyxl, shapefile
from shapely.geometry import shape, Point
from shapely.strtree import STRtree

RAW, FF, GEO, T23, SHOKUDO = sys.argv[1:6]
med = st.median
def q(v):
  v = sorted(v)
  if len(v) < 2: return (v[0], v[0], v[0]) if v else (None, None, None)
  a = st.quantiles(v, n=4, method='inclusive'); return a[0], med(v), a[2]
def f(x, d=1):
  return '—' if x is None else (f'{x:,.{d}f}' if isinstance(x, float) else f'{x:,}')

# ---- ゲームの駅と候補地 ----
t = open(T23, encoding='utf8').read()
D, _ = json.JSONDecoder().raw_decode(t[t.index('SIM.tokyo23 = ') + len('SIM.tokyo23 = '):])
O = D['origin']; KX = 111.32 * math.cos(math.radians(35.68)); KY = 110.95
def latlon(x, y): return (O[0] - y / KY, O[1] + x / KX)
def xy(lat, lon): return ((lon - O[1]) * KX, (O[0] - lat) * KY)
ST = D['stations']; SITES = D['sites']; SID = {s['id']: s for s in ST}
TIERS = sorted(set(s['tier'] for s in ST))
LAM = {1: 0.3, 2: 0.5, 3: 0.8, 4: 1.1, 5: 1.5, 6: 2.0, 8: 2.6}          # 設計書 版0.7.3 4.3 の λ の段
ATTR = {'hanka': 1.4, 'shogyo': 1.2, 'office': 1.0, 'shoten': 1.0, 'jutaku': 0.6, 'kojo': 0.4}
TIERF = {1: 0.7, 2: 1.01, 3: 1.38, 4: 1.84, 5: 2.69, 6: 3.75, 8: 5.53}  # 設計書 4.1 の段の倍率（段8÷段1＝7.9）
TYPES = ['hanka', 'shogyo', 'office', 'shoten', 'jutaku', 'kojo']
print(f'# ゲームの駅 {len(ST)}・候補地 {len(SITES)}（段ごとの駅の数 ' + '・'.join(f'{k}:{sum(1 for s in ST if s["tier"] == k)}' for k in TIERS) + '）')

# ---- 区の形（N03） ----
z = zipfile.ZipFile(os.path.join(GEO, 'N03-20260101-13.xlsx'))
gj = json.loads(z.read([n for n in z.namelist() if n.endswith('.geojson')][0]))
WPOLY = []; WNAME = {}
for ft in gj['features']:
  c = ft['properties'].get('N03_007') or ''
  if c.startswith('131') and '13101' <= c <= '13123':
    WPOLY.append((c, shape(ft['geometry']))); WNAME[c] = ft['properties']['N03_004']
WTREE = STRtree([g for _, g in WPOLY])
def ward_of(lat, lon):
  p = Point(lon, lat)
  for i in WTREE.query(p):
    if WPOLY[i][1].covers(p): return WPOLY[i][0]
  return None

# ---- OSM ----
RAMEN_RE = re.compile(r'ラーメン|らーめん|らあめん|ラーメソ|拉麺|拉麵|中華そば|中華蕎麦|支那そば|つけ麺|つけめん|担々麺|担担麺|坦々麺|まぜそば|油そば|家系|二郎|ramen', re.I)
FOODAM = {'restaurant', 'fast_food', 'food_court'}
OSM = []
with open(os.path.join(RAW, 'osm-overpass-kumi-eat23.html'), encoding='utf8') as fh:
  for r in csv.DictReader(fh, delimiter='\t'):
    try: lat, lon = float(r['@lat']), float(r['@lon'])
    except ValueError: continue
    cu = (r.get('cuisine') or '').lower(); nm = (r.get('name') or '') + ' ' + (r.get('name:en') or '')
    is_r = r['amenity'] in FOODAM and ('ramen' in cu.split(';') or bool(RAMEN_RE.search(nm)))
    x, y = xy(lat, lon)
    OSM.append(dict(lat=lat, lon=lon, x=x, y=y, am=r['amenity'], ramen=is_r, by_cuisine='ramen' in cu.split(';'), w=ward_of(lat, lon)))
O23 = [o for o in OSM if o['w']]
R23 = [o for o in O23 if o['ramen']]
print(f'# OSM の点：四角の中 {len(OSM)}・23区の中 {len(O23)}（うちラーメン店 {len(R23)}：cuisine=ramen {sum(1 for o in R23 if o["by_cuisine"])}・店名だけで拾った {sum(1 for o in R23 if not o["by_cuisine"])}）')
print('# OSM 23区の中の amenity の内訳：' + json.dumps(collections.Counter(o['am'] for o in O23), ensure_ascii=False))

# 拾い方の確かめ：店名だけで拾った点（cuisine に ramen がない）を、決まった乱数で40本見せる（人の目で、ラーメン店でないものが混じっていないか）
import random
_rs = random.Random(20261117); _nm = sorted([o for o in R23 if not o['by_cuisine']], key=lambda o: (o['lat'], o['lon']))
_names = {}
with open(os.path.join(RAW, 'osm-overpass-kumi-eat23.html'), encoding='utf8') as fh:
  for r in csv.DictReader(fh, delimiter='\t'):
    try: _names[(float(r['@lat']), float(r['@lon']))] = (r.get('name') or '', r.get('cuisine') or '')
    except ValueError: pass
print('# 店名だけで拾った点の抜き取り40：' + '／'.join(f"{_names[(o['lat'], o['lon'])][0]}[{_names[(o['lat'], o['lon'])][1] or '-'}]" for o in _rs.sample(_nm, 40)))
_noodle = [o for o in O23 if o['am'] in FOODAM and not o['ramen'] and any(c in ('noodle', 'chinese') for c in _names.get((o['lat'], o['lon']), ('', ''))[1].lower().split(';'))]
print(f'# ラーメン店に数えていない cuisine＝noodle・chinese の点（23区）：{len(_noodle)}（中華料理店や麺の店。76B と比べるときの差の一部）')

# 近さの数え：格子（0.5km）で引く
GRID = collections.defaultdict(list)
for o in O23: GRID[(int(o['x'] // 0.5), int(o['y'] // 0.5))].append(o)
def near(x, y, r_km, pred):
  n = 0; gx, gy = int(x // 0.5), int(y // 0.5); k = int(r_km // 0.5) + 1
  for i in range(gx - k, gx + k + 1):
    for j in range(gy - k, gy + k + 1):
      for o in GRID.get((i, j), ()):
        if pred(o) and (o['x'] - x) ** 2 + (o['y'] - y) ** 2 <= r_km * r_km: n += 1
  return n
isR = lambda o: o['ramen']; isE = lambda o: True; isF = lambda o: o['am'] in FOODAM

# ---- 経済センサス2021 第9-1A表（区） ----
wb = openpyxl.load_workbook(os.path.join(RAW, 'estat-census21-t9-1a.xlsx'), read_only=True, data_only=True)
ws = wb.worksheets[0]; hdr = None; C21 = {}
for i, r in enumerate(ws.iter_rows(values_only=True)):
  if i == 5: hdr = list(r); col = {h: j for j, h in enumerate(hdr) if h}
  if i > 8 and r[1] and str(r[1])[:5] in [f'131{k:02d}' for k in range(0, 24)]:
    C21[str(r[1])[:5]] = {k: r[col[k]] for k in ['AS_全産業', 'M_宿泊業，飲食サービス業', '76_飲食店', '76B_中華料理店', '762_専門料理店', 'E_製造業', 'H_運輸業，郵便業']}
print('\n## 1. 区ごと：経済センサス2021（76 飲食店・76B 中華料理店）と OSM の点の数（網羅の目安）')
print('| 区 | C21 76 飲食店 | C21 76B 中華料理店 | 76B÷76 | OSM 飲食の点（全 amenity） | OSM 飲食÷C21 76 | OSM ラーメン店 | OSM ラーメン÷C21 76B |')
print('|---|---|---|---|---|---|---|---|')
WCOV = {}
for c in sorted(WNAME):
  e = sum(1 for o in O23 if o['w'] == c); rr = sum(1 for o in R23 if o['w'] == c); cc = C21[c]
  WCOV[c] = dict(eat=e / cc['76_飲食店'], ram=rr / cc['76B_中華料理店'], share=cc['76B_中華料理店'] / cc['76_飲食店'])
  print(f"| {WNAME[c]} | {cc['76_飲食店']:,} | {cc['76B_中華料理店']:,} | {WCOV[c]['share']:.3f} | {e:,} | {WCOV[c]['eat']:.2f} | {rr} | {WCOV[c]['ram']:.2f} |")
tot = C21['13100']
print(f"| 23区（特別区部） | {tot['76_飲食店']:,} | {tot['76B_中華料理店']:,} | {tot['76B_中華料理店'] / tot['76_飲食店']:.3f} | {len(O23):,} | {len(O23) / tot['76_飲食店']:.2f} | {len(R23)} | {len(R23) / tot['76B_中華料理店']:.2f} |")
ce = [WCOV[c]['eat'] for c in WNAME]; cr = [WCOV[c]['ram'] for c in WNAME]
print(f'- 区ごとの OSM 飲食÷C21 76 の幅 {min(ce):.2f}〜{max(ce):.2f}（中央 {med(ce):.2f}）・OSM ラーメン÷C21 76B の幅 {min(cr):.2f}〜{max(cr):.2f}（中央 {med(cr):.2f}）')
def spearman(a, b):
  def rk(v):
    o = sorted(range(len(v)), key=lambda i: v[i]); r = [0] * len(v); i = 0
    while i < len(o):
      j = i
      while j + 1 < len(o) and v[o[j + 1]] == v[o[i]]: j += 1
      for k in range(i, j + 1): r[o[k]] = (i + j) / 2
      i = j + 1
    return r
  ra, rb = rk(a), rk(b); ma, mb = st.mean(ra), st.mean(rb)
  return sum((x - ma) * (y - mb) for x, y in zip(ra, rb)) / math.sqrt(sum((x - ma) ** 2 for x in ra) * sum((y - mb) ** 2 for y in rb))
ws_ = sorted(WNAME)
print(f"- 区の順位相関：OSM ラーメン店の数 と C21 76B の数 {spearman([sum(1 for o in R23 if o['w'] == c) for c in ws_], [C21[c]['76B_中華料理店'] for c in ws_]):.3f}・OSM 飲食の点 と C21 76 {spearman([sum(1 for o in O23 if o['w'] == c) for c in ws_], [C21[c]['76_飲食店'] for c in ws_]):.3f}")
print(f"- ラーメンの網羅（OSM ラーメン÷C21 76B）と 区の76B の数の順位相関 {spearman(cr, [C21[c]['76B_中華料理店'] for c in ws_]):.3f}・都心3区（千代田・中央・港）の OSM ラーメン÷76B {sum(sum(1 for o in R23 if o['w'] == c) for c in ('13101','13102','13103')) / sum(C21[c]['76B_中華料理店'] for c in ('13101','13102','13103')):.2f}・外周の区（足立・葛飾・江戸川・板橋・練馬・北）{sum(sum(1 for o in R23 if o['w'] == c) for c in ('13121','13122','13123','13119','13120','13117')) / sum(C21[c]['76B_中華料理店'] for c in ('13121','13122','13123','13119','13120','13117')):.2f}")
print(f"- 網羅（OSM 飲食÷C21 76）と 区の飲食店の密度（C21 76）の順位相関 {spearman(ce, [C21[c]['76_飲食店'] for c in ws_]):.3f}（正なら、店の多い区ほど OSM がよく拾う＝大きい駅の数を大きく出す向きの偏り）")

# ---- メッシュ（footfall23 の e-Stat） ----
def mesh4(lat, lon):
  p = int(lat * 1.5); a = lat * 60 - p * 40; u = int(lon - 100); f_ = lon - 100 - u
  q_ = int(a / 5); v = int(f_ * 60 / 7.5); b = a - q_ * 5; g = f_ * 60 - v * 7.5
  r = int(b * 60 / 30); w = int(g * 60 / 45); b2 = b * 60 - r * 30; g2 = g * 60 - w * 45
  return f'{p:02d}{u:02d}{q_}{v}{r}{w}' + str(1 + (1 if g2 >= 22.5 else 0) + (2 if b2 >= 15 else 0))
def readmesh(fn, cols):
  zz = zipfile.ZipFile(os.path.join(FF, fn)); txt = zz.read(zz.namelist()[0]).decode('cp932', 'replace').splitlines()
  head = txt[0].split(','); idx = {c: head.index(c) for c in cols}; out = {}
  for line in txt[2:]:
    r = line.split(',')
    def num(x):
      try: return int(x)
      except: return None
    out[r[0]] = {c: num(r[idx[c]]) for c in cols}
  return out
EMP5 = readmesh('estat-T001162-5339.xlsx', ['T001162015', 'T001162022', 'T001162027', 'T001162031', 'T001162036'])
POP5 = readmesh('estat-T001141-5339.xlsx', ['T001141001'])
def mv(lat, lon):
  c = mesh4(lat, lon); e = EMP5.get(c) or {}; p = POP5.get(c) or {}
  return dict(mesh=c, food_est=e.get('T001162015'), emp=e.get('T001162022'), mfg=e.get('T001162027'), trn=e.get('T001162031'), food_emp=e.get('T001162036'), pop=p.get('T001141001'))

# ---- 2. 駅ごと ----
SROW = []
for s in ST:
  lat, lon = latlon(s['x'], s['y']); m = mv(lat, lon); wc = None
  for c, nm in WNAME.items():
    if nm == s['ward']: wc = c
  r5 = near(s['x'], s['y'], 0.5, isR); e5 = near(s['x'], s['y'], 0.5, isE); fa5 = near(s['x'], s['y'], 0.5, isF)
  cov = WCOV[wc]['eat'] if wc else None
  proxy = (m['food_est'] * C21[wc]['76B_中華料理店'] / C21[wc]['M_宿泊業，飲食サービス業']) if (wc and m['food_est'] is not None) else None
  SROW.append(dict(name=s['name'], tier=s['tier'], foot=s['foot'], riders=s['riders'], r3=near(s['x'], s['y'], 0.3, isR), r5=r5, r8=near(s['x'], s['y'], 0.8, isR), e5=e5, fa5=fa5,
                   r5adj=(r5 / cov) if cov else None, food_est=m['food_est'], proxy=proxy, ward=s['ward']))
print('\n## 2. 駅の段ごとの、駅から半径500m の中のラーメン店の数（OSM）')
print('段は tokyo23.js の tier（駅の人通り foot の段）。foot は乗り換えを除いた1日の人通り（設計書 3.1）。')
print('| 段 | 駅 | foot の中央（万人） | ラーメン店 500m 25%・中央・75% | 平均 | 0軒の駅 | 300m の平均・0軒 | 800m の平均 | OSM 飲食の点 500m の中央 | ラーメン÷飲食の点（合計どうし） | 網羅で割った数（OSM÷区の網羅）の平均 | 代理：メッシュの宿泊飲食の事業所×区の76B÷M の平均 |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|')
TS = {}
for k in TIERS:
  a = [r for r in SROW if r['tier'] == k]
  r5 = [r['r5'] for r in a]; a3 = q(r5)
  TS[k] = dict(n=len(a), foot=med([r['foot'] for r in a]), mean5=st.mean(r5), med5=med(r5), zero5=sum(1 for v in r5 if v == 0) / len(a),
               mean3=st.mean([r['r3'] for r in a]), zero3=sum(1 for r in a if r['r3'] == 0) / len(a), mean8=st.mean([r['r8'] for r in a]),
               adj=st.mean([r['r5adj'] for r in a if r['r5adj'] is not None]), proxy=st.mean([r['proxy'] for r in a if r['proxy'] is not None]),
               footsum=sum(r['foot'] for r in a), rsum=sum(r5), esum=sum(r['e5'] for r in a))
  print(f"| {k} | {len(a)} | {TS[k]['foot'] / 1e4:.1f} | {a3[0]:.0f}・{a3[1]:.0f}・{a3[2]:.0f} | {TS[k]['mean5']:.2f} | {TS[k]['zero5']:.0%} | {TS[k]['mean3']:.2f}・{TS[k]['zero3']:.0%} | {TS[k]['mean8']:.2f} | {med([r['e5'] for r in a]):.0f} | {TS[k]['rsum'] / max(1, TS[k]['esum']):.3f} | {TS[k]['adj']:.2f} | {TS[k]['proxy']:.2f} |")
t1, t8 = TS[1], TS[8]
print(f"- 段8÷段1（平均どうし）：OSM 500m {t8['mean5'] / t1['mean5']:.1f}倍・網羅で割った数 {t8['adj'] / t1['adj']:.1f}倍・センサスの代理 {t8['proxy'] / t1['proxy']:.1f}倍・300m {t8['mean3'] / t1['mean3']:.1f}倍・800m {t8['mean8'] / t1['mean8']:.1f}倍（設計書 4.3 の λ の段8÷段1＝{LAM[8] / LAM[1]:.1f}倍）")
print(f"- 段6・8 をまとめ、段5 と並べる（段8は3駅・段6は2駅で少ない）：段6+8 の平均 {st.mean([r['r5'] for r in SROW if r['tier'] >= 6]):.1f}・段5 {TS[5]['mean5']:.1f}・段4 {TS[4]['mean5']:.1f}")
print('- λ の段の形（段1を1とした比）と、OSM 500m の平均の段の形（段1を1）：' + '・'.join(f"段{k} λ {LAM[k] / LAM[1]:.1f}／OSM {TS[k]['mean5'] / t1['mean5']:.1f}" for k in TIERS))
# 人通り÷ラーメン店（ラーメン店1店あたりの駅の人通り）
print('\n### 2.1 ラーメン店1店あたりの駅の人通り（foot÷500m のラーメン店）')
print('| 段 | 合計どうし（段の foot の和÷段の店の和、人） | 駅ごとの比の中央（店1以上の駅、人） | 店1以上の駅の数 |')
print('|---|---|---|---|')
PP = {}
for k in TIERS:
  a = [r for r in SROW if r['tier'] == k]; pos = [r['foot'] / r['r5'] for r in a if r['r5'] > 0]
  PP[k] = dict(agg=TS[k]['footsum'] / TS[k]['rsum'] if TS[k]['rsum'] else None, med=med(pos) if pos else None, n=len(pos))
  print(f"| {k} | {f(PP[k]['agg'], 0)} | {f(PP[k]['med'], 0)} | {PP[k]['n']} |")
print(f"- 段8÷段1：合計どうし {PP[8]['agg'] / PP[1]['agg']:.2f}倍・駅ごとの中央どうし {PP[8]['med'] / PP[1]['med']:.2f}倍（設計書の段の倍率の比 7.9倍・前の版 2.14倍）")
# 0軒の駅を店0.5 とみなすと（下側の切りを和らげる）
pp1 = med([r['foot'] / max(0.5, r['r5']) for r in SROW if r['tier'] == 1]); pp8 = med([r['foot'] / max(0.5, r['r5']) for r in SROW if r['tier'] == 8])
print(f"- 0軒の駅を0.5軒とみなして全駅で中央：段1 {pp1:,.0f}・段8 {pp8:,.0f}（{pp8 / pp1:.2f}倍）")
pa1 = TS[1]['footsum'] / sum(r['r5adj'] for r in SROW if r['tier'] == 1 and r['r5adj']); pa8 = TS[8]['footsum'] / sum(r['r5adj'] for r in SROW if r['tier'] == 8 and r['r5adj'])
pc1 = TS[1]['footsum'] / sum(r['proxy'] for r in SROW if r['tier'] == 1 and r['proxy']); pc8 = TS[8]['footsum'] / sum(r['proxy'] for r in SROW if r['tier'] == 8 and r['proxy'])
print(f"- 網羅で割った数で合計どうし：段1 {pa1:,.0f}・段8 {pa8:,.0f}（{pa8 / pa1:.2f}倍）／センサスの代理で合計どうし：段1 {pc1:,.0f}・段8 {pc8:,.0f}（{pc8 / pc1:.2f}倍）")
# 回帰：log(店) = a + β log(foot)
def slope(rows, key):
  xs = [math.log(r['foot']) for r in rows if r[key] and r[key] > 0 and r['foot']]; ys = [math.log(r[key]) for r in rows if r[key] and r[key] > 0 and r['foot']]
  mx, my = st.mean(xs), st.mean(ys); return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs), len(xs)
for key, lab in [('r5', 'OSM ラーメン 500m'), ('e5', 'OSM 飲食の点 500m'), ('proxy', 'センサスの代理'), ('food_est', 'メッシュの宿泊飲食の事業所')]:
  b, n = slope(SROW, key); print(f'- log(数) を log(foot) で回帰した傾き β（数が0の駅を除く {n} 駅）：{lab} β＝{b:.2f}（foot が68倍で {68 ** b:.1f}倍・店1つあたりの foot は {68 ** (1 - b):.1f}倍）')
# 大きい駅のすぐ隣の小さい駅（新宿西口・末広町・京成上野など）は、500m の円が大きい駅の町と重なる。段5以上の駅から1km より遠い駅だけで比べ直す
BIG = [s for s in ST if s['tier'] >= 5]
for s, r in zip(ST, SROW): r['dbig'] = min(math.hypot(s['x'] - b['x'], s['y'] - b['y']) for b in BIG)
far = [r for r in SROW if r['tier'] < 5 and r['dbig'] > 1.0]
print('- 段5以上の駅から1km より遠い駅だけ（段1〜4、大きい駅の町と円が重ならない）：' + '・'.join(f"段{k} {sum(1 for r in far if r['tier'] == k)}駅 平均 {st.mean([r['r5'] for r in far if r['tier'] == k]):.2f}・中央 {med([r['r5'] for r in far if r['tier'] == k]):.0f}・0軒 {sum(1 for r in far if r['tier'] == k and r['r5'] == 0) / sum(1 for r in far if r['tier'] == k):.0%}" for k in (1, 2, 3, 4)))
f1 = [r for r in far if r['tier'] == 1]
print(f"  - これで段8÷段1：店の数の平均 {t8['mean5'] / st.mean([r['r5'] for r in f1]):.1f}倍・店1つあたりの foot（合計どうし）{PP[8]['agg'] / (sum(r['foot'] for r in f1) / max(1, sum(r['r5'] for r in f1))):.2f}倍")
# 8倍（7.9）と2倍（2.14）のどちらに近いか：対数の距離で並べる（店1つあたりの foot の段8÷段1 の見積もりごと）
b_osm, _ = slope(SROW, 'r5')
EST = [('OSM 合計どうし', PP[8]['agg'] / PP[1]['agg']), ('OSM 駅ごとの中央', PP[8]['med'] / PP[1]['med']), ('OSM 0軒を0.5軒', pp8 / pp1),
       ('OSM 網羅で割った合計どうし', pa8 / pa1), ('センサスの代理 合計どうし', pc8 / pc1),
       ('OSM 大きい駅の隣を除いた段1 合計どうし', PP[8]['agg'] / (sum(r['foot'] for r in f1) / max(1, sum(r['r5'] for r in f1)))), ('OSM 回帰（0軒の駅を除く）', 68 ** (1 - b_osm))]
print(f'- 8倍と2倍のどちらに近いか（対数の距離 |ln(見積もり)−ln(7.9)| と |ln(見積もり)−ln(2.14)|。2つの幾何平均は √(7.9×2.14)＝{math.sqrt(7.9 * 2.14):.2f}）：')
for lab, v in EST:
  d8, d2 = abs(math.log(v) - math.log(7.9)), abs(math.log(v) - math.log(2.14))
  print(f'  - {lab} {v:.2f}倍：8倍まで {d8:.2f}・2倍まで {d2:.2f} → {"8倍" if d8 < d2 else "2倍"}の側')
print(f'  - 見積もり {len(EST)} 本の中央 {med([v for _, v in EST]):.2f}倍・幾何平均 {math.exp(st.mean([math.log(v) for _, v in EST])):.2f}倍')
fr = [r['foot'] for r in SROW if r['foot']]
print(f"- 参考：段8÷段1 の foot の中央の比 {t8['foot'] / t1['foot']:.1f}倍")
print(f"- 駅ごとの順位相関：foot と OSM ラーメン 500m {spearman([r['foot'] for r in SROW], [r['r5'] for r in SROW]):.3f}・foot と メッシュの宿泊飲食の事業所 {spearman([r['foot'] for r in SROW if r['food_est'] is not None], [r['food_est'] for r in SROW if r['food_est'] is not None]):.3f}・OSM ラーメン と メッシュの宿泊飲食の事業所 {spearman([r['r5'] for r in SROW if r['food_est'] is not None], [r['food_est'] for r in SROW if r['food_est'] is not None]):.3f}")
print('- 段8・段6 の駅：' + '・'.join(f"{r['name']}(段{r['tier']}) 500m {r['r5']}・300m {r['r3']}・800m {r['r8']}" for r in SROW if r['tier'] >= 6))
print('- 500m のラーメン店の多い駅 上位15：' + '・'.join(f"{r['name']}(段{r['tier']}) {r['r5']}" for r in sorted(SROW, key=lambda r: -r['r5'])[:15]))
print('- 段1 で500m に5軒以上の駅：' + '・'.join(f"{r['name']} {r['r5']}" for r in sorted(SROW, key=lambda r: -r['r5']) if r['tier'] == 1 and r['r5'] >= 5))

# ---- 3. 候補地ごと ----
print('\n## 3. 候補地（ピン）のまわりのラーメン店（OSM）と、設計書 4.3 の λ の中心 c')
print('c ＝ round(λ段 × 属性の倍率 × m)、m＝1.0（版0.7.3 の初め）。ゲームの軒数は c−1・c・c+1 を 0.2・0.6・0.2（上限5）。OSM は半径 r の中の点の数（網羅は完全でない）。')
for k in SITES:
  lat, lon = latlon(k['x'], k['y']); k['_m'] = mv(lat, lon)
  for r_ in (0.1, 0.2, 0.3, 0.5): k[f'_r{int(r_ * 1000)}'] = near(k['x'], k['y'], r_, isR)
  k['_c'] = int(math.floor(LAM[SID[k['st']]['tier']] * ATTR[k['type']] * 1.0 + 0.5))
  k['_tier'] = SID[k['st']]['tier']
  c_ = k['_c']; k['_E'] = 0.2 * min(5, max(0, c_ - 1)) + 0.6 * min(5, c_) + 0.2 * min(5, c_ + 1); k['_P0'] = 0.8 if c_ == 0 else (0.2 if c_ == 1 else 0.0)
print('| 段 | 候補地 | 100m 0軒 | 200m 平均・0軒 | 300m 平均・0軒 | 500m 平均 | 設計の c の平均・c＝0 の割合 | 設計の軒数の期待・0軒の確率の平均 |')
print('|---|---|---|---|---|---|---|---|')
SS = {}
for k in TIERS:
  a = [s for s in SITES if s['_tier'] == k]
  SS[k] = dict(m2=st.mean([s['_r200'] for s in a]), m3=st.mean([s['_r300'] for s in a]), c=st.mean([s['_c'] for s in a]), E=st.mean([s['_E'] for s in a]), P0=st.mean([s['_P0'] for s in a]))
  print(f"| {k} | {len(a)} | {sum(1 for s in a if s['_r100'] == 0) / len(a):.0%} | {SS[k]['m2']:.2f}・{sum(1 for s in a if s['_r200'] == 0) / len(a):.0%} | {SS[k]['m3']:.2f}・{sum(1 for s in a if s['_r300'] == 0) / len(a):.0%} | {st.mean([s['_r500'] for s in a]):.2f} | {SS[k]['c']:.2f}・{sum(1 for s in a if s['_c'] == 0) / len(a):.0%} | {SS[k]['E']:.2f}・{SS[k]['P0']:.0%} |")
print(f"- 段8÷段1（候補地の平均）：200m {SS[8]['m2'] / SS[1]['m2']:.1f}倍・300m {SS[8]['m3'] / SS[1]['m3']:.1f}倍（λ 8.7倍。設計の軒数の期待の比 {SS[8]['E'] / SS[1]['E']:.1f}倍）")
A = SITES
for r_ in (100, 200, 300):
  print(f"- 全 {len(A)} 候補地で半径{r_}m に0軒：{sum(1 for s in A if s[f'_r{r_}'] == 0) / len(A):.0%}（設計の c＝0：{sum(1 for s in A if s['_c'] == 0) / len(A):.0%}・設計で0軒になる確率の平均 {st.mean([s['_P0'] for s in A]):.0%}）")
print('| 属性 | 候補地 | 200m 平均・0軒 | 300m 平均・0軒 | 設計の属性の倍率 | 200m の平均を店とオフィス以外… 段をそろえた比（属性の平均÷同じ段の全体の平均、の平均） |')
print('|---|---|---|---|---|---|')
tm = {k: st.mean([s['_r200'] for s in SITES if s['_tier'] == k]) for k in TIERS}
for ty in TYPES:
  a = [s for s in SITES if s['type'] == ty]
  rel = [s['_r200'] / tm[s['_tier']] for s in a if tm[s['_tier']] > 0]
  print(f"| {ty} | {len(a)} | {st.mean([s['_r200'] for s in a]):.2f}・{sum(1 for s in a if s['_r200'] == 0) / len(a):.0%} | {st.mean([s['_r300'] for s in a]):.2f}・{sum(1 for s in a if s['_r300'] == 0) / len(a):.0%} | {ATTR[ty]} | {st.mean(rel):.2f} |")

# ---- 4. 立地環境特性編（2021）：立地の型ごとの1事業所の売上 ----
print('\n## 4. 経済センサス2021 立地環境特性編 第1表：立地の型ごとの1事業所あたり（全国、売上は2020年）')
wb = openpyxl.load_workbook(os.path.join(RAW, 'estat-ricchi-000040186980.xlsx'), read_only=True, data_only=True)
RIC = collections.defaultdict(dict)
for r in wb.worksheets[0].iter_rows(values_only=True):
  if r[0] and isinstance(r[3], (int, float)) and r[2] in ('76B_中華料理店', 'M2_飲食サービス業計', '76_飲食店', '763_そば・うどん店'):
    RIC[r[2]][r[0]] = (r[3], r[4], r[5])
for ind in ('76B_中華料理店', 'M2_飲食サービス業計', '763_そば・うどん店'):
  print(f'### {ind}')
  print('| 立地の型 | 事業所 | 1事業所の従業者（人） | 1事業所の年売上（万円） | 従業者1人の年売上（万円） | 住宅地区に対する1事業所の売上の比 |')
  print('|---|---|---|---|---|---|')
  base = RIC[ind].get('30_住宅地区')
  for k, (n, e, s_) in sorted(RIC[ind].items()):
    print(f"| {k} | {n:,} | {e / n:.1f} | {s_ * 100 / n:,.0f} | {s_ * 100 / e:,.0f} | {(s_ / n) / (base[2] / base[0]):.2f} |")

# ---- 4.2 立地環境特性編 第2表：23区の商業集積地区（駅周辺型【11】）の飲食サービス業。地区の名に「（駅名）駅」を含むものを駅に当て、段ごとに1事業所の売上を比べる ----
print('\n## 4.2 立地環境特性編 第2表：23区の駅周辺型の商業集積地区（名に「〇〇駅」を含む地区）の飲食サービス業（M2）の1事業所の年売上（2020年）')
wb = openpyxl.load_workbook(os.path.join(RAW, 'estat-ricchi-000040186981.xlsx'), read_only=True, data_only=True)
names = sorted({s['name'] for s in ST}, key=len, reverse=True); byst = collections.defaultdict(lambda: [0, 0, 0, []]); nd = 0; nd_all = 0
for r in wb.worksheets[0].iter_rows(values_only=True):
  if r[1] != '13_東京都' or not r[2] or not ('101' <= str(r[2]) <= '123') or r[5] != '11': continue
  nd_all += 1
  est, emp, sal = r[13], r[15], r[16]
  if not all(isinstance(v, (int, float)) for v in (est, emp, sal)) or est == 0: continue
  hit = next((n for n in names if (n + '駅') in str(r[4])), None)
  if not hit: continue
  nd += 1; b = byst[hit]; b[0] += est; b[1] += emp; b[2] += sal; b[3].append(str(r[4]))
print(f'- 23区の駅周辺型の地区 {nd_all}・うち名に駅名＋「駅」を含み、飲食の数が秘匿でない地区 {nd}・当たった駅 {len(byst)}')
print('| 段 | 駅 | 地区の飲食の事業所の和 | 1事業所の年売上の中央（万円、駅ごと） | 合計どうしの1事業所の年売上（万円） | 合計どうしの従業者1人の年売上（万円） |')
print('|---|---|---|---|---|---|')
tierof = {s['name']: s['tier'] for s in ST}
GT = collections.defaultdict(list)
for n, b in byst.items(): GT[tierof[n]].append((n, b))
for k in sorted(GT):
  a = GT[k]; E = sum(b[0] for _, b in a); M = sum(b[1] for _, b in a); S = sum(b[2] for _, b in a)
  print(f"| {k} | {len(a)} | {E:,} | {med([b[2] * 100 / b[0] for _, b in a]):,.0f} | {S * 100 / E:,.0f} | {S * 100 / M:,.0f} |")
print('- 駅ごと（段・地区の飲食の事業所・1事業所の年売上 万円）：' + '・'.join(f"{n}(段{tierof[n]}) {b[0]}・{b[2] * 100 / b[0]:,.0f}" for n, b in sorted(byst.items(), key=lambda x: (-tierof[x[0]], x[0]))))
fo = {s['name']: s['foot'] for s in ST}
print(f"- 駅の foot と 1事業所の年売上 の順位相関（{len(byst)} 駅）：{spearman([fo[n] for n in byst], [b[2] / b[0] for b in byst.values()]):.3f}・foot と 従業者1人の年売上：{spearman([fo[n] for n in byst], [b[2] / b[1] for b in byst.values()]):.3f}")

# ---- 5. 厚労省 生活衛生関係営業経営実態調査（立地条件別） ----
print('\n## 5. 厚労省 生活衛生関係営業経営実態調査：立地条件別（全国の標本）')
def grab(fn, sheet, keys, valcol=-1):
  wb = openpyxl.load_workbook(fn, read_only=True, data_only=True); out = {}
  for r in wb[sheet].iter_rows(values_only=True):
    v = [c for c in r if c is not None]
    for kk in keys:
      if kk in [str(c).strip() for c in v[:2]]:
        i = [str(c).strip() for c in v[:2]].index(kk); out[kk] = (v[i + 1], v[valcol])
  return out
K = ['総数', '中華そば（ラーメン）店', '商業地区', '住宅地区', '工場・オフィス街', '郊外']
ch = os.path.join(RAW, 'mhlw-chuka-h26-kohyo.xlsx')
c13 = grab(ch, '13', K); c14 = grab(ch, '14', K)
wbo = openpyxl.load_workbook(os.path.join(RAW, 'mhlw-chuka-h26-otsuhyo.xlsx'), read_only=True, data_only=True); o1 = {}
for r in wbo['1'].iter_rows(values_only=True):
  v = [c for c in r if c is not None]; ss = [str(c).strip() for c in v[:2]]
  for kk in K:
    if kk in ss or (kk == '中華そば（ラーメン）店' and '中華そば（ラーメン）' in ss):
      i = ss.index(kk) if kk in ss else ss.index('中華そば（ラーメン）'); o1[kk] = (v[i + 1], v[i + 5])
print('### 中華料理店（平成26年10月、集計366施設。乙票の売上は回答137施設）')
print('| 区分 | 施設（甲票） | 1日平均客数（人） | 客1人の単価（円） | 客数×単価×月26日（万円、【推論の掛け算】） | 乙票の施設 | 1施設の年売上（当年分、万円） |')
print('|---|---|---|---|---|---|---|')
for kk in K:
  a = c13.get(kk); b = c14.get(kk); o = o1.get(kk)
  print(f"| {kk} | {a[0] if a else '—'} | {a[1]:.1f} | {b[1]:,.0f} | {a[1] * b[1] * 26 / 1e4:,.0f} | {o[0] if o else '—'} | {o[1] / 10:,.0f} |")
print(f"- 商業地区÷住宅地区：客数 {c13['商業地区'][1] / c13['住宅地区'][1]:.2f}倍・単価 {c14['商業地区'][1] / c14['住宅地区'][1]:.2f}倍・年売上 {o1['商業地区'][1] / o1['住宅地区'][1]:.2f}倍／工場・オフィス街÷住宅地区：客数 {c13['工場・オフィス街'][1] / c13['住宅地区'][1]:.2f}倍・単価 {c14['工場・オフィス街'][1] / c14['住宅地区'][1]:.2f}倍")
sk = grab(SHOKUDO, '13', K); sk14 = grab(SHOKUDO, '14', K)
print('### 一般食堂（平成25年、集計358施設）')
print('| 区分 | 施設 | 1日平均客数（人） | 客1人の単価（円） |')
print('|---|---|---|---|')
for kk in K:
  if kk in sk: print(f"| {kk} | {sk[kk][0]} | {sk[kk][1]:.1f} | {sk14[kk][1]:,.0f} |")
# 駐車場（中華料理店 甲票22）
wb = openpyxl.load_workbook(ch, read_only=True, data_only=True)
for r in wb['22'].iter_rows(values_only=True):
  v = [c for c in r if c is not None]; ss = [str(c).strip() for c in v[:2]]
  for kk in K:
    if kk in ss:
      i = ss.index(kk); n = v[i + 1]; print(f"- 中華料理店 駐車場あり（甲票22）：{kk} {v[i + 2]}/{n}（{v[i + 2] / n:.0%}）")

# ---- 6. 工場・倉庫の候補地（kojo） ----
print('\n## 6. 工場・倉庫の候補地（type＝kojo）の全部と、500m メッシュの昼の働き手・製造業と運輸業・飲食の事業所')
zz = zipfile.ZipFile(os.path.join(GEO, 'A29-19-13.xlsx')); base = [n for n in zz.namelist() if n.endswith('13000.shp')][0][:-4]
rd = shapefile.Reader(shp=io.BytesIO(zz.read(base + '.shp')), dbf=io.BytesIO(zz.read(base + '.dbf')), shx=io.BytesIO(zz.read(base + '.shx')), encoding='cp932')
ZP = []
for sr in rd.iterShapeRecords():
  try: ZP.append((sr.record[4], shape(sr.shape.__geo_interface__)))
  except Exception: pass
ZT = STRtree([g for _, g in ZP])
def zone_at(lat, lon):
  p = Point(lon, lat)
  for i in ZT.query(p):
    if ZP[i][1].covers(p): return ZP[i][0]
  return '（用途地域の外）'
def per1000(m):
  return (1000 * m['food_est'] / m['emp']) if (m['food_est'] is not None and m['emp']) else None
print('| # | 町 | 区 | 駅（段） | 歩き(m) | 用途地域（A29、点の位置） | 500m メッシュ | 夜間人口 | 従業者 | 製造業 | 運輸業 | 製造＋運輸の割合 | 宿泊飲食の事業所 | 従業者1,000人あたり | OSM ラーメン 200m・500m | day（昼の比） |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for i, s in enumerate([s for s in SITES if s['type'] == 'kojo']):
  lat, lon = latlon(s['x'], s['y']); m = s['_m']; s['_zone'] = zone_at(lat, lon)
  mt = (m['mfg'] or 0) + (m['trn'] or 0)
  print(f"| {i + 1} | {s['town']} | {s['ward']} | {SID[s['st']]['name']}（{s['_tier']}） | {s['walk']} | {s['_zone']} | {m['mesh']} | {f(m['pop'])} | {f(m['emp'])} | {f(m['mfg'])} | {f(m['trn'])} | {'—' if not m['emp'] else f'{mt / m['emp']:.0%}'} | {f(m['food_est'])} | {f(per1000(m), 1)} | {s['_r200']}・{s['_r500']} | {f(s.get('day'), 2) if s.get('day') is not None else '—'} |")
print('\n| 属性 | 候補地 | 従業者の中央 | 夜間人口の中央 | 製造＋運輸の割合の中央 | 宿泊飲食の事業所の中央 | 従業者1,000人あたりの事業所 25%・中央・75% | （従業者＋夜間人口）1,000人あたりの中央 | OSM ラーメン 500m の平均 |')
print('|---|---|---|---|---|---|---|---|---|')
for ty in TYPES:
  a = [s['_m'] for s in SITES if s['type'] == ty]; ok = [m for m in a if m['emp']]
  p1 = q([per1000(m) for m in ok if per1000(m) is not None])
  pp = [1000 * m['food_est'] / (m['emp'] + (m['pop'] or 0)) for m in ok if m['food_est'] is not None]
  print(f"| {ty} | {len(a)} | {med([m['emp'] for m in ok]):,.0f} | {med([m['pop'] or 0 for m in ok]):,.0f} | {med([((m['mfg'] or 0) + (m['trn'] or 0)) / m['emp'] for m in ok]):.0%} | {med([m['food_est'] for m in ok if m['food_est'] is not None]):.0f} | {p1[0]:.1f}・{p1[1]:.1f}・{p1[2]:.1f} | {med(pp):.1f} | {st.mean([s['_r500'] for s in SITES if s['type'] == ty]):.2f} |")
# 段をそろえた比べ：kojo と、同じ駅の他の属性
print('\n- 同じ駅にある他の属性の候補地と比べる（kojo の候補地の駅ごと、kojo のメッシュの値÷同じ駅の他の候補地のメッシュの値の中央）：')
rat_emp = []; rat_f = []; rat_p = []
for s in [s for s in SITES if s['type'] == 'kojo']:
  oth = [o for o in SITES if o['st'] == s['st'] and o['type'] != 'kojo']
  if not oth: continue
  me = med([o['_m']['emp'] or 0 for o in oth]); mf = med([o['_m']['food_est'] or 0 for o in oth]); mp = [per1000(o['_m']) for o in oth if per1000(o['_m']) is not None]
  if me: rat_emp.append((s['_m']['emp'] or 0) / me)
  if mf: rat_f.append((s['_m']['food_est'] or 0) / mf)
  if mp and per1000(s['_m']) is not None: rat_p.append(per1000(s['_m']) / med(mp))
print(f"  従業者 中央 {med(rat_emp):.2f}倍（{len(rat_emp)} か所）・宿泊飲食の事業所 中央 {med(rat_f):.2f}倍（{len(rat_f)}）・従業者1,000人あたりの事業所 中央 {med(rat_p):.2f}倍（{len(rat_p)}、1より小さいのは {sum(1 for v in rat_p if v < 1)}）")
print('- 地価（tokyo23.js の price、円/㎡、地価公示・地価調査の点）の属性ごとの中央：' + '・'.join(f"{ty} {med([s['price'] for s in SITES if s['type'] == ty]):,.0f}" for ty in TYPES))
# kojo の2つの型：昼の比 day が0.8以上（住む人がほとんどいない湾岸・物流の型）と、それ以外（住工混在の型）
for lab, cond in [('湾岸・物流の型（day≥0.8 か夜間人口なし、かつ従業者1万人未満）', lambda s: (s.get('day') is None or s['day'] >= 0.8) and (s['_m']['emp'] or 0) < 10000),
                  ('住工混在の型（day<0.8）', lambda s: s.get('day') is not None and s['day'] < 0.8),
                  ('都心の事務所街に置かれた kojo（従業者1万人以上）', lambda s: (s['_m']['emp'] or 0) >= 10000)]:
  a = [s for s in SITES if s['type'] == 'kojo' and cond(s)]; ms = [s['_m'] for s in a]
  pk = [per1000(m) for m in ms if per1000(m) is not None]
  print(f"- kojo {lab}：{len(a)} か所（{'・'.join(s['town'] for s in a)}）。従業者の中央 {med([m['emp'] or 0 for m in ms]):,.0f}・夜間人口の中央 {med([m['pop'] or 0 for m in ms]):,.0f}・宿泊飲食の事業所の中央 {med([m['food_est'] or 0 for m in ms]):.0f}・従業者1,000人あたりの中央 {med(pk):.1f}・OSM ラーメン 500m 0軒 {sum(1 for s in a if s['_r500'] == 0)}/{len(a)}")
zc = collections.Counter(s['_zone'] for s in SITES if s['type'] == 'kojo')
print('- kojo の点の用途地域：' + json.dumps(zc, ensure_ascii=False))
# 区の製造業・運輸業（C21）
print('- 区ごとの事業所（C21）製造業・運輸業：' + '・'.join(f"{WNAME[c]} 製造{C21[c]['E_製造業']:,}・運輸{C21[c]['H_運輸業，郵便業']:,}" for c in sorted(WNAME)))
