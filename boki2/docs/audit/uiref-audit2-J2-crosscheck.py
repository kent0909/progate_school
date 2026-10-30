# 事実の判定2（J2）：16章「読み直しの反映表」の「入れた所」を、本文の章ごとの R 番号の出現と突き合わせる（統合のスクリプトとは別に書いた）。
# あわせて、R3 の2章の表で向きが「反する・悪い面・訂正」の行が全部 16章にあるか、R3 の表全体（支える・新しいを含む65行）のうち本文に出る数を数える。
# 使い方: python3 -I boki2/docs/audit/uiref-audit2-J2-crosscheck.py
import os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
biz = open(os.path.join(ROOT, 'docs', 'BIZ-UIREF.md'), encoding='utf-8').read().split('\n')
chap = {}; cur = None; body = {}
for ln in biz:
    m = re.match(r'^## (\d+)\.', ln)
    if m: cur = int(m.group(1))
    elif ln.startswith('## '): cur = ln[3:].strip()
    body.setdefault(cur, []).append(ln)
def ids(text): return set(re.findall(r'R[123]-(?:[A-Z]\d+|3\.\d+#\d+|2\.\d+-\d+)', text))
where = {}
for c, ls in body.items():
    if c in (15, 16) or c == '数の出力': continue
    for r in ids('\n'.join(ls)): where.setdefault(r, set()).add(c)
rows = [l for l in body[16] if l.startswith('| R')]
bad = []
for l in rows:
    cells = [x.strip() for x in l.strip('|').split('|')]
    rid, claimed = cells[0], set(int(x) for x in re.findall(r'(\d+)章', cells[2]))
    actual = set(c for c in where.get(rid, set()) if isinstance(c, int))
    if claimed != actual: bad.append((rid, sorted(claimed), sorted(actual)))
rows = [l for l in rows if not l.startswith('| R番号')]
print('16章の行', len(rows), '／「入れた所」と本文の出現が違う行', len(bad))
for b in bad: print('   ', b)
r3 = open(os.path.join(ROOT, 'docs', 'analysis', 'uiref-reread-R3.md'), encoding='utf-8').read()
r3rows = [(m.group(1), (re.search(r'\]\] \| ([^|：]*)', m.group(0)) or re.search(r'$^', '')).group(1) if re.search(r'\]\] \| ([^|：]*)', m.group(0)) else '') for m in re.finditer(r'^\| (R3-[A-Z]\d+) \|.*$', r3, re.M)]
need = [r for r, d in r3rows if any(k in d for k in ('反する', '悪い面', '訂正'))]
in16 = set(re.findall(r'^\| (R3-[A-Z]\d+) ', '\n'.join(body[16]), re.M))
print('R3 の表の行', len(r3rows), '／うち反する・悪い面・訂正', len(need), '／16章にない', sorted(set(need) - in16))
other = [r for r, d in r3rows if r not in need]
print('R3 の支える・新しい', len(other), '／本文（15・16章を除く）に出る', sorted(r for r in other if r in where), '／出ない', sorted(r for r in other if r not in where))
