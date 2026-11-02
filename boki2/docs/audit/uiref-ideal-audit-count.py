# DESIGN-UI-IDEAL の判定（事実の判定役）の数を道具で数える
# 使い方: python3 -I boki2/docs/audit/uiref-ideal-audit-count.py
# (1) 判定役の画面ごとの判定（DESIGN-UI-IDEAL-audit-screens.tsv）が cites.tsv の183行と順・番号・id で一致するか
# (2) 「素案の主張と画像」「image_seen と画像」の件数、合わない・一部の一覧、書き手の「合うか」との食い違い
# (3) 付録Bの数を、書き手のスクリプトと別の数え方で数え直す（リンク数・番号の種類・担当ごと・cites の行）
import csv, os, re, collections
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
J = os.path.join(ROOT, 'docs', 'audit', 'DESIGN-UI-IDEAL-audit-screens.tsv')
TSV = os.path.join(ROOT, 'docs', 'analysis', 'uiref-ideal-cites.tsv')
DOC = os.path.join(ROOT, 'docs', 'DESIGN-UI-IDEAL.md')
j = list(csv.DictReader(open(J, encoding='utf8'), delimiter='\t'))
c = list(csv.DictReader(open(TSV, encoding='utf8'), delimiter='\t'))
bad = [(a['k'], a['番号'], b['番号']) for a, b in zip(j, c) if a['番号'] != b['番号'] or a['id8'] != b['id'][:8]]
print('判定の行:', len(j), ' cites.tsv の行:', len(c), ' 順・番号・id の不一致:', bad or 'なし')
for col in ('主張と画像', 'image_seenと画像'):
    cnt = collections.Counter(r[col] for r in j)
    print(f'[{col}]', dict(cnt), ' 計', sum(cnt.values()))
    for r in j:
        if r[col] != '合う':
            print(f"   #{r['k']} {r['番号']} {r['id8']} {r[col]}")
# 番号ごと（どれか1画面でも合わない・一部なら、その番号は一部）
num = collections.OrderedDict()
for r in j:
    v = r['主張と画像']
    num.setdefault(r['番号'], set()).add(v)
nc = collections.Counter('合わない' if '合わない' in s and len(s) == 1 else ('一部合わない' if s - {'合う'} else '合う') for s in num.values())
print('番号ごと（主張と画像）:', dict(nc), ' 番号の数', len(num))
# 書き手の「合うか」（cites.tsv）との食い違い（主張と画像の列で比べる）
diff = [(a['k'], a['番号'], b['合うか'], a['主張と画像']) for a, b in zip(j, c) if a['主張と画像'] != b['合うか']]
print('書き手の「合うか」と判定役の「主張と画像」が違う行:', len(diff))
for d in diff: print('   #%s %s 書き手=%s 判定役=%s' % d)
# (3) 付録Bの数え直し（書き手のスクリプトと別の正規表現・別の切り方）
s = open(DOC, encoding='utf8').read()
body = s[:s.index('\n## 付録A')]
links = re.findall(r'\]\(https://mobbin\.com/screens/([0-9a-f\-]{36})\)', body)
labels = re.findall(r'\[([XWQM][0-9]+)\]\(https://mobbin\.com/screens/', body)
print('本文のリンク:', len(links), ' 番号の種類:', len(set(labels)))
who = collections.Counter({'X': 'MB1', 'W': 'MB2', 'Q': 'MB3', 'M': '第1回'}[n[0]] for n in set(labels))
print('担当ごと:', dict(who))
print('cites.tsv の番号の種類:', len(set(r['番号'] for r in c)), ' 画像を開いた（はい）:', sum(r['画像を開いた'] == 'はい' for r in c))
sec3 = s[s.index('## 3. 3人の素案の食い違い'):s.index('## 4. 見た目と情報の決まり')]
print('3章の C の行:', len(re.findall(r'^\| C\d+ \|', sec3, re.M)))
print('全体の行:', len(s.split('\n')))
