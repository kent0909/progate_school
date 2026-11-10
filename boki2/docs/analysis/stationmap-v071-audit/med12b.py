# 判定役：⑫b の「中央値」を、台本の q（下の中央）と本当の中央（偶数なら2つの平均）で比べる。入力は all71.js の SAVE
import json, sys, statistics as st
for f in sys.argv[1:]:
  o = json.load(open(f))
  tiers = [1, 2, 3, 4, 5, 6, 8]
  def lo(a):
    s = sorted(a); return s[int(0.5 * (len(s) - 1))]
  dem = {t: [sum(d['dem'] for d in x['draws']) / len(x['draws']) for x in o if x['tier'] == t] for t in tiers}
  L = [round(lo(dem[t]), 2) for t in tiers]; M = [round(st.median(dem[t]), 2) for t in tiers]
  rev = lambda v: [f'{tiers[i-1]}→{tiers[i]}' for i in range(1, 7) if v[i] < v[i-1]]
  print(f.split('/')[-1], '下の中央', L, '逆転', rev(L), '｜本当の中央', M, '逆転', rev(M))
