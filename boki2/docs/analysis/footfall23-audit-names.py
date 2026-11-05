# -*- coding: utf-8 -*-
# BIZ-FOOTFALL23 の判定：D13/A が極端に低い駅で、センサスの側の駅名がゲームの駅名とずれていないか（名前の取りこぼし）を探す
# 実行：python3 -I boki2/docs/analysis/footfall23-audit-names.py boki2/research/raw/web/footfall23 boki2/js/data/tokyo23.js
import sys, os, re, zipfile, html, json, collections, csv, unicodedata
RAW, T23 = sys.argv[1], sys.argv[2]
z = zipfile.ZipFile(os.path.join(RAW, 'census13-hatsunori-saishu.xlsx'))
ss = [html.unescape(re.sub(r'<[^>]+>', '', m)) for m in re.findall(r'<si>(.*?)</si>', z.read('xl/sharedStrings.xml').decode('utf8'), re.S)]
names = set(ss)
t = open(T23, encoding='utf8').read(); d, _ = json.JSONDecoder().raw_decode(t[t.index('SIM.tokyo23 = ') + 14:])
Q = ['四ツ谷', '羽田', '赤羽岩淵', '小竹向原', '押上', '目黒', '代々木上原', '綾瀬', '新木場', '中目黒', '北千住']
TE = collections.Counter()
with open(os.path.join(RAW, 'census13-teiki-kaisetsu.html'), encoding='utf-8-sig') as f:
  for r in csv.reader(f):
    if r and r[0] == '01首都圏':
      for o, n in ((r[3], r[4]), (r[8], r[9]), (r[12], r[13]), (r[17], r[18])):
        if n: TE[(o, n)] += 1
for q in Q:
  k = unicodedata.normalize('NFKC', q)[:2]
  ic = sorted(s for s in names if k in unicodedata.normalize('NFKC', s.split(' ', 1)[-1]))[:12]
  te = sorted({f'{o} {n}' for (o, n) in TE if k in unicodedata.normalize('NFKC', n)})[:12]
  g = [(s['name'], s.get('aliases'), list(s['byOp'])) for s in d['stations'] if k in s['name']]
  print(f'## {q}\n- ゲーム：{g}\n- IC の駅名：{ic}\n- 定期の駅名：{te}')

# ---- 全駅：ゲームの byOp の事業者ごとに、IC・定期で (事業者, 駅名) が完全一致で見つかるか。見つからないとき NFKC・ヶ/ケ・ツ の揺れで見つかるか ----
OPN = {'東京都': '東京都交通局'}
ICK = collections.Counter()
for s in names:
  if ' ' in s: o, n = s.split(' ', 1); ICK[(o, n)] += 1
def canon(n): return unicodedata.normalize('NFKC', n).replace('ヶ', 'ケ').replace('ヵ', 'カ').replace('ツ', '').replace('ノ', '').replace('之', '')
CI = collections.defaultdict(set)
for (o, n) in ICK: CI[(o, canon(n))].add(n)
CT = collections.defaultdict(set)
for (o, n) in TE: CT[(o, canon(n))].add(n)
print('\n## 全駅：ゲームの事業者ごとの名前の取りこぼし（完全一致なし）')
miss_ic = 0; miss_te = 0; fix = 0
for s in d['stations']:
  nm = {s['name'], *s.get('aliases', [])}
  for op in s['byOp']:
    o = OPN.get(op, op)
    hi = any((o, n) in ICK for n in nm); ht = any((o, n) in TE for n in nm)
    if hi and ht: continue
    alt_i = set().union(*[CI.get((o, canon(n)), set()) for n in nm]) - nm
    alt_t = set().union(*[CT.get((o, canon(n)), set()) for n in nm]) - nm
    miss_ic += not hi; miss_te += not ht; fix += bool(alt_i or alt_t)
    print(f"- {s['name']}（{op}、A の事業者分 {s['byOp'][op]:,}）：IC {'あり' if hi else 'なし'}{('→ 揺れで ' + '・'.join(sorted(alt_i))) if alt_i else ''}／定期 {'あり' if ht else 'なし'}{('→ 揺れで ' + '・'.join(sorted(alt_t))) if alt_t else ''}")
print(f'# IC で見つからない (駅, 事業者) {miss_ic}・定期で見つからない {miss_te}・表記の揺れで見つかるもの {fix}')
