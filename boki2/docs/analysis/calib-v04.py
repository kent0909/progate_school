#!/usr/bin/env python3
# BIZ-CALIB 0.4 で足した計算（版0.3への事実の再判定 BIZ-CALIB-v02-audit.md 8章と論証の再検査 BIZ-CALIB-v02-reasoning.md 11章への直し）。
# 使い方：python3 -I boki2/docs/analysis/calib-v04.py > boki2/docs/analysis/calib-v04.md
# 格子の範囲は自分で決めた（範囲の根拠は出力の表に書く）。検査役の格子（calib-v03-reasoning-check.py の R1〜R3）とは、
# 広さ・家賃（2025年度下期を足した）・パートの人数（0人を足した）・家族の労働（数えるか数えないかを別の変数にした）・
# 店主の報酬・その他の範囲が違う。
import itertools, os, re, statistics as st, subprocess, html, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..', 'research', 'raw')
def raw(*p): return os.path.join(ROOT, *p)
def pdftext(f): return subprocess.run(['pdftotext', '-layout', f, '-'], capture_output=True, text=True).stdout
out = []
def p(*a): out.append(' '.join(str(x) for x in a))
p('# BIZ-CALIB 0.4 の計算（calib-v04.py の出力。手で書き換えない）\n')

P0 = 1096   # 客単価の基準（calib-v03 の G：885.8円×1.237）
CM = 0.60   # 限界利益率（原価35%は公庫、変動費5%は (c)）
DAYS = 26
H = 8 * DAYS  # パート1人の月の時間
def fixed(tsubo, rent, wage, part, family, fam_cost, owner, other):
    return tsubo * rent + wage * H * part + (wage * H * family if fam_cost else 0) + owner + other
def profit(n, price, fx): return n * price * CM * DAYS - fx

# ---------- G1. 銀座の1階で1日100人は赤字か ----------
G = dict(tsubo=[10, 12, 15, 18], rent=[30246, 34830, 36250], up=[1.0, 1.1, 1.2], part=[0, 0.5, 1, 1.5, 2, 3],
         family=[0, 1], owner=[150000, 200000, 250000, 300000, 400000], other=[100000, 150000, 200000, 250000, 300000],
         pr=[0.845, 0.98, 1.0], mark=[1.0, 1.1, 1.2, 1.4])
p('## G1. 銀座の1階で1日100人は赤字か（格子）\n')
p('| 変数 | 置いた値 | 区分・範囲の根拠 |'); p('|---|---|---|')
p('| 広さ（坪） | 10・12・15・18 | (c)。公庫の中華料理店1〜4人の平均58.6㎡＝約18坪を上の端に、都心は狭い向き |')
p('| 家賃（円/坪） | 30,246（銀座の飲食店可 2024年度上期）・34,830（銀座の1階 同）・36,250（銀座の飲食店可 2025年度下期） | (a)。アットホームの2期 |')
p('| 時給 | 東京の最低賃金1,280円 ×1.0・1.1・1.2 | 最低賃金は (a)、上乗せは (c) |')
p('| パート（8時間×26日の人数） | 0・0.5・1・1.5・2・3 | (c)。0人（店主と家族だけ）も入れた |')
p('| 家族の手伝い（人） | 0・1（費用に数える場合は最低賃金で） | (c)。家族の労働の扱いを別の変数にした |')
p('| 店主の報酬（月） | 15・20・25・30・40万円 | (c) |')
p('| その他の固定費（月） | 10・15・20・25・30万円 | (c)。版0.3の較正（中央値の店で約19万円）を中ほどに |')
p('| 1杯の値段の地域の比 | 0.845（東京都区部、小売物価）・0.98（関東ブロック、中華料理店）・1.00 | (a)(b) |')
p('| 値付けの上乗せ | ×1.0・1.1・1.2・1.4 | (c) |\n')
rows = []
for t, r, u, pa, fa, ow, ot, pr, mk in itertools.product(*G.values()):
    for fc in (True, False):
        if fa == 0 and not fc: continue
        fx = fixed(t, r, 1280 * u, pa, fa, fc, ow, ot)
        rows.append(dict(tsubo=t, rent=r, up=u, part=pa, family=fa, fc=fc, owner=ow, other=ot, pr=pr, mark=mk,
                         loss=profit(100, P0 * pr * mk, fx) < 0))
