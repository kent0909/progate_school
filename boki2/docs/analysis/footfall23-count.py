# -*- coding: utf-8 -*-
# BIZ-FOOTFALL23 の数を出す台本。報告の数はすべてこの出力（footfall23-count.out.txt）から写す。
# 実行：python3 -I boki2/docs/analysis/footfall23-count.py boki2/research/raw/web/footfall23 boki2/js/data/tokyo23.js > boki2/docs/analysis/footfall23-count.out.txt
#
# 比べる数え方（駅ごと）
#  A 乗降客数の和（今のゲーム。S12-25 の2024年度、事業者ごとの値の和。tokyo23.js の riders）
#  B 最大の事業者＋残りの半分（tokyo23.js の byOp から）
#  C 人流データ（国交省 全国の人流オープンデータ）：データ本体は登録とログインが条件で取っていない → 出せない
#  D 大都市交通センサス
#    D12 第12回（2015年）ターミナル別乗換え人員表（首都圏）：初乗り計・最終降車計・乗換え計（通勤・通学目的の片道）
#    D13 第13回（2021年12月の平日1日）改札の出入りの推定 ＝ 定期券（券面区間の両端の枚数×2）＋ ICカード定期外（初乗り・最終降車駅間 OD の出発＋到着）
#  E 国勢調査2020（夜間人口）・経済センサス2021（従業者数・宿泊飲食の事業所数）の駅を含むメッシュ（1km・500m）
import csv, json, math, os, re, sys, zipfile, statistics, collections

RAW = sys.argv[1]
T23 = sys.argv[2]
KEY = ['新宿', '渋谷', '池袋', '北千住', '品川', '東京', '上野', '下北沢', '三軒茶屋', '中目黒']
EXTRA = ['新橋', '秋葉原', '大手町', '浜松町', '高田馬場', '錦糸町', '吉祥寺', '中野', '赤羽', '蒲田', '五反田', '恵比寿', '目黒', '大崎', '六本木', '銀座', '表参道', '押上']

# ---- ゲームの駅 ----
t = open(T23, encoding='utf8').read()
d, _ = json.JSONDecoder().raw_decode(t[t.index('SIM.tokyo23 = ') + len('SIM.tokyo23 = '):])
ORIGIN = d['origin']
KX = 111.32 * math.cos(math.radians(35.68)); KY = 110.95
def latlon(x, y):
  return (ORIGIN[0] - y / KY, ORIGIN[1] + x / KX)
ST = d['stations']
SITES = d['sites']
byname = {s['name']: s for s in ST}

def maxhalf(s):
  v = sorted(s['byOp'].values(), reverse=True)
  return v[0] + sum(v[1:]) / 2 if v else 0

# ---- メッシュ ----
def mesh3(lat, lon):
  p = int(lat * 1.5); a = lat * 60 - p * 40
  u = int(lon - 100); f = lon - 100 - u
  q = int(a / 5); v = int(f * 60 / 7.5)
  b = a - q * 5; g = f * 60 - v * 7.5
  r = int(b * 60 / 30); w = int(g * 60 / 45)
  b2 = b * 60 - r * 30; g2 = g * 60 - w * 45
  m4 = 1 + (1 if g2 >= 22.5 else 0) + (2 if b2 >= 15 else 0)
  c3 = f'{p:02d}{u:02d}{q}{v}{r}{w}'
  return c3, c3 + str(m4)

def readmesh(fn, cols):
  z = zipfile.ZipFile(os.path.join(RAW, fn)); txt = z.read(z.namelist()[0]).decode('cp932', 'replace').splitlines()
  head = txt[0].split(','); idx = {c: head.index(c) for c in cols}
  out = {}
  for line in txt[2:]:
    r = line.split(',')
    def num(x):
      try: return int(x)
      except: return None
    out[r[0]] = {c: num(r[idx[c]]) for c in cols}
  return out

POP1 = readmesh('estat-T001140-5339.xlsx', ['T001140001'])
POP5 = readmesh('estat-T001141-5339.xlsx', ['T001141001'])
EMP1 = readmesh('estat-T001157-5339.xlsx', ['T001157022', 'T001157015', 'T001157036'])
EMP5 = readmesh('estat-T001162-5339.xlsx', ['T001162022', 'T001162015', 'T001162036'])
print(f'# メッシュの行数：国勢調査1km {len(POP1)}・500m {len(POP5)}／経済センサス1km {len(EMP1)}・500m {len(EMP5)}')

