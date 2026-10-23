#!/usr/bin/env python3
# BIZ-CALIB 0.5 で足した計算（事実の再判定 BIZ-CALIB-v02-audit.md 9章・論証の再検査 BIZ-CALIB-v02-reasoning.md 12章への直し）。
# 使い方：python3 -I boki2/docs/analysis/calib-v05.py > boki2/docs/analysis/calib-v05.md
# 式と置き値の基本は calib-v04.py と同じ（P0・CM・DAYS・fixed・profit）。
import itertools, os, re, statistics as st, subprocess, csv, io

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..', 'research', 'raw')
def raw(*p): return os.path.join(ROOT, *p)
def pdftext(f): return subprocess.run(['pdftotext', '-layout', f, '-'], capture_output=True, text=True).stdout
out = []
def p(*a): out.append(' '.join(str(x) for x in a))
def corr(a, b):
    ma, mb = st.mean(a), st.mean(b)
    return sum((x - ma) * (y - mb) for x, y in zip(a, b)) / ((len(a) - 1) * st.stdev(a) * st.stdev(b))
p('# BIZ-CALIB 0.5 の計算（calib-v05.py の出力。手で書き換えない）\n')

P0 = 1096; CM = 0.60; DAYS = 26; H = 8 * DAYS
def fixed(tsubo, rent, wage, part, family, fam_cost, owner, other):
    return tsubo * rent + wage * H * part + (wage * H * family if fam_cost else 0) + owner + other
def profit(n, price, fx): return n * price * CM * DAYS - fx

# ---------- W2. 経済センサス2016 第17表：個人の店と法人の店に分けた1店のパート、県の個人の割合、混ざりの説明力 ----------
f = raw('web', 'bizmgmt', 'r5-cal-estat-census2016-inshoku.html')
rows = list(csv.reader(io.StringIO(open(f, 'rb').read().decode('cp932', errors='replace'))))
def num(x):
    try: return int(x)
    except ValueError: return 0
PR = {}
for r in rows:
    if len(r) > 25 and r[6].strip().endswith('7624 ラーメン店'):
        PR[r[3]] = dict(n=num(r[7]), per=num(r[8]), emp=num(r[9]), pt8=num(r[12]), sales=num(r[13]),
                        n_i=num(r[14]), per_i=num(r[15]), emp_i=num(r[16]), pt8_i=num(r[19]),
                        n_c=num(r[20]), per_c=num(r[21]), emp_c=num(r[22]), pt8_c=num(r[25]))
p('## W2. ラーメン店（7624）の1店のパート（8時間換算）を、個人の店と法人の店に分ける（経済センサス2016 第17表、都道府県）\n')
p('8時間換算は「常用のパート・アルバイト全員の1日の延べ労働時間÷8」（統計局の用語の解説、r6-cal-stat-census2016-yogo-serviceb）。「雇われていない人」＝従業者−常用雇用者（個人の店では業主1人＋無給の家族＋臨時）。\n')
keys = [k for k in PR if k != '全国' and PR[k]['n'] >= 30 and PR[k]['n_i'] > 0 and PR[k]['n_c'] > 0]
def v(k):
    d = PR[k]
    return dict(sh=d['n_i'] / d['n'], pt=d['pt8'] / d['n'], pt_i=d['pt8_i'] / d['n_i'], pt_c=d['pt8_c'] / d['n_c'],
                per_i=d['per_i'] / d['n_i'], per_c=d['per_c'] / d['n_c'], ne_i=(d['per_i'] - d['emp_i']) / d['n_i'])
V = {k: v(k) for k in keys + ['全国']}
p('| 地域 | 店の数 | 個人の割合 | 1店のパート（全体） | 個人の店1店のパート | 法人の店1店のパート | 個人の店1店の従業者 | 法人の店1店の従業者 | 個人の店1店の雇われていない人 |')
p('|---|---|---|---|---|---|---|---|---|')
for k in ['全国', '東京都', '神奈川県', '愛知県', '大阪府', '福岡県', '宮城県', '秋田県', '山形県', '島根県', '高知県', '鹿児島県']:
    if k in V:
        a = V[k]; p(f'| {k} | {PR[k]["n"]:,} | {a["sh"]:.0%} | {a["pt"]:.2f} | {a["pt_i"]:.2f} | {a["pt_c"]:.2f} | {a["per_i"]:.2f} | {a["per_c"]:.2f} | {a["ne_i"]:.2f} |')
