#!/usr/bin/env python3
"""BIZ-FILL-RAMEN 1.1 の季節（S1）。1.0 の fill-season-hibetsu.py の「13は休み・14は8月の水準」の分け方を使わず、
日の型の置き方を変えた幅を出す。あわせて、こづかいの行の土日÷平日、お盆の前後の平日、2023・2024年への当てはめ、日の復元抽出の幅。
資料：家計調査 第6-16表 日別支出 2025年1〜12月（research/raw/web/bizmgmt/r6-fc-estat-kakei-hibetsu-2025MM.html、tools/sheet-text.py で読む）、
      中華そば（外食）の月次 2023年1月〜2025年11月（research/raw/web/ramen/r5-rmn-gdfreak-chukasoba1.html、家計調査の転記）。
使い方: python3 -I boki2/docs/analysis/fill-ramen-season-v2.py   （出力は fill-ramen-season-v2.out.txt に保存して報告から指す）
"""
import os, re, html, datetime, subprocess, statistics, random
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'research', 'raw', 'web')
TOOL = os.path.join(ROOT, 'tools', 'sheet-text.py')
HOL = {2023: {(1, 1), (1, 2), (1, 9), (2, 11), (2, 23), (3, 21), (4, 29), (5, 3), (5, 4), (5, 5), (7, 17), (8, 11), (9, 18), (9, 23), (10, 9), (11, 3), (11, 23)},
       2024: {(1, 1), (1, 8), (2, 11), (2, 12), (2, 23), (3, 20), (4, 29), (5, 3), (5, 4), (5, 5), (5, 6), (7, 15), (8, 11), (8, 12), (9, 16), (9, 22), (9, 23), (10, 14), (11, 3), (11, 4), (11, 23)},
       2025: {(1, 1), (1, 13), (2, 11), (2, 23), (2, 24), (3, 20), (4, 29), (5, 3), (5, 4), (5, 5), (5, 6), (7, 21), (8, 11), (9, 15), (9, 23), (10, 13), (11, 3), (11, 23), (11, 24)}}
NEN = {(12, 29), (12, 30), (12, 31), (1, 1), (1, 2), (1, 3)}

_cache = {}
def rows(m, item):
    f = os.path.join(RAW, 'bizmgmt', f'r6-fc-estat-kakei-hibetsu-2025{m:02d}.html')
    if f not in _cache: _cache[f] = subprocess.run(['python3', '-I', TOOL, f], capture_output=True, text=True).stdout
    t = _cache[f]
    sheet = None; out = {}
    nd = (datetime.date(2025 + (m == 12), m % 12 + 1, 1) - datetime.date(2025, m, 1)).days
    for line in t.split('\n'):
        if line.startswith('# '): sheet = line[2:4]; continue
        c = line.split('\t')
        if len(c) > 13 and c[11].strip() == item and c[12] == '円':
            v = [float(x) for x in c[13:] if x.strip() != '']
            out[sheet] = (v[:nd], v[-1])
    return out

def make_kind(obon=((8, 13), (8, 16)), obon_type='お盆', summer=False):
    o0, o1 = datetime.date(2025, *obon[0]), datetime.date(2025, *obon[1])
    def kind(d):
        md = (d.month, d.day)
        if md in NEN: return '年末年始'
        if obon_type and datetime.date(2025, d.month, d.day) >= o0 and datetime.date(2025, d.month, d.day) <= o1 and d.year == 2025:
            if obon_type == 'お盆': return 'お盆'
            if obon_type == '祝日': return '休日'
        if md in HOL.get(d.year, set()): return '休日'
        if d.weekday() >= 5: return '休日'
        if summer and (datetime.date(d.year, 7, 21) <= d <= datetime.date(d.year, 8, 31)): return '夏休みの平日'
        return '平日'
    return kind

