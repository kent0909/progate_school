#!/usr/bin/env python3
# BIZ-LAW-RAMEN の判定（docs/audit/BIZ-LAW-RAMEN-audit.md）で使った数をすべてここで出す（QUALITY 6.2-2）。
# 使い方: python3 -I boki2/docs/analysis/bizlaw-ramen-audit-check.py
#  1) 報告の出典 [[src:coll:doc|「語句」]] を全数取り出し、語句が原文（research/raw）に出るかを確かめる
#  2) 資料ごとの出典の数
#  3) 判定役が原文の前後を読んで付けた「主張を支えない・弱い」出典の分類（番号は 1) の通し番号）
#  4) 新しい群の割合を、旧 BIZ-LAW の節と主題が重なる小節も除いて数え直す
#  5) 仕訳41例の検算の分類（判定役が1例ずつ付けた結果）
import os, re, json, glob, html, hashlib, unicodedata, collections

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
R = os.path.join(ROOT, 'research')
REP = os.path.join(ROOT, 'docs', 'BIZ-LAW-RAMEN.md')
norm = lambda s: re.sub(r'[\s　]+', '', unicodedata.normalize('NFKC', s or ''))

# ---- 原文の場所（research-check.js と同じく sha256 で引く）と本文 ----
hc_path = os.path.join(R, 'raw', '.hashcache.json')
hc = json.load(open(hc_path)) if os.path.exists(hc_path) else {}
byhash = {v['h']: p for p, v in hc.items() if os.path.exists(p) and '/.text/' not in p}
def fm(p):
    t = open(p, encoding='utf-8').read()
    m = re.match(r'^---\n(.*?)\n---\n', t, re.S)
    return {mm.group(1): mm.group(2).strip() for mm in re.finditer(r'^(\w+):\s*(.*)$', m.group(1), re.M)} if m else {}
def text(p, s):
    if p.lower().endswith('.pdf'):
        c = os.path.join(R, 'raw', '.text', s + '.txt')
        return open(c, encoding='utf-8', errors='replace').read() if os.path.exists(c) else ''
    b = open(p, 'rb').read()
    try: t = b.decode('utf-8')
    except UnicodeDecodeError: t = b.decode('shift_jis', errors='replace')
    if t.lstrip().startswith('{'):
        try:
            out = []
            def walk(x):
                if isinstance(x, dict): [walk(v) for v in x.values()]
                elif isinstance(x, list): [walk(v) for v in x]
                elif isinstance(x, str): out.append(x)
            walk(json.loads(t)); t = '\n'.join(out)
        except ValueError: pass
    t = re.sub(r'(?is)<script.*?</script>|<style.*?</style>', ' ', t)
    return html.unescape(re.sub(r'<[^>]+>', ' ', t))
cache = {}
def raw_text(key):
    if key in cache: return cache[key]
    src, coll, doc = key.split(':', 2)
    np = os.path.join(R, 'notes', src, coll, doc + '.md')
    t = None
    if os.path.exists(np):
        h = fm(np); p = byhash.get(h.get('sha256', ''))
        if not p and h.get('file') and os.path.exists(os.path.join(R, h['file'])): p = os.path.join(R, h['file'])
        if p: t = norm(text(p, h.get('sha256', '')))
    cache[key] = t
    return t

# ---- 1) 出典の全数 ----
lines = open(REP, encoding='utf-8').read().split('\n')
cites = []
for i, l in enumerate(lines, 1):
    for m in re.finditer(r'\[\[([a-z0-9_-]+):([a-z0-9_-]+):([^|\]]+)\|「([^」]*)」\]\]', l):
        cites.append((len(cites) + 1, i, f'{m.group(1)}:{m.group(2)}:{m.group(3)}', m.group(4)))
ok = miss = noraw = 0
for n, ln, k, ph in cites:
    t = raw_text(k)
    if t is None: noraw += 1
    elif norm(ph) in t: ok += 1
    else: miss += 1; print('  語句が原文にない:', n, ln, k, ph)
print('## 1) 出典の全数')
print(f'  出典 {len(cites)} 件、語句が原文に出る {ok}、出ない {miss}、原文が開けない {noraw}')

