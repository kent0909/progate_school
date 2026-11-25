# 判定役：文書の表のうち出力の表と同じ形のものを全行・全列で突き合わせる（抜き取りの足し）。
# (1) BIZ 4.1（25行）と count.txt §6、(2) BIZ 2.2（7行）と count §2、(3) BIZ 2.4（7行）と count §3、(4) KOJO 2.1（25行）と factsk.txt、(5) ADD1 1.1（25行）と factsk.txt
import re, os
H = os.path.dirname(os.path.abspath(__file__)); B = os.path.join(H, '..', '..', '..')
rd = lambda p: open(os.path.join(B, p), encoding='utf-8').read().split('\n')
cells = lambda l: [c.strip() for c in l.strip().strip('|').split('|')]
def rows_after(lines, head_pat, n):
    for i, l in enumerate(lines):
        if re.search(head_pat, l):
            out = [cells(x) for x in lines[i + 2:i + 2 + n]]
            return out
    raise SystemExit('見出しなし ' + head_pat)
norm = lambda s: s.replace(',', '').replace('工業地域', '工業').replace('準工業地域', '準工').replace('工業専用地域', '工専').replace('商業地域', '商業')
def cmp(name, A, Bm, mapA, mapB):
    bad = 0; tot = 0
    for a, b in zip(A, Bm):
        for ia, ib in zip(mapA, mapB):
            tot += 1
            if norm(a[ia]) != norm(b[ib]):
                bad += 1; print(f'  {name} 食い違い：{a[1]} 列{ia} 文書「{a[ia]}」 出力「{b[ib]}」')
    print(f'{name}：{len(A)}行×{len(mapA)}列＝{tot} セル、食い違い {bad}')
biz = rd('docs/BIZ-RAMENCOUNT23.md'); cnt = rd('docs/analysis/ramencount23/out/count.txt')
A = rows_after(biz, r'^\| # \| 町 \| 区 \| 駅（段）', 25); C = rows_after(cnt, r'^\| # \| 町 \| 区 \| 駅（段）', 25)
cmp('BIZ 4.1 対 count §6', A, C, list(range(0, 6)) + list(range(6, 15)), list(range(0, 6)) + list(range(7, 16)))
A = rows_after(biz, r'^\| 段 \| 駅 \| foot の中央', 7); C = rows_after(cnt, r'^\| 段 \| 駅 \| foot の中央', 7)
cmp('BIZ 2.2 対 count §2', A, C, list(range(12)), list(range(12)))
A = rows_after(biz, r'^\| 段 \| 候補地 \| OSM 100m', 7); C = rows_after(cnt, r'^\| 段 \| 候補地 \| 100m 0軒', 7)
cmp('BIZ 2.4 対 count §3（100m・200m・300m・設計の期待）', A, C, [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4, 7])
fk = rd('docs/analysis/stationmap-kojo-draft/out/factsk.txt'); F = rows_after(fk, r'^\| id \| 町 \| 駅（段）', 25)
kj = rd('docs/DESIGN-STATIONMAP-KOJO.md'); K = rows_after(kj, r'^\| 町 \| 駅（段） \| 歩き \| zone', 25)
# KOJO 2.1：町 駅 歩き zone 地価 day food 従業者 夜間 1000人 ラーメン R1 R4 R3 ／ factsk：id 町 駅 歩き zone 地価 day food 従業者 夜間 宿泊飲食 1000人 ラーメン R1 R4 R3 R5
K2 = [[''] + r for r in K]
cmp('KOJO 2.1 対 factsk', K2, F, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15])
ad = rd('docs/CODEX-TASK-stationmap-sim-2-ADD1.md'); D = rows_after(ad, r'^\| id \| 町 \| 従業者 W', 25)
fnum = lambda s: s if s in ('—', '') else str(float(s.replace(',', '')))
D2 = [[r[0], r[1], r[2], r[3], fnum(r[4])] + r[5:] for r in D]; F2 = [[r[0], r[1], r[8], r[9], fnum(r[11])] + r[13:17] for r in F]
cmp('ADD1 1.1 対 factsk', D2, F2, list(range(9)), list(range(9)))
