#!/usr/bin/env python3
# BIZ-CALIB.md（版0.2）と BIZ-SIMDESIGN.md（版0.2）から、補填の対象を全部抜き出して
# docs/analysis/fill-targets-calib.tsv に1か所1行で書く（BIZ-FILL-CALIB の対象の一覧）。
# 抜き出すもの：
#   CALIB  ①「M・K・L・R」と「新しい行の一覧」の表で区分が (c) の行（calib-count.py と同じ数え方。矢印の右）
#          ② 本文の【推論…】【要確認】（印の説明の行は「説明」として載せ、対象から外す）
#          ③「やっていないこと」の表の行と、受け入れの基準の表で「未達」「一部」の行
#   SIMDESIGN ④ 本文の【資料なし】【推論】【要確認】 ⑤「やっていないこと」の箇条のうち置き値・式の一次資料の行
# 使い方: python3 -I boki2/docs/analysis/fill-targets-calib.py   （集計を標準出力に出す）
# 列: id 報告 行 種類 行の名 中身 項目 影響 項目の中身 扱い
#   影響（ゲームへの影響の大きさ、10が最大）の付け方：
#    9〜10 需要の式の芯（値段の弾力性・曜日・季節）／7〜8 店の成績の分布・ライバルの数と出入り・型ごとの損益／
#    5〜6 1つの費用・事故・投資の分岐の初期値／3〜4 小さな費用・出典の差し替え／1〜2 説明・既に解決／0 印の説明
#   扱い：補填＝この報告で資料を探す／引き継ぎ＝並行の担当（BIZ-FILL-RAMEN・BIZ-GROWTH ほか）の成果を引く／
#         計算＝資料の値の計算・按分で、資料を足しても区分が変わらない種類（式を見せて残す）／設計＝設計の推論（資料の主張ではない。試遊・検算で確かめる）
import re, os, sys, collections, subprocess

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
DOCS = os.path.join(ROOT, 'docs')
MARK = re.compile(r'【推論[^】]*】|【要確認】|【資料なし】')

