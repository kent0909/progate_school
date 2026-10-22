#!/usr/bin/env python3
"""公庫「小企業の経営指標調査」の飲食店の表を4つの調査年度（2019・2021・2023・2025年度）で並べる（BIZ-FILL-CALIB の JFC）。
2021・2023年度の表は公庫のサイトが503を返すため、国立国会図書館 WARP の保存版（2023年7月8日・2024年10月7日）から取った。
  2021年度：r6-fc-warp-jfc-202302-08a／08c（sme_findings2_202302_08a・08c、2023年2月掲載）
  2023年度：r6-fc-warp-jfc-2024-08a／08c（sme_findings2_08a・08c の2024年10月時点。WARP の一覧の頁に「2023年度…2024年8月」掲載）
  2019・2025年度：BIZ-CALIB が取った r5-cal-jfc-shihyou-202008-08a／08c と r4-calib-jfc-shihyou-08a／08c
読み方は calib-distributions.py の parse_jfc と同じ（その関数を写した。calib-distributions.py は BIZ-CALIB の担当のファイルなので変えない）。
使い方: python3 -I boki2/docs/analysis/fill-calib-jfc4.py > boki2/docs/analysis/fill-calib-jfc4.out.md
"""
import os, re, subprocess, statistics as st
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'research', 'raw', 'web', 'bizmgmt')
def pdftext(f): return subprocess.run(['pdftotext', '-layout', f, '-'], capture_output=True, text=True).stdout

def parse_jfc(f):
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
            mm = re.match(r'\s*(\S+?)\s*[（(]([^)）]+)[)）]\s+(.*)$', l)
            if not mm: continue
            vals = re.findall(r'-?[\d,]+\.\d+|-?[\d,]+|(?<!\S)-(?!\S)', mm.group(3))
            if len(vals) < 4: continue
            if mm.group(1) in rec['rows']: continue  # 「売上高経常利益率(償却前)」が同じ名に読めて上書きするのを防ぐ（最初の行を使う）
            rec['rows'][mm.group(1)] = [None if v == '-' else float(v.replace(',', '')) for v in vals]
        recs.append(rec)
    return recs

FILES = {'2019年度': ('r5-cal-jfc-shihyou-202008-08a.pdf', 'r5-cal-jfc-shihyou-202008-08c.pdf'),
         '2021年度': ('r6-fc-warp-jfc-202302-08a.pdf', 'r6-fc-warp-jfc-202302-08c.pdf'),
         '2023年度': ('r6-fc-warp-jfc-2024-08a.pdf', 'r6-fc-warp-jfc-2024-08c.pdf'),
         '2025年度': ('r4-calib-jfc-shihyou-08a.pdf', 'r4-calib-jfc-shihyou-08c.pdf')}
J = {}
for y, fs in FILES.items():
    J[y] = []
    for f in fs:
        p = os.path.join(ROOT, f)
        if os.path.exists(p): J[y] += parse_jfc(p)
def get(y, kind, name):
    for r in J[y]:
        if r['kind'] == kind and r['name'] == name: return r

# 業種別の列：平均・黒字かつ自己資本プラス企業平均・中央値・上方・下方信頼限界・標準偏差
IND = [('売上高営業利益率', '営業利益率%'), ('売上高経常利益率', '経常利益率%'), ('売上高総利益率', '総利益率%'), ('人件費対売上高比率', '人件費率%'),
       ('損益分岐点比率', '損益分岐点比率%'), ('店舗面積3.3㎡当たり売上高', '3.3㎡売上 千円'), ('借入金回転期間', '借入金 月商の月数'), ('自己資本比率', '自己資本比率%')]
print('# 公庫の経営指標の4つの調査年度（fill-calib-jfc4.py の出力。手で書き換えない）\n')
for name in ['中華料理店', '一般飲食店', '喫茶店', '飲食店，宿泊業']:
    print(f'## {name}（業種別）\n')
    print('| 指標 | ' + ' | '.join(J) + ' | 4年度の平均の幅（最大−最小） | 標準偏差の4年度の平均 |')
    print('|---|' + '---|' * (len(J) + 2))
    recs = {y: get(y, 'ind', name) for y in J}
    print('| 調査対象数（黒字かつ自己資本プラス） | ' + ' | '.join(f"{r.get('n')}（{r.get('n_good')}）" if r else '—' for r in recs.values()) + ' | | |')
    for k, lab in IND:
        cells, means, sds = [], [], []
        for y, r in recs.items():
            v = r['rows'].get(k) if r else None
            if v and len(v) >= 6 and None not in (v[0], v[1], v[2], v[5]):
                cells.append(f'平均 {v[0]:g}・中央値 {v[2]:g}・黒字企業 {v[1]:g}・標準偏差 {v[5]:g}'); means.append(v[0]); sds.append(v[5])
            else: cells.append('—')
        rng = f'{max(means) - min(means):.1f}' if len(means) > 1 else ''
        print(f'| {lab} | ' + ' | '.join(cells) + f' | {rng} | {st.mean(sds):.1f} |' if sds else f'| {lab} | ' + ' | '.join(cells) + ' | | |')
    print()
SIZE = [('売上高営業利益率', '営業利益率%'), ('売上高経常利益率', '経常利益率%'), ('損益分岐点比率', '損益分岐点比率%')]
for name in ['中華料理店', '一般飲食店']:
    print(f'## {name}（従業者規模別：1〜4人／5〜9人／10〜19人／20(21)〜49人、平均±標準偏差）\n')
    print('| 指標 | 年度 | 調査対象数 | 1〜4人 | 5〜9人 | 10〜19人 | 20(21)〜49人 | 標準偏差の比（最小の段÷最大の段） |')
    print('|---|---|---|---|---|---|---|---|')
    for k, lab in SIZE:
        for y in J:
            r = get(y, 'size', name)
            v = r['rows'].get(k) if r else None
            if not v or len(v) < 8: print(f'| {lab} | {y} | — | | | | | |'); continue
            pairs = [(v[2 * i], v[2 * i + 1]) for i in range(4)]
            print(f'| {lab} | {y} | {r["n"]} | ' + ' | '.join(f'{a:g}±{b:g}' for a, b in pairs) + f' | {pairs[0][1] / pairs[3][1]:.1f} |')
    print()
# 営業利益率の平均と経常利益率の平均の差（営業外の収支、コロナの支援金を含む年の目安）
print('## 営業利益率と経常利益率の平均の差（中華料理店、業種別）\n')
print('| 年度 | 営業利益率 平均 | 経常利益率 平均 | 差（経常−営業） |')
print('|---|---|---|---|')
for y in J:
    r = get(y, 'ind', '中華料理店')
    if r and '売上高営業利益率' in r['rows'] and '売上高経常利益率' in r['rows']:
        a, b = r['rows']['売上高営業利益率'][0], r['rows']['売上高経常利益率'][0]
        print(f'| {y} | {a:g} | {b:g} | {b - a:+.1f} |')
