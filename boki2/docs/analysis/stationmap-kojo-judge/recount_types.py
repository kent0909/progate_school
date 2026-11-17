# 判定役が型の規則（R1・R1z・R4・R3・R5）を tokyo23.js と count.txt §6 から自分で数え直す（本人の kojodata.js・factsk.js を使わない）。
# 使い方：python3 -I recount_types.py
import json, os, re
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..')
t = open(os.path.join(B, 'js/data/tokyo23.js'), encoding='utf-8').read()
data = json.loads(t[t.index('SIM.tokyo23 = ') + len('SIM.tokyo23 = '):t.rindex('};') + 1])
kojo = [s for s in data['sites'] if s['type'] == 'kojo']
st = {s['id']: s for s in data['stations']}
c = open(os.path.join(B, 'docs/analysis/ramencount23/out/count.txt'), encoding='utf-8').read()
sec = c.split('## 6.')[1]
rows = [l for l in sec.split('\n') if re.match(r'^\| \d+ \|', l)][:25]
mesh = {}
for l in rows:
    f = [x.strip() for x in l.strip('|').split('|')]
    mesh[f[1]] = dict(R=None if f[7] == '—' else int(f[7].replace(',', '')), W=int(f[8].replace(',', '')), per1000=float(f[13]), eat=int(f[12]))
print('kojo の数', len(kojo), '・count §6 の行', len(rows), '・町の名が全部当たるか', all(s['town'] in mesh for s in kojo))
# オフィス街の候補地の「従業者1,000人あたり」25%点は count の属性の表から（2.7）。
R = {
    'R1': [s for s in kojo if (s.get('day') is None or s['day'] >= 0.8) and mesh[s['town']]['W'] < 10000],
    'R1z': [s for s in kojo if (s.get('day') is None or s['day'] >= 0.8) and s['zone'] != '商業'],
    'R4': [s for s in kojo if mesh[s['town']]['per1000'] < 2.7],
    'R3': [s for s in kojo if not re.search('住宅|アパート|住', s['desc'])],
    'R5': [s for s in kojo if s['zone'] == '工専'],
}
for k, v in R.items():
    print(k, len(v), '・'.join(s['town'] for s in v))
r1 = {s['id'] for s in R['R1']}
office = [s for s in kojo if s['id'] not in r1 and mesh[s['town']]['W'] >= 10000]
mix = [s for s in kojo if s['id'] not in r1 and mesh[s['town']]['W'] < 10000]
print('湾岸・物流', len(R['R1']), '・住工混在', len(mix), '・事務所街', len(office), '（', '・'.join(s['town'] for s in office), '）')
med = lambda a: sorted(a)[len(a) // 2] if len(a) % 2 else (sorted(a)[len(a) // 2 - 1] + sorted(a)[len(a) // 2]) / 2
print('R1 の W の中央', med([mesh[s['town']]['W'] for s in R['R1']]))
print('R1 の夜間人口の中央（— を0）', med([mesh[s['town']]['R'] or 0 for s in R['R1']]), '・（— を除く）', med([mesh[s['town']]['R'] for s in R['R1'] if mesh[s['town']]['R'] is not None]))
print('day なしの kojo', [s['town'] for s in kojo if s.get('day') is None], '・day のある kojo の中央', med([s['day'] for s in kojo if s.get('day') is not None]))
print('全候補地で day なし', [(s['town'], s['type']) for s in data['sites'] if s.get('day') is None])
print('kojo の駅の段', sorted(st[s['st']]['tier'] for s in kojo))
