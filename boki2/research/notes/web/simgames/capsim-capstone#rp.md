---
src: web
coll: simgames
doc: capsim-capstone#rp
file: capsim-capstone.html
sha256: eb2d677073af734e7e591e91208e0cc805ec4d6c5c8acc47c26533a71ae2184e
read: full
anchors: ["Run an entire company, round after round", "a map that never stops moving", "obsolete in three rounds", "Any of them can win", "Capacity takes a year to arrive", "by round six a team decides in an hour", "each student runs the same simulation again on their own", "if five teams follow the same advice the sixth one wins", "Triple-Bottom-Line mode"]
---
## 何の資料か
Capsim（経営シミュの教材の会社）の Capstone の製品ページ。作り手（売り手）の説明。r2 の別ノートがあるが、BIZ-REPLAY のために周回と競争の観点で全文を読み直した（DESIGN-ROUND2-audit 5章 F9 の確かめ）。

## 読み取れること（自分の言葉で）
- チームで会社を回し、最大8回（練習は別に最大4回）。1回が会社の1年。ゼミでは1回60〜150分、授業では1週間に1回。
- 市場は5つの区分の地図で、各区分の理想の位置が**毎年小さく速い方へ動く**。今ちょうどよい製品も、位置を直さなければ3回で古くなる。生産能力は届くのに1年かかる。
- 6つの基本戦略のどれでも勝てる。どれが勝つかは、同時に選ぶ他のチームに対する実行で決まる（固定の最適がない）。
- 最初の数回が一番時間がかかり、**6回目にはチームが1時間で決める**（習熟で1回の時間が縮む）。
- チームの点では個人の学びが測れないので、Comp-XM では**各学生が同じシミュレーションを一人でもう一度遊び**、取締役会の問いに答える（4〜6時間）。遊び直しを測定に使う。
- AI を使ってよいかの問いに：各チームの位置は自分の積み重ねた判断と他チームが動かす市場の産物なので、調べて済む一般の答えがない。5チームが同じ助言に従えば6チーム目が勝つ、と答える。
- 事例の追加の単元は、走っているゲームに途中から脅威や機会を落とす。教員は1回ごとに一つ足すことが多い。

## 周回の設計への含み
1. 「答えを動かす変種」の実例：理想の位置が毎年動き、他のチームが市場を動かすので、前の回の正解がそのまま通らない。本作では相手（ライバル・取引先）が動くことにあたる【推論】。
2. 習熟で1回が速くなる（6回目は1時間）。本作でも周を重ねると1周が短くなる前提で、周の長さを見積もれる【推論】。
3. 遊び直しを「測る」場に使う（Comp-XM）。本作の最終周を検定の模擬として一人で通す設計の先例。
