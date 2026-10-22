#!/usr/bin/env python3
# BIZ-CALIB 0.3 で足した計算（事実の判定書 BIZ-CALIB-v02-audit.md と論証の検査書 BIZ-CALIB-v02-reasoning.md への直し）。
# 使い方：python3 -I boki2/docs/analysis/calib-v03.py > boki2/docs/analysis/calib-v03.md
# 原文は boki2/research/raw/（git に入れない）。原文がないときはその節を「原文なし」と出して止まらない。
# 数字はすべて原文のファイルを読んで出す。原文が画像の図だけのもの（アットホームの名古屋・大阪の賃料）は、画像を目で読んだ値を
# 下の辞書に書き、そう印を付ける。
import csv, io, math, os, random, re, statistics as st, subprocess, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..', 'research', 'raw')
TOOLS = os.path.join(HERE, '..', '..', 'tools')
def raw(*p): return os.path.join(ROOT, *p)
def pdftext(f, layout=True): return subprocess.run(['pdftotext'] + (['-layout'] if layout else []) + [f, '-'], capture_output=True, text=True).stdout
def norm(s): return unicodedata.normalize('NFKC', s)
def sheet(f): return subprocess.run(['python3', '-I', os.path.join(TOOLS, 'sheet-text.py'), f], capture_output=True, text=True).stdout
out = []
def p(*a): out.append(' '.join(str(x) for x in a))
def corr(xs, ys):
    mx, my = st.mean(xs), st.mean(ys)
    return sum((a - mx) * (b - my) for a, b in zip(xs, ys)) / ((len(xs) - 1) * st.stdev(xs) * st.stdev(ys))

p('# BIZ-CALIB 0.3 の計算（calib-v03.py の出力。手で書き換えない）\n')

# ---------- A. 公庫の表：4つの年度（2019・2021・2023・2025年度） ----------
def parse_jfc(f):
    """業種別・規模別の頁を読む。行の名は「売上高経常利益率(償却前)」のように括弧を含むものもそのまま残す（版0.2の読み方は、
    この行を「売上高経常利益率」に上書きしていた）。"""
    txt = pdftext(f); recs = []
    for page in txt.split('\f'):
        lines = page.split('\n'); kind = None
        for i, l in enumerate(lines):
            if '業種別経営指標' in l and '…' not in l: kind, hi = 'ind', i; break
            if '従業者規模別経営指標' in l and '…' not in l: kind, hi = 'size', i; break
        if not kind: continue
        rec = {'kind': kind, 'name': lines[hi + 1].strip(), 'rows': {}}
        m = re.search(r'調査対象数\s+(\d+)\s+黒字かつ自己資本プラス企業数\s+(\d+)', page)
        if kind == 'ind' and m: rec['n'] = int(m.group(1)); rec['n_good'] = int(m.group(2))
        if kind == 'size': rec['n'] = [int(x) for x in re.findall(r'調査対象数\s+(\d+)', page)]
        for l in lines:
            mm = re.match(r'\s*(\S+?(?:\(償却前\))?)\s*[（(]([^)）]+)[)）]\s+(.*)$', l)
            if not mm: continue
            vals = re.findall(r'-?[\d,]+\.\d+|-?[\d,]+|(?<!\S)-(?!\S)', mm.group(3))
            if len(vals) < 4: continue
            rec['rows'][mm.group(1)] = [None if v == '-' else float(v.replace(',', '')) for v in vals]
        recs.append(rec)
    return recs

YEARS = [('2019年度', 'r5-cal-jfc-shihyou-202008-08a.pdf', 'r5-cal-jfc-shihyou-202008-08c.pdf', 'r5-cal-jfc-shihyou-202008-08a'),
         ('2021年度', 'r6-fc-warp-jfc-202302-08a.pdf', 'r6-fc-warp-jfc-202302-08c.pdf', 'r6-fc-warp-jfc-202302-08a（補填の担当が WARP で取得）'),
         ('2023年度', 'r6-fc-warp-jfc-2024-08a.pdf', 'r6-fc-warp-jfc-2024-08c.pdf', 'r6-fc-warp-jfc-2024-08a（同）'),
         ('2025年度', 'r4-calib-jfc-shihyou-08a.pdf', 'r4-calib-jfc-shihyou-08c.pdf', 'r4-calib-jfc-shihyou-08a')]
J = {}
for y, fa, fc, doc in YEARS:
    if os.path.exists(raw('web', 'bizmgmt', fa)): J[y] = (parse_jfc(raw('web', 'bizmgmt', fa)), doc)
def get(y, kind, name):
    for r in J.get(y, ([], ''))[0]:
        if r['kind'] == kind and r['name'] == name: return r

p('## A. 公庫の表の4つの年度（中華料理店・一般飲食店、業種別の頁）\n')
p('列は 平均／黒字かつ自己資本プラス企業の平均／中央値／標準偏差。2021・2023年度は決算の期がコロナの営業制限の時期にかかる。\n')
for name in ['中華料理店', '一般飲食店']:
    p(f'### {name}\n')
    p('| 年度（資料） | 調査対象数（黒字かつ自己資本プラス） | 営業利益率 | 経常利益率 | 経常利益率(償却前) | 人件費率 | 損益分岐点比率 | 借入金回転期間（月） |')
    p('|---|---|---|---|---|---|---|---|')
    means = []
    for y in J:
        r = get(y, 'ind', name)
        if not r: p(f'| {y} | 表なし | | | | | | |'); continue
        def c(k):
            v = r['rows'].get(k)
            return '—' if not v or v[0] is None else f'{v[0]:g}／{v[1]:g}／{v[2]:g}／{v[5]:g}'
        means.append((y, r['rows']['売上高営業利益率'][0], r['rows']['売上高営業利益率'][5]))
        p(f"| {y}（{J[y][1]}） | {r['n']}（{r['n_good']}） | {c('売上高営業利益率')} | {c('売上高経常利益率')} | {c('売上高経常利益率(償却前)')} | {c('人件費対売上高比率')} | {c('損益分岐点比率')} | {c('借入金回転期間')} |")
    if len(means) >= 2:
        ms = [m for _, m, _ in means]; sds = [s for _, _, s in means]
        p(f'\n営業利益率の平均の年ごとの値：' + '、'.join(f'{y} {m:+.1f}' for y, m, _ in means) + f'。4つの年度の平均の幅 {max(ms) - min(ms):.1f}ポイント、同じ年度の会社の間の標準偏差 {min(sds):.1f}〜{max(sds):.1f}。')
        p('平時の2つの年度（2019・2025）だけを比べると平均の差は小さいが、コロナの年度を入れると平均そのものが約20ポイント動く。「年ごとの動きより店ごとの差が35倍」（版0.2の0章1）は、平時の2点だけを比べた値で、取り消す。\n')

