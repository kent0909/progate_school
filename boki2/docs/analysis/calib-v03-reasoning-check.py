#!/usr/bin/env python3
# BIZ-CALIB 版0.3 の論証の再検査（docs/audit/BIZ-CALIB-v02-reasoning.md の「版0.3の再検査」の章）の検算と感度。
# 使い方：python3 -I boki2/docs/analysis/calib-v03-reasoning-check.py > boki2/docs/analysis/calib-v03-reasoning-check.md
# 原文（research/raw、git に入れない）は GD Freak の中華そばの月別だけを読む。ほかは報告 G3 の (a) の値をそのまま使い、(c) の値を格子で動かす。
import itertools, os, re, html, statistics as st

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'research', 'raw')
out = []
def p(*a): out.append(' '.join(str(x) for x in a))
p('# BIZ-CALIB 版0.3 の論証の再検査：検算と感度（calib-v03-reasoning-check.py の出力。手で書き換えない）\n')

BASE = 1096.0          # 客単価の基準（報告 M23）
CM, DAYS = 0.60, 26    # 限界利益率・営業日数（報告の置き値）
def profit(n, price, tsubo, rent, wage, part, owner, other):
    fixed = tsubo * rent + wage * 8 * DAYS * part + owner + other
    return n * price * CM * DAYS - fixed, fixed
def bep(price, tsubo, rent, wage, part, owner, other):
    _, f = profit(0, price, tsubo, rent, wage, part, owner, other)
    return f / (price * CM) / DAYS

# ---------- R1. 銀座で1日100人は赤字か：(c) の値を格子で動かす ----------
p('## R1. 銀座の1階で1日100人は赤字か（(c) の固定費の形と値付けを格子で動かす）\n')
p('動かした値：広さ 10・12・15・18坪／家賃 30,246（銀座の飲食店可）・34,830（銀座の1階）・42,497円/坪（飲食店ドットコムの銀座駅）／時給 1,280×1.0・1.1・1.2／パート 1・1.5・2・3人／店主の報酬 20・25・30・40万／その他 15・20・25・30万／値段の地域の比 0.98（中華料理店の関東ブロック）・0.84（小売物価の東京都区部）／値付け ×1.0・1.1・1.2・1.4。家賃の3つは (a)、ほかは (c)。\n')
G = list(itertools.product([10, 12, 15, 18], [30246, 34830, 42497], [1.0, 1.1, 1.2], [1, 1.5, 2, 3], [200000, 250000, 300000, 400000],
                           [150000, 200000, 250000, 300000], [0.98, 0.84], [1.0, 1.1, 1.2, 1.4]))
loss = lambda g: profit(100, BASE * g[6] * g[7], g[0], g[1], 1280 * g[2], g[3], g[4], g[5])[0] < 0
n = len(G); k = sum(1 for g in G if loss(g))
p(f'- 組み合わせ {n:,} 通りのうち、1日100人で赤字は **{k:,}（{k/n*100:.0f}%）**。')
for pm in [1.0, 1.1, 1.2, 1.4]:
    sub = [g for g in G if g[7] == pm]; kk = sum(1 for g in sub if loss(g))
    p(f'  - 値付け ×{pm}：{kk/len(sub)*100:.0f}% が赤字')
for pt in [1, 1.5, 2, 3]:
    sub = [g for g in G if g[3] == pt]; kk = sum(1 for g in sub if loss(g))
    p(f'  - パート {pt}人：{kk/len(sub)*100:.0f}% が赤字')
p(f'- 報告の銀座の行（12坪・34,830・×1.2・3人・30万・30万・0.98・×1.0）は {"赤字" if loss((12,34830,1.2,3,300000,300000,0.98,1.0)) else "黒字"}。同じ行でパート1.5人なら {profit(100, BASE*0.98, 12, 34830, 1280*1.2, 1.5, 300000, 300000)[0]:+,.0f}円、パート1人なら {profit(100, BASE*0.98, 12, 34830, 1280*1.2, 1, 300000, 300000)[0]:+,.0f}円。\n')