# 項目：(記号, 影響, 中身, 扱い)
IT = {
 'P1': (9, '1軒の店の値段の弾力性（M1）', '補填'),
 'P2': (7, '業界の値上げの波・1,000円の壁の係数（M2・M3・M33）', '補填'),
 'W1': (8, '曜日の需要の倍率（M16・f.2 の週±10%）', '補填'),
 'S1': (9, '季節：気温と休日の切り分け・立地の季節（T5・M5）', '引き継ぎ'),
 'G3': (7, '地域ごとの損益分岐点（G3）', '引き継ぎ'),
 'RENT': (6, '地方・郊外・過疎の店舗の賃料（G3 の入力）', '補填'),
 'PRICE': (6, '都市別の中華そばの価格（小売物価統計、G3 の入力）', '補填'),
 'JFC': (7, '公庫の経営指標 2021・2023年度の表（年ごとの振れ）', '補填'),
 'CENSUS': (6, '中華料理店・ラーメン店の事業所数の推移', '補填'),
 'SEAT': (5, '席数・回転（R4）', '補填'),
 'FC': (5, 'FC の加盟金・ロイヤリティ（R5・本部の募集要項3本）', '補填'),
 'FCW': (4, 'FC・買収・通販・物販の分岐の重み（M45・M46・M48・R11）', '引き継ぎ'),
 'TOSAN': (4, '倒産の個別事例の5件目（X4）', '補填'),
 'GIFT': (4, 'ギフトの2008〜2020年の年ごとの表・出店数・設備投資', '補填'),
 'KOURAKU': (3, '幸楽苑の撤退した業態', '補填'),
 'FOODPOI': (5, '全国の食中毒の件数・患者数（M56）', '補填'),
 'EVENT': (5, 'コストの側の出来事の頻度（品質不良・目減り・故障・保険、M51・M53・M55・M58）', '補填'),
 'BUILD': (5, '工事の遅れ・上振れの頻度（M59）', '補填'),
 'PLANT': (5, '工場の稼働率・投資額（M65・X5）', '補填'),
 'EXIT': (4, '新しい事業の撤退（M66）・2号店（M44）', '補填'),
 'DEBT': (4, '5つの型の借入の大きさ（V6）', '補填'),
 'TYPE': (4, '型ごとの損益の当てはめ（V6・個人の型）', '補填'),
 'K28': (3, '返金負債の一次資料（K28）', '補填'),
 'MKT': (3, '集客の効果と重み（K・M10〜M12・M40・R9）', '引き継ぎ'),
 'RAMEN': (3, '新商品・ブーム・監修料・スープ（M14・R6・R10・R16）', '引き継ぎ'),
 'DEC': (4, '判断の分岐の重み（M35・M36・M38・M47・M49・M50）', '補填'),
 'MISC': (2, 'レモネード・パン屋・予報（M4 系の残り：M8・M27・M30）', '補填'),
 'CALC': (2, '資料の値の計算・按分（中央値の按分・逆算・割り算）', '計算'),
 'CNT': (3, '(c) を30%以下に（受け入れの基準2）', '補填'),
 'LOGIC': (2, '論証の表の反対の事実を2つずつ', '補填'),
 'DEMANDSRC': (6, '他作品の需要の式の一次資料（Game Dev Tycoon・Big Ambitions・カイロソフト・Two Point）', '補填'),
 'COEF': (6, '検算の係数の置き値（外の選択 V0・潜在客・1杯の材料・客層の係数・地域の数字）', '補填'),
 'SDGAME': (2, '他作品の遊びの読み（長く遊ばれる鎖・終盤の対策）の【推論】【資料なし】', '補填'),
 'SDDESIGN': (1, 'SIMDESIGN の設計の推論（案の性質・推し・差し替え）', '設計'),
 'META': (0, '印の説明（対象外）', '説明'),
 'DONE': (1, '報告の中で既に片付いた所（HANDOFF の更新など）', '説明'),
}

