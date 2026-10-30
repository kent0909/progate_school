# 事実の判定（BIZ-UIREF）用：いまの画面についての主張を、CSS と撮った画像で自分で確かめる。
# 使い方: python3 -I boki2/docs/audit/uiref-audit-css.py <shots のフォルダ>
# 1) font-size の値の種類（書かれたまま／px にそろえて）を style.css・sim.css・ramen.css から数える（統合のスクリプトとは別に書いた）
# 2) 幅 48em 未満の決まりで、上部の帯（.r-band の中）の字の大きさを全部拾う
# 3) w*.png の左端の列で、上部の帯の下の線の y を探す
import os, re, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
vals = []
for f in ['style.css', 'sim.css', 'ramen.css']:
    t = open(os.path.join(ROOT, 'css', f), encoding='utf-8').read()
    t = re.sub(r'/\*.*?\*/', '', t, flags=re.S)
    for m in re.finditer(r'font-size\s*:\s*([^;}{]+)', t):
        vals.append((f, m.group(1).strip()))
raw = sorted(set(v for _, v in vals))
def px(v):
    v = v.replace('!important', '').strip()
    m = re.fullmatch(r'([\d.]+)(rem|em|px)', v)
    if not m: return v
    n = float(m.group(1)) * (16 if m.group(2) in ('rem', 'em') else 1)
    return f'{n:g}px'
norm = sorted(set(px(v) for v in raw))
print('font-size の書かれた回数', len(vals), ' 値の種類（書かれたまま）', len(raw), ' px にそろえて', len(norm))
print('  そろえられない値（calc・clamp・inherit など）:', [v for v in norm if not v.endswith('px')])

t = open(os.path.join(ROOT, 'css', 'ramen.css'), encoding='utf-8').read()
m = re.search(r'@media \(max-width: 47\.99em\) \{(.*?)\n\}', t, re.S)
print('\n幅 48em 未満（ramen.css）の font-size:')
for sel, body in re.findall(r'([^{}]+)\{([^{}]*)\}', m.group(1)):
    fs = re.search(r'font-size:\s*([^;]+)', body)
    if fs: print('  ', sel.strip(), '→', fs.group(1).strip(), '=', px(fs.group(1).strip()))

shots = sys.argv[1] if len(sys.argv) > 1 else '.'
print('\n上部の帯の下の線（左端 x=2 の列で、色の差が30を超える最初の y が 150〜260 の所）:')
for i in range(1, 61):
    p = os.path.join(shots, f'w{i:02d}.png')
    if not os.path.exists(p): continue
    im = Image.open(p).convert('RGB'); w, h = im.size
    prev = None; hit = None
    for y in range(0, min(h, 400)):
        c = im.getpixel((2, y))
        if prev is not None and sum(abs(a - b) for a, b in zip(c, prev)) > 30 and 150 <= y <= 260:
            hit = y; break
        prev = c
    print(f'  w{i:02d} {w}x{h} 帯の線 y={hit}' + (f' ({hit / h * 100:.1f}%)' if hit else ''))