# A2. 黒字企業と平均の差（2025年度、中華料理店）
r = get('2025年度', 'ind', '中華料理店')
if r:
    p('## A2. 中華料理店（2025年度）：黒字かつ自己資本プラス企業の平均と、全体の平均の差\n')
    n, ng = r['n'], r['n_good']
    p(f'黒字かつ自己資本プラス企業は {ng}/{n}社＝**上の{ng / n * 100:.0f}%**（黒字でも債務超過の会社は入らない）。この平均は「上手な店（上の1〜2割）」の値ではない。表に上位10%の列はない。\n')
    p('| 指標 | 平均 | 黒字かつ自己資本プラス | 差 | 残りの会社の平均（逆算の目安） | 中央値 |'); p('|---|---|---|---|---|---|')
    for k in ['売上高総利益率', '売上高営業利益率', '売上高経常利益率(償却前)', '人件費対売上高比率', '諸経費対売上高比率', '店舗面積3.3㎡当たり売上高', '従業者１人当たり売上高', '従業者１人当たり人件費', '人件費対粗付加価値額比率', '１企業当たり店舗面積', '損益分岐点比率', '借入金回転期間']:
        v = r['rows'].get(k)
        if not v or v[0] is None: continue
        rest = (v[0] * n - v[1] * ng) / (n - ng)
        d = v[1] - v[0]
        dd = f'{d:+.1f}' if abs(v[0]) < 200 else f'{d:+.0f}（{d / v[0] * 100:+.0f}%）'
        p(f'| {k} | {v[0]:g} | {v[1]:g} | {dd} | {rest:.1f} | {v[2]:g} |')
    p('\n読み：黒字企業は原価率がほぼ同じ（総利益率の差は1ポイント未満）で、売場の面積あたりの売上が高く、諸経費・人件費の比率が低い。上の側の差は「原価」でなく「売上の密度と固定費の薄まり」に出る。残りの会社の平均は、指標ごとの平均から逆に出した目安で、同じ会社の組の値ではない。\n')

# A3. 規模別：代表者の報酬の重み
p('## A3. 中華料理店（2025年度、規模別）：利益の幅と、人件費（代表者の報酬を含む）の重み\n')
r = get('2025年度', 'size', '中華料理店')
if r:
    p(f'調査対象数 {r["n"]}。列は 平均±標準偏差。\n')
    p('| 指標 | 1〜4人 | 5〜9人 | 10〜19人 | 21〜49人 |'); p('|---|---|---|---|---|')
    for k in ['売上高営業利益率', '売上高経常利益率', '売上高経常利益率(償却前)', '粗付加価値額対売上高比率', '従業者１人当たり人件費', '人件費対粗付加価値額比率', '損益分岐点比率']:
        v = r['rows'].get(k)
        if not v: continue
        p(f'| {k} | ' + ' | '.join(f'{v[i]:,g}±{v[i + 1]:,g}' for i in range(0, 8, 2)) + ' |')
    p('\n1〜4人の段は人件費が粗付加価値を上回る（人件費対粗付加価値額比率が100%超）。公庫の表の説明は、小さな会社では人件費や借入に代表者と家族の分が多く含まれる、と断っている（r4-mgmt-jfc-shihyou の⑫）。小さな法人の営業利益率は、代表者がいくら報酬を取るかで上下する。\n')

# ---------- B. 上場ラーメン会社の利益率（上の端の実例） ----------
p('## B. 上場ラーメン会社の営業利益率（有報の損益計算書。上の端の実例）\n')
LIST = [('丸千代山岡家 2026/1', 4678935, 43000813, '営業利益'), ('力の源HD 2025/3（連結）', 2809961, 34166110, '営業利益'),
        ('幸楽苑 2026/3', 1515473, 29404657, '営業利益'), ('ギフトHD 2025/10（連結）', 3374634, 35878100, '経常利益（営業利益は本文で未確認）')]
p('| 会社 | 利益（千円） | 売上（千円） | 率 | 利益の種類 |'); p('|---|---|---|---|---|')
for nme, a, b, k in LIST: p(f'| {nme} | {a:,} | {b:,} | {a / b * 100:.1f}% | {k} |')
p('\n読み：+10% 前後は、実在のラーメン会社が出している値（上場まで伸びた会社、生き残りの偏りあり）。公庫の中華料理店の黒字企業平均（上の43%の平均）+3.3% と、上場会社の5〜11% の間に「上手な店」が入る。上の1割の店の利益率は、どちらの資料からも直接は出ない。\n')

# ---------- C. 上場チェーンの費目：行をそろえる ----------
p('## C. 上場チェーンの人件費と場所の費用：含める行をそろえる\n')
p('数字は各有報の損益計算書・販管費の注記（千円）。「そろえた人件費」＝役員報酬＋給料・手当＋雑給＋賞与（引当金繰入）＋法定福利費＋福利厚生費＋退職給付費用のうち、注記に出る行の全部。注記にない行がある社は「そろえられない」とする。「場所の費用」＝地代家賃・賃借料＋販管費の減価償却費。\n')
CO = [
 ('幸楽苑 2026/3（単体、郊外と駅前）', 29404657, {'役員報酬': 120018, '給料及び手当': 8469339, '賞与引当金繰入額': 600095, '退職給付費用': 12396, '福利厚生費': 1061792}, {'賃借料': 2499573, '減価償却費': 659306}, 'そろう（法定福利費の行はなく、福利厚生費に含むとみた【推論】）。工場の労務費（当期総製造費用 約49.9億円×11.2%）は売上原価の側'),
 ('丸千代山岡家 2026/1（単体、郊外・24時間・店炊き）', 43000813, {'役員報酬': 112950, '給料及び手当': 4339752, '雑給': 9220738, '法定福利費': 1395995, '退職給付費用': 136752, '福利厚生費': 66489}, {'地代家賃': 1046079, '賃借料': 30668, '減価償却費': 664437}, 'そろう。店舗設備は原則自社保有（有報の事業等のリスク）'),
 ('ギフトHD 2025/10（連結、家系・急拡大）', 35878100, {'給料及び手当': 3339829, '雑給': 5097250, '法定福利費': 695083, '賞与引当金繰入額': 353926}, {'賃借料': 2675456, '減価償却費': 1178286}, 'そろえられない：役員報酬・福利厚生費・退職給付費用が連結の主要な費目に出ない。売上にプロデュース店への卸を含む'),
 ('ハイデイ日高 2026/2（単体、駅前の中華食堂）', 62252860, {'役員報酬': 91200, '給与手当': 18116722, '賞与引当金繰入額': 551991, '退職給付費用': 133277}, {'賃借料': 5017897, '減価償却費': 1424298}, 'そろえられない：法定福利費・福利厚生費の行が主要な費目の注記にない'),
 ('力の源HD 2025/3（連結、都心・海外）', 34166110, {'給料及び手当': 8318673, '退職給付費用': 61155, '賞与引当金繰入額': 4257}, {'地代家賃': 3812584, '減価償却費': 928749}, 'そろえられない：雑給（パート）が主要な費目に出ない。海外の店を含む連結'),
]
p('| 会社 | 人件費の行 | 人件費率 | 場所の費用（行） | 場所の費用率 | 比べられるか |'); p('|---|---|---|---|---|---|')
for nme, s, pe, pl, note in CO:
    p(f"| {nme} | {'＋'.join(pe)} | {sum(pe.values()) / s * 100:.1f}% | {'＋'.join(pl)} | {sum(pl.values()) / s * 100:.1f}% | {note} |")
