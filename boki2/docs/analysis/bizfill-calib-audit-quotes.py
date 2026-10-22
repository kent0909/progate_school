#!/usr/bin/env python3
# 事実の判定役（BIZ-FILL-CALIB の判定）：報告の出典の語句44件（書式の例 [[src:coll:doc]] を除く）を全件、
# ①原文（research/raw を文字にしたもの、空白を詰めて）に出るか、②その前後が主張を支えるか（判定役が前後を読んで付けた判定）を表にする。
# 原文の文字：PDF は pdftotext -layout、表計算は openpyxl（tools/sheet-text.py と同じ）、CSV は cp932、HTML はタグを外す。
# 使い方: python3 -I boki2/docs/analysis/bizfill-calib-audit-quotes.py > boki2/docs/analysis/bizfill-calib-audit-quotes.out.md
import os, re, glob, subprocess, html, io, zipfile
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
RAW = os.path.join(ROOT, 'research', 'raw')
NOTES = os.path.join(ROOT, 'research', 'notes')
def text_of(path):
    b = open(path, 'rb').read()
    if b[:4] == b'%PDF':
        return subprocess.run(['pdftotext', '-layout', path, '-'], capture_output=True, text=True).stdout
    if b[:2] == b'PK':
        return subprocess.run(['python3', '-I', os.path.join(ROOT, 'tools', 'sheet-text.py'), path], capture_output=True, text=True).stdout
    for enc in ('utf-8', 'cp932', 'euc-jp'):
        try: s = b.decode(enc); break
        except UnicodeDecodeError: continue
    s = re.sub(r'(?s)<(script|style).*?</\1>', '', s); s = re.sub(r'<[^>]+>', ' ', s)
    return html.unescape(s)
def raw_for(src, coll, doc):
    n = os.path.join(NOTES, src, coll, doc + '.md')
    f = re.search(r'^file:\s*(.+)$', open(n, encoding='utf8').read(), re.M).group(1).strip()
    c = glob.glob(os.path.join(RAW, src, coll, f)) or glob.glob(os.path.join(RAW, '**', f), recursive=True)
    return c[0]
def norm(s): return re.sub(r'\s+', '', s)
# 判定役の判定（番号は報告の中の出現順）。支える／弱い／支えない と理由
J = {
 1: ('弱い', '中華そばの行の見出しと最初の3日の値だけ。曜日の倍率は計算の値（計算はスクリプトを指すべき）'),
 2: ('弱い', '同上（8月）'),
 3: ('支える', 'FAQ の題名。主張は「日別の表の所在」なので可'),
 4: ('弱い', '語は単身世帯の分類の説明の箇所。主張（勤め人の昼食が品目に乗らない）は【推論】と書かれているが、語句が支えるのは分類名の存在だけ'),
 5: ('支える', '2021年度の中華料理店の営業利益率 平均・黒字企業・中央値'),
 6: ('弱い', '1〜4人の −24.8±20.8 と 5〜9人の平均 −22.4。同じ行の5〜9人の標準偏差33.1は「規模でばらつきが縮む形はコロナの年も同じ」と合わない'),
 7: ('支える', '2023年度の中華料理店の営業利益率'),
 8: ('弱い', '2025年度の表の見出し（社数）だけ。−1.0・+0.3・7.6 などの値の箇所ではない'),
 9: ('支える', '2012年のラーメン店16,960'),
 10: ('支える', '2021年の76B 40,852'),
 11: ('支える', '立地環境特性編のロードサイド型 1,618・16,995（売上は同じ行の次の値）'),
 12: ('支える', '2016年のラーメン店18,041'),
 13: ('弱い', '行の見出し（品目名）だけ。81市の分布は計算の値'),
 14: ('支える', '主張は「調査の条件」'),
 15: ('支える', '丸源のロイヤルティ30店目以降3.40%'),
 16: ('支える', '幸楽苑の加盟金300万円'),
 17: ('支える', '幸楽苑のロイヤリティ4.5%・5%'),
 18: ('弱い', '店名だけ。主張の席数101・103は同じ行の後ろにある'),
 19: ('弱い', '店名と投資額。主張は席数53〜60'),
 20: ('弱い', '投資額の数字だけ。主張は席数50〜52と「駅前の中華食堂」。この3店（鹿沼栄町・ファッションクルーズひたちなか・つくば東）は駅前の店ではない'),
 21: ('支える', '山岡家の長期借入金'),
 22: ('支える', 'ギフトの借入金の合計'),
 23: ('支える', '日高屋は借入金なし'),
 24: ('支える', '力の源の長期借入金'),
 25: ('支える', 'ギフト2019年の新店の投資予定額（27店舗等）'),
 26: ('支える', '幸楽苑2020年3月期 いきなり！ステーキ16店'),
 27: ('支える', '2021年3月期のスクラップ12店'),
 28: ('支える', '2023年3月期の餃子バル'),
 29: ('支える', '2025年3月期 焼肉ライク1店'),
 30: ('支える', 'ギフトの直営10店目（2014年3月）'),
 31: ('支える', 'ギフト2020年10月期の売上'),
 32: ('支える', '食中毒 全国1,172件・24,727人'),
 33: ('支える', '飲食店658件'),
 34: ('支える', '令和6年1,037件・14,229人'),
 35: ('支える', '外食は軽減税率の対象に含まれない'),
 36: ('支える', '1%の対象は今の8%の飲食料品と同じ範囲'),
 37: ('支える', '力の源：梅雨は閑散期'),
 38: ('支える', '力の源：繁忙期の台風・酷暑・厳寒は売上を下げる'),
 39: ('支える', 'ギフト：猛暑日などで来店頻度が減る（気候のリスクの表）'),
 40: ('支える', 'ギフト：平均気温の上昇で来店頻度が減る（長期の気候の筋書きの表である点は報告の SUMMER 行に書かれていない）'),
 41: ('支える', '企業会計基準第29号 第53項'),
 42: ('弱い', '語だけ。原文は日付の形を検査するだけで、marketPoints が「市場の大きさ」だとは書いていない'),
 43: ('支える', '要旨の「かなり非弾力的」（「米国の1店」の国は要旨に書かれていない）'),
 44: ('支える', 'TSR 2026年上半期の負債総額'),
}
L = open(os.path.join(ROOT, 'docs', 'BIZ-FILL-CALIB.md'), encoding='utf8').read().split('\n')
cites = []
for i, l in enumerate(L, 1):
    for m in re.finditer(r'\[\[([^\]|]+)\|「(.*?)」\]\]', l):
        if m.group(1) == 'src:coll:doc': continue
        cites.append((i, m.group(1), m.group(2)))
cache = {}
print('| # | 行 | 文書 | 語句 | 原文に出るか | 主張を支えるか | 理由 |'); print('|---|---|---|---|---|---|---|')
cnt = {}
for n, (i, c, q) in enumerate(cites, 1):
    src, coll, doc = c.split(':')
    p = raw_for(src, coll, doc)
    if p not in cache: cache[p] = norm(text_of(p))
    ok = '出る' if norm(q) in cache[p] else '出ない'
    j, why = J[n]; cnt[j] = cnt.get(j, 0) + 1
    print(f'| {n} | {i} | {doc} | 「{q}」 | {ok} | {j} | {why} |')
t = sum(cnt.values())
print(f'\n計 {t}件：' + '・'.join(f'{k} {v}' for k, v in cnt.items()) + f'。支える割合 {cnt.get("支える", 0)}/{t} = {cnt.get("支える", 0) / t * 100:.1f}%（目安90%）')
print(f'文書の数 {len(set(c for _, c, _ in cites))}')
