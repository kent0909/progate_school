#!/usr/bin/env python3
"""公開版の独立再実行を照合し、同じseedの差を検算する。"""
import json, random, sys
from pathlib import Path
actual, expected = map(Path, sys.argv[1:3])
a=json.loads((actual/'summary.json').read_text()); e=json.loads((expected/'summary.json').read_text())
assert a==e, '公開集計と独立再実行の不一致'
groups={}
for line in (actual/'runs.jsonl').open():
 r=json.loads(line); groups.setdefault((r['variant'],r['kind']),{})[r['seed']]=r
assert len(groups)==70 and all(len(g)==300 for g in groups.values())
print('【確かめた】独立再実行のsummary全項目が公開版と一致。70群×300 seed＝21000周。')
print('\n|印|案|方針|10月到達 上手/放置|差pt|対応seed bootstrap95%|\n|---|---|---|---|---|---|')
rng=random.Random(20261024); B=5000
for v in ['base','potential','ramp','fixed','combined']:
 idle=groups[(v,'idle')]
 for kind in ['smart0','smart1','smart2']:
  smart=groups[(v,kind)]
  hit=lambda r:int(r['first'] is not None and r['first']<=6)
  ds=[hit(smart[s])-hit(idle[s]) for s in range(300)]
  bs=sorted(sum(ds[rng.randrange(300)] for _ in range(300))/3 for _ in range(B))
  print(f'|【確かめた】|{v}|{kind}|{sum(hit(r) for r in smart.values())}/300 / {sum(hit(r) for r in idle.values())}/300|{sum(ds)/3:.1f}|{bs[int(B*.025)]:.1f}〜{bs[int(B*.975)]:.1f}|')
print('\n幅は同じseedを対応させた5000回の百分位bootstrap。乱数20261024、推定対象は実装のseed分布。人の成功率ではない。')
for k in ['idle','policy0','smart0','smart1','smart2']:
 b=groups[('base',k)]; g=groups[('loanGrace',k)]; t=groups[('retain',k)]
 same=sum([x['op'] for x in b[s]['months']]==[x['op'] for x in g[s]['months']] for s in range(300))
 med=lambda xs:sorted(xs)[len(xs)//2]
 print(f'【確かめた】{k}: loanGraceの1年目月別営業利益が完全一致 {same}/300 seed。retain年間利益中央値 {med([r["sumOp"] for r in b.values()])/10000:.1f}→{med([r["sumOp"] for r in t.values()])/10000:.1f}万円。')