p('\n版0.2の行（会社ごとに足した行が違う）：幸楽苑 30.8%（給料＋賞与だけ）・山岡家 35.4%・ギフト 23.5%（給料＋雑給）・日高 30.3%・力の源 24.3%（給料だけ）。')
p('そろえて比べられるのは幸楽苑と山岡家の2社で、人件費率は **34.9% と 35.5% でほぼ同じ**。「型の差は人件費に出る」は言えない。場所の費用は山岡家 4.0%・幸楽苑 10.7% で差があるが、山岡家は店舗設備を自社で持ち（減価償却に出る分のほか、建物の取得に投資 CF を使う）、地代家賃の比率だけでは立地の差と建物の持ち方の差を分けられない。\n')

# ---------- D. ラーメン店の1日の客数：密度・標本・上位25%の境の幅 ----------
p('## D. ラーメン店の1日の客数（厚労省2014年、表1）：密度・標本の大きさ・上位25%の境の幅\n')
f = raw('law', 'primary', 'r4-mgmt-mhlw-chuka.pdf')
if os.path.exists(f):
    t = pdftext(f)
    m = re.search(r'中華そば（ラーメン）店\s+((?:[\d.]+%\s+){10})100\.0%\s+([\d.]+)', t)
    pc = [float(x) for x in re.findall(r'([\d.]+)%', m.group(1))]; avg = float(m.group(2))
    bins = [(0, 20), (20, 30), (30, 40), (40, 50), (50, 60), (60, 80), (80, 100), (100, 150), (150, None)]
    p('| 階級（人） | 割合% | 幅 | 1人の幅あたりの密度（%/人） |'); p('|---|---|---|---|')
    for (lo, hi), x in zip(bins, pc[:9]):
        p(f'| {lo}〜{"" if hi is None else hi - 1} | {x} | {"上限なし" if hi is None else hi - lo} | {"—" if hi is None else f"{x / (hi - lo):.3f}"} |')
    p(f'| 不詳 | {pc[9]} | | |\n')
    p(f'- 同じ幅50人で比べると 50〜99人 {sum(pc[4:7]):.1f}%、100〜149人 {pc[7]:.1f}%。密度は 20〜29人から80〜99人まで下がり続け、100〜149人でわずかに上がるだけ。**形は「二山」ではなく、右に長い尾を持つ一山**（版0.2の「二山」は階級の幅の違いの見かけ）。')
    # 標本の大きさ：図5の規模別の施設数×図7の「中華そば店」の割合
    sizes = {'1人': 26, '2人': 76, '3人': 42, '4人': 35, '5～9人': 111, '10～19人': 42, '20人以上': 26, '不詳': 8}
    share = {'1人': 69.2, '2人': 47.4, '3人': 52.4, '4人': 40.0, '5～9人': 22.5, '10～19人': 28.6, '20人以上': 26.9, '不詳': 25.0}
    nr = sum(sizes[k] * share[k] / 100 for k in sizes)
    p(f'- ラーメン店の施設数（図5の規模別施設数×図7の規模別の「中華そば（ラーメン）店」の割合の和）：約{nr:.0f}施設（366施設の中華料理店のうち）。13.2%＝約{0.132 * nr:.0f}施設で整数に近く、按分の確かめになる。')
    p(f'- 150人以上の階級（11.8%）の平均の逆算：全体の平均 {avg}人から、ほかの階級を中央の値で置いて出すと約' + f'{(avg * (100 - pc[9]) - sum(x * ((lo + hi) / 2) for (lo, hi), x in zip(bins[:8], pc[:8]))) / pc[8]:.0f}人【推論：階級の中央の値で置いた】。\n')
    def quant(probs, q, top=300):
        tot = sum(probs); cum = 0
        for (lo, hi), x in zip(bins, probs):
            hi = top if hi is None else hi
            sh = x / tot
            if cum + sh >= q: return lo + (q - cum) / sh * (hi - lo)
            cum += sh
    base = pc[:9]
    rows = [('不詳を除く（版0.2と同じ）', base), ('不詳をすべて20人未満とみる', [base[0] + pc[9]] + base[1:]), ('不詳をすべて150人以上とみる', base[:8] + [base[8] + pc[9]])]
    p('| 前提 | 下位25%の境 | 中央値 | 上位25%の境 |'); p('|---|---|---|---|')
    for nme, pr in rows: p(f'| {nme} | {quant(pr, .25):.0f} | {quant(pr, .5):.0f} | {quant(pr, .75):.0f} |')
    # 標本の揺れ：約136施設を多項分布で引き直す（乱数の種を固定）
    random.seed(20261022); N = round(nr); q50 = []; q75 = []
    cats = list(range(9)); w = base
    for _ in range(5000):
        cnt = [0] * 9
        for c in random.choices(cats, weights=w, k=N): cnt[c] += 1
        if sum(cnt[:8]) == 0: continue
        q50.append(quant(cnt, .5)); q75.append(quant(cnt, .75))
    q50.sort(); q75.sort()
    lo, hi = int(len(q50) * .05), int(len(q50) * .95)
    p(f'| 標本の揺れ（{N}施設を多項分布で5,000回引き直す、90%の範囲） | — | {q50[lo]:.0f}〜{q50[hi]:.0f} | {q75[lo]:.0f}〜{q75[hi]:.0f} |')
    p('\n読み：中央値（約44人）は前提を変えても40〜50人の内に収まる。**上位25%の境（約99人）はちょうど階級の境（100人）にあり、前提と標本で70〜120人ほど動く**。較正点は「中央値 約44人（40〜50）」「上位25%の境 約100人（70〜120の幅）」と幅で渡す。\n')
else: p('原文なし\n')

