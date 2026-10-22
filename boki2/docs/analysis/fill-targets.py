#!/usr/bin/env python3
# BIZ-RAMEN.md と BIZ-MKT-RAMEN.md から【推論】【要確認】と表の [推] の印を全部抜き出し、
# docs/analysis/fill-targets.tsv に1印1行で書く（BIZ-FILL-RAMEN の補填の対象の一覧）。
# 使い方: python3 boki2/docs/analysis/fill-targets.py   （集計を標準出力に出す）
# 列: id 報告 行 章 行の見出し 列の見出し 印 種別 群 影響 中身
#   種別: 本体＝その場所で初めて述べた推論・不明／再掲＝論証の表・引き継ぎ・やっていないこと等で本体を言い直した所／説明＝印そのものの説明（補填の対象外）
#   群: 同じ問いに属する印をまとめた記号（下の GROUPS）。影響: 3 大・2 中・1 小（GROUPS の値。判断の理由は BIZ-FILL-RAMEN の「対象の一覧」）
import re, os, subprocess, collections

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
DOCS = os.path.join(ROOT, 'docs')
FILES = ['BIZ-RAMEN.md', 'BIZ-MKT-RAMEN.md']
MARK = re.compile(r'【推論[^】]*】|【要確認】|\[推\]')

# 群：(記号, 影響, 説明, 当てはめの正規表現（章・行の見出し・列の見出し・中身をつないだ文字列に当てる）, 報告の限定)
GROUPS = [
    ('META', 0, '印の説明・自己言及（補填の対象外）', r'＝資料にない|印のない文|印を付け|資料のない置き値で|マスの印は|確率は \[推\]|確率のマスは|補ったことに|【推論】の印|の \[推\] のマス|多くのマスは【推論】|空きは【推論】か|\[推\] のマスのうち', None),
    ('SEAS', 3, '季節の形（気温・暦・地域の行事・立地の型）', r'季節|夏休み|立地の型|地域の行事|観光|学生街|オフィス街|暦|夏|月別', 'BIZ-RAMEN.md'),
    ('MKT-PROB', 3, '打ち手の当たりの確率', r'当たりの確率|露出の確率|確率の大きさ', 'BIZ-MKT-RAMEN.md'),
    ('MKT-SIZE', 3, '打ち手の当たりの大きさ・分布', r'当たったときの大きさ|大きさの分布|裾の重い|対数正規|拡散|反応は大きく偏る|上限がある', 'BIZ-MKT-RAMEN.md'),
    ('MKT-LTV', 3, '常連の定着率・頻度・期間・客単価（CPA／LTV）', r'^8\.|CPA|LTV|客単価 p|常連の来店の頻度|通う期間|常連になる率|元が取れる|前借り', 'BIZ-MKT-RAMEN.md'),
    ('MKT-TIME', 2, '打ち手の効くまで・残る長さ', r'効くまで|残る長さ|いつ|時間の形|告知の日|溜まる|整えた時から', 'BIZ-MKT-RAMEN.md'),
    ('MKT-COST', 2, '打ち手の費用', r'費用の幅|いくら|材料1杯', 'BIZ-MKT-RAMEN.md'),
    ('MKT-MEAS', 1, '打ち手の測り方', r'どう測る', 'BIZ-MKT-RAMEN.md'),
    ('MKT-QUEUE', 2, '行列・苦情・常連離れ・期待外れの仕組み', r'行列|整理券|常連|期待|苦情|見えない待ち', 'BIZ-MKT-RAMEN.md'),
    ('MKT-CHAIN', 2, '打ち手の組み合わせ・逓減・事故の向き', r'^[234]\.|逓減|炎上|口コミの動機|送りすぎ|絞り違い|情報の誤り|使うだけ|発信者に題材|予兆|事故', 'BIZ-MKT-RAMEN.md'),
    ('MKT-DESIGN', 1, '設計案・置き換え案（資料の主張ではない）', r'^10\.|^11\.|状態を5つ|差し替え|懸賞', 'BIZ-MKT-RAMEN.md'),
    ('LIMITED', 2, '限定麺の外れの確率', r'限定|外れ', 'BIZ-RAMEN.md'),
    ('RECIPE', 2, '系統ごとの1杯の原価・仕込み・光熱費（6章の表）', r'^6\.|醤油（清湯）|^塩|味噌|家系|二郎系|煮干|鶏白湯|つけ麺|汁なし', 'BIZ-RAMEN.md'),
    ('NOODLE', 2, '自家製麺の機械代の回収・麺の原価の中身', r'製麺機|機械代|回収|麺の原価|小麦以外', 'BIZ-RAMEN.md'),
    ('RISK', 2, 'リスク表の重み・個人店への当てはめ', r'リスク|重要性|ゲームのイベント|社長への依存|そのまま置ける|そのまま写せる', 'BIZ-RAMEN.md'),
    ('FACTORY', 2, '製麺工場の投資額・稼働率', r'製麺工場', 'BIZ-RAMEN.md'),
    ('ENTRY', 2, '開業・廃業の率（経済センサス）・ブームの寿命', r'経済センサス|開設・廃業|寿命|ブーム', 'BIZ-RAMEN.md'),
    ('PROPERTY', 2, '物件（間借り）・券売機の値段', r'間借り|券売機', 'BIZ-RAMEN.md'),
    ('TASTE', 2, '味の改良で常連を失った例', r'味の改良|味を変え', 'BIZ-RAMEN.md'),
    ('MERCH', 1, '監修料・アパレル・通販の売れ残り・香味油・タレ', r'監修|アパレル|売れ残|香味油|タレ', 'BIZ-RAMEN.md'),
    ('YATAI', 1, '屋台の黒字化', r'屋台', 'BIZ-RAMEN.md'),
    ('OTHER', 1, 'その他', r'.', None),
]

