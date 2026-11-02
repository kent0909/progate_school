# -*- coding: utf-8 -*-
# 論証の検査（版0.5）：BIZ-FOOTFALL23 の乗り換えの補正（9節）の推論を確かめる。元の台本 footfall23-count.py をそのまま回し（runpy）、
# その中の駅ごとの値（ok・multi・single・adj・food5）を使って次を出す。元の台本・データは書き換えない。
#  (a) 0.80 で割る置き方を変えると段がいくつ変わるか（渋谷・池袋の段8の余裕）
#  (b) 飲食店の数との順位相関の差（A と A_adj、87駅・421駅）がブートストラップでどれだけ揺れるか
#  (c) 単独事業者の駅（乗り換えが少ないはずの駅）で、D13/A がオフィスの多さと関係するか（コロナの年の落ち込みが駅の種類で違うか）
#  (d) 係数が1のままの31駅の理由
# 実行：python3 -I ff5.py ../../../research/raw/web/footfall23 ../../../js/data/tokyo23.js
import runpy, sys, io, contextlib, random, statistics, math, collections
raw, t23 = sys.argv[1], sys.argv[2]
sys.argv = ['footfall23-count.py', raw, t23]
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
  G = runpy.run_path(__file__.rsplit('/', 2)[0] + '/footfall23-count.py')
ok, multi, single, sp = G['ok'], G['multi'], G['single'], G['spearman']
TIERS = G['TIERS']
def tier(v):
  for th, p in TIERS:
    if v >= th: return p
print(f'# 元の台本の値：421駅 {len(ok)}・複数事業者 {len(multi)}・単独事業者の中央値 {single:.4f}・段の境 {TIERS}')
# (a)
def adjd(x, d): return min(1.0, (x['gate13'] / x['A']) / d) if x['A'] else 1.0
base = {x['name']: tier(x['A'] * adjd(x, single)) for x in ok}
print(f'\n## (a) 割る値を変えたときの段（{len(ok)}駅）')
for d in [0.70, 0.75, single, 0.85, 0.90, 1.00]:
  ch = collections.Counter(('同じ' if tier(x['A'] * adjd(x, d)) == base[x['name']] else ('上がる' if tier(x['A'] * adjd(x, d)) > base[x['name']] else '下がる')) for x in ok)
  big = {n: tier(x['A'] * adjd(x, d)) for x in ok for n in [x['name']] if n in ('新宿', '渋谷', '池袋', '東京', '北千住', '品川')}
  print(f'- 割る値 {d:.3f}：段が {dict(ch)}・{big}')
for n in ('渋谷', '池袋', '新宿'):
  x = next(x for x in ok if x['name'] == n); r = x['gate13'] / x['A']
  print(f'- {n}：D13/A {r:.4f}・foot {x["A"] * adjd(x, single):,.0f}。段8（100万以上）に残る割る値の上限 {r * x["A"] / 1e6:.4f}')
# (b)
print('\n## (b) 飲食店の事業所数（500m）との順位相関の差：A_adj − A（ブートストラップ 2000回、駅を引き直す）')
random.seed(7)
for lab, S in [('複数事業者の駅', multi), (f'全{len(ok)}駅', ok)]:
  a = [x['A'] for x in S]; b = [x['A'] * adjd(x, single) for x in S]; f = [x['food5'] for x in S]
  d0 = sp(b, f) - sp(a, f); ds = []
  for _ in range(2000):
    idx = [random.randrange(len(S)) for _ in S]
    ds.append(sp([b[i] for i in idx], [f[i] for i in idx]) - sp([a[i] for i in idx], [f[i] for i in idx]))
  ds.sort(); lo, hi = ds[int(0.025 * len(ds))], ds[int(0.975 * len(ds))]
  print(f'- {lab}（{len(S)}）：A {sp(a, f):.3f}・A_adj {sp(b, f):.3f}・差 {d0:+.3f}（95% {lo:+.3f}〜{hi:+.3f}、差が0以下の回 {sum(1 for v in ds if v <= 0)}/2000）')
  # 上位の数駅を抜くと
  top = sorted(S, key=lambda x: -(x['A'] / max(1, x['gate13'])))[:5]
  S2 = [x for x in S if x not in top]
  a2 = [x['A'] for x in S2]; b2 = [x['A'] * adjd(x, single) for x in S2]; f2 = [x['food5'] for x in S2]
  print(f'  乗り換えの割合の大きい5駅（{"・".join(x["name"] for x in top)}）を抜くと：A {sp(a2, f2):.3f}・A_adj {sp(b2, f2):.3f}・差 {sp(b2, f2) - sp(a2, f2):+.3f}')
  # 飲食店の数 ÷ 人通り：人通りの代わりにならない手がかり（飲食店の数は夜間人口でも決まるか）
  p5 = [x.get('pop5') or 0 for x in S]; e5 = [x.get('emp5') or 0 for x in S]
  print(f'  参考：飲食店の数と 500m の夜間人口 {sp(p5, f):.3f}・従業者 {sp(e5, f):.3f}・(夜間＋従業者) {sp([p + e for p, e in zip(p5, e5)], f):.3f}')