def item_calib(kind, name, text, line):
    t = name + ' ' + text
    if kind in ('推論', '要確認'):
        if re.search(r'本文の \*\*【推論】|前の報告の【要確認】|QUALITY 6章', text): return 'META'
        if line in (308, 329, 331, 332, 333, 341, 417, 418, 419, 424, 435, 437, 442, 663, 703, 712, 767, 975, 1200, 1207): return 'CALC'
        if re.search(r'客単価の基準', text): return 'CALC'
        if re.search(r'立地|盆と正月|オフィス街', text): return 'S1'
        if re.search(r'家賃は資料なし|資料なし【推論】', text): return 'RENT'
        if re.search(r'仮置き|分岐点|奥多摩', text): return 'G3'
        if re.search(r'ラーメン原価指数|原価指数', text): return 'CALC'
        if re.search(r'生存の偏り', text): return 'JFC'
        if re.search(r'工場|原価率約30%', text): return 'PLANT'
        if re.search(r'規模が大きくなる', text): return 'JFC'
        if re.search(r'両方の形で', text): return 'SDDESIGN'
        if re.search(r'分布の形は物価', text): return 'CALC'
        if re.search(r'安売り', text): return 'TYPE'
        return 'CALC'
    if kind == '未達':
        if re.search(r'2021・2023年度|2年以上', t): return 'JFC'
        if re.search(r'喫茶店・パン屋の規模別', t): return 'JFC'
        if re.search(r'事業所数の推移', t): return 'CENSUS'
        if re.search(r'倒産', t): return 'TOSAN'
        if re.search(r'募集要項|R5', t): return 'FC'
        if re.search(r'ギフト', t): return 'GIFT'
        if re.search(r'幸楽苑', t): return 'KOURAKU'
        if re.search(r'食中毒', t): return 'FOODPOI'
        if re.search(r'賃料', t): return 'RENT'
        if re.search(r'中華そばの価格', t): return 'PRICE'
        if re.search(r'気温と休日', t): return 'S1'
        if re.search(r'K28', t): return 'K28'
        if re.search(r'曜日', t): return 'W1'
        if re.search(r'30%以下|基準2|\(c\) が30%', t): return 'CNT'
        if re.search(r'反対の事実', t): return 'LOGIC'
        if re.search(r'HANDOFF', t): return 'DONE'
        if re.search(r'借入の大きさ', t): return 'DEBT'
        if re.search(r'5つの型', t): return 'DEBT'
        return 'CNT'
    # (c) の行
    rid = name
    m = {
     'M1': 'P1', 'M2': 'P2', 'M3': 'P2', 'M33': 'P2', 'M5': 'S1', 'T5': 'S1', 'G3': 'G3', 'M16': 'W1',
     'M8': 'MISC', 'M27': 'MISC', 'M30': 'MISC', 'M11': 'MKT', 'M40': 'MKT', 'K1': 'MKT', 'K13': 'MKT', 'R9': 'MKT',
     'M14': 'RAMEN', 'R6': 'RAMEN', 'R10': 'RAMEN', 'R16': 'RAMEN', 'R15': 'CENSUS', 'R4': 'SEAT', 'R5': 'FC',
     'M45': 'FCW', 'M46': 'FCW', 'M48': 'FCW', 'R11': 'FCW', 'M44': 'EXIT', 'M66': 'EXIT', 'M59': 'BUILD', 'M65': 'PLANT',
     'M51': 'EVENT', 'M53': 'EVENT', 'M55': 'EVENT', 'M58': 'EVENT', 'V6': 'DEBT',
     'M35': 'DEC', 'M36': 'DEC', 'M38': 'DEC', 'M47': 'DEC', 'M49': 'DEC', 'M50': 'DEC',
    }
    if rid in m: return m[rid]
    if rid.startswith('K2'): return 'MKT'
    return 'CNT'

def item_sim(kind, text, sec):
    if re.search(r'^\*\*印\*\*|列の意味', text): return 'META'
    if re.search(r'Game Dev Tycoon・Big Ambitions・カイロソフト|式の全体は|式は【資料なし】|式の一次資料は【資料なし】', text): return 'DEMANDSRC'
    if re.search(r'置き値|係数のうち|検算の係数', text): return 'COEF'
    if sec.startswith('1.') or re.search(r'Markstrat の提携|Factorio|対策の資料は|終盤の対策', text): return 'SDGAME'
    return 'SDDESIGN'

def cells(l):
    lm = re.sub(r'\[\[[^\]]*\]\]', lambda x: x.group(0).replace('|', '¦'), l)
    return [c.strip().replace('¦', '|') for c in lm.strip().strip('|').split('|')]

rows = []
# ---------- CALIB ----------
f = 'BIZ-CALIB.md'
L = open(os.path.join(DOCS, f), encoding='utf8').read().split('\n')
sec = None; h2 = ''
for i, l in enumerate(L, 1):
    if l.startswith('## '):
        h2 = l[3:].strip()
        sec = 'old' if 'M・K・L・R' in l else ('new' if '新しい行の一覧' in l else None)
    # ① (c) の行
    if sec and l.startswith('|') and not l.startswith('|---'):
        c = cells(l)
        if len(c) >= 3 and c[0] not in ('#', '行'):
            k = c[2].replace('*', ''); right = k.split('→')[-1]
            mm = re.search(r'\(([abc])\)', right)
            if mm and mm.group(1) == 'c':
                rows.append([f, i, '(c)', c[0], ' '.join(c[1:])])
    # ② 印
    for mk in MARK.finditer(l):
        s = max(l.rfind('。', 0, mk.start()), l.rfind('|', 0, mk.start()), 0)
        e = l.find('。', mk.end()); e = len(l) if e < 0 else e + 1
        rows.append([f, i, '推論' if mk.group(0).startswith('【推論') else '要確認', mk.group(0), l[s:e].strip('|。 ')])
    # ③ 未達
    if h2 == 'やっていないこと' and l.startswith('|') and not l.startswith('|---'):
        c = cells(l)
        if c[0] != 'やっていないこと': rows.append([f, i, '未達', c[0], ' '.join(c[1:])])
    if h2 == '依頼の対応表' and l.startswith('|') and re.search(r'\*\*一部\*\*|\*\*未達\*\*|未達）|\*\*倒産4件|\*\*借入の大きさ|\*\*中華料理店の事業所数|\*\*撤退した業態|\*\*2008〜2020', l):
        c = cells(l)
        if re.match(r'^\d+$', c[0]): rows.append([f, i, '未達', '基準' + c[0], ' '.join(c[1:])])