n = len(rows); k = sum(x['loss'] for x in rows)
p(f'組み合わせ {n:,} 通りのうち、1日100人で赤字は **{k:,}（{k / n * 100:.0f}%）**。\n')
def share(key, val):
    s = [x for x in rows if x[key] == val]; return sum(x['loss'] for x in s) / len(s) * 100
p('| 条件 | 赤字の割合 |'); p('|---|---|')
for key, vals, lab in [('part', G['part'], 'パート'), ('mark', G['mark'], '値付け'), ('tsubo', G['tsubo'], '広さ'), ('rent', G['rent'], '家賃'), ('pr', G['pr'], '値段の比'), ('owner', G['owner'], '店主の報酬')]:
    for v in vals: p(f'| {lab} {v:,} | {share(key, v):.0f}% |')
p('')

# ---------- G2. 過疎の町（奥多摩の型）で1日30人は黒字か ----------
K = dict(tsubo=[10, 15, 20], rent=[0, 1500, 3000, 5000, 8000], part=[0, 0.5, 1, 1.5], family=[0, 1],
         owner=[100000, 150000, 200000, 250000], other=[80000, 120000, 150000, 200000, 250000], pr=[0.885, 1.0, 1.20])
p('## G2. 過疎の町（奥多摩の型）で1日30人は黒字か（格子）\n')
p('| 変数 | 置いた値 | 区分・範囲の根拠 |'); p('|---|---|---|')
p('| 広さ（坪） | 10・15・20 | (c) |')
p('| 家賃（円/坪） | 0（建物を自分で持つ）・1,500・3,000・5,000・8,000 | (c)。地方・過疎の賃料の資料は見つからない（やっていないこと） |')
p('| 時給 | 東京の最低賃金1,280円（奥多摩町は東京都） | (a) |')
p('| パート | 0・0.5・1・1.5 | (c) |')
p('| 家族の手伝い | 0・1人（費用に数える・数えないの2通り） | (c) |')
p('| 店主の報酬 | 10・15・20・25万円 | (c) |')
p('| その他の固定費 | 8・12・15・20・25万円 | (c) |')
p('| 1杯の値段の比 | 0.885（秋田市）・1.00・1.20（八王子市、奥多摩に近い市） | (a)、どの市を当てるかは (c) |\n')
rk = []
for t, r, pa, fa, ow, ot, pr in itertools.product(*K.values()):
    for fc in (True, False):
        if fa == 0 and not fc: continue
        fx = fixed(t, r, 1280, pa, fa, fc, ow, ot)
        rk.append(dict(tsubo=t, rent=r, part=pa, family=fa, fc=fc, owner=ow, other=ot, pr=pr, ok=profit(30, P0 * pr, fx) > 0))
n2 = len(rk); k2 = sum(x['ok'] for x in rk)
p(f'組み合わせ {n2:,} 通りのうち、1日30人で黒字（店主の報酬を払った後）は **{k2:,}（{k2 / n2 * 100:.0f}%）**。\n')
def share2(cond):
    s = [x for x in rk if cond(x)]; return sum(x['ok'] for x in s) / len(s) * 100
p('| 条件 | 黒字の割合 |'); p('|---|---|')
for v in K['part']: p(f'| パート {v} | {share2(lambda x: x["part"] == v):.0f}% |')
p(f'| パート0・家族の手伝いなし | {share2(lambda x: x["part"] == 0 and x["family"] == 0):.0f}% |')
p(f'| パート0・家族1人を費用に数えない | {share2(lambda x: x["part"] == 0 and x["family"] == 1 and not x["fc"]):.0f}% |')
p(f'| パート0・家族1人を最低賃金で費用に数える | {share2(lambda x: x["part"] == 0 and x["family"] == 1 and x["fc"]):.0f}% |')
for v in K['rent']: p(f'| 家賃 {v:,} | {share2(lambda x: x["rent"] == v):.0f}% |')
for v in K['pr']: p(f'| 値段の比 {v} | {share2(lambda x: x["pr"] == v):.0f}% |')
p('')

# ---------- G3. 固定費の形を地域で同じにしたまま、両方の例は同時に成り立つか ----------
p('## G3. 固定費の形（広さ・パート・家族・店主の報酬・その他・値付け）を地域で同じにし、家賃・時給・値段だけ変える\n')
shape = dict(tsubo=[10, 12, 15, 18], part=[0, 0.5, 1, 1.5, 2, 3], family=[0, 1], owner=[100000, 150000, 200000, 250000, 300000, 400000],
             other=[80000, 120000, 150000, 200000, 250000, 300000])
