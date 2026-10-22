#!/usr/bin/env python3
# BIZ-LAW-RAMEN.md の件数をすべてここで数える（QUALITY 6.2-2：頭の中で数えた数は書かない）。
# 使い方: python3 -I boki2/docs/analysis/bizlaw-ramen-count.py
#  1) r5-blr の読了ノート（新しく読んだ資料）と節のノート（#blr）を、資料の種類ごとに数える
#  2) 外食の FC 開示書面7社の訴訟件数を原文 PDF から数える
#  3) 報告の中の灰色の判断・事例・仕訳・統計・対応表の行を数える
#  4) 景表法の課徴金の試算（条文どおりの式）
import os, re, subprocess, json, glob

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
N = os.path.join(ROOT, 'research', 'notes')
REP = os.path.join(ROOT, 'docs', 'BIZ-LAW-RAMEN.md')

# ---- 1) 資料の種類（ノートごとに手で付けた分類。理由は報告の「資料の内訳」） ----
# gov=官公庁（法令・省庁の案内と統計・内閣官房）、prac=実務者・業界の解説、case=事例（報道・企業の開示）、
# research=研究（大学の紀要・評釈）、stat=民間の統計、maker=作り手の話、oppo=反対意見
KIND = {
 # law:primary（官公庁）
 'r5-blr-caa-unyou-r7': 'gov', 'r5-blr-egov-dokkinhou': 'gov', 'r5-blr-egov-fueihou': 'gov', 'r5-blr-egov-fukyouhou': 'gov',
 'r5-blr-egov-hojin-full': 'gov', 'r5-blr-egov-kaisha-full': 'gov', 'r5-blr-egov-keihyo-rei': 'gov', 'r5-blr-egov-keihyo8': 'gov',
 'r5-blr-egov-kenpo': 'gov', 'r5-blr-egov-kenzou': 'gov', 'r5-blr-egov-kounen': 'gov', 'r5-blr-egov-minpo-full': 'gov',
 'r5-blr-egov-nyukan': 'gov', 'r5-blr-egov-pl': 'gov', 'r5-blr-egov-roukihou': 'gov', 'r5-blr-egov-shakuchi': 'gov',
 'r5-blr-egov-shohi-full': 'gov', 'r5-blr-egov-shokuei-full': 'gov', 'r5-blr-egov-shokuei-rei': 'gov', 'r5-blr-egov-shokuhyo-kijun': 'gov',
 'r5-blr-egov-shoshinkou-kisoku': 'gov', 'r5-blr-egov-shoshinkou': 'gov', 'r5-blr-egov-sotoku-full': 'gov', 'r5-blr-egov-takken': 'gov',
 'r5-blr-egov-tousan-kyosai': 'gov', 'r5-blr-mhlw-chojikan-r6': 'gov', 'r5-blr-mhlw-fubarai-r6-pdf': 'gov', 'r5-blr-mhlw-fubarai-r6': 'gov',
 'r5-blr-mhlw-shokuchu-inshoku': 'gov', 'r5-blr-cas-hikisage-gaiyou': 'gov', 'r5-blr-egov-toriteki': 'gov',
 # 企業の開示（JPX に載る会社の書類、EDINET の四半期報告書）
 'r5-blr-jpx-kairikiya-1s': 'case', 'r5-blr-gift-yuho-a': 'case',
 # 実務者
 'r5-blr-ejinzai-invoice-r8': 'prac', 'r5-blr-smarthr-tencho': 'prac', 'r5-blr-mclaw-kanrishoku': 'prac', 'r5-blr-shiodome-ipo': 'prac',
 'r5-blr-masouken-zangyo': 'prac', 'r5-blr-mf-ma-boogai': 'prac', 'r5-blr-mf-genjou': 'prac', 'r5-blr-mf-teikishakuya': 'prac',
 'r5-blr-mf-futourenbai': 'prac', 'r5-blr-mf-roukisho': 'prac', 'r5-blr-batonz-hosho': 'prac', 'r5-blr-monolith-tabelog': 'prac',
 'r5-blr-rodo-hibou': 'prac', 'r5-blr-rodo-shaho-inshoku': 'prac', 'r5-blr-rodo-shaho-hanbai': 'prac', 'r5-blr-nenkin-tekiyou1': 'gov', 'r5-blr-zeiken-chuko': 'prac', 'r5-blr-jinjer-ipo': 'prac', 'r5-blr-ayusawa-chousa': 'prac',
 'r5-blr-keiyaku-tabelog': 'prac',
 # 事例（報道）
 'r5-blr-seijiyama-hotel': 'case', 'r5-blr-seijiyama-ichiran': 'case', 'r5-blr-jcast-sukiya': 'case', 'r5-blr-rodo-souken-inshoku': 'case',
 'r5-blr-rodo-machida-tencho': 'case',
 # 研究
 'r5-blr-aichiu-fc-hanrei': 'research', 'r5-blr-hokudai-casenote91b': 'research',
 # 民間の統計
 'r5-blr-tsr-ramen-tousan2025': 'stat', 'r5-blr-tsr-shohizei-inshoku': 'stat',
 # 事例（第3版）：官公庁のサイトが載せた事例の集め。中身が個々の事例なので事例に数える（官公庁に数えても 34/69＝0.493 で半分以下）
 'r5-blr-fsa-hoshou-jirei': 'case', 'r5-blr-mirasapo-17611': 'case',
 # 作り手の話
 'r5-blr-econ-cartelgame': 'maker',
 # 反対意見
 'r5-blr-zenshoren-shaho': 'oppo', 'r5-blr-gendai-gisou': 'oppo',
 'r5-blr-keidanren-kachoukin2014': 'oppo', 'r5-blr-keidanren-fukusuu2014': 'oppo',
}
LABEL = {'gov': '一次資料・統計（官公庁）', 'prac': '実務者・業界の解説', 'case': '事例（報道・企業の開示）', 'research': '研究',
         'stat': '統計（民間）', 'maker': '作り手の話', 'oppo': '反対意見'}

