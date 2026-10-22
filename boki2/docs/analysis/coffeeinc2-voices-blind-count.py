#!/usr/bin/env python3
# Coffee Inc 2 の利用者の声：目隠しの付け直し（coffeeinc2-voices-blind.md）の件数を数える
# 使い方：python3 -I boki2/docs/analysis/coffeeinc2-voices-blind-count.py
import os, re, collections
HERE = os.path.dirname(os.path.abspath(__file__))
BLIND = os.path.join(HERE, 'coffeeinc2-voices-blind.md')
PRAISE = list('LDISTRUFCGVAWHO') + ['Z', '-']
COMPL = list('abcdefghmijklnopq') + ['-']

def load(path=BLIND):
    rows = {}
    for line in open(path, encoding='utf8'):
        m = re.match(r'^\|\s*(\d+)\s*\|([^|]*)\|([^|]*)\|([^|]*)\|', line)
        if not m:
            continue
        n = int(m.group(1))
        pr = [c.strip() for c in m.group(2).split(',') if c.strip()]
        co = [c.strip() for c in m.group(3).split(',') if c.strip()]
        rows[n] = {'praise': pr, 'compl': co, 'time': m.group(4).strip()}
    return rows

def check(rows):
    assert sorted(rows) == list(range(1, 161)), '通し番号が1〜160でない'
    for n, r in rows.items():
        for c in r['praise']:
            assert c in PRAISE, (n, c)
        for c in r['compl']:
            assert c in COMPL, (n, c)
        for side, only in (('praise', ('Z', '-')), ('compl', ('-',))):
            if any(c in only for c in r[side]):
                assert len(r[side]) == 1, (n, side, '約束5違反')
        if r['time']:
            assert 'I' in r['praise'] and r['time'] in ('最初', '後半'), (n, r['time'])

if __name__ == '__main__':
    rows = load(); check(rows)
    N = len(rows)
    print('件数', N)
    cp = collections.Counter(c for r in rows.values() for c in r['praise'])
    cc = collections.Counter(c for r in rows.values() for c in r['compl'])
    print('\n褒めの符号（その符号が付いた口コミの件数・割合）')
    for c in PRAISE:
        print('  %-2s %3d  %5.1f%%' % (c, cp[c], 100 * cp[c] / N))
    print('\n不満の符号')
    for c in COMPL:
        print('  %-2s %3d  %5.1f%%' % (c, cc[c], 100 * cc[c] / N))
    reason = sum(1 for r in rows.values() if r['praise'] not in (['Z'], ['-']))
    print('\n褒めの理由が一つ以上ある', reason, '件／Z だけ', cp['Z'], '件／褒めていない', cp['-'], '件')
    print('不満・要望が一つ以上ある', N - cc['-'], '件／不満なし', cc['-'], '件')
    t = collections.Counter(r['time'] for r in rows.values() if 'I' in r['praise'])
    print('I の時期：最初 %d／後半 %d／空 %d' % (t['最初'], t['後半'], t['']))