# (c)
print('\n## (c) 単独事業者の駅（乗降3万人以上）で、D13/A と 1km の 従業者/(従業者+夜間) の順位相関')
sg = [x for x in ok if x['ops'] == 1 and x['A'] > 30000 and x.get('emp1') is not None and x.get('pop1') is not None]
r = [x['gate13'] / x['A'] for x in sg]; L = [x['emp1'] / (x['emp1'] + x['pop1']) for x in sg]
print(f'- {len(sg)}駅：順位相関 {sp(r, L):.3f}')
q = sorted(zip(L, r)); n = len(q)
for k in range(4):
  part = q[k * n // 4:(k + 1) * n // 4]
  print(f'  昼の比の4分位 {k + 1}（{part[0][0]:.2f}〜{part[-1][0]:.2f}）：D13/A の中央値 {statistics.median(v for _, v in part):.3f}（{len(part)}駅）')
mg = [x for x in ok if x['ops'] >= 2 and x.get('emp1') is not None and x.get('pop1') is not None]
print(f'- 複数事業者の駅 {len(mg)}：D13/A と昼の比の順位相関 {sp([x["gate13"] / x["A"] for x in mg], [x["emp1"] / (x["emp1"] + x["pop1"]) for x in mg]):.3f}')
# (d)
ALL = G['ALL']; okn = {x['name'] for x in ok}
miss = [x for x in ALL if x['name'] not in okn]
why = collections.Counter(('D13が0' if not x['gate13'] else '') + ('・' if not x['gate13'] and x['food5'] is None else '') + ('500mの飲食店の値なし' if x['food5'] is None else '') for x in miss)
print(f'\n## (d) 係数が1のままの駅 {len(miss)}：理由 {dict(why)}')
print('  D13 はあるが飲食店の値がないので係数1：' + '、'.join(f'{x["name"]}(D13/A {x["gate13"] / x["A"]:.2f}→係数ならば {min(1, x["gate13"] / x["A"] / single):.2f})' for x in miss if x['gate13'] and x['food5'] is None and x['A']))
# (e) 候補地ごとの 500m メッシュの 従業者/(従業者+夜間)（BIZ-FOOTFALL23 5.2 の値の作り方。all5.js の Lsite で使う）
import json, os
out = {}
for s in G['SITES']:
  lat, lon = G['latlon'](s['x'], s['y']); m = G['meshvals'](lat, lon)
  if m['emp5'] is not None and m['pop5'] is not None and (m['emp5'] + m['pop5']) > 0: out[s['id']] = round(m['emp5'] / (m['emp5'] + m['pop5']), 3)
os.makedirs('out', exist_ok=True)
json.dump(out, open('out/site_L.json', 'w'), ensure_ascii=False)
byt = collections.defaultdict(list)
for s in G['SITES']:
  if s['id'] in out: byt[s['type']].append(out[s['id']])
print(f'\n## (e) 候補地ごとの昼の比（{len(G["SITES"])}か所のうち値のある {len(out)}）：' + '・'.join(f'{k} 中央{statistics.median(v):.2f}（{len(v)}）' for k, v in byt.items()))
# (f) 「2つの独立した資料が同じ向き」：D13 からの乗り換えの割合の見積もり 1−(D13/A)÷中央値 と、第12回の乗換え÷合計 の順位相関
both = [x for x in ok if x.get('t12_x') and x.get('t12_all')]
est = [1 - (x['gate13'] / x['A']) / single for x in both]; d12 = [x['t12_x'] / x['t12_all'] for x in both]
KEYS = set(G['KEY'])
k10 = [i for i, x in enumerate(both) if x['name'] in KEYS]
mb = [i for i, x in enumerate(both) if x['ops'] >= 2]; sb = [i for i, x in enumerate(both) if x['ops'] == 1]
print(f'\n## (f) 乗り換えの割合の2つの見積もり（D13 から・第12回）の順位相関：両方ある {len(both)}駅 {sp(est, d12):.3f}・主要10駅 {sp([est[i] for i in k10], [d12[i] for i in k10]):.3f}・複数事業者 {len(mb)}駅 {sp([est[i] for i in mb], [d12[i] for i in mb]):.3f}・単独事業者 {len(sb)}駅 {sp([est[i] for i in sb], [d12[i] for i in sb]):.3f}')
