#!/usr/bin/env python3
# UI の参考の調べの統合の報告（docs/BIZ-UIREF.md）の数を数える。QUALITY 6.2-2（数は道具で）。
# 使い方: python3 -I boki2/docs/analysis/uiref-merge-count.py
# 数えるもの:
#  1. 3人の資料の内訳（各担当の数えのスクリプトを走らせ、その出力から拾う）と、読了ノートの数（頭文字ごとに数え直す）
#  2. 口コミの数・自分で開いた画像の数（同じく各担当のスクリプトの出力から）
#  3. 3本の下書きの実例の台帳の行数
#  4. いまの画面：上部の帯の高さ（画像の画素の色で測る）、CSS の文字の大きさの値の種類（書かれたまま／px にそろえて）、幅390で効く帯の字の大きさ
#  5. この報告：出典の数、各章の表の行数、5章の段の索引が下書きの「段」の列と合うか
#  6. 出典の確かめの記録（uiref-merge-cites.tsv）の集計と、報告の出典が全部記録にあるか
#  7. 版2：読み直し R1〜R3 の数（各スクリプトの出力）、口コミの数え直し、反映の対象（R1 の「反する」を含む行・R2 の「反する」・R3 の反する／悪い面／訂正）が本文のどの章に入ったか（漏れ・9章だけ・反映表との食い違い）、判定への対応表の行数
import os, re, subprocess, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
B2 = os.path.normpath(os.path.join(HERE, '..', '..'))
DOCS = os.path.join(B2, 'docs')
SHOTS = '/tmp/claude-0/-home-user-progate-school/2ed2d185-9667-561f-833a-47fa8a0986df/scratchpad/shots'

def run(cmd):
    return subprocess.run(cmd, cwd=os.path.dirname(B2), capture_output=True, text=True).stdout

def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()

def num(pat, s, default=None):
    m = re.search(pat, s)
    return int(m.group(1)) if m else default

print('■ 1. 資料の内訳（3人）')
outA = run(['node', 'boki2/docs/analysis/uiref-A-count.js'])
outB = run(['python3', '-I', 'boki2/docs/analysis/uiref-B-count.py'])
outC = run(['node', 'boki2/docs/analysis/uiref-C-count.js'])
kinds = ['作品の画面', '利用者の声', '研究・ガイドライン', '作り手・評者の話', '百科事典']
A = {'作品の画面': num(r'作品の画面：(\d+) 本', outA), '利用者の声': num(r'利用者の声：(\d+) 本', outA),
     '研究・ガイドライン': num(r'研究・ガイドライン：(\d+) 本', outA), '作り手・評者の話': num(r'作り手・評者の話：(\d+) 本', outA), '百科事典': 0}
B = {'作品の画面': num(r'作品の画面[^\t]*\t(\d+)', outB), '利用者の声': num(r'利用者の声[^\t]*\t(\d+)', outB),
     '研究・ガイドライン': 0, '作り手・評者の話': num(r'作り手の話[^\t]*\t(\d+)', outB), '百科事典': num(r'百科事典[^\t]*\t(\d+)', outB)}
C = {'作品の画面': num(r'work: (\d+)', outC), '利用者の声': 0, '研究・ガイドライン': num(r'research: (\d+)', outC),
     '作り手・評者の話': num(r'creator: (\d+)', outC), '百科事典': 0}
tot = {k: A[k] + B[k] + C[k] for k in kinds}
T = sum(tot.values())
for k in kinds:
    print(f'  {k}\tA {A[k]}\tB {B[k]}\tC {C[k]}\t合計 {tot[k]}（{tot[k] * 100 / T:.1f}%）')
print(f'  合計\tA {sum(A.values())}\tB {sum(B.values())}\tC {sum(C.values())}\t{T}')
print('  半分を超える種類:', [k for k in kinds if tot[k] * 2 > T] or 'なし', '／ちょうど半分:', [k for k in kinds if tot[k] * 2 == T] or 'なし')
notes = os.listdir(os.path.join(B2, 'research', 'notes', 'web', 'uiref'))
byp = Counter(n[:3] for n in notes if re.match(r'u[ABC]-', n))
print(f'  読了ノートを頭文字で数え直し: uA {byp["uA-"]}・uB {byp["uB-"]}・uC {byp["uC-"]}（合計 {sum(byp.values())}）')