both = tot = 0; ex = None
for t, pa, fa, ow, ot in itertools.product(*shape.values()):
    for fc in (True, False):
        if fa == 0 and not fc: continue
        for rg, prg, mk in itertools.product(G['rent'], G['pr'], [1.0, 1.2]):
            gl = profit(100, P0 * prg * mk, fixed(t, rg, 1280, pa, fa, fc, ow, ot)) < 0
            for rkk, prk in itertools.product(K['rent'], K['pr']):
                tot += 1
                kk = profit(30, P0 * prk, fixed(t, rkk, 1280, pa, fa, fc, ow, ot)) > 0
                if gl and kk:
                    both += 1; ex = ex or (t, pa, fa, fc, ow, ot, rg, prg, mk, rkk, prk)
p(f'{tot:,} 通りのうち、銀座100人が赤字かつ過疎30人が黒字は **{both:,}（{both / tot * 100:.1f}%）**。')
p('（地域で同じ形のとき、銀座で100人でも赤字になるほど固定費が重い形は、家賃・値段が軽い過疎でも30人では赤字になる。）')
p(f'例：{ex}\n' if ex else '例：なし\n')
# 形を地域ごとに別に引いたとき
pg = k / n; pk = k2 / n2
p(f'形を地域ごとに別に置く（上の G1・G2 の格子から独立に1つずつ引く）と、両方が成り立つのは {pg * 100:.0f}%×{pk * 100:.0f}%＝**{pg * pk * 100:.0f}%**。\n')

# ---------- G4. 3段の倍率 ----------
p('## G4. 分岐点の開きを3段で（共通の形：15坪・パート1.5人・店主25万・その他20万・家族の手伝いなし・値付け×1.0）\n')
def be(rent, wage, pr): return fixed(15, rent, wage, 1.5, 0, False, 250000, 200000) / (P0 * pr * CM) / DAYS
hi = be(34830, 1280, 0.98); lo = be(16316, 1195, 0.96)
p(f'- (a) の家賃・時給だけ（銀座の1階 34,830・東京1,280円 と 栄 16,316・愛知1,195円、値段は中華料理店のブロックの比）：{hi:.0f}人 と {lo:.0f}人、**{hi / lo:.2f}倍**。')
hi2 = be(36250, 1280, 0.98)
p(f'- 2025年度下期の銀座の飲食店可（36,250）にすると {hi2:.0f}人、栄との比 {hi2 / lo:.2f}倍。')
for r in [8000, 5000, 0]:
    v = be(r, 1098, 0.94); p(f'- (c) の家賃 {r:,}円/坪（宮城の時給1,098円）：{v:.0f}人、銀座の1階との比 **{hi / v:.2f}倍**。')
p('- 固定費の形まで地域で変えると（版0.3の表）：過疎17人〜銀座の1階118人で約7倍。この段の開きは (c) の形の置き方の写し。\n')

# ---------- G5. 人の数を「売上に比例」で置く（センサスの W の比：売上1億円あたりパート8時間換算 6.8〜8.8人）。形は両地域で同じ ----------
p('## G5. パートの人数を売上に比例させる（経済センサス2016 の比、W の表：売上1億円あたりパート8h換算 東京6.81・全国7.86・宮城8.76）。ほかの形は地域で同じ\n')
p('人の厚さを (c) で地域ごとに置く代わりに、資料（県の単位で、売上あたりのパートは地域で差が小さい r＝+0.04）から「パートは売上に比例」を共通の形にした。銀座は100人/日、過疎は30人/日の売上でパートが決まる。\n')
G5 = dict(kp=[6.81, 7.86, 8.76], tsubo=[10, 15, 18], up=[1.0, 1.1, 1.2], family=[0, 1], owner=[150000, 200000, 250000, 300000],
          other=[100000, 150000, 200000, 250000], mark=[1.0, 1.1, 1.2, 1.4])
GZ = dict(rent=[30246, 34830, 36250], pr=[0.845, 0.98, 1.0]); OK = dict(rent=[0, 1500, 3000, 5000, 8000], pr=[0.885, 1.0, 1.2])
def prof5(n, rent, pr, kp, tsubo, up, family, fc, owner, other, mark):
    price = P0 * pr * mark; sales = n * price * DAYS
    part = kp * sales * 12 / 1e8
    return profit(n, price, fixed(tsubo, rent, 1280 * up, part, family, fc, owner, other)), part
