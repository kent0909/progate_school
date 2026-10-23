#!/usr/bin/env python3
# BIZ-CALIB 版0.4 の論証の再検査（docs/audit/BIZ-CALIB-v02-reasoning.md の12章）の検算と感度。
# 使い方：python3 -I boki2/docs/analysis/calib-v04-reasoning-check.py > boki2/docs/analysis/calib-v04-reasoning-check.md
# 報告の calib-v04.py と同じ式（固定費＝家賃×坪＋時給×8h×26日×(パート＋数える家族)＋店主＋その他、限界利益率60%、26日、客単価の基準1,096円）で、
# 格子の範囲を変えたときの割合、経済センサス（r5-cal-estat-census2016-inshoku、git に入れない原文）の個人と法人の分け、曜日の換算の代わりの比を出す。
import csv, io, itertools, os, statistics as st

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'research', 'raw')
out = []
def p(*a): out.append(' '.join(str(x) for x in a))
P0, CM, DAYS = 1096, 0.60, 26; H = 8 * DAYS
def fixed(tsubo, rent, wage, part, family, fc, owner, other):
    return tsubo * rent + wage * H * part + (wage * H * family if fc else 0) + owner + other
def profit(n, price, fx): return n * price * CM * DAYS - fx
p('# BIZ-CALIB 版0.4 の論証の再検査：検算と感度（calib-v04-reasoning-check.py の出力。手で書き換えない）\n')

# ---------- Q1. 銀座の格子の範囲を変える ----------
p('## Q1. 銀座の1階で1日100人が赤字の割合：報告の格子（G1）と範囲を変えた格子\n')
def ginza(parts, rents, owners=(150000, 200000, 250000, 300000, 400000), fam=(0, 1)):
    tot = k = 0
    for t, r, u, pa, fa, ow, ot, pr, mk in itertools.product([10, 12, 15, 18], rents, [1.0, 1.1, 1.2], parts, fam, owners,
                                                             [100000, 150000, 200000, 250000, 300000], [0.845, 0.98, 1.0], [1.0, 1.1, 1.2, 1.4]):
        for fc in ((True, False) if fa else (True,)):
            tot += 1; k += profit(100, P0 * pr * mk, fixed(t, r, 1280 * u, pa, fa, fc, ow, ot)) < 0
    return tot, k
A = [30246, 34830, 36250]
for lab, parts, rents in [('報告の G1（パート0〜3、家賃 アットホーム3つ）', [0, 0.5, 1, 1.5, 2, 3], A),
                          ('パート0・0.5人を外す（1日100杯を店主と家族だけで回す形を外す）', [1, 1.5, 2, 3], A),
                          ('家賃に飲食店ドットコムの銀座駅 42,497円/坪を足す（版0.3の検査の R1 の値）', [0, 0.5, 1, 1.5, 2, 3], A + [42497]),
                          ('両方', [1, 1.5, 2, 3], A + [42497])]:
    tot, k = ginza(parts, rents)
    p(f'- {lab}：{tot:,} 通りのうち {k:,}（**{k/tot*100:.0f}%**）')
tot, k = ginza([0, 0.5, 1, 1.5, 2, 3], A); p(f'\n（検算：報告の G1 は 194,400 通り・29,309（15%）。ここでは {tot:,} 通り・{k:,}）\n')

# ---------- Q2. 過疎の格子の範囲を変える ----------
p('## Q2. 過疎で1日30人が黒字の割合：報告の格子（G2）と範囲を変えた格子\n')
def kaso(parts, fams=(0, 1), fcs=None):
    tot = k = 0
    for t, r, pa, fa, ow, ot, pr in itertools.product([10, 15, 20], [0, 1500, 3000, 5000, 8000], parts, fams, [100000, 150000, 200000, 250000],
                                                     [80000, 120000, 150000, 200000, 250000], [0.885, 1.0, 1.2]):
        opts = (True, False) if fa else (True,)
        if fcs is not None and fa: opts = fcs
        for fc in opts:
            tot += 1; k += profit(30, P0 * pr, fixed(t, r, 1280, pa, fa, fc, ow, ot)) > 0
    return tot, k
for lab, kw in [('報告の G2', dict(parts=[0, 0.5, 1, 1.5])),
                ('パート1.5人を外す（1日30杯にパート1.5人は厚い）', dict(parts=[0, 0.5, 1])),
                ('家族1人で回す店に限る（パート0・0.5、家族1人、家族を数える・数えない）', dict(parts=[0, 0.5], fams=(1,))),
                ('同じ、家族を最低賃金で数える', dict(parts=[0, 0.5], fams=(1,), fcs=(True,))),
                ('同じ、家族を数えない', dict(parts=[0, 0.5], fams=(1,), fcs=(False,)))]:
    tot, k = kaso(**kw); p(f'- {lab}：{tot:,} 通りのうち {k:,}（**{k/tot*100:.0f}%**）')
tot, k = kaso([0, 0.5, 1, 1.5]); p(f'\n（検算：報告の G2 は 10,800 通り・2,923（27%）。ここでは {tot:,} 通り・{k:,}）\n')

