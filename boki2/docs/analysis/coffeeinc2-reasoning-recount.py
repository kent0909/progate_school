#!/usr/bin/env python3
# BIZ-COFFEEINC2 の論証の検査（docs/audit/BIZ-COFFEEINC2-reasoning.md）の数え直し。
# 使い方：python3 -I boki2/docs/analysis/coffeeinc2-reasoning-recount.py
# 1) 原文（research/raw/web/simgames/）から口コミ160件を切り出し直し、作り手のコード表（coffeeinc2-voices-codes.md）の番号と星が全件一致するかを確かめる
# 2) 検査役が手で決めた分類（長く遊んだ記述・学びの中身・店の層は儲からない等）を、根拠の語句つきで出す（語句が本文に無ければ止まる）
# 3) AppGoblin の推定の比、8章の決算書の例の検算
# 4) 検査書の表の「判定」の列を数える
import re, html, difflib, os, sys, collections

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'research', 'raw', 'web', 'simgames')
CODES = os.path.join(ROOT, 'docs', 'analysis', 'coffeeinc2-voices-codes-v1.md')   # 第1版（検査した b055378 の3章の数の元）
CODES2 = os.path.join(ROOT, 'docs', 'analysis', 'coffeeinc2-voices-codes.md')     # 第2版（03498c7 の3章の点の数の元）
AUDIT = os.path.join(ROOT, 'docs', 'audit', 'BIZ-COFFEEINC2-reasoning.md')
nn = lambda s: re.sub(r'[\s\W]', '', s)
clean = lambda s: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<br\s*/?>', '\n', re.sub(r'<(?!br)[^>]+>', '', s)))).strip()

# ---- 1. 切り出し（coffeeinc2-voices-count.py と同じ規則）と番号の対応 ----
A = []
for pg in ['r4-cinc-applion-reviews'] + ['r5-cinc-applion-p%d' % i for i in range(2, 8)]:
    t = open(os.path.join(RAW, pg + '.html'), encoding='utf8').read()
    for m in re.finditer(r'<div class="review_comment">(.*?)<div class="foot"><p>(.*?)</p></div>', t, re.S):
        b = re.search(r'<div class="body">\s*<p>(.*?)</p>', m.group(1), re.S)
        st = re.search(r'<span class="star_on">([★☆]*)</span>', m.group(2))
        A.append({'body': clean(b.group(1)), 'stars': st.group(1).count('★')})
t = open(os.path.join(RAW, 'r4-cinc-appreview.html'), encoding='utf8').read()
R = []
for blk in t.split('<div class="c-review">')[1:]:
    st = re.search(r'<div class="c-review-rating">\s*<em>(★*)</em>', blk)
    bo = re.search(r'<p class="c-review-body">(.*?)</p>', blk, re.S)
    R.append({'body': clean(bo.group(1)), 'stars': len(st.group(1))})
sim = lambda a, b: difflib.SequenceMatcher(None, nn(a)[:300], nn(b)[:300]).ratio()
dupA = [r for r in R if max(sim(r['body'], a['body']) for a in A) >= 0.75]
rest = [r for r in R if r not in dupA]
uniq = []
for r in rest:
    if any(sim(r['body'], u['body']) >= 0.75 for u in uniq):
        continue
    uniq.append(r)
ALL = A + uniq
NUMS = list(range(1, 136)) + [n for n in range(136, 163) if n not in (142, 149)]  # コード表の注記どおり #142・#149 は欠番
assert len(ALL) == len(NUMS) == 160, len(ALL)
C = {}
for l in open(CODES, encoding='utf8'):
    if re.match(r'^\| \d+ \|', l):
        c = [x.strip() for x in l.strip().strip('|').split('|')]
        C[int(c[0])] = {'stars': int(c[2]), 'P': c[3].split(), 'N': c[4].split(), 'T': c[5]}
C2 = {}
for l in open(CODES2, encoding='utf8'):
    if re.match(r'^\| \d+ \|', l):
        c = [x.strip() for x in l.strip().strip('|').split('|')]
        C2[int(c[0])] = {'stars': int(c[2]), 'P': c[3].split(), 'N': c[4].split(), 'T': c[5]}
