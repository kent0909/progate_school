#!/usr/bin/env python3
# BIZ-MKT-RAMEN.md の論証の検査（docs/audit/BIZ-MKT-RAMEN-reasoning.md）で使った検算と数え直し。
# QUALITY 5.2-7（数字の論証）と 6.2-2（数えるのは道具で）に従う。
# Usage: python3 boki2/docs/analysis/bizmkt-ramen-reasoning-check.py
# 手で写した原文の数字は、各ブロックの注に出典（読了ノート名）と原文の語句を書いた。
import os, re, math, itertools, collections

D = os.path.join(os.path.dirname(__file__), '..')
REP = open(os.path.join(D, 'BIZ-MKT-RAMEN.md'), encoding='utf-8').read()


def section(text, start, end):
    i = text.index(start)
    j = text.index(end, i + len(start))
    return text[i:j]


def split_cells(line):
    # 出典 [[src:coll:doc|「語句」]] の中の縦棒で列を割らない
    prot = re.sub(r'\[\[[^\]]*\]\]', lambda mm: mm.group(0).replace('|', '¦'), line)
    return [c.strip().replace('¦', '|') for c in prot.strip().strip('|').split('|')]


def table_rows(text, idpat):
    out = []
    for line in text.splitlines():
        if re.match(r'^\| (' + idpat + r') \|', line):
            out.append(split_cells(line))
    return out


print('== 1) 1.2 の表：列ごとの根拠の種類（当たりの確率の列を中心に） ==')
t12 = section(REP, '### 1.2', '### 1.3')
rows12 = table_rows(t12, r'[RG]\d+')
cols = ['ID', '費用の幅', '当たりの確率', '当たったときの大きさ', '効くまで', '残る長さ', '事故']
SRC = re.compile(r'\[(一|研|実|事|声|作|宣)\]')
for ci in range(1, 7):
    kinds = collections.Counter()
    for r in rows12:
        c = r[ci]
        has_src = bool(SRC.search(c))
        has_inf = ('[推]' in c) or ('【推論】' in c) or ('資料なし' in c)
        empty = c.strip() in ('—', '', '-')
        if empty:
            kinds['空（—）'] += 1
        elif has_src and not has_inf:
            kinds['資料の印だけ'] += 1
        elif has_src and has_inf:
            kinds['資料と推・資料なしが混在'] += 1
        else:
            kinds['推・資料なしだけ'] += 1
    print(f'  {cols[ci]}：' + '・'.join(f'{k} {v}' for k, v in kinds.most_common()) + f'（計 {sum(kinds.values())}）')
# 当たりの確率の列で「資料の印だけ」のマスの中身（確率そのものを言っているか）
print('  当たりの確率の列で資料の印があるマス：')
for r in rows12:
    if SRC.search(r[2]):
        print(f'    {r[0]}: {re.sub(r"\[\[[^\]]*\]\]", "〔出典〕", r[2])[:90]}')

print()
print('== 2) 報告の「推 73」の内訳（1.1 と 1.2 の [推] と【推論】） ==')
t11 = section(REP, '### 1.1', '### 1.2')
n_br11 = t11.count('[推]'); n_ro11 = t11.count('【推論】')
n_br12 = t12.count('[推]'); n_ro12 = t12.count('【推論】')
print(f'  1.1：[推] {n_br11}＋【推論】{n_ro11}／1.2：[推] {n_br12}＋【推論】{n_ro12}／計 {n_br11 + n_ro11 + n_br12 + n_ro12}')
print('  → 73 は「当たりの確率のマス」の数ではなく、1.1・1.2 の全マスの推の印の数')

print()
print('== 3) 8章の CPA／LTV の検算 ==')
# 報告 8.1 の置き値（報告の行 346-352）
g = {'下': 600, '中': 650, '上': 700}
f = {'下': 1, '中': 1.5, '上': 2.5}
m = {'下': 12, '中': 18, '上': 24}
r = {'下': 0.10, '中': 0.25, '上': 0.40}
ltv = {k: g[k] * f[k] * m[k] for k in g}
new = {k: g[k] + r[k] * ltv[k] for k in g}
print('  常連の LTV：' + '・'.join(f'{k} {ltv[k]:,.0f}' for k in g) + '（報告：7,200／17,550／42,000）')
print('  新規1人の期待 LTV：' + '・'.join(f'{k} {new[k]:,.1f}' for k in g) + '（報告：1,320／5,038／17,500）')
lem_new = 200 + 0.33 * (4 * 12 * 200)
print(f'  レモネードの新規1人の期待 LTV（BIZ-MKT の例）：200＋0.33×9,600＝{lem_new:,.0f}')
for k in g:
    rel = '大きい' if new[k] > lem_new else '小さい'
    print(f'    ラーメン{k}の前提 {new[k]:,.0f} はレモネード {lem_new:,.0f} より{rel}（比 {new[k] / lem_new:.2f}）')
