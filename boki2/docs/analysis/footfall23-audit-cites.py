# -*- coding: utf-8 -*-
# BIZ-FOOTFALL23 の出典 [[web:footfall23:doc|「語句」]] を全部抜き、原文（テキストにしたもの）に語句が出るかと前後の文を出す。
# 実行：python3 -I boki2/docs/analysis/footfall23-audit-cites.py boki2/docs/BIZ-FOOTFALL23.md <原文をテキストにした置き場>
import sys, re, unicodedata, os
rep = open(sys.argv[1], encoding='utf8').read().splitlines()
TX = sys.argv[2]
FN = {'jinryu-definition': 'jinryu-definition_pdf', 'jinryu-example': 'jinryu-example_pdf', 'jinryu-kobai': 'jinryu-kobai_pdf', 'jinryu-license': 'jinryu-license_pdf',
      'census13-gaiyo': 'census13-gaiyo_pdf', 'census13-report': 'census13-report_pdf', 'census12-shuto-kohan': 'census12-shuto-kohan_pdf', 'census13-teiki-csv': 'census13-teiki-csv'}
def norm(s): return re.sub(r'\s+', '', unicodedata.normalize('NFKC', s))
cache = {}
def text(doc):
  if doc in cache: return cache[doc]
  f = os.path.join(TX, FN.get(doc, doc).replace('estat-def-', 'estat-def-') + '.txt')
  if doc.startswith('estat-def-'): f = os.path.join(TX, doc + '_pdf.txt')
  cache[doc] = open(f, encoding='utf8', errors='replace').read() if os.path.exists(f) else None
  return cache[doc]
n = 0; hit = 0
for i, line in enumerate(rep, 1):
  for doc, ph in re.findall(r'\[\[web:footfall23:([^|\]]+)\|「([^」]+)」\]\]', line):
    n += 1; t = text(doc)
    if t is None: print(f'L{i} {doc} 「{ph}」 原文のテキストなし'); continue
    nt = norm(t); p = norm(ph); k = nt.find(p)
    ok = k >= 0; hit += ok
    ctx = nt[max(0, k - 60):k + len(p) + 60] if ok else ''
    print(f'L{i} {doc} 「{ph}」 {"出る" if ok else "出ない"} … {ctx}')
print(f'# 出典 {n} 件・原文に出る {hit} 件')
