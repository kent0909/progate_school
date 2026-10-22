#!/usr/bin/env python3
"""BIZ-FILL-CALIB 版1.0 の論証の検査（docs/audit/BIZ-FILL-CALIB-reasoning.md）の検算と感度。
書き手：論証検査役（BIZ-FILL-CALIB の書き手とも事実の判定役とも別）。外部には取りに行かない。手元の raw と報告のスクリプトの出力だけを使う。
節：
  A 借入÷月商（DEBT）：報告の値の再計算、リース・社債を入れた値、時点を変えた値、倒産の事例、公庫の分布の中の8か月の位置
  B 経済センサス（CENSUS）：立地の型ごとの1店の売上と1人あたりの売上、76B の 76 に占める割合、2016年の細分類の格付不能の残り、細分類の比べの感度
  C 曜日（W1）：家計の中華そばとこづかい(使途不明)の 土日÷月〜木、店の客の混ざりの感度
  D 公庫（JFC）：衝撃の年の「年の動き」と同じ年の店の差の比、人件費の固定の割合（C072 の検算）
  E ギフト（GIFT）：売上の伸びと経常利益率（急拡大→利益率↓の検算）
  F (c) の割合の感度（区分を上げた3行が認められない場合）
  G 「設計34・計算23」の中身の付け直し（検査役の手の分類）
  H 食中毒の年の動き
  I FC の加盟金の点（ブランドごと）
  J 判定の数（docs/audit/BIZ-FILL-CALIB-reasoning.md の3章の表の判定の列を数える）
使い方: python3 -I boki2/docs/analysis/fill-calib-reasoning-check.py > boki2/docs/analysis/fill-calib-reasoning-check.out.txt
"""
import csv, io, os, re, subprocess, statistics, datetime, collections

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
BIZ = os.path.join(ROOT, 'research', 'raw', 'web', 'bizmgmt')
TOOL = os.path.join(ROOT, 'tools', 'sheet-text.py')


def sheet(path):
    return subprocess.run(['python3', '-I', TOOL, path], capture_output=True, text=True).stdout


def h(t):
    print('\n## ' + t + '\n')


# ---------------- A 借入 ----------------
h('A 借入÷月商（DEBT）')
# 値は各社の有報の【借入金等明細表】【社債明細表】と経営指標等の売上（千円。物語は百万円を千円に直した）。
A = [
    # 会社と期, 借入金（報告と同じ範囲）, リース債務, 社債, 売上
    ('山岡家 2026/1', 493430 + 1078206, 6344, 0, 43000813),
    ('幸楽苑 2026/3', 980000 + 99960 + 8450, 1341354 - (980000 + 99960 + 8450), 0, 29404657),
    ('日高屋 2026/2', 0, 0, 0, 62252860),
    ('ギフト 2025/10', 4514 + 1682513 + 4115773, 0, 0, 35878100),
    ('力の源 2025/3', 140000 + 1095030 + 1370868, 1175 + 2423, 0, 34166110),
    ('物語 2026/6', (3651 + 10411) * 1000, (191 + 2171) * 1000, 1000 * 1000, 151689000),
]
print('| 会社（期） | 報告の範囲（か月） | リース・社債を足す（か月） |')
print('|---|---|---|')
for n, b, l, s, sales in A:
    m = sales / 12
    print(f'| {n} | {b / m:.2f} | {(b + l + s) / m:.2f} |')
print('\n時点を変える（同じ会社の苦しい時期・急な出店の時期。借入金等明細表の合計＝リースを含む）：')
T = [
    ('山岡家 2015/1 末（2016/1期の期首）', 2026911, 9007487),
    ('山岡家 2016/1 末', 1735628, 10068512),
    ('幸楽苑 2021/3 末（連結）', 6315619, 26565903),
    ('幸楽苑 2023/3 末（連結）', 5653048, 25461852),
    ('ギフト 2018/10 末（上場の期末）', 618392, 6971827),
    ('ギフト 2019/10 末', 1151291, 9052421),
]
for n, b, sales in T:
    print(f'- {n}：{b / (sales / 12):.2f} か月')
