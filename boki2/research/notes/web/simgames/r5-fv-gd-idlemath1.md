---
src: web
coll: simgames
doc: r5-fv-gd-idlemath1
file: r5-fv-gd-idlemath1.html
sha256: 976d8cfb82a69a52874750fe5faf85b37002e512ba92b19c5bdea2c74b1b999a
read: partial
pages: 記事本文（用語・成長と費用の式・転生・複数の生成器の釣り合い・まとめ買いの式）。数式の画像と表の数値の一部は読めていない
anchors: ["What do the cost and production formulas look like", "Primary Exchange Currency", "a seesaw between production rates and costs", "the newest generator is nearly always dominant once it can be purchased", "different generators take priority", "calculate the cost of bulk-buying generators"]
---
Game Developer に転載された Anthony Pecorella（AdVenture Capitalist のモバイル版の主任プロデューサー、Kongregate）の「放置ゲームの数学 第1部」。作り手の一次の資料（講演の内容を文章にしたもの）。

要点（自分の言葉で）：
- 用語：主の通貨（お金）、生成器（お金を生むもの）、交換の通貨（生成器が別の通貨を作り、それをお金に替える。替える率で伸びを調整できる）、倍率、転生（ほぼ全部を初期化し、次を速くする倍率を得る）。
- 放置ゲームは**生産と費用のシーソー**。序盤は生産が費用を上回るが、やがて費用が届かなくなる。費用は指数で伸び、生産は一次・多項式で伸びるように作る（例：レモネード屋の生成器は1つ買うごとに費用が1.07倍）。指数は必ずいつか多項式に追いつく。
- 所有数25・50で生産が2倍になる節目があり、その直前で購入が集中する。
- 複数の生成器があると、普通は**新しい生成器がいつも圧倒的**になり、古い物は無関係になって判断が消える。節目の倍率の値を生成器ごとに変えると、時期ごとに優先される生成器が入れ替わり、プレイヤーが優先順位を見つける楽しみが生まれる。

ピヨ商店への示唆：経営シムの「数字が増える気持ちよさ」は、指数の費用と節目の倍率の組み合わせで作られている。ピヨ商店では会計の金額は現実の桁に保つ（PEDAGOGY）ので、指数の爆発は使わない。代わりに**節目**（席数・店数・常連数が一定に達すると効率が上がる段）と、**時期ごとに効く手が入れ替わる**設計（屋台期は値段、1号店期は常連、多店舗期は仕入の集約、工場期は稼働率）を写す。
