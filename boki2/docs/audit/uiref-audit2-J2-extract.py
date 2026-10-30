# 事実の判定2（J2）用：BIZ-UIREF.md が引く uC- の文書だけを、原文（research/raw）から全文のテキストにする。
# 使い方: python3 -I boki2/docs/audit/uiref-audit2-J2-extract.py <出力先>
# HTML は script/style/noscript/svg を除いた本文、PDF は pdftotext（段組みの順、-layout なし）とページ数。参考文献も切らない（全文）。
import os, re, sys, subprocess
from bs4 import BeautifulSoup
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
REP = os.path.join(ROOT, 'docs', 'BIZ-UIREF.md')
NOTES = os.path.join(ROOT, 'research', 'notes', 'web', 'uiref')
RAW = os.path.join(ROOT, 'research', 'raw', 'web', 'uiref')
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
text = open(REP, encoding='utf-8').read()
cites = re.findall(r'\[\[web:uiref:(uC-[^|\]]+)\|「([^」]*)」\]\]', text)
docs = sorted(set(d for d, _ in cites))
print('uC の出典', len(cites), '件・文書', len(docs))
for d in docs:
    nt = open(os.path.join(NOTES, d + '.md'), encoding='utf-8').read()
    m = re.search(r'^file:\s*(\S+)', nt, re.M)
    f = os.path.join(RAW, m.group(1))
    pages = '-'
    if f.endswith('.pdf'):
        body = subprocess.run(['pdftotext', f, '-'], capture_output=True, text=True).stdout
        info = subprocess.run(['pdfinfo', f], capture_output=True, text=True).stdout
        pages = re.search(r'Pages:\s*(\d+)', info).group(1)
    else:
        soup = BeautifulSoup(open(f, encoding='utf-8', errors='replace').read(), 'html.parser')
        for t in soup(['script', 'style', 'noscript', 'svg']): t.decompose()
        body = soup.get_text('\n')
        body = re.sub(r'[ \t　]+', ' ', body); body = re.sub(r'\n\s*\n+', '\n', body)
    open(os.path.join(out, d + '.txt'), 'w', encoding='utf-8').write(body)
    n = sum(1 for dd, _ in cites if dd == d)
    print(f'{d}\t{os.path.basename(f)}\tページ {pages}\t字数 {len(body)}\t行 {body.count(chr(10))}\tノート {len(nt)}字\t出典 {n}')