def fit(daily, kind, iters=60):
    kinds = sorted({kind(datetime.date(2025, m, i + 1)) for m in daily for i in range(len(daily[m]))})
    w = {k: 1.0 for k in kinds}; lev = {}
    for _ in range(iters):
        for m in daily:
            lev[m] = sum(daily[m]) / sum(w[kind(datetime.date(2025, m, i + 1))] for i in range(len(daily[m])))
        for k in kinds:
            num = sum(x for m in daily for i, x in enumerate(daily[m]) if kind(datetime.date(2025, m, i + 1)) == k)
            den = sum(lev[m] for m in daily for i, x in enumerate(daily[m]) if kind(datetime.date(2025, m, i + 1)) == k)
            w[k] = num / den
        s = w['平日']; w = {k: v / s for k, v in w.items()}
    la = statistics.mean(lev.values())
    return {m: lev[m] / la * 100 for m in lev}, w

d = {m: rows(m, '中華そば') for m in range(1, 13)}
for sh, name in (('二人', '二人以上の世帯'), ('勤労', 'うち勤労者世帯')):
    daily = {m: d[m][sh][0] for m in d}; tot = {m: d[m][sh][1] for m in d}
    a = statistics.mean(tot.values()); raw = {m: tot[m] / a * 100 for m in tot}
    print(f'## {name}：中華そば（外食）2025年。8月の指数（そのまま）{raw[8]:.1f}、7月{raw[7]:.1f}、2月{raw[2]:.1f}、6月{raw[6]:.1f}')
    print('| 日の型の置き方 | 8月の水準（型を除く） | 8月の暦の分（そのまま−水準） | 7月の水準 | 型の倍率（平日＝1） |')
    print('|---|---|---|---|---|')
    cases = [('A お盆8/13〜16を固有の型（1.0 と同じ）', make_kind()),
             ('B お盆8/13〜16を休日と同じ型', make_kind(obon_type='祝日')),
             ('C お盆を型にしない（土日祝だけ）', make_kind(obon_type=None)),
             ('D お盆8/12〜16を固有の型', make_kind(obon=((8, 12), (8, 16)))),
             ('E お盆8/9〜17を固有の型', make_kind(obon=((8, 9), (8, 17)))),
             ('F お盆8/8〜19を固有の型', make_kind(obon=((8, 8), (8, 19)))),
             ('G お盆8/13〜16＋夏休みの平日（7/21〜8/31）を型に', make_kind(summer=True))]
    res = {}
    for lab, k in cases:
        lev, w = fit(daily, k)
        res[lab] = lev
        print(f'| {lab} | {lev[8]:.1f} | {raw[8] - lev[8]:+.1f} | {lev[7]:.1f} | ' + '・'.join(f'{kk} {v:.2f}' for kk, v in sorted(w.items())) + ' |')
    v8 = [r[8] for r in res.values()]
    print(f'8月の水準の幅：{min(v8):.1f}〜{max(v8):.1f}（7通り）。どの置き方でも100を超えて残る：{all(x > 100 for x in v8)}')
    # 日の復元抽出（月×型の中で日を入れ替える）。A の型で
    kA = cases[0][1]; random.seed(1); bs = []
    groups = {}
    for m in daily:
        for i, x in enumerate(daily[m]): groups.setdefault((m, kA(datetime.date(2025, m, i + 1))), []).append(x)
    for _ in range(400):
        # 各日を、同じ月・同じ型の日からの無作為な1日に置き換えて当てはめ直す
        lev, _ = fit({m: [random.choice(groups[(m, kA(datetime.date(2025, m, i + 1)))]) for i in range(len(daily[m]))] for m in daily}, kA, iters=25)
        bs.append(lev[8])
    bs.sort(); print(f'日の復元抽出（A、400回）：8月の水準の95%の幅 {bs[9]:.1f}〜{bs[389]:.1f}')
    # お盆の前後の平日
    aug = daily[8]; kinds8 = [kA(datetime.date(2025, 8, i + 1)) for i in range(31)]
    near = [aug[i] for i in range(31) if kinds8[i] == '平日' and (i + 1) in (8, 12, 18, 19)]
    other = [aug[i] for i in range(31) if kinds8[i] == '平日' and (i + 1) not in (8, 12, 18, 19)]
    yr = [x for m in daily for i, x in enumerate(daily[m]) if kA(datetime.date(2025, m, i + 1)) == '平日']
    print(f'8月の平日：お盆の前後（8/8・8/12・8/18・8/19）の平均{statistics.mean(near):.1f}円、ほかの8月の平日{statistics.mean(other):.1f}円、年の平日{statistics.mean(yr):.1f}円。8月の平日÷年の平日＝{statistics.mean(near + other) / statistics.mean(yr) * 100:.1f}')
    print()