def notes():
    out = []
    for p in glob.glob(os.path.join(N, '*', '*', '*.md')):
        b = os.path.basename(p)[:-3]
        if b.startswith('r5-blr-') or b.endswith('#blr'):
            out.append((os.path.relpath(p, N), b))
    return sorted(out)

ns = notes()
new = [b for _, b in ns if b.startswith('r5-blr-')]
sec = [b for _, b in ns if b.endswith('#blr')]
missing = [b for b in new if b not in KIND]
print('## 1) 読了ノート')
print(f'新しく読んだ資料のノート {len(new)} 本、既にある資料の節のノート（#blr）{len(sec)} 本、合計 {len(new) + len(sec)} 本')
if missing: print('分類がないノート:', missing)
cnt = {}
for b in new: cnt[KIND.get(b, '?')] = cnt.get(KIND.get(b, '?'), 0) + 1
for k in ['gov', 'prac', 'case', 'research', 'stat', 'maker', 'oppo']:
    print(f'  {LABEL[k]}: {cnt.get(k, 0)}')
print(f'  種類の数: {len([k for k in cnt if cnt[k] > 0])}、官公庁の割合: {cnt.get("gov", 0)}/{len(new)} = {cnt.get("gov", 0) / len(new):.3f}')
print('  節のノート:', ', '.join(sec))