print('■ 2. 口コミと画像')
vA = run(['node', 'boki2/docs/analysis/uiref-A-voices.js'])
vB = run(['python3', '-I', 'boki2/docs/analysis/uiref-B-voices.py'])
readA, codeA = num(r'読んだ口コミ[^：]*：(\d+) 件', vA), num(r'まとめた後：(\d+) 件', vA)
readB, codeB = num(r'母数）: (\d+)', vB), num(r'符号を付けた声: (\d+)', vB)
cdraft = read(os.path.join(HERE, 'uiref-C-visual.md'))
readC = num(r'口コミ (\d+) 件', cdraft)
print(f'  A 読んだ {readA}・符号 {codeA}／B 読んだ {readB}・符号 {codeB}／合計 読んだ {readA + readB}（{readA}+{readB}）・符号 {codeA + codeB}（{codeA}+{codeB}）')
print(f'  C のストアのページの口コミ（C の下書きの記述から拾った数。数え直していない）: {readC}')
imA = num(r'参考の画面 (\d+)', outA); imAo = num(r'我々の画面 (\d+)', outA)
imB = num(r'報告の一覧に載る画像: (\d+)', outB)
imC = num(r'見た画像の一覧の行[^\d]*(\d+)', outC)
print(f'  自分で開いた参考の画像: A {imA}（ほかに我々の画面 {imAo}）・B {imB}・C {imC}・合計 {imA + imB + imC}（{imA}+{imB}+{imC}）')

print('■ 3. 下書きの実例の台帳')
def strip(l):
    return re.sub(r'\[\[[^\]]*\]\]', 'X', l)
def ledger(fn, rx, col, mincols):
    out = {}
    for l in read(os.path.join(HERE, fn)).split('\n'):
        if re.match(rx, l):
            c = [x.strip() for x in strip(l).split('|')]
            if len(c) >= mincols and c[1] not in out:
                out[c[1]] = c[col]
    return out
dA = ledger('uiref-A-jpapps.md', r'^\| A\d+ \|', 11, 14)
dB = {'B-' + k: v for k, v in ledger('uiref-B-gameui.md', r'^\| E\d\d \|', 10, 11).items()}
dC = ledger('uiref-C-visual.md', r'^\| C\d+ \|', 9, 12)
print(f'  A {len(dA)}・B {len(dB)}・C {len(dC)}・合計 {len(dA) + len(dB) + len(dC)}')
DAN = {**dA, **dB, **dC}

print('■ 4. いまの画面')
try:
    from PIL import Image
    for n in ['w26', 'w36', 'w41', 'w52', 'w60']:
        im = Image.open(os.path.join(SHOTS, n + '.png')).convert('RGB')
        w, h = im.size
        # 帯の下端：左端の列で、帯の地（明るい紙色）から縁の線（暗い）に変わる最初の行（y=150 より下）
        y = next(y for y in range(150, h) if sum(im.getpixel((5, y))) < 650)
        print(f'  {n}: 画像 {w}x{h}、帯の下端 y={y}（{y * 100 / h:.1f}%）')
except Exception as e:
    print('  帯の高さを測れなかった:', e)
css = {f: read(os.path.join(B2, 'css', f)) for f in ['style.css', 'sim.css', 'ramen.css']}
vals = set(); px = set()
for s in css.values():
    for m in re.finditer(r'font-size:\s*([0-9.]+)(rem|px|em)', s):
        vals.add(m.group(1) + m.group(2))
        px.add(round(float(m.group(1)) * (1 if m.group(2) == 'px' else 16), 2))
print(f'  font-size の値の種類: 書かれたまま {len(vals)}（C の数え方）・px にそろえると {len(px)}（em は16倍として）')
vals2 = set(); px2 = set()
for s0 in css.values():
    s1 = re.sub(r'/\*[\s\S]*?\*/', ' ', s0)          # コメントを除く
    s1 = re.sub(r'\[[^\]]*\]', ' ', s1)               # 属性セレクタ（[style*="font-size:12px"] など）を除く
    for m in re.finditer(r'font-size:\s*([0-9.]+)(rem|px|em)', s1):
        vals2.add(m.group(1) + m.group(2))
        px2.add(round(float(m.group(1)) * (1 if m.group(2) == 'px' else 16), 2))