# こづかいの行の土日÷平日（家計の中華そばに勤め先の昼食が出ない向きの目安）
print('## こづかい(使途不明) と 中華そば の、土日・祝÷平日（2025年、各日の値の平均どうし。年末年始の6日は除く。お盆は平日・土日の暦どおり）')
kC = make_kind(obon_type=None)
for item in ('こづかい(使途不明)', '中華そば', '外食'):
    for sh in ('二人', '勤労'):
        we, wd = [], []
        for m in range(1, 13):
            r = rows(m, item).get(sh)
            if not r: continue
            for i, x in enumerate(r[0]):
                k = kC(datetime.date(2025, m, i + 1))
                if k == '年末年始': continue  # 年末年始は土日・平日のどちらにも数えない
                (we if k == '休日' else wd).append(x)
        if wd: print(f'{item}（{sh}）：土日祝{statistics.mean(we):.1f}円÷平日{statistics.mean(wd):.1f}円＝{statistics.mean(we) / statistics.mean(wd):.2f}')
print()

# 2023・2024年への当てはめ（2025年の A の月の水準と型の倍率で、その年の暦の並びから月の指数を予測し、転記の月次と比べる）
s = open(os.path.join(RAW, 'ramen', 'r5-rmn-gdfreak-chukasoba1.html'), encoding='utf8').read()
t = html.unescape(re.sub(r'<[^>]+>', '\n', s)); t = [x.strip() for x in t.split('\n') if x.strip()]
mon = {}
for i, x in enumerate(t):
    mm = re.fullmatch(r'(20\d\d)年(\d+)月', x)
    if mm and i + 1 < len(t) and re.fullmatch(r'[\d,]+', t[i + 1]): mon[(int(mm.group(1)), int(mm.group(2)))] = float(t[i + 1].replace(',', ''))
dA = {m: d[m]['二人'][0] for m in d}
levA, wA = fit(dA, make_kind())
print('## 2023・2024年への当てはめ（二人以上の世帯、A の型の倍率は2025年の値）')
for y in (2023, 2024):
    def kk(dt, y=y):
        md = (dt.month, dt.day)
        if md in NEN: return '年末年始'
        if (8, 13) <= md <= (8, 16): return 'お盆'
        if md in HOL[y] or dt.weekday() >= 5: return '休日' if '休日' in wA else ('土' if dt.weekday() == 5 else '日')
        return '平日'
    cal = {}
    for m in range(1, 13):
        nd = (datetime.date(y + (m == 12), m % 12 + 1, 1) - datetime.date(y, m, 1)).days
        cal[m] = sum(wA.get(kk(datetime.date(y, m, i + 1)), wA.get('休日', 1)) for i in range(nd))
    pred = {m: levA[m] * cal[m] for m in cal}; pa = statistics.mean(pred.values())
    act = {m: mon[(y, m)] for m in range(1, 13)}; aa = statistics.mean(act.values())
    print(f'{y}年：8月の予測{pred[8] / pa * 100:.0f}・実際{act[8] / aa * 100:.0f}／7月の予測{pred[7] / pa * 100:.0f}・実際{act[7] / aa * 100:.0f}／2月の予測{pred[2] / pa * 100:.0f}・実際{act[2] / aa * 100:.0f}')
print('（転記の月次で8月が年の最多か：', {y: max(range(1, 13), key=lambda m: mon[(y, m)]) == 8 for y in (2023, 2024)}, '）')