# ---------- E. 開業1年目の立ち上がり（公庫パネル・深沼氏論文の表－3） ----------
p('## E. 開業の年の立ち上がりと、予想月商の達成（深沼ほか 2022、表－3と脚注）\n')
f = raw('web', 'bizmgmt', 'r5-cal-jfc-panel-inoue.pdf')
if os.path.exists(f):
    t = norm(pdftext(f))
    m = re.search(r'飲食店・宿泊業\s+([\d.]+)\s+([\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)', t)
    a = re.search(r'全業種計[（(]再掲[）)]\s+([\d.]+)\s+([\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)', t)
    if m and a:
        p('| 組 | 時点 | 飲食店・宿泊業 | 全業種計 | 差（ポイント） |'); p('|---|---|---|---|---|')
        p(f'| 新規開業追跡調査（2019年4〜9月に融資した開業1年以内の企業、調査は2020年7月・2021年7月＝コロナの間） | 2020年調査 | {m.group(1)} | {a.group(1)} | {float(a.group(1)) - float(m.group(1)):.1f} |')
        p(f'| 同上 | 2021年調査 | {m.group(2)} | {a.group(2)} | {float(a.group(2)) - float(m.group(2)):.1f} |')
        p(f'| 新規開業パネル調査（第4コーホート＝2016年開業、平時）の同じ経過月数に換算した値（脚注4の式） | 2020年調査相当（開業後13.8か月） | {m.group(5)} | {a.group(5)} | {float(a.group(5)) - float(m.group(5)):.1f} |')
        p(f'| 同上 | 2021年調査相当（開業後25.8か月） | {m.group(6)} | {a.group(6)} | {float(a.group(6)) - float(m.group(6)):.1f} |')
        p(f'\n飲食店・宿泊業の n＝{m.group(7)}（追跡調査の値）。表－3（予想月商達成企業の割合（業種別））と注1〜5による。平時の2016年開業の組では、飲食店・宿泊業 {m.group(5)}%・{m.group(6)}% が基準。\n')
    mm = re.search(r'2016年末が([\d.]+)万円、2017年末が([\d.]+)万円、2018年末が([\d.]+)万円', re.sub(r'\s', '', t))
    if mm:
        a1, a2, a3 = (float(x) for x in mm.groups())
        p(f'平均月商（パネル、全業種、融資先）：2016年末 {a1}万 → 2017年末 {a2}万 → 2018年末 {a3}万円。開業の年÷2年目＝{a1 / a2:.2f}、開業の年÷3年目＝{a1 / a3:.2f}。2016年末は開業から0〜12か月（平均5.9か月）。\n')
else: p('原文なし\n')

# ---------- F. 食中毒：全国（令和7年、厚労省の表）と石川県（2024年度） ----------
p('## F. 食中毒の頻度と重さ\n')
f = raw('law', 'primary', 'r4-calib-mhlw-shokuchu-r7.html')
if os.path.exists(f):
    s = sheet(f)
    sec = s.split('# ⑤施設別発生状況')[1] if '# ⑤施設別発生状況' in s else ''
    rows = {}
    for l in sec.split('\n'):
        c = l.split('\t')
        key = next((x for x in c[:4] if x in ('総数', '飲食店', '仕出屋', '旅館', '家庭', '販売店', '製造所', '不明')), None)
        if key and key not in rows:
            nums = [x for x in c[c.index(key) + 1:] if re.fullmatch(r'-?[\d.]+|-', x)]
            if len(nums) >= 7 and nums[0] != '-': rows[key] = (int(nums[0]), int(nums[3]), float(nums[6]) if nums[6] != '-' else float('nan'))
    p('### 全国（令和7年＝2025年、⑤施設別）\n')
    p('| 原因施設 | 事件 | 患者 | 1事件あたりの患者 |'); p('|---|---|---|---|')
    for k, (a, b, c) in rows.items(): p(f'| {k} | {a:,} | {b:,} | {c:.1f} |')
    lic = 1419489
    if '飲食店' in rows:
        p(f'\n飲食店の事件 {rows["飲食店"][0]}件 ÷ 飲食店営業の許可施設 {lic:,}（2011年3月末、V2）＝ **年 {rows["飲食店"][0] / lic * 100:.3f}%**（1万施設あたり年 {rows["飲食店"][0] / lic * 1e4:.1f}件）【推論 (b)：分子は2025年、分母は2011年の値で年が違う。許可は喫茶店営業を含まない飲食店営業】。版0.1の「1店あたり年0.1〜0.2%」（全国の飲食店を40万〜70万店とみた推測で割った値）より2〜4倍小さい。')
    mon = s.split('# ②月別発生状況')[1].split('# ③')[0] if '# ②月別発生状況' in s else ''
    p('\n### 月別（全原因施設、事件の数。②月別）\n')
    yr = {}
    lines = [l.split('\t') for l in mon.split('\n')]
    half = 0
    for c in lines:
        if c and c[0] in ('R7', 'R6', 'R5'):
            nums = [x for x in c[1:] if x != '']
            vals = [0 if x == '-' else int(x) for x in nums]
            if half % 3 == 0 and c[0] == 'R7' and len(vals) >= 21: pass
            yr.setdefault(c[0], []).append(vals)
            half += 1
    p('| 年 | ' + ' | '.join(f'{m}月' for m in range(1, 13)) + ' |'); p('|---|' + '---|' * 12)
    for y, parts in yr.items():
        if len(parts) < 2: continue
        first = parts[0][3::3][:6]; second = parts[1][0::3][:6]
        ev = first + second
        p(f'| {y} | ' + ' | '.join(str(x) for x in ev) + ' |')
    p('\n読み：事件の数は冬〜春（2〜4月、ノロウイルス）が最も多く、夏の山ではない。患者の数は大きな事件（給食・仕出し）で月ごとに大きく揺れる。\n')
else: p('原文なし\n')
f = raw('web', 'bizmgmt', 'r4-calib-ishikawa-shokuchu.pdf')
if os.path.exists(f):
    t = pdftext(f); i = t.find('令和６年度石川県食中毒発生状況', t.find('令和６年度石川県食中毒発生状況') + 1)
    pts = [(m.group(1), int(m.group(2))) for m in re.finditer(r'^\s*\d+\s+(R[67])\.\d+\.\d+\s+\S+\s+(\d+)\s+\d+\s+\d+', t[i:], re.M)]
    ps = [x for _, x in pts]
    cum = re.findall(r'^\s*\d+\s+R[67]\.\d+\.\d+\s+\S+\s+\d+\s+(\d+)\s+\d+', t[i:], re.M)
    p('### 石川県（2024年度の表。版0.2は「R6.」の行だけを数え、2025年1〜3月の「R7.」の5件を落としていた）\n')
    p(f'{len(ps)}件（うち R7 の行 {sum(1 for y, _ in pts if y == "R7")}件）。患者数 {ps}。合計 {sum(ps)}人（表の累計の最後 {cum[-1] if cum else "?"}人と照合）、中央値 {st.median(ps):g}人、最大 {max(ps)}人、1人の件 {ps.count(1)}件。\n')

