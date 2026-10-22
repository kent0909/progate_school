#!/usr/bin/env python3
"""曜日・祝日の需要の倍率（BIZ-FILL-CALIB の W1、BIZ-CALIB M16 の補填）。
資料：家計調査 家計収支編 二人以上の世帯 月次 第6-16表「品目分類による日別支出」2025年1〜12月（e-Stat、Excel）。
  取得は research-fetch（doc 名 r6-fc-estat-kakei-hibetsu-2025MM）。Excel は tools/sheet-text.py で文字にして読む。
やること：日ごとの支出を、その月の日の平均で割って「月の効果」を除き、曜日の型（月〜木・金・土・日・祝日・年末年始・お盆）ごとに平均と標準偏差を出す。
  祝日は 2025年の国民の祝日と振替休日（内閣府の一覧で確かめた日付をここに書いた）。年末年始は12/29〜12/31と1/1〜1/3、お盆は8/13〜8/16（祝日と重なる日は年末年始・お盆を優先）。
使い方: python3 -I boki2/docs/analysis/fill-calib-youbi.py [raw のディレクトリ]   （出力は標準出力。同じ名の .out.txt に保存して報告から指す）
"""
import sys, os, datetime, statistics, subprocess, collections
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'research', 'raw', 'web', 'bizmgmt')
TOOL = os.path.join(ROOT, 'tools', 'sheet-text.py')
HOL = {(1, 1), (1, 13), (2, 11), (2, 23), (2, 24), (3, 20), (4, 29), (5, 3), (5, 4), (5, 5), (5, 6), (7, 21), (8, 11), (9, 15), (9, 23), (10, 13), (11, 3), (11, 23), (11, 24)}
NENMATSU = {(12, 29), (12, 30), (12, 31), (1, 1), (1, 2), (1, 3)}
OBON = {(8, 13), (8, 14), (8, 15), (8, 16)}
ITEMS = ['中華そば', '外食', '日本そば・うどん', 'ハンバーガー', '喫茶代', '食料']

def kind(d):
    md = (d.month, d.day)
    if md in NENMATSU: return '年末年始'
    if md in OBON: return 'お盆'
    if md in HOL: return '祝日'
    return ['月〜木', '月〜木', '月〜木', '月〜木', '金', '土', '日'][d.weekday()]

def read(month):
    f = os.path.join(RAW, f'r6-fc-estat-kakei-hibetsu-2025{month:02d}.html')
    t = subprocess.run(['python3', '-I', TOOL, f], capture_output=True, text=True).stdout
    out = {}; sheet = None
    for line in t.split('\n'):
        if line.startswith('# '): sheet = line[2:]; continue
        c = line.split('\t')
        if len(c) > 40 and c[11] in ITEMS and c[12] == '円':
            key = (sheet, c[11])
            if key in out: continue  # 同じ名の最初の行（大分類の「外食」は1行目）
            out[key] = [float(x) if x not in ('', '-') else None for x in c[13:13 + 31]]
    return out

data = {m: read(m) for m in range(1, 13)}
print('# 曜日・祝日の倍率（家計調査 2025年の日別支出、各日の値÷その月の日の平均）\n')
for sheet_prefix, label in (('二人', '二人以上の世帯'), ('勤労', '二人以上の世帯のうち勤労者世帯')):
    print(f'## {label}\n')
    print('| 品目 | 型 | 日数 | 倍率の平均 | 標準偏差 | 最小 | 最大 |')
    print('|---|---|---|---|---|---|---|')
    for it in ITEMS:
        by = collections.defaultdict(list)
        for m in range(1, 13):
            key = [k for k in data[m] if k[0].startswith(sheet_prefix) and k[1] == it]
            if not key: continue
            v = data[m][key[0]]
            ndays = (datetime.date(2025 + (m == 12), m % 12 + 1, 1) - datetime.timedelta(days=1)).day
            vals = [x for x in v[:ndays] if x is not None]
            mean = sum(vals) / len(vals)
            for d in range(1, ndays + 1):
                if v[d - 1] is None: continue
                by[kind(datetime.date(2025, m, d))].append(v[d - 1] / mean)
        for k in ('月〜木', '金', '土', '日', '祝日', 'お盆', '年末年始'):
            x = by[k]
            if not x: continue
            print(f'| {it} | {k} | {len(x)} | {statistics.mean(x):.2f} | {statistics.pstdev(x):.2f} | {min(x):.2f} | {max(x):.2f} |')
    print()
# 週の中の山と谷の比（中華そば、二人以上）
