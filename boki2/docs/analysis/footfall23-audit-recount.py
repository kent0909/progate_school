# -*- coding: utf-8 -*-
# BIZ-FOOTFALL23 の判定（docs/audit/BIZ-FOOTFALL23-audit.md）のための数え直し。
# footfall23-count.py とは別の書き方で数える：
#  - 定期の CSV は pandas でまとめて読み、駅の所在（23区か）は「その行の券面の都道府県・市区町村」で決める（元の台本は LOC23 の集合）
#  - IC の OD の xlsx は openpyxl を使わず、zip の中の XML（sharedStrings と sheet1）を正規表現で直に読む
#  - 報告書 表5-8（駅別発着人員、百人）と、定期の数え方（拡大の係数・2区間の1/2）を突き合わせる
# 実行：python3 -I boki2/docs/analysis/footfall23-audit-recount.py boki2/research/raw/web/footfall23 > boki2/docs/analysis/footfall23-audit-recount.out.txt
import sys, os, re, zipfile, html, collections
import pandas as pd
RAW = sys.argv[1]
TARGET = ['北千住', '品川', '三軒茶屋', '新宿', '東京', '池袋']

# ---- 定期（CSV。取得の名前が入れ替わっていて census13-teiki-kaisetsu.html が CSV の中身） ----
df = pd.read_csv(os.path.join(RAW, 'census13-teiki-kaisetsu.html'), dtype=str, encoding='utf-8-sig', keep_default_na=False, header=None, skiprows=1)
df = df[df[0] == '01首都圏']
print('# 首都圏の行', len(df), '種別', df[22].value_counts().to_dict())
w = df[22].map({'A': 1.0, 'b1': 1 / 0.325, 'c1': 1 / 0.96})
seg2 = (df[list(range(10, 19))] != '').any(axis=1)
k = seg2.map({True: 0.5, False: 1.0})
num = lambda c: pd.to_numeric(df[c].str.replace(',', ''), errors='coerce').fillna(0)
tot, kin, gak = num(21), num(19), num(20)
print('# 通勤+通学=合計 の行の食い違い', int(((kin + gak) - tot).abs().gt(0).sum()))
ends = [(1, 2, 3, 4, False), (6, 7, 8, 9, False), (10, 11, 12, 13, True), (15, 16, 17, 18, True)]
rec = []
for pf, ct, op, nm, second in ends:
  m = w.notna() & ((df[nm] != '') if second else True)
  sub = pd.DataFrame({'pf': df[pf], 'ct': df[ct], 'op': df[op], 'nm': df[nm], 'tot': tot * w * k, 'kin': kin * w * k, 'gak': gak * w * k})[m]
  rec.append(sub)
E = pd.concat(rec)
E23 = E[(E.pf == '東京都') & E.ct.str.endswith('区')]
print('\n## 1. 定期：駅ごとの両端の枚数（拡大後、23区の券面の駅、事業者ごと）')
for n in TARGET:
  g = E23[E23.nm == n].groupby('op')['tot'].sum().round(0)
  print(f'- {n}：計 {g.sum():,.0f}（' + '・'.join(f'{o} {v:,.0f}' for o, v in g.items()) + '）')

print('\n## 2. 報告書 表5-8（駅別発着人員、百人）との突き合わせ（JR東日本の通勤・通学）')
jr = E[E.op == '東日本旅客鉄道'].groupby('nm')[['kin', 'gak']].sum()
for n, kin_r, gak_r in [('新宿', 1392, 87), ('東京', 1088, None), ('池袋', 947, 125), ('品川', 670, None), ('渋谷', 680, 76), ('高田馬場', None, 85)]:
  a = jr.loc[n]
  print(f"- JR {n}：通勤 {a.kin / 100:,.0f}百人（表 {kin_r}）・通学 {a.gak / 100:,.0f}百人（表 {gak_r}）")
# 拡大をしない場合（係数が報告書どおりかの確かめ）
E0 = []
for pf, ct, op, nm, second in ends:
  m = df[22].isin(['A', 'b1', 'c1']) & ((df[nm] != '') if second else True)
  E0.append(pd.DataFrame({'op': df[op], 'nm': df[nm], 'kin': kin * k})[m])
E0 = pd.concat(E0); j0 = E0[E0.op == '東日本旅客鉄道'].groupby('nm')['kin'].sum()
print(f"- 拡大しない場合の JR 新宿 通勤：{j0['新宿'] / 100:,.0f}百人（表 1392）")
print('- JR東日本の行の種別：', df[df[3] == '東日本旅客鉄道'][22].value_counts().to_dict())
print('- 東京地下鉄の行の種別：', df[df[3] == '東京地下鉄'][22].value_counts().to_dict())