# ---------- G. 地域ごとの損益分岐点：固定費の形を地域で変える ----------
p('## G. 地域ごとの損益分岐点（固定費の形を地域で変える。入力の区分を列に書く）\n')
cpi = list(csv.reader(io.StringIO(open(raw('web', 'bizmgmt', 'r5-cal-estat-cpi-item-yoy.html'), 'rb').read().decode('cp932'))))
j = cpi[0].index('中華そば（外食）'); mult = 1.0
for row in cpi:
    if row and row[0].strip().isdigit() and 2015 <= int(row[0].strip()) <= 2025: mult *= 1 + float(row[j]) / 100
P0 = 885.8 * mult
p(f'客単価の基準：885.8円（2014年、ラーメン店、厚労省）×中華そば（外食）の2015〜2025年の上昇 {mult:.3f}倍 ＝ {P0:.0f}円【(b)】。粗利と変動費を引いた残り（限界利益率）＝1−原価35%−変動費5%＝60%【原価は公庫 (a)、変動費は (c)】。営業 月26日【(c)】。\n')
# 最低賃金（令和8年度、r6-cal-mhlw-minwage-pref2026）
MW = {}
f = raw('law', 'primary', 'r6-cal-mhlw-minwage-pref2026_pdf.pdf')
if os.path.exists(f):
    for m in re.finditer(r'^\s*(\S+?(?:\s+\S)?)\s+([\d,]{5})\s+（\s*([\d,]{5})\s*\)', pdftext(f), re.M):
        MW[re.sub(r'\s', '', m.group(1))] = int(m.group(2).replace(',', ''))
p('最低賃金（令和8年度、答申された改定額）：' + '、'.join(f'{k} {MW[k]:,}' for k in ['東京', '愛知', '大阪', '宮城', '秋田', '全国加重平均'] if k in MW) + f'円（{len(MW)}行を読んだ）\n')
# 家賃（円/坪/月、飲食店可・共益費込み・税抜の募集賃料の中央値、2024年度上期、アットホーム）。名古屋・大阪と銀座の1階は図の表を画像で読んだ値
RENT = {'銀座（1階、全用途）': 34830, '渋谷（飲食店可）': 31176, '銀座（飲食店可）': 30246, '上野・浅草（飲食店可）': 19395,
        '大阪・梅田（飲食店可）': 19433, 'なんば・心斎橋（飲食店可）': 18551, '名古屋駅周辺（飲食店可）': 18325, '栄（飲食店可）': 16316}
p('家賃の (a)（アットホーム 2024年度上期、駅徒歩10分以内・5〜50坪の募集賃料の中央値。銀座の1階・名古屋・大阪は4・13〜16頁の図の表を画像で読んだ値）：' + '、'.join(f'{k} {v:,}' for k, v in RENT.items()) + '円/坪\n')
BLK = {'関東・甲信越': 1247.4, '近畿': 1495.5, '東海・北陸': 1217.6, '北海道・東北': 1189.7, '九州': 1197.6}
def price(b): return P0 * BLK[b] / 1269.2
# 固定費の形（すべて (c)）。家賃・時給の水準は (a)。人の厚さ・報酬・その他の固定費・広さ・値付けの上乗せが (c)
SHAPES = [
 # 名, 坪, 家賃円/坪, 家賃の区分, 時給, 時給の上乗せ, パート人日(8h×26日の人数), 店主の報酬, その他の固定費, 値段ブロック, 値付けの倍率
 ('銀座の1階（人を厚く、値付けは基準のまま）', 12, RENT['銀座（1階、全用途）'], '(a)', MW.get('東京', 1280), 1.2, 3.0, 300000, 300000, '関東・甲信越', 1.0),
 ('銀座の1階（同じ形で、値付けを1.2倍）', 12, RENT['銀座（1階、全用途）'], '(a)', MW.get('東京', 1280), 1.2, 3.0, 300000, 300000, '関東・甲信越', 1.2),
 ('渋谷（飲食可、標準の人）', 15, RENT['渋谷（飲食店可）'], '(a)', MW.get('東京', 1280), 1.1, 2.0, 300000, 250000, '関東・甲信越', 1.1),
 ('上野・浅草（飲食可）', 15, RENT['上野・浅草（飲食店可）'], '(a)', MW.get('東京', 1280), 1.0, 1.5, 250000, 200000, '関東・甲信越', 1.0),
 ('名古屋駅周辺（飲食可）', 15, RENT['名古屋駅周辺（飲食店可）'], '(a)', MW.get('愛知', 1195), 1.0, 1.5, 250000, 200000, '東海・北陸', 1.0),
 ('大阪・梅田（飲食可）', 15, RENT['大阪・梅田（飲食店可）'], '(a)', MW.get('大阪', 1231), 1.0, 1.5, 250000, 200000, '近畿', 1.0),
 ('地方都市の駅前（家賃 8,000円/坪）', 15, 8000, '(c)', MW.get('宮城', 1098), 1.0, 1.0, 250000, 150000, '北海道・東北', 1.0),
 ('郊外ロードサイド（家賃 5,000円/坪、広め）', 25, 5000, '(c)', MW.get('宮城', 1098), 1.0, 1.5, 250000, 200000, '北海道・東北', 1.0),
 ('過疎の町（家族で回す・建物は自己所有）', 15, 0, '(c)', MW.get('秋田', 1090), 1.0, 0.0, 150000, 120000, '北海道・東北', 1.0),
]
CM = 0.60; DAYS = 26
def fixed(sh):
    nm, tsubo, rent, rk, wage, up, part, owner, other, blk, pm = sh
    return tsubo * rent + wage * up * 8 * DAYS * part + owner + other
