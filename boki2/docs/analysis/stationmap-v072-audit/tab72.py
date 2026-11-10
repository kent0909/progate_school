# 版0.7.2 の判定役：stationmap-v072-draft/out の M・MN の数を表にする
import json, sys, glob, os, re
D = sys.argv[1]
for f in sorted(glob.glob(os.path.join(D, 'M*.txt'))):
  L = open(f, encoding='utf8').read().splitlines()
  s = json.loads([l for l in L if l.startswith('SUMMARY ')][0][8:])
  g = lambda p: next((l for l in L if l.startswith(p)), '')
  tier = dict(re.findall(r'段(\d):\d+か所 利益(-?\d+)万', g('段ごと')))
  attr = dict(re.findall(r'(\w+):\d+か所 利益(-?\d+)万', g('属性ごと')))
  c2 = re.findall(r'[\d.]+%', g('② '))
  slot = re.findall(r'繁華街 (\d+)%', g('   参考 減る'))[:1]
  print(os.path.basename(f), L[0][:80])
  print('  c1', s['c1'], 'c2', c2[0], 'slotOver', c2[-1], 'c4', s['c4'], 'c5', s['c5'], 'share', s['c5share'], 'max', max(s['c5']), 'c6max', s['c6max'], 'rvb', s['ruleVsBotMax'], 'c7', s['c7'], 'slot', slot, 'c8', s['c8'], 'c9', s['c9'], 'loss', s['loss'])
  print('  c11', s['c11'], 'c12a', s['c12a'])
  print('  c12b', s['c12b']['dem'], s['c12b']['revD'], 'c13 min', min(s['c13']), 'lift', s['lift'], 'wFew', s['wFew'], 'wMany', s['wMany'])
  print('  段利益', tier, '属性利益', attr)
  print('  pass', {k: v for k, v in s['pass'].items() if not v}, 'pass2', s['pass2'])
  print('  ', g('段×')[:400])