# ---- IC 定期外（XML を直に） ----
z = zipfile.ZipFile(os.path.join(RAW, 'census13-hatsunori-saishu.xlsx'))
ss = [html.unescape(re.sub(r'<[^>]+>', '', m)) for m in re.findall(r'<si>(.*?)</si>', z.read('xl/sharedStrings.xml').decode('utf8'), re.S)]
print('\n# IC の表の見出し：', ss[3444], '／', ss[3445], ss[3446], ss[3447])
cellre = re.compile(rb'<c ([^>]*?)(?:/>|>(.*?)</c>)', re.S)
def cells(part):
  for attrs, body in cellre.findall(part):
    m = re.search(rb'r="([A-Z]+)(\d+)"', attrs); t = re.search(rb' t="(\w+)"', attrs)
    v = re.search(rb'<v>([^<]*)</v>', body or b'')
    yield m.group(1), m.group(2), (t.group(1) if t else None), (v.group(1) if v else None)
IC = collections.Counter(); rows = 0; star = 0; same = 0; cur = {}; lastr = None
def flush(cur):
  global rows, star, same
  if 'A' not in cur or 'B' not in cur: return
  rows += 1
  c = cur.get('C')
  if c is None or isinstance(c, str): star += 1; return
  IC[cur['A']] += c; IC[cur['B']] += c
  if cur['A'] == cur['B']: same += c
with z.open('xl/worksheets/sheet1.xml') as f:
  buf = b''
  while True:
    chunk = f.read(1 << 22)
    if not chunk: break
    buf += chunk
    cut = buf.rfind(b'</row>')
    if cut < 0: continue
    part, buf = buf[:cut + 6], buf[cut + 6:]
    for col, r, t, v in cells(part):
      r = int(r)
      if r < 3: continue
      if r != lastr:
        flush(cur); cur = {}; lastr = r
      if v is None or v == b'': continue
      v = v.decode()
      cur[col.decode()] = ss[int(v)] if t == b's' else float(v)
flush(cur)
print(f'# IC の OD 行 {rows}・数のない行（* 等）{star}・出発＋到着の合計 {sum(IC.values()):,.0f}・同じ駅の OD（片道） {same:,.0f}')
print('\n## 3. IC 定期外：駅ごとの出発＋到着（「事業者 駅名」の駅名が一致するものを全部並べる）')
for n in TARGET:
  hits = {s: v for s, v in IC.items() if s.split(' ', 1)[-1] == n}
  print(f'- {n}：計 {sum(hits.values()):,.0f}（' + '・'.join(f'{s} {v:,.0f}' for s, v in sorted(hits.items())) + '）')

print('\n## 4. D13 = 2×定期の両端 + IC の出発＋到着（23区の駅）')
for n in TARGET:
  te = E23[E23.nm == n]['tot'].sum()
  ic = sum(v for s, v in IC.items() if s.split(' ', 1)[-1] == n)
  print(f'- {n}：2×{te:,.0f} + {ic:,.0f} = {2 * te + ic:,.0f}')

# ---- 5. IC の OD の表は定期外だけか：区部から出る OD の和を、報告書の「鉄道ＩＣカード（定期外）を利用して東京都区部から発生する人は 529 万人」と比べる ----
LOC = set(zip(E23.op, E23.nm))  # 定期の券面で23区にある（事業者, 駅名）
ODO = collections.Counter(); ODI = collections.Counter(); tot_from = 0; tot_inner = 0
with z.open('xl/worksheets/sheet1.xml') as f:
  buf = b''; cur = {}; lastr = None
  def fl(cur):
    global tot_from, tot_inner
    if 'A' in cur and 'B' in cur and isinstance(cur.get('C'), float):
      a = tuple(cur['A'].split(' ', 1)); b = tuple(cur['B'].split(' ', 1))
      if a in LOC: tot_from += cur['C']
      if a in LOC and b in LOC: tot_inner += cur['C']
  while True:
    chunk = f.read(1 << 22)
    if not chunk: break
    buf += chunk; cut = buf.rfind(b'</row>')
    if cut < 0: continue
    part, buf = buf[:cut + 6], buf[cut + 6:]
    for col, r, t, v in cells(part):
      r = int(r)
      if r < 3: continue
      if r != lastr: fl(cur); cur = {}; lastr = r
      if v is None or v == b'': continue
      v = v.decode(); cur[col.decode()] = ss[int(v)] if t == b's' else float(v)
  fl(cur)
print(f'\n## 5. IC の OD のうち23区の駅から出る分：{tot_from:,.0f}（報告書・公表資料の定期外の区部発生 529万）・区部の内々 {tot_inner:,.0f}（公表資料 406万）。* の行は入らない')