# ---- 2) 外食の FC 開示書面の訴訟件数 ----
print('\n## 2) FC 開示書面の訴訟件数（日本フランチャイズチェーン協会の掲載分のうち外食7社）')
JFA = ['yamagoya', 'tadokoro', 'ajisen', 'hachiban', 'bannai', 'kagetsu', 'osakaosho']
tot_years = 0; tot_suits = 0
for k in JFA:
    f = os.path.join(ROOT, 'research', 'raw', 'web', 'bizgrowth', f'r5-growth-jfa-{k}.pdf')
    if not os.path.exists(f): print(k, '原文なし'); continue
    t = subprocess.run(['pdftotext', '-layout', f, '-'], capture_output=True, text=True).stdout
    i = t.find('提起した訴えの件数')  # 表の見出し（目次の行ではなく本文の表）
    blk = t[i:i + 1500]
    rows = re.findall(r'^\s*((?:令和\s*\d+|\d{4}|[０-９]{4})\s*年度)\s+(\S+)\s+(\S+)', blk, re.M)
    years = len(rows)
    def num(x):
        x = x.translate(str.maketrans('０１２３４５６７８９', '0123456789'))
        return 0 if x in ('該当なし', '〃', '－', '-') else (int(x) if x.isdigit() else None)
    suits = sum((num(a) or 0) + (num(b) or 0) for _, a, b in rows)
    tot_years += years; tot_suits += suits
    print(f'  {k}: 年度 {years}、訴え（加盟者から＋本部から）の合計 {suits}  {[r[0] for r in rows]}')
print(f'  合計：{len(JFA)}社 × 年度 = {tot_years} 社年、訴えの件数 {tot_suits}')

# ---- 3) 報告の中の行を数える ----
print('\n## 3) 報告の中の数')
if os.path.exists(REP):
    s = open(REP, encoding='utf-8').read()
    def sect(title):
        m = re.search(r'^## ' + re.escape(title) + r'.*?$(.*?)(?=^## |\Z)', s, re.M | re.S)
        return m.group(1) if m else ''
    gray = re.findall(r'^\| G\d+ ', sect('灰色の判断の一覧').split('### 型の付け直し')[0], re.M)
    cases = re.findall(r'^\| E\d+ ', sect('事例と判例'), re.M)
    fail = re.findall(r'^\| E\d+ \|[^|]*\|[^|]*失敗', sect('事例と判例'), re.M)
    succ = re.findall(r'^\| E\d+ \|[^|]*\|[^|]*成功', sect('事例と判例'), re.M)
    gaishoku = re.findall(r'^\| E\d+ \|[^|]*外食', sect('事例と判例'), re.M)
    stats = re.findall(r'^\| S\d+ ', sect('起きる確率の根拠'), re.M)
    jrn = re.findall(r'^（J\d+', sect('仕訳の例'), re.M)
    jrn2 = re.findall(r'^（J\d+[^）]*2級の外', sect('仕訳の例'), re.M)
    design = re.findall(r'^\| D\d+ ', sect('DESIGN-RAMEN の判断への対応表'), re.M)
    groups = re.findall(r'^### 群(\d+)', sect('打ち手ごとの法務と会計'), re.M)
    subs = {}
    cur = None
    for line in sect('打ち手ごとの法務と会計').split('\n'):
        m = re.match(r'^### 群(\d+)', line)
        if m: cur = m.group(1); subs[cur] = 0
        elif cur and re.match(r'^#### ', line): subs[cur] += 1
    appA = re.findall(r'^\| A\d+ ', sect('付録A の128項目の仕分け'), re.M)
    n5 = re.findall(r'^\| N5-\d+ ', sect('判定書 N5 の14件の取り込み'), re.M)
    print(f'  灰色の判断 {len(gray)} 件')
    # 型の列（最後の列の先頭の英字 a〜d）を自分で数える（論証の検査 R005 の型分類を写さず、自分の表から数え直す）
    kinds = {}
    graysec = sect('灰色の判断の一覧').split('### 型の付け直し')[0]  # 付け直しの理由の表は数えない
    for row in re.findall(r'^\| G\d+ .*$', graysec, re.M):
        last = row.rstrip().rstrip('|').split('|')[-1].strip()
        kinds[last[:1] or '?'] = kinds.get(last[:1] or '?', 0) + 1
    print(f'  灰色の判断の型 {dict(sorted(kinds.items()))}（a 当てはめが揺れる・b 文言で決まる・c 法の外で決まる引き換え・d 発覚だけ揺れる・e 会計基準の判断・未 未確定。定義は報告の灰色の判断の一覧の頭、第3版で書き手が立てたもの）')
    print(f'  事例と判例 {len(cases)} 件（失敗 {len(fail)}、成功 {len(succ)}、外食・ラーメン {len(gaishoku)}）')
    print(f'  統計 {len(stats)} 項目')
    print(f'  仕訳の例 {len(jrn)} 例（うち2級の外と書いたもの {len(jrn2)}）')
    print(f'  DESIGN の判断の行 {len(design)} 行')
    print(f'  打ち手の群 {len(groups)} 群、各群の小節の数 {subs}')
    print(f'  付録A の仕分けの行 {len(appA)} 行、N5 の行 {len(n5)} 行')
    body = len(sect('打ち手ごとの法務と会計'))
    newg = sum(len(x) for x in re.split(r'^### 群', sect('打ち手ごとの法務と会計'), flags=re.M)[1:])
    print(f'  打ち手の章の字数 {body}')

