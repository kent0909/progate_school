# 事実の判定2（J2）：uC-cui-chart-akhakim の数字のカード4枚を、カードごとに切り出して原寸（800x600）でコマの差を測る。
# R3 の uiref-motion-measure.py は全画面を幅160px に縮めて測るため、終わりのゆっくりの数字の転がり（ease-out）を拾えるかを確かめる。
# 使い方: python3 -I boki2/docs/audit/uiref-audit2-J2-akhakim.py [確かめ用のコマの一覧を書き出すフォルダ]
# 決まり：カードの数字と % の欄（数字の欄）と、グラフの欄（線と点）を分ける。差が 12 を超える画素が 15 画素以上のコマを「動いた」。
# 始まり＝最初に動いたコマ、終わり＝最後に動いたコマ（すき間 300ms 以下は同じ区間）。しきい値は R3 と同じ 12、画素の数だけ変えた。
import os, sys, subprocess
import numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
V = os.path.join(ROOT, 'research', 'raw', 'web', 'uiref', 'uC-cui-chart-akhakim_video.html')
W, H, FPS = 800, 600, 30
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', V, '-pix_fmt', 'gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
n = len(raw) // (W * H)
fr = np.frombuffer(raw[:n * W * H], dtype=np.uint8).reshape(n, H, W).astype(np.int16)
print('コマ', n, '（30fps、1コマ 33ms）')
# カードの左上 (x, y)。数字の欄 = (x+10..x+110, y+40..y+80)、グラフの欄 = (x+120..x+255, y+30..y+115)
CARDS = {'1 mobbin（左上）': (130, 120), '2 acme（右上）': (410, 120), '3 nova（左下）': (130, 315), '4 studio（右下）': (410, 315)}
def runs(mask, gap):
    idx = np.where(mask)[0]; out = []
    for i in idx:
        if out and i - out[-1][1] <= gap: out[-1][1] = i
        else: out.append([i, i])
    return out
for name, (x, y) in CARDS.items():
    for part, (x0, x1, y0, y1) in {'数字': (x+10, x+110, y+40, y+80), 'グラフ': (x+120, x+255, y+30, y+115)}.items():
        roi = fr[:, y0:y1, x0:x1]
        d = (np.abs(np.diff(roi, axis=0)) > 12).sum(axis=(1, 2))
        mv = np.concatenate([[False], d >= 15])
        rs = [r for r in runs(mv, 9) if r[1] - r[0] >= 2]
        txt = ' / '.join(f'{int(a*1000/FPS)}〜{int(b*1000/FPS)}ms（コマ {a}〜{b}、{int((b-a+1)*1000/FPS)}ms）' for a, b in rs)
        print(f'カード{name} {part}: {txt or "なし"}')
if len(sys.argv) > 1:
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for name, (x, y) in CARDS.items():
        k = name.split()[0]
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', V, '-vf',
                        f"crop=260:120:{x}:{y},drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='f%{{n}}':x=200:y=5:fontsize=16:fontcolor=red,tile=10x31",
                        '-frames:v', '1', os.path.join(out, f'akhakim_card{k}_all.png')], check=True)
    print('コマの一覧:', out)