for key, lab in [('sh', '個人の割合'), ('pt_i', '個人の店1店のパート'), ('pt_c', '法人の店1店のパート')]:
    xs = sorted(V[k][key] for k in keys)
    p(f'\n- {lab}（{len(keys)}都道府県、店30以上）：最小 {xs[0]:.2f}・中央値 {st.median(xs):.2f}・最大 {xs[-1]:.2f}')
g = V['全国']
mix = {k: V[k]['sh'] * g['pt_i'] + (1 - V[k]['sh']) * g['pt_c'] for k in keys}
r_mix = corr([V[k]['pt'] for k in keys], [mix[k] for k in keys])
p(f'\n- 県の1店のパートと「全国の個人の店・法人の店の値を、県の個人の割合で混ぜた値」の相関 r＝{r_mix:+.2f}（{len(keys)}都道府県）')
# 最低賃金（都市らしさの代わり）
MW = {}
gg = raw('law', 'primary', 'r6-cal-mhlw-minwage-pref2026_pdf.pdf')
for m in re.finditer(r'^\s*(\S+?(?:\s+\S)?)\s+([\d,]{5})\s+（\s*([\d,]{5})\s*\)', pdftext(gg), re.M):
    MW[re.sub(r'\s', '', m.group(1))] = int(m.group(2).replace(',', ''))
def short(k): return k if k == '北海道' else re.sub(r'[都府県]$', '', k)
ks = [k for k in keys if short(k) in MW]
x = [MW[short(k)] for k in ks]
p('- 県の最低賃金（令和8年度）との相関：' + '、'.join(f'{lab} r＝{corr(x, [V[k][key] for k in ks]):+.2f}' for key, lab in [('sh', '個人の割合'), ('pt', '1店のパート（全体）'), ('pt_i', '個人の店1店のパート'), ('pt_c', '法人の店1店のパート')]))
p('\n読み：1店のパートは、個人の店で約1人、法人の店で約5人と、店の形でまとまる。形の中の県の差は形の間の差より小さい。県の1店のパートの差の多くは、個人の店と法人の店の混ざり方（個人の割合）の差で説明がつく。地方の県ほど個人の店（人の薄い形）が多い。これは県の単位の値で、銀座と奥多摩町の店の値ではない（東京都は個人47%で、銀座も奥多摩町も入る）。売上は個人・法人に分かれていないので、形ごとの「売上あたりのパート」は出ない。\n')

# ---------- G6. 形ごとの人の数で試し直す（論証の再検査 Z09） ----------
p('## G6. 人の数を店の形（個人の店・法人の店）ごとに置いて、2つの例を試し直す\n')
pi = sorted(V[k]['pt_i'] for k in keys); pc = sorted(V[k]['pt_c'] for k in keys)
FORM = {'個人の形': [round(pi[0], 2), round(g['pt_i'], 2), round(pi[-1], 2)], '法人の形': [round(pc[0], 2), round(g['pt_c'], 2), round(pc[-1], 2)]}
p(f'形ごとのパート（8時間換算、県の最小・全国・県の最大）：個人の形 {FORM["個人の形"]}、法人の形 {FORM["法人の形"]}。個人の形は家族の手伝い 0・1人（費用に数える・数えない）を持ち、法人の形は家族なし。ほかの形（広さ 10・15・18坪、店主の報酬 15・20・25・30万、その他 10・15・20・25万、値付け ×1.0・1.1・1.2・1.4、時給の上乗せ ×1.0・1.1・1.2）は両側で同じ。\n')
p('注意：法人の店の約5人は、法人の店の平均の大きさ（従業者約11人）の店の値。1日100人の店に当てると人が厚すぎる側に出る。個人の店の約1人も平均の大きさの値。\n')
GZ = dict(rent=[23990, 30246, 34830, 36250, 42497], pr=[0.845, 0.98, 1.0]); OK = dict(rent=[0, 1500, 3000, 5000, 8000], pr=[0.885, 1.0, 1.2])
COMMON = dict(tsubo=[10, 15, 18], up=[1.0, 1.1, 1.2], owner=[150000, 200000, 250000, 300000], other=[100000, 150000, 200000, 250000], mark=[1.0, 1.1, 1.2, 1.4])
def fams(form): return [(0, True)] if form == '法人の形' else [(0, True), (1, True), (1, False)]
def grid(form_g, form_o):
    tot = gl = ok = both = 0
    for t, u, ow, ot, mk in itertools.product(*COMMON.values()):
        G_ = [profit(100, P0 * pr * mk, fixed(t, r, 1280 * u, pa, fa, fc, ow, ot)) < 0
              for r in GZ['rent'] for pr in GZ['pr'] for pa in FORM[form_g] for fa, fc in fams(form_g)]
        O_ = [profit(30, P0 * pr * mk, fixed(t, r, 1280 * u, pa, fa, fc, ow, ot)) > 0
              for r in OK['rent'] for pr in OK['pr'] for pa in FORM[form_o] for fa, fc in fams(form_o)]
        a, b = sum(G_), sum(O_)
        tot += len(G_) * len(O_); gl += a * len(O_); ok += b * len(G_); both += a * b
    return gl / tot, ok / tot, both / tot
