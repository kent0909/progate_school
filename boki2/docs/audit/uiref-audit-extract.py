# 事実の判定（BIZ-UIREF）用：報告が引く文書ごとに、原文（research/raw）を本文のテキストにして書き出す。
# 使い方: python3 -I boki2/docs/audit/uiref-audit-extract.py <出力先のフォルダ>
# 原文の在りかは読了ノートの front matter の file: を使う。HTML は script/style/noscript を除いた本文、PDF は pdftotext。
import os, re, sys, subprocess, json
from bs4 import BeautifulSoup

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
REP = os.path.join(ROOT, 'docs', 'BIZ-UIREF.md')
NOTES = os.path.join(ROOT, 'research', 'notes', 'web', 'uiref')
RAW = os.path.join(ROOT, 'research', 'raw', 'web', 'uiref')
out = sys.argv[1]
os.makedirs(out, exist_ok=True)

text = open(REP, encoding='utf-8').read()
docs = sorted(set(re.findall(r'\[\[web:uiref:([^|\]]+)\|', text)))
rows = []
for d in docs:
    note = os.path.join(NOTES, d + '.md')
    nt = open(note, encoding='utf-8').read() if os.path.exists(note) else None
    m = re.search(r'^file:\s*(\S+)', nt or '', re.M)
    f = os.path.join(RAW, m.group(1)) if m else None
    status = 'ok'
    body = ''
    if not f or not os.path.exists(f):
        status = 'raw-missing'
    elif f.endswith('.pdf'):
        body = subprocess.run(['pdftotext', '-layout', f, '-'], capture_output=True, text=True).stdout
    else:
        html = open(f, encoding='utf-8', errors='replace').read()
        soup = BeautifulSoup(html, 'html.parser')
        for t in soup(['script', 'style', 'noscript', 'svg']):
            t.decompose()
        body = soup.get_text('\n')
        body = re.sub(r'[ \t　]+', ' ', body)
        body = re.sub(r'\n\s*\n+', '\n', body)
    open(os.path.join(out, d + '.txt'), 'w', encoding='utf-8').write(body)
    rows.append({'doc': d, 'note_bytes': len(nt.encode()) if nt else None, 'raw': os.path.basename(f) if f else None,
                 'status': status, 'text_chars': len(body)})
for r in rows:
    print('\t'.join(str(r[k]) for k in ['doc', 'note_bytes', 'raw', 'status', 'text_chars']))
print('docs', len(rows), 'total_chars', sum(r['text_chars'] for r in rows))