tot = gl = ok = both = 0; ex = None; partsG = set(); partsO = set()
for kp, t, u, fa, ow, ot, mk in itertools.product(*G5.values()):
    for fc in ((True, False) if fa else (True,)):
        g = [prof5(100, r, pr, kp, t, u, fa, fc, ow, ot, mk) for r in GZ['rent'] for pr in GZ['pr']]
        o = [prof5(30, r, pr, kp, t, u, fa, fc, ow, ot, mk) for r in OK['rent'] for pr in OK['pr']]
        for a, pg in g:
            for b, po in o:
                tot += 1; gl += a < 0; ok += b > 0; both += (a < 0 and b > 0)
                partsG.add(round(pg, 2)); partsO.add(round(po, 2))
                if a < 0 and b > 0 and ex is None: ex = (kp, t, u, fa, fc, ow, ot, mk, round(a), round(b))
p(f'組み合わせ {tot:,} 通り（形 × 銀座の家賃・値段 × 過疎の家賃・値段）。銀座100人で赤字 {gl / tot * 100:.0f}%、過疎30人で黒字 {ok / tot * 100:.0f}%、**両方 {both / tot * 100:.1f}%**。')
p(f'パートの人数：銀座100人の店 {min(partsG):.2f}〜{max(partsG):.2f}人、過疎30人の店 {min(partsO):.2f}〜{max(partsO):.2f}人。')
p(f'両方が成り立つ例（パートの比・広さ・時給の上乗せ・家族・家族を費用に・店主・その他・値付け・銀座の損益・過疎の損益）：{ex}\n')
# 家族を数えるかで分けた割合
for lab, cond in [('家族なし', lambda fa, fc: fa == 0), ('家族1人・費用に数えない', lambda fa, fc: fa == 1 and not fc), ('家族1人・最低賃金で数える', lambda fa, fc: fa == 1 and fc)]:
    t2 = b2 = 0
    for kp, t, u, fa, ow, ot, mk in itertools.product(*G5.values()):
        for fc in ((True, False) if fa else (True,)):
            if not cond(fa, fc): continue
            for r in GZ['rent']:
                for pr in GZ['pr']:
                    a = prof5(100, r, pr, kp, t, u, fa, fc, ow, ot, mk)[0]
                    for r2 in OK['rent']:
                        for pr2 in OK['pr']:
                            b = prof5(30, r2, pr2, kp, t, u, fa, fc, ow, ot, mk)[0]
                            t2 += 1; b2 += (a < 0 and b > 0)
    p(f'- {lab}：両方 {b2 / t2 * 100:.1f}%')
p('')

# ---------- S. G3 の感度（上野・浅草の行を基準に。版0.3の本文の値を出力で確かめる） ----------
p('## S. 感度（上野・浅草の行：15坪・家賃19,395・時給1,280・パート1.5人・店主25万・その他20万・値段の比0.98）\n')
def be_s(tsubo=15, rent=19395, part=1.5, owner=250000, other=200000, mark=1.0):
    return fixed(tsubo, rent, 1280, part, 0, False, owner, other) / (P0 * 0.98 * mark * CM) / DAYS
b0 = be_s()
p('| 変えたもの | 分岐点の客数/日 | 基準との比 |'); p('|---|---|---|')
for lab, kw in [('基準', {}), ('家賃を銀座の1階 34,830', {'rent': 34830}), ('家賃を0（建物を自分で持つ）', {'rent': 0}), ('パート 1.5→3人', {'part': 3.0}),
                ('パート 1.5→0（家族で回す）', {'part': 0.0}), ('店主の報酬 25万→0', {'owner': 0}), ('店主の報酬 25万→40万', {'owner': 400000}),
                ('その他の固定費 20万→10万', {'other': 100000}), ('値段 ×1.2', {'mark': 1.2}), ('広さ 15→10坪', {'tsubo': 10})]:
    v = be_s(**kw); p(f'| {lab} | {v:.0f} | {v / b0:.2f} |')
p('')

