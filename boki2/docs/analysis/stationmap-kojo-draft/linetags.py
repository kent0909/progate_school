# 文書の中の〈番号〉の印がある行を数え、章「検査役の筋から採ったもの」の表の {L:番号} を行番号に置き換える（行の数は変わらない）。
# 使い方：python3 -I linetags.py <文書.md>。置き換えのあと、表の行数と、印のない番号（直した所がない番号）を出す。
import re, sys
p = sys.argv[1]; L = open(p, encoding='utf8').read().split('\n')
sec = None; tags = {}
for i, l in enumerate(L, 1):
    if l.startswith('## '): sec = l
    if sec and '検査役の筋から採ったもの' in sec: continue
    for t in re.findall(r'〈([^〉]+)〉', l): tags.setdefault(t, []).append(i)
out = []; miss = []
for l in L:
    def rep(m):
        t = m.group(1); v = tags.get(t)
        if not v: miss.append(t); return '（本文に印なし）'
        return '行 ' + '・'.join(map(str, v))
    out.append(re.sub(r'\{L:([^}]+)\}', rep, l))
open(p, 'w', encoding='utf8').write('\n'.join(out))
rows = [l for l in out if l.startswith('| ') and re.match(r'^\| (J|X|Y|Z|B|K|L|R|申|C|E|司)', l)]
print(f'{p}: 印 {len(tags)} 種・表の置き換えで印が見つからなかった番号 {miss}')
