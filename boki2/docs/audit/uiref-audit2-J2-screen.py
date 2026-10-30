# 事実の判定2（J2）：いまの画面の主張を、CSS・engine.js・撮った画像で確かめる（判定1の uiref-audit-css.py とは別に書いた）。
# 使い方: python3 -I boki2/docs/audit/uiref-audit2-J2-screen.py <shots のフォルダ>
# 1) font-size の宣言（規則の本体の中、コメントと属性セレクタの中の文字は除く）の値の種類。書かれたまま／px（rem・em を16倍）
# 2) 幅48em未満の決まりの中の .r-band 系の字（rem を px に）と、文字の大きさの設定 125%・150% のときの値
# 3) engine.js の textScale の行
# 4) w26〜w60 の帯の下の線：x=2・x=195・x=388 の3列で、上から見て y=150〜260 で色の差が30を超える最初の y
import os, re, sys
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
decl = []
for f in ['style.css', 'sim.css', 'ramen.css']:
    t = open(os.path.join(ROOT, 'css', f), encoding='utf-8').read()
    t = re.sub(r'/\*.*?\*/', '', t, flags=re.S)
    t = re.sub(r'\[[^\]]*\]', '[]', t)          # 属性セレクタの中身を消す
    for m in re.finditer(r'(?<=[{;\s])font-size\s*:\s*([^;}{]+)', t):
        decl.append((f, m.group(1).strip()))
def px(v):
    v = v.replace('!important', '').strip()
    m = re.fullmatch(r'([\d.]+)(rem|em|px)', v)
    return f'{float(m.group(1)) * (16 if m.group(2) != "px" else 1):g}px' if m else v
raw = sorted(set(v for _, v in decl)); nrm = sorted(set(px(v) for v in raw))
print('1) font-size の宣言', len(decl), '回・値の種類 書かれたまま', len(raw), '・px にそろえて', len(nrm))
print('   ファイルごと:', {f: len([1 for g, _ in decl if g == f]) for f in ['style.css', 'sim.css', 'ramen.css']})
print('   px にそろえない値:', [v for v in nrm if not v.endswith('px')])
t = open(os.path.join(ROOT, 'css', 'ramen.css'), encoding='utf-8').read()
i = t.find('@media (max-width: 47.99em)'); body = t[i:t.find('\n}', i)]
print('2) 幅48em未満の .r- の字（100%／125%／150%）')
for sel, b in re.findall(r'([^{}]+)\{([^{}]*)\}', body):
    fs = re.search(r'font-size:\s*([\d.]+)rem', b)
    if fs and '.r-' in sel:
        r = float(fs.group(1)); print(f'   {sel.strip()[:60]:60s} {r*16:g}px／{r*20:g}px／{r*24:g}px')
eng = open(os.path.join(ROOT, 'js', 'sim', 'engine.js'), encoding='utf-8').read().split('\n')
print('3) engine.js:', [(n + 1, l.strip()[:120]) for n, l in enumerate(eng) if 'function applyScale' in l],
      [n + 1 for n, l in enumerate(eng) if 'data-tscale' in l and '[100, 125, 150]' in l])
shots = sys.argv[1]
print('4) 帯の下の線（x=2／195／388）')
for k in range(26, 61):
    p = os.path.join(shots, f'w{k:02d}.png')
    if not os.path.exists(p): print(f'   w{k} なし'); continue
    im = Image.open(p).convert('RGB'); w, h = im.size; ys = []
    for x in (2, w // 2, w - 2):
        prev = None; hit = None
        for y in range(140, 270):
            c = im.getpixel((x, y))
            if prev is not None and sum(abs(a - b) for a, b in zip(c, prev)) > 30 and y >= 150: hit = y; break
            prev = c
        ys.append(hit)
    print(f'   w{k} {w}x{h} y={ys} ({ys[0] / h * 100:.1f}%)' if ys[0] else f'   w{k} {w}x{h} y={ys}')
