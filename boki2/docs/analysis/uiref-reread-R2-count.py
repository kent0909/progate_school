# R2 の読み直しの成果（uiref-reread-R2.md）の2章の表から、拾った事実の数を文書ごと・向きごとに数える。
# 使い方: python3 -I boki2/docs/analysis/uiref-reread-R2-count.py
# 数える範囲は「## 2.」から「### 2.13」の前まで（2.14 の「下書きにはあるが統合に入っていない」は数えない）。
# 1行＝1事実。向きは4列目の先頭の語（反する／支える／新しい）。
import os, re, collections
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uiref-reread-R2.md')
s = open(p, encoding='utf-8').read()
a = s.index('\n## 2.'); b = s.index('\n### 2.13')
rows = []
for line in s[a:b].split('\n'):
    if not line.startswith('| u'):
        continue
    # 出典の [[...|「...」]] の中の | で割れないよう、先に出典を置き換える
    t = re.sub(r'\[\[[^\]]*\]\]', 'CITE', line)
    c = [x.strip() for x in t.strip('|').split('|')]
    if len(c) != 6:
        raise SystemExit('列の数が6でない行: ' + line[:80])
    d, kind = c[0], c[3]
    m = re.match(r'(反する|支える|新しい)', kind)
    if not m:
        raise SystemExit('向きが読めない行: ' + line[:80])
    if 'CITE' not in c[2]:
        raise SystemExit('出典がない行: ' + line[:80])
    rows.append((d, m.group(1)))
cnt = collections.Counter(k for _, k in rows)
print('事実の行の合計', len(rows))
print('向き', ' '.join(f'{k} {cnt[k]}' for k in ['反する', '支える', '新しい']), f'（{cnt["反する"]}+{cnt["支える"]}+{cnt["新しい"]}={sum(cnt.values())}）')
by = collections.OrderedDict()
for d, k in rows:
    by.setdefault(d, collections.Counter())[k] += 1
for d, c in by.items():
    print(f'  {d}\t計 {sum(c.values())}\t反する {c["反する"]}\t支える {c["支える"]}\t新しい {c["新しい"]}')
dl = collections.Counter()
for d, _ in rows:
    dl['uB-duolingo-shape＋uC-duolingo-shape-language' if 'duolingo-shape' in d else d] += 1
print('文書の数（Duolingo の2本を1つの原文として）', len(dl), '／ノートの数', len(by))
print('最少', min(dl.items(), key=lambda x: x[1]), '最多', max(dl.items(), key=lambda x: x[1]))
