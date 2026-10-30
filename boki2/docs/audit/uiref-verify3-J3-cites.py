# 確かめ役 J3（BIZ-UIREF 版3）：uiref-merge-cites.tsv の「版3で足した」49組から無作為に25組を抜き、
# 原文（全文のテキスト）での出る回数と前後、BIZ 版3 の引く行を並べる。判定は J3 が原文を読んで手で書く（このスクリプトは判定しない）。
# 使い方: python3 -I boki2/docs/audit/uiref-verify3-J3-cites.py <uiref-audit-extract.py の出力フォルダ> [seed] [前後の字数]
import os, re, sys, random, unicodedata

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
REP = os.path.join(ROOT, 'docs', 'BIZ-UIREF.md')
TSV = os.path.join(ROOT, 'docs', 'analysis', 'uiref-merge-cites.tsv')
ext = sys.argv[1]
seed = int(sys.argv[2]) if len(sys.argv) > 2 else 20261103
win = int(sys.argv[3]) if len(sys.argv) > 3 else 300


def norm(s):
    s = unicodedata.normalize('NFKC', s)
    return re.sub(r'\s+', '', s)


rows = []
for i, line in enumerate(open(TSV, encoding='utf-8').read().splitlines()):
    if i == 0:
        continue
    c = line.split('\t')
    if len(c) >= 6 and c[5].startswith('版3で足した'):
        rows.append((i + 1, c[0], c[1]))
print(f'版3で足した組: {len(rows)}')
random.seed(seed)
pick = sorted(random.sample(rows, 25))
print(f'seed {seed} で抜いた25組（tsv の行番号）: {[r[0] for r in pick]}')

rep = open(REP, encoding='utf-8').read().splitlines()
for ln, doc, phrase in pick:
    raw = open(os.path.join(ext, doc + '.txt'), encoding='utf-8').read()
    # 正規化した文字列と元の位置の対応を作る
    idx, buf = [], []
    for k, ch in enumerate(raw):
        for c2 in norm(ch):
            buf.append(c2)
            idx.append(k)
    nraw = ''.join(buf)
    p = norm(phrase)
    hits = [m.start() for m in re.finditer(re.escape(p), nraw)]
    cite = f'[[web:uiref:{doc}|「{phrase}」]]'
    lines = [n + 1 for n, l in enumerate(rep) if cite in l]
    print('=' * 100)
    print(f'tsv {ln}  {doc}  「{phrase}」  原文に出る回数 {len(hits)}  BIZ の行 {lines}')
    for h in hits[:3]:
        a = idx[max(0, h - 0)]
        s = max(0, a - win)
        e = min(len(raw), idx[min(len(idx) - 1, h + len(p) - 1)] + win)
        print('--- 原文の前後:')
        print(re.sub(r'\s+', ' ', raw[s:e]))
    for n in lines:
        l = rep[n - 1]
        j = l.find(cite)
        print(f'--- BIZ {n} 行の前後:')
        print(l[max(0, j - 220): j + len(cite) + 160])