# 山岡家 2012/1 末の推計【検査役の推論】：2015/1 末の借入 2,026,911 に、2013/1〜2015/1 期の財務CF（返済の向き）を足し戻す
est = 2026911 + 402269 + 620105 + 314924
print(f'- 山岡家 2012/1 末（急な出店 2010→2012 の直後）の推計【検査役の推論：財務CF に配当・リースの返済が混ざる】：{est:,}千円 ÷ 月商 {8712310 / 12:,.0f} ＝ {est / (8712310 / 12):.2f} か月')
print(f'- 山岡家 2012/1 末の負債の総額÷月商（上の端）：{(5496216 - 1272705) / (8712310 / 12):.2f} か月')
print(f'- ギフト 2016/10 末（上場前、自己資本比率23.7%）の負債の総額÷月商（上の端）：{(2225407 - 528100) / (4535849 / 12):.2f} か月')
print('\n倒産の事例（BIZ-CALIB 版0.2 X4 の数。売上は最盛期や倒産前の年なので、倒産時の月商で割るより小さく出る＝下の端）：')
for n, debt, sales in (('（有）太郎 負債3.3億・売上4.8億（2019/5期）', 3.3, 4.8), ('こじま亭 負債約1億・ピーク売上3.7億', 1.0, 3.7)):
    print(f'- {n}：{debt / (sales / 12):.1f} か月')
print('\n公庫の中華料理店（法人の融資先）の中で「月商の8か月」の位置（平均・標準偏差は fill-calib-jfc4.out.md）：')
for y, mu, md, sd in (('2019年度', 5.6, 3.2, 6.7), ('2021年度', 11.5, 9.2, 8.7), ('2023年度', 11.7, 7.2, 13.6), ('2025年度', 5.8, 4.1, 5.6)):
    print(f'- {y}：(8−平均)/標準偏差 ＝ {(8 - mu) / sd:+.2f}（中央値 {md}）')

# ---------------- B センサス ----------------
h('B 経済センサス（CENSUS）')
rows = []
for l in sheet(os.path.join(BIZ, 'r6-fc-estat-census-000040186980.xlsx')).split('\n'):
    c = l.split('\t')
    if len(c) >= 6 and c[2] == '76B_中華料理店':
        rows.append((c[0], int(c[3]), int(c[4]), int(c[5])))
print('| 立地の型 | 1店の年売上（万円） | 1店の従業者 | 従業者1人の年売上（万円） |')
print('|---|---|---|---|')
for name, n, p, s in rows:
    print(f'| {name} | {s / n * 100:,.0f} | {p / n:.1f} | {s / p * 100:,.0f} |')
sub = [r for r in rows if r[0][:2] in ('11', '12', '13', '14', '15', '20', '30', '40', '50')]
per_store = [r[3] / r[1] for r in sub]
per_emp = [r[3] / r[2] for r in sub]
print(f'\n1店の売上の 最大÷最小：{max(per_store) / min(per_store):.2f}　従業者1人の売上の 最大÷最小：{max(per_emp) / min(per_emp):.2f}')
# 1店の売上の差のうち、店の大きさ（従業者）で説明される分：log の分散の分け方
ls = [__import__('math').log(x) for x in per_store]
le = [__import__('math').log(r[2] / r[1]) for r in sub]
lp = [__import__('math').log(x) for x in per_emp]
print(f'log(1店の売上) の分散 {statistics.pvariance(ls):.4f} ＝ log(1店の従業者) {statistics.pvariance(le):.4f} ＋ log(1人の売上) {statistics.pvariance(lp):.4f} ＋ 2×共分散 {2 * statistics.covariance(le, lp) * (len(le) - 1) / len(le):.4f}')


def sj(f):
    return open(os.path.join(BIZ, f), 'rb').read().decode('cp932', errors='replace')


C = {}
for y, f in (('2012', 'r6-fc-estat-census2012-inshoku.html'), ('2016', 'r5-cal-estat-census2016-inshoku.html')):
    for r in csv.reader(io.StringIO(sj(f))):
        if len(r) > 13 and r[3] == '全国':
            C[(y, r[6].strip())] = int(r[7])