# ---- 4) 課徴金の試算（景表法8条1項・2項、施行令1条。式は報告の「課徴金の計算」）----
print('\n## 4) 課徴金の試算')
def kachoukin(annual, share, months, rate=0.03):
    base = annual * share * min(months, 36) / 12   # 対象期間は最長3年（8条2項）
    k = base * rate
    return base, k, (k >= 1_500_000)
for annual, share, months in [(35_000_000, 0.85, 36), (35_000_000, 0.85, 24), (35_000_000, 0.85, 20), (35_000_000, 0.10, 36), (35_000_000, 0.5, 36)]:
    b, k, on = kachoukin(annual, share, months)
    print(f'  年商{annual:,}円×対象の割合{share}×{months}か月 → 対象売上{b:,.0f}円 ×3% = {k:,.0f}円 → {"命じられる" if on else "150万円未満で命じない"}')
# 150万円に届く月数： annual*share*m/12*0.03 >= 1,500,000 → m >= 1,500,000*12/(0.03*annual*share)
for share in (1.0, 0.85, 0.5):
    m = 1_500_000 * 12 / (0.03 * 35_000_000 * share)
    print(f'  年商3,500万円・対象の割合{share}：150万円に届くのは {m:.1f} か月以上')

# ---- 5) DESIGN 対応表の「画面に出してよい法令の文」の条番号を law のノートと突き合わせる（law-check.js と同じ判定）----
print('\n## 5) DESIGN 対応表の法令の文と law のノート')
LAWDIR = os.path.join(ROOT, 'research', 'notes', 'law')
import unicodedata
lawnotes = []
for p in glob.glob(os.path.join(LAWDIR, '**', '*.md'), recursive=True):
    lawnotes.append(unicodedata.normalize('NFKC', open(p, encoding='utf-8').read()))
KJ = {'〇': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9}
def kanjinum(x):
    n = cur = 0
    for ch in x:
        if ch in KJ: cur = KJ[ch]
        elif ch == '十': n += (cur or 1) * 10; cur = 0
        elif ch == '百': n += (cur or 1) * 100; cur = 0
        elif ch == '千': n += (cur or 1) * 1000; cur = 0
    return n + cur
ALIAS = {'補助金適正化法': '補助金等に係る予算の執行の適正化に関する法律'}  # 略称 → ノートに書いた正式名
def note_has(law, art):
    for t in lawnotes:
        if law not in t and ALIAS.get(law, '\0') not in t: continue
        nums = {int(m) for m in re.findall(r'第?(\d+)条', t)} | {kanjinum(m) for m in re.findall(r'第([〇一二三四五六七八九十百千]+)条', t)}
        if art in nums: return True
    return False
