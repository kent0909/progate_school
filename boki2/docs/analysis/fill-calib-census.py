#!/usr/bin/env python3
"""中華料理店・ラーメン店の事業所数の推移と、立地の型ごとの1店の売上（BIZ-FILL-CALIB の CENSUS）。
資料（e-Stat、経済センサス‐活動調査）：
  2012年（平成24年、2012年2月）第13表 飲食店（細分類）… r6-fc-estat-census2012-inshoku（CSV、Shift_JIS）
  2016年（平成28年、2016年6月）第17表 … BIZ-CALIB が取った r5-cal-estat-census2016-inshoku（CSV、Shift_JIS）
  2021年（令和3年、2021年6月）サービス関連産業 第1表（小分類まで）… r6-fc-estat-census-000040032976（xlsx）
  2021年 立地環境特性編 第1表 … r6-fc-estat-census-000040186980（xlsx）
注意：2021年の表は小分類「76B 中華料理店」までで、細分類（7623 中華料理店・7624 ラーメン店）に分けていない。76B は 762 専門料理店の中の中華料理店の集まり。
売上は前年の1年（2012年の表は2011年、2016年の表は2015年、2021年の表は2020年）。
使い方: python3 -I boki2/docs/analysis/fill-calib-census.py
"""
import csv, io, os, subprocess
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'research', 'raw', 'web', 'bizmgmt')
def sj(f): return open(os.path.join(RAW, f), 'rb').read().decode('cp932', errors='replace')
def sheet(f): return subprocess.run(['python3', '-I', os.path.join(ROOT, 'tools', 'sheet-text.py'), os.path.join(RAW, f)], capture_output=True, text=True).stdout
out = {}
for y, f in (('2012', 'r6-fc-estat-census2012-inshoku.html'), ('2016', 'r5-cal-estat-census2016-inshoku.html')):
    for r in csv.reader(io.StringIO(sj(f))):
        if len(r) > 13 and r[3] == '全国':
            name = r[6].strip()
            for k in ('76 飲食店', '76B 中華料理店', '7623 中華料理店', '7624 ラーメン店', '762A 中華料理店，ラーメン店格付不能'):
                if name == k: out[(y, k)] = (int(r[7]), int(r[13]))
t21 = sheet('r6-fc-estat-census-000040032976.xlsx')
for l in t21.split('\n'):
    c = l.split('\t')
    if len(c) > 7 and c[0] == '00_全国' and c[4] == '0_総数' and c[3] in ('76_飲食店', '76B_中華料理店'):
        out[('2021', {'76_飲食店': '76 飲食店', '76B_中華料理店': '76B 中華料理店'}[c[3]])] = (int(c[5]), int(c[7]))
if ('2012', '76B 中華料理店') not in out:  # 2012年の表には 76B の行がないので、細分類の3行を足す
    k = [out[('2012', x)] for x in ('7623 中華料理店', '7624 ラーメン店', '762A 中華料理店，ラーメン店格付不能')]
    out[('2012', '76B 中華料理店（7623＋7624＋762A の和）')] = (sum(a for a, _ in k), sum(b for _, b in k))
print('## 事業所数と売上（全国、民営）\n')
print('| 年 | 区分 | 事業所数 | 売上（百万円） | 1事業所の年売上（万円） |'); print('|---|---|---|---|---|')
for (y, k), (n, s) in sorted(out.items()):
    print(f'| {y} | {k} | {n:,} | {s:,} | {s / n * 100:,.0f} |')
a = out[('2016', '76B 中華料理店')][0]; b = out[('2021', '76B 中華料理店')][0]
print(f'\n76B の 2016→2021：{a:,} → {b:,}（{(b / a - 1) * 100:+.1f}%）')
a = out[('2012', '7624 ラーメン店')][0]; b = out[('2016', '7624 ラーメン店')][0]
print(f'ラーメン店（細分類）2012→2016：{a:,} → {b:,}（{(b / a - 1) * 100:+.1f}%）')
a = out[('2012', '7623 中華料理店')][0]; b = out[('2016', '7623 中華料理店')][0]
print(f'中華料理店（細分類）2012→2016：{a:,} → {b:,}（{(b / a - 1) * 100:+.1f}%）')
print('\n## 立地の型ごとの 76B 中華料理店（2021年、売上は2020年）\n')
print('| 立地の型 | 事業所数 | 従業者数 | 売上（百万円） | 1事業所の年売上（万円） | 1事業所の従業者 |'); print('|---|---|---|---|---|---|')
for l in sheet('r6-fc-estat-census-000040186980.xlsx').split('\n'):
    c = l.split('\t')
    if len(c) >= 6 and c[2] == '76B_中華料理店':
        n, p, s = int(c[3]), int(c[4]), int(c[5])
        print(f'| {c[0]} | {n:,} | {p:,} | {s:,} | {s / n * 100:,.0f} | {p / n:.1f} |')