# ---------- T. 季節：中華そばの月の支出を1日あたりにし、年の趨勢を除く（2023年1月〜2025年11月、GD Freak の表＝家計調査の転記） ----------
p('## T. 中華そば（外食）の月の支出：1日あたり・年の趨勢を除いた比（2023年1月〜2025年11月）\n')
import calendar
f = raw('web', 'ramen', 'r5-rmn-gdfreak-chukasoba1.html')
if os.path.exists(f):
    t = open(f, encoding='utf-8', errors='replace').read()
    t = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', '', t); t = html.unescape(re.sub(r'<[^>]+>', '\n', t))
    L = [l.strip() for l in t.split('\n') if l.strip()]
    ser = []
    for i, l in enumerate(L):
        m = re.match(r'(20\d\d)年(\d+)月$', l)
        if m and i + 1 < len(L) and re.fullmatch(r'[\d,]+', L[i + 1]):
            y, mo = int(m.group(1)), int(m.group(2)); ser.append(((y, mo), int(L[i + 1].replace(',', '')) / calendar.monthrange(y, mo)[1]))
    ser = sorted(dict(ser).items())
    vals = [v for _, v in ser]
    # 中心化した12か月移動平均（2×12）で趨勢を除く
    ratio = {}
    for i in range(6, len(vals) - 6):
        ma = (0.5 * vals[i - 6] + sum(vals[i - 5:i + 6]) + 0.5 * vals[i + 6]) / 12
        ratio.setdefault(ser[i][0][1], []).append(vals[i] / ma)
    p(f'月の数 {len(ser)}（{ser[0][0]}〜{ser[-1][0]}）。趨勢を除けたのは {sum(len(v) for v in ratio.values())} か月。\n')
    p('| 月 | 1日あたり（円、年ごと） | 趨勢を除いた比（年ごと） | 比の平均 |'); p('|---|---|---|---|')
    by = {}
    for (y, mo), v in ser: by.setdefault(mo, []).append(f'{y}:{v:.1f}')
    avg = {}
    for mo in range(1, 13):
        r_ = ratio.get(mo, []); avg[mo] = st.mean(r_) if r_ else None
        p(f'| {mo}月 | {" ".join(by.get(mo, []))} | {" ".join(f"{x:.3f}" for x in r_)} | {"" if avg[mo] is None else f"{avg[mo]:.3f}"} |')
    order = sorted((v, m) for m, v in avg.items() if v)
    p('\n低い順：' + '、'.join(f'{m}月 {v:.3f}' for v, m in order[:5]) + '。高い順：' + '、'.join(f'{m}月 {v:.3f}' for v, m in order[::-1][:4]) + '。\n')
    p('読み：1日あたり・趨勢を除くと、はっきり高いのは8月だけ。12月は低い側で、会社の記述（12月・1月が繁忙期）と食い違う。2月は日数の見かけを除くと谷ではない。家計の支出は世帯がどこで食べたかを測らない（帰省先・旅行先の支出を含む）。\n')

# ---------- U. 業界の月次（JF、麺類と気温） ----------
p('## U. 業界の月次：麺類（ファーストフードの内）の売上の前年比と、東京の平均気温の前年差（JF 外食産業市場動向調査、補填の担当が取得した12本）\n')
rowsU = []
for fn in sorted(os.listdir(raw('web', 'ramen'))):
    m = re.match(r'r6-fill-jf-(\d{4})(\d{2})\.pdf$', fn)
    if not m: continue
    t = pdftext(raw('web', 'ramen', fn)); lines = t.split('\n')
    pct = [l for l in lines if '(N=' in l and '%' in l]
    vals = [[float(x) for x in re.findall(r'(\d+\.\d)%', l)] for l in pct]
    if len(vals) < 5: continue
    allv, ff, men = vals[0][0], vals[1][0], vals[4][0]
    tm = re.findall(r'(20\d\d)年\s+(\d+)月\s+\d+日\s+\d+日\s+\d+日\s+([\d.]+)', t)
    if len(tm) < 2: continue
    dT = float(tm[-1][2]) - float(tm[-2][2])
    rowsU.append((f'{m.group(1)}-{m.group(2)}', allv, ff, men, float(tm[-1][2]), dT))
