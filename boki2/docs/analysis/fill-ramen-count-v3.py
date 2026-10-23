#!/usr/bin/env python3
"""BIZ-FILL-RAMEN.md 版1.2 の表を数える（v2 から：判定の語に「研究の書誌で無し」「実務の資料も探して無し」を足す／検索の記録の WebSearch の行（fetched が空）を扱う／出典は取得元が実在の集合（web・law など、書式の見本の「取得元」を除く）だけ数える／N 番号の表を数える）。
1.1 の説明：（3章の判定、4章、資料の内訳、読了ノート、検索の記録、出典の語句と文書の数、K 番号の表）。
1.0 の fill-count.py から変えた所：判定の語に「埋まらず（探したが無い）」と「未探索」を分けた／4章は29項目の表だけを数える／
資料の内訳は r6-fill と r7-fill-js を数え、検索の結果の一覧（r7-fill-q）は別に数える／出典の文書の数は書式の見本を除く。
使い方: python3 -I boki2/docs/analysis/fill-ramen-count-v2.py
"""
import re, os, collections, glob, json
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
R = os.path.join(D, '..', 'research')
s = open(os.path.join(D, 'BIZ-FILL-RAMEN.md'), encoding='utf8').read()
def section(title, level='## '):
    m = re.search('^' + re.escape(level + title) + r'.*?\n(.*?)(?=^## |\Z)', s, re.S | re.M); return m.group(1) if m else ''
def rows(text):
    out = []
    for l in text.split('\n'):
        if l.startswith('|') and not re.match(r'^\|[\s\-|:]+\|$', l):
            l2 = re.sub(r'\[\[[^\]]*\]\]', 'X', l)
            out.append([c.strip() for c in l2.strip().strip('|').split('|')])
    return out
def kind(j):
    for k in ('埋まらず（研究の書誌で無し）', '埋まらず（実務の資料も探して無し）', '埋まらず（探したが無い）', '未探索', '一部', '否定', '修正', '支持', '対象外'):
        if j.startswith(k): return k
    return '?' + j