# ---- 版2で足した（事実の判定 U11・U12、論証の検査 Z10〜Z12） ----
print('\n## 版2：飲食店全体（76）との比べ（調査の作りの変化と分けるため）\n')
for y in ('2012', '2016', '2021'):
    k76 = out[(y, '76 飲食店')][0]
    k76b = out[(y, '76B 中華料理店')][0] if (y, '76B 中華料理店') in out else out[(y, '76B 中華料理店（7623＋7624＋762A の和）')][0]
    print(f'- {y}年：76 飲食店 {k76:,}、76B {k76b:,}、76B÷76 = {k76b / k76 * 100:.2f}%')
g = lambda y0, y1, k: out[(y1, k)][0] / out[(y0, k)][0] - 1
b12 = out[('2012', '76B 中華料理店（7623＋7624＋762A の和）')][0]; b16 = out[('2016', '76B 中華料理店')][0]
print(f'- 76 の伸び：2012→2016 {g("2012", "2016", "76 飲食店") * 100:+.1f}%、2016→2021 {g("2016", "2021", "76 飲食店") * 100:+.1f}%。76B の伸び：2012→2016 {(b16 / b12 - 1) * 100:+.1f}%')
print('\n## 版2：2016年の 76B のうち細分類（7623・7624）に入らない残りと、振り方の幅\n')
c12, r12, u12 = out[('2012', '7623 中華料理店')][0], out[('2012', '7624 ラーメン店')][0], out[('2012', '762A 中華料理店，ラーメン店格付不能')][0]
c16, r16 = out[('2016', '7623 中華料理店')][0], out[('2016', '7624 ラーメン店')][0]
rest = b16 - c16 - r16
print(f'- 2016年の残り：{b16:,} − {c16:,} − {r16:,} = {rest:,}（76B の {rest / b16 * 100:.1f}%）。2012年の格付不能 {u12:,}（{u12 / b12 * 100:.1f}%）')
for lab, fr in (('残りをどちらにも入れない（版1の読み）', 0), ('残りを全部ラーメン店に', 1), ('残りを全部中華料理店に', -1), ('残りを2016年の細分類の比で振る', None)):
    if fr is None: rr, cc = r16 + rest * r16 / (r16 + c16), c16 + rest * c16 / (r16 + c16)
    elif fr == 1: rr, cc = r16 + rest, c16
    elif fr == -1: rr, cc = r16, c16 + rest
    else: rr, cc = r16, c16
    print(f'- {lab}：ラーメン店 {(rr / r12 - 1) * 100:+.1f}%、中華料理店 {(cc / c12 - 1) * 100:+.1f}%（2012年の細分類との比。2012年の格付不能994は振っていない）')
print('\n## 版2：立地の型の1店の売上と従業者1人あたりの売上（小分けの9型、10 は 11〜15 の合計なので除く）\n')
import math
rows = []
for l in sheet('r6-fc-estat-census-000040186980.xlsx').split('\n'):
    c = l.split('\t')
    if len(c) >= 6 and c[2] == '76B_中華料理店' and not c[0].startswith('10_'):
        n, p, s = int(c[3]), int(c[4]), int(c[5]); rows.append((c[0], s / n * 100, p / n, s / p * 100))
print('| 立地の型 | 1店の年売上（万円） | 1店の従業者 | 従業者1人の年売上（万円） |'); print('|---|---|---|---|')
for r in rows: print(f'| {r[0]} | {r[1]:,.0f} | {r[2]:.1f} | {r[3]:,.0f} |')
mx = lambda i: max(r[i] for r in rows) / min(r[i] for r in rows)
print(f'\n最大÷最小：1店の売上 {mx(1):.2f}倍、1店の従業者 {mx(2):.2f}倍、従業者1人の売上 {mx(3):.2f}倍')
def var(v): m = sum(v) / len(v); return sum((x - m) ** 2 for x in v) / len(v)
ls, lp, lq = [math.log(r[1]) for r in rows], [math.log(r[2]) for r in rows], [math.log(r[3]) for r in rows]
vs, vp, vq = var(ls), var(lp), var(lq); cov = (vs - vp - vq) / 2
print(f'log の分散（重みなし）：1店の売上 {vs:.4f} ＝ 従業者 {vp:.4f}（{vp / vs * 100:.0f}%）＋ 1人の売上 {vq:.4f}（{vq / vs * 100:.0f}%）＋ 2×共分散 {2 * cov:.4f}（{2 * cov / vs * 100:.0f}%）')
tot76 = sum(int(l.split('\t')[3]) for l in sheet('r6-fc-estat-census-000040186980.xlsx').split('\n') if len(l.split('\t')) >= 6 and l.split('\t')[2] == '76_飲食店' and not l.split('\t')[0].startswith('10_') and l.split('\t')[3].isdigit())
print(f'\n立地の表の 76 飲食店の合計（9型）：{tot76:,}。主表の2021年 {out[("2021", "76 飲食店")][0]:,} より {(tot76 / out[("2021", "76 飲食店")][0] - 1) * 100:+.1f}%（表の範囲の違い。76B だけの食い違いではない）')
