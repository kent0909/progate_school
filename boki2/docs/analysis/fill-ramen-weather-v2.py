#!/usr/bin/env python3
"""BIZ-FILL-RAMEN 1.1 の天候（気温と雨）。日本フードサービス協会の月次12本（2025年8月〜2026年8月、7月は欠け）から、
FF の「麺類」と FF 全体の前年同月比（売上・客数・店舗数）、東京の平均気温と雨天日数の今年と前年を読み、
「麺類−FF 全体」の差と気温の前年差の向きを並べる。協会の説明の文（麺類の理由）は報告の本文で原文の語句で引く。
使い方: python3 -I boki2/docs/analysis/fill-ramen-weather-v2.py
"""
import os, re, subprocess, statistics
RAW = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'research', 'raw', 'web', 'ramen')
MONTHS = ['202508', '202509', '202510', '202511', '202512', '202601', '202602', '202603', '202604', '202605', '202606', '202608']
rows = []
for ym in MONTHS:
    t = subprocess.run(['pdftotext', '-layout', os.path.join(RAW, f'r6-fill-jf-{ym}.pdf'), '-'], capture_output=True, text=True).stdout
    sec = t.split('２．全店時系列データ')[0]
    nl = [l for l in sec.split('\n') if '(N=' in l and '%' in l]
    def pct(l): return [float(x) for x in re.findall(r'(\d+\.\d)%', l)]
    tot, ff, men = pct(nl[0]), pct(nl[1]), pct(nl[4])   # 全体・FF 合計・麺類（表の並び：全体・FF 合計・洋風・和風・麺類・…）
    y, m = int(ym[:4]), int(ym[4:])
    ref = re.findall(r'(\d{4})年\s+(\d+)月\s+(\d+)日\s+(\d+)日\s+(\d+)日\s+([\d.]+)\s+(\d+)日\s+([\d.]+)', t)
    cur = [r for r in ref if int(r[0]) == y][0]; prev = [r for r in ref if int(r[0]) == y - 1][0]
    rows.append(dict(ym=ym, tot=tot[0], ff=ff[0], men=men[0], men_store=men[1], men_cust=men[2], ff_cust=ff[2],
                     temp=float(cur[5]), dtemp=float(cur[5]) - float(prev[5]), rain=int(cur[4]), drain=int(cur[4]) - int(prev[4]),
                     dhol=int(cur[2]) - int(prev[2])))
print('| 年月 | 全体の売上 | FF の売上 | 麺類の売上 | 麺類の客数 | 麺類の店舗数 | 麺類−FF（売上） | 東京の平均気温（前年差） | 雨天日数（前年差） | 休日の数の前年差 |')
print('|---|---|---|---|---|---|---|---|---|---|')
for r in rows:
    print(f"| {r['ym'][:4]}年{int(r['ym'][4:])}月 | {r['tot']}% | {r['ff']}% | {r['men']}% | {r['men_cust']}% | {r['men_store']}% | {r['men'] - r['ff']:+.1f} | {r['temp']}℃（{r['dtemp']:+.1f}） | {r['rain']}日（{r['drain']:+d}） | {r['dhol']:+d} |")
def corr(a, b):
    ma, mb = statistics.mean(a), statistics.mean(b)
    return sum((x - ma) * (y - mb) for x, y in zip(a, b)) / (sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b)) ** 0.5
d = [r['men'] - r['ff'] for r in rows]
print(f"\n「麺類−FF」と気温の前年差の相関 r＝{corr(d, [r['dtemp'] for r in rows]):.2f}（12点）、雨天日数の前年差との相関 r＝{corr(d, [r['drain'] for r in rows]):.2f}")
print(f"「麺類−FF」と気温の水準の相関 r＝{corr(d, [r['temp'] for r in rows]):.2f}")
warm = [r for r in rows if r['dtemp'] > 0]; cool = [r for r in rows if r['dtemp'] < 0]
print(f"前年より暑い月 {len(warm)}：麺類−FF の平均 {statistics.mean([r['men'] - r['ff'] for r in warm]):+.1f}／前年より涼しい月 {len(cool)}：{statistics.mean([r['men'] - r['ff'] for r in cool]):+.1f}")
print("麺類の売上から店舗数の伸びを引いた値（店の数の増えを除いた目安）：" + '、'.join(f"{r['ym']} {r['men'] - r['men_store']:+.1f}" for r in rows))