for cost in (21000, 37500):
    print(f'  ポスティング {cost:,}円：1回で元が取れる来店 {cost / 650:.1f}、元が取れる新規 下 {cost / new["下"]:.1f}・中 {cost / new["中"]:.1f}・上 {cost / new["上"]:.1f}、レモネード {cost / lem_new:.1f}')
# BIZ-MKT 自身の例（BIZ-MKT.md 23-26行：6人来て2人が常連、LTV 9,600円）
bm = 6 * 200 + 2 * 9600
print(f'  BIZ-MKT 自身の例：6人×200＋常連2人×9,600＝{bm:,}円 対 費用21,000円 → 回収率 {bm / 21000 * 100:.0f}%（「常連が付いても赤字」は約3%の不足）')
# 反応率の境目と DESIGN-RAMEN 312行の反応率 0.05〜0.3%
for k in g:
    lo, hi = 21000 / new[k] / 3000 * 100, 37500 / new[k] / 3000 * 100
    print(f'  {k}の前提で元が取れる反応率：{lo:.2f}〜{hi:.2f}%')
for rate in (0.0005, 0.003):
    print(f'  3,000部×反応率{rate * 100:.2f}% ＝ 新規 {3000 * rate:.1f} 人')
# 置き値の格子（g・f・m・r を下中上の全組、反応率は DESIGN の 0.05/0.1/0.2/0.3%）で、3,000部・21,000円が元を取る割合
grid = list(itertools.product(g.values(), f.values(), m.values(), r.values(), (0.0005, 0.001, 0.002, 0.003)))
ok = 0
for gg, ff, mm, rr, rate in grid:
    nv = 3000 * rate
    if nv * (gg + rr * gg * ff * mm) >= 21000:
        ok += 1
print(f'  置き値の格子 {len(grid)} 組のうち元が取れる組：{ok}（{ok / len(grid) * 100:.0f}%）→ 境目に来るかどうかは置き値で決まる')
# 頻度 f の出典：J-Net21（r5-mktr-jnet21-consramen2「の245人(24.5%)」）はラーメン店全体の利用頻度
bins = [(24.5, 1.0), (11.2, 2.5), (4.9, 4.3)]  # 月1回／月2〜3回（中点2.5）／週1回以上（月4.3回と置く）
avg = sum(p * v for p, v in bins) / sum(p for p, _ in bins)
print(f'  月1回以上の人の「ラーメン店全体への」月の来店の平均：{avg:.2f} 回（1店への頻度ではない）')
# 値引きと粗利
print(f'  100円引き：650÷550＝{650 / 550:.3f}倍、レモネード 200÷150＝{200 / 150:.3f}倍')
print(f'  フェス：売れ残り {2000 - 850} 杯×300〜330円＝{(2000 - 850) * 300:,}〜{(2000 - 850) * 330:,}円')

print()
print('== 4) 米国のテレビ番組の記事の10店の表（r5-mktr-tcbmag-ddd「10 DDD success stories」）==')
# 原文の Short Term / Long Term をそのまま写した（数値は％、None は「None」、one-digit は5と置く）
ddd = [
    ('Casper & Runyon\'s Nook', 100, '伸び続ける'),      # "100% increase in sales" / "We see growth every year."
    ('Chester Creek Cafe', 5, '伸びなし'),              # "Single-digit change" / "No gain attributable to DDD"
    ('Dari-Ette', 0, '数年で2倍'),                      # "None" / "Sales have doubled"
    ('Donatelli\'s', 35, '20%が続く'),                  # "30-40%" / "20% sustained increase"
    ('Northern Waters', 60, '伸び続ける'),              # "Revenue jumped 60%" / "It hasn't slowed."
    ('Pizzeria Lola', 50, '伸び続ける'),                # "50%" / "Annual sales bumps, no plateau"
    ('QFanatic', 50, '2年後に+75%'),                    # "50% boost" / "Sales up 75% two years later"
    ('Smack Shack', 500, '+300%'),                      # "500%" / "300% increase"
    ('Smalley\'s', 60, '毎年7-10%増'),                  # "60% bump" / "7-10% annual increases"
    ('Victor\'s 1959 Cafe', 45, '毎年伸びる'),          # "40-50% jump in dinner sales" / "Annual growth every year"
]
st = sorted(v for _, v, _ in ddd)
med = (st[4] + st[5]) / 2
print(f'  短期の伸び（%）：{st}　中央値 {med:.0f}%、30%以上 {sum(v >= 30 for v in st)}/10 店')
print(f'  長期：伸びなし {sum(l == "伸びなし" for _, _, l in ddd)}/10 店、残り {sum(l != "伸びなし" for _, _, l in ddd)}/10 店は長期にも伸びが残る・続く')
print('  → 報告 1.3・11章204行「1か月で大きく下がり」は、この表の向きと逆')
print('  ※ 記事の題が "success stories"、10店は記者が選んだ。番組全体では 800 店のうち地域で閉店は3店（"only three area DDD restaurants have closed"）')