t3 = [r for r in rows(section('3. 上位30項目の補填の結果'))[1:]]
c3 = collections.Counter(kind(r[5]) for r in t3)
print('3章の行:', len(t3), dict(c3))
print('支持・修正・否定:', sum(c3[k] for k in ('支持', '修正', '否定')), '／一部:', c3['一部'], '／埋まらず（研究の書誌で無し）:', c3['埋まらず（研究の書誌で無し）'], '／埋まらず（実務の資料も探して無し）:', c3['埋まらず（実務の資料も探して無し）'], '／埋まらず（探したが無い、1.1 の語）:', c3['埋まらず（探したが無い）'], '／未探索:', c3['未探索'])
print('3章で 1.2 の WebSearch を書いた行:', sum('1.2：WebSearch' in r[7] for r in t3), '／埋まらずの行:', sum(kind(r[5]).startswith('埋まらず') for r in t3))
nosearch = [r[1].split()[0] for r in t3 if kind(r[5]).startswith('埋まらず') and len(r[7]) < 6]
print('埋まらずで「何を探したか」の欄が空に近い行:', nosearch or 'なし')
qref = sorted(set(re.findall(r'q-(?:js|ndl)-[\w-]+', ' '.join(r[7] for r in t3))))
recs = [json.loads(l) for l in open(os.path.join(R, 'searches', 'fill-ramen.jsonl'), encoding='utf8')]
have = {r['fetched'].replace('r7-fill-', '') for r in recs if r.get('fetched')}
print('3章が指す検索の記録:', len(qref), '／記録に無いもの:', [q for q in qref if q not in have] or 'なし')
sec4 = section('4. 上位30の外の項目（全件の扱い）').split('### ')[0]
t4 = rows(sec4)[1:]
c4 = collections.Counter(kind(r[2]) for r in t4)
print('4章の項目の行:', len(t4), dict(c4))
q4 = sorted(set(re.findall(r'q-(?:js|ndl)-[\w-]+', ' '.join(r[3] for r in t4))))
print('4章が指す検索の記録:', len(q4), '／記録に無いもの:', [q for q in q4 if q not in have] or 'なし')
print('検索の記録（research/searches/fill-ramen.jsonl）:', len(recs), '行、うち J-STAGE・国会図書館の取得', sum(1 for r in recs if r['status'] in (200, 429)), '（200 は', sum(1 for r in recs if r['status'] == 200), '）・WebSearch', sum(1 for r in recs if r['status'] == 'search'))
print('4章で 1.2 の WebSearch を書いた行:', sum('1.2：WebSearch' in r[3] for r in t4))
import itertools
per = collections.Counter(r['item'].split()[-1] for r in recs)
print('項目ごとの検索の回数の分布（記録の item の最後の語で数える）:', dict(sorted(collections.Counter(per.values()).items())))
n6 = sorted(glob.glob(os.path.join(R, 'notes', 'web', 'ramen', 'r6-fill-*.md')))
n7j = sorted(glob.glob(os.path.join(R, 'notes', 'web', 'ramen', 'r7-fill-js-*.md')))
n7q = sorted(glob.glob(os.path.join(R, 'notes', 'web', 'ramen', 'r7-fill-q-*.md')))
n8 = sorted(glob.glob(os.path.join(R, 'notes', 'web', 'ramen', 'r8-fill-*.md')))
pa = lambda ns: sum('read: partial' in open(n, encoding='utf8').read() for n in ns)
print(f'読了ノート：r6-fill {len(n6)}（partial {pa(n6)}）／r7-fill-js {len(n7j)}（partial {pa(n7j)}）／r7-fill-q（検索の結果の一覧） {len(n7q)}／r8-fill（1.2） {len(n8)}（partial {pa(n8)}、うち論文のページ {sum("r8-fill-js-" in n for n in n8)}）')
tab = rows(section('資料の内訳'))[1:]
nums = {r[0]: int(r[1]) for r in tab if r[1].isdigit()}
tot = nums.pop('計', None); ssum = sum(nums.values())
print('内訳の表:', nums, '計', ssum, '（表の計', tot, '）', '／ノートの r6-fill＋r7-fill-js＋r8-fill：', len(n6) + len(n7j) + len(n8))
mx = max(nums, key=nums.get); print(f'最多 {mx} {nums[mx]}/{ssum} = {nums[mx]/ssum*100:.1f}%')
n2 = dict(nums); n2['実務者・業界'] -= 11; mx2 = max(n2, key=n2.get)
print(f'月次12本を1本と数えた場合の最多: {mx2} {n2[mx2]}/{ssum-11} = {n2[mx2]/(ssum-11)*100:.1f}%')
noabs = [n for n in n7j + n8 if '要旨の文が無' in open(n, encoding='utf8').read() or '要旨が無' in open(n, encoding='utf8').read()]
print(f'要旨の無い論文のページ（根拠に使っていない）: {len(noabs)}。除いた時の研究: {nums["研究"]-len(noabs)}/{ssum-len(noabs)} = {(nums["研究"]-len(noabs))/(ssum-len(noabs))*100:.1f}%')
print(f'宣伝: {nums.get("宣伝・主催者の主張",0)}/{ssum} = {nums.get("宣伝・主催者の主張",0)/ssum*100:.1f}%')
cites = [m for m in re.finditer(r'\[\[([\w-]+):([\w-]+):([^\]\s|]+)\|「([^」]+)」\]\]', s) if m.group(1) in ('web', 'law', 'kentei', 'book', 'paper') and m.group(3) != 'doc' and not re.search(r'[<>…]', m.group(3))]
print('出典（語句つき、書式の見本を除く）:', len(cites), '／文書の数:', len({(m.group(1), m.group(2), m.group(3)) for m in cites}))
qc = collections.Counter(m.group(4) for m in cites)
print('同じ語句を2回以上使った出典:', {k: v for k, v in qc.items() if v >= 2} or 'なし')
kt = [r for r in rows(section('依頼の対応表')) if re.match(r'^K\d\d$', r[0])]
print('依頼の対応表の K 番号の行:', len(kt), '／番号の重なり:', len(kt) - len({r[0] for r in kt}))
lt = [r for r in rows(section('論証の表')) if re.match(r'^L\d+$', r[0])]
print('論証の表の行:', len(lt), '／受けた K 番号:', len(set(re.findall(r'K\d\d', ' '.join(r[1] for r in lt)))))
nt = [r for r in rows(section('依頼の対応表')) if re.match(r'^N\d\d$', r[0])]
print('依頼の対応表の N 番号の行:', len(nt))
