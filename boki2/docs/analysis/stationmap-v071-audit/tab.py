# 版0.7.1 の判定役：stationmap-v071-draft/out の SUMMARY の行と、段ごと・⑫b 等の行を表にする
import json, sys, glob, os, re
D = sys.argv[1]
for f in sorted(glob.glob(os.path.join(D, '[TN]*.txt'))):
    L = open(f, encoding='utf8').read().splitlines()
    s = json.loads([l for l in L if l.startswith('SUMMARY ')][0][8:])
    tier = [l for l in L if l.startswith('段ごと')][0]
    m = {k: v for k, v in re.findall(r'段(\d):\d+か所 利益(-?\d+)万', tier)}
    c5 = s['c5']; fail = [k for k, v in s['pass'].items() if not v]
    print(os.path.basename(f), 'c1', s['c1'], 'c5max', max(c5), '>15', sum(1 for x in c5 if x > 15), 'c6max', s['c6max'], 'rvb', s['ruleVsBotMax'], 'c7', s['c7'], 'slot', s['c7slot'], 'c8', s['c8'], 'c9', s['c9'], 'loss', s['loss'], 'c13min', min(s['c13']), 'Pref', s['Pref'], 'combos', s['calCombos'], 'c2', s['c2'])
    print('   c11', s['c11'], 'c12a', s['c12a'])
    print('   c12b revD', s['c12b']['revD'], 'dem', s['c12b']['dem'], '段利益', m, 'fail', fail)
