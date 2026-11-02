# DESIGN-UI-IDEAL.md の数を道具で数える（QUALITY 6.2-2）。
# 使い方: python3 -I boki2/docs/analysis/uiref-ideal-count.py
# 数えるもの：章ごとの行数、画面の数、引いた実例の数（担当ごと）、
# 引いた画面のノート・原寸・取得記録の有無、cites.tsv の「ノートを開いた・画像を開いた・合わない」の数、
# 本文の番号と cites.tsv の番号の突き合わせ、3人の台帳の URL と同じ id かの確かめ。
import json, os, re, collections

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
DOC = os.path.join(ROOT, 'docs', 'DESIGN-UI-IDEAL.md')
TSV = os.path.join(ROOT, 'docs', 'analysis', 'uiref-ideal-cites.tsv')
NOTES = os.path.join(ROOT, 'research', 'notes', 'mobbin-mcp', 'screens')
RAW = os.path.join(ROOT, 'research', 'raw', 'mobbin-mcp', 'screens')
LEDGER = os.path.join(ROOT, 'research', 'ledger.jsonl')
SRC = {'MB1': 'uiref-mobbin-MB1.md', 'MB2': 'uiref-mobbin-MB2.md', 'MB3': 'uiref-mobbin-MB3.md', '第1回': 'uiref-mobbin.md'}

s = open(DOC, encoding='utf8').read()
lines = s.split('\n')

# 章ごとの行数（## の見出しから次の ## まで）
print('== 章ごとの行数 ==')
cur, cnt, order = '（頭書き）', collections.OrderedDict(), []
for l in lines:
    if l.startswith('## '):
        cur = l[3:].strip()
    cnt[cur] = cnt.get(cur, 0) + 1
for k, v in cnt.items():
    print(f'{v:4d}  {k}')
print(f'全体: {len(lines)} 行')

# 要点の行数（見出しを除く、空行を除く）
m = re.search(r'^## 0\. 要点\n(.*?)(?=^## )', s, re.S | re.M)
yo = [l for l in m.group(1).split('\n') if l.strip()]
print(f'要点の行（空行を除く）: {len(yo)}')

# 画面の数（### 2.N 画面N の見出し）
screens = re.findall(r'^### 2\.\d+ 画面(\d+) ', s, re.M)
print(f'画面の数（2章の見出し）: {len(screens)}  番号: {screens[0]}〜{screens[-1]}')
tbl = re.search(r'^### 2\.0 一覧\n(.*?)(?=^### )', s, re.S | re.M).group(1)
rows = [l for l in tbl.split('\n') if re.match(r'^\| \d+ \|', l)]
print(f'一覧の表の行: {len(rows)}')

# 引いた実例（本文中のリンク [番号](https://mobbin.com/screens/id)）
links = re.findall(r'\[([XWQM]\d+)\]\(https://mobbin\.com/screens/([0-9a-f-]{36})\)', s)
app = s.split('## 付録A')[0]
body_links = re.findall(r'\[([XWQM]\d+)\]\(https://mobbin\.com/screens/([0-9a-f-]{36})\)', app)
nums = collections.OrderedDict()
for n, i in links:
    nums.setdefault(n, set()).add(i)
bad = {n: v for n, v in nums.items() if len(v) > 1}
print(f'本文（付録Aより前）のリンクの数: {len(body_links)}  番号の種類: {len(set(n for n, _ in body_links))}')
by = collections.Counter({'X': 'MB1', 'W': 'MB2', 'Q': 'MB3', 'M': '第1回'}[n[0]] for n in nums)
print('引いた番号（担当ごと）:', dict(by), ' 計', sum(by.values()))
print('1つの番号に2つ以上の id のリンク:', bad or 'なし')

# 3人と第1回の台帳の行に、その id の URL があるか（番号と画面の取り違えの確かめ）
mism = []
for n, ids in nums.items():
    who = {'X': 'MB1', 'W': 'MB2', 'Q': 'MB3', 'M': '第1回'}[n[0]]
    src = open(os.path.join(ROOT, 'docs', 'analysis', SRC[who]), encoding='utf8').read()
    row = [l for l in src.split('\n') if l.startswith(f'| {n} |')]
    for i in ids:
        if not row or i not in row[0]:
            # 流れの行（Q77〜Q80）は台帳の行に画面の id がない。ノートの本文に流れの id があるかで確かめる
            note = os.path.join(NOTES, i + '.md')
            flows = re.findall(r'mobbin\.com/flows/([0-9a-f-]{36})', row[0]) if row else []
            ok = os.path.exists(note) and any(f[:8] in open(note, encoding='utf8').read() for f in flows)
            if not ok:
                mism.append((n, i))
print('台帳の行に同じ id がない（流れの画面はノートの流れの id で確かめた）:', mism or 'なし')

# ノート・原寸・取得記録
led = collections.defaultdict(list)
for l in open(LEDGER, encoding='utf8'):
    try:
        r = json.loads(l)
    except Exception:
        continue
    if r.get('src') == 'mobbin-mcp':
        led[r.get('doc')].append(r)
t = [l.split('\t') for l in open(TSV, encoding='utf8').read().strip().split('\n')]
head, data = t[0], t[1:]
ids = [r[0] for r in data]
no_note = [i for i in ids if not os.path.exists(os.path.join(NOTES, i + '.md'))]
no_raw = [i for i in ids if not any(os.path.exists(os.path.join(RAW, i + e)) for e in ('.jpg', '.png', '.webp'))]
no_led = [i for i in ids if not any(r.get('status') == 200 for r in led[i])]
short = []
for i in ids:
    p = os.path.join(NOTES, i + '.md')
    if os.path.exists(p):
        mm = re.search(r'image_seen: "(.*)"', open(p, encoding='utf8').read())
        if not mm or len(mm.group(1)) < 60:
            short.append(i)