print()
print('== 5) 1.3 の置き値「対数正規・中央値+20%・上位5%で+200%以上」の含み ==')
# 解釈A：倍率 L=1+x が対数正規。中央値 1.2、95%点 3.0
sA = (math.log(3.0) - math.log(1.2)) / 1.6449
meanA = 1.2 * math.exp(sA ** 2 / 2) - 1
pA = 0.5 * (1 + math.erf((math.log(1.5) - math.log(1.2)) / (sA * math.sqrt(2))))
print(f'  倍率が対数正規なら σ={sA:.2f}、平均 +{meanA * 100:.0f}%、+50%以下の確率 {pA * 100:.0f}%')
# 解釈B：伸び x 自体が対数正規。中央値 0.2、95%点 2.0
sB = (math.log(2.0) - math.log(0.2)) / 1.6449
meanB = 0.2 * math.exp(sB ** 2 / 2)
print(f'  伸び自体が対数正規なら σ={sB:.2f}、平均 +{meanB * 100:.0f}%')
print(f'  原文の10店（選ばれた成功例）の短期の中央値は +{med:.0f}%。置き値の中央値 +20% はこれより小さい（選ばれ方の偏りを割り引いた推論としてなら筋は通るが、本文はそれを書いていない）')

print()
print('== 6) 6章の行列の声：行 対 待 と、人の中での変化 ==')
t6 = section(REP, '## 6. 利用者の声', '## 7. 店主')
voices = table_rows(t6, r'V\d+')
cls = {v[0]: v[2] for v in voices}
q = [v for v in voices if v[2] in ('行', '待')]
print(f'  行 {sum(v[2] == "行" for v in q)}・待 {sum(v[2] == "待" for v in q)}（報告の分類のまま）')
# 原文を全文読んだうえでの印（検査役の印）：「嫌だった／無理だと思っていた → 並んでみて許せた・楽しかった」
change = {'V46': 'r5-mktr-note-kitano（「行列に並ぶの、嫌でした」→「非日常のワクワク」）',
          'V47': 'r5-mktr-note-iroha（「1時間も待つなんてできないよ」→「と思ってたが」2日続けて並び「美味しいもののためなら仕方ないか」）',
          'V48': 'r5-mktr-note-iroha（同じ人。連れがいると時間が早い）',
          'V50': 'r5-mktr-hatena-goldhead（「気が知れない」→「ここに和解は成立した」「月に一度くらいは並んでみよう」）'}
print(f'  「嫌→並んでみて許せた」の書き手：{len(set(c.split("（")[0] for c in change.values()))} 人（声の番号 {", ".join(change)}）')
print('  うち V47 は報告で「待」に分類されているが、原文の結論は並んで許せた側')
print('  同じ note-sapio の本文にある数字（出典の書かれていない「ある調査結果」）：「行列に並ぶのが好きな人：16％」「嫌いな人：84％」を報告は引いていない')
n_jnet = sum(1 for v in voices if 'jnet21-consramen2' in v[3])
print(f'  J-Net21 の声 {n_jnet}/{len(voices)} 件（{n_jnet / len(voices) * 100:.0f}%）。記事の書き手が章（コロナ・健康・意向）ごとに選んで載せた引用で、店を何で知ったかは問われていない')