def meshvals(lat, lon):
  c3, c4 = mesh3(lat, lon)
  g = lambda D, c, k: (D.get(c) or {}).get(k)
  return {'m1': c3, 'm5': c4,
          'pop1': g(POP1, c3, 'T001140001'), 'emp1': g(EMP1, c3, 'T001157022'), 'food1': g(EMP1, c3, 'T001157015'),
          'pop5': g(POP5, c4, 'T001141001'), 'emp5': g(EMP5, c4, 'T001162022'), 'food5': g(EMP5, c4, 'T001162015')}

# ---- 第12回 ターミナル別乗換え人員表 ----
import openpyxl
wb = openpyxl.load_workbook(os.path.join(RAW, 'census12-terminal-norikae.xlsx'), read_only=True, data_only=True)
TERM = {}; cur = None
for r in wb.worksheets[0].iter_rows(values_only=True):
  if isinstance(r[0], int) and r[1]: cur = r[1]; TERM[cur] = {}
  vals = [c for c in r if c is not None]
  if cur and vals and isinstance(vals[0], str) and vals[0].startswith('**'):
    TERM[cur][re.sub(r'[\s*:　]', '', vals[0])] = vals[1]
print(f'# 第12回ターミナル数 {len(TERM)}')
def term_of(name):
  for k in (name, name + '関連'):
    if k in TERM: return k, TERM[k]
  return None, None

# ---- 第13回 定期券（券面区間の両端） ----
# データ種別：A はそのまま、b1 は 1/0.325、c1 は 1/0.96 を掛ける（解説：回収率の逆数で拡大）。b2・c2・D は駅がないので数えない
W = {'A': 1.0, 'b1': 1 / 0.325, 'c1': 1 / 0.96}
TEIKI = collections.Counter(); TEIKI_kinds = collections.Counter(); two_seg = 0
LOC23 = set()  # 23区にある（事業者, 駅名）。券面の駅の都道府県・市区町村から
with open(os.path.join(RAW, 'census13-teiki-kaisetsu.html'), encoding='utf-8-sig') as f:
  rd = csv.reader(f); head = next(rd)
  for r in rd:
    if len(r) < 23 or r[0] != '01首都圏': continue
    for pf, ct, o, nm in ((r[1], r[2], r[3], r[4]), (r[6], r[7], r[8], r[9]), (r[10], r[11], r[12], r[13]), (r[15], r[16], r[17], r[18])):
      if pf == '東京都' and ct.endswith('区'): LOC23.add((o, nm))
    w = W.get(r[22]); TEIKI_kinds[r[22]] += 1
    if w is None: continue
    n = float((r[21] or "0").replace(",", "")) * w
    seg2 = any(r[10:19])
    if seg2: two_seg += 1
    # 1区間目の両端（2区間目があれば2区間目の両端にも半分ずつ。解説の「2区間定期は各区間に1/2」に合わせる）
    k = 0.5 if seg2 else 1.0
    TEIKI[(r[3], r[4])] += n * k; TEIKI[(r[8], r[9])] += n * k
    if seg2:
      TEIKI[(r[12], r[13])] += n * k; TEIKI[(r[17], r[18])] += n * k
print(f'# 第13回定期券：首都圏の行の種別 {dict(TEIKI_kinds)}・2区間の行 {two_seg}')

# ---- 第13回 ICカード定期外（初乗り・最終降車駅間） ----
IC = collections.Counter(); icrows = 0; icstar = 0
wb = openpyxl.load_workbook(os.path.join(RAW, 'census13-hatsunori-saishu.xlsx'), read_only=True, data_only=True)
for i, r in enumerate(wb['首都圏'].iter_rows(values_only=True)):
  if i < 2 or not r[0]: continue
  icrows += 1
  if not isinstance(r[2], (int, float)): icstar += 1; continue
  a = r[0].split(' ', 1); b = r[1].split(' ', 1)
  if len(a) == 2: IC[(a[0], a[1])] += r[2]
  if len(b) == 2: IC[(b[0], b[1])] += r[2]
print(f'# 第13回IC定期外：首都圏の OD 行 {icrows}・秘匿（*）{icstar}・合計の出入り {sum(IC.values()):.0f}')

