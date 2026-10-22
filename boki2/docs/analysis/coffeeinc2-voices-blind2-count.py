#!/usr/bin/env python3
# 目隠しの付け直し（2回目）の件数：coffeeinc2-voices-blind2.md の符号の表から数える
# 使い方：python3 -I boki2/docs/analysis/coffeeinc2-voices-blind2-count.py
import re, os, collections
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'coffeeinc2-voices-blind2.md')
PRAISE = list('LDISTRUFCGVAWHOZ') + ['-']
COMPL = list('abcdefghmijklnopqxy') + ['-']

def load(path=SRC):
    rows = {}
    for l in open(path, encoding='utf8'):
        if not re.match(r'^\| \d+ \|', l):
            continue
        c = [x.strip() for x in l.strip().strip('|').split('|')]
        rows[int(c[0])] = {'P': set(c[3].split()), 'N': set(c[4].split()), 'T': c[5], 'M': c[6]}
    return rows

if __name__ == '__main__':
    R = load()
    n = len(R)
    assert sorted(R) == list(range(1, 161)), '通し番号が 1〜160 でない'
    for k, v in R.items():
        assert v['P'] <= set(PRAISE) and v['N'] <= set(COMPL), (k, v)
        assert not (('Z' in v['P'] or '-' in v['P']) and len(v['P']) > 1), ('Z・- は単独', k)
        assert not ('-' in v['N'] and len(v['N']) > 1), ('不満の - は単独', k)
    print('件数', n)
    pc = collections.Counter(c for v in R.values() for c in v['P'])
    nc = collections.Counter(c for v in R.values() for c in v['N'])
    print('\n褒めの符号（件数・割合）')
    for c in PRAISE:
        print('  %s %3d  %5.1f%%' % (c, pc[c], 100 * pc[c] / n))
    print('\n不満の符号（件数・割合）')
    for c in COMPL:
        print('  %s %3d  %5.1f%%' % (c, nc[c], 100 * nc[c] / n))
    tc = collections.Counter(v['T'] for v in R.values() if 'I' in v['P'])
    print('\n没入 I の時期：最初 %d・後半 %d・空 %d' % (tc['最初'], tc['後半'], tc['']))
    m = sum(1 for v in R.values() if v['M'])
    print('迷いの印のある件', m)
    reason = sum(1 for v in R.values() if v['P'] - {'Z', '-'})
    print('褒めの理由が一つ以上ある件', reason, '／ Z だけ', pc['Z'], '／ 褒めていない', pc['-'])
