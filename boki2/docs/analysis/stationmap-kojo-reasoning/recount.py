# -*- coding: utf-8 -*-
# 論証の検査役（Opus 5.5、11/17）の数え直し。調べ物と試しの出力（count.txt・試しの out/*.txt・このフォルダの out-osmcheck.txt）から読むだけ。
import re, math, statistics as st, sys, os
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
cnt = open(os.path.join(B, 'ramencount23/out/count.txt'), encoding='utf8').read()
# (1) B：段8÷段1 の1店あたりの人通りの見積もり。調べ物の7本に、半径を変えた本数（out-osmcheck.txt）を足すと中央はどこか
seven = [4.94, 3.66, 2.71, 4.49, 7.87, 3.13, 11.0]
oc = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out-osmcheck.txt'), encoding='utf8').read()
rad = []
for m in re.finditer(r'^\| (300|800|1000)m \|[^|]*\|[^|]*\|[^|]*\| [\d,]+・[\d,]+・([\d.]+) \| ([\d.]+) \| ([\d.]+) \|', oc, re.M):
  rad += [float(m.group(2)), float(m.group(3)), float(m.group(4))]
gm = lambda a: math.exp(st.mean([math.log(x) for x in a]))
print(f'(1) 調べ物の7本：中央 {st.median(seven):.2f}・幾何平均 {gm(seven):.2f}')
print(f'    半径 300・800・1000m の合計どうし・駅ごとの中央・0軒を0.5軒の9本：{rad}')
allv = sorted(seven + rad)
print(f'    合わせて{len(allv)}本：中央 {st.median(allv):.2f}・幾何平均 {gm(allv):.2f}・8倍の側（>√(7.9×2.14)＝4.11）{sum(1 for x in allv if x > math.sqrt(7.9*2.14))}本')
print(f'    設計書 4.1 の規則（代理①ピン1本あたり 9.41 と代理②の幾何平均）で、代理②をラーメン店の4.49・4.94 に替えると：{math.sqrt(9.41*4.49):.2f}・{math.sqrt(9.41*4.94):.2f}')
# (2) B：試しの sim の1店あたりの需要・売れた客の段8÷段1（K0、⑫b の行）
D = os.path.join(B, 'stationmap-kojo-draft/out')
print('(2) 試しの sim（K0）の段8÷段1：')
for f in ['K0_s79', 'K0_s79_so18', 'K0_s45', 'K0_s214']:
  t = open(os.path.join(D, f + '.txt'), encoding='utf8').read()
  m = re.search(r'^⑫b 段ごとの需要の中央 ([\d./]+).*売れた客の中央 ([\d./]+)', t, re.M)
  d = [float(x) for x in m.group(1).split('/')]; n = [float(x) for x in m.group(2).split('/')]
  print(f'    {f}：需要 {d[-1]}÷{d[0]}＝{d[-1]/d[0]:.2f}倍・売れた客 {n[-1]}÷{n[0]}＝{n[-1]/n[0]:.2f}倍')
# (3) D：count §6 の工場25か所。住工混在の型（R1 でなく従業者1万未満）のうち、空白（従業者1,000人あたりの宿泊飲食 < 2.7）の所
sec = cnt.split('## 6.')[1].split('\n\n')[0]
rows = [[c.strip() for c in l.split('|')] for l in sec.split('\n') if re.match(r'^\| \d+ \|', l)]
num = lambda c: None if c == '—' else float(c.replace(',', ''))
mixv = []
for c in rows:
  town, R_, W, per, osm, day = c[2], num(c[8]), num(c[9]), float(c[14]), c[15], c[16]
  dd = None if day == '—' else float(day)
  r1 = (dd is None or dd >= 0.8) and W < 10000
  if not r1 and W < 10000: mixv.append((town, per, osm, dd))
voids = [x for x in mixv if x[1] < 2.7]
print(f'(3) 住工混在の型 {len(mixv)}か所のうち、従業者1,000人あたりの宿泊飲食が2.7未満（オフィス街の25%点）：{len(voids)}か所 ' + '・'.join(f'{t}（{p}、OSM {o}、day {d}）' for t, p, o, d in voids))
print(f'    住工混在の型で OSM 500m に0軒：{sum(1 for x in mixv if x[2].endswith("・0"))}/{len(mixv)}')
# (4) I・D：厚労省の中華料理店、工場・オフィス街と住宅地区（count §5）。客数×単価×312日 と 乙票の年売上
for nm, cust, price, sales in [('工場・オフィス街', 135.1, 1237, 2786), ('住宅地区', 53.3, 1037, 2075), ('商業地区', 109.5, 1561, 8397)]:
  print(f'(4) {nm}：客数×単価×312日＝{cust*price*312/1e4:,.0f}万円/年・乙票の年売上 {sales:,}万円（比 {cust*price*312/1e4/sales:.2f}）')
print(f'    工場・オフィス街÷住宅地区：客数 {135.1/53.3:.2f}・客数×単価 {135.1*1237/(53.3*1037):.2f}・乙票の売上 {2786/2075:.2f}（乙票は3施設と48施設）')
print(f'    全国の工業地区÷住宅地区（立地環境特性編 第1表 76B）：1事業所の従業者 {8.7/6.6:.3f}・従業者1人の売上 {437/406:.3f}・1事業所の売上 1.42')
print(f'    m_C 2.54 から店の大きさ（×1.32）を除くと {2.54/(8.7/6.6):.2f}')
