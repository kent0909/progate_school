# R3（BRIEF-UIREF-REREAD）：Collect UI の動画8本（research/raw/web/uiref/uC-cui-*_video.html。拡張子は html だが中身は MP4）の
# 動きの長さを、コマの差分で測る。目で見た長さは書かない。
#
# 使い方:
#   python3 -I boki2/docs/analysis/uiref-motion-measure.py                 # 表を出す
#   python3 -I boki2/docs/analysis/uiref-motion-measure.py --sheets <dir>  # 区間の始まり・終わりの前後のコマを PNG に書き出す（確かめ用）
#   python3 -I boki2/docs/analysis/uiref-motion-measure.py --timeline      # 50ms ごとの動きの量も出す
#   --only <名前,名前>  で動画を絞る。--sens で しきい値を変えた結果も出す
#
# 測り方（決まり）:
# 1. ffprobe でコーデック・幅・高さ・コマの速さ（r_frame_rate と avg_frame_rate が同じ＝固定）・コマ数・長さを読む。
# 2. ffmpeg で全コマを灰色・幅160px に縮めて読む（縦は元の比）。コマ i の時刻は i / fps（固定のコマの速さなので）。
#    読んだコマ数が ffprobe の nb_frames と合うかを確かめて出す。
# 3. 隣のコマとの差 |f[i] - f[i-1]| が 12（0〜255）を超える画素の割合を「動きの量」とする（圧縮の揺らぎを拾わないため 12）。
# 4. 動きの量が 0.2%（MOVE_FRAC）を超えるコマを「動いているコマ」とする。動いているコマの間のすき間が 100ms 以下なら同じ区間とみなす。
#    区間の始まり＝最初に動いたコマの時刻（その1つ前のコマから変わり始めた）、終わり＝最後に動いたコマの時刻。
#    長さ＝終わり − 始まり ＋ 1コマ（1/fps）。1コマだけの区間（ちらつき）は「1コマ」として残す。
# 5. 区間の中を「動きの量の山」に分ける：区間の中で、動きの量が区間の最大の 15%（SUB_FRAC）を下回るコマが 3コマ以上続く所で切る。
#    さらに「谷」で段に切る（3コマの中央値でならし、前後150msで一番低く、前と後に谷の2倍以上の山があるコマ）。
#    山ごとに、動いた画素の範囲（外接の四角、画面の % ）を出す。何が動いたかの言葉は、--sheets のコマを見て付ける（長さは付けない）。
# 6. 最後のコマと最初のコマの差を出す（繰り返しの動画か＝つなぎ目で動くか）。
# 7. 区間で動いた画素の外接の四角が幅・高さとも80%以上なら「画面のほぼ全体が動く」（カメラの寄り・引き・画面の送り）と印を付ける。
# 8. 1コマごとの差では拾えない、ゆっくりの薄れ・現れを、約100ms 離れたコマの差で探し、上の区間に重ならない物だけを出す。
# しきい値（12・0.2%・100ms・15%）は動画の中身を見る前に決めた。変えると長さが数コマ動く（--sens で 8/0.1% と 16/0.4% の結果も出す）。
import os, sys, json, subprocess
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
RAW = os.path.join(ROOT, 'research', 'raw', 'web', 'uiref')
VIDEOS = ['uC-cui-plusone-farzad', 'uC-cui-flags-jcbuilds', 'uC-cui-wallet-hollysem', 'uC-cui-wallet-moguz',
          'uC-cui-chara-fayazara', 'uC-cui-chara-benji', 'uC-cui-chart-akhakim', 'uC-cui-chart-sitenley']
PIX_T = 12
MOVE_FRAC = 0.002
GAP_MS = 100
SUB_FRAC = 0.15
W = 160


def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                          'stream=codec_name,width,height,r_frame_rate,avg_frame_rate,nb_frames,duration',
                          '-of', 'json', path], capture_output=True, text=True, check=True).stdout
    s = json.loads(out)['streams'][0]
    a = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_name',
                        '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip()
    num, den = s['r_frame_rate'].split('/')
    s['fps'] = float(num) / float(den)
    s['audio'] = a or 'なし'
    return s


def frames(path, w, h):
    hh = int(round(h * W / w / 2)) * 2
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={W}:{hh}', '-pix_fmt', 'gray',
                          '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
    n = len(raw) // (W * hh)
    return np.frombuffer(raw[:n * W * hh], dtype=np.uint8).reshape(n, hh, W).astype(np.int16), hh


