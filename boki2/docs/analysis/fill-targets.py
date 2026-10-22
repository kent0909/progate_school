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
        for m in MARK.finditer(l):
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
            kind = '説明' if g[0] == 'META' else ('再掲' if RESTATE_SECTIONS.search(sec) else '本体')
            rows.append([f, i, sec, rowh, colh, m.group(0), kind, g[0], g[1], re.sub(r'\s+', ' ', cell)[:240]])

out = os.path.join(DOCS, 'analysis', 'fill-targets.tsv')
with open(out, 'w', encoding='utf8') as w:
    w.write('# 元の版: ' + '・'.join(f'{f}@{blob(f)}' for f in FILES) + '。生成: python3 boki2/docs/analysis/fill-targets.py\n')
    w.write('\t'.join(['id', '報告', '行', '章', '行の見出し', '列の見出し', '印', '種別', '群', '影響', '中身']) + '\n')
    for n, r in enumerate(rows, 1):
        w.write('\t'.join([f'T{n:03d}'] + [str(x).replace('\t', ' ') for x in r]) + '\n')

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
print('影響の大きさ（説明を除く）:', dict(sorted(c(r[8] for r in rows if r[6] != '説明').items(), reverse=True)))