if rowsU:
    p('| 年月 | 外食全体 | ファーストフード計 | 麺類 | 麺類−FF計 | 東京の平均気温 | 前年差 |'); p('|---|---|---|---|---|---|---|')
    for ym, a, ff, men, T, dT in rowsU: p(f'| {ym} | {a}% | {ff}% | {men}% | {men - ff:+.1f} | {T} | {dT:+.1f} |')
    xs = [r[5] for r in rowsU]; ys = [r[3] - r[2] for r in rowsU]; Ts = [r[4] for r in rowsU]
    def corr(a, b):
        ma, mb = st.mean(a), st.mean(b)
        return sum((x - ma) * (y - mb) for x, y in zip(a, b)) / ((len(a) - 1) * st.stdev(a) * st.stdev(b))
    p(f'\n{len(rowsU)}か月。相関：「麺類−FF計」と気温の前年差 r＝{corr(xs, ys):+.2f}、「麺類−FF計」と平均気温の水準 r＝{corr(Ts, ys):+.2f}。前年比の表なので、何月が多いか（季節の山）は言えない。麺類はうどん・そばのチェーンを含みラーメン専業ではない。\n')

# ---------- V. その他 ----------
p('## V. その他の検算\n')
import openpyxl
f = raw('web', 'bizmgmt', 'r6-cal-estat-kouri-2025nen.xlsx')
if os.path.exists(f):
    wb = openpyxl.load_workbook(f); ws = [w for w in wb.worksheets if w.title.startswith('2102')][0]
    city = {}; alt = []
    for row in ws.iter_rows(min_row=1):
        name = row[8].value if len(row) > 10 else None; val = row[10].value if len(row) > 10 else None
        if isinstance(name, str) and isinstance(val, (int, float)) and name.endswith(('市', '区部')):
            city[name.strip()] = val
            if ')' in (row[10].number_format or ''): alt.append(name.strip())
    allv = list(city.values()); mu_all = st.mean(allv)
    keep = [v for k_, v in city.items() if k_ not in alt]; mu = st.mean(keep)
    p(f'- 小売物価統計の中華そば：{len(city)}市、セルの書式に別銘柄の印（a) 豚骨味）があるのは {alt}。全市の平均 {mu_all:.1f}円、別銘柄を除いた{len(keep)}市の平均 {mu:.1f}円・標準偏差 {st.stdev(keep):.1f}円。東京都区部の比 {city["東京都区部"] / mu:.3f}、名古屋市 {city["名古屋市"] / mu:.3f}、大阪市 {city["大阪市"] / mu:.3f}、秋田市 {city["秋田市"] / mu:.3f}、八王子市 {city["八王子市"] / mu:.3f}。')
    near = sorted(city, key=lambda c: abs(city[c] - mu))
    p(f'- 平均から100円以上離れた市：' + '、'.join(f'{c} {city[c]}' for c in city if abs(city[c] - mu) >= 100) + '。')
# 黒字の会社の割合（Y14）
p('- 中華料理店の「黒字かつ自己資本プラス」の会社の割合：2019年度 82/187＝44%、2021年度 33/137＝24%、2023年度 28/95＝29%、2025年度 47/109＝43%（D1b の表の社数の割り算）。')
# 150人以上の平均の置き方（Y18）
pc = [13.2, 15.4, 14.0, 11.8, 6.6, 6.6, 3.7, 11.8, 11.8]; bins = [(0, 20), (20, 30), (30, 40), (40, 50), (50, 60), (60, 80), (80, 100), (100, 150)]
for lab, pos in [('下の端', 0.0), ('中央', 0.5), ('上の端', 1.0)]:
    s_ = sum(x * (lo + (hi - 1 - lo) * pos if pos else lo) if False else x * (lo + (hi - lo) * pos) for (lo, hi), x in zip(bins, pc[:8]))
    v = (84.7 * sum(pc) - s_) / pc[8]
    p(f'- 150人以上の階級の平均の逆算（ほかの階級を{lab}で置く）：約{v:.0f}人')