def measure(fr, fps, pix_t=PIX_T, move_frac=MOVE_FRAC, lag=1):
    # lag=1：隣のコマとの差。lag>1：lag コマ離れたコマとの差（1コマごとの変化が小さい、ゆっくりの薄れ・現れを拾う）
    d = np.abs(fr[lag:] - fr[:-lag]) > pix_t          # d[k] は コマ k → k+lag
    frac = d.reshape(d.shape[0], -1).mean(axis=1)
    mov = np.where(frac > move_frac)[0] + 1          # 動いたコマの番号（変わった後のコマ）
    segs = []
    gap = max(1, int(round(GAP_MS / 1000 * fps)))
    for i in mov:
        if segs and i - segs[-1][1] <= gap:
            segs[-1][1] = i
        else:
            segs.append([i, i])
    out = []
    for a, b in segs:
        f = frac[a - 1:b]
        peak = f.max()
        # 山に分ける
        high = np.where(f >= peak * SUB_FRAC)[0]
        subs = []
        for k in high:
            if subs and k - subs[-1][1] <= 3:      # 低いコマが3コマ未満なら同じ山
                subs[-1][1] = k
            else:
                subs.append([k, k])
        # 山の中をさらに「谷」で切る：3コマの中央値でならした動きの量が、前後150msの中で一番低く、
        # かつ谷の前と後の両方に谷の2倍以上の山があるコマで切る（動きが続いたまま段が替わる所。例：満ちる→文字→紙吹雪）
        sm = np.array([np.median(f[max(0, k - 1):k + 2]) for k in range(len(f))])
        w = max(1, int(round(0.15 * fps)))
        cuts = []
        for k in range(1, len(f) - 1):
            lo, hi = max(0, k - w), min(len(f), k + w + 1)
            if sm[k] > 0 and sm[k] == sm[lo:hi].min() and sm[:k].max() >= 2 * sm[k] and sm[k + 1:].max() >= 2 * sm[k]:
                if not cuts or k - cuts[-1] > w:
                    cuts.append(k)
        split = []
        for s0, s1 in subs:
            cur = s0
            for c in cuts:
                if s0 < c < s1:
                    split.append([cur, c]); cur = c + 1
            split.append([cur, s1])
        subs = split
        sub_out = []
        for s0, s1 in subs:
            m = d[a - 1 + s0:a + s1].any(axis=0)
            ys, xs = np.where(m)
            bb = (round(100 * xs.min() / m.shape[1]), round(100 * ys.min() / m.shape[0]),
                  round(100 * (xs.max() + 1) / m.shape[1]), round(100 * (ys.max() + 1) / m.shape[0])) if len(xs) else None
            sub_out.append({'start_ms': round((a + s0) / fps * 1000), 'end_ms': round((a + s1) / fps * 1000),
                            'len_ms': round((s1 - s0 + 1) / fps * 1000), 'peak': round(float(f[s0:s1 + 1].max()) * 100, 1),
                            'bbox_pct': bb})
        m = d[a - 1:b].any(axis=0)
        ys, xs = np.where(m)
        whole = bool(len(xs)) and (xs.max() - xs.min() + 1) >= 0.8 * m.shape[1] and (ys.max() - ys.min() + 1) >= 0.8 * m.shape[0]
        out.append({'start_f': int(a), 'end_f': int(b), 'start_ms': round(a / fps * 1000), 'end_ms': round(b / fps * 1000),
                    'len_ms': round((b - a + 1) / fps * 1000), 'peak': round(float(peak) * 100, 1), 'subs': sub_out,
                    'whole': whole})
    loop = float((np.abs(fr[-1] - fr[0]) > pix_t).mean())
    return frac, out, loop