def blob(f):
    try:
        return subprocess.run(['git', 'log', '-1', '--format=%h', '--', os.path.join('docs', f)], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    except Exception:
        return '?'


# 項目：同じ問いの印をまとめ、ゲームへの影響の点（10が最大）を付ける。点の付け方（BIZ-FILL-RAMEN「対象の一覧」に理由）：
#  9〜10 需要・採算の式の芯（季節の形・常連の定着・頼まない露出の確率と大きさ・チラシの反応）／7〜8 主な打ち手の数字・時間の形／
#  5〜6 1つの費用・1つの分岐の初期値／3〜4 小さな費用・事故の向き／1〜2 見た目・説明の注記。説明（META）は0。
# 鍵: (報告の名の2つ目の語の頭3字 RAM／MKT, 行, その行で何番目の印か（0から。None は全部）)
ITEMS = {
 ('RAM', 331, None): ('S1', 10, '家計の8月の山は暦（夏休み・帰省）か気温か'),
 ('RAM', 343, 0): ('S1', 10, '家計の8月の山は暦（夏休み・帰省）か気温か'),
 ('RAM', 533, None): ('S1', 10, '家計の8月の山は暦（夏休み・帰省）か気温か'),
 ('RAM', 634, None): ('S1', 10, '家計の8月の山は暦（夏休み・帰省）か気温か'),
 ('RAM', 462, None): ('S4', 9, '学生街は大学の休みに谷'),
 ('RAM', 340, None): ('S4', 9, '学生街は大学の休みに谷'),
 ('RAM', 343, 1): ('S3', 9, 'オフィス街は連休に谷'),
 ('RAM', 343, 2): ('S4', 9, '学生街は大学の休みに谷'),
 ('RAM', 343, 3): ('S5', 9, '観光地は観光の季節に山'),
 ('RAM', 341, 0): ('S6', 8, '地域の行事（祭り）・観光の月の店の実数'),
 ('RAM', 341, 1): ('S5', 9, '観光地は観光の季節に山'),
 ('MKT', 352, None): ('L1', 10, '新規が常連になる率 r'),
 ('MKT', 350, None): ('L2', 9, '常連の来店の頻度 f'),
 ('MKT', 351, None): ('L3', 9, '常連が通う期間 m'),
 ('MKT', 346, None): ('L4', 7, '1回の客単価 p'),
 ('MKT', 356, None): ('L1', 10, '新規が常連になる率 r'),
 ('MKT', 357, None): ('L1', 10, '新規が常連になる率 r'),
 ('MKT', 362, None): ('M3', 9, 'チラシ・ポスティングの反応率'),
 ('MKT', 363, None): ('M7', 6, 'グルメサイトの有料プランの来店効果'),
 ('MKT', 366, None): ('M9', 5, 'SNS 広告の効果の大きさ'),
 ('MKT', 369, None): ('M14', 5, 'フェスの材料の原価と売れ残り'),
 ('MKT', 147, None): ('M1', 9, '頼まない露出（賞・テレビ・動画）が起きる確率'),
 ('MKT', 574, None): ('M1', 9, '頼まない露出（賞・テレビ・動画）が起きる確率'),
 ('MKT', 216, None): ('M1', 9, '頼まない露出（賞・テレビ・動画）が起きる確率'),
 ('MKT', 148, None): ('M2', 9, '当たりの大きさの分布（裾の重さ）'),
 ('MKT', 113, 1): ('M4', 8, '賞・ランキングに選ばれた後の客数の増え方'),
 ('MKT', 114, None): ('M5', 7, '賞・格付けの効果が残る長さ'),
 ('MKT', 149, 0): ('M5', 7, '賞・格付けの効果が残る長さ'),
 ('MKT', 130, None): ('M3', 9, 'チラシ・ポスティングの反応率'),
 ('MKT', 131, None): ('M3', 9, 'チラシ・ポスティングの反応率'),
 ('MKT', 197, None): ('M6', 7, 'チラシのくり返しの逓減'),
 ('MKT', 196, None): ('M6', 7, 'チラシのくり返しの逓減'),
 ('MKT', 116, None): ('M7', 6, 'グルメサイトの有料プランの来店効果'),
 ('MKT', 80, None): ('M7', 6, 'グルメサイトの有料プランの来店効果'),
 ('MKT', 115, None): ('M8', 6, 'グルメサイトの点数・口コミの効果の残り方'),
 ('MKT', 133, None): ('M10', 7, 'SNS の自前の発信の当たりの偏り・残り方'),
 ('MKT', 97, None): ('M10', 7, 'SNS の自前の発信の当たりの偏り・残り方'),
 ('MKT', 134, None): ('M9', 5, 'SNS 広告の効果の大きさ'),
 ('MKT', 136, None): ('M11', 7, 'LINE・会員の呼び戻しの率'),
 ('MKT', 137, None): ('M12', 6, 'クーポンの上乗せ（元から来る客の割合）・値引きの癖'),
 ('MKT', 101, None): ('M12', 6, 'クーポンの上乗せ（元から来る客の割合）・値引きの癖'),
 ('MKT', 139, None): ('M13', 7, '開店景気の後の落ち込み'),
 ('MKT', 117, None): ('M15', 7, '限定麺の当日の山・前借り・残り方'),
 ('MKT', 149, 1): ('M15', 7, '限定麺の当日の山・前借り・残り方'),
 ('MKT', 81, None): ('M15', 7, '限定麺の当日の山・前借り・残り方'),
 ('MKT', 190, None): ('M15', 7, '限定麺の当日の山・前借り・残り方'),
 ('MKT', 434, None): ('M15', 7, '限定麺の当日の山・前借り・残り方'),
 ('MKT', 178, None): ('M16', 6, '行列で来た客の期待外れ'),
 ('MKT', 401, None): ('M16', 6, '行列で来た客の期待外れ'),
 ('MKT', 83, 1): ('M16', 6, '行列で来た客の期待外れ'),
 ('MKT', 172, None): ('M17', 6, '常連は値段・天気に強い（当たりの後の底）'),
 ('MKT', 426, None): ('M12', 6, 'クーポンの上乗せ（元から来る客の割合）・値引きの癖'),
 ('MKT', 433, None): ('M18', 7, '炎上の客数の減りの大きさ'),
 ('MKT', 120, None): ('M19', 5, '写真映えの当たり・効くまで'),
 ('MKT', 84, None): ('M19', 5, '写真映えの当たり・効くまで'),
 ('MKT', 118, None): ('M20', 5, '行列の整理（整理券）の費用と効果'),
 ('MKT', 82, None): ('M20', 5, '行列の整理（整理券）の費用と効果'),
 ('MKT', 402, None): ('M20', 5, '行列の整理（整理券）の費用と効果'),
 ('MKT', 129, None): ('M21', 5, '通販の費用・在庫・残り方'),
 ('MKT', 126, None): ('M22', 5, '動画・発信者の投稿の残り方'),
 ('MKT', 127, None): ('M22', 5, '動画・発信者の投稿の残り方'),
 ('MKT', 91, None): ('M22', 5, '動画・発信者の投稿の残り方'),
 ('MKT', 90, None): ('M22', 5, '動画・発信者の投稿の残り方'),
 ('MKT', 123, None): ('M23', 4, 'フェスの来場者が本店に来るか'),
 ('MKT', 88, None): ('M23', 4, 'フェスの来場者が本店に来るか'),
 ('MKT', 135, None): ('M24', 4, '地図・情報の整備の残り方と事故'),
 ('MKT', 99, None): ('M24', 4, '地図・情報の整備の残り方と事故'),
 ('MKT', 104, None): ('M25', 4, '看板の値段と効果'),
 ('MKT', 165, None): ('M26', 3, '口コミの動機の強さの時期'),
 ('MKT', 189, None): ('M27', 3, '当たりの予兆と備えの順番'),
 ('MKT', 410, None): ('M27', 3, '当たりの予兆と備えの順番'),
 ('MKT', 195, None): ('M28', 4, '店主の発信の炎上が点数・紹介に及ぶ'),
 ('MKT', 385, None): ('M29', 3, 'SNS 懸賞の景品の区分（法令）'),
 ('MKT', 398, None): ('M30', 1, '状態5つの設計案（資料の主張ではない）'),
 ('RAM', 238, None): ('R1', 7, '限定麺の外れの確率'),
 ('RAM', 117, None): ('R1', 7, '限定麺の外れの確率'),
 ('RAM', 353, None): ('R2', 7, 'ラーメン店の開業・廃業の率（経済センサス）'),
 ('RAM', 368, None): ('R3', 7, 'ブームの寿命'),
 ('RAM', 440, None): ('R3', 7, 'ブームの寿命'),
 ('RAM', 271, None): ('R4', 6, 'リスク表の重み・個人店への当てはめ'),
 ('RAM', 246, None): ('R4', 6, 'リスク表の重み・個人店への当てはめ'),
 ('RAM', 543, None): ('R4', 6, 'リスク表の重み・個人店への当てはめ'),
 ('RAM', 22, None): ('R5', 5, '自家製麺の機械代の回収'),
 ('RAM', 111, None): ('R5', 5, '自家製麺の機械代の回収'),
 ('RAM', 482, None): ('R5', 5, '自家製麺の機械代の回収'),
 ('RAM', 542, None): ('R5', 5, '自家製麺の機械代の回収'),
 ('RAM', 136, None): ('R6', 5, '製麺工場の投資額・稼働率'),
 ('RAM', 118, None): ('R7', 5, '味の改良で常連を失った例'),
 ('RAM', 124, None): ('R8', 4, '間借りの条件'),
 ('RAM', 127, None): ('R9', 3, '券売機の値段・失敗'),
 ('RAM', 141, None): ('R10', 4, 'カップ麺の監修料'),
 ('RAM', 485, None): ('R10', 4, 'カップ麺の監修料'),
 ('RAM', 142, None): ('R11', 3, 'アパレルの売上・取り分'),
 ('RAM', 140, None): ('R12', 3, '通販の売れ残り'),
 ('RAM', 114, None): ('R13', 2, '香味油の原価'),
 ('RAM', 112, None): ('R14', 2, 'タレだけの失敗'),
 ('RAM', 422, None): ('R15', 3, '屋台の黒字化'),
 ('RAM', 173, None): ('R16', 2, '麺の原価の大半は小麦以外'),
 ('RAM', 546, None): ('R16', 2, '麺の原価の大半は小麦以外'),
 ('RAM', 496, None): ('R17', 5, '系統ごとの1杯の原価・仕込み・光熱費（6章）'),
 ('RAM', 642, None): ('R17', 5, '系統ごとの1杯の原価・仕込み・光熱費（6章）'),
}

RESTATE_SECTIONS = re.compile(r'論証の表|依頼の対応表|やっていないこと|引き継ぎ|差し替えるべき所|反証と限界|要点|DESIGN-RAMEN の数字の差し替え')

rows = []
for f in FILES:
    lines = open(os.path.join(DOCS, f), encoding='utf8').read().split('\n')
    sec = ''; header = None
    for i, l in enumerate(lines, 1):
        if re.match(r'^#{2,3} ', l):
            sec = re.sub(r'^#+ ', '', l).strip(); header = None
        # 出典の [[…|「…」]] の中の | で列が割れないよう、同じ長さの別の字に置き換えてから割る
        lm = re.sub(r'\[\[[^\]]*\]\]', lambda x: x.group(0).replace('|', '¦'), l)
        if l.startswith('|'):
            cells = [c.strip().replace('¦', '|') for c in lm.strip().strip('|').split('|')]
            if i < len(lines) and re.match(r'^\|[\s\-|:]+\|?$', lines[i]):
                header = cells; continue
            if re.match(r'^\|[\s\-|:]+\|?$', l):
                continue
        else:
            cells = None
        for occ, m in enumerate(MARK.finditer(l)):
            if cells:
                # 印のある列を探す
                ci = 0; acc = lm.strip().strip('|')
                off = lm.index(acc) if acc in lm else 0
                k = m.start() - off
                parts = acc.split('|'); run = 0
                for j, p in enumerate(parts):
                    if run <= k <= run + len(p):
                        ci = j; break
                    run += len(p) + 1
                cell = cells[ci] if ci < len(cells) else ''
                rowh = cells[0] if cells else ''
                colh = header[ci] if header and ci < len(header) else ''
            else:
                s = max(l.rfind('。', 0, m.start()), 0)
                e = l.find('。', m.end()); e = len(l) if e < 0 else e + 1
                cell = l[s:e].strip('。 '); rowh = ''; colh = ''
            ctx = f'{sec}｜{rowh}｜{colh}｜{cell}'
            g = None
            for gid, imp, desc, rx, only in GROUPS:
                if only and only != f: continue
                if gid == 'META':
                    hit = re.search(rx, l)
                elif gid in ('MKT-PROB', 'MKT-SIZE', 'MKT-TIME', 'MKT-COST', 'MKT-MEAS'):
                    # 1.1・1.2 の表のマスは列の見出しで振る。表の外は中身で
                    hit = re.search(rx, colh) if colh else (gid in ('MKT-PROB', 'MKT-SIZE') and re.search(rx, cell))
                elif gid in ('MKT-LTV', 'MKT-CHAIN', 'MKT-DESIGN'):
                    hit = re.search(rx, sec) or (gid != 'MKT-DESIGN' and re.search(rx, cell))
                elif gid == 'RECIPE':
                    hit = sec.startswith('6.') and not re.search(r'小麦以外', cell)
                else:
                    hit = re.search(rx, ctx)
                if hit:
                    g = (gid, imp); break
            if re.search(r'根拠の種類の印|資料で支えられた段と|次の筋で置く|確率はほとんどが|資料で埋まらないマスは', l) and not re.search(r'中央値', cell):
                g = ('META', 0)
            kind = '説明' if g[0] == 'META' else ('再掲' if RESTATE_SECTIONS.search(sec) or (f, i) in (('BIZ-RAMEN.md', 496), ('BIZ-RAMEN.md', 642)) else '本体')
            it = ITEMS.get((f.split('-')[1][:3], i, occ)) or ITEMS.get((f.split('-')[1][:3], i, None))
            if g[0] == 'META': it = ('-', 0, '印の説明（対象外）')
            elif not it:
                if g[0] == 'RECIPE': it = ('R17', 5, '系統ごとの1杯の原価・仕込み・光熱費（6章）')
                elif g[0] == 'MKT-COST': it = ('M31', 4, '打ち手の小さな費用（試作・器・謝礼・整理の人）')
                elif g[0] == 'MKT-MEAS': it = ('M32', 3, '打ち手の効果の測り方')
                else: it = ('M33', 3, 'その他の事故・向き（' + rowh + '）')
            rows.append([f, i, sec, rowh, colh, m.group(0), kind, g[0], g[1], it[0], it[1], it[2], re.sub(r'\s+', ' ', cell)[:240], f'T{len(rows)+1:03d}'])

out = os.path.join(DOCS, 'analysis', 'fill-targets.tsv')
with open(out, 'w', encoding='utf8') as w:
    w.write('# 元の版: ' + '・'.join(f'{f}@{blob(f)}' for f in FILES) + '。生成: python3 boki2/docs/analysis/fill-targets.py\n')
    w.write('\t'.join(['id', '報告', '行', '章', '行の見出し', '列の見出し', '印', '種別', '群', '影響', '項目', '点', '項目の中身', '中身']) + '\n')
    for n, r in enumerate(rows, 1):
        w.write('\t'.join([r[-1]] + [str(x).replace('\t', ' ') for x in r[:-1]]) + '\n')

c = collections.Counter
print('印の総数:', len(rows))
for f in FILES:
    rr = [r for r in rows if r[0] == f]
    print(f, '計', len(rr), dict(c(r[5][:3] if r[5] != '[推]' else '[推]' for r in rr)), '行数', len(set(r[1] for r in rr)))
print('種別:', dict(c(r[6] for r in rows)))
print('群ごと（本体・再掲／影響）:')
for gid, imp, desc, *_ in GROUPS:
    rr = [r for r in rows if r[7] == gid]
    if rr: print(f'  {gid}\t影響{imp}\t計{len(rr)}\t本体{sum(r[6]=="本体" for r in rr)}\t再掲{sum(r[6]=="再掲" for r in rr)}\t説明{sum(r[6]=="説明" for r in rr)}\t{desc}')
print('項目ごと（点の高い順。本体の印の数／再掲）:')
by = collections.defaultdict(list)
for r in rows:
    if r[6] != '説明': by[(r[9], r[10], r[11])].append(r)
for (iid, sc, lab), rr in sorted(by.items(), key=lambda x: (-x[0][1], x[0][0])):
    print(f'  {iid}\t点{sc}\t本体{sum(r[6]=="本体" for r in rr)}\t再掲{sum(r[6]=="再掲" for r in rr)}\t{lab}')
body = [r for r in rows if r[6] == '本体']
# 上位30：項目の単位で、点の高い順（同点は印の数が多い順、次に項目の記号）。印の単位にしないのは、同じ問いの言い直しで件数が増えないようにするため
rank = sorted(by.items(), key=lambda x: (-x[0][1], -len(x[1]), x[0][0]))
top = [k for k, _ in rank[:30]]
with open(os.path.join(DOCS, 'analysis', 'fill-top30.tsv'), 'w', encoding='utf8') as w:
    w.write('順位\t項目\t点\t印の数\t項目の中身\t印のid\n')
    for n, ((iid, sc, lab), rr) in enumerate(rank[:30], 1):
        w.write(f'{n}\t{iid}\t{sc}\t{len(rr)}\t{lab}\t{",".join(r[-1] for r in rr)}\n')
print('上位30の項目（点の下限', top[-1][1], '）:', ' '.join(k[0] for k in top))
print('上位30に入る印の数:', sum(len(rr) for k, rr in rank[:30]), '／説明を除く全印', sum(len(rr) for rr in by.values()))
print('点の分布（本体）:', dict(sorted(c(r[10] for r in body).items(), reverse=True)))
print('影響の大きさ（説明を除く）:', dict(sorted(c(r[8] for r in rows if r[6] != '説明').items(), reverse=True)))
