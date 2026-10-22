#!/usr/bin/env python3
# BIZ-MKT-RAMEN.md の論証の検査（docs/audit/BIZ-MKT-RAMEN-reasoning.md）で使った検算と数え直し。
# QUALITY 5.2-7（数字の論証）と 6.2-2（数えるのは道具で）に従う。
# Usage: python3 boki2/docs/analysis/bizmkt-ramen-reasoning-check.py
# 手で写した原文の数字は、各ブロックの注に出典（読了ノート名）と原文の語句を書いた。
import os, re, math, itertools, collections

D = os.path.join(os.path.dirname(__file__), '..')
import subprocess
# 前半（版1.0の検査）は版1.0（コミット 8b1d663）を読む。後半（版1.1の再検査）は今の版を読む
REP = subprocess.run(['git', 'show', '8b1d663:boki2/docs/BIZ-MKT-RAMEN.md'], cwd=os.path.abspath(os.path.join(D, '..', '..')),
                     capture_output=True, text=True, check=True).stdout


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


# ===================== 版1.1の再検査（2026-10-22 追加）=====================
print()
print('######## 版1.1の再検査 ########')
REP = open(os.path.join(D, 'BIZ-MKT-RAMEN.md'), encoding='utf-8').read()

print('== V1) 8章の格子の感度（版1.1の bizmkt-ramen-cpa.py と同じ式。g×f×m×r×反応率×費用）==')


def grid_share(F, RESP, lemon_f=4.0, C=(21000, 41000), G=(600, 650, 700), M=(12, 18, 24), R=(0.10, 0.20, 0.30, 0.40)):
    tot = ok = lok = 0
    for g, f, m, r, q, c in itertools.product(G, F, M, R, RESP, C):
        tot += 1
        new = g + r * g * f * m
        lnew = 200 + r * 200 * lemon_f * m
        ok += 3000 * q * new >= c
        lok += 3000 * q * lnew >= c
    return tot, ok, lok


cases = [
    ('報告のまま（f 0.5/1/1.5・反応率0.05〜0.3%・レモネード月4杯）', (0.5, 1.0, 1.5), (0.0005, 0.001, 0.002, 0.003), 4.0),
    ('レモネードを月2杯に', (0.5, 1.0, 1.5), (0.0005, 0.001, 0.002, 0.003), 2.0),
    ('レモネードを月6杯に', (0.5, 1.0, 1.5), (0.0005, 0.001, 0.002, 0.003), 6.0),
    ('ラーメンの f の上を全体への平均1.8回に', (0.5, 1.0, 1.8), (0.0005, 0.001, 0.002, 0.003), 4.0),
    ('反応率を0.1〜0.5%に', (0.5, 1.0, 1.5), (0.001, 0.002, 0.003, 0.005), 4.0),
    ('反応率を0.3〜1.0%に', (0.5, 1.0, 1.5), (0.003, 0.005, 0.0075, 0.01), 4.0),
    ('反応率を0.01〜0.1%に', (0.5, 1.0, 1.5), (0.0001, 0.0003, 0.0005, 0.001), 4.0),
]
for name, F, RESP, lf in cases:
    tot, ok, lok = grid_share(F, RESP, lf)
    print(f'  {name}：{tot}組、ラーメン {ok}（{ok / tot * 100:.0f}%）・レモネード {lok}（{lok / tot * 100:.0f}%）')
print('  → 「元が取れるのは2割、レモネードとほとんど変わらない」は、反応率の幅（報告が使わないとした業者の目安）とレモネードの月4杯（BIZ-MKT の置き値）で決まる')
# 常連1人の月の粗利：ラーメン g×f とレモネード 200×4
for f in (0.5, 1.0, 1.5, 1.8):
    print(f'  ラーメン f={f}：月の粗利 {650 * f:.0f}円 対 レモネード 800円（比 {650 * f / 800:.2f}）')

print()
print('== V2) 「残る長さは評判しだい」と、原文の10店のふだんの強さ（r5-mktr-tcbmag-ddd）==')
# 原文の語句を添えて、放送前の店の状態を手で写した（検査役の印）
before = [
    ('Smalley’s', '弱い', '「At the time we were really struggling」「We wondered if we were going to have to close」', '毎年7-10%増'),
    ('Donatelli’s', '弱い', '「We had debt and were really scared. It saved us from going out of business.」', '20%が続く'),
    ('QFanatic', '弱い', '「labored in relative obscurity」', '2年後に+75%'),
    ('Pizzeria Lola', '強い', '「riding the crest of a wave of strong local reviews」', '頭打ちなし'),
    ('Casper & Runyon’s Nook', '強い', '「already had a cult following」', '毎年伸びる'),
    ('Chester Creek Cafe', '不明', '（伸びなかった理由は「out-of-the-way location」）', '伸びなし'),
]
weak_persist = sum(1 for _, s, _, l in before if s == '弱い' and l != '伸びなし')
print(f'  放送前に弱かった店（原文の語句あり）{sum(1 for b in before if b[1] == "弱い")} 店のうち、長期に伸びが残った店 {weak_persist}')
for n, s, q, l in before:
    print(f'    {n}：放送前 {s} {q} → 長期 {l}')