OPN = {'東京都': '東京都交通局'}  # ゲーム（S12）の事業者名 → センサスの事業者名
def census13(s):
  names = {s['name'], *s.get('aliases', [])}
  ops = {OPN.get(o, o) for o in s['byOp']}
  # (1) ゲームの byOp と同じ事業者だけ（A と同じ範囲）
  te = sum(v for (o, n), v in TEIKI.items() if n in names and o in ops)
  ic = sum(v for (o, n), v in IC.items() if n in names and o in ops)
  # (2) 同じ駅名で23区にある全事業者（「不明」の定期を含む）。駅の改札の出入りの全体
  tea = sum(v for (o, n), v in TEIKI.items() if n in names and (o, n) in LOC23)
  ica = sum(v for (o, n), v in IC.items() if n in names and (o, n) in LOC23)
  extra = sorted({o for (o, n) in LOC23 if n in names and o not in ops and o != '不明'})
  miss = sorted({o for o in ops if not any(n in names and oo == o for (oo, n) in IC)})
  return te, ic, miss, tea, ica, extra

def row(s):
  A = s['riders']; B = maxhalf(s)
  te, ic, miss, tea, ica, extra = census13(s)
  gate13op = 2 * te + ic
  gate13 = 2 * tea + ica
  tk, tv = term_of(s['name'])
  lat, lon = latlon(s['x'], s['y'])
  m = meshvals(lat, lon)
  return dict(name=s['name'], ward=s['ward'], ops=len(s['byOp']), A=A, B=B, teiki=tea, ic=ica, gate13=gate13, gate13op=gate13op, miss=miss, extra=extra,
              t12=tk, t12_in=(tv or {}).get('初乗り計'), t12_out=(tv or {}).get('最終降車計'), t12_x=(tv or {}).get('乗換え計'), t12_all=(tv or {}).get('合計'), **m)

def f0(v): return '—' if v is None else f'{v:,.0f}'
def ratio(a, b): return '—' if not a or not b else f'{a / b:.2f}'

