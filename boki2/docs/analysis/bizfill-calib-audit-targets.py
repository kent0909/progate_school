#!/usr/bin/env python3
# 事実の判定役（BIZ-FILL-CALIB の判定）が、対象の一覧を書き手のスクリプトと別のやり方で数え直す。
# 元の版：BIZ-CALIB.md@37b2376・BIZ-SIMDESIGN.md@d3bfa93（git から読む。作業中のファイルは読まない）
# 拾うもの（書き手の正規表現を使わず、広めに拾ってから突き合わせる）：
#   A 印：【推論…】【推測…】【要確認…】【資料なし…】【仮…】のすべての出現（1行に2つあれば2つ）
#   B (c) の行：「## M・K・L・R」から「## 集計」までの表の行で、3列目（区分）の矢印の右が (c)
#   C CALIB の「## やっていないこと」の表の全行、「### 受け入れの基準ごと」で 一部・未達・ない を含む行
#   D SIMDESIGN の「## やっていないこと」の箇条の全部
#   E 印のない「資料なし」「無い」：CALIB の「DESIGN-RAMEN との対応」の表で、根拠の欄が 無い／資料なし／引き直していない の行
# 出力：書き手の fill-targets-calib.tsv との一致・書き手にない所・書き手にだけある所
# 使い方: python3 -I boki2/docs/analysis/bizfill-calib-audit-targets.py > boki2/docs/analysis/bizfill-calib-audit-targets.out.txt
import re, os, subprocess, collections
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
def show(rev, path):
    return subprocess.run(['git', 'show', f'{rev}:{path}'], cwd=ROOT, capture_output=True, text=True).stdout.split('\n')
CAL = show('37b2376', 'boki2/docs/BIZ-CALIB.md')
SIM = show('d3bfa93', 'boki2/docs/BIZ-SIMDESIGN.md')
MK = re.compile(r'【(推論|推測|要確認|資料なし|仮)[^】]*】')

def cells(l):
    l2 = re.sub(r'\[\[[^\]]*\]\]', lambda m: m.group(0).replace('|', '¦'), l)
    return [c.strip() for c in l2.strip().strip('|').split('|')]

mine = []  # (報告, 行, 種類, 名)
def scan_marks(name, L):
    for i, l in enumerate(L, 1):
        for m in MK.finditer(l):
            k = m.group(1)
            k = {'推測': '推論'}.get(k, k)
            mine.append((name, i, k, m.group(0)))
scan_marks('BIZ-CALIB.md', CAL)
scan_marks('BIZ-SIMDESIGN.md', SIM)

h2 = ''; h3 = ''; inM = False
for i, l in enumerate(CAL, 1):
    if l.startswith('## '):
        h2 = l[3:].strip(); inM = h2.startswith('M・K・L・R') or h2.startswith('新しい行の一覧')
    if l.startswith('### '): h3 = l[4:].strip()
    if inM and l.startswith('|') and not l.startswith('|---'):
        c = cells(l)
        if len(c) >= 3 and c[0] not in ('#', '行'):
            r = c[2].replace('*', '').split('→')[-1]
            m = re.search(r'\(([abc—→])\)', r)
            if m and m.group(1) == 'c': mine.append(('BIZ-CALIB.md', i, '(c)', c[0]))
    if h2 == 'やっていないこと' and l.startswith('|') and not l.startswith('|---'):
        c = cells(l)
        if c[0] != 'やっていないこと': mine.append(('BIZ-CALIB.md', i, '未達', c[0]))
    if h3 == '受け入れの基準ごと' and l.startswith('|') and re.match(r'^\|\s*\d+', l):
        if re.search(r'一部|未達|取得していない|出典がない|表はない|届いていない', l):
            mine.append(('BIZ-CALIB.md', i, '未達', '基準' + cells(l)[0]))
    if h2.startswith('DESIGN-RAMEN との対応') and l.startswith('|') and not l.startswith('|---'):
        c = cells(l)
        last = c[-1] if c else ''
        if re.search(r'^\**無い|資料なし|引き直していない|^無い', last) and not MK.search(l):
            mine.append(('BIZ-CALIB.md', i, '印なしの無い', c[0]))
