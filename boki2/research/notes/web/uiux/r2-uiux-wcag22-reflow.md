---
src: web
coll: uiux
doc: r2-uiux-wcag22-reflow
file: r2-uiux-wcag22-reflow.html
sha256: bc0b7f0afa54f9f3817026aa3e070251174ccf6db1244c927a1e83e9819a6183
read: partial
anchors: [without requiring scrolling in two dimensions, 320 CSS pixels, 256 CSS pixels, 1280 CSS pixels wide at 400% zoom, data tables (not individual cells), lose their place]
---
WCAG 2.2 の 1.4.10「リフロー」の解説（AA）。
- 画面を400%まで拡大しても（幅320px相当）、縦にスクロールするだけで読めて、横にも動かさなくてよいこと。例外は、地図・図・表・ゲームなど、二次元の配置が意味の一部であるもの。
- 横にも縦にも動かすと「行を見失い」、体力も頭も余計に使う、というのが理由。
評価への使い方
- zoom(200) と、さらに拡大した状態で、横スクロールが出ないか／ボタンや文が画面の外に切れないか。精算表のような表は例外になりうるが、その中の1マスの文章は例外にならない点に注意。
- ゲームだから例外、で済ませず、説明文・ボタン・メニューは折り返すべきと考える。
