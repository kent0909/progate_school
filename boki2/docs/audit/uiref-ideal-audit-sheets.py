# DESIGN-UI-IDEAL の判定（事実の判定役）：cites.tsv の全画面について
# (1) 素案がその番号に寄せる主張（本文のリンクの前後と付録Aの備考）と、読了ノートの image_seen を書き出す
# (2) 原寸の画像を、番号と画面 id を付けて6枚ずつ一覧の画像にする（判定役が Read で開く）
# 使い方: python3 -I boki2/docs/audit/uiref-ideal-audit-sheets.py <出力ディレクトリ>
import os, re, sys, csv
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
DOC = os.path.join(ROOT, 'docs', 'DESIGN-UI-IDEAL.md')
TSV = os.path.join(ROOT, 'docs', 'analysis', 'uiref-ideal-cites.tsv')
NOTES = os.path.join(ROOT, 'research', 'notes', 'mobbin-mcp', 'screens')
RAW = os.path.join(ROOT, 'research', 'raw', 'mobbin-mcp', 'screens')
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
s = open(DOC, encoding='utf8').read()
body = s.split('## 付録A')[0]
rows = list(csv.DictReader(open(TSV, encoding='utf8'), delimiter='\t'))
# 主張：本文の各リンクの直後の（…）、なければ同じ行のリンクの前40字
claims = {}
for line in body.split('\n'):
    for m in re.finditer(r'\[([XWQM]\d+)\]\(https://mobbin\.com/screens/[0-9a-f-]{36}\)', line):
        n = m.group(1)
        after = line[m.end():m.end()+200]
        pm = re.match(r'(?:\[[XWQM]\d+\]\([^)]*\))*（([^）]{0,160})）', after)
        if pm: c = '（' + pm.group(1) + '）'
        else:
            before = re.sub(r'\[([XWQM]\d+)\]\([^)]*\)', r'[\1]', line[max(0, m.start()-120):m.start()])
            c = '…' + before[-70:]
        claims.setdefault(n, [])
        if c not in claims[n]: claims[n].append(c)
def seen(i):
    p = os.path.join(NOTES, i + '.md')
    if not os.path.exists(p): return '(ノートなし)'
    t = open(p, encoding='utf8').read()
    m = re.search(r'^image_seen:\s*"?(.*?)"?\s*$', t, re.M)
    return m.group(1) if m else '(image_seen なし)'
def raw(i):
    for e in ('.jpg', '.png', '.jpeg', '.webp'):
        p = os.path.join(RAW, i + e)
        if os.path.exists(p): return p
    return None
with open(os.path.join(out, 'worklist.txt'), 'w', encoding='utf8') as f:
    for k, r in enumerate(rows, 1):
        f.write(f"#{k} {r['番号']} {r['アプリ']} {r['id'][:8]} 原寸={'あり' if raw(r['id']) else 'なし'}\n")
        f.write(f"  付録A備考: {r['備考']}\n")
        for c in claims.get(r['番号'], ['(本文にリンクなし)']): f.write(f"  主張: {c}\n")
        f.write(f"  image_seen: {seen(r['id'])}\n\n")
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 34)
except Exception:
    font = ImageFont.load_default()
CW, CH, PER = 520, 1180, 6
for sh in range(0, len(rows), PER):
    grp = rows[sh:sh+PER]
    W = CW * 3; H = (CH + 50) * 2
    sheet = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(sheet)
    for j, r in enumerate(grp):
        x = (j % 3) * CW; y = (j // 3) * (CH + 50)
        d.text((x + 6, y + 6), f"#{sh+j+1} {r['番号']} {r['id'][:8]}", fill='red', font=font)
        p = raw(r['id'])
        if p:
            im = Image.open(p).convert('RGB'); im.thumbnail((CW - 10, CH - 5))
            sheet.paste(im, (x + 5, y + 50))
        d.rectangle([x, y, x + CW - 1, y + CH + 49], outline='black', width=2)
    sheet.save(os.path.join(out, f'sheet{sh//PER+1:02d}.jpg'), quality=85)
print('rows', len(rows), 'sheets', (len(rows) + PER - 1) // PER)
