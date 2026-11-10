# 論証の検査役（11/10）：⑦ 案A の day の読みを2通りで比べる（データだけ、sim なし）。
# 設計書の式（drop）：夜に働く飲食の人を day から「除く」 d'=d(1-νf)/(d(1-νf)+(1-d))
# 別の読み（move）：その人を夜の側へ「移す」 D=d(1-νf)、夜の基＝(1-d)+dνf（κ の項は同じ）
# 実行：python3 -I boki2/docs/analysis/stationmap-v071-reasoning/night_move.py boki2/js/data/tokyo23.js
import json, sys, statistics as st
t = open(sys.argv[1], encoding='utf8').read()
d, _ = json.JSONDecoder().raw_decode(t[t.index('SIM.tokyo23 = ') + len('SIM.tokyo23 = '):])
H = [s for s in d['sites'] if s['type'] == 'hanka' and s.get('day') is not None]
def L(dd, f, nu, mode, kap=0.6, fm=0.0708):
  if mode == 'drop':
    d2 = dd * (1 - nu * f) / (dd * (1 - nu * f) + (1 - dd)); D, nb = d2, 1 - d2
  else:
    D, nb = dd * (1 - nu * f), (1 - dd) + dd * nu * f
  Nt = max(0.05, nb + kap * (f / fm - 1)); return D / (D + Nt)
for kap in (0.6, 1.0):
  for nu in (0, 0.5, 0.8, 1.0):
    a = [L(s['day'], s['food'], nu, 'drop', kap) for s in H]; b = [L(s['day'], s['food'], nu, 'move', kap) for s in H]
    print(f'κ{kap} ν{nu}：繁華街{len(H)}本の L の中央 drop {st.median(a):.3f}・move {st.median(b):.3f}｜L<0.35 の本数 drop {sum(x<0.35 for x in a)}・move {sum(x<0.35 for x in b)}')