print('  → 米国の資料の中では、弱い店でも伸びが長く残った。「評判の強い店は年単位、弱い店は直後だけ」は原文の向きと合わない。分ける変数は、媒体（全シーズンを流し続けるケーブル局か、一度きりか）・立地のほうが資料に近い')

print()
print('== V3) 当たりの確率の置き値と、選ばれた10店（R13 の「放送の後に目に見えて伸びる 60〜90%」）==')
st = [0, 5, 35, 45, 50, 50, 60, 60, 100, 500]
print(f'  10店で短期+30%以上 {sum(v >= 30 for v in st)}/10＝{sum(v >= 30 for v in st) * 10}%、長期に残る 9/10＝90% → 置き値 60〜90% はほぼ選ばれた成功例の割合そのもの')

print()
print('== V4) 6章の声（版1.1の表）==')
t6 = section(REP, '## 6. 利用者の声', '## 7. 店主')
v6 = table_rows(t6, r'V\d+')
cl = collections.Counter(v[2] for v in v6)
jn = [v for v in v6 if 'jnet21-consramen2' in v[3]]
print(f'  声 {len(v6)} 件、J-Net21 {len(jn)} 件（{len(jn) / len(v6) * 100:.1f}%。報告の6章は「49%」）')
print(f'  味 {cl["味"]} 件のうち J-Net21 {sum(1 for v in jn if v[2] == "味")} 件')
print(f'  行列の声：待 {cl["待"]}・許 {cl["許"]}・行 {cl["行"]}（待 {cl["待"]} 対 許＋行 {cl["許"] + cl["行"]}）→ 「多くの人は並ぶのを嫌う」は声の数からは出ず、出典なしの16%／84%に頼る')
so = [v for v in v6 if 'soranews' in v[3]]
print(f'  撮 {cl["撮"]} 件のうち SoraNews {sum(1 for v in so if v[2] == "撮")} 件（記事の書き手が選んで訳した反応）')

print()
print('== V5) 5章の「自前の発信」の成功（版1.1の表）==')
t5 = section(REP, '## 5. 成功と失敗の事例', '## 6. 利用者の声')
c5 = table_rows(t5, r'[SFT]\d+')
own = [c for c in c5 if c[2] == '自前の発信']
for c in own:
    print(f'  {c[0]}：{c[3][:60]}')
print(f'  自前の発信の成功 {len(own)} 件は、ラーメンでない店（菓子）とチェーン（195店）。ふつうの小さなラーメン店の例は0件')

print()
print('== V6) 再検査の判定の数（検査書16章の表）==')
A = os.path.join(D, 'audit', 'BIZ-MKT-RAMEN-reasoning.md')
if os.path.exists(A):
    txt = open(A, encoding='utf-8').read()
    resp = collections.Counter(); jud = collections.Counter(); seen = []
    for line in txt.splitlines():
        mm = re.match(r'^\| (A-[KL]\d+|M\d+) \|', line)
        if not mm:
            continue
        cells = split_cells(line)
        v = re.sub(r'\*', '', cells[-2])
        seen.append(mm.group(1))
        if mm.group(1).startswith('A-'):
            k = '応えていない' if '応えていない' in v else ('一部' if '一部' in v else ('応えた' if '応えた' in v else '?'))
            resp[k] += 1
        else:
            k = '不当' if '不当' in v else ('弱い' if '弱い' in v else ('妥当' if '妥当' in v else '?'))
            jud[k] += 1
    print(f'  I への応え {sum(resp.values())} 項：' + '・'.join(f'{k} {resp[k]}' for k in ('応えた', '一部', '応えていない', '?')))
    print(f'  版1.1の結論 {sum(jud.values())} 件：' + '・'.join(f'{k} {jud[k]}' for k in ('妥当', '弱い', '不当', '?')))
    dup = [k for k, v in collections.Counter(seen).items() if v > 1]
    print(f'  番号の重複：{dup if dup else "なし"}')


# ===================== 版1.2の再検査（2026-10-22 追加。検査書17章）=====================
print()
print('######## 版1.2の再検査 ########')
REP12 = open(os.path.join(D, 'BIZ-MKT-RAMEN.md'), encoding='utf-8').read()
DDD = os.path.join(D, '..', 'research', 'raw', 'web', 'bizmkt', 'r5-mktr-tcbmag-ddd.html')
try:
    from bs4 import BeautifulSoup
    ddd_txt = BeautifulSoup(open(DDD, 'rb').read().decode('utf-8', 'replace'), 'html.parser').get_text(' ')
except Exception as e:  # raw は git に入らないので、ない環境では飛ばす
    ddd_txt = ''
print('== W1) 32店の分母（r5-mktr-tcbmag-ddd）==')
for q in ['have contributed 32 of the 800 business profiled on DDD', 'most recently the Brick House Cafe in Cable, Wis., in November',
          'Their story is similar to the many regional DDD restaurants we spoke to', 'instant bedlam, a tidal wave of business',
          'only three area DDD restaurants have closed']:
    print(f'  原文にあるか：{"ある" if q in ddd_txt else "ない（raw がないか語句が違う）"}「{q}」')
