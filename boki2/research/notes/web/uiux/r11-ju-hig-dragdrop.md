---
src: web
coll: uiux
doc: r11-ju-hig-dragdrop
file: r11-ju-hig-dragdrop_json.json
sha256: 58e6bc8e7043ec76fa0264046712c5bb385cd1ff6b67222a7c3ad68b2671cf6c
read: full
anchors: ["Offer alternative ways to accomplish drag-and-drop actions", "Prefer letting people undo a drag-and-drop operation", "Display a drag image as soon as people drag a selection about three points", "Show people whether a destination can accept dragged content", "scale up and fade out to give the impression of the item evaporating", "Scroll the contents of a destination when necessary", "Consider displaying a badge during multi-item drag operations", "let people select and drag content with a single motion"]
---
Apple Human Interface Guidelines「Drag and drop」（developer.apple.com の設計指針。画面は JS で描くので、本文の JSON を取った）。全文を読んだ。

要点（自分の言葉で）：
- 代わりの操作を必ず用意する。ドラッグが不便・不可能な人がいるので、同じことをメニューや補助技術からもできるようにする（iOS/iPadOS では accessibility API でドラッグ元と落とし先を名乗る）
- 取り消しを好む。うっかり違う所に落とすことがあるので、元に戻せること。戻せないなら確認を挟む
- 始まりの手ごたえ：約3ポイント動いたらすぐに「ドラッグ中の像」（半透明の複製）を出し、落とすまで出し続ける。像は劇的に変え続けない
- 落とし先の手ごたえ：受け取れる先だけを、札が上にあるあいだだけ強調する（受け取れないなら「不可」の印）。候補が複数あるときは1つずつ分かるように
- 失敗の手ごたえ：無効な先に落としたら、元の場所へ戻る動き、または拡大しながら消える（蒸発）
- 落とし先が長いときは自動スクロール。落としたあとは選択状態を保つ（続けて操作できる）
- 選択とドラッグを1つの動作で始められるのがよい（選んでから一拍置かせない）

このゲームへの含意：
- 札を列へ入れる操作は「押して選ぶ」「キーボード」「読み上げ」の代わりの経路を同時に持つ（WCAG 2.5.7 と同じ向き）
- 置いた札を「つかみ直す」＝取り消しの一種。1枚ずつ戻せることをこの指針は後押しする
- 列が受け取れる状態をハイライトで示し、外に落としたら元の棚へ戻る動きを入れる（蒸発ではなく戻る。札はなくならないので）
- 注意：この指針は macOS/iOS の一般アプリ向け。ゲームの「列に札を入れる」操作は「移動」（同じ画面の中）に当たるので、移動の手ごたえで作る
