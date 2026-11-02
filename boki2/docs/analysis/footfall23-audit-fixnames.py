# -*- coding: utf-8 -*-
# BIZ-FOOTFALL23 の判定：駅名の表記の揺れ（全角数字・ヶ/ケ・ッ/ツ・互換漢字）を直して D13 を数え直したとき、補正の係数とピンの段がどう変わるか
# 名前の照合だけを変え、ほかは footfall23-count.py と同じ決め方（23区の券面に出る (事業者, 駅名)・拡大の係数・2区間の1/2・単独事業者の駅の中央値で割る）
# 実行：python3 -I boki2/docs/analysis/footfall23-audit-fixnames.py boki2/research/raw/web/footfall23 boki2/js/data/tokyo23.js
import sys, os, re, zipfile, html, json, collections, csv, unicodedata, statistics
RAW, T23 = sys.argv[1], sys.argv[2]
def canon(n): return unicodedata.normalize('NFKC', n).replace('ヶ', 'ケ').replace('ヵ', 'カ').replace('ッ', 'ツ')
t = open(T23, encoding='utf8').read(); d, _ = json.JSONDecoder().raw_decode(t[t.index('SIM.tokyo23 = ') + 14:])
ST = d['stations']; TIERS = d['pinTiers']
def tier(v):
  for th, p in TIERS:
    if v >= th: return p
W = {'A': 1.0, 'b1': 1 / 0.325, 'c1': 1 / 0.96}
TE = {False: collections.Counter(), True: collections.Counter()}; LOC = {False: set(), True: set()}
with open(os.path.join(RAW, 'census13-teiki-kaisetsu.html'), encoding='utf-8-sig') as f:
  rd = csv.reader(f); next(rd)
  for r in rd:
    if len(r) < 23 or r[0] != '01首都圏': continue
    for pf, ct, o, nm in ((r[1], r[2], r[3], r[4]), (r[6], r[7], r[8], r[9]), (r[10], r[11], r[12], r[13]), (r[15], r[16], r[17], r[18])):
      if pf == '東京都' and ct.endswith('区'):
        LOC[False].add((o, nm)); LOC[True].add((o, canon(nm)))
    w = W.get(r[22])
    if w is None: continue
    n = float((r[21] or "0").replace(",", "")) * w; seg2 = any(r[10:19]); k = 0.5 if seg2 else 1.0
    ends = [(r[3], r[4]), (r[8], r[9])] + ([(r[12], r[13]), (r[17], r[18])] if seg2 else [])
    for o, nm in ends:
      TE[False][(o, nm)] += n * k; TE[True][(o, canon(nm))] += n * k
z = zipfile.ZipFile(os.path.join(RAW, 'census13-hatsunori-saishu.xlsx'))
ss = [html.unescape(re.sub(r'<[^>]+>', '', m)) for m in re.findall(r'<si>(.*?)</si>', z.read('xl/sharedStrings.xml').decode('utf8'), re.S)]
cellre = re.compile(rb'<c ([^>]*?)(?:/>|>(.*?)</c>)', re.S)
IC = {False: collections.Counter(), True: collections.Counter()}
def add(cur):
  if 'A' in cur and 'B' in cur and isinstance(cur.get('C'), float):
    for s in (cur['A'], cur['B']):
      if ' ' in s:
        o, n = s.split(' ', 1); IC[False][(o, n)] += cur['C']; IC[True][(o, canon(n))] += cur['C']
with z.open('xl/worksheets/sheet1.xml') as f:
  buf = b''; cur = {}; lastr = None
  while True:
    ch = f.read(1 << 22)
    if not ch: break
    buf += ch; cut = buf.rfind(b'</row>')
    if cut < 0: continue
    part, buf = buf[:cut + 6], buf[cut + 6:]
    for attrs, body in cellre.findall(part):
      m = re.search(rb'r="([A-Z]+)(\d+)"', attrs); tt = re.search(rb' t="(\w+)"', attrs); v = re.search(rb'<v>([^<]*)</v>', body or b'')
      r = int(m.group(2))
      if r < 3: continue
      if r != lastr: add(cur); cur = {}; lastr = r
      if not v: continue
      v = v.group(1).decode(); cur[m.group(1).decode()] = ss[int(v)] if tt and tt.group(1) == b's' else float(v)
  add(cur)
def gate(s, fix):
  nm = {s['name'], *s.get('aliases', [])}
  if fix: nm = {canon(n) for n in nm}
  te = sum(v for (o, n), v in TE[fix].items() if n in nm and (o, n) in LOC[fix])
  ic = sum(v for (o, n), v in IC[fix].items() if n in nm and (o, n) in LOC[fix])
  return 2 * te + ic
res = {}
for fix in (False, True):
  g = {s['name']: gate(s, fix) for s in ST}
  ok = [s for s in ST if g[s['name']] > 0 and s.get('foot') is not None]
  okn = {s['name'] for s in ST if g[s['name']] > 0}
  single = statistics.median(g[s['name']] / s['riders'] for s in ST if s['name'] in okn and s['riders'] > 30000 and len(s['byOp']) == 1)
  res[fix] = (g, single, okn)
g0, s0, ok0 = res[False]; g1, s1, ok1 = res[True]
print(f'# 単独事業者の駅の中央値：今の照合 {s0:.4f}・揺れを直した照合 {s1:.4f}')
same = sum(1 for s in ST if abs(g0[s["name"]] - g1[s["name"]]) < 0.5)
print(f'# D13 が同じ駅 {same}/{len(ST)}（今の照合の D13 は footfall23-count.py と同じになるはず：北千住 {g0["北千住"]:,.0f}・品川 {g0["品川"]:,.0f}）')
FJ = json.load(open(os.path.join(os.path.dirname(T23), '..', '..', 'tools', 'data', 'footfall-adj.json'), encoding='utf8'))['stations']
print('\n「今」はゲームの今の値（tokyo23.js の adj・tier、footfall-adj.json）。「直す」は同じ式で名前の照合だけ直した値（D13 が0から正になった駅も係数を掛ける）')
print('\n| 駅 | A | D13（今） | D13（揺れを直す） | 係数（今） | 係数（直す） | 段（今） | 段（直す） |')
print('|---|---|---|---|---|---|---|---|')
ch = collections.Counter()
for s in ST:
  n = s['name']; A = s['riders']
  if not A: continue
  used = FJ[n]['used'] or (g0[n] == 0 and g1[n] > 0)
  k1 = min(1, g1[n] / A / s1) if used and g1[n] > 0 else 1.0
  t0, t1 = s['tier'], tier(A * k1)
  if t0 != t1: ch['上がる' if t1 > t0 else '下がる'] += 1
  if abs(g0[n] - g1[n]) >= 0.5 or t0 != t1:
    print(f"| {n} | {A:,} | {g0[n]:,.0f} | {g1[n]:,.0f} | {s.get('adj', 1):.2f} | {k1:.2f} | {t0} | {t1} |")
print(f'\n# 段が変わる駅：{dict(ch)}（ほかの駅は単独事業者の中央値が {s0:.4f}→{s1:.4f} に動いた分だけ係数が動く）')