cities = {'Casper': 'St. Paul', 'Chester Creek': 'Duluth', 'Dari-Ette': 'St. Paul', 'Donatelli': 'White Bear Lake',
          'Northern Waters': 'Duluth', 'Pizzeria Lola': 'Minneapolis', 'QFanatic': 'Champlin', 'Smack Shack': 'Minneapolis',
          'Smalley': 'Stillwater', 'Victor': 'Minneapolis'}
print(f'  10店の所在地（表の地名を写した）：{sorted(set(cities.values()))} → 10店ともミネソタ州の町＝地域の32店の中の店と読める')
print('  ・32店は「全国の番組（Food Network）に出た、この地域の店」で、地域の番組ではない')
print('  ・記事は選ばなかった店についても「話を聞いた多くの地域の店も同じ：大混乱、客の津波」と書く → 下の端（22店がみな伸びなかった＝8/32）は原文の向きと合わない')
print('  ・32店には放送から半年ほどの店（2014年11月）も入るので、長期の値はまだない店がある')

print()
print('== W2) 報告の8.2の感度の表を、報告のスクリプトで走らせ直した値と突き合わせる ==')
import subprocess as _sp
out = _sp.run(['python3', os.path.join(os.path.dirname(__file__), 'bizmkt-ramen-cpa.py')], capture_output=True, text=True).stdout
sec6 = out[out.index('== 6.'):] if '== 6.' in out else ''
got = re.findall(r'ラーメン (\d+)（\d+%）・レモネード (\d+)（\d+%）', sec6)
t82 = section(REP12, '### 8.2', '## 9.')
tab = re.findall(r'\| (\d+)（\d+%）\| (\d+)（\d+%）\|', t82)
print(f'  スクリプトの6節：{got}')
print(f'  報告の表：      {tab}')
print(f'  一致：{"全行一致" if got == tab else "食い違いあり"}（7行）。私の16.5 の「反応率0.3〜1.0%」660 と報告の 659 の差は、反応率の4点のうち1点を 0.75% と置いたか 0.7% と置いたかの差')

print()
print('== W3) 章「検査役の筋から採ったもの」の行 ==')
tk = section(REP12, '## 検査役の筋から採ったもの', '## 論証の表')
rows = [split_cells(l) for l in tk.splitlines() if l.startswith('| ') and not l.startswith('| 検査書の番号') and not l.startswith('|---')]
withq = sum(1 for r in rows if '[[' in r[2])
withs = sum(1 for r in rows if r[3].strip() not in ('なし',) and not r[3].startswith('なし'))
print(f'  行 {len(rows)}：原文の語句を持つ行 {withq}、スクリプトの出力を持つ行 {withs}、出力「なし」 {len(rows) - withs}')
for r in rows:
    if '[[' not in r[2]:
        print(f'  語句のない行：{r[0]}（{r[2][:30]}）')
tv = [r for r in rows if 'M04' in r[0]]
if tv:
    print(f'  テレビの条件の行の語句：{re.findall(r"「([^」]+)」", tv[0][2])}')

print()
print('== W4) 6章の「待」5件の中身（版1.2の表）==')
t6b = section(REP12, '## 6. 利用者の声', '## 7. 店主')
for v in table_rows(t6b, r'V\d+'):
    if v[2] == '待':
        src = re.search(r'r[45]-[\w-]+', v[3]).group(0)
        print(f'  {v[0]}（{src}）：{v[1][:40]}')
print('  → 待5件は書き手が4人（J-Net21 の1件・蔦の記事の反応2件・同じブログの2件）で、うち2件は近所への迷惑の見方。「同じ数」は比べられる標本の数ではない')

print()
print('== W5) 版1.2の再検査の判定の数（検査書17章の表）==')
if os.path.exists(A):
    txt = open(A, encoding='utf-8').read()
    br = collections.Counter(); jd = collections.Counter(); seen = []
    for line in txt.splitlines():
        mm = re.match(r'^\| (B\d+|N\d+) \|', line)
        if not mm:
            continue
        cells = split_cells(line); v = re.sub(r'\*', '', cells[-2]); seen.append(mm.group(1))
        if mm.group(1).startswith('B'):
            k = '応えていない' if '応えていない' in v else ('一部' if '一部' in v else ('応えた' if '応えた' in v else '?'))
            br[k] += 1
        else:
            k = '不当' if '不当' in v else ('弱い' if '弱い' in v else ('妥当' if '妥当' in v else '?'))
            jd[k] += 1
    print(f'  16.10 の依頼への応え {sum(br.values())} 項：' + '・'.join(f'{k} {br[k]}' for k in ('応えた', '一部', '応えていない', '?')))
    print(f'  版1.2で変わった結論 {sum(jd.values())} 件：' + '・'.join(f'{k} {jd[k]}' for k in ('妥当', '弱い', '不当', '?')))
    dup = [k for k, v in collections.Counter(seen).items() if v > 1]
    print(f'  番号の重複：{dup if dup else "なし"}')