V = {}
mism = mism2 = 0
for n, v in zip(NUMS, ALL):
    V[n] = dict(C[n], body=v['body'], P2=C2[n]['P'], N2=C2[n]['N'], T2=C2[n]['T'])
    mism += (C[n]['stars'] != v['stars'])
    mism2 += (C2[n]['stars'] != v['stars'])
print('1. 切り出し 160件、星の不一致：第1版の表', mism, '件・第2版の表', mism2, '件（0なら番号の対応は正しい）')

def show(title, items):
    """items: [(番号, 原文に出るはずの語句, 検査役の読み)]。語句が本文に無ければ止まる"""
    print('\n' + title, len(items), '件')
    for i, phrase, note in items:
        if phrase not in V[i]['body']:
            sys.exit('語句が本文にない：#%d「%s」' % (i, phrase))
        print('  #%-3d 褒め v1=%-9s v2=%-9s「%s」 %s' % (i, ' '.join(V[i]['P']), ' '.join(V[i]['P2']), phrase, note))

# ---- 2. 検査役の分類（根拠の語句つき） ----
# 2-1 長く遊んだ記述（没入 I のコードの有無を問わず、160件全部から）。報告は I の中の「後半」4件＋あいまい1件だけを数えた
LONG = [
    (10, '現在2032年', 'ゲーム内で年をまたいで続けている'),
    (11, '現在は後半で資金も余るほど', '後半'),
    (13, '長年プレイしているヘビーユーザー', '現実の年数'),
    (19, '最近は大学に投資しまくってます', 'あいまい（報告は「後半?」）'),
    (29, '2030年になりましたが', 'ゲーム内の年'),
    (36, '現状は2030年代で', 'ゲーム内の年'),
    (105, '20年経ったあたりから', 'ゲーム内の20年'),
    (140, '何周も遊ばせていただいています', '何周も'),
    (141, '数年経ってある程度会社が大きくなり', 'ゲーム内の数年'),
    (148, '何十年経っても', 'ゲーム内の数十年'),
    (150, '2050年あたりから', 'ゲーム内の年'),
]
show('2-1 長く遊んだ記述（160件から）', LONG)
noI = [i for i, _, _ in LONG if 'I' not in V[i]['P']]
noI2 = [i for i, _, _ in LONG if 'I' not in V[i]['P2']]
print('  うち没入（I）の印が付いていないもの：第1版', len(noI), '件', noI, '／第2版', len(noI2), '件', noI2)
late2 = sorted(i for i, v in V.items() if v['T2'] in ('後半', '後半?'))
print('  第2版の表で「後半」「後半?」の印', late2, '→ 160件全体の11件のうち', len(late2), '件だけ')
# その人たちが何の層で遊んでいるか（本文の語句で）
LAYER = {
    10: ('不動産収益(家賃収入)を見える化', '金融・不動産＋店'), 11: ('ベンチャー企業投資の機会と不動産の占有率', '金融・不動産'),
    13: ('公募増資の操作をスライダーで', '金融'), 19: ('大学に投資しまくってます', '個人の層'),
    29: ('株のことはよくわからないので、カフェに集中してます', '店だけ'), 36: ('週の利益が数千万', '不明'),
    105: ('週間報告で止まって', '不明'), 140: ('最終的に大事なのはコーヒー店の経営ではなく投資活動など', '金融（ただし店をいじりたくなったと書く）'),
    141: ('安定して収益が出てくると急に破産', '不明'), 148: ('S&amp;P500のような投資信託', '金融'), 150: ('最初から投資だけで総資産500兆円', '金融だけ'),
}
cl = collections.Counter()
for i, (ph, lay) in LAYER.items():
    if ph not in V[i]['body']:
        sys.exit('語句が本文にない：#%d' % i)
    cl[lay.split('（')[0]] += 1
print('  遊んでいる層', dict(cl))
GOAL = [(140, '資産を何京円も稼いだり西暦2300年ぐらいまでやり尽くして', '自分で目標'), (150, 'コーヒー経営一切行わずに最初から投資だけで', '自分で縛り'),
        (19, '大学に投資しまくってます', '自分の楽しみ'), (148, '世界一の大学にはなれないこと', '自分の目標（大学）')]
show('2-1b 長く遊んだ記述のうち、自分で目標・縛りを作っている記述', GOAL)

