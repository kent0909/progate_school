---
src: web
coll: learnsci
doc: r11-ju-yamanaka2024-tap-swipe
file: r11-ju-yamanaka2024-tap-swipe_html.html
sha256: b4910c9d2401321db85f857726f5044805784a211964ac025d06fba31b00b462
read: full
anchors: ["Behavioral Differences between Tap and Swipe", "Shota Yamanaka , Hiroki Usuba, Junichi Sato", "We explored user-performance differences between tap and swipe in two crowdsourced experiments", "Results indicated longer operation times, higher error rates, and significantly shifted touch points for swipe compared to tap", "current target-size guidelines may not apply to swipe-operated targets"]
---
Yamanaka, Usuba, Sato (LY Corporation), CHI 2024 のタップとスワイプの振る舞いの違いの論文。LY Corporation の研究公開ページ（要旨のみ。本文 PDF は ACM で、ここでは取っていない）。要旨を全部読んだ。

要点（要旨から）：
- クラウドソーシングの2つの実験（棒と正方形の標的）で、タップとスワイプの操作を比べた
- スワイプはタップより、操作時間が長く、誤り率が高く、タッチ点が狙いからずれた
- タップ用に作られた標的の大きさの指針は、スワイプで操作する標的には当てはまらないかもしれない

このゲームへの含意：
- 否定側の根拠：札を「スワイプで」列に入れる操作は、タップより遅く・誤りが多く・触る位置がずれる。だからスワイプの標的（札）はタップ用の 44px より大きくし、誤りの扱い（しきい値未満は戻す・確定前に取り消せる）を設計に入れる
- 限界：要旨だけで、数値（誤り率の差の大きさ）と標的の条件は読めていない。設計書では「スワイプのほうが誤りが多い」という向きだけを使う
