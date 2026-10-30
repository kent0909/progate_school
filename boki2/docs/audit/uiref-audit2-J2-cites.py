# 事実の判定2（J2）：BIZ-UIREF.md の uC- 出典の全部（39件）について、語句が原文の全文テキストに出る回数と前後±150字を出す。
# 使い方: python3 -I boki2/docs/audit/uiref-audit2-J2-cites.py <J2-extract の出力先> [判定の TSV]
# 判定の TSV（列：番号・判定・理由）を渡すと、判定の数と割合も出す。正規化は NFKC と空白の除去（research-check と同じ向き）。
import os, re, sys, unicodedata
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
REP = os.path.join(ROOT, 'docs', 'BIZ-UIREF.md')
txtdir = sys.argv[1]
def norm(s): return re.sub(r'\s+', '', unicodedata.normalize('NFKC', s)).replace('ﬁ', 'fi').replace('ﬂ', 'fl')
rows = []
for ln, line in enumerate(open(REP, encoding='utf-8'), 1):
    for d, q in re.findall(r'\[\[web:uiref:(uC-[^|\]]+)\|「([^」]*)」\]\]', line):
        rows.append((ln, d, q))
print('uC の出典', len(rows))
for i, (ln, d, q) in enumerate(rows, 1):
    raw = open(os.path.join(txtdir, d + '.txt'), encoding='utf-8').read()
    n = norm(raw); k = norm(q)
    cnt = n.count(k); pos = n.find(k)
    ctx = n[max(0, pos-150):pos+len(k)+150] if pos >= 0 else '(なし)'
    print(f'#{i}\tL{ln}\t{d}\t「{q}」\t出る回数 {cnt}\n    {ctx}')
if len(sys.argv) > 2:
    from collections import Counter
    j = [l.rstrip('\n').split('\t') for l in open(sys.argv[2], encoding='utf-8') if l.strip() and not l.startswith('#')]
    c = Counter(r[1] for r in j)
    print('判定', dict(c), '計', len(j), '支える割合', f"{c.get('支える',0)}/{len(j)} = {100*c.get('支える',0)/len(j):.1f}%")
