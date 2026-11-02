# MB1 の数を数える（QUALITY 6.2-2）。使い方: python3 -I boki2/docs/analysis/uiref-mobbin-MB1-count.py
import re, os, collections
base = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
doc = open(os.path.join(base, 'docs/analysis/uiref-mobbin-MB1.md'), encoding='utf-8').read()
led = open(os.path.join(base, 'research/ledger.jsonl'), encoding='utf-8').read()
# 実例の台帳の行（| X1 | で始まる行）
rows = re.findall(r'^\| (X\d+) \| ([^|]+) \|', doc, re.M)
print('実例の行数:', len(rows))
apps = collections.Counter()
for _, a in rows:
    m = re.match(r'[A-Za-z0-9.]+(?: [A-Z][A-Za-z]+)*', a.strip()); apps[(m.group(0) if m else a).replace(' AI','')] += 1
print('アプリ別（行の主のアプリ）:', dict(apps.most_common()))
mx = apps.most_common(1)[0]
print('最多のアプリ:', mx, '割合 %.1f%%' % (100*mx[1]/len(rows)))
print('Duolingo の行:', apps.get('Duolingo', 0))
ids = sorted(set(re.findall(r'mobbin\.com/screens/([0-9a-f-]{36})', doc)))
print('本文が引く画面の id（重複なし）:', len(ids))
fetched = [i for i in ids if ('"doc":"%s"' % i) in led]
noted = [i for i in ids if os.path.exists(os.path.join(base, 'research/notes/mobbin-mcp/screens', i + '.md'))]
print('うち research-fetch の取得記録がある:', len(fetched), ' 読了ノートがある:', len(noted))
print('取得記録のない id:', [i for i in ids if i not in fetched])
sheets = os.environ.get('MB1_SHEETS')
if sheets and os.path.isdir(sheets):
    print('一覧の画像の枚数:', len([f for f in os.listdir(sheets) if f.endswith('.jpg')]))
r1 = open(os.path.join(base, 'docs/analysis/uiref-mobbin.md'), encoding='utf-8').read()
r1ids = set(re.findall(r'mobbin\.com/screens/([0-9a-f-]{36})', r1))
import json
first = set()
for l in led.splitlines():
    try: e = json.loads(l)
    except Exception: continue
    if e.get('src') == 'mobbin-mcp' and e.get('t', '') < '2026-11-02T06:20':
        first.add(e['doc'])
print('第1回の文書が引く画面と重なる id:', len(set(ids) & r1ids), ' 第1回の取得（06:20 より前の50件）と重なる id:', len(set(ids) & first), '（第1回の取得数', len(first), '）')
print('検索の記録の行数:', len(re.findall(r'^\| \d+ \| (?:screens|flows)', doc, re.M)))