print(f'  font-size の宣言だけ（コメントと属性セレクタを除く）: 書かれたまま {len(vals2)}・px にそろえると {len(px2)}')
eng = read(os.path.join(B2, 'js', 'sim', 'engine.js'))
m = re.search(r'\[(\d+), (\d+), (\d+)\]\.map\(\(z\) => `<button class="\$\{\(S\.textScale', eng)
print('  ゲームの設定の文字の大きさ:', '/'.join(m.groups()) + '%' if m else '見つからない')
mq = re.search(r'@media \(max-width: 47\.99em\) \{([\s\S]*?)\n\}', css['ramen.css'])
if mq:
    for sel in ['.r-kpi small', '.r-kpi b', '.r-kpi .r-azu', '.r-gl', '.r-tabs button']:
        m = re.search(re.escape(sel) + r' \{[^}]*font-size: ([0-9.]+)rem', mq.group(1))
        if m:
            print(f'  幅48em未満で {sel}: {float(m.group(1)) * 16:g}px')
note = re.search(r'/\*[^*]*画面の4分の1以内[^*]*\*/', css['ramen.css'])
print('  ramen.css の注（帯の上限）:', note.group(0) if note else 'なし')

print('■ 5. この報告（BIZ-UIREF.md）')
R = read(os.path.join(DOCS, 'BIZ-UIREF.md'))
cites = re.findall(r'\[\[web:uiref:([\w-]+)\|「([^」]+)」\]\]', R)
print(f'  出典 {len(cites)} 件・組（文書と語句）{len(set(cites))}・文書 {len(set(d for d, _ in cites))}')
def section(title):
    m = re.search(r'^## ' + re.escape(title) + r'.*\n([\s\S]*?)(?=^## |\Z)', R, re.M)
    return m.group(1) if m else ''
def trows(s):
    return [l for l in s.split('\n') if l.startswith('|') and not re.match(r'^\|[-|\s]+\|$', l)]
for t, lab in [('2. ', '2章 P の表の行'), ('3. ', '3章 画面の行'), ('6. ', '6章 ぶつかる点の行')]:
    print(f'  {lab}: {len(trows(section(t))) - 1}')
s5 = section('5. ')
bad = []; got = set(); per = Counter()
cur = None
for l in s5.split('\n'):
    m = re.match(r'^### (段([①②③④⑤])|全)', l)
    if m:
        cur = m.group(2) or '全'
        continue
    m = re.match(r'^\| ((?:A|C)\d+|B-E\d\d) \|', l)
    if m and cur:
        i = m.group(1); per[cur] += 1; got.add((cur, i))
        if i not in DAN:
            bad.append((cur, i, '下書きにない番号'))
        elif cur not in DAN[i]:
            bad.append((cur, i, '下書きの段は「' + DAN[i] + '」'))
want = {(d, i) for i, v in DAN.items() for d in '①②③④⑤全' if d in v}
print('  5章の索引の行（段ごと）:', dict(per), '合計', sum(per.values()))
print('  索引と下書きの段が合わない行:', bad or 'なし')
miss = sorted(want - got)
print(f'  下書きの段の列にあって索引にない組: {len(miss)}', miss[:20])

print('■ 6. 出典の確かめの記録（uiref-merge-cites.tsv）')
tsv = [l.split('\t') for l in read(os.path.join(HERE, 'uiref-merge-cites.tsv')).strip().split('\n')[1:]]
rec = {(r[0], r[1]): r for r in tsv}
used = set(cites)
print(f'  記録の組 {len(tsv)}（うち報告が引く組 {len([k for k in rec if k in used])}）')
print(f'  ノートを開いた {sum(1 for r in tsv if r[2] == "開いた")}・原文を開いた {sum(1 for r in tsv if r[3] == "開いた")}')
print('  判定（記録の全部）:', dict(sorted(Counter(r[4] for r in tsv).items())))
print('  判定（報告が引く組だけ）:', dict(sorted(Counter(rec[k][4] for k in used if k in rec).items())))
nr = [k for k in used if k not in rec]
print('  報告が引くのに記録にない組:', nr or 'なし')
print('■ 7. 版2：読み直しの反映')
vR = run(['python3', '-I', 'boki2/docs/analysis/uiref-B-voices-R1.py'])
for pat in [r'母数（読んだ口コミ）: (.*)', r'符号を付けた声（口コミの件数）: (.*)', r'動きを褒める・求める声（M\+ か M要）: (.*)', r'長い・待たされる声（W）: (.*)', r'スキップ・短縮・待たない・テンポを褒める声（S\+ か T\+）: (.*)']:
    mm = re.search(pat, vR); print('  R1 の声:', mm.group(0) if mm else pat + ' 見つからない')