# ---- 2) 資料ごと ----
cnt = collections.Counter(k for _, _, k, _ in cites)
print('\n## 2) 資料の数', len(cnt), '（出典の多い順の上位10）')
for k, v in cnt.most_common(10): print('  ', v, k)

# ---- 3) 判定役の分類（原文の前後を読んで付けた。理由は判定書 6.1） ----
NOT_SUPPORT = {  # 語句は原文にあるが、付いた主張の一部を原文が支えない・範囲がずれる
    8: 'L18 10月9日閣議決定・国会提出は原文にない', 297: 'L472 同', 406: 'L962 同',
    187: 'L297 倉庫業の是正事例を飲食の開店前の仕込みに（印なし）',
    194: 'L305 社長1人でも強制は条文にない', 354: 'L533 同',
    328: 'L506 G15 休憩・強盗の危険は記事にない',
    138: 'L238 最長3年は旧法の抜粋（現行10年）', 318: 'L499 G08 同じ抜粋の課徴金',
    253: 'L393 2023年12月に東証スタンダードは原文にない', 385: 'L582 E12 上場した、は原文にない',
}
WEAK = {  # 語句が目次・書誌・見出しから取られ、主張の中身を直接は支えない
    105: 'L207 特商法 通信販売（法令名の書誌）', 171: 'L279 個人関連情報（改正点の見出し）',
    172: 'L279 外国にある第三者（同）', 173: 'L279 利用停止・消去（同）',
    30: 'L80 訴訟件数（目次）', 368: 'L558 同', 387: 'L584 同',
}
print('\n## 3) 判定役の分類')
print(f'  主張を支える {len(cites) - len(NOT_SUPPORT) - len(WEAK)}、主張の一部を支えない {len(NOT_SUPPORT)}、支えが弱い {len(WEAK)}（計 {len(cites)}）')
for d in (NOT_SUPPORT, WEAK):
    for n, why in sorted(d.items()):
        c = cites[n - 1]; print(f'  #{n} {c[2].split(":")[-1]} 「{c[3]}」 … {why}')

# ---- 4) 新しい群の割合（数え直し） ----
s = '\n'.join(lines)
m = re.search(r'^## 打ち手ごとの法務と会計.*?$(.*?)(?=^## |\Z)', s, re.M | re.S); body = m.group(1)
subs = {}
for g in re.split(r'^(?=### 群)', body, flags=re.M):
    gm = re.match(r'### 群(\d+)', g)
    if not gm: continue
    for p in re.split(r'^(?=#### )', g, flags=re.M):
        sm = re.match(r'#### (\d+-\d+)', p)
        subs[sm.group(1) if sm else f'{gm.group(1)}-head'] = len(p)
# 旧 BIZ-LAW の節と主題が重なる小節：1-5（M-1 工事の契約）・1-6（M・N 修繕と被災）・4-3（I 通販の表示）・群6 全部（A〜F 販促・H 名簿）・7-6（G 外注）・9-4（M-4 補助金）・12-3・12-5（C・D ステマと口コミ）
OLD = {'1-5', '1-6', '4-3', '7-6', '9-4', '12-3', '12-5'} | {k for k in subs if k.startswith('6-')}
old = sum(v for k, v in subs.items() if k in OLD)
print('\n## 4) 新しい群の割合')
print(f'  報告全体 {len(s)} 字、打ち手の章 {len(body)} 字（全体の {len(body) / len(s):.3f}）')
print(f'  旧い主題の小節を除く新しい部分 {len(body) - old} 字：打ち手の章の {(len(body) - old) / len(body):.3f}、報告全体の {(len(body) - old) / len(s):.3f}')

# ---- 5) 仕訳41例の検算（判定役が1例ずつ付けた結果。理由は判定書 6.4 の表） ----
J = {f'J{i:02d}': 'OK' for i in range(1, 42)}
J.update({'J13': '要修正（勘定と返品の記録）', 'J16': '要修正（建設仮勘定の残りの払い）', 'J26': '要修正（2級の範囲と積立金方式）',
          'J31': '要修正（J30 の100%と食い違う80%）', 'J15': 'OK（推論と自認）', 'J24': 'OK（標準外の勘定と自認）'})
c = collections.Counter(v.split('（')[0] for v in J.values())
print('\n## 5) 仕訳41例'); print('  ', dict(c))
for k, v in J.items():
    if v != 'OK': print('  ', k, v)
