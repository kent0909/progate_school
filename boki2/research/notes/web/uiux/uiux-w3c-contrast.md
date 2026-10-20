---
src: web
coll: uiux
doc: uiux-w3c-contrast
file: uiux-w3c-contrast.html
sha256: a06d8a7dad2b3c9cadf1d93b1a5372d58adbab65be51e4c4680124d4e47c9999
read: full
anchors: ["Achromatic luminance contrast sensitivity", "ss criterion is to provide enough contrast", "olor deficiencies, or the loss of contrast", "color is specified when a background color", "with visual display terminals", "contrast ratio of at least 4.5:1", "18 point text or 14 point bold text", "Some people cannot read faint text", "Logotypes", "Incidental"]
---
W3C の WCAG 2.2 の達成基準 1.4.3『コントラスト（最小限）』（AA）の解説。文字と背景の明るさの比が 4.5:1 以上。大きな文字（18pt以上、または太字14pt以上）は 3:1 でよい。例外は、操作できない部品の文字、純粋な飾り、ロゴ。

自分の言葉で。色相ではなく明るさの差で測る（色覚の違いがあっても読みやすさに影響しにくいため）。大きく太い文字は低いコントラストでも読みやすいので基準が緩い。薄い灰色の補足文字や、色付き背景の上の白文字は落ちやすい。

評価への使い方。補足文・注釈・無効状態のボタン以外の小さい文字を中心に、文字色と背景色を取り出して比を計算し、4.5:1 に満たない所を数える。ダークモードがあるなら両方で測る。『無効な部品は対象外』の例外は、選べないのに読んでほしい説明文には当てはまらない点に注意。
