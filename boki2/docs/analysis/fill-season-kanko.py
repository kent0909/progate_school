#!/usr/bin/env python3
# 観光庁 宿泊旅行統計 2025年確定値（第2表：延べ宿泊者数、宿泊目的割合別）から、都道府県ごとに
# 「観光目的の宿泊者が50%以上の施設」と「50%未満の施設」の月別指数（年平均＝100）を出す。BIZ-FILL-RAMEN の季節の表（観光地の型）に使う。
# 使い方: python3 -I boki2/docs/analysis/fill-season-kanko.py <取得した xlsx（research/raw/web/ramen/r6-fill-mlit-shukuhaku-2025.html を .xlsx として写したもの）>
import sys, openpyxl, statistics
wb = openpyxl.load_workbook(sys.argv[1], read_only=True)
data = {}
for m in range(1, 13):
    ws = wb[f'第2表({m}月)']
    for r in ws.iter_rows(values_only=True):
        v = [x for x in r if x is not None]
        if len(v) > 3 and isinstance(v[1], (int, float)) and isinstance(v[0], str):
            name = v[0].strip().lstrip('0123456789')
            if name.startswith('令和'): name = '全国'
            data.setdefault(name, {})[m] = (v[2], v[3])  # 観光50%以上, 50%未満
def idx(series):
    a = statistics.mean(series); return [round(x / a * 100) for x in series]
pick = sys.argv[2:] or ['全国', '北海道', '東京都', '京都府', '沖縄県', '長野県', '福島県', '福岡県', '青森県', '山形県']
print('都道府県\t区分\t' + '\t'.join(f'{m}月' for m in range(1, 13)) + '\t山/谷')
for p in pick:
    if p not in data or len(data[p]) < 12: print(p, 'なし'); continue
    for k, lab in ((0, '観光50%以上'), (1, '観光50%未満')):
        s = [data[p][m][k] for m in range(1, 13)]
        ix = idx(s)
        print(f'{p}\t{lab}\t' + '\t'.join(map(str, ix)) + f'\t{max(ix)}/{min(ix)}={max(ix)/min(ix):.2f}')
# 全都道府県の山/谷の比の分布（観光50%以上・未満）
for k, lab in ((0, '観光50%以上'), (1, '観光50%未満')):
    ratios = sorted((max(idx([data[p][m][k] for m in range(1, 13)])) / min(idx([data[p][m][k] for m in range(1, 13)])), p) for p in data if p[-1:] in '都道府県' and p != '全国' and len(data[p]) == 12 and all(data[p][m][k] for m in range(1, 13)))
    rs = [r for r, _ in ratios]
    print(f'{lab}: 都道府県{len(rs)}、山/谷の比 最小{rs[0]:.2f}（{ratios[0][1]}）・中央{statistics.median(rs):.2f}・最大{rs[-1]:.2f}（{ratios[-1][1]}）')
    # 8月が年間で最も多い都道府県の数
    n8 = sum(1 for p in data if p[-1:] in '都道府県' and p != '全国' and len(data[p]) == 12 and max(range(1, 13), key=lambda m: data[p][m][k]) == 8)
    print(f'  {lab}: 8月が最多の都道府県 {n8}')
