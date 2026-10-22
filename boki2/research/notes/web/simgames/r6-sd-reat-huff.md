---
src: web
coll: simgames
doc: r6-sd-reat-huff
file: r6-sd-reat-huff.html
sha256: 80ca13371fc8a23eabb7b50dc3135dfedf34062787e674754e2a84dc3091a0b6
read: full
anchors: [exponential weighting of distance, probabilistic market area models, equilibrium solution, Defining and Estimating a Trading Area, Rock Creek, Oak Hammock]
---
R の統計の拡張 REAT（Thomas Wieland）の関数 huff の説明書（CRAN）。実装の側から見た Huff の模型の説明。

要点（自分の言葉で）：
- Huff の模型は、小売とサービスで最もよく使われる空間の相互作用の模型で、「確率で決まる商圏」の族に入る。客の行き先は決定論ではなく確率で、出てくる確率は各出発地での各店のシェア（0〜1、和が1）と読める。
- 効用は魅力度と移動の費用の2つの変数で、それぞれをべき乗で重みづける。既定は魅力度の指数1、距離の指数−2。この実装では、べき乗のほかに指数関数・ロジスティックの重みも選べる。
- 出発地の購買力（人口など）を渡すと、各店の売上の合計まで出す。例は2つの町（人口の購買力が違う）と既存店・新店（売場の広さが2倍）の取り合い。
- 参照に Huff の1962・1963・1964年の3本と小売の教科書2冊。

分析：ゲームの「エリアの潜在客 P_a × 店のシェア」は、この「出発地の購買力×Huff の確率」と同じ計算になる。距離の重みの既定が−2（距離が2倍で魅力が4分の1）というのは、係数を置くときの最初の目安として使える（ただしこれは実装の既定で、ラーメンの実測ではない）。ロジスティックの距離の重みを選べるのは、「ある距離までは気にしないが、それを越えると急に来なくなる」（歩いて行ける範囲）を表すのに向く。