nB = num(r'→ 新 (\d+) 件 / 15', vR); cB = num(r'符号を付けた声（口コミの件数）: 元 \d+ 件 → 新 (\d+)', vR)
print(f'  口コミの合計（A と R1 後の B）: 読んだ {readA + nB}（{readA}+{nB}）・符号 {codeA + cB}（{codeA}+{cB}）')
for sc, lab in [('uiref-reread-R1-count.py', 'R1'), ('uiref-reread-R2-count.py', 'R2'), ('uiref-reread-R3-count.py', 'R3')]:
    o = run(['python3', '-I', 'boki2/docs/analysis/' + sc])
    keys = {'R1': r'計 (\d+) 行', 'R2': r'事実の行の合計 (\d+)', 'R3': r'合計 (\d+)'}
    print(f'  {lab} の事実の表の行: {num(keys[lab], o)}')
def cells(l):
    l = re.sub(r'\[\[[^\]]*\]\]', 'X', l)
    return [c.strip() for c in l.split('|')[1:-1]]
targets = []
sec = None
for l in read(os.path.join(HERE, 'uiref-reread-R1.md')).split('\n'):
    mm = re.match(r'^### (3\.\d+) ', l)
    if mm: sec = mm.group(1); continue
    if l.startswith('## 4'): sec = None
    if sec and re.match(r'^\| \d+ \|', l):
        c = cells(l); muki = c[4] if sec == '3.0' else c[3]
        if '反する' in muki: targets.append('R1-%s#%s' % (sec, c[0]))
sec = None; k = 0
for l in read(os.path.join(HERE, 'uiref-reread-R2.md')).split('\n'):
    mm = re.match(r'^### (2\.\d+) ', l)
    if mm: sec = mm.group(1); k = 0; continue
    if l.startswith('## 3'): sec = None
    if sec and sec not in ('2.13', '2.14') and l.startswith('| u'):
        c = cells(l); k += 1
        if c[3].startswith('反する'): targets.append('R2-%s-%d' % (sec, k))
for l in read(os.path.join(HERE, 'uiref-reread-R3.md')).split('\n'):
    mm = re.match(r'^\| (R3-[A-Z]\d+) \|', l)
    if mm and re.match(r'(反する|悪い面|訂正)', cells(l)[3]): targets.append(mm.group(1))
cnt = Counter(t[:2] for t in targets)
print(f'  反映の対象: R1 {cnt["R1"]}・R2 {cnt["R2"]}・R3 {cnt["R3"]}・計 {len(targets)}')
chap = {}; cur = None
for l in R.split('\n'):
    mm = re.match(r'^## (\d+)\. ', l)
    if mm: cur = int(mm.group(1))
    elif l.startswith('## '): cur = None
    if cur is not None: chap.setdefault(cur, []).append(l)
table = {}
for l in chap.get(16, []):
    mm = re.match(r'^\| (R[123]-[^ |]+) \| [^|]* \| ([^|]*) \|', l)
    if mm: table[mm.group(1)] = mm.group(2).strip()
miss = []; only9 = []; diff = []; per = Counter()
for t in targets:
    rx = re.compile(re.escape(t) + r'(?!\d)')
    where = [n for n in sorted(chap) if n not in (15, 16) and any(rx.search(x) for x in chap[n])]
    for n in where: per[n] += 1
    if not where and not re.search('入れない', table.get(t, '')): miss.append(t)
    if where == [9]: only9.append(t)
    want = '・'.join('%d章' % n for n in where)
    if t not in table: diff.append((t, '反映表に行がない'))
    elif where and table[t] != want: diff.append((t, '表:' + table[t] + ' 本文:' + want))
print('  漏れ（本文のどの章にもなく、入れない理由もない）:', len(miss), miss)
print('  9章だけに入った:', len(only9), only9)
print('  反映表と本文の食い違い:', len(diff), diff[:10])
print('  章ごとの入った数（1行が複数の章に入る）:', dict(sorted(per.items())))
j = [l for l in chap.get(15, []) if re.match(r'^\| (直す点|傷)\d+', l)]
print('  判定への対応表の行:', len(j))
sys.exit(1 if (nr or bad or miss or diff) else 0)
