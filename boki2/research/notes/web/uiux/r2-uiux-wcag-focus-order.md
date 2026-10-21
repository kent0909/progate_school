---
src: web
coll: uiux
doc: r2-uiux-wcag-focus-order
file: r2-uiux-wcag-focus-order.html
sha256: d5f8571e397b91e54c58dc6a00eec27c4817305f84107f2252ef98be991489b5
read: partial
pages: 基準本文と趣旨の節
anchors: [focus in an order that preserves meaning and operability, navigation sequences affect meaning or operation, consistent mental model, one row at a time or one column at a time, the order that components appear in the content stream, a sighted keyboard user interacts with the visual presentation]
---
WCAG 2.2 の 2.4.3「フォーカス順序」の解説（A）。
- 順番に動く操作が意味や操作に影響するとき、意味と操作性を保つ順序でフォーカスが動くこと。
- 表では行ごとでも列ごとでも、論理的ならどちらも合格。スクリプトや tabindex を使わなければ、文書内の出現順が順序になる。
- 読み上げの順（読む順序）と見た目の順がずれると、読み上げ利用者と目で見るキーボード利用者のどちらかが迷う。作り手は両方を考える。矢印キーでの木構造の移動は、この基準が扱う順次移動とは別。
評価への使い方：Tab で動かしたとき、上から下・左から右の流れか。説明文の後に答えのボタン、確認の後に次へ、の順か。画面の外に隠れた部品に飛ばないか。