p('| 銀座の店の形 | 過疎の店の形 | 銀座100人で赤字 | 過疎30人で黒字 | 両方 |'); p('|---|---|---|---|---|')
RES = {}
for fg in FORM:
    for fo in FORM:
        a, b, c = grid(fg, fo); RES[(fg, fo)] = (a, b, c)
        p(f'| {fg} | {fo} | {a:.0%} | {b:.0%} | **{c:.1%}** |')
# 混ざり：銀座の店が個人の形である確率＝東京都の個人の割合、過疎の店は地方の県の個人の割合
sh_t = V['東京都']['sh']; rural = sorted(V[k]['sh'] for k in keys)
p('')
for lab, sh_o in [('過疎の個人の割合＝県の中央値', st.median(rural)), ('過疎の個人の割合＝県の最大（高知県）', rural[-1]), ('過疎の個人の割合＝東京都と同じ', sh_t)]:
    pr_ = {('個人の形', '個人の形'): sh_t * sh_o, ('個人の形', '法人の形'): sh_t * (1 - sh_o), ('法人の形', '個人の形'): (1 - sh_t) * sh_o, ('法人の形', '法人の形'): (1 - sh_t) * (1 - sh_o)}
    e = sum(pr_[k] * RES[k][2] for k in pr_)
    p(f'- 店の形を県の個人の割合で引く（銀座＝東京都 {sh_t:.0%}、{lab} {sh_o:.0%}）：両方が成り立つ割合の期待値 **{e:.1%}**')
p('\n読み：形をそろえた組（個人と個人、法人と法人）では両方はほとんど成り立たない。銀座に法人の形・過疎に個人の形を置くと成り立つ割合が上がる。店の形を県の個人の割合で引くと、期待値は形をそろえた0%より上がるが、県の割合は銀座と奥多摩町の店の割合ではない。\n')

# ---------- Q. 格子の範囲の感度（論証の再検査 Z03） ----------
p('## Q. 例ごとの割合の、格子の範囲による動き（calib-v04 の G1・G2 の範囲を変える）\n')
G = dict(tsubo=[10, 12, 15, 18], rent=[30246, 34830, 36250], up=[1.0, 1.1, 1.2], part=[0, 0.5, 1, 1.5, 2, 3],
         family=[0, 1], owner=[150000, 200000, 250000, 300000, 400000], other=[100000, 150000, 200000, 250000, 300000],
         pr=[0.845, 0.98, 1.0], mark=[1.0, 1.1, 1.2, 1.4])
def g1(rents, parts):
    n = k = 0
    for t, r, u, pa, fa, ow, ot, pr, mk in itertools.product(G['tsubo'], rents, G['up'], parts, G['family'], G['owner'], G['other'], G['pr'], G['mark']):
        for fc in ((True, False) if fa else (True,)):
            n += 1; k += profit(100, P0 * pr * mk, fixed(t, r, 1280 * u, pa, fa, fc, ow, ot)) < 0
    return k / n
p('| 銀座の範囲 | 1日100人で赤字 |'); p('|---|---|')
for lab, rents, parts in [('版0.4（家賃3つ・パート0〜3人）', G['rent'], G['part']),
                          ('パート0・0.5人を外す', G['rent'], [1, 1.5, 2, 3]),
                          ('家賃に42,497（飲食店ドットコムの銀座駅）を足す', G['rent'] + [42497], G['part']),
                          ('両方', G['rent'] + [42497], [1, 1.5, 2, 3]),
                          ('家賃に2025年度下期の1階23,990を足す', G['rent'] + [23990], G['part']),
                          ('家賃を5つ（23,990〜42,497）・パート0〜3人', [23990, 30246, 34830, 36250, 42497], G['part']),
                          ('家賃を倍の幅（30,246・60,492）', [30246, 60492], G['part'])]:
    p(f'| {lab} | {g1(rents, parts):.0%} |')
K = dict(tsubo=[10, 15, 20], rent=[0, 1500, 3000, 5000, 8000], part=[0, 0.5, 1, 1.5], family=[0, 1],
         owner=[100000, 150000, 200000, 250000], other=[80000, 120000, 150000, 200000, 250000], pr=[0.885, 1.0, 1.20])
