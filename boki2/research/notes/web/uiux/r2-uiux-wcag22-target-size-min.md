---
src: web
coll: uiux
doc: r2-uiux-wcag22-target-size-min
file: r2-uiux-wcag22-target-size-min.html
sha256: 361694575d2a4ca5834de57dbc44b24c27ecc67956625703a140b9f1d79c62d4
read: partial
pages: 基準本文と趣旨の節（技法・事例の節は拾い読み）
anchors: [24 by 24 CSS pixels, Some people with physical impairments cannot click small buttons, Undersized targets, sufficient spacing around them, Level AA, pointer inputs]
---
WCAG 2.2 の達成基準 2.5.8「ターゲットのサイズ（最小）」の解説（レベルAA）。
- 押す対象は最低で24×24 CSSピクセル。小さい場合は、周りに24pxの円を置いたとき他の対象の円と重ならない間隔があればよい、という例外つき。文中のリンクなど、行の高さで決まるものや、ブラウザ任せの部品は例外。
- 目的は、手が震える・指が太い・小さな画面で押し間違えやすい人が確実に押せること。
評価への使い方
- スマホ（390×844 など）とiPadでボタンの実寸を測る（inspect）。最小値の24pxは「最低ライン」であり、親指で押す学習アプリの実用上の目安は44〜48pxという別の指針も併せて参照する。
- 選択肢のボタンが縦に詰まりすぎていないか（間隔）。仕訳の金額や科目を選ぶ小さなボタンが並ぶ画面は特に点検する。