# 2-2 最初の数日の没入（報告の「最初」8件）のうち、書いた時点がまだ遊び始め（長い遊びを書けない）もの
EARLY = [(119, '買って初日ですが', '初日'), (129, 'I started this game today', '初日'), (8, '夜中にアプリストアで見つけて買って', '初日'),
         (118, '気づいたら朝になってました', '時点は不明（初日の可能性）'), (14, 'ここ数日寝不足です', '数日')]
show('2-2 「最初」の没入のうち、書いた時点が遊び始めのもの', EARLY)

# 2-3 学び（L）24件の中身：店の中の因果か、金融・会計・組織か、一般的な「勉強になる」か
LT = {
    2: ('株の見方、貸借対照表の読み方', '金融・会計'), 3: ('貸借対照表や株式公開など', '金融・会計'), 6: ('経営の一端に触れる', '一般'),
    10: ('重役や店長はAIでないため', '一般（学びの語なし）'), 24: ('コーヒー会社の経営っぽくなりました', '一般（リアル）'),
    39: ('経営の勉強にもなる', '一般'), 41: ('店長のシステムや株式公開のシステムがリアル寄り', '金融＋店長'),
    47: ('経営に興味を持ちました', '一般'), 56: ('融資の大切さを知りました', '金融・会計'), 57: ('finance or accounting', '金融・会計'),
    73: ('出来ることの幅と細部へのこだわり', '一般（細部）'), 77: ('銀行融資↔︎返済、資本レバレッジ', '金融・会計'),
    90: ('人材の人数や時給などまで決める事が出来るほか税金', '店の中＋税'), 92: ('教材のような感じ', '一般'),
    94: ('会社の組織など', '組織'), 106: ('経済やサービスのシステム', '一般'), 115: ('最高の勉強になります', '一般'),
    137: ('学びになると思っています', '一般'), 147: ('不動産売買やベンチャー投資は現代のビジネスにおいて', '金融・会計'),
    150: ('受動所得の資本家しか勝たん', '金融・会計'), 151: ('経理関係がですけど', '金融・会計'),
    154: ('現実の会社経営にマニュアルやチュートリアルなんかない', '一般（手探り）'), 155: ('インカムゲイン', '金融・会計'),
    156: ('賃借対照表とか損益計算書が出てくるのも良い', '金融・会計'),
}
assert sorted(LT) == sorted(i for i, v in V.items() if 'L' in v['P']), 'L の番号が合わない'
lc = collections.Counter()
for i, (ph, k) in LT.items():
    if ph not in V[i]['body']:
        sys.exit('語句が本文にない：#%d「%s」' % (i, ph))
    lc[k.split('（')[0].split('＋')[0]] += 1
print('\n2-3 学び（L）24件（第1版）の中身', dict(lc))
L2 = sorted(i for i, v in V.items() if 'L' in v['P2'])
print('  第2版の L', len(L2), '件。第1版から外れた', sorted(set(LT) - set(L2)), '加わった', sorted(set(L2) - set(LT)))
print('  店の中の因果（鎖1）に当たるもの：#90（人数・時給・税）・#41（店長のシステム）の2件。金融・会計の語を含むもの', sum(1 for k in LT.values() if '金融' in k[1]), '件')

# 2-4 店の層は儲からない／伸びない、と書いた声・資料 vs 「増やすほど儲かる」
SMALL = [(8, 'コーヒー事業は儲かりません', ''), (62, 'コーヒー豆なんて挽いてたって儲かりません', ''), (136, 'コーヒー店は不動産業にいくまでの下積み', ''),
         (145, 'コーヒー屋運営しないで投資で稼ぐプレイとかなら楽しいかも', ''), (150, 'コーヒー経営での収益が配当金に比較して小粒すぎて', '')]