# ---------- W. 地域で人の厚さ・家族の労働が違うか（肯定側の問い。経済センサス2016 第17表、ラーメン店・都道府県） ----------
import csv, io
f = raw('web', 'bizmgmt', 'r5-cal-estat-census2016-inshoku.html')
if os.path.exists(f):
    rows = list(csv.reader(io.StringIO(open(f, 'rb').read().decode('cp932', errors='replace'))))
    def num(x):
        try: return int(x)
        except ValueError: return 0
    PR = {}
    for r in rows:
        if len(r) > 25 and r[6].strip().endswith('7624 ラーメン店'):
            PR[r[3]] = dict(n=num(r[7]), per=num(r[8]), emp=num(r[9]), pt8=num(r[12]), sales=num(r[13]), n_i=num(r[14]), per_i=num(r[15]), emp_i=num(r[16]), n_c=num(r[20]), per_c=num(r[21]), emp_c=num(r[22]))
    p('## W. 地域で人の厚さ・家族の労働が違うか（経済センサス2016 第17表、7624 ラーメン店、都道府県。売上は2015年）\n')
    p('列：個人の店の割合、1店の従業者、1店のパート（8時間換算）、個人の店1店の「雇われていない人」（従業者−常用雇用者＝店主・家族・臨時。家族の労働の上の端の目安）、1店の年売上、従業者1人の年売上。\n')
    p('| 地域 | 店の数 | 個人の割合 | 1店の従業者 | 1店のパート8h換算 | 個人の店1店の雇われていない人 | 1店の年売上（万円） | 1人の年売上（万円） | 売上1億円あたりのパート8h換算 |')
    p('|---|---|---|---|---|---|---|---|---|')
    def line(k):
        d = PR[k]
        nonemp = (d['per_i'] - d['emp_i']) / d['n_i'] if d['n_i'] else float('nan')
        return (d['n_i'] / d['n'], d['per'] / d['n'], d['pt8'] / d['n'], nonemp, d['sales'] / d['n'] * 100, d['sales'] / d['per'] * 100, d['pt8'] / d['sales'] * 100)
    keys = [k for k in PR if k != '全国' and PR[k]['n'] >= 30]
    vals = {k: line(k) for k in keys + ['全国']}
    for k in ['全国', '東京都', '神奈川県', '愛知県', '大阪府', '福岡県', '宮城県', '秋田県', '山形県', '島根県', '高知県', '鹿児島県']:
        if k in vals:
            a = vals[k]; p(f'| {k} | {PR[k]["n"]:,} | {a[0]:.0%} | {a[1]:.1f} | {a[2]:.2f} | {a[3]:.2f} | {a[4]:,.0f} | {a[5]:,.0f} | {a[6]:.2f} |')
    for j, lab in [(0, '個人の割合'), (1, '1店の従業者'), (2, '1店のパート8h換算'), (4, '1店の年売上')]:
        srt = sorted(keys, key=lambda k: vals[k][j])
        p(f'\n- {lab}：低い3県 ' + '、'.join(f'{k} {vals[k][j]:.2f}' for k in srt[:3]) + '／高い3県 ' + '、'.join(f'{k} {vals[k][j]:.2f}' for k in srt[-3:]))
    # 都市らしさの代わりに最低賃金（令和8年度）との相関
    MW = {}
    g = raw('law', 'primary', 'r6-cal-mhlw-minwage-pref2026_pdf.pdf')
    if os.path.exists(g):
        for m in re.finditer(r'^\s*(\S+?(?:\s+\S)?)\s+([\d,]{5})\s+（\s*([\d,]{5})\s*\)', pdftext(g), re.M):
            MW[re.sub(r'\s', '', m.group(1))] = int(m.group(2).replace(',', ''))
    def short(k): return k if k == '北海道' else re.sub(r'[都府県]$', '', k)
    ks = [k for k in keys if short(k) in MW]
    def corr(a, b):
        ma, mb = st.mean(a), st.mean(b)
        return sum((x - ma) * (y - mb) for x, y in zip(a, b)) / ((len(a) - 1) * st.stdev(a) * st.stdev(b))
    x = [MW[short(k)] for k in ks]
    p(f'\n県の最低賃金（令和8年度、都市らしさの代わり）との相関（{len(ks)}都道府県、店30以上）：' + '、'.join(f'{lab} r＝{corr(x, [vals[k][j] for k in ks]):+.2f}' for j, lab in [(0, '個人の割合'), (1, '1店の従業者'), (2, '1店のパート'), (3, '個人の店の雇われていない人'), (4, '1店の年売上'), (5, '1人の年売上'), (6, '売上1億円あたりのパート')]))
    p('\n読み：県の単位で、都市の県ほど法人の店が多く、1店の人（とくにパート）が厚い。個人の店の「雇われていない人」（店主と家族）は県で大きくは違わない。県は銀座と奥多摩の差よりずっと粗い（東京都に奥多摩町が入る）。1店の人の厚さは店の大きさ（売上）と一緒に動き、売上1億円あたりのパートで見ると地域の差は小さい。同じ大きさの店の人の厚さが地域で違うとはこの表からは言えない。\n')

print('\n'.join(out))
