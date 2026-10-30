# 事実の判定（BIZ-UIREF）用：出典の語句が原文（本文のテキスト）のどこに出るかと、その前後を出す。
# 使い方: python3 -I boki2/docs/audit/uiref-audit-context.py <uiref-audit-extract.py の出力先> [前後の字数] [all|sample]
# all は報告の出典82件すべてについて「原文に出るか・何回出るか」だけを出す。sample は抜き取り55件の前後を出す。
import os, re, sys, random, unicodedata
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
tx = sys.argv[1]; W = int(sys.argv[2]) if len(sys.argv) > 2 else 160; mode = sys.argv[3] if len(sys.argv) > 3 else 'sample'
rep = open(os.path.join(ROOT, 'docs', 'BIZ-UIREF.md'), encoding='utf-8').read().split('\n')
cites = []
for i, line in enumerate(rep, 1):
    for m in re.finditer(r'\[\[web:uiref:([^|\]]+)\|「([^」]*)」\]\]', line):
        cites.append((i, m.group(1), m.group(2)))
def norm(s): return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', s))
if mode == 'all':
    for k, (i, d, p) in enumerate(cites):
        t = norm(open(os.path.join(tx, d + '.txt'), encoding='utf-8').read())
        print(f'C{k:02d}\tL{i}\t{d}\t{p}\t出る回数={t.count(norm(p))}')
    sys.exit()
r = random.Random(20261030)
for k in sorted(r.sample(range(len(cites)), 55)):
    i, d, p = cites[k]
    t = norm(open(os.path.join(tx, d + '.txt'), encoding='utf-8').read())
    q = norm(p); pos = [m.start() for m in re.finditer(re.escape(q), t)]
    print(f'===== C{k:02d} L{i} {d} 「{p}」 出る回数={len(pos)}')
    print('  報告の行:', rep[i-1][:0])
    for s in pos[:2]:
        print('  …' + t[max(0, s - W):s + len(q) + W].replace('\n', ' ') + '…')