show('2-4a 店の層は（金融に比べて）儲からないと書いた声', SMALL)
LIN = [(3, '店舗を増やせば増やすほど儲かる', 'ただし同じ文に「他店舗とかぶらない立地で」'), (146, '店舗は増やせば増やすだけ儲かる', '同じ文に「ベンチャー株は買えば買うだけ」')]
show('2-4b 「増やすほど儲かる」と書いた声（報告の鎖Bの根拠）', LIN)
print('  資料（原文）：note-umpo「世界中に店舗を広めても純利益はそんなに増えませんでした」「コーヒー屋の利益はほぼ一定です」、Zenn「出店しても収益インパクトは少ない」')
for doc, ph in [('r5-cinc-note-umpo', '世界中に店舗を広めても純利益はそんなに増えませんでした'), ('r5-cinc-note-umpo', 'コーヒー屋の利益はほぼ一定です'),
                ('r5-cinc-note-umpo', '一気にお店を増やすと利益が増えないので少しずつ'), ('r4-cinc-zenn-messos', '出店しても収益インパクトは少ない'),
                ('r4-cinc-zenn-messos', '競合の全社がほぼゾンビ'), ('r4-cinc-appget-review', '基本的にかけた予算に応じた効果が見込める'),
                ('r5-cinc-note-araki', '要素が多すぎて何をどうすればいいのか分からない'), ('r5-cinc-note-araki', '売上が安定してくる中盤以降はあまり気にしなくていい'),
                ('r5-cinc-note-umpo', '超楽しいですよね。脳汁もの'), ('r5-cinc-mugazine', 'このゲームの奥深さはカフェ経営以外の要素にある'),
                ('r5-cinc-appgoblin-ci2', 'Recent activity: 1.00 new ratings this week'), ('r5-cinc-appgoblin-ci2plus', 'Declining')]:
    raw = html.unescape(re.sub(r'<[^>]+>', '', open(os.path.join(RAW, doc + '.html'), encoding='utf8').read()))
    raw = re.sub(r'\s+', ' ', raw)
    print('  原文の語句の確認', doc, '「%s」' % ph, '→', 'ある' if re.sub(r'\s+', ' ', ph) in raw else 'ない')

# 2-5 副業・金融の層（S）18件のうち、金融が本業を食う（崩れ＝鎖A）を書いているもの
SDOM = [(4, 'システム上限のPERで', 'PER の抜け道'), (8, 'コーヒー事業より金融屋として経営した方がいい', ''), (62, 'さっさと引退して不動産を買い漁る', ''),
        (150, 'コーヒー経営一切行わずに最初から投資だけで', '')]
show('2-5 S（副業・金融の層を褒める）18件のうち、本業より金融が勝つことを書いているもの', SDOM)
print('  S と不満 a（後半の手詰まり）の両方を持つ声', [i for i, v in V.items() if 'S' in v['P'] and 'a' in v['N']])
S2 = sorted(i for i, v in V.items() if 'S' in v['P2'])
print('  第2版の S', len(S2), '件', S2, '。うち上の4件に入るもの', [i for i, _, _ in SDOM if i in S2])

# 2-6 不動産そのものの操作（指値・占有率）に触れた声の向き
RE = [(1, '高額な不動産を購入するときの価格調整', '不満'), (14, '不動産を購入するとき、価格の設定がめんどい', '不満'),
      (11, '不動産の占有率変化（CFOが働かないため？）を毎週確認しているのですが、その操作がすごく辛い', '不満'),
      (136, '不動産の売上貢献が強すぎて', '崩れ'), (146, '不動産は買えば買うだけ儲かる', '崩れ')]
show('2-6 不動産の操作・仕組みに触れた声（褒めた声は「要素がある」の言及だけ：#20・#21・#53・#152・#158）', RE)

# 2-7 増資の希薄化（報告は「希薄化がない」）
show('2-7 増資で株価が下がる（希薄化がある）と書いた声', [(59, '増資を繰り返した場合に、自社の株価がかなり安くなってしまう', '')])

# 2-8 週の締めの数字が回る演出の向き（報告 9(a)#5・9(b)#5 は「期待がご褒美」）
ANIM = [(19, 'なんでも鑑定団みたいな演出はいらない', '演出が要らない'), (17, '初めの方は5秒程度でぱっぱと業績がでてニコニコ', '速く出るのが嬉しい'),
        (67, 'カウントアップが長いのでスキップできるようにしてほしい', 'スキップ'), (135, '店舗事項のスキップを追加してください至急', 'スキップ'),
        (137, 'どうかスキップ機能を実装してほしい', 'スキップ'), (139, 'スキップをするオプションを付けて', 'スキップ'),
        (38, 'ワンタップで利益を確定', '速く')]
show('2-8 締めの演出に触れた声（演出そのものを褒めた声は0件）', ANIM)