# ---------- SIMDESIGN ----------
f = 'BIZ-SIMDESIGN.md'
L = open(os.path.join(DOCS, f), encoding='utf8').read().split('\n')
h2 = ''
for i, l in enumerate(L, 1):
    if l.startswith('## '): h2 = l[3:].strip()
    for mk in MARK.finditer(l):
        s = max(l.rfind('。', 0, mk.start()), l.rfind('|', 0, mk.start()), 0)
        e = l.find('。', mk.end()); e = len(l) if e < 0 else e + 1
        kind = {'【資料なし】': '資料なし', '【要確認】': '要確認'}.get(mk.group(0), '推論')
        rows.append([f, i, kind, mk.group(0), l[s:e].strip('|。 ')])
    if h2 == 'やっていないこと' and l.startswith('- ') and re.search(r'置き値|需要の式の一次資料', l):
        rows.append([f, i, '未達', '箇条', l[2:]])

out = []
for n, (f, i, kind, name, text) in enumerate(rows, 1):
    if f == 'BIZ-CALIB.md': it = item_calib(kind, name, text, i)
    else:
        sec = ''
        it = item_sim(kind, text, '1.' if 83 <= i <= 94 else '')
    sc, lab, how = IT[it]
    out.append([f'C{n:03d}', f, i, kind, name, re.sub(r'\s+', ' ', text)[:260], it, sc, lab, how])

def ver(f):
    return subprocess.run(['git', 'log', '-1', '--format=%h', '--', os.path.join('docs', f)], cwd=ROOT, capture_output=True, text=True).stdout.strip() or '?'

with open(os.path.join(DOCS, 'analysis', 'fill-targets-calib.tsv'), 'w', encoding='utf8') as w:
    w.write('# 元の版: BIZ-CALIB.md@' + ver('BIZ-CALIB.md') + '・BIZ-SIMDESIGN.md@' + ver('BIZ-SIMDESIGN.md') + '。生成: python3 -I boki2/docs/analysis/fill-targets-calib.py\n')
    w.write('\t'.join(['id', '報告', '行', '種類', '行の名', '中身', '項目', '影響', '項目の中身', '扱い']) + '\n')
    for r in out: w.write('\t'.join(str(x).replace('\t', ' ') for x in r) + '\n')

C = collections.Counter
print('対象の総数:', len(out))
for f in ('BIZ-CALIB.md', 'BIZ-SIMDESIGN.md'):
    rr = [r for r in out if r[1] == f]
    print(f, len(rr), dict(C(r[3] for r in rr)))
print('扱い:', dict(C(r[9] for r in out)))
print('項目（影響の高い順）:')
by = collections.defaultdict(list)
for r in out: by[r[6]].append(r)
for k, rr in sorted(by.items(), key=lambda x: (-IT[x[0]][0], x[0])):
    print(f'  {k}\t影響{IT[k][0]}\t{IT[k][2]}\t{len(rr)}か所\t' + dict(C(r[3] for r in rr)).__repr__() + '\t' + IT[k][1])
