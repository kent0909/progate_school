# 判定役が K*.txt・P_*.txt の SUMMARY の JSON から自分で表を作る（本人の tablek.js・table.md を使わない）。
# 出す列：組・列・kTop・湾岸 top/n・湾岸の中央・mix top・工場の中央・全体の中央・kpass・passB で×の名・K0 と比べて新しく×になった名・⑫a 段1・H2 の3本
import json, os, re, glob, sys
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'stationmap-kojo-draft', 'out')
def summ(path):
    for l in open(path, encoding='utf-8'):
        if l.startswith('SUMMARY '):
            return json.loads(l[8:])
    return None
cols = {'s79': '_s79', 's45': '_s45', 's214': '_s214', 'so18': '_s79_so18'}
groups = ['K0', 'K1', 'K1hi', 'K2', 'K3', 'K5', 'K6', 'K7', 'K7hi', 'K1R4', 'K1R3', 'K1R2']
base = {c: summ(os.path.join(D, 'K0' + s + '.txt')) for c, s in cols.items()}
print('| 組 | 列 | ⑪k | 湾岸 top/n・中央 | mix top/n・中央 | office | 工場の中央 | 全体の中央 | kpass | passB の× | K0 から新しく× | ⑫a 段1 | H2 |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
def row(name, c, S, B):
    k = S['kojo']; kb = k['kBy']
    bad = [x for x, v in k['passB'].items() if not v]
    new = [x for x, v in k['passB'].items() if not v and B['kojo']['passB'][x]] if B else []
    f = lambda t: f"{kb[t]['top']}/{kb[t]['n']}・{kb[t]['med']}" if t in kb else '—'
    kp = ' '.join(f"{x}{'○' if v else '×'}" for x, v in k['kpass'].items())
    print(f"| {name} | {c} | {k['kTop']} | {f('wangan')} | {f('mix')} | {f('office')} | {k['kMed']} | {k['allMed']} | {kp} | {','.join(bad) or '—'} | {','.join(new) or '—'} | {S['c12a']['1']} | {'/'.join(str(v) for v in k['H2'].values())} |")
for g in groups:
    for c, s in cols.items():
        p = os.path.join(D, g + s + '.txt')
        S = summ(p)
        if S is None:
            print(f'| {g} | {c} | SUMMARY なし |'); continue
        row(g, c, S, base[c])
for p in sorted(glob.glob(os.path.join(D, 'P_*.txt'))):
    S = summ(p)
    row(os.path.basename(p)[:-4], 's79', S, base['s79'])