print('\n## 1. 主要駅の4つの数え方（A 和・B 最大＋残り半分・D13 改札の出入りの推定・D12 乗換えの割合）')
print('D13 は同じ駅名で23区にある全事業者の和。D13(A の範囲) はゲームの byOp と同じ事業者だけ。')
print('| 駅 | 事業者数(A) | A 和(2024) | B 最大＋半分 | B/A | D13 定期の枚数 | D13 IC定期外の出入り | D13 改札の出入り(=2×定期+IC) | D13/A | D13(A の範囲) | D12 初乗り | D12 最終降車 | D12 乗換え | D12 乗換え÷合計 | A にない事業者(D13 に入る) | IC に出ない A の事業者 |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
R = {}
for nm in KEY + EXTRA:
  s = byname.get(nm)
  if not s: print(f'| {nm} | ゲームの駅にない |'); continue
  x = row(s); R[nm] = x
  xr = (x['t12_x'] / x['t12_all']) if x['t12_all'] else None
  print(f"| {nm} | {x['ops']} | {f0(x['A'])} | {f0(x['B'])} | {ratio(x['B'], x['A'])} | {f0(x['teiki'])} | {f0(x['ic'])} | {f0(x['gate13'])} | {ratio(x['gate13'], x['A'])} | {f0(x['gate13op'])} | {f0(x['t12_in'])} | {f0(x['t12_out'])} | {f0(x['t12_x'])} | {'—' if xr is None else f'{xr:.0%}'} | {','.join(x['extra']) or '-'} | {','.join(x['miss']) or '-'} |")

print('\n## 2. 順位（主要10駅の中）')
for k, lab in [('A', 'A 和'), ('B', 'B 最大＋半分'), ('gate13', 'D13 改札の出入り')]:
  order = sorted(KEY, key=lambda n: -(R[n][k] or 0))
  print(f'- {lab}：' + ' ＞ '.join(f"{n}({R[n][k] / 1e4:.0f}万)" for n in order))
order = sorted([n for n in KEY if R[n]['t12_out'] is not None], key=lambda n: -((R[n]['t12_in'] or 0) + (R[n]['t12_out'] or 0)))
print('- D12 初乗り＋最終降車（片道の通勤通学）：' + ' ＞ '.join(f"{n}({(R[n]['t12_in'] + R[n]['t12_out']) / 1e4:.1f}万)" for n in order))
print(f"- 北千住と品川：A {R['北千住']['A']:,}・{R['品川']['A']:,}（北千住/品川 {R['北千住']['A'] / R['品川']['A']:.2f}）／B {R['北千住']['B']:,.0f}・{R['品川']['B']:,.0f}（{R['北千住']['B'] / R['品川']['B']:.2f}）／D13 {R['北千住']['gate13']:,.0f}・{R['品川']['gate13']:,.0f}（{R['北千住']['gate13'] / R['品川']['gate13']:.2f}）／D12 初乗り＋最終降車 {R['北千住']['t12_in'] + R['北千住']['t12_out']:,}・{R['品川']['t12_in'] + R['品川']['t12_out']:,}（{(R['北千住']['t12_in'] + R['北千住']['t12_out']) / (R['品川']['t12_in'] + R['品川']['t12_out']):.2f}）")

print('\n## 3. 昼と夜：駅を含むメッシュの夜間人口（国勢調査2020）と従業者数（経済センサス2021）')
print('| 駅 | 1km メッシュ | 夜間人口 1km | 従業者 1km | 従業者÷夜間 1km | 昼の重み L=従業者/(従業者+夜間) 1km | 500m メッシュ | 夜間人口 500m | 従業者 500m | 従業者÷夜間 500m | 宿泊・飲食の事業所 500m |')
print('|---|---|---|---|---|---|---|---|---|---|---|')
for nm in KEY + EXTRA:
  if nm not in R: continue
  x = R[nm]
  L = (x['emp1'] / (x['emp1'] + x['pop1'])) if x['emp1'] is not None and x['pop1'] is not None else None
  print(f"| {nm} | {x['m1']} | {f0(x['pop1'])} | {f0(x['emp1'])} | {ratio(x['emp1'], x['pop1'])} | {'—' if L is None else f'{L:.2f}'} | {x['m5']} | {f0(x['pop5'])} | {f0(x['emp5'])} | {ratio(x['emp5'], x['pop5'])} | {f0(x['food5'])} |")

# ---- 全駅での相関：どの数え方が「飲食店の集まり」（店を出す人が人通りを見て決めた結果）に近いか ----
def spearman(a, b):
  def rk(v):
    o = sorted(range(len(v)), key=lambda i: v[i]); r = [0] * len(v); i = 0
    while i < len(o):
      j = i
      while j + 1 < len(o) and v[o[j + 1]] == v[o[i]]: j += 1
      for k in range(i, j + 1): r[o[k]] = (i + j) / 2
      i = j + 1
    return r
  ra, rb = rk(a), rk(b); ma, mb = statistics.mean(ra), statistics.mean(rb)
  num = sum((x - ma) * (y - mb) for x, y in zip(ra, rb)); den = math.sqrt(sum((x - ma) ** 2 for x in ra) * sum((y - mb) ** 2 for y in rb))
  return num / den
ALL = [row(s) for s in ST]
ok = [x for x in ALL if x['food5'] is not None and x['gate13'] > 0]
print(f'\n## 4. 全駅（{len(ST)}駅のうち、500m メッシュの宿泊・飲食の事業所数があり、D13 が0でない {len(ok)} 駅）での順位相関（スピアマン）')
for k, lab in [('A', 'A 和'), ('B', 'B 最大＋半分'), ('gate13', 'D13 改札の出入り')]:
  print(f"- {lab} と 宿泊・飲食の事業所数（500m）：{spearman([x[k] for x in ok], [x['food5'] for x in ok]):.3f}／同（1km）：{spearman([x[k] for x in ok], [x['food1'] or 0 for x in ok]):.3f}")
multi = [x for x in ok if x['ops'] >= 2]
print(f'- 複数の事業者の駅だけ（{len(multi)} 駅）：' + '・'.join(f"{lab} {spearman([x[k] for x in multi], [x['food5'] for x in multi]):.3f}" for k, lab in [('A', 'A'), ('B', 'B'), ('gate13', 'D13')]))
print(f"- A と D13 の順位相関（全 {len(ok)} 駅）：{spearman([x['A'] for x in ok], [x['gate13'] for x in ok]):.3f}／B と D13：{spearman([x['B'] for x in ok], [x['gate13'] for x in ok]):.3f}")
gr = sorted((x['gate13'] / x['A'], x['name'], x['ops']) for x in ok if x['A'] > 30000)
print(f'- D13/A（乗降3万人以上の {len(gr)} 駅）：中央値 {statistics.median(g for g, _, _ in gr):.2f}・単独事業者の駅の中央値 {statistics.median(g for g, _, o in gr if o == 1):.2f}・複数事業者の駅の中央値 {statistics.median(g for g, _, o in gr if o >= 2):.2f}')
print('  - D13/A の低い10駅：' + '、'.join(f'{n}{g:.2f}' for g, n, _ in gr[:10]))
print('  - D13/A の高い10駅：' + '、'.join(f'{n}{g:.2f}' for g, n, _ in gr[-10:]))

# ---- 段の変わり方：今の段（A）と D13 を A と同じ尺度に直した段 ----
TIERS = d['pinTiers']
def tier(v):
  for th, p in TIERS:
    if v >= th: return p
med = statistics.median(x['gate13'] / x['A'] for x in ok if x['A'] > 30000)
ch = collections.Counter()
for x in ok:
  ta = tier(x['A']); tb = tier(x['B']); td = tier(x['gate13'] / med)
  ch['B' + ('同じ' if tb == ta else '下がる' if tb < ta else '上がる')] += 1
  ch['D13' + ('同じ' if td == ta else '下がる' if td < ta else '上がる')] += 1
print(f'\n## 5. ピンの段（3.2 の表）が A からどれだけ変わるか（D13 は中央値の比 {med:.2f} で割って A の尺度に直す。{len(ok)} 駅）')
print('- ' + '・'.join(f'{k} {v}' for k, v in sorted(ch.items())))
for nm in KEY:
  x = R[nm]; print(f"  - {nm}：A の段 {tier(x['A'])}・B の段 {tier(x['B'])}・D13 の段 {tier(x['gate13'] / med)}")

# ---- 候補地の属性ごとの「昼の重み」（設計 4.5 の置き値と比べる） ----
L_DESIGN = {'office': 0.75, 'kojo': 0.85, 'shogyo': 0.55, 'shoten': 0.5, 'jutaku': 0.35, 'hanka': 0.3}
by = collections.defaultdict(list)
for s in SITES:
  lat, lon = latlon(s['x'], s['y']); m = meshvals(lat, lon)
  if m['emp5'] is None or m['pop5'] is None or m['emp5'] + m['pop5'] == 0: continue
  by[s['type']].append(m['emp5'] / (m['emp5'] + m['pop5']))
print(f"\n## 6. 候補地（{len(SITES)} か所）の属性ごとの 500m メッシュの 従業者/(従業者+夜間)（設計 4.5 の昼の重み L の置き値と並べる）")
print('| 属性 | 候補地の数 | 25% | 中央値 | 75% | 設計 4.5 の L |')
print('|---|---|---|---|---|---|')
for k in ['office', 'shogyo', 'hanka', 'shoten', 'jutaku', 'kojo']:
  v = sorted(by[k]); q = statistics.quantiles(v, n=4) if len(v) >= 4 else [None, None, None]
  print(f"| {k} | {len(v)} | {q[0]:.2f} | {statistics.median(v):.2f} | {q[2]:.2f} | {L_DESIGN[k]} |")

# ---- 7. 乗り換えの割合の2つの見積もりの照らし合わせ ----
single = statistics.median(x['gate13'] / x['A'] for x in ok if x['A'] > 30000 and x['ops'] == 1)
print(f'\n## 7. A のうち乗り換えの分の見積もり（主要10駅）')
print(f'- 見積もり1（D13）：1 −（D13/A）÷ 単独事業者の駅の D13/A の中央値 {single:.2f}（単独の駅でも D13 が A より小さい分＝2021年12月の落ち込み・切符・圏外を、複数の駅にも同じだけ掛かるとみなす）')
print('- 見積もり2（D12）：A は乗り換え1人を2回（降りる・乗る）数えるとして 2×乗換え ÷（初乗り＋最終降車＋2×乗換え）。第12回の通勤通学の片道。JR 線どうしなど同じ事業者の中の乗り換えも入るので A の数え方より大きめに出る')
print('| 駅 | D13/A | 見積もり1 | D12 2×乗換え÷(出入り+2×乗換え) | 見積もり2 |')
print('|---|---|---|---|---|')
for nm in KEY:
  x = R[nm]; e1 = 1 - (x['gate13'] / x['A']) / single
  G = (x['t12_in'] or 0) + (x['t12_out'] or 0); Tn = x['t12_x'] or 0
  e2 = 2 * Tn / (G + 2 * Tn) if G + Tn else None
  print(f"| {nm} | {x['gate13'] / x['A']:.2f} | {e1:.0%} | {2 * Tn:,}÷({G:,}+{2 * Tn:,}) | {'—' if e2 is None else f'{e2:.0%}'} |")

# ---- 8. 夜（外食）の強さの候補：500m メッシュの従業者のうち宿泊・飲食の割合 ----
def foodshare(lat, lon):
  c3, c4 = mesh3(lat, lon); e = EMP5.get(c4) or {}
  return (e.get('T001162036') / e['T001162022']) if e.get('T001162022') and e.get('T001162036') is not None else None
print('\n## 8. 500m メッシュの従業者のうち「宿泊・飲食サービス業」の割合（経済センサス2021）')
print('| 駅 | 宿泊・飲食の従業者 | 全従業者 | 割合 |')
print('|---|---|---|---|')
for nm in KEY + EXTRA:
  if nm not in R: continue
  s = byname[nm]; lat, lon = latlon(s['x'], s['y']); c3, c4 = mesh3(lat, lon); e = EMP5.get(c4) or {}
  fs = foodshare(lat, lon)
  print(f"| {nm} | {f0(e.get('T001162036'))} | {f0(e.get('T001162022'))} | {'—' if fs is None else f'{fs:.1%}'} |")
by2 = collections.defaultdict(list)
for s in SITES:
  lat, lon = latlon(s['x'], s['y']); fs = foodshare(lat, lon)
  if fs is not None: by2[s['type']].append(fs)
print('\n| 属性 | 候補地の数 | 宿泊・飲食の従業者の割合 25% | 中央値 | 75% |')
print('|---|---|---|---|---|')
for k in ['office', 'shogyo', 'hanka', 'shoten', 'jutaku', 'kojo']:
  v = sorted(by2[k]); q = statistics.quantiles(v, n=4)
  print(f'| {k} | {len(v)} | {q[0]:.1%} | {statistics.median(v):.1%} | {q[2]:.1%} |')

# ---- 9. 推しの案：A に乗り換えの補正を掛ける（A_adj ＝ A × min(1,（D13/A）÷ 単独事業者の駅の中央値)） ----
print(f'\n## 9. 乗り換えを除いた人通り A_adj ＝ A × min(1, (D13/A) ÷ {single:.2f})（2024年度の水準を保ち、乗り換えの分だけ引く）')
print('| 駅 | A 和 | 補正の係数 | A_adj | A の段 | A_adj の段 |')
print('|---|---|---|---|---|---|')
def adj(x): return min(1.0, (x['gate13'] / x['A']) / single) if x['A'] else 1.0
for nm in KEY + EXTRA:
  if nm not in R: continue
  x = R[nm]; k = adj(x)
  print(f"| {nm} | {x['A']:,} | {k:.2f} | {x['A'] * k:,.0f} | {tier(x['A'])} | {tier(x['A'] * k)} |")
cc = collections.Counter()
for x in ok:
  ta, tb = tier(x['A']), tier(x['A'] * adj(x)); cc['同じ' if ta == tb else '下がる' if tb < ta else '上がる'] += 1
print(f'- {len(ok)} 駅で A_adj の段が A から：' + '・'.join(f'{k} {v}' for k, v in cc.items()) + f'（D13 が0か、500m メッシュの値がない {len(ST) - len(ok)} 駅は A のまま）')
order = sorted(KEY, key=lambda n: -R[n]['A'] * adj(R[n]))
print('- 主要10駅の A_adj の順：' + ' ＞ '.join(f"{n}({R[n]['A'] * adj(R[n]) / 1e4:.0f}万)" for n in order))
sp = spearman([x['A'] * adj(x) for x in ok], [x['food5'] for x in ok])
spm = spearman([x['A'] * adj(x) for x in multi], [x['food5'] for x in multi])
print(f'- A_adj と宿泊・飲食の事業所数（500m）の順位相関：全 {len(ok)} 駅 {sp:.3f}・複数事業者の {len(multi)} 駅 {spm:.3f}')
