# uiref-mobbin-MB2.md の数を数える（QUALITY 6.2-2：頭で数えない）
# 使い方: python3 boki2/docs/analysis/uiref-mobbin-MB2-count.py
import re, os, json, glob, collections
B = os.path.join(os.path.dirname(__file__), '..', '..')
R = os.path.join(B, 'research')
md = open(os.path.join(B, 'docs/analysis/uiref-mobbin-MB2.md')).read()
scr = [l.rstrip('\n').split('\t') for l in open(os.path.join(B, 'docs/analysis/uiref-mobbin-MB2-screens.tsv'))][1:]
ids = [r[0] for r in scr]
app = {r[0]: r[1] for r in scr}
dom = {r[0]: r[2] for r in scr}

# 1. 実例の数：台帳の行（| W数 |）
rows = re.findall(r'^\| (W\d+) \|', md, re.M)
print('実例の行の数:', len(rows), '（番号', rows[0], '〜', rows[-1], '）')

# 2. 台帳の行が引く画面（mobbin.com/screens/<id>）
ledger = md.split('## 実例の台帳')[1].split('## 本来あるべき設計の素案')[0]
cited = set(re.findall(r'mobbin\.com/screens/([0-9a-f-]{36})', ledger))
allcited = set(re.findall(r'mobbin\.com/screens/([0-9a-f-]{36})', md))
print('台帳が引く画面の数:', len(cited), '／文書全体が引く画面の数:', len(allcited))
print('引いたのに一覧（screens.tsv）にない画面:', sorted(allcited - set(ids)) or 'なし')
print('一覧にあるのに文書が引かない画面:', sorted(set(ids) - allcited) or 'なし')

# 3. 取得と読了ノート
led = []
for f in [os.path.join(R, 'ledger.jsonl')] + glob.glob(os.path.join(R, 'ledger-pending', '*.jsonl')):
    for l in open(f):
        try: led.append(json.loads(l))
        except Exception: pass
mob = [e for e in led if e.get('src') == 'mobbin-mcp']
ok = collections.defaultdict(list)
for e in mob:
    if e.get('status') == 200: ok[e['doc']].append(e)
noraw = [i for i in allcited if not ok.get(i)]
nonote = [i for i in allcited if not os.path.exists(os.path.join(R, 'notes/mobbin-mcp/screens', i + '.md'))]
print('引いた画面のうち取得記録（200）がない:', noraw or 'なし')
print('引いた画面のうち読了ノートがない:', nonote or 'なし')
mb2notes = [i for i in ids if 'MB2' in open(os.path.join(R, 'notes/mobbin-mcp/screens', i + '.md')).read()]
print('一覧の画面のうち MB2 が書いた読了ノート:', len(mb2notes), '／ 他の担当のノートを使った:', [i for i in ids if i not in mb2notes])
# MB2 が取得した記録：一覧の画面で、他の担当のノートでないもの＋取り違えの2件
err = ['a6e9c7da-248c-4991-86d4-3cfdf366e435', '2c32101f-9220-4e9c-8a8d-15b87e3a1a1d']
mine = [e for e in mob if e.get('status') == 200 and (e['doc'] in mb2notes or e['doc'] in err)]
print('MB2 の取得の記録（200）:', len(mine), '＝ 一覧の画面', len([e for e in mine if e['doc'] in mb2notes]), '＋ 取り違えの記録', len([e for e in mine if e['doc'] in err]))
print('取り違えの skip の記録:', len([e for e in mob if e['doc'] in err and e.get('status') == 'skipped']))

# 4. アプリ・領域の内訳（一覧の画面）
c = collections.Counter(app[i] for i in ids)
print('画面の数（一覧）:', len(ids), '／アプリの数:', len(c))
top = c.most_common(1)[0]
print('一番多いアプリ:', top, '割合 %.1f%%' % (100 * top[1] / len(ids)), '（上限 33.3%）')
print('Duolingo の画面:', c.get('Duolingo', 0))
print('アプリ別:', ', '.join(f'{a} {n}' for a, n in c.most_common()))
d = collections.Counter(dom[i] for i in ids)
print('領域別:', ', '.join(f'{a} {n}' for a, n in d.most_common()))
print('家計の割合: %d/%d = %.1f%%' % (d['家計'], len(ids), 100 * d['家計'] / len(ids)))

# 5. 検索の記録
s = [l for l in open(os.path.join(B, 'docs/analysis/uiref-mobbin-MB2-searches.tsv')) if l.strip()]
k = collections.Counter(l.split('\t')[1].split(' ')[0] for l in s)
print('検索の数:', len(s), '（種類別', dict(k), '）')
