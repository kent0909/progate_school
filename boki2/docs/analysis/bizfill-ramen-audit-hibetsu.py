#!/usr/bin/env python3
"""BIZ-FILL-RAMEN の事実の判定（判定役）：家計調査の日別支出 2025年から、中華そば（外食）の数字を自分で計算し直す。
書き手の fill-season-hibetsu.py とは別に、原文の Excel（research/raw/web/bizmgmt/r6-fc-estat-kakei-hibetsu-2025MM.html）を
openpyxl で直接読む（tools/sheet-text.py を通さない）。

確かめる数：月の指数（8月127）、日の型の倍率（土日祝2.3・お盆2.24）、暦を除いた8月の水準（114）。
別の方法でも出して、方法で数がどれだけ動くかを見る：
  A. 書き手と同じ掛け算の当てはめ（交互の平均）を自分で書き直したもの
  B. 対数の回帰（log 値 ＝ 月 ＋ 日の型。最小二乗）
  C. 単純な比：休みの日の平均 ÷ 平日の平均（月を混ぜたまま）
  D. 8月の平日（お盆を除く）の平均 ÷ 他の月の平日の平均（日の型に頼らない「8月の水準」）
使い方: python3 -I boki2/docs/analysis/bizfill-ramen-audit-hibetsu.py
"""
import os, sys, shutil, tempfile, datetime, statistics, math
import openpyxl
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'research', 'raw', 'web', 'bizmgmt')
HOL = {(1, 1), (1, 13), (2, 11), (2, 23), (2, 24), (3, 20), (4, 29), (5, 3), (5, 4), (5, 5), (5, 6), (7, 21), (8, 11),
       (9, 15), (9, 23), (10, 13), (11, 3), (11, 23), (11, 24)}  # 2025年の祝日・振替休日
NEN = {(12, 29), (12, 30), (12, 31), (1, 1), (1, 2), (1, 3)}
OBON = {(8, 13), (8, 14), (8, 15), (8, 16)}
def kind(d):
    md = (d.month, d.day)
    if md in NEN: return '年末年始'
    if md in OBON: return 'お盆'
    if md in HOL: return '祝日'
    return {5: '土', 6: '日'}.get(d.weekday(), '平日')

def read(m, sheet_idx, item='中華そば'):
    f = os.path.join(RAW, f'r6-fc-estat-kakei-hibetsu-2025{m:02d}.html')
    t = tempfile.mkdtemp(); q = os.path.join(t, 'a.xlsx'); shutil.copy(f, q)
    wb = openpyxl.load_workbook(q, read_only=True, data_only=True)
    ws = wb.worksheets[sheet_idx]
    head = None
    for row in ws.iter_rows(values_only=True):
        if '1日' in row: head = list(row)
        if head and item in row and '円' in row:
            c1 = head.index('1日'); ck = head.index('計'); cu = head.index('日付不詳')
            nd = (datetime.date(2025 + (m == 12), m % 12 + 1, 1) - datetime.date(2025, m, 1)).days
            days = [float(row[c1 + i]) for i in range(nd)]
            shutil.rmtree(t)
            return days, float(row[ck]), float(row[cu] or 0), wb.worksheets[sheet_idx].title
    raise SystemExit(f'{m}月 見つからない')

def solve(A, b):  # 最小二乗（正規方程式、ガウスの消去）
    n = len(A[0]); M = [[sum(A[r][i] * A[r][j] for r in range(len(A))) for j in range(n)] + [sum(A[r][i] * b[r] for r in range(len(A)))] for i in range(n)]
    for i in range(n):
        p = max(range(i, n), key=lambda r: abs(M[r][i])); M[i], M[p] = M[p], M[i]
        for r in range(n):
            if r != i:
                f = M[r][i] / M[i][i]; M[r] = [a - f * c for a, c in zip(M[r], M[i])]
    return [M[i][n] / M[i][i] for i in range(n)]