if os.path.exists(REP):
    s = open(REP, encoding='utf-8').read()
    m = re.search(r'^## DESIGN-RAMEN の判断への対応表.*?$(.*?)(?=^## |\Z)', s, re.M | re.S)
    sec_d = m.group(1) if m else ''
    ok = ng = 0; bad = []
    for row in re.findall(r'^\| D\d+ .*$', sec_d, re.M):
        last = row.rstrip('|').split('|')[-1]
        last = unicodedata.normalize('NFKC', last)
        for mm in re.finditer(r'([一-龥ァ-ヶー]+?(?:法|規則|令))((?:\d+条(?:の\d+)?(?:\d+項)?[・、]?)+)', last):
            law = mm.group(1)
            for a in re.findall(r'(\d+)条', mm.group(2)):
                if note_has(law, int(a)): ok += 1
                else: ng += 1; bad.append(f'{law}{a}条')
    print(f'  条番号 {ok + ng} 件のうち、law のノートで確かめられたもの {ok}、確かめられないもの {ng} {bad}')

# ---- 6) 新しい群の割合：第3版で 11) に一本化した（第2版の 6) は群6 だけを旧とする別の分け方で「全体」0.271 を出し、
# 第1版の言い訳の文を出し続けていた。論証の検査 V111）。割合は 11) だけを見る ----
print('\n## 6) 新しい群の割合 → 11) に一本化（第3版）')

# ---- 7) 課徴金の試算（第2版）：税抜・税込・免税の前提と、店の数で届く限定の1品 ----
print('\n## 7) 課徴金の試算（税の前提と店の数）')
NET = 35_000_000            # 1号店の年の売上（税抜。DESIGN 68行の置き値）
MIX = 0.7 * 1.10 + 0.3 * 1.08  # 店内7・持ち帰り3と置いたときの税込の倍率【推論：構成の置き値】
cases = {'税抜の年商のまま（第1版の表）': NET, '税込（店内10%・持ち帰り8%を7:3）': NET * MIX, '免税の1号店（3,500万円が対価の総額）': NET}
for name, annual in cases.items():
    m = 1_500_000 * 12 / (0.03 * annual * 0.85)
    k = annual * 0.85 * 3 * 0.03
    print(f'  {name}：年 {annual:,.0f}円、看板の麺0.85で150万円に届くのは {m:.1f} か月、36か月で {k:,.0f}円')
import math
print('  全店で同じ限定の1品（1店の売上の10%）を偽ったとき、150万円（対象の売上5,000万円）に届く店の数')
for months in (12, 24, 36):
    a = math.ceil(50_000_000 / (0.10 * NET * months / 12))
    b = math.ceil(50_000_000 / (0.10 * NET * MIX * months / 12))
    print(f'    {months}か月：税抜 {a} 店、税込 {b} 店')

# ---- 8) 偽りの損得（得の側と損の側。置き値はすべて【推論】）----
print('\n## 8) 偽りの損得（1号店・看板の麺に「国産小麦100%」と偽る・36か月）')
PRICE = 900                     # 1杯の値段（税抜）【推論】
bowls = NET * 0.85 / PRICE * 3  # 36か月の看板の麺の杯数
kacho = NET * MIX * 0.85 * 3 * 0.03       # 課徴金（税込の売上×3%）
shuchi = 400_000                # 措置命令の周知の新聞広告（J19 の置き値）【推論】
kyakugen = NET * 0.10 * 0.65    # 発覚の後1年、客が1割減ったときの粗利の減り（粗利率65%）【推論】
print(f'  看板の麺の杯数（36か月）{bowls:,.0f} 杯、課徴金 {kacho:,.0f}円、周知 {shuchi:,.0f}円、客の減り {kyakugen:,.0f}円')
# 原価の差の置き値：中華そば（外食）の小売価格に占める原料小麦代金は約1%（農水省の価格公表添付資料、ノート r4-ramen-maff-komugi2610）。
# 1杯900円なら小麦代は約9円。国産と輸入の小麦の値段の差の資料は読んでいないので、差は小麦代の半分〜全部（4.5〜9円）と置く【推論】。
# 第2版の15円は根拠がなく、小麦代の全部（9円）を超えていた（論証の検査 V093）。
WHEAT = PRICE * 0.01
for label, d in [(f'原価の差だけ・小さめ（小麦代{WHEAT:.0f}円の半分＝1杯{WHEAT*0.5:.1f}円）', WHEAT * 0.5), (f'原価の差だけ・大きめ（小麦代の全部＝1杯{WHEAT:.0f}円）', WHEAT),
                 ('値段の上乗せ（「国産」で1杯50円高く売る。50円は根拠のない置き値【推論】）', 50)]:
    gain = bowls * d
    p1 = gain / kacho
    p2 = gain / (kacho + shuchi + kyakugen)
    print(f'  {label}：得 {gain:,.0f}円。釣り合う発覚の確率（3年で）：課徴金だけなら {min(p1, 9.99):.2f}、課徴金＋周知＋客の減りなら {min(p2, 9.99):.2f}（1を超えれば、必ず見つかっても得が勝つ）')

