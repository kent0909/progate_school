#!/usr/bin/env python3
"""BIZ-FILL-CALIB 版2 の仕分けの数え直し。版1の項目ごとの一括（fill-calib-status.py の辞書 R）をやめ、
186か所それぞれの元の行を読んで付けた結果（fill-calib-rows-v2.tsv、1行1か所、手で付けた）を数える。
比べる相手：版1の結果（fill-results-calib.tsv）と、事実の判定役の付け直し（bizfill-calib-audit-reclass.out.txt の食い違いの全件。
そこに無い行は判定役が版1と同じ区分にした）。
「探した」と書いた行は、探し方の欄の doc 名が取得記録（ledger.jsonl）か検索の記録（searches/fill-calib.jsonl）にあるかを確かめる。
使い方: python3 -I boki2/docs/analysis/fill-calib-reclass-v2.py > boki2/docs/analysis/fill-calib-reclass-v2.out.md
"""
import csv, os, re, json, collections
A = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(A, '..', '..', 'research')
def tsv(f, skip=0):
    L = open(os.path.join(A, f), encoding='utf8').read().split('\n')[skip:]
    return list(csv.DictReader([l for l in L if l.strip()], delimiter='\t'))
T = {r['id']: r for r in tsv('fill-targets-calib.tsv', 1)}
V2 = {r['id']: r for r in tsv('fill-calib-rows-v2.tsv')}
V1 = {r['id']: r['結果'] for r in tsv('fill-results-calib.tsv')}
aud = {}
txt = open(os.path.join(A, 'bizfill-calib-audit-reclass.out.txt'), encoding='utf8').read()
sec = txt.split('## 食い違いの全件')[1].split('## ')[0]
for l in sec.split('\n'):
    c = [x.strip() for x in l.strip('|').split('|')]
    if len(c) >= 5 and re.match(r'C\d{3}$', c[0]): aud[c[0]] = (c[3], c[4])
AUD = {i: (aud[i][0] if i in aud else V1.get(i)) for i in T if int(i[1:]) <= 166}
assert set(V2) == set(T), (set(T) - set(V2), set(V2) - set(T))
def base(k): return '埋まらず' if k.startswith('埋まらず') else k
ORDER = ['埋まった', '一部', '埋まらず（探した）', '埋まらず（規約）', '埋まらず（探していない）', '引き継ぎ', '計算', '設計', '説明']
C = collections.Counter(V2[i]['区分'] for i in T)
C166 = collections.Counter(V2[i]['区分'] for i in T if int(i[1:]) <= 166)
print('# 仕分けの数え直し（版2、fill-calib-reclass-v2.py の出力。手で書き換えない）\n')
print('## 区分の定義（版2）\n')
print('- 埋まった：資料で値か向きが置けた（区分が上がる、元の推論を原文で確かめた・否定した）')
print('- 一部：一部の値・条件つきで置けた、または元の推論の一部だけを原文で確かめた')
print('- 埋まらず（探した）：今回、取得記録か検索の記録に残る探し方で探し、資料が無かった')
print('- 埋まらず（規約）：資料はあるが規約で取らない。埋まらず（探していない）：探していない（理由を結果の中身に書いた）')
print('- 引き継ぎ：並行の担当の範囲で、引き継ぎ先の版でその行が扱われたことを確かめたもの（扱われていない行は自分で探して上の区分にした）')
print('- 計算：(a) の値の按分・積・割り算・複利で、式が元の行にあるもの（記事自身の前年比からの割り戻しを含む）')
print('- 設計：設計の案・推し・見出しの推論、作業（検査の実装など）の未達で、資料で値を置く種類でないもの')
print('- 説明：印の凡例、自己申告、直しの指示、同じ箇条の再掲\n')
print('## 区分の数\n')
print('| 区分 | 版2（186か所） | 版2のうち元の166か所 | 版1（166か所） | 事実の判定役（166か所） |'); print('|---|---|---|---|---|')
c1 = collections.Counter(V1[i] for i in V1); ca = collections.Counter(AUD.values())
for k in ORDER:
    b = base(k)
    v1 = c1.get(k, 0) if not k.startswith('埋まらず') else (c1.get('埋まらず', 0) if k == '埋まらず（探した）' else '')
    va = ca.get(k, 0) if not k.startswith('埋まらず') else (ca.get('埋まらず', 0) if k == '埋まらず（探した）' else '')
    print(f'| {k} | {C.get(k, 0)} | {C166.get(k, 0)} | {v1} | {va} |')