def g2(parts, rents=K['rent'], famc=(True, False)):
    n = k = 0
    for t, r, pa, fa, ow, ot, pr in itertools.product(K['tsubo'], rents, parts, K['family'], K['owner'], K['other'], K['pr']):
        for fc in ((True, False) if fa else (True,)):
            if fa and fc not in famc: continue
            n += 1; k += profit(30, P0 * pr, fixed(t, r, 1280, pa, fa, fc, ow, ot)) > 0
    return k / n
p('\n| 過疎の範囲 | 1日30人で黒字 |'); p('|---|---|')
for lab, parts, rents, fam in [('版0.4（パート0〜1.5人）', K['part'], K['rent'], (True, False)),
                               ('パート1.5人を外す', [0, 0.5, 1], K['rent'], (True, False)),
                               ('家族を費用に数える形を外す', K['part'], K['rent'], (False,)),
                               ('家賃の上を15,000円/坪まで', K['part'], K['rent'] + [10000, 15000], (True, False))]:
    p(f'| {lab} | {g2(parts, rents, fam):.0%} |')
# 家賃と人1人の効き（BIZ-FILL-RAMEN との食い違いの説明）
p('\n家賃と人の効き（15坪、1日100人、値段0.98、店主25万・その他20万・パート1.5人の店で、月の利益の変わり方）：')
base = profit(100, P0 * 0.98, fixed(15, 30246, 1280, 1.5, 0, True, 250000, 200000))
for lab, fx in [('家賃 30,246→36,250（版0.4の格子の幅、1.2倍）', fixed(15, 36250, 1280, 1.5, 0, True, 250000, 200000)),
                ('家賃 30,246→60,492（倍）', fixed(15, 60492, 1280, 1.5, 0, True, 250000, 200000)),
                ('パート +1人', fixed(15, 30246, 1280, 2.5, 0, True, 250000, 200000))]:
    p(f'- {lab}：{profit(100, P0 * 0.98, fx) - base:+,.0f}円/月')
p('\n読み：家賃の効きは、家賃の幅を1.2倍に取れば人1人より小さく、倍に取れば人1人より大きい。版0.4の「家賃の3つの値ではほとんど動かない」は、家賃の幅を狭く取ったから。\n')

# ---------- G4b. (a) だけの比を、アットホームの期と区分の幅で ----------
p('## G4b. 資料のある値（家賃・時給・値段）だけの分岐点の比を、銀座の家賃の期と区分ごとに（共通の形：15坪・パート1.5人・店主25万・その他20万）\n')
def be(rent, wage, pr): return fixed(15, rent, wage, 1.5, 0, True, 250000, 200000) / (P0 * pr * CM) / DAYS
lo = be(16316, 1195, 0.96)
p('| 銀座の家賃（アットホーム） | 円/坪 | 分岐点 人/日 | 栄（16,316・愛知1,195円）との比 |'); p('|---|---|---|---|')
for lab, r in [('2025年度下期・1階（図表7）', 23990), ('2024年度上期・飲食店可', 30246), ('2024年度上期・1階', 34830), ('2025年度下期・飲食店可', 36250)]:
    hi = be(r, 1280, 0.98); p(f'| {lab} | {r:,} | {hi:.1f} | {hi / lo:.2f} |')
p(f'\n栄の分岐点 {lo:.1f}人。銀座の1階は半期で34,830→23,990（−31%、アットホームは前期比−28.9%と書く）動く。\n')

# ---------- Y2. 曜日の換算の、代わりの比の置き方 ----------
p('## Y2. 店の土日÷平日の換算：家計に入らない層（会社員・単身の昼食）の土日÷平日を k と置く\n')
r_h = 2.34
p('| k | q＝0% | 20% | 40% | 60% | 80% | 1を下回る q |'); p('|---|---|---|---|---|---|---|')
for k_ in [0.62, 0.8, 1.0, 1.5]:
    vals = [((1 - q) * r_h + q * k_) for q in [0, 0.2, 0.4, 0.6, 0.8]]
    qx = (r_h - 1) / (r_h - k_) if k_ < 1 else None
    p(f'| {k_} | ' + ' | '.join(f'{x:.2f}' for x in vals) + f' | {"%.0f%%" % (qx * 100) if qx and qx <= 1 else "下回らない"} |')
p('\n式：店の比＝(1−q)×家計の比2.34＋q×k（q は平日の客のうち家計に入らない層の割合）。k＝0.62 は家計調査の「こづかい(使途不明)」の土日÷平日（二人以上の世帯の人の小遣い。単身の世帯・観光客は入らない）。\n')
print('\n'.join(out))
