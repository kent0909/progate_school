---
src: web
coll: uiux
doc: r11-ju-nng-animation-purpose
file: r11-ju-nng-animation-purpose_html.html
sha256: 55765eea49ab25a58aa68c8160520699be618826f5715baf66e9aa96c0853f0b
read: full
anchors: ["Animation in UX must be unobtrusive, brief, and subtle", "responsible for detecting motion", "it’s these down-time animations that often frustrate participants in usability testing", "a short animation can ensure that users see the feedback", "people may not notice the shopping-cart–badge update", "previewing the new location of an item when using drag-and-drop to reorder a list", "the number of simultaneous animations is overwhelming", "A short bounce animation is a signifier that"]
---
Nielsen Norman Group, Page Laubheimerの記事（UX における動きの役割、2020-01-12）。全文を読んだ。

要点：
- 動きは周辺視野の桿体細胞が拾うので、意味があってもなくても注意を奪う。だから短く・控えめに・手ごたえのために使う
- 時間つなぎの動き（待たせる演出）は利用者テストで不満の元。楽しませるための動きはすぐに飽きられる
- 役に立つ使い方：①操作が受け付けられた手ごたえ（変化の見落とし＝change blindness を防ぐ。カートのバッジが小さく遠いと気づかれない）②状態の切り替わり（鉛筆→保存の変形）③空間の比喩（ズーム・スライドで階層と前後）④しるし（下から出たカードは下へ払って閉じられる、短いバウンドで「横に払える」を教える）
- 同時に多くの動きを出すと、どれも注意を引けなくなる（Hipmunk の例）
- 注意を奪う動き（点滅する売り切れカウントダウン）はダークパターン

このゲームへの含意：
- 「口座の数字がどこで変わったか」は change blindness の問題そのもの。札が列に入った瞬間に、変わった行・残高だけを短く動かして目を運ぶ。遠い場所（帳簿の端）が変わるなら、そこへ線や数字の飛びで目を連れていく
- 1回の操作で動かすものを2〜3つに絞る（札の移動・列の受け取り・数字の増加）。同時に全部を揺らさない
- 「払える」ことを教えるしるし：最初の1枚でピヨが手本で払う＋札がわずかにバウンドする（Car2Go の例の型）
- 読ませる文を動かし続けない根拠：注意を奪う動きは読みを妨げる