kinds = ['平日', '土', '日', '祝日', 'お盆', '年末年始']
for si in (0, 1):
    daily, tot, unk = {}, {}, {}
    for m in range(1, 13):
        daily[m], tot[m], unk[m], title = read(m, si)
    print(f'## シート {title}')
    print('月の計と日の合計の差（日付不詳の分）：' + ' '.join(f'{m}:{tot[m]-sum(daily[m]):.1f}/{unk[m]:.2f}' for m in range(1, 13)))
    a = statistics.mean(tot.values())
    raw = {m: tot[m] / a * 100 for m in tot}
    print('指数（そのまま、12か月の計の平均＝100）：' + ' '.join(f'{m}:{raw[m]:.1f}' for m in range(1, 13)))
    # A 掛け算の当てはめ
    w = {k: 1.0 for k in kinds}; lev = {}
    for _ in range(200):
        for m in daily:
            lev[m] = sum(daily[m]) / sum(w[kind(datetime.date(2025, m, i + 1))] for i in range(len(daily[m])))
        for k in kinds:
            num = den = 0
            for m in daily:
                for i, x in enumerate(daily[m]):
                    if kind(datetime.date(2025, m, i + 1)) == k: num += x; den += lev[m]
            w[k] = num / den
        s = w['平日']; w = {k: v / s for k, v in w.items()}
    la = statistics.mean(lev.values()); adjA = {m: lev[m] / la * 100 for m in lev}
    print('A 倍率：' + ' '.join(f'{k}{w[k]:.3f}' for k in kinds))
    print('A 暦を除いた水準：' + ' '.join(f'{m}:{adjA[m]:.1f}' for m in range(1, 13)))
    # B 対数の回帰
    X, y = [], []
    for m in daily:
        for i, x in enumerate(daily[m]):
            k = kind(datetime.date(2025, m, i + 1))
            X.append([1.0 if m == mm else 0.0 for mm in range(1, 13)] + [1.0 if k == kk else 0.0 for kk in kinds[1:]]); y.append(math.log(x))
    beta = solve(X, y)
    wb_ = {kk: math.exp(beta[12 + j]) for j, kk in enumerate(kinds[1:])}
    levB = {m: math.exp(beta[m - 1]) for m in range(1, 13)}; lb = statistics.mean(levB.values())
    adjB = {m: levB[m] / lb * 100 for m in levB}
    print('B 倍率：' + ' '.join(f'{k}{v:.3f}' for k, v in wb_.items()))
    print('B 暦を除いた水準（幾何の月の水準、平均＝100）：' + ' '.join(f'{m}:{adjB[m]:.1f}' for m in range(1, 13)))
    # C 単純な比
    by = {k: [] for k in kinds}
    for m in daily:
        for i, x in enumerate(daily[m]): by[kind(datetime.date(2025, m, i + 1))].append(x)
    wd = statistics.mean(by['平日'])
    print('C 単純な比（各型の平均÷平日の平均）：' + ' '.join(f'{k}{statistics.mean(v)/wd:.3f}(n{len(v)})' for k, v in by.items()))
    hol = by['土'] + by['日'] + by['祝日']
    print(f'C 土日祝をまとめて÷平日：{statistics.mean(hol)/wd:.3f}')
    # D 平日だけの月の比
    wdm = {m: statistics.mean([x for i, x in enumerate(daily[m]) if kind(datetime.date(2025, m, i + 1)) == '平日']) for m in daily}
    aw = statistics.mean(wdm.values())
    print('D 平日だけの月の水準（平均＝100）：' + ' '.join(f'{m}:{wdm[m]/aw*100:.1f}' for m in range(1, 13)))
    hdm = {m: statistics.mean([x for i, x in enumerate(daily[m]) if kind(datetime.date(2025, m, i + 1)) in ('土', '日', '祝日')]) for m in daily}
    ah = statistics.mean(hdm.values())
    print('D 土日祝だけの月の水準（平均＝100、8月はお盆を除く）：' + ' '.join(f'{m}:{hdm[m]/ah*100:.1f}' for m in range(1, 13)))
    # 8月の平日の中身（お盆の前後の平日が高いか）
    aug = [(datetime.date(2025, 8, i + 1), x) for i, x in enumerate(daily[8])]
    print('8月の日ごと（型）：' + ' '.join(f'{d.day}{kind(d)[0]}{x:.0f}' for d, x in aug))
    wd_aug_other = [x for d, x in aug if kind(d) == '平日' and not (8 <= d.day <= 19)]
    wd_aug_near = [x for d, x in aug if kind(d) == '平日' and (8 <= d.day <= 19)]
    print(f'8月の平日：お盆の近く(8/8〜8/19)の平均 {statistics.mean(wd_aug_near):.1f}(n{len(wd_aug_near)})、それ以外 {statistics.mean(wd_aug_other):.1f}(n{len(wd_aug_other)})、年の平日の平均 {wd:.1f}')
    # 8月の超過27ポイントの分け方
    print(f'8月：そのまま {raw[8]:.1f}、A {adjA[8]:.1f}、差 {raw[8]-adjA[8]:.1f}、B {adjB[8]:.1f}、D(平日) {wdm[8]/aw*100:.1f}')
    print()

# ---- お盆の日の決め方を変えたときの 8月の分け方（A の方法、二人以上の世帯）----
# 書き手はお盆を 8/13〜16 の4日に固定した。会社のお盆休みは 8/9（土）〜8/17（日）の並びが多い年なので、
# 平日の 8/12（火）なども休みの日になりうる。お盆の範囲を変えると「休みの日の多さで説明できる分」がどう動くかを見る。
def split_aug(obon):
    def kind2(d):
        md = (d.month, d.day)
        if md in NEN: return '年末年始'
        if md in obon: return 'お盆'
        if md in HOL: return '祝日'
        return {5: '土', 6: '日'}.get(d.weekday(), '平日')
    daily, tot = {}, {}
    for m in range(1, 13):
        daily[m], tot[m], _, _ = read(m, 0)
    a = statistics.mean(tot.values()); raw = tot[8] / a * 100
    w = {k: 1.0 for k in kinds}; lev = {}
    for _ in range(200):
        for m in daily:
            lev[m] = sum(daily[m]) / sum(w[kind2(datetime.date(2025, m, i + 1))] for i in range(len(daily[m])))
        for k in kinds:
            num = den = 0
            for m in daily:
                for i, x in enumerate(daily[m]):
                    if kind2(datetime.date(2025, m, i + 1)) == k: num += x; den += lev[m]
            w[k] = num / den
        s = w['平日']; w = {k: v / s for k, v in w.items()}
    adj = lev[8] / statistics.mean(lev.values()) * 100
    return raw, adj, w['お盆']
print('## お盆の範囲を変えたときの8月（二人以上の世帯、Aの方法）')
for label, ob in (('8/13〜16（書き手）', {(8, d) for d in range(13, 17)}),
                  ('8/12〜16', {(8, d) for d in range(12, 17)}),
                  ('8/9〜17（土日と山の日を含む9連休）', {(8, d) for d in range(9, 18)}),
                  ('8/8〜19（前後の平日も）', {(8, d) for d in range(8, 20)})):
    raw, adj, wo = split_aug(ob)
    print(f'{label}: そのまま {raw:.1f}、暦を除いた8月の水準 {adj:.1f}、休みの日で説明できる分 {raw-adj:.1f}、お盆の倍率 {wo:.2f}')