# ---------- R2. 過疎の町で1日30人は黒字か ----------
p('## R2. 過疎の町（奥多摩の型）で1日30人は黒字か\n')
p('動かした値：広さ 10・15・20坪／家賃 0（自己所有）・3,000・5,000・8,000円/坪／パート 0・0.5・1・1.5人／店主の報酬 10・15・20・25万／その他 8・12・15・20・25万／値段の比 0.89（秋田市、報告の置き値）・1.00（全国の平均）・1.20（八王子市、奥多摩に近い市）。時給は東京 1,280円（奥多摩は東京都）。すべて (c)。\n')
R = list(itertools.product([10, 15, 20], [0, 3000, 5000, 8000], [0, 0.5, 1, 1.5], [100000, 150000, 200000, 250000], [80000, 120000, 150000, 200000, 250000], [0.89, 1.0, 1.2]))
win = lambda g: profit(30, BASE * g[5], g[0], g[1], 1280, g[2], g[3], g[4])[0] > 0
n = len(R); k = sum(1 for g in R if win(g))
p(f'- 組み合わせ {n:,} 通りのうち、1日30人で黒字（店主の報酬を払った後）は **{k:,}（{k/n*100:.0f}%）**。')
for pt in [0, 0.5, 1, 1.5]:
    sub = [g for g in R if g[2] == pt]; kk = sum(1 for g in sub if win(g))
    p(f'  - パート {pt}人：{kk/len(sub)*100:.0f}% が黒字')
for rt in [0, 3000, 5000, 8000]:
    sub = [g for g in R if g[1] == rt and g[2] == 0]; kk = sum(1 for g in sub if win(g))
    p(f'  - パート0人・家賃 {rt:,}円/坪：{kk/len(sub)*100:.0f}% が黒字')
# 家族の労働を値付けする（家族1人がパート1人分を最低賃金で働いたとみなす）
fam = [g for g in R if g[2] == 0]
kf = sum(1 for g in fam if profit(30, BASE * g[5], g[0], g[1], 1280, 1.0, g[3], g[4])[0] > 0)
p(f'- パート0人の組み合わせで、家族1人の労働を最低賃金のパート1人分として費用に入れると、黒字は {kf/len(fam)*100:.0f}%（入れないときは {sum(1 for g in fam if win(g))/len(fam)*100:.0f}%）。')
p(f'- 報告の過疎の行（15坪・家賃0・パート0・店主15万・その他12万・値段0.89）を東京の時給のままにしても、パート0なので +{profit(30, BASE*0.89, 15, 0, 1280, 0, 150000, 120000)[0]:,.0f}円。家族1人を最低賃金で数えると {profit(30, BASE*0.89, 15, 0, 1280, 1.0, 150000, 120000)[0]:+,.0f}円。\n')

# ---------- R3. 同じ固定費の形のまま、地域の (a) の値だけ変えると、例は両方成り立つか ----------
p('## R3. 固定費の形を地域で同じにしたまま、家賃・時給・値段だけ変えると、2つの例は同時に成り立つか\n')
p('形（広さ・パート・店主の報酬・その他）を共通にし、銀座は家賃34,830・時給1,280・値段0.98、過疎は家賃0〜8,000・時給1,280・値段0.89〜1.20。\n')
both = tot = 0; ex = None
for tsubo, part, owner, other in itertools.product([10, 12, 15, 18], [0, 0.5, 1, 1.5, 2, 3], [100000, 150000, 200000, 250000, 300000], [80000, 120000, 150000, 200000, 250000, 300000]):
    for rr, pr in itertools.product([0, 3000, 5000, 8000], [0.89, 1.0, 1.2]):
        tot += 1
        a = profit(100, BASE * 0.98, tsubo, 34830, 1280, part, owner, other)[0] < 0
        b = profit(30, BASE * pr, tsubo, rr, 1280, part, owner, other)[0] > 0
        if a and b: both += 1; ex = ex or (tsubo, part, owner, other, rr, pr)