# ---- 9) 仕訳の貸借の検算（（借）…／（貸）… の区切りごと）----
print('\n## 9) 仕訳の貸借')
if os.path.exists(REP):
    s = open(REP, encoding='utf-8').read()
    m = re.search(r'^## 仕訳の例.*?$(.*?)(?=^## |\Z)', s, re.M | re.S)
    bad = []; n = 0
    for line in re.findall(r'^（J\d+.*$', m.group(1) if m else '', re.M):
        jid = re.match(r'^（(J\d+)', line).group(1)
        t = line.replace('（借）', '<D>').replace('（貸）', '<C>')
        t = re.sub(r'（[^（）]*）', '', re.sub(r'（[^（）]*）', '', t))  # 注の括弧を外す（入れ子は2回）
        for piece in t.split('<D>')[1:]:
            if '<C>' not in piece: continue
            left, right = piece.split('<C>', 1)
            right = re.split(r'[。]|、[^\d]*$', right)[0]
            num = lambda x: sum(int(v.replace(',', '')) for v in re.findall(r'(?<![\d年月])(\d{1,3}(?:,\d{3})+|\d{4,})(?![\d年月])', x))
            dr, cr = num(left), num(right)
            n += 1
            if dr != cr: bad.append(f'{jid}: 借 {dr:,} 貸 {cr:,}')
    print(f'  区切り {n} 件、貸借が合わないもの {len(bad)} {bad}')

# ---- 10) 報告の全体の条番号を law のノートと突き合わせる（判定書の手抜きの予想：同じ型の誤りを全部探す）----
print('\n## 10) 報告の全体の「〇〇法N条」')
if os.path.exists(REP):
    s = unicodedata.normalize('NFKC', open(REP, encoding='utf-8').read())
    s = re.sub(r'\[\[[^\]]*\]\]', '', s)  # 出典の中は数えない
    found = {}
    pat = r'((?:私的独占の禁止及び公正取引の確保に関する法律|補助金等に係る予算の執行の適正化に関する法律|[一-龥ァ-ヶー]+?(?:法|規則|令)))((?:\d+条(?:の\d+)?(?:\d+項)?(?:\d+号)?[・、]?)+)'
    for mm in re.finditer(pat, s):
        law = mm.group(1)
        for a in re.findall(r'(\d+)条', mm.group(2)):
            found.setdefault((law, int(a)), 0); found[(law, int(a))] += 1
    ok = [k for k in found if note_has(k[0], k[1])]
    ng = [k for k in found if not note_has(k[0], k[1])]
    print(f'  条番号の組 {len(found)} 種類（のべ {sum(found.values())}）。law のノートにあるもの {len(ok)}、ないもの {len(ng)}')
    print('  ないもの：', '・'.join(f'{l}{a}条' for l, a in sorted(ng)))

