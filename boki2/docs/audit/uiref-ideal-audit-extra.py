# 判定役：素案の主張が cites.tsv の外の画面（3人の台帳の同じ番号の別の画面）に頼っているかを見るため、指定の id を一覧の画像にする
# 使い方: python3 -I boki2/docs/audit/uiref-ideal-audit-extra.py <出力の jpg> <id8> [<id8> ...]
import os, sys, glob
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'research', 'raw', 'mobbin-mcp', 'screens')
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 34)
ids = sys.argv[2:]; CW, CH = 520, 1180
sh = Image.new('RGB', (CW * len(ids), CH + 50), 'white'); d = ImageDraw.Draw(sh)
for k, i in enumerate(ids):
    p = glob.glob(os.path.join(RAW, i + '*'))[0]
    im = Image.open(p).convert('RGB'); im.thumbnail((CW - 10, CH - 5))
    d.text((k * CW + 6, 6), i, fill='red', font=font); sh.paste(im, (k * CW + 5, 50))
sh.save(sys.argv[1], quality=85)
