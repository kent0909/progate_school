#!/usr/bin/env python3
# BIZ-REPLAY.md が出典として引く資料を種類ごとに数える（版0.2：判定書 S1 に従い PDG と Die Gute Fabrik を作り手の話から外した）（資料の内訳の数はすべてここから。QUALITY 2.2・6.2-2）
# 使い方：python3 -I boki2/docs/analysis/replay-sources-count.py
import re, os, collections
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
s = open(os.path.join(ROOT, 'BIZ-REPLAY.md'), encoding='utf8').read()
docs = []
for m in re.finditer(r'\[\[([\w-]+):([\w-]+):([^\]\s|]+)(?:\|「[^」]+」)?\]\]', s):
    if m.group(1) == 'src' and m.group(3) == 'doc':
        continue
    k = m.group(3)
    if k not in docs:
        docs.append(k)
TYPE = [  # （種類, 資料の doc の正規表現）。上から順に当てる
    ('作り手の話（一次）', r'^(r6-rp-tomsguide-hades|r6-rp-inven-hades|r6-rp-gd-hades-devprocess|r6-rp-gd-igf-|r6-rp-rogueliker-balatro|r6-rp-deepnight-deadcells|r4-sim-gd-intothebreach|r4-sim-mcv-ingold-replay|designer-papersplease-gd2014|r5-fv-greenheart-onemonth|r5-fv-sixthaxis-twopoint|r2-designer-mg-about)'),
    ('作り手の話（二次の報告）', r'^(r6-rp-gd-balatro-signposting|r6-rp-gamespark-ftl|r6-rp-twistedvoxel-nier-budget)$'),
    ('研究（周回・遊ぶ動機）', r'^(r6-rp-obrien2019-enjoyagain|r6-rp-gamito2021-pathnottaken|r6-rp-digra-storygameness-pdf|r6-rp-digra-repeatedpleasures-pdf|ryan2006-games-sdt)$'),
    ('研究（学習）', r'^(r6-rp-karpicke|r6-rp-bahrick|r6-rp-cepeda|theory-spacing-cepeda2008|mawson2025|r6-rp-latimier|r6-rp-higham|clark2016|grosse2015)'),
    ('利用者の声の集まり', r'^(r6-rp-applion-|r5-fv-applion-)'),
    ('反対の論評', r'^(r6-rp-gpb-hades-stop|r6-rp-superjump-nier-notreplayable)$'),
    ('論考・評者・遊んだ側の文章（作り手の自作の話でない）', r'^(r4-sim-gd-pdg|r6-rp-gutefabrik-spelunky|designer-recettear-gd2010)$'),
    ('教材・事例（運営者の説明）', r'^(capsim-capstone|accountant-otaru-mg)$'),
    ('百科事典（二次）', r'^(r6-rp-wiki-|r3-fable-wiki-|r4-sim-wiki-)'),
]
by = collections.OrderedDict((t, []) for t, _ in TYPE)
other = []
for d in docs:
    for t, rx in TYPE:
        if re.search(rx, d):
            by[t].append(d)
            break
    else:
        other.append(d)
n = len(docs)
print('引いている資料：%d 本（種類 %d）' % (n, sum(1 for v in by.values() if v)))
print('| 種類 | 本数 | 割合 | 資料 |')
print('|---|---|---|---|')
for t, v in by.items():
    print('| %s | %d | %.0f%% | %s |' % (t, len(v), 100.0 * len(v) / n if n else 0, '、'.join(v)))
if other:
    print('種類の決まっていない資料：', other)
print('合計の検算：', ' + '.join(str(len(v)) for v in by.values()), '=', sum(len(v) for v in by.values()), '（' + str(n) + '）')