print(f'cites.tsv の行（画面）: {len(data)}  番号の種類: {len(set(r[1] for r in data))}')
print(f'ノートがない: {len(no_note)}  原寸がない: {len(no_raw)}  取得記録（200）がない: {len(no_led)}  image_seen が60字未満: {len(short)}')
print(f'ノートを開いた（書き手・はい）: {sum(1 for r in data if r[5]=="はい")}  画像を開いた（書き手・はい）: {sum(1 for r in data if r[6]=="はい")}  画像を開いた（判定役・はい）: {sum(1 for r in data if r[7]=="はい")}')
opened_nums = sorted(set(r[1] for r in data if r[6] == 'はい'), key=lambda x: (x[0], int(x[1:])))
print(f'原寸を開いた番号（書き手）: {len(opened_nums)} 件 {opened_nums}')
print(f'原寸を開いた画面（書き手）: {sum(1 for r in data if r[6]=="はい")} 枚')
prim = {}
for r in data:
    prim.setdefault(r[1], r)
verdict = collections.Counter(r[10] for r in prim.values())
print('番号ごとの判定（書き手・版0.1）:', dict(verdict))
print('書き手の版0.1 で合わない・一部合わない:', [(n, r[10]) for n, r in prim.items() if r[10] != '合う'])
# 判定役の判定（docs/audit/DESIGN-UI-IDEAL-audit-screens.tsv）を、版0.1 の cites の画面で数える
AUD = os.path.join(ROOT, 'docs', 'audit', 'DESIGN-UI-IDEAL-audit-screens.tsv')
aud = [l.split('\t') for l in open(AUD, encoding='utf8').read().strip().split('\n')[1:]]
print(f'判定役の判定（画面）: 主張と画像 {dict(collections.Counter(r[3] for r in aud))}  image_seen と画像 {dict(collections.Counter(r[4] for r in aud))}  計 {len(aud)}')
bynum = collections.defaultdict(list)
for r in aud:
    bynum[r[1]].append(r[3])
nv = collections.Counter('一部合わない' if any(v.startswith('一部') for v in vs) else ('合う' if all(v == '合う' for v in vs) else 'その他') for vs in bynum.values())
print(f'判定役の判定（番号。1画面でも一部なら一部）: {dict(nv)}  計 {len(bynum)}')
print('判定役が一部合わないとした番号:', sorted([n for n, vs in bynum.items() if any(v.startswith('一部') for v in vs)], key=lambda x: (x[0], int(x[1:]))))
tsv_nums = set(r[1] for r in data)
print('本文の番号で cites.tsv にない:', sorted(set(nums) - tsv_nums) or 'なし', ' cites.tsv にあって本文にない:', sorted(tsv_nums - set(nums)) or 'なし')
dup = collections.Counter(r[0] for r in data)
print('同じ画面が2つの番号で引かれている:', sorted({i: [r[1] for r in data if r[0] == i] for i, c in dup.items() if c > 1}.values()) or 'なし')

# 章の数え（論証の表・食い違い・台帳の行）
def table_rows(title_re):
    mm = re.search(title_re + r'.*?\n(.*?)(?=^#{2,3} )', s, re.S | re.M)
    return [l for l in mm.group(1).split('\n') if re.match(r'^\| [#A-Z0-9]', l) and not l.startswith('| #') and not l.startswith('| 番号')] if mm else []
print('食い違いの行（3章）:', len(table_rows(r'^## 3\. ')))
print('論証の表の行（7章）:', len(table_rows(r'^## 7\. ')))
print('簡略化の台帳の行（8章）:', len(table_rows(r'^## 8\. ')))
print('試作で比べる物（6.1 の T）:', len(re.findall(r'^\| T\d+ ', s, re.M)))
print('オーナーに決めてもらう問い（9章の ### 問）:', len(re.findall(r'^### 問\d ', s, re.M)))
def sect(title):
    mm = re.search(r'^## ' + title + r'\n(.*?)(?=^## )', s, re.S | re.M)
    return [l for l in mm.group(1).split('\n') if l.startswith('| ') and not l.startswith('| 番号') and not l.startswith('| #') and not l.startswith('| 検査書・判定書')] if mm else []
resp = sect('判定と検査への対応表')
print('判定と検査への対応表の行:', len(resp), ' 扱い:', dict(collections.Counter(l.rstrip(' |').split('|')[-1].strip().split('（')[0].split('。')[0] for l in resp)))
print('  J:', sum(1 for l in resp if l.startswith('| J')), ' K:', sum(1 for l in resp if l.startswith('| K')), ' R-:', sum(1 for l in resp if l.startswith('| R-')), ' ほか:', sum(1 for l in resp if not re.match(r'\| (J|K|R-)', l)))
print('検査役の筋から採ったものの行:', len(sect('検査役の筋から採ったもの')))
print('版0.1 からの変更の行:', len(sect('版0.1 からの変更の一覧')))
print('「動き」の行の数（2章）:', len(re.findall(r'^- \*\*動き', s, re.M)), ' うち【推論】つき:', len(re.findall(r'^- \*\*動き【推論】', s, re.M)))