print()
print('== 7) 5章の事例の数え方 ==')
t5 = section(REP, '## 5. 成功と失敗の事例', '## 6. 利用者の声')
cases = table_rows(t5, r'[SF]\d+')
by_src = collections.Counter(re.search(r'r[45]-[\w-]+', c[4]).group(0) for c in cases)
print('  出典ごとの事例の数：' + '・'.join(f'{k} {v}' for k, v in by_src.most_common(6)))
print('  同じ出来事を成功と失敗の両方に数えたもの：S5（すっぽかしの投稿で5倍）と F7（すっぽかしで材料が余る）＝銀波露の同じ1日')
fam = {'キャパ・苦情・常連': ['F1', 'F2', 'F3'], '露出が効かない・続かない・知られない': ['F4', 'F5', 'F13'],
       '資金': ['F6'], '取材の費用と空振り': ['F7', 'F8'], '店の発信の事故': ['F9', 'F10', 'F11'],
       '撮影の迷惑': ['F12'], '品質・期待': ['F14', 'F15']}
print(f'  失敗15件を中身で束ねると {len(fam)} 種類（報告は1件ごとに名前を付けて「15種類」）')
no_outcome = ['S10', 'S12', 'S13']
print(f'  成功に数えたが店の客数・売上の結果が原文にないもの：{", ".join(no_outcome)}（監修の発売・事例集のいいね数・懸賞の中身）')

print()
print('== 8) 11章の「支え」の列 ==')
t11c = section(REP, '## 11. DESIGN-RAMEN', '## 12. BIZ-MKT')
rows11 = [split_cells(l) for l in t11c.splitlines() if re.match(r'^\| (\d+|新規) \|', l)]
sup = collections.Counter(re.sub(r'（.*', '', r[3]) for r in rows11)
print(f'  {len(rows11)} 行：' + '・'.join(f'{k} {v}' for k, v in sup.most_common()))

print()
print('== 9) そのほかの検算 ==')
print(f'  蔦の値段：星の時 850円 → 2019年の移転で 1,300円（+{(1300 / 850 - 1) * 100:.0f}%、4年後。メニューの作り替えと同時）（r5-mktr-nippon-tsuta「価格は850円だった」「一杯1300円」）')
print(f'  炎上：全体 23.7% ÷ 見聞きした人 39.0% ＝ {23.7 / 39.0 * 100:.0f}%（＝炎上を見聞きしたことのある人の割合の目安）。39.0% は「見聞きした人の中での意向」で、店の客のうち炎上を知った人に当てるならこちらが分母として合う（r4-mkt-siemple-enjou2025「と回答した割合は23.7%」）')
print('  参照価格の論文（r4-mkt-refprice-loyalty）：対象は「カレールー」のスキャンパネル 292 世帯、更新ウェイトは「購買機会」ごと。セグメント1（46%）は「実売価格の絶対値に対しては反応しないが」利得・損失に反応、セグメント2（40%）は利得に反応しないが価格と損失に反応、セグメント3（14%）は損失に反応しない')
print('  → 「値引きに反応しない客の割合（約4割の型）」に当たるセグメントはない。損失回避（値引きを戻すと離れる向き）は 46%＋40%＝86% のセグメントで有意')

print()
print('== 10) 検査書の判定の数 ==')
A = os.path.join(D, 'audit', 'BIZ-MKT-RAMEN-reasoning.md')
if os.path.exists(A):
    txt = open(A, encoding='utf-8').read()
    cnt = collections.Counter(); meta = collections.Counter(); ids = []
    for line in txt.splitlines():
        mm = re.match(r'^\| (K\d+|L\d+) \|', line)
        if not mm:
            continue
        cells = split_cells(line)
        verdict = re.sub(r'\*', '', cells[-2])
        v = '不当' if '不当' in verdict else ('弱い' if '弱い' in verdict else ('妥当' if '妥当' in verdict else '?'))
        (meta if mm.group(1).startswith('L') else cnt)[v] += 1
        ids.append(mm.group(1))
    print(f'  結論（K）{sum(cnt.values())} 件：' + '・'.join(f'{k} {cnt[k]}' for k in ('妥当', '弱い', '不当', '?')))
    print(f'  論証の表の行（L）{sum(meta.values())} 件：' + '・'.join(f'{k} {meta[k]}' for k in ('妥当', '弱い', '不当', '?')))
    dup = [k for k, v in collections.Counter(ids).items() if v > 1]
    print(f'  番号の重複：{dup if dup else "なし"}')
else:
    print('  （検査書がまだない）')