# 2-9 範囲を広げて（h）31件の向かう先と、報告が「深い」とした層
H = sorted(i for i, v in V.items() if 'h' in v['N'])
# 報告 3.2 の表に書かれた内訳（報告自身の番号）を、2章で報告が付けた「深い／浅い」と並べる
tgt = {'投資先・金融の道具（2章で報告は「深い」とした層）': [1, 59, 81, 82, 148],
       '個人の資産の使い道（報告は「浅い」）': [1, 5, 6, 16, 43, 58, 94, 160],
       '他業種の買収・子会社・企業グループ（今ない範囲）': [1, 15, 17, 21, 61, 122, 136],
       '新しい都市（今ない範囲）': [18, 21, 47, 85, 91, 120]}
print('\n2-9 範囲を広げて（h）', len(H), '件の向かう先（報告 3.2 の表の番号のまま）')
for k, ids in tgt.items():
    assert all(i in H for i in ids), k
    print('  %s %d件 %s' % (k, len(ids), ids))
print('  球団（報告は「浅い」）を広げてと書いた声：#148「企業側でスポーツチームを購入、支援できないこと」の1件')
assert '企業側でスポーツチームを購入、支援できないこと' in V[148]['body']
assert '新しい都市の追加もいいのですが、何か大型アップデートが来てくれるのを待ってます' in V[85]['body']
print('  「新しい都市」6件のうち #85 は「新しい都市の追加もいいのですが、何か大型アップデートが来てくれるのを待ってます」（都市より大きな更新を待つ）')

# 2-10 没入（I）のうち「要素の多さ」（D）を同じ声に持つもの（「多さは始めたら止まらない理由として強い」の検査）
I = sorted(i for i, v in V.items() if 'I' in v['P'])
print('\n2-10 第1版：没入 I', len(I), '件のうち D（要素の多さ）も付く声', [i for i in I if 'D' in V[i]['P']], '／S も付く声', [i for i in I if 'S' in V[i]['P']])
I2 = sorted(i for i, v in V.items() if 'I' in v['P2'])
print('     第2版：没入 I', len(I2), '件のうち D も付く声', [i for i in I2 if 'D' in V[i]['P2']], '／「最初」の印', [i for i in I2 if V[i]['T2'] == '最初'])

# 2-11 公式の数（AppGoblin）
inst, mau, mnew, wnew = 862000, 17000, 5200, 667
print('\n3-1 AppGoblin（通常版）：月の利用者 ÷ 推定インストール = %.1f%%、月の新規 ÷ 月の利用者 = %.0f%%（最大でこの割合が今月始めた人）' % (100 * mau / inst, 100 * mnew / mau))
print('     通常版の「今週の新しい評価」1件、Arcade 版の週の新規は Declining（報告は書いていない）')

# ---- 3-2 8章の決算書の例（3年目→4年目）の検算 ----
# 例の数字：借入＝月商の約8か月分（＝年商の8/12）、営業利益率2%。減価償却は年商の2〜4%（ラーメン店の「その他14%（減価償却を含む）」[BIZ-CALIB] の中）と置く
debt_ratio = 8 / 12
for da in (0.02, 0.03, 0.04):
    r_need = (0.02 + da) / debt_ratio
    print('3-2 支払利息だけで営業CF（利息を営業の区分に入れる場合）を赤字にするのに要る金利：減価償却 %.0f%% のとき %.1f%%' % (100 * da, 100 * r_need))
print('     利息を財務の区分に入れる会社なら、金利が上がっても営業CFは変わらない。例の「金利が上がる→営業CFが赤字」は運転資本や売上の落ち込みを足さないと起きない')

# ---- 4. 検査書の判定の数 ----
if os.path.exists(AUDIT):
    cnt = collections.Counter()
    rows = 0
    ids = collections.defaultdict(list)
    for l in open(AUDIT, encoding='utf8'):
        m = re.match(r'^\| (K\d+) \|', l)
        if not m:
            continue
        cells = [x.strip() for x in l.strip().strip('|').split('|')]
        j = cells[-2].replace('*', '')
        if j not in ('妥当', '弱い', '不当'):
            sys.exit('判定の列が読めない：' + m.group(1) + ' ' + j)
        rows += 1
        cnt[j] += 1
        ids[j].append(m.group(1))
    print('\n4. 検査書の判定', rows, '行：', ' / '.join('%s %d' % (k, cnt[k]) for k in ('妥当', '弱い', '不当')), '（合計', sum(cnt.values()), '）')
    for k in ('不当', '弱い'):
        print('  ', k, '・'.join(ids[k]))
