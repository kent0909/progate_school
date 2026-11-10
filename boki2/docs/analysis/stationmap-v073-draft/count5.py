# 版0.7.3：⑤の3つの量で、これまでの試しの組の合否を並べる（sim は回さない。SUMMARY の c5 を読むだけ）。PLAN.md のとおり。
# 実行：python3 -I count5.py ..（boki2/docs/analysis を渡す）
import json,glob,math,sys,os
A=sys.argv[1]
print('| 出どころ | 組 | 世界の数 | 最大 | (1) 最大≦15 | 15超の割合 | (2) 割合≦10% | 中央値 | (3) 中央値≦15 | 90パーセンタイル |')
print('|---|---|---|---|---|---|---|---|---|---|')
for pat in ['stationmap-v071-draft/out/T*.txt','stationmap-v071-draft/out/N*.txt','stationmap-v072-draft/out/M*.txt','stationmap-v071-reasoning/out/S*.txt','stationmap-v071-reasoning/out/U*.txt','stationmap-v072-reasoning/out/V[1-4]_*.txt']:
  for f in sorted(glob.glob(os.path.join(A,pat))):
    if f.endswith('_bot.txt'): continue
    for l in open(f,encoding='utf8'):
      if not l.startswith('SUMMARY'): continue
      c=json.loads(l[8:])['c5']; s=sorted(c); n=len(c)
      med=(s[(n-1)//2]+s[n//2])/2; p90=s[math.ceil(0.9*n)-1]; sh=sum(x>15 for x in c)/n
      ok=lambda b:'○' if b else '×'
      print(f"| {f.split('/')[-3].replace('stationmap-','')} | {os.path.basename(f)[:-4]} | {n} | {max(c)} | {ok(max(c)<=15)} | {100*sh:.1f}% | {ok(sh<=0.1)} | {med:g} | {ok(med<=15)} | {p90} |")