p(f'- {tot:,} 通りのうち、銀座100人が赤字かつ過疎30人が黒字は **{both}（{both/tot*100:.1f}%）**。同じ形のままでは、2つの例は{"ほぼ" if both/tot < 0.02 else ""}同時に成り立たない（銀座で赤字になるほど固定費が重い形は、過疎でも30人で赤字）。例：{ex}\n')

# ---------- R4. 7倍の開きの分け方 ----------
p('## R4. 分岐点の「約7倍」の開きのうち、(a) の値（家賃・時給）から来る分\n')
shape = (15, 1.5, 250000, 200000)
def be_reg(rent, wage, price): return bep(BASE * price, shape[0], rent, wage, shape[1], shape[2], shape[3])
hi = be_reg(34830, 1280, 0.98); lo_a = be_reg(16316, 1195, 0.98)
p(f'- 共通の形（15坪・パート1.5・店主25万・その他20万）で、(a) の家賃のある地域の最大（銀座の1階 34,830・東京 1,280円）と最小（栄 16,316・愛知 1,195円）：{hi:.0f}人 と {lo_a:.0f}人、**{hi/lo_a:.2f}倍**。')
for rr in [8000, 5000, 0]:
    p(f'- 同じ形で家賃を (c) の {rr:,}円/坪（宮城の時給1,098）にすると {be_reg(rr, 1098, 0.98):.0f}人 → 銀座との比 {hi/be_reg(rr, 1098, 0.98):.2f}倍')
p(f'- 報告の表の 118÷17＝{118/17:.1f}倍のうち、(a) の値だけで説明できるのは約{hi/lo_a:.1f}倍。残りは (c) の家賃（地方・郊外・過疎）と固定費の形。\n')

# ---------- R5. 中華そば（外食）の月の支出：1日あたり・趨勢を除いた月の順位（2023〜2025年） ----------
p('## R5. 中華そば（外食）の月の支出（家計調査、二人以上の世帯）：1日あたりにし、年の趨勢を除いた月の順位\n')
f = os.path.join(ROOT, 'web', 'ramen', 'r5-rmn-gdfreak-chukasoba1.html')
if os.path.exists(f):
    t = open(f, 'rb').read().decode('utf-8', 'replace')
    t = html.unescape(re.sub(r'<[^>]+>', ' ', t)); t = re.sub(r'\s+', ' ', t)
    V = {}
    for m in re.finditer(r'(20\d\d)年(\d{1,2})月 ([\d,]+) -?[\d.]+ -?[\d.]+', t):
        V[(int(m.group(1)), int(m.group(2)))] = int(m.group(3).replace(',', ''))
    import calendar
    keys = sorted(V)
    per = {k: V[k] / calendar.monthrange(*k)[1] for k in keys}
    # 中心化した12か月移動平均で趨勢を除く（端の6か月は除外）
    ser = [per[k] for k in keys]
    rel = {}
    for i in range(6, len(keys) - 6):
        ma = (sum(ser[i - 6:i + 6]) + sum(ser[i - 5:i + 7])) / 24
        rel[keys[i]] = ser[i] / ma
    p(f'- 月の数 {len(keys)}（{keys[0]}〜{keys[-1]}）。趨勢を除けるのは {min(rel)}〜{max(rel)}（{len(rel)}か月）。\n')
    p('| 月 | 1日あたり（各年） | 趨勢を除いた比（各年） | 比の平均 |'); p('|---|---|---|---|')
    avg = {}
    for mo in range(1, 13):
        ds = [f'{y}:{per[(y, mo)]:.1f}' for y in (2023, 2024, 2025) if (y, mo) in per]
        rs = [rel[(y, mo)] for y in (2023, 2024, 2025) if (y, mo) in rel]
        avg[mo] = st.mean(rs) if rs else None
        p(f'| {mo}月 | {" ".join(ds)} | {" ".join(f"{x:.3f}" for x in rs)} | {avg[mo]:.3f} |' if rs else f'| {mo}月 | {" ".join(ds)} | — | — |')
    order = sorted((v, m) for m, v in avg.items() if v)
    p(f'\n- 趨勢を除いた比の低い順：' + '、'.join(f'{m}月 {v:.3f}' for v, m in order[:5]) + '。高い順：' + '、'.join(f'{m}月 {v:.3f}' for v, m in order[::-1][:4]))
    yr = {}
    for y in (2023, 2024, 2025):
        ms = [m for m in range(1, 13) if (y, m) in per]
        lo = sorted(ms, key=lambda m: per[(y, m)])[:3]
        yr[y] = lo
    p('- 1日あたりの値（趨勢を除かない）の低い3か月：' + '、'.join(f'{y}年 {yr[y]}' for y in yr))
    p('- 年の伸び（同じ月の前年比の平均）：' + '、'.join(f'{y}年 {st.mean([V[(y,m)]/V[(y-1,m)]-1 for m in range(1,13) if (y,m) in V and (y-1,m) in V])*100:+.1f}%' for y in (2024, 2025)))
    p('\n読み：1年の中で趨勢が+10%前後あると、年の初め（1〜2月）が低く、年の終わりが高く出る。「谷」の月は、1日あたりにし趨勢を除いた比で見る。家計の支出で、店の売上・場所（どこで食べたか）は測らない。\n')