def be(sh): return fixed(sh) / (price(sh[9]) * sh[10] * CM) / DAYS
def profit(sh, n): return n * price(sh[9]) * sh[10] * CM * DAYS - fixed(sh)
p('| 地域と固定費の形 | 広さ（坪） | 家賃 円/坪（区分） | 時給（最低賃金×上乗せ） | パート（8時間×26日の人数） | 店主の報酬 | その他の固定費 | 客単価 | 月の固定費 | 分岐点の客数/日 | 1日44人の月の利益 | 1日100人 | 1日30人 |')
p('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for sh in SHAPES:
    nm, tsubo, rent, rk, wage, up, part, owner, other, blk, pm = sh
    p(f'| {nm} | {tsubo} | {rent:,}{rk} | {wage:,}×{up} | {part} | {owner:,} | {other:,} | {price(blk) * pm:.0f} | {fixed(sh):,.0f} | {be(sh):.0f} | {profit(sh, 44):+,.0f} | {profit(sh, 100):+,.0f} | {profit(sh, 30):+,.0f} |')
bes = [be(s) for s in SHAPES]
p(f'\n分岐点の最大÷最小 ＝ {max(bes) / min(bes):.1f}倍（固定費の形を変えたため。版0.2の「家賃・時給・値段だけで約1.5倍」は、固定費の形を全地域同じにした仮置きの写し）。')
p('オーナーの2つの例の確かめ：銀座の1階で1日100人のときの月の利益は、値付けを基準のままなら ' + f'{profit(SHAPES[0], 100):+,.0f}円（赤字）、値付けを1.2倍にすれば {profit(SHAPES[1], 100):+,.0f}円（分岐点の近く）。過疎の町（家族で回す）で1日30人のとき {profit(SHAPES[-1], 30):+,.0f}円（店主の報酬15万円を払った後）。どちらも固定費の形（(c)）を置いた結果で、例が「成り立ちうる」ことを示すだけ。\n')
# 中央値の店と両立する固定費
n_med = 44
std_cap = n_med * P0 * CM * DAYS
p(f'### 中央値の店（1日44人）と両立する固定費\n\n44人×{P0:.0f}円×{DAYS}日×{CM} ＝ 月 {std_cap:,.0f}円。公庫の中華料理店の損益分岐点比率の中央値は100.3%（中央値の店は利益0の近く）なので、**全国の「普通の店」の固定費は月70〜80万円ほど**でなければ両立しない【推論】。')
wg = MW.get('全国加重平均', 1177)
for nm, tsubo, rent, owner, part in [('例A：15坪・家賃8,000円/坪・店主20万・パート1人', 15, 8000, 200000, 1.0), ('例B：15坪・家賃10,000円/坪・店主15万・パート0.5人（家族の手伝い）', 15, 10000, 150000, 0.5), ('例C：18坪・家賃5,000円/坪・店主25万・パート1人', 18, 5000, 250000, 1.0)]:
    fx0 = tsubo * rent + owner + wg * 8 * DAYS * part
    other = std_cap - fx0
    p(f'- {nm}（時給は全国加重平均{wg:,}円）：ここまで月 {fx0:,.0f}円。分岐点を44人にする「その他の固定費」は月 {other:,.0f}円【較正：中央値の店で利益0になるよう逆に解いた (c)】')
p('\n版0.2の共通の仮置き（店主30万・パート1.5人・その他30万）は、家賃0円でも月約94万円で、中央値の店（月75万円の上限）はどの地域でも赤字になっていた。\n')
# 感度
p('### 感度（「上野・浅草」の行から1つずつ変える）\n')
base = SHAPES[2]; b0 = be(base)
def mod(sh, **kw):
    keys = ['nm', 'tsubo', 'rent', 'rk', 'wage', 'up', 'part', 'owner', 'other', 'blk', 'pm']
    d = dict(zip(keys, sh)); d.update(kw); return tuple(d[k] for k in keys)
p('| 変えたもの | 分岐点の客数/日 | 基準との比 |'); p('|---|---|---|')
for lab, kw in [('基準', {}), ('家賃を銀座の1階 34,830', {'rent': 34830}), ('家賃を0（建物を自分で持つ）', {'rent': 0}), ('パート 1.5→3人', {'part': 3.0}), ('パート 1.5→0（家族で回す）', {'part': 0.0}),
                ('店主の報酬 25万→0', {'owner': 0}), ('店主の報酬 25万→40万', {'owner': 400000}), ('その他の固定費 20万→10万', {'other': 100000}), ('値段 ×1.2', {'pm': 1.2}), ('広さ 15→10坪', {'tsubo': 10})]:
    v = be(mod(base, **kw)); p(f'| {lab} | {v:.0f} | {v / b0:.2f} |')
p('')


# ---------- G2. 都市別の中華そばの値段（小売物価統計 2025年平均）で客単価の地域の比を置き直す ----------
f = raw('web', 'bizmgmt', 'r6-cal-estat-kouri-2025nen.xlsx')
CITY = {}
if os.path.exists(f):
    sec = sheet(f).split('# 2102中華そば（外食）')[1].split('\n# ')[0]
    for l in sec.split('\n'):
        c = l.split('\t')
        if len(c) > 10 and re.fullmatch(r'\d{5}', c[7].strip()) and re.fullmatch(r'\d+', c[10].strip()):
            CITY[c[8].strip()] = int(c[10])
if CITY:
    vals = list(CITY.values()); mu = st.mean(vals)
    p(f'### 都市別の中華そば（外食）の値段（小売物価統計 2025年の年平均、しょう油味・持ち帰りを除く、{len(CITY)}市）\n')
    p(f'平均 {mu:.0f}円、中央値 {st.median(vals):.0f}円、最低 {min(CITY, key=CITY.get)} {min(vals)}円、最高 {max(CITY, key=CITY.get)} {max(vals)}円、標準偏差 {st.stdev(vals):.0f}円。')
    pick = ['東京都区部', '名古屋市', '大阪市', '仙台市', '秋田市', '札幌市', '福岡市', '八王子市']
    p('主な市（平均に対する比）：' + '、'.join(f'{k} {CITY[k]}円（{CITY[k] / mu:.2f}）' for k in pick if k in CITY) + '\n')
    p(f'読み：標準の1杯（しょう油ラーメン）の値段は、東京都区部が平均より安い（{CITY["東京都区部"] / mu:.2f}倍）。都心ほど値段が高い、とは言えない。中華料理店の地域ブロックの客単価の比（近畿1.18など）は業態の混ざりで、ラーメン1杯の値段の地域差ではない。\n')
    CR = {'関東・甲信越': CITY['東京都区部'] / mu, '東海・北陸': CITY['名古屋市'] / mu, '近畿': CITY['大阪市'] / mu, '北海道・東北': CITY['秋田市'] / mu}
    citymap = {'関東・甲信越': '東京都区部', '東海・北陸': '名古屋市', '近畿': '大阪市', '北海道・東北': '秋田市'}
    p('値段の比を都市の中華そばの比に替えた分岐点（客単価 ＝ 1,096円 × 都市の比 × 値付けの倍率。固定費の形は上の表と同じ。東北の地方・郊外・過疎には秋田市の比を当てた）：\n')
    p('| 地域と固定費の形 | 都市（比） | 客単価 | 分岐点の客数/日 | 1日100人 | 1日30人 |'); p('|---|---|---|---|---|---|')
    for sh in SHAPES:
        nm, tsubo, rent, rk, wage, up, part, owner, other, blk, pm = sh
        pr = P0 * CR[blk] * pm
        b_ = fixed(sh) / (pr * CM) / DAYS
        p(f'| {nm} | {citymap[blk]}（{CR[blk]:.2f}） | {pr:.0f} | {b_:.0f} | {100 * pr * CM * DAYS - fixed(sh):+,.0f} | {30 * pr * CM * DAYS - fixed(sh):+,.0f} |')
    p('')

# ---------- H. 同じ屋号の店の、地域ごとの1店の売上（有報の地域別の表） ----------
p('## H. 同じ屋号の、都道府県ごとの1店の年売上（有報）\n')
f = raw('web', 'ramen', 'r5-cal-kourakuen-yuho-a.pdf')
if os.path.exists(f):
    t = norm(pdftext(f)); i = t.find('地域別に示すと')
    rows = re.findall(r'^\s*(\S+?[都道府県])\s+([\d,]+)\s+([\d.]+)\s+(\d+)\s+([\d,]+)\s+([\d.]+)\s+(\d+)', t[i:i + 4000], re.M)
    per = [(k, int(c.replace(',', '')) / int(d) / 1000) for k, a, b, cc, c, e, d in rows]
    xs = [v for _, v in per]
    p(f'### 幸楽苑（直営、2026年3月期、{len(per)}都県）\n')
    p('1店の年売上（百万円）：' + '、'.join(f'{k} {v:.0f}' for k, v in sorted(per, key=lambda x: -x[1])) + f'。平均 {st.mean(xs):.0f}、最小÷最大 {min(xs) / max(xs):.2f}、変動係数 {st.stdev(xs) / st.mean(xs) * 100:.0f}%\n')
f = raw('web', 'ramen', 'r5-cal-yamaokaya-yuho2026.pdf')
if os.path.exists(f):
    t = norm(pdftext(f))
    stores = {k: int(v) for k, v in re.findall(r'^\s*(\S+?[都道府県])(\d+)店舗', t, re.M)}
    i = t.find('販売実績を都道府県別'); seg = t[i:i + 3000]
    sales = {k: (int(v.replace(',', '')), g) for k, v, g in re.findall(r'^\s*(\S+?[都道府県])\s+([\d,]+)\s+([\d.]+|−)', seg, re.M)}
    per = [(k, sales[k][0] / stores[k] / 1000, stores[k]) for k in sales if k in stores and stores[k] >= 3]
    xs = [v for _, v, _ in per]
    p(f'### 丸千代山岡家（2026年1月期、期末の店数3以上の{len(per)}道県。店数 計{sum(stores.values())}）\n')
    p('1店の年売上（百万円、期中に出した店は年の途中からの売上なので低めに出る）：' + '、'.join(f'{k} {v:.0f}（{n}店）' for k, v, n in sorted(per, key=lambda x: -x[1])) + f'。平均 {st.mean(xs):.0f}、最小÷最大 {min(xs) / max(xs):.2f}\n')
p('読み：幸楽苑（同じ屋号・同じ値段・店の大きさが近い）の1店の売上は、都県の間で最小÷最大0.73・変動係数9%。山岡家は店数の少ない県ほど1店の売上が高く（期中に出した店・大きな新しい店の混ざり）、北海道（55店）が最も低い。同じ屋号の地域差は、家賃・固定費の形の差（G の表）より小さい【推論】。\n')

# ---------- I. 費用の続き方（前年比の自己相関）と1社の年の揺れ ----------
p('## I. 費用の前年比の続き方（自己相関）と、1社の営業利益率の年の揺れ\n')
items = ['小麦粉', '豚肉（国産品）', '食用油', '電気代', '都市ガス代', '中華そば（外食）', '外食']
yrs = [r for r in cpi if r and r[0].strip().isdigit() and 2006 <= int(r[0].strip()) <= 2025]
p('| 品目 | 2006〜2025年の前年比の1年ずらしの自己相関 | 上がった年が続いた最長 |'); p('|---|---|---|')
for it in items:
    if it not in cpi[0]: continue
    k = cpi[0].index(it); xs = [float(r[k]) for r in yrs]
    ac = corr(xs[:-1], xs[1:]); run = best = 0
    for x in xs:
        run = run + 1 if x > 0 else 0; best = max(best, run)
    p(f'| {it} | {ac:+.2f} | {best}年 |')
opm = [5.1, 3.2, 0.2, 1.5, 2.2, 2.8, 5.1, 3.9, 2.4, 3.2, 4.3, 2.3, 2.0, 2.8, 7.8, 10.7, 10.9]
d = [b - a for a, b in zip(opm, opm[1:])]
p(f'\n山岡家（2010〜2026年1月期、説明資料39〜41頁の図。版0.3で読み直した値）の営業利益率の前年差：標準偏差 {st.stdev(d):.1f}ポイント、絶対値の中央値 {st.median([abs(x) for x in d]):.1f}。公庫の会社の間の標準偏差（7.6）は、1社の年の揺れ（約2）より大きい。**店の素質の幅（会社の間）と、1店の年の揺れは別の量**。\n')


# ---------- K. 中華そば（外食）の月別と曜日（家計調査 2025年の日別支出、補填の担当が取得した12か月） ----------
import datetime
p('## K. 中華そば（外食）の2025年の月別と、平日・土日の差（家計調査 第6-16表 日別支出、二人以上の世帯）\n')
rowsK = []
for mth in range(1, 13):
    f = raw('web', 'bizmgmt', f'r6-fc-estat-kakei-hibetsu-2025{mth:02d}.html')
    if not os.path.exists(f): continue
    s_ = sheet(f).split('\n')
    blk = []
    for l in s_:
        if l.startswith('# '):
            if blk: break
            continue
        blk.append(l)
    def row(name):
        for l in blk:
            c = l.split('\t')
            if name in c:
                i = c.index('円') if '円' in c else None
                if i is None: continue
                return [float(x) if x not in ('', '-') else 0.0 for x in c[i + 1:]]
    for name in ['中華そば', '外食']:
        v = row(name)
        if not v: continue
        ndays = (datetime.date(2025 + (mth == 12), mth % 12 + 1, 1) - datetime.date(2025, mth, 1)).days
        days = v[:ndays]; total = v[-1]
        wd = [x for d, x in enumerate(days, 1) if datetime.date(2025, mth, d).weekday() < 5]
        we = [x for d, x in enumerate(days, 1) if datetime.date(2025, mth, d).weekday() >= 5]
        rowsK.append((mth, name, total, st.mean(wd), st.mean(we)))
if rowsK:
    p('| 月 | 中華そば 月の支出（円） | 平日の1日平均 | 土日の1日平均 | 土日÷平日 | 外食 月の支出（円） | 外食の土日÷平日 |'); p('|---|---|---|---|---|---|---|')
    by = {}
    for mth, name, tot, wd, we in rowsK: by.setdefault(mth, {})[name] = (tot, wd, we)
    for mth in sorted(by):
        c = by[mth].get('中華そば'); g = by[mth].get('外食')
        if not c: continue
        p(f'| {mth}月 | {c[0]:,.0f} | {c[1]:.1f} | {c[2]:.1f} | {c[2] / c[1]:.2f} | {g[0]:,.0f} | {g[2] / g[1]:.2f} |' if g else f'| {mth}月 | {c[0]:,.0f} | {c[1]:.1f} | {c[2]:.1f} | {c[2] / c[1]:.2f} | — | — |')
    tots = [by[m]['中華そば'][0] for m in sorted(by) if '中華そば' in by[m]]
    mean = st.mean(tots)
    p(f'\n中華そばの月の支出：12か月の平均 {mean:,.0f}円、最多 {max(tots):,.0f}円（{sorted(by)[tots.index(max(tots))]}月、平均の{max(tots) / mean:.2f}倍）、最少 {min(tots):,.0f}円（{sorted(by)[tots.index(min(tots))]}月、{min(tots) / mean:.2f}倍）。月の日数の違いを含む金額。土日÷平日は祝日を平日に数えた値（祝日を分けると平日はさらに低い向き）。\n')
    p('調査の条件：二人以上の世帯の家計簿で、店の売上ではない。単身の世帯・訪日客・会社員の小遣いの昼食は入らない（平日を低く見せる向き）。\n')

# ---------- L. 店の密度と需要の大きさ（V1 の別の読み） ----------
p('## L. 都道府県のラーメン店の密度と、人口1人あたりのラーメン店の売上（2016年）\n')
f1 = raw('web', 'bizmgmt', 'r5-cal-stat-jinsui2016-gaiyou3.pdf'); f2 = raw('web', 'bizmgmt', 'r5-cal-estat-census2016-inshoku.html')
if os.path.exists(f1) and os.path.exists(f2):
    POP = {}
    for m in re.finditer(r'\d+\s+((?:[^\s\d]\s*){2,4}?[都道府県])\s+([\d,]+)\s+[\d.]+\s+[\d,]+\s+[\d.]+', pdftext(f1)):
        POP[re.sub(r'\s', '', m.group(1))] = int(m.group(2).replace(',', '')) * 1000
    rows_ = list(csv.reader(io.StringIO(open(f2, 'rb').read().decode('cp932'))))
    D = []
    for r_ in rows_:
        if len(r_) > 14 and '7624' in r_[6] and r_[3] != '全国' and r_[3] in POP:
            n_, sales_, ind_ = int(r_[7]), int(r_[13]), int(r_[14])
            D.append((r_[3], n_ / POP[r_[3]] * 1e5, sales_ * 1e6 / POP[r_[3]], sales_ / n_ * 100 / 12, ind_ / n_))
    dens = [d[1] for d in D]; pc_ = [d[2] for d in D]; per = [d[3] for d in D]; indv = [d[4] for d in D]
    p(f'{len(D)}都道府県。相関：密度と1店の月売上 r＝{corr(dens, per):.2f}、密度と人口1人あたりの年のラーメン店売上 r＝{corr(dens, pc_):+.2f}、密度と個人の店の割合 r＝{corr(dens, indv):+.2f}、1人あたり売上と1店の月売上 r＝{corr(pc_, per):+.2f}。\n')
    p('| 都道府県 | 10万人あたり店数 | 1店の月売上（万円） | 1人あたり年の売上（円） | 個人の店の割合 |'); p('|---|---|---|---|---|')
    for d in sorted(D, key=lambda d: -d[1])[:5] + sorted(D, key=lambda d: d[1])[:5]:
        p(f'| {d[0]} | {d[1]:.1f} | {d[3]:.0f} | {d[2]:,.0f} | {d[4] * 100:.0f}% |')
    p('\n読み：店の多い県は、1人あたりのラーメンの売上（需要）も大きい。「店が多いと1店の取り分が減る」（奪い合い）と「需要の大きい所に店が多い」（需要に合わせた出店）の両方の読みがあり、この県の表からはどちらとも決められない【推論】。\n')

# ---------- M. 原価の上がりと売値の上がり：率と円 ----------
p('## M. ラーメン原価指数と中華そばの売値：率と円（T1 の検算）\n')
k = cpi[0].index('中華そば（外食）'); prod = 1.0
for r_ in cpi:
    if r_ and r_[0].strip().isdigit() and 2021 <= int(r_[0].strip()) <= 2025: prod *= 1 + float(r_[k]) / 100
c0 = 0.35; c1 = c0 * 1.41 / prod
p(f'中華そば（外食）の2021〜2025年の前年比の積 ＝ {prod:.3f}（+{(prod - 1) * 100:.1f}%、年率 {(prod ** 0.2 - 1) * 100:.1f}%）。ラーメン原価指数 2020→2025年 100→141（+41%、年率 {(1.41 ** 0.2 - 1) * 100:.1f}%。2025年は11月までの平均で、水道光熱費を含まない）。累計の比 {41 / ((prod - 1) * 100):.1f}倍、年率の比 {((1.41 ** 0.2 - 1)) / (prod ** 0.2 - 1):.1f}倍。')
p(f'原価率35%の店が材料+41%・売値+{(prod - 1) * 100:.1f}%を受けると、原価率は {c0 * 100:.1f}% → {c1 * 100:.1f}%。1杯の粗利（売値を基準1とした円）は {1 - c0:.3f} → {(prod - c0 * 1.41) / 1:.3f}（売値が上がった分を含めた円）で、**率は下がり、円はほぼ横ばい**。\n')

# ---------- J. その他の検算 ----------
p('## J. その他の検算\n')
p(f'- G1：山岡家の純資産 14.7億→101.3億円（10年で +86.6億円）。1億円÷86.6億円＝1/{86.6:.0f}。力の源 13.1→106.6億円（4年で +93.5億円）＝1/94、ギフト 41.2→103.8億円（4年で +62.6億円）＝1/63。版0.2の「約10分の1」は誤り。')
p(f'- X2 の減損：2024年10月期 国内8店÷前期末直営 約236店＝{8 / 236 * 100:.1f}%、2025年10月期 国内4店＋米国1店＝5店÷287＝{5 / 287 * 100:.1f}%。')
p(f'- M41：1−(1−0.299)^0.5＝{1 - (1 - 0.299) ** 0.5:.3f}。')
p(f'- M42：14.7%（5年）→年 {(1 - (1 - 0.147) ** 0.2) * 100:.1f}%、24.1%（5年）→年 {(1 - (1 - 0.241) ** 0.2) * 100:.1f}%。')
p(f'- M44：飲食・宿泊の5年の廃業 2016年開業 14.7%、過去の組 24.1%・23.2%・18.9%。4組の平均 {st.mean([14.7, 24.1, 23.2, 18.9]):.1f}%。')
p(f'- M35：値下げした飲食業のうち「客数は増加」15.1%、残り {100 - 15.1:.1f}%。')
p(f'- 公庫の利率（2026年10月）：無担保・2期以上の基準利率 4.05〜5.65%、2期未満の基準利率 3.85〜5.45%、有担保の基準利率 3.05〜5.25%、表の中の最も低い値 2.15%（有担保の特別利率J）。')

print('\n'.join(out))