print(f'| 未着手（判定役の区分） | 0 | 0 | 0 | {ca.get("未着手", 0)} |')
print(f'| 計 | {sum(C.values())} | {sum(C166.values())} | {sum(c1.values())} | {sum(ca.values())} |')
print('\n（版1・判定役の「埋まらず」は探したかどうかを分けていないので「探した」の行にまとめて書いた）\n')
def cmp(lab, other):
    ids = [i for i in T if int(i[1:]) <= 166]
    same = sum(1 for i in ids if base(V2[i]['区分']) == other[i])
    print(f'- 版2と{lab}の一致：{same}/{len(ids)} = {same / len(ids) * 100:.1f}%（埋まらずの内訳はまとめて比べた）')
    m = collections.Counter((other[i], base(V2[i]['区分'])) for i in ids if base(V2[i]['区分']) != other[i])
    print('  食い違いの向き（' + lab + '→版2）：' + '、'.join(f'{a}→{b} {n}' for (a, b), n in sorted(m.items(), key=lambda x: -x[1])))
print('## 比べ\n')
cmp('版1', V1); cmp('事実の判定役', AUD)
print('\n## 事実の判定役の食い違い36件への答え（同意＝版2の区分が判定役と同じ）\n')
print('| id | 元の行 | 版1 | 判定役 | 版2 | 同意か | 版2の理由（結果の中身） |'); print('|---|---|---|---|---|---|---|')
agree = 0
for i in sorted(aud):
    v = V2[i]['区分']; ok = base(v) == aud[i][0] or (aud[i][0] == '未着手' and v not in ('計算', '設計'))
    agree += ok
    print(f'| {i} | {T[i]["報告"].replace(".md", "")}:{T[i]["行"]} | {V1[i]} | {aud[i][0]} | {v} | {"同意" if ok else "不同意"} | {V2[i]["結果の中身"]} |')
print(f'\n同意 {agree}/{len(aud)}（「未着手」は、版2で計算・設計から外して補填の対象に戻したものを同意とした）\n')
print('## 版2の「埋まらず（探した）」の記録の確かめ\n')
led = set(); 
for l in open(os.path.join(R, 'ledger.jsonl'), encoding='utf8'):
    try: e = json.loads(l)
    except Exception: continue
    led.add(e.get('doc'))
srch = {json.loads(l)['fetched']: json.loads(l) for l in open(os.path.join(R, 'searches', 'fill-calib.jsonl'), encoding='utf8')}
bad = []; n = 0
for i in T:
    if V2[i]['区分'] != '埋まらず（探した）': continue
    n += 1
    docs = [d for d in re.findall(r'r[4-7]-[a-z0-9-]+', V2[i]['探し方'])]
    q = [d for d in docs if d in srch]
    if not q: bad.append(i)
    print(f'- {i}（{T[i]["項目"]}）：検索 {len(q)} 回（{"・".join(q) or "なし"}）、件数 ' + '・'.join(str(srch[d]["hits"]) for d in q))
print(f'\n埋まらず（探した）{n}か所のうち、今回の検索の記録で指せない行：{bad or "なし"}')
print(f'\n検索の記録 searches/fill-calib.jsonl：{len(srch)}行（J-STAGE {sum(1 for d in srch if "-js-" in d)}・国立国会図書館サーチ {sum(1 for d in srch if "-ndl-" in d)}（robots の禁止が分かり根拠に使わない）・Internet Archive {sum(1 for d in srch if "-ia-" in d)}）')
