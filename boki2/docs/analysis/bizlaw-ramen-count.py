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
 'r5-blr-mhlw-shokuchu-inshoku': 'gov', 'r5-blr-cas-hikisage-gaiyou': 'gov',
 # 企業の開示（JPX に載る会社の書類、EDINET の四半期報告書）
 'r5-blr-jpx-kairikiya-1s': 'case', 'r5-blr-gift-yuho-a': 'case',
 # 実務者
 'r5-blr-ejinzai-invoice-r8': 'prac', 'r5-blr-smarthr-tencho': 'prac', 'r5-blr-mclaw-kanrishoku': 'prac', 'r5-blr-shiodome-ipo': 'prac',
 'r5-blr-masouken-zangyo': 'prac', 'r5-blr-mf-ma-boogai': 'prac', 'r5-blr-mf-genjou': 'prac', 'r5-blr-mf-teikishakuya': 'prac',
 'r5-blr-mf-futourenbai': 'prac', 'r5-blr-mf-roukisho': 'prac', 'r5-blr-batonz-hosho': 'prac', 'r5-blr-monolith-tabelog': 'prac',
 'r5-blr-rodo-hibou': 'prac', 'r5-blr-rodo-shaho-inshoku': 'prac', 'r5-blr-zeiken-chuko': 'prac', 'r5-blr-jinjer-ipo': 'prac',
 'r5-blr-keiyaku-tabelog': 'prac',
 # 事例（報道）
 'r5-blr-seijiyama-hotel': 'case', 'r5-blr-seijiyama-ichiran': 'case', 'r5-blr-jcast-sukiya': 'case', 'r5-blr-rodo-souken-inshoku': 'case',
 'r5-blr-rodo-machida-tencho': 'case',
 # 研究
 'r5-blr-aichiu-fc-hanrei': 'research', 'r5-blr-hokudai-casenote91b': 'research',
 # 民間の統計
 'r5-blr-tsr-ramen-tousan2025': 'stat',
 # 作り手の話
 'r5-blr-econ-cartelgame': 'maker',
 # 反対意見
 'r5-blr-zenshoren-shaho': 'oppo', 'r5-blr-ayusawa-chousa': 'oppo', 'r5-blr-gendai-gisou': 'oppo',
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
    gray = re.findall(r'^\| G\d+ ', sect('灰色の判断の一覧'), re.M)
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
