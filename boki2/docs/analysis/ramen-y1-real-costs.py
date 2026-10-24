#!/usr/bin/env python3
"""実店舗の推計ではなく、ゲーム内費用の範囲を合わせるための会計上の試算。"""
from pathlib import Path
import json
sales=44*26*850*1.12
lines=['|otherFixed|商店街・家賃12万の費用小計（減価償却除外／算入）|同・売上比|3立地×家賃±20%の売上比（償却込み）|','|---|---|---|---|']
for other in [100000,150000,200000]:
 util=round(50000+0.04*sales)
 no_dep=other+120000+util
 low=other+90000*.8+util+25000
 high=other+200000*1.2+util+25000
 lines.append(f'|{other/10000:.0f}万円|{no_dep/10000:.2f}／{(no_dep+25000)/10000:.2f}万円|{100*no_dep/sales:.2f}／{100*(no_dep+25000)/sales:.2f}%|{100*low/sales:.2f}〜{100*high/sales:.2f}%|')
lines += ['',f'計算条件：44人/日×26日×850円×1.12点＝月商{sales:,.0f}円。光熱費＝50,000円＋売上4%＝{util:,}円。償却25,000円。看板・高い仕入先・広告等の追加費用は0とした例で、実店舗の標準値やシミュレーションの再測定ではない。', 'J-Net21表の比率：その他固定費1683/売上9388＝'+f'{1683/9388*100:.2f}%。'+f'1社当たり月額は1683/12＝{1683/12:.2f}万円。ただし従業員17.7人・複数店舗を含む黒字60社の企業平均であり、1店舗の固定費とはみなさない。']
Path('boki2/docs/analysis/ramen-y1-real-costs-table.md').write_text('\n'.join(lines)+'\n')
print('\n'.join(lines))