# ---- 11) 章ごとの新・旧の分類で、報告の全体に対する新しい部分の割合（判定書 BIZ-LAW-RAMEN-audit 6.3）----
# 分類の基準（先に決めた）：旧＝元の BIZ-LAW の14節と主題が重なる所（販促の景表法・ステマ・価格表示・名簿・補助金・外注・修繕・通販の表示、
# 課徴金、訂正の章、判定書由来の N5・付録A の仕分け）。新＝それ以外の打ち手と、群をまたぐ表の章。
# 形＝要点・問い・資料の内訳・論証の表・対応表・やっていないこと・検査役の筋から採ったもの（中身の主題を持たない章）
# 当てはめの注：「偽りの損得」は景表法の課徴金（元の BIZ-LAW の販促の節の主題）の計算なので旧。「捨てた案と理由」は案の一覧で主題を持たないので形。
# 打ち手の章の中は、群6（メニュー表示）と、OLD_SUB の小節（1-5 内装工事の契約、1-6 修繕費か資本的支出か、4-3 通販の広告と予約販売、7-6 業務委託、9-4 補助金、12-3・12-5 口コミ・ステマ）を旧とする（元の BIZ-LAW の修繕・通販の表示・外注・補助金・ステマの節と主題が重なる）
print('\n## 11) 章ごとの新・旧の分類')
if os.path.exists(REP):
    s = open(REP, encoding='utf-8').read()
    CLS = {'0. 要点': '形', '問いの設計': '形', '資料の内訳': '形', 'BIZ-LAW からの訂正': '旧', '課徴金の計算': '旧',
           '灰色の判断の一覧': '新', '規模の段階で変わる制度の表': '新', '起きる確率の根拠': '新', '事例と判例': '新', '仕訳の例': '新',
           '消費税の税率の表': '新', 'DESIGN-RAMEN の判断への対応表': '新', '偽りの損得': '旧', 'ゲームへの写し方': '新', 'うまくいく理由': '新',
           'うまくいかない理由': '新', '反証と限界': '新', '捨てた案と理由': '形', '判定書 N5': '旧', '付録A': '旧', '論証の表': '形',
           '依頼の対応表': '形', 'やっていないこと': '形', '判定書 BIZ-LAW-RAMEN-audit への対応': '形', '論証の検査への対応表': '形', '検査役の筋から採ったもの': '形'}
    OLD_SUB = ('1-5', '1-6', '4-3', '7-6', '9-4', '12-3', '12-5')
    tot = {'新': 0, '旧': 0, '形': 0, '?': 0}
    inch = {'新': 0, '旧': 0, '形': 0}
    for blk in re.split(r'^(?=## )', s, flags=re.M)[1:]:
        title = blk.split('\n', 1)[0][3:]
        if title.startswith('打ち手ごとの法務と会計'):
            for g in re.split(r'^(?=### 群)', blk, flags=re.M):
                mm = re.match(r'### 群(\d+)', g)
                if not mm: tot['形'] += len(g); inch['形'] += len(g); continue
                if mm.group(1) == '6': tot['旧'] += len(g); inch['旧'] += len(g); continue
                for sub in re.split(r'^(?=#### )', g, flags=re.M):
                    ms = re.match(r'#### (\d+-\d+)', sub)
                    k = '旧' if ms and ms.group(1) in OLD_SUB else '新'
                    tot[k] += len(sub); inch[k] += len(sub)
            continue
        if title.startswith('DESIGN-RAMEN の判断への対応表'):
            for sub in re.split(r'^(?=### )', blk, flags=re.M):
                t3 = sub.split('\n', 1)[0]
                tot['旧' if re.search(r'V2〜V5|V6・V7|contract_build', t3) else '新'] += len(sub)
            continue
        k = next((v for kk, v in CLS.items() if title.startswith(kk)), '?')
        tot[k] += len(blk)
    allc = sum(tot.values())
    print(f'  打ち手の章の中の新の割合 {inch["新"] / (inch["新"] + inch["旧"]):.3f}（打ち手の章の新 {inch["新"]}・旧 {inch["旧"]}・章の頭などの形 {inch["形"]}）')
    print(f'  新 {tot["新"]}・旧 {tot["旧"]}・形 {tot["形"]}・未分類 {tot["?"]}（字）')
    print(f'  報告の全体に対する新の割合 {tot["新"] / allc:.3f}、形を除いた本文（新＋旧）に対する新の割合 {tot["新"] / (tot["新"] + tot["旧"]):.3f}')