else: p('原文なし\n')

# ---------- R6. 報告の感度の数と、スクリプトの出力の食い違い ----------
p('## R6. G3 の感度：報告の本文の数とスクリプト（calib-v03.md の G）の出力\n')
P = BASE * 1247.4 / 1269.2
def be_u(**kw):
    d = dict(tsubo=15, rent=19395, wage=1280, part=1.5, owner=250000, other=200000, pm=1.0); d.update(kw)
    return bep(P * d['pm'], d['tsubo'], d['rent'], d['wage'], d['part'], d['owner'], d['other'])
b0 = be_u()
p(f'- 上野・浅草の行の分岐点 {b0:.1f}人（報告の表の68人と同じ）。calib-v03.md の感度の表は「基準 87」で、これは渋谷の行（SHAPES[2]）。')
p('| 変えたもの | 上野・浅草の行で計算した比（報告の本文の数と一致） |'); p('|---|---|')
for lab, kw in [('家賃0', dict(rent=0)), ('パート0', dict(part=0)), ('パート3人', dict(part=3)), ('店主の報酬0', dict(owner=0)), ('店主40万', dict(owner=400000)), ('家賃を銀座の1階', dict(rent=34830)), ('値段×1.2', dict(pm=1.2)), ('10坪', dict(tsubo=10))]:
    p(f'| {lab} | {be_u(**kw)/b0:.2f} |')
p('\n報告の本文（G3）の比は上野・浅草の行で正しいが、報告が指すスクリプトの出力は渋谷の行で、ラベルも「パート1.5→3人」「店主の報酬25万→」と渋谷の値（2人・30万）に合わない。\n')

# ---------- R7. 150人以上の店の平均「約330人」 ----------
p('## R7. 「150人以上（11.8%）の平均は約330人」の逆算\n')
sh = [13.2, 15.4, 14.0, 11.8, 6.6, 6.6, 3.7, 11.8]
for lab, mids in [('階級の中央', [10, 25, 35, 45, 55, 70, 90, 125]), ('階級の下の端', [0, 20, 30, 40, 50, 60, 80, 100]), ('階級の上の端', [19, 29, 39, 49, 59, 79, 99, 149])]:
    s = sum(a * b for a, b in zip(sh, mids)); rest = (84.7 * 94.9 - s) / 11.8
    p(f'- {lab}で置く：150人以上の平均 {rest:.0f}人')
p('- 平均84.7人は不詳を除いた施設の平均とみた（94.9%）。不詳を含む全体の平均なら値は変わる。いずれにせよ150人以上の階級の中は表から分からず、「尾が長い」の大きさは階級の中の置き方で200人台〜300人台に動く。\n')

print('\n'.join(out))