def main():
    args = sys.argv[1:]
    sheets = args[args.index('--sheets') + 1] if '--sheets' in args else None
    only = args[args.index('--only') + 1].split(',') if '--only' in args else None
    for v in VIDEOS:
        if only and v not in only:
            continue
        path = os.path.join(RAW, v + '_video.html')
        if not os.path.exists(path):
            print(f'■ {v}: 原文がない（{path}）'); continue
        s = probe(path)
        fr, hh = frames(path, s['width'], s['height'])
        fps = s['fps']
        print(f"■ {v}: {s['codec_name']} {s['width']}x{s['height']} {s['r_frame_rate']}（平均 {s['avg_frame_rate']}） "
              f"コマ {s['nb_frames']}（読んだ {len(fr)}） 長さ {float(s['duration'])*1000:.0f}ms 音 {s['audio']}")
        if s['audio'] != 'なし':
            # 音の有る所：ffmpeg の silencedetect（-40dB より小さい音が 30ms 以上続く所を無音）で、無音でない区間を出す
            log = subprocess.run(['ffmpeg', '-v', 'info', '-i', path, '-af', 'silencedetect=noise=-40dB:d=0.03', '-f', 'null', '-'],
                                 capture_output=True, text=True).stderr
            import re
            st = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', log)]
            en = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', log)]
            print(f"  音（-40dB 未満を無音）: 無音の始まり {[round(x*1000) for x in st]}ms・無音の終わり {[round(x*1000) for x in en]}ms")
        frac, segs, loop = measure(fr, fps)
        print(f"  最後と最初のコマの差（動いた画素の割合）: {loop*100:.1f}%  動いたコマ {int((frac > MOVE_FRAC).sum())}/{len(frac)}")
        for i, g in enumerate(segs, 1):
            print(f"  区間{i}: {g['start_ms']}〜{g['end_ms']}ms（コマ {g['start_f']}〜{g['end_f']}） 長さ {g['len_ms']}ms 最大 {g['peak']}%"
                  + ('  ※画面のほぼ全体（幅・高さとも80%以上）が動く' if g['whole'] else ''))
            for j, sb in enumerate(g['subs'], 1):
                print(f"    山{j}: {sb['start_ms']}〜{sb['end_ms']}ms 長さ {sb['len_ms']}ms 最大 {sb['peak']}% 範囲(x0,y0,x1,y1%) {sb['bbox_pct']}")
        small = [g['len_ms'] for g in segs if not g['whole']]
        print(f"  まとめ: 区間 {len(segs)}（うち画面のほぼ全体 {sum(g['whole'] for g in segs)}）。全体でない区間の長さ(ms): "
              + (f"中央値 {int(np.median(small))}・最小 {min(small)}・最大 {max(small)}・1コマだけ {sum(1 for x in small if x <= round(1000/fps)+1)}" if small else 'なし'))
        big = [g['len_ms'] for g in segs if g['peak'] >= 5]
        sm_ = sorted(g['len_ms'] for g in segs if g['peak'] < 5)
        print(f"  動きの量の最大で分けると: 5%以上 {len(big)}区間 {big} ／ 5%未満 {len(sm_)}区間"
              + (f" 中央値 {int(np.median(sm_))}ms・最大 {sm_[-1]}ms・1コマだけ {sum(1 for x in sm_ if x <= round(1000/fps)+1)}" if sm_ else ''))
        lag = max(2, int(round(0.1 * fps)))
        _, slow, _ = measure(fr, fps, lag=lag)
        fast_f = set()
        for g in segs:
            fast_f.update(range(g['start_f'] - lag, g['end_f'] + 1))
        only_slow = [g for g in slow if not any(k in fast_f for k in range(g['start_f'], g['end_f'] + 1))]
        print(f"  ゆっくりの変化（{lag}コマ＝約100ms 離れたコマの差）だけで見つかる区間: "
              + (' / '.join(f"{g['start_ms']}〜{g['end_ms']}ms(差の幅を含む)" for g in only_slow) if only_slow else 'なし'))
        if '--sens' in args:
            for pt, mf in [(8, 0.001), (16, 0.004)]:
                _, sg, _ = measure(fr, fps, pt, mf)
                print(f"  感度 {pt}/{mf*100:.1f}%: " + ' / '.join(f"{g['start_ms']}〜{g['end_ms']}ms({g['len_ms']})" for g in sg))
        if '--timeline' in args:
            step = max(1, int(round(0.05 * fps)))
            tl = [f"{frac[k:k+step].max()*100:.1f}" for k in range(0, len(frac), step)]
            print('  50msごとの最大の動き(%):', ' '.join(tl))
        if sheets:
            os.makedirs(sheets, exist_ok=True)
            pts = []
            for g in segs:
                for sb in g['subs']:
                    pts += [sb['start_ms'], sb['end_ms']]
            for t in sorted(set(pts)):
                for off in (-1, 0, 1):
                    k = int(round(t / 1000 * fps)) + off
                    if 0 <= k < s['nb_frames'] if isinstance(s['nb_frames'], int) else True:
                        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-vf', f"select=eq(n\\,{k}),scale=320:-2",
                                        '-frames:v', '1', os.path.join(sheets, f'{v}_{k:04d}.png')])


if __name__ == '__main__':
    main()
