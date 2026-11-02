# 判定役：cites.tsv の横長（web）の画面を、字が読める大きさで2枚ずつ縦に並べた画像にする
# 使い方: python3 -I boki2/docs/audit/uiref-ideal-audit-wide.py <出力ディレクトリ>
import os, sys, csv
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
TSV = os.path.join(ROOT, 'docs', 'analysis', 'uiref-ideal-cites.tsv')
RAW = os.path.join(ROOT, 'research', 'raw', 'mobbin-mcp', 'screens')
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
rows = list(csv.DictReader(open(TSV, encoding='utf8'), delimiter='\t'))
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 34)
wide = []
for k, r in enumerate(rows, 1):
    im = Image.open(os.path.join(RAW, r['id'] + '.jpg'))
    if im.size[0] > im.size[1]: wide.append((k, r, im))
for g in range(0, len(wide), 2):
    ims = []
    for k, r, im in wide[g:g+2]:
        im = im.convert('RGB'); im.thumbnail((1600, 1600)); ims.append((k, r, im))
    H = sum(i.size[1] + 50 for _, _, i in ims); W = 1600
    sh = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(sh); y = 0
    for k, r, im in ims:
        d.text((6, y + 6), f"#{k} {r['番号']} {r['id'][:8]}", fill='red', font=font)
        sh.paste(im, (0, y + 50)); y += im.size[1] + 50
    sh.save(os.path.join(out, f'wide{g//2+1:02d}.jpg'), quality=88)
print('wide', len(wide))