h2 = ''
for i, l in enumerate(SIM, 1):
    if l.startswith('## '): h2 = l[3:].strip()
    if h2 == 'やっていないこと' and l.startswith('- '):
        mine.append(('BIZ-SIMDESIGN.md', i, '未達', re.sub(r'\*', '', l[2:])[:40]))

# 書き手の一覧
W = []
for l in open(os.path.join(ROOT, 'boki2/docs/analysis/fill-targets-calib.tsv'), encoding='utf8'):
    if l.startswith('#') or l.startswith('id\t'): continue
    r = l.rstrip('\n').split('\t')
    W.append((r[1], int(r[2]), r[3], r[4], r[0], r[6], r[9]))

def key(x):
    k = x[2]
    if x[0].startswith('BIZ-CALIB') and k == '資料なし': k = '要確認'  # 書き手は CALIB の資料なしを要確認と呼ぶ
    return (x[0], x[1], k)
cm = collections.Counter(key(x) for x in mine if x[2] != '印なしの無い')
cw = collections.Counter((w[0], w[1], w[2]) for w in W if not w[0].startswith('audit'))
print('== 数 ==')
print('判定役の抽出（印なしの「無い」を除く）:', sum(cm.values()))
for f in ('BIZ-CALIB.md', 'BIZ-SIMDESIGN.md'):
    print(' ', f, dict(collections.Counter(k[2] for k in cm.elements() if k[0] == f)))
print('書き手の一覧（判定書の追加6を除く）:', sum(cw.values()), ' 追加6を足して', sum(cw.values()) + sum(1 for w in W if w[0].startswith('audit')))
print('\n== 判定役にあり書き手にない ==')
for k, n in sorted((cm - cw).items()):
    src = CAL if k[0].startswith('BIZ-CALIB') else SIM
    print(f'  {k[0]}:{k[1]} {k[2]} ×{n} | {src[k[1]-1][:200]}')
print('\n== 書き手にあり判定役にない ==')
for k, n in sorted((cw - cm).items()):
    src = CAL if k[0].startswith('BIZ-CALIB') else SIM
    print(f'  {k[0]}:{k[1]} {k[2]} ×{n} | {src[k[1]-1][:200]}')
print('\n== 印なしの「無い」（DESIGN-RAMEN との対応の表。書き手の一覧にあるかを行で見る） ==')
wl = {(w[0], w[1]) for w in W}
for x in mine:
    if x[2] == '印なしの無い':
        print(f'  CALIB:{x[1]} {x[3][:40]} | 書き手の一覧に同じ行: {"あり" if (x[0], x[1]) in wl else "なし"} | {CAL[x[1]-1][-90:]}')
print('\n== 書き手の一覧の行番号が指す元の行に、書き手の言う印・区分が本当にあるか ==')
bad = 0
for w in W:
    if w[0].startswith('audit'):
        L = open(os.path.join(ROOT, 'boki2/docs/audit/BIZ-CALIB-v02-audit.md'), encoding='utf8').read().split('\n')
        ok = bool(L[w[1]-1].strip()) and w[1] <= len(L)
        line = L[w[1]-1] if w[1] <= len(L) else ''
        print(f'  {w[4]} 判定書 {w[1]}行: {line[:120]}')
        continue
    src = CAL if w[0].startswith('BIZ-CALIB') else SIM
    line = src[w[1]-1]
    if w[2] in ('推論', '要確認', '資料なし'):
        ok = w[3].replace('【','').replace('】','')[:2] in line
    elif w[2] == '(c)':
        ok = '(c)' in line
    else:
        ok = True
    if not ok:
        bad += 1; print('  ×', w[4], w[0], w[1], w[2], line[:120])
print('  印・区分が行に無い書き手の行:', bad)