# ---------- Q3. 経済センサス：個人の店と法人の店の人の厚さ（県） ----------
p('## Q3. 経済センサス2016 のラーメン店（7624）：個人の店と法人の店を分けた人の厚さ（都道府県）\n')
f = os.path.join(ROOT, 'web', 'bizmgmt', 'r5-cal-estat-census2016-inshoku.html')
mw = {'東京都': 1280, '神奈川県': 1279, '大阪府': 1231, '愛知県': 1195, '宮城県': 1098, '秋田県': 1090, '宮崎県': 1085}
if os.path.exists(f):
    rows = list(csv.reader(io.StringIO(open(f, 'rb').read().decode('cp932', errors='replace'))))
    def num(x):
        try: return int(x)
        except ValueError: return 0
    PR = {}
    for r in rows:
        if len(r) > 25 and r[6].strip().endswith('7624 ラーメン店'):
            PR[r[3]] = dict(n=num(r[7]), per=num(r[8]), emp=num(r[9]), pt8=num(r[12]), sales=num(r[13]),
                            n_i=num(r[14]), per_i=num(r[15]), emp_i=num(r[16]), pt8_i=num(r[19]), n_c=num(r[20]), per_c=num(r[21]), emp_c=num(r[22]), pt8_c=num(r[25]))
    nat = PR['全国']
    p(f'- 全国：個人の店 {nat["n_i"]:,}店・1店のパート8h換算 {nat["pt8_i"]/nat["n_i"]:.2f}人・1店の従業者 {nat["per_i"]/nat["n_i"]:.2f}人／法人の店 {nat["n_c"]:,}店・1店のパート8h換算 {nat["pt8_c"]/nat["n_c"]:.2f}人・1店の従業者 {nat["per_c"]/nat["n_c"]:.2f}人。')
    p('- 列の名：原表の「（再掲）パート・アルバイトなど」（正社員の所定時間で換算した人数とみた。原表の列名は切れていて、換算の定義は表の注を確かめていない）。売上は個人と法人に分かれていない。\n')
    p('| 都道府県 | 個人の割合 | 個人の店1店のパート8h | 法人の店1店のパート8h | 全体の1店のパート8h | 全体の売上1億円あたりのパート8h |'); p('|---|---|---|---|---|---|')
    ks = [k for k in PR if k != '全国' and PR[k]['n'] >= 30]
    for k in ['全国', '東京都', '大阪府', '愛知県', '宮城県', '秋田県', '山形県', '高知県', '鹿児島県']:
        d = PR[k]
        p(f'| {k} | {d["n_i"]/d["n"]*100:.0f}% | {d["pt8_i"]/max(d["n_i"],1):.2f} | {d["pt8_c"]/max(d["n_c"],1):.2f} | {d["pt8"]/d["n"]:.2f} | {d["pt8"]/(d["sales"]/100):.2f} |')
    # 全体の1店のパートのうち、個人と法人の割合の違い（構成）で説明できる分
    pi = nat['pt8_i'] / nat['n_i']; pc = nat['pt8_c'] / nat['n_c']
    xs = [PR[k]['pt8'] / PR[k]['n'] for k in ks]; ys = [(PR[k]['n_i'] / PR[k]['n']) * pi + (1 - PR[k]['n_i'] / PR[k]['n']) * pc for k in ks]
    def corr(a, b):
        ma, mb = st.mean(a), st.mean(b); return sum((x - ma) * (y - mb) for x, y in zip(a, b)) / ((len(a) - 1) * st.stdev(a) * st.stdev(b))
    p(f'\n- {len(ks)}県（店30以上）。県の1店のパートと、「全国の個人・法人の1店のパートを県の個人の割合で混ぜた値」の相関 r＝{corr(xs, ys):+.2f}。県の1店のパートの散らばりの多くは、個人の店と法人の店の混ざり方で説明がつく。')
    ii = [PR[k]['pt8_i'] / PR[k]['n_i'] for k in ks if PR[k]['n_i'] >= 20]; cc = [PR[k]['pt8_c'] / PR[k]['n_c'] for k in ks if PR[k]['n_c'] >= 20]
    p(f'- 個人の店1店のパート8h：県の中央値 {st.median(ii):.2f}・最小 {min(ii):.2f}・最大 {max(ii):.2f}。法人の店：中央値 {st.median(cc):.2f}・最小 {min(cc):.2f}・最大 {max(cc):.2f}。')
    indiv = [PR[k]['n_i'] / PR[k]['n'] for k in ks]
    p(f'- 個人の割合：県で {min(indiv)*100:.0f}%〜{max(indiv)*100:.0f}%（中央値 {st.median(indiv)*100:.0f}%）。\n')
    p('読み：「1店の人の厚さ」は、個人の店（1店のパート約1人）と法人の店（約5人）の2つの形の混ざり方で、県ごとに大きく動く。売上1億円あたりのパートが県で同じくらい（報告の r＝+0.04）でも、それは形の混ざりと売上の大きさが一緒に動いた結果で、**1店ごとの形が県で同じだという証拠にはならない**。地方の県ほど個人の店（家族の労働が入る形）が多いことは、形の違いの側の量の資料になる（県の単位、個人の店が「家族で回す」とまでは表から言えない）。\n')
else: p('原文なし\n')

# ---------- Q4. 曜日の換算：家計に入らない層の土日÷平日の比を変える ----------
p('## Q4. 曜日の換算（報告の Y）：家計に入らない層の土日÷平日の比を変える\n')
p('店の土日÷平日 ＝ (1−q)×2.34 ＋ q×r。報告は r＝0.62（こづかい(使途不明)）。r は単身の世帯・観光客を含まない代わりの値なので、r を変えた。\n')
p('| q | r＝0.62（報告） | r＝0.8 | r＝1.0 | r＝1.5 |'); p('|---|---|---|---|---|')
for q in [0, 0.2, 0.4, 0.6, 0.8, 1.0]:
    p(f'| {q:.0%} | ' + ' | '.join(f'{(1-q)*2.34 + q*r:.2f}' for r in [0.62, 0.8, 1.0, 1.5]) + ' |')
p('\n読み：店の比が1を下回るのは、r＝0.62 で q が約78%を超えるときだけ。r が1以上なら、q によらず1を下回らない。「1を挟んで動く」は r の置き方しだい。\n')

print('\n'.join(out))