c12 = C[('2012', '7623 中華料理店')] + C[('2012', '7624 ラーメン店')] + C[('2012', '762A 中華料理店，ラーメン店格付不能')]
c16 = C[('2016', '76B 中華料理店')]
c21 = 40852
t = {'2012': C[('2012', '76 飲食店')], '2016': C[('2016', '76 飲食店')], '2021': 430360}
print(f'\n76 飲食店：2012 {t["2012"]:,} → 2016 {t["2016"]:,}（{(t["2016"] / t["2012"] - 1) * 100:+.1f}%）→ 2021 {t["2021"]:,}（{(t["2021"] / t["2016"] - 1) * 100:+.1f}%）')
print(f'76B の伸び：2012→2016 {(c16 / c12 - 1) * 100:+.1f}%、2016→2021 {(c21 / c16 - 1) * 100:+.1f}%')
print(f'76B ÷ 76：2012 {c12 / t["2012"] * 100:.2f}%・2016 {c16 / t["2016"] * 100:.2f}%・2021 {c21 / t["2021"] * 100:.2f}%')
r16 = c16 - C[('2016', '7623 中華料理店')] - C[('2016', '7624 ラーメン店')]
print(f'2016年の 76B のうち細分類（7623・7624）に入らない残り：{r16:,}（76B の {r16 / c16 * 100:.1f}%）。2012年の格付不能（762A）は {C[("2012", "762A 中華料理店，ラーメン店格付不能")]:,}（{C[("2012", "762A 中華料理店，ラーメン店格付不能")] / c12 * 100:.1f}%）')
ra12, ch12 = C[('2012', '7624 ラーメン店')], C[('2012', '7623 中華料理店')]
ra16, ch16 = C[('2016', '7624 ラーメン店')], C[('2016', '7623 中華料理店')]
print('2016年の残りをラーメン店に振る割合 s を動かした細分類の伸び（2012→2016）：')
for s in (0, 0.25, 0.5, 0.551, 0.75, 1):
    a = ra16 + s * r16; b = ch16 + (1 - s) * r16
    print(f'- s={s:.3f}：ラーメン店 {(a / ra12 - 1) * 100:+.1f}%、中華料理店 {(b / ch12 - 1) * 100:+.1f}%')
print('（s=0.551 は 2016年の細分類の中のラーメン店の割合 18,041/32,745 で比例に振った値）')

# ---------------- C 曜日 ----------------
h('C 曜日（W1）')
HOL = {(1, 1), (1, 13), (2, 11), (2, 23), (2, 24), (3, 20), (4, 29), (5, 3), (5, 4), (5, 5), (5, 6), (7, 21), (8, 11), (9, 15), (9, 23), (10, 13), (11, 3), (11, 23), (11, 24)}
SPECIAL = {(12, 29), (12, 30), (12, 31), (1, 1), (1, 2), (1, 3), (8, 13), (8, 14), (8, 15), (8, 16)}
items = ['中華そば', 'こづかい(使途不明)', '世帯主こづかい', '外食']
acc = collections.defaultdict(lambda: collections.defaultdict(list))
for m in range(1, 13):
    txt = sheet(os.path.join(BIZ, f'r6-fc-estat-kakei-hibetsu-2025{m:02d}.html'))
    seen = set(); sh = None
    nd = (datetime.date(2025 + (m == 12), m % 12 + 1, 1) - datetime.timedelta(days=1)).day
    for line in txt.split('\n'):
        if line.startswith('# '):
            sh = line[2:]; continue
        c = line.split('\t')
        if len(c) > 40 and c[11] in items and c[12] == '円':
            key = (sh[:2], c[11])
            if key in seen: continue
            seen.add(key)
            v = [float(x) if x not in ('', '-') else None for x in c[13:13 + nd]]
            for d in range(1, nd + 1):
                x = v[d - 1]
                if x is None or (m, d) in SPECIAL or (m, d) in HOL: continue
                wd = datetime.date(2025, m, d).weekday()
                k = 'wd' if wd <= 3 else ('fri' if wd == 4 else 'we')
                acc[key][k].append(x)
print('| 世帯 | 品目 | 月〜木の1日平均（円） | 土日の1日平均（円） | 土日÷月〜木 |')
print('|---|---|---|---|---|')
ratio = {}
for key in sorted(acc):
    a, b = statistics.mean(acc[key]['wd']), statistics.mean(acc[key]['we'])
    ratio[key] = b / a
    print(f'| {key[0]} | {key[1]} | {a:.1f} | {b:.1f} | {b / a:.2f} |')
