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

# 2段目：読むための本文（main）。APPLION はサイトの頭（ランキングの一覧など）と末尾（関連アプリ）を除く。
# 論文は参考文献の一覧（References）から後ろを除く。除いた所は主張の根拠にならない（判定書に書く）。
mdir = os.path.join(out, 'main')
os.makedirs(mdir, exist_ok=True)
tot = 0
for r in rows:
    b = open(os.path.join(out, r['doc'] + '.txt'), encoding='utf-8').read()
    if 'APPLION' in b[:300]:
        s = b.find('\n概要\n')
        s2 = b.find('\n口コミ\n')
        s = min(x for x in [s, s2] if x >= 0) if (s >= 0 or s2 >= 0) else 0
        e = b.find('このアプリのレビューやランキングの詳細情報')
        if e < 0: e = b.find('このゲームのレビューやランキングの詳細情報')
        b = b[s:(e if e > 0 else len(b))]
    else:
        m = None
        for pat in [r'\n\s*REFERENCES\s*\n', r'\n\s*References\s*\n', r'\n\s*\d*\.?\s*REFERENCES\b', r'\n\s*References\b']:
            ms = list(re.finditer(pat, b))
            if ms:
                m = ms[-1]; break
        if m and m.start() > len(b) * 0.5:
            b = b[:m.start()]
    b = re.sub(r'[ \t]+', ' ', b)
    open(os.path.join(mdir, r['doc'] + '.txt'), 'w', encoding='utf-8').write(b)
    print('main', r['doc'], len(b))
    tot += len(b)
print('main_total', tot)
