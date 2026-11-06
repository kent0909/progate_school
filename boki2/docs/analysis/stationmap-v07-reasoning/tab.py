# -*- coding: utf-8 -*-
# 自分で回した組（out/*.txt）と取りまとめ役の組（../stationmap-v07-draft/out/*.txt）の主な数を1行ずつ並べる（論証検査役、11/5）。
# 実行：python3 -I boki2/docs/analysis/stationmap-v07-reasoning/tab.py <out のフォルダ> [...]
import json, re, sys, glob, os, statistics
def one(f):
  t = open(f, encoding='utf8').read()
  m = re.search(r'^SUMMARY (.*)$', t, re.M)
  if not m: return None
  s = json.loads(m.group(1))
  # 全くじの開店の前の0軒の割合と、上位50の開店の前の0軒の平均（どれだけ0軒に寄るか）
  z = re.search(r'全くじ：開店の前に0軒 (\d+)%・3年目の終わりに0軒 (\d+)%', t)
  pre0, end0 = (int(z.group(1)), int(z.group(2))) if z else (None, None)
  tiers = re.search(r'^段ごと.*$', t, re.M).group(0)
  tp = dict((int(a), int(b)) for a, b in re.findall(r'段(\d):\d+か所 利益(-?\d+)万', tiers))
  attrs = re.search(r'^属性ごと.*$', t, re.M).group(0)
  ap = dict(re.findall(r'(\w+):\d+か所 利益(-?\d+)万', attrs))
  bypre = re.search(r'^ライバルの軒数（開店の前）ごと.*$', t, re.M).group(0)
  bp = dict((int(a), int(b)) for a, b in re.findall(r'(\d)軒:\d+ 利益(-?\d+)万', bypre))
  c5 = s['c5']; K = s['K']
  return dict(name=os.path.basename(f)[:-4], K=K, SO=s['SO'], c1=s['c1'], c2=s['c2'], c3='%d・%d・%d' % (s['c3']['tiers'], s['c3']['attrs'], s['c3']['js']), c4=s['c4'],
              c5='%d〜%d（平均%.1f・15超%d/%d）' % (min(c5), max(c5), statistics.mean(c5), sum(1 for x in c5 if x > 15), K),
              c5pre='%d〜%d' % (min(s['c5pre']), max(s['c5pre'])), lift='%.2f' % ((statistics.mean(s['c5pre']) / 50) / (pre0 / 100)) if pre0 else '—',
              pre0=pre0, end0=end0, c6=s['c6max'], bot=s['ruleVsBotMax'], c7='%d・%d' % (s['c7']['off'], s['c7']['hanka']), c8=s['c8'], c9=s['c9'], loss=s['loss'],
              fail=''.join(k for k, v in s['pass'].items() if not v) or 'なし', tier='/'.join(f'{k}:{tp.get(k, "")}' for k in (1, 2, 3, 4, 5, 6, 8)),
              off=ap.get('office'), kojo=ap.get('kojo'), b0=bp.get(0), b1=bp.get(1), b2=bp.get(2))
cols = ['name', 'K', 'SO', 'c1', 'c2', 'c3', 'c4', 'c5', 'c5pre', 'pre0', 'lift', 'c6', 'bot', 'c7', 'c8', 'c9', 'loss', 'fail', 'tier', 'off', 'kojo', 'b0', 'b1', 'b2']
print('| ' + ' | '.join(cols) + ' |'); print('|' + '---|' * len(cols))
for d in sys.argv[1:]:
  for f in sorted(g for g in glob.glob(os.path.join(d, '*.txt')) if not g.endswith('summary.txt')):
    r = one(f)
    if r: print('| ' + ' | '.join(str(r[c]) for c in cols) + ' |')
