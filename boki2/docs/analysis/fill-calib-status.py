#!/usr/bin/env python3
"""対象の一覧（fill-targets-calib.tsv）の全166か所に、補填の結果を付けて fill-results-calib.tsv に書き、数える。
結果は項目ごと（BIZ-FILL-CALIB.md の結果の表と埋まらなかったものの表）。1か所ずつの読みは報告の表を見る。
  埋まった＝資料で値が置けた（区分が上がる・引き継ぎ待ちが解ける）／一部＝一部の値・条件つきで置けた／否定・修正＝元の値と違う資料が出た（埋まったに数える）／
  埋まらず＝探したが資料が無い（理由は報告）／引き継ぎ＝並行の担当の範囲／計算＝(a) からの按分・割り算で資料を足す種類ではない／設計＝設計の推論／説明＝印の説明
使い方: python3 -I boki2/docs/analysis/fill-calib-status.py
"""
import os, collections
D = os.path.join(os.path.dirname(os.path.abspath(__file__)))
R = {
 'W1': ('埋まった', '修正：曜日の倍率 月〜木0.65・土1.61（家計の中華そば）、(c)→(b)'),
 'JFC': ('埋まった', '否定・修正：2021・2023年度の表を WARP で取得。衝撃の年は中央値 −12%台'),
 'FOODPOI': ('埋まった', '修正：全国の食中毒（2023〜2025年）'),
 'TAX': ('埋まった', '外食は引下げの対象外（店内10%・持ち帰り1%）'),
 'SUMMER': ('一部', '修正：猛暑・酷暑で客が減るという2社の記述（向きだけ、量なし）'),
 'PRICE': ('埋まった', '支持：都市別の価格の四分位の幅1.18倍（並行の担当の原文を数え直し）'),
 'RENT': ('一部', '名古屋・大阪の中心は坪1.6万〜1.9万円。地方都市・郊外・過疎は埋まらず'),
 'CENSUS': ('埋まった', '2012→2016→2021年の事業所数と立地の型ごとの売上'),
 'FC': ('埋まった', '丸源ラーメン・幸楽苑の有報の FC 契約の要旨（2ブランドの値）、(c)→(a)'),
 'KOURAKU': ('埋まった', '他業態 38店（2020/3）→26→29→2（2025/3）'),
 'GIFT': ('埋まった', '2014〜2020年の売上・利益・店数の節目'),
 'DEBT': ('一部', '上場6社の借入金÷月商 0〜1.94か月。個人店の型は埋まらず'),
 'SEAT': ('一部', 'チェーンの新店の客席数 50〜103席。小さな店は埋まらず'),
 'K28': ('埋まった', '企業会計基準第29号 第53項（返金負債）'),
 'DEMANDSRC': ('一部', 'GDT は市場の大きさがゲーム機ごとの曲線のデータ（公式 API）。BA・カイロソフト・Two Point は埋まらず'),
 'COEF': ('一部', '1杯の材料・1店あたり人口・立地の売上は資料で置ける。外の選択 V0・客層の係数は埋まらず'),
 'P1': ('埋まらず', '1軒の弾力性の推定なし。反対の向きの研究1本（品の値付けは非弾力的）'),
 'TOSAN': ('埋まらず', '5件目の個別の事例なし（2026年上半期の統計は足した）'),
 'EXIT': ('一部', '幸楽苑の他業態は6年で38店→2店（1社）。業界の率は埋まらず'),
 'PLANT': ('埋まらず', '工場の稼働率・投資額の数字なし'),
 'EVENT': ('埋まらず', '品質不良・目減り・故障・保険の頻度の統計なし（飲食店.COM の調査は403）'),
 'BUILD': ('埋まらず', '工事の遅れの頻度の統計なし'),
 'DEC': ('埋まらず', '分岐の重みの確率を書いた資料なし'),
 'MISC': ('埋まらず', '予報の効き・パン屋の家賃・レモネードの原価・ラーメンのジャンル別の店数の資料なし'),
 'P2': ('埋まらず', '値上げの波・1,000円の壁の係数の資料なし（JF の30年は版0.2の T2 のまま）'),
 'CNT': ('一部', '(c) 43→41（35.7%）。30%に7行足りない'),
 'LOGIC': ('埋まらず', '論証の表の行は元の報告の書き手の仕事（この報告は反対の事実を足す側：SUMMER・EXIT・P1）'),
 'S1': ('引き継ぎ', 'BIZ-FILL-RAMEN（季節の4分割）'),
 'G3': ('引き継ぎ', 'BIZ-FILL-RAMEN（地域の採算）。入力の PRICE・RENT・CENSUS を渡す'),
 'MKT': ('引き継ぎ', 'BIZ-MKT-RAMEN の補填（BIZ-FILL-RAMEN）'),
 'RAMEN': ('引き継ぎ', 'BIZ-FILL-RAMEN（限定麺・ブーム・監修料）'),
 'FCW': ('引き継ぎ', 'BIZ-GROWTH（FC・買収・通販の重み）。FC の条件（FC 行）は渡す'),
 'CALC': ('計算', '(a) の値からの按分・割り算で、式は元の報告にある'),
 'TYPE': ('一部', '型ごとの損益：借入（DEBT）と出店の投資額を足した。個人の安売り店は埋まらず'),
 'SDGAME': ('埋まらず', '他作品の終盤の対策・長く遊ばれる理由の一次資料は探していない（やっていないこと）'),
 'SDDESIGN': ('設計', '案の性質の読み。資料でなく検算・試遊で確かめる種類'),
 'META': ('説明', '印の説明'),
 'DONE': ('説明', 'HANDOFF の更新（元の報告の書き手の範囲）'),
}
rows = [l.rstrip('\n').split('\t') for l in open(os.path.join(D, 'fill-targets-calib.tsv'), encoding='utf8') if not l.startswith('#')]
head, body = rows[0], rows[1:]
with open(os.path.join(D, 'fill-results-calib.tsv'), 'w', encoding='utf8') as w:
    w.write('\t'.join(head + ['結果', '結果の中身']) + '\n')
    for r in body:
        res, txt = R[r[6]]; w.write('\t'.join(r + [res, txt]) + '\n')
c = collections.Counter(R[r[6]][0] for r in body)
print('全', len(body), 'か所の結果:', dict(c))
for f in ('BIZ-CALIB.md', 'BIZ-SIMDESIGN.md', 'audit/BIZ-CALIB-v02-audit.md'):
    print(f, dict(collections.Counter(R[r[6]][0] for r in body if r[1] == f)))
cc = [r for r in body if r[3] == '(c)']
print('(c) の43行:', dict(collections.Counter(R[r[6]][0] for r in cc)))
mm = [r for r in body if r[3] == '未達']
print('未達の行:', dict(collections.Counter(R[r[6]][0] for r in mm)))