print('（祝日・お盆・年末年始を除いた ふつうの月〜木と土日。シート名の頭2字で世帯を分けた）')
hh = ratio.get(('二人', '中華そば'), 2.46)
print('\n店の客の混ざりの感度【検査役の仮定】：平日の客のうち、家計の中華そばの行に乗らない客（単身・こづかいの昼食）の割合 s。')
print('その客の土日÷平日は こづかい(使途不明) の比 k と置く。店の土日÷平日 ＝ (1−s)×家計の比 ＋ s×k')
k = ratio.get(('二人', 'こづかい(使途不明)'), 0.63)
for s in (0, 0.2, 0.4, 0.6, 0.8):
    print(f'- s={s:.1f}：{(1 - s) * hh + s * k:.2f}（DESIGN の住宅地・郊外 ×1.5、全体 ×1.3）')

# ---------------- D 公庫 ----------------
h('D 公庫（JFC）')
mv = -21.4 - (-1.2)
print(f'2021年度の平均の動き（2019年度から）{mv:+.1f}ポイント、2021年度の店の差（標準偏差）25.3 → 同じ年の比 {25.3 / abs(mv):.2f}。報告は平時の標準偏差7と比べた（比 {7.2 / abs(mv):.2f}）')
mv23 = -15.8 - (-1.2)
print(f'2023年度の平均の動き {mv23:+.1f}、標準偏差16.0 → 比 {16.0 / abs(mv23):.2f}')
# 人件費の固定の割合（C072 の「人件費は固定費に近い」）：人件費率 r＝F/S＋v、2019→2021 で 3.3㎡売上が 2442→1724
S1, S2 = 1.0, 1724 / 2442
r1, r2 = 0.355, 0.432
F = (r2 - r1) / (1 / S2 - 1 / S1); v = r1 - F
print(f'人件費率 35.5%→43.2%、3.3㎡売上 ×{S2:.3f}：固定の部分 F＝{F:.3f}（2019年度の売上に対し）・変動 v＝{v:.3f} → 人件費のうち固定 {F / r1 * 100:.0f}%【検査役の推論：年度で標本が違い、面積あたりの売上を売上の代わりにした】')
print('中央値で同じ計算（35.0→39.8、中央値 1786→1177）：', end='')
S2m = 1177 / 1786; Fm = (0.398 - 0.35) / (1 / S2m - 1); print(f'固定 {Fm / 0.35 * 100:.0f}%')

# ---------------- E ギフト ----------------
h('E ギフト（急拡大→利益率↓）')
G = [(2016, 4535849, 433813), (2017, 5612325, 637749), (2018, 6971827, 777832), (2019, 9052421, 1023265), (2020, 10982335, 512017)]
prev = None
for y, s, o in G:
    g = '' if prev is None else f'{(s / prev - 1) * 100:+.1f}%'
    print(f'- {y}年10月期：売上 {s / 1e5:.1f}億円 {g}・経常利益率 {o / s * 100:.1f}%')
    prev = s
print('売上が年+23〜30%で伸びた2017〜2019年は利益率が9.6→11.3%と上がり、下がったのはコロナの2020年（+21%）だけ')

# ---------------- F (c) の割合 ----------------
h('F (c) の割合の感度')
base_a, base_b, base_c = 41, 31, 43
for name, up in (('報告どおり（M16・R5・K28 を上げる）', ('M16', 'R5', 'K28')), ('R5 を戻す', ('M16', 'K28')), ('M16・R5 を戻す', ('K28',)), ('3行とも戻す', ())):
    a, b, c = base_a, base_b, base_c
    if 'M16' in up: c -= 1; b += 1
    if 'R5' in up: c -= 1; a += 1
    if 'K28' in up: b -= 1; a += 1
    print(f'- {name}：(a){a}・(b){b}・(c){c} → (c) {c}/115 ＝ {c / 115 * 100:.1f}%')

