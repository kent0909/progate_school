#!/usr/bin/env python3
"""季節（暦と月）の分解：BIZ-FILL-RAMEN の S1（家計の8月の山は暦か気温か）に使う。
資料：家計調査 家計収支編 二人以上の世帯 第6-16表「1世帯当たり1か月間の日別支出」2025年1〜12月（e-Stat の Excel）。
  原文は BIZ-FILL-CALIB の担当が research-fetch で取得したもの（research/raw/web/bizmgmt/r6-fc-estat-kakei-hibetsu-2025MM.html）。
  ここでは自分で tools/sheet-text.py で文字にして、中華そば（外食）の行の日ごとの値と「計」を読み直す（又引きしない）。
やること：
 1. 月ごとの「計」から月別の指数（12か月平均＝100）。
 2. 日の値 ＝ 月の水準 × 日の型の倍率（平日・土・日・祝日・お盆8/13〜16・年末年始12/29〜1/3）の掛け算の形を、
    交互に平均を取る方法で当てはめ、「日の型の並びの違い（暦）を取り除いた月の水準」を出す。
    差（暦を除く前と後）が、その月の山・谷のうち「休みの日の多さ」で説明できる分。
使い方: python3 -I boki2/docs/analysis/fill-season-hibetsu.py [原文のディレクトリ]
"""
import sys, os, datetime, subprocess, statistics
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'research', 'raw', 'web', 'bizmgmt')
TOOL = os.path.join(ROOT, 'tools', 'sheet-text.py')
# 2025年の国民の祝日・振替休日（内閣府の一覧の日付。fill-calib-youbi.py と同じ）
HOL = {(1, 1), (1, 13), (2, 11), (2, 23), (2, 24), (3, 20), (4, 29), (5, 3), (5, 4), (5, 5), (5, 6), (7, 21), (8, 11), (9, 15), (9, 23), (10, 13), (11, 3), (11, 23), (11, 24)}
NEN = {(12, 29), (12, 30), (12, 31), (1, 1), (1, 2), (1, 3)}
OBON = {(8, 13), (8, 14), (8, 15), (8, 16)}
def kind(d):
    md = (d.month, d.day)
    if md in NEN: return '年末年始'
    if md in OBON: return 'お盆'
    if md in HOL: return '祝日'
    return {5: '土', 6: '日'}.get(d.weekday(), '平日')
def read(m, item='中華そば', sheet_prefix='二人'):
    f = os.path.join(RAW, f'r6-fc-estat-kakei-hibetsu-2025{m:02d}.html')
    t = subprocess.run(['python3', '-I', TOOL, f], capture_output=True, text=True).stdout
    sheet = None
    for line in t.split('\n'):
        if line.startswith('# '): sheet = line[2:]; continue
        c = line.split('\t')
        if sheet and sheet.startswith(sheet_prefix) and len(c) > 13 and c[11].strip() == item and c[12] == '円':
            v = [float(x) for x in c[13:] if x.strip() != '']
            ndays = (datetime.date(2025 + (m == 12), m % 12 + 1, 1) - datetime.date(2025, m, 1)).days
            return v[:ndays], v[-1]  # 日ごとの値, 計
    raise SystemExit(f'{m}月の {item} が見つからない')
for sheet in ('二人', '勤労'):
    daily, tot = {}, {}
    for m in range(1, 13):
        daily[m], tot[m] = read(m, sheet_prefix=sheet)
    a = statistics.mean(tot.values())
    raw_ix = {m: tot[m] / a * 100 for m in tot}
    # 掛け算の形の当てはめ
    kinds = ['平日', '土', '日', '祝日', 'お盆', '年末年始']
    w = {k: 1.0 for k in kinds}
    lev = {m: statistics.mean(daily[m]) for m in daily}
    for _ in range(50):
        for m in daily:
            ds = [(datetime.date(2025, m, i + 1), x) for i, x in enumerate(daily[m])]
            lev[m] = sum(x for _, x in ds) / sum(w[kind(d)] for d, _ in ds)
        for k in kinds:
            num = den = 0
            for m in daily:
                for i, x in enumerate(daily[m]):
                    d = datetime.date(2025, m, i + 1)
                    if kind(d) == k: num += x; den += lev[m]
            w[k] = num / den if den else 1
        s = w['平日']; w = {k: v / s for k, v in w.items()}  # 平日＝1に揃える
    la = statistics.mean(lev.values())
    adj_ix = {m: lev[m] / la * 100 for m in lev}
    print(f'## {"二人以上の世帯" if sheet=="二人" else "うち勤労者世帯"}：中華そば（外食）2025年')
    print('日の型の倍率（平日＝1）：' + '・'.join(f'{k} {w[k]:.2f}' for k in kinds))
    print('| 月 | 計（円） | 指数（そのまま） | 指数（暦の並びを除いた月の水準） | 差 |')
    print('|---|---|---|---|---|')
    for m in range(1, 13):
        print(f'| {m} | {tot[m]:.0f} | {raw_ix[m]:.0f} | {adj_ix[m]:.0f} | {raw_ix[m]-adj_ix[m]:+.0f} |')
    print()