# ---------------- G 設計・計算の付け直し ----------------
h('G 「設計34・計算23」の付け直し（検査役の手の分類。理由は検査書 2.7）')
CALC_TRUE = 'C003 C004 C005 C006 C007 C008 C012 C013 C014 C015 C016 C019 C020 C035 C071 C103 C104'.split()
CALC_EMP = 'C009 C010 C011 C018 C072 C077'.split()
D_META = 'C107 C108 C110 C111 C156 C157 C158'.split()
D_MODEL = ['C074']
D_EMP = 'C127 C132 C140 C145 C154'.split()
D_DESIGN = 'C109 C128 C129 C130 C131 C134 C135 C136 C137 C138 C141 C142 C143 C144 C146 C147 C148 C150 C151 C152 C153'.split()
HANDY = {'C010': '手元のセンサス3回（この報告が取った）', 'C011': '手元のセンサス3回', 'C072': '手元の公庫4年度（人件費率と売上の動き。上の D）', 'C077': '手元の公庫4年度（分布の形の年ごとの変化）', 'C140': '手元の立地の表とアットホーム', 'C145': 'リポジトリの声の表（BIZ-REPLAY・COFFEEINC2 の数え）', 'C154': 'リポジトリの声の表'}
tsv = list(csv.reader(open(os.path.join(ROOT, 'docs', 'analysis', 'fill-results-calib.tsv'), encoding='utf-8'), delimiter='\t'))
hdr = tsv[0]; ix = {k: i for i, k in enumerate(hdr)}
got = {r[0]: r[ix['扱い']] for r in tsv[1:]}
calc = sorted(k for k, v in got.items() if v == '計算'); des = sorted(k for k, v in got.items() if v == '設計')
assert sorted(CALC_TRUE + CALC_EMP) == calc, (set(calc) ^ set(CALC_TRUE + CALC_EMP))
assert sorted(D_META + D_MODEL + D_EMP + D_DESIGN) == des, (set(des) ^ set(D_META + D_MODEL + D_EMP + D_DESIGN))
print(f'計算 {len(calc)}：本当に (a) からの計算 {len(CALC_TRUE)}・資料で確かめられる推論 {len(CALC_EMP)}（{" ".join(CALC_EMP)}）')
print(f'設計 {len(des)}：印の説明・自己申告（説明に入るべき）{len(D_META)}・模型の数の比べ {len(D_MODEL)}・設計の案 {len(D_DESIGN)}・資料で確かめられる推論 {len(D_EMP)}（{" ".join(D_EMP)}）')
print(f'資料で確かめられるのに外した計 {len(CALC_EMP) + len(D_EMP)}、うち手元の資料で確かめられたもの {len(HANDY)}：')
for k, v in HANDY.items():
    print(f'- {k}：{v}')

# ---------------- H 食中毒 ----------------
h('H 食中毒の年の動き')
P = {2023: 11803, 2024: 14229, 2025: 24727}
print(f'患者：2023→2024 ×{P[2024] / P[2023]:.2f}、2024→2025 ×{P[2025] / P[2024]:.2f}、3年の最大÷最小 {max(P.values()) / min(P.values()):.2f}（報告は「年で約2倍動く」）')

# ---------------- I FC ----------------
h('I FC の加盟金（ブランドごとの点）')
for n, v, src in (('ギフトのプロデュース店', 0, 'BIZ-CALIB 版0.2 R5'), ('比較記事の本部（堀切系）', 200, 'r4-calib-shopowner-ramenfc（比較記事）'), ('幸楽苑（加盟先は7法人）', 300, '有報 重要な契約等'), ('丸源ラーメン 1店目（2〜9店目250・10店目〜150）', 500, '有報 重要な契約等')):
    print(f'- {n}：{v}万円（{src}）')
print('点は4つで0〜500万円。有報の2つは大きな上場の本部で、加盟するのは法人（幸楽苑の契約先は7社、丸源は30店目以降の料率まである）')

# ---------------- J 判定の数 ----------------
h('J 判定の数（検査書3章の表）')
doc = os.path.join(ROOT, 'docs', 'audit', 'BIZ-FILL-CALIB-reasoning.md')
cnt = collections.Counter(); n = 0
if os.path.exists(doc):
    for line in open(doc, encoding='utf-8'):
        m = re.match(r'^\| (Z\d+) \|', line)
        if not m: continue
        cells = [x.strip() for x in line.strip().strip('|').split('|')]
        j = cells[-2]
        cnt[j] += 1; n += 1
print(f'結論の行 {n}： 妥当 {cnt["妥当"]}・弱い {cnt["弱い"]}・不当 {cnt["不当"]} ／計 {cnt["妥当"] + cnt["弱い"] + cnt["不当"]}')
other = {k: v for k, v in cnt.items() if k not in ('妥当', '弱い', '不当')}
if other: print('判定の列が3つ以外の行：', other)
